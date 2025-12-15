import fs from 'fs';
import path from 'path';
import { config } from './config.js';
import {
  TikTokSpider,
  InstagramSpider,
  TwitterSpider,
  YouTubeSpider,
  LinkedInSpider,
  RedditSpider
} from './src/platforms/index.js';
import { requestCounter } from './src/utils/http.js';

const spiders = {
  tiktok: new TikTokSpider(),
  instagram: new InstagramSpider(),
  twitter: new TwitterSpider(),
  youtube: new YouTubeSpider(),
  linkedin: new LinkedInSpider(),
  reddit: new RedditSpider()
};

async function crawlAll() {
  console.log('='.repeat(60));
  console.log('Spider6P - Multi-Platform Social Media Crawler');
  console.log(`Tags: ${config.spider.tags.join(', ')}`);
  console.log(`Limit per tag: ${config.spider.limit}`);
  console.log('='.repeat(60));

  const enabledPlatforms = Object.entries(config.platforms)
    .filter(([_, cfg]) => cfg.enabled)
    .map(([key]) => key);

  console.log(`\nEnabled platforms: ${enabledPlatforms.join(', ')}\n`);

  // 并发爬取所有平台
  const crawlPromises = enabledPlatforms.map(async (platform) => {
    const spider = spiders[platform];
    if (!spider) {
      console.error(`[Error] Spider not found for platform: ${platform}`);
      return { platform, success: false, error: 'Spider not found' };
    }
    return spider.crawl(config.spider.tags, config.spider.limit);
  });

  const results = await Promise.allSettled(crawlPromises);

  // 汇总结果
  const summary = {
    timestamp: new Date().toISOString(),
    tags: config.spider.tags,
    platforms: {}
  };

  results.forEach((result, index) => {
    const platform = enabledPlatforms[index];
    if (result.status === 'fulfilled') {
      summary.platforms[platform] = result.value;
    } else {
      summary.platforms[platform] = {
        platform,
        success: false,
        error: result.reason?.message || 'Unknown error'
      };
    }
  });

  // 打印汇总
  console.log('\n' + '='.repeat(60));
  console.log('CRAWL SUMMARY');
  console.log('='.repeat(60));

  for (const [platform, data] of Object.entries(summary.platforms)) {
    const status = data.success ? '✓' : '✗';
    const counts = data.data 
      ? Object.entries(data.data).map(([tag, items]) => `#${tag}: ${items.length}`).join(', ')
      : 'N/A';
    console.log(`[${status}] ${platform.toUpperCase()}: ${counts}`);
  }

  // 打印 API 调用统计
  const apiStats = requestCounter.getSummary();
  console.log('\n' + '-'.repeat(60));
  console.log('API CALL STATISTICS');
  console.log('-'.repeat(60));
  console.log(`📊 Total API Calls: ${apiStats.total}`);
  console.log(`   ✓ Success: ${apiStats.success}`);
  console.log(`   ✗ Failed: ${apiStats.failed}`);
  console.log('-'.repeat(60));

  // 保存数据到 JSON 文件
  await saveResults(summary);

  return summary;
}

// 保存爬取结果到 JSON 文件
async function saveResults(summary) {
  const outputDir = 'output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  
  // 保存完整汇总
  const summaryFile = path.join(outputDir, `crawl_${timestamp}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  console.log(`\n📁 Saved: ${summaryFile}`);

  // 按平台分别保存
  for (const [platform, data] of Object.entries(summary.platforms)) {
    if (data.success && data.data) {
      const platformFile = path.join(outputDir, `${platform}_${timestamp}.json`);
      fs.writeFileSync(platformFile, JSON.stringify(data, null, 2));
      console.log(`📁 Saved: ${platformFile}`);
    }
  }
}

// 导出供外部使用
export { crawlAll, spiders, config };

// 直接运行
if (process.argv[1].endsWith('index.js')) {
  crawlAll()
    .then(summary => {
      console.log('\n✓ Crawl completed');
      console.log(`Output: ${JSON.stringify(summary, null, 2).slice(0, 500)}...`);
    })
    .catch(err => {
      console.error('Crawl failed:', err);
      process.exit(1);
    });
}
