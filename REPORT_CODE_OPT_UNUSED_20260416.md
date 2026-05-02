# 代码优化 - 未使用导出清理报告
# Unused Exports Cleanup Report
**日期**: 2026-04-16
**项目**: /root/.openclaw/workspace

---

## 📊 分析摘要

| 指标 | 数量 | 时间 |
|------|------|------|
| 分析文件数 | 520 | - |
| 有导出的文件 | 2863 | - |
| 总导入数 | 13789 | - |
| **有未使用导出的文件** | **471** | - |
| **未使用导出总数** | **3301** | - |

**注**: 数据来自 `unused-exports-analysis.json`，生成于 2026-03-22

---

## ⚠️ 风险评估

**不建议大规模清理未使用导出**，原因：

1. **反射/动态调用**: 很多导出可能被 `import()`, `require()`, 或字符串拼接调用
2. **测试覆盖**: 部分导出仅在测试中使用
3. **外部调用**: `src/lib/` 下的模块可能被 7zi-frontend 子项目调用
4. **索引签名**: TypeScript 编译模式下可能无法检测到 `namespace` 访问

---

## 📋 未使用导出示例

### A2A 模块 (src/lib/a2a/)

| 文件 | 未使用导出 |
|------|-----------|
| `agent-card.ts` | `createAgentCard`, `createExtendedAgentCard`, `getAgentCard`, `resetAgentCards` |
| `agent-registry.ts` | `InMemoryAgentRegistry`, `FileAgentRegistry`, `getAgentRegistry` |
| `executor.ts` | `ExecutionEventBus`, `SevenZiExecutor`, `createSevenZiExecutor` |
| `message-queue.ts` | `PriorityMessageQueue`, `FileMessageQueue`, `getMessageQueue` |
| `task-store.ts` | `TaskStore`, `getTaskStore` |

### UI 组件 (src/components/ui/)

| 文件 | 未使用导出 |
|------|-----------|
| `index.ts` | `Button`, `ButtonGroup`, `Card`, `Badge`, `Input`, `Select`, `Tooltip` 等 14 个 |
| `Checkbox.tsx` | `Checkbox` |
| `Input.tsx` | `Input`, `InputProps` |
| `Tooltip.tsx` | `Tooltip`, `SimpleTooltip`, `withTooltip`, `InfoTooltip` 等 10 个 |

---

## 🔒 安全清理建议

### 低风险清理（可执行）

仅删除满足以下条件的导出：
1. **确认无反射调用**
2. **非 barrel export (index.ts)**
3. **不在 agents/ai/ 目录**

```typescript
// 示例：src/lib/a2a/agent-card.ts
// 确认 createAgentCard() 只在模块内部使用，未被 import() 动态调用
// 可以安全删除
```

### 建议的清理优先级

| 优先级 | 模块 | 未使用导出数 | 风险 |
|--------|------|-------------|------|
| P1 | `src/components/ui/index.ts` | ~14 | 低 |
| P2 | `src/lib/a2a/*.ts` | ~20 | 中 |
| P3 | `src/lib/*/index.ts` | ~50 | 中 |
| P4 | 其他 | ~3000+ | 高 |

---

## 🛡️ 保护建议

以下目录的导出**不应删除**（除非确认无外部调用）：

```
src/lib/agents/      # AI Agent 核心，可能被外部调用
src/lib/ai/          # AI 能力，可能被外部调用
src/lib/services/    # 服务层
src/lib/monitoring/  # 监控
src/lib/workflow/    # 工作流
src/lib/errors/      # 错误处理
```

---

## 📊 清理工作量估算

| 范围 | 导出数 | 估算时间 |
|------|--------|----------|
| 全部未使用导出 | 3301 | ~50+ 小时 |
| 仅 ui/index.ts | 14 | ~1 小时 |
| 仅 a2a/ 模块 | 20 | ~2 小时 |
| 仅 P1 低风险 | ~100 | ~5 小时 |

---

## 🎯 建议行动

1. **短期**: 清理 `src/components/ui/index.ts` 中的未使用导出（14个）
2. **中期**: 分析 `src/lib/a2a/` 模块的未使用导出
3. **长期**: 建立自动化检测，持续监控未使用导出
4. **不执行**: 大规模删除（风险太高）

---

*报告生成时间: 2026-04-16*
*数据来源: unused-exports-analysis.json (2026-03-22)*
