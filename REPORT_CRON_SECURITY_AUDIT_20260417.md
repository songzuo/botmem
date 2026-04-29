# 🛡️ 7zi-frontend 安全与健康检查报告

**检查时间:** 2026-04-17 21:20 GMT+2  
**检查类型:** Cron 自动化安全审计  
**项目版本:** 1.13.0

---

## 1. 项目基本信息

| 项目 | 值 |
|------|-----|
| 项目名称 | 7zi-frontend |
| 当前版本 | 1.13.0 |
| Node.js 版本 | v22.22.1 |
| 包管理器 | pnpm |
| 构建工具 | Next.js 16.2.3 (Turbopack) |

---

## 2. 依赖概览

| 类型 | 数量 |
|------|------|
| 生产依赖 (dependencies) | 42 |
| 开发依赖 (devDependencies) | 28 |

### 关键依赖版本

| 依赖 | 版本 | 用途 |
|------|------|------|
| next | ^16.2.3 | React 框架 |
| react | ^19.2.5 | React 核心 |
| zustand | ^5.0.12 | 状态管理 |
| @xenova/transformers | ^2.17.2 | AI/ML 推理 |
| three | ^0.183.2 | 3D 渲染 |
| recharts | ^3.8.1 | 图表 |
| tiptap | ^2.27.2 | 富文本编辑器 |

---

## 3. 🔴 安全漏洞 (5 个)

### 3.1 严重漏洞 (Critical) — 1 个

| 漏洞 | 详情 |
|------|------|
| **Arbitrary code execution in protobufjs** | |
| 受影响包 | protobufjs |
| 脆弱版本 | <7.5.5 |
| 修复版本 | >=7.5.5 |
| 依赖链 | `@xenova/transformers > onnxruntime-web > onnx-proto > protobufjs` |
| 严重程度 | ⚠️ **Critical** — 可导致任意代码执行 |
| 建议 | 优先升级 protobufjs，建议锁定 `protobufjs@>=7.5.5` |

### 3.2 高危漏洞 (High) — 1 个

| 漏洞 | 详情 |
|------|------|
| **Nodemailer addressparser DoS** | |
| 受影响包 | nodemailer |
| 当前版本 | ^6.9.0 (使用中 6.9.0+) |
| 脆弱版本 | <=7.0.10 |
| 修复版本 | >=7.0.11 |
| 严重程度 | ⚠️ **High** — 递归调用导致拒绝服务 |
| 建议 | 升级 nodemailer 到最新版本 |

### 3.3 其他漏洞 (Low/Moderate) — 3 个

| 严重程度 | 数量 | 说明 |
|----------|------|------|
| Low | 1 | 低风险 |
| Moderate | 2 | 中等风险 |

---

## 4. ✅ 构建状态

| 检查项 | 状态 | 详情 |
|--------|------|------|
| 构建命令 | ✅ 成功 | `pnpm build:turbopack` |
| 静态页面 | ✅ 正常 | 32 个页面 prerendered |
| 动态 API | ✅ 正常 | 41 个 API 路由 |
| 中间件 | ✅ 正常 | Proxy Middleware 运行 |
| 构建退出码 | 0 | 无错误 |

**构建输出摘要:**
- 32 个静态页面 (○)
- 41 个动态路由 (ƒ)
- 1 个中间件 (Proxy)
- 总计: 74 个路由

---

## 5. 漏洞修复建议

### 🔴 紧急 (Critical)

```bash
# 方法 1: 强制覆盖 protobufjs 版本
# 在 package.json 的 pnpm.overrides 中添加:
pnpm:
  overrides:
    protobufjs: ">=7.5.5"
    serialize-javascript: ">=7.0.5"

# 然后执行
pnpm install
```

### 🟡 高优先级 (High)

```bash
# 升级 nodemailer
pnpm update nodemailer
```

### 🟢 建议

```bash
# 全面更新依赖
pnpm update --latest

# 重新审计
pnpm audit
```

---

## 6. 健康状态总结

| 检查项 | 状态 | 备注 |
|--------|------|------|
| package.json 有效 | ✅ | 版本 1.13.0 |
| pnpm lock 存在 | ✅ | 依赖版本锁定 |
| 安全漏洞 | 🔴 **5 个** | 1 Critical, 1 High |
| 构建成功 | ✅ | Turbopack 构建通过 |
| 总体评估 | ⚠️ **需关注** | 存在安全风险，建议尽快修复 |

---

## 7. 下次检查建议

- [ ] 修复 Critical 漏洞 (protobufjs)
- [ ] 升级 nodemailer 到 >=7.0.11
- [ ] 再次运行 `pnpm audit` 确认修复
- [ ] 考虑使用 `pnpm overrides` 强制锁定 protobufjs 版本

---

*报告生成: 2026-04-17 21:20 GMT+2*
*检查人: 🛡️ 系统管理员 (自动审计 Cron)*
