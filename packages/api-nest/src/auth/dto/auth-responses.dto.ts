import { ApiProperty } from '@nestjs/swagger'

/**
 * Base response structure for all authentication operations
 */
export class BaseAuthResponse {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Login successful',
  })
  message: string

  @ApiProperty({
    description: 'Error code for failed operations',
    example: 'INVALID_CREDENTIALS',
    required: false,
  })
  errorCode?: string

  @ApiProperty({
    description:
      'URL for frontend navigation after operation (DEPRECATED: Not recommended)',
    example: '/home',
    required: false,
  })
  redirectUrl?: string
}

/**
 * Minimal user data returned in successful authentication responses
 * Note: id and email are also in JWT, but included for convenience
 * Role is ONLY in JWT (not returned separately)
 */
export class AuthUserData {
  @ApiProperty({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string

  @ApiProperty({
    description: 'User display name (not in JWT)',
    example: 'John Doe',
  })
  name: string
}

/**
 * Successful login response
 * Simplified: removed expiresIn (decode from JWT), message (success=true is enough)
 */
export class LoginSuccessResponse {
  @ApiProperty({ example: true })
  success: true

  @ApiProperty({
    description: 'JWT access token (contains: sub, email, role, exp)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string

  @ApiProperty({
    description: 'Minimal user data (name is not in JWT)',
    type: AuthUserData,
  })
  user: AuthUserData
}

/**
 * Failed authentication response
 */
export class AuthErrorResponse extends BaseAuthResponse {
  @ApiProperty({ example: false })
  success: false

  @ApiProperty({
    description: 'Specific error code',
    enum: [
      'INVALID_CREDENTIALS',
      'PENDING_VERIFICATION',
      'ACCOUNT_SUSPENDED',
      'AUTH_FAILED',
      'EMAIL_ALREADY_EXISTS',
      'INVALID_EMAIL',
      'WEAK_PASSWORD',
      'REGISTRATION_FAILED',
    ],
    example: 'INVALID_CREDENTIALS',
  })
  errorCode: string

  @ApiProperty({
    description: 'Error message for display',
    example: 'Invalid email or password',
  })
  message: string
}

/**
 * Union type for login responses
 */
export type LoginResponse = LoginSuccessResponse | AuthErrorResponse

/**
 * Successful registration with immediate login
 * Same structure as LoginSuccessResponse for consistency
 */
export class RegisterSuccessWithLoginResponse {
  @ApiProperty({ example: true })
  success: true

  @ApiProperty({
    description: 'JWT access token (contains: sub, email, role, exp)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string

  @ApiProperty({
    description: 'Minimal user data (name is not in JWT)',
    type: AuthUserData,
  })
  user: AuthUserData
}

/**
 * Successful registration requiring email verification
 */
export class RegisterSuccessWithVerificationResponse extends BaseAuthResponse {
  @ApiProperty({ example: true })
  success: true

  @ApiProperty({
    description: 'Success message',
    example:
      'Registration successful. Please check your email for verification.',
  })
  message: string

  @ApiProperty({
    description: 'Redirect URL for email verification flow (DEPRECATED)',
    example: '/auth/email-login',
    required: false,
  })
  redirectUrl?: string

  @ApiProperty({
    description: 'Indicates email verification is required',
    example: true,
  })
  pendingEmailVerification: true
}

/**
 * Union type for registration responses
 */
export type RegisterResponse =
  | RegisterSuccessWithLoginResponse
  | RegisterSuccessWithVerificationResponse
  | AuthErrorResponse

/**
 * Auth verification response for /auth/verify endpoint
 */
export class AuthVerificationResponse {
  @ApiProperty({
    description: 'Current authentication status',
    enum: ['AUTHENTICATED', 'NOT_AUTHENTICATED', 'PENDING_USER'],
    example: 'AUTHENTICATED',
  })
  authStatus: 'AUTHENTICATED' | 'NOT_AUTHENTICATED' | 'PENDING_USER'

  @ApiProperty({
    description: 'User data if authenticated',
    type: AuthUserData,
    required: false,
  })
  user?: {
    id: string
    email: string
    name: string
  }
}

/**
 * Error code enumeration for better type safety
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  AUTH_FAILED = 'AUTH_FAILED',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  INVALID_EMAIL = 'INVALID_EMAIL',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  REGISTRATION_FAILED = 'REGISTRATION_FAILED',
}

/**
 * Auth status enumeration
 */
export enum AuthStatus {
  AUTHENTICATED = 'AUTHENTICATED',
  NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
  PENDING_USER = 'PENDING_USER',
}
