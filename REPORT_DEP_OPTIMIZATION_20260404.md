# 依赖健康检查与优化报告

**生成日期**: 2026-04-04  
**项目**: 7zi-frontend  
**版本**: 1.10.1  
**检查工具**: npm audit, npm outdated

---

## 📊 执行摘要

| 指标 | 数值 |
|------|------|
| 总依赖数 | 1,229 |
| 生产依赖 | 631 |
| 开发依赖 | 528 |
| 安全漏洞 | **1 (高危)** |
| 过时依赖 | **13** |
| 未使用依赖 | **1** |

---

## 🚨 安全漏洞

### 高危漏洞 (1个)

| 包名 | 版本 | 漏洞 | 严重性 | CVSS | 状态 |
|------|------|------|--------|------|------|
| **xlsx** | 0.18.5 | Prototype Pollution (GHSA-4r6h-8v6p-xvw6) | 高危 | 7.8 | ❌ 无可用修复 |
| | | ReDoS (GHSA-5pgg-2g8v-p4x9) | 高危 | 7.5 | ❌ 无可用修复 |

**详情**: 
- `xlsx` 包存在原型污染和正则表达式拒绝服务漏洞
- 受影响范围: `*` (所有版本)
- **建议**: 
  - 方案1: 升级到 `xlsx-js-style` 或 `exceljs` (替代方案)
  - 方案2: 限制使用场景，确保不处理不受信任的文件
  - 当前使用位置: `src/lib/export/xlsx-wrapper.ts`

---

## ⚠️ 过时依赖

### 需要更新 (13个)

| 包名 | 当前版本 | 最新版本 | 类型 | 优先级 |
|------|----------|----------|------|--------|
| **eslint** | 9.39.4 | 10.2.0 | dev | ⚠️ 主版本更新 |
| **typescript** | 5.9.3 | 6.0.2 | dev | ⚠️ 主版本更新 |
| **next** | 16.2.1 | 16.2.2 | prod | 🔸 次版本更新 |
| **@playwright/test** | 1.58.2 | 1.59.1 | dev | 🔸 次版本更新 |
| **@sentry/nextjs** | 10.46.0 | 10.47.0 | prod | 🔸 补丁更新 |
| **next-intl** | 4.8.3 | 4.9.0 | prod | 🔸 次版本更新 |
| **@modelcontextprotocol/sdk** | 1.28.0 | 1.29.0 | prod | 🔸 补丁更新 |
| **@next/bundle-analyzer** | 16.2.1 | 16.2.2 | dev | 🔸 补丁更新 |
| **@types/node** | 25.5.0 | 25.5.2 | dev | 🔸 补丁更新 |
| **eslint-config-next** | 16.2.1 | 16.2.2 | dev | 🔸 补丁更新 |
| **eslint-plugin-storybook** | 10.3.3 | 10.3.4 | dev | 🔸 补丁更新 |
| **fuse.js** | 7.1.0 | 7.2.0 | prod | 🔸 补丁更新 |
| **@types/commander** | 2.12.5 | 2.12.0 | dev | 🔽 降级可用 |

---

## 🔍 依赖使用分析

### ✅ 已确认使用的依赖 (30/31)

| 包名 | 使用位置 | 状态 |
|------|----------|------|
| @jest/globals | 测试文件 | ✅ 使用中 |
| @modelcontextprotocol/sdk | src/lib/mcp/server.ts | ✅ 使用中 |
| @react-three/drei | KnowledgeLatticeScene.tsx | ✅ 使用中 |
| @react-three/fiber | KnowledgeLatticeScene.tsx | ✅ 使用中 |
| @sentry/nextjs | src/lib/sentry.ts 等 | ✅ 使用中 |
| @xyflow/react | CollaborationGraph.tsx | ✅ 使用中 |
| better-sqlite3 | 数据库相关文件 | ✅ 使用中 |
| commander | src/tools/agent-cli.ts | ✅ 使用中 |
| fuse.js | 搜索相关文件 | ✅ 使用中 |
| glob | react-compiler/diagnostics | ✅ 使用中 |
| ioredis | Redis 客户端相关 | ✅ 使用中 |
| isomorphic-dompurify | 输入清理 | ✅ 使用中 |
| jose | JWT 认证 | ✅ 使用中 |
| lru-cache | workflow/executor-optimized.ts | ✅ 使用中 |
| lucide-react | 多个 UI 组件 | ✅ 使用中 |
| next | 框架核心 | ✅ 使用中 |
| next-intl | 国际化 | ✅ 使用中 |
| react | 框架核心 | ✅ 使用中 |
| react-dom | 框架核心 | ✅ 使用中 |
| react-is | React 工具 | ✅ 使用中 |
| recharts | 图表组件 | ✅ 使用中 |
| sharp | image-utils.ts | ✅ 使用中 |
| socket.io-client | WebSocket 相关 | ✅ 使用中 |
| tailwind-merge | UI 组件 | ✅ 使用中 |
| three | KnowledgeLatticeScene.tsx | ✅ 使用中 |
| uuid | 多个文件 | ✅ 使用中 |
| xlsx | xlsx-wrapper.ts | ⚠️ 有漏洞 |
| zod | 类型验证 | ✅ 使用中 |
| zustand | 状态管理 | ✅ 使用中 |

### ❌ 可能未使用的依赖 (1个)

| 包名 | 说明 | 建议 |
|------|------|------|
| **web-vitals** | 未在源代码中找到导入语句 | 🗑️ 建议移除或确认使用场景 |

**注意**: `web-vitals` 可能通过以下方式使用：
- Next.js 内置性能监控
- 构建时注入
- 配置文件中引用

**验证命令**:
```bash
# 检查是否在配置文件中使用
grep -r "web-vitals" . --include="*.json" --include="*.js" --include="*.ts" --exclude-dir=node_modules
```

---

## 📝 优化建议

### 🔴 高优先级 (安全相关)

1. **处理 xlsx 漏洞**
   ```bash
   # 选项1: 使用替代库 (推荐)
   npm uninstall xlsx
   npm install exceljs
   
   # 选项2: 如果必须使用，添加安全限制
   # 在 xlsx-wrapper.ts 中添加文件大小和内容验证
   ```

### 🟡 中优先级 (更新建议)

2. **更新主版本依赖**
   ```bash
   # ESLint 10.x (需要检查兼容性)
   npm install eslint@latest --save-dev
   
   # TypeScript 6.x (需要检查兼容性)
   npm install typescript@latest --save-dev
   ```

3. **批量更新补丁版本**
   ```bash
   # 更新所有安全的小版本更新
   npm update next @sentry/nextjs next-intl
   npm update @playwright/test @types/node --save-dev
   ```

### 🟢 低优先级 (清理建议)

4. **验证并移除未使用依赖**
   ```bash
   # 如果确认不需要 web-vitals
   npm uninstall web-vitals
   ```

5. **清理重复类型定义**
   - `@types/commander` 的最新版本 (2.12.0) 比当前版本 (2.12.5) 旧
   - 这表明包已内置类型，可以考虑移除 `@types/commander`

---

## 📈 更新命令汇总

### 安全更新 (建议立即执行)
```bash
# 查看可更新的包
npm outdated

# 更新所有安全的小版本更新
npm update

# 处理 xlsx 漏洞 (选择方案后执行)
# 方案1: 替换为 exceljs
# 方案2: 保留但添加输入验证
```

### 完整更新 (需要测试)
```bash
# 更新所有过时的依赖
npm install next@latest @sentry/nextjs@latest next-intl@latest \
  @modelcontextprotocol/sdk@latest fuse.js@latest

npm install @playwright/test@latest @next/bundle-analyzer@latest \
  @types/node@latest eslint-config-next@latest \
  eslint-plugin-storybook@latest --save-dev

# 主版本更新 (需要仔细测试)
npm install eslint@latest typescript@latest --save-dev
```

---

## 🎯 后续行动项

- [ ] **立即**: 评估 xlsx 替代方案或添加安全限制
- [ ] **本周**: 运行 `npm update` 更新安全的小版本
- [ ] **计划中**: 测试 ESLint 10.x 和 TypeScript 6.x 兼容性
- [ ] **可选**: 确认 web-vitals 使用场景后决定是否移除
- [ ] **可选**: 考虑移除 `@types/commander` (已内置类型)

---

## 📌 注意事项

1. **主版本更新风险**: ESLint 10.x 和 TypeScript 6.x 是主版本更新，可能包含破坏性变更，建议在测试分支先行验证。

2. **xlsx 漏洞**: 当前没有可用修复版本，建议限制其使用场景，只处理受信任的文件。

3. **依赖树深度**: 项目有 1,229 个依赖，建议定期清理未使用的依赖以减少安全攻击面。

4. **建议频率**: 每月运行一次依赖健康检查，每季度进行一次深度清理。

---

**报告生成者**: Executor (AI 子代理)  
**检查范围**: package.json 定义的依赖  
**方法**: 静态分析 + npm audit + npm outdated
