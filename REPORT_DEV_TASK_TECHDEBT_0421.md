# 开发任务技术债务审查报告

**日期**: 2026-04-21  
**审查范围**: src/ 未使用导入、tests/ 模拟完整性、.tasks 待处理任务  
**状态**: ✅ 完成

---

## 1. Phase 2 技术债务计划 — 已读取

文件 `REPORT_TECH_DEBT_PHASE2_PLAN.md` 已分析。关键发现：

| 批次 | 优先级 | 工时 | 状态 |
|------|--------|------|------|
| 第一批次 (nginx/磁盘/Next.js版本统一) | P0 | 4h | ⏳ 待执行 |
| 第二批次 (ignoreBuildErrors/配置修复/CSS) | P1 | 9-12h | ⏳ 待执行 |
| 第三批次 (巨型文件重构/通知系统统一) | P2 | 25-36h | 📋 计划中 |
| 第四批次 (nvmrc/Server Actions迁移) | P3 | 18.5-26.5h | 📋 计划中 |

**P0 核心问题**: 生产环境 7zi.com nginx 配置错误 + 磁盘94% + Next.js版本碎片化。

---

## 2. src/ 未使用导入 — ESLint 检查

ESLint 运行结果 (部分输出):

### ❌ Error 级别

- **`@ts-ignore` 滥用** — `src/app/actions/revalidate.ts` 中 4 处使用 `@ts-ignore`，应替换为 `@ts-expect-error`

### ⚠️ Warning 级别 (示例，未完整统计)

**未使用变量/导入** (大量存在):
- `src/app/[locale]/tasks/page.tsx`: `LoadingSpinner`, `SkeletonText`, `SkeletonCard`, `SkeletonTable` 定义但未使用
- `src/app/api/admin/rate-limit/rules/[id]/route.ts`: `createSuccessResponse` 未使用
- `src/app/api/admin/rate-limit/rules/route.ts`: `ApiResponse`, `ApiError`, `createSuccessResponse` 未使用
- `src/app/api/admin/rate-limit/statistics/route.ts`: `createSuccessResponse`, `generateTimeSeriesData` 未使用
- `src/app/api/admin/security/blacklist/route.ts`: `createSuccessResponse` 未使用
- `src/app/api/analytics/metrics/route.ts`: `endDate`, `endIndex`, `error` 未使用
- `src/app/api/auth/*`: 多处 `NextResponse`, `verifyJwtToken`, `authenticateToken`, `logAuditEvent` 等未使用
- `<img>` 标签而非 Next.js `<Image />` — `tasks/page.tsx:468`

**eslint-disable 注释**: 约 **21 处** eslint-disable/enable，散布在代码中。

### 建议

1. 创建 `eslint --fix` 自动修复脚本处理 `no-unused-vars`
2. 将 `@ts-ignore` 替换为 `@ts-expect-error` (已有 ESLint 规则强制)
3. 统计完整未使用导入数量 (需完整 ESLint 扫描，耗时较长)

---

## 3. tests/ 测试模拟检查

### Mock 架构

| 目录 | 框架 | 用途 |
|------|------|------|
| `tests/api-integration/mocks/` | MSW (msw/node) | API 路由集成测试 |
| `tests/setup/mocks/` | vi.fn() / jest.fn() | 单元测试 |
| `tests/lib/workflow/*.test.ts` | Vitest (vi.fn()) | 工作流引擎测试 |
| `tests/lib/plugins/webhook-plugin.test.ts` | Vitest | Webhook 插件测试 |

### Mock 覆盖情况

**✅ 有 Mock 的测试**:
- API 集成测试: MSW handlers + MockDataGenerator (msw/node) — 完整
- 工作流测试: vi.fn() 模拟 execute/listener — 完整
- Webhook 插件: vi.fn() 模拟 fetch 和 logger — 完整

**⚠️ 未发现明显缺失 Mock 的情况**:
- 测试文件中均有对应的 mock setup
- MSW handlers 覆盖了 auth, search, analytics, tasks, feedback, export 等端点

**潜在改进点**:
- 无全局 setupMocks 共享模块，部分测试可能有重复 mock 定义

---

## 4. .tasks 目录检查

**结论**: `.tasks/` 目录**不存在** (Markdown 文件)。

目录中仅发现 3 个 Shell 脚本:
```
cleanup.sh
doc-sync.sh
websocket-test.sh
```

这些是运维脚本，非待处理任务文件。

---

## 5. 汇总

| 检查项 | 结果 | 备注 |
|--------|------|------|
| Phase 2 计划 | ✅ 已读取 | P0 生产危机 3 项待执行 |
| ESLint 未使用导入 | ⚠️ 存在 | 大量 unused vars/@ts-ignore，需清理 |
| ESLint 完整扫描 | ⏸️ 未完成 | 全量扫描耗时>2min，超时中断 |
| 测试 Mock | ✅ 基本完整 | MSW + vi.fn() 覆盖充分 |
| .tasks 目录 | ❌ 无 Markdown 任务 | 只有运维 shell 脚本 |

---

**下一步建议**:
1. 优先执行 Phase 2 P0 第一批次 (nginx/磁盘/版本统一)
2. 创建 ESLint fix 脚本清理 unused imports
3. 将 `@ts-ignore` 全部替换为 `@ts-expect-error`
4. 确认 .tasks 任务文件的实际位置或创建规范
