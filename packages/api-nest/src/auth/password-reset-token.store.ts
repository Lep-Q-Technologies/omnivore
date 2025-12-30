import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { randomBytes } from 'crypto'
import Redis from 'ioredis'

import { EnvVariables } from '../config/env-variables'

export interface PasswordResetTokenPayload {
  userId: string
  email: string
  createdAt: number
}

/**
 * Store for password reset tokens
 * Tokens are stored with a TTL of 1 hour for security
 */
@Injectable()
export class PasswordResetTokenStore implements OnModuleDestroy {
  private readonly logger = new Logger(PasswordResetTokenStore.name)

  private readonly redis: Redis | null = null

  private readonly inMemoryStore = new Map<
    string,
    { payload: PasswordResetTokenPayload; expiresAt: number }
  >()

  private readonly TOKEN_TTL = 3600 // 1 hour in seconds

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
        this.logger.error(
          'Failed to connect to Redis for password reset tokens',
          err,
        )
        this.logger.warn('Falling back to in-memory storage')
        this.startCleanupInterval()
      })
    } else {
      this.logger.warn(
        'Redis not configured, using in-memory password reset token storage',
      )
      this.startCleanupInterval()
    }
  }

  /**
   * Generate and store a password reset token
   */
  async create(payload: PasswordResetTokenPayload): Promise<string> {
    const token = randomBytes(32).toString('hex')

    if (this.redis) {
      const key = `password-reset:${token}`
      await this.redis.setex(key, this.TOKEN_TTL, JSON.stringify(payload))
      this.logger.debug(
        `Created password reset token for user ${payload.userId}`,
      )
    } else {
      // Fallback to in-memory
      const ttlMs = this.TOKEN_TTL * 1000
      this.inMemoryStore.set(token, {
        payload,
        expiresAt: Date.now() + ttlMs,
      })
    }

    return token
  }

  /**
   * Retrieve and delete a password reset token (one-time use)
   */
  async retrieve(token: string): Promise<PasswordResetTokenPayload | null> {
    if (this.redis) {
      try {
        const key = `password-reset:${token}`
        // Use GETDEL for atomic retrieval and deletion (Redis 6.2+)
        const data = await this.redis.getdel(key)

        if (!data) {
          return null
        }

        this.logger.debug(`Retrieved and deleted password reset token`)

        return JSON.parse(data) as PasswordResetTokenPayload
      } catch (error) {
        this.logger.error(
          'Failed to retrieve from Redis, using in-memory',
          error,
        )

        return this.retrieveFromMemory(token)
      }
    }

    return this.retrieveFromMemory(token)
  }

  /**
   * Retrieve from in-memory store
   */
  private retrieveFromMemory(token: string): PasswordResetTokenPayload | null {
    const entry = this.inMemoryStore.get(token)

    if (!entry) {
      return null
    }

    // Check expiration
    if (entry.expiresAt < Date.now()) {
      this.inMemoryStore.delete(token)

      return null
    }

    // Delete after retrieval (one-time use)
    this.inMemoryStore.delete(token)

    return entry.payload
  }

  /**
   * Delete a password reset token
   */
  async delete(token: string): Promise<void> {
    if (this.redis) {
      const key = `password-reset:${token}`
      await this.redis.del(key)
    } else {
      this.inMemoryStore.delete(token)
    }
  }

  /**
   * Cleanup expired in-memory tokens
   */
  private cleanupExpired(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [token, entry] of this.inMemoryStore.entries()) {
      if (entry.expiresAt < now) {
        this.inMemoryStore.delete(token)
        cleaned++
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired password reset tokens`)
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
      this.logger.debug('Started cleanup interval for in-memory token storage')
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
