import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { CorrelationIdMiddleware } from './correlation-id.middleware'
import { RequestLoggingMiddleware } from './request-logging.middleware'
import { StructuredLogger } from './structured-logger.service'

@Module({
  imports: [ConfigModule],
  providers: [StructuredLogger],
  exports: [StructuredLogger],
})
export class LoggingModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply correlation ID middleware first
    consumer.apply(CorrelationIdMiddleware).forRoutes('*')

    // Then apply request logging middleware
    consumer.apply(RequestLoggingMiddleware).forRoutes('*')
  }
}
