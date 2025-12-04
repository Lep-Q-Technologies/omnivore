import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

import { User } from '../../user/entities/user.entity'

/**
 * Subscription source type enum
 * Defines the type of content source for a subscription
 */
export enum SubscriptionSourceType {
  RSS = 'RSS',
  NEWSLETTER = 'NEWSLETTER',
  // Future: PODCAST = 'PODCAST', YOUTUBE = 'YOUTUBE', etc.
}

/**
 * Unified subscription entity
 *
 * Represents a user's subscription to any content source:
 * - RSS/Atom feeds (auto-polled)
 * - Email newsletters (received via inbox)
 * - Future: Podcasts, YouTube channels, etc.
 *
 * When a user subscribes, content from that source is automatically
 * imported as library items and linked to this subscription.
 */
@Entity({ name: 'subscription', schema: 'omnivore' })
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string

  // Note: Removed @OneToMany relation to LibraryItemEntity to avoid circular dependency issues in tests
  // The @ManyToOne side in LibraryItemEntity is sufficient for the foreign key relationship

  /**
   * Type of subscription source
   */
  @Column({
    name: 'source_type',
    type: 'varchar',
    length: 20,
    default: SubscriptionSourceType.RSS,
  })
  sourceType!: SubscriptionSourceType

  /**
   * Source identifier
   * - RSS: Feed URL
   * - Newsletter: Sender email address
   */
  @Column({ name: 'source_identifier', type: 'varchar', length: 2048 })
  sourceIdentifier!: string

  /**
   * Unique email alias for newsletter subscriptions
   * Format: {subscription.emailAlias} becomes part of full email
   * Example: "b3n5p8q2" in "{user.emailAlias}+b3n5p8q2@inbox.omnivore.app"
   * NULL for RSS subscriptions
   */
  @Column({
    name: 'email_alias',
    type: 'varchar',
    length: 64,
    nullable: true,
    unique: true,
  })
  emailAlias?: string | null

  /**
   * Content title extracted from feed/newsletter metadata
   */
  @Column({ name: 'title', type: 'varchar', length: 512, nullable: true })
  title?: string | null

  /**
   * Content description extracted from feed/newsletter metadata
   */
  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string | null

  /**
   * Source site URL (usually the home page)
   */
  @Column({ name: 'site_url', type: 'varchar', length: 2048, nullable: true })
  siteUrl?: string | null

  /**
   * Source icon/favicon URL
   */
  @Column({ name: 'site_icon', type: 'varchar', length: 2048, nullable: true })
  siteIcon?: string | null

  /**
   * Optional folder to auto-route content from this subscription
   * NULL means use default folder logic (inbox or following)
   * Examples: 'tech-news', 'personal-dev', 'newsletters'
   */
  @Column({ name: 'folder', type: 'varchar', length: 255, nullable: true })
  folder?: string | null

  /**
   * Array of label names to automatically apply to items from this subscription
   * Examples: ['newsletter', 'tech'], ['weekly-digest']
   */
  @Column({
    name: 'auto_add_labels',
    type: 'text',
    array: true,
    nullable: true,
  })
  autoAddLabels?: string[] | null

  /**
   * Email address for unsubscribing (newsletters only)
   * Extracted from List-Unsubscribe email header
   * Example: "unsubscribe@newsletter.com"
   */
  @Column({ name: 'unsubscribe_mail_to', type: 'text', nullable: true })
  unsubscribeMailTo?: string | null

  /**
   * HTTP URL for unsubscribing (newsletters only)
   * Extracted from List-Unsubscribe email header
   * Example: "https://newsletter.com/unsubscribe?id=123"
   */
  @Column({ name: 'unsubscribe_http_url', type: 'text', nullable: true })
  unsubscribeHttpUrl?: string | null

  /**
   * Last time we successfully fetched/received items
   * - RSS: Last successful polling
   * - Newsletter: Last email received
   */
  @Column({ name: 'last_fetched_at', type: 'timestamptz', nullable: true })
  lastFetchedAt?: Date | null

  /**
   * Total number of items imported from this subscription
   */
  @Column({ name: 'item_count', type: 'integer', default: 0 })
  itemCount!: number

  /**
   * Whether this subscription is active
   * Inactive subscriptions:
   * - RSS: Not polled
   * - Newsletter: Emails still received but not processed
   */
  @Column({ name: 'active', type: 'boolean', default: true })
  active!: boolean

  /**
   * Last error message if fetch/processing failed
   * Primarily for RSS polling errors
   */
  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError?: string | null

  /**
   * Number of consecutive failures
   * Used for exponential backoff in RSS polling
   * Not typically used for newsletters
   */
  @Column({ name: 'failure_count', type: 'integer', default: 0 })
  failureCount!: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  /**
   * Helper method: Check if this is an RSS subscription
   */
  get isRss(): boolean {
    return this.sourceType === SubscriptionSourceType.RSS
  }

  /**
   * Helper method: Check if this is a newsletter subscription
   */
  get isNewsletter(): boolean {
    return this.sourceType === SubscriptionSourceType.NEWSLETTER
  }

  /**
   * Helper method: Get the feed URL for RSS subscriptions
   * Returns null for non-RSS subscriptions
   */
  get feedUrl(): string | null {
    return this.isRss ? this.sourceIdentifier : null
  }

  /**
   * Helper method: Get the sender email for newsletter subscriptions
   * Returns null for non-newsletter subscriptions
   */
  get senderEmail(): string | null {
    return this.isNewsletter ? this.sourceIdentifier : null
  }
}
