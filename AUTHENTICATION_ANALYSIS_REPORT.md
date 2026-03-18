# 身份验证方案分析报告

生成时间: 2026-03-17
项目: /root/.openclaw/workspace (7zi-project)

---

## 概述

7zi 项目采用多层身份验证体系，支持智能体认证、CSRF 保护、API Key 认证和 JWT Token 认证。

---

## 1. 智能体认证系统 (Agent Authentication)

### 1.1 核心文件

- **认证服务**: `/src/lib/agents/auth-service.ts`
- **中间件**: `/src/lib/agents/middleware.ts`
- **数据仓库**: `/src/lib/agents/repository.ts`
- **钱包管理**: `/src/lib/agents/wallet-repository.ts`

### 1.2 认证机制

#### API Key 认证
- **生成格式**: `sk_agent_[43位Base64URL字符]`
- **存储方式**: SHA256 哈希后存储在数据库
- **用途**: 智能体注册后的主要认证凭证
- **验证流程**:
  1. 客户端提交 API Key
  2. 服务端哈希后与数据库比对
  3. 验证成功后生成 JWT Token

#### JWT Token 认证
- **算法**: HS256 (HMAC-SHA256)
- **密钥来源**: `process.env.JWT_SECRET` 或 `process.env.AGENT_ENCRYPTION_SECRET`
- **Token 类型**:
  - **Access Token**: 有效期 1 小时
  - **Refresh Token**: 有效期 7 天

**Token Payload**:
```json
{
  "sub": "agent_id",
  "role": "DIRECTOR|EXECUTOR|ADMIN|...",
  "permissions": ["read:tasks", "write:tasks", ...],
  "type": "agent"
}
```

### 1.3 智能体角色与权限

**角色层次**:
- `DIRECTOR` - 导演（最高权限）
- `ADMIN` - 管理员
- `EXECUTOR` - 执行者
- `ARCHITECT` - 架构师
- `DESIGNER` - 设计师
- `TESTER` - 测试员
- `FINANCE` - 财务

**权限模式**:
- 精确权限: `read:tasks`
- 通配符权限: `manage:*` (所有管理权限)
- 层级权限: `*:*` (所有权限)

### 1.4 中间件使用

**认证中间件**:
```typescript
withAgentAuth(request, handler)
```
- 验证 Authorization Bearer Token
- 更新最后活跃时间
- 构建认证上下文

**权限中间件**:
```typescript
// 必须拥有所有指定权限
withPermissions('write:tasks', 'delete:tasks')

// 拥有任一权限即可
withAnyPermission('read:tasks', 'write:tasks')
```

### 1.5 安全特性

1. **API Key 安全**:
   - 客户端明文存储（仅在注册时返回）
   - 服务端哈希存储（SHA256）
   - API Key 生成使用加密安全随机数

2. **Token 刷新机制**:
   - Access Token 短期有效（1小时）
   - Refresh Token 长期有效（7天）
   - 支持无感刷新

3. **状态管理**:
   - 智能体状态：ACTIVE、INACTIVE、OFFLINE
   - 非活跃智能体拒绝认证
   - 认证成功自动更新为 ACTIVE

---

## 2. CSRF 保护系统

### 2.1 核心文件

- **CSRF 工具**: `/src/lib/csrf.ts`
- **API 端点**: `/src/app/api/csrf-token/route.ts`
- **测试**: `/src/lib/__tests__/csrf.test.ts`

### 2.2 CSRF 工作流程

#### Token 生成
```typescript
GET /api/csrf-token
```
- 使用 `crypto.randomBytes(32)` 生成 64 字符十六进制 token
- 存储在 httpOnly cookie 中（`csrf_token`）
- 返回明文 token 给客户端

#### Cookie 配置
```javascript
{
  httpOnly: true,           // 客户端 JS 无法访问
  secure: true,            // 生产环境仅 HTTPS
  sameSite: 'strict',      // 严格同站策略
  path: '/',
  maxAge: 3600             // 1 小时有效期
}
```

#### 客户端使用
```typescript
// 获取 token
const token = await getCsrfToken();

// 创建请求头
const headers = await createCsrfHeaders();
// headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token }
```

#### 服务端验证
```typescript
validateCsrfToken(headerToken, cookieToken)
```
- 比较请求头和 cookie 中的 token
- 使用时间安全比较防止时序攻击
- 要求完全匹配才通过验证

### 2.3 安全特性

1. **时间安全比较**: 使用 `Buffer.equals()` 防止时序攻击
2. **httpOnly Cookie**: XSS 无法窃取 cookie
3. **sameSite=strict**: 防止跨站请求伪造
4. **Token 缓存**: 客户端缓存减少请求
5. **自动刷新**: token 过期后自动重新获取

---

## 3. A2A 协议认证 (Agent-to-Agent)

### 3.1 核心文件

- **JSON-RPC 端点**: `/src/app/api/a2a/jsonrpc/route.ts`
- **A2A 处理器**: `/src/lib/a2a/jsonrpc-handler.ts`
- **Agent Card**: `/src/lib/a2a/agent-card.ts`

### 3.2 认证方式

**当前实现**: CORS 开放访问，无强制认证

```typescript
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

**注意**: Authorization 头已在 CORS 允许列表中，但未强制验证。

### 2.3 建议改进

建议添加以下认证选项：
- JWT Token 验证（与智能体认证统一）
- API Key 验证
- 或者在 Agent Card 中定义自定义认证机制

---

## 4. 密钥管理

### 4.1 环境变量

```bash
# JWT 密钥
JWT_SECRET=your-jwt-secret-key

# 智能体加密密钥
AGENT_ENCRYPTION_SECRET=your-agent-secret-key
```

**密钥回退机制**:
1. 优先使用 `JWT_SECRET`
2. 回退到 `AGENT_ENCRYPTION_SECRET`
3. 最终回退到默认密钥（生产环境应避免）

### 4.2 加密存储

**API Key 加密**:
```typescript
// 加密: AES-256-CBC
function encryptApiKey(apiKey: string, secret: string): string

// 解密: AES-256-CBC
function decryptApiKey(encryptedKey: string, secret: string): string
```

**密钥派生**:
- 使用 `crypto.scryptSync(secret, 'salt', 32)` 派生 256 位密钥
- IV 使用 `crypto.randomBytes(16)` 生成

---

## 5. 钱包系统 (Wallet System)

### 5.1 核心文件

- **钱包仓库**: `/src/lib/agents/wallet-repository.ts`

### 5.2 认证关联

- 智能体注册时自动创建钱包
- 钱包操作需要智能体认证
- 支持余额冻结/解冻机制

### 5.3 交易类型

- `DEPOSIT` - 存款
- `WITHDRAW` - 提款
- `TRANSFER` - 转账
- `CONSUME` - 消费
- `REWARD` - 奖励
- `REFUND` - 退款

---

## 6. 中间件架构

### 6.1 Next.js 全局中间件

**文件**: `/src/middleware.ts`

```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    '/',
    '/(zh|en)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
```

**用途**: 仅处理国际化路由，不涉及认证。

### 6.2 智能体认证中间件

**文件**: `/src/lib/agents/middleware.ts`

**可用中间件**:
1. `withAgentAuth` - 基础认证
2. `withPermissions` - 权限验证（所有权限）
3. `withAnyPermission` - 权限验证（任一权限）

**认证上下文**:
```typescript
interface AgentContext {
  agentId: string;
  role: string;
  permissions: string[];
  requestId: string;
}
```

---

## 7. 安全配置

### 7.1 Cookie 安全

- httpOnly: ✅ (CSRF token)
- Secure: ✅ (生产环境)
- sameSite: strict ✅
- maxAge: 1 小时

### 7.2 CORS 配置

**A2A 端点**:
- Allow-Origin: * (开放)
- Allow-Methods: POST, OPTIONS
- Allow-Headers: Content-Type, Authorization

**建议**: 生产环境限制允许的域名

### 7.3 密钥管理建议

1. **生产环境**:
   - 必须设置 `JWT_SECRET` 和 `AGENT_ENCRYPTION_SECRET`
   - 使用强随机密钥（至少 32 字符）
   - 定期轮换密钥

2. **环境隔离**:
   - 开发环境：使用测试密钥
   - 生产环境：使用生产专用密钥
   - 不同环境使用不同密钥

---

## 8. 测试覆盖

### 8.1 认证测试

- **CSRF 测试**: `/src/lib/__tests__/csrf.test.ts` (完整覆盖)
- **中间件测试**: `/src/lib/agents/__tests__/middleware.test.ts`
- **认证流程测试**: `/src/test/integration/auth-flow.test.ts`
- **CSRF 安全测试**: `/src/test/security/csrf-protection.test.ts`

### 8.2 测试场景

1. ✅ Token 生成与验证
2. ✅ Token 刷新机制
3. ✅ 权限检查
4. ✅ CSRF 流程完整性
5. ✅ 时间安全比较
6. ✅ 并发请求处理
7. ✅ 边界情况处理

---

## 9. 认证流程图

### 9.1 智能体注册流程

```
1. 客户端提交注册请求
   ↓
2. 生成 API Key (sk_agent_xxx)
   ↓
3. 哈希 API Key (SHA256)
   ↓
4. 创建智能体记录
   ↓
5. 创建钱包
   ↓
6. 返回明文 API Key (仅此一次)
```

### 9.2 智能体认证流程

```
1. 客户端提交 API Key
   ↓
2. 哈希 API Key
   ↓
3. 查询数据库验证
   ↓
4. 检查智能体状态
   ↓
5. 生成 JWT Token (Access + Refresh)
   ↓
6. 返回 Token 和智能体信息
```

### 9.3 API 请求流程

```
1. 客户端携带 Authorization: Bearer <token>
   ↓
2. withAgentAuth 验证 Token
   ↓
3. 更新最后活跃时间
   ↓
4. withPermissions 检查权限
   ↓
5. 执行业务逻辑
   ↓
6. 返回响应
```

### 9.4 CSRF 保护流程

```
1. 客户端请求 GET /api/csrf-token
   ↓
2. 服务器生成随机 token
   ↓
3. 设置 httpOnly cookie
   ↓
4. 返回明文 token
   ↓
5. 客户端存储 token
   ↓
6. 提交表单时添加 X-CSRF-Token 头
   ↓
7. 服务端验证 token
   ↓
8. 比较请求头和 cookie
```

---

## 10. 安全建议

### 10.1 高优先级

1. **A2A 端点认证**: 当前开放访问，建议添加认证
2. **CORS 限制**: 生产环境限制允许的域名
3. **默认密钥**: 生产环境必须避免使用默认密钥

### 10.2 中优先级

1. **速率限制**: 添加 API 请求速率限制
2. **Token 黑名单**: 支持撤销已签发的 token
3. **审计日志**: 记录所有认证事件

### 10.3 低优先级

1. **多因素认证**: 为敏感操作添加 MFA
2. **IP 白名单**: 限制智能体访问的 IP
3. **设备指纹**: 检测异常登录

---

## 11. 技术栈总结

### 认证技术

- **JWT**: `jose` 库 (HS256 算法)
- **加密**: Node.js `crypto` 模块 (AES-256-CBC)
- **哈希**: SHA256
- **随机数**: `crypto.randomBytes()`

### 框架和库

- **Web 框架**: Next.js 16 (App Router)
- **数据库**: SQLite (better-sqlite3)
- **中间件**: 自定义 Next.js 中间件
- **JWT 库**: jose

### 测试

- **测试框架**: Vitest
- **覆盖率**: 已有完整的单元测试和集成测试

---

## 12. 相关文档

- **API 文档**: `/API.md`
- **架构文档**: `/ARCHITECTURE.md`
- **组件文档**: `/COMPONENTS.md`
- **安全审计**: `/SECURITY_AUDIT_REPORT.md`

---

## 结论

7zi 项目实现了完整的身份验证体系，包括智能体认证、CSRF 保护、JWT Token 认证和钱包系统。整体设计合理，安全特性良好，但仍有改进空间，特别是 A2A 端点的认证和 CORS 配置。

建议在生产环境中：
1. 严格配置密钥管理
2. 添加速率限制和审计日志
3. 限制 CORS 允许的域名
4. 为 A2A 端点添加认证机制
