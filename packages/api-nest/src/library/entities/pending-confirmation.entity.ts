/**
 * PendingConfirmationEntity - Tracks newsletter subscription confirmations
 *
 * When users subscribe to newsletters, confirmation emails arrive at their
 * Omnivore address. We forward these to their primary email and track the
 * pending confirmation to provide better UX and support.
 *
 * This entity enables:
 * - Showing pending confirmations in UI
 * - Resending confirmation emails
 * - Auto-marking as confirmed when first newsletter arrives
 * - Support debugging
 * - Product analytics
 */

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

export enum NewsletterPlatform {
  SUBSTACK = 'substack',
  BEEHIIV = 'beehiiv',
  MAILCHIMP = 'mailchimp',
  CONVERTKIT = 'convertkit',
  GHOST = 'ghost',
  BUTTONDOWN = 'buttondown',
  REVUE = 'revue',
  UNKNOWN = 'unknown',
}

@Entity('pending_confirmation')
export class PendingConfirmationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id' })
  userId: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User

  // Newsletter information
  @Column({ name: 'newsletter_sender' })
  newsletterSender: string

  @Column({ name: 'newsletter_name' })
  newsletterName: string

  @Column({ name: 'newsletter_platform', nullable: true })
  newsletterPlatform?: NewsletterPlatform

  // Original confirmation email (stored for resending)
  @Column({ name: 'confirmation_email_html', type: 'text' })
  confirmationEmailHtml: string

  @Column({ name: 'confirmation_email_text', type: 'text', nullable: true })
  confirmationEmailText?: string

  @Column({ name: 'confirmation_url', nullable: true })
  confirmationUrl?: string

  // Forwarding tracking
  @Column({ name: 'forwarded_to' })
  forwardedTo: string

  @Column({ name: 'forward_attempts', default: 0 })
  forwardAttempts: number

  @Column({ name: 'last_forwarded_at' })
  lastForwardedAt: Date

  @Column({ name: 'forwarded_to_emails', type: 'simple-array', nullable: true })
  forwardedToEmails?: string[]

  // Status
  @Column({ default: false })
  confirmed: boolean

  @Column({ name: 'confirmed_at', nullable: true })
  confirmedAt?: Date

  @Column({ default: false })
  expired: boolean

  @Column({ name: 'expires_at' })
  expiresAt: Date

  @Column({ name: 'user_dismissed', default: false })
  userDismissed: boolean

  // Metadata for support and debugging
  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    originalHeaders?: Record<string, string | string[]>
    spamScore?: number
    bounced?: boolean
    bounceReason?: string
    detectedPlatformFrom?: 'domain' | 'html' | 'manual'
    [key: string]: any
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  // Computed properties
  get isPending(): boolean {
    return !this.confirmed && !this.expired && !this.userDismissed
  }

  get durationPending(): number {
    return Date.now() - this.createdAt.getTime()
  }

  get durationPendingHours(): number {
    return Math.floor(this.durationPending / (60 * 60 * 1000))
  }

  get shouldSendReminder(): boolean {
    // Remind after 48 hours
    return this.isPending && this.durationPending > 48 * 60 * 60 * 1000
  }

  get isStale(): boolean {
    // Consider stale after 7 days (should be expired by then)
    return this.durationPending > 7 * 24 * 60 * 60 * 1000
  }

  get timeUntilExpiry(): number {
    return this.expiresAt.getTime() - Date.now()
  }

  get isExpiringSoon(): boolean {
    // Expiring within 24 hours
    return (
      this.timeUntilExpiry < 24 * 60 * 60 * 1000 && this.timeUntilExpiry > 0
    )
  }
}
