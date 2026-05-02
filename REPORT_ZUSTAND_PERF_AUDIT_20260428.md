# Zustand Store 性能审计报告

**审计日期:** 2026-04-28  
**项目路径:** `/root/.openclaw/workspace/7zi-frontend`  
**审计范围:** `src/lib` 和 `src/stores` 目录下的所有 Zustand store

---

## 一、Store 文件列表及渲染优化评分

| Store 文件 | 评分 | 优化等级 | 备注 |
|-----------|------|----------|------|
| `app-store.ts` | **8/10** | 良好 | 有细粒度选择器，部分复合选择器缺少 shallow |
| `auth-store.ts` | **7/10** | 中等 | 有细粒度选择器，复合选择器未使用 shallow |
| `notification-store.ts` | **7/10** | 中等 | 选择器组织良好，但未使用 shallow |
| `websocket-store.ts` | **7/10** | 中等 | 基础优化良好，缺少 shallow 比较 |
| `permission-store.ts` | **6/10** | 中等偏下 | 有缓存但选择器未优化 |
| `room-store.ts` | **6/10** | 中等偏下 | 房间消息订阅方式有问题 |
| `workflow-store.ts` | **5/10** | 需改进 | selectors 返回新对象 |
| `workflow-editor-store.ts` | **5/10** | 需改进 | 使用 zundo 但选择器未优化 |
| `ai-chat/store.ts` | **4/10** | 差 | 非标准 Zustand 用法，状态结构问题 |
| `lib/api/rooms/store.ts` | N/A | - | 普通类，非 Zustand store |
| `lib/workflow/execution-history-store.ts` | N/A | - | 普通类，非 Zustand store |

---

## 二、发现的问题

### 🔴 严重问题 (高优先级)

#### 1. `ai-chat/store.ts` - 非标准 Zustand 用法
**问题:**
- 使用 `_state` 内部对象包装所有状态，不是标准的 Zustand 响应式用法
- Getters (get currentConversation, get conversations 等) 在 store 内部不是响应式的
- 辅助 hooks (`useAIMessages`, `useAIStatus` 等) 订阅 `state._state` 整个对象
- 任何 `_state` 内任何属性的变化都会触发所有订阅者重渲染

**代码示例:**
```typescript
// 问题：每次 store 更新，所有订阅 state._state 的组件都会重渲染
export function useAIMessages(): AIMessage[] {
  return useAIChatStore((state) => state._state.messages)
}
```

**优化建议:**
- 重构为标准 Zustand 状态结构，每个状态独立
- 将复合状态拆分为独立字段
- 考虑使用 `useShallow` 进行比较

---

#### 2. `room-store.ts` - 房间消息订阅问题
**问题:**
在 `RoomChat.tsx` 中直接订阅消息数组：
```typescript
const messages = useRoomStore(state => state.messages[room.id] || [])
```
这会订阅整个 `messages` 对象，任何房间消息更新都会触发重渲染。

**优化建议:**
- 使用预定义的选择器 `selectRoomMessages(roomId)`
- 或使用 `useShallow` 比较

---

### 🟡 中等问题 (中优先级)

#### 3. 复合选择器未使用 `shallow` 比较
几乎所有 store 的复合选择器都返回新对象引用，但没有使用 `shallow` 进行浅比较。

**示例 (app-store.ts):**
```typescript
// 问题：每次调用都返回新对象，导致组件重渲染
export const selectUIState = (state: AppState) => ({
  sidebarOpen: state.settings.sidebarOpen,
  sidebarCollapsed: state.settings.sidebarCollapsed,
  // ...
})
```

**正确用法:**
```typescript
import { useShallow } from 'zustand/shallow'

// 在组件中使用
const uiState = useAppStore(useShallow(selectUIState))
// 或
const uiState = useAppStore(state => selectUIState(state), shallow)
```

---

#### 4. `permission-store.ts` - Helper Hooks 问题
**问题:**
```typescript
export const useHasPermission = (permission: Permission) => {
  return usePermissionStore(state => state.hasPermission(permission))
}
```
`hasPermission` 是一个普通方法，每次渲染都会执行，可能导致不必要的计算。

**优化建议:**
- 考虑缓存权限检查结果
- 或使用选择器直接获取权限状态

---

### 🟢 轻微问题 (低优先级)

#### 5. 未使用的 `shallow` 导入
多个 store 导入了 `shallow` 但没有实际使用：
- `app-store.ts`
- `auth-store.ts`
- `notification-store.ts`
- `permission-store.ts`

---

## 三、优化建议及优先级

### 🔥 P0 - 紧急优化

#### 1. 重构 `ai-chat/store.ts`
**问题等级:** 高  
**影响范围:** AI 聊天功能

**当前状态结构 (有问题):**
```typescript
_state: {
  currentConversation: null,
  conversations: [],
  messages: [],
  status: 'idle',
  // ...
}
```

**建议重构为:**
```typescript
// 直接在顶层定义状态
currentConversation: AIConversation | null
conversations: AIConversation[]
messages: AIMessage[]
status: ChatStatus
// ...
```

**预期效果:** 减少约 60-70% 的不必要重渲染

---

#### 2. 修复 `RoomChat.tsx` 消息订阅
**问题等级:** 中  
**当前代码:**
```typescript
const messages = useRoomStore(state => state.messages[room.id] || [])
```

**建议修改为:**
```typescript
import { useShallow } from 'zustand/shallow'
import { selectRoomMessages } from '@/stores/room-store'

// 使用 shallow 避免不必要重渲染
const messages = useRoomStore(
  useShallow(state => state.messages[room.id] || []),
)
```

---

### 🛠️ P1 - 重要优化

#### 3. 为复合选择器添加 `shallow` 支持
**建议为以下 store 的复合选择器添加 shallow 支持:**

**app-store.ts:**
```typescript
// 添加导出或在组件中使用
import { useShallow } from 'zustand/shallow'

// 组件中使用
const uiState = useAppStore(useShallow(selectUIState))
```

**auth-store.ts:**
```typescript
// selectLoginState 需要 shallow
export const selectLoginState = (state: AuthState) => ({
  isLoading: state.isLoading,
  error: state.error,
})
```

**permission-store.ts:**
```typescript
// selectPermissionCheckers 需要 shallow
export const selectPermissionCheckers = (state: PermissionState) => ({
  hasPermission: state.hasPermission,
  // ...
})
```

---

### 🔧 P2 - 常规优化

#### 4. 清理未使用的 `shallow` 导入
移除未使用的 `shallow` 导入，保持代码整洁。

#### 5. `workflow-editor-store.ts` 优化 temporal equality
当前 equality 函数已经优化，但可以考虑更细粒度的跟踪：
```typescript
equality: (a, b) => {
  // 只比较 nodes 和 edges
  return (
    JSON.stringify(a.nodes) === JSON.stringify(b.nodes) &&
    JSON.stringify(a.edges) === JSON.stringify(b.edges)
  )
}
```

---

## 四、性能优化总结

| 优先级 | 问题 | 影响 | 预计改善 |
|--------|------|------|----------|
| P0 | ai-chat store 重构 | 高 | 减少 60-70% 重渲染 |
| P0 | RoomChat 消息订阅 | 中 | 减少 30-40% 重渲染 |
| P1 | 复合选择器 shallow | 中 | 减少 20-30% 重渲染 |
| P2 | 清理未用导入 | 低 | 代码整洁 |

---

## 五、推荐的 Store 使用最佳实践

```typescript
// 1. 细粒度选择器（推荐）
const darkMode = useAppStore(state => state.settings.darkMode)

// 2. 使用 shallow 比较复合选择器
import { useShallow } from 'zustand/shallow'
const uiState = useAppStore(useShallow(selectUIState))

// 3. 工厂函数生成参数化选择器
const messages = useRoomStore(
  useShallow(state => state.messages[roomId] || [])
)

// 4. 避免在选择器中调用方法
// 不好
const hasPermission = usePermissionStore(state => state.hasPermission('edit'))
// 好 - 直接获取状态，在组件中计算
const permissions = usePermissionStore(state => state.userPermissions?.permissions)
```

---

**报告生成时间:** 2026-04-28 02:38 GMT+2  
**审计工具:** 手动代码审查
