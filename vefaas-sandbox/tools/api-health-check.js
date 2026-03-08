#!/usr/bin/env node

/**
 * API Provider 健康检查工具
 * 测试各 API Provider 的实际连通性和响应时间
 * 
 * 使用方法: node tools/api-health-check.js
 */

const https = require('https');
const http = require('https');

const CLUSTER_CONFIG = './scripts/cluster-workers.json';

// 读取配置文件
let config;
try {
  const fs = require('fs');
  config = JSON.parse(fs.readFileSync(CLUSTER_CONFIG, 'utf8'));
} catch (e) {
  console.log('⚠️ 无法读取集群配置');
  process.exit(1);
}

class ApiHealthChecker {
  constructor() {
    this.results = [];
  }

  async checkVolcengine(provider) {
    console.log(`\n🌋 检查 Volcano Engine API...`);
    try {
      const result = await this.makeRequest(
        'https://ark.cn-beijing.volces.com/api/v3',
        '/models',
        provider.keys[0]
      );
      if (result.success) {
        console.log(`   ✅ 连接成功 (${result.latency}ms)`);
      } else {
        console.log(`   ❌ 连接失败: ${result.error}`);
      }
      return result;
    } catch (e) {
      console.log(`   ❌ 异常: ${e.message}`);
      return { success: false, error: e.message };
    }
  }

  async checkMinimax(provider) {
    console.log(`\n🧠 检查 MiniMax API...`);
    if (!provider.keys || provider.keys.length === 0) {
      console.log(`   ⏭️ 跳过: 未配置 API Key`);
      return { success: false, error: 'No API key configured' };
    }
    try {
      const result = await this.makeRequest(
        'https://api.minimax.chat/v1',
        '/models',
        provider.keys[0]
      );
      if (result.success) {
        console.log(`   ✅ 连接成功 (${result.latency}ms)`);
      } else {
        console.log(`   ❌ 连接失败: ${result.error}`);
      }
      return result;
    } catch (e) {
      console.log(`   ❌ 异常: ${e.message}`);
      return { success: false, error: e.message };
    }
  }

  async checkFucheers(provider) {
    console.log(`\n🔮 检查 Fucheers API...`);
    if (!provider.keys || provider.keys.length === 0) {
      console.log(`   ⏭️ 跳过: 未配置 API Key`);
      return { success: false, error: 'No API key configured' };
    }
    try {
      const result = await this.makeRequest(
        'https://api.fucheers.com/v1',
        '/models',
        provider.keys[0]
      );
      if (result.success) {
        console.log(`   ✅ 连接成功 (${result.latency}ms)`);
      } else {
        console.log(`   ❌ 连接失败: ${result.error}`);
      }
      return result;
    } catch (e) {
      console.log(`   ❌ 异常: ${e.message}`);
      return { success: false, error: e.message };
    }
  }

  makeRequest(baseUrl, endpoint, apiKey) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const url = new URL(endpoint, baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const latency = Date.now() - startTime;
          if (res.statusCode === 200) {
            resolve({ success: true, latency, statusCode: res.statusCode });
          } else {
            resolve({ success: false, latency, error: `HTTP ${res.statusCode}` });
          }
        });
      });

      req.on('error', (e) => {
        const latency = Date.now() - startTime;
        resolve({ success: false, latency, error: e.message });
      });

      req.on('timeout', () => {
        req.destroy();
        const latency = Date.now() - startTime;
        resolve({ success: false, latency, error: 'Timeout' });
      });

      req.end();
    });
  }

  async run() {
    console.log('🔌 API Provider 健康检查 v1.0');
    console.log('='.repeat(45));

    const providers = config.apiProviders || [];
    const summary = { total: providers.length, success: 0, failed: 0 };

    for (const provider of providers) {
      let result;
      switch (provider.name) {
        case 'volcengine':
          result = await this.checkVolcengine(provider);
          break;
        case 'minimax':
          result = await this.checkMinimax(provider);
          break;
        case 'fucheers':
          result = await this.checkFucheers(provider);
          break;
        default:
          console.log(`\n❓ 未知 Provider: ${provider.name}`);
          continue;
      }

      if (result.success) {
        summary.success++;
      } else {
        summary.failed++;
      }
      this.results.push({ provider: provider.name, ...result });
    }

    console.log('\n' + '='.repeat(45));
    console.log('📊 总结');
    console.log(`   总计: ${summary.total}`);
    console.log(`   成功: ${summary.success} ✅`);
    console.log(`   失败: ${summary.failed} ❌`);
    
    // 建议
    if (summary.failed > 0) {
      console.log('\n💡 建议:');
      const failedProviders = this.results.filter(r => !r.success);
      failedProviders.forEach(p => {
        console.log(`   - 检查 ${p.provider} 配置: ${p.error}`);
      });
    }

    console.log('\n✅ 检查完成\n');
    return this.results;
  }
}

// 主程序
if (require.main === module) {
  const checker = new ApiHealthChecker();
  checker.run().catch(console.error);
}

module.exports = ApiHealthChecker;
