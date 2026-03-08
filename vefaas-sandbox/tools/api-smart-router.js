#!/usr/bin/env node

/**
 * API Smart Router - 智能API路由选择器
 * 根据实时性能指标自动选择最佳API Provider
 * 
 * 用法: node api-smart-router.js [--provider NAME] [--verbose]
 * 
 * 选项:
 *   --provider NAME  指定特定的provider (volcengine|minimax|fucheers)
 *   --verbose        显示详细输出
 *   --test           仅测试所有provider并报告
 *   --best           返回最佳provider名称
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// 读取集群配置
function loadClusterConfig() {
  const fs = require('fs');
  const path = require('path');
  
  const configPath = path.join(__dirname, '..', 'scripts', 'cluster-workers.json');
  
  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('无法加载集群配置:', error.message);
    return null;
  }
}

// 测试单个API Provider的延迟和可用性
async function testProvider(provider, verbose = false) {
  const startTime = Date.now();
  const timeout = 10000; // 10秒超时
  
  return new Promise((resolve) => {
    const timers = setTimeout(() => {
      resolve({
        name: provider.name,
        available: false,
        latency: null,
        error: '超时',
        score: 0
      });
    }, timeout);
    
    try {
      // 根据provider类型构造测试请求
      let testUrl = provider.endpoint || '';
      let options = {};
      
      if (provider.name === 'volcengine') {
        testUrl = 'https://ark.cn-beijing.volces.com/api/v3/models';
        options = {
          headers: {
            'Authorization': `Bearer ${provider.keys?.[0] || ''}`,
            'Content-Type': 'application/json'
          },
          method: 'GET'
        };
      } else if (provider.name === 'minimax') {
        testUrl = 'https://api.minimax.chat/v1/models';
        options = {
          headers: {
            'Authorization': `Bearer ${provider.keys?.[0] || ''}`,
            'Content-Type': 'application/json'
          },
          method: 'GET'
        };
      } else if (provider.name === 'fucheers') {
        testUrl = 'https://api.fucheers.com/v1/models';
        options = {
          headers: {
            'Authorization': `Bearer ${provider.keys?.[0] || ''}`,
            'Content-Type': 'application/json'
          },
          method: 'GET'
        };
      } else {
        // 默认测试endpoint
        testUrl = provider.endpoint || '';
        options = { method: 'GET' };
      }
      
      if (!testUrl) {
        clearTimeout(timers);
        resolve({
          name: provider.name,
          available: false,
          latency: null,
          error: '无endpoint',
          score: 0
        });
        return;
      }
      
      const url = new URL(testUrl);
      const protocol = url.protocol === 'https:' ? https : http;
      
      const req = protocol.request(testUrl, options, (res) => {
        clearTimeout(timers);
        const latency = Date.now() - startTime;
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (verbose) console.log(`[${provider.name}] ✓ 可用 - ${latency}ms`);
          resolve({
            name: provider.name,
            available: true,
            latency: latency,
            statusCode: res.statusCode,
            error: null,
            score: calculateScore(latency, res.statusCode, provider.priority || 99)
          });
        } else {
          if (verbose) console.log(`[${provider.name}] ⚠ 状态码 ${res.statusCode}`);
          resolve({
            name: provider.name,
            available: false,
            latency: latency,
            statusCode: res.statusCode,
            error: `HTTP ${res.statusCode}`,
            score: 0
          });
        }
      });
      
      req.on('error', (err) => {
        clearTimeout(timers);
        if (verbose) console.log(`[${provider.name}] ✗ 错误: ${err.message}`);
        resolve({
          name: provider.name,
          available: false,
          latency: null,
          error: err.message,
          score: 0
        });
      });
      
      req.end();
    } catch (err) {
      clearTimeout(timers);
      if (verbose) console.log(`[${provider.name}] ✗ 异常: ${err.message}`);
      resolve({
        name: provider.name,
        available: false,
        latency: null,
        error: err.message,
        score: 0
      });
    }
  });
}

// 计算综合评分
function calculateScore(latency, statusCode, priority) {
  // 基础分数：优先级越高分数越高
  let score = (100 - priority) * 10;
  
  // 延迟惩罚：每100ms扣5分
  if (latency) {
    score -= Math.floor(latency / 100) * 5;
  }
  
  // 状态码正常加20分
  if (statusCode >= 200 && statusCode < 300) {
    score += 20;
  }
  
  return Math.max(0, score);
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  const testOnly = args.includes('--test') || args.includes('-t');
  const getBest = args.includes('--best') || args.includes('-b');
  
  // 查找指定的provider
  let targetProvider = null;
  for (const arg of args) {
    if (arg.startsWith('--provider=') || arg.startsWith('--p=')) {
      targetProvider = arg.split('=')[1];
    }
  }
  
  if (verbose) {
    console.log('🔍 API Smart Router - 智能路由选择器\n');
  }
  
  const config = loadClusterConfig();
  if (!config || !config.apiProviders) {
    console.error('❌ 无法加载API Provider配置');
    process.exit(1);
  }
  
  // 过滤provider
  let providers = config.apiProviders;
  if (targetProvider) {
    providers = providers.filter(p => p.name === targetProvider);
    if (providers.length === 0) {
      console.error(`❌ 未找到provider: ${targetProvider}`);
      process.exit(1);
    }
  }
  
  if (verbose) {
    console.log(`📊 测试 ${providers.length} 个API Provider...\n`);
  }
  
  // 测试所有provider
  const results = await Promise.all(
    providers.map(p => testProvider(p, verbose))
  );
  
  // 按分数排序
  results.sort((a, b) => b.score - a.score);
  
  // 找到最佳provider
  const bestProvider = results.find(r => r.available);
  
  if (testOnly) {
    console.log('\n📈 测试结果:');
    console.log('─'.repeat(50));
    results.forEach((r, i) => {
      const status = r.available ? '✅' : '❌';
      const latency = r.latency ? `${r.latency}ms` : 'N/A';
      console.log(`${i + 1}. ${status} ${r.name.padEnd(12)} | 延迟: ${latency.padEnd(8)} | 分数: ${r.score}`);
      if (r.error) console.log(`   └─ ${r.error}`);
    });
    console.log('─'.repeat(50));
  }
  
  if (getBest) {
    if (bestProvider) {
      console.log(bestProvider.name);
    } else {
      console.error('无可用的API Provider');
      process.exit(1);
    }
  }
  
  if (!testOnly && !getBest) {
    if (bestProvider) {
      console.log(`\n✅ 推荐使用: ${bestProvider.name} (延迟: ${bestProvider.latency}ms, 分数: ${bestProvider.score})`);
    } else {
      console.log('\n❌ 没有可用的API Provider');
      process.exit(1);
    }
  }
  
  // 返回结果供其他脚本使用
  return {
    results,
    bestProvider,
    timestamp: new Date().toISOString()
  };
}

// 如果直接运行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testProvider, loadClusterConfig, calculateScore };
