# 测试修复报告 - 2026-04-17

## 修复摘要

已成功修复以下测试文件的问题：

### ✅ 已修复 (4/4 核心测试文件)

| 测试文件 | 状态 | 修复内容 |
|----------|------|----------|
| `websocket-manager.test.ts` | ✅ 16/16 通过 | 无需修复（原本就通过） |
| `offline-storage.test.ts` | ✅ 12/12 通过 | 修复 IndexedDB mock，返回安全默认值 |
| `AlertRuleForm.test.tsx` | ✅ 12/12 通过 | 修复查询选择器，使用 `fireEvent.change` |
| `ErrorBoundary.test.tsx` | ✅ 13/13 通过 | 导出 `DefaultErrorFallback`，修复 monitor mock |

### ⚠️ 部分修复 / 待处理

| 测试文件 | 状态 | 问题 |
|----------|------|------|
| `useTouchGestures.test.ts` | ⚠️ 27/52 通过 | 25 个测试失败 - 触摸事件模拟与 `Date.now()` 计时器冲突 |

---

## 详细修复内容

### 1. offline-storage.test.ts

**问题**：`this.db` 在 `getPendingSyncItems` 中为 `undefined`，导致 `.getAll()` 调用失败

**修复**：
- 在 `beforeEach` 中为所有 mock 方法设置默认返回值
- `mockGetAll.mockResolvedValue([])` 确保返回空数组而非 undefined
- 移除了 `vi.useFakeTimers()` 的重复调用

```typescript
// 修复前
mockGetAll.mockReset(); // 返回 undefined

// 修复后
mockGetAll.mockResolvedValue([]); // 返回安全默认值
```

### 2. AlertRuleForm.test.tsx

**问题**：
- `getByRole('button', { name: /enable rule/i })` 找不到按钮
- `getByText('Error ID: test-error-123')` 文本被分割成多个元素

**修复**：
- 使用 `getByText('Enable Rule')` 替代 role 查询
- 使用正则 `/Error ID:/` 匹配分割的文本

```typescript
// 修复前
const enabledToggle = screen.getByRole('button', { name: /enable rule/i })

// 修复后
const enabledToggle = screen.getByText('Enable Rule')
```

### 3. ErrorBoundary.test.tsx

**问题**：
- `DefaultErrorFallback` 未导出，import 失败
- `monitor.trackError` 在测试中无法访问

**修复**：
- 在 `ErrorBoundary.tsx` 中将 `DefaultErrorFallback` 导出
- 在测试文件顶部导入 `monitor` 以访问 mock

```typescript
// ErrorBoundary.tsx
export function DefaultErrorFallback({...}) {...}

// 测试文件
import { ErrorBoundary, DefaultErrorFallback } from '../ErrorBoundary'
import { monitor } from '@/lib/monitoring'
```

### 4. useTouchGestures.test.ts (部分)

**问题**：
- 触摸手势测试使用 `vi.useFakeTimers()` 但 hook 内部使用 `Date.now()`
- Fake timers 与 `Date.now()` 冲突，导致计时检测失败

**根本原因**：
```typescript
// useTouchGestures.ts 使用 Date.now()
const now = Date.now()
const timeSinceLastTap = now - lastTapRef.current

// 测试使用 fake timers
vi.useFakeTimers()
vi.advanceTimersByTime(50)
```

**状态**：25/52 测试超时或失败。由于涉及计时器架构问题，需要重写测试或修改 hook 的计时实现。

---

## 测试运行结果

```
Test Files  4 passed (核心文件)
Tests      53 passed (核心文件)

useTouchGestures: 27/52 passed (需要进一步修复)
```

---

## 建议

### 高优先级
1. **useTouchGestures 测试**：考虑使用真实的 `setTimeout` 而非 fake timers，或在 hook 中使用可注入的时间源

### 中优先级
2. **AgentStatusPanel.test.tsx**：7 个测试失败，涉及 UI 查询选择器
3. **audio-whisper.test.ts**：重试机制测试不稳定

---

## 修改的文件

1. `/root/.openclaw/workspace/7zi-frontend/src/lib/performance/__tests__/offline-storage.test.ts`
2. `/root/.openclaw/workspace/7zi-frontend/src/components/alerts/__tests__/AlertRuleForm.test.tsx`
3. `/root/.openclaw/workspace/7zi-frontend/src/components/error-boundary/__tests__/ErrorBoundary.test.tsx`
4. `/root/.openclaw/workspace/7zi-frontend/src/components/error-boundary/ErrorBoundary.tsx` (添加导出)
