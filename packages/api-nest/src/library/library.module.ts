import { Module } from '@nestjs/common'
import { RssFeedService } from 'src/queue/services/rss-feed.service'

import { LabelModule } from '../label/label.module'
import { QueueModule } from '../queue/queue.module'
import { RepositoriesModule } from '../repositories/repositories.module'
import { LibraryController } from './library.controller'
import { LibraryResolver } from './library.resolver'
import { LibraryService } from './library.service'
import { RssFeedResolver } from './resolvers/rss-feed.resolver'
import { RssFeedSubscriptionService } from './services/rss-feed-subscription.service'

@Module({
  imports: [RepositoriesModule, LabelModule, QueueModule],
  controllers: [LibraryController],
  providers: [
    LibraryResolver,
    RssFeedResolver,
    LibraryService,
    RssFeedSubscriptionService,
    RssFeedService,
  ],
  exports: [LibraryService, RssFeedSubscriptionService],
})
export class LibraryModule {}
