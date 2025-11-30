import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { RssFeedRefreshService } from './services/rss-feed-refresh.service'

/**
 * SchedulerService
 *
 * Manages all scheduled background jobs.
 * Initializes recurring tasks on module startup.
 */
@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name)

  constructor(
    @InjectQueue('scheduler')
    private readonly schedulerQueue: Queue,
    private readonly rssFeedRefreshService: RssFeedRefreshService,
  ) {}

  /**
   * Initialize scheduled jobs when module starts
   */
  async onModuleInit() {
    await this.initializeScheduledJobs()
  }

  /**
   * Setup all recurring jobs
   */
  private async initializeScheduledJobs() {
    this.logger.log('Initializing scheduled jobs...')

    try {
      // RSS Feed Refresh - Every hour
      await this.schedulerQueue.add(
        'refresh-all-rss-feeds',
        {},
        {
          repeat: {
            pattern: '0 * * * *', // Every hour at minute 0
          },
          jobId: 'refresh-all-rss-feeds-recurring',
        },
      )

      this.logger.log('RSS feed refresh job scheduled (hourly)')

      // Future scheduled jobs:
      // - Newsletter polling
      // - YouTube channel updates
      // - Social media imports

      this.logger.log('All scheduled jobs initialized successfully')
    } catch (error) {
      this.logger.error('Failed to initialize scheduled jobs', error)
      throw error
    }
  }

  /**
   * Manually trigger RSS feed refresh
   * (for testing or user-requested refresh)
   */
  async triggerRssFeedRefresh(): Promise<void> {
    await this.schedulerQueue.add('refresh-all-rss-feeds', {}, {
      priority: 1, // High priority for manual triggers
    })
  }

  /**
   * Get scheduler queue metrics
   */
  async getQueueMetrics() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.schedulerQueue.getWaitingCount(),
      this.schedulerQueue.getActiveCount(),
      this.schedulerQueue.getCompletedCount(),
      this.schedulerQueue.getFailedCount(),
      this.schedulerQueue.getDelayedCount(),
    ])

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    }
  }
}
