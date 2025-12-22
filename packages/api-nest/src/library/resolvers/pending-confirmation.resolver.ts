import { UseGuards } from '@nestjs/common'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../../user/decorators/current-user.decorator'
import { User } from '../../user/entities/user.entity'
import { PendingConfirmationService } from '../services/pending-confirmation.service'
import {
  PendingConfirmation,
  PendingConfirmationAnalytics,
  PendingConfirmationResult,
} from '../types/pending-confirmation.types'

@Resolver(() => PendingConfirmation)
@UseGuards(JwtAuthGuard)
export class PendingConfirmationResolver {
  constructor(
    private readonly pendingConfirmationService: PendingConfirmationService,
  ) {}

  /**
   * Get all pending confirmations for the current user
   */
  @Query(() => [PendingConfirmation])
  async pendingConfirmations(
    @CurrentUser() user: User,
    @Args('includeCompleted', { type: () => Boolean, defaultValue: false })
    includeCompleted: boolean,
  ): Promise<PendingConfirmation[]> {
    if (includeCompleted) {
      return this.pendingConfirmationService.getAllConfirmations(user.id)
    }

    return this.pendingConfirmationService.getPendingConfirmations(user.id)
  }

  /**
   * Get a specific pending confirmation
   */
  @Query(() => PendingConfirmation, { nullable: true })
  async pendingConfirmation(
    @CurrentUser() user: User,
    @Args('confirmationId', { type: () => String }) confirmationId: string,
  ): Promise<PendingConfirmation | null> {
    return this.pendingConfirmationService.getConfirmation(
      confirmationId,
      user.id,
    )
  }

  /**
   * Get analytics for confirmations
   */
  @Query(() => PendingConfirmationAnalytics)
  async pendingConfirmationAnalytics(
    @CurrentUser() user: User,
  ): Promise<PendingConfirmationAnalytics> {
    return this.pendingConfirmationService.getAnalytics(user.id)
  }

  /**
   * Resend a confirmation email to same or different address
   */
  @Mutation(() => PendingConfirmationResult)
  async resendConfirmationEmail(
    @CurrentUser() user: User,
    @Args('confirmationId', { type: () => String }) confirmationId: string,
    @Args('alternateEmail', { type: () => String, nullable: true })
    alternateEmail?: string,
  ): Promise<PendingConfirmationResult> {
    try {
      const confirmation =
        await this.pendingConfirmationService.resendConfirmation(
          confirmationId,
          user.id,
          alternateEmail,
        )

      return {
        success: true,
        confirmation,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        errors: [message],
      }
    }
  }

  /**
   * Dismiss a pending confirmation (user not interested)
   */
  @Mutation(() => PendingConfirmationResult)
  async dismissConfirmation(
    @CurrentUser() user: User,
    @Args('confirmationId', { type: () => String }) confirmationId: string,
  ): Promise<PendingConfirmationResult> {
    try {
      await this.pendingConfirmationService.dismissConfirmation(
        confirmationId,
        user.id,
      )

      return {
        success: true,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        errors: [message],
      }
    }
  }
}
