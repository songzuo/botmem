# 7zi-frontend 国际化 (i18n) 扩展实施计划

**项目**: 7zi-frontend
**任务**: 国际化扩展方案设计与规划
**完成日期**: 2026-03-22
**分析师**: 📚 咨询师

---

## 📊 执行摘要

### 当前状态
- **国际化实现**: ❌ 无（项目尚未实现任何 i18n 功能）
- **当前语言**: 英语（默认）
- **硬编码文本**: 大量英文硬编码字符串分散在组件中
- **注释语言**: 中文（开发者使用中文注释）

### 目标
1. ✅ 实现完整的国际化架构
2. ✅ 支持 5 种语言（英语、中文、日语、韩语、法语、德语）
3. ✅ 建立翻译工作流程
4. ✅ 保持代码可维护性

### 关键指标
- **需要翻译的文本**: 预计 300-500 个字符串
- **新增语言**: 5 种（日语、韩语、法语、德语 + 中文）
- **实施周期**: 2-3 周
- **包体积增加**: ~50-80 KB (gzip 后 ~15-25 KB)

---

## 🎯 任务 1: 当前状态分析

### 1.1 现有代码分析

#### 发现
- ❌ 无 i18n 库或框架（无 react-i18next、next-intl、next-i18next）
- ❌ 无语言切换功能
- ❌ 无语言检测逻辑
- ❌ 无翻译文件结构
- ⚠️ 部分中文注释混合在英文代码中

#### 代码示例分析

**示例 1: NotificationDemoPage** (`src/app/notification-demo/page.tsx`)
```typescript
// 硬编码文本
<h1>Notification System Demo</h1>
{isConnected ? 'Connected to notification server' : 'Disconnected...'}
<button>Info</button>
<button>Success</button>
<button>Warning</button>
<button>Error</button>
```

**示例 2: PerformanceDashboard** (`src/components/PerformanceDashboard.tsx`)
```typescript
// 硬编码文本
<h2>Statistics</h2>
<p>Total Notifications</p>
<p>Unread</p>
<p>Read</p>
```

**示例 3: NotificationToaster** (`src/components/notifications/NotificationToaster.tsx`)
```typescript
// 硬编码文本
<p>{notification.title}</p>
<p>{notification.message}</p>
```

### 1.2 项目结构

```
7zi-frontend/
├── src/
│   ├── app/
│   │   ├── notification-demo/
│   │   │   ├── page.tsx          ❌ 硬编码英文文本
│   │   │   └── enhanced/
│   │   │       └── page.tsx     ❌ 硬编码英文文本
│   │   └── monitoring-example/
│   │       └── page.tsx          ❌ 硬编码英文文本
│   ├── components/
│   │   ├── PerformanceDashboard.tsx      ❌ 硬编码英文文本
│   │   ├── notifications/
│   │   │   ├── NotificationProvider.tsx
│   │   │   ├── NotificationToaster.tsx  ❌ 硬编码英文文本
│   │   │   ├── NotificationCenter.tsx     ❌ 硬编码英文文本
│   │   │   └── NotificationToast.tsx     ❌ 硬编码英文文本
│   │   └── SimplePerformanceDashboard.tsx ❌ 硬编码英文文本
│   └── lib/
│       └── (无 i18n 相关代码)
├── docs/
│   └── MCP-IMPLEMENTATION.md              ✅ 中文文档
└── html/
    └── index.html                          ⚠️ <html lang="en">
```

### 1.3 影响范围统计

| 类型 | 文件数 | 估算字符串数 |
|------|--------|-------------|
| 页面组件 | 3 | ~100 |
| UI 组件 | 6 | ~200 |
| 通知组件 | 4 | ~150 |
| 其他 | - | ~50 |
| **总计** | **13+** | **~500** |

---

## 🔍 任务 2: 识别缺失的翻译 Key 和页面

### 2.1 需要翻译的页面

#### 高优先级页面
1. **Notification Demo** (`src/app/notification-demo/page.tsx`)
   - 页面标题
   - 按钮文本 (Info, Success, Warning, Error, Task Assigned)
   - 状态文本 (Connected/Disconnected)
   - 统计标签 (Total, Unread, Read)
   - 表单标签

2. **Enhanced Notification Demo** (`src/app/notification-demo/enhanced/page.tsx`)
   - 高级功能描述
   - 设置选项

3. **Monitoring Example** (`src/app/monitoring-example/page.tsx`)
   - 性能指标标签
   - 图表标题

#### 组件级别
1. **PerformanceDashboard**
   - 仪表板标题
   - 指标名称
   - 时间范围选择器
   - 刷新按钮

2. **NotificationCenter**
   - 通知中心标题
   - 空状态消息
   - 操作按钮

3. **NotificationToast**
   - 通知类型标签
   - 时间格式化

4. **NotificationProvider**
   - 连接状态消息
   - 错误消息

5. **SimplePerformanceDashboard**
   - 简化版仪表板

### 2.2 翻译 Key 结构设计

#### 推荐的命名空间结构

```typescript
// 结构设计
{
  common: {
    // 通用词汇
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    save: 'Save',
    delete: 'Delete',
  },

  layout: {
    // 布局相关
    header: {},
    sidebar: {},
    footer: {},
  },

  notifications: {
    // 通知系统
    title: 'Notification System',
    connected: 'Connected to notification server',
    disconnected: 'Disconnected from notification server',
    unreadCount: 'Unread',
    totalCount: 'Total Notifications',
    readCount: 'Read',
    markAllRead: 'Mark All as Read',
    clearAll: 'Clear All Notifications',

    types: {
      info: 'Info',
      success: 'Success',
      warning: 'Warning',
      error: 'Error',
      taskAssigned: 'Task Assigned',
    },

    empty: {
      title: 'No notifications yet',
      message: 'Send some test notifications above!',
    },

    toast: {
      new: 'New',
      secondsAgo: '{{count}} seconds ago',
      minutesAgo: '{{count}} minutes ago',
      hoursAgo: '{{count}} hours ago',
    },
  },

  performance: {
    // 性能监控
    title: 'Performance Dashboard',
    refresh: 'Refresh',
    lastRefresh: 'Last Refresh',

    metrics: {
      fps: 'FPS',
      memory: 'Memory Usage',
      network: 'Network Requests',
      renderTime: 'Render Time',
      componentCount: 'Component Count',
    },

    alarms: {
      title: 'Alarms',
      critical: 'Critical',
      warning: 'Warning',
    },
  },

  demo: {
    // Demo 页面
    title: 'Demo Page',
    description: 'Interactive demo for the notification system',
    sendTest: 'Send Test Notification',
    testInfo: 'Info',
    testSuccess: 'Success',
    testWarning: 'Warning',
    testError: 'Error',
  },

  errors: {
    // 错误消息
    networkError: 'Network error occurred',
    serverError: 'Server error occurred',
    unauthorized: 'Unauthorized access',
    notFound: 'Not found',
  },

  time: {
    // 时间格式化
    now: 'just now',
    seconds: '{{count}} seconds',
    minutes: '{{count}} minutes',
    hours: '{{count}} hours',
    days: '{{count}} days',
  },
}
```

### 2.3 动态内容处理

#### 需要特殊处理的内容
1. **日期时间**: 需要国际化格式化
   ```typescript
   // 使用 Intl.DateTimeFormat
   new Intl.DateTimeFormat(locale, {
     year: 'numeric',
     month: 'long',
     day: 'numeric',
     hour: '2-digit',
     minute: '2-digit',
   }).format(date)
   ```

2. **数字**: 需要本地化格式
   ```typescript
   // 使用 Intl.NumberFormat
   new Intl.NumberFormat(locale).format(count)
   ```

3. **相对时间**: "just now", "5 minutes ago"
   - 建议使用 `date-fns` 或 `dayjs` 的 `formatDistanceToNow`

4. **复数形式**: "1 notification" vs "5 notifications"
   - 使用 i18n 库的复数功能

---

## 🌍 任务 3: 建议新增支持的语言

### 3.1 目标语言列表

| 语言 | 代码 | 优先级 | 市场价值 | 翻译难度 |
|------|------|--------|----------|----------|
| **英语** | `en` | P0 (基础) | 全球基准 | - |
| **中文** | `zh` | P0 (母语) | 中国市场 | 低 |
| **日语** | `ja` | P1 | 日本市场 | 中 |
| **韩语** | `ko` | P1 | 韩国市场 | 中 |
| **法语** | `fr` | P2 | 欧洲市场 | 低 |
| **德语** | `de` | P2 | 欧洲市场 | 中 |

### 3.2 语言优先级说明

#### P0: 基础支持（必须）
- **英语 (en)**: 当前默认语言，作为翻译基准
- **中文 (zh)**: 团队母语，便于维护和验证

#### P1: 高优先级（亚洲市场）
- **日语 (ja)**: 日本是重要技术市场，对开发者工具需求高
- **韩语 (ko)**: 韩国也是重要市场，与中国地理接近

#### P2: 中优先级（欧洲市场）
- **法语 (fr)**: 覆盖法国、加拿大法语区、非洲法语区
- **德语 (de)**: 覆盖德国、奥地利、瑞士

### 3.3 语言特性说明

#### 日语 (ja)
- **书写系统**: 汉字、平假名、片假名混合
- **排版**: 从上到下，从右到左（传统），现代网页通常从左到右
- **字符数**: 相同内容通常比英文多 30-50%
- **格式化**: 使用和制汉字数字，特定单位

#### 韩语 (ko)
- **书写系统**: 谚文 (Hangul)
- **排版**: 从左到右
- **字符数**: 与英文相近或略少
- **格式化**: 需要适当的韩语单词分隔

#### 法语 (fr)
- **书写系统**: 拉丁字母
- **排版**: 从左到右
- **字符数**: 比英文多 15-25%
- **特殊要求**: 性别和单复数形式

#### 德语 (de)
- **书写系统**: 拉丁字母
- **排版**: 从左到右
- **字符数**: 比英文多 30-50%（复合词）
- **特殊要求**: 复合词可能需要断行处理

---

## 🛠️ 任务 4: 技术方案选择

### 4.1 i18n 框架对比

#### 选项 1: next-intl (推荐 ⭐)

**优点**:
- ✅ 专为 Next.js App Router 设计
- ✅ 支持 Server Components 和 Client Components
- ✅ 类型安全 (TypeScript)
- ✅ 内置翻译命名空间
- ✅ 自动语言检测
- ✅ SEO 友好 (自动生成 `<html lang="...">`)
- ✅ 支持服务端渲染 (SSR)
- ✅ 文档清晰，维护活跃

**缺点**:
- ⚠️ 相对较新，生态系统较小
- ⚠️ 需要配置 app 目录结构

**适用性**: ⭐⭐⭐⭐⭐ 完美适配

---

#### 选项 2: react-i18next

**优点**:
- ✅ 成熟稳定，社区庞大
- ✅ 功能完整（命名空间、插值、复数、格式化）
- ✅ 支持懒加载翻译文件
- ✅ 丰富的插件生态

**缺点**:
- ❌ 原生为 SPA 设计，在 Next.js App Router 中需要额外配置
- ❌ 服务端渲染支持需要 `i18next-http-backend`
- ❌ 配置相对复杂

**适用性**: ⭐⭐⭐ 需要额外工作

---

#### 选项 3: next-i18next

**优点**:
- ✅ 官方推荐的 Next.js 国际化方案（Pages Router）
- ✅ 服务端渲染支持良好

**缺点**:
- ❌ **不支持 App Router** ❌ (决定性因素)
- ❌ 维护不活跃
- ❌ 未来会被替代

**适用性**: ❌ 不适用（项目使用 App Router）

---

### 4.2 推荐方案: next-intl

#### 选择理由

1. **完美适配 Next.js App Router**
   - 专为 `[locale]` 动态路由设计
   - 支持 Server Components 和 Client Components

2. **开发体验优秀**
   - TypeScript 类型推断
   - 自动类型检查翻译 key
   - VS Code 插件支持

3. **性能优秀**
   - 自动代码分割
   - 仅加载当前语言的翻译
   - 支持服务端渲染

4. **SEO 友好**
   - 自动生成语言特定的 URL (`/en`, `/zh`, `/ja`)
   - 自动设置 `<html lang="...">`
   - 支持 `hreflang` 标签

5. **迁移成本合理**
   - 可以渐进式迁移
   - 不需要完全重写

---

### 4.3 技术架构设计

#### 目录结构

```
7zi-frontend/
├── messages/                          # 翻译文件目录
│   ├── en.json                        # 英语（基准）
│   ├── zh.json                        # 中文
│   ├── ja.json                        # 日语
│   ├── ko.json                        # 韩语
│   ├── fr.json                        # 法语
│   └── de.json                        # 德语
│
├── src/
│   ├── app/
│   │   ├── [locale]/                  # 动态语言路由
│   │   │   ├── layout.tsx             # 布局（语言检测）
│   │   │   ├── page.tsx               # 首页
│   │   │   ├── notification-demo/
│   │   │   │   └── page.tsx           # 通知 Demo
│   │   │   └── monitoring-example/
│   │   │       └── page.tsx           # 性能监控
│   │   └── globals.css
│   │
│   ├── lib/
│   │   ├── i18n/
│   │   │   ├── config.ts              # i18n 配置
│   │   │   ├── request.ts             # 请求配置
│   │   │   ├── navigation.ts          # 导航配置
│   │   │   └── types.ts               # 类型定义
│   │
│   └── components/
│       ├── LanguageSwitcher.tsx       # 语言切换器
│       └── ...
│
├── i18n.ts                            # next-intl 配置
├── middleware.ts                      # 中间件（语言检测）
└── next.config.js
```

#### 核心配置文件

**1. `i18n.ts`** (next-intl 配置)
```typescript
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['en', 'zh', 'ja', 'ko', 'fr', 'de'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) notFound();

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

**2. `middleware.ts`** (语言检测)
```typescript
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always', // URL 始终包含语言前缀 /en, /zh
});

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next|_vercel|.*\\..*).*)',
    // Optional: only run on root (/) URL
    // '/'
  ],
};
```

**3. `src/app/[locale]/layout.tsx`** (布局配置)
```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: Props) {
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

---

## 📋 任务 5: 翻译工作流程

### 5.1 翻译流程设计

#### 阶段 1: 提取和整理 (1-2 天)

1. **扫描所有硬编码文本**
   ```bash
   # 使用工具扫描
   npx next-intl extract 'src/**/*.{ts,tsx}' --output messages/en.json
   ```

2. **手动审查和整理**
   - 合并重复的 key
   - 建立命名空间结构
   - 添加注释说明上下文

3. **创建翻译模板**
   - 基于 `en.json` 创建其他语言的空文件
   - 添加翻译指南

#### 阶段 2: 基础翻译 (3-5 天)

1. **英语基准** (en.json)
   - 整理现有文本
   - 确保术语一致

2. **中文翻译** (zh.json)
   - 团队内部完成
   - 技术术语保持一致性

3. **P1 语言** (ja.json, ko.json)
   - 外部翻译服务或母语者
   - 技术术语审查

4. **P2 语言** (fr.json, de.json)
   - 可以延后或使用机器翻译 + 人工审核

#### 阶段 3: 代码集成 (5-7 天)

1. **安装和配置 next-intl**
   ```bash
   npm install next-intl
   ```

2. **重构组件**
   - 替换硬编码文本为 `useTranslations()`
   - 处理动态内容

3. **测试语言切换**
   - 手动测试每种语言
   - 检查文本显示是否正常

#### 阶段 4: 质量保证 (2-3 天)

1. **功能测试**
   - 语言切换功能
   - 语言持久化
   - 默认语言检测

2. **UI 测试**
   - 文本溢出处理
   - 布局适配（特别是日语、德语）
   - 字体渲染

3. **翻译质量**
   - 术语一致性检查
   - 上下文准确性验证

### 5.2 翻译工具选择

#### 选项 1: Crowdin (推荐 ⭐)

**优点**:
- ✅ 专业翻译管理平台
- ✅ 支持多种文件格式 (JSON, YAML, etc.)
- ✅ 翻译记忆库 (TM) 和术语库
- ✅ 翻译质量保证
- ✅ 团队协作功能
- ✅ 自动同步 Git 仓库

**缺点**:
- ❌ 付费（有免费版，但功能受限）
- ❌ 需要学习时间

**适用性**: ⭐⭐⭐⭐⭐ 专业团队长期使用

---

#### 选项 2: i18n-ally (VS Code 插件)

**优点**:
- ✅ 免费
- ✅ 集成到 VS Code
- ✅ 实时预览翻译
- ✅ 自动提取文本
- ✅ 翻译缺失提示

**缺点**:
- ❌ 功能相对简单
- ❌ 不支持团队协作

**适用性**: ⭐⭐⭐⭐ 小团队或个人项目

---

#### 选项 3: Lokalise

**优点**:
- ✅ 专业的翻译管理
- ✅ 设计优秀
- ✅ 支持多种框架
- ✅ 翻译质量保证

**缺点**:
- ❌ 付费
- ❌ 价格较高

**适用性**: ⭐⭐⭐ 预算充足的团队

---

### 5.3 推荐工作流程: i18n-ally + 人工翻译

#### 为什么选择这个组合?

1. **i18n-ally (开发阶段)**
   - 自动提取文本
   - IDE 集成，提高开发效率
   - 实时预览
   - 免费

2. **人工翻译 (翻译阶段)**
   - 使用 Google Sheets 或 Excel
   - 团队协作编辑
   - 外部翻译可以直接编辑
   - 简单直接

3. **导入到项目**
   - 将 Sheets 转换为 JSON
   - 放入 `messages/` 目录

#### 具体步骤

1. **安装 i18n-ally**
   ```bash
   code --install-extension lokalise.i18n-ally
   ```

2. **配置 `.vscode/settings.json`**
   ```json
   {
     "i18n-ally.localesPaths": ["messages"],
     "i18n-ally.keystyle": "nested",
     "i18n-ally.namespace": true,
     "i18n-ally.defaultNamespace": "common",
     "i18n-ally.extract.keygenStyle": "default",
     "i18n-ally.dirStructure": "file",
     "i18n-ally.enabledParsers": ["json"]
   }
   ```

3. **使用 i18n-ally 提取文本**
   - 在 VS Code 中右键点击文本
   - 选择 "i18n-ally: Extract to i18n"
   - 自动生成翻译 key

4. **导出到 Google Sheets**
   ```bash
   # 使用脚本导出
   node scripts/export-to-sheets.js
   ```

5. **团队翻译**
   - 分享 Google Sheets
   - 标记翻译状态（完成/待审核/未翻译）

6. **导入回 JSON**
   ```bash
   # 使用脚本导入
   node scripts/import-from-sheets.js
   ```

---

## 📝 任务 6: 实施计划

### 6.1 总体时间线 (3 周)

```
Week 1: 准备和配置
  Day 1-2:  安装 next-intl，配置基础架构
  Day 3-4:  提取和整理翻译文本
  Day 5:    创建翻译模板

Week 2: 翻译和集成
  Day 6-7:  完成中文翻译
  Day 8-9:  完成日语和韩语翻译
  Day 10:   完成法语和德语翻译（可选）

Week 3: 集成和测试
  Day 11-13: 重构组件，集成 i18n
  Day 14-15: 测试和修复
```

### 6.2 详细任务分解

#### 第 1 周: 准备阶段

**Day 1-2: 安装和配置**

- [ ] 安装 `next-intl`
  ```bash
  npm install next-intl
  ```

- [ ] 创建 `i18n.ts` 配置文件
- [ ] 创建 `middleware.ts` 中间件
- [ ] 重构目录结构，添加 `[locale]` 路由
- [ ] 创建 `messages/` 目录
- [ ] 创建 `src/lib/i18n/` 工具目录
- [ ] 配置 TypeScript 类型

**Day 3-4: 提取和整理文本**

- [ ] 安装 `i18n-ally` VS Code 插件
- [ ] 扫描所有组件，识别硬编码文本
- [ ] 设计翻译 key 命名空间结构
- [ ] 创建 `messages/en.json` 基础文件
- [ ] 整理和分类所有翻译 key

**Day 5: 创建翻译模板**

- [ ] 为每种语言创建空 JSON 文件
  - `messages/zh.json`
  - `messages/ja.json`
  - `messages/ko.json`
  - `messages/fr.json`
  - `messages/de.json`

- [ ] 创建翻译指南文档
- [ ] 导出翻译模板到 Google Sheets

---

#### 第 2 周: 翻译阶段

**Day 6-7: 中文翻译**

- [ ] 翻译 `common` 命名空间
- [ ] 翻译 `layout` 命名空间
- [ ] 翻译 `notifications` 命名空间
- [ ] 翻译 `performance` 命名空间
- [ ] 翻译 `demo` 命名空间
- [ ] 翻译 `errors` 命名空间
- [ ] 翻译 `time` 命名空间
- [ ] 内部审核和修正

**Day 8-9: 日语和韩语翻译**

- [ ] 日语翻译 (ja.json)
  - 可以使用外部翻译服务
  - 或母语者审核机器翻译

- [ ] 韩语翻译 (ko.json)
  - 同上

- [ ] 术语一致性检查

**Day 10: 法语和德语翻译 (可选)**

- [ ] 法语翻译 (fr.json)
- [ ] 德语翻译 (de.json)
- [ ] 格式化检查（复合词、性别等）

---

#### 第 3 周: 集成和测试

**Day 11: 组件重构 - Demo 页面**

- [ ] 重构 `src/app/[locale]/notification-demo/page.tsx`
- [ ] 重构 `src/app/[locale]/notification-demo/enhanced/page.tsx`
- [ ] 重构 `src/app/[locale]/monitoring-example/page.tsx`

**Day 12: 组件重构 - UI 组件**

- [ ] 重构 `PerformanceDashboard.tsx`
- [ ] 重构 `SimplePerformanceDashboard.tsx`
- [ ] 重构 `NotificationToaster.tsx`
- [ ] 重构 `NotificationCenter.tsx`
- [ ] 重构 `NotificationToast.tsx`

**Day 13: 语言切换器**

- [ ] 创建 `LanguageSwitcher.tsx` 组件
  - 下拉选择器
  - 标志图标
  - 当前语言高亮

- [ ] 集成到布局
- [ ] 实现语言持久化 (localStorage)

**Day 14: 测试**

- [ ] 功能测试
  - 语言切换
  - 默认语言检测
  - URL 正确性

- [ ] UI 测试
  - 文本显示
  - 布局适配
  - 字体渲染

- [ ] 翻译质量测试
  - 每种语言的完整测试
  - 术语一致性
  - 上下文准确性

**Day 15: 修复和文档**

- [ ] 修复发现的 bug
- [ ] 优化性能
- [ ] 更新文档
  - i18n 使用指南
  - 添加新语言步骤
  - 翻译更新流程

---

## 🎨 任务 7: UI 设计和体验

### 7.1 语言切换器设计

#### 位置

**选项 1: 顶部导航栏** (推荐)
```
┌─────────────────────────────────────────┐
│  Logo    Home  About     🌐 EN ▼       │
└─────────────────────────────────────────┘
```

**选项 2: 页脚**
```
┌─────────────────────────────────────────┐
│  © 2026 7zi-frontend                   │
│  🌐 English | 中文 | 日本語 | ...     │
└─────────────────────────────────────────┘
```

#### 语言切换器组件

```typescript
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { languages } from '@/lib/i18n/config';

export function LanguageSwitcher() {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (newLocale: string) => {
    // 替换当前路径中的语言部分
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPathname);
  };

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
        <span className="text-2xl">{languages[locale].flag}</span>
        <span>{languages[locale].name}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
        {Object.entries(languages).map(([code, info]) => (
          <button
            key={code}
            onClick={() => switchLanguage(code)}
            className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
              code === locale ? 'bg-gray-50 dark:bg-gray-900' : ''
            }`}
          >
            <span className="text-xl">{info.flag}</span>
            <span>{info.name}</span>
            {code === locale && (
              <span className="ml-auto text-blue-500">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

#### 语言配置

```typescript
// src/lib/i18n/config.ts
export const languages = {
  en: {
    name: 'English',
    flag: '🇺🇸',
    nativeName: 'English',
  },
  zh: {
    name: '中文',
    flag: '🇨🇳',
    nativeName: '简体中文',
  },
  ja: {
    name: '日本語',
    flag: '🇯🇵',
    nativeName: '日本語',
  },
  ko: {
    name: '한국어',
    flag: '🇰🇷',
    nativeName: '한국어',
  },
  fr: {
    name: 'Français',
    flag: '🇫🇷',
    nativeName: 'Français',
  },
  de: {
    name: 'Deutsch',
    flag: '🇩🇪',
    nativeName: 'Deutsch',
  },
};
```

### 7.2 文本溢出处理

#### 问题
- 日语文本比英文多 30-50%
- 德语复合词可能很长
- 固定宽度容器可能溢出

#### 解决方案

**1. 使用响应式字体大小**
```css
.text-responsive {
  font-size: clamp(0.875rem, 0.825rem + 0.25vi, 1rem);
}
```

**2. 文本截断**
```css
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

**3. 多行截断**
```css
.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

### 7.3 字体选择

#### 推荐字体

**通用**
```css
/* 使用系统字体栈，根据语言自动选择 */
body {
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    'Noto Sans',
    'Helvetica Neue',
    Arial,
    sans-serif;
}
```

**日语**
```css
[lang="ja"] {
  font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic Pro', 'Meiryo', sans-serif;
}
```

**韩语**
```css
[lang="ko"] {
  font-family: 'Noto Sans KR', 'Malgun Gothic', 'Dotum', sans-serif;
}
```

**中文**
```css
[lang="zh"] {
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
```

---

## 🧪 任务 8: 测试策略

### 8.1 功能测试

#### 测试清单

- [ ] **语言切换**
  - [ ] 点击语言切换器，语言立即切换
  - [ ] URL 正确更新 (`/en` → `/zh`)
  - [ ] 页面重新加载时保持选择的语言

- [ ] **默认语言检测**
  - [ ] 首次访问检测浏览器语言
  - [ ] 不支持的语言时回退到英语

- [ ] **路由导航**
  - [ ] 语言切换后，当前路径保持不变
  - [ ] 导航链接包含当前语言

- [ ] **持久化**
  - [ ] 刷新页面后语言设置保持
  - [ ] 关闭浏览器后重新打开，语言设置保持

### 8.2 UI 测试

#### 测试清单

- [ ] **文本显示**
  - [ ] 所有翻译 key 都有对应文本
  - [ ] 没有未翻译的 key 显示为原始 key 名称

- [ ] **布局适配**
  - [ ] 日语文本（较长）不破坏布局
  - [ ] 德语复合词正确显示
  - [ ] 按钮宽度自适应文本长度

- [ ] **字体渲染**
  - [ ] 每种语言的字体正确加载
  - [ ] 特殊字符显示正常（日语假名、韩语谚文）

- [ ] **响应式**
  - [ ] 移动端显示正常
  - [ ] 桌面端显示正常

### 8.3 翻译质量测试

#### 测试清单

- [ ] **准确性**
  - [ ] 所有翻译准确传达原意
  - [ ] 技术术语翻译一致
  - [ ] 上下文正确

- [ ] **一致性**
  - [ ] 同一概念使用相同翻译
  - [ ] 命名规范一致
  - [ ] 标点符号使用一致

- [ ] **自然度**
  - [ ] 翻译读起来自然流畅
  - [ ] 符合目标语言习惯
  - [ ] 没有机器翻译痕迹

#### 测试方法

1. **母语者审核**
   - 每种语言至少由 1 名母语者审核
   - 重点关注术语和上下文

2. **回译验证**
   - 将翻译回译到原语言
   - 检查是否保持原意

3. **A/B 测试** (可选)
   - 对关键用户界面进行 A/B 测试
   - 收集用户反馈

---

## 📦 任务 9: 依赖和包体积

### 9.1 新增依赖

#### 核心依赖

```json
{
  "dependencies": {
    "next-intl": "^3.0.0"
  }
}
```

#### 开发依赖

```json
{
  "devDependencies": {
    "@types/node": "^20.0.0"
  }
}
```

### 9.2 包体积影响

#### 估算

| 项目 | 体积 |
|------|------|
| next-intl (minified) | ~50 KB |
| 翻译文件 (6 种语言) | ~30 KB |
| **总计 (未压缩)** | **~80 KB** |
| **总计 (gzip 后)** | **~15-25 KB** |

#### 影响

- ✅ 对于现代网络，15-25 KB 的 gzip 后体积可以接受
- ✅ 仅加载当前语言的翻译文件，实际更小
- ✅ 可以按需加载，不影响首屏性能

### 9.3 性能优化建议

#### 1. 按需加载翻译文件

next-intl 自动处理按需加载，无需额外配置。

#### 2. 服务器端渲染

- ✅ 使用 SSR 减少客户端 JavaScript
- ✅ 翻译在服务器端渲染
- ✅ 首屏加载更快

#### 3. 缓存策略

```typescript
// middleware.ts
export const config = {
  matcher: [
    '/((?!_next|_vercel|.*\\..*).*)',
  ],
};
```

---

## 🔒 任务 10: SEO 考虑

### 10.1 语言特定 URL

#### URL 结构

```
/en/notification-demo
/zh/notification-demo
/ja/notification-demo
/ko/notification-demo
/fr/notification-demo
/de/notification-demo
```

#### 优点
- ✅ 清晰的语言分离
- ✅ 易于分享和书签
- ✅ 搜索引擎友好

### 10.2 hreflang 标签

#### 配置

```typescript
// src/app/[locale]/layout.tsx
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: Props) {
  const t = await getTranslations({ locale });

  return {
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'en': '/en',
        'zh': '/zh',
        'ja': '/ja',
        'ko': '/ko',
        'fr': '/fr',
        'de': '/de',
      },
    },
  };
}
```

#### 生成的 HTML

```html
<head>
  <link rel="canonical" href="https://example.com/en/notification-demo" />
  <link rel="alternate" hreflang="en" href="https://example.com/en/notification-demo" />
  <link rel="alternate" hreflang="zh" href="https://example.com/zh/notification-demo" />
  <link rel="alternate" hreflang="ja" href="https://example.com/ja/notification-demo" />
  <link rel="alternate" hreflang="ko" href="https://example.com/ko/notification-demo" />
  <link rel="alternate" hreflang="fr" href="https://example.com/fr/notification-demo" />
  <link rel="alternate" hreflang="de" href="https://example.com/de/notification-demo" />
</head>
```

### 10.3 meta 标签国际化

#### 配置

```typescript
// src/app/[locale]/layout.tsx
export async function generateMetadata({ params: { locale } }: Props) {
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords'),
    openGraph: {
      title: t('og.title'),
      description: t('og.description'),
    },
  };
}
```

#### 翻译文件

```json
// messages/en.json
{
  "metadata": {
    "title": "7zi-frontend - Notification System Demo",
    "description": "Interactive demo for the notification system",
    "keywords": "notification, demo, next.js",
    "og": {
      "title": "7zi-frontend",
      "description": "Notification System Demo"
    }
  }
}
```

---

## 📚 任务 11: 文档和维护

### 11.1 开发者文档

#### 必需文档

1. **i18n 快速开始** (`docs/i18n/QUICKSTART.md`)
   - 如何在组件中使用翻译
   - 如何添加新的翻译 key
   - 如何切换语言

2. **翻译指南** (`docs/i18n/TRANSLATION_GUIDE.md`)
   - 命名规范
   - 上下文说明
   - 翻译质量标准

3. **添加新语言** (`docs/i18n/ADD_LANGUAGE.md`)
   - 创建新的翻译文件
   - 更新配置
   - 测试步骤

#### 示例文档

**i18n 快速开始**

```markdown
# i18n 快速开始

## 在组件中使用翻译

### Server Components

```typescript
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('notifications');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('connected')}</p>
    </div>
  );
}
```

### Client Components

```typescript
'use client';

import { useTranslations } from 'next-intl';

export function NotificationButton() {
  const t = useTranslations('notifications');

  return (
    <button>{t('types.info')}</button>
  );
}
```

## 添加新的翻译 key

1. 在 `messages/en.json` 中添加新的 key
2. 在其他语言文件中添加对应的翻译
3. 在组件中使用该 key

## 切换语言

使用 `LanguageSwitcher` 组件：

```typescript
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function Layout({ children }) {
  return (
    <div>
      <LanguageSwitcher />
      {children}
    </div>
  );
}
```
```

### 11.2 翻译维护

#### 持续更新流程

1. **添加新功能时**
   - 在 `messages/en.json` 中添加新的翻译 key
   - 使用 i18n-ally 提取工具

2. **更新翻译**
   - 通知翻译团队
   - 更新 Google Sheets
   - 导入新的翻译文件

3. **定期审核**
   - 每季度审核一次翻译质量
   - 检查过时或不当的翻译
   - 收集用户反馈

#### 翻译质量控制

1. **术语表**
   - 维护技术术语翻译表
   - 确保一致性

2. **翻译记忆库**
   - 使用 Crowdin 或 Lokalise 的 TM
   - 重用已翻译的内容

3. **版本控制**
   - 所有翻译文件纳入 Git 版本控制
   - 可以回滚到之前版本

---

## 🎯 任务 12: 风险评估和缓解

### 12.1 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| next-intl 兼容性问题 | 低 | 中 | 充分测试，保留回滚方案 |
| 性能下降 | 低 | 中 | 使用 SSR，按需加载 |
| 文本溢出 | 中 | 低 | 响应式字体，CSS 处理 |
| 类型错误 | 中 | 中 | 使用 TypeScript 严格模式 |

### 12.2 翻译风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 翻译质量差 | 中 | 高 | 母语者审核，回译验证 |
| 术语不一致 | 高 | 中 | 维护术语表，翻译指南 |
| 翻译延迟 | 中 | 中 | 优先翻译 P0/P1 语言 |
| 缺失翻译 | 低 | 中 | 自动化检查，CI 验证 |

### 12.3 时间风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 开发时间超期 | 中 | 中 | 分阶段实施，优先 P0/P1 |
| 翻译时间超期 | 中 | 低 | 使用外部翻译服务 |
| 测试不充分 | 中 | 高 | 充分测试，留出缓冲时间 |

### 12.4 缓解策略

#### 1. 渐进式实施

```
阶段 1: 英语 + 中文 (Week 1)
阶段 2: 日语 + 韩语 (Week 2)
阶段 3: 法语 + 德语 (Week 3)
```

#### 2. 回滚计划

- 保留旧版代码分支
- 使用 feature flag 控制功能开关
- 可以快速切换回无 i18n 版本

#### 3. 质量保证

- 每个阶段完成后进行代码审查
- 自动化测试覆盖核心功能
- 手动测试所有语言

---

## ✅ 任务 13: 总结和建议

### 13.1 关键结论

1. **项目状态**: 目前没有国际化实现，需要从零开始

2. **技术选择**: `next-intl` 是最佳选择
   - 完美适配 Next.js App Router
   - 类型安全
   - SEO 友好

3. **语言优先级**:
   - P0: 英语 + 中文
   - P1: 日语 + 韩语
   - P2: 法语 + 德语

4. **实施周期**: 2-3 周
   - Week 1: 准备和配置
   - Week 2: 翻译和集成
   - Week 3: 测试和修复

5. **成本**: 低
   - 开发成本: 1 名开发者，2-3 周
   - 翻译成本: 外部翻译服务或母语者
   - 运维成本: 最低（按需加载）

### 13.2 建议

#### 立即行动

1. **开始实施** (优先级: 高)
   - 安装 next-intl
   - 配置基础架构
   - 创建翻译模板

2. **团队培训** (优先级: 高)
   - 组织 i18n 培训
   - 学习 next-intl 使用方法

3. **确定翻译资源** (优先级: 高)
   - 找到母语翻译者
   - 或选择翻译服务

#### 中期目标

1. **完成 P0 语言** (Week 1)
   - 英语和中文完全翻译
   - 核心功能可用

2. **完成 P1 语言** (Week 2)
   - 日语和韩语翻译
   - 扩大市场覆盖

#### 长期目标

1. **完成 P2 语言** (Week 3)
   - 法语和德语翻译
   - 全面国际化

2. **持续优化**
   - 根据用户反馈改进翻译
   - 定期审核翻译质量

### 13.3 注意事项

1. **保持简单**
   - 不要过度设计
   - 优先完成核心功能

2. **质量优先**
   - 翻译质量比数量更重要
   - 宁可少支持一种语言，也要保证质量

3. **用户反馈**
   - 收集用户对翻译的反馈
   - 及时修正问题

4. **文档完善**
   - 良好的文档降低维护成本
   - 便于新成员加入

### 13.4 参考资源

#### 官方文档

- [next-intl 文档](https://next-intl-docs.vercel.app/)
- [Next.js 国际化](https://nextjs.org/docs/app/building-your-application/routing/internationalization)

#### 工具

- [i18n-ally VS Code 插件](https://github.com/lokalise/i18n-ally)
- [Crowdin](https://crowdin.com/)
- [Lokalise](https://lokalise.com/)

#### 最佳实践

- [W3C 国际化最佳实践](https://www.w3.org/International/)
- [MDN Web 文档 - 国际化](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)

---

## 📞 后续支持

### 如需帮助，请联系：

- **📚 咨询师** - 方案设计和规划
- **🏗️ 架构师** - 技术架构评审
- **🎨 设计师** - UI/UX 设计建议
- **⚡ Executor** - 实施和开发

---

**文档版本**: 1.0
**最后更新**: 2026-03-22
**状态**: ✅ 规划完成，等待批准实施

---

## 📎 附录

### A. 检查清单

#### 准备阶段
- [ ] 阅读 next-intl 文档
- [ ] 团队培训
- [ ] 确定翻译资源
- [ ] 创建翻译模板

#### 实施阶段
- [ ] 安装 next-intl
- [ ] 配置 i18n.ts
- [ ] 配置 middleware.ts
- [ ] 创建 messages/ 目录
- [ ] 创建翻译文件
- [ ] 重构组件
- [ ] 创建 LanguageSwitcher
- [ ] 测试功能

#### 测试阶段
- [ ] 功能测试
- [ ] UI 测试
- [ ] 翻译质量测试
- [ ] 性能测试
- [ ] SEO 测试

#### 部署阶段
- [ ] 预发布测试
- [ ] 灰度发布
- [ ] 监控用户反馈
- [ ] 全量发布

### B. FAQ

**Q: 为什么选择 next-intl 而不是 react-i18next?**

A: next-intl 专为 Next.js App Router 设计，支持 Server Components，类型安全更好，配置更简单。react-i18next 更适合传统的 SPA 应用。

**Q: 如何处理动态内容翻译？**

A: 使用插值语法: `t('welcome', { name: userName })`。对于复杂对象，可以传递完整的对象到翻译函数。

**Q: 如何添加新语言？**

A: 1. 在 `i18n.ts` 中添加新的 locale
2. 创建 `messages/{locale}.json` 文件
3. 翻译所有 key
4. 更新 `LanguageSwitcher` 组件

**Q: 翻译文件太大怎么办？**

A: 可以按命名空间拆分文件，next-intl 支持懒加载。例如：`messages/en/common.json`, `messages/en/notifications.json`。

**Q: 如何处理 RTL（从右到左）语言？**

A: 目前计划中的语言都是 LTR（从左到右）。如果将来需要支持阿拉伯语等 RTL 语言，需要添加额外的 CSS 和配置。

### C. 示例代码

完整的示例代码已包含在各个章节中。关键文件包括：

1. `i18n.ts` - next-intl 配置
2. `middleware.ts` - 语言检测中间件
3. `src/app/[locale]/layout.tsx` - 布局配置
4. `src/components/LanguageSwitcher.tsx` - 语言切换器
5. `messages/en.json` - 英语翻译文件（示例）

---

**文档结束**
