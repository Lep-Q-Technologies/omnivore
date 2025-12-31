import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

import { REDIS_CLIENT } from './redis.constants'
import { createRedisClient } from './redis-client.factory'

/**
 * Global Redis module providing a shared Redis client for the entire application.
 * Similar to DatabaseModule (TypeORM), this ensures a single Redis connection
 * is reused across all modules that need caching, sessions, or pub/sub.
 *
 * Usage in other modules:
 * ```typescript
 * import { REDIS_CLIENT } from '@/redis/redis.constants'
 *
 * constructor(@Inject(REDIS_CLIENT) private redis: Redis | null) {}
 * ```
 *
 * Note: Health checks should create their own isolated client for strict timeouts.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: async (configService: ConfigService) => {
        const { redis, isInMemoryMode } = await createRedisClient(
          configService,
          {
            rejectUnauthorized: true,
            context: 'AppRedis',
          },
        )

        return isInMemoryMode ? null : redis
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis | null) {}

  async onModuleDestroy(): Promise<void> {
    if (this.redis && !['end', 'close'].includes(this.redis.status)) {
      try {
        await this.redis.quit()
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
