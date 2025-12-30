import { Injectable } from '@nestjs/common'

/**
 * Application Service
 * Provides basic application information and health check endpoints
 */
@Injectable()
export class AppService {
  /**
   * Get application information
   * @returns Application metadata including name, version, and current status
   */
  getApplicationInfo() {
    return {
      name: 'Omnivore NestJS API',
      version: '1.0.0',
      description: 'Migration from Express to NestJS',
      status: 'development',
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Get application version information
   * @returns Version details including app version, Node.js version, and environment
   */
  getVersion() {
    return {
      version: '1.0.0',
      node: process.version,
      environment: process.env.NODE_ENV || 'development',
    }
  }
}
