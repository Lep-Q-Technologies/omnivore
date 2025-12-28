# Newsletter Subscription Lifecycle Analysis

## Current Mutations (from resolver)

1. **createNewsletterSubscription(name: String!)** - Line 82
   - Creates a pending subscription slot
   - Returns unique email address for the subscription

2. **subscribeToNewsletter(senderEmail: String!, title: String)** - Line 137
   - **SECURITY ISSUE**: This bypasses the slot creation flow
   - Allows direct subscription by sender email
   - Should be removed or restricted

3. **unsubscribeFromNewsletter(subscriptionId: ID!, deleteItems: Boolean)** - Line 198
   - Unsubscribes from newsletter
   - Optionally deletes library items

4. **updateNewsletterSettings(subscriptionId: ID!, settings: UpdateNewsletterSubscriptionInput!)** - Line 239
   - Updates subscription settings (title, folder, labels)

## Security Issue: Current Email Routing

### Current Implementation (INSECURE)
The `resolveUserAndSubscription()` method in email-processor.service.ts:344-429 accepts:

1. **Subscription-specific**: `randomalias@inbox.omnivore.app` ✅ SECURE
2. **User-level**: `useralias@inbox.omnivore.app` ❌ INSECURE
3. **User+subscription**: `useralias+subalias@inbox.omnivore.app` ❌ UNNECESSARY

Problems:
- **Lines 384-423**: Auto-creates subscriptions when email sent to user's general address
- **Line 353**: Supports `user+subscription@` format
- Enables email enumeration attacks
- Allows unsolicited newsletters to create subscriptions

### Secure Implementation (Required)

**ONLY accept**: `subscription-specific-alias@inbox.omnivore.app`

- Each subscription gets a unique, random alias
- No way to derive user information from the alias
- No auto-creation - users MUST create slots via UI first

## Proper Subscription Lifecycle

### 1. Create Subscription Slot (UI-initiated)
```graphql
mutation CreateNewsletterSlot {
  createNewsletterSubscription(name: "Morning Brew") {
    success
    message
    subscription {
      id
      emailAlias          # "abc123xyz"
      newsletterEmail     # "abc123xyz@inbox.omnivore.app"
      title
    }
  }
}
```

**Flow:**
- User clicks "Add Newsletter" in UI
- System generates random 8-char alias
- Creates pending subscription with `source_identifier = "pending:{alias}"`
- Returns unique email for user to subscribe with

### 2. User Subscribes to Newsletter (External)
- User copies `abc123xyz@inbox.omnivore.app`
- Subscribes to newsletter on external site (e.g., substack.com)
- Newsletter sends confirmation email (handled separately)

### 3. First Newsletter Arrives (Email Processor)
```typescript
// email-processor.service.ts:144-176
1. Receive email to: abc123xyz@inbox.omnivore.app
2. Look up subscription by emailAlias
3. If subscription.sourceIdentifier.startsWith('pending:'):
   - Update with actual sender email
   - Update metadata (title, description, etc.)
   - Subscription becomes active
4. Create library item from email content
```

### 4. Subsequent Newsletters (Email Processor)
```typescript
1. Receive email to: abc123xyz@inbox.omnivore.app
2. Look up subscription by emailAlias
3. Verify sender matches subscription.sourceIdentifier
4. Create library item from email content
5. Update subscription stats (itemCount, lastFetchedAt)
```

### 5. Update Settings (User-initiated)
```graphql
mutation UpdateNewsletterSettings {
  updateNewsletterSettings(
    subscriptionId: "uuid"
    settings: {
      title: "Updated Title"
      folder: "Tech"
      autoAddLabels: ["newsletter", "tech"]
    }
  ) {
    success
    subscription { ... }
  }
}
```

### 6. Unsubscribe (User-initiated)

**Option A: Soft Unsubscribe (keep items)**
```graphql
mutation UnsubscribeKeepItems {
  unsubscribeFromNewsletter(
    subscriptionId: "uuid"
    deleteItems: false
  ) {
    success
    message  # "Unsubscribed (items preserved)"
  }
}
```
- Sets subscription.active = false
- Keeps library items
- Future emails to this alias are rejected

**Option B: Hard Unsubscribe (delete subscription + items)**
```graphql
mutation UnsubscribeDeleteAll {
  unsubscribeFromNewsletter(
    subscriptionId: "uuid"
    deleteItems: true
  ) {
    success
    message  # "Unsubscribed and deleted items"
  }
}
```
- Deletes all library items from this subscription
- Deletes the subscription record
- Email alias becomes available for reuse

## Required Changes

### 1. Remove Security Vulnerabilities
**File**: `src/queue/processors/email-processor.service.ts`

```typescript
// REMOVE lines 384-423 (auto-creation logic)
// REMOVE line 353 (user+subscription format support)
// KEEP ONLY subscription-specific alias lookup
```

### 2. Remove Insecure Mutation
**File**: `src/library/resolvers/newsletter-subscription.resolver.ts`

```typescript
// Line 137-193: Remove subscribeToNewsletter mutation
// This bypasses the secure slot creation flow
```

**File**: `schema.graphql`
```graphql
# Remove this mutation (lines 350-356)
subscribeToNewsletter(
  senderEmail: String!
  title: String
): NewsletterSubscriptionResult!
```

### 3. Update Tests
**File**: `test/email-ingestion.e2e-spec.ts`

Tests must:
1. Create subscription slot FIRST via `createNewsletterSubscription`
2. Use the returned emailAlias to send test emails
3. Remove tests that send to user-level addresses

### 4. Update Newsletter Subscription Tests
**File**: `test/newsletter-subscription.e2e-spec.ts`

- Remove `subscribeToNewsletter` mutation tests (lines 158-214)
- Focus on `createNewsletterSubscription` flow
- Test proper lifecycle: create → email arrives → update → unsubscribe

## Frontend Integration Points

### Mutations Needed by Frontend
1. ✅ `createNewsletterSubscription(name)` - Create slot
2. ✅ `unsubscribeFromNewsletter(id, deleteItems)` - Unsubscribe
3. ✅ `updateNewsletterSettings(id, settings)` - Update settings
4. ❌ `subscribeToNewsletter(senderEmail, title)` - REMOVE (security risk)

### Queries Needed by Frontend
1. ✅ `newsletterEmail` - Get user's newsletter address (for display)
2. ✅ `newsletterSubscriptions(activeOnly)` - List all subscriptions

### Field Resolvers
1. ✅ `newsletterEmail` - Computed from emailAlias
2. ✅ `unreadCount` - Computed from library items

## Summary

**Secure Model:**
- Users create slots → get unique emails → subscribe externally
- Only subscription-specific aliases accepted
- No auto-creation of subscriptions from incoming emails
- Clear unsubscribe options (soft vs hard delete)

**Frontend Flow:**
1. User: "Add Newsletter" → calls `createNewsletterSubscription(name)`
2. UI: Shows `abc123xyz@inbox.omnivore.app` to copy
3. User: Subscribes on external site using that email
4. Backend: First email arrives → updates pending subscription
5. User: Manages via `updateNewsletterSettings` or `unsubscribeFromNewsletter`
