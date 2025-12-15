import { BasePlatformSpider } from './base.js';

export class LinkedInSpider extends BasePlatformSpider {
  constructor() {
    super('LinkedIn');
  }

  // LinkedIn API 没有直接的帖子搜索，使用 search_people 搜索相关用户
  async searchByTag(tag, limit = 20) {
    const response = await this.http.get('/api/v1/linkedin/web/search_people', {
      params: { keyword: tag }
    });
    const code = response.data?.code;
    if (code !== 0 && code !== 200) throw new Error(response.data?.message || 'LinkedIn API error');
    // 实际返回结构: data.data
    const people = response.data?.data?.data || [];
    return people.slice(0, limit);
  }

  normalizeContent(rawData) {
    return {
      platform: 'linkedin',
      id: rawData.urn || rawData.id || `linkedin_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: 'profile',
      content: {
        title: rawData.title || '',
        url: rawData.url || '',
        location: rawData.location || ''
      },
      author: {
        id: rawData.urn || rawData.id,
        username: rawData.url?.split('/in/')?.[1]?.replace('/', '') || '',
        nickname: rawData.full_name || '',
        avatar: rawData.avatar?.[0]?.url || '',
        isPremium: rawData.is_premium || false
      },
      stats: {
        services: rawData.services?.length || 0
      },
      rawData
    };
  }

  // 获取用户帖子
  async getUserPosts(username) {
    const response = await this.http.get('/api/v1/linkedin/web/get_user_posts', {
      params: { username }
    });
    const code = response.data?.code;
    if (code !== 0 && code !== 200) throw new Error(response.data?.message || 'LinkedIn API error');
    return response.data?.data || [];
  }

  // 获取用户资料
  async getUserProfile(username) {
    const response = await this.http.get('/api/v1/linkedin/web/get_user_profile', {
      params: { username }
    });
    const code = response.data?.code;
    if (code !== 0 && code !== 200) throw new Error(response.data?.message || 'LinkedIn API error');
    return response.data?.data;
  }

  // 搜索职位
  async searchJobs(keyword, limit = 20) {
    const response = await this.http.get('/api/v1/linkedin/web/search_jobs', {
      params: { keyword }
    });
    const code = response.data?.code;
    if (code !== 0 && code !== 200) throw new Error(response.data?.message || 'LinkedIn API error');
    const jobs = response.data?.data?.data || [];
    return jobs.slice(0, limit);
  }
}
