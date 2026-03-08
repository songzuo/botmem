#!/usr/bin/env node

/**
 * 集群健康检查与自动修复工具
 * 综合检查集群状态、API可用性，并提供优化建议
 * 
 * 使用方法: node tools/cluster-health-check.js [--fix]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const CLUSTER_CONFIG = path.join(__dirname, '../scripts/cluster-workers.json');

class ClusterHealthCheck {
  constructor(options = {}) {
    this.config = null;
    this.options = options;
    this.results = {
      timestamp: new Date().toISOString(),
      nodes: [],
      apiProviders: [],
      issues: [],
      recommendations: []
    };
  }

  async loadConfig() {
    try {
      const configData = fs.readFileSync(CLUSTER_CONFIG, 'utf8');
      this.config = JSON.parse(configData);
      console.log('✅ 加载集群配置成功\n');
    } catch (e) {
      console.log('⚠️ 未找到集群配置，使用默认设置');
      this.config = {
        workers: [{ id: 'local', name: '本地沙箱', status: 'active' }],
        settings: { 
          healthCheckInterval: 600000, 
          autoFailover: true,
          diskThreshold: 85 
        },
        apiProviders: []
      };
    }
  }

  async checkNodeHealth() {
    console.log('📍 === 节点健康检查 ===\n');
    
    const nodes = this.config.workers || [];
    
    for (const node of nodes) {
      const health = {
        id: node.id,
        name: node.name,
        status: node.status,
        role: node.role,
        healthy: node.status === 'active'
      };
      
      const icon = health.healthy ? '✅' : '❌';
      console.log(`${icon} ${node.name} (${node.id})`);
      console.log(`   状态: ${node.status}`);
      console.log(`   角色: ${node.role || 'N/A'}`);
      
      if (node.resources) {
        console.log(`   资源: ${node.resources.cpu} / ${node.resources.memory} / ${node.resources.disk}`);
      }
      
      if (!health.healthy) {
        this.results.issues.push({
          severity: 'high',
          component: 'node',
          message: `节点 ${node.name} 状态异常: ${node.status}`
        });
      }
      
      this.results.nodes.push(health);
      console.log('');
    }
  }

  async testApiEndpoint(provider) {
    return new Promise((resolve) => {
      const start = Date.now();
      let completed = false;
      
      const timeout = setTimeout(() => {
        if (!completed) {
          completed = true;
          resolve({ success: false, latency: null, error: 'timeout' });
        }
      }, 5000);
      
      try {
        // 根据 provider 类型选择测试端点
        let url = provider.endpoint;
        let method = 'GET';
        let postData = null;
        
        if (provider.name === 'volcengine') {
          // 火山引擎 - 测试 API 可用性
          url = url.replace('/api/v3', '/api/v3/models');
        } else if (provider.name === 'minimax') {
          // MiniMax - 需要POST请求
          url = url + '/v1/messages';
          method = 'POST';
          postData = JSON.stringify({
            model: 'MiniMax-M2.5',
            max_tokens: 10,
            messages: [{role: 'user', content: 'hi'}]
          });
        } else if (provider.name === 'fucheers') {
          // Fucheers
          url = url.replace('/v1', '/v1/models');
        }
        
        const protocol = url.startsWith('https') ? https : http;
        
        const options = {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + (provider.keys ? provider.keys[0] : '')
          },
          timeout: 15000
        };
        
        const req = protocol.request(url, options, (res) => {
          clearTimeout(timeout);
          completed = true;
          const latency = Date.now() - start;
          
          // 401/403 表示端点存在但认证失败，这是可以接受的
          const acceptable = [200, 401, 403].includes(res.statusCode);
          
          resolve({ 
            success: acceptable, 
            latency,
            statusCode: res.statusCode,
            error: acceptable ? null : `HTTP ${res.statusCode}`
          });
        });
        
        req.on('error', (e) => {
          clearTimeout(timeout);
          if (!completed) {
            completed = true;
            resolve({ success: false, latency: null, error: e.message });
          }
        });
        
        // 如果是POST请求，写入数据
        if (postData) {
          req.write(postData);
        }
        
        req.end();
        
      } catch (e) {
        clearTimeout(timeout);
        resolve({ success: false, latency: null, error: e.message });
      }
    });
  }

  async checkApiProviders() {
    console.log('🔌 === API Provider 检查 ===\n');
    
    const providers = this.config.apiProviders || [];
    
    for (const provider of providers) {
      const hasKeys = provider.keys && provider.keys.length > 0;
      const keyStatus = hasKeys ? '✅' : '❌';
      
      console.log(`${keyStatus} ${provider.name}`);
      console.log(`   优先级: ${provider.priority}`);
      console.log(`   端点: ${provider.endpoint}`);
      
      if (hasKeys) {
        // 显示 keys 数量，隐藏部分内容
        const visibleKeys = provider.keys.map(k => 
          k.length > 10 ? k.substring(0, 6) + '...' + k.slice(-4) : k
        );
        console.log(`   Keys: ${visibleKeys.join(', ')}`);
        
        // 测试端点连通性
        console.log(`   测试连通性...`);
        const testResult = await this.testApiEndpoint(provider);
        
        if (testResult.success) {
          console.log(`   ✅ 连通性正常 (${testResult.latency}ms)`);
        } else {
          console.log(`   ⚠️ 连通性: ${testResult.error || '失败'}`);
          this.results.issues.push({
            severity: 'medium',
            component: 'api',
            message: `${provider.name} API 端点不可达: ${testResult.error}`
          });
        }
      } else {
        console.log(`   ❌ 未配置 API Keys`);
        this.results.issues.push({
          severity: hasKeys ? 'low' : 'high',
          component: 'api',
          message: `${provider.name} 缺少 API Keys`
        });
      }
      
      if (provider.model) {
        console.log(`   模型: ${provider.model}`);
      }
      
      this.results.apiProviders.push({
        name: provider.name,
        hasKeys,
        priority: provider.priority,
        endpoint: provider.endpoint
      });
      
      console.log('');
    }
  }

  analyzeSettings() {
    console.log('⚙️ === 配置分析 ===\n');
    
    const settings = this.config.settings || {};
    
    // 健康检查间隔
    const healthInterval = settings.healthCheckInterval || 600000;
    const healthIntervalMin = healthInterval / 60000;
    console.log(`📊 健康检查间隔: ${healthIntervalMin}分钟`);
    
    if (healthInterval > 900000) {
      this.results.issues.push({
        severity: 'medium',
        component: 'settings',
        message: `健康检查间隔过长 (${healthIntervalMin}分钟)，建议 ≤15分钟`
      });
      console.log(`   ⚠️ 建议: 缩短到 10-15 分钟`);
    } else {
      console.log(`   ✅ 合理`);
    }
    
    // 磁盘阈值
    const diskThreshold = settings.diskThreshold || 85;
    console.log(`\n💾 磁盘清理阈值: ${diskThreshold}%`);
    
    if (diskThreshold > 90) {
      this.results.issues.push({
        severity: 'medium',
        component: 'settings',
        message: `磁盘阈值过高 (${diskThreshold}%)`
      });
      console.log(`   ⚠️ 建议: 降低到 75-80%`);
    } else if (diskThreshold >= 75 && diskThreshold <= 85) {
      console.log(`   ✅ 合理`);
    } else {
      console.log(`   ℹ️ 当前值`);
    }
    
    // 自动故障切换
    const autoFailover = settings.autoFailover !== false;
    console.log(`\n🔄 自动故障切换: ${autoFailover ? '启用' : '禁用'}`);
    
    if (!autoFailover) {
      this.results.issues.push({
        severity: 'high',
        component: 'settings',
        message: '自动故障切换未启用'
      });
      console.log(`   ⚠️ 建议: 启用以提高可用性`);
    } else {
      console.log(`   ✅ 已启用`);
    }
    
    console.log('');
  }

  generateRecommendations() {
    console.log('💡 === 优化建议 ===\n');
    
    // 根据问题生成建议
    const issueCount = this.results.issues.length;
    
    if (issueCount === 0) {
      console.log('✅ 集群状态良好，无需优化！');
      this.results.recommendations.push('集群状态良好');
    } else {
      // 按严重性分组
      const high = this.results.issues.filter(i => i.severity === 'high');
      const medium = this.results.issues.filter(i => i.severity === 'medium');
      const low = this.results.issues.filter(i => i.severity === 'low');
      
      if (high.length > 0) {
        console.log('🔴 高优先级:');
        high.forEach(i => {
          console.log(`   • ${i.message}`);
          this.results.recommendations.push(`[高] ${i.message}`);
        });
        console.log('');
      }
      
      if (medium.length > 0) {
        console.log('🟡 中优先级:');
        medium.forEach(i => {
          console.log(`   • ${i.message}`);
          this.results.recommendations.push(`[中] ${i.message}`);
        });
        console.log('');
      }
      
      if (low.length > 0) {
        console.log('🔵 低优先级:');
        low.forEach(i => {
          console.log(`   • ${i.message}`);
          this.results.recommendations.push(`[低] ${i.message}`);
        });
        console.log('');
      }
    }
    
    // 总体建议
    console.log('📋 总体建议:');
    
    const hasActiveApi = this.results.apiProviders.filter(p => p.hasKeys).length;
    if (hasActiveApi < 2) {
      console.log('   → 建议配置多个 API Provider 以实现故障切换');
    }
    
    const nodeCount = this.results.nodes.length;
    if (nodeCount < 2) {
      console.log('   → 考虑添加更多节点以提高可用性');
    }
    
    console.log('');
  }

  generateReport() {
    console.log('='.repeat(50));
    console.log('\n📈 === 集群健康报告 ===\n');
    console.log(`检查时间: ${this.results.timestamp}`);
    console.log(`节点数量: ${this.results.nodes.length}`);
    console.log(`API Provider: ${this.results.apiProviders.length}`);
    console.log(`发现问题: ${this.results.issues.length}`);
    
    const healthyNodes = this.results.nodes.filter(n => n.healthy).length;
    const healthyApis = this.results.apiProviders.filter(p => p.hasKeys).length;
    
    console.log(`\n健康度:`);
    console.log(`   节点: ${healthyNodes}/${this.results.nodes.length}`);
    console.log(`   API: ${healthyApis}/${this.results.apiProviders.length}`);
    
    const score = Math.round(
      (healthyNodes / Math.max(this.results.nodes.length, 1) * 50) +
      (healthyApis / Math.max(this.results.apiProviders.length, 1) * 50)
    );
    
    console.log(`\n🎯 整体健康评分: ${score}/100`);
    
    if (score >= 80) {
      console.log('   ✅ 状态优秀');
    } else if (score >= 60) {
      console.log('   🟡 状态一般');
    } else {
      console.log('   🔴 需要关注');
    }
    
    console.log('\n' + '='.repeat(50));
  }

  async run() {
    console.log('🔍 集群健康检查工具 v2.0\n');
    console.log('='.repeat(50) + '\n');
    
    await this.loadConfig();
    await this.checkNodeHealth();
    await this.checkApiProviders();
    this.analyzeSettings();
    this.generateRecommendations();
    this.generateReport();
    
    console.log('\n✅ 检查完成\n');
    
    return this.results;
  }
}

// 主程序
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    fix: args.includes('--fix')
  };
  
  const healthCheck = new ClusterHealthCheck(options);
  healthCheck.run().then(results => {
    // 可以在这里添加自动修复逻辑
    process.exit(results.issues.length > 0 ? 1 : 0);
  }).catch(err => {
    console.error('检查失败:', err);
    process.exit(2);
  });
}

module.exports = ClusterHealthCheck;
