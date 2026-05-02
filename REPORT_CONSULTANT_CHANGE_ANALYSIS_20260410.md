# 变更分析报告 - 7zi-frontend
**日期**: 2026-04-10  
**分析师**: 咨询师 (Research & Analysis Agent)  
**报告编号**: REPORT_CONSULTANT_CHANGE_ANALYSIS_20260410

---

## 📋 执行摘要

项目有 **大量未提交更改 (30+ 文件)**，涵盖核心迁移、功能增强和配置更新。变更整体质量较高，但涉及面广，建议分阶段提交。

---

## 1️⃣ 变更分类

### 🔴 高优先级 - 必须提交 (迁移/修复)

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/app/layout.tsx` | **迁移修复** | Next.js 16 规范：viewport 需独立 export，不能写在 metadata 内 |
| `next.config.ts` | **迁移修复** | PWA 库从 `next-pwa` 迁移到 `@ducanh2912/next-pwa`（Next.js 16 不兼容旧库） |
| `public/sw.js` | **迁移修复** | 配合新 PWA 库的 Service Worker 更新 |

**风险**: 不提交这两个迁移修复会导致 Next.js 16 无法正常运行。

### 🟡 中优先级 - 性能优化 (功能增强)

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/app/api/agents/learning/route.ts` | **功能增强** | 添加 `createHotDataCache` 缓存层，减少重复计算 |
| `src/app/api/notifications/route.ts` | **功能增强** | 同上，notifications 缓存 |
| `src/app/api/search/route.ts` | **功能增强** | 搜索 API 优化 |
| `src/app/api/rooms/route.ts` | **功能增强** | rooms API 优化 |

**风险**: 中等。缓存逻辑已存在于其他 API（如 projects），模式成熟。

### 🟢 低风险 - 代码质量

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/hooks/__tests__/usePerformanceMonitor.test.ts` | **重构** | 优化 mock 数据结构，提升测试可维护性 |
| `src/lib/middleware/csrf.ts` | **重构** | 导出 `verifyToken` 函数便于测试 |
| `vitest.config.ts` | **配置** | 配置文件格式调整（从 test{} 内移到外层） |
| `src/app/manifest.ts` | **清理** | 删除重复的 iOS touch icons 配置 |

---

## 2️⃣ 关键变更详解

### 2.1 Next.js 16 迁移 (layout.tsx)

```diff
// 旧写法 (Next.js 15)
export const metadata: Metadata = {
  themeColor: '#667eea',
  viewport: { ... },
}

// 新写法 (Next.js 16)
export const metadata: Metadata = { ... }
export const viewport = {
  themeColor: '#667eea',
  width: 'device-width',
  ...
}
```

**影响**: ✅ 正确迁移，符合 Next.js 16 规范

---

### 2.2 PWA 库迁移 (next.config.ts)

```diff
- import withPWA from 'next-pwa'
+ import withPWA from '@ducanh2912/next-pwa'
```

**影响**: ✅ 必要迁移，next-pwa 5.6.0 与 Next.js 16 不兼容

---

### 2.3 缓存层添加 (agents/learning, notifications)

```typescript
// 新增缓存模式
const agentLearningCache = createHotDataCache<unknown>(CachePresets.MEDIUM)

const cachedResult = agentLearningCache.get(cacheKey)
if (cachedResult) {
  return createSuccessResponse(cachedResult)
}
// ... 处理逻辑
agentLearningCache.set(cacheKey, response)
```

**影响**: ⚠️ 需验证缓存失效逻辑和 TTL 设置

---

## 3️⃣ 风险评估

| 风险项 | 等级 | 说明 |
|--------|------|------|
| Next.js 16 迁移失败 | 🔴 高 | layout.tsx viewport 分离是强制的 |
| PWA 功能失效 | 🔴 高 | @ducanh2912/next-pwa 配置兼容性 |
| 缓存导致数据过期 | 🟡 中 | notifications/agents 缓存需验证 TTL |
| 测试 mock 逻辑错误 | 🟡 中 | usePerformanceMonitor 测试重构 |
| eslintrc.json 缺失 | 🟢 低 | 新增文件需确认是否有 lint 问题 |

---

## 4️⃣ 提交建议

### ✅ 方案一：分 3 次提交（推荐）

```
Commit 1: Next.js 16 核心迁移
├── src/app/layout.tsx
├── next.config.ts
├── public/sw.js
└── package.json (@ducanh2912/next-pwa 依赖)

Commit 2: 性能优化 - 缓存层
├── src/app/api/agents/learning/route.ts
├── src/app/api/notifications/route.ts
└── src/app/api/search/route.ts (如涉及)

Commit 3: 测试 & 配置优化
├── vitest.config.ts
├── src/hooks/__tests__/usePerformanceMonitor.test.ts
├── src/lib/middleware/csrf.ts
└── src/app/manifest.ts
```

### ⚠️ 方案二：一次性提交（不推荐）

- 30+ 文件同时提交，回滚困难
- 难以定位问题来源

---

## 5️⃣ 需要的测试验证

### 5.1 Next.js 16 迁移验证

```bash
# 构建测试
pnpm build

# 验证 viewport 元标签
curl -s http://localhost:3000 | grep viewport
# 应看到: <meta name="viewport" content="...">

# 验证 theme-color
curl -s http://localhost:3000 | grep theme-color
```

### 5.2 PWA 验证

```bash
# 检查 Service Worker 注册
# 访问 /sw.js 应返回有效 JS

# Lighthouse PWA 审计
npx lighthouse --only-categories=PWA http://localhost:3000
```

### 5.3 缓存层验证

```bash
# 验证缓存命中 (日志)
# 连续两次请求同一 API，观察日志：
# 第一次: "Agent Learning API: cache miss"
# 第二次: "Agent Learning API: cache hit"

# 验证缓存失效
# 修改数据后，TTL 内应返回旧数据
# TTL 后应返回新数据
```

### 5.4 回归测试

```bash
# 运行所有测试
pnpm test

# 重点关注
pnpm test -- src/app/api/agents/
pnpm test -- src/app/api/notifications/
pnpm test -- src/hooks/__tests__/usePerformanceMonitor.test.ts
```

---

## 6️⃣ 结论

| 评估项 | 结果 |
|--------|------|
| **总体状态** | 🟡 需要测试验证 |
| **紧急程度** | 🔴 Next.js 16 迁移需尽快提交 |
| **推荐策略** | 分 3 次提交，先核心迁移，后功能，最后测试 |
| **是否建议立即提交** | ❌ 否 - 建议先运行 `pnpm build` 和 `pnpm test` |

---

## 📎 附录：变更文件清单

```
核心迁移 (3):
├── src/app/layout.tsx
├── next.config.ts
└── public/sw.js

API 路由 (7):
├── src/app/api/agents/learning/route.ts
├── src/app/api/feedback/__tests__/route.test.ts
├── src/app/api/notifications/route.ts
├── src/app/api/projects/__tests__/route.test.ts
├── src/app/api/rooms/[id]/route.ts
├── src/app/api/rooms/route.ts
├── src/app/api/search/route.ts
└── src/app/api/users/__tests__/route.test.ts

Hooks & 测试 (4):
├── src/hooks/__tests__/usePerformanceMonitor.test.ts
├── src/lib/__tests__/websocket-manager-*.test.ts
├── tests/integration/cursor-sync.integration.test.tsx
└── vitest.config.ts

中间件 & 配置 (4):
├── src/lib/middleware/csrf.ts
├── src/lib/middleware/__tests__/csrf.test.ts
├── package.json
└── pnpm-lock.yaml
```

---

*报告生成时间: 2026-04-10 19:28 GMT+2*
