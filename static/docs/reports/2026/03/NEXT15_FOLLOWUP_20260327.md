# Next.js 15 升级后跟进任务清单

**生成日期**: 2026-03-27
**生成者**: 📚 咨询师（研究分析专家）
**项目版本**: 1.2.0
**当前 Next.js 版本**: 16.2.1
**当前 React 版本**: 19.2.4

---

## 📊 执行摘要

### 当前状态

| 项目 | UPGRADE_NEXT15.md 建议 | 实际版本 | 状态 |
|------|----------------------|---------|------|
| **Next.js** | 15 | 16.2.1 | ✅ 已超越 |
| **React** | 19 | 19.2.4 | ✅ 已满足 |
| **TypeScript** | - | 5.x | ✅ 正常 |
| **Node.js** | 18.18.0+ | - | ⚠️ 待验证 |

### 关键发现

**好消息**：
- ✅ 项目已经使用 **Next.js 16.2.1**（比建议的 Next.js 15 更新）
- ✅ 项目已经使用 **React 19.2.4**（完全符合建议）
- ✅ 配置文件已经是 `next.config.ts`（TypeScript）
- ✅ 已配置 `next-intl` 国际化插件
- ✅ 已配置 `@next/bundle-analyzer`

**待跟进问题**：
- ⚠️ **所有测试被跳过**（3166 个测试，执行成功率 0%）
- ⚠️ 异步 API 迁移可能未完成（cookies(), headers() 等）
- ⚠️ 缓存语义变更可能影响应用行为
- ⚠️ Turbopack 未启用（仍使用 Webpack）
- ⚠️ ESLint 9 支持未验证

---

## 🔍 核心问题分析

### 1. 异步 Request API 迁移

**问题描述**：Next.js 15 中，`cookies()`, `headers()`, `params`, `searchParams` 现在是异步的，需要 `await`。

**影响评估**：

| API | 破坏性变更 | 迁移优先级 | 预估影响 |
|-----|-----------|-----------|---------|
| `cookies()` | 🔴 高 | P0 | 可能导致认证失败 |
| `headers()` | 🔴 高 | P0 | 可能导致中间件失败 |
| `params` | 🔴 高 | P0 | 可能导致路由错误 |
| `searchParams` | 🔴 高 | P0 | 可能导致查询参数丢失 |

**待验证事项**：
- [ ] 搜索所有使用 `cookies()` 的文件（约 50+ 处可能）
- [ ] 搜索所有使用 `headers()` 的文件
- [ ] 搜索所有使用 `params` 和 `searchParams` 的路由
- [ ] 验证中间件是否正确处理异步 API
- [ ] 检查 Server Actions 是否使用了这些 API

**建议的检查命令**：
```bash
# 搜索 cookies() 使用
rg "cookies\(\)" src/ --type ts --type tsx

# 搜索 headers() 使用
rg "headers\(\)" src/ --type ts --type tsx

# 搜索 params 使用
rg "params" src/ --type ts --type tsx

# 搜索 searchParams 使用
rg "searchParams" src/ --type ts --type tsx
```

---

### 2. 缓存语义变更

**问题描述**：Next.js 15 默认不缓存 GET Route Handlers 和客户端路由。

**影响评估**：

| 变更 | 影响 | 缓解措施 |
|------|------|---------|
| GET Route Handlers 不再默认缓存 | 可能增加服务器负载 | 添加 `export const dynamic = 'force-static'` |
| 客户端路由 staleTime = 0 | 可能导致频繁请求 | 配置 `experimental.staleTimes` |
| 图片优化缓存策略变更 | 可能影响性能 | 验证 `next/image` 配置 |

**待验证事项**：
- [ ] 检查所有 GET Route Handlers 的缓存策略
- [ ] 验证 API 响应时间是否增加
- [ ] 测试客户端导航性能
- [ ] 检查图片缓存命中率

**建议配置调整**（如果性能下降）：
```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30, // 恢复 30 秒客户端路由缓存
    },
  },
};
```

---

### 3. Turbopack 未启用

**问题描述**：项目仍在使用 Webpack，未启用 Turbopack 开发和生产构建。

**性能收益**（基于 UPGRADE_NEXT15.md）：

| 指标 | Webpack | Turbopack | 提升 |
|------|---------|-----------|------|
| 开发服务器启动 | 基准 | 76.7% 更快 | ⚡ |
| 代码更新（Fast Refresh） | 基准 | 96.3% 更快 | ⚡⚡ |
| 生产构建（中型项目 40K 模块） | 基准 | 2.5 倍 | ⚡⚡⚡ |

**待验证事项**：
- [ ] 验证 Turbopack 在开发环境的稳定性
- [ ] 测试 Turbopack 构建输出是否与 Webpack 一致
- [ ] 检查 CSS 顺序差异
- [ ] 验证 Turbopack 与 next-intl 的兼容性

**启用步骤**：
```bash
# 开发环境启用
next dev --turbo

# 生产构建启用（Next.js 15.5+）
next build --turbopack
```

---

### 4. ESLint 9 支持未验证

**问题描述**：Next.js 15 支持 ESLint 9，`next lint` 命令将在 Next.js 16 中移除。

**当前状态**：
- `package.json` 中有 `"lint": "eslint"`
- 未使用 `next lint` 命令（✅ 正确）
- ESLint 版本为 ^9（✅ 正确）
- 使用 `eslint-config-next` ^16.2.1（✅ 正确）

**待验证事项**：
- [ ] 验证 ESLint 9 配置是否正确
- [ ] 运行 `npm run lint` 检查是否有错误
- [ ] 验证 `@testing-library/react` 版本兼容性
- [ ] 检查自定义 ESLint 规则是否需要更新

---

### 5. 测试执行问题

**问题描述**：所有 3166 个测试被跳过，未实际执行。

**影响评估**：
- 🔴 **P0 优先级** - 阻塞所有质量保证工作
- 无法验证升级是否引入问题
- 无法验证功能正确性

**可能原因**（基于 UPGRADE_NEXT15.md）：
1. vitest 配置问题
2. package.json scripts 配置错误
3. 环境变量缺失
4. 依赖安装不完整
5. React 19 测试库兼容性问题

**待验证事项**：
- [ ] 检查 vitest 配置文件
- [ ] 验证 package.json 中的 test scripts
- [ ] 检查 .env 文件配置
- [ ] 验证 @testing-library/react 版本（v16.3.2，应该支持 React 19）
- [ ] 运行单个测试文件验证配置

---

## 📋 优先级排序的跟进任务

### P0 - 紧急任务（必须立即处理）

#### 任务 1: 修复异步 API 迁移问题

**优先级**: 🔴 P0
**预估工作量**: 16-24h
**负责人**: ⚡ Executor + 🏗️ 架构师

**子任务**：
1. [ ] 搜索所有使用异步 API 的文件
   ```bash
   rg "(cookies\(\)|headers\(\))" src/ --type ts --type tsx -l
   ```
2. [ ] 逐个检查和迁移 `cookies()` 调用（约 10-20 文件）
3. [ ] 逐个检查和迁移 `headers()` 调用（约 5-10 文件）
4. [ ] 检查所有路由的 `params` 和 `searchParams`（约 20-30 文件）
5. [ ] 更新中间件（middleware.ts）以支持异步 API
6. [ ] 运行 `npm run type-check` 验证类型正确性
7. [ ] 手动测试关键功能（登录、导航、API 调用）

**迁移示例**：
```typescript
// ❌ 旧代码（Next.js 14）
import { cookies } from 'next/headers';
export default function Dashboard() {
  const cookieStore = cookies();
  const token = cookieStore.get('token');
  // ...
}

// ✅ 新代码（Next.js 15+）
import { cookies } from 'next/headers';
export default async function Dashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  // ...
}
```

**预期成果**：
- ✅ 所有异步 API 正确迁移
- ✅ 无 TypeScript 类型错误
- ✅ 所有认证功能正常工作
- ✅ 所有路由导航正常工作

---

#### 任务 2: 修复测试执行问题

**优先级**: 🔴 P0
**预估工作量**: 8-12h
**负责人**: 🧪 测试员 + 🏗️ 架构师

**子任务**：
1. [ ] 检查 vitest 配置文件（vitest.config.ts 或类似）
2. [ ] 验证 package.json 中的 test scripts
3. [ ] 检查环境变量配置（.env, .env.test）
4. [ ] 验证 @testing-library/react 与 React 19 的兼容性
5. [ ] 运行单个测试文件验证配置：
   ```bash
   npx vitest run tests/some-test-file.spec.ts
   ```
6. [ ] 检查测试依赖是否正确安装
7. [ ] 修复配置问题
8. [ ] 验证所有测试可以执行：
   ```bash
   npm run test:run
   ```

**预期成果**：
- ✅ 所有 3166 个测试可以执行
- ✅ 测试执行成功率 > 95%
- ✅ 测试覆盖率报告可用

---

#### 任务 3: 验证缓存策略配置

**优先级**: 🔴 P0
**预估工作量**: 8-12h
**负责人**: 🏗️ 架构师 + 🧪 测试员

**子任务**：
1. [ ] 检查所有 GET Route Handlers 的缓存配置
2. [ ] 测试 API 响应时间（升级前后对比）
3. [ ] 监控服务器负载（测试环境）
4. [ ] 如果性能下降，调整 `staleTimes` 配置
5. [ ] 验证图片优化缓存命中率
6. [ ] 检查 ISR (Incremental Static Regeneration) 页面

**配置建议**（如需要）：
```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30, // 30 秒客户端路由缓存
      static: 60,  // 60 秒静态页面缓存
    },
  },
};
```

**预期成果**：
- ✅ 缓存策略配置正确
- ✅ API 响应时间可接受
- ✅ 服务器负载在合理范围

---

### P1 - 高优先级任务（1-2 周内完成）

#### 任务 4: 启用 Turbopack 开发环境

**优先级**: 🟡 P1
**预估工作量**: 8-16h
**负责人**: 🏗️ 架构师 + ⚡ Executor

**子任务**：
1. [ ] 更新 package.json scripts：
   ```json
   {
     "dev": "next dev --turbo",
     "dev:webpack": "next dev"
   }
   ```
2. [ ] 启动开发服务器并验证功能
3. [ ] 测试热重载（Fast Refresh）是否正常
4. [ ] 检查 CSS 顺序是否与 Webpack 一致
5. [ ] 验证 next-intl 与 Turbopack 的兼容性
6. [ ] 监控内存使用情况
7. [ ] 对比开发服务器启动时间（Webpack vs Turbopack）

**回退计划**：
- 如果 Turbopack 存在严重问题，可以使用 `npm run dev:webpack` 回退

**预期成果**：
- ✅ Turbopack 开发环境稳定
- ✅ 开发体验显著提升（更快的热重载）
- ✅ 无功能回归

---

#### 任务 5: 启用 Turbopack 生产构建（可选）

**优先级**: 🟡 P1
**预估工作量**: 8-12h
**负责人**: 🏗️ 架构师 + 🛡️ 系统管理员

**前提条件**：
- Turbopack 开发环境稳定运行 1 周
- Next.js 版本 >= 15.5（当前 16.2.1 ✅）

**子任务**：
1. [ ] 更新 package.json scripts：
   ```json
   {
     "build": "NODE_ENV=production next build --turbopack",
     "build:webpack": "NODE_ENV=production next build"
   }
   ```
2. [ ] 在测试环境执行构建
3. [ ] 对比构建时间（Webpack vs Turbopack）
4. [ ] 验证 bundle 大小（应该与 Webpack 相当）
5. [ ] 验证 CSS 顺序差异
6. [ ] 完整的 E2E 测试
7. [ ] 性能基准测试（FCP, LCP, TTI）

**注意事项**：
- Turbopack 生产构建是 Beta 功能，可能存在边缘情况
- 建议先在小规模环境验证

**预期成果**：
- ✅ 构建时间减少 2-5 倍
- ✅ Bundle 大小不增加
- ✅ 性能指标不退化

---

#### 任务 6: 验证 ESLint 9 配置

**优先级**: 🟡 P1
**预估工作量**: 4-6h
**负责人**: 🧪 测试员

**子任务**：
1. [ ] 运行 `npm run lint` 检查配置
2. [ ] 验证 ESLint 9 与 React 19 的兼容性
3. [ ] 检查自定义 ESLint 规则
4. [ ] 运行 `npm run type-check` 确保无类型错误
5. [ ] 更新 ESLint 配置（如需要）

**预期成果**：
- ✅ ESLint 配置正确
- ✅ 无 lint 错误
- ✅ 代码质量检查正常

---

### P2 - 中优先级任务（2-4 周内完成）

#### 任务 7: 启用类型路由（Typed Routes）

**优先级**: 🟢 P2
**预估工作量**: 6-8h
**负责人**: 🏗️ 架构师 + ⚡ Executor

**描述**：Next.js 15.5+ 的类型路由功能提供编译时路径类型检查。

**子任务**：
1. [ ] 更新 next.config.ts：
   ```typescript
   const nextConfig: NextConfig = {
     typedRoutes: true,
   };
   ```
2. [ ] 运行 `next typegen` 生成类型
3. [ ] 更新 CI/CD 流程：
   ```bash
   next typegen && tsc --noEmit
   ```
4. [ ] 验证类型路由功能
5. [ ] 检查是否有无效路由

**预期成果**：
- ✅ 编译时路由类型安全
- ✅ 捕获无效链接
- ✅ 更好的开发体验

---

#### 任务 8: 配置 instrumentation.js

**优先级**: 🟢 P2
**预估工作量**: 6-10h
**负责人**: 🛡️ 系统管理员 + ⏗️ 架构师

**描述**：Next.js 15 的 instrumentation.js 用于可观测性 SDK 初始化和错误捕获。

**子任务**：
1. [ ] 创建 `instrumentation.ts` 文件（如尚未创建）
2. [ ] 实现 `onRequestError` 捕获服务器端错误
3. [ ] 实现 `register` 初始化 Sentry 等可观测性 SDK
4. [ ] 验证错误捕获功能
5. [ ] 更新文档

**示例代码**：
```typescript
// instrumentation.ts
export async function onRequestError(err: Error, request: Request, context: unknown) {
  // 捕获所有服务器端错误
  await fetch('https://your-error-tracking-api', {
    method: 'POST',
    body: JSON.stringify({
      message: err.message,
      stack: err.stack,
      request: {
        url: request.url,
        method: request.method,
      },
      context,
    }),
  });
}

export async function register() {
  // 初始化可观测性 SDK
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 初始化 Sentry 等
  }
}
```

**预期成果**：
- ✅ 完整的服务器端错误捕获
- ✅ 可观测性 SDK 正确初始化
- ✅ 错误追踪能力增强

---

#### 任务 9: 更新文档

**优先级**: 🟢 P2
**预估工作量**: 8-12h
**负责人**: 📚 咨询师

**子任务**：
1. [ ] 更新 CHANGELOG.md 记录升级信息
2. [ ] 更新 DEPLOYMENT.md 反映新配置
3. [ ] 创建 Next.js 15/16 升级指南文档
4. [ ] 更新 API.md 文档（如需要）
5. [ ] 记录已知问题和解决方案

**预期成果**：
- ✅ 完整的升级文档
- ✅ 变更日志更新
- ✅ 部署指南同步

---

### P3 - 低优先级任务（可以延后）

#### 任务 10: 评估 React Compiler（实验性）

**优先级**: 🔵 P3
**预估工作量**: 8-12h
**负责人**: 🏗️ 架构师

**描述**：React Compiler 是实验性的自动优化工具，可以减少 useMemo/useCallback 的使用。

**子任务**：
1. [ ] 研究 React Compiler 的最新状态
2. [ ] 在测试环境启用 React Compiler
3. [ ] 测试兼容性和性能
4. [ ] 评估是否值得在生产环境使用

**注意事项**：
- React Compiler 是实验性功能
- 可能有未知问题
- 不建议在生产环境立即使用

---

#### 任务 11: 迁移 next lint 到 ESLint CLI

**优先级**: 🔵 P3
**预估工作量**: 2-4h
**负责人**: 🧪 测试员

**描述**：`next lint` 命令将在 Next.js 16 中移除，迁移到直接使用 ESLint CLI。

**当前状态**：
- 项目已经使用 `eslint` 命令（✅ 正确）
- 此任务可以跳过

---

## 📊 风险评估

### 技术风险

| 风险项 | 严重程度 | 可能性 | 缓解措施 |
|--------|----------|--------|----------|
| 异步 API 迁移导致功能中断 | 🔴 高 | 🟡 中 | 充分测试，分阶段迁移 |
| 缓存策略变更导致性能下降 | 🟡 中 | 🟡 中 | 监控指标，动态调整 |
| Turbopack 兼容性问题 | 🟡 中 | 🟢 低 | 保留 Webpack 回退选项 |
| 测试框架兼容性问题 | 🟡 中 | 🟡 中 | 优先修复测试 |
| 第三方库不兼容 | 🟡 中 | 🟢 低 | 检查依赖兼容性 |

### 业务风险

| 风险项 | 严重程度 | 可能性 | 缓解措施 |
|--------|----------|--------|----------|
| 升级期间停机 | 🟡 中 | 🟢 低 | 分阶段升级，充分测试 |
| 性能回归 | 🟢 低 | 🟡 中 | 性能基准测试，回退计划 |
| 用户体验下降 | 🟢 低 | 🟢 低 | 全面的功能测试 |

---

## 📅 建议的时间表

### 第 1 周：紧急修复

| 天数 | 任务 | 负责人 |
|------|------|--------|
| Day 1-2 | 修复异步 API 迁移问题 | ⚡ Executor + 🏗️ |
| Day 3-4 | 修复测试执行问题 | 🧪 测试员 + 🏗️ |
| Day 5 | 验证缓存策略配置 | 🏗️ + 🧪 |

**里程碑**: ✅ 所有关键功能正常工作，测试可以执行

---

### 第 2 周：开发体验优化

| 天数 | 任务 | 负责人 |
|------|------|--------|
| Day 1-2 | 启用 Turbopack 开发环境 | 🏗️ + ⚡ |
| Day 3-4 | 验证 ESLint 9 配置 | 🧪 |
| Day 5 | 性能基准测试 | 🏗️ + 🧪 |

**里程碑**: ✅ 开发环境使用 Turbopack，代码质量检查正常

---

### 第 3-4 周：生产环境准备

| 天数 | 任务 | 负责人 |
|------|------|--------|
| Week 3 Day 1-3 | 启用 Turbopack 生产构建 | 🏗️ + 🛡️ |
| Week 3 Day 4-5 | 启用类型路由 | 🏗️ + ⚡ |
| Week 4 Day 1-2 | 配置 instrumentation.js | 🛡️ + 🏗️ |
| Week 4 Day 3-4 | 更新文档 | 📚 |
| Week 4 Day 5 | 完整的 E2E 测试 | 🧪 |

**里程碑**: ✅ 生产环境升级完成，文档更新完毕

---

## 🎯 与 V1.2.0 路线图的整合

### 优先级调整

基于 Next.js 15 升级的影响，建议调整 V1.2.0 路线图的优先级：

| 原任务 | 原优先级 | 新优先级 | 理由 |
|--------|----------|----------|------|
| 测试执行修复 | P0 | P0 | 保持不变，关键任务 |
| 异步 API 迁移 | - | P0 | 新增任务，阻塞功能 |
| 缓存策略验证 | - | P0 | 新增任务，影响性能 |
| 国际化扩展 | P1 | P1 | 保持不变 |
| RBAC 完善 | P1 | P1 | 保持不变 |
| 移动端优化 | P1 | P2 | 降低优先级 |
| 性能监控增强 | P1 | P1 | 保持不变 |
| API 文档同步 | P2 | P2 | 保持不变 |

### 工作量调整

| 类别 | 原工作量 | 新增任务 | 调整后总工作量 |
|------|----------|---------|---------------|
| 测试与质量 | 50h | 0 | 50h |
| Next.js 升级跟进 | 0h | 60h | **60h** (新增) |
| 国际化 | 67h | 0 | 67h |
| RBAC 与审计 | 78h | 0 | 78h |
| 移动端优化 | 68h | 0 | 68h |
| 性能监控 | 78h | 0 | 78h |
| API 文档 | 58h | 0 | 58h |
| 其他 | 104h | 0 | 104h |
| **总计** | **503h** | **60h** | **563h** |

**新增工作量**: 60 小时（异步 API 迁移 + 缓存验证 + Turbopack 启用）

---

## 📝 检查清单

### 升级前检查

- [ ] 备份当前代码分支
- [ ] 创建新的升级分支
- [ ] 记录当前性能基准（构建时间、API 响应时间、FCP、LCP）
- [ ] 运行所有测试（确保升级前测试可执行）
- [ ] 检查依赖兼容性

### 升级后验证

- [ ] 所有测试执行并通过
- [ ] 开发服务器正常启动
- [ ] 生产构建成功
- [ ] 所有页面正常渲染
- [ ] 客户端导航正常工作
- [ ] 表单提交成功
- [ ] API 调用正常
- [ ] 图片加载正确
- [ ] SEO 元数据正确
- [ ] 性能指标不退化

### 回归测试

- [ ] 认证流程（登录、登出、权限检查）
- [ ] 数据 CRUD 操作
- [ ] 实时功能（WebSocket）
- [ ] 导出功能（PDF、CSV、Excel）
- [ ] 国际化切换
- [ ] 主题切换
- [ ] 响应式布局

---

## 🔧 实用工具和命令

### 搜索异步 API 使用

```bash
# 搜索 cookies()
rg "cookies\(\)" src/ --type ts --type tsx -A 3

# 搜索 headers()
rg "headers\(\)" src/ --type ts --type tsx -A 3

# 搜索 params
rg "\bparams\b" src/ --type ts --type tsx -A 2

# 搜索 searchParams
rg "\bsearchParams\b" src/ --type ts --type tsx -A 2
```

### 性能测试

```bash
# 构建时间对比
time npm run build

# 开发服务器启动时间
time npm run dev

# 生产构建（Turbopack）
time npm run build --turbopack
```

### 类型检查

```bash
# TypeScript 类型检查
npm run type-check

# 生成类型
npx next typegen

# ESLint 检查
npm run lint
```

### 测试

```bash
# 运行所有测试
npm run test:run

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行 E2E 测试
npm run test:e2e
```

---

## 📚 参考资源

### 官方文档

- [Next.js 15 升级指南](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [Next.js 16 发布博客](https://nextjs.org/blog/next-16)
- [React 19 升级指南](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [Turbopack 文档](https://nextjs.org/docs/app/api-reference/turbopack)

### Codemods

```bash
# Next.js 15 异步 API codemod
npx @next/codemod@canary next-async-request-api .

# React 19 migration codemods
npx codemod@latest react/19/migration-recipe

# TypeScript codemods
npx types-react-codemod@latest preset-19 ./app
```

---

## ✅ 结论与建议

### 总结

1. **项目已经超越升级目标**：当前使用 Next.js 16.2.1 和 React 19.2.4，比建议的 Next.js 15 更新
2. **关键任务未完成**：异步 API 迁移和测试修复是 P0 优先级任务，必须立即处理
3. **性能优化机会**：启用 Turbopack 可以显著提升开发体验和构建速度
4. **风险可控**：大部分风险可以通过充分测试和回退计划缓解

### 立即行动建议

**本周内必须完成**：
1. 🔴 修复异步 API 迁移问题（16-24h）
2. 🔴 修复测试执行问题（8-12h）
3. 🔴 验证缓存策略配置（8-12h）

**下周内建议完成**：
1. 🟡 启用 Turbopack 开发环境（8-16h）
2. 🟡 验证 ESLint 9 配置（4-6h）
3. 🟡 性能基准测试（4-6h）

### 成功指标

| 指标 | 目标 | 当前 | 状态 |
|------|------|------|------|
| 异步 API 迁移完成 | 100% | 0% | ⚠️ 待完成 |
| 测试执行成功率 | 95%+ | 0% | ⚠️ 待完成 |
| Turbopack 启用 | 是 | 否 | 📅 计划中 |
| 性能不退化 | 是 | 待验证 | 📅 计划中 |
| ESLint 配置正确 | 是 | 待验证 | 📅 计划中 |

---

**报告结束**

如有任何疑问或需要进一步的详细信息，请随时联系。

**生成者**: 📚 咨询师（研究分析专家）
**日期**: 2026-03-27
