# 代码重复优化报告
# Code Duplication Optimization Report
**日期**: 2026-04-16
**项目**: /root/.openclaw/workspace

---

## 📊 执行摘要

本报告分析了 `src/lib` 目录下的代码重复问题，识别出 **5 个主要重复区域**，并提供具体重构建议。

---

## 🔴 Top 5 重复代码区域

### 1. **缓存装饰器重复** (严重程度: 高)

**位置**:
- `src/lib/utils/async.ts` - `memoize()` 函数
- `src/lib/db/cache.ts` - `memoize<T>()` 和 `cached<T>()` 装饰器

**问题描述**:
两处实现了相同的记忆化(memoization)功能，但实现不同：

```typescript
// async.ts 中的 memoize
export function memoize<T extends (...args: never[]) => Promise<unknown>>(
  func: T,
  options?: { ttl?: number; cache?: Map<string, unknown> }
): T

// db/cache.ts 中的 memoize
export function memoize<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options?: { ttl?: number; keyGenerator?: KeyGenerator }
): T
```

**重构建议**:
```
统一使用 src/lib/utils/async.ts 的 memoize 实现
删除 src/lib/db/cache.ts 中的重复 memoize/cached 函数
保留 db/cache.ts 专有的 DatabaseCache LRU 类
```

**工作量**: 中等 (需要测试验证)

---

### 2. **日期工具重复** (严重程度: 中)

**位置**:
- `src/lib/date.ts` - `formatTimeAgo`, `formatDate`, `formatDateTime`, `isToday`, `isYesterday`
- `src/lib/utils/format.ts` - 可能有相似日期格式化
- `src/lib/utils/async.ts` 中 import 了 LRU cache

**问题描述**:
`date.ts` 中的 `getCachedDate()` 是一个内部辅助函数，可能与项目中其他日期工具有重叠。

```typescript
// date.ts 中的内部函数，只被同文件的其他函数调用
function getCachedDate(daysOffset: number): Date {
  const nowMs = Date.now()
  const now = new Date(nowMs)
  // ...
}
```

**重构建议**:
```
评估 src/lib/utils/format.ts 是否已有类似功能
如有，合并到统一的 date 模块
getCachedDate() 可考虑移至 date 模块内部私有化
```

**工作量**: 低 (需要审计 format.ts)

---

### 3. **错误处理包装器重复** (严重程度: 中)

**位置**:
- `src/lib/errors.ts` - 保留了大量 `@deprecated` 旧函数
- `src/lib/errors/unified-error.ts` - 新的统一错误系统

**问题描述**:
`errors.ts` 存在大量向后兼容的包装函数，但其中一些逻辑可能已经过时：

```typescript
/**
 * @deprecated Use UnifiedAppError.validation() instead
 */
export function createAppError(message: string, code?: string, statusCode?: number): UAppError

/**
 * @deprecated Use toUnifiedError().message or toUnifiedError().toJSON() instead
 */
export function formatErrorMessage(error: unknown): string
```

**重构建议**:
```
1. 确认所有内部调用方已迁移到新的 UnifiedAppError API
2. 标记 @deprecated 函数为正式废弃 (添加 @deprecated 注释和 console.warn)
3. 设置迁移截止日期 (建议 1-2 个 sprint)
4. 清理向后兼容代码
```

**工作量**: 中等 (需要检查所有调用方)

---

### 4. **工具函数 barrel export 过多** (严重程度: 低-中)

**位置**:
- `src/lib/utils.ts` (113 行) - 主要入口文件

**问题描述**:
`utils.ts` 是一个巨型 barrel export 文件，重新导出 50+ 个函数，散落在各个子模块：

```typescript
// utils.ts 的导出分布
- id.ts (2 exports)
- async.ts (5 exports) - @deprecated
- cache.ts (2 exports) - @deprecated  
- array.ts (6 exports) - @deprecated
- math.ts (3 exports) - @deprecated
- validation.ts (3 exports) - @deprecated
- env.ts (9 exports) - @deprecated
- dom.ts (10 exports) - @deprecated
- browser.ts (4 exports) - @deprecated
- perf.ts (3 exports) - @deprecated
- ui.ts (1 export)
- clone.ts (1 export) - @deprecated
- format.ts (2 exports) - @deprecated
- date.ts (4 exports) - @deprecated
```

**重构建议**:
```
1. 停止使用 utils.ts 作为主入口
2. 鼓励直接导入: import { debounce } from '@/lib/utils/async'
3. 保留 utils.ts 作为向后兼容，但标记所有 @deprecated
4. 最终目标是移除 utils.ts 的再导出层
```

**工作量**: 高 (需要协调多个模块)

---

### 5. **API 路由中重复的认证中间件模式** (严重程度: 中)

**位置**:
- `src/app/api/*/route.ts` 多个文件

**问题描述**:
API 路由中存在重复的认证和错误处理模式。多个路由文件可能有相似的：

```typescript
// 常见模式 (可能在多个 route.ts 中重复)
import { withAuth } from '@/lib/middleware/auth'
import { createAppError } from '@/lib/errors'

// 重复的 try-catch 包装
try {
  const result = await someOperation()
  return Response.json(result)
} catch (error) {
  return handleError(error) // 重复的错误处理逻辑
}
```

**重构建议**:
```
1. 提取统一的 API 路由包装器
2. 使用高阶函数统一处理认证、错误、日志
3. 示例:
   export const GET = withAuth(async (req, session) => {
     return Response.json(await getData(session.user.id))
   })
```

**工作量**: 高 (需要重构多个 API 路由)

---

## 📈 其他发现

### LRU 缓存实现重复
- `src/lib/utils/cache.ts` - LRU cache
- `src/lib/cache/` 目录存在

### 工具函数散落
```
src/lib/
├── utils/          # 核心工具函数
├── utils/async.ts  # 异步工具 (debounce, throttle, retry, memoize)
├── utils/cache.ts  # 缓存工具
├── db/cache.ts     # 数据库专用缓存
├── date.ts         # 日期工具
└── errors.ts       # 错误处理
```

---

## ✅ 优先行动计划

| 优先级 | 任务 | 工作量 | 影响 |
|--------|------|--------|------|
| 1 | 统一 memoize 实现 | 中 | 高 |
| 2 | 清理 @deprecated errors 函数 | 中 | 中 |
| 3 | 评估并合并日期工具 | 低 | 中 |
| 4 | 制定 utils.ts 迁移计划 | 高 | 低 |
| 5 | 提取 API 路由包装器 | 高 | 中 |

---

## 🧪 测试建议

1. **运行 jscpd 检测代码克隆**:
   ```bash
   npx jscpd src/lib --threshold 20 --report
   ```

2. **性能基准测试**:
   重构前后运行基准测试，确保没有性能退化

3. **回归测试**:
   确保所有现有测试通过，特别是涉及缓存和错误处理的模块

---

*报告生成时间: 2026-04-16*
*分析工具: 静态代码扫描 + 人工审查*
