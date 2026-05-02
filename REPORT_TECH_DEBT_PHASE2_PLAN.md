# 7zi-frontend Phase 2 技术债务清理计划

**项目**: 7zi-frontend  
**阶段**: Phase 2 (Phase 1 已完成)  
**制定日期**: 2026-04-21  
**制定角色**: 📚 咨询师子代理  
**模型**: minimax/MiniMax-M2.7

---

## 📊 Phase 1 完成状态回顾

| 任务 | 状态 |
|------|------|
| package.json 清理 | ✅ 完成 |
| 依赖升级 | ✅ 完成 |
| xlsx → exceljs 迁移 | ✅ 完成 |
| serialize-javascript 漏洞修复 | ✅ 完成 (pnpm.overrides >=7.0.5) |

---

## 🔍 当前项目状态

### 依赖版本 (package.json)

| 包 | 当前版本 | 备注 |
|----|---------|------|
| Next.js | ^16.2.4 | ✅ 最新 stable |
| React | ^19.2.5 | ✅ 最新 |
| exceljs | ^4.4.0 | ✅ 已迁移 |
| serialize-javascript | override >=7.0.5 | ✅ 安全 |

### Next.js 16 内存问题评估

**结论**: Next.js 16.2.4 所有 stable 版本**无已知 OOM 根源于 Next.js 本身**。

**实际情况**:
- 生产构建 ✅ 正常通过 (`pnpm build` 成功)
- TypeScript 检查 ✅ 通过
- 67 页面全部生成成功
- 但生产服务器存在**多个 next-server 进程**，部分内存占用极高 (747MB)

**根因分析**:
```
生产服务器上同时运行:
- next-server v15.5.15 (105MB)
- next-server v16.1.1 (747MB!) ← 内存大户
- next-server v16.2.2 (59MB)
- next (dev) port 3003 (18MB)
```

**建议**: 统一到 Next.js 16.2.4，停止旧版本进程

---

## 🏆 Phase 2 技术债务清单

### P0 — 紧急 (影响生产运行)

#### 1. 【生产危机】nginx 配置错误导致 7zi.com 显示旧内容 [CRITICAL]

**问题**: 7zi.com 显示"上海尔虎信息技术有限公司"(旧公司站点) 已超过 51 小时
**根因**: nginx 配置 `root /var/www/erhu-brand` 静态文件，未代理到 PM2 Next.js (port 3000)

| 文件 | 问题 |
|------|------|
| `/etc/nginx/sites-enabled/7zi.com` | `root /var/www/erhu-brand` (静态) |
| PM2 7zi-main | 正常运行在 localhost:3000 ✅ |

**修复方案**: 修改 nginx 配置，添加 proxy_pass 到 port 3000

**预估工时**: 1h (主要是服务器操作)

**状态**: 待执行 (需要 SSH 到服务器)

---

#### 2. 【生产危机】磁盘空间 94% [CRITICAL]

**问题**: 生产服务器 `/` 分区 94% 使用率，仅剩 5.9GB
**影响**: 可能导致系统不稳定、服务崩溃、无法写入日志

**修复方案**:
```bash
journalctl --vacuum-time=7d           # 清理旧日志
docker system prune -a                # 清理未使用 Docker 镜像
rm -rf /var/log/*.gz                  # 清理压缩日志
find /tmp -type f -atime +7 -delete   # 清理临时文件
```

**预估工时**: 1h

**状态**: 待执行

---

#### 3. 【生产】Next.js 版本碎片化 [HIGH]

**问题**: 生产服务器运行 3 个不同版本 Next.js
- v15.5.15 (105MB)
- v16.1.1 (747MB)
- v16.2.2 (59MB)

**建议**: 统一部署到 v16.2.4，停止旧版本

**预估工时**: 2h (构建 + 部署 + 验证)

---

### P1 — 高优先级 (影响开发效率)

#### 4. ignoreBuildErrors: true 掩盖类型问题

**问题**: `next.config.ts` 中 `typescript.ignoreBuildErrors: true`，隐藏了 TypeScript 错误

**修复方案**: 
1. 设置为 `false`
2. 运行 `npm run typecheck`
3. 修复所有类型错误

**预估工时**: 3-4h

**涉及文件**: Next.js 16 兼容性修复后剩余的类型错误

---

#### 5. next.config.ts reactCompiler 配置重复

**问题**: 
```typescript
// 顶层
reactCompiler: { compilationMode: 'annotation' }
// compiler 内
compiler: { reactCompiler: { mode, excludePatterns } }
```

**影响**: `Unrecognized key 'reactCompiler'` 警告

**修复方案**: 合并为单一配置

**预估工时**: 0.5h

---

#### 6. CSS 透明度格式警告 (5处)

**问题**: `var(--color-blue-900/30)` 格式不符合 Next.js 16 CSS 要求

**修复方案**: 改为 RGBA 格式

**预估工时**: 0.5h

---

#### 7. CommonJS require() 残留 (4处)

**问题**: `src/lib/db/feedback-storage.ts`, `src/lib/services/notification-storage.ts`, `src/lib/automation/automation-hooks.ts` 使用 `require()`

**修复方案**: 替换为 ESM `import`

**预估工时**: 1h

---

#### 8. @tiptap 批量升级 (2.27.2 → 3.22.3)

**问题**: 14+ 个包过期，v3 有 API 破坏性变更

**修复方案**: 
1. 在 dev 分支测试
2. 参考 [Tiptap v3 Migration Guide](https://tiptap.dev/docs/migrations)
3. 逐个扩展迁移

**预估工时**: 4-6h (高风险，需充分测试)

---

### P2 — 中优先级 (代码质量改进)

#### 9. 巨型文件重构

| 文件 | 行数 | 建议 |
|------|------|------|
| `websocket-manager.ts` | 1,455 | 拆分职责 |
| `automation-engine.ts` | 1,219 | 拆分规则引擎 |
| `permissions.ts` | 955 | 策略模式拆分 |
| `CollabClient.ts` | 819 | 职责分离 |

**预估工时**: 16-24h (分散到多周)

---

#### 10. 通知系统重复实现 (7+ 文件)

**问题**: 
```
notification-init.ts (1,524行)
notification-center.tsx (17,426行)
notification-enhanced.ts (19,216行)
notification-indexeddb.ts (18,526行)
notification-manager.ts (18,044行)
notification-storage.ts (16,248行)
notification-types.ts (1,600行)
notification.ts (6,300行)
notifications.ts (1,506行)
```

**修复方案**: 统一为单一架构，设计清晰抽象层

**预估工时**: 12-20h

---

#### 11. 103+ 处 console.log 散落

**问题**: `src/lib/db/draft-storage.ts` 等文件中大量 console.log/warn

**修复方案**: 统一使用 logger 模块

**预估工时**: 3-4h

---

#### 12. 过期依赖更新

| 包 | 当前 → 最新 | 风险 |
|----|-----------|------|
| @tiptap/* (14个) | 2.27.2 → 3.22.3 | 🔴 高 |
| typescript | 5.9.3 → 6.0.2 | 🟡 中 |
| @vitejs/plugin-react | 4.7.0 → 6.0.1 | 🟡 中 |
| @types/node | 20.19.39 → 25.6.0 | 🟢 低 |
| @testing-library/react | 14.3.1 → 16.3.2 | 🟢 低 |
| jsdom | 24.1.3 → 29.0.2 | 🟢 低 |
| @faker-js/faker | 8.4.1 → 10.4.0 | 🟢 低 |
| date-fns | 3.6.0 → 4.1.0 | 🟢 低 |
| undici | 7.24.7 → 8.0.3 | 🟢 低 |
| better-sqlite3 | 12.8.0 → 12.9.0 | 🟢 低 |
| @types/uuid | 废弃 → 11.0.0 | 🟢 低 |
| critters | 0.0.23 → 0.0.25 | 🟢 低 |

**建议优先级**: 
1. 先处理 @tiptap (最高风险)
2. 然后 typescript
3. 最后其他

**预估工时**: 8-12h (分散处理)

---

### P3 — 低优先级 (运维改进)

#### 13. 添加 .nvmrc 和 engines 字段

**问题**: 项目未指定 Node/pnpm 版本约束

**修复方案**:
```json
// package.json
"engines": {
  "node": ">=20.9.0",
  "pnpm": ">=8.0.0"
}
```
```bash
# .nvmrc
echo "22" > .nvmrc
```

**预估工时**: 0.5h

---

#### 14. Server Actions 迁移

**问题**: 10+ API 路由待迁移到 Server Actions (Next.js 16 推荐)

**预估工时**: 8-12h

---

## 📋 Phase 2 完整计划

### 第一批次 (立即执行 - 本周)

| # | 任务 | 优先级 | 工时 | 状态 |
|---|------|--------|------|------|
| 1 | nginx 配置修复 (7zi.com) | P0 | 1h | ⏳ 待执行 |
| 2 | 生产磁盘清理 | P0 | 1h | ⏳ 待执行 |
| 3 | Next.js 版本统一 (停止旧进程) | P0 | 2h | ⏳ 待执行 |

**子任务**: 需要 SSH 到 165.99.43.61 执行

### 第二批次 (短期 - 1-2周)

| # | 任务 | 优先级 | 工时 | 状态 |
|---|------|--------|------|------|
| 4 | ignoreBuildErrors: false + 类型修复 | P1 | 3-4h | ⏳ 待执行 |
| 5 | next.config.ts reactCompiler 重复配置清理 | P1 | 0.5h | ⏳ 待执行 |
| 6 | CSS 透明度格式修复 | P1 | 0.5h | ⏳ 待执行 |
| 7 | CommonJS require() 替换 | P1 | 1h | ⏳ 待执行 |
| 8 | @tiptap v3 升级测试 | P1 | 4-6h | ⏳ 待执行 |

### 第三批次 (中期 - 1个月)

| # | 任务 | 优先级 | 工时 | 状态 |
|---|------|--------|------|------|
| 9 | 巨型文件重构 (websocket-manager, automation-engine) | P2 | 8-12h | 📋 计划中 |
| 10 | 通知系统统一 | P2 | 8-12h | 📋 计划中 |
| 11 | console.log 统一到 logger | P2 | 3-4h | 📋 计划中 |
| 12 | 其他过期依赖更新 | P2 | 6-8h | 📋 计划中 |

### 第四批次 (长期 - 持续改进)

| # | 任务 | 优先级 | 工时 | 状态 |
|---|------|--------|------|------|
| 13 | 添加 .nvmrc 和 engines | P3 | 0.5h | 📋 计划中 |
| 14 | Server Actions 迁移 | P3 | 8-12h | 📋 计划中 |
| 15 | 权限模块重构 (permissions.ts) | P3 | 6-8h | 📋 计划中 |
| 16 | Repository 多版本合并 | P3 | 4-6h | 📋 计划中 |

---

## 💰 总预估工时

| 批次 | 工时范围 |
|------|---------|
| 第一批次 (P0) | 4h |
| 第二批次 (P1) | 9-12h |
| 第三批次 (P2) | 25-36h |
| 第四批次 (P3) | 18.5-26.5h |
| **总计** | **56.5-78.5h** |

---

## 🚫 Phase 2 不需要处理的项目

以下 Phase 1 项目已确认完成，无需进一步操作:

| 项目 | 状态 | 验证 |
|------|------|------|
| serialize-javascript 漏洞 | ✅ 已修复 | pnpm.overrides >=7.0.5 生效 |
| xlsx → exceljs 迁移 | ✅ 已完成 | 无 xlsx 包，无导入 |
| i18n 文件完整性 | ✅ 正常 | 所有语言文件 861 行完整 |
| protobufjs 漏洞 | ⚠️ 可选 | 来源 @xenova/transformers，非核心路径 |

---

## 📝 备注

1. **Next.js 16 内存问题**: 项目使用 Next.js 16.2.4 (最新 stable)，无已知 OOM 根源于 Next.js 本身。生产环境内存问题可能与版本碎片化 (同时运行 v15/v16 多版本) 有关。

2. **@tiptap 升级风险高**: v2 → v3 有较大 API 变更，建议在 dev 分支充分测试后再合并。

3. **生产服务器操作**: 第一批次任务需要 SSH 到 165.99.43.61，建议在维护窗口执行。

---

**报告生成时间**: 2026-04-21 05:50 GMT+2
**下次审查**: Phase 2 第一批次完成后
