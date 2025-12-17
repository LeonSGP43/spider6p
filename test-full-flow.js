/**
 * 完整数据流测试
 * 发送模拟数据到 Kafka，验证后端 SSE 推送
 */

import { kafkaProducer } from './src/utils/kafka-producer.js';

const mockPosts = [
  {
    type: 'social_post',
    platform: 'tiktok',
    hashtag: '#music',
    tag: 'music',
    post_id: 'test_001',
    author: { id: 'user1', nickname: 'MusicCreator' },
    description: '🎵 Amazing music video! #music #viral',
    views: 1500000,
    likes: 85000,
    comments: 3200,
    shares: 1500,
    saves: 2800,
    crawled_at: new Date().toISOString()
  },
  {
    type: 'social_post',
    platform: 'tiktok',
    hashtag: '#dance',
    tag: 'dance',
    post_id: 'test_002',
    author: { id: 'user2', nickname: 'DanceQueen' },
    description: '💃 New dance challenge! #dance #trending',
    views: 2300000,
    likes: 120000,
    comments: 5600,
    shares: 8900,
    saves: 4500,
    crawled_at: new Date().toISOString()
  },
  {
    type: 'social_post',
    platform: 'instagram',
    hashtag: '#fashion',
    tag: 'fashion',
    post_id: 'test_003',
    author: { id: 'user3', nickname: 'FashionIcon' },
    description: '👗 OOTD vibes #fashion #style',
    views: 890000,
    likes: 45000,
    comments: 1200,
    shares: 300,
    saves: 6700,
    crawled_at: new Date().toISOString()
  }
];

async function testFullFlow() {
  console.log('='.repeat(50));
  console.log('完整数据流测试');
  console.log('='.repeat(50));

  // 1. 连接 Kafka
  console.log('\n[1] 连接 Kafka...');
  const connected = await kafkaProducer.connect();
  if (!connected) {
    console.log('❌ 连接失败');
    process.exit(1);
  }
  console.log('✅ 已连接');

  // 2. 发送模拟数据
  console.log('\n[2] 发送模拟数据...');
  for (const post of mockPosts) {
    const sent = await kafkaProducer.sendMessage(post, post.hashtag);
    console.log(`   ${sent ? '✅' : '❌'} ${post.platform} ${post.hashtag} - ${post.views.toLocaleString()} views`);
    await new Promise(r => setTimeout(r, 500)); // 间隔 500ms
  }

  // 3. 断开连接
  console.log('\n[3] 断开连接...');
  await kafkaProducer.disconnect();

  console.log('\n' + '='.repeat(50));
  console.log('测试完成！');
  console.log('='.repeat(50));
  console.log('\n📡 现在检查后端 SSE:');
  console.log('   curl -N http://localhost:8000/api/stream/trends');
}

testFullFlow().catch(console.error);
