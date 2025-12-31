import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import Redis from 'ioredis'

/**
 * Shared Redis connection provider for auth module
 * Manages the lifecycle of the shared Redis client
 */
@Injectable()
export class RedisConnectionProvider implements OnModuleDestroy {
  private readonly logger = new Logger(RedisConnectionProvider.name)

  constructor(public readonly client: Redis | null) {
    if (client) {
      this.logger.debug('Shared Redis connection initialized for auth module')
    } else {
      this.logger.warn(
        'No Redis client provided - auth stores will use in-memory fallback',
      )
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client && !['end', 'close'].includes(this.client.status)) {
      try {
        await this.client.quit()
        this.logger.debug('Shared Redis connection closed')
      } catch (error) {
        this.logger.warn('Error closing shared Redis connection', { error })
      }
    }
  }
}
