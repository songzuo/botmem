# Next.js 16 + React 19 技术调研报告

**项目**: 7zi 前端 (7zi-frontend)  
**调研日期**: 2026-04-26  
**调研人**: 咨询师 (子代理)  
**模型**: MiniMax-M2.7

---

## 一、项目当前依赖版本

| 依赖 | 当前版本 | 状态 |
|------|----------|------|
| `next` | **^16.2.4** | ✅ 已升级到 Next.js 16 |
| `react` | **^19.2.4** | ✅ 已升级到 React 19 |
| `react-dom` | **^19.2.4** | ✅ 已升级到 React 19 |
| `eslint-config-next` | ^16.2.1 | ⚠️ 需同步更新 |
| `@types/react` | ^19 | ✅ 已是最新 |
| `@types/react-dom` | ^19 | ✅ 已是最新 |

**结论**: 7zi 项目 **已经完成 Next.js 16 + React 19 的升级**，依赖版本处于较新状态。

---

## 二、Next.js 16 新特性

### 2.1 核心新特性

| 特性 | 说明 | 优先级 |
|------|------|--------|
| **Cache Components** | 新的 `"use cache"` 指令，可显式缓存页面/组件/函数，配合编译器自动生成缓存键。需在 `next.config.ts` 中启用 `cacheComponents: true` | 🔴 高 |
| **Turbopack (Stable)** | 默认构建工具，生产构建提速 2-5x，快刷新提速 10x | 🟡 中 |
| **proxy.ts** | 重命名自 `middleware.ts`，明确网络边界。逻辑不变，文件名和导出函数需更名 | 🔴 高 |
| **React Compiler (Stable)** | 内置自动 memoization，减少不必要重渲染。需安装 `babel-plugin-react-compiler@latest` | 🟡 中 |
| **Enhanced Routing** | 布局去重 + 增量预取，页面切换更轻更快 | 🟢 低 |
| **Next.js DevTools MCP** | MCP 协议集成，AI 辅助调试 | 🟢 低 |

### 2.2 新缓存 API

| API | 变化 | 说明 |
|-----|------|------|
| `revalidateTag()` | **Breaking** | 第二参数变为必填（需指定 `cacheLife` profile） |
| `updateTag()` | 新增 | Server Actions 专用，提供 read-your-writes 语义 |
| `refresh()` | 新增 | Server Actions 专用，只刷新非缓存数据 |

---

## 三、React 19 / 19.2 关键变化

### 3.1 React 19 主要新特性

| 特性 | 说明 |
|------|------|
| **Actions** | `useActionState`、`useOptimistic`、`useFormStatus`，简化表单和乐观更新 |
| **`use` API** | 可在渲染时读取 Promise/Context，支持条件调用 |
| **`ref` as prop** | 函数组件可直接接收 `ref` prop，无需 `forwardRef` |
| **Context as Provider** | 可直接用 `<Context>` 替代 `<Context.Provider>` |
| **Cleanup for refs** | `ref` 回调可返回清理函数 |
| **Better Hydration Errors** | 更清晰的 SSR 水合错误提示 |

### 3.2 React 19.2 新增

| 特性 | 说明 |
|------|------|
| **`<Activity>`** | 活动模式控制，可替代条件渲染，支持 `visible`/`hidden` 模式 |
| **`useEffectEvent`** | 从 Effect 中分离"事件"逻辑，避免不必要的依赖触发 |
| **Performance Tracks** | Chrome DevTools React 性能追踪 |
| **Partial Pre-rendering** | 部分预渲染 + 后续恢复渲染的能力 |

---

## 四、Breaking Changes（破坏性变更）

### 4.1 Next.js 16 Breaking Changes

| 变更项 | 影响级别 | 说明 |
|--------|----------|------|
| **Async Request APIs 全面异步化** | 🔴 高 | `cookies()`、`headers()`、`draftMode()`、`params`、`searchParams` 只能异步访问 |
| **异步 params 用于图像生成函数** | 🔴 高 | `opengraph-image`、`twitter-image`、`icon`、`apple-icon` 的 props 变为 Promise |
| **异步 sitemap id** | 🟡 中 | `sitemap` 生成函数的 `id` 参数变为 Promise |
| **Node.js 20.9+ 最低版本** | 🔴 高 | 移除 Node.js 18 支持 |
| **TypeScript 5.1+ 最低版本** | 🟡 中 | 移除旧版本支持 |
| **Turbopack 默认化** | 🟡 中 | 自定义 webpack 配置会导致构建失败，需使用 `--webpack` 标志 |
| **`middleware.ts` 废弃** | 🟡 中 | 需重命名为 `proxy.ts` |
| **`resolve.fallback` 移除** | 🟡 中 | Turbopack 使用 `turbopack.resolveAlias` 替代 |

### 4.2 React 19 Breaking Changes

| 变更项 | 影响级别 |
|--------|----------|
| `useFormState` → `useActionState` 重命名 | 🟢 低 |
| `forwardRef` 废弃（逐步移除） | 🟢 低 |
| `<Context.Provider>` 废弃（逐步移除） | 🟢 低 |

---

## 五、升级风险评估

### 5.1 高风险项

1. **Async Request APIs 迁移**
   - Next.js 15 引入了临时的同步兼容模式，**Next.js 16 完全移除同步访问**
   - 项目中所有使用 `cookies()`、`headers()`、`params`、`searchParams` 的地方都需要改造为 `await` 调用
   - **建议**: 运行 `npx @next/codemod@canary upgrade latest` 自动迁移

2. **Node.js 版本要求**
   - 当前服务器/CI 环境需要升级到 Node.js 20.9+
   - **建议**: 确认部署环境版本，若不满足需先升级 Node.js

3. **Turbopack 默认化风险**
   - 项目有 `USE_WEBPACK=true` 配置，Next.js 16 build 默认使用 Turbopack
   - 可能导致构建失败
   - **建议**: 评估 webpack 依赖项，考虑迁移到 Turbopack

### 5.2 中风险项

1. **异步 params 图像生成函数**
   - `app/**/opengraph-image.ts`、`app/**/icon.tsx` 等需要更新

2. **第三方库兼容性**
   - 检查 `@react-three/drei`、`recharts`、`socket.io-client` 等对 React 19 的兼容性

### 5.3 低风险项

1. **`middleware.ts` → `proxy.ts`** — 简单的文件重命名
2. **`forwardRef` / `Context.Provider`** — 逐步废弃，有 codemod 支持

---

## 六、建议优先级

| 优先级 | 行动项 | 预计工作量 |
|--------|--------|----------|
| P0 | 确认 Node.js 版本 ≥ 20.9 | 🔸 5 分钟 |
| P0 | 运行 `npx @next/codemod@canary upgrade latest` 迁移 Async APIs | 🔸 1-2 小时 |
| P1 | 检查并重命名 `middleware.ts` → `proxy.ts` | 🔸 30 分钟 |
| P1 | 移除 `USE_WEBPACK=true` 配置（或保留并用 `--webpack`） | 🔸 30 分钟 |
| P2 | 评估第三方库 React 19 兼容性 | 🔸 2-4 小时 |
| P2 | 考虑启用 `reactCompiler: true` 提升性能 | 🔸 1 小时 |
| P3 | 探索 Cache Components 新缓存模型 | 🔸 待定 |

---

## 七、升级路径建议

```
当前状态: Next.js 16.2.4 + React 19.2.4 ✅ 已完成主升级

下一步行动:
1. [P0] 确认 Node.js ≥ 20.9
2. [P0] 运行官方 codemod 迁移 Async APIs
3. [P1] 处理 middleware.ts → proxy.ts
4. [P1] Turbopack 兼容性检查
5. [P2] 第三方依赖兼容性测试
6. [P2] React Compiler 试点
```

---

## 八、关键资源链接

- [Next.js 16 官方博客](https://nextjs.org/blog/next-16)
- [Next.js 16 升级指南](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [React 19 官方博客](https://react.dev/blog/2024/12/05/react-19)
- [React 19.2 官方博客](https://react.dev/blog/2025/10/01/react-19-2)
- [React 19 升级指南](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)

---

*本报告由 咨询师 子代理 生成，用于 7zi 项目 Next.js 16 + React 19 升级评估。*
