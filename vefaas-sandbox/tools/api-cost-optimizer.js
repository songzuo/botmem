#!/usr/bin/env node

/**
 * API Cost Optimizer - 智能API成本分析与优化工具
 * 
 * 功能：
 * 1. 分析历史API使用数据
 * 2. 计算各模型真实成本
 * 3. 识别成本优化机会
 * 4. 预测未来成本趋势
 * 5. 生成成本优化报告
 * 
 * 使用方式：
 * node api-cost-optimizer.js --analyze      # 分析当前成本
 * node api-cost-optimizer.js --optimize      # 生成优化建议
 * node api-cost-optimizer.js --predict       # 预测未来成本
 * node api-cost-optimizer.js --report       # 生成完整报告
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = '/workspace/projects/workspace/state';
const API_USAGE_FILE = path.join(STATE_DIR, 'api-usage.json');
const COST_OUTPUT_FILE = path.join(STATE_DIR, 'api-cost-optimization.json');

// 模型定价 (假设价格，实际应从配置读取)
const MODEL_PRICING = {
  // input/output 价格 ($/1M tokens)
  'volcengine': {
    'Doubao-pro-32k': { input: 1.0, output: 3.0 },
    'Doubao-pro-4k': { input: 0.3, output: 0.6 }
  },
  'minimax': {
    'MiniMax-M2.5': { input: 0.8, output: 2.0 },
    'abab6.5s-chat': { input: 0.1, output: 0.3 }
  },
  'fucheers': {
    'claude-opus-4-5': { input: 3.0, output: 15.0 },
    'claude-sonnet-4-5': { input: 3.0, output: 15.0 }
  }
};

// 可以替换的模型映射 (更便宜但能力相近)
const MODEL_ALTERNATIVES = {
  'claude-opus-4-5': { model: 'claude-sonnet-4-5', savings: 0 },
  'claude-sonnet-4-5': { model: 'MiniMax-M2.5', savings: 0.6 },
  'MiniMax-M2.5': { model: 'abab6.5s-chat', savings: 0.75 },
  'Doubao-pro-32k': { model: 'Doubao-pro-4k', savings: 0.7 }
};

class APICostOptimizer {
  constructor() {
    this.usageData = null;
    this.analysis = null;
  }

  loadUsageData() {
    try {
      if (fs.existsSync(API_USAGE_FILE)) {
        const data = fs.readFileSync(API_USAGE_FILE, 'utf8');
        this.usageData = JSON.parse(data);
        return true;
      }
    } catch (e) {
      console.error('加载使用数据失败:', e.message);
    }
    return false;
  }

  calculateCost(tokens, pricing) {
    if (!pricing) return 0;
    const inputCost = (tokens.inputTokens / 1000000) * pricing.input;
    const outputCost = (tokens.outputTokens / 1000000) * pricing.output;
    return inputCost + outputCost;
  }

  analyze() {
    if (!this.loadUsageData()) {
      console.log('📊 无使用数据，使用模拟数据演示');
      this.usageData = this.generateDemoData();
    }

    const byProvider = {};
    const byModel = {};
    let totalCost = 0;

    for (const record of this.usageData.records) {
      const provider = record.provider;
      const model = record.model;
      
      // 按 Provider 统计
      if (!byProvider[provider]) {
        byProvider[provider] = { 
          inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: 0, requests: 0 
        };
      }
      
      const pricing = MODEL_PRICING[provider]?.[model];
      const cost = this.calculateCost(record, pricing);
      
      byProvider[provider].inputTokens += record.inputTokens;
      byProvider[provider].outputTokens += record.outputTokens;
      byProvider[provider].totalTokens += record.totalTokens;
      byProvider[provider].cost += cost;
      byProvider[provider].requests++;

      // 按 Model 统计
      const modelKey = `${provider}:${model}`;
      if (!byModel[modelKey]) {
        byModel[modelKey] = { 
          provider, model,
          inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: 0, requests: 0 
        };
      }
      byModel[modelKey].inputTokens += record.inputTokens;
      byModel[modelKey].outputTokens += record.outputTokens;
      byModel[modelKey].totalTokens += record.totalTokens;
      byModel[modelKey].cost += cost;
      byModel[modelKey].requests++;

      totalCost += cost;
    }

    this.analysis = {
      totalCost,
      byProvider,
      byModel,
      recordsCount: this.usageData.records.length
    };

    return this.analysis;
  }

  generateDemoData() {
    // 生成演示数据
    const records = [];
    const models = [
      { provider: 'volcengine', model: 'Doubao-pro-32k' },
      { provider: 'minimax', model: 'MiniMax-M2.5' },
      { provider: 'fucheers', model: 'claude-opus-4-5' }
    ];

    for (let i = 0; i < 50; i++) {
      const m = models[Math.floor(Math.random() * models.length)];
      records.push({
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 3600000).toISOString(),
        provider: m.provider,
        model: m.model,
        inputTokens: Math.floor(10000 + Math.random() * 40000),
        outputTokens: Math.floor(5000 + Math.random() * 25000),
        totalTokens: 0
      });
      records[records.length - 1].totalTokens = 
        records[records.length - 1].inputTokens + records[records.length - 1].outputTokens;
    }

    return { records };
  }

  findOptimizations() {
    if (!this.analysis) this.analyze();

    const optimizations = [];
    
    // 1. 找出高成本模型
    const highCostModels = Object.values(this.analysis.byModel)
      .filter(m => m.cost > 1)
      .sort((a, b) => b.cost - a.cost);

    for (const model of highCostModels) {
      const alt = MODEL_ALTERNATIVES[model.model];
      if (alt) {
        const potentialSavings = model.cost * alt.savings;
        optimizations.push({
          type: 'model_switch',
          from: model.model,
          to: alt.model,
          currentCost: model.cost,
          potentialSavings: potentialSavings,
          savingsPercent: Math.round(alt.savings * 100),
          reason: `切换到 ${alt.model} 可节省约 ${Math.round(alt.savings * 100)}% 成本`
        });
      }
    }

    // 2. 找出未被充分使用的低成本模型
    const providerUsage = this.analysis.byProvider;
    const minimaxCost = providerUsage.minimax?.cost || 0;
    const fucheersCost = providerUsage.fucheers?.cost || 0;

    if (fucheersCost > minimaxCost * 2) {
      optimizations.push({
        type: 'provider_switch',
        from: 'fucheers',
        to: 'minimax',
        currentCost: fucheersCost,
        potentialSavings: fucheersCost * 0.5,
        savingsPercent: 50,
        reason: 'fucheers 成本较高，可考虑迁移到 minimax'
      });
    }

    return optimizations;
  }

  predictCost(days = 30) {
    if (!this.analysis) this.analyze();

    const dailyAvg = this.analysis.totalCost / 7; // 基于7天数据
    const trend = this.calculateTrend();
    
    return {
      dailyAverage: dailyAvg,
      predictedMonthly: dailyAvg * days,
      predictedWeekly: dailyAvg * 7,
      trend: trend, // 'increasing', 'decreasing', 'stable'
      confidence: 'medium'
    };
  }

  calculateTrend() {
    // 简化趋势计算
    if (!this.usageData?.records?.length) return 'stable';
    
    const recent = this.usageData.records.slice(-10);
    const older = this.usageData.records.slice(-20, -10);
    
    if (recent.length < 2 || older.length < 2) return 'stable';
    
    const recentAvg = recent.reduce((s, r) => s + r.totalTokens, 0) / recent.length;
    const olderAvg = older.reduce((s, r) => s + r.totalTokens, 0) / older.length;
    
    if (recentAvg > olderAvg * 1.1) return 'increasing';
    if (recentAvg < olderAvg * 0.9) return 'decreasing';
    return 'stable';
  }

  generateReport() {
    if (!this.analysis) this.analyze();
    
    const optimizations = this.findOptimizations();
    const prediction = this.predictCost();

    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalCost: this.analysis.totalCost.toFixed(2),
        totalRequests: this.analysis.recordsCount,
        avgCostPerRequest: (this.analysis.totalCost / this.analysis.recordsCount).toFixed(4)
      },
      byProvider: this.analysis.byProvider,
      byModel: this.analysis.byModel,
      optimizations: optimizations,
      prediction: prediction,
      recommendations: this.generateRecommendations(optimizations, prediction)
    };

    // 保存报告
    fs.writeFileSync(COST_OUTPUT_FILE, JSON.stringify(report, null, 2));
    
    return report;
  }

  generateRecommendations(optimizations, prediction) {
    const recommendations = [];

    if (optimizations.length > 0) {
      const totalPotentialSavings = optimizations.reduce((s, o) => s + o.potentialSavings, 0);
      recommendations.push({
        priority: 'high',
        text: `发现 ${optimizations.length} 个成本优化机会，预计可节省 $${totalPotentialSavings.toFixed(2)}`
      });
    }

    if (prediction.trend === 'increasing') {
      recommendations.push({
        priority: 'medium',
        text: '使用量呈上升趋势，建议设置预算告警'
      });
    }

    recommendations.push({
      priority: 'low',
      text: '建议定期运行此分析，持续优化成本'
    });

    return recommendations;
  }

  printAnalysis() {
    if (!this.analysis) this.analyze();

    console.log('\n📊 API 成本分析');
    console.log('═'.repeat(50));
    console.log(`总成本: $${this.analysis.totalCost.toFixed(2)}`);
    console.log(`总请求数: ${this.analysis.recordsCount}`);
    console.log(`平均每请求: $${(this.analysis.totalCost / this.analysis.recordsCount).toFixed(4)}`);
    
    console.log('\n📈 按 Provider 分布:');
    for (const [provider, data] of Object.entries(this.analysis.byProvider)) {
      const percent = ((data.cost / this.analysis.totalCost) * 100).toFixed(1);
      console.log(`  ${provider}: $${data.cost.toFixed(2)} (${percent}%, ${data.requests}次请求)`);
    }

    console.log('\n🔍 按 Model 分布 (Top 5):');
    const sortedModels = Object.values(this.analysis.byModel)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);
    
    for (const model of sortedModels) {
      console.log(`  ${model.model}: $${model.cost.toFixed(2)}`);
    }
  }

  printOptimizations() {
    const optimizations = this.findOptimizations();
    
    console.log('\n💡 成本优化建议');
    console.log('═'.repeat(50));
    
    if (optimizations.length === 0) {
      console.log('✅ 未发现明显的优化机会');
      return;
    }

    for (const opt of optimizations) {
      console.log(`\n${opt.type === 'model_switch' ? '🔄' : '➡️'} ${opt.reason}`);
      console.log(`   当前成本: $${opt.currentCost.toFixed(2)}`);
      console.log(`   预计节省: $${opt.potentialSavings.toFixed(2)} (${opt.savingsPercent}%)`);
    }

    const totalSavings = optimizations.reduce((s, o) => s + o.potentialSavings, 0);
    console.log(`\n💰 总潜在节省: $${totalSavings.toFixed(2)}`);
  }

  printPrediction() {
    const prediction = this.predictCost();
    
    console.log('\n🔮 成本预测');
    console.log('═'.repeat(50));
    console.log(`日均成本: $${prediction.dailyAverage.toFixed(2)}`);
    console.log(`周预测: $${prediction.predictedWeekly.toFixed(2)}`);
    console.log(`月预测: $${prediction.predictedMonthly.toFixed(2)}`);
    console.log(`趋势: ${prediction.trend === 'increasing' ? '📈 上升' : prediction.trend === 'decreasing' ? '📉 下降' : '➡️ 稳定'}`);
  }

  printReport() {
    const report = this.generateReport();
    
    console.log('\n📋 完整成本报告');
    console.log('═'.repeat(50));
    
    this.printAnalysis();
    this.printOptimizations();
    this.printPrediction();

    console.log('\n📌 建议:');
    for (const rec of report.recommendations) {
      const icon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
      console.log(`  ${icon} ${rec.text}`);
    }

    console.log(`\n📁 报告已保存到: ${COST_OUTPUT_FILE}`);
  }
}

// CLI 入口
const args = process.argv.slice(2);
const optimizer = new APICostOptimizer();

if (args.includes('--analyze')) {
  optimizer.analyze();
  optimizer.printAnalysis();
} else if (args.includes('--optimize')) {
  optimizer.analyze();
  optimizer.printOptimizations();
} else if (args.includes('--predict')) {
  optimizer.analyze();
  optimizer.printPrediction();
} else if (args.includes('--report')) {
  optimizer.printReport();
} else {
  console.log(`
API Cost Optimizer - 智能API成本分析与优化工具

使用方式:
  node api-cost-optimizer.js --analyze     分析当前成本
  node api-cost-optimizer.js --optimize    生成优化建议
  node api-cost-optimizer.js --predict     预测未来成本
  node api-cost-optimizer.js --report      生成完整报告

示例:
  node api-cost-optimizer.js --report
  `);
}
