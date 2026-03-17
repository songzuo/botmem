# 项目依赖安全审计报告

**生成时间**: 2026-03-16 20:15 CET
**审计范围**: /root/.openclaw/workspace (排除 botmem 备份目录)

---

## 1. 审计项目清单

| 项目 | 路径 | 依赖数量 |
|------|------|----------|
| brave-search | VM-0-4-opencloudos/skills/brave-search | 51 |
| mem9 openclaw-plugin | mem9/openclaw-plugin | 1 |
| mem9 dashboard | mem9/dashboard/app | 102 生产 + 467 开发 |
| bot6 docs | bot6/projects/docs | 92 |
| bot6 user-api | bot6/user-api | 71 |

---

## 2. NPM Audit 安全漏洞检查

### ❌ 发现高危漏洞

**项目**: `mem9/openclaw-plugin`
- **受影响包**: `openclaw`, `@buape/carbon`, `@hono/node-server`
- **漏洞数量**: 3 个高危
- **CVE**: GHSA-wc8c-qw6v-h7f6
- **描述**: @hono/node-server 存在授权绕过漏洞 (CVSS 7.5)
- **影响版本**: @hono/node-server < 1.19.10
- **修复建议**: 等待 openclaw 主包更新，或考虑临时移除该依赖

### ✅ 安全项目

以下项目无已知安全漏洞:
- VM-0-4-opencloudos/skills/brave-search ✅
- mem9/dashboard/app ✅
- bot6/projects/docs ✅
- bot6/user-api ✅

---

## 3. 过时的包 (可更新)

| 项目 | 包名 | 当前版本 | 最新版本 | 建议 |
|------|------|----------|----------|------|
| brave-search | jsdom | 27.0.1 | 29.0.0 | 建议更新 |
| mem9/dashboard | @vitejs/plugin-react | 5.2.0 | 6.0.1 | 建议更新 |
| mem9/dashboard | eslint | 9.39.4 | 10.0.3 | 建议更新 |
| mem9/dashboard | vite | 7.3.1 | 8.0.0 | 建议更新 |
| mem9/dashboard | vitest | 3.2.4 | 4.1.0 | 建议更新 |
| mem9/dashboard | jsdom | 27.4.0 | 29.0.0 | 建议更新 |
| bot6/docs | express | 4.22.1 | 5.2.1 | 可选更新 |
| bot6/user-api | express | 4.22.1 | 5.2.1 | 可选更新 |
| bot6/user-api | body-parser | 1.20.4 | 2.2.2 | 可选更新 |

---

## 4. 弃用的包

**未发现弃用的包** ✅

---

## 5. 许可证问题

**未发现许可证问题** ✅
- 所有依赖使用常见开源许可证 (MIT, Apache-2.0, BSD 等)

---

## 6. 大版本过时 (Major Version Updates)

**无大版本需要更新** ✅

---

## 7. 总结与建议

### 🔴 优先处理
1. **mem9/openclaw-plugin** - 高危漏洞
   - 受影响: @hono/node-server < 1.19.10
   - 建议: 检查是否有更新版本的 openclaw 或移除该依赖

### 🟡 建议更新
1. **mem9/dashboard/app** - 多个包可更新 (vite, vitest, eslint 等)
2. **VM-0-4-opencloudos/skills/brave-search** - jsdom 可更新到 29.0.0

### ✅ 状态良好
- bot6/projects/docs
- bot6/user-api
- 无弃用包
- 无许可证问题
