# 🏗️ 架构健康报告
**项目**: 7zi-frontend  
**日期**: 2026-04-13  
**分析者**: 架构师子代理

---

## 📊 目录结构概览

```
src/
├── lib/           (73 个子目录 - 严重膨胀)
├── components/    (38 个子目录)
├── hooks/         (27 个文件)
├── stores/        (7 个 store 文件)
├── features/      (1 个 feature)
├── contexts/      (2 个 context)
├── app/           (App Router)
├── i18n/          (国际化)
├── middleware/    (中间件)
├── config/        (配置)
└── styles/        (样式)
```

---

## 🔴 P0 - 严重问题 (必须立即修复)

### P0-1: 循环依赖风险 - 'use client' 在 Server 模块中

**文件**: `src/lib/error-handler.ts`

```typescript
'use client'  // ❌ 问题：Server-side lib 不应该有 'use client'
import { toast } from '@/stores/uiStore'  // ❌ uiStore 是客户端 store
```

**影响**:
- 此文件在 Server Components 或 API Routes 中被导入时会导致运行时错误
- Next.js 编译时不会报错，但运行时可能崩溃

**修复建议**:
1. 将 `error-handler.ts` 拆分为 `client/` 和 `server/` 两个版本
2. 或将 `'use client'` 标记移除，仅在需要 toast 的客户端代码中导入

**相关文件**:
- `src/lib/error-handler.ts`
- `src/lib/error/client/error-handler.ts` (正确版本 - 已有)
- `src/stores/uiStore.ts`

---

### P0-2: lib/ 目录严重膨胀 (73 个子目录)

**问题**: `src/lib/` 包含过多模块，职责不清

**当前结构**:
```
src/lib/
├── a2a/           # A2A 协议
├── agents/        # 智能体
├── ai/            # AI 相关
├── alerting/       # 告警
├── api/           # API
├── audit/         # 审计
├── auth/          # 认证
├── billing/       # 计费
├── cache/         # 缓存
├── collab/        # 协作
├── db/            # 数据库
├── health-monitor/# 健康监控
├── log-aggregator/# 日志聚合
├── message-queue/ # 消息队列
├── monitoring/    # 监控 (43 个文件!)
├── notifications/ # 通知
├── permissions/   # 权限
├── plugins/       # 插件
├── rate-limit/    # 限流
├── search/        # 搜索
├── security/      # 安全
├── utils/         # 工具
├── webhook/       # Webhook
├── websocket/     # WebSocket
└── workflow/      # 工作流
```

**建议**:
```
src/lib/  →  重构为 src/modules/ 或按功能域拆分
```

**按功能域拆分**:
- `src/modules/auth/` → 认证、权限
- `src/modules/ai/` → AI、agents、a2a
- `src/modules/monitoring/` → 监控、告警、日志
- `src/modules/collaboration/` → 协作、websocket、realtime
- `src/modules/business/` → billing、notifications、workflow

---

### P0-3: monitoring/ 目录过于庞大

**文件数**: 43 个文件

**问题**:
- `src/lib/monitoring/` 下有 `errors.ts` (与 `src/lib/errors.ts` 重复)
- 多个 `alert-manager*.ts` 文件可能重复
- `root-cause/` 目录可能与其他模块重复

**相关文件**:
- `src/lib/monitoring/errors.ts`
- `src/lib/errors/unified-error.ts` (存在功能重叠)
- `src/lib/monitoring/alert*.ts` (多个版本)

---

## 🟡 P1 - 重要问题 (应该尽快修复)

### P1-1: 重复的错误处理系统

**发现 3 套错误处理系统**:

1. `src/lib/errors.ts` - 统一错误入口
2. `src/lib/monitoring/errors.ts` - 监控用错误
3. `src/lib/error/client/error-handler.ts` - 客户端错误处理

**问题**:
- 功能重叠，维护困难
- 类型定义不一致 (`ErrorCategory` 在多处定义)

**建议**: 统一到 `src/lib/errors/` 目录下，删除 `monitoring/errors.ts`

---

### P1-2: 重复的 Hooks 目录

**发现**:
- `src/hooks/` - React hooks (主要 hooks)
- `src/lib/hooks/` - 仅 2 个文件 (useRealtimeAnalytics, useWebVitals)

**问题**: `src/lib/hooks/` 应该合并到 `src/hooks/` 或移动到合适位置

**相关文件**:
- `src/hooks/` (27 个文件)
- `src/lib/hooks/useRealtimeAnalytics.ts`
- `src/lib/hooks/useWebVitals.ts`

---

### P1-3: next.config.ts 配置重复

**问题**: React Compiler 配置出现两次

```typescript
// 第一次
...(reactCompilerEnabled && {
  reactCompiler: {
    sources: (filename: string) => { ... }
  },
}),

// 第二次 (compiler 选项中)
compiler: {
  ...
  ...(reactCompilerEnabled && {
    reactCompiler: { ... }),  // 重复配置
  }),
}
```

**修复建议**: 删除其中一处重复配置

**文件**: `next.config.ts`

---

### P1-4: 组件导出 index.ts 过大

**文件**: `src/components/index.ts` (约 450 行)

**问题**:
- 单一文件导出过多内容
- 难以追踪哪些组件来自哪里
- 每次修改都需要重新验证

**建议**:
- 按功能域拆分导出文件
- 使用 `src/components/ui/index.ts`
- 使用 `src/components/ai-report/index.ts`

---

## 🟢 P2 - 改进建议 (可以后续处理)

### P2-1: features/notifications/ 结构不完整

**当前**:
```
src/features/notifications/
├── index.ts
├── services/
└── types/
```

**问题**: 目录存在但内容不完整

---

### P2-2: components/ 目录中存在功能重复

**示例**:
- `src/components/SearchFilter.tsx` (独立文件)
- `src/components/search/` (目录)

**建议**: 统一到单一入口

---

### P2-3: 遗留代码未清理

**发现**:
- `src/lib/search-filter.ts` (24KB) - 可能与 `src/components/SearchFilter.tsx` 重叠
- `src/lib/utils.ts` 仅 3652 字节 - 可能需要检查是否被使用

**相关文件**:
- `src/lib/search-filter.ts`
- `src/lib/search-filter-enhanced.test.ts`
- `src/components/SearchFilter.tsx`

---

### P2-4: 复杂的代码分割配置

**文件**: `next.config.ts` 的 `webpack` 配置

**问题**:
- 手动配置 `splitChunks` 较长
- 与 React Compiler 的协同可能有问题

**建议**: 使用 Next.js 内置的 `next.config.ts` `bundlePagesRouterDependencies` 替代部分配置

---

## 📈 next.config.ts 分析

### 优点 ✅
- 安全 headers 配置完整
- React Compiler 已启用
- 图片优化配置合理
- 代码分割策略完善

### 问题 ⚠️
- React Compiler 配置重复 (出现两次)
- `experimental.optimizeCss` 与 React Compiler 的兼容性
- `compiler.removeConsole` 与 React Compiler 可能冲突

---

## 🔧 优化建议汇总

| 优先级 | 问题 | 建议 | 工作量 |
|--------|------|------|--------|
| P0-1 | 'use client' 在 server lib | 拆分 error-handler 为 client/server | 中 |
| P0-2 | lib/ 膨胀 | 重构为 modules/ 目录 | 高 |
| P0-3 | monitoring/ 过大 | 精简或拆分 monitoring | 高 |
| P1-1 | 重复错误系统 | 统一到 errors/ 目录 | 中 |
| P1-2 | lib/hooks 重复 | 合并 hooks | 低 |
| P1-3 | next.config 重复 | 删除重复配置 | 低 |
| P1-4 | 组件导出过大 | 按域拆分导出 | 中 |
| P2-1 | features 结构不完整 | 完善或移除 | 低 |
| P2-2 | 组件功能重复 | 统一入口 | 中 |
| P2-3 | 遗留代码 | 审计并清理 | 中 |
| P2-4 | webpack 配置复杂 | 简化配置 | 低 |

---

## 📁 相关文件路径汇总

### 需要修复的文件
- `src/lib/error-handler.ts`
- `src/lib/errors.ts`
- `src/lib/monitoring/errors.ts`
- `src/hooks/index.ts`
- `src/lib/hooks/useRealtimeAnalytics.ts`
- `src/lib/hooks/useWebVitals.ts`
- `next.config.ts`
- `src/components/index.ts`

### 需要重构的目录
- `src/lib/` → `src/modules/`
- `src/lib/monitoring/`
- `src/components/`

### 需要审计的文件
- `src/lib/search-filter.ts`
- `src/lib/search-filter-enhanced.test.ts`
- `src/components/SearchFilter.tsx`
- `src/features/notifications/`

---

## 📋 下一步行动

1. **立即修复**: 移除 `src/lib/error-handler.ts` 的 'use client' 并确保不在 server 端导入
2. **短期**: 统一错误处理系统到 `src/lib/errors/`
3. **中期**: 重构 `src/lib/` 为 `src/modules/`
4. **长期**: 完成 features/ 目录结构或移除不完整的模块

---

*报告生成时间: 2026-04-13 14:10 GMT+2*
