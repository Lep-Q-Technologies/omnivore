import { RssFeedEntity } from 'src/library/entities/rss-feed.entity'

import { RssFeedMetadata } from '../rss-feed.repository'

export interface IRssFeedRepository {
  findById(id: string, userId: string): Promise<RssFeedEntity | null>
  findByUrl(url: string, userId: string): Promise<RssFeedEntity | null>
  create(
    userId: string,
    feedUrl: string,
    metadata?: RssFeedMetadata,
  ): Promise<RssFeedEntity>
  delete(id: string): Promise<void>
  markFetched(feedId: string, itemsImported: number): Promise<void>
  markFailed(feedId: string, error: string): Promise<void>
  deactivate(feedId: string): Promise<void>
  activate(feedId: string): Promise<void>
  getFeedsToRefresh(
    refreshInterval?: number,
    limit?: number,
  ): Promise<RssFeedEntity[]>
  findByUser(userId: string, activeOnly?: boolean): Promise<RssFeedEntity[]>
  getUnreadCount(feedId: string, userId: string): Promise<number>
  updateSettings(
    feedId: string,
    userId: string,
    settings: Partial<{
      title: string
      autoAddToLibrary: boolean
      folder: string
    }>,
  ): Promise<void>
}
