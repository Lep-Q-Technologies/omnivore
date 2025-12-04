# ARC-016: Newsletter Subscriptions - Implementation Plan

**Date**: November 30, 2025
**Branch**: `OM-23-arc-16-newsletter-subscriptions` (suggested)
**Status**: Planning
**Priority**: 🔴 **HIGHEST** - The killer feature!

**Dependencies**:

- ARC-013 ✅ (Content extraction pipeline)
- ARC-014A ✅ (RSS subscriptions pattern to follow)
- ARC-012 ✅ (Queue system for async processing)

---

## 🎯 Vision & User Story

> **As a knowledge worker**, I want to subscribe to Substack newsletters, TechCrunch newsletters, and other email-based publications using a unique Omnivore email address, so that all my reading content (newsletters + articles + RSS) lives in one unified inbox where I can highlight, annotate, and organize it.

**The Promise**:

- Subscribe to Substack with `you+newsletter@omnivore.email`
- New posts auto-import to your Library
- Read in clean reader view (no email clutter)
- Highlight and annotate like any article
- Tag with labels, archive, or delete

---

## 📊 Architecture Overview

### System Flow

```
Newsletter Provider (Substack, etc.)
        ↓
    [Email sent to: user+newsletter@omnivore.email]
        ↓
Email Service (SendGrid Inbound Parse / Postmark)
        ↓
    [Webhook POST: raw email data]
        ↓
EmailInboundController (NestJS)
        ↓
EmailProcessorService (validates, parses)
        ↓
BullMQ Queue (newsletter-import)
        ↓
NewsletterProcessorService (extract content)
        ↓
LibraryItemRepository (save to database)
        ↓
User's Library (ready to read!)
```

### Key Components

**Backend (NestJS)**:

1. **EmailModule** - New module for email handling
2. **EmailInboundController** - Receives webhook from email provider
3. **EmailParserService** - Extracts content from HTML emails
4. **NewsletterProcessorService** - Queue processor for async import
5. **NewsletterSubscriptionEntity** - Tracks user's newsletter subscriptions
6. **NewsletterRepository** - CRUD operations

**Email Provider Integration**:

- **Option A**: SendGrid Inbound Parse (recommended)
- **Option B**: Postmark Inbound
- **Option C**: Mailgun Inbound Routes

**Database**:

- `newsletter_subscription` table (similar to `rss_feed`)
- `library_item.source_type` = 'NEWSLETTER' (or reuse contentType)

**Frontend**:

- Newsletter section in left nav (under Subscriptions)
- "Get your Omnivore email" onboarding
- Newsletter management UI (view subscriptions, unsubscribe)

---

## 🏗️ Implementation Phases

### **Phase 1: Email Infrastructure Setup** (Days 1-2)

**Goal**: Receive emails via webhook and validate them.

**Tasks**:

1. Choose email provider (recommend SendGrid Inbound Parse)
2. Set up domain DNS records (MX, SPF, DKIM)
3. Configure webhook endpoint
4. Create EmailModule scaffolding
5. Implement EmailInboundController
6. Add email signature validation
7. Test with real email send

**Deliverables**:

- [ ] EmailModule created
- [ ] EmailInboundController handles POST requests
- [ ] Webhook signature validation working
- [ ] Can receive test email and log it

**Testing**:

```bash
# Send test email to your-test-email@omnivore.email
# Should hit webhook and log raw email data
```

---

### **Phase 2: Email Parsing & Content Extraction** (Days 2-3)

**Goal**: Parse HTML emails and extract clean article content.

**Tasks**:

1. Install dependencies:
   - `mailparser` - Parse MIME emails
   - Reuse existing `linkedom` + `@mozilla/readability`
2. Create EmailParserService:
   - Parse MIME email
   - Extract HTML body (prefer HTML over plain text)
   - Extract sender, subject, date
   - Handle multipart emails
3. Create NewsletterContentExtractor:
   - Detect common newsletter templates (Substack, Beehiiv, ConvertKit)
   - Extract article content vs. email chrome
   - Preserve inline images
   - Handle embedded styles
4. Create NewsletterProcessorService (BullMQ processor)
5. Add to QueueModule

**Deliverables**:

- [ ] EmailParserService parses emails
- [ ] NewsletterContentExtractor extracts clean content
- [ ] Inline images preserved
- [ ] Content saved to LibraryItem

**Testing**:

```typescript
// E2E test
it('should import Substack newsletter', async () => {
  const email = await sendTestEmail({
    from: 'writer@substack.com',
    to: 'test+newsletter@omnivore.email',
    subject: 'Test Newsletter',
    html: '<html>...</html>',
  })

  // Wait for processing
  await waitFor(() => {
    const item = await libraryItemRepository.findByUrl(...)
    expect(item.contentType).toBe(ContentType.NEWSLETTER)
    expect(item.title).toBe('Test Newsletter')
  })
})
```

---

### **Phase 3: Database Schema & Subscription Management** (Day 3-4)

**Goal**: Track newsletter subscriptions and link to library items.

**Tasks**:

1. Create NewsletterSubscriptionEntity:
   ```typescript
   - id: uuid
   - userId: uuid (FK to user)
   - email: string (the sender email, e.g., writer@substack.com)
   - name: string (publication name, e.g., "Tim's Newsletter")
   - lastReceivedAt: timestamp
   - itemCount: number
   - active: boolean
   - createdAt: timestamp
   - updatedAt: timestamp
   ```
2. Create database migration `0201.do.create_newsletter_subscription.sql`
3. Create NewsletterRepository
4. Add `sourceEmail` field to LibraryItem (to link back to newsletter)
5. Implement subscription auto-detection:
   - When email arrives, check if subscription exists
   - If not, create subscription automatically
6. Add unsubscribe functionality:
   - Mark subscription as inactive
   - Optionally delete library items

**Deliverables**:

- [ ] `newsletter_subscription` table created
- [ ] NewsletterRepository implements CRUD
- [ ] Auto-subscription on first email
- [ ] Unsubscribe functionality

---

### **Phase 4: Unique Email Address Generation** (Day 4)

**Goal**: Generate unique email addresses per user for privacy and routing.

**Tasks**:

1. Add `emailAlias` field to User entity (or UserProfile)
   ```typescript
   emailAlias: string // e.g., "abc123" or "user-uuid"
   ```
2. Implement email generation:
   - Option A: `{uuid}@omnivore.email` (more secure)
   - Option B: `{username}+{random}@omnivore.email` (more readable)
   - Recommend: `{shortId}@omnivore.email` (8-char nanoid)
3. Add email routing logic:
   - Parse incoming email `to` address
   - Extract user identifier
   - Look up user by emailAlias
   - Route to correct user
4. Handle edge cases:
   - Invalid email alias → reject
   - User not found → reject
   - Rate limiting per user

**Deliverables**:

- [ ] User has unique email address
- [ ] Email routing works
- [ ] Invalid emails rejected
- [ ] Rate limiting implemented

**Example**:

```typescript
// User sees their email in UI
Your Omnivore Email: abc12xyz@omnivore.email

// When newsletter arrives at abc12xyz@omnivore.email
→ Look up user by emailAlias = "abc12xyz"
→ Import to that user's library
```

---

### **Phase 5: Frontend UI** (Day 5-6)

**Goal**: User can view their email, manage subscriptions, and see newsletters in library.

**Tasks**:

1. Add Newsletter section to LeftNavigation:
   ```tsx
   <div className="subscription-subsection">
     <h4>📰 Newsletters</h4>
     {newsletters.map((newsletter) => (
       <NewsletterItem
         key={newsletter.id}
         newsletter={newsletter}
         onClick={() => filterByNewsletter(newsletter.id)}
       />
     ))}
   </div>
   ```
2. Create Newsletter settings page:
   - Display user's unique email address
   - Copy to clipboard button
   - List of active subscriptions
   - Unsubscribe button per newsletter
   - Onboarding guide ("How to subscribe")
3. Add GraphQL queries/mutations:
   - `userNewsletters` query
   - `unsubscribeFromNewsletter` mutation
4. Update LibraryPage filters to support newsletter filtering
5. Add ContentType.NEWSLETTER badge to library items

**Deliverables**:

- [ ] Newsletter section in left nav
- [ ] Settings page with unique email
- [ ] Copy email button works
- [ ] Subscription management UI
- [ ] Filter library by newsletter

**UI Mockup**:

```
Settings → Newsletters
┌─────────────────────────────────────────┐
│ Your Omnivore Email Address             │
│ ┌──────────────────────────────────┐   │
│ │ abc12xyz@omnivore.email      [📋]│   │
│ └──────────────────────────────────┘   │
│                                          │
│ How to Subscribe:                        │
│ 1. Go to newsletter signup page          │
│ 2. Use your Omnivore email above        │
│ 3. New posts appear in your Library!    │
│                                          │
│ Active Subscriptions (3)                 │
│ ┌──────────────────────────────────┐   │
│ │ 📰 Tim's Newsletter              │   │
│ │    writer@substack.com       [✕] │   │
│ │    12 items • Last: 2 days ago   │   │
│ └──────────────────────────────────┘   │
│ ┌──────────────────────────────────┐   │
│ │ 📰 TechCrunch Daily              │   │
│ │    daily@techcrunch.com      [✕] │   │
│ │    45 items • Last: 1 day ago    │   │
│ └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

### **Phase 6: Testing & Polish** (Day 6-7)

**Goal**: Ensure robustness and handle edge cases.

**Tasks**:

1. E2E tests:
   - Subscribe to newsletter → receive email → import → read
   - Unsubscribe → newsletter marked inactive
   - Invalid email rejected
   - Duplicate newsletter handling
2. Unit tests:
   - EmailParserService
   - NewsletterContentExtractor
   - Email routing logic
3. Manual testing with real newsletters:
   - Substack
   - Beehiiv
   - ConvertKit
   - TechCrunch
   - Hacker News digest
4. Handle edge cases:
   - Email too large (> 10 MB)
   - Malformed HTML
   - Missing subject
   - Spam detection (sender reputation)
5. Performance testing:
   - 100 emails arriving simultaneously
   - Large HTML emails (5+ MB)
6. Security audit:
   - Email injection attacks
   - XSS in email content
   - Spam prevention
   - Rate limiting

**Deliverables**:

- [ ] E2E tests passing
- [ ] Real newsletter imports working
- [ ] Edge cases handled gracefully
- [ ] Security review complete
- [ ] Performance acceptable

---

## 🔧 Technical Decisions

### Email Provider: SendGrid Inbound Parse (Recommended)

**Why SendGrid**:

- ✅ Free tier: 100 emails/day (perfect for beta)
- ✅ Easy webhook setup
- ✅ Reliable delivery
- ✅ Good documentation
- ✅ Spam filtering built-in
- ✅ Already using SendGrid for outbound? (check)

**Setup Steps**:

1. Create SendGrid account
2. Add domain: `omnivore.email`
3. Configure MX records: `mx.sendgrid.net` (priority 10)
4. Set up Inbound Parse webhook: `https://api.omnivore.app/api/email/inbound`
5. Enable SPF/DKIM
6. Test with SendGrid email test tool

**Alternatives**:

- **Postmark Inbound**: Good, but more expensive
- **Mailgun**: Good, but complex setup
- **AWS SES + Lambda**: Overkill for now

---

### Content Extraction Strategy

**Challenge**: Newsletters have varied formats (Substack, Beehiiv, plain text, etc.)

**Approach**:

1. **Template Detection** - Identify newsletter platform by HTML patterns:

   ```typescript
   if (html.includes('substack.com')) {
     return extractSubstackContent(html)
   } else if (html.includes('beehiiv.com')) {
     return extractBeehiivContent(html)
   } else {
     return extractGenericContent(html) // Readability fallback
   }
   ```

2. **Readability.js Fallback** - For unknown formats, use Mozilla Readability
3. **Preserve Inline Images** - Convert `cid:` images to data URIs or download to CDN
4. **Strip Email Chrome** - Remove unsubscribe links, social buttons, footers

**Example Extractors**:

```typescript
class SubstackExtractor {
  extract(html: string) {
    // Substack wraps content in <div class="post-content">
    const content = html.match(/<div class="post-content">(.*?)<\/div>/s)
    return sanitizeHtml(content[1])
  }
}

class GenericExtractor {
  extract(html: string) {
    // Use Readability.js
    const dom = new JSDOM(html)
    const reader = new Readability(dom.window.document)
    return reader.parse()
  }
}
```

---

### Spam & Security Considerations

**Spam Prevention**:

1. **Rate Limiting**: Max 50 emails/hour per user
2. **Sender Reputation**: Block known spam domains
3. **Content Validation**: Reject if no extractable content
4. **User Reports**: Allow users to mark as spam

**Security**:

1. **HTML Sanitization**: Use DOMPurify on all email content
2. **Webhook Signature Validation**: Verify SendGrid signatures
3. **SQL Injection**: Use parameterized queries (TypeORM handles this)
4. **XSS Prevention**: Sanitize all rendered email content

---

## 🗄️ Database Schema

### `newsletter_subscription` Table

```sql
CREATE TABLE omnivore.newsletter_subscription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES omnivore.user(id) ON DELETE CASCADE,

  -- Newsletter metadata
  sender_email VARCHAR(512) NOT NULL, -- e.g., writer@substack.com
  name VARCHAR(512),                  -- e.g., "Tim's Newsletter"
  description TEXT,                   -- Optional description

  -- Statistics
  item_count INTEGER DEFAULT 0,
  last_received_at TIMESTAMPTZ,

  -- Status
  active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  UNIQUE(user_id, sender_email)
);

CREATE INDEX idx_newsletter_subscription_user_id ON omnivore.newsletter_subscription(user_id);
CREATE INDEX idx_newsletter_subscription_active ON omnivore.newsletter_subscription(active);
```

### `user` / `user_profile` Table Update

```sql
-- Add email alias for unique newsletter address
ALTER TABLE omnivore.user
ADD COLUMN email_alias VARCHAR(64) UNIQUE;

-- Generate alias for existing users
UPDATE omnivore.user
SET email_alias = substring(md5(random()::text) from 1 for 8)
WHERE email_alias IS NULL;
```

### `library_item` Table Update

```sql
-- Add source email for newsletter items
ALTER TABLE omnivore.library_item
ADD COLUMN source_email VARCHAR(512);

CREATE INDEX idx_library_item_source_email ON omnivore.library_item(source_email);
```

---

## 📋 Acceptance Criteria

### **Must Have** (MVP):

- [ ] User has unique email address (e.g., `abc123@omnivore.email`)
- [ ] User can copy email to clipboard
- [ ] Emails sent to user's address auto-import to Library
- [ ] Newsletter content extracted cleanly (readable)
- [ ] Newsletter items show up in Library with NEWSLETTER badge
- [ ] User can filter library by newsletter
- [ ] User can unsubscribe from newsletter (marks inactive)
- [ ] Newsletter section in left nav shows active subscriptions
- [ ] Works with Substack newsletters
- [ ] Works with at least 2 other newsletter platforms (TechCrunch, Beehiiv)

### **Nice to Have** (Post-MVP):

- [ ] Auto-detect newsletter name from email headers
- [ ] Newsletter unread count per subscription
- [ ] Bulk unsubscribe
- [ ] Email forwarding rules (forward specific senders to specific labels)
- [ ] Newsletter favicon/icon detection
- [ ] Newsletter preview in settings

### **Edge Cases Handled**:

- [ ] Email too large (> 10 MB) → rejected with error message
- [ ] Malformed HTML → fallback to plain text
- [ ] No subject line → use sender email as title
- [ ] Duplicate email → deduplicate by Message-ID header
- [ ] Spam email → rejected based on sender reputation
- [ ] Invalid email alias → 404 response to webhook
- [ ] Rate limit exceeded → 429 response, queue for later

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
describe('EmailParserService', () => {
  it('should parse MIME email', () => {})
  it('should extract HTML body', () => {})
  it('should handle multipart emails', () => {})
})

describe('NewsletterContentExtractor', () => {
  it('should extract Substack content', () => {})
  it('should extract Beehiiv content', () => {})
  it('should fallback to Readability', () => {})
  it('should preserve inline images', () => {})
})

describe('EmailInboundController', () => {
  it('should validate webhook signature', () => {})
  it('should reject invalid signatures', () => {})
  it('should route email to correct user', () => {})
})
```

### E2E Tests

```typescript
describe('Newsletter Import Flow', () => {
  it('should import Substack newsletter', async () => {
    // Send test email via SendGrid test API
    // Wait for processing
    // Verify library item created
  })

  it('should auto-create subscription', async () => {
    // Send email from new sender
    // Verify subscription created
  })

  it('should unsubscribe', async () => {
    // Create subscription
    // Call unsubscribe mutation
    // Verify marked inactive
  })
})
```

### Manual Testing Checklist

- [ ] Subscribe to Substack with Omnivore email
- [ ] Receive newsletter, verify import
- [ ] Subscribe to TechCrunch Daily
- [ ] Subscribe to Hacker News digest
- [ ] Unsubscribe from newsletter
- [ ] Verify content displays correctly in reader
- [ ] Test with very long newsletter (5+ MB)
- [ ] Test with newsletter containing images
- [ ] Test with plain text newsletter

---

## 📦 Dependencies & NPM Packages

```json
{
  "dependencies": {
    "mailparser": "^3.6.5", // Parse MIME emails
    "@sendgrid/mail": "^7.7.0", // SendGrid SDK (if needed)
    "nanoid": "^5.0.0" // Generate email aliases
  }
}
```

**Already Available**:

- ✅ `linkedom` (DOM parsing)
- ✅ `@mozilla/readability` (content extraction)
- ✅ `dompurify` (HTML sanitization)
- ✅ BullMQ (queue system)
- ✅ TypeORM (database)

---

## 🚀 Deployment Considerations

### DNS Configuration

```
MX Record:
omnivore.email.  MX 10 mx.sendgrid.net.

SPF Record:
omnivore.email.  TXT "v=spf1 include:sendgrid.net ~all"

DKIM Record:
(Generated by SendGrid, add to DNS)
```

### Environment Variables

```bash
# .env
SENDGRID_INBOUND_WEBHOOK_SECRET=your-secret-key
SENDGRID_API_KEY=SG.xxx
OMNIVORE_EMAIL_DOMAIN=omnivore.email
WEBHOOK_BASE_URL=https://api.omnivore.app
```

### Webhook URL

```
https://api.omnivore.app/api/email/inbound
```

---

## 🎯 Success Metrics

**Launch Goals** (First 2 weeks):

- [ ] 100% of test newsletters import successfully
- [ ] <5 sec avg. processing time per email
- [ ] 0 security incidents
- [ ] 0 data loss incidents
- [ ] > 90% content extraction quality (manual review of 20 newsletters)

**Long-term** (3 months):

- [ ] 50+ newsletter subscriptions across beta users
- [ ] <1% error rate
- [ ] Support for 10+ newsletter platforms

---

## 📅 Timeline Estimate

**Total: 5-7 days** (matches backlog estimate)

| Phase     | Tasks                      | Estimate   |
| --------- | -------------------------- | ---------- |
| Phase 1   | Email infrastructure       | 1.5 days   |
| Phase 2   | Email parsing & extraction | 1.5 days   |
| Phase 3   | Database & subscriptions   | 1 day      |
| Phase 4   | Unique email generation    | 0.5 days   |
| Phase 5   | Frontend UI                | 1.5 days   |
| Phase 6   | Testing & polish           | 1 day      |
| **Total** |                            | **7 days** |

**Optimistic**: 5 days (if everything goes smooth)
**Realistic**: 6-7 days (accounting for edge cases)
**Pessimistic**: 8-9 days (if email provider setup is tricky)

---

## 🔄 Iteration Plan

### MVP (Week 1):

- Core functionality working
- Substack + 1 other newsletter platform
- Basic UI

### Post-MVP Improvements (Week 2-3):

- Support 5+ newsletter platforms
- Auto-detect newsletter metadata
- Improved UI/UX
- Performance optimizations

### Future Enhancements:

- Email forwarding rules
- Newsletter analytics
- Digest view of newsletters
- AI summaries of newsletters (ties into ARC-015!)

---

## 🚦 Go/No-Go Decision Points

**After Phase 1** (Email infrastructure):

- ✅ Can receive emails via webhook
- ✅ Webhook signature validation works
- ❌ If SendGrid setup fails → pivot to Postmark

**After Phase 2** (Content extraction):

- ✅ Substack extraction works well
- ✅ Generic fallback handles unknowns
- ❌ If extraction quality <70% → rethink approach

**After Phase 5** (Frontend UI):

- ✅ User can successfully subscribe to newsletter
- ✅ Content displays correctly
- ❌ If critical bugs → delay launch

---

## 📚 References & Resources

**Email Standards**:

- [RFC 5322 - Internet Message Format](https://tools.ietf.org/html/rfc5322)
- [RFC 2045 - MIME Part One](https://tools.ietf.org/html/rfc2045)

**Newsletter Platforms**:

- Substack API docs
- Beehiiv structure analysis
- ConvertKit email format

**SendGrid**:

- [SendGrid Inbound Parse Docs](https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook)
- [SendGrid Event Webhook](https://docs.sendgrid.com/for-developers/tracking-events/event)

**Security**:

- [OWASP Email Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Email_Security_Cheat_Sheet.html)

---

**Next Steps**:

1. ✅ Review this plan
2. Create branch: `OM-23-arc-16-newsletter-subscriptions`
3. Start with Phase 1 (Email infrastructure)
4. Daily progress updates
5. Ship MVP in 5-7 days!

**Let's build the killer feature!** 🚀📰
