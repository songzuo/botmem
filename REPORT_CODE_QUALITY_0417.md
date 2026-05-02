# 📋 代码质量深度审查报告

**项目**: 7zi-frontend  
**审查日期**: 2026-04-17  
**审查范围**: `src/lib/agents/`, `src/lib/workflow/`, `src/app/api/`  
**审查员**: 咨询师（子代理）

---

## 1. 未使用代码检查

### 1.1 Learning 模块导出分析

**文件**: `src/lib/agents/learning/index.ts`

| 导出项 | 状态 | 备注 |
|--------|------|------|
| `AdaptiveLearner`, `adaptiveLearner` | ⚠️ 已移除但文件仍存在 | index.ts 明确标注已移除以减小 bundle |
| `initializeLearningSystem()` | ❌ 确认未使用 | index.ts 注释标注已移除 |
| 直接从 `adaptive-learner.ts` 导入 | ✅ 被 API 使用 | `src/app/api/agents/learning/*` 直接导入 |

**结论**: Learning 模块的未使用导出已正确处理（通过注释说明并移除），但 `adaptive-learner.ts` 文件本身仍然完整存在且被 API 层直接引用。

### 1.2 Workflow 模块

**文件**: `src/lib/workflow/index.ts`

导出检查正常，所有导出项在模块内都有对应实现：
- `ExecutionHistoryStore` ✅
- `WorkflowReplayEngine` ✅
- `WorkflowAnalytics` ✅
- `TemplateManager` ✅
- `VisualWorkflowOrchestrator` ✅

---

## 2. 循环依赖分析

### 2.1 检测结果

**未发现循环导入问题** ✅

- `learning-data.ts` 导入 `time-prediction.ts` 和 `agent-capability.ts`
- `VisualWorkflowOrchestrator.ts` 导入 `execution-state-storage` 和 `webhook`
- 所有导入链均单向，无环形依赖

### 2.2 潜在风险点

**文件**: `src/lib/workflow/VisualWorkflowOrchestrator.ts`

```typescript
// 拓扑排序检测循环依赖
private topologicalSort(nodes, dependencies): string[] {
  // ...
  if (visiting.has(nodeId)) {
    throw new Error(`检测到循环依赖: ${nodeId}`)  // 错误信息过于简单
  }
}
```

**建议**: 改进错误信息，提供完整的依赖链路径便于调试。

---

## 3. 安全漏洞扫描

### 3.1 🔴 中风险: `new Function()` 动态代码执行

**文件**: `src/lib/automation/automation-engine.ts`

```typescript
// 第 440 行 - 条件验证
new Function('ctx', `return ${sanitized}`)

// 第 1065 行 - 数据转换
const transformFn = new Function('data', 'ctx', transformConfig.transform)

// 第 1134 行 - 条件评估
const fn = new Function('ctx', `return ${expression}`)
```

**问题分析**:
- 虽然代码使用 `sanitizeExpression()` 过滤了 `import`, `require`, `eval`, `Function`, `process`, `global`, `window` 等关键字
- 但 `new Function()` 本身创建的函数作用域与全局隔离，理论上较安全
- 然而这种白名单过滤方式可能被绕过（如通过 this.constructor 访问全局作用域）

**建议**: 
1. 考虑使用 `vm` 模块的沙箱环境
2. 或使用表达式解析库（如 `jsep`, `expr-eval`）替代动态函数创建

### 3.2 🟡 低风险: 硬编码示例邮箱

**文件**: `src/app/api/feedback/route.ts:165`

```typescript
userEmail: `${userId}@example.com`,
```

**问题**: 生产代码中使用 `@example.com` 作为占位符，虽然不涉及真实凭证，但可能影响用户体验（邮件发送功能）。

**建议**: 在创建 feedback 时要求用户提供真实邮箱，或使用系统生成的内部标识。

### 3.3 🟡 低风险: 本地存储依赖

**文件**: `src/lib/agents/learning/learning-data.ts`

```typescript
if (typeof localStorage !== 'undefined') {
  localStorage.removeItem(this.config.storageKey)
}
```

**问题**: 代码检查了 `localStorage` 的存在性，但如果存储 quota 满会导致保存失败被静默忽略。

**建议**: 添加存储空间检查和错误处理。

---

## 4. 性能热点识别

### 4.1 🔴 高风险: VisualWorkflowOrchestrator 内存泄漏

**文件**: `src/lib/workflow/VisualWorkflowOrchestrator.ts`

```typescript
// 第 95 行 - 启动自动保存
private startAutoSave(): void {
  if (this.autoSaveTimer) {
    clearInterval(this.autoSaveTimer)
  }
  this.autoSaveTimer = setInterval(() => {
    this.saveExecutionState()
  }, this.config.autoSaveInterval)
}

// dispose() 方法看起来正确清理了 timer
dispose(): void {
  this.stopAutoSave()
  this.eventListeners.clear()
  // ...
}
```

**问题**: 
- `stopAutoSave()` 正确调用了 `clearInterval(this.autoSaveTimer)`
- 但如果在 `startExecution` 和 `dispose` 之间发生异常，`setInterval` 可能未被清理
- `eventListeners` 是 `Set` 类型，如果监听器未正确移除会造成内存泄漏

### 4.2 🟡 中风险: 大数组过滤操作

**文件**: `src/lib/agents/learning/adaptive-learner.ts`

```typescript
// 每次记录完成都遍历全部历史
const recent = this.taskHistory.filter(
  h => h.agentId === agentId && h.completedAt > Date.now() - 86400000
)
stats.successRate = recent.length > 0 
  ? recent.filter(h => h.status === 'completed').length / recent.length 
  : 1.0
```

**问题**: 
- `taskHistory` 最大 10000 条记录
- 每次 `updateAgentStats` 都要遍历两次完整数组
- 24小时过滤对高负载系统开销较大

**建议**: 使用滑动窗口或维护最近24小时记录的单独缓存。

### 4.3 🟡 中风险: 拓扑排序无缓存

**文件**: `src/lib/workflow/VisualWorkflowOrchestrator.ts`

```typescript
private topologicalSort(nodes, dependencies): string[] {
  // 每次执行节点都要重新计算
}
```

**问题**: 工作流执行过程中重复计算拓扑顺序（虽然只执行一次，但恢复执行时会重建）。

### 4.4 🟢 低风险: 反馈导出大查询

**文件**: `src/app/api/feedback/export/route.ts`

```typescript
const result = feedbackStorage.getFeedbacks(
  filter,
  { field: 'createdAt', order: 'desc' },
  1,
  10000  // 一次性加载最多 10000 条
)
```

**问题**: 导出功能一次性查询大量数据，可能导致内存压力和响应超时。

**建议**: 使用流式响应或分页导出。

---

## 5. 其他发现

### 5.1 代码质量 ✅

- Scheduler 的任务队列优先级插入使用了正确的二分查找插入
- Workflow 版本管理有完整的变更历史记录
- API 路由有适当的权限检查和 rate limiting

### 5.2 错误处理 ✅

- 大部分异步操作都有 try-catch 包裹
- 错误信息包含上下文便于调试

### 5.3 日志记录 ⚠️

- `logger.ts` 存在但部分代码仍使用 `console.error`
- 建议统一使用 `logger` 模块便于集中管理

---

## 6. 总结建议

| 优先级 | 问题 | 建议 |
|--------|------|------|
| 🔴 高 | `new Function()` 动态代码执行 | 使用 vm 沙箱或表达式解析库 |
| 🔴 高 | Auto-save timer 可能泄漏 | 确保所有代码路径都调用 dispose() |
| 🟡 中 | 反馈邮箱硬编码 | 要求用户邮箱或生成内部标识 |
| 🟡 中 | 大数组过滤性能 | 使用缓存或滑动窗口 |
| 🟡 中 | 导出大查询 | 改用流式响应 |
| 🟢 低 | 拓扑排序无缓存 | 按需计算或缓存 |
| 🟢 低 | console.error 混用 | 统一使用 logger 模块 |

---

**审查完成** ✅
