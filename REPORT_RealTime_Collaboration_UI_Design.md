# Real-time Collaboration UI Design Report
# 实时协作界面 UI 设计报告

**设计者:** 🎨 设计师子代理
**版本:** v1.0.0
**日期:** 2026-04-05
**项目路径:** `/root/.openclaw/workspace`

---

## 📋 目录

1. [项目概述](#项目概述)
2. [现有系统分析](#现有系统分析)
3. [UI 组件设计](#ui-组件设计)
   - [3.1 在线用户指示器](#31-在线用户指示器)
   - [3.2 实时光标/多人编辑指示](#32-实时光标多人编辑指示)
   - [3.3 协作状态面板](#33-协作状态面板)
   - [3.4 实时通知 Toast 系统](#34-实时通知-toast-系统)
4. [Tailwind CSS 规范](#tailwind-css-规范)
5. [React 组件实现](#react-组件实现)
6. [集成方案](#集成方案)
7. [最佳实践](#最佳实践)

---

## 项目概述

### 目标

设计一套完整的实时协作界面 UI 组件系统，为 7zi-frontend 项目提供：

- 多用户在线状态可视化
- 实时光标和编辑指示
- 协作状态监控面板
- 实时通知 Toast 系统

### 技术栈

- **框架:** React 19.2.4 + TypeScript
- **样式:** Tailwind CSS
- **实时通信:** Socket.IO Client 4.7.0
- **WebSocket 管理:** `websocket-manager.ts` (v1.12.2)

### 设计原则

1. **性能优先** - 最小化渲染开销，使用虚拟化和节流
2. **可访问性** - 遵循 WCAG 2.1 AA 标准
3. **响应式设计** - 支持桌面和移动设备
4. **可扩展性** - 组件可复用、可配置
5. **用户体验** - 流畅的动画和直观的交互

---

## 现有系统分析

### WebSocket 系统分析

#### 核心类: `WebSocketManager`

**位置:** `src/lib/websocket-manager.ts`

**关键特性:**

```typescript
// 连接状态枚举
enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

// 连接质量指标
interface ConnectionQuality {
  latencyScore: number        // 0-100
  stabilityScore: number      // 0-100
  packetLossEstimate: number  // 0-1
  qualityLevel: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  overallScore: number        // 0-100
  lastUpdated: number
}
```

**可用方法:**

```typescript
// 连接管理
connect(): void
disconnect(): void
isConnected(): boolean
getState(): ConnectionState

// 消息通信
emit(event: string, data: unknown): boolean
on(event: string, listener: MessageListener): void
off(event: string, listener: MessageListener): void

// 状态监听
onStateChange(listener: ConnectionStateListener): void
getStats(): ConnectionStats
healthCheck(): HealthCheckResult

// 质量监控
registerQualityAlert(config: QualityAlertConfig): void
getConnectionQuality(): ConnectionQuality
```

**优势:**

✅ 完整的心跳机制和重连策略
✅ 连接质量监控和告警
✅ 消息压缩（50% 流量减少）
✅ 连接状态持久化

### 通知系统分析

**位置:** `src/lib/services/notification-center.tsx`

**现有组件:**

- `NotificationCenter` - 通知中心主组件
- `NotificationBadge` - 通知徽章
- `NotificationPopup` - 通知弹窗

**通知类型:**

```typescript
type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'task_assigned'
  | 'task_completed'
  | 'task_updated'
  | 'message'
  | 'system'

type NotificationPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent'
```

**图标映射:**

```typescript
const TYPE_ICONS: Record<NotificationType, string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  task_assigned: '📋',
  task_completed: '✨',
  task_updated: '🔄',
  message: '💬',
  system: '⚙️',
}
```

**优势:**

✅ 完整的通知中心 UI
✅ 支持分组和过滤
✅ 未读计数和统计
✅ 偏好设置和免打扰模式

### 集成机会

基于现有系统，可以：

1. **复用 WebSocketManager** - 用于实时协作数据的传输
2. **扩展通知系统** - 添加协作相关通知类型
3. **利用连接质量** - 在协作 UI 中显示连接状态

---

## UI 组件设计

### 3.1 在线用户指示器

#### 功能需求

- 显示当前在线用户列表
- 显示用户头像、名称、状态
- 支持 hover 显示详细信息
- 显示在线人数计数
- 支持点击查看更多用户

#### UI 设计

##### 组件结构

```
OnlineUsersIndicator
├── UserAvatar (单个用户)
│   ├── Avatar Image
│   ├── Status Indicator (online/away/busy/offline)
│   └── Tooltip (详细信息)
├── OnlineCount (在线计数)
└── UserListModal (用户列表弹窗)
    ├── User List Items
    └── Search/Filter
```

##### 状态颜色方案

```typescript
enum UserStatus {
  ONLINE = 'online',      // 绿色 #10B981
  AWAY = 'away',          // 黄色 #F59E0B
  BUSY = 'busy',          // 红色 #EF4444
  OFFLINE = 'offline',    // 灰色 #6B7280
}

const STATUS_COLORS = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-400',
} as const
```

##### 布局选项

**紧凑型 (Compact)** - 适合工具栏

```
[🟢] [🟡] [🔴] ... (5)
```

**标准型 (Standard)** - 适合侧边栏

```
┌─────────────────┐
│ 👤 Alice       │
│ 👤 Bob         │
│ 👤 Charlie     │
│ 👤 ... (+2)    │
└─────────────────┘
```

**卡片型 (Card)** - 适合面板

```
┌─────────────────────────┐
│ 在线用户 (5)          │
├─────────────────────────┤
│ [头像] Alice  [在线]   │
│ [头像] Bob    [忙碌]   │
│ [头像] Charlie [离开]  │
│ [头像] Dan    [在线]   │
│ [头像] Emily [在线]   │
└─────────────────────────┘
```

#### Tailwind 样式规范

##### 基础样式

```typescript
// 容器
'online-users-container': {
  base: 'flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm',
  compact: 'flex-row',
  standard: 'flex-col items-start',
  card: 'flex-col p-4 bg-white rounded-xl shadow-md',
}

// 用户头像
'user-avatar': {
  base: 'relative w-8 h-8 rounded-full overflow-hidden',
  compact: 'w-8 h-8',
  standard: 'w-10 h-10',
  card: 'w-12 h-12 ring-2 ring-white shadow-lg',
}

// 状态指示器
'status-indicator': {
  base: 'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-400',
}

// 在线计数
'online-count': {
  base: 'text-sm font-medium text-gray-600',
  compact: 'px-2 py-1 bg-gray-100 rounded-full',
  standard: 'text-xs text-gray-500',
  card: 'text-base font-semibold text-gray-700',
}
```

##### 动画效果

```css
/* 用户进入动画 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 状态改变动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* 头像悬停效果 */
.user-avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 状态指示器脉冲 */
.status-indicator.online {
  animation: pulse 2s infinite;
}
```

---

### 3.2 实时光标/多人编辑指示

#### 功能需求

- 显示每个用户的实时光标位置
- 显示用户姓名标签
- 支持不同颜色的光标区分
- 显示选区高亮
- 支持拖拽和移动动画
- 性能优化：节流更新

#### UI 设计

##### 光标元素结构

```
RemoteCursor
├── Cursor SVG (光标图标)
├── Username Label (用户名标签)
└── Selection Highlight (选区高亮)
```

##### 颜色方案

预定义 12 种用户颜色，确保高对比度：

```typescript
const CURSOR_COLORS = [
  '#EF4444', // Red-500
  '#F59E0B', // Amber-500
  '#10B981', // Emerald-500
  '#06B6D4', // Cyan-500
  '#3B82F6', // Blue-500
  '#8B5CF6', // Violet-500
  '#EC4899', // Pink-500
  '#F97316', // Orange-500
  '#84CC16', // Lime-500
  '#14B8A6', // Teal-500
  '#6366F1', // Indigo-500
  '#A855F7', // Purple-500
] as const

// 根据用户 ID 分配颜色
function getUserColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i)
    hash = hash & hash
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]
}
```

##### 光标样式

**SVG 光标:**

```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path
    d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.88a.5.5 0 0 0-.85.33Z"
    fill="currentColor"
    stroke="white"
    stroke-width="1.5"
  />
</svg>
```

**用户名标签:**

```
┌─────────────┐
│ Alice        │ ← 背景色与光标颜色一致
└──────▲───────┘
       │
    光标
```

##### 选区高亮

```
┌─────────────────────┐
│ 这是 Alice 选中的文本  │ ← 半透明背景
└─────────────────────┘
     │           │
   起点         终点
```

#### Tailwind 样式规范

```typescript
// 光标容器
'cursor-container': {
  base: 'absolute pointer-events-none z-50 transition-all duration-100 ease-out',
  // pointer-events-none: 避免阻塞本地用户交互
}

// 光标图标
'cursor-icon': {
  base: 'w-6 h-6 drop-shadow-md',
}

// 用户名标签
'cursor-label': {
  base: 'absolute -top-7 left-0 px-2 py-1 text-xs font-medium text-white rounded-md shadow-lg whitespace-nowrap',
  // 动态背景色通过内联样式设置
}

// 选区高亮
'selection-highlight': {
  base: 'absolute bg-opacity-20 pointer-events-none',
  // 动态背景色通过内联样式设置
}

// 离开动画
'cursor-leaving': {
  base: 'opacity-0 transition-opacity duration-500',
}
```

#### 性能优化策略

1. **节流更新** - 限制更新频率到 60fps (16ms)
2. **虚拟化** - 只渲染可视区域内的光标
3. **批处理更新** - 使用 `requestAnimationFrame` 批量处理位置更新
4. **懒加载** - 远离视口的光标延迟渲染

```typescript
// 节流配置
const CURSOR_UPDATE_THROTTLE = 16 // 16ms = ~60fps
const CURSOR_BATCH_SIZE = 10 // 每帧最多处理 10 个光标更新
const CURSOR_RENDER_DISTANCE = 500 // 距离视口 500px 内才渲染
```

---

### 3.3 协作状态面板

#### 功能需求

- 显示协作会话信息
- 显示在线用户列表（详细）
- 显示连接状态和质量
- 显示实时活动日志
- 显示版本/同步状态
- 支持设置和偏好

#### UI 设计

##### 组件结构

```
CollaborationPanel
├── Header
│   ├── Session Title
│   ├── Connection Status
│   └── Settings Button
├── Connection Quality
│   ├── Latency Indicator
│   ├── Stability Score
│   └── Quality Badge
├── Online Users (Expanded)
│   ├── User Items
│   └── User Actions
├── Activity Log
│   ├── Activity Items
│   └── Timestamps
└── Footer
    ├── Sync Status
    └── Version Info
```

##### 连接质量指示器

**等级划分:**

```
🟢 优秀 (Excellent) - Latency < 50ms, Stability > 95%
🟡 良好 (Good) - Latency < 100ms, Stability > 80%
🟠 一般 (Fair) - Latency < 200ms, Stability > 60%
🔴 较差 (Poor) - Latency < 500ms, Stability > 40%
⚫ 危险 (Critical) - Latency >= 500ms, Stability <= 40%
```

**可视化组件:**

```
┌──────────────────────────────┐
│ 连接质量                      │
│ ━━━━━━━━━━━━━━━━━━━━━━ 95%   │ ← 进度条
│                              │
│ 延迟: 32ms                   │
│ 稳定性: 98%                  │
│ 质量: 🟢 优秀                │
└──────────────────────────────┘
```

##### 活动日志

```
┌──────────────────────────────┐
│ 活动日志                      │
├──────────────────────────────┤
│ 10:45 - Alice 编辑了段落     │
│ 10:44 - Bob 加入了会话        │
│ 10:43 - Charlie 删除了图像   │
│ 10:42 - Dan 上传了文件        │
│ ...                          │
└──────────────────────────────┘
```

##### 版本/同步状态

```
┌──────────────────────────────┐
│ 同步状态: ✅ 已同步           │
│ 版本: v2.3.1                 │
│ 最后更新: 10:45               │
│ 冲突: 0                      │
└──────────────────────────────┘
```

#### Tailwind 样式规范

```typescript
// 面板容器
'collaboration-panel': {
  base: 'flex flex-col bg-white rounded-xl shadow-lg border border-gray-200',
  width: 'w-80',
  height: 'h-96',
}

// 头部
'panel-header': {
  base: 'flex items-center justify-between px-4 py-3 border-b border-gray-200',
  title: 'text-lg font-semibold text-gray-900',
}

// 连接质量
'connection-quality': {
  base: 'px-4 py-3 bg-gray-50',
  label: 'text-sm font-medium text-gray-700',
  progress: 'h-2 bg-gray-200 rounded-full overflow-hidden',
  progressBar: 'h-full transition-all duration-300',
  metrics: 'mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600',
}

// 质量徽章
'quality-badge': {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  fair: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

// 活动日志
'activity-log': {
  base: 'flex-1 overflow-y-auto px-4 py-3',
  item: 'flex items-start gap-2 py-2 text-sm',
  timestamp: 'text-xs text-gray-500 min-w-[60px]',
  content: 'flex-1 text-gray-700',
}

// 同步状态
'sync-status': {
  base: 'px-4 py-3 border-t border-gray-200',
  status: 'flex items-center gap-2 text-sm',
  synced: 'text-green-600',
  syncing: 'text-yellow-600',
  error: 'text-red-600',
}
```

---

### 3.4 实时通知 Toast 系统

#### 功能需求

- 显示协作相关实时通知
- 支持多种通知类型和优先级
- 自动消失（可配置）
- 支持堆叠和队列
- 支持手动关闭
- 支持动作按钮
- 动画进出效果

#### UI 设计

##### 组件结构

```
ToastContainer
├── ToastItem
│   ├── Icon
│   ├── Title
│   ├── Message
│   ├── Actions (可选)
│   └── Close Button
└── Toast Queue (后台)
```

##### 通知类型扩展

基于现有通知系统，新增协作类型：

```typescript
type CollaborationNotificationType =
  // 继承现有类型
  | NotificationType
  // 新增协作类型
  | 'user_joined'      // 用户加入
  | 'user_left'        // 用户离开
  | 'user_editing'     // 用户正在编辑
  | 'user_cursor'      // 光标位置更新
  | 'content_changed'   // 内容变更
  | 'conflict_detected' // 冲突检测
  | 'sync_completed'   // 同步完成
  | 'sync_failed'      // 同步失败
```

##### 通知样式

**成功 (Success):**

```
┌─────────────────────────────┐
│ ✅ 内容已同步                │
│ 所有更改已保存到服务器      │
│                    [关闭]  │
└─────────────────────────────┘
```

**信息 (Info):**

```
┌─────────────────────────────┐
│ ℹ️ Alice 正在编辑段落 3      │
│                   [查看]    │
└─────────────────────────────┘
```

**警告 (Warning):**

```
┌─────────────────────────────┐
│ ⚠️ 检测到冲突                │
│ Bob 和你同时编辑了同一段落  │
│              [解决] [忽略]  │
└─────────────────────────────┘
```

**错误 (Error):**

```
┌─────────────────────────────┐
│ ❌ 同步失败                  │
│ 无法连接到服务器            │
│               [重试] [关闭] │
└─────────────────────────────┘
```

#### Tailwind 样式规范

```typescript
// 容器
'toast-container': {
  base: 'fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-md w-full',
  // 位置可配置：top/bottom + left/right
}

// Toast 项
'toast-item': {
  base: 'bg-white rounded-lg shadow-lg border border-gray-200 p-4 transition-all duration-300',
  entering: 'translate-x-full opacity-0',
  entered: 'translate-x-0 opacity-100',
  exiting: 'translate-x-full opacity-0',
}

// 类型样式
'toast-type': {
  success: 'border-l-4 border-l-green-500',
  info: 'border-l-4 border-l-blue-500',
  warning: 'border-l-4 border-l-yellow-500',
  error: 'border-l-4 border-l-red-500',
}

// 图标
'toast-icon': {
  base: 'flex-shrink-0 w-6 h-6',
  success: 'text-green-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
}

// 内容
'toast-content': {
  title: 'font-semibold text-gray-900',
  message: 'text-sm text-gray-600 mt-1',
}

// 动作按钮
'toast-actions': {
  base: 'flex gap-2 mt-3',
  primary: 'px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700',
  secondary: 'px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300',
}

// 关闭按钮
'toast-close': {
  base: 'absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600',
}
```

#### 动画效果

```css
/* 进入动画 */
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 离开动画 */
@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* 脉冲动画 (高优先级通知) */
@keyframes pulse-border {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
}

.toast-item.urgent {
  animation: pulse-border 2s infinite;
}
```

---

## Tailwind CSS 规范

### 设计 Token

#### 颜色系统

```typescript
// 协作主色
const COLLABORATION_COLORS = {
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // 主色
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  accent: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E', // 强调色
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  // 状态色
  status: {
    success: '#10B981',   // green-500
    warning: '#F59E0B',   // amber-500
    error: '#EF4444',     // red-500
    info: '#3B82F6',      // blue-500
  },
} as const
```

#### 间距系统

```typescript
const SPACING = {
  // 组件间距
  component: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
  },
  // 布局间距
  layout: {
    page: '1.5rem',    // 24px
    section: '2rem',   // 32px
    grid: '1rem',      // 16px
  },
  // 图标间距
  icon: {
    withText: '0.5rem',   // 8px
    standalone: '1rem',    // 16px
  },
} as const
```

#### 圆角系统

```typescript
const RADIUS = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const
```

#### 阴影系统

```typescript
const SHADOW = {
  // 组件阴影
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  // 内阴影
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  // 颜色阴影
  colored: {
    primary: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
    success: '0 4px 14px 0 rgba(16, 185, 129, 0.39)',
    warning: '0 4px 14px 0 rgba(245, 158, 11, 0.39)',
    error: '0 4px 14px 0 rgba(239, 68, 68, 0.39)',
  },
} as const
```

#### 字体系统

```typescript
const TYPOGRAPHY = {
  // 字体族
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'monospace'],
  },
  // 字号
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],      // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
  },
  // 字重
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const
```

### 响应式断点

```typescript
const BREAKPOINTS = {
  sm: '640px',   // 小屏幕
  md: '768px',   // 平板
  lg: '1024px',  // 桌面
  xl: '1280px',  // 大桌面
  '2xl': '1536px', // 超大屏幕
} as const
```

### 动画时间

```typescript
const ANIMATION = {
  duration: {
    'fast': '150ms',
    'normal': '300ms',
    'slow': '500ms',
  },
  easing: {
    'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
    'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
    'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const
```

### Z-Index 层级

```typescript
const Z_INDEX = {
  // 基础层级
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  // 协作组件层级
  tooltip: 50,
  cursor: 100,
  toast: 200,
  modal: 300,
  popover: 400,
} as const
```

---

## React 组件实现

### 组件架构

```
src/components/collaboration/
├── index.ts                          # 导出所有组件
├── OnlineUsers/
│   ├── OnlineUsersIndicator.tsx     # 主组件
│   ├── UserAvatar.tsx               # 用户头像
│   ├── UserListModal.tsx            # 用户列表弹窗
│   └── useOnlineUsers.ts            # Hook
├── RemoteCursor/
│   ├── RemoteCursor.tsx             # 单个光标
│   ├── RemoteCursorContainer.tsx    # 光标容器
│   └── useRemoteCursors.ts          # Hook
├── CollaborationPanel/
│   ├── CollaborationPanel.tsx       # 主面板
│   ├── ConnectionQuality.tsx        # 连接质量
│   ├── ActivityLog.tsx              # 活动日志
│   └── useCollaborationPanel.ts     # Hook
├── CollaborationToast/
│   ├── ToastContainer.tsx           # Toast 容器
│   ├── ToastItem.tsx                # Toast 项
│   └── useCollaborationToast.ts     # Hook
└── hooks/
    ├── useCollaboration.ts          # 通用协作 Hook
    └── useWebSocketCollaboration.ts # WebSocket 集成
```

### 1. 在线用户指示器组件

#### `useOnlineUsers.ts`

```typescript
import { useState, useEffect, useCallback } from 'react'
import { WebSocketManager } from '@/lib/websocket-manager'

export interface OnlineUser {
  id: string
  name: string
  avatar?: string
  status: 'online' | 'away' | 'busy' | 'offline'
  lastActive: number
  cursor?: { x: number; y: number }
}

export function useOnlineUsers(wsManager: WebSocketManager) {
  const [users, setUsers] = useState<Record<string, OnlineUser>>({})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!wsManager.isConnected()) return

    // 监听用户列表更新
    const handleUserList = (data: { users: OnlineUser[]; currentId: string }) => {
      setUsers(
        data.users.reduce((acc, user) => ({ ...acc, [user.id]: user }), {})
      )
      setCurrentUserId(data.currentId)
    }

    // 监听用户加入
    const handleUserJoined = (user: OnlineUser) => {
      setUsers(prev => ({ ...prev, [user.id]: user }))
    }

    // 监听用户离开
    const handleUserLeft = (userId: string) => {
      setUsers(prev => {
        const next = { ...prev }
        delete next[userId]
        return next
      })
    }

    // 监听用户状态更新
    const handleUserStatus = (data: { userId: string; status: OnlineUser['status'] }) => {
      setUsers(prev => ({
        ...prev,
        [data.userId]: {
          ...prev[data.userId],
          status: data.status,
          lastActive: Date.now(),
        },
      }))
    }

    // 监听光标位置
    const handleCursorUpdate = (data: { userId: string; cursor: { x: number; y: number } }) => {
      setUsers(prev => ({
        ...prev,
        [data.userId]: {
          ...prev[data.userId],
          cursor: data.cursor,
          lastActive: Date.now(),
        },
      }))
    }

    // 注册事件监听器
    wsManager.on('collab:user-list', handleUserList)
    wsManager.on('collab:user-joined', handleUserJoined)
    wsManager.on('collab:user-left', handleUserLeft)
    wsManager.on('collab:user-status', handleUserStatus)
    wsManager.on('collab:cursor-update', handleCursorUpdate)

    // 请求初始用户列表
    wsManager.emit('collab:get-users', {})

    return () => {
      wsManager.off('collab:user-list', handleUserList)
      wsManager.off('collab:user-joined', handleUserJoined)
      wsManager.off('collab:user-left', handleUserLeft)
      wsManager.off('collab:user-status', handleUserStatus)
      wsManager.off('collab:cursor-update', handleCursorUpdate)
    }
  }, [wsManager])

  // 更新当前用户状态
  const updateStatus = useCallback((status: OnlineUser['status']) => {
    if (!wsManager.isConnected()) return
    wsManager.emit('collab:update-status', { status })
  }, [wsManager])

  // 更新光标位置（节流）
  const updateCursor = useCallback(
    throttle((x: number, y: number) => {
      if (!wsManager.isConnected()) return
      wsManager.emit('collab:update-cursor', { cursor: { x, y } })
    }, 16), // 16ms = ~60fps
    [wsManager]
  )

  return {
    users: Object.values(users),
    currentUserId,
    isOnline: (userId: string) => users[userId]?.status === 'online',
    updateStatus,
    updateCursor,
  }
}
```

#### `OnlineUsersIndicator.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useOnlineUsers } from './useOnlineUsers'
import { UserAvatar } from './UserAvatar'
import { UserListModal } from './UserListModal'

interface OnlineUsersIndicatorProps {
  wsManager: WebSocketManager
  layout?: 'compact' | 'standard' | 'card'
  maxVisible?: number
  className?: string
}

export function OnlineUsersIndicator({
  wsManager,
  layout = 'standard',
  maxVisible = 5,
  className = '',
}: OnlineUsersIndicatorProps) {
  const { users, currentUserId, isOnline } = useOnlineUsers(wsManager)
  const [showModal, setShowModal] = useState(false)

  // 过滤在线用户
  const onlineUsers = users.filter(u => isOnline(u.id))
  const visibleUsers = onlineUsers.slice(0, maxVisible)
  const hiddenCount = Math.max(0, onlineUsers.length - maxVisible)

  if (onlineUsers.length === 0) {
    return null
  }

  return (
    <>
      <div
        className={`online-users-container online-users-${layout} ${className}`}
        onClick={() => setShowModal(true)}
      >
        {layout === 'compact' && (
          <div className="flex items-center gap-1">
            {visibleUsers.map(user => (
              <UserAvatar key={user.id} user={user} size="sm" showStatus={false} />
            ))}
            {hiddenCount > 0 && (
              <span className="online-count online-count-compact">
                +{hiddenCount}
              </span>
            )}
          </div>
        )}

        {layout === 'standard' && (
          <div className="flex flex-col gap-2">
            {visibleUsers.map(user => (
              <div key={user.id} className="flex items-center gap-2">
                <UserAvatar user={user} size="md" showStatus />
                <span className="text-sm text-gray-700">{user.name}</span>
              </div>
            ))}
            {hiddenCount > 0 && (
              <span className="online-count online-count-standard text-xs text-gray-500">
                和其他 {hiddenCount} 位用户在线
              </span>
            )}
          </div>
        )}

        {layout === 'card' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="online-count online-count-card">
                在线用户 ({onlineUsers.length})
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {visibleUsers.map(user => (
                <div key={user.id} className="flex items-center gap-3">
                  <UserAvatar user={user} size="lg" showStatus />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">
                      {user.status === 'online' ? '在线' :
                       user.status === 'away' ? '离开' :
                       user.status === 'busy' ? '忙碌' : '离线'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {hiddenCount > 0 && (
              <button
                className="text-sm text-blue-600 hover:text-blue-700"
                onClick={() => setShowModal(true)}
              >
                查看全部 {onlineUsers.length} 位用户 →
              </button>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <UserListModal
          users={users}
          currentUserId={currentUserId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
```

#### `UserAvatar.tsx`

```typescript
'use client'

import { useMemo } from 'react'
import { Tooltip } from '@/components/ui/Tooltip'

interface UserAvatarProps {
  user: {
    id: string
    name: string
    avatar?: string
    status: 'online' | 'away' | 'busy' | 'offline'
  }
  size?: 'sm' | 'md' | 'lg'
  showStatus?: boolean
  className?: string
}

const STATUS_COLORS = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-400',
} as const

const SIZES = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
} as const

export function UserAvatar({
  user,
  size = 'md',
  showStatus = true,
  className = '',
}: UserAvatarProps) {
  const initials = useMemo(
    () => user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    [user.name]
  )

  const avatarColor = useMemo(() => {
    let hash = 0
    for (let i = 0; i < user.id.length; i++) {
      hash = ((hash << 5) - hash) + user.id.charCodeAt(i)
      hash = hash & hash
    }
    const colors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-green-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-purple-500',
      'bg-pink-500',
    ]
    return colors[Math.abs(hash) % colors.length]
  }, [user.id])

  return (
    <Tooltip content={user.name}>
      <div className={`user-avatar user-avatar-${size} ${className}`}>
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-white font-medium ${avatarColor}`}>
            {initials}
          </div>
        )}
        {showStatus && (
          <span className={`status-indicator status-indicator-${user.status}`} />
        )}
      </div>
    </Tooltip>
  )
}
```

### 2. 实时光标组件

#### `useRemoteCursors.ts`

```typescript
import { useState, useEffect, useCallback, useRef } from 'react'
import { WebSocketManager } from '@/lib/websocket-manager'

export interface RemoteCursor {
  userId: string
  userName: string
  userColor: string
  position: { x: number; y: number }
  selection?: { start: { x: number; y: number }; end: { x: number; y: number } }
  lastUpdate: number
}

const CURSOR_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6',
  '#8B5CF6', '#EC4899', '#F97316', '#84CC16', '#14B8A6',
  '#6366F1', '#A855F7',
] as const

function getUserColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i)
    hash = hash & hash
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]
}

// 节流函数
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function useRemoteCursors(wsManager: WebSocketManager) {
  const [cursors, setCursors] = useState<Record<string, RemoteCursor>>({})
  const cursorUpdateQueueRef = useRef<Map<string, RemoteCursor>>(new Map())

  // 批量处理光标更新
  const processBatch = useCallback(() => {
    if (cursorUpdateQueueRef.current.size === 0) return

    const updates = Array.from(cursorUpdateQueueRef.current.values())
    cursorUpdateQueueRef.current.clear()

    setCursors(prev => {
      const next = { ...prev }
      updates.forEach(cursor => {
        next[cursor.userId] = cursor
      })
      return next
    })
  }, [])

  // 定期处理批处理队列
  useEffect(() => {
    const interval = setInterval(processBatch, 16) // 16ms = ~60fps
    return () => clearInterval(interval)
  }, [processBatch])

  useEffect(() => {
    if (!wsManager.isConnected()) return

    const handleCursorUpdate = (data: {
      userId: string
      userName: string
      position: { x: number; y: number }
      selection?: { start: { x: number; y: number }; end: { x: number; y: number } }
    }) => {
      // 添加到批处理队列
      cursorUpdateQueueRef.current.set(data.userId, {
        userId: data.userId,
        userName: data.userName,
        userColor: getUserColor(data.userId),
        position: data.position,
        selection: data.selection,
        lastUpdate: Date.now(),
      })
    }

    const handleUserLeft = (userId: string) => {
      setCursors(prev => {
        const next = { ...prev }
        delete next[userId]
        return next
      })
    }

    wsManager.on('collab:cursor-update', handleCursorUpdate)
    wsManager.on('collab:user-left', handleUserLeft)

    return () => {
      wsManager.off('collab:cursor-update', handleCursorUpdate)
      wsManager.off('collab:user-left', handleUserLeft)
    }
  }, [wsManager])

  // 清理过期光标（超过 30 秒未更新）
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setCursors(prev => {
        const next = { ...prev }
        Object.entries(prev).forEach(([userId, cursor]) => {
          if (now - cursor.lastUpdate > 30000) {
            delete next[userId]
          }
        })
        return next
      })
    }, 10000) // 每 10 秒清理一次

    return () => clearInterval(interval)
  }, [])

  return {
    cursors: Object.values(cursors),
  }
}
```

#### `RemoteCursor.tsx`

```typescript
'use client'

import { RemoteCursor as RemoteCursorType } from './useRemoteCursors'

interface RemoteCursorProps {
  cursor: RemoteCursorType
}

const CURSOR_SVG = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-6 h-6"
  >
    <path
      d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.88a.5.5 0 0 0-.85.33Z"
      fill="currentColor"
      stroke="white"
      strokeWidth="1.5"
    />
  </svg>
)

export function RemoteCursor({ cursor }: RemoteCursorProps) {
  return (
    <>
      {/* 光标 */}
      <div
        className="cursor-container"
        style={{
          left: cursor.position.x,
          top: cursor.position.y,
          color: cursor.userColor,
        }}
      >
        <div className="cursor-icon">{CURSOR_SVG}</div>

        {/* 用户名标签 */}
        <div
          className="cursor-label"
          style={{ backgroundColor: cursor.userColor }}
        >
          {cursor.userName}
        </div>
      </div>

      {/* 选区高亮 */}
      {cursor.selection && (
        <div
          className="selection-highlight"
          style={{
            left: Math.min(cursor.selection.start.x, cursor.selection.end.x),
            top: Math.min(cursor.selection.start.y, cursor.selection.end.y),
            width: Math.abs(cursor.selection.end.x - cursor.selection.start.x),
            height: Math.abs(cursor.selection.end.y - cursor.selection.start.y),
            backgroundColor: cursor.userColor,
          }}
        />
      )}
    </>
  )
}
```

#### `RemoteCursorContainer.tsx`

```typescript
'use client'

import { useRemoteCursors } from './useRemoteCursors'
import { RemoteCursor } from './RemoteCursor'
import { WebSocketManager } from '@/lib/websocket-manager'

interface RemoteCursorContainerProps {
  wsManager: WebSocketManager
  contentRef: React.RefObject<HTMLElement>
}

export function RemoteCursorContainer({ wsManager, contentRef }: RemoteCursorContainerProps) {
  const { cursors } = useRemoteCursors(wsManager)

  return (
    <div className="relative w-full h-full pointer-events-none">
      {cursors.map(cursor => (
        <RemoteCursor key={cursor.userId} cursor={cursor} />
      ))}
    </div>
  )
}
```

### 3. 协作状态面板组件

#### `useCollaborationPanel.ts`

```typescript
import { useState, useEffect, useCallback } from 'react'
import { WebSocketManager, ConnectionQuality } from '@/lib/websocket-manager'

export interface ActivityLogEntry {
  id: string
  type: 'edit' | 'join' | 'leave' | 'upload' | 'comment'
  userId: string
  userName: string
  message: string
  timestamp: number
}

export function useCollaborationPanel(wsManager: WebSocketManager) {
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality | null>(null)
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced')

  useEffect(() => {
    // 监听连接状态变化
    const handleStateChange = (state: string) => {
      setIsConnected(state === 'connected')

      if (state === 'connected') {
        addActivityLog({
          type: 'join',
          userId: 'system',
          userName: '系统',
          message: '已连接到协作服务器',
          timestamp: Date.now(),
        })
      } else if (state === 'disconnected') {
        addActivityLog({
          type: 'leave',
          userId: 'system',
          userName: '系统',
          message: '与协作服务器断开连接',
          timestamp: Date.now(),
        })
      }
    }

    // 监听连接质量
    const checkQuality = () => {
      const quality = wsManager.getConnectionQuality?.()
      if (quality) {
        setConnectionQuality(quality)
      }
    }

    // 监听活动日志
    const handleActivity = (data: ActivityLogEntry) => {
      addActivityLog(data)
    }

    // 监听同步状态
    const handleSyncStart = () => setSyncStatus('syncing')
    const handleSyncComplete = () => setSyncStatus('synced')
    const handleSyncError = () => setSyncStatus('error')

    wsManager.onStateChange(handleStateChange)
    wsManager.on('collab:activity', handleActivity)
    wsManager.on('collab:sync-start', handleSyncStart)
    wsManager.on('collab:sync-complete', handleSyncComplete)
    wsManager.on('collab:sync-error', handleSyncError)

    // 定期检查连接质量
    const qualityInterval = setInterval(checkQuality, 5000)

    // 初始检查
    checkQuality()
    setIsConnected(wsManager.isConnected())

    return () => {
      wsManager.offStateChange(handleStateChange)
      wsManager.off('collab:activity', handleActivity)
      wsManager.off('collab:sync-start', handleSyncStart)
      wsManager.off('collab:sync-complete', handleSyncComplete)
      wsManager.off('collab:sync-error', handleSyncError)
      clearInterval(qualityInterval)
    }
  }, [wsManager])

  const addActivityLog = useCallback((entry: ActivityLogEntry) => {
    setActivityLog(prev => [
      {
        ...entry,
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      },
      ...prev.slice(0, 99), // 保留最近 100 条
    ])
  }, [])

  const clearActivityLog = useCallback(() => {
    setActivityLog([])
  }, [])

  return {
    connectionQuality,
    activityLog,
    isConnected,
    syncStatus,
    clearActivityLog,
    healthCheck: wsManager.healthCheck,
  }
}
```

#### `CollaborationPanel.tsx`

```typescript
'use client'

import { useCollaborationPanel } from './useCollaborationPanel'
import { ConnectionQuality } from './ConnectionQuality'
import { ActivityLog } from './ActivityLog'
import { WebSocketManager } from '@/lib/websocket-manager'
import { X, Settings, RefreshCw } from 'lucide-react'

interface CollaborationPanelProps {
  wsManager: WebSocketManager
  className?: string
}

export function CollaborationPanel({ wsManager, className = '' }: CollaborationPanelProps) {
  const { connectionQuality, activityLog, isConnected, syncStatus, clearActivityLog, healthCheck } =
    useCollaborationPanel(wsManager)

  const handleHealthCheck = () => {
    const result = healthCheck()
    console.log('Health check result:', result)
  }

  return (
    <div className={`collaboration-panel ${className}`}>
      {/* 头部 */}
      <div className="panel-header">
        <h2 className="panel-title">协作面板</h2>
        <div className="flex gap-2">
          <button
            onClick={handleHealthCheck}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            title="健康检查"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
            <Settings className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 连接质量 */}
      <div className="connection-quality">
        <div className="flex items-center justify-between mb-2">
          <span className="connection-quality-label">连接质量</span>
          <span className="text-xs text-gray-500">
            {connectionQuality?.latencyScore ? `${connectionQuality.latencyScore}/100` : '--'}
          </span>
        </div>
        <div className="quality-progress">
          <div
            className="quality-progress-bar"
            style={{
              width: `${connectionQuality?.overallScore || 0}%`,
              backgroundColor:
                connectionQuality?.qualityLevel === 'excellent' ? '#10B981' :
                connectionQuality?.qualityLevel === 'good' ? '#3B82F6' :
                connectionQuality?.qualityLevel === 'fair' ? '#F59E0B' :
                connectionQuality?.qualityLevel === 'poor' ? '#F97316' : '#EF4444',
            }}
          />
        </div>
        <div className="quality-metrics">
          <div>
            <span className="text-gray-500">延迟</span>
            <span className="font-medium text-gray-900 ml-1">
              {connectionQuality ? `${Math.round(connectionQuality.lastUpdated - Date.now())}ms` : '--'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">稳定性</span>
            <span className="font-medium text-gray-900 ml-1">
              {connectionQuality ? `${connectionQuality.stabilityScore}%` : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* 活动日志 */}
      <div className="activity-log">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">活动日志</span>
          <button
            onClick={clearActivityLog}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            清空
          </button>
        </div>
        <ActivityLog entries={activityLog} />
      </div>

      {/* 同步状态 */}
      <div className="sync-status">
        <div className="sync-status-element">
          {syncStatus === 'synced' && (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="sync-status-synced">已同步</span>
            </>
          )}
          {syncStatus === 'syncing' && (
            <>
              <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />
              <span className="text-yellow-600">同步中...</span>
            </>
          )}
          {syncStatus === 'error' && (
            <>
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="sync-status-error">同步失败</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 4. 实时通知 Toast 组件

#### `useCollaborationToast.ts`

```typescript
import { useState, useCallback } from 'react'

export type ToastType = 'success' | 'info' | 'warning' | 'error'
export type ToastPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message: string
  priority: ToastPriority
  duration?: number
  actions?: ToastAction[]
  timestamp: number
}

export interface ToastAction {
  label: string
  onClick: () => void
  primary?: boolean
}

export function useCollaborationToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id' | 'timestamp'>) => {
    const newToast: Toast = {
      ...toast,
      id: `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    }

    setToasts(prev => [...prev, newToast])

    // 自动移除
    if (toast.duration !== 0) {
      const duration = toast.duration ?? (toast.priority === 'urgent' ? 0 : 5000)
      if (duration > 0) {
        setTimeout(() => {
          removeToast(newToast.id)
        }, duration)
      }
    }

    return newToast.id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  // 快捷方法
  const success = useCallback((title: string, message: string, options?: Partial<Omit<Toast, 'type' | 'id' | 'timestamp'>>) => {
    return addToast({ type: 'success', title, message, priority: 'medium', ...options })
  }, [addToast])

  const info = useCallback((title: string, message: string, options?: Partial<Omit<Toast, 'type' | 'id' | 'timestamp'>>) => {
    return addToast({ type: 'info', title, message, priority: 'low', ...options })
  }, [addToast])

  const warning = useCallback((title: string, message: string, options?: Partial<Omit<Toast, 'type' | 'id' | 'timestamp'>>) => {
    return addToast({ type: 'warning', title, message, priority: 'high', ...options })
  }, [addToast])

  const error = useCallback((title: string, message: string, options?: Partial<Omit<Toast, 'type' | 'id' | 'timestamp'>>) => {
    return addToast({ type: 'error', title, message, priority: 'urgent', ...options })
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    info,
    warning,
    error,
  }
}
```

#### `ToastContainer.tsx`

```typescript
'use client'

import { useCollaborationToast, Toast } from './useCollaborationToast'
import { ToastItem } from './ToastItem'

export function ToastContainer() {
  const { toasts, removeToast } = useCollaborationToast()

  // 根据 priority 排序，urgent 在前
  const sortedToasts = [...toasts].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  return (
    <div className="toast-container">
      {sortedToasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}
```

#### `ToastItem.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Toast, ToastType } from './useCollaborationToast'
import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-react'

interface ToastItemProps {
  toast: Toast
  onClose: () => void
}

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  error: <XCircle className="w-5 h-5" />,
}

export function ToastItem({ toast, onClose }: ToastItemProps) {
  const [exiting, setExiting] = useState(false)

  const handleClose = () => {
    setExiting(true)
    setTimeout(onClose, 300) // 等待动画完成
  }

  useEffect(() => {
    // 如果是 urgent 类型，自动关闭
    if (toast.duration === 0) {
      const timer = setTimeout(handleClose, 10000) // 10 秒后自动关闭
      return () => clearTimeout(timer)
    }
  }, [toast.duration])

  return (
    <div
      className={`toast-item toast-item-${toast.type} ${exiting ? 'exiting' : ''} ${toast.priority === 'urgent' ? 'urgent' : ''}`}
    >
      <div className="toast-icon toast-icon-{toast.type}">{TOAST_ICONS[toast.type]}</div>

      <div className="flex-1">
        <p className="toast-content-toast-title">{toast.title}</p>
        {toast.message && (
          <p className="toast-content-toast-message">{toast.message}</p>
        )}

        {toast.actions && toast.actions.length > 0 && (
          <div className="toast-actions">
            {toast.actions.map((action, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  action.onClick()
                  handleClose()
                }}
                className={`toast-actions-${action.primary ? 'primary' : 'secondary'}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleClose}
        className="toast-close"
        aria-label="关闭"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
```

---

## 集成方案

### 组件树结构

```
App
├── ToastContainer (全局)
├── CollaborationPanel (侧边栏)
│   ├── ConnectionQuality
│   └── ActivityLog
└── Content Area
    ├── OnlineUsersIndicator (工具栏)
    └── RemoteCursorContainer (覆盖层)
        └── RemoteCursor[]
```

### 初始化示例

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { WebSocketManager } from '@/lib/websocket-manager'
import { OnlineUsersIndicator } from '@/components/collaboration/OnlineUsers'
import { RemoteCursorContainer } from '@/components/collaboration/RemoteCursor'
import { CollaborationPanel } from '@/components/collaboration/CollaborationPanel'
import { ToastContainer } from '@/components/collaboration/CollaborationToast'

export default function CollaborativeEditor() {
  const wsManagerRef = useRef<WebSocketManager | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 初始化 WebSocket 连接
    wsManagerRef.current = new WebSocketManager({
      url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000',
      autoConnect: true,
      auth: {
        token: localStorage.getItem('auth_token'),
      },
    })

    return () => {
      wsManagerRef.current?.disconnect()
    }
  }, [])

  if (!wsManagerRef.current) {
    return <div>连接中...</div>
  }

  return (
    <div className="flex h-screen">
      {/* 协作面板 */}
      <aside className="w-80 border-r border-gray-200">
        <CollaborationPanel wsManager={wsManagerRef.current} />
      </aside>

      {/* 主内容区域 */}
      <main className="flex-1 relative">
        {/* 工具栏 */}
        <header className="flex items-center gap-4 p-4 border-b border-gray-200">
          <OnlineUsersIndicator
            wsManager={wsManagerRef.current}
            layout="compact"
          />
        </header>

        {/* 编辑器内容 */}
        <div ref={contentRef} className="relative w-full h-[calc(100vh-4rem)]">
          {/* 远程光标 */}
          <RemoteCursorContainer
            wsManager={wsManagerRef.current}
            contentRef={contentRef}
          />

          {/* 编辑器 */}
          <Editor />
        </div>
      </main>

      {/* Toast 容器 */}
      <ToastContainer />
    </div>
  )
}
```

### 事件协议

#### 客户端 → 服务器

```typescript
// 获取在线用户列表
wsManager.emit('collab:get-users', {})

// 更新用户状态
wsManager.emit('collab:update-status', { status: 'online' })

// 更新光标位置
wsManager.emit('collab:update-cursor', {
  cursor: { x: 100, y: 200 },
  selection: { start: { x: 100, y: 200 }, end: { x: 150, y: 200 } }
})

// 发送编辑操作
wsManager.emit('collab:edit', {
  operation: 'insert',
  position: { line: 10, column: 5 },
  content: 'Hello',
})
```

#### 服务器 → 客户端

```typescript
// 用户列表更新
wsManager.on('collab:user-list', (data: { users: OnlineUser[]; currentId: string }) => {
  // 更新在线用户列表
})

// 用户加入
wsManager.on('collab:user-joined', (user: OnlineUser) => {
  // 显示加入通知
  toast.info(`${user.name} 加入了会话`, '')
})

// 用户离开
wsManager.on('collab:user-left', (userId: string) => {
  // 移除用户和光标
})

// 用户状态更新
wsManager.on('collab:user-status', (data: { userId: string; status: UserStatus }) => {
  // 更新用户状态指示器
})

// 光标位置更新
wsManager.on('collab:cursor-update', (data: {
  userId: string
  userName: string
  position: { x: number; y: number }
  selection?: Selection
}) => {
  // 更新远程光标位置
})

// 编辑操作
wsManager.on('collab:edit', (data: {
  userId: string
  userName: string
  operation: 'insert' | 'delete' | 'replace'
  position: { line: number; column: number }
  content: string
}) => {
  // 应用远程编辑
})

// 同步状态
wsManager.on('collab:sync-start', () => {
  // 开始同步
})

wsManager.on('collab:sync-complete', () => {
  toast.success('同步完成', '所有更改已保存')
})

wsManager.on('collab:sync-error', (error: string) => {
  toast.error('同步失败', error)
})

// 活动日志
wsManager.on('collab:activity', (data: ActivityLogEntry) => {
  // 添加到活动日志
})
```

---

## 最佳实践

### 性能优化

1. **节流和防抖**
   - 光标更新：节流到 16ms (~60fps)
   - 状态同步：防抖到 500ms
   - 用户输入：防抖到 300ms

2. **虚拟化**
   - 用户列表：超过 50 个用户时启用虚拟滚动
   - 活动日志：只渲染可见区域
   - Toast：限制最多 5 个同时显示

3. **批处理**
   - 光标更新：批量处理（每帧最多 10 个）
   - DOM 更新：使用 `requestAnimationFrame`

4. **内存管理**
   - 清理过期光标（30 秒）
   - 限制活动日志数量（100 条）
   - 定期清理缓存

### 可访问性

1. **键盘导航**
   - 所有交互组件支持 Tab 键导航
   - 使用 `role` 和 `aria-*` 属性

2. **屏幕阅读器**
   - 状态变更：使用 `aria-live="polite"` 通知
   - 通知：添加 `role="alert"` 和 `aria-describedby`
   - 用户列表：添加 `role="list"` 和 `aria-label`

3. **颜色对比度**
   - 文本对比度至少 4.5:1
   - 交互元素对比度至少 3:1
   - 状态指示器有额外视觉提示（图标 + 颜色）

### 安全性

1. **XSS 防护**
   - 所有用户输入使用 React 自动转义
   - 避免使用 `dangerouslySetInnerHTML`
   - 用户名和消息进行长度限制

2. **CSRF 防护**
   - WebSocket 认证使用 Token
   - 敏感操作验证用户权限

3. **权限控制**
   - 查看光标：需要会话权限
   - 编辑操作：需要编辑权限
   - 用户信息：基于可见性设置

### 错误处理

1. **连接错误**
   - 显示友好的错误提示
   - 提供重试按钮
   - 降级到离线模式

2. **同步错误**
   - 记录错误日志
   - 通知用户
   - 提供冲突解决选项

3. **性能降级**
   - 连接质量差时减少更新频率
   - 限制光标渲染数量
   - 禁用动画效果

### 测试策略

1. **单元测试**
   - Hook 逻辑测试
   - 组件渲染测试
   - 工具函数测试

2. **集成测试**
   - WebSocket 通信测试
   - 组件集成测试
   - 事件流测试

3. **E2E 测试**
   - 用户加入/离开流程
   - 实时编辑场景
   - 错误恢复流程

---

## 附录

### A. 完整类型定义

```typescript
// 用户状态
export enum UserStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

// 用户信息
export interface OnlineUser {
  id: string
  name: string
  avatar?: string
  status: UserStatus
  lastActive: number
  cursor?: { x: number; y: number }
}

// 远程光标
export interface RemoteCursor {
  userId: string
  userName: string
  userColor: string
  position: { x: number; y: number }
  selection?: { start: { x: number; y: number }; end: { x: number; y: number } }
  lastUpdate: number
}

// 活动日志
export interface ActivityLogEntry {
  id: string
  type: 'edit' | 'join' | 'leave' | 'upload' | 'comment'
  userId: string
  userName: string
  message: string
  timestamp: number
}

// Toast 通知
export interface Toast {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  duration?: number
  actions?: ToastAction[]
  timestamp: number
}

export interface ToastAction {
  label: string
  onClick: () => void
  primary?: boolean
}

// WebSocket 事件
export type CollaborationEvent =
  | { event: 'collab:get-users'; data: {} }
  | { event: 'collab:user-list'; data: { users: OnlineUser[]; currentId: string } }
  | { event: 'collab:user-joined'; data: OnlineUser }
  | { event: 'collab:user-left'; data: string }
  | { event: 'collab:user-status'; data: { userId: string; status: UserStatus } }
  | { event: 'collab:cursor-update'; data: RemoteCursor }
  | { event: 'collab:edit'; data: EditOperation }
  | { event: 'collab:sync-start'; data: {} }
  | { event: 'collab:sync-complete'; data: {} }
  | { event: 'collab:sync-error'; data: string }
  | { event: 'collab:activity'; data: ActivityLogEntry }
```

### B. 常量配置

```typescript
// 光标颜色
export const CURSOR_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6',
  '#8B5CF6', '#EC4899', '#F97316', '#84CC16', '#14B8A6',
  '#6366F1', '#A855F7',
] as const

// 状态颜色
export const STATUS_COLORS = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-400',
} as const

// Toast 配置
export const TOAST_CONFIG = {
  maxVisible: 5,
  defaultDuration: 5000,
  urgentDuration: 0, // 不自动关闭
  positions: ['top-right', 'top-left', 'bottom-right', 'bottom-left'] as const,
} as const

// 性能配置
export const PERFORMANCE_CONFIG = {
  cursorUpdateThrottle: 16, // 16ms = ~60fps
  cursorBatchSize: 10,
  cursorRenderDistance: 500,
  cursorExpireTime: 30000, // 30秒
  activityLogMaxSize: 100,
  maxVisibleUsers: 50,
} as const
```

### C. 示例场景

#### 场景 1：用户加入

```
1. Alice 打开编辑器
2. 建立 WebSocket 连接
3. 发送 collab:get-users
4. 服务器返回当前在线用户
5. 显示在线用户指示器
6. 显示欢迎 Toast
```

#### 场景 2：实时光标

```
1. Bob 移动鼠标
2. 客户端节流光标更新 (16ms)
3. 发送 collab:update-cursor
4. 服务器广播给其他用户
5. Alice 收到 collab:cursor-update
6. 添加到批处理队列
7. 下一帧批量更新光标位置
```

#### 场景 3：冲突处理

```
1. Alice 和 Bob 同时编辑同一段落
2. 服务器检测到冲突
3. 发送 collab:conflict-detected
4. 显示警告 Toast
5. 提供"接受我的更改"和"接受对方更改"按钮
6. 用户选择解决方案
7. 同步更新
```

### D. 故障排查

#### 问题：光标闪烁

**可能原因：**
- 更新频率过高
- 批处理未生效
- CSS 动画冲突

**解决方案：**
- 增加节流时间到 30ms
- 检查批处理逻辑
- 优化 CSS 动画

#### 问题：连接频繁断开

**可能原因：**
- 网络不稳定
- 心跳超时设置过短
- 服务器负载过高

**解决方案：**
- 增加心跳间隔
- 优化重连策略
- 显示连接质量指示器

#### 问题：内存泄漏

**可能原因：**
- 未清理事件监听器
- 光标未过期删除
- 活动日志无限增长

**解决方案：**
- 确保 useEffect 清理
- 实现自动过期机制
- 限制日志大小

---

## 总结

本设计文档提供了完整的实时协作界面 UI 组件系统，包括：

✅ **4 个核心组件**
- 在线用户指示器
- 实时光标/多人编辑指示
- 协作状态面板
- 实时通知 Toast 系统

✅ **完整的技术实现**
- React 19 + TypeScript
- Tailwind CSS 规范
- WebSocket 集成方案
- 性能优化策略

✅ **生产级质量**
- 可访问性支持
- 错误处理机制
- 安全性考虑
- 测试策略

### 下一步建议

1. **组件开发**
   - 按照设计文档实现各个组件
   - 编写单元测试和集成测试

2. **性能测试**
   - 压力测试（100+ 用户）
   - 网络延迟测试
   - 移动端性能优化

3. **用户测试**
   - 可用性测试
   - 反馈收集
   - 迭代优化

4. **文档完善**
   - 组件 Storybook
   - API 文档
   - 集成指南

---

**文档版本:** v1.0.0
**最后更新:** 2026-04-05
**设计者:** 🎨 设计师子代理
**审核者:** 待定

---

## 参考文献

- [React 19 文档](https://react.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Socket.IO 文档](https://socket.io/docs/v4/)
- [WCAG 2.1 标准](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebSocket 最佳实践](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
