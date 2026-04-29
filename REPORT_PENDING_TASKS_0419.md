# 📋 待处理任务优先级报告

**生成时间**: 2026-04-19 06:20 GMT+2  
**审查范围**: `/root/.openclaw/workspace/`  
**报告类型**: 待处理任务汇总与优先级排序

---

## 🚨 P0 - 紧急/阻塞性问题

### 1. 7zi.com 生产危机 — 内容错误

| 项目 | 详情 |
|------|------|
| **状态** | 🔴 持续 23+ 小时 |
| **问题** | 7zi.com 显示"上海尔虎信息技术有限公司"（旧内容），应为 7zi Studio |
| **ai.7zi.com** | ⚠️ 无响应或返回空内容 |
| **本地代码** | ⚠️ 落后 origin/main 71 commits |

**建议**: 立即检查 Vercel/GitHub 部署状态，确保 main 分支 0ebb1d63 已正确部署。

---

### 2. Next.js 16.x 升级计划待执行

| 项目 | 当前 | 目标 |
|------|------|------|
| Next.js | ^16.2.3 | ^16.2.x 最新补丁 |
| Node.js | v22.22.1 | >=20.9.0 LTS |

**关键步骤** (来自 `REPORT_NEXTJS163_PLAN_0418.md`):
- ✅ package.json lint 脚本需从 `next lint` 改为 `eslint . --ext .ts,.tsx,.js,.jsx`
- ✅ 升级 Next.js 到最新补丁版本
- ✅ 完整回归测试
- ⏳ **待执行**

---

### 3. XLSX 迁移未完成

| 文件 | 状态 |
|------|------|
| `REPORT_XLSX_MIGRATION_0418.md` | ✅ 研究完成 |
| `REPORT_XLSX_ALTERNATIVE_RESEARCH_20260418.md` | ✅ 备选方案研究完成 |
| **实际迁移** | ⏳ 待执行 |

**建议**: 确认迁移方案（exceljs → xlsx-stream 或其他）并执行。

---

## ⚠️ P1 - 高优先级任务

### 4. TypeScript `any` 类型清理

| 来源 | 数量 |
|------|------|
| 前端 TODO/FIXME 总计 | ~41 个 |
| 核心 API routes | 多个未实现的 TODO |

**关键遗留问题**:
- `src/app/api/auth/route.ts` — 实际认证逻辑未实现
- `src/app/api/search/route.ts` — 搜索执行和联想建议未实现
- `src/app/api/data/import/route.ts` — 数据导入逻辑未实现
- `src/features/auth/api/route.ts` — 认证逻辑未实现
- `src/lib/automation/automation-engine.ts` — 集成未完成

---

### 5. 协作系统核心功能

| 功能 | 优先级 | 状态 |
|------|--------|------|
| 实时光标同步 | P0 | 待实现 |
| 协作状态面板 | P0 | 待实现 |
| 实时变更推送 | P0 | 待实现 |
| 冲突解决机制 | P0 | 待实现 |
| 协作历史记录 | P1 | 待实现 |

---

### 6. 搜索系统

| 功能 | 优先级 | 状态 |
|------|--------|------|
| 全局搜索 | P0 | TODO 存在 |
| 模糊搜索 | P0 | 待实现 |
| 搜索过滤 | P0 | 待实现 |
| 搜索历史 | P1 | 待实现 |
| 搜索建议 | P1 | TODO 存在 |

---

### 7. 告警系统集成

| 通道 | 状态 |
|------|------|
| Email | TODO — 待集成实际邮件服务 |
| Webhook | TODO — 待实现 |
| Telegram | TODO — 待实现 |
| Toast 通知 | TODO — 待集成 |
| 提示音 | TODO — 待实现 |

---

## 📊 测试与质量

### 8. 测试覆盖与修复

| 问题 | 来源 | 状态 |
|------|------|------|
| 170+ 测试失败 | HEARTBEAT.md | ⚠️ 未解决 |
| IndexedDB/WebSocket mock 问题 | HEARTBEAT.md | ⚠️ 未解决 |
| 测试执行超时 (>5min) | REPORT_CODE_QUALITY_REVIEW_20260405.md | ⚠️ 未解决 |

---

## 🔒 安全相关

### 9. 依赖安全问题

| 依赖 | 风险 | 状态 |
|------|------|------|
| serialize-javascript | RCE (依赖链深) | ⏳ 等待上游修复 |

---

## 📝 TODO/FIXME 汇总

### 按模块分布 (~41 个前端 TODO)

```
src/lib/performance/alerting/channels.ts    5 个
src/lib/automation/automation-engine.ts      3 个
src/app/api/auth/route.ts                   4 个
src/app/api/search/route.ts                 2 个
src/app/api/data/import/route.ts             2 个
src/features/auth/api/route.ts              4 个
src/components/rooms/RoomPanel.tsx           3 个
其他                                         ~18 个
```

---

## ✅ 已完成/已归档 (近期)

| 任务 | 日期 |
|------|------|
| Next.js 16.x 升级评估与计划制定 | 2026-04-18 |
| TypeScript P0 修复 | 2026-04-18 |
| Build 问题修复 | 2026-04-18 |
| 依赖审计 | 2026-04-18 |
| 代码质量审查 | 2026-04-17 |
| 架构审查 v2 | 2026-04-17 |

---

## 🎯 建议执行顺序

1. **立即** — 解决 7zi.com 生产危机（部署正确版本）
2. **今天** — 执行 Next.js 16.x 升级（变更 lint 脚本 + 升级依赖）
3. **本周** — 完成 XLSX 迁移
4. **本周** — 修复测试套件（IndexedDB/WebSocket mocks）
5. **持续** — 逐步实现 TODO 中的 API 功能
6. **规划中** — 协作系统核心功能

---

*报告生成: 咨询师子代理*  
*数据来源: workspace 文件扫描 + HEARTBEAT.md + 近期报告*
