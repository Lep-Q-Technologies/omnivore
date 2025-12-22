import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'

import { RssSubscriptionService } from '../library/services/rss-subscription.service'
import { QueueModule } from '../queue/queue.module'
import { RssFeedService } from '../queue/services/rss-feed.service'
import { RepositoriesModule } from '../repositories/repositories.module'
import { SchedulerService } from './scheduler.service'
import { RssFeedRefreshService } from './services/rss-feed-refresh.service'

/**
 * SchedulerModule
 *
 * Handles periodic background tasks for content ingestion:
 * - RSS feed refreshing
 * - Newsletter polling (future)
 * - YouTube channel updates (future)
 * - Social media imports (future)
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    RepositoriesModule,
    QueueModule,
    BullModule.registerQueue({
      name: 'scheduler',
    }),
  ],
  providers: [
    SchedulerService,
    RssFeedRefreshService,
    RssSubscriptionService,
    RssFeedService,
  ],
  exports: [SchedulerService, RssFeedRefreshService],
})
export class SchedulerModule {}
