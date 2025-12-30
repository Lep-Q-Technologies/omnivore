# Unified Migration Backlog: Express to NestJS

**Last Updated**: November 30, 2025

This is the **active working backlog** containing only pending and in-progress items. Completed items have been moved to `unified-migration-backlog-complete.md`.

**Key Approach**: Start with a new NestJS service (Node.js 25.2.1) running alongside Express, then migrate features slice-by-slice until we can decommission the old services.

---

## 🎯 Current Status Summary

### ✅ **COMPLETED** (21 Major ARCs - ARC-016 Phase 1 Added!)

All completed items moved to `unified-migration-backlog-complete.md`. Key achievements:

- **Backend Foundation**: NestJS setup, auth, GraphQL, database integration
- **Core Features**: Library CRUD, search, labels, bulk operations, highlights, reading progress
- **Content Processing**: Web article extraction, PDF extraction, content type detection (ARC-013)
- **RSS Features**: Feed subscriptions, periodic refresh, unsubscribe, filtering, dedicated UI (ARC-014A)
- **Newsletter Features**: Email ingestion, confirmation tracking, auto-subscription, pending UI (ARC-016 Phase 1) ✨ **NEW**
- **Highlights UI**: Dedicated highlights page with navigation, color-coded cards, source linking (ARC-010C)
- **Infrastructure**: Queue system (100%), repository pattern, testing infrastructure, scheduler module
- **Frontend**: Vite migration, library UI, reader page, labels management, highlights page, subscriptions page
- **Technical Debt**: Constants, repository pattern, Testcontainers + factories

**Test Coverage**: 277+ tests (190 E2E + 87 unit), 100% passing (includes 16 new newsletter tests)

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

#### ARC-018: Design System Alignment & UI Polish 🎨 **NEW**

- **Problem/Objective**: Align current implementation with original design intent, establish proper design system foundations
- **Current State**: Initial designs created, implementation diverged during development, need recalibration
- **Approach**: Audit existing UI, align with design tokens, establish consistent patterns

**Context**:

- Current UI has evolved organically during implementation
- Original designs may not match current implementation
- Need unified design language across Library, RSS, Newsletters, Reader
- Design tokens exist but may need alignment
- Left pane navigation pattern established (Library, RSS feeds, Newsletters)
- RSS feed view looks like library feed (same card layout)
- Newsletters open into library
- Need to determine if page-specific views needed or unified library works

**Tasks**:

- [ ] **Design Audit & Documentation**:
  - [ ] Audit current UI implementation (Library, RSS, Newsletters, Reader, Highlights)
  - [ ] Document existing design patterns and components
  - [ ] Identify inconsistencies and divergences from original designs
  - [ ] Screenshot current state for reference
  - [ ] Create comparison with original Figma designs (if available)
- [ ] **Design System Foundation**:
  - [ ] Audit existing design tokens (colors, typography, spacing)
  - [ ] Define proper grid system for responsive layouts
  - [ ] Document component hierarchy and patterns
  - [ ] Create design token documentation
  - [ ] Establish spacing scale (4px/8px base)
  - [ ] Define breakpoints for responsive design
- [ ] **Layout & Navigation**:
  - [ ] Assess left pane navigation pattern (working vs. ideal)
  - [ ] Determine if RSS/Newsletter pages need custom views or library unified view is sufficient
  - [ ] Define card layout patterns (grid/list/magazine views)
  - [ ] Design empty states for each section
  - [ ] Plan mobile responsive behavior
- [ ] **Component Refinement**:
  - [ ] LibraryCard component polish (RSS vs Newsletter vs Article visual distinction)
  - [ ] SubscriptionsSection component alignment
  - [ ] PendingConfirmationsSection component polish
  - [ ] Reader page layout refinement
  - [ ] Highlights page visual polish
- [ ] **Visual Hierarchy & Polish**:
  - [ ] Typography scale alignment
  - [ ] Color palette consistency (especially CTA yellow, grays)
  - [ ] Icon system consistency
  - [ ] Button states and styles
  - [ ] Form element styling
  - [ ] Loading states and skeletons
  - [ ] Animation/transition guidelines
- [ ] **Figma Integration** (if needed):
  - [ ] Import current implementation screenshots to Figma
  - [ ] Create component library in Figma
  - [ ] Design refined versions of key pages
  - [ ] Get stakeholder approval on design direction
  - [ ] Export design tokens from Figma

**Deliverables**:

- [ ] Design system documentation (Markdown)
- [ ] Figma file with current state + refined designs (optional)
- [ ] Component style guide
- [ ] Implementation checklist for visual polish
- [ ] Before/after screenshots
- [ ] Design token updates (if needed)

**Acceptance Criteria**:

- [ ] Clear documentation of design system exists
- [ ] All pages follow consistent visual language
- [ ] Design tokens documented and applied consistently
- [ ] Grid system defined and implemented
- [ ] Component library documented
- [ ] Stakeholder approval on design direction
- [ ] Clear path forward for ongoing design work

**Dependencies**: ARC-016 Phase 1 ✅ (current UI implementation complete)

**Effort Estimate**: 3-5 days (audit + documentation + refinement)

**Status**: Not started - ready to begin

**Priority**: 🟡 **MEDIUM** - Important for polish and user experience, but not blocking functionality

**Notes**:

- This is a recalibration point to align implementation with design intent
- May reveal need for additional design work
- Could spawn follow-up ARCs for specific UI improvements
- Helps establish foundation for future design work
- Could inform decisions about custom views vs. unified library approach

---

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

#### ARC-016: Newsletter Subscriptions ✅ **PHASE 1 COMPLETE** (Phase 2 Pending)

- **Problem/Objective**: Support newsletter email subscriptions alongside RSS feeds
- **Approach**: Email forwarding addresses + parsing pipeline
- **Status**: ⚠️ **PHASE 1 COMPLETE** - Backend, frontend, and testing complete. **NEEDS END-TO-END PRODUCTION TESTING** before Phase 2.

**Phase 1 - Completed Tasks** ✅:

- [x] Email Infrastructure (Backend):
  - [x] Email processor service (BullMQ queue integration)
  - [x] Newsletter email detection (subject/sender patterns)
  - [x] Confirmation email detection and forwarding
  - [x] Email content extraction with Readability
  - [x] HTML sanitization and XSS prevention
  - [x] Newsletter metadata extraction
  - [x] Auto-subscription on first email arrival
  - [x] Platform detection (Substack, Beehiiv, Mailchimp, ConvertKit, Ghost, Buttondown, Revue)
  - [x] Confirmation URL extraction
  - [x] Spam/abuse prevention patterns
- [x] Database & Entities:
  - [x] Subscription entity (unified for RSS + Newsletter)
  - [x] PendingConfirmation entity with analytics
  - [x] Database migrations (0200-0202)
  - [x] TypeORM repository pattern
  - [x] Entity relationships (User → Subscription → LibraryItem)
- [x] Confirmation Tracking:
  - [x] Pending confirmation table
  - [x] Confirmation email forwarding to user's primary email
  - [x] Auto-confirmation on first newsletter arrival
  - [x] Resend confirmation functionality
  - [x] Dismiss confirmation functionality
  - [x] Cron jobs for expiration (daily) and cleanup (weekly)
  - [x] Analytics (conversion rates, time-to-confirm, by platform)
- [x] Newsletter Management:
  - [x] Subscribe/unsubscribe mutations
  - [x] Display newsletters in "Subscriptions" section (web/subscriptions.tsx)
  - [x] Newsletter-specific content extraction
  - [x] Duplicate detection (by sender email)
  - [x] Subscription stats tracking (itemCount, lastFetchedAt)
- [x] GraphQL API:
  - [x] Subscription queries (rssFeeds, newsletterSubscriptions)
  - [x] Subscribe/unsubscribe mutations
  - [x] Pending confirmation queries
  - [x] Pending confirmation mutations (resend, dismiss)
  - [x] GraphQL types for all entities
  - [x] Resolvers with JWT authentication
- [x] Services & Business Logic:
  - [x] NewsletterSubscriptionService
  - [x] PendingConfirmationService with cron jobs
  - [x] RssSubscriptionService (refactored from RssFeedSubscriptionService)
  - [x] EmailProcessorService with confirmation handling
  - [x] Auto-subscription creation
- [x] UI Integration:
  - [x] Pending confirmations integrated into Subscriptions page (web/subscriptions.tsx)
  - [x] PendingConfirmationsSection component (collapsible)
  - [x] Resend and Dismiss buttons with loading states
  - [x] Status indicators (sent, awaiting, expiring)
  - [x] Toast notifications
  - [x] Human-readable time display
  - [x] Auto-subscription instructions (removed manual AddNewsletterForm)
  - [x] Unsubscribe confirmation modal
- [x] Testing & Documentation:
  - [x] E2E tests for email ingestion (16 tests passing)
  - [x] Test environment fixes (crypto polyfill, JSON scalar, entity registration)
  - [x] Comprehensive implementation documentation
  - [x] Backend completion summary (CONFIRMATION-TRACKING-IMPLEMENTATION-COMPLETE.md)
  - [x] Frontend completion summary (PENDING-CONFIRMATIONS-UI-COMPLETE.md)
  - [x] Test environment fixes documentation (TEST-ENVIRONMENT-FIXES.md)
  - [x] UI cleanup summary (UI-CLEANUP-SUMMARY.md)
  - [x] Architecture analysis documents

**Phase 2 - Pending Tasks** (Requires End-to-End Production Testing First):

- [ ] Email Infrastructure (Production):
  - [ ] Email provider setup (Postmark recommended - cleaner webhooks, 80% less code)
  - [ ] DNS configuration (MX, SPF, DKIM)
  - [ ] Webhook endpoint setup
  - [ ] Signature validation
  - [ ] Unique email address generation per user
  - [ ] Email routing configuration
  - [ ] Rate limiting for inbound emails
- [ ] User Management:
  - [ ] User email alias field (migration 0201 exists but not fully integrated)
  - [ ] Email alias generation logic
  - [ ] Email address display in UI
  - [ ] Copy-to-clipboard functionality
  - [ ] Onboarding flow for new users
- [ ] Subscription UI Enhancement:
  - [ ] Newsletter email address prominently displayed
  - [ ] Active subscription list with badges
  - [ ] Filter library by newsletter
  - [ ] Newsletter section in left nav
- [ ] Content Enhancement:
  - [ ] Platform-specific content extractors (Substack, Beehiiv, ConvertKit templates)
  - [ ] Better image handling (inline images, attachments)
  - [ ] Newsletter-specific formatting preservation
  - [ ] Embedded content support (tweets, videos)
- [ ] Testing & Polish:
  - [ ] **END-TO-END PRODUCTION TESTING** ⚠️ **REQUIRED**
  - [ ] E2E tests for confirmation tracking
  - [ ] Integration tests with real email providers
  - [ ] Security review (email validation, injection prevention)
  - [ ] Performance testing (bulk newsletter imports)
  - [ ] Production deployment checklist

**Acceptance Criteria** (Phase 1): ✅ **ALL COMPLETE**

- [x] Email ingestion working (16 tests passing)
- [x] Confirmation tracking implemented
- [x] GraphQL API complete
- [x] Frontend UI integrated
- [x] Build successful (TypeScript compilation)
- [x] Documentation complete
- [x] Auto-subscription works (tested via e2e)
- [x] Pending confirmations display in UI
- [x] Resend/dismiss functionality works

**Acceptance Criteria** (Phase 2): **PENDING PRODUCTION TESTING**

- [ ] Real newsletters importing to production
- [ ] 3+ newsletter platforms supported (Substack, Beehiiv, TechCrunch)
- [ ] <1% confirmation failure rate
- [ ] <500ms average email processing time
- [ ] 0 security vulnerabilities
- [ ] User onboarding flow tested with real users

**Dependencies**: ARC-014A ✅ (RSS subscriptions pattern), ARC-012 ✅ (queue system)

**Effort Estimate**: Phase 1: 7 days (COMPLETE) | Phase 2: 3-5 days (pending production testing)

**Current Blocker**: ⚠️ **NEEDS END-TO-END PRODUCTION TESTING** - All backend and frontend code complete, but requires real email provider setup and production testing before Phase 2 work can proceed.

**Branch**: `OM-23-arc-016-newsletter-subscriptions` (ready for merge after production testing)

**Priority**: 🟡 **MEDIUM** - Phase 1 complete, Phase 2 blocked on production testing

**Documentation**:

- See `packages/api-nest/BACKLOG-STATUS.md` for detailed status
- See `packages/api-nest/CONFIRMATION-TRACKING-IMPLEMENTATION-COMPLETE.md` for backend summary
- See `packages/web/PENDING-CONFIRMATIONS-UI-COMPLETE.md` for frontend summary
- See `packages/api-nest/EMAIL-HANDLING-THIRD-PARTY-OPTIONS.md` for provider comparison

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

All completed ARCs (001-008, 010A, 010, 010C, 011, 012, 013, 014A, 016 Phase 1) and TDs (003, 004, 006 Phases 1-2) have been moved to `unified-migration-backlog-complete.md` for historical reference.

**Recently Completed** (Dec 19, 2024):

- **ARC-016 Phase 1**: Newsletter Subscriptions (email ingestion, confirmation tracking, auto-subscription, UI integration) ✨ **LATEST**
  - Backend: Email processor, confirmation tracking, GraphQL API, cron jobs
  - Frontend: Pending confirmations UI, auto-subscription instructions
  - Testing: 16 e2e tests, test environment fixes
  - Documentation: 4 completion summaries, backlog updates

**Previously Completed** (Nov 29-30, 2024):

- **ARC-013**: Content Extraction & Processing (web articles, PDFs, RSS feeds)
- **ARC-014A**: RSS Feed Subscriptions (subscribe, unsubscribe, periodic refresh, filtering)
- **ARC-010C**: Highlights Page UI (dedicated highlights view, navigation fixes)
- **ARC-012**: Queue Infrastructure (upgraded from 80% to 100% complete)

### Next Review

- **When**: After design recalibration (ARC-018) or before ARC-016 Phase 2
- **Focus**:
  1. **ARC-018**: Design system alignment (audit, documentation, polish) - **RECOMMENDED NEXT**
  2. **ARC-016 Phase 2**: Newsletter production deployment (after end-to-end testing)
  3. **ARC-009**: Frontend library polish (95% complete, can finish anytime)
  4. Future considerations: ARC-014B (video/Twitter), ARC-015 (TTS/translations), ARC-017 (content digest)
- **Key Decision Point**: Should we polish design before Phase 2 deployment, or deploy newsletters then design?
- **Recommendation**: **ARC-018 first** - Establish design foundations while ARC-016 branch awaits production testing
- **Metrics**: Test coverage 277+ (up from 261), design consistency, user feedback
- **Recent Completions**: ARC-016 Phase 1 ✅ (**latest**), ARC-013 ✅, ARC-014A ✅, ARC-010C ✅, ARC-012 ✅

### Dependencies

```
FIX-001 → [No dependencies, critical fix] - Deferred
ARC-018 → Requires: ARC-016 Phase 1 ✅ (current implementation complete) - **READY**
ARC-009 → Can start anytime (frontend only)
ARC-010B → Requires: ARC-010 ✅
ARC-012 Phase 5 → Requires: ARC-013 ✅ (completed)
ARC-014B → Requires: ARC-013 ✅, ARC-014A ✅
ARC-015 → Requires: ARC-013 ✅, ARC-012 ✅
ARC-016 Phase 1 → ✅ COMPLETE (Dec 19, 2024)
ARC-016 Phase 2 → Requires: Production testing complete, email provider setup
ARC-017 → Requires: ARC-014A ✅ (RSS subscriptions)
TD-006 Phases 3-5 → Can proceed anytime (incremental)
```

### Success Metrics for Next Milestone

- [x] ARC-013 complete (content extraction working) ✅
- [x] ARC-014A complete (RSS subscriptions working) ✅
- [x] ARC-010C complete (Highlights page working) ✅
- [x] ARC-016 Phase 1 complete (Newsletter backend/frontend/testing) ✅ **NEW**
- [x] Full save-to-read flow working end-to-end ✅
- [x] 277+ tests passing (up from 261) ✅
- [x] User can: register → login → save article → read extracted content → highlight → annotate ✅
- [x] User can: subscribe to RSS feeds → view feed items → unsubscribe ✅
- [x] User can: view all highlights → navigate to source → return to highlights ✅
- [x] User can: view pending newsletter confirmations → resend → dismiss ✅ **NEW**
- [ ] FIX-001 complete (test isolation) - Deferred
- [ ] ARC-018 complete (design system alignment) - **NEXT RECOMMENDED**
- [ ] ARC-009 complete (frontend polish) - In progress (95%)
- [ ] ARC-016 Phase 2 complete (production deployment) - Pending testing
- [ ] All core user workflows complete

---

**Document Version**: 4.0
**Last Updated**: December 19, 2024
**Managed By**: Development Team
**See Also**: `unified-migration-backlog-complete.md` for completed items

**Changelog**:

- **v4.0** (Dec 19, 2024): ARC-016 Phase 1 complete, ARC-018 added (design system), test count updated to 277+
- **v3.0** (Nov 30, 2024): ARC-013, ARC-014A, ARC-010C, ARC-012 complete
- **v2.0** (Earlier): Major ARCs 001-008 complete
- **v1.0** (Initial): Backlog established
