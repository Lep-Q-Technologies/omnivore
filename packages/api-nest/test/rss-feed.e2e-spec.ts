import { INestApplication } from '@nestjs/common'
import request from 'supertest'

import { REPOSITORY_TOKENS } from '../src/repositories/injection-tokens'
import {
  ILibraryItemRepository,
  ISubscriptionRepository,
} from '../src/repositories/interfaces'
import { createE2EAppWithModule } from './helpers/create-e2e-app'

const UNSUBSCRIBE_FROM_RSS_FEED_MUTATION = `
  mutation UnsubscribeFromRssFeed($feedId: ID!, $deleteItems: Boolean) {
    unsubscribeFromRssFeed(feedId: $feedId, deleteItems: $deleteItems) {
      success
      message
      errors
    }
  }
`

const RSS_FEEDS_QUERY = `
  query RssFeeds($activeOnly: Boolean) {
    rssFeeds(activeOnly: $activeOnly) {
      id
      feedUrl
      title
      siteUrl
      siteIcon
      unreadCount
    }
  }
`

describe('RSS Feed GraphQL (e2e)', () => {
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
        email: `rss-test-${Date.now()}@omnivore.app`,
        name: 'RSS Test User',
        password: 'rssPassword123',
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
      .expect(200)

  it('returns empty list when user has no RSS subscriptions', async () => {
    const response = await executeQuery(RSS_FEEDS_QUERY, { activeOnly: true })

    expect(response.body.errors).toBeUndefined()
    expect(response.body.data.rssFeeds).toHaveLength(0)
  })

  describe('RSS Feed Subscription and Deletion', () => {
    let feedId: string

    it('should unsubscribe from RSS feed and delete items', async () => {
      // Step 1: Create a subscription directly in the database
      const subscription = await subscriptionRepository.createRss(
        userId,
        'https://example.com/feed.xml',
        {
          title: 'Test Feed',
          siteUrl: 'https://example.com',
          siteIcon: 'https://example.com/icon.png',
        },
      )
      feedId = subscription.id

      // Step 2: Create library items linked to this subscription
      const item1 = libraryRepository.create({
        userId,
        user: { id: userId } as any,
        title: 'RSS Item 1',
        slug: 'rss-item-1',
        originalUrl: 'https://example.com/article1',
        subscriptionId: feedId,
        savedAt: new Date(),
      })
      const item2 = libraryRepository.create({
        userId,
        user: { id: userId } as any,
        title: 'RSS Item 2',
        slug: 'rss-item-2',
        originalUrl: 'https://example.com/article2',
        subscriptionId: feedId,
        savedAt: new Date(),
      })
      await libraryRepository.save(item1)
      await libraryRepository.save(item2)

      // Step 3: Verify items exist before deletion
      const itemsBeforeDeletion = await libraryRepository.findByIds(
        [item1.id, item2.id],
        userId,
      )

      expect(itemsBeforeDeletion).toHaveLength(2)

      // Step 4: Unsubscribe with deleteItems = true
      const response = await executeQuery(UNSUBSCRIBE_FROM_RSS_FEED_MUTATION, {
        feedId,
        deleteItems: true,
      })

      expect(response.body.errors).toBeUndefined()
      expect(response.body.data.unsubscribeFromRssFeed.success).toBe(true)
      expect(response.body.data.unsubscribeFromRssFeed.message).toContain(
        'deleted items',
      )

      // Step 5: Verify subscription is deleted
      const subscriptionAfterDeletion = await subscriptionRepository.findById(
        feedId,
        userId,
      )
      expect(subscriptionAfterDeletion).toBeNull()

      // Step 6: Verify library items are deleted
      const itemsAfterDeletion = await libraryRepository.findByIds(
        [item1.id, item2.id],
        userId,
      )
      expect(itemsAfterDeletion).toHaveLength(0)
    })

    it('should unsubscribe from RSS feed but keep items when deleteItems = false', async () => {
      // Step 1: Create a subscription
      const subscription = await subscriptionRepository.createRss(
        userId,
        'https://example.com/feed2.xml',
        {
          title: 'Test Feed 2',
          siteUrl: 'https://example.com',
          siteIcon: 'https://example.com/icon.png',
        },
      )
      const testFeedId = subscription.id
      // Step 2: Create library items
      const item = libraryRepository.create({
        userId,
        user: { id: userId } as any,
        title: 'RSS Item to Keep',
        slug: 'rss-item-to-keep',
        originalUrl: 'https://example.com/article-keep',
        savedAt: new Date(),
      })
      await libraryRepository.save(item)

      // Step 3: Unsubscribe with deleteItems = false
      const response = await executeQuery(UNSUBSCRIBE_FROM_RSS_FEED_MUTATION, {
        feedId: testFeedId,
        deleteItems: false,
      })

      expect(response.body.errors).toBeUndefined()
      expect(response.body.data.unsubscribeFromRssFeed.success).toBe(true)
      expect(response.body.data.unsubscribeFromRssFeed.message).toContain(
        'items kept',
      )

      // Step 4: Verify subscription is deleted
      const subscriptionAfterDeletion = await subscriptionRepository.findById(
        testFeedId,
        userId,
      )
      expect(subscriptionAfterDeletion).toBeNull()

      // Step 5: Verify library items still exist
      const itemsAfterDeletion = await libraryRepository.findByIds(
        [item.id],
        userId,
      )
      expect(itemsAfterDeletion).toHaveLength(1)

      // Cleanup: Delete the item manually
      await libraryRepository.bulkDelete(userId, [item.id])
    })
  })
})
