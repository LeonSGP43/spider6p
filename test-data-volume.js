#!/usr/bin/env node
/**
 * 测试脚本：分析各平台爬取数据量
 * 
 * 用法:
 *   node test-data-volume.js                    # 分析最新的crawl文件
 *   node test-data-volume.js <crawl_file>       # 分析指定文件
 *   node test-data-volume.js --run              # 执行一次爬取并分析
 */

import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = './output';

/**
 * 获取最新的crawl文件
 */
function getLatestCrawlFile() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    return null;
  }
  
  const files = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.startsWith('crawl_') && f.endsWith('.json'))
    .sort()
    .reverse();
  
  return files.length > 0 ? path.join(OUTPUT_DIR, files[0]) : null;
}

/**
 * 分析单个平台的数据
 */
function analyzePlatformData(platformName, platformData) {
  const result = {
    platform: platformName,
    success: platformData.success,
    error: platformData.error || null,
    tags: {},
    totalItems: 0,
    statsFields: new Set(),
    sampleStats: null
  };
  
  if (!platformData.success || !platformData.data) {
    return result;
  }
  
  // 分析每个tag的数据
  for (const [tag, items] of Object.entries(platformData.data)) {
    const tagStats = {
      count: Array.isArray(items) ? items.length : 0,
      types: {},
      hasStats: false,
      statsExample: null
    };
    
    if (Array.isArray(items)) {
      items.forEach(item => {
        // 统计类型
        const type = item.type || 'unknown';
        tagStats.types[type] = (tagStats.types[type] || 0) + 1;
        
        // 收集stats字段
        if (item.stats) {
          tagStats.hasStats = true;
          Object.keys(item.stats).forEach(k => result.statsFields.add(k));
          if (!tagStats.statsExample) {
            tagStats.statsExample = item.stats;
          }
        }
      });
    }
    
    result.tags[tag] = tagStats;
    result.totalItems += tagStats.count;
  }
  
  // 获取一个stats示例
  if (result.statsFields.size > 0) {
    for (const tagData of Object.values(result.tags)) {
      if (tagData.statsExample) {
        result.sampleStats = tagData.statsExample;
        break;
      }
    }
  }
  
  return result;
}

/**
 * 分析crawl文件
 */
function analyzeCrawlFile(filePath) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 爬虫数据量分析');
  console.log('='.repeat(70));
  console.log(`📁 文件: ${filePath}`);
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  console.log(`📅 时间: ${data.timestamp}`);
  console.log(`🏷️  标签: ${data.tags?.join(', ') || 'N/A'}`);
  console.log('='.repeat(70));
  
  const platforms = data.platforms || {};
  const analysisResults = [];
  
  // 分析每个平台
  for (const [platformName, platformData] of Object.entries(platforms)) {
    const analysis = analyzePlatformData(platformName, platformData);
    analysisResults.push(analysis);
  }
  
  // 打印汇总表格
  console.log('\n📈 各平台数据量汇总:');
  console.log('-'.repeat(70));
  console.log(
    '平台'.padEnd(12) + 
    '状态'.padEnd(8) + 
    '总数量'.padEnd(10) + 
    '各标签数量'.padEnd(25) +
    'Stats字段'
  );
  console.log('-'.repeat(70));
  
  let grandTotal = 0;
  
  for (const result of analysisResults) {
    const status = result.success ? '✓ 成功' : '✗ 失败';
    const tagCounts = Object.entries(result.tags)
      .map(([tag, data]) => `#${tag}:${data.count}`)
      .join(', ') || 'N/A';
    const statsFields = result.statsFields.size > 0 
      ? Array.from(result.statsFields).join(', ')
      : 'N/A';
    
    console.log(
      result.platform.toUpperCase().padEnd(12) +
      status.padEnd(8) +
      String(result.totalItems).padEnd(10) +
      tagCounts.padEnd(25) +
      statsFields
    );
    
    grandTotal += result.totalItems;
  }
  
  console.log('-'.repeat(70));
  console.log(`总计: ${grandTotal} 条数据`);
  
  // 打印详细的stats字段示例
  console.log('\n📋 各平台Stats字段示例:');
  console.log('-'.repeat(70));
  
  for (const result of analysisResults) {
    if (result.sampleStats) {
      console.log(`\n[${result.platform.toUpperCase()}]`);
      console.log(JSON.stringify(result.sampleStats, null, 2));
    }
  }
  
  // 打印内容类型分布
  console.log('\n📊 内容类型分布:');
  console.log('-'.repeat(70));
  
  for (const result of analysisResults) {
    if (result.success && result.totalItems > 0) {
      const allTypes = {};
      for (const tagData of Object.values(result.tags)) {
        for (const [type, count] of Object.entries(tagData.types)) {
          allTypes[type] = (allTypes[type] || 0) + count;
        }
      }
      const typeStr = Object.entries(allTypes)
        .map(([t, c]) => `${t}:${c}`)
        .join(', ');
      console.log(`[${result.platform.toUpperCase()}] ${typeStr}`);
    }
  }
  
  return {
    file: filePath,
    timestamp: data.timestamp,
    tags: data.tags,
    platforms: analysisResults,
    grandTotal
  };
}

/**
 * 执行爬取并分析
 */
async function runCrawlAndAnalyze() {
  console.log('🚀 开始执行爬取...\n');
  
  // 动态导入爬虫模块
  const { crawlAll } = await import('./index.js');
  
  const startTime = Date.now();
  const crawlResult = await crawlAll();
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log(`\n⏱️  爬取耗时: ${duration}s`);
  
  // 分析最新生成的文件
  const latestFile = getLatestCrawlFile();
  if (latestFile) {
    const analysis = analyzeCrawlFile(latestFile);
    
    // 添加性能统计
    console.log('\n' + '='.repeat(70));
    console.log('⚡ 性能统计');
    console.log('='.repeat(70));
    
    if (analysis.platforms) {
      const platformStats = [];
      for (const platform of analysis.platforms) {
        if (platform.success && platform.totalItems > 0) {
          const avgPerTag = (platform.totalItems / Object.keys(platform.tags).length).toFixed(1);
          platformStats.push({
            name: platform.platform.toUpperCase(),
            items: platform.totalItems,
            tags: Object.keys(platform.tags).length,
            avgPerTag
          });
        }
      }
      
      // 按数量排序
      platformStats.sort((a, b) => b.items - a.items);
      
      console.log('\n📊 平台性能排名:');
      console.log('-'.repeat(70));
      console.log('排名  平台          总数量  标签数  平均/标签  效率');
      console.log('-'.repeat(70));
      
      platformStats.forEach((stat, idx) => {
        const efficiency = (stat.items / duration).toFixed(1);
        console.log(
          `${(idx + 1).toString().padEnd(4)}` +
          `${stat.name.padEnd(14)}` +
          `${stat.items.toString().padEnd(8)}` +
          `${stat.tags.toString().padEnd(8)}` +
          `${stat.avgPerTag.padEnd(10)}` +
          `${efficiency} items/s`
        );
      });
    }
    
    console.log('-'.repeat(70));
    console.log(`总耗时: ${duration}s`);
    
    return analysis;
  } else {
    console.error('❌ 未找到爬取结果文件');
    return null;
  }
}

/**
 * 分析所有历史文件
 */
function analyzeAllFiles() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log('❌ output目录不存在');
    return;
  }
  
  const files = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.startsWith('crawl_') && f.endsWith('.json'))
    .sort();
  
  if (files.length === 0) {
    console.log('❌ 没有找到crawl文件');
    return;
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 历史爬取数据汇总');
  console.log('='.repeat(70));
  console.log(`共找到 ${files.length} 个爬取记录\n`);
  
  const allRecords = [];
  
  for (const file of files) {
    const filePath = path.join(OUTPUT_DIR, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const platforms = data.platforms || {};
      
      let total = 0;
      const platformCounts = [];
      const platformDetails = {};
      
      for (const [name, pdata] of Object.entries(platforms)) {
        if (pdata.success && pdata.data) {
          const count = Object.values(pdata.data)
            .reduce((sum, items) => sum + (Array.isArray(items) ? items.length : 0), 0);
          platformCounts.push(`${name}:${count}`);
          platformDetails[name] = count;
          total += count;
        } else {
          platformCounts.push(`${name}:✗`);
          platformDetails[name] = 0;
        }
      }
      
      allRecords.push({
        file,
        timestamp: data.timestamp,
        total,
        platforms: platformDetails,
        platformCounts
      });
      
      console.log(`📁 ${file}`);
      console.log(`   时间: ${data.timestamp}`);
      console.log(`   数据: ${platformCounts.join(', ')} (总计: ${total})`);
      console.log('');
    } catch (e) {
      console.log(`📁 ${file} - 解析失败: ${e.message}`);
    }
  }
  
  // 性能对比分析
  if (allRecords.length > 1) {
    console.log('\n' + '='.repeat(70));
    console.log('📈 爬取性能对比');
    console.log('='.repeat(70));
    
    // 获取所有平台名称
    const allPlatforms = new Set();
    allRecords.forEach(r => Object.keys(r.platforms).forEach(p => allPlatforms.add(p)));
    
    console.log('\n平台'.padEnd(12) + allRecords.map((_, i) => `第${i+1}次`.padEnd(10)).join('') + '平均值');
    console.log('-'.repeat(70));
    
    for (const platform of Array.from(allPlatforms).sort()) {
      const counts = allRecords.map(r => r.platforms[platform] || 0);
      const avg = (counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1);
      const row = platform.toUpperCase().padEnd(12) + 
                  counts.map(c => c.toString().padEnd(10)).join('') +
                  avg;
      console.log(row);
    }
    
    console.log('-'.repeat(70));
    const totals = allRecords.map(r => r.total);
    const avgTotal = (totals.reduce((a, b) => a + b, 0) / totals.length).toFixed(1);
    console.log('总计'.padEnd(12) + 
                totals.map(t => t.toString().padEnd(10)).join('') +
                avgTotal);
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--run')) {
    // 执行爬取并分析
    await runCrawlAndAnalyze();
  } else if (args.includes('--all')) {
    // 分析所有历史文件
    analyzeAllFiles();
  } else if (args.includes('--compare')) {
    // 对比最近两次爬取
    const files = fs.readdirSync(OUTPUT_DIR)
      .filter(f => f.startsWith('crawl_') && f.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, 2);
    
    if (files.length < 2) {
      console.log('❌ 需要至少 2 个爬取记录进行对比');
      return;
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('🔄 最近两次爬取对比');
    console.log('='.repeat(70));
    
    const records = files.map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, f), 'utf-8'));
      const platforms = data.platforms || {};
      const platformData = {};
      
      for (const [name, pdata] of Object.entries(platforms)) {
        if (pdata.success && pdata.data) {
          platformData[name] = Object.values(pdata.data)
            .reduce((sum, items) => sum + (Array.isArray(items) ? items.length : 0), 0);
        } else {
          platformData[name] = 0;
        }
      }
      
      return { file: f, timestamp: data.timestamp, platforms: platformData };
    });
    
    const allPlatforms = new Set();
    records.forEach(r => Object.keys(r.platforms).forEach(p => allPlatforms.add(p)));
    
    console.log('\n平台'.padEnd(12) + '第1次'.padEnd(10) + '第2次'.padEnd(10) + '变化');
    console.log('-'.repeat(70));
    
    for (const platform of Array.from(allPlatforms).sort()) {
      const first = records[0].platforms[platform] || 0;
      const second = records[1].platforms[platform] || 0;
      const change = second - first;
      const changeStr = change > 0 ? `+${change}` : change.toString();
      const changePercent = first > 0 ? ((change / first) * 100).toFixed(1) : 'N/A';
      
      console.log(
        platform.toUpperCase().padEnd(12) +
        first.toString().padEnd(10) +
        second.toString().padEnd(10) +
        `${changeStr} (${changePercent}%)`
      );
    }
    
    const total1 = Object.values(records[0].platforms).reduce((a, b) => a + b, 0);
    const total2 = Object.values(records[1].platforms).reduce((a, b) => a + b, 0);
    const totalChange = total2 - total1;
    const totalPercent = total1 > 0 ? ((totalChange / total1) * 100).toFixed(1) : 'N/A';
    
    console.log('-'.repeat(70));
    console.log(
      '总计'.padEnd(12) +
      total1.toString().padEnd(10) +
      total2.toString().padEnd(10) +
      `${totalChange > 0 ? '+' : ''}${totalChange} (${totalPercent}%)`
    );
  } else if (args.length > 0 && !args[0].startsWith('--')) {
    // 分析指定文件
    const filePath = args[0];
    if (fs.existsSync(filePath)) {
      analyzeCrawlFile(filePath);
    } else {
      console.error(`❌ 文件不存在: ${filePath}`);
      process.exit(1);
    }
  } else {
    // 分析最新文件
    const latestFile = getLatestCrawlFile();
    if (latestFile) {
      analyzeCrawlFile(latestFile);
    } else {
      console.log('❌ 没有找到crawl文件');
      console.log('\n用法:');
      console.log('  node test-data-volume.js              # 分析最新的crawl文件');
      console.log('  node test-data-volume.js <file>       # 分析指定文件');
      console.log('  node test-data-volume.js --all        # 分析所有历史文件');
      console.log('  node test-data-volume.js --compare    # 对比最近两次爬取');
      console.log('  node test-data-volume.js --run        # 执行爬取并分析');
    }
  }
}

main().catch(console.error);
