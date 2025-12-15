import { BasePlatformSpider } from './base.js';

export class TwitterSpider extends BasePlatformSpider {
  constructor() {
    super('Twitter');
  }

  // 使用 Twitter Web API: fetch_search_timeline
  async searchByTag(tag, limit = 20) {
    const response = await this.http.get('/api/v1/twitter/web/fetch_search_timeline', {
      params: { keyword: `#${tag}`, search_type: 'Latest', count: limit }
    });
    const code = response.data?.code;
    if (code !== 0 && code !== 200) throw new Error(response.data?.message || 'Twitter API error');
    // 实际返回结构: data.timeline
    return response.data?.data?.timeline || [];
  }

  normalizeContent(rawData) {
    // API 直接返回扁平化的 tweet 数据
    const media = rawData.entities?.media?.[0];
    const userInfo = rawData.user_info || {};
    return {
      platform: 'twitter',
      id: rawData.tweet_id,
      type: media?.type === 'video' ? 'video' : (media ? 'image' : 'text'),
      content: {
        text: rawData.text || '',
        url: `https://x.com/${rawData.screen_name}/status/${rawData.tweet_id}`,
        mediaUrls: rawData.entities?.media?.map(m => m.media_url_https) || [],
        videoUrl: media?.video_info?.variants?.find(v => v.content_type === 'video/mp4')?.url || null
      },
      author: {
        id: userInfo.rest_id || rawData.user_id,
        username: rawData.screen_name || '',
        nickname: userInfo.name || '',
        avatar: userInfo.avatar || '',
        followers: userInfo.followers_count || 0,
        isVerified: userInfo.verified || false
      },
      stats: {
        likes: rawData.favorites || 0,
        comments: rawData.replies || 0,
        retweets: rawData.retweets || 0,
        quotes: rawData.quotes || 0,
        views: parseInt(rawData.views) || 0,
        bookmarks: rawData.bookmarks || 0
      },
      language: rawData.lang,
      createdAt: rawData.created_at ? new Date(rawData.created_at).toISOString() : null,
      rawData
    };
  }
}
