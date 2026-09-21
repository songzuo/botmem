# 7zi-frontend 前端性能优化审查报告

**审查时间:** 2026-04-20  
**审查人:** 架构师子代理  
**项目路径:** `/root/.openclaw/workspace/7zi-frontend`

---

## 一、App Router 目录结构

| 项目 | 数量/状态 |
|------|-----------|
| page.tsx | 31 个 |
| layout.tsx | 5 个 |
| Next.js 版本 | 16.2.3 |
| 输出模式 | standalone (Docker) |
| locale 路由 | ✅ 已启用 (`src/app/[locale]/`) |

**主要路由分布:**
- `/dashboard/` - Agent 状态面板
- `/[locale]/login/` - 登录页
- `/admin/` - 管理后台 (feedback, rate-limit)
- `/design-system/` - 设计系统
- `/demo/`, `/examples/` - 演示页面
- `/discover/`, `/pricing/`, `/profile/`, `/rooms/` - 业务页面
- `/api/` - API 路由
- 多个 demo 页面 (analytics, collaboration-cursor, image-optimization, mobile-optimization, notification, performance-monitoring, rich-text-editor 等)

---

## 二、性能优化代码使用分析

### 2.1 React.memo 使用情况

**仅在一个文件中集中使用:**

| 文件 | 组件数量 | memo 化组件 |
|------|---------|------------|
| `dashboard/AgentStatusPanel.tsx` | 6 | ResourceBar, TaskProgress, AgentCard, StatsSummary, FilterBar, AgentStatusPanel |

**结论:** React.memo 使用率极低，仅在1个文件中使用。大量可重渲染组件未做 memo 处理。

### 2.2 useMemo / useCallback 使用情况

| 文件 | 优化 Hooks |
|------|-----------|
| `dashboard/AgentStatusPanel.tsx` | `useMemo`: filteredAgents, paginatedAgents, stats, lastActiveText; `useCallback`: getColor, handleViewDetails, handleToggle |
| `[locale]/login/page.tsx` | `useCallback`: validateEmail, validatePassword, handleEmailChange, handlePasswordChange, handleSubmit |
| `admin/feedback/page.tsx` | `useMemo`: currentUser 派生计算 |
| `admin/rate-limit/hooks/useRateLimitApi.ts` | `useCallback`: 14 个 API 方法 |

**结论:** 优化 hook 使用零散，未形成系统性模式。

### 2.3 React Compiler 配置问题

**配置状态:**
```ts
reactCompiler: {
  compilationMode: 'annotation',
},
```

**问题:** annotation 模式要求组件手动添加 `'use memo'` 指令才会进行优化编译。但审查发现**没有任何一个组件使用 `'use memo'` 指令**，导致 React Compiler 实际上没有优化任何组件。

**这是最大的性能损失点。**

---

## 三、next.config.ts 配置分析

### 3.1 已配置的优化项

| 优化项 | 状态 | 说明 |
|--------|------|------|
| `reactStrictMode: true` | ✅ | 开启 React 严格模式 |
| `poweredByHeader: false` | ✅ | 移除 X-Powered-By |
| `compress: true` | ✅ | Gzip/Brotli 压缩 |
| `generateEtags: true` | ✅ | ETag 生成 |
| `compiler.removeConsole` | ✅ | 生产环境移除 console.log |
| `images.formats: [avif, webp]` | ✅ | 现代图片格式 |
| `images.minimumCacheTTL: 30天` | ✅ | 长期缓存 |
| `optimizePackageImports` | ✅ | lucide-react, zustand, recharts 等 14 个包 |
| `optimizeCss: true` | ✅ | CSS 优化 |
| `serverExternalPackages` | ✅ | jose, sharp, better-sqlite3 等 |
| Webpack splitChunks | ✅ | 20+ 独立 cache groups |
| PWA (@ducanh2912/next-pwa) | ✅ | Service Worker 配置完整 |
| Security Headers | ✅ | HSTS, X-Frame-Options 等 |

### 3.2 缓存策略 Headers

✅ 已配置静态资源长期缓存策略:
- 图片: `max-age=31536000, immutable`
- `/_next/static/`: `max-age=31536000, immutable`

### 3.3 Webpack splitChunks 配置 (亮点)

配置了精细的分包策略:
- three-core: 250KB max, priority 70
- react-core: 250KB max, priority 36
- next-core: 300KB max, priority 35
- chart-libs, socket-io, lucide-icons, framer-motion 等独立分割

---

## 四、.next 构建产物分析

| 指标 | 数值 | 评估 |
|------|------|------|
| .next 总大小 | **839MB** | ⚠️ 偏大 |
| .next/cache 大小 | **616MB** | ⚠️ 偏大 |
| 最大 JS chunk (three-core) | **368KB** | ⚠️ 超过 300KB 预算 |
| 次大 JS chunk (three-core) | **348KB** | ⚠️ 超过 300KB 预算 |
| react-core chunk | 172KB | ✅ 在预算内 |
| next-core chunk | 196KB | ✅ 在预算内 |
| polyfills chunk | 112KB | ✅ 可接受 |
| 大多数 chunks | 32KB-96KB | ✅ 健康 |
| page.tsx 文件数 | 31 | ⚠️ 页面过多 |

### chunk 分布总结

```
>300KB:   2 个 (three-core, three-core) ← 超标
200-300KB: 0 个
100-200KB: 3 个 (react-core 172K, next-core 196K, vendors 1个)
<100KB:   绝大多数 ✅
```

**结论:** Three.js chunk 过大是主要问题，可能是多版本共存导致。

---

## 五、性能优化建议

### 🔴 P0 - 必须修复 (性能影响巨大)

#### 1. 为关键组件添加 `'use memo'` 指令

**问题:** React Compiler annotation 模式已配置但未被使用，导致所有组件失去自动优化。

**操作:** 在以下组件顶部添加 `'use memo'`:
- `AgentStatusPanel.tsx` 中的 6 个组件 (已有 React.memo 包装，可改用 compiler)
- 所有高频渲染的列表项组件 (AgentCard, TaskProgress 等)
- 大型数据展示组件

```tsx
'use memo'

import React from 'react'
// 或使用注释指令
/* @next/mdx-type-annotate memo */
```

#### 2. 削减 Three.js chunk 大小

**问题:** 368KB 的 three-core chunk 超过 300KB 预算。

**建议:**
- 检查是否有多个 three 版本被重复打包
- 使用 `import { only }` 语法减少 three 导入
- 考虑 lazy load three.js，仅在真正需要 3D 时加载

```tsx
// 不直接导入，改为动态导入
const ThreeCanvas = dynamic(() => import('@/components/ThreeCanvas'), {
  ssr: false,
  loading: () => <CanvasSkeleton />
})
```

---

### 🟡 P1 - 重要优化 (显著提升)

#### 3. 为所有列表渲染组件添加 memo

**建议 memo 化的组件类型:**
- 表格行组件 (TableRow)
- 卡片组件 (AgentCard, RoomCard, DemoCard)
- 列表项组件 (ListItem)
- 分页组件 (Pagination)
- 过滤器组件 (FilterBar)

**方法:** 使用 `React.memo` 或 `'use memo'`

#### 4. 提取高频计算为 useMemo

在 `page.tsx` 组件中:
- 复杂过滤/排序逻辑 → useMemo
- 派生状态计算 → useMemo
- 格式化函数 → useCallback (依赖稳定时)

#### 5. 削减 .next 缓存大小 (616MB 异常大)

**可能原因:**
- pnpm store 在 .next/standalone 中重复存储
- 开发依赖 (playwright, babel) 被打包

**建议:**
```bash
# 清理不必要的 node_modules
rm -rf .next/standalone/7zi-frontend/node_modules/.pnpm
# 或在构建时排除 devDependencies
```

#### 6. 配置 Dynamic Import 策略

对于 demo 页面 (analytics-demo, collaboration-cursor-demo 等不常用的页面)，使用动态导入:

```tsx
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: <EditorSkeleton />
})
```

---

### 🟢 P2 - 改进建议 (锦上添花)

#### 7. 利用 App Router 流式渲染

将大型页面拆分为 Suspense boundaries:

```tsx
import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={<StatsSkeleton />}>
        <StatsPanel />
      </Suspense>
      <Suspense fallback={<AgentListSkeleton />}>
        <AgentList />
      </Suspense>
    </>
  )
}
```

#### 8. 添加 Page 生成优化

在动态页面中使用 `generateStaticParams`:

```tsx
export async function generateStaticParams() {
  return rooms.map(room => ({ id: room.id }))
}
```

#### 9. 考虑 RSC (React Server Components) 迁移

将纯展示型组件迁移为 Server Components，避免 client bundle 膨胀:

```tsx
// pages/dashboard/StatsPanel.server.tsx
// 数据获取在服务端完成，零客户端 JS
```

---

## 六、总体评分

| 维度 | 评分 | 说明 |
|------|------|------|
| App Router 使用 | ⭐⭐⭐⭐ | 结构清晰，31个页面，locale 路由完善 |
| React Compiler | ⭐ | 已配置但未启用 (annotation 模式无组件使用) |
| React 优化 Hook 使用 | ⭐⭐ | 仅1个文件系统使用，覆盖率极低 |
| Webpack 分包策略 | ⭐⭐⭐⭐⭐ | 配置完善，20+ cache groups |
| 图片优化配置 | ⭐⭐⭐⭐ | avif/webp, 30天缓存 |
| 构建产物健康度 | ⭐⭐ | .next 839MB，three-core 超标 |
| PWA 配置 | ⭐⭐⭐⭐ | 配置完整 |

**综合得分: 6/10**

---

## 七、立即可执行行动

1. **添加 `'use memo'`** 到 `AgentStatusPanel.tsx` 的 6 个组件
2. **检查 Three.js 多版本问题:** `grep -r "three" package.json | head -20`
3. **用 dynamic import** 延迟加载 demo 页面组件
4. **分析 chunk 来源:** `ANALYZE=true npm run build`

---

*报告生成时间: 2026-04-20*