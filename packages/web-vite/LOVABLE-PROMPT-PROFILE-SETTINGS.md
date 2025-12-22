# Lovable Prompt: Profile & Settings Pages

**Date**: December 21, 2024
**Version**: 1.0
**Purpose**: Complete UI/UX specification for Profile and Settings pages in Omnivore

---

## 🎯 Design Philosophy

**Profile Page**: Personal identity, preferences, and account information
**Settings Page**: Application configuration, integrations, and advanced features

**Key Principle**: Profile = "Who you are", Settings = "How the app behaves"

---

## 📱 Profile Page

### **Page Layout**

```
┌─────────────────────────────────────────────────────────────┐
│ Profile                                          [Save]      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─ User Identity ─────────────────────────────────────┐    │
│  │                                                       │    │
│  │  ┌────────┐                                          │    │
│  │  │        │   Tim Wilson                             │    │
│  │  │ Avatar │   tim@example.com                        │    │
│  │  │ Photo  │   Member since March 2024                │    │
│  │  └────────┘                                          │    │
│  │            [Change Photo]                            │    │
│  │                                                       │    │
│  │  Full Name       [Tim Wilson              ]          │    │
│  │  Email           [tim@example.com          ]          │    │
│  │  Username        [@timwilson              ]          │    │
│  │  Password        [••••••••••] [Change Password]      │    │
│  │                                                       │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─ Account Statistics ─────────────────────────────────┐    │
│  │                                                       │    │
│  │  📚 287 Items Saved    ⏱ 42h Reading Time           │    │
│  │  ✨ 156 Highlights     🔥 12-day Streak              │    │
│  │  🎯 78% Completion     📖 Reading since Mar 2024     │    │
│  │                                                       │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─ Appearance ──────────────────────────────────────────┐    │
│  │                                                       │    │
│  │  Theme                                                │    │
│  │  ○ Light  ● Dark  ○ System                          │    │
│  │                                                       │    │
│  │  Reader Font Size                                     │    │
│  │  [────●────────] Medium                              │    │
│  │   Small      Medium      Large                       │    │
│  │                                                       │    │
│  │  Library Density                                      │    │
│  │  ○ Compact  ● Comfortable  ○ Spacious               │    │
│  │                                                       │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─ Localization ────────────────────────────────────────┐    │
│  │                                                       │    │
│  │  Language        [English (US)         ▾]            │    │
│  │  Timezone        [America/New_York     ▾]            │    │
│  │  Date Format     [MM/DD/YYYY           ▾]            │    │
│  │  Time Format     ● 12-hour  ○ 24-hour                │    │
│  │                                                       │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─ Notifications ───────────────────────────────────────┐    │
│  │                                                       │    │
│  │  Email Notifications                                  │    │
│  │  ☑ Daily digest (new items, highlights)              │    │
│  │  ☑ Weekly summary (reading stats, insights)          │    │
│  │  ☐ Newsletter recommendations                        │    │
│  │                                                       │    │
│  │  Digest Schedule  [9:00 AM           ▾]              │    │
│  │  Digest Timezone  [America/New_York  ▾]              │    │
│  │                                                       │    │
│  │  Push Notifications                                   │    │
│  │  ☐ New items added to Today                          │    │
│  │  ☐ Reading reminders                                 │    │
│  │                                                       │    │
│  │  Quiet Hours                                          │    │
│  │  ☑ Enable quiet hours                                │    │
│  │  From [10:00 PM  ▾]  To [7:00 AM   ▾]               │    │
│  │                                                       │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─ Subscription (Cloud Users Only) ────────────────────┐    │
│  │                                                       │    │
│  │  Current Plan:  Pro Plan ($7/month)                  │    │
│  │  Next Billing:  January 15, 2025                     │    │
│  │  Storage Used:  1.2 GB / 10 GB                       │    │
│  │                                                       │    │
│  │  [Manage Subscription]  [View Invoices]              │    │
│  │  [Update Payment Method]                             │    │
│  │                                                       │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─ Danger Zone ─────────────────────────────────────────┐    │
│  │                                                       │    │
│  │  🗂 Export All Data                                   │    │
│  │  Download your library, highlights, and settings      │    │
│  │  [Export Data]                                        │    │
│  │                                                       │    │
│  │  🗑 Delete Account                                    │    │
│  │  Permanently delete your account and all data         │    │
│  │  [Delete Account]                                     │    │
│  │                                                       │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### **Profile Page Sections Specification**

#### **1. User Identity**

**Avatar Upload**:
- **Current avatar display**: 80x80px circular image
- **Default avatar**: User initials on gradient background (e.g., "TW" for Tim Wilson)
- **Change photo flow**:
  1. Click [Change Photo]
  2. File picker opens (accept: .jpg, .png, .gif, max 5MB)
  3. Image preview with crop tool (1:1 aspect ratio)
  4. [Cancel] [Upload] buttons
  5. Success: "Profile photo updated"

**Form Fields**:
- **Full Name**: Text input, max 100 characters, required
- **Email**: Text input, validated email format, required
  - Shows warning if changing: "We'll send a verification email to your new address"
- **Username**: Text input, alphanumeric + underscore/hyphen, 3-30 characters, unique
  - Real-time validation: "Username available ✓" or "Username taken ✗"
- **Password**: Masked input, shows [Change Password] button
  - Click opens modal:
    ```
    Change Password
    ─────────────────
    Current Password  [••••••••••]
    New Password      [••••••••••]
    Confirm Password  [••••••••••]

    Password strength: ████░░ Medium

    [Cancel] [Change Password]
    ```

**Member Since**:
- Display format: "Member since March 2024"
- Non-editable, shown as gray text below email

---

#### **2. Account Statistics**

**Stats Grid** (2x3 layout):

| Stat | Icon | Value | Description |
|------|------|-------|-------------|
| Items Saved | 📚 | 287 | Total library items (all states) |
| Reading Time | ⏱ | 42h | Cumulative time spent reading |
| Highlights | ✨ | 156 | Total highlights created |
| Streak | 🔥 | 12 days | Consecutive days with activity |
| Completion Rate | 🎯 | 78% | Items read / items saved |
| Reading Since | 📖 | Mar 2024 | Account creation month |

**Visual Design**:
- Light background card with rounded corners
- Stats displayed in 2 rows, 3 columns
- Icon + number + label format
- Hover effect: subtle highlight on each stat
- Click on stat: Navigate to analytics dashboard (future feature)

**Calculation Logic**:
```typescript
// Items Saved: Count all library items
SELECT COUNT(*) FROM library_item WHERE user_id = ?

// Reading Time: Sum all reading sessions
SELECT SUM(reading_duration_seconds) / 3600 FROM reading_session WHERE user_id = ?

// Highlights: Count all highlights
SELECT COUNT(*) FROM highlight WHERE user_id = ?

// Streak: Days with consecutive activity
WITH daily_activity AS (
  SELECT DISTINCT DATE(created_at) as activity_date
  FROM library_item WHERE user_id = ?
  UNION
  SELECT DISTINCT DATE(created_at) FROM highlight WHERE user_id = ?
)
-- Calculate consecutive days ending today

// Completion Rate: Items marked as read / total items
SELECT
  ROUND(COUNT(CASE WHEN reading_progress = 100 THEN 1 END)::float / COUNT(*) * 100)
FROM library_item WHERE user_id = ?

// Reading Since: Account creation date
SELECT DATE_FORMAT(created_at, '%b %Y') FROM omnivore_user WHERE id = ?
```

---

#### **3. Appearance**

**Theme Selection**:
- **Options**: Light / Dark / System (follows OS preference)
- **UI**: Radio buttons with preview icons
- **Apply**: Immediate (no save button needed)
- **Preview**: Show theme sample next to each option

```
○ Light   [☀️ Sample preview in light theme]
● Dark    [🌙 Sample preview in dark theme]  ← Currently selected
○ System  [💻 Matches your system settings]
```

**Reader Font Size**:
- **Control**: Slider with 5 stops (XS / S / M / L / XL)
- **Default**: Medium (M)
- **Preview**: Live preview text updates as you drag
- **Range**: 14px (XS) → 22px (XL)

```
Reader Font Size
[─────●──────] Medium
 XS   S   M   L   XL

Preview: "The quick brown fox jumps over the lazy dog"
```

**Library Density**:
- **Options**: Compact / Comfortable / Spacious
- **UI**: Radio buttons with visual examples
- **Impact**:
  - Compact: 60px card height, 8px padding
  - Comfortable: 80px card height, 12px padding
  - Spacious: 100px card height, 16px padding

```
○ Compact     [Preview: Tight card spacing]
● Comfortable [Preview: Medium card spacing]  ← Currently selected
○ Spacious    [Preview: Loose card spacing]
```

---

#### **4. Localization**

**Language**:
- **Dropdown**: Search-enabled dropdown with flag icons
- **Options**: English (US), English (UK), Spanish, French, German, Japanese, etc.
- **Default**: Browser language or English (US)
- **Warning**: "Some translations may be incomplete" if selecting non-English

**Timezone**:
- **Dropdown**: Search-enabled, grouped by region
- **Auto-detect**: Show detected timezone with "Use detected timezone" button
- **Example**: `America/New_York (EST, UTC-5)`
- **Impact**: Affects digest schedule, reading stats timestamps

**Date Format**:
- **Options**: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
- **Preview**: Shows today's date in selected format
- **Example**:
  ```
  Date Format     [MM/DD/YYYY  ▾]
  Preview: 12/21/2024
  ```

**Time Format**:
- **Options**: 12-hour (9:00 AM) / 24-hour (09:00)
- **UI**: Radio buttons
- **Default**: 12-hour (matches US locale)

---

#### **5. Notifications**

**Email Notifications**:

| Setting | Default | Description |
|---------|---------|-------------|
| Daily digest | ✓ | New items added today, recent highlights |
| Weekly summary | ✓ | Reading stats, insights, newsletter recommendations |
| Newsletter recommendations | ✗ | AI-suggested newsletters based on reading |

**Digest Schedule**:
- **Time picker**: Dropdown with 30-minute intervals (e.g., 9:00 AM, 9:30 AM)
- **Timezone**: Uses timezone from Localization section
- **Preview**: "Next digest: Tomorrow at 9:00 AM EST"

**Push Notifications** (Web/Mobile):

| Setting | Default | Description |
|---------|---------|-------------|
| New items added to Today | ✗ | Notification when AI adds items to Today page |
| Reading reminders | ✗ | Daily reminder to read (customizable time) |

**Quiet Hours**:
- **Toggle**: Enable/disable quiet hours
- **Time range**: From (dropdown) → To (dropdown)
- **Impact**: No push notifications during this window
- **Default**: 10:00 PM → 7:00 AM

```
Quiet Hours
☑ Enable quiet hours
From [10:00 PM ▾]  To [7:00 AM ▾]

No notifications will be sent during this time.
```

---

#### **6. Subscription (Cloud Users Only)**

**Note**: This section only appears for Omnivore Cloud users, NOT self-hosted users.

**Current Plan Display**:
- **Plan name**: Free / Pro / Team
- **Price**: $0/month, $7/month, $15/user/month
- **Next billing date**: January 15, 2025
- **Storage used**: Progress bar (e.g., 1.2 GB / 10 GB)

```
┌─ Subscription ────────────────────────────────┐
│                                               │
│  Current Plan:  Pro Plan ($7/month)          │
│  Next Billing:  January 15, 2025             │
│                                               │
│  Storage Used:  1.2 GB / 10 GB                │
│  [████████░░░░░░░░░░] 12%                    │
│                                               │
│  [Manage Subscription]  [View Invoices]      │
│  [Update Payment Method]                     │
│                                               │
└───────────────────────────────────────────────┘
```

**Manage Subscription** → Opens Stripe customer portal:
- View plan details
- Upgrade/downgrade plan
- Cancel subscription
- Download invoices

**View Invoices** → Modal with invoice history:
```
Invoice History
───────────────────────────────────
Dec 15, 2024  $7.00  [Download PDF]
Nov 15, 2024  $7.00  [Download PDF]
Oct 15, 2024  $7.00  [Download PDF]
```

**Update Payment Method** → Stripe payment method update:
- Update credit card
- Add PayPal (if supported)
- Remove old payment methods

---

#### **7. Danger Zone**

**Export All Data**:
- **Button**: [Export Data]
- **Flow**:
  1. Click [Export Data]
  2. Modal: "Export your data"
     ```
     Export Your Data
     ────────────────────────────────
     We'll create a ZIP file containing:
     - Library items (JSON)
     - Highlights and notes (JSON)
     - Reading statistics (CSV)
     - User settings (JSON)

     This may take a few minutes.

     [Cancel] [Start Export]
     ```
  3. Background job starts
  4. Email sent when ready: "Your export is ready"
  5. Download link valid for 7 days

**Delete Account**:
- **Button**: [Delete Account] (red, outlined)
- **Flow**:
  1. Click [Delete Account]
  2. Modal: "Delete your account"
     ```
     ⚠️ Delete Your Account
     ────────────────────────────────
     This will permanently delete:
     - Your library (287 items)
     - Your highlights (156)
     - Your reading history
     - Your account settings

     This action CANNOT be undone.

     Type your email to confirm:
     [_________________________]

     [Cancel] [Delete My Account]
     ```
  3. User types email (must match exactly)
  4. Click [Delete My Account]
  5. Account marked for deletion (30-day grace period)
  6. Email sent: "Your account will be deleted in 30 days. Click here to cancel."

---

## ⚙️ Settings Page

### **Page Layout**

```
┌─────────────────────────────────────────────────────────────┐
│ Settings                                                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [General] [Integrations] [Advanced] [About]                 │
│                                                               │
│  ┌─ General Tab ─────────────────────────────────────────┐   │
│  │                                                        │   │
│  │  ── Reading Experience ──                             │   │
│  │                                                        │   │
│  │  Reader Layout                                         │   │
│  │  ○ Single Column  ● Two Columns  ○ Three Columns     │   │
│  │                                                        │   │
│  │  Content Width                                         │   │
│  │  [────●──────] 680px                                  │   │
│  │   Narrow    Medium    Wide                            │   │
│  │                                                        │   │
│  │  Auto-Scroll Speed (when enabled)                      │   │
│  │  [──●────────] Slow                                   │   │
│  │   Very Slow   Slow   Medium   Fast                    │   │
│  │                                                        │   │
│  │  ── Tags & Organization ──                            │   │
│  │                                                        │   │
│  │  ☑ Auto-tag items by source                           │   │
│  │  ☑ Auto-tag newsletters by name                       │   │
│  │  ☐ Suggest tags based on content                      │   │
│  │                                                        │   │
│  │  ── AI Features ──                                    │   │
│  │                                                        │   │
│  │  AI Summaries                                          │   │
│  │  ● Enabled  ○ Disabled                                │   │
│  │                                                        │   │
│  │  AI Provider                                           │   │
│  │  [OpenAI (GPT-4)              ▾]                      │   │
│  │                                                        │   │
│  │  OpenAI API Key                                        │   │
│  │  [sk-••••••••••••••••••••]  [Test Connection]        │   │
│  │                                                        │   │
│  │  ☑ Share anonymous usage data to improve AI           │   │
│  │                                                        │   │
│  │  ── Keyboard Shortcuts ──                             │   │
│  │                                                        │   │
│  │  [View All Shortcuts]  [Customize Shortcuts]          │   │
│  │                                                        │   │
│  │  ── Data Management ──                                │   │
│  │                                                        │   │
│  │  Auto-Cleanup                                          │   │
│  │  ☑ Delete trashed items after 30 days                 │   │
│  │  ☐ Delete read items after 1 year                     │   │
│  │                                                        │   │
│  │  Storage                                               │   │
│  │  Cache Size: 245 MB  [Clear Cache]                    │   │
│  │                                                        │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### **Settings Page Tabs**

---

#### **Tab 1: General**

##### **Reading Experience**

**Reader Layout**:
- **Options**: Single Column / Two Columns / Three Columns
- **Default**: Two Columns
- **Impact**: Changes how library items are displayed
- **Preview**: Show visual example next to each option

**Content Width** (for reader view):
- **Slider**: 480px (Narrow) → 880px (Wide)
- **Default**: 680px (Medium)
- **Live preview**: Updates reader pane width in real-time
- **Recommended**: 680px for optimal readability

**Auto-Scroll Speed**:
- **Context**: When user enables auto-scroll in reader
- **Slider**: Very Slow → Fast (5 levels)
- **Default**: Slow
- **Preview**: [Test Auto-Scroll] button opens demo

---

##### **Tags & Organization**

**Auto-Tagging Settings**:

| Setting | Default | Behavior |
|---------|---------|----------|
| Auto-tag items by source | ✓ | Adds tag: #newsletter, #rss, #article, #pdf |
| Auto-tag newsletters by name | ✓ | Adds tag: #dense-discovery, #morning-brew |
| Suggest tags based on content | ✗ | AI suggests tags from article content |

**Tag Suggestion Rules** (if enabled):
- Analyze article content with AI
- Suggest up to 5 relevant tags
- User can accept/reject suggestions
- Learn from user choices over time

---

##### **AI Features**

**AI Summaries**:
- **Toggle**: Enabled / Disabled
- **Default**: Enabled (for new users)
- **Impact**: Shows AI-generated summaries on library cards

**AI Provider**:
- **Dropdown options**:
  - OpenAI (GPT-4) ← Default
  - OpenAI (GPT-3.5-turbo) ← Faster, cheaper
  - Anthropic (Claude) ← Alternative
  - Local (Ollama) ← Privacy-focused, self-hosted only
- **API Key field**: Masked input, validates on blur
- **Test Connection**: Sends test request to verify API key

**Privacy Controls**:
- **Share anonymous usage data**: Toggle (default: ON)
- **What's shared**: Article metadata (title, length), not content
- **Purpose**: Improve AI recommendations and summaries
- **Opt-out**: Fully functional without sharing

---

##### **Keyboard Shortcuts**

**View All Shortcuts** → Opens modal:
```
Keyboard Shortcuts
──────────────────────────────────────
Navigation
  j / ↓     Next item
  k / ↑     Previous item
  Enter     Open item
  Esc       Close item

Actions
  e         Archive
  #         Delete
  s         Star/Unstar
  l         Add to Read Later
  t         Add tag

Reader
  f         Toggle fullscreen
  →         Next page
  ←         Previous page

[Close]
```

**Customize Shortcuts** → Opens customization UI:
- Editable key bindings
- Conflict detection
- Reset to defaults option

---

##### **Data Management**

**Auto-Cleanup**:
- **Delete trashed items after 30 days**: Default ON
  - Permanently deletes items in Trash after 30 days
  - Show warning before enabling: "Items will be permanently deleted"
- **Delete read items after 1 year**: Default OFF
  - Auto-delete completed items after 365 days
  - Excludes starred items (never auto-delete)

**Storage**:
- **Cache size display**: Shows total cache size (e.g., 245 MB)
- **Clear Cache button**: Clears downloaded images, article content cache
- **Effect**: Frees up disk space, may slow down next load

---

#### **Tab 2: Integrations**

```
┌─ Integrations Tab ─────────────────────────────────────┐
│                                                         │
│  ── Connected Services ──                              │
│                                                         │
│  📝 Obsidian                                           │
│  Export highlights and notes to Obsidian               │
│  [Configure Obsidian Export]                           │
│                                                         │
│  🗒 Notion                                             │
│  Sync your library to Notion database                  │
│  [Connect Notion]                                      │
│                                                         │
│  🌐 Readwise                                           │
│  Export highlights to Readwise                         │
│  [Connect Readwise]                                    │
│                                                         │
│  ── Browser Extension ──                               │
│                                                         │
│  Install the Omnivore browser extension to save        │
│  articles with one click.                              │
│                                                         │
│  [Download for Chrome]  [Download for Firefox]         │
│  [Download for Safari]  [Download for Edge]            │
│                                                         │
│  ── Export Options ──                                  │
│                                                         │
│  Export Format                                          │
│  ☑ Include highlights in exports                       │
│  ☑ Include notes in exports                            │
│  ☐ Include reading statistics                          │
│                                                         │
│  Default Export Format  [Markdown        ▾]            │
│                                                         │
│  ── API Access ──                                      │
│                                                         │
│  API Key: sk_live_•••••••••••  [Show] [Regenerate]    │
│  [View API Documentation]                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

##### **Connected Services**

**Obsidian Integration**:
- **Flow**: Click [Configure Obsidian Export]
- **Modal**:
  ```
  Configure Obsidian Export
  ─────────────────────────────────
  Vault Path    [/Users/tim/Obsidian ▾]
  Export Folder [Omnivore/           ]

  Export Format
  ○ Daily note (append to daily note)
  ● Separate files (one file per article)

  Template
  [Custom template editor...]

  [Cancel] [Save Configuration]
  ```
- **Background sync**: Auto-export new highlights to Obsidian

**Notion Integration**:
- **Flow**: Click [Connect Notion] → OAuth flow → Select database
- **Configuration**:
  - Choose Notion database (or create new)
  - Map fields: Title, URL, Tags, Highlights, Reading Progress
  - Sync frequency: Real-time / Hourly / Daily

**Readwise Integration**:
- **Flow**: Click [Connect Readwise] → Enter Readwise API key
- **Auto-export**: Highlights automatically synced to Readwise

---

##### **Browser Extension**

**Download Links**:
- Chrome Web Store
- Firefox Add-ons
- Safari Extensions
- Edge Add-ons

**Extension Features** (shown as info):
- Save articles with one click
- Highlight text on any webpage
- Add notes inline
- Auto-sync to Omnivore

---

##### **Export Options**

**Export Settings**:
- **Include highlights**: Export with embedded highlights
- **Include notes**: Export with user notes
- **Include reading statistics**: Export with read time, progress, etc.

**Default Export Format**:
- Markdown (default)
- HTML
- PDF
- JSON (structured data)

---

##### **API Access**

**API Key Management**:
- **Show key**: Click [Show] to reveal full API key
- **Regenerate**: Creates new key, invalidates old one
  - Warning: "This will break existing integrations"
- **Documentation**: Link to API docs with examples

---

#### **Tab 3: Advanced**

```
┌─ Advanced Tab ─────────────────────────────────────────┐
│                                                         │
│  ── Experimental Features ──                           │
│                                                         │
│  ⚠️ These features are experimental and may change     │
│                                                         │
│  ☐ AI-powered reading recommendations                  │
│  ☐ Automatic topic detection                           │
│  ☐ Reading speed analysis                              │
│  ☐ Voice narration (text-to-speech)                    │
│                                                         │
│  ── Data & Privacy ──                                  │
│                                                         │
│  Data Location (Self-Hosted Only)                      │
│  Database: PostgreSQL (localhost:5432)                 │
│  Storage Path: /var/omnivore/data                      │
│                                                         │
│  Privacy Mode                                           │
│  ☐ Disable analytics tracking                          │
│  ☐ Disable telemetry                                   │
│  ☐ Don't track reading time                            │
│                                                         │
│  ── Developer Options ──                               │
│                                                         │
│  ☐ Enable developer console                            │
│  ☐ Show debug information                              │
│  ☐ Log API requests                                    │
│                                                         │
│  [Open Developer Console]                              │
│                                                         │
│  ── Import / Export ──                                 │
│                                                         │
│  Import Data                                            │
│  [Import from Pocket]                                  │
│  [Import from Instapaper]                              │
│  [Import from Readwise]                                │
│  [Import from JSON]                                    │
│                                                         │
│  Export Data                                            │
│  [Export Full Library (JSON)]                          │
│  [Export Highlights Only (Markdown)]                   │
│  [Export Reading Stats (CSV)]                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

##### **Experimental Features**

**Feature Flags** (can be toggled on/off):

| Feature | Description | Risk Level |
|---------|-------------|------------|
| AI-powered recommendations | Today page shows AI-suggested content | Medium |
| Automatic topic detection | Group tags into topics automatically | Low |
| Reading speed analysis | Track WPM and suggest pacing | Low |
| Voice narration | Text-to-speech for articles | Medium |

**Warning Banner**:
```
⚠️ Experimental Features
These features are in active development and may have bugs.
Use at your own risk. Feedback appreciated!
```

---

##### **Data & Privacy**

**Data Location** (Self-Hosted Only):
- Show database connection info (read-only)
- Show storage path for uploaded files
- Link to data management docs

**Privacy Mode** (granular controls):
- **Disable analytics tracking**: No Google Analytics or similar
- **Disable telemetry**: No error reporting to Sentry
- **Don't track reading time**: No reading session recording

---

##### **Developer Options**

**Debug Tools**:
- **Enable developer console**: Shows debug logs in browser console
- **Show debug information**: Display API response times, cache hits
- **Log API requests**: Console log all GraphQL/REST requests

**Open Developer Console**: Opens modal with:
- GraphQL playground
- Database query tool (self-hosted only)
- Cache inspector
- Log viewer

---

##### **Import / Export**

**Import Sources**:
- **Pocket**: OAuth flow, imports all saved articles
- **Instapaper**: CSV upload or API connection
- **Readwise**: Import highlights back into Omnivore
- **JSON**: Upload JSON export from another Omnivore instance

**Import Flow** (example: Pocket):
1. Click [Import from Pocket]
2. OAuth authorization flow
3. Select what to import:
   ```
   Import from Pocket
   ──────────────────────────────
   ☑ Unread articles (1,247)
   ☑ Archived articles (3,456)
   ☐ Favorited articles (89)

   Tags: ● Import all  ○ Don't import

   [Cancel] [Start Import]
   ```
4. Background job processes import
5. Notification when complete: "Imported 1,247 articles from Pocket"

**Export Options**:
- **Full Library (JSON)**: Complete data export (same as Profile page)
- **Highlights Only (Markdown)**: Plain text export of all highlights
- **Reading Stats (CSV)**: Spreadsheet of reading statistics

---

#### **Tab 4: About**

```
┌─ About Tab ────────────────────────────────────────────┐
│                                                         │
│         ___                  _                         │
│        / _ \ _ __ ___  _ __ (_)_   _____  _ __ ___    │
│       | | | | '_ ` _ \| '_ \| \ \ / / _ \| '__/ _ \   │
│       | |_| | | | | | | | | | |\ V / (_) | | |  __/   │
│        \___/|_| |_| |_|_| |_|_| \_/ \___/|_|  \___|   │
│                                                         │
│  ── Version Information ──                             │
│                                                         │
│  Version:    v2.1.0                                    │
│  Build:      2024.12.21                                │
│  Environment: Production (Cloud)                        │
│  API Version: v1.2.0                                   │
│                                                         │
│  ☑ Check for updates automatically                     │
│  [Check for Updates Now]                               │
│                                                         │
│  ── Resources ──                                       │
│                                                         │
│  📖 Documentation       [View Docs]                    │
│  💬 Community Discord   [Join Discord]                 │
│  🐙 GitHub Repository   [View on GitHub]               │
│  🐛 Report a Bug        [Open Issue]                   │
│  💡 Request a Feature   [Share Feedback]               │
│                                                         │
│  ── Legal ──                                           │
│                                                         │
│  [Privacy Policy]  [Terms of Service]                  │
│  [Open Source Licenses]                                │
│                                                         │
│  ── Acknowledgments ──                                 │
│                                                         │
│  Built with ❤️ by the Omnivore community               │
│  Special thanks to all contributors                     │
│                                                         │
│  [View All Contributors]                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

##### **Version Information**

**Version Display**:
- **Version**: Semantic versioning (e.g., v2.1.0)
- **Build**: Date-based build number (2024.12.21)
- **Environment**: Production / Staging / Development (Cloud / Self-Hosted)
- **API Version**: Backend API version (independent versioning)

**Update Check**:
- **Auto-check**: Toggle to enable/disable auto-update checks
- **Manual check**: [Check for Updates Now] button
- **Notification**: Shows if update available:
  ```
  🎉 Update Available
  ──────────────────────────────
  v2.2.0 is now available!

  What's New:
  - Voice narration support
  - Improved AI summaries
  - Bug fixes and performance improvements

  [Release Notes] [Update Now]
  ```

---

##### **Resources**

**Quick Links**:
- **Documentation**: Opens docs.omnivore.app
- **Community Discord**: Invite link to Discord server
- **GitHub Repository**: Opens github.com/omnivore-app/omnivore
- **Report a Bug**: Opens GitHub issues with bug template pre-filled
- **Request a Feature**: Opens feature request form or GitHub discussions

---

##### **Legal**

**Policy Links**:
- **Privacy Policy**: Full privacy policy (opens in modal or new tab)
- **Terms of Service**: Legal terms (opens in modal or new tab)
- **Open Source Licenses**: Attribution for all OSS dependencies

**License Viewer** (click "Open Source Licenses"):
```
Open Source Licenses
────────────────────────────────
This software uses the following open source libraries:

React (MIT License)
  Copyright (c) Meta Platforms, Inc.
  [View License]

PostgreSQL (PostgreSQL License)
  Copyright (c) PostgreSQL Global Development Group
  [View License]

... (full list of dependencies)

[Close]
```

---

##### **Acknowledgments**

**Contributors Section**:
- ASCII art Omnivore logo
- "Built with ❤️ by the Omnivore community"
- [View All Contributors] → Opens GitHub contributors page or dedicated acknowledgments page

**Special Thanks** (optional):
- List major contributors
- Link to GitHub Sponsors
- Link to OpenCollective (if applicable)

---

## 🎨 Visual Design System

### **Color Palette**

**Profile Page**:
- Background: `#FFFFFF` (light) / `#1A1A1A` (dark)
- Card backgrounds: `#F9FAFB` (light) / `#2A2A2A` (dark)
- Primary action buttons: `#3B82F6` (blue)
- Danger zone buttons: `#EF4444` (red)
- Text primary: `#111827` (light) / `#F9FAFB` (dark)
- Text secondary: `#6B7280` (light) / `#9CA3AF` (dark)

**Settings Page**:
- Same as Profile, but with more emphasis on form elements
- Toggle switches: `#3B82F6` (active), `#D1D5DB` (inactive)
- Section dividers: `#E5E7EB` (light) / `#374151` (dark)

### **Typography**

**Headings**:
- Page title (Profile, Settings): 28px, Bold, `#111827`
- Section headers (── Reading Experience ──): 16px, Semi-bold, `#374151`
- Card titles: 18px, Semi-bold, `#111827`

**Body Text**:
- Form labels: 14px, Medium, `#374151`
- Help text: 13px, Regular, `#6B7280`
- Stats values: 20px, Bold, `#111827`
- Stats labels: 12px, Medium, `#6B7280`

### **Spacing**

**Profile Page**:
- Sections: 24px vertical gap
- Within sections: 16px vertical gap
- Form fields: 12px vertical gap
- Page padding: 32px (desktop), 16px (mobile)

**Settings Page**:
- Tab bar height: 48px
- Tab content padding: 24px
- Section dividers: 32px vertical margin
- Form groups: 16px vertical gap

### **Components**

**Buttons**:
- Primary: Blue background, white text, 8px padding, 6px border-radius
- Secondary: White background, blue border, blue text
- Danger: Red background, white text (for destructive actions)
- Sizes: Small (32px), Medium (40px), Large (48px)

**Form Inputs**:
- Height: 40px
- Border: 1px solid `#D1D5DB`
- Border radius: 6px
- Focus: Blue ring (2px)
- Placeholder: `#9CA3AF`

**Sliders**:
- Track height: 4px
- Thumb size: 16px circle
- Active color: `#3B82F6`
- Inactive color: `#D1D5DB`

**Toggle Switches**:
- Width: 44px, Height: 24px
- Active: `#3B82F6` background
- Inactive: `#D1D5DB` background
- Smooth transition: 200ms ease

**Checkboxes**:
- Size: 20px square
- Border: 2px solid `#D1D5DB`
- Checked: Blue background with white checkmark
- Border radius: 4px

---

## 📱 Responsive Behavior

### **Desktop (>1024px)**

**Profile Page**:
- Max width: 800px, centered
- Two-column layout for stats (3 stats per row)
- Full-width sections with comfortable padding

**Settings Page**:
- Horizontal tabs at top
- Max width: 1000px, centered
- Two-column layout for some sections (e.g., integrations)

### **Tablet (768px - 1024px)**

**Profile Page**:
- Max width: 100%, 24px side padding
- Stats grid: 2 columns x 3 rows
- Full-width buttons

**Settings Page**:
- Tabs remain horizontal
- Single-column layout for all sections
- Increased touch target sizes (48px minimum)

### **Mobile (<768px)**

**Profile Page**:
- Full width, 16px padding
- Stats grid: 2 columns x 3 rows (smaller text)
- Stacked buttons (full width)
- Avatar size: 64px (down from 80px)

**Settings Page**:
- Tabs converted to dropdown selector:
  ```
  Settings: [General ▾]
  ```
- Single column, full width
- Collapsible sections (accordion style)
- Larger touch targets (56px for toggles)

---

## 🔄 User Flows

### **1. Changing Profile Photo**

```
1. User clicks [Change Photo]
2. File picker opens (native OS file dialog)
3. User selects image (max 5MB, .jpg/.png/.gif)
4. Crop modal appears:
   ┌─ Crop Profile Photo ──────────┐
   │                                │
   │  [Image with crop overlay]     │
   │  [Zoom slider]                 │
   │                                │
   │  [Cancel] [Upload]             │
   └────────────────────────────────┘
5. User adjusts crop, clicks [Upload]
6. Upload progress: [████████░░] 80%
7. Success toast: "Profile photo updated ✓"
8. Avatar updates immediately (no page reload)
```

### **2. Changing Password**

```
1. User clicks [Change Password]
2. Modal opens:
   ┌─ Change Password ─────────────┐
   │ Current Password [••••••••]   │
   │ New Password     [••••••••]   │
   │ Confirm Password [••••••••]   │
   │                                │
   │ Strength: ████░░ Medium        │
   │                                │
   │ [Cancel] [Change Password]     │
   └────────────────────────────────┘
3. User enters passwords
4. Real-time validation:
   - Current password correct? (API check)
   - New password strong enough? (client-side)
   - Passwords match? (client-side)
5. Click [Change Password]
6. API request, loading state on button
7. Success: Modal closes, toast: "Password updated ✓"
8. Email sent: "Your password was changed"
```

### **3. Connecting Notion Integration**

```
1. User navigates to Settings → Integrations
2. Clicks [Connect Notion]
3. OAuth flow:
   - Redirects to notion.so/oauth
   - User authorizes Omnivore
   - Redirects back to Settings
4. Database selection modal:
   ┌─ Connect Notion ──────────────┐
   │ Select a database to sync:    │
   │                                │
   │ ○ Reading List (existing)     │
   │ ● Create new database         │
   │                                │
   │ Database Name:                 │
   │ [Omnivore Library    ]        │
   │                                │
   │ [Cancel] [Connect]             │
   └────────────────────────────────┘
5. Notion database created (if new)
6. Initial sync starts:
   - "Syncing 287 items to Notion..."
   - Progress bar: [████████░░] 80%
7. Success: "Connected to Notion ✓"
8. Settings page shows:
   🗒 Notion                    ✓ Connected
   Last sync: 2 minutes ago
   [Configure] [Disconnect]
```

### **4. Exporting Data**

```
1. User navigates to Profile → Danger Zone
2. Clicks [Export Data]
3. Modal opens:
   ┌─ Export Your Data ────────────┐
   │ We'll create a ZIP containing: │
   │ ☑ Library items (287)         │
   │ ☑ Highlights (156)             │
   │ ☑ Reading stats                │
   │ ☑ User settings                │
   │                                │
   │ Format: [JSON ▾]              │
   │                                │
   │ This may take a few minutes.   │
   │                                │
   │ [Cancel] [Start Export]        │
   └────────────────────────────────┘
4. Click [Start Export]
5. Background job starts
6. Modal updates:
   ┌─ Export In Progress ──────────┐
   │ [Loading spinner]              │
   │                                │
   │ Exporting your data...         │
   │ This may take a few minutes.   │
   │                                │
   │ [Close]                        │
   └────────────────────────────────┘
7. Email sent when ready:
   "Your export is ready! Download: [link]"
8. Download link valid for 7 days
```

---

## 🧪 Interactive States

### **Form Field States**

**Text Input**:
- **Default**: Gray border, black text
- **Focus**: Blue ring (2px), blue border
- **Error**: Red border, red text below
- **Success**: Green border, green checkmark
- **Disabled**: Gray background, gray text

**Toggle Switch**:
- **Off**: Gray background, white circle on left
- **On**: Blue background, white circle on right
- **Hover (off)**: Slightly darker gray
- **Hover (on)**: Slightly darker blue
- **Transition**: 200ms ease

**Slider**:
- **Default**: Gray track, blue thumb
- **Hover**: Slightly larger thumb (18px)
- **Dragging**: Shadow on thumb
- **Disabled**: Gray track and thumb

### **Button States**

**Primary Button**:
- **Default**: Blue background, white text
- **Hover**: Darker blue background
- **Active**: Even darker blue, slight scale down (0.98)
- **Loading**: Spinner replaces text, disabled
- **Disabled**: Gray background, gray text

**Danger Button**:
- **Default**: Red background, white text
- **Hover**: Darker red background
- **Active**: Even darker red
- **Requires confirmation**: Shows warning icon

### **Card Hover States**

**Profile Stats Cards**:
- **Default**: Light gray background
- **Hover**: Slightly darker background, subtle shadow
- **Click**: Navigate to detailed analytics (future)

**Settings Integration Cards**:
- **Default**: White background, gray border
- **Hover**: Blue border
- **Connected**: Green checkmark badge, "Connected" label

---

## 🌐 Localization Notes

### **Text Strings to Localize**

**Profile Page**:
- All section headers (User Identity, Account Statistics, etc.)
- Form labels (Full Name, Email, Username, Password)
- Button text (Save, Cancel, Change Photo, etc.)
- Stats labels (Items Saved, Reading Time, Highlights, etc.)
- Toast messages (success, error, warning)

**Settings Page**:
- Tab names (General, Integrations, Advanced, About)
- All section headers
- Form labels and help text
- Integration descriptions
- Modal text (confirmations, warnings)

### **Date/Time Formatting**

**Use user's locale preferences**:
- Date format: From Profile → Localization → Date Format
- Time format: From Profile → Localization → Time Format
- Timezone: From Profile → Localization → Timezone

**Example**:
```typescript
// User preferences
const locale = user.language; // "en-US"
const dateFormat = user.dateFormat; // "MM/DD/YYYY"
const timeFormat = user.timeFormat; // "12-hour"
const timezone = user.timezone; // "America/New_York"

// Format dates
const date = new Date();
const formatted = formatDate(date, locale, dateFormat, timezone);
// Result: "12/21/2024 9:00 AM EST"
```

---

## ✅ Implementation Checklist

### **Phase 1: Profile Page (MVP)**

- [ ] User identity section
  - [ ] Avatar upload with crop tool
  - [ ] Full name, email, username fields
  - [ ] Change password modal
  - [ ] Form validation (real-time)
- [ ] Account statistics section
  - [ ] Calculate stats from database
  - [ ] Display in 2x3 grid
  - [ ] Hover effects
- [ ] Appearance section
  - [ ] Theme toggle (Light/Dark/System)
  - [ ] Font size slider with live preview
  - [ ] Library density selector
- [ ] Localization section
  - [ ] Language dropdown
  - [ ] Timezone dropdown with auto-detect
  - [ ] Date/time format selectors
- [ ] Notifications section
  - [ ] Email notification toggles
  - [ ] Digest schedule picker
  - [ ] Quiet hours configuration
- [ ] Danger zone
  - [ ] Export data flow
  - [ ] Delete account flow with confirmation

### **Phase 2: Settings Page (MVP)**

- [ ] General tab
  - [ ] Reading experience settings
  - [ ] Tags & organization toggles
  - [ ] AI features configuration
  - [ ] Keyboard shortcuts viewer
  - [ ] Data management (auto-cleanup, cache)
- [ ] Integrations tab
  - [ ] Browser extension download links
  - [ ] Export options configuration
  - [ ] API key display and regeneration
- [ ] About tab
  - [ ] Version information
  - [ ] Resources links
  - [ ] Legal links
  - [ ] Acknowledgments

### **Phase 3: Advanced Features**

- [ ] Integrations tab (full)
  - [ ] Obsidian integration
  - [ ] Notion integration
  - [ ] Readwise integration
- [ ] Advanced tab
  - [ ] Experimental features toggles
  - [ ] Privacy mode controls
  - [ ] Developer console
  - [ ] Import/export tools
- [ ] Subscription section (cloud only)
  - [ ] Plan display
  - [ ] Stripe integration
  - [ ] Invoice history
  - [ ] Payment method management

### **Phase 4: Polish**

- [ ] Mobile responsive design
- [ ] Accessibility (ARIA labels, keyboard nav)
- [ ] Loading states for all async operations
- [ ] Error handling and user feedback
- [ ] Analytics tracking (optional)
- [ ] Localization for all strings
- [ ] Dark mode polish
- [ ] Animation and transitions

---

## 🚀 Technical Implementation Notes

### **State Management**

**Profile Page**:
```typescript
interface ProfileState {
  user: {
    id: string;
    fullName: string;
    email: string;
    username: string;
    avatarUrl: string;
    createdAt: Date;
  };
  stats: {
    itemsSaved: number;
    readingTime: number; // hours
    highlightsCount: number;
    currentStreak: number;
    completionRate: number;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'xs' | 's' | 'm' | 'l' | 'xl';
    libraryDensity: 'compact' | 'comfortable' | 'spacious';
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: '12' | '24';
  };
  notifications: {
    emailDigest: boolean;
    weeklySummary: boolean;
    newsletterRecs: boolean;
    digestTime: string; // HH:MM
    pushNotifications: boolean;
    quietHours: {
      enabled: boolean;
      from: string;
      to: string;
    };
  };
}
```

**Settings Page**:
```typescript
interface SettingsState {
  reading: {
    layout: 'single' | 'two' | 'three';
    contentWidth: number; // px
    autoScrollSpeed: number; // 1-5
  };
  tags: {
    autoTagBySource: boolean;
    autoTagNewsletters: boolean;
    suggestTags: boolean;
  };
  ai: {
    enabled: boolean;
    provider: 'openai-gpt4' | 'openai-gpt35' | 'anthropic-claude' | 'local-ollama';
    apiKey: string;
    shareUsageData: boolean;
  };
  dataManagement: {
    autoDeleteTrash: boolean;
    autoDeleteRead: boolean;
    trashRetentionDays: number;
    cacheSize: number; // bytes
  };
  integrations: {
    obsidian: ObsidianConfig | null;
    notion: NotionConfig | null;
    readwise: ReadwiseConfig | null;
  };
  advanced: {
    experimentalFeatures: {
      aiRecommendations: boolean;
      topicDetection: boolean;
      readingSpeed: boolean;
      voiceNarration: boolean;
    };
    privacy: {
      disableAnalytics: boolean;
      disableTelemetry: boolean;
      dontTrackReadingTime: boolean;
    };
    developer: {
      enableConsole: boolean;
      showDebugInfo: boolean;
      logApiRequests: boolean;
    };
  };
}
```

### **API Endpoints**

**Profile Page**:
```graphql
# Get user profile
query GetUserProfile {
  me {
    id
    fullName
    email
    username
    avatarUrl
    createdAt
    stats {
      itemsSaved
      readingTimeHours
      highlightsCount
      currentStreak
      completionRate
    }
    preferences {
      theme
      fontSize
      libraryDensity
      language
      timezone
      dateFormat
      timeFormat
    }
    notifications {
      emailDigest
      weeklySummary
      newsletterRecs
      digestTime
      pushNotifications
      quietHours {
        enabled
        from
        to
      }
    }
  }
}

# Update user profile
mutation UpdateUserProfile($input: UpdateProfileInput!) {
  updateProfile(input: $input) {
    user {
      id
      fullName
      email
      username
      avatarUrl
    }
  }
}

# Upload avatar
mutation UploadAvatar($file: Upload!) {
  uploadAvatar(file: $file) {
    avatarUrl
  }
}

# Change password
mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
  changePassword(currentPassword: $currentPassword, newPassword: $newPassword) {
    success
  }
}

# Export data
mutation ExportUserData($format: ExportFormat!) {
  exportUserData(format: $format) {
    jobId
  }
}

# Delete account
mutation DeleteAccount($email: String!) {
  deleteAccount(confirmationEmail: $email) {
    success
    deletionScheduledAt
  }
}
```

**Settings Page**:
```graphql
# Get user settings
query GetUserSettings {
  me {
    settings {
      reading {
        layout
        contentWidth
        autoScrollSpeed
      }
      tags {
        autoTagBySource
        autoTagNewsletters
        suggestTags
      }
      ai {
        enabled
        provider
        apiKey
        shareUsageData
      }
      dataManagement {
        autoDeleteTrash
        autoDeleteRead
        trashRetentionDays
        cacheSize
      }
      integrations {
        obsidian { ... }
        notion { ... }
        readwise { ... }
      }
      advanced {
        experimentalFeatures { ... }
        privacy { ... }
        developer { ... }
      }
    }
  }
}

# Update settings
mutation UpdateSettings($input: UpdateSettingsInput!) {
  updateSettings(input: $input) {
    settings { ... }
  }
}

# Connect integration
mutation ConnectIntegration($provider: IntegrationProvider!, $credentials: JSON!) {
  connectIntegration(provider: $provider, credentials: $credentials) {
    integration {
      provider
      status
      lastSyncAt
    }
  }
}

# Disconnect integration
mutation DisconnectIntegration($provider: IntegrationProvider!) {
  disconnectIntegration(provider: $provider) {
    success
  }
}
```

### **Database Schema**

**User Preferences** (extends existing `omnivore_user` table):
```sql
-- Add columns to omnivore_user table
ALTER TABLE omnivore_user ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);
ALTER TABLE omnivore_user ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE omnivore_user ADD COLUMN IF NOT EXISTS theme VARCHAR(10) DEFAULT 'system';
ALTER TABLE omnivore_user ADD COLUMN IF NOT EXISTS font_size VARCHAR(5) DEFAULT 'm';
ALTER TABLE omnivore_user ADD COLUMN IF NOT EXISTS library_density VARCHAR(15) DEFAULT 'comfortable';
ALTER TABLE omnivore_user ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en-US';
ALTER TABLE omnivore_user ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE omnivore_user ADD COLUMN IF NOT EXISTS date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY';
ALTER TABLE omnivore_user ADD COLUMN IF NOT EXISTS time_format VARCHAR(5) DEFAULT '12';

-- Notification preferences
ALTER TABLE omnivore_user ADD COLUMN IF NOT EXISTS email_digest BOOLEAN DEFAULT true;
ALTER TABLE omnivore_user ADD COLUMN IF NOT EXISTS weekly_summary BOOLEAN DEFAULT true;
ALTER TABLE omnivore_user ADD COLUMN IF NOT EXISTS newsletter_recs BOOLEAN DEFAULT false;
ALTER TABLE omnivore_user ADD COLUMN IF NOT EXISTS digest_time TIME DEFAULT '09:00:00';
ALTER TABLE omnivore_user ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT false;
ALTER TABLE omnivore_user ADD COLUMN IF NOT EXISTS quiet_hours_enabled BOOLEAN DEFAULT false;
ALTER TABLE omnivore_user ADD COLUMN IF NOT EXISTS quiet_hours_from TIME;
ALTER TABLE omnivore_user ADD COLUMN IF NOT EXISTS quiet_hours_to TIME;
```

**User Settings** (new table):
```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES omnivore_user(id) ON DELETE CASCADE,

  -- Reading experience
  reader_layout VARCHAR(10) DEFAULT 'two', -- 'single', 'two', 'three'
  content_width INTEGER DEFAULT 680, -- px
  auto_scroll_speed INTEGER DEFAULT 2, -- 1-5

  -- Tags & organization
  auto_tag_by_source BOOLEAN DEFAULT true,
  auto_tag_newsletters BOOLEAN DEFAULT true,
  suggest_tags BOOLEAN DEFAULT false,

  -- AI features
  ai_enabled BOOLEAN DEFAULT true,
  ai_provider VARCHAR(50) DEFAULT 'openai-gpt4',
  ai_api_key TEXT,
  ai_share_usage_data BOOLEAN DEFAULT true,

  -- Data management
  auto_delete_trash BOOLEAN DEFAULT true,
  auto_delete_read BOOLEAN DEFAULT false,
  trash_retention_days INTEGER DEFAULT 30,

  -- Experimental features
  experimental_ai_recs BOOLEAN DEFAULT false,
  experimental_topic_detection BOOLEAN DEFAULT false,
  experimental_reading_speed BOOLEAN DEFAULT false,
  experimental_voice_narration BOOLEAN DEFAULT false,

  -- Privacy
  disable_analytics BOOLEAN DEFAULT false,
  disable_telemetry BOOLEAN DEFAULT false,
  dont_track_reading_time BOOLEAN DEFAULT false,

  -- Developer
  enable_dev_console BOOLEAN DEFAULT false,
  show_debug_info BOOLEAN DEFAULT false,
  log_api_requests BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
```

**Integrations** (new table):
```sql
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES omnivore_user(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'obsidian', 'notion', 'readwise'
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'disconnected', 'error'
  credentials JSONB NOT NULL, -- Encrypted credentials
  config JSONB, -- Provider-specific configuration
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, provider)
);

CREATE INDEX idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX idx_user_integrations_provider ON user_integrations(provider);
```

---

## 🎯 Success Metrics

**Profile Page**:
- [ ] Users can upload and change avatar
- [ ] Users can update all profile fields successfully
- [ ] Password change flow works with proper validation
- [ ] Theme changes apply immediately across app
- [ ] Notification preferences save correctly
- [ ] Export data generates valid ZIP file
- [ ] Delete account flow completes with 30-day grace period

**Settings Page**:
- [ ] All reading experience settings apply to reader
- [ ] AI configuration connects to provider successfully
- [ ] Integrations (Obsidian, Notion, Readwise) connect and sync
- [ ] Keyboard shortcuts viewer shows all shortcuts
- [ ] Import/export flows work for all supported formats
- [ ] Experimental features toggle correctly
- [ ] Developer console provides useful debugging info

**Overall**:
- [ ] Page load time < 2 seconds
- [ ] All forms validate correctly (client + server)
- [ ] Mobile responsive design works on all screen sizes
- [ ] Accessibility: Keyboard navigation works everywhere
- [ ] Accessibility: Screen readers can navigate all content
- [ ] Localization: All strings use i18n
- [ ] No console errors in production

---

**End of Lovable Prompt: Profile & Settings Pages**
