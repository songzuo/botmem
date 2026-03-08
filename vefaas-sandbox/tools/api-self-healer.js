#!/usr/bin/env node
/**
 * API Self-Healer - 自动检测并修复 API Provider 配置
 * 
 * 功能:
 * - 自动检测所有 API Provider 的连通性问题
 * - 识别常见错误类型并尝试自动修复
 * - 支持多种修复策略 (端点修正、密钥轮换、备用配置)
 * - 生成修复报告和建议
 * - 支持持续监控和自动修复模式
 * 
 * 使用方式:
 *   node api-self-healer.js              # 检测并报告问题
 *   node api-self-healer.js --fix        # 自动尝试修复
 *   node api-self-healer.js --dry-run    # 预览修复方案
 *   node api-self-healer.js --watch      # 持续监控模式
 *   node api-self-healer.js --report     # 生成详细报告
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 配置路径
const CONFIG_PATH = path.join(__dirname, '../scripts/cluster-workers.json');
const BACKUP_DIR = path.join(__dirname, '../state/api-backups');

// 常见 API 端点映射
const KNOWN_ENDPOINTS = {
  volcengine: {
    default: 'https://ark.cn-beijing.volces.com/api/v3',
    alternatives: [
      'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      'https://api.volcengine.com/api/v3'
    ]
  },
  minimax: {
    default: 'https://api.minimaxi.com/anthropic',
    alternatives: [
      'https://api.minimax.chat/v1',
      'https://api.minimax.chat/v1/chat/completions',
      'https://api.minimaxi.com/v1'
    ]
  },
  fucheers: {
    default: 'https://api.fucheers.com/v1',
    alternatives: [
      'https://api.fucheers.com/v1/chat/completions'
    ]
  },
  alibaba: {
    default: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    alternatives: [
      'https://dashscope.aliyuncs.com/api/v1'
    ]
  },
  newcli: {
    default: 'https://api.newcli.com/v1',
    alternatives: [
      'https://api.newclaude.com/v1'
    ]
  }
};

// 错误类型定义
const ERROR_TYPES = {
  HTTP_401: {
    name: '认证失败',
    severity: 'critical',
    fixes: ['验证 API Key', '检查密钥格式', '联系 provider 确认密钥状态'],
    autoFixable: false
  },
  HTTP_403: {
    name: '权限不足',
    severity: 'critical',
    fixes: ['检查 API Key 权限', '确认服务已开通', '验证账户状态'],
    autoFixable: false
  },
  HTTP_404: {
    name: '端点未找到',
    severity: 'high',
    fixes: ['检查端点 URL', '尝试备用端点', '确认 API 版本'],
    autoFixable: true
  },
  HTTP_429: {
    name: '速率限制',
    severity: 'medium',
    fixes: ['等待后重试', '降低请求频率', '升级账户配额'],
    autoFixable: false
  },
  HTTP_500: {
    name: '服务器错误',
    severity: 'medium',
    fixes: ['稍后重试', '联系 provider', '切换到备用 provider'],
    autoFixable: false
  },
  ENOTFOUND: {
    name: '域名不存在',
    severity: 'critical',
    fixes: ['检查域名拼写', '确认服务是否下线', '替换 provider'],
    autoFixable: true
  },
  ECONNREFUSED: {
    name: '连接被拒绝',
    severity: 'high',
    fixes: ['检查服务是否运行', '验证端口配置', '检查防火墙'],
    autoFixable: false
  },
  ETIMEDOUT: {
    name: '连接超时',
    severity: 'medium',
    fixes: ['检查网络连接', '增加超时时间', '稍后重试'],
    autoFixable: false
  }
};

class APISelfHealer {
  constructor() {
    this.config = null;
    this.results = [];
    this.fixesApplied = [];
  }

  // 加载配置
  loadConfig() {
    try {
      const content = fs.readFileSync(CONFIG_PATH, 'utf8');
      this.config = JSON.parse(content);
      console.log(`✅ 已加载集群配置：${this.config.name || '未知'}`);
      return true;
    } catch (error) {
      console.error(`❌ 无法加载配置：${error.message}`);
      return false;
    }
  }

  // 备份当前配置
  backupConfig() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `config-${timestamp}.json`);
    
    try {
      if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
      }
      fs.writeFileSync(backupPath, JSON.stringify(this.config, null, 2));
      console.log(`💾 配置已备份到：${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error(`⚠️ 备份失败：${error.message}`);
      return null;
    }
  }

  // 测试 API 连通性
  async testProvider(provider) {
    const result = {
      name: provider.name,
      endpoint: provider.endpoint,
      status: 'unknown',
      latency: null,
      error: null,
      errorCode: null,
      suggestions: []
    };

    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const url = new URL(provider.endpoint);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.request(provider.endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${provider.keys?.[0] || 'test'}`,
          'User-Agent': 'API-Self-Healer/1.0'
        },
        timeout: 10000
      }, (res) => {
        result.latency = Date.now() - startTime;
        result.status = `HTTP ${res.statusCode}`;
        result.errorCode = `HTTP_${res.statusCode}`;
        
        // 收集响应头信息
        if (res.headers['x-ratelimit-remaining']) {
          result.suggestions.push(`速率限制剩余：${res.headers['x-ratelimit-remaining']}`);
        }
        
        resolve(result);
      });

      req.on('error', (error) => {
        result.latency = Date.now() - startTime;
        result.error = error.message;
        result.errorCode = error.code || 'UNKNOWN';
        resolve(result);
      });

      req.on('timeout', () => {
        result.latency = Date.now() - startTime;
        result.error = '请求超时';
        result.errorCode = 'ETIMEDOUT';
        req.destroy();
        resolve(result);
      });

      req.end();
    });
  }

  // 分析错误并提供修复建议
  analyzeError(result) {
    const errorInfo = ERROR_TYPES[result.errorCode];
    
    if (!errorInfo) {
      return {
        severity: 'unknown',
        fixes: ['检查网络配置', '验证 API 端点', '联系技术支持'],
        autoFixable: false
      };
    }

    return {
      severity: errorInfo.severity,
      fixes: errorInfo.fixes,
      autoFixable: errorInfo.autoFixable
    };
  }

  // 尝试自动修复端点问题
  async tryFixEndpoint(provider, result) {
    const knownEndpoints = KNOWN_ENDPOINTS[provider.name];
    if (!knownEndpoints) {
      console.log(`  ℹ️  ${provider.name}: 无已知备用端点`);
      return null;
    }

    console.log(`  🔧 尝试修复 ${provider.name} 的端点问题...`);
    
    // 测试备用端点
    for (const altEndpoint of knownEndpoints.alternatives) {
      if (altEndpoint === provider.endpoint) continue;
      
      console.log(`    测试备用端点：${altEndpoint}`);
      
      const testResult = await this.testProvider({
        ...provider,
        endpoint: altEndpoint
      });
      
      if (!testResult.errorCode || testResult.errorCode.startsWith('HTTP_2')) {
        console.log(`    ✅ 备用端点可用！`);
        return altEndpoint;
      }
    }
    
    console.log(`    ❌ 所有备用端点均不可用`);
    return null;
  }

  // 应用修复
  applyFix(provider, fixType, newValue) {
    const providerConfig = this.config.apiProviders.find(p => p.name === provider.name);
    if (!providerConfig) {
      console.error(`  ❌ 未找到 provider 配置：${provider.name}`);
      return false;
    }

    switch (fixType) {
      case 'endpoint':
        const oldEndpoint = providerConfig.endpoint;
        providerConfig.endpoint = newValue;
        console.log(`  ✅ 端点已更新：${oldEndpoint} → ${newValue}`);
        this.fixesApplied.push({
          provider: provider.name,
          type: 'endpoint',
          old: oldEndpoint,
          new: newValue
        });
        return true;
      
      case 'priority':
        const oldPriority = providerConfig.priority;
        providerConfig.priority = newValue;
        console.log(`  ✅ 优先级已更新：${oldPriority} → ${newValue}`);
        this.fixesApplied.push({
          provider: provider.name,
          type: 'priority',
          old: oldPriority,
          new: newValue
        });
        return true;
      
      default:
        console.error(`  ❌ 未知修复类型：${fixType}`);
        return false;
    }
  }

  // 保存配置
  saveConfig() {
    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 2));
      console.log(`✅ 配置已保存`);
      return true;
    } catch (error) {
      console.error(`❌ 保存配置失败：${error.message}`);
      return false;
    }
  }

  // 生成报告
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalProviders: this.config.apiProviders.length,
      healthyCount: this.results.filter(r => !r.errorCode).length,
      unhealthyCount: this.results.filter(r => r.errorCode).length,
      fixesApplied: this.fixesApplied.length,
      providers: this.results.map(r => ({
        name: r.name,
        status: r.status,
        latency: r.latency,
        error: r.error,
        errorCode: r.errorCode,
        severity: this.analyzeError(r).severity
      }))
    };

    return report;
  }

  // 打印报告
  printReport() {
    const report = this.generateReport();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 API Self-Healer 报告');
    console.log('='.repeat(60));
    console.log(`时间：${new Date(report.timestamp).toLocaleString('zh-CN')}`);
    console.log(`Provider 总数：${report.totalProviders}`);
    console.log(`健康：${report.healthyCount} | 故障：${report.unhealthyCount}`);
    console.log(`已应用修复：${report.fixesApplied}`);
    console.log('='.repeat(60));

    // 健康评分计算
    const healthScore = Math.round((report.healthyCount / report.totalProviders) * 100);
    const scoreEmoji = healthScore >= 80 ? '✅' : healthScore >= 50 ? '⚠️' : '❌';
    console.log(`\n健康评分：${scoreEmoji} ${healthScore}/100`);

    // 详细状态
    console.log('\n📋 Provider 状态详情:');
    console.log('-'.repeat(60));
    
    for (const provider of report.providers) {
      const statusIcon = provider.errorCode ? '❌' : '✅';
      const severity = this.analyzeError({ errorCode: provider.errorCode });
      const severityIcon = severity.severity === 'critical' ? '🔴' : 
                          severity.severity === 'high' ? '🟠' :
                          severity.severity === 'medium' ? '🟡' : '🟢';
      
      console.log(`\n${statusIcon} ${provider.name}`);
      console.log(`   状态：${provider.status || '正常'}`);
      if (provider.latency) console.log(`   延迟：${provider.latency}ms`);
      if (provider.error) console.log(`   错误：${provider.error}`);
      if (provider.errorCode) {
        console.log(`   严重性：${severityIcon} ${severity.severity}`);
        console.log(`   建议：${severity.fixes.join(', ')}`);
      }
    }

    // 修复历史
    if (this.fixesApplied.length > 0) {
      console.log('\n🔧 已应用的修复:');
      console.log('-'.repeat(60));
      for (const fix of this.fixesApplied) {
        console.log(`   ${fix.provider}: ${fix.type} ${fix.old} → ${fix.new}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    
    return report;
  }

  // 主检测流程
  async detect(autoFix = false, dryRun = false) {
    console.log('🔍 开始检测 API Provider...\n');
    
    if (!this.loadConfig()) {
      return null;
    }

    // 备份配置
    if (autoFix && !dryRun) {
      this.backupConfig();
    }

    // 测试所有 provider
    for (const provider of this.config.apiProviders) {
      console.log(`\n📡 测试 ${provider.name}...`);
      const result = await this.testProvider(provider);
      this.results.push(result);
      
      const statusIcon = result.errorCode ? '❌' : '✅';
      console.log(`   ${statusIcon} ${result.status}${result.latency ? ` (${result.latency}ms)` : ''}`);
      if (result.error) {
        console.log(`   错误：${result.error}`);
      }

      // 尝试自动修复
      if (result.errorCode && autoFix) {
        const analysis = this.analyzeError(result);
        
        if (analysis.autoFixable) {
          if (dryRun) {
            console.log(`   🔧 [DRY-RUN] 将尝试修复：${analysis.fixes.join(', ')}`);
          } else {
            // 尝试端点修复
            if (result.errorCode === 'HTTP_404' || result.errorCode === 'ENOTFOUND') {
              const newEndpoint = await this.tryFixEndpoint(provider, result);
              if (newEndpoint && this.applyFix(provider, 'endpoint', newEndpoint)) {
                // 重新测试修复后的端点
                const retest = await this.testProvider({ ...provider, endpoint: newEndpoint });
                if (!retest.errorCode) {
                  console.log(`   ✅ 修复成功！`);
                } else {
                  console.log(`   ⚠️ 修复后仍有问题`);
                }
              }
            }
          }
        } else {
          console.log(`   ⚠️ 无法自动修复：${analysis.fixes.join(', ')}`);
        }
      }
    }

    // 保存配置
    if (autoFix && !dryRun && this.fixesApplied.length > 0) {
      console.log('\n💾 保存修复后的配置...');
      this.saveConfig();
    }

    // 生成并打印报告
    return this.printReport();
  }

  // 持续监控模式
  async watch(interval = 300) {
    console.log(`👁️  启动持续监控模式 (间隔：${interval}秒)\n`);
    
    while (true) {
      console.log(`\n[${new Date().toLocaleTimeString()}] 执行检测...`);
      this.results = [];
      this.fixesApplied = [];
      await this.detect(false, false);
      
      console.log(`\n⏳ ${interval}秒后下次检测... (Ctrl+C 退出)`);
      await new Promise(resolve => setTimeout(resolve, interval * 1000));
    }
  }
}

// CLI 参数解析
async function main() {
  const args = process.argv.slice(2);
  const healer = new APISelfHealer();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
API Self-Healer - 自动检测并修复 API Provider 配置

使用方式:
  node api-self-healer.js [选项]

选项:
  --help, -h       显示帮助信息
  --fix            自动尝试修复检测到的问题
  --dry-run        预览修复方案，不实际修改配置
  --watch [秒]     持续监控模式 (默认间隔：300 秒)
  --report         生成详细 JSON 报告
  --interval <秒>  设置监控间隔 (与 --watch 配合使用)

示例:
  node api-self-healer.js              # 检测并报告问题
  node api-self-healer.js --fix        # 自动尝试修复
  node api-self-healer.js --dry-run    # 预览修复方案
  node api-self-healer.js --watch 600  # 每 10 分钟监控一次
`);
    return;
  }

  if (args.includes('--report')) {
    await healer.detect(false, false);
    const report = healer.generateReport();
    console.log('\n📄 JSON 报告:');
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  if (args.includes('--watch')) {
    const intervalIndex = args.indexOf('--watch') + 1;
    const interval = parseInt(args[intervalIndex]) || 300;
    await healer.watch(interval);
    return;
  }

  const autoFix = args.includes('--fix');
  const dryRun = args.includes('--dry-run');

  await healer.detect(autoFix, dryRun);
}

main().catch(console.error);
