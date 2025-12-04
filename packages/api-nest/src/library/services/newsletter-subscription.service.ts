/**
 * NewsletterSubscriptionService - Manage newsletter email subscriptions
 *
 * Single Responsibility: Handles newsletter-specific subscription operations.
 * RSS subscriptions are handled by RssSubscriptionService.
 *
 * Part of ARC-016 Phase 2: Newsletter Infrastructure
 */

import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { customAlphabet } from 'nanoid'

import { REPOSITORY_TOKENS } from '../../repositories/injection-tokens'
import {
  ILibraryItemRepository,
  ISubscriptionRepository,
} from '../../repositories/interfaces'
import { SubscriptionMetadata } from '../../repositories/subscription.repository'
import {
  SubscriptionEntity,
  SubscriptionSourceType,
} from '../entities/subscription.entity'

// Generate URL-safe email aliases (8 characters, lowercase alphanumeric)
const generateEmailAlias = customAlphabet(
  'abcdefghijklmnopqrstuvwxyz0123456789',
  8,
)

@Injectable()
export class NewsletterSubscriptionService {
  private readonly logger = new Logger(NewsletterSubscriptionService.name)

  constructor(
    @Inject(REPOSITORY_TOKENS.ISubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(REPOSITORY_TOKENS.ILibraryItemRepository)
    private readonly libraryItemRepository: ILibraryItemRepository,
  ) {}

  /**
   * Find or create a newsletter subscription by sender email
   * This is called when an email arrives from a newsletter
   *
   * @param userId - User ID
   * @param senderEmail - Sender email address (e.g., "writer@substack.com")
   * @param metadata - Optional metadata (title, description, etc.)
   * @returns Found or created newsletter subscription
   */
  async findOrCreateByEmail(
    userId: string,
    senderEmail: string,
    metadata?: SubscriptionMetadata,
  ): Promise<SubscriptionEntity> {
    this.logger.log(
      `Finding or creating newsletter subscription for ${userId} from ${senderEmail}`,
    )

    // Check if already subscribed
    const existing = await this.subscriptionRepository.findBySource(
      userId,
      SubscriptionSourceType.NEWSLETTER,
      senderEmail,
    )

    if (existing) {
      // Reactivate if inactive
      if (!existing.active) {
        await this.subscriptionRepository.activate(existing.id)
        this.logger.log(`Reactivated newsletter subscription: ${existing.id}`)
      }

      return existing
    }

    // Generate unique email alias for this subscription
    const emailAlias = await this.generateUniqueEmailAlias()

    // Create new subscription
    const subscription = await this.subscriptionRepository.createNewsletter(
      userId,
      senderEmail,
      emailAlias,
      {
        ...metadata,
        title: metadata?.title || this.extractTitleFromEmail(senderEmail),
      },
    )

    this.logger.log(
      `Auto-created newsletter subscription ${subscription.id} for ${senderEmail}`,
    )

    return subscription
  }

  /**
   * Get all newsletter subscriptions for a user
   *
   * @param userId - User ID
   * @param activeOnly - Only return active subscriptions (default: true)
   */
  async getUserNewsletters(
    userId: string,
    activeOnly = true,
  ): Promise<SubscriptionEntity[]> {
    return this.subscriptionRepository.findByUser(
      userId,
      SubscriptionSourceType.NEWSLETTER,
      activeOnly,
    )
  }

  /**
   * Unsubscribe from a newsletter
   *
   * @param subscriptionId - Newsletter subscription ID
   * @param userId - User ID
   * @param deleteItems - Whether to delete library items from this newsletter (default: true)
   */
  async unsubscribe(
    subscriptionId: string,
    userId: string,
    deleteItems = true,
  ): Promise<void> {
    this.logger.log(
      `User ${userId} unsubscribing from newsletter: ${subscriptionId} (deleteItems: ${deleteItems})`,
    )

    const subscription = await this.subscriptionRepository.findById(
      subscriptionId,
      userId,
    )
    if (!subscription) {
      throw new NotFoundException(`Newsletter ${subscriptionId} not found`)
    }

    if (!subscription.isNewsletter) {
      throw new Error(
        'Can only unsubscribe from newsletters using this service',
      )
    }

    // Delete library items from this newsletter if requested
    if (deleteItems) {
      this.logger.log(
        `Deleting library items for newsletter: ${subscriptionId}`,
      )
      await this.libraryItemRepository.deleteBySubscription(
        subscriptionId,
        userId,
      )
    }

    // Fully delete the subscription
    await this.subscriptionRepository.delete(subscriptionId)

    this.logger.log(`Deleted newsletter subscription: ${subscriptionId}`)
  }

  /**
   * Get unread count for a newsletter
   *
   * @param subscriptionId - Newsletter subscription ID
   * @param userId - User ID
   * @returns Number of unread items
   */
  async getUnreadCount(
    subscriptionId: string,
    userId: string,
  ): Promise<number> {
    return this.subscriptionRepository.getUnreadCount(subscriptionId, userId)
  }

  /**
   * Update newsletter settings
   *
   * @param subscriptionId - Newsletter subscription ID
   * @param userId - User ID
   * @param settings - Settings to update
   */
  async updateSettings(
    subscriptionId: string,
    userId: string,
    settings: {
      title?: string
      folder?: string
      autoAddLabels?: string[]
      unsubscribeMailTo?: string
      unsubscribeHttpUrl?: string
    },
  ): Promise<SubscriptionEntity> {
    const subscription = await this.subscriptionRepository.findById(
      subscriptionId,
      userId,
    )
    if (!subscription) {
      throw new NotFoundException(`Newsletter ${subscriptionId} not found`)
    }

    if (!subscription.isNewsletter) {
      throw new Error('Can only update newsletter settings using this service')
    }

    await this.subscriptionRepository.updateSettings(
      subscriptionId,
      userId,
      settings,
    )

    // Return updated subscription
    const updated = await this.subscriptionRepository.findById(
      subscriptionId,
      userId,
    )
    if (!updated) {
      throw new NotFoundException(
        `Newsletter ${subscriptionId} not found after update`,
      )
    }

    return updated
  }

  /**
   * Find newsletter subscription by email alias
   * Used for email routing
   *
   * @param emailAlias - Email alias (e.g., "abc123xyz")
   * @returns Newsletter subscription or null
   */
  async findByEmailAlias(
    emailAlias: string,
  ): Promise<SubscriptionEntity | null> {
    return this.subscriptionRepository.findByEmailAlias(emailAlias)
  }

  /**
   * Generate a unique email alias for a subscription
   * Ensures no collisions with existing aliases
   *
   * @returns Unique email alias
   * @private
   */
  private async generateUniqueEmailAlias(): Promise<string> {
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      const alias = generateEmailAlias()

      // Check if alias already exists
      const existing = await this.subscriptionRepository.findByEmailAlias(alias)

      if (!existing) {
        return alias
      }

      attempts++
      this.logger.warn(
        `Email alias collision detected: ${alias} (attempt ${attempts}/${maxAttempts})`,
      )
    }

    // If we still have collisions after max attempts, add timestamp
    const alias = `${generateEmailAlias()}-${Date.now()}`
    this.logger.warn(
      `Using timestamped alias after ${maxAttempts} collisions: ${alias}`,
    )

    return alias
  }

  /**
   * Extract a reasonable title from an email address
   * e.g., "writer@substack.com" -> "Writer Newsletter"
   *
   * @param email - Email address
   * @returns Formatted title
   * @private
   */
  private extractTitleFromEmail(email: string): string {
    try {
      const [localPart, domain] = email.toLowerCase().split('@')

      // Extract domain name without TLD
      const domainName = domain.split('.')[0]

      // Capitalize first letter of local part
      const formattedLocal =
        localPart.charAt(0).toUpperCase() + localPart.slice(1)

      // If domain is a known newsletter provider, use local part
      const newsletterProviders = [
        'substack',
        'ghost',
        'convertkit',
        'mailchimp',
        'beehiiv',
      ]
      if (newsletterProviders.includes(domainName)) {
        return `${formattedLocal} Newsletter`
      }

      // Otherwise, use domain name
      const formattedDomain =
        domainName.charAt(0).toUpperCase() + domainName.slice(1)

      return `${formattedDomain} Newsletter`
    } catch {
      return 'Newsletter'
    }
  }
}
