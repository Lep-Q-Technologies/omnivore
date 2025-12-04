# RSS Subscription & Polling Architecture Redesign

## Executive Summary

Based on analysis of the legacy implementation and user requirements, we need to:

1. **Redesign RSS as Subscriptions** (not single library items)
2. **Build extensible polling infrastructure** (for RSS, newsletters, social feeds, etc.)
3. **Reorganize left navigation** to support new content types
4. **Enable internal reader for feed items** (not external links)

---

## Current vs. Proposed Architecture

### **Current (ARC-014):**

```
User adds RSS feed URL
    ↓
Creates single LibraryItem (contentType: RSS_FEED)
    ↓
Feed HTML stored in readableContent
    ↓
Clicking feed item opens external link ❌
```

**Problems:**

- Feed is a document, not a subscription
- No periodic refresh
- External links break internal reading experience
- No way to track individual feed items

### **Proposed (Subscription Model):**

```
User subscribes to RSS feed
    ↓
Creates RssFeedEntity (subscription metadata)
    ↓
Background job polls feed every hour
    ↓
Each feed item → LibraryItem (contentType: ARTICLE)
    ↓
Items appear in "Following" folder
    ↓
Clicking item opens internal reader ✅
```

**Benefits:**

- Consistent with legacy behavior
- Periodic auto-import of new content
- Internal reading with highlights
- Individual item management (read, archive, delete)

---

## Polling Infrastructure Analysis

### **Legacy API Implementation (BullMQ)**

The legacy API already has a sophisticated polling system:

#### **1. Job Scheduler**

```typescript
// packages/api/src/jobs/rss/refreshAllFeeds.ts

// Runs periodically (cron-triggered)
refreshAllFeeds()
  ↓
  Query all ACTIVE subscriptions with type='RSS'
  ↓
  Group by feed URL (multiple users can subscribe to same feed)
  ↓
  Queue individual feed refresh jobs
```

#### **2. Feed Refresh Job**

```typescript
// packages/api/src/jobs/rss/refreshFeed.ts

refreshFeed(subscriptionIds, feedUrl, userIds)
  ↓
  Parse RSS feed with rss-parser
  ↓
  For each feed item:
    - Check if already imported (by date)
    - Skip items older than mostRecentItemDate
    - Create LibraryItem for each user
    - Queue content fetch job (optional)
  ↓
  Update subscription metadata:
    - mostRecentItemDate
    - lastFetchedChecksum
    - scheduledAt (next refresh time)
```

#### **3. Smart Features**

- **Deduplication**: Checks `mostRecentItemDate` to avoid re-importing
- **Error handling**: Redis-based blocking after max failures
- **Batching**: Groups subscriptions by URL for efficiency
- **Scheduling**: Uses `scheduledAt` for staggered refreshes
- **Content fetching**: Optional fetch based on `fetchContentType`

---

## Porting to NestJS

### **Phase 1: Core Subscription System**

#### **1.1 Keep Existing RssFeedEntity**

Already created in ARC-014:

```typescript
// packages/api-nest/src/library/entities/rss-feed.entity.ts

@Entity({ name: 'rss_feed', schema: 'omnivore' })
export class RssFeedEntity {
  id: string
  userId: string
  feedUrl: string
  title: string
  lastFetchedAt: Date
  itemCount: number
  active: boolean
  // ... metadata fields
}
```

#### **1.2 Add Subscription Link to LibraryItem**

```sql
-- Migration 0199
ALTER TABLE omnivore.library_item
  ADD COLUMN subscription_id UUID REFERENCES omnivore.rss_feed(id);

CREATE INDEX idx_library_item_subscription
  ON omnivore.library_item(subscription_id);
```

#### **1.3 Update RssFeedSubscriptionService**

Change `importFeedItems()` to create individual library items:

```typescript
private async importFeedItems(feedId: string, userId: string) {
  const feed = await this.rssFeedRepository.findById(feedId, userId)
  const parsedFeed = await this.rssFeedService.parseFeed(feed.feedUrl)

  for (const item of parsedFeed.items) {
    // Check if already imported
    const existing = await this.libraryItemRepository.findByUrl(
      item.link,
      userId,
    )
    if (existing) continue

    // Create as ARTICLE (not RSS_FEED!)
    const libraryItem = await this.libraryItemRepository.create({
      userId,
      originalUrl: item.link,
      title: item.title,
      author: item.author,
      description: item.description,
      publishedAt: item.publishedAt,
      contentType: ContentType.ARTICLE, // ← Individual article!
      subscriptionId: feedId, // ← Link to subscription
    })

    // Queue content fetch for full article
    await this.contentQueue.add(JOB_TYPES.FETCH_CONTENT, {
      libraryItemId: libraryItem.id,
      url: item.link,
      userId,
      source: 'rss',
    })
  }
}
```

### **Phase 2: Polling Infrastructure**

#### **2.1 Create Scheduler Module**

```typescript
// packages/api-nest/src/scheduler/scheduler.module.ts

@Module({
  imports: [BullModule.registerQueue({ name: 'scheduler' })],
  providers: [SchedulerService, RssFeedRefreshJob],
})
export class SchedulerModule {}
```

#### **2.2 RSS Feed Refresh Job**

```typescript
// packages/api-nest/src/scheduler/jobs/rss-feed-refresh.job.ts

@Injectable()
export class RssFeedRefreshJob {
  constructor(
    private readonly rssFeedRepository: IRssFeedRepository,
    private readonly rssFeedSubscriptionService: RssFeedSubscriptionService,
  ) {}

  // Cron: Every hour
  @Cron('0 * * * *')
  async refreshAllFeeds() {
    const feedsToRefresh = await this.rssFeedRepository.getFeedsToRefresh(
      3600, // 1 hour interval
      100, // batch limit
    )

    for (const feed of feedsToRefresh) {
      await this.rssFeedSubscriptionService.refresh(feed.id, feed.userId)
    }
  }
}
```

#### **2.3 Extensible Poller Base Class**

```typescript
// packages/api-nest/src/scheduler/base-poller.ts

export abstract class BasePoller {
  abstract getItemsToProcess(): Promise<PollerItem[]>
  abstract processItem(item: PollerItem): Promise<void>
  abstract getInterval(): number // seconds

  async poll() {
    const items = await this.getItemsToProcess()
    for (const item of items) {
      try {
        await this.processItem(item)
      } catch (error) {
        this.logger.error(`Failed to process ${item.id}`, error)
      }
    }
  }
}
```

**Future pollers can extend this:**

- `NewsletterPoller` - Check email for new newsletters
- `TwitterPoller` - Poll Twitter lists/follows
- `YouTubePoller` - Check subscribed channels
- `RedditPoller` - Check saved posts
- `PocketPoller` - Import from Pocket

---

## Left Navigation Redesign

### **Current Structure (web-vite):**

```
┌─ OMNIVORE ──────────┐
│ 📥 Inbox            │
│ 📖 Reading          │
│ 🗃️ Archive          │
│ 🗑️ Trash            │
└─────────────────────┘
```

### **Legacy Structure (web):**

```
┌─ OMNIVORE ──────────────┐
│ 🏠 Home                 │ ← All (library + following)
│ 📡 Following            │ ← RSS feed items
│ 📚 Library              │ ← User-saved items
│ ✨ Highlights           │
│ 🔍 Discover             │
│ ─────────────           │
│ 🏷️ Labels               │
│ 🔖 Shortcuts            │
│ ─────────────           │
│ 📬 Subscriptions        │ ← Manage RSS feeds
│   ├─ Hacker News (12)  │
│   ├─ TechCrunch (5)    │
│   └─ ...               │
└─────────────────────────┘
```

### **Proposed Structure (web-vite v2):**

```
┌─ OMNIVORE ──────────────────────────┐
│                                      │
│ 🔍 Search _______________  [+]      │
│                                      │
│ ── VIEWS ──────────────────────────  │
│ 🏠 Home              Ctrl+H         │ ← All content
│ 📥 Inbox             Ctrl+I         │ ← Unread items
│ 📖 Reading                           │ ← In progress
│ 📡 Following                         │ ← NEW: RSS items
│ 🗃️ Archive                           │
│ 🗑️ Trash                             │
│                                      │
│ ── CONTENT TYPES ───────────────────  │
│ 📄 Articles          (420)          │ ← Filter
│ 📕 PDFs              (89)           │
│ 🎬 Videos            (23)           │
│ 🐦 Social            (12)           │
│                                      │
│ ── SUBSCRIPTIONS ───────────────────  │
│ 📡 RSS Feeds         (8) [+]        │ ← Expandable
│   ├─ 📰 Hacker News      (12) ⚙️    │ ← Unread count + settings
│   ├─ 📰 TechCrunch       (5)        │
│   ├─ 📰 Blog.com         (2)        │
│   └─ 📰 Dev.to           (1)        │
│                                      │
│ 📬 Newsletters       (3)            │ ← Future
│ 🎥 YouTube Channels  (2)            │ ← Future
│                                      │
│ ── ORGANIZE ────────────────────────  │
│ 🏷️ Labels                            │
│ 🔖 Shortcuts                         │
│                                      │
│ ── FOOTER ──────────────────────────  │
│ ⚙️ Settings                          │
│ 👤 Profile                           │
└──────────────────────────────────────┘
```

**Key Changes:**

1. **Following section** - Shows all RSS feed items (like legacy)
2. **Content Type filters** - Quick access to PDFs, Videos, etc.
3. **Subscriptions section** - Manage RSS feeds with unread counts
4. **Extensible** - Ready for Newsletters, YouTube, etc.

---

## GraphQL Schema Updates

### **Add Subscription Queries**

```graphql
type RssFeed {
  id: ID!
  userId: ID!
  feedUrl: String!
  title: String
  description: String
  siteUrl: String
  siteIcon: String
  active: Boolean!
  itemCount: Int!
  unreadCount: Int! # New: count unread items
  lastFetchedAt: DateTime
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Query {
  # Get all user's RSS subscriptions
  rssFeeds(activeOnly: Boolean = true): [RssFeed!]!

  # Get items from a specific feed
  rssFeedItems(
    feedId: ID!
    limit: Int = 20
    offset: Int = 0
  ): LibraryItemsResult!
}

type Mutation {
  # Subscribe to RSS feed
  subscribeToRssFeed(feedUrl: String!, importItems: Boolean = true): RssFeed!

  # Unsubscribe from RSS feed
  unsubscribeFromRssFeed(feedId: ID!): Boolean!

  # Manually refresh a feed
  refreshRssFeed(feedId: ID!): RssFeed!

  # Update feed settings
  updateRssFeedSettings(feedId: ID!, settings: RssFeedSettingsInput!): RssFeed!
}

input RssFeedSettingsInput {
  autoAddToLibrary: Boolean
  folder: String # inbox | following | archive
}
```

### **Update LibraryItem Schema**

```graphql
type LibraryItem {
  # ... existing fields
  subscriptionId: ID # Link to RSS feed
  subscription: RssFeed # Resolve subscription
}

type Query {
  # Add filter for subscription
  libraryItems(
    # ... existing filters
    subscriptionId: ID
    contentType: ContentType
  ): LibraryItemsResult!
}
```

---

## Frontend Changes

### **1. Add Subscriptions Section to Sidebar**

```tsx
// packages/web-vite/src/components/Sidebar.tsx

<nav className="sidebar">
  {/* Views */}
  <section className="sidebar-section">
    <h3>Views</h3>
    <NavLink to="/home" icon={<HomeIcon />}>
      Home
    </NavLink>
    <NavLink to="/inbox" icon={<InboxIcon />}>
      Inbox
    </NavLink>
    <NavLink to="/reading" icon={<BookIcon />}>
      Reading
    </NavLink>
    <NavLink to="/following" icon={<RssIcon />}>
      Following
    </NavLink>
    <NavLink to="/archive" icon={<ArchiveIcon />}>
      Archive
    </NavLink>
  </section>

  {/* Content Types */}
  <section className="sidebar-section">
    <h3>Content Types</h3>
    <NavLink to="/articles">📄 Articles ({articleCount})</NavLink>
    <NavLink to="/pdfs">📕 PDFs ({pdfCount})</NavLink>
    <NavLink to="/videos">🎬 Videos ({videoCount})</NavLink>
    <NavLink to="/social">🐦 Social ({socialCount})</NavLink>
  </section>

  {/* Subscriptions */}
  <section className="sidebar-section">
    <h3>
      Subscriptions
      <button onClick={handleAddSubscription}>+</button>
    </h3>
    <SubscriptionsList />
  </section>
</nav>
```

### **2. Create Subscriptions List Component**

```tsx
// packages/web-vite/src/components/SubscriptionsList.tsx

export function SubscriptionsList() {
  const { data: feeds } = useRssFeeds()
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="subscriptions-list">
      <button className="section-toggle" onClick={() => setExpanded(!expanded)}>
        📡 RSS Feeds ({feeds.length})
        {expanded ? <ChevronDown /> : <ChevronRight />}
      </button>

      {expanded &&
        feeds.map((feed) => <FeedListItem key={feed.id} feed={feed} />)}
    </div>
  )
}

function FeedListItem({ feed }: { feed: RssFeed }) {
  return (
    <NavLink to={`/following?subscriptionId=${feed.id}`} className="feed-item">
      <img src={feed.siteIcon} className="feed-icon" />
      <span className="feed-title">{feed.title}</span>
      {feed.unreadCount > 0 && (
        <span className="unread-badge">{feed.unreadCount}</span>
      )}
      <button
        className="feed-settings"
        onClick={(e) => {
          e.preventDefault()
          openFeedSettings(feed.id)
        }}
      >
        ⚙️
      </button>
    </NavLink>
  )
}
```

### **3. Update Following Page**

```tsx
// packages/web-vite/src/pages/FollowingPage.tsx

export function FollowingPage() {
  const { subscriptionId } = useSearchParams()
  const { data: items } = useLibraryItems({
    folder: 'following',
    subscriptionId, // Filter by feed if specified
  })

  return (
    <div className="following-page">
      <header>
        <h1>Following</h1>
        {subscriptionId && <FeedHeader subscriptionId={subscriptionId} />}
      </header>

      <LibraryGrid items={items} />
    </div>
  )
}
```

### **4. Feed Settings Modal**

```tsx
// packages/web-vite/src/components/FeedSettingsModal.tsx

export function FeedSettingsModal({ feedId }: { feedId: string }) {
  const { data: feed } = useRssFeed(feedId)
  const { mutate: updateSettings } = useUpdateFeedSettings()

  return (
    <Modal>
      <h2>{feed.title}</h2>
      <img src={feed.siteIcon} />

      <form onSubmit={handleSubmit}>
        <label>
          <input
            type="checkbox"
            checked={autoAddToLibrary}
            onChange={...}
          />
          Auto-add new items to library
        </label>

        <label>
          Default folder:
          <select value={folder} onChange={...}>
            <option value="following">Following</option>
            <option value="inbox">Inbox</option>
            <option value="archive">Archive</option>
          </select>
        </label>

        <div className="feed-stats">
          <p>Total items: {feed.itemCount}</p>
          <p>Last refreshed: {formatDate(feed.lastFetchedAt)}</p>
        </div>

        <button onClick={handleRefresh}>Refresh Now</button>
        <button onClick={handleUnsubscribe}>Unsubscribe</button>
      </form>
    </Modal>
  )
}
```

---

## Database Migration Strategy

### **Migration 0199: Add Subscription Link**

```sql
-- Add subscription_id to library_item
ALTER TABLE omnivore.library_item
  ADD COLUMN subscription_id UUID REFERENCES omnivore.rss_feed(id) ON DELETE SET NULL;

-- Add index for filtering by subscription
CREATE INDEX idx_library_item_subscription
  ON omnivore.library_item(subscription_id);

-- Add composite index for common queries
CREATE INDEX idx_library_item_user_subscription
  ON omnivore.library_item(user_id, subscription_id)
  WHERE subscription_id IS NOT NULL;
```

### **Data Migration: Existing RSS Feeds**

```sql
-- For existing RSS feed library items, we need to:
-- 1. Create RssFeedEntity if doesn't exist
-- 2. Link library item to subscription
-- 3. Change contentType from RSS_FEED to ARTICLE

-- This is a one-time migration for ARC-014 data
-- (Most users won't have RSS_FEED items yet)
```

---

## Rollout Plan

### **Phase 1: Backend Infrastructure** (Week 1)

- ✅ RssFeedEntity (already done in ARC-014)
- ✅ RssFeedService (already done)
- ⬜ Add `subscription_id` to LibraryItem
- ⬜ Update `importFeedItems()` to create ARTICLEs
- ⬜ Create SchedulerModule with BullMQ
- ⬜ Implement RSS refresh cron job
- ⬜ Add GraphQL queries for subscriptions

### **Phase 2: Frontend Subscriptions UI** (Week 2)

- ⬜ Add Subscriptions section to sidebar
- ⬜ Create SubscriptionsList component
- ⬜ Build FeedSettingsModal
- ⬜ Add /following route with feed filtering
- ⬜ Update AddLinkModal to use `subscribeToRssFeed` mutation

### **Phase 3: Content Type Filters** (Week 3)

- ⬜ Add Content Types section to sidebar
- ⬜ Implement content type filtering in library
- ⬜ Add content type counts
- ⬜ Update search to support `contentType:` filter

### **Phase 4: Extensibility** (Future)

- ⬜ BasePoller abstraction for other sources
- ⬜ Newsletter polling
- ⬜ YouTube channel polling
- ⬜ Social media integrations

---

## Testing Strategy

### **Unit Tests**

- ✅ RssFeedService (already done)
- ⬜ RSS refresh job
- ⬜ Feed item deduplication logic
- ⬜ Subscription settings updates

### **E2E Tests**

- ⬜ Subscribe to RSS feed
- ⬜ Auto-import feed items
- ⬜ Refresh feed manually
- ⬜ Unsubscribe from feed
- ⬜ Filter by subscription
- ⬜ Update feed settings

### **Integration Tests**

- ⬜ BullMQ job processing
- ⬜ Cron scheduler triggers
- ⬜ Error handling and retries

---

## Open Questions & Decisions

### **1. What happens to existing RSS_FEED library items?**

**Decision:** One-time migration script:

- Convert RSS_FEED items to subscriptions
- Re-import feed items as ARTICLEs
- Delete old RSS_FEED items

### **2. Should feed items fetch full content?**

**Options:**

- **A**: Always fetch full content (better reading experience, more storage)
- **B**: Only fetch on-demand when user clicks (faster import, less storage)
- **C**: User setting per feed (flexible, more complex)

**Recommendation:** Option B initially, add Option C later

### **3. Refresh interval?**

- **Legacy:** 1 hour for most feeds, configurable per feed
- **Proposal:** 1 hour default, let users configure (15 min / 1 hr / 3 hrs / 6 hrs / daily)

### **4. Unread count calculation?**

**Query:**

```sql
SELECT COUNT(*)
FROM library_item
WHERE subscription_id = ?
  AND state = 'SUCCEEDED'
  AND read_at IS NULL
```

Add index:

```sql
CREATE INDEX idx_library_item_unread
  ON library_item(subscription_id, state, read_at)
  WHERE read_at IS NULL;
```

---

## Success Metrics

- ✅ Users can subscribe to RSS feeds
- ✅ Feed items auto-import every hour
- ✅ Clicking feed item opens in internal reader (not external link)
- ✅ Users can manage subscriptions (settings, unsubscribe)
- ✅ Unread counts display correctly
- ✅ Content type filters work
- ✅ Infrastructure supports future pollers (newsletters, YouTube, etc.)

---

## Next Steps

1. **Get user approval** on RSS subscription architecture
2. **Create migration 0199** for `subscription_id` column
3. **Update RssFeedSubscriptionService** to import items as articles
4. **Implement scheduler module** with cron jobs
5. **Build Subscriptions UI** in sidebar
6. **Test end-to-end** with real RSS feeds
