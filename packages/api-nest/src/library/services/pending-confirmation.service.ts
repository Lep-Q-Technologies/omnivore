/**
 * PendingConfirmationService - Manages newsletter subscription confirmations
 *
 * Handles the lifecycle of pending confirmations:
 * - Creating when confirmation email arrives
 * - Resending to same or different email
 * - Auto-marking as confirmed when newsletter starts arriving
 * - Expiring old confirmations
 * - Analytics and reporting
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { LessThan, Repository } from 'typeorm'

import {
  NewsletterPlatform,
  PendingConfirmationEntity,
} from '../entities/pending-confirmation.entity'

export interface CreatePendingConfirmationInput {
  userId: string
  newsletterSender: string
  newsletterName: string
  newsletterPlatform?: NewsletterPlatform
  confirmationEmailHtml: string
  confirmationEmailText?: string
  confirmationUrl?: string
  forwardedTo: string
  metadata?: Record<string, any>
}

export interface PendingConfirmationAnalytics {
  total: number
  confirmed: number
  expired: number
  pending: number
  dismissed: number
  conversionRate: number
  avgTimeToConfirm: number // milliseconds
  byPlatform: Record<
    string,
    {
      total: number
      confirmed: number
      conversionRate: number
    }
  >
}

@Injectable()
export class PendingConfirmationService {
  private readonly logger = new Logger(PendingConfirmationService.name)

  constructor(
    @InjectRepository(PendingConfirmationEntity)
    private readonly confirmationRepository: Repository<PendingConfirmationEntity>,
  ) {}

  /**
   * Create a new pending confirmation
   */
  async create(
    input: CreatePendingConfirmationInput,
  ): Promise<PendingConfirmationEntity> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const confirmation = this.confirmationRepository.create({
      userId: input.userId,
      newsletterSender: input.newsletterSender,
      newsletterName: input.newsletterName,
      newsletterPlatform: input.newsletterPlatform,
      confirmationEmailHtml: input.confirmationEmailHtml,
      confirmationEmailText: input.confirmationEmailText,
      confirmationUrl: input.confirmationUrl,
      forwardedTo: input.forwardedTo,
      forwardAttempts: 1,
      lastForwardedAt: new Date(),
      forwardedToEmails: [input.forwardedTo],
      expiresAt,
      metadata: input.metadata,
    })

    const saved = await this.confirmationRepository.save(confirmation)

    this.logger.log(
      `Created pending confirmation ${saved.id} for ${input.newsletterName} (${input.newsletterSender})`,
    )

    return saved
  }

  /**
   * Get all pending confirmations for a user
   */
  async getPendingConfirmations(
    userId: string,
  ): Promise<PendingConfirmationEntity[]> {
    return this.confirmationRepository.find({
      where: {
        userId,
        confirmed: false,
        expired: false,
        userDismissed: false,
      },
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * Get all confirmations (including completed) for a user
   */
  async getAllConfirmations(
    userId: string,
  ): Promise<PendingConfirmationEntity[]> {
    return this.confirmationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50, // Limit to recent 50
    })
  }

  /**
   * Get a specific confirmation
   */
  async getConfirmation(
    confirmationId: string,
    userId: string,
  ): Promise<PendingConfirmationEntity | null> {
    return this.confirmationRepository.findOne({
      where: { id: confirmationId, userId },
    })
  }

  /**
   * Resend confirmation email to same or different address
   */
  async resendConfirmation(
    confirmationId: string,
    userId: string,
    alternateEmail?: string,
  ): Promise<PendingConfirmationEntity> {
    const confirmation = await this.getConfirmation(confirmationId, userId)

    if (!confirmation) {
      throw new NotFoundException('Confirmation not found')
    }

    if (confirmation.confirmed) {
      throw new Error('Confirmation already completed')
    }

    if (confirmation.expired) {
      throw new Error('Confirmation has expired')
    }

    const targetEmail = alternateEmail || confirmation.forwardedTo

    // Update tracking
    const updated = await this.confirmationRepository.save({
      ...confirmation,
      forwardAttempts: confirmation.forwardAttempts + 1,
      lastForwardedAt: new Date(),
      forwardedTo: targetEmail,
      forwardedToEmails: [
        ...(confirmation.forwardedToEmails || []),
        ...(alternateEmail ? [alternateEmail] : []),
      ],
    })

    this.logger.log(
      `Resent confirmation ${confirmationId} to ${targetEmail} (attempt ${updated.forwardAttempts})`,
    )

    return updated
  }

  /**
   * Mark confirmation as dismissed (user not interested)
   */
  async dismissConfirmation(
    confirmationId: string,
    userId: string,
  ): Promise<void> {
    const result = await this.confirmationRepository.update(
      { id: confirmationId, userId },
      { userDismissed: true },
    )

    if (result.affected === 0) {
      throw new NotFoundException('Confirmation not found')
    }

    this.logger.log(`Dismissed confirmation ${confirmationId}`)
  }

  /**
   * Mark as confirmed (called when first newsletter email arrives)
   */
  async markAsConfirmed(
    newsletterSender: string,
    userId: string,
  ): Promise<boolean> {
    const confirmation = await this.confirmationRepository.findOne({
      where: {
        userId,
        newsletterSender,
        confirmed: false,
      },
    })

    if (!confirmation) {
      return false // No pending confirmation found
    }

    await this.confirmationRepository.update(confirmation.id, {
      confirmed: true,
      confirmedAt: new Date(),
    })

    this.logger.log(
      `Auto-confirmed newsletter ${newsletterSender} for user ${userId}`,
    )

    return true
  }

  /**
   * Expire old pending confirmations (runs daily via cron)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireOldConfirmations(): Promise<number> {
    const result = await this.confirmationRepository.update(
      {
        confirmed: false,
        expired: false,
        expiresAt: LessThan(new Date()),
      },
      { expired: true },
    )

    const count = result.affected || 0

    if (count > 0) {
      this.logger.log(`Expired ${count} old pending confirmations`)
    }

    return count
  }

  /**
   * Clean up very old confirmations (>30 days, runs weekly)
   */
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupOldConfirmations(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const result = await this.confirmationRepository.delete({
      createdAt: LessThan(thirtyDaysAgo),
    })

    const count = result.affected || 0

    if (count > 0) {
      this.logger.log(`Cleaned up ${count} old confirmations (>30 days)`)
    }

    return count
  }

  /**
   * Get analytics for confirmations
   */
  async getAnalytics(
    userId?: string,
    dateRange?: { start: Date; end: Date },
  ): Promise<PendingConfirmationAnalytics> {
    const query = this.confirmationRepository.createQueryBuilder('conf')

    if (userId) {
      query.where('conf.user_id = :userId', { userId })
    }

    if (dateRange) {
      query.andWhere('conf.created_at BETWEEN :start AND :end', dateRange)
    }

    const confirmations = await query.getMany()

    const total = confirmations.length
    const confirmed = confirmations.filter((c) => c.confirmed).length
    const expired = confirmations.filter((c) => c.expired).length
    const dismissed = confirmations.filter((c) => c.userDismissed).length
    const pending = confirmations.filter((c) => c.isPending).length

    // Calculate average time to confirm
    const confirmedOnes = confirmations.filter(
      (c) => c.confirmed && c.confirmedAt,
    )
    const avgTimeToConfirm =
      confirmedOnes.length > 0
        ? confirmedOnes.reduce(
            (sum, c) =>
              sum + (c.confirmedAt!.getTime() - c.createdAt.getTime()),
            0,
          ) / confirmedOnes.length
        : 0

    // Group by platform
    const byPlatform: Record<string, any> = {}
    const platforms = [
      ...new Set(confirmations.map((c) => c.newsletterPlatform || 'unknown')),
    ]

    for (const platform of platforms) {
      const platformConfs = confirmations.filter(
        (c) => (c.newsletterPlatform || 'unknown') === platform,
      )
      const platformConfirmed = platformConfs.filter((c) => c.confirmed).length

      byPlatform[platform] = {
        total: platformConfs.length,
        confirmed: platformConfirmed,
        conversionRate:
          platformConfs.length > 0
            ? platformConfirmed / platformConfs.length
            : 0,
      }
    }

    return {
      total,
      confirmed,
      expired,
      pending,
      dismissed,
      conversionRate: total > 0 ? confirmed / total : 0,
      avgTimeToConfirm,
      byPlatform,
    }
  }

  /**
   * Get confirmations that need reminders (pending >48 hours)
   */
  async getConfirmationsNeedingReminder(): Promise<
    PendingConfirmationEntity[]
  > {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)

    return this.confirmationRepository.find({
      where: {
        confirmed: false,
        expired: false,
        userDismissed: false,
        createdAt: LessThan(twoDaysAgo),
      },
    })
  }

  /**
   * Check if a confirmation exists for a newsletter
   */
  async hasPendingConfirmation(
    userId: string,
    newsletterSender: string,
  ): Promise<boolean> {
    const count = await this.confirmationRepository.count({
      where: {
        userId,
        newsletterSender,
        confirmed: false,
        expired: false,
        userDismissed: false,
      },
    })

    return count > 0
  }
}
