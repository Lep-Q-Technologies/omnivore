import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Post,
  Query,
  Res,
} from '@nestjs/common'
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Response } from 'express'

import { GoogleOAuthService } from '../services/google-oauth.service'
import { OAuthAuthService } from '../services/oauth-auth.service'

interface GoogleWebAuthDto {
  idToken: string
}

@ApiTags('google-oauth')
@Controller('auth')
export class GoogleOAuthController {
  private readonly logger = new Logger(GoogleOAuthController.name)

  constructor(
    private readonly oauthAuthService: OAuthAuthService,
    private readonly googleOAuthService: GoogleOAuthService,
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
        // Set auth cookie and redirect
        res.cookie('auth', result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        })
      }

      return res.redirect('/library')
    } catch (error) {
      this.logger.error('Error in Google OAuth callback', error)

      return res.redirect('/login?errorCodes=AuthFailed')
    }
  }

  @Post('google-web-signin')
  @ApiOperation({ summary: 'Google web authentication with ID token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        idToken: { type: 'string' },
      },
      required: ['idToken'],
    },
  })
  async googleWebSignIn(@Body() body: GoogleWebAuthDto, @Res() res: Response) {
    try {
      const result = await this.oauthAuthService.handleGoogleWebAuth(
        body.idToken,
      )

      if (!result.success) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: 'Authentication failed',
        })
      }

      // Set auth cookie for session management
      res.cookie('auth', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      })

      // Return unified response (same as email login)
      return res.status(HttpStatus.OK).json(result)
    } catch (error) {
      this.logger.error('Error in Google web sign-in', error)

      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication failed',
      })
    }
  }
}
