# 安全依赖报告
**生成时间**: 2026-03-31 12:46 GMT+2  
**项目**: 7zi-frontend  
**检查方式**: npm audit

---

## 高危漏洞 (需要立即修复)

*无高危漏洞*

---

## 中危漏洞 (需要尽快修复)

### 1. esbuild 依赖漏洞 (CVE-2025)
| 项目 | 详情 |
|------|------|
| **漏洞** | esbuild <=0.24.2 允许任意网站向开发服务器发送请求并读取响应 |
| **影响范围** | vite, vite-node, vitest (开发依赖) |
| **风险** | 开发环境可能被恶意网站攻击 |
| **修复建议** | 更新 esbuild 至最新版本 |
| **影响依赖** | `node_modules/vite-node/node_modules/esbuild`<br>`node_modules/vitest/node_modules/esbuild` |

**修复命令** (注意: 可能引入破坏性变更):
```bash
npm audit fix --force
# 或者手动更新 vitest 到最新版本
npm update vitest@latest
```

---

## 低危漏洞 (可以延迟修复)

*无低危漏洞*

---

## 建议更新列表

### 生产依赖 (dependencies)

| 包名 | 当前版本 | 建议版本 | 备注 |
|------|---------|---------|------|
| i18next | ^26.0.1 | ^24.x (检查兼容性) | 可能需要测试 |
| react-i18next | ^17.0.1 | 最新稳定版 | API 可能变化 |
| next | 16.2.1 | 检查最新 16.x | 较新 |
| zod | ^4.3.6 | 检查最新 4.x | v4 较新 |
| undici | ^7.24.6 | 检查最新 7.x | 较新 |

### 开发依赖 (devDependencies)

| 包名 | 当前版本 | 建议版本 | 备注 |
|------|---------|---------|------|
| vitest | ^1.3.0 | ^2.x | **重要**: 当前版本有 esbuild 漏洞 |
| vite | ^8.0.3 | ^6.x | 与 vitest 关联 |
| typescript | ^5.3.0 | ^5.9.x | 可安全更新 |
| storybook | ^10.3.3 | 最新 10.x | 可更新 |
| playwright | ^1.58.2 | 检查最新 1.x | 可更新 |

---

## 安全建议

1. **立即**: 评估 `npm audit fix --force` 的影响，如可接受则执行
2. **尽快**: 单独更新 vitest/esbuild 链，避免破坏性变更
3. **后续**: 安排常规依赖审核 (建议每月一次)

---

## 附: npm audit 原始输出

```
# npm audit report

esbuild  <=0.24.2
Severity: moderate
esbuild enables any website to send any requests to the development server and read the response - https://github.com/advisories/GHSA-67mh-4wv8-2f99
fix available via `npm audit fix --force`
Will install vitest@4.1.2, which is a breaking change
node_modules/vite-node/node_modules/esbuild
node_modules/vitest/node_modules/esbuild
  vite  0.11.0 - 6.1.6
  Depends on vulnerable versions of esbuild
  node_modules/vite-node/node_modules/vite
  node_modules/vitest/node_modules/vite
    vite-node  <=2.2.0-beta.2
    Depends on vulnerable versions of vite
    node_modules/vite-node
      vitest  0.0.1 - 0.0.12 || 0.0.29 - 0.0.122 || 0.3.3 - 2.2.0-beta.2
      Depends on vulnerable versions of vite
      Depends on vulnerable versions of vite-node
      node_modules/vitest

4 moderate severity vulnerabilities
```

---

**报告生成者**: 系统管理员子代理  
**下次审核建议**: 2026-04-30
