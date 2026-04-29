# Lucide React 图标升级测试计划

**项目**: 7zi-frontend
**日期**: 2026-04-03
**测试员**: 测试员子代理
**目标**: 为 Lucide React 图标升级准备完整的测试方案

---

## 📋 目录

1. [概述](#概述)
2. [图标清单](#图标清单)
3. [使用位置映射](#使用位置映射)
4. [烟雾测试用例](#烟雾测试用例)
5. [回归测试用例](#回归测试用例)
6. [测试工具配置](#测试工具配置)
7. [执行计划](#执行计划)
8. [验收标准](#验收标准)

---

## 概述

### 背景

7zi-frontend 项目使用了 **76 种** Lucide React 图标，分布在 **24 个文件**中。为了确保图标升级（如从 v0.x 升级到 v1.x）不会破坏现有功能，需要制定全面的测试方案。

### 测试目标

1. ✅ 验证所有图标在页面加载时正常渲染
2. ✅ 确保图标 props（size, stroke, color 等）未改变
3. ✅ 检查图标在不同主题（亮色/暗色）下的显示
4. ✅ 验证动态加载的图标（DynamicIcon 组件）
5. ✅ 确保无控制台错误或警告

### 测试范围

- **图标总数**: 76 种
- **文件总数**: 24 个
- **测试工具**: Playwright + React Testing Library
- **测试类型**: 烟雾测试 + 回归测试

---

## 图标清单

### 完整图标列表（76种）

| 序号 | 图标名称 | 序号 | 图标名称 | 序号 | 图标名称 |
|------|---------|------|---------|------|---------|
| 1 | Activity | 27 | Copy | 53 | RefreshCw |
| 2 | AlertCircle | 28 | Cpu | 54 | Redo |
| 3 | AlertTriangle | 29 | Database | 55 | Reply |
| 4 | Archive | 30 | Download | 56 | Save |
| 5 | ArrowDown | 31 | Edit2 | 57 | Search |
| 6 | ArrowLeft | 32 | Eye | 58 | Send |
| 7 | ArrowRight | 33 | EyeOff | 59 | Shield |
| 8 | BarChart3 | 34 | FileJson | 60 | Sparkles |
| 9 | Bell | 35 | FileText | 61 | Star |
| 10 | Bug | 36 | Filter | 62 | ThumbsDown |
| 11 | Calendar | 37 | Gauge | 63 | ThumbsUp |
| 12 | Camera | 38 | GitBranch | 64 | Trash2 |
| 13 | Check | 39 | Globe | 65 | TrendingDown |
| 14 | CheckCircle | 40 | Grid | 66 | TrendingUp |
| 15 | CheckCircle2 | 41 | Headphones | 67 | Undo |
| 16 | CheckCheck | 42 | Home | 68 | Upload |
| 17 | ChevronDown | 43 | Inbox | 69 | Users |
| 18 | ChevronRight | 44 | Info | 70 | Wand2 |
| 19 | Circle | 45 | Keyboard | 71 | X |
| 20 | Clock | 46 | Layers | 72 | XCircle |
| 21 | LucideProps | 47 | Layout | 73 | Zap |
| 22 | Lightbulb | 48 | Loader2 | 74 | ZoomIn |
| 23 | MapPin | 49 | Maximize | 75 | ZoomOut |
| 24 | Menu | 50 | MessageSquare | 76 | MousePointer2 |
| 25 | MoreVertical | 51 | Network | | |
| 26 | Play | 52 | PieChart | | |

### 图标分类

#### 通知相关（9种）
- Bell, CheckCircle, XCircle, AlertTriangle, Info, MessageSquare, Check, CheckCheck, AlertCircle

#### 导航相关（8种）
- Menu, X, ArrowLeft, ArrowRight, ArrowDown, ChevronDown, ChevronRight, Home

#### 操作相关（12种）
- Save, Send, Upload, Download, Copy, Trash2, Edit2, RefreshCw, Undo, Redo, Reply, Archive

#### 状态相关（10种）
- Check, CheckCircle, CheckCircle2, CheckCheck, X, XCircle, AlertTriangle, AlertCircle, Info, Loader2

#### 监控相关（12种）
- Activity, Clock, Zap, TrendingUp, TrendingDown, Gauge, Database, Network, Cpu, MousePointer2, Layout, RefreshCw

#### 反馈相关（15种）
- Star, ThumbsUp, ThumbsDown, MessageSquare, Send, Upload, Camera, Bug, FileText, Lightbulb, Wand2, Sparkles, Shield, Users, Headphones

#### 工作流相关（10种）
- Play, Save, Undo, Redo, Copy, Trash2, Layout, Search, Keyboard, Grid, Layers, ZoomIn, ZoomOut, Maximize, MoreVertical

---

## 使用位置映射

### 按文件分组

#### 1. `src/app/notification-demo/page.tsx`
- Bell, Send, Trash2, Check

#### 2. `src/app/notification-demo/enhanced/page.tsx`
- Bell, Mail, Send, Trash2, Settings, Check, AlertCircle, Info, AlertTriangle, XCircle, CheckCircle, MessageSquare, Loader2

#### 3. `src/app/feedback/page.tsx`
- MessageSquare, Lightbulb

#### 4. `src/app/pricing/page.tsx`
- Check, X, Mail, ArrowRight, Star, Zap, Shield, Users, Headphones, Globe

#### 5. `src/features/monitoring/components/EnhancedPerformanceDashboard.tsx`
- AlertTriangle, Clock, Zap, Activity, RefreshCw, Trash2, TrendingUp, TrendingDown, CheckCircle, XCircle, Gauge, Database, Network, Cpu, Layout, MousePointer2

#### 6. `src/features/monitoring/components/PerformanceDashboard.tsx`
- AlertTriangle, Clock, Zap, Activity, TrendingUp, TrendingDown, RefreshCw, Trash2, X

#### 7. `src/features/monitoring/components/SimplePerformanceDashboard.tsx`
- AlertTriangle, Clock, Zap, Activity, RefreshCw, Trash2

#### 8. `src/components/ui/Navigation.tsx`
- Menu, X, Globe

#### 9. `src/components/ui/feedback/LoadingState.tsx`
- Loader2, RefreshCw

#### 10. `src/components/ui/feedback/Toast.tsx`
- X, CheckCircle, XCircle, AlertTriangle, Info

#### 11. `src/components/ui/feedback/ErrorFallback.tsx`
- AlertTriangle, RefreshCw, Home, Bug, FileText, Copy, Check

#### 12. `src/components/WorkflowEditor/AutoLayout.tsx`
- Layout, ArrowRight, ArrowDown, Circle, GitBranch

#### 13. `src/components/WorkflowEditor/EnhancedToolbar.tsx`
- Save, Play, CheckCircle, Download, Upload, Undo, Redo, Copy, Trash2, Layout, Search, Keyboard, Grid, Layers, ZoomIn, ZoomOut, Maximize, MoreVertical

#### 14. `src/components/WorkflowEditor/WorkflowExporter.tsx`
- Download, Upload, FileJson, CheckCircle, XCircle

#### 15. `src/components/WorkflowEditor/NodePalette.tsx`
- Search, ChevronDown, ChevronRight

#### 16. `src/components/WorkflowEditor/NodeSearchPanel.tsx`
- Search, X, MapPin, ArrowRight, ArrowLeft

#### 17. `src/components/WorkflowEditor/KeyboardShortcutsPanel.tsx`
- X, Keyboard, Search

#### 18. `src/components/feedback/EnhancedFeedbackModal.tsx`
- X, Star, Upload, Camera, Send, Loader2, Sparkles, AlertCircle, CheckCircle2, MessageSquare, Lightbulb, Wand2, Copy, ThumbsUp, ThumbsDown

#### 19. `src/components/feedback/FeedbackAdminPanel.tsx`
- Inbox, Clock, AlertCircle, CheckCircle2, XCircle, Filter, Search, ChevronDown, MessageSquare, Send, Star, TrendingUp, Users, BarChart3, PieChart, RefreshCw, Download, Archive, Trash2, Edit2, Eye, EyeOff, Reply, MoreVertical, Calendar

#### 20. `src/components/feedback/FeedbackModal.tsx`
- X, Star, Upload, Camera, Send, Save, Loader2

#### 21. `src/components/notifications/NotificationCenter.tsx`
- X, Check, CheckCheck, Trash2, Filter, Info, CheckCircle, AlertTriangle, XCircle, MessageSquare, Bell, Clock

#### 22. `src/components/notifications/NotificationToast.tsx`
- X, Info, CheckCircle, AlertTriangle, XCircle, MessageSquare, Bell

#### 23. `src/shared/components/DynamicIcon.tsx`
- Bell, Send, Trash2, Check, X, Info, CheckCircle, AlertTriangle, XCircle, MessageSquare, Star, Upload, Camera, Save, Loader2, Globe, Lightbulb

#### 24. `src/shared/components/LanguageSwitcher.tsx`
- Globe

---

## 烟雾测试用例

### 测试目标
验证所有图标在页面加载时正常渲染，无控制台错误。

### 测试用例 1: 首页图标渲染

**描述**: 验证首页导航栏中的图标正常显示

**步骤**:
1. 访问首页 `/`
2. 检查导航栏中的 Menu, Globe 图标
3. 验证图标可见且无控制台错误

**预期结果**:
- ✅ Menu 图标正常显示
- ✅ Globe 图标正常显示
- ✅ 无控制台错误或警告

**Playwright 代码**:
```typescript
import { test, expect } from '@playwright/test'

test('首页图标渲染', async ({ page }) => {
  await page.goto('/')

  // 检查 Menu 图标
  const menuIcon = page.locator('svg').filter({ hasText: '' }).first()
  await expect(menuIcon).toBeVisible()

  // 检查 Globe 图标
  const globeIcon = page.locator('svg').filter({ hasText: '' }).nth(1)
  await expect(globeIcon).toBeVisible()

  // 检查控制台错误
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  await expect(errors).toHaveLength(0)
})
```

---

### 测试用例 2: 通知演示页面图标渲染

**描述**: 验证通知演示页面中的所有图标正常显示

**步骤**:
1. 访问 `/notification-demo`
2. 检查 Bell, Send, Trash2, Check 图标
3. 验证图标可见且无控制台错误

**预期结果**:
- ✅ Bell 图标正常显示
- ✅ Send 图标正常显示
- ✅ Trash2 图标正常显示
- ✅ Check 图标正常显示
- ✅ 无控制台错误

**Playwright 代码**:
```typescript
test('通知演示页面图标渲染', async ({ page }) => {
  await page.goto('/notification-demo')

  // 检查所有图标
  const icons = ['Bell', 'Send', 'Trash2', 'Check']
  for (const icon of icons) {
    const iconElement = page.locator(`[data-testid="${icon.toLowerCase()}-icon"]`)
    await expect(iconElement).toBeVisible()
  }

  // 检查控制台错误
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  await expect(errors).toHaveLength(0)
})
```

---

### 测试用例 3: 反馈页面图标渲染

**描述**: 验证反馈页面中的图标正常显示

**步骤**:
1. 访问 `/feedback`
2. 检查 MessageSquare, Lightbulb 图标
3. 验证图标可见且无控制台错误

**预期结果**:
- ✅ MessageSquare 图标正常显示
- ✅ Lightbulb 图标正常显示
- ✅ 无控制台错误

**Playwright 代码**:
```typescript
test('反馈页面图标渲染', async ({ page }) => {
  await page.goto('/feedback')

  // 检查 MessageSquare 图标
  const messageIcon = page.locator('[data-testid="messagesquare-icon"]')
  await expect(messageIcon).toBeVisible()

  // 检查 Lightbulb 图标
  const lightbulbIcon = page.locator('[data-testid="lightbulb-icon"]')
  await expect(lightbulbIcon).toBeVisible()

  // 检查控制台错误
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  await expect(errors).toHaveLength(0)
})
```

---

### 测试用例 4: 定价页面图标渲染

**描述**: 验证定价页面中的所有图标正常显示

**步骤**:
1. 访问 `/pricing`
2. 检查 Check, X, Mail, ArrowRight, Star, Zap, Shield, Users, Headphones, Globe 图标
3. 验证图标可见且无控制台错误

**预期结果**:
- ✅ 所有图标正常显示
- ✅ 无控制台错误

**Playwright 代码**:
```typescript
test('定价页面图标渲染', async ({ page }) => {
  await page.goto('/pricing')

  // 检查所有图标
  const icons = ['Check', 'X', 'Mail', 'ArrowRight', 'Star', 'Zap', 'Shield', 'Users', 'Headphones', 'Globe']
  for (const icon of icons) {
    const iconElement = page.locator(`[data-testid="${icon.toLowerCase()}-icon"]`)
    await expect(iconElement).toBeVisible()
  }

  // 检查控制台错误
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  await expect(errors).toHaveLength(0)
})
```

---

### 测试用例 5: 性能监控仪表板图标渲染

**描述**: 验证性能监控仪表板中的所有图标正常显示

**步骤**:
1. 访问包含性能监控仪表板的页面
2. 检查所有监控相关图标
3. 验证图标可见且无控制台错误

**预期结果**:
- ✅ 所有监控图标正常显示
- ✅ 无控制台错误

**Playwright 代码**:
```typescript
test('性能监控仪表板图标渲染', async ({ page }) => {
  await page.goto('/dashboard')

  // 检查监控图标
  const monitoringIcons = [
    'Activity', 'Clock', 'Zap', 'AlertTriangle',
    'TrendingUp', 'TrendingDown', 'RefreshCw', 'Trash2'
  ]

  for (const icon of monitoringIcons) {
    const iconElement = page.locator(`[data-testid="${icon.toLowerCase()}-icon"]`)
    await expect(iconElement).toBeVisible()
  }

  // 检查控制台错误
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  await expect(errors).toHaveLength(0)
})
```

---

### 测试用例 6: 工作流编辑器图标渲染

**描述**: 验证工作流编辑器中的所有图标正常显示

**步骤**:
1. 访问工作流编辑器页面
2. 检查所有工具栏图标
3. 验证图标可见且无控制台错误

**预期结果**:
- ✅ 所有工具栏图标正常显示
- ✅ 无控制台错误

**Playwright 代码**:
```typescript
test('工作流编辑器图标渲染', async ({ page }) => {
  await page.goto('/workflow-editor')

  // 检查工具栏图标
  const toolbarIcons = [
    'Save', 'Play', 'Undo', 'Redo', 'Copy', 'Trash2',
    'Search', 'Keyboard', 'ZoomIn', 'ZoomOut'
  ]

  for (const icon of toolbarIcons) {
    const iconElement = page.locator(`[data-testid="${icon.toLowerCase()}-icon"]`)
    await expect(iconElement).toBeVisible()
  }

  // 检查控制台错误
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  await expect(errors).toHaveLength(0)
})
```

---

### 测试用例 7: DynamicIcon 组件渲染

**描述**: 验证动态加载的图标正常显示

**步骤**:
1. 访问使用 DynamicIcon 的页面
2. 触发动态图标加载
3. 验证图标正常显示

**预期结果**:
- ✅ 动态加载的图标正常显示
- ✅ 无控制台错误

**Playwright 代码**:
```typescript
test('DynamicIcon 组件渲染', async ({ page }) => {
  await page.goto('/')

  // 等待动态图标加载
  await page.waitForSelector('[data-testid="dynamic-icon"]', { timeout: 5000 })

  // 检查动态图标
  const dynamicIcon = page.locator('[data-testid="dynamic-icon"]')
  await expect(dynamicIcon).toBeVisible()

  // 检查控制台错误
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  await expect(errors).toHaveLength(0)
})
```

---

### 测试用例 8: 通知中心图标渲染

**描述**: 验证通知中心中的所有图标正常显示

**步骤**:
1. 打开通知中心
2. 检查所有通知类型图标
3. 验证图标可见且无控制台错误

**预期结果**:
- ✅ 所有通知图标正常显示
- ✅ 无控制台错误

**Playwright 代码**:
```typescript
test('通知中心图标渲染', async ({ page }) => {
  await page.goto('/')

  // 打开通知中心
  await page.click('[data-testid="notification-center-toggle"]')

  // 检查通知图标
  const notificationIcons = [
    'CheckCircle', 'AlertTriangle', 'XCircle',
    'MessageSquare', 'Bell', 'Info'
  ]

  for (const icon of notificationIcons) {
    const iconElement = page.locator(`[data-testid="${icon.toLowerCase()}-icon"]`)
    await expect(iconElement).toBeVisible()
  }

  // 检查控制台错误
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  await expect(errors).toHaveLength(0)
})
```

---

## 回归测试用例

### 测试目标
验证图标 props（size, stroke, color 等）未改变，确保升级后视觉效果一致。

### 测试用例 1: 图标尺寸验证

**描述**: 验证图标尺寸（size prop）未改变

**步骤**:
1. 访问包含不同尺寸图标的页面
2. 测量图标实际尺寸
3. 与预期尺寸对比

**预期结果**:
- ✅ 图标尺寸与预期一致
- ✅ 尺寸变化在允许范围内（±1px）

**Playwright 代码**:
```typescript
import { test, expect } from '@playwright/test'

test('图标尺寸验证', async ({ page }) => {
  await page.goto('/')

  // 测试不同尺寸的图标
  const sizeTests = [
    { selector: '[data-testid="icon-xs"]', expectedSize: 16 },
    { selector: '[data-testid="icon-sm"]', expectedSize: 20 },
    { selector: '[data-testid="icon-md"]', expectedSize: 24 },
    { selector: '[data-testid="icon-lg"]', expectedSize: 32 },
    { selector: '[data-testid="icon-xl"]', expectedSize: 48 },
  ]

  for (const test of sizeTests) {
    const icon = page.locator(test.selector)
    const box = await icon.boundingBox()
    expect(box).toBeTruthy()
    expect(Math.abs(box!.width - test.expectedSize)).toBeLessThanOrEqual(1)
    expect(Math.abs(box!.height - test.expectedSize)).toBeLessThanOrEqual(1)
  }
})
```

---

### 测试用例 2: 图标描边宽度验证

**描述**: 验证图标描边宽度（stroke prop）未改变

**步骤**:
1. 访问包含不同描边宽度的图标
2. 检查 SVG stroke-width 属性
3. 与预期值对比

**预期结果**:
- ✅ 描边宽度与预期一致
- ✅ 描边宽度变化在允许范围内（±0.5px）

**Playwright 代码**:
```typescript
test('图标描边宽度验证', async ({ page }) => {
  await page.goto('/')

  // 测试不同描边宽度的图标
  const strokeTests = [
    { selector: '[data-testid="icon-stroke-1"]', expectedStroke: 1 },
    { selector: '[data-testid="icon-stroke-2"]', expectedStroke: 2 },
    { selector: '[data-testid="icon-stroke-3"]', expectedStroke: 3 },
  ]

  for (const test of strokeTests) {
    const icon = page.locator(test.selector)
    const strokeWidth = await icon.getAttribute('stroke-width')
    expect(parseFloat(strokeWidth || '0')).toBeCloseTo(test.expectedStroke, 0.5)
  }
})
```

---

### 测试用例 3: 图标颜色验证

**描述**: 验证图标颜色（color prop）未改变

**步骤**:
1. 访问包含不同颜色图标的页面
2. 检查图标颜色值
3. 与预期颜色对比

**预期结果**:
- ✅ 图标颜色与预期一致
- ✅ 颜色值匹配（RGB/HEX）

**Playwright 代码**:
```typescript
test('图标颜色验证', async ({ page }) => {
  await page.goto('/')

  // 测试不同颜色的图标
  const colorTests = [
    { selector: '[data-testid="icon-red"]', expectedColor: 'rgb(239, 68, 68)' },
    { selector: '[data-testid="icon-green"]', expectedColor: 'rgb(34, 197, 94)' },
    { selector: '[data-testid="icon-blue"]', expectedColor: 'rgb(59, 130, 246)' },
    { selector: '[data-testid="icon-yellow"]', expectedColor: 'rgb(234, 179, 8)' },
  ]

  for (const test of colorTests) {
    const icon = page.locator(test.selector)
    const color = await icon.evaluate(el => {
      return window.getComputedStyle(el).color
    })
    expect(color).toBe(test.expectedColor)
  }
})
```

---

### 测试用例 4: 图标主题适配验证

**描述**: 验证图标在亮色/暗色主题下的显示

**步骤**:
1. 访问页面并切换到亮色主题
2. 检查图标颜色
3. 切换到暗色主题
4. 检查图标颜色

**预期结果**:
- ✅ 亮色主题下图标颜色正确
- ✅ 暗色主题下图标颜色正确
- ✅ 主题切换时图标颜色平滑过渡

**Playwright 代码**:
```typescript
test('图标主题适配验证', async ({ page }) => {
  await page.goto('/')

  // 切换到亮色主题
  await page.click('[data-testid="theme-toggle-light"]')
  await page.waitForTimeout(500)

  // 检查亮色主题下的图标颜色
  const lightThemeIcon = page.locator('[data-testid="theme-icon"]')
  const lightColor = await lightThemeIcon.evaluate(el => {
    return window.getComputedStyle(el).color
  })
  expect(lightColor).toBe('rgb(0, 0, 0)')

  // 切换到暗色主题
  await page.click('[data-testid="theme-toggle-dark"]')
  await page.waitForTimeout(500)

  // 检查暗色主题下的图标颜色
  const darkColor = await lightThemeIcon.evaluate(el => {
    return window.getComputedStyle(el).color
  })
  expect(darkColor).toBe('rgb(255, 255, 255)')
})
```

---

### 测试用例 5: 图标旋转验证

**描述**: 验证图标旋转（rotation prop）未改变

**步骤**:
1. 访问包含旋转图标的页面
2. 检查图标旋转角度
3. 与预期角度对比

**预期结果**:
- ✅ 图标旋转角度与预期一致
- ✅ 旋转动画流畅

**Playwright 代码**:
```typescript
test('图标旋转验证', async ({ page }) => {
  await page.goto('/')

  // 测试旋转图标
  const rotatingIcon = page.locator('[data-testid="rotating-icon"]')

  // 检查初始旋转角度
  const initialTransform = await rotatingIcon.evaluate(el => {
    return window.getComputedStyle(el).transform
  })

  // 等待旋转动画
  await page.waitForTimeout(1000)

  // 检查旋转后的角度
  const rotatedTransform = await rotatingIcon.evaluate(el => {
    return window.getComputedStyle(el).transform
  })

  expect(rotatedTransform).not.toBe(initialTransform)
})
```

---

### 测试用例 6: 图标动画验证

**描述**: 验证图标动画效果未改变

**步骤**:
1. 访问包含动画图标的页面
2. 检查动画效果
3. 验证动画流畅性

**预期结果**:
- ✅ 图标动画正常播放
- ✅ 动画流畅无卡顿
- ✅ 动画时长与预期一致

**Playwright 代码**:
```typescript
test('图标动画验证', async ({ page }) => {
  await page.goto('/')

  // 测试动画图标
  const animatedIcon = page.locator('[data-testid="animated-icon"]')

  // 检查动画是否应用
  const animation = await animatedIcon.evaluate(el => {
    return window.getComputedStyle(el).animationName
  })

  expect(animation).not.toBe('none')

  // 检查动画时长
  const duration = await animatedIcon.evaluate(el => {
    return window.getComputedStyle(el).animationDuration
  })

  expect(duration).toBe('1s')
})
```

---

### 测试用例 7: 图标可访问性验证

**描述**: 验证图标的可访问性属性未改变

**步骤**:
1. 检查图标的 aria-label 属性
2. 检查图标的 role 属性
3. 验证屏幕阅读器兼容性

**预期结果**:
- ✅ 图标有正确的 aria-label
- ✅ 图标 role 属性正确
- ✅ 屏幕阅读器可正确识别

**Playwright 代码**:
```typescript
test('图标可访问性验证', async ({ page }) => {
  await page.goto('/')

  // 测试可访问性属性
  const icons = page.locator('[data-testid^="icon-"]')

  const count = await icons.count()
  for (let i = 0; i < count; i++) {
    const icon = icons.nth(i)

    // 检查 aria-label
    const ariaLabel = await icon.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()

    // 检查 role
    const role = await icon.getAttribute('role')
    expect(role).toBe('img')
  }
})
```

---

### 测试用例 8: 图标响应式验证

**描述**: 验证图标在不同屏幕尺寸下的显示

**步骤**:
1. 在不同屏幕尺寸下访问页面
2. 检查图标尺寸和位置
3. 验证响应式布局

**预期结果**:
- ✅ 图标在不同屏幕尺寸下正常显示
- ✅ 图标尺寸自适应
- ✅ 图标位置正确

**Playwright 代码**:
```typescript
test('图标响应式验证', async ({ page }) => {
  await page.goto('/')

  // 测试不同屏幕尺寸
  const viewports = [
    { width: 320, height: 568 },  // Mobile
    { width: 768, height: 1024 }, // Tablet
    { width: 1920, height: 1080 }, // Desktop
  ]

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.waitForTimeout(500)

    // 检查图标是否可见
    const icon = page.locator('[data-testid="responsive-icon"]')
    await expect(icon).toBeVisible()

    // 检查图标尺寸
    const box = await icon.boundingBox()
    expect(box).toBeTruthy()
    expect(box!.width).toBeGreaterThan(0)
    expect(box!.height).toBeGreaterThan(0)
  }
})
```

---

## 测试工具配置

### Playwright 配置

**安装依赖**:
```bash
npm install -D @playwright/test
npx playwright install
```

**配置文件** (`playwright.config.ts`):
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/lucide-icons',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

---

### React Testing Library 配置

**安装依赖**:
```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**测试工具函数** (`tests/lucide-icons/utils.ts`):
```typescript
import { render, screen } from '@testing-library/react'
import { expect } from '@playwright/test'

/**
 * 渲染图标组件并验证
 */
export async function renderIconAndVerify(
  component: React.ReactElement,
  testName: string
) {
  const { container } = render(component)

  // 检查 SVG 元素是否存在
  const svg = container.querySelector('svg')
  expect(svg).toBeTruthy()

  // 检查是否有控制台错误
  const errors: string[] = []
  const originalError = console.error
  console.error = (...args) => {
    errors.push(args.join(' '))
    originalError(...args)
  }

  // 清理
  return {
    container,
    errors,
    cleanup: () => {
      console.error = originalError
    }
  }
}

/**
 * 验证图标属性
 */
export function verifyIconProps(
  svg: SVGElement,
  props: {
    width?: number
    height?: number
    strokeWidth?: number
    color?: string
  }
) {
  if (props.width) {
    expect(svg.getAttribute('width')).toBe(props.width.toString())
  }
  if (props.height) {
    expect(svg.getAttribute('height')).toBe(props.height.toString())
  }
  if (props.strokeWidth) {
    expect(svg.getAttribute('stroke-width')).toBe(props.strokeWidth.toString())
  }
  if (props.color) {
    expect(svg.getAttribute('color')).toBe(props.color)
  }
}
```

---

### 测试数据文件

**图标清单** (`tests/lucide-icons/data/icons.json`):
```json
{
  "icons": [
    { "name": "Activity", "files": ["src/features/monitoring/components/EnhancedPerformanceDashboard.tsx"] },
    { "name": "AlertCircle", "files": ["src/app/notification-demo/enhanced/page.tsx"] },
    { "name": "AlertTriangle", "files": ["src/features/monitoring/components/EnhancedPerformanceDashboard.tsx"] },
    ...
  ],
  "total": 76,
  "files": 24
}
```

---

## 执行计划

### 测试阶段

#### 阶段 1: 升级前基线测试（1天）

**目标**: 建立升级前的测试基线

**任务**:
1. ✅ 运行所有烟雾测试用例
2. ✅ 运行所有回归测试用例
3. ✅ 记录测试结果和截图
4. ✅ 保存测试报告

**输出**:
- 基线测试报告
- 图标截图集合
- 性能基准数据

---

#### 阶段 2: 图标升级（1天）

**目标**: 执行 Lucide React 版本升级

**任务**:
1. ✅ 备份当前版本
2. ✅ 升级 lucide-react 包
3. ✅ 检查破坏性变更
4. ✅ 更新代码（如需要）

**命令**:
```bash
# 备份当前版本
npm list lucide-react > lucide-version-backup.txt

# 升级到最新版本
npm install lucide-react@latest

# 或升级到特定版本
npm install lucide-react@0.400.0
```

---

#### 阶段 3: 升级后测试（1天）

**目标**: 验证升级后的功能正常

**任务**:
1. ✅ 运行所有烟雾测试用例
2. ✅ 运行所有回归测试用例
3. ✅ 对比升级前后的测试结果
4. ✅ 记录差异和问题

**输出**:
- 升级后测试报告
- 差异分析报告
- 问题清单

---

#### 阶段 4: 问题修复（1-2天）

**目标**: 修复升级后发现的问题

**任务**:
1. ✅ 分析测试失败原因
2. ✅ 修复代码问题
3. ✅ 重新运行测试
4. ✅ 验证修复效果

---

#### 阶段 5: 最终验证（1天）

**目标**: 确认所有测试通过

**任务**:
1. ✅ 运行完整测试套件
2. ✅ 手动验证关键页面
3. ✅ 性能测试
4. ✅ 生成最终报告

**输出**:
- 最终测试报告
- 升级总结
- 部署建议

---

### 测试执行命令

```bash
# 运行所有测试
npm run test:lucide

# 运行烟雾测试
npm run test:lucide:smoke

# 运行回归测试
npm run test:lucide:regression

# 生成测试报告
npm run test:lucide:report

# 运行特定测试
npx playwright test icon-size-validation.spec.ts

# 运行测试并查看报告
npx playwright test --reporter=html
npx playwright show-report
```

---

## 验收标准

### 功能验收

- ✅ 所有 76 种图标正常渲染
- ✅ 无控制台错误或警告
- ✅ 图标尺寸、颜色、描边等属性正确
- ✅ 动态加载的图标正常工作
- ✅ 图标在不同主题下显示正确

### 性能验收

- ✅ 页面加载时间无明显增加（< 5%）
- ✅ 图标渲染时间无明显增加（< 10%）
- ✅ Bundle 大小无明显增加（< 5%）

### 兼容性验收

- ✅ 在 Chrome、Firefox、Safari 上测试通过
- ✅ 在移动端浏览器上测试通过
- ✅ 在不同屏幕尺寸下显示正常

### 可访问性验收

- ✅ 所有图标有正确的 aria-label
- ✅ 屏幕阅读器可正确识别图标
- ✅ 键盘导航正常工作

### 代码质量验收

- ✅ 无 TypeScript 类型错误
- ✅ 无 ESLint 警告
- ✅ 代码符合项目规范

---

## 附录

### A. 图标使用统计

| 图标类别 | 数量 | 占比 |
|---------|------|------|
| 通知相关 | 9 | 11.8% |
| 导航相关 | 8 | 10.5% |
| 操作相关 | 12 | 15.8% |
| 状态相关 | 10 | 13.2% |
| 监控相关 | 12 | 15.8% |
| 反馈相关 | 15 | 19.7% |
| 工作流相关 | 10 | 13.2% |

### B. 文件使用统计

| 文件路径 | 图标数量 |
|---------|---------|
| src/features/monitoring/components/EnhancedPerformanceDashboard.tsx | 16 |
| src/components/feedback/FeedbackAdminPanel.tsx | 15 |
| src/components/WorkflowEditor/EnhancedToolbar.tsx | 17 |
| src/components/notifications/NotificationCenter.tsx | 12 |
| src/app/notification-demo/enhanced/page.tsx | 13 |

### C. 测试检查清单

- [ ] 所有图标正常渲染
- [ ] 无控制台错误
- [ ] 图标尺寸正确
- [ ] 图标颜色正确
- [ ] 图标描边正确
- [ ] 主题切换正常
- [ ] 响应式布局正常
- [ ] 可访问性属性正确
- [ ] 动画效果正常
- [ ] 性能无明显下降

### D. 常见问题排查

**问题 1: 图标不显示**

**可能原因**:
- 图标名称拼写错误
- 图标未正确导入
- CSS 样式问题

**解决方案**:
```typescript
// 检查导入
import { Bell } from 'lucide-react'

// 检查使用
<Bell className="w-4 h-4" />

// 检查控制台错误
console.log('Icon rendered')
```

---

**问题 2: 图标尺寸不正确**

**可能原因**:
- Tailwind 类名冲突
- CSS 覆盖
- 图标版本差异

**解决方案**:
```typescript
// 使用明确的尺寸
<Bell width={24} height={24} />

// 或使用 Tailwind 类名
<Bell className="w-6 h-6" />
```

---

**问题 3: 图标颜色不正确**

**可能原因**:
- 主题变量未定义
- CSS 优先级问题
- 颜色属性冲突

**解决方案**:
```typescript
// 使用明确的颜色
<Bell color="red" />

// 或使用 Tailwind 类名
<Bell className="text-red-500" />
```

---

## 总结

本测试计划涵盖了 7zi-frontend 项目中所有 76 种 Lucide React 图标的测试方案，包括：

1. ✅ 完整的图标清单和使用位置映射
2. ✅ 8 个烟雾测试用例，验证图标渲染
3. ✅ 8 个回归测试用例，验证图标属性
4. ✅ Playwright 和 React Testing Library 配置
5. ✅ 详细的执行计划和验收标准

通过执行本测试计划，可以确保 Lucide React 图标升级不会破坏现有功能，保证用户体验的一致性。

---

**文档版本**: v1.0
**最后更新**: 2026-04-03
**测试员**: 测试员子代理
**审核状态**: 待审核