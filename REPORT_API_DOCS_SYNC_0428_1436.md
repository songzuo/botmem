# API 文档同步状态审查报告

**审查时间**: 2026-04-28 14:36 GMT+2
**审查人**: 咨询师子代理
**报告文件**: REPORT_API_DOCS_SYNC_0428_1436.md

---

## 📊 审查概述

| 统计项 | 数量 |
|--------|------|
| 代码中的 API 路由总数 | 108 |
| 文档中记录的 API 路由 | ~75 (估算) |
| **已同步到文档** | ~65 |
| **未同步到文档** | 43 |
| **文档有但代码没有** | 35 |
| **同步率** | ~60% |

---

## 🚨 关键发现

### 1. 未同步到文档的 API (代码有，文档无)

以下 43 个 API 端点在代码中存在，但未记录在 `docs/API.md` 中：

#### A2A 通信 API
| 端点 | 说明 | 优先级 |
|------|------|--------|
| `/api/a2a/registry/[id]` | A2A Registry (带ID) | 高 |
| `/api/a2a/registry/[id]/heartbeat` | A2A Registry 心跳 | 高 |

#### Admin 管理 API
| 端点 | 说明 | 优先级 |
|------|------|--------|
| `/api/admin/rate-limit/rules` | 速率限制规则列表 | 中 |
| `/api/admin/rate-limit/rules/[id]` | 速率限制规则 (ID) | 中 |
| `/api/admin/rate-limit/statistics` | 速率限制统计 | 中 |
| `/api/admin/security/blacklist` | 安全黑名单 | 高 |

#### Auth 认证 API
| 端点 | 说明 | 优先级 |
|------|------|--------|
| `/api/auth/audit-logs` | 认证审计日志 | 中 |
| `/api/auth/permissions` | 权限列表 | 中 |
| `/api/auth/token` | Token 管理 | 高 |
| `/api/auth/verify` | 验证 | 高 |

#### Database 数据库 API
| 端点 | 说明 | 优先级 |
|------|------|--------|
| `/api/database/health` | 数据库健康检查 | 高 |
| `/api/database/optimize` | 数据库优化 | 中 |

#### Demo API
| 端点 | 说明 | 优先级 |
|------|------|--------|
| `/api/demo/task-status` | 演示任务状态 | 低 |

#### Export 导出 API
| 端点 | 说明 | 优先级 |
|------|------|--------|
| `/api/export/async` | 异步导出 | 中 |
| `/api/export/jobs` | 导出任务列表 | 中 |
| `/api/export/jobs/[jobId]` | 导出任务 (ID) | 中 |
| `/api/export/jobs/[jobId]/download` | 导出任务下载 | 中 |
| `/api/export/sync` | 同步导出 | 中 |

#### Feedback 反馈 API
| 端点 | 说明 | 优先级 |
|------|------|--------|
| `/api/feedback/[id]` | 反馈详情 (ID) | 低 |

#### Import 导入 API
| 端点 | 说明 | 优先级 |
|------|------|--------|
| `/api/import` | 导入 | 中 |
| `/api/import/[taskId]` | 导入任务 (ID) | 中 |
| `/api/import/preview` | 导入预览 | 中 |

#### Ratings 评分 API
| 端点 | 说明 | 优先级 |
|------|------|--------|
| `/api/ratings/[id]` | 评分详情 (ID) | 低 |
| `/api/ratings/[id]/helpful` | 评分有帮助标记 | 低 |

#### RBAC 权限 API
| 端点 | 说明 | 优先级 |
|------|------|--------|
| `/api/rbac/roles/[roleId]` | 角色详情 (ID) | 高 |
| `/api/rbac/roles/[roleId]/permissions` | 角色权限 | 高 |
| `/api/rbac/users/[userId]/permissions` | 用户权限 | 高 |
| `/api/rbac/users/[userId]/roles` | 用户角色 | 高 |

#### RCA 根因分析 API
| 端点 | 说明 | 优先级 |
|------|------|--------|
| `/api/rca/analyze/[incidentId]` | RCA 分析 (ID) | 中 |
| `/api/rca/propagation/[incidentId]` | RCA 传播分析 | 中 |

#### Reports 报告 API
| 端点 | 说明 | 优先级 |
|------|------|--------|
| `/api/reports/custom` | 自定义报告 | 中 |
| `/api/reports/generate` | 生成报告 | 中 |
| `/api/reports/templates` | 报告模板 | 中 |

#### Search 搜索 API
| 端点 | 说明 | 优先级 |
|------|------|--------|
| `/api/search/v2` | 搜索 v2 | 高 |

#### 其他
| 端点 | 说明 | 优先级 |
|------|------|--------|
| `/api/sentry-test` | Sentry 测试 | 低 |
| `/api/stream/health` | 流健康检查 | 中 |

#### Workflow 工作流 API (最严重)
| 端点 | 说明 | 优先级 |
|------|------|--------|
| `/api/workflow/[id]` | 工作流详情 | **极高** |
| `/api/workflow/[id]/executions` | 工作流执行列表 | **极高** |
| `/api/workflow/[id]/executions/[execId]` | 工作流执行详情 | **极高** |
| `/api/workflow/[id]/executions/[execId]/cancel` | 取消工作流执行 | **极高** |
| `/api/workflow/[id]/history` | 工作流历史 | 高 |
| `/api/workflow/[id]/metrics` | 工作流指标 | 高 |
| `/api/workflow/[id]/run` | 运行工作流 | **极高** |
| `/api/workflow/[id]/stream` | 工作流流式响应 | 高 |
| `/api/workflow/[id]/versions` | 工作流版本列表 | 高 |
| `/api/workflow/[id]/versions/[versionId]` | 工作流版本详情 | 高 |
| `/api/workflow/[id]/versions/[versionId]/rollback` | 回滚工作流版本 | **极高** |
| `/api/workflow/[id]/versions/compare` | 对比工作流版本 | 高 |
| `/api/workflow/[id]/versions/settings` | 工作流版本设置 | 中 |
| `/api/workflow/history/export` | 工作流历史导出 | 中 |

---

### 2. 文档有但代码可能没有的 API (35个)

以下 API 在文档中提及，但实际代码路由可能不存在或路径略有不同：

| 端点 | 可能状态 |
|------|----------|
| `/api/agent-scheduler` | 可能是旧路径或已重构 |
| `/api/agents/discover` | 可能是旧路径 |
| `/api/agents/heartbeat` | 可能是旧路径 |
| `/api/agents/register` | 可能是旧路径 |
| `/api/ai/code/analyze` | 可能是 lib 调用而非 API |
| `/api/ai/code/complete` | 可能是 lib 调用 |
| `/api/ai/code/detect-bugs` | 可能是 lib 调用 |
| `/api/ai/code/explain` | 可能是 lib 调用 |
| `/api/ai/code/review` | 可能是 lib 调用 |
| `/api/ai/code/suggest-fixes` | 可能是 lib 调用 |
| `/api/ai/cost-tracking` | 可能是 lib 调用 |
| `/api/ai/models/status` | 可能是 lib 调用 |
| `/api/ai/route` | 可能是 lib 调用 |
| `/api/automations` | 可能是旧路径 |
| `/api/webhooks` | 可能是未来功能 |
| `/api/webhooks/test` | 可能是未来功能 |
| `/api/websocket` | 可能是 WebSocket API 引用 |
| `/api/search/advanced` | 可能是 search/v2 的别名 |
| `/api/rate-limit/*` | 多个变体可能是旧实现 |

---

## 📅 最近更新的 API 路由 (按修改时间)

根据 `ls -la` 排序，最近修改的 API 文件：

| 日期 | 文件 | 说明 |
|------|------|------|
| 2026-04-28 | `feedback/route.ts` | 反馈系统 |
| 2026-04-19 | `search/route.ts` | 搜索 API |
| 2026-04-19 | `search/history/route.ts` | 搜索历史 |
| 2026-04-19 | `search/autocomplete/route.ts` | 搜索自动完成 |
| 2026-04-18 | `analytics/export/route.ts` | 分析导出 |
| 2026-04-14 | `revalidate/route.ts` | 缓存重验证 |
| 2026-04-06 | `health/route.ts` | 健康检查 |
| 2026-04-05 | `database/optimize/route.ts` | 数据库优化 |
| 2026-04-05 | `admin/rate-limit/*` | 速率限制管理 |

**特别注意**: `feedback/route.ts` (17KB) 在 4 月 28 日被大量更新，需要确认是否已同步到文档。

---

## 🔍 同步建议

### P0 - 紧急 (应立即同步)

1. **Workflow API 族** (14 个端点)
   - 这些是核心功能端点，完全未同步
   - 影响所有使用工作流的用户
   - 建议：优先补充完整的工作流 API 文档

2. **RBAC API 族** (4 个端点)
   - `/api/rbac/roles/[roleId]`
   - `/api/rbac/roles/[roleId]/permissions`
   - `/api/rbac/users/[userId]/permissions`
   - `/api/rbac/users/[userId]/roles`
   - 影响权限管理功能

3. **认证 API**
   - `/api/auth/token`
   - `/api/auth/verify`
   - `/api/auth/permissions`
   - 核心安全功能

### P1 - 高优先级

4. **A2A Registry API** (2 个端点)
   - Agent 间通信核心功能

5. **Admin 管理 API** (4 个端点)
   - 速率限制和黑名单管理

6. **Search v2 API**
   - 新版本搜索功能

7. **Database API** (2 个端点)
   - 健康检查和优化

### P2 - 中优先级

8. **Export/Import API 族** (8 个端点)
   - 数据导入导出功能

9. **Reports API** (3 个端点)
   - 报告生成功能

10. **RCA API** (2 个端点)
    - 根因分析功能

### P3 - 低优先级

11. Demo、Sentry-test 等辅助功能

---

## 📋 行动项

- [ ] **咨询师**: 整理未同步的 API 完整列表，发送给架构师
- [ ] **架构师**: 审查并确认每个 API 的优先级和必要性
- [ ] **Executor**: 根据优先级逐步补充文档
- [ ] **测试员**: 验证补充的文档与实际 API 行为一致

---

## 📎 附件：完整 API 路由清单

### 代码中存在的 108 个 API 路由

```
a2a/jsonrpc
a2a/queue
a2a/registry
a2a/registry/[id]
a2a/registry/[id]/heartbeat
admin/rate-limit/rules
admin/rate-limit/rules/[id]
admin/rate-limit/statistics
admin/security/blacklist
analytics/export
analytics/metrics
audit/export
audit/logs
audit/logs/[id]
auth/audit-logs
auth/login
auth/logout
auth/me
auth/permissions
auth/refresh
auth/register
auth/token
auth/verify
csp-violation
csrf-token
data/export
data/import
database/health
database/optimize
demo/task-status
export/async
export/jobs
export/jobs/[jobId]
export/jobs/[jobId]/download
export/sync
feedback
feedback/[id]
github/commits
github/issues
health
health/detailed
health/live
health/ready
import
import/[taskId]
import/preview
metrics/performance
metrics/prometheus
monitoring/apm
monitoring/realtime
multimodal/audio
multimodal/image
performance/alerts
performance/clear
performance/metrics
performance/report
projects
rate-limit
ratings
ratings/[id]
ratings/[id]/helpful
rbac/permissions
rbac/roles
rbac/roles/[roleId]
rbac/roles/[roleId]/permissions
rbac/system
rbac/users/[userId]/permissions
rbac/users/[userId]/roles
rca/analyze/[incidentId]
rca/knowledge
rca/propagation/[incidentId]
reports/custom
reports/generate
reports/templates
revalidate
search
search/autocomplete
search/history
search/v2
sentry-test
status
stream/analytics
stream/health
tasks
user/preferences
v1/tenants
v1/tenants/accept
v1/tenants/invite
v1/tenants/login
v1/tenants/switch
v1/tenants/transfer
vitals
web-vitals
workflow
workflow/[id]
workflow/[id]/executions
workflow/[id]/executions/[execId]
workflow/[id]/executions/[execId]/cancel
workflow/[id]/history
workflow/[id]/metrics
workflow/[id]/run
workflow/[id]/stream
workflow/[id]/versions
workflow/[id]/versions/[versionId]
workflow/[id]/versions/[versionId]/rollback
workflow/[id]/versions/compare
workflow/[id]/versions/settings
workflow/history/export
```

---

**报告结束**
