# Unified Migration Backlog: Express to NestJS

**Last Updated**: November 30, 2025

This is the **active working backlog** containing only pending and in-progress items. Completed items have been moved to `unified-migration-backlog-complete.md`.

**Key Approach**: Start with a new NestJS service (Node.js 22 LTS) running alongside Express, then migrate features slice-by-slice until we can decommission the old services.

---

## 🎯 Current Status Summary

### ✅ **COMPLETED** (20 Major ARCs)
All completed items moved to `unified-migration-backlog-complete.md`. Key achievements:
- **Backend Foundation**: NestJS setup, auth, GraphQL, database integration
- **Core Features**: Library CRUD, search, labels, bulk operations, highlights, reading progress
- **Content Processing**: Web article extraction, PDF extraction, content type detection (ARC-013)
- **RSS Features**: Feed subscriptions, periodic refresh, unsubscribe, filtering, dedicated UI (ARC-014 partial)
- **Highlights UI**: Dedicated highlights page with navigation, color-coded cards, source linking (ARC-010C)
- **Infrastructure**: Queue system (100%), repository pattern, testing infrastructure, scheduler module
- **Frontend**: Vite migration, library UI, reader page, labels management, highlights page
- **Technical Debt**: Constants, repository pattern, Testcontainers + factories

**Test Coverage**: 261+ tests (174 E2E + 87 unit), 100% passing

### 🚨 **CRITICAL ISSUE IDENTIFIED**
- **Test Database Connection**: Tests writing to live database instead of testcontainer
- **Root Cause**: ENV variable mismatch (`TEST_DB_*` vs `TEST_DATABASE_*`)
- **Priority**: Must fix immediately (high risk)
- **Effort**: 2-4 hours

---

## 🎯 Active Backlog (Priority Order)

### 🔴 CRITICAL PRIORITY

#### FIX-001: Test Database Isolation ⚠️ **CRITICAL**
- **Problem**: E2E tests currently write to live development database instead of testcontainer
- **Root Cause**: `test.config.ts` reads `TEST_DATABASE_*` but global-setup sets `TEST_DB_*`
- **Impact**: Data pollution in development database, potential data loss
- **Fix Required**:
  - Update `src/config/test.config.ts` to prioritize `TEST_DB_*` variables
  - Add validation to block production database names (`omnivore`, `omnivore_prod`)
  - Add safety checks with clear error messages
  - Verify all tests use testcontainer
- **Acceptance Criteria**:
  - All tests run against ephemeral testcontainer
  - Production database names blocked with error
  - No data written to development/production databases
  - All 261 tests still passing
- **Dependencies**: None (critical fix)
- **Effort Estimate**: 2-4 hours
- **Status**: ⚠️ **IDENTIFIED - NEEDS IMMEDIATE FIX**
- **Files**:
  - `packages/api-nest/src/config/test.config.ts` (primary fix)
  - `packages/api-nest/test/setup/global-setup.ts` (verify ENV vars)

---

### 🔴 HIGH PRIORITY

_(No critical priority items - core workflow complete!)_

---

### 🟡 MEDIUM PRIORITY

#### ARC-009: Frontend Library Feature Parity ⏳ **95% COMPLETE**
- **Problem/Objective**: Achieve full feature parity with legacy library UI
- **Current State**: Core features complete, polish needed
- **Approach**: Complete remaining UI features and polish

**Remaining Tasks**:
- [ ] Advanced filters UI:
  - [ ] Date range picker (saved date, published date)
  - [ ] Content type filter (article, PDF, etc.)
  - [ ] Read status filter
  - [ ] Has highlights filter
- [ ] Library view modes:
  - [ ] Grid view (current default)
  - [ ] List view (compact)
  - [ ] Magazine view (large cards)
  - [ ] View preference persistence
- [ ] Sort options polish:
  - [ ] Add "Reading Progress" sort
  - [ ] Add "Recently Added" sort
  - [ ] Remember last sort preference
- [ ] Keyboard shortcuts:
  - [ ] `j/k` - Navigate items
  - [ ] `a` - Archive item
  - [ ] `e` - Edit labels
  - [ ] `r` - Read/open item
  - [ ] `x` - Select item
  - [ ] `Shift+X` - Select all
  - [ ] `/` - Focus search
- [ ] Import/export (deferred to separate ARC):
  - [ ] Export library to JSON/CSV
  - [ ] Import from Pocket/Instapaper

**Acceptance Criteria**:
- [ ] All filter combinations work correctly
- [ ] View modes toggle and persist preference
- [ ] Keyboard shortcuts functional and documented
- [ ] Advanced filters performance acceptable
- [ ] UI matches design system

**Dependencies**: None (frontend polish)

**Effort Estimate**: 2-3 days

**Status**: 95% complete, polish remaining

**Priority**: 🟡 **MEDIUM** - UX improvement, not blocking

---

#### ARC-010B: Reading Progress & Highlights (Frontend Polish)
- **Problem/Objective**: Polish highlight and reading progress UI/UX
- **Current State**: Backend complete (ARC-010), basic frontend working
- **Approach**: Enhance UI components for better user experience

**Tasks**:
- [ ] Highlight creation UI:
  - [ ] Improve text selection UX
  - [ ] Color picker for highlights
  - [ ] Quick annotation input
  - [ ] Highlight preview before save
- [ ] Highlight sidebar polish:
  - [ ] Group highlights by color
  - [ ] Sort options (position, date, color)
  - [ ] Search/filter highlights
  - [ ] Jump to highlight in text
- [ ] Reading progress UI:
  - [ ] Visual progress bar in reader
  - [ ] Percentage complete indicator
  - [ ] Resume reading from last position
  - [ ] Scroll position persistence
- [ ] Notebook improvements:
  - [ ] Markdown preview
  - [ ] Rich text editor option
  - [ ] Autosave indicator
  - [ ] Version history (future)

**Acceptance Criteria**:
- [ ] Highlighting feels smooth and intuitive
- [ ] Progress bar accurately reflects reading position
- [ ] Notebook autosaves without data loss
- [ ] All highlight colors work correctly
- [ ] Performance acceptable with 100+ highlights

**Dependencies**: ARC-010 (completed - backend)

**Effort Estimate**: 2-3 days

**Status**: Backend complete, frontend basic working

**Priority**: 🟡 **MEDIUM** - Polish, core functionality working

---

### 🟢 LOW PRIORITY (Future Work)

#### ARC-012 Phase 5: Queue Monitoring & Optimization
- **Problem/Objective**: Add monitoring UI and performance optimizations
- **Current State**: Infrastructure complete (80%), monitoring deferred
- **Approach**: Incremental additions

**Remaining Tasks** (Phase 5):
- [ ] Add BullMQ Board UI endpoint (`/admin/queues`)
- [ ] Implement Prometheus metrics export:
  - [ ] Queue depth by queue
  - [ ] Job latency histograms
  - [ ] Success/failure rates
  - [ ] Worker utilization
- [ ] Create AlertManager rules:
  - [ ] Queue backlog threshold
  - [ ] Job failure rate spike
  - [ ] Worker downtime
- [ ] Add worker concurrency auto-adjustment
- [ ] Performance profiling and optimization
- [ ] Load testing: 100+ concurrent jobs

**Acceptance Criteria**:
- [ ] BullMQ Board accessible to admins
- [ ] Metrics exported to Prometheus
- [ ] Alerts fire correctly
- [ ] Load test passes with target throughput

**Dependencies**: ARC-012 Phases 1-4 (complete), ARC-013 (real content processing)

**Effort Estimate**: 1-2 days

**Status**: Infrastructure complete, monitoring deferred

**Priority**: 🟢 **LOW** - Can add incrementally

---

#### ARC-014B: Enhanced Content Types (Video, Twitter)
- **Problem/Objective**: Support video and Twitter thread content types
- **Approach**: Extend content processing pipeline (PDF and RSS completed in ARC-013/014A)

**Tasks**:
- [ ] Video transcripts:
  - [ ] YouTube transcript API integration
  - [ ] Video metadata extraction
  - [ ] Thumbnail extraction
  - [ ] Vimeo, Wistia, other platforms
- [ ] Twitter threads:
  - [ ] Thread unrolling API
  - [ ] Author attribution
  - [ ] Media preservation
  - [ ] Handle Twitter/X API changes

**Acceptance Criteria**:
- [ ] Video content saves with metadata and transcripts
- [ ] Twitter threads unroll properly
- [ ] Video thumbnails display in library
- [ ] Thread media preserved

**Dependencies**: ARC-013 ✅ (web article extraction complete)

**Effort Estimate**: 3-4 days

**Status**: Not started

**Priority**: 🟢 **LOW** - Enhancement after core types working

---

#### ARC-015: Text-to-Speech & Translations
- **Problem/Objective**: Enable audio playback of articles and multilingual translation
- **Approach**: Integrate TTS models and translation APIs

**Tasks**:
- [ ] Text-to-Speech Integration:
  - [ ] Research TTS options (OpenAI TTS, ElevenLabs, Azure Speech)
  - [ ] Implement audio generation service
  - [ ] Cache generated audio files
  - [ ] Add audio player UI component
  - [ ] Support playback speed controls
  - [ ] Background/offline playback support
- [ ] Translation Service:
  - [ ] Language detection for articles
  - [ ] Translation API integration (Google Translate, DeepL)
  - [ ] TTS in target language
  - [ ] Language preference persistence
  - [ ] Display original + translated text side-by-side
- [ ] Audio Management:
  - [ ] Audio file storage (S3/CDN)
  - [ ] Queue-based generation (async processing)
  - [ ] Progress indicators for generation
  - [ ] Download for offline listening

**Acceptance Criteria**:
- [ ] Users can generate audio from any article
- [ ] Audio playback works in browser
- [ ] Multiple language support for TTS
- [ ] Translation quality acceptable
- [ ] Audio files cached and reused
- [ ] Generation completes in reasonable time (<2 minutes)

**Dependencies**: ARC-013 ✅ (content extraction), ARC-012 ✅ (queue system)

**Effort Estimate**: 5-7 days

**Status**: Not started (backlog item for future consideration)

**Priority**: 🟢 **LOW** - Future enhancement

---

#### ARC-016: Newsletter Subscriptions
- **Problem/Objective**: Support newsletter email subscriptions alongside RSS feeds
- **Approach**: Email forwarding addresses + parsing pipeline

**Tasks**:
- [ ] Email Infrastructure:
  - [ ] Generate unique email addresses per user
  - [ ] Email forwarding service (SendGrid, Postmark)
  - [ ] Email parsing service (extract content from newsletters)
  - [ ] Spam filtering and validation
- [ ] Newsletter Management:
  - [ ] Subscribe/unsubscribe UI similar to RSS feeds
  - [ ] Display newsletters in "Subscriptions" section
  - [ ] Newsletter-specific content extraction
  - [ ] Preserve newsletter formatting
- [ ] Content Processing:
  - [ ] Parse HTML emails
  - [ ] Extract article content from newsletter templates
  - [ ] Handle inline images
  - [ ] Detect sender/publication info
- [ ] UI Integration:
  - [ ] Add "Newsletter" tab to Subscriptions
  - [ ] Subscription management page
  - [ ] Newsletter unread count
  - [ ] Filter by newsletter source

**Acceptance Criteria**:
- [ ] Users can subscribe to newsletters via unique email
- [ ] Newsletters imported automatically
- [ ] Content extracted from common newsletter formats
- [ ] Newsletter items appear in library
- [ ] Unsubscribe works correctly
- [ ] Spam newsletters filtered out

**Dependencies**: ARC-014A ✅ (RSS subscriptions pattern)

**Effort Estimate**: 5-7 days

**Status**: Not started (backlog item for future consideration)

**Priority**: 🟢 **LOW** - Future enhancement

---

#### ARC-017: Content Digest Feature
- **Problem/Objective**: Provide curated digest view of followed content
- **Approach**: Aggregate and prioritize content from subscriptions

**Tasks**:
- [ ] Digest Algorithm:
  - [ ] Score items by recency, source quality, engagement
  - [ ] ML-based relevance scoring (optional)
  - [ ] User preference learning
  - [ ] Deduplication of similar articles
- [ ] Digest Views:
  - [ ] Daily digest page
  - [ ] Weekly digest page
  - [ ] Custom digest (date range, sources)
  - [ ] Digest email option
- [ ] UI Components:
  - [ ] Digest card layout (summary + preview)
  - [ ] "Read Later" quick action
  - [ ] Mark digest as read
  - [ ] Digest preferences settings
- [ ] Scheduling:
  - [ ] Daily/weekly digest generation job
  - [ ] Email digest delivery
  - [ ] Push notification for new digest

**Acceptance Criteria**:
- [ ] Daily digest shows top content from subscriptions
- [ ] Digest algorithm surfaces relevant articles
- [ ] Users can customize digest preferences
- [ ] Email digest option works
- [ ] Digest doesn't include already-read items
- [ ] Performance acceptable for 100+ subscriptions

**Dependencies**: ARC-014A ✅ (RSS subscriptions)

**Effort Estimate**: 4-6 days

**Status**: Not started (backlog item for future consideration)

**Priority**: 🟢 **LOW** - Future enhancement, requires user feedback

---

#### TD-006 Phase 3-5: Test Conversion & Documentation
- **Problem/Objective**: Convert E2E tests to unit tests (test pyramid inversion fix)
- **Current State**: Infrastructure ready (Phases 1-2 complete)
- **Approach**: Incremental conversion as services are refactored

**Remaining Phases**:
- [ ] **Phase 3**: Convert 80-90 E2E tests to unit tests
  - [ ] Identify tests that should be unit tests
  - [ ] Convert using repository mocks
  - [ ] Update factories for unit test usage
  - [ ] Maintain E2E tests for critical flows
- [ ] **Phase 4**: Update documentation
  - [ ] Create `docs/TESTING.md` guide
  - [ ] Document factory patterns
  - [ ] Add mocking examples
  - [ ] Troubleshooting guide
- [ ] **Phase 5**: Deprecate old utilities
  - [ ] Remove TD-001 seed scripts
  - [ ] Archive manual test DB setup docs
  - [ ] Update CI/CD pipelines

**Target Test Distribution**:
- Current: 87 unit (33%) / 174 E2E (67%) = **Inverted pyramid**
- Target: 220 unit (85%) / 25 integration (10%) / 15 E2E (5%) = **Proper pyramid**

**Acceptance Criteria**:
- [ ] Test pyramid corrected (85% unit, 10% integration, 5% E2E)
- [ ] All tests still passing
- [ ] Documentation complete
- [ ] CI/CD pipeline updated

**Dependencies**: TD-003, TD-006 Phases 1-2 (both complete)

**Effort Estimate**: 5-7 days (can be done incrementally)

**Status**: Infrastructure ready, conversion deferred

**Priority**: 🟢 **LOW** - Technical debt, not blocking features

---

## 📋 Backlog Management Notes

### Completed Items
All completed ARCs (001-008, 010A, 010, 010C, 011, 012, 013, 014A) and TDs (003, 004, 006 Phases 1-2) have been moved to `unified-migration-backlog-complete.md` for historical reference.

**Recently Completed** (Nov 29-30, 2025):
- **ARC-013**: Content Extraction & Processing (web articles, PDFs, RSS feeds)
- **ARC-014A**: RSS Feed Subscriptions (subscribe, unsubscribe, periodic refresh, filtering)
- **ARC-010C**: Highlights Page UI (dedicated highlights view, navigation fixes)
- **ARC-012**: Queue Infrastructure (upgraded from 80% to 100% complete)

### Next Review
- **When**: After ARC-009 completion (frontend polish)
- **Focus**: Evaluate next priorities - ARC-014B (video/Twitter), ARC-015 (TTS/translations), or ARC-016 (newsletters)
- **Metrics**: Test coverage, performance benchmarks, user feedback
- **Recent Completions**: ARC-013 ✅, ARC-014A ✅, ARC-010C ✅, ARC-012 ✅ (upgraded to 100%)

### Dependencies
```
FIX-001 → [No dependencies, critical fix]
ARC-009 → Can start anytime (frontend only)
ARC-010B → Requires: ARC-010 ✅
ARC-012 Phase 5 → Requires: ARC-013 ✅ (completed)
ARC-014B → Requires: ARC-013 ✅, ARC-014A ✅
ARC-015 → Requires: ARC-013 ✅, ARC-012 ✅
ARC-016 → Requires: ARC-014A ✅ (RSS subscriptions pattern)
ARC-017 → Requires: ARC-014A ✅ (RSS subscriptions)
TD-006 Phases 3-5 → Can proceed anytime (incremental)
```

### Success Metrics for Next Milestone
- [x] ARC-013 complete (content extraction working) ✅
- [x] ARC-014A complete (RSS subscriptions working) ✅
- [x] ARC-010C complete (Highlights page working) ✅
- [x] Full save-to-read flow working end-to-end ✅
- [x] 261+ tests passing ✅
- [x] User can: register → login → save article → read extracted content → highlight → annotate ✅
- [x] User can: subscribe to RSS feeds → view feed items → unsubscribe ✅
- [x] User can: view all highlights → navigate to source → return to highlights ✅
- [ ] FIX-001 complete (test isolation) - Deferred
- [ ] ARC-009 complete (frontend polish) - In progress (95%)
- [ ] All core user workflows complete

---

**Document Version**: 3.0
**Last Updated**: November 30, 2025
**Managed By**: Development Team
**See Also**: `unified-migration-backlog-complete.md` for completed items
