# Tech Debt 第一阶段修复计划

**项目**: 7zi-frontend  
**阶段**: Phase 1  
**计划周期**: 1 周 (5 个工作日)  
**制定日期**: 2026-04-21  
**制定者**: 架构师子代理  

---

## 执行摘要

基于深度技术债务分析报告 (`REPORT_TECH_DEBT_DEEP_0421.md`)，从 Critical 和 High 级别中筛选出 **8 个**可在一周内完成的任务。

**总估算工时**: 20-26 小时  
**推荐团队规模**: 1-2 人  

---

## 优先级表格

| # | 任务名 | 严重度 | 估算工时 | 复杂度 | 涉及文件 |
|---|--------|--------|----------|--------|----------|
| 1 | auth.ts 与 auth/index.ts 合并 | 🔴 Critical | 1-2h | 低 | `src/lib/auth.ts`, `src/lib/auth/index.ts` |
| 2 | dynamic-import.tsx 类型修复 | 🟠 High | 1-2h | 低 | `src/lib/dynamic-import.tsx` |
| 3 | .js 文件迁移到 TypeScript | 🟠 High | 0.5h | 低 | `src/components/WorkflowEditor/__tests__/validate-templates.js` |
| 4 | automation-hooks.ts TODO 实现 | 🟠 High | 1-2h | 中 | `src/lib/automation/automation-hooks.ts` |
| 5 | sync-manager.ts TODO 实现 | 🟠 High | 1-2h | 中 | `src/lib/sync/sync-manager.ts` |
| 6 | alerting/channels.ts TODO 实现/移除 | 🟠 High | 4-6h | 中 | `src/lib/alerting/channels.ts` |
| 7 | 批量类型安全修复 (any → unknown) | 🔴 Critical | 3-4h | 中 | `lib/performance/batch-request.ts`, `lib/alerting/...`, `lib/performance/offline-storage.ts` |
| 8 | src/server 目录架构决策 | 🔴 Critical | 0.5-1h | 低 | 项目根目录结构 |

---

## 任务详情

### 任务 1: auth.ts 与 auth/index.ts 合并

**严重度**: 🔴 Critical  
**估算工时**: 1-2 小时  
**复杂度**: 低  

**问题**: 两个文件导出相似功能，造成混乱，开发者可能导入错误版本  
**修复方案**: 
- 将 `auth.ts` 的功能合并到 `auth/index.ts`
- 删除 `auth.ts`
- 检查所有导入引用并更新

**验收标准**:
- [ ] 只有 `auth/index.ts` 存在
- [ ] 所有原有导入仍然正常工作
- [ ] 无 TypeScript 编译错误

---

### 任务 2: dynamic-import.tsx 类型修复

**严重度**: 🟠 High  
**估算工时**: 1-2 小时  
**复杂度**: 低  

**问题**: 
```typescript
export function preloadComponent(importFn: () => Promise<any>)  // any 类型不安全
```

**修复方案**:
- 将 `Promise<any>` 替换为 `Promise<ComponentType<any>>` 或更具体的泛型
- 或使用 `unknown` + 类型守卫

**验收标准**:
- [ ] 无 `Promise<any>` 类型
- [ ] TypeScript 编译通过
- [ ] IDE 能提供正确的类型提示

---

### 任务 3: .js 文件迁移到 TypeScript

**严重度**: 🟠 High  
**估算工时**: 0.5 小时  
**复杂度**: 低  

**问题**: 项目应统一使用 TypeScript，但存在遗留 .js 文件  
**修复方案**: 将 `validate-templates.js` 重命名为 `.ts` 并添加类型

**验收标准**:
- [ ] 文件重命名为 `.ts`
- [ ] TypeScript 编译通过

---

### 任务 4: automation-hooks.ts TODO 实现

**严重度**: 🟠 High  
**估算工时**: 1-2 小时  
**复杂度**: 中  

**问题**:
```
Line 192: TODO: 从存储加载执行历史
```

**修复方案**: 实现该功能或明确标记为 `// TODO(FUTURE):` 并说明原因

**验收标准**:
- [ ] TODO 已实现或已明确标记为 deferred
- [ ] 无遗留未标记的 TODO

---

### 任务 5: sync-manager.ts TODO 实现

**严重度**: 🟠 High  
**估算工时**: 1-2 小时  
**复杂度**: 中  

**问题**:
```
Line 409: TODO: Replace with actual API endpoint
```

**修复方案**: 实现真实 API 调用或使用明确的占位符并添加说明注释

**验收标准**:
- [ ] TODO 已实现或有明确的 deferred 说明
- [ ] 代码行为符合预期

---

### 任务 6: alerting/channels.ts TODO 实现/移除

**严重度**: 🟠 High  
**估算工时**: 4-6 小时  
**复杂度**: 中  

**问题** (6 个未完成 TODO):
```
Line 34:  TODO: Integrate with actual email service
Line 112: TODO: Send actual webhook
Line 158: TODO: Integrate with toast notification system
Line 168: TODO: Play notification sound
Line 222: TODO: Send actual webhook
Line 263: TODO: Send actual Telegram message
```

**修复方案**:
- 评估每个 TODO 的业务价值
- 实现关键功能 (email, webhook, toast)
- 移除或 deferred 不需要的 TODO
- 添加 `// TODO(FUTURE):` 标记 deferred 项

**验收标准**:
- [ ] 至少 2-3 个核心 TODO 已实现
- [ ] 其余 TODO 有明确标记
- [ ] 无 dead code 残留

---

### 任务 7: 批量类型安全修复

**严重度**: 🔴 Critical  
**估算工时**: 3-4 小时  
**复杂度**: 中  

**问题**: 多处使用 `any` 类型，运行时类型错误风险高

**涉及文件**:
- `lib/performance/batch-request.ts`
- `lib/performance/performance-hooks.ts` (navigator as any)
- `lib/alerting/channels/NotificationChannel.ts`
- `lib/performance/offline-storage.ts`

**修复方案**:
- 替换为具体类型
- 或使用 `unknown` + 类型守卫
- 添加必要的类型定义文件

**验收标准**:
- [ ] 无 `as any` 类型断言 (除非有充分理由)
- [ ] 无裸露的 `any` 类型 (除泛型暂定外)
- [ ] TypeScript strict 模式编译通过

---

### 任务 8: src/server 目录架构决策

**严重度**: 🔴 Critical  
**估算工时**: 0.5-1 小时  
**复杂度**: 低  

**问题**: 项目结构预期有 server 目录处理 SSR/API routes，但不存在，前后端职责边界不清晰

**修复方案** (二选一):
1. 创建 `src/server/` 目录结构并添加说明
2. 在 `README.md` 中明确说明架构决策 (前后端分离，无 SSR)

**验收标准**:
- [ ] 架构边界已在文档中明确
- [ ] 开发者能理解项目结构

---

## 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| alerting/channels.ts 改动影响现有告警 | 高 | 先写单元测试，再改实现 |
| 批量类型修复可能引发现编译错误 | 中 | 分文件提交，每次验证 |
| auth 合并可能影响登录流程 | 高 | 在测试环境充分验证 |

---

## 第二阶段预留任务

以下 Critical/High 任务因工时或复杂度较高，留在第二阶段：

- websocket-manager.ts 拆分 (8-12h)
- automation-engine.ts 拆分 (10-12h)
- alert-engine.ts 拆分 (6-8h)
- 通知系统统一 (12-16h)
- 循环依赖修复 (2-4h)

---

## 验收检查清单

完成 Phase 1 后检查：

- [ ] 8 个任务全部完成
- [ ] `npm run build` 通过
- [ ] `npm run lint` 通过
- [ ] 无新增 TypeScript 错误
- [ ] 功能回归测试通过
