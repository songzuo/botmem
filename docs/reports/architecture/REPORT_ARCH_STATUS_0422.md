# 7zi-Frontend 架构状态报告

**审查时间**: 2026-04-22  
**审查角色**: 🏗️ 架构师子代理  
**模型**: minimax/MiniMax-M2.7  
**工作目录**: /root/.openclaw/workspace

---

## 📋 执行摘要

**项目版本**: v1.14.0  
**技术栈**: Next.js 16.2 + React 19 + TypeScript + Zustand + Socket.IO  
**总文件数**: 1066+ TypeScript 文件  
**架构评级**: 🟡 **中等健康** — 核心模块完善，但存在架构债务和模块边界模糊问题

---

## 1. 当前架构概览

### 1.1 项目结构

```
7zi-frontend/
├── src/
│   ├── app/                 # Next.js App Router (24个子目录)
│   │   ├── [locale]/       # 国际化路由
│   │   ├── api/            # API 路由 (30+ endpoints)
│   │   ├── dashboard/      # 仪表盘
│   │   ├── admin/          # 管理后台
│   │   └── ...
│   ├── components/         # 组件目录 (25个子目录)
│   │   ├── ui/             # UI 基础组件
│   │   ├── WorkflowEditor/ # 工作流编辑器
│   │   ├── dashboard/      # 仪表盘组件
│   │   ├── mobile/         # 移动端组件
│   │   ├── websocket/      # WebSocket 组件
│   │   └── ...
│   ├── features/           # 功能模块 (10个)
│   │   ├── dashboard/
│   │   ├── websocket/
│   │   ├── collab/
│   │   └── ...
│   ├── lib/                # 工具库 (41个子模块)
│   │   ├── api/            # API 客户端
│   │   ├── websocket/      # WebSocket 管理 (1455行)
│   │   ├── auth/           # 认证
│   │   ├── permissions/    # 权限系统
│   │   ├── performance/    # 性能监控
│   │   ├── workflow/       # 工作流引擎
│   │   ├── ai/             # AI 集成
│   │   ├── agents/         # 智能体系统
│   │   └── ...
│   ├── stores/             # Zustand 状态管理
│   │   ├── websocket-store.ts
│   │   ├── app-store.ts
│   │   ├── auth-store.ts
│   │   ├── notification-store.ts
│   │   ├── permission-store.ts
│   │   └── room-store.ts
│   ├── contexts/           # React Context
│   ├── hooks/              # 自定义 Hooks
│   ├── types/              # TypeScript 类型
│   └── locales/            # 国际化资源
├── public/                  # 静态资源
├── tests/                  # 测试配置
├── e2e/                    # E2E 测试
└── docs/                   # 文档
```

### 1.2 核心模块依赖关系

```
┌─────────────────────────────────────────────────────────────┐
│                      App Router (app/)                       │
│  [locale]/dashboard | admin | rooms | analytics | etc.     │
└────────────────────────┬────────────────────────────────────┘
                         │ imports
┌────────────────────────▼────────────────────────────────────┐
│                   Components (components/)                  │
│  WorkflowEditor | Dashboard | Mobile | WebSocket | etc.    │
└────────────────────────┬────────────────────────────────────┘
                         │ imports
┌────────────────────────▼────────────────────────────────────┐
│                     Features (features/)                    │
│       Dashboard | Collab | WebSocket | MCP | Audit         │
└────────────────────────┬────────────────────────────────────┘
                         │ imports
┌────────────────────────▼────────────────────────────────────┐
│                    Stores (stores/)                         │
│     Zustand: auth | websocket | notification | room        │
└────────────────────────┬────────────────────────────────────┘
                         │ imports
┌────────────────────────▼────────────────────────────────────┐
│                      Lib (lib/)                             │
│  WebSocket Manager (1455L) | API | Auth | Permissions      │
│  Performance | Workflow | AI | Agents | etc. (41 modules)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 核心模块分析

### 2.1 WebSocket 模块 ✅ 完善

**文件**: 
- `src/lib/websocket-manager.ts` (1455行)
- `src/lib/websocket-instance-manager.ts` (347行)
- `src/lib/websocket-compression.ts` (412行)

**功能**:
- 心跳监控 (ping/pong)
- 指数退避重连
- 连接状态管理
- 消息队列
- 性能监控集成
- 消息压缩 (50% 流量减少)
- 连接质量监控
- 重连历史追踪

**评估**: ✅ 架构成熟，功能完整

---

### 2.2 State Management (Zustand) ⚠️ 需优化

**Store 列表**:
| Store | 行数 | 职责 |
|-------|------|------|
| `websocket-store.ts` | 8667 | WebSocket 连接状态 |
| `permission-store.ts` | 14830 | 权限管理 |
| `room-store.ts` | 8006 | 房间管理 |
| `app-store.ts` | 7033 | 应用状态 |
| `auth-store.ts` | 5692 | 认证状态 |
| `notification-store.ts` | 8652 | 通知管理 |

**问题**:
1. `permission-store.ts` 过大 (14830行)，职责过重
2. Store 间依赖关系不清晰
3. 缺少 Store 间通信规范

**评估**: ⚠️ 功能完整但需要重构

---

### 2.3 API Layer ⚠️ 需标准化

**结构**:
```
src/lib/api/
├── error-handler.ts      # API 错误处理
├── error-logger.ts      # 错误日志
└── rooms/               # 房间 API
    ├── client.ts
    ├── store.ts
    └── types.ts
```

**问题**:
1. API 客户端分散（`lib/api/` 和 `lib/api-clients.ts`）
2. 缺少统一的 API 客户端工厂
3. RESTful 规范执行不一致

**评估**: ⚠️ 需要统一 API 抽象层

---

### 2.4 权限系统 ⚠️ 职责过重

**文件**: `src/lib/permissions.ts` (42248行)

**问题**:
1. 单文件过大，42248行
2. 权限逻辑与 UI 组件耦合
3. 测试困难
4. 难以维护

**评估**: ⚠️ P0 优先级重构

---

### 2.5 错误处理 ⚠️ 分散

**错误相关文件**:
- `src/lib/errors.ts` - AppError 类
- `src/lib/api/error-handler.ts` - API 错误处理
- `src/lib/error-reporting/` - 错误报告模块
- `src/components/error-boundary/` - 错误边界组件

**问题**:
1. 错误类型定义重复
2. 错误处理策略不统一
3. Sentry 集成分散

**评估**: ⚠️ 需要统一错误处理架构

---

### 2.6 性能监控 ✅ 完善

**模块**: `src/lib/performance/`
- 性能指标收集
- 异常检测
- 告警系统
- 根因分析
- 预算控制

**评估**: ✅ 架构完整

---

## 3. 架构问题列表 (P0-P2)

### P0 - 紧急

| ID | 问题 | 位置 | 影响 |
|----|------|------|------|
| P0-1 | `permissions.ts` 单文件过大 | `src/lib/permissions.ts` (42248行) | 难以维护、测试困难、编译时间长 |
| P0-2 | Store 职责混乱 | `src/stores/` | 状态同步问题、性能问题 |
| P0-3 | API 层不统一 | `src/lib/api/` | 开发体验差、错误处理不一致 |

### P1 - 高优先级

| ID | 问题 | 位置 | 影响 |
|----|------|------|------|
| P1-1 | 错误类型定义重复 | `errors.ts` vs `api/error-handler.ts` | 类型不一致、维护困难 |
| P1-2 | 组件目录扁平化 | `src/components/` | 新成员难以定位组件 |
| P1-3 | Context 与 Store 混合使用 | `src/contexts/` vs `src/stores/` | 状态管理混乱 |
| P1-4 | 依赖地狱 | `lib/` 模块间 | 循环依赖风险 |

### P2 - 中优先级

| ID | 问题 | 位置 | 影响 |
|----|------|------|------|
| P2-1 | 文档碎片化 | 项目根目录 100+ MD 文件 | 难以找到正确文档 |
| P2-2 | 缺少架构状态追踪 | 无 `state/arch-v2-status.json` | v2 改进进度不透明 |
| P2-3 | Features vs Components 边界模糊 | `src/features/` vs `src/components/` | 代码组织不清晰 |
| P2-4 | i18n 耦合 | 国际化逻辑分散在多个文件 | 维护困难 |

---

## 4. 改进建议

### 4.1 短期 (v1.15.0)

1. **拆分 permissions.ts**
   - 将 42248 行拆分为多个模块
   - 提取权限检查、角色管理、资源保护等独立模块

2. **统一错误处理**
   - 创建 `src/lib/error/` 统一错误类型
   - 统一 Sentry 集成
   - 制定错误处理规范

3. **完善 API 层抽象**
   - 创建统一的 API 客户端工厂
   - 统一错误响应格式

### 4.2 中期 (v2.0)

1. **重构组件目录**
   ```
   components/
   ├── ui/              # 基础 UI 组件 (Button, Modal, etc.)
   ├── layout/          # 布局组件 (Header, Sidebar, etc.)
   ├── features/        # 功能组件 (按 feature 组织)
   │   ├── dashboard/
   │   ├── workflow/
   │   └── ...
   └── shared/          # 跨功能共享组件
   ```

2. **统一状态管理**
   - 制定 Store 通信规范
   - 消除 Store 间循环依赖
   - 考虑使用 Zustand middleware 统一日志/持久化

3. **文档整理**
   - 合并重复文档
   - 建立架构状态追踪文件
   - 创建架构决策记录 (ADR)

### 4.3 长期

1. **微前端架构** (如果项目持续增长)
2. **Module Federation** 实施
3. **CI/CD 架构优化**

---

## 5. 技术债务清单

### 5.1 代码质量

| 项目 | 文件 | 问题 | 估算工作量 |
|------|------|------|-----------|
| 超大文件 | `permissions.ts` | 42248行，单一职责违反 | 3-5 天 |
| 超大文件 | `websocket-manager.ts` | 1455行，可拆分 | 1 天 |
| 超大文件 | `notification-manager.ts` | ~3000行 | 1 天 |
| 超大文件 | `permission-store.ts` | 14830行 | 2-3 天 |

### 5.2 架构债务

| 项目 | 问题 | 估算工作量 |
|------|------|-----------|
| API 层不统一 | 缺少统一抽象 | 2-3 天 |
| 错误处理分散 | 3+ 错误处理位置 | 1-2 天 |
| Store 依赖混乱 | 循环依赖风险 | 2 天 |
| Context/Store 混合 | 状态管理不清晰 | 2-3 天 |

### 5.3 测试债务

| 项目 | 问题 | 估算工作量 |
|------|------|-----------|
| 权限模块测试 | `permissions.ts` 难以测试 | 3-5 天 |
| E2E 测试不稳定 | 偶发性失败 | 1-2 天 |
| 测试覆盖缺口 | 部分模块无测试 | 2-3 天 |

### 5.4 文档债务

| 项目 | 问题 | 估算工作量 |
|------|------|-----------|
| 文档碎片化 | 100+ MD 文件重复 | 1 周 |
| 缺少 API 文档 | OpenAPI/Swagger | 2-3 天 |
| 架构决策无记录 | ADR 缺失 | 持续 |

### 5.5 依赖债务

| 项目 | 问题 | 估算工作量 |
|------|------|-----------|
| 依赖版本过时 | 部分依赖有安全警告 | 1 天 |
| 依赖清理 | 未使用依赖检测 | 0.5 天 |

---

## 6. 总结

### 6.1 架构健康评分

| 维度 | 评分 | 说明 |
|------|------|------|
| **代码组织** | 6/10 | 组件目录需重构 |
| **状态管理** | 6/10 | Store 职责需明确 |
| **API 设计** | 6/10 | 缺少统一抽象 |
| **错误处理** | 5/10 | 分散且重复 |
| **测试覆盖** | 7/10 | 整体较好，局部缺失 |
| **文档质量** | 5/10 | 碎片化严重 |
| **总体** | **6/10** | **中等健康** |

### 6.2 关键风险

1. **P0**: `permissions.ts` 维护成本持续增加
2. **P1**: 架构债务积累影响开发效率
3. **P2**: 文档碎片化导致知识流失

### 6.3 建议行动

| 优先级 | 行动 | 影响 |
|--------|------|------|
| **立即** | 拆分 `permissions.ts` | 降低维护风险 |
| **本周** | 统一错误处理架构 | 提升调试效率 |
| **本月** | 重构组件目录结构 | 提升开发体验 |
| **下季度** | v2.0 架构演进 | 解决根本问题 |

---

**报告生成时间**: 2026-04-22 03:40 GMT+2  
**下次审查建议**: 2026-05-06
