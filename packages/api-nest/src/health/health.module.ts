import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TerminusModule } from '@nestjs/terminus'

import { QueueModule } from '../queue/queue.module'
import { HealthController } from './health.controller'
import { RedisHealthIndicator } from './redis-health.indicator'

@Module({
  imports: [TerminusModule, ConfigModule, QueueModule],
  controllers: [HealthController],
  providers: [RedisHealthIndicator],
})
export class HealthModule {}
