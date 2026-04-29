# 7zi-Frontend SEO 优化完整方案

**项目**: 7zi-frontend  
**日期**: 2026-03-28  
**分析师**: 📚 咨询师  
**Next.js 版本**: 16.2.1  

---

## 一、项目 SEO 现状分析

### 1.1 页面结构概览

| 路由 | 页面类型 | SSR 支持 | Metadata |
|------|----------|----------|----------|
| `/` | 首页 | ✅ | ⚠️ 基础 |
| `/image-optimization-demo` | 功能演示 | ❌ CSR | ❌ 无 |
| `/notification-demo` | 功能演示 | ✅ | ❌ 无 |
| `/notification-demo/enhanced` | 功能演示 | ✅ | ❌ 无 |
| `/dark-mode-demo` | 功能演示 | ✅ | ❌ 无 |
| `/design-system` | 文档页面 | ✅ | ✅ 有 |
| `/feedback` | 功能页面 | ✅ | ❌ 无 |
| `/admin/feedback` | 管理后台 | ✅ | ❌ 无 |
| `/i18n-demo` | 演示页面 | ✅ | ❌ 无 |
| `/websocket-status-demo` | 功能演示 | ✅ | ❌ 无 |
| `/monitoring-example` | 功能演示 | ✅ | ❌ 无 |
| `/[locale]/knowledge-lattice` | 3D 可视化 | ❌ CSR | ❌ 无 |

### 1.2 SEO 基础文件检查

| 文件 | 状态 | 影响 |
|------|------|------|
| `robots.txt` | ❌ 缺失 | **高** - 搜索引擎无法了解爬取规则 |
| `sitemap.xml` | ❌ 缺失 | **高** - 搜索引擎发现页面效率低 |
| `manifest.json` | ❌ 缺失 | **中** - PWA 支持、搜索引擎收录 |
| `favicon.ico` | ⚠️ 未确认 | **中** - 品牌识别 |
| `opengraph-image.jpg` | ❌ 缺失 | **高** - 社交分享无预览图 |
| `twitter-image.jpg` | ❌ 缺失 | **高** - Twitter 分享无预览图 |

### 1.3 Metadata 配置分析

**根布局 (layout.tsx)**:
```typescript
// ✅ 已配置项
- title
- description
- keywords (已过时，但无害)
- openGraph (部分)
- twitter (部分)

// ❌ 缺失项
- viewport
- themeColor
- alternates (多语言)
- canonical
- robots
- verification (Google Search Console 等)
- category
- authors
- creator
- publisher
```

### 1.4 技术 SEO 评估

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 响应式设计 | ✅ | 使用 Tailwind CSS |
| 图片优化 | ✅ | WebP/AVIF, 懒加载 |
| 性能优化 | ✅ | 代码分割, 动态导入 |
| 语义化 HTML | ⚠️ | 需要增强 |
| 结构化数据 | ❌ | 缺少 JSON-LD |
| 多语言 SEO | ⚠️ | 有 i18n 但缺少 hreflang |
| CSR 页面 SEO | ❌ | 3D 页面无法被爬取 |
| 404 页面 | ✅ | 已配置 |
| HTTPS | ⚠️ | 需确认部署配置 |
| 核心网页指标 | ✅ | 已有性能监控 |

---

## 二、发现的问题

### 🔴 高优先级问题

1. **缺少 robots.txt** - 搜索引擎无法了解网站爬取规则
2. **缺少 sitemap.xml** - 搜索引擎发现页面效率低，无法了解站点结构
3. **大部分页面缺少独立 metadata** - 搜索结果展示效果差
4. **OG/Twitter 图片不存在** - 社交分享无预览图，严重影响品牌形象
5. **缺少结构化数据** - 无法获得富媒体搜索结果

### 🟡 中优先级问题

6. **国际化 SEO 配置缺失** - 没有配置 hreflang 标签
7. **首页内容稀少** - 只是一个导航页面，SEO 价值低
8. **CSR 页面无法被爬取** - knowledge-lattice 页面完全依赖客户端渲染
9. **缺少 canonical URLs** - 可能导致重复内容问题
10. **缺少 PWA manifest** - 影响移动端体验和搜索排名

### 🟢 低优先级问题

11. **keywords meta 标签已过时** - 但保留无害
12. **缺少面包屑导航** - 影响用户体验和搜索结果展示
13. **缺少网站图标配置** - 品牌识别度低
14. **缺少文章/内容发布时间** - 无法获得时效性搜索优势
15. **缺少作者信息** - E-E-A-T 因素缺失

---

## 三、优化方案（按优先级）

### Phase 1: SEO 基础建设（第1周）

#### 3.1 创建 robots.txt

**文件路径**: `public/robots.txt` 或 `app/robots.ts`

**方案 A: 静态文件**
```txt
# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Sitemap
Sitemap: https://7zi.com/sitemap.xml

# 禁止爬取 API 路由
Disallow: /api/

# 禁止爬取管理后台
Disallow: /admin/

# 允许主要页面
Allow: /image-optimization-demo
Allow: /notification-demo
Allow: /design-system
Allow: /feedback
Allow: /i18n-demo

# 禁止爬取演示页面（可选）
# Disallow: /dark-mode-demo
# Disallow: /monitoring-example
# Disallow: /websocket-status-demo
```

**方案 B: 动态生成（推荐）**
```typescript
// app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://7zi.com'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
```

#### 3.2 创建 sitemap.xml

**文件路径**: `app/sitemap.ts`

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://7zi.com'
  
  // 主要页面
  const mainPages = [
    '',
    '/image-optimization-demo',
    '/notification-demo',
    '/design-system',
    '/feedback',
    '/i18n-demo',
  ]
  
  // 多语言页面（如有）
  const locales = ['zh-CN', 'en']
  const localePages = ['/knowledge-lattice']
  
  const routes: MetadataRoute.Sitemap = [
    // 主要页面
    ...mainPages.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: route === '' ? 1 : 0.8,
    })),
    // 多语言页面
    ...locales.flatMap((locale) =>
      localePages.map((route) => ({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        alternates: {
          languages: {
            'zh-CN': `${baseUrl}/zh-CN${route}`,
            en: `${baseUrl}/en${route}`,
          },
        },
      }))
    ),
  ]
  
  return routes
}
```

#### 3.3 为每个页面添加 metadata

**创建共享 metadata 配置文件**

```typescript
// lib/seo/metadata.ts
import { Metadata } from 'next'

export interface PageMetadata {
  title: string
  description: string
  keywords?: string[]
  image?: string
  noIndex?: boolean
  alternates?: {
    canonical?: string
    languages?: Record<string, string>
  }
}

export const siteConfig = {
  name: '7zi Frontend',
  description: 'Next.js 最佳实践演示项目 - 图片优化、国际化、主题系统',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://7zi.com',
  ogImage: '/images/og-default.jpg',
  twitterHandle: '@7zi_dev',
}

export function generatePageMetadata(page: PageMetadata): Metadata {
  const { title, description, keywords, image, noIndex, alternates } = page
  const ogImage = image ? `${siteConfig.url}${image}` : `${siteConfig.url}${siteConfig.ogImage}`
  
  return {
    title: `${title} | ${siteConfig.name}`,
    description,
    keywords,
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [ogImage],
      type: 'website',
      siteName: siteConfig.name,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [ogImage],
      creator: siteConfig.twitterHandle,
    },
    alternates: {
      canonical: alternates?.canonical,
      languages: alternates?.languages,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }
}

// 各页面 metadata 配置
export const pageMetadataConfig: Record<string, PageMetadata> = {
  home: {
    title: '首页',
    description: '7zi Frontend - Next.js 最佳实践演示项目，包含图片优化、国际化、主题系统、WebSocket 等功能演示',
    keywords: ['Next.js', 'React', '图片优化', 'WebP', 'AVIF', 'TypeScript'],
  },
  imageOptimization: {
    title: '图片优化示例',
    description: 'Next.js Image 组件最佳实践 - WebP/AVIF 自动转换、懒加载、响应式图片、LCP 性能优化',
    keywords: ['Next.js Image', 'WebP', 'AVIF', '图片优化', '懒加载', '响应式图片'],
    image: '/images/og-image-optimization.jpg',
  },
  notificationDemo: {
    title: '通知系统示例',
    description: 'React 通知系统演示 - 支持多种类型、动画效果、可自定义位置和样式',
    keywords: ['React', 'Notification', 'Toast', '通知组件'],
  },
  designSystem: {
    title: '设计系统文档',
    description: '7zi Frontend 设计系统文档，包含组件库、设计 Token、颜色系统、排版规范',
    keywords: ['设计系统', 'Design System', '组件库', 'Design Token'],
  },
  feedback: {
    title: '用户反馈',
    description: '提交您的反馈和建议，帮助我们改进产品体验',
    keywords: ['反馈', '建议', '用户反馈'],
    noIndex: false,
  },
  knowledgeLattice: {
    title: '知识图谱 3D 可视化',
    description: '交互式 3D 知识图谱可视化，展示知识节点之间的连接关系',
    keywords: ['知识图谱', '3D 可视化', 'Three.js', 'Knowledge Graph'],
    image: '/images/og-knowledge-lattice.jpg',
  },
  i18nDemo: {
    title: '国际化示例',
    description: 'Next.js 国际化最佳实践演示 - 多语言切换、路由配置、翻译管理',
    keywords: ['i18n', '国际化', '多语言', 'Next.js i18n'],
  },
}
```

**页面使用示例**

```typescript
// app/image-optimization-demo/page.tsx
import { Metadata } from 'next'
import { generatePageMetadata, pageMetadataConfig } from '@/lib/seo/metadata'

export const metadata: Metadata = generatePageMetadata(
  pageMetadataConfig.imageOptimization
)

export default function ImageOptimizationPage() {
  // ...
}
```

### Phase 2: 结构化数据与 OG 图片（第2周）

#### 3.4 添加结构化数据 (JSON-LD)

**创建结构化数据组件**

```typescript
// components/seo/JsonLd.tsx
'use client'

interface OrganizationJsonLdProps {
  name: string
  url: string
  logo?: string
  description?: string
}

export function OrganizationJsonLd({ name, url, logo, description }: OrganizationJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo: logo ? `${url}${logo}` : undefined,
    description,
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

interface WebSiteJsonLdProps {
  name: string
  url: string
  description?: string
  potentialAction?: {
    target: string | string[]
    queryInput?: string
  }
}

export function WebSiteJsonLd({ name, url, description, potentialAction }: WebSiteJsonLdProps) {
  const data: any = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description,
  }
  
  if (potentialAction) {
    data.potentialAction = {
      '@type': 'SearchAction',
      target: potentialAction.target,
      'query-input': potentialAction.queryInput || 'required name=search_term_string',
    }
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

interface BreadcrumbJsonLdProps {
  items: Array<{
    name: string
    url: string
  }>
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

interface SoftwareApplicationJsonLdProps {
  name: string
  description: string
  url: string
  applicationCategory?: string
  operatingSystem?: string
  offers?: {
    price: string
    priceCurrency: string
  }
}

export function SoftwareApplicationJsonLd({
  name,
  description,
  url,
  applicationCategory = 'DeveloperApplication',
  operatingSystem = 'Any',
  offers = { price: '0', priceCurrency: 'USD' },
}: SoftwareApplicationJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    url,
    applicationCategory,
    operatingSystem,
    offers: {
      '@type': 'Offer',
      price: offers.price,
      priceCurrency: offers.priceCurrency,
    },
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

**在布局中使用**

```typescript
// app/layout.tsx
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/seo/JsonLd'
import { siteConfig } from '@/lib/seo/metadata'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 结构化数据 */}
        <OrganizationJsonLd
          name={siteConfig.name}
          url={siteConfig.url}
          logo="/images/logo.png"
          description={siteConfig.description}
        />
        <WebSiteJsonLd
          name={siteConfig.name}
          url={siteConfig.url}
          description={siteConfig.description}
          potentialAction={{
            target: `${siteConfig.url}/search?q={search_term_string}`,
            queryInput: 'required name=search_term_string',
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

#### 3.5 生成 OG 图片

**使用 Next.js 内置 OG 图片生成**

```typescript
// app/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '7zi Frontend'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 'bold' }}>7zi Frontend</div>
        <div style={{ fontSize: 32, marginTop: 20, opacity: 0.9 }}>
          Next.js 最佳实践演示
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
```

**页面级 OG 图片**

```typescript
// app/image-optimization-demo/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 48, fontWeight: 'bold' }}>🖼️ 图片优化</div>
        <div style={{ fontSize: 24, marginTop: 20 }}>
          WebP/AVIF · 懒加载 · 响应式
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
```

### Phase 3: 多语言与国际化 SEO（第3周）

#### 3.6 配置多语言 SEO

**更新布局支持多语言**

```typescript
// app/[locale]/layout.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

const locales = ['zh-CN', 'en'] as const
type Locale = (typeof locales)[number]

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  const { locale } = params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://7zi.com'
  
  const translations = {
    'zh-CN': {
      title: '7zi Frontend - Next.js 最佳实践',
      description: 'Next.js 最佳实践演示项目，包含图片优化、国际化、主题系统等',
    },
    en: {
      title: '7zi Frontend - Next.js Best Practices',
      description: 'Next.js best practices demo with image optimization, i18n, and theme system',
    },
  }
  
  const t = translations[locale]
  
  return {
    title: t.title,
    description: t.description,
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        'zh-CN': `${baseUrl}/zh-CN`,
        en: `${baseUrl}/en`,
        'x-default': `${baseUrl}/zh-CN`,
      },
    },
  }
}

export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: Locale }
}) {
  if (!locales.includes(locale)) {
    notFound()
  }
  
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
```

#### 3.7 创建语言切换组件

```typescript
// components/seo/LanguageSwitcher.tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'

const languages = {
  'zh-CN': { name: '中文', flag: '🇨🇳' },
  en: { name: 'English', flag: '🇺🇸' },
}

export function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const pathname = usePathname()
  const router = useRouter()
  
  const switchLanguage = (newLocale: string) => {
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
  }
  
  return (
    <div className="flex gap-2">
      {Object.entries(languages).map(([code, { name, flag }]) => (
        <button
          key={code}
          onClick={() => switchLanguage(code)}
          className={`px-3 py-1 rounded ${
            currentLocale === code
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          aria-label={`Switch to ${name}`}
          aria-current={currentLocale === code ? 'true' : undefined}
        >
          {flag} {name}
        </button>
      ))}
    </div>
  )
}
```

### Phase 4: 技术优化（第4周）

#### 3.8 优化根布局 metadata

```typescript
// app/layout.tsx (更新版)
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/shared/context/ThemeContext'
import { siteConfig } from '@/lib/seo/metadata'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: 'light dark',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - Next.js 最佳实践演示`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ['Next.js', 'React', 'TypeScript', '图片优化', '国际化', '主题系统'],
  authors: [{ name: '7zi Team', url: siteConfig.url }],
  creator: '7zi Team',
  publisher: '7zi Team',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} - Next.js 最佳实践演示`,
    description: siteConfig.description,
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} - Next.js 最佳实践演示`,
    description: siteConfig.description,
    images: ['/images/og-default.jpg'],
    creator: siteConfig.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
  alternates: {
    canonical: siteConfig.url,
    languages: {
      'zh-CN': `${siteConfig.url}/zh-CN`,
      en: `${siteConfig.url}/en`,
      'x-default': siteConfig.url,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#667eea',
      },
    ],
  },
  category: 'technology',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 预连接到图片 CDN */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        
        {/* DNS 预解析 */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
```

#### 3.9 创建 manifest.json

```typescript
// app/manifest.ts
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://7zi.com'
  
  return {
    name: '7zi Frontend',
    short_name: '7zi',
    description: 'Next.js 最佳实践演示项目',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#667eea',
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    categories: ['developer', 'productivity'],
    screenshots: [
      {
        src: '/screenshots/home.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Homepage',
      },
    ],
  }
}
```

#### 3.10 添加面包屑导航

```typescript
// components/seo/Breadcrumbs.tsx
import Link from 'next/link'
import { BreadcrumbJsonLd } from './JsonLd'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://7zi.com'
  
  const jsonLdItems = items.map((item) => ({
    name: item.label,
    url: item.href ? `${baseUrl}${item.href}` : baseUrl,
  }))
  
  return (
    <>
      <BreadcrumbJsonLd items={jsonLdItems} />
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          {items.map((item, index) => (
            <li key={item.label} className="flex items-center">
              {index > 0 && <span className="mx-2">/</span>}
              {item.href && index < items.length - 1 ? (
                <Link href={item.href} className="hover:text-primary-600">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={index === items.length - 1 ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}
```

---

## 四、实施清单

### 第一周：基础建设

- [ ] 创建 `app/robots.ts`
- [ ] 创建 `app/sitemap.ts`
- [ ] 创建 `lib/seo/metadata.ts`
- [ ] 为每个页面添加独立 metadata
- [ ] 测试 robots.txt 和 sitemap.xml

### 第二周：结构化数据

- [ ] 创建 `components/seo/JsonLd.tsx`
- [ ] 创建 `app/opengraph-image.tsx`
- [ ] 为关键页面创建 OG 图片
- [ ] 在布局中添加结构化数据
- [ ] 使用 Google Rich Results Test 验证

### 第三周：多语言 SEO

- [ ] 创建 `app/[locale]/layout.tsx`
- [ ] 配置 hreflang 标签
- [ ] 创建语言切换组件
- [ ] 更新 sitemap 支持多语言
- [ ] 测试多语言路由

### 第四周：技术优化

- [ ] 更新根布局 metadata
- [ ] 创建 `app/manifest.ts`
- [ ] 添加面包屑导航
- [ ] 创建 favicon 和图标
- [ ] 配置 Google Search Console
- [ ] 提交 sitemap 到搜索引擎

---

## 五、验收标准

### 技术验收

1. **robots.txt** - 访问 `/robots.txt` 返回正确内容
2. **sitemap.xml** - 访问 `/sitemap.xml` 返回所有页面
3. **metadata** - 每个页面有独立的 title 和 description
4. **结构化数据** - Google Rich Results Test 通过
5. **OG 图片** - 社交分享显示预览图

### 性能验收

1. **Core Web Vitals** - LCP < 2.5s, FID < 100ms, CLS < 0.1
2. **Lighthouse SEO Score** - > 90 分
3. **图片优化** - 所有图片使用 WebP/AVIF
4. **移动端友好** - Google Mobile-Friendly Test 通过

### SEO 验收

1. **Google Search Console** - 无错误，所有页面已索引
2. **Bing Webmaster** - 无错误，sitemap 已提交
3. **社交分享** - Facebook/Twitter/LinkedIn 分享预览正常
4. **富媒体结果** - 搜索结果显示结构化数据

---

## 六、监控与维护

### 定期检查

- **每周**: 检查 Google Search Console 错误
- **每月**: 审查 Core Web Vitals 报告
- **每季度**: 更新 sitemap 和检查死链

### 工具推荐

1. **Google Search Console** - 索引状态和搜索性能
2. **Google Analytics 4** - 流量分析
3. **Lighthouse** - 性能和 SEO 审计
4. **Screaming Frog** - 网站爬取分析
5. **Ahrefs/SEMrush** - 竞争对手分析

---

## 七、附录：关键文件路径

```
7zi-frontend/
├── app/
│   ├── layout.tsx          # 根布局（更新 metadata）
│   ├── robots.ts           # robots.txt 生成
│   ├── sitemap.ts          # sitemap.xml 生成
│   ├── manifest.ts         # PWA manifest
│   ├── opengraph-image.tsx # OG 图片生成
│   ├── [locale]/
│   │   ├── layout.tsx      # 多语言布局
│   │   └── knowledge-lattice/
│   │       └── page.tsx
│   ├── image-optimization-demo/
│   │   ├── page.tsx
│   │   └── opengraph-image.tsx
│   └── ...其他页面
├── components/
│   └── seo/
│       ├── JsonLd.tsx          # 结构化数据组件
│       ├── Breadcrumbs.tsx     # 面包屑导航
│       └── LanguageSwitcher.tsx # 语言切换
├── lib/
│   └── seo/
│       └── metadata.ts         # metadata 配置
└── public/
    ├── images/
    │   ├── og-default.jpg      # 默认 OG 图片
    │   └── icons/              # 图标文件
    └── favicon.ico
```

---

**报告生成时间**: 2026-03-28 22:44 CET  
**分析师**: 📚 咨询师子代理  
**状态**: 待实施
