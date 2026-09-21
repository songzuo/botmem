# Memoize 实现统一报告
# Memoize Unification Report
**日期**: 2026-04-16
**项目**: /root/.openclaw/workspace

---

## 📊 执行摘要

| 检查项 | 状态 | 说明 |
|--------|------|------|
| **async.ts memoize** | ✅ 独立实现 | 轻量级函数记忆化 |
| **db/cache.ts memoize** | ✅ 独立实现 | 复杂统计跟踪版本 |
| **可统一性** | ❌ 不推荐 | 两个实现用途不同 |

**结论**: 两个 `memoize` 实现有**不同的 API 签名和用途**，不适合直接统一。建议保持分离，明确各自使用场景。

---

## 🔍 现有实现分析

### 1. `src/lib/utils/async.ts` 的 memoize

**签名**:
```typescript
export function memoize<T extends (...args: unknown[]) => unknown>(
  func: T,
  options?: {
    key?: (...args: Parameters<T>) => string
    cache?: Map<string, { value: ReturnType<T>; lastAccess: number; expiresAt?: number }>
    ttl?: number
    maxSize?: number
    cacheErrors?: boolean
  }
): ((...args: Parameters<T>) => ReturnType<T>) & {
  clear: () => void
  size: number
  has: (...args: Parameters<T>) => boolean
  delete: (...args: Parameters<T>) => void
}
```

**特点**:
- 轻量级实现
- 支持 TTL (过期时间)
- 支持 maxSize (最大缓存条目数)
- 支持 cacheErrors (是否缓存错误)
- 内置 LRU 淘汰
- 返回值有 `clear()`, `size`, `has()`, `delete()` 方法

**用途**: 通用函数记忆化，适用于任何异步/同步函数

---

### 2. `src/lib/db/cache.ts` 的 memoize

**签名**:
```typescript
// 快捷函数版本
export function memoize<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: MemoizationOptions  // { keyPrefix, ttl?, useArgsAsKey?, keyGenerator?, expensive? }
): T

// 内部类
export class MemoizationCache {
  memoize<T>(fn: T, options: MemoizationOptions): T
  memoizeSync<T>(fn: T, options: MemoizationOptions): T
  getStats(keyPrefix?: string): Map<string, MemoizationStats> | MemoizationStats
  clearPrefix(keyPrefix: string): void
  cleanExpired(): number
}
```

**特点**:
- 基于 `MemoizationOptions` 配置对象
- 包含统计功能 (`hits`, `misses`, `hitRate`, `averageExecutionTime`, `savedTime`)
- 有 `keyPrefix` 概念 (用于缓存分组)
- 支持 `expensive` 标记 (自动延长 TTL)
- 集成 `fastGenerateCacheKey` 键生成器
- **面向数据库查询优化**

**用途**: 数据库查询记忆化，有完整的统计和监控

---

## 📋 关键差异

| 特性 | async.ts | db/cache.ts |
|------|----------|-------------|
| **API 类型** | 函数式 | 类 + 工厂函数 |
| **配置方式** | 分散选项 | 统一 `MemoizationOptions` |
| **统计功能** | ❌ 无 | ✅ 完整统计 |
| **键生成** | 自定义或 JSON.stringify | 专用 `fastGenerateCacheKey` |
| **缓存分组** | ❌ 无 | ✅ `keyPrefix` |
| **LRU 淘汰** | ✅ 简单实现 | ❌ 基于 TTL |
| **内存估算** | ❌ 无 | ✅ `estimateSize` |
| **主要用途** | 通用 | 数据库查询 |

---

## 🔧 建议方案

### 方案 1: 保持现状 (推荐)

**理由**: 两个实现服务不同场景，直接统一会损失功能。

| 模块 | 用途 | 建议 |
|------|------|------|
| `src/lib/utils/async.ts` | 通用函数记忆化 | 保持现状 |
| `src/lib/db/cache.ts` | 数据库查询记忆化 | 保持现状 |

**改进**: 添加 JSDoc 注释明确区分用途

---

### 方案 2: 提取通用 memoize 到共享模块

如果确实需要统一，可以：

```typescript
// src/lib/utils/memoize.ts - 共享基础实现

export interface MemoizeOptions {
  ttl?: number
  maxSize?: number
  keyGenerator?: (...args: unknown[]) => string
  cacheErrors?: boolean
}

// 基础实现
export function createMemoize() { ... }
```

然后：
- `async.ts` 的 memoize 导入并使用共享实现
- `db/cache.ts` 的 `MemoizationCache` 可以扩展基础实现并添加统计功能

**缺点**: 重构工作量大，收益不明显

---

## ✅ 当前使用情况

### db/cache.ts 的 memoize 使用示例
```typescript
// 数据库查询记忆化 - 使用 db/cache.ts 的 memoize
import { memoize } from '@/lib/db/cache'

const getAgent = memoize(
  async (id: string) => {
    const db = await getDatabaseAsync();
    return db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
  },
  { keyPrefix: 'agent:by-id', ttl: 300000 }
);
```

### async.ts 的 memoize 使用示例
```typescript
// 通用函数记忆化 - 使用 async.ts 的 memoize
import { memoize } from '@/lib/utils/async'

const expensiveCalc = memoize(
  (n: number) => computeHeavyCalculation(n),
  { ttl: 60000, maxSize: 100 }
);
```

---

## 📋 行动计划

### 不需要修改

根据分析，当前两个 `memoize` 实现有**不同的 API**和**不同的用途**：

1. **async.ts memoize**: 轻量级通用记忆化
2. **db/cache.ts memoize**: 数据库专用记忆化（带统计）

两者不是简单的代码重复，而是针对不同场景的专门实现。

### 建议的改进（非强制）

1. **在 async.ts 添加用途说明**:
   ```typescript
   /**
    * 通用函数 memoize 实现
    * 适用于: 通用计算、API 调用、复杂逻辑
    * 如需数据库查询记忆化，请使用 @/lib/db/cache 的 memoize
    */
   ```

2. **在 db/cache.ts 添加用途说明**:
   ```typescript
   /**
    * 数据库查询 memoize 实现
    * 适用于: 数据库查询、聚合操作、复杂 JOIN
    * 特性: 统计跟踪、性能监控、键自动生成
    * 如需通用函数记忆化，请使用 @/lib/utils/async 的 memoize
    */
   ```

---

## 📁 相关文件

| 文件 | 用途 | memoize 签名 |
|------|------|-------------|
| `src/lib/utils/async.ts` | 通用异步工具 | `(func, options?)` |
| `src/lib/db/cache.ts` | 数据库缓存 | `(fn, MemoizationOptions)` |
| `src/lib/utils/cache.ts` | LRU 缓存工具 | 被 async.ts 引用 |

---

*报告生成时间: 2026-04-16*
*分析工具: 代码审查 + API 签名对比*
