import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { LabelModule } from '../label/label.module'
import { QueueModule } from '../queue/queue.module'
import { RssFeedService } from '../queue/services/rss-feed.service'
import { RepositoriesModule } from '../repositories/repositories.module'
import { PendingConfirmationEntity } from './entities/pending-confirmation.entity'
import { LibraryController } from './library.controller'
import { LibraryResolver } from './library.resolver'
import { LibraryService } from './library.service'
import { NewsletterSubscriptionResolver } from './resolvers/newsletter-subscription.resolver'
import { PendingConfirmationResolver } from './resolvers/pending-confirmation.resolver'
import { RssFeedResolver } from './resolvers/rss-feed.resolver'
import { NewsletterSubscriptionService } from './services/newsletter-subscription.service'
import { PendingConfirmationService } from './services/pending-confirmation.service'
import { RssSubscriptionService } from './services/rss-subscription.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([PendingConfirmationEntity]),
    RepositoriesModule,
    LabelModule,
    QueueModule,
  ],
  controllers: [LibraryController],
  providers: [
    LibraryResolver,
    RssFeedResolver,
    NewsletterSubscriptionResolver,
    PendingConfirmationResolver,
    LibraryService,
    RssSubscriptionService,
    NewsletterSubscriptionService,
    PendingConfirmationService,
    RssFeedService,
  ],
  exports: [
    LibraryService,
    RssSubscriptionService,
    NewsletterSubscriptionService,
  ],
})
export class LibraryModule {}
