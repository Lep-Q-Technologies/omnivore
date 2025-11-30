import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { RssFeedEntity } from '../library/entities/rss-feed.entity'
import { IRssFeedRepository } from './interfaces'

/**
 * Feed metadata for creating/updating feeds
 */
export interface RssFeedMetadata {
  title?: string
  description?: string
  siteUrl?: string
  siteIcon?: string
}

/**
 * Repository for RssFeed entity
 * Handles all data access operations for RSS feed subscriptions
 */
@Injectable()
export class RssFeedRepository implements IRssFeedRepository {
  constructor(
    @InjectRepository(RssFeedEntity)
    private readonly repository: Repository<RssFeedEntity>,
  ) {}

  /**
   * Find a feed by ID and user ID
   */
  async findById(id: string, userId: string): Promise<RssFeedEntity | null> {
    return this.repository.findOne({
      where: {
        id,
        userId,
      },
    })
  }

  /**
   * Find a feed by URL and user ID
   */
  async findByUrl(
    feedUrl: string,
    userId: string,
  ): Promise<RssFeedEntity | null> {
    return this.repository.findOne({
      where: {
        feedUrl,
        userId,
      },
    })
  }

  /**
   * Get all feeds for a user
   *
   * @param userId - User ID
   * @param activeOnly - Only return active feeds (default: true)
   */
  async findByUser(
    userId: string,
    activeOnly = true,
  ): Promise<RssFeedEntity[]> {
    const where: any = { userId }
    if (activeOnly) {
      where.active = true
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
  async create(
    userId: string,
    feedUrl: string,
    metadata?: RssFeedMetadata,
  ): Promise<RssFeedEntity> {
    const feed = this.repository.create({
      userId,
      user: { id: userId } as any,
      feedUrl,
      title: metadata?.title,
      description: metadata?.description,
      siteUrl: metadata?.siteUrl,
      siteIcon: metadata?.siteIcon,
      active: true,
      itemCount: 0,
      failureCount: 0,
    })

    return this.repository.save(feed)
  }

  /**
   * Update feed metadata after successful fetch
   *
   * @param feedId - Feed ID
   * @param metadata - Feed metadata to update
   */
  async updateMetadata(
    feedId: string,
    metadata: RssFeedMetadata,
  ): Promise<void> {
    await this.repository.update(feedId, metadata)
  }

  /**
   * Mark feed as successfully fetched
   *
   * @param feedId - Feed ID
   * @param itemsImported - Number of new items imported
   */
  async markFetched(feedId: string, itemsImported: number): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(RssFeedEntity)
      .set({
        lastFetchedAt: () => 'CURRENT_TIMESTAMP',
        itemCount: () => `item_count + ${itemsImported}`,
        failureCount: 0,
        lastError: null,
      })
      .where('id = :feedId', { feedId })
      .execute()
  }

  /**
   * Mark feed fetch as failed
   *
   * @param feedId - Feed ID
   * @param error - Error message
   */
  async markFailed(feedId: string, error: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(RssFeedEntity)
      .set({
        failureCount: () => 'failure_count + 1',
        lastError: error.substring(0, 1000), // Limit error message length
      })
      .where('id = :feedId', { feedId })
      .execute()
  }

  /**
   * Deactivate a feed subscription
   *
   * @param feedId - Feed ID
   */
  async deactivate(feedId: string): Promise<void> {
    await this.repository.update(feedId, { active: false })
  }

  /**
   * Activate a feed subscription
   *
   * @param feedId - Feed ID
   */
  async activate(feedId: string): Promise<void> {
    await this.repository.update(feedId, { active: true })
  }

  /**
   * Delete a feed subscription
   *
   * @param feedId - Feed ID
   */
  async delete(feedId: string): Promise<void> {
    await this.repository.delete(feedId)
  }

  /**
   * Get feeds that need refreshing
   *
   * Fetches active feeds that:
   * - Have never been fetched, OR
   * - Haven't been fetched in the last refreshInterval seconds
   *
   * @param refreshInterval - Minimum seconds since last fetch (default: 3600 = 1 hour)
   * @param limit - Maximum number of feeds to return
   */
  async getFeedsToRefresh(
    refreshInterval = 3600,
    limit = 100,
  ): Promise<RssFeedEntity[]> {
    return this.repository
      .createQueryBuilder('feed')
      .where('feed.active = :active', { active: true })
      .andWhere(
        '(feed.last_fetched_at IS NULL OR feed.last_fetched_at < NOW() - INTERVAL :interval SECOND)',
        { interval: refreshInterval },
      )
      .orderBy('feed.last_fetched_at', 'ASC', 'NULLS FIRST')
      .limit(limit)
      .getMany()
  }

  /**
   * Get unread count for a feed
   *
   * Counts library items from this feed that haven't been read
   *
   * @param feedId - Feed ID
   * @param userId - User ID
   * @returns Number of unread items
   */
  async getUnreadCount(feedId: string, userId: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('feed')
      .leftJoin('feed.libraryItems', 'item')
      .where('feed.id = :feedId', { feedId })
      .andWhere('feed.user_id = :userId', { userId })
      .andWhere('item.read_at IS NULL')
      .andWhere("item.state != 'DELETED'")
      .select('COUNT(item.id)', 'count')
      .getRawOne()

    return parseInt(result?.count || '0', 10)
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
    settings: Partial<{
      title: string
      autoAddToLibrary: boolean
      folder: string
    }>,
  ): Promise<void> {
    const updateData: any = {}

    if (settings.title !== undefined) {
      updateData.title = settings.title
    }

    await this.repository.update(
      {
        id: feedId,
        userId,
      },
      updateData,
    )
  }
}
