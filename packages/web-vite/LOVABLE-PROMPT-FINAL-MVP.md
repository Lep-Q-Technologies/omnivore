# Omnivore MVP: AI-Powered Content Curation Tool - Final Design Specification

**Version**: 2.0 - DEFINITIVE MVP FOUNDATION
**Date**: December 20, 2024
**Status**: READY FOR IMPLEMENTATION

---

## 🎯 Core Product Vision

**What We're Building**:
An AI-powered reading and knowledge synthesis tool that helps users cut through content overload, capture insights, and build lasting knowledge.

**NOT an email client. NOT a folder organizer. NOT manual labor.**

### **The Philosophy**:
> AI surfaces what matters → You read what resonates → Capture insights → Synthesize knowledge

### **The Workflow** (Simple, AI-First):
1. **Morning**: Open app → AI shows curated digest → Quick triage in 5 minutes
2. **Reading**: Choose from "Read Later" queue → Deep focus in reader → Highlight key insights
3. **Synthesis**: Export highlights to Obsidian/Notion → Build lasting knowledge

**No folders. No manual sorting. No email-client vibes.**

---

## 🏗️ Information Architecture

### **Primary Navigation** (Left Sidebar):

```
┌─ OMNIVORE ──────────────────┐
│                              │
│  🌅 Today                    │ ← AI Digest (morning ritual, primary view)
│  📚 Library                  │ ← Full collection (browse, search, organize)
│  💡 Highlights               │ ← Captured insights (knowledge base)
│  🏷️  Tags                    │ ← Organization (tag management)
│  📡 Feeds                    │ ← Sources (subscription management)
│                              │
│  ─── FEEDS ───────────       │
│  📡 RSS Feeds (72)           │
│    • Hacker News (30)        │
│    • TechCrunch (20)         │
│                              │
│  📧 Newsletters (8)          │
│    • Dense Discovery (3)     │
│    • Morning Brew (5)        │
│                              │
│  🎙️  Podcasts (6)            │
│  📺 YouTube (4)              │
└──────────────────────────────┘
```

**Mental Model**:
- **Today** = What's new and needs my attention (AI-curated)
- **Library** = Everything I've saved (all content, all time)
- **Highlights** = What I've captured (insights, quotes, notes)
- **Tags** = How I organize (tag management)
- **Feeds** = Where content comes from (sources)

---

### **Library Tabs** (When "Library" is selected):

```
┌────────────────────────────────────────────────────────────────┐
│  📚 All  ⏰ Read Later  ⭐ Starred  🗑️ Trash        [Select]    │
└────────────────────────────────────────────────────────────────┘
```

**What Each Tab Means**:

| Tab | Purpose | User Intent | Backend Filter |
|-----|---------|-------------|----------------|
| **All** | Your complete library | "Show me everything" | All items (not deleted) |
| **Read Later** | Intentionally saved queue | "What did I save to read?" | Items with `read_later = true` |
| **Starred** | Important favorites | "Show me the best stuff" | Items with `starred = true` |
| **Trash** | Deleted items | "Oops, I deleted something" | Items with `folder = trash` |

**NOT like email**:
- ❌ No "Inbox" (that's email thinking)
- ❌ No "Archive" (everything is in your library, not "archived away")
- ✅ "All" = Your full collection (not "dealt with items")
- ✅ "Read Later" = Intentional queue (not "unread pile")

---

### **Toolbar** (Global, appears on Today and Library pages):

```
┌──────────────────────────────────────────────────────────────────┐
│  [Filter ▼]  [Sort: Most Recent ▼]  [Comfortable ▼]  [⊞]  [☰]  [Select] │
│      ↑              ↑                       ↑          ↑    ↑       ↑    │
│  Filtering       Sorting                Density     Grid List  Multi    │
└──────────────────────────────────────────────────────────────────┘
```

**Three Functional Groups**:
1. **Content Controls** (left): What to show and in what order
2. **View Options** (right): How to display it
3. **Actions** (far right): Multi-select mode

---

## 📄 Page Designs

### **1. Today Page** - THE Primary Experience

**Route**: `/today` or `/digest`
**Status**: Replaces old "Digest tab" - now standalone primary view
**Goal**: AI-powered morning ritual - triage 15+ items in 5 minutes

---

#### **Layout Structure**:

```
┌─────────────────────────────────────────────────────────────────┐
│  OMNIVORE               [🔍 Search everything...]  [+Add] [🔔] [👤] │ ← Global top bar
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Good morning! ☀️                              Thursday, Dec 21  │ ← Hero Stats Section
│                                                                  │
│  📬 15 New Items        ⏱️ ~8 min to triage       🔥 7 day streak │
│  ─────────────                                                   │
│  📰 8 Newsletters   📡 5 RSS   📺 2 Videos                       │
│                                                                  │
│  Progress: ████████████░░░░░ 12 triaged / 15 total (80%)       │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  [Filter ▼]  [Sort: AI Priority ▼]  [Comfortable ▼] [⊞] [☰]    │ ← Toolbar
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ 🔥 High Priority ──────────────────────────────────────┐   │
│  │  3 items                                                 │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ 🔥 The Future of AI: How Large Language Models... │ │   │
│  │  │ Paul Graham · Hacker News · 2h ago · ⏱️ 12 min    │ │   │
│  │  │                                                     │ │   │
│  │  │ ┌──────────────────────────────────────────────┐   │ │   │
│  │  │ │ ✨ AI Summary:                               │   │ │   │
│  │  │ │ This article explores how LLMs are           │   │ │   │
│  │  │ │ transforming software development. Key       │   │ │   │
│  │  │ │ points: cost reduction by 10x, new           │   │ │   │
│  │  │ │ interaction paradigms, emerging risks.       │   │ │   │
│  │  │ └──────────────────────────────────────────────┘   │ │   │
│  │  │                                                     │ │   │
│  │  │ [👁️ Read Now] [⏰ Read Later] [Dismiss] [🗑️]      │ │   │
│  │  │                                                     │ │   │
│  │  │ AI   Programming                                   │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │                                                          │   │
│  │  [DigestCard 2]                                         │   │
│  │  [DigestCard 3]                                         │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ 📌 Medium Priority ────────────────────────────────────┐   │
│  │  8 items  [Show/Hide ▼]                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ 📋 Low Priority ───────────────────────────────────────┐   │
│  │  4 items  [Show 4 items]                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ ✅ Triaged (12) ───────────────────────────────────────┐   │
│  │  [Show triaged items]                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

#### **Hero Stats Section** - Morning Motivation

**Purpose**: Gamify the triage experience, show progress, build habits

**Design Specs**:
```
Background: Subtle gradient (#1f1f1f → #242424)
Padding: 24px (--space-6)
Border radius: 8px
Margin bottom: 24px

Content Layout (3 rows):
Row 1: Greeting + Date
  "Good morning! ☀️"  (18px, #FFD234 for emoji)
  "Thursday, Dec 21"   (14px, #898989, right-aligned)

Row 2: Key Stats (3 columns)
  📬 15 New Items      (16px bold, #FFFFFF)
  ⏱️ ~8 min to triage  (16px bold, #4A9EFF)
  🔥 7 day streak      (16px bold, #FFD234)

Row 3: Content Breakdown
  📰 8 Newsletters   📡 5 RSS   📺 2 Videos
  (14px, #D9D9D9, icons in brand colors)

Row 4: Progress Bar
  Visual: Blue → Green gradient (0% → 100%)
  Height: 8px
  Border radius: 4px
  Background: #2a2a2a

  Text: "12 triaged / 15 total (80%)"
  (12px, #898989, above bar)
```

**Stats Update in Real-Time**:
- When user triages an item:
  - "15 New Items" → "14 New Items"
  - "~8 min to triage" → "~7 min to triage"
  - Content breakdown updates (Newsletters: 8 → 7)
  - Progress bar animates forward (80% → 87%)
  - Toast: "Added to Read Later! [Undo]"

---

#### **DigestCard Component** - The Core UI Element

**Design Specs**:
```
Container:
  Background: #2a2a2a
  Border radius: 8px
  Padding: 16px (--space-4)
  Margin bottom: 16px
  Border: 1px solid transparent (for priority indicators)

Priority Indicators:
  High Priority: Border-left: 3px solid #FF9500 (orange)
  Medium Priority: Border-left: 3px solid #4A9EFF (blue)
  Low Priority: Border-left: 3px solid #666666 (gray)

Layout (from top to bottom):
  1. Header Row:
     - Priority emoji (🔥 high, 📌 medium, 📋 low)
     - Title (16px, 700 weight, #FFFFFF, 2-line clamp)
     - Star icon (right-aligned, clickable)

  2. Metadata Row:
     - Author · Source · Time ago · Reading time
     - (12px, #898989, Inter font)
     - Format: "Paul Graham · Hacker News · 2h ago · ⏱️ 12 min"

  3. AI Summary Box:
     - Background: rgba(74, 158, 255, 0.1) (blue tint, 10% opacity)
     - Border: 1px solid rgba(74, 158, 255, 0.2)
     - Border radius: 6px
     - Padding: 12px
     - Margin: 12px 0

     - Header: "✨ AI Summary:" (12px, #4A9EFF, medium weight)
     - Content: 2-3 sentences (14px, #D9D9D9, line-height 1.6)

  4. Actions Row:
     - 4 buttons in a row
     - Button style: Ghost (outline only)
     - Height: 36px
     - Border radius: 6px
     - Gap: 8px

     Buttons:
     [👁️ Read Now]    - Primary action (blue border)
     [⏰ Read Later]   - Secondary (gray border)
     [Dismiss]         - Tertiary (gray border)
     [🗑️]              - Destructive (red border on hover)

  5. Tags Row:
     - Colored pill chips (same as Library)
     - Max 3 visible, "+2 more" if overflow
     - Format: Background color + text
     - Border radius: 9999px (full pill)
     - Padding: 4px 12px
     - Font: 11px, medium weight
```

**Interaction States**:
```
Default:
  - Normal appearance

Hover (desktop):
  - translateY(-2px)
  - box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3)
  - Transition: 200ms ease-in-out

Triaged (after action):
  - Fade out animation (opacity: 1 → 0, 300ms)
  - Slide up (translateY: 0 → -20px)
  - Remove from view
  - Add to "Triaged" section at bottom
  - Toast appears: "Added to Read Later! [Undo]"
```

---

#### **Priority Sections** - Smart Grouping

**High Priority Section**:
```
Header:
  Icon: 🔥
  Text: "High Priority"
  Count: (3 items)
  Style: 16px, 700 weight, #FF9500 (orange)

Behavior:
  - Always expanded by default
  - Contains top 3-5 items by AI priority
  - Sorted by relevance score (highest first)
```

**Medium Priority Section**:
```
Header:
  Icon: 📌
  Text: "Medium Priority"
  Count: (8 items)
  Style: 16px, 700 weight, #4A9EFF (blue)

Behavior:
  - Collapsed by default (show header only)
  - Click to expand/collapse
  - Contains majority of items
  - Sorted by time (most recent first)
```

**Low Priority Section**:
```
Header:
  Icon: 📋
  Text: "Low Priority"
  Count: (4 items)
  Style: 16px, 700 weight, #666666 (gray)

Behavior:
  - Hidden by default
  - "Show 4 low priority items" link
  - Click to reveal section
  - Contains promotional, already-covered topics
```

**Triaged Section** (Bottom):
```
Header:
  Icon: ✅
  Text: "Triaged"
  Count: (12 items)
  Style: 14px, 500 weight, #4CAF50 (green)

Behavior:
  - Collapsed by default
  - "Show triaged items" link
  - Clicking reveals collapsed cards
  - Each card shows: ✅ Title · Time triaged
  - Actions: [Undo] [View Article]
```

---

#### **Empty State** - Inbox Zero Celebration

**When all items triaged**:
```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                     🎉                                   │
│                                                          │
│              Inbox Zero Achieved!                        │
│                                                          │
│         You triaged 15 items in 6 minutes                │
│           (2 minutes faster than yesterday!)             │
│                                                          │
│              Your streak: 🔥 7 days                      │
│                                                          │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  Today's Stats:                                          │
│  📚 5 articles read                                      │
│  💡 12 highlights captured                               │
│  ⏱️ 47 minutes reading time                             │
│                                                          │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│     [Browse All Items]  [See Read Later Queue]          │
│                                                          │
└──────────────────────────────────────────────────────────┘

Design Specs:
  Background: #2a2a2a
  Border radius: 12px
  Padding: 48px
  Text align: center

  Emoji: 48px font size
  Heading: 24px, 700 weight, #FFD234
  Stats: 14px, #D9D9D9

  Animation: Subtle confetti (2 seconds, then fade)
  Buttons: Primary style (filled, yellow)
```

---

### **2. Library Page** - Full Collection

**Route**: `/library`
**Default Tab**: "All" (shows everything)
**Goal**: Browse, search, and organize your full content collection

---

#### **Layout Structure**:

```
┌─────────────────────────────────────────────────────────────────┐
│  OMNIVORE               [🔍 Search everything...]  [+Add] [🔔] [👤] │ ← Global top bar
├─────────────────────────────────────────────────────────────────┤
│  📚 All  ⏰ Read Later  ⭐ Starred  🗑️ Trash        [Select]     │ ← Library tabs
├─────────────────────────────────────────────────────────────────┤
│  [Filter ▼]  [Sort: Most Recent ▼]  [Comfortable ▼] [⊞] [☰]    │ ← Toolbar
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  142 items                                                       │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │ [LibraryCard]  │  │ [LibraryCard]  │  │ [LibraryCard]  │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │ [LibraryCard]  │  │ [LibraryCard]  │  │ [LibraryCard]  │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
│                                                                  │
│  [Load More...]                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

#### **Tab Behaviors**:

**📚 All Tab** (Default):
```
Shows: All items in library (not deleted)
Filter: folder != "trash"
Sort: Most Recent (default)
Count: Total items (e.g., "142 items")
Empty state: "No items yet. Click +Add to get started."
```

**⏰ Read Later Tab** ✨ **NEW**:
```
Shows: Items user explicitly saved to read later
Filter: read_later = true AND folder != "trash"
Sort: Date added to Read Later (newest first)
Count: Queue size (e.g., "5 items to read")

Card Enhancements:
  - Remove AI summary (already decided to read these)
  - Show "Added 2 hours ago" instead of publish date
  - Actions: [Read Now] [Remove from Queue] [Star]

Empty state:
  "Your reading queue is empty! 📚
   Browse Today or All to add items to read later."
```

**⭐ Starred Tab**:
```
Shows: Items user marked as favorites
Filter: starred = true AND folder != "trash"
Sort: Date starred (newest first)
Count: Total starred (e.g., "23 starred")
Empty state: "No starred items yet. Star items to save your favorites."
```

**🗑️ Trash Tab**:
```
Shows: Deleted items (30-day retention)
Filter: folder = "trash"
Sort: Date deleted (newest first)
Count: Items in trash (e.g., "3 items")

Actions:
  - Hover card: [Restore] [Delete Permanently]
  - Bulk actions: [Restore All] [Empty Trash]

Empty state: "Trash is empty."
```

---

#### **Filter Dropdown** - Comprehensive Filtering

**Trigger**: Click [Filter ▼] button in toolbar

**Dropdown Design**:
```
┌─────────────────────────────────────────┐
│ By Tag:                                 │
│   ☐ AI (5)                              │
│   ☐ Programming (8)                     │
│   ☐ React (3)                           │
│   ☐ Design (12)                         │
│   [Show all tags...]                    │
│   ────────────────                      │
│   [Manage Tags →]                       │
│                                         │
│ By Source:                              │
│   ☐ Hacker News (12)                    │
│   ☐ Dense Discovery (3)                 │
│   ☐ TechCrunch (5)                      │
│   ☐ Morning Brew (8)                    │
│   [Show all sources...]                 │
│                                         │
│ By Content Type:                        │
│   ☐ Newsletters (8)                     │
│   ☐ RSS Feeds (5)                       │
│   ☐ Videos (2)                          │
│   ☐ Podcasts (1)                        │
│                                         │
│ By Reading Time:                        │
│   ○ All                                 │
│   ○ Quick (< 5 min)                     │
│   ○ Medium (5-10 min)                   │
│   ○ Long (10+ min)                      │
│                                         │
│ By Reading Status:                      │
│   ☐ Unread                              │
│   ☐ In Progress                         │
│   ☐ Completed                           │
│                                         │
│ ─────────────────────────────────────   │
│ [Clear All Filters]                     │
└─────────────────────────────────────────┘

Design Specs:
  Width: 320px
  Max height: 500px (scrollable)
  Background: #2a2a2a
  Border: 1px solid #3a3a3a
  Border radius: 8px
  Box shadow: 0 8px 24px rgba(0, 0, 0, 0.4)
  Padding: 16px

  Section headers: 12px, 700 weight, #898989, uppercase, letter-spacing: 0.5px
  Checkboxes: Blue (#4A9EFF) when checked
  Radio buttons: Blue (#4A9EFF) when selected

  Hover states: Background #333333

  "Clear All Filters" button:
    - Text button (no background)
    - Color: #4A9EFF
    - Hover: underline
```

**Filter Behavior**:
```
Multiple selections within same category: OR logic
  (e.g., "AI" OR "Programming" shows items with either tag)

Multiple selections across categories: AND logic
  (e.g., "AI" tag AND "Newsletters" type shows AI newsletters only)

Applied filters show as chips above content:
  [AI ✕] [Newsletters ✕] [Quick reads ✕]

  Click ✕ to remove individual filter

Active filter count shows in button:
  [Filter (3) ▼] ← 3 active filters
```

---

### **3. Highlights Page** - Knowledge Base

**Route**: `/highlights`
**Status**: Already excellent! Just need export functionality
**Goal**: Unified view of all captured insights, easy to export

---

#### **Current Design** (Keep as-is):
```
┌─────────────────────────────────────────────────────────────────┐
│  💡 Highlights                                                   │
│  5 highlights                                                    │
│                                                                  │
│  [Filter: All Colors ▼]                            [Export]     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ "Large language models represent a fundamental shift..." │  │
│  │                                                           │  │
│  │ From: The Future of AI                                    │  │
│  │ Paul Graham · 5h ago                                      │  │
│  │                                                           │  │
│  │ [View Article] [Copy] [Delete]                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  (More highlight cards with colored borders...)                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Design is already perfect!** ✅

**Just add Export Modal**:

---

#### **Export Modal** - Knowledge Synthesis

**Trigger**: Click [Export] button on Highlights page

**Modal Design**:
```
┌─────────────────────────────────────────────────────────┐
│  Export Highlights                                  ✕   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Export 5 highlights to your preferred format.          │
│                                                         │
│  Format:                                                │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Markdown (.md)                                  ▼ │ │
│  └───────────────────────────────────────────────────┘ │
│    Options: Markdown (.md)                              │
│             JSON (.json)                                │
│             Plain Text (.txt)                           │
│             CSV (.csv)                                  │
│                                                         │
│  Include:                                               │
│  ☑ Source citations                                     │
│  ☑ Tags                                                 │
│  ☑ Timestamps                                           │
│  ☑ Article links                                        │
│  ☐ Full article text                                    │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Preview:                                               │
│  ┌───────────────────────────────────────────────────┐ │
│  │ # Highlights from Omnivore                        │ │
│  │                                                   │ │
│  │ ## The Future of AI                               │ │
│  │ **Author**: Paul Graham                           │ │
│  │ **Source**: Hacker News                           │ │
│  │ **Date**: Dec 19, 2024                            │ │
│  │ **Tags**: #AI #Technology                         │ │
│  │                                                   │ │
│  │ > "Large language models represent a             │ │
│  │ > fundamental shift in how we interact           │ │
│  │ > with computers."                                │ │
│  │                                                   │ │
│  │ [View Article](https://omnivore.app/...)         │ │
│  │                                                   │ │
│  │ ---                                               │ │
│  └───────────────────────────────────────────────────┘ │
│    (Scrollable preview)                                 │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  [Copy to Clipboard]              [Cancel] [Download]   │
│                                                         │
└─────────────────────────────────────────────────────────┘

Design Specs:
  Width: 600px
  Max height: 80vh
  Background: #2a2a2a
  Border radius: 12px
  Padding: 24px

  Header: 18px, 700 weight
  Body text: 14px

  Preview box:
    Background: #1a1a1a
    Border: 1px solid #3a3a3a
    Border radius: 6px
    Padding: 16px
    Font: Monaco, monospace (for code preview)
    Max height: 300px (scrollable)

  Buttons:
    Primary (Download): Yellow (#FFD234), filled
    Secondary (Copy): Gray, outlined
    Tertiary (Cancel): Gray, text only
```

**Export Formats**:

**Markdown** (Obsidian-friendly):
```markdown
# Highlights from Omnivore

## The Future of AI: How Large Language Models Are Reshaping Software
**Author**: Paul Graham
**Source**: Hacker News
**Date**: December 19, 2024
**Tags**: #AI #Technology #Programming

> "Large language models represent a fundamental shift in how we interact with computers."

[View Article](https://omnivore.app/reader/xyz)

---

## Understanding React Server Components: A Deep Dive
**Author**: Dan Abramov
**Source**: Dan Abramov's Blog
**Date**: December 17, 2024
**Tags**: #React #Frontend #JavaScript

> "React Server Components allow you to write UI that can be rendered and optionally cached on the server."

[View Article](https://omnivore.app/reader/abc)

---

*Exported from Omnivore on December 20, 2024*
```

**JSON** (Developer-friendly):
```json
{
  "exported_at": "2024-12-20T10:30:00Z",
  "source": "Omnivore",
  "total_highlights": 5,
  "highlights": [
    {
      "id": "highlight-123",
      "text": "Large language models represent a fundamental shift in how we interact with computers.",
      "color": "blue",
      "created_at": "2024-12-19T08:15:00Z",
      "article": {
        "id": "article-456",
        "title": "The Future of AI: How Large Language Models Are Reshaping Software",
        "author": "Paul Graham",
        "source": "Hacker News",
        "url": "https://omnivore.app/reader/xyz",
        "published_at": "2024-12-19T06:00:00Z"
      },
      "tags": ["AI", "Technology", "Programming"],
      "note": ""
    }
  ]
}
```

**Plain Text** (Simple):
```
HIGHLIGHTS FROM OMNIVORE
Exported: December 20, 2024

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The Future of AI: How Large Language Models Are Reshaping Software
By Paul Graham (Hacker News) - December 19, 2024
Tags: AI, Technology, Programming

"Large language models represent a fundamental shift in how we interact with computers."

Read: https://omnivore.app/reader/xyz

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Understanding React Server Components: A Deep Dive
By Dan Abramov (Dan Abramov's Blog) - December 17, 2024
Tags: React, Frontend, JavaScript

"React Server Components allow you to write UI that can be rendered and optionally cached on the server."

Read: https://omnivore.app/reader/abc

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**CSV** (Spreadsheet-friendly):
```csv
"Highlight Text","Article Title","Author","Source","Date","Tags","URL","Color","Notes"
"Large language models represent...","The Future of AI","Paul Graham","Hacker News","2024-12-19","AI,Technology,Programming","https://omnivore.app/reader/xyz","blue",""
"React Server Components allow...","Understanding React Server Components","Dan Abramov","Dan's Blog","2024-12-17","React,Frontend","https://omnivore.app/reader/abc","green",""
```

---

### **4. Reader Page** - Deep Focus Reading

**Route**: `/reader/:id`
**Status**: Basic version exists, needs polish
**Goal**: Distraction-free reading with smooth highlighting

---

#### **Layout** (Single column with optional sidebar):

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Library          [🗑️] [🏷️] [⭐] [•••]              │ ← Top bar
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Understanding React Server Components:                          │ ← Article header
│  A Deep Dive                                                     │
│                                                                  │
│  Dan Abramov · Dan Abramov's Blog · Yesterday · 15 min read     │
│                                                                  │
│  React   Frontend                                                │ ← Tags
│                                                                  │
│  ──────────────────────────────────────────────────────────────  │
│                                                                  │
│  [Article hero image]                                            │
│                                                                  │
│  This is what the news should sound like. The biggest            │ ← Article body
│  stories of our time, told by the best journalists in the       │
│  world. Hosted by Michael Barbaro and Sabrina Tavernise.        │
│                                                                  │
│  The Rise of AI in Journalism                                    │
│                                                                  │
│  In recent years, artificial intelligence has begun to           │
│  reshape the media landscape in profound ways. From              │
│  automated article generation to personalized content            │
│  recommendations, AI is becoming an integral part of how         │
│  news is created and consumed.                                   │
│                                                                  │
│  [Content continues...]                                          │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  ████████████████████░░░░░░░░ 72% complete                      │ ← Progress bar
└─────────────────────────────────────────────────────────────────┘
```

**Typography** (Beautiful reading):
```
Body text:
  Font: Georgia, Merriweather, or similar serif
  Size: 18px
  Line height: 1.7
  Color: #FFFFFF
  Max width: 680px (optimal line length)
  Margin: 0 auto (centered)

Headings:
  H1: 32px, 700 weight, #FFFFFF
  H2: 24px, 700 weight, #FFFFFF
  H3: 20px, 600 weight, #D9D9D9

Paragraphs:
  Margin bottom: 1.5em

Links:
  Color: #4A9EFF
  Text decoration: underline
  Hover: #FFD234
```

**Highlight Interaction** (Smooth UX):

**Step 1: Text Selection**
```
User selects text → Popup appears above selection

Popup Design:
┌──────────────────────────────────────┐
│  [🟡] [🟢] [🔵] [🟣] [🔴] [🟠]  [✕] │ ← Color picker
└──────────────────────────────────────┘

Colors: Yellow, Green, Blue, Purple, Red, Orange
Size: 32px each (touch-friendly)
Hover: Scale 1.1x
Active: Check mark appears in circle
```

**Step 2: Color Selection**
```
User clicks color → Text background changes
Highlight saved to database
Popup dismisses
Toast: "Highlight saved! 💡"
```

**Step 3: View Highlights**
```
Sidebar option (desktop):
  [•••] menu → "Show Highlights" → Sidebar slides in from right

  Sidebar contents:
  ┌─────────────────────────┐
  │ Highlights (3)          │
  │                         │
  │ 🟡 "This article..."    │
  │    [Jump to →]          │
  │                         │
  │ 🔵 "React Server..."    │
  │    [Jump to →]          │
  │                         │
  │ 🟢 "The implications"   │
  │    [Jump to →]          │
  │                         │
  │ [Export All]            │
  └─────────────────────────┘

Mobile:
  Bottom sheet slides up when highlights icon tapped
```

**Reading Progress** (Bottom bar):
```
Visual: Gradient bar (blue → green)
Height: 4px
Position: Fixed to bottom
Updates: On scroll (debounced)

Text indicator:
  Left side: "72% complete"
  Right side: "3 min remaining" (estimated)

  Font: 12px, #898989
  Background: rgba(26, 26, 26, 0.9) (semi-transparent)
  Padding: 8px 16px
```

---

### **5. Feeds Page** - Source Management

**Route**: `/feeds` (formerly Subscriptions)
**Status**: Already implemented and working
**Goal**: Manage all content sources (newsletters, RSS, podcasts, YouTube)

---

**Keep current design** - it's already excellent! ✅

**Just ensure it's called "Feeds" not "Subscriptions"** throughout the UI.

---

## 🎨 Design System - Maintain Excellence

### **Colors** (Already defined):
```css
/* Brand Colors */
--color-brand-yellow: #FFD234;
--color-action-blue: #4A9EFF;
--color-success-green: #4CAF50;
--color-warning-orange: #FF9500;
--color-danger-red: #8B0000;

/* Backgrounds */
--color-bg-primary: #1a1a1a;
--color-bg-secondary: #2a2a2a;
--color-bg-tertiary: #252525;
--color-bg-elevated: #333333;

/* Text */
--color-text-primary: #FFFFFF;
--color-text-secondary: #D9D9D9;
--color-text-tertiary: #898989;
--color-text-muted: #666666;

/* Borders */
--color-border-subtle: #3a3a3a;
--color-border-medium: #444444;
```

### **Typography**:
```css
/* Font Family */
--font-primary: 'Inter', sans-serif;
--font-reading: Georgia, 'Times New Roman', serif;

/* Sizes */
--font-size-heading-lg: 24px;
--font-size-heading: 18px;
--font-size-subheading: 16px;
--font-size-body: 14px;
--font-size-caption: 12px;
--font-size-micro: 11px;

/* Weights */
--font-weight-bold: 700;
--font-weight-medium: 500;
--font-weight-regular: 400;
```

### **Spacing** (4px baseline grid):
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-12: 48px;
```

### **Border Radius**:
```css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
--radius-full: 9999px;
```

### **Transitions**:
```css
--transition-fast: 150ms ease-in-out;
--transition-base: 200ms ease-in-out;
--transition-slow: 300ms ease-in-out;
```

---

## 🎯 Key User Flows

### **Flow 1: Morning Triage** (The Primary Use Case)

```
1. User opens app (8:00 AM)
   → Lands on "Today" page automatically

2. Hero stats show:
   "Good morning! ☀️"
   "📬 15 New Items    ⏱️ ~8 min to triage    🔥 7 day streak"
   Progress: 0 triaged / 15 total (0%)

3. User scans High Priority section (3 items):

   Item 1: "The Future of AI..."
   - Reads AI summary: "LLMs transform dev, 10x cost reduction..."
   - Decision: Interesting! → Clicks [⏰ Read Later]
   - Card fades out, moves to "Triaged" section
   - Toast: "Added to Read Later! [Undo]"
   - Stats update: 1 triaged / 15 total (7%)

   Item 2: "React Server Components..."
   - Reads summary: "Server-side rendering with caching..."
   - Decision: Need to read this! → Clicks [👁️ Read Now]
   - Opens in reader → User reads, highlights key passages
   - After reading: Returns to Today page
   - Stats update: 2 triaged / 15 total (13%)

   Item 3: "Productivity Hacks..."
   - Reads summary: "Generic tips, seen before"
   - Decision: Not relevant → Clicks [Dismiss]
   - Card disappears
   - Stats update: 3 triaged / 15 total (20%)

4. User expands Medium Priority section (8 items):
   - Scans titles quickly
   - Adds 2 more to Read Later
   - Dismisses 6 items
   - Stats update: 11 triaged / 15 total (73%)

5. Low Priority section (4 items):
   - Clicks "Show 4 low priority items"
   - Scans quickly
   - Deletes 3 promotional emails
   - Dismisses 1
   - Stats update: 15 triaged / 15 total (100%)

6. Empty state appears:
   "🎉 Inbox Zero Achieved!"
   "You triaged 15 items in 6 minutes"
   "Your streak: 🔥 7 days"

Total time: 6 minutes ✅
Result: 3 items in Read Later queue, inbox zero achieved
```

---

### **Flow 2: Focused Reading Session** (30 minutes later)

```
1. User ready to read (8:30 AM)
   → Clicks "Library" in left nav
   → Clicks "Read Later" tab

2. Read Later queue shows 5 items:
   (3 from this morning + 2 from yesterday)

   Items sorted by when added (newest first):
   - The Future of AI (added 30 min ago) · 12 min
   - Design Systems at Scale (added 2h ago) · 8 min
   - Understanding Rust (added yesterday) · 15 min
   - React Performance (added yesterday) · 10 min
   - TypeScript Deep Dive (added yesterday) · 20 min

3. User chooses shortest: "Design Systems at Scale" (8 min)
   → Clicks card → Opens in reader

4. Reading experience:
   - Clean, distraction-free layout
   - Serif body text, good line height
   - User reads first 2 paragraphs
   - Selects key quote: "Design systems enable consistency..."
   - Popup appears with color options
   - Chooses yellow → Text highlighted
   - Toast: "Highlight saved! 💡"

   - Continues reading
   - Highlights 2 more passages (green, blue)
   - Scrolls to bottom
   - Progress bar: 100% complete

5. User finishes article:
   → Clicks "← Back to Library"
   → Returns to "Read Later" tab
   → Article still visible (not auto-removed)
   → User can manually remove OR leave it (flexible)

6. User repeats with next article

Total time: 30 minutes
Result: 2 articles read, 6 highlights captured
```

---

### **Flow 3: Knowledge Synthesis** (End of week)

```
1. User wants to export highlights (Friday evening)
   → Clicks "Highlights" in left nav

2. Highlights page shows 47 captured insights
   - Organized by highlight color (filter option)
   - Each card shows: quote + source + date + tags

3. User filters by tag "AI" (12 highlights)
   → Scans highlights from the week
   → Sees patterns emerging across multiple articles

4. User clicks [Export] button
   → Modal opens

5. Export modal:
   - Format: Markdown (selected)
   - Include: ☑ Citations ☑ Tags ☑ Timestamps ☑ Links
   - Preview shows formatted output

   Preview:
   "# Highlights from Omnivore

    ## The Future of AI
    **Tags**: #AI #Technology

    > 'Large language models represent...'"

6. User clicks [Copy to Clipboard]
   → Toast: "Copied 12 highlights! 📋"
   → User switches to Obsidian
   → Pastes into new note "AI Insights - Week 51"
   → Begins synthesizing ideas across highlights

Result: Weekly knowledge synthesis completed
```

---

## 🚀 Implementation Priorities

### **Phase 1: Today Page** (Highest Priority)
```
Week 1-2:
  ✅ Hero stats section (greeting, counts, progress bar)
  ✅ DigestCard component (4 actions, AI summary, priority indicator)
  ✅ Priority sections (High/Medium/Low, collapsible)
  ✅ Triaged section (bottom, with undo)
  ✅ Empty state (celebration)
  ✅ Real-time stats updates
  ✅ Animations (card fade, progress bar)
```

### **Phase 2: Library Tabs** (High Priority)
```
Week 2-3:
  ✅ Rename tabs (All, Read Later, Starred, Trash)
  ✅ Read Later functionality (new tab + logic)
  ✅ Filter dropdown (comprehensive, multi-select)
  ✅ Active filter chips (removable)
  ✅ Tab behaviors (empty states, counts)
```

### **Phase 3: Export & Highlights** (High Priority)
```
Week 3-4:
  ✅ Export modal (format selection, preview)
  ✅ Export formats (Markdown, JSON, Plain Text, CSV)
  ✅ Copy to clipboard functionality
  ✅ Download file functionality
```

### **Phase 4: Reader Polish** (Medium Priority)
```
Week 4-5:
  ✅ Highlight popup (color picker)
  ✅ Highlight sidebar (optional)
  ✅ Reading progress bar (bottom, animated)
  ✅ Beautiful typography (serif body, good spacing)
  ✅ Smooth interactions (highlight save, progress update)
```

### **Phase 5: Mobile Responsive** (Medium Priority)
```
Week 5-6:
  ✅ All pages responsive (320px → 1920px)
  ✅ Touch interactions (swipe, long-press)
  ✅ Bottom navigation (mobile)
  ✅ Action sheets (mobile modals)
```

### **Phase 6: Polish & Testing** (Before Launch)
```
Week 6-7:
  ✅ Keyboard shortcuts (j/k, h, a, etc.)
  ✅ Loading states (skeletons)
  ✅ Error states (toasts, retry)
  ✅ Performance optimization (lazy loading, virtual scroll)
  ✅ Accessibility audit (WCAG 2.1 AA)
  ✅ End-to-end testing
```

---

## ✅ Success Criteria

**We've succeeded when**:

1. **Morning Triage** (5 minutes):
   - User opens app → Today page loads
   - AI summaries are helpful and accurate
   - Can triage 15+ items in < 10 minutes
   - Feels satisfying (progress bar, streaks, celebration)

2. **Reading Flow** (Smooth):
   - Read Later queue is easy to find and use
   - Reader is distraction-free and beautiful
   - Highlighting feels effortless (no lag, clear feedback)
   - Progress is automatically saved

3. **Knowledge Synthesis** (Powerful):
   - All highlights in one place (unified view)
   - Export to Markdown works perfectly
   - Citations are accurate and helpful
   - Can paste into Obsidian/Notion seamlessly

4. **No Email Vibes**:
   - Doesn't feel like Gmail or Outlook
   - Folder management is minimal (AI does the work)
   - Users feel empowered, not overwhelmed

5. **Visual Polish** (Professional):
   - Dark theme is consistent and beautiful
   - Animations are smooth (60fps)
   - Typography is readable and elegant
   - Empty states are helpful and delightful

6. **Mobile Works** (Touch-friendly):
   - All interactions work on mobile
   - No hover-only features
   - Touch targets are 44x44pt minimum
   - Swipe gestures feel natural

---

## 🎨 Design Deliverables for Lovable

**For each page, provide**:

1. **Desktop mockup** (1440px width)
   - Default state with content
   - Empty states
   - Hover states
   - Active/selected states

2. **Mobile mockup** (375px width)
   - Responsive layout
   - Touch interactions
   - Bottom navigation

3. **Component variations**:
   - DigestCard (high/medium/low priority, triaged)
   - LibraryCard (all tab, read later tab, starred tab)
   - HighlightCard (different colors, with actions)
   - Export Modal (all states)

4. **Interaction flows**:
   - Morning triage flow (8 steps)
   - Read Later flow (save → read → remove)
   - Highlight creation flow (select → color → save)
   - Export flow (click → select format → preview → download)

5. **Design system docs**:
   - Color palette (all colors with hex codes)
   - Typography scale (all sizes, weights, line heights)
   - Spacing system (4px grid)
   - Component library (all reusable components)

---

## 🔥 THE VISION - In One Sentence

> **Omnivore: AI-powered reading tool that surfaces what matters, captures your insights, and synthesizes knowledge—not another email client.**

---

## 🚀 Let's Build This!

This is THE definitive MVP foundation. Everything we need to get to production and market-ready.

**Key Differentiators**:
- ✅ AI-first workflow (not manual folder management)
- ✅ Reading-focused (not email-client vibes)
- ✅ Knowledge synthesis (highlights → export → build lasting knowledge)
- ✅ Beautiful, polished, professional
- ✅ Fast, smooth, delightful

**Timeline to MVP**: 6-8 weeks
**Timeline to Production**: +2 weeks (testing, polish)
**Timeline to Market**: 2-3 months total

---

**Ready to ship!** 🎉
