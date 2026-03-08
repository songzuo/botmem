#!/usr/bin/env node

/**
 * API Route Optimizer
 *
 * 智能API路由优化管理器
 *
 * 功能:
 * - 综合测试所有API Provider的性能
 * - 基于延迟、成功率、稳定性计算最佳路由配置
 * - 自动更新集群配置中的优先级
 * - 生成优化建议和报告
 * - 支持持续监控和自动优化
 *
 * 使用方式:
 *   node api-route-optimizer.js                  # 单次分析和优化
 *   node api-route-optimizer.js --analyze        # 仅分析,不修改配置
 *   node api-route-optimizer.js --test           # 详细的性能测试
 *   node api-route-optimizer.js --report         # 查看优化报告
 *   node api-route-optimizer.js --watch [秒]     # 持续监控模式
 *   node api-route-optimizer.js --history        # 查看优化历史
 *   node api-route-optimizer.js --reset          # 重置到默认配置
 */

const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const https = require('https');

// 配置文件路径
const CLUSTER_CONFIG_PATH = '/workspace/projects/workspace/scripts/cluster-workers.json';
const OPTIMIZER_STATE_PATH = '/workspace/projects/workspace/state/api-optimizer-state.json';

// 默认配置
const DEFAULT_CONFIG = {
  testTimeout: 5000,
  testRetries: 3,
  minSuccessRate: 0.8,  // 最低成功率阈值
  weightLatency: 0.5,   // 延迟权重
  weightSuccess: 0.3,   // 成功率权重
  weightStability: 0.2  // 稳定性权重
};

class APIRouteOptimizer {
  constructor(options = {}) {
    this.config = { ...DEFAULT_CONFIG, ...options };
    this.state = { history: [], lastOptimization: null };
    this.providers = [];
  }

  /**
   * 加载集群配置
   */
  async loadClusterConfig() {
    try {
      const content = await fs.readFile(CLUSTER_CONFIG_PATH, 'utf8');
      const config = JSON.parse(content);
      this.providers = config.apiProviders || [];
      console.log(`\n✅ 已加载 ${this.providers.length} 个 API Provider`);
      return true;
    } catch (error) {
      console.error(`❌ 加载集群配置失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 加载优化器状态
   */
  async loadState() {
    try {
      const content = await fs.readFile(OPTIMIZER_STATE_PATH, 'utf8');
      this.state = JSON.parse(content);
    } catch (error) {
      // 状态文件不存在是正常的
      this.state = { history: [], lastOptimization: null };
    }
  }

  /**
   * 保存优化器状态
   */
  async saveState() {
    try {
      await fs.mkdir(path.dirname(OPTIMIZER_STATE_PATH), { recursive: true });
      await fs.writeFile(OPTIMIZER_STATE_PATH, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error(`⚠️  保存状态失败: ${error.message}`);
    }
  }

  /**
   * 执行HTTP请求测试
   */
  async testProvider(provider) {
    const results = {
      name: provider.name,
      endpoint: provider.endpoint,
      attempts: [],
      success: 0,
      failed: 0,
      latencies: [],
      errors: []
    };

    for (let i = 0; i < this.config.testRetries; i++) {
      const start = Date.now();
      try {
        const response = await this.makeRequest(provider.endpoint);
        const latency = Date.now() - start;

        results.attempts.push({
          attempt: i + 1,
          success: true,
          status: response.status,
          latency
        });

        results.success++;
        results.latencies.push(latency);

      } catch (error) {
        const latency = Date.now() - start;
        results.attempts.push({
          attempt: i + 1,
          success: false,
          error: error.message,
          latency
        });

        results.failed++;
        results.errors.push(error.message);
      }

      // 请求之间短暂延迟
      await this.sleep(100);
    }

    // 计算统计数据
    results.successRate = results.success / this.config.testRetries;
    results.avgLatency = results.latencies.length > 0
      ? results.latencies.reduce((a, b) => a + b, 0) / results.latencies.length
      : Infinity;
    results.minLatency = results.latencies.length > 0 ? Math.min(...results.latencies) : Infinity;
    results.maxLatency = results.latencies.length > 0 ? Math.max(...results.latencies) : Infinity;
    results.stability = 1 - (results.failed / this.config.testRetries);

    return results;
  }

  /**
   * 发起HTTP请求
   */
  async makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint);
      const protocol = url.protocol === 'https:' ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'GET',
        timeout: this.config.testTimeout,
        headers: {
          'User-Agent': 'OpenClaw-Route-Optimizer/1.0',
          'Accept': 'application/json'
        }
      };

      const req = protocol.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: data.slice(0, 500) });
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  /**
   * 睡眠函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 计算provider评分
   */
  calculateScore(results) {
    // 归一化延迟 (越小越好)
    const latencyScore = results.avgLatency === Infinity ? 0 : Math.max(0, 1 - results.avgLatency / 2000);

    // 成功率
    const successScore = results.successRate;

    // 稳定性
    const stabilityScore = results.stability;

    // 综合评分
    const score =
      this.config.weightLatency * latencyScore +
      this.config.weightSuccess * successScore +
      this.config.weightStability * stabilityScore;

    return Math.round(score * 100);
  }

  /**
   * 分析所有provider
   */
  async analyze() {
    console.log('\n🔍 开始分析 API Provider...\n');

    const analyses = [];

    for (const provider of this.providers) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`测试: ${provider.name}`);
      console.log(`端点: ${provider.endpoint}`);

      const results = await this.testProvider(provider);
      results.score = this.calculateScore(results);
      results.currentPriority = provider.priority;

      analyses.push(results);

      // 显示结果
      console.log(`\n结果:`);
      console.log(`  ✅ 成功: ${results.success}/${this.config.testRetries}`);
      console.log(`  ❌ 失败: ${results.failed}`);
      console.log(`  📊 成功率: ${(results.successRate * 100).toFixed(1)}%`);
      console.log(`  ⏱️  平均延迟: ${results.avgLatency === Infinity ? 'N/A' : results.avgLatency.toFixed(0)}ms`);
      console.log(`  📈 稳定性: ${(results.stability * 100).toFixed(1)}%`);
      console.log(`  🎯 综合评分: ${results.score}/100`);
      console.log(`  📍 当前优先级: ${results.currentPriority}`);
    }

    return analyses;
  }

  /**
   * 生成优化建议
   */
  generateRecommendations(analyses) {
    const recommendations = [];

    // 1. 识别可用的provider
    const available = analyses.filter(a => a.successRate >= this.config.minSuccessRate);
    const unavailable = analyses.filter(a => a.successRate < this.config.minSuccessRate);

    if (available.length === 0) {
      recommendations.push({
        type: 'critical',
        message: '❌ 所有API Provider均不可用！请检查网络连接和API密钥配置。'
      });
    }

    // 2. 排序推荐
    const sorted = [...available].sort((a, b) => b.score - a.score);
    if (sorted.length > 0) {
      recommendations.push({
        type: 'info',
        message: `🏆 最佳Provider: ${sorted[0].name} (评分: ${sorted[0].score}/100)`
      });

      // 3. 优先级调整建议
      sorted.forEach((a, index) => {
        const suggestedPriority = index + 1;
        if (a.currentPriority !== suggestedPriority) {
          recommendations.push({
            type: 'warning',
            message: `⚡ 建议调整 ${a.name} 优先级: ${a.currentPriority} → ${suggestedPriority}`
          });
        }
      });
    }

    // 4. 不可用provider警告
    unavailable.forEach(a => {
      recommendations.push({
        type: 'error',
        message: `🔴 ${a.name} 不可用 (成功率: ${(a.successRate * 100).toFixed(1)}%), 请检查配置或考虑移除`
      });
    });

    // 5. 稳定性检查
    analyses.forEach(a => {
      if (a.errors.length > 0) {
        const uniqueErrors = [...new Set(a.errors)];
        recommendations.push({
          type: 'info',
          message: `ℹ️  ${a.name} 错误: ${uniqueErrors.join(', ')}`
        });
      }
    });

    return recommendations;
  }

  /**
   * 执行优化
   */
  async optimize(analyses) {
    console.log('\n🔄 开始优化配置...\n');

    const recommendations = this.generateRecommendations(analyses);

    // 显示建议
    console.log('📋 优化建议:\n');
    recommendations.forEach((r, i) => {
      const emoji = r.type === 'critical' ? '🚨' :
                    r.type === 'error' ? '🔴' :
                    r.type === 'warning' ? '⚠️' :
                    r.type === 'info' ? 'ℹ️' : '✅';
      console.log(`${emoji} ${r.message}`);
    });

    // 计算新优先级
    const available = analyses.filter(a => a.successRate >= this.config.minSuccessRate);
    const sorted = [...available].sort((a, b) => b.score - a.score);

    const optimization = {
      timestamp: new Date().toISOString(),
      providers: [],
      recommendations
    };

    // 创建备份
    await this.backupConfig();

    // 读取原始配置
    const content = await fs.readFile(CLUSTER_CONFIG_PATH, 'utf8');
    const config = JSON.parse(content);

    // 更新优先级
    sorted.forEach((a, index) => {
      const provider = config.apiProviders.find(p => p.name === a.name);
      if (provider) {
        const oldPriority = provider.priority;
        const newPriority = index + 1;

        optimization.providers.push({
          name: a.name,
          oldPriority,
          newPriority,
          score: a.score
        });

        provider.priority = newPriority;
      }
    });

    // 保存配置
    await fs.writeFile(CLUSTER_CONFIG_PATH, JSON.stringify(config, null, 2));

    // 更新状态
    this.state.lastOptimization = optimization;
    this.state.history.push(optimization);

    // 保留最近20条历史
    if (this.state.history.length > 20) {
      this.state.history = this.state.history.slice(-20);
    }

    await this.saveState();

    console.log('\n✅ 优化完成!\n');

    return optimization;
  }

  /**
   * 备份配置
   */
  async backupConfig() {
    const backupDir = '/workspace/projects/workspace/state/api-optimizer-backups';
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `cluster-workers-${timestamp}.json`);

    const content = await fs.readFile(CLUSTER_CONFIG_PATH, 'utf8');
    await fs.writeFile(backupPath, content);

    console.log(`💾 已备份配置到: ${backupPath}`);
  }

  /**
   * 显示报告
   */
  showReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 API Route Optimizer 报告');
    console.log('='.repeat(60));

    if (!this.state.lastOptimization) {
      console.log('\n暂无优化记录');
      return;
    }

    const opt = this.state.lastOptimization;

    console.log(`\n上次优化: ${new Date(opt.timestamp).toLocaleString('zh-CN')}`);
    console.log(`\n优化的 Provider:`);
    opt.providers.forEach(p => {
      const arrow = p.newPriority > p.oldPriority ? '⬇️' : '⬆️';
      console.log(`  ${arrow} ${p.name}: ${p.oldPriority} → ${p.newPriority} (评分: ${p.score}/100)`);
    });

    console.log(`\n优化历史: ${this.state.history.length} 条`);
  }

  /**
   * 显示历史
   */
  showHistory() {
    console.log('\n' + '='.repeat(60));
    console.log('📜 优化历史');
    console.log('='.repeat(60));

    if (this.state.history.length === 0) {
      console.log('\n暂无优化记录');
      return;
    }

    this.state.history.forEach((opt, i) => {
      console.log(`\n#${i + 1} ${new Date(opt.timestamp).toLocaleString('zh-CN')}`);
      opt.providers.forEach(p => {
        console.log(`  ${p.name}: ${p.oldPriority} → ${p.newPriority} (评分: ${p.score})`);
      });
    });
  }

  /**
   * 持续监控模式
   */
  async watch(interval = 300) {
    console.log(`\n🔄 持续监控模式启动 (每 ${interval} 秒检查一次)`);
    console.log('按 Ctrl+C 停止\n');

    let count = 0;
    while (true) {
      count++;

      console.log(`\n${'='.repeat(50)}`);
      console.log(`检查 #${count} - ${new Date().toLocaleString('zh-CN')}`);
      console.log('='.repeat(50));

      await this.loadClusterConfig();
      const analyses = await this.analyze();

      const recommendations = this.generateRecommendations(analyses);
      console.log('\n📋 建议:');
      recommendations.forEach(r => console.log(`  ${r.message}`));

      // 检测是否需要优化
      const needsOptimization = recommendations.some(r => r.type === 'warning');
      if (needsOptimization) {
        console.log('\n⚠️  检测到需要优化，正在执行...');
        await this.optimize(analyses);
      }

      console.log(`\n⏳ 下次检查: ${interval} 秒后\n`);

      await this.sleep(interval * 1000);
    }
  }

  /**
   * 重置配置
   */
  async resetConfig() {
    console.log('\n🔄 重置配置到默认优先级...\n');

    // 找到最近的备份
    const backupDir = '/workspace/projects/workspace/state/api-optimizer-backups';
    try {
      const files = await fs.readdir(backupDir);
      const backups = files.filter(f => f.startsWith('cluster-workers-'));

      if (backups.length === 0) {
        console.log('❌ 没有找到备份文件');
        return;
      }

      backups.sort().reverse();
      const latestBackup = backups[0];
      const backupPath = path.join(backupDir, latestBackup);

      console.log(`📂 从备份恢复: ${latestBackup}`);
      const content = await fs.readFile(backupPath, 'utf8');

      await fs.writeFile(CLUSTER_CONFIG_PATH, content);
      console.log('✅ 配置已重置\n');

    } catch (error) {
      console.error(`❌ 重置失败: ${error.message}`);
    }
  }

  /**
   * 主函数
   */
  async main() {
    const args = process.argv.slice(2);

    // 加载状态
    await this.loadState();

    // 解析命令
    const action = args[0] || 'optimize';

    if (action === '--report') {
      this.showReport();
      return;
    }

    if (action === '--history') {
      this.showHistory();
      return;
    }

    if (action === '--reset') {
      await this.resetConfig();
      return;
    }

    if (action === '--watch') {
      const interval = parseInt(args[1]) || 300;
      await this.loadClusterConfig();
      await this.watch(interval);
      return;
    }

    // 加载配置
    const loaded = await this.loadClusterConfig();
    if (!loaded || this.providers.length === 0) {
      console.error('\n❌ 没有找到可用的API Provider');
      process.exit(1);
    }

    // 执行分析
    const analyses = await this.analyze();

    // 仅分析模式
    if (action === '--analyze') {
      console.log('\n📋 建议:\n');
      const recommendations = this.generateRecommendations(analyses);
      recommendations.forEach(r => console.log(`  ${r.message}`));
      return;
    }

    // 详细测试模式
    if (action === '--test') {
      console.log('\n🔬 详细测试模式 - 已在分析中完成\n');
      return;
    }

    // 默认: 执行优化
    await this.optimize(analyses);
  }
}

// 运行
if (require.main === module) {
  const optimizer = new APIRouteOptimizer();
  optimizer.main().catch(error => {
    console.error('\n❌ 错误:', error.message);
    process.exit(1);
  });
}

module.exports = APIRouteOptimizer;
