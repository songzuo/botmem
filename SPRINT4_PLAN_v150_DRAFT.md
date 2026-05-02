# v1.5.0 Sprint 4 技术债务清理与优化规划草案

**创建日期**: 2026-03-31
**创建人**: 📚 咨询师
**目标版本**: v1.6.0
**规划周期**: Sprint 4 (预计 2 周)

---

## 📊 现状评估

### ✅ 已完成技术债务 (v1.5.0)

| 项目 | 完成度 | 验证状态 |
|------|--------|---------|
| lib/ 目录结构合并 | 100% | ✅ 验证通过 |
| PermissionContext → Zustand 迁移 | 100% | ✅ 测试通过 |
| 循环依赖检测集成 | 100% | ✅ 0 个循环依赖 |

### 📈 项目健康度指标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| TypeScript 编译 | ✅ 通过 | 维持 |
| 循环依赖数 | 0 | 0 |
| 测试文件数 | 386 | - |
| 源码行数 (lib/) | ~108K | - |
| 构建时间 | 1m46s | <1m30s |
| 测试通过率 | ~89% | >95% |

---

## 🗑️ 遗留技术债务清理清单

### 1. 归档目录清理 (P1)

#### 1.1 archive/ 目录 - 147MB

```
/archive/
├── 7zi-project-new-backup-2026-03-25/  # ~130MB - 可删除
├── db-optimization-patches/             # 已迁移到 src/lib/
├── reports-v1.0.8/                      # 历史报告
├── reports-v1.0.9/                      # 历史报告
├── reports-v1.1.0-planning/             # 历史报告
└── miscellaneous/                       # 杂项
```

**建议操作**:
- [ ] 删除 `7zi-project-new-backup-2026-03-25/` (已在 git 历史)
- [ ] 整理 `reports-*` 目录到 `docs/archive/`
- [ ] 删除重复的 `db-optimization-patches/`

**预估空间释放**: ~130MB

#### 1.2 src/lib/backup/ 目录 - 128KB

```
/src/lib/backup/
├── backup-core.ts        # 核心备份功能
├── compression.ts        # 压缩工具
├── data-export.ts        # 数据导出
├── encryption.ts         # 加密工具
├── manager.ts           # 备份管理器
└── __tests__/           # 测试文件
```

**建议**: 保留，功能正常使用

### 2. `-optimized` 文件清理 (P2)

#### 源码中的优化版本文件

| 文件 | 位置 | 建议 |
|------|------|------|
| `repository-optimized-v2.ts` | `src/lib/agents/agent/` | 检查是否可合并 |
| `wallet-repository-optimized-v2.ts` | `src/lib/agents/agent/` | 检查是否可合并 |
| `repository-optimized.ts` | `src/lib/auth/` | 检查是否可合并 |

#### 根目录优化文件

| 文件 | 建议 |
|------|------|
| `Dockerfile.production-optimized` | 考虑重命名为主文件 |
| `nginx-optimized.conf` | 考虑重命名为主配置 |

**建议操作**:
- [ ] 对比 `-optimized` 文件与原文件
- [ ] 合并有用的优化
- [ ] 删除冗余文件

**预估工作量**: 4 小时

### 3. 文档整理 (P3)

#### docs/ 目录 - 147 个文件

**冗余文档识别**:

| 文件 | 问题 | 建议 |
|------|------|------|
| `RESPONSIVE_OPTIMIZATION_REPORT_DRAFT.md` | 有正式版 | 删除 |
| `API-DOCUMENTATION-REVIEW.md` + `API-DOCS-REVIEW-SUMMARY.txt` | 内容重复 | 合并 |
| `DEPLOYMENT-GUIDE.md` + `DEPLOYMENT.md` + `deployment.md` | 多版本 | 合并 |
| `PERFORMANCE.md` + `PERFORMANCE_OPTIMIZATION.md` | 重复 | 合并 |
| `TECH-DEBT.md` + `TECH_DEBT.md` + `tech-debt-assessment.md` | 多版本 | 整理 |

**建议操作**:
- [ ] 创建文档去重清单
- [ ] 合并重复内容
- [ ] 更新文档索引

**预估工作量**: 8 小时

---

## 🚀 v1.6.0 优化方向

### 1. 性能优化

#### 1.1 Bundle Size 优化 (P0)

**当前状态**:
- `node_modules/`: 2.9GB
- `.next/`: 149MB

**优化方向**:

| 措施 | 预估收益 | 工作量 |
|------|---------|--------|
| Tree-shaking 优化 | -5~10% bundle | 4h |
| 动态导入优化 | -15% 初始加载 | 8h |
| 图片优化 (WebP/AVIF) | -30% 图片大小 | 4h |
| 字体子集化 | -50% 字体大小 | 2h |

**目标**: 初始 bundle < 200KB gzip

#### 1.2 渲染性能优化 (P1)

| 措施 | 预估收益 | 工作量 |
|------|---------|--------|
| React Compiler 深度集成 | +20% 渲染性能 | 16h |
| 虚拟列表优化 | +50% 长列表性能 | 8h |
| Web Worker 迁移 | UI 线程释放 | 16h |

#### 1.3 构建性能优化 (P1)

**当前**: 1m46s

| 措施 | 预估收益 | 工作量 |
|------|---------|--------|
| Turbopack 生产就绪 | -30% 构建时间 | 8h |
| 缓存策略优化 | -20% 二次构建 | 4h |
| 并行类型检查 | -15% 类型检查 | 2h |

**目标**: < 1m30s

### 2. 代码质量改进

#### 2.1 TypeScript 严格模式增强 (P0)

**当前配置**:
```json
{
  "strict": true,
  "noEmit": true
}
```

**建议增加**:
```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noPropertyAccessFromIndexSignature": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

**预估工作量**: 16 小时
**预估修复**: ~50-100 处类型问题

#### 2.2 测试覆盖率提升 (P1)

**当前状态**:
- 测试文件: 386 个
- 通过率: ~89%
- 失败用例: ~497 个

**目标**:
- 通过率: >95%
- 核心模块覆盖率: >80%

**优先修复**:
1. RBAC integration tests (权限功能阻塞)
2. GitHub API tests (error.code 格式)
3. Retry manager tests (unhandled rejection)

**预估工作量**: 24 小时

#### 2.3 ESLint 规则增强 (P2)

**当前警告**: 30 个

**建议新增规则**:
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "warn",
    "react-hooks/exhaustive-deps": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

**预估工作量**: 4 小时

### 3. 架构演进

#### 3.1 模块化改进 (P1)

**当前 lib/ 结构** (47 个子目录):

```
src/lib/
├── agents/          920KB  # 智能体系统
├── monitoring/      780KB  # 监控系统
├── performance/     684KB  # 性能工具
├── db/              680KB  # 数据库
├── websocket/       420KB  # WebSocket
├── middleware/      360KB  # 中间件
├── realtime/        316KB  # 实时通信
├── ... (40+ 其他目录)
```

**建议**:
- [ ] 按功能域重组为 8-10 个核心模块
- [ ] 建立清晰的模块边界
- [ ] 添加 module-barrier 配置

**预估工作量**: 24 小时

#### 3.2 API 层标准化 (P1)

**当前问题**:
- 多种响应格式并存
- 错误处理不统一
- API 文档与实现不同步

**建议**:
- [ ] 统一 API 响应格式
- [ ] 标准化错误码体系
- [ ] OpenAPI 规范自动化

**预估工作量**: 16 小时

#### 3.3 微前端可行性评估 (P2)

**评估维度**:
- 模块独立部署需求
- 团队协作规模
- 复杂度与收益比

**建议**: v1.6.0 仅做技术调研，不做实施

---

## 📅 Sprint 4 工作计划

### Week 1: 技术债务清理

| 任务 | 优先级 | 预估时间 | 负责人 |
|------|--------|---------|--------|
| archive/ 目录清理 | P1 | 4h | Executor |
| -optimized 文件合并 | P2 | 4h | Executor |
| 文档去重整理 | P3 | 8h | 咨询师 |
| TypeScript 严格模式 | P0 | 16h | 架构师 |
| 测试失败修复 | P1 | 16h | 测试员 |

**Week 1 总计**: 48 小时

### Week 2: 性能优化启动

| 任务 | 优先级 | 预估时间 | 负责人 |
|------|--------|---------|--------|
| Bundle size 优化 | P0 | 8h | Executor |
| Turbopack 生产评估 | P1 | 4h | 系统管理员 |
| API 响应标准化 | P1 | 8h | 架构师 |
| 模块化改进设计 | P1 | 8h | 架构师 |
| 测试覆盖率提升 | P1 | 16h | 测试员 |

**Week 2 总计**: 44 小时

---

## ⚠️ 风险评估

### 高风险项

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| TypeScript 严格模式破坏现有代码 | 高 | 中 | 增量开启，逐模块修复 |
| archive 删除丢失重要文件 | 中 | 低 | 先备份到 git tag |
| 测试修复引入新 bug | 中 | 中 | 每修复 10 个运行全量测试 |

### 中风险项

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| Bundle 优化影响功能 | 中 | 低 | E2E 测试覆盖 |
| 文档合并丢失信息 | 低 | 中 | 保留历史版本 |
| 工作量估算偏差 | 中 | 中 | 预留 20% 缓冲 |

### 低风险项

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| ESLint 规则冲突 | 低 | 高 | 逐条开启，逐文件修复 |
| 归档目录权限问题 | 低 | 低 | root 权限执行 |

---

## 📈 成功指标

### 必须达成

- [ ] TypeScript 严格模式新规则全部开启
- [ ] 测试通过率 > 90%
- [ ] archive/ 目录清理完成
- [ ] 构建时间 < 1m30s

### 应该达成

- [ ] 测试通过率 > 95%
- [ ] 初始 bundle < 200KB
- [ ] 文档去重完成

### 可选达成

- [ ] -optimized 文件全部合并
- [ ] API 响应格式统一
- [ ] 模块化改进方案确定

---

## 📚 相关文档

- [技术债务评估报告](./docs/tech-debt-assessment.md)
- [CHANGELOG v1.5.0](./CHANGELOG.md)
- [架构文档](./docs/ARCHITECTURE.md)
- [开发指南](./docs/DEVELOPER_GUIDE.md)
- [测试策略 v1.5.0](./docs/v150-testing-strategy.md)

---

## 🔄 变更历史

| 日期 | 版本 | 变更内容 |
|------|------|---------|
| 2026-03-31 | 0.1 | 初始草案创建 |

---

**下一步**: 提交给主管审批，确定 Sprint 4 执行计划
