import { Module } from '@nestjs/common'

import { LabelModule } from '../label/label.module'
import { QueueModule } from '../queue/queue.module'
import { RssFeedService } from '../queue/services/rss-feed.service'
import { RepositoriesModule } from '../repositories/repositories.module'
import { LibraryController } from './library.controller'
import { LibraryResolver } from './library.resolver'
import { LibraryService } from './library.service'
import { RssFeedResolver } from './resolvers/rss-feed.resolver'
import { NewsletterSubscriptionService } from './services/newsletter-subscription.service'
import { RssSubscriptionService } from './services/rss-subscription.service'

@Module({
  imports: [RepositoriesModule, LabelModule, QueueModule],
  controllers: [LibraryController],
  providers: [
    LibraryResolver,
    RssFeedResolver,
    LibraryService,
    RssSubscriptionService,
    NewsletterSubscriptionService,
    RssFeedService,
  ],
  exports: [
    LibraryService,
    RssSubscriptionService,
    NewsletterSubscriptionService,
  ],
})
export class LibraryModule {}
