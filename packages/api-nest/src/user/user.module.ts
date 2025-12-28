import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { User, UserPersonalization, UserProfile } from './entities'
import { RoleService } from './role.service'
import { UserResolver } from './user.resolver'
import { UserService } from './user.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, UserPersonalization]),
    ConfigModule,
  ],
  providers: [UserService, UserResolver, RoleService],
  exports: [UserService, RoleService],
})
export class UserModule {}
