# API 文档同步报告 - v1.12.2

**报告日期**: 2026-04-05
**任务**: 同步 API 文档与代码实现
**版本**: v1.12.2

---

## 📋 执行摘要

本次文档同步任务检查了 v1.12.2 版本的 API 文档与代码实现的一致性，重点关注以下四个新功能：

1. ✅ **Advanced Search API** - 部分匹配（端点名称不一致）
2. ✅ **Workflow Versioning API** - 完全匹配
3. ✅ **Audit Logging API** - 完全匹配
4. ❌ **Webhook Event API** - 缺失文档

---

## 🔍 详细检查结果

### 1. Advanced Search API

#### 代码实现
**位置**: `src/app/api/search/v2/route.ts`

**实际端点**:
- `GET /api/search/v2` - 执行高级搜索（查询参数）
- `POST /api/search/v2` - 执行高级搜索（JSON 请求体）

**功能特性**:
- ✅ 多字段组合搜索
- ✅ 高级过滤条件（status, priority, labels, assignees, 日期范围）
- ✅ 自定义过滤器（custom JSON）
- ✅ 多搜索引擎支持（fuse, lunr, elastic）
- ✅ 模糊搜索配置
- ✅ 结果高亮
- ✅ 分页支持
- ✅ 统计信息

#### 文档描述
**位置**: `docs/API.md` 第 1517 行

**文档端点**:
- `POST /api/search/advanced` - 执行高级搜索
- `POST /api/search/advanced/saved` - 保存搜索
- `POST /api/search/advanced/export` - 导出搜索结果

#### ⚠️ 不匹配问题

| 项目 | 代码实现 | 文档描述 | 状态 |
|------|---------|---------|------|
| 端点路径 | `/api/search/v2` | `/api/search/advanced` | ❌ 不一致 |
| HTTP 方法 | GET + POST | 仅 POST | ❌ 不一致 |
| 保存搜索 | 未找到实现 | 有文档 | ❌ 缺失 |
| 导出搜索 | 未找到实现 | 有文档 | ❌ 缺失 |

#### 📝 建议修复

1. **统一端点命名**：
   - 选项 A: 将代码端点改为 `/api/search/advanced`
   - 选项 B: 将文档端点改为 `/api/search/v2`

2. **补充缺失功能**：
   - 实现 `/api/search/advanced/saved` 端点
   - 实现 `/api/search/advanced/export` 端点

3. **更新文档**：
   - 添加 GET 方法说明
   - 更新请求参数以匹配实际实现

---

### 2. Workflow Versioning API

#### 代码实现
**位置**:
- `src/app/api/workflow/[id]/versions/route.ts`
- `src/app/api/workflow/[id]/versions/[versionId]/route.ts`
- `src/app/api/workflow/[id]/versions/compare/route.ts`
- `src/app/api/workflow/[id]/versions/[versionId]/rollback/route.ts`

**实际端点**:
- `GET /api/workflow/[id]/versions` - 获取版本列表
- `POST /api/workflow/[id]/versions` - 创建新版本
- `GET /api/workflow/[id]/versions/[versionId]` - 获取版本详情
- `GET /api/workflow/[id]/versions/compare` - 比较两个版本
- `POST /api/workflow/[id]/versions/[versionId]/rollback` - 回滚到指定版本

**功能特性**:
- ✅ 版本快照（节点、边、配置）
- ✅ 版本列表和分页
- ✅ 版本详情查询
- ✅ 版本对比（diff）
- ✅ 版本回滚
- ✅ 变更摘要和类型
- ✅ 版本标签

#### 文档描述
**位置**: `docs/API.md` 第 5554 行

**文档端点**:
- `POST /api/workflow/:id/versions` - 创建工作流版本
- `GET /api/workflow/:id/versions` - 获取工作流版本列表
- `GET /api/workflow/:id/versions/:versionId` - 获取版本详情
- `GET /api/workflow/:id/versions/compare` - 比较版本
- `POST /api/workflow/:id/versions/:versionId/rollback` - 回滚版本

#### ✅ 匹配状态

| 项目 | 代码实现 | 文档描述 | 状态 |
|------|---------|---------|------|
| 端点路径 | `/api/workflow/[id]/versions` | `/api/workflow/:id/versions` | ✅ 匹配（Next.js 路由语法差异） |
| HTTP 方法 | GET + POST | GET + POST | ✅ 匹配 |
| 请求参数 | 完整实现 | 完整文档 | ✅ 匹配 |
| 响应格式 | 统一响应格式 | 统一响应格式 | ✅ 匹配 |
| 功能特性 | 版本管理完整 | 文档详细 | ✅ 匹配 |

#### 📝 结论

Workflow Versioning API 的文档与代码实现**完全一致**，文档质量高，包含详细的请求/响应示例和参数说明。

---

### 3. Audit Logging API

#### 代码实现
**位置**:
- `src/app/api/audit/logs/route.ts`
- `src/app/api/audit/export/route.ts`

**实际端点**:
- `GET /api/audit/logs` - 查询审计日志
- `GET /api/audit/export` - 导出审计日志（JSON/CSV）

**功能特性**:
- ✅ 操作类型记录（CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, ADMIN）
- ✅ 操作者追踪（userId, username, ipAddress）
- ✅ 操作详情记录（变更前后、变更字段）
- ✅ 审计日志查询和筛选
- ✅ 审计日志导出（CSV、JSON）
- ✅ 时间范围限制（最多90天）
- ✅ 记录数量限制（最多100,000条）

#### 文档描述
**位置**: `docs/API.md` 第 6715 行

**文档端点**:
- `POST /api/audit/logs` - 记录审计日志
- `GET /api/audit/logs` - 获取审计日志列表
- `GET /api/audit/export` - 导出审计日志

#### ✅ 匹配状态

| 项目 | 代码实现 | 文档描述 | 状态 |
|------|---------|---------|------|
| 端点路径 | `/api/audit/logs` | `/api/audit/logs` | ✅ 匹配 |
| HTTP 方法 | GET | GET + POST | ⚠️ 部分匹配 |
| 请求参数 | 完整实现 | 完整文档 | ✅ 匹配 |
| 响应格式 | 统一响应格式 | 统一响应格式 | ✅ 匹配 |
| 功能特性 | 查询和导出 | 查询和导出 | ✅ 匹配 |

#### 📝 说明

- 代码中 `GET /api/audit/logs` 用于查询日志
- 文档中额外描述了 `POST /api/audit/logs` 用于记录日志（通常由系统内部调用）
- 导出功能完全匹配

#### 📝 结论

Audit Logging API 的文档与代码实现**基本一致**，文档质量高，包含详细的请求/响应示例和参数说明。

---

### 4. Webhook Event API

#### 代码实现
**位置**: `src/lib/plugins/builtin/plugins/WebhookPlugin.ts`

**实现方式**:
- Webhook 功能通过**插件系统**实现
- 不是独立的 API 路由，而是通过插件的动作（actions）调用
- 插件 ID: `@openclaw/plugin-webhook`

**插件动作**:
- `createEndpoint` - 创建 webhook 端点
- `updateEndpoint` - 更新 webhook 端点
- `deleteEndpoint` - 删除 webhook 端点
- `getEndpoint` - 获取 webhook 端点
- `listEndpoints` - 列出所有 webhook 端点
- `trigger` - 触发 webhook 事件
- `getDelivery` - 获取 webhook 投递记录
- `listDeliveries` - 列出 webhook 投递记录
- `retryDelivery` - 重试失败的 webhook
- `stats` - 获取 webhook 统计信息

**功能特性**:
- ✅ Webhook 端点管理（CRUD）
- ✅ 事件触发和投递
- ✅ 重试机制（可配置重试次数和延迟）
- ✅ 投递状态跟踪
- ✅ 签名验证（可选）
- ✅ 并发控制

#### 文档描述
**位置**: ❌ **未找到专门的 Webhook Event API 文档**

**相关提及**:
- `docs/API.md` 中仅在以下位置提及 webhook：
  - 第 296 行：意图识别中的 webhook 任务类型
  - 第 3818 行：工作流触发类型（manual, api, schedule, webhook）
  - 第 6064 行：通知渠道（email、telegram、webhook、push）
  - 第 6649 行：通知渠道类型定义

#### ❌ 缺失问题

| 项目 | 代码实现 | 文档描述 | 状态 |
|------|---------|---------|------|
| API 文档 | 插件系统实现 | ❌ 无独立文档 | ❌ 缺失 |
| 使用示例 | 插件动作调用 | ❌ 无示例 | ❌ 缺失 |
| 端点说明 | 通过插件调用 | ❌ 无说明 | ❌ 缺失 |

#### 📝 建议补充

1. **创建 Webhook API 文档**：
   - 在 `docs/API.md` 中添加 "Webhook Event API" 章节
   - 或创建独立的 `docs/api/webhook.md` 文档

2. **文档内容应包含**：
   - Webhook 插件概述
   - 插件动作列表和说明
   - 如何通过插件系统调用 webhook 功能
   - 请求/响应示例
   - 配置选项（重试、超时、签名等）
   - 使用场景和最佳实践

3. **示例文档结构**：

```markdown
## Webhook Event API (v1.12.2 新增)

### 概述
Webhook 功能通过插件系统实现，插件 ID: `@openclaw/plugin-webhook`

### 插件动作

#### 创建 Webhook 端点
**动作**: `createEndpoint`
**输入**: `{ url: string, events: string[], headers?: Record<string, string> }`
**输出**: `WebhookEndpoint`

#### 触发 Webhook 事件
**动作**: `trigger`
**输入**: `{ event: string, payload: unknown, endpointId?: string }`
**输出**: `{ deliveries: string[] }`

... 其他动作
```

---

## 📊 总体统计

| API | 代码实现 | 文档描述 | 匹配状态 | 优先级 |
|-----|---------|---------|---------|--------|
| Advanced Search API | ✅ | ⚠️ | 部分匹配 | 🔴 高 |
| Workflow Versioning API | ✅ | ✅ | 完全匹配 | 🟢 低 |
| Audit Logging API | ✅ | ✅ | 基本匹配 | 🟢 低 |
| Webhook Event API | ✅ | ❌ | 缺失文档 | 🔴 高 |

---

## 🎯 修复建议

### 高优先级

1. **修复 Advanced Search API 端点不一致**
   - 统一端点路径（`/api/search/v2` 或 `/api/search/advanced`）
   - 补充保存搜索和导出搜索功能的实现或文档

2. **补充 Webhook Event API 文档**
   - 创建完整的 Webhook API 文档
   - 包含插件动作说明和使用示例

### 中优先级

3. **更新 Advanced Search API 文档**
   - 添加 GET 方法说明
   - 更新请求参数以匹配实际实现
   - 添加多搜索引擎支持说明

### 低优先级

4. **完善 Audit Logging API 文档**
   - 明确说明 POST 方法用于系统内部调用
   - 添加更多使用场景示例

---

## 📝 附录

### 检查的文件列表

#### 代码文件
- `src/app/api/search/v2/route.ts`
- `src/app/api/search/route.ts`
- `src/app/api/workflow/[id]/versions/route.ts`
- `src/app/api/workflow/[id]/versions/[versionId]/route.ts`
- `src/app/api/workflow/[id]/versions/compare/route.ts`
- `src/app/api/workflow/[id]/versions/[versionId]/rollback/route.ts`
- `src/app/api/audit/logs/route.ts`
- `src/app/api/audit/export/route.ts`
- `src/lib/plugins/builtin/plugins/WebhookPlugin.ts`

#### 文档文件
- `docs/API.md`
- `docs/api/search.md`

---

## ✅ 完成状态

- [x] 检查 `docs/` 目录下的 API 文档
- [x] 核对 `src/app/api/` 路由与文档是否匹配
- [x] 检查 Advanced Search API 文档完整性
- [x] 检查 Workflow Versioning API 文档完整性
- [x] 检查 Audit Logging API 文档完整性
- [x] 检查 Webhook Event API 文档完整性
- [x] 生成完成报告

---

**报告生成时间**: 2026-04-05 00:36:00 GMT+2
**报告生成者**: 文档工程师子代理