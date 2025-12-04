# ARC-016 Phase 1: Unified Subscription System - Implementation Summary

**Date**: November 30, 2025
**Status**: Ready for Testing
**Design Principle**: Single Responsibility Principle (SRP)

---

## ✅ What We've Built

### **1. Database Migrations (Complete)**

**Migration 0200**: `rss_feed` → `subscription` (Unified Table)

- Renamed table to `subscription` (singular)
- Added `source_type` VARCHAR(20) - Enum: 'RSS' | 'NEWSLETTER'
- Renamed `feed_url` → `source_identifier` (generic)
- Added `email_alias` VARCHAR(64) - Unique email for newsletters
- Added `folder` VARCHAR(255) - Auto-route content
- Added `auto_add_labels` TEXT[] - Auto-tag content
- Added `unsubscribe_mail_to` TEXT - Newsletter unsubscribe email
- Added `unsubscribe_http_url` TEXT - Newsletter unsubscribe link
- Updated indexes and constraints

**Migration 0201**: User Email Aliases

- Added `email_alias` VARCHAR(64) UNIQUE to user table
- Auto-generated for existing users (8-char hash)
- Indexed for fast newsletter routing

### **2. Entity Layer (Complete)**

**SubscriptionEntity** (`src/library/entities/subscription.entity.ts`)

```typescript
export enum SubscriptionSourceType {
  RSS = 'RSS',
  NEWSLETTER = 'NEWSLETTER',
}

export class SubscriptionEntity {
  sourceType: SubscriptionSourceType
  sourceIdentifier: string // URL or email
  emailAlias?: string // Newsletter routing
  folder?: string // Auto-route
  autoAddLabels?: string[] // Auto-tag
  unsubscribeMailTo?: string
  unsubscribeHttpUrl?: string

  // Helper getters
  get isRss(): boolean
  get isNewsletter(): boolean
  get feedUrl(): string | null
  get senderEmail(): string | null
}
```

**User Entity Updates** (`src/user/entities/user.entity.ts`)

```typescript
export class User {
  emailAlias: string // e.g., "a7x9k2m1"

  get newsletterEmail(): string | null {
    return `${this.emailAlias}@inbox.omnivore.app`
  }
}
```

### **3. Repository Layer (Complete)**

**SubscriptionRepository** (`src/repositories/subscription.repository.ts`)

```typescript
export interface SubscriptionMetadata {
  title?: string
  description?: string
  siteUrl?: string
  siteIcon?: string
  folder?: string
  autoAddLabels?: string[]
  unsubscribeMailTo?: string
  unsubscribeHttpUrl?: string
}

export class SubscriptionRepository {
  // RSS-specific
  async createRss(userId, feedUrl, metadata): Promise<SubscriptionEntity>

  // Newsletter-specific (Phase 2)
  async createNewsletter(
    userId,
    senderEmail,
    emailAlias,
    metadata,
  ): Promise<SubscriptionEntity>
  async findByEmailAlias(emailAlias): Promise<SubscriptionEntity | null>

  // Common operations
  async findBySource(
    userId,
    sourceType,
    sourceIdentifier,
  ): Promise<SubscriptionEntity | null>
  async findByUser(
    userId,
    sourceType?,
    activeOnly?,
  ): Promise<SubscriptionEntity[]>
  async updateSettings(subscriptionId, userId, settings): Promise<void>
  async markFetched(subscriptionId, itemsImported): Promise<void>
  async markFailed(subscriptionId, error): Promise<void>
  async deactivate(subscriptionId): Promise<void>
  async activate(subscriptionId): Promise<void>
  async delete(subscriptionId): Promise<void>
  async getUnreadCount(subscriptionId, userId): Promise<number>

  // RSS-specific querying
  async getFeedsToRefresh(refreshInterval, limit): Promise<SubscriptionEntity[]>
}
```

### **4. Service Layer (Complete - Following SRP)**

**RssSubscriptionService** (`src/library/services/rss-subscription.service.ts`)

- **Single Responsibility**: RSS feed subscriptions only
- **Newsletter subscriptions**: Handled by `NewsletterSubscriptionService` (Phase 2)

```typescript
export class RssSubscriptionService {
  async subscribe(userId, feedUrl, importItems): Promise<SubscriptionEntity>
  async unsubscribe(feedId, userId, deleteItems): Promise<void>
  async refresh(feedId, userId): Promise<FeedImportResult>
  async getUserFeeds(userId, activeOnly): Promise<SubscriptionEntity[]>
  async getUnreadCount(feedId, userId): Promise<number>
  async updateSettings(feedId, userId, settings): Promise<SubscriptionEntity>

  private async importFeedItems(feedId, userId): Promise<FeedImportResult>
  private generateSlug(url): string
}
```

**Key Design Decision**:

- RSS and Newsletter services are **separate** (SRP)
- Both use the same **SubscriptionRepository** (composition over inheritance)
- No base class needed - repository provides the abstraction

### **5. Module Updates (Complete)**

✅ `DatabaseModule` - Uses `SubscriptionEntity`
✅ `RepositoriesModule` - Provides `SubscriptionRepository`
✅ `REPOSITORY_TOKENS` - Added `ISubscriptionRepository`

---

## 🔄 Files Still Using Legacy Names

Need to update these 5 files to use `RssSubscriptionService`:

1. `/packages/api-nest/src/library/library.module.ts`
2. `/packages/api-nest/src/library/resolvers/rss-feed.resolver.ts`
3. `/packages/api-nest/src/library/services/rss-feed-subscription.service.ts` (DELETE - replaced by rss-subscription.service.ts)
4. `/packages/api-nest/src/scheduler/scheduler.module.ts`
5. `/packages/api-nest/src/scheduler/services/rss-feed-refresh.service.ts`

---

## 📊 What We Learned from Legacy System

From `omnivore.subscriptions` table (migration 0080):

**Adopted**:

- ✅ `unsubscribe_mail_to` - Critical for newsletters
- ✅ `unsubscribe_http_url` - One-click unsubscribe

**Deferred** (not needed for ARC-016):

- ❌ `is_private` - No sharing features yet
- ❌ `status` enum (ACTIVE/UNSUBSCRIBED/DELETED) - Our `active` boolean works
- ❌ `refreshed_at` separate from `most_recent_item_date` - Can add later
- ❌ `failed_at` timestamp - We have `last_error` + `failure_count`

**No Naming Conflict**:

- Legacy: `omnivore.subscriptions` (plural)
- Our new table: `omnivore.subscription` (singular)

---

## 🎯 Next Steps

### **Before Testing**:

1. Update 5 files to use `RssSubscriptionService`
2. Update GraphQL schema (RssFeed → Subscription types)
3. Update test files and factories

### **Testing Plan**:

1. Run migrations (0200, 0201)
2. Verify existing RSS subscriptions still work
3. Test RSS subscribe/unsubscribe flow
4. Verify library items link correctly

### **Future (Phase 2 - Newsletter Implementation)**:

1. Create `NewsletterSubscriptionService`
2. Create `EmailModule` with webhook handler
3. Implement email parsing and routing
4. UI for displaying newsletter email address
5. Newsletter-specific GraphQL mutations

---

## 💡 Architecture Benefits

**Single Responsibility Principle**:

- ✅ `RssSubscriptionService` - RSS only
- ✅ `NewsletterSubscriptionService` - Newsletters only (Phase 2)
- ✅ `SubscriptionRepository` - Data access for all types

**Composition Over Inheritance**:

- ✅ No base class needed
- ✅ Both services inject same repository
- ✅ Repository handles type-specific logic

**Future-Proof**:

- ✅ Easy to add `PodcastSubscriptionService`
- ✅ Easy to add `YoutubeSubscriptionService`
- ✅ Same repository works for all types

---

**Decision**: Proceed with testing after updating remaining 5 files ✅
