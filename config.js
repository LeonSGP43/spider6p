import dotenv from 'dotenv';
dotenv.config();

export const config = {
  tikhub: {
    baseUrl: 'https://api.tikhub.io',
    apiKey: process.env.TIKHUB_API_KEY || ''
  },
  spider: {
    tags: ['music', 'dance'],//主要调整这里
    limit: 20,//修改无效，api不支持，设置了也会直接返回默认数量的列表
    concurrency: 6,//忽略
    timeout: 30000,
    requestDelay: 500
  },
  // 平台开关，true开启，false关闭
  platforms: {
    tiktok: { enabled: true, name: 'TikTok' },
    instagram: { enabled: true, name: 'Instagram' },
    twitter: { enabled: true, name: 'Twitter/X' },
    youtube: { enabled: true, name: 'YouTube' },
    linkedin: { enabled: true, name: 'LinkedIn' },
    reddit: { enabled: true, name: 'Reddit' }
  }
};
