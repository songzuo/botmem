# 🤖 集群自治工作机制知识库

> **巡视经理** 整理
> **来源**: bot3 /root/projects/workspace 和 /root/.openclaw
> **日期**: 2026-02-28

---

## 📋 目录

1. [核心自治原则](#核心自治原则)
2. [自我驱动循环](#自我驱动循环)
3. [任务调度系统](#任务调度系统)
4. [心跳机制](#心跳机制)
5. [健康监控](#健康监控)
6. [工具箱](#工具箱-约50个工具)
7. [定时任务](#定时任务)
8. [可复用的组件](#可复用的组件)

---

## 🎯 核心自治原则

### 问题解决方法论（闭环）
```
思考 → 研究 → 学习 → 发散 → 收敛 → 执行 → 验证 → 固化 → 循环
```

**关键原则：**
- 一个问题可能有多个相关组件
- 修复后必须验证
- 验证后必须固化
- 形成独立、自治的闭环系统

### 机器自治 vs 人类可视化
- ❌ 不需要: Prometheus/Grafana监控（给人看）
- ❌ 不需要: Web UI、仪表盘
- ✅ 需要: 机器可读JSON/日志、自动化脚本、API接口
- ✅ 需要: 自主决策和执行，无需人类参与

### 自主决策权限（无需请示）
- ✅ 进程重复检测和清理
- ✅ 内存/CPU异常处理
- ✅ 节点健康恢复
- ✅ 日常维护任务

### 需要请示的情况
- ❌ 外部通信（邮件、消息推送）
- ❌ 金钱或敏感操作
- ❌ 不确定的破坏性操作
- ❌ 配置修改（模型配置、API key等敏感操作）

### 安全规范
- **永远不要Read并输出包含密钥的配置文件** — 用gateway config.get（自动脱敏）
- **敏感配置修改前必须汇报方案，等确认后再执行**
- **"测试成功再加入"≠ 测试完直接加入** — 中间必须有汇报+确认环节

---

## 🔄 自我驱动循环

### self-driving-system.sh 完整流程
```
┌─────────────────────────────────────────────────────────┐
│                    自主执行循环                          │
├─────────────────────────────────────────────────────────┤
│  阶段1: 系统评估 (autonomous-executor.sh assess)        │
│  ↓                                                     │
│  阶段2: 数据分析 (auto-analyzer.sh)                    │
│  ↓                                                     │
│  阶段3: 任务规划 (auto-planner.sh)                     │
│  ↓                                                     │
│  阶段4: 执行计划 (autonomous-executor.sh)              │
│  ↓                                                     │
│  阶段5: 结果验证                                        │
│  ↓                                                     │
│  阶段6: 知识固化 (更新记忆和文档)                       │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 任务调度系统

### task_scheduler.py 命令
```bash
# 查看任务看板
python3 tools/task_scheduler.py dashboard

# 获取下一个任务
python3 tools/task_scheduler.py next

# 任务状态管理
python3 tools/task_scheduler.py start <id>           # 开始任务
python3 tools/task_scheduler.py step <id> <name>     # 更新步骤
python3 tools/task_scheduler.py resume-info <id> <instructions>  # 写恢复指令
python3 tools/task_scheduler.py complete <id>        # 完成
python3 tools/task_scheduler.py suspend <id>          # 挂起
python3 tools/task_scheduler.py block <id>           # 阻塞

# 恢复中断任务
python3 tools/task_scheduler.py recover
```

### 任务状态流转
```
pending → assigned → running → completed
                ↓           ↓
              failed    suspended (可恢复)
                         blocked (需人工)
```

---

## ❤️ 心跳机制

### heartbeat-manager.py
```bash
# 心跳检查
python3 tools/heartbeat-manager.py ping

# 恢复检查
python3 tools/heartbeat-manager.py recover
```

### 断点续传流程 (最高优先级)
```
1. checkpoint_manager.recover → 检查是否需要恢复
2. task_scheduler.recover → 检查阻塞任务
3. 解析恢复指令 (resume_instructions)
4. 为每个任务启动子agent
5. 更新任务状态
6. 回复恢复摘要
```

### 标准化心跳任务
```bash
# 1. 断点续传检查
python3 checkpoint_manager.py recover

# 2. 任务恢复检查
python3 task_scheduler.py recover

# 3. 记录心跳ping
python3 checkpoint_manager.py ping

# 4. SSH连通性快检
for node in 7zi.com bot bot2 bot3 bot4 bot5; do
  timeout 8 ssh -o ConnectTimeout=5 root@$node "hostname"
done

# 5. 内存/磁盘检测 (>85% 报告)
free | awk 'NR==2{printf "%.0f", $3*100/$2}'
df / | awk 'NR==2{gsub(/%/,""); print $5}'

# 6. evomap进程清理 (>20 自动清理)
ps aux | grep evomap | grep -v grep | wc -l
```

---

## 💊 健康监控

### 检查项目
| 项目 | 阈值 | 动作 |
|------|------|------|
| SSH连通性 | 失败 | 报告 |
| 内存使用 | >85% | 报告 |
| 磁盘使用 | >85% | 报告 |
| evomap进程 | >20 | 自动清理 |
| 负载 | >10 | 报告 |

### 远程重启机制
- **问题**: SSH无法登录时无法重启
- **方案**: 
  1. 云平台API重启（阿里云/腾讯云/火山引擎）
  2. watchdog自动重启（内存>95%或负载>10）
  3. 脚本: remote-reboot-manager.py

---

## 🛠️ 工具箱 (约50个)

### 核心工具 (tools/)

| 工具 | 功能 |
|------|------|
| cluster-coordinator-api.py | 集群协调器API - 节点注册、任务分配 |
| cross-node-task-scheduler.py | 跨节点任务调度 |
| model-auto-switcher.py | 模型自动切换 |
| cluster-knowledge-evolver.py | 知识进化 |
| multi-node-developer.py | 多节点开发 |
| parallel-execution-engine.py | 并行执行引擎 |
| system-optimizer.py | 系统优化 |
| heartbeat-manager.py | 心跳管理 |
| node-watchdog.py | 节点看门狗 |
| security-audit-system.py | 安全审计 |
| cloud-api-rebooter.py | 云API重启 |
| smart-model-router.py | 智能模型路由 |
| auto-model-switcher.py | 自动模型切换 |
| model-usage-probe.py | 模型使用探测 |

### 自动化脚本 (scripts/)

| 脚本 | 功能 |
|------|------|
| self-driving-system.sh | **自我驱动系统** - 完整自主循环 |
| autonomous-executor.sh | 自主执行器 |
| auto-analyzer.sh | 自动分析器 |
| auto-planner.sh | 自动规划器 |
| auto-reporter.sh | 自动报告器 |
| self-healing.sh | 自我修复 |
| self-learning-framework.sh | 自我学习框架 |
| cluster-autonomous.py | 集群自治 |
| heartbeat-check-and-task-management.sh | 心跳+任务管理 |
| cluster-health-check.sh | 集群健康检查 |
| parallel-status.sh | 并行状态监控 |

---

## ⏰ 定时任务

### 现有Cron Jobs (bot3)

| 任务 | 频率 | 类型 | Job ID |
|------|------|------|--------|
| 自动化实时状态报告 | 每1小时 | isolated/agentTurn | 60c26f34-... |
| 集群主管-自主思考+任务调度 | 每2小时 | isolated/agentTurn | 34d92ec8-... |
| 集群主管-每日报告 | 每天 00:00 | isolated/agentTurn | 47fecedd-... |
| EvoMap知识循环 | 每6小时 | isolated/agentTurn | - |
| 自主思考 | 每6小时 | isolated/agentTurn | - |
| 每周分析 | 周一 09:00 | isolated/agentTurn | - |

### 定时任务管理
```bash
# Cron管理器
scripts/cron-manager.sh

# 查看运行历史
ls /root/.openclaw/cron/runs/
```

---

## 📁 关键目录结构

### bot3.szspd.cn

```
/root/projects/workspace/          # ★ 前任工作区 (重要!)
│
├── tools/                       # 50+ 核心工具
│   ├── cluster-coordinator-api.py
│   ├── task_scheduler.py
│   ├── heartbeat-manager.py
│   └── ...
│
├── scripts/                     # 自动化脚本
│   ├── self-driving-system.sh  # ★ 自主驱动核心
│   ├── autonomous-executor.sh
│   ├── auto-analyzer.sh
│   ├── auto-planner.sh
│   └── ... (50+ 脚本)
│
├── docs/                        # 文档
│   ├── PAIRING_GUIDE.md
│   └── CRON_SETUP.md
│
├── memory/                      # 记忆
│   └── executor-logs/
│
├── AGENTS.md                    # Agent规范
├── SOUL.md                      # ★ 核心原则 (问题闭环)
├── MEMORY.md                    # ★ 长期记忆
├── HEARTBEAT.md                 # 心跳任务定义
├── STATUS.md                    # 状态报告
└── FINAL_REPORT.md              # 初始化报告

/root/.openclaw/                 # OpenClaw工作区
│
├── cron/jobs.json               # ★ 定时任务配置
│
├── devices/paired.json          # 配对设备
│
├── extensions/                  # 插件
│   ├── ddingtalk/               # 钉钉
│   ├── qqbot/                   # QQ
│   └── wecom/                   # 企业微信
│
└── workspace/                   # 当前工作区
    ├── tools/
    ├── HEARTBEAT.md
    └── IDENTITY.md
```

---

## 🔧 可复用的组件

### 1. 节点注册 (cluster-coordinator-api.py)
```python
@dataclass
class Node:
    node_id: str
    hostname: str
    role: str           # coordinator/worker/manager
    status: str         # online/offline/busy
    resources: Dict     # cpu, memory, disk
    capabilities: List[str]
    address: str
```

### 2. 任务状态机 (task_scheduler.py)
```python
状态:
- pending    → 等待分配
- assigned   → 已分配给节点
- running    → 正在执行
- completed  → 成功完成
- failed     → 执行失败
- suspended  → 暂停 (可恢复)
- blocked    → 阻塞 (需人工介入)
```

### 3. 标准化健康检查
```bash
# SSH连通性
timeout 8 ssh -o ConnectTimeout=5 root@$node "hostname"

# 资源使用
free | awk 'NR==2{printf "%.0f", $3*100/$2}'   # 内存%
df / | awk 'NR==2{gsub(/%/,""); print $5}'     # 磁盘%
uptime | awk -F'load average:' '{print $2}'    # 负载

# 进程管理
ps aux | grep evomap | grep -v grep | wc -l
```

### 4. 报告到钉钉
```bash
python3 scripts/telegram-notifier.py --channel ddingtalk --message "..."
```

---

## 📌 节点列表与角色

| 节点 | Hostname | IP | 角色 | 状态 |
|------|----------|-----|------|------|
| 7zi.com | 7zi.com | 165.99.43.61 | **协调经理** | ✅ |
| bot | bot.szspd.cn | - | 交易机器人 | ✅ |
| bot2 | bot2.szspd.cn | - | Worker | ✅ |
| bot3 | bot3.szspd.cn | - | **经理 (Evolver)** | ✅ |
| bot4 | bot4.szspd.cn | - | Worker | ✅ |
| bot5 | 182.43.36.134 | 182.43.36.134 | Worker | ✅ |
| bot6 | bot6.szspd.cn | 109.123.246.140 | 测试机 | ✅ |

### SSH密码 (统一)
```
[REDACTED]
```

---

## 🎯 团队角色定义

| 角色 | 机器 | 核心职责 | 标志性文件 |
|------|------|----------|------------|
| **协调经理** | 7zi.com | 配置中心、整体协调 | ansible/ |
| **经理 (Evolver)** | bot3.szspd.cn | 技能进化、任务调度 | self-driving-system.sh |
| **巡视经理** | 我 | 知识管理、监督探索 | (本知识库) |
| **测试机** | bot6 | 新功能测试 | smart-router |

---

## 🚀 应用到我们团队

### 可直接复制的模式
1. **问题闭环** - 任何问题都走 思考→研究→学习→发散→收敛→执行→验证→固化
2. **心跳机制** - 定时自检 + 断点续传
3. **任务状态机** - pending→assigned→running→completed
4. **健康阈值** - 内存>85%、磁盘>85%、进程>20
5. **自主权限清单** - 明确哪些可以自动，哪些要请示

### 需要我们定制的
1. 我们的定时任务 (根据业务需求)
2. 我们的报告机制 (钉钉/Telegram)
3. 我们的工具箱 (基于bot3但精简)
4. 我们的协作模式 (7台机器分工)

---

*巡视经理 整理*
*来源: bot3 /root/projects/workspace & /root/.openclaw*
*日期: 2026-02-28*
