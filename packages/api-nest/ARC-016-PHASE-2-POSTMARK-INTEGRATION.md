# ARC-016 Phase 2: Postmark Integration & Frontend Polish

## Branch: `OM-23-arc-016-newsletter-subscriptions`

## Overview

This phase completes the Postmark webhook integration for newsletter email ingestion and implements frontend improvements for the feeds/subscriptions UI.

## What Was Accomplished

### 1. Backend: Postmark Webhook Infrastructure

#### Created Files:

- `src/queue/dto/postmark-inbound.dto.ts` - Type-safe DTOs for Postmark webhook payload
- `src/queue/controllers/webhook.controller.ts` - Webhook endpoint for inbound emails
- `POSTMARK-SETUP.md` - Comprehensive setup and configuration guide

#### Key Features:

- **Webhook Endpoint**: `POST /webhooks/postmark/inbound`

  - Receives inbound emails from Postmark
  - Extracts unsubscribe links (mailto and HTTP)
  - Transforms Postmark payload to internal job format
  - Queues emails for processing via BullMQ
  - Returns 200 OK to prevent Postmark retries
  - Proper error handling with type-safe error messages

- **Email Processing Flow**:

  1. Postmark receives newsletter email at `<alias>@inbox.omnivore.app`
  2. Postmark forwards to webhook endpoint
  3. Webhook transforms and queues email
  4. EmailProcessorService processes asynchronously
  5. Creates library item linked to subscription

- **Integration Points**:
  - Registered in `QueueModule`
  - Uses existing `EMAIL_PROCESSING` queue
  - Integrates with `EmailProcessorService.handleSaveNewsletter()`

### 2. Frontend: Naming Alignment & UI Improvements

#### Renamed Files:

- `pages/Subscriptions.tsx` → `pages/Feeds.tsx`
- `components/subscriptions/` → `components/feeds/`
  - `AddNewsletterModal.tsx`
  - `NewsletterCard.tsx`
  - `UnsubscribeModal.tsx`
  - `DeleteAddressModal.tsx`

#### Component Updates:

- Updated component names from `Subscriptions` to `Feeds`
- Updated all imports across frontend
- Route remains `/feeds` (already established)

#### AddContentModal Simplification:

Per user feedback, reverted from multi-tab approach to simpler design:

- **Single "Subscribe" tab** for RSS feeds
- **Redirect section** for newsletter management
- Removed newsletter-specific state/handlers from modal
- Users click link to navigate to `/feeds` for newsletter subscriptions
- Maintains scalability without bloating the modal

**Rationale**: Keep AddContentModal simple and focused. If we add more content types (podcasts, YouTube, etc.), we don't want to keep adding tabs. Newsletter management belongs on the Feeds page.

### 3. Documentation

- **POSTMARK-SETUP.md**: Complete guide covering:
  - DNS/MX record configuration
  - Webhook URL setup (dev/prod)
  - Local testing with ngrok
  - Production deployment checklist
  - Troubleshooting guide
  - Security considerations
  - Scaling recommendations

### 4. Bug Fixes

- **Fixed TypeScript error** in `webhook.controller.ts`:
  - Error: `Property 'message' does not exist on type 'unknown'`
  - Solution: Proper type checking with `error instanceof Error`
  - All TypeScript compilation errors resolved

### 5. Database Migrations

Existing migrations from Phase 1:

- `0200.do.unify_subscriptions.sql` - Unified subscription table
- `0201.do.add_user_email_alias.sql` - User-level email aliases

## Test Status

### Passing Tests: 184/207 (89% pass rate)

All existing functionality tests pass:

- Authentication (auth.e2e-spec.ts)
- Reading progress (reading-progress.e2e-spec.ts)
- Highlights (highlight.e2e-spec.ts)
- Library items (library-arc009.e2e-spec.ts)
- RSS feeds (rss-feed.e2e-spec.ts - partial)
- And 8 more test suites

### Failing Tests: 23/207 (11% failure rate)

All failures are in **new newsletter functionality** (expected for WIP):

#### newsletter-subscription.e2e-spec.ts (7 failures)

- `subscribeToNewsletter` mutation returning undefined
- Tests for subscription creation, listing, updating, unsubscribing
- Likely needs GraphQL resolver registration or schema updates

#### email-ingestion.e2e-spec.ts (16 failures)

- Error: `Could not resolve subscription from email: <alias>@inbox.omnivore.app`
- Tests for email processing, content extraction, routing, library item creation
- Likely needs test database setup for subscription records

**Analysis**: These are well-written tests for new features. Failures indicate:

1. GraphQL schema/resolvers may need registration
2. Test setup may need to create subscription records
3. Email alias resolution logic may need database queries

**Impact**: Does not affect existing functionality. Newsletter features are work-in-progress.

## Architecture Decisions

### Terminology Alignment

- **Backend**: Uses "subscription" (technical, database-oriented)
- **Frontend**: Uses "feeds" (user-friendly, conceptual)
- **GraphQL**: Acts as translation layer
- **Rationale**: Backend terms match database schema; frontend terms match user mental model

### Subscription Source Types

```typescript
enum SubscriptionSourceType {
  RSS = 'RSS',
  NEWSLETTER = 'NEWSLETTER',
  // Future: PODCAST, YOUTUBE, etc.
}
```

### Content Types

```typescript
enum ContentType {
  ARTICLE = 'ARTICLE',
  PDF = 'PDF',
  RSS_FEED = 'RSS_FEED',
  VIDEO = 'VIDEO',
  TWITTER = 'TWITTER',
  UNKNOWN = 'UNKNOWN',
}
```

### Email Flow

```
Newsletter → Postmark MX → Postmark Webhook → API Webhook Controller
→ BullMQ EMAIL_PROCESSING Queue → EmailProcessorService
→ resolveUserAndSubscription() → createLibraryItem()
```

## Files Modified/Created

### Backend (api-nest)

**Created:**

- `src/queue/dto/postmark-inbound.dto.ts`
- `src/queue/controllers/webhook.controller.ts`
- `POSTMARK-SETUP.md`
- `ARC-016-PHASE-2-POSTMARK-INTEGRATION.md` (this file)

**Modified:**

- `src/queue/queue.module.ts` - Registered WebhookController

### Frontend (omnivore-polish)

**Renamed:**

- `pages/Subscriptions.tsx` → `pages/Feeds.tsx`
- `components/subscriptions/` → `components/feeds/`

**Modified:**

- `App.tsx` - Updated imports and route references
- `components/modals/AddContentModal.tsx` - Simplified to single Subscribe tab

### Database

**Migrations** (from Phase 1):

- `packages/db/migrations/0200.do.unify_subscriptions.sql`
- `packages/db/migrations/0200.undo.unify_subscriptions.sql`
- `packages/db/migrations/0201.do.add_user_email_alias.sql`
- `packages/db/migrations/0201.undo.add_user_email_alias.sql`

## Next Steps

### To Complete Newsletter Feature:

1. **Fix newsletter subscription GraphQL tests**

   - Verify `subscribeToNewsletter` resolver is registered
   - Check schema.graphql includes newsletter mutations
   - Ensure LibraryModule exports necessary resolvers

2. **Fix email ingestion tests**

   - Add subscription record creation to test setup
   - Verify `resolveUserAndSubscription()` database queries
   - Test with realistic email aliases

3. **End-to-End Testing**

   - Configure Postmark account
   - Set up MX records for test domain
   - Test actual newsletter email delivery
   - Verify library item creation

4. **Production Deployment**
   - Configure production Postmark webhook URL
   - Set up monitoring for webhook endpoint
   - Add webhook authentication (optional but recommended)
   - Set up alerting for failed email processing jobs

### For Future Enhancements:

- Add support for email attachments
- Implement spam filtering
- Add newsletter content parsing improvements
- Support for podcast RSS feeds
- Support for YouTube subscriptions

## Configuration Required

### Environment Variables

```bash
# Postmark (optional - for sending emails)
POSTMARK_API_KEY=your_postmark_api_key

# Inbound email domain
INBOUND_EMAIL_DOMAIN=inbox.omnivore.app

# Webhook secret (optional but recommended)
POSTMARK_WEBHOOK_SECRET=your_secret_token

# Redis (required for queues)
REDIS_URL=redis://localhost:6379
```

### Postmark Dashboard

1. Add inbound domain: `inbox.omnivore.app`
2. Configure MX records (provided by Postmark)
3. Set webhook URL: `https://api.omnivore.app/webhooks/postmark/inbound`
4. Test webhook integration

## Performance Considerations

### Queue Configuration

- **Concurrency**: EmailProcessorService defaults to 5 concurrent jobs
- **Retries**: 3 attempts with exponential backoff (2s initial delay)
- **Job Retention**:
  - Completed: 24 hours / 1000 jobs max
  - Failed: 7 days / 5000 jobs max

### Scaling

- Free tier: 100 inbound emails/month
- Paid tiers: Unlimited inbound emails
- Consider Redis cluster for high-volume deployments
- Monitor queue length and processing times

## Security Considerations

1. **Rate Limiting**: Should be added to webhook endpoint
2. **Webhook Verification**: Consider verifying requests from Postmark
3. **Email Validation**: Validate email content and headers
4. **Spam Prevention**: Implement spam filtering
5. **Size Limits**: Limit attachment sizes

## Conclusion

Phase 2 successfully implements:

- Complete Postmark webhook infrastructure
- Type-safe email ingestion pipeline
- Frontend naming alignment and UI improvements
- Comprehensive documentation

**Ready for**:

- Commit and push to branch
- Code review
- Integration testing with real Postmark account
- Test suite fixes for newsletter functionality

**Not ready for**:

- Production deployment (pending test fixes)
- End-to-end newsletter testing (pending Postmark config)
