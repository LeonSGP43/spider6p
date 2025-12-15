import { BasePlatformSpider } from './base.js';

export class TwitterSpider extends BasePlatformSpider {
  constructor() {
    super('Twitter');
  }

  async searchByTag(tag, limit = 20) {
    const response = await this.http.get('/api/v1/twitter/web/fetch_search_timeline', {
      params: { keyword: `#${tag}`, search_type: 'Latest', count: limit }
    });
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'Twitter API error');
    return response.data?.data?.data || [];
  }

  normalizeContent(rawData) {
    const tweet = rawData.tweet || rawData;
    const user = tweet.core?.user_results?.result?.legacy || tweet.user || {};
    const legacy = tweet.legacy || tweet;
    return {
      platform: 'twitter',
      id: tweet.rest_id || tweet.id_str || tweet.id,
      type: legacy.extended_entities?.media?.[0]?.type === 'video' ? 'video' : 'tweet',
      content: {
        text: legacy.full_text || legacy.text || '',
        url: `https://twitter.com/${user.screen_name}/status/${tweet.rest_id || tweet.id_str}`,
        mediaUrls: legacy.extended_entities?.media?.map(m => m.media_url_https) || []
      },
      author: {
        id: user.id_str || user.id,
        username: user.screen_name || '',
        nickname: user.name || '',
        avatar: user.profile_image_url_https || ''
      },
      stats: {
        likes: legacy.favorite_count || 0,
        comments: legacy.reply_count || 0,
        retweets: legacy.retweet_count || 0,
        quotes: legacy.quote_count || 0,
        views: tweet.views?.count || 0
      },
      createdAt: legacy.created_at ? new Date(legacy.created_at).toISOString() : null,
      rawData: tweet
    };
  }
}
