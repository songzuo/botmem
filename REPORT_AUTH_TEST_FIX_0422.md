# 认证测试问题修复报告

**日期**: 2026-04-22
**任务**: 修复 `notifications` 和 `alerts/rules` API 测试认证 Mock 问题
**状态**: ✅ 完成

---

## 问题描述

两个测试文件的 POST 请求全部返回 403：
- `src/app/api/notifications/__tests__/route.test.ts`
- `src/app/api/alerts/rules/__tests__/route.test.ts`

所有测试（401/400/201/500 预期）都失败，实际返回 403 Forbidden。

---

## 根本原因分析

### 1. `alerts/rules` 测试 (POST 全部返回 403)

**原因**: `withCSRF` 中间件未在测试中 mock

```typescript
// POST handler 被 withCSRF 包装
export const POST = withCSRF(async (request: NextRequest) => {
  // CSRF 验证失败 → 403 Forbidden
})
```

测试文件只 mock 了 `uuid`，没有 mock `withCSRF` 中间件，导致实际的 CSRF 验证执行并失败。

### 2. `notifications` 测试 (部分返回 403)

**原因**: `notificationsCache` 单例在测试间污染

`notificationsCache` 是模块级单例，第一次测试填充缓存后，后续测试读取到脏数据。

### 3. `alerts/rules` 测试数据访问断言问题

`createBadRequestError` 返回格式是 `{ success, message, data: { details: [...] } }`，但测试期望直接访问 `data.details`。

---

## 修复方案

### 1. 添加 `withCSRF` Mock

参考 `src/app/api/feedback/__tests__/route.test.ts` 的正确模式：

```typescript
vi.mock('@/lib/middleware/csrf', () => ({
  withCSRF: (handler: Function) => handler, // Bypass CSRF validation
  generateCSRFToken: vi.fn(),
  getCSRFToken: vi.fn(),
  requiresCSRFProtection: vi.fn(() => false),
  extractCSRFToken: vi.fn(() => ({})),
}))
```

### 2. 添加 `notificationsCache` Mock

```typescript
vi.mock('@/lib/cache', () => ({
  createHotDataCache: vi.fn(() => ({
    get: vi.fn(() => null), // Always return null (cache miss) in tests
    set: vi.fn(),
    delete: vi.fn(),
    deleteByUser: vi.fn(),
    clear: vi.fn(),
  })),
  CachePresets: {...},
}))
```

### 3. 修正响应数据访问路径

`createBadRequestError` 返回结构：
```json
{
  "success": false,
  "message": "Validation failed",
  "data": { "details": [...] }
}
```

测试断言从 `data.details` 改为 `data.data.details`。

### 4. 修正认证错误响应格式

`createUnauthorizedError` 返回 `{ success, error: { type, message, timestamp } }` 而不是 `{ success, error: "Unauthorized" }`。

```typescript
// 修正前
expect(data.error).toBe('Unauthorized')

// 修正后
expect(data.error.type).toBe('UNAUTHORIZED')
```

### 5. 解决 `await import()` 动态导入问题

将动态 `import('../route')` 改为文件顶部的静态导入，避免模块缓存问题。

---

## 修改文件清单

| 文件 | 修改类型 |
|------|----------|
| `src/app/api/notifications/__tests__/route.test.ts` | 重写 Mock 设置 |
| `src/app/api/alerts/rules/__tests__/route.test.ts` | 重写 Mock 设置 |

---

## 测试结果

### 修复前
```
❌ notifications: 多个 403 + 缓存污染
❌ alerts/rules: POST 全部 403
```

### 修复后
```
✅ src/app/api/notifications/__tests__/route.test.ts: 25 passed
✅ src/app/api/alerts/rules/__tests__/route.test.ts: 11 passed
```

---

## 关键教训

1. **所有中间件都要 mock**：测试 API route 时，任何包装 handler 的中间件（如 `withCSRF`, `withAuth`）都需要 mock

2. **单例状态要 mock**：模块级单例（如缓存）会在测试间保持状态，必须 mock 或在 `beforeEach` 中清理

3. **先验证实际响应格式**：编写断言前，先确认 `createXxxError`/`createSuccessResponse` 的实际返回结构

4. **使用静态导入而非动态 `import()`**：在 vitest 中，动态 `import()` 可能遇到模块缓存问题
