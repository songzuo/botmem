# Workflow 模板系统实现报告

## 版本
v1.12.2 - 工作流持久化与用户体验优化

## 创建日期
2026-04-04

---

## 📋 预设模板详细定义

### 1. AI 客服对话流程
- **ID**: `preset-ai-customer-service`
- **分类**: customer-service (客服)
- **描述**: 智能客服工作流，支持自动回复和人工转接
- **标签**: AI, 客服, 对话, 自动化
- **节点** (5个):
  - start (开始)
  - task (AI 回复) - 使用 GPT-4 模型生成回复
  - condition (是否解决?) - 检查用户是否满意
  - end (结束)
  - task (转人工) - 转接给人工客服

### 2. 数据处理流水线
- **ID**: `preset-data-pipeline`
- **分类**: data-processing (数据处理)
- **描述**: 并行处理多个数据源，汇总结果
- **标签**: 数据, ETL, 并行, 汇总
- **节点** (7个):
  - start (开始)
  - task ×3 (数据源 1/2/3) - 从数据库/API/文件读取数据
  - task (数据处理) - 清洗、转换、验证
  - task (数据汇总) - 合并所有数据源结果
  - end (结束)

### 3. 定时任务调度
- **ID**: `preset-scheduled-task`
- **分类**: automation (自动化)
- **描述**: 按计划执行任务，支持重复执行
- **标签**: 定时, 调度, 自动化, Cron
- **节点** (5个):
  - start (开始)
  - wait (定时器) - 等待到指定时间 (Cron: 0 9 * * *)
  - task (执行任务)
  - condition (是否重复?) - 检查是否需要重复执行
  - end (结束)

### 4. 人工审批流程
- **ID**: `preset-approval-flow`
- **分类**: approval (审批)
- **描述**: 提交申请、等待审批、根据结果处理
- **标签**: 审批, 工作流, 人工, 流程
- **节点** (6个):
  - start (开始)
  - task (提交申请) - 用户提交审批申请
  - wait (等待审批) - 等待审批人处理 (24小时超时)
  - condition (是否通过?) - 检查审批结果
  - end (通过)
  - task (返回修改) - 通知用户修改申请

### 5. 多 Agent 协作任务
- **ID**: `preset-multi-agent`
- **分类**: collaboration (协作)
- **描述**: 多个 AI Agent 并行工作，汇总结果
- **标签**: Agent, 协作, 并行, AI
- **节点** (6个):
  - start (开始)
  - task ×3 (Agent 1/2/3) - 研究分析、数据收集、报告生成
  - task (结果汇总) - 合并所有 Agent 的结果
  - end (结束)

---

## 📁 创建/修改的文件

### 新建文件

| 文件路径 | 描述 |
|---------|------|
| `src/lib/workflow/template-system.ts` | 模板系统核心，包含 Template 接口和 TemplateManager 类 |
| `src/hooks/useWorkflowTemplate.ts` | React Hook，提供模板管理功能 |
| `src/components/WorkflowEditor/WorkflowTemplateSelector.tsx` | 模板选择器组件 |
| `src/lib/workflow/__tests__/template-system.test.ts` | 模板系统单元测试 |
| `src/hooks/__tests__/useWorkflowTemplate.test.ts` | Hook 单元测试 |

### 修改文件

| 文件路径 | 修改内容 |
|---------|---------|
| `src/components/WorkflowEditor/WorkflowEditor.tsx` | 集成模板选择器对话框，添加从模板创建工作流功能 |
| `src/components/WorkflowEditor/Toolbar.tsx` | 添加"从模板"新建按钮 |

---

## 🏗️ 模板系统架构说明

### 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        WorkflowEditor                            │
│                    (工作流编辑器主组件)                            │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   WorkflowTemplateSelector                      │
│                   (模板选择对话框组件)                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 搜索框 | 分类筛选 (全部/客服/数据处理/自动化/审批/协作/自定义)  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    模板卡片网格                               │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │ │
│  │  │ 模板1   │ │ 模板2   │ │ 模板3   │ │ 模板4   │           │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    useWorkflowTemplate Hook                      │
│  - templates: 模板列表                                           │
│  - filteredTemplates: 筛选后的模板                              │
│  - selectCategory(): 分类筛选                                   │
│  - searchTemplates(): 搜索                                       │
│  - createWorkflowFromTemplate(): 从模板创建工作流               │
│  - saveAsTemplate(): 保存为自定义模板                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TemplateManager                            │
│  - getAllTemplates(): 获取所有模板                               │
│  - getTemplateById(): 根据 ID 获取模板                           │
│  - getTemplatesByCategory(): 分类筛选                           │
│  - searchTemplates(): 关键词搜索                                 │
│  - createTemplate(): 创建自定义模板                              │
│  - updateTemplate(): 更新模板                                    │
│  - deleteTemplate(): 删除模板                                    │
│  - incrementUsage(): 增加使用次数                                │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    localStorage                                  │
│              (模板持久化存储)                                      │
└─────────────────────────────────────────────────────────────────┘
```

### 核心模块

#### 1. Template 接口
```typescript
interface Template {
  id: string                    // 模板唯一标识
  name: string                  // 模板名称
  description: string           // 模板描述
  category: TemplateCategory    // 分类 (customer-service|data-processing|automation|approval|collaboration|custom)
  workflow: {
    nodes: Node[]               // 工作流节点
    edges: Edge[]              // 工作流边
  }
  tags: string[]               // 标签
  usageCount: number           // 使用次数
  createdAt: number            // 创建时间
  isPreset?: boolean          // 是否为预设模板
}
```

#### 2. TemplateManager 类
- **单例模式**：导出全局实例 `templateManager`
- **持久化**：使用 localStorage 自动保存/加载
- **预设模板**：内置 5 个常用工作流模板
- **核心方法**：
  - `getAllTemplates()` - 获取所有模板
  - `getTemplateByCategory(category)` - 按分类获取
  - `searchTemplates(query)` - 关键词搜索
  - `createTemplate(template)` - 创建自定义模板
  - `incrementUsage(id)` - 增加使用次数

#### 3. useWorkflowTemplate Hook
- **功能**：
  - 自动加载模板列表
  - 分类筛选和搜索
  - 从模板创建工作流（自动生成新节点 ID）
  - 保存为自定义模板
  - 删除自定义模板

---

## 📖 使用说明

### 1. 在 WorkflowEditor 中使用模板

#### 从模板新建工作流
1. 点击工具栏的「从模板」按钮
2. 在弹出的模板选择对话框中选择模板
3. 模板将自动加载到画布中

#### 模板选择对话框功能
- **搜索**：输入关键词搜索模板
- **分类筛选**：按类别筛选（客服、数据处理、自动化、审批、协作、自定义）
- **模板卡片**：显示模板名称、描述、节点数、使用次数

### 2. 使用 useWorkflowTemplate Hook

```typescript
import { useWorkflowTemplate } from '@/hooks/useWorkflowTemplate'

function MyComponent() {
  const {
    templates,                 // 所有模板
    filteredTemplates,         // 筛选后的模板
    popularTemplates,         // 热门模板
    recentTemplates,          // 最近模板
    loading,                  // 加载状态
    error,                    // 错误信息
    selectedCategory,         // 当前选中的分类
    searchQuery,              // 当前搜索关键词
    selectCategory,           // 选择分类
    searchTemplates,          // 搜索模板
    getTemplateById,          // 获取模板
    createWorkflowFromTemplate, // 从模板创建工作流
    saveAsTemplate,           // 保存为模板
    deleteTemplate,           // 删除模板
    refreshTemplates,         // 刷新模板
  } = useWorkflowTemplate({ autoLoad: true })

  // 从模板创建工作流
  const handleUseTemplate = (templateId: string) => {
    const workflow = createWorkflowFromTemplate(templateId)
    if (workflow) {
      // workflow.nodes 和 workflow.edges 可以直接用于 React Flow
    }
  }

  // 保存为自定义模板
  const handleSaveAsTemplate = (name: string, description: string, nodes, edges) => {
    saveAsTemplate(name, description, 'custom', ['my-tag'], nodes, edges)
  }
}
```

### 3. 直接使用 TemplateManager

```typescript
import { templateManager } from '@/lib/workflow/template-system'

// 获取所有预设模板
const templates = templateManager.getAllTemplates()

// 按分类获取
const customerServiceTemplates = templateManager.getTemplatesByCategory('customer-service')

// 搜索模板
const searchResults = templateManager.searchTemplates('AI')

// 创建自定义模板
const customTemplate = templateManager.createTemplate({
  name: '我的模板',
  description: '模板描述',
  category: 'custom',
  workflow: { nodes: [...], edges: [...] },
  tags: ['标签1', '标签2'],
})

// 删除自定义模板
templateManager.deleteTemplate(customTemplate.id)

// 获取热门模板
const popular = templateManager.getPopularTemplates(5)
```

---

## 🔧 类型安全

- **完整的 TypeScript 类型定义**
- 所有接口和类型都有明确的定义
- 模板系统与 React Flow 类型无缝集成
- ESLint 配置确保类型安全

---

## ✅ 测试覆盖

### 单元测试
- TemplateManager 核心功能测试
- useWorkflowTemplate Hook 测试

### 测试场景
- 模板初始化和加载
- 分类筛选
- 关键词搜索
- 从模板创建工作流（ID 生成）
- 自定义模板创建、更新、删除
- 预设模板保护（不可删除/修改）
- localStorage 持久化
- 错误处理

---

## 📦 导出内容

### 组件导出
```typescript
// WorkflowTemplateSelector.tsx
export { WorkflowTemplateSelector }        // 模板选择器组件
export { WorkflowTemplateSelectorDialog }  // 模板选择对话框
```

### Hook 导出
```typescript
// useWorkflowTemplate.ts
export { useWorkflowTemplate }       // 主 Hook
export { useWorkflowTemplates }       // 便捷 Hook
export { useCreateWorkflowFromTemplate } // 从模板创建 Hook
```

### 核心类导出
```typescript
// template-system.ts
export { TemplateManager }           // 模板管理器类
export { templateManager }           // 单例实例
```

---

## 🎯 后续优化建议

1. **模板预览**：添加模板预览功能，显示工作流图示
2. **模板分类管理**：支持用户创建自定义分类
3. **模板评分**：允许用户对模板进行评分
4. **模板分享**：支持导出/导入模板
5. **模板市场**：添加官方模板市场和社区模板
6. **智能推荐**：基于用户历史使用推荐相关模板
