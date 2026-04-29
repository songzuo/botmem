# API Routes 测试覆盖率报告
**日期:** 2026-04-28  
**审计范围:** `/root/.openclaw/workspace/src/app/api/`  
**生成者:** 测试员子代理

---

## 📊 覆盖率总览

| 指标 | 数值 |
|------|------|
| 总路由数 (route.ts 文件) | **108** |
| 有 `__tests__` 目录的路由数 | **39** |
| 路由级别测试文件总数 | **45** |
| **覆盖率** | **36.1% (39/108)** |
| **未覆盖率** | **63.9% (69/108)** |

---

## ✅ 已覆盖路由 (39个 + 根目录)

| 路由路径 | 测试文件数 | 备注 |
|----------|-----------|------|
| `a2a/jsonrpc` | 2 | integration.test.ts, route.test.ts |
| `a2a/registry/[id]/heartbeat` | 1 | |
| `analytics` | 2 | api.test.ts, optimization.test.ts |
| `auth` | 2 | api-integration.test.ts, auth.routes.test.ts |
| `auth/login` | 1 | |
| `auth/register` | 1 | |
| `csrf-token` | 1 | integration.test.ts |
| `data/export` | 1 | integration.test.ts |
| `data/import` | 1 | integration.test.ts |
| `database/health` | 1 | |
| `database/optimize` | 1 | |
| `export` | 1 | |
| `feedback` | 1 | |
| `github/commits` | 1 | |
| `health` | 2 | route.test.ts, route.integration.test.ts |
| `health/detailed` | 1 | |
| `health/live` | 1 | |
| `health/ready` | 1 | |
| `metrics/performance` | 1 | |
| `multimodal/audio` | 1 | |
| `multimodal/image` | 1 | |
| `performance` | 1 | performance-api.test.ts |
| `performance/metrics` | 1 | |
| `projects` | 1 | |
| `ratings` | 1 | |
| `ratings/[id]/helpful` | 1 | |
| `rbac/permissions` | 1 | |
| `rbac/roles` | 1 | |
| `revalidate` | 2 | new_cache_api.test.ts, route.test.ts |
| `search` | 1 | |
| `status` | 2 | (根目录 + 本地) |
| `stream/health` | 1 | |
| `tasks` | 1 | |
| `user/preferences` | 1 | |
| `vitals` | 1 | |
| `web-vitals` | 1 | |
| `websocket` | 3 | performance-benchmark, reconnection, room |
| `workflow/[id]/versions` | 1 | api.test.ts |
| `api/__tests__` (根) | 1 | status.route.test.ts |

> 注：`workflow/[id]/versions` 有 `__tests__` 但整体 `workflow/[id]` 及子路由大部分无测试。

---

## ❌ 未覆盖路由 (69个)

### 🔴 关键业务路由 (无测试)

| 路由路径 | 最近修改 | 风险等级 |
|----------|----------|----------|
| `v1/tenants/*` (6个) | 2026-04 近期 | 🔴 极高 |
| `workflow/*` (15个) | 持续迭代 | 🔴 极高 |
| `a2a/queue` | v1.13.0 | 🔴 极高 |
| `a2a/registry` | v1.13.0 | 🔴 极高 |
| `a2a/registry/[id]` | v1.13.0 | 🔴 极高 |
| `auth/verify` | v1.13.0 | 🔴 极高 |
| `auth/token` | v1.13.0 | 🔴 极高 |
| `auth/refresh` | v1.13.0 | 🔴 极高 |
| `auth/me` | v1.13.0 | 🔴 极高 |
| `auth/logout` | v1.13.0 | 🔴 极高 |
| `rbac/*` (8个) | 持续迭代 | 🔴 极高 |
| `admin/*` (4个) | v1.14.0 | 🔴 极高 |
| `audit/logs` | v1.13.0 | 🔴 极高 |
| `audit/logs/[id]` | v1.13.0 | 🔴 极高 |
| `import/*` (3个) | v1.13.0 | 🔴 极高 |
| `export/*` (4个) | v1.13.0 | 🔴 极高 |
| `rca/*` (3个) | v1.13.0 | 🔴 极高 |
| `reports/*` (3个) | v1.13.0 | 🔴 极高 |

### 🟡 次要/工具路由 (无测试)

| 路由路径 | 备注 |
|----------|------|
| `search/autocomplete` | **近期新增** (2026-04-28) |
| `search/history` | **近期新增** (2026-04-28) |
| `search/v2` | 2026-04 迭代 |
| `analytics/export` | 2026-04 修改 |
| `analytics/metrics` | v1.13.0 |
| `audit/export` | 2026-04 修改 |
| `csp-violation` | 安全相关 |
| `demo/task-status` | 演示/测试用 |
| `feedback/[id]` | v1.13.0 |
| `github/issues` | 无测试 |
| `metrics/prometheus` | 监控 |
| `monitoring/apm` | APM |
| `monitoring/realtime` | 实时监控 |
| `performance/alerts` | 告警 |
| `performance/clear` | 清理 |
| `performance/report` | 报告 |
| `rate-limit` | v1.12.2 |
| `sentry-test` | Sentry 集成 |
| `stream/analytics` | 流分析 |
| `auth/audit-logs` | 审计 |
| `auth/permissions` | 权限 |

---

## 🔍 近期新增/修改路由检查 (2026-04)

### 2026-04-28 最近提交 (d0bf9099a, 6338f1bc6)
| 路由 | 状态 | 备注 |
|------|------|------|
| `search/autocomplete/route.ts` | ❌ 无测试 | **需补充** |
| `search/history/route.ts` | ❌ 无测试 | **需补充** |
| `search/route.ts` | ✅ 有测试 | 已被 `search/__tests__/route.test.ts` 覆盖 |

### v1.14.0 周期修改 (ba5616fea, 751790bf9, 7dcc2dd8d)
| 路由 | 状态 |
|------|------|
| `admin/rate-limit/*` (3个) | ❌ 无测试 |
| `admin/security/blacklist` | ❌ 无测试 |
| `database/optimize` | ✅ 有测试 |
| `revalidate` | ✅ 有测试 |
| `auth/logout`, `auth/me`, `auth/refresh` | ❌ 无测试 |

---

## 📋 测试文件命名规范检查

| 检查项 | 结果 | 说明 |
|--------|------|------|
| `__tests__` 目录存在性 | ✅ 39个目录 | 规范良好 |
| 测试文件命名 | ⚠️ 混合 | 混用 `.test.ts` / `.integration.test.ts` / `.route.test.ts` |
| 集成测试命名 | ⚠️ 不统一 | 建议统一用 `.integration.test.ts` |
| 根目录 `api/__tests__` | ✅ 存在 | 仅 1 个 `status.route.test.ts` |

**命名规范建议:**
```
route.test.ts           ← 标准路由测试
route.integration.test.ts  ← 集成测试
route.e2e.test.ts       ← E2E测试 (可选)
```

---

## 🎯 覆盖率差距分析

### 按模块分类

| 模块 | 总路由 | 已覆盖 | 覆盖率 |
|------|--------|--------|--------|
| a2a | 6 | 3 | 50% |
| admin | 4 | 0 | 0% |
| analytics | 2 | 1 | 50% |
| audit | 3 | 0 | 0% |
| auth | 10 | 5 | 50% |
| data | 2 | 2 | 100% |
| database | 2 | 2 | 100% |
| export | 5 | 1 | 20% |
| feedback | 2 | 1 | 50% |
| github | 2 | 1 | 50% |
| health | 5 | 5 | 100% |
| import | 3 | 0 | 0% |
| metrics | 2 | 1 | 50% |
| monitoring | 2 | 0 | 0% |
| multimodal | 2 | 2 | 100% |
| performance | 5 | 3 | 60% |
| rbac | 8 | 2 | 25% |
| rca | 3 | 0 | 0% |
| reports | 3 | 0 | 0% |
| search | 4 | 1 | 25% |
| stream | 2 | 1 | 50% |
| tasks | 1 | 1 | 100% |
| v1/tenants | 6 | 0 | 0% |
| workflow | 16 | 1 | 6.3% |
| 其他 (csp-violation, csrf-token, demo, etc.) | 7 | 3 | 43% |

### 最需补充测试的模块 (按重要性排序)

1. **🔴 workflow (16个路由, 仅6.3%覆盖)** — 最高风险
2. **🔴 v1/tenants (6个路由, 0%覆盖)** — 多租户核心功能
3. **🔴 admin (4个路由, 0%覆盖)** — 管理后台
4. **🔴 rca (3个路由, 0%覆盖)** — 根因分析
5. **🔴 reports (3个路由, 0%覆盖)** — 报表生成
6. **🔴 import (3个路由, 0%覆盖)** — 数据导入
7. **🔴 monitoring (2个路由, 0%覆盖)** — 监控
8. **🔴 audit (3个路由, 0%覆盖)** — 审计日志
9. **🔴 a2a/queue & a2a/registry (3个路由, 0%覆盖)** — A2A 核心
10. **🟡 search (4个路由, 25%覆盖)** — 搜索功能

---

## 📝 建议

### 紧急 (本周内)
1. **补充 `search/autocomplete` 和 `search/history` 测试** — 刚刚添加
2. **补充 `workflow/[id]/executions` 相关测试** — 高频使用

### 高优先级 (本月内)
3. **v1/tenants 全部 6 个路由** — 多租户核心
4. **a2a/queue, a2a/registry, a2a/registry/[id]** — A2A 核心组件
5. **admin 所有路由** — 安全敏感

### 中优先级 (下季度)
6. **workflow 剩余路由** — 16个中仅1个有测试
7. **rca, reports, import** — 业务关键
8. **audit/logs, audit/logs/[id]** — 合规要求

### 覆盖率目标建议
- 当前: **36.1%**
- 月度目标: **50%**
- 季度目标: **70%**

---

*报告生成时间: 2026-04-28 21:40 GMT+2*
