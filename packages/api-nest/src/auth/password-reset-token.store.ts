import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { randomBytes } from 'crypto'
import Redis from 'ioredis'

export interface PasswordResetTokenPayload {
  userId: string
  email: string
  createdAt: number
}

/**
 * Store for password reset tokens
 * Tokens are stored with a TTL of 1 hour for security
 *
 * Supports injection of a pre-configured Redis client for shared connection pooling
 */
@Injectable()
export class PasswordResetTokenStore implements OnModuleDestroy {
  private readonly logger = new Logger(PasswordResetTokenStore.name)

  private readonly inMemoryStore = new Map<
    string,
    { payload: PasswordResetTokenPayload; expiresAt: number }
  >()

  private readonly TOKEN_TTL = 3600 // 1 hour in seconds

  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(private readonly redis: Redis | null) {
    if (!this.redis) {
      this.logger.warn(
        'Redis not provided, using in-memory password reset token storage (not safe for multi-instance deployments)',
      )
      this.startCleanupInterval()
    } else {
      this.logger.debug('PasswordResetTokenStore initialized with Redis client')
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

        // Safe JSON.parse with validation
        let parsed: unknown = null
        try {
          parsed = JSON.parse(data)
        } catch (parseError) {
          this.logger.error(
            'Failed to parse password reset token JSON from Redis',
            parseError,
          )

          return this.retrieveFromMemory(token)
        }

        // Validate required fields
        if (!this.isValidPayload(parsed)) {
          this.logger.error(
            'Invalid password reset token payload structure from Redis',
            { parsed },
          )

          return this.retrieveFromMemory(token)
        }

        return parsed
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
   * Validate that parsed data has required PasswordResetTokenPayload shape
   */
  private isValidPayload(data: unknown): data is PasswordResetTokenPayload {
    if (!data || typeof data !== 'object') {
      return false
    }

    const obj = data as Record<string, unknown>

    return (
      typeof obj.userId === 'string' &&
      typeof obj.email === 'string' &&
      typeof obj.createdAt === 'number'
    )
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
   * Cleanup on module destroy
   * Note: Redis client is shared, so lifecycle is managed by the provider
   */
  async onModuleDestroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.logger.debug('Stopped cleanup interval')
    }

    this.logger.debug('PasswordResetTokenStore destroyed')
  }
}
