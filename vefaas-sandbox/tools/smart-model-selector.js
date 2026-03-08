#!/usr/bin/env node

/**
 * Smart Model Selector - 智能模型选择器
 * 根据任务类型、成本约束和性能需求自动推荐最佳模型
 * 
 * 用法: node smart-model-selector.js [选项]
 * 
 * 选项:
 *   --task TYPE      任务类型 (coding|reasoning|creative|fast|balanced|default)
 *   --budget N       预算限制 (美元/月)
 *   --latency N      最大延迟 (毫秒)
 *   --tokens N       预期Token数量
 *   --verbose        显示详细信息
 *   --list           列出所有可用模型
 *   --recommend      输出推荐结果
 * 
 * 示例:
 *   node smart-model-selector.js --task=coding --recommend
 *   node smart-model-selector.js --budget=50 --latency=2000 --recommend
 *   node smart-model-selector.js --list
 */

const fs = require('fs');
const path = require('path');

// 模型数据库
const MODEL_DATABASE = {
  // Claude 系列 (通过 volcengine)
  'claude-sonnet-4-20250514': {
    name: 'Claude Sonnet 4',
    provider: 'volcengine',
    context: 200000,
    strengths: ['coding', 'reasoning', 'balanced'],
    costPer1M: { input: 3, output: 15 },
    latency: 'medium',
    capabilities: ['function_calling', 'vision', 'analysis']
  },
  'claude-3-5-sonnet-20241022': {
    name: 'Claude 3.5 Sonnet',
    provider: 'volcengine',
    context: 200000,
    strengths: ['coding', 'reasoning', 'balanced'],
    costPer1M: { input: 3, output: 15 },
    latency: 'medium',
    capabilities: ['function_calling', 'vision', 'analysis']
  },
  'claude-3-opus-20240229': {
    name: 'Claude 3 Opus',
    provider: 'volcengine',
    context: 200000,
    strengths: ['reasoning', 'creative', 'analysis'],
    costPer1M: { input: 15, output: 75 },
    latency: 'slow',
    capabilities: ['function_calling', 'vision', 'analysis']
  },
  'claude-3-haiku-20240307': {
    name: 'Claude 3 Haiku',
    provider: 'volcengine',
    context: 200000,
    strengths: ['fast', 'simple'],
    costPer1M: { input: 0.25, output: 1.25 },
    latency: 'fast',
    capabilities: ['function_calling', 'vision']
  },
  
  // MiniMax 模型
  'abab6.5s-chat': {
    name: 'MiniMax abab6.5s',
    provider: 'minimax',
    context: 245760,
    strengths: ['fast', 'balanced', 'coding'],
    costPer1M: { input: 0.5, output: 1 },
    latency: 'fast',
    capabilities: ['function_calling']
  },
  'abab6.5g-chat': {
    name: 'MiniMax abab6.5g',
    provider: 'minimax',
    context: 245760,
    strengths: ['reasoning', 'balanced'],
    costPer1M: { input: 1, output: 2 },
    latency: 'medium',
    capabilities: ['function_calling']
  },
  
  // 默认/备用
  'default': {
    name: 'Default Model',
    provider: 'volcengine',
    context: 100000,
    strengths: ['balanced'],
    costPer1M: { input: 1.5, output: 5 },
    latency: 'medium',
    capabilities: ['function_calling']
  }
};

// 任务类型配置
const TASK_PROFILES = {
  coding: {
    preferredStrengths: ['coding'],
    maxLatency: 5000,
    minContext: 50000,
    priority: ['capabilities', 'cost', 'latency'],
    weights: { capabilities: 0.4, cost: 0.3, latency: 0.3 }
  },
  reasoning: {
    preferredStrengths: ['reasoning', 'analysis'],
    maxLatency: 10000,
    minContext: 100000,
    priority: ['capabilities', 'latency', 'cost'],
    weights: { capabilities: 0.35, latency: 0.35, cost: 0.3 }
  },
  creative: {
    preferredStrengths: ['creative'],
    maxLatency: 8000,
    minContext: 50000,
    priority: ['latency', 'cost', 'capabilities'],
    weights: { latency: 0.4, cost: 0.3, capabilities: 0.3 }
  },
  fast: {
    preferredStrengths: ['fast'],
    maxLatency: 3000,
    minContext: 30000,
    priority: ['latency', 'cost', 'capabilities'],
    weights: { latency: 0.5, cost: 0.3, capabilities: 0.2 }
  },
  balanced: {
    preferredStrengths: ['balanced'],
    maxLatency: 5000,
    minContext: 50000,
    priority: ['cost', 'latency', 'capabilities'],
    weights: { cost: 0.35, latency: 0.35, capabilities: 0.3 }
  },
  default: {
    preferredStrengths: ['balanced', 'coding'],
    maxLatency: 5000,
    minContext: 50000,
    priority: ['cost', 'latency', 'capabilities'],
    weights: { cost: 0.4, latency: 0.3, capabilities: 0.3 }
  }
};

// 加载集群配置获取可用Providers
function loadClusterConfig() {
  const configPath = path.join(__dirname, '..', 'scripts', 'cluster-workers.json');
  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('无法加载集群配置:', error.message);
    return null;
  }
}

// 计算单个模型得分
function scoreModel(modelId, model, options) {
  const profile = TASK_PROFILES[options.task] || TASK_PROFILES.default;
  let score = 0;
  const reasons = [];
  
  // 1. 能力匹配评分 (0-40分)
  const hasRequiredCapability = model.strengths.some(s => 
    profile.preferredStrengths.includes(s)
  );
  if (hasRequiredCapability) {
    score += 30;
    reasons.push(`✓ 匹配任务类型: ${model.strengths.join(', ')}`);
  }
  
  // 额外能力加分
  if (model.capabilities && model.capabilities.includes('function_calling')) {
    score += 10;
    reasons.push('✓ 支持 function calling');
  }
  
  // 2. 延迟评分 (0-30分)
  const latencyScore = { fast: 30, medium: 20, slow: 10 };
  const latencyPenalty = latencyScore[model.latency] || 15;
  
  if (options.maxLatency && latencyPenalty < 20) {
    // 如果用户有严格延迟要求，低评分
    score += latencyPenalty * 0.5;
  } else {
    score += latencyPenalty;
  }
  reasons.push(`延迟等级: ${model.latency}`);
  
  // 3. 成本评分 (0-30分)
  if (options.budget || options.tokens) {
    const inputCost = model.costPer1M?.input || 1;
    const outputCost = model.costPer1M?.output || 3;
    const estimatedCost = ((inputCost * (options.tokens || 1000)) / 1000000) * 2; // 简化估算
    
    if (options.budget && estimatedCost > options.budget) {
      score -= 20;
      reasons.push(`⚠ 超出预算: $${estimatedCost.toFixed(2)} > $${options.budget}`);
    } else if (estimatedCost < 0.1) {
      score += 30;
      reasons.push(`✓ 低成本: ~$${estimatedCost.toFixed(4)}`);
    } else if (estimatedCost < 1) {
      score += 20;
      reasons.push(`✓ 中等成本: ~$${estimatedCost.toFixed(2)}`);
    } else {
      score += 10;
      reasons.push(`成本: ~$${estimatedCost.toFixed(2)}`);
    }
  } else {
    // 默认成本评分 - 便宜优先
    const avgCost = (model.costPer1M?.input || 1) + (model.costPer1M?.output || 3) / 2;
    if (avgCost < 1) score += 30;
    else if (avgCost < 5) score += 20;
    else if (avgCost < 20) score += 10;
  }
  
  // 4. Context 大小评分 (0-10分)
  if (model.context >= profile.minContext) {
    score += 10;
    reasons.push(`✓ Context: ${(model.context / 1000)}K`);
  }
  
  return { score, reasons };
}

// 获取推荐模型
function getRecommendations(options) {
  const profile = TASK_PROFILES[options.task] || TASK_PROFILES.default;
  const results = [];
  
  for (const [modelId, model] of Object.entries(MODEL_DATABASE)) {
    if (modelId === 'default') continue; // 跳过默认
    
    const { score, reasons } = scoreModel(modelId, model, options);
    
    results.push({
      modelId,
      model,
      score: Math.round(score),
      reasons
    });
  }
  
  // 排序并返回前3个
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 3);
}

// 格式化输出
function formatRecommendations(recommendations, options) {
  console.log('\n🎯 模型推荐结果');
  console.log('═'.repeat(60));
  console.log(`任务类型: ${options.task || 'default'}`);
  if (options.budget) console.log(`预算限制: $${options.budget}/月`);
  if (options.maxLatency) console.log(`最大延迟: ${options.maxLatency}ms`);
  if (options.tokens) console.log(`预期Token: ${options.tokens}`);
  console.log('═'.repeat(60));
  
  recommendations.forEach((r, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
    console.log(`\n${medal} ${r.model.name} (${r.modelId})`);
    console.log(`   Provider: ${r.model.provider}`);
    console.log(`   Context: ${(r.model.context / 1000)}K tokens`);
    console.log(`   成本: $${r.model.costPer1M.input}/1M input, $${r.model.costPer1M.output}/1M output`);
    console.log(`   综合评分: ${r.score}/100`);
    console.log(`   优势: ${r.model.strengths.join(', ')}`);
    console.log(`   能力: ${r.model.capabilities?.join(', ') || 'basic'}`);
    if (options.verbose) {
      r.reasons.forEach(reason => console.log(`   ${reason}`));
    }
  });
  
  console.log('\n' + '═'.repeat(60));
  console.log(`\n✅ 推荐: ${recommendations[0]?.model.name}`);
  console.log(`📝 模型ID: ${recommendations[0]?.modelId}`);
  console.log(`💰 预计成本: $${((recommendations[0]?.model.costPer1M.input + recommendations[0]?.model.costPer1M.output) * (options.tokens || 1000) / 1000000).toFixed(4)}`);
  
  return recommendations[0];
}

// 列出所有模型
function listAllModels() {
  console.log('\n📋 可用模型列表');
  console.log('═'.repeat(80));
  console.log('模型ID'.padEnd(35) + 'Provider'.padEnd(15) + 'Context'.padEnd(12) + '成本(Input)'.padEnd(12) + '优势');
  console.log('─'.repeat(80));
  
  for (const [modelId, model] of Object.entries(MODEL_DATABASE)) {
    if (modelId === 'default') continue;
    const cost = `$${model.costPer1M?.input || '?'}/1M`;
    console.log(
      modelId.padEnd(35) + 
      model.provider.padEnd(15) + 
      `${(model.context / 1000)}K`.padEnd(12) + 
      cost.padEnd(12) + 
      model.strengths.join(', ')
    );
  }
  
  console.log('─'.repeat(80));
  console.log('\n💡 使用 --task=coding|reasoning|creative|fast|balanced 获取推荐\n');
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const options = {
    task: 'default',
    budget: null,
    maxLatency: null,
    tokens: null,
    verbose: false,
    list: false,
    recommend: false
  };
  
  // 解析参数
  for (const arg of args) {
    if (arg.startsWith('--task=')) options.task = arg.split('=')[1];
    else if (arg.startsWith('--budget=')) options.budget = parseFloat(arg.split('=')[1]);
    else if (arg.startsWith('--latency=')) options.maxLatency = parseInt(arg.split('=')[1]);
    else if (arg.startsWith('--tokens=')) options.tokens = parseInt(arg.split('=')[1]);
    else if (arg === '--verbose' || arg === '-v') options.verbose = true;
    else if (arg === '--list' || arg === '-l') options.list = true;
    else if (arg === '--recommend' || arg === '-r') options.recommend = true;
  }
  
  // 验证任务类型
  if (!TASK_PROFILES[options.task]) {
    console.error(`❌ 未知任务类型: ${options.task}`);
    console.log(`可用类型: ${Object.keys(TASK_PROFILES).join(', ')}`);
    process.exit(1);
  }
  
  if (options.list) {
    listAllModels();
    return;
  }
  
  if (options.recommend || args.length === 0) {
    const recommendations = getRecommendations(options);
    formatRecommendations(recommendations, options);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { 
  MODEL_DATABASE, 
  TASK_PROFILES, 
  getRecommendations, 
  scoreModel 
};
