import { BasePlatformSpider } from './base.js';

export class InstagramSpider extends BasePlatformSpider {
  constructor() {
    super('Instagram');
  }

  async searchByTag(tag, limit = 20) {
    const response = await this.http.get('/api/v1/instagram/web/search_posts_by_tag_name', {
      params: { tag_name: tag, count: limit }
    });
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'Instagram API error');
    return response.data?.data?.items || response.data?.data?.edge_hashtag_to_media?.edges || [];
  }

  normalizeContent(rawData) {
    const item = rawData.node || rawData;
    const owner = item.owner || {};
    return {
      platform: 'instagram',
      id: item.id || item.pk,
      type: item.is_video ? 'video' : 'image',
      content: {
        title: item.edge_media_to_caption?.edges?.[0]?.node?.text || item.caption?.text || '',
        url: `https://www.instagram.com/p/${item.shortcode}/`,
        mediaUrl: item.display_url || item.thumbnail_src || '',
        thumbnailUrl: item.thumbnail_src || item.display_url || ''
      },
      author: {
        id: owner.id || owner.pk,
        username: owner.username || '',
        avatar: owner.profile_pic_url || ''
      },
      stats: {
        likes: item.edge_liked_by?.count || item.like_count || 0,
        comments: item.edge_media_to_comment?.count || item.comment_count || 0,
        views: item.video_view_count || 0
      },
      createdAt: item.taken_at_timestamp ? new Date(item.taken_at_timestamp * 1000).toISOString() : null,
      rawData: item
    };
  }
}
