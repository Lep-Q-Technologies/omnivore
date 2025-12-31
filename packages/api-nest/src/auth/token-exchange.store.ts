import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { randomBytes } from 'crypto'
import Redis from 'ioredis'

/**
 * Store for one-time token exchange codes
 * Prevents exposing access tokens in URLs during OAuth redirects
 *
 * Supports injection of a pre-configured Redis client for TLS support
 */
@Injectable()
export class TokenExchangeStore implements OnModuleDestroy {
  private readonly logger = new Logger(TokenExchangeStore.name)

  private readonly inMemoryStore = new Map<
    string,
    { token: string; expiresAt: number }
  >()

  private readonly exchangeCodeTtl: number

  private cleanupInterval: NodeJS.Timeout | null = null

  // Simple rate limiting state (per-user code generation)
  private readonly rateLimitStore = new Map<
    string,
    { count: number; windowStart: number }
  >()

  private readonly RATE_LIMIT_WINDOW_MS = 60000 // 1 minute

  private readonly RATE_LIMIT_MAX_REQUESTS = 10 // Max 10 codes per minute per user

  // Metrics counters
  private metrics = {
    codesGenerated: 0,
    codesRedeemedSuccess: 0,
    codesRedeemedFailure: 0,
    codesExpired: 0,
    rateLimitHits: 0,
  }

  constructor(
    private readonly redis: Redis | null,
    exchangeCodeTtl?: number,
  ) {
    // Configurable TTL (default 60 seconds)
    this.exchangeCodeTtl = exchangeCodeTtl ?? 60

    if (!this.redis) {
      this.logger.warn(
        'Redis not provided, using in-memory token exchange storage (not safe for multi-instance deployments)',
      )
      this.startCleanupInterval()
    } else {
      this.logger.debug('TokenExchangeStore initialized with Redis client')
    }
  }

  /**
   * Check rate limit for code generation
   * @param identifier - User ID, IP, or other identifier for rate limiting
   * @returns true if within limits, false if rate limited
   */
  private checkRateLimit(identifier: string): boolean {
    const now = Date.now()
    const entry = this.rateLimitStore.get(identifier)

    if (!entry || now - entry.windowStart > this.RATE_LIMIT_WINDOW_MS) {
      // New window
      this.rateLimitStore.set(identifier, { count: 1, windowStart: now })

      return true
    }

    if (entry.count >= this.RATE_LIMIT_MAX_REQUESTS) {
      this.metrics.rateLimitHits++
      this.logger.warn('Rate limit exceeded for exchange code generation', {
        identifier,
        count: entry.count,
        limit: this.RATE_LIMIT_MAX_REQUESTS,
      })

      return false
    }

    entry.count++

    return true
  }

  /**
   * Generate a secure one-time exchange code
   * @param userId - Optional user ID for rate limiting and logging
   * @returns A cryptographically secure 64-character hex string, or null if rate limited
   */
  generateExchangeCode(userId?: string): string | null {
    const identifier = userId ?? 'anonymous'

    if (!this.checkRateLimit(identifier)) {
      this.logger.warn('Exchange code generation rate limited', {
        userId: identifier,
      })

      return null
    }

    const code = randomBytes(32).toString('hex')
    this.metrics.codesGenerated++
    this.logger.debug('Exchange code generated', { userId: identifier })

    return code
  }

  /**
   * Store an access token with a one-time exchange code
   * @param exchangeCode - The unique exchange code (64-char hex)
   * @param accessToken - The JWT access token to store
   * @param userId - Optional user ID for security logging
   * @returns Promise that resolves when storage is complete
   */
  async store(
    exchangeCode: string,
    accessToken: string,
    userId?: string,
  ): Promise<void> {
    if (this.redis) {
      try {
        const key = `token:exchange:${exchangeCode}`
        await this.redis.setex(key, this.exchangeCodeTtl, accessToken)
        this.logger.debug('Stored token exchange code', {
          exchangeCode: `${exchangeCode.substring(0, 8)}...`,
          userId,
        })
      } catch (error) {
        this.logger.error('Failed to store in Redis, using in-memory', {
          error,
          userId,
        })
        this.storeInMemory(exchangeCode, accessToken)
      }
    } else {
      this.storeInMemory(exchangeCode, accessToken)
    }
  }

  /**
   * Retrieve and delete a token using exchange code (one-time use)
   * @param exchangeCode - The unique exchange code to look up
   * @param clientInfo - Optional client info for security logging
   * @returns The JWT access token if found and valid, null otherwise
   */
  async retrieve(
    exchangeCode: string,
    clientInfo?: { userId?: string; ip?: string },
  ): Promise<string | null> {
    const logContext = {
      exchangeCode: `${exchangeCode.substring(0, 8)}...`,
      ...clientInfo,
    }

    if (this.redis) {
      try {
        const key = `token:exchange:${exchangeCode}`
        // Use GETDEL for atomic retrieval and deletion (Redis 6.2+)
        const token = await this.redis.getdel(key)

        if (token) {
          this.metrics.codesRedeemedSuccess++
          this.logger.debug('Exchange code redeemed successfully', logContext)
        } else {
          this.metrics.codesRedeemedFailure++
          this.logger.warn(
            'Exchange code retrieval failed: not found or expired',
            logContext,
          )
        }

        return token
      } catch (error) {
        this.logger.error('Failed to retrieve from Redis, checking in-memory', {
          error,
          ...logContext,
        })

        return this.retrieveFromMemory(exchangeCode, logContext)
      }
    }

    return this.retrieveFromMemory(exchangeCode, logContext)
  }

  /**
   * Get current metrics (for monitoring/observability)
   */
  getMetrics(): typeof this.metrics {
    return { ...this.metrics }
  }

  /**
   * Store in memory (fallback)
   */
  private storeInMemory(exchangeCode: string, accessToken: string): void {
    const ttlMs = this.exchangeCodeTtl * 1000

    this.inMemoryStore.set(exchangeCode, {
      token: accessToken,
      expiresAt: Date.now() + ttlMs,
    })
  }

  /**
   * Retrieve from memory (fallback)
   */
  private retrieveFromMemory(
    exchangeCode: string,
    logContext?: Record<string, unknown>,
  ): string | null {
    const entry = this.inMemoryStore.get(exchangeCode)

    if (!entry) {
      this.metrics.codesRedeemedFailure++
      this.logger.warn('Exchange code retrieval failed: not found', logContext)

      return null
    }

    // Check expiration
    if (entry.expiresAt < Date.now()) {
      this.inMemoryStore.delete(exchangeCode)
      this.metrics.codesExpired++
      this.logger.warn('Exchange code retrieval failed: expired', logContext)

      return null
    }

    // Delete after retrieval (one-time use)
    this.inMemoryStore.delete(exchangeCode)
    this.metrics.codesRedeemedSuccess++
    this.logger.debug(
      'Exchange code redeemed successfully (in-memory)',
      logContext,
    )

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
        this.metrics.codesExpired++
      }
    }

    // Also cleanup rate limit entries
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (now - entry.windowStart > this.RATE_LIMIT_WINDOW_MS * 2) {
        this.rateLimitStore.delete(key)
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
      // Unref so timer doesn't keep Node.js alive
      this.cleanupInterval.unref()
    }
  }

  /**
   * Disconnect Redis and cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    // Note: Redis client is injected, so we don't manage its lifecycle here
    // The factory that created us is responsible for cleanup
    this.logger.debug('TokenExchangeStore destroyed', {
      metrics: this.getMetrics(),
    })
  }
}
