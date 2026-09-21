# Webhook 事件系统实现报告

**版本**: v1.12.2
**日期**: 2026-04-04
**主题**: 工作流持久化与用户体验优化

---

## 📋 概述

Webhook 事件系统为 7zi-frontend 项目提供了强大的外部集成能力，允许工作流与外部系统进行实时通信。该系统支持多种事件类型、自动重试、签名验证和完整的日志记录。

---

## 🎯 支持的事件类型

### 工作流事件
| 事件类型 | 描述 | 触发时机 |
|---------|------|---------|
| `workflow.started` | 工作流启动 | 工作流开始执行时 |
| `workflow.completed` | 工作流完成 | 工作流成功完成时 |
| `workflow.failed` | 工作流失败 | 工作流执行失败时 |
| `workflow.paused` | 工作流暂停 | 工作流被暂停时 |
| `workflow.resumed` | 工作流恢复 | 工作流从暂停状态恢复时 |
| `workflow.cancelled` | 工作流取消 | 工作流被取消时 |

### 节点执行事件
| 事件类型 | 描述 | 触发时机 |
|---------|------|---------|
| `workflow.node.executed` | 节点执行 | 节点执行完成时 |
| `workflow.node.started` | 节点开始 | 节点开始执行时 |
| `workflow.node.completed` | 节点完成 | 节点成功完成时 |
| `workflow.node.failed` | 节点失败 | 节点执行失败时 |

### 告警事件
| 事件类型 | 描述 | 触发时机 |
|---------|------|---------|
| `alert.triggered` | 告警触发 | 告警规则被触发时 |
| `alert.resolved` | 告警解决 | 告警状态恢复为正常时 |
| `alert.escalated` | 告警升级 | 告警级别提升时 |

### 监控事件
| 事件类型 | 描述 | 触发时机 |
|---------|------|---------|
| `monitoring.threshold.exceeded` | 阈值超过 | 监控指标超过阈值时 |
| `monitoring.service.down` | 服务宕机 | 检测到服务不可用时 |

### 自定义事件
| 事件类型 | 描述 | 触发时机 |
|---------|------|---------|
| `custom.event` | 自定义事件 | 用户自定义触发时机 |

---

## 📁 创建/修改的文件

### 核心模块
1. **`src/lib/webhook/types.ts`** (7,710 字节)
   - 定义所有 Webhook 相关类型
   - 事件类型、订阅配置、交付记录、日志等
   - 完整的 TypeScript 类型定义

2. **`src/lib/webhook/delivery.ts`** (6,906 字节)
   - Webhook 交付服务
   - HTTP POST 请求发送
   - 超时处理（默认 10 秒）
   - 指数退避重试机制
   - 交付记录管理

3. **`src/lib/webhook/WebhookManager.ts`** (16,099 字节)
   - Webhook 管理器核心
   - 订阅 CRUD 操作
   - 事件触发和分发
   - HMAC-SHA256 签名验证
   - 日志记录和管理
   - 本地存储持久化

4. **`src/lib/webhook/index.ts`** (350 字节)
   - 模块导出

### React Hooks
5. **`src/hooks/useWebhooks.ts`** (11,286 字节)
   - `useWebhooks` - 主管理 Hook
   - `useWebhookSubscription` - 单个订阅 Hook
   - `useWebhookLogs` - 日志查看 Hook
   - `useWebhookEventTypes` - 事件类型 Hook
   - `useWebhookTest` - 测试 Hook

### UI 组件
6. **`src/components/webhook/WebhookConfigPanel.tsx`** (12,323 字节)
   - Webhook 配置面板
   - 创建/编辑订阅
   - 事件类型选择
   - 密钥生成和管理
   - 表单验证

7. **`src/components/webhook/WebhookList.tsx`** (12,818 字节)
   - Webhook 列表展示
   - 批量操作（启用/禁用/删除）
   - 测试功能
   - 状态显示

8. **`src/components/webhook/WebhookLogViewer.tsx`** (6,485 字节)
   - 日志查看器
   - 级别过滤
   - 自动刷新
   - 上下文详情

9. **`src/components/webhook/index.ts`** (207 字节)
   - 组件导出

### 工作流集成
10. **`src/lib/workflow/VisualWorkflowOrchestrator.ts`** (修改)
    - 集成 Webhook 触发点
    - 工作流启动/完成/失败事件
    - 节点执行/失败事件
    - 自动触发相应 Webhook

### 测试
11. **`src/lib/webhook/__tests__/webhook.test.ts`** (10,812 字节)
    - 完整的单元测试
    - 订阅管理测试
    - 事件触发测试
    - 签名验证测试
    - 交付服务测试

### 导出更新
12. **`src/hooks/index.ts`** (修改)
    - 导出 Webhook 相关 Hooks

---

## ⚙️ Webhook 配置说明

### 创建订阅

```typescript
import { webhookManager } from '@/lib/webhook';

const subscription = await webhookManager.createSubscription({
  name: '工作流完成通知',
  description: '当工作流完成时发送通知',
  url: 'https://example.com/webhook',
  secret: 'your-secret-key', // 可选，留空自动生成
  events: ['workflow.completed', 'workflow.failed'],
  isActive: true,
  headers: {
    'X-Custom-Header': 'value',
  },
  retryCount: 3, // 最大重试次数
  timeout: 10000, // 超时时间（毫秒）
});
```

### 事件数据结构

#### 工作流事件
```json
{
  "id": "evt_1234567890_abc123",
  "type": "workflow.completed",
  "timestamp": "2026-04-04T15:30:00.000Z",
  "source": "workflow-orchestrator",
  "data": {
    "workflowId": "wf_123",
    "workflowName": "数据处理工作流",
    "workflowVersion": 1,
    "executionId": "exec_456",
    "duration": 5000,
    "metadata": {
      "outputs": { "result": "success" },
      "progress": { "total": 10, "completed": 10, "failed": 0 }
    }
  }
}
```

#### 节点事件
```json
{
  "id": "evt_1234567890_def456",
  "type": "workflow.node.executed",
  "timestamp": "2026-04-04T15:30:05.000Z",
  "source": "workflow-orchestrator",
  "data": {
    "workflowId": "wf_123",
    "workflowName": "数据处理工作流",
    "executionId": "exec_456",
    "nodeId": "node_789",
    "nodeName": "数据清洗",
    "nodeType": "transform",
    "duration": 1000,
    "metadata": {
      "outputs": { "cleaned": true },
      "status": "success"
    }
  }
}
```

### 签名验证

Webhook 请求包含以下签名头：

- `X-7zi-Signature`: HMAC-SHA256 签名
- `X-7zi-Timestamp`: 时间戳（毫秒）

#### 验证签名（Node.js 示例）

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, timestamp, secret) {
  // 检查时间偏差（5 分钟内）
  const now = Date.now();
  const age = now - timestamp;
  if (age > 5 * 60 * 1000 || age < -5 * 60 * 1000) {
    return false;
  }

  // 生成预期签名
  const data = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');

  // 常量时间比较
  const actualSignature = signature.replace('sha256=', '');
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(actualSignature)
  );
}
```

#### 验证签名（Python 示例）

```python
import hmac
import hashlib
import time

def verify_webhook(payload, signature, timestamp, secret):
    # 检查时间偏差（5 分钟内）
    now = int(time.time() * 1000)
    age = now - timestamp
    if age > 5 * 60 * 1000 or age < -5 * 60 * 1000:
        return False

    # 生成预期签名
    data = f"{timestamp}.{payload}"
    expected_signature = hmac.new(
        secret.encode(),
        data.encode(),
        hashlib.sha256
    ).hexdigest()

    # 比较签名
    actual_signature = signature.replace('sha256=', '')
    return hmac.compare_digest(expected_signature, actual_signature)
```

---

## 🔌 API 设计说明

### WebhookManager API

#### 订阅管理

```typescript
// 创建订阅
createSubscription(input: CreateWebhookInput): Promise<WebhookSubscription>

// 更新订阅
updateSubscription(id: string, input: UpdateWebhookInput): Promise<WebhookSubscription>

// 删除订阅
deleteSubscription(id: string): Promise<boolean>

// 批量删除
batchDeleteSubscriptions(ids: string[]): Promise<BatchDeleteResult>

// 批量更新状态
batchUpdateStatus(ids: string[], isActive: boolean): Promise<WebhookSubscription[]>

// 获取订阅
getSubscription(id: string): WebhookSubscription | undefined

// 获取所有订阅
getAllSubscriptions(): WebhookSubscription[]

// 获取激活的订阅
getActiveSubscriptions(): WebhookSubscription[]
```

#### 事件处理

```typescript
// 触发事件
triggerEvent(event: WebhookEvent): Promise<WebhookDelivery[]>

// 测试订阅
testSubscription(id: string): Promise<TestEventResult>
```

#### 签名验证

```typescript
// 生成签名
generateSignature(payload: string, timestamp: number, secret: string): string

// 验证签名
verifySignature(
  payload: string,
  signature: string,
  timestamp: number,
  secret: string,
  maxAge?: number
): SignatureValidationResult
```

#### 日志管理

```typescript
// 记录日志
log(level: WebhookLogLevel, message: string, context?: Record<string, unknown>): void

// 获取日志
getLogs(
  subscriptionId?: string,
  deliveryId?: string,
  level?: WebhookLogLevel,
  limit?: number
): WebhookLog[]
```

### WebhookDeliveryService API

```typescript
// 发送交付
send(input: CreateDeliveryInput, timeout?: number): Promise<WebhookDelivery>

// 获取交付记录
getDelivery(id: string): WebhookDelivery | undefined

// 获取订阅的交付记录
getDeliveriesBySubscription(subscriptionId: string): WebhookDelivery[]

// 获取事件的交付记录
getDeliveriesByEvent(eventId: string): WebhookDelivery[]

// 清理旧记录
cleanupOldDeliveries(olderThan: string): number
```

### React Hooks API

#### useWebhooks

```typescript
const {
  subscriptions,      // 订阅列表
  logs,              // 日志列表
  isLoading,         // 加载状态
  error,             // 错误信息
  loadSubscriptions, // 加载订阅
  loadLogs,          // 加载日志
  createSubscription, // 创建订阅
  updateSubscription, // 更新订阅
  deleteSubscription, // 删除订阅
  batchDeleteSubscriptions, // 批量删除
  batchUpdateStatus, // 批量更新状态
  testSubscription,  // 测试订阅
} = useWebhooks();
```

#### useWebhookSubscription

```typescript
const {
  subscription,      // 订阅详情
  deliveries,        // 交付记录
  isLoading,         // 加载状态
  error,             // 错误信息
  loadSubscription,  // 加载订阅
  updateSubscription, // 更新订阅
  deleteSubscription, // 删除订阅
  testSubscription,  // 测试订阅
} = useWebhookSubscription(subscriptionId);
```

#### useWebhookLogs

```typescript
const {
  logs,              // 日志列表
  isLoading,         // 加载状态
  loadLogs,          // 加载日志
} = useWebhookLogs(subscriptionId, deliveryId, level, limit);
```

---

## 🔄 重试机制

### 指数退避算法

```
延迟 = min(base * 2^(attempt-1), max)

其中：
- base = 1000ms（1 秒）
- max = 30000ms（30 秒）
- attempt = 当前尝试次数（从 1 开始）
```

### 重试条件

以下情况会触发重试：

1. **网络错误**（无状态码）
2. **5xx 服务器错误**（500-599）
3. **429 Too Many Requests**
4. **408 Request Timeout**

### 重试限制

- 默认最大重试次数：3 次
- 最大延迟：30 秒
- 总重试时间：最多 7 秒（1s + 2s + 4s）

---

## 📊 交付状态

| 状态 | 描述 | HTTP 状态码 |
|------|------|------------|
| `pending` | 等待发送 | - |
| `success` | 发送成功 | 2xx |
| `failed` | 发送失败 | 4xx（非 429/408） |
| `retrying` | 等待重试 | 5xx, 429, 408, 网络错误 |
| `timeout` | 请求超时 | - |

---

## 🔒 安全特性

### 1. HMAC-SHA256 签名

- 使用共享密钥生成签名
- 防止请求被篡改
- 支持时间戳验证（防止重放攻击）

### 2. 时间戳验证

- 默认时间偏差：±5 分钟
- 拒绝过期或未来的请求

### 3. 常量时间比较

- 防止时序攻击
- 安全的签名验证

### 4. HTTPS 强制

- 建议使用 HTTPS 端点
- 保护传输数据安全

---

## 📝 使用示例

### React 组件中使用

```tsx
import { WebhookList } from '@/components/webhook';

export default function WebhookPage() {
  return (
    <div className="container mx-auto p-6">
      <WebhookList />
    </div>
  );
}
```

### 手动触发事件

```typescript
import { webhookManager } from '@/lib/webhook';

const event = {
  id: 'evt_custom',
  type: 'custom.event' as const,
  timestamp: new Date().toISOString(),
  source: 'my-app',
  data: {
    eventName: 'user.signup',
    data: {
      userId: '123',
      email: 'user@example.com',
    },
  },
};

await webhookManager.triggerEvent(event);
```

---

## 🧪 测试覆盖

- ✅ 订阅 CRUD 操作
- ✅ 事件触发和分发
- ✅ 签名生成和验证
- ✅ 交付发送和重试
- ✅ 日志记录和查询
- ✅ 批量操作
- ✅ 错误处理

---

## 📈 性能优化

1. **事件队列限制**：最多保留 1000 条事件
2. **日志限制**：最多保留 1000 条日志
3. **自动清理**：支持清理旧的交付记录
4. **并发发送**：多个订阅并发发送
5. **本地存储**：订阅配置持久化到 localStorage

---

## 🚀 未来扩展

1. **更多事件类型**：支持更多业务场景
2. **事件过滤**：支持基于内容的过滤
3. **批量发送**：支持批量事件发送
4. **Webhook 模板**：预定义常用配置
5. **监控面板**：可视化监控 Webhook 状态
6. **告警集成**：Webhook 失败时发送告警

---

## 📚 相关文档

- [Webhook 类型定义](../src/lib/webhook/types.ts)
- [Webhook 管理器](../src/lib/webhook/WebhookManager.ts)
- [交付服务](../src/lib/webhook/delivery.ts)
- [React Hooks](../src/hooks/useWebhooks.ts)
- [UI 组件](../src/components/webhook/)

---

**实现完成时间**: 2026-04-04 17:50 GMT+2
**实现者**: Executor 子代理
**版本**: v1.12.2