# 🕷️ Spider6P 爬虫服务器文档

## 概述

Spider6P 爬虫服务器是一个 HTTP API 服务，用于触发社交媒体数据爬取任务。爬虫会从多个平台（TikTok、Instagram、Twitter、YouTube、LinkedIn、Reddit）爬取指定标签的数据，并自动发送到 Kafka。

## 快速开始

### 启动服务器

```bash
cd spider6p
npm run server
```

服务器将在 `http://localhost:8001` 启动。

### 或者一键启动所有服务

```bash
./start-dev.sh
```

这会同时启动：
- 后端 API (8000)
- 前端页面 (3000)
- 爬虫服务器 (8001)

## API 接口

### 1. 启动爬取（默认标签）

**请求：**
```bash
POST /run
```

**示例：**
```bash
curl -X POST http://localhost:8001/run
```

**响应：**
```json
{
  "success": true,
  "message": "爬取完成",
  "result": {
    "success": true,
    "timestamp": "2025-12-17T08:30:00.000Z",
    "tags": ["music", "dance"],
    "platforms": [
      {
        "name": "tiktok",
        "success": true,
        "count": 40
      },
      {
        "name": "instagram",
        "success": true,
        "count": 20
      }
    ]
  }
}
```

---

### 2. 启动爬取（指定标签）

**请求：**
```bash
POST /run/tags
Content-Type: application/json

{
  "tags": ["music", "AI", "crypto"]
}
```

**示例：**
```bash
curl -X POST http://localhost:8001/run/tags \
  -H "Content-Type: application/json" \
  -d '{"tags": ["music", "AI", "crypto"]}'
```

**响应：** 同上

---

### 3. 获取爬虫状态

**请求：**
```bash
GET /status
```

**示例：**
```bash
curl http://localhost:8001/status
```

**响应：**
```json
{
  "running": false,
  "lastRun": "2025-12-17T08:30:00.000Z",
  "lastResult": {
    "success": true,
    "timestamp": "2025-12-17T08:30:00.000Z",
    "tags": ["music", "dance"],
    "platforms": [...]
  },
  "totalRuns": 5,
  "errors": [],
  "config": {
    "tags": ["music", "dance"],
    "platforms": ["TikTok", "Instagram", "Twitter/X", "YouTube", "LinkedIn", "Reddit"]
  }
}
```

**字段说明：**
- `running`: 爬虫是否正在运行
- `lastRun`: 最后一次运行时间
- `lastResult`: 最后一次运行结果
- `totalRuns`: 总运行次数
- `errors`: 最近的错误列表（最多保留10条）
- `config`: 当前配置

---

### 4. 健康检查

**请求：**
```bash
GET /health
```

**示例：**
```bash
curl http://localhost:8001/health
```

**响应：**
```json
{
  "status": "ok",
  "timestamp": "2025-12-17T08:30:00.000Z"
}
```

---

## 配置

### 修改默认标签

编辑 `spider6p/config.js`：

```javascript
export const config = {
  spider: {
    tags: ['music', 'dance'],  // 修改这里
    limit: 20,
    // ...
  }
};
```

### 启用/禁用平台

编辑 `spider6p/config.js`：

```javascript
platforms: {
  tiktok: { enabled: true, name: 'TikTok' },
  instagram: { enabled: true, name: 'Instagram' },
  twitter: { enabled: false, name: 'Twitter/X' },  // 禁用 Twitter
  youtube: { enabled: true, name: 'YouTube' },
  linkedin: { enabled: true, name: 'LinkedIn' },
  reddit: { enabled: true, name: 'Reddit' }
}
```

### 环境变量

创建 `spider6p/.env` 文件：

```env
# Kafka 配置
KAFKA_BOOTSTRAP_SERVERS=pkc-xxx.us-central1.gcp.confluent.cloud:9092
KAFKA_API_KEY=your-api-key
KAFKA_API_SECRET=your-api-secret

# TikHub API (用于爬取数据)
TIKHUB_API_KEY=your-tikhub-api-key

# 爬虫服务器端口
SPIDER_PORT=8001
```

---

## 数据流

```
爬虫服务器 (8001)
    ↓
爬取数据 (TikTok, Instagram, etc.)
    ↓
转换为标准格式
    ↓
发送到 Kafka (market-stream topic)
    ↓
后端消费 (8000)
    ↓
计算 VKS 分数
    ↓
SSE 推送到前端 (3000)
    ↓
实时图表显示
```

---

## 错误处理

### 爬虫已在运行

**错误：**
```json
{
  "success": false,
  "message": "爬虫正在运行中，请稍后再试"
}
```

**解决：** 等待当前任务完成，或检查 `/status` 确认状态。

### 无效的标签

**错误：**
```json
{
  "success": false,
  "message": "请提供 tags 数组"
}
```

**解决：** 确保请求体包含有效的 `tags` 数组。

### Kafka 连接失败

**错误：** 爬取完成但数据未推送到 Kafka

**解决：** 检查 `.env` 中的 Kafka 配置和网络连接。

---

## 监控和调试

### 查看服务器日志

```bash
# 启动时会显示配置信息
🕷️  Spider6P 爬虫服务器已启动
📡 端口: 8001
🏷️  默认标签: music, dance
🌐 启用平台: TikTok, Instagram, Twitter/X, YouTube, LinkedIn, Reddit
```

### 查看爬取进度

```bash
# 实时查看状态
curl http://localhost:8001/status | jq
```

### 查看错误日志

```bash
# 获取最近的错误
curl http://localhost:8001/status | jq '.errors'
```

---

## 常见问题

### Q: 爬虫为什么没有数据？

**A:** 检查以下几点：
1. TikHub API Key 是否配置正确
2. 网络连接是否正常
3. 标签是否有效
4. 平台是否启用

### Q: 数据为什么没有出现在前端？

**A:** 检查数据流：
1. 爬虫是否成功发送到 Kafka
2. 后端是否正在消费 Kafka
3. 前端是否连接到后端 SSE

### Q: 如何重新爬取相同的标签？

**A:** 直接调用 `/run` 或 `/run/tags` 即可，爬虫会覆盖之前的数据。

### Q: 爬虫支持多少个标签？

**A:** 理论上无限制，但建议不超过 10 个以避免超时。

---

## 性能优化

### 并发爬取

爬虫默认并发爬取所有启用的平台，可在 `config.js` 中调整：

```javascript
spider: {
  concurrency: 6,  // 最多同时爬取 6 个平台
  timeout: 30000,  // 单个请求超时 30 秒
  requestDelay: 500  // 请求间隔 500ms
}
```

### 限制数据量

```javascript
spider: {
  limit: 20  // 每个标签最多爬取 20 条数据
}
```

---

## 集成示例

### 前端触发爬取

```typescript
async function triggerCrawl() {
  try {
    const response = await fetch('http://localhost:8001/run', {
      method: 'POST'
    });
    const result = await response.json();
    console.log('爬取结果:', result);
  } catch (error) {
    console.error('爬取失败:', error);
  }
}
```

### 指定标签爬取

```typescript
async function crawlWithTags(tags: string[]) {
  try {
    const response = await fetch('http://localhost:8001/run/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags })
    });
    const result = await response.json();
    console.log('爬取结果:', result);
  } catch (error) {
    console.error('爬取失败:', error);
  }
}
```

---

## 故障排除

### 服务器无法启动

```bash
# 检查端口是否被占用
lsof -i :8001

# 使用不同的端口
SPIDER_PORT=8002 npm run server
```

### Kafka 连接超时

```bash
# 检查 Kafka 配置
cat spider6p/.env

# 测试连接
node -e "import('./src/utils/kafka-producer.js').then(m => m.kafkaProducer.connect())"
```

---

## 更新日志

### v1.0.0 (2025-12-17)
- ✅ 初始版本
- ✅ 支持 6 个社交媒体平台
- ✅ HTTP API 接口
- ✅ Kafka 集成
- ✅ 实时状态监控
