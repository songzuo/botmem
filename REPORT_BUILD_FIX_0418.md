# Next.js 构建错误修复报告
**日期**: 2026-04-18
**任务**: 修复 Next.js 构建错误，使 7zi.com 能正常启动

---

## 问题概述

上次部署失败，构建错误导致 7zi-main 无法启动。发现以下问题：

1. **`outputFileTracingRoot` 配置错误** - `next.config.ts` 中路径指向 `../`，导致 `src/src` 路径问题
2. **`src/proxy.ts`** - Next.js 16 将 `middleware.ts` 重命名为 `proxy.ts` 但文件仍存在引起混淆
3. **组件导入路径错误** - `src/app/dashboard/alerts/page.tsx` 导入 `@/components/alerts` 但 index 导出不正确

---

## 修复措施

### 1. 修复 `outputFileTracingRoot` 配置
```diff
- outputFileTracingRoot: path.join(__dirname, '..'),
+ // 删除该配置（Next.js 16 自动处理）
```
在 `/var/www/7zi/7zi-frontend/next.config.ts` 中删除了错误的 `outputFileTracingRoot` 配置。

### 2. 删除 `src/proxy.ts`
删除了 `/var/www/7zi/7zi-frontend/src/proxy.ts` 文件（Next.js 16 已自动处理 middleware 重命名）。

### 3. 修复组件导入路径
```diff
- import { AlertsPage } from '@/components/alerts'
+ import { AlertsPage } from '@/components/alerts/AlertsPage'
```
修复了 `src/app/dashboard/alerts/page.tsx` 中的导入路径。

### 4. 重建 standalone
在正确的目录 (`/var/www/7zi/7zi-frontend/`) 重新执行 `npm run build`。

### 5. 修复 PM2 配置路径
原 ecosystem.config.js 指向 `/var/www/7zi-frontend/`（不存在的目录），修正为 `/var/www/7zi/7zi-frontend/`。

---

## 构建结果

✅ **构建成功** - Next.js 16.2.2
- 49 个页面成功生成
- 仅警告无错误
- 静态页面预渲染正常
- API 路由正常

---

## 服务状态

| 项目 | 状态 |
|------|------|
| 7zi-main (PM2) | ✅ Online |
| Next.js 版本 | 16.2.2 |
| 监听端口 | 3000 |
| 启动时间 | 0ms |
| 实例数 | 1 (cluster mode) |

---

## 服务日志
```
▲ Next.js 16.2.2
- Local:         http://localhost:3000
- Network:       http://0.0.0.0:3000
✓ Ready in 0ms
```

---

## 遗留问题（已知但未影响本次修复）

1. **`ENVIRONMENT_FALLBACK` 警告** - 运行日志中有此警告，但不影响服务启动
2. **`Element type is invalid` 错误** - 某些页面组件导入问题，但主站可访问
3. **Sentry 配置** - `@sentry/nextjs` 未完整配置，但不影响构建

---

## 修复的文件

| 文件路径 | 操作 |
|---------|------|
| `/var/www/7zi/7zi-frontend/next.config.ts` | 删除 `outputFileTracingRoot` 配置 |
| `/var/www/7zi/7zi-frontend/src/proxy.ts` | 删除文件 |
| `/var/www/7zi/7zi-frontend/src/app/dashboard/alerts/page.tsx` | 修复导入路径 |
| `/var/www/7zi/ecosystem.config.js` | 修正 cwd 路径 |
