# Omnivore MVP: AI-Powered Content Curation & Knowledge Synthesis Tool

**Version**: 2.1 - UPDATED WITH SYNTHESIS FEATURES
**Date**: December 20, 2024
**Status**: INCORPORATES USER FEEDBACK - READY FOR DESIGN
**Changelog**: Added tag grouping/topics, In Progress tab, highlights+tags integration, UI refinements

---

## 🎯 Core Product Vision

**What We're Building**:
An AI-powered reading and knowledge synthesis tool that helps users cut through content overload, capture insights with context-aware tagging, and build lasting knowledge through topic-based synthesis.

**NOT an email client. NOT a folder organizer. NOT manual labor.**

### **The Philosophy**:
> AI surfaces what matters → You read what resonates → Highlight with tags → Group by topics → Synthesize knowledge

### **The Workflow** (Evolved - Knowledge Synthesis Focus):
1. **Morning**: Open app → AI shows curated digest → Quick triage in 5 minutes
2. **Reading**: Choose from "Read Later" or continue "In Progress" → Deep focus in reader → Highlight key insights with tags
3. **Organization**: Group related tags into topics (e.g., "AI Research" topic with tags: #machine-learning #transformers #ethics)
4. **Synthesis**: View all highlights for a topic across all sources → Export to Obsidian/Notion → Build lasting knowledge

**No folders. No manual sorting. Knowledge emerges from tagged highlights grouped by topics.**

---

## 🏗️ Information Architecture

### **Primary Navigation** (Left Sidebar - Scrolls with Library):

**IMPORTANT UI CHANGE**: Left pane should scroll with library content (not fixed position)

```
┌─ OMNIVORE ──────────────────┐
│                              │ ← Scrolls with page
│  🌅 Today                    │ ← AI Digest (morning ritual)
│  📚 Library                  │ ← Full collection
│  💡 Highlights               │ ← Captured insights
│  🏷️  Tags                    │ ← Tag + topic management
│  📡 Feeds                    │ ← Sources
│                              │
│  ─── FEEDS ───────────       │
│  📡 RSS Feeds (72)           │
│    • Hacker News (30)        │
│    • CSS-Tricks (15)         │
│    • Daring Fireball (27)    │
│                              │
│  📧 Newsletters (8)          │
│    • Dense Discovery (3)     │
│    • Morning Brew (5)        │
│                              │
│  🎙️  Podcasts (6)            │
│    • The Daily (2)           │
│    • Lex Fridman (4)         │
│                              │
│  📺 YouTube (4)              │
│    • Veritasium (2)          │
│    • 3Blue1Brown (2)         │
└──────────────────────────────┘
```

**Mental Model**:
- **Today** = What's new and needs my attention (AI-curated, all sources)
- **Library** = Everything I've saved (all content, reading states)
- **Highlights** = What I've captured (insights with tags, grouped by topics)
- **Tags** = How I organize + topic grouping (synthesis foundation)
- **Feeds** = Where content comes from (all sources)

---

### **Library Tabs** (Updated with "In Progress"):

```
┌────────────────────────────────────────────────────────────────────────┐
│  📚 All  📖 In Progress  ⏰ Read Later  ⭐ Starred  🗑️ Trash  [Select] │
└────────────────────────────────────────────────────────────────────────┘
```

**What Each Tab Means** (Updated):

| Tab | Purpose | User Intent | Backend Filter | Source |
|-----|---------|-------------|----------------|---------|
| **All** | Your complete library | "Show me everything" | All items (not deleted) | All sources |
| **In Progress** ✨ **NEW** | Currently reading | "Continue where I left off" | `reading_progress > 0 AND reading_progress < 100` | All sources |
| **Read Later** | Intentionally queued | "What did I save to read?" | `read_later = true AND reading_progress = 0` | Today triage, Add button, Extension |
| **Starred** | Important favorites | "Show me the best stuff" | `starred = true` | All sources |
| **Trash** | Deleted items | "Oops, I deleted something" | `folder = trash` | All sources |

**Reading State Taxonomy** (Clarified):
- **Unread** (no special marker): Item exists in library, not started (0% progress)
- **Read Later** (⏰ badge): Item queued for reading (from Today triage, Add button, Extension)
- **In Progress** (📖 badge + progress bar): User has started reading (1-99% progress)
- **Completed** (100% progress bar): User finished reading (no checkmark needed)
- **Starred** (⭐ filled yellow): User marked as favorite (independent of reading state)

**NOT like email**:
- ❌ No "Inbox" (that's email thinking)
- ❌ No "Archive" (everything is in your library, not "archived away")
- ✅ "All" = Your full collection (shows all reading states)
- ✅ "In Progress" = Resume reading easily
- ✅ "Read Later" = Intentional queue (from triage, manual adds, extension)

---

### **Toolbar** (Updated - Remove AI Priority Sort):

```
┌──────────────────────────────────────────────────────────────────┐
│  [Filter ▼]  [Sort: Most Recent ▼]  [Comfortable ▼]  [⊞]  [☰]  [Select] │
│      ↑              ↑                       ↑          ↑    ↑       ↑    │
│  Filtering       Sorting                Density     Grid List  Multi    │
└──────────────────────────────────────────────────────────────────┘
```

**Sort Options** (Updated - AI Priority Removed for Now):
```
[Sort: Most Recent ▼]
  ├─ Most Recent (savedAt DESC)
  ├─ Oldest First (savedAt ASC)
  ├─ Recently Updated (updatedAt DESC)
  ├─ Title (A-Z)
  ├─ Author (A-Z)
  ├─ Reading Time (shortest first)
  ├─ Reading Time (longest first)
  └─ Publication Date (newest first)
```

**AI Priority** (Deferred - Future Smart Feature):
- Removed from initial release
- Will be added later as learned/suggested behavior
- After user builds up history (highlights, tags, reading patterns):
  - "We noticed you read a lot about AI and highlight content from Paul Graham. Would you like us to prioritize similar content in your Today digest?"
  - User can accept/decline
  - Opt-in, not default
- Smart system learns preferences over time

---

## 📄 Page Designs

### **1. Today Page** - Updated with Diverse Content Examples

**Diverse Content in Digest** (Show Variety):

```
┌─ 🔥 High Priority ──────────────────────────────────────┐
│  3 items                                                 │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🔥 [NEWSLETTER] The Future of AI in Software       │ │
│  │ Paul Graham · Dense Discovery · 2h ago · ⏱️ 12 min │ │
│  │ ✨ AI Summary: LLMs transform dev, 10x cost...     │ │
│  │ [Read Now] [Read Later] [Dismiss] [Delete]         │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🔥 [PODCAST] Lex Fridman #392: Yann LeCun          │ │
│  │ Lex Fridman · Lex Fridman Podcast · 3h ago · 2hr  │ │
│  │ 🎙️ Podcast Transcript Available                    │ │
│  │ ✨ AI Summary: Discussion on AI safety, future...  │ │
│  │ [Read Now] [Read Later] [Dismiss] [Delete]         │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🔥 [YOUTUBE] How Transformers Really Work          │ │
│  │ 3Blue1Brown · YouTube · 5h ago · ⏱️ 25 min (video) │ │
│  │ 📺 Video Transcript Available                       │ │
│  │ ✨ AI Summary: Visual explanation of attention...  │ │
│  │ [Read Now] [Read Later] [Dismiss] [Delete]         │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘

┌─ 📌 Medium Priority ────────────────────────────────────┐
│  8 items  [Show/Hide ▼]                                 │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📌 [RSS] Understanding React Server Components     │ │
│  │ Dan Abramov · Hacker News · 4h ago · ⏱️ 8 min      │ │
│  │ ✨ AI Summary: New rendering pattern, server...    │ │
│  │ [Read Now] [Read Later] [Dismiss] [Delete]         │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📌 [ARTICLE] The State of JavaScript 2024          │ │
│  │ Saved via Extension · 6h ago · ⏱️ 15 min           │ │
│  │ ✨ AI Summary: Survey results show TypeScript...   │ │
│  │ [Read Now] [Read Later] [Dismiss] [Delete]         │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Content Type Indicators**:
- **[NEWSLETTER]** - From email address (Morning Brew, Dense Discovery, etc.)
- **[RSS]** - From RSS feed (Hacker News, TechCrunch, blogs)
- **[PODCAST]** 🎙️ - Podcast episode (with transcript)
- **[YOUTUBE]** 📺 - YouTube video (with transcript)
- **[ARTICLE]** - Manually saved (Extension, Add button)

**AI Summary Styling** (Same for All Content Types):
- Blue background box with subtle tint
- Sparkle icon (✨) clearly indicates AI
- 2-3 sentence limit keeps it scannable

---

### **2. Library Page** - Updated LibraryCard Design

#### **LibraryCard Component** (Revised - Star Icon + Hover Menu):

**MAJOR UI CHANGES**:
1. ✅ Star icon moved to **top-right corner** (all view modes)
2. ✅ Star styling: **Yellow outline on hover, filled yellow when starred**
3. ❌ **Remove green checkmark** (redundant with progress bar)
4. ✅ **Add "Read Later" to hover menu**
5. ✅ **Add "Mark as Read" to hover menu**

**Card Design Specs** (Updated):

```
┌─────────────────────────────────────────────────────────┐
│ [Cover Image]                                      ⭐   │ ← Star: top-right
│                                                          │
│ ████████████████░░░░░░ 68% complete                     │ ← Progress bar (if in progress)
│                                                          │
│ The Future of AI: How Large Language Models Are...      │ ← Title
│ Paul Graham · Hacker News · 2h ago · ⏱️ 12 min          │ ← Metadata
│                                                          │
│ This article explores how LLMs are transforming...      │ ← Excerpt (2 lines)
│                                                          │
│ AI  Programming  React                                   │ ← Tags (clickable)
│                                                          │
│ [Three-dot menu appears on hover]                  •••  │ ← Hover menu
└─────────────────────────────────────────────────────────┘
```

**Star Icon Behavior**:
```
Default (not starred):
  - Icon: ⭐ outline (stroke only, no fill)
  - Color: #666666 (muted gray)
  - Visible: Always (top-right corner)

Hover (not starred):
  - Icon: ⭐ outline (thicker stroke)
  - Color: #FFD234 (brand yellow)
  - Cursor: pointer

Starred:
  - Icon: ⭐ filled
  - Color: #FFD234 (brand yellow)
  - Visible: Always

Click behavior:
  - Toggle starred state
  - Animate: Scale 1.2x for 200ms (bounce effect)
  - Toast: "Starred!" or "Unstarred!"
```

**Hover Menu (Three-Dot)** (Updated):
```
[•••] Click/Tap → Dropdown appears:

┌─────────────────────────────┐
│ 👁️  Read Now                │ ← Opens in reader
│ ⏰ Read Later               │ ← ✨ NEW - Add to queue
│ ⭐ Star / Unstar            │ ← Toggle starred
│ ✅ Mark as Read             │ ← ✨ NEW - Set 100% progress
│ 🏷️  Edit Tags               │ ← Open tag picker
│ 🗑️  Delete                  │ ← Move to trash
└─────────────────────────────┘
```

**Reading State Badges** (Replace Green Checkmark):

Instead of green checkmark, use **progress bar + badges**:

```
Unread (0% progress):
  - No badge
  - No progress bar

Read Later (queued):
  - Badge: ⏰ (top-left corner, small, blue)
  - No progress bar

In Progress (1-99%):
  - Badge: 📖 (top-left corner, small, blue)
  - Progress bar at bottom (gradient: blue → green)
  - Percentage text: "68% complete"

Completed (100%):
  - Progress bar: Full (green)
  - Text: "100% complete" (small, green)
  - NO green checkmark (redundant)

Starred (independent):
  - Star icon: ⭐ filled yellow (top-right corner)
```

**Tag Click Behavior** (NEW):
```
User clicks tag on LibraryCard:
  → Navigate to Library page
  → Apply filter: selected tag
  → Show filtered results
  → Active filter chip: [AI ✕]

Example:
  Click "AI" tag on card
  → Library page loads
  → Filter dropdown shows: ☑ AI
  → URL: /library?tags=ai
  → Only items with "AI" tag visible
```

---

### **3. Tags Page** - Updated with Topic Grouping

**NEW CONCEPT**: **Tag Grouping / Topics**

**Purpose**: Allow users to group related tags into topics for knowledge synthesis.

**Example Use Case**:
```
Researcher studying AI Ethics:

Topic: "AI Ethics Research"
  ├─ #machine-learning
  ├─ #bias
  ├─ #fairness
  ├─ #regulation
  └─ #transparency

All highlights with these tags belong to "AI Ethics Research" topic.
Enables cross-source synthesis (newsletters, podcasts, articles, videos).
```

---

#### **Tags Page Layout** (Updated):

```
┌─ Tags ──────────────────────────────────────────────────┐
│  🏷️  25 tags  |  📚 3 topics                             │
│                                                          │
│  [🔍 Search tags...]                      [+ New Topic]  │
│                                                          │
│  ┌─ Topics ─────────────────────────────────────────┐   │
│  │                                                   │   │
│  │  📚 AI Ethics Research                  [•••]     │   │
│  │  5 tags  ·  47 highlights  ·  12 articles        │   │
│  │  #machine-learning #bias #fairness #regulation   │   │
│  │  Created: Dec 15, 2024  ·  Last updated: 2h ago  │   │
│  │                                                   │   │
│  │  📚 React Performance                   [•••]     │   │
│  │  3 tags  ·  23 highlights  ·  8 articles         │   │
│  │  #react #performance #optimization               │   │
│  │                                                   │   │
│  │  📚 Design Systems                      [•••]     │   │
│  │  4 tags  ·  31 highlights  ·  15 articles        │   │
│  │  #design-systems #figma #tokens #accessibility   │   │
│  │                                                   │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ All Tags ────────────────────────────────────────┐   │
│  │  Name             Count     Last Used    [Actions] │   │
│  │  ○ AI             (47)      2 hours ago  [•••]    │   │ ← Click count → filter
│  │  ○ Programming    (35)      5 hours ago  [•••]    │   │
│  │  ○ React          (28)      1 day ago    [•••]    │   │
│  │  ○ Design         (23)      2 days ago   [•••]    │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Topics Section** (NEW):
```
┌─ Create Topic Modal ─────────────────────────────────────┐
│  Create New Topic                                    ✕   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Topic Name:                                             │
│  ┌────────────────────────────────────────────────────┐ │
│  │ AI Ethics Research                                 │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Description (optional):                                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Research on ethical implications of AI systems,    │ │
│  │ bias detection, and regulatory frameworks.         │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Select Tags to Include:                                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [🔍 Search tags...]                                │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ ☑ machine-learning (12 highlights)                 │ │
│  │ ☑ bias (8 highlights)                              │ │
│  │ ☑ fairness (15 highlights)                         │ │
│  │ ☑ regulation (6 highlights)                        │ │
│  │ ☑ transparency (6 highlights)                      │ │
│  │ ☐ react (28 highlights)                            │ │
│  │ ☐ design (23 highlights)                           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  This topic will include 47 highlights across          │
│  12 articles, 3 podcasts, 1 video.                      │
│                                                          │
│  [Cancel]                              [Create Topic]   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Topic Card** (Clickable):
```
Click topic card:
  → Navigate to Highlights page
  → Filter by all tags in topic
  → URL: /highlights?topic=ai-ethics-research
  → Show all highlights with ANY of the topic's tags
  → Group by source (articles, podcasts, videos)
  → Export all highlights for this topic
```

**Tags Count Click Behavior** (Existing, Clarified):
```
User clicks tag count (47):
  → Navigate to Library page
  → Apply filter: selected tag
  → Show all items with that tag
  → URL: /library?tags=ai

Example:
  Click "AI (47)" on Tags page
  → Library page loads
  → Filter: AI tag selected
  → 47 items displayed
```

---

### **4. Highlights Page** - Updated with Tags Integration

**NEW**: Highlights now support tagging (in addition to color-coding)

**Highlight Creation Workflow** (Updated):

```
Step 1: Select text in reader
  → Popup appears

Step 2: Choose color + add tags
┌───────────────────────────────────────┐
│  [🟡] [🟢] [🔵] [🟣] [🔴] [🟠]  [✕] │ ← Color picker
│                                       │
│  Add tags (optional):                 │
│  ┌─────────────────────────────────┐ │
│  │ #machine-learning #ethics       │ │ ← Tag input (autocomplete)
│  └─────────────────────────────────┘ │
│                                       │
│  Note (optional):                     │
│  ┌─────────────────────────────────┐ │
│  │ Important point about bias...   │ │
│  └─────────────────────────────────┘ │
│                                       │
│  [Save Highlight]                     │
└───────────────────────────────────────┘

Step 3: Highlight saved
  → Text background changes to selected color
  → Tags attached to highlight
  → Toast: "Highlight saved with 2 tags! 💡"
```

**Highlights Page Layout** (Updated with Tags):

```
┌─ Highlights ────────────────────────────────────────────┐
│  💡 47 highlights  |  12 articles  |  5 sources          │
│                                                          │
│  [Filter: All Colors ▼] [Filter: All Tags ▼]  [Export]  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🟡 "Large language models represent a            │  │
│  │     fundamental shift in how we interact..."     │  │
│  │                                                   │  │
│  │ Tags: #machine-learning #transformers            │  │ ← NEW: Tags
│  │                                                   │  │
│  │ From: The Future of AI (Newsletter)              │  │
│  │ Paul Graham · 5h ago                             │  │
│  │                                                   │  │
│  │ [View Article] [Edit Tags] [Copy] [Delete]       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🔵 "Attention mechanisms allow models to focus   │  │
│  │     on relevant parts of the input..."           │  │
│  │                                                   │  │
│  │ Tags: #machine-learning #attention #explained    │  │ ← NEW: Tags
│  │                                                   │  │
│  │ From: How Transformers Really Work (YouTube)     │  │
│  │ 3Blue1Brown · 2 days ago                         │  │
│  │                                                   │  │
│  │ Note: Great visual explanation of Q, K, V        │  │
│  │                                                   │  │
│  │ [View Article] [Edit Tags] [Copy] [Delete]       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🟢 "Bias in AI systems can emerge from training │  │
│  │     data, model architecture, or deployment..."  │  │
│  │                                                   │  │
│  │ Tags: #bias #ethics #fairness                    │  │ ← NEW: Tags
│  │                                                   │  │
│  │ From: AI Ethics: A Critical Review (Podcast)     │  │
│  │ Lex Fridman #392 · 1 week ago                    │  │
│  │                                                   │  │
│  │ [View Article] [Edit Tags] [Copy] [Delete]       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Filter by Tags** (NEW):
```
[Filter: All Tags ▼] Click → Dropdown:

┌─────────────────────────────┐
│ [🔍 Search tags...]         │
├─────────────────────────────┤
│ ☐ All Tags                  │
│ ☑ machine-learning (12)     │
│ ☑ ethics (8)                │
│ ☐ react (5)                 │
│ ☐ design (3)                │
├─────────────────────────────┤
│ Topics:                     │
│ ○ AI Ethics Research        │ ← Click → filter by all tags in topic
│ ○ React Performance         │
└─────────────────────────────┘

Behavior:
  - Multi-select tags (AND logic)
  - OR select a topic (shows all highlights with ANY tag in topic)
  - Click topic → quick filter for synthesis workflow
```

**Tag Click on Highlight Card**:
```
User clicks tag (#machine-learning):
  → Apply filter: show only highlights with that tag
  → Active filter chip: [#machine-learning ✕]
  → Can add more tags to refine (AND logic)
```

---

### **5. Export Modal** - Updated with Topic-Based Export

**Export by Topic** (NEW):

```
┌─────────────────────────────────────────────────────────┐
│  Export Highlights                                  ✕   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Export 47 highlights from "AI Ethics Research" topic.  │
│                                                         │
│  Format:                                                │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Markdown (.md) - Grouped by Tag              ▼   │ │ ← NEW option
│  └───────────────────────────────────────────────────┘ │
│    Options:                                             │
│    - Markdown (.md) - Chronological                     │
│    - Markdown (.md) - Grouped by Tag        ✨ NEW      │
│    - Markdown (.md) - Grouped by Source                 │
│    - JSON (.json)                                       │
│    - Plain Text (.txt)                                  │
│    - CSV (.csv)                                         │
│                                                         │
│  Include:                                               │
│  ☑ Source citations                                     │
│  ☑ Tags                                                 │
│  ☑ Timestamps                                           │
│  ☑ Article links                                        │
│  ☑ Notes                                   ✨ NEW       │
│  ☐ Full article text                                    │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Preview:                                               │
│  ┌───────────────────────────────────────────────────┐ │
│  │ # AI Ethics Research                              │ │
│  │                                                   │ │
│  │ **Topic**: AI Ethics Research                     │ │
│  │ **Tags**: #machine-learning, #bias, #fairness,    │ │
│  │           #regulation, #transparency              │ │
│  │ **Highlights**: 47                                │ │
│  │ **Sources**: 12 articles, 3 podcasts, 1 video    │ │
│  │ **Exported**: December 20, 2024                   │ │
│  │                                                   │ │
│  │ ---                                               │ │
│  │                                                   │ │
│  │ ## #machine-learning (12 highlights)             │ │
│  │                                                   │ │
│  │ ### The Future of AI (Newsletter)                │ │
│  │ **Author**: Paul Graham                           │ │
│  │ **Date**: December 19, 2024                       │ │
│  │                                                   │ │
│  │ > "Large language models represent a             │ │
│  │ > fundamental shift in how we interact..."       │ │
│  │                                                   │ │
│  │ **Note**: Key insight on paradigm shift          │ │
│  │ **Tags**: #machine-learning, #transformers       │ │
│  │                                                   │ │
│  │ [View Article](https://omnivore.app/reader/xyz)  │ │
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
```

**Export Grouping Options** (NEW):
1. **Chronological** - All highlights ordered by date (default)
2. **Grouped by Tag** ✨ - Highlights organized by tag (perfect for topics)
3. **Grouped by Source** - Highlights organized by article/podcast/video

**Topic-Based Export Workflow**:
```
User on Tags page:
  1. Click topic card: "AI Ethics Research"
  2. Navigate to Highlights page (filtered by topic tags)
  3. Click [Export] button
  4. Export modal opens with topic context
  5. Format: "Markdown - Grouped by Tag" (recommended)
  6. Preview shows highlights organized by tag
  7. Click [Download]
  8. File saved: `ai-ethics-research-2024-12-20.md`
  9. Open in Obsidian → Start synthesizing!
```

---

## 🎯 Key User Flows (Updated)

### **Flow 1: Morning Triage** (Updated with Diverse Content)

```
1. User opens app (8:00 AM)
   → Lands on "Today" page

2. Hero stats show:
   "Good morning! ☀️"
   "📬 15 New Items    ⏱️ ~8 min to triage    🔥 7 day streak"
   "📰 5 Newsletters  📡 4 RSS  🎙️ 3 Podcasts  📺 2 Videos  📄 1 Article"

3. High Priority section (3 items):
   - [NEWSLETTER] AI article → Read Now (opens reader)
   - [PODCAST] Lex Fridman → Read Later (adds to queue)
   - [YOUTUBE] 3Blue1Brown → Dismiss (not interested now)

4. Medium Priority (8 items):
   - Scans AI summaries
   - Read Later: 2 items
   - Dismiss: 6 items

5. Low Priority (4 items):
   - Promotional content → Delete all

6. Result: 15 items triaged in 6 minutes ✅
   - 1 read immediately (podcast transcript)
   - 3 in Read Later queue
   - 11 dismissed/deleted
```

### **Flow 2: Topic-Based Synthesis** ✨ **NEW**

```
1. User researching AI Ethics for paper (Friday afternoon)
   → Clicks "Tags" in left nav

2. Views "AI Ethics Research" topic:
   - 5 tags: #machine-learning, #bias, #fairness, #regulation, #transparency
   - 47 highlights across 12 articles, 3 podcasts, 1 video

3. Click topic card:
   → Navigate to Highlights page
   → Filtered by all tags in topic
   → 47 highlights displayed (grouped by tag in export)

4. Review highlights by tag:
   - #machine-learning: 12 highlights (technical foundation)
   - #bias: 8 highlights (problem space)
   - #fairness: 15 highlights (solutions)
   - #regulation: 6 highlights (policy frameworks)
   - #transparency: 6 highlights (implementation)

5. Click [Export] button:
   → Modal opens
   → Format: "Markdown - Grouped by Tag"
   → Include: Citations, Tags, Timestamps, Notes
   → Preview looks good

6. Click [Download]:
   → File saved: `ai-ethics-research-2024-12-20.md`

7. Open in Obsidian:
   → Create new note: "AI Ethics Paper - Literature Review"
   → Paste exported highlights
   → Start synthesizing across sources
   → Draw connections between podcast discussions, articles, videos
   → Build argument structure from grouped highlights

Result: Cross-source synthesis enabled by topic-based grouping ✅
```

### **Flow 3: Continuing In-Progress Reading** ✨ **NEW**

```
1. User wants to continue reading (Evening)
   → Clicks "Library" in left nav
   → Clicks "In Progress" tab

2. In Progress shows 3 items:
   - "The Future of AI" (68% complete, newsletter)
   - "React Server Components" (23% complete, article)
   - "Lex Fridman #392" (45% complete, podcast transcript)

3. User clicks "The Future of AI":
   → Opens in reader
   → Automatically scrolls to last reading position (68%)
   → User continues reading
   → Highlights 2 more passages (tags: #AI, #predictions)

4. User finishes article:
   → Progress bar reaches 100%
   → Badge changes from 📖 to progress bar only (green)
   → Item remains in "In Progress" (can filter by 100%)
   → OR moves to "All" (user preference)

5. User clicks [Mark as Read] in hover menu (optional):
   → Explicitly marks as completed
   → Can filter by "completed" status later

Result: Easy to resume reading, clear progress tracking ✅
```

---

## 🆕 New Backend Requirements

### **1. Reading States** (Database Schema Updates):

```sql
-- Migration: Add reading state fields
ALTER TABLE library_item ADD COLUMN reading_progress INTEGER DEFAULT 0; -- 0-100
ALTER TABLE library_item ADD COLUMN read_later BOOLEAN DEFAULT FALSE;
ALTER TABLE library_item ADD COLUMN marked_as_read BOOLEAN DEFAULT FALSE; -- Explicit "done"
ALTER TABLE library_item ADD COLUMN starred BOOLEAN DEFAULT FALSE;
ALTER TABLE library_item ADD COLUMN added_to_read_later_at TIMESTAMP;
ALTER TABLE library_item ADD COLUMN completed_reading_at TIMESTAMP;

-- Indexes for filtering
CREATE INDEX idx_library_item_reading_progress ON library_item(reading_progress);
CREATE INDEX idx_library_item_read_later ON library_item(read_later);
CREATE INDEX idx_library_item_starred ON library_item(starred);
```

### **2. Highlight Tags** (Database Schema Updates):

```sql
-- Migration: Add tags to highlights
ALTER TABLE highlight ADD COLUMN tags TEXT[]; -- Array of tag names
ALTER TABLE highlight ADD COLUMN note TEXT; -- Optional user note

-- Index for tag-based filtering
CREATE INDEX idx_highlight_tags ON highlight USING GIN(tags);
```

### **3. Topics** (New Table):

```sql
-- Migration: Create topics table
CREATE TABLE topic (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES omnivore.user(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  tag_ids UUID[] NOT NULL, -- Array of tag IDs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Index for user topics
CREATE INDEX idx_topic_user_id ON topic(user_id);

-- Computed field: highlight_count (via query)
-- Computed field: article_count (via query)
```

### **4. GraphQL Schema Updates**:

```graphql
# Reading states
type LibraryItem {
  id: ID!
  # ... existing fields
  readingProgress: Int! # 0-100
  readLater: Boolean!
  markedAsRead: Boolean!
  starred: Boolean!
  addedToReadLaterAt: DateTime
  completedReadingAt: DateTime
}

# Highlight tags
type Highlight {
  id: ID!
  # ... existing fields
  tags: [String!]! # Array of tag names
  note: String
}

# Topics
type Topic {
  id: ID!
  name: String!
  description: String
  tags: [Label!]! # Array of Tag objects
  highlightCount: Int!
  articleCount: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
}

# Queries
type Query {
  topics: [Topic!]!
  topic(id: ID!): Topic
  highlightsByTopic(topicId: ID!): [Highlight!]!
}

# Mutations
type Mutation {
  # Reading states
  addToReadLater(itemId: ID!): LibraryItem!
  removeFromReadLater(itemId: ID!): LibraryItem!
  toggleStarred(itemId: ID!): LibraryItem!
  markAsRead(itemId: ID!): LibraryItem!
  updateReadingProgress(itemId: ID!, progress: Int!): LibraryItem!

  # Highlight tags
  addTagsToHighlight(highlightId: ID!, tags: [String!]!): Highlight!
  updateHighlightNote(highlightId: ID!, note: String!): Highlight!

  # Topics
  createTopic(input: CreateTopicInput!): Topic!
  updateTopic(id: ID!, input: UpdateTopicInput!): Topic!
  deleteTopic(id: ID!): DeleteResult!
}

input CreateTopicInput {
  name: String!
  description: String
  tagIds: [ID!]!
}
```

---

## 📋 Updated Implementation Priorities

### **Phase 1: Core UX Refinements** (Week 1-2)
- [ ] Update LibraryCard: Move star to top-right, remove checkmark
- [ ] Add "In Progress" tab to Library
- [ ] Add "Read Later" to hover menu
- [ ] Add "Mark as Read" to hover menu
- [ ] Implement tag click navigation (Library + Tags page)
- [ ] Reading progress tracking (0-100%)

### **Phase 2: Highlights + Tags Integration** (Week 2-3)
- [ ] Add tag input to highlight popup
- [ ] Display tags on highlight cards
- [ ] Filter highlights by tags
- [ ] Update export to include tags and notes

### **Phase 3: Topics Feature** (Week 3-4)
- [ ] Create topics table and GraphQL schema
- [ ] Implement "Create Topic" modal
- [ ] Display topics on Tags page
- [ ] Topic-based highlight filtering
- [ ] Topic-based export (grouped by tag)

### **Phase 4: Diverse Content Support** (Week 4-5)
- [ ] Update Today page with diverse examples
- [ ] Content type indicators ([NEWSLETTER], [RSS], [PODCAST], [YOUTUBE])
- [ ] Podcast transcript support
- [ ] YouTube transcript support
- [ ] AI summaries for all content types

### **Phase 5: Polish & Testing** (Week 5-6)
- [ ] Left pane scroll behavior
- [ ] Star icon animations
- [ ] Progress bar polish
- [ ] Tag autocomplete
- [ ] Topic management UI polish
- [ ] Cross-browser testing

---

## 🎯 Success Criteria (Updated)

**We've succeeded when**:

1. **Morning Triage** (5 minutes):
   - ✅ Diverse content types in Today (newsletters, RSS, podcasts, videos)
   - ✅ AI summaries for all content types
   - ✅ Can triage 15+ items in <10 minutes

2. **Reading States** (Clear):
   - ✅ "In Progress" tab shows items user started (1-99% progress)
   - ✅ "Read Later" tab shows queued items (from triage, extension, manual adds)
   - ✅ Star icon is prominent and easy to use (top-right, yellow)
   - ✅ No redundant UI elements (checkmark removed)

3. **Knowledge Synthesis** (Powerful):
   - ✅ Highlights support tags (in addition to colors)
   - ✅ Topics group related tags for synthesis
   - ✅ Can view all highlights for a topic across all sources
   - ✅ Export by topic is grouped by tag (perfect for Obsidian)
   - ✅ Researcher workflow feels natural (collect → tag → group → synthesize)

4. **Tag Interactions** (Intuitive):
   - ✅ Clicking tag on card → filters library by that tag
   - ✅ Clicking tag count on Tags page → filters library
   - ✅ Clicking topic → filters highlights by all topic tags

5. **Smart AI** (Learned, Not Forced):
   - ✅ AI Priority sort removed for now
   - ✅ After user builds history, system suggests personalized sorting
   - ✅ Opt-in, not default (respects user agency)

---

## 🚀 Key Differentiators (Updated)

**vs. Pocket/Instapaper**:
- ✅ AI summaries for all content types
- ✅ Topic-based knowledge synthesis (not just saving)
- ✅ Highlights with tags (context-aware)
- ✅ Cross-source synthesis (newsletters + podcasts + videos + articles)

**vs. Readwise Reader**:
- ✅ Open-source and self-hostable
- ✅ Topic grouping for synthesis (unique feature)
- ✅ No forced AI prioritization (user agency)
- ✅ Unified highlight view across all sources

**vs. Notion/Obsidian**:
- ✅ Automatic content ingestion (newsletters, RSS, podcasts)
- ✅ AI-powered triage (saves time)
- ✅ Highlight-first workflow (capture while reading)
- ✅ Export to Obsidian/Notion for deeper synthesis

---

## 📝 Summary of Changes (v2.0 → v2.1)

### **UI/UX Refinements**:
1. ✅ Left pane scrolls with library (not fixed)
2. ✅ Star icon: top-right corner, yellow outline/fill
3. ✅ Remove green checkmark (redundant)
4. ✅ Add "In Progress" tab (1-99% reading progress)
5. ✅ Add "Read Later" to hover menu
6. ✅ Add "Mark as Read" to hover menu

### **Content Diversity**:
7. ✅ Show diverse content types in Today (newsletters, RSS, podcasts, videos, articles)
8. ✅ Content type indicators: [NEWSLETTER], [RSS], [PODCAST], [YOUTUBE], [ARTICLE]
9. ✅ AI summaries for all content types

### **Knowledge Synthesis**:
10. ✅ Highlights support tags (in addition to colors)
11. ✅ Topics feature: group related tags for synthesis
12. ✅ Topic-based highlight filtering
13. ✅ Export grouped by tag (perfect for topics)

### **Tag Interactions**:
14. ✅ Click tag on card → filter library
15. ✅ Click tag count on Tags page → filter library
16. ✅ Click topic → filter highlights by all topic tags

### **AI Evolution**:
17. ✅ Remove AI Priority sort for now (deferred to learned behavior)
18. ✅ Future: Suggest personalized sorting after user builds history (opt-in)

---

**Version**: 2.1
**Status**: Ready for design implementation
**Next**: Create Figma mockups based on this spec

---

**This specification supersedes v2.0 and incorporates all user feedback from December 20, 2024.**
