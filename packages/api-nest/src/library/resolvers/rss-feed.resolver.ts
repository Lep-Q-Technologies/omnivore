import {
  Args,
  ID,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../../user/decorators/current-user.decorator'
import { User } from '../../user/entities/user.entity'
import { RssFeedSubscriptionService } from '../services/rss-feed-subscription.service'
import {
  RssFeed,
  RssFeedResult,
  UpdateRssFeedSettingsInput,
} from '../dto/rss-feed.type'

@Resolver(() => RssFeed)
@UseGuards(JwtAuthGuard)
export class RssFeedResolver {
  constructor(
    private readonly rssFeedSubscriptionService: RssFeedSubscriptionService,
  ) {}

  /**
   * Subscribe to an RSS feed
   */
  @Mutation(() => RssFeedResult)
  async subscribeToRssFeed(
    @Args('feedUrl') feedUrl: string,
    @Args('importItems', { type: () => Boolean, defaultValue: true })
    importItems: boolean,
    @CurrentUser() user: User,
  ): Promise<RssFeedResult> {
    try {
      const feed = await this.rssFeedSubscriptionService.subscribe(
        user.id,
        feedUrl,
        importItems,
      )

      return {
        success: true,
        message: importItems
          ? 'Subscribed to feed and importing items'
          : 'Subscribed to feed',
        feed,
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to subscribe to feed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }
    }
  }

  /**
   * Unsubscribe from an RSS feed
   */
  @Mutation(() => RssFeedResult)
  async unsubscribeFromRssFeed(
    @Args('feedId', { type: () => ID }) feedId: string,
    @Args('deleteItems', {
      type: () => Boolean,
      nullable: true,
      defaultValue: true,
      description:
        'Whether to delete library items from this feed (default: true)',
    })
    deleteItems: boolean,
    @CurrentUser() user: User,
  ): Promise<RssFeedResult> {
    try {
      await this.rssFeedSubscriptionService.unsubscribe(
        feedId,
        user.id,
        deleteItems,
      )

      return {
        success: true,
        message: deleteItems
          ? 'Unsubscribed from feed and deleted items'
          : 'Unsubscribed from feed (items kept)',
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to unsubscribe from feed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }
    }
  }

  /**
   * Refresh a feed and import new items
   */
  @Mutation(() => RssFeedResult)
  async refreshRssFeed(
    @Args('feedId', { type: () => ID }) feedId: string,
    @CurrentUser() user: User,
  ): Promise<RssFeedResult> {
    try {
      const result = await this.rssFeedSubscriptionService.refresh(
        feedId,
        user.id,
      )

      return {
        success: result.success,
        message: `Imported ${result.itemsImported} new items, skipped ${result.itemsSkipped} duplicates`,
        errors: result.errors.length > 0 ? result.errors : undefined,
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to refresh feed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }
    }
  }

  /**
   * Get all RSS feed subscriptions for the current user
   */
  @Query(() => [RssFeed])
  async rssFeeds(
    @Args('activeOnly', { type: () => Boolean, defaultValue: true })
    activeOnly: boolean,
    @CurrentUser() user: User,
  ): Promise<RssFeed[]> {
    return this.rssFeedSubscriptionService.getUserFeeds(user.id, activeOnly)
  }

  /**
   * Update RSS feed settings
   */
  @Mutation(() => RssFeedResult)
  async updateRssFeedSettings(
    @Args('feedId', { type: () => ID }) feedId: string,
    @Args('settings') settings: UpdateRssFeedSettingsInput,
    @CurrentUser() user: User,
  ): Promise<RssFeedResult> {
    try {
      const feed = await this.rssFeedSubscriptionService.updateSettings(
        feedId,
        user.id,
        settings,
      )

      return {
        success: true,
        message: 'Feed settings updated',
        feed,
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update feed settings',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }
    }
  }

  /**
   * Resolve unread count for a feed
   */
  @ResolveField(() => Int)
  async unreadCount(
    @Parent() feed: RssFeed,
    @CurrentUser() user: User,
  ): Promise<number> {
    return this.rssFeedSubscriptionService.getUnreadCount(feed.id, user.id)
  }
}
