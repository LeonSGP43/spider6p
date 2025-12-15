import axios from 'axios';
import { config } from '../../config.js';

// 全局请求计数器
export const requestCounter = {
  total: 0,
  success: 0,
  failed: 0,
  reset() {
    this.total = 0;
    this.success = 0;
    this.failed = 0;
  },
  getSummary() {
    return {
      total: this.total,
      success: this.success,
      failed: this.failed
    };
  }
};

export const createHttpClient = () => {
  const client = axios.create({
    baseURL: config.tikhub.baseUrl,
    timeout: config.spider.timeout,
    headers: {
      'Authorization': `Bearer ${config.tikhub.apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  client.interceptors.request.use(
    (cfg) => {
      requestCounter.total++;
      console.log(`[HTTP] ${cfg.method?.toUpperCase()} ${cfg.url}`);
      return cfg;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => {
      requestCounter.success++;
      return response;
    },
    (error) => {
      requestCounter.failed++;
      console.error(`[HTTP] Error: ${error.response?.status || error.message}`);
      return Promise.reject(error);
    }
  );

  return client;
};

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const withRetry = async (fn, retries = 3, delayMs = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`[Retry] Attempt ${i + 1} failed, retrying...`);
      await delay(delayMs);
    }
  }
};
