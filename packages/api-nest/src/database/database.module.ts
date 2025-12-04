import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { EnvVariables } from '../config/env-variables'
import { Filter } from '../filter/entities/filter.entity'
import { Group } from '../group/entities/group.entity'
import { GroupMembership } from '../group/entities/group-membership.entity'
import { Invite } from '../group/entities/invite.entity'
import { HighlightEntity } from '../highlight/entities/highlight.entity'
import { EntityLabel } from '../label/entities/entity-label.entity'
import { Label } from '../label/entities/label.entity'
import { LibraryItemEntity } from '../library/entities/library-item.entity'
import { SubscriptionEntity } from '../library/entities/subscription.entity'
import { LoggingModule } from '../logging/logging.module'
import { StructuredLogger } from '../logging/structured-logger.service'
import { ReadingProgressEntity } from '../reading-progress/entities/reading-progress.entity'
import { User, UserPersonalization, UserProfile } from '../user/entities'
import { QueryPerformanceLogger } from './query-logger'

@Module({
  imports: [
    LoggingModule, // Import to get access to StructuredLogger
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule, LoggingModule],
      useFactory: async (
        configService: ConfigService,
        structuredLogger: StructuredLogger,
      ) => {
        const isDevelopment =
          configService.get(EnvVariables.NODE_ENV) === 'development'

        return {
          type: 'postgres',
          host: configService.get<string>(
            EnvVariables.DATABASE_HOST,
            'localhost',
          ),
          port: configService.get<number>(EnvVariables.DATABASE_PORT, 5432),
          username: configService.get<string>(
            EnvVariables.DATABASE_USER,
            'app_user',
          ),
          password: configService.get<string>(EnvVariables.DATABASE_PASSWORD),
          database: configService.get<string>(
            EnvVariables.DATABASE_NAME,
            'omnivore',
          ),

          // Entity configuration
          entities: [
            User,
            UserProfile,
            UserPersonalization,
            Filter,
            Group,
            Invite,
            GroupMembership,
            SubscriptionEntity,
            LibraryItemEntity,
            Label,
            EntityLabel,
            HighlightEntity,
            ReadingProgressEntity,
          ],
          // DEBUG: Log entities to check if any are undefined
          // logging: true,
          // logger: 'advanced-console',
          migrationsRun: false,
          synchronize: false,
          logging: ['query', 'warn', 'error'],
          // Use QueryPerformanceLogger to track slow queries
          logger: new QueryPerformanceLogger(structuredLogger, isDevelopment),
          // Log queries slower than 1 second (QueryPerformanceLogger handles >500ms as "slow")
          maxQueryExecutionTime: 1000,

          // Connection pool settings for production
          extra: {
            max: 20, // Maximum number of connections
            min: 5, // Minimum number of connections
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
          },

          // Enable SSL in production
          ssl:
            configService.get(EnvVariables.NODE_ENV) === 'production'
              ? { rejectUnauthorized: false }
              : false,
        }
      },
      inject: [ConfigService, StructuredLogger],
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
