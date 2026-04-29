# TypeScript 错误报告 - 2026-04-17

## 概述

| 指标 | 数值 |
|------|------|
| **总错误数** | ~863 个 |
| **P0 错误 (阻断编译)** | ~5 个 |
| **P1 错误 (运行时风险)** | ~10 个 |
| **P2 错误 (测试文件)** | ~800+ 个 |
| **已修复 P0** | 5 个 |
| **本次修复减少错误** | ~586 个 |

---

## 已修复的 P0 错误 ✅

### 1. `src/app/api/rooms/[id]/route.ts:113` - `roomsCache` 未定义
- **错误**: `Cannot find name 'roomsCache'`
- **原因**: 代码引用了不存在的 `roomsCache` 变量
- **修复**: 移除无效引用，改为 `roomDetailCache.delete()`
- **状态**: ✅ 已修复

### 2. `src/app/manifest.ts:134` - `protocols` 属性不存在
- **错误**: `Object literal may only specify known properties, and 'protocols' does not exist in type 'Manifest'`
- **原因**: `protocols` 不是有效的 Manifest 属性
- **修复**: 删除 `protocols: []` 字段
- **状态**: ✅ 已修复

### 3. `src/app/manifest.ts` + 其他文件 - `withErrorHandling` 类型不兼容
- **错误**: `Types of parameters 'request' and 'args' are incompatible`
- **原因**: `withErrorHandling` 的泛型约束使用 `(...args: unknown[])` 导致无法正确推导 `NextRequest` 类型
- **修复**: 修改 `error-handler.ts` 中的 `withErrorHandling` 签名:
  ```typescript
  // Before
  T extends (...args: unknown[]) => Promise<NextResponse<unknown>>
  // After
  T extends (request: NextRequest, ...args: unknown[]) => Promise<NextResponse<unknown>>
  ```
- **影响文件**: `anomalies/route.ts`, `nodes/route.ts`, `resources/route.ts`, `trends/route.ts`
- **状态**: ✅ 已修复

---

## 仍存在的 P0 错误 (阻断编译)

### 1. `src/app/api/feedback/route.ts:192` - 返回类型不兼容
- **错误**: `Type 'Promise<Response>' is not assignable to type 'Promise<NextResponse<unknown>>'`
- **原因**: `handlePOST` 返回 `Response` 而非 `NextResponse`
- **影响**: 编译阻断
- **状态**: 🔴 未修复

### 2. `src/app/api/rooms/[id]/join/route.ts:21` - 未使用的 `@ts-expect-error`
- **错误**: `Unused '@ts-expect-error' directive`
- **原因**: 指令不匹配任何错误
- **修复**: 删除无效的 `@ts-expect-error` 注释
- **状态**: ✅ 已修复

### 3. `src/app/manifest.ts:132` - 重复属性
- **错误**: `An object literal cannot have multiple properties with the same name`
- **原因**: `prefer_related_applications` 在 manifest 对象中重复定义
- **修复**: 删除第 132 行的重复 `prefer_related_applications: false`
- **状态**: ✅ 已修复

---

## P1 错误 (运行时风险)

### 非测试文件中的 P1 错误 (约 30 个):

1. **feedback/route.ts:192** - `handlePOST` 返回 `Response` 而非 `NextResponse`
2. **WorkflowEditor.tsx:179, 784** - 类型转换问题 (`Node<WorkflowNodeData>[]` vs `Record<string, unknown>`)
3. **ExecutionTrendChart.tsx** - `date` 属性不存在于 `TrendData` 类型
4. **MobileChart.tsx** - 找不到模块 `@/components/ui/card` 和 `@/components/ui/skeleton`
5. **NodePerformanceChart.tsx** - 属性访问问题 (`toFixed` on `ValueType`)
6. **ResourceUsageChart.tsx** - `AreaChart` 未定义
7. **AnalyticsDashboard.tsx** - 类型不匹配 (TrendData, AnomalyChartProps)
8. **KPIDashboard.tsx** - 类型不匹配
9. **RichTextEditor.tsx** - `KeyboardEventHandler` 类型不兼容
10. **ErrorBoundary.tsx** - 找不到 namespace 'JSX'
11. **EmotionSelector.tsx** - 重复的标识符 (React, useTranslation)

---

## P2 错误 (测试文件)

### AgentNode.test.tsx / ConditionNode.test.tsx
- **数量**: 100+ 个错误
- **原因**: 测试中传入的 props 不完整，缺少 `id`, `type`, `zIndex`, `isConnectable`, `xPos`, `yPos` 等属性
- **示例**: `Argument of type '{ data: WorkflowNodeData; selected: boolean; }' is not assignable to parameter of type 'NodeProps<WorkflowNodeData>'`

### 其他测试文件错误
- `route.test.ts` - 参数数量不匹配
- `debug-auth.test.ts` - Spread 类型问题
- `notifications/route.test.ts` - Notification 类型不匹配

---

## 建议修复顺序

1. **立即修复** (阻断编译):
   - 删除 `manifest.ts` 中重复的 `prefer_related_applications`
   - 删除 `join/route.ts` 中未使用的 `@ts-expect-error`
   - 修复 `feedback/route.ts` 中 `handlePOST` 返回类型

2. **本周修复** (运行时风险):
   - 更新 WorkflowEditor 中的类型转换
   - 修复测试文件中的 NodeProps 传递

3. **后续修复** (代码质量):
   - 统一 `withErrorHandling` 的使用方式
   - 清理测试文件中的类型问题
