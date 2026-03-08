---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: d83838e3c0b2e7e55be38636547ddbd5
    PropagateID: d83838e3c0b2e7e55be38636547ddbd5
    ReservedCode1: 3046022100b411e6c5691d88a2e682e5b52c4eeb485d2ffd9d48a8d92be87ca0596ead3a75022100c180e3f873d878d652d1fccc5f181d3b0351772e8553b5171f6d53df776e995f
    ReservedCode2: 304402200d6c10c2b66799183b56bab79cc5568dd13016c72e5eb4db5172d4fab26f988d02203f8c28b0d54f814539f76cfb5afe17d966a84e53bc550dc4f7742c27b858c64f
---

# 🔍 集群巡视观察报告

**日期**: 2026-03-02
**巡视经理**: Xun Shi (巡视)
**状态**: 观察员模式 - 仅收集信息,不做修改

---

## 📊 节点状态总览

| 节点 | 主机名 | 运行时间 | 负载 | 状态 | 备注 |
|------|--------|----------|------|------|------|
| bot3 | VM-0-4-opencloudos | 16天 | 0.00 | ✅ 在线 | Manager (Evolver) |
| bot | bot | 4天48分 | 0.17 | ✅ 在线 | 交易机器人 |
| bot2 | bot2 | 17天20时 | 0.02 | ✅ 在线 | Worker |
| bot4 | - | - | - | ❌ 离线 | **需要检查** |
| bot5 | ecm-cd59 | 4天44分 | 0.00 | ✅ 在线 | Worker |
| bot6 | bot6 | 2天7时 | 0.52 | ✅ 在线 | 测试机 |
| 7zi | 7zi | 4天7时 | 2.57 | ⚠️ 忙碌 | 协调经理 |

---

## 💻 资源使用详情

### bot3 (Evolver/Manager)
- **内存**: 3.6GB total, 1.4GB used (40%)
- **磁盘**: 40GB, 27GB used (68%)
- **Swap**: 8GB, 257MB used
- **主要进程**:
  - openclaw-gateway (13.3% mem)
  - openclaw-node (5.8% mem)
  - evomap-daemon.js
  - tailscaled

### bot (交易)
- **内存**: 1.8GB, 948MB used (51%)
- **磁盘**: 40GB, 9.8GB used (27%)
- **Swap**: 无
- **主要进程**:
  - moltbot-gateway (19.2% mem)
  - polymarket-trading (multiple instances)
  - intelligent-trader.mjs

### bot2 (Worker)
- **内存**: 1.8GB, 1.1GB used (61%)
- **磁盘**: 40GB, 18GB used (49%)
- **Swap**: 无
- **主要进程**:
  - openclaw-gateway (18.3% mem)
  - searxng worker
  - openclaw-evomap.js

### bot5 (Worker)
- **内存**: 1.9GB, 731MB used (38%)
- **磁盘**: 40GB, 12GB used (30%)
- **Swap**: 2GB, 27MB used
- **主要进程**:
  - openclaw-gateway (21.9% mem)
  - autonomous-agent.js
  - eShield-modules

### bot6 (测试机)
- **内存**: 7.8GB, 959MB used (12%)
- **磁盘**: 145GB, 6.5GB used (5%)
- **Swap**: 无
- **主要进程**:
  - openclaw-gateway (4.7% mem)
  - autonomy.js
  - autonomous-agent-v3.js

### 7zi (协调)
- **内存**: (未获取)
- **磁盘**: (未获取)
- **负载**: 2.57 (较高)
- **状态**: 握手超时

---

## ⚠️ 发现的问题

### 1. bot4 离线
- **状态**: 完全无法连接
- **可能原因**: 
  - 网络问题
  - SSH服务未运行
  - 机器宕机

### 2. bot3 智能路由未运行
- **状态**: smart-router-full.js 进程不存在
- **端口11435**: 未被监听
- **影响**: 17个LLM提供商无法自动切换

### 3. 7zi 响应超时
- **状态**: SSH握手超时
- **负载**: 2.57 (偏高)

---

## 📋 建议观察事项

### 优先级高
1. **检查bot4**: 确认机器状态,恢复连接
2. **重启bot3路由**: 部署smart-router到bot3
3. **检查7zi**: 确认高负载原因

### 优先级中
4. **检查bot2内存**: 61%使用率,接近阈值
5. **统一进程管理**: 部分节点有多个实例

### 优先级低
6. **文档更新**: 更新集群配置
7. **脚本标准化**: 统一心跳/监控脚本

---

## 🔧 不做事项 (观察员原则)

- ❌ 不修改任何配置文件
- ❌ 不重启任何服务
- ❌ 不删除任何文件
- ❌ 不部署新代码

**仅观察和记录,等待指令后执行**

---

*巡视经理 观察报告*
*持续更新中...*

---

## 🔍 新发现: 7zi 详细分析

### 发现的问题
1. **双Gateway进程**: 7zi上运行着两个OpenClaw Gateway进程:
   - `openclaw/dist/index.js gateway --port 18789` - **CPU 135%** (异常高!)
   - `openclaw-gateway` - 另一个实例
   
2. **额外服务**:
   - picoclaw gateway 也在运行
   - 1Panel管理面板
   - node_exporter
   - Docker
   - Redis

### 网络端口
- 18789: OpenClaw Gateway
- 18791-18792: 其他OpenClaw端口
- 5171-5177: 1Panel服务
- 443: HTTPS

### 建议
- **优先级高**: 检查为什么第一个Gateway进程占用135% CPU
- 可能存在: 死循环, 内存泄漏, 或繁忙的agent任务


---

## 🔍 Bot 交易进程分析

### 运行的交易进程
1. `intelligent-trader.mjs` - 2个实例
2. `intelligent-trader-v3.mjs` - 1个实例
3. `moltbook-auto-advanced-fixed.mjs` - 1个实例
4. `moltbook-auto-current.mjs` - 1个实例
5. `moltbot-gateway` - 交易网关

### 备注
- 所有进程都在活跃运行
- 多个策略同时执行
- 这是正常的交易机器人配置


---

## 💾 磁盘使用情况

| 节点 | 磁盘使用 | 状态 |
|------|----------|------|
| bot3 | 68% | ✅ 正常 |
| bot2 | 49% | ✅ 正常 |
| bot5 | 30% | ✅ 正常 |
| bot | 27% | ✅ 正常 |
| bot6 | 5% | ✅ 正常 |

**结论**: 所有节点磁盘使用正常,无告警


---

## 📍 18:57 状态更新

| 节点 | 负载 | 状态 |
|------|------|------|
| bot3 | 低 | ✅ |
| bot | 低 | ✅ |
| bot2 | - | (未检查) |
| bot6 | 低 | ✅ |
| bot5 | 0.25 | ✅ |

**结论**: 6/7节点在线, bot4仍然离线

