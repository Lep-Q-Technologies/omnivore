import {
  SubscriptionEntity,
  SubscriptionSourceType,
} from 'src/library/entities/subscription.entity'

import { SubscriptionMetadata } from '../subscription.repository'

export interface ISubscriptionRepository {
  updateSourceIdentifier(
    subscriptionId: string,
    senderEmail: string,
  ): Promise<void>
  findById(id: string, userId: string): Promise<SubscriptionEntity | null>
  findBySource(
    userId: string,
    sourceType: SubscriptionSourceType,
    sourceIdentifier: string,
  ): Promise<SubscriptionEntity | null>
  findByEmailAlias(emailAlias: string): Promise<SubscriptionEntity | null>
  findByUser(
    userId: string,
    sourceType?: SubscriptionSourceType,
    activeOnly?: boolean,
  ): Promise<SubscriptionEntity[]>
  createRss(
    userId: string,
    feedUrl: string,
    metadata?: SubscriptionMetadata,
  ): Promise<SubscriptionEntity>
  createNewsletter(
    userId: string,
    senderEmail: string,
    emailAlias: string,
    metadata?: SubscriptionMetadata,
  ): Promise<SubscriptionEntity>
  updateMetadata(
    subscriptionId: string,
    metadata: SubscriptionMetadata,
  ): Promise<void>
  markFetched(subscriptionId: string, itemsImported: number): Promise<void>
  markFailed(subscriptionId: string, error: string): Promise<void>
  deactivate(subscriptionId: string): Promise<void>
  activate(subscriptionId: string): Promise<void>
  delete(subscriptionId: string): Promise<void>
  getFeedsToRefresh(
    refreshInterval?: number,
    limit?: number,
  ): Promise<SubscriptionEntity[]>
  getUnreadCount(subscriptionId: string, userId: string): Promise<number>
  updateSettings(
    subscriptionId: string,
    userId: string,
    settings: Partial<{
      title: string
      autoAddToLibrary: boolean
      folder: string
    }>,
  ): Promise<void>
}
