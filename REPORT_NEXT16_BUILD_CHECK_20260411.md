# Next.js 16 迁移后构建稳定性检查报告
**时间**: 2026-04-11 07:35 GMT+2
**检查人**: Executor (子代理)

---

## 1. 构建检查 (pnpm build)

### ❌ 构建状态: 失败

**错误类型**: `better-sqlite3` 原生绑定文件未找到

**错误信息**:
```
Error: Could not locate the bindings file. Tried:
 → .../better-sqlite3/build/better_sqlite3.node
 → .../compiled/22.22.1/linux/x64/better_sqlite3.node
```

**影响范围**:
- 页面数据收集阶段失败
- 影响的 API 路由: `/api/admin/rate-limit/rules/[id]`
- 根本原因: `src/lib/rate-limit-dashboard/database.ts` 依赖 `better-sqlite3`

**错误堆栈**:
```
at new p.rateLimitRules (.next/server/chunks/...)
at module evaluation
```

### 警告 (非阻塞)

| 类型 | 数量 | 说明 |
|------|------|------|
| CSS 变量语法 | 5 | Tailwind CSS `/` 分隔符警告 |
| Turbopack 文件追踪 | 1 | `next.config.ts` 中意外文件追踪 |

**CSS 警告详情**:
```
Unexpected token Delim('/')
影响的类:
- .dark\:bg-\[var\(--color-blue-900\/30\)\]
- .dark\:bg-\[var\(--color-green-900\/30\)\]
- .dark\:bg-\[var\(--color-red-900\/10\)\]
- .dark\:bg-\[var\(--color-red-900\/30\)\]
- .dark\:bg-\[var\(--color-yellow-900\/30\)\]
```

---

## 2. .next 缓存检查

| 指标 | 值 |
|------|-----|
| 缓存大小 | 80MB |
| 状态 | ⚠️ 存在 Turbopack 追踪警告 |

**警告**: Turbopack 报告 `next.config.ts` 中存在意外的文件系统操作追踪，可能导致缓存污染。

```
Import trace:
  App Route:
    ./next.config.ts
    ./src/lib/rate-limit-dashboard/database.ts
    ./src/app/api/admin/security/blacklist/route.ts
```

**建议**: 清理 `.next/` 缓存 (`rm -rf .next`) 并重新构建

---

## 3. next.config.ts 配置检查

### ✅ 配置完整性: 良好

| 配置项 | 状态 |
|--------|------|
| TypeScript ignoreBuildErrors | ✅ 已启用 |
| React Strict Mode | ✅ 已启用 |
| Output (standalone) | ✅ 已配置 |
| Security Headers | ✅ 完整 |
| Image Optimization | ✅ 已配置 |
| React Compiler | ✅ 条件启用 |
| Webpack 代码分割 | ✅ 已优化 |
| Turbopack 警告 | ⚠️ 需关注 |

**未完成的配置**: 无

**潜在问题**:
- `experimental.reactCompiler` 配置在 Next.js 16 中可能需要调整为顶级配置 (已部分完成)

---

## 4. Lint 检查 (pnpm lint)

### ⚠️ 状态: 未完成 (超时)

lint 命令在 60 秒内未返回结果，可能是因为项目规模较大。

---

## 5. 关键发现与建议

### 严重问题 (P0)

1. **better-sqlite3 原生模块未编译**
   ```
   原因: pnpm 安装后未执行 rebuild，或 Node.js 版本不匹配
   解决: cd node_modules/.pnpm/better-sqlite3@12.8.0/node_modules/better-sqlite3 && npm run build-release
   或: pnpm rebuild better-sqlite3
   ```

### 中等问题 (P1)

1. **Turbopack 文件追踪警告**
   - 位置: `src/lib/rate-limit-dashboard/database.ts`
   - 问题: 使用了动态 `path.join(process.cwd(), 'data', bar)` 模式
   - 建议: 静态化路径引用或添加 `/*turbopackIgnore: true*/` 注释

2. **CSS 变量 opacity 语法**
   - 影响: Tailwind v4 兼容性警告
   - 建议: 监控 Tailwind 官方修复

### 建议行动

```bash
# 1. 修复 better-sqlite3
pnpm rebuild better-sqlite3

# 2. 清理缓存
rm -rf .next

# 3. 重新构建
pnpm build

# 4. 如仍有问题，检查 Node.js 版本
node --version  # 应为 v22.x
```

---

## 6. 总结

| 检查项 | 状态 | 说明 |
|--------|------|------|
| pnpm build | ❌ | better-sqlite3 绑定缺失 |
| .next 缓存 | ⚠️ | 80MB + Turbopack 警告 |
| next.config.ts | ✅ | 配置完整 |
| pnpm lint | ⚠️ | 超时未完成 |

**总体评估**: 🔴 构建阻塞 - 需要修复 `better-sqlite3` 原生模块问题后才能完成构建。
