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

interface GoogleMobileAuthDto {
  idToken: string
  isAndroid: boolean
}

interface CompletePendingRegistrationDto {
  pendingToken: string
  name?: string
  username?: string
  bio?: string
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

      const result = await this.oauthAuthService.handleGoogleWebAuth(
        userInfo.email,
      )

      if (result.success && result.authToken) {
        // Set auth cookie and redirect
        res.cookie('auth', result.authToken, {
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

      if (!result.success || !result.authToken) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: 'Authentication failed',
        })
      }

      // Set auth cookie for session management
      res.cookie('auth', result.authToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      })

      return res.status(HttpStatus.OK).json({
        success: true,
        authToken: result.authToken,
      })
    } catch (error) {
      this.logger.error('Error in Google web sign-in', error)

      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication failed',
      })
    }
  }

  @Post('google-mobile-signin')
  @ApiOperation({ summary: 'Google mobile authentication' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        idToken: { type: 'string' },
        isAndroid: { type: 'boolean' },
      },
      required: ['idToken', 'isAndroid'],
    },
  })
  async googleMobileSignIn(@Body() body: GoogleMobileAuthDto) {
    try {
      const result = await this.oauthAuthService.handleGoogleMobileAuth(
        body.idToken,
        body.isAndroid,
      )

      if (!result.success) {
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          json: { error: 'Authentication failed' },
        }
      }

      return {
        statusCode: HttpStatus.OK,
        json: {
          success: true,
          authToken: result.authToken,
          pendingUserAuth: result.pendingUserAuth,
        },
      }
    } catch (error) {
      this.logger.error('Error in Google mobile sign-in', error)

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        json: { error: 'Internal server error' },
      }
    }
  }

  @Post('complete-oauth-registration')
  @ApiOperation({ summary: 'Complete OAuth registration from pending token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        pendingToken: { type: 'string' },
        name: { type: 'string' },
        username: { type: 'string' },
        bio: { type: 'string' },
      },
      required: ['pendingToken'],
    },
  })
  async completePendingRegistration(
    @Body() body: CompletePendingRegistrationDto,
  ) {
    try {
      const result =
        await this.oauthAuthService.completePendingUserRegistration(
          body.pendingToken,
          {
            name: body.name,
            username: body.username,
            bio: body.bio,
          },
        )

      return {
        success: true,
        user: result.user,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      }
    } catch (error) {
      this.logger.error('Error completing OAuth registration', error)

      if (
        error instanceof Error &&
        error.message.includes('Invalid or expired')
      ) {
        return {
          success: false,
          error: 'Invalid or expired pending user token',
        }
      }

      return {
        success: false,
        error: 'Registration failed',
      }
    }
  }
}
