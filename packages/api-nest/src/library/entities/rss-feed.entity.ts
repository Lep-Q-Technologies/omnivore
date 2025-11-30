import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

import { User } from '../../user/entities/user.entity'

/**
 * RSS Feed subscription entity
 *
 * Represents a user's subscription to an RSS/Atom feed.
 * When a user subscribes to a feed, articles from that feed
 * are automatically imported as library items.
 */
@Entity({ name: 'rss_feed', schema: 'omnivore' })
export class RssFeedEntity {
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
   * The RSS/Atom feed URL
   */
  @Column({ name: 'feed_url', type: 'varchar', length: 2048 })
  feedUrl!: string

  /**
   * Feed title extracted from feed metadata
   */
  @Column({ name: 'title', type: 'varchar', length: 512, nullable: true })
  title?: string | null

  /**
   * Feed description extracted from feed metadata
   */
  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string | null

  /**
   * Feed site URL (usually the blog/website home page)
   */
  @Column({ name: 'site_url', type: 'varchar', length: 2048, nullable: true })
  siteUrl?: string | null

  /**
   * Feed icon/favicon URL
   */
  @Column({ name: 'site_icon', type: 'varchar', length: 2048, nullable: true })
  siteIcon?: string | null

  /**
   * Last time we successfully fetched items from this feed
   */
  @Column({ name: 'last_fetched_at', type: 'timestamptz', nullable: true })
  lastFetchedAt?: Date | null

  /**
   * Total number of items imported from this feed
   */
  @Column({ name: 'item_count', type: 'integer', default: 0 })
  itemCount!: number

  /**
   * Whether this feed subscription is active
   * Inactive feeds are not refreshed
   */
  @Column({ name: 'active', type: 'boolean', default: true })
  active!: boolean

  /**
   * Last error message if feed fetch failed
   */
  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError?: string | null

  /**
   * Number of consecutive failures
   * Used to implement exponential backoff
   */
  @Column({ name: 'failure_count', type: 'integer', default: 0 })
  failureCount!: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}
