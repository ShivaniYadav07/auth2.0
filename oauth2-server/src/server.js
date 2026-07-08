import { app } from './app.js';
import { config } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { logger } from './config/logger.js';

async function start() {
  await connectDB();

  const server = app.listen(config.port, () => {
    logger.info(`OAuth2 authorization server listening on ${config.appUrl} (${config.env})`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
