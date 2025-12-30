import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'

import { AnalyticsService } from '../../analytics/analytics.service'
import { EnvVariables } from '../../config/env-variables'
import { StructuredLogger } from '../../logging/structured-logger.service'
import { StatusType, User } from '../../user/entities/user.entity'
import { UserService } from '../../user/user.service'
import {
  LoginSuccessResponse,
  RegisterSuccessWithLoginResponse,
  RegisterSuccessWithVerificationResponse,
} from '../dto/auth-responses.dto'
import { RegisterDto } from '../dto/register.dto'
import { EmailVerificationService } from '../email-verification.service'
import { PasswordResetService } from './password-reset.service'
import { UserRegistrationService } from './user-registration.service'

export interface JwtPayload {
  sub: string
  email: string
  role: string
  iat?: number
  exp?: number
}

/**
 * Core authentication service
 * Responsibilities:
 * - JWT token generation and validation
 * - User login/logout
 * - Email verification (delegates to EmailVerificationService)
 * - Delegates registration to UserRegistrationService
 * - Delegates password reset to PasswordResetService
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly userRegistrationService: UserRegistrationService,
    private readonly passwordResetService: PasswordResetService,
    private readonly analytics: AnalyticsService,
    private readonly logger: StructuredLogger,
  ) {
    this.logger.setContext({ service: 'auth' })
  }

  /**
   * Validate user credentials for authentication
   * @param email - User's email address
   * @param password - User's password (plaintext)
   * @returns User entity if credentials are valid, null otherwise
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    return this.userService.validateCredentials(email, password)
  }

  /**
   * Validate a JWT token and retrieve the associated user
   * @param token - JWT token (with or without 'Bearer ' prefix)
   * @returns User entity if token is valid, null otherwise
   */
  async validateToken(token: string): Promise<User | null> {
    try {
      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace(/^Bearer\s+/, '')

      // Verify and decode the JWT token
      const payload = this.jwtService.verify(cleanToken) as JwtPayload

      if (!payload.sub) {
        return null
      }

      // Get user from database
      const user = await this.userService.findById(payload.sub)

      return user
    } catch (error) {
      this.logger.warn('Token validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      return null
    }
  }

  /**
   * Generate JWT token and login response for a user
   * Validates user status and tracks login analytics
   * @param user - User entity to login
   * @returns Login response with access token and user data
   * @throws UnauthorizedException if user account is not active
   */
  async login(user: User): Promise<LoginSuccessResponse> {
    this.logger
      .withContext({ userId: user.id, email: user.email })
      .log('User login attempt', { status: user.status, role: user.role })

    if (!user.canAccess()) {
      this.logger
        .withContext({ userId: user.id, email: user.email })
        .warn('Login denied - user account not active', { status: user.status })
      throw new UnauthorizedException('User account is not active')
    }

    const role = user.role ?? 'user'

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role,
    }

    // Track login event
    this.analytics.trackUserLogin(user.id, {
      email: user.email,
      role,
      status: user.status,
    })

    this.logger
      .withContext({ userId: user.id, email: user.email })
      .log('User login successful', {
        role,
        tokenExpiresIn: this.configService.get<string>(
          EnvVariables.JWT_EXPIRES_IN,
          '1h',
        ),
      })

    return {
      success: true,
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }
  }

  /**
   * Register a new user account
   * Delegates to UserRegistrationService for lifecycle management
   * @param registerDto - User registration data
   * @returns Login response or email verification response
   */
  async register(
    registerDto: RegisterDto,
  ): Promise<
    RegisterSuccessWithLoginResponse | RegisterSuccessWithVerificationResponse
  > {
    const result = await this.userRegistrationService.registerUser({
      email: registerDto.email,
      password: registerDto.password,
      name: registerDto.name,
      inviteCode: registerDto.inviteCode,
    })

    // If email verification is required, return verification response
    if (result.pendingEmailVerification) {
      return {
        success: true,
        message:
          'Registration successful. Please check your email for verification.',
        redirectUrl: '/auth/email-login',
        pendingEmailVerification: true,
      }
    }

    // Otherwise, auto-login the user
    const user = await this.userService.findById(result.user.id)
    if (!user) {
      throw new NotFoundException('User not found after registration')
    }

    return this.login(user)
  }

  /**
   * Generate a new access token for an authenticated user
   * @param user - User entity to generate token for
   * @returns New access token and expiration time
   */
  async refreshToken(user: User) {
    const role = user.role ?? 'user'

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role,
    }

    return {
      success: true,
      accessToken: this.jwtService.sign(payload),
    }
  }

  /**
   * Find a user by their ID
   * @param id - User ID
   * @returns User entity if found, null otherwise
   */
  async findUserById(id: string): Promise<User | null> {
    return this.userService.findById(id)
  }

  /**
   * Confirm a user's email address using a verification token
   * Activates pending user accounts and returns login response
   * @param token - Email verification token
   * @returns Login response with access token
   * @throws NotFoundException if user not found
   */
  async confirmEmail(token: string) {
    const payload = await this.emailVerificationService.verifyToken(token, {
      consume: true,
    })

    const user = await this.userService.findById(payload.userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    if (user.status === StatusType.PENDING) {
      const activatedUser = await this.userService.activateUser(user.id)

      // Analytics: Track email verification
      this.analytics.trackEmailVerified(activatedUser.id, activatedUser.email, {
        wasActivated: true,
      })

      return this.login(activatedUser)
    }

    // Analytics: Track email verification for already active users
    this.analytics.trackEmailVerified(user.id, user.email, {
      wasActivated: false,
    })

    return this.login(user)
  }

  /**
   * Resend email verification for a pending user account
   * Delegates to UserRegistrationService
   * @param email - User's email address
   * @returns Success response
   * @throws NotFoundException if user not found
   * @throws BadRequestException if user already verified
   */
  async resendVerification(email: string) {
    try {
      await this.userRegistrationService.resendVerification(email)

      return {
        success: true,
        message: 'Verification email sent',
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        throw new NotFoundException('User not found')
      }
      if (
        error instanceof Error &&
        error.message === 'Email already verified'
      ) {
        throw new BadRequestException(
          'Email already verified. Please login to continue.',
        )
      }
      throw error
    }
  }

  /**
   * Request a password reset for a user
   * Delegates to PasswordResetService
   * @param email - User's email address
   * @returns Success response (always returns success to prevent user enumeration)
   */
  async requestPasswordReset(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.passwordResetService.requestPasswordReset(email)
  }

  /**
   * Reset a user's password using a reset token
   * Delegates to PasswordResetService
   * @param token - Password reset token
   * @param newPassword - New password (plaintext, will be hashed)
   * @returns Success response
   * @throws BadRequestException if token is invalid or expired
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    // PasswordResetService handles analytics tracking internally
    return this.passwordResetService.resetPassword(token, newPassword)
  }
}
