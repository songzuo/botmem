# 归档目录清理计划

**创建日期**: 2026-03-31
**创建人**: 🏗️ 架构师
**任务来源**: Sprint 4 技术债务清理

---

## 📊 当前归档空间使用分析

### 1. 根目录 tar.gz 文件 (共 29.2MB)

| 文件 | 大小 | Git 跟踪 | 创建日期 | 用途 |
|------|------|----------|----------|------|
| `7zi-deploy.tar.gz` | 7.2MB | ✅ 已跟踪 | 2026-03-22 | 部署备份 |
| `deploy-20260323-151833.tar.gz` | 11MB | ✅ 已跟踪 | 2026-03-24 | 部署备份 |
| `deploy-minimal.tar.gz` | 11MB | ✅ 已跟踪 | 2026-03-24 | 精简部署包 |

**状态**: 已在 Git 版本控制中，可安全删除本地文件

### 2. docs/archive/ 目录 (共 3.6MB)

| 子目录 | 大小 | 文件数 | 内容 |
|--------|------|--------|------|
| `deprecated/` | 1.7MB | 113 | 历史废弃文档 |
| `reports/` | 1.5MB | ~110 | 版本报告 |
| `miscellaneous/` | 188KB | 若干 | 杂项文件 |
| `drafts/` | 12KB | 若干 | 草稿文档 |

**reports/ 子目录详情**:
- `v1.0.8/`: 72 个历史报告 (约 920KB)
- `v1.0.9/`: 20 个历史报告 (约 260KB)
- `v1.1.0-planning/`: 5 个规划文档 (约 180KB)
- `2026/03/`: 13 个近期报告 (约 160KB)

### 3. 其他备份文件

| 文件 | 大小 | Git 跟踪 | 说明 |
|------|------|----------|------|
| `7zi-frontend/lib-performance-backup-20260330.tar.gz` | 64KB | ✅ 已跟踪 | 性能优化备份 |
| `db-optimization-patches/` | ~50KB | ✅ 已跟踪 | 数据库优化补丁 |

### 4. 关于 SPRINT4_PLAN 提到的 archive/ 目录

⚠️ **重要发现**: `archive/` 目录（文档中提到约 147MB）**当前不存在于工作区**。

可能的原因：
- 已在之前的清理中被删除
- 位于其他位置
- 文档信息已过时

---

## 🗑️ 清理建议分类

### A. 可安全删除 (已在 Git 历史) - 预估释放 ~29.3MB

| 文件/目录 | 大小 | 删除条件 |
|-----------|------|----------|
| `7zi-deploy.tar.gz` | 7.2MB | ✅ 已在 Git，可删除 |
| `deploy-20260323-151833.tar.gz` | 11MB | ✅ 已在 Git，可删除 |
| `deploy-minimal.tar.gz` | 11MB | ✅ 已在 Git，可删除 |
| `7zi-frontend/lib-performance-backup-20260330.tar.gz` | 64KB | ✅ 已在 Git，可删除 |

### B. 需评估后决定 (归档文档) - 共 3.6MB

| 目录 | 建议 | 理由 |
|------|------|------|
| `docs/archive/deprecated/` | **保留** | 历史参考价值，已正确归档 |
| `docs/archive/reports/v1.0.8/` | **保留** | 版本历史，体积小 |
| `docs/archive/reports/v1.0.9/` | **保留** | 版本历史，体积小 |
| `docs/archive/reports/v1.1.0-planning/` | **保留** | 规划参考 |
| `docs/archive/reports/2026/03/` | **保留** | 近期报告，有价值 |
| `docs/archive/miscellaneous/` | **可清理** | 检查是否有冗余 |
| `docs/archive/drafts/` | **可清理** | 检查过期草稿 |

### C. 需确认功能状态 - db-optimization-patches/

| 文件 | 说明 | 建议 |
|------|------|------|
| `patch-1-backup-api-optimized.ts` | API 优化补丁 | 检查是否已合并到 src/lib/ |
| `patch-2-auth-pagination-optimized.ts` | 认证分页优化 | 检查是否已合并 |
| `patch-3-wallet-batch-optimized.ts` | 钱包批量优化 | 检查是否已合并 |

---

## 📋 清理执行步骤

### 第一步：删除根目录部署备份 (释放 ~29.2MB)

```bash
# 确认文件已在 Git 中
git ls-files *.tar.gz

# 删除部署备份文件
rm /root/.openclaw/workspace/7zi-deploy.tar.gz
rm /root/.openclaw/workspace/deploy-20260323-151833.tar.gz
rm /root/.openclaw/workspace/deploy-minimal.tar.gz
```

### 第二步：删除前端备份 (释放 ~64KB)

```bash
rm /root/.openclaw/workspace/7zi-frontend/lib-performance-backup-20260330.tar.gz
```

### 第三步：评估 db-optimization-patches/ (可选)

```bash
# 检查补丁是否已合并
# 如果 src/lib/ 中已有对应优化代码，可删除此目录
```

### 第四步：整理 docs/archive/miscellaneous/ 和 drafts/

```bash
# 检查内容
ls -la /root/.openclaw/workspace/docs/archive/miscellaneous/
ls -la /root/.openclaw/workspace/docs/archive/drafts/

# 删除确认无用的文件
```

---

## 📈 预估效果

| 操作 | 释放空间 | 风险等级 |
|------|----------|----------|
| 删除根目录 tar.gz | ~29.2MB | 🟢 低 (已在 Git) |
| 删除前端备份 | ~64KB | 🟢 低 (已在 Git) |
| 清理 miscellaneous/ | ~100-200KB | 🟡 中 (需检查) |
| 清理 drafts/ | ~10KB | 🟡 中 (需检查) |
| **总计** | **~29.3-29.5MB** | - |

---

## ⚠️ 注意事项

1. **Git 历史保证安全**: 所有 tar.gz 文件都已在 Git 版本控制中，删除本地文件后仍可从历史恢复

2. **docs/archive/ 结构合理**: 归档目录已按版本组织，结构清晰，建议保留

3. **SPRINT4_PLAN 信息过时**: 文档中提到的 147MB archive/ 目录不存在，可能是历史信息

4. **db-optimization-patches 需确认**: 建议检查这些补丁是否已合并到主代码库

---

## ✅ 推荐操作

### 立即可执行 (低风险):

```bash
# 删除根目录部署备份 - 释放 29.2MB
cd /root/.openclaw/workspace
rm 7zi-deploy.tar.gz
rm deploy-20260323-151833.tar.gz
rm deploy-minimal.tar.gz
rm 7zi-frontend/lib-performance-backup-20260330.tar.gz

echo "清理完成，释放约 29.3MB 空间"
```

### 需确认后执行:

1. 检查 `db-optimization-patches/` 是否已合并
2. 审查 `docs/archive/miscellaneous/` 内容
3. 审查 `docs/archive/drafts/` 内容

---

**报告生成时间**: 2026-03-31 12:54 GMT+2
**状态**: 待审核
