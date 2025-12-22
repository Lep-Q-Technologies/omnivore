# Backlog Recalibration: Path to Production

**Date**: December 20, 2024
**Status**: DEFINITIVE PRODUCTION ROADMAP
**Context**: Realignment with final MVP vision (LOVABLE-PROMPT-FINAL-MVP.md v2.0)

---

## 🎯 Executive Summary

**Current State**: Strong technical foundation (21 ARCs complete, 277+ tests passing)
**Gap**: Design and UX vision has evolved significantly beyond original backlog
**Impact**: ~40% of planned work needs to be reoriented or rewritten
**Path Forward**: 8-10 weeks to production-ready MVP with market differentiators

### **What Changed**:
- ❌ **OLD**: Email-client metaphors (Inbox, Archive, manual folders)
- ✅ **NEW**: AI-first reading tool (Today, Read Later, AI priority)
- ❌ **OLD**: Basic digest page (simple list view)
- ✅ **NEW**: Gamified morning ritual (hero stats, priority sections, 4 actions)
- ❌ **OLD**: Simple highlight export
- ✅ **NEW**: Comprehensive export modal (4 formats, preview, citations)

---

## 📊 Current State Assessment

### **Completed Foundation** ✅ (Solid - 21 ARCs, 277+ tests)

**Backend (90% Complete)**:
- ✅ NestJS architecture, auth, GraphQL, database, queue system
- ✅ Library CRUD, search, filtering, sorting, labels, bulk operations
- ✅ Content extraction (web articles, PDFs, RSS feeds)
- ✅ RSS feed subscriptions (ARC-014A) ⭐
- ✅ Newsletter email ingestion, confirmation tracking (ARC-016 Phase 1) ⭐
- ✅ Highlights backend with color support (4 colors)
- ✅ Reading progress tracking (sentinel-based)
- ✅ Repository pattern, testcontainers, factory pattern

**Frontend (60% Complete)**:
- ✅ Vite setup, authentication flow, protected routes
- ✅ Basic library page (grid view, search, multi-select)
- ✅ Labels page (Linear-inspired table design)
- ✅ Basic reader page (clean typography, content display)
- ✅ Highlights page (color-coded cards, source linking)
- ✅ Subscriptions page (RSS + Newsletters)
- ⚠️ **BUT**: Not aligned with new north star vision

### **Critical Gaps** 🔴 (Blockers to MVP)

#### **1. AI Integration** - **NOT BUILT**
- No AI service exists (OpenAI/Anthropic)
- No summarization pipeline
- No priority scoring algorithm
- No cost management (batching, caching)
- **Estimated Effort**: 2-3 weeks
- **Monthly Cost**: ~$20-50 for cloud (based on usage)

#### **2. Today/Digest Page** - **NEEDS COMPLETE REBUILD**
- Old ARC-017 envisioned simple list view
- NEW: Hero stats, priority sections, DigestCard with 4 actions
- NEW: Real-time progress updates, gamification, streaks
- NEW: Empty state celebration (inbox zero)
- **Estimated Effort**: 2-3 weeks (backend + frontend)

#### **3. Read Later Queue** - **NOT BUILT**
- New tab/folder concept (not in original design)
- Backend: `read_later` boolean field + filtering logic
- Frontend: Tab UI, queue display, remove-from-queue action
- **Estimated Effort**: 1 week

#### **4. Export Modal** - **NOT BUILT**
- 4 formats: Markdown, JSON, Plain Text, CSV
- Preview functionality
- Copy-to-clipboard + download
- Citation formatting (Obsidian-friendly)
- **Estimated Effort**: 1 week

#### **5. Library Tab Restructure** - **NEEDS REFACTOR**
- Current: Inbox, Archive, All, Trash (email vibes)
- NEW: All, Read Later, Starred, Trash (reading-focused)
- Folder logic needs updating
- **Estimated Effort**: 2-3 days

#### **6. Filter Dropdown** - **NEEDS EXPANSION**
- Current: Basic search
- NEW: Comprehensive filter UI (tags, sources, content type, reading time, status)
- Multi-select with AND/OR logic
- Active filter chips
- **Estimated Effort**: 1 week

---

## 🗂️ Reorganized Backlog (Production-Oriented)

### **TIER 1: CRITICAL PATH TO MVP** 🔥

These ARCs are **blocking production launch**. Must be completed sequentially.

---

#### **ARC-019: AI Integration & Summarization** 🆕 **CRITICAL**
- **Status**: Not started
- **Priority**: 🔴 **CRITICAL** (blocks ARC-020)
- **Effort**: 2-3 weeks
- **Dependencies**: None

**Problem**: No AI service exists. Today page requires AI summaries and priority scoring.

**Implementation**:

**Backend**:
- [ ] Create `AIModule` with `SummarizationService` and `PriorityService`
- [ ] Choose AI provider (OpenAI GPT-4o-mini recommended for cost)
- [ ] Implement summarization pipeline:
  - [ ] Extract clean text from `readable_content`
  - [ ] Generate 2-3 sentence summary via AI
  - [ ] Store in `library_item.ai_summary` (new column)
  - [ ] Batch processing (queue job for overnight digest)
- [ ] Implement priority scoring:
  - [ ] Analyze content (topic, author, engagement, recency)
  - [ ] Generate priority score (0-100)
  - [ ] Store in `library_item.ai_priority_score` (new column)
  - [ ] Classification: High (80-100), Medium (50-79), Low (0-49)
- [ ] Cost management:
  - [ ] Token counting and budget tracking
  - [ ] Caching for duplicate content
  - [ ] Batch API calls (reduce costs by 50%)
- [ ] GraphQL API:
  - [ ] Add `ai_summary` and `ai_priority_score` fields to LibraryItem type
  - [ ] Query: `generateSummary(itemId: String!): LibraryItem!` (on-demand)
  - [ ] Mutation: `regenerateDigest(): DigestResult!` (refresh all)

**Database Migrations**:
- [ ] Migration 0202: Add `ai_summary TEXT`, `ai_priority_score INTEGER`, `ai_generated_at TIMESTAMP`
- [ ] Migration 0203: Add indexes for priority-based queries

**Testing**:
- [ ] Unit tests for summarization logic (10+ tests)
- [ ] E2E tests for AI pipeline (5+ tests)
- [ ] Cost estimation tests (ensure <$50/month for 100 items/day)

**Acceptance Criteria**:
- [ ] AI summaries are helpful and accurate (2-3 sentences)
- [ ] Priority scoring aligns with user intent (high = important, low = promotional)
- [ ] Batch processing completes in <5 minutes for 50 items
- [ ] Cost per summary <$0.01 (token optimization)
- [ ] All tests passing

**Cost Estimate**:
- Development: ~$20 (OpenAI testing)
- Production: ~$20-50/month for 100 items/day (depends on usage)

---

#### **ARC-020: Today Page Implementation** 🆕 **CRITICAL**
- **Status**: Not started (replaces old ARC-017)
- **Priority**: 🔴 **CRITICAL** (core MVP feature)
- **Effort**: 2-3 weeks
- **Dependencies**: ARC-019 ✅ (AI summaries)

**Problem**: No Today/Digest page exists. This is THE primary user experience.

**Implementation**:

**Backend**:
- [ ] Create `DigestModule` with `DigestService`
- [ ] GraphQL queries:
  - [ ] `todayDigest(filters: DigestFilters): DigestConnection!`
  - [ ] `digestStats(): DigestStats!` (new items count, triage progress, streak)
- [ ] Digest logic:
  - [ ] Fetch untriaged items (created in last 24h)
  - [ ] Group by priority (high/medium/low based on AI score)
  - [ ] Return with AI summaries
- [ ] Stats calculation:
  - [ ] New items count (created today, not triaged)
  - [ ] Estimated triage time (based on reading times)
  - [ ] Streak calculation (days with inbox zero)
  - [ ] Content breakdown (newsletters, RSS, articles)
- [ ] Triaging actions:
  - [ ] Mutation: `triageItem(itemId: String!, action: TriageAction!): LibraryItem!`
  - [ ] Actions: READ_NOW (open reader), READ_LATER (queue), DISMISS (mark triaged), DELETE (trash)
  - [ ] Update `triaged_at` timestamp, set flags

**Frontend**:
- [ ] Create `TodayPage` component (`/today` route)
- [ ] **Hero Stats Section**:
  - [ ] Greeting (time-based: morning/afternoon/evening)
  - [ ] New items count, estimated time, streak
  - [ ] Content breakdown (newsletters/RSS/videos)
  - [ ] Progress bar (animated, blue→green gradient)
  - [ ] Real-time updates as user triages
- [ ] **DigestCard Component**:
  - [ ] Priority indicator (border color: orange/blue/gray)
  - [ ] Title, metadata (author, source, time, reading time)
  - [ ] AI Summary box (blue tint, sparkle icon)
  - [ ] 4 action buttons: [Read Now] [Read Later] [Dismiss] [Delete]
  - [ ] Tags row (colored chips)
  - [ ] Hover effects, animations
- [ ] **Priority Sections**:
  - [ ] High Priority (always expanded, 3-5 items, orange)
  - [ ] Medium Priority (collapsed by default, majority, blue)
  - [ ] Low Priority (hidden, "Show N items" link, gray)
- [ ] **Triaged Section**:
  - [ ] Bottom section (collapsed by default, green)
  - [ ] Shows recently triaged items with [Undo] action
  - [ ] "Show triaged items" link
- [ ] **Empty State**:
  - [ ] Celebration UI (confetti animation, 2 seconds)
  - [ ] "Inbox Zero Achieved!" message
  - [ ] Stats: Items triaged, time taken, streak
  - [ ] CTA buttons: [Browse All] [Read Later Queue]
- [ ] **Interactions**:
  - [ ] Card fade-out animation (300ms)
  - [ ] Stats update in real-time (debounced)
  - [ ] Toast notifications: "Added to Read Later! [Undo]"
  - [ ] Undo functionality (restore item to digest)

**Testing**:
- [ ] E2E tests for digest flow (10+ tests)
- [ ] Unit tests for stats calculations (5+ tests)
- [ ] Interaction tests (triage actions, undo)

**Acceptance Criteria**:
- [ ] Today page is default landing route
- [ ] Hero stats update in real-time
- [ ] Can triage 15+ items in <10 minutes
- [ ] AI summaries are visible and helpful
- [ ] Priority grouping makes sense
- [ ] Empty state appears on full triage
- [ ] Animations are smooth (60fps)
- [ ] All tests passing

---

#### **ARC-021: Read Later Queue** 🆕 **CRITICAL**
- **Status**: Not started
- **Priority**: 🔴 **CRITICAL** (core workflow)
- **Effort**: 1 week
- **Dependencies**: ARC-020 ✅ (Today page triage actions)

**Problem**: "Read Later" action exists but no dedicated view/queue. Critical user workflow gap.

**Implementation**:

**Backend**:
- [ ] Database migration 0204:
  - [ ] Add `read_later BOOLEAN DEFAULT FALSE`
  - [ ] Add `added_to_read_later_at TIMESTAMP`
  - [ ] Add index on `read_later` for filtering
- [ ] GraphQL API:
  - [ ] Update `libraryItems` query to support `read_later` filter
  - [ ] Mutation: `addToReadLater(itemId: String!): LibraryItem!`
  - [ ] Mutation: `removeFromReadLater(itemId: String!): LibraryItem!`
  - [ ] Mutation: `bulkAddToReadLater(itemIds: [String!]!): BulkActionResult!`
- [ ] Repository updates:
  - [ ] `LibraryItemRepository.findReadLaterQueue(userId)` method
  - [ ] Sort by `added_to_read_later_at DESC` (newest first)

**Frontend**:
- [ ] Add "Read Later" tab to Library page
- [ ] Update LibraryPage tabs:
  - [ ] Current: Inbox, Archive, All, Trash
  - [ ] NEW: All, Read Later, Starred, Trash
  - [ ] Remove Inbox/Archive (email vibes)
- [ ] **Read Later Tab UI**:
  - [ ] Header: "5 items to read" (queue size)
  - [ ] Card modifications:
    - [ ] Remove AI summary (already decided to read)
    - [ ] Show "Added 2 hours ago" instead of publish date
    - [ ] Actions: [Read Now] [Remove from Queue] [Star]
  - [ ] Empty state: "Your reading queue is empty! Browse Today or All to add items."
- [ ] Update DigestCard "Read Later" action:
  - [ ] Sets `read_later = true`
  - [ ] Toast: "Added to Read Later! [Undo]"
  - [ ] Card moves to Triaged section
- [ ] Update Reader page:
  - [ ] After finishing article, show prompt: "Mark as read? [Yes] [Keep in Queue]"
  - [ ] Option to auto-remove from queue on completion

**Testing**:
- [ ] E2E tests for Read Later flow (8+ tests)
- [ ] Unit tests for queue filtering logic

**Acceptance Criteria**:
- [ ] "Read Later" tab works correctly
- [ ] Items can be added/removed from queue
- [ ] Queue size displayed accurately
- [ ] Sort order is correct (newest first)
- [ ] Empty state appears when queue is empty
- [ ] All tests passing

---

#### **ARC-022: Export Modal & Knowledge Synthesis** 🆕 **CRITICAL**
- **Status**: Not started
- **Priority**: 🔴 **CRITICAL** (MVP success criteria #6)
- **Effort**: 1 week
- **Dependencies**: ARC-010C ✅ (Highlights page exists)

**Problem**: Highlights page exists but no export functionality. Critical for knowledge synthesis workflow.

**Implementation**:

**Backend**:
- [ ] Create `ExportModule` with `ExportService`
- [ ] GraphQL query:
  - [ ] `exportHighlights(format: ExportFormat!, filters: HighlightFilters): ExportResult!`
  - [ ] Formats: MARKDOWN, JSON, PLAIN_TEXT, CSV
- [ ] Export logic:
  - [ ] Fetch highlights with filters (tag, date range, color, source)
  - [ ] Include metadata: source citations, article links, timestamps, tags
  - [ ] Format according to selected export type
  - [ ] Return formatted string + metadata
- [ ] **Export Formats**:
  - [ ] **Markdown** (Obsidian-friendly):
    ```markdown
    # Highlights from Omnivore

    ## Article Title
    **Author**: Name
    **Source**: Source Name
    **Date**: December 19, 2024
    **Tags**: #AI #Technology

    > "Quote text here..."

    [View Article](https://omnivore.app/reader/xyz)

    ---
    ```
  - [ ] **JSON** (Developer-friendly):
    ```json
    {
      "exported_at": "2024-12-20T10:30:00Z",
      "total_highlights": 5,
      "highlights": [...]
    }
    ```
  - [ ] **Plain Text** (Simple):
    ```
    HIGHLIGHTS FROM OMNIVORE
    ━━━━━━━━━━━━━━━━━━━━━━
    Article Title
    By Author (Source)
    "Quote text..."
    ```
  - [ ] **CSV** (Spreadsheet-friendly):
    ```csv
    "Text","Article","Author","Source","Date","Tags","URL","Color"
    ```

**Frontend**:
- [ ] **Export Modal Component**:
  - [ ] Trigger: [Export] button on Highlights page
  - [ ] Modal design (600px width):
    - [ ] Format dropdown (Markdown, JSON, Plain Text, CSV)
    - [ ] Include options checkboxes:
      - [ ] ☑ Source citations
      - [ ] ☑ Tags
      - [ ] ☑ Timestamps
      - [ ] ☑ Article links
      - [ ] ☐ Full article text (optional)
    - [ ] Preview section (scrollable, 300px max height, Monaco font)
    - [ ] Actions: [Copy to Clipboard] [Cancel] [Download]
  - [ ] Real-time preview updates on format/option changes
  - [ ] Copy to clipboard with toast: "Copied 12 highlights! 📋"
  - [ ] Download triggers file download with proper filename
- [ ] **Highlights Page Updates**:
  - [ ] Add [Export] button to top-right of page
  - [ ] Export respects active filters (if filtered by tag, export only those)
  - [ ] Show export count in button: [Export (5)]

**Testing**:
- [ ] E2E tests for export flow (6+ tests, one per format)
- [ ] Unit tests for format generators
- [ ] Integration tests for clipboard/download

**Acceptance Criteria**:
- [ ] All 4 export formats work correctly
- [ ] Preview shows accurate output
- [ ] Copy to clipboard works (tested in multiple browsers)
- [ ] Download works with proper filename (e.g., `omnivore-highlights-2024-12-20.md`)
- [ ] Citations are accurate (title, author, link)
- [ ] Markdown format works in Obsidian (tested manually)
- [ ] All tests passing

---

### **TIER 2: HIGH PRIORITY (UX & Polish)** 🟡

These ARCs are **important for MVP quality** but not blocking. Can be done in parallel.

---

#### **ARC-018: Frontend Alignment with North Star** ♻️ **REDESIGNED**
- **Status**: Needs complete rewrite (old version focused on design system)
- **Priority**: 🟡 **HIGH** (UX quality)
- **Effort**: 2 weeks
- **Dependencies**: ARC-019, ARC-020, ARC-021, ARC-022 (all UI components)

**Problem**: Current UI doesn't match north star vision. Need comprehensive alignment.

**Implementation**:

**1. Library Tab Restructure**:
- [ ] Remove "Inbox" and "Archive" tabs (email vibes)
- [ ] Add "All" and "Read Later" tabs
- [ ] Update folder logic:
  - [ ] `folder = null` → Shows in "All"
  - [ ] `read_later = true` → Shows in "Read Later"
  - [ ] `starred = true` → Shows in "Starred"
  - [ ] `folder = 'trash'` → Shows in "Trash"
- [ ] Update LibraryCard to remove AI summary in "Read Later" tab

**2. Comprehensive Filter Dropdown**:
- [ ] Design dropdown UI (320px width, scrollable)
- [ ] Filter sections:
  - [ ] By Tag (multi-select checkboxes)
  - [ ] By Source (newsletters, RSS feeds)
  - [ ] By Content Type (newsletter, RSS, article, video, podcast)
  - [ ] By Reading Time (quick <5min, medium 5-10min, long >10min)
  - [ ] By Reading Status (unread, in progress, completed)
- [ ] Apply filters with AND/OR logic
- [ ] Show active filters as chips above content: [AI ✕] [Newsletters ✕]
- [ ] [Clear All Filters] button
- [ ] Filter count in button: [Filter (3) ▼]

**3. Toolbar Reorganization**:
- [ ] Current: Search box + various scattered controls
- [ ] NEW: [Filter ▼] [Sort: Most Recent ▼] [Comfortable ▼] [⊞] [☰] [Select]
- [ ] Three functional groups:
  - [ ] Content Controls (left): Filter, Sort
  - [ ] View Options (right): Density, Grid/List toggle
  - [ ] Actions (far right): Multi-select mode

**4. DigestCard Component**:
- [ ] Complete implementation (see ARC-020)
- [ ] Ensure reusable across Today + Library pages
- [ ] Add to component library

**5. Reader Page Polish**:
- [ ] Highlight popup (color picker with 6 colors)
- [ ] Smooth highlight interaction (select → popup → save → toast)
- [ ] Optional highlights sidebar (desktop)
- [ ] Reading progress bar (bottom, animated, percentage + time remaining)
- [ ] Beautiful typography (serif body, good line height)

**6. Empty States**:
- [ ] Library: "No items yet. Click +Add to get started."
- [ ] Read Later: "Your reading queue is empty! Browse Today or All."
- [ ] Highlights: "No highlights yet. Start highlighting while reading."
- [ ] Today (inbox zero): Celebration UI with stats

**7. Design System Documentation**:
- [ ] Document all color tokens (brand, backgrounds, text, borders)
- [ ] Document typography scale (sizes, weights, line heights)
- [ ] Document spacing system (4px baseline grid)
- [ ] Document component library (DigestCard, LibraryCard, HighlightCard, Export Modal)
- [ ] Create Storybook or similar for component documentation

**Testing**:
- [ ] Visual regression tests (Percy or similar)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

**Acceptance Criteria**:
- [ ] Library tabs match north star (All, Read Later, Starred, Trash)
- [ ] Filter dropdown provides comprehensive filtering
- [ ] Toolbar is organized and intuitive
- [ ] DigestCard component matches design specs
- [ ] Reader highlighting feels smooth and effortless
- [ ] All empty states are helpful and delightful
- [ ] Design system is documented
- [ ] Accessibility score >90

---

#### **ARC-016 Phase 2: Newsletter Production Deployment** ⏸️ **PAUSED**
- **Status**: Phase 1 complete, Phase 2 pending production testing
- **Priority**: 🟡 **HIGH** (but can deploy with manual testing)
- **Effort**: 1 week (email provider setup + testing)
- **Dependencies**: ARC-016 Phase 1 ✅

**Problem**: Backend complete but needs email provider setup and production testing before Phase 2.

**Recommendation**: **Deploy Phase 1 to production first**, test with real newsletters, then complete Phase 2 incrementally.

**Phase 2 Tasks** (deferred until production testing):
- [ ] Email provider setup (Postmark recommended)
- [ ] DNS configuration (MX, SPF, DKIM)
- [ ] Webhook endpoint setup
- [ ] Unique email address generation per user
- [ ] User email alias display in UI
- [ ] Active subscription list with badges
- [ ] Newsletter section in left nav (if needed)

**Current Status**: Ready for manual testing in production. Phase 2 can be completed incrementally.

---

#### **ARC-009: Frontend Library Polish** 🟡 **95% COMPLETE**
- **Status**: Near complete, final touches needed
- **Priority**: 🟡 **MEDIUM** (UX polish)
- **Effort**: 3-5 days
- **Dependencies**: ARC-018 ✅ (redesign complete)

**Remaining Tasks**:
- [ ] View modes: Grid (current), List (compact), Magazine (large cards)
- [ ] View preference persistence (localStorage)
- [ ] Keyboard shortcuts:
  - [ ] `j/k` - Navigate items
  - [ ] `a` - Archive/unarchive
  - [ ] `e` - Edit labels
  - [ ] `r` - Read/open item
  - [ ] `x` - Select item
  - [ ] `Shift+X` - Select all
  - [ ] `/` - Focus search
  - [ ] `?` - Show shortcuts overlay
- [ ] Keyboard shortcuts overlay (modal on `?` press)
- [ ] Smooth animations (card hover, loading states)

**Acceptance Criteria**:
- [ ] View modes toggle and persist
- [ ] All keyboard shortcuts functional
- [ ] Shortcuts overlay helpful and discoverable
- [ ] Performance acceptable (no jank)

---

### **TIER 3: PRODUCTION INFRASTRUCTURE** 🚀

These ARCs are **critical for production launch** but orthogonal to feature development.

---

#### **ARC-023: CI/CD Pipeline** 🆕 **PRODUCTION BLOCKER**
- **Status**: Not started
- **Priority**: 🔴 **CRITICAL** (production deployment)
- **Effort**: 1 week
- **Dependencies**: None (can be done in parallel)

**Problem**: No automated CI/CD pipeline exists. Manual deployment is error-prone and slow.

**Implementation**:

**1. GitHub Actions Workflow**:
- [ ] Create `.github/workflows/ci.yml`:
  - [ ] Trigger on: push to `main`, pull requests
  - [ ] Jobs: lint, test (unit + E2E), build
  - [ ] Matrix testing: Node 22 LTS
  - [ ] Cache dependencies (yarn, node_modules)
  - [ ] Upload test coverage reports (Codecov)
- [ ] Create `.github/workflows/deploy-staging.yml`:
  - [ ] Trigger on: push to `staging` branch
  - [ ] Deploy to staging environment
  - [ ] Run smoke tests
  - [ ] Send Slack notification
- [ ] Create `.github/workflows/deploy-production.yml`:
  - [ ] Trigger on: tag push (`v*`)
  - [ ] Deploy to production environment
  - [ ] Run smoke tests
  - [ ] Send Slack notification
  - [ ] Create GitHub release

**2. Docker Configuration**:
- [ ] Create production Dockerfile (multi-stage build):
  - [ ] Stage 1: Build dependencies (yarn install)
  - [ ] Stage 2: Build app (yarn build)
  - [ ] Stage 3: Production image (distroless or alpine)
- [ ] Create docker-compose.production.yml:
  - [ ] Services: api-nest, postgres, redis
  - [ ] Health checks for all services
  - [ ] Volume mounts for persistence
  - [ ] Environment variable management
- [ ] Optimize image size (<500MB)
- [ ] Security scanning (Trivy)

**3. Environment Management**:
- [ ] Create `.env.example` with all required variables
- [ ] Document environment variables:
  - [ ] `DATABASE_URL` (PostgreSQL connection)
  - [ ] `REDIS_URL` (Redis connection)
  - [ ] `JWT_SECRET` (authentication)
  - [ ] `OPENAI_API_KEY` (AI summaries)
  - [ ] `EMAIL_PROVIDER_KEY` (newsletter ingestion)
  - [ ] `ALLOWED_ORIGINS` (CORS)
- [ ] Use GitHub Secrets for sensitive values
- [ ] Create `.env.staging` and `.env.production` templates

**4. Database Migrations**:
- [ ] Add migration runner to CI/CD:
  - [ ] Run migrations before deployment
  - [ ] Rollback on failure
  - [ ] Log migration history
- [ ] Create backup/restore scripts
- [ ] Document migration strategy (forward-only, no breaking changes)

**5. Deployment Strategy**:
- [ ] Choose deployment platform:
  - [ ] Option A: Railway (easiest, ~$20/month)
  - [ ] Option B: Render (similar, ~$25/month)
  - [ ] Option C: DigitalOcean App Platform (~$30/month)
  - [ ] Option D: AWS ECS (most control, ~$50/month)
- [ ] Set up staging environment (mirror of production)
- [ ] Set up production environment
- [ ] Configure custom domain (DNS)
- [ ] Set up SSL/TLS certificates (Let's Encrypt)

**6. Monitoring & Logging**:
- [ ] Set up error tracking (Sentry or similar)
- [ ] Set up application monitoring (health checks, uptime)
- [ ] Set up log aggregation (CloudWatch, Datadog, or Grafana)
- [ ] Create alerting rules (email, Slack)

**Testing**:
- [ ] Test CI/CD pipeline with dummy commits
- [ ] Test staging deployment
- [ ] Test production deployment (blue-green or canary)
- [ ] Test rollback procedure

**Acceptance Criteria**:
- [ ] CI pipeline runs on every commit (lint, test, build)
- [ ] Staging deploys automatically on `staging` branch push
- [ ] Production deploys on tag push (`v1.0.0`, etc.)
- [ ] Migrations run successfully before deployment
- [ ] Health checks pass after deployment
- [ ] Rollback works correctly
- [ ] Monitoring and alerting configured

**Cost Estimate**:
- Staging: ~$20/month (smaller instances)
- Production: ~$50/month (depends on platform)
- Monitoring: ~$10/month (Sentry free tier, Datadog starter)
- **Total**: ~$80/month for full infrastructure

---

#### **ARC-024: Open-Source + Cloud Monetization Strategy** 🆕 **BUSINESS MODEL**
- **Status**: Not started (planning phase)
- **Priority**: 🟡 **HIGH** (business sustainability)
- **Effort**: 1-2 weeks (infrastructure setup)
- **Dependencies**: ARC-023 ✅ (CI/CD for deployments)

**Problem**: 200+ forks/clones already. Need clear monetization strategy that balances open-source values with sustainability.

**Strategy**: **Open-Core Model** - Self-hosted free, cloud offering paid

### **Approach**:

**1. Repository Strategy**:
- [ ] **Decision Point**: Keep repo public vs. make private?
  - [ ] **Option A (Recommended)**: Keep public, embrace open-source
    - ✅ Pros: Community growth, transparency, trust, free QA/contributions
    - ❌ Cons: Cloud competitors can fork and compete
    - **Mitigation**: Brand, UX, hosted convenience, faster updates
  - [ ] Option B: Make private until launch
    - ✅ Pros: Prevents early forks, competitive advantage
    - ❌ Cons: Loses open-source credibility, harder to build community
- [ ] **Recommendation**: **Keep public** with clear branding and cloud differentiation

**2. Licensing**:
- [ ] Choose license:
  - [ ] **Option A**: MIT (permissive, allows commercial use)
  - [ ] **Option B**: AGPL (requires derivative works to be open-source)
  - [ ] **Option C**: Business Source License (free for non-commercial, paid for commercial)
  - [ ] **Recommendation**: **AGPL** - Prevents cloud competitors from profiting without contributing back

**3. Open-Source Offering** (Free Forever):
- [ ] Self-hosted deployment (Docker Compose, Kubernetes)
- [ ] Complete source code (frontend + backend)
- [ ] Documentation (setup guides, architecture docs)
- [ ] Community support (GitHub Discussions, Discord)
- [ ] Regular updates (monthly releases)

**4. Cloud Offering** (Paid):
- [ ] **Pricing**: $5-7/month per user (competitive with Pocket Premium, Readwise Reader)
- [ ] **Features**:
  - ✅ Hosted infrastructure (zero DevOps)
  - ✅ Automatic backups and redundancy
  - ✅ Email ingestion (newsletter addresses)
  - ✅ AI summaries included (no API key needed)
  - ✅ Priority support (email, chat)
  - ✅ Faster updates (weekly deploys)
  - ✅ Mobile apps (when built)
  - ✅ Team features (when built) - future upsell
- [ ] **Cost Structure** (for cloud):
  - Infrastructure: ~$50/month (base) + $2/user (scales)
  - AI costs: ~$2/user/month (OpenAI API)
  - Email: ~$1/user/month (Postmark)
  - **Total cost per user**: ~$5/month
  - **Profit margin**: $2/month per user (40%)
  - **Break-even**: 25 users

**5. Implementation**:
- [ ] Create landing page (omnivore.app):
  - [ ] "Open-Source Content Inbox" branding
  - [ ] Features comparison: Self-Hosted (Free) vs. Cloud (Paid)
  - [ ] "Try Cloud Free for 14 days" CTA
  - [ ] "Self-Host Now" CTA (Docker Compose link)
- [ ] Create billing system:
  - [ ] Stripe integration (subscriptions)
  - [ ] Free tier: 14-day trial
  - [ ] Paid tier: $7/month (monthly billing)
  - [ ] Annual pricing: $60/year (save $24)
- [ ] Create self-hosting docs:
  - [ ] Quick start (Docker Compose one-liner)
  - [ ] Advanced setup (Kubernetes, scaling)
  - [ ] Troubleshooting guide
  - [ ] Migration guide (Omnivore → new app)
- [ ] Create cloud onboarding:
  - [ ] Sign up flow (email, password)
  - [ ] Workspace setup (custom subdomain)
  - [ ] Newsletter email address generation
  - [ ] Import from Pocket/Instapaper/Omnivore

**6. Differentiation Strategy** (Cloud vs. Self-Hosted):
- [ ] **Cloud advantages**:
  - Zero setup (vs. 30-60 min setup for self-hosted)
  - No DevOps knowledge needed
  - Automatic updates (vs. manual upgrades)
  - Included AI costs (vs. bring your own API key)
  - Mobile apps (when ready)
- [ ] **Self-Hosted advantages**:
  - Free forever (vs. $7/month)
  - Full data ownership
  - Customizable (modify source code)
  - No vendor lock-in

**7. Community Strategy**:
- [ ] Create Discord server (community support, feedback)
- [ ] GitHub Discussions (feature requests, roadmap)
- [ ] Open roadmap (public Trello/Linear board)
- [ ] Contributor recognition (credits, swag)
- [ ] Regular blog posts (product updates, tutorials)

**8. Marketing Strategy** (Post-Launch):
- [ ] Product Hunt launch
- [ ] Hacker News "Show HN"
- [ ] Reddit: r/selfhosted, r/opensource, r/productivity
- [ ] Twitter: Thread with demo GIF
- [ ] YouTube: Demo video (5-10 min)
- [ ] Blog post: "Why we built this" story

**Acceptance Criteria**:
- [ ] Landing page clearly explains open-source + cloud model
- [ ] Self-hosting docs are comprehensive and tested
- [ ] Billing system works (Stripe integration tested)
- [ ] Cloud offering is competitive ($5-7/month)
- [ ] Cost structure is sustainable (break-even at 25 users)
- [ ] Community channels are active (Discord, GitHub)

**Cost Estimate**:
- Stripe fees: 2.9% + $0.30 per transaction (~$0.50/month per user)
- Marketing: $0 (organic growth via Product Hunt, HN, Reddit)
- **Total**: Included in infrastructure costs

---

#### **ARC-025: Mobile Responsiveness** 🆕 **UX CRITICAL**
- **Status**: Not started
- **Priority**: 🟡 **HIGH** (MVP success criteria #7)
- **Effort**: 1-2 weeks
- **Dependencies**: ARC-018 ✅ (all UI components built)

**Problem**: Current UI is desktop-only. Mobile is critical for "save on phone, read on desktop" workflow.

**Implementation**:

**1. Responsive Breakpoints**:
- [ ] Define breakpoints:
  - [ ] Mobile: 320px - 767px
  - [ ] Tablet: 768px - 1023px
  - [ ] Desktop: 1024px+
- [ ] Use CSS Grid and Flexbox for layouts
- [ ] Mobile-first approach (start mobile, enhance for desktop)

**2. Mobile Navigation**:
- [ ] Bottom navigation bar (5 icons):
  - [ ] Today, Library, Highlights, Feeds, Profile
- [ ] Hide left sidebar on mobile (slide-in on hamburger menu)
- [ ] Sticky top bar with search and add buttons

**3. Touch Interactions**:
- [ ] Swipe gestures:
  - [ ] Swipe left on card: Quick actions (Read Later, Archive, Delete)
  - [ ] Swipe right: Undo
  - [ ] Pull to refresh (Today page, Library page)
- [ ] Touch targets: 44x44pt minimum (WCAG AA)
- [ ] Long-press: Multi-select mode

**4. Mobile Modals**:
- [ ] Full-screen modals on mobile (not overlays)
- [ ] Bottom sheets for quick actions
- [ ] Slide-up animation (native feel)

**5. Mobile Reader**:
- [ ] Full-screen reading (hide navigation)
- [ ] Swipe to navigate (next article, previous article)
- [ ] Tap top: Show toolbar
- [ ] Tap bottom: Show progress bar
- [ ] Double-tap: Zoom in (text reflow)

**6. Mobile Highlights**:
- [ ] Long-press to highlight (mobile pattern)
- [ ] Color picker as bottom sheet (not popup)
- [ ] Highlight sidebar as slide-in panel

**7. Performance Optimization**:
- [ ] Lazy load images (IntersectionObserver)
- [ ] Virtual scrolling for long lists (react-window)
- [ ] Code splitting (React.lazy)
- [ ] Service worker for offline support (optional)

**8. Testing**:
- [ ] Test on real devices (iPhone, Android)
- [ ] Test all breakpoints (Chrome DevTools)
- [ ] Test touch interactions (swipe, long-press)
- [ ] Lighthouse mobile score >90

**Acceptance Criteria**:
- [ ] All pages responsive (320px - 1920px)
- [ ] Touch interactions feel natural
- [ ] Bottom navigation works correctly
- [ ] Swipe gestures implemented
- [ ] Mobile reader is distraction-free
- [ ] Lighthouse mobile score >90
- [ ] No horizontal scroll
- [ ] All text readable without zoom

---

### **TIER 4: POST-MVP ENHANCEMENTS** 🌟

These ARCs are **nice-to-have** but deferred until after launch.

---

#### **ARC-014B: Enhanced Content Types** (Video, Twitter)
- **Status**: Not started
- **Priority**: 🟢 **LOW** (post-MVP)
- **Effort**: 3-4 days (deferred)

**Deferred**: Podcasts, YouTube, Twitter threads

---

#### **ARC-015: Text-to-Speech & Translations**
- **Status**: Not started
- **Priority**: 🟢 **LOW** (future enhancement)
- **Effort**: 5-7 days (deferred)

**Deferred**: TTS, multilingual translation

---

#### **ARC-012 Phase 5: Queue Monitoring**
- **Status**: Infrastructure complete, monitoring deferred
- **Priority**: 🟢 **LOW** (can add incrementally)
- **Effort**: 1-2 days (deferred)

**Deferred**: BullMQ Board UI, Prometheus metrics

---

## 📅 Production Timeline

### **Critical Path to MVP Launch** (8-10 weeks)

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: AI FOUNDATION (Weeks 1-3)                              │
│   ARC-019: AI Integration & Summarization                       │
│   - Week 1: AI service setup, OpenAI integration               │
│   - Week 2: Summarization pipeline, priority scoring           │
│   - Week 3: Testing, cost optimization                          │
│   Output: AI summaries working, priority scores assigned       │
├─────────────────────────────────────────────────────────────────┤
│ PHASE 2: CORE UX (Weeks 3-6) ⚡ **PARALLEL WITH PHASE 1 WEEK 3**│
│   ARC-020: Today Page Implementation                            │
│   ARC-021: Read Later Queue                                     │
│   - Week 3-4: Today page (Hero stats, DigestCard, sections)    │
│   - Week 5: Read Later queue (backend + frontend)              │
│   - Week 6: Interactions, animations, polish                    │
│   Output: Today page works, Read Later queue functional        │
├─────────────────────────────────────────────────────────────────┤
│ PHASE 3: KNOWLEDGE SYNTHESIS (Week 7)                           │
│   ARC-022: Export Modal                                         │
│   - Week 7: Export modal (4 formats, preview, clipboard)       │
│   Output: Highlights exportable to Obsidian/Notion             │
├─────────────────────────────────────────────────────────────────┤
│ PHASE 4: POLISH & PRODUCTION (Weeks 7-10)                       │
│   ARC-018: Frontend Alignment                                   │
│   ARC-023: CI/CD Pipeline                                       │
│   ARC-025: Mobile Responsiveness                                │
│   - Week 7-8: Library tabs, filter dropdown, toolbar (parallel)│
│   - Week 8-9: CI/CD setup, deployment (parallel)               │
│   - Week 9-10: Mobile responsive, final testing                │
│   Output: Production-ready MVP, deployed to staging            │
├─────────────────────────────────────────────────────────────────┤
│ PHASE 5: LAUNCH PREP (Week 10+)                                 │
│   ARC-024: Monetization Infrastructure                          │
│   - Week 10: Landing page, billing, self-hosting docs          │
│   - Week 11: Beta testing, feedback, iteration                 │
│   - Week 12: PUBLIC LAUNCH 🚀                                   │
└─────────────────────────────────────────────────────────────────┘
```

### **Detailed Week-by-Week Breakdown**:

| Week | Focus | Deliverables | Status |
|------|-------|--------------|--------|
| **1-2** | AI Integration (ARC-019) | AI service setup, summarization working | 🔴 Blocking |
| **3** | AI Priority + Today Start (ARC-019 + ARC-020) | Priority scoring, Today page backend | 🔴 Blocking |
| **4** | Today Page (ARC-020) | Hero stats, DigestCard, priority sections | 🔴 Blocking |
| **5** | Read Later Queue (ARC-021) | Read Later tab, queue logic, interactions | 🔴 Blocking |
| **6** | Today Page Polish (ARC-020) | Animations, empty state, real-time updates | 🔴 Blocking |
| **7** | Export Modal (ARC-022) + Frontend Start (ARC-018) | Export working, library tabs restructured | 🟡 High |
| **8** | Frontend Polish (ARC-018) | Filter dropdown, toolbar, reader polish | 🟡 High |
| **9** | CI/CD + Mobile (ARC-023 + ARC-025) | Deployment pipeline, responsive design | 🟡 High |
| **10** | Production Deployment (ARC-023) | Staging deployed, smoke tests passing | 🔴 Blocking |
| **11** | Monetization (ARC-024) | Landing page, billing, docs | 🟡 High |
| **12** | Launch Prep | Beta testing, marketing, launch | 🚀 Launch |

### **Parallelization Opportunities**:

**Weeks 3-6**: AI + Today Page can be done in parallel (different devs or split time)
**Weeks 7-9**: Export Modal + Frontend Polish + CI/CD can be parallelized

**Optimistic Timeline**: 8 weeks (if fully focused, no blockers)
**Realistic Timeline**: 10 weeks (with other commitments, some debugging)
**Pessimistic Timeline**: 12 weeks (with unknowns, scope creep)

---

## 💰 Cost Breakdown (Cloud Offering)

### **Development Costs** (One-Time):
- OpenAI testing: ~$20 (ARC-019)
- Total: **~$20**

### **Infrastructure Costs** (Monthly, per user):
- **Base Infrastructure** (up to 25 users): ~$50/month
  - Railway/Render: $20 (API server)
  - PostgreSQL: $15 (managed database)
  - Redis: $10 (managed cache)
  - S3/R2: $5 (file storage)
- **Variable Costs** (per user):
  - AI summaries: $2/month (100 items/day, OpenAI GPT-4o-mini)
  - Email ingestion: $1/month (Postmark)
  - **Total variable cost per user**: $3/month
- **Monitoring & Error Tracking**: $10/month
  - Sentry (error tracking): Free tier
  - Uptime monitoring: Free tier (Uptime Robot)
  - Logs: CloudWatch/Datadog starter
- **Total Monthly Costs**:
  - 0 users: $60/month (base infrastructure)
  - 10 users: $90/month ($60 base + $30 variable)
  - 25 users: $135/month ($60 base + $75 variable)
  - 50 users: $210/month ($60 base + $150 variable)
  - 100 users: $360/month ($60 base + $300 variable)

### **Revenue Model** (Cloud):
- **Pricing**: $7/month per user
- **Revenue**:
  - 10 users: $70/month (loss: -$20/month)
  - 25 users: $175/month (profit: +$40/month) ✅ **BREAK-EVEN**
  - 50 users: $350/month (profit: +$140/month)
  - 100 users: $700/month (profit: +$340/month)
- **Break-Even**: 25 paying users
- **Target**: 50 users by Month 3 (profit: $140/month)

### **Stripe Fees**:
- 2.9% + $0.30 per transaction
- $7 subscription → $0.50 fee → $6.50 net revenue
- Adjusted profit margins account for this

---

## 🎯 Success Metrics (MVP Launch)

### **Phase 1-3 (Building Core Features)**:
1. ✅ Today page loads and displays AI summaries
2. ✅ Can triage 15+ items in <10 minutes
3. ✅ AI summaries are helpful (user feedback)
4. ✅ Read Later queue works correctly
5. ✅ Highlights export to Obsidian (Markdown format)

### **Phase 4-5 (Production Readiness)**:
6. ✅ Mobile responsive (works on iPhone/Android)
7. ✅ CI/CD pipeline deploys to staging/production
8. ✅ All 300+ tests passing (unit + E2E)
9. ✅ Lighthouse scores >90 (performance, accessibility, SEO)
10. ✅ Self-hosting docs are comprehensive and tested

### **Post-Launch (Month 1-3)**:
11. 🎯 10+ active users (dogfooding + beta)
12. 🎯 80% daily active usage (users return daily)
13. 🎯 Positive feedback: "This saves me time"
14. 🎯 Feature requests align with roadmap
15. 🎯 25+ paying cloud users (break-even)

### **Red Flags** (Failure Indicators):
- 🚩 Users try once and don't return (poor retention)
- 🚩 AI summaries aren't helpful (users still read everything)
- 🚩 Triage takes >15 minutes (not saving time)
- 🚩 Highlights workflow feels clunky (low usage)
- 🚩 Users don't export highlights (knowledge synthesis not working)

---

## 🔥 Critical Decisions Needed (This Week)

### **1. AI Provider**:
- **Options**:
  - OpenAI GPT-4o-mini ($0.0001/token, fast, reliable)
  - Anthropic Claude Haiku ($0.00008/token, better quality?)
  - Local models (Llama, too much work for MVP)
- **Recommendation**: **OpenAI GPT-4o-mini** (proven, easy integration, affordable)
- **Cost**: ~$2/month per user (100 items/day)

### **2. Deployment Platform**:
- **Options**:
  - Railway (easiest, ~$20/month, good DX)
  - Render (similar, ~$25/month, good docs)
  - DigitalOcean App Platform (~$30/month, more control)
  - AWS ECS (most control, ~$50/month, complex)
- **Recommendation**: **Railway** for MVP (easy, fast, affordable)
- **Migration Path**: Can migrate to AWS/DO later if needed

### **3. Email Provider** (for ARC-016 Phase 2):
- **Options**:
  - Postmark (~$15/month for 10,000 emails, clean API)
  - SendGrid (~$20/month, more complex API)
  - AWS SES (~$1/month, most work to set up)
- **Recommendation**: **Postmark** (clean webhook API, great docs)

### **4. Monetization Strategy**:
- **Decision**: Keep repo public (open-source) or private (competitive advantage)?
- **Recommendation**: **Keep public** with AGPL license
  - Pros: Community trust, free QA, contributions
  - Cons: Competitors can fork
  - Mitigation: Brand, UX, hosted convenience

### **5. Repository Forks (200+ already)**:
- **Observation**: 200+ forks/clones already (repo is public)
- **Question**: Is this a problem or an opportunity?
- **Analysis**:
  - ✅ Opportunity: Community interest, validation, potential contributors
  - ⚠️ Risk: Competitors could launch before us
  - **Mitigation**: Focus on speed to market, UX polish, cloud offering
- **Recommendation**: Embrace open-source, move fast to launch

---

## 📋 Next Steps (This Week)

### **Immediate Actions**:

1. **[ ] Review and Approve This Document**:
   - Confirm timeline (8-10 weeks realistic?)
   - Confirm priorities (Today page > Export > Mobile?)
   - Confirm monetization strategy (open-source + cloud?)

2. **[ ] Make Critical Decisions**:
   - AI provider: OpenAI or Anthropic?
   - Deployment: Railway or Render?
   - Email: Postmark or SendGrid?
   - Repo: Keep public or make private?

3. **[ ] Start ARC-019 (AI Integration)**:
   - Set up OpenAI account, get API key
   - Create AIModule scaffold
   - Test summarization with sample articles
   - Estimate costs for 100 items/day

4. **[ ] Plan CI/CD (ARC-023)**:
   - Choose deployment platform
   - Set up GitHub Actions workflow
   - Create staging environment

5. **[ ] Update Backlog**:
   - Archive old ARC-017 (Content Digest) - replaced by ARC-020
   - Update ARC-018 (Design System) - rewrite as Frontend Alignment
   - Create new ARCs (019-025)

### **This Month (December 2024)**:

**Week 1-2** (Now):
- ✅ Strategic recalibration (this document)
- [ ] Critical decisions made
- [ ] ARC-019 started (AI integration)

**Week 3-4** (End of December):
- [ ] ARC-019 complete (AI summaries working)
- [ ] ARC-020 started (Today page backend)
- [ ] CI/CD pipeline setup (ARC-023)

### **Next Month (January 2025)**:

**Week 1-2**:
- [ ] ARC-020 complete (Today page working)
- [ ] ARC-021 complete (Read Later queue)

**Week 3-4**:
- [ ] ARC-022 complete (Export modal)
- [ ] ARC-018 in progress (Frontend alignment)

### **Following Month (February 2025)**:

**Week 1-2**:
- [ ] ARC-018 complete (Frontend polished)
- [ ] ARC-025 complete (Mobile responsive)

**Week 3-4**:
- [ ] ARC-024 complete (Monetization ready)
- [ ] Production deployment (staging + production)
- [ ] Beta testing begins

### **Launch Target**: **Late February / Early March 2025** 🚀

---

## 🎓 Lessons Learned

### **What Worked Well**:
- ✅ Strong technical foundation (21 ARCs, 277+ tests)
- ✅ Modular architecture (easy to add new features)
- ✅ Repository pattern (makes testing easier)
- ✅ Testcontainers (ephemeral databases, fast tests)
- ✅ TypeORM + NestJS (productive, maintainable)

### **What Needs Improvement**:
- ⚠️ Design vision lagged behind implementation (fixed with north star)
- ⚠️ Missing CI/CD from day one (should have started earlier)
- ⚠️ No production deployment strategy until now (should have planned sooner)
- ⚠️ Monetization not considered early (should have thought about this from the start)

### **Going Forward**:
- ✅ Align design vision BEFORE implementation (learned)
- ✅ Set up CI/CD early (doing now)
- ✅ Plan production deployment from the start (doing now)
- ✅ Consider monetization from day one (doing now)

---

## 🚀 Conclusion

**We're at a pivotal moment**:
- ✅ Strong technical foundation (80% complete)
- 🔴 Critical UX gaps (Today page, Read Later, Export)
- 🎯 Clear path to production (8-10 weeks)
- 💰 Viable monetization strategy (open-source + cloud)

**The path forward is clear**:
1. Build AI integration (2-3 weeks)
2. Build Today page + Read Later (3-4 weeks)
3. Add export + polish frontend (2-3 weeks)
4. Deploy to production + launch (1-2 weeks)

**We have everything we need to succeed**:
- Solid codebase (277+ tests, clean architecture)
- Clear vision (LOVABLE-PROMPT-FINAL-MVP.md)
- Proven market (200+ forks/clones already interested)
- Sustainable business model (break-even at 25 users)

**Let's ship this.** 🚀

---

**Next Document**: `unified-migration-backlog-v5.md` (updated active backlog with new ARCs)
**Related Documents**:
- `LOVABLE-PROMPT-FINAL-MVP.md` (design north star)
- `strategic-vision-2025.md` (product vision)
- `unified-migration-backlog.md` (v4.0, current state)
- `unified-migration-backlog-complete.md` (completed ARCs)
