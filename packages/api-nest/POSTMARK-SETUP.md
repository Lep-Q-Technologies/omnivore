# Postmark Inbound Email Setup Guide

This guide explains how to configure Postmark to receive newsletter emails and forward them to the Omnivore API for processing.

## Overview

The newsletter subscription feature works as follows:

1. User creates a newsletter subscription in Omnivore UI
2. Backend generates a unique email alias (e.g., `abc123xyz@inbox.omnivore.app`)
3. User subscribes to newsletter using this email address
4. Newsletter emails are sent to Postmark's inbound server
5. Postmark forwards the email to our webhook endpoint
6. Backend processes the email and creates a library item

## Prerequisites

- Postmark account (free tier works for testing)
- Custom domain or subdomain for receiving emails (e.g., `inbox.omnivore.app`)
- SSL certificate for the webhook endpoint (for production)

## Step 1: Configure Domain in Postmark

### 1.1 Add Inbound Domain

1. Log in to [Postmark](https://postmarkapp.com)
2. Navigate to **Servers** → Select your server
3. Go to **Inbound** tab
4. Click **Add inbound domain**
5. Enter your domain: `inbox.omnivore.app`
6. Click **Add**

### 1.2 Verify DNS Records

Postmark will provide you with MX records to add to your DNS:

```
Priority  Hostname                          Points to
10        inbox.omnivore.app                inbound.postmarkapp.com
```

Add these MX records to your DNS provider (e.g., Cloudflare, Route53, etc.)

**Verification:**

```bash
# Check MX records
dig inbox.omnivore.app MX

# You should see:
# inbox.omnivore.app.  300  IN  MX  10 inbound.postmarkapp.com.
```

### 1.3 Wait for Verification

- Postmark will automatically verify your DNS records
- This usually takes 5-15 minutes
- Status will change from "Pending" to "Active" when verified

## Step 2: Configure Webhook Endpoint

### 2.1 Set Webhook URL

1. In Postmark dashboard, go to **Inbound** tab
2. Click on your verified domain (`inbox.omnivore.app`)
3. Under **Webhook**, enter your API endpoint:

**Development:**

```
https://your-ngrok-url.ngrok.io/webhooks/postmark/inbound
```

**Production:**

```
https://api.omnivore.app/webhooks/postmark/inbound
```

4. Click **Test** to send a sample payload
5. Click **Save**

### 2.2 Webhook Authentication (Optional)

For production, consider adding webhook authentication:

1. Generate a secret token:

```bash
openssl rand -hex 32
```

2. Add to your `.env`:

```bash
POSTMARK_WEBHOOK_SECRET=your_generated_secret
```

3. Update webhook controller to verify the secret (implementation needed)

## Step 3: Test the Integration

### 3.1 Local Testing with ngrok

If testing locally, expose your API with ngrok:

```bash
# Start your NestJS API
cd packages/api-nest
npm run start:dev

# In another terminal, start ngrok
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update Postmark webhook URL to: https://abc123.ngrok.io/webhooks/postmark/inbound
```

### 3.2 Send Test Email

1. Create a newsletter subscription in Omnivore UI
2. Copy the generated email address (e.g., `abc123xyz@inbox.omnivore.app`)
3. Send a test email to that address from Gmail/Outlook/etc.
4. Monitor logs:

```bash
# Watch API logs
npm run start:dev

# You should see:
# [WebhookController] Received inbound email from sender@gmail.com to abc123xyz@inbox.omnivore.app
# [WebhookController] Queued email processing job 12345 for sender@gmail.com
# [EmailProcessorService] Processing SAVE_NEWSLETTER job 12345
```

### 3.3 Verify in Database

```sql
-- Check that subscription was updated
SELECT id, source_identifier, email_alias, title
FROM omnivore.subscription
WHERE email_alias = 'abc123xyz';

-- Check that library item was created
SELECT id, title, item_type, subscription_id
FROM omnivore.library_item
WHERE subscription_id = (
  SELECT id FROM omnivore.subscription WHERE email_alias = 'abc123xyz'
);
```

## Step 4: Monitor and Debug

### 4.1 Postmark Activity Log

View all inbound emails in Postmark dashboard:

1. Go to **Activity** → **Inbound**
2. See delivery status, webhook responses, errors

### 4.2 Common Issues

**Issue: Emails not arriving**

- Check MX records: `dig inbox.omnivore.app MX`
- Verify domain status in Postmark (should be "Active")
- Check spam folder in case emails are bouncing

**Issue: Webhook returns 404/500**

- Verify webhook URL is correct
- Check API is running and accessible
- Review API logs for errors

**Issue: Emails received but not processed**

- Check that subscription with matching `email_alias` exists
- Review EmailProcessorService logs
- Check Redis queue is running: `redis-cli ping`

**Issue: Invalid email alias**

- Ensure email alias matches pattern: `[a-z0-9]{8}@inbox.omnivore.app`
- Verify subscription exists and is active

### 4.3 Useful Logs

```bash
# Tail webhook controller logs
grep "WebhookController" logs/api.log

# Tail email processor logs
grep "EmailProcessorService" logs/api.log

# Check queue status
redis-cli
> KEYS omnivore:queue:*
> LLEN omnivore:queue:EMAIL_PROCESSING
```

## Step 5: Production Deployment

### 5.1 Environment Variables

Add to production `.env`:

```bash
# Postmark (optional - for sending emails)
POSTMARK_API_KEY=your_postmark_api_key

# Inbound email domain
INBOUND_EMAIL_DOMAIN=inbox.omnivore.app

# Webhook secret (optional but recommended)
POSTMARK_WEBHOOK_SECRET=your_secret_token
```

### 5.2 Security Considerations

1. **Rate Limiting**: Add rate limiting to webhook endpoint
2. **Webhook Verification**: Verify requests are from Postmark
3. **Email Validation**: Validate email content and headers
4. **Spam Prevention**: Implement spam filtering
5. **Size Limits**: Limit attachment sizes

### 5.3 Monitoring

Set up monitoring for:

- Webhook endpoint availability (uptime monitoring)
- Email processing queue length
- Failed job count
- Email-to-library-item conversion rate

## Step 6: Scaling Considerations

### 6.1 Volume Expectations

- Free tier: 100 inbound emails/month
- Paid tiers: Unlimited inbound emails
- Consider costs if expecting high volume

### 6.2 Queue Configuration

Adjust queue concurrency in `queue.module.ts`:

```typescript
@Processor(QUEUE_NAMES.EMAIL_PROCESSING, {
  concurrency: 5, // Increase for higher throughput
})
```

### 6.3 Redis Scaling

For high volume, consider:

- Redis cluster for queue persistence
- Separate Redis instance for queues
- Queue monitoring and alerting

## Troubleshooting

### Test Webhook Manually

```bash
# Send test POST request to webhook
curl -X POST https://api.omnivore.app/webhooks/postmark/inbound \
  -H "Content-Type: application/json" \
  -d @test-payload.json
```

**test-payload.json:**

```json
{
  "From": "sender@newsletter.com",
  "FromName": "Newsletter Sender",
  "FromFull": {
    "Email": "sender@newsletter.com",
    "Name": "Newsletter Sender"
  },
  "To": "abc123xyz@inbox.omnivore.app",
  "ToFull": [
    {
      "Email": "abc123xyz@inbox.omnivore.app",
      "Name": "",
      "MailboxHash": "abc123xyz"
    }
  ],
  "Subject": "Test Newsletter Issue #1",
  "TextBody": "This is the plain text version of the newsletter.",
  "HtmlBody": "<html><body><h1>Test Newsletter</h1><p>This is the HTML version.</p></body></html>",
  "MessageID": "test-message-id-12345",
  "Date": "2025-01-15T10:30:00Z"
}
```

## Support

For issues:

1. Check Postmark documentation: https://postmarkapp.com/support/article/800-ips-for-firewalls
2. Review EmailProcessorService code for processing logic
3. Check queue logs for job failures

## Next Steps

After Postmark is configured:

1. Test end-to-end flow with real newsletters
2. Monitor email delivery and processing rates
3. Implement error handling and retry logic
4. Set up alerting for failed jobs
5. Consider implementing email parsing improvements
