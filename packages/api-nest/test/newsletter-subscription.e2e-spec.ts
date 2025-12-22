import { INestApplication } from '@nestjs/common'
import request from 'supertest'

import { REPOSITORY_TOKENS } from '../src/repositories/injection-tokens'
import {
  ILibraryItemRepository,
  ISubscriptionRepository,
} from '../src/repositories/interfaces'
import { SubscriptionSourceType } from '../src/library/entities/subscription.entity'
import { createE2EAppWithModule } from './helpers/create-e2e-app'

const NEWSLETTER_EMAIL_QUERY = `
  query NewsletterEmail {
    newsletterEmail {
      newsletterEmail
      emailAlias
    }
  }
`

const NEWSLETTER_SUBSCRIPTIONS_QUERY = `
  query NewsletterSubscriptions($activeOnly: Boolean) {
    newsletterSubscriptions(activeOnly: $activeOnly) {
      id
      senderEmail
      emailAlias
      title
      itemCount
      active
      folder
      autoAddLabels
      unreadCount
    }
  }
`

const SUBSCRIBE_TO_NEWSLETTER_MUTATION = `
  mutation SubscribeToNewsletter($senderEmail: String!, $title: String) {
    subscribeToNewsletter(senderEmail: $senderEmail, title: $title) {
      success
      message
      subscription {
        id
        senderEmail
        emailAlias
        title
      }
      errors
    }
  }
`

const UNSUBSCRIBE_FROM_NEWSLETTER_MUTATION = `
  mutation UnsubscribeFromNewsletter($subscriptionId: ID!, $deleteItems: Boolean) {
    unsubscribeFromNewsletter(subscriptionId: $subscriptionId, deleteItems: $deleteItems) {
      success
      message
      errors
    }
  }
`

const UPDATE_NEWSLETTER_SETTINGS_MUTATION = `
  mutation UpdateNewsletterSettings($subscriptionId: ID!, $settings: UpdateNewsletterSubscriptionInput!) {
    updateNewsletterSettings(subscriptionId: $subscriptionId, settings: $settings) {
      success
      message
      subscription {
        id
        title
        folder
        autoAddLabels
      }
      errors
    }
  }
`

describe('Newsletter Subscription GraphQL (e2e)', () => {
  let app: INestApplication
  let authToken: string
  let userId: string
  let libraryRepository: ILibraryItemRepository
  let subscriptionRepository: ISubscriptionRepository

  beforeAll(async () => {
    // Set required environment variables for tests
    process.env.GOOGLE_CLIENT_ID = 'test-client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
    process.env.JWT_SECRET = 'test-jwt-secret'

    const { app: testApp, moduleFixture } = await createE2EAppWithModule()
    app = testApp

    libraryRepository = moduleFixture.get<ILibraryItemRepository>(
      REPOSITORY_TOKENS.ILibraryItemRepository,
    )

    subscriptionRepository = moduleFixture.get<ISubscriptionRepository>(
      REPOSITORY_TOKENS.ISubscriptionRepository,
    )

    // Register test user
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v2/auth/register')
      .send({
        email: `newsletter-test-${Date.now()}@omnivore.app`,
        name: 'Newsletter Test User',
        password: 'newsletterPassword123',
      })
      .expect(201)

    authToken = registerResponse.body.accessToken
    userId = registerResponse.body.user.id
  })

  afterAll(async () => {
    await app.close()
  }, 30000)

  const executeQuery = (
    query: string,
    variables: Record<string, unknown> = {},
  ) =>
    request(app.getHttpServer())
      .post('/api/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ query, variables })

  it('should return user newsletter email address', async () => {
    const response = await executeQuery(NEWSLETTER_EMAIL_QUERY)

    expect(response.status).toBe(200)

    // If there's an error or unexpected response, log it for debugging
    if (response.body.errors || !response.body.data?.newsletterEmail) {
      console.log('Full response:', JSON.stringify(response.body, null, 2))
    }

    expect(response.body.data?.newsletterEmail).toBeDefined()
    expect(response.body.data.newsletterEmail.newsletterEmail).toContain('@inbox.omnivore.app')
    expect(response.body.data.newsletterEmail.emailAlias).toBeTruthy()
    expect(response.body.data.newsletterEmail.emailAlias).toHaveLength(8)
  })

  it('should return empty list when user has no newsletter subscriptions', async () => {
    const response = await executeQuery(NEWSLETTER_SUBSCRIPTIONS_QUERY, {
      activeOnly: true,
    })

    expect(response.status).toBe(200)
    expect(response.body.data.newsletterSubscriptions).toEqual([])
  })

  describe('Newsletter Subscription and Management', () => {
    let subscriptionId: string

    it('should subscribe to a newsletter', async () => {
      const response = await executeQuery(SUBSCRIBE_TO_NEWSLETTER_MUTATION, {
        senderEmail: 'writer@substack.com',
        title: 'Test Newsletter',
      })

      expect(response.status).toBe(200)
      expect(response.body.data.subscribeToNewsletter.success).toBe(true)
      expect(
        response.body.data.subscribeToNewsletter.subscription.senderEmail,
      ).toBe('writer@substack.com')
      expect(
        response.body.data.subscribeToNewsletter.subscription.title,
      ).toBe('Test Newsletter')
      expect(
        response.body.data.subscribeToNewsletter.subscription.emailAlias,
      ).toBeTruthy()

      subscriptionId =
        response.body.data.subscribeToNewsletter.subscription.id

      // Verify in database
      const dbSubscription = await subscriptionRepository.findBySource(
        userId,
        SubscriptionSourceType.NEWSLETTER,
        'writer@substack.com',
      )
      expect(dbSubscription).toBeTruthy()
      expect(dbSubscription?.sourceType).toBe(SubscriptionSourceType.NEWSLETTER)
      expect(dbSubscription?.emailAlias).toBeTruthy()
    })

    it('should return existing subscription when subscribing twice', async () => {
      const firstResponse = await executeQuery(
        SUBSCRIBE_TO_NEWSLETTER_MUTATION,
        {
          senderEmail: 'duplicate@test.com',
          title: 'First Subscribe',
        },
      )

      const secondResponse = await executeQuery(
        SUBSCRIBE_TO_NEWSLETTER_MUTATION,
        {
          senderEmail: 'duplicate@test.com',
          title: 'Second Subscribe',
        },
      )

      expect(firstResponse.body.data.subscribeToNewsletter.success).toBe(true)
      expect(secondResponse.body.data.subscribeToNewsletter.success).toBe(true)

      // Should return the same subscription
      expect(
        firstResponse.body.data.subscribeToNewsletter.subscription.id,
      ).toBe(secondResponse.body.data.subscribeToNewsletter.subscription.id)
    })

    it('should list newsletter subscriptions', async () => {
      const response = await executeQuery(NEWSLETTER_SUBSCRIPTIONS_QUERY, {
        activeOnly: true,
      })

      expect(response.status).toBe(200)
      expect(response.body.data.newsletterSubscriptions.length).toBeGreaterThan(
        0,
      )

      const subscription = response.body.data.newsletterSubscriptions.find(
        (s: any) => s.senderEmail === 'writer@substack.com',
      )
      expect(subscription).toBeDefined()
      expect(subscription.title).toBe('Test Newsletter')
    })

    it('should update newsletter settings', async () => {
      // First create a subscription if we don't have one
      let testSubscriptionId = subscriptionId
      if (!testSubscriptionId) {
        const createResponse = await executeQuery(SUBSCRIBE_TO_NEWSLETTER_MUTATION, {
          senderEmail: 'settings-test@newsletter.com',
          title: 'Settings Test',
        })
        testSubscriptionId = createResponse.body.data.subscribeToNewsletter.subscription.id
      }

      const response = await executeQuery(UPDATE_NEWSLETTER_SETTINGS_MUTATION, {
        subscriptionId: testSubscriptionId,
        settings: {
          title: 'Updated Newsletter Title',
          folder: 'Tech News',
          autoAddLabels: ['newsletter', 'tech'],
        },
      })

      expect(response.status).toBe(200)
      expect(response.body.data.updateNewsletterSettings.success).toBe(true)
      expect(response.body.data.updateNewsletterSettings.subscription.title).toBe(
        'Updated Newsletter Title',
      )
      expect(response.body.data.updateNewsletterSettings.subscription.folder).toBe(
        'Tech News',
      )
      expect(
        response.body.data.updateNewsletterSettings.subscription.autoAddLabels,
      ).toEqual(['newsletter', 'tech'])
    })

    it('should unsubscribe from newsletter and delete items', async () => {
      // Create a subscription to unsubscribe from
      const subscribeResponse = await executeQuery(
        SUBSCRIBE_TO_NEWSLETTER_MUTATION,
        {
          senderEmail: 'delete-test@newsletter.com',
          title: 'To Be Deleted',
        },
      )

      const subId = subscribeResponse.body.data.subscribeToNewsletter.subscription.id

      // Unsubscribe
      const response = await executeQuery(
        UNSUBSCRIBE_FROM_NEWSLETTER_MUTATION,
        {
          subscriptionId: subId,
          deleteItems: true,
        },
      )

      expect(response.status).toBe(200)
      expect(response.body.data.unsubscribeFromNewsletter.success).toBe(true)

      // Verify subscription is deleted (not just deactivated)
      const dbSubscription = await subscriptionRepository.findBySource(
        userId,
        SubscriptionSourceType.NEWSLETTER,
        'delete-test@newsletter.com',
      )
      expect(dbSubscription).toBeNull()
    })

    it('should unsubscribe but keep items when deleteItems = false', async () => {
      // Create a subscription
      const subscribeResponse = await executeQuery(
        SUBSCRIBE_TO_NEWSLETTER_MUTATION,
        {
          senderEmail: 'keep-items@newsletter.com',
          title: 'Keep Items Test',
        },
      )

      const subId = subscribeResponse.body.data.subscribeToNewsletter.subscription.id

      // Unsubscribe without deleting items
      const response = await executeQuery(
        UNSUBSCRIBE_FROM_NEWSLETTER_MUTATION,
        {
          subscriptionId: subId,
          deleteItems: false,
        },
      )

      expect(response.status).toBe(200)
      expect(response.body.data.unsubscribeFromNewsletter.success).toBe(true)
      expect(response.body.data.unsubscribeFromNewsletter.message).toContain(
        'items preserved',
      )
    })

    it('should reject invalid email format', async () => {
      const response = await executeQuery(SUBSCRIBE_TO_NEWSLETTER_MUTATION, {
        senderEmail: 'not-an-email',
        title: 'Invalid Test',
      })

      expect(response.status).toBe(200)
      expect(response.body.data.subscribeToNewsletter.success).toBe(false)
      expect(response.body.data.subscribeToNewsletter.errors).toBeTruthy()
    })
  })
})
