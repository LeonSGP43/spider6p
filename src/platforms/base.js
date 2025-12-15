import { createHttpClient, delay, withRetry } from '../utils/http.js';
import { config } from '../../config.js';

export class BasePlatformSpider {
  constructor(platformName) {
    this.platformName = platformName;
    this.http = createHttpClient();
  }

  async searchByTag(tag, limit = 20) {
    throw new Error('searchByTag must be implemented');
  }

  normalizeContent(rawData) {
    throw new Error('normalizeContent must be implemented');
  }

  async crawl(tags, limit = 20) {
    const results = {
      platform: this.platformName,
      success: true,
      data: {},
      errors: []
    };

    for (const tag of tags) {
      try {
        console.log(`[${this.platformName}] Searching: #${tag}`);
        const contents = await withRetry(() => this.searchByTag(tag, limit), 3, config.spider.requestDelay);
        results.data[tag] = contents.map(item => this.normalizeContent(item));
        console.log(`[${this.platformName}] Found ${results.data[tag].length} items for #${tag}`);
        await delay(config.spider.requestDelay);
      } catch (error) {
        console.error(`[${this.platformName}] Error #${tag}:`, error.message);
        results.errors.push({ tag, error: error.message });
        results.success = false;
      }
    }
    return results;
  }
}
