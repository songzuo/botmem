# 前端性能审查 - 开发者任务报告

**日期:** 2026-04-21  
**任务:** dev-task-frontend-perf

---

## 一、昨日报告关键发现 (REPORT_FRONTEND_PERF_REVIEW_0420.md)

| 问题 | 严重度 | 状态 |
|------|--------|------|
| React Compiler annotation 模式已配置但无组件使用 `use memo` | 🔴 P0 | 待修复 |
| React.memo 仅在 1 个文件使用，覆盖率极低 | 🟡 P1 | 待修复 |
| three-core chunk 368KB 超过 300KB 预算 | 🔴 P0 | 待修复 |
| .next 总大小 839MB (已清理，现为 302MB) | 🟡 P1 | 已改善 |

---

## 二、next.config.ts 配置分析

**配置完善度: ⭐⭐⭐⭐⭐**

- ✅ `reactStrictMode: true`
- ✅ `output: 'standalone'` (Docker 友好)
- ✅ React Compiler 启用 (opt-in 模式，限定 `src/components/features`, `src/components/dashboard`, `src/app/[locale]/dashboard`)
- ✅ Security Headers 完整 (CSP, HSTS, X-Frame-Options 等)
- ✅ 图片格式: `['image/avif', 'image/webp']`
- ✅ `minimumCacheTTL: 60`
- ✅ `optimizeCss: true`
- ✅ Webpack splitChunks: react, charts, three, utils 独立分包
- ✅ `compiler.removeConsole` 生产环境启用

**问题:** React Compiler opt-in 模式限定了编译范围，但配置目录外的组件未受益。

---

## 三、layout.tsx 分析

**布局文件健康度: ⭐⭐⭐⭐**

```tsx
// 字体优化配置良好
const geistSans = Geist({
  display: 'swap',
  preload: true,
})
```

**优点:**
- 字体使用 `display: 'swap'` 避免渲染阻塞
- 完整 SEO metadata (OG, Twitter, Schema.org JSON-LD)
- PWA meta tags 完整
- Theme script 内联防止 FOUC
- `preconnect` + `dns-prefetch` 优化外部资源加载

**潜在问题:**
- 内联 JS 较多 (Theme script, JSON-LD)，可考虑提取为外部文件

---

## 四、public/ 静态资源

**资源丰富度: ⭐⭐⭐⭐⭐**

| 类型 | 数量 | 说明 |
|------|------|------|
| App Icons | 40+ | 多尺寸 PNG + WebP 双格式 |
| PWA 配置 | 3 | manifest.json, sw.js, browserconfig.xml |
| SEO 文件 | 2 | robots.txt, sitemap.xml |
| Logo/OG | 4 | SVG + PNG + WebP |
| Screenshots | 4 | PNG + WebP 双格式 |

**评估:** 静态资源组织良好，WebP 格式覆盖到位，PWA 配置完整。

---

## 五、.next 构建产物

| 目录 | 大小 | 说明 |
|------|------|------|
| `.next/` 总计 | **302MB** | 较昨日 839MB 大幅下降 |
| `standalone/` | 218MB | 主要产出 (Docker 镜像) |
| `static/` | 5.4MB | 静态资源 |
| `cache/` | 1.4MB | 较小 (缓存未命中或清理过) |

**standalone 较大的原因:** 可能包含完整的 node_modules 或 pnpm store。

---

## 六、待处理事项

### 🔴 立即修复

1. **为关键组件添加 `'use memo'` 指令**
   - `dashboard/AgentStatusPanel.tsx` 的 6 个组件
   - 高频渲染的列表项组件

2. **检查 Three.js 多版本问题**
   ```bash
   grep -r "three" package.json | head -20
   ```

### 🟡 重要优化

3. **削减 standalone 大小 (218MB 偏大)**
   ```bash
   # 检查是否可以排除 devDependencies
   ```

4. **使用 dynamic import 延迟加载 demo 页面组件**

---

## 七、结论

项目前端性能基础设施配置良好 (安全头、图片优化、Webpack 分包、PWA)，但 React Compiler 和 React 优化 hooks 使用率低是主要瓶颈。昨日 302MB 构建产物较 839MB 已大幅改善，standalone 目录是下一步优化重点。

**综合评分: 6.5/10** (配置完善，执行不足)