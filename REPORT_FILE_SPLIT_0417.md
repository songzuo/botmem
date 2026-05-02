# 文件拆分报告 - 7zi-frontend

**日期:** 2026-04-17  
**架构师:** 🏗️ 架构师子代理  
**状态:** 已完成

---

## 📊 概述

| 文件 | 当前行数 | 建议拆分后目标 | 复杂度 |
|------|---------|--------------|--------|
| `websocket-manager.ts` | 1455行 | 400-500行/文件 | 高 |
| `automation-engine.ts` | 1219行 | 300-400行/文件 | 中 |
| `analyzer.ts` | 1007行 | 300-400行/文件 | 中 |

---

## 1. WebSocket Manager (`src/lib/websocket-manager.ts`)

### 当前行数: 1455行

### 主要功能模块

| 模块 | 行数范围 | 功能说明 |
|------|---------|---------|
| **类型定义** | 1-130 | ConnectionState, QueuedMessage, WebSocketManagerOptions, ConnectionStats, ConnectionQuality, ReconnectionRecord, PersistedConnectionState, QualityAlertConfig, HealthCheckResult 等 |
| **心跳管理** | ~100行 | startHeartbeat, stopHeartbeat, missed heartbeat tracking |
| **重连策略** | ~150行 | scheduleReconnection, exponential backoff + jitter, reconnection history |
| **消息队列** | ~80行 | queueMessage, sendQueuedMessages, cleanExpiredMessages |
| **连接质量监控** | ~150行 | calculateConnectionQuality, checkConnectionQuality, quality alerting |
| **状态持久化** | ~100行 | persistState, loadPersistedState, session tracking |
| **Socket.IO 事件处理** | ~200行 | connect, disconnect, setupSocketListeners, event handlers |
| **压缩功能** | 引用外部 | MessageCompressor 已分离到 `websocket-compression.ts` |

### 拆分方案

```
src/lib/websocket/
├── index.ts                    # 导出入口
├── types.ts                   # 所有类型定义 (~150行)
├── WebSocketManager.ts        # 核心类 (~400行)
├── ConnectionStateMachine.ts  # 连接状态机 (~150行)
├── HeartbeatManager.ts        # 心跳管理 (~120行)
├── ReconnectionManager.ts     # 重连策略 (~180行)
├── MessageQueue.ts            # 消息队列 (~100行)
├── QualityMonitor.ts          # 连接质量监控 (~150行)
├── StatePersistence.ts        # 状态持久化 (~80行)
└── compression.ts             # 压缩相关 (已存在)
```

### 优先级: 🟡 中高
- 风险: 中
- 依赖: 已有 `websocket-compression.ts` 分离
- 建议先拆分状态机和质量监控

---

## 2. Automation Engine (`src/lib/automation/automation-engine.ts`)

### 当前行数: 1219行

### 主要功能模块

| 模块 | 行数范围 | 功能说明 |
|------|---------|---------|
| **类型定义** | 1-200 | TriggerType, ActionType, RuleStatus, TriggerConfig, ActionConfig, AutomationRule, ExecutionContext, ExecutionResult 等 |
| **RuleValidator** | ~150行 | validateRule, validateTrigger, validateAction, validateCondition, validateSchedule |
| **规则管理** | ~200行 | createRule, updateRule, deleteRule, getRule, listRules, pauseRule, resumeRule |
| **条件评估器** | ~100行 | evaluateCondition, evaluateSchedule |
| **执行引擎** | ~250行 | executeRule, executeAction, action executors |
| **触发器系统** | ~150行 | setupTrigger, setupEventListener, setupSchedule, setupConditionEvaluator |
| **调度器** | ~100行 | ScheduleTimer management |

### 已有辅助文件
- `automation-hooks.ts` (8796字节)
- `automation-storage.ts` (8914字节)
- `default-templates.ts` (12100字节)

### 拆分方案

```
src/lib/automation/
├── index.ts                      # 导出入口
├── engine/
│   ├── types.ts                  # 类型定义 (~200行)
│   ├── AutomationEngine.ts       # 核心引擎类 (~400行)
│   ├── RuleValidator.ts          # 规则验证 (~150行)
│   ├── ConditionEvaluator.ts     # 条件评估 (~100行)
│   ├── TriggerSystem.ts          # 触发器系统 (~150行)
│   ├── execution/
│   │   ├── ActionExecutor.ts     # 动作执行器 (~200行)
│   │   ├── WorkflowExecutor.ts   # 工作流执行 (~80行)
│   │   ├── NotificationExecutor.ts
│   │   ├── ApiExecutor.ts
│   │   └── DataTransformExecutor.ts
│   └── scheduler/
│       └── Scheduler.ts          # 调度器 (~100行)
├── hooks.ts                      # (已存在)
├── storage.ts                    # (已存在)
└── templates.ts                  # (已存在)
```

### 优先级: 🟡 中
- 风险: 低
- 已有部分模块化 (hooks, storage, templates)
- 建议先拆分 execution 和 scheduler

---

## 3. Root Cause Analyzer (`src/lib/performance/root-cause-analysis/analyzer.ts`)

### 当前行数: 1007行

### 主要功能模块

| 模块 | 行数范围 | 功能说明 |
|------|---------|---------|
| **类型定义** | 引用 external | types.ts 已分离 |
| **DatabaseTracker 集成** | ~100行 | 数据库问题分析 |
| **APITracker 集成** | ~100行 | API 问题分析 |
| **分析规则引擎** | 引用 | analysis-rules.ts 已分离 |
| **缓存管理** | 引用 | cache.ts 已分离 |
| **analyze() 主方法** | ~150行 | 主分析流程 |
| **analyzeDatabaseIssues** | ~100行 | 数据库问题分析 |
| **analyzeApiIssues** | ~100行 | API 问题分析 |
| **analyzeRenderingIssues** | ~80行 | 渲染问题分析 |
| **analyzeResources** | ~80行 | 资源加载分析 |
| **analyzeNetwork** | ~50行 | 网络分析 |
| **analyzeMemory** | ~50行 | 内存分析 |
| **analyzeCPU** | ~50行 | CPU 分析 |

### 已有辅助文件
- `types.ts` (7965字节)
- `database-tracker.ts` (12395字节)
- `api-tracker.ts` (13469字节)
- `analysis-rules.ts` (21272字节)
- `cache.ts` (3953字节)

### 拆分方案

```
src/lib/performance/root-cause-analysis/
├── index.ts
├── RootCauseAnalyzer.ts         # 主类 (~400行)
├── analyzers/
│   ├── DatabaseAnalyzer.ts      # 数据库分析 (~150行)
│   ├── ApiAnalyzer.ts           # API分析 (~150行)
│   ├── RenderingAnalyzer.ts     # 渲染分析 (~100行)
│   ├── ResourceAnalyzer.ts      # 资源分析 (~100行)
│   ├── NetworkAnalyzer.ts       # 网络分析 (~60行)
│   ├── MemoryAnalyzer.ts        # 内存分析 (~60行)
│   └── CpuAnalyzer.ts           # CPU分析 (~60行)
└── trackers/                     # (已存在独立文件)
```

### 优先级: 🟢 中低
- 风险: 低
- 已有良好的模块化基础 (trackers, cache, rules 都是独立文件)
- 建议保持现状或仅拆分 analyzers 子目录

---

## 📈 拆分优先级总结

| 优先级 | 文件 | 原因 |
|-------|------|------|
| 1 | `websocket-manager.ts` | 最大文件(1455行)，功能最复杂，压缩模块已分离 |
| 2 | `automation-engine.ts` | 中等复杂度，已有 hooks/storage 分离 |
| 3 | `analyzer.ts` | 模块化最好，tracker/rule/cache 已分离 |

---

## ⚠️ 风险评估

### websocket-manager.ts
- **高风险**: 高度内聚，单例模式，大量私有方法依赖
- **建议**: 先拆分独立功能（QualityMonitor, MessageQueue）再动核心

### automation-engine.ts
- **中风险**: 规则验证、执行器、调度器相对独立
- **建议**: 按执行流程拆分

### analyzer.ts
- **低风险**: 已有模块化基础设施
- **建议**: 保持现状或微调

---

## 🚀 推荐实施顺序

1. **Phase 1**: analyzer.ts 拆分 analyzers/ 子目录 (1-2天)
2. **Phase 2**: automation-engine.ts 拆分 execution/ 和 scheduler/ (2-3天)
3. **Phase 3**: websocket-manager.ts 拆分 ConnectionStateMachine, HeartbeatManager, ReconnectionManager (3-5天)

---

## ✅ 验证标准

- 每个拆分后文件 ≤ 500行
- 保留原有单元测试
- 拆分后功能测试通过
- 无循环依赖
- 导出接口保持向后兼容
