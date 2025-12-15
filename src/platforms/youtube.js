import { BasePlatformSpider } from './base.js';

export class YouTubeSpider extends BasePlatformSpider {
  constructor() {
    super('YouTube');
  }

  async searchByTag(tag, limit = 20) {
    const response = await this.http.get('/api/v1/youtube/web/search_videos', {
      params: { keyword: tag, limit: limit }
    });
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'YouTube API error');
    return response.data?.data?.items || response.data?.data || [];
  }

  normalizeContent(rawData) {
    const item = rawData.video || rawData;
    const channel = item.channel || item.owner || {};
    return {
      platform: 'youtube',
      id: item.videoId || item.id,
      type: 'video',
      content: {
        title: item.title || '',
        description: item.description || item.descriptionSnippet || '',
        url: `https://www.youtube.com/watch?v=${item.videoId || item.id}`,
        thumbnailUrl: item.thumbnail?.url || item.thumbnails?.[0]?.url || '',
        duration: item.duration || item.lengthText || ''
      },
      author: {
        id: channel.channelId || channel.id,
        username: channel.channelId || '',
        nickname: channel.name || channel.title || '',
        avatar: channel.avatar?.url || channel.thumbnails?.[0]?.url || ''
      },
      stats: {
        views: parseInt(item.viewCount || item.views || 0),
        likes: parseInt(item.likeCount || 0),
        comments: parseInt(item.commentCount || 0)
      },
      createdAt: item.publishedTime || item.publishDate || null,
      rawData: item
    };
  }
}
