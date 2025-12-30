import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

import { EnvVariables } from '../config/env-variables'

/**
 * Store for OAuth state tokens to prevent CSRF attacks
 * States are stored with a TTL of 10 minutes
 */
@Injectable()
export class OAuthStateStore {
  private readonly logger = new Logger(OAuthStateStore.name)

  private readonly redis: Redis | null = null

  private readonly inMemoryStore = new Map<
    string,
    { data: string; expiresAt: number }
  >()

  private readonly STATE_TTL = 600 // 10 minutes in seconds

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
      })
    } else {
      this.logger.warn(
        'Redis not configured, using in-memory OAuth state storage (not safe for multi-instance deployments)',
      )
    }
  }

  /**
   * Store an OAuth state token
   */
  async store(state: string, data: string): Promise<void> {
    if (this.redis) {
      const key = `oauth:state:${state}`
      await this.redis.setex(key, this.STATE_TTL, data)
      this.logger.debug(`Stored OAuth state: ${state}`)
    } else {
      // Fallback to in-memory (development only)
      this.inMemoryStore.set(state, {
        data,
        expiresAt: Date.now() + this.STATE_TTL * 1000,
      })
    }
  }

  /**
   * Retrieve and delete an OAuth state token (one-time use)
   */
  async retrieve(state: string): Promise<string | null> {
    if (this.redis) {
      const key = `oauth:state:${state}`
      const data = await this.redis.get(key)

      if (data) {
        // Delete immediately after retrieval (one-time use)
        await this.redis.del(key)
        this.logger.debug(`Retrieved and deleted OAuth state: ${state}`)
      }

      return data
    }
    // Fallback to in-memory
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
   * Cleanup expired in-memory states (called periodically if using in-memory)
   */
  cleanupExpired(): void {
    if (this.redis) {
      return
    }

    const now = Date.now()

    for (const [state, entry] of this.inMemoryStore.entries()) {
      if (entry.expiresAt < now) {
        this.inMemoryStore.delete(state)
      }
    }
  }

  /**
   * Disconnect Redis connection on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
    }
  }
}
