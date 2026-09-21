# 7zi-frontend Next.js 16 兼容性深度审查报告

**审查日期**: 2026-04-28  
**项目路径**: `/root/.openclaw/workspace/7zi-frontend`  
**当前 Next.js 版本**: `^16.2.4` (package.json)  
**当前 React 版本**: `^19.2.5`

---

## 一、发现的问题列表

### 🔴 严重问题

#### 1. 依赖版本冲突 (Invalid Dependencies)

| 包名 | 当前版本 | 要求的 Next.js 版本 | 状态 |
|------|----------|---------------------|------|
| `@storybook/nextjs-vite@10.3.5` | 10.3.5 | `^15.2.3` | ❌ 不兼容 |
| `vite-plugin-storybook-nextjs@3.2.4` | 3.2.4 | `16.0.0` | ❌ 不兼容 |
| `@ducanh2912/next-pwa@10.2.9` | 10.2.9 | 嵌套 `next@14.2.12` | ⚠️ 嵌套依赖过旧 |

**影响**: Storybook 可能无法正常工作，PWA 功能存在潜在问题。

#### 2. next.config.ts 中的 `experimental` 块需要审查

以下 experimental 配置在 Next.js 16 中可能已被移除或改名：

```typescript
experimental: {
  optimizePackageImports: [...],  // ✅ 可能在 Next.js 16 中变为稳定功能
  optimizeCss: true,               // ⚠️ 可能需要迁移配置位置
}
```

#### 3. Turbopack 空配置问题

```typescript
turbopack: {}, // 空配置，让 Next.js 使用 Webpack
```

Next.js 16 可能默认启用 Turbopack，需要确认 `dev:webpack` 和 `build:webpack` 脚本是否仍然有效。

---

### 🟡 中等问题

#### 4. Viewport Export 模式

`src/app/layout.tsx` 已正确分离 `viewport` export：
```typescript
export const viewport = {
  themeColor: '#667eea',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  userScalable: true,
}
```

✅ **此模式符合 Next.js 15+ 规范，Next.js 16 兼容**

#### 5. Dynamic Route Params 作为 Promise

已正确实现 (Next.js 15+ 规范)：
```typescript
// src/app/api/rooms/[id]/route.ts
params: Promise<{ id: string }>
const { id } = await params
```

✅ **Next.js 16 兼容**

#### 6. Server Actions 和 Server Components

**检查结果**: 项目中**未发现** Server Actions 使用 (`use server` 指令)。

✅ **无相关兼容性问题**

#### 7. Server External Packages

```typescript
serverExternalPackages: ['jose', 'better-sqlite3', 'sharp', 'uuid'],
```

⚠️ Next.js 16 可能将此 API 从 `experimental.serverExternalPackages` 移到顶层 `serverExternalPackages`。

---

### 🟢 轻微问题

#### 8. API Routes 的 `runtime` 和 `dynamic` export

```typescript
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
```

✅ 符合 Next.js 15+ 规范，Next.js 16 兼容

#### 9. metadata API 使用

`src/app/layout.tsx` 中的 metadata 使用正确：
```typescript
export const metadata: Metadata = { ... }
```

✅ 符合 Next.js 15+ 规范

---

## 二、建议的修复方案

### 优先级 P0 (立即修复)

#### 1. 更新 Storybook 相关依赖

```bash
# 方案 A: 更新到支持 Next.js 16 的版本
pnpm update @storybook/nextjs-vite vite-plugin-storybook-nextjs

# 方案 B: 如果没有兼容版本，考虑移除 Storybook 或等待官方支持
```

#### 2. 检查 PWA 包更新

```bash
# @ducanh2912/next-pwa 可能需要更新
pnpm update @ducanh2912/next-pwa
```

或查看是否有 `next-pwa` v6+ 支持 Next.js 16。

#### 3. 将 `serverExternalPackages` 移出 experimental

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  // ... 其他配置
  
  // 从 experimental 移到顶层
  serverExternalPackages: ['jose', 'better-sqlite3', 'sharp', 'uuid'],
  
  experimental: {
    // 仅保留仍处于实验阶段的配置
    optimizePackageImports: [...],
    optimizeCss: true,
  }
}
```

### 优先级 P1 (短期修复)

#### 4. 验证 Turbopack 配置

```bash
# 测试 turbopack 模式
npm run dev  # 默认使用 turbopack

# 如果失败，回退到 webpack
npm run dev:webpack
```

#### 5. 审查 `optimizeCss` 配置

如果 `experimental.optimizeCss` 在 Next.js 16 中不再支持，可能需要：
- 使用 `css-minimizer-webpack-plugin` 替代
- 或使用 Tailwind 的内置优化

#### 6. 检查 React Compiler 配置

```typescript
reactCompiler: {
  compilationMode: 'annotation',
}
```

Next.js 16 可能会改变 React Compiler 的默认行为或 API。

---

## 三、需要进一步研究的内容

### 📋 待确认事项

1. **Next.js 16 正式发布说明**
   - 确认 Next.js 16 的具体发布日期和breaking changes
   - 订阅 [Next.js GitHub](https://github.com/vercel/next.js) 关注 release notes

2. **Storybook 16 兼容性**
   - 等待 Storybook 发布支持 Next.js 16 的版本
   - 参考: https://github.com/storybookjs/storybook/issues

3. **React 19 最终 API**
   - 当前使用 React 19.2.5，需要确认是否有 pending changes
   - `useFormStatus`, `useFormState`, `useOptimistic` 等 hook 的稳定版 API

4. **Turbopark vs Webpack**
   - Next.js 16 是否会默认启用 Turbopack
   - 对现有 webpack 自定义配置的兼容性影响

5. **Breaking Changes 检查清单**
   - [ ] `next/head` 组件是否已废弃 (已迁移到 metadata API)
   - [ ] `next/router` 是否有变更 (当前项目未使用)
   - [ ] Image 组件 API 是否有变化
   - [ ] SWC 编译器是否有 breaking changes

---

## 四、总结

### 兼容性状态: 🟡 部分兼容，需要调整

| 模块 | 状态 | 说明 |
|------|------|------|
| App Router | ✅ 兼容 | params as Promise 等模式已正确实现 |
| API Routes | ✅ 兼容 | dynamic/runtime exports 正确 |
| Metadata API | ✅ 兼容 | 已使用最新 API |
| Webpack Config | ⚠️ 需验证 | 部分 experimental 选项可能变更 |
| Storybook | ❌ 不兼容 | 版本冲突需要解决 |
| PWA | ⚠️ 待验证 | @ducanh2912/next-pwa 需要确认兼容性 |

### 建议行动

1. **立即**: 创建 Next.js 16 升级测试分支
2. **短期**: 更新冲突依赖，审查 experimental 配置
3. **中期**: 运行完整测试套件验证兼容性
4. **长期**: 关注 Next.js 16 正式发布和生态适配

---

*报告生成时间: 2026-04-28 02:40 GMT+2*
