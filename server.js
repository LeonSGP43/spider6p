/**
 * Spider6P 爬虫服务器
 * 
 * 提供 HTTP API 接口，接收信号后开始爬取并发送数据到 Kafka
 * 
 * 启动: node server.js
 * 端口: 8001 (可通过环境变量 SPIDER_PORT 修改)
 * 
 * API:
 *   POST /run          - 启动爬取任务
 *   POST /run/tags     - 指定标签爬取 { "tags": ["music", "dance"] }
 *   GET  /status       - 获取爬虫状态
 *   GET  /health       - 健康检查
 */

import http from 'http';
import { crawlAll, config } from './index.js';
import { kafkaProducer } from './src/utils/kafka-producer.js';

const PORT = process.env.SPIDER_PORT || 8001;

// 爬虫状态
let crawlerStatus = {
  running: false,
  lastRun: null,
  lastResult: null,
  totalRuns: 0,
  errors: []
};

// 解析 JSON body
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// 发送 JSON 响应
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

// 执行爬取任务
async function runCrawl(customTags = null) {
  if (crawlerStatus.running) {
    return { success: false, message: '爬虫正在运行中，请稍后再试' };
  }

  crawlerStatus.running = true;
  crawlerStatus.lastRun = new Date().toISOString();

  try {
    // 如果指定了自定义标签，临时修改配置
    const originalTags = config.spider.tags;
    if (customTags && Array.isArray(customTags) && customTags.length > 0) {
      config.spider.tags = customTags;
      console.log(`[Server] 使用自定义标签: ${customTags.join(', ')}`);
    }

    console.log(`[Server] 开始爬取任务...`);
    const result = await crawlAll();

    // 恢复原始标签配置
    config.spider.tags = originalTags;

    crawlerStatus.lastResult = {
      success: true,
      timestamp: result.timestamp,
      tags: result.tags,
      platforms: Object.entries(result.platforms).map(([name, data]) => ({
        name,
        success: data.success,
        count: data.data ? Object.values(data.data).flat().length : 0
      }))
    };
    crawlerStatus.totalRuns++;

    console.log(`[Server] 爬取完成!`);
    return { success: true, message: '爬取完成', result: crawlerStatus.lastResult };

  } catch (error) {
    console.error(`[Server] 爬取失败:`, error);
    crawlerStatus.errors.push({
      time: new Date().toISOString(),
      message: error.message
    });
    // 只保留最近10条错误
    if (crawlerStatus.errors.length > 10) {
      crawlerStatus.errors = crawlerStatus.errors.slice(-10);
    }
    return { success: false, message: '爬取失败', error: error.message };

  } finally {
    crawlerStatus.running = false;
  }
}

// Mock 模式：使用已有数据发送到 Kafka（不消耗 API 费用）
async function runMockCrawl() {
  if (crawlerStatus.running) {
    return { success: false, message: '爬虫正在运行中，请稍后再试' };
  }

  crawlerStatus.running = true;
  crawlerStatus.lastRun = new Date().toISOString();

  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // 查找最新的爬虫数据文件
    const outputDir = path.default.join(process.cwd(), 'output');
    if (!fs.default.existsSync(outputDir)) {
      throw new Error('output 目录不存在，请先运行一次真实爬虫');
    }
    
    const files = fs.default.readdirSync(outputDir)
      .filter(f => f.startsWith('crawl_') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      throw new Error('没有找到爬虫数据文件，请先运行一次真实爬虫');
    }
    
    const latestFile = path.default.join(outputDir, files[0]);
    console.log(`[Server] 🎭 Mock 模式: 使用数据文件 ${files[0]}`);
    
    const content = fs.default.readFileSync(latestFile, 'utf-8');
    const summary = JSON.parse(content);
    
    // 连接 Kafka 并发送数据
    const connected = await kafkaProducer.connect();
    if (!connected) {
      throw new Error('Kafka 连接失败');
    }
    
    const kafkaResult = await kafkaProducer.sendCrawlResults(summary);
    
    crawlerStatus.lastResult = {
      success: true,
      timestamp: new Date().toISOString(),
      tags: summary.tags || [],
      mode: 'mock',
      sourceFile: files[0],
      kafkaSent: kafkaResult.sent,
      platforms: Object.entries(summary.platforms || {}).map(([name, data]) => ({
        name,
        success: data.success,
        count: data.data ? Object.values(data.data).flat().length : 0
      }))
    };
    crawlerStatus.totalRuns++;
    
    console.log(`[Server] 🎭 Mock 爬取完成! 发送 ${kafkaResult.sent} 条数据到 Kafka`);
    return { success: true, message: 'Mock 爬取完成', result: crawlerStatus.lastResult };
    
  } catch (error) {
    console.error(`[Server] Mock 爬取失败:`, error);
    crawlerStatus.errors.push({
      time: new Date().toISOString(),
      message: error.message
    });
    if (crawlerStatus.errors.length > 10) {
      crawlerStatus.errors = crawlerStatus.errors.slice(-10);
    }
    return { success: false, message: 'Mock 爬取失败', error: error.message };
    
  } finally {
    crawlerStatus.running = false;
  }
}

// HTTP 请求处理
async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method;

  // CORS 预检
  if (method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  console.log(`[Server] ${method} ${path}`);

  try {
    // 健康检查
    if (path === '/health' && method === 'GET') {
      sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
      return;
    }

    // 获取状态
    if (path === '/status' && method === 'GET') {
      sendJson(res, 200, {
        ...crawlerStatus,
        config: {
          tags: config.spider.tags,
          platforms: Object.entries(config.platforms)
            .filter(([_, cfg]) => cfg.enabled)
            .map(([key, cfg]) => cfg.name)
        }
      });
      return;
    }

    // 启动爬取 (使用默认标签)
    if (path === '/run' && method === 'POST') {
      const result = await runCrawl();
      sendJson(res, result.success ? 200 : 409, result);
      return;
    }

    // 启动爬取 (指定标签)
    if (path === '/run/tags' && method === 'POST') {
      const body = await parseBody(req);
      const tags = body.tags;
      
      if (!tags || !Array.isArray(tags) || tags.length === 0) {
        sendJson(res, 400, { success: false, message: '请提供 tags 数组' });
        return;
      }

      const result = await runCrawl(tags);
      sendJson(res, result.success ? 200 : 409, result);
      return;
    }

    // Mock 模式爬取 (使用已有数据，不消耗 API 费用)
    if (path === '/run/mock' && method === 'POST') {
      const result = await runMockCrawl();
      sendJson(res, result.success ? 200 : 409, result);
      return;
    }

    // 404
    sendJson(res, 404, { error: 'Not Found', path });

  } catch (error) {
    console.error(`[Server] Error:`, error);
    sendJson(res, 500, { error: error.message });
  }
}

// 启动服务器
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🕷️  Spider6P 爬虫服务器已启动');
  console.log('='.repeat(60));
  console.log(`📡 端口: ${PORT}`);
  console.log(`🏷️  默认标签: ${config.spider.tags.join(', ')}`);
  console.log(`🌐 启用平台: ${Object.entries(config.platforms).filter(([_, c]) => c.enabled).map(([_, c]) => c.name).join(', ')}`);
  console.log('');
  console.log('API 接口:');
  console.log(`  POST http://localhost:${PORT}/run          - 启动爬取 (消耗 API)`);
  console.log(`  POST http://localhost:${PORT}/run/tags     - 指定标签爬取 (消耗 API)`);
  console.log(`  POST http://localhost:${PORT}/run/mock     - 🎭 Mock 模式 (使用已有数据，不消耗 API)`);
  console.log(`  GET  http://localhost:${PORT}/status       - 获取状态`);
  console.log(`  GET  http://localhost:${PORT}/health       - 健康检查`);
  console.log('='.repeat(60));
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n[Server] 正在关闭...');
  await kafkaProducer.disconnect();
  server.close(() => {
    console.log('[Server] 已关闭');
    process.exit(0);
  });
});
