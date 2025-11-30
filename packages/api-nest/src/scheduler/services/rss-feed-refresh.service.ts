import { Inject, Injectable, Logger } from '@nestjs/common'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { REPOSITORY_TOKENS } from '../../repositories/injection-tokens'
import { IRssFeedRepository } from '../../repositories/interfaces'
import { RssFeedSubscriptionService } from '../../library/services/rss-feed-subscription.service'

/**
 * RssFeedRefreshService
 *
 * Background worker that refreshes all active RSS feed subscriptions.
 * Runs periodically (every hour) to fetch new feed items and import them
 * as library articles for subscribers.
 */
@Processor('scheduler')
@Injectable()
export class RssFeedRefreshService extends WorkerHost {
  private readonly logger = new Logger(RssFeedRefreshService.name)

  constructor(
    @Inject(REPOSITORY_TOKENS.IRssFeedRepository)
    private readonly rssFeedRepository: IRssFeedRepository,
    private readonly rssFeedSubscriptionService: RssFeedSubscriptionService,
  ) {
    super()
  }

  /**
   * Process scheduled jobs
   */
  async process(job: Job): Promise<any> {
    const { name } = job

    this.logger.log(`Processing scheduled job: ${name}`)

    switch (name) {
      case 'refresh-all-rss-feeds':
        return this.refreshAllRssFeeds()
      default:
        this.logger.warn(`Unknown job type: ${name}`)
        return { success: false, error: 'Unknown job type' }
    }
  }

  /**
   * Refresh all active RSS feeds
   *
   * Fetches all feeds that need refreshing (based on last fetch time)
   * and imports new items for each feed's subscribers.
   */
  private async refreshAllRssFeeds(): Promise<{
    success: boolean
    feedsRefreshed: number
    totalItemsImported: number
    errors: string[]
  }> {
    const startTime = Date.now()
    this.logger.log('Starting RSS feed refresh cycle')

    const result = {
      success: true,
      feedsRefreshed: 0,
      totalItemsImported: 0,
      errors: [] as string[],
    }

    try {
      // Get feeds that need refreshing
      // (not fetched in last hour, or never fetched)
      const feedsToRefresh = await this.rssFeedRepository.getFeedsToRefresh(
        3600, // 1 hour in seconds
        100, // batch limit
      )

      this.logger.log(`Found ${feedsToRefresh.length} feeds to refresh`)

      // Refresh each feed
      for (const feed of feedsToRefresh) {
        try {
          this.logger.debug(`Refreshing feed: ${feed.title} (${feed.id})`)

          const importResult =
            await this.rssFeedSubscriptionService.refresh(feed.id, feed.userId)

          if (importResult.success) {
            result.feedsRefreshed++
            result.totalItemsImported += importResult.itemsImported

            this.logger.log(
              `Refreshed feed ${feed.title}: ${importResult.itemsImported} new items`,
            )
          } else {
            result.errors.push(
              `${feed.title}: ${importResult.errors.join(', ')}`,
            )
          }
        } catch (error) {
          const errorMsg = `Failed to refresh feed ${feed.title}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
          this.logger.error(errorMsg)
          result.errors.push(errorMsg)
        }
      }

      const duration = Date.now() - startTime
      this.logger.log(
        `RSS feed refresh cycle complete: ${result.feedsRefreshed} feeds refreshed, ${result.totalItemsImported} items imported in ${duration}ms`,
      )

      if (result.errors.length > 0) {
        this.logger.warn(
          `${result.errors.length} feeds failed to refresh`,
          result.errors,
        )
        result.success = false
      }
    } catch (error) {
      this.logger.error('RSS feed refresh cycle failed', error)
      result.success = false
      result.errors.push(
        error instanceof Error ? error.message : 'Unknown error',
      )
    }

    return result
  }

  /**
   * Refresh a specific RSS feed
   * Called manually or as part of bulk refresh
   */
  async refreshFeed(
    feedId: string,
    userId: string,
  ): Promise<{
    success: boolean
    itemsImported: number
    errors: string[]
  }> {
    this.logger.log(`Manually refreshing feed: ${feedId}`)

    try {
      const importResult = await this.rssFeedSubscriptionService.refresh(
        feedId,
        userId,
      )
      return importResult
    } catch (error) {
      this.logger.error(`Failed to refresh feed ${feedId}`, error)
      return {
        success: false,
        itemsImported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }
    }
  }
}
