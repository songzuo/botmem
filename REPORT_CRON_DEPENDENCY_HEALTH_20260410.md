# 依赖健康检查报告
**时间**: 2026-04-10 00:48 GMT+2
**项目**: 7zi-frontend
**环境**: Node.js v22.22.1 | pnpm 10.32.1

---

## 1. 安全漏洞 (pnpm audit --audit-level=high)

**发现 6 个漏洞 (3 high, 3 moderate)**

### 🔴 高危漏洞

| 漏洞 | 包 | 影响 | 路径 |
|------|-----|------|------|
| GHSA-5c6j-r48x-rmvq | serialize-javascript ≤7.0.2 | RCE via RegExp.flags / Date.toISOString | @ducanh2912/next-pwa > workbox-build > @rollup/plugin-terser |
| GHSA-v2wj-q39q-566r | vite 8.0.0–8.0.4 | server.fs.deny 绕过 | vite |
| GHSA-p9ff-h696-f583 | vite 8.0.0–8.0.4 | 任意文件读取 (Dev Server WebSocket) | vite |

### 🟡 中危漏洞

3 个 moderate 级别漏洞（详情见 `pnpm audit` 输出）

### 建议

```bash
# vite 需要升级到 >=8.0.5
pnpm update vite

# serialize-javascript 需要通过 workbox-build 或 @rollup/plugin-terser 间接更新
# 可以尝试：
pnpm update @rollup/plugin-terser
pnpm update workbox-build
pnpm update @ducanh2912/next-pwa
```

---

## 2. 依赖版本可更新检查 (pnpm outdated)

**大量依赖有新版本可用**，重点关注：

| 包 | 当前 | 最新 | 建议 |
|----|------|------|------|
| **vite** | 8.0.3 | 8.0.8 | ⚠️ **必须更新** (含高危漏洞) |
| **typescript** | 5.9.3 | 6.0.2 | 大版本升级，谨慎测试 |
| **@tiptap/* (全部)** | 2.27.2 | 3.22.3 | 大版本升级，需全面回归测试 |
| **@types/node** | 20.19.39 | 25.5.2 | 跨度较大，谨慎 |
| **@vitejs/plugin-react** | 4.7.0 | 6.0.1 | 大版本升级 |
| **undici** | 7.24.6 | 8.0.2 | 大版本升级 |
| **jsdom** | 24.1.3 | 29.0.2 | 大版本升级 |
| **date-fns** | 3.6.0 | 4.1.0 | 小版本，可更新 |
| **@faker-js/faker** | 8.4.1 | 10.4.0 | 大版本 |
| **react / react-dom** | 19.2.4 | 19.2.5 | 小版本，可更新 |
| **next** | 16.2.2 | 16.2.3 | 小版本，可更新 |
| **msw** | 2.12.14 | 2.13.2 | 小版本，可更新 |

---

## 3. Lockfile 一致性

✅ **pnpm-lock.yaml 状态正常**
- 运行 `pnpm install` 输出 "Lockfile is up to date, resolution step is skipped"
- 无不一致问题

⚠️ **部分包有 build script 未执行**（被忽略）:
- better-sqlite3, esbuild, msw, protobufjs, sharp

---

## 4. 严重问题汇总

### 🔴 立即需要处理
1. **Vite 8.0.3 存在 2 个高危漏洞** — 必须升级到 8.0.5+
2. **serialize-javascript 存在 RCE 风险** — 通过间接依赖引入，需更新 workbox-build 或 terser

### 🟡 建议近期处理
1. **Tiptap 跨大版本 (2→3)** — API 可能有破坏性变更，建议安排专项测试
2. **TypeScript 5→6** — 需完整测试
3. **@vitejs/plugin-react 4→6** — 需完整测试

---

## 5. 建议执行命令

```bash
# 立即修复高危 vite 漏洞
pnpm update vite

# 更新其他安全的补丁版本
pnpm update date-fns i18next nodemailer react react-dom next lucide-react vitest @vitest/browser-playwright @vitest/coverage-v8
pnpm update @storybook/addon-a11y @storybook/addon-docs @storybook/addon-onboarding @storybook/addon-vitest @storybook/nextjs-vite storybook eslint-plugin-storybook

# 大版本更新需要单独安排时间窗口测试
# pnpm update @tiptap/react @tiptap/core ... (2→3)
# pnpm update typescript
# pnpm update @vitejs/plugin-react
```

---

*报告生成: dev-task-dep-health-v4*
