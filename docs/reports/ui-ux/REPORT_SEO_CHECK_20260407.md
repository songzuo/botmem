# 7zi 项目 SEO 优化检查报告

**检查时间:** 2026-04-07  
**检查人:** 推广专员（子代理）  
**工作目录:** /root/.openclaw/workspace

---

## 一、next.config.ts SEO 配置 ✅ 良好

| 项目 | 状态 | 说明 |
|------|------|------|
| `reactStrictMode: true` | ✅ | 开启严格模式 |
| 图片优化 (AVIF/WebP) | ✅ | `formats: ['image/avif', 'image/webp']` |
| 图片设备尺寸 | ✅ | 完整覆盖 (640~3840px) |
| Security Headers | ✅ | HSTS/X-Frame-Options/X-XSS-Protection 等 |
| DNS Prefetch | ✅ | X-DNS-Prefetch-Control: on |
| `output: 'standalone'` | ✅ | 适合 Docker 部署 |

### ⚠️ 建议改进
1. **图片缓存 TTL 偏低**: `minimumCacheTTL: 60` (60秒)，建议提升至 `300` 以上
2. **无明确的 `metadataBase`** 在 next.config 中（但 layout.tsx 有设置）

---

## 二、sitemap.ts 和 robots.ts ✅ 基础良好，存在域名不一致问题

### sitemap.ts
- ✅ 使用 Next.js 15+ Metadata API
- ✅ 包含 `lastModified` / `changeFrequency` / `priority`
- ✅ 多语言 `alternates.languages` 支持
- ⚠️ **baseUrl 默认值错误**:  fallback 到 `https://7zi.com`，但实际站点是 `https://7zi.studio`
- ⚠️ **sitemap 路径不完整**: 只包含 demo 页面，缺少 `/zh/about`、`/zh/team`、`/zh/blog` 等主要路由

### robots.ts
- ✅ 使用 Metadata API
- ✅ 正确禁止 `/api/`、`/admin/`、`/_next/`
- ⚠️ **域名不一致**: 默认 fallback 到 `https://7zi.com`
- ⚠️ **冲突**: `public/robots.txt` 禁止 `/knowledge-lattice/`，但 sitemap.ts 又包含它

### public/robots.txt
- ✅ 详细的 User-Agent 规则（Googlebot、Bingbot、Baiduspider）
- ✅ `Crawl-delay` 设置合理
- ⚠️ **域名过时**: sitemap 指向 `https://7zi.studio/sitemap.xml` 但 sitemap.ts 默认用 `7zi.com`

---

## 三、public/ 目录 Meta 标签和结构化数据

### Favicon / 图标 ✅ 非常完善
- ✅ 16/32/72/96/128/144/152/180/192/384/512px 全套 PNG
- ✅ WebP 版本
- ✅ Maskable icons (PWA)
- ✅ Apple Touch Icon + Startup Image
- ✅ SVG source files

### OG Image ✅ 良好
- 尺寸: 1200x630 (标准)
- 包含 logo、标题、slogan、联系方式
- ⚠️ 建议: 添加真实产品截图而非纯文字设计

### Manifest.json ✅ 完善
- ✅ PWA 完整配置（name、short_name、theme_color、screenshots、shortcuts）
- ✅ `start_url` 带 UTM 参数
- ⚠️ `share_target` 功能可能过度（如不需要可移除）

### 结构化数据 ⚠️ 仅有 Organization
- ✅ layout.tsx 包含 Organization Schema
- ❌ 缺少 `WebSite` Schema (含 searchAction)
- ❌ 缺少 `SoftwareApplication` 或 `Service` Schema
- ❌ 缺少 `FAQPage` Schema（如有 FAQ 页面）
- ❌ 缺少 `Article` Schema（博客文章页面）

---

## 四、Google Search Console 集成 ❌ 未配置

| 项目 | 状态 | 说明 |
|------|------|------|
| `google-site-verification` meta tag | ❌ | 未找到 |
| GSC 验证文件 | ❌ | 未找到 |
| GSC API 集成 | ❌ | 未找到 |
| Bing Webmaster Tools | ❌ | 未配置 |

### 建议添加
在 `layout.tsx` 的 metadata 中添加（需从 GSC 获取验证码）:
```ts
verification: {
  google: 'your-google-site-verification-code',
},
```

---

## 五、其他 SEO 问题

### 🔴 严重
1. **baseUrl 不一致**: layout.tsx 用 `7zi.studio`，sitemap.ts/robots.ts 默认 `7zi.com`
   - 修复: 确保 `NEXT_PUBLIC_SITE_URL=7zi.studio` 环境变量已设置

### 🟡 中等
2. **无 `metadataBase` 在 next.config**: 建议迁移到 next.config.ts 统一管理
3. **robots.txt 和 sitemap.ts 规则冲突**: `/knowledge-lattice/` 禁止但又在 sitemap 中
4. **缺少 Open Graph locale alternate**: 只声明了 `zh_CN`，缺少 `en_US` 的 alternate
5. **Twitter card**: 声明了 `@7zistudio`，需确认账号存在且活跃

### 🟢 轻微
6. **Viewport maximumScale=1.0**: 禁止用户缩放，建议改为允许（对可访问性更友好）
7. **缺少 `referrer` meta tag**: 可考虑添加
8. **CMS 动态路由未纳入 sitemap**: 如果有博客系统，需确保动态路由被爬取

---

## 六、优先级改进清单

### P0 (立即修复)
- [ ] 确保 `NEXT_PUBLIC_SITE_URL=https://7zi.studio` 环境变量在生产环境设置
- [ ] 统一 baseUrl 在所有配置文件中
- [ ] 添加 Google Search Console 验证 meta tag

### P1 (本周内)
- [ ] 补充 sitemap.ts 中缺失的主要页面（/zh/about, /zh/team, /zh/blog 等）
- [ ] 添加 WebSite + searchAction 结构化数据
- [ ] 解决 robots.txt 中 `/knowledge-lattice/` 禁止与 sitemap 包含的冲突
- [ ] 生成真实的产品截图替换 og-image.svg（或两者兼顾）

### P2 (计划内)
- [ ] 添加 FAQPage / Article 结构化数据
- [ ] 提升图片 minimumCacheTTL 至 300+
- [ ] 添加 Bing Webmaster Tools 验证
- [ ] 审查 Twitter 账号活跃状态

---

## 七、总结

| 维度 | 评分 | 说明 |
|------|------|------|
| 技术 SEO | ⭐⭐⭐⭐ | 基础扎实，headers/图片/国际化配置完善 |
| 内容 SEO | ⭐⭐⭐ | sitemap 不完整，缺少主要页面 |
| 结构化数据 | ⭐⭐ | 仅 Organization，缺少关键 Schema |
| GSC 集成 | ⭐ | 完全缺失验证和集成 |
| 基础设施 | ⭐⭐⭐⭐ | favicon/manifest/icon 全套到位 |

**综合评分: ⭐⭐⭐ (3/5)** — 基础完善，但域名一致性和 GSC 集成是紧迫问题。

---

*报告生成时间: 2026-04-07 17:40 GMT+2*
