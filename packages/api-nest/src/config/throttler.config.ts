import { ThrottlerModuleOptions } from '@nestjs/throttler'

/**
 * Rate limiting configuration for API endpoints
 *
 * Default limits:
 * - 100 requests per minute for general endpoints
 * - 5 requests per minute for auth endpoints (more restrictive)
 */
export const throttlerConfig: ThrottlerModuleOptions = {
  throttlers: [
    {
      name: 'default',
      ttl: 60000, // 1 minute in milliseconds
      limit: 100, // 100 requests per minute
    },
    {
      name: 'auth',
      ttl: 60000, // 1 minute in milliseconds
      limit: 5, // 5 login/register attempts per minute
    },
    {
      name: 'resend-verification',
      ttl: 300000, // 5 minutes in milliseconds
      limit: 3, // 3 resend attempts per 5 minutes
    },
  ],
}

/**
 * Custom throttler guard configuration per endpoint
 *
 * Usage:
 * @Throttle({ auth: { limit: 3, ttl: 60000 } })
 * @Post('login')
 * async login() { ... }
 */
