import { BasePlatformSpider } from './base.js';

export class TikTokSpider extends BasePlatformSpider {
  constructor() {
    super('TikTok');
  }

  async searchByTag(tag, limit = 20) {
    const response = await this.http.get('/api/v1/tiktok/app/v3/fetch_video_search_result', {
      params: { keyword: tag, count: limit, offset: 0, sort_type: 0, publish_time: 0 }
    });
    if (response.data?.code !== 200) throw new Error(response.data?.message || 'TikTok API error');
    // 数据在 search_item_list 中，每个 item 有 aweme_info 字段
    const items = response.data?.data?.search_item_list || [];
    return items.map(item => item.aweme_info).filter(Boolean);
  }

  normalizeContent(rawData) {
    const stats = rawData.statistics || {};
    const author = rawData.author || {};
    const video = rawData.video || {};
    return {
      platform: 'tiktok',
      id: rawData.aweme_id,
      type: 'video',
      content: {
        title: rawData.desc || '',
        url: rawData.share_url || `https://www.tiktok.com/@${author.unique_id}/video/${rawData.aweme_id}`,
        coverUrl: video.cover?.url_list?.[0] || video.origin_cover?.url_list?.[0] || '',
        duration: video.duration || 0
      },
      author: {
        id: author.uid,
        username: author.unique_id || '',
        nickname: author.nickname || '',
        avatar: author.avatar_thumb?.url_list?.[0] || ''
      },
      stats: {
        likes: stats.digg_count || 0,
        comments: stats.comment_count || 0,
        shares: stats.share_count || 0,
        views: stats.play_count || 0,
        saves: stats.collect_count || 0
      },
      createdAt: rawData.create_time ? new Date(rawData.create_time * 1000).toISOString() : null,
      rawData
    };
  }
}
