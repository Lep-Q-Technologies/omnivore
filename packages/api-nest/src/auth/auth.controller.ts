import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

import {
  AuthErrorCode,
  AuthStatus,
  AuthVerificationResponse,
  LoginResponse,
  RegisterResponse,
} from './dto/auth-responses.dto'
import { ConfirmEmailDto } from './dto/confirm-email.dto'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { RequestPasswordResetDto } from './dto/request-password-reset.dto'
import { ResendVerificationDto } from './dto/resend-verification.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { AuthService } from './services/auth.service'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name)

  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Login successful',
    type: 'LoginSuccessResponse',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or account issues',
    type: 'AuthErrorResponse',
  })
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    try {
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
      )

      if (!user) {
        return {
          success: false,
          errorCode: AuthErrorCode.INVALID_CREDENTIALS,
          message: 'Invalid email or password',
        }
      }

      if (!user.canAccess()) {
        // Handle pending verification or archived account
        if (user.status === 'PENDING') {
          return {
            success: false,
            errorCode: AuthErrorCode.PENDING_VERIFICATION,
            message: 'Please verify your email address',
          }
        }

        return {
          success: false,
          errorCode: AuthErrorCode.ACCOUNT_SUSPENDED,
          message: 'Your account has been suspended',
        }
      }

      // Generate and return JWT token
      const loginResult = await this.authService.login(user)

      return loginResult
    } catch (error) {
      this.logger.error('Login error', error)

      return {
        success: false,
        errorCode: AuthErrorCode.AUTH_FAILED,
        message: 'Authentication failed',
      }
    }
  }

  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({ type: RegisterDto })
  @ApiOkResponse({
    description: 'Registration successful',
    type: 'RegisterResponse',
  })
  @ApiConflictResponse({ description: 'Email already exists' })
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponse> {
    try {
      const result = await this.authService.register(registerDto)

      // Return the result directly from the service, which already has proper typing
      return result
    } catch (error) {
      // Handle specific registration errors
      if (error instanceof Error) {
        if (error.message.includes('EMAIL_ALREADY_EXISTS')) {
          return {
            success: false,
            errorCode: AuthErrorCode.EMAIL_ALREADY_EXISTS,
            message: 'An account with this email already exists',
          }
        }
        if (error.message.includes('INVALID_EMAIL')) {
          return {
            success: false,
            errorCode: AuthErrorCode.INVALID_EMAIL,
            message: 'Please provide a valid email address',
          }
        }
        if (error.message.includes('WEAK_PASSWORD')) {
          return {
            success: false,
            errorCode: AuthErrorCode.WEAK_PASSWORD,
            message: 'Password does not meet security requirements',
          }
        }
      }

      // Generic error
      return {
        success: false,
        errorCode: AuthErrorCode.REGISTRATION_FAILED,
        message: 'Registration failed. Please try again.',
      }
    }
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user
  }

  @ApiOperation({ summary: 'Refresh JWT access token' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Request() req) {
    return this.authService.refreshToken(req.user)
  }

  @ApiOperation({ summary: 'Confirm email verification' })
  @ApiBody({ type: ConfirmEmailDto })
  @Post('confirm-email')
  async confirmEmail(@Body() confirmEmailDto: ConfirmEmailDto) {
    try {
      const result = await this.authService.confirmEmail(confirmEmailDto.token)

      return result
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'EMAIL_VERIFICATION_TOKEN_NOT_FOUND'
      ) {
        throw new BadRequestException('Invalid or expired token')
      }
      throw error
    }
  }

  @ApiOperation({ summary: 'Resend email verification' })
  @ApiBody({ type: ResendVerificationDto })
  @Post('resend-verification')
  async resendVerification(@Body() resendDto: ResendVerificationDto) {
    try {
      const result = await this.authService.resendVerification(resendDto.email)

      return result
    } catch (error) {
      // Return generic success message to prevent user enumeration
      // Don't reveal whether the email exists or not
      if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
        return {
          success: true,
          message: 'If the email exists, a verification link has been sent',
        }
      }
      if (error instanceof Error && error.message === 'USER_ALREADY_VERIFIED') {
        return {
          success: true,
          message: 'If the email exists, a verification link has been sent',
        }
      }
      throw error
    }
  }

  @ApiOperation({ summary: 'Verify authentication status (for web frontend)' })
  @ApiOkResponse({
    description: 'Authentication status verified',
    type: 'AuthVerificationResponse',
  })
  @Get('verify')
  async verifyAuth(
    @Request() req,
    @Headers('authorization') authHeader?: string,
  ): Promise<AuthVerificationResponse> {
    try {
      // Check for auth token in Authorization header only
      const token = authHeader?.replace('Bearer ', '')

      if (!token) {
        return { authStatus: AuthStatus.NOT_AUTHENTICATED }
      }

      // Validate the token
      const user = await this.authService.validateToken(token)

      if (!user) {
        return { authStatus: AuthStatus.NOT_AUTHENTICATED }
      }

      if (!user.canAccess()) {
        if (user.status === 'PENDING') {
          return { authStatus: AuthStatus.PENDING_USER }
        }

        return { authStatus: AuthStatus.NOT_AUTHENTICATED }
      }

      return {
        authStatus: AuthStatus.AUTHENTICATED,
        user: { id: user.id, email: user.email, name: user.name },
      }
    } catch (error) {
      this.logger.error('Error verifying auth status', error)

      return { authStatus: AuthStatus.NOT_AUTHENTICATED }
    }
  }

  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({ type: RequestPasswordResetDto })
  @HttpCode(HttpStatus.OK)
  @Post('request-password-reset')
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    // Note: EmailService will be injected via NotificationModule
    // For now, we'll need to update auth.module.ts to import NotificationModule
    throw new Error(
      'Password reset not yet fully integrated - NotificationModule needs to be added to AuthModule',
    )
  }

  @ApiOperation({ summary: 'Reset password with token' })
  @ApiBody({ type: ResetPasswordDto })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    // Note: EmailService will be injected via NotificationModule
    throw new Error(
      'Password reset not yet fully integrated - NotificationModule needs to be added to AuthModule',
    )
  }
}
