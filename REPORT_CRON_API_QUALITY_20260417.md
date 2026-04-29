# API 路由质量审查报告

**审查时间**: 2026-04-17 21:20 GMT+2  
**审查范围**: `src/app/api/` 目录下的关键 API 路由  
**审查目的**: 检查错误处理完善度、权限验证一致性

---

## 📋 审查摘要

| 指标 | 数量 |
|------|------|
| 审查路由总数 | 20+ |
| 严重问题 (🔴) | 8 |
| 中等问题 (🟡) | 12 |
| 轻微问题 (🟢) | 6 |

---

## 🔴 严重问题

### 1. `/api/health` - 健康检查端点无认证保护

**文件**: `src/app/api/health/route.ts`

```typescript
export async function GET(request: Request) {
  // ... 直接返回系统信息，无任何认证
  const response = {
    status: health.status,
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    uptime: `${Math.round(systemInfo.uptime / 60)} minutes`,
    build: buildInfo,
    system: { ...systemInfo },  // 暴露内存、CPU 等敏感信息
    health: { issues: health.issues, warnings: health.warnings },
  }
}
```

**问题**:
- 任何人都能获取服务器系统信息（内存使用、CPU、负载等）
- 泄露内部 IP 地址、Node.js 版本、平台架构等敏感信息
- 无认证但包含敏感的 `issues` 和 `warnings` 诊断数据

**建议**: 添加简单的认证检查（如 API Key 或 IP 白名单），或限制 `/api/health` 仅返回基本状态而不暴露系统详情。

---

### 2. `/api/alerts/rules` 及其子路由缺少权限控制

**文件**: 
- `src/app/api/alerts/rules/route.ts`
- `src/app/api/alerts/rules/[id]/route.ts`

```typescript
// alerts/rules/route.ts - POST 无认证
export const POST = withCSRF(async (request: NextRequest) => {
  // 任何人都能创建告警规则
  const newRule: AlertRule = { ... }
  alertRules.push(newRule)
})

// alerts/rules/[id]/route.ts - GET/PUT/DELETE 无认证
export async function GET(request: NextRequest, { params }) {
  const rule = rules.find((r: AlertRule) => r.id === id)
  return NextResponse.json(rule)  // 直接返回完整规则
}
```

**问题**:
- 所有告警规则操作（CRUD）均无认证
- 用户可任意创建、修改、删除告警规则
- GET 返回完整规则数据，无权限过滤

**建议**: 对所有非 GET 请求添加 `withAuth` 或 `withAdmin` 中间件。

---

### 3. `/api/ai/conversations` 缺少认证

**文件**: `src/app/api/ai/conversations/route.ts`

```typescript
export async function GET(request: NextRequest) {
  // 无认证，直接返回所有对话
  let conversations = Array.from(conversationsStore.values())
  // ...
  return createSuccessResponse({ conversations, total, limit, offset })
}
```

**问题**: 任何用户可访问所有 AI 对话记录。

**建议**: 添加 `withAuth` 认证。

---

### 4. `/api/rooms/[id]` 使用可伪造的 Header 进行身份验证

**文件**: `src/app/api/rooms/[id]/route.ts`

```typescript
const userId = request.headers.get('x-user-id') || 'dev-user'
// 检查是否是房主
if (room.ownerId !== userId) {
  return createForbiddenError('Only the room owner can delete the room')
}
```

**问题**: `x-user-id` Header 可被客户端任意设置，无法真正验证身份。攻击者只需伪造此 Header 即可删除他人房间。

**建议**: 使用 JWT Token 验证（如 `authenticateJWT`），从 Token 中解析真实用户 ID。

---

## 🟡 中等问题

### 5. 错误响应格式不一致

**使用 `createErrorResponse` (规范)**:
- `/api/auth/route.ts`
- `/api/feedback/route.ts`
- `/api/notifications/[id]/route.ts`
- `/api/projects/route.ts`

**使用裸 `NextResponse.json` (不规范)**:
- `/api/alerts/rules/[id]/route.ts` - GET/PUT/DELETE 全用裸格式
- `/api/workflows/[workflowId]/rollback/route.ts`
- `/api/a2a/registry/route.ts` - 混合使用

```typescript
// ❌ 不一致 - 直接返回
return NextResponse.json(
  { error: 'Alert rule not found' },
  { status: 404 }
)

// ✅ 规范 - 使用统一错误处理
return createNotFoundError('Alert rule not found')
```

**影响**: 前端无法依赖统一的错误处理模式。

**建议**: 统一使用 `lib/api/error-handler.ts` 中的 `createErrorResponse` 系列函数。

---

### 6. `/api/a2a/registry` 缺少 CSRF 保护

**文件**: `src/app/api/a2a/registry/route.ts`

```typescript
// POST 注册新代理 - 有 JWT 认证但无 CSRF 保护
export async function POST(request: NextRequest) {
  const auth = await authenticateJWT(request)
  if (!auth.authenticated) { return NextResponse.json({...}, { status: 401 }) }
  
  // 直接处理注册请求，无 CSRF 验证
  const agent = agentScheduler.registerAgent(...)
  return createSuccessResponse({ agent }, 201)
}
```

**问题**: 虽然有 JWT 认证，但缺少 CSRF 保护，存在跨站请求风险。

**建议**: 对 POST/PUT/DELETE 添加 `withCSRF` 包装。

---

### 7. `/api/ai/chat/stream` 使用 GET 处理流式请求

**文件**: `src/app/api/ai/chat/stream/route.ts`

```typescript
// 使用 GET 处理流式请求（危险）
export async function GET(request: NextRequest) {
  const message = url.searchParams.get('message') || ''
  // ...
}
```

**问题**: 
- 将敏感数据放在 URL 参数中（浏览器历史、日间日志会记录）
- GET 请求不应该有请求体，而聊天内容通过 URL 传递会受限

**建议**: 使用 POST 方法处理聊天请求，请求体传递消息内容。

---

### 8. `/api/feedback` DELETE 方法实现异常

**文件**: `src/app/api/feedback/route.ts`

```typescript
export const DELETE = withAdmin(withCSRF(handleDELETE))

async function handleDELETE(request: NextRequest, context: { user: AuthResult }) {
  const { searchParams } = new URL(request.url)
  const feedbackId = searchParams.get('id')  // DELETE 从 query string 获取 ID

  if (!feedbackId) {
    return createBadRequestError('缺少反馈 ID')
  }
  // ...
}
```

**问题**: RESTful 规范中 DELETE 应使用路径参数而非 query string。

**建议**: 使用 `/api/feedback/[id]` 路由的 DELETE 方法。

---

### 9. `/api/data/import` 使用不同认证方式

**文件**: `src/app/api/data/import/route.ts`

```typescript
// 使用 authMiddleware（中间件）
export async function POST(request: NextRequest) {
  const authResponse = authMiddleware(request)
  if (authResponse.status !== 200) { return authResponse }
  // ...
}
```

**问题**: 其他路由使用 `withAuth` HOC 或 `authenticateJWT`，此路由使用 `authMiddleware`，不一致。

**建议**: 统一使用 `authenticateJWT` 或 `withAuth`。

---

### 10. `/api/auth/route.ts` 硬编码演示凭证

**文件**: `src/app/api/auth/route.ts`

```typescript
const isAuthenticated = username === 'admin' && password === 'password123'
// TODO: 实际的认证逻辑
```

**问题**: 代码中有 TODO 注释说明这是演示代码，但可能被误用于生产。

**建议**: 确保生产环境不使用此路由，或删除此文件。

---

## 🟢 轻微问题

### 11. `/api/workflows/[workflowId]/rollback` 输入验证不足

**文件**: `src/app/api/workflows/[workflowId]/rollback/route.ts`

```typescript
const { versionId, rollbackBy, rollbackReason } = body

if (!versionId) { return NextResponse.json({ error: 'versionId is required' }, { status: 400 }) }
if (!rollbackBy) { return NextResponse.json({ error: 'rollbackBy is required' }, { status: 400 }) }
// rollbackReason 无长度限制
```

**建议**: 对 `rollbackReason` 添加长度限制（如 max 500 字符）。

---

### 12. 装饰器在 Next.js App Router 中的使用

**文件**: 
- `src/app/api/projects/route.ts`
- `src/app/api/users/route.ts`

```typescript
class ProjectController {
  @RequirePermission(ResourceType.PROJECT, ActionType.READ)
  async listProjects(ctx: ApiContext): Promise<NextResponse> {
    // ...
  }
}
```

**问题**: TypeScript 装饰器需要 `experimentalDecorators` 或 `emitDecoratorMetadata` 配置，在 Next.js App Router 中可能不稳定。

**建议**: 验证装饰器在生产环境中正常工作，或改用函数式权限检查。

---

### 13. 缺少 `OPTIONS` 处理

大多数 API 路由没有处理 `OPTIONS` 预检请求，虽然中间件可能处理了 CORS，但在路由层面显式处理更清晰。

---

### 14. 部分路由使用内存存储

`alerts/rules/route.ts`、`workflow rollback/route.ts` 使用内存存储：
- 服务器重启后数据丢失
- 多实例部署时数据不一致

**建议**: 添加注释说明这是演示用途，生产环境需使用数据库。

---

## 📊 权限验证一致性检查

| 路由 | 认证方式 | 授权检查 | CSRF |
|------|----------|----------|------|
| `/api/auth/*` | 演示代码 | ❌ | 部分 |
| `/api/ai/chat` | ❌ | ❌ | ❌ |
| `/api/ai/conversations` | ❌ | ❌ | ❌ |
| `/api/alerts/rules` | ❌ | ❌ | 部分 |
| `/api/feedback` | `withAuth` | ✅ (admin) | ✅ |
| `/api/health` | ❌ | ❌ | N/A |
| `/api/notifications/[id]` | `authenticateJWT` | ✅ | ✅ |
| `/api/projects` | Header only | ✅ | ✅ |
| `/api/rooms/[id]` | Header (可伪造) | ✅ | ❌ |
| `/api/users` | Header only | 装饰器 | ❌ |
| `/api/workflows/.../rollback` | ❌ | ❌ | ❌ |
| `/api/a2a/registry` | JWT | ❌ | ❌ |
| `/api/data/import` | `authMiddleware` | ❌ | ❌ |

---

## ✅ 做得好的方面

1. **统一的错误处理**: `lib/api/error-handler.ts` 设计良好，提供了 `createSuccessResponse` 和各种错误创建函数
2. **CSRF 保护中间件**: `lib/middleware/csrf.ts` 实现完善
3. **速率限制**: 通过 `withRateLimit` 中间件统一管理
4. **反馈路由**: `/api/feedback` 的实现最规范，认证、授权、CSRF、错误处理都很完整

---

## 📋 改进优先级

### P0 (立即修复)
1. `/api/health` - 添加认证或移除敏感信息
2. `/api/alerts/rules` - 所有操作添加认证
3. `/api/rooms/[id]` - 使用 JWT 而非 Header

### P1 (本周修复)
4. `/api/ai/conversations` - 添加认证
5. 统一所有路由使用 `createErrorResponse`
6. `/api/a2a/registry` - 添加 CSRF 保护

### P2 (计划中)
7. `/api/ai/chat/stream` - 改用 POST
8. 装饰器方案验证和替换
9. 内存存储替换为数据库

---

*报告生成: 2026-04-17 21:20*
