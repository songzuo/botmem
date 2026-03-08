#!/usr/bin/env node

/**
 * Cost Tracker & Model Usage Analyzer
 * 追踪API调用成本和分析模型使用情况
 * 
 * 用法: node cost-tracker.js [--period day|week|month] [--verbose] [--export]
 * 
 * 选项:
 *   --period    分析周期 (day/week/month), 默认: day
 *   --verbose   显示详细输出
 *   --export    导出JSON报告
 *   --realtime  实时监控模式
 */

const fs = require('fs');
const path = require('path');

// 定价配置 (单位: 每百万token)
const PRICING = {
  volcengine: {
    'Doubao-pro-32k': { input: 0.8, output: 2.0 },
    'Doubao-pro-4k': { input: 0.5, output: 1.2 },
    'default': { input: 1.0, output: 2.5 }
  },
  minimax: {
    'MiniMax-M2.5': { input: 0.3, output: 0.9 },
    'abab6.5s-chat': { input: 0.1, output: 0.3 },
    'default': { input: 0.5, output: 1.5 }
  },
  fucheers: {
    'claude-opus-4-5': { input: 15.0, output: 75.0 },
    'claude-sonnet-4-5': { input: 3.0, output: 15.0 },
    'default': { input: 10.0, output: 50.0 }
  },
  openrouter: {
    'anthropic/claude-3.5-sonnet': { input: 3.0, output: 15.0 },
    'google/gemini-pro-1.5': { input: 1.25, output: 5.0 },
    'default': { input: 2.0, output: 10.0 }
  }
};

// 状态文件路径
const STATE_DIR = path.join(__dirname, '..', 'state');
const COST_FILE = path.join(STATE_DIR, 'api-costs.json');
const USAGE_FILE = path.join(STATE_DIR, 'api-usage.json');

// 确保状态目录存在
function ensureStateDir() {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
}

// 加载历史使用数据
function loadUsageData() {
  ensureStateDir();
  try {
    if (fs.existsSync(USAGE_FILE)) {
      return JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('加载使用数据失败:', e.message);
  }
  return { records: [], lastUpdated: null };
}

// 保存使用数据
function saveUsageData(data) {
  ensureStateDir();
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2));
}

// 记录API调用
function recordCall(provider, model, inputTokens, outputTokens) {
  const data = loadUsageData();
  
  const record = {
    timestamp: new Date().toISOString(),
    provider,
    model: model || 'default',
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens
  };
  
  data.records.push(record);
  
  // 保留30天数据
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  data.records = data.records.filter(r => new Date(r.timestamp).getTime() > thirtyDaysAgo);
  
  saveUsageData(data);
  return record;
}

// 计算成本
function calculateCost(provider, model, inputTokens, outputTokens) {
  const providerPricing = PRICING[provider] || PRICING['openrouter'];
  const modelPricing = providerPricing[model] || providerPricing['default'];
  
  const inputCost = (inputTokens / 1000000) * modelPricing.input;
  const outputCost = (outputTokens / 1000000) * modelPricing.output;
  
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    currency: 'USD'
  };
}

// 分析使用数据
function analyzeUsage(period = 'day') {
  const data = loadUsageData();
  const now = new Date();
  let startTime;
  
  switch (period) {
    case 'day':
      startTime = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startTime = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startTime = new Date(now.setMonth(now.getMonth() - 1));
      break;
    default:
      startTime = new Date(now.setHours(0, 0, 0, 0));
  }
  
  const filteredRecords = data.records.filter(r => 
    new Date(r.timestamp) >= startTime
  );
  
  // 按provider汇总
  const byProvider = {};
  // 按model汇总
  const byModel = {};
  // 按日期汇总
  const byDate = {};
  
  let totalInput = 0;
  let totalOutput = 0;
  let totalCost = 0;
  let callCount = filteredRecords.length;
  
  filteredRecords.forEach(record => {
    const date = record.timestamp.split('T')[0];
    
    // By Provider
    if (!byProvider[record.provider]) {
      byProvider[record.provider] = { calls: 0, input: 0, output: 0, cost: 0 };
    }
    byProvider[record.provider].calls++;
    byProvider[record.provider].input += record.inputTokens;
    byProvider[record.provider].output += record.outputTokens;
    
    // By Model
    const modelKey = `${record.provider}:${record.model}`;
    if (!byModel[modelKey]) {
      byModel[modelKey] = { calls: 0, input: 0, output: 0, cost: 0 };
    }
    byModel[modelKey].calls++;
    byModel[modelKey].input += record.inputTokens;
    byModel[modelKey].output += record.outputTokens;
    
    // By Date
    if (!byDate[date]) {
      byDate[date] = { calls: 0, input: 0, output: 0, cost: 0 };
    }
    byDate[date].calls++;
    byDate[date].input += record.inputTokens;
    byDate[date].output += record.outputTokens;
  });
  
  // 计算成本
  Object.keys(byProvider).forEach(provider => {
    Object.keys(byModel).forEach(modelKey => {
      if (modelKey.startsWith(provider + ':')) {
        const model = modelKey.split(':')[1];
        const m = byModel[modelKey];
        const cost = calculateCost(provider, model, m.input, m.output);
        byModel[modelKey].cost = cost.totalCost;
      }
    });
    
    const p = byProvider[provider];
    const providerName = Object.keys(PRICING).find(k => k === provider) ? provider : 'openrouter';
    const cost = calculateCost(providerName, 'default', p.input, p.output);
    byProvider[provider].cost = cost.totalCost;
  });
  
  Object.keys(byDate).forEach(date => {
    const d = byDate[date];
    totalInput += d.input;
    totalOutput += d.output;
    // 简化: 使用平均成本
    totalCost += (d.input + d.output) / 1000000 * 1.5;
  });
  
  return {
    period,
    startTime: startTime.toISOString(),
    endTime: new Date().toISOString(),
    totalCalls: callCount,
    totalInputTokens: totalInput,
    totalOutputTokens: totalOutput,
    totalTokens: totalInput + totalOutput,
    estimatedCost: totalCost,
    byProvider,
    byModel,
    byDate
  };
}

// 生成报告
function generateReport(analysis, verbose = false) {
  console.log('\n📊 API使用成本分析报告');
  console.log('═'.repeat(50));
  console.log(`📅 周期: ${analysis.period}`);
  console.log(`🕐 时间: ${analysis.startTime.split('T')[0]} ~ ${analysis.endTime.split('T')[0]}`);
  console.log('═'.repeat(50));
  
  console.log(`\n💰 总成本: $${analysis.estimatedCost.toFixed(4)} USD`);
  console.log(`📞 API调用次数: ${analysis.totalCalls}`);
  console.log(`🔤 总Token消耗: ${analysis.totalTokens.toLocaleString()}`);
  console.log(`  └─ 输入: ${analysis.totalInputTokens.toLocaleString()}`);
  console.log(`  └─ 输出: ${analysis.totalOutputTokens.toLocaleString()}`);
  
  if (verbose) {
    console.log('\n📈 按Provider统计:');
    console.log('─'.repeat(50));
    Object.entries(analysis.byProvider).forEach(([provider, stats]) => {
      console.log(`  ${provider}:`);
      console.log(`    调用: ${stats.calls} | 输入: ${stats.input.toLocaleString()} | 输出: ${stats.output.toLocaleString()}`);
      console.log(`    成本: $${stats.cost.toFixed(4)}`);
    });
    
    console.log('\n🤖 按Model统计:');
    console.log('─'.repeat(50));
    Object.entries(analysis.byModel).forEach(([model, stats]) => {
      console.log(`  ${model}:`);
      console.log(`    调用: ${stats.calls} | 成本: $${stats.cost.toFixed(4)}`);
    });
  }
  
  console.log('\n' + '═'.repeat(50));
  
  return analysis;
}

// 导出JSON
function exportJSON(analysis) {
  const exportPath = path.join(STATE_DIR, `cost-report-${analysis.period}-${Date.now()}.json`);
  fs.writeFileSync(exportPath, JSON.stringify(analysis, null, 2));
  console.log(`\n📁 报告已导出: ${exportPath}`);
}

// 模拟记录一些数据 (用于测试)
function seedDemoData() {
  const data = loadUsageData();
  if (data.records.length > 0) return; // 已有数据
  
  const providers = ['volcengine', 'minimax', 'fucheers'];
  const models = {
    volcengine: ['Doubao-pro-32k', 'Doubao-pro-4k'],
    minimax: ['MiniMax-M2.5', 'abab6.5s-chat'],
    fucheers: ['claude-opus-4-5', 'claude-sonnet-4-5']
  };
  
  // 生成过去7天的模拟数据
  for (let day = 0; day < 7; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    
    for (let i = 0; i < 10; i++) {
      const provider = providers[Math.floor(Math.random() * providers.length)];
      const model = models[provider][Math.floor(Math.random() * models[provider].length)];
      const inputTokens = Math.floor(Math.random() * 50000) + 1000;
      const outputTokens = Math.floor(Math.random() * 30000) + 500;
      
      const record = {
        timestamp: date.toISOString(),
        provider,
        model,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens
      };
      
      data.records.push(record);
    }
  }
  
  saveUsageData(data);
  console.log('✓ 已生成演示数据');
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const period = args.includes('--period=week') ? 'week' : 
                 args.includes('--period=month') ? 'month' : 'day';
  const verbose = args.includes('--verbose') || args.includes('-v');
  const export_ = args.includes('--export') || args.includes('-e');
  const demo = args.includes('--demo');
  const record = args.includes('--record');
  
  if (demo) {
    seedDemoData();
    return;
  }
  
  if (record) {
    // 记录一次调用示例
    const record_ = recordCall('volcengine', 'Doubao-pro-32k', 5000, 2000);
    console.log('✓ 已记录:', record_);
    return;
  }
  
  const analysis = analyzeUsage(period);
  generateReport(analysis, verbose);
  
  if (export_) {
    exportJSON(analysis);
  }
}

// 导出模块
module.exports = {
  recordCall,
  calculateCost,
  analyzeUsage,
  loadUsageData,
  saveUsageData,
  PRICING
};

if (require.main === module) {
  main();
}
