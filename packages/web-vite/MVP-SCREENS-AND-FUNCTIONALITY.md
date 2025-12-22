# MVP Screens & Functionality Inventory

**Date**: December 20, 2024
**Purpose**: Comprehensive list of all screens and functionality needed for MVP based on backlog analysis
**Status**: Design Planning Phase

---

## Executive Summary

**MVP Definition** (from strategic-vision-2025.md):
> "Good Enough to Use Daily" - Can triage 20 newsletters in 5 minutes with AI summaries, capture highlights, export to Obsidian

**Current Implementation**: ~40-50% of MVP complete
- ✅ Library UI (current screenshot - looking great!)
- ✅ Backend foundation (277+ tests passing)
- ✅ Core CRUD operations
- ✅ RSS feed subscriptions (ARC-014A complete)
- ✅ Newsletter subscriptions backend (ARC-016 Phase 1 complete)
- ❌ AI Digest System (THE killer feature - not built)
- ❌ Highlights unified view (backend works, need /highlights page)
- ❌ Reader page (needs design)
- ❌ Export to Obsidian

---

## Screen Inventory (All Pages Needed for MVP)

### ✅ 1. Library Page - **IN PROGRESS** (Current Design Focus)

**Route**: `/library` or `/` (home)
**Status**: 🟡 **ACTIVE DESIGN** - Current screenshot shows v1, iterating to v2
**Priority**: 🔴 **CRITICAL** - Primary interface

**Current State** (from screenshot):
- Grid layout with cards
- Left sidebar navigation
- Top bar with search, add, notifications
- Folder tabs (Inbox, Favorites, Archive, Trash)
- Card components showing:
  - Title, author, source
  - Star icons (favorites)
  - Tags (colored chips)
  - Progress bars with percentages
  - Timestamps and reading time

**Functionality** (from backlogs):
- ✅ **Display**: Grid/list/magazine views (ARC-009 - 95% complete)
- ✅ **Search**: Full-text search with debounce (ARC-006 complete)
- ✅ **Filters**: Folder, tags, date range (ARC-006 complete)
- ✅ **Sort**: By date, title, author, progress (ARC-006 complete)
- ✅ **Multi-select**: Checkboxes, bulk actions bar (ARC-007 complete)
- ✅ **Actions**: Archive, delete, tag, favorite (ARC-005 complete)
- ✅ **Pagination**: Cursor-based (ARC-004 complete)
- ❌ **Keyboard shortcuts**: j/k nav, a=archive, etc. (ARC-009 - deferred)

**Design Questions**:
- Density modes: Compact/Comfortable/Spacious (from design system)
- Hover states: Three-dot menu (current) vs inline actions?
- Mobile: Touch-friendly, swipe gestures
- Progress indicators: Current percentage style vs time remaining?

**Left Pane Items** (Current in Screenshot):
```
Library
Highlights
Tags (or "Labels" - user prefers "Tags")
Subscriptions
  ├─ RSS Feeds (72 items)
  ├─ Newsletters (Dense Discovery: 3, Hacker Newsletter, Morning Brew: 5, etc.)
  ├─ Podcasts (6 items) ⚠️ **NEEDS DESIGN DECISION**
  └─ YouTube (4 items) ⚠️ **NEEDS DESIGN DECISION**
```

---

### 🔴 2. AI Digest/Today Page - **NOT BUILT** (CRITICAL FOR MVP)

**Route**: `/digest` or `/today`
**Status**: ❌ **NOT STARTED** - THE killer differentiator
**Priority**: 🔴 **CRITICAL** - #1 MVP feature
**ARC**: ARC-018 (from strategic-vision-2025.md Phase 3)

**Purpose**:
> "Every morning, AI digest shows what came in + summaries. Can triage 20 newsletters in 5 minutes (vs. 30 minutes in email)"

**Functionality Needed**:

**Backend** (from strategic-vision-2025.md):
- [ ] OpenAI/Anthropic integration module
- [ ] `SummarizationService` (content → 2-3 sentence summary)
- [ ] `DigestService` (generate daily digest)
- [ ] Scheduled job: "Generate morning digest at 6am daily"
- [ ] Add `summary` column to `library_item` table
- [ ] Add `triage_status` enum: `pending`, `read`, `archived`, `deleted`
- [ ] Mutation: `bulkTriage(itemIds, action)` for quick actions

**Frontend UI Components**:
- [ ] **DigestView** page component
- [ ] **DigestCard** component (per article):
  ```
  ┌─────────────────────────────────────────┐
  │ ⭐ The Future of AI: How Large...       │
  │ Paul Graham · Hacker News               │
  │ 2h ago · 12 min read                     │
  │                                          │
  │ 📝 Summary (AI-generated):              │
  │ This article explores how LLMs are...   │
  │ Key points include cost reduction...    │
  │                                          │
  │ [Read Full] [Archive] [Delete]          │
  │                                          │
  │ React   Programming   AI                │
  └─────────────────────────────────────────┘
  ```
- [ ] Quick action buttons (Read/Archive/Delete)
- [ ] "Mark all as triaged" button
- [ ] Sort by: Date, AI priority (future)
- [ ] Filter by: content type, source
- [ ] Empty state: "All caught up! 🎉"

**Design Specifications Needed**:
- [ ] Digest page layout (same dark theme as library)
- [ ] AI summary text styling (italic? lighter color? "AI Summary" badge?)
- [ ] Quick action button styles (ghost buttons vs filled?)
- [ ] "Triaged" state visual (grayed out? hidden? moved to bottom?)
- [ ] Mobile responsive (swipe actions for quick triage?)

**User Flow**:
1. Morning: Open app → Click "Today" or "Digest" in nav (or make it default page?)
2. See 10-20 new items with AI summaries
3. Read summaries → Click "Read Full" on 2 interesting ones
4. Click "Archive" on rest → "Mark all as triaged"
5. Inbox zero in 5 minutes ✅

**Technical Decisions Needed**:
- AI Provider: OpenAI GPT-4o-mini vs Anthropic Claude
- Batch vs Real-time: Generate summaries overnight (scheduled job) vs on-demand?
- Summary Length: 2-3 sentences vs bullet points vs both?
- Navigation: Add "Digest"/"Today" to top tabs or sidebar? Make it default landing page?

**Cost Estimate**: ~$2/month for 20 items/day (from strategic-vision)

---

### 🔴 3. Highlights Page - **PARTIALLY BUILT** (Backend Done, Need UI)

**Route**: `/highlights`
**Status**: ⚠️ **BACKEND COMPLETE** - Need frontend page
**Priority**: 🔴 **CRITICAL** - Knowledge capture is core MVP
**ARC**: ARC-019 (from strategic-vision-2025.md Phase 4), ARC-010C complete

**Purpose**:
> "Can highlight anything while reading → go to /highlights → see all captured insights → export to Obsidian"

**Backend Status** (ARC-010, ARC-010C - complete):
- ✅ Highlight entity exists and works
- ✅ Highlights work in reader
- ✅ Database schema supports all content types
- ✅ Highlights page exists with basic functionality (ARC-010C complete)
- ⚠️ Needs visual polish and export functionality

**Frontend UI Components** (from MVP-CHECKLIST.md):
- [ ] **HighlightsView** page component (EXISTS - needs polish)
- [ ] **HighlightCard** component:
  ```
  ┌─────────────────────────────────────────┐
  │ "This is the highlighted text passage   │
  │  that the user marked as important...\"  │
  │                                          │
  │ From: Understanding React Server...     │
  │ Dan Abramov · Don Abramov's Blog        │
  │ 1d ago                                   │
  │                                          │
  │ React   Frontend                        │
  │                                          │
  │ [Copy] [Share] [Delete]                 │
  └─────────────────────────────────────────┘
  ```
- [ ] Filter by: content type, date, tag, source
- [ ] Search within highlights
- [ ] **Export button** (Markdown, JSON, Obsidian format) - **CRITICAL**
- [ ] "Copy highlight" with citation

**Reader Integration**:
- ✅ Show existing highlights when opening article (currently works)
- [ ] "Copy highlight" button with citation
- [ ] Keyboard shortcut: `H` to view highlights panel
- [ ] Highlight colors (yellow, green, blue, pink?)

**Design Specifications Needed**:
- [ ] Highlights page layout (similar to library grid?)
- [ ] Highlight card vs list view
- [ ] Citation format (author, source, date)
- [ ] Export button placement and modal
- [ ] Highlight text styling (background color, quote marks?)

---

### 🟡 4. Reader Page - **NEEDS DESIGN** (Basic exists, needs polish)

**Route**: `/reader/:id`
**Status**: ⚠️ **BASIC VERSION EXISTS** (ARC-010A) - Needs design polish
**Priority**: 🔴 **HIGH** - Core reading experience
**ARC**: ARC-010 (backend complete), ARC-010B (frontend polish needed)

**Current State** (ARC-010A complete):
- ✅ Basic reader displays content
- ✅ Article header (title, author, date, URL)
- ✅ Clean typography
- ✅ Back to library button
- ✅ Loading and error states

**Functionality Needed** (ARC-010B):
- [ ] **Highlight creation UI**:
  - [ ] Improve text selection UX
  - [ ] Color picker for highlights
  - [ ] Quick annotation input
  - [ ] Highlight preview before save
- [ ] **Highlight sidebar**:
  - [ ] Show all highlights for current article
  - [ ] Group highlights by color
  - [ ] Sort options (position, date, color)
  - [ ] Jump to highlight in text
- [ ] **Reading progress**:
  - ✅ Progress tracking (backend works)
  - [ ] Visual progress bar in reader (top? bottom?)
  - [ ] Percentage complete indicator
  - [ ] Resume reading from last position
  - [ ] Scroll position persistence
- [ ] **Reading controls**:
  - [ ] Font size controls
  - [ ] Reading width controls (narrow/medium/wide)
  - [ ] Night mode toggle (or always dark?)
- [ ] **Keyboard shortcuts**:
  - [ ] `j/k` navigate
  - [ ] `h` highlight
  - [ ] `a` archive
  - [ ] `?` show shortcuts overlay

**Design Specifications Needed**:
- [ ] Reader layout mockup (two-column with sidebar? single column?)
- [ ] Highlight interaction (select → popup appears?)
- [ ] Progress bar placement (top sticky? bottom?)
- [ ] Reading controls panel design
- [ ] Typography styles (serif for articles? sans-serif for UI?)
- [ ] Sidebar TOC (table of contents)?

**From MVP-CHECKLIST.md**:
- Clean typography (serif for article body?)
- Reading progress indicator visible
- Highlight functionality working smoothly
- Keyboard shortcuts functional
- Mobile responsive (text reflow)
- Font size/width controls

---

### 🟢 5. Settings/Subscriptions Page - **PARTIALLY BUILT**

**Route**: `/settings` or `/subscriptions`
**Status**: ⚠️ **PARTIAL** - RSS works, newsletters backend ready
**Priority**: 🟡 **MEDIUM** - Configuration, not core workflow
**ARC**: ARC-014A (RSS complete), ARC-016 Phase 2 (newsletters pending)

**Current State**:
- ✅ RSS feed subscriptions work (ARC-014A complete)
- ✅ Newsletter confirmation tracking UI (ARC-016 Phase 1)
- ✅ Pending confirmations section (collapsible)
- ✅ Auto-subscription instructions
- ❌ User email alias display (migration exists, not integrated)
- ❌ YouTube subscription management
- ❌ Podcast subscription management

**Functionality Needed**:

**Newsletter Management** (ARC-016 Phase 2):
- [ ] Display user's unique email address prominently
- [ ] Copy-to-clipboard button for email
- [ ] Active newsletter subscriptions list
- [ ] Unsubscribe confirmation modal
- [ ] Instructions for subscribing to newsletters
- [ ] Platform badges (Substack, Beehiiv, Mailchimp, etc.)

**RSS Feed Management** (ARC-014A - complete):
- ✅ "Add RSS Feed" form
- ✅ List subscribed feeds with metadata
- ✅ Unsubscribe option
- ✅ Feed refresh status
- ✅ Item count per feed
- [ ] Feed discovery (detect RSS on websites) - optional
- [ ] Import OPML - optional

**YouTube Subscriptions** ⚠️ **NEEDS DESIGN DECISION**:
- **Current State**: Shows "YouTube: 4" in left pane
- **Question**: How do users subscribe? Options:
  1. **Channel URL**: Paste YouTube channel URL → auto-fetch videos
  2. **RSS Feed**: YouTube channels have RSS feeds (e.g., `/feeds/videos.xml?channel_id=...`)
  3. **Manual**: Just save video URLs individually (no subscription)
  4. **Defer**: Not needed for MVP, remove from nav
- **Recommendation**: Use YouTube RSS feeds (option 2) - Same pattern as RSS subscriptions
  - YouTube channel RSS: `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`
  - Treat like RSS feed subscription
  - Auto-fetch new videos
  - Display in library with video thumbnail

**Podcast Subscriptions** ⚠️ **NEEDS DESIGN DECISION**:
- **Current State**: Shows "Podcasts: 6" in left pane
- **Question**: How do users subscribe? Options:
  1. **Podcast RSS Feed**: Standard podcast RSS feeds (most common)
  2. **OPML Import**: Import from podcast app
  3. **Search**: Search for podcasts by name
  4. **Defer**: Not needed for MVP, remove from nav
- **Recommendation**: Use Podcast RSS feeds (option 1) - Same pattern as RSS subscriptions
  - Podcast feeds are RSS feeds with `<enclosure>` tags for audio
  - Parse RSS, extract audio URLs
  - Store episode metadata
  - Display in library (future: inline player)
- **Note**: strategic-vision-2025.md says podcasts are deferred for MVP
  - "❌ Not building: Podcasts, audiobooks, YouTube (for now)"
  - Consider removing from left nav until post-MVP

**Export Settings** (ARC-019 - future):
- [ ] Obsidian export format configuration
- [ ] Export template customization
- [ ] Default export location

**AI Preferences** (ARC-018 - future):
- [ ] Enable/disable AI summaries
- [ ] AI provider selection (OpenAI vs Anthropic)
- [ ] Summary length preference

**Design Specifications Needed**:
- [ ] Settings page layout (tabs vs single page?)
- [ ] Email address display prominence (hero section?)
- [ ] Subscription list design (table vs cards?)
- [ ] Add subscription form (inline vs modal?)
- [ ] YouTube/Podcast UI (if keeping in MVP)

---

### 🟢 6. Tags Management Page - **COMPLETE**

**Route**: `/tags` (or `/labels`)
**Status**: ✅ **COMPLETE** (ARC-008) with UX polish (Jan 2025)
**Priority**: 🟢 **LOW** - Configuration, works well

**Current State** (from ARC-008 complete):
- ✅ Linear-inspired clean table layout
- ✅ List all tags with colors (small 8px dots)
- ✅ Create new tag (modal overlay)
- ✅ Edit tag inline (modal overlay)
- ✅ Delete tag with confirmation (three-dot menu)
- ✅ Search/filter tags
- ✅ Color picker
- ✅ All CRUD operations working

**No further work needed for MVP** - This page is done!

**Note**: User prefers "Tags" over "Labels" terminology
- Update nav item from "Labels" → "Tags"
- Update UI text throughout

---

## Left Pane Navigation Structure

Based on screenshot and backlog analysis:

```
┌─ NAVIGATION ─────────────────┐
│                               │
│ 📚 Library                    │  ← Main view (current)
│ ✨ Digest (or "Today")        │  ← NEW - AI Digest page
│ 💡 Highlights                 │  ← Exists, needs polish
│ 🏷️  Tags                      │  ← Complete (was "Labels")
│                               │
│ ─── Subscriptions ────────── │  ← Collapsible section
│                               │
│ 📡 RSS Feeds (72)             │  ← Working (ARC-014A)
│                               │
│ 📧 Newsletters                │  ← Backend ready (ARC-016)
│   ├─ Dense Discovery (3)      │
│   ├─ Hacker Newsletter        │
│   ├─ Morning Brew (5)         │
│   └─ The Daily Tech           │
│                               │
│ 🎙️  Podcasts (6) ⚠️           │  ← DECISION NEEDED
│                               │
│ 📺 YouTube (4) ⚠️              │  ← DECISION NEEDED
│                               │
│ ─────────────────────────── │
│                               │
│ 📥 Inbox (14)                 │  ← Folder filter
│ ⭐ Favorites (5)              │  ← Folder filter
│ 📦 Archive (1)                │  ← Folder filter
│ 🗑️  Trash                     │  ← Folder filter
│                               │
└───────────────────────────────┘
```

### Recommendations:

1. **Add "Digest" or "Today"** to top of nav (above Library or as default view)
2. **Keep "Tags"** (rename from "Labels" for consistency)
3. **Subscriptions section** is good structure
4. **YouTube & Podcasts** - Two options:
   - **Option A (Recommended for MVP speed)**: Remove from nav, defer to post-MVP
     - Strategic vision explicitly defers these: "❌ Not building: Podcasts, audiobooks, YouTube (for now)"
     - Simplifies MVP scope
     - Can add later if needed
   - **Option B (Full vision)**: Implement as RSS feeds
     - YouTube channels → RSS feeds
     - Podcasts → RSS feeds with audio enclosures
     - Same subscription pattern as RSS
     - More work but unified approach

**My Recommendation**: **Option A** - Remove Podcasts and YouTube from left nav for MVP
- Focus on core: Newsletters + RSS + AI Digest + Highlights
- These are explicitly deferred in strategic-vision-2025.md
- Can add post-MVP if users request
- Reduces design and implementation scope

---

## Subscription Management UI Design Considerations

### YouTube Subscription Flow (if keeping):

**Option 1: Channel URL Input**
```
┌─────────────────────────────────┐
│ Subscribe to YouTube Channel    │
│                                  │
│ Channel URL or ID:               │
│ ┌─────────────────────────────┐ │
│ │ youtube.com/c/ChannelName   │ │
│ └─────────────────────────────┘ │
│                                  │
│ [Cancel]  [Subscribe]            │
└─────────────────────────────────┘
```

**Option 2: Use RSS Feed Pattern**
```
YouTube channels have RSS feeds:
https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID

→ Just use RSS feed subscription
→ Auto-detect YouTube feeds
→ Display with video thumbnail
```

**Recommendation**: Option 2 (RSS pattern)
- Reuses existing RSS infrastructure
- No new backend code needed
- Unified subscription model

### Podcast Subscription Flow (if keeping):

**Option 1: Podcast RSS Feed**
```
┌─────────────────────────────────┐
│ Subscribe to Podcast             │
│                                  │
│ Podcast RSS Feed:                │
│ ┌─────────────────────────────┐ │
│ │ feeds.example.com/podcast   │ │
│ └─────────────────────────────┘ │
│                                  │
│ [Cancel]  [Subscribe]            │
└─────────────────────────────────┘
```

**Option 2: Podcast Search (more complex)**
```
┌─────────────────────────────────┐
│ Find Podcasts                    │
│ ┌─────────────────────────────┐ │
│ │ 🔍 Search podcasts...        │ │
│ └─────────────────────────────┘ │
│                                  │
│ Results:                         │
│ ○ The Daily (NY Times)           │
│ ○ Lex Fridman Podcast            │
│ ○ Huberman Lab                   │
└─────────────────────────────────┘
```

**Recommendation**: Option 1 (RSS pattern) OR Defer
- Option 1: Reuses RSS infrastructure
- OR: Defer entirely to post-MVP (strategic vision says defer)

---

## Mobile Views (All Pages)

**Priority**: 🟡 **MEDIUM** - Mentioned in strategic vision ("Mobile works well enough")

**Pages needing mobile designs**:
- [ ] Library page (responsive grid → single column)
- [ ] Digest page (swipe for quick triage?)
- [ ] Reader page (full-screen, text reflow)
- [ ] Highlights page (mobile-friendly cards)
- [ ] Settings/Subscriptions (form optimization)

**Mobile Interaction Patterns** (from design system):
- [ ] Responsive breakpoints (320px, 768px, 1024px, 1440px)
- [ ] Navigation (bottom nav? hamburger?)
- [ ] Touch interactions (swipe, long-press)
- [ ] Swipe gestures:
  - Swipe left: Archive
  - Swipe right: Favorite
  - Long-press: Multi-select
- [ ] Mobile-specific UI (action sheets vs modals)
- [ ] Touch targets: minimum 44x44pt (iOS), 48x48dp (Android)

---

## Summary: What to Build Next

### Immediate Priorities (Next 2-4 Weeks):

1. **✅ Library Page Design** (CURRENT FOCUS)
   - Continue iterating on current design
   - Finalize card layout, density modes, hover states
   - Design mobile responsive version
   - **Status**: In progress, looking great!

2. **🔴 AI Digest Page** (HIGHEST PRIORITY after Library)
   - **Why**: THE killer MVP feature
   - **What**: Daily digest with AI summaries + quick triage
   - **Design needed**: Page layout, DigestCard component, quick actions
   - **Backend**: OpenAI integration, summarization service, scheduled jobs
   - **Timeline**: 2-3 weeks (backend + frontend)

3. **🔴 Reader Page** (NEXT after Digest)
   - **Why**: Core reading experience
   - **What**: Polish existing reader, add highlights UI, reading controls
   - **Design needed**: Layout, highlight sidebar, progress bar, controls
   - **Backend**: Mostly done (ARC-010 complete)
   - **Timeline**: 1 week

4. **🔴 Highlights Page Polish** (PARALLEL with Reader)
   - **Why**: Knowledge capture is core MVP
   - **What**: Polish existing page, add export functionality
   - **Design needed**: Card layout, filters, export modal
   - **Backend**: Done (ARC-010C complete)
   - **Timeline**: 3-5 days

5. **🟡 Export to Obsidian** (AFTER Highlights Polish)
   - **Why**: Completes knowledge capture workflow
   - **What**: Export highlights as Markdown with citations
   - **Design needed**: Export button, format selection modal
   - **Backend**: Simple mutation returning formatted Markdown
   - **Timeline**: 2-3 days

### Design Decisions Needed:

1. **Digest Page**: Make it default landing page OR add to top nav?
2. **YouTube/Podcasts**: Keep in MVP (as RSS feeds) OR defer to post-MVP?
3. **Reader Layout**: Single column OR two-column with sidebar?
4. **Highlight Colors**: How many? (Yellow/Green/Blue/Pink or just one?)
5. **Progress Indicators**: Percentage, time remaining, or both?
6. **Navigation**: Current left pane structure OR add top tabs?

### Terminology Update:

- **"Labels" → "Tags"** throughout UI (user preference)
- Update navigation: "Labels" → "Tags"
- Already implemented as "Tags" in backend (entity is still "Label" which is fine)

---

## Timeline to MVP

Based on backlog analysis and strategic vision:

```
Week 1-2: Library Page Design Complete
  - Finalize current design iteration
  - Document component specifications
  - Mobile responsive design
  - Hand off to implementation

Week 2-4: AI Digest System
  - Backend: OpenAI integration (1 week)
  - Frontend: Digest page design + implementation (1 week)
  - Testing: End-to-end with real summaries

Week 4-5: Reader Page Polish
  - Design: Layout, highlights UI, controls
  - Implementation: ARC-010B features
  - Testing: Reading flow end-to-end

Week 5-6: Highlights Page + Export
  - Polish highlights page design
  - Implement export to Obsidian/Markdown
  - Testing: Highlight capture → export workflow

Week 6-7: Mobile Responsive
  - All pages mobile-optimized
  - Touch interactions tested
  - Progressive web app (PWA) setup

Week 7-8: Polish & Dogfooding
  - Use app daily, find friction
  - Fix bugs and UX issues
  - Performance optimization
```

**Total**: ~6-8 weeks to "Good Enough to Use Daily" MVP

---

## Files Referenced

- **Backlog**: `/docs/architecture/unified-migration-backlog.md` (v4.0)
- **Completed**: `/docs/architecture/unified-migration-backlog-complete.md`
- **Vision**: `/docs/architecture/strategic-vision-2025.md`
- **MVP Checklist**: `/packages/web-vite/MVP-CHECKLIST.md`
- **Design System**: `/packages/web-vite/LOVABLE-DESIGN-PROMPT.md`

---

**Next Action**: Review this document, make decisions on open questions (YouTube/Podcasts, Digest placement, etc.), then proceed with design iteration on Library page.
