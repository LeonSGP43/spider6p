import { BasePlatformSpider } from './base.js';

export class YouTubeSpider extends BasePlatformSpider {
  constructor() {
    super('YouTube');
  }

  // 使用 YouTube Web API: search_video
  async searchByTag(tag, limit = 20) {
    const response = await this.http.get('/api/v1/youtube/web/search_video', {
      params: { search_query: tag, order_by: 'today' }
    });
    const code = response.data?.code;
    if (code !== 0 && code !== 200) throw new Error(response.data?.message || 'YouTube API error');
    // 实际返回结构: data.videos
    const videos = response.data?.data?.videos || [];
    return videos.slice(0, limit);
  }

  normalizeContent(rawData) {
    return {
      platform: 'youtube',
      id: rawData.video_id,
      type: rawData.is_live_content ? 'live' : 'video',
      content: {
        title: rawData.title || '',
        description: rawData.description || '',
        url: `https://www.youtube.com/watch?v=${rawData.video_id}`,
        thumbnailUrl: rawData.thumbnails?.[1]?.url || rawData.thumbnails?.[0]?.url || '',
        duration: rawData.video_length || ''
      },
      author: {
        id: rawData.channel_id,
        username: rawData.channel_id || '',
        nickname: rawData.author || '',
        avatar: ''
      },
      stats: {
        views: rawData.number_of_views || 0,
        likes: 0,
        comments: 0
      },
      publishedTime: rawData.published_time || null,
      category: rawData.category,
      keywords: rawData.keywords || [],
      rawData
    };
  }
}
