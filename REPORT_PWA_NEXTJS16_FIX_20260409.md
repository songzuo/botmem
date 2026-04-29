# PWA + Next.js 16 兼容性问题修复报告

**日期**: 2026-04-09  
**执行者**: Executor 子代理  
**任务**: 修复 `next-pwa` 与 Next.js 16 的兼容性问题  
**项目路径**: `/root/.openclaw/workspace/7zi-frontend`

---

## 一、问题分析

### 1.1 原始问题
- `next-pwa` 5.6.0 官方尚未声明支持 Next.js 16
- `public/sw.js` 存在陈旧的缓存文件，与新版冲突
- `public/workbox-*.js` 存在过期的 Workbox 构建产物
- 构建时报错：`ENOENT: no such file or directory, open '.next/server/pages-manifest.json'`

### 1.2 根本原因
`next-pwa` 5.6.0 使用了 Next.js Pages Router 时代的构建机制（`pages-manifest.json`），而 Next.js 16 已全面转向 App Router，缺少该文件导致构建管道中断。

---

## 二、执行的操作

### 2.1 删除陈旧的 PWA 文件
```bash
rm -f public/sw.js              # 旧的 service worker
rm -f public/workbox-*.js        # 旧的 workbox 构建产物
```

### 2.2 迁移 PWA 依赖
```bash
# 移除不兼容的包
pnpm remove next-pwa

# 安装兼容 Next.js 16 的包
pnpm add @ducanh2912/next-pwa@^10.0.0
# 安装版本: 10.2.9
```

### 2.3 重写 next.config.ts
完全重写了 `next.config.ts`，将旧版 `withWorkbox({...})` 配置迁移为新版 `@ducanh2912/next-pwa` 的 `withPWA(pwaConfig)(nextConfig)` 模式。

**关键配置变更**:
- `withPWA()` 现在是**顶层包装器**，包裹 `nextConfig` 对象
- `buildExcludes` 新增了 Next.js 16 特有文件的排除规则：
  - `/middleware-manifest\.json$/`
  - `/next-rest-fetcher\.json$/`
  - `/pages-manifest\.json$/`
  - `/__next\/server\/pages-manifest\.json$/`
- `runtimeCaching` 缓存策略保持不变（HTML、JS/CSS、图片、字体、API 等）
- `dest: 'public'` 输出到 `public/` 目录

### 2.4 清理构建缓存
```bash
rm -rf .next   # 清除所有 Next.js 构建缓存
```

---

## 三、验证结果

### 3.1 构建状态: ✅ 成功

```
▲ Next.js 16.2.2 (webpack)
✓ (pwa) Compiling for server...
✓ (pwa) Compiling for server...
✓ (pwa) Compiling for client (static)...
○ (pwa) Service worker: /root/.openclaw/workspace/7zi-frontend/public/sw.js
○ (pwa)   URL: /sw.js
○ (pwa)   Scope: /

⚠ Compiled with warnings in 2.4min
Route (app) ... (67 routes)
✓ Generating static pages using 3 workers (67/67) in 4.4s

Process exited with code 0.
```

### 3.2 生成的 PWA 文件
| 文件 | 大小 | 说明 |
|------|------|------|
| `public/sw.js` | 25K | 新版 Service Worker |
| `public/workbox-3c9d0171.js` | 24K | Workbox 运行时 |

### 3.3 构建警告（非阻塞）
- `themeColor` 和 `viewport` metadata 配置警告（多个页面）- 建议后续迁移到 `viewport()` export，但不影响 PWA 功能
- 入口点大小超过推荐限制（Three.js 相关 chunk 345-365KB）- 可接受

---

## 四、配置对比

### 旧版 (`next-pwa` 5.6.0)
```ts
import withWorkbox from 'next-pwa'

const nextConfig = { ... }
export default withWorkbox({
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  // ...manifest 等
})(nextConfig)
```

### 新版 (`@ducanh2912/next-pwa` 10.2.9)
```ts
import withPWA from '@ducanh2912/next-pwa'

const nextConfig: NextConfig = { ... }

const pwaConfig = {
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  buildExcludes: [
    /middleware-manifest\.json$/,
    /pages-manifest\.json$/,
    // ... Next.js 16 特有文件
  ],
  runtimeCaching: [ /* 缓存策略 */ ],
}

export default withPWA(pwaConfig)(nextConfig)
```

---

## 五、后续建议

1. **metadata viewport 迁移**: 多个页面的 `themeColor` 和 `viewport` 仍在 `metadata` 中导出，应迁移到独立的 `viewport()` export（Next.js 16 新规范）
2. **Three.js chunk 优化**: 可考虑将 Three.js 相关页面改为动态导入，减少主 bundle 大小
3. **manifest.json**: 确认 `public/` 下是否有 `manifest.json`，`@ducanh2912/next-pwa` 默认会自动生成
4. **生产部署测试**: 建议在 7zi.com 或 bot5.szspd.cn 进行实际 PWA 功能验证（离线缓存、Service Worker 更新等）

---

## 六、结论

**✅ 修复完成** - `next-pwa` 5.6.0 已成功迁移至 `@ducanh2912/next-pwa` 10.2.9，`pnpm build` 构建成功，Service Worker 已正确生成到 `public/sw.js`。Next.js 16 的兼容性问题已解决。
