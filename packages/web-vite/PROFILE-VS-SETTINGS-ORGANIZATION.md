# Profile vs. Settings: Organization & Content

**Date**: December 20, 2024
**Context**: Define what goes in Profile page vs. Settings page
**Decision**: Separate user identity/preferences from app configuration

---

## 🎯 Core Principle

**Profile** = Who you are (identity, public info, personal preferences)
**Settings** = How the app works (configuration, integrations, advanced options)

---

## 👤 **Profile Page** - User Identity & Preferences

**Route**: `/profile` or `/me`
**Access**: Click user avatar (top-right) → Profile

### **Content Structure**:

```
┌─ Profile ───────────────────────────────────────────────┐
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │                    [Avatar]                        │ │
│  │                   Tim Johnson                      │ │
│  │                tim@example.com                     │ │
│  │                                                    │ │
│  │              [Change Avatar]                       │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  📧 Email Address                                        │
│  tim@example.com                                         │
│  ✅ Verified                                             │
│  [Change Email]                                          │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  🔐 Password                                             │
│  Last changed: 30 days ago                               │
│  [Change Password]                                       │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  📊 Account Statistics                                   │
│  Member since: January 15, 2024                         │
│  Total articles: 1,234                                   │
│  Total highlights: 456                                   │
│  Read time: 127 hours                                    │
│  Current streak: 🔥 14 days                              │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  🎨 Appearance                                           │
│  Theme: ● Dark  ○ Light  ○ Auto                         │
│  Font size: [- A A+ ]                                    │
│  Compact mode: ☑ Enabled                                 │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  🌍 Preferences                                          │
│  Language: English (US)                                  │
│  Timezone: America/Los_Angeles (PST)                    │
│  Date format: MM/DD/YYYY                                 │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  🔔 Notifications                                        │
│  Email notifications: ☑ Enabled                          │
│  - New newsletters: ☑ Daily digest at 8:00 AM           │
│  - Read Later reminders: ☑ Weekly on Fridays            │
│  - Product updates: ☑ Enabled                            │
│                                                          │
│  Push notifications: ☐ Disabled                          │
│  [Enable Push Notifications]                             │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  💳 Subscription (Cloud Users Only)                      │
│  Plan: Pro ($7/month)                                    │
│  Next billing: January 15, 2025                         │
│  [Manage Subscription] [View Invoices]                   │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  ⚠️ Danger Zone                                          │
│  [Export All Data]                                       │
│  [Delete Account]                                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### **Profile Sections Breakdown**:

#### **1. User Identity**
- Avatar/profile picture
- Display name
- Email address (with verification status)
- Password management

**Why here**: Personal identity information

---

#### **2. Account Statistics**
- Member since date
- Total articles saved
- Total highlights created
- Total reading time
- Reading streak

**Why here**: Personal achievements and progress

---

#### **3. Appearance Preferences**
- Theme (Dark, Light, Auto)
- Font size (reading preference)
- Compact mode toggle
- Density preference (Compact, Comfortable, Spacious)

**Why here**: Personal visual preferences (affects only this user)

---

#### **4. Localization Preferences**
- Language selection
- Timezone
- Date/time format
- Number format

**Why here**: Personal regional preferences

---

#### **5. Notification Preferences**
- Email notifications (daily digest, reminders)
- Push notifications (browser, mobile)
- Notification schedule (when to send)

**Why here**: Personal communication preferences

---

#### **6. Subscription Management** (Cloud users)
- Current plan
- Billing information
- Payment method
- Invoices
- Upgrade/downgrade

**Why here**: Personal account/billing

---

#### **7. Danger Zone**
- Export all data (GDPR compliance)
- Delete account (permanent)

**Why here**: Account-level destructive actions

---

## ⚙️ **Settings Page** - App Configuration

**Route**: `/settings`
**Access**: Click user avatar (top-right) → Settings

### **Content Structure**:

```
┌─ Settings ──────────────────────────────────────────────┐
│                                                          │
│  [General]  [Integrations]  [Advanced]  [About]  ← Tabs│
│   ▔▔▔▔▔▔▔                                               │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  📚 Reading Experience                                   │
│                                                          │
│  Reader mode:                                            │
│  ● Single column (focus)                                 │
│  ○ Two columns (sidebar with TOC/highlights)            │
│                                                          │
│  Reading width:                                          │
│  ○ Narrow  ● Medium  ○ Wide                             │
│                                                          │
│  Scroll behavior:                                        │
│  ☑ Smooth scrolling                                      │
│  ☑ Auto-scroll to last position                          │
│                                                          │
│  Progress tracking:                                      │
│  ☑ Track reading progress automatically                  │
│  ☑ Show progress bar on cards                            │
│  ☑ Mark as read at 100% progress                         │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  🏷️ Tags & Organization                                 │
│                                                          │
│  Default tags for new items:                             │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Inbox, To-Read                                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Auto-tagging:                                           │
│  ☑ Auto-tag newsletters by source                        │
│  ☑ Auto-tag RSS feeds by source                          │
│  ☐ Auto-tag by content (experimental)                    │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  🤖 AI Features                                          │
│                                                          │
│  AI summaries:                                           │
│  ☑ Generate summaries for new items                      │
│  ○ All items  ● Newsletters only  ○ Never               │
│                                                          │
│  AI provider:                                            │
│  ● OpenAI GPT-4o-mini  ○ Anthropic Claude               │
│                                                          │
│  Summary length:                                         │
│  ○ Short (1-2 sentences)                                 │
│  ● Medium (2-3 sentences)                                │
│  ○ Long (3-5 sentences)                                  │
│                                                          │
│  Privacy:                                                │
│  ☑ Only send article text (no personal data)             │
│  ☐ Use local AI model (slower, more private)             │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  ⌨️ Keyboard Shortcuts                                   │
│                                                          │
│  ☑ Enable keyboard shortcuts                             │
│  [Customize Shortcuts]                                   │
│                                                          │
│  Quick reference:                                        │
│  j/k - Navigate items                                    │
│  a - Archive                                             │
│  r - Read                                                │
│  / - Search                                              │
│  ? - Show all shortcuts                                  │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  🗑️ Data Management                                     │
│                                                          │
│  Auto-cleanup:                                           │
│  ☑ Delete items in Trash after 30 days                   │
│  ☐ Auto-archive read items after 90 days                 │
│                                                          │
│  Storage:                                                │
│  Used: 234 MB / 5 GB (4.7%)                              │
│  [View Storage Details]                                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### **Settings Tabs**:

#### **Tab 1: General** (Default)
- Reading experience settings
- Tags & organization
- AI features configuration
- Keyboard shortcuts
- Data management

---

#### **Tab 2: Integrations**

```
┌─ Settings ──────────────────────────────────────────────┐
│  [General]  [Integrations]  [Advanced]  [About]         │
│              ▔▔▔▔▔▔▔▔▔▔▔▔                              │
│                                                          │
│  🔗 Connected Services                                   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  📝 Obsidian                        [Connected ✓]  │ │
│  │  Export highlights to Obsidian vault               │ │
│  │  Vault: /Users/tim/Documents/Obsidian              │ │
│  │  [Configure] [Disconnect]                          │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  📓 Notion                          [Connect]       │ │
│  │  Export highlights to Notion database              │ │
│  │  [Connect to Notion]                               │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  🌐 Browser Extension               [Installed ✓]  │ │
│  │  Save articles from any website                    │ │
│  │  Version: 1.2.3                                    │ │
│  │  [Update Available] [Settings]                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  📤 Export Options                                       │
│                                                          │
│  Default export format:                                  │
│  ● Markdown  ○ JSON  ○ Plain Text  ○ CSV               │
│                                                          │
│  Include in exports:                                     │
│  ☑ Source citations                                      │
│  ☑ Tags                                                  │
│  ☑ Timestamps                                            │
│  ☑ Article links                                         │
│  ☐ Full article text                                     │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  🔌 API Access                                           │
│                                                          │
│  Personal API key:                                       │
│  ┌────────────────────────────────────────────────────┐ │
│  │ sk_live_abc123xyz789...            [Show] [Copy]   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [Generate New Key] [Revoke Key]                         │
│  [View API Documentation]                                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Integrations Sections**:
- Connected services (Obsidian, Notion, Logseq)
- Browser extension status
- Export options
- API access (for developers)

---

#### **Tab 3: Advanced**

```
┌─ Settings ──────────────────────────────────────────────┐
│  [General]  [Integrations]  [Advanced]  [About]         │
│                              ▔▔▔▔▔▔▔▔                   │
│                                                          │
│  🔬 Experimental Features                                │
│                                                          │
│  ⚠️ These features are experimental and may change      │
│                                                          │
│  ☑ AI-powered topic grouping                             │
│  ☐ Semantic search (beta)                                │
│  ☐ Cross-content synthesis (coming soon)                 │
│  ☐ Voice reading (TTS)                                   │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  🗄️ Data & Privacy                                      │
│                                                          │
│  Data collection:                                        │
│  ☑ Anonymous usage analytics                             │
│  ☐ Crash reports                                         │
│                                                          │
│  Privacy:                                                │
│  ☑ Do not track reading habits for recommendations       │
│  ☑ Encrypt highlights locally                            │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  🛠️ Developer Options                                   │
│                                                          │
│  ☑ Enable debug mode                                     │
│  ☑ Show performance metrics                              │
│  ☐ Use staging API endpoint                              │
│                                                          │
│  [Clear Cache] [Reset All Settings]                      │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  💾 Import & Export                                      │
│                                                          │
│  Import from:                                            │
│  [Pocket] [Instapaper] [Readwise] [Omnivore (legacy)]   │
│                                                          │
│  Export everything:                                      │
│  [Download All Data (JSON)]                              │
│  [Download Database Backup]                              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Advanced Sections**:
- Experimental features (opt-in beta)
- Data & privacy controls
- Developer options
- Import/export tools

---

#### **Tab 4: About**

```
┌─ Settings ──────────────────────────────────────────────┐
│  [General]  [Integrations]  [Advanced]  [About]         │
│                                          ▔▔▔▔▔          │
│                                                          │
│  ℹ️ About Omnivore                                       │
│                                                          │
│  Version: 1.0.0-beta.5                                   │
│  Build: 20241220-abc123                                  │
│  Platform: Web (Vite + React)                            │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  🔗 Resources                                            │
│                                                          │
│  [Documentation]                                         │
│  [GitHub Repository]                                     │
│  [Report a Bug]                                          │
│  [Feature Requests]                                      │
│  [Community Discord]                                     │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  📜 Legal                                                │
│                                                          │
│  [Privacy Policy]                                        │
│  [Terms of Service]                                      │
│  [Open Source Licenses]                                  │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  🙏 Acknowledgments                                      │
│                                                          │
│  Built with: React, NestJS, PostgreSQL, TypeORM         │
│  Inspired by: Omnivore (original), Readwise Reader      │
│                                                          │
│  Special thanks to all contributors and beta testers!    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**About Sections**:
- Version information
- Links to resources (docs, GitHub, Discord)
- Legal information
- Acknowledgments

---

## 🔄 **Migration from Current Implementation**

### **Current Settings Page** (Subscriptions-focused):
```
Settings (Current)
├─ Newsletter Email Addresses
├─ Pending Confirmations
├─ Active Subscriptions
└─ RSS Feeds
```

### **NEW Organization**:

| Current Location | NEW Location | Reasoning |
|------------------|--------------|-----------|
| Newsletter Email Addresses | **Feeds → Newsletters** | Better fit (content source management) |
| Pending Confirmations | **Feeds → Newsletters** | Same context as subscriptions |
| Active Subscriptions | **Feeds → Newsletters** | Same context |
| RSS Feeds | **Feeds → RSS Feeds** | Already implemented |

### **What Stays in Settings**:
- Reading experience preferences
- AI configuration
- Keyboard shortcuts
- Integrations (Obsidian, Notion)
- Advanced/experimental features

---

## 📱 **Access Points**

### **User Avatar Dropdown** (Top-Right):

```
┌─────────────────────────┐
│ Tim Johnson            │
│ tim@example.com        │
├─────────────────────────┤
│ 👤 Profile             │ ← Profile page
│ ⚙️  Settings            │ ← Settings page
│ 📊 Analytics (future)  │
├─────────────────────────┤
│ 🔓 Log Out             │
└─────────────────────────┘
```

**Clear separation**: Profile = personal, Settings = app configuration

---

## 🎯 **Decision Matrix: Profile vs. Settings**

| Feature | Profile ✅ | Settings ✅ | Reasoning |
|---------|-----------|-------------|-----------|
| **Avatar/Display Name** | ✅ | | Personal identity |
| **Email/Password** | ✅ | | Account credentials |
| **Account Stats** | ✅ | | Personal progress |
| **Theme (Dark/Light)** | ✅ | | Visual preference (personal) |
| **Language/Timezone** | ✅ | | Localization (personal) |
| **Notifications** | ✅ | | Communication preferences |
| **Subscription/Billing** | ✅ | | Account management |
| **Reading Experience** | | ✅ | App functionality |
| **AI Configuration** | | ✅ | App functionality |
| **Keyboard Shortcuts** | | ✅ | App functionality |
| **Integrations** | | ✅ | App functionality |
| **Experimental Features** | | ✅ | App functionality |
| **Import/Export Tools** | | ✅ | Data management |
| **API Access** | | ✅ | Developer tools |

**Rule of Thumb**:
- **Profile**: Changes who you are or how you appear
- **Settings**: Changes how the app behaves

---

## 🚀 **Implementation Priority**

### **Phase 1: Profile Page (MVP)** (Week 1)
- [ ] User identity (avatar, name, email)
- [ ] Password change
- [ ] Account statistics (member since, totals)
- [ ] Appearance (theme, font size)
- [ ] Basic notifications (email digest)

### **Phase 2: Settings Page (MVP)** (Week 1-2)
- [ ] Reading experience settings
- [ ] AI features configuration
- [ ] Keyboard shortcuts toggle
- [ ] Data management (auto-cleanup)

### **Phase 3: Integrations** (Week 3)
- [ ] Obsidian export
- [ ] Notion export (future)
- [ ] Browser extension status
- [ ] API key generation

### **Phase 4: Advanced Features** (Week 4+)
- [ ] Experimental features toggle
- [ ] Import tools (Pocket, Instapaper)
- [ ] Developer options
- [ ] Analytics dashboard (future)

---

## ✅ **Summary**

### **Profile Page**:
- Who you are (identity, avatar, email)
- Personal preferences (theme, language, notifications)
- Account management (subscription, billing)
- Personal stats (reading progress, streak)

### **Settings Page**:
- How the app works (reading experience, AI, shortcuts)
- Integrations (Obsidian, Notion, API)
- Advanced options (experimental features, developer tools)
- Data management (import, export, cleanup)

### **What Moved from Settings**:
- ❌ Newsletter email addresses → **Feeds page**
- ❌ Subscriptions management → **Feeds page**
- ❌ RSS feeds → **Feeds page** (already there)

### **What's New in Settings**:
- ✅ Reading experience configuration
- ✅ AI features settings
- ✅ Keyboard shortcuts
- ✅ Integrations (Obsidian, Notion)
- ✅ Advanced/experimental features

---

**Status**: Ready for design and implementation
**Next**: Create Profile page mockups, update Settings page
