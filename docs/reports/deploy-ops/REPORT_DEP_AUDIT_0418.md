# 依赖包安全审计报告
**项目**: 7zi-frontend  
**审计时间**: 2026-04-18  
**Node版本**: v22.22.1  

---

## 一、安全漏洞 (npm audit)

### 🔴 高危漏洞 (需立即修复)

| 漏洞 | 包 | 严重性 | 说明 |
|------|-----|--------|------|
| RCE via RegExp.flags | serialize-javascript ≤7.0.4 | HIGH | 远程代码执行风险 |
| CPU DoS | serialize-javascript ≤7.0.4 | HIGH | 拒绝服务攻击 |
| 依赖链 | terser-webpack-plugin → @ducanh2912/next-pwa | HIGH | 最终依赖 serialize-javascript |

**总计**: 6 个高危漏洞

**受影响依赖链**:
```
serialize-javascript (<=7.0.4)
  └── rollup-plugin-terser (3.0.0 || >=4.0.4)
        └── workbox-build (5.0.0-alpha.0 - 7.0.0)
              └── workbox-webpack-plugin (5.0.0-alpha.0 - 7.0.0)
                    └── @ducanh2912/next-pwa (<=10.2.6)

terser-webpack-plugin (<=5.3.16)
  └── @ducanh2912/next-pwa (<=10.2.6)
```

**根因**: `@ducanh2912/next-pwa` 版本 `10.2.9` 依赖的 `terser-webpack-plugin` 包含有漏洞的 `serialize-javascript`

**修复方案**:
```bash
# 方案1: 运行自动修复 (可能影响PWA功能)
npm audit fix

# 方案2: 升级 @ducanh2912/next-pwa 到最新版本
npm install @ducanh2912/next-pwa@latest
```

---

## 二、过期依赖 (npm outdated)

### 需优先升级 (Major版本更新)

| 包 | 当前 | 最新 | 说明 |
|----|------|------|------|
| @faker-js/faker | 8.4.1 | 10.4.0 | 测试数据生成器，9→10大步升级 |
| @tiptap/* (15个包) | 2.27.2 | 3.22.4 | 富文本编辑器，2→3有breaking changes |
| @types/node | 20.19.39 | 25.6.0 | 类型定义 |
| @vitejs/plugin-react | 4.7.0 | 6.0.1 | Vite React插件 |
| date-fns | 3.6.0 | 4.1.0 | 日期处理库 |
| jsdom | 24.1.3 | 29.0.2 | DOM模拟 |
| typescript | 5.9.3 | 6.0.3 | 类型系统 |
| undici | 7.24.7 | 8.1.0 | HTTP客户端 |

### 可安全升级 (Patch/Minor)

| 包 | 当前 | 最新 | 说明 |
|----|------|------|------|
| @chromatic-com/storybook | 5.1.1 | 5.1.2 | Storybook集成 |
| @testing-library/react | 14.3.1 | 16.3.2 | 测试库 |
| autoprefixer | 10.4.27 | 10.5.0 | CSS前缀 |
| better-sqlite3 | 12.8.0 | 12.9.0 | SQLite绑定 |
| i18next | 26.0.4 | 26.0.5 | 国际化 |
| msw | 2.13.2 | 2.13.4 | API模拟 |
| next | 16.2.3 | 16.2.4 | Next.js |
| react-i18next | 17.0.2 | 17.0.4 | React i18n |
| three | 0.183.2 | 0.184.0 | 3D库 |

---

## 三、修复建议

### 紧急 (1天内)
1. 运行 `npm audit fix` 修复高危漏洞
2. 测试PWA功能是否正常

### 短期 (1周内)
1. 升级 `@ducanh2912/next-pwa` 到最新: `npm install @ducanh2912/next-pwa@latest`
2. 升级 next.js: `npm install next@latest`

### 中期 (1个月内)
1. **Tiptap 2→3迁移**: 需要较大改动，建议评估必要性
2. 升级 TypeScript 到 6.x
3. 升级 date-fns 到 4.x

### 脚本

```bash
#!/bin/bash
# 安全修复脚本

cd /root/.openclaw/workspace/7zi-frontend

# 1. 修复安全漏洞
npm audit fix

# 2. 升级关键包到最新兼容版本
npm install @ducanh2912/next-pwa@latest next@latest

# 3. 升级小版本依赖
npm update

# 4. 验证
npm audit
npm run build
```

---

## 四、总结

| 类别 | 数量 | 行动 |
|------|------|------|
| 高危漏洞 | 6 | 🔴 立即修复 |
| Major版本过期 | 8 | 🟡 计划升级 |
| Patch版本过期 | 10 | 🟢 可选升级 |

**最高优先级**: 修复 `serialize-javascript` 高危漏洞 (RCE风险)
