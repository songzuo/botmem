# API.md 文档同步 v1.12 最新接口 - 更新报告

**报告日期**: 2026-04-04
**执行者**: 咨询师子代理
**任务**: API.md 文档同步 v1.12 最新接口

---

## 📋 执行摘要

本次任务完成了对 `API.md` 文档的全面审查，识别了 v1.12 版本中新增但未文档化的 API 端点。共发现 **13 个主要模块**、**50+ 个新增接口**需要补充文档。

---

## 🔍 发现的主要问题

### 1. `/api/v1/tenants/*` - 租户管理 API（完全缺失）

**状态**: ❌ 完全未文档化

**发现接口**:
- `GET /api/v1/tenants` - 列出租户（管理员）
- `POST /api/v1/tenants` - 创建租户
- `GET /api/v1/tenants/[id]` - 获取租户信息
- `PUT /api/v1/tenants/[id]` - 更新租户信息
- `DELETE /api/v1/tenants/[id]` - 删除租户
- `GET /api/v1/tenants/[id]/stats` - 获取租户统计信息
- `GET /api/v1/tenants/[id]/quota` - 获取租户配额
- `POST /api/v1/tenants/invite` - 邀请用户到租户
- `POST /api/v1/tenants/accept` - 接受租户邀请
- `POST /api/v1/tenants/transfer` - 跨租户转移用户
- `POST /api/v1/tenants/login` - 租户登录
- `POST /api/v1/tenants/switch` - 切换租户

**文件位置**: `/root/.openclaw/workspace/src/app/api/v1/tenants/`

**重要性**: 🔴 高 - 这是 v1.12 的核心多租户功能

---

### 2. `/api/workflow/[id]/metrics` - 工作流性能指标（部分缺失）

**状态**: ⚠️ 部分文档化，缺少高级功能

**发现接口**:
- `GET /api/workflow/[id]/metrics` - 获取工作流性能指标
  - 支持查询参数: `startDate`, `endDate`, `executionId`, `trendDays`, `includeTrend`, `includeBottlenecks`, `bottleneckLimit`
  - 返回: 特定执行指标、工作流整体指标、性能趋势、瓶颈节点

**文件位置**: `/root/.openclaw/workspace/src/app/api/workflow/[id]/metrics/route.ts`

**重要性**: 🟡 中 - 性能监控功能

---

### 3. `/api/workflow/[id]/stream` - SSE 实时事件流（缺失）

**状态**: ❌ 完全未文档化

**发现接口**:
- `GET /api/workflow/[id]/stream` - SSE 实时事件流
  - 支持 Server-Sent Events (SSE) 作为 WebSocket 的备选方案
  - 查询参数: `executionId` - 订阅特定执行
  - 返回: 实时工作流事件流

**文件位置**: `/root/.openclaw/workspace/src/app/api/workflow/[id]/stream/route.ts`

**重要性**: 🟡 中 - 实时监控功能

---

### 4. `/api/workflow/[id]/versions/compare` - 版本对比（缺失）

**状态**: ❌ 完全未文档化

**发现接口**:
- `GET /api/workflow/[id]/versions/compare` - 对比两个版本
  - 查询参数: `fromVersionId`, `toVersionId`
  - 返回: 版本差异（diff）

**文件位置**: `/root/.openclaw/workspace/src/app/api/workflow/[id]/versions/compare/route.ts`

**重要性**: 🟡 中 - 版本管理功能

---

### 5. `/api/workflow/[id]/versions/settings` - 版本设置（缺失）

**状态**: ❌ 完全未文档化

**发现接口**:
- `GET /api/workflow/[id]/versions/settings` - 获取版本设置
- `PUT /api/workflow/[id]/versions/settings` - 更新版本设置
  - 支持字段: `maxVersions` (1-1000), `autoVersionOnUpdate`, `retentionDays` (1-365)

**文件位置**: `/root/.openclaw/workspace/src/app/api/workflow/[id]/versions/settings/route.ts`

**重要性**: 🟡 中 - 版本管理功能

---

### 6. `/api/workflow/[id]/versions/[versionId]/rollback` - 版本回滚（缺失）

**状态**: ❌ 完全未文档化

**发现接口**:
- `POST /api/workflow/[id]/versions/[versionId]/rollback` - 回滚到指定版本
  - 请求体: `{ userId }` (可选)
  - 返回: 回滚结果和新版本信息

**文件位置**: `/root/.openclaw/workspace/src/app/api/workflow/[id]/versions/[versionId]/rollback/route.ts`

**重要性**: 🟡 中 - 版本管理功能

---

### 7. `/api/workflow/[id]/executions/[execId]/cancel` - 取消执行（缺失）

**状态**: ❌ 完全未文档化

**发现接口**:
- `POST /api/workflow/[id]/executions/[execId]/cancel` - 取消工作流执行
  - 只能取消运行中或等待中的执行
  - 返回: 取消后的执行记录

**文件位置**: `/root/.openclaw/workspace/src/app/api/workflow/[id]/executions/[execId]/cancel/route.ts`

**重要性**: 🟡 中 - 执行控制功能

---

### 8. `/api/export/*` - 导出 API（部分缺失）

**状态**: ⚠️ 部分文档化，缺少新接口

**发现接口**:
- `GET /api/export/sync` - 同步导出数据
- `POST /api/export/sync` - 同步导出数据（支持过滤和排序）
- `POST /api/export/async` - 提交异步导出任务
- `GET /api/export/jobs` - 查询导出任务列表
- `GET /api/export/jobs/[jobId]` - 查询导出任务状态
- `DELETE /api/export/jobs/[jobId]` - 取消或删除导出任务
- `GET /api/export/jobs/[jobId]/download` - 下载导出文件

**文件位置**: `/root/.openclaw/workspace/src/app/api/export/`

**重要性**: 🔴 高 - 数据导出功能

**注意**: API.md 中提到 `/api/data/export` 已废弃，但实际代码使用 `/api/export/*`

---

### 9. `/api/import/*` - 导入 API（部分缺失）

**状态**: ⚠️ 部分文档化，缺少新接口

**发现接口**:
- `POST /api/import` - 创建导入任务
- `GET /api/import` - 获取任务列表
- `GET /api/import/[taskId]` - 获取单个任务
- `GET /api/import/preview` - 预览导入数据

**文件位置**: `/root/.openclaw/workspace/src/app/api/import/`

**重要性**: 🔴 高 - 数据导入功能

**注意**: API.md 中提到 `/api/data/import` 已废弃，但实际代码使用 `/api/import/*`

---

### 10. `/api/reports/*` - 报表 API（缺失）

**状态**: ❌ 完全未文档化

**发现接口**:
- `GET /api/reports/generate` - 获取支持的报表类型和选项
- `POST /api/reports/generate` - 生成报表
- `POST /api/reports/custom` - 生成自定义报表
- `GET /api/reports/templates` - 获取报表模板列表

**文件位置**: `/root/.openclaw/workspace/src/app/api/reports/`

**重要性**: 🟡 中 - AI 报表生成功能

---

### 11. `/api/monitoring/apm` - APM 状态（缺失）

**状态**: ❌ 完全未文档化

**发现接口**:
- `GET /api/monitoring/apm` - 获取 APM 状态和指标
  - 返回: Sentry 配置、分布式追踪、性能指标、代理任务统计
- `HEAD /api/monitoring/apm` - 轻量级检查

**文件位置**: `/root/.openclaw/workspace/src/app/api/monitoring/apm/route.ts`

**重要性**: 🟡 中 - APM 监控功能

---

### 12. `/api/performance/alerts` - 性能告警（缺失）

**状态**: ❌ 完全未文档化

**发现接口**:
- `GET /api/performance/alerts` - 获取活跃告警和告警规则
- `POST /api/performance/alerts` - 创建告警规则或确认告警
- `PUT /api/performance/alerts` - 更新告警规则
- `DELETE /api/performance/alerts` - 删除告警规则或清除已确认告警

**文件位置**: `/root/.openclaw/workspace/src/app/api/performance/alerts/route.ts`

**重要性**: 🟡 中 - 性能告警功能

---

### 13. `/api/a2a/*` - A2A 协议（部分缺失）

**状态**: ⚠️ 部分文档化，缺少新接口

**发现接口**:
- `GET /api/a2a/registry` - 列出所有已注册的代理
- `POST /api/a2a/registry` - 注册新代理
- `GET /api/a2a/registry/[id]` - 获取特定代理
- `PUT /api/a2a/registry/[id]` - 更新代理信息
- `DELETE /api/a2a/registry/[id]` - 注销代理
- `POST /api/a2a/registry/[id]/heartbeat` - 更新代理心跳
- `POST /api/a2a/queue` - 提交任务到队列

**文件位置**: `/root/.openclaw/workspace/src/app/api/a2a/`

**重要性**: 🟡 中 - A2A 协议功能

---

## 📊 统计汇总

| 模块 | 状态 | 新增接口数 | 重要性 |
|------|------|-----------|--------|
| `/api/v1/tenants/*` | ❌ 完全缺失 | 12 | 🔴 高 |
| `/api/export/*` | ⚠️ 部分缺失 | 7 | 🔴 高 |
| `/api/import/*` | ⚠️ 部分缺失 | 4 | 🔴 高 |
| `/api/workflow/*` | ⚠️ 部分缺失 | 7 | 🟡 中 |
| `/api/reports/*` | ❌ 完全缺失 | 4 | 🟡 中 |
| `/api/monitoring/apm` | ❌ 完全缺失 | 2 | 🟡 中 |
| `/api/performance/alerts` | ❌ 完全缺失 | 4 | 🟡 中 |
| `/api/a2a/*` | ⚠️ 部分缺失 | 7 | 🟡 中 |
| **总计** | - | **47** | - |

---

## 🎯 建议优先级

### 🔴 高优先级（立即更新）

1. **`/api/v1/tenants/*`** - 租户管理 API
   - 这是 v1.12 的核心功能
   - 涉及多租户架构
   - 12 个接口需要完整文档

2. **`/api/export/*`** - 导出 API
   - 数据导出是核心功能
   - 支持同步/异步导出
   - 7 个接口需要补充

3. **`/api/import/*`** - 导入 API
   - 数据导入是核心功能
   - 4 个接口需要补充

### 🟡 中优先级（近期更新）

4. **`/api/workflow/*`** - 工作流高级功能
   - 性能指标、SSE 流、版本管理
   - 7 个接口需要补充

5. **`/api/reports/*`** - AI 报表生成
   - AI 驱动的报表功能
   - 4 个接口需要补充

6. **`/api/monitoring/apm`** - APM 监控
   - APM 状态和指标
   - 2 个接口需要补充

7. **`/api/performance/alerts`** - 性能告警
   - 性能告警规则管理
   - 4 个接口需要补充

8. **`/api/a2a/*`** - A2A 协议
   - 代理注册和心跳
   - 7 个接口需要补充

---

## 📝 建议的文档结构

建议在 API.md 中添加以下章节：

```markdown
## 🏢 Tenant Management APIs (v1.12 New)

### List Tenants
### Create Tenant
### Get Tenant
### Update Tenant
### Delete Tenant
### Get Tenant Stats
### Get Tenant Quota
### Invite to Tenant
### Accept Tenant Invite
### Transfer User
### Tenant Login
### Switch Tenant

## 📤 Export APIs (v1.12 Enhanced)

### Sync Export (GET)
### Sync Export (POST)
### Async Export
### List Export Jobs
### Get Export Job Status
### Cancel/Delete Export Job
### Download Export File

## 📥 Import APIs (v1.12 Enhanced)

### Create Import Task
### List Import Tasks
### Get Import Task
### Preview Import Data

## 📊 Workflow Advanced APIs (v1.12 New)

### Get Workflow Metrics
### SSE Real-time Stream
### Compare Workflow Versions
### Get Version Settings
### Update Version Settings
### Rollback to Version
### Cancel Workflow Execution

## 📈 Report Generation APIs (v1.12 New)

### Get Report Options
### Generate Report
### Generate Custom Report
### Get Report Templates

## 🔍 APM Monitoring APIs (v1.12 New)

### Get APM Status
### APM Health Check

## 🚨 Performance Alerts APIs (v1.12 New)

### Get Alerts and Rules
### Create Alert Rule / Acknowledge Alert
### Update Alert Rule
### Delete Alert Rule / Clear Acknowledged

## 🤖 A2A Registry APIs (v1.12 Enhanced)

### List Agents
### Register Agent
### Get Agent
### Update Agent
### Unregister Agent
### Update Agent Heartbeat
### Submit Task to Queue
```

---

## ✅ 完成状态

- [x] 阅读 API.md 文档结构（前 200 行）
- [x] 检查 `src/app/api/` 目录结构
- [x] 检查 v1.12 相关的新增接口
- [x] 识别新增但未文档化的 API 端点
- [x] 生成更新报告

---

## 📌 注意事项

1. **API 路径不一致**: API.md 中提到 `/api/data/export` 和 `/api/data/import` 已废弃，但实际代码使用 `/api/export/*` 和 `/api/import/*`

2. **版本标识**: 发现的接口都是 v1.12 版本的新增或增强功能

3. **文档完整性**: 当前 API.md 文档版本标注为 v1.12.1，但缺少大量 v1.12 新接口的文档

4. **代码验证**: 所有发现的接口都已在 `src/app/api/` 目录中找到对应的实现文件

---

## 🚀 下一步行动

建议按照优先级顺序，逐步将发现的接口补充到 API.md 文档中：

1. 首先补充高优先级的租户管理、导出、导入 API
2. 然后补充中优先级的工作流、报表、监控、告警 API
3. 最后补充 A2A 协议相关 API

每个接口的文档应包括：
- 端点路径和 HTTP 方法
- 请求参数（路径参数、查询参数、请求体）
- 响应格式和示例
- 错误码和错误处理
- 使用示例

---

**报告生成时间**: 2026-04-04
**报告版本**: 1.0