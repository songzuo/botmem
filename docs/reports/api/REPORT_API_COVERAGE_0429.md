# API 覆盖率报告 - 2026-04-29

**审查时间**: 2026-04-29
**文档版本**: v1.12.2 (最后更新 2026-04-05)
**实际代码版本**: 可能高于文档

---

## 已文档化的 API (约 145 个端点)

### 认证与授权 (9)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/me` | GET | 获取当前用户 |
| `/api/auth/refresh` | POST | 刷新 Token |
| `/api/auth/logout` | POST | 登出 |
| `/api/auth/token` | POST | 获取访问令牌 (OAuth) |
| `/api/auth/verify` | GET | 验证令牌 |
| `/api/auth/permissions` | GET | 获取用户权限 |
| `/api/auth/audit-logs` | GET | 审计日志查询 |

### 多租户 (12)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/v1/tenants` | GET | 列出租户 |
| `/api/v1/tenants` | POST | 创建租户 |
| `/api/v1/tenants/[id]` | GET | 获取租户信息 |
| `/api/v1/tenants/[id]` | PUT | 更新租户 |
| `/api/v1/tenants/[id]` | DELETE | 删除租户 |
| `/api/v1/tenants/[id]/stats` | GET | 租户统计 |
| `/api/v1/tenants/[id]/quota` | GET | 租户配额 |
| `/api/v1/tenants/login` | POST | 租户登录 |
| `/api/v1/tenants/switch` | POST | 切换租户 |
| `/api/v1/tenants/invite` | POST | 邀请成员 |
| `/api/v1/tenants/accept` | POST | 接受邀请 |
| `/api/v1/tenants/transfer` | POST | 转让租户 |

### 任务管理 (4)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/tasks` | GET | 获取任务列表 |
| `/api/tasks` | POST | 创建任务 |
| `/api/tasks/:id` | PUT | 更新任务 |
| `/api/tasks/:id` | DELETE | 删除任务 |

### 项目管理 (1)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/projects` | GET/POST | 项目管理 |

### 性能监控 (7)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/performance/metrics` | GET | 性能指标 |
| `/api/performance/report` | GET | 性能报告 |
| `/api/performance/alerts` | GET/POST/PUT/DELETE | 告警规则管理 |
| `/api/performance/clear` | POST | 清除性能数据 |

### 分析 (3)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/analytics/metrics` | GET | 分析指标 |
| `/api/analytics/export` | POST | 导出分析 |
| `/api/stream/analytics` | GET | 实时分析流 |

### 搜索 (4)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/search` | GET | 搜索 |
| `/api/search/autocomplete` | GET | 自动完成 |
| `/api/search/history` | GET | 搜索历史 |
| `/api/search/v2` | GET | 高级搜索 (v2) |

### RBAC (8)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/rbac/system` | GET | 系统状态 |
| `/api/rbac/roles` | GET/POST | 角色管理 |
| `/api/rbac/roles/[roleId]` | GET/PUT/DELETE | 角色 CRUD |
| `/api/rbac/roles/[roleId]/permissions` | GET/PUT | 角色权限 |
| `/api/rbac/permissions` | GET | 权限管理 |
| `/api/rbac/users/[userId]/roles` | GET/POST/DELETE | 用户角色 |
| `/api/rbac/users/[userId]/permissions` | GET | 用户权限 |

### 多模态 (2)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/multimodal/image` | POST | 图像处理 |
| `/api/multimodal/audio` | POST | 音频处理 |

### A2A 通信 (7)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/a2a/jsonrpc` | POST | JSON-RPC 调用 |
| `/api/a2a/registry` | GET/POST | Agent 注册表 |
| `/api/a2a/registry/[id]` | GET/PUT/DELETE | 单个 Agent |
| `/api/a2a/registry/[id]/heartbeat` | POST | 心跳检测 |
| `/api/a2a/queue` | GET/POST/DELETE | 任务队列 |

### 评分 (5)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/ratings` | GET/POST | 评分列表/创建 |
| `/api/ratings/[id]` | GET/DELETE | 单个评分 |
| `/api/ratings/[id]/helpful` | POST | 标记有帮助 |

### 反馈 (4)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/feedback` | GET/POST | 反馈列表/提交 |
| `/api/feedback/[id]` | GET/PATCH/DELETE | 单个反馈 |

### 用户偏好 (3)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/user/preferences` | GET/POST/PUT | 用户偏好设置 |

### Web Vitals (2)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/web-vitals` | GET/POST | Web Vitals 数据 |

### GitHub 集成 (2)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/github/issues` | GET | 获取 Issues |
| `/api/github/commits` | GET | 获取 Commits |

### 健康检查 (6)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 系统健康 |
| `/api/health/detailed` | GET | 详细健康 |
| `/api/health/live` | GET | 存活检查 |
| `/api/health/ready` | GET | 就绪检查 |
| `/api/stream/health` | GET | 实时健康流 |
| `/api/database/health` | GET | 数据库健康 |

### 工作流编排 (约 15)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/workflow` | GET/POST | 工作流列表/创建 |
| `/api/workflow/:id` | GET/PUT/DELETE | 工作流 CRUD |
| `/api/workflow/:id/run` | POST | 运行工作流 |
| `/api/workflow/:id/executions` | GET | 运行历史 |
| `/api/workflow/:id/executions/[execId]` | GET | 执行详情 |
| `/api/workflow/:id/executions/[execId]/cancel` | POST | 取消执行 |
| `/api/workflow/:id/stream` | GET | SSE 实时流 |
| `/api/workflow/:id/metrics` | GET | 性能指标 |
| `/api/workflow/:id/history` | GET | 执行历史 |
| `/api/workflow/history/export` | GET | 历史导出 |

### 工作流版本管理 (8)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/workflow/:id/versions` | GET/POST | 版本列表/创建 |
| `/api/workflow/:id/versions/:versionId` | GET | 特定版本 |
| `/api/workflow/:id/versions/compare` | GET | 版本对比 |
| `/api/workflow/:id/versions/:versionId/rollback` | POST | 版本回滚 |
| `/api/workflow/:id/versions/settings` | GET/PUT | 版本设置 |

### RCA 根因分析 (4)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/rca/analyze/:incidentId` | GET/POST | 事件分析 |
| `/api/rca/knowledge` | GET/POST/PUT | 知识库 |
| `/api/rca/propagation/:incidentId` | GET/POST | 传播链分析 |

### 监控 (3)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/monitoring/apm` | GET | APM 状态 |
| `/api/monitoring/realtime` | GET | 实时监控流 |

### 其他 (约 15)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/status` | GET | 系统状态 |
| `/api/csrf-token` | GET | CSRF Token |
| `/api/csp-violation` | POST | CSP 违规报告 |
| `/api/data/export` | POST | 数据导出 |
| `/api/data/import` | POST | 数据导入 |
| `/api/revalidate` | POST | ISR 重新验证 |
| `/api/metrics/performance` | GET | Prometheus 格式指标 |
| `/api/metrics/prometheus` | GET | Prometheus 端点 |
| `/api/vitals` | GET/POST | Vitals 数据 |

---

## 未文档化的 API (约 35+ 个端点)

### 🔴 P0 - 必须立即文档化

#### 1. Admin 管理 API (12)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/admin/rate-limit/rules` | GET/POST | 限流规则管理 |
| `/api/admin/rate-limit/rules/[id]` | GET/PUT/DELETE | 单个限流规则 |
| `/api/admin/rate-limit/statistics` | GET | 限流统计 |
| `/api/admin/security/blacklist` | GET/POST | 安全黑名单 |

**说明**: 这些是重要的管理端点，涉及安全和限流配置，当前完全未文档化。

#### 2. 导出系统 API (6)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/export/async` | POST | 异步导出任务 |
| `/api/export/sync` | POST | 同步导出 |
| `/api/export/jobs` | GET | 导出任务列表 |
| `/api/export/jobs/[jobId]` | GET | 导出任务详情 |
| `/api/export/jobs/[jobId]/download` | GET | 下载导出文件 |

**说明**: 完整的导出系统功能，包括异步任务管理和文件下载。

#### 3. 数据导入预览 API (3)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/import` | POST | 数据导入 |
| `/api/import/preview` | POST | 导入预览 |
| `/api/import/[taskId]` | GET | 导入任务状态 |

**说明**: 数据导入功能完整文档缺失。

#### 4. 数据库优化 API (1)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/database/optimize` | GET | 数据库优化和健康状态 |

**说明**: 数据库性能优化和健康检查端点未文档化。

#### 5. 报表生成 API (3)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/reports/generate` | POST | 生成报表 |
| `/api/reports/templates` | GET | 获取报表模板 |
| `/api/reports/custom` | POST | 生成自定义报表 |

**说明**: AI 报表生成系统完全未文档化。

---

### 🟡 P1 - 本周内完成

#### 6. 审计日志 (3)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/audit/logs` | GET | 查询审计日志 |
| `/api/audit/logs/[id]` | GET | 审计日志详情 |
| `/api/audit/export` | GET | 导出审计日志 |

**说明**: 虽然文档中有简要提及，但具体 API 细节在 v1.12.2 部分已文档化。需要检查是否有重复。

#### 7. 演示端点 (1)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/demo/task-status` | POST | 任务状态更新演示 |

**说明**: 演示端点，建议确认是否应包含在生产文档中。

#### 8. Sentry 测试端点 (1)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/sentry-test` | GET | Sentry 集成测试 |

**说明**: 调试端点，建议标注为仅开发环境可用。

#### 9. 搜索 v2 (1)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/search/v2` | GET | 统一搜索 v2 |

**说明**: 高级搜索 v2 实现，未在文档中单独说明。

---

### 🟢 P2 - 计划中

#### 10. 工作流扩展 (已部分文档)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/workflow/:id/versions/:versionId` | DELETE | 删除版本 (受限) |

**说明**: 已在文档中标注为"受限"，但可补充更多细节。

#### 11. AI 代码智能 API (6)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/ai/code/analyze` | POST | 代码分析 |
| `/api/ai/code/complete` | POST | 代码补全 |
| `/api/ai/code/review` | POST | 代码审查 |
| `/api/ai/code/detect-bugs` | POST | Bug 检测 |
| `/api/ai/code/suggest-fixes` | POST | 修复建议 |
| `/api/ai/code/explain` | POST | 代码解释 |

**说明**: 文档声称有这些 API，但检查 `/app/api/` 目录未发现对应路由文件。
这些功能可能在 `/lib/ai/code/` 库中实现，但没有直接的 HTTP API 端点。

#### 12. 多模型路由 API (3)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/ai/route` | POST | 智能路由 |
| `/api/ai/cost-tracking` | GET | 成本追踪 |
| `/api/ai/models/status` | GET | 模型状态 |

**说明**: 同上，文档中有描述但未发现对应路由文件。

#### 13. Workspace Automation API (5)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/automations` | GET/POST | 自动化规则 |
| `/api/automations/[id]` | GET/PUT/DELETE | 自动化规则 CRUD |
| `/api/automations/[id]/trigger` | POST | 触发规则 |

**说明**: 文档中有完整描述，但检查 `/app/api/` 未发现 `automations` 目录。
可能是库级别实现而非 HTTP API。

#### 14. Webhook API (5)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/webhooks` | GET/POST | Webhook 管理 |
| `/api/webhooks/[id]` | GET/PUT/DELETE | Webhook CRUD |
| `/api/webhooks/test` | POST | 测试 Webhook |

**说明**: 文档中有完整描述，但检查 `/app/api/` 未发现 `webhooks` 目录。

#### 15. 速率限制 API (5)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/rate-limit/health` | GET | 限流健康 |
| `/api/rate-limit/stats` | GET | 限流统计 |
| `/api/rate-limit/keys` | GET | 限流 keys |
| `/api/rate-limit/status/:layer/:identifier` | GET | key 状态 |
| `/api/rate-limit/adjust` | POST | 调整限流 |
| `/api/rate-limit/reset/:layer/:identifier` | POST | 重置限流 |

**说明**: 文档 v1.12.2 部分已文档化，但可能需要整合。

---

## 文档过时的 API (2 个)

### 1. 文档声称存在但实际可能未实现为 HTTP API

| 文档中的端点 | 问题 |
|-------------|------|
| `/api/ai/code/*` 系列 | 文档描述完整，但 `/app/api/ai/` 目录不存在，这些功能可能在库中实现 |
| `/api/ai/route` | 同上 |
| `/api/automations/*` | 文档描述详细，但 `/app/api/automations/` 目录不存在 |
| `/api/webhooks/*` | 文档描述详细，但 `/app/api/webhooks/` 目录不存在 |

### 2. 版本信息可能需要更新

- **最后更新**: 文档显示 2026-04-05 (v1.12.2)
- **但任务创建时间**: 2026-04-29
- 可能存在更新的代码但未同步到文档

---

## 建议优先级

### 🔴 P0 - 必须立即文档化 (约 25 个端点)

1. **Admin 管理 API** (12 个端点)
   - 限流规则管理 (CRUD)
   - 限流统计
   - 安全黑名单

2. **导出系统 API** (6 个端点)
   - 异步导出任务
   - 同步导出
   - 任务管理和下载

3. **数据导入 API** (3 个端点)
   - 导入、预览、状态查询

4. **数据库优化 API** (1 个端点)
   - `/api/database/optimize`

5. **报表生成 API** (3 个端点)
   - 报表生成、模板、自定义报表

### 🟡 P1 - 本周内完成 (约 10 个端点)

6. **搜索 v2** (1 个端点)
   - 统一搜索增强版

7. **实时流 API** 完善
   - `/api/stream/health`
   - `/api/monitoring/realtime`

8. **速率限制管理 API** 整理
   - 确认 v1.12.2 文档是否准确

### 🟢 P2 - 计划中

9. **验证 AI 代码智能 API**
   - 确认是否需要 HTTP API 端点
   - 如果只需要库调用，移除文档中的 API 描述

10. **验证 Automation/Webhook API**
    - 确认是否需要 HTTP API 端点
    - 如果是内部服务，移除文档中的 API 描述

11. **高级搜索 API** (`/api/search/advanced`)
    - 文档提到但实际端点是 `/api/search/v2`

---

## 统计摘要

| 类别 | 数量 |
|------|------|
| **已文档化 API** | ~145 |
| **未文档化 API** | ~35+ |
| **文档过时/存疑** | ~20 |
| **总计实际路由** | ~110 |

---

## 建议行动

1. **立即行动**
   - 创建 `/docs/api/admin.md` 文档
   - 更新 `/docs/api/export.md` 文档
   - 创建 `/docs/api/reports.md` 文档

2. **短期计划**
   - 验证 AI/Automation/Webhook API 是否需要 HTTP 端点
   - 如果不需要，从主 API.md 中移除相关章节
   - 如果需要，创建对应的 route.ts 文件

3. **长期计划**
   - 建立 API 文档与代码的同步机制
   - 考虑使用 Swagger/OpenAPI 自动生成文档
   - 添加 API 端点测试确保文档准确性

---

**报告生成**: 📚 咨询师子代理
**生成时间**: 2026-04-29
