# 🧪 7zi-frontend 测试状态报告

**生成时间**: 2026-03-30 01:33 GMT+2
**测试运行时长**: 169.46s

---

## 📊 测试概览

| 指标 | 数量 |
|------|------|
| **总测试数** | 1658 |
| **通过** | 1525 (91.97%) |
| **失败** | 120 (7.24%) |
| **跳过** | 13 (0.78%) |

| 指标 | 数量 |
|------|------|
| **测试文件总数** | 75 |
| **通过文件** | 42 (56%) |
| **失败文件** | 32 (42.67%) |
| **跳过文件** | 1 (1.33%) |

---

## ❌ 失败测试列表

### 1. 🔴 API 路由测试 (最严重)

#### `src/app/api/auth/__tests__/route.test.ts` (9 失败)
**问题**: Auth API 返回 500 而非预期的状态码

| 测试名称 | 预期状态 | 实际状态 |
|---------|----------|----------|
| 应该拒绝缺少用户名的请求 | 400 | 500 |
| 应该拒绝缺少密码的请求 | 400 | 500 |
| 应该成功注册新用户 | 201 | 500 |
| 应该拒绝无效的邮箱格式 | 400 | 500 |
| 应该拒绝弱密码 | 400 | 500 |
| 应该拒绝缺少必填字段的请求 | 400 | 500 |
| 应该成功重置密码 | 200 | 500 |
| 应该拒绝缺少 token | 400 | 500 |
| 应该拒绝缺少新密码 | 400 | 500 |

**失败模式**: API 内部错误 - Auth 模块可能未正确初始化或缺少依赖

---

#### `src/app/api/notifications/__tests__/route.test.ts` (12 失败)
**问题**: 认证/授权问题

| 测试名称 | 问题 |
|---------|------|
| should get notifications with no filters | 期望 200，实际 401 |
| should get notifications with type filter | mock 未调用 |
| should get notifications with priority filter | mock 未调用 |
| should get notifications with userId filter | mock 未调用 |
| should get notifications with teamId filter | mock 未调用 |
| should get notifications with taskId filter | mock 未调用 |
| should get notifications with read filter | mock 未调用 |
| should get notifications with since filter | mock 未调用 |
| should respect limit parameter | mock 未调用 |
| should use default limit of 50 | mock 未调用 |
| should handle errors | mock 未调用 |
| should handle combined filters | mock 未调用 |

**失败模式**: 认证失败 (401) 或 mock 未正确配置

---

#### `src/app/api/notifications/stats/__tests__/route.test.ts` (3 失败)
**问题**: 数据结构不匹配

| 测试名称 | 问题 |
|---------|------|
| 应该为管理员返回统计信息 | `data.data.total` 为 undefined，期望 100 |
| 应该按类型分组统计 | `data.data.total` 为 undefined |
| 应该按优先级分组统计 | `data.data.total` 为 undefined |

**失败模式**: API 返回的数据结构不符合测试预期

---

#### `src/app/api/data/import/__tests__/route.test.ts` (2 失败)
**问题**: 验证返回 500 而非 400

| 测试名称 | 预期状态 | 实际状态 |
|---------|----------|----------|
| 应该验证导入数据格式 | 400 | 500 |
| 应该拒绝无效的格式参数 | 400 | 500 |

**失败模式**: 数据验证逻辑未正确处理错误

---

#### `src/app/api/projects/__tests__/route.test.ts` (4 失败)
**问题**: 权限/验证逻辑问题

| 测试名称 | 预期状态 | 实际状态 |
|---------|----------|----------|
| 应该为管理员返回所有项目 | 200 | 403 |
| 应该为普通用户返回可访问的项目 | 200 | 403 |
| 应该拒绝缺少名称的项目创建 | 400 | 201 |
| 应该拒绝无权限的用户创建项目 | 403 | 201 |

**失败模式**: 权限检查逻辑问题 - 应该拒绝的请求被接受

---

#### `src/app/api/health/__tests__/route.test.ts` (3 失败)
**问题**: 健康检查返回 503

| 测试名称 | 预期状态 | 实际状态 |
|---------|----------|----------|
| 应该返回健康状态 | 200 | 503 |
| 应该包含内存信息 | 类型错误 | - |
| 应该返回没有正文的响应 | 200 | 503 |

**失败模式**: 健康检查依赖（如数据库）未连接

---

#### `src/app/api/search/__tests__/route.test.ts` (1 失败)
**问题**: 模块未找到

| 测试名称 | 问题 |
|---------|------|
| 应该拒绝未认证的请求 | Cannot find module '@/middleware/auth.middleware' |

**失败模式**: 缺少认证中间件文件

---

### 2. 🟡 WebSocket 相关测试 (8 失败)

#### `src/features/websocket/__tests__/integration.test.ts` (3 失败)
| 测试名称 | 问题 |
|---------|------|
| should throw error when non-member tries to send message | 期望抛出错误，但测试通过 |
| should sync offline messages when user comes online | 期望 > 0，实际 0 |
| should track unread message counts | 期望 3，实际 0 |

**失败模式**: WebSocket 权限检查和离线消息同步逻辑问题

---

#### `src/lib/__tests__/websocket-manager.test.ts` (5 失败)
| 测试名称 | 问题 |
|---------|------|
| should start heartbeat when connected | spy 未被调用 |
| should schedule reconnection with exponential backoff | 调用次数不匹配 |
| should increase delay exponentially | 调用次数不匹配 |
| should notify message listeners | spy 未被调用 |
| should allow removing message listeners | 调用次数为 0 |

**失败模式**: WebSocket mock 配置问题或事件监听器未正确触发

---

### 3. 🟠 Store 持久化测试 (2 失败)

#### `src/stores/__tests__/app-store.test.ts` (1 失败)
| 测试名称 | 问题 |
|---------|------|
| 应该从 localStorage 恢复设置 | 期望 true，实际 false |

#### `src/stores/__tests__/auth-store.test.ts` (1 失败)
| 测试名称 | 问题 |
|---------|------|
| 应该从 localStorage 恢复状态 | 期望用户对象，实际 null |

**失败模式**: localStorage mock 在测试环境中未正确工作

---

### 4. 🟢 通知增强服务测试 (7 失败)

#### `src/lib/services/__tests__/notification-enhanced.test.ts` (7 失败)
| 测试名称 | 问题 |
|---------|------|
| should not send email when email is disabled in preferences | 期望 false，实际 true |
| should not send email when notification priority is lower than threshold | 期望 false，实际 true |
| should not send email for medium/low priority by default | 期望 false，实际 true |
| should respect priority order | 期望 true，实际 false |
| should suppress email during quiet hours | 期望 false，实际 true |
| should handle quiet hours that span midnight | 期望 false，实际 true |
| should handle notifications without userId | 期望 false，实际 true |

**失败模式**: 通知偏好设置和静默时段逻辑未正确实现

---

### 5. 🟡 SEO 测试 (3 失败)

#### `src/test/seo/seo-sitemap.test.ts` (3 失败)
| 测试名称 | 问题 |
|---------|------|
| 应包含首页 | 期望 true，实际 false |
| 首页应有最高优先级 | undefined |
| 所有 URL 应使用相同的域名 | 期望包含 'https://7zi.com'，实际 'https://7zi.studio' |

**失败模式**: Sitemap 配置域名不匹配

---

### 6. 🟡 其他测试 (杂项)

#### `src/components/notifications/__tests__/NotificationProvider.test.tsx` (6 失败)
| 问题类型 | 数量 |
|---------|------|
| Cannot find module '@/hooks/useNotifications' | 5 |
| Re-render 计数问题 | 1 |

#### `src/lib/i18n/__tests__/client.test.ts` (1 失败)
| 测试名称 | 问题 |
|---------|------|
| should initialize i18next with correct config | spy 未被调用 |

#### `src/hooks/__tests__/useDebounce.test.ts` (1 失败)
| 测试名称 | 问题 |
|---------|------|
| maxWait 也可以被取消 | spy 被调用但不应被调用 |

---

## 📈 失败模式分类统计

| 失败模式 | 数量 | 占比 |
|---------|------|------|
| API 返回 500 而非预期状态码 | 18 | 15.0% |
| 认证/授权问题 (401/403) | 16 | 13.3% |
| Mock 未调用/未正确配置 | 25 | 20.8% |
| 数据结构不匹配 (undefined) | 12 | 10.0% |
| 验证逻辑问题 (应拒绝但接受) | 6 | 5.0% |
| 模块未找到 | 7 | 5.8% |
| localStorage mock 问题 | 2 | 1.7% |
| WebSocket/事件监听问题 | 8 | 6.7% |
| 通知偏好/静默时段逻辑 | 7 | 5.8% |
| 配置/域名不匹配 | 3 | 2.5% |
| 其他逻辑问题 | 16 | 13.3% |

---

## 🎯 修复优先级建议

### 🔴 P0 - 阻塞性问题 (立即修复)

1. **缺失模块**: `@/middleware/auth.middleware`
   - 影响: 2+ 测试文件无法运行
   - 操作: 创建缺失的认证中间件文件

2. **Auth API 返回 500**
   - 影响: 9 个测试失败
   - 操作: 检查 Auth API 依赖和初始化逻辑

3. **Health API 返回 503**
   - 影响: 3 个测试失败
   - 操作: 确保测试环境中数据库/依赖服务可用

### 🟠 P1 - 高优先级 (本周修复)

4. **Notifications API 认证问题**
   - 影响: 12 个测试失败
   - 操作: 修复 mock 配置或认证逻辑

5. **Projects API 权限问题**
   - 影响: 4 个测试失败
   - 操作: 修复权限检查逻辑（应拒绝但接受）

6. **通知偏好/静默时段逻辑**
   - 影响: 7 个测试失败
   - 操作: 实现/修复通知偏好检查逻辑

### 🟡 P2 - 中优先级 (下周修复)

7. **WebSocket 测试**
   - 影响: 8 个测试失败
   - 操作: 检查 WebSocket mock 配置和事件监听器

8. **Store 持久化测试**
   - 影响: 2 个测试失败
   - 操作: 修复测试环境中 localStorage mock

9. **Sitemap SEO 测试**
   - 影响: 3 个测试失败
   - 操作: 更新域名配置为 `https://7zi.com`

### 🟢 P3 - 低优先级 (后续迭代)

10. **NotificationProvider 测试**
    - 影响: 6 个测试失败
    - 操作: 创建 `@/hooks/useNotifications` 模块

11. **i18n 和其他杂项测试**
    - 影响: 3 个测试失败
    - 操作: 修复 mock 配置

---

## 📋 快速修复清单

```bash
# 1. 创建缺失的认证中间件
touch src/middleware/auth.middleware.ts

# 2. 检查 Auth API 依赖
pnpm install  # 确保所有依赖已安装

# 3. 更新 sitemap 域名配置
# 搜索 '7zi.studio' 替换为 '7zi.com'

# 4. 运行单个测试文件调试
pnpm test -- src/app/api/auth/__tests__/route.test.ts
```

---

## 📝 备注

- **通过率**: 91.97% 的测试通过，核心功能基本稳定
- **主要问题**: API 错误处理和 mock 配置
- **建议**: 优先修复 P0 阻塞性问题，确保测试环境配置正确
