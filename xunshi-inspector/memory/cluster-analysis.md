# 7节点 OpenClaw 集群系统分析

## 集群概览

| # | 主机名 | IP | 角色 | 主要功能 |
|---|--------|-----|------|----------|
| 1 | 7zi.com | 165.99.43.61 | Coordinator | 集群管理, API统一入口 |
| 2 | bot.szspd.cn | - | Worker | Polymarket交易机器人 |
| 3 | bot2.szspd.cn | - | Worker | OpenClaw节点 |
| 4 | bot3.szspd.cn | - | Worker + Evolver | 技能进化引擎 |
| 5 | bot4.szspd.cn | - | Worker | OpenClaw节点 |
| 6 | bot5 (182.43.36.134) | 182.43.36.134 | Worker | OpenClaw节点 |
| 7 | bot6.szspd.cn | 109.123.246.140 | Worker | Picoclaw (新部署) |

## 密码
- 统一密码: `[REDACTED]`

## 已配置的 LLM Provider

### 7zi.com (Coordinator)
1. **volcengine-2** - 火山引擎 (Doubao)
2. **alibaba** - 阿里云 (Qwen系列)
3. **newcli-droid** - Claude (Opus, Sonnet)
4. **newcli-codex** - GPT-5 Codex
5. **siliconflow** - 硅基流动 (Qwen 2.5, DeepSeek)
6. **qiniu** - 七牛云 (Qwen Turbo)

### bot6.szspd.cn (Picoclaw)
- newcli-droid: Claude Opus 4.6, Sonnet 4.6

## 核心系统

### 1. LLM 统一 API (llm-unified-api.js)
- 端口: 11434
- 功能: 多Provider自动故障转移
- 健康检查机制
- 延迟监控
- 优先级路由

### 2. 技能进化系统 (Capability Evolver)
- 位置: bot3.szspd.cn ~/evolver/
- 功能: AI Agent自我进化
- GEP协议约束
- 自动日志分析
- 信号去重

### 3. 交易机器人 (Polymarket)
- 位置: bot.szspd.cn /home/admin/clawd/polymarket-trading/
- 多个AI交易策略

### 4. Picoclaw
- 已在所有7台机器上安装
- 准备替代OpenClaw
- 配置: ~/.picoclaw/config.json

## 自动化任务

每5分钟执行:
- openclaw-evomap (技能优化)
- watchdog 监控脚本
- cluster-agent 监控

## 技能统计

- 7zi.com: 83个技能
- 各节点通过cluster_report.json同步

## 待解决问题

### API 路由与探针
1. ✅ 已有 llm-unified-api.js 实现基础故障转移
2. ❌ 缺乏实时统计面板
3. ❌ 缺乏自动Key轮换
4. ❌ 缺乏使用量统计

---

*最后更新: 2026-02-28*
