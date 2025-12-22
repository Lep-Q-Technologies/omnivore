# Design Next Steps: Quick Reference

**Date**: December 20, 2024
**Status**: Ready for design iteration
**Current Focus**: Library page → Digest page → Reader page → Highlights page

---

## 🎯 What We Just Completed

✅ **Backlog Analysis**: Reviewed unified-migration-backlog.md and strategic-vision-2025.md
✅ **Screen Inventory**: Identified all pages needed for MVP (6 main screens)
✅ **Functionality Mapping**: Mapped completed ARCs to UI features
✅ **Left Pane Review**: Analyzed navigation structure and subscription management

**Documents Created**:
1. `MVP-SCREENS-AND-FUNCTIONALITY.md` - Complete screen and functionality inventory
2. `LEFT-PANE-RECOMMENDATIONS.md` - Left pane analysis and subscription UI specs
3. `DESIGN-NEXT-STEPS.md` - This document (quick reference)

---

## 📊 MVP Completion Status

**Overall**: ~40-50% complete

### Backend (API/Database):
- ✅ **90% Complete**: Core infrastructure, authentication, GraphQL, database
- ✅ **ARCs 1-8**: Foundation, library CRUD, search, labels, bulk operations
- ✅ **ARC-013**: Content extraction (web articles, PDFs)
- ✅ **ARC-014A**: RSS feed subscriptions
- ✅ **ARC-016 Phase 1**: Newsletter subscriptions (email ingestion, confirmation tracking)
- ❌ **ARC-016 Phase 2**: Newsletter production deployment (pending email provider setup)
- ❌ **ARC-018** (NEW): AI Digest system
- ❌ **ARC-019**: Highlights export to Obsidian

### Frontend (UI):
- ✅ **Library Page**: 80% complete (current screenshot looks great!)
- ✅ **Tags Page**: 100% complete (Linear-inspired design)
- ⚠️ **Reader Page**: 30% complete (basic version exists, needs polish)
- ⚠️ **Highlights Page**: 50% complete (exists, needs visual polish + export)
- ❌ **Digest Page**: 0% complete (NOT BUILT - highest priority)
- ❌ **Subscriptions Page**: 40% complete (RSS works, newsletters needs Phase 2)

---

## 🎨 Design Priorities (Next 4-6 Weeks)

### Week 1-2: Library Page Finalization (CURRENT)

**Status**: ✅ Already looks fantastic! Just need to finalize details

**Remaining Design Work**:
- [ ] Finalize density modes (Compact/Comfortable/Spacious)
- [ ] Hover state refinement (current three-dot menu works well)
- [ ] Multi-select state visual polish (bottom action bar exists)
- [ ] Mobile responsive breakpoints
- [ ] Empty states (no results, no items)
- [ ] Loading states (skeleton cards)

**Output Needed**:
- Component specifications document
- Before/after comparisons (if changes made)
- Mobile mockups (320px, 768px, 1024px)
- State variations (hover, selected, loading, empty)

### Week 2-3: Digest/Today Page Design 🔴 CRITICAL

**Status**: ❌ Not built - THE killer MVP feature

**Design Work Needed**:
- [ ] Page layout (similar to Library grid or different?)
- [ ] DigestCard component design:
  - Title, author, timestamp, reading time
  - **AI Summary section** (2-3 sentences)
  - Quick action buttons (Read Full, Archive, Delete)
  - Tags
  - Visual treatment for "AI-generated" content (badge? color?)
- [ ] Quick actions UI (ghost buttons? filled buttons? icon buttons?)
- [ ] "Triaged" state (grayed out? hidden? moved to bottom?)
- [ ] "Mark all as triaged" button placement
- [ ] Empty state: "All caught up! 🎉"
- [ ] Mobile: Swipe actions for quick triage?

**Key Questions**:
1. Make Digest the default landing page? (Recommended: Yes)
2. AI summary styling: Italic text? Different color? "AI" badge?
3. Card layout: Same as Library or different?
4. How to show "triaged" state without clutter?

**Output Needed**:
- Full page mockup (desktop + mobile)
- DigestCard component variations (default, triaged, loading)
- Quick action button styles
- AI summary text treatment
- Empty state design

### Week 3-4: Reader Page Polish

**Status**: ⚠️ Basic version exists (ARC-010A), needs polish

**Design Work Needed**:
- [ ] Reader layout (single column? two-column with sidebar?)
- [ ] Article typography (serif body text? sans-serif?)
- [ ] Highlight interaction UX (select → popup? sidebar?)
- [ ] Highlight sidebar design (if two-column layout)
- [ ] Reading progress bar (top sticky? bottom? circular?)
- [ ] Reading controls panel:
  - Font size controls (A- A A+)
  - Reading width (narrow/medium/wide)
  - Theme toggle (if not always dark)
- [ ] Keyboard shortcuts overlay (press `?`)
- [ ] Mobile reader (full-screen, gesture controls?)

**Key Questions**:
1. Single column (focus) or two-column (sidebar with highlights/TOC)?
2. Highlight colors: How many? (Yellow/Green/Blue/Pink or just yellow?)
3. Progress indicator: Percentage text or just visual bar?
4. Controls: Always visible or hidden until hover?

**Output Needed**:
- Reader layout mockup (with/without sidebar)
- Highlight interaction flow
- Controls panel design
- Mobile reader mockup
- Keyboard shortcuts reference card

### Week 4-5: Highlights Page + Export

**Status**: ⚠️ Page exists (ARC-010C), needs visual polish and export

**Design Work Needed**:
- [ ] Highlights page layout (grid like Library? list view?)
- [ ] HighlightCard component design:
  - Highlighted text (quote formatting?)
  - Source citation (title, author, date)
  - Tags from source article
  - Actions (Copy, Share, Delete)
- [ ] Filters panel (content type, date, tags, source)
- [ ] Search within highlights
- [ ] **Export button** and modal design:
  - Format selection (Markdown, JSON, Obsidian)
  - Preview before export
  - Copy to clipboard or download
- [ ] Empty state design

**Key Questions**:
1. Card layout or list layout for highlights?
2. Citation format: How to show source prominently?
3. Export modal: Simple dropdown or full modal with preview?

**Output Needed**:
- Highlights page mockup
- HighlightCard component design
- Export modal design
- Filter panel layout
- Empty state

### Week 5-6: Subscriptions Page (Newsletter + RSS)

**Status**: ⚠️ RSS works (ARC-014A), Newsletter backend ready (ARC-016 Phase 1)

**Design Work Needed**:
- [ ] Page layout (tabs or sections?)
- [ ] Newsletter section:
  - Email address display (prominent, hero section?)
  - Copy-to-clipboard button
  - Instructions for new users
  - Active subscriptions list (table? cards?)
  - Platform badges (Substack, Beehiiv, etc.)
  - Unsubscribe confirmation modal
  - Pending confirmations section (exists, may need polish)
- [ ] RSS section:
  - Add feed form
  - Active feeds list
  - Unsubscribe option
- [ ] Mobile responsive

**Output Needed**:
- Subscriptions page mockup
- Newsletter email address hero section
- Subscription list design (table or cards)
- Add subscription forms
- Unsubscribe confirmation modal

---

## 🗂️ Left Pane Navigation: Final Structure

Based on backlog analysis and strategic vision:

```
✨ Digest (or "Today") ← NEW! Make default landing page
📚 Library
💡 Highlights
🏷️  Tags (rename from "Labels")

─── Subscriptions ────
📧 Newsletters
📡 RSS Feeds
──────────────────────

─── Folders ──────────
📥 Inbox (14)
⭐ Favorites (5)
📦 Archive (1)
🗑️  Trash
──────────────────────
```

**Changes**:
- ✅ Add "Digest" at top (or make default landing)
- ✅ Rename "Labels" → "Tags" (user preference)
- ❌ Remove "Podcasts" and "YouTube" (defer to post-MVP per strategic-vision-2025.md)
- ✅ Keep clean subscription section (Newsletters + RSS)

**Rationale**: Strategic vision explicitly defers podcasts and YouTube to post-MVP. Focus on core value: Newsletters + RSS + AI Digest + Highlights.

---

## 📋 Design Decisions Needed

### Immediate (This Week):

1. **Digest Placement**:
   - [ ] Option A: Default landing page (Recommended)
   - [ ] Option B: Top of nav above Library
   - [ ] Option C: Replace Inbox filter with smart Digest
   - **Recommendation**: Option A - Aligns with "triage in 5 minutes" goal

2. **Podcasts/YouTube**:
   - [ ] Option A: Remove from nav, defer to post-MVP (Recommended)
   - [ ] Option B: Keep but treat as RSS feeds (no special UI)
   - **Recommendation**: Option A - Strategic vision explicitly defers these

3. **Terminology**:
   - [x] User prefers "Tags" over "Labels"
   - [ ] Update nav: "Labels" → "Tags"
   - **Action**: Quick win, update immediately

### Next Week (Digest Page):

4. **AI Summary Styling**:
   - How to visually distinguish AI-generated summaries?
   - Options: Italic text, different color, "AI" badge, all of the above?

5. **Triaged State**:
   - How to show triaged items? Grayed out, hidden, moved to bottom?
   - Should triaged items stay visible or disappear?

6. **Quick Actions**:
   - Button style: Ghost, filled, icon-only?
   - Placement: Bottom of card, top-right, floating action bar?

### Following Week (Reader Page):

7. **Reader Layout**:
   - Single column (focus) or two-column (sidebar)?
   - If sidebar, what goes in it? (Highlights, TOC, both?)

8. **Highlight Colors**:
   - How many colors? (Just yellow or Yellow/Green/Blue/Pink?)
   - How to pick color when highlighting?

---

## 🎯 Success Criteria for MVP

From strategic-vision-2025.md:

1. ✅ All newsletters come into the app (not email inbox) - **Backend ready (ARC-016 Phase 1)**
2. ❌ Every morning, AI digest shows what came in + summaries - **NEED TO BUILD**
3. ❌ Can triage 20 newsletters in 5 minutes (vs. 30 minutes in email) - **Depends on #2**
4. ⚠️ When reading, can highlight and those highlights are easy to find later - **Reader basic, highlights page exists**
5. ✅ Can search across all saved content (articles, newsletters) - **Works (ARC-006)**
6. ❌ Can export highlights to Obsidian for synthesis - **NEED TO BUILD**
7. ❓ Mobile works well enough to save/read on phone - **NEEDS TESTING**

**Current**: 2/7 complete, 2/7 partial = ~40% to MVP

**After design work**: Target 6/7 complete (mobile #7 needs testing with real devices)

---

## 📅 Timeline to MVP

```
Week 1-2: Library Page Complete
  → Finalize current design
  → Document specifications
  → Mobile responsive

Week 2-3: Digest Page Design + Implementation
  → THE killer feature
  → Backend: OpenAI integration
  → Frontend: Digest page

Week 3-4: Reader Page Polish
  → Layout finalization
  → Highlight UX
  → Reading controls

Week 4-5: Highlights + Export
  → Visual polish
  → Export to Obsidian/Markdown
  → Citation formatting

Week 5-6: Subscriptions Page
  → Newsletter email UI
  → RSS feed management
  → Mobile responsive

Week 6-7: Mobile Responsive (All Pages)
  → Breakpoint testing
  → Touch interactions
  → Swipe gestures

Week 7-8: Polish & Dogfooding
  → Use daily, find friction
  → Fix bugs and UX issues
  → Performance optimization
```

**Total**: 6-8 weeks to "Good Enough to Use Daily" MVP

---

## 🔗 Quick Links

**Strategic Documents**:
- `/docs/architecture/strategic-vision-2025.md` - Vision, MVP definition
- `/docs/architecture/unified-migration-backlog.md` - Active backlog (v4.0)
- `/docs/architecture/unified-migration-backlog-complete.md` - Completed work

**Design Documents**:
- `/packages/web-vite/MVP-SCREENS-AND-FUNCTIONALITY.md` - Full screen inventory
- `/packages/web-vite/LEFT-PANE-RECOMMENDATIONS.md` - Nav structure + subscription UI
- `/packages/web-vite/MVP-CHECKLIST.md` - Original MVP analysis
- `/packages/web-vite/LOVABLE-DESIGN-PROMPT.md` - Design system specifications
- `/packages/web-vite/DESIGN-MATERIALS-SUMMARY.md` - Design materials guide
- `/packages/web-vite/design/` - PDF design system documents

**Implementation Status**:
- `/packages/api-nest/BACKLOG-STATUS.md` - Backend status
- `/packages/api-nest/ARC-016-PHASE-1-SUMMARY.md` - Newsletter completion summary

---

## ✅ Next Actions (This Week)

1. **Review Documents**:
   - [ ] Read MVP-SCREENS-AND-FUNCTIONALITY.md
   - [ ] Read LEFT-PANE-RECOMMENDATIONS.md
   - [ ] Confirm decisions on Digest placement and Podcasts/YouTube

2. **Library Page**:
   - [ ] Finalize current design iteration
   - [ ] Document any changes needed
   - [ ] Prepare for implementation handoff

3. **Digest Page**:
   - [ ] Start design exploration
   - [ ] Create initial mockups
   - [ ] Define DigestCard component
   - [ ] Establish AI summary visual treatment

4. **Quick Win**:
   - [ ] Rename "Labels" → "Tags" in nav and UI

---

**Status**: Ready to continue iterating on Library design, then move to Digest page next!
