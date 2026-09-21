# 🛡️ 安全漏洞修复报告

**日期**: 2026-04-17  
**审查人**: 系统管理员  
**状态**: 待修复

---

## 1. Critical: `serialize-javascript` RCE 漏洞

### 当前状态
- **已安装版本**: `4.0.0`
- **项目路径**: `/root/.openclaw/workspace/7zi-frontend/node_modules/serialize-javascript/package.json`

### 分析
- `serialize-javascript` 的 RCE 漏洞（CVE-2020-7660）在版本 **3.0.1** 中已修复
- 当前安装的是 **4.0.0**，该版本已包含安全修复
- **结论**: ✅ 无需修复，当前版本安全

### 建议
如需进一步提升安全性，可考虑：
```bash
npm install serialize-javascript@latest
```
或替换为更现代的序列化库如 `devalue`（Next.js 15 已采用）

---

## 2. High: `automation-engine.ts` 使用 `new Function()`

### 当前状态
- **文件路径**: `/root/.openclaw/workspace/7zi-frontend/src/lib/automation/automation-engine.ts`
- **风险等级**: High

### 发现的问题代码（3处）

#### 问题 1: 条件表达式验证 (行 440)
```typescript
new Function('ctx', `return ${sanitized}`)
```

#### 问题 2: 转换函数执行 (行 1065)
```typescript
const transformFn = new Function('data', 'ctx', transformConfig.transform)
```

#### 问题 3: 条件评估 (行 1134)
```typescript
const fn = new Function('ctx', `return ${expression}`)
```

### 当前缓解措施
` sanitizeExpression()` 方法过滤了以下关键字：
```typescript
['import', 'require', 'eval', 'Function', 'process', 'global', 'window']
```

### 风险分析
⚠️ **过滤不完整** — 仍可绕过：
- `constructor` 未被阻止 → 可访问原型链
- 方括号语法 `obj['constructor']` 未过滤
- 反引号 `` ` `` 未被过滤 → 可嵌套模板字符串
- `return` 语句可包含完整表达式

**攻击示例**：
```
constructor.constructor('return process')()
```

### 修复方案

#### 方案 A: 使用沙箱环境（推荐）
```typescript
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// 使用 vm 模块的沙箱
import vm from 'vm'

function safeEvaluate(expression: string, context: Record<string, unknown>): unknown {
  const sandbox = { ...context, Math, Date, JSON, Array, Object, String, Number, Boolean }
  vm.createContext(sandbox)
  vm.runInContext(expression, sandbox)
}
```

#### 方案 B: 使用 Function 构造但增强过滤
```typescript
private static sanitizeExpression(expression: string): string {
  const dangerous = [
    'import', 'require', 'eval', 'Function', 'process', 'global', 'window',
    'constructor', 'prototype', '__proto__', 'this', 'self',
    'return', 'throw', 'new', 'delete',
  ]
  
  let sanitized = expression
  
  for (const keyword of dangerous) {
    // 匹配完整单词（使用单词边界）
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
    sanitized = sanitized.replace(regex, '_FORBIDDEN_')
  }
  
  // 移除反引号
  sanitized = sanitized.replace(/`/g, '')
  
  // 验证结果仅包含安全字符
  if (!/^[\w\s+\-*/%()<>=!&|,.:\[\]{}'"]+$/.test(sanitized)) {
    throw new Error('表达式包含非法字符')
  }
  
  return sanitized
}
```

#### 方案 C: 使用表达式解析器（最安全）
```typescript
import { parse } from 'ExpressionParser' // 如 mathjs, expr-eval

function safeEvaluate(expression: string, context: Record<string, unknown>): unknown {
  const parser = new Parser()
  const ast = parser.parse(expression)
  return ast.evaluate(context)
}
```

### 建议优先级
1. **立即**: 在测试环境验证方案 A/B
2. **短期**: 实施沙箱方案
3. **长期**: 重构为表达式解析器

---

## 3. Medium: `feedback/route.ts` 硬编码 `@example.com` 邮箱

### 当前状态
- **文件路径**: `/root/.openclaw/workspace/7zi-frontend/src/app/api/feedback/route.ts`
- **风险等级**: Medium（低风险）

### 问题代码

| 行号 | 代码 | 说明 |
|------|------|------|
| 165 | `userEmail: \`${userId}@example.com\`` | 创建反馈时 |
| 253 | `feedbackStorage.addComment(..., \`${adminId}@example.com\`, ...)` | 更新反馈回复 |
| 352 | `feedbackStorage.addComment(..., \`${adminId}@example.com\`, ...)` | 发送回复 |

### 风险分析
- 这些是管理员用户ID生成的假邮箱
- `example.com` 是 RFC 保留域名，不会真实发送
- **实际风险较低**，但不符合最佳实践

### 修复方案

```typescript
// 方案 A: 使用内部标识符（推荐）
userEmail: `admin_${adminId}@system.local`

// 方案 B: 使用真实配置的域名
userEmail: `${adminId}@${process.env.APP_DOMAIN || '7zi.com'}`

// 方案 C: 使用占位符标记
userEmail: `admin-${adminId}@placeholder.invalid`
```

### 测试文件中的硬编码（可忽略）
`src/app/api/feedback/__tests__/` 和 `response/__tests__/` 中的 `@example.com` 仅用于测试数据，无需修复。

---

## 修复优先级总结

| 漏洞 | 等级 | 状态 | 优先级 |
|------|------|------|--------|
| serialize-javascript | Critical | ✅ 无需修复 (v4.0.0) | - |
| new Function() 动态代码执行 | High | ⚠️ 需修复 | **P1** |
| 硬编码 @example.com 邮箱 | Medium | ⚠️ 建议修复 | P2 |

---

## 修复行动计划

### P1: 修复 automation-engine.ts
1. 在 `sanitizeExpression()` 中添加 `constructor`、`prototype` 等关键字过滤
2. 移除反引号过滤
3. 添加正则表达式验证
4. 编写单元测试验证绕过

### P2: 修复 feedback/route.ts
1. 将硬编码 `example.com` 替换为环境变量或内部标识符
2. 更新相关测试用例

---

**报告生成时间**: 2026-04-17 22:48 GMT+2
