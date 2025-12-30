import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { randomBytes } from 'crypto'

import { EnvVariables } from '../config/env-variables'
import {
  VerificationTokenPayload,
  VerificationTokenStore,
} from './interfaces/verification-token-store.interface'

export interface CreateVerificationOptions {
  userId: string
  email?: string
}

export interface VerifyTokenOptions {
  consume?: boolean
}

/**
 * Email Verification Service
 * Handles creation and verification of email verification tokens
 */
@Injectable()
export class EmailVerificationService {
  private readonly ttlSeconds: number

  constructor(
    private readonly configService: ConfigService,
    @Inject(VerificationTokenStore)
    private readonly store: VerificationTokenStore,
  ) {
    this.ttlSeconds = this.configService.get<number>(
      EnvVariables.AUTH_EMAIL_TOKEN_TTL,
      60,
    )
  }

  /**
   * Create a new email verification token
   * @param payload - Token payload containing userId and optional email
   * @returns A 64-character hex token string
   */
  async createVerificationToken(
    payload: CreateVerificationOptions,
  ): Promise<string> {
    const token = randomBytes(32).toString('hex')
    await this.store.write(
      token,
      { userId: payload.userId, email: payload.email },
      this.ttlSeconds,
    )

    return token
  }

  /**
   * Verify an email verification token
   * @param token - The verification token to verify
   * @param options - Verification options (e.g., consume: true for one-time use)
   * @returns The token payload if valid
   * @throws Error if token is not found or invalid
   */
  async verifyToken(
    token: string,
    options: VerifyTokenOptions = {},
  ): Promise<VerificationTokenPayload> {
    const record = await this.store.read(token)
    if (!record) {
      throw new Error('EMAIL_VERIFICATION_TOKEN_NOT_FOUND')
    }

    if (options.consume) {
      await this.store.delete(token)
    }

    return record
  }
}
