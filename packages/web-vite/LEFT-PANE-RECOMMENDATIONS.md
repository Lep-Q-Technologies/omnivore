# Left Pane Navigation: Analysis & Recommendations

**Date**: December 20, 2024
**Context**: Review of current left pane structure and subscription management UI decisions

---

## Current Structure (From Screenshot)

```
📚 Library
💡 Highlights
🏷️  Labels (user prefers "Tags")

Subscriptions
  📡 RSS Feeds (72)
  📧 Newsletters
     ├─ Dense Discovery (3)
     ├─ Hacker Newsletter
     ├─ Morning Brew (5)
     └─ The Daily Tech
  🎙️  Podcasts (6)
  📺 YouTube (4)

📥 Inbox (14)
⭐ Favorites (5)
📦 Archive (1)
🗑️  Trash
```

---

## Recommended Structure for MVP

```
✨ Digest (Today) ← NEW! Make this default landing page
📚 Library
💡 Highlights
🏷️  Tags (renamed from "Labels")

─── Subscriptions ────
📧 Newsletters ← Backend ready (ARC-016 Phase 1)
📡 RSS Feeds ← Working (ARC-014A)
──────────────────────

─── Folders ──────────
📥 Inbox (14)
⭐ Favorites (5)
📦 Archive (1)
🗑️  Trash
──────────────────────
```

**Removed for MVP**:
- ❌ Podcasts (deferred per strategic-vision-2025.md)
- ❌ YouTube (deferred per strategic-vision-2025.md)

**Added**:
- ✅ Digest/Today page (THE killer MVP feature)

**Renamed**:
- ✅ Labels → Tags (user preference)

---

## Rationale: Why Remove Podcasts & YouTube for MVP?

### From strategic-vision-2025.md:

> **What's Deferred ⏸️ (Future Nice-to-Haves)**
>
> **Multi-Modal** (not needed for MVP):
> - ⏸️ Podcast transcription
> - ⏸️ YouTube video transcripts (Omnivore had this in beta!)

> "❌ Not building: Podcasts, audiobooks, YouTube (for now)"

### Strategic Focus:

The MVP is about:
1. **Newsletters** (via email addresses) ⭐ THE KILLER FEATURE
2. **RSS feeds** (blogs, news sites)
3. **AI triage** (digest with summaries)
4. **Highlights** (knowledge capture)
5. **Export** (to Obsidian)

**Podcasts and YouTube are explicitly out of scope for MVP.**

### Benefits of Removing:

✅ **Faster to MVP**: Focus on core value proposition
✅ **Simpler UX**: Less cognitive load for new users
✅ **Less design work**: Don't need to design subscription flows
✅ **Less backend work**: Don't need special handling for video/audio
✅ **Can add later**: Once core features are proven and loved

### If User Still Wants Them:

**Option A: Keep but treat as RSS feeds** (simplest)
- YouTube channels already have RSS feeds: `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`
- Podcasts are RSS feeds with `<enclosure>` tags
- No special UI needed - just paste RSS feed URL in RSS subscription
- Display alongside other RSS items in library

**Option B: Add minimal support**
- Create "Advanced" section in Subscriptions
- YouTube + Podcasts as simple RSS feed inputs
- No special UI, just basic subscription
- Defer transcription/audio features to post-MVP

**Recommendation**: **Option A** - Just treat as RSS feeds, no special nav items needed

---

## Digest Page: Placement in Navigation

### Options:

**Option 1: Make it default landing page** (Recommended)
- User opens app → sees Digest first
- Most important page for daily workflow
- "What's new today?" is primary use case
- Library is one click away

**Option 2: Top of navigation (above Library)**
- Prominent placement
- User can choose where to start
- More traditional structure

**Option 3: Replace "Inbox" as default Library view**
- Digest becomes smart inbox
- Shows unread + summaries
- Most integrated approach

**Recommendation**: **Option 1** - Default landing page
- Aligns with MVP goal: "Triage 20 newsletters in 5 minutes"
- User flow: Open app → Digest → Quick triage → Done
- Library is for browsing/searching later

---

## Subscription Management UI Design

### Newsletter Subscriptions (ARC-016 Phase 2)

**Current Status**:
- ✅ Backend complete (confirmation tracking, auto-subscription, GraphQL API)
- ✅ Pending confirmations UI integrated
- ❌ User email alias display not yet shown
- ❌ Email provider not configured (Postmark recommended)

**UI Needed**:

```
┌─ Newsletter Subscriptions ───────────────────────────┐
│                                                       │
│ Your Newsletter Email Address:                       │
│ ┌───────────────────────────────────────────────────┐ │
│ │ tim-abc123@omnivore.app                [Copy]    │ │
│ └───────────────────────────────────────────────────┘ │
│                                                       │
│ How it works:                                         │
│ 1. Subscribe to any newsletter using this address    │
│ 2. Confirmation emails will be forwarded to you      │
│ 3. After confirming, articles appear in your library │
│                                                       │
│ ─────────────────────────────────────────────────── │
│                                                       │
│ Active Subscriptions (4):                            │
│                                                       │
│ ○ Dense Discovery (3 articles)         [Unsubscribe] │
│   Last received: 2 hours ago                         │
│   Platform: Substack                                 │
│                                                       │
│ ○ Hacker Newsletter                     [Unsubscribe] │
│   Last received: 1 day ago                           │
│   Platform: Generic                                  │
│                                                       │
│ ○ Morning Brew (5 articles)             [Unsubscribe] │
│   Last received: 3 hours ago                         │
│   Platform: Mailchimp                                │
│                                                       │
│ ○ The Daily Tech                        [Unsubscribe] │
│   Last received: 5 hours ago                         │
│   Platform: ConvertKit                               │
│                                                       │
│ ─────────────────────────────────────────────────── │
│                                                       │
│ Pending Confirmations (2):          [Show/Hide ▼]    │
│ (Collapsible section - already implemented)          │
│                                                       │
└───────────────────────────────────────────────────────┘
```

**Key Features**:
- Prominent email address display (copy-to-clipboard)
- Clear instructions for new users
- List of active subscriptions with metadata
- Platform detection badges (Substack, Beehiiv, etc.)
- Unsubscribe confirmation modal
- Pending confirmations section (already built in ARC-016 Phase 1)

### RSS Feed Subscriptions (ARC-014A - Complete)

**Current Status**:
- ✅ Fully working (subscribe, unsubscribe, refresh, filtering)
- ✅ GraphQL API complete
- ✅ UI integrated

**UI** (Already exists, just needs polish):

```
┌─ RSS Feed Subscriptions ─────────────────────────────┐
│                                                       │
│ Add RSS Feed:                                         │
│ ┌─────────────────────────────────────────────┐      │
│ │ https://example.com/feed.xml      [Subscribe] │    │
│ └─────────────────────────────────────────────┘      │
│                                                       │
│ ─────────────────────────────────────────────────── │
│                                                       │
│ Active Feeds (3):                                     │
│                                                       │
│ ○ Hacker News (72 items)           [Unsubscribe]     │
│   Last updated: 30 minutes ago                       │
│   https://hnrss.org/frontpage                        │
│                                                       │
│ ○ TechCrunch (45 items)            [Unsubscribe]     │
│   Last updated: 2 hours ago                          │
│   https://techcrunch.com/feed                        │
│                                                       │
│ ○ CSS-Tricks (12 items)            [Unsubscribe]     │
│   Last updated: 1 day ago                            │
│   https://css-tricks.com/feed                        │
│                                                       │
└───────────────────────────────────────────────────────┘
```

**Key Features** (already working):
- Simple RSS URL input
- List of active feeds with item counts
- Last refresh timestamp
- Unsubscribe functionality

**Note**: If user wants YouTube/Podcasts, they can just paste RSS feed URLs here. No special UI needed.

---

## YouTube as RSS Feeds (If User Wants to Keep)

YouTube channels have public RSS feeds. No API key needed.

**Feed Format**:
```
https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID
```

**How to Find Channel ID**:
1. Visit YouTube channel page
2. View page source, search for `"channelId"`
3. OR use: `https://www.youtube.com/feeds/videos.xml?channel_id=@ChannelName`

**Example**:
```
Veritasium: https://www.youtube.com/feeds/videos.xml?channel_id=UCHnyfMqiRRG1u-2MsSQLbXA
```

**Implementation**:
- Just paste YouTube RSS feed into RSS subscription form
- Backend auto-detects it's a YouTube feed (parse XML)
- Display video thumbnail in library card
- Title, description, publish date all in RSS feed
- Click card → opens YouTube video in new tab (or embedded player if desired)

**UI Enhancement** (optional):
- Auto-convert YouTube channel URLs to RSS feed URLs
- Add "Subscribe to YouTube Channel" helper in RSS form
- Detect channel URL, fetch channel ID, construct RSS URL automatically

**Recommendation**: Start simple - just use RSS feed URLs. Add helper later if users struggle.

---

## Podcasts as RSS Feeds (If User Wants to Keep)

Podcasts are already RSS feeds. That's how Apple Podcasts, Spotify, etc. work.

**Podcast RSS Feed Structure**:
```xml
<rss>
  <channel>
    <title>The Daily</title>
    <item>
      <title>Episode Title</title>
      <description>Episode description</description>
      <enclosure url="https://audio.com/episode.mp3" type="audio/mpeg"/>
      <pubDate>Thu, 19 Dec 2024 05:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>
```

**Implementation**:
- Parse RSS feed normally (same as blog feeds)
- Detect `<enclosure>` tag with audio type
- Store audio URL
- Display in library with audio icon
- (Future) Add inline audio player
- (Future) Transcription via Whisper API (ARC-015)

**Where Users Get Podcast RSS URLs**:
- Apple Podcasts: Right-click show → Copy RSS feed URL
- Spotify: Not directly exposed (use third-party tools)
- Podcast websites: Usually have RSS link
- Podcast search engines: PodcastIndex.org, Listen Notes API

**UI Enhancement** (optional):
- Podcast search UI (search by name, powered by PodcastIndex API)
- OPML import (import from podcast app)
- Auto-detect audio enclosures, show with audio icon

**Recommendation**: Start with RSS URL input. Add search later if users request.

---

## Subscription Page Layout Recommendation

Since Newsletters and RSS feeds are the only MVP subscriptions, consider a tabbed or sectioned layout:

### Option A: Tabbed Interface

```
┌─ Subscriptions ──────────────────────────────────────┐
│                                                       │
│ [Newsletters] [RSS Feeds]                             │
│                                                       │
│ (Newsletter UI shown above)                           │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### Option B: Single Page with Sections

```
┌─ Subscriptions ──────────────────────────────────────┐
│                                                       │
│ Newsletters ──────────────────────────────────────   │
│ (Newsletter UI)                                       │
│                                                       │
│ RSS Feeds ────────────────────────────────────────   │
│ (RSS Feed UI)                                         │
│                                                       │
└───────────────────────────────────────────────────────┘
```

**Recommendation**: **Option B** (Single page with sections)
- Simpler navigation
- Can see both at once
- Feels more unified
- Tabs can come later if page gets crowded

---

## Summary of Recommendations

### Left Pane Navigation:

1. **Add**: "Digest" or "Today" page at top (or make default landing)
2. **Rename**: "Labels" → "Tags"
3. **Remove**: Podcasts and YouTube nav items (defer to post-MVP)
4. **Keep**: Newsletters, RSS Feeds, Folders structure
5. **Structure**: Group Newsletters + RSS under "Subscriptions" heading

### Subscription Management:

1. **Newsletters**: Design UI showing email address + active subscriptions + pending confirmations
2. **RSS Feeds**: Polish existing UI (already works well)
3. **YouTube**: If needed, just treat as RSS feeds (no special UI)
4. **Podcasts**: If needed, just treat as RSS feeds (no special UI)

### Design Priority:

1. **Week 1**: Library page iteration (current focus) ✅
2. **Week 2**: Digest page design 🔴 CRITICAL
3. **Week 3**: Reader page polish 🔴 HIGH
4. **Week 4**: Highlights page + Export 🔴 HIGH
5. **Later**: Subscriptions page polish (backend mostly ready)

---

## Next Steps:

1. **Decision**: Remove Podcasts/YouTube from left pane? (Recommend: Yes, defer to post-MVP)
2. **Decision**: Make Digest default landing page? (Recommend: Yes, aligns with MVP goal)
3. **Terminology**: Update "Labels" → "Tags" throughout (quick win)
4. **Design Focus**: Continue Library page iteration, then tackle Digest page next

---

**See Also**:
- `/packages/web-vite/MVP-SCREENS-AND-FUNCTIONALITY.md` - Full screen inventory
- `/packages/web-vite/MVP-CHECKLIST.md` - Original MVP analysis
- `/docs/architecture/strategic-vision-2025.md` - Strategic vision and scope
