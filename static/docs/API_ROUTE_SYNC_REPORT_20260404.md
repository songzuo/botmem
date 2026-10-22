# API 路由文档同步报告

**生成时间**: 2026-04-04T00:09:08.561Z
**扫描目录**: ./src/app/api
**路由总数**: 97

## 📊 统计信息

| 指标 | 数量 |
|------|------|
| **总路由数** | 97 |
| **有 OpenAPI 注释** | 6 |
| **有 JSDoc 注释** | 29 |
| **无任何文档** | 68 |

### HTTP 方法统计

| 方法 | 数量 |
|------|------|
| GET | 75 |
| POST | 58 |
| PUT | 9 |
| PATCH | 2 |
| DELETE | 20 |
| HEAD | 2 |
| OPTIONS | 1 |

## 📋 完整 API 端点列表

### /api/a2a/jsonrpc

- **方法**: POST, OPTIONS
- **文件**: `src/app/api/a2a/jsonrpc/route.ts`
- **代码行数**: 246
- **OpenAPI**: ❌
- **JSDoc**: ✅

### /api/a2a/queue

- **方法**: GET, POST, DELETE
- **文件**: `src/app/api/a2a/queue/route.ts`
- **代码行数**: 161
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/a2a/registry

- **方法**: GET, POST
- **文件**: `src/app/api/a2a/registry/route.ts`
- **代码行数**: 99
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/a2a/registry/[id]

- **方法**: GET, PUT, PATCH, DELETE
- **文件**: `src/app/api/a2a/registry/[id]/route.ts`
- **代码行数**: 129
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/a2a/registry/[id]/heartbeat

- **方法**: POST
- **文件**: `src/app/api/a2a/registry/[id]/heartbeat/route.ts`
- **代码行数**: 73
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/analytics/export

- **方法**: GET, POST
- **文件**: `src/app/api/analytics/export/route.ts`
- **代码行数**: 291
- **OpenAPI**: ❌
- **JSDoc**: ✅

### /api/analytics/metrics

- **方法**: GET, POST
- **文件**: `src/app/api/analytics/metrics/route.ts`
- **代码行数**: 430
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/auth/audit-logs

- **方法**: GET
- **文件**: `src/app/api/auth/audit-logs/route.ts`
- **代码行数**: 164
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/auth/login

- **方法**: POST
- **文件**: `src/app/api/auth/login/route.ts`
- **代码行数**: 208
- **OpenAPI**: ✅
- **JSDoc**: ✅

### /api/auth/logout

- **方法**: POST
- **文件**: `src/app/api/auth/logout/route.ts`
- **代码行数**: 41
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/auth/me

- **方法**: GET
- **文件**: `src/app/api/auth/me/route.ts`
- **代码行数**: 39
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/auth/permissions

- **方法**: GET
- **文件**: `src/app/api/auth/permissions/route.ts`
- **代码行数**: 159
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/auth/refresh

- **方法**: POST
- **文件**: `src/app/api/auth/refresh/route.ts`
- **代码行数**: 68
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/auth/register

- **方法**: POST
- **文件**: `src/app/api/auth/register/route.ts`
- **代码行数**: 235
- **OpenAPI**: ✅
- **JSDoc**: ✅

### /api/auth/token

- **方法**: POST
- **文件**: `src/app/api/auth/token/route.ts`
- **代码行数**: 214
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/auth/verify

- **方法**: GET
- **文件**: `src/app/api/auth/verify/route.ts`
- **代码行数**: 158
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/csp-violation

- **方法**: GET, POST
- **文件**: `src/app/api/csp-violation/route.ts`
- **代码行数**: 62
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/csrf-token

- **方法**: GET, POST
- **文件**: `src/app/api/csrf-token/route.ts`
- **代码行数**: 167
- **OpenAPI**: ❌
- **JSDoc**: ✅

### /api/data/export

- **方法**: GET, POST
- **文件**: `src/app/api/data/export/route.ts`
- **代码行数**: 146
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/data/import

- **方法**: GET, POST
- **文件**: `src/app/api/data/import/route.ts`
- **代码行数**: 261
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/database/health

- **方法**: 未知
- **文件**: `src/app/api/database/health/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/database/optimize

- **方法**: GET, POST, PUT
- **文件**: `src/app/api/database/optimize/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/demo/task-status

- **方法**: GET, POST
- **文件**: `src/app/api/demo/task-status/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/export/async

- **方法**: POST
- **文件**: `src/app/api/export/async/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/export/jobs

- **方法**: GET, POST
- **文件**: `src/app/api/export/jobs/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/export/jobs/[jobId]

- **方法**: GET, DELETE
- **文件**: `src/app/api/export/jobs/[jobId]/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/export/jobs/[jobId]/download

- **方法**: GET
- **文件**: `src/app/api/export/jobs/[jobId]/download/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/export/sync

- **方法**: POST
- **文件**: `src/app/api/export/sync/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/feedback

- **方法**: GET, POST
- **文件**: `src/app/api/feedback/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/feedback/[id]

- **方法**: GET, PATCH, DELETE
- **文件**: `src/app/api/feedback/[id]/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/github/commits

- **方法**: GET
- **文件**: `src/app/api/github/commits/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/github/issues

- **方法**: GET
- **文件**: `src/app/api/github/issues/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/health

- **方法**: GET
- **文件**: `src/app/api/health/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/health/detailed

- **方法**: GET
- **文件**: `src/app/api/health/detailed/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/health/live

- **方法**: GET
- **文件**: `src/app/api/health/live/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/health/ready

- **方法**: GET
- **文件**: `src/app/api/health/ready/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/import

- **方法**: GET, POST
- **文件**: `src/app/api/import/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/import/[taskId]

- **方法**: GET, DELETE
- **文件**: `src/app/api/import/[taskId]/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/import/preview

- **方法**: POST
- **文件**: `src/app/api/import/preview/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/metrics/performance

- **方法**: GET
- **文件**: `src/app/api/metrics/performance/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/metrics/prometheus

- **方法**: GET
- **文件**: `src/app/api/metrics/prometheus/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/monitoring/apm

- **方法**: GET
- **文件**: `src/app/api/monitoring/apm/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/multimodal/audio

- **方法**: POST
- **文件**: `src/app/api/multimodal/audio/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/multimodal/image

- **方法**: POST
- **文件**: `src/app/api/multimodal/image/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/performance/alerts

- **方法**: GET, POST, PUT, DELETE
- **文件**: `src/app/api/performance/alerts/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/performance/clear

- **方法**: POST
- **文件**: `src/app/api/performance/clear/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/performance/metrics

- **方法**: GET
- **文件**: `src/app/api/performance/metrics/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/performance/report

- **方法**: GET
- **文件**: `src/app/api/performance/report/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/projects

- **方法**: GET, POST
- **文件**: `src/app/api/projects/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/rate-limit

- **方法**: GET
- **文件**: `src/app/api/rate-limit/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/ratings

- **方法**: GET, POST
- **文件**: `src/app/api/ratings/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/ratings/[id]

- **方法**: GET, DELETE
- **文件**: `src/app/api/ratings/[id]/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/ratings/[id]/helpful

- **方法**: POST
- **文件**: `src/app/api/ratings/[id]/helpful/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/rbac/permissions

- **方法**: GET
- **文件**: `src/app/api/rbac/permissions/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/rbac/roles

- **方法**: GET, POST
- **文件**: `src/app/api/rbac/roles/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/rbac/roles/[roleId]

- **方法**: GET, PUT, DELETE
- **文件**: `src/app/api/rbac/roles/[roleId]/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/rbac/roles/[roleId]/permissions

- **方法**: GET, PUT
- **文件**: `src/app/api/rbac/roles/[roleId]/permissions/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/rbac/system

- **方法**: GET
- **文件**: `src/app/api/rbac/system/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/rbac/users/[userId]/permissions

- **方法**: GET
- **文件**: `src/app/api/rbac/users/[userId]/permissions/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/rbac/users/[userId]/roles

- **方法**: GET, POST, DELETE
- **文件**: `src/app/api/rbac/users/[userId]/roles/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/rca/analyze/[incidentId]

- **方法**: GET, POST
- **文件**: `src/app/api/rca/analyze/[incidentId]/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/rca/knowledge

- **方法**: GET, POST, PUT
- **文件**: `src/app/api/rca/knowledge/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/rca/propagation/[incidentId]

- **方法**: GET, POST
- **文件**: `src/app/api/rca/propagation/[incidentId]/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/reports/custom

- **方法**: GET, POST
- **文件**: `src/app/api/reports/custom/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/reports/generate

- **方法**: POST
- **文件**: `src/app/api/reports/generate/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/reports/templates

- **方法**: GET, POST
- **文件**: `src/app/api/reports/templates/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/revalidate

- **方法**: POST
- **文件**: `src/app/api/revalidate/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/search

- **方法**: GET
- **文件**: `src/app/api/search/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/search/autocomplete

- **方法**: GET
- **文件**: `src/app/api/search/autocomplete/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/search/history

- **方法**: GET
- **文件**: `src/app/api/search/history/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/sentry-test

- **方法**: GET
- **文件**: `src/app/api/sentry-test/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/status

- **方法**: GET
- **文件**: `src/app/api/status/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/stream/analytics

- **方法**: GET
- **文件**: `src/app/api/stream/analytics/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/stream/health

- **方法**: GET
- **文件**: `src/app/api/stream/health/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/tasks

- **方法**: GET, POST
- **文件**: `src/app/api/tasks/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/user/preferences

- **方法**: GET, POST, PUT
- **文件**: `src/app/api/user/preferences/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/v1/tenants

- **方法**: GET, POST
- **文件**: `src/app/api/v1/tenants/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/v1/tenants/accept

- **方法**: POST
- **文件**: `src/app/api/v1/tenants/accept/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/v1/tenants/invite

- **方法**: POST
- **文件**: `src/app/api/v1/tenants/invite/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/v1/tenants/login

- **方法**: POST
- **文件**: `src/app/api/v1/tenants/login/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/v1/tenants/switch

- **方法**: POST
- **文件**: `src/app/api/v1/tenants/switch/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/v1/tenants/transfer

- **方法**: POST
- **文件**: `src/app/api/v1/tenants/transfer/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/vitals

- **方法**: GET, POST
- **文件**: `src/app/api/vitals/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/web-vitals

- **方法**: GET, POST
- **文件**: `src/app/api/web-vitals/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/websocket

- **方法**: GET
- **文件**: `src/app/api/websocket/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/workflow

- **方法**: GET, POST
- **文件**: `src/app/api/workflow/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/workflow/[id]

- **方法**: GET, PUT, DELETE
- **文件**: `src/app/api/workflow/[id]/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/workflow/[id]/executions

- **方法**: GET
- **文件**: `src/app/api/workflow/[id]/executions/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/workflow/[id]/executions/[execId]

- **方法**: GET
- **文件**: `src/app/api/workflow/[id]/executions/[execId]/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/workflow/[id]/executions/[execId]/cancel

- **方法**: POST
- **文件**: `src/app/api/workflow/[id]/executions/[execId]/cancel/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/workflow/[id]/metrics

- **方法**: GET
- **文件**: `src/app/api/workflow/[id]/metrics/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/workflow/[id]/run

- **方法**: POST
- **文件**: `src/app/api/workflow/[id]/run/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/workflow/[id]/stream

- **方法**: GET
- **文件**: `src/app/api/workflow/[id]/stream/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/workflow/[id]/versions

- **方法**: GET, POST
- **文件**: `src/app/api/workflow/[id]/versions/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/workflow/[id]/versions/[versionId]

- **方法**: GET, DELETE
- **文件**: `src/app/api/workflow/[id]/versions/[versionId]/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/workflow/[id]/versions/compare

- **方法**: GET
- **文件**: `src/app/api/workflow/[id]/versions/compare/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/workflow/[id]/versions/settings

- **方法**: GET, PUT
- **文件**: `src/app/api/workflow/[id]/versions/settings/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

### /api/workflow/[id]/versions/[versionId]/rollback

- **方法**: POST
- **文件**: `src/app/api/workflow/[id]/versions/[versionId]/rollback/route.ts`
- **代码行数**: 266
- **OpenAPI**: ❌
- **JSDoc**: ❌

## 🔍 需要改进的路由

### 缺少文档注释的路由 (68个)

- /api/a2a/queue (GET, POST, DELETE)
- /api/a2a/registry (GET, POST)
- /api/a2a/registry/[id] (GET, PUT, PATCH, DELETE)
- /api/a2a/registry/[id]/heartbeat (POST)
- /api/analytics/metrics (GET, POST)
- /api/auth/audit-logs (GET)
- /api/auth/logout (POST)
- /api/auth/me (GET)
- /api/auth/permissions (GET)
- /api/auth/refresh (POST)
- /api/auth/token (POST)
- /api/auth/verify (GET)
- /api/csp-violation (GET, POST)
- /api/data/export (GET, POST)
- /api/data/import (GET, POST)
- /api/database/health (未知)
- /api/database/optimize (GET, POST, PUT)
- /api/demo/task-status (GET, POST)
- /api/export/async (POST)
- /api/export/jobs (GET, POST)
- /api/export/jobs/[jobId] (GET, DELETE)
- /api/export/jobs/[jobId]/download (GET)
- /api/export/sync (POST)
- /api/feedback (GET, POST)
- /api/feedback/[id] (GET, PATCH, DELETE)
- /api/github/commits (GET)
- /api/github/issues (GET)
- /api/health (GET)
- /api/health/detailed (GET)
- /api/health/live (GET)
- /api/health/ready (GET)
- /api/import (GET, POST)
- /api/import/[taskId] (GET, DELETE)
- /api/import/preview (POST)
- /api/metrics/performance (GET)
- /api/metrics/prometheus (GET)
- /api/monitoring/apm (GET)
- /api/multimodal/audio (POST)
- /api/multimodal/image (POST)
- /api/performance/alerts (GET, POST, PUT, DELETE)
- /api/performance/clear (POST)
- /api/performance/metrics (GET)
- /api/performance/report (GET)
- /api/projects (GET, POST)
- /api/rate-limit (GET)
- /api/ratings (GET, POST)
- /api/ratings/[id] (GET, DELETE)
- /api/ratings/[id]/helpful (POST)
- /api/rbac/permissions (GET)
- /api/rbac/roles (GET, POST)
- /api/rbac/roles/[roleId] (GET, PUT, DELETE)
- /api/rbac/roles/[roleId]/permissions (GET, PUT)
- /api/rbac/system (GET)
- /api/rbac/users/[userId]/permissions (GET)
- /api/rbac/users/[userId]/roles (GET, POST, DELETE)
- /api/rca/analyze/[incidentId] (GET, POST)
- /api/rca/knowledge (GET, POST, PUT)
- /api/rca/propagation/[incidentId] (GET, POST)
- /api/reports/custom (GET, POST)
- /api/reports/generate (POST)
- /api/reports/templates (GET, POST)
- /api/revalidate (POST)
- /api/search (GET)
- /api/search/autocomplete (GET)
- /api/search/history (GET)
- /api/sentry-test (GET)
- /api/status (GET)
- /api/stream/analytics (GET)
- /api/stream/health (GET)
- /api/tasks (GET, POST)
- /api/user/preferences (GET, POST, PUT)
- /api/v1/tenants (GET, POST)
- /api/v1/tenants/accept (POST)
- /api/v1/tenants/invite (POST)
- /api/v1/tenants/login (POST)
- /api/v1/tenants/switch (POST)
- /api/v1/tenants/transfer (POST)
- /api/vitals (GET, POST)
- /api/web-vitals (GET, POST)
- /api/websocket (GET)
- /api/workflow (GET, POST)
- /api/workflow/[id] (GET, PUT, DELETE)
- /api/workflow/[id]/executions (GET)
- /api/workflow/[id]/executions/[execId] (GET)
- /api/workflow/[id]/executions/[execId]/cancel (POST)
- /api/workflow/[id]/metrics (GET)
- /api/workflow/[id]/run (POST)
- /api/workflow/[id]/stream (GET)
- /api/workflow/[id]/versions (GET, POST)
- /api/workflow/[id]/versions/[versionId] (GET, DELETE)
- /api/workflow/[id]/versions/compare (GET)
- /api/workflow/[id]/versions/settings (GET, PUT)
- /api/workflow/[id]/versions/[versionId]/rollback (POST)

### 缺少 OpenAPI 注释的路由 (91个)

- /api/a2a/jsonrpc (POST, OPTIONS)
- /api/a2a/queue (GET, POST, DELETE)
- /api/a2a/registry (GET, POST)
- /api/a2a/registry/[id] (GET, PUT, PATCH, DELETE)
- /api/a2a/registry/[id]/heartbeat (POST)
- /api/analytics/export (GET, POST)
- /api/analytics/metrics (GET, POST)
- /api/auth/audit-logs (GET)
- /api/auth/logout (POST)
- /api/auth/me (GET)
- /api/auth/permissions (GET)
- /api/auth/refresh (POST)
- /api/auth/token (POST)
- /api/auth/verify (GET)
- /api/csp-violation (GET, POST)
- /api/csrf-token (GET, POST)
- /api/data/export (GET, POST)
- /api/data/import (GET, POST)
- /api/database/health (未知)
- /api/database/optimize (GET, POST, PUT)
- /api/demo/task-status (GET, POST)
- /api/export/async (POST)
- /api/export/jobs (GET, POST)
- /api/export/jobs/[jobId] (GET, DELETE)
- /api/export/jobs/[jobId]/download (GET)
- /api/export/sync (POST)
- /api/feedback (GET, POST)
- /api/feedback/[id] (GET, PATCH, DELETE)
- /api/github/commits (GET)
- /api/github/issues (GET)
- /api/health (GET)
- /api/health/detailed (GET)
- /api/health/live (GET)
- /api/health/ready (GET)
- /api/import (GET, POST)
- /api/import/[taskId] (GET, DELETE)
- /api/import/preview (POST)
- /api/metrics/performance (GET)
- /api/metrics/prometheus (GET)
- /api/monitoring/apm (GET)
- /api/multimodal/audio (POST)
- /api/multimodal/image (POST)
- /api/performance/alerts (GET, POST, PUT, DELETE)
- /api/performance/clear (POST)
- /api/performance/metrics (GET)
- /api/performance/report (GET)
- /api/projects (GET, POST)
- /api/rate-limit (GET)
- /api/ratings (GET, POST)
- /api/ratings/[id] (GET, DELETE)
- /api/ratings/[id]/helpful (POST)
- /api/rbac/permissions (GET)
- /api/rbac/roles (GET, POST)
- /api/rbac/roles/[roleId] (GET, PUT, DELETE)
- /api/rbac/roles/[roleId]/permissions (GET, PUT)
- /api/rbac/system (GET)
- /api/rbac/users/[userId]/permissions (GET)
- /api/rbac/users/[userId]/roles (GET, POST, DELETE)
- /api/rca/analyze/[incidentId] (GET, POST)
- /api/rca/knowledge (GET, POST, PUT)
- /api/rca/propagation/[incidentId] (GET, POST)
- /api/reports/custom (GET, POST)
- /api/reports/generate (POST)
- /api/reports/templates (GET, POST)
- /api/revalidate (POST)
- /api/search (GET)
- /api/search/autocomplete (GET)
- /api/search/history (GET)
- /api/sentry-test (GET)
- /api/status (GET)
- /api/stream/analytics (GET)
- /api/stream/health (GET)
- /api/tasks (GET, POST)
- /api/user/preferences (GET, POST, PUT)
- /api/v1/tenants (GET, POST)
- /api/v1/tenants/accept (POST)
- /api/v1/tenants/invite (POST)
- /api/v1/tenants/login (POST)
- /api/v1/tenants/switch (POST)
- /api/v1/tenants/transfer (POST)
- /api/vitals (GET, POST)
- /api/web-vitals (GET, POST)
- /api/websocket (GET)
- /api/workflow (GET, POST)
- /api/workflow/[id] (GET, PUT, DELETE)
- /api/workflow/[id]/executions (GET)
- /api/workflow/[id]/executions/[execId] (GET)
- /api/workflow/[id]/executions/[execId]/cancel (POST)
- /api/workflow/[id]/metrics (GET)
- /api/workflow/[id]/run (POST)
- /api/workflow/[id]/stream (GET)
- /api/workflow/[id]/versions (GET, POST)
- /api/workflow/[id]/versions/[versionId] (GET, DELETE)
- /api/workflow/[id]/versions/compare (GET)
- /api/workflow/[id]/versions/settings (GET, PUT)
- /api/workflow/[id]/versions/[versionId]/rollback (POST)

## 📂 按模块分类

### /a2a (5 个端点)

- POST, OPTIONS /api/a2a/jsonrpc
- GET, POST, DELETE /api/a2a/queue
- GET, POST /api/a2a/registry
- GET, PUT, PATCH, DELETE /api/a2a/registry/[id]
- POST /api/a2a/registry/[id]/heartbeat

### /analytics (2 个端点)

- GET, POST /api/analytics/export
- GET, POST /api/analytics/metrics

### /auth (9 个端点)

- GET /api/auth/audit-logs
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- GET /api/auth/permissions
- POST /api/auth/refresh
- POST /api/auth/register
- POST /api/auth/token
- GET /api/auth/verify

### /csp-violation (1 个端点)

- GET, POST /api/csp-violation

### /csrf-token (1 个端点)

- GET, POST /api/csrf-token

### /data (2 个端点)

- GET, POST /api/data/export
- GET, POST /api/data/import

### /database (2 个端点)

- 未知 /api/database/health
- GET, POST, PUT /api/database/optimize

### /demo (1 个端点)

- GET, POST /api/demo/task-status

### /export (5 个端点)

- POST /api/export/async
- GET, POST /api/export/jobs
- GET, DELETE /api/export/jobs/[jobId]
- GET /api/export/jobs/[jobId]/download
- POST /api/export/sync

### /feedback (2 个端点)

- GET, POST /api/feedback
- GET, PATCH, DELETE /api/feedback/[id]

### /github (2 个端点)

- GET /api/github/commits
- GET /api/github/issues

### /health (4 个端点)

- GET /api/health
- GET /api/health/detailed
- GET /api/health/live
- GET /api/health/ready

### /import (3 个端点)

- GET, POST /api/import
- GET, DELETE /api/import/[taskId]
- POST /api/import/preview

### /metrics (2 个端点)

- GET /api/metrics/performance
- GET /api/metrics/prometheus

### /monitoring (1 个端点)

- GET /api/monitoring/apm

### /multimodal (2 个端点)

- POST /api/multimodal/audio
- POST /api/multimodal/image

### /performance (4 个端点)

- GET, POST, PUT, DELETE /api/performance/alerts
- POST /api/performance/clear
- GET /api/performance/metrics
- GET /api/performance/report

### /projects (1 个端点)

- GET, POST /api/projects

### /rate-limit (1 个端点)

- GET /api/rate-limit

### /ratings (3 个端点)

- GET, POST /api/ratings
- GET, DELETE /api/ratings/[id]
- POST /api/ratings/[id]/helpful

### /rbac (8 个端点)

- GET /api/rbac/permissions
- GET, POST /api/rbac/roles
- GET, PUT, DELETE /api/rbac/roles/[roleId]
- GET, PUT /api/rbac/roles/[roleId]/permissions
- GET /api/rbac/system
- GET /api/rbac/users/[userId]/permissions
- GET, POST, DELETE /api/rbac/users/[userId]/roles

### /rca (3 个端点)

- GET, POST /api/rca/analyze/[incidentId]
- GET, POST, PUT /api/rca/knowledge
- GET, POST /api/rca/propagation/[incidentId]

### /reports (3 个端点)

- GET, POST /api/reports/custom
- POST /api/reports/generate
- GET, POST /api/reports/templates

### /revalidate (1 个端点)

- POST /api/revalidate

### /search (3 个端点)

- GET /api/search
- GET /api/search/autocomplete
- GET /api/search/history

### /sentry-test (1 个端点)

- GET /api/sentry-test

### /status (1 个端点)

- GET /api/status

### /stream (2 个端点)

- GET /api/stream/analytics
- GET /api/stream/health

### /tasks (1 个端点)

- GET, POST /api/tasks

### /user (1 个端点)

- GET, POST, PUT /api/user/preferences

### /v1 (6 个端点)

- GET, POST /api/v1/tenants
- POST /api/v1/tenants/accept
- POST /api/v1/tenants/invite
- POST /api/v1/tenants/login
- POST /api/v1/tenants/switch
- POST /api/v1/tenants/transfer

### /vitals (1 个端点)

- GET, POST /api/vitals

### /web-vitals (1 个端点)

- GET, POST /api/web-vitals

### /websocket (1 个端点)

- GET /api/websocket

### /workflow (13 个端点)

- GET, POST /api/workflow
- GET, PUT, DELETE /api/workflow/[id]
- GET /api/workflow/[id]/executions
- GET /api/workflow/[id]/executions/[execId]
- POST /api/workflow/[id]/executions/[execId]/cancel
- GET /api/workflow/[id]/metrics
- POST /api/workflow/[id]/run
- GET /api/workflow/[id]/stream
- GET, POST /api/workflow/[id]/versions
- GET, DELETE /api/workflow/[id]/versions/[versionId]
- GET /api/workflow/[id]/versions/compare
- GET, PUT /api/workflow/[id]/versions/settings
- POST /api/workflow/[id]/versions/[versionId]/rollback

---

**建议**:
1. 为所有缺少文档的路由添加 JSDoc 注释
2. 为核心 API 添加完整的 OpenAPI 规范
3. 统一使用 TypeScript 类型定义
4. 定期运行此脚本检查文档完整性