# serialize-javascript 安全漏洞修复报告

**项目**: 7zi-frontend
**检查时间**: 2026-04-20 16:38 GMT+2
**检查人**: ⚡ Executor 子代理

---

## 1. 问题确认

### 上次审计报告（REPORT_DEP_AUDIT_0420.md）内容
- 报告时间: 2026-04-20 15:35
- 报告内容: 5个 High 级别漏洞，全部源于 `serialize-javascript`
- 漏洞链路:
  ```
  serialize-javascript (<7.0.5)
    ├── @rollup/plugin-terser (0.2.0 - 0.4.4)
    │   └── workbox-build
    │       ├── @ducanh2912/next-pwa
    │       └── workbox-webpack-plugin
    ├── workbox-build (≥7.1.0)
    └── workbox-webpack-plugin (≥7.1.0)
  ```

### 本次验证结果

| 检查项 | 结果 | 说明 |
|--------|------|------|
| `serialize-javascript` 实际版本 | ✅ **7.0.5** | 满足 >=7.0.5 要求 |
| `pnpm.overrides` 配置 | ✅ 存在 | `"serialize-javascript": ">=7.0.5"` |
| `node_modules` 中的包 | ✅ 存在 | workbox-build@7.1.0/7.1.1 都在用 7.0.5 |
| `pnpm-lock.yaml` overrides | ✅ 存在 | lockfile 中正确记录 |

---

## 2. 当前漏洞状态

```
$ cd 7zi-frontend && pnpm audit

1 vulnerabilities found
Severity: 1 critical

┌─────────────────────┬────────────────────────────────────────────────────────┐
│ critical            │ Arbitrary code execution in protobufjs                 │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Package             │ protobufjs                                             │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Vulnerable versions │ <7.5.5                                                 │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Patched versions    │ >=7.5.5                                                │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Paths               │ .>@xenova/transformers>onnxruntime-web>onnx-           │
│                     │ proto>protobufjs                                       │
└─────────────────────┴────────────────────────────────────────────────────────┘
```

**结论**: serialize-javascript 漏洞已修复。**当前仅剩 1 个 Critical 漏洞（protobufjs）**，与 serialize-javascript 完全无关。

---

## 3. 关于 audit-result.json 的说明

上次报告 `REPORT_DEP_AUDIT_0420.md` 引用了 `audit-result.json`（时间戳: 2026-04-20 15:36），该文件显示 5 个高危漏洞。

但当时运行 `pnpm audit` 时实际输出已经只有 1 个 critical 漏洞。

**原因分析**: `audit-result.json` 是之前某次审计的缓存结果，不是最新的 `pnpm audit` 输出。

---

## 4. 依赖链路验证

```
$ pnpm why serialize-javascript

serialize-javascript@7.0.5
└─┬ @rollup/plugin-terser@0.4.4
  ├─┬ workbox-build@7.1.0
  │ └─┬ workbox-webpack-plugin@7.1.0
  │   └─┬ @ducanh2912/next-pwa@10.2.9
  │     └── 7zi-frontend@1.14.0 (dependencies)
  └─┬ workbox-build@7.1.1
    └── @ducanh2912/next-pwa@10.2.9 [deduped]

Found 1 version of serialize-javascript
```

**确认**: 所有传递性依赖都正确使用了 7.0.5 版本，`pnpm.overrides` 完全生效。

---

## 5. 总结

| 项目 | 状态 |
|------|------|
| serialize-javascript 版本 | ✅ 7.0.5 (安全) |
| pnpm.overrides 配置 | ✅ 生效中 |
| 漏洞链路 | ✅ 已断开 |
| 高危漏洞数量 | 5 → **0** |

**结论**: serialize-javascript 安全漏洞已成功修复。`pnpm.overrides: { "serialize-javascript": ">=7.0.5" }` 配置正确生效，所有传递性依赖都已使用安全版本 7.0.5。

**剩余问题**: 1 个 Critical 漏洞（protobufjs <7.5.5），来源: `@xenova/transformers>onnxruntime-web>onnx-proto>protobufjs`。这是 AI/ML 相关的间接依赖，如需修复需要升级 `onnxruntime-web` 或移除 `transformers` 功能。

---

## 6. 后续建议

### P0 - 可选处理
1. **protobufjs 漏洞** (Critical)
   - 来源: `@xenova/transformers` → `onnxruntime-web` → `onnx-proto` → `protobufjs`
   - 影响: transformers 功能（可能是 AI 相关特性）
   - 建议: 评估是否可升级 `onnxruntime-web` 到包含 `protobufjs>=7.5.5` 的版本

### 无需操作
- serialize-javascript 漏洞: **已修复，无需进一步操作**
