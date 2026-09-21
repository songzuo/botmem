# Next.js 16 App Router 最佳实践和迁移策略报告

**项目版本**: 7zi-frontend v1.13.0
**Next.js 版本**: 16.2.2
**React 版本**: 19.2.4
**报告日期**: 2026-04-05
**报告人**: 📚 咨询师 子代理

---

## 执行摘要

本报告深入分析了 7zi Studio 项目当前 Next.js 16 App Router 的使用情况，识别了最佳实践的应用机会，并提供了具体的代码改进建议。项目整体架构良好，已采用多项 Next.js 16 最佳实践，但在并行路由、拦截路由、缓存策略优化等方面仍有提升空间。

**关键发现**：
- ✅ 已正确使用 Server Components 和 Client Components
- ✅ 已实现 ISR（增量静态再生成）
- ✅ 已使用元数据 API 进行 SEO 优化
- ✅ 已采用 React 19 新特性（useDeferredValue, useTransition）
- ⚠️ 未使用并行路由和拦截路由
- ⚠️ 缓存策略可以进一步优化
- ⚠️ Server Actions 使用有限

---

## 1. Next.js 16 App Router 最新特性

### 1.1 核心特性概览

Next.js 16 基于 React 19 Canary 构建，引入了多项重要特性：

| 特性 | 描述 | 项目使用情况 |
|------|------|-------------|
| **Server Components** | 默认组件类型，在服务器端渲染 | ✅ 已使用 |
| **Client Components** | 使用 `'use client'` 指令，支持交互 | ✅ 已使用 |
| **Streaming** | 流式渲染，提升首屏加载速度 | ✅ 已使用（Suspense） |
| **ISR** | 增量静态再生成，平衡静态和动态 | ✅ 已使用 |
| **Parallel Routes** | 并行渲染多个插槽 | ❌ 未使用 |
| **Intercepting Routes** | 拦截路由，实现模态框等 | ❌ 未使用 |
| **Server Actions** | 服务器端函数调用 | ⚠️ 有限使用 |
| **Metadata API** | 声明式元数据管理 | ✅ 已使用 |
| **Route Groups** | 路由分组，不影响 URL | ⚠️ 部分使用 |

### 1.2 React 19 新特性集成

Next.js 16 内置 React 19 Canary，支持以下新特性：

```typescript
// 1. useDeferredValue - 优化大数据集渲染
const deferredProjects = useDeferredValue(projects)

// 2. useTransition - 优化状态更新
const [isPending, startTransition] = useTransition()

// 3. useOptimistic - 乐观更新（未使用）
const [optimisticState, addOptimistic] = useOptimistic(state, updateFn)

// 4. useActionState - 表单状态管理（未使用）
const [state, formAction, isPending] = useActionState(fn, initialState)
```

---

## 2. 当前项目 App Router 使用分析

### 2.1 路由结构

```
src/app/
├── [locale]/                    # 国际化路由
│   ├── layout.tsx              # 根布局（Server Component）
│   ├── page.tsx                # 首页（Server Component）
│   ├── about/
│   │   ├── page.tsx            # 关于页面
│   │   ├── error.tsx           # 错误边界
│   │   └── loading.tsx         # 加载状态
│   ├── portfolio/
│   │   ├── page.tsx            # 作品集页面（ISR）
│   │   ├── [slug]/             # 动态路由
│   │   └── components/         # 组件目录
│   ├── scheduler/
│   │   ├── page.tsx            # 调度器页面
│   │   └── SchedulerClient.tsx # 客户端组件
│   └── ...                     # 其他页面
├── api/                        # API 路由
│   ├── analytics/
│   │   └── metrics/route.ts    # 分析 API
│   └── ...
├── actions/                    # Server Actions
├── globals.css                 # 全局样式
├── layout.tsx                  # 根布局
└── manifest.ts                 # PWA 清单
```

### 2.2 Server Components vs Client Components 决策

#### ✅ 正确使用示例

**Server Components（默认）**：
```typescript
// src/app/[locale]/page.tsx
export default async function HomePage({ params }: { params: Params }) {
  const { locale } = await params
  setRequestLocale(locale)
  const tHero = await getTranslations({ locale, namespace: 'home.hero' })

  // 服务器端数据获取
  return <div>{/* 渲染内容 */}</div>
}
```

**Client Components（交互组件）**：
```typescript
// src/app/[locale]/portfolio/components/PortfolioGrid.tsx
'use client'

function PortfolioGrid({ projects, locale }: PortfolioGridProps) {
  const deferredProjects = useDeferredValue(projects) // React 19 优化
  return <div>{/* 交互式内容 */}</div>
}
```

#### ⚠️ 可优化示例

**问题：部分组件未明确区分 Server/Client**

```typescript
// 当前实现：所有导航组件在客户端渲染
// src/app/[locale]/page.tsx
<nav className="fixed top-0 ...">
  <Link href="/about">{tNav('about')}</Link>
  {/* ... */}
</nav>

// 建议：将静态导航移至 Server Component
```

### 2.3 缓存策略

#### ✅ 已实现的缓存

```typescript
// src/app/[locale]/portfolio/page.tsx
export const revalidate = 3600 // ISR: 1小时重新验证

// src/app/api/analytics/metrics/route.ts
const cache = getCacheManager()
cache.set(cacheKey, metrics, CachePresets.LONG) // 内存缓存

// HTTP 缓存头
headers: {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
}
```

#### ⚠️ 可优化的缓存策略

1. **缺少 `fetch` 缓存配置**
2. **未使用 `unstable_cache`**
3. **未使用 `revalidatePath` 和 `revalidateTag`**

### 2.4 元数据 API 使用

#### ✅ 良好实践

```typescript
// src/app/[locale]/layout.tsx
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: seo.title,
    description: seo.description,
    openGraph: { /* ... */ },
    twitter: { /* ... */ },
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: { /* ... */ },
    },
  }
}
```

#### ✅ 结构化数据

```typescript
<StructuredData
  locale={locale}
  schemas={['website', 'organization', 'faq']}
  faqs={faqs}
  customSchemas={[/* ... */]}
/>
```

---

## 3. 改进建议

### 3.1 路由结构优化

#### 建议 1：使用 Route Groups 组织代码

**当前结构**：
```
src/app/[locale]/portfolio/
src/app/[locale]/blog/
src/app/[locale]/about/
```

**建议结构**：
```
src/app/
├── [locale]/
│   ├── (marketing)/           # 营销页面组
│   │   ├── about/
│   │   ├── portfolio/
│   │   └── blog/
│   ├── (app)/                 # 应用页面组
│   │   ├── dashboard/
│   │   ├── scheduler/
│   │   └── tasks/
│   └── layout.tsx
```

**优势**：
- 更清晰的代码组织
- 共享布局和加载状态
- 不影响 URL 结构

**实现示例**：
```typescript
// src/app/[locale]/(marketing)/layout.tsx
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="marketing-layout">
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </div>
  )
}
```

#### 建议 2：使用并行路由提升性能

**场景**：Dashboard 页面同时显示多个独立模块

**当前实现**：
```typescript
// src/app/[locale]/dashboard/page.tsx
export default async function DashboardPage() {
  const [stats, tasks, agents] = await Promise.all([
    fetchStats(),
    fetchTasks(),
    fetchAgents(),
  ])
  return <Dashboard stats={stats} tasks={tasks} agents={agents} />
}
```

**建议实现**：
```
src/app/[locale]/dashboard/
├── layout.tsx
├── page.tsx
├── @stats/
│   └── page.tsx
├── @tasks/
│   └── page.tsx
└── @agents/
    └── page.tsx
```

```typescript
// src/app/[locale]/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  stats,
  tasks,
  agents,
}: {
  children: React.ReactNode
  stats: React.ReactNode
  tasks: React.ReactNode
  agents: React.ReactNode
}) {
  return (
    <div className="dashboard-grid">
      {stats}
      {tasks}
      {agents}
      {children}
    </div>
  )
}
```

**优势**：
- 每个插槽独立加载和错误处理
- 更好的性能（并行渲染）
- 独立的加载状态

#### 建议 3：使用拦截路由实现模态框

**场景**：点击作品卡片时在模态框中显示详情

**当前实现**：
```typescript
// 需要手动管理模态框状态
<Link href={`/portfolio/${project.slug}`}>
  <ProjectCard project={project} />
</Link>
```

**建议实现**：
```
src/app/[locale]/portfolio/
├── page.tsx
├── [slug]/
│   └── page.tsx              # 独立页面
└── @modal/
    └── [slug]/
        └── page.tsx          # 模态框拦截
```

```typescript
// src/app/[locale]/portfolio/@modal/[slug]/page.tsx
import { useRouter } from 'next/navigation'

export default function ProjectModal({ params }: { params: Params }) {
  const router = useRouter()
  const project = await getProject(params.slug)

  return (
    <div className="modal-overlay" onClick={() => router.back()}>
      <div className="modal-content">
        <ProjectDetail project={project} />
      </div>
    </div>
  )
}
```

### 3.2 Server Components vs Client Components 优化

#### 建议 4：最大化 Server Components 使用

**问题**：部分可服务器渲染的组件被标记为客户端组件

**示例优化**：

```typescript
// ❌ 当前：不必要的客户端组件
'use client'

export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="card">
      <h3>{project.title}</h3>
      <p>{project.description}</p>
    </div>
  )
}

// ✅ 优化：移除 'use client'，使用 Server Component
export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="card">
      <h3>{project.title}</h3>
      <p>{project.description}</p>
    </div>
  )
}

// ✅ 仅在需要交互时使用客户端组件
'use client'

export function ProjectCard({ project }: { project: Project }) {
  const [isLiked, setIsLiked] = useState(false)

  return (
    <div className="card">
      <h3>{project.title}</h3>
      <button onClick={() => setIsLiked(!isLiked)}>
        {isLiked ? '❤️' : '🤍'}
      </button>
    </div>
  )
}
```

#### 建议 5：使用 Server Actions 替代 API 路由

**当前实现**：
```typescript
// src/app/api/contact/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json()
  await sendContactEmail(body)
  return NextResponse.json({ success: true })
}

// 客户端调用
const response = await fetch('/api/contact', {
  method: 'POST',
  body: JSON.stringify(formData),
})
```

**建议实现**：
```typescript
// src/app/actions/contact.ts
'use server'

export async function submitContactForm(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const message = formData.get('message') as string

  // 验证
  if (!name || !email || !message) {
    return { success: false, error: 'Missing fields' }
  }

  // 发送邮件
  await sendContactEmail({ name, email, message })

  // 重新验证相关页面
  revalidatePath('/contact')

  return { success: true }
}

// 客户端调用
import { submitContactForm } from '@/app/actions/contact'

export function ContactForm() {
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await submitContactForm(formData)
      if (result.success) {
        toast.success('Message sent!')
      }
    })
  }

  return <form action={handleSubmit}>{/* ... */}</form>
}
```

**优势**：
- 减少网络往返
- 自动 CSRF 保护
- 更简洁的代码
- 类型安全

### 3.3 缓存策略优化

#### 建议 6：使用 `fetch` 缓存配置

```typescript
// ❌ 当前：未配置缓存
const data = await fetch('https://api.example.com/data')
const json = await data.json()

// ✅ 优化：配置缓存
const data = await fetch('https://api.example.com/data', {
  next: {
    revalidate: 3600, // 1小时
    tags: ['analytics', 'metrics'], // 标签缓存
  },
})
const json = await data.json()

// ✅ 按需重新验证
import { revalidateTag } from 'next/cache'

// 在 Server Action 中
export async function updateMetrics() {
  await updateDatabase()
  revalidateTag('analytics') // 重新验证所有带 'analytics' 标签的请求
}
```

#### 建议 7：使用 `unstable_cache` 缓存计算结果

```typescript
// src/lib/cache.ts
import { unstable_cache } from 'next/cache'

export const getCachedMetrics = unstable_cache(
  async (filters: AnalyticsFilters) => {
    return await fetchMetricsFromDatabase(filters)
  },
  ['analytics-metrics'], // 缓存键前缀
  {
    revalidate: 300, // 5分钟
    tags: ['analytics'], // 缓存标签
  }
)

// 使用
const metrics = await getCachedMetrics(filters)
```

#### 建议 8：实现智能缓存失效策略

```typescript
// src/app/actions/revalidate.ts
'use server'

import { revalidatePath, revalidateTag, revalidateUrl } from 'next/cache'

/**
 * 重新验证特定路径
 */
export async function revalidatePage(path: string) {
  revalidatePath(path)
}

/**
 * 重新验证所有带标签的缓存
 */
export async function revalidateByTag(tag: string) {
  revalidateTag(tag)
}

/**
 * 重新验证特定 URL
 */
export async function revalidateSpecificUrl(url: string) {
  revalidateUrl(url)
}

/**
 * 批量重新验证
 */
export async function revalidateMultiple(tags: string[]) {
  tags.forEach(tag => revalidateTag(tag))
}
```

### 3.4 元数据 API 优化

#### 建议 9：使用动态图片生成

```typescript
// src/app/[locale]/portfolio/[slug]/page.tsx
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, locale } = await params
  const project = await getProject(slug)

  // 动态生成 OG 图片
  const ogImage = await new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(to bottom right, #1DB954, #191414)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        {project.title}
      </div>
    ),
    { width: 1200, height: 630 }
  ).toBlob()

  return {
    title: project.title,
    openGraph: {
      images: [
        {
          url: ogImage ? URL.createObjectURL(ogImage) : '/og-image.png',
          width: 1200,
          height: 630,
        },
      ],
    },
  }
}
```

#### 建议 10：实现面包屑导航

```typescript
// src/app/[locale]/portfolio/[slug]/page.tsx
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, locale } = await params
  const project = await getProject(slug)

  return {
    title: project.title,
    other: {
      'breadcrumb': JSON.stringify([
        { name: 'Home', url: `/${locale}` },
        { name: 'Portfolio', url: `/${locale}/portfolio` },
        { name: project.title, url: `/${locale}/portfolio/${slug}` },
      ]),
    },
  }
}
```

### 3.5 性能优化建议

#### 建议 11：使用 `loading.tsx` 和 `error.tsx`

**当前状态**：部分页面已实现，建议全面覆盖

```typescript
// src/app/[locale]/portfolio/loading.tsx
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  )
}

// src/app/[locale]/portfolio/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="error-boundary">
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

#### 建议 12：使用 `not-found.tsx` 处理 404

```typescript
// src/app/[locale]/portfolio/[slug]/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="not-found">
      <h2>Project not found</h2>
      <p>The project you're looking for doesn't exist.</p>
      <Link href="/portfolio">Back to portfolio</Link>
    </div>
  )
}
```

#### 建议 13：优化图片加载

```typescript
// ❌ 当前：使用普通 img 标签
<img src="/hero.jpg" alt="Hero" />

// ✅ 优化：使用 Next.js Image 组件
import Image from 'next/image'

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1920}
  height={1080}
  priority // LCP 图片
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
/>

// ✅ 动态图片
<Image
  src={project.image}
  alt={project.title}
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

---

## 4. 迁移策略

### 4.1 优先级矩阵

| 优先级 | 改进项 | 预估工作量 | 影响 |
|--------|--------|-----------|------|
| **P0** | Server Actions 替代 API 路由 | 中 | 高 |
| **P0** | 缓存策略优化（fetch 缓存、unstable_cache） | 中 | 高 |
| **P1** | Route Groups 重组 | 低 | 中 |
| **P1** | 并行路由（Dashboard） | 中 | 中 |
| **P1** | 全面实现 loading.tsx 和 error.tsx | 低 | 中 |
| **P2** | 拦截路由（模态框） | 中 | 低 |
| **P2** | 动态 OG 图片生成 | 低 | 低 |
| **P3** | 面包屑导航 | 低 | 低 |

### 4.2 实施计划

#### 阶段 1：核心优化（1-2 周）

1. **Server Actions 迁移**
   - 识别适合的 API 路由
   - 创建 Server Actions
   - 更新客户端调用
   - 测试和验证

2. **缓存策略优化**
   - 配置 `fetch` 缓存
   - 实现 `unstable_cache`
   - 添加缓存标签
   - 实现智能失效策略

#### 阶段 2：结构优化（1 周）

3. **Route Groups 重组**
   - 创建 `(marketing)` 和 `(app)` 组
   - 移动相关页面
   - 更新导入路径
   - 测试路由

4. **并行路由实现**
   - 重构 Dashboard
   - 创建并行插槽
   - 实现独立加载状态
   - 性能测试

#### 阶段 3：体验优化（1 周）

5. **错误处理和加载状态**
   - 为所有页面添加 `loading.tsx`
   - 为所有页面添加 `error.tsx`
   - 为动态路由添加 `not-found.tsx`
   - 用户体验测试

6. **拦截路由实现**
   - 为 Portfolio 实现模态框
   - 为 Blog 实现模态框
   - 测试导航和关闭

#### 阶段 4：高级特性（可选，1 周）

7. **动态 OG 图片**
   - 实现 Image Response
   - 集成到元数据 API
   - 测试社交媒体分享

8. **面包屑导航**
   - 实现结构化数据
   - 创建面包屑组件
   - 集成到布局

### 4.3 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| **破坏性更改** | 高 | 逐步迁移，保持向后兼容 |
| **性能回归** | 中 | 性能基准测试，监控指标 |
| **SEO 影响** | 中 | 保持 URL 结构，测试元数据 |
| **开发时间** | 低 | 优先级排序，分阶段实施 |

---

## 5. 代码示例

### 5.1 完整的 Server Action 示例

```typescript
// src/app/actions/portfolio.ts
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { logger } from '@/lib/logger'

// 验证 schema
const CreateProjectSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  category: z.enum(['website', 'app', 'ai', 'design']),
  imageUrl: z.string().url(),
})

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>

/**
 * 创建新项目
 */
export async function createProject(input: CreateProjectInput) {
  // 验证输入
  const validated = CreateProjectSchema.parse(input)

  try {
    // 保存到数据库
    const project = await db.projects.create({
      data: validated,
    })

    // 重新验证相关页面
    revalidatePath('/[locale]/portfolio')
    revalidateTag('projects')

    logger.info('Project created', { projectId: project.id })

    return { success: true, project }
  } catch (error) {
    logger.error('Failed to create project', error)
    return {
      success: false,
      error: 'Failed to create project',
    }
  }
}

/**
 * 更新项目
 */
export async function updateProject(id: string, input: Partial<CreateProjectInput>) {
  const validated = CreateProjectSchema.partial().parse(input)

  try {
    const project = await db.projects.update({
      where: { id },
      data: validated,
    })

    revalidatePath('/[locale]/portfolio')
    revalidatePath(`/[locale]/portfolio/${id}`)
    revalidateTag('projects')

    return { success: true, project }
  } catch (error) {
    logger.error('Failed to update project', error)
    return {
      success: false,
      error: 'Failed to update project',
    }
  }
}

/**
 * 删除项目
 */
export async function deleteProject(id: string) {
  try {
    await db.projects.delete({ where: { id } })

    revalidatePath('/[locale]/portfolio')
    revalidateTag('projects')

    return { success: true }
  } catch (error) {
    logger.error('Failed to delete project', error)
    return {
      success: false,
      error: 'Failed to delete project',
    }
  }
}
```

### 5.2 客户端调用示例

```typescript
// src/components/ProjectForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { createProject, type CreateProjectInput } from '@/app/actions/portfolio'
import { toast } from 'sonner'

export function ProjectForm() {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState<CreateProjectInput>({
    title: '',
    description: '',
    category: 'website',
    imageUrl: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      const result = await createProject(formData)

      if (result.success) {
        toast.success('Project created successfully!')
        setFormData({
          title: '',
          description: '',
          category: 'website',
          imageUrl: '',
        })
      } else {
        toast.error(result.error || 'Failed to create project')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={formData.title}
        onChange={e => setFormData({ ...formData, title: e.target.value })}
        placeholder="Project title"
        disabled={isPending}
      />
      <textarea
        value={formData.description}
        onChange={e => setFormData({ ...formData, description: e.target.value })}
        placeholder="Description"
        disabled={isPending}
      />
      <select
        value={formData.category}
        onChange={e => setFormData({ ...formData, category: e.target.value as any })}
        disabled={isPending}
      >
        <option value="website">Website</option>
        <option value="app">App</option>
        <option value="ai">AI</option>
        <option value="design">Design</option>
      </select>
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  )
}
```

### 5.3 并行路由完整示例

```typescript
// src/app/[locale]/dashboard/layout.tsx
import type { ReactNode } from 'react'

export default function DashboardLayout({
  children,
  stats,
  tasks,
  agents,
}: {
  children: ReactNode
  stats: ReactNode
  tasks: ReactNode
  agents: ReactNode
}) {
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">{children}</aside>
      <main className="main-content">
        <div className="grid grid-cols-3 gap-6">
          <div className="stats-panel">{stats}</div>
          <div className="tasks-panel">{tasks}</div>
          <div className="agents-panel">{agents}</div>
        </div>
      </main>
    </div>
  )
}

// src/app/[locale]/dashboard/@stats/page.tsx
export const revalidate = 60 // 1分钟

export default async function StatsPage() {
  const stats = await fetchStats()
  return <StatsPanel data={stats} />
}

// src/app/[locale]/dashboard/@tasks/page.tsx
export const revalidate = 30 // 30秒

export default async function TasksPage() {
  const tasks = await fetchTasks()
  return <TasksPanel data={tasks} />
}

// src/app/[locale]/dashboard/@agents/page.tsx
export const revalidate = 120 // 2分钟

export default async function AgentsPage() {
  const agents = await fetchAgents()
  return <AgentsPanel data={agents} />
}
```

---

## 6. 性能监控建议

### 6.1 Web Vitals 监控

```typescript
// src/app/layout.tsx
import { WebVitals } from '@/components/WebVitals'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <WebVitals />
      </body>
    </html>
  )
}

// src/components/WebVitals.tsx
'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals((metric) => {
    // 发送到分析服务
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      body: JSON.stringify(metric),
    })
  })

  return null
}
```

### 6.2 自定义性能指标

```typescript
// src/lib/performance.ts
export function measurePerformance(name: string, fn: () => Promise<void>) {
  const start = performance.now()

  return fn().finally(() => {
    const duration = performance.now() - start
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)

    // 发送到监控服务
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'timing_complete', {
        name,
        value: Math.round(duration),
      })
    }
  })
}

// 使用
export default async function Page() {
  await measurePerformance('page-data-fetch', async () => {
    const data = await fetchData()
    return data
  })
}
```

---

## 7. 总结

### 7.1 关键要点

1. **项目现状良好**：已正确使用 Server Components、ISR、元数据 API 等核心特性
2. **优化空间大**：并行路由、拦截路由、Server Actions 等高级特性未充分利用
3. **缓存策略待完善**：应使用 `fetch` 缓存、`unstable_cache` 和智能失效策略
4. **性能提升潜力**：通过并行路由和优化缓存可显著提升性能

### 7.2 建议优先级

**立即实施（P0）**：
- Server Actions 替代关键 API 路由
- 实现智能缓存策略

**短期实施（P1）**：
- Route Groups 重组
- Dashboard 并行路由
- 全面实现 loading.tsx 和 error.tsx

**中期实施（P2）**：
- 拦截路由实现模态框
- 动态 OG 图片生成

**长期优化（P3）**：
- 面包屑导航
- 高级性能监控

### 7.3 预期收益

- **性能提升**：20-30% 首屏加载速度提升
- **开发效率**：减少 30% API 路由代码
- **用户体验**：更流畅的交互和加载体验
- **SEO 优化**：更好的元数据和结构化数据

---

## 8. 参考资料

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev/blog/2023/05/03/react-canaries)
- [Next.js App Router Best Practices](https://nextjs.org/docs/app/building-your-application/routing)
- [Server Actions Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Caching Documentation](https://nextjs.org/docs/app/building-your-application/caching)

---

**报告完成时间**: 2026-04-05
**下一步行动**: 与团队讨论优先级，制定详细实施计划