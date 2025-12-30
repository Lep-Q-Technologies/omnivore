import { Injectable, Logger } from '@nestjs/common'

import { RegistrationType } from '../../user/entities/user.entity'
import { UserService } from '../../user/user.service'
import {
  GoogleWebAuthResponse,
  OAuthUserInfo,
} from '../interfaces/oauth-types.interface'
import { AuthService } from './auth.service'
import { GoogleOAuthService } from './google-oauth.service'

@Injectable()
export class OAuthAuthService {
  private readonly logger = new Logger(OAuthAuthService.name)

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly googleOAuthService: GoogleOAuthService,
  ) {}

  /**
   * Handle Google authentication flow (unified for web and mobile)
   * Creates new users immediately when they don't exist
   * Returns auth token for both new and existing users
   */
  async handleGoogleAuth(
    idToken: string,
    isAndroid?: boolean,
  ): Promise<GoogleWebAuthResponse> {
    try {
      // Verify the Google ID token (use mobile verification if isAndroid is explicitly provided)
      const userInfo =
        typeof isAndroid === 'boolean'
          ? await this.verifyMobileToken(idToken, isAndroid)
          : await this.googleOAuthService.verifyWebToken(idToken)

      if (!userInfo || !userInfo.email) {
        this.logger.warn('Invalid Google token or missing email')

        return { success: false }
      }

      return this.authenticateOAuthUser(userInfo, RegistrationType.GOOGLE)
    } catch (error) {
      this.logger.error('Error in Google authentication', error)

      return { success: false }
    }
  }

  /**
   * Handle Google web authentication - alias for handleGoogleAuth
   * @deprecated Use handleGoogleAuth instead
   */
  async handleGoogleWebAuth(idToken: string): Promise<GoogleWebAuthResponse> {
    return this.handleGoogleAuth(idToken)
  }

  /**
   * Handle Google mobile authentication - now uses same flow as web
   * Auto-creates users on first login (no pending user step)
   */
  async handleGoogleMobileAuth(
    idToken: string,
    isAndroid: boolean,
  ): Promise<GoogleWebAuthResponse> {
    return this.handleGoogleAuth(idToken, isAndroid)
  }

  /**
   * Handle OAuth callback flow when user info is already verified
   * Used by OAuth redirect callbacks that have already exchanged code for user info
   */
  async handleVerifiedOAuthUser(
    userInfo: OAuthUserInfo,
  ): Promise<GoogleWebAuthResponse> {
    return this.authenticateOAuthUser(userInfo, RegistrationType.GOOGLE)
  }

  /**
   * Core authentication logic for OAuth users
   * Creates user if doesn't exist, generates auth token
   */
  private async authenticateOAuthUser(
    userInfo: OAuthUserInfo,
    registrationType: RegistrationType,
  ): Promise<GoogleWebAuthResponse> {
    // Look for existing user by email and source
    let user = await this.userService.findByEmailAndSource(
      userInfo.email,
      registrationType,
    )
    const isNewUser = !user

    if (!user) {
      this.logger.log('Creating new OAuth user', {
        email: userInfo.email,
        sourceUserId: userInfo.sourceUserId,
        registrationType,
      })

      const registrationResult = await this.userService.createUserWithProfile({
        email: userInfo.email,
        name: userInfo.name || userInfo.email.split('@')[0],
        sourceUserId: userInfo.sourceUserId,
        registrationType,
        requireEmailConfirmation: false, // OAuth users are pre-verified
        pictureUrl: userInfo.pictureUrl,
      })

      user = registrationResult.user
    }

    // Check if user can access the system
    if (!user.canAccess()) {
      this.logger.warn('User cannot access system', {
        userId: user.id,
        status: user.status,
      })

      return { success: false }
    }

    // Generate JWT token using AuthService (includes analytics tracking)
    const loginResponse = await this.authService.login(user)

    this.logger.log('OAuth authentication successful', {
      userId: user.id,
      email: user.email,
      isNewUser,
      registrationType,
    })

    // Return unified response (same structure as email login)
    return loginResponse
  }

  /**
   * Verify mobile Google token and convert to OAuthUserInfo
   */
  private async verifyMobileToken(
    idToken: string,
    isAndroid: boolean,
  ): Promise<OAuthUserInfo | null> {
    const tokenResult = await this.googleOAuthService.decodeGoogleToken(
      idToken,
      isAndroid,
    )

    if (
      tokenResult.errorCode ||
      !tokenResult.email ||
      !tokenResult.sourceUserId
    ) {
      this.logger.warn('Invalid Google mobile token', tokenResult)

      return null
    }

    return {
      email: tokenResult.email,
      sourceUserId: tokenResult.sourceUserId,
      name: tokenResult.name,
    }
  }
}
