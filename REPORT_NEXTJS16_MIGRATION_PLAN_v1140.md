# Next.js 16 App Router 迁移实施方案

**项目版本**: 7zi-frontend v1.14.0
**Next.js 版本**: 16.2.1 → 16.2.1（已是最新）
**React 版本**: 19.2.4 → 19.2.4（已是最新）
**报告日期**: 2026-04-05
**报告人**: 🎨 设计师 子代理

---

## 📋 执行摘要

本报告基于咨询师的最佳实践研究，制定 Next.js 16 App Router 的详细迁移实施方案。项目当前使用 Next.js 16.2.1 和 React 19.2.4，版本已是最新的，但在高级特性使用上仍有优化空间。

**核心目标**：
1. 使用 Server Actions 替代部分 API 路由，减少网络开销
2. 实现智能缓存策略，提升性能 20-30%
3. 使用 Route Groups 重组路由结构，提升可维护性
4. 引入并行路由和拦截路由，优化用户体验

**预期收益**：
- 性能提升：20-30% 首屏加载速度提升
- 代码简化：减少 30% API 路由代码
- 开发效率：更清晰的代码组织和类型安全
- 用户体验：更流畅的交互和加载体验

---

## 📊 1. 当前项目分析

### 1.1 Next.js 版本和依赖

| 依赖 | 当前版本 | 目标版本 | 状态 |
|------|---------|---------|------|
| Next.js | 16.2.1 | 16.2.1 | ✅ 已是最新 |
| React | 19.2.4 | 19.2.4 | ✅ 已是最新 |
| React DOM | 19.2.4 | 19.2.4 | ✅ 已是最新 |
| next-intl | 4.8.3 | 4.8.3 | ✅ 已是最新 |

**结论**：所有核心依赖已是最新版本，无需版本升级。

### 1.2 App Router 使用情况

#### ✅ 已正确使用的特性

| 特性 | 状态 | 示例位置 |
|------|------|----------|
| Server Components | ✅ 已使用 | `src/app/[locale]/*` |
| Client Components | ✅ 已使用 | `src/app/[locale]/scheduler/SchedulerClient.tsx` |
| ISR（增量静态再生成）| ✅ 已使用 | `src/app/[locale]/portfolio/page.tsx` |
| 元数据 API | ✅ 已使用 | `src/app/[locale]/layout.tsx` |
| React 19 新特性 | ✅ 已使用 | `useDeferredValue`, `useTransition` |
| Server Actions | ⚠️ 有限使用 | 仅 `revalidate.ts` |
| 路由拦截 | ❌ 未使用 | - |
| 并行路由 | ❌ 未使用 | - |
| Route Groups | ❌ 未使用 | - |

#### ⚠️ 缓存策略现状

**当前实现**：
```typescript
// src/lib/cache/CacheManager.ts - 内存缓存
const cache = getCacheManager()
cache.set(cacheKey, metrics, CachePresets.LONG) // 5分钟 TTL
```

**HTTP 缓存头**：
```typescript
headers: {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
}
```

**缺失的缓存特性**：
- ❌ 未使用 `fetch` 缓存配置
- ❌ 未使用 `unstable_cache` (Next.js 内置缓存)
- ❌ 缺少 `revalidatePath` 和 `revalidateTag` 系统化应用
- ❌ 缺少缓存失效策略

### 1.3 API 路由分析

**现有 API 路由统计**（共 20+ 个）：

| API 路由 | 方法 | 功能 | 适合 Server Actions | 优先级 |
|---------|------|------|-------------------|--------|
| `/api/analytics/metrics` | GET/POST | 分析指标 | ❌ 数据查询 | P2 |
| `/api/feedback` | GET/POST | 反馈管理 | ✅ 简单 CRUD | **P0** |
| `/api/database/optimize` | POST | 数据库优化 | ✅ 管理操作 | **P0** |
| `/api/stream/health` | GET | 健康检查 | ❌ 流式响应 | P3 |
| `/api/revalidate` | POST | 缓存失效 | ✅ 已有 Action | P0 |
| `/api/workflow/*` | GET/POST/PATCH | 工作流管理 | ✅ CRUD | **P0** |
| `/api/multimodal/*` | POST | 多媒体处理 | ✅ 文件上传 | P1 |

**适合迁移到 Server Actions 的 API**：
- 反馈 CRUD 操作
- 数据库优化操作
- 工作流管理操作
- 缓存重新验证操作

**不适合迁移的 API**：
- 流式响应（SSE, WebSocket）
- 第三方 Webhook
- 需要复杂认证的 API

### 1.4 路由结构现状

```
src/app/[locale]/
├── about/
├── analytics/
├── agent-dashboard/
├── blog/
├── contact/
├── dashboard/
├── knowledge-lattice/
├── performance/
├── portfolio/
├── scheduler/
├── settings/
├── tasks/
└── team/
```

**问题**：
- 所有页面平铺在 `[locale]` 下，缺乏逻辑分组
- 共享布局和加载状态难以管理
- 代码组织不够清晰

---

## 🎯 2. 迁移方案设计

### 2.1 Server Actions 迁移方案

#### 方案概述

将适合的 API 路由迁移到 Server Actions，利用 Next.js 16 的以下优势：

1. **自动 CSRF 保护** - 无需手动实现
2. **类型安全** - 完整的 TypeScript 支持
3. **减少网络往返** - 直接调用服务器函数
4. **更简洁的代码** - 减少样板代码

#### 迁移优先级

**P0 - 高优先级（立即实施）**：

| API 路由 | 迁移目标 | 理由 |
|---------|---------|------|
| `/api/feedback` | `src/app/actions/feedback.ts` | 简单 CRUD，用户交互 |
| `/api/database/optimize` | `src/app/actions/database.ts` | 管理操作，适合 Action |
| `/api/revalidate` | 集成到 `src/app/actions/revalidate.ts` | 已有基础，扩展功能 |
| `/api/workflow/*` | `src/app/actions/workflow.ts` | 工作流 CRUD |

**P1 - 中优先级（短期实施）**：

| API 路由 | 迁移目标 | 理由 |
|---------|---------|------|
| `/api/multimodal/image` | `src/app/actions/multimodal.ts` | 文件上传，可迁移 |

**P2 - 低优先级（长期考虑）**：

| API 路由 | 不迁移原因 |
|---------|-----------|
| `/api/analytics/metrics` | 数据查询，已有良好缓存 |
| `/api/stream/*` | 流式响应，不适合 Action |

#### 具体实现

##### 2.1.1 反馈系统迁移

**当前 API**：
```typescript
// src/app/api/feedback/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json()
  const feedback = await createFeedback(body)
  return NextResponse.json({ success: true, data: feedback })
}
```

**迁移后 Server Action**：
```typescript
// src/app/actions/feedback.ts
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { getDatabaseAsync } from '@/lib/db/index'

// 输入验证 Schema
const CreateFeedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'general', 'complaint', 'compliment']),
  rating: z.number().min(1).max(5),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  email: z.string().email().optional(),
  metadata: z.record(z.any()).optional(),
})

export type CreateFeedbackInput = z.infer<typeof CreateFeedbackSchema>

/**
 * 创建反馈
 */
export async function createFeedback(input: CreateFeedbackInput) {
  // 验证输入
  const validated = CreateFeedbackSchema.parse(input)

  try {
    const db = await getDatabaseAsync()
    const feedbackId = crypto.randomUUID()
    const now = new Date().toISOString()

    // 插入数据库
    db.exec(
      `INSERT INTO feedbacks (id, type, rating, title, description, email, created_at, updated_at, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        feedbackId,
        validated.type,
        validated.rating,
        validated.title,
        validated.description,
        validated.email || null,
        now,
        now,
        validated.metadata ? JSON.stringify(validated.metadata) : null,
      ]
    )

    // 重新验证相关页面
    revalidatePath('/[locale]/feedback')
    revalidateTag('feedbacks')

    logger.info('Feedback created', { feedbackId, type: validated.type })

    return {
      success: true,
      data: {
        id: feedbackId,
        ...validated,
        created_at: now,
      },
    }
  } catch (error) {
    logger.error('Failed to create feedback', error)
    return {
      success: false,
      error: 'Failed to create feedback',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 获取反馈列表（带筛选和分页）
 */
export async function getFeedbacks(filters: {
  page?: number
  per_page?: number
  type?: string
  status?: string
  search?: string
}) {
  try {
    const db = await getDatabaseAsync()
    const page = filters.page || 1
    const per_page = Math.min(filters.per_page || 20, 100)
    const offset = (page - 1) * per_page

    // 构建查询
    const conditions: string[] = []
    const params: unknown[] = []

    if (filters.type) {
      conditions.push('type = ?')
      params.push(filters.type)
    }
    if (filters.status) {
      conditions.push('status = ?')
      params.push(filters.status)
    }
    if (filters.search) {
      conditions.push('(title LIKE ? OR description LIKE ?)')
      params.push(`%${filters.search}%`, `%${filters.search}%`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 获取总数
    const countResult = db.queryRows(
      `SELECT COUNT(*) as total FROM feedbacks ${whereClause}`,
      params
    )[0] as { total: number }
    const total = countResult.total

    // 获取数据
    const feedbacks = db.queryRows(
      `SELECT * FROM feedbacks ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, per_page, offset]
    )

    return {
      success: true,
      data: feedbacks.map(f => ({
        ...f,
        metadata: f.metadata ? JSON.parse(f.metadata as string) : undefined,
      })),
      meta: {
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
    }
  } catch (error) {
    logger.error('Failed to get feedbacks', error)
    return {
      success: false,
      error: 'Failed to get feedbacks',
    }
  }
}

/**
 * 更新反馈状态（管理员）
 */
export async function updateFeedbackStatus(
  id: string,
  status: 'pending' | 'reviewed' | 'resolved' | 'closed',
  adminNotes?: string
) {
  try {
    const db = await getDatabaseAsync()

    db.exec(
      `UPDATE feedbacks SET status = ?, admin_notes = ?, updated_at = ? WHERE id = ?`,
      [status, adminNotes || null, new Date().toISOString(), id]
    )

    revalidatePath('/[locale]/feedback')
    revalidateTag('feedbacks')

    return { success: true }
  } catch (error) {
    logger.error('Failed to update feedback', error)
    return {
      success: false,
      error: 'Failed to update feedback',
    }
  }
}

/**
 * 删除反馈（管理员）
 */
export async function deleteFeedback(id: string) {
  try {
    const db = await getDatabaseAsync()
    db.exec('DELETE FROM feedbacks WHERE id = ?', [id])

    revalidatePath('/[locale]/feedback')
    revalidateTag('feedbacks')

    return { success: true }
  } catch (error) {
    logger.error('Failed to delete feedback', error)
    return {
      success: false,
      error: 'Failed to delete feedback',
    }
  }
}
```

**客户端调用**：
```typescript
// src/components/feedback/FeedbackForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { createFeedback, type CreateFeedbackInput } from '@/app/actions/feedback'
import { toast } from 'sonner'

export function FeedbackForm() {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState<CreateFeedbackInput>({
    type: 'general',
    rating: 5,
    title: '',
    description: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      const result = await createFeedback(formData)

      if (result.success) {
        toast.success('Thank you for your feedback!')
        setFormData({
          type: 'general',
          rating: 5,
          title: '',
          description: '',
        })
      } else {
        toast.error(result.error || 'Failed to submit feedback')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 表单字段 */}
      <button
        type="submit"
        disabled={isPending}
        className="btn btn-primary"
      >
        {isPending ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  )
}
```

##### 2.1.2 数据库优化迁移

**当前 API**：
```typescript
// src/app/api/database/optimize/route.ts
export async function POST(request: NextRequest) {
  await optimizeDatabase()
  return NextResponse.json({ success: true })
}
```

**迁移后 Server Action**：
```typescript
// src/app/actions/database.ts
'use server'

import { revalidateTag } from 'next/cache'
import { logger } from '@/lib/logger'
import { getDatabaseAsync } from '@/lib/db/index'

/**
 * 优化数据库（VACUUM, ANALYZE）
 */
export async function optimizeDatabase() {
  try {
    const db = await getDatabaseAsync()

    // 执行 VACUUM
    logger.info('Starting VACUUM...')
    db.exec('VACUUM')

    // 执行 ANALYZE
    logger.info('Starting ANALYZE...')
    db.exec('ANALYZE')

    // 更新性能相关缓存
    revalidateTag('performance')

    logger.info('Database optimization completed')

    return {
      success: true,
      message: 'Database optimized successfully',
    }
  } catch (error) {
    logger.error('Database optimization failed', error)
    return {
      success: false,
      error: 'Database optimization failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 获取数据库统计信息
 */
export async function getDatabaseStats() {
  try {
    const db = await getDatabaseAsync()

    const stats = {
      tables: db.queryRows("SELECT name FROM sqlite_master WHERE type='table'").length,
      size: db.queryRows("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()")[0]?.size || 0,
      version: db.queryRows('SELECT sqlite_version() as version')[0]?.version || 'unknown',
    }

    return {
      success: true,
      data: stats,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to get database stats',
    }
  }
}
```

##### 2.1.3 工作流管理迁移

```typescript
// src/app/actions/workflow.ts
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { getDatabaseAsync } from '@/lib/db/index'

const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  status: z.enum(['draft', 'active', 'paused', 'archived']).default('draft'),
  trigger_type: z.enum(['manual', 'webhook', 'schedule', 'event']).default('manual'),
})

export async function createWorkflow(input: z.infer<typeof CreateWorkflowSchema>) {
  const validated = CreateWorkflowSchema.parse(input)

  try {
    const db = await getDatabaseAsync()
    const workflowId = crypto.randomUUID()
    const now = new Date().toISOString()

    db.exec(
      `INSERT INTO workflows (id, name, description, status, trigger_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [workflowId, validated.name, validated.description, validated.status, validated.trigger_type, now, now]
    )

    revalidatePath('/[locale]/workflows')
    revalidateTag('workflows')

    logger.info('Workflow created', { workflowId })

    return { success: true, data: { id: workflowId, ...validated, created_at: now } }
  } catch (error) {
    logger.error('Failed to create workflow', error)
    return { success: false, error: 'Failed to create workflow' }
  }
}

export async function updateWorkflow(id: string, updates: Partial<z.infer<typeof CreateWorkflowSchema>>) {
  try {
    const db = await getDatabaseAsync()

    const updatesList: string[] = []
    const params: unknown[] = []

    if (updates.name) {
      updatesList.push('name = ?')
      params.push(updates.name)
    }
    if (updates.description !== undefined) {
      updatesList.push('description = ?')
      params.push(updates.description)
    }
    if (updates.status) {
      updatesList.push('status = ?')
      params.push(updates.status)
    }
    if (updates.trigger_type) {
      updatesList.push('trigger_type = ?')
      params.push(updates.trigger_type)
    }

    updatesList.push('updated_at = ?')
    params.push(new Date().toISOString())
    params.push(id)

    db.exec(`UPDATE workflows SET ${updatesList.join(', ')} WHERE id = ?`, params)

    revalidatePath('/[locale]/workflows')
    revalidateTag('workflows')

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to update workflow' }
  }
}

export async function deleteWorkflow(id: string) {
  try {
    const db = await getDatabaseAsync()
    db.exec('DELETE FROM workflows WHERE id = ?', [id])

    revalidatePath('/[locale]/workflows')
    revalidateTag('workflows')

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete workflow' }
  }
}

export async function executeWorkflow(id: string, input: Record<string, any>) {
  try {
    const db = await getDatabaseAsync()
    const now = new Date().toISOString()

    // 创建执行记录
    const executionId = crypto.randomUUID()
    db.exec(
      `INSERT INTO workflow_executions (id, workflow_id, status, input, started_at)
       VALUES (?, ?, ?, ?, ?)`,
      [executionId, id, 'running', JSON.stringify(input), now]
    )

    // TODO: 实际执行工作流逻辑
    // 这里应该调用工作流引擎

    revalidateTag('workflow-executions')

    return { success: true, data: { executionId } }
  } catch (error) {
    return { success: false, error: 'Failed to execute workflow' }
  }
}
```

#### 迁移回滚方案

如果 Server Actions 迁移出现问题，可以快速回滚：

```bash
# 1. 保留 API 路由文件（添加 .bak 后缀）
mv src/app/api/feedback/route.ts src/app/api/feedback/route.ts.bak

# 2. 如果需要回滚
mv src/app/api/feedback/route.ts.bak src/app/api/feedback/route.ts

# 3. 删除对应的 Server Actions
rm src/app/actions/feedback.ts
```

**回滚检查清单**：
- [ ] 保留原始 API 路由备份
- [ ] 客户端调用已更新为使用 Server Actions
- [ ] 测试所有功能正常工作
- [ ] 确认回滚路径可用

### 2.2 智能缓存策略实施方案

#### 方案概述

Next.js 16 提供多层缓存机制：

| 缓存层 | 技术 | 适用场景 | TTL |
|--------|------|---------|-----|
| **HTTP 缓存** | CDN + 浏览器缓存 | 公共静态资源 | 1h - 7d |
| **ISR 缓存** | `export const revalidate` | 页面级缓存 | 60s - 1h |
| **fetch 缓存** | `next: { revalidate, tags }` | API 请求缓存 | 60s - 1h |
| **unstable_cache** | 函数级缓存 | 复杂计算缓存 | 5m - 1h |
| **内存缓存** | `CacheManager` | 热数据缓存 | 30s - 5m |

#### 实现方案

##### 2.2.1 fetch 缓存配置

**当前问题**：所有 fetch 调用未配置缓存

**优化后**：
```typescript
// src/lib/api/fetcher.ts
import { unstable_cache } from 'next/cache'

/**
 * 带缓存的 Fetch 封装
 */
export async function fetchWithCache<T>(
  url: string,
  options: RequestInit = {},
  cacheOptions?: {
    revalidate?: number | false
    tags?: string[]
  }
): Promise<T> {
  const nextOptions = {
    ...options,
    next: {
      revalidate: cacheOptions?.revalidate || 300, // 默认 5 分钟
      tags: cacheOptions?.tags || [],
    },
  }

  const response = await fetch(url, nextOptions)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

/**
 * 使用 unstable_cache 缓存复杂计算
 */
export const getCachedData = unstable_cache(
  async (key: string, fetcher: () => Promise<any>) => {
    return await fetcher()
  },
  ['cached-data'],
  {
    revalidate: 300,
    tags: ['cached-data'],
  }
)
```

**应用示例**：
```typescript
// src/app/[locale]/portfolio/page.tsx
import { fetchWithCache } from '@/lib/api/fetcher'
import { revalidateTag } from 'next/cache'

export const revalidate = 3600 // 1小时

export default async function PortfolioPage() {
  // 使用 fetch 缓存
  const projects = await fetchWithCache(
    `${process.env.API_URL}/projects`,
    {},
    {
      revalidate: 1800, // 30分钟
      tags: ['projects'],
    }
  )

  return <PortfolioGrid projects={projects} />
}

// Server Action 中按需失效
export async function updateProject(id: string, data: any) {
  await updateProjectInDatabase(id, data)
  revalidateTag('projects') // 失效所有带 'projects' 标签的缓存
}
```

##### 2.2.2 智能 CacheManager 集成

扩展现有 CacheManager 以支持 Next.js 缓存：

```typescript
// src/lib/cache/NextCacheAdapter.ts
import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache'
import { CachePresets } from './CacheManager'

/**
 * Next.js 缓存适配器
 * 将内存缓存与 Next.js 缓存集成
 */
export class NextCacheAdapter {
  /**
   * 创建带 Next.js 缓存的数据获取函数
   */
  static createCachedFetcher<T>(
    key: string,
    fetcher: (...args: any[]) => Promise<T>,
    options?: {
      revalidate?: number | false
      tags?: string[]
    }
  ) {
    const cachedFetcher = unstable_cache(
      fetcher,
      [key],
      {
        revalidate: options?.revalidate || CachePresets.LONG.ttl,
        tags: options?.tags || [key],
      }
    )

    return cachedFetcher
  }

  /**
   * 按标签重新验证
   */
  static revalidateByTag(tag: string) {
    revalidateTag(tag)
  }

  /**
   * 按路径重新验证
   */
  static revalidateByPath(path: string) {
    revalidatePath(path)
  }

  /**
   * 批量重新验证
   */
  static revalidateMultiple(tags: string[]) {
    tags.forEach(tag => revalidateTag(tag))
  }
}

/**
 * 使用示例
 */
// 创建缓存的指标获取函数
const getCachedMetrics = NextCacheAdapter.createCachedFetcher(
  'analytics-metrics',
  async (filters: AnalyticsFilters) => {
    return await fetchMetricsFromDatabase(filters)
  },
  {
    revalidate: 300, // 5分钟
    tags: ['analytics', 'metrics'],
  }
)

// 使用
const metrics = await getCachedMetrics(filters)

// 失效缓存
NextCacheAdapter.revalidateByTag('analytics')
```

##### 2.2.3 缓存失效策略

```typescript
// src/app/actions/cache.ts
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { NextCacheAdapter } from '@/lib/cache/NextCacheAdapter'
import { logger } from '@/lib/logger'

/**
 * 缓存失效策略
 */
export const CacheInvalidationStrategy = {
  // 内容更新时失效
  content: {
    project: ['projects', `project:${id}`],
    blog: ['posts', `post:${id}`],
    feedback: ['feedbacks'],
  },

  // 数据变化时失效
  data: {
    analytics: ['analytics', 'metrics', 'timeseries'],
    performance: ['performance'],
    database: ['database-stats'],
  },

  // 用户操作时失效
  user: {
    login: ['user-profile', 'user-sessions'],
    logout: ['user-profile'],
  },
}

/**
 * 智能缓存失效
 */
export async function invalidateCache(type: 'content' | 'data' | 'user', entity: string, id?: string) {
  const tags = CacheInvalidationStrategy[type][entity as keyof typeof CacheInvalidationStrategy[typeof type]]

  if (!tags) {
    logger.warn('Unknown cache entity', { type, entity })
    return
  }

  // 替换 ID 占位符
  const resolvedTags = tags.map(tag => tag.replace(':id', id || ''))

  // 批量失效
  NextCacheAdapter.revalidateMultiple(resolvedTags)

  logger.info('Cache invalidated', { type, entity, id, tags: resolvedTags })
}

/**
 * 手动重新验证路径
 */
export async function revalidatePathAction(path: string) {
  revalidatePath(path)
  logger.info('Path revalidated', { path })
}

/**
 * 手动重新验证标签
 */
export async function revalidateTagAction(tag: string) {
  revalidateTag(tag)
  logger.info('Tag revalidated', { tag })
}

/**
 * 批量重新验证
 */
export async function revalidateMultipleAction(tags: string[]) {
  tags.forEach(tag => revalidateTag(tag))
  logger.info('Multiple tags revalidated', { tags })
}
```

##### 2.2.4 页面级缓存配置

```typescript
// src/app/[locale]/analytics/page.tsx
import { fetchWithCache } from '@/lib/api/fetcher'

// 页面级 ISR 缓存：1分钟
export const revalidate = 60

export default async function AnalyticsPage() {
  // 使用 fetch 缓存：5分钟
  const metrics = await fetchWithCache(
    '/api/analytics/metrics?timeRange=week',
    {},
    {
      revalidate: 300,
      tags: ['analytics', 'metrics-week'],
    }
  )

  return <AnalyticsDashboard metrics={metrics} />
}

// src/app/[locale]/portfolio/[slug]/page.tsx
// 动态路由页面：1小时
export const revalidate = 3600

export async function generateStaticParams() {
  const projects = await getAllProjects()
  return projects.map(p => ({ slug: p.slug }))
}

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const project = await fetchWithCache(
    `/api/projects/${params.slug}`,
    {},
    {
      revalidate: 1800,
      tags: ['projects', `project:${params.slug}`],
    }
  )

  return <ProjectDetail project={project} />
}
```

#### 缓存性能监控

```typescript
// src/lib/cache/CacheMonitor.ts
export class CacheMonitor {
  private static hits = new Map<string, number>()
  private static misses = new Map<string, number>()

  static hit(key: string) {
    this.hits.set(key, (this.hits.get(key) || 0) + 1)
  }

  static miss(key: string) {
    this.misses.set(key, (this.misses.get(key) || 0) + 1)
  }

  static getStats() {
    const totalHits = Array.from(this.hits.values()).reduce((a, b) => a + b, 0)
    const totalMisses = Array.from(this.misses.values()).reduce((a, b) => a + b, 0)
    const hitRate = totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0

    return {
      totalHits,
      totalMisses,
      hitRate: hitRate * 100,
      byKey: {
        hits: Object.fromEntries(this.hits),
        misses: Object.fromEntries(this.misses),
      },
    }
  }

  static logStats() {
    const stats = this.getStats()
    logger.info('Cache statistics', stats)
  }
}

// 使用示例
// src/lib/api/fetcher.ts
export async function fetchWithCache<T>(url: string, options: RequestInit = {}, cacheOptions?: any): Promise<T> {
  const cacheKey = generateCacheKey(url, options)

  // 检查缓存
  const cached = checkCache(cacheKey)
  if (cached) {
    CacheMonitor.hit(cacheKey)
    return cached
  }

  CacheMonitor.miss(cacheKey)

  // 获取数据
  const data = await fetchAndParse<T>(url, options)

  // 缓存数据
  setCache(cacheKey, data, cacheOptions)

  return data
}
```

### 2.3 Route Groups 重构方案

#### 方案概述

使用 Route Groups 将相关页面组织在一起，实现：

1. **代码组织更清晰** - 按功能模块分组
2. **共享布局** - 每个组可以有独立的布局
3. **共享加载状态** - 统一的 loading.tsx
4. **不影响 URL** - 路由组不影响 URL 结构

#### 重构结构

**当前结构**：
```
src/app/[locale]/
├── about/
├── analytics/
├── dashboard/
├── portfolio/
├── blog/
├── contact/
├── team/
├── settings/
└── ...
```

**重构后结构**：
```
src/app/[locale]/
├── (marketing)/          # 营销页面组（公开访问）
│   ├── layout.tsx       # 营销布局（头部、底部）
│   ├── loading.tsx      # 统一加载状态
│   ├── error.tsx        # 统一错误处理
│   ├── about/
│   ├── portfolio/
│   ├── blog/
│   ├── team/
│   └── contact/
├── (app)/                # 应用页面组（需要认证）
│   ├── layout.tsx       # 应用布局（侧边栏、导航）
│   ├── loading.tsx
│   ├── error.tsx
│   ├── dashboard/
│   ├── analytics/
│   ├── scheduler/
│   ├── tasks/
│   └── settings/
├── (admin)/              # 管理页面组（管理员）
│   ├── layout.tsx       # 管理布局
│   ├── loading.tsx
│   ├── error.tsx
│   ├── agent-dashboard/
│   └── knowledge-lattice/
└── layout.tsx            # 根布局
```

#### 实现示例

##### 2.3.1 营销页面组

```typescript
// src/app/[locale]/(marketing)/layout.tsx
import { getTranslations } from 'next-intl/server'
import MarketingHeader from '@/components/marketing/MarketingHeader'
import MarketingFooter from '@/components/marketing/MarketingFooter'

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = await getTranslations('marketing')

  return (
    <div className="marketing-layout min-h-screen flex flex-col">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  )
}

// src/app/[locale]/(marketing)/loading.tsx
export default function MarketingLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-16 bg-gray-200" /> {/* Header skeleton */}
      <div className="container mx-auto py-8">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}

// src/app/[locale]/(marketing)/error.tsx
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-6">{error.message}</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
```

##### 2.3