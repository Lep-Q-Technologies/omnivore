import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

import { EnvVariables } from '../config/env-variables'

export interface RedisClientOptions {
  /** Whether to reject unauthorized TLS certificates (default: true) */
  rejectUnauthorized?: boolean
  /** Context label for error logging */
  context?: string
}

export interface RedisClientResult {
  redis: Redis | null
  isInMemoryMode: boolean
}

/**
 * Creates a configured Redis client or returns null for in-memory mode.
 * Handles NODE_ENV detection, TLS configuration, and connection with error handling.
 */
export async function createRedisClient(
  configService: ConfigService,
  options: RedisClientOptions = {},
): Promise<RedisClientResult> {
  const { rejectUnauthorized = true, context = 'Redis' } = options

  const nodeEnv = configService.get<string>(
    EnvVariables.NODE_ENV,
    'development',
  )
  const redisUrl = configService.get<string>(EnvVariables.REDIS_URL)

  // In test mode or without Redis URL, use in-memory storage
  if (nodeEnv === 'test' || !redisUrl) {
    return { redis: null, isInMemoryMode: true }
  }

  const tlsCert = configService.get<string>(EnvVariables.REDIS_TLS_CERT)

  const redis = new Redis(redisUrl, {
    lazyConnect: true,
    tls: tlsCert
      ? {
          ca: tlsCert,
          rejectUnauthorized,
        }
      : null,
  })

  // Connect with error handling
  // If Redis is configured, we expect it to be available
  // Don't silently fall back to in-memory - fail fast to surface misconfigurations
  const logger = new Logger(context)

  try {
    await redis.connect()
    logger.log(`Successfully connected to Redis (${context})`)
  } catch (err) {
    logger.error(
      'Failed to connect to Redis',
      err instanceof Error ? { message: err.message, stack: err.stack } : err,
    )

    try {
      await redis.quit()
    } catch {
      // Ignore cleanup errors - connection may already be closed
    }

    // Re-throw the error - let the app fail at startup
    // This prevents running in a degraded state and surfaces configuration issues
    throw new Error(
      `Redis connection failed (${context}): ${
        err instanceof Error ? { message: err.message, stack: err.stack } : err
      }`,
    )
  }

  return { redis, isInMemoryMode: false }
}
