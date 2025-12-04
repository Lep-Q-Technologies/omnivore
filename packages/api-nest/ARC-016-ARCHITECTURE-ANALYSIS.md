# ARC-016: Architecture Analysis & Design Decisions

**Date**: November 30, 2025
**Status**: Design Review Complete
**Critical Design Questions Resolved**: 4/4

---

## 🎯 Executive Summary

After thorough analysis of existing subscription architecture and user workflow requirements, we've identified a **unified subscription model** as the optimal approach for newsletter integration. This document captures the critical architectural decisions and their rationale.

---

## 🔍 Critical Questions & Answers

### **Q1: Single Email Address for All Newsletters?**

**ANSWER: YES ✅**

**User receives ONE unique email address** (e.g., `abc123@omnivore.email`) and uses it for **ALL newsletter subscriptions**.

**Differentiation Strategy**: Newsletters are distinguished by **sender email** (FROM field), NOT recipient email (TO field).

```
User Flow:
1. User email: abc123@omnivore.email (FIXED for this user)
2. Subscribe to Substack: abc123@omnivore.email
3. Subscribe to TechCrunch: abc123@omnivore.email  (SAME email!)
4. Subscribe to 100 more: abc123@omnivore.email  (SAME email!)

When email arrives:
- TO: abc123@omnivore.email → Route to User
- FROM: writer@substack.com → Create/lookup Subscription #1
- FROM: daily@techcrunch.com → Create/lookup Subscription #2
```

**Benefits**:

- ✅ **Simple UX**: User memorizes ONE email
- ✅ **Privacy**: Email doesn't leak which newsletters user reads
- ✅ **Portable**: Copy-paste everywhere
- ✅ **Auto-subscription**: System auto-detects new newsletters

---

### **Q2: Existing Subscription Entity/Table?**

**ANSWER: YES ✅ - We have `rss_feed` table (migration 0198)**

**Current State**:

```sql
omnivore.rss_feed (Created in ARC-014A)
- id, user_id, feed_url
- title, description, site_icon
- item_count, last_fetched_at, active
```

**Legacy Discovery**:

```sql
omnivore.subscriptions (Migration 0080 - OLD SYSTEM)
- id, user_id, name, url
- unsubscribe_mail_to, unsubscribe_http_url
- status (ACTIVE, UNSUBSCRIBED, DELETED)
```

The legacy `subscriptions` table was the **original Omnivore newsletter system**. We should learn from it but build a unified modern approach.

---

### **Q3: Unified vs. Separate Subscription Tables?**

**ANSWER: UNIFIED ⭐ (Rename `rss_feed` → `subscription`)**

**Architecture Decision**: **Single `subscription` table** for both RSS and newsletters.

**Why Unified**:

1. ✅ **Conceptual Consistency**: RSS and newsletters are both "subscriptions" (auto-imported content)
2. ✅ **Code Reuse**: One repository, one service, one GraphQL API
3. ✅ **Unified UX**: One "Subscriptions" section in left nav
4. ✅ **Simpler Queries**: No UNION needed for "show all subscriptions"
5. ✅ **Future-Proof**: Easy to add podcasts, YouTube channels, etc.

**Schema Evolution**:

```sql
-- Current (ARC-014A)
rss_feed:
  - feed_url: varchar(2048)  // "https://blog.com/feed.xml"

-- Proposed (ARC-016)
subscription:
  - source_type: varchar(20)      // 'RSS' | 'NEWSLETTER'
  - source_identifier: varchar(2048)
    // RSS: "https://blog.com/feed.xml"
    // Newsletter: "writer@substack.com"
```

**Migration Path**:

```sql
-- 0200.do.unify_subscriptions.sql
ALTER TABLE omnivore.rss_feed RENAME TO subscription;
ALTER TABLE omnivore.subscription ADD COLUMN source_type VARCHAR(20) DEFAULT 'RSS';
ALTER TABLE omnivore.subscription RENAME COLUMN feed_url TO source_identifier;
```

---

### **Q4: How Does Email Alias Generation Work?**

**ANSWER: User-scoped, NOT subscription-scoped ✅**

**Architecture**:

```typescript
User table:
- id: uuid
- email: string            // Login email (you@gmail.com)
- emailAlias: string       // Newsletter receiver (abc123)
  UNIQUE, NOT NULL
  Generated via: nanoid(8) or similar

User sees: "Your Omnivore Email: abc123@omnivore.email"
```

**Email Routing Flow**:

```
1. Email arrives at webhook
   TO: abc123@omnivore.email
   FROM: writer@substack.com
   SUBJECT: "New Post: How to Build Apps"

2. Parse TO field → extract "abc123"
3. Query: SELECT * FROM user WHERE emailAlias = 'abc123'
4. Found user? Route email to them
5. Parse FROM field → "writer@substack.com"
6. Query: SELECT * FROM subscription
          WHERE userId = user.id
          AND sourceType = 'NEWSLETTER'
          AND sourceIdentifier = 'writer@substack.com'
7. Not found? Create subscription automatically
8. Import email content → LibraryItem with subscriptionId link
```

**Collision Safety**:

- nanoid(8) = 208 billion combinations
- Chance of collision in 1 million users: 0.000024%
- Can increase to nanoid(10) if needed (3.76 quadrillion combinations)

**Example Database State**:

```sql
-- user table
id: user-123
email: "you@gmail.com"
emailAlias: "abc123"

-- subscription table (user has 3 newsletters)
id: sub-1, userId: user-123, sourceType: 'NEWSLETTER', sourceIdentifier: 'writer@substack.com', title: "Tim's Newsletter"
id: sub-2, userId: user-123, sourceType: 'NEWSLETTER', sourceIdentifier: 'daily@techcrunch.com', title: "TechCrunch Daily"
id: sub-3, userId: user-123, sourceType: 'RSS', sourceIdentifier: 'https://hn.algolia.com/api/v1/search_by_date?tags=front_page', title: "Hacker News"

-- library_item table (content from all 3 sources)
id: item-1, userId: user-123, subscriptionId: sub-1, title: "Substack Post", contentType: 'NEWSLETTER'
id: item-2, userId: user-123, subscriptionId: sub-2, title: "TechCrunch Article", contentType: 'NEWSLETTER'
id: item-3, userId: user-123, subscriptionId: sub-3, title: "HN Top Story", contentType: 'ARTICLE'
```

---

## 🏗️ Revised Architecture

### Database Schema

**1. Rename & Extend Subscription Table**

```sql
-- Migration 0200: Unify RSS and Newsletter subscriptions
CREATE TABLE omnivore.subscription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES omnivore.user(id) ON DELETE CASCADE,

  -- Subscription source
  source_type VARCHAR(20) NOT NULL DEFAULT 'RSS',
    -- 'RSS' | 'NEWSLETTER' (future: 'PODCAST', 'YOUTUBE')
  source_identifier VARCHAR(2048) NOT NULL,
    -- RSS: feed URL
    -- Newsletter: sender email address

  -- Metadata
  title VARCHAR(512),
  description TEXT,
  site_url VARCHAR(2048),
  site_icon VARCHAR(2048),

  -- Statistics
  item_count INTEGER DEFAULT 0 NOT NULL,
  last_received_at TIMESTAMPTZ,  -- Last item received (RSS or email)

  -- Status
  active BOOLEAN DEFAULT true NOT NULL,

  -- RSS-specific (nullable for newsletters)
  last_fetched_at TIMESTAMPTZ,   -- Last time we polled RSS feed
  last_error TEXT,
  failure_count INTEGER DEFAULT 0 NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT uq_subscription_user_source UNIQUE(user_id, source_type, source_identifier)
);

-- Indexes
CREATE INDEX idx_subscription_user_id ON omnivore.subscription(user_id);
CREATE INDEX idx_subscription_source_type ON omnivore.subscription(source_type);
CREATE INDEX idx_subscription_active ON omnivore.subscription(active);
CREATE INDEX idx_subscription_rss_active
  ON omnivore.subscription(last_fetched_at)
  WHERE active = true AND source_type = 'RSS';
```

**2. Add Email Alias to User**

```sql
-- Migration 0201: Add email alias for newsletter routing
ALTER TABLE omnivore.user
ADD COLUMN email_alias VARCHAR(64) UNIQUE;

-- Generate aliases for existing users
UPDATE omnivore.user
SET email_alias = substring(md5(random()::text) from 1 for 8)
WHERE email_alias IS NULL;

-- Make it required going forward
ALTER TABLE omnivore.user
ALTER COLUMN email_alias SET NOT NULL;

CREATE INDEX idx_user_email_alias ON omnivore.user(email_alias);
```

**3. Update LibraryItem (No Changes Needed!)**

```sql
-- Already exists from migration 0199
omnivore.library_item:
  - subscription_id UUID REFERENCES omnivore.subscription(id)
```

**4. Add ContentType for Newsletters**

```typescript
// Already in library-item.entity.ts
export enum ContentType {
  ARTICLE = 'ARTICLE',
  PDF = 'PDF',
  RSS_FEED = 'RSS_FEED',
  VIDEO = 'VIDEO',
  TWITTER = 'TWITTER',
  NEWSLETTER = 'NEWSLETTER', // Add this!
  UNKNOWN = 'UNKNOWN',
}
```

---

### Entity Design

**SubscriptionEntity** (renamed from RssFeedEntity)

```typescript
export enum SubscriptionSourceType {
  RSS = 'RSS',
  NEWSLETTER = 'NEWSLETTER',
  // Future: PODCAST = 'PODCAST', YOUTUBE = 'YOUTUBE'
}

@Entity({ name: 'subscription', schema: 'omnivore' })
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string

  @Column({
    name: 'source_type',
    type: 'varchar',
    length: 20,
    default: SubscriptionSourceType.RSS,
  })
  sourceType!: SubscriptionSourceType

  @Column({ name: 'source_identifier', type: 'varchar', length: 2048 })
  sourceIdentifier!: string // URL for RSS, email for newsletters

  @Column({ name: 'title', type: 'varchar', length: 512, nullable: true })
  title?: string | null

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string | null

  @Column({ name: 'site_url', type: 'varchar', length: 2048, nullable: true })
  siteUrl?: string | null

  @Column({ name: 'site_icon', type: 'varchar', length: 2048, nullable: true })
  siteIcon?: string | null

  @Column({ name: 'item_count', type: 'integer', default: 0 })
  itemCount!: number

  @Column({ name: 'last_received_at', type: 'timestamptz', nullable: true })
  lastReceivedAt?: Date | null

  @Column({ name: 'active', type: 'boolean', default: true })
  active!: boolean

  // RSS-specific (null for newsletters)
  @Column({ name: 'last_fetched_at', type: 'timestamptz', nullable: true })
  lastFetchedAt?: Date | null

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError?: string | null

  @Column({ name: 'failure_count', type: 'integer', default: 0 })
  failureCount!: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  // Helper methods
  get isRss(): boolean {
    return this.sourceType === SubscriptionSourceType.RSS
  }

  get isNewsletter(): boolean {
    return this.sourceType === SubscriptionSourceType.NEWSLETTER
  }
}
```

**User Entity Update**

```typescript
@Entity({ name: 'user', schema: 'omnivore' })
export class User {
  // ... existing fields ...

  @Column({
    name: 'email_alias',
    type: 'varchar',
    length: 64,
    unique: true,
  })
  emailAlias!: string // e.g., "abc123"

  // Computed property
  get newsletterEmail(): string {
    return `${this.emailAlias}@omnivore.email`
  }
}
```

---

### Service Architecture

**Unified SubscriptionService** (evolved from RssFeedSubscriptionService)

```typescript
@Injectable()
export class SubscriptionService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  /**
   * Subscribe to RSS feed
   */
  async subscribeToRss(
    userId: string,
    feedUrl: string,
  ): Promise<SubscriptionEntity> {
    return this.subscriptionRepository.create({
      userId,
      sourceType: SubscriptionSourceType.RSS,
      sourceIdentifier: feedUrl,
    })
  }

  /**
   * Create/update newsletter subscription
   * Called automatically when email arrives
   */
  async upsertNewsletterSubscription(
    userId: string,
    senderEmail: string,
    metadata?: { title?: string; description?: string },
  ): Promise<SubscriptionEntity> {
    const existing = await this.subscriptionRepository.findBySource(
      userId,
      SubscriptionSourceType.NEWSLETTER,
      senderEmail,
    )

    if (existing) {
      return existing
    }

    return this.subscriptionRepository.create({
      userId,
      sourceType: SubscriptionSourceType.NEWSLETTER,
      sourceIdentifier: senderEmail,
      title: metadata?.title || senderEmail,
      description: metadata?.description,
    })
  }

  /**
   * Get all subscriptions for user (RSS + newsletters)
   */
  async getUserSubscriptions(
    userId: string,
    sourceType?: SubscriptionSourceType,
  ): Promise<SubscriptionEntity[]> {
    return this.subscriptionRepository.findByUser(userId, sourceType)
  }

  /**
   * Unsubscribe (works for both RSS and newsletters)
   */
  async unsubscribe(
    userId: string,
    subscriptionId: string,
    deleteItems: boolean = false,
  ): Promise<void> {
    const subscription = await this.subscriptionRepository.findById(
      subscriptionId,
      userId,
    )

    if (!subscription) {
      throw new NotFoundException('Subscription not found')
    }

    // Mark inactive
    await this.subscriptionRepository.update(subscriptionId, userId, {
      active: false,
    })

    // Optionally delete library items
    if (deleteItems) {
      await this.libraryItemRepository.deleteBySubscription(
        subscriptionId,
        userId,
      )
    }
  }
}
```

---

## 📋 Updated Implementation Plan

### Phase 1: Unify Subscription System (Day 1)

**Tasks**:

1. Create migration 0200: Rename rss_feed → subscription, add source_type
2. Update RssFeedEntity → SubscriptionEntity
3. Update RssFeedRepository → SubscriptionRepository
4. Update RssFeedSubscriptionService → SubscriptionService
5. Update GraphQL types (RssFeed → Subscription)
6. Run migration, verify existing RSS subscriptions work
7. Update tests

**Deliverables**:

- [ ] `subscription` table exists with `source_type` column
- [ ] All existing RSS feeds migrated successfully
- [ ] RSS functionality still works (backward compatible)
- [ ] Tests pass

---

### Phase 2: Add Email Alias to Users (Day 1)

**Tasks**:

1. Create migration 0201: Add email_alias to user table
2. Generate aliases for existing users
3. Update User entity
4. Add GraphQL field: `user.newsletterEmail`
5. Create settings UI to display email

**Deliverables**:

- [ ] All users have unique email aliases
- [ ] User can see their newsletter email in settings
- [ ] Copy-to-clipboard button works

---

### Phase 3: Email Infrastructure (Day 2)

**Tasks**:

1. Set up SendGrid Inbound Parse
2. Configure DNS (MX, SPF, DKIM)
3. Create EmailModule
4. Create EmailInboundController (receives webhook)
5. Implement webhook signature validation
6. Test email reception

**Deliverables**:

- [ ] Emails sent to {alias}@omnivore.email reach our webhook
- [ ] Webhook authenticated and secure

---

### Phase 4: Email Parsing & Import (Days 3-4)

**Tasks**:

1. Install `mailparser` package
2. Create EmailParserService (parse MIME emails)
3. Create NewsletterContentExtractor (extract clean content)
4. Create NewsletterProcessorService (BullMQ processor)
5. Implement auto-subscription creation
6. Link library items to subscription

**Deliverables**:

- [ ] Emails parsed correctly
- [ ] Content extracted cleanly
- [ ] Subscription auto-created on first email
- [ ] Library item created with contentType='NEWSLETTER'

---

### Phase 5: UI Integration (Day 5)

**Tasks**:

1. Update left nav (show RSS + newsletters in same section)
2. Add newsletter badge to library items
3. Add filter by newsletter
4. Settings page improvements

**Deliverables**:

- [ ] Newsletters appear in Subscriptions section
- [ ] Can filter library by newsletter
- [ ] Newsletter badge visible

---

### Phase 6: Testing & Polish (Day 6)

**Tasks**:

1. E2E tests
2. Manual testing with real newsletters
3. Security audit
4. Performance testing

---

## ✅ Benefits of Unified Architecture

1. **Code Reuse**: 80% of RSS subscription code works for newsletters
2. **Consistent UX**: Users see "Subscriptions" (not "RSS vs Newsletters")
3. **Simpler Queries**: One table, simpler GraphQL
4. **Future-Proof**: Easy to add podcasts, YouTube, Twitter lists
5. **Unified Features**: Digest, filters, analytics work across all sources

---

## 🎯 Next Steps

1. ✅ **Architecture approved** → Proceed with unified model
2. Create branch: `OM-23-arc-16-newsletter-subscriptions`
3. Start Phase 1: Unify subscription system
4. Complete in 5-6 days

---

**Decision**: Proceed with **unified subscription architecture** ⭐

**Confidence Level**: High (based on thorough analysis + legacy system lessons)

**Risk**: Low (migration is straightforward, RSS continues working)
