/**
 * Dependency injection tokens for the auth module
 */

/**
 * Shared Redis client injection token
 * Used for all auth stores (token exchange, verification, password reset, OAuth state)
 */
export const REDIS_CLIENT = Symbol('REDIS_CLIENT')
