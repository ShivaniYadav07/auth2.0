import 'dotenv/config';
import { z } from 'zod';

/**
 * All configuration enters the app through this file. Nothing else in the codebase
 * should read `process.env` directly - that keeps validation and defaults in one place
 * and makes it obvious what the app depends on to boot.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_URL: z.string().url().default('http://localhost:4000'),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_TOKEN_TTL: z.string().default('15m'),

  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  AUTH_CODE_TTL_SECONDS: z.coerce.number().int().positive().default(60),

  REFRESH_TOKEN_COOKIE_NAME: z.string().default('refresh_token'),
  COOKIE_DOMAIN: z.string().optional(),
  // 'none' is required when the frontend and backend are on different sites (e.g. a
  // Vercel frontend calling an onrender.com backend), otherwise the browser won't send
  // the refresh cookie cross-site. 'none' only works alongside secure:true (HTTPS).
  COOKIE_SAMESITE: z.enum(['strict', 'lax', 'none']).default('strict'),

  CORS_ALLOWED_ORIGINS: z.string().default(''),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues.map(
      (issue) => `  - ${issue.path.join('.')}: ${issue.message}`,
    );
    // Fail fast: an invalid/missing env var should never surface as a runtime bug later.
    // eslint-disable-next-line no-console
    console.error('Invalid environment configuration:\n' + issues.join('\n'));
    process.exit(1);
  }

  return parsed.data;
}

const env = loadEnv();

export const config = {
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  port: env.PORT,
  appUrl: env.APP_URL,

  mongoUri: env.MONGO_URI,

  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    accessTokenTtl: env.JWT_ACCESS_TOKEN_TTL,
  },

  refreshToken: {
    ttlDays: env.REFRESH_TOKEN_TTL_DAYS,
    cookieName: env.REFRESH_TOKEN_COOKIE_NAME,
    cookieDomain: env.COOKIE_DOMAIN,
    cookieSameSite: env.COOKIE_SAMESITE,
  },

  authCode: {
    ttlSeconds: env.AUTH_CODE_TTL_SECONDS,
  },

  cors: {
    allowedOrigins: env.CORS_ALLOWED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
  },
};
