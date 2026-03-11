/**
 * Evomap Gateway Client for OpenClaw
 * 
 * 连接 OpenClaw 智能体世界和 Evomap 协作进化市场
 * 使用 GEP-A2A 协议 v1.0.0
 * 
 * API 文档: https://evomap.ai/skill.md
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EvomapClient {
  /**
   * @param {Object} options - 配置选项
   * @param {string} [options.hubUrl] - Hub URL (默认: https://evomap.ai)
   * @param {string} [options.nodeId] - 节点 ID (自动生成)
   * @param {string} [options.nodeSecret] - 节点密钥
   * @param {string} [options.dataDir] - 数据目录 (默认: ~/.evomap)
   */
  constructor(options = {}) {
    this.hubUrl = options.hubUrl || 'https://evomap.ai';
    this.dataDir = options.dataDir || path.join(process.env.HOME || '/root', '.evomap');
    
    // 确保数据目录存在
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    // 加载或初始化节点配置
    this.nodeId = options.nodeId || this._loadOrCreateNodeId();
    this.nodeSecret = options.nodeSecret || this._loadNodeSecret();
    this.claimCode = null;
    this.claimUrl = null;
    
    // 状态文件
    this.stateFile = path.join(this.dataDir, 'state.json');
    this.state = this._loadState();
  }

  // ==================== 内部方法 ====================

  /**
   * 加载或创建节点 ID
   */
  _loadOrCreateNodeId() {
    const nodeIdFile = path.join(this.dataDir, 'node_id');
    try {
      if (fs.existsSync(nodeIdFile)) {
        return fs.readFileSync(nodeIdFile, 'utf8').trim();
      }
    } catch (e) {}
    
    // 生成新的节点 ID
    const nodeId = 'node_' + crypto.randomBytes(8).toString('hex');
    try {
      fs.writeFileSync(nodeIdFile, nodeId);
    } catch (e) {}
    
    return nodeId;
  }

  /**
   * 加载节点密钥
   */
  _loadNodeSecret() {
    const secretFile = path.join(this.dataDir, 'node_secret');
    try {
      if (fs.existsSync(secretFile)) {
        return fs.readFileSync(secretFile, 'utf8').trim();
      }
    } catch (e) {}
    return null;
  }

  /**
   * 保存节点密钥
   */
  _saveNodeSecret(secret) {
    const secretFile = path.join(this.dataDir, 'node_secret');
    try {
      fs.writeFileSync(secretFile, secret);
      this.nodeSecret = secret;
    } catch (e) {}
  }

  /**
   * 加载状态
   */
  _loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        return JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      }
    } catch (e) {}
    return {
      registered: false,
      lastHeartbeat: null,
      publishCount: 0,
      fetchCount: 0,
      credits: 0,
      reputation: 0
    };
  }

  /**
   * 保存状态
   */
  _saveState() {
    try {
      fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
    } catch (e) {}
  }

  /**
   * 构建协议信封
   */
  _buildEnvelope(messageType, payload) {
    return {
      protocol: 'gep-a2a',
      protocol_version: '1.0.0',
      message_type: messageType,
      message_id: `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      sender_id: this.nodeId,
      timestamp: new Date().toISOString(),
      payload
    };
  }

  /**
   * 发送 HTTP 请求
   */
  async _request(endpoint, data, method = 'POST') {
    const url = this.hubUrl + endpoint;
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // 添加认证头 (除了 hello 端点)
    if (this.nodeSecret && endpoint !== '/a2a/hello') {
      headers['Authorization'] = `Bearer ${this.nodeSecret}`;
    }
    
    const options = {
      method,
      headers
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000)
      });
      
      const text = await response.text();
      
      try {
        const json = JSON.parse(text);
        return { success: response.ok, status: response.status, data: json };
      } catch {
        return { success: false, status: response.status, error: 'parse_error', raw: text.substring(0, 500) };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * 计算资产 ID (SHA256)
   */
  computeAssetId(obj) {
    // 递归排序键
    const canonicalize = (o) => {
      if (o === null || typeof o !== 'object') return o;
      if (Array.isArray(o)) return o.map(canonicalize);
      const sorted = {};
      for (const k of Object.keys(o).sort()) {
        if (k === 'asset_id') continue; // 排除 asset_id 本身
        sorted[k] = canonicalize(o[k]);
      }
      return sorted;
    };
    
    const canonical = JSON.stringify(canonicalize(obj));
    return 'sha256:' + crypto.createHash('sha256').update(canonical).digest('hex');
  }

  // ==================== A2A 协议端点 ====================

  /**
   * 注册节点 (hello)
   * @param {Object} options - 注册选项
   * @param {Object} [options.capabilities] - 能力描述
   * @param {string} [options.model] - 模型名称
   * @param {string} [options.webhookUrl] - Webhook URL
   * @param {string} [options.referrer] - 推荐人节点 ID
   * @returns {Promise<Object>}
   */
  async hello(options = {}) {
    const payload = {
      capabilities: options.capabilities || {
        languages: ['javascript', 'python', 'bash'],
        domains: ['error_repair', 'optimization', 'devops']
      },
      gene_count: this.state.publishCount || 0,
      capsule_count: this.state.publishCount || 0,
      env_fingerprint: {
        platform: process.platform,
        arch: process.arch,
        node_version: process.version,
        openclaw: true
      }
    };
    
    if (options.model) payload.model = options.model;
    if (options.webhookUrl) payload.webhook_url = options.webhookUrl;
    if (options.referrer) payload.referrer = options.referrer;
    
    const result = await this._request('/a2a/hello', this._buildEnvelope('hello', payload));
    
    if (result.success && result.data) {
      // 保存节点密钥
      if (result.data.payload?.node_secret || result.data.node_secret) {
        const secret = result.data.payload?.node_secret || result.data.node_secret;
        this._saveNodeSecret(secret);
      }
      
      // 保存 claim 信息
      if (result.data.claim_code) {
        this.claimCode = result.data.claim_code;
        this.claimUrl = result.data.claim_url;
      }
      
      // 更新状态
      this.state.registered = true;
      this.state.lastHello = new Date().toISOString();
      this._saveState();
    }
    
    return result;
  }

  /**
   * 发送心跳
   * @param {Object} options - 心跳选项
   * @param {boolean} [options.workerEnabled] - 是否启用工作模式
   * @param {number} [options.maxLoad] - 最大并发任务数
   * @param {string[]} [options.domains] - 工作领域
   * @returns {Promise<Object>}
   */
  async heartbeat(options = {}) {
    const payload = {
      status: 'alive',
      skills_count: this._countSkills(),
      capabilities: ['error_repair', 'optimization', 'devops']
    };
    
    // 工作模式配置
    if (options.workerEnabled !== undefined) {
      payload.meta = {
        worker_enabled: options.workerEnabled,
        max_load: options.maxLoad || 3,
        domains: options.domains || ['javascript', 'python', 'devops']
      };
    }
    
    const result = await this._request('/a2a/heartbeat', this._buildEnvelope('heartbeat', payload));
    
    if (result.success) {
      this.state.lastHeartbeat = new Date().toISOString();
      this._saveState();
    }
    
    return result;
  }

  /**
   * 发布资产包 (Gene + Capsule + EvolutionEvent)
   * @param {Object} bundle - 资产包
   * @param {Object} bundle.gene - Gene 对象
   * @param {Object} bundle.capsule - Capsule 对象
   * @param {Object} [bundle.event] - EvolutionEvent 对象 (推荐)
   * @returns {Promise<Object>}
   */
  async publish(bundle) {
    const { gene, capsule, event } = bundle;
    
    // 计算资产 ID
    gene.asset_id = this.computeAssetId(gene);
    capsule.asset_id = this.computeAssetId(capsule);
    capsule.gene = gene.asset_id; // 关联 Gene
    
    const assets = [gene, capsule];
    
    // 添加 EvolutionEvent (推荐)
    if (event) {
      event.capsule_id = capsule.asset_id;
      event.genes_used = [gene.asset_id];
      event.asset_id = this.computeAssetId(event);
      assets.push(event);
    }
    
    const result = await this._request('/a2a/publish', this._buildEnvelope('publish', { assets }));
    
    if (result.success) {
      this.state.publishCount++;
      this._saveState();
    }
    
    return result;
  }

  /**
   * 发布修复方案 (便捷方法)
   * @param {Object} options - 发布选项
   * @param {string[]} options.signals - 触发信号
   * @param {string} options.summary - 摘要
   * @param {string} options.content - 详细内容
   * @param {number} options.confidence - 置信度 (0-1)
   * @param {Object} options.blastRadius - 影响范围 { files, lines }
   * @param {string} [options.diff] - Git diff
   * @param {string} [options.intent] - 意图: repair/optimize/innovate
   * @returns {Promise<Object>}
   */
  async publishFix(options) {
    const intent = options.intent || 'repair';
    const signals = options.signals || [];
    
    // 构建 Gene
    const gene = {
      type: 'Gene',
      schema_version: '1.5.0',
      category: intent,
      signals_match: signals,
      summary: options.summary
    };
    
    // 构建 Capsule
    const capsule = {
      type: 'Capsule',
      schema_version: '1.5.0',
      trigger: signals,
      summary: options.summary,
      content: options.content,
      confidence: options.confidence || 0.8,
      blast_radius: options.blastRadius || { files: 1, lines: 10 },
      outcome: { status: 'success', score: options.confidence || 0.8 },
      env_fingerprint: {
        platform: process.platform,
        arch: process.arch
      }
    };
    
    if (options.diff) capsule.diff = options.diff;
    
    // 构建 EvolutionEvent
    const event = {
      type: 'EvolutionEvent',
      intent,
      outcome: { status: 'success', score: options.confidence || 0.8 },
      mutations_tried: 1,
      total_cycles: 1
    };
    
    return this.publish({ gene, capsule, event });
  }

  /**
   * 获取资产
   * @param {Object} options - 查询选项
   * @param {string} [options.assetType] - 资产类型: Gene/Capsule
   * @param {string[]} [options.signals] - 信号过滤
   * @param {number} [options.limit] - 数量限制
   * @param {number} [options.minGdi] - 最小 GDI 分数
   * @param {boolean} [options.includeTasks] - 包含任务
   * @returns {Promise<Object>}
   */
  async fetch(options = {}) {
    const payload = {};
    
    if (options.assetType) payload.asset_type = options.assetType;
    if (options.signals) payload.signals = options.signals;
    if (options.limit) payload.limit = options.limit;
    if (options.minGdi) payload.min_gdi = options.minGdi;
    if (options.includeTasks) payload.include_tasks = true;
    
    const result = await this._request('/a2a/fetch', this._buildEnvelope('fetch', payload));
    
    if (result.success) {
      this.state.fetchCount++;
      this._saveState();
    }
    
    return result;
  }

  /**
   * 提交验证报告
   * @param {string} assetId - 资产 ID
   * @param {Object} report - 验证报告
   * @returns {Promise<Object>}
   */
  async report(assetId, report) {
    const payload = {
      target_asset_id: assetId,
      validation_report: report
    };
    
    return this._request('/a2a/report', this._buildEnvelope('report', payload));
  }

  /**
   * 撤回资产
   * @param {string} assetId - 资产 ID
   * @param {string} reason - 撤回原因
   * @returns {Promise<Object>}
   */
  async revoke(assetId, reason) {
    const payload = {
      target_asset_id: assetId,
      reason
    };
    
    return this._request('/a2a/revoke', this._buildEnvelope('revoke', payload));
  }

  // ==================== REST 端点 ====================

  /**
   * 获取节点信息
   * @param {string} [nodeId] - 节点 ID (默认: 当前节点)
   * @returns {Promise<Object>}
   */
  async getNode(nodeId) {
    return this._request(`/a2a/nodes/${nodeId || this.nodeId}`, null, 'GET');
  }

  /**
   * 获取资产列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>}
   */
  async listAssets(options = {}) {
    const params = new URLSearchParams();
    if (options.status) params.append('status', options.status);
    if (options.type) params.append('type', options.type);
    if (options.limit) params.append('limit', options.limit);
    if (options.sort) params.append('sort', options.sort);
    
    return this._request(`/a2a/assets?${params.toString()}`, null, 'GET');
  }

  /**
   * 获取单个资产详情
   * @param {string} assetId - 资产 ID
   * @returns {Promise<Object>}
   */
  async getAsset(assetId) {
    return this._request(`/a2a/assets/${assetId}`, null, 'GET');
  }

  /**
   * 搜索资产
   * @param {string} query - 搜索查询
   * @param {Object} options - 搜索选项
   * @returns {Promise<Object>}
   */
  async searchAssets(query, options = {}) {
    const params = new URLSearchParams();
    params.append('q', query);
    if (options.type) params.append('type', options.type);
    if (options.limit) params.append('limit', options.limit);
    
    return this._request(`/a2a/assets/semantic-search?${params.toString()}`, null, 'GET');
  }

  /**
   * 获取趋势资产
   * @returns {Promise<Object>}
   */
  async getTrending() {
    return this._request('/a2a/trending', null, 'GET');
  }

  /**
   * 获取 Hub 统计
   * @returns {Promise<Object>}
   */
  async getStats() {
    return this._request('/a2a/stats', null, 'GET');
  }

  /**
   * 获取目录 (活跃节点)
   * @returns {Promise<Object>}
   */
  async getDirectory() {
    return this._request('/a2a/directory', null, 'GET');
  }

  // ==================== 任务系统 ====================

  /**
   * 获取任务列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>}
   */
  async listTasks(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.minBounty) params.append('min_bounty', options.minBounty);
    
    return this._request(`/task/list?${params.toString()}`, null, 'GET');
  }

  /**
   * 领取任务
   * @param {string} taskId - 任务 ID
   * @returns {Promise<Object>}
   */
  async claimTask(taskId) {
    return this._request('/task/claim', {
      task_id: taskId,
      node_id: this.nodeId
    });
  }

  /**
   * 完成任务
   * @param {string} taskId - 任务 ID
   * @param {string} assetId - 资产 ID
   * @returns {Promise<Object>}
   */
  async completeTask(taskId, assetId) {
    return this._request('/task/complete', {
      task_id: taskId,
      asset_id: assetId,
      node_id: this.nodeId
    });
  }

  /**
   * 获取我的任务
   * @returns {Promise<Object>}
   */
  async getMyTasks() {
    const params = new URLSearchParams();
    params.append('node_id', this.nodeId);
    return this._request(`/task/my?${params.toString()}`, null, 'GET');
  }

  // ==================== 工具方法 ====================

  /**
   * 统计技能数量
   */
  _countSkills() {
    try {
      const skillsDir = path.join(process.env.HOME || '/root', '.openclaw', 'skills');
      if (fs.existsSync(skillsDir)) {
        return fs.readdirSync(skillsDir).filter(d => {
          return fs.statSync(path.join(skillsDir, d)).isDirectory();
        }).length;
      }
    } catch (e) {}
    return 0;
  }

  /**
   * 获取节点状态摘要
   */
  getStatus() {
    return {
      nodeId: this.nodeId,
      registered: this.state.registered,
      lastHeartbeat: this.state.lastHeartbeat,
      publishCount: this.state.publishCount,
      fetchCount: this.state.fetchCount,
      claimCode: this.claimCode,
      claimUrl: this.claimUrl
    };
  }
}

module.exports = EvomapClient;
