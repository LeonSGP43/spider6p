# Spider6P - 快速开始指南

## 前置要求

- Node.js 14+ 版本
- TikHub API 账户和 API Key
- 网络连接

---

## 安装步骤

### 1. 克隆或下载项目

```bash
# 如果使用 git
git clone <repository-url>
cd spider6p

# 或直接进入项目目录
cd spider6p
```

### 2. 安装依赖

```bash
npm install
```

这会安装以下依赖：
- `axios` - HTTP 请求库
- `dotenv` - 环境变量管理

---

## 配置步骤

### 1. 创建 .env 文件

在项目根目录创建 `.env` 文件（参考 `.env.example`）：

```bash
# 复制示例文件
cp .env.example .env
```

### 2. 配置 API Key

编辑 `.env` 文件，填入你的 TikHub API Key：

```env
TIKHUB_API_KEY=your_actual_api_key_here
```

> 获取 API Key：访问 [TikHub 官网](https://api.tikhub.io) 注册账户并获取

### 3. 修改爬取配置（可选）

编辑 `config.js` 文件调整爬取参数：

```javascript
export const config = {
  spider: {
    tags: ['music', 'dance'],      // 修改要爬取的标签
    limit: 20,                      // api返回不遵循这个设置，暂时忽略，
    concurrency: 6,                 // 并发数
    timeout: 30000,                 // 请求超时时间 (毫秒)
    requestDelay: 500               // 请求间隔 (毫秒)
  },
  platforms: {
    tiktok: { enabled: true },      // 启用/禁用各平台
    instagram: { enabled: true },
    twitter: { enabled: true },
    youtube: { enabled: true },
    linkedin: { enabled: true },
    reddit: { enabled: true }
  }
};
```

**常用配置调整**：

| 参数 | 说明 | 建议值 |
|------|------|--------|
| `tags` | 爬取的标签列表 | 根据需求修改 |
| `limit` | 每个标签的内容数量 | 10-50 |
| `requestDelay` | 请求间隔 | 500-1000ms |
| `timeout` | 请求超时 | 30000ms |

---

## 运行爬虫

### 方式一：运行完整爬虫

```bash
npm start
```

或

```bash
node index.js
```

**输出示例**：

```
============================================================
Spider6P - Multi-Platform Social Media Crawler
Tags: music, dance
Limit per tag: 20
============================================================

Enabled platforms: tiktok, instagram, twitter, youtube, linkedin, reddit

[TikTok] Searching: #music
[HTTP] GET /api/v1/tiktok/app/v3/fetch_video_search_result
[TikTok] Found 20 items for #music
[TikTok] Searching: #dance
[HTTP] GET /api/v1/tiktok/app/v3/fetch_video_search_result
[TikTok] Found 20 items for #dance

[Instagram] Searching: #music
[HTTP] GET /api/v1/instagram/v1/fetch_hashtag_posts
[Instagram] Found 20 items for #music
...

============================================================
CRAWL SUMMARY
============================================================
[✓] TIKTOK: #music: 20, #dance: 20
[✓] INSTAGRAM: #music: 20, #dance: 20
[✓] TWITTER: #music: 20, #dance: 20
[✓] YOUTUBE: #music: 20, #dance: 20
[✓] LINKEDIN: #music: 20, #dance: 20
[✓] REDDIT: #music: 20, #dance: 20

------------------------------------------------------------
API CALL STATISTICS
------------------------------------------------------------
📊 Total API Calls: 12
   ✓ Success: 12
   ✗ Failed: 0
------------------------------------------------------------

📁 Saved: output/crawl_2025-12-15T11-35-43.json
📁 Saved: output/tiktok_2025-12-15T11-35-43.json
📁 Saved: output/instagram_2025-12-15T11-35-43.json
...

✓ Crawl completed
```

### 方式二：运行测试

```bash
npm test
```

或

```bash
node test.js
```

---

## 输出文件

爬取完成后，结果保存在 `output/` 目录：

### 文件结构

```
output/
├── crawl_2025-12-15T11-35-43.json      # 完整汇总 (所有平台)
├── tiktok_2025-12-15T11-35-43.json     # TikTok 数据
├── instagram_2025-12-15T11-35-43.json  # Instagram 数据
├── twitter_2025-12-15T11-35-43.json    # Twitter 数据
├── youtube_2025-12-15T11-35-43.json    # YouTube 数据
├── linkedin_2025-12-15T11-35-43.json   # LinkedIn 数据
└── reddit_2025-12-15T11-35-43.json     # Reddit 数据
```

### 汇总文件格式

```json
{
  "timestamp": "2025-12-15T11:35:43.000Z",
  "tags": ["music", "dance"],
  "platforms": {
    "tiktok": {
      "platform": "tiktok",
      "success": true,
      "data": {
        "music": [
          {
            "platform": "tiktok",
            "id": "7123456789",
            "type": "video",
            "content": {
              "title": "Amazing music video",
              "url": "https://www.tiktok.com/@user/video/7123456789",
              "coverUrl": "https://...",
              "duration": 15
            },
            "author": {
              "id": "123456",
              "username": "creator",
              "nickname": "Creator Name",
              "avatar": "https://..."
            },
            "stats": {
              "likes": 50000,
              "comments": 1200,
              "shares": 800,
              "views": 500000,
              "saves": 3000
            },
            "createdAt": "2025-12-15T10:00:00.000Z"
          }
          // ... 更多内容
        ],
        "dance": [
          // ... dance 标签的内容
        ]
      },
      "errors": []
    },
    // ... 其他平台
  }
}
```

---

## API 调用成本估算

### 按标签数计算

**公式**: `API 调用次数 = 启用的平台数 × 标签数`

### 常见场景

| 场景 | 平台数 | 标签数 | API 调用次数 |
|------|--------|--------|------------|
| 默认配置 | 6 | 2 | 12 |
| 全平台 + 5 标签 | 6 | 5 | 30 |
| 3 个平台 + 2 标签 | 3 | 2 | 6 |
| 单平台测试 | 1 | 1 | 1 |

### 成本计算示例

假设 TikHub API 按次收费，每次 $0.01：

- 2 个标签 × 6 平台 = 12 次 × $0.01 = **$0.12**
- 5 个标签 × 6 平台 = 30 次 × $0.01 = **$0.30**

> 实际成本请根据 TikHub 的定价方案计算

---

## 常见问题

### Q1: 如何只爬取某些平台？

编辑 `config.js`，将不需要的平台设置为 `enabled: false`：

```javascript
platforms: {
  tiktok: { enabled: true },
  instagram: { enabled: true },
  twitter: { enabled: false },  // 禁用 Twitter
  youtube: { enabled: false },  // 禁用 YouTube
  linkedin: { enabled: true },
  reddit: { enabled: true }
}
```

### Q2: 如何修改爬取的标签？

编辑 `config.js` 的 `spider.tags` 数组：

```javascript
spider: {
  tags: ['python', 'javascript', 'nodejs'],  // 修改为你需要的标签
  limit: 20
}
```

### Q3: 爬取失败怎么办？

1. 检查 `.env` 文件中的 API Key 是否正确
2. 检查网络连接
3. 查看控制台错误信息
4. 确保 API Key 有足够的配额

### Q4: 如何加快爬取速度？

- 增加 `config.spider.concurrency` 值（默认 6）
- 减少 `config.spider.requestDelay` 值（默认 500ms）
- 禁用不需要的平台

**注意**: 过快的请求可能导致 API 限流或被封禁

### Q5: 输出文件在哪里？

所有输出文件保存在 `output/` 目录，按时间戳命名

---

## 项目结构

```
spider6p/
├── index.js                    # 主入口
├── config.js                   # 配置文件
├── package.json                # 项目依赖
├── .env                        # 环境变量 (需要创建)
├── .env.example                # 环境变量示例
├── .gitignore                  # Git 忽略文件
├── API_DOCUMENTATION.md        # API 详细文档
├── QUICKSTART.md               # 本文件
├── src/
│   ├── platforms/              # 各平台爬虫实现
│   │   ├── base.js             # 基类
│   │   ├── tiktok.js
│   │   ├── instagram.js
│   │   ├── twitter.js
│   │   ├── youtube.js
│   │   ├── linkedin.js
│   │   ├── reddit.js
│   │   └── index.js            # 导出所有爬虫
│   └── utils/
│       └── http.js             # HTTP 工具类
├── output/                     # 爬取结果输出目录
└── test.js                     # 测试文件
```

---

## 调试技巧

### 查看详细日志

所有 HTTP 请求都会打印到控制台：

```
[HTTP] GET /api/v1/tiktok/app/v3/fetch_video_search_result
[HTTP] GET /api/v1/instagram/v1/fetch_hashtag_posts
```

### 查看原始 API 响应

每条数据都包含 `rawData` 字段，保存了原始 API 响应，可用于调试

### 单平台测试

创建测试脚本测试单个平台：

```javascript
import { TikTokSpider } from './src/platforms/index.js';

const spider = new TikTokSpider();
const result = await spider.crawl(['music'], 5);
console.log(JSON.stringify(result, null, 2));
```

---

## 下一步

- 查看 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) 了解各平台 API 详情
- 根据需求修改 `config.js` 配置
- 运行爬虫并检查输出结果
- 集成到你的应用中

---

## 支持

- 查看 [TikHub 官方文档](https://api.tikhub.io)
- 检查项目 GitHub Issues
- 查看 `dev.md` 中的原始需求说明
