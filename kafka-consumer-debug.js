/**
 * Kafka 消费者调试工具
 * 实时监听 market-stream topic 的所有消息
 * 
 * 用法: node kafka-consumer-debug.js
 */

import { Kafka, logLevel } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

const kafka = new Kafka({
  clientId: 'debug-consumer',
  brokers: (process.env.KAFKA_BOOTSTRAP_SERVERS || '').split(','),
  ssl: true,
  sasl: {
    mechanism: 'plain',
    username: process.env.KAFKA_API_KEY || '',
    password: process.env.KAFKA_API_SECRET || ''
  },
  logLevel: logLevel.WARN
});

const consumer = kafka.consumer({ groupId: 'debug-consumer-' + Date.now() });

async function run() {
  console.log('='.repeat(60));
  console.log('Kafka 消息实时监听');
  console.log('Topic: market-stream');
  console.log('='.repeat(60));

  await consumer.connect();
  console.log('✓ 已连接到 Kafka\n');

  await consumer.subscribe({ topic: 'market-stream', fromBeginning: false });
  console.log('✓ 已订阅 market-stream (只监听新消息)\n');
  console.log('等待消息...\n');

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const timestamp = new Date().toISOString();
      const key = message.key?.toString() || 'null';
      let value;
      
      try {
        value = JSON.parse(message.value.toString());
      } catch {
        value = message.value.toString();
      }

      console.log('-'.repeat(60));
      console.log(`[${timestamp}] 收到消息`);
      console.log(`  Topic: ${topic}`);
      console.log(`  Partition: ${partition}`);
      console.log(`  Key: ${key}`);
      console.log(`  Value:`, JSON.stringify(value, null, 2));
    }
  });
}

// 优雅退出
process.on('SIGINT', async () => {
  console.log('\n\n正在断开连接...');
  await consumer.disconnect();
  console.log('已断开');
  process.exit(0);
});

run().catch(console.error);
