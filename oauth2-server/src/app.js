import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { corsOptions } from './config/cors.js';
import { generalLimiter } from './middleware/rateLimiters.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './config/logger.js';
import { sendSuccess } from './utils/ApiResponse.js';
import routes from './routes/index.js';

export const app = express();

// Required when running behind a reverse proxy/load balancer (Heroku, Nginx, etc.) so that
// `secure` cookies and rate-limiting by IP see the real client, not the proxy.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(pinoHttp({ logger }));
app.use(generalLimiter);

app.get('/health', (_req, res) => sendSuccess(res, { message: 'Service is healthy' }));

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);
