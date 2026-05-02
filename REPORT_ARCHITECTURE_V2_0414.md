# 🏗️ 7zi-Frontend 架构演进报告 v2.0

**项目**: 7zi-frontend  
**日期**: 2026-04-14  
**版本**: v1.13.0 (正式版) → v2.0 (演进目标)  
**分析者**: 架构师子代理

---

## 1️⃣ 项目现状总览

### 技术栈

| 技术 | 版本 | 备注 |
|------|------|------|
| **Next.js** | 16.2.3 | App Router, Turbopack(Dev), Webpack(Prod) |
| **React** | 19.2.5 | React Compiler 已启用 |
| **TypeScript** | 5.9.3 | 严格模式 (~94% 覆盖) |
| **状态管理** | Zustand 5.0.12 | + zundo (undo/redo) |
| **样式** | Tailwind CSS 4.2 | + PostCSS |
| **测试** | Vitest 4.1 + Playwright | 1658 测试, 91.97% 通过 |
| **构建** | PWA (Workbox) | offline 支持 |
| **编辑器** | Tiptap 2.27 | 富文本 |
| **图表** | Recharts 3.8 | 数据可视化 |
| **实时** | Socket.io 4.8 | WebSocket 协作 |

### 版本历程 (近 3 个月)

| 版本 | 日期 | 主题 |
|------|------|------|
| v1.4.0 | ~2026-01 | WebSocket 协作系统 |
| v1.8.0 | ~2026-02 | Visual Workflow Orchestrator |
| v1.11.0 | ~2026-03 | 多租户架构 |
| v1.12.0 | ~2026-03 | AI 多模型路由 |
| v1.13.0 | 2026-04-05 | 全功能升级 (搜索/协作/版本控制/审计) |
| v1.14.0 | 规划中 | 多模态智能与协作增强 |

---

## 2️⃣ 当前架构瓶颈分析

### 🔴 严重瓶颈 (P0)

#### B-1: src/lib/ 目录极度膨胀

**现状**: 55 个子目录，~400 个源文件，功能域职责边界完全模糊。

**问题**:
- 同名文件散落根级和子目录 (`auth.ts` + `auth/`、`validation.ts` + `validation/`)
- `monitoring/` 43 个文件 + `performance/` 40+ 文件，职责重叠
- 查找成本高，新人上手困难
- `websocket-manager.ts` 单文件 1473 行，违反单一职责原则

**影响**:
- 代码审查无法有效进行（改动影响范围不可预测）
- 测试隔离困难（模块间隐式耦合）
- 编译时间不可控（webpack tree-shaking 效率低）

#### B-2: 三大核心模块三重复制

| 模块 | 重复位置 | 代码行数 |
|------|----------|----------|
| **DraftStorage** | `db/`, `storage/`, `execution/` | ~1700 行总 |
| **Notification** | `services/notification*.ts` (5个), `alerting/`, `monitoring/` | ~2000+ 行总 |
| **WebSocket Manager** | `websocket-manager.ts`, `websocket-instance-manager.ts`, `websocket-compression.ts`, `socket.ts` | ~2300 行总 |

**根因**: 快速迭代中 copy-paste 复用而非抽象，造成"碎片化上帝模式"。

#### B-3: 服务端 API 误用于前端

**文件**: `db/feedback-storage.ts`, `services/notification-storage.ts` 使用:
```typescript
import { join } from 'path'
process.cwd()  // Node.js 服务端 API
```
**影响**: 纯前端构建时静默失败或运行时崩溃。

---

### 🟠 重要瓶颈 (P1)

#### B-4: 7 个超大文件 (>300 行)

| 文件 | 行数 | 职责 |
|------|------|------|
| `websocket-manager.ts` | 1473 | 连接/消息/重连/压缩/心跳全部耦合 |
| `permissions.ts` | 955 | 权限检查/角色解析/策略执行 |
| `websocket-compression.ts` | 412 | 压缩算法 |
| `errors.ts` | 364 | 错误类型定义 |
| `validation-schemas.ts` | 357 | Zod schemas |
| `websocket-instance-manager.ts` | 345 | WebSocket 实例管理 |
| `auth.ts` | 477 | 认证逻辑 |

**问题**: 违反单一职责，任何改动都需要理解全部逻辑。

#### B-5: 473 处 console.* 残留

生产代码中散落 `console.log/warn/error/info`，无统一日志抽象。
- 无法关闭日志输出
- 无法分级控制
- 无法上报到日志服务
- 性能开销（尤其是 log 对象时）

#### B-6: 38+ Manager/Service 类命名混乱

**问题**: 无统一命名规范。
- `Manager` vs `Service` vs `Client` vs `Handler` 混用
- 职责边界不清晰（`ShortcutManager` vs `SyncManager`）
- 部分 Manager 类过于臃肿

#### B-7: 限流逻辑分散 4 处

`api-rate-limit.ts` (根级) + `rate-limit/` (子目录) + `middleware/rate-limit-middleware.ts` + `api/error-handler.ts` 内嵌。维护者需要同时修改 4 个文件才能完整理解限流策略。

#### B-8: 85+ 文件使用 any 类型

TypeScript 类型安全不完整，影响 IDE 支持和重构信心。

---

## 3️⃣ 可扩展性分析

### 当前扩展性评级: ⚠️ 中等偏下

#### ✅ 扩展性优势

1. **Feature-Sliced 架构雏形**: `src/features/` 已按领域组织 (auth, collab, dashboard, mcp, monitoring, rate-limit, websocket)
2. **Zustand Store 模块化**: 7 个 store 文件，状态管理相对清晰
3. **组件库封装**: `src/components/index.ts` 统一导出，UI 一致性有保障
4. **React Compiler 已启用**: 编译时优化，减少运行时开销
5. **Turbopack 开发体验**: Dev 环境快速刷新

#### ❌ 扩展性问题

1. **lib/ 无领域边界**: 新增功能不知道放哪里，容易继续膨胀 `lib/`
2. **跨 feature 耦合**: `src/lib/` 被所有 feature 共享，修改影响不可预测
3. **WebSocket Manager 过度集中**: 所有实时逻辑集中在一个 1473 行文件，扩展新协议困难
4. **存储层无统一抽象**: DraftStorage 三份拷贝，每份都有略微不同的 API，无法统一升级
5. **配置分散**: `next.config.ts` + `.env*` + `turbo.json` + `tsconfig*.json` 配置分散，添加新环境变量需要查多处
6. **Plugin 系统不完整**: 虽然有 `plugins/` 目录，但 Agent Plugin 系统实现程度未知

#### 📈 扩展性预测

| 场景 | 当前支持度 | 瓶颈 |
|------|------------|------|
| 新增 AI 模型 | ✅ 中等 | `lib/ai/` 需要拆分 |
| 新增业务域 (如电商) | ❌ 差 | `lib/` 不是为多业务域设计的 |
| 100+ 并发用户 | ⚠️ 存疑 | WebSocket Manager 无分片 |
| 离线优先模式 | ⚠️ 部分 | 存储层重复实现导致行为不一致 |
| 微前端拆分 | ❌ 不可行 | 所有模块直接依赖 `lib/` |

---

## 4️⃣ 性能优化空间

### 📊 当前性能基线

| 指标 | 状态 | 备注 |
|------|------|------|
| **Bundle Size** | ~中等 | 需要分析工具验证 |
| **LCP** | 已优化 | React.memo/useMemo 覆盖主要组件 |
| **SSR/SSG** | 已配置 | Next.js App Router |
| **代码分割** | 部分 | 手动 webpack splitChunks 配置 |
| **React Compiler** | 已启用 | 但与某些配置有冲突 |
| **图片优化** | Next.js Image | 已配置 |

### 🔧 性能优化空间

#### P0: 必须优化

1. **React Compiler 与 optimizeCss 冲突**
   - 当前: `experimental.optimizeCss: true` 与 React Compiler 同时启用可能有冲突
   - 建议: 测试禁用 `optimizeCss` 验证编译输出

2. **Bundle 分析缺失**
   - 当前: 无 bundle size 监控（只有手动 `build:analyze` 脚本）
   - 建议: CI 强制 bundle 大小检查，防止 bundle 膨胀

3. **WebSocket Manager 1473 行性能隐患**
   - 单文件过大 → V8 解析慢
   - 状态集中在一个文件 → re-render 范围大
   - 建议: 拆分后按需加载

#### P1: 应该优化

4. **Turbopack 生产构建缺失**
   - 当前: `dev` 用 Turbopack，`build` 用 Webpack
   - 建议: 评估 Turbopack 生产构建稳定性

5. **next.config.ts 配置重复**
   - React Compiler 配置出现两次
   - `compiler.removeConsole` 与 React Compiler 可能冲突
   - 建议: 清理重复配置

6. **组件导出 index.ts 约 450 行**
   - 单一文件导出 ~200 个组件
   - 建议: 按域拆分 (`ui/index.ts`, `ai-report/index.ts`)

#### P2: 可以优化

7. **存储层重复实现**
   - 3 份 DraftStorage 代码路径略有不同
   - 无法统一做性能优化（如共享 worker）

8. **Notification 系统 5+ 实现**
   - 加载了可能不需要的通知模块
   - 建议: 统一后 tree-shake 优化

9. **Three.js (3D) 按需加载**
   - 3D 模块全量打包
   - 建议: 动态 import

---

## 5️⃣ 推荐的架构演进路线

### 总体策略: 渐进式重构，避免 big-bang

```
v1.14.x (当前) → v2.0 LTS (目标)
```

### 🗺️ 三阶段演进路线

```
┌─────────────────────────────────────────────────────────┐
│  Phase 1: 止血 (v1.14.x)                                │
│  清理致命问题，防止继续恶化                             │
│  ├─ P0-1: 修复服务端API误用于前端                       │
│  ├─ P0-2: 删除/合并重复的DraftStorage/Notification      │
│  ├─ P0-3: 清理console.* 替换为logger                   │
│  └─ P1-3: 修复next.config.ts重复配置                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Phase 2: 重构基础 (v1.15.x - v1.16.x)                  │
│  拆分超大文件，建立领域边界                             │
│  ├─ P0-4: websocket-manager.ts 拆分 (5个模块)          │
│  ├─ P1-5: permissions.ts 拆分 (3个模块)               │
│  ├─ P1-6: 统一存储层抽象 (lib/storage/)                 │
│  ├─ P1-7: 统一通知服务 (lib/notifications/)           │
│  └─ P1-8: lib/ → modules/ 重构 (按领域)                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Phase 3: 架构升级 (v2.0)                               │
│  完整的 Feature-Sliced 架构，多业务域支持               │
│  ├─ P0-9: 完成 modules/ 重构                           │
│  ├─ P0-10: 建立统一API Client                          │
│  ├─ P1-11: 统一错误处理边界                            │
│  ├─ P1-12: 完善Plugin系统                              │
│  └─ P2-13: 微前端架构探索 (可选)                        │
└─────────────────────────────────────────────────────────┘
```

---

### Phase 1: 止血 (v1.14.x) - 预计 1 周

#### 行动清单

| 优先级 | 任务 | 工作量 | 风险 |
|--------|------|--------|------|
| P0-1 | 删除 `db/feedback-storage.ts` 和 `services/notification-storage.ts`（或加 `@server-only` 注释） | 1h | 低 |
| P0-2 | 统一 DraftStorage: 保留 `lib/storage/draft-storage.ts`，删除 `db/draft-storage.ts` 和 `execution/execution-storage.ts` 的重复实现 | 2d | 中 (需更新所有调用方) |
| P0-3 | 替换所有 `console.*` → `logger.ts`（已有 logger.ts） | 1d | 低 |
| P1-1 | 修复 `error-handler.ts` 的 `'use client'` 标记问题 | 2h | 低 |
| P1-2 | 统一 Notification: 删除 4 个旧实现，保留 `alerting/MultiChannelAlertService.ts` | 2d | 中 |
| P1-3 | 修复 `next.config.ts` 重复的 React Compiler 配置 | 1h | 低 |
| P1-4 | 合并 `lib/hooks/` 到 `src/hooks/` | 1h | 低 |

#### 里程碑: v1.14.x 达到

- ✅ 无服务端 API 误用
- ✅ DraftStorage/Nofitication 无重复
- ✅ 无 console.* 生产残留
- ✅ next.config.ts 配置干净

---

### Phase 2: 重构基础 (v1.15.x - v1.16.x) - 预计 4-6 周

#### 核心任务 1: 拆分 WebSocket Manager

**目标**: 1473 行 → 5 个专注模块

```
lib/websocket/
├── connection-manager.ts    # 连接建立/断开
├── message-handler.ts       # 消息编解码
├── reconnection-manager.ts  # 重连策略
├── compression-handler.ts   # 压缩算法
├── heartbeat-manager.ts     # 心跳检测
└── index.ts                 # 统一导出
```

#### 核心任务 2: 拆分 permissions.ts

**目标**: 955 行 → 3 个专注模块

```
lib/permissions/
├── policy-engine.ts         # 策略评估
├── role-resolver.ts         # 角色解析
├── permission-guard.ts      # Guard 工具
└── index.ts
```

#### 核心任务 3: lib/ → modules/ 重构

**目标**: 建立清晰的领域边界

```
src/
├── modules/                 # 新: 领域模块
│   ├── auth/                # 认证 + 权限
│   │   ├── lib/auth.ts      # 合并后的 auth.ts
│   │   ├── lib/permissions/ # 拆分后的 permissions/
│   │   ├── components/      # Auth 相关组件
│   │   └── hooks/           # Auth 相关 hooks
│   ├── ai/                  # AI + Agents + A2A
│   ├── realtime/            # WebSocket + 协作 + Collab
│   ├── workflow/            # 工作流
│   ├── monitoring/          # 监控 + 告警 + 性能
│   ├── storage/             # 统一存储抽象
│   └── notifications/       # 统一通知
├── features/                # 业务功能 (已存在)
└── components/              # 通用 UI 组件 (已存在)
```

**原则**:
- `modules/` = 技术域（可跨项目复用）
- `features/` = 业务域（特定业务逻辑）
- `components/` = 纯 UI（无业务逻辑）

#### 核心任务 4: 统一存储层

```
lib/storage/
├── draft-storage.ts         # 统一草稿存储
├── base-storage.ts          # 抽象基类
├── indexeddb-adapter.ts    # IndexedDB 实现
├── localstorage-adapter.ts  # localStorage fallback
└── types.ts                 # 统一类型
```

---

### Phase 3: 架构升级 (v2.0) - 预计 8+ 周

#### 目标: 完整 Feature-Sliced 架构

1. **统一 API Client**: `lib/api/client.ts` 封装所有 fetch/axios，统一错误处理/重试/拦截
2. **统一错误边界**: 完整的 ErrorBoundary 体系，跨模块传播的 error 类型
3. **Plugin 系统完善**: Agent Plugin 标准化，支持动态加载
4. **Bundle 监控**: CI 强制检查，防止性能退化
5. **微前端探索** (可选): 如果未来需要多团队并行

---

## 6️⃣ v2.0 架构愿景

### 目标架构

```
src/
├── app/                     # Next.js App Router
├── modules/                 # 技术域模块 (可复用)
│   ├── auth/                # 认证、授权、Session
│   ├── ai/                  # AI 路由、Agents、Dialogue
│   ├── realtime/            # WebSocket、协作、OT
│   ├── storage/             # 统一存储 (IDB + LS + Server)
│   ├── notifications/       # 统一通知
│   ├── monitoring/          # 监控、告警、根因分析
│   ├── workflow/            # 工作流引擎
│   └── api/                 # 统一 API Client
├── features/                # 业务功能
│   ├── dashboard/
│   ├── meeting/
│   ├── contacts/
│   ├── settings/
│   └── ...
├── components/              # 纯 UI 组件
│   ├── ui/                  # 基础 UI (Button, Input...)
│   ├── layout/              # 布局组件
│   └── data-display/        # 图表、表格...
├── hooks/                   # 全局 React hooks
├── stores/                  # Zustand stores
├── lib/                     # 工具函数 (仅 utils)
└── i18n/                    # 国际化
```

### 关键改进

| 维度 | v1.x | v2.0 |
|------|------|------|
| **代码组织** | lib/ 膨胀 (~55 子目录) | modules/ 领域边界清晰 |
| **WebSocket** | 1473 行单文件 | 5 个专注模块 |
| **存储** | 3 份重复 DraftStorage | 1 个统一存储抽象 |
| **通知** | 5+ 重复实现 | 1 个统一服务 |
| **日志** | 473 console.* | 统一 logger |
| **权限** | 955 行单文件 | 3 个专注模块 |
| **API 调用** | 散落各处 | 统一 API Client |
| **类型安全** | ~85 any | 0 any |
| **Bundle 监控** | 无 | CI 强制检查 |
| **Feature 边界** | 模糊 | Feature-Sliced 清晰 |

### v2.0 关键指标目标

| 指标 | 当前 | v2.0 目标 |
|------|------|----------|
| src/lib/ 子目录数 | 55 | <20 |
| 最大单文件行数 | 1473 | <300 |
| 重复实现模块组 | 3 | 0 |
| any 类型文件数 | 85+ | 0 |
| console.* 残留 | 473 | 0 |
| Bundle 监控 | 无 | CI 集成 |
| TypeScript 覆盖 | ~94% | 100% |
| 编译时间 (dev) | Turbopack 快 | 保持 |
| 编译时间 (prod) | Webpack | Turbopack (评估) |

---

## 7️⃣ 风险与注意事项

### ⚠️ 重构风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 重构破坏现有功能 | 高 | 每个 Phase 结束进行全面回归测试 |
| 工期不可控 | 中 | 按优先级拆分任务，延迟低优先级 |
| 多人协作冲突 | 中 | 分支隔离，主干保护 |
| 性能退化 | 中 | CI Bundle 大小检查 |
| 利益相关者不满 | 低 | 保持功能不变，仅改进架构 |

### 🚫 v2.0 不包含

- 不改变任何对外 API（保持向后兼容）
- 不改变 UI/UX（这是设计团队的工作）
- 不迁移到其他框架（继续 Next.js）
- 不强制所有模块一次性重构（渐进式）

---

## 8️⃣ 立即行动建议

### 今天可以开始

1. **删除** `src/lib/db/feedback-storage.ts` 和 `src/lib/services/notification-storage.ts`
2. **运行** `grep -rn "console\." src/` 统计 console.* 数量
3. **审计** `src/lib/monitoring/` 与 `src/lib/errors.ts` 的功能重叠
4. **检查** `next.config.ts` React Compiler 配置重复

### 本周可以完成

1. **统一 DraftStorage**: 确定一个版本为标准，迁移所有调用方
2. **清理 console.***: 批量替换为 logger.ts
3. **合并 lib/hooks/**: `src/lib/hooks/` → `src/hooks/`

---

*报告生成时间: 2026-04-14 03:25 GMT+2*  
*下次评审: v1.14.0 发布后 (预计 2026-04-21)*
