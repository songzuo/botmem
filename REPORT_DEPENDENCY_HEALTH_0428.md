# 项目依赖健康度审计报告

**审计日期**: 2026-04-28  
**审计范围**: 7zi-frontend v1.14.1  
**Node 版本**: v22.22.1  
**包管理器**: pnpm

---

## 一、漏洞扫描 (CVE)

执行 `npm audit`，发现 **14 个漏洞**：

| 严重程度 | 数量 | 说明 |
|---------|------|------|
| 🔴 High | 7 | redis (bull依赖)、serialize-javascript (workbox依赖) |
| 🟡 Moderate | 4 | postcss (next依赖链) |
| 🟢 Low | 3 | fast-csv、tmp |

### 高危漏洞详情

1. **redis (CVE)** - Bull 队列依赖的 redis 版本存在 potential exponential regex (DoS)
   - 影响路径: `bull → redis`
   - 修复: Bull 4.16.5 移除了 redis 依赖，但需要测试兼容性

2. **serialize-javascript (CVE×2)** - RCE 和 CPU 耗尽 DoS 风险
   - 影响路径: `workbox-build → @rollup/plugin-terser → serialize-javascript`
   - `@ducanh2912/next-pwa` 和 workbox 链均受影响

3. **postcss (CVE)** - XSS via Unescaped `</style>`
   - 影响路径: `next → postcss`
   - 修复需要 next 升级或 postcss 独立补丁

---

## 二、过期依赖分析（超过 6 个月未更新）

基于 `npm outdated` 结果，按滞后程度排序：

### 🔴 严重滞后（超过 3 个小版本或 Major 更新）

| 包 | 当前 | 最新 | 滞后量 | 风险 |
|----|------|------|--------|------|
| **bull** | 1.1.3 | 4.16.5 | 3 Major | ⚠️ Redis 漏洞; Bull 已重构，升级需大量测试 |
| **exceljs** | 3.4.0 | 4.4.0 | 1 Major | 含 fast-csv 漏洞，建议升级 |
| **@types/nodemailer** | 7.0.11 | 8.0.0 | 1 Major | 仅有类型定义，低风险 |
| **eslint** | 9.39.4 | 10.2.1 | 1 Major | ESLint 10 有重大变化，需检查配置 |
| **typescript** | 5.9.3 | 6.0.3 | 1 Major | TS 6 有破坏性变更，需全面测试 |

### 🟡 中等滞后（1-2 个小版本）

| 包 | 当前 | 建议升级 | 风险 |
|----|------|---------|------|
| lucide-react | 1.7.0 | 1.12.0 | 低 |
| next-intl | 4.9.1 | 4.11.0 | 低 |
| react/react-dom | 19.2.4 | 19.2.5 | 极低 |
| @modelcontextprotocol/sdk | 1.28.0 | 1.29.0 | 低 |
| @sentry/nextjs | 10.46.0 | 10.50.0 | 低 |
| @react-three/fiber | 9.5.0 | 9.6.1 | 低 |
| fuse.js | 7.1.0 | 7.3.0 | 低 |
| isomorphic-dompurify | 3.7.1 | 3.10.0 | 低 |
| jose | 6.2.2 | 6.2.3 | 极低 |
| vite | 8.0.8 | 8.0.10 | 极低 |
| vitest | 4.1.2 | 4.1.5 | 极低 |

---

## 三、依赖树重复问题

执行 `npm ls --depth=2` 分析，主要发现：

### ✅ 良好的去重
- react、next、zod、typescript、vite、vitest 均正确 deduped
- 内部共享依赖（如 @types/node@25.5.0）已正确合并

### ⚠️ 需要关注的重复项

| 依赖 | 重复来源 | 说明 |
|------|---------|------|
| **lodash** + **lodash-es** | 两者同时安装 | ⚠️ 功能完全重叠，增加 bundle size |
| three@0.183.2 | 被 5+ 个包引用 | 正常（3D 生态依赖） |
| @jest/globals@30.3.0 | @jest/globals | devDependencies 中的 jest 30.x 版本较新 |
| postcss | 多个版本 | next 链和独立使用混在 |

### lodash / lodash-es 重复详情

```
lodash@4.18.1 和 lodash-es@4.18.1 同时安装
```
- 两个包功能完全相同，lodash-es 是 ESM 版本
- 应统一使用 lodash-es（现代构建）或仅用 lodash（兼容性好）
- 当前同时安装无意义，增加 ~30KB bundle 体积

---

## 四、升级建议（优先级从高到低）

### P0 - 安全修复（立即处理）

1. **升级 exceljs → 3.10.0+**  
   修复 fast-csv CVE，且无 breaking change  
   ```bash
   pnpm update exceljs
   ```

2. **考虑升级 Bull**  
   当前 bull 1.1.3 有 7 年未更新，且 redis 漏洞影响生产队列  
   风险：Bull 4.x 重构了 API，需评估 agent-scheduler 兼容性  
   建议：先在 bot5 测试环境验证，或等下个 Major 版本

### P1 - 高优先级（本周内）

3. **统一 lodash / lodash-es**  
   检查代码中 import 方式，迁移到统一使用 lodash-es  
   然后移除其中一个：
   ```bash
   pnpm remove lodash  # 或 lodash-es
   ```

4. **升级 next-intl → 4.11.0**  
   i18n 功能，建议升级

5. **升级 lucide-react → 1.12.0**  
   图标库新版本包含更多图标和优化

6. **升级 react 全家桶 → 19.2.5**  
   ```bash
   pnpm update react react-dom react-is
   ```

### P2 - 中优先级（两周内）

7. 升级 fuse.js → 7.3.0
8. 升级 isomorphic-dompurify → 3.10.0
9. 升级 jose → 6.2.3
10. 升级 @sentry/nextjs → 10.50.0
11. 升级 @modelcontextprotocol/sdk → 1.29.0

### P3 - 低优先级（按需）

12. 升级 vite → 8.0.10、vitest → 4.1.5
13. 升级 @react-three/fiber → 9.6.1
14. 升级 three → 0.184.0
15. 升级 better-sqlite3 → 12.9.0

### P4 - 长期计划（Major 版本升级）

- **Bull → 4.x** (需 agent-scheduler 兼容性测试)
- **ESLint 9 → 10** (检查 flat config 迁移)
- **TypeScript 5 → 6** (全量回归测试)
- **@types/nodemailer 7 → 8** (低风险)

---

## 五、pnpm overrides 有效性检查

当前 overrides：
```json
"brace-expansion@>=4.0.0 <5.0.5": ">=5.0.5",
"flatted@<=3.4.1": ">=3.4.2",
"serialize-javascript": ">=7.0.5"
```
✅ serialize-javascript override 正确应对了 CVE  
⚠️ 但仍存在嵌套传递依赖覆盖不完全的问题

---

## 六、总结

| 指标 | 状态 |
|------|------|
| 安全漏洞 | ⚠️ 14 个（7 高危） |
| 过期依赖 | ⚠️ 较多，主要集中在 Bull/ExcelJS |
| 依赖重复 | 🟡 lodash 双版本问题 |
| 整体健康度 | 🟡 中等，建议按优先级处理 |

**建议立即行动**: 升级 exceljs + 评估 bull 升级计划

---

*报告生成: 咨询师子代理 @ 2026-04-28*
