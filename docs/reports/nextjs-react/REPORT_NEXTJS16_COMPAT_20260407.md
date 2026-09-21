# Next.js 16 / Turbopack 生产迁移兼容性报告
**报告日期**: 2026-04-07
**报告人**: Executor 子代理
**工作目录**: /root/.openclaw/workspace

---

## 📊 执行摘要

| 检查项 | 状态 | 当前值 | 目标值 |
|--------|------|--------|--------|
| Next.js 版本 | ✅ 已是最新 | 16.2.1 | 16.2.1 |
| React 版本 | ✅ 已是最新 | 19.2.4 | 19.x |
| Turbopack 构建 | ✅ 已配置 | 可用 | 已启用 |
| SWC 版本 | ✅ 内置 | 内置 | 最新 |

**结论**: 项目已运行在 Next.js 16.2.1，无需版本迁移。需关注的是 API 路由迁移到 Server Actions 的工作。

---

## 1. 当前版本分析

### 1.1 核心依赖版本

| 依赖 | 当前版本 | 推荐版本 | 状态 |
|------|----------|----------|------|
| `next` | ^16.2.1 | 16.2.1 | ✅ 最新 |
| `react` | ^19.2.4 | 19.x | ✅ 最新 |
| `react-dom` | ^19.2.4 | 19.x | ✅ 最新 |
| `next-intl` | ^4.8.3 | 4.x | ✅ 兼容 |
| `eslint-config-next` | ^16.2.1 | 16.2.1 | ✅ 匹配 |
| `@types/react` | ^19 | 19 | ✅ 匹配 |
| `@types/react-dom` | ^19 | 19 | ✅ 匹配 |

### 1.2 Turbopack 配置状态

**已配置脚本**:
```json
{
  "dev:turbo": "next dev --turbopack",
  "build:turbo": "NODE_ENV=production TURBOPAND=1 next build --turbopack",
  "build:analyze:turbo": "NODE_ENV=production ANALYZE=true TURBOPACK=1 next build --turbopack"
}
```

**状态**: ✅ Turbopack 已在开发构建中启用

### 1.3 SWC 版本

Next.js 16 内置 SWC，无需单独升级。Next.js 16.2.1 使用最新 SWC 优化编译。

---

## 2. 需要升级的依赖列表

### 2.1 生产依赖 (无需升级)

| 依赖 | 当前版本 | 建议 |
|------|----------|------|
| next | 16.2.1 | ✅ 已是最新 |
| react | 19.2.4 | ✅ 已是最新 |
| react-dom | 19.2.4 | ✅ 已是最新 |
| next-intl | 4.8.3 | ✅ 兼容 |
| zod | 4.3.6 | ✅ 兼容 |
| zustand | 5.0.12 | ✅ 兼容 |

### 2.2 开发依赖

| 依赖 | 当前版本 | 建议版本 | 说明 |
|------|----------|----------|------|
| @types/node | 25.5.0 | 22.x LTS | 建议使用 LTS 版本 |
| eslint | 9 | 9.x | ✅ 当前 |
| typescript | 5 | 5.x | ✅ 当前 |
| vitest | 4.1.2 | 3.x | 考虑升级到 v5 |

### 2.3 可选升级 (非阻塞)

| 依赖 | 当前 | 建议 | 原因 |
|------|------|------|------|
| @testing-library/react | 16.3.2 | 最新 | React 19 支持已完善 |
| @playwright/test | 1.58.2 | 1.60+ | 修复和功能增强 |

---

## 3. 迁移风险评估

### 3.1 版本兼容性风险: 🟢 低

- Next.js 16 + React 19 已是最新稳定组合
- next-intl 4.8.3 完全兼容 Next.js 16
- 所有核心依赖版本匹配

### 3.2 Turbopack 生产迁移风险: 🟡 中

**风险项**:
1. **第三方库兼容性**: 部分 npm 包可能未测试 Turbopack 兼容性
2. **Webpack 特定配置**: `next.config.ts` 中可能有 Webpack 特定插件
3. **边缘情况**: Turbopack 与 Webpack 在某些边界情况行为不同

**建议**:
- 开发环境先用 `dev:turbo` 充分测试
- 生产构建分阶段: 先 webpack → 验证 → turbo
- 保留 `build:webpack` 作为回滚选项

### 3.3 Server Actions 迁移风险: 🔴 高 (业务影响)

**风险项**:
1. **API 路由数量**: 10+ 个 API 路由需要重构
2. **客户端调用模式变更**: 需要大量修改 fetch 调用
3. **错误处理差异**: Server Actions 错误处理与 API Routes 不同

**建议**:
- 分阶段迁移，保留 API Routes 作为备份
- 每个迁移需要端到端测试验证

---

## 4. 建议的升级顺序

### Phase 0: 当前状态确认 (已完成) ✅
```
1. Next.js 16.2.1 - 已就绪
2. React 19.2.4 - 已就绪
3. Turbopack - 已配置
```

### Phase 1: Turbopack 生产验证 (建议 1-2 周)
```
1. 开发环境: dev:turbo 持续使用，收集问题
2. CI/CD: 添加 build:turbo 测试构建
3. 预生产: 部署 turbo 构建到预生产环境
4. 生产决策: 基于验证结果决定是否启用
```

### Phase 2: Server Actions 迁移 (建议 4-8 周)
```
优先级 P0 (核心功能):
  - /api/feedback → Server Action
  - /api/database/optimize → Server Action
  - /api/workflow → Server Action

优先级 P1 (重要功能):
  - /api/workflow/[id]/run
  - /api/workflow/[id]/executions

优先级 P2 (次要功能):
  - /api/multimodal/image

保留不做迁移:
  - /api/analytics/metrics (保留 API)
  - /api/stream/* (SSE 需要 API)
```

### Phase 3: 清理和优化 (持续)
```
1. 移除不再需要的 API Routes
2. 优化缓存策略
3. Route Groups 重构
```

---

## 5. 行动清单

### 立即执行
- [ ] 无需立即执行版本升级

### 本周内
- [ ] 启用 `dev:turbo` 日常开发
- [ ] 运行 `build:turbo` 验证构建
- [ ] 创建 API 路由到 Server Actions 迁移计划

### 本月内
- [ ] 完成 P0 优先级 Server Actions 迁移
- [ ] 完成 Turbopack 生产验证
- [ ] 编写迁移后端到端测试

---

## 6. 已知问题

### revalidateTag API 签名
研究文档提到 `revalidateTag(tag, cacheLife)` 但官方 API 是 `revalidateTag(tag)`。
**处理**: 使用标准签名，cacheLife 通过 fetch options 配置。

### 缺少 updateTag API
**处理**: 使用 `revalidateTag` + `revalidatePath` 组合。

---

## 附录: 完整依赖清单

```json
// 核心框架 - 无需升级
next: ^16.2.1 ✅
react: ^19.2.4 ✅
react-dom: ^19.2.4 ✅
eslint-config-next: ^16.2.1 ✅

// 国际化
next-intl: ^4.8.3 ✅

// 状态管理 & 验证
zustand: ^5.0.12 ✅
zod: ^4.3.6 ✅

// UI & 组件
recharts: ^3.8.0 ✅
lucide-react: ^1.7.0 ✅
@xyflow/react: ^12.10.2 ✅
three: ^0.183.2 ✅
@react-three/*: ^10.7.7 / ^9.5.0 ✅

// 工具库
sharp: ^0.34.5 ✅
socket.io-client: ^4.8.3 ✅
ioredis: ^5.10.1 ✅
better-sqlite3: ^12.8.0 ✅
bull: ^4.16.5 ✅

// 测试 & 类型
vitest: ^4.1.2 (建议升级到 v5)
@playwright/test: ^1.58.2
typescript: ^5 ✅
```

---

**报告结束**
