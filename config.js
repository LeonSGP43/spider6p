import dotenv from 'dotenv';
dotenv.config();

// 后端配置 API 地址
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// 本地默认配置（后端不可用时使用）
const defaultConfig = {
  useMock: true,
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
    linkedin: { enabled: false, name: 'LinkedIn' },
    reddit: { enabled: true, name: 'Reddit' }
  }
};

// 当前配置（可动态更新）
export let config = { ...defaultConfig };

// 从后端拉取配置
export async function fetchConfigFromBackend() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/config/spider`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const result = await response.json();
    if (result.success && result.data) {
      // 合并配置，保留本地的 tikhub 凭证
      config = {
        ...result.data,
        tikhub: defaultConfig.tikhub,
        spider: {
          ...result.data.spider,
          concurrency: defaultConfig.spider.concurrency,
          timeout: defaultConfig.spider.timeout
        }
      };
      console.log('[Config] 从后端加载配置成功');
      console.log(`[Config] 标签: ${config.spider.tags.join(', ')}`);
      console.log(`[Config] Mock模式: ${config.useMock}`);
      return true;
    }
  } catch (error) {
    console.warn(`[Config] 无法从后端加载配置: ${error.message}，使用本地默认配置`);
  }
  return false;
}

// 启动时尝试加载远程配置
fetchConfigFromBackend();
