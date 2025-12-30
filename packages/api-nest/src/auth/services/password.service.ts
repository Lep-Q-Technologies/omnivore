import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import * as bcrypt from 'bcrypt'

import { AnalyticsService } from '../../analytics/analytics.service'
import { StructuredLogger } from '../../logging/structured-logger.service'
import { EmailService } from '../../notification/services/email.service'
import { RegistrationType } from '../../user/entities/user.entity'
import { UserService } from '../../user/user.service'
import { PasswordResetTokenStore } from '../password-reset-token.store'

/**
 * Consolidated service for all password-related operations
 * Handles:
 * - Password hashing and validation
 * - Password updates
 * - Password reset flow (request + completion)
 */
@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name)

  private readonly BCRYPT_ROUNDS = 12

  constructor(
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly passwordResetTokenStore: PasswordResetTokenStore,
    private readonly analytics: AnalyticsService,
    private readonly structuredLogger: StructuredLogger,
  ) {
    this.structuredLogger.setContext({ service: 'password' })
  }

  // ==================== Password Hashing & Validation ====================

  /**
   * Hash a plaintext password using bcrypt
   * @param password - Plaintext password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.BCRYPT_ROUNDS)
  }

  /**
   * Validate a plaintext password against a hashed password
   * @param plaintext - Plaintext password
   * @param hashed - Hashed password
   * @returns True if password matches
   */
  async validatePassword(plaintext: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hashed)
  }

  /**
   * Validate password strength
   * @param password - Password to validate
   * @throws BadRequestException if password is too weak
   */
  validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      )
    }

    if (password.length > 128) {
      throw new BadRequestException('Password must be less than 128 characters')
    }

    // Optional: Add more strength checks (uppercase, lowercase, numbers, symbols)
    // For now, keeping it simple with length requirements only
  }

  // ==================== Password Update ====================

  /**
   * Update a user's password
   * @param userId - User ID
   * @param newPassword - New password (plaintext, will be hashed)
   * @returns Success confirmation
   */
  async updatePassword(
    userId: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    // Validate password strength
    this.validatePasswordStrength(newPassword)

    // Hash the new password
    const hashedPassword = await this.hashPassword(newPassword)

    // Update in database via UserService
    await this.userService.updatePasswordHash(userId, hashedPassword)

    this.structuredLogger.log('Password updated successfully', { userId })

    return { success: true }
  }

  // ==================== Password Reset Flow ====================

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
    // Validate password strength
    this.validatePasswordStrength(newPassword)

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
    const hashedPassword = await this.hashPassword(newPassword)
    await this.userService.updatePasswordHash(user.id, hashedPassword)

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
