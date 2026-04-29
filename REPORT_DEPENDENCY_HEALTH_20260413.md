# 依赖健康状态报告
**项目**: 7zi-frontend  
**检查时间**: 2026-04-13 14:03 GMT+2  
**检查人**: 🛡️ 系统管理员子代理

---

## 1. 过期依赖列表（pnpm outdated）

> `pnpm outdated` 以 Exit Code 1 退出，表示存在过期依赖。

### 🔴 高优先级（重大版本更新）

| 包名 | 当前版本 | 最新版本 | 类型 |
|------|---------|---------|------|
| @faker-js/faker | 8.4.1 | 10.4.0 | dev |
| @testing-library/react | 14.3.1 | 16.3.2 | dev |
| **@tiptap/* (14个包)** | 2.27.2 | 3.22.3 | prod |
| @types/node | 20.19.39 | 25.6.0 | dev |
| @vitejs/plugin-react | 4.7.0 | 6.0.1 | dev |
| jsdom | 24.1.3 | 29.0.2 | dev |
| typescript | 5.9.3 | 6.0.2 | dev |

**@tiptap/* 批量更新详情**（共14个包，全部 2.27.2 → 3.22.3）：
`@tiptap/core`, `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-blockquote`, `@tiptap/extension-bold`, `@tiptap/extension-bullet-list`, `@tiptap/extension-code-block`, `@tiptap/extension-code-block-lowlight`, `@tiptap/extension-heading`, `@tiptap/extension-horizontal-rule`, `@tiptap/extension-image`, `@tiptap/extension-italic`, `@tiptap/extension-link`, `@tiptap/extension-list-item`, `@tiptap/extension-ordered-list`, `@tiptap/extension-placeholder`, `@tiptap/extension-strike`, `@tiptap/extension-text`, `@tiptap/extension-text-align`, `@tiptap/extension-text-style`, `@tiptap/extension-underline`

### 🟡 中优先级（次版本/补丁更新）

| 包名 | 当前版本 | 最新版本 | 类型 |
|------|---------|---------|------|
| better-sqlite3 | 12.8.0 | 12.9.0 | prod |
| date-fns | 3.6.0 | 4.1.0 | prod |
| undici | 7.24.7 | 8.0.3 | prod |

### ⚠️ 废弃警告

| 包名 | 当前版本 | 状态 |
|------|---------|------|
| @types/uuid | 10.0.0 | → 11.0.0 (deprecated) |
| critters | 0.0.23 | → 0.0.25 (deprecated) |

---

## 2. 安全漏洞统计（pnpm audit）

| 严重程度 | 数量 | 说明 |
|---------|------|------|
| 🔴 High | 1 | RCE via RegExp.flags / Date.prototype.toISOString() |
| 🟡 Moderate | 1 | CPU Exhaustion DoS via crafted array-like objects |
| 🔵 Low | 0 | — |
| ⚪ Critical | 0 | — |
| **总计** | **2** | |

### 漏洞路径

```
serialize-javascript (≤7.0.2 / <7.0.5)
  └── .>@ducanh2912/next-pwa>workbox-build>@rollup/plugin-terser>serialize-javascript
```

**来源**: `next-pwa` → `workbox-build` → `@rollup/plugin-terser` → `serialize-javascript`

**影响**: 两个 RCE/DoS 漏洞，路径经过 `next-pwa` 间接依赖

**总计依赖**: 1200 个

---

## 3. Lock 文件完整性

| 文件 | 大小 | 行数 | 状态 |
|------|------|------|------|
| `pnpm-lock.yaml` | 395,778 bytes | 11,390 行 | ✅ 完整 |
| `node_modules/.package-lock.json` | 539,564 bytes | — | ✅ 存在 |

> 注：同时存在 `package-lock.json` (589,782 bytes)，属于 npm 遗留文件，与 pnpm 并存。

---

## 4. Node 版本配置

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `.nvmrc` | ❌ 不存在 | 没有指定 Node 版本 |
| `package.json engines` | ❌ 未配置 | 没有声明 Node/pnpm 版本约束 |

**建议**: 添加 `.nvmrc` 和 `engines` 字段以确保团队和 CI 环境一致性。

---

## 5. 更新优先级建议

### 🔥 P0 — 立即处理

1. **serialize-javascript 安全漏洞**
   - 当前 `serialize-javascript < 7.0.5` 存在 RCE/DoS 风险
   - 路径：`@ducanh2912/next-pwa > workbox-build > @rollup/plugin-terser`
   - 方案：检查 `next-pwa` 是否有更新版本，或考虑降级/替换 `next-pwa`

### 🟠 P1 — 本周处理

2. **@tiptap 批量升级（2.27.2 → 3.22.3）**
   - 涉及 14+ 个包，是重大版本跳跃
   - 建议：先在 dev 分支测试，确认破岸 API 变更
   - 参考：[Tiptap v3 Migration Guide](https://tiptap.dev/docs/migrations)

3. **@types/uuid → 11.0.0（已废弃）**
   - `uuid` 包本身可能已同步更新，需检查兼容性

4. **critters → 0.0.25（已废弃）**
   - 属于 Next.js PWA 关键路径依赖，需同步确认

### 🟡 P2 — 近期处理

5. **@vitejs/plugin-react（4.7.0 → 6.0.1）**
   - React 生态重大更新，可能影响构建配置

6. **typescript（5.9.3 → 6.0.2）**
   - TypeScript 6.0 有一些破坏性变更，建议 Review 后升级

7. **@types/node（20.19.39 → 25.6.0）**
   - 跟进 Node 22+ 新 API 类型定义

### 🔵 P3 — 计划内处理

8. **@testing-library/react（14.3.1 → 16.3.2）**
9. **jsdom（24.1.3 → 29.0.2）**
10. **@faker-js/faker（8.4.1 → 10.4.0）**

### 🟢 运维项

11. **创建 `.nvmrc` 文件** — 建议写入 `22`（匹配当前 Node v22.22.1）
12. **在 `package.json` 添加 `engines` 字段** — 锁定 Node ≥18, pnpm ≥8

---

## 6. 总结

| 类别 | 数量 |
|------|------|
| 过期依赖总数 | 20+ |
| 高优先级（重大版本） | 7 组 |
| 安全漏洞 | 2（1高+1中） |
| 废弃包警告 | 2 |
| 配置缺失 | 2（.nvmrc, engines） |

**整体评级**: 🟡 **中等风险**  
**建议行动**: 优先修复安全漏洞，其次批量处理 @tiptap 升级，最后按优先级处理其他过期依赖。
