import { BasePlatformSpider } from './base.js';

export class InstagramSpider extends BasePlatformSpider {
  constructor() {
    super('Instagram');
  }

  // 使用 V1 API: fetch_hashtag_posts
  async searchByTag(tag, limit = 20) {
    const response = await this.http.get('/api/v1/instagram/v1/fetch_hashtag_posts', {
      params: { hashtag: tag, count: limit }
    });
    // code=200 或 code=0 都表示成功
    const code = response.data?.code;
    if (code !== 0 && code !== 200) throw new Error(response.data?.message || 'Instagram API error');
    
    const data = response.data?.data;
    // 实际返回结构: data.data.hashtag.edge_hashtag_to_media.edges
    if (data?.data?.hashtag?.edge_hashtag_to_media?.edges) {
      return data.data.hashtag.edge_hashtag_to_media.edges;
    }
    // 备用结构
    if (data?.hashtag?.edge_hashtag_to_media?.edges) {
      return data.hashtag.edge_hashtag_to_media.edges;
    }
    if (data?.edge_hashtag_to_media?.edges) {
      return data.edge_hashtag_to_media.edges;
    }
    if (Array.isArray(data)) return data;
    if (data?.items) return data.items;
    return [];
  }

  // 使用 V1 API: fetch_search 搜索用户/话题/地点
  async search(query, type = 'hashtag', limit = 20) {
    const response = await this.http.get('/api/v1/instagram/v1/fetch_search', {
      params: { query, search_type: type, count: limit }
    });
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'Instagram API error');
    return response.data?.data || [];
  }

  // 使用 V1 API: fetch_user_info_by_username
  async getUserByUsername(username) {
    const response = await this.http.get('/api/v1/instagram/v1/fetch_user_info_by_username', {
      params: { username }
    });
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'Instagram API error');
    return response.data?.data;
  }

  // 使用 V1 API: fetch_user_info_by_id
  async getUserById(userId) {
    const response = await this.http.get('/api/v1/instagram/v1/fetch_user_info_by_id', {
      params: { user_id: userId }
    });
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'Instagram API error');
    return response.data?.data;
  }

  // 使用 V1 API: fetch_user_posts
  async getUserPosts(userId, limit = 20, cursor = '') {
    const params = { user_id: userId, count: limit };
    if (cursor) params.cursor = cursor;
    
    const response = await this.http.get('/api/v1/instagram/v1/fetch_user_posts', { params });
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'Instagram API error');
    return {
      items: response.data?.data?.items || response.data?.data || [],
      cursor: response.data?.data?.next_cursor || response.data?.data?.end_cursor || null,
      hasMore: response.data?.data?.has_more ?? false
    };
  }

  // 使用 V1 API: fetch_user_reels
  async getUserReels(userId, limit = 20, cursor = '') {
    const params = { user_id: userId, count: limit };
    if (cursor) params.cursor = cursor;
    
    const response = await this.http.get('/api/v1/instagram/v1/fetch_user_reels', { params });
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'Instagram API error');
    return {
      items: response.data?.data?.items || response.data?.data || [],
      cursor: response.data?.data?.next_cursor || null,
      hasMore: response.data?.data?.has_more ?? false
    };
  }

  // 使用 V1 API: fetch_post_by_url
  async getPostByUrl(url) {
    const response = await this.http.get('/api/v1/instagram/v1/fetch_post_by_url', {
      params: { url }
    });
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'Instagram API error');
    return response.data?.data;
  }

  // 使用 V1 API: fetch_post_by_id
  async getPostById(mediaId) {
    const response = await this.http.get('/api/v1/instagram/v1/fetch_post_by_id', {
      params: { media_id: mediaId }
    });
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'Instagram API error');
    return response.data?.data;
  }

  // 使用 V1 API: fetch_post_comments_v2
  async getPostComments(mediaId, limit = 20, cursor = '') {
    const params = { media_id: mediaId, count: limit };
    if (cursor) params.cursor = cursor;
    
    const response = await this.http.get('/api/v1/instagram/v1/fetch_post_comments_v2', { params });
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'Instagram API error');
    return {
      items: response.data?.data?.comments || response.data?.data || [],
      cursor: response.data?.data?.next_cursor || null,
      hasMore: response.data?.data?.has_more ?? false
    };
  }

  // 使用 V1 API: fetch_comment_replies
  async getCommentReplies(mediaId, commentId, limit = 20, cursor = '') {
    const params = { media_id: mediaId, comment_id: commentId, count: limit };
    if (cursor) params.cursor = cursor;
    
    const response = await this.http.get('/api/v1/instagram/v1/fetch_comment_replies', { params });
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'Instagram API error');
    return {
      items: response.data?.data?.replies || response.data?.data || [],
      cursor: response.data?.data?.next_cursor || null,
      hasMore: response.data?.data?.has_more ?? false
    };
  }

  // 使用 V1 API: fetch_music_posts
  async getMusicPosts(musicId, limit = 20, cursor = '') {
    const params = { music_id: musicId, count: limit };
    if (cursor) params.cursor = cursor;
    
    const response = await this.http.get('/api/v1/instagram/v1/fetch_music_posts', { params });
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'Instagram API error');
    return {
      items: response.data?.data?.items || response.data?.data || [],
      cursor: response.data?.data?.next_cursor || null,
      hasMore: response.data?.data?.has_more ?? false
    };
  }

  // 使用 V1 API: fetch_location_info
  async getLocationInfo(locationId) {
    const response = await this.http.get('/api/v1/instagram/v1/fetch_location_info', {
      params: { location_id: locationId }
    });
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'Instagram API error');
    return response.data?.data;
  }

  // 使用 V1 API: fetch_location_posts
  async getLocationPosts(locationId, limit = 20, cursor = '') {
    const params = { location_id: locationId, count: limit };
    if (cursor) params.cursor = cursor;
    
    const response = await this.http.get('/api/v1/instagram/v1/fetch_location_posts', { params });
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'Instagram API error');
    return {
      items: response.data?.data?.items || response.data?.data || [],
      cursor: response.data?.data?.next_cursor || null,
      hasMore: response.data?.data?.has_more ?? false
    };
  }

  // 使用 V1 API: shortcode_to_media_id
  async shortcodeToMediaId(shortcode) {
    const response = await this.http.get('/api/v1/instagram/v1/shortcode_to_media_id', {
      params: { shortcode }
    });
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'Instagram API error');
    return response.data?.data?.media_id || response.data?.data;
  }

  // 使用 V1 API: media_id_to_shortcode
  async mediaIdToShortcode(mediaId) {
    const response = await this.http.get('/api/v1/instagram/v1/media_id_to_shortcode', {
      params: { media_id: mediaId }
    });
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'Instagram API error');
    return response.data?.data?.shortcode || response.data?.data;
  }

  // 使用 V1 API: fetch_related_profiles
  async getRelatedProfiles(userId) {
    const response = await this.http.get('/api/v1/instagram/v1/fetch_related_profiles', {
      params: { user_id: userId }
    });
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'Instagram API error');
    return response.data?.data || [];
  }

  // 使用 V1 API: fetch_user_tagged_posts
  async getUserTaggedPosts(userId, limit = 20, cursor = '') {
    const params = { user_id: userId, count: limit };
    if (cursor) params.cursor = cursor;
    
    const response = await this.http.get('/api/v1/instagram/v1/fetch_user_tagged_posts', { params });
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'Instagram API error');
    return {
      items: response.data?.data?.items || response.data?.data || [],
      cursor: response.data?.data?.next_cursor || null,
      hasMore: response.data?.data?.has_more ?? false
    };
  }

  // 使用 V1 API: fetch_explore_sections
  async getExploreSections() {
    const response = await this.http.get('/api/v1/instagram/v1/fetch_explore_sections');
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'Instagram API error');
    return response.data?.data || [];
  }

  // 使用 V1 API: fetch_section_posts
  async getSectionPosts(sectionId, limit = 20, cursor = '') {
    const params = { section_id: sectionId, count: limit };
    if (cursor) params.cursor = cursor;
    
    const response = await this.http.get('/api/v1/instagram/v1/fetch_section_posts', { params });
    if (response.data?.code !== 0) throw new Error(response.data?.message || 'Instagram API error');
    return {
      items: response.data?.data?.items || response.data?.data || [],
      cursor: response.data?.data?.next_cursor || null,
      hasMore: response.data?.data?.has_more ?? false
    };
  }

  normalizeContent(rawData) {
    const item = rawData.node || rawData;
    const owner = item.owner || item.user || {};
    
    // 判断内容类型
    let type = 'image';
    if (item.is_video || item.media_type === 2 || item.product_type === 'clips') {
      type = 'video';
    } else if (item.media_type === 8 || item.carousel_media) {
      type = 'carousel';
    }

    // 获取媒体URL
    let mediaUrl = item.display_url || item.thumbnail_src || item.image_versions2?.candidates?.[0]?.url || '';
    if (type === 'video') {
      mediaUrl = item.video_url || item.video_versions?.[0]?.url || mediaUrl;
    }

    return {
      platform: 'instagram',
      id: item.id || item.pk,
      shortcode: item.shortcode || item.code,
      type,
      content: {
        title: item.edge_media_to_caption?.edges?.[0]?.node?.text || item.caption?.text || '',
        url: `https://www.instagram.com/p/${item.shortcode || item.code}/`,
        mediaUrl,
        thumbnailUrl: item.thumbnail_src || item.display_url || item.image_versions2?.candidates?.[0]?.url || ''
      },
      author: {
        id: owner.id || owner.pk,
        username: owner.username || '',
        fullName: owner.full_name || '',
        avatar: owner.profile_pic_url || '',
        isVerified: owner.is_verified || false
      },
      stats: {
        likes: item.edge_liked_by?.count || item.like_count || 0,
        comments: item.edge_media_to_comment?.count || item.comment_count || 0,
        views: item.video_view_count || item.play_count || 0,
        shares: item.reshare_count || 0
      },
      location: item.location ? {
        id: item.location.pk || item.location.id,
        name: item.location.name,
        slug: item.location.slug
      } : null,
      music: item.music_metadata?.music_info ? {
        id: item.music_metadata.music_info.music_asset_info?.audio_cluster_id,
        title: item.music_metadata.music_info.music_asset_info?.title,
        artist: item.music_metadata.music_info.music_asset_info?.display_artist
      } : null,
      createdAt: item.taken_at_timestamp 
        ? new Date(item.taken_at_timestamp * 1000).toISOString() 
        : item.taken_at 
          ? new Date(item.taken_at * 1000).toISOString() 
          : null,
      rawData: item
    };
  }

  normalizeUser(userData) {
    const user = userData.user || userData;
    return {
      platform: 'instagram',
      id: user.pk || user.id,
      username: user.username,
      fullName: user.full_name || '',
      bio: user.biography || '',
      avatar: user.profile_pic_url || user.profile_pic_url_hd || '',
      isVerified: user.is_verified || false,
      isPrivate: user.is_private || false,
      stats: {
        followers: user.follower_count || user.edge_followed_by?.count || 0,
        following: user.following_count || user.edge_follow?.count || 0,
        posts: user.media_count || user.edge_owner_to_timeline_media?.count || 0
      },
      externalUrl: user.external_url || '',
      category: user.category || user.category_name || '',
      rawData: user
    };
  }
}
