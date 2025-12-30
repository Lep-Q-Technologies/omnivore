import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

import { EnvVariables } from '../config/env-variables'

/**
 * Store for OAuth state tokens to prevent CSRF attacks
 * States are stored with a TTL of 10 minutes
 */
@Injectable()
export class OAuthStateStore implements OnModuleDestroy {
  private readonly logger = new Logger(OAuthStateStore.name)

  private readonly redis: Redis | null = null

  private readonly inMemoryStore = new Map<
    string,
    { data: string; expiresAt: number }
  >()

  private readonly STATE_TTL = 600 // 10 minutes in seconds

  private cleanupInterval: NodeJS.Timeout | null = null

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
        this.logger.error('Failed to connect to Redis for OAuth state', err)
        this.logger.warn('Falling back to in-memory storage')
        this.startCleanupInterval()
      })
    } else {
      this.logger.warn(
        'Redis not configured, using in-memory OAuth state storage (not safe for multi-instance deployments)',
      )
      this.startCleanupInterval()
    }
  }

  /**
   * Store an OAuth state token
   */
  async store(state: string, data: string): Promise<void> {
    if (this.redis) {
      try {
        const key = `oauth:state:${state}`
        await this.redis.setex(key, this.STATE_TTL, data)
        this.logger.debug(`Stored OAuth state: ${state}`)
      } catch (error) {
        this.logger.error('Failed to store in Redis, using in-memory', error)
        this.storeInMemory(state, data)
      }
    } else {
      this.storeInMemory(state, data)
    }
  }

  /**
   * Store in memory (fallback)
   */
  private storeInMemory(state: string, data: string): void {
    const ttlMs = this.STATE_TTL * 1000

    this.inMemoryStore.set(state, {
      data,
      expiresAt: Date.now() + ttlMs,
    })
  }

  /**
   * Retrieve and delete an OAuth state token (one-time use)
   */
  async retrieve(state: string): Promise<string | null> {
    if (this.redis) {
      try {
        const key = `oauth:state:${state}`
        // Use GETDEL for atomic retrieval and deletion (Redis 6.2+)
        const data = await this.redis.getdel(key)

        if (data) {
          this.logger.debug(`Retrieved and deleted OAuth state: ${state}`)
        }

        return data
      } catch (error) {
        this.logger.error(
          'Failed to retrieve from Redis, using in-memory',
          error,
        )

        return this.retrieveFromMemory(state)
      }
    }

    return this.retrieveFromMemory(state)
  }

  /**
   * Retrieve from in-memory store
   */
  private retrieveFromMemory(state: string): string | null {
    const entry = this.inMemoryStore.get(state)

    if (!entry) {
      return null
    }

    // Check expiration
    if (entry.expiresAt < Date.now()) {
      this.inMemoryStore.delete(state)

      return null
    }

    // Delete after retrieval (one-time use)
    this.inMemoryStore.delete(state)

    return entry.data
  }

  /**
   * Cleanup expired in-memory states
   */
  private cleanupExpired(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [state, entry] of this.inMemoryStore.entries()) {
      if (entry.expiresAt < now) {
        this.inMemoryStore.delete(state)
        cleaned++
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired OAuth states`)
    }
  }

  /**
   * Start periodic cleanup for in-memory storage
   */
  private startCleanupInterval(): void {
    if (!this.cleanupInterval) {
      this.cleanupInterval = setInterval(
        () => this.cleanupExpired(),
        300000, // Every 5 minutes
      )
      this.logger.debug(
        'Started cleanup interval for in-memory OAuth state storage',
      )
    }
  }

  /**
   * Disconnect Redis and cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.logger.debug('Stopped cleanup interval')
    }

    if (this.redis) {
      await this.redis.quit()
      this.logger.debug('Disconnected from Redis')
    }
  }
}
