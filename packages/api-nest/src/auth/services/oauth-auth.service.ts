import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { EnvVariables } from '../../config/env-variables'
import { RegistrationType } from '../../user/entities/user.entity'
import { UserService } from '../../user/user.service'
import { GoogleWebAuthResponse } from '../interfaces/oauth-types.interface'
import { AuthService } from './auth.service'
import { GoogleOAuthService } from './google-oauth.service'
import { PendingUserService } from './pending-user.service'

@Injectable()
export class OAuthAuthService {
  private readonly logger = new Logger(OAuthAuthService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly pendingUserService: PendingUserService,
  ) {}

  /**
   * Handle Google web authentication flow
   * Creates new users immediately when they don't exist (no pending user step)
   * Returns auth token for both new and existing users
   */
  async handleGoogleWebAuth(idToken: string): Promise<GoogleWebAuthResponse> {
    try {
      // Verify the Google ID token
      const userInfo = await this.googleOAuthService.verifyWebToken(idToken)
      if (!userInfo || !userInfo.email) {
        this.logger.warn('Invalid Google token or missing email')

        return { success: false }
      }

      // Look for existing user by email and source
      let user = await this.userService.findByEmailAndSource(
        userInfo.email,
        RegistrationType.GOOGLE,
      )

      if (!user) {
        this.logger.log('Creating new Google OAuth user', {
          email: userInfo.email,
          sourceUserId: userInfo.sourceUserId,
        })

        const registrationResult = await this.userService.registerUser({
          email: userInfo.email,
          name: userInfo.name || userInfo.email.split('@')[0],
          sourceUserId: userInfo.sourceUserId,
          registrationType: RegistrationType.GOOGLE,
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

      // Generate proper JWT token using AuthService
      const loginResponse = await this.authService.login(user)

      this.logger.log('Google authentication successful', {
        userId: user.id,
        email: user.email,
        isNewUser: !user,
      })

      return {
        success: true,
        authToken: loginResponse.accessToken,
      }
    } catch (error) {
      this.logger.error('Error in Google web authentication', error)

      return { success: false }
    }
  }

  /**
   * Handle Google mobile authentication
   */
  async handleGoogleMobileAuth(
    idToken: string,
    isAndroid: boolean,
  ): Promise<{
    success: boolean
    authToken?: string
    pendingUserAuth?: string
  }> {
    try {
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

        return { success: false }
      }

      // Look for existing user
      const existingUser = await this.userService.findByEmailAndSource(
        tokenResult.email,
        RegistrationType.GOOGLE,
      )

      if (!existingUser) {
        // Create pending user token for mobile registration
        const pendingUserAuth =
          await this.pendingUserService.createPendingUserToken({
            email: tokenResult.email,
            sourceUserId: tokenResult.sourceUserId,
            provider: 'GOOGLE',
            name: tokenResult.name || '',
            username: this.pendingUserService.generateSuggestedUsername(
              tokenResult.name || '',
            ),
          })

        if (!pendingUserAuth) {
          return { success: false }
        }

        return { success: true, pendingUserAuth }
      }

      if (!existingUser.canAccess()) {
        this.logger.warn('User cannot access system', {
          userId: existingUser.id,
          status: existingUser.status,
        })

        return { success: false }
      }

      // Generate auth token
      const authToken = await this.createWebAuthToken(existingUser.id)
      if (!authToken) {
        return { success: false }
      }

      return { success: true, authToken }
    } catch (error) {
      this.logger.error('Error in Google mobile authentication', error)

      return { success: false }
    }
  }

  /**
   * Complete OAuth registration from pending user token
   */
  async completePendingUserRegistration(
    pendingToken: string,
    profileData: { name?: string; username?: string; bio?: string },
  ) {
    const pendingUser =
      this.pendingUserService.decodePendingUserToken(pendingToken)
    if (!pendingUser) {
      throw new Error('Invalid or expired pending user token')
    }

    // Only Google OAuth is supported
    if (pendingUser.provider !== 'GOOGLE') {
      throw new Error('Unsupported OAuth provider')
    }

    // Register the user
    const result = await this.userService.registerUser({
      email: pendingUser.email,
      name: profileData.name || pendingUser.name,
      username: profileData.username || pendingUser.username,
      bio: profileData.bio,
      requireEmailConfirmation: false, // OAuth users don't need email confirmation
      sourceUserId: pendingUser.sourceUserId,
      registrationType: RegistrationType.GOOGLE,
    })

    // Log in the newly created user
    return this.authService.login(result.user)
  }

  /**
   * Get base URL for redirects based on environment
   */
  private getBaseURL(isLocal: boolean, isVercel: boolean): string {
    if (isLocal) {
      return 'http://localhost:3000'
    }

    if (isVercel) {
      // In a real implementation, this would use homePageURL() helper
      return this.configService.get<string>(
        EnvVariables.FRONTEND_URL,
        'https://omnivore.app',
      )
    }

    return this.configService.get<string>(
      EnvVariables.FRONTEND_URL,
      'https://omnivore.app',
    )
  }

  /**
   * Create web auth token (delegates to existing auth service)
   */
  private async createWebAuthToken(userId: string): Promise<string | null> {
    try {
      // This should use the same JWT creation logic as the existing auth service
      // For now, we'll use a simple approach - in a real implementation,
      // we'd need to access the JwtService directly or create a shared token service
      this.logger.log('Creating web auth token for user', { userId })

      return `mock_token_${userId}_${Date.now()}`
    } catch (error) {
      this.logger.error('Error creating web auth token', error)

      return null
    }
  }

  /**
   * Create SSO token (stub - needs full implementation)
   */
  private createSsoToken(authToken: string, redirectURL: string): string {
    // TODO: Implement SSO token creation logic
    // This is a complex feature that involves secure token exchange
    this.logger.log('SSO token creation requested', { redirectURL })

    return `sso_${authToken.substring(0, 20)}_${Date.now()}`
  }

  /**
   * Get SSO redirect URL (stub - needs full implementation)
   */
  private getSsoRedirectURL(ssoToken: string): string {
    // TODO: Implement SSO redirect URL logic
    const baseURL = this.configService.get<string>(EnvVariables.FRONTEND_URL)

    return `${baseURL}/sso?token=${ssoToken}`
  }
}
