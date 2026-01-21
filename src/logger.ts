import pino from 'pino';

// Use pino-pretty only in development, plain JSON in production
const isDevelopment = process.env.NODE_ENV !== 'production';

// MCP uses stdout for protocol communication, so logger must use stderr
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
            destination: 2, // stderr
          },
        },
      }
    : {
        level: process.env.LOG_LEVEL || 'info',
      },
  pino.destination(2) // stderr for production mode
);
