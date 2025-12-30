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
import { QueueNotificationClient } from './queue-notification.client'
import { RedisVerificationTokenStore } from './redis-verification-token.store'
import { AuthService } from './services/auth.service'
import { GoogleOAuthService } from './services/google-oauth.service'
import { OAuthAuthService } from './services/oauth-auth.service'
import { PendingUserService } from './services/pending-user.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { LocalStrategy } from './strategies/local.strategy'

@Module({
  imports: [
    UserModule, // Import user module for UserService
    LoggingModule, // Import logging module for StructuredLogger
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
    JwtStrategy,
    LocalStrategy,
    EmailVerificationService,
    DefaultUserResourcesService,
    AnalyticsService,
    PubSubService,
    IntercomService,
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
