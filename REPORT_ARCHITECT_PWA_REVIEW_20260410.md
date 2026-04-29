# PWA 配置审查报告

**审查日期:** 2026-04-10  
**审查者:** 架构师子代理  
**项目:** 7zi-frontend

---

## 1. PWA 变更摘要

| 文件 | 变更类型 | 描述 |
|------|---------|------|
| `public/sw.js` | 修改 | Workbox 引用更新，路由策略重写 |
| `public/workbox-*.js` | 删除 + 新增 | `workbox-c04df694` → `workbox-3c9d0171` |
| `src/app/manifest.ts` | 修改 | 移除重复的 iOS 图标定义 |
| `next.config.ts` | 修改 | PWA 库从 `next-pwa` 切换到 `@ducanh2912/next-pwa` |

---

## 2. Service Worker 更新分析

### 2.1 Workbox 版本更新

| 项目 | 旧版本 | 新版本 | 状态 |
|------|--------|--------|------|
| Workbox 文件 | `workbox-c04df694.js` | `workbox-3c9d0171.js` | ✅ 正常 |
| Build ID | `7WtzNP8VPEqwOmAgSankw` | `cr2BTubPx4qNqvZqxWaV8` | ✅ 更新 |
| `ignoreURLParametersMatching` | `[]` (空) | `[/^utm_/,/^fbclid$/]` | ✅ 改进 |

### 2.2 路由策略变化

**旧版本路由策略 (简化版):**
```javascript
// 通用缓存策略 - 过于宽泛
e.registerRoute(/^https?.*/, new NetworkFirst(...))  // 所有请求
e.registerRoute(/\.(?:js|css|html)$/, new StaleWhileRevalidate(...))
```

**新版本路由策略 (精细化):**
```javascript
// 根路径 - NetworkFirst
e.registerRoute("/", new NetworkFirst({cacheName:"start-url",...}))

// Google Fonts - 分离策略
e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i, new CacheFirst(...))
e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i, new StaleWhileRevalidate(...))

// 静态资源 - 分类缓存
e.registerRoute(/\/_next\/static.+\.js$/i, new CacheFirst(...))  // JS 文件
e.registerRoute(/\.(?:js)$/i, new StaleWhileRevalidate(...))    // 其他 JS
e.registerRoute(/\.(?:css|less)$/i, new StaleWhileRevalidate(...))

// API 路由 - 区分处理
e.registerRoute(({sameOrigin:e, url:{pathname:s}}) => !(...), new NetworkFirst(...))

// RSC 路由 - 专门处理
e.registerRoute(..., new NetworkFirst({cacheName:"pages-rsc-prefetch",...}))
e.registerRoute(..., new NetworkFirst({cacheName:"pages-rsc",...}))
```

**评估:** ✅ **改进显著** - 新策略更符合 Next.js App Router 架构，RSC 页面分离缓存。

### 2.3 缓存过期时间变化

| 缓存类型 | 旧版本 | 新版本 | 评估 |
|---------|--------|--------|------|
| 静态 JS | 500条/604800秒 | 64条/86400秒 | ⚠️ 需确认 |
| 图片 | 1000条/2592000秒 | 64条/2592000秒 | ⚠️ 需确认 |
| API | 100条/300秒 | 16条/86400秒 | ⚠️ 需确认 |

**问题:** 部分缓存条目数减少可能导致缓存命中率下降。

---

## 3. Manifest 变更分析

### 3.1 变更内容

**删除的重复 iOS 图标配置:**
```typescript
// 旧版 - 错误：icons 定义在主 icons 数组之后
{ icons: [...] },  // 主 icons
// 触摸图标（iOS）- 错误：重复定义
icons: [
  {
    src: '/icons/icon-192x192.png',
    sizes: '192x192',
    type: 'image/png',
    purpose: 'any maskable',  // 语法错误：空格分隔
  },
],
```

### 3.2 评估

| 检查项 | 状态 | 说明 |
|--------|------|------|
| icons 完整性 | ✅ | 10种尺寸覆盖 (72-512) |
| maskable icons | ✅ | 192x192, 512x512 已包含 |
| shortcuts | ✅ | 控制台、房间、设置 |
| screenshots | ✅ | 包含宽窄两种格式 |
| iOS icons | ⚠️ | 已移除重复定义，但主 icons 已覆盖 |

**结论:** ✅ **有效修复** - 移除了语法错误且位置错误的 iOS 图标重复定义。

---

## 4. next.config.ts PWA 配置分析

### 4.1 关键变更

```diff
- import withPWA from 'next-pwa'
+ import withPWA from '@ducanh2912/next-pwa'
```

**原因:** `next-pwa 5.6.0` 与 Next.js 16 不兼容，切换到社区维护的 `@ducanh2912/next-pwa`。

### 4.2 新增 buildExcludes

```javascript
buildExcludes: [
  /middleware-manifest\.json$/,
  /next-rest-fetcher\.json$/,
  /pages-manifest\.json$/,
  /server\/pages-manifest\.json$/,
  /react-loadable-manifest\.json$/,
  /__next\/server\/pages-manifest\.json$/,
],
```

**评估:** ✅ **必要配置** - 防止 Service Worker 缓存不应缓存的构建清单文件。

### 4.3 配置顺序调整

```javascript
// 旧版
disable: process.env.NODE_ENV === 'development',  // 第3位

// 新版
disable: process.env.NODE_ENV === 'development',  // 第1位
```

**评估:** ✅ **无影响** - 仅配置顺序调整，功能不变。

---

## 5. 潜在 PWA 问题

### 5.1 🔴 中等风险

| 问题 | 描述 | 建议 |
|------|------|------|
| **缓存条目数减少** | 新版 sw.js 中多处缓存 maxEntries 减少 | 监控实际缓存命中率，如有必要可调高 |
| **旧缓存未清理** | `cleanupOutdatedCaches()` 已配置 | ✅ 正常 |

### 5.2 🟡 低风险

| 问题 | 描述 | 建议 |
|------|------|------|
| **API 缓存时间增加** | 从 300秒 → 86400秒 | 确保 API 数据实时性要求不高 |
| **workbox 文件哈希变化** | 正常构建结果 | 无需处理 |

### 5.3 🟢 正常

| 检查项 | 状态 |
|--------|------|
| Workbox 版本一致性 | ✅ 所有引用一致 |
| precache 清单更新 | ✅ 包含最新构建文件 |
| 离线页面配置 | ✅ `/offline.html` 已包含 |
| iOS Web App 配置 | ✅ `apple-mobile-web-app-*` meta tags 需确认在 layout.tsx |

---

## 6. 验证建议

1. **在生产环境测试以下场景:**
   - [ ] 全新安装后首次离线访问
   - [ ] 更新后 Service Worker 刷新
   - [ ] 清除缓存后重新缓存
   - [ ] iOS Safari 添加到主屏幕

2. **检查 layout.tsx 是否包含 iOS PWA meta tags:**
   ```tsx
   apple-mobile-web-app-capable: yes
   apple-mobile-web-app-status-bar-style
   apple-mobile-web-app-title
   ```

---

## 7. 总体评估

| 方面 | 评分 | 说明 |
|------|------|------|
| Service Worker 更新 | ⭐⭐⭐⭐ | 路由策略更精细，符合 Next.js App Router |
| Manifest 配置 | ⭐⭐⭐⭐⭐ | 修复了重复定义的 bug |
| PWA 库迁移 | ⭐⭐⭐⭐ | 从 next-pwa 迁移到 @ducanh2912 正确 |
| 向后兼容性 | ⭐⭐⭐ | 缓存策略调整需监控 |

**总体结论:** ✅ **配置正确，可以部署**。建议在生产环境监控缓存命中率，并根据实际情况调整 `maxEntries` 参数。
