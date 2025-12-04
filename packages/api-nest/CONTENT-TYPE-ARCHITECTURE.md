# Content Type Architecture Analysis & Recommendations

## Current State: Legacy Implementation Analysis

### 1. **PDF Handling**

#### **Legacy Approach (Two Methods)**

**Method 1: PDF from URL**

- URL-based PDFs detected by `.pdf` extension
- Text extracted using `pdf-parse` library
- Stored as HTML in `readableContent`
- Rendered with **text extraction** (what we currently have)

**Method 2: PDF Upload (File-Based)**

- Users can **upload PDFs** via drag-and-drop modal (`UploadModal.tsx`)
- Files uploaded to **S3 using signed URLs**
- Creates library item with `url: "file://local/{id}/{filename}"`
- Uses `uploadFileRequestMutation` with `createPageEntry: true`
- Original PDF stored in S3, text extracted to database

**PDF Viewer**

- Legacy uses **pdfjs-dist** (Mozilla PDF.js) for full PDF rendering
- Components: `PdfArticleContainer`, `PdfViewer`, `PdfToolbar`, `PdfSideBar`, `PdfSearchBar`
- Features:
  - Page navigation
  - Zoom controls
  - Text search within PDF
  - Thumbnail sidebar
  - Highlighting support
  - Scripting manager for interactive PDFs

**Key Difference:**

- **Text Extraction** = Fast, searchable, but loses formatting
- **PDF Embedding** = Native PDF experience, preserves layout, slower to load

---

### 2. **RSS Feed Handling**

#### **Legacy Approach (Separate Subscription System)**

**Data Model:**

- **Separate `subscriptions` table** (not library items!)
- Type: `SubscriptionType.RSS` or `SubscriptionType.Newsletter`
- Tracks:
  - `name`, `url`, `description`, `icon`
  - `status`: ACTIVE | DELETED | UNSUBSCRIBED
  - `mostRecentItemDate`, `lastFetchedChecksum`
  - `scheduledAt`, `refreshedAt`, `failedAt`
  - `autoAddToLibrary` (boolean)
  - `fetchContent` (boolean)
  - `folder` (default: 'following')

**UI Flow:**

- AddLinkModal has separate **"Feed" tab**
- Uses `subscribeMutation` (not `saveUrl`)
- Subscription entity created, NOT a library item

**Item Import:**

- Feed items imported as **individual library items** (articles)
- Background job fetches feed periodically
- Each feed item becomes a separate article in library
- Deduplication by URL to prevent duplicates

**Periodic Refresh:**

- Background scheduler checks `scheduledAt`
- Fetches new feed items since `mostRecentItemDate`
- Uses `lastFetchedChecksum` to detect changes

**Feed Presentation:**

- Feeds listed in "Subscriptions" section (not library)
- Feed items appear in library as regular articles
- "Following" folder contains auto-imported feed items

---

### 3. **YouTube/Twitter Add Screens**

#### **Legacy Approach**

**No Dedicated Screens Found**

- Legacy doesn't have separate YouTube/Twitter modals
- Uses same `saveUrl` mutation for all web content
- Content detection happens on backend
- No special UI affordances for video/social content

**Current New Implementation:**

- We already auto-detect YouTube/Twitter URLs
- Extract video transcripts / tweet content
- Store as library items with appropriate `contentType`

---

### 4. **File Upload Integration**

#### **Legacy Upload System**

**Supported Formats:**

- PDF (`application/pdf`)
- EPUB (`application/epub+zip`)
- CSV (`text/csv`) - URL import lists
- ZIP (`application/zip`) - Matter.app archives

**Upload Flow:**

1. User drops file or clicks to browse
2. Frontend requests signed upload URL from backend
3. File uploaded directly to S3 (bypasses backend)
4. Backend notified of upload completion
5. Background job processes file (extract text, create library item)

**Storage:**

- Original files in S3 bucket
- Extracted text in PostgreSQL `readableContent`
- Metadata in `library_item` table

---

## Recommendations for Redesign

### **1. PDF Reader Enhancement**

#### **Phase 1: Dual Mode Support**

```typescript
enum PdfViewMode {
  TEXT = 'text', // Current: extracted text (fast, searchable)
  EMBEDDED = 'embedded', // New: native PDF.js viewer (preserves layout)
}
```

**Implementation:**

- Add toggle button in PDF reader header
- Default to TEXT mode for faster loading
- EMBEDDED mode loads full PDF from S3
- Persist user preference per document

**Benefits:**

- Text mode: Fast, accessible, searchable, works on mobile
- Embedded mode: Preserves formatting, diagrams, tables

#### **Phase 2: Upload Support**

- Add file upload to AddLinkModal
- Support both URL-based and file-based PDFs
- Store originals in S3 for embedded viewing

---

### **2. RSS Feed Rethink**

#### **Problem with Current Approach**

We're treating RSS feeds as **single library items**, but legacy treats them as **subscriptions** that import multiple articles.

#### **Recommended Architecture**

**Option A: Hybrid (Recommended)**

```
Subscription (metadata) → imports → Library Items (feed articles)
                       ↓
                   Feed View (aggregated)
```

**Data Model:**

- Keep our `RssFeedEntity` for subscription metadata
- Auto-import feed items as **individual library items**
- Add `subscriptionId` foreign key to `LibraryItemEntity`
- Feed view shows aggregated items from subscription

**UI Changes:**

1. **Subscriptions Section** (new)

   - List all RSS subscriptions with icons
   - Show unread count per feed
   - Manage subscription settings (auto-add, folder, etc.)

2. **Feed Item Reader**

   - Clicking feed item in library opens **article URL** (not feed URL)
   - Use internal reader for feed article content
   - Link back to feed source

3. **Periodic Refresh**
   - Cron job checks feeds every hour
   - Import new items automatically
   - Respect `autoAddToLibrary` setting

**Option B: Feed-as-Document (Current)**

- Keep feed as single library item
- Show feed items in reader
- Clicking item opens in new tab
- **Downside:** Poor UX, loses internal reading features

**Verdict:** Move to Option A (hybrid) for better UX

---

### **3. YouTube/Twitter Presentation**

#### **Current Implementation is Good**

- Auto-detection works well
- Transcript/tweet extraction is valuable
- No need for separate add screens

#### **Enhancement: Embedded Players**

**YouTube:**

```tsx
<div className="video-player">
  <iframe
    src={`https://www.youtube.com/embed/${videoId}`}
    allow="accelerometer; autoplay; encrypted-media"
  />
  <div className="transcript">{/* Existing transcript with timestamps */}</div>
</div>
```

**Twitter:**

- Consider Twitter embed script for rich display
- Show images, retweets, replies inline
- Full thread unrolling when API available

---

### **4. Content Type Navigation Redesign**

#### **Problem: Conflation**

Everything is a "library item" but they behave differently:

- Articles: Read, highlight, archive
- PDFs: View, annotate, search
- Videos: Watch, read transcript
- RSS Feeds: Subscribe, browse items
- Tweets: Thread view, social context

#### **Solution: Unified Library with Smart Filtering**

**UI Structure:**

```
┌─ LIBRARY ─────────────────────────┐
│ [All] [Articles] [PDFs] [Videos] │ ← Content type filters
│ [RSS Feeds] [Social]              │
│                                    │
│ Search: [____________] 🔍         │
│                                    │
│ Sidebar:                           │
│ 📥 Inbox (120)                     │
│ 📖 Reading (15)                    │
│ 🗃️ Archive                         │
│ 🗑️ Trash                           │
│ ─────────────                      │
│ 📡 Subscriptions (8)               │ ← New section
│   ├─ Hacker News (5)              │
│   ├─ Blog.com (2)                 │
│   └─ ...                          │
└────────────────────────────────────┘
```

**Card Display:**

```tsx
// Article card: Standard
<ArticleCard title={} preview={} author={} date={} />

// PDF card: Show page count, file size
<PdfCard title={} pageCount={} fileSize={} thumbnail={} />

// Video card: Show duration, thumbnail
<VideoCard title={} duration={} thumbnail={} channel={} />

// RSS Feed card: Show item count, last fetched
<FeedCard title={} itemCount={} lastFetched={} icon={} />

// Tweet card: Show author, stats
<TweetCard author={} text={} likes={} retweets={} />
```

---

### **5. Reader Component Architecture**

#### **Current: Single ReaderPage**

All content types share one reader - works but limited.

#### **Proposed: Content-Specific Readers**

```typescript
// Router logic
switch (item.contentType) {
  case 'ARTICLE':
    return <ArticleReader item={item} />

  case 'PDF':
    return <PdfReader item={item} viewMode={viewMode} />

  case 'VIDEO':
    return <VideoReader item={item} showTranscript={true} />

  case 'RSS_FEED':
    return <FeedReader subscription={subscription} />

  case 'TWITTER':
    return <ThreadReader item={item} />
}
```

**Shared Components:**

- `<ReaderHeader />` - Title, actions, metadata
- `<HighlightSidebar />` - Works across content types
- `<NotebookModal />` - Universal notes
- `<LabelPicker />` - Tagging

**Content-Specific:**

- `<PdfToolbar />` - Zoom, page nav, view mode toggle
- `<VideoPlayer />` - Embedded player with transcript sync
- `<FeedItemList />` - Browse feed articles
- `<ThreadNavigator />` - Tweet thread navigation

---

## Implementation Priority

### **Phase 1: Foundation** (Current Sprint)

- ✅ ContentType enum alignment
- ✅ Enable PDF/RSS in modal
- ✅ Basic content type detection
- ✅ Content-specific rendering

### **Phase 2: RSS Subscription System** (Next Sprint)

- Create Subscriptions UI section
- Implement periodic feed refresh job
- Auto-import feed items as library items
- Feed management (subscribe/unsubscribe/settings)

### **Phase 3: Enhanced PDF Reader** (Future)

- Integrate pdfjs-dist
- Add view mode toggle (text vs embedded)
- PDF upload support
- Implement PDF-specific features (search, thumbnails)

### **Phase 4: Rich Video/Social** (Future)

- Embedded YouTube player
- Transcript timestamp sync
- Twitter embed integration
- Full thread unrolling

### **Phase 5: Upload System** (Future)

- S3 signed upload integration
- EPUB support
- Bulk import (CSV, OPML)
- File management

---

## Open Questions

1. **RSS Feed Items in Internal Reader?**

   - **Yes**: Better UX, highlights work, consistent experience
   - **Implementation**: Store feed article content when importing
   - **Tradeoff**: More storage, may hit rate limits

2. **PDF Storage Strategy?**

   - **Text only**: Current approach, cheap storage
   - **Text + S3**: Best of both worlds, costs more
   - **Recommendation**: Hybrid - S3 for user-uploaded, text-only for URLs

3. **Content Type Filters?**

   - **UI**: Tabs at top of library? Dropdown filter?
   - **Backend**: Add `contentType` filter to search query
   - **Recommendation**: Both - quick tabs + advanced filter modal

4. **How to Handle Feed Item Click?**
   - Option A: Navigate to feed article URL directly
   - Option B: Fetch article content, open in internal reader
   - Option C: Show popup "Open in reader" vs "View original"
   - **Recommendation**: Option B (internal reader by default)

---

## Database Schema Impact

### **New Tables Needed:**

None - we already have `RssFeedEntity`

### **Migration Needed:**

```sql
-- Add subscription relationship to library items
ALTER TABLE omnivore.library_item
  ADD COLUMN subscription_id UUID REFERENCES omnivore.rss_feed(id);

-- Add indexes
CREATE INDEX idx_library_item_subscription
  ON omnivore.library_item(subscription_id);

CREATE INDEX idx_library_item_content_type
  ON omnivore.library_item(content_type);
```

---

## Next Steps

1. **Immediate**:

   - Complete current phase (tests passing ✅)
   - Decide on RSS architecture (Option A vs B)
   - Sketch subscription UI mockups

2. **Short-term**:

   - Implement RSS subscription system
   - Add periodic feed refresh job
   - Create Subscriptions section in UI

3. **Long-term**:
   - Integrate pdfjs-dist for embedded viewing
   - Add file upload support
   - Enhance video/social readers
