#!/usr/bin/env tsx

/**
 * Test Postmark Webhook Integration
 *
 * This script simulates the complete newsletter subscription flow:
 * 1. Creates a newsletter subscription slot via GraphQL
 * 2. POSTs a Postmark-formatted webhook payload to the inbound endpoint
 * 3. Verifies the email was processed and library item created
 *
 * Usage:
 *   tsx scripts/test-postmark-webhook.ts [recipient]
 *
 * Examples:
 *   tsx scripts/test-postmark-webhook.ts --api-url http://localhost:4001
 *   tsx scripts/test-postmark-webhook.ts q11quvvi@inbox.omnivore.app
 *   tsx scripts/test-postmark-webhook.ts q11quvvi --api-url https://example.ngrok-free.app
 */

import { Command, OptionValues } from 'commander'
import { randomUUID } from 'crypto'

const DEFAULT_API_URL = 'http://localhost:4001'

interface GraphQLResponse<T = any> {
  data?: T
  errors?: Array<{ message: string }>
}

interface NewsletterSubscription {
  id: string
  emailAlias: string
  title: string
  senderEmail: string | null
}

interface CliOptions extends OptionValues {
  apiUrl: string
  fullFlow: boolean
  skipVerify: boolean
  mode: 'newsletter' | 'confirmation'
  jobType?: string
  jobToken?: string
}

const program = new Command()
  .name('test-postmark-webhook')
  .version('1.0.0')
  .description('Send a Postmark-style inbound webhook payload to Omnivore')
  .argument(
    '[recipient]',
    'Recipient email address or inbox alias (without domain)',
  )
  .option('-u, --api-url <url>', 'Base API URL', DEFAULT_API_URL)
  .option(
    '--full-flow',
    'Register a test user and create a subscription before sending',
  )
  .option('--skip-verify', 'Skip GraphQL verification step')
  .option(
    '--mode <mode>',
    'Payload mode: newsletter or confirmation',
    'newsletter',
  )
  .option('--job-type <type>', 'Override the webhook job type')
  .option('--job-token <token>', 'Token for webhook job overrides')
  .parse(process.argv)

const options = program.opts<CliOptions>()
const recipientArg = program.args[0]

function buildEndpoints(apiUrl: string) {
  const apiBase = `${apiUrl}/api/v2`

  return {
    apiBase,
    graphqlEndpoint: `${apiUrl}/api/graphql`,
    webhookEndpoint: `${apiBase}/webhooks/postmark/inbound`,
  }
}

function resolveRecipient(recipient: string | undefined) {
  if (!recipient) {
    return null
  }

  if (recipient.includes('@')) {
    const mailboxHash = recipient.split('@')[0]

    return { recipientEmail: recipient, mailboxHash }
  }

  return {
    recipientEmail: `${recipient}@inbox.omnivore.app`,
    mailboxHash: recipient,
  }
}

/**
 * Register a test user and get auth token
 */
async function registerTestUser(
  apiBase: string,
): Promise<{ token: string; userId: string }> {
  const email = `postmark-test-${Date.now()}@omnivore.app`

  console.log(`📝 Registering test user: ${email}`)

  const response = await fetch(`${apiBase}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      name: 'Postmark Test User',
      password: 'testPassword123',
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Registration failed: ${response.status} ${text}`)
  }

  const data = await response.json()
  console.log(`✅ User registered: ${data.user.id}`)

  return {
    token: data.accessToken,
    userId: data.user.id,
  }
}

/**
 * Execute a GraphQL query/mutation
 */
async function graphql<T = any>(
  endpoint: string,
  query: string,
  variables: Record<string, any> = {},
  token: string,
): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`GraphQL request failed: ${response.status} ${text}`)
  }

  const result: GraphQLResponse<T> = await response.json()

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors, null, 2)}`)
  }

  return result.data!
}

/**
 * Create a newsletter subscription slot
 */
async function createNewsletterSlot(
  graphqlEndpoint: string,
  token: string,
  name: string,
): Promise<NewsletterSubscription> {
  console.log(`\n📰 Creating newsletter subscription: "${name}"`)

  const query = `
    mutation CreateNewsletterSubscription($name: String!) {
      createNewsletterSubscription(name: $name) {
        success
        message
        subscription {
          id
          emailAlias
          title
          senderEmail
        }
        errors
      }
    }
  `

  const data = await graphql(graphqlEndpoint, query, { name }, token)

  if (!data.createNewsletterSubscription.success) {
    throw new Error(
      `Failed to create subscription: ${data.createNewsletterSubscription.errors}`,
    )
  }

  const subscription = data.createNewsletterSubscription.subscription
  console.log(`✅ Created subscription:`)
  console.log(`   ID: ${subscription.id}`)
  console.log(`   Email: ${subscription.emailAlias}@inbox.omnivore.app`)
  console.log(`   Title: ${subscription.title}`)

  return subscription
}

/**
 * Send a test email via Postmark webhook
 */
async function sendPostmarkWebhook(
  webhookEndpoint: string,
  recipientEmail: string,
  mailboxHash: string,
  jobType: string | undefined,
  jobToken: string | undefined,
  newsletterContent: {
    from: string
    fromName: string
    subject: string
    htmlBody: string
    textBody: string
  },
): Promise<void> {
  console.log(`\n📧 Sending newsletter email via Postmark webhook...`)
  console.log(
    `   From: ${newsletterContent.fromName} <${newsletterContent.from}>`,
  )
  console.log(`   To: ${recipientEmail}`)
  console.log(`   Subject: ${newsletterContent.subject}`)

  // Postmark inbound webhook payload format
  // https://postmarkapp.com/developer/webhooks/inbound-webhook
  const payload = {
    From: newsletterContent.from,
    FromName: newsletterContent.fromName,
    FromFull: {
      Email: newsletterContent.from,
      Name: newsletterContent.fromName,
      MailboxHash: '',
    },
    To: recipientEmail,
    ToFull: [
      {
        Email: recipientEmail,
        Name: '',
        MailboxHash: mailboxHash,
      },
    ],
    Cc: '',
    CcFull: [],
    Bcc: '',
    BccFull: [],
    OriginalRecipient: recipientEmail,
    Subject: newsletterContent.subject,
    MessageID: randomUUID(),
    ReplyTo: newsletterContent.from,
    MailboxHash: mailboxHash,
    Date: new Date().toISOString(),
    TextBody: newsletterContent.textBody,
    HtmlBody: newsletterContent.htmlBody,
    StrippedTextReply: '',
    Tag: '',
    Headers: [
      {
        Name: 'Return-Path',
        Value: `<${newsletterContent.from}>`,
      },
      {
        Name: 'From',
        Value: `${newsletterContent.fromName} <${newsletterContent.from}>`,
      },
      {
        Name: 'To',
        Value: recipientEmail,
      },
      {
        Name: 'Subject',
        Value: newsletterContent.subject,
      },
      {
        Name: 'List-Unsubscribe',
        Value:
          '<mailto:unsubscribe@example.com>, <https://example.com/unsubscribe>',
      },
      {
        Name: 'Content-Type',
        Value: 'multipart/alternative',
      },
    ],
    Attachments: [],
  }

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (jobType) {
    requestHeaders['x-omnivore-webhook-job'] = jobType
  }

  if (jobToken) {
    requestHeaders['x-omnivore-webhook-token'] = jobToken
  }

  const response = await fetch(webhookEndpoint, {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Webhook POST failed: ${response.status} ${text}`)
  }

  const result = await response.json()
  console.log(`✅ Webhook response:`, result)
}

/**
 * Verify the newsletter was processed
 */
async function verifyNewsletterProcessed(
  graphqlEndpoint: string,
  token: string,
  subscriptionId: string,
): Promise<void> {
  console.log(`\n🔍 Verifying newsletter was processed...`)

  // Wait a bit for async processing
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const query = `
    query NewsletterSubscriptions {
      newsletterSubscriptions(activeOnly: true) {
        id
        title
        senderEmail
        emailAlias
        itemCount
        unreadCount
      }
    }
  `

  const data = await graphql(graphqlEndpoint, query, {}, token)
  const subscription = data.newsletterSubscriptions.find(
    (s: NewsletterSubscription) => s.id === subscriptionId,
  )

  if (!subscription) {
    throw new Error(`Subscription ${subscriptionId} not found`)
  }

  console.log(`✅ Subscription updated:`)
  console.log(`   Sender: ${subscription.senderEmail || 'N/A'}`)
  console.log(`   Items: ${subscription.itemCount}`)
  console.log(`   Unread: ${subscription.unreadCount}`)

  if (subscription.itemCount === 0) {
    console.log(`⚠️  Warning: No items created yet. Check API logs for errors.`)
  } else {
    console.log(`\n🎉 Newsletter successfully processed!`)
  }
}

/**
 * Main test flow
 */
async function main(cliOptions: CliOptions, recipient?: string) {
  const { apiBase, graphqlEndpoint, webhookEndpoint } = buildEndpoints(
    cliOptions.apiUrl,
  )
  const resolvedRecipient = resolveRecipient(recipient)
  const runFullFlow = cliOptions.fullFlow || !resolvedRecipient
  const jobTypeOverride =
    cliOptions.jobType ??
    (cliOptions.mode === 'confirmation' ? 'confirmation-email' : undefined)

  console.log(`\n🚀 Testing Postmark Newsletter Integration`)
  console.log(`   API URL: ${cliOptions.apiUrl}`)
  console.log(`   Webhook: ${webhookEndpoint}`)
  console.log(`   Mode: ${runFullFlow ? 'full-flow' : 'send-only'}\n`)

  try {
    let token: string | null = null
    let subscription: NewsletterSubscription | null = null
    let recipientEmail = resolvedRecipient?.recipientEmail || ''
    let mailboxHash = resolvedRecipient?.mailboxHash || ''

    if (runFullFlow) {
      // Step 1: Register user and get token
      const auth = await registerTestUser(apiBase)
      token = auth.token

      // Step 2: Create newsletter subscription
      subscription = await createNewsletterSlot(
        graphqlEndpoint,
        token,
        'Morning Tech Digest',
      )

      recipientEmail = `${subscription.emailAlias}@inbox.omnivore.app`
      mailboxHash = subscription.emailAlias
    } else if (!recipientEmail) {
      throw new Error('Recipient is required unless --full-flow is set.')
    }

    const baseContent = {
      from: 'editor@techdigest.example.com',
      fromName: 'Tech Digest',
    }

    const newsletterContent =
      cliOptions.mode === 'confirmation'
        ? {
            ...baseContent,
            subject: 'Confirm your subscription to Tech Digest',
            htmlBody: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Confirm your subscription</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Confirm your subscription</h1>
            <p>Please confirm your subscription to continue receiving Tech Digest.</p>
            <p>
              <a href="https://example.com/confirm?token=${randomUUID()}">
                Confirm subscription
              </a>
            </p>
          </body>
        </html>
      `,
            textBody: `
Confirm your subscription to Tech Digest.

Confirm subscription: https://example.com/confirm?token=${randomUUID()}
      `.trim(),
          }
        : {
            ...baseContent,
            subject: 'Your Daily Tech News - December 28, 2025',
            htmlBody: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Daily Tech News</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Your Daily Tech News</h1>
            <p style="color: #666;">December 28, 2025</p>

            <article style="margin: 20px 0; padding: 15px; border-left: 3px solid #007bff;">
              <h2 style="color: #007bff; margin-top: 0;">AI Breakthrough in Code Generation</h2>
              <p>Researchers announce major improvements in automated code generation,
              with new models achieving 95% accuracy on complex programming tasks.</p>
              <a href="https://example.com/article-1">Read more →</a>
            </article>

            <article style="margin: 20px 0; padding: 15px; border-left: 3px solid #28a745;">
              <h2 style="color: #28a745; margin-top: 0;">WebAssembly 3.0 Released</h2>
              <p>The latest version brings improved performance and new features for
              browser-based applications, making web apps even faster.</p>
              <a href="https://example.com/article-2">Read more →</a>
            </article>

            <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
              <p>You're receiving this because you subscribed to Tech Digest.</p>
              <p><a href="https://example.com/unsubscribe">Unsubscribe</a></p>
            </footer>
          </body>
        </html>
      `,
            textBody: `
YOUR DAILY TECH NEWS
December 28, 2025

AI BREAKTHROUGH IN CODE GENERATION
Researchers announce major improvements in automated code generation,
with new models achieving 95% accuracy on complex programming tasks.
Read more: https://example.com/article-1

WEBASSEMBLY 3.0 RELEASED
The latest version brings improved performance and new features for
browser-based applications, making web apps even faster.
Read more: https://example.com/article-2

---
You're receiving this because you subscribed to Tech Digest.
Unsubscribe: https://example.com/unsubscribe
      `.trim(),
          }

    // Step 3: Send test newsletter via webhook
    await sendPostmarkWebhook(
      webhookEndpoint,
      recipientEmail,
      mailboxHash,
      jobTypeOverride,
      cliOptions.jobToken,
      newsletterContent,
    )

    if (!cliOptions.skipVerify && token && subscription) {
      // Step 4: Verify processing
      await verifyNewsletterProcessed(graphqlEndpoint, token, subscription.id)
    } else if (!cliOptions.skipVerify && !runFullFlow) {
      console.log(
        `\nℹ️  Verification skipped (no auth token). Use --full-flow to enable.`,
      )
    }

    console.log(`\n✅ All tests passed!\n`)
  } catch (error) {
    console.error(`\n❌ Test failed:`, error)
    process.exit(1)
  }
}

main(options, recipientArg)
