# permissions.ts 拆分计划
**生成时间**: 2026-04-22 02:45 UTC  
**负责人**: 🏗️ 架构师  
**目标文件**: `src/lib/permissions.ts` (945行, 22.5KB)  
**状态**: P0 优先级

---

## 一、现状分析

### 1.1 文件规模

| 指标 | 值 |
|------|-----|
| 总行数 | 945 行 |
| 文件大小 | 22.5 KB |
| 导出项 | 50+ 个 (enums, interfaces, classes, functions, constants) |
| 依赖 | `./auth`, `./permissions/types` |
| 被引用 | 40+ 个文件 |

### 1.2 违反的原则

| 原则 | 违反情况 |
|------|---------|
| **单一职责原则 (SRP)** | 一个文件包含 RBAC 模型、权限检查、API 中间件、装饰器、辅助函数 |
| **开放封闭原则 (OCP)** | 添加新权限需要修改单一文件 |
| **接口分离原则 (ISP)** | `PermissionManager` 混合了系统/自定义权限管理 |

### 1.3 当前文件结构

```
src/lib/permissions.ts (945行)
├── 1-145: RBAC 模型定义 (enum ResourceType, ActionType, interfaces)
├── 134-284: 系统权限定义 (SYSTEM_PERMISSIONS)
├── 287-395: 系统角色定义 + PermissionManager 类
├── 400-653: 权限检查函数 (hasPermission, canAccessResource, etc.)
├── 660-854: API 中间件和装饰器 (createPermissionMiddleware, RequirePermission, etc.)
└── 858-945: 辅助函数 (createUserWithRoles, parsePermission, etc.)
```

### 1.4 已存在的模块化基础

```
src/lib/permissions/
├── types.ts        (权限类型定义 - v2版本)
├── rbac.ts         (RBAC 逻辑)
├── repository.ts   (数据访问层)
├── middleware.ts   (中间件)
├── seed.ts         (数据初始化)
├── migrations.ts   (迁移)
└── v2/             (v2 版本)
```

**注意**: `permissions/` 目录已存在且有部分模块化，但 `permissions.ts` (根级) 仍然是单一大文件。

---

## 二、拆分方案

### 2.1 模块划分

将 `permissions.ts` 拆分为 **5 个模块**，每个模块职责单一：

```
src/lib/permissions/
├── index.ts                    # 统一导出 (新建)
├── models.ts                   # RBAC 模型定义 (从 permissions.ts 迁移)
├── constants.ts                # 系统权限和角色定义 (从 permissions.ts 迁移)
├── manager.ts                  # PermissionManager 类 (从 permissions.ts 迁移)
├── checker.ts                  # 权限检查函数 (从 permissions.ts 迁移)
├── decorators.ts               # API 装饰器 (从 permissions.ts 迁移)
├── middleware.ts               # 现有中间件 (已存在)
├── repository.ts               # 数据访问层 (已存在)
├── rbac.ts                     # RBAC 逻辑 (已存在)
├── seed.ts                     # 数据初始化 (已存在)
└── types.ts                    # 类型定义 (已存在)
```

### 2.2 各模块职责

| 模块 | 行数 | 职责 | 复杂度 |
|------|------|------|--------|
| **models.ts** | ~150 | ResourceType, ActionType 枚举; PermissionDefinition, RoleDefinition, PermissionContext, PermissionCheckResult 接口 | 低 |
| **constants.ts** | ~200 | SYSTEM_PERMISSIONS 数组; SUPER_ADMIN_ROLE, ADMIN_ROLE 等角色定义 | 低 |
| **manager.ts** | ~120 | PermissionManager 类 (CRUD 自定义权限/角色) | 中 |
| **checker.ts** | ~200 | hasPermission, canAccessResource, getUserMaxLevel 等函数; UserWithRoles 接口 | 中 |
| **decorators.ts** | ~150 | RequirePermission, RequireAnyPermission 等装饰器; PermissionDeniedError 类 | 中 |
| **middleware.ts** | ~80 | createPermissionMiddleware (已存在，需增强) | 低 |
| **index.ts** | ~50 | 统一导出所有模块 | 低 |

---

## 三、详细实施计划

### Phase 1: 创建新模块文件 (预计 2 小时)

#### Step 1.1: 创建 models.ts

```typescript
// src/lib/permissions/models.ts
export enum ResourceType { ... }
export enum ActionType { ... }
export interface PermissionDefinition { ... }
export interface RoleDefinition { ... }
export interface ResourceAccessRule { ... }
export interface PermissionCheckResult { ... }
export interface PermissionContext { ... }
```

**迁移内容**: permissions.ts 第 21-122 行

#### Step 1.2: 创建 constants.ts

```typescript
// src/lib/permissions/constants.ts
export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [ ... ]
export const SUPER_ADMIN_ROLE: RoleDefinition = { ... }
export const ADMIN_ROLE: RoleDefinition = { ... }
// ... 所有系统角色
export const SYSTEM_ROLES: RoleDefinition[] = [ ... ]
```

**迁移内容**: permissions.ts 第 134-395 行

#### Step 1.3: 创建 manager.ts

```typescript
// src/lib/permissions/manager.ts
export class PermissionManager {
  getAllPermissions(): PermissionDefinition[] { ... }
  getAllRoles(): RoleDefinition[] { ... }
  getRoleById(roleId: string): RoleDefinition | undefined { ... }
  // ... 其他方法
}
export const permissionManager = new PermissionManager()
```

**迁移内容**: permissions.ts 第 403-519 行

#### Step 1.4: 创建 checker.ts

```typescript
// src/lib/permissions/checker.ts
export interface UserWithRoles extends Omit<User, 'roles'> {
  roleIds: string[]
  roles: RoleDefinition[]
}
export function hasPermission(user: UserWithRoles, permission: Permission): boolean { ... }
export function hasAnyPermission(user: UserWithRoles, permissions: Permission[]): boolean { ... }
export function canAccessResource(...): PermissionCheckResult { ... }
export function canExecuteAction(...): PermissionCheckResult { ... }
export function getUserMaxLevel(user: UserWithRoles): number { ... }
export function hasRoleLevel(user: UserWithRoles, minLevel: number): boolean { ... }
```

**迁移内容**: permissions.ts 第 528-653 行

#### Step 1.5: 创建 decorators.ts

```typescript
// src/lib/permissions/decorators.ts
export class PermissionDeniedError extends Error { ... }
export interface ApiContext { ... }
export function RequirePermission(...): Function { ... }
export function RequireAnyPermission(...): Function { ... }
export function RequireAllPermissions(...): Function { ... }
export function RequireRoleLevel(minLevel: number): Function { ... }
```

**迁移内容**: permissions.ts 第 660-854 行

#### Step 1.6: 创建 index.ts

```typescript
// src/lib/permissions/index.ts
export * from './models'
export * from './constants'
export * from './manager'
export * from './checker'
export * from './decorators'
export { createPermissionMiddleware } from './middleware'
```

### Phase 2: 更新权限检查器文件 (预计 1 小时)

#### Step 2.1: 迁移检查函数到 checker.ts

将 `hasPermission`, `hasAnyPermission`, `hasAllPermissions`, `canAccessResource`, `canExecuteAction`, `getUserMaxLevel`, `hasRoleLevel` 迁移到新文件。

#### Step 2.2: 更新 PermissionManager 引用

在 manager.ts 中正确导入 models 和 constants。

### Phase 3: 更新导入引用 (预计 3 小时)

#### Step 3.1: 找出所有引用 permissions.ts 的文件

```bash
grep -r "from.*permissions" src --include="*.ts" | grep -v "permissions/" | sort | uniq
```

#### Step 3.2: 更新导入路径

将所有 `from '@/lib/permissions'` 改为 `from '@/lib/permissions'` (index.ts 自动导出)。

**预计影响文件**: 40+ 个文件 (大部分是类型导入，使用 index.ts 重导出即可)

### Phase 4: 删除旧文件 (预计 0.5 小时)

确认所有引用迁移完成后，删除原来的 `permissions.ts`。

### Phase 5: 测试验证 (预计 2 小时)

#### Step 5.1: TypeScript 类型检查

```bash
npx tsc --noEmit
```

#### Step 5.2: 运行权限相关测试

```bash
npm test -- --grep "permission"
```

#### Step 5.3: 构建验证

```bash
npm run build
```

---

## 四、工作量估算

| 阶段 | 工作量 | 风险 |
|------|--------|------|
| Phase 1: 创建新模块 | 4 小时 | 低 |
| Phase 2: 更新检查器 | 1 小时 | 低 |
| Phase 3: 更新导入 | 3 小时 | 中 (40+ 文件) |
| Phase 4: 删除旧文件 | 0.5 小时 | 低 |
| Phase 5: 测试验证 | 2 小时 | 中 |
| **总计** | **10.5 小时** | |

---

## 五、复杂度评估

### 5.1 迁移复杂度

| 模块 | 行数 | 依赖关系 | 复杂度 |
|------|------|----------|--------|
| models.ts | ~150 | 无依赖 | ⭐ 低 |
| constants.ts | ~200 | 依赖 models | ⭐ 低 |
| manager.ts | ~120 | 依赖 models, constants | ⭐⭐ 中 |
| checker.ts | ~200 | 依赖 models, constants | ⭐⭐ 中 |
| decorators.ts | ~150 | 依赖 models, checker | ⭐⭐ 中 |
| index.ts | ~50 | 聚合导出 | ⭐ 低 |

### 5.2 风险点

1. **循环依赖**: checker.ts 和 decorators.ts 可能有相互引用
2. **导入路径**: 40+ 个文件需要更新导入路径
3. **测试覆盖**: 需要确保权限检查逻辑完全一致

---

## 六、后续优化

拆分完成后，可以进一步优化：

1. **类型系统分离**: 考虑将 `permissions/types.ts` (v2版本) 与 `models.ts` 合并
2. **权限检查中间件**: 增强 `middleware.ts` 支持更多场景
3. **权限缓存**: 在 checker.ts 中添加权限缓存机制
4. **测试覆盖率**: 为每个模块编写单元测试

---

## 七、推荐实施顺序

```
1. models.ts (基础类型)
   ↓
2. constants.ts (依赖 models)
   ↓
3. manager.ts (依赖 models, constants)
   ↓
4. checker.ts (依赖 models, constants)
   ↓
5. decorators.ts (依赖 models, checker)
   ↓
6. index.ts (聚合导出)
   ↓
7. 更新所有导入路径
   ↓
8. 删除原 permissions.ts
   ↓
9. TypeScript 验证 + 测试
```

---

## 八、成功标准

- ✅ 所有权限相关代码分散到 5+ 个职责明确的模块
- ✅ 无循环依赖
- ✅ TypeScript 类型检查通过
- ✅ 权限相关测试全部通过
- ✅ 构建成功 (next build)
- ✅ 原 `permissions.ts` 删除
- ✅ 导入路径更新完成