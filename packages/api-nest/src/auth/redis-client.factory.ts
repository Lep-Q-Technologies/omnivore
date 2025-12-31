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

  // Connect with graceful error handling
  const logger = new Logger(context)

  try {
    await redis.connect()
  } catch (err) {
    logger.error(
      'Failed to connect to Redis',
      err instanceof Error ? err.stack : err,
    )
  }

  return { redis, isInMemoryMode: false }
}
