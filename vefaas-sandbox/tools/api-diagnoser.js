#!/usr/bin/env node

/**
 * API Provider Auto-Diagnosis & Repair Tool
 * 自动诊断API Provider问题并提供修复建议
 * 
 * Usage:
 *   node api-diagnoser.js              # 诊断所有API
 *   node api-diagnoser.js --fix        # 自动修复已知问题
 *   node api-diagnoser.js --provider=minimax  # 诊断特定provider
 *   node api-diagnoser.js --watch      # 持续监控模式
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

const configPath = path.join(__dirname, '../scripts/cluster-workers.json');
const stateDir = path.join(__dirname, '../state');

// Known API endpoints to test
const knownEndpoints = {
  volcengine: [
    { url: 'https://ark.cn-beijing.volces.com/api/v3', name: 'Volcengine API' }
  ],
  minimax: [
    { url: 'https://api.minimaxi.com/anthropic', name: 'MiniMax API' },
    { url: 'https://api.minimax.chat/v1', name: 'MiniMax Chat API' }
  ],
  fucheers: [
    { url: 'https://api.fucheers.com/v1', name: 'Fucheers API' }
  ],
  alibaba: [
    { url: 'https://dashscope.aliyuncs.com/api/v1', name: 'Alibaba Dashscope' }
  ],
  newcli: [
    { url: 'https://aws.newcli.com/api/v1', name: 'NewCLI AWS' }
  ]
};

// Error pattern analysis
const errorPatterns = {
  'ENOTFOUND': { type: 'DNS_ERROR', severity: 'high', fix: '检查域名是否正确或服务是否已下线' },
  'ECONNREFUSED': { type: 'CONNECTION_REFUSED', severity: 'high', fix: '服务可能宕机，检查端口和防火墙' },
  'ETIMEDOUT': { type: 'TIMEOUT', severity: 'medium', fix: '网络延迟高或服务响应慢' },
  'HTTP_401': { type: 'AUTH_ERROR', severity: 'high', fix: 'API Key无效或已过期' },
  'HTTP_403': { type: 'FORBIDDEN', severity: 'high', fix: '权限不足，检查API Key权限或IP白名单' },
  'HTTP_404': { type: 'NOT_FOUND', severity: 'medium', fix: '端点路径错误，检查API版本和端点配置' },
  'HTTP_429': { type: 'RATE_LIMIT', severity: 'medium', fix: '请求超限，等待后重试或升级套餐' },
  'HTTP_500': { type: 'SERVER_ERROR', severity: 'medium', fix: '服务端错误，通常是临时性问题' },
  'HTTP_502': { type: 'BAD_GATEWAY', severity: 'medium', fix: '网关错误，服务可能正在重启' },
  'HTTP_503': { type: 'SERVICE_UNAVAILABLE', severity: 'high', fix: '服务不可用，可能在维护中' },
  'NO_KEY': { type: 'MISSING_CONFIG', severity: 'high', fix: '未配置API Key，需要在配置文件中添加' }
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}`);
  log(`  ${title}`, 'cyan');
  console.log('='.repeat(60) + colors.reset);
}

function logSubsection(title) {
  console.log(`\n${colors.yellow}▶ ${title}${colors.reset}`);
}

function parseError(error) {
  if (error.code) return error.code;
  if (error.message?.includes('ENOTFOUND')) return 'ENOTFOUND';
  if (error.message?.includes('ECONNREFUSED')) return 'ECONNREFUSED';
  if (error.message?.includes('ETIMEDOUT')) return 'ETIMEDOUT';
  return 'UNKNOWN';
}

async function probeEndpoint(url, timeout = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, { timeout }, (res) => {
      const latency = Date.now() - startTime;
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: `HTTP_${res.statusCode}`,
          latency,
          statusCode: res.statusCode,
          data: data.substring(0, 500)
        });
      });
    });
    
    req.on('error', (error) => {
      const errorType = parseError(error);
      resolve({
        status: errorType,
        latency: null,
        error: error.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 'ETIMEDOUT',
        latency: null,
        error: 'Request timeout'
      });
    });
  });
}

function analyzeError(status, errorMsg) {
  // Check for HTTP status codes
  if (status.startsWith('HTTP_')) {
    const code = status;
    return errorPatterns[code] || { type: 'HTTP_ERROR', severity: 'unknown', fix: '未知HTTP错误' };
  }
  
  // Check for network errors
  return errorPatterns[status] || { type: 'UNKNOWN', severity: 'unknown', fix: '未知错误: ' + errorMsg };
}

function getFixRecommendation(provider, errorInfo) {
  const recommendations = {
    volcengine: [
      '确认endpoint: https://ark.cn-beijing.volces.com/api/v3',
      '检查API Key是否有效',
      '确认地域选择正确'
    ],
    minimax: [
      '尝试endpoint: https://api.minimax.chat/v1',
      '检查模型名称是否正确',
      '确认API Key有足够余额'
    ],
    fucheers: [
      '⚠️ 域名 fucheers.com 可能已下线',
      '考虑替换为其他provider'
    ],
    alibaba: [
      '确认endpoint: https://dashscope.aliyuncs.com/api/v1',
      '检查阿里云账号状态',
      '确认已开通百炼服务'
    ],
    newcli: [
      '检查AWS区域配置',
      '确认API Key权限',
      '检查是否需要IP白名单'
    ]
  };
  
  return recommendations[provider] || ['检查provider文档', '联系provider支持'];
}

async function diagnoseProvider(provider, endpoints) {
  logSubsection(`${provider.toUpperCase()} 诊断中...`);
  
  const results = [];
  
  for (const endpoint of endpoints) {
    log(`  测试: ${endpoint.url}`, 'gray');
    const result = await probeEndpoint(endpoint.url);
    
    const errorInfo = analyzeError(result.status, result.error || '');
    
    results.push({
      provider,
      endpoint: endpoint.url,
      ...result,
      analysis: errorInfo
    });
    
    if (result.status.startsWith('HTTP_2') || result.status === 'OK') {
      log(`    ✅ ${result.status} (${result.latency}ms)`, 'green');
    } else {
      log(`    ❌ ${result.status}`, 'red');
      if (errorInfo.fix) {
        log(`       💡 ${errorInfo.fix}`, 'yellow');
      }
    }
  }
  
  return results;
}

function generateReport(allResults) {
  logSection('📊 诊断报告');
  
  const providerStats = {};
  const issues = [];
  
  for (const result of allResults) {
    if (!providerStats[result.provider]) {
      providerStats[result.provider] = { ok: 0, error: 0, endpoints: [] };
    }
    
    providerStats[result.provider].endpoints.push(result);
    
    if (result.status.startsWith('HTTP_2') || result.status === 'OK') {
      providerStats[result.provider].ok++;
    } else {
      providerStats[result.provider].error++;
      issues.push(result);
    }
  }
  
  // Summary
  log('\n📈 Provider 状态汇总:', 'cyan');
  for (const [provider, stats] of Object.entries(providerStats)) {
    const status = stats.error === 0 ? '✅' : '❌';
    log(`  ${status} ${provider}: ${stats.ok} OK / ${stats.error} 错误`);
  }
  
  // Issues
  if (issues.length > 0) {
    log('\n🔥 发现的问题:', 'red');
    for (const issue of issues) {
      log(`\n  ${issue.provider} - ${issue.endpoint}`);
      log(`    状态: ${issue.status}`);
      if (issue.analysis?.fix) {
        log(`    建议: ${issue.analysis.fix}`);
      }
      
      const recs = getFixRecommendation(issue.provider, issue.analysis);
      log(`    修复步骤:`);
      for (const rec of recs) {
        log(`      - ${rec}`, 'yellow');
      }
    }
  }
  
  // Health score
  const total = allResults.length;
  const healthy = allResults.filter(r => r.status.startsWith('HTTP_2') || r.status === 'OK').length;
  const score = Math.round((healthy / total) * 100);
  
  log(`\n🏥 健康评分: ${score}/100`, score >= 70 ? 'green' : 'red');
  
  return { providerStats, issues, score };
}

function saveResults(results) {
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }
  
  const outputPath = path.join(stateDir, 'api-diagnosis.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results
  }, null, 2));
  
  log(`\n💾 诊断结果已保存到: ${outputPath}`, 'gray');
}

async function runDiagnostics(args) {
  logSection('🔧 API Provider 自动诊断工具');
  log(`时间: ${new Date().toLocaleString()}`, 'gray');
  
  // Load cluster config if exists
  let config = null;
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      log(`📂 已加载集群配置: ${config.name}`, 'gray');
    } catch (e) {
      log(`⚠️ 配置加载失败: ${e.message}`, 'yellow');
    }
  }
  
  // Determine which providers to check
  let providers = knownEndpoints;
  
  if (args.provider) {
    if (knownEndpoints[args.provider]) {
      providers = { [args.provider]: knownEndpoints[args.provider] };
    } else {
      log(`❌ 未知provider: ${args.provider}`, 'red');
      log(`可用providers: ${Object.keys(knownEndpoints).join(', ')}`);
      process.exit(1);
    }
  }
  
  // Run diagnostics
  const allResults = [];
  for (const [provider, endpoints] of Object.entries(providers)) {
    const results = await diagnoseProvider(provider, endpoints);
    allResults.push(...results);
  }
  
  // Generate report
  const report = generateReport(allResults);
  
  // Save results
  saveResults(allResults);
  
  // Auto-fix suggestions
  if (args.fix) {
    logSection('🔧 自动修复模式');
    log('检查可自动修复的问题...', 'yellow');
    
    for (const issue of report.issues) {
      if (issue.analysis?.type === 'MISSING_CONFIG') {
        log(`\n⚠️ ${issue.provider}: 缺少API Key配置`, 'red');
        log('   手动添加到 cluster-workers.json');
      }
      
      if (issue.analysis?.type === 'DNS_ERROR' && issue.provider === 'fucheers') {
        log(`\n⚠️ fucheers: 域名解析失败，服务可能已下线`, 'red');
        log('   建议从配置中移除该provider');
      }
    }
  }
  
  // Watch mode
  if (args.watch) {
    logSection('👀 监控模式');
    log('每60秒重新诊断，按 Ctrl+C 退出\n', 'yellow');
    
    setInterval(async () => {
      log(`\n${'─'.repeat(50)}`, 'gray');
      log(`刷新时间: ${new Date().toLocaleString()}`, 'gray');
      
      const newResults = [];
      for (const [provider, endpoints] of Object.entries(providers)) {
        const results = await diagnoseProvider(provider, endpoints);
        newResults.push(...results);
      }
      
      generateReport(newResults);
      saveResults(newResults);
    }, 60000);
  }
  
  return report;
}

// Parse arguments
const args = {
  fix: process.argv.includes('--fix'),
  watch: process.argv.includes('--watch'),
  provider: null
};

const providerArg = process.argv.find(a => a.startsWith('--provider='));
if (providerArg) {
  args.provider = providerArg.split('=')[1];
}

// Run
runDiagnostics(args).catch(console.error);
