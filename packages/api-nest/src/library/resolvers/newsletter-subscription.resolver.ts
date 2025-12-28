import { UseGuards } from '@nestjs/common'
import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql'

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../../user/decorators/current-user.decorator'
import { User } from '../../user/entities/user.entity'
import {
  NewsletterEmailResult,
  NewsletterSubscription,
  NewsletterSubscriptionResult,
  UpdateNewsletterSubscriptionInput,
} from '../dto/newsletter-subscription.type'
import { NewsletterSubscriptionService } from '../services/newsletter-subscription.service'

@Resolver(() => NewsletterSubscription)
@UseGuards(JwtAuthGuard)
export class NewsletterSubscriptionResolver {
  constructor(
    private readonly newsletterService: NewsletterSubscriptionService,
  ) {}

  /**
   * Get user's unique newsletter email address
   */
  @Query(() => NewsletterEmailResult)
  async newsletterEmail(
    @CurrentUser() user: User,
  ): Promise<NewsletterEmailResult> {
    if (!user.emailAlias) {
      throw new Error('User does not have a newsletter email address')
    }

    return {
      newsletterEmail: user.newsletterEmail,
      emailAlias: user.emailAlias,
    }
  }

  /**
   * Get all newsletter subscriptions for the current user
   */
  @Query(() => [NewsletterSubscription])
  async newsletterSubscriptions(
    @Args('activeOnly', { type: () => Boolean, defaultValue: true })
    activeOnly: boolean,
    @CurrentUser() user: User,
  ): Promise<NewsletterSubscription[]> {
    const subscriptions = await this.newsletterService.getUserNewsletters(
      user.id,
      activeOnly,
    )

    return subscriptions.map((sub) => ({
      id: sub.id,
      userId: sub.userId,
      senderEmail: sub.senderEmail,
      emailAlias: sub.emailAlias,
      title: sub.title,
      description: sub.description,
      siteUrl: sub.siteUrl,
      siteIcon: sub.siteIcon,
      lastReceivedAt: sub.lastFetchedAt,
      itemCount: sub.itemCount,
      active: sub.active,
      folder: sub.folder,
      autoAddLabels: sub.autoAddLabels,
      unsubscribeMailTo: sub.unsubscribeMailTo,
      unsubscribeHttpUrl: sub.unsubscribeHttpUrl,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    }))
  }

  @Mutation(() => NewsletterSubscriptionResult)
  async createNewsletterSubscription(
    @Args('name', { description: 'Newsletter name (e.g., "Morning Brew")' })
    name: string,
    @CurrentUser() user: User,
  ): Promise<NewsletterSubscriptionResult> {
    try {
      if (!name || name.trim().length === 0) {
        return {
          success: false,
          message: 'Newsletter name is required',
          errors: ['Name cannot be empty'],
        }
      }

      const subscription = await this.newsletterService.createNewsletterSlot(
        user.id,
        name.trim(),
      )

      return {
        success: true,
        message: `Newsletter subscription created. Use ${subscription.getNewsletterEmail()} to subscribe.`,
        subscription: {
          id: subscription.id,
          userId: subscription.userId,
          senderEmail: subscription.senderEmail,
          emailAlias: subscription.emailAlias,
          title: subscription.title,
          description: subscription.description,
          siteUrl: subscription.siteUrl,
          siteIcon: subscription.siteIcon,
          lastReceivedAt: subscription.lastFetchedAt,
          itemCount: subscription.itemCount,
          active: subscription.active,
          folder: subscription.folder,
          autoAddLabels: subscription.autoAddLabels,
          unsubscribeMailTo: subscription.unsubscribeMailTo,
          unsubscribeHttpUrl: subscription.unsubscribeHttpUrl,
          createdAt: subscription.createdAt,
          updatedAt: subscription.updatedAt,
        },
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create newsletter subscription',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }
    }
  }

  /**
   * Unsubscribe from a newsletter
   */
  @Mutation(() => NewsletterSubscriptionResult)
  async unsubscribeFromNewsletter(
    @Args('subscriptionId', { type: () => ID }) subscriptionId: string,
    @Args('deleteItems', {
      type: () => Boolean,
      defaultValue: true,
      description:
        'Whether to delete library items from this newsletter (default: true)',
    })
    deleteItems: boolean,
    @CurrentUser() user: User,
  ): Promise<NewsletterSubscriptionResult> {
    try {
      await this.newsletterService.unsubscribe(
        subscriptionId,
        user.id,
        deleteItems,
      )

      return {
        success: true,
        message: deleteItems
          ? 'Unsubscribed from newsletter and deleted items'
          : 'Unsubscribed from newsletter (items preserved)',
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to unsubscribe: ${
          error instanceof Error ? error.message : 'Failed to unsubscribe'
        }`,
        errors: [
          error instanceof Error ? error.message : 'Failed to unsubscribe',
        ],
      }
    }
  }

  /**
   * Update newsletter subscription settings
   */
  @Mutation(() => NewsletterSubscriptionResult)
  async updateNewsletterSettings(
    @Args('subscriptionId', { type: () => ID }) subscriptionId: string,
    @Args('settings') settings: UpdateNewsletterSubscriptionInput,
    @CurrentUser() user: User,
  ): Promise<NewsletterSubscriptionResult> {
    try {
      const subscription = await this.newsletterService.updateSettings(
        subscriptionId,
        user.id,
        settings,
      )

      if (!subscription) {
        return {
          success: false,
          message: 'Newsletter subscription not found',
          errors: ['Subscription not found or access denied'],
        }
      }

      return {
        success: true,
        message: 'Newsletter settings updated',
        subscription: {
          id: subscription.id,
          userId: subscription.userId,
          senderEmail: subscription.senderEmail,
          emailAlias: subscription.emailAlias,
          title: subscription.title,
          description: subscription.description,
          siteUrl: subscription.siteUrl,
          siteIcon: subscription.siteIcon,
          lastReceivedAt: subscription.lastFetchedAt,
          itemCount: subscription.itemCount,
          active: subscription.active,
          folder: subscription.folder,
          autoAddLabels: subscription.autoAddLabels,
          unsubscribeMailTo: subscription.unsubscribeMailTo,
          unsubscribeHttpUrl: subscription.unsubscribeHttpUrl,
          createdAt: subscription.createdAt,
          updatedAt: subscription.updatedAt,
        },
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to update settings: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        errors: [
          error instanceof Error ? error.message : 'Failed to update settings',
        ],
      }
    }
  }

  /**
   * Field resolver for newsletterEmail (subscription alias only for better security)
   * Format: {subscriptionAlias}@inbox.omnivore.app
   *
   * Security: Using subscription-only alias (no user prefix) prevents:
   * - User enumeration attacks
   * - Pattern recognition across subscriptions
   * - Privacy leaks when forwarding emails
   */
  @ResolveField('newsletterEmail', () => String, { nullable: true })
  async resolveNewsletterEmail(
    @Parent() subscription: NewsletterSubscription,
  ): Promise<string | null> {
    if (!subscription.emailAlias) {
      return null
    }

    // TODO: Make domain configurable via environment variable
    return `${subscription.emailAlias}@inbox.omnivore.app`
  }

  /**
   * Field resolver for unreadCount (computed from library items)
   */
  @ResolveField(() => Number, { nullable: true })
  async unreadCount(
    @Parent() subscription: NewsletterSubscription,
    @CurrentUser() user: User,
  ): Promise<number | null> {
    try {
      return await this.newsletterService.getUnreadCount(
        subscription.id,
        user.id,
      )
    } catch {
      return null
    }
  }
}
