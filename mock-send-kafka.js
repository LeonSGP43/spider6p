/**
 * Mock Kafka 发送脚本
 * 
 * 读取已有的爬虫结果JSON文件，模拟真实爬虫发送数据到Kafka
 * 用法: node mock-send-kafka.js [json文件路径]
 * 
 * 示例: node mock-send-kafka.js output/crawl_2025-12-15T11-35-43.json
 */

import fs from 'fs';
import path from 'path';
import { kafkaProducer } from './src/utils/kafka-producer.js';

// 默认文件路径
const DEFAULT_FILE = 'output/crawl_2025-12-15T11-35-43.json';

async function mockSendToKafka(filePath) {
  console.log('='.repeat(60));
  console.log('Mock Kafka 发送 - 使用已有爬虫数据');
  console.log('='.repeat(60));

  // 1. 读取JSON文件
  const targetFile = filePath || DEFAULT_FILE;
  const fullPath = path.resolve(targetFile);
  
  console.log(`\n[1] 读取数据文件: ${fullPath}`);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ 文件不存在: ${fullPath}`);
    process.exit(1);
  }

  let summary;
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    summary = JSON.parse(content);
    console.log(`✅ 文件读取成功`);
    console.log(`   时间戳: ${summary.timestamp}`);
    console.log(`   标签: ${summary.tags?.join(', ')}`);
    console.log(`   平台: ${Object.keys(summary.platforms || {}).join(', ')}`);
  } catch (error) {
    console.error(`❌ 文件解析失败: ${error.message}`);
    process.exit(1);
  }

  // 2. 统计数据量
  console.log('\n[2] 数据统计:');
  let totalPosts = 0;
  for (const [platform, data] of Object.entries(summary.platforms || {})) {
    if (data.success && data.data) {
      for (const [tag, posts] of Object.entries(data.data)) {
        const count = Array.isArray(posts) ? posts.length : 0;
        totalPosts += count;
        console.log(`   ${platform}/#${tag}: ${count} 条`);
      }
    }
  }
  console.log(`   总计: ${totalPosts} 条`);

  // 3. 连接Kafka
  console.log('\n[3] 连接 Kafka...');
  const connected = await kafkaProducer.connect();
  
  if (!connected) {
    console.error('❌ Kafka 连接失败，请检查 .env 配置');
    process.exit(1);
  }
  console.log('✅ Kafka 连接成功');

  // 4. 发送数据 (使用与真实爬虫相同的方法)
  console.log('\n[4] 发送数据到 Kafka...');
  const result = await kafkaProducer.sendCrawlResults(summary);

  if (result.success) {
    console.log(`\n✅ 发送成功! 共发送 ${result.sent} 条数据`);
  } else {
    console.error(`\n❌ 发送失败: ${result.error || '未知错误'}`);
  }

  // 5. 断开连接
  console.log('\n[5] 断开 Kafka 连接...');
  await kafkaProducer.disconnect();

  console.log('\n' + '='.repeat(60));
  console.log('Mock 发送完成!');
  console.log('='.repeat(60));

  return result;
}

// 从命令行参数获取文件路径
const args = process.argv.slice(2);
const filePath = args[0];

mockSendToKafka(filePath).catch(err => {
  console.error('执行失败:', err);
  process.exit(1);
});
