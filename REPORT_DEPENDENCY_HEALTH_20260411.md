# 依赖健康状况报告

**报告日期**: 2026-04-11  
**项目**: 7zi-frontend (v1.13.0)  
**检查工具**: pnpm outdated, npm audit

---

## 📊 概览

| 类别 | 数量 |
|------|------|
| 过期依赖 | 31 |
| 安全漏洞 (高危) | 3 |
| 安全漏洞 (中危) | 3 |
| 已废弃包 | 2 |
| 版本范围过宽 | 5+ |

---

## 🔴 高优先级问题

### 1. 安全漏洞 (需立即处理)

| 漏洞包 | 严重性 | 漏洞数 | 当前版本 | 影响范围 | 修复状态 |
|--------|--------|--------|----------|----------|----------|
| **xlsx** | 🔴 高 | 2 | 0.18.5 | * | ❌ 无修复 |
| **vite** | 🔴 高 | 3 | 8.0.8 | 8.0.0-8.0.4 | ✅ 可修复 |
| **next** | 🔴 高 | 1 | 16.2.1 | ≤16.2.2 | ✅ 可修复 |
| **hono** | 🟡 中 | 5 | (间接依赖) | ≤4.12.11 | ✅ 可修复 |
| **next-intl** | 🟡 中 | 1 | 4.8.3 | <4.9.1 | ✅ 可修复 |

**详细漏洞**:

```
[xlsx] Prototype Pollution in sheetJS (GHSA-4r6h-8v6p-xvw6)
[xlsx] Regular Expression Denial of Service (ReDoS) (GHSA-5pgg-2g8v-p4x9)

[vite] Path Traversal in Optimized Deps .map Handling (GHSA-4w7w-66w2-5vf9)
[vite] server.fs.deny bypass with queries (GHSA-v2wj-q39q-566r)
[vite] Arbitrary File Read via Vite Dev Server WebSocket (GHSA-p9ff-h696-f583)

[next] Denial of Service with Server Components (GHSA-q4gf-8mx6-v5v3)

[next-intl] Open redirect vulnerability (GHSA-8f24-v5vv-gm5j)

[hono] 5个中危漏洞 (cookie验证, IP匹配, 路径遍历, 中间件绕过)
```

### 2. 已废弃包

| 包名 | 当前版本 | 建议 |
|------|----------|------|
| @types/commander | 2.12.5 | 迁移到 commander 内置类型或等待官方更新 |
| @types/jszip | 3.4.1 | jszip 已自带类型，考虑移除 |

### 3. @types/bull 废弃警告

| 包名 | 当前版本 | 最新可用 | 状态 |
|------|----------|----------|------|
| @types/bull | 3.15.9 | 4.10.4 | ⚠️ 已废弃 |

---

## 🟡 需要更新的依赖 (31个)

### 关键业务依赖

| 包 | 当前 | 最新 | 优先级 |
|----|------|------|--------|
| @modelcontextprotocol/sdk | 1.27.1 | 1.29.0 | 🟡 中 |
| @sentry/nextjs | 10.45.0 | 10.48.0 | 🟡 中 |
| fuse.js | 7.1.0 | 7.3.0 | 🟢 低 |
| isomorphic-dompurify | 3.6.0 | 3.8.0 | 🟢 低 |
| lru-cache | 11.2.7 | 11.3.3 | 🟢 低 |
| lucide-react | 1.7.0 | 1.8.0 | 🟢 低 |
| next-intl | 4.8.3 | 4.9.1 | 🔴 高 |
| recharts | 3.8.0 | 3.8.1 | 🟢 低 |

### React 相关

| 包 | 当前 | 最新 |
|----|------|------|
| react | 19.2.4 | 19.2.5 |
| react-dom | 19.2.4 | 19.2.5 |
| react-is | 19.2.4 | 19.2.5 |

### Next.js 生态

| 包 | 当前 | 最新 |
|----|------|------|
| next | 16.2.1 | 16.2.3 |
| eslint-config-next | 16.2.1 | 16.2.3 |

### 测试/开发依赖

| 包 | 当前 | 最新 |
|----|------|------|
| vitest | 4.1.2 | 4.1.4 |
| @vitest/coverage-v8 | 4.1.2 | 4.1.4 |
| @playwright/test | 1.58.2 | 1.59.1 |
| jsdom | 29.0.1 | 29.0.2 |
| msw | 2.12.14 | 2.13.2 |
| eslint | 9.39.4 | 10.2.0 |
| typescript | 5.9.3 | 6.0.2 |
| @next/bundle-analyzer | 16.2.1 | 16.2.3 |
| eslint-plugin-storybook | 10.3.3 | 10.3.5 |

### 类型定义

| 包 | 当前 | 最新 |
|----|------|------|
| @types/node | 25.5.2 | 25.6.0 |
| @types/nodemailer | 7.0.11 | 8.0.0 |

---

## ⚠️ 版本范围检查

以下依赖的版本范围过于宽松，建议收紧：

| 包 | 当前范围 | 建议 | 原因 |
|----|----------|------|------|
| xlsx | ^0.18.5 | ~0.18.5 | 高危漏洞，需精确控制 |
| eslint | ^9 | ^9.39 | 10.x 有重大变化 |
| typescript | ^5 | ^5.9 | 6.x 有破坏性变更 |
| @types/react | ^19 | ^19 | 合理 |
| @types/react-dom | ^19 | ^19 | 合理 |

---

## 📋 建议行动

### 🔴 立即处理 (本周)

1. **更新 next**: 16.2.1 → 16.2.3 (修复 DoS 漏洞)
2. **更新 next-intl**: 4.8.3 → 4.9.1 (修复开放重定向漏洞)
3. **更新 vite**: 8.0.8 → 最新 (修复 3 个高危漏洞)
4. **评估 xlsx**: 
   - 考虑替换方案 (如 exceljs)
   - 或固定版本并加强输入验证
   - 当前无修复，需手动防护

### 🟡 尽快处理 (本月)

1. 更新 hono 到 4.12.11+
2. 更新 @types/bull 到 4.x 或移除 (已废弃)
3. 移除 @types/commander 和 @types/jszip (已废弃或内置类型)

### 🟢 常规更新 (按需)

- 其他 20+ 个过时依赖可在下次发布周期更新

---

## 🔧 推荐更新命令

```bash
# 关键安全更新
pnpm update next@16.2.3 next-intl@4.9.1 vite@latest

# 业务依赖更新
pnpm update @modelcontextprotocol/sdk @sentry/nextjs fuse.js isomorphic-dompurify

# 清理废弃类型包
pnpm remove @types/commander @types/jszip @types/bull

# 全部更新 (谨慎)
pnpm update
```

---

*报告由 架构师 子代理生成 | 2026-04-11*
