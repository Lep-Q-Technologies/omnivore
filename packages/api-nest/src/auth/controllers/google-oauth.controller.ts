import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Post,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Response } from 'express'

import { ExchangeTokenDto, GoogleWebAuthDto } from '../dto/google-oauth.dto'
import { GoogleOAuthService } from '../services/google-oauth.service'
import { OAuthAuthService } from '../services/oauth-auth.service'
import { TokenExchangeStore } from '../token-exchange.store'

@ApiTags('google-oauth')
@Controller('auth')
export class GoogleOAuthController {
  private readonly logger = new Logger(GoogleOAuthController.name)

  constructor(
    private readonly oauthAuthService: OAuthAuthService,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly tokenExchangeStore: TokenExchangeStore,
  ) {}

  @Get('google-redirect/login')
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  @ApiQuery({ name: 'redirect_uri', required: false })
  async googleRedirectLogin(
    @Query('redirect_uri') redirectUri: string,
    @Res() res: Response,
  ) {
    try {
      const state = JSON.stringify({ redirect_uri: redirectUri || '' })
      const callbackUrl = '/api/auth/google-login/login'

      const authUrl = this.googleOAuthService.generateAuthUrl(
        callbackUrl,
        state,
      )

      this.logger.log('Redirecting to Google OAuth', { redirectUri })

      return res.redirect(authUrl)
    } catch (error) {
      this.logger.error('Error initiating Google OAuth', error)

      return res.redirect('/login?errorCodes=AuthFailed')
    }
  }

  @Get('google-login/login')
  @ApiOperation({ summary: 'Handle Google OAuth callback' })
  @ApiQuery({ name: 'code', required: true })
  @ApiQuery({ name: 'state', required: false })
  async googleLoginCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      if (!code) {
        this.logger.warn('No authorization code provided')

        return res.redirect('/login?errorCodes=AuthFailed')
      }

      // Exchange code for user info
      const userInfo = await this.googleOAuthService.exchangeCodeForUserInfo(
        code,
        '/api/auth/google-login/login',
      )

      if (!userInfo || !userInfo.email) {
        this.logger.warn('Failed to get user info from Google')

        return res.redirect('/login?errorCodes=GoogleAuthError')
      }

      // Use the already-verified user info directly
      const result =
        await this.oauthAuthService.handleVerifiedOAuthUser(userInfo)

      if (result.success && result.accessToken) {
        // Ensure we have user info for rate limiting and audit logging
        if (!result.user?.id) {
          this.logger.error('User ID missing in OAuth result')

          return res.redirect('/login?errorCodes=AuthFailed')
        }

        // Generate one-time exchange code and store the token (with userId for rate limiting)
        const exchangeCode = this.tokenExchangeStore.generateExchangeCode(
          result.user.id,
        )

        if (!exchangeCode) {
          this.logger.warn('Rate limit hit during exchange code generation', {
            userId: result.user.id,
          })

          return res.redirect('/login?errorCodes=RateLimitExceeded')
        }

        await this.tokenExchangeStore.store(
          exchangeCode,
          result.accessToken,
          result.user.id,
        )

        // Redirect with exchange code (not the token) - frontend will exchange it
        const redirectUrl = `/library?exchange_code=${encodeURIComponent(
          exchangeCode,
        )}`

        return res.redirect(redirectUrl)
      }

      return res.redirect('/login?errorCodes=AuthFailed')
    } catch (error) {
      this.logger.error('Error in Google OAuth callback', error)

      return res.redirect('/login?errorCodes=AuthFailed')
    }
  }

  @Post('google-web-signin')
  @ApiOperation({ summary: 'Google web authentication with ID token' })
  async googleWebSignIn(@Body() body: GoogleWebAuthDto) {
    try {
      const result = await this.oauthAuthService.handleGoogleWebAuth(
        body.idToken,
      )

      if (!result.success) {
        throw new UnauthorizedException('Authentication failed')
      }

      // Return token in response body (frontend stores in localStorage)
      return result
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }

      this.logger.error('Error in Google web sign-in', error)
      throw new UnauthorizedException('Authentication failed')
    }
  }

  @Post('exchange-token')
  @ApiOperation({
    summary:
      'Exchange one-time code for access token (secure OAuth redirect flow)',
  })
  async exchangeToken(@Body() body: ExchangeTokenDto) {
    try {
      // Retrieve and delete the token (one-time use)
      const accessToken = await this.tokenExchangeStore.retrieve(body.code)

      if (!accessToken) {
        throw new UnauthorizedException('Invalid or expired exchange code')
      }

      return {
        success: true,
        accessToken,
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }

      this.logger.error('Error exchanging token', error)
      throw new InternalServerErrorException('Failed to exchange token')
    }
  }
}
