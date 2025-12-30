import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { AnalyticsService } from '../../analytics/analytics.service'
import { EnvVariables } from '../../config/env-variables'
import { IntercomService } from '../../integrations/intercom.service'
import { StructuredLogger } from '../../logging/structured-logger.service'
import { EmailService } from '../../notification/services/email.service'
import { PubSubService } from '../../pubsub/pubsub.service'
import { RegisterUserResult, UserService } from '../../user/user.service'
import { DefaultUserResourcesService } from '../default-user-resources.service'
import { EmailVerificationService } from '../email-verification.service'
import { PasswordService } from './password.service'

export interface RegisterUserInput {
  email: string
  password: string
  name: string
  inviteCode?: string
}

export interface RegistrationResult {
  user: {
    id: string
    email: string
    name: string
  }
  accessToken?: string
  pendingEmailVerification: boolean
}

/**
 * Dedicated service for user registration lifecycle
 * Handles:
 * - User creation and profile setup
 * - Default resource provisioning
 * - Email verification
 * - Analytics and third-party integrations
 */
@Injectable()
export class UserRegistrationService {
  private readonly logger = new Logger(UserRegistrationService.name)

  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly defaultResources: DefaultUserResourcesService,
    private readonly analytics: AnalyticsService,
    private readonly pubsub: PubSubService,
    private readonly intercom: IntercomService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly structuredLogger: StructuredLogger,
  ) {
    this.structuredLogger.setContext({ service: 'user-registration' })
  }

  /**
   * Register a new user with complete lifecycle management
   * @param input - Registration details
   * @returns Registration result with user data and auth status
   */
  async registerUser(
    input: RegisterUserInput,
  ): Promise<RegistrationResult & { verificationToken?: string }> {
    this.structuredLogger.log('User registration started', {
      email: input.email,
      hasInviteCode: !!input.inviteCode,
    })

    // 1. Hash password
    const passwordHash = await this.passwordService.hashPassword(input.password)

    // 2. Determine if email confirmation is required
    const requireConfirmation = this.configService.get<boolean>(
      EnvVariables.AUTH_REQUIRE_EMAIL_CONFIRMATION,
      false,
    )

    // 3. Create user and profile
    const result: RegisterUserResult =
      await this.userService.createUserWithProfile({
        email: input.email,
        name: input.name,
        passwordHash,
        requireEmailConfirmation: requireConfirmation,
        inviteCode: input.inviteCode,
      })

    // 4. Provision default resources (filters, example items)
    await this.defaultResources.provisionForUser(result.user.id, {
      username: result.profile.username,
    })

    // 5. Track user creation in analytics
    this.analytics.trackUserCreated(
      result.user.id,
      result.user.email,
      result.profile.username,
      {
        status: result.user.status,
        hasInviteCode: !!input.inviteCode,
      },
    )

    // 6. Notify other services via pub/sub
    await this.pubsub.userCreated(
      result.user.id,
      result.user.email,
      result.user.name,
      result.profile.username,
    )

    // 7. Create Intercom contact for support
    await this.intercom.createUserContact(
      result.user.id,
      result.user.email,
      result.user.name,
      result.profile.username,
      result.profile.pictureUrl,
      result.user.sourceUserId,
    )

    // 8. Handle email verification if required

    if (requireConfirmation) {
      const verificationToken =
        await this.emailVerificationService.createVerificationToken({
          userId: result.user.id,
          email: result.user.email,
        })

      // Send verification email
      await this.emailService.sendVerificationEmail(
        result.user.email,
        verificationToken,
      )

      this.structuredLogger.log(
        'User registration completed - email verification required',
        {
          userId: result.user.id,
          email: result.user.email,
          status: result.user.status,
        },
      )

      return {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
        pendingEmailVerification: true,
        verificationToken, // For testing/development
      }
    }

    this.structuredLogger.log('User registration completed - auto-activated', {
      userId: result.user.id,
      email: result.user.email,
      status: result.user.status,
    })

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      pendingEmailVerification: false,
    }
  }

  /**
   * Resend email verification for a pending user
   * @param email - User's email address
   */
  async resendVerification(email: string): Promise<void> {
    const user = await this.userService.findByEmail(email.trim().toLowerCase())

    if (!user) {
      throw new Error('User not found')
    }

    if (user.status !== 'PENDING') {
      throw new Error('Email already verified')
    }

    const verificationToken =
      await this.emailVerificationService.createVerificationToken({
        userId: user.id,
        email: user.email,
      })

    await this.emailService.sendVerificationEmail(user.email, verificationToken)

    this.structuredLogger.log('Verification email resent', {
      userId: user.id,
      email: user.email,
    })
  }
}
