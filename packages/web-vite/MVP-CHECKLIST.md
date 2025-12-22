# Omnivore MVP Checklist & Figma Design Guide

## Executive Summary

**Current State**: 🎉 **Library UI looks fantastic!** Clean, modern, professional design that aligns well with the design system.

**MVP Definition** (from strategic-vision-2025.md):
> "Good Enough to Use Daily" - Can triage 20 newsletters in 5 minutes with AI summaries, capture highlights, export to Obsidian

**Timeline to MVP**: ~2-4 weeks (based on remaining features)

---

## ✅ What's Working Beautifully (Current Screenshot Analysis)

### Library UI - **EXCELLENT** ✨
- ✅ **Visual Design**: Clean, modern dark theme with great information hierarchy
- ✅ **Card Layout**: Title → Source → Tags → Progress is perfectly scannable
- ✅ **Color System**: Vibrant tag chips pop against dark background
- ✅ **Progress Indicators**: Percentage + colored bar is immediately clear (45%, 72%, etc.)
- ✅ **Spacing**: Consistent gaps, good use of whitespace
- ✅ **Typography**: Clean Inter font, readable contrast ratios
- ✅ **Navigation**: Logical left sidebar with Subscriptions (RSS, Newsletters, Podcasts, YouTube)
- ✅ **System Labels**: Star icons for favorites are prominent
- ✅ **User Tags**: Colored pills are visually distinct and beautiful
- ✅ **Top Bar**: Search, Add button, view toggles, Select mode
- ✅ **Filters**: Labels, Most Recent sort, Compact/Grid toggle

### Current Feature Set
- ✅ Library grid view with cards
- ✅ RSS Feed subscriptions (72 items shown)
- ✅ Newsletter subscriptions
- ✅ Podcasts section (6 items)
- ✅ YouTube section (4 items)
- ✅ Favorites (star icons)
- ✅ Archive (1 item)
- ✅ Trash
- ✅ Labels/Tags system (colored chips)
- ✅ Reading progress tracking (with percentages!)
- ✅ Search functionality
- ✅ Multi-select mode ("Select" button visible)
- ✅ Inbox count (14)

---

## 🎯 Critical MVP Gaps (From Strategic Vision 2025)

### 🔴 **PRIORITY 1: AI Digest System** (THE DIFFERENTIATOR)

**Status**: ❌ **NOT BUILT** - This is the #1 MVP feature

**Why Critical**:
> "Every morning, AI digest shows what came in + summaries. Can triage 20 newsletters in 5 minutes (vs. 30 minutes in email)"

**What's Needed** (ARC-018 from strategic-vision-2025.md):

1. **Backend (api-nest)**:
   - [ ] OpenAI/Anthropic integration module
   - [ ] `SummarizationService` (content → 2-3 sentence summary)
   - [ ] `DigestService` (generate daily digest)
   - [ ] Scheduled job: "Generate morning digest at 6am daily"
   - [ ] Add `summary` column to `library_item` table
   - [ ] Add `triage_status` enum: `pending`, `read`, `archived`, `deleted`
   - [ ] Mutation: `bulkTriage(itemIds, action)` for quick actions

2. **Frontend (web-vite)** - **NEW PAGE NEEDED**:
   ```
   /digest or /today
   ```

   **UI Components**:
   - [ ] **DigestView** page component
   - [ ] **DigestCard** component (per article):
     ```
     ┌─────────────────────────────────────────┐
     │ ⭐ The Future of AI: How Large...       │
     │ Paul Graham · Hacker News               │
     │ 2h ago · 12 min                         │
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

3. **Design Specifications**:
   - [ ] Digest page layout (same dark theme)
   - [ ] AI summary text styling (italic? lighter color? badge "AI Summary"?)
   - [ ] Quick action button styles (ghost buttons vs filled?)
   - [ ] "Triaged" state visual (grayed out? hidden? moved to bottom?)
   - [ ] Mobile responsive (swipe actions for quick triage?)

**User Flow**:
1. Morning: Open app → Click "Today" or "Digest" in nav
2. See 10 new items with AI summaries
3. Read summaries → Click "Read Full" on 2 interesting ones
4. Click "Archive" on rest → "Mark all as triaged"
5. Inbox zero in 5 minutes ✅

**Technical Decisions**:
- [ ] **AI Provider**: OpenAI GPT-4o-mini (recommended for cost: ~$2/month for 20 items/day)
- [ ] **Batch vs Real-time**: Generate summaries overnight (scheduled job) vs on-demand?
- [ ] **Summary Length**: 2-3 sentences vs bullet points vs both?
- [ ] **Navigation**: Add "Digest"/"Today" to top tabs or sidebar?

---

### 🔴 **PRIORITY 2: Unified Highlights System**

**Status**: ⚠️ **PARTIALLY BUILT** (highlights work in reader, but no unified view)

**Why Critical**:
> "Can highlight anything while reading → go to /highlights → see all captured insights → export to Obsidian"

**What's Needed** (ARC-019 from strategic-vision-2025.md):

1. **Backend**:
   - [ ] Verify highlight schema supports all content types
   - [ ] Add `content_type` field (article, newsletter, pdf, podcast_transcript)
   - [ ] Query: `highlights(filters: HighlightFilters)` - all highlights across everything
   - [ ] Export mutations: `exportHighlights(format: ExportFormat)`

2. **Frontend** - **NEW PAGE NEEDED**:
   ```
   /highlights
   ```

   **UI Components**:
   - [ ] **HighlightsView** page component
   - [ ] **HighlightCard** component:
     ```
     ┌─────────────────────────────────────────┐
     │ "This is the highlighted text passage   │
     │  that the user marked as important..."  │
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
   - [ ] Filter by: content type, date, label, source
   - [ ] Search within highlights
   - [ ] Export button (Markdown, JSON, Obsidian format)
   - [ ] "Copy highlight" with citation

3. **Reader Improvements**:
   - [ ] Show existing highlights when opening article (currently works?)
   - [ ] "Copy highlight" button with citation
   - [ ] Keyboard shortcut: `H` to view highlights panel
   - [ ] Highlight colors (yellow, green, blue, pink?)

**Design Specifications**:
- [ ] Highlights page layout
- [ ] Highlight card vs list view
- [ ] Citation format (author, source, date)
- [ ] Export button placement and modal
- [ ] Highlight text styling (background color, quote marks?)

---

### 🟡 **PRIORITY 3: Reader Polish** (ARC-010)

**Status**: ⏳ **NEEDS ASSESSMENT** (can't see reader from screenshot)

**What to Check**:
- [ ] Clean typography (serif for article body?)
- [ ] Reading progress indicator (visible in reader?)
- [ ] Highlight functionality (working?)
- [ ] Keyboard shortcuts (`j/k` navigate, `h` highlight, `a` archive)
- [ ] Mobile responsive (text reflow?)
- [ ] Night mode toggle (or always dark?)
- [ ] Font size/width controls

**Design Specifications Needed**:
- [ ] Reader layout mockup
- [ ] Highlight interaction (select → button appears?)
- [ ] Progress bar placement (top? bottom?)
- [ ] Reading controls (font, width, theme)

---

### 🟡 **PRIORITY 4: Export to Obsidian/Notion**

**Status**: ❌ **NOT BUILT**

**What's Needed**:
- [ ] Export highlights as Markdown
- [ ] Format: `[[Source]] > Highlighted text (link to source)`
- [ ] One-click "Export to Obsidian" button in /highlights
- [ ] Settings: Configure export format/template

---

### 🟢 **PRIORITY 5: Polish & Nice-to-Haves**

**Recommended for MVP**:
- [ ] Keyboard shortcuts (documented in UI)
- [ ] Mobile responsive design (all pages)
- [ ] Loading states (skeletons for cards)
- [ ] Empty states (all views)
- [ ] Error handling (toasts, retry buttons)
- [ ] Onboarding/tutorial (first-time user)

**Can Defer Post-MVP**:
- ⏸️ Advanced filters (date range picker, complex queries)
- ⏸️ List/Magazine view modes (grid is fine for MVP)
- ⏸️ Sort preference persistence
- ⏸️ Batch export
- ⏸️ Social features
- ⏸️ Publishing highlights

---

## 📋 Figma Design Checklist

### Pages to Design/Document

1. **✅ Library View** (CURRENT - Already looks great!)
   - Document current design as-is
   - Add hover states (action buttons on card hover)
   - Add multi-select state (checkboxes, action bar)
   - Define mobile responsive behavior

2. **🔴 Digest/Today View** (CRITICAL - NEW PAGE)
   - Card layout with AI summaries
   - Quick action buttons (Read/Archive/Delete)
   - "Mark all as triaged" button
   - Empty state
   - Mobile: Swipe actions?

3. **🔴 Highlights View** (CRITICAL - NEW PAGE)
   - Highlight cards (text + source + metadata)
   - Filters (content type, date, label, source)
   - Export button and modal
   - Search bar
   - Empty state

4. **🟡 Reader View** (NEEDS DESIGN)
   - Article typography
   - Highlight interaction
   - Reading progress
   - Sidebar (TOC, highlights?)
   - Controls (font, width, theme)

5. **🟡 Settings/Preferences** (NEEDS DESIGN)
   - Email addresses (for newsletters)
   - Export settings
   - AI preferences (enable/disable summaries)
   - Appearance (theme, density)
   - Keyboard shortcuts reference

6. **🟢 Mobile Views** (ALL PAGES)
   - Responsive breakpoints
   - Navigation (bottom nav? hamburger?)
   - Touch interactions (swipe, long-press)
   - Mobile-specific UI (action sheets vs modals)

### Component Library to Document

**Existing Components** (document as-is):
- [x] LibraryCard (title, source, tags, progress)
- [x] TagChip (colored pills)
- [x] ProgressBar (with percentage)
- [x] TopBar (search, add, view controls)
- [x] Sidebar (navigation)
- [x] FavoriteIcon (star)

**New Components Needed**:
- [ ] DigestCard (with AI summary section)
- [ ] HighlightCard (quote + citation)
- [ ] QuickActionButtons (Read/Archive/Delete)
- [ ] ExportModal (format selection)
- [ ] EmptyState (generic, reusable)
- [ ] LoadingSkeleton (card placeholders)
- [ ] Toast/Notification (feedback)

### Interaction Patterns to Define

- [ ] **Hover States**: Desktop card hover (show actions)
- [ ] **Multi-Select**: Checkboxes appear, action bar at bottom
- [ ] **Swipe Gestures**: Mobile swipe-to-archive (left) swipe-to-favorite (right)
- [ ] **Long-Press**: Mobile long-press to enter multi-select
- [ ] **Keyboard Shortcuts**: Visual overlay (press `?` to show shortcuts)
- [ ] **Loading**: Skeleton screens vs spinners
- [ ] **Errors**: Toast notifications, retry buttons
- [ ] **Success Feedback**: "Archived 5 items" toast with undo

### Design Tokens to Verify/Update

From current screenshot, these look good:
- ✅ Colors (dark theme, vibrant tags)
- ✅ Typography (Inter font, clear hierarchy)
- ✅ Spacing (consistent gaps)
- ✅ Radius (cards have nice rounded corners)

May need additions for:
- [ ] AI summary text styling (color, italic?)
- [ ] Highlight colors (yellow, green, blue, pink)
- [ ] Success/warning/error colors (for toasts)
- [ ] Focus states (keyboard navigation)

---

## 🎯 MVP Success Criteria (Strategic Vision 2025)

**When we've succeeded**:
1. ✅ All newsletters come into the app (not email inbox) - **DONE** (newsletters in sidebar)
2. ❌ Every morning, AI digest shows what came in + summaries - **CRITICAL NEED**
3. ❌ Can triage 20 newsletters in 5 minutes (vs. 30 minutes in email) - **DEPENDS ON #2**
4. ⚠️ When reading, can highlight and those highlights are easy to find later - **PARTIAL** (highlighting works, need /highlights page)
5. ✅ Can search across all saved content (articles, newsletters) - **DONE** (search visible in top bar)
6. ❌ Can export highlights to Obsidian for synthesis - **NOT BUILT**
7. ❓ Mobile works well enough to save/read on phone - **NEEDS TESTING**

**Current Score**: 2/7 complete, 2/7 partial = ~40% to MVP

**Estimated Work Remaining**:
- AI Digest System: 1-2 weeks
- Unified Highlights: 3-5 days
- Export to Obsidian: 2-3 days
- Mobile responsive: 3-5 days
- Reader polish: 2-3 days

**Total**: ~2-4 weeks to MVP ✨

---

## 📝 Next Steps for Figma File Creation

### Phase 1: Document Current State (1-2 days)
1. **Screenshot Current Pages**:
   - [x] Library view (you have this!)
   - [ ] Reader view
   - [ ] Settings (if exists)
   - [ ] Mobile views

2. **Import to Figma**:
   - Create frames for each page
   - Annotate spacing, colors, fonts
   - Document component instances

3. **Extract Design Tokens**:
   - Colors from screenshot (use color picker)
   - Typography styles (already have design-tokens.css)
   - Spacing values (measure gaps)

### Phase 2: Design New Pages (2-3 days)
1. **Digest/Today Page**:
   - Use existing LibraryCard as base
   - Add AI summary section
   - Design quick action buttons
   - Create empty state

2. **Highlights Page**:
   - Design HighlightCard component
   - Layout filters and search
   - Export modal design

3. **Mobile Responsive**:
   - Adapt all pages to mobile breakpoints
   - Define touch interactions

### Phase 3: Component Library & Handoff (1 day)
1. **Create Component Library**:
   - All reusable components
   - Variants (hover, selected, disabled states)
   - Props documentation

2. **Developer Handoff**:
   - Export design tokens (JSON)
   - Component specs (props, states, behavior)
   - Interaction notes
   - Asset export (icons, illustrations)

---

## 🎨 Design Feedback on Current Screenshot

### What's Exceptional ✨
1. **Visual Hierarchy**: Title is clearly primary, everything else supports it
2. **Color Usage**: Tags are vibrant but not overwhelming, great balance
3. **Information Density**: Shows enough to scan, not cluttered
4. **Progress Indicators**: Percentage + bar is chef's kiss 👌
5. **Dark Theme**: Professional, consistent, good contrast
6. **Spacing**: Breathing room between cards, tight within cards
7. **Typography**: Clean, readable, good line height on titles

### Minor Observations 🤔
1. **Star Icons**: Are they clickable? Could use hover state hint
2. **Tag Overflow**: How do you handle 10+ tags? Truncate? "+3 more"?
3. **Empty States**: What does this look like with 0 items?
4. **Mobile**: How do cards stack on narrow screens?
5. **Hover Actions**: Are archive/delete/label buttons shown on hover (desktop)?
6. **Multi-Select**: How does selection mode look? Checkboxes appear?

### Suggestions for Figma 💡
1. **Design All Card States**:
   - Default (current)
   - Hover (show action buttons?)
   - Selected (checkbox checked, background change?)
   - Processing (skeleton/shimmer?)
   - Failed (error icon, retry button?)

2. **Define Interaction Patterns**:
   - Swipe-to-archive animation
   - Long-press to multi-select
   - Hover to reveal actions
   - Click to open reader

3. **Mobile-First Variants**:
   - Single column layout
   - Touch-friendly buttons (44pt min)
   - Bottom action bar (vs hover)

---

## 🚀 Recommended Implementation Order

1. **Week 1-2: AI Digest System** 🔴
   - Backend: OpenAI integration, summarization service
   - Frontend: /digest page, DigestCard component
   - **THIS IS THE MVP DIFFERENTIATOR**

2. **Week 2-3: Unified Highlights** 🔴
   - Backend: Highlight queries, export mutations
   - Frontend: /highlights page, HighlightCard component
   - Export to Markdown/Obsidian

3. **Week 3-4: Polish** 🟡
   - Mobile responsive (all pages)
   - Keyboard shortcuts
   - Loading/error states
   - Reader improvements

4. **MVP Launch** 🎉
   - Test with 20 newsletters
   - Validate 5-minute triage time
   - Dogfood daily for 1 week
   - Iterate based on usage

---

## 📚 References

- **Strategic Vision**: `docs/architecture/strategic-vision-2025.md`
- **Product Brief**: `docs/architecture/product-brief.md`
- **Active Backlog**: `docs/architecture/unified-migration-backlog.md`
- **Design System**: `packages/web-vite/design/Omnivore Design System_ Developer Handoff v1.0.pdf`
- **Design Tokens**: `packages/web-vite/src/styles/design-tokens.css`

---

**Status**: Library UI looking great! 🎉 Focus next on AI Digest + Highlights to reach MVP.

**Timeline**: 2-4 weeks to "Good Enough to Use Daily"

**Next Action**: Create Figma file with current state + Digest/Highlights page designs
