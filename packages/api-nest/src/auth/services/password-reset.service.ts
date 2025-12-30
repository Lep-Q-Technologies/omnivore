import { BadRequestException, Injectable, Logger } from '@nestjs/common'

import { AnalyticsService } from '../../analytics/analytics.service'
import { StructuredLogger } from '../../logging/structured-logger.service'
import { EmailService } from '../../notification/services/email.service'
import { RegistrationType } from '../../user/entities/user.entity'
import { UserService } from '../../user/user.service'
import { PasswordResetTokenStore } from '../password-reset-token.store'

/**
 * Dedicated service for password reset operations
 * Handles the complete password reset flow including:
 * - Token generation and storage
 * - Email sending
 * - Password validation and updates
 */
@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name)

  constructor(
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly passwordResetTokenStore: PasswordResetTokenStore,
    private readonly analytics: AnalyticsService,
    private readonly structuredLogger: StructuredLogger,
  ) {
    this.structuredLogger.setContext({ service: 'password-reset' })
  }

  /**
   * Request a password reset for a user
   * Generates a secure token and sends reset email
   * @param email - User's email address
   * @returns Success response (always returns success to prevent user enumeration)
   */
  async requestPasswordReset(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userService.findByEmail(
        email.trim().toLowerCase(),
      )

      if (!user) {
        // Don't reveal that user doesn't exist (prevent enumeration)
        this.structuredLogger.debug(
          `Password reset requested for non-existent email: ${email}`,
        )

        return {
          success: true,
          message: 'If the email exists, a password reset link has been sent',
        }
      }

      // Only allow password reset for email/password users
      if (user.source !== RegistrationType.EMAIL) {
        this.structuredLogger.warn(
          `Password reset attempted for OAuth user: ${user.email}`,
        )

        // Don't reveal the auth method (prevent enumeration)
        return {
          success: true,
          message: 'If the email exists, a password reset link has been sent',
        }
      }

      // Generate reset token
      const token = await this.passwordResetTokenStore.create({
        userId: user.id,
        email: user.email,
        createdAt: Date.now(),
      })

      // Send reset email
      await this.emailService.sendPasswordResetEmail(user.email, token)

      this.structuredLogger.log('Password reset email sent', {
        userId: user.id,
        email: user.email,
      })

      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      }
    } catch (error) {
      this.structuredLogger.error(
        `Error requesting password reset, email: ${email}, error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      )

      // Return success to prevent enumeration
      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      }
    }
  }

  /**
   * Reset a user's password using a reset token
   * @param token - Password reset token
   * @param newPassword - New password (plaintext, will be hashed)
   * @returns Success response
   * @throws BadRequestException if token is invalid or expired
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    // Retrieve and validate token (one-time use)
    const payload = await this.passwordResetTokenStore.retrieve(token)

    if (!payload) {
      throw new BadRequestException('Invalid or expired password reset token')
    }

    // Get user
    const user = await this.userService.findById(payload.userId)

    if (!user) {
      throw new BadRequestException('User not found')
    }

    // Verify email matches (extra security)
    if (user.email !== payload.email) {
      throw new BadRequestException('Token mismatch')
    }

    // Hash and update password
    await this.userService.updatePassword(user.id, newPassword)

    // Send confirmation email
    await this.emailService.sendPasswordChangedNotification(user.email)

    this.structuredLogger.log('Password reset successful', {
      userId: user.id,
      email: user.email,
    })

    // Track analytics
    this.analytics.trackPasswordReset(user.id, { email: user.email })

    return {
      success: true,
      message:
        'Password reset successful. You can now login with your new password.',
    }
  }
}
