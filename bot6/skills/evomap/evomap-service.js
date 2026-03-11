/**
 * Evomap Gateway Service for OpenClaw
 * 
 * 这个服务提供与 Evomap 系统的集成，作为 OpenClaw 的子模块运行。
 * 
 * 功能:
 * - 自动注册节点并维持心跳
 * - 同步资产 (Gene/Capsule)
 * - 发布智能体解决方案
 * - 任务领取和完成
 */

const EvomapClient = require('./evomap-client');

class EvomapGatewayService {
  constructor(options = {}) {
    this.client = new EvomapClient(options);
    this.options = {
      heartbeatInterval: options.heartbeatInterval || 15 * 60 * 1000, // 15 minutes
      syncInterval: options.syncInterval || 4 * 60 * 60 * 1000, // 4 hours
      autoStart: options.autoStart !== false,
      onAssets: options.onAssets,
      onTasks: options.onTasks,
      onNotification: options.onNotification
    };
    
    this.running = false;
    this.heartbeatTimer = null;
    this.syncTimer = null;
  }

  /**
   * 启动服务
   */
  async start() {
    if (this.running) return;
    
    console.log('[Evomap] Starting gateway service...');
    
    // 注册节点
    const helloResult = await this.client.hello({
      model: 'openclaw-gateway'
    });
    
    if (!helloResult.success) {
      console.error('[Evomap] Registration failed:', helloResult.error);
      return false;
    }
    
    console.log('[Evomap] Node registered:', this.client.nodeId);
    if (helloResult.data?.claim_url) {
      console.log('[Evomap] Claim URL:', helloResult.data.claim_url);
    }
    
    this.running = true;
    
    // 启动心跳循环
    this.heartbeatTimer = setInterval(async () => {
      await this._heartbeat();
    }, this.options.heartbeatInterval);
    
    // 启动同步循环
    this.syncTimer = setInterval(async () => {
      await this._sync();
    }, this.options.syncInterval);
    
    // 立即执行一次同步
    await this._sync();
    
    return true;
  }

  /**
   * 停止服务
   */
  stop() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.running = false;
    console.log('[Evomap] Gateway service stopped');
  }

  /**
   * 发送心跳
   */
  async _heartbeat() {
    const result = await this.client.heartbeat();
    if (result.success) {
      console.log('[Evomap] Heartbeat OK');
    } else {
      console.error('[Evomap] Heartbeat failed:', result.error);
    }
    return result;
  }

  /**
   * 同步资产和任务
   */
  async _sync() {
    // 获取新资产
    const fetchResult = await this.client.fetch({
      assetType: 'Capsule',
      limit: 20,
      includeTasks: true
    });
    
    if (fetchResult.success) {
      const assets = fetchResult.data?.payload?.results || [];
      const tasks = fetchResult.data?.payload?.tasks || [];
      
      if (this.options.onAssets && assets.length > 0) {
        await this.options.onAssets(assets);
      }
      
      if (this.options.onTasks && tasks.length > 0) {
        await this.options.onTasks(tasks);
      }
      
      console.log(`[Evomap] Synced ${assets.length} assets, ${tasks.length} tasks`);
    } else {
      console.error('[Evomap] Sync failed:', fetchResult.error);
    }
    
    return fetchResult;
  }

  /**
   * 发布解决方案
   * @param {Object} options - 发布选项
   * @param {string[]} options.signals - 触发信号
   * @param {string} options.summary - 摘要
   * @param {string} options.content - 详细内容
   * @param {number} options.confidence - 置信度 (0-1)
   * @param {Object} options.blastRadius - 影响范围
   * @param {string} [options.diff] - Git diff
   * @param {string} [options.intent] - 意图: repair/optimize/innovate
   */
  async publishSolution(options) {
    const result = await this.client.publishFix(options);
    
    if (result.success) {
      console.log('[Evomap] Solution published:', result.data?.asset_id || 'OK');
    } else {
      console.error('[Evomap] Publish failed:', result.error || result.data?.error);
    }
    
    return result;
  }

  /**
   * 领取任务
   * @param {string} taskId - 任务 ID
   */
  async claimTask(taskId) {
    const result = await this.client.claimTask(taskId);
    
    if (result.success) {
      console.log('[Evomap] Task claimed:', taskId);
    } else {
      console.error('[Evomap] Claim failed:', result.error);
    }
    
    return result;
  }

  /**
   * 完成任务
   * @param {string} taskId - 任务 ID
   * @param {string} assetId - 解决方案资产 ID
   */
  async completeTask(taskId, assetId) {
    const result = await this.client.completeTask(taskId, assetId);
    
    if (result.success) {
      console.log('[Evomap] Task completed:', taskId);
    } else {
      console.error('[Evomap] Complete failed:', result.error);
    }
    
    return result;
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      ...this.client.getStatus(),
      running: this.running
    };
  }
}

module.exports = EvomapGatewayService;