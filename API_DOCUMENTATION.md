# Spider6P - 多平台社交媒体爬虫 API 文档

## 项目概述

Spider6P 是一个多平台社交媒体内容爬虫，支持 6 个主流社交平台的内容抓取。项目基于 TikHub API 服务，通过统一的接口调用各平台数据。

### 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        index.js                              │
│                    (主入口 & 调度器)                          │
├─────────────────────────────────────────────────────────────┤
│                      config.js                               │
│              (配置管理: API密钥、标签、限制)                   │
├─────────────────────────────────────────────────────────────┤
│                  BasePlatformSpider                          │
│              (基类: 通用爬取逻辑、重试机制)                    │
├──────────┬──────────┬──────────┬──────────┬────────┬────────┤
│  TikTok  │Instagram │ Twitter  │ YouTube  │LinkedIn│ Reddit │
│  Spider  │  Spider  │  Spider  │  Spider  │ Spider │ Spider │
└──────────┴──────────┴──────────┴──────────┴────────┴────────┘
                              │
                    ┌─────────┴─────────┐
                    │   HTTP Client     │
                    │  (axios + 拦截器)  │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │   TikHub API      │
                    │ api.tikhub.io     │
                    └───────────────────┘
```

### 运行流程

1. **初始化**: 加载配置，创建各平台 Spider 实例
2. **筛选平台**: 根据 `config.platforms` 筛选启用的平台
3. **并发爬取**: 使用 `Promise.allSettled` 并发执行所有平台的爬取任务
4. **标签遍历**: 每个平台依次爬取配置的所有标签 (tags)
5. **数据标准化**: 将各平台原始数据转换为统一格式
6. **结果保存**: 输出到 `output/` 目录的 JSON 文件

---

## 各平台 API 详解

### 1. TikTok

**基础 URL**: `https://api.tikhub.io`

#### 核心搜索 API

| 方法 | API 端点 | 用途 |
|------|----------|------|
| `searchByTag()` | `/api/v1/tiktok/app/v3/fetch_video_search_result` | 按关键词搜索视频 |

**请求参数**:
```javascript
{
  keyword: string,    // 搜索关键词
  count: number,      // 返回数量 (默认 20)
  offset: number,     // 分页偏移 (默认 0)
  sort_type: number,  // 排序类型 (0: 综合)
  publish_time: number // 发布时间筛选 (0: 不限)
}
```

**响应数据结构**:
```javascript
{
  code: 200,
  data: {
    search_item_list: [
      {
        aweme_info: {
          aweme_id: string,
          desc: string,           // 视频描述
          share_url: string,      // 分享链接
          create_time: number,    // 创建时间戳
          video: {
            cover: { url_list: [] },
            duration: number
          },
          author: {
            uid: string,
            unique_id: string,    // 用户名
            nickname: string,
            avatar_thumb: { url_list: [] }
          },
          statistics: {
            digg_count: number,   // 点赞数
            comment_count: number,
            share_count: number,
            play_count: number,   // 播放量
            collect_count: number // 收藏数
          }
        }
      }
    ]
  }
}
```

---

### 2. Instagram

**基础 URL**: `https://api.tikhub.io`

#### API 端点列表

| 方法 | API 端点 | 用途 |
|------|----------|------|
| `searchByTag()` | `/api/v1/instagram/v1/fetch_hashtag_posts` | 获取话题标签下的帖子 |
| `search()` | `/api/v1/instagram/v1/fetch_search` | 搜索用户/话题/地点 |
| `getUserByUsername()` | `/api/v1/instagram/v1/fetch_user_info_by_username` | 通过用户名获取用户信息 |
| `getUserById()` | `/api/v1/instagram/v1/fetch_user_info_by_id` | 通过ID获取用户信息 |
| `getUserPosts()` | `/api/v1/instagram/v1/fetch_user_posts` | 获取用户帖子列表 |
| `getUserReels()` | `/api/v1/instagram/v1/fetch_user_reels` | 获取用户 Reels |
| `getPostByUrl()` | `/api/v1/instagram/v1/fetch_post_by_url` | 通过URL获取帖子详情 |
| `getPostById()` | `/api/v1/instagram/v1/fetch_post_by_id` | 通过ID获取帖子详情 |
| `getPostComments()` | `/api/v1/instagram/v1/fetch_post_comments_v2` | 获取帖子评论 |
| `getCommentReplies()` | `/api/v1/instagram/v1/fetch_comment_replies` | 获取评论回复 |
| `getMusicPosts()` | `/api/v1/instagram/v1/fetch_music_posts` | 获取使用特定音乐的帖子 |
| `getLocationInfo()` | `/api/v1/instagram/v1/fetch_location_info` | 获取地点信息 |
| `getLocationPosts()` | `/api/v1/instagram/v1/fetch_location_posts` | 获取地点相关帖子 |
| `shortcodeToMediaId()` | `/api/v1/instagram/v1/shortcode_to_media_id` | Shortcode 转 Media ID |
| `mediaIdToShortcode()` | `/api/v1/instagram/v1/media_id_to_shortcode` | Media ID 转 Shortcode |
| `getRelatedProfiles()` | `/api/v1/instagram/v1/fetch_related_profiles` | 获取相关用户推荐 |
| `getUserTaggedPosts()` | `/api/v1/instagram/v1/fetch_user_tagged_posts` | 获取用户被标记的帖子 |
| `getExploreSections()` | `/api/v1/instagram/v1/fetch_explore_sections` | 获取探索页分区 |
| `getSectionPosts()` | `/api/v1/instagram/v1/fetch_section_posts` | 获取分区帖子 |

#### 核心搜索 API 详解

**`fetch_hashtag_posts` 请求参数**:
```javascript
{
  hashtag: string,  // 话题标签 (不含#)
  count: number     // 返回数量
}
```

**响应数据结构**:
```javascript
{
  code: 0,  // 或 200
  data: {
    data: {
      hashtag: {
        edge_hashtag_to_media: {
          edges: [
            {
              node: {
                id: string,
                shortcode: string,
                display_url: string,
                is_video: boolean,
                edge_media_to_caption: { edges: [{ node: { text: string } }] },
                edge_liked_by: { count: number },
                edge_media_to_comment: { count: number },
                owner: {
                  id: string,
                  username: string,
                  profile_pic_url: string
                },
                taken_at_timestamp: number
              }
            }
          ]
        }
      }
    }
  }
}
```

---

### 3. Twitter (X)

**基础 URL**: `https://api.tikhub.io`

#### API 端点列表

| 方法 | API 端点 | 用途 |
|------|----------|------|
| `searchByTag()` | `/api/v1/twitter/web/fetch_search_timeline` | 搜索推文时间线 |

**请求参数**:
```javascript
{
  keyword: string,      // 搜索关键词 (含#)
  search_type: string,  // 搜索类型: 'Latest', 'Top', 'People', 'Photos', 'Videos'
  count: number         // 返回数量
}
```

**响应数据结构**:
```javascript
{
  code: 0,  // 或 200
  data: {
    timeline: [
      {
        tweet_id: string,
        text: string,
        screen_name: string,
        created_at: string,
        favorites: number,      // 点赞数
        replies: number,        // 回复数
        retweets: number,       // 转发数
        quotes: number,         // 引用数
        views: string,          // 浏览量
        bookmarks: number,      // 书签数
        lang: string,
        entities: {
          media: [{
            media_url_https: string,
            type: string,       // 'photo', 'video'
            video_info: {
              variants: [{ url: string, content_type: string }]
            }
          }]
        },
        user_info: {
          rest_id: string,
          name: string,
          avatar: string,
          followers_count: number,
          verified: boolean
        }
      }
    ]
  }
}
```

---

### 4. YouTube

**基础 URL**: `https://api.tikhub.io`

#### API 端点列表

| 方法 | API 端点 | 用途 |
|------|----------|------|
| `searchByTag()` | `/api/v1/youtube/web/search_video` | 搜索视频 |

**请求参数**:
```javascript
{
  search_query: string  // 搜索关键词
}
```

**响应数据结构**:
```javascript
{
  code: 0,  // 或 200
  data: {
    videos: [
      {
        video_id: string,
        title: string,
        description: string,
        channel_id: string,
        author: string,           // 频道名称
        thumbnails: [
          { url: string, width: number, height: number }
        ],
        video_length: string,     // 时长 (如 "10:30")
        number_of_views: number,
        published_time: string,   // 相对时间 (如 "2 days ago")
        is_live_content: boolean,
        category: string,
        keywords: string[]
      }
    ]
  }
}
```

---

### 5. LinkedIn

**基础 URL**: `https://api.tikhub.io`

#### API 端点列表

| 方法 | API 端点 | 用途 |
|------|----------|------|
| `searchByTag()` | `/api/v1/linkedin/web/search_people` | 搜索用户 |
| `getUserPosts()` | `/api/v1/linkedin/web/get_user_posts` | 获取用户帖子 |
| `getUserProfile()` | `/api/v1/linkedin/web/get_user_profile` | 获取用户资料 |
| `searchJobs()` | `/api/v1/linkedin/web/search_jobs` | 搜索职位 |

> **注意**: LinkedIn API 不支持直接搜索帖子，`searchByTag()` 实际搜索的是相关用户。

**`search_people` 请求参数**:
```javascript
{
  keyword: string  // 搜索关键词
}
```

**响应数据结构**:
```javascript
{
  code: 0,  // 或 200
  data: {
    data: [
      {
        urn: string,           // LinkedIn URN
        full_name: string,
        title: string,         // 职位头衔
        location: string,
        url: string,           // 个人主页链接
        avatar: [{ url: string }],
        is_premium: boolean,
        services: []
      }
    ]
  }
}
```

---

### 6. Reddit

**基础 URL**: `https://api.tikhub.io`

#### API 端点列表

| 方法 | API 端点 | 用途 |
|------|----------|------|
| `searchByTag()` | `/api/v1/reddit/app/fetch_dynamic_search` | 动态搜索帖子 |
| `getPostDetails()` | `/api/v1/reddit/app/fetch_post_details` | 获取帖子详情 |
| `getPostComments()` | `/api/v1/reddit/app/fetch_post_comments` | 获取帖子评论 |
| `getSubredditFeed()` | `/api/v1/reddit/app/fetch_subreddit_feed` | 获取版块内容 |

**`fetch_dynamic_search` 请求参数**:
```javascript
{
  query: string  // 搜索关键词
}
```

**响应数据结构**:
```javascript
{
  code: 0,  // 或 200
  data: {
    search: {
      dynamic: {
        components: {
          main: {
            edges: [
              {
                node: {
                  children: [
                    {
                      __typename: 'SearchPost',
                      post: {
                        id: string,
                        postTitle: string,
                        url: string,
                        createdAt: string,
                        commentCount: number,
                        content: {
                          markdown: string,
                          html: string
                        },
                        subreddit: {
                          id: string,
                          name: string
                        },
                        authorInfo: {
                          id: string,
                          name: string,
                          snoovatarIcon: { url: string }
                        },
                        score: {
                          upvotes: number,
                          downvotes: number,
                          score: number
                        },
                        media: {
                          isGif: boolean,
                          videoInfo: object
                        }
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      }
    }
  }
}
```

---

## 统一数据格式

所有平台的数据经过 `normalizeContent()` 方法标准化后，输出统一格式：

```javascript
{
  platform: string,      // 平台标识
  id: string,            // 内容ID
  type: string,          // 内容类型: 'video', 'image', 'text', 'post', 'profile'
  content: {
    title: string,       // 标题/描述
    url: string,         // 原始链接
    // ... 平台特定字段
  },
  author: {
    id: string,
    username: string,
    nickname: string,
    avatar: string
  },
  stats: {
    likes: number,
    comments: number,
    shares: number,
    views: number
  },
  createdAt: string,     // ISO 8601 时间格式
  rawData: object        // 原始数据 (用于调试)
}
```

---

## 配置说明

### 环境变量 (.env)

```bash
TIKHUB_API_KEY=your_api_key_here
```

### 配置文件 (config.js)

```javascript
{
  tikhub: {
    baseUrl: 'https://api.tikhub.io',
    apiKey: process.env.TIKHUB_API_KEY
  },
  spider: {
    tags: ['music', 'dance'],  // 要爬取的标签
    limit: 20,                  // 每个标签的数量限制
    concurrency: 6,             // 并发数
    timeout: 30000,             // 请求超时 (ms)
    requestDelay: 500           // 请求间隔 (ms)
  },
  platforms: {
    tiktok: { enabled: true },
    instagram: { enabled: true },
    twitter: { enabled: true },
    youtube: { enabled: true },
    linkedin: { enabled: true },
    reddit: { enabled: true }
  }
}
```

---

## HTTP 工具类

### 功能特性

- **自动认证**: 请求头自动携带 Bearer Token
- **请求日志**: 拦截器记录所有请求
- **错误处理**: 统一的错误响应处理
- **重试机制**: `withRetry()` 支持失败自动重试
- **请求延迟**: `delay()` 控制请求频率

### 使用示例

```javascript
import { createHttpClient, delay, withRetry } from './src/utils/http.js';

const http = createHttpClient();

// 带重试的请求
const data = await withRetry(
  () => http.get('/api/v1/tiktok/...'),
  3,    // 最大重试次数
  1000  // 重试间隔 (ms)
);

// 请求延迟
await delay(500);
```

---

## 输出文件

爬取结果保存在 `output/` 目录：

- `crawl_YYYY-MM-DDTHH-MM-SS.json` - 完整汇总
- `{platform}_YYYY-MM-DDTHH-MM-SS.json` - 各平台单独文件

---

## API 响应码说明

| 响应码 | 含义 |
|--------|------|
| 0 | 成功 (部分API) |
| 200 | 成功 |
| 其他 | 错误，查看 message 字段 |
