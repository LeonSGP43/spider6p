import dotenv from 'dotenv';
dotenv.config();

export const config = {
  tikhub: {
    baseUrl: 'https://api.tikhub.io',
    apiKey: process.env.TIKHUB_API_KEY || ''
  },
  spider: {
    tags: ['music', 'dance'],
    limit: 20,
    concurrency: 6,
    timeout: 30000,
    requestDelay: 500
  },
  platforms: {
    tiktok: { enabled: true, name: 'TikTok' },
    instagram: { enabled: true, name: 'Instagram' },
    twitter: { enabled: true, name: 'Twitter/X' },
    youtube: { enabled: true, name: 'YouTube' },
    linkedin: { enabled: true, name: 'LinkedIn' },
    reddit: { enabled: true, name: 'Reddit' }
  }
};
