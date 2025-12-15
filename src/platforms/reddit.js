import { BasePlatformSpider } from './base.js';

export class RedditSpider extends BasePlatformSpider {
  constructor() {
    super('Reddit');
  }

  // 使用 Reddit APP API: fetch_dynamic_search
  async searchByTag(tag, limit = 20) {
    const response = await this.http.get('/api/v1/reddit/app/fetch_dynamic_search', {
      params: { query: tag }
    });
    const code = response.data?.code;
    if (code !== 0 && code !== 200) throw new Error(response.data?.message || 'Reddit API error');
    
    // 实际返回结构: data.search.dynamic.components.main.edges[].node.children[]
    const edges = response.data?.data?.search?.dynamic?.components?.main?.edges || [];
    const posts = [];
    for (const edge of edges) {
      const children = edge.node?.children || [];
      for (const child of children) {
        if (child.__typename === 'SearchPost' && child.post) {
          posts.push(child.post);
        }
      }
    }
    return posts.slice(0, limit);
  }

  normalizeContent(rawData) {
    const post = rawData;
    const author = post.authorInfo || {};
    const stats = post.score || {};
    const subreddit = post.subreddit || {};
    
    return {
      platform: 'reddit',
      id: post.id,
      type: post.media?.isGif ? 'gif' : (post.media?.videoInfo ? 'video' : 'post'),
      content: {
        title: post.postTitle || '',
        text: post.content?.markdown || post.content?.html || '',
        url: post.url || '',
        subreddit: subreddit.name || '',
        subredditId: subreddit.id || ''
      },
      author: {
        id: author.id,
        username: author.name || '',
        avatar: author.snoovatarIcon?.url || ''
      },
      stats: {
        upvotes: stats.upvotes || 0,
        downvotes: stats.downvotes || 0,
        score: stats.score || 0,
        comments: post.commentCount || 0
      },
      createdAt: post.createdAt || null,
      rawData
    };
  }

  // 获取帖子详情
  async getPostDetails(postId) {
    const response = await this.http.get('/api/v1/reddit/app/fetch_post_details', {
      params: { post_id: postId }
    });
    const code = response.data?.code;
    if (code !== 0 && code !== 200) throw new Error(response.data?.message || 'Reddit API error');
    return response.data?.data;
  }

  // 获取帖子评论
  async getPostComments(postId) {
    const response = await this.http.get('/api/v1/reddit/app/fetch_post_comments', {
      params: { post_id: postId }
    });
    const code = response.data?.code;
    if (code !== 0 && code !== 200) throw new Error(response.data?.message || 'Reddit API error');
    return response.data?.data;
  }

  // 获取版块内容
  async getSubredditFeed(subreddit, sort = 'hot') {
    const response = await this.http.get('/api/v1/reddit/app/fetch_subreddit_feed', {
      params: { subreddit, sort }
    });
    const code = response.data?.code;
    if (code !== 0 && code !== 200) throw new Error(response.data?.message || 'Reddit API error');
    return response.data?.data;
  }
}
