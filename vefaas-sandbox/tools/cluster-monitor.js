#!/usr/bin/env node

/**
 * 集群状态监控工具
 * 检查节点状态、资源利用率，提供优化建议
 * 
 * 使用方法: node tools/cluster-monitor.js
 */

const fs = require('fs');
const path = require('path');

const CLUSTER_CONFIG = path.join(__dirname, '../scripts/cluster-workers.json');

class ClusterMonitor {
  constructor() {
    this.config = null;
    this.loadConfig();
  }

  loadConfig() {
    try {
      const configData = fs.readFileSync(CLUSTER_CONFIG, 'utf8');
      this.config = JSON.parse(configData);
      console.log('✅ 加载集群配置成功');
    } catch (e) {
      console.log('⚠️ 未找到集群配置，使用默认设置');
      this.config = {
        workers: [{ id: 'local', name: '本地沙箱', status: 'active' }],
        settings: { healthCheckInterval: 600000, autoFailover: true }
      };
    }
  }

  async checkNodeStatus() {
    console.log('\n📊 === 节点状态检查 ===\n');
    
    const nodes = this.config.workers || [];
    
    for (const node of nodes) {
      console.log(`节点: ${node.name} (${node.id})`);
      console.log(`  状态: ${node.status}`);
      console.log(`  角色: ${node.role}`);
      if (node.resources) {
        console.log(`  CPU: ${node.resources.cpu}`);
        console.log(`  内存: ${node.resources.memory}`);
        console.log(`  磁盘: ${node.resources.disk}`);
      }
      console.log('');
    }
    
    return nodes;
  }

  async checkApiProviders() {
    console.log('🔌 === API Provider 状态 ===\n');
    
    const providers = this.config.apiProviders || [];
    
    for (const provider of providers) {
      const status = provider.keys && provider.keys.length > 0 ? '✅' : '❌';
      console.log(`${status} ${provider.name}`);
      console.log(`   优先级: ${provider.priority}`);
      console.log(`   可用Key数: ${provider.keys ? provider.keys.length : 0}`);
      if (provider.model) {
        console.log(`   模型: ${provider.model}`);
      }
      console.log('');
    }
  }

  analyzeOptimizations() {
    console.log('💡 === 优化建议 ===\n');
    
    const suggestions = [];
    
    // 检查 API 配置
    const providers = this.config.apiProviders || [];
    const activeProviders = providers.filter(p => p.keys && p.keys.length > 0);
    
    if (activeProviders.length < 2) {
      suggestions.push({
        priority: 'high',
        title: 'API 冗余不足',
        description: '建议配置多个 API provider 以实现自动故障切换',
        action: '在 scripts/cluster-workers.json 中添加更多 API keys'
      });
    }
    
    // 检查健康检查设置
    const healthInterval = this.config.settings?.healthCheckInterval || 600000;
    if (healthInterval > 900000) {
      suggestions.push({
        priority: 'medium',
        title: '健康检查间隔过长',
        description: '建议缩短健康检查间隔以更快发现故障',
        action: '将 healthCheckInterval 设置为 600000 (10分钟)'
      });
    }
    
    // 检查磁盘阈值
    const diskThreshold = this.config.settings?.diskThreshold || 85;
    if (diskThreshold > 90) {
      suggestions.push({
        priority: 'medium',
        title: '磁盘清理阈值过高',
        description: '建议降低磁盘阈值以避免存储耗尽',
        action: '将 diskThreshold 设置为 80 或更低'
      });
    }
    
    if (suggestions.length === 0) {
      console.log('✅ 集群配置看起来不错！');
    } else {
      suggestions.forEach((s, i) => {
        const icon = s.priority === 'high' ? '🔴' : '🟡';
        console.log(`${icon} [${s.priority.toUpperCase()}] ${s.title}`);
        console.log(`   ${s.description}`);
        console.log(`   → ${s.action}`);
        console.log('');
      });
    }
    
    return suggestions;
  }

  generateReport() {
    console.log('\n📈 === 集群完整报告 ===\n');
    console.log(`集群名称: ${this.config.name || '未命名'}`);
    console.log(`版本: ${this.config.version || '1.0.0'}`);
    console.log(`节点数: ${this.config.workers?.length || 0}`);
    console.log(`API Provider数: ${this.config.apiProviders?.length || 0}`);
    console.log(`自动故障切换: ${this.config.settings?.autoFailover ? '启用' : '禁用'}`);
    console.log(`磁盘阈值: ${this.config.settings?.diskThreshold || 85}%`);
    console.log(`健康检查间隔: ${(this.config.settings?.healthCheckInterval || 600000) / 60000}分钟`);
  }

  async run() {
    console.log('🔍 集群状态监控工具 v1.0\n');
    console.log('='.repeat(40));
    
    await this.checkNodeStatus();
    await this.checkApiProviders();
    this.analyzeOptimizations();
    this.generateReport();
    
    console.log('\n' + '='.repeat(40));
    console.log('✅ 检查完成\n');
    
    return {
      nodes: this.config.workers,
      providers: this.config.apiProviders,
      settings: this.config.settings
    };
  }
}

// 主程序
if (require.main === module) {
  const monitor = new ClusterMonitor();
  monitor.run().catch(console.error);
}

module.exports = ClusterMonitor;
