import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from './logger.js';

mongoose.set('strictQuery', true);

export async function connectDB() {
  mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  await mongoose.connect(config.mongoUri);
  logger.info(
    { host: mongoose.connection.host, db: mongoose.connection.name },
    'MongoDB connected',
  );
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
