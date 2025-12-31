/**
 * Dependency injection tokens for Redis module
 */

/**
 * Shared Redis client injection token
 * Used across the application for caching, sessions, token storage, etc.
 *
 * Available in any module via:
 * ```typescript
 * constructor(@Inject(REDIS_CLIENT) private redis: Redis | null) {}
 * ```
 *
 * Returns null when running in test mode or without REDIS_URL configured.
 */
export const REDIS_CLIENT = Symbol('REDIS_CLIENT')
