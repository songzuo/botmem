# Next.js 16 研究报告

**日期**: 2026-04-20  
**分析师**: 咨询师子代理  
**目标**: 7zi-frontend 项目

---

## 1. 当前项目状态

| 项目 | 版本 |
|------|------|
| **Next.js** | `^16.2.4` ✅ 已升级 |
| **React** | `^19.2.5` |
| **Node.js** | 需验证 (要求 20.9+) |

**结论**: 7zi-frontend **已经使用 Next.js 16.2.4**，无需升级！

---

## 2. Next.js 16 关键新特性

### 2.1 Turbopack (stable)
- 默认 bundler，2-5x 更快构建，10x 更快热更新
- 项目已配置 `next dev --turbopack`
- ✅ 已适配

### 2.2 Cache Components
- 新 `"use cache"` 指令，显式缓存
- 需要在 `next.config.ts` 启用 `cacheComponents: true`
- 📌 可选功能，当前未启用

### 2.3 React Compiler (stable)
- 自动 memoization，减少不必要的重渲染
- 需要安装 `babel-plugin-react-compiler`
- ✅ 已安装 (v1.0.0)，配置需检查

### 2.4 新的 Caching APIs
- `revalidateTag()` 需要第二个 `cacheLife` 参数
- 新增 `updateTag()` (Server Actions)
- 新增 `refresh()` 函数
- ⚠️ 需检查代码中的 `revalidateTag` 调用

### 2.5 迁移: middleware.ts → proxy.ts
- `middleware.ts` 已弃用
- 应改为 `proxy.ts`
- ⚠️ 需检查项目是否存在 middleware

### 2.6 Async Request APIs
- `cookies()`, `headers()`, `draftMode`, `params`, `searchParams` 必须异步访问
- 15 版本的同步兼容已移除
- ⚠️ 需全面审查

---

## 3. 兼容性检查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Next.js 版本 | ✅ OK | 16.2.4 (最新) |
| React 版本 | ✅ OK | 19.2.5 |
| Turbopack | ✅ OK | 已使用 |
| React Compiler | ⚠️ 需检查 | 已安装但未在 config 启用 |
| middleware → proxy | ⚠️ 需检查 | 可能仍使用旧名称 |
| revalidateTag | ⚠️ 需检查 | 需添加 cacheLife 参数 |

---

## 4. 风险评估

| 风险项 | 级别 | 说明 |
|--------|------|------|
| **版本升级** | 🟢 低 | 已是最新版本 |
| **Turbopack 兼容性** | 🟢 低 | 已配置使用 |
| **Async APIs** | 🟡 中 | 需审查代码 |
| **middleware 迁移** | 🟡 中 | 旧文件需重命名 |
| **revalidateTag 调用** | 🟡 中 | 需添加 cacheLife |
| **React Compiler** | 🟢 低 | 库已安装，可选启用 |

**总体风险**: **🟡 中低**

---

## 5. 建议行动

### 立即执行 (低风险)
1. ✅ 确认 Node.js 版本 >= 20.9.0
2. 检查 `middleware.ts` 是否存在 → 重命名为 `proxy.ts`
3. 检查代码中 `revalidateTag()` 调用，添加 `cacheLife` 参数

### 可选优化 (提升性能)
1. 在 `next.config.ts` 启用 `reactCompiler: true`
2. 启用 Cache Components: `cacheComponents: true`
3. 启用 Turbopack 文件系统缓存

---

## 6. 升级命令 (如需重做)

```bash
# 升级到最新 Next.js 16
npx @next/codemod@canary upgrade latest

# 手动升级
npm install next@latest react@latest react-dom@latest
npm install -D babel-plugin-react-compiler
npm install -D @types/react@latest @types/react-dom@latest
```

---

## 7. 结论

7zi-frontend **已经完成 Next.js 16 升级**，当前版本为 16.2.4。

主要待办事项：
1. 验证 Node.js 版本
2. 检查 middleware.ts 迁移
3. 修复 revalidateTag 调用

**无需大规模迁移工作**。
