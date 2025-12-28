import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

import { EnvVariables } from '../../config/env-variables'
import { User } from '../../user/entities'
import { UserRole } from '../../user/enums'
import { AuthService, JwtPayload } from '../services/auth.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(EnvVariables.JWT_SECRET),
    })
  }

  async validate(payload: JwtPayload) {
    const user = await this.authService.findUserById(payload.sub)
    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    // Check if user is suspended
    if (user.role === UserRole.SUSPENDED) {
      throw new UnauthorizedException('User account is suspended')
    }

    return user
  }
}
