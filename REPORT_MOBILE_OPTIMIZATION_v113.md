# 7zi-frontend 移动端深度优化方案 v1.13.0

> **版本**: v1.13.0 Roadmap P0  
> **目标**: 移动端 FCP <0.8s | 交互响应 <100ms | 离线可用率 >90%  
> **当前基线**: FCP ~1.5s | 交互响应 ~150ms | 离线可用率 ~60%

---

## 📊 一、性能基线分析

### 1.1 项目技术栈

| 类别 | 技术 | 备注 |
|------|------|------|
| 框架 | Next.js 16.2.2 | 最新稳定版 |
| React | 19.2.4 | 最新版本 |
| 状态管理 | Zustand 4.5.0 | 轻量级 |
| 3D渲染 | Three.js 0.183.2 | 重型库 |
| 图表 | Recharts 3.8.1 | 中型库 |
| 实时通信 | Socket.io 4.7.0 | 客户端 |
| 富文本 | TipTap 2.10.3 | 中型库 |
| PWA | next-pwa 5.6.0 | 已集成 |

### 1.2 当前 Bundle 分析

**初始加载包大小（估算）**:
- React Core: ~120KB
- Next.js Core: ~100KB  
- Three.js Core: ~600KB (未分割)
- Recharts: ~150KB
- Socket.io: ~50KB
- Lucide Icons: ~80KB
- 其他 Vendor: ~200KB

**总计**: ~1.3MB (未压缩) → ~400KB (gzip)

### 1.3 移动端性能问题识别

| 问题 | 原因 | 影响 |
|------|------|------|
| FCP 慢 | Three.js 等重型库同步加载 | +300-500ms |
| 交互延迟 | 主线程被 3D 渲染阻塞 | +50-100ms |
| 离线可用率低 | NetworkFirst 策略不适合移动端 | 离线失败 |
| 流量消耗大 | 缺少移动端资源差异化 | 浪费流量 |

---

## 🎯 二、优化策略

### 2.1 代码分割策略（Code Splitting）

#### 路由级别分割
```typescript
// next.config.ts - 添加移动端专用分割配置
experimental: {
  optimizePackageImports: [
    // 现有配置 + 移动端优化
    '@react-three/fiber',  // 3D 库
    '@react-three/drei',  // 3D 工具
  ],
}

// 新增移动端代码分割策略
webpack: (config) => {
  // 移动端优先的分割策略
  config.optimization.splitChunks = {
    ...config.optimization.splitChunks,
    cacheGroups: {
      // 移动端专用：动态 import 3D 库
      'three-mobile': {
        test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
        name: 'three-mobile',
        priority: 90, // 最高优先级
        chunks: 'async', // 仅异步加载
        minSize: 0,
        enforce: true,
      },
      // 移动端图表延迟加载
      'charts-mobile': {
        test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
        name: 'charts-mobile',
        priority: 80,
        chunks: 'async',
        minSize: 0,
      },
    }
  }
}
```

#### 组件级别懒加载
```typescript
// 使用动态导入实现组件级懒加载
import dynamic from 'next/dynamic'

// 3D 组件 - 仅在桌面端加载
const KnowledgeLattice3D = dynamic(
  () => import('@/components/knowledge-lattice/KnowledgeLattice3D'),
  { 
    ssr: false,
    loading: () => <Skeleton3D />,
    // 移动端完全跳过
    loading: ({ error }) => 
      error ? <Fallback3D /> : <Skeleton3D />
  }
)

// 移动端降级组件
const KnowledgeLatticeSimple = dynamic(
  () => import('@/components/knowledge-lattice/KnowledgeLatticeSimple'),
  { ssr: true }
)

// 图表组件
const DashboardCharts = dynamic(
  () => import('@/components/analytics/charts'),
  { ssr: false, loading: () => <ChartSkeleton /> }
)
```

### 2.2 图片优化策略

#### Next.js Image 配置增强
```typescript
images: {
  // 现有配置保持
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  
  // 新增：移动端优化
  minimumCacheTTL: 60 * 60 * 24 * 30,
  
  // 新增：响应式图片断点
  responsiveSizes: {
    mobile: [640, 750, 828],
    tablet: [1080, 1200],
    desktop: [1920, 2048, 3840]
  },
  
  // 新增：移动端低质量占位符
  placeholder: 'blur',
  quality: 75, // 移动端默认质量
  mobileQuality: 60, // 移动端降低质量
}
```

#### 响应式图片组件
```typescript
// components/ui/ResponsiveImage.tsx
interface ResponsiveImageProps {
  src: string
  alt: string
  sizes?: string
}

export function ResponsiveImage({ src, alt, sizes }: ResponsiveImageProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  return (
    <Image
      src={src}
      alt={alt}
      sizes={sizes || '(max-width: 768px) 100vw, 50vw'}
      quality={isMobile ? 60 : 75}
      placeholder="blur"
      blurDataURL={generateBlurPlaceholder(src)}
      priority={!isMobile} // 移动端不优先加载
    />
  )
}
```

### 2.3 缓存策略优化

#### Service Worker 策略优化
```typescript
// next.config.ts - PWA 配置优化
const pwaConfig = {
  // ... 现有配置
  
  runtimeCaching: [
    // 移动端优化：静态资源 StaleWhileRevalidate
    {
      urlPattern: /\.(?:js|css|html)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
        // 移动端关键：网络超时快速失败
        networkTimeoutSeconds: 3, // 移动端 3 秒超时
      },
    },
    
    // 移动端优化：图片 CacheFirst
    {
      urlPattern: /\.(?:png|jpg|jpeg|webp|avif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 500, // 移动端减少
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
        // 移动端：允许过期缓存
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    
    // 移动端优化：API 请求
    {
      urlPattern: /\/api\/.*/,
      handler: 'CacheFirst', // 改为 CacheFirst 适合移动端
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50, // 移动端减少
          maxAgeSeconds: 60 * 60, // 1 小时
        },
        networkTimeoutSeconds: 5,
      },
    },
    
    // 关键：首页缓存
    {
      urlPattern: /^\/$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'homepage',
        expiration: {
          maxEntries: 5,
          maxAgeSeconds: 60 * 60,
        },
      },
    },
  ],
}
```

### 2.4 移动端交互优化

#### 事件处理优化
```typescript
// 移动端触摸事件优化
export function useMobileOptimizedEvents() {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    // 检测移动设备
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    }
    checkMobile()
    
    // 触摸事件优化
    if (isMobile) {
      // 禁用 hover 延迟
      document.body.classList.add('touch-device')
      
      // 优化滚动
      document.body.style.scrollBehavior = 'smooth'
    }
  }, [isMobile])
  
  return isMobile
}

// 按钮点击优化
export function useOptimizedClick(onClick: () => void) {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    setIsMobile('ontouchstart' in window)
  }, [])
  
  const handleClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // 移动端使用 onTouchStart 代替 onClick
    if (isMobile && 'touchstart' in e) {
      e.preventDefault()
      onClick()
    }
  }, [isMobile, onClick])
  
  return { handleClick, isMobile }
}
```

#### 骨架屏优化
```typescript
// components/ui/SkeletonLoader.tsx - 移动端优化版
export function SkeletonLoader({ type = 'default' }: { type?: 'default' | '3d' | 'chart' }) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  // 移动端简化骨架屏
  if (isMobile) {
    return (
      <div className="skeleton-mobile">
        <div className="skeleton-line" style={{ width: '60%' }} />
        <div className="skeleton-line" style={{ width: '80%' }} />
        <div className="skeleton-line" style={{ width: '40%' }} />
      </div>
    )
  }
  
  // 桌面端完整骨架屏
  return <FullSkeleton />
}
```

### 2.5 离线能力实现方案

#### IndexedDB 缓存策略
```typescript
// lib/offline/offline-db.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface OfflineDB extends DBSchema {
  pages: {
    key: string
    value: {
      url: string
      html: string
      timestamp: number
      offline: boolean
    }
  }
  api: {
    key: string
    value: {
      url: string
      response: any
      timestamp: number
    }
  }
}

class OfflineCacheManager {
  private db: IDBPDatabase<OfflineDB> | null = null
  
  async init() {
    this.db = await openDB<OfflineDB>('7zi-offline', 1, {
      upgrade(db) {
        db.createObjectStore('pages', { keyPath: 'url' })
        db.createObjectStore('api', { keyPath: 'url' })
      }
    })
  }
  
  // 缓存页面
  async cachePage(url: string, html: string) {
    if (!this.db) await this.init()
    await this.db?.put('pages', {
      url,
      html,
      timestamp: Date.now(),
      offline: true
    })
  }
  
  // 缓存 API 响应
  async cacheApi(url: string, response: any) {
    if (!this.db) await this.init()
    await this.db?.put('api', {
      url,
      response,
      timestamp: Date.now()
    })
  }
  
  // 获取缓存
  async getCachedPage(url: string) {
    return this.db?.get('pages', url)
  }
  
  async getCachedApi(url: string) {
    return this.db?.get('api', url)
  }
}

export const offlineCache = new OfflineCacheManager()
```

#### 离线页面策略
```typescript
// components/offline/OfflineBoundary.tsx
'use client'

import { Component, ReactNode } from 'react'
import { offlineCache } from '@/lib/offline/offline-db'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  isOffline: boolean
  cachedContent: any
}

export class OfflineBoundary extends Component<Props, State> {
  state: State = { isOffline: false, cachedContent: null }
  
  async componentDidMount() {
    // 检测网络状态
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
    
    if (!navigator.onLine) {
      this.handleOffline()
    }
  }
  
  handleOffline = async () => {
    // 尝试加载缓存内容
    const cachedPage = await offlineCache.getCachedPage(window.location.pathname)
    
    this.setState({
      isOffline: true,
      cachedContent: cachedPage?.html
    })
  }
  
  handleOnline = () => {
    this.setState({ isOffline: false, cachedContent: null })
  }
  
  render() {
    if (this.state.isOffline) {
      if (this.state.cachedContent) {
        return <div dangerouslySetInnerHTML={{ 
          __html: this.state.cachedContent 
        }} />
      }
      
      return this.props.fallback || <OfflineFallback />
    }
    
    return this.props.children
  }
}
```

---

## 📋 三、分阶段实施计划

### Phase 1: 基础优化（Week 1-2）

| 任务 | 描述 | 预期收益 |
|------|------|----------|
| 3D 组件懒加载 | KnowledgeLattice3D 改为动态导入 | FCP -200ms |
| 图表组件懒加载 | Dashboard 图表延迟加载 | FCP -100ms |
| 图片占位符优化 | 添加 blur placeholder | 感知速度 + |
| Service Worker 优化 | 调整缓存策略 | 离线 +20% |

**具体任务**:
1. [ ] 修改 `src/app/[locale]/knowledge-lattice/page.tsx` - 动态导入 3D 组件
2. [ ] 修改 `src/components/analytics/` - 图表懒加载
3. [ ] 修改 `next.config.ts` - 优化 PWA 缓存策略
4. [ ] 添加移动端图片响应式配置

### Phase 2: 离线能力（Week 3-4）

| 任务 | 描述 | 预期收益 |
|------|------|----------|
| IndexedDB 集成 | 页面内容缓存 | 离线 +15% |
| API 响应缓存 | 关键 API 离线可用 | 功能完整率 + |
| 离线页面展示 | 优雅的离线 UI | 用户体验 + |

**具体任务**:
1. [ ] 创建 `lib/offline/offline-db.ts`
2. [ ] 创建 `components/offline/OfflineBoundary.tsx`
3. [ ] 修改 Layout 添加 OfflineProvider
4. [ ] 实现 API 响应缓存逻辑

### Phase 3: 深度优化（Week 5-6）

| 任务 | 描述 | 预期收益 |
|------|------|----------|
| 触摸事件优化 | 移除 300ms 延迟 | 交互 -30ms |
| 骨架屏优化 | 移动端简化渲染 | FCP -50ms |
| 资源差异化 | 移动端资源优化 | 流量 -40% |
| 性能监控 | 移动端指标追踪 | 可观测性 + |

**具体任务**:
1. [ ] 创建 `hooks/useMobileOptimizedEvents.ts`
2. [ ] 修改骨架屏组件，添加移动端简化版本
3. [ ] 添加 `responsiveSizes` 配置
4. [ ] 集成 web-vitals 移动端监控

---

## 📈 四、预期效果量化指标

### 4.1 性能指标

| 指标 | 当前基线 | Phase 1 | Phase 2 | Phase 3 | 目标 |
|------|----------|---------|---------|---------|------|
| **FCP (移动端)** | ~1.5s | <1.2s | <1.0s | <0.8s | <0.8s |
| **TTI (移动端)** | ~3.0s | <2.5s | <2.0s | <1.8s | <2.0s |
| **交互响应** | ~150ms | <120ms | <110ms | <100ms | <100ms |
| **离线可用率** | 60% | 70% | 85% | 90%+ | >90% |
| **流量消耗** | 100% | 80% | 70% | 60% | <60% |

### 4.2 Bundle 大小预估

| 包 | 当前 | 优化后 | 变化 |
|-----|------|--------|------|
| 初始 JS | 400KB | 250KB | -37.5% |
| 3D 库 | 600KB | 0KB* | -100% |
| 图表 | 150KB | 0KB* | -100% |
| 总计 (gzip) | 400KB | 280KB | -30% |

*通过动态导入延迟加载

### 4.3 关键优化点

| 优化项 | 技术方案 | FCP 收益 | 离线收益 |
|--------|----------|----------|----------|
| 3D 懒加载 | dynamic import | -200ms | - |
| 图表懒加载 | dynamic import | -100ms | - |
| Service Worker | CacheFirst | - | +15% |
| IndexedDB | 页面缓存 | - | +15% |
| 图片优化 | AVIF + 响应式 | -50ms | - |
| 触摸优化 | 移除延迟 | -30ms | - |

---

## 🔧 五、实施清单

### 5.1 代码修改清单

```
7zi-frontend/
├── next.config.ts                    # PWA + 缓存策略优化
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── knowledge-lattice/
│   │   │   │   └── page.tsx         # 3D 组件懒加载
│   │   │   └── dashboard/
│   │   │       └── page.tsx         # 图表懒加载
│   │   └── layout.tsx               # 添加 OfflineProvider
│   ├── components/
│   │   ├── knowledge-lattice/
│   │   │   ├── KnowledgeLattice3D.tsx
│   │   │   └── KnowledgeLatticeSimple.tsx  # 移动端降级
│   │   ├── analytics/
│   │   │   └── charts/              # 图表懒加载
│   │   ├── offline/                # 新建
│   │   │   ├── OfflineBoundary.tsx
│   │   │   └── OfflineFallback.tsx
│   │   └── ui/
│   │       └── ResponsiveImage.tsx  # 新建
│   ├── hooks/
│   │   ├── useMobileOptimizedEvents.ts  # 新建
│   │   └── useOfflineStatus.ts     # 新建
│   └── lib/
│       └── offline/
│           └── offline-db.ts        # 新建
```

### 5.2 配置修改

```typescript
// next.config.ts 新增配置
{
  // 移动端优化
  mobile: {
    // 移动端断点
    breakpoints: {
      mobile: 768,
      tablet: 1024,
      desktop: 1440
    },
    // 移动端资源优化
    resourceOptimization: {
      reduceJsQuality: true,
      imageQuality: 60,
      disable3dOnMobile: true
    }
  }
}
```

---

## ✅ 六、验收标准

### 功能验收

- [ ] 移动端 FCP < 0.8s (Lighthouse)
- [ ] 移动端交互响应 < 100ms
- [ ] 离线可用率 > 90% (航班、地铁等场景)
- [ ] 3D 组件在移动端优雅降级
- [ ] 图表在移动端延迟加载

### 性能验收

- [ ] 移动端 Bundle < 300KB (gzip)
- [ ] 首屏图片 < 500KB
- [ ] Service Worker 缓存命中率 > 70%
- [ ] Lighthouse 移动端性能 > 90

### 兼容性验收

- [ ] iOS Safari 12+
- [ ] Android Chrome 80+
- [ ] 华为浏览器
- [ ] 微信内置浏览器

---

## 📝 七、附录

### 7.1 相关依赖

```json
{
  "dependencies": {
    "idb": "^8.0.3",
    "web-vitals": "^5.2.0"
  }
}
```

### 7.2 参考资料

- [Next.js 性能优化最佳实践](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Workbox](https://developer.chrome.com/docs/workbox)
- [PWA 最佳实践](https://web.dev/explore/pwa)

---

**文档版本**: v1.0  
**创建日期**: 2026-04-04  
**作者**: Consultant (📚)
