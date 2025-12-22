# How to Add Newsletter Subscriptions

This guide explains all the ways to add newsletter subscriptions to Omnivore.

## 🎯 Current Methods (Phase 2 - Available Now)

### Method 1: Web UI Form (Recommended for Users)

1. Navigate to **Settings** page at `http://localhost:3000/settings`
2. Scroll to the **Newsletter Subscriptions** section
3. Click the **"➕ Add Newsletter Subscription"** button
4. Fill in the form:
   - **Sender Email Address** (required): The email that sends the newsletter
     - Example: `newsletter@substack.com`
   - **Newsletter Title** (optional): A friendly name for the newsletter
     - Example: `The Daily Tech`
5. Click **"Add Newsletter"**
6. The newsletter will appear in your subscriptions list with a unique forwarding email

**What happens:**
- A unique email alias is generated (e.g., `abc123de+xyz789pq@inbox.omnivore.app`)
- The subscription is created in the database
- The newsletter appears in both the Settings page and left navigation
- You can copy the unique email for this specific newsletter

### Method 2: GraphQL Mutation (For Developers/Testing)

Use the GraphQL API directly:

```graphql
mutation {
  subscribeToNewsletter(
    senderEmail: "newsletter@example.com"
    title: "My Newsletter"
  ) {
    success
    message
    subscription {
      id
      senderEmail
      emailAlias
      newsletterEmail
      title
      itemCount
      active
    }
  }
}
```

**Test it:**
```bash
curl -X POST http://localhost:4001/api/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "mutation { subscribeToNewsletter(senderEmail: \"test@newsletter.com\", title: \"Test Newsletter\") { success message subscription { newsletterEmail } } }"
  }'
```

### Method 3: Database Script (For Bulk Testing)

Use the provided script to add multiple test newsletters:

```bash
cd packages/api-nest
npx tsx scripts/add-test-newsletters.ts
```

This adds 5 realistic test newsletters to the demo user's account.

## 🚀 Future Method (Phase 3 - Not Yet Implemented)

### Email Ingestion (The Goal)

**The intended user experience:**

1. User gets their main newsletter email: `{userAlias}@inbox.omnivore.app`
2. User subscribes to a newsletter using that email OR forwards newsletters to it
3. When an email arrives:
   - SendGrid/Postmark webhook receives the email
   - System parses the sender email address
   - If subscription doesn't exist, create it automatically with unique alias
   - Extract newsletter content and create library item
   - Link the item to the subscription
4. Future newsletters from that sender are automatically linked

**What's needed:**
- Email service configuration (SendGrid or Postmark)
- Webhook receiver endpoint
- Email parsing logic
- Content extraction and library item creation
- Auto-subscription creation on first email

**Architecture document:** See `packages/api-nest/ARC-016-NEWSLETTER-SUBSCRIPTIONS-PLAN.md`

## 📧 Understanding Newsletter Email Addresses

### Two-Level Email System

1. **User-level email** (for general newsletters):
   - Format: `{userAlias}@inbox.omnivore.app`
   - Example: `5f0af278@inbox.omnivore.app`
   - Used when you don't need separate emails per newsletter

2. **Subscription-level email** (for specific newsletters):
   - Format: `{userAlias}+{subscriptionAlias}@inbox.omnivore.app`
   - Example: `5f0af278+y2c2xee1@inbox.omnivore.app`
   - Each newsletter subscription gets its own unique email
   - Allows fine-grained filtering and management

### Why Two Levels?

- **User-level**: Forward any newsletter, auto-create subscription
- **Subscription-level**: Give this email when subscribing to specific newsletters
- Both route to the same user, but subscription-level enables per-newsletter tracking

## 🎨 UI Features

### Left Navigation
- **Subscriptions** section with two subsections:
  - **RSS** - Your RSS feed subscriptions
  - **Newsletters (N)** - Your newsletter subscriptions with count
- Click any newsletter to filter library items from that source
- Hover to see unsubscribe button

### Settings Page
- **Newsletter Email Display** - Your main newsletter email with copy button
- **Add Newsletter Form** - Button to manually add subscriptions
- **Subscriptions List** - Grid view of all newsletters with:
  - Site icon (or 📧 emoji default)
  - Title and sender email
  - Unique forwarding email with copy button
  - Item counts (total and unread)
  - Folder and label settings
  - Edit settings and unsubscribe actions

## 🔧 Testing Your Setup

1. **Add a test newsletter** via the UI
2. **Check the left navigation** - should see it under Newsletters
3. **Click the newsletter** - should navigate to filtered view
4. **Copy the unique email** - each newsletter has its own
5. **Edit settings** - change title, folder, auto-labels
6. **Unsubscribe** - removes subscription and (optionally) items

## 📊 Database Schema

Newsletters are stored in the unified `subscription` table:

```sql
SELECT
  id,
  source_type,           -- 'NEWSLETTER'
  source_identifier,     -- sender email (e.g., 'newsletter@substack.com')
  email_alias,          -- unique 8-char alias (e.g., 'y2c2xee1')
  title,
  item_count,
  active
FROM omnivore.subscription
WHERE source_type = 'NEWSLETTER'
AND user_id = '{userId}';
```

## 🎯 Next Steps

**To complete the email ingestion flow:**

1. Set up SendGrid or Postmark inbound email handling
2. Configure DNS records for `inbox.omnivore.app`
3. Create webhook receiver endpoint
4. Implement email parsing and content extraction
5. Auto-create subscriptions on first email from new sender
6. Link library items to subscriptions

**See:** `packages/api-nest/ARC-016-NEWSLETTER-SUBSCRIPTIONS-PLAN.md` for full architecture
