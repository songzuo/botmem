# 7zi 性能优化分析报告

**分析日期**: 2026-03-08
**分析范围**: /root/.openclaw/workspace/src
**分析人**: 性能分析子代理

---

## 📊 执行摘要

| 指标 | 状态 | 优先级 |
|------|------|--------|
| 深拷贝操作 | 0 处 JSON.parse/stringify | ✅ 良好 |
| useMemo/useCallback 使用 | 50+ 处 | ✅ 良好 |
| React.memo 优化 | 3 处 | ⚠️ 可改进 |
| 循环内异步操作 | 0 处 | ✅ 良好 |
| Promise.all 并行化 | 3 处 | ✅ 良好 |
| 潜在重渲染问题 | 5 处 | ⚠️ 中等 |

**总体评级**: B+ (良好，有优化空间)

---

## 1. 发现的性能问题

### 🔴 高优先级问题

#### 1.1 API 路由使用内存存储 (无持久化)

**文件**: `src/app/api/tasks/route.ts`

**问题**: 任务数据存储在内存变量中，每次服务器重启数据丢失，且无法扩展到多实例部署。

```typescript
// 当前实现
let tasks: Task[] = [ /* 硬编码数据 */ ];

// 问题：
// 1. 每次请求都创建数组副本 [...tasks]
// 2. 无索引，filter 操作是 O(n)
// 3. 无持久化
```

**影响**:
- 大数据量时过滤性能下降
- 无法水平扩展
- 数据不持久

**建议**:
```typescript
// 方案 1: 使用 Map 建立索引
const tasksById = new Map<string, Task>();
const tasksByAssignee = new Map<string, Task[]>();
const tasksByStatus = new Map<TaskStatus, Task[]>();

// 方案 2: 接入数据库 (Prisma/Drizzle)
// 方案 3: 使用 Redis 缓存热点数据
```

#### 1.2 Zustand Store 每次选择器返回新对象

**文件**: `src/stores/dashboardStore.ts`

**问题**: `useDashboardStats` 每次都创建新对象，导致消费者组件不必要重渲染。

```typescript
// 当前实现 - 每次调用都创建新对象！
export const useDashboardStats = (): DashboardStats =>
  useDashboardStore((s) => ({
    totalMembers: s.members.length,
    working: s.members.filter((m) => m.status === 'working').length,
    busy: s.members.filter((m) => m.status === 'busy').length,
    // ...
  }));
```

**影响**: 所有使用 `useDashboardStats` 的组件在 store 任何变化时都会重渲染。

**建议**:
```typescript
// 方案 1: 使用 shallow 比较
import { shallow } from 'zustand/shallow';

export const useDashboardStats = () => 
  useDashboardStore(
    (s) => ({
      working: s.members.filter((m) => m.status === 'working').length,
      // ...
    }),
    shallow
  );

// 方案 2: 预计算并缓存
// 在 store 中添加 stats 字段，在 members 变化时更新
```

---

### 🟡 中等优先级问题

#### 2.1 TeamWorkloadChart 计算未 memo 化

**文件**: `src/components/charts/TeamWorkloadChart.tsx`

**问题**: 工作负载计算在 useEffect 中进行，但未使用 useMemo 优化中间计算。

```typescript
useEffect(() => {
  // 每次 members 或 tasks 变化都重新计算全部
  const workloadData = members.map(member => {
    const assignedTasks = tasks.filter(task => task.assignee === member.id);
    // 多次 filter 操作
    const activeTasks = assignedTasks.filter(...).length;
    const completedTasks = assignedTasks.filter(...).length;
    return { ... };
  });
  // ...
}, [members, tasks]);
```

**建议**:
```typescript
// 预计算任务索引
const tasksByAssignee = useMemo(() => {
  const map = new Map<string, Task[]>();
  tasks.forEach(task => {
    const list = map.get(task.assignee) || [];
    list.push(task);
    map.set(task.assignee, list);
  });
  return map;
}, [tasks]);

// 使用索引进行 O(1) 查找
const workloadData = useMemo(() => {
  return members.map(member => {
    const assigned = tasksByAssignee.get(member.id) || [];
    // 单次遍历统计
    let active = 0, completed = 0;
    assigned.forEach(t => {
      if (t.status === 'in_progress') active++;
      else if (t.status === 'completed') completed++;
    });
    return { name: member.name, active, completed };
  });
}, [members, tasksByAssignee]);
```

#### 2.2 Navigation 组件多个 useEffect 可合并

**文件**: `src/components/Navigation.tsx`

**问题**: 3 个独立的 useEffect 处理相关副作用，可能导致多次重渲染。

```typescript
// 当前: 3 个独立 useEffect
useEffect(() => { /* 路由变化关闭菜单 */ }, [pathname]);
useEffect(() => { /* 防止背景滚动 */ }, [isMobileMenuOpen]);
useEffect(() => { /* ESC 键关闭 */ }, [isMobileMenuOpen]);
```

**建议**:
```typescript
// 合并相关副作用
useEffect(() => {
  if (!isMobileMenuOpen) return;
  
  // 防止背景滚动
  const scrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  
  // ESC 键监听
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsMobileMenuOpen(false);
  };
  window.addEventListener('keydown', handleKeyDown);
  
  return () => {
    document.body.style.position = '';
    window.removeEventListener('keydown', handleKeyDown);
  };
}, [isMobileMenuOpen]);
```

#### 2.3 Tasks 页面过滤函数未 memo 化

**文件**: `src/app/tasks/page.tsx`

**问题**: `getFilteredTasks` 每次渲染都重新创建和执行。

```typescript
// 当前: 每次渲染都调用
const getFilteredTasks = () => {
  return tasks.filter(task => !selectedTask || task.id === selectedTask.id);
};

// 在 JSX 中直接调用
{getFilteredTasks().map((task) => ...)}
```

**建议**:
```typescript
// 使用 useMemo 缓存结果
const filteredTasks = useMemo(() => {
  if (!selectedTask) return tasks;
  return tasks.filter(task => task.id === selectedTask.id);
}, [tasks, selectedTask]);

// JSX 中使用
{filteredTasks.map((task) => ...)}
```

#### 2.4 PortfolioGrid 的 categories 计算依赖不完整

**文件**: `src/components/portfolio/PortfolioGrid.tsx`

**问题**: useMemo 依赖数组为空，但使用了外部 `projects` 数据。

```typescript
// 当前: 依赖数组为空
const categories = useMemo(() => {
  const allCategories = new Set<string>();
  projects.forEach(project => {  // projects 来自外部导入
    if (project.category) allCategories.add(project.category);
  });
  return ['all', ...Array.from(allCategories).sort()];
}, []); // ⚠️ 缺少依赖
```

**建议**:
```typescript
// 方案 1: 添加依赖（如果 projects 可能变化）
const categories = useMemo(() => {
  // ...
}, [projects]);

// 方案 2: 如果 projects 是静态的，提取到组件外部
const CATEGORIES = ['all', ...new Set(projects.map(p => p.category).filter(Boolean))].sort();
```

---

### 🟢 低优先级问题

#### 3.1 日志 API 缺少分页优化

**文件**: `src/app/api/logs/route.ts`

**观察**: 已有分页参数，但可能需要游标分页而非偏移分页。

**建议**: 对于大数据量日志，考虑使用游标分页（基于时间戳）。

#### 3.2 可添加 memo 的组件

以下组件可考虑添加 React.memo:

| 组件 | 当前状态 | 建议 |
|------|---------|------|
| TaskCard | 未 memo | ✅ 添加 memo |
| TaskForm | 未 memo | ✅ 添加 memo |
| ProjectCard | 未 memo | ✅ 添加 memo |
| CategoryFilter | 未 memo | ⚠️ 评估后决定 |

#### 3.3 图表组件动态导入

**建议**: TeamWorkloadChart 可加入 LazyComponents.tsx 延迟加载。

---

## 2. 性能优化最佳实践检查

### ✅ 已做好的优化

1. **Lazy Loading** - `LazyComponents.tsx` 集中管理动态导入
2. **useMemo/useCallback** - 在关键位置使用（PortfolioGrid, SettingsContext 等）
3. **React.memo** - LoadingSpinner, MemberCard 使用自定义比较函数
4. **Promise.all** - 并行获取 GitHub 数据
5. **Zustand** - 轻量级状态管理，避免 prop drilling

### ⚠️ 可改进项

1. **缺少虚拟列表** - 长列表（如任务列表）应考虑 react-window
2. **图片优化** - LazyImage 已实现，但可添加 blur placeholder
3. **Web Worker** - 复杂计算（如 3D 渲染）可移至 Worker

---

## 3. 性能相关的 TODO/FIXME

搜索结果: 仅发现 1 处

```typescript
// src/app/api/logs/route.ts:65
// TODO: 添加权限检查
```

**建议**: 这是安全问题而非性能问题，但应尽快处理。

---

## 4. 优化建议清单

### 立即执行 (P0)

| 优化项 | 预期收益 | 工作量 |
|--------|---------|--------|
| useDashboardStats 使用 shallow | 减少 30%+ 重渲染 | 10 分钟 |
| Tasks API 添加索引 | O(n) → O(1) 查询 | 1-2 小时 |

### 短期执行 (P1)

| 优化项 | 预期收益 | 工作量 |
|--------|---------|--------|
| TeamWorkloadChart memo 化 | 减少计算 | 30 分钟 |
| Tasks 页面 useMemo | 减少重渲染 | 10 分钟 |
| 合并 Navigation useEffect | 减少副作用 | 20 分钟 |

### 中期执行 (P2)

| 优化项 | 预期收益 | 工作量 |
|--------|---------|--------|
| 添加 React.memo 到列表项 | 减少列表重渲染 | 1 小时 |
| 虚拟列表（react-window） | 长列表性能 | 2-3 小时 |
| 图表组件延迟加载 | 减少初始包大小 | 30 分钟 |

---

## 5. 代码示例

### 5.1 修复 useDashboardStats

```typescript
// src/stores/dashboardStore.ts
import { shallow } from 'zustand/shallow';

export const useDashboardStats = (): DashboardStats =>
  useDashboardStore(
    (s) => ({
      totalMembers: s.members.length,
      working: s.members.filter((m) => m.status === 'working').length,
      busy: s.members.filter((m) => m.status === 'busy').length,
      idle: s.members.filter((m) => m.status === 'idle').length,
      offline: s.members.filter((m) => m.status === 'offline').length,
      openIssues: s.issues.filter((i) => i.state === 'open').length,
      closedIssues: s.issues.filter((i) => i.state === 'closed').length,
    }),
    shallow
  );
```

### 5.2 修复 Tasks API 索引

```typescript
// src/app/api/tasks/route.ts
class TaskStore {
  private tasks: Task[] = [];
  private byStatus = new Map<TaskStatus, Set<string>>();
  private byType = new Map<TaskType, Set<string>>();
  private byAssignee = new Map<string, Set<string>>();

  add(task: Task) {
    this.tasks.push(task);
    this.indexTask(task);
  }

  private indexTask(task: Task) {
    this.byStatus.getOrAdd(task.status).add(task.id);
    this.byType.getOrAdd(task.type).add(task.id);
    if (task.assignee) {
      this.byAssignee.getOrAdd(task.assignee).add(task.id);
    }
  }

  query(filters: { status?: TaskStatus; type?: TaskType; assignee?: string }) {
    let ids: Set<string> | null = null;

    if (filters.status) {
      const set = this.byStatus.get(filters.status);
      ids = ids ? intersection(ids, set) : set;
    }
    // ... 其他过滤条件

    return ids ? this.tasks.filter(t => ids!.has(t.id)) : this.tasks;
  }
}
```

### 5.3 修复 Tasks 页面

```typescript
// src/app/tasks/page.tsx
import { useMemo } from 'react';

export default function TasksPage() {
  const tasks = useTasksStore((state) => state.tasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // ✅ 使用 useMemo 缓存过滤结果
  const filteredTasks = useMemo(() => {
    if (!selectedTask) return tasks;
    return tasks.filter(task => task.id === selectedTask.id);
  }, [tasks, selectedTask]);

  return (
    <div className="space-y-6">
      {filteredTasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
```

---

## 6. 总结

### 优势
- ✅ 已有良好的 Lazy Loading 策略
- ✅ 关键组件使用了 memo/useMemo/useCallback
- ✅ 并行数据获取 (Promise.all)
- ✅ 无深拷贝性能陷阱
- ✅ 无循环内异步操作

### 需改进
- ⚠️ Zustand 选择器返回新对象问题
- ⚠️ API 路由使用内存存储
- ⚠️ 部分计算未 memo 化
- ⚠️ 长列表缺少虚拟化

### 性能债务评分
- **当前评分**: 7/10
- **优化后预期**: 9/10
- **预估优化工时**: 4-6 小时

---

*报告生成时间: 2026-03-08 15:45 GMT+1*
