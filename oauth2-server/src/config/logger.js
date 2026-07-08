import pino from 'pino';
import { config } from './env.js';

const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.client_secret',
  'req.body.refresh_token',
  'req.body.code',
  'res.headers["set-cookie"]',
];

export const logger = pino({
  level: config.isProduction ? 'info' : 'debug',
  redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
  transport: config.isProduction
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } },
});
