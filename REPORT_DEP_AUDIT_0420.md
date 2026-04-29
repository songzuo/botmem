# 依赖健康状态与安全审计报告
**项目**: 7zi-frontend
**检查时间**: 2026-04-20 15:35 GMT+2
**检查人**: ⚡ Executor 子代理

---

## 1. 安全漏洞审计（npm audit）

| 严重程度 | 数量 | 详情 |
|---------|------|------|
| 🔴 High | **5** | serialize-javascript RCE/DoS 漏洞链 |
| 🟡 Moderate | 0 | — |
| 🔵 Low | 0 | — |
| ⚪ Critical | 0 | — |
| **总计** | **5** | |

### 高危漏洞详情（全部源于 serialize-javascript）

```
serialize-javascript (< 7.0.5)
  ├── @rollup/plugin-terser (0.2.0 - 0.4.4)
  │   └── workbox-build
  │       ├── @ducanh2912/next-pwa  [直接依赖]
  │       └── workbox-webpack-plugin
  │
  ├── workbox-build (≥7.1.0)
  │   ├── @ducanh2912/next-pwa  [直接依赖]
  │   └── workbox-webpack-plugin
  │
  └── workbox-webpack-plugin (≥7.1.0)
```

**两个 CVE**:
1. **GHSA-5c6j-r48x-rmvq** — RCE via RegExp.flags / Date.prototype.toISOString() (CVSS 8.1)
2. **GHSA-qj8w-gfj5-8c6v** — CPU Exhaustion DoS via crafted array-like objects (CVSS 5.9)

**注意**: `package.json` 中已有 `pnpm.overrides: { "serialize-javascript": ">=7.0.5" }`，但 npm audit 仍然报告漏洞，说明 overrides 在传递性依赖中未完全生效。需验证实际安装的 serialize-javascript 版本。

---

## 2. 过期依赖列表（pnpm outdated）

### 🔴 高优先级（重大版本更新）

| 包名 | 当前 | 最新 | 类型 |
|------|------|------|------|
| @faker-js/faker | 8.4.1 | **10.4.0** | dev |
| @testing-library/react | 14.3.1 | **16.3.2** | dev |
| @tiptap/* (22个包) | 2.27.2 | **3.22.4** | prod |
| @types/node | 20.19.39 | **25.6.0** | dev |
| @vitejs/plugin-react | 4.7.0 | **6.0.1** | dev |
| jsdom | 24.1.3 | **29.0.2** | dev |
| typescript | 5.9.3 | **6.0.2** | dev |

### 🟡 中优先级（次版本/补丁更新）

| 包名 | 当前 | 最新 | 类型 |
|------|------|------|------|
| better-sqlite3 | 12.8.0 | 12.9.0 | prod |
| date-fns | 3.6.0 | 4.1.0 | prod |
| undici | 7.24.7 | 8.0.3 | prod |
| next | 16.2.3 | 16.2.4 | prod |
| i18next | 26.0.4 | 26.0.6 | prod |
| react-i18next | 17.0.2 | 17.0.4 | prod |
| autoprefixer | 10.4.27 | 10.5.0 | prod |
| vite | 8.0.8 | 8.0.9 | dev |
| msw | 2.13.2 | 2.13.4 | dev |
| @chromatic-com/storybook | 5.1.1 | 5.1.2 | dev |

### ⚠️ @tiptap/* 批量升级（22个包 2.27.2 → 3.22.4）

```
@tiptap/core, @tiptap/react, @tiptap/starter-kit,
@tiptap/extension-blockquote, @tiptap/extension-bold,
@tiptap/extension-bullet-list, @tiptap/extension-code-block,
@tiptap/extension-code-block-lowlight, @tiptap/extension-heading,
@tiptap/extension-horizontal-rule, @tiptap/extension-image,
@tiptap/extension-italic, @tiptap/extension-link,
@tiptap/extension-list-item, @tiptap/extension-ordered-list,
@tiptap/extension-placeholder, @tiptap/extension-strike,
@tiptap/extension-text, @tiptap/extension-text-align,
@tiptap/extension-text-style, @tiptap/extension-underline
```

---

## 3. analyze-dependencies.js 执行结果

```
SCRIPT_NOT_FOUND
```

该脚本不存在，跳过。

---

## 4. 依赖统计

| 指标 | 数值 |
|------|------|
| 总依赖数 | 1232 |
| 生产依赖 | 775 |
| 开发依赖 | 419 |
| 可选依赖 | 109 |

---

## 5. 与上次报告（2026-04-13）对比

| 项目 | 2026-04-13 | 2026-04-20 | 变化 |
|------|-----------|-----------|------|
| 高危漏洞 | 2 (1高+1中) | 5 (全部高) | ⚠️ 恶化 |
| @tiptap 最新版本 | 3.22.3 | 3.22.4 | 小版本更新 |
| serialize-javascript override | 有 | 有 | 但仍无效 |

**关键变化**: 高危漏洞数量从 2 → 5，漏洞链路未改善。`pnpm.overrides` 未完全解决问题。

---

## 6. 更新优先级建议

### 🔥 P0 — 立即处理

1. **serialize-javascript 安全漏洞**
   - `package.json` overrides 未能彻底解决问题
   - 建议：执行 `pnpm why serialize-javascript` 确认实际版本
   - 如 override 未生效，考虑降级 `@ducanh2912/next-pwa` 或移除 PWA 功能

### 🟠 P1 — 本周处理

2. **@tiptap 批量升级（2.27.2 → 3.22.4）**
   - 22 个包，重大版本跳跃
   - 需先在 dev 分支测试，破岸 API 风险高
   - 参考：[Tiptap v3 Migration Guide](https://tiptap.dev/docs/migrations)

3. **@vitejs/plugin-react（4.7.0 → 6.0.1）**
   - React 生态重大更新，可能影响构建配置

### 🟡 P2 — 近期处理

4. **typescript（5.9.3 → 6.0.2）** — 破坏性变更，建议 Review 后升级
5. **@testing-library/react（14.3.1 → 16.3.2）** — 配合 React 19
6. **@faker-js/faker（8.4.1 → 10.4.0）** — 重大版本更新
7. **@types/node（20.19.39 → 25.6.0）** — 跟进 Node 22+

### 🔵 P3 — 计划内处理

8. **date-fns（3.6.0 → 4.1.0）**
9. **undici（7.24.7 → 8.0.3）**
10. **jsdom（24.1.3 → 29.0.2）**

---

## 7. 总结

| 类别 | 数量 |
|------|------|
| 高危安全漏洞 | **5** |
| 过期依赖（重大版本） | 7 组 |
| 过期依赖（次版本/补丁） | 10+ |
| .nvmrc / engines 配置缺失 | 仍存在 |

**整体评级**: 🔴 **高风险**

**首要行动**:
1. 验证 `serialize-javascript` 实际版本：`pnpm why serialize-javascript`
2. 确认 `pnpm.overrides` 是否在传递依赖中生效
3. 如 override 无效，考虑降级 `@ducanh2912/next-pwa` 到 10.2.6 或移除 PWA
