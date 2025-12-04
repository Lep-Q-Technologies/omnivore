import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { LibraryItemEntity } from '../library/entities/library-item.entity'
import {
  SubscriptionEntity,
  SubscriptionSourceType,
} from '../library/entities/subscription.entity'
import { ISubscriptionRepository } from './interfaces'

/**
 * Subscription metadata for creating/updating subscriptions
 */
export interface SubscriptionMetadata {
  title?: string
  description?: string
  siteUrl?: string
  siteIcon?: string
  folder?: string
  autoAddLabels?: string[]
  unsubscribeMailTo?: string
  unsubscribeHttpUrl?: string
}

/**
 * Repository for Subscription entity
 * Handles all data access operations for subscriptions (RSS feeds, newsletters, etc.)
 */
@Injectable()
export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly repository: Repository<SubscriptionEntity>,
  ) {}

  /**
   * Find a subscription by ID and user ID
   */
  async findById(
    id: string,
    userId: string,
  ): Promise<SubscriptionEntity | null> {
    return this.repository.findOne({
      where: {
        id,
        userId,
      },
    })
  }

  /**
   * Find a subscription by source identifier and user ID
   *
   * @param sourceIdentifier - Feed URL for RSS, sender email for newsletter
   * @param userId - User ID
   * @param sourceType - Optional: filter by source type
   */
  async findBySource(
    userId: string,
    sourceType: SubscriptionSourceType,
    sourceIdentifier: string,
  ): Promise<SubscriptionEntity | null> {
    return this.repository.findOne({
      where: {
        userId,
        sourceType,
        sourceIdentifier,
      },
    })
  }

  /**
   * Find a newsletter subscription by email alias
   * Used for routing incoming newsletter emails
   *
   * @param emailAlias - The unique email alias for the subscription
   */
  async findByEmailAlias(
    emailAlias: string,
  ): Promise<SubscriptionEntity | null> {
    return this.repository.findOne({
      where: {
        emailAlias,
        sourceType: SubscriptionSourceType.NEWSLETTER,
      },
    })
  }

  /**
   * Get all subscriptions for a user
   *
   * @param userId - User ID
   * @param sourceType - Optional: filter by source type (RSS, NEWSLETTER, etc.)
   * @param activeOnly - Only return active subscriptions (default: true)
   */
  async findByUser(
    userId: string,
    sourceType?: SubscriptionSourceType,
    activeOnly = true,
  ): Promise<SubscriptionEntity[]> {
    const where: any = { userId }
    if (activeOnly) {
      where.active = true
    }
    if (sourceType) {
      where.sourceType = sourceType
    }

    return this.repository.find({
      where,
      order: {
        createdAt: 'DESC',
      },
    })
  }

  /**
   * Create a new RSS feed subscription
   *
   * @param userId - User ID
   * @param feedUrl - RSS feed URL
   * @param metadata - Optional feed metadata
   */
  async createRss(
    userId: string,
    feedUrl: string,
    metadata?: SubscriptionMetadata,
  ): Promise<SubscriptionEntity> {
    const subscription = this.repository.create({
      userId,
      user: { id: userId } as any,
      sourceType: SubscriptionSourceType.RSS,
      sourceIdentifier: feedUrl,
      emailAlias: null, // RSS doesn't use email aliases
      title: metadata?.title,
      description: metadata?.description,
      siteUrl: metadata?.siteUrl,
      siteIcon: metadata?.siteIcon,
      folder: metadata?.folder,
      autoAddLabels: metadata?.autoAddLabels,
      active: true,
      itemCount: 0,
      failureCount: 0,
    })

    return this.repository.save(subscription)
  }

  /**
   * Create a new newsletter subscription
   *
   * @param userId - User ID
   * @param senderEmail - Sender email address
   * @param emailAlias - Unique email alias for this subscription
   * @param metadata - Optional subscription metadata
   */
  async createNewsletter(
    userId: string,
    senderEmail: string,
    emailAlias: string,
    metadata?: SubscriptionMetadata,
  ): Promise<SubscriptionEntity> {
    const subscription = this.repository.create({
      userId,
      user: { id: userId } as any,
      sourceType: SubscriptionSourceType.NEWSLETTER,
      sourceIdentifier: senderEmail,
      emailAlias,
      title: metadata?.title || senderEmail,
      description: metadata?.description,
      siteUrl: metadata?.siteUrl,
      siteIcon: metadata?.siteIcon,
      folder: metadata?.folder,
      autoAddLabels: metadata?.autoAddLabels,
      unsubscribeMailTo: metadata?.unsubscribeMailTo,
      unsubscribeHttpUrl: metadata?.unsubscribeHttpUrl,
      active: true,
      itemCount: 0,
      failureCount: 0,
      lastFetchedAt: null, // Newsletters don't use polling
    })

    return this.repository.save(subscription)
  }

  /**
   * Update subscription metadata
   *
   * @param subscriptionId - Subscription ID
   * @param metadata - Subscription metadata to update
   */
  async updateMetadata(
    subscriptionId: string,
    metadata: SubscriptionMetadata,
  ): Promise<void> {
    await this.repository.update(subscriptionId, metadata)
  }

  /**
   * Mark subscription as successfully fetched/received
   * For RSS: after polling
   * For newsletters: after receiving email
   *
   * @param subscriptionId - Subscription ID
   * @param itemsImported - Number of new items imported
   */
  async markFetched(
    subscriptionId: string,
    itemsImported: number,
  ): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(SubscriptionEntity)
      .set({
        lastFetchedAt: () => 'CURRENT_TIMESTAMP',
        itemCount: () => `item_count + ${itemsImported}`,
        failureCount: 0,
        lastError: null,
      })
      .where('id = :subscriptionId', { subscriptionId })
      .execute()
  }

  /**
   * Mark subscription fetch as failed
   * Primarily for RSS polling errors
   *
   * @param subscriptionId - Subscription ID
   * @param error - Error message
   */
  async markFailed(subscriptionId: string, error: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(SubscriptionEntity)
      .set({
        failureCount: () => 'failure_count + 1',
        lastError: error.substring(0, 1000), // Limit error message length
      })
      .where('id = :subscriptionId', { subscriptionId })
      .execute()
  }

  /**
   * Deactivate a subscription
   * For RSS: stops polling
   * For newsletters: stops processing incoming emails
   *
   * @param subscriptionId - Subscription ID
   */
  async deactivate(subscriptionId: string): Promise<void> {
    await this.repository.update(subscriptionId, { active: false })
  }

  /**
   * Activate a subscription
   *
   * @param subscriptionId - Subscription ID
   */
  async activate(subscriptionId: string): Promise<void> {
    await this.repository.update(subscriptionId, { active: true })
  }

  /**
   * Delete a subscription
   *
   * @param subscriptionId - Subscription ID
   */
  async delete(subscriptionId: string): Promise<void> {
    await this.repository.delete(subscriptionId)
  }

  /**
   * Get RSS feeds that need refreshing
   *
   * Fetches active RSS feeds that:
   * - Have never been fetched, OR
   * - Haven't been fetched in the last refreshInterval seconds
   *
   * Note: Only returns RSS subscriptions (newsletters are push-based, not polled)
   *
   * @param refreshInterval - Minimum seconds since last fetch (default: 3600 = 1 hour)
   * @param limit - Maximum number of feeds to return
   */
  async getFeedsToRefresh(
    refreshInterval = 3600,
    limit = 100,
  ): Promise<SubscriptionEntity[]> {
    return this.repository
      .createQueryBuilder('subscription')
      .where('subscription.active = :active', { active: true })
      .andWhere('subscription.source_type = :sourceType', {
        sourceType: SubscriptionSourceType.RSS,
      })
      .andWhere(
        '(subscription.last_fetched_at IS NULL OR subscription.last_fetched_at < NOW() - INTERVAL :interval SECOND)',
        { interval: refreshInterval },
      )
      .orderBy('subscription.last_fetched_at', 'ASC', 'NULLS FIRST')
      .limit(limit)
      .getMany()
  }

  /**
   * Get unread count for a subscription
   *
   * Counts library items from this subscription that haven't been read
   *
   * @param subscriptionId - Subscription ID
   * @param userId - User ID
   * @returns Number of unread items
   */
  async getUnreadCount(
    subscriptionId: string,
    userId: string,
  ): Promise<number> {
    const result = await this.repository.manager
      .createQueryBuilder(LibraryItemEntity, 'item')
      .where('item.subscription_id = :subscriptionId', { subscriptionId })
      .andWhere('item.user_id = :userId', { userId })
      .andWhere('item.read_at IS NULL')
      .andWhere("item.state != 'DELETED'")
      .select('COUNT(item.id)', 'count')
      .getRawOne()

    return parseInt(result?.count || '0', 10)
  }

  /**
   * Update subscription settings
   *
   * @param subscriptionId - Subscription ID
   * @param userId - User ID
   * @param settings - Settings to update
   */
  async updateSettings(
    subscriptionId: string,
    userId: string,
    settings: Partial<{
      title: string
      folder: string
      autoAddLabels: string[]
      unsubscribeMailTo: string
      unsubscribeHttpUrl: string
    }>,
  ): Promise<void> {
    const updateData: Partial<SubscriptionEntity> = {}

    if (settings.title !== undefined) {
      updateData.title = settings.title
    }
    if (settings.folder !== undefined) {
      updateData.folder = settings.folder
    }
    if (settings.autoAddLabels !== undefined) {
      updateData.autoAddLabels = settings.autoAddLabels
    }
    if (settings.unsubscribeMailTo !== undefined) {
      updateData.unsubscribeMailTo = settings.unsubscribeMailTo
    }
    if (settings.unsubscribeHttpUrl !== undefined) {
      updateData.unsubscribeHttpUrl = settings.unsubscribeHttpUrl
    }

    await this.repository.update(
      {
        id: subscriptionId,
        userId,
      },
      updateData,
    )
  }
}
