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

import { EntityLabel } from '../../label/entities/entity-label.entity'
import { RssFeedEntity } from './rss-feed.entity'
import { User } from '../../user/entities/user.entity'

export enum LibraryItemState {
  FAILED = 'FAILED',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  DELETED = 'DELETED',
  ARCHIVED = 'ARCHIVED',
  CONTENT_NOT_FETCHED = 'CONTENT_NOT_FETCHED',
}

export enum ContentReaderType {
  WEB = 'WEB',
  PDF = 'PDF',
  EPUB = 'EPUB',
}

/**
 * Content type enum for different content sources
 * Used to determine which extractor to use during content processing
 */
export enum ContentType {
  ARTICLE = 'ARTICLE', // Web articles (default)
  PDF = 'PDF', // PDF documents
  RSS_FEED = 'RSS_FEED', // RSS/Atom feeds
  VIDEO = 'VIDEO', // YouTube, Vimeo, etc.
  TWITTER_THREAD = 'TWITTER', // Twitter/X threads
  UNKNOWN = 'UNKNOWN', // Could not determine
}

@Entity({ name: 'library_item', schema: 'omnivore' })
export class LibraryItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string

  /**
   * Optional link to RSS feed subscription
   * Set when item is imported from an RSS feed
   */
  // @ManyToOne('RssFeedEntity', { nullable: true, onDelete: 'SET NULL' })
  // @JoinColumn({ name: 'subscription_id' })
  // subscription?: RssFeedEntity | null

  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  subscriptionId?: string | null

  @Column({
    type: 'enum',
    enum: LibraryItemState,
    default: LibraryItemState.SUCCEEDED,
  })
  state!: LibraryItemState

  @Column({ name: 'original_url', type: 'text' })
  originalUrl!: string

  @Column({ type: 'text' })
  slug!: string

  @Column({ type: 'text' })
  title!: string

  @Column({ type: 'text', nullable: true })
  author?: string | null

  @Column({ type: 'text', nullable: true })
  description?: string | null

  @Column({ name: 'saved_at', type: 'timestamptz' })
  savedAt!: Date

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date | null

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt?: Date | null

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  @Column({ name: 'word_count', type: 'integer', nullable: true })
  wordCount?: number | null

  @Column({ name: 'site_name', type: 'text', nullable: true })
  siteName?: string | null

  @Column({ name: 'site_icon', type: 'text', nullable: true })
  siteIcon?: string | null

  /**
   * SHA-256 hash of sanitized content for version tracking
   * Used by sentinel-based reading progress to detect content changes
   */
  @Column({ name: 'content_hash', type: 'varchar', length: 64, nullable: true })
  contentHash?: string | null

  /**
   * Total number of sentinel markers in the article content
   * Used to calculate reading progress percentage
   */
  @Column({ name: 'total_sentinels', type: 'integer', default: 0 })
  totalSentinels!: number

  @Column({ type: 'text', nullable: true })
  thumbnail?: string | null

  /**
   * Content type detected from URL/source
   * Single source of truth for content classification
   * Used to route to appropriate extractor and determine reader display
   */
  @Column({
    name: 'item_type', // Reuse existing column name for easier migration
    type: 'varchar',
    length: 50,
    default: ContentType.ARTICLE,
  })
  contentType!: ContentType

  /**
   * Folder location derived from item state and source
   * Computed property - not stored in database
   *
   * RSS feed items go to "following" folder by default
   * User-saved items go to "inbox" folder
   */
  get folder(): string {
    switch (this.state) {
      case LibraryItemState.ARCHIVED:
        return 'archive'
      case LibraryItemState.DELETED:
        return 'trash'
      default:
        // RSS feed items go to "following" folder
        return this.subscriptionId ? 'following' : 'inbox'
    }
  }

  /**
   * Content reader type derived from content type
   * Determines which UI component renders the content
   * Computed property - not stored in database
   */
  get contentReader(): ContentReaderType {
    switch (this.contentType) {
      case ContentType.PDF:
        return ContentReaderType.PDF
      // Future: Add EPUB support
      // case ContentType.EPUB:
      //   return ContentReaderType.EPUB
      default:
        return ContentReaderType.WEB
    }
  }

  @Column({
    name: 'label_names',
    type: 'text',
    array: true,
    nullable: true,
    default: [],
  })
  labelNames?: string[] | null

  @Column({ name: 'readable_content', type: 'text', default: '' })
  readableContent!: string

  @Column({ type: 'text', nullable: true })
  note?: string | null

  @Column({ name: 'note_updated_at', type: 'timestamptz', nullable: true })
  noteUpdatedAt?: Date | null

  @OneToMany(() => EntityLabel, (entityLabel) => entityLabel.libraryItem)
  entityLabels!: EntityLabel[]
}
