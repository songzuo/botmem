# 🏗️ 技术债务分析报告
**项目**: 7zi-frontend  
**日期**: 2026-04-17  
**分析范围**: `src/lib/` 和 `src/server/`  
**分析角色**: 架构师 (子代理)

---

## 📊 执行摘要

| 指标 | 数值 |
|------|------|
| `src/lib/` 总代码行数 | ~127,661 行 |
| TODO/FIXME/HACK 数量 | ~11 个 (不含测试) |
| `any` 类型使用文件数 | ~90 个文件 |
| `@ts-ignore/@ts-expect-error` | 2 处 |
| `console.log/warn` 散落 | 103+ 处 |
| `require()` CommonJS 调用 | 4 处 |
| 重复通知系统文件 | 7+ 个 |

**总体风险等级**: 🟡 **中等风险**  
**建议优先级**: 建议在 v1.14 周期内完成清理

---

## 🔴 高风险技术债务

### 1. 巨型单体文件 (God Files)

| 文件 | 行数 | 风险描述 |
|------|------|----------|
| `websocket-manager.ts` | 1,455 行 | 职责过重，难以测试和维护 |
| `permissions.ts` | 955 行 | 权限逻辑复杂，修改风险高 |
| `automation-engine.ts` | 1,219 行 | 规则引擎庞大 |
| `CollabClient.ts` | 819 行 | 协作客户端过于复杂 |

**建议**: 拆分为多个模块或策略类

### 2. 通知系统重复实现

发现 **7+ 个** notification 相关文件:

```
notification-init.ts          (1,524 行)
notification-center.tsx      (17,426 行)
notification-enhanced.ts      (19,216 行)
notification-indexeddb.ts    (18,526 行)
notification-manager.ts      (18,044 行)
notification-storage.ts      (16,248 行)
notification-types.ts        (1,600 行)
notification.ts              (6,300 行)
notifications.ts             (1,506 行)
```

**问题**:
- 职责边界不清晰
- 代码重复率高
- 新旧实现并存

**建议**: 统一为单一架构，设计清晰的抽象层

### 3. CommonJS `require()` 残留

```typescript
// src/lib/db/feedback-storage.ts
const fs = require('fs')
const dir = require('path').dirname(this.dbPath)

// src/lib/services/notification-storage.ts
const fs = require('fs')
const dir = require('path').dirname(this.dbPath)

// src/lib/automation/automation-hooks.ts
const { RuleValidator } = require('./automation-engine')
```

**风险**: 与 ESM 项目不一致，可能导致打包问题

---

## 🟡 中等风险技术债务

### 4. Console.log 散落 (103+ 处)

仅 `src/lib/db/draft-storage.ts` 中就有:
```typescript
console.log('[DraftStorage] Cleaned up...')
console.warn('[IndexedDBStorage] Invalid draft...')
console.warn('[LocalStorageStorage] Invalid draft...')
```

**建议**: 统一使用 logger 模块

### 5. 未完成的 TODO

```
// src/lib/performance/alerting/channels.ts
// TODO: Integrate with actual email service
// TODO: Send actual webhook
// TODO: Play notification sound

// src/lib/automation/automation-engine.ts
// TODO: 集成到工作流执行系统
// TODO: 集成到通知系统

// src/lib/offline/sync-manager.ts
// TODO: Replace with actual API endpoint
```

**建议**: 评估并实现或删除这些 TODO

### 6. `any` 类型使用 (90 个文件)

示例:
```typescript
// 搜索到 90 个文件使用了 any 类型
```

**风险**: 类型安全缺失，运行时错误风险

---

## 🟢 低风险/建议改进

### 7. 导出模式不一致

部分模块使用 `export default`:
```typescript
// src/lib/logger.ts
export default logger

// src/lib/theme/ThemeSwitcher.tsx
export default ThemeSwitcher
```

部分模块使用命名导出:
```typescript
export const logger = ...
export class WebhookManager { ... }
```

**建议**: 统一为命名导出 (保持一致性)

### 8. `new Date()` 散落

统计到大量 `new Date()` 调用，缺少统一的日期工具函数

### 9. 导出星号 (`export *`)

```typescript
// src/lib/performance/root-cause-analysis/analyzer.ts
export * from './types'
export * from './database-tracker'
// ...
```

**建议**: 显式导出，避免命名空间污染

---

## 📋 优先级清理计划

| 优先级 | 任务 | 工作量 | 影响 |
|--------|------|--------|------|
| P0 | 统一通知系统架构 | 高 | 显著降低复杂度 |
| P1 | 拆分 websocket-manager.ts | 高 | 提升可维护性 |
| P1 | 替换 require() → import | 低 | 符合 ESM 标准 |
| P2 | 替换 console.* → logger | 中 | 统一日志 |
| P2 | 清理未实现的 TODO | 中 | 明确代码状态 |
| P3 | 统一导出模式 | 低 | 提升一致性 |

---

## 📈 趋势分析

对比 `REPORT_CRON_CODE_QUALITY_20260410.md`:
- ✅ `@ts-ignore` 已减少
- ⚠️ 通知系统重复问题依然存在
- ⚠️ 巨型文件问题未解决

---

*报告生成时间: 2026-04-17 21:20 GMT+2*
*分析工具: 架构师子代理 (tech-debt-review)*
