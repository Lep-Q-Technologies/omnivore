# Newsletter Email Address UI - Design Specification

**Date**: December 20, 2024
**Status**: Ready for Lovable Implementation
**Context**: Multiple email addresses per user (one per newsletter)

---

## 🎯 Core Concept

**Users can generate unlimited email addresses - one for each newsletter they want to subscribe to.**

**Benefits**:
- Privacy: Each newsletter gets unique address
- Control: Unsubscribe from individual newsletters
- Organization: Automatic source tracking
- Spam Protection: Delete compromised addresses

---

## 📄 Feeds Page - Newsletter Management

### **Layout**:

```
┌─ Feeds ─────────────────────────────────────────────────┐
│  📡 All Sources  |  📧 Newsletters  |  📡 RSS Feeds       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📧 Newsletters (5)                    [+ Add Newsletter]│
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  📧 Dense Discovery                    [•••]      │  │
│  │  12 articles  ·  Last received: 2 hours ago       │  │
│  │  Read rate: 83% (10/12 read)                      │  │
│  │  Email: tim-dense-discovery-xyz@omnivore.app     │  │
│  │  [Copy Email] [Unsubscribe]                       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  📧 Morning Brew                       [•••]      │  │
│  │  30 articles  ·  Last received: 5 hours ago       │  │
│  │  Read rate: 17% (5/30 read) ⚠️                    │  │
│  │  Email: tim-morning-brew-abc@omnivore.app        │  │
│  │  [Copy Email] [Unsubscribe]                       │  │
│  │                                                    │  │
│  │  💡 Low read rate. Consider unsubscribing?        │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  📧 Hacker Newsletter                  [•••]      │  │
│  │  8 articles  ·  Last received: 1 day ago          │  │
│  │  Read rate: 100% (8/8 read) ✨                    │  │
│  │  Email: tim-hacker-newsletter-def@omnivore.app   │  │
│  │  [Copy Email] [Unsubscribe]                       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  📧 Substack Digest (Pending) ⏳        [•••]     │  │
│  │  0 articles  ·  Waiting for first email...       │  │
│  │  Email: tim-substack-digest-ghi@omnivore.app     │  │
│  │  [Copy Email] [Delete Address]                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### **Newsletter Card Component**:

```
┌──────────────────────────────────────────────────┐
│  📧 Dense Discovery                    [•••]      │ ← Newsletter name + menu
│  12 articles  ·  Last received: 2 hours ago       │ ← Stats
│  Read rate: 83% (10/12 read)                      │ ← Read rate (color-coded)
│  Email: tim-dense-discovery-xyz@omnivore.app     │ ← Email address (truncated if long)
│  [Copy Email] [Unsubscribe]                       │ ← Quick actions
└──────────────────────────────────────────────────┘

States:
- Active: Normal appearance
- Pending: ⏳ badge, grayed out, "Waiting for first email..."
- Unsubscribed: Faded, strikethrough, "Unsubscribed 2 days ago"

Read Rate Color Coding:
- Green (80-100%): Great engagement ✨
- Blue (50-79%): Moderate engagement
- Orange (20-49%): Low engagement
- Red (0-19%): Very low engagement ⚠️
```

---

## 🆕 Add Newsletter Flow

### **Step 1: Click [+ Add Newsletter]**

```
┌─ Add Newsletter ────────────────────────────────────┐
│                                                  ✕   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  We'll generate a unique email address for this    │
│  newsletter. Use it when subscribing.              │
│                                                     │
│  Newsletter Name:                                   │
│  ┌─────────────────────────────────────────────┐   │
│  │ Dense Discovery                             │   │ ← User types name
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Generated Email Address:                           │
│  ┌─────────────────────────────────────────────┐   │
│  │ tim-dense-discovery-xyz@omnivore.app  [📋] │   │ ← Auto-generated, live preview
│  └─────────────────────────────────────────────┘   │
│  ↑ Updates as you type                              │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  How it works:                                      │
│  1. Copy the email address above                   │
│  2. Go to the newsletter website (e.g., Substack)  │
│  3. Subscribe using this email address             │
│  4. Emails will appear in your Omnivore library    │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  [Cancel]                        [Create & Copy]   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### **Live Preview Behavior**:

```
User types: "Dense Discovery"
  ↓
System generates slug: "dense-discovery"
  ↓
System adds unique ID: "xyz123"
  ↓
Preview updates: tim-dense-discovery-xyz123@omnivore.app
  ↓
User keeps typing: "Dense Discovery Newsletter"
  ↓
Slug updates: "dense-discovery-newsletter"
  ↓
Preview updates: tim-dense-discovery-newsletter-xyz123@omnivore.app
```

**Slugification Rules**:
- Lowercase
- Replace spaces with hyphens
- Remove special characters
- Truncate to 30 characters
- Add 6-character random suffix (collision prevention)

### **Step 2: After Creating**:

```
┌─ Newsletter Created! ───────────────────────────────┐
│                                                  ✕   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ✅ Email address created for Dense Discovery      │
│                                                     │
│  Your Email Address:                                │
│  ┌─────────────────────────────────────────────┐   │
│  │ tim-dense-discovery-xyz@omnivore.app  [📋] │   │
│  └─────────────────────────────────────────────┘   │
│  ✅ Copied to clipboard!                            │
│                                                     │
│  Next Steps:                                        │
│  1. Go to Dense Discovery website                  │
│  2. Paste this email address when subscribing      │
│  3. Confirm your subscription (if required)        │
│  4. Emails will start appearing in your library    │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Common Newsletter Sites:                           │
│  [Substack →] [Beehiiv →] [ConvertKit →]           │
│                                                     │
│  [Done]                                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Toast**: "Email address copied! Paste it when subscribing to Dense Discovery."

---

## 🗑️ Unsubscribe Flow

### **Option 1: Click [Unsubscribe] on Card**

```
┌─ Unsubscribe from Dense Discovery? ─────────────────┐
│                                                  ✕   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Are you sure you want to unsubscribe?             │
│                                                     │
│  We'll stop accepting emails at:                   │
│  tim-dense-discovery-xyz@omnivore.app              │
│                                                     │
│  Your 12 existing articles will remain in your     │
│  library, but you won't receive new emails.        │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Why are you unsubscribing?                         │
│  ○ Not interested anymore                          │
│  ○ Too many emails                                 │
│  ○ Content quality declined                        │
│  ○ Spam or unwanted content                        │
│  ○ Other: ___________________                      │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  [Cancel]                            [Unsubscribe] │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**After Unsubscribing**:
```
Toast: "Unsubscribed from Dense Discovery. Email address disabled."

Newsletter card updates:
┌──────────────────────────────────────────────────┐
│  📧 Dense Discovery (Unsubscribed)      [•••]     │
│  12 articles  ·  Unsubscribed 2 minutes ago       │
│  Email: tim-dense-discovery-xyz@omnivore.app     │
│  [Resubscribe]                                    │
└──────────────────────────────────────────────────┘
```

### **Option 2: Three-Dot Menu → Delete Address**

```
┌─ Delete Email Address? ─────────────────────────────┐
│                                                  ✕   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ⚠️ Warning: This is permanent                      │
│                                                     │
│  This will permanently delete:                      │
│  tim-dense-discovery-xyz@omnivore.app              │
│                                                     │
│  The address will no longer accept emails.          │
│  Your 12 existing articles will remain.            │
│                                                     │
│  Use this if the address was compromised or        │
│  you want to start fresh.                          │
│                                                     │
│  You can create a new address if you want to       │
│  resubscribe later.                                │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  [Cancel]                         [Delete Address] │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Analytics Section (Optional - Future Enhancement)

```
┌─ Newsletter Insights ────────────────────────────────┐
│                                                       │
│  Your Newsletter Stats (Last 30 Days)                │
│                                                       │
│  📬 Total Received: 50 emails                         │
│  📖 Total Read: 23 emails                             │
│  ⭐ Average Read Rate: 46%                            │
│                                                       │
│  ─────────────────────────────────────────────────── │
│                                                       │
│  Top Newsletters (by read rate):                     │
│  1. Hacker Newsletter - 100% (8/8)                   │
│  2. Dense Discovery - 83% (10/12)                    │
│  3. TechCrunch Daily - 60% (12/20)                   │
│  4. Morning Brew - 17% (5/30)                        │
│                                                       │
│  💡 Suggestion: Consider unsubscribing from          │
│     Morning Brew (only 17% read rate)                │
│                                                       │
└───────────────────────────────────────────────────────┘
```

---

## 🎨 Design Specs

### **Colors**:
```css
/* Newsletter Cards */
--newsletter-card-bg: #2a2a2a;
--newsletter-card-border: #3a3a3a;
--newsletter-card-hover: #333333;

/* Read Rate Colors */
--read-rate-excellent: #4CAF50; /* 80-100% */
--read-rate-good: #4A9EFF;     /* 50-79% */
--read-rate-low: #FF9500;      /* 20-49% */
--read-rate-poor: #FF453A;     /* 0-19% */

/* Email Address */
--email-bg: #1a1a1a;
--email-border: #3a3a3a;
--email-text: #D9D9D9;
--email-copy-button: #4A9EFF;

/* States */
--state-pending: #898989;
--state-unsubscribed: #666666;
```

### **Typography**:
```css
/* Newsletter Name */
font-size: 16px;
font-weight: 700;
color: #FFFFFF;

/* Stats */
font-size: 12px;
color: #898989;

/* Email Address */
font-family: Monaco, monospace;
font-size: 12px;
color: #D9D9D9;
```

### **Spacing** (4px grid):
```css
--card-padding: 16px;
--card-gap: 12px;
--button-gap: 8px;
```

---

## 🔧 Technical Implementation

### **GraphQL Mutations**:

```graphql
type Mutation {
  # Create email address for newsletter
  createNewsletterEmailAddress(input: CreateNewsletterEmailInput!): NewsletterEmailAddress!

  # Unsubscribe from newsletter
  unsubscribeFromNewsletter(emailAddressId: ID!): NewsletterSubscription!

  # Delete email address permanently
  deleteNewsletterEmailAddress(emailAddressId: ID!): DeleteResult!

  # Resubscribe (reactivate email address)
  resubscribeToNewsletter(emailAddressId: ID!): NewsletterSubscription!
}

input CreateNewsletterEmailInput {
  newsletterName: String!   # User-provided name (e.g., "Dense Discovery")
}

type NewsletterEmailAddress {
  id: ID!
  emailAddress: String!     # Generated address
  newsletterName: String!
  newsletterSlug: String!
  status: EmailAddressStatus!
  createdAt: DateTime!
}

enum EmailAddressStatus {
  ACTIVE
  UNSUBSCRIBED
  DELETED
}
```

### **GraphQL Queries**:

```graphql
type Query {
  # Get all newsletter subscriptions for user
  newsletterSubscriptions: [NewsletterSubscription!]!

  # Get newsletter analytics
  newsletterAnalytics(timeRange: TimeRange!): NewsletterAnalytics!
}

type NewsletterSubscription {
  id: ID!
  newsletterName: String!
  emailAddress: NewsletterEmailAddress!
  subscriptionStatus: SubscriptionStatus!
  totalEmailsReceived: Int!
  totalEmailsRead: Int!
  readRate: Float!          # Calculated: read/received
  lastEmailReceivedAt: DateTime
  firstEmailReceivedAt: DateTime
  createdAt: DateTime!
}

enum SubscriptionStatus {
  PENDING       # Email address created, waiting for first email
  ACTIVE        # Receiving emails
  UNSUBSCRIBED  # User unsubscribed
}

type NewsletterAnalytics {
  totalEmailsReceived: Int!
  totalEmailsRead: Int!
  averageReadRate: Float!
  topNewsletters: [NewsletterReadRate!]!
  lowEngagementNewsletters: [NewsletterReadRate!]!
}

type NewsletterReadRate {
  newsletterName: String!
  emailsReceived: Int!
  emailsRead: Int!
  readRate: Float!
}
```

### **Email Address Generation Logic**:

```typescript
async function generateNewsletterEmailAddress(
  userId: string,
  newsletterName: string
): Promise<string> {
  // 1. Get user's email prefix (username)
  const user = await getUserById(userId);
  const emailPrefix = user.email.split('@')[0]; // "tim@example.com" → "tim"

  // 2. Generate newsletter slug
  const newsletterSlug = slugify(newsletterName); // "Dense Discovery" → "dense-discovery"

  // 3. Generate unique random ID (6 characters)
  const uniqueId = generateRandomString(6); // "xyz123"

  // 4. Combine into email address
  const emailAddress = `${emailPrefix}-${newsletterSlug}-${uniqueId}@omnivore.app`;

  // 5. Check for collisions (should be extremely rare)
  const exists = await emailAddressExists(emailAddress);
  if (exists) {
    // Regenerate with new unique ID
    return generateNewsletterEmailAddress(userId, newsletterName);
  }

  return emailAddress;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/-+/g, '-')            // Collapse multiple hyphens
    .substring(0, 30);              // Truncate to 30 chars
}

function generateRandomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
```

### **Inbound Email Parsing**:

```typescript
async function handleInboundEmail(webhookPayload: any) {
  // 1. Extract recipient email address
  const toAddress = webhookPayload.To; // "tim-dense-discovery-xyz@omnivore.app"

  // 2. Parse email address
  const parsed = parseNewsletterEmailAddress(toAddress);
  // { username: "tim", newsletterSlug: "dense-discovery", uniqueId: "xyz" }

  // 3. Lookup email address in database
  const emailAddress = await findEmailAddressByAddress(toAddress);
  if (!emailAddress || emailAddress.status !== 'ACTIVE') {
    // Email address deleted or unsubscribed - reject email
    return { status: 'rejected', reason: 'Address no longer active' };
  }

  // 4. Extract email content
  const content = extractEmailContent(webhookPayload);

  // 5. Create library item
  await createLibraryItem({
    userId: emailAddress.userId,
    source: 'newsletter',
    newsletterName: emailAddress.newsletterName,
    newsletterEmailAddressId: emailAddress.id,
    title: content.subject,
    content: content.html,
    author: webhookPayload.From,
    publishedAt: new Date(),
  });

  // 6. Update subscription stats
  await updateNewsletterSubscriptionStats(emailAddress.id);

  return { status: 'accepted' };
}
```

---

## 📱 Mobile Responsive

### **Newsletter Card (Mobile)**:

```
┌──────────────────────────────┐
│ 📧 Dense Discovery    [•••]  │
│ 12 articles · 2h ago         │
│ Read rate: 83%               │
│ tim-dense-discovery-...      │ ← Truncated
│ [Copy] [Unsubscribe]         │
└──────────────────────────────┘
```

### **Add Newsletter Modal (Mobile)**:

```
Full-screen modal (slides up from bottom)

┌──────────────────────────────┐
│ Add Newsletter           ✕   │
├──────────────────────────────┤
│                              │
│ Newsletter Name:             │
│ ┌──────────────────────────┐ │
│ │ Dense Discovery          │ │
│ └──────────────────────────┘ │
│                              │
│ Email Address:               │
│ ┌──────────────────────────┐ │
│ │ tim-dense-disco... [📋] │ │
│ └──────────────────────────┘ │
│                              │
│ How it works:                │
│ 1. Copy this email           │
│ 2. Subscribe on website      │
│ 3. Emails appear here        │
│                              │
│ [Create & Copy]              │
│                              │
└──────────────────────────────┘
```

---

## ✅ Acceptance Criteria

**We've succeeded when**:

1. ✅ User can create unlimited email addresses (one per newsletter)
2. ✅ Email address generation is instant (<100ms)
3. ✅ Email address is auto-copied to clipboard on creation
4. ✅ User can see all newsletter subscriptions in one place
5. ✅ User can unsubscribe from individual newsletters
6. ✅ Read rate analytics help users identify low-value newsletters
7. ✅ Email addresses are unique and collision-free
8. ✅ Inbound emails are correctly routed to user's library
9. ✅ Newsletter source is automatically attributed (no manual tagging)
10. ✅ Mobile responsive (all flows work on phone)

---

## 🚀 Implementation Phases

### **Phase 1: Core Functionality** (Week 1)
- [ ] Email address generation logic
- [ ] Database schema (user_email_addresses, newsletter_subscriptions)
- [ ] GraphQL mutations (create, unsubscribe, delete)
- [ ] Basic UI (newsletter list, add newsletter modal)

### **Phase 2: Inbound Email Routing** (Week 2)
- [ ] Postmark webhook handler
- [ ] Email address parsing
- [ ] Library item creation with newsletter attribution
- [ ] Subscription stats tracking

### **Phase 3: Analytics & Polish** (Week 3)
- [ ] Read rate calculation
- [ ] Low-engagement suggestions
- [ ] Newsletter insights dashboard
- [ ] Mobile responsive design

### **Phase 4: Testing & Launch** (Week 4)
- [ ] End-to-end testing (create → subscribe → receive → read)
- [ ] Edge case handling (duplicate names, long names, special characters)
- [ ] Performance testing (1000+ email addresses per user)
- [ ] Launch! 🚀

---

**Status**: Ready for Lovable implementation
**Next**: Create Figma mockups and begin development
