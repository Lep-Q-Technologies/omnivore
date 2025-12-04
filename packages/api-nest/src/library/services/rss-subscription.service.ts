/**
 * RssSubscriptionService - Manage RSS feed subscriptions
 *
 * Single Responsibility: Handles RSS-specific subscription operations.
 * Newsletter subscriptions are handled by NewsletterSubscriptionService (ARC-016 Phase 2).
 */

import { InjectQueue } from '@nestjs/bullmq'
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { Queue } from 'bullmq'

import { JOB_TYPES, QUEUE_NAMES } from '../../queue/queue.constants'
import { RssFeedService } from '../../queue/services/rss-feed.service'
import { REPOSITORY_TOKENS } from '../../repositories/injection-tokens'
import {
  ILibraryItemRepository,
  ISubscriptionRepository,
} from '../../repositories/interfaces'
import { SubscriptionMetadata } from '../../repositories/subscription.repository'
import { ContentType } from '../entities/library-item.entity'
import {
  SubscriptionEntity,
  SubscriptionSourceType,
} from '../entities/subscription.entity'

/**
 * Result of importing feed items
 */
export interface FeedImportResult {
  success: boolean
  itemsImported: number
  itemsSkipped: number
  errors: string[]
}

@Injectable()
export class RssSubscriptionService {
  private readonly logger = new Logger(RssSubscriptionService.name)

  constructor(
    @Inject(REPOSITORY_TOKENS.ISubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(REPOSITORY_TOKENS.ILibraryItemRepository)
    private readonly libraryItemRepository: ILibraryItemRepository,
    private readonly rssFeedService: RssFeedService,
    @InjectQueue(QUEUE_NAMES.CONTENT_PROCESSING)
    private readonly contentQueue: Queue,
  ) {}

  /**
   * Subscribe to an RSS feed
   *
   * @param userId - User ID
   * @param feedUrl - RSS feed URL
   * @param importItems - Whether to immediately import feed items (default: true)
   * @returns Created RSS subscription
   */
  async subscribe(
    userId: string,
    feedUrl: string,
    importItems = true,
  ): Promise<SubscriptionEntity> {
    this.logger.log(`User ${userId} subscribing to RSS feed: ${feedUrl}`)

    // Check if already subscribed
    const existing = await this.subscriptionRepository.findBySource(
      userId,
      SubscriptionSourceType.RSS,
      feedUrl,
    )

    if (existing) {
      if (!existing.active) {
        // Reactivate inactive subscription
        await this.subscriptionRepository.activate(existing.id)
        this.logger.log(`Reactivated RSS subscription: ${existing.id}`)

        return existing
      }
      this.logger.log(`Already subscribed to RSS feed: ${existing.id}`)

      return existing
    }

    // Parse feed to get metadata
    let metadata: SubscriptionMetadata = {}
    try {
      const feed = await this.rssFeedService.parseFeed(feedUrl)
      metadata = {
        title: feed.title,
        description: feed.description,
        siteUrl: feed.link,
        siteIcon: feed.image?.url,
      }
    } catch (error) {
      this.logger.warn(`Failed to parse feed metadata for ${feedUrl}: ${error}`)
      // Continue with subscription even if parsing fails
    }

    // Create subscription
    const subscription = await this.subscriptionRepository.createRss(
      userId,
      feedUrl,
      metadata,
    )

    // Import items if requested
    if (importItems) {
      // Queue import job asynchronously (don't wait)
      this.importFeedItems(subscription.id, userId).catch((error) => {
        this.logger.error(
          `Failed to import items for feed ${subscription.id}: ${error}`,
        )
      })
    }

    return subscription
  }

  /**
   * Unsubscribe from an RSS feed
   *
   * @param feedId - RSS feed subscription ID
   * @param userId - User ID
   * @param deleteItems - Whether to delete library items from this feed (default: true)
   */
  async unsubscribe(
    feedId: string,
    userId: string,
    deleteItems = true,
  ): Promise<void> {
    this.logger.log(
      `User ${userId} unsubscribing from RSS feed: ${feedId} (deleteItems: ${deleteItems})`,
    )

    const subscription = await this.subscriptionRepository.findById(
      feedId,
      userId,
    )
    if (!subscription) {
      throw new NotFoundException(`RSS feed ${feedId} not found`)
    }

    if (!subscription.isRss) {
      throw new Error('Can only unsubscribe from RSS feeds using this service')
    }

    // Delete library items from this feed if requested
    if (deleteItems) {
      this.logger.log(`Deleting library items for RSS feed: ${feedId}`)
      await this.libraryItemRepository.deleteBySubscription(feedId, userId)
    }

    // Fully delete the subscription
    await this.subscriptionRepository.delete(feedId)

    this.logger.log(`Deleted RSS subscription: ${feedId}`)
  }

  /**
   * Refresh an RSS feed and import new items
   *
   * @param feedId - RSS feed subscription ID
   * @param userId - User ID
   * @returns Import result
   */
  async refresh(feedId: string, userId: string): Promise<FeedImportResult> {
    this.logger.log(`Refreshing RSS feed: ${feedId}`)

    const subscription = await this.subscriptionRepository.findById(
      feedId,
      userId,
    )
    if (!subscription) {
      throw new NotFoundException(`RSS feed ${feedId} not found`)
    }

    if (!subscription.isRss) {
      throw new Error('Can only refresh RSS feeds')
    }

    return this.importFeedItems(feedId, userId)
  }

  /**
   * Get all RSS feed subscriptions for a user
   *
   * @param userId - User ID
   * @param activeOnly - Only return active subscriptions (default: true)
   */
  async getUserFeeds(
    userId: string,
    activeOnly = true,
  ): Promise<SubscriptionEntity[]> {
    return this.subscriptionRepository.findByUser(
      userId,
      SubscriptionSourceType.RSS,
      activeOnly,
    )
  }

  /**
   * Get unread count for an RSS feed
   *
   * @param feedId - RSS feed subscription ID
   * @param userId - User ID
   * @returns Number of unread items
   */
  async getUnreadCount(feedId: string, userId: string): Promise<number> {
    return this.subscriptionRepository.getUnreadCount(feedId, userId)
  }

  /**
   * Update RSS feed settings
   *
   * @param feedId - RSS feed subscription ID
   * @param userId - User ID
   * @param settings - Settings to update
   */
  async updateSettings(
    feedId: string,
    userId: string,
    settings: {
      title?: string
      folder?: string
      autoAddLabels?: string[]
    },
  ): Promise<SubscriptionEntity> {
    const subscription = await this.subscriptionRepository.findById(
      feedId,
      userId,
    )
    if (!subscription) {
      throw new NotFoundException(`RSS feed ${feedId} not found`)
    }

    if (!subscription.isRss) {
      throw new Error('Can only update RSS feed settings using this service')
    }

    await this.subscriptionRepository.updateSettings(feedId, userId, settings)

    // Return updated subscription
    const updated = await this.subscriptionRepository.findById(feedId, userId)
    if (!updated) {
      throw new NotFoundException(`RSS feed ${feedId} not found after update`)
    }

    return updated
  }

  /**
   * Import items from an RSS feed
   *
   * @param feedId - RSS feed subscription ID
   * @param userId - User ID
   * @returns Import result
   */
  private async importFeedItems(
    feedId: string,
    userId: string,
  ): Promise<FeedImportResult> {
    const subscription = await this.subscriptionRepository.findById(
      feedId,
      userId,
    )
    if (!subscription) {
      throw new NotFoundException(`RSS feed ${feedId} not found`)
    }

    if (!subscription.feedUrl) {
      throw new Error('RSS subscription does not have a feed URL')
    }

    const result: FeedImportResult = {
      success: false,
      itemsImported: 0,
      itemsSkipped: 0,
      errors: [],
    }

    try {
      // Parse feed
      const parsedFeed = await this.rssFeedService.parseFeed(
        subscription.feedUrl,
      )

      // Import each feed item as a library item
      for (const item of parsedFeed.items) {
        try {
          // Check if item already exists (by URL)
          const existing = await this.libraryItemRepository.findByUrl(
            item.link,
            userId,
          )

          if (existing) {
            result.itemsSkipped++
            continue
          }

          // Create library item linked to subscription
          const libraryItem = this.libraryItemRepository.create({
            userId,
            originalUrl: item.link,
            slug: this.generateSlug(item.link),
            title: item.title || 'Untitled',
            author: item.author,
            description: item.description,
            publishedAt: item.publishedAt,
            savedAt: new Date(),
            state: 'CONTENT_NOT_FETCHED' as any, // Will be updated after fetch
            contentType: ContentType.RSS_FEED, // RSS feed items
            subscriptionId: feedId, // Link to RSS subscription
          })

          // Save to database
          const savedItem = await this.libraryItemRepository.save(libraryItem)

          // Queue content fetching for the item
          await this.contentQueue.add(
            JOB_TYPES.FETCH_CONTENT,
            {
              libraryItemId: savedItem.id,
              url: item.link,
              userId,
              source: 'rss',
              timestamp: new Date(),
            },
            {
              jobId: `fetch-content-${savedItem.id}`,
              removeOnComplete: true,
              removeOnFail: false,
            },
          )

          result.itemsImported++
        } catch (error) {
          this.logger.error(`Failed to import feed item ${item.link}: ${error}`)
          result.errors.push(
            `${item.title}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          )
        }
      }

      // Update subscription metadata
      await this.subscriptionRepository.markFetched(
        feedId,
        result.itemsImported,
      )

      result.success = true
      this.logger.log(
        `Imported ${result.itemsImported} items from RSS feed ${feedId}, skipped ${result.itemsSkipped}`,
      )
    } catch (error) {
      this.logger.error(`Failed to import RSS feed ${feedId}: ${error}`)
      await this.subscriptionRepository.markFailed(
        feedId,
        error instanceof Error ? error.message : 'Unknown error',
      )
      result.errors.push(
        error instanceof Error ? error.message : 'Unknown error',
      )
    }

    return result
  }

  /**
   * Generate a unique, URL-safe slug from a URL
   * @param url - The URL to generate a slug from
   * @returns A unique, URL-safe slug
   * @private
   */
  private generateSlug(url: string): string {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname

      // Extract meaningful part from pathname
      let slug = pathname
        .split('/')
        .filter((part) => part.length > 0)
        .join('-')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 100)

      if (!slug) {
        slug = urlObj.hostname.replace(/\./g, '-')
      }

      // Add timestamp to ensure uniqueness
      const timestamp = Date.now()

      return `${slug}-${timestamp}`
    } catch {
      return `url-${Date.now()}`
    }
  }
}
