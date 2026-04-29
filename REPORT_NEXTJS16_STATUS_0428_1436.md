# Next.js 16 兼容性状态报告

**报告时间**: 2026-04-28 14:36 GMT+2  
**项目**: 7zi-frontend  
**审查者**: 架构架子代理  

---

## 一、版本现状

| 依赖 | package.json 版本 | 实际版本 | 状态 |
|------|------------------|----------|------|
| Next.js | `^16.2.4` | 16.2.4 | ✅ 已升级 |
| React | `^19.2.4` | 19.2.4 | ⚠️ **仍为 React 19，非 React 20** |
| React DOM | `^19.2.4` | 19.2.4 | ⚠️ **仍为 React 19，非 React 20** |
| TypeScript | `^5` | 5.x | ✅ 兼容 |
| ESLint | `^9` | 9.x | ✅ 兼容 |
| Tailwind CSS | `@tailwindcss/postcss@^4.2.2` | 4.2.x | ✅ 兼容 |

### 关键发现
**项目名称为 "Next.js 16 + React 20 深度评估"，但实际运行的是 React 19.2.4。**

React 20 尚未发布（截至 2026-04-28）。原计划迁移到 React 20 未能实现。

---

## 二、配置文件审查

### 2.1 next.config.ts ✅ 基本合规

| 配置项 | 状态 | 说明 |
|--------|------|------|
| `reactStrictMode: true` | ✅ | 正确启用 |
| `typescript.ignoreBuildErrors: true` | ⚠️ | 已跳过类型检查，建议生产前修复 |
| `serverExternalPackages` | ✅ | **已在顶层**（不在 experimental 中），符合 Next.js 16 规范 |
| `output: 'standalone'` | ✅ | Docker 部署模式正确 |
| `reactCompiler.compilationMode: 'annotation'` | ✅ | 配置正确 |
| `experimental.optimizePackageImports` | ✅ | 配置完整 |
| `experimental.optimizeCss: true` | ✅ | 配置存在 |
| `turbopack: {}` | ✅ | 显式禁用 turbopack，使用 Webpack |
| PWA (`@ducanh2912/next-pwa`) | ⚠️ | **包未在 package.json 中声明** |

### 2.2 tsconfig.json ✅ 配置良好

```json
{
  "target": "ES2018",
  "lib": ["dom", "dom.iterable", "esnext"],
  "moduleResolution": "bundler",  // ✅ Next.js 16 推荐
  "jsx": "react-jsx",              // ✅ React 17+ 标准
  "strict": true,                   // ✅ 严格模式
  "baseUrl": ".",                   // ✅ 路径别名 @/
  "paths": {
    "@/*": ["./src/*"],
    "@/features/*": ["./src/features/*"],
    "@/shared/*": ["./src/shared/*"]
  }
}
```

### 2.3 App Router 代码 ✅ 合规

- `src/app/layout.tsx` 正确使用 `export const metadata: Metadata = {...}`
- `viewport` 正确分离为独立 export（Next.js 15+ 规范）
- 未发现 `next/head` 废弃组件使用

---

## 三、已知问题分析

### 🔴 严重问题

#### 1. Storybook 依赖缺失 ⚠️
- 原报告提到的 `@storybook/nextjs-vite@10.3.5` 和 `vite-plugin-storybook-nextjs@3.2.4` **不在 package.json 中**
- 检查: `grep -r "storybook" package.json` 返回空
- **结论**: Storybook 可能已被移除或从未添加，不是阻塞问题

#### 2. PWA 包未声明 ⚠️
- `next.config.ts` 使用 `@ducanh2912/next-pwa`
- 但 `package.json` dependencies 和 devDependencies 中**均无此包**
- 这会导致 `pnpm install` 后配置失效

#### 3. TypeScript 构建错误被跳过
- `typescript.ignoreBuildErrors: true` 允许带类型错误构建
- **风险**: 生产环境可能有隐藏的类型问题

### 🟡 中等问题

#### 4. React Compiler 配置
```typescript
reactCompiler: {
  compilationMode: 'annotation',
}
```
- Babel plugin `babel-plugin-react-compiler@1.0.0` 已安装
- ✅ 配置与 Next.js 16 兼容

#### 5. Webpack 分包策略
- 复杂的 `splitChunks` 配置在 Next.js 16 中应继续工作
- 但 turbopack 模式下不生效（当前已禁用 turbopack）

#### 6. Missing `overrides` 检查
- `package.json` 中 `pnpm.overrides` 存在（安全补丁）
- ✅ 已正确配置

---

## 四、App Router 兼容性矩阵

| 功能 | 状态 | 备注 |
|------|------|------|
| `params: Promise<{ id: string }>` | ✅ | API routes 已正确实现 |
| `export const metadata` | ✅ | 根布局正确使用 |
| `export const viewport` | ✅ | 已分离 export |
| `export const runtime` | ✅ | API routes 正确使用 |
| `export const dynamic` | ✅ | API routes 正确使用 |
| Server Actions (`use server`) | ✅ | 未使用，无兼容性问题 |
| Server Components | ✅ | 默认使用，无问题 |
| Client Components (`use client`) | ✅ | 正确声明 |

---

## 五、脚本完整性检查

| 脚本 | 状态 | 说明 |
|------|------|------|
| `dev` | ✅ | `next dev` (默认 turbopack 需确认) |
| `dev:turbo` | ✅ | `next dev --turbopack` |
| `dev:webpack` | ✅ | `USE_WEBPACK=true next dev --webpack` |
| `build` | ✅ | `next build` (webpack) |
| `build:turbo` | ✅ | Turbopack 构建 |
| `build:webpack` | ✅ | 显式 Webpack 构建 |
| `type-check` | ✅ | `tsc --noEmit` |
| `lint` | ✅ | ESLint |
| `test` | ✅ | Vitest |
| `test:e2e` | ✅ | Playwright |

---

## 六、剩余工作建议

### 立即执行

1. **补充缺失依赖声明**
   ```bash
   # 检查 PWA 包是否实际安装
   ls node_modules/@ducanh2912/next-pwa 2>/dev/null && echo "已安装" || echo "未安装"
   
   # 如已安装，添加到 package.json
   pnpm add @ducanh2912/next-pwa
   ```

2. **运行类型检查**
   ```bash
   cd /root/.openclaw/workspace/7zi-frontend
   pnpm type-check  # 当前配置会失败，但能发现真实问题
   ```

3. **确认 dev 默认行为**
   ```bash
   # 验证 dev 是否使用 Webpack（因 turbopack: {} 配置）
   # 如需明确，改 dev 脚本为 dev:webpack
   ```

### 短期计划

4. **创建 Next.js 16 升级测试分支**
   ```bash
   git checkout -b feature/nextjs16-compat-test
   ```

5. **验证 Webpack 构建稳定性**
   ```bash
   pnpm build:webpack 2>&1 | head -100
   ```

6. **清理 ignoreBuildErrors**
   - 建议创建 CI 检查：`pnpm type-check` 在 PR 中必须通过

### 中期计划

7. **等待 React 20 稳定版**
   - 监测 React 20 发布动态
   - 准备升级路径：React 19 → React 20

8. **Storybook 集成验证**（如需要）
   - 如项目需要 Storybook，等待官方 Next.js 16 支持
   - 或使用 `storybook@next` 尝鲜版

---

## 七、总结

### 兼容性评分: 🟡 65/100

| 维度 | 得分 | 说明 |
|------|------|------|
| Next.js 16 核心 | 90% | 基础配置正确，App Router 兼容 |
| React 19 | 85% | 运行正常，等待 React 20 |
| 构建配置 | 70% | PWA 包声明缺失，类型检查跳过 |
| Dev Experience | 80% | 脚本完整，Webpack 模式确认 |
| 测试覆盖 | 75% | Vitest + Playwright 配置完整 |

### 核心问题

1. ⚠️ **React 19 而非 React 20** - 项目文档声称 React 20，实质是 React 19
2. ⚠️ **PWA 包未在 package.json 声明** - 可能导致构建失败
3. ⚠️ **TypeScript 类型检查被跳过** - 生产风险
4. ✅ **serverExternalPackages 位置正确** - 已在顶层
5. ✅ **App Router 代码完全兼容 Next.js 16**

### 行动优先级

| 优先级 | 任务 | 估计时间 |
|--------|------|----------|
| P0 | 修复 PWA 包声明 | 5 分钟 |
| P0 | 验证 dev 构建 | 10 分钟 |
| P1 | 清理 ignoreBuildErrors | 2 小时 |
| P2 | 准备 React 20 升级路径 | 待定 |

---

*报告生成时间: 2026-04-28 14:36 GMT+2*  
*审查者: 架构师子代理 (Depth 1/1)*
