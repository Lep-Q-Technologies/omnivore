/**
 * Email Ingestion E2E Tests
 *
 * Tests the complete newsletter email processing pipeline:
 * 1. Job queuing from inbound-email-handler
 * 2. EmailProcessorService job processing
 * 3. Auto-subscription creation
 * 4. Content extraction and sanitization
 * 5. Library item creation
 */

import { INestApplication } from '@nestjs/common'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Job } from 'bullmq'
import request from 'supertest'
import { Repository } from 'typeorm'

import { LibraryItemEntity } from '../src/library/entities/library-item.entity'
import {
  SubscriptionEntity,
  SubscriptionSourceType,
} from '../src/library/entities/subscription.entity'
import { NewsletterSubscriptionService } from '../src/library/services/newsletter-subscription.service'
import {
  EmailProcessorService,
  SaveNewsletterJobData,
} from '../src/queue/processors/email-processor.service'
import { JOB_TYPES } from '../src/queue/queue.constants'
import { User } from '../src/user/entities/user.entity'
import { createE2EAppWithModule } from './helpers/create-e2e-app'

/**
 * Create a mock Job object for testing email processing
 */
function createMockEmailJob(
  data: SaveNewsletterJobData,
): Job<SaveNewsletterJobData> {
  const mockUpdateProgress = jest.fn()
  mockUpdateProgress.mockResolvedValue(null)

  return {
    id: `test-${Date.now()}`,
    name: JOB_TYPES.SAVE_NEWSLETTER,
    data,
    attemptsMade: 0,
    opts: { attempts: 1 },
    updateProgress: mockUpdateProgress,
  } as unknown as Job<SaveNewsletterJobData>
}

describe('Email Ingestion Pipeline (e2e)', () => {
  let app: INestApplication | null = null
  let userId = ''
  let libraryItemRepository: Repository<LibraryItemEntity> | null = null
  let subscriptionRepository: Repository<SubscriptionEntity> | null = null
  let userRepository: Repository<User> | null = null
  let emailProcessor: EmailProcessorService | null = null
  let newsletterService: NewsletterSubscriptionService | null = null

  beforeAll(async () => {
    // Set required environment variables
    process.env.GOOGLE_CLIENT_ID = 'test-client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
    process.env.JWT_SECRET = 'test-jwt-secret'

    const { app: testApp, moduleFixture } = await createE2EAppWithModule()
    app = testApp

    // Get repositories
    libraryItemRepository = moduleFixture.get<Repository<LibraryItemEntity>>(
      getRepositoryToken(LibraryItemEntity),
    )
    subscriptionRepository = moduleFixture.get<Repository<SubscriptionEntity>>(
      getRepositoryToken(SubscriptionEntity),
    )
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    )

    // Get services
    emailProcessor = moduleFixture.get<EmailProcessorService>(
      EmailProcessorService,
    )
    newsletterService = moduleFixture.get<NewsletterSubscriptionService>(
      NewsletterSubscriptionService,
    )

    if (
      !app ||
      !libraryItemRepository ||
      !subscriptionRepository ||
      !userRepository ||
      !emailProcessor ||
      !newsletterService
    ) {
      throw new Error('Failed to initialize test dependencies')
    }

    // Register test user
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v2/auth/register')
      .send({
        email: `email-test-${Date.now()}@omnivore.app`,
        name: 'Email Test User',
        password: 'emailPassword123',
      })
      .expect(201)

    userId = registerResponse.body.user.id

    // Verify user has email alias
    const user = await userRepository.findOne({ where: { id: userId } })
    expect(user).toBeDefined()
    expect(user?.emailAlias).toBeDefined()
  }, 120000) // Increased timeout for app initialization

  afterAll(async () => {
    if (app) {
      await app.close()
    }
  }, 30000)

  /**
   * Safely get library item repository
   */
  const getLibraryItemRepo = (): Repository<LibraryItemEntity> => {
    if (!libraryItemRepository) {
      throw new Error('Library item repository not initialized')
    }

    return libraryItemRepository
  }

  /**
   * Safely get subscription repository
   */
  const getSubscriptionRepo = (): Repository<SubscriptionEntity> => {
    if (!subscriptionRepository) {
      throw new Error('Subscription repository not initialized')
    }

    return subscriptionRepository
  }

  /**
   * Helper to process a newsletter email via the public process() method
   */
  const processNewsletterEmail = async (emailData: SaveNewsletterJobData) => {
    if (!emailProcessor) {
      throw new Error('Email processor not initialized')
    }
    const mockJob = createMockEmailJob(emailData)

    return emailProcessor.process(mockJob)
  }

  /**
   * Helper to create a subscription slot for testing
   */
  const createSubscriptionSlot = async (
    name: string,
  ): Promise<SubscriptionEntity> => {
    if (!newsletterService) {
      throw new Error('Newsletter service not initialized')
    }

    return newsletterService.createNewsletterSlot(userId, name)
  }

  describe('Basic Newsletter Email Processing', () => {
    it('should process a simple newsletter email', async () => {
      const subscription = await createSubscriptionSlot('Test Newsletter')
      const recipientEmail = `${subscription.emailAlias}@inbox.omnivore.app`
      const senderEmail = 'newsletter@example.com'

      const result = await processNewsletterEmail({
        from: `Newsletter Writer <${senderEmail}>`,
        to: recipientEmail,
        subject: 'Welcome to Our Newsletter!',
        html: '<h1>Welcome!</h1><p>This is our first newsletter issue.</p>',
        text: 'Welcome! This is our first newsletter issue.',
      })

      expect(result.success).toBe(true)
      expect(result.libraryItemId).toBeDefined()
      expect(result.subscriptionId).toBeDefined()

      const updatedSubscription = await getSubscriptionRepo().findOne({
        where: { id: result.subscriptionId },
      })
      expect(updatedSubscription).toBeDefined()
      expect(updatedSubscription?.sourceType).toBe(
        SubscriptionSourceType.NEWSLETTER,
      )
      expect(updatedSubscription?.sourceIdentifier).toBe(senderEmail)
      expect(updatedSubscription?.userId).toBe(userId)
      expect(updatedSubscription?.emailAlias).toHaveLength(8)
      expect(updatedSubscription?.active).toBe(true)

      const libraryItem = await getLibraryItemRepo().findOne({
        where: { id: result.libraryItemId },
      })
      expect(libraryItem).toBeDefined()
      expect(libraryItem?.userId).toBe(userId)
      expect(libraryItem?.subscriptionId).toBe(result.subscriptionId)
      expect(libraryItem?.title).toBe('Welcome!')
      expect(libraryItem?.readableContent).toBeTruthy()
      expect(libraryItem?.author).toBe('Newsletter Writer')
    })

    it('should extract metadata from email HTML', async () => {
      const subscription = await createSubscriptionSlot('Tech Updates')
      const recipientEmail = `${subscription.emailAlias}@inbox.omnivore.app`

      const result = await processNewsletterEmail({
        from: 'Tech Updates <tech@updates.io>',
        to: recipientEmail,
        subject: 'Latest Tech News',
        html: `
          <html>
            <head>
              <meta name="description" content="Your weekly tech digest">
              <link rel="icon" href="https://updates.io/favicon.ico">
            </head>
            <body>
              <h1>This Week in Tech</h1>
              <p>Here are the top stories this week...</p>
              <a href="https://updates.io/article1">Read more</a>
            </body>
          </html>
        `,
      })

      expect(result.success).toBe(true)

      const libraryItem = await getLibraryItemRepo().findOne({
        where: { id: result.libraryItemId },
      })
      expect(libraryItem).toBeDefined()
      expect(libraryItem?.title).toBe('This Week in Tech')
      expect(libraryItem?.description).toBe('Your weekly tech digest')
      expect(libraryItem?.siteIcon).toBe('https://updates.io/favicon.ico')
    })

    it('should handle plain text emails', async () => {
      const subscription = await createSubscriptionSlot('Plain Text Newsletter')
      const recipientEmail = `${subscription.emailAlias}@inbox.omnivore.app`

      const result = await processNewsletterEmail({
        from: 'simple@newsletter.com',
        to: recipientEmail,
        subject: 'Plain Text Newsletter',
        text: 'This is a plain text newsletter.\n\nNo HTML here!',
      })

      expect(result.success).toBe(true)

      const libraryItem = await getLibraryItemRepo().findOne({
        where: { id: result.libraryItemId },
      })
      expect(libraryItem).toBeDefined()
      expect(libraryItem?.readableContent).toContain('<pre>')
      expect(libraryItem?.readableContent).toContain('plain text newsletter')
      expect(libraryItem?.wordCount).toBeGreaterThan(0)
    })
  })

  describe('Auto-Subscription Creation', () => {
    it('should auto-create subscription on first email from new sender', async () => {
      const subscription = await createSubscriptionSlot('New Sender Newsletter')
      const recipientEmail = `${subscription.emailAlias}@inbox.omnivore.app`
      const senderEmail = `new-sender-${Date.now()}@substack.com`

      const existingSubscription = await getSubscriptionRepo().findOne({
        where: {
          userId,
          sourceType: SubscriptionSourceType.NEWSLETTER,
          sourceIdentifier: senderEmail,
        },
      })
      expect(existingSubscription).toBeNull()

      const result = await processNewsletterEmail({
        from: `New Writer <${senderEmail}>`,
        to: recipientEmail,
        subject: 'First Email',
        html: '<h1>Hello!</h1><p>This is my first email to you.</p>',
      })

      expect(result.success).toBe(true)

      const createdSubscription = await getSubscriptionRepo().findOne({
        where: {
          userId,
          sourceType: SubscriptionSourceType.NEWSLETTER,
          sourceIdentifier: senderEmail,
        },
      })
      expect(createdSubscription).toBeDefined()
      expect(createdSubscription?.title).toBe('Hello!')
      expect(createdSubscription?.itemCount).toBe(1)
    })

    it('should reuse existing subscription for subsequent emails', async () => {
      const subscription = await createSubscriptionSlot(
        'Repeat Sender Newsletter',
      )
      const recipientEmail = `${subscription.emailAlias}@inbox.omnivore.app`
      const senderEmail = `repeat-sender-${Date.now()}@newsletter.com`

      const result1 = await processNewsletterEmail({
        from: senderEmail,
        to: recipientEmail,
        subject: 'Email #1',
        html: '<p>First email</p>',
      })

      const subscription1Id = result1.subscriptionId

      const result2 = await processNewsletterEmail({
        from: senderEmail,
        to: recipientEmail,
        subject: 'Email #2',
        html: '<p>Second email</p>',
      })

      expect(result2.subscriptionId).toBe(subscription1Id)

      const updatedSubscription = await getSubscriptionRepo().findOne({
        where: { id: subscription1Id },
      })
      expect(updatedSubscription?.itemCount).toBe(2)
    })

    it('should store unsubscribe information', async () => {
      const subscription = await createSubscriptionSlot(
        'Unsubscribe Test Newsletter',
      )
      const recipientEmail = `${subscription.emailAlias}@inbox.omnivore.app`

      const result = await processNewsletterEmail({
        from: 'unsub-test@newsletter.com',
        to: recipientEmail,
        subject: 'Newsletter with Unsubscribe',
        html: '<p>Content here</p>',
        unsubMailTo: 'unsubscribe@newsletter.com',
        unsubHttpUrl: 'https://newsletter.com/unsubscribe?id=123',
      })

      const dbSubscription = await getSubscriptionRepo().findOne({
        where: { id: result.subscriptionId },
      })
      expect(dbSubscription?.unsubscribeMailTo).toBe(
        'unsubscribe@newsletter.com',
      )
      expect(dbSubscription?.unsubscribeHttpUrl).toBe(
        'https://newsletter.com/unsubscribe?id=123',
      )
    })
  })

  describe('Content Extraction and Sanitization', () => {
    it('should use Readability to extract article content', async () => {
      const subscription = await createSubscriptionSlot(
        'Readability Test Newsletter',
      )
      const recipientEmail = `${subscription.emailAlias}@inbox.omnivore.app`

      const result = await processNewsletterEmail({
        from: 'readability@test.com',
        to: recipientEmail,
        subject: 'Article Newsletter',
        html: `
          <html>
            <body>
              <header>Header junk</header>
              <nav>Navigation links</nav>
              <article>
                <h1>The Main Article</h1>
                <p>This is the actual content we care about.</p>
                <p>Multiple paragraphs of valuable information.</p>
              </article>
              <footer>Footer stuff</footer>
              <aside>Sidebar ads</aside>
            </body>
          </html>
        `,
      })

      const libraryItem = await getLibraryItemRepo().findOne({
        where: { id: result.libraryItemId },
      })
      expect(libraryItem?.readableContent).toContain('Main Article')
      expect(libraryItem?.readableContent).toContain('actual content')
      expect(libraryItem?.wordCount).toBeGreaterThan(5)
    })

    it('should sanitize HTML to prevent XSS', async () => {
      const subscription = await createSubscriptionSlot('XSS Test Newsletter')
      const recipientEmail = `${subscription.emailAlias}@inbox.omnivore.app`

      const result = await processNewsletterEmail({
        from: 'xss-test@test.com',
        to: recipientEmail,
        subject: 'XSS Test',
        html: `
          <html>
            <body>
              <article>
                <h1>Safe Content</h1>
                <p>Normal paragraph with safe content.</p>
                <p>This should be kept.</p>
                <script>alert('XSS')</script>
                <img src="valid.jpg" alt="Valid">
                <img src="x" onerror="alert('XSS')">
                <a href="https://safe.com">Safe link</a>
                <a href="javascript:alert('XSS')">Dangerous link</a>
              </article>
            </body>
          </html>
        `,
      })

      const libraryItem = await getLibraryItemRepo().findOne({
        where: { id: result.libraryItemId },
      })
      expect(libraryItem).toBeDefined()

      // Should NOT contain dangerous elements
      expect(libraryItem?.readableContent).not.toContain('<script>')
      expect(libraryItem?.readableContent).not.toContain('</script>')
      expect(libraryItem?.readableContent).not.toContain('javascript:')

      // Should contain safe content
      expect(libraryItem?.readableContent).toContain('Safe Content')
      expect(libraryItem?.readableContent).toContain('Normal paragraph')
      expect(libraryItem?.readableContent).toContain('safe.com')
    })

    it('should calculate word count correctly', async () => {
      const subscription = await createSubscriptionSlot(
        'Word Count Test Newsletter',
      )
      const recipientEmail = `${subscription.emailAlias}@inbox.omnivore.app`
      const content = 'Word '.repeat(100) // 100 words

      const result = await processNewsletterEmail({
        from: 'wordcount@test.com',
        to: recipientEmail,
        subject: 'Word Count Test',
        html: `<p>${content}</p>`,
      })

      const libraryItem = await getLibraryItemRepo().findOne({
        where: { id: result.libraryItemId },
      })
      expect(libraryItem?.wordCount).toBeGreaterThan(50)
      expect(libraryItem?.wordCount).toBeLessThan(150)
    })
  })

  describe('Newsletter Alias Email Routing', () => {
    it('should route emails to subscription-specific alias', async () => {
      const initialSubscription = await createSubscriptionSlot(
        'Specific Alias Newsletter',
      )
      const recipientEmail = `${initialSubscription.emailAlias}@inbox.omnivore.app`
      const senderEmail = 'specific-sender@test.com'

      const firstResult = await processNewsletterEmail({
        from: senderEmail,
        to: recipientEmail,
        subject: 'Setup Email',
        html: '<p>Setting up subscription</p>',
      })

      const subscription = await getSubscriptionRepo().findOne({
        where: { id: firstResult.subscriptionId },
      })
      expect(subscription?.emailAlias).toBeDefined()

      const subscriptionAlias = subscription?.emailAlias
      if (!subscriptionAlias) {
        throw new Error('Subscription alias not found')
      }

      const result = await processNewsletterEmail({
        from: senderEmail,
        to: `${subscriptionAlias}@inbox.omnivore.app`,
        subject: 'Email to Specific Alias +',
        html: '<p>Using subscription alias +</p>',
      })

      expect(result.success).toBe(true)
      expect(result.subscriptionId).toBe(firstResult.subscriptionId)

      const libraryItem = await getLibraryItemRepo().findOne({
        where: { id: result.libraryItemId },
      })
      expect(libraryItem?.subscriptionId).toBe(firstResult.subscriptionId)
    })

    it('should handle user-level email address', async () => {
      const subscription = await createSubscriptionSlot(
        'User Level Email Newsletter',
      )
      const recipientEmail = `${subscription.emailAlias}@inbox.omnivore.app`

      const result = await processNewsletterEmail({
        from: 'any-sender@test.com',
        to: recipientEmail,
        subject: 'To User Email',
        html: '<p>Sent to user email</p>',
      })

      expect(result.success).toBe(true)

      const libraryItem = await getLibraryItemRepo().findOne({
        where: { id: result.libraryItemId },
      })
      expect(libraryItem?.userId).toBe(userId)
    })
  })

  describe('Library Item Creation', () => {
    it('should create library item with correct fields', async () => {
      const subscription = await createSubscriptionSlot('Complete Newsletter')
      const recipientEmail = `${subscription.emailAlias}@inbox.omnivore.app`

      const result = await processNewsletterEmail({
        from: 'Full Test <fulltest@newsletter.com>',
        to: recipientEmail,
        subject: 'Complete Newsletter',
        html: `
          <article>
            <h1>Newsletter Title</h1>
            <p>Newsletter description goes here.</p>
            <img src="https://example.com/image.jpg" alt="Cover">
            <p>Main content paragraph 1.</p>
            <p>Main content paragraph 2.</p>
          </article>
        `,
      })

      const item = await getLibraryItemRepo().findOne({
        where: { id: result.libraryItemId },
      })
      expect(item).toBeDefined()
      expect(item?.title).toBe('Newsletter Title')
      expect(item?.state).toBe('SUCCEEDED')
      expect(item?.contentType).toBe('ARTICLE')
      expect(item?.author).toBe('Full Test')
      expect(item?.originalUrl).toContain('mailto:fulltest@newsletter.com')
      expect(item?.readableContent).toBeTruthy()
      expect(item?.savedAt).toBeInstanceOf(Date)
      expect(item?.publishedAt).toBeInstanceOf(Date)
      expect(item?.slug).toBeTruthy()
      expect(item?.slug).toContain('newsletter-title')
      expect(item?.contentHash).toBeTruthy()
      expect(item?.contentHash).toHaveLength(64) // SHA-256 hex
    })

    it('should generate unique slugs for items with same title', async () => {
      const subscription = await createSubscriptionSlot('Same Title Newsletter')
      const recipientEmail = `${subscription.emailAlias}@inbox.omnivore.app`
      const senderEmail = 'slug-test@test.com'

      const result1 = await processNewsletterEmail({
        from: senderEmail,
        to: recipientEmail,
        subject: 'Same Title',
        html: '<p>First email</p>',
      })

      // Wait to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10))

      const result2 = await processNewsletterEmail({
        from: senderEmail,
        to: recipientEmail,
        subject: 'Same Title',
        html: '<p>Second email</p>',
      })

      const item1 = await getLibraryItemRepo().findOne({
        where: { id: result1.libraryItemId },
      })
      const item2 = await getLibraryItemRepo().findOne({
        where: { id: result2.libraryItemId },
      })

      // Slugs should be unique due to timestamp
      expect(item1?.slug).not.toBe(item2?.slug)
      expect(item1?.slug).toContain('same-title')
      expect(item2?.slug).toContain('same-title')
    })
  })

  describe('Error Handling', () => {
    it('should fail gracefully with invalid recipient email', async () => {
      await expect(
        processNewsletterEmail({
          from: 'sender@test.com',
          to: 'invalid-user@inbox.omnivore.app',
          subject: 'Test',
          html: '<p>Test</p>',
        }),
      ).rejects.toThrow('Could not resolve user')
    })

    it('should handle emails with no content', async () => {
      const subscription = await createSubscriptionSlot(
        'Empty Email Newsletter',
      )
      const recipientEmail = `${subscription.emailAlias}@inbox.omnivore.app`

      const result = await processNewsletterEmail({
        from: 'empty@test.com',
        to: recipientEmail,
        subject: 'Empty Email',
        // No html or text
      })

      expect(result.success).toBe(true)

      const item = await getLibraryItemRepo().findOne({
        where: { id: result.libraryItemId },
      })
      expect(item?.readableContent).toBe('<p>No content</p>')
      expect(item?.wordCount).toBe(0)
    })
  })

  describe('Subscription Stats Tracking', () => {
    it('should update subscription itemCount and lastFetchedAt', async () => {
      const subscription = await createSubscriptionSlot('Stats Test Newsletter')
      const recipientEmail = `${subscription.emailAlias}@inbox.omnivore.app`
      const senderEmail = `stats-test-${Date.now()}@test.com`

      const result1 = await processNewsletterEmail({
        from: senderEmail,
        to: recipientEmail,
        subject: 'Email 1',
        html: '<p>First</p>',
      })

      let updatedSubscription = await getSubscriptionRepo().findOne({
        where: { id: result1.subscriptionId },
      })
      expect(updatedSubscription?.itemCount).toBe(1)
      const firstFetchedAt = updatedSubscription?.lastFetchedAt

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100))

      await processNewsletterEmail({
        from: senderEmail,
        to: recipientEmail,
        subject: 'Email 2',
        html: '<p>Second</p>',
      })

      updatedSubscription = await getSubscriptionRepo().findOne({
        where: { id: result1.subscriptionId },
      })
      expect(updatedSubscription?.itemCount).toBe(2)
      expect(updatedSubscription?.lastFetchedAt?.getTime()).toBeGreaterThan(
        firstFetchedAt?.getTime() ?? 0,
      )
    })
  })
})
