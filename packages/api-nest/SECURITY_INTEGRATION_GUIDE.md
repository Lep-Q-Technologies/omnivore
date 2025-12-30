# Security Integration Guide

## Overview

This guide provides step-by-step instructions to integrate all security fixes into the NestJS API. All infrastructure has been created - this guide shows how to wire it all together.

---

## Part 1: Install Dependencies

```bash
# Install security packages
yarn install  # Will install @nestjs/throttler from package.json
npm install helmet  # For security headers
npm install timesafe-compare  # For timing attack prevention

# Update package.json with additional dependencies:
```

Add to `package.json`:
```json
{
  "dependencies": {
    "helmet": "^7.1.0",
    "timesafe-compare": "^1.1.1"
  }
}
```

---

## Part 2: Notification Module Integration

### Step 1: Update `auth.module.ts`

```typescript
// packages/api-nest/src/auth/auth.module.ts

import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { UserModule } from '../user/user.module'
import { NotificationModule } from '../notification/notification.module'  // NEW
import { EnvVariables } from '../config/env-variables'
import { User } from '../user/entities/user.entity'
import { AuthController } from './auth.controller'
import { GoogleOAuthController } from './controllers/google-oauth.controller'
import { AuthService } from './services/auth.service'
import { GoogleOAuthService } from './services/google-oauth.service'
import { OAuthAuthService } from './services/oauth-auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { EmailVerificationService } from './email-verification.service'
import { OAuthStateStore } from './oauth-state.store'  // NEW
import { PasswordResetTokenStore } from './password-reset-token.store'  // NEW

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(EnvVariables.JWT_SECRET),
        signOptions: {
          expiresIn: configService.get<string>(
            EnvVariables.JWT_EXPIRES_IN,
            '1h',
          ),
          algorithm: 'HS256',  // NEW: Explicit algorithm declaration
        },
      }),
    }),
    UserModule,
    NotificationModule,  // NEW: Import notification module
  ],
  controllers: [AuthController, GoogleOAuthController],
  providers: [
    AuthService,
    GoogleOAuthService,
    OAuthAuthService,
    JwtStrategy,
    EmailVerificationService,
    OAuthStateStore,  // NEW
    PasswordResetTokenStore,  // NEW
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
```

### Step 2: Update `auth.controller.ts` - Password Reset Endpoints

Replace the placeholder endpoints with:

```typescript
// packages/api-nest/src/auth/auth.controller.ts

import { EmailService } from '../notification/services/email.service'  // ADD THIS IMPORT

export class AuthController {
  constructor(
    private authService: AuthService,
    private passwordResetTokenStore: PasswordResetTokenStore,
    private emailService: EmailService,  // ADD THIS
  ) {}

  // ... existing endpoints ...

  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({ type: RequestPasswordResetDto })
  @HttpCode(HttpStatus.OK)
  @Post('request-password-reset')
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(
      dto.email,
      this.passwordResetTokenStore,
      this.emailService,
    )
  }

  @ApiOperation({ summary: 'Reset password with token' })
  @ApiBody({ type: ResetPasswordDto })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(
      dto.token,
      dto.newPassword,
      this.passwordResetTokenStore,
      this.emailService,
    )
  }
}
```

---

## Part 3: Rate Limiting Integration

### Step 1: Update `app.module.ts`

```typescript
// packages/api-nest/src/app.module.ts

import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'  // NEW
import { throttlerConfig } from './config/throttler.config'  // NEW

@Module({
  imports: [
    // ... existing imports ...

    // NEW: Rate limiting configuration
    ThrottlerModule.forRoot(throttlerConfig),
  ],
  providers: [
    // ... existing providers ...

    // NEW: Apply throttler globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### Step 2: Add Rate Limits to Auth Endpoints

```typescript
// packages/api-nest/src/auth/auth.controller.ts

import { Throttle } from '@nestjs/throttler'  // ADD THIS IMPORT

export class AuthController {
  // ... constructor ...

  @Throttle({ auth: { limit: 5, ttl: 60000 } })  // NEW: 5 attempts per minute
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    // ... existing code ...
  }

  @Throttle({ auth: { limit: 5, ttl: 60000 } })  // NEW
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponse> {
    // ... existing code ...
  }

  @Throttle({ 'resend-verification': { limit: 3, ttl: 300000 } })  // NEW: 3 per 5 minutes
  @Post('resend-verification')
  async resendVerification(@Body() resendDto: ResendVerificationDto) {
    // ... existing code ...
  }

  @Throttle({ auth: { limit: 3, ttl: 300000 } })  // NEW: 3 per 5 minutes
  @Post('request-password-reset')
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    // ... existing code ...
  }

  @Throttle({ auth: { limit: 5, ttl: 60000 } })  // NEW
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    // ... existing code ...
  }
}
```

---

## Part 4: OAuth State Validation

### Update `google-oauth.controller.ts`

```typescript
// packages/api-nest/src/auth/controllers/google-oauth.controller.ts

import { randomBytes } from 'crypto'  // ADD THIS IMPORT
import { OAuthStateStore } from '../oauth-state.store'  // ADD THIS IMPORT

export class GoogleOAuthController {
  constructor(
    private readonly oauthAuthService: OAuthAuthService,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly oauthStateStore: OAuthStateStore,  // ADD THIS
  ) {}

  @Get('google-redirect/login')
  async googleRedirectLogin(
    @Query('redirect_uri') redirectUri: string,
    @Res() res: Response,
  ) {
    try {
      // NEW: Generate cryptographically secure state token
      const stateToken = randomBytes(32).toString('hex')
      const redirectData = JSON.stringify({ redirect_uri: redirectUri || '' })

      // NEW: Store state token in Redis with 10-minute expiry
      await this.oauthStateStore.store(stateToken, redirectData)

      const callbackUrl = '/api/auth/google-login/login'
      const authUrl = this.googleOAuthService.generateAuthUrl(
        callbackUrl,
        stateToken,  // CHANGED: Use secure token instead of inline JSON
      )

      this.logger.log('Redirecting to Google OAuth', { redirectUri })

      return res.redirect(authUrl)
    } catch (error) {
      this.logger.error('Error initiating Google OAuth', error)

      return res.redirect('/login?errorCodes=AuthFailed')
    }
  }

  @Get('google-login/login')
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

      // NEW: Validate state token (prevents CSRF attacks)
      const storedData = await this.oauthStateStore.retrieve(state)

      if (!storedData) {
        this.logger.warn('Invalid or expired OAuth state token')

        return res.redirect('/login?errorCodes=InvalidState')
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

      const result =
        await this.oauthAuthService.handleVerifiedOAuthUser(userInfo)

      if (result.success && result.accessToken) {
        // Parse stored redirect data
        const { redirect_uri } = JSON.parse(storedData)
        const redirectPath = redirect_uri || '/library'

        // Redirect with token in URL (frontend will store in localStorage)
        const redirectUrl = `${redirectPath}?auth_token=${encodeURIComponent(result.accessToken)}`

        return res.redirect(redirectUrl)
      }

      return res.redirect('/login?errorCodes=AuthFailed')
    } catch (error) {
      this.logger.error('Error in Google OAuth callback', error)

      return res.redirect('/login?errorCodes=AuthFailed')
    }
  }
}
```

---

## Part 5: Timing Attack Prevention

### Update `user.service.ts`

```typescript
// packages/api-nest/src/user/user.service.ts

import timeSafeCompare from 'timesafe-compare'  // ADD THIS IMPORT
import * as bcrypt from 'bcrypt'

export class UserService {
  // ... existing code ...

  /**
   * Validate user credentials with timing attack prevention
   */
  async validateCredentials(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.findByEmail(email)

    // NEW: Always run bcrypt even if user doesn't exist (prevent timing attack)
    const dummyHash = '$2b$12$dummyhashtopreventtimingattack1234567890123456789012'
    const hashToCompare = user?.password || dummyHash

    const isPasswordValid = await bcrypt.compare(password, hashToCompare)

    // Return null if user doesn't exist OR password is invalid
    if (!user || !isPasswordValid) {
      return null
    }

    return user
  }
}
```

---

## Part 6: Security Headers with Helmet

### Update `main.ts`

```typescript
// packages/api-nest/src/main.ts

import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import helmet from 'helmet'  // ADD THIS IMPORT
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // NEW: Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],  // Required for Swagger
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,  // Required for Swagger
      crossOriginResourcePolicy: { policy: 'cross-origin' },  // Required for CORS
    }),
  )

  // NEW: HTTPS enforcement (only in production)
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        res.redirect(`https://${req.header('host')}${req.url}`)
      } else {
        next()
      }
    })
  }

  // ... existing CORS, validation, etc ...

  await app.listen(3000)
}

bootstrap()
```

---

## Part 7: Token Revocation/Blacklist (Redis-based)

### Create `jwt-blacklist.service.ts`

```typescript
// packages/api-nest/src/auth/services/jwt-blacklist.service.ts

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

import { EnvVariables } from '../../config/env-variables'

/**
 * JWT token blacklist service
 * Revoked tokens are stored in Redis until they naturally expire
 */
@Injectable()
export class JwtBlacklistService {
  private readonly logger = new Logger(JwtBlacklistService.name)

  private readonly redis: Redis | null = null

  private readonly inMemoryBlacklist = new Set<string>()

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>(EnvVariables.REDIS_URL)

    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 3) {
            return null
          }

          return Math.min(times * 50, 2000)
        },
      })

      this.redis.connect().catch((err) => {
        this.logger.error('Failed to connect to Redis for JWT blacklist', err)
      })
    } else {
      this.logger.warn(
        'Redis not configured, using in-memory JWT blacklist (not safe for multi-instance)',
      )
    }
  }

  /**
   * Revoke a JWT token
   * @param token - JWT token to revoke
   * @param expiresInSeconds - Time until token would naturally expire
   */
  async revokeToken(token: string, expiresInSeconds: number): Promise<void> {
    if (this.redis) {
      const key = `jwt:blacklist:${token}`
      await this.redis.setex(key, expiresInSeconds, '1')
      this.logger.debug(`Revoked JWT token (expires in ${expiresInSeconds}s)`)
    } else {
      this.inMemoryBlacklist.add(token)

      // Auto-remove after expiry (memory leak prevention)
      setTimeout(() => {
        this.inMemoryBlacklist.delete(token)
      }, expiresInSeconds * 1000)
    }
  }

  /**
   * Check if a token is revoked
   */
  async isRevoked(token: string): Promise<boolean> {
    if (this.redis) {
      const key = `jwt:blacklist:${token}`
      const result = await this.redis.exists(key)

      return result === 1
    }

    return this.inMemoryBlacklist.has(token)
  }

  /**
   * Disconnect Redis on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
    }
  }
}
```

### Update `jwt.strategy.ts`

```typescript
// packages/api-nest/src/auth/strategies/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtBlacklistService } from '../services/jwt-blacklist.service'  // ADD

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private userService: UserService,
    private jwtBlacklistService: JwtBlacklistService,  // ADD
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(EnvVariables.JWT_SECRET),
      passReqToCallback: true,  // ADD: Need request to get raw token
    })
  }

  async validate(req: Request, payload: JwtPayload) {
    // NEW: Extract raw token from Authorization header
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')

    // NEW: Check if token is revoked
    const isRevoked = await this.jwtBlacklistService.isRevoked(token)

    if (isRevoked) {
      throw new UnauthorizedException('Token has been revoked')
    }

    const user = await this.userService.findById(payload.sub)

    if (!user || !user.canAccess()) {
      throw new UnauthorizedException('Invalid user')
    }

    return user
  }
}
```

### Add logout endpoint to revoke tokens

```typescript
// packages/api-nest/src/auth/auth.controller.ts

import { JwtBlacklistService } from './services/jwt-blacklist.service'  // ADD

export class AuthController {
  constructor(
    private authService: AuthService,
    private passwordResetTokenStore: PasswordResetTokenStore,
    private emailService: EmailService,
    private jwtBlacklistService: JwtBlacklistService,  // ADD
    private jwtService: JwtService,  // ADD
  ) {}

  // ... existing endpoints ...

  @ApiOperation({ summary: 'Logout (revoke current token)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req, @Headers('authorization') authHeader: string) {
    const token = authHeader.replace('Bearer ', '')

    // Decode to get expiration time
    const decoded = this.jwtService.decode(token) as JwtPayload

    if (decoded && decoded.exp) {
      const now = Math.floor(Date.now() / 1000)
      const ttl = decoded.exp - now

      if (ttl > 0) {
        await this.jwtBlacklistService.revokeToken(token, ttl)
      }
    }

    return { success: true, message: 'Logged out successfully' }
  }
}
```

---

## Part 8: Environment Variables

Add to `.env.dev.template`:

```bash
# Postmark Email
POSTMARK_API_KEY=your-postmark-server-api-key
POSTMARK_FROM_EMAIL=noreply@omnivore.app

# JWT Configuration (ensure these are set)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=1h

# Redis (required for multi-instance deployments)
REDIS_URL=redis://localhost:6379

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# Auth Configuration
AUTH_REQUIRE_EMAIL_CONFIRMATION=true
AUTH_EMAIL_TOKEN_TTL=86400  # 24 hours
```

---

## Part 9: Update `auth.module.ts` - Complete Version

```typescript
// packages/api-nest/src/auth/auth.module.ts

import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { UserModule } from '../user/user.module'
import { NotificationModule } from '../notification/notification.module'
import { AnalyticsModule } from '../analytics/analytics.module'
import { PubSubModule } from '../pubsub/pubsub.module'
import { IntercomModule } from '../integrations/intercom.module'
import { LoggingModule } from '../logging/logging.module'
import { EnvVariables } from '../config/env-variables'
import { User } from '../user/entities/user.entity'
import { AuthController } from './auth.controller'
import { GoogleOAuthController } from './controllers/google-oauth.controller'
import { AuthService } from './services/auth.service'
import { GoogleOAuthService } from './services/google-oauth.service'
import { OAuthAuthService } from './services/oauth-auth.service'
import { JwtBlacklistService } from './services/jwt-blacklist.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { EmailVerificationService } from './email-verification.service'
import { OAuthStateStore } from './oauth-state.store'
import { PasswordResetTokenStore } from './password-reset-token.store'
import { DefaultUserResourcesService } from './default-user-resources.service'
import { VerificationTokenStore } from './interfaces/verification-token-store.interface'
import { RedisVerificationTokenStore } from './redis-verification-token.store'
import { InMemoryVerificationTokenStore } from './in-memory-verification-token.store'

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(EnvVariables.JWT_SECRET),
        signOptions: {
          expiresIn: configService.get<string>(
            EnvVariables.JWT_EXPIRES_IN,
            '1h',
          ),
          algorithm: 'HS256',  // Explicit algorithm
        },
      }),
    }),
    UserModule,
    NotificationModule,
    AnalyticsModule,
    PubSubModule,
    IntercomModule,
    LoggingModule,
  ],
  controllers: [AuthController, GoogleOAuthController],
  providers: [
    AuthService,
    GoogleOAuthService,
    OAuthAuthService,
    JwtStrategy,
    JwtBlacklistService,
    EmailVerificationService,
    OAuthStateStore,
    PasswordResetTokenStore,
    DefaultUserResourcesService,
    // Verification token store factory
    {
      provide: VerificationTokenStore,
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>(
          EnvVariables.NODE_ENV,
          'development',
        )
        const redisUrl = configService.get<string>(EnvVariables.REDIS_URL)

        if (nodeEnv === 'test' || !redisUrl) {
          return new InMemoryVerificationTokenStore()
        }

        return new RedisVerificationTokenStore(redisUrl)
      },
      inject: [ConfigService],
    },
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
```

---

## Testing Checklist

After integration, test these scenarios:

### Rate Limiting
- [ ] Try 6 login attempts in 1 minute → should block the 6th
- [ ] Try 4 resend verification in 5 minutes → should block the 4th
- [ ] Try 4 password reset requests in 5 minutes → should block the 4th

### Password Reset
- [ ] Request reset for valid email → receive email with link
- [ ] Request reset for invalid email → still returns success (no enumeration)
- [ ] Use reset link → password changes successfully
- [ ] Use same reset link twice → fails (one-time use)
- [ ] Use expired reset link (after 1 hour) → fails

### OAuth State Validation
- [ ] Start OAuth flow → state token generated
- [ ] Complete OAuth with valid state → succeeds
- [ ] Try to replay OAuth callback → fails (one-time use)
- [ ] Try OAuth with invalid state → fails

### Token Revocation
- [ ] Login → get token → logout → token revoked
- [ ] Try to use revoked token → 401 Unauthorized

### User Enumeration Prevention
- [ ] Register with existing email → generic error
- [ ] Resend verification for non-existent email → generic success
- [ ] Request password reset for non-existent email → generic success

### Security Headers
- [ ] Check response headers include `X-Content-Type-Options`, `X-Frame-Options`, etc.
- [ ] HTTP requests redirect to HTTPS (production only)

---

## Deployment Notes

1. **Redis is REQUIRED for multi-instance deployments**:
   - OAuth state validation
   - Password reset tokens
   - JWT blacklist
   - Email verification tokens (production)

2. **Environment variables must be set**:
   - `POSTMARK_API_KEY` - Get from Postmark dashboard
   - `POSTMARK_FROM_EMAIL` - Verified sender email
   - `REDIS_URL` - Redis connection string
   - `JWT_SECRET` - Strong secret (min 32 chars)

3. **Rate limiting storage**:
   - Uses Redis automatically if available
   - Falls back to in-memory (single instance only)

4. **Monitoring recommendations**:
   - Monitor rate limit hits (throttler exceptions)
   - Track password reset requests (potential abuse)
   - Alert on high number of revoked tokens (suspicious activity)

---

## Summary of All Security Fixes

| Fix | Status | Files Changed |
|-----|--------|---------------|
| ✅ Cookie removal | Complete | google-oauth.controller.ts, auth.controller.ts |
| ✅ Password validation strengthened | Complete | register.dto.ts, user.service.ts (bcrypt rounds 10→12) |
| ✅ User enumeration fixed | Complete | auth.controller.ts |
| ✅ Rate limiting added | Ready to integrate | throttler.config.ts, app.module.ts |
| ✅ OAuth state validation | Ready to integrate | oauth-state.store.ts, google-oauth.controller.ts |
| ✅ Password reset flow | Complete | Multiple files in auth/ and notification/ |
| ✅ JWT algorithm explicit | Ready to integrate | auth.module.ts |
| ✅ Timing attack prevention | Ready to integrate | user.service.ts |
| ✅ Token revocation | Ready to integrate | jwt-blacklist.service.ts, jwt.strategy.ts |
| ✅ Security headers | Ready to integrate | main.ts (helmet) |
| ✅ HTTPS enforcement | Ready to integrate | main.ts |

All infrastructure is built. Follow this guide to integrate everything.
