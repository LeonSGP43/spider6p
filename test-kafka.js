/**
 * Kafka 连接测试脚本
 * 
 * 用法: node test-kafka.js
 */

import { kafkaProducer } from './src/utils/kafka-producer.js';

async function testKafka() {
  console.log('='.repeat(50));
  console.log('Kafka 连接测试');
  console.log('='.repeat(50));

  // 1. 测试连接
  console.log('\n[1] 测试连接...');
  const connected = await kafkaProducer.connect();
  
  if (!connected) {
    console.log('❌ 连接失败，请检查 .env 配置');
    console.log('\n需要配置以下环境变量:');
    console.log('  KAFKA_BOOTSTRAP_SERVERS=pkc-xxxxx.xxx.confluent.cloud:9092');
    console.log('  KAFKA_API_KEY=your-api-key');
    console.log('  KAFKA_API_SECRET=your-api-secret');
    process.exit(1);
  }

  console.log('✅ 连接成功');

  // 2. 发送测试消息
  console.log('\n[2] 发送测试消息...');
  const testData = {
    type: 'test',
    platform: 'test',
    hashtag: '#test',
    message: 'Spider6p Kafka 测试消息',
    timestamp: new Date().toISOString()
  };

  const sent = await kafkaProducer.sendMessage(testData, 'test');
  
  if (sent) {
    console.log('✅ 测试消息发送成功');
    console.log('   数据:', JSON.stringify(testData, null, 2));
  } else {
    console.log('❌ 测试消息发送失败');
  }

  // 3. 断开连接
  console.log('\n[3] 断开连接...');
  await kafkaProducer.disconnect();
  console.log('✅ 已断开');

  console.log('\n' + '='.repeat(50));
  console.log('测试完成！');
  console.log('='.repeat(50));
}

testKafka().catch(console.error);
