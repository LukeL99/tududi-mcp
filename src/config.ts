import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  tududuApiUrl: string;
  tududuApiKey: string;
  logLevel: string;
}

export function getConfig(): Config {
  const tududuApiUrl = process.env.TUDUDI_API_URL;
  const tududuApiKey = process.env.TUDUDI_API_KEY;

  if (!tududuApiUrl) {
    throw new Error('TUDUDI_API_URL environment variable is required');
  }

  if (!tududuApiKey) {
    throw new Error('TUDUDI_API_KEY environment variable is required');
  }

  return {
    tududuApiUrl,
    tududuApiKey,
    logLevel: process.env.LOG_LEVEL || 'info',
  };
}
