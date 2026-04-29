# 🛡️ 系统健康检查报告

**检查时间**: 2026-04-17 00:59 GMT+2  
**检查服务器**: bot6 (本机)

---

## 📊 1. 服务器资源状态

### 内存 (free -h)
| 类型 | 总计 | 已用 | 可用 | 可用(含cache) |
|------|------|------|------|---------------|
| Mem | 7.8Gi | 6.0Gi | 159Mi | 1.8Gi |
| Swap | 4.0Gi | 2.8Gi | 1.2Gi | - |

**⚠️ 警告**: 物理内存使用率 77% (6.0Gi/7.8Gi)，可用仅 159Mi，Swap 使用率 70% (2.8Gi/4Gi)。系统内存压力较大。

### 磁盘 (df -h)
| 分区 | 大小 | 已用 | 可用 | 使用率 |
|------|------|------|------|--------|
| /dev/sda1 | 145G | 66G | 79G | 46% |
| /boot | 881M | 117M | 703M | 15% |
| /boot/efi | 105M | 6.2M | 99M | 6% |
| tmpfs | 795M | 2M | 793M | 1% |
| tmpfs | 3.9G | 0 | 3.9G | 0% |

**✅ 正常**: 根分区 46% 使用率，磁盘空间充足。

---

## 🔧 2. PM2 进程状态

**❌ PM2 未安装或未运行**

```
/usr/bin/bash: line 1: pm2: command not found
```

---

## 🐳 3. Docker 容器状态

| 容器名 | 镜像 | 状态 | 端口 |
|--------|------|------|------|
| adminui | wlove/im-admin:prod-logs-v1.1 | ✅ Up 18h | - |
| adminvs | adminvs:v2.0 | ✅ Up 18h | 0.0.0.0:8111->8111/tcp |
| microclaw | microclaw:latest | ⚠️ Up 12h (Down 24h?) | 0.0.0.0:28790->28790/tcp |
| redis-dating | redis:7.4 | 🔴 Created (未启动) | - |
| mysql-dating | mysql:8.0.31 | ✅ Up 37h | 0.0.0.0:3306->3306/tcp |
| 7zi-health-service | monitoring_health-service | ✅ Up 11d (healthy) | 0.0.0.0:8085->8085/tcp |
| 7zi-grafana | grafana:10.2.2 | 🔴 Exited (1) 11d ago | - |
| 7zi-alertmanager | prom/alertmanager:v0.26.0 | ✅ Up 3d (healthy) | 0.0.0.0:9093->9093/tcp |
| 7zi-loki | grafana/loki:2.9.3 | ✅ Up 12d (healthy) | 0.0.0.0:3100->3100/tcp |
| 7zi-prometheus | prom/prometheus:v2.48.0 | ✅ Up 3d (healthy) | 0.0.0.0:9090->9090/tcp |
| 7zi-node-exporter | prom/node-exporter:v1.7.0 | ✅ Up 11d (healthy) | 0.0.0.0:9101->9100/tcp |
| 7zi-pushgateway | prom/pushgateway:v1.6.1 | ✅ Up 12d (healthy) | 0.0.0.0:9091->9091/tcp |
| 7zi-cadvisor | cadvisor:v0.47.2 | ✅ Up 12d (healthy) | 0.0.0.0:8080->8080/tcp |

**问题容器**:
- 🔴 `redis-dating` - Created 但未启动
- 🔴 `7zi-grafana` - Exited (1) 异常退出

---

## 📋 4. Git 状态

**分支**: main  
**状态**: 本地领先 origin/main 1 个提交

### 最近 5 次提交
```
ef2b25426 docs: add Unreleased section to CHANGELOG for v1.14.1
88d3f9e18 docs: 更新记忆文件
87e267d2d docs: 更新记忆文件
845fc2c71 feat: Next.js 15 async params migration + SentimentAnalyzer FMM tokenization
a7e1d19f2 docs: 更新记忆文件
```

### 未提交更改 (47个文件)
**主要修改**:
- `7zi-frontend/` - 前端代码和测试文件
- `src/` - 核心应用代码
- `API.md`, `README.md`, `MEMORY.md`, `HEARTBEAT.md` - 文档
- `pnpm-lock.yaml` - 依赖锁文件
- `src/workflows/` - 工作流引擎
- `monitoring/` - 监控配置

### 新文件 (未跟踪)
- `AGENT_WORLD_STRATEGY_v200.md`
- `ARCHITECTURE_REVIEW_v2.md`
- `FINANCIAL_ANALYSIS.md`
- `ROADMAP_v1.14.0.md`
- `src/lib/workflow/WorkflowExecutor.ts`

---

## 📝 5. 日志检查

**日志目录**: `/root/.openclaw/logs/` 存在但为空  
**仅有文件**: `config-audit.jsonl` (35KB)

---

## 🚨 问题汇总

| 优先级 | 问题 | 建议 |
|--------|------|------|
| 🔴 高 | 内存压力严重 (77%使用, Swap 70%) | 考虑增加内存或优化应用 |
| 🔴 高 | `redis-dating` 容器未启动 | 检查 Redis 配置 |
| 🔴 高 | `7zi-grafana` 异常退出 | 检查 Grafana 配置和日志 |
| ⚠️ 中 | PM2 未安装 | 如需进程管理，考虑安装 |
| ⚠️ 中 | 47 个文件未提交 | 建议尽快提交或备份 |
| ⚠️ 中 | `microclaw` 容器 uptime 不一致 | 确认服务运行状态 |

---

## ✅ 正常服务

- MySQL 数据库运行正常
- 监控堆栈 (Prometheus/Loki/Alertmanager/Cadvisor) 全部健康
- AdminVS 和 AdminUI 服务正常运行
- 磁盘空间充足

---

*报告生成时间: 2026-04-17 00:59 GMT+2*
