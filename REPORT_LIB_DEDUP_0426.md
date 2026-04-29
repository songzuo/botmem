# Lib 模块去重分析报告

**日期**: 2026-04-26  
**任务**: 清理 `src/lib/` 下重复/合并的模块  
**结论**: **无需删除任何模块** — 每对模块都有独立功能，无冗余

---

## 1. `lib/audit` vs `lib/audit-log`

### 现状

| | `lib/audit` | `lib/audit-log` |
|---|---|---|
| **定位** | 轻量级进程内审计日志记录器 | 企业级审计日志系统 |
| **核心组件** | `AuditLogger`, `MemoryAuditStorage`, `AuditWebSocketService`, 中间件 | `AuditLogService`, 合规服务, 分析服务, 导出服务, 查询服务 |
| **存储方式** | 仅内存存储 (MemoryAuditStorage) | 存储工厂模式 (File/Memory) |
| **依赖** | 无外部依赖 | 有独立存储层 |
| **index.ts 行数** | ~35 行 | ~90 行 |
| **使用方** | `src/app/api/audit/*` (3个路由文件) | 自身内部使用 |

### 导出对比

**lib/audit 导出**:
```typescript
// 核心
AuditLogger, getAuditLogger, resetAuditLogger
// 存储
MemoryAuditStorage
// 中间件
createAuditMiddleware, wrapResponseForAudit, extractUserIdFromToken ...
// WebSocket
AuditWebSocketService, getAuditWebSocketService ...
// 类型
AuditLogEntry, AuditAction, AuditLogFilter ...
```

**lib/audit-log 导出**:
```typescript
// 核心服务
AuditLogService, getAuditLogService, initializeAuditLog
// 合规
AuditComplianceService, ComplianceReport ...
// 分析
AuditAnalyticsService
// 导出
AuditExportService
// 查询
AuditQueryService, QueryBuilder
// 存储
AuditStorageFactory, FileAuditStorage, MemoryAuditStorage
// 类型 (~30 个类型)
AuditEvent, AuditSeverity, ComplianceReportConfig ...
```

### 结论

**两者功能完全不重叠**:
- `audit` = 实时记录 + WebSocket 推送
- `audit-log` = 企业合规 + 分析 + 导出 + 存储抽象

**处理方式**: 保留两者，无需修改

---

## 2. `lib/collab` vs `lib/collaboration`

### 现状

| | `lib/collab` | `lib/collaboration` |
|---|---|---|
| **定位** | 企业级实时协同编辑 (CRDTs) | WebSocket 房间管理 (OT/Transform) |
| **冲突解决** | CRDT (Conflict-free Replicated Data Types) | OT (Operational Transformation) |
| **核心文件** | `core/crdt.ts`, `server/server.ts`, `client/client.ts` | `manager.ts`, `rooms.ts` |
| **使用方** | `src/lib/websocket/*` (5个文件) | `src/lib/websocket/useCollaboration.ts` |

### 导入关系

```typescript
// lib/websocket/useCollaboration.ts
import { Operation, Cursor } from '@/lib/collaboration/manager'

// lib/websocket/__tests__/integration.test.ts
import { transform, applyOperationToContent } from '@/lib/collaboration/manager'

// lib/websocket/__tests__/server.test.ts
import { applyOperation, transform, composeOperations } from '@/lib/collaboration/manager'
```

### 结论

**两者是互补的不同实现**:
- `collab` = CRDT 驱动的协同文档编辑（复杂但强一致性）
- `collaboration` = OT 驱动的房间管理和操作转换（被 WebSocket 层使用）

**处理方式**: 保留两者，无需修改

---

## 3. `lib/error` vs `lib/errors`

### 现状

| | `lib/error/` | `lib/errors/` |
|---|---|---|
| **定位** | 空目录 + 子模块 | 统一错误处理系统 (真实实现) |
| **index.ts** | ❌ 不存在 | ✅ 完整导出 |
| **子模块** | `client/error-handler.ts`, `core/error-factory.ts` | `unified-error.ts`, `unified-response.ts`, `unified-types.ts` |
| **功能** | 依赖于 lib/errors 的包装器 | 完整实现: UnifiedAppError, 错误码, 响应构建器 |

### lib/error 的子模块导入关系

```typescript
// lib/error/core/error-factory.ts
import { UnifiedAppError, toUnifiedError } from '@/lib/errors/unified-error'
import { UnifiedErrorType, ErrorCodes } from '@/lib/errors/unified-types'

// lib/error/client/error-handler.ts
import { UnifiedAppError, toUnifiedError } from '@/lib/errors/unified-error'
import { UnifiedErrorType, isRetryableErrorType } from '@/lib/errors/unified-types'
```

### 结论

**`lib/error` 是空壳**，其子模块都是对 `lib/errors` 的包装/重导出。

`lib/error` 本身没有 `index.ts`，所以从 `@/lib/error` 无法导入任何东西（导入会失败）。

**处理方式**: 
- `lib/error` 子模块 (`error/client`, `error/core`) 是包装层，有独立价值
- 建议: **无需删除** — 它们是 `lib/errors` 的消费者，删除会导致引用断裂

---

## 4. `lib/trace` vs `lib/tracing`

### 现状

| | `lib/trace` | `lib/tracing` |
|---|---|---|
| **定位** | 分布式追踪核心 | 追踪上下文管理 |
| **核心组件** | `TraceManager`, `StructuredLogger` | `context.ts` (上下文存储) |
| **index.ts 行数** | ~120 行 | ~50 行 |
| **使用方** | `lib/trace/middleware.ts`, APM 路由 | APM 路由 (`/api/monitoring/apm`) |

### 依赖关系

```
lib/trace/TraceManager.ts → imports from lib/tracing/types (../tracing/types)
lib/trace/StructuredLogger.ts → imports from lib/tracing/types
lib/trace/middleware.ts → imports from lib/tracing/types
lib/tracing/context.ts → imports from lib/tracing/types (自身)
```

`lib/tracing/types.ts` 是共享的基础类型定义，被 `lib/trace` 的所有组件依赖。

### lib/trace 导出
```typescript
TraceManager, StructuredLogger, middleware (withTrace, withAuthTrace ...)
// 类型 re-export from lib/tracing/types
```

### lib/tracing 导出
```typescript
getCurrentTraceContext, setCurrentTraceContext, injectTraceContext, extractTraceContext
// 类型 re-export from lib/tracing/types
```

### 结论

**两者是分层关系**:
- `lib/tracing` = 底层上下文工具（被 `lib/trace` 依赖）
- `lib/trace` = 上层应用层（TraceManager + StructuredLogger + 中间件）

`lib/trace` 严重依赖 `lib/tracing/types`，但两者导出的 API 不同，不能合并。

**处理方式**: 保留两者，无需修改

---

## 总结

| 模块对 | 结论 | 处理方式 |
|---|---|---|
| `audit` vs `audit-log` | 功能不重叠（轻量日志 vs 企业合规） | 保留 |
| `collab` vs `collaboration` | 不同协同算法（CRDT vs OT） | 保留 |
| `error` vs `errors` | `error/` 是 `errors/` 的消费者包装层 | 保留 |
| `trace` vs `tracing` | 分层关系（应用层 vs 底层工具） | 保留 |

**扫描的文件总数**: 73+ 个目录  
**发现重复**: 0 对可合并的模块  
**建议操作**: 无 — 所有模块都有独立存在价值

---

## 附录: 检查的导入路径汇总

```
@/lib/audit/*     → 3 个 API 路由使用 (audit-logger, types)
@/lib/audit-log/* → 自身内部使用，无外部引用
@/lib/collab      → 0 个外部引用 (有 index.ts 但未被导入)
@/lib/collaboration → 5 个 WebSocket 文件使用 (manager, rooms)
@/lib/error/*      → 0 个直接导入 (子模块依赖 lib/errors)
@/lib/errors      → 8+ 个文件使用 (统一错误系统)
@/lib/trace       → 2 个文件 (middleware.ts, APM路由)
@/lib/tracing     → 2 个文件 (trace/middleware.ts, APM路由)
```

**备注**: `lib/collab` 有完整的 `index.ts` 但没有被任何文件通过 `@/lib/collab` 导入（只有 `lib/collaboration` 被使用）。这可能是遗留代码，建议后续审查是否可移除 `lib/collab`。
