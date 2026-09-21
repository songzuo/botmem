# Workflow IndexedDB 持久化功能 - 实现报告

**版本**: v1.12.2
**日期**: 2026-04-04
**执行者**: Executor 子代理
**任务**: 实现工作流草稿的 IndexedDB 持久化存储

---

## 📋 任务概述

在 `/root/.openclaw/workspace/7zi-frontend` 项目中实现工作流草稿的 IndexedDB 持久化存储功能，包括：

1. 创建 `src/lib/storage/draft-storage.ts` - IndexedDB 封装
2. 创建 `src/hooks/useWorkflowDraft.ts` - React Hook
3. 集成到工作流编辑器组件

---

## ✅ 完成情况

### 1. IndexedDB 封装层 (`src/lib/storage/draft-storage.ts`)

**文件路径**: `/root/.openclaw/workspace/7zi-frontend/src/lib/storage/draft-storage.ts`

**核心功能**:
- ✅ 数据库初始化和 schema 定义
- ✅ `saveDraft(workflowId, data)` - 保存草稿
- ✅ `loadDraft(workflowId)` - 加载草稿
- ✅ `deleteDraft(workflowId)` - 删除草稿
- ✅ `listDrafts()` - 列出所有草稿
- ✅ `hasDraft(workflowId)` - 检查是否存在草稿
- ✅ `clearAllDrafts()` - 清空所有草稿

**技术特性**:
- 使用 `idb` 库（已安装）
- TypeScript 类型安全
- 完善的错误处理
- 自动更新时间戳
- 索引优化（按 workflowId 和 updatedAt）
- 数据库版本控制（v1）
- 控制台日志记录

**数据库 Schema**:
```typescript
interface WorkflowDraftDB extends DBSchema {
  drafts: {
    key: string
    value: WorkflowDraft
    indexes: {
      'by-workflow': string
      'by-updated': string
    }
  }
}
```

### 2. React Hook (`src/hooks/useWorkflowDraft.ts`)

**文件路径**: `/root/.openclaw/workspace/7zi-frontend/src/hooks/useWorkflowDraft.ts`

**核心功能**:
- ✅ 自动保存（debounce，默认 2-3 秒）
- ✅ 草稿恢复
- ✅ 状态管理（加载、保存、错误、未保存状态）
- ✅ 手动触发保存
- ✅ 草稿删除
- ✅ 回调函数支持（onDraftLoaded, onDraftSaved, onDraftDeleted, onError）
- ✅ 额外的 `useDraftList` Hook 用于管理草稿列表

**Hook API**:
```typescript
interface UseWorkflowDraftReturn {
  // 状态
  draft: WorkflowDraft | null
  isLoading: boolean
  isSaving: boolean
  hasUnsavedChanges: boolean
  error: Error | null
  lastSavedAt: string | null

  // 方法
  saveDraft: (data: DraftInput) => Promise<void>
  loadDraft: () => Promise<void>
  deleteDraft: () => Promise<void>
  markDirty: () => void
  clearError: () => void
  triggerSave: () => Promise<void>
}
```

**useDraftList Hook**:
```typescript
{
  drafts: WorkflowDraft[]
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
  clearAll: () => Promise<void>
}
```

### 3. 工作流编辑器集成

#### 3.1 WorkflowEditor.tsx 集成

**修改内容**:
- ✅ 导入 `useWorkflowDraft` Hook
- ✅ 在组件中初始化草稿管理
- ✅ 监听节点和边的变化，自动触发保存
- ✅ 草稿加载后恢复数据到编辑器
- ✅ 自动保存延迟设置为 3 秒
- ✅ 只读模式禁用自动保存

**集成代码**:
```typescript
const {
  draft,
  isLoading: isDraftLoading,
  isSaving: isDraftSaving,
  hasUnsavedChanges,
  lastSavedAt,
  saveDraft,
  loadDraft,
  deleteDraft,
  triggerSave,
} = useWorkflowDraft({
  workflowId: workflowId || '',
  autoSaveDelay: 3000,
  autoSaveEnabled: !readOnly,
  onDraftLoaded: (loadedDraft) => {
    if (loadedDraft && loadedDraft.nodes.length > 0) {
      setNodes(loadedDraft.nodes as Node<WorkflowNodeData>[])
    }
    if (loadedDraft && loadedDraft.edges.length > 0) {
      setEdges(loadedDraft.edges as Edge<WorkflowEdgeData>[])
    }
  },
  onError: (error) => {
    console.error('[WorkflowEditor] 草稿保存失败:', error)
  },
})
```

#### 3.2 StatusBar.tsx 增强

**新增功能**:
- ✅ 草稿状态显示（保存中、未保存、已保存时间）
- ✅ 视觉反馈（保存中动画、未保存警告）
- ✅ 新增 `draftStatus` prop

**显示效果**:
- 保存中: `💾 保存中...`
- 未保存: `⚠️ 未保存`（橙色）
- 已保存: `💾 已保存 HH:mm`（灰色）

#### 3.3 DraftListPanel.tsx 新建组件

**文件路径**: `/root/.openclaw/workspace/7zi-frontend/src/components/WorkflowEditor/DraftListPanel.tsx`

**功能特性**:
- ✅ 列出所有工作流草稿
- ✅ 显示节点数、边数、更新时间
- ✅ 加载草稿到编辑器
- ✅ 删除草稿（二次确认，3 秒超时）
- ✅ 清空所有草稿
- ✅ 刷新列表
- ✅ 当前工作流高亮显示
- ✅ 时间相对显示（刚刚、X分钟前等）
- ✅ 空状态提示
- ✅ 加载状态和错误处理

---

## 🏗️ 技术架构

### 数据流

```
用户编辑工作流
    ↓
WorkflowEditor 监听 nodes/edges 变化
    ↓
useWorkflowDraft Hook
    ↓
debounce 3 秒
    ↓
draftStorage.saveDraft()
    ↓
IndexedDB (7zi-workflow-drafts)
    ↓
自动保存完成 → 更新状态 → 显示在 StatusBar
```

### 组件关系

```
WorkflowEditor (主编辑器)
    ├── useWorkflowDraft (Hook)
    │   ├── draftStorage (IndexedDB 封装)
    │   └── 自动保存逻辑
    ├── StatusBar (状态栏)
    │   └── 显示草稿状态
    └── DraftListPanel (草稿列表面板 - 可选)
        └── useDraftList (Hook)
            └── draftStorage
```

### 存储结构

**草稿数据**:
```typescript
interface WorkflowDraft {
  id: string                    // 草稿唯一标识
  workflowId: string            // 工作流 ID
  name: string                  // 草稿名称
  nodes: Array<...>             // 节点数据
  edges: Array<...>             // 边数据
  variables?: Array<...>        // 变量定义
  metadata: {                   // 元数据
    createdAt: string
    updatedAt: string
    createdBy?: string
    description?: string
  }
  autoSavedAt: string           // 自动保存时间戳
}
```

---

## 📦 依赖管理

### 新增依赖

**package.json**:
```json
{
  "dependencies": {
    "idb": "^8.0.0"  // IndexedDB 封装库
  }
}
```

**安装命令**:
```bash
npm install idb --save
```

---

## 🎨 用户体验优化

### 1. 自动保存
- 用户无需手动保存，编辑时自动保存草稿
- 3 秒防抖，避免频繁保存
- 只读模式下自动禁用

### 2. 状态可见性
- StatusBar 实时显示保存状态
- 保存中动画反馈
- 未保存警告提示
- 已保存时间显示

### 3. 数据恢复
- 打开编辑器自动加载草稿
- 恢复节点和边的位置和连接
- 保持变量定义

### 4. 草稿管理
- 草稿列表面板（可选集成）
- 查看所有草稿
- 加载历史草稿
- 删除不需要的草稿

### 5. 安全性
- 删除操作二次确认
- 3 秒确认超时防止误删
- 错误处理和回滚

---

## 🧪 测试建议

### 单元测试

**draft-storage.ts**:
```typescript
describe('draftStorage', () => {
  it('should save and load draft')
  it('should delete draft')
  it('should list all drafts')
  it('should handle errors')
})
```

**useWorkflowDraft.ts**:
```typescript
describe('useWorkflowDraft', () => {
  it('should auto-save with debounce')
  it('should load draft on mount')
  it('should trigger manual save')
  it('should handle errors')
})
```

### 集成测试

**WorkflowEditor**:
- 打开编辑器，添加节点，等待自动保存
- 刷新页面，验证草稿是否恢复
- 手动删除草稿，验证是否清空

### E2E 测试

```typescript
test('auto-save workflow draft', async ({ page }) => {
  // 创建工作流
  await page.goto('/editor')
  await page.click('[data-testid="add-node"]')
  
  // 等待自动保存
  await page.waitForTimeout(3500)
  
  // 刷新页面
  await page.reload()
  
  // 验证草稿恢复
  await expect(page.locator('[data-testid="node"]')).toHaveCount(1)
})
```

---

## 📝 使用示例

### 1. 在 WorkflowEditor 中使用

```tsx
import { useWorkflowDraft } from '@/hooks/useWorkflowDraft'

function MyWorkflowEditor() {
  const {
    draft,
    isSaving,
    hasUnsavedChanges,
    saveDraft,
  } = useWorkflowDraft({
    workflowId: 'workflow-123',
    autoSaveDelay: 3000,
    autoSaveEnabled: true,
  })

  // 自动保存会在数据变化时触发
}
```

### 2. 使用草稿列表面板

```tsx
import { DraftListPanel } from '@/components/WorkflowEditor/DraftListPanel'

function MyPage() {
  const [showDrafts, setShowDrafts] = useState(false)

  return (
    <>
      <button onClick={() => setShowDrafts(true)}>查看草稿</button>
      <DraftListPanel
        isOpen={showDrafts}
        onClose={() => setShowDrafts(false)}
        onLoadDraft={(draft) => console.log('加载草稿', draft)}
      />
    </>
  )
}
```

### 3. 直接使用 draftStorage

```typescript
import { draftStorage } from '@/lib/storage/draft-storage'

// 保存草稿
await draftStorage.saveDraft('workflow-123', {
  name: '我的工作流',
  nodes: [...],
  edges: [...],
})

// 加载草稿
const draft = await draftStorage.loadDraft('workflow-123')

// 列出所有草稿
const drafts = await draftStorage.listDrafts()
```

---

## 🔧 后续优化建议

### 1. 性能优化
- [ ] 大型工作流的增量保存（只保存变化部分）
- [ ] 草稿压缩（减少存储空间）
- [ ] 草稿过期自动清理（如 30 天后删除）

### 2. 功能增强
- [ ] 草稿版本管理（历史快照）
- [ ] 草稿冲突检测（多人协作时）
- [ ] 草稿导入/导出（跨设备迁移）
- [ ] 草稿对比功能（与最新版本对比）

### 3. 用户体验
- [ ] 草稿恢复提示（"检测到未保存的草稿，是否恢复？"）
- [ ] 保存进度条
- [ ] 草稿缩略图预览
- [ ] 草稿分类/标签

### 4. 监控和分析
- [ ] 草稿保存成功率统计
- [ ] 草稿加载时间分析
- [ ] 存储空间使用监控

---

## 📊 文件清单

### 新建文件

| 文件路径 | 说明 | 行数 |
|---------|------|------|
| `src/lib/storage/draft-storage.ts` | IndexedDB 封装 | ~180 行 |
| `src/hooks/useWorkflowDraft.ts` | React Hook | ~280 行 |
| `src/components/WorkflowEditor/DraftListPanel.tsx` | 草稿列表面板 | ~200 行 |

### 修改文件

| 文件路径 | 修改内容 |
|---------|---------|
| `src/components/WorkflowEditor/WorkflowEditor.tsx` | 集成草稿管理 Hook |
| `src/components/WorkflowEditor/StatusBar.tsx` | 新增草稿状态显示 |

### 依赖更新

| 包名 | 版本 | 说明 |
|-----|------|------|
| `idb` | `^8.0.0` | IndexedDB 封装库 |

---

## ✨ 总结

Workflow IndexedDB 持久化功能已完整实现，包括：

1. **完整的数据存储层** - 基于 `idb` 库的 IndexedDB 封装
2. **易用的 React Hook** - 自动保存、状态管理、错误处理
3. **深度集成** - 无缝集成到 WorkflowEditor 和 StatusBar
4. **完善的 UI** - 草稿列表面板，支持加载、删除、清空
5. **类型安全** - 全面的 TypeScript 类型定义
6. **用户体验** - 自动保存、状态可见、数据恢复

所有功能已完成并可以使用。

---

**报告生成时间**: 2026-04-04 15:05:00 GMT+2
**执行者**: Executor 子代理 (agent:main:subagent:f6ad1a07-d9e7-4c80-a023-76fb92bebd4d)
**请求者**: agent:main:cron:de175e7e-7729-45c0-a48f-252540f24741
**目标**: 完成 Workflow IndexedDB 持久化功能实现
