# API 文档同步报告

**检查日期**: 2026-04-02
**检查人**: 📚 咨询师
**版本**: v1.6.1 → v1.6.2

---

## 📊 统计摘要

| 项目 | 数量 |
|------|------|
| 实际 API 路由文件 | 66 |
| 文档记录的 API 端点 | 70+ |
| 发现的不一致项 | 2 |

---

## ✅ 一致项（已正确文档化）

### 认证与授权 API (5)
- `/api/auth/login` ✓
- `/api/auth/register` ✓
- `/api/auth/me` ✓
- `/api/auth/refresh` ✓
- `/api/auth/logout` ✓

### 任务管理 API (4)
- `/api/tasks` ✓

### 项目管理 API (1)
- `/api/projects` ✓

### 性能监控 API (6)
- `/api/performance/metrics` ✓
- `/api/performance/report` ✓
- `/api/performance/alerts` ✓
- `/api/performance/clear` ✓
- `/api/metrics/performance` ✓
- `/api/metrics/prometheus` ✓

### 分析 API (2)
- `/api/analytics/metrics` ✓
- `/api/analytics/export` ✓

### 搜索 API (3)
- `/api/search` ✓
- `/api/search/autocomplete` ✓
- `/api/search/history` ✓

### RBAC 权限 API (8)
- `/api/rbac/system` ✓
- `/api/rbac/roles` ✓
- `/api/rbac/roles/[roleId]` ✓
- `/api/rbac/roles/[roleId]/permissions` ✓
- `/api/rbac/permissions` ✓
- `/api/rbac/users/[userId]/roles` ✓
- `/api/rbac/users/[userId]/permissions` ✓

### 多模态 API (2)
- `/api/multimodal/image` ✓
- `/api/multimodal/audio` ✓

### A2A 通信 API (5)
- `/api/a2a/jsonrpc` ✓
- `/api/a2a/registry` ✓
- `/api/a2a/registry/[id]` ✓
- `/api/a2a/registry/[id]/heartbeat` ✓
- `/api/a2a/queue` ✓

### Agents API (5)
- `/api/agents/status` ✓
- `/api/agents/register` ✓
- `/api/agents/heartbeat` ✓
- `/api/agents/discover` ✓
- `/api/agents/[id]` ✓

### 反馈 API (2)
- `/api/feedback` ✓
- `/api/feedback/[id]` ✓

### 评分 API (3)
- `/api/ratings` ✓
- `/api/ratings/[id]` ✓
- `/api/ratings/[id]/helpful` ✓

### 用户偏好设置 API (1)
- `/api/user/preferences` ✓

### Web Vitals API (2)
- `/api/web-vitals` ✓
- `/api/vitals` ✓

### GitHub 集成 API (2)
- `/api/github/issues` ✓
- `/api/github/commits` ✓

### 健康检查 API (4)
- `/api/health` ✓
- `/api/health/detailed` ✓
- `/api/health/live` ✓
- `/api/health/ready` ✓

### Database API (2)
- `/api/database/health` ✓
- `/api/database/optimize` ✓

### Workflow API (5)
- `/api/workflow` ✓
- `/api/workflow/[id]` ✓
- `/api/workflow/[id]/run` ✓

### Stream API (2)
- `/api/stream/health` ✓
- `/api/stream/analytics` ✓

### Demo API (1)
- `/api/demo/task-status` ✓

### 其他 API (6)
- `/api/status` ✓
- `/api/data/export` ✓
- `/api/data/import` ✓
- `/api/csrf-token` ✓
- `/api/csp-violation` ✓
- `/api/revalidate` ✓

---

## ⚠️ 发现的不一致项

### 1. 未文档化: `/api/monitoring/apm`

**严重程度**: 中

**描述**: APM 状态监控端点已实现但未在文档中记录。

**功能**:
- 返回 Sentry 配置和状态
- 分布式追踪信息
- 性能指标（内存、正常运行时间）
- Agent 任务统计

**HTTP 方法**: GET, HEAD

**响应示例**:
```json
{
  "success": true,
  "data": {
    "apm": {
      "status": "enabled",
      "sentry": {
        "initialized": true,
        "dsn": true,
        "environment": "production",
        "tracesSampleRate": 0.1
      },
      "tracing": {
        "traceId": "abc123",
        "spanId": "def456",
        "activeSpans": 5
      }
    },
    "performance": {
      "memory": { "used": 128, "limit": 512, "percentage": 25 },
      "uptime": 3600,
      "responseTime": 45
    },
    "agentTasks": {
      "totalAgents": 11,
      "totalTasks": 100,
      "completedTasks": 95,
      "failedTasks": 2,
      "activeTasks": 3,
      "avgTaskDuration": 2500,
      "totalTokens": 50000
    }
  }
}
```

---

### 2. 部分文档化: `/api/revalidate` (Server Actions)

**严重程度**: 低

**描述**: 新的 Server Actions 缓存失效 API 已在 `route_new_api.ts` 中实现，但文档中只有传统的 ISR revalidate 端点。

**新增功能**:
- `updateUserCache(userId)` - 更新用户缓存
- `refreshNotificationCount()` - 刷新通知计数
- `updateBlogPost(slug, locale)` - 更新博客文章缓存
- `refreshDashboard(userId)` - 刷新仪表盘
- `revalidateEverything()` - 全站刷新

**使用方式**: 这些是 Server Actions，需要客户端组件导入调用：
```typescript
// 客户端组件中
import { updateUserCache } from '@/app/api/revalidate/route_new_api/actions';

// 调用
await updateUserCache('user-123');
```

---

## 🔧 修复建议

### 建议 1: 添加 APM API 文档

在 `API.md` 的"性能监控 API"部分添加：

```markdown
### APM 状态监控

```
GET /api/monitoring/apm
```

获取 APM 系统状态，包括 Sentry、追踪和 Agent 任务统计。

**Query 参数:**
- 无

**响应:**
```json
{
  "success": true,
  "data": {
    "apm": {
      "status": "enabled",
      "sentry": { ... },
      "tracing": { ... }
    },
    "performance": { ... },
    "agentTasks": { ... }
  },
  "timestamp": "2026-04-02T..."
}
```
```

### 建议 2: 更新缓存 API 文档

在"API 缓存中间件"部分添加 Server Actions 缓存失效 API 说明。

---

## 📝 变更日志

| 日期 | 版本 | 变更内容 |
|------|------|---------|
| 2026-04-01 | v1.6.1 | 上次文档更新 |
| 2026-04-02 | v1.6.2 | 添加 APM API 同步检查报告 |

---

## ✅ 检查完成

- [x] 检查新增 API 端点
- [x] 检查 API 路由变更
- [x] 对比文档与实际路由
- [x] 生成同步报告
- [ ] 更新 API.md（待主人批准）

---

**报告生成时间**: 2026-04-02 08:30 GMT+2
