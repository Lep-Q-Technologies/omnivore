# Library Content Sources & Organization

**Date**: December 20, 2024
**Context**: Define how different content types and sources appear in Library
**Based on**: Updated tab structure (All, In Progress, Read Later, Starred, Trash)

---

## 🎯 Core Principle

**Content Source Doesn't Dictate Location**

Instead, **reading state** dictates which tab content appears in:
- **All**: Everything (regardless of source)
- **In Progress**: Currently reading (any source)
- **Read Later**: Queued to read (any source)
- **Starred**: Favorites (any source)
- **Trash**: Deleted (any source)

**Source type** (newsletter, RSS, manual, upload) is just **metadata** shown on cards.

---

## 📥 **Content Sources** (How Items Enter Library)

### **1. Newsletters** 📧
- **How**: Email arrives at `tim-newsletter-xyz@omnivore.app`
- **Process**: Webhook → Parse → Extract → Create library item
- **Default State**: Appears in **All** (unread, 0% progress)
- **Source Tag**: `[NEWSLETTER]` badge
- **Example**:
  ```
  ┌────────────────────────────────────────────────┐
  │ 📧 [NEWSLETTER] Dense Discovery #287           │
  │ Kai Brach · Dense Discovery · 2h ago · 12 min │
  │ AI  Design                                     │
  └────────────────────────────────────────────────┘
  ```

### **2. RSS Feeds** 📡
- **How**: Cron job polls feed → New item → Create library item
- **Process**: Feed refresh → Parse XML → Create library item
- **Default State**: Appears in **All** (unread, 0% progress)
- **Source Tag**: `[RSS]` badge
- **Example**:
  ```
  ┌────────────────────────────────────────────────┐
  │ 📡 [RSS] Understanding React Server Components │
  │ Dan Abramov · Hacker News · 4h ago · 8 min    │
  │ React  Programming                             │
  └────────────────────────────────────────────────┘
  ```

### **3. Podcasts** 🎙️
- **How**: RSS feed with audio enclosure → Create library item
- **Process**: Feed refresh → Parse enclosure → Create library item
- **Default State**: Appears in **All** (unread, 0% progress)
- **Source Tag**: `[PODCAST]` badge
- **Transcript**: Available if generated (future feature)
- **Example**:
  ```
  ┌────────────────────────────────────────────────┐
  │ 🎙️ [PODCAST] Lex Fridman #392: Yann LeCun     │
  │ Lex Fridman · Lex Fridman Podcast · 3h ago    │
  │ Duration: 2hr 15min · Transcript available     │
  │ AI  Machine-Learning                           │
  └────────────────────────────────────────────────┘
  ```

### **4. YouTube Videos** 📺
- **How**: RSS feed for channel → New video → Create library item
- **Process**: Feed refresh → Parse video → Create library item
- **Default State**: Appears in **All** (unread, 0% progress)
- **Source Tag**: `[YOUTUBE]` badge
- **Transcript**: Available if generated (future feature)
- **Example**:
  ```
  ┌────────────────────────────────────────────────┐
  │ 📺 [YOUTUBE] How Transformers Really Work      │
  │ 3Blue1Brown · YouTube · 5h ago · 25 min video │
  │ Transcript available                           │
  │ Machine-Learning  Explained                    │
  └────────────────────────────────────────────────┘
  ```

### **5. Manual Adds** (Extension, Add Button, Share) 🔗
- **How**: User clicks [+ Add] → Paste URL → Save
- **Process**: Fetch URL → Extract content → Create library item
- **Default State**: Appears in **Read Later** by default ✨
- **Source Tag**: `[ARTICLE]` or `[SAVED]` badge
- **Example**:
  ```
  ┌────────────────────────────────────────────────┐
  │ 🔗 [SAVED] The State of JavaScript 2024        │
  │ Saved via Extension · 6h ago · 15 min         │
  │ JavaScript  Survey                             │
  └────────────────────────────────────────────────┘
  ```

### **6. Document Uploads** (PDF, EPUB, HTML) 📄
- **How**: User clicks [+ Add] → Upload file
- **Process**: Upload → Parse → Extract text → Create library item
- **Default State**: Appears in **Read Later** by default ✨
- **Source Tag**: `[PDF]`, `[EPUB]`, or `[HTML]` badge
- **Examples**:

  **PDF Upload**:
  ```
  ┌────────────────────────────────────────────────┐
  │ 📄 [PDF] Attention Is All You Need (Paper)     │
  │ Uploaded by you · 1h ago · 32 pages           │
  │ File: attention-is-all-you-need.pdf            │
  │ Machine-Learning  Research-Paper               │
  └────────────────────────────────────────────────┘
  ```

  **EPUB Upload**:
  ```
  ┌────────────────────────────────────────────────┐
  │ 📚 [EPUB] The Phoenix Project (Book)           │
  │ Uploaded by you · 2d ago · 345 pages          │
  │ File: phoenix-project.epub                     │
  │ DevOps  Business  Book                         │
  └────────────────────────────────────────────────┘
  ```

  **HTML Upload**:
  ```
  ┌────────────────────────────────────────────────┐
  │ 🌐 [HTML] Local Documentation - React Docs     │
  │ Uploaded by you · 3h ago                       │
  │ File: react-docs.html                          │
  │ React  Documentation                           │
  └────────────────────────────────────────────────┘
  ```

---

## 📊 **Library Tab Organization**

### **All Tab** (Default View)
Shows **everything**, grouped by source type with visual indicators:

```
┌─ Library ───────────────────────────────────────────────┐
│  📚 All (21)  📖 In Progress (8)  ⏰ Read Later (12)   │
│      ▔▔▔                                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Showing 21 items                     [Filter ▼] [Sort ▼]│
│                                                          │
│  📧 Newsletters (5)                                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📧 [NEWSLETTER] Dense Discovery #287               │ │
│  │ Kai Brach · 2h ago · 12 min                        │ │
│  │ AI  Design                                         │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  📡 RSS Feeds (8)                                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📡 [RSS] Understanding React Server Components     │ │
│  │ Dan Abramov · Hacker News · 4h ago · 8 min        │ │
│  │ React  Programming                                 │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  🔗 Manually Added (4)                                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🔗 [SAVED] The State of JavaScript 2024            │ │
│  │ Saved via Extension · 6h ago · 15 min             │ │
│  │ JavaScript  Survey                                 │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  📄 Documents (3)                                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📄 [PDF] Attention Is All You Need                 │ │
│  │ Uploaded by you · 1h ago · 32 pages               │ │
│  │ Machine-Learning  Research-Paper                   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  🎙️ Podcasts (1)                                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🎙️ [PODCAST] Lex Fridman #392                      │ │
│  │ Lex Fridman Podcast · 3h ago · 2hr 15min          │ │
│  │ AI  Interview                                      │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Grouping** (Optional - can be toggled off):
- Groups by source type (Newsletters, RSS, Manual, Documents, Podcasts)
- User can disable grouping → show flat chronological list
- Grouping preference persists (localStorage)

---

### **Read Later Tab**
Shows items user **explicitly queued**:

```
┌─ Library ───────────────────────────────────────────────┐
│  📚 All  📖 In Progress  ⏰ Read Later (12)  ⭐ Starred │
│                              ▔▔▔▔▔▔▔▔▔▔                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  12 items to read                     [Filter ▼] [Sort ▼]│
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📄 [PDF] Attention Is All You Need                 │ │
│  │ Uploaded 1h ago · Added to Read Later 30 min ago  │ │ ← Shows when added
│  │ [Read Now] [Remove from Queue] [Star]             │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🔗 [SAVED] The State of JavaScript 2024            │ │
│  │ Saved 6h ago · Added to Read Later 5h ago         │ │
│  │ [Read Now] [Remove from Queue] [Star]             │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📧 [NEWSLETTER] Dense Discovery #285               │ │
│  │ Received 2d ago · Added to Read Later 1d ago      │ │ ← Newsletter in queue
│  │ [Read Now] [Remove from Queue] [Star]             │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Key Point**: Read Later contains **all sources** (newsletters, RSS, uploads, manual adds)

---

## 🆕 **Add Article Modal Updates**

### **Current "Save to Folder" Section** → **NEW "Add to Queue"**

**BEFORE** (Folders - Email thinking):
```
Save to:
○ Inbox
○ Archive
○ Favorites
```

**AFTER** (Reading states):
```
Add to:
☑ Read Later (default for manual adds)
☐ Start Reading Now (opens reader immediately)
```

---

### **Updated Add Article Modal**:

```
┌─ Add Article ───────────────────────────────────────────┐
│                                                      ✕   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [🔗 Article]  [📄 Document]  [📡 Subscribe]  ← Tabs   │
│      ▔▔▔▔▔▔▔                                            │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  Add Article or Web Page                                │
│                                                          │
│  URL:                                                    │
│  ┌────────────────────────────────────────────────────┐ │
│  │ https://example.com/article                        │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Add to:                                                 │
│  ☑ Read Later                          ← Default checked│
│  ☐ Start Reading Now                                    │
│                                                          │
│  Tags (optional):                                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │ AI, Programming                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  [Cancel]                                        [Save]   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Behavior**:
- **Read Later checked**: Item goes to Read Later tab
- **Start Reading Now checked**: Opens reader immediately (item still saved to library)
- **Neither checked**: Item goes to All tab (unread)
- **Both checked**: Opens reader + adds to Read Later queue

---

### **Document Tab** (Upload PDF, EPUB, HTML):

```
┌─ Add Article ───────────────────────────────────────────┐
│                                                      ✕   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [🔗 Article]  [📄 Document]  [📡 Subscribe]  ← Tabs   │
│                   ▔▔▔▔▔▔▔▔                              │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  Upload Document                                         │
│                                                          │
│  Supported formats: PDF, EPUB, HTML                     │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │           [📄 Click to Upload]                     │ │
│  │                                                    │ │
│  │     Or drag and drop file here                     │ │
│  │                                                    │ │
│  │     Max file size: 50MB                            │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  File: attention-is-all-you-need.pdf (2.3 MB)           │
│  ✅ Upload successful                                    │
│                                                          │
│  Title (auto-detected):                                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Attention Is All You Need                          │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Add to:                                                 │
│  ☑ Read Later                          ← Default checked│
│  ☐ Start Reading Now                                    │
│                                                          │
│  Tags (optional):                                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Machine-Learning, Research-Paper                   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  [Cancel]                                        [Save]   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Upload Process**:
1. User selects file (PDF, EPUB, HTML)
2. Upload to S3/R2 storage
3. Extract text content (PDF: pdfjs, EPUB: epub.js, HTML: parse directly)
4. Auto-detect title (from metadata or first heading)
5. User confirms title, adds tags
6. Item saved to library (Read Later by default)

---

## 🏷️ **Content Type Badges**

### **Visual Indicators on Cards**:

```css
/* Badge styles */
.content-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  margin-right: 8px;
}

/* Source types */
.badge-newsletter {
  background: rgba(139, 92, 246, 0.2);
  color: #8B5CF6;
}

.badge-rss {
  background: rgba(74, 158, 255, 0.2);
  color: #4A9EFF;
}

.badge-saved {
  background: rgba(255, 208, 52, 0.2);
  color: #FFD234;
}

.badge-pdf {
  background: rgba(255, 69, 58, 0.2);
  color: #FF453A;
}

.badge-epub {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
}

.badge-html {
  background: rgba(255, 149, 0, 0.2);
  color: #FF9500;
}

.badge-podcast {
  background: rgba(191, 90, 242, 0.2);
  color: #BF5AF2;
}

.badge-youtube {
  background: rgba(255, 69, 58, 0.2);
  color: #FF453A;
}
```

---

## 📋 **Filter Options** (Updated)

### **Filter by Source Type**:

```
[Filter ▼] Click → Dropdown:

┌─────────────────────────────┐
│ By Source Type:             │
│ ☐ Newsletters (5)           │
│ ☐ RSS Feeds (8)             │
│ ☐ Manually Added (4)        │
│ ☐ Uploaded Documents (3)    │
│ ☐ Podcasts (1)              │
│ ☐ YouTube (2)               │
├─────────────────────────────┤
│ By Document Type:           │
│ ☐ PDF (2)                   │
│ ☐ EPUB (1)                  │
│ ☐ HTML (0)                  │
├─────────────────────────────┤
│ By Reading Status:          │
│ ☐ Unread                    │
│ ☐ In Progress               │
│ ☐ Completed                 │
├─────────────────────────────┤
│ By Tags:                    │
│ ☐ AI (5)                    │
│ ☐ Programming (8)           │
│ ...                         │
└─────────────────────────────┘
```

---

## 🎯 **Key Distinctions**

### **Auto-Incoming vs. User-Added**:

| Source | How it Enters | Default Location | Badge |
|--------|---------------|------------------|-------|
| **Newsletters** | Email webhook | **All** (unread) | `[NEWSLETTER]` 📧 |
| **RSS Feeds** | Cron job poll | **All** (unread) | `[RSS]` 📡 |
| **Podcasts** | RSS feed poll | **All** (unread) | `[PODCAST]` 🎙️ |
| **YouTube** | RSS feed poll | **All** (unread) | `[YOUTUBE]` 📺 |
| **Manual Add** | User clicks [+ Add] | **Read Later** ✨ | `[SAVED]` 🔗 |
| **Extension** | Browser extension | **Read Later** ✨ | `[SAVED]` 🔗 |
| **PDF Upload** | User uploads file | **Read Later** ✨ | `[PDF]` 📄 |
| **EPUB Upload** | User uploads file | **Read Later** ✨ | `[EPUB]` 📚 |
| **HTML Upload** | User uploads file | **Read Later** ✨ | `[HTML]` 🌐 |

**Key Rule**:
- **Auto-incoming** (newsletters, RSS, podcasts) → **All** tab (user triages from Today)
- **User-added** (manual, extension, uploads) → **Read Later** tab (explicit intent to read)

---

## 🔄 **Workflow Examples**

### **Example 1: Newsletter Arrives**
```
1. Email arrives: newsletter@substack.com → tim-dense-discovery-xyz@omnivore.app
2. Webhook creates library item:
   - source: 'newsletter'
   - newsletter_name: 'Dense Discovery'
   - reading_progress: 0
   - read_later: false
3. Item appears in:
   - ✅ All tab (unread)
   - ✅ Today page (if received today)
4. User triages from Today:
   - Click [Read Later] → Moves to Read Later tab
   - OR click [Read Now] → Opens reader, appears in In Progress
```

### **Example 2: User Uploads PDF**
```
1. User clicks [+ Add] → Document tab
2. Upload: attention-is-all-you-need.pdf
3. System creates library item:
   - source: 'upload'
   - content_type: 'pdf'
   - reading_progress: 0
   - read_later: true (default for uploads)
4. Item appears in:
   - ✅ Read Later tab (default)
   - ✅ All tab (also visible there)
5. User clicks card:
   - Opens reader
   - Moves to In Progress (reading_progress > 0)
```

### **Example 3: RSS Feed Article**
```
1. Cron job polls Hacker News RSS feed
2. New article found → Create library item:
   - source: 'rss'
   - feed_name: 'Hacker News'
   - reading_progress: 0
   - read_later: false
3. Item appears in:
   - ✅ All tab (unread)
   - ✅ Today page (if published today)
4. User reads from Today:
   - Click [Read Now] → Opens reader
   - Appears in In Progress (1-99% progress)
```

---

## ✅ Summary

**Organization Principle**: **Reading state > Source type**

**Tabs**:
- **All**: Everything (grouped by source type)
- **In Progress**: Currently reading (any source)
- **Read Later**: Explicitly queued (any source)
- **Starred**: Favorites (any source)
- **Trash**: Deleted (any source)

**Default Locations**:
- Auto-incoming (newsletters, RSS) → **All** (triage from Today)
- User-added (manual, uploads) → **Read Later** (explicit intent)

**Content Type Badges**: Visual indicators (NEWSLETTER, RSS, PDF, EPUB, etc.)

**Add Modal Updates**:
- Remove "Save to Folder" (inbox/archive)
- Add "Add to: Read Later" checkbox
- Add "Start Reading Now" option

---

**Status**: Ready for implementation
**Next**: Update Add Article modal, update Library filtering
