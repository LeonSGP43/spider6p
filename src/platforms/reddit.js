import { BasePlatformSpider } from './base.js';

export class RedditSpider extends BasePlatformSpider {
  constructor() {
    super('Reddit');
  }

  async searchByTag(tag, limit = 20) {
    const response = await this.http.get('/api/v1/reddit/web/search_posts', {
      params: { keyword: tag, limit: limit, sort: 'relevance' }
    });
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'Reddit API error');
    return response.data?.data?.children || response.data?.data || [];
  }

  normalizeContent(rawData) {
    const item = rawData.data || rawData;
    return {
      platform: 'reddit',
      id: item.id || item.name,
      type: item.is_video ? 'video' : 'post',
      content: {
        title: item.title || '',
        text: item.selftext || '',
        url: `https://www.reddit.com${item.permalink}`,
        mediaUrl: item.url || item.thumbnail || '',
        subreddit: item.subreddit || ''
      },
      author: {
        id: item.author_fullname || '',
        username: item.author || '',
        nickname: item.author || ''
      },
      stats: {
        upvotes: item.ups || item.score || 0,
        downvotes: item.downs || 0,
        comments: item.num_comments || 0,
        awards: item.total_awards_received || 0,
        ratio: item.upvote_ratio || 0
      },
      createdAt: item.created_utc ? new Date(item.created_utc * 1000).toISOString() : null,
      rawData: item
    };
  }
}
