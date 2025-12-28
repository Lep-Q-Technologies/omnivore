import Joi from 'joi'

import { EnvVariables } from './env-variables'

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  NEST_PORT: Joi.number().port().default(4001),

  JWT_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_SECRET must be at least 32 characters long',
    'any.required': 'JWT_SECRET is required for authentication',
  }),

  JWT_EXPIRES_IN: Joi.string()
    .pattern(/^(\d+[smhd]|\d+)$/)
    .default('1h')
    .messages({
      'string.pattern.base':
        'JWT_EXPIRES_IN must be a valid time format (e.g., 1h, 30m, 7d)',
    }),

  FRONTEND_URL: Joi.string()
    .custom((value, helpers) => {
      // Support comma-separated URLs for multiple frontends (web-vite, omnivore-polish)
      const urls = value.split(',').map((url: string) => url.trim())
      for (const url of urls) {
        try {
          new URL(url)
        } catch {
          return helpers.error('string.invalidUrl', { url })
        }
      }

      return value
    })
    .default('http://localhost:3000')
    .messages({
      'string.invalidUrl': 'FRONTEND_URL contains invalid URL: {{#url}}',
    }),

  // Database Configuration
  [EnvVariables.DATABASE_HOST]: Joi.required(),
  [EnvVariables.DATABASE_PORT]: Joi.required(),
  [EnvVariables.DATABASE_USER]: Joi.string(),
  [EnvVariables.DATABASE_PASSWORD]: Joi.string(),
  [EnvVariables.DATABASE_NAME]: Joi.required(),

  // Redis configuration
  [EnvVariables.REDIS_URL]: Joi.string()
    .uri()
    .default('redis://localhost:6379'),
  [EnvVariables.REDIS_TLS_CERT]: Joi.string().optional(),

  // Email verification configuration
  [EnvVariables.AUTH_EMAIL_TOKEN_TTL]: Joi.number()
    .integer()
    .min(30)
    .default(15 * 60),

  [EnvVariables.AUTH_REQUIRE_EMAIL_CONFIRMATION]: Joi.boolean().default(false),
})
