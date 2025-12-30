import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { randomBytes } from 'crypto'
import Redis from 'ioredis'

import { EnvVariables } from '../config/env-variables'

/**
 * Store for one-time token exchange codes
 * Prevents exposing access tokens in URLs during OAuth redirects
 */
@Injectable()
export class TokenExchangeStore implements OnModuleDestroy {
  private readonly logger = new Logger(TokenExchangeStore.name)

  private readonly redis: Redis | null = null

  private readonly inMemoryStore = new Map<
    string,
    { token: string; expiresAt: number }
  >()

  private readonly EXCHANGE_CODE_TTL = 60 // 1 minute in seconds

  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>(EnvVariables.REDIS_URL)

    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn(
              'Redis connection failed after 3 attempts, falling back to in-memory storage',
            )

            return null
          }

          return Math.min(times * 50, 2000)
        },
      })

      this.redis.connect().catch((err) => {
        this.logger.error('Failed to connect to Redis for token exchange', err)
        this.logger.warn('Falling back to in-memory token exchange storage')
      })
    } else {
      this.logger.warn(
        'Redis not configured, using in-memory token exchange storage (not safe for multi-instance deployments)',
      )
      this.startCleanupInterval()
    }
  }

  /**
   * Generate a secure one-time exchange code
   */
  generateExchangeCode(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Store an access token with a one-time exchange code
   */
  async store(exchangeCode: string, accessToken: string): Promise<void> {
    if (this.redis) {
      try {
        const key = `token:exchange:${exchangeCode}`
        await this.redis.setex(key, this.EXCHANGE_CODE_TTL, accessToken)
        this.logger.debug(`Stored token exchange code: ${exchangeCode}`)
      } catch (error) {
        this.logger.error('Failed to store in Redis, using in-memory', error)
        this.storeInMemory(exchangeCode, accessToken)
      }
    } else {
      this.storeInMemory(exchangeCode, accessToken)
    }
  }

  /**
   * Retrieve and delete a token using exchange code (one-time use)
   */
  async retrieve(exchangeCode: string): Promise<string | null> {
    if (this.redis) {
      try {
        const key = `token:exchange:${exchangeCode}`
        // Use GETDEL for atomic retrieval and deletion (Redis 6.2+)
        const token = await this.redis.getdel(key)

        if (token) {
          this.logger.debug(
            `Retrieved and deleted token exchange code: ${exchangeCode}`,
          )
        }

        return token
      } catch (error) {
        this.logger.error(
          'Failed to retrieve from Redis, checking in-memory',
          error,
        )

        return this.retrieveFromMemory(exchangeCode)
      }
    }

    return this.retrieveFromMemory(exchangeCode)
  }

  /**
   * Store in memory (fallback)
   */
  private storeInMemory(exchangeCode: string, accessToken: string): void {
    const ttlMs = this.EXCHANGE_CODE_TTL * 1000

    this.inMemoryStore.set(exchangeCode, {
      token: accessToken,
      expiresAt: Date.now() + ttlMs,
    })
  }

  /**
   * Retrieve from memory (fallback)
   */
  private retrieveFromMemory(exchangeCode: string): string | null {
    const entry = this.inMemoryStore.get(exchangeCode)

    if (!entry) {
      return null
    }

    // Check expiration
    if (entry.expiresAt < Date.now()) {
      this.inMemoryStore.delete(exchangeCode)

      return null
    }

    // Delete after retrieval (one-time use)
    this.inMemoryStore.delete(exchangeCode)

    return entry.token
  }

  /**
   * Cleanup expired in-memory entries
   */
  private cleanupExpired(): void {
    const now = Date.now()

    for (const [code, entry] of this.inMemoryStore.entries()) {
      if (entry.expiresAt < now) {
        this.inMemoryStore.delete(code)
      }
    }
  }

  /**
   * Start periodic cleanup for in-memory storage
   */
  private startCleanupInterval(): void {
    if (!this.cleanupInterval) {
      this.cleanupInterval = setInterval(
        () => this.cleanupExpired(),
        30000, // Every 30 seconds
      )
    }
  }

  /**
   * Disconnect Redis and cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    if (this.redis) {
      await this.redis.quit()
    }
  }
}
