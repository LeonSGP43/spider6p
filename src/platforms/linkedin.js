import { BasePlatformSpider } from './base.js';

export class LinkedInSpider extends BasePlatformSpider {
  constructor() {
    super('LinkedIn');
  }

  async searchByTag(tag, limit = 20) {
    const response = await this.http.get('/api/v1/linkedin/web/search_posts', {
      params: { keyword: tag, count: limit }
    });
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'LinkedIn API error');
    return response.data?.data?.items || response.data?.data || [];
  }

  normalizeContent(rawData) {
    const item = rawData.post || rawData;
    const author = item.author || item.actor || {};
    return {
      platform: 'linkedin',
      id: item.urn || item.id,
      type: item.video ? 'video' : 'post',
      content: {
        text: item.commentary || item.text || '',
        url: item.url || item.navigationUrl || '',
        mediaUrls: item.images?.map(img => img.url) || []
      },
      author: {
        id: author.urn || author.id,
        username: author.vanityName || '',
        nickname: author.name || author.title || '',
        avatar: author.image?.url || author.profilePicture || ''
      },
      stats: {
        likes: item.socialDetail?.totalSocialActivityCounts?.numLikes || item.likeCount || 0,
        comments: item.socialDetail?.totalSocialActivityCounts?.numComments || item.commentCount || 0,
        shares: item.socialDetail?.totalSocialActivityCounts?.numShares || item.shareCount || 0
      },
      createdAt: item.postedAt || item.createdAt || null,
      rawData: item
    };
  }
}
