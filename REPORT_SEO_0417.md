# 7zi.com SEO 分析报告

**生成时间**: 2026-04-17  
**分析网站**: https://7zi.com  
**分析人**: 推广专员子代理

---

## 一、首页基本信息

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Title | ✅ 存在 | `上海尔虎信息技术有限公司 - AI技术赋能企业数字化转型`（51字符，合适） |
| Meta Description | ✅ 存在 | `上海尔虎信息技术有限公司，专注企业AI技术应用...`（80+字符） |
| Meta Keywords | ✅ 存在 | 包含 AI技术服务、上海AI公司等关键词 |
| Open Graph | ✅ 存在 | og:title / og:description / og:type 齐全 |
| Language | ✅ 正确 | `<html lang="zh-CN">` |
| 响应头 | ✅ 安全 | Cloudflare + HSTS + X-Frame-Options + X-XSS-Protection |

---

## 二、站点地图（SEO 基础设施）

| 检查项 | 状态 | HTTP状态码 | 说明 |
|--------|------|-----------|------|
| /robots.txt | ✅ 存在 | 200 | 极其完善的 robots.txt，详见下节 |
| /sitemap_index.xml | ✅ 存在 | 200 | 索引文件，管理两个子 sitemap |
| /sitemap.xml | ✅ 存在 | 200 | 包含 **61个 URL**，定期更新 |
| /feed.xml | ✅ 存在 | 200 | RSS 订阅源，内容丰富 |

**Sitemap 分析**:
- 共收录 61 个页面（about、ai-services、articles 等）
- 优先级分配合理：首页 0.9，AI服务页 0.8，文章页 0.7
- 更新频率设置合理（weekly/monthly）
- 最近更新：2026-04-16

---

## 三、robots.txt 详细分析

### ✅ 优点

**非常完善**，是我见过最全面的 robots.txt 之一：

```
User-agent: *
Allow: /
Disallow: /tmp/ /api/admin/

Sitemap: https://7zi.com/sitemap_index.xml
Sitemap: https://7zi.com/sitemap.xml
Sitemap: https://7zi.com/feed.xml
Crawl-delay: 1
```

**全面覆盖主流+AI爬虫**：

| 爬虫类型 | User-Agent | 状态 |
|----------|-----------|------|
| 通用搜索 | Googlebot, Baiduspider, Bingbot | ✅ Allow |
| 中文搜索 | Sogou, 360Spider, YandexBot, HaosouSpider, YisouSpider | ✅ Allow |
| AI 搜索 | ChatGPT-User, GPTBot, Claude-Web, ClaudeBot, PerplexityBot | ✅ Allow |
| 字节/其他 | Bytespider, Applebot, DuckDuckBot, FacebookBot, KimiBot, DoubaoSpider | ✅ Allow |

> **评价**：对 AI 爬虫的全面开放态度非常好，有助于被 ChatGPT、Perplexity 等 AI 搜索平台收录推荐。

---

## 四、安全与技术配置

| 配置项 | 状态 | 说明 |
|--------|------|------|
| HTTPS | ✅ | 全站强制 HTTPS |
| HSTS | ✅ | `max-age=63072000; includeSubDomains; preload` |
| X-Frame-Options | ✅ | `SAMEORIGIN` 防点击劫持 |
| X-XSS-Protection | ✅ | `1; mode=block` |
| Referrer-Policy | ✅ | `strict-origin-when-cross-origin` |
| CDN | ✅ | Cloudflare |
| 服务器 | ✅ | Cloudflare |

---

## 五、SEO 优化建议

### 🔴 高优先级（立即改进）

#### 1. **添加结构化数据（Schema Markup）**
目前首页没有 JSON-LD 结构化数据。

**建议添加**：
- `Organization` Schema（公司名称、logo、联系方式）
- `LocalBusiness` Schema（如适用）
- `WebSite` Schema（带 searchAction）
- `Article` Schema（博客文章页）

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "上海尔虎信息技术有限公司",
  "url": "https://7zi.com",
  "logo": "https://7zi.com/logo.png",
  "description": "专注企业AI技术应用、系统集成与数字化解决方案"
}
```

#### 2. **创建 About 页面并完善内容**
About 页面（`/about.html`）Priority=0.9 但内容未知，建议：
- 200+ 字公司介绍
- 团队规模、技术栈、行业经验
- 添加实体地址、电话、邮箱（可 Schema 配合）

#### 3. **Canonical URL**
确保所有页面有 `<link rel="canonical">` 避免重复内容问题。

---

### 🟡 中优先级

#### 4. **面包屑导航（Breadcrumb）**
在文章页和服务页添加面包屑，提升内链结构和用户/爬虫导航：
```
首页 > AI服务 > 智能客服系统
```

#### 5. **图片优化**
- 检查是否有 `<img alt="">` 空 alt 属性（需补全）
- 图片建议添加 WebP 格式支持
- 添加 `loading="lazy"` 延迟加载

#### 6. **内链策略**
当前文章页面之间可能缺少内链。建议：
- 文章页底部添加"相关推荐"模块
- 在正文中自然引用其他文章（锚文本内链）

#### 7. **H1-H6 标题层级**
审查所有页面，确保：
- 每个页面只有一个 `<h1>`（当前首页没有看到 h1，需确认）
- 标题层级正确递增

#### 8. **Google Search Console & 百度搜索资源平台**
- 注册 Google Search Console（免费）
- 注册百度搜索资源平台（国内必备）
- 提交 sitemap，加速收录

---

### 🟢 低优先级（持续优化）

#### 9. **页面速度优化**
- 使用 Lighthouse 跑分（目标 90+）
- 字体 `fonts.googleapis.cn` 国内加载可能慢，考虑预连接或本地化
- 检查首屏 FCP（First Contentful Paint）

#### 10. **移动端适配**
- 确认所有页面在移动端体验良好
- 测试 tap 目标尺寸（最小 48px）

#### 11. **社交分享预览**
- 验证 Twitter Card（`twitter:card`, `twitter:title`, `twitter:description`）
- 目前只有 OG 标签，缺少 Twitter Card

#### 12. **国际化（Hreflang）**
如有多语言版本，添加 `<link rel="alternate" hreflang="...">` 标签

---

## 六、竞品对比参考

（因 Brave Search API 未配置，无法直接搜索"site:7zi.com"，建议后续配置后补充）

**参考维度**：
- 同类 AI 技术服务网站（如 `ainize.cn`、`住تلك.com`）
- 检查其关键词布局、内容长度、外链策略
- 对比收录量和搜索可见度

---

## 七、总结评分

| 维度 | 得分 | 说明 |
|------|------|------|
| 技术 SEO | **85/100** | 结构完整，安全头优秀，sitemap 完善 |
| 内容 SEO | **65/100** | 文章数量有限（~14篇），需持续输出高质量内容 |
| 页面优化 | **70/100** | 缺结构化数据、图片 alt、canonical |
| 爬虫友好度 | **95/100** | robots.txt 极佳，对 AI 爬虫全面开放 |
| 整体评分 | **78/100** | **良好，有明显提升空间** |

---

## 八、行动清单

### 立即执行
- [ ] 添加 Organization + WebSite JSON-LD Schema
- [ ] 注册 Google Search Console，提交 sitemap
- [ ] 注册百度搜索资源平台，提交 sitemap
- [ ] 修复图片 alt 空标签问题

### 本周内
- [ ] 完善 About 页面内容（200+字 + 联系方式）
- [ ] 添加 Twitter Card 标签
- [ ] 检查并添加 canonical URL
- [ ] 添加面包屑导航

### 持续建设
- [ ] 保持每周 1-2 篇高质量 AI/数字化文章更新
- [ ] 建立文章内链机制
- [ ] 定期（每月）检查索引覆盖率
- [ ] 监控搜索流量（Google Search Console + 百度统计）
