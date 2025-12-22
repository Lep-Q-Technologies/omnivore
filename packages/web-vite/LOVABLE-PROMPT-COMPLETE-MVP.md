# Omnivore MVP: Complete Design Prompt for Lovable

**Purpose**: Extend our current excellent, professional library design to complete the MVP
**Current State**: Library page looks fantastic! Now we need Digest, Reader, Highlights, and Subscriptions pages
**Design Philosophy**: "Structured for Power, Simple by Default" - Information-dense yet elegant

---

## 🎯 Product Vision

**What We're Building**: A unified content inbox with AI-powered triage and knowledge capture - think Hey.com meets Readwise meets Omnivore, powered by AI.

**The Core Value Proposition**:
> "Open the app every morning, see your digest with AI summaries of everything that came in (newsletters, RSS feeds, articles), triage 20+ items in 5 minutes instead of 30, capture insights with highlights, and export to your notes."

**Target Users**: Knowledge workers, researchers, students, and avid readers who are drowning in content from newsletters, RSS feeds, articles, podcasts, and YouTube.

---

## 📖 User Stories

### Story 1: Morning Triage (THE Killer Use Case)

**As a** busy professional receiving 15+ newsletters daily,
**I want to** see AI-generated summaries of everything that came in overnight,
**So that** I can decide what to read in 5 minutes instead of spending 30 minutes in my email.

**User Flow**:
1. Open app (or navigate to it) → **Digest page** loads (default view OR prominent in nav)
2. See 15 new items with AI summaries (2-3 sentences each)
3. Read summaries → Click "Read Full" on 2 interesting articles
4. Click "Archive" on remaining 13 items
5. Click "Mark all as triaged" → Inbox zero in 5 minutes ✅
6. Feel accomplished, get back to work

**Key Interaction**: Quick triage with minimal friction
- Quick action buttons: Read Full, Archive, Delete
- Keyboard shortcuts: `r` = read, `a` = archive, `d` = delete, `j/k` = navigate
- Triaged items: Grayed out or moved to bottom (explore options)

### Story 2: Deep Reading & Knowledge Capture

**As a** researcher building a knowledge base,
**I want to** read articles with focus, highlight key passages, and export those highlights to my notes,
**So that** I can synthesize insights across multiple sources later.

**User Flow**:
1. From Digest or Library → Click article card → **Reader page** opens
2. Read article with clean typography (serif body text, good line height)
3. Select text → Highlight popup appears → Choose color (yellow/green/blue/pink) → Save
4. Continue reading, highlighting key passages
5. Finish article → Navigate to **Highlights page** (`/highlights`)
6. See all highlights across all articles (searchable, filterable)
7. Click "Export" → Select format (Markdown, JSON, custom) → Choose location → Download or copy
8. Paste into Obsidian/Notion/Logseq → Insights captured ✅

**Key Interaction**: Smooth highlighting workflow
- Text selection feels natural (no lag)
- Color picker is quick (keyboard shortcut `1-4` for colors?)
- Highlights sidebar shows all highlights for current article
- Jump to highlight in text from sidebar

### Story 3: Subscription Management

**As a** user setting up the app,
**I want to** subscribe to newsletters and RSS feeds easily,
**So that** all my content flows into one place automatically.

**User Flow (Newsletters)**:
1. Navigate to **Subscriptions page** → "Newsletters" section
2. See my unique email address: `tim-abc123@omnivore.app` with [Copy] button
3. Read instructions: "Use this email to subscribe to any newsletter"
4. Copy email → Subscribe to Substack newsletter
5. Receive confirmation email → Forward to my primary email
6. Click confirmation link in email
7. First newsletter arrives → Auto-creates subscription
8. See "Dense Discovery (3 articles)" in subscriptions list
9. Articles appear in Library and Digest ✅

**User Flow (RSS Feeds)**:
1. Navigate to **Subscriptions page** → "RSS Feeds" section
2. Paste RSS feed URL: `https://hnrss.org/frontpage`
3. Click "Subscribe" → Feed appears in list
4. New items auto-fetch every hour
5. Articles appear in Library and Digest ✅

**User Flow (YouTube as RSS)**:
1. Same as RSS flow, but paste YouTube channel RSS URL
2. Auto-detect it's YouTube (video thumbnail in library)
3. Click card → Opens YouTube video

**Key Interaction**: Simple subscription, automatic content flow
- Prominent email address display
- One-click copy-to-clipboard
- Clear instructions for first-time users
- Unsubscribe with confirmation modal

### Story 4: Library Organization

**As a** power user with 500+ saved articles,
**I want to** search, filter, tag, and organize my library,
**So that** I can find anything quickly.

**User Flow**:
1. Navigate to **Library page** (current design - already excellent!)
2. Use search: Type "react server components" → Debounced search → Results appear
3. Filter by tag: Click "React" tag → See all React articles
4. Sort: Click "Reading Progress" → Articles sorted by completion %
5. Multi-select: Click "Select" → Checkboxes appear → Select 5 articles → Click "Archive" → Bulk action ✅
6. Swipe (mobile): Swipe left on card → Archive
7. Found what I needed in <1 minute ✅

**Key Interaction**: Fast, keyboard-driven, powerful
- Current design already nails this!
- Just need to ensure consistency across all pages

---

## ✅ What's Already Working (Keep This Excellence!)

### Library Page - **CURRENT STATE** (Screenshot Reference)

**Status**: ✅ **Looks fantastic!** Professional, clean, modern design

**What Works Beautifully**:
- ✅ Dark theme (#1a1a1a background, #2a2a2a cards)
- ✅ Grid layout with clean cards
- ✅ Visual hierarchy: Title → Source → Tags → Progress
- ✅ Colored tag chips (vibrant, pops against dark background)
- ✅ Progress bars with percentages (45%, 72%, etc.) - **Keep this pattern!**
- ✅ Star icons for favorites
- ✅ Top bar: Search, "+ Add", notifications, user avatar
- ✅ Left sidebar navigation (Library, Highlights, Tags, Subscriptions, Folders)
- ✅ Multi-select UI: "Select" button → Checkboxes → Bottom action bar (Archive, Tag, Delete)
- ✅ Hover state: Three-dot menu with actions

**Design Tokens Already Established** (from existing implementation):
```css
/* COLORS */
--color-brand-yellow: #FFD234;
--color-action-blue: #4A9EFF;
--color-bg-primary: #1a1a1a;
--color-bg-secondary: #2a2a2a;
--color-text-primary: #FFFFFF;
--color-text-secondary: #D9D9D9;

/* SPACING (4px baseline grid) */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;

/* TYPOGRAPHY */
--font-primary: 'Inter', sans-serif;
--font-size-heading: 16px;
--font-size-body: 14px;
```

**Maintain This Quality**: All new pages should match this level of polish!

---

## 🎨 Pages to Design (Extend Current Design)

### 1. 🔴 Digest/Today Page - **HIGHEST PRIORITY**

**Route**: `/digest` or `/today`
**Status**: ❌ Not built - THE killer differentiator
**Goal**: Show AI summaries of new content for quick triage

**Layout Options to Explore**:

**Option A: Prominent in Navigation (Top of Sidebar)**
```
Left Sidebar:
  ✨ Digest (or "Today") ← NEW at top
  📚 Library
  💡 Highlights
  🏷️  Tags
  ...
```

**Option B: Replace Inbox as Smart Default**
```
When user opens Library, default view could be:
  - Smart Digest view (unread + AI summaries)
  - Toggle between "Digest" and "All Items"
  - Digest becomes intelligent inbox
```

**Option C: Make it Default Landing Page**
```
User opens app → Digest loads first
Library is one click away in sidebar
Digest is the "home" page
```

**Recommendation**: Explore all three! Show variations. Option C aligns best with "triage in 5 minutes" goal.

---

**DigestCard Component** (Core UI Element):

Must convey:
1. **Article metadata**: Title, author, source, timestamp, reading time
2. **AI Summary**: 2-3 sentence summary (THE key feature!)
3. **Quick actions**: Read Full, Archive, Delete
4. **Tags**: Colored chips (same as Library cards)
5. **Visual state**: Default, Triaged (grayed? hidden? moved to bottom?)

**Layout Mockup** (Describe visually):
```
┌────────────────────────────────────────────────────────┐
│ ⭐ The Future of AI: How Large Language Models...     │ ← Title (16px, bold, white)
│ Paul Graham · Hacker News                              │ ← Author, source (12px, secondary)
│ 2 hours ago · 12 min read                              │ ← Timestamp, reading time (12px, muted)
│                                                        │
│ ┌──────────────────────────────────────────────────┐  │
│ │ 📝 AI Summary:                                    │  │ ← Section header
│ │ This article explores how LLMs are transforming   │  │ ← Summary text
│ │ software development. Key points: cost reduction  │  │   (14px, slightly lighter color?)
│ │ by 10x, new interaction paradigms, and risks.     │  │   (italic? or normal?)
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│ [Read Full] [Archive] [Delete]                        │ ← Quick action buttons
│                                                        │   (ghost buttons? filled? icon+text?)
│ React   Programming   AI                               │ ← Tags (colored chips, same as Library)
└────────────────────────────────────────────────────────┘
```

**Design Questions to Explore**:
1. **AI Summary Visual Treatment**:
   - Option A: Light background box (like code block) with "AI Summary" label
   - Option B: Italic text with subtle "✨ AI" badge
   - Option C: Different text color (lighter gray) with icon
   - **Explore**: Show variations, recommend best

2. **Quick Action Buttons**:
   - Option A: Ghost buttons (outline only)
   - Option B: Filled buttons (solid background)
   - Option C: Icon buttons (compact)
   - **Pattern**: Should match overall design system (likely ghost for secondary actions)

3. **Triaged State**:
   - Option A: Grayed out (opacity 0.5), remains visible
   - Option B: Hidden completely (removed from view)
   - Option C: Moved to "Triaged" section at bottom
   - Option D: Subtle checkmark icon, collapsed height
   - **Explore**: What feels best for "inbox zero" satisfaction?

4. **Card Density**:
   - Should digest cards be same size as Library cards?
   - Or more compact (since summaries add height)?
   - Consider: Comfortable mode by default, compact mode optional

**Top Actions**:
- "Mark all as triaged" button (prominent, top-right?)
- Sort by: Date (default), AI Priority (future)
- Filter by: Content type (newsletter, RSS, article), Source

**Empty State**:
```
┌────────────────────────────────────┐
│         🎉                         │
│    All caught up!                  │
│  You've triaged everything new.    │
│                                    │
│  [Browse Library]                  │
└────────────────────────────────────┘
```

**Mobile Considerations**:
- Swipe left on card: Quick archive
- Swipe right on card: Read full
- Touch-friendly action buttons (48px min height)
- Collapsible AI summary section (tap to expand/collapse?)

---

### 2. 🟡 Reader Page - **Polish Existing**

**Route**: `/reader/:id`
**Status**: ⚠️ Basic version exists, needs design polish
**Goal**: Beautiful, focused reading experience with highlight capture

**Layout Options**:

**Option A: Single Column with Floating Sidebar (Recommended)**
```
┌─────────────────────────────────────────────────────────┐
│ ← Back to Library              [Archive] [Tag] [•••]   │ ← Top bar
├─────────────────────────────────────────────────────────┤
│                                                         │
│  The Future of AI                    │ HIGHLIGHTS ▼  │ │ ← Sidebar (collapsible)
│  Paul Graham                         │                │ │
│  Dec 19, 2024 · 12 min read          │ "This article  │ │
│  ────────────────────────────────    │  explores..."  │ │
│                                      │                │ │
│  This article explores how large     │ "Key points    │ │
│  language models are transforming    │  include..."   │ │
│  software development in ways that   │                │ │
│  were unimaginable just two years    │ [Jump to ↑]    │ │
│  ago. The implications for           │                │ │
│  developers are profound...          │ ───────────    │ │
│                                      │                │ │
│  [Article content continues...]      │ 3 highlights   │ │
│                                      │                │ │
├──────────────────────────────────────┴────────────────┤
│ ████████████░░░░░░░░ 72% complete                     │ ← Progress bar
└─────────────────────────────────────────────────────────┘
```

**Option B: Full-Width Single Column (Focus Mode)**
```
┌─────────────────────────────────────────────┐
│ ← Back          [Highlights] [Controls] [•] │ ← Minimal top bar
├─────────────────────────────────────────────┤
│                                             │
│           The Future of AI                  │ ← Centered, max-width 680px
│           Paul Graham                       │
│           Dec 19, 2024                      │
│           ─────────────────                 │
│                                             │
│  This article explores how large language  │
│  models are transforming software...        │
│                                             │
│  [Content continues...]                     │
│                                             │
├─────────────────────────────────────────────┤
│ ████████████░░░░░░░░ 72%                   │
└─────────────────────────────────────────────┘
```

**Recommendation**: Show both! Option A for power users, Option B for focused reading.

---

**Highlight Interaction** (Critical UX):

**Selection Flow**:
1. User selects text
2. Popup appears above selection: `[🎨 Highlight] [📝 Note] [✕]`
3. Click "Highlight" → Color picker appears: `[Yellow] [Green] [Blue] [Pink]`
4. Choose color → Highlight saved → Text background changes
5. Popup dismisses

**Popup Design**:
```
     ┌──────────────────────────┐
     │ 🎨 💬 📋 ✕             │  ← Icon buttons
     │ Highlight Note Copy     │  ← Labels (optional)
     └──────────────────────────┘
           ▼  (arrow pointing to selected text)
```

**Highlight Colors** (From User Preference: "Many"):
- 🟡 Yellow (default, classic)
- 🟢 Green (positive, agree)
- 🔵 Blue (neutral, note)
- 🟣 Purple (question, explore)
- 🔴 Red (important, critical)
- 🟠 Orange (disagree, challenge)

**Keyboard Shortcuts**:
- `H` - Highlight selected text (cycles through colors)
- `1-6` - Highlight with specific color
- `N` - Add note to highlight
- `J/K` - Next/previous highlight
- `?` - Show shortcuts overlay

**Highlights Sidebar** (if Option A layout):
- Shows all highlights for current article
- Grouped by color (optional toggle)
- Click highlight → Jumps to that position in article
- Hover highlight → Preview surrounding context
- Delete button (trash icon on hover)

**Reading Controls** (Floating panel or persistent?):
```
┌─────────────────────────┐
│ A-  A  A+              │ ← Font size
│ ─── ── ──              │ ← Reading width
│ 🌙 ☀️                 │ ← Theme (if not always dark)
└─────────────────────────┘
```

**Progress Bar** (Bottom, always visible):
- Visual bar: 0% → 100% (gradient from blue to green?)
- Percentage text: "72% complete" or "3 min remaining"
- Updates as user scrolls
- Click bar → Jump to position

**Article Typography** (Beautiful reading):
- Serif font for body: Georgia, Merriweather, or similar
- Sans-serif (Inter) for UI elements
- Font size: 18-20px (comfortable reading)
- Line height: 1.6-1.8 (good readability)
- Max width: 680px (optimal line length ~70 characters)
- Paragraph spacing: 1.5em

**Mobile Reader**:
- Full-screen (hide nav chrome on scroll down)
- Tap to show controls
- Highlights sidebar becomes bottom sheet (swipe up to open)
- Long-press text → Highlight popup
- Swipe left: Archive, Swipe right: Favorite

---

### 3. 🟡 Highlights Page - **Polish + Export**

**Route**: `/highlights`
**Status**: ⚠️ Exists (shows all highlights), needs visual polish and export
**Goal**: Unified view of all captured insights, easy to search/filter/export

**Current State**: Basic highlights page exists at `/highlights`
**What's Missing**: Visual polish, export functionality, better filtering

**Layout** (Similar to Library grid, but for highlights):

```
┌─────────────────────────────────────────────────────────────┐
│ 💡 Highlights                                               │
│                                                             │
│ 🔍 Search highlights...           [Filter ▼] [Export]      │ ← Search + actions
│                                                             │
│ Filters: [All] [Articles] [Newsletters] [This Week]        │ ← Quick filters
│ Tags: [React] [AI] [Programming]                           │ ← Tag filters
│                                                             │
│ ─────────────────────────────────────────────────────────  │
│                                                             │
│ 147 highlights                                              │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 🟡 "This is the highlighted text passage that the    │  │ ← Highlight card
│ │     user marked as important during reading..."      │  │
│ │                                                       │  │
│ │ From: Understanding React Server Components          │  │ ← Source
│ │ Dan Abramov · Dan's Blog · 2 days ago                │  │
│ │                                                       │  │
│ │ React   Frontend   Advanced                          │  │ ← Tags
│ │                                                       │  │
│ │ [View Article] [Copy] [Delete]                       │  │ ← Actions
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 🔵 "Large language models represent a fundamental    │  │ ← Another highlight
│ │     shift in how we interact with computers."        │  │   (blue color)
│ │                                                       │  │
│ │ From: The Future of AI                                │  │
│ │ Paul Graham · Hacker News · 5 hours ago               │  │
│ │                                                       │  │
│ │ AI   Technology                                       │  │
│ │                                                       │  │
│ │ [View Article] [Copy] [Delete]                       │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**HighlightCard Component**:
- **Highlight text**: Large quote marks? Or just colored left border?
- **Color indicator**: Small colored dot or full colored background (subtle, 10% opacity)?
- **Source citation**: Clickable link to original article
- **Actions**: Copy (with citation), View in article, Delete
- **Hover state**: Lift up slightly (2px), show shadow

**Filters** (Powerful search):
- **Content type**: Articles, Newsletters, PDFs, Podcasts (if transcripts exist)
- **Date range**: Today, This Week, This Month, All Time
- **Tags**: Filter by tag (same as Library)
- **Source**: Filter by publication/feed
- **Highlight color**: Filter by yellow/green/blue/etc.
- **Search**: Full-text search within highlighted text

**Export Functionality** (THE MISSING PIECE!):

**Export Button** → Opens modal:
```
┌─────────────────────────────────────────────┐
│ Export Highlights                           │
│                                             │
│ Format:                                     │
│ ○ Markdown (.md)                            │
│ ○ JSON (.json)                              │
│ ○ Plain Text (.txt)                         │
│ ○ CSV (.csv)                                │
│                                             │
│ Include:                                    │
│ ☑ Source citations                          │
│ ☑ Tags                                      │
│ ☑ Timestamps                                │
│ ☐ Full article links                        │
│                                             │
│ Preview:                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ # Highlights                            │ │
│ │                                         │ │
│ │ ## The Future of AI                     │ │
│ │ **Source**: Paul Graham, Hacker News    │ │
│ │ **Tags**: AI, Technology                │ │
│ │                                         │ │
│ │ > "Large language models represent..."  │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Copy to Clipboard] [Download File]        │
│                          [Cancel] [Export] │
└─────────────────────────────────────────────┘
```

**Export Formats**:

**Markdown** (Obsidian-friendly):
```markdown
# Highlights from Omnivore

## The Future of AI
**Author**: Paul Graham
**Source**: Hacker News
**Date**: Dec 19, 2024
**Tags**: #AI #Technology

> "Large language models represent a fundamental shift in how we interact with computers."

[View Article](https://omnivore.app/reader/xyz)

---

## Understanding React Server Components
**Author**: Dan Abramov
**Source**: Dan's Blog
**Date**: Dec 17, 2024
**Tags**: #React #Frontend

> "This is the highlighted text passage that the user marked as important during reading..."

[View Article](https://omnivore.app/reader/abc)
```

**JSON** (Developer-friendly):
```json
{
  "highlights": [
    {
      "id": "highlight-123",
      "text": "Large language models represent...",
      "color": "blue",
      "article": {
        "title": "The Future of AI",
        "author": "Paul Graham",
        "url": "https://omnivore.app/reader/xyz"
      },
      "tags": ["AI", "Technology"],
      "created_at": "2024-12-19T10:30:00Z"
    }
  ]
}
```

**Plain Text** (Simple):
```
HIGHLIGHTS FROM OMNIVORE

The Future of AI
By Paul Graham (Hacker News) - Dec 19, 2024

"Large language models represent a fundamental shift in how we interact with computers."

---

Understanding React Server Components
By Dan Abramov (Dan's Blog) - Dec 17, 2024

"This is the highlighted text passage that the user marked as important during reading..."
```

**Copy with Citation** (Individual highlight):
When user clicks "Copy" on a single highlight:
```
"Large language models represent a fundamental shift in how we interact with computers."

— Paul Graham, The Future of AI (https://omnivore.app/reader/xyz)
```

**Empty State**:
```
┌────────────────────────────────────┐
│         💡                         │
│    No highlights yet               │
│  Start reading and highlighting!   │
│                                    │
│  [Browse Library]                  │
└────────────────────────────────────┘
```

---

### 4. 🟢 Subscriptions Page - **RSS + Newsletters**

**Route**: `/subscriptions` or `/settings/subscriptions`
**Status**: ⚠️ RSS works (ARC-014A), Newsletter backend ready (ARC-016 Phase 1)
**Goal**: Simple subscription management for all content sources

**Layout** (Sections, not tabs):

```
┌────────────────────────────────────────────────────────────┐
│ Subscriptions                                              │
│                                                            │
│ ───────────────────────────────────────────────────────   │
│                                                            │
│ 📧 Newsletters                                             │
│                                                            │
│ Your Newsletter Email Address:                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ tim-abc123@omnivore.app                      [Copy]   │ │ ← Prominent!
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ How it works:                                              │
│ 1. Subscribe to any newsletter using this email address   │
│ 2. Confirmation emails are forwarded to you               │
│ 3. After confirming, articles appear automatically        │
│                                                            │
│ ─────────────────────────────────────────────────────────  │
│                                                            │
│ Active Subscriptions (4)                                   │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ ○ Dense Discovery                   [Unsubscribe]     │ │
│ │   3 articles · Last received: 2 hours ago              │ │
│ │   Platform: Substack                                   │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ ○ Hacker Newsletter                 [Unsubscribe]     │ │
│ │   Last received: 1 day ago                             │ │
│ │   Platform: Generic                                    │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ ○ Morning Brew                      [Unsubscribe]     │ │
│ │   5 articles · Last received: 3 hours ago              │ │
│ │   Platform: Mailchimp                                  │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ─────────────────────────────────────────────────────────  │
│                                                            │
│ Pending Confirmations (2)                [Show/Hide ▼]    │ ← Collapsible
│ (Already implemented in ARC-016 Phase 1)                  │
│                                                            │
│ ═════════════════════════════════════════════════════════  │
│                                                            │
│ 📡 RSS Feeds                                               │
│                                                            │
│ Add RSS Feed:                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ https://example.com/feed.xml          [Subscribe]    │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ 💡 Tip: YouTube channels and Podcasts have RSS feeds too! │ ← Helper text
│                                                            │
│ ─────────────────────────────────────────────────────────  │
│                                                            │
│ Active Feeds (5)                                           │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ ○ Hacker News                       [Unsubscribe]     │ │
│ │   72 items · Last updated: 30 minutes ago              │ │
│ │   https://hnrss.org/frontpage                          │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 📺 Veritasium (YouTube)             [Unsubscribe]     │ │ ← YouTube detected
│ │   4 videos · Last updated: 2 hours ago                 │ │
│ │   youtube.com/feeds/videos.xml?channel_id=...          │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 🎙️ The Daily (Podcast)              [Unsubscribe]     │ │ ← Podcast detected
│ │   6 episodes · Last updated: 1 day ago                 │ │
│ │   feeds.nytimes.com/thedaily                           │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Key Features**:
- **Newsletter email**: Hero section, copy-to-clipboard, clear instructions
- **Platform badges**: Auto-detect Substack, Beehiiv, Mailchimp, etc.
- **Item counts**: Show how many articles/episodes from each source
- **Last updated**: Timestamp for RSS feeds (refresh status)
- **Unsubscribe**: Confirmation modal ("Are you sure? X articles will be removed")
- **YouTube/Podcast detection**: Auto-detect from RSS feed URL, show special icons
- **Pending confirmations**: Collapsible section (already built)

**Unsubscribe Confirmation Modal**:
```
┌────────────────────────────────────┐
│ Unsubscribe from Dense Discovery?  │
│                                    │
│ • 3 articles will remain in library│
│ • Future emails will be ignored    │
│ • You can resubscribe anytime      │
│                                    │
│        [Cancel] [Unsubscribe]      │
└────────────────────────────────────┘
```

---

## 🎨 Design System Continuity

**CRITICAL**: All new pages must match the excellence of the current Library design!

### Visual Language (Maintain Consistency):
- ✅ Dark theme: `#1a1a1a` background, `#2a2a2a` cards
- ✅ Typography: Inter font family, 16px headings, 14px body
- ✅ Spacing: 4px baseline grid (`--space-1` through `--space-6`)
- ✅ Colors: Vibrant tag chips, subtle grays for secondary text
- ✅ Borders: Subtle borders on cards, no harsh lines
- ✅ Shadows: Soft elevation on hover (2px translateY, box-shadow)
- ✅ Transitions: 200ms ease-in-out for all interactions

### Component Patterns (Reuse What Works):
- **Cards**: Same rounded corners (8px), same padding, same hover effect
- **Buttons**: Ghost buttons for secondary actions, filled for primary
- **Tags**: Colored pill chips (same as Library)
- **Progress bars**: Same 4px height, gradient or solid color
- **Empty states**: Centered, icon + text + CTA button
- **Search input**: Same debounced behavior, same styling
- **Multi-select**: Same checkbox + bottom action bar pattern

### Interaction Patterns (Consistency Across Pages):
- **Hover**: Lift cards 2px, add shadow
- **Focus**: 2px blue outline (`--color-action-blue`)
- **Loading**: Skeleton screens or shimmer effect
- **Errors**: Toast notifications (bottom-right, auto-dismiss)
- **Success**: Toast with undo option ("Archived 5 items [Undo]")
- **Keyboard nav**: Tab through interactive elements, Enter/Space to activate

---

## 🎯 Success Criteria

**You'll know the design is successful when**:

1. **Visual Cohesion**: All pages feel like one unified app
   - Same dark theme, same typography, same spacing
   - Digest cards feel natural next to Library cards
   - Reader feels like a focused version of the same app

2. **Interaction Consistency**: Patterns work the same everywhere
   - Highlighting in Reader uses same color picker as tag selection
   - Bulk actions in Digest match bulk actions in Library
   - Export modal follows same modal pattern throughout

3. **User Delight**: Interactions feel smooth and polished
   - Digest triage is satisfyingly fast
   - Highlighting feels smooth (no lag, clear feedback)
   - Export preview shows exactly what you'll get

4. **Mobile Ready**: Touch-friendly on all screen sizes
   - 44x44pt touch targets minimum
   - Swipe gestures where appropriate
   - Responsive breakpoints maintain quality

5. **Accessibility**: Fully keyboard navigable
   - All actions accessible via keyboard
   - Focus states clearly visible
   - Screen reader friendly (proper ARIA labels)

---

## 🚀 What to Deliver

**For Each Page** (Digest, Reader, Highlights, Subscriptions):

1. **Desktop Mockup** (1440px width)
   - Default state (with content)
   - Empty state
   - Hover/interaction states

2. **Mobile Mockup** (375px width)
   - Responsive layout
   - Touch interactions shown

3. **Component Variations**:
   - DigestCard (default, triaged, loading)
   - HighlightCard (different colors, with/without actions)
   - Subscription list items (newsletter, RSS, YouTube, podcast)

4. **Interaction Flows** (Key user journeys):
   - Digest triage flow (see summary → archive)
   - Highlight creation flow (select text → choose color → save)
   - Export flow (click export → select format → preview → download)

5. **Design Tokens** (If any new ones needed):
   - New colors (if AI summary needs special treatment)
   - New spacing values (if needed)
   - New typography sizes (if needed)

---

## 🎨 Design Exploration Freedom

**Areas to Explore and Show Variations**:

1. **Digest Page Placement**:
   - Top of nav, default landing page, OR smart inbox replacement
   - Show all three options, recommend best

2. **AI Summary Styling**:
   - Light background box, italic text, different color, OR badge
   - Show variations, pick most elegant

3. **Triaged State**:
   - Grayed out, hidden, moved to bottom, OR collapsed
   - Which feels best for "inbox zero" satisfaction?

4. **Reader Layout**:
   - Single column with sidebar OR full-width focus mode
   - Or both with toggle?

5. **Highlight Color Picker**:
   - Inline popup, sidebar panel, OR keyboard shortcuts
   - Fastest interaction wins

6. **Export Modal**:
   - Simple dropdown vs full modal with preview
   - Preview is important for trust

**What We Trust You With**:
- Visual refinement (you know what looks good!)
- Interaction details (smooth transitions, delightful micro-interactions)
- Layout optimization (whitespace, hierarchy, balance)
- Mobile responsiveness (appropriate breakpoints, touch targets)

**What Must Be Preserved**:
- Dark theme (#1a1a1a, #2a2a2a)
- Inter font family
- 4px baseline grid spacing
- Current tag chip style (colored pills)
- Current multi-select pattern (checkboxes + bottom bar)

---

## 📝 Context for the AI Agent

**Current Design Quality**: The library page is already excellent - professional, clean, modern. Your job is to **extend** this excellence to the remaining pages, not reinvent the wheel.

**Product Stage**: MVP (Minimum Viable Product) - Focus on core user value:
- Morning triage with AI summaries (Digest page)
- Deep reading with highlight capture (Reader page)
- Unified highlight collection (Highlights page)
- Simple subscription management (Subscriptions page)

**User Sophistication**: Power users (researchers, knowledge workers) who value:
- Speed and keyboard shortcuts
- Information density without clutter
- Clean, distraction-free reading
- Powerful organization (search, tags, filters)

**Design Philosophy**: "Structured for Power, Simple by Default"
- Don't hide complexity, organize it elegantly
- Keyboard shortcuts for power users, mouse/touch works great too
- Dark theme for focus, vibrant accents for delight
- Fast feedback, smooth transitions, clear states

---

## 🎯 Final Note

This is an app people will **use every morning**. The Digest page will be their first interaction every day. It needs to feel fast, clear, and satisfying.

The Reader is where they'll spend focused time. It needs to be beautiful, distraction-free, and make highlighting feel effortless.

Highlights is their knowledge base. It needs to feel organized and make export feel trustworthy.

Subscriptions is where they set up their content flow. It needs to be simple and clear.

**Make it lovable**. 💙

---

**Design System Reference**: See `/packages/web-vite/design/` for full specifications
**Current Implementation**: See screenshot for Library page excellence to match
**Timeline**: 6-8 weeks to MVP after designs complete
**First Deploy**: Digest page (highest priority)
