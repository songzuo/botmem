# Memoize 代码去重分析报告
# Memoize Deduplication Analysis Report
**日期**: 2026-04-16
**项目**: /root/.openclaw/workspace

---

## 📊 分析结果

### 两个实现对比

| 特性 | `src/lib/utils/async.ts` | `src/lib/db/cache.ts` |
|------|--------------------------|----------------------|
| **位置** | Line 192 | Line 728 |
| **签名** | `memoize(func, options?)` | `memoize(fn, options)` - required |
| **泛型约束** | `T extends (...args: unknown[]) => unknown` | `T extends (...args: unknown[]) => Promise<unknown>` |
| **options** | 可选，包含 key/cache/ttl/maxSize | 必需，包含 keyPrefix/useArgsAsKey/expensive |
| **返回值** | `{ clear, size, has, delete }` | 返回 `T` (包装后的函数) |
| **统计功能** | ❌ 无 | ✅ 完整统计 |
| **keyPrefix** | ❌ 无 | ✅ 支持 |
| **内部实现** | 简单 Map + LRU | MemoizationCache 类 |

**结论**: 两个实现**用途不同**，不是简单的代码重复。

---

## 🔍 实际使用情况

### async.ts memoize 的使用者:
```
src/lib/data-import-export.ts:  import { memoize } from './utils/async'
src/lib/utils/index.ts:          export from './async'
src/lib/utils.ts:                export from './utils/async'
```

### db/cache.ts memoize 的使用者:
```
(仅内部使用，MemoizationCache 类调用)
```

---

## 📋 关键差异

### 1. API 签名不同

```typescript
// async.ts - 通用记忆化
memoize<T extends (...args: unknown[]) => unknown>(
  func: T,
  options?: { key?, cache?, ttl?, maxSize?, cacheErrors? }
)

// db/cache.ts - 数据库专用记忆化
memoize<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: MemoizationOptions  // required!
)
```

### 2. 使用场景不同

| 场景 | 应使用 |
|------|--------|
| 通用函数记忆化 | `async.ts memoize` |
| 数据库查询记忆化 | `db/cache.ts memoize` |
| 需要统计功能 | `db/cache.ts memoize` |
| 需要 keyPrefix | `db/cache.ts memoize` |

### 3. db/cache.ts 独有功能

```typescript
// MemoizationCache 类提供:
interface MemoizationOptions {
  keyPrefix: string      // 缓存键前缀
  ttl?: number          // 生存时间
  useArgsAsKey?: boolean
  keyGenerator?: (...args) => string
  expensive?: boolean    // 昂贵操作标记
}

// 统计接口
interface MemoizationStats {
  hits: number
  misses: number
  totalCalls: number
  hitRate: number
  averageExecutionTime: number
  savedTime: number
}
```

---

## 🎯 建议方案

### 方案: 保持现状（推荐）

**理由**:
1. 两个实现服务不同场景
2. 统一会损失 `db/cache.ts` 的统计功能
3. `async.ts` 版本已被其他模块使用
4. `db/cache.ts` 版本仅内部使用

### 可选的改进

在 `src/lib/db/cache.ts` 开头添加注释，明确区分用途：

```typescript
/**
 * 数据库查询缓存和记忆化
 * 
 * 此模块提供:
 * - DatabaseCache: LRU 数据库缓存类
 * - MemoizationCache: 带统计的查询记忆化
 * - cached: 缓存装饰器
 * 
 * 注意: 如需通用函数记忆化，请使用 @/lib/utils/async 的 memoize
 */
```

---

## ✅ 验证结果

| 检查项 | 结果 |
|--------|------|
| TypeScript 错误 | 0 (仅测试文件有错误) |
| 导入冲突 | 无 |
| 运行时冲突 | 无 |

---

*报告生成时间: 2026-04-16*
