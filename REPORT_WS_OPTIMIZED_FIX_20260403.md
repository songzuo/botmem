# WebSocket 消息优化 TODO 修复报告

**日期**: 2026-04-03
**修复文件**: `src/lib/websocket/optimized-message.ts`
**修复人**: Bug修复专家 (子代理)

---

## 📋 修复的 TODO 列表

### 1. TODO: Send to WebSocket (Line ~237) - `send()` 方法

**原代码**:
```typescript
send(message: WebSocketMessage): void {
  // For now, just send directly
  // In production, this would integrate with Socket.IO
  const optimized = this.compressMessage(message)
  // TODO: Send to WebSocket
}
```

**修复后**:
```typescript
send(message: WebSocketMessage): void {
  const optimized = this.compressMessage(message)
  this.deliverMessage(optimized, message)
}
```

实现了 `deliverMessage()` 方法，支持多种发送渠道：
- 自定义回调函数 (`sendCallback`)
- Socket 实例直接发送
- Socket.IO 服务器实例广播

---

### 2. TODO: Send to WebSocket (Line ~246) - `sendImmediate()` 方法

**原代码**:
```typescript
sendImmediate(message: WebSocketMessage): void {
  const optimized = this.compressMessage(message)
  // TODO: Send to WebSocket
}
```

**修复后**:
```typescript
sendImmediate(message: WebSocketMessage): void {
  const optimized = this.compressMessage(message)
  this.deliverImmediate(optimized, message)
}
```

实现了 `deliverImmediate()` 方法，调用 `deliverMessage()` 进行立即发送。

---

### 3. TODO: Send batch to WebSocket (Line ~263) - `processBatch()` 方法

**原代码**:
```typescript
private processBatch(batch: MessageBatch): void {
  // TODO: Send batch to WebSocket
}
```

**修复后**:
```typescript
private processBatch(batch: MessageBatch): void {
  // Use custom batch send callback if provided
  if (this.batchSendCallback) {
    this.batchSendCallback(batch)
    return
  }

  // Compress the batch if beneficial
  const serialized = JSON.stringify(batch.messages)
  const originalSize = Buffer.byteLength(serialized, 'utf8')

  // Try compression for large batches
  if (originalSize > this.compressionConfig.thresholdBytes) {
    try {
      const compressed = gzipSync(serialized)
      if (compressed.length < originalSize) {
        this.deliverBatchCompressed(compressed, originalSize, batch)
        return
      }
    } catch (error) {
      console.warn('Batch compression failed:', error)
    }
  }

  // Deliver uncompressed batch
  this.deliverBatchUncompressed(batch)
}
```

实现了完整的批量消息处理：
- 支持自定义批处理回调
- 智能压缩（仅在有效时使用）
- 压缩/未压缩批量消息发送

---

## 🔧 实现的代码逻辑

### 新增类型定义

```typescript
// 发送回调类型
export type SendCallback = (message: WebSocketMessage | OptimizedMessage) => void

// 批量发送回调类型
export type BatchSendCallback = (batch: MessageBatch) => void

// 配置接口
export interface OptimizedMessageHandlerConfig {
  compression?: CompressionConfig
  sendCallback?: SendCallback
  batchSendCallback?: BatchSendCallback
  roomId?: string
  socket?: Socket
  server?: SocketIOServer
}
```

### 新增方法

| 方法 | 说明 |
|------|------|
| `onSend(callback)` | 设置单消息发送回调 |
| `onBatchSend(callback)` | 设置批量消息发送回调 |
| `setSocket(socket)` | 设置 Socket 实例 |
| `setServer(server)` | 设置 Socket.IO 服务器实例 |
| `setRoomId(roomId)` | 设置房间 ID |
| `deliverMessage(optimized, original)` | 内部消息分发方法 |
| `deliverImmediate(optimized, original)` | 立即发送消息 |
| `deliverBatchCompressed(compressed, originalSize, batch)` | 发送压缩批量消息 |
| `deliverBatchUncompressed(batch)` | 发送未压缩批量消息 |

### 发送优先级

1. **回调函数** (`sendCallback` / `batchSendCallback`)
2. **Socket 实例** (直接发送到客户端)
3. **服务器实例** (广播到房间或全局)

### 消息格式

**单消息（压缩）**:
```json
{
  "compressed": "base64-encoded-gzip-data",
  "originalSize": 2048,
  "roomId": "room-123"
}
```

**单消息（未压缩）**:
```json
{
  "type": "chat",
  "payload": { ... },
  "timestamp": 1234567890,
  "roomId": "room-123"
}
```

**批量消息（压缩）**:
```json
{
  "compressed": "base64-encoded-gzip-data",
  "originalSize": 4096,
  "count": 10,
  "roomId": "room-123",
  "timestamp": 1234567890
}
```

**批量消息（未压缩）**:
```json
{
  "messages": [ ... ],
  "count": 10,
  "roomId": "room-123",
  "timestamp": 1234567890
}
```

---

## ✅ 编译验证结果

```bash
npx tsc --noEmit --skipLibCheck src/lib/websocket/optimized-message.ts
```

**结果**: ✅ 编译成功，无错误

---

## 📝 使用示例

### 方式 1: 使用回调函数

```typescript
import { createOptimizedMessageHandler } from '@/lib/websocket/optimized-message'

const handler = createOptimizedMessageHandler({
  sendCallback: (message) => {
    // 自定义发送逻辑
    myWebSocket.send(JSON.stringify(message))
  },
  batchSendCallback: (batch) => {
    // 自定义批量发送逻辑
    myWebSocket.send(JSON.stringify(batch))
  }
})

handler.send({
  type: 'chat',
  payload: { text: 'Hello!' },
  timestamp: Date.now()
})
```

### 方式 2: 使用 Socket.IO 服务器

```typescript
import { createOptimizedMessageHandler } from '@/lib/websocket/optimized-message'
import { getServer } from '@/lib/websocket/server'

async function setupHandler() {
  const io = await getServer()
  
  const handler = createOptimizedMessageHandler({
    roomId: 'room-123'
  })
  
  if (io) {
    handler.setServer(io)
  }
  
  handler.send({
    type: 'chat',
    payload: { text: 'Hello!' },
    timestamp: Date.now()
  })
}
```

### 方式 3: 使用 Socket 实例（客户端）

```typescript
import { createOptimizedMessageHandler } from '@/lib/websocket/optimized-message'

const handler = createOptimizedMessageHandler({
  socket: socketInstance,
  roomId: 'room-123'
})

handler.send({
  type: 'chat',
  payload: { text: 'Hello!' },
  timestamp: Date.now()
})
```

---

## 📊 性能优化特性

1. **消息压缩**: 大于阈值的消息自动使用 gzip 压缩
2. **批量合并**: 多条小消息合并发送，减少网络开销
3. **Delta 更新**: 支持增量计算和同步
4. **灵活配置**: 可调整压缩阈值、批量大小、超时时间

---

## 📦 更新的导出

`src/lib/websocket/index.ts` 已更新，新增导出：

```typescript
export {
  // ... existing exports
  defaultCompressionConfig,
} from './optimized-message'

export type {
  // ... existing types
  SendCallback,
  BatchSendCallback,
  OptimizedMessageHandlerConfig,
} from './optimized-message'
```

---

**报告完成时间**: 2026-04-03 07:45 GMT+2
