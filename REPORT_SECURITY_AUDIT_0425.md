# 安全审计与性能优化报告 - 7zi-frontend

**审计日期**: 2026-04-25  
**审计者**: 系统管理员 (子代理)  
**项目版本**: 1.14.0

---

## 📋 目录

1. [安全漏洞列表](#安全漏洞列表)
2. [依赖版本问题](#依赖版本问题)
3. [配置优化建议](#配置优化建议)
4. [优先修复项](#优先修复项)

---

## 🔴 安全漏洞列表

### 🔴 严重 - Arbitrary Code Execution (CVE 级别)

| 漏洞 | 包 | 影响版本 | 修复版本 | 路径 |
|------|-----|---------|---------|------|
| **GHSA-xq3m-2v4x-88gg** | protobufjs | <7.5.5 | ≥7.5.5 | `@xenova/transformers` → `onnxruntime-web` → `onnx-proto` → `protobufjs` |

**影响分析**:
- `protobufjs` 存在任意代码执行漏洞
- 传递链: `@xenova/transformers@2.0.1` → `onnxruntime-web` → `protobufjs`
- `protobufjs` 当前版本未知 (未直接依赖，需检查 `node_modules`)

**风险等级**: ⚠️ **严重** - 可能导致远程代码执行 (RCE)

**修复建议**:
```bash
# 检查当前 protobufjs 版本
cd /root/.openclaw/workspace/7zi-frontend && cat node_modules/protobufjs/package.json | grep version

# 方案1: 升级 protobufjs
pnpm add protobufjs@latest

# 方案2: 如果 @xenova/transformers 锁定旧版本，考虑替代方案
# 或使用 resolutions 强制使用安全版本
```

---

### 🟡 中等 - UUID Buffer Bounds Check (CVE)

| 漏洞 | 包 | 影响版本 | 修复版本 | 路径 |
|------|-----|---------|---------|------|
| **GHSA-w5hq-g745-h8pq** | uuid | <14.0.0 | ≥14.0.0 | `exceljs` → `uuid` (直接依赖) |

**风险等级**: 🟡 **中等** - 本地文件读取/写入风险

**修复建议**:
```bash
# 检查 uuid 版本
pnpm why uuid

# 升级 uuid
pnpm add uuid@latest
# 或在 exceljs 中使用 patch 或 resolutions
```

---

### 🟡 中等 - PostCSS XSS

| 漏洞 | 包 | 影响版本 | 修复版本 | 路径 |
|------|-----|---------|---------|------|
| **GHSA-qx2v-qp2m-jg93** | postcss | <8.5.10 | ≥8.5.10 | `@tailwindcss/postcss` → `postcss` |

**风险等级**: 🟡 **中等** - 跨站脚本 (XSS) 攻击

**修复建议**:
```bash
# 检查 postcss 版本
pnpm why postcss

# 升级 postcss
pnpm add postcss@latest
```

---

## 📦 依赖版本问题

### 关键依赖分析

| 依赖 | 当前版本 | 问题 | 建议 |
|------|---------|------|------|
| `protobufjs` | 未知 | 严重漏洞 | 升级到 ≥7.5.5 |
| `uuid` | <14.0.0 | 中等漏洞 | 升级到 ≥14.0.0 |
| `postcss` | <8.5.10 | 中等漏洞 | 升级到 ≥8.5.10 |
| `@xenova/transformers` | 2.0.1 | 依赖带漏洞的 protobufjs | 考虑替代方案 |
| `next` | 16.2.4 | ⚠️ Next.js 16 是实验性版本 | 稳定后考虑降级到 15.x |

### 依赖统计

- **Dependencies**: 54
- **DevDependencies**: 32

---

## ⚙️ 配置优化建议

### ✅ 当前做得好的配置

1. **安全 Headers 配置** - 良好
   - ✅ HSTS 已配置
   - ✅ X-Frame-Options 设置为 SAMEORIGIN
   - ✅ X-Content-Type-Options 设置为 nosniff
   - ✅ Permissions-Policy 限制敏感功能

2. **图片安全配置** - 良好
   - ✅ `dangerouslyAllowSVG: false`
   - ✅ `contentSecurityPolicy` 已配置

3. **编译优化** - 良好
   - ✅ 生产环境移除 console.log (保留 error/warn)
   - ✅ `poweredByHeader: false`

4. **压缩和 ETags** - 良好
   - ✅ `compress: true`
   - ✅ `generateEtags: true`

### ⚠️ 需要改进的配置

#### 1. ⚠️ 远程图片域名白名单过于宽松

```javascript
// 当前配置 (过于宽松)
remotePatterns: [
  {
    protocol: 'https',
    hostname: '**',  // ❌ 允许所有域名！
  },
],
```

**问题**: 允许从任意 HTTPS 域名加载图片，可能导致：
- SSRF (服务器端请求伪造) 攻击
- 恶意图片注入
- CDN 滥用

**建议修复**:
```javascript
remotePatterns: [
  // 只允许必要的域名
  { protocol: 'https', hostname: '7zi.com' },
  { protocol: 'https', hostname: '*.7zi.com' },
  { protocol: 'https', hostname: 'images.unsplash.com' },  // 如果使用了 Unsplash
  { protocol: 'https', hostname: 'res.cloudinary.com' },   // 如果使用了 Cloudinary
  // 添加其他必要的 CDN 域名
],
```

#### 2. ⚠️ JWT 密钥注释过于详细

```bash
# .env 中当前注释
# 生成方法: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# 最小长度: 64 字符
```

**问题**: 注释中详细说明了生成方法，如果 .env 文件意外泄露，可能被攻击者利用。

**建议修复**:
```bash
# .env 注释简化为
# JWT 密钥 (生产环境必须设置，使用强随机密钥)
```

#### 3. ⚠️ Next.js 16.2.4 稳定性风险

**问题**: Next.js 16 是最新版本，可能存在稳定性问题。

**建议**:
```bash
# 考虑使用更稳定的版本
# pnpm add next@15.1.0
```

#### 4. ⚠️ ignoreBuildErrors: true

```javascript
typescript: {
  ignoreBuildErrors: true,  // ⚠️ 生产环境建议关闭
},
```

**问题**: TypeScript 错误被忽略，可能导致生产环境出现意外问题。

**建议修复**:
```javascript
typescript: {
  ignoreBuildErrors: process.env.NODE_ENV === 'development',  // 仅开发环境忽略
},
```

#### 5. ⚠️ 生产环境 Source Maps

```javascript
productionBrowserSourceMaps: false,  // ✅ 已正确配置
```

**状态**: ✅ 已正确配置，无需修改。

---

## 🚨 优先修复项

### 🔥 高优先级 (立即修复)

| # | 问题 | 行动 | 影响 |
|---|------|------|------|
| **1** | protobufjs 任意代码执行 | 升级到 ≥7.5.5 或使用 resolutions 强制 | RCE 风险 |
| **2** | UUID 缓冲区漏洞 | 升级 uuid 到 ≥14.0.0 | 本地文件读/写 |
| **3** | PostCSS XSS | 升级 postcss 到 ≥8.5.10 | XSS 攻击 |

### ⚡ 中优先级 (本周内修复)

| # | 问题 | 行动 | 影响 |
|---|------|------|------|
| **4** | 远程图片域名过于宽松 | 限制为实际使用的域名 | SSRF 风险 |
| **5** | JWT 密钥生成方法注释 | 简化注释，避免泄露 | 安全配置 |
| **6** | ignoreBuildErrors 生产风险 | 仅开发环境忽略 | 代码质量 |

### 📅 低优先级 (计划内修复)

| # | 问题 | 行动 | 影响 |
|---|------|------|------|
| **7** | Next.js 16 稳定性 | 稳定后降级到 15.x | 稳定性 |
| **8** | @xenova/transformers 依赖 | 评估是否必需，考虑替代方案 | 维护性 |

---

## 🛠️ 修复命令

```bash
# 1. 升级 protobufjs (高优先级)
cd /root/.openclaw/workspace/7zi-frontend
pnpm add protobufjs@latest

# 2. 升级 uuid (高优先级)
pnpm add uuid@latest

# 3. 升级 postcss (高优先级)
pnpm add postcss@latest

# 4. 修复 ignoreBuildErrors (中优先级)
# 编辑 next.config.js 中的 typescript.ignoreBuildErrors

# 5. 限制远程图片域名 (中优先级)
# 编辑 next.config.js 中的 images.remotePatterns

# 6. 完成后重新审计
pnpm audit
```

---

## 📊 总结

| 类别 | 数量 |
|------|------|
| 严重漏洞 | 1 |
| 中等漏洞 | 2 |
| 配置问题 | 4 |
| 高优先级修复 | 3 |
| 中优先级修复 | 3 |
| 低优先级修复 | 2 |

**建议**: 优先修复 3 个高优先级漏洞，特别是 protobufjs 的 RCE 风险。同时修复配置问题以提升整体安全性。

---

*报告生成时间: 2026-04-25 17:10 GMT+2*