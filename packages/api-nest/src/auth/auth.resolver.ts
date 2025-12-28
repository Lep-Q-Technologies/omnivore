import { UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Context, Query, Resolver } from '@nestjs/graphql'
import { Request } from 'express'

import { EnvVariables } from '../config/env-variables'
import { CurrentUser } from '../user/decorators/current-user.decorator'
import { User } from '../user/entities/user.entity'
import { AuthPayload } from './graphql/auth-payload.type'
import { JwtAuthGuard } from './guards/jwt-auth.guard'

@Resolver(() => AuthPayload)
export class AuthResolver {
  constructor(private readonly configService: ConfigService) {}

  @Query(() => AuthPayload, { name: 'session', nullable: true })
  @UseGuards(JwtAuthGuard)
  session(
    @CurrentUser() user: User,
    @Context('req') req: Request,
  ): AuthPayload | null {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return null
    }

    const accessToken = authHeader.replace(/^Bearer\s+/i, '')

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<string>(
        EnvVariables.JWT_EXPIRES_IN,
        '1h',
      ),
      user,
    }
  }
}
