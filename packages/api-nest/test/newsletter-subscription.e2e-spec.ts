import { INestApplication } from '@nestjs/common'
import request from 'supertest'

import { SubscriptionSourceType } from '../src/library/entities/subscription.entity'
import { REPOSITORY_TOKENS } from '../src/repositories/injection-tokens'
import { ISubscriptionRepository } from '../src/repositories/interfaces'
import { createE2EAppWithModule } from './helpers/create-e2e-app'

interface NewsletterSubscription {
  id: string
  senderEmail: string | null
  emailAlias: string
  title: string
  itemCount: number
  active: boolean
  folder: string | null
  autoAddLabels: string[] | null
  unreadCount: number
}

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

const CREATE_NEWSLETTER_SUBSCRIPTION_MUTATION = `
  mutation CreateNewsletterSubscription($name: String!) {
    createNewsletterSubscription(name: $name) {
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
  let app: INestApplication | null = null
  let authToken = ''
  let userId = ''
  let subscriptionRepository: ISubscriptionRepository | null = null

  beforeAll(async () => {
    // Set required environment variables for tests
    process.env.GOOGLE_CLIENT_ID = 'test-client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
    process.env.JWT_SECRET = 'test-jwt-secret'

    const { app: testApp, moduleFixture } = await createE2EAppWithModule()
    app = testApp

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
    if (app) {
      await app.close()
    }
  }, 30000)

  const getApp = (): INestApplication => {
    if (!app) {
      throw new Error('App not initialized')
    }

    return app
  }

  const executeQuery = (
    query: string,
    variables: Record<string, unknown> = {},
  ) =>
    request(getApp().getHttpServer())
      .post('/api/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ query, variables })

  it('should return user newsletter email address', async () => {
    const response = await executeQuery(NEWSLETTER_EMAIL_QUERY)

    expect(response.status).toBe(200)

    // Fail test if there's an error or unexpected response
    expect(response.body.errors).toBeFalsy()
    expect(response.body.data?.newsletterEmail).toBeDefined()
    expect(response.body.data.newsletterEmail.newsletterEmail).toContain(
      '@inbox.omnivore.app',
    )
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

  const getSubscriptionRepo = (): ISubscriptionRepository => {
    if (!subscriptionRepository) {
      throw new Error('Subscription repository not initialized')
    }

    return subscriptionRepository
  }

  describe('Newsletter Subscription and Management', () => {
    let subscriptionId = ''

    it('should create a newsletter subscription slot', async () => {
      const response = await executeQuery(
        CREATE_NEWSLETTER_SUBSCRIPTION_MUTATION,
        {
          name: 'Test Newsletter',
        },
      )

      expect(response.status).toBe(200)
      expect(response.body.data.createNewsletterSubscription.success).toBe(true)
      expect(
        response.body.data.createNewsletterSubscription.subscription.title,
      ).toBe('Test Newsletter')
      expect(
        response.body.data.createNewsletterSubscription.subscription.emailAlias,
      ).toBeTruthy()
      expect(
        response.body.data.createNewsletterSubscription.subscription.emailAlias,
      ).toHaveLength(8)

      subscriptionId =
        response.body.data.createNewsletterSubscription.subscription.id

      // Verify in database - should be pending
      const dbSubscription = await getSubscriptionRepo().findById(
        subscriptionId,
        userId,
      )
      expect(dbSubscription).toBeTruthy()
      expect(dbSubscription?.sourceType).toBe(SubscriptionSourceType.NEWSLETTER)
      expect(dbSubscription?.emailAlias).toBeTruthy()
      expect(dbSubscription?.sourceIdentifier).toContain('pending:')
      expect(dbSubscription?.active).toBe(true)
    })

    it('should create multiple subscription slots with unique aliases', async () => {
      const firstResponse = await executeQuery(
        CREATE_NEWSLETTER_SUBSCRIPTION_MUTATION,
        {
          name: 'First Newsletter',
        },
      )

      const secondResponse = await executeQuery(
        CREATE_NEWSLETTER_SUBSCRIPTION_MUTATION,
        {
          name: 'Second Newsletter',
        },
      )

      expect(firstResponse.body.data.createNewsletterSubscription.success).toBe(
        true,
      )
      expect(
        secondResponse.body.data.createNewsletterSubscription.success,
      ).toBe(true)

      // Should create different subscriptions with unique aliases
      const firstAlias =
        firstResponse.body.data.createNewsletterSubscription.subscription
          .emailAlias
      const secondAlias =
        secondResponse.body.data.createNewsletterSubscription.subscription
          .emailAlias

      expect(firstAlias).not.toBe(secondAlias)
      expect(
        firstResponse.body.data.createNewsletterSubscription.subscription.id,
      ).not.toBe(
        secondResponse.body.data.createNewsletterSubscription.subscription.id,
      )
    })

    it('should list newsletter subscriptions', async () => {
      const response = await executeQuery(NEWSLETTER_SUBSCRIPTIONS_QUERY, {
        activeOnly: true,
      })

      expect(response.status).toBe(200)
      expect(response.body.data.newsletterSubscriptions.length).toBeGreaterThan(
        0,
      )

      // Find the subscription we created in the first test
      const subscription = response.body.data.newsletterSubscriptions.find(
        (s: NewsletterSubscription) => s.title === 'Test Newsletter',
      )
      expect(subscription).toBeDefined()
      expect(subscription.emailAlias).toBeTruthy()
      expect(subscription.active).toBe(true)
    })

    it('should update newsletter settings', async () => {
      // First create a subscription if we don't have one
      let testSubscriptionId = subscriptionId
      if (!testSubscriptionId) {
        const createResponse = await executeQuery(
          CREATE_NEWSLETTER_SUBSCRIPTION_MUTATION,
          {
            name: 'Settings Test',
          },
        )
        testSubscriptionId =
          createResponse.body.data.createNewsletterSubscription.subscription.id
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
      expect(
        response.body.data.updateNewsletterSettings.subscription.title,
      ).toBe('Updated Newsletter Title')
      expect(
        response.body.data.updateNewsletterSettings.subscription.folder,
      ).toBe('Tech News')
      expect(
        response.body.data.updateNewsletterSettings.subscription.autoAddLabels,
      ).toEqual(['newsletter', 'tech'])
    })

    it('should unsubscribe from newsletter and delete items', async () => {
      // Create a subscription to unsubscribe from
      const subscribeResponse = await executeQuery(
        CREATE_NEWSLETTER_SUBSCRIPTION_MUTATION,
        {
          name: 'To Be Deleted',
        },
      )

      const subId =
        subscribeResponse.body.data.createNewsletterSubscription.subscription.id

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
      const dbSubscription = await subscriptionRepository.findById(
        subId,
        userId,
      )
      expect(dbSubscription).toBeNull()
    })

    it('should unsubscribe but keep items when deleteItems = false', async () => {
      // Create a subscription
      const subscribeResponse = await executeQuery(
        CREATE_NEWSLETTER_SUBSCRIPTION_MUTATION,
        {
          name: 'Keep Items Test',
        },
      )

      const subId =
        subscribeResponse.body.data.createNewsletterSubscription.subscription.id

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
  })
})
