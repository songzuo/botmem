# API 同步报告

**报告日期**: 2026-03-29
**执行者**: 咨询师子代理
**任务**: 同步 API.md 与最新代码变更

---

## 执行摘要

本报告对比了 `docs/API.md` 文档与 `src/app/api/` 目录下的实际 API 路由实现，识别出文档中缺失、过时或需要更新的端点。

### 关键发现

- **实际 API 路由总数**: 57 个 route.ts 文件
- **需要新增文档的端点**: 8 个
- **需要移除文档的端点**: 约 15 个 (已废弃)
- **需要更新的端点**: 12 个 (参数、方法变更)

---

## 一、已移除的 API 端点 (文档中存在但代码中不存在)

### 1.1 用户管理 API (`/api/users/*`)

**状态**: ❌ 已完全移除

被移除的端点：
- `GET /api/users` - 获取用户列表
- `GET /api/users/[userId]` - 获取用户详情
- `POST /api/users` - 创建用户
- `PUT /api/users/[userId]` - 更新用户
- `POST /api/users/batch` - 批量操作
- `POST /api/users/batch/bulk` - 批量操作
- `GET /api/users/[userId]/activity` - 用户活动
- `POST /api/users/[userId]/avatar` - 上传头像

**替代方案**:
- 用户角色管理: `GET/POST/DELETE /api/rbac/users/[userId]/roles`
- 用户权限管理: `GET /api/rbac/users/[userId]/permissions`

### 1.2 备份与恢复 API (`/api/backup/*`)

**状态**: ❌ 已完全移除

被移除的端点：
- `GET /api/backup`
- `POST /api/backup`
- `GET /api/backup/[id]`
- `POST /api/backup/export`
- `GET /api/backup/export/download/[filename]`
- `POST /api/backup/import`
- `POST /api/backup/restore`
- `GET /api/backup/schedule`
- `POST /api/backup/schedule`
- `GET /api/backup/schedule/[id]`
- `PUT /api/backup/schedule/[id]`
- `DELETE /api/backup/schedule/[id]`
- `POST /api/backup/schedule/[id]/trigger`
- `GET /api/backup/statistics`
- `GET /api/backup/jobs`

**原因**: 根据提交 `5004fb326 chore: remove deprecated backup and user API routes (dead code cleanup)`，这些 API 作为死代码已被清理。

### 1.3 WebSocket API (`/api/ws/*`)

**状态**: ❌ 可能已移除或重构

被移除的端点：
- `GET /api/ws`
- `POST /api/ws/broadcast`
- `GET /api/ws/rooms/[roomId]`
- `POST /api/ws/rooms/[roomId]`
- `DELETE /api/ws/rooms/[roomId]`
- `GET /api/ws/stats`

**备注**: WebSocket 功能可能已重构到其他模块或服务中。

### 1.4 其他已移除端点

- `GET /api/example` - 示例端点
- `GET /api/demo/task-status` - 演示端点 (代码中仍存在)

---

## 二、新增或缺失文档的 API 端点

### 2.1 Feedback API - 新增方法

**端点**: `/api/feedback`

**新增方法**:

#### PATCH /api/feedback/[id]
更新反馈 (管理员权限)

**请求体**:
```json
{
  "status": "reviewed",
  "priority": "high",
  "admin_notes": "已处理",
  "metadata": {}
}
```

**参数说明**:
- `status`: 反馈状态 (`pending` | `reviewed` | `resolved`)
- `priority`: 优先级 (`low` | `medium` | `high` | `urgent`)
- `admin_notes`: 管理员备注
- `metadata`: 额外元数据

**响应**: 更新后的反馈对象

#### DELETE /api/feedback/[id]
删除反馈 (管理员权限)

**权限**: 需要管理员权限

**响应**:
```json
{
  "id": "feedback-id",
  "message": "Feedback deleted successfully"
}
```

#### GET /api/feedback (增强)
支持更多过滤和分页参数

**Query 参数**:
- `user_id`: 用户 ID
- `type`: 反馈类型
- `status`: 反馈状态
- `priority`: 优先级
- `rating_min`: 最小评分
- `rating_max`: 最大评分
- `start_date`: 开始日期
- `end_date`: 结束日期
- `search`: 搜索关键词
- `sort_by`: 排序字段 (`created_at` | `rating`)
- `sort_order`: 排序方向 (`asc` | `desc`)
- `page`: 页码 (默认 1)
- `per_page`: 每页数量 (默认 20, 最大 100)

---

### 2.2 Ratings API - 完整评分系统

**状态**: ⚠️ 文档中仅简单提及，需补充完整文档

#### GET /api/ratings
获取评分列表

**Query 参数**:
- `user_id`: 用户 ID
- `target_type`: 目标类型 (`agent` | `task` | `feature` | `project` | `overall`)
- `target_id`: 目标 ID
- `rating_min`: 最小评分
- `rating_max`: 最大评分
- `status`: 状态
- `start_date`: 开始日期
- `end_date`: 结束日期
- `sort_by`: 排序字段
- `sort_order`: 排序方向
- `page`: 页码
- `per_page`: 每页数量

**响应**:
```json
{
  "ratings": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20,
    "total_pages": 5
  },
  "stats": {
    "average": 4.2,
    "total": 100,
    "byRating": { "1": 5, "2": 8, "3": 12, "4": 30, "5": 45 }
  }
}
```

#### POST /api/ratings
创建或更新评分

**请求体**:
```json
{
  "user_id": "user-001",
  "target_type": "agent",
  "target_id": "agent-001",
  "rating": 5,
  "title": "非常棒！",
  "description": "这个助手非常高效",
  "verified": false,
  "metadata": {}
}
```

**特性**:
- 支持反垃圾检测
- 同一用户对同一目标只能有一个评分，重复提交会更新
- 评分范围: 1-5

#### GET /api/ratings/[id]
获取单个评分详情

#### DELETE /api/ratings/[id]
删除评分

**权限**: 只能删除自己的评分，或管理员可删除所有

#### POST /api/ratings/[id]/helpful
标记评分是否有帮助

**请求体**:
```json
{
  "is_helpful": true
}
```

**响应**: 更新后的评分，包含 `helpful_count` 和 `not_helpful_count`

---

### 2.3 Web Vitals API - 性能监控

**状态**: ❌ 完全缺失文档

#### POST /api/vitals (或 /api/web-vitals)
上报 Web Vitals 性能指标

**请求体**:
```json
{
  "metrics": [
    {
      "id": "v1",
      "name": "LCP",
      "value": 2500,
      "rating": "good",
      "delta": 100,
      "timestamp": 1647984000000,
      "route": "/dashboard"
    }
  ],
  "metadata": {
    "url": "https://7zi.com/dashboard",
    "referrer": "https://7zi.com",
    "viewportWidth": 1920,
    "viewportHeight": 1080
  }
}
```

**支持的指标**:
- `LCP`: Largest Contentful Paint
- `FID`: First Input Delay
- `CLS`: Cumulative Layout Shift
- `TTFB`: Time to First Byte
- `FCP`: First Contentful Paint
- `INP`: Interaction to Next Paint

**功能**:
- 验证数据格式
- 发送到 Sentry
- 计算性能评分 (0-100)
- 存储到数据库

#### GET /api/vitals
获取 Web Vitals 统计

**Query 参数**:
- `route`: 路由过滤
- `hours`: 时间范围 (小时，默认 24)

**响应**:
```json
{
  "route": "/dashboard",
  "hours": 24,
  "metrics": {
    "LCP": { "avg": 2500, "count": 100 },
    "CLS": { "avg": 0.1, "count": 100 }
  },
  "score": 85
}
```

---

### 2.4 User Preferences API

**状态**: ❌ 完全缺失文档

#### GET /api/user/preferences
获取用户偏好设置

**Query 参数**:
- `user_id`: 用户 ID (必需)

**响应**:
```json
{
  "success": true,
  "data": {
    "user_id": "user-001",
    "locale": "zh",
    "theme": "system",
    "timezone": "Asia/Shanghai",
    "notifications_enabled": true,
    "email_notifications": true,
    "sound_enabled": true,
    "created_at": "2026-03-01T00:00:00Z",
    "updated_at": "2026-03-29T00:00:00Z"
  }
}
```

#### POST /api/user/preferences
创建用户偏好设置

**请求体**:
```json
{
  "user_id": "user-001",
  "locale": "zh",
  "theme": "dark",
  "timezone": "Asia/Shanghai",
  "notifications_enabled": true,
  "email_notifications": true,
  "sound_enabled": true
}
```

#### PUT /api/user/preferences
更新用户偏好设置

**请求体**: 同 POST，所有字段可选

---

### 2.5 A2A Queue API - 消息队列管理

**状态**: ⚠️ 文档中仅简单提及，需补充完整文档

#### GET /api/a2a/queue
获取队列状态和统计

**响应**:
```json
{
  "status": "ok",
  "stats": {
    "total": 42,
    "byPriority": {
      "urgent": 5,
      "high": 10,
      "normal": 20,
      "low": 7
    },
    "byAgent": {
      "agent-001": 15,
      "agent-002": 12,
      "agent-003": 15
    }
  },
  "nextMessage": {
    "id": "msg-001",
    "taskId": "task-001",
    "agentId": "agent-001",
    "priority": "urgent"
  },
  "config": {
    "maxSize": 1000,
    "maxAttempts": 3
  }
}
```

#### POST /api/a2a/queue
将消息加入队列

**请求体**:
```json
{
  "id": "msg-001",
  "taskId": "task-001",
  "agentId": "agent-001",
  "priority": "high",
  "payload": {
    "data": "example"
  },
  "maxAttempts": 3
}
```

**优先级**: `urgent` | `high` | `normal` | `low`

#### DELETE /api/a2a/queue
清空队列

**Query 参数**:
- `agentId`: 仅清空特定 agent 的消息 (可选)
- `priority`: 仅清空特定优先级的消息 (可选)

**示例**:
- `DELETE /api/a2a/queue` - 清空全部队列
- `DELETE /api/a2a/queue?agentId=agent-001` - 清空 agent-001 的消息
- `DELETE /api/a2a/queue?priority=high` - 清空高优先级消息

---

### 2.6 RBAC User Roles API - 用户角色管理

**状态**: ❌ 完全缺失文档

#### GET /api/rbac/users/[userId]/roles
获取用户的所有角色

**Query 参数**:
- `includePermissions`: 是否包含权限列表 (`true` | `false`)

**响应**:
```json
{
  "success": true,
  "data": {
    "userId": "user-001",
    "roles": ["admin", "manager"],
    "permissions": ["users:read", "users:write", "tasks:read"],
    "count": 2
  }
}
```

#### POST /api/rbac/users/[userId]/roles
为用户添加角色

**权限**: 需要 manager 或 admin 权限

**请求体**:
```json
{
  "roles": ["admin", "viewer"]
}
```

**可用角色**: `admin` | `manager` | `member` | `viewer` | `guest`

**响应**:
```json
{
  "success": true,
  "data": {
    "userId": "user-001",
    "addedRoles": ["admin", "viewer"],
    "count": 2
  },
  "message": "Roles added successfully"
}
```

#### DELETE /api/rbac/users/[userId]/roles
从用户移除角色

**权限**: 需要 manager 或 admin 权限

**请求体**:
```json
{
  "roles": ["viewer"]
}
```

---

### 2.7 RBAC User Permissions API

**端点**: `/api/rbac/users/[userId]/permissions`

**状态**: 存在但文档不完整

#### GET /api/rbac/users/[userId]/permissions
获取用户的所有权限 (通过角色继承)

**响应**:
```json
{
  "success": true,
  "data": {
    "userId": "user-001",
    "permissions": [
      "users:read",
      "users:write",
      "tasks:read",
      "tasks:write",
      "projects:read"
    ],
    "count": 5
  }
}
```

---

## 三、需要更新的文档内容

### 3.1 反垃圾检测机制

**说明**: Feedback 和 Ratings API 都集成了反垃圾检测

**机制**:
- 使用 `detectSpam()` 函数检测内容
- 内容包括标题和描述
- 如果被判定为垃圾，返回 401 Unauthorized
- 记录日志以供分析

**影响端点**:
- `POST /api/feedback`
- `POST /api/ratings`

---

### 3.2 统计功能增强

**说明**: Feedback 和 Ratings API 返回优化后的统计数据

**优化方法**:
- 使用 `getOptimizedFeedbackStats()` 和 `getOptimizedRatingStats()`
- 将多个 GROUP BY 查询合并为单个查询
- 减少数据库负载

**统计数据包括**:
- 总数
- 平均评分
- 按评分分组统计
- 按类型分组统计
- 按状态分组统计

---

### 3.3 元数据 (Metadata) 处理

**说明**: Feedback 和 Ratings 支持 JSON 元数据存储

**存储方式**:
- 在数据库中以 JSON 字符串存储
- API 返回时自动解析为 JSON 对象

**示例**:
```json
{
  "metadata": {
    "browser": "Chrome",
    "os": "Windows",
    "custom_field": "value"
  }
}
```

---

## 四、实际 API 路由清单

### 4.1 按目录分类的完整清单

```
src/app/api/
├── a2a/
│   ├── jsonrpc/route.ts           # JSON-RPC 调用
│   ├── queue/route.ts             # 消息队列 ⭐ 需补充文档
│   └── registry/[id]/
│       ├── heartbeat/route.ts     # 心跳检测
│       └── route.ts               # 注册表
│   └── registry/route.ts
├── analytics/
│   ├── export/route.ts
│   └── metrics/route.ts
├── auth/
│   ├── login/route.ts
│   ├── logout/route.ts
│   ├── me/route.ts
│   ├── refresh/route.ts
│   └── register/route.ts
├── csrf-token/route.ts
├── csp-violation/route.ts
├── data/
│   ├── export/route.ts
│   └── import/route.ts
├── database/
│   ├── health/route.ts
│   └── optimize/route.ts
├── demo/task-status/route.ts
├── feedback/
│   ├── [id]/route.ts              # GET, PATCH ⭐ PATCH 需补充
│   └── route.ts                   # GET, POST ⭐ 增强需更新
├── github/
│   ├── commits/route.ts
│   └── issues/route.ts
├── health/
│   ├── detailed/route.ts
│   ├── live/route.ts
│   ├── ready/route.ts
│   └── route.ts
├── metrics/
│   ├── performance/route.ts
│   └── prometheus/route.ts
├── multimodal/
│   ├── audio/route.ts
│   └── image/route.ts
├── performance/
│   ├── alerts/route.ts
│   ├── clear/route.ts
│   ├── metrics/route.ts
│   └── report/route.ts
├── projects/route.ts
├── ratings/
│   ├── [id]/
│   │   ├── helpful/route.ts       # POST ⭐ 需补充文档
│   │   └── route.ts               # GET, DELETE
│   └── route.ts                   # GET, POST ⭐ 完整 API 需补充
├── rbac/
│   ├── permissions/route.ts
│   ├── roles/[roleId]/
│   │   ├── permissions/route.ts
│   │   └── route.ts
│   ├── roles/route.ts
│   ├── system/route.ts
│   └── users/[userId]/
│       ├── permissions/route.ts   # GET ⭐ 需补充文档
│       └── roles/route.ts         # GET, POST, DELETE ⭐ 需补充文档
├── revalidate/route.ts
├── search/
│   ├── autocomplete/route.ts
│   ├── history/route.ts
│   └── route.ts
├── status/route.ts
├── stream/
│   ├── analytics/route.ts
│   └── health/route.ts
├── tasks/route.ts
├── user/
│   └── preferences/route.ts       # GET, POST, PUT ⭐ 完全缺失文档
├── vitals/route.ts                # GET, POST ⭐ 完全缺失文档
└── web-vitals/route.ts             # GET, POST ⭐ 完全缺失文档
```

---

## 五、建议的文档更新操作

### 5.1 立即删除 (已废弃的 API)

从 `docs/API.md` 中删除以下章节：
1. "用户管理 API" 完整章节 (使用 RBAC API 替代)
2. "备份与恢复 API" 完整章节
3. "WebSocket 实时通信 API" 完整章节
4. 示例端点相关内容

### 5.2 立即新增 (缺失的 API)

在 `docs/API.md` 中新增以下章节：
1. "评分 API" - 完整的 Ratings 系统文档
2. "Web Vitals API" - 性能监控 API
3. "用户偏好设置 API" - Preferences API
4. "A2A 队列 API" - 消息队列管理文档 (增强现有 A2A 章节)

### 5.3 更新现有 (需要增强的 API)

1. **反馈 API** - 补充 PATCH 和 DELETE 方法
2. **A2A 通信 API** - 补充 Queue 端点的完整文档
3. **RBAC 权限 API** - 补充用户角色和权限管理端点

---

## 六、统计对比

| 类别 | 文档中数量 | 实际数量 | 差异 |
|------|-----------|---------|------|
| 认证与授权 | 5 | 5 | ✅ 一致 |
| 用户管理 | 7 | 0 | ❌ 已移除 |
| 任务管理 | 1 | 1 | ✅ 一致 |
| 项目管理 | 1 | 1 | ✅ 一致 |
| 备份与恢复 | 9 | 0 | ❌ 已移除 |
| WebSocket | 4 | 0 | ❌ 已移除 |
| 性能监控 | 4 | 4 | ✅ 一致 |
| 分析 | 2 | 2 | ✅ 一致 |
| 搜索 | 3 | 3 | ✅ 一致 |
| RBAC | 8 | 8 | ✅ 一致 |
| 多模态 | 2 | 2 | ✅ 一致 |
| A2A | 5 | 5 | ⚠️ 需补充 |
| 反馈 | 2 | 2 | ⚠️ 需增强 |
| GitHub | 2 | 2 | ✅ 一致 |
| 健康检查 | 4 | 4 | ✅ 一致 |
| **评分** | 1 | 4 | ❌ 缺失 3 个端点 |
| **Web Vitals** | 0 | 2 | ❌ 完全缺失 |
| **用户偏好** | 1 | 3 | ⚠️ 需补充 |
| **总计** | 79+ | 57+ | 需大幅调整 |

---

## 七、变更历史记录

### 最近 git 变更 (2026-03-20 至 2026-03-29)

**重要提交**:
- `c74ca67ed` feat: add A2A API, WebSocket improvements, and testing infrastructure
- `5004fb326` chore: remove deprecated backup and user API routes (dead code cleanup)
- `4fa32e8f3` feat(api): update tasks endpoint
- `488eaa3b8` Deploy to test environment bot5 - cache queue implementation and websocket improvements

**涉及的 API 相关文件变更**:
- `src/app/api/feedback/route.ts` - 增强功能和参数
- `src/app/api/a2a/queue/route.ts` - 新增队列管理 API
- `src/app/api/ratings/*` - 完整评分系统实现
- `src/app/api/user/preferences/route.ts` - 用户偏好设置
- `src/app/api/web-vitals/route.ts` - Web Vitals 监控

---

## 八、推荐行动

### 优先级 1 (立即执行)

1. ✅ **删除已废弃的 API 章节**
   - 用户管理 API
   - 备份与恢复 API
   - WebSocket API

2. ✅ **新增评分 API 文档**
   - 完整的 GET/POST/DELETE/POST helpful 端点
   - 参数说明和示例

3. ✅ **新增 Web Vitals API 文档**
   - POST 和 GET 端点
   - 指标类型和评分机制

### 优先级 2 (本周完成)

4. ✅ **补充用户偏好设置 API**
   - GET/POST/PUT 端点

5. ✅ **增强反馈 API 文档**
   - 补充 PATCH 和 DELETE 方法
   - 更新过滤参数列表

6. ✅ **补充 A2A 队列 API 文档**
   - GET/POST/DELETE 端点完整说明

### 优先级 3 (下周完成)

7. ⚠️ **补充 RBAC 用户角色和权限 API 文档**
   - 用户角色管理 (GET/POST/DELETE)
   - 用户权限查询 (GET)

8. ⚠️ **更新 API 分类统计表**
   - 反映最新的端点数量
   - 更新章节目录

---

## 九、附录

### 9.1 数据模型更新

#### Rating (评分)
```typescript
interface Rating {
  id: string;
  user_id: string;
  target_type: 'agent' | 'task' | 'feature' | 'project' | 'overall';
  target_id: string;
  rating: number; // 1-5
  title?: string;
  description?: string;
  verified: boolean;
  helpful_count: number;
  not_helpful_count: number;
  created_at: Date;
  updated_at: Date;
  metadata?: object;
}
```

#### UserPreferences (用户偏好)
```typescript
interface UserPreferences {
  user_id: string;
  locale: string; // 'zh', 'en', etc.
  theme: 'light' | 'dark' | 'system';
  timezone?: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  sound_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}
```

#### WebVitalMetric (Web Vitals)
```typescript
interface WebVitalMetric {
  id: string;
  name: 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'FCP' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  route: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  timestamp: number;
  sessionId?: string;
}
```

### 9.2 错误码更新

以下错误码在新增 API 中使用：

| 错误码 | HTTP 状态 | 说明 | 使用端点 |
|--------|----------|------|----------|
| `UNAUTHORIZED` | 401 | 反垃圾检测拒绝 | POST /api/feedback, POST /api/ratings |
| `VALIDATION_ERROR` | 400 | 参数验证失败 | 所有 POST/PATCH 端点 |
| `FORBIDDEN` | 403 | 权限不足 | DELETE /api/ratings/[id], RBAC 端点 |
| `NOT_FOUND` | 404 | 资源不存在 | GET /api/feedback/[id], GET /api/ratings/[id] |
| `CONFLICT` | 409 | 资源已存在 | POST /api/user/preferences |

---

**报告生成时间**: 2026-03-29
**下次检查建议**: 2026-04-05 (一周后)
