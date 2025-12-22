# Third-Party Email Handling: Offload Everything Possible

## Current Architecture (Too Much Self-Hosting)

```
Newsletter Sender
  ↓
SendGrid Inbound Parse (receives email) ✅ Third-party
  ↓
Webhook POST to our GCF ⚠️ We manage
  ↓
Parse multipart email ⚠️ We manage
  ↓
Classify email type ⚠️ We manage
  ↓
Queue to Redis ⚠️ We manage
  ↓
Process in api-nest ⚠️ We manage
  ↓
Store in database ⚠️ We manage
```

**We're doing too much!** Let's offload more.

---

## Option 1: SendGrid with Advanced Routing (Simplest Upgrade)

### Architecture
```
Newsletter Sender
  ↓
SendGrid Inbound Parse
  ↓
SendGrid Mail Send API (auto-forward confirmations) ✅ No code!
  ↓
SendGrid Event Webhook → Our api-nest
```

### SendGrid Inbound Parse Rules

**SendGrid can automatically route emails based on patterns:**

```javascript
// SendGrid Inbound Parse Settings (configured in UI, no code!)
{
  "hostname": "inbox.omnivore.app",
  "url": "https://api.omnivore.app/webhooks/newsletters",
  "spam_check": true,
  "send_raw": true
}
```

### SendGrid Actions (new feature - Action Webhook)

```javascript
// In SendGrid dashboard: Settings → Mail Settings → Inbound Parse → Actions
{
  "filter": {
    "subject": {
      "contains": ["confirm", "verify"],
      "and_contains": ["newsletter", "subscription"]
    }
  },
  "action": {
    "type": "forward",
    "to": "{{original_to_email_user_email}}" // SendGrid looks up user email
  }
}
```

**Problem:** SendGrid can't look up user emails from our database natively.

**Solution:** Use SendGrid Parse Webhook + minimal routing function

```typescript
// Simplified webhook handler
export const sendgridInbound = async (req, res) => {
  const { from, to, subject, html } = parseSendGridWebhook(req.body)

  // Pattern match for confirmations
  if (isConfirmationEmail(subject)) {
    // Use SendGrid Mail API to forward
    const user = await getUserByNewsletterEmail(to)
    await sendgrid.send({
      to: user.email,
      from: 'noreply@omnivore.app',
      replyTo: from,
      subject: `[Forwarded] ${subject}`,
      html: html,
    })
    return res.send('ok')
  }

  // Queue newsletters for processing
  await queue.add('save-newsletter', { from, to, subject, html })
  res.send('ok')
}
```

**Offloaded to SendGrid:**
- ✅ Email receiving
- ✅ Spam filtering
- ✅ Email parsing (multipart)
- ✅ Email forwarding (via Mail API)

**We still manage:**
- ⚠️ User lookup
- ⚠️ Classification logic
- ⚠️ Newsletter processing

---

## Option 2: AWS SES + Lambda (Best for Scale)

### Architecture
```
Newsletter Sender
  ↓
AWS SES (receives email) ✅ Third-party
  ↓
SES Receipt Rules (automatic routing) ✅ No code needed!
  |
  ├─→ Confirmation emails → Lambda → SES Send (forward to user)
  └─→ Newsletter emails → Lambda → Queue to SQS → api-nest
```

### SES Receipt Rules (Powerful Native Features)

**Automatic email routing based on patterns:**

```yaml
# Rule 1: Forward Confirmation Emails
- name: "newsletter-confirmations"
  enabled: true
  recipients: ["*@inbox.omnivore.app"]
  conditions:
    - subject_contains: ["confirm", "verify"]
    - subject_contains: ["newsletter", "subscription"]
  actions:
    - type: Lambda
      function: confirmation-forwarder
      invocation_type: Event # Fire and forget

# Rule 2: Process Newsletters
- name: "newsletter-content"
  enabled: true
  recipients: ["*@inbox.omnivore.app"]
  actions:
    - type: S3 # Store raw email
      bucket: omnivore-emails
      prefix: newsletters/
    - type: Lambda
      function: newsletter-processor
    - type: SNS
      topic: email-received # Optional: pub/sub notifications
```

### Lambda Function: Minimal Code

```typescript
// confirmation-forwarder lambda (10 lines!)
export const handler = async (event: SESEvent) => {
  const email = event.Records[0].ses.mail
  const recipient = email.destination[0] // user@inbox.omnivore.app

  // Simple user lookup (cached in Lambda env)
  const user = await dynamodb.get({
    TableName: 'users',
    Key: { newsletterEmail: recipient }
  })

  // Forward using SES
  await ses.sendEmail({
    Source: 'noreply@omnivore.app',
    Destination: { ToAddresses: [user.email] },
    Message: {
      Subject: { Data: email.commonHeaders.subject },
      Body: { Html: { Data: email.content } }
    }
  })
}
```

**Offloaded to AWS:**
- ✅ Email receiving (SES)
- ✅ Spam filtering (SES)
- ✅ Email parsing (SES)
- ✅ Routing logic (Receipt Rules - no code!)
- ✅ Email storage (S3 - optional)
- ✅ Email forwarding (SES Send)

**We still manage:**
- ⚠️ User lookup (but cached in Lambda)
- ⚠️ Newsletter processing (but api-nest already does this)

---

## Option 3: Nylas Email API (Most Offloaded) 💎

### What is Nylas?

**Email-as-a-Service platform that handles EVERYTHING:**
- Email receiving
- Parsing
- Classification
- Webhooks
- Sending
- Threading
- Search

### Architecture (Minimal Code!)

```
Newsletter Sender
  ↓
Nylas receives email ✅ Fully managed
  ↓
Nylas classifies email type ✅ AI-powered
  ↓
Nylas Webhook → Our api-nest (just save to DB)
```

### Nylas Setup

```typescript
// 1. Configure Nylas to receive emails
const nylas = new Nylas({
  clientId: process.env.NYLAS_CLIENT_ID,
  clientSecret: process.env.NYLAS_CLIENT_SECRET,
})

// 2. Set up email receiving for inbox.omnivore.app
await nylas.application.update({
  inboundDomain: 'inbox.omnivore.app',
  webhookUrl: 'https://api.omnivore.app/webhooks/nylas',
})

// 3. Configure routing rules (in Nylas dashboard)
{
  "rules": [
    {
      "name": "Forward confirmations",
      "condition": {
        "subject": "contains('confirm') AND contains('newsletter')"
      },
      "action": {
        "type": "forward",
        "to": "{{contact.email}}" // Nylas looks up contact
      }
    },
    {
      "name": "Process newsletters",
      "condition": {
        "subject": "NOT contains('confirm')"
      },
      "action": {
        "type": "webhook",
        "url": "https://api.omnivore.app/webhooks/newsletter"
      }
    }
  ]
}
```

### Webhook Handler (Ultra Simple)

```typescript
// Our webhook just saves to database
app.post('/webhooks/nylas', async (req, res) => {
  const email = req.body // Already parsed by Nylas!

  // Nylas has already:
  // ✅ Parsed HTML
  // ✅ Extracted text
  // ✅ Identified sender
  // ✅ Classified as newsletter
  // ✅ Forwarded confirmations

  await db.libraryItems.create({
    userId: email.userId, // Nylas looked up user
    title: email.subject,
    content: email.body, // Already cleaned HTML!
    author: email.from.name,
    senderEmail: email.from.email,
  })

  res.send('ok')
})
```

**Offloaded to Nylas:**
- ✅ Email receiving
- ✅ Spam filtering
- ✅ Email parsing
- ✅ HTML cleaning
- ✅ Contact management (user lookup!)
- ✅ Email classification (AI)
- ✅ Routing logic
- ✅ Email forwarding
- ✅ Thread detection
- ✅ Attachment handling

**We only manage:**
- Saving to database
- UI display

**Pricing:** $9/month per connected email address (expensive at scale!)

---

## Option 4: Postmark Inbound (Best Balance) ⭐

### Why Postmark?

**Better than SendGrid for inbound:**
- Cleaner webhooks (JSON, not multipart)
- Better deliverability
- Simpler API
- Built-in retry logic
- First-class inbound support

### Architecture

```
Newsletter Sender
  ↓
Postmark Inbound Server ✅ Fully managed
  ↓
Postmark parses & enriches ✅ Clean JSON webhook
  ↓
Webhook → Our minimal handler
  ↓
Classification → Route to queue
```

### Postmark Webhook (Much Cleaner Than SendGrid!)

```json
{
  "From": "newsletter@substack.com",
  "FromName": "The Daily Tech",
  "To": "user@inbox.omnivore.app",
  "Subject": "Confirm your subscription",
  "HtmlBody": "<html>...</html>",
  "TextBody": "Plain text...",
  "Headers": [
    {"Name": "List-Unsubscribe", "Value": "<mailto:unsub@newsletter.com>"}
  ],
  "Attachments": [],
  "StrippedTextReply": "...",
  "Tag": "inbound", // Can tag emails for routing!
  "MessageStream": "inbound"
}
```

**No parsing needed!** Already clean JSON.

### Postmark Inbound Rules

```javascript
// Set up in Postmark dashboard
{
  "InboundDomain": "inbox.omnivore.app",
  "InboundHookUrl": "https://api.omnivore.app/webhooks/postmark",
  "InboundRules": [
    {
      "Rule": "Subject contains 'confirm' AND Subject contains 'newsletter'",
      "Action": "Forward",
      "ForwardTo": "{{user_email}}" // Lookup from database
    }
  ]
}
```

**Problem:** Postmark can't do database lookups.

**Solution:** Two-webhook approach:

```typescript
// Webhook 1: Route based on type
app.post('/webhooks/postmark-router', async (req, res) => {
  const email = req.body

  if (isConfirmationEmail(email.Subject)) {
    // Trigger secondary webhook for confirmation handling
    await fetch('https://api.omnivore.app/webhooks/postmark-confirmation', {
      method: 'POST',
      body: JSON.stringify(email),
    })
  } else {
    // Queue newsletter
    await queue.add('save-newsletter', email)
  }

  res.send('ok')
})

// Webhook 2: Handle confirmations (separate service for scalability)
app.post('/webhooks/postmark-confirmation', async (req, res) => {
  const email = req.body
  const user = await getUserByNewsletterEmail(email.To)

  // Use Postmark Sending API to forward
  await postmark.sendEmail({
    From: 'noreply@omnivore.app',
    To: user.email,
    Subject: `[Forwarded] ${email.Subject}`,
    HtmlBody: email.HtmlBody,
  })

  res.send('ok')
})
```

**Offloaded to Postmark:**
- ✅ Email receiving
- ✅ Spam filtering
- ✅ Email parsing (clean JSON!)
- ✅ HTML + text extraction
- ✅ Header parsing
- ✅ Attachment handling
- ✅ Email forwarding (via API)
- ✅ Bounce handling
- ✅ Retry logic

**We still manage:**
- ⚠️ User lookup
- ⚠️ Classification logic
- ⚠️ Queue management

---

## Option 5: Cloudflare Email Workers (Future-Proof) 🚀

### New Service (Beta)

**Cloudflare Email Routing + Workers:**
- Receive emails at edge locations globally
- Process with Workers (serverless)
- Built-in routing rules
- Free tier: 200 emails/day

### Architecture

```
Newsletter Sender
  ↓
Cloudflare Email Routing (edge network) ✅ Global, fast
  ↓
Cloudflare Worker (runs email classification) ✅ Serverless
  |
  ├─→ Confirmation → Send API (forward)
  └─→ Newsletter → R2 Storage → Queue binding → api-nest
```

### Worker Code (Runs on Cloudflare Edge)

```typescript
// email-router.worker.ts
export default {
  async email(message, env) {
    // Classification
    const isConfirmation = message.subject.match(/confirm|verify/)
      && message.subject.match(/newsletter|subscription/)

    if (isConfirmation) {
      // Forward to user's email
      const user = await env.DB.prepare(
        'SELECT email FROM users WHERE newsletter_email = ?'
      ).bind(message.to).first()

      await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          from: { email: 'noreply@omnivore.app' },
          personalizations: [{ to: [{ email: user.email }] }],
          subject: message.subject,
          content: [{ type: 'text/html', value: message.html }],
        }),
      })
    } else {
      // Store for processing
      await env.R2.put(`newsletters/${message.id}`, message.raw)

      // Queue processing job
      await env.QUEUE.send({
        type: 'save-newsletter',
        messageId: message.id,
      })
    }
  }
}
```

**Offloaded to Cloudflare:**
- ✅ Email receiving (global edge)
- ✅ Email parsing
- ✅ Serverless execution
- ✅ Email storage (R2)
- ✅ Queue management (Queue bindings)
- ✅ Database (D1)

**Benefits:**
- Global edge network (faster email receiving)
- Free tier generous
- Workers run close to email arrival
- No cold starts
- Integrated with Cloudflare ecosystem

**Drawbacks:**
- New/beta service
- Less mature than SendGrid/Postmark
- Limited documentation

---

## Comparison Matrix

| Solution | Setup Complexity | Monthly Cost | Offloading | Best For |
|----------|-----------------|--------------|------------|----------|
| **SendGrid Advanced** | Low | $15-80 | Medium | Current users, quick upgrade |
| **AWS SES + Lambda** | Medium | $0.10/1k emails | High | Scale, AWS ecosystem |
| **Nylas** | Low | $9/mailbox | **Maximum** | Low volume, max offloading |
| **Postmark** ⭐ | Low | $10-80 | High | Clean webhooks, reliability |
| **Cloudflare Workers** | Medium | $5-25 | High | Edge performance, future |

---

## Recommended Solution: Postmark + Minimal Handler

### Why Postmark?

1. **Clean JSON webhooks** (no multipart parsing!)
2. **Reliable delivery** (better than SendGrid)
3. **Simple API** (easier than AWS)
4. **First-class inbound** (not an afterthought)
5. **Reasonable pricing** ($10/mo for 10k emails)

### Implementation Plan

#### Step 1: Replace inbound-email-handler with simple router

```typescript
// packages/email-router/src/index.ts (50 lines total!)
import { postmark } from '@postmark/api'

export const handleInbound = async (req, res) => {
  const email = req.body // Already parsed by Postmark!

  // Classification (one simple function)
  if (isConfirmation(email.Subject)) {
    await forwardConfirmation(email)
  } else {
    await queueNewsletter(email)
  }

  res.send('ok')
}

const isConfirmation = (subject: string): boolean => {
  return /(confirm|verify).*(newsletter|subscription)/i.test(subject)
}

const forwardConfirmation = async (email: PostmarkEmail) => {
  const user = await db.users.findByNewsletterEmail(email.To)

  await postmark.sendEmail({
    From: 'noreply@omnivore.app',
    To: user.email,
    Subject: email.Subject,
    HtmlBody: email.HtmlBody,
    ReplyTo: email.From,
  })
}

const queueNewsletter = async (email: PostmarkEmail) => {
  await queue.add('save-newsletter', {
    from: email.From,
    to: email.To,
    subject: email.Subject,
    html: email.HtmlBody,
    text: email.TextBody,
    unsubMailTo: extractUnsubscribe(email.Headers),
  })
}
```

#### Step 2: Deploy as lightweight function

```yaml
# serverless.yml or similar
service: omnivore-email-router

provider:
  name: aws
  runtime: nodejs18.x

functions:
  inbound:
    handler: src/index.handleInbound
    events:
      - http:
          path: /inbound
          method: POST
    environment:
      POSTMARK_API_KEY: ${env:POSTMARK_API_KEY}
      DATABASE_URL: ${env:DATABASE_URL}
      REDIS_URL: ${env:REDIS_URL}
```

#### Step 3: Configure Postmark

```
Postmark Dashboard:
  → Servers → Inbound
  → Add domain: inbox.omnivore.app
  → Webhook: https://api.omnivore.app/webhooks/inbound
  → Enable spam filtering
  → Enable bounce tracking
```

### Total Code Reduction

**Before (Google Cloud Function):**
- 300+ lines of parsing logic
- Multipart handling
- Header decoding
- Error handling
- Retry logic

**After (Postmark webhook):**
- 50 lines total
- No parsing needed
- Clean JSON input
- Built-in retry

**80% less code!** 🎉

---

## Final Recommendation

### Phase 1 (Now): Switch to Postmark
- Replace GCF with simple webhook handler
- Let Postmark handle all email parsing
- Forward confirmations to user email
- 50 lines of code total

### Phase 2 (Scale): Add Cloudflare Workers
- Move webhook handler to Cloudflare Workers
- Process emails at edge globally
- Store in R2
- Use D1 for user lookups

### Phase 3 (Optimize): Consider Nylas
- If budget allows ($9/mailbox becomes reasonable at scale)
- Offload everything to Nylas
- Focus 100% on reading UX
- Let email experts handle email

**Start with Postmark. It's the sweet spot of simple + powerful.**
