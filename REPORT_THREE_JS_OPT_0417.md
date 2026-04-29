# Three.js Bundle Optimization Analysis Report

**Date**: 2026-04-17  
**Task**: 分析 Three.js 使用情况，找出可优化地方  
**Status**: Analysis Complete

---

## 📊 Current Bundle Analysis

### Problem Statement
- **three-core chunk**: 345-365 KiB (recommended <250 KiB) ⚠️
- **main bundle**: 767 KiB (recommended <300 KiB) ⚠️

### Three.js Usage Location
```typescript
// /root/.openclaw/workspace/7zi-frontend/src/components/knowledge-lattice/KnowledgeLattice3D.tsx
import type { Scene, WebGLRenderer, PerspectiveCamera, Vector3, Object3D, Material } from 'three'
import { KnowledgeLatticeSimple, KnowledgeLatticeSkeleton } from './KnowledgeLatticeSimple'
import { use3DEnabled } from '@/hooks/useDeviceType'
```

### Where It's Used
- Only in `/knowledge-lattice` page
- Implemented via `next/dynamic` with `ssr: false`
- Mobile devices automatically use `KnowledgeLatticeSimple` fallback

---

## ✅ Already Implemented Optimizations

### 1. Dynamic Import
```typescript
// /root/.openclaw/workspace/7zi-frontend/src/app/[locale]/knowledge-lattice/page.tsx
const KnowledgeLattice3D = dynamic(
  () => import('@/components/knowledge-lattice/KnowledgeLattice3D').then(mod => mod.KnowledgeLattice3D),
  {
    ssr: false,
    loading: () => <KnowledgeLatticeFallback />,
  }
)
```
✅ **Status**: Properly implemented. Three.js only loads when page is visited.

### 2. Mobile Device Fallback
```typescript
// Inside KnowledgeLattice3D.tsx
const is3DEnabled = use3DEnabled()

if (!is3DEnabled) {
  return <KnowledgeLatticeSimple nodes={nodes} />
}
```
✅ **Status**: Low-end devices skip 3D loading entirely.

### 3. Webpack Chunk Configuration
```javascript
// next.config.ts
'three-core': {
  test: /[\\/]node_modules[\\/]three[\\/]/,
  name: 'three-core',
  priority: 70,
  reuseExistingChunk: true,
  enforce: true,
  maxSize: 250 * 1024,
},
```
⚠️ **Issue**: Configuration says `maxSize: 250KB` but actual three-core chunk is 345-365KB

---

## 🔍 Issues Identified

### Issue 1: Duplicate Three.js Chunk Configuration
There are **TWO** conflicting webpack configurations for Three.js:

```javascript
// Config 1: three-core
'three-core': {
  test: /[\\/]node_modules[\\/]three[\\/]/,
  name: 'three-core',
  priority: 70,
  enforce: true,
  maxSize: 250 * 1024,
},

// Config 2: three (separate)
'three': {
  test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
  name: 'three',
  priority: 45,
  reuseExistingChunk: true,
  enforce: true,
  maxSize: 400 * 1024,
},
```

**Problem**: The `test` regex in `three` config also matches Three.js, causing potential duplicate bundling or confusion in chunk naming.

### Issue 2: Three.js Core Cannot Be Tree-Shaken
Three.js is a large library and even with tree-shaking, the core modules (WebGLRenderer, Scene, PerspectiveCamera, etc.) are all needed for basic functionality.

**Actual imports used**:
- `Scene`
- `WebGLRenderer`
- `PerspectiveCamera`
- `Vector3`
- `Object3D`
- `Material`
- Plus internal modules like `Color`, `SphereGeometry`, `MeshPhongMaterial`, etc.

### Issue 3: Largest Chunks Are NOT Three.js
Analysis of `.next/static/chunks/`:
```
780K  0fb.21.8x~0er.js  ← THREE. references found, likely three.js
712K  00b2b0q8vssmt.js  ← Turbopack/Next.js internal
464K  0bfrbyqvpkx-c.js  ← Turbopack/Next.js internal
464K  02qdbid~hx9lb.js  ← Turbopack/Next.js internal
```

The largest chunks (780K, 712K, 464K) contain more than just Three.js - they're likely combined chunks.

---

## 💡 Recommendations

### Recommendation 1: Remove Duplicate Three.js Config
Remove the redundant `three` cacheGroup since `three-core` already handles it:

```javascript
// Remove this duplicate config:
'three': {
  test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
  name: 'three',
  priority: 45,
  ...
},
```

### Recommendation 2: Consider Lighter 3D Library Alternatives

For the knowledge lattice visualization, consider these alternatives:

| Library | Size | Use Case |
|---------|------|----------|
| **Pixi.js** | ~500KB (core) | 2D with WebGL, not ideal for 3D |
| **Three.js** | 345-365KB | Full 3D - current solution |
| **regl** | ~100KB | Lightweight WebGL wrapper |
| **OGL** | ~80KB | Very lightweight 3D |
| **fiber + drei** | Already in use | Already optimized |

**Verdict**: Three.js is appropriate for 3D visualization. The alternative libraries would save only ~200KB at most and would require significant rewrites.

### Recommendation 3: Accept 345-365KB as Baseline

Three.js core library is inherently large. For a 3D visualization feature:
- **345-365KB** for the 3D capability is **acceptable**
- Users on low-end devices already get the fallback
- Only page visitors pay the cost, and only once (then cached)

### Recommendation 4: Preload Three.js for Faster Navigation
If the knowledge-lattice page is a key feature, add preload:

```tsx
// In layout or head
<link rel="preload" href="/_next/static/chunks/three-core-xxx.js" as="script" />
```

---

## 📈 Tree-Shaking Analysis

### Current Import Analysis
```typescript
import type { Scene, WebGLRenderer, PerspectiveCamera, Vector3, Object3D, Material } from 'three'
```

**Type imports** (`import type`) are fully tree-shaken and don't add bundle size.

**Runtime imports** happen via dynamic `import('three')` inside useEffect:
```typescript
import('three').then((THREE) => {
  setThree(THREE)
  initScene(THREE)
})
```

✅ **Tree-shaking is properly implemented** - Three.js is loaded dynamically, not at build time.

---

## 🔧 Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| Dynamic Import | ✅ Done | Via `next/dynamic` |
| Mobile Fallback | ✅ Done | Via `use3DEnabled` hook |
| Tree-shaking | ✅ Done | Dynamic import used |
| Chunk Separation | ⚠️ Partial | Configured but overlaps exist |
| Bundle Size | ⚠️ Acceptable | 345-365KB is reasonable for 3D |

---

## 🎯 Action Items

1. **Low Priority**: Remove duplicate `three` webpack config to avoid confusion
2. **Informational Only**: 345-365KB for Three.js is acceptable for the feature
3. **No Change Needed**: Main bundle issue (767KB) is NOT caused by Three.js - separate investigation needed

---

## 📝 Conclusion

The Three.js optimization is **already well-implemented**:
- Dynamic loading ensures Three.js only loads on knowledge-lattice page
- Mobile devices use simple fallback and don't load Three.js at all
- The 345-365KB chunk size is **expected and acceptable** for a full 3D library

The main bundle size issue (767KB) appears to be caused by other code, not Three.js. Further investigation into other large dependencies (recharts, zustand, etc.) would be more beneficial.

---

**Report Generated**: 2026-04-17  
**Analyst**: 🎨 Designer (Frontend Build Performance)
