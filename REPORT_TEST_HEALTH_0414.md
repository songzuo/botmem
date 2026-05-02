# 测试健康状况报告 — 2026-04-14

## 📋 执行摘要

| 指标 | 数值 | 状态 |
|------|------|------|
| **总测试数** | 4891 | ✅ |
| **通过数** | 4480 | ✅ |
| **失败数** | 389 | ⚠️ |
| **通过率** | 91.6% | ⚠️ 目标 ≥95% |
| **测试套件** | 2049 | ✅ |
| **失败套件** | 302 | 🔴 |
| **失败文件数** | 56 | ⚠️ |

---

## 1️⃣ 总体健康评估

### 测试通过率趋势
- **当前**: 91.6% (389 失败 / 4891 总计)
- **目标**: ≥95%
- **差距**: 需消除约 180 个失败测试以达到 95%

### 测试文件分布
| 类别 | 数量 | 路径 |
|------|------|------|
| 单元测试 (src/) | 209 个 | `src/**/__tests__/*.test.*` |
| 集成测试 (tests/) | 28 个 | `tests/integration/` |
| API 集成测试 | ~20 个 | `tests/api-integration/` |
| E2E 测试 (Playwright) | 8 个 | `e2e/*.spec.ts` |

---

## 2️⃣ 失败测试详细分析 (按严重程度)

### 🔴 严重 (Critical) — 修复优先级 P0

#### 2.1.1 `tests/api-integration/notifications.test.ts` — 34 失败
**根因**: Mock 导出缺失
```
Error: [vitest] No "createUnauthorizedError" export is defined 
         on the "@/lib/api/error-handler" mock
```
**问题类型**: Mock 配置不完整，error-handler 的 mock 缺少 `createUnauthorizedError`、`createForbiddenError` 等导出
**修复方案**: 在 `__mocks__/@/lib/api/error-handler.ts` 中补充缺失的导出

#### 2.1.2 `tests/api-integration/a2a-jsonrpc.test.ts` — 30 失败
**根因**: API 响应格式不匹配
```
AssertionError: expected undefined to be 2 // Object.is equality
AssertionError: expected 500 to be 400
```
**问题类型**: A2A JSONRPC 端点返回的响应结构与测试预期不符，可能是路由 handler 未正确实现或 mock 数据问题
**修复方案**: 检查 `src/app/api/a2a/` 路由实现，对比测试预期

#### 2.1.3 `src/lib/performance/__tests__/offline-storage.test.ts` — 18 失败 (100%)
**根因**: Mock 构造函数问题
```
TypeError: __vi_import_0__.OfflineStorage is not a constructor
```
**问题类型**: Vitest vi.mock 无法正确模拟 IndexedDB 的 `OfflineStorage` 类构造函数
**修复方案**: 使用 `vi.mock` 的 factory 模式手动实现 mock，或使用真实的测试用 IndexedDB

#### 2.1.4 `src/components/keyboard/__tests__/ShortcutManager.test.ts` — 18 失败 (100%)
**根因**: 全局变量引用错误
```
ReferenceError: jest is not defined
```
**问题类型**: 测试代码中使用 `jest.fn()` 但项目使用 Vitest，应使用 `vi.fn()`
**修复方案**: 全局替换 `jest` → `vi` (已知的 Vitest 兼容性问题)

#### 2.1.5 `src/components/feedback/__tests__/MultiStepFeedbackForm.test.tsx` — 11 失败 (100%)
**根因**: Mock 组件导出缺失
```
Error: [vitest] No "EmotionSelector" export is defined 
         on the "../EmotionSelector" mock
```
**修复方案**: 在对应的 mock 文件中添加 `EmotionSelector` 导出

### 🟡 高危 (High) — 修复优先级 P1

| 文件 | 失败数 | 根因 | 类型 |
|------|--------|------|------|
| `src/hooks/__tests__/useTouchGestures.test.ts` | 25 | 触摸手势时序/异步问题 | 断言失败 |
| `src/lib/__tests__/websocket-manager-enhanced.test.ts` | 20 | 网络状态变更时序 | 断言失败 |
| `src/hooks/__tests__/useSwipe.test.ts` | 16 | 滑动手势模拟精度 | 断言失败 |
| `tests/features/collab-client.test.ts` | 15 | WebSocket 连接状态时序 | 断言失败 |
| `src/app/api/notifications/__tests__/route.test.ts` | 15 | API 响应字段不匹配 | 断言失败 |
| `src/lib/ai/dialogue/__tests__/SentimentAnalyzer.test.ts` | 15 | 情感分析模型输出不稳定 | 断言失败 |
| `src/components/WorkflowEditor/__tests__/WorkflowEditor.test.tsx` | 14 | 缺少 React Flow / Zustand provider | Provider 缺失 |
| `src/app/api/alerts/rules/__tests__/route.test.ts` | 11 | API 响应缺少 `rules` 字段 | 断言失败 |
| `src/lib/__tests__/websocket-manager.test.ts` | 10 | WebSocket 状态机时序 | 断言失败 |
| `src/app/api/alerts/history/__tests__/route.test.ts` | 10 | API 响应缺少 `alerts` 字段 | 断言失败 |
| `src/lib/performance/__tests__/cache-strategy.test.ts` | 9 | Cache API mock 不完整 | mock 问题 |
| `src/hooks/__tests__/useRoomWebSocket.test.ts` | 8 | WebSocket mock 返回格式错误 | mock 问题 |
| `src/lib/search/__tests__/suggestions.spec.ts` | 8 | 搜索建议数据源问题 | 断言失败 |
| `src/app/api/a2a/jsonrpc/__tests__/route.test.ts` | 8 | JSONRPC 响应格式不匹配 | 断言失败 |

### 🟢 中低危 — 修复优先级 P2

| 文件 | 失败数 | 根因 |
|------|--------|------|
| `src/lib/ai/dialogue/__tests__/SentimentAnalyzer.test.ts` | ~7 | 中英文情感判断边界 |
| `src/components/monitoring/__tests__/PerformanceChart.test.tsx` | ~2 | Chart 渲染 |
| `src/lib/webhook/__tests__/webhook.test.ts` | ~3 | Webhook mock |
| `src/components/keyboard/__tests__/ShortcutTooltip.test.tsx` | ~2 | 快捷键渲染 |
| `src/features/dashboard/__tests__/Dashboard.test.tsx` | ~2 | Dashboard 组件 |
| `src/lib/alerting/__tests__/MultiChannelNotifications.test.ts` | ~1 | 通知渠道 |
| `src/stores/__tests__/app-store.test.ts` | ~1 | Store mock |

---

## 3️⃣ 失败根因分类汇总

### 按根因类型统计

| 根因类型 | 影响文件数 | 占比 | 典型案例 |
|----------|-----------|------|---------|
| **Mock 导出缺失** | 12 | 21% | notifications, EmotionSelector, error-handler |
| **异步/时序断言** | 14 | 25% | WebSocket, TouchGestures, useSwipe |
| **API 响应格式不匹配** | 8 | 14% | alerts API, a2a jsonrpc |
| **jest → vi 未迁移** | 1 | 2% | ShortcutManager |
| **Provider/上下文缺失** | 2 | 4% | WorkflowEditor |
| **Cache/IndexedDB API mock** | 2 | 4% | offline-storage, cache-strategy |
| **业务逻辑不稳定** | 5 | 9% | SentimentAnalyzer, suggestions |
| **其他** | 12 | 21% | — |

### 核心模式识别

1. **Mock 配置问题 (最大类)**: 约 40% 的失败与 mock 配置不完整或错误相关
   - Vitest 的 `vi.mock` 语法与 Jest 略有不同，容易出现 export 找不到的问题
   - 建议统一使用 `vi.mock` 的 factory 模式

2. **时序/异步问题 (第二大类)**: 约 25% 的失败是 WebSocket、触摸手势等异步场景
   - 需要使用 `vi.useFakeTimers()` 或增加 `await` 等待
   - WebSocket 连接状态变更的时序测试尤其脆弱

3. **API Handler 响应不符合测试预期**: 约 14%
   - 测试写在了 API 实现之前，但实现未完全对齐
   - 或 API 发生了 breaking change 但测试未同步更新

---

## 4️⃣ 测试覆盖率分析

### 目录级覆盖率 (基于文件扫描)

| 目录/模块 | 测试文件数 | 覆盖评估 |
|-----------|-----------|---------|
| `src/lib/workflow/` | 6 | ✅ 良好 (VisualWorkflowOrchestrator, history, versioning, replay, template, analytics) |
| `src/lib/ai/dialogue/` | 3+ | ⚠️ SentimentAnalyzer 测试不稳定 |
| `src/hooks/` | 10+ | ⚠️ TouchGestures, useSwipe, useRoomWebSocket 失败 |
| `src/components/WorkflowEditor/` | 2 | ⚠️ WorkflowEditor + Toolbar 都有失败 |
| `src/app/api/` | 20+ | ⚠️ alerts, notifications, a2a 多个失败 |
| `src/lib/` (核心) | 15+ | ✅ storage, validation 基本通过 |
| `tests/integration/` | 4 | ✅ websocket-room, workflow-orchestrator 基本稳定 |
| `tests/features/` | 6 | ⚠️ collab-client 失败率高 |

### 完全无测试覆盖的区域 ⚠️

| 模块 | 文件 | 风险 |
|------|------|------|
| `src/lib/workflow/` | `executor-batch.ts` | 🔴 高 — 批处理核心逻辑 |
| `src/lib/workflow/` | `executor-optimized.ts` | 🔴 高 |
| `src/lib/workflow/monitoring/` | `MetricsCollector.ts` | 🟡 中 |
| `src/lib/workflow/monitoring/` | `ExecutionTracker.ts` | 🟡 中 |
| `src/lib/workflow/monitoring/` | `StepRecorder.ts` | 🟡 中 |
| `src/lib/workflow/monitoring/` | `RealtimeService.ts` | 🟢 低 |
| `src/lib/workflow/monitoring/` | `AlertManager.ts` | 🟡 中 |
| `src/workflows/nodes/` | `NodeRegistry.ts` | 🟡 中 |
| `src/workflows/` | `DSLParser.ts` | 🟡 中 — DSLParser private 方法 |
| `src/app/api/agents/` | 多个 route | 🟡 中 |
| `src/app/api/workflow/` | 多个 route | 🟡 中 |

---

## 5️⃣ E2E 测试状态 (Playwright)

### 配置
- 测试文件: 8 个 (`e2e/*.spec.ts`)
- 浏览器: Chromium (+ Firefox/Webkit in CI)
- 并行: 完全并行
- 重试: CI 2 次，本地 0 次

### E2E 覆盖范围
| 文件 | 覆盖 |
|------|------|
| `core-features.spec.ts` | 核心功能 |
| `login-flow.spec.ts` | 登录 |
| `register-flow.spec.ts` | 注册 |
| `notifications.spec.ts` | 通知 |
| `websocket.spec.ts` | WebSocket |
| `error-handling.spec.ts` | 错误处理 |
| `pwa-offline.spec.ts` | PWA 离线 |
| `visual-regression.spec.ts` | 视觉回归 |

E2E 测试整体健康，未纳入 Vitest 的 389 失败统计。

---

## 6️⃣ 改进建议 (按优先级)

### 🔴 立即修复 (P0 — 1-2 天)

#### 1. ShortcutManager jest→vi 迁移
```typescript
// 问题: jest.fn() → vi.fn()
// 范围: 仅 1 个文件，18 个测试
// 操作: sed -i 's/jest\.fn()/vi.fn()/g' ShortcutManager.test.ts
//       sed -i 's/jest\.spyOn()/vi.spyOn()/g' ...
```

#### 2. EmotionSelector mock 补充
```typescript
// 文件: __mocks__/@/components/feedback/EmotionSelector.tsx
// 操作: 添加 EmotionSelector 导出 mock
export const EmotionSelector = vi.fn(() => <div>Mock EmotionSelector</div>)
```

#### 3. OfflineStorage mock 重构
```typescript
// 建议使用: vi.mock with factory
vi.mock('@/lib/performance/offline-storage', () => ({
  OfflineStorage: {
    getInstance: vi.fn(() => ({...})),
    // 手动实现而非依赖 constructor mock
  }
}))
```

### 🟡 高优先级 (P1 — 3-5 天)

#### 4. WebSocket / 时序测试重构
所有 WebSocket 相关测试和触摸手势测试建议：
- 使用 `vi.useFakeTimers()` + `vi.advanceTimersByTime()`
- 或增加适当的 `await` + `waitFor` 等待
- 避免依赖硬编码的 sleep

#### 5. API Handler 响应对齐
- 统一 API 响应格式规范
- 使用 JSON Schema 或 TypeScript 类型验证响应
- 建立 API 测试的 contract testing 意识

#### 6. error-handler mock 完善
```typescript
// 文件: __mocks__/@/lib/api/error-handler.ts
// 补充: createUnauthorizedError, createForbiddenError, 
//       createBadRequestError, createNotFoundError 等
```

### 🟢 中期优化 (P2 — 1-2 周)

#### 7. executor-batch.ts 测试覆盖
新增 `tests/lib/workflow/executor-batch.test.ts`

#### 8. monitoring 模块测试覆盖
新增 `tests/lib/workflow/monitoring/*.test.ts`

#### 9. DSLParser private 方法测试
扩展 `tests/workflow/dslparser-key-methods.test.ts` 覆盖更多 private 方法路径

#### 10. 测试框架统一
- 确认所有测试文件使用 Vitest 语法
- 运行 `pnpm test -- --config vitest.config.ts --check` 做语法预检
- 建立 pre-commit hook 防止 jest 语法进入

---

## 7️⃣ 行动计划

### Week 1: 消除 P0 失败 (目标: 通过率 93% → 95%)
- [ ] 修复 ShortcutManager (18 test)
- [ ] 修复 MultiStepFeedbackForm mock (11 test)
- [ ] 修复 OfflineStorage mock (18 test)
- [ ] 修复 error-handler mock (notifications, 34 test)

**预期效果**: -81 失败 → 剩余 308 → 93.7%

### Week 2: 修复 P1 高危 (目标: 通过率 95% → 97%)
- [ ] 修复 WebSocket 时序测试 (约 70 test)
- [ ] 修复 Touch/Swipe 手势测试 (约 41 test)
- [ ] 修复 API 响应格式 (约 44 test)

**预期效果**: -155 失败 → 剩余 153 → 96.9%

### Week 3: 扫尾 + 补充覆盖
- [ ] 修复剩余 ~150 分散失败
- [ ] 新增 executor-batch.ts 测试
- [ ] 新增 monitoring 模块测试

---

## 8️⃣ 总结

| 维度 | 评估 |
|------|------|
| **通过率** | 91.6% ⚠️ (目标 95%) |
| **失败文件** | 56 个 🔴 |
| **失败根因** | Mock 配置缺失/错误占 40%，时序问题占 25% 🔴 |
| **单元测试覆盖** | 核心 workflow 良好，边缘模块(monitoring/batch) 无覆盖 ⚠️ |
| **E2E 测试** | 正常 ✅ |
| **技术债** | jest→vi 迁移未完成，部分 mock 使用旧语法 ⚠️ |

**最关键修复**: error-handler mock、OfflineStorage mock、ShortcutManager vitest 语法修复，这 4 项消除约 81 个失败，可立即提升通过率至 93.7%。

---

*报告生成时间: 2026-04-14 03:30 GMT+2*  
*数据来源: `test-results.json` (4891 tests) + 文件扫描*  
*报告者: 🧪 测试员 subagent*
