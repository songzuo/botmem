# Next.js 16 迁移指南

> 基于 Next.js 官方文档 (v16.2.4, 2026-04-15) 整理

---

## 📋 迁移检查清单

### 一、升级前准备

| 检查项 | 操作 |
|--------|------|
| ✅ Node.js 版本 | **最低要求: Node.js 20.9.0+** (Node.js 18 不再支持) |
| ✅ TypeScript 版本 | **最低要求: TypeScript 5.1.0+** |
| ✅ 浏览器支持 | Chrome 111+, Edge 111+, Firefox 111+, Safari 16.4+ |
| ✅ 备份代码 | 使用 Git 备份当前项目 |
| ✅ 运行测试 | 确保当前项目测试全部通过 |

### 二、自动迁移 (推荐)

```bash
# 使用官方 Codemod 自动迁移
npx @next/codemod@canary upgrade latest
```

Codemod 可自动完成:
- 更新 `next.config` 使用新的 `turbopack` 配置
- 从 `next lint` 迁移到 ESLint CLI
- 从废弃的 `middleware` 迁移到 `proxy`
- 移除 `unstable_` 前缀的稳定 API
- 移除 `experimental_ppr` 路由配置

### 三、手动迁移步骤

#### 3.1 安装最新版本

```bash
npm install next@latest react@latest react-dom@latest
# 如果使用 TypeScript，还需升级类型
npm install -D @types/react @types/react-dom
```

#### 3.2 异步 Request APIs (Breaking Change)

Next.js 15 引入的异步 API 同步兼容模式已**完全移除**，必须使用 `await`:

| API | 修改方式 |
|-----|----------|
| `cookies()` | `await cookies()` |
| `headers()` | `await headers()` |
| `draftMode()` | `await draftMode()` |
| `params` | `await params` |
| `searchParams` | `await searchParams` |

```tsx
// Next.js 15 → 16
// layout.js / page.js
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params      // params 现在是 Promise
  const query = await props.searchParams   // searchParams 现在是 Promise
  return <h1>Blog Post: {slug}</h1>
}
```

#### 3.3 middleware.ts → proxy.ts (Breaking Change)

```bash
# 重命名文件
mv middleware.ts proxy.ts
```

```ts
// proxy.ts
export default function proxy(request: NextRequest) {
  return NextResponse.redirect(new URL('/home', request.url))
}
```

> ⚠️ `proxy.ts` 只支持 Node.js 运行时，不支持 Edge Runtime。若需 Edge Runtime，继续使用 `middleware.ts`（已废弃）。

配置重命名:
- `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`

#### 3.4 Turbopack 成为默认 (Breaking Change)

`next dev` 和 `next build` 现在默认使用 Turbopack。

**如果项目有自定义 Webpack 配置:**
```bash
# 方式1: 继续使用 Webpack
next build --webpack

# 方式2: 迁移到 Turbopack 配置
```

**Turbopack 配置位置变更:**
```ts
// Next.js 15 (experimental)
const nextConfig = {
  experimental: { turbopack: { /* options */ } }
}

// Next.js 16 (top-level)
const nextConfig = {
  turbopack: { /* options */ }
}
```

#### 3.5 缓存 API 变更 (Breaking Change)

**`revalidateTag()` 必须传第二个参数:**
```ts
// ❌ 已废弃
revalidateTag('posts')

// ✅ 新写法
revalidateTag('posts', 'max')  // 推荐使用 'max' profile
```

**新 API `updateTag()` - Server Actions 专用 (读后写语义):**
```ts
'use server'
import { updateTag } from 'next/cache'

export async function updateUserProfile(userId: string, profile: Profile) {
  await db.users.update(userId, profile)
  updateTag(`user-${userId}`)  // 立即过期并刷新缓存
}
```

**新 API `refresh()` - 刷新非缓存数据:**
```ts
'use server'
import { refresh } from 'next/cache'

export async function markAsRead(notificationId: string) {
  await db.notifications.markAsRead(notificationId)
  refresh()  // 刷新客户端路由中的非缓存数据
}
```

**`unstable_cacheLife` / `unstable_cacheTag` 前缀移除:**
```ts
// ❌ 旧写法
import { unstable_cacheLife as cacheLife } from 'next/cache'

// ✅ 新写法
import { cacheLife, cacheTag } from 'next/cache'
```

#### 3.6 next/image 重大变更 (Breaking Change)

| 配置项 | 变更 |
|--------|------|
| `minimumCacheTTL` 默认值 | 60秒 → **4小时 (14400秒)** |
| `imageSizes` 默认值 | 包含 16 → **移除 16** |
| `qualities` 默认值 | 1-100 全部 → **[75]** |
| `maximumRedirects` 默认值 | 无限 → **3** |
| `localPatterns` | 带 query string 的本地图片需配置 |
| `domains` | **已废弃**，使用 `remotePatterns` |

```ts
// 本地图片带 query string 必须配置
const nextConfig = {
  images: {
    localPatterns: [{ pathname: '/assets/**', search: '?v=1' }]
  }
}
```

#### 3.7 移除的功能 (Removals)

| 已移除 | 替代方案 |
|--------|----------|
| AMP 支持 | - |
| `next lint` 命令 | 使用 ESLint 直接运行 |
| `serverRuntimeConfig` / `publicRuntimeConfig` | 使用 `.env` 环境变量 |
| `experimental.turbopack` | 移到顶层 `turbopack` |
| `experimental.ppr` | 使用 `experimental.cacheComponents` |
| `export const experimental_ppr` | Cache Components |
| `unstable_rootParams()` | 未来版本替代 API |
| 自动 `scroll-behavior: smooth` | 添加 `data-scroll-behavior="smooth"` 到 HTML |

#### 3.8 并行路由 default.js 要求 (Breaking Change)

所有并行路由槽位现在**必须显式创建 `default.js` 文件**，否则构建失败:
```ts
// app/@slot/default.tsx
export default function Default() {
  return null  // 或 notFound()
}
```

### 四、Cache Components (新功能)

```ts
// next.config.ts
const nextConfig = {
  cacheComponents: true
}
```

> ⚠️ 如果当前使用 PPR (`experimental.ppr = true`)，**留在当前 Next.js 15 canary 版本**，等待迁移指南。

### 五、React Compiler (稳定)

```bash
npm install -D babel-plugin-react-compiler
```

```ts
const nextConfig = {
  reactCompiler: true  // 不再是 experimental
}
```

> 注意: 启用后开发和构建时间会增加（依赖 Babel）

### 六、React 19.2 新特性

- **View Transitions**: 动画过渡
- **`useEffectEvent`**: 从 Effect 提取非响应式逻辑
- **`<Activity/>`**: 维护状态的后台活动组件

---

## ⚠️ 已知问题 / 注意事项

1. **PPR 用户**: 若使用 `experimental.ppr`，留在 Next.js 15 canary，v16 实现有差异
2. **Webpack 自定义配置**: 构建时会失败，需迁移或使用 `--webpack` flag
3. **Sass tilde 导入**: Turbopack 不支持 `~` 前缀，需移除
4. **Node.js 原生模块**: 客户端代码不应导入 `fs` 等原生模块，会报 `Module not found`
5. **Babel 配置**: Turbopack 会自动检测 babel.config.js，可能影响构建行为
6. **构建输出目录**: `next dev` 和 `next build` 现在使用不同输出目录

---

## 🚀 推荐的迁移顺序

1. **备份 + 测** - 确保当前测试通过
2. **运行 codemod** - `npx @next/codemod@canary upgrade latest`
3. **升级依赖** - `npm install next@latest react@latest react-dom@latest`
4. **处理 Breaking Changes** - 按上述清单逐项检查
5. **测试** - 全面回归测试
6. **可选功能** - 考虑启用 React Compiler、Cache Components 等新特性

---

## 📚 参考链接

- [Next.js 16 官方博客](https://nextjs.org/blog/next-16)
- [Next.js 16 升级指南](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js 16 Beta 博客](https://nextjs.org/blog/next-16-beta)
- [Migrating to Cache Components](https://nextjs.org/docs/app/guides/migrating-to-cache-components)
- [Next.js DevTools MCP](https://nextjs.org/docs/app/guides/mcp)
