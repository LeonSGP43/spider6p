/**
 * Kafka Producer for Spider6p
 * 
 * 将爬取的数据直接推送到 Confluent Cloud Kafka
 * Topic: market-stream
 */

import { Kafka, logLevel } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

// Kafka 配置
const KAFKA_CONFIG = {
  brokers: (process.env.KAFKA_BOOTSTRAP_SERVERS || '').split(',').filter(Boolean),
  sasl: {
    mechanism: 'plain',
    username: process.env.KAFKA_API_KEY || '',
    password: process.env.KAFKA_API_SECRET || ''
  },
  ssl: true,
  connectionTimeout: 10000,
  requestTimeout: 30000
};

const TOPIC = process.env.KAFKA_TOPIC || 'market-stream';

class KafkaProducerClient {
  constructor() {
    this.kafka = null;
    this.producer = null;
    this.connected = false;
    this.enabled = this._checkConfig();
  }

  _checkConfig() {
    const { brokers, sasl } = KAFKA_CONFIG;
    if (!brokers.length || !sasl.username || !sasl.password) {
      console.log('[Kafka] ⚠️ Kafka 未配置，数据将只保存到本地');
      return false;
    }
    return true;
  }

  async connect() {
    if (!this.enabled) return false;
    if (this.connected) return true;

    try {
      this.kafka = new Kafka({
        clientId: 'spider6p',
        brokers: KAFKA_CONFIG.brokers,
        ssl: KAFKA_CONFIG.ssl,
        sasl: KAFKA_CONFIG.sasl,
        logLevel: logLevel.WARN,
        connectionTimeout: KAFKA_CONFIG.connectionTimeout,
        requestTimeout: KAFKA_CONFIG.requestTimeout
      });

      this.producer = this.kafka.producer({
        allowAutoTopicCreation: false,
        transactionTimeout: 30000
      });

      await this.producer.connect();
      this.connected = true;
      console.log('[Kafka] ✓ 已连接到 Confluent Cloud');
      return true;
    } catch (error) {
      console.error('[Kafka] ✗ 连接失败:', error.message);
      this.connected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.producer && this.connected) {
      try {
        await this.producer.disconnect();
        console.log('[Kafka] ✓ 已断开连接');
      } catch (error) {
        console.error('[Kafka] 断开连接失败:', error.message);
      }
      this.connected = false;
    }
  }

  /**
   * 发送单条消息到 Kafka
   */
  async sendMessage(data, key = null) {
    if (!this.enabled || !this.connected) return false;

    try {
      const message = {
        value: JSON.stringify(data),
        timestamp: Date.now().toString()
      };
      
      if (key) {
        message.key = key;
      }

      await this.producer.send({
        topic: TOPIC,
        messages: [message]
      });

      return true;
    } catch (error) {
      console.error('[Kafka] 发送消息失败:', error.message);
      return false;
    }
  }

  /**
   * 批量发送消息到 Kafka
   */
  async sendBatch(dataArray) {
    if (!this.enabled || !this.connected) return { success: false, sent: 0 };
    if (!dataArray || dataArray.length === 0) return { success: true, sent: 0 };

    try {
      const messages = dataArray.map(item => ({
        key: item.hashtag || item.tag || item.keyword || null,
        value: JSON.stringify(item),
        timestamp: Date.now().toString()
      }));

      await this.producer.send({
        topic: TOPIC,
        messages
      });

      return { success: true, sent: messages.length };
    } catch (error) {
      console.error('[Kafka] 批量发送失败:', error.message);
      return { success: false, sent: 0, error: error.message };
    }
  }

  /**
   * 发送爬虫汇总数据
   * 将每个平台的每个标签数据转换为标准格式发送
   */
  async sendCrawlResults(summary) {
    if (!this.enabled) {
      console.log('[Kafka] ⚠️ Kafka 未启用，跳过推送');
      return { success: false, sent: 0 };
    }

    if (!this.connected) {
      const connected = await this.connect();
      if (!connected) return { success: false, sent: 0 };
    }

    let totalSent = 0;
    const timestamp = new Date().toISOString();

    try {
      for (const [platform, platformData] of Object.entries(summary.platforms || {})) {
        if (!platformData.success || !platformData.data) continue;

        for (const [tag, posts] of Object.entries(platformData.data)) {
          if (!Array.isArray(posts)) continue;

          // 转换为标准格式
          const messages = posts.map(post => ({
            // 标准字段
            type: 'social_post',
            platform: platform,
            hashtag: `#${tag}`,
            tag: tag,
            
            // 帖子数据
            post_id: post.id || post.aweme_id || post.video_id || null,
            author: post.author?.username || post.author || post.user || null,
            description: post.content?.title || post.desc || post.description || post.title || '',
            
            // 内容链接 - 重要！
            content_url: post.content?.url || post.url || post.link || post.share_url || '',
            cover_url: post.content?.coverUrl || post.content?.thumbnailUrl || post.content?.mediaUrl || 
                       post.cover || post.thumbnail || post.image || '',
            
            // 互动数据 - 支持多种数据格式
            // 格式1: post.stats.views (spider6p 标准格式)
            // 格式2: post.statistics.play_count (TikHub 原始格式)
            // 格式3: post.views (扁平格式)
            views: post.stats?.views || post.statistics?.play_count || post.play_count || post.views || 0,
            likes: post.stats?.likes || post.statistics?.digg_count || post.digg_count || post.likes || 0,
            comments: post.stats?.comments || post.statistics?.comment_count || post.comment_count || post.comments || 0,
            shares: post.stats?.shares || post.statistics?.share_count || post.share_count || post.shares || 0,
            saves: post.stats?.saves || post.statistics?.collect_count || post.collect_count || post.saves || 0,
            
            // 时间戳
            created_at: post.createdAt || post.create_time || post.created_at || null,
            crawled_at: timestamp,
            
            // 原始数据 (可选)
            raw: post
          }));

          const result = await this.sendBatch(messages);
          if (result.success) {
            totalSent += result.sent;
          }
        }
      }

      console.log(`[Kafka] ✓ 已推送 ${totalSent} 条数据到 ${TOPIC}`);
      return { success: true, sent: totalSent };
    } catch (error) {
      console.error('[Kafka] 推送爬虫结果失败:', error.message);
      return { success: false, sent: totalSent, error: error.message };
    }
  }
}

// 单例导出
export const kafkaProducer = new KafkaProducerClient();
export default kafkaProducer;
