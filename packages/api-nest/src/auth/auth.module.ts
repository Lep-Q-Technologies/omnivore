import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import Redis from 'ioredis'

import { AnalyticsService } from '../analytics/analytics.service'
import { EnvVariables } from '../config/env-variables'
import { Filter } from '../filter/entities/filter.entity'
import { IntercomService } from '../integrations/intercom.service'
import { LoggingModule } from '../logging/logging.module'
import { NotificationModule } from '../notification/notification.module'
import { PubSubService } from '../pubsub/pubsub.service'
import { UserModule } from '../user/user.module'
import { REDIS_CLIENT } from './auth.constants'
import { AuthController } from './auth.controller'
import { AuthResolver } from './auth.resolver'
import { GoogleOAuthController } from './controllers/google-oauth.controller'
import { MobileAuthController } from './controllers/mobile-auth.controller'
import { DefaultUserResourcesService } from './default-user-resources.service'
import { EmailVerificationService } from './email-verification.service'
import { InMemoryVerificationTokenStore } from './in-memory-verification-token.store'
import { NotificationClient } from './interfaces/notification-client.interface'
import { VerificationTokenStore } from './interfaces/verification-token-store.interface'
import { OAuthStateStore } from './oauth-state.store'
import { PasswordResetTokenStore } from './password-reset-token.store'
import { QueueNotificationClient } from './queue-notification.client'
import { createRedisClient } from './redis-client.factory'
import { RedisConnectionProvider } from './redis-connection.provider'
import { RedisVerificationTokenStore } from './redis-verification-token.store'
import { AuthService } from './services/auth.service'
import { GoogleOAuthService } from './services/google-oauth.service'
import { OAuthAuthService } from './services/oauth-auth.service'
import { PasswordService } from './services/password.service'
import { PendingUserService } from './services/pending-user.service'
import { UserRegistrationService } from './services/user-registration.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { LocalStrategy } from './strategies/local.strategy'
import { TokenExchangeStore } from './token-exchange.store'

@Module({
  imports: [
    UserModule, // Import user module for UserService
    LoggingModule, // Import logging module for StructuredLogger
    NotificationModule, // Import notification module for EmailService
    TypeOrmModule.forFeature([Filter]), // Import Filter repository for DefaultUserResourcesService
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>(EnvVariables.JWT_SECRET),
        signOptions: {
          expiresIn: configService.get<string>(
            EnvVariables.JWT_EXPIRES_IN,
            '1h',
          ),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, GoogleOAuthController, MobileAuthController],
  providers: [
    AuthService,
    GoogleOAuthService,
    PendingUserService,
    OAuthAuthService,
    PasswordService,
    UserRegistrationService,
    JwtStrategy,
    LocalStrategy,
    EmailVerificationService,
    DefaultUserResourcesService,
    AnalyticsService,
    PubSubService,
    IntercomService,
    // Shared Redis connection lifecycle manager
    {
      provide: RedisConnectionProvider,
      useFactory: async (configService: ConfigService) => {
        const { redis, isInMemoryMode } = await createRedisClient(
          configService,
          {
            rejectUnauthorized: true,
            context: 'AuthRedis',
          },
        )

        return new RedisConnectionProvider(isInMemoryMode ? null : redis)
      },
      inject: [ConfigService],
    },
    // Shared Redis client accessor for dependency injection
    {
      provide: REDIS_CLIENT,
      useFactory: (connectionProvider: RedisConnectionProvider) => {
        return connectionProvider.client
      },
      inject: [RedisConnectionProvider],
    },
    // Token exchange store (OAuth flow)
    {
      provide: TokenExchangeStore,
      useFactory: (redis: Redis | null, configService: ConfigService) => {
        const exchangeCodeTtl = configService.get<number>(
          EnvVariables.TOKEN_EXCHANGE_TTL,
          60,
        )

        return new TokenExchangeStore(redis, exchangeCodeTtl)
      },
      inject: [REDIS_CLIENT, ConfigService],
    },
    // Password reset token store
    {
      provide: PasswordResetTokenStore,
      useFactory: (redis: Redis | null) => {
        return new PasswordResetTokenStore(redis)
      },
      inject: [REDIS_CLIENT],
    },
    // OAuth state store (CSRF protection)
    {
      provide: OAuthStateStore,
      useFactory: (redis: Redis | null) => {
        return new OAuthStateStore(redis)
      },
      inject: [REDIS_CLIENT],
    },
    // Verification token store (email verification)
    {
      provide: VerificationTokenStore,
      useFactory: (redis: Redis | null) => {
        if (!redis) {
          return new InMemoryVerificationTokenStore()
        }

        return new RedisVerificationTokenStore(redis)
      },
      inject: [REDIS_CLIENT],
    },
    {
      provide: NotificationClient,
      useClass: QueueNotificationClient,
    },
    AuthResolver,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
