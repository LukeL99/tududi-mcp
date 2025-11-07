import pino from 'pino';

// Use pino-pretty only in development, plain JSON in production
const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = pino(
  isDevelopment
    ? {
        level: process.env.LOG_LEVEL || 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }
    : {
        level: process.env.LOG_LEVEL || 'info',
      },
);
