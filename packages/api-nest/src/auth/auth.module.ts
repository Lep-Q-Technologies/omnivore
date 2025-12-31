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
import { AuthController } from './auth.controller'
import { AuthResolver } from './auth.resolver'
import { GoogleOAuthController } from './controllers/google-oauth.controller'
import { MobileAuthController } from './controllers/mobile-auth.controller'
import { DefaultUserResourcesService } from './default-user-resources.service'
import { EmailVerificationService } from './email-verification.service'
import { InMemoryVerificationTokenStore } from './in-memory-verification-token.store'
import { NotificationClient } from './interfaces/notification-client.interface'
import { VerificationTokenStore } from './interfaces/verification-token-store.interface'
import { PasswordResetTokenStore } from './password-reset-token.store'
import { QueueNotificationClient } from './queue-notification.client'
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
    PasswordResetTokenStore,
    {
      provide: TokenExchangeStore,
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>(
          EnvVariables.NODE_ENV,
          'development',
        )
        const redisUrl = configService.get<string>(EnvVariables.REDIS_URL)
        const exchangeCodeTtl = configService.get<number>(
          'TOKEN_EXCHANGE_TTL',
          60,
        )

        // In test mode or without Redis, use in-memory storage
        if (nodeEnv === 'test' || !redisUrl) {
          return new TokenExchangeStore(null, exchangeCodeTtl)
        }

        // Configure TLS-aware Redis client
        const tlsCert = configService.get<string>(EnvVariables.REDIS_TLS_CERT)

        const redis = new Redis(redisUrl, {
          lazyConnect: true,
          tls: tlsCert
            ? {
                ca: tlsCert,
                rejectUnauthorized: false,
              }
            : null,
        })

        // Connect and handle errors gracefully
        redis.connect().catch((err) => {
          console.error('TokenExchangeStore: Failed to connect to Redis', err)
        })

        return new TokenExchangeStore(redis, exchangeCodeTtl)
      },
      inject: [ConfigService],
    },
    {
      provide: NotificationClient,
      useClass: QueueNotificationClient,
    },
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

        const tlsCert = configService.get<string>(EnvVariables.REDIS_TLS_CERT)

        const redis = new Redis(redisUrl, {
          lazyConnect: true,
          tls: tlsCert
            ? {
                ca: tlsCert,
                rejectUnauthorized: false,
              }
            : null,
        })

        return new RedisVerificationTokenStore(redis)
      },
      inject: [ConfigService],
    },
    AuthResolver,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
