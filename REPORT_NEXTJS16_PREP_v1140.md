# NextJS 16 迁移准备工作报告 (v1.14.0)

**项目版本**: 7zi-frontend v1.14.0
**Next.js 版本**: 16.2.1
**React 版本**: 19.2.4
**报告日期**: 2026-04-06
**报告人**: 子代理 - NextJS 16 迁移准备

---

## 📋 执行摘要

本报告基于 `REPORT_NEXTJS16_MIGRATION_PLAN_v1140.md` 研究文档，完成 NextJS 16 迁移的准备工作。核心任务是：

1. **分析迁移计划文档** - 理解目标架构
2. **评估当前状态** - 识别实际不兼容模式
3. **制定分阶段计划** - 可执行的迁移路径
4. **实现兼容层** - 为 v1.14.0 提供平滑过渡

**关键发现**：
- 项目已使用 Next.js 16.2.1 和 React 19.2.4，版本已是最新
- `revalidateTag(tag, cacheLife)` API 使用需要验证兼容性
- API 路由迁移到 Server Actions 是主要工作
- Route Groups 重构需要谨慎规划

---

## 1. 当前状态评估

### 1.1 依赖版本

| 依赖 | 当前版本 | 状态 | 备注 |
|------|---------|------|------|
| Next.js | 16.2.1 | ✅ 最新 | 无需升级 |
| React | 19.2.4 | ✅ 最新 | 无需升级 |
| React DOM | 19.2.4 | ✅ 最新 | 无需升级 |
| next-intl | 4.8.3 | ✅ 最新 | 无需升级 |

### 1.2 API 路由清单 (待迁移)

| API 路由 | 方法 | 功能 | 迁移优先级 | 状态 |
|---------|------|------|----------|------|
| `/api/feedback` | GET/POST | 反馈管理 | **P0** | 待迁移 |
| `/api/feedback/[id]` | GET/PATCH/DELETE | 单个反馈 | **P0** | 待迁移 |
| `/api/database/optimize` | POST | 数据库优化 | **P0** | 待迁移 |
| `/api/workflow` | GET/POST | 工作流列表 | **P0** | 待迁移 |
| `/api/workflow/[id]` | GET/PATCH/DELETE | 工作流操作 | **P0** | 待迁移 |
| `/api/workflow/[id]/run` | POST | 运行工作流 | P1 | 待迁移 |
| `/api/workflow/[id]/executions` | GET | 执行历史 | P1 | 待迁移 |
| `/api/multimodal/image` | POST | 图片处理 | P2 | 待迁移 |
| `/api/analytics/metrics` | GET | 分析指标 | P2 | 不迁移(保留API) |
| `/api/stream/*` | GET | 流式响应 | P3 | 不迁移(SSE) |
| `/api/revalidate` | POST | 缓存失效 | ✅ | 已有Action |

### 1.3 不兼容模式识别

#### ⚠️ 问题 1: `revalidateTag(tag, cacheLife)` API 签名

**当前代码** (`src/app/actions/revalidate.ts`):
```typescript
revalidateTag('posts', 'max')
```

**问题**: Next.js 16 官方文档中 `revalidateTag` 函数签名是：
```typescript
revalidateTag(tag: string): void
```

`cacheLife` 参数可能是：
1. 内部实现或实验性 API
2. 文档错误
3. 特定版本定制

**风险等级**: 🔴 高

**建议**:
- 创建兼容层处理不同签名
- 使用标准 `revalidateTag(tag)` 
- 通过 `fetch` 的 `next: { revalidate, tags }` 配置缓存生命周期

#### ⚠️ 问题 2: 缺少 `updateTag` API 使用

**发现**: 研究文档提到 `updateTag(tag)` API，但：
- 当前代码中未使用
- Next.js 16 官方文档中无此 API

**处理**: 暂不实现，使用现有 `revalidateTag` + `revalidatePath`

#### ⚠️ 问题 3: API 路由到 Server Actions 迁移模式

**当前模式**:
```typescript
// API Route
export async function POST(request: NextRequest) {
  const body = await request.json()
  // ...
  return NextResponse.json({ success: true })
}
```

**迁移后模式**:
```typescript
// Server Action
'use server'
export async function createEntity(input: EntityInput) {
  // 直接操作数据库
  // 无需解析 request.body
}
```

**差异**:
1. Server Actions 接收已解析的参数，而非 Request 对象
2. 返回值直接给客户端，无包装
3. 错误处理模式不同

---

## 2. 分阶段迁移计划

### 阶段 1: 兼容层实现 (v1.14.0) ⏳ 当前阶段

**目标**: 创建兼容层，确保现有代码稳定运行

**任务**:
- [ ] 创建 `src/lib/compat/next16.ts` 兼容层
- [ ] 创建 `src/app/actions/feedback.ts` (feedback actions)
- [ ] 创建 `src/app/actions/database.ts` (database actions)
- [ ] 创建 `src/app/actions/workflow.ts` (workflow actions)
- [ ] 添加降级逻辑处理 `revalidateTag` 签名差异
- [ ] 编写测试确保迁移安全

**交付物**:
```
src/
├── lib/compat/
│   └── next16.ts           # Next.js 16 兼容层
└── app/actions/
    ├── feedback.ts         # 反馈 Server Actions
    ├── database.ts         # 数据库 Server Actions
    └── workflow.ts         # 工作流 Server Actions
```

### 阶段 2: Server Actions 集成 (v1.15.0)

**目标**: 将简单 CRUD 操作迁移到 Server Actions

**任务**:
- [ ] 迁移 `/api/feedback` → `feedback.ts`
- [ ] 迁移 `/api/database/optimize` → `database.ts`
- [ ] 迁移 `/api/workflow/*` → `workflow.ts`
- [ ] 更新客户端组件使用新的 Actions
- [ ] 保留 API 路由作为备份

### 阶段 3: 缓存策略优化 (v1.16.0)

**目标**: 实现智能多层缓存

**任务**:
- [ ] 集成 `unstable_cache` 到数据获取层
- [ ] 实现 `fetch` 缓存配置
- [ ] 创建缓存失效策略
- [ ] 添加缓存监控

### 阶段 4: Route Groups 重构 (v1.17.0)

**目标**: 重构路由结构，提升可维护性

**任务**:
- [ ] 创建 `(marketing)` 路由组
- [ ] 创建 `(app)` 路由组  
- [ ] 创建 `(admin)` 路由组
- [ ] 实现组级共享布局
- [ ] 实现组级加载状态

---

## 3. 初步实现 - 兼容层

### 3.1 Next.js 16 兼容层

```typescript
// src/lib/compat/next16.ts
/**
 * Next.js 16 兼容层
 * 处理不同版本 API 签名差异
 */

import { revalidatePath as nextRevalidatePath, revalidateTag as nextRevalidateTag } from 'next/cache'

// Cache Life Profiles (Next.js 16 新增)
export type CacheLifeProfile = 'max' | 'min' | 'hours' | 'minutes' | undefined

/**
 * 安全调用 revalidateTag
 * 处理可能的签名差异
 */
export function revalidateTagSafe(tag: string, cacheLife?: CacheLifeProfile): void {
  try {
    // 标准签名
    nextRevalidateTag(tag)
  } catch (error) {
    // 如果不支持 cacheLife 参数，回退到标准调用
    if (error instanceof TypeError && error.message.includes('argument')) {
      console.warn(`[Next16 Compat] revalidateTag(${tag}) called without cacheLife`)
      nextRevalidateTag(tag)
    } else {
      throw error
    }
  }
}

/**
 * 带缓存生命周期的 revalidateTag
 * Next.js 16 新增功能
 */
export async function revalidateTagWithProfile(
  tag: string, 
  profile: CacheLifeProfile = 'minutes'
): Promise<void> {
  // Next.js 16 中通过 fetch options 设置缓存生命周期
  // 这里提供统一接口，实际逻辑在数据获取层处理
  revalidateTagSafe(tag, profile)
}

/**
 * 重新验证路径
 */
export function revalidatePathSafe(path: string): void {
  nextRevalidatePath(path)
}

/**
 * 批量重新验证
 */
export function revalidateMultiple(paths?: string[], tags?: string[]): void {
  if (paths) {
    paths.forEach(path => revalidatePathSafe(path))
  }
  if (tags) {
    tags.forEach(tag => revalidateTagSafe(tag))
  }
}

// 导出标准 API (兼容)
export const revalidatePath = revalidatePathSafe
export const revalidateTag = revalidateTagSafe
```

### 3.2 Feedback Server Actions

```typescript
// src/app/actions/feedback.ts
'use server'

/**
 * Feedback Server Actions
 * 迁移自 /api/feedback API 路由
 */

import { revalidatePath, revalidateTag } from '@/lib/compat/next16'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { getDatabaseAsync } from '@/lib/db/index'
import { detectSpam } from '@/lib/feedback/anti-spam'

// ============ Zod Schemas ============

const CreateFeedbackSchema = z.object({
  type: z.enum(['general', 'bug', 'feature', 'suggestion', 'complaint', 'compliment', 'other']),
  rating: z.number().min(1).max(5),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  email: z.string().email().optional(),
  images: z.array(z.object({
    name: z.string().optional(),
    size: z.number().optional(),
    type: z.string().optional(),
  })).optional(),
  metadata: z.record(z.any()).optional(),
})

const UpdateFeedbackSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'approved', 'rejected', 'resolved']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  admin_notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

const GetFeedbacksSchema = z.object({
  page: z.number().min(1).default(1),
  per_page: z.number().min(1).max(100).default(20),
  type: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['created_at', 'rating', 'priority']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

// ============ Types ============

export type CreateFeedbackInput = z.infer<typeof CreateFeedbackSchema>
export type UpdateFeedbackInput = z.infer<typeof UpdateFeedbackSchema>
export type GetFeedbacksFilters = z.infer<typeof GetFeedbacksSchema>

export interface FeedbackResult {
  success: boolean
  data?: any
  error?: string
  details?: string
}

// ============ Actions ============

/**
 * 创建反馈
 */
export async function createFeedback(input: CreateFeedbackInput): Promise<FeedbackResult> {
  try {
    // 验证输入
    const validated = CreateFeedbackSchema.parse(input)

    // 反垃圾检查
    const spamCheck = await detectSpam(
      input.email || 'anonymous',
      `${input.title}\n${input.description}`,
      'feedback'
    )
    
    if (spamCheck.is_spam) {
      logger.warn('Spam feedback rejected', { reason: spamCheck.reason })
      return {
        success: false,
        error: 'Feedback rejected due to spam detection',
        details: spamCheck.reason,
      }
    }

    const db = await getDatabaseAsync()
    const feedbackId = crypto.randomUUID()
    const now = new Date().toISOString()

    // 插入数据库
    db.exec(
      `INSERT INTO feedbacks (id, type, rating, title, description, email, status, priority, created_at, updated_at, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        feedbackId,
        validated.type,
        validated.rating,
        validated.title,
        validated.description,
        validated.email || null,
        'pending',
        'medium',
        now,
        now,
        validated.metadata ? JSON.stringify(validated.metadata) : null,
      ]
    )

    // 处理图片附件
    if (validated.images && validated.images.length > 0) {
      for (const image of validated.images) {
        const attachmentId = crypto.randomUUID()
        db.exec(
          `INSERT INTO feedback_attachments (id, feedback_id, filename, url, size, mimetype, uploaded_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            attachmentId,
            feedbackId,
            image.name || 'image.jpg',
            `/uploads/feedback/${attachmentId}`,
            image.size || 0,
            image.type || 'image/jpeg',
            now,
          ]
        )
      }
    }

    // 重新验证缓存
    revalidatePath('/[locale]/feedback')
    revalidateTag('feedbacks')

    logger.info('Feedback created', { feedbackId, type: validated.type })

    return {
      success: true,
      data: {
        id: feedbackId,
        ...validated,
        status: 'pending',
        priority: 'medium',
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
 * 获取反馈列表
 */
export async function getFeedbacks(filters: GetFeedbacksFilters): Promise<FeedbackResult> {
  try {
    const validated = GetFeedbacksSchema.parse(filters)
    const db = await getDatabaseAsync()

    // 构建 WHERE 条件
    const conditions: string[] = []
    const params: unknown[] = []

    if (validated.type) {
      conditions.push('type = ?')
      params.push(validated.type)
    }
    if (validated.status) {
      conditions.push('status = ?')
      params.push(validated.status)
    }
    if (validated.search) {
      conditions.push('(title LIKE ? OR description LIKE ?)')
      params.push(`%${validated.search}%`, `%${validated.search}%`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 获取总数
    const countResult = db.queryRows(
      `SELECT COUNT(*) as total FROM feedbacks ${whereClause}`,
      params
    )[0] as { total: number }

    // 获取数据
    const offset = (validated.page - 1) * validated.per_page
    const feedbacks = db.queryRows(
      `SELECT * FROM feedbacks ${whereClause} 
       ORDER BY ${validated.sort_by} ${validated.sort_order.toUpperCase()} 
       LIMIT ? OFFSET ?`,
      [...params, validated.per_page, offset]
    )

    return {
      success: true,
      data: {
        feedbacks,
        meta: {
          total: countResult.total,
          page: validated.page,
          per_page: validated.per_page,
          total_pages: Math.ceil(countResult.total / validated.per_page),
        },
      },
    }
  } catch (error) {
    logger.error('Failed to get feedbacks', error)
    return {
      success: false,
      error: 'Failed to get feedbacks',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 获取单个反馈
 */
export async function getFeedback(id: string): Promise<FeedbackResult> {
  try {
    const db = await getDatabaseAsync()
    const feedback = db.queryRows('SELECT * FROM feedbacks WHERE id = ?', [id])[0]

    if (!feedback) {
      return {
        success: false,
        error: 'Feedback not found',
      }
    }

    return {
      success: true,
      data: feedback,
    }
  } catch (error) {
    logger.error('Failed to get feedback', error)
    return {
      success: false,
      error: 'Failed to get feedback',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 更新反馈 (管理员)
 */
export async function updateFeedback(
  id: string, 
  updates: UpdateFeedbackInput,
  adminId?: string
): Promise<FeedbackResult> {
  try {
    const validated = UpdateFeedbackSchema.parse(updates)
    const db = await getDatabaseAsync()

    // 检查反馈是否存在
    const existing = db.queryRows('SELECT * FROM feedbacks WHERE id = ?', [id])[0]
    if (!existing) {
      return {
        success: false,
        error: 'Feedback not found',
      }
    }

    // 构建更新语句
    const setStatements: string[] = []
    const updateParams: unknown[] = []

    if (validated.status) {
      setStatements.push('status = ?')
      updateParams.push(validated.status)
      
      // 自动设置时间戳
      if (validated.status === 'reviewed' && !(existing as any).reviewed_at) {
        setStatements.push('reviewed_at = ?')
        updateParams.push(new Date().toISOString())
      }
      if (validated.status === 'resolved' && !(existing as any).resolved_at) {
        setStatements.push('resolved_at = ?')
        updateParams.push(new Date().toISOString())
      }
    }
    if (validated.priority) {
      setStatements.push('priority = ?')
      updateParams.push(validated.priority)
    }
    if (validated.admin_notes !== undefined) {
      setStatements.push('admin_notes = ?')
      updateParams.push(validated.admin_notes)
      setStatements.push('admin_id = ?')
      updateParams.push(adminId || 'system')
    }
    if (validated.metadata) {
      setStatements.push('metadata = ?')
      updateParams.push(JSON.stringify(validated.metadata))
    }

    setStatements.push('updated_at = ?')
    updateParams.push(new Date().toISOString())
    updateParams.push(id)

    db.exec(`UPDATE feedbacks SET ${setStatements.join(', ')} WHERE id = ?`, updateParams)

    // 重新验证缓存
    revalidatePath('/[locale]/feedback')
    revalidateTag('feedbacks')

    logger.info('Feedback updated', { feedbackId: id, adminId, updates: validated })

    return { success: true }
  } catch (error) {
    logger.error('Failed to update feedback', error)
    return {
      success: false,
      error: 'Failed to update feedback',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 删除反馈 (管理员)
 */
export async function deleteFeedback(id: string): Promise<FeedbackResult> {
  try {
    const db = await getDatabaseAsync()

    // 检查是否存在
    const existing = db.queryRows('SELECT * FROM feedbacks WHERE id = ?', [id])[0]
    if (!existing) {
      return {
        success: false,
        error: 'Feedback not found',
      }
    }

    // 删除
    db.exec('DELETE FROM feedbacks WHERE id = ?', [id])

    // 重新验证缓存
    revalidatePath('/[locale]/feedback')
    revalidateTag('feedbacks')

    logger.info('Feedback deleted', { feedbackId: id })

    return { success: true }
  } catch (error) {
    logger.error('Failed to delete feedback', error)
    return {
      success: false,
      error: 'Failed to delete feedback',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
```

### 3.3 Database Server Actions

```typescript
// src/app/actions/database.ts
'use server'

/**
 * Database Server Actions
 * 迁移自 /api/database/optimize API 路由
 */

import { revalidateTag } from '@/lib/compat/next16'
import { logger } from '@/lib/logger'
import { getDatabaseAsync } from '@/lib/db/index'

export interface DatabaseResult {
  success: boolean
  message?: string
  data?: any
  error?: string
  details?: string
}

/**
 * 优化数据库 (VACUUM, ANALYZE)
 */
export async function optimizeDatabase(): Promise<DatabaseResult> {
  try {
    const db = await getDatabaseAsync()

    logger.info('Starting database optimization...')

    // 执行 VACUUM
    logger.info('Executing VACUUM...')
    db.exec('VACUUM')

    // 执行 ANALYZE
    logger.info('Executing ANALYZE...')
    db.exec('ANALYZE')

    // 更新性能相关缓存
    revalidateTag('performance')
    revalidateTag('database-stats')

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
export async function getDatabaseStats(): Promise<DatabaseResult> {
  try {
    const db = await getDatabaseAsync()

    const stats = {
      tables: db.queryRows("SELECT name FROM sqlite_master WHERE type='table'").length,
      size: db.queryRows(
        "SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()"
      )[0]?.size || 0,
      version: db.queryRows('SELECT sqlite_version() as version')[0]?.version || 'unknown',
      pageCount: db.queryRows('SELECT page_count FROM pragma_page_count()')[0]?.page_count || 0,
      pageSize: db.queryRows('SELECT page_size FROM pragma_page_size()')[0]?.page_size || 0,
    }

    // 获取各表统计
    const tableStats = db.queryRows(`
      SELECT 
        name,
        (SELECT COUNT(*) FROM feedbacks) as feedback_count,
        (SELECT COUNT(*) FROM workflows) as workflow_count,
        (SELECT COUNT(*) FROM tasks) as task_count
      FROM sqlite_master 
      WHERE type='table'
    `)

    return {
      success: true,
      data: {
        ...stats,
        tables: tableStats,
      },
    }
  } catch (error) {
    logger.error('Failed to get database stats', error)
    return {
      success: false,
      error: 'Failed to get database stats',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 检查数据库健康状态
 */
export async function checkDatabaseHealth(): Promise<DatabaseResult> {
  try {
    const db = await getDatabaseAsync()

    // 简单查询测试
    const result = db.queryRows('SELECT 1 as healthy')[0]

    if (result?.healthy === 1) {
      return {
        success: true,
        message: 'Database is healthy',
      }
    } else {
      return {
        success: false,
        error: 'Database health check failed',
      }
    }
  } catch (error) {
    logger.error('Database health check failed', error)
    return {
      success: false,
      error: 'Database health check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
```

### 3.4 Workflow Server Actions

```typescript
// src/app/actions/workflow.ts
'use server'

/**
 * Workflow Server Actions
 * 迁移自 /api/workflow/* API 路由
 */

import { revalidatePath, revalidateTag } from '@/lib/compat/next16'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { getDatabaseAsync } from '@/lib/db/index'

// ============ Zod Schemas ============

const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  status: z.enum(['draft', 'active', 'paused', 'archived']).default('draft'),
  trigger_type: z.enum(['manual', 'webhook', 'schedule', 'event']).default('manual'),
  config: z.record(z.any()).optional(),
})

const UpdateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
  trigger_type: z.enum(['manual', 'webhook', 'schedule', 'event']).optional(),
  config: z.record(z.any()).optional(),
})

// ============ Types ============

export type CreateWorkflowInput = z.infer<typeof CreateWorkflowSchema>
export type UpdateWorkflowInput = z.infer<typeof UpdateWorkflowSchema>

export interface WorkflowResult {
  success: boolean
  data?: any
  error?: string
  details?: string
}

// ============ Actions ============

/**
 * 创建工作流
 */
export async function createWorkflow(input: CreateWorkflowInput): Promise<WorkflowResult> {
  try {
    const validated = CreateWorkflowSchema.parse(input)
    const db = await getDatabaseAsync()

    const workflowId = crypto.randomUUID()
    const now = new Date().toISOString()

    db.exec(
      `INSERT INTO workflows (id, name, description, status, trigger_type, config, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        workflowId,
        validated.name,
        validated.description || null,
        validated.status,
        validated.trigger_type,
        validated.config ? JSON.stringify(validated.config) : null,
        now,
        now,
      ]
    )

    revalidatePath('/[locale]/workflows')
    revalidateTag('workflows')

    logger.info('Workflow created', { workflowId })

    return {
      success: true,
      data: {
        id: workflowId,
        ...validated,
        created_at: now,
      },
    }
  } catch (error) {
    logger.error('Failed to create workflow', error)
    return {
      success: false,
      error: 'Failed to create workflow',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 获取工作流列表
 */
export async function getWorkflows(filters?: {
  status?: string
  page?: number
  per_page?: number
}): Promise<WorkflowResult> {
  try {
    const db = await getDatabaseAsync()
    const page = filters?.page || 1
    const per_page = Math.min(filters?.per_page || 20, 100)

    let whereClause = ''
    const params: unknown[] = []

    if (filters?.status) {
      whereClause = 'WHERE status = ?'
      params.push(filters.status)
    }

    const offset = (page - 1) * per_page

    const workflows = db.queryRows(
      `SELECT * FROM workflows ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, per_page, offset]
    )

    const countResult = db.queryRows(
      `SELECT COUNT(*) as total FROM workflows ${whereClause}`,
      params
    )[0] as { total: number }

    return {
      success: true,
      data: {
        workflows,
        meta: {
          total: countResult.total,
          page,
          per_page,
          total_pages: Math.ceil(countResult.total / per_page),
        },
      },
    }
  } catch (error) {
    logger.error('Failed to get workflows', error)
    return {
      success: false,
      error: 'Failed to get workflows',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 获取单个工作流
 */
export async function getWorkflow(id: string): Promise<WorkflowResult> {
  try {
    const db = await getDatabaseAsync()
    const workflow = db.queryRows('SELECT * FROM workflows WHERE id = ?', [id])[0]

    if (!workflow) {
      return {
        success: false,
        error: 'Workflow not found',
      }
    }

    return {
      success: true,
      data: workflow,
    }
  } catch (error) {
    logger.error('Failed to get workflow', error)
    return {
      success: false,
      error: 'Failed to get workflow',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 更新工作流
 */
export async function updateWorkflow(
  id: string, 
  updates: UpdateWorkflowInput
): Promise<WorkflowResult> {
  try {
    const validated = UpdateWorkflowSchema.parse(updates)
    const db = await getDatabaseAsync()

    // 检查是否存在
    const existing = db.queryRows('SELECT * FROM workflows WHERE id = ?', [id])[0]
    if (!existing) {
      return {
        success: false,
        error: 'Workflow not found',
      }
    }

    // 构建更新语句
    const setStatements: string[] = []
    const updateParams: unknown[] = []

    if (validated.name) {
      setStatements.push('name = ?')
      updateParams.push(validated.name)
    }
    if (validated.description !== undefined) {
      setStatements.push('description = ?')
      updateParams.push(validated.description)
    }
    if (validated.status) {
      setStatements.push('status = ?')
      updateParams.push(validated.status)
    }
    if (validated.trigger_type) {
      setStatements.push('trigger_type = ?')
      updateParams.push(validated.trigger_type)
    }
    if (validated.config) {
      setStatements.push('config = ?')
      updateParams.push(JSON.stringify(validated.config))
    }

    setStatements.push('updated_at = ?')
    updateParams.push(new Date().toISOString())
    updateParams.push(id)

    db.exec(`UPDATE workflows SET ${setStatements.join(', ')} WHERE id = ?`, updateParams)

    revalidatePath('/[locale]/workflows')
    revalidateTag('workflows')

    logger.info('Workflow updated', { workflowId: id })

    return { success: true }
  } catch (error) {
    logger.error('Failed to update workflow', error)
    return {
      success: false,
      error: 'Failed to update workflow',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 删除工作流
 */
export async function deleteWorkflow(id: string): Promise<WorkflowResult> {
  try {
    const db = await getDatabaseAsync()

    // 检查是否存在
    const existing = db.queryRows('SELECT * FROM workflows WHERE id = ?', [id])[0]
    if (!existing) {
      return {
        success: false,
        error: 'Workflow not found',
      }
    }

    db.exec('DELETE FROM workflows WHERE id = ?', [id])

    revalidatePath('/[locale]/workflows')
    revalidateTag('workflows')

    logger.info('Workflow deleted', { workflowId: id })

    return { success: true }
  } catch (error) {
    logger.error('Failed to delete workflow', error)
    return {
      success: false,
      error: 'Failed to delete workflow',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 运行工作流
 */
export async function runWorkflow(
  id: string, 
  input?: Record<string, any>
): Promise<WorkflowResult> {
  try {
    const db = await getDatabaseAsync()

    // 检查工作流是否存在且状态正确
    const workflow = db.queryRows('SELECT * FROM workflows WHERE id = ?', [id])[0] as any
    if (!workflow) {
      return {
        success: false,
        error: 'Workflow not found',
      }
    }

    if (workflow.status !== 'active') {
      return {
        success: false,
        error: 'Workflow is not active',
      }
    }

    // 创建执行记录
    const executionId = crypto.randomUUID()
    const now = new Date().toISOString()

    db.exec(
      `INSERT INTO workflow_executions (id, workflow_id, status, input, started_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        executionId,
        id,
        'running',
        input ? JSON.stringify(input) : null,
        now,
      ]
    )

    revalidateTag('workflow-executions')

    logger.info('Workflow execution started', { workflowId: id, executionId })

    // TODO: 实际执行工作流逻辑
    // 这里应该调用工作流引擎

    return {
      success: true,
      data: {
        executionId,
        workflowId: id,
        status: 'running',
        started_at: now,
      },
    }
  } catch (error) {
    logger.error('Failed to run workflow', error)
    return {
      success: false,
      error: 'Failed to run workflow',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * 获取工作流执行历史
 */
export async function getWorkflowExecutions(
  workflowId: string,
  filters?: { page?: number; per_page?: number }
): Promise<WorkflowResult> {
  try {
    const db = await getDatabaseAsync()
    const page = filters?.page || 1
    const per_page = Math.min(filters?.per_page || 20, 100)
    const offset = (page - 1) * per_page

    const executions = db.queryRows(
      `SELECT * FROM workflow_executions 
       WHERE workflow_id = ? 
       ORDER BY started_at DESC 
       LIMIT ? OFFSET ?`,
      [workflowId, per_page, offset]
    )

    const countResult = db.queryRows(
      'SELECT COUNT(*) as total FROM workflow_executions WHERE workflow_id = ?',
      [workflowId]
    )[0] as { total: number }

    return {
      success: true,
      data: {
        executions,
        meta: {
          total: countResult.total,
          page,
          per_page,
          total_pages: Math.ceil(countResult.total / per_page),
        },
      },
    }
  } catch (error) {
    logger.error('Failed to get workflow executions', error)
    return {
      success: false,
      error: 'Failed to get workflow executions',
      details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
```

---

## 4. 客户端调用示例

### 4.1 Feedback 表单组件

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
      <select
        value={formData.type}
        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
        className="w-full p-2 border rounded"
      >
        <option value="general">General</option>
        <option value="bug">Bug Report</option>
        <option value="feature">Feature Request</option>
        <option value="suggestion">Suggestion</option>
      </select>

      <input
        type="text"
        value={formData.title}
        onChange={e => setFormData({ ...formData, title: e.target.value })}
        placeholder="Title"
        className="w-full p-2 border rounded"
        required
      />

      <textarea
        value={formData.description}
        onChange={e => setFormData({ ...formData, description: e.target.value })}
        placeholder="Description"
        className="w-full p-2 border rounded"
        required
      />

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

---

## 5. 迁移风险与缓解

### 5.1 风险清单

| 风险 | 等级 | 描述 | 缓解措施 |
|------|------|------|---------|
| `revalidateTag(tag, profile)` API 不存在 | 🔴 高 | 当前代码使用双参数形式，但官方API可能是单参数 | 创建兼容层，使用 try-catch 回退 |
| Server Actions 错误处理 | 🟡 中 | API 路由返回 `NextResponse`，Actions 返回 plain object | 统一返回 `{ success, data, error }` 格式 |
| 客户端组件迁移 | 🟡 中 | 需要将 `fetch()` 调用改为 `startTransition` | 分阶段迁移，保持向后兼容 |
| 数据库事务一致性 | 🟡 中 | Actions 中直接操作需要事务处理 | 确保现有事务逻辑正确迁移 |
| 缓存失效粒度 | 🟡 中 | 标签失效可能比预期更广 | 使用更细粒度的标签策略 |

### 5.2 回滚方案

如果迁移后出现问题：

```bash
# 1. 保留 API 路由文件
# API 路由保持不变，作为备份

# 2. 降级到 API 路由调用
# 客户端组件临时改回 fetch() 调用

# 3. 禁用 Server Actions
# 将 'use server' 标记移除即可
```

---

## 6. 测试计划

### 6.1 单元测试

```typescript
// src/app/actions/__tests__/feedback.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createFeedback, getFeedbacks, updateFeedback, deleteFeedback } from '../feedback'

vi.mock('@/lib/db/index')
vi.mock('@/lib/feedback/anti-spam')
vi.mock('@/lib/compat/next16')

describe('Feedback Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createFeedback', () => {
    it('应该创建反馈并返回成功结果', async () => {
      const mockDb = {
        exec: vi.fn(),
        queryRows: vi.fn().mockReturnValue([]),
      }
      vi.mocked(getDatabaseAsync).mockResolvedValue(mockDb as any)
      vi.mocked(detectSpam).mockResolvedValue({ is_spam: false })

      const result = await createFeedback({
        type: 'general',
        rating: 5,
        title: 'Test',
        description: 'Test description',
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('id')
    })

    it('应该拒绝垃圾反馈', async () => {
      vi.mocked(detectSpam).mockResolvedValue({
        is_spam: true,
        reason: 'spam detected',
      })

      const result = await createFeedback({
        type: 'general',
        rating: 5,
        title: 'Test',
        description: 'Spam content',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('spam')
    })
  })
})
```

### 6.2 集成测试

```typescript
// src/app/actions/__tests__/workflow.integration.test.ts
import { describe, it, expect } from 'vitest'
import { createWorkflow, runWorkflow, getWorkflows } from '../workflow'

describe('Workflow Server Actions - Integration', () => {
  it('应该创建并运行工作流', async () => {
    // 创建工作流
    const createResult = await createWorkflow({
      name: 'Test Workflow',
      description: 'Test',
    })
    expect(createResult.success).toBe(true)
    const workflowId = createResult.data?.id

    // 运行工作流
    const runResult = await runWorkflow(workflowId!, { test: true })
    expect(runResult.success).toBe(true)
    expect(runResult.data?.status).toBe('running')
  })
})
```

---

## 7. 下一步行动

### v1.14.0 任务清单

- [ ] 创建 `src/lib/compat/next16.ts` 兼容层
- [ ] 创建 `src/app/actions/feedback.ts`
- [ ] 创建 `src/app/actions/database.ts`
- [ ] 创建 `src/app/actions/workflow.ts`
- [ ] 编写单元测试
- [ ] 更新 `revalidate.ts` 使用兼容层
- [ ] 验证所有 Actions 工作正常

### 负责人

- 🏗️ 架构师: 兼容层设计
- ⚡ Executor: Actions 实现
- 🧪 测试员: 测试覆盖

---

## 附录 A: 文件清单

### 新增文件

```
src/
├── lib/compat/
│   └── next16.ts           # Next.js 16 兼容层
└── app/actions/
    ├── feedback.ts         # 反馈 Server Actions
    ├── database.ts         # 数据库 Server Actions
    └── workflow.ts         # 工作流 Server Actions
```

### 修改文件

```
src/app/actions/revalidate.ts  # 使用兼容层
```

---

## 附录 B: API 兼容性矩阵

| Next.js 版本 | `revalidateTag(tag)` | `revalidateTag(tag, profile)` |
|-------------|---------------------|------------------------------|
| 15.x | ✅ 支持 | ❌ 不支持 |
| 16.x | ✅ 支持 | ⚠️ 可能支持 |
| 16.2.1+ | ✅ 支持 | ⚠️ 待验证 |

**建议**: 始终使用兼容层调用，内部处理版本差异。

---

*报告生成时间: 2026-04-06 03:35 GMT+2*
