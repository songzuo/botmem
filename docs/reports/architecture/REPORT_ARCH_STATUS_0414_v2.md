# 7zi-frontend 项目架构状态报告

**生成时间:** 2026-04-14 17:50 GMT+2  
**工作区:** `/root/.openclaw/workspace/7zi-frontend`  
**作者:** 🏗️ 架构师子代理

---

## 1. 项目概览

| 指标 | 状态 |
|------|------|
| **当前版本** | v1.13.0 |
| **Next.js** | 16.2.3 (最新) |
| **React** | 19.2.5 (最新) |
| **TypeScript** | 5.9.3 |
| **src/ 目录** | 15 个顶级子目录 |
| **API 路由** | 30+ 个端点 |
| **features/ 模块** | 9 个功能模块 |
| **stores/** | 6 个 Zustand stores |
| **features/websocket/** | 完整的 WebSocket 功能封装 |

---

## 2. 源码目录结构分析

### 2.1 顶级目录 (`src/`)

```
src/
├── app/            # Next.js App Router (页面 + API 路由)
├── components/     # 共享 UI 组件
├── contexts/       # React Context (PermissionContext)
├── features/       # 功能模块 (auth, collab, dashboard, mcp, monitoring, rate-limit, websocket, audit)
├── hooks/          # 自定义 React Hooks
├── lib/            # 核心库 (约 40+ 子模块)
├── locales/        # i18n (en, zh)
├── middleware/     # Next.js 中间件
├── shared/         # 跨包共享代码
├── stores/         # Zustand 状态管理
├── styles/         # 样式文件
├── test/           # 测试工具
└── types/          # 全局类型定义
```

### 2.2 features/ 模块 (功能驱动架构)

| 模块 | 路径 | 职责 |
|------|------|------|
| **auth** | `features/auth/` | 认证功能 (api + lib) |
| **collab** | `features/collab/` | 实时协作 (组件 + hooks) |
| **dashboard** | `features/dashboard/` | 仪表板 (组件 + 服务 + 类型) |
| **mcp** | `features/mcp/` | Model Context Protocol |
| **monitoring** | `features/monitoring/` | 监控功能 (组件 + lib) |
| **rate-limit** | `features/rate-limit/` | 限流 (lib + tests) |
| **websocket** | `features/websocket/` | **WebSocket 功能封装** (hooks + components + lib + message + room) |
| **audit** | `features/audit/` | 审计日志 |
| **...其他** | | |

### 2.3 stores/ 状态管理 (6个Zustand stores)

| Store | 文件 | 状态 |
|-------|------|------|
| `app-store` | `stores/app-store.ts` | ✅ 使用中 |
| `auth-store` | `stores/auth-store.ts` | ✅ 使用中 |
| `notification-store` | `stores/notification-store.ts` | ✅ 使用中 |
| `permission-store` | `stores/permission-store.ts` | ✅ 已迁移 |
| `room-store` | `stores/room-store.ts` | ✅ 使用中 |
| `websocket-store` | `stores/websocket-store.ts` | ✅ 使用中 |

**注意:** PermissionContext → Zustand 迁移已完成（参考 `ZUSTAND-MIGRATION.md`），但 `src/contexts/PermissionContext/` 旧代码仍存在。

---

## 3. API 路由分析

### 3.1 API 路由清单 (30+ 端点)

```
app/api/
├── a2a/            # Agent-to-Agent 协议 (jsonrpc, queue, registry)
├── agents/learning/# AI 智能体学习 API
├── ai/             # AI 对话 (chat/stream, conversations, suggestions)
├── alerts/         # 告警管理 (history, rules)
├── analytics/      # 分析数据 (anomalies, nodes, overview, resources, trends)
├── auth/           # 认证
├── csrf/           # CSRF token
├── data/           # 数据导入
├── feedback/       # 反馈系统
├── health/         # 健康检查
├── mcp/            # MCP RPC
├── notifications/ # 通知系统 (CRUD + enhanced + socket + preferences + stats)
├── performance/    # 性能数据 (alerts, cache, queries, stats)
├── projects/      # 项目管理
├── pwa/           # PWA
├── reports/       # 报告生成
├── rooms/         # 房间系统 (CRUD + join/leave)
├── search/        # 搜索 ⚠️ 含 TODO
├── users/         # 用户管理
└── workflows/     # 工作流 (版本 + 回滚)
```

### 3.2 待实现的 TODO (API层)

| 文件 | TODO 内容 |
|------|----------|
| `app/api/search/route.ts` | `// TODO: 执行搜索` + `// TODO: 获取搜索建议` |
| `app/api/data/import/route.ts` | `// TODO: 实际的数据导入逻辑` + `// TODO: 查询用户的导入历史` |
| `app/api/auth/route.ts` | 5个 TODO (认证逻辑、JWT生成、用户创建、密码验证等) |
| `app/pricing/page.tsx` | `// TODO: Integrate with backend API` |

---

## 4. WebSocket 架构状态

### 4.1 WebSocket 代码分布

WebSocket 功能分散在 **3个位置**，存在架构重复：

| 位置 | 文件 | 行数 | 职责 |
|------|------|------|------|
| **根级 `lib/`** | `lib/websocket-manager.ts` | 1473 | 核心 WebSocket 管理器 |
| | `lib/websocket-instance-manager.ts` | 345 | 实例管理 |
| | `lib/websocket-compression.ts` | 412 | 消息压缩 |
| | `lib/socket.ts` | 44 | Socket.io 封装 |
| **features/** | `features/websocket/lib/` | - | 功能封装层 |
| | `features/websocket/hooks/` | - | React hooks |
| | `features/websocket/components/` | - | UI 组件 |
| **components/** | `components/websocket/` | - | 遗留组件 |
| **stores/** | `stores/websocket-store.ts` | - | Zustand 状态 |
| **API 路由** | `app/api/notifications/socket/route.ts` | - | Socket 端点 |

### 4.2 WebSocket 核心功能

`lib/websocket-manager.ts` (v1.12.2增强版) 提供：
- ✅ 心跳监控 (ping/pong)
- ✅ 指数退避重连
- ✅ 连接状态管理
- ✅ 离线消息队列
- ✅ 性能监控集成
- ✅ 消息压缩 (50% 流量降低)
- ✅ 连接质量监控与告警
- ✅ 重连历史追踪

`features/websocket/hooks/useWebSocketStatus.ts` 提供：
- ✅ 优化的 React Hook
- ✅ 状态变化订阅
- ✅ 统计数据定期更新
- ✅ 自动清理

---

## 5. v2 架构改进完成情况

### 5.1 已完成 ✅

| 改进项 | 状态 | 备注 |
|--------|------|------|
| Next.js 16 + React 19 升级 | ✅ 完成 | Next.js 16.2.3, React 19.2.5 |
| App Router 全面采用 | ✅ 完成 | 无 Pages Router 遗留 |
| React Compiler | ✅ 启用 | annotation 模式 |
| PWA 迁移 | ✅ 完成 | `@ducanh2912/next-pwa` |
| Turbopack 开发 | ✅ 可用 | `next dev --turbopack` |
| Zustand 状态管理 | ✅ 全面采用 | 6个 stores |
| features/ 模块化 | ✅ 完成 | 9个功能模块 |
| 主题系统 v2 | ✅ 完成 | Dark/Light 模式 |
| 移动端优化 | ✅ 完成 | v1.13.0 |
| 通知系统增强 | ✅ 完成 | notification-enhanced.ts |
| 性能监控 Dashboard | ✅ 完成 | v1.12+ |
| A2A 协议支持 | ✅ 实现 | jsonrpc + queue + registry |
| MCP 协议 | ✅ 实现 | Model Context Protocol |
| i18n 国际化 | ✅ 完成 | en + zh |

### 5.2 进行中 🔄

| 改进项 | 状态 | 说明 |
|--------|------|------|
| PermissionContext → Zustand | 🔄 部分完成 | Zustand store 存在，Context 旧代码未清理 |
| WebSocket 架构统一 | 🔄 进行中 | lib/ + features/ 两套并存 |
| API 搜索功能 | 🔄 待实现 | search/route.ts 含 TODO |
| 数据导入功能 | 🔄 待实现 | import/route.ts 含 TODO |
| 认证 API | 🔄 待实现 | auth/route.ts 含 TODO |

### 5.3 待处理 🟡

| 问题 | 优先级 | 说明 |
|------|--------|------|
| `ignoreBuildErrors: true` | 🔴 高 | TypeScript 错误被静默忽略 |
| websocket-manager.ts (1473行) | 🟠 中 | 需拆分 |
| permissions.ts (955行) | 🟠 中 | 需拆分 |
| Notification 多重实现 | 🟠 中 | ~5个通知实现版本 |
| DraftStorage 三份拷贝 | 🟠 中 | db/ + storage/ + execution/ |
| 473处 console.* | 🟡 低 | 需替换为 logger.ts |
| 85+ 文件含 any 类型 | 🟡 低 | 需类型安全化 |
| 服务端 API 误用 | 🔴 高 | `db/feedback-storage.ts` 等使用 `process.cwd()` |

---

## 6. 技术债务总结 (来自 TECH-DEBT.md)

| 类别 | 数量 | 严重程度 |
|------|------|----------|
| 超大文件 (>300行) | 7 | 🟠 |
| 严重重复模块 | 3组 (DraftStorage, Notification, WebSocket) | 🔴 |
| 含 `any` 文件 | 85+ | 🟡 |
| `console.*` 调用 | 473 | 🟡 |
| Manager/Service 类 | 38+ | 🟠 |
| 服务端API误用 | 2处 | 🔴 |

### 技术债务清理路线图

**阶段1** (1-2周): 统一存储层 + 合并Notification系统  
**阶段2** (2-3周): 拆分websocket-manager.ts + permissions.ts  
**阶段3** (持续): 消除any类型 + 统一API客户端

---

## 7. 架构健康评分

| 维度 | 评分 | 说明 |
|------|------|------|
| **模块化** | 8/10 | features/ 模块化完善，lib/ 有一定混乱 |
| **类型安全** | 6/10 | 85+ 文件含any，`ignoreBuildErrors: true` |
| **API 设计** | 7/10 | 30+ 端点，部分TODO未实现 |
| **WebSocket** | 7/10 | 功能完整但架构分散 (3处) |
| **状态管理** | 8/10 | Zustand 全面采用，部分 Context 遗留 |
| **技术债务** | 5/10 | 多个严重重复和服务端API误用 |
| **总体** | **6.8/10** | 项目成熟度高，但存在架构混乱和技术债务 |

---

## 8. 建议优先级

### 🔴 立即处理
1. **修复 `ignoreBuildErrors: true`** — 暴露并修复 TypeScript 错误
2. **删除服务端 API 误用** — `db/feedback-storage.ts` 等文件使用 `process.cwd()`

### 🟠 下个迭代
1. **清理 PermissionContext 遗留代码** (Zustand 已完成迁移)
2. **统一 WebSocket 架构** — 合并 lib/ + features/ 两套
3. **实现 API TODO** — search、import、auth 端点

### 🟡 持续改进
1. 拆分超大文件 (websocket-manager, permissions)
2. 统一存储抽象层
3. 消除 any 类型
4. 清理 console.* 残留

---

## 9. 结论

项目 **v1.13.0** 已处于 **Next.js 16 + React 19** 的最前沿，核心架构 (App Router, Zustand, features/ 模块化) 扎实。主要问题集中在：

1. **技术债务** — 多重重复实现、超大文件、服务端API误用
2. **类型安全** — 构建时 TypeScript 错误被忽略
3. **架构碎片化** — WebSocket 和 PermissionContext 有遗留代码
4. **功能缺口** — 搜索/导入/认证 API 含 TODO 待实现

**下一步行动**: 建议主代理安排 P0 级别的技术债务清理 sprint，重点修复构建错误容忍问题和删除服务端API误用。
