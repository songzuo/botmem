# 多租户架构审查报告

**审查人**: 架构师  
**日期**: 2026-04-03  
**项目路径**: /root/.openclaw/workspace/7zi-project  
**版本目标**: v1.10

---

## 一、审查范围

本次审查涵盖以下内容：
1. 已完成的多租户实现工作（检查实际代码）
2. 多智能体系统目录结构 (`src/lib/multi-agent/`)
3. 与规划文档 `MULTI_TENANT_ARCHITECTURE_ANALYSIS.md` 的差距分析
4. 风险点识别
5. v1.10 版本架构改进建议

---

## 二、项目结构概览

### 2.1 代码仓库分布

| 仓库 | 路径 | 主要功能 |
|------|------|----------|
| 7zi-project | `/root/.openclaw/workspace/7zi-project` | 多智能体编排核心库 |
| 7zi-frontend | `/root/.openclaw/workspace/7zi-frontend` | 前端应用（认证、权限、UI） |

### 2.2 核心目录结构

```
7zi-project/src/lib/
├── a2a/                    # Agent-to-Agent 通信协议
│   ├── A2AProtocol.ts      # 协议核心 (200 行)
│   ├── A2AClient.ts        # 客户端
│   └── A2AServer.ts        # 服务端
├── agents/                 # 智能体管理
│   └── AgentRegistry.ts    # 智能体注册表 (150 行)
├── multi-agent/            # 多智能体编排
│   ├── MultiAgentOrchestrator.ts  # 编排器 (250 行)
│   └── index.ts
├── performance/            # 性能监控
│   ├── incremental-anomaly-detector.ts
│   └── alerting/channels/
├── monitoring/             # 基础监控
│   └── monitor.ts
└── utils/                  # 工具函数
```

```
7zi-frontend/src/lib/
├── auth.ts                 # 认证工具函数 (350 行)
├── permissions.ts          # RBAC 权限系统 (750 行)
├── db/                     # 数据存储
├── services/               # 服务层
├── rate-limit/             # 限流
├── security/               # 安全模块
└── workflows/              # 工作流
```

---

## 三、实际实现状态

### 3.1 ✅ 已实现功能

| 功能模块 | 位置 | 行数 | 状态 |
|----------|------|------|------|
| 多智能体编排 | `multi-agent/MultiAgentOrchestrator.ts` | 250 | ✅ 完成 |
| 智能体注册表 | `agents/AgentRegistry.ts` | 150 | ✅ 完成 |
| A2A 通信协议 | `a2a/A2AProtocol.ts` | 200 | ✅ 完成 |
| 用户认证 | `7zi-frontend/src/lib/auth.ts` | 350 | ✅ 完成 |
| RBAC 权限 | `7zi-frontend/src/lib/permissions.ts` | 750 | ✅ 完成 |
| 增量异常检测 | `performance/incremental-anomaly-detector.ts` | - | ✅ 完成 |

### 3.2 ❌ 未实现功能（与规划文档对比）

根据 `MULTI_TENANT_ARCHITECTURE_ANALYSIS.md` 规划，以下功能**尚未实现**：

| 功能模块 | 规划路径 | 状态 | 影响 |
|----------|----------|------|------|
| 租户服务 | `src/lib/tenant/service.ts` | ❌ 不存在 | 无法创建/管理租户 |
| 租户中间件 | `src/lib/tenant/middleware.ts` | ❌ 不存在 | 无法隔离租户请求 |
| 计费服务 | `src/lib/billing/service.ts` | ❌ 不存在 | 无法计费和配额管理 |
| 数据库迁移 | `src/lib/db/migrations/001_multi_tenant.sql` | ❌ 不存在 | 无租户表结构 |
| 增强权限（租户隔离）| `src/lib/auth/enhanced-permissions.ts` | ❌ 不存在 | 权限是全局的 |
| 分布式缓存（租户隔离）| `src/lib/cache/distributed/` | ❌ 不存在 | 缓存无租户隔离 |
| 审计服务 | `src/lib/security/audit.ts` | ❌ 不存在 | 无审计日志 |
| 加密服务 | `src/lib/security/encryption.ts` | ❌ 不存在 | 无租户密钥管理 |

---

## 四、关键问题分析

### 4.1 🔴 P0 严重问题

#### 问题 1: 权限系统缺少租户隔离

**当前实现** (`7zi-frontend/src/lib/permissions.ts`):

```typescript
// 用户权限是全局的，没有 tenant_id
export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  permissions: Permission[]
  createdAt: Date
  updatedAt: Date
}

// 角色定义也是全局的
export const SYSTEM_ROLES: RoleDefinition[] = [
  SUPER_ADMIN_ROLE,  // 全局超级管理员
  ADMIN_ROLE,
  // ...
]
```

**问题**:
- 用户 A 在租户 1 获得的管理员权限，在租户 2 也生效
- 无法实现"租户 A 的管理员，在租户 B 只是普通用户"
- 数据隔离无法保证

**影响范围**: 所有跨租户访问场景

#### 问题 2: 无租户上下文管理

**缺失组件**:
- `TenantRequest` 类型
- `tenantMiddleware` 中间件
- `TenantContext` 服务

**影响**:
- API 请求无法识别租户
- 数据查询无法自动添加租户过滤
- 缓存无法按租户隔离

#### 问题 3: 数据库无租户表结构

**缺失表结构**:
```sql
-- 不存在
CREATE TABLE tenants (...);
CREATE TABLE tenant_members (...);
CREATE TABLE subscriptions (...);
CREATE TABLE usage_records (...);
```

**影响**: 无法存储租户数据和计费信息

### 4.2 🟡 P1 中等问题

#### 问题 4: 智能体编排缺少租户隔离

**当前实现** (`MultiAgentOrchestrator.ts`):

```typescript
// Agent 没有 tenant_id
export interface Agent {
  id: string;
  name: string;
  capabilities: string[];
  status: 'online' | 'offline' | 'busy';
  currentLoad: number;
  metadata?: Record<string, unknown>;
}

// 任务也没有 tenant_id
export interface Task {
  id: string;
  title: string;
  requiredCapabilities: string[];
  // ...
}
```

**影响**: 
- 租户 A 的智能体可能处理租户 B 的任务
- 无法实现租户级智能体池

#### 问题 5: A2A 协议无租户上下文

**当前实现**:
```typescript
export interface A2AMessage {
  id: string;
  from: string;  // 无 tenant_id
  to: string;
  type: 'request' | 'response' | 'notification' | 'error';
  payload: unknown;
  // ...
}
```

**影响**: 跨租户消息无法隔离

### 4.3 🟢 P2 轻微问题

#### 问题 6: 缺少租户级配置

- 无租户级限流配置
- 无租户级缓存策略
- 无租户级功能开关

---

## 五、架构差距总结

### 5.1 规划 vs 实现对比

```
规划文档描述的架构:
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                             │
│  /api/v1/tenants/*  /api/v1/billing/*  /api/v1/auth/*     │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Middleware Layer                        │
│  tenantMiddleware → authMiddleware → permissionMiddleware    │
│  → quotaMiddleware → auditMiddleware                        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                           │
│  TenantService │ BillingService │ EnhancedPermission        │
└─────────────────────────────────────────────────────────────┘

实际实现:
┌─────────────────────────────────────────────────────────────┐
│                     编排层 (无租户隔离)                       │
│  MultiAgentOrchestrator │ AgentRegistry                     │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   通信层 (无租户隔离)                        │
│              A2AProtocol │ A2AClient                        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                 前端权限层 (无租户隔离)                       │
│           auth.ts │ permissions.ts (全局权限)               │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 功能完成度评估

| 功能领域 | 规划功能 | 实际完成 | 完成度 |
|----------|----------|----------|--------|
| 租户管理 | 创建/删除/切换租户 | 0% | 0% |
| 租户成员管理 | 邀请/移除/角色分配 | 0% | 0% |
| 租户权限隔离 | 租户级角色和权限 | 全局权限 | 30% |
| 计费系统 | 订阅/用量/账单 | 0% | 0% |
| 配额管理 | 租户级资源限制 | 0% | 0% |
| 审计日志 | 租户隔离审计 | 0% | 0% |
| 智能体编排 | 并行/串行执行 | ✅ 完成 | 100% |
| A2A 通信 | 消息传递 | ✅ 完成 | 100% |

**整体多租户功能完成度: ~15%**

---

## 六、风险评估

### 6.1 高风险项

| 风险 | 描述 | 影响 | 建议措施 |
|------|------|------|----------|
| 数据泄露 | 无租户隔离，用户可能看到其他租户数据 | 🔴 严重 | P0 优先实现租户隔离 |
| 权限绕过 | 全局权限可能被滥用 | 🔴 严重 | 为权限添加 tenant_id |
| 计费不准确 | 无用量追踪，无法计费 | 🟠 高 | 实现计费服务 |

### 6.2 技术债务

| 债务 | 当前状态 | 建议 |
|------|----------|------|
| 权限系统改造 | 全局权限 | 需要重构为租户隔离架构 |
| 数据库 Schema | 无租户表 | 需要迁移脚本 |
| API 中间件 | 无租户上下文 | 需要添加租户中间件 |

---

## 七、v1.10 架构改进建议

### 7.1 第一阶段：基础租户架构（v1.10）

#### 7.1.1 数据库层

```sql
-- 1. 租户表
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  settings TEXT, -- JSON
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. 租户成员表
CREATE TABLE tenant_members (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE(tenant_id, user_id)
);

-- 3. 为现有用户表添加 tenant_id
ALTER TABLE users ADD COLUMN tenant_id TEXT;
CREATE INDEX idx_users_tenant ON users(tenant_id);
```

#### 7.1.2 租户服务

```typescript
// src/lib/tenant/service.ts
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'deleted';
  settings: TenantSettings;
}

export class TenantService {
  async createTenant(data: CreateTenantInput): Promise<Tenant>;
  async getTenant(tenantId: string): Promise<Tenant | null>;
  async getTenantBySlug(slug: string): Promise<Tenant | null>;
  async updateTenant(tenantId: string, data: UpdateTenantInput): Promise<Tenant>;
  async deleteTenant(tenantId: string): Promise<void>;
  
  // 成员管理
  async addMember(tenantId: string, userId: string, role: string): Promise<void>;
  async removeMember(tenantId: string, userId: string): Promise<void>;
  async updateMemberRole(tenantId: string, userId: string, role: string): Promise<void>;
}
```

#### 7.1.3 租户中间件

```typescript
// src/lib/tenant/middleware.ts
export interface TenantRequest extends NextRequest {
  tenantContext?: {
    tenantId: string;
    tenant: Tenant;
    role: string;
  };
}

export async function tenantMiddleware(req: TenantRequest): Promise<Response | null> {
  // 1. 从 header/subdomain/path 提取 tenantId
  const tenantId = extractTenantId(req);
  
  // 2. 加载租户信息
  const tenant = await tenantService.getTenant(tenantId);
  
  // 3. 注入租户上下文
  req.tenantContext = {
    tenantId,
    tenant,
    role: await getUserRole(tenantId, userId)
  };
  
  return null; // 继续
}
```

#### 7.1.4 权限系统改造

```typescript
// 改造 permissions.ts
export interface UserWithRoles extends User {
  tenantId: string;  // 新增
  roleIds: string[];
  roles: RoleDefinition[];
}

// 权限检查增加租户上下文
export function hasPermission(
  user: UserWithRoles, 
  permission: Permission,
  tenantContext?: TenantContext  // 新增
): boolean {
  // 1. 检查是否在正确的租户上下文中
  if (tenantContext && user.tenantId !== tenantContext.tenantId) {
    return false;
  }
  
  // 2. 检查租户内角色权限
  // ...
}
```

### 7.2 第二阶段：智能体租户隔离（v1.11）

```typescript
// Agent 添加 tenant_id
export interface Agent {
  id: string;
  tenantId: string;  // 新增
  name: string;
  capabilities: string[];
  status: 'online' | 'offline' | 'busy';
  currentLoad: number;
}

// Task 添加 tenant_id
export interface Task {
  id: string;
  tenantId: string;  // 新增
  title: string;
  requiredCapabilities: string[];
}

// 编排器过滤租户智能体
class MultiAgentOrchestrator {
  async executeParallel(agents: Agent[], task: Task, options?: ExecutionOptions) {
    // 过滤同租户智能体
    const tenantAgents = agents.filter(a => a.tenantId === task.tenantId);
    // ...
  }
}
```

### 7.3 第三阶段：计费与配额（v1.12）

```typescript
// src/lib/billing/service.ts
export class BillingService {
  // 订阅管理
  async getSubscription(tenantId: string): Promise<Subscription | null>;
  async createSubscription(tenantId: string, plan: string): Promise<Subscription>;
  
  // 用量追踪
  async recordUsage(tenantId: string, type: string, amount: number): Promise<void>;
  async getUsage(tenantId: string, period: string): Promise<Usage>;
  
  // 配额检查
  async checkQuota(tenantId: string, resource: string): Promise<boolean>;
}
```

---

## 八、实施优先级

### 8.1 v1.10 必须完成

| 优先级 | 任务 | 工作量 | 负责人 |
|--------|------|--------|--------|
| P0 | 创建租户数据表 | 2h | 后端 |
| P0 | 实现 TenantService | 4h | 后端 |
| P0 | 实现 tenantMiddleware | 3h | 后端 |
| P0 | 改造权限系统（添加 tenant_id） | 6h | 后端 |
| P1 | 租户成员管理 API | 4h | 后端 |
| P1 | 前端租户切换 UI | 4h | 前端 |

### 8.2 后续版本

| 版本 | 功能 | 预计工作量 |
|------|------|------------|
| v1.11 | 智能体租户隔离 | 16h |
| v1.12 | 计费与配额系统 | 24h |
| v1.13 | 审计日志 | 8h |
| v1.14 | 租户数据导出 | 8h |

---

## 九、总结

### 9.1 核心发现

1. **多租户功能几乎未实现**：规划文档描述的租户服务、计费系统、审计日志等均不存在
2. **权限系统是全局的**：缺少 tenant_id，无法实现租户隔离
3. **智能体编排已完成**：核心的编排器和 A2A 协议功能完整
4. **需要架构改造**：现有系统需要添加租户上下文才能支持多租户

### 9.2 建议

1. **立即开始租户基础设施**：创建租户表和服务是所有后续工作的基础
2. **渐进式改造**：先实现核心租户隔离，再扩展到计费和审计
3. **测试驱动**：为租户隔离编写专门的测试用例
4. **文档同步**：更新规划文档以反映实际进度

---

**报告生成时间**: 2026-04-03 14:30 GMT+2  
**架构师**: subagent:multi-tenant-arch-review  
**状态**: 审查完成，建议立即启动 v1.10 开发
