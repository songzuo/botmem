# 7zi-frontend 架构健康报告
**日期:** 2026-04-17
**分析范围:** `src/lib/` + `src/components/`

---

## 1. 项目规模统计

| 指标 | 数值 |
|------|------|
| TypeScript 文件总数 | **865** |
| `src/lib/` 目录数 | **85** |
| `src/components/` 目录数 | **48** |
| `src/lib/*.ts` 文件数 | 338 |
| `src/lib/*.tsx` 文件数 | 8 |

### 目录结构概览

```
src/
├── lib/          (85 子目录, 338+ .ts 文件) ← 核心业务逻辑层
├── components/   (48 子目录)               ← UI 组件层
├── app/          (Next.js App Router)
├── contexts/
├── features/
├── hooks/
├── stores/
├── styles/
└── ...
```

---

## 2. 核心模块列表 (`src/lib/`)

按功能域分组，模块非常丰富：

| 模块 | 说明 |
|------|------|
| **agents/** | 智能体 + 学习 + 调度 |
| **ai/** | AI 对话 (dialogue) |
| **api/** | API 客户端 (含 rooms 子模块) |
| **audio/** | 音频处理 |
| **auth/** | 认证 |
| **automation/** | 自动化引擎 |
| **cache/** | 缓存 |
| **collab/** | 协作 (CRDT, conflict-resolver, cursor-sync) |
| **db/** | 数据库 (草稿、反馈、query-optimizer) |
| **editors/** | 编辑器 |
| **i18n/** | 国际化 |
| **keyboard/** | 快捷键管理 |
| **knowledge/** | 知识库 |
| **mcp/** | MCP 协议 |
| **middleware/** | 中间件 |
| **monitoring/** | 监控 (client + server channels) |
| **offline/** | 离线支持 |
| **performance/** | 性能分析、告警、根因分析、预算控制 |
| **pwa/** | PWA |
| **rate-limit/** | 限流 |
| **reporting/** | 报告生成 |
| **search/** | 搜索 |
| **security/** | 安全 |
| **seo/** | SEO |
| **services/** | 通知系统 (9个文件 + 6个测试) |
| **storage/** | 存储抽象 |
| **theme/** | 主题 |
| **tools/** | 工具函数 |
| **utils/** | 通用工具 |
| **validation/** | 校验 |
| **webhook/** | Webhook |
| **workflow(s)/** | 工作流 (两套并存!) |
| **websocket-manager.ts** | WebSocket 管理 (单文件, 1455行) |

---

## 3. 超大文件列表

### `src/lib/` 中超过 1000 行的文件

| 文件 | 行数 | 类型 |
|------|------|------|
| `websocket-manager.ts` | **1455** | ⚠️ 核心文件，需要拆分 |
| `monitoring/__tests__/integration.test.ts` | 1251 | 测试 |
| `automation/automation-engine.ts` | 1219 | ⚠️ 核心文件 |
| `services/__tests__/notification-service.edge-cases.test.ts` | 1218 | 测试 |
| `monitoring/__tests__/alert-engine.test.ts` | 1143 | 测试 |
| `services/__tests__/notification-enhanced.test.ts` | 1098 | 测试 |
| `automation/__tests__/automation-engine.test.ts` | 1090 | 测试 |
| `performance/alerting/__tests__/alerter.test.ts` | 1080 | 测试 |
| `automation/__tests__/automation-integration.test.ts` | 1076 | 测试 |
| `performance/root-cause-analysis/analyzer.ts` | 1007 | ⚠️ 接近阈值 |

### `src/components/` 中最大组件 (Top 10)

| 组件 | 行数 | 复杂度 |
|------|------|--------|
| `feedback/FeedbackAdminPanel.tsx` | 988 | ⚠️ 接近千行 |
| `WorkflowEditor/WorkflowEditorV110.tsx` | 955 | ⚠️ 版本并存 |
| `WorkflowEditor/PropertiesPanel/NodeProperties.tsx` | 890 | 高 |
| `workflow/VersionHistoryPanel.tsx` | 824 | 中高 |
| `WorkflowEditor/WorkflowEditor.tsx` | 805 | 中高 |
| `dashboard/AgentStatusPanel.tsx` | 787 | 中 |
| `ui/RichTextEditor/RichTextEditor.tsx` | 677 | 中 |
| `feedback/ScreenshotAnnotation.tsx` | 659 | 中 |
| `feedback/MultiStepFeedbackForm.tsx` | 581 | 中 |
| `performance/PerformanceMonitorDashboard.tsx` | 580 | 中 |

---

## 4. 循环依赖检查

```
✔ No circular dependency found!
```

`src/lib/` 目录内 **未检测到循环依赖**，架构模块化良好。

---

## 5. 架构改进建议

### 🔴 高优先级

1. **拆分 `websocket-manager.ts` (1455 行)**
   - 当前状态：单文件承担所有 WebSocket 管理逻辑
   - 建议：拆分为 connection-pool.ts、reconnector.ts、message-handler.ts 等子模块

2. **合并 `workflow/` 和 `workflows/` 目录**
   - 当前状态：存在 `src/lib/workflow/` 和 `src/lib/workflows/` 两套工作流模块
   - 同时 `src/components/workflow/` 和 `src/components/WorkflowEditor/` 也在并存
   - 建议：统一为一个模块，消除重复和维护负担

3. **WorkflowEditor 版本清理**
   - `WorkflowEditor.tsx` (805行) 和 `WorkflowEditorV110.tsx` (955行) 并存
   - 确认 V110 是否已废弃，及时删除避免技术债

### 🟡 中优先级

4. **`automation-engine.ts` 拆分 (1219 行)**
   - 建议按 trigger-type 拆分或引入策略模式重构

5 **`analyzer.ts` 接近 1000 行 (1007 行)**
   - 建议提前拆分，避免继续膨胀

6. **模块边界收敛**
   - `src/lib/` 有 85 个子目录，粒度过细
   - 建议将关联紧密的模块合并为独立 package 或 feature-folder（如 `agents/ai` → `ai/`）

### 🟢 低优先级

7. **统一 `services/` 通知系统**
   - 当前有 `notification.ts`、`notifications.ts`、`client-notification-manager.ts` 等多个入口
   - 建议统一导出点，明确公共 API

8. **测试文件占比**
   - 多个超大文件是测试文件（测试比代码还长）
   - 建议 Review 测试覆盖率，确保测试质量而非数量

---

## 总结

| 维度 | 评分 | 说明 |
|------|------|------|
| 模块化 | ⭐⭐⭐⭐ | 无循环依赖，模块边界清晰 |
| 代码规模 | ⭐⭐⭐ | 存在多个超大文件需拆分 |
| 规范一致性 | ⭐⭐ | workflow/workflows 重复，Editor 版本并存 |
| 测试覆盖 | ⭐⭐⭐⭐ | 测试文件充足 |
| **综合健康度** | **B+** | 整体良好，关键路径需优化 |

---
*报告由架构健康检查子代理生成*
