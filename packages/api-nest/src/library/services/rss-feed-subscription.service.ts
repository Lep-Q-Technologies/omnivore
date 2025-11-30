/**
 * RssFeedSubscriptionService - Manage RSS feed subscriptions
 *
 * Handles subscribing/unsubscribing to RSS feeds and importing feed items
 * as library items.
 */

import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { RssFeedMetadata } from '../../repositories/rss-feed.repository'
import { RssFeedService } from '../../queue/services/rss-feed.service'
import { QUEUE_NAMES, JOB_TYPES } from '../../queue/queue.constants'
import { RssFeedEntity } from '../entities/rss-feed.entity'
import { ContentType } from '../entities/library-item.entity'
import { REPOSITORY_TOKENS } from '../../repositories/injection-tokens'
import {
  ILibraryItemRepository,
  IRssFeedRepository,
} from '../../repositories/interfaces'

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
export class RssFeedSubscriptionService {
  private readonly logger = new Logger(RssFeedSubscriptionService.name)

  constructor(
    @Inject(REPOSITORY_TOKENS.IRssFeedRepository)
    private readonly rssFeedRepository: IRssFeedRepository,
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
   * @returns Created feed subscription
   */
  async subscribe(
    userId: string,
    feedUrl: string,
    importItems = true,
  ): Promise<RssFeedEntity> {
    this.logger.log(`User ${userId} subscribing to feed: ${feedUrl}`)

    // Check if already subscribed
    const existing = await this.rssFeedRepository.findByUrl(feedUrl, userId)
    if (existing) {
      if (!existing.active) {
        // Reactivate inactive subscription
        await this.rssFeedRepository.activate(existing.id)
        this.logger.log(`Reactivated feed subscription: ${existing.id}`)
        return existing
      }
      this.logger.log(`Already subscribed to feed: ${existing.id}`)
      return existing
    }

    // Parse feed to get metadata
    let metadata: RssFeedMetadata = {}
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
    const subscription = await this.rssFeedRepository.create(
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
   * @param feedId - Feed ID
   * @param userId - User ID
   * @param deleteItems - Whether to delete library items from this feed (default: true)
   */
  async unsubscribe(
    feedId: string,
    userId: string,
    deleteItems = true,
  ): Promise<void> {
    this.logger.log(
      `User ${userId} unsubscribing from feed: ${feedId} (deleteItems: ${deleteItems})`,
    )

    const feed = await this.rssFeedRepository.findById(feedId, userId)
    if (!feed) {
      throw new NotFoundException(`Feed ${feedId} not found`)
    }

    // Delete library items from this feed if requested
    if (deleteItems) {
      this.logger.log(`Deleting library items for feed: ${feedId}`)
      await this.libraryItemRepository.deleteBySubscription(feedId, userId)
    }

    // Fully delete the subscription
    await this.rssFeedRepository.delete(feedId)

    this.logger.log(`Deleted feed subscription: ${feedId}`)
  }

  /**
   * Refresh a feed and import new items
   *
   * @param feedId - Feed ID
   * @param userId - User ID
   * @returns Import result
   */
  async refresh(feedId: string, userId: string): Promise<FeedImportResult> {
    this.logger.log(`Refreshing feed: ${feedId}`)

    const feed = await this.rssFeedRepository.findById(feedId, userId)
    if (!feed) {
      throw new NotFoundException(`Feed ${feedId} not found`)
    }

    return this.importFeedItems(feedId, userId)
  }

  /**
   * Get all feed subscriptions for a user
   *
   * @param userId - User ID
   * @param activeOnly - Only return active subscriptions
   */
  async getUserFeeds(
    userId: string,
    activeOnly = true,
  ): Promise<RssFeedEntity[]> {
    return this.rssFeedRepository.findByUser(userId, activeOnly)
  }

  /**
   * Get unread count for a feed
   *
   * @param feedId - Feed ID
   * @param userId - User ID
   * @returns Number of unread items
   */
  async getUnreadCount(feedId: string, userId: string): Promise<number> {
    return this.rssFeedRepository.getUnreadCount(feedId, userId)
  }

  /**
   * Update feed settings
   *
   * @param feedId - Feed ID
   * @param userId - User ID
   * @param settings - Settings to update
   */
  async updateSettings(
    feedId: string,
    userId: string,
    settings: {
      title?: string
      autoAddToLibrary?: boolean
      folder?: string
    },
  ): Promise<RssFeedEntity> {
    const feed = await this.rssFeedRepository.findById(feedId, userId)
    if (!feed) {
      throw new NotFoundException(`Feed ${feedId} not found`)
    }

    await this.rssFeedRepository.updateSettings(feedId, userId, settings)

    // Return updated feed
    const updatedFeed = await this.rssFeedRepository.findById(feedId, userId)
    if (!updatedFeed) {
      throw new NotFoundException(`Feed ${feedId} not found after update`)
    }

    return updatedFeed
  }

  /**
   * Import items from a feed
   *
   * @param feedId - Feed ID
   * @param userId - User ID
   * @returns Import result
   */
  private async importFeedItems(
    feedId: string,
    userId: string,
  ): Promise<FeedImportResult> {
    const feed = await this.rssFeedRepository.findById(feedId, userId)
    if (!feed) {
      throw new NotFoundException(`Feed ${feedId} not found`)
    }

    const result: FeedImportResult = {
      success: false,
      itemsImported: 0,
      itemsSkipped: 0,
      errors: [],
    }

    try {
      // Parse feed
      const parsedFeed = await this.rssFeedService.parseFeed(feed.feedUrl)

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
            title: item.title ||'Untitled',
            author: item.author,
            description: item.description,
            publishedAt: item.publishedAt,
            savedAt: new Date(),
            state: 'CONTENT_NOT_FETCHED' as any, // Will be updated after fetch
            contentType: ContentType.ARTICLE, // Feed items are articles
            subscriptionId: feedId, // Link to RSS feed subscription
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
            `${item.title}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          )
        }
      }

      // Update feed metadata
      await this.rssFeedRepository.markFetched(feedId, result.itemsImported)

      result.success = true
      this.logger.log(
        `Imported ${result.itemsImported} items from feed ${feedId}, skipped ${result.itemsSkipped}`,
      )
    } catch (error) {
      this.logger.error(`Failed to import feed ${feedId}: ${error}`)
      await this.rssFeedRepository.markFailed(
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
