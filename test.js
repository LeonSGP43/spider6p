import fs from 'fs';
import path from 'path';
import { crawlAll, spiders, config } from './index.js';

// 保存单个平台结果
function savePlatformResult(platformName, result) {
  const outputDir = 'output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const file = path.join(outputDir, `${platformName}_${timestamp}.json`);
  fs.writeFileSync(file, JSON.stringify(result, null, 2));
  console.log(`\n📁 Saved: ${file}`);
}

// 测试单个平台
async function testSinglePlatform(platformName) {
  console.log(`\nTesting ${platformName}...`);
  const spider = spiders[platformName];
  if (!spider) {
    console.error(`Spider not found: ${platformName}`);
    return;
  }
  
  try {
    const result = await spider.crawl(['music'], 5);
    console.log(`Result:`, JSON.stringify(result, null, 2).slice(0, 1000));
    savePlatformResult(platformName, result);
  } catch (err) {
    console.error(`Error:`, err.message);
  }
}

// 测试所有平台
async function testAll() {
  console.log('Testing all platforms...\n');
  const result = await crawlAll();
  
  // 打印摘要
  console.log('\n========== Summary ==========');
  for (const [platform, data] of Object.entries(result.platforms || result)) {
    if (data.success) {
      const totalItems = Object.values(data.data || {}).reduce((sum, items) => sum + items.length, 0);
      console.log(`✅ ${platform}: ${totalItems} items`);
    } else {
      const errors = data.errors?.map(e => e.error).join(', ') || data.error || 'Unknown';
      console.log(`❌ ${platform}: Failed - ${errors}`);
    }
  }
  
  return result;
}

// 运行测试
const args = process.argv.slice(2);
if (args[0]) {
  testSinglePlatform(args[0]);
} else {
  testAll();
}
