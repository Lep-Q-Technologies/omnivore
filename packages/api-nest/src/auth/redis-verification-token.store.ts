import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import Redis from 'ioredis'

import {
  VerificationTokenPayload,
  VerificationTokenStore,
} from './interfaces/verification-token-store.interface'

/**
 * Redis-backed verification token store
 * Supports injection of a pre-configured Redis client for shared connection pooling
 */
@Injectable()
export class RedisVerificationTokenStore
  implements VerificationTokenStore, OnModuleDestroy
{
  private readonly logger = new Logger(RedisVerificationTokenStore.name)

  constructor(private readonly redis: Redis) {}

  async write(
    token: string,
    payload: VerificationTokenPayload,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redis.set(
      this.key(token),
      JSON.stringify(payload),
      'EX',
      ttlSeconds,
    )
  }

  async read(token: string): Promise<VerificationTokenPayload | null> {
    const raw = await this.redis.get(this.key(token))
    if (!raw) {
      return null
    }
    try {
      return JSON.parse(raw) as VerificationTokenPayload
    } catch (err) {
      this.logger.warn(`Failed to parse verification token payload: ${err}`)

      return null
    }
  }

  async delete(token: string): Promise<void> {
    await this.redis.del(this.key(token))
  }

  /**
   * Cleanup on module destroy
   * Note: Redis client is shared, so lifecycle is managed by the provider
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.debug('RedisVerificationTokenStore destroyed')
  }

  private key(token: string): string {
    return `email-verification:${token}`
  }
}
