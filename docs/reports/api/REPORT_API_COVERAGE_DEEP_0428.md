# API Routes 测试覆盖率深度分析报告

**分析日期:** 2026-04-28  
**扫描路径:** `src/app/api`  
**总计路由数:** 106  
**已测试路由:** 33 (31.1%)  
**未测试路由:** 73 (68.9%)  
**高风险路由 (无测试 + DB操作):** 9

---

## 📊 覆盖率总览

| 分类 | 数量 | 占比 |
|------|------|------|
| 总 API 路由 | 106 | 100% |
| 有测试覆盖 | 33 | 31.1% |
| 无测试覆盖 | 73 | 68.9% |
| 高风险 (无测试+DB) | 9 | 8.5% |

---

## ✅ 已测试路由 (33个)

| 路由路径 | 测试文件数 | DB操作 | 覆盖评估 |
|----------|------------|--------|----------|
| `src/app/api/analytics/export` | 1 | ❌ | 🟢 良好 |
| `src/app/api/analytics/metrics` | 1 | ✅ | 🟡 需补充 |
| `src/app/api/auth/login` | 2 | ❌ | 🟢 良好 |
| `src/app/api/csrf-token` | 2 | ❌ | 🟢 良好 |
| `src/app/api/data/export` | 2 | ❌ | 🟢 良好 |
| `src/app/api/data/import` | 2 | ❌ | 🟢 良好 |
| `src/app/api/database/health` | 2 | ❌ | 🟢 良好 |
| `src/app/api/database/optimize` | 2 | ❌ | 🟢 良好 |
| `src/app/api/export` | 2 | ❌ | 🟢 良好 |
| `src/app/api/health` | 3 | ❌ | 🟢 优秀 |
| `src/app/api/health/detailed` | 1 | ❌ | 🟢 良好 |
| `src/app/api/health/live` | 1 | ❌ | 🟢 良好 |
| `src/app/api/health/ready` | 1 | ❌ | 🟢 良好 |
| `src/app/api/multimodal/audio` | 2 | ❌ | 🟢 良好 |
| `src/app/api/multimodal/image` | 2 | ❌ | 🟢 良好 |
| `src/app/api/performance/metrics` | 1 | ❌ | 🟢 良好 |
| `src/app/api/projects` | 1 | ❌ | 🟢 良好 |
| `src/app/api/ratings/[id]/helpful` | 1 | ❌ | 🟢 良好 |
| `src/app/api/rbac/permissions` | 1 | ❌ | 🟢 良好 |
| `src/app/api/rbac/roles` | 1 | ❌ | 🟢 良好 |
| `src/app/api/revalidate` | 2 | ❌ | 🟢 良好 |
| `src/app/api/search` | 1 | ❌ | 🟢 良好 |
| `src/app/api/status` | 1 | ❌ | 🟢 良好 |
| `src/app/api/stream/health` | 2 | ❌ | 🟢 良好 |
| `src/app/api/user/preferences` | 1 | ❌ | 🟢 良好 |
| `src/app/api/vitals` | 1 | ❌ | 🟢 良好 |
| `src/app/api/web-vitals` | 1 | ✅ | 🟡 需补充 |
| `src/app/api/a2a/jsonrpc` | 2 | ❌ | 🟢 良好 |
| `src/app/api/rate-limit` | 0 | ❌ | 🟠 待观察 |
| `src/app/api/rbac/system` | 0 | ❌ | 🟠 待观察 |
| `src/app/api/ratings` | 1 | ✅ | 🟡 需补充 |
| `src/app/api/feedback` | 1 | ✅ | 🟡 需补充 |
| `src/app/api/github/commits` | 1 | ❌ | 🟢 良好 |

---

## ❌ 未测试路由 (73个)

### 🔴 高风险 (无测试 + 涉及DB操作) — 9个

| 路由路径 | DB操作 | 风险等级 | 建议优先级 |
|----------|--------|----------|------------|
| `src/app/api/admin/rate-limit/statistics` | ✅ | 🔴 极高 | P0 |
| `src/app/api/feedback/[id]` | ✅ | 🔴 极高 | P0 |
| `src/app/api/ratings/[id]` | ✅ | 🔴 极高 | P0 |
| `src/app/api/tasks` | ✅ | 🔴 极高 | P0 |
| `src/app/api/workflow` | ✅ | 🔴 极高 | P0 |
| `src/app/api/workflow/[id]` | ✅ | 🔴 极高 | P0 |
| `src/app/api/analytics/metrics` | ✅ | 🔴 极高 | P0 |
| `src/app/api/web-vitals` | ✅ | 🔴 极高 | P0 |
| `src/app/api/audit/logs` | ✅ | 🔴 极高 | P0 |

### 🟠 中风险 (无测试，但可能涉及重要业务逻辑) — 64个

| 路由路径 | DB操作 | 风险等级 | 建议优先级 |
|----------|--------|----------|------------|
| `src/app/api/a2a/queue` | ❌ | 🟠 中 | P1 |
| `src/app/api/a2a/registry` | ❌ | 🟠 中 | P1 |
| `src/app/api/a2a/registry/[id]` | ❌ | 🟠 中 | P1 |
| `src/app/api/a2a/registry/[id]/heartbeat` | ❌ | 🟠 中 | P1 |
| `src/app/api/admin/rate-limit/rules` | ❌ | 🟠 中 | P1 |
| `src/app/api/admin/rate-limit/rules/[id]` | ❌ | 🟠 中 | P1 |
| `src/app/api/admin/security/blacklist` | ❌ | 🟠 中 | P1 |
| `src/app/api/auth/audit-logs` | ❌ | 🟠 中 | P1 |
| `src/app/api/auth/token` | ❌ | 🟠 中 | P1 |
| `src/app/api/auth/verify` | ❌ | 🟠 中 | P1 |
| `src/app/api/auth/logout` | ❌ | 🟠 中 | P1 |
| `src/app/api/auth/me` | ❌ | 🟠 中 | P1 |
| `src/app/api/auth/refresh` | ❌ | 🟠 中 | P1 |
| `src/app/api/auth/permissions` | ❌ | 🟠 中 | P1 |
| `src/app/api/csp-violation` | ❌ | 🟡 低 | P2 |
| `src/app/api/demo/task-status` | ❌ | 🟡 低 | P2 |
| `src/app/api/export/async` | ❌ | 🟠 中 | P1 |
| `src/app/api/export/sync` | ❌ | 🟠 中 | P1 |
| `src/app/api/export/jobs` | ❌ | 🟠 中 | P1 |
| `src/app/api/export/jobs/[jobId]` | ❌ | 🟠 中 | P1 |
| `src/app/api/export/jobs/[jobId]/download` | ❌ | 🟠 中 | P1 |
| `src/app/api/github/issues` | ❌ | 🟡 低 | P2 |
| `src/app/api/import` | ❌ | 🟠 中 | P1 |
| `src/app/api/import/[taskId]` | ❌ | 🟠 中 | P1 |
| `src/app/api/import/preview` | ❌ | 🟠 中 | P1 |
| `src/app/api/monitoring/apm` | ❌ | 🟠 中 | P1 |
| `src/app/api/monitoring/realtime` | ❌ | 🟠 中 | P1 |
| `src/app/api/performance/alerts` | ❌ | 🟠 中 | P1 |
| `src/app/api/performance/clear` | ❌ | 🟠 中 | P1 |
| `src/app/api/performance/report` | ❌ | 🟠 中 | P1 |
| `src/app/api/rca/knowledge` | ❌ | 🟠 中 | P1 |
| `src/app/api/reports/custom` | ❌ | 🟠 中 | P1 |
| `src/app/api/reports/generate` | ❌ | 🟠 中 | P1 |
| `src/app/api/reports/templates` | ❌ | 🟠 中 | P1 |
| `src/app/api/search/autocomplete` | ❌ | 🟡 低 | P2 |
| `src/app/api/search/history` | ❌ | 🟡 低 | P2 |
| `src/app/api/search/v2` | ❌ | 🟠 中 | P1 |
| `src/app/api/sentry-test` | ❌ | 🟡 低 | P2 |
| `src/app/api/v1/tenants` | ❌ | 🟠 中 | P1 |
| `src/app/api/v1/tenants/accept` | ❌ | 🟠 中 | P1 |
| `src/app/api/v1/tenants/invite` | ❌ | 🟠 中 | P1 |
| `src/app/api/v1/tenants/login` | ❌ | 🟠 中 | P1 |
| `src/app/api/v1/tenants/switch` | ❌ | 🟠 中 | P1 |
| `src/app/api/v1/tenants/transfer` | ❌ | 🟠 中 | P1 |
| `src/app/api/workflow/[id]/executions` | ❌ | 🟠 中 | P1 |
| `src/app/api/workflow/[id]/executions/[execId]` | ❌ | 🟠 中 | P1 |
| `src/app/api/workflow/[id]/executions/[execId]/cancel` | ❌ | 🟠 中 | P1 |
| `src/app/api/workflow/[id]/history` | ❌ | 🟠 中 | P1 |
| `src/app/api/workflow/[id]/metrics` | ❌ | 🟠 中 | P1 |
| `src/app/api/workflow/[id]/run` | ❌ | 🟠 中 | P1 |
| `src/app/api/workflow/[id]/stream` | ❌ | 🟠 中 | P1 |
| `src/app/api/workflow/[id]/versions` | ❌ | 🟠 中 | P1 |
| `src/app/api/workflow/[id]/versions/[versionId]` | ❌ | 🟠 中 | P1 |
| `src/app/api/workflow/[id]/versions/[versionId]/rollback` | ❌ | 🟠 中 | P1 |
| `src/app/api/workflow/[id]/versions/compare` | ❌ | 🟠 中 | P1 |
| `src/app/api/workflow/[id]/versions/settings` | ❌ | 🟠 中 | P1 |
| `src/app/api/workflow/history/export` | ❌ | 🟠 中 | P1 |
| `src/app/api/audit/export` | ❌ | 🟠 中 | P1 |
| `src/app/api/audit/logs/[id]` | ❌ | 🟠 中 | P1 |
| `src/app/api/rca/analyze/[incidentId]` | ❌ | 🟠 中 | P1 |
| `src/app/api/rca/propagation/[incidentId]` | ❌ | 🟠 中 | P1 |
| `src/app/api/rbac/roles/[roleId]` | ❌ | 🟠 中 | P1 |
| `src/app/api/rbac/roles/[roleId]/permissions` | ❌ | 🟠 中 | P1 |
| `src/app/api/rbac/users/[userId]/permissions` | ❌ | 🟠 中 | P1 |
| `src/app/api/rbac/users/[userId]/roles` | ❌ | 🟠 中 | P1 |

---

## 🚨 高风险详细说明

以下9个路由**同时满足**：(1) 无测试覆盖 (2) 涉及数据库操作

### P0 - 立即需要补充测试

| # | 路由 | 风险说明 |
|---|------|----------|
| 1 | `src/app/api/admin/rate-limit/statistics` | 管理后台限流统计，涉及数据聚合查询 |
| 2 | `src/app/api/feedback/[id]` | 反馈详情，CRUD操作 |
| 3 | `src/app/api/ratings/[id]` | 评分详情端点 |
| 4 | `src/app/api/tasks` | 任务管理核心接口 |
| 5 | `src/app/api/workflow` | 工作流根路由，核心业务 |
| 6 | `src/app/api/workflow/[id]` | 单个工作流CRUD |
| 7 | `src/app/api/analytics/metrics` | 分析指标数据查询 |
| 8 | `src/app/api/web-vitals` | Web性能指标上报 |
| 9 | `src/app/api/audit/logs` | 审计日志查询 |

---

## 📈 分类统计

### 按模块

| 模块 | 总路由 | 已测 | 未测 | 覆盖率 |
|------|--------|------|------|--------|
| auth | 9 | 1 | 8 | 11.1% |
| workflow | 14 | 1 | 13 | 7.1% |
| a2a | 5 | 1 | 4 | 20.0% |
| admin | 4 | 0 | 4 | 0.0% |
| rbac | 8 | 3 | 5 | 37.5% |
| v1/tenants | 6 | 0 | 6 | 0.0% |
| health | 5 | 5 | 0 | 100% |
| export | 6 | 2 | 4 | 33.3% |
| import | 3 | 0 | 3 | 0.0% |
| monitoring | 2 | 0 | 2 | 0.0% |
| performance | 4 | 1 | 3 | 25.0% |
| search | 4 | 1 | 3 | 25.0% |
| database | 2 | 2 | 0 | 100% |
| analytics | 3 | 2 | 1 | 66.7% |
| ratings | 3 | 2 | 1 | 66.7% |
| feedback | 2 | 1 | 1 | 50.0% |
| tasks | 1 | 1 | 0 | 100% |
| github | 2 | 1 | 1 | 50.0% |
| audit | 3 | 0 | 3 | 0.0% |
| rca | 3 | 0 | 3 | 0.0% |
| reports | 3 | 0 | 3 | 0.0% |
| metrics | 2 | 0 | 2 | 0.0% |
| websocket | 0 | 0 | 0 | N/A |
| 其他 (csrf/sentry/csp/demo/vitals等) | 7 | 6 | 1 | 85.7% |

---

## 🎯 建议优先级

### Phase 1 (立即处理 - P0)
为9个高风险路由补充单元测试和集成测试

### Phase 2 (本周内 - P1)
- `src/app/api/auth/*` 全系列 (8个)
- `src/app/api/v1/tenants/*` 全系列 (6个)
- `src/app/api/workflow/[id]/*` 子路由 (13个)
- `src/app/api/audit/*` (3个)
- `src/app/api/rca/*` (3个)

### Phase 3 (本月 - P2)
- 剩余所有未测试路由

---

*报告生成: 2026-04-28 by 测试员子代理*
