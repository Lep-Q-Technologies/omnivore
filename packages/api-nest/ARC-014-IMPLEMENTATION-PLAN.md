# ARC-014: Additional Content Types - Implementation Plan

**Date**: November 23, 2025 (Updated: November 30, 2025)
**Branch**: `OM-22-arc-14-additional-content-types`
**Status**: Partially Complete (Phases 1-3 ✅, Phases 4-5 Deferred)
**Depends on**: ARC-013 ✅ (Complete)

---

## ✅ Completion Summary (November 30, 2025)

**Completed Work** (Now designated as **ARC-014A: RSS Feed Subscriptions**):

- ✅ **Phase 1**: Content type detection & routing (ContentTypeDetectorService)
- ✅ **Phase 2**: PDF extraction (PdfExtractorService)
- ✅ **Phase 3**: RSS feed subscriptions (RssFeedService, RssFeedSubscriptionService, SchedulerModule)

**Additional Features Completed**:

- ✅ RSS feed periodic refresh with SchedulerModule and BasePoller
- ✅ RSS feed filtering in library (by feed, "following" folder)
- ✅ RSS feed unsubscribe with item deletion option
- ✅ RSS feed UI in left navigation with unread counts
- ✅ Feed metadata extraction (title, description, site icon)

**Deferred Work** (Now designated as **ARC-014B: Enhanced Content Types**):

- [ ] **Phase 4**: Video transcript extraction (YouTube) → ARC-014B
- [ ] **Phase 5**: Twitter thread unrolling → ARC-014B

**See**:

- `docs/architecture/unified-migration-backlog-complete.md` → ARC-013, ARC-014A documentation
- `docs/architecture/unified-migration-backlog.md` → ARC-014B, ARC-015, ARC-016, ARC-017 for future work

---

## 📊 Overview

**Objective**: Extend content processing pipeline to support additional content types beyond web articles.

**Current State**:

- ✅ Web article extraction complete (ARC-013)
- ✅ Mozilla Readability + Open Graph + JSON-LD extraction
- ✅ HTML sanitization and content hashing
- ✅ BullMQ queue infrastructure with retry logic
- ✅ Event-driven architecture

**New Content Types**:

1. **PDF documents** - Extract text, metadata, generate thumbnails
2. **RSS feeds** - Subscribe to feeds, auto-import new articles
3. **Video content** - Extract transcripts, metadata (YouTube focus)
4. **Twitter threads** - Unroll threads, preserve media and attribution

---

## 🎯 Success Criteria

**ARC-014A (Completed) ✅**:

- [x] Save PDF URL → extract text → display in reader ✅
- [x] Subscribe to RSS feed → auto-import new articles ✅
- [x] Content type auto-detection from URL/MIME type ✅
- [x] All content types use existing queue infrastructure ✅
- [x] All content types support retry logic and error handling ✅
- [x] E2E tests for PDF and RSS ✅
- [x] All existing tests still passing (261+ tests) ✅

**ARC-014B (Deferred to future work)**:

- [ ] Save YouTube URL → extract transcript → display in reader
- [ ] Save Twitter thread URL → unroll thread → display in reader
- [ ] E2E tests for video and Twitter

---

## 📋 Implementation Phases

### Phase 1: Content Type Detection & Routing (Days 1-2)

**Goal**: Add content type detection and route to appropriate extractors

**Tasks**:

1. **Create ContentTypeDetectorService** (`src/queue/services/content-type-detector.service.ts`)

   - [ ] `detectContentType(url: string, mimeType?: string): ContentType`
   - [ ] URL pattern matching:
     - PDF: `.pdf` extension or `application/pdf` MIME
     - RSS: `.rss`, `.xml`, `.atom` or `application/rss+xml`
     - YouTube: `youtube.com/watch`, `youtu.be/*`
     - Twitter: `twitter.com/*/status/*`, `x.com/*/status/*`
     - Web article: Default fallback
   - [ ] HEAD request to check Content-Type header if needed
   - [ ] Return `ContentType` enum value

2. **Define ContentType enum** (`src/library/entities/library-item.entity.ts`)

   ```typescript
   export enum ContentType {
     ARTICLE = 'article', // Web articles (current)
     PDF = 'pdf', // PDF documents
     RSS_FEED = 'rss_feed', // RSS/Atom feeds
     VIDEO = 'video', // YouTube, Vimeo, etc.
     TWITTER_THREAD = 'twitter', // Twitter threads
     UNKNOWN = 'unknown',
   }
   ```

3. **Update LibraryItemEntity**

   - [ ] Add `contentType: ContentType` column (default: `ARTICLE`)
   - [ ] Add migration for new column
   - [ ] Update GraphQL schema to expose `contentType`

4. **Refactor ContentProcessorService routing**
   - [ ] Call `ContentTypeDetectorService.detectContentType(url)`
   - [ ] Route to appropriate extractor:
     - `fetchWebArticle()` - Existing Readability flow
     - `fetchPdfDocument()` - New PDF extractor
     - `fetchRssFeed()` - New RSS parser
     - `fetchVideoTranscript()` - New video extractor
     - `fetchTwitterThread()` - New Twitter unroller
   - [ ] Update library item with detected content type

**Acceptance Criteria**:

- [ ] Content type correctly detected from URL
- [ ] Routing works for all content types
- [ ] Database migration runs successfully
- [ ] GraphQL returns `contentType` field

**Dependencies**: None (foundation work)

**Effort Estimate**: 1-2 days

---

### Phase 2: PDF Content Extraction (Days 3-4)

**Goal**: Extract text and metadata from PDF documents

**Tasks**:

1. **Install dependencies**

   ```bash
   npm install pdf-parse
   npm install --save-dev @types/pdf-parse
   ```

2. **Create PdfExtractorService** (`src/queue/services/pdf-extractor.service.ts`)

   - [ ] `extractPdf(url: string): Promise<PdfExtractionResult>`
   - [ ] Download PDF file (max 50MB)
   - [ ] Extract text content with `pdf-parse`
   - [ ] Extract metadata (title, author, pages, creation date)
   - [ ] Calculate word count from extracted text
   - [ ] Generate content hash
   - [ ] Handle encrypted/password-protected PDFs gracefully
   - [ ] Handle scanned PDFs (warn about missing text)

3. **Update ContentProcessorService**

   - [ ] Implement `fetchPdfDocument()` method
   - [ ] Call `PdfExtractorService.extractPdf(url)`
   - [ ] Store extracted text in `readableContent`
   - [ ] Store metadata (author, pages)
   - [ ] Set `contentType = ContentType.PDF`

4. **Error handling**

   - [ ] Handle download failures (timeout, size limit)
   - [ ] Handle corrupted PDFs
   - [ ] Handle password-protected PDFs
   - [ ] Graceful fallback for scanned PDFs (no text)

5. **Testing**
   - [ ] Unit tests for `PdfExtractorService`
   - [ ] E2E test: Save PDF URL → extract text → verify in reader
   - [ ] Test with various PDF types:
     - Text-based PDF
     - Scanned PDF (image-only)
     - Password-protected PDF
     - Large PDF (multi-page)

**Acceptance Criteria**:

- [ ] PDF text extraction works
- [ ] Metadata correctly extracted
- [ ] Reader displays PDF text
- [ ] Error handling for edge cases
- [ ] E2E test passing

**Dependencies**: Phase 1

**Effort Estimate**: 1-2 days

**Deferred to Future**:

- OCR for scanned PDFs (use Tesseract.js or cloud OCR)
- PDF thumbnail generation (use pdf2pic)
- Preserve PDF formatting (use PDF.js for rendering)

---

### Phase 3: RSS Feed Parsing (Days 5-6)

**Goal**: Parse RSS/Atom feeds and auto-import new articles

**Tasks**:

1. **Install dependencies**

   ```bash
   npm install rss-parser
   npm install --save-dev @types/rss-parser
   ```

2. **Create RssFeedService** (`src/queue/services/rss-feed.service.ts`)

   - [ ] `parseFeed(url: string): Promise<RssFeedResult>`
   - [ ] Fetch and parse RSS/Atom feed
   - [ ] Extract feed metadata (title, description, link)
   - [ ] Extract feed items (articles)
   - [ ] Return structured feed data

3. **Create RssFeedEntity** (`src/library/entities/rss-feed.entity.ts`)

   - [ ] `id`, `userId`, `feedUrl`, `title`, `description`
   - [ ] `lastFetchedAt`, `itemCount`, `active`
   - [ ] Many-to-many relationship with LibraryItemEntity

4. **Create RssFeedRepository** (`src/library/repositories/rss-feed.repository.ts`)

   - [ ] `createFeed(userId, feedUrl, metadata)`
   - [ ] `getFeedsByUser(userId)`
   - [ ] `updateFeedLastFetched(feedId, timestamp)`
   - [ ] `deleteFeed(feedId)`

5. **Update ContentProcessorService**

   - [ ] Implement `fetchRssFeed()` method
   - [ ] Call `RssFeedService.parseFeed(url)`
   - [ ] Create LibraryItem for the feed itself
   - [ ] Store feed metadata
   - [ ] Set `contentType = ContentType.RSS_FEED`

6. **Create RssFeedImportJob** (separate job type)

   - [ ] Add `IMPORT_RSS_ITEMS` job type
   - [ ] For each feed item:
     - Create new LibraryItem
     - Set original feed URL as source
     - Queue `FETCH_CONTENT` job for article extraction
   - [ ] Handle duplicates (check URL hash)

7. **Add GraphQL mutations**

   - [ ] `subscribeToRssFeed(url: String!): RssFeed`
   - [ ] `unsubscribeFromRssFeed(feedId: ID!): Boolean`
   - [ ] `refreshRssFeed(feedId: ID!): RssFeed`

8. **Testing**
   - [ ] Unit tests for `RssFeedService`
   - [ ] E2E test: Subscribe to feed → import articles
   - [ ] Test with various feed formats:
     - RSS 2.0
     - Atom 1.0
     - Invalid feed

**Acceptance Criteria**:

- [ ] RSS feed parsing works
- [ ] Feed subscription persisted
- [ ] Articles auto-imported to library
- [ ] Duplicates handled
- [ ] E2E tests passing

**Dependencies**: Phase 1

**Effort Estimate**: 2 days

**Deferred to Future**:

- Auto-refresh on schedule (cron job)
- Feed discovery from website
- OPML import/export

---

### Phase 4: Video Transcript Extraction (Days 7-8)

**Goal**: Extract transcripts and metadata from YouTube videos

**Tasks**:

1. **Install dependencies**

   ```bash
   npm install youtube-transcript
   npm install ytdl-core
   npm install --save-dev @types/ytdl-core
   ```

2. **Create VideoExtractorService** (`src/queue/services/video-extractor.service.ts`)

   - [ ] `extractYoutubeVideo(url: string): Promise<VideoExtractionResult>`
   - [ ] Extract video ID from URL
   - [ ] Fetch video metadata (title, author, description, duration)
   - [ ] Fetch transcript using `youtube-transcript`
   - [ ] Format transcript as readable HTML
   - [ ] Extract thumbnail URL
   - [ ] Calculate word count from transcript

3. **Update ContentProcessorService**

   - [ ] Implement `fetchVideoTranscript()` method
   - [ ] Call `VideoExtractorService.extractYoutubeVideo(url)`
   - [ ] Store transcript in `readableContent`
   - [ ] Store metadata (author, duration)
   - [ ] Store thumbnail
   - [ ] Set `contentType = ContentType.VIDEO`

4. **Error handling**

   - [ ] Handle videos without transcripts
   - [ ] Handle age-restricted videos
   - [ ] Handle private/deleted videos
   - [ ] Graceful fallback to metadata only

5. **Testing**
   - [ ] Unit tests for `VideoExtractorService`
   - [ ] E2E test: Save YouTube URL → extract transcript
   - [ ] Test with various video types:
     - Public video with transcript
     - Video without transcript
     - Age-restricted video

**Acceptance Criteria**:

- [ ] YouTube transcript extraction works
- [ ] Video metadata correctly extracted
- [ ] Reader displays formatted transcript
- [ ] Error handling for edge cases
- [ ] E2E test passing

**Dependencies**: Phase 1

**Effort Estimate**: 1-2 days

**Deferred to Future**:

- Support other video platforms (Vimeo, Dailymotion)
- Auto-generated transcripts (speech-to-text)
- Transcript timestamps (jump to video position)

---

### Phase 5: Twitter Thread Unrolling (Days 9-10)

**Goal**: Unroll Twitter threads and preserve content

**Tasks**:

1. **Research Twitter/X API options**

   - [ ] Investigate Twitter API v2 requirements
   - [ ] Evaluate syndication.twitter.com (no auth required)
   - [ ] Consider web scraping fallback (Puppeteer)

2. **Install dependencies**

   ```bash
   npm install axios cheerio
   # OR if using official API:
   npm install twitter-api-v2
   ```

3. **Create TwitterExtractorService** (`src/queue/services/twitter-extractor.service.ts`)

   - [ ] `extractThread(url: string): Promise<TwitterThreadResult>`
   - [ ] Parse tweet ID from URL
   - [ ] Fetch tweet data
   - [ ] Detect if part of thread (has replies)
   - [ ] Fetch entire thread (parent + replies)
   - [ ] Extract text, media URLs, author info
   - [ ] Format as readable HTML
   - [ ] Preserve quote tweets and retweets

4. **Update ContentProcessorService**

   - [ ] Implement `fetchTwitterThread()` method
   - [ ] Call `TwitterExtractorService.extractThread(url)`
   - [ ] Store thread content in `readableContent`
   - [ ] Store author metadata
   - [ ] Store media URLs
   - [ ] Set `contentType = ContentType.TWITTER_THREAD`

5. **Error handling**

   - [ ] Handle deleted tweets
   - [ ] Handle private accounts
   - [ ] Handle rate limiting
   - [ ] Graceful fallback for single tweets

6. **Testing**
   - [ ] Unit tests for `TwitterExtractorService`
   - [ ] E2E test: Save Twitter thread URL → unroll thread
   - [ ] Test with various tweet types:
     - Single tweet
     - Thread (3+ tweets)
     - Thread with media
     - Deleted tweet

**Acceptance Criteria**:

- [ ] Twitter thread unrolling works
- [ ] Media preserved
- [ ] Author attribution correct
- [ ] Error handling for edge cases
- [ ] E2E test passing

**Dependencies**: Phase 1

**Effort Estimate**: 2 days

**Challenges**:

- Twitter API requires authentication (may need API keys)
- Rate limiting (15 requests / 15 minutes for API v2)
- Web scraping is fragile (DOM changes break it)

**Deferred to Future**:

- Support for Twitter Spaces (audio transcripts)
- Support for polls and Twitter Cards

---

### Phase 6: Testing & Polish (Day 11)

**Goal**: Comprehensive testing and documentation

**Tasks**:

1. **E2E tests** (`test/content-types.e2e-spec.ts`)

   - [ ] Test PDF extraction workflow
   - [ ] Test RSS feed subscription workflow
   - [ ] Test YouTube transcript workflow
   - [ ] Test Twitter thread workflow
   - [ ] Test content type auto-detection
   - [ ] Test error handling for each type

2. **Integration tests**

   - [ ] Test each extractor service
   - [ ] Test content type detector
   - [ ] Test routing logic

3. **Performance testing**

   - [ ] PDF extraction time (target: <15 seconds)
   - [ ] RSS parsing time (target: <5 seconds)
   - [ ] Video transcript time (target: <10 seconds)
   - [ ] Twitter thread time (target: <5 seconds)

4. **Documentation**

   - [ ] Update README with supported content types
   - [ ] Document API limitations (rate limits, etc.)
   - [ ] Add examples for each content type
   - [ ] Update GraphQL schema documentation

5. **Error handling polish**
   - [ ] User-friendly error messages
   - [ ] Retry logic for transient failures
   - [ ] Logging for debugging

**Acceptance Criteria**:

- [ ] All E2E tests passing
- [ ] Performance targets met
- [ ] Documentation complete
- [ ] Error messages helpful

**Dependencies**: Phases 1-5

**Effort Estimate**: 1 day

---

## 📊 Database Changes

### Migration: Add contentType column

```sql
ALTER TABLE library_item
ADD COLUMN content_type VARCHAR(50) DEFAULT 'article';

-- Create index for content type filtering
CREATE INDEX idx_library_item_content_type
ON library_item(content_type);
```

### Migration: Create rss_feed table

```sql
CREATE TABLE rss_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  feed_url VARCHAR(2048) NOT NULL,
  title VARCHAR(512),
  description TEXT,
  last_fetched_at TIMESTAMP,
  item_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, feed_url)
);

CREATE INDEX idx_rss_feed_user_id ON rss_feed(user_id);
CREATE INDEX idx_rss_feed_active ON rss_feed(active);
```

---

## 🧪 Testing Strategy

### Unit Tests (30+ new tests)

- ContentTypeDetectorService (10 tests)
- PdfExtractorService (5 tests)
- RssFeedService (5 tests)
- VideoExtractorService (5 tests)
- TwitterExtractorService (5 tests)

### E2E Tests (8+ new tests)

- PDF extraction workflow (2 tests)
- RSS subscription workflow (2 tests)
- YouTube extraction workflow (2 tests)
- Twitter thread workflow (2 tests)

### Test Coverage Target

- Current: 280+ tests
- After ARC-014: 320+ tests
- Target coverage: 85%+

---

## 📦 Dependencies to Install

```bash
# PDF extraction
npm install pdf-parse
npm install --save-dev @types/pdf-parse

# RSS parsing
npm install rss-parser
npm install --save-dev @types/rss-parser

# Video transcripts
npm install youtube-transcript
npm install ytdl-core
npm install --save-dev @types/ytdl-core

# Twitter (if using API)
npm install twitter-api-v2

# Utilities
npm install axios cheerio
```

---

## 🚨 Known Limitations & Risks

1. **PDF OCR**: Scanned PDFs won't have extractable text

   - **Mitigation**: Warn user, provide download link
   - **Future**: Add Tesseract.js OCR support

2. **Twitter API**: Requires authentication, has rate limits

   - **Mitigation**: Implement rate limiting, queue requests
   - **Future**: Consider web scraping fallback

3. **YouTube Transcripts**: Not all videos have transcripts

   - **Mitigation**: Graceful fallback to metadata only
   - **Future**: Generate transcripts with speech-to-text

4. **RSS Duplicates**: Same article from multiple feeds

   - **Mitigation**: Content hash deduplication
   - **Future**: Smart merging of duplicates

5. **Performance**: Large PDFs/long videos may be slow
   - **Mitigation**: Implement timeouts, stream processing
   - **Future**: Chunked processing for large files

---

## 📈 Success Metrics

- [ ] All 5 content types working (article, PDF, RSS, video, Twitter)
- [ ] 320+ tests passing (40+ new tests)
- [ ] Content type auto-detection 95%+ accurate
- [ ] E2E workflow for each content type passing
- [ ] Performance targets met (<15s for all types)
- [ ] Zero regressions in existing functionality
- [ ] GraphQL schema updated with new types

---

## 🗓️ Timeline

- **Day 1-2**: Phase 1 (Content type detection & routing)
- **Day 3-4**: Phase 2 (PDF extraction)
- **Day 5-6**: Phase 3 (RSS feeds)
- **Day 7-8**: Phase 4 (Video transcripts)
- **Day 9-10**: Phase 5 (Twitter threads)
- **Day 11**: Phase 6 (Testing & polish)

**Total Estimate**: 11 days (2.5 weeks)

---

## 🎯 Next Steps

1. Create feature branch: `OM-22-arc-14-additional-content-types` ✅
2. Start with Phase 1 (content type detection)
3. Implement each phase sequentially
4. Write tests as you go (TDD approach)
5. Document API changes
6. Create PR when all phases complete

---

**Status**: ⭐ **PARTIALLY COMPLETE**

- **ARC-014A**: ✅ **COMPLETED** (Phases 1-3: PDF, RSS, Content Type Detection)
- **ARC-014B**: ⏳ **DEFERRED** (Phases 4-5: Video, Twitter)

**Priority**: 🟢 **MEDIUM** - Core RSS and PDF support complete, video/Twitter deferred
**Dependencies**: ARC-013 ✅ (Complete)

**See Also**:

- Unified backlog: `docs/architecture/unified-migration-backlog.md`
- Completed work: `docs/architecture/unified-migration-backlog-complete.md` (ARC-013, ARC-014A)

---

**Document Version**: 2.0
**Last Updated**: November 30, 2025
**Author**: Development Team
