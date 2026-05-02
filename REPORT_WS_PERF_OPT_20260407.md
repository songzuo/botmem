# WebSocket 高并发性能优化分析报告

**日期:** 2026-04-07  
**角色:** 咨询师  
**任务:** WebSocket 在高并发场景下的表现优化

---

## 1. 代码审查范围

| 文件 | 用途 | 行数 |
|------|------|------|
| `websocket-manager/WebSocketConnectionManager.ts` | Node.js 客户端 (ws 库) | ~550 |
| `src/lib/websocket/server.ts` | Socket.IO 服务端 | ~1250 |
| `src/lib/websocket/rooms.ts` | 房间管理 | ~900 |
| `src/lib/websocket/compression/compression-manager.ts` | 消息压缩 | ~450 |
| `src/lib/websocket/message-store.ts` | 消息存储 | ~400 |

---

## 2. 当前配置参数

### 2.1 Socket.IO 服务端配置 (server.ts:1187-1196)

```typescript
io = new SocketIOServer(httpServer, {
  path: '/api/ws',
  cors: { origin: allowedOrigin, methods: ['GET', 'POST'], credentials: true },
  transports: ['websocket', 'polling'],
  pingTimeout: 45000,        // 45秒
  pingInterval: 25000,       // 25秒
  maxHttpBufferSize: 1e8,    // 100MB
})
```

### 2.2 心跳检测 (server.ts:1148-1161)

- **服务器端心跳超时:** 120000ms (2分钟)，每 10 秒检查一次
- **客户端 (WebSocketConnectionManager):** heartbeatInterval=30000ms, heartbeatTimeout=10000ms

### 2.3 消息队列配置

- **maxQueueSize:** 100 (客户端)
- **messageExpiry:** 300000ms (5分钟)
- **离线消息 TTL:** 7天 (messageStore)
- **消息历史上限:** 10000 (messageStore)

---

## 3. 性能瓶颈分析

### 🔴 高优先级瓶颈

#### 3.1 `rooms.ts` - Map 无大小限制

```typescript
// rooms.ts - Room.participants 是无限制的 Map
participants: Map<string, RoomParticipant>
invites: Set<string>  // 无大小限制
```

**问题:** 单个房间可无限膨胀，所有用户数据常驻内存。万人房间会导致 V8 heap 压力。

#### 3.2 `server.ts` - 每次事件处理都调用 `initializeCoreModules()`

```typescript
function setupSocketHandlers(socket: AuthenticatedSocket): void {
  initializeCoreModules()  // ← 每个连接都调用，包括每次事件
}
```

**问题:** 每个 socket 的每个事件都会重复检查模块是否初始化，虽然只是轻量级 if 判断，但在高频事件下有不必要的开销。

#### 3.3 `messageStore` 无容量硬限制

```typescript
// messageStore.ts - 离线消息队列无上限
maxOfflineMessages: 100  // 配置存在，但未在 queueOfflineMessage 中严格校验
```

**问题:** `queueOfflineMessage` 没有实际检查队列大小，高并发场景下内存可能爆炸。

#### 3.4 离线消息检查 O(n) 复杂度

```typescript
// server.ts:814 - 对每个参与者遍历检查在线状态
const onlineUserIds = new Set(
  Array.from(io?.sockets.sockets.values() || [])
    .filter(s => (s as AuthenticatedSocket).data.rooms?.has(roomId))
    .map(s => (s as AuthenticatedSocket).data.user.id)
)
for (const participant of participants) {
  if (!onlineUserIds.has(participant.id)) {
    messageStore!.queueOfflineMessage(participant.id, storedMessage)
  }
}
```

**问题:** 每次发消息都遍历所有 sockets 构建 Set，n 个房间 * m 个参与者 = O(n*m) 复杂度。高并发下严重拖累。

#### 3.5 `broadcastToRoom` 对每个消息都调用 `io.to(roomId).emit()`

```typescript
// server.ts 广播实现
function broadcastToRoom(roomId: string, event: string, data: unknown): void {
  if (!io) return
  io.to(roomId).emit(event, data)  // 无批处理
}
```

**问题:** 协作编辑场景下 (cursor:move, selection:update)，每秒可能几十次广播，每次都触发 Socket.IO 内部序列化。

---

### 🟡 中优先级瓶颈

#### 3.6 pingInterval/pingTimeout 配置不匹配

- 客户端 `pingInterval`: 30000ms
- 服务端 `pingInterval`: 25000ms
- 客户端 `heartbeatTimeout`: 10000ms
- 服务端 `heartbeatTimeout`: 120000ms (2分钟)

**问题:** 客户端 25-30 秒发一次 ping，但服务端只等 10 秒 pong 就认为超时，配置严重不匹配。

#### 3.7 每次 `message:send` 都查询数据库/消息存储

```typescript
// server.ts:792 - store() 每次都写入
const storedMessage = messageStore!.store({ ... })
```

**问题:** 高频聊天场景下，同步写入消息存储会造成 IO 瓶颈。应改为批量写入或异步队列。

#### 3.8 缺少连接数限制

```typescript
// server.ts - 无 maxConnections 限制
io = new SocketIOServer(httpServer, { ... })
```

**问题:** 无单一进程最大连接数限制，可能导致资源耗尽。

#### 3.9 Heartbeat 检查间隔过长

```typescript
// server.ts:1148 - 每 10000ms 才检查一次
setInterval(() => {
  ioServer?.sockets.sockets.forEach(socket => { ... })
}, 10000)
```

**问题:** 10 秒间隔太长，百万连接场景下，一次遍历耗时数百毫秒，且死连接清理不及时。

#### 3.10 消息压缩未启用或未集成

```typescript
// compression-manager.ts 存在但 server.ts 中未使用
// server.ts 中没有启用 Socket.IO 的压缩选项
io = new SocketIOServer(httpServer, {
  // 缺少: compression: { threshold: 1024 }
})
```

---

### 🟢 低优先级建议

#### 3.11 重复的颜色生成函数

```typescript
// server.ts:132 - _generateColor 是 RoomManager.generateColor 的重复
function _generateColor(userId: string): string {
  const colors = [...13 colors...]
  const hash = userId.split('').reduce(...)
  return colors[hash % colors.length]
}
```

**问题:** 仅 13 种颜色，万人房间碰撞概率高。

#### 3.12 `// @ts-nocheck` 大量使用

server.ts、rooms.ts 等多个核心文件头部有 `// @ts-nocheck`，隐藏了大量潜在类型错误。

---

## 4. 高并发场景推算

| 场景 | 连接数 | 消息频率 | 瓶颈 |
|------|--------|----------|------|
| 实时协作编辑 | 1000 | 50条/秒 (cursor) | 广播 O(n*m) |
| 直播弹幕 | 10000 | 500条/秒 | 消息存储写入 |
| 万人房间 | 10000 | 10条/秒 | Room Map 膨胀 |

---

## 5. 优化建议 (按优先级)

### P0 - 必须修复

#### 5.1 修复心跳配置不匹配

```typescript
// server.ts - Socket.IO 配置
pingTimeout: 60000,    // 从 45000 改为 60000
pingInterval: 15000,   // 从 25000 改为 15000

// websocket-manager/WebSocketConnectionManager.ts
heartbeatInterval: 15000,   // 从 30000 改为 15000
heartbeatTimeout: 45000,   // 从 10000 改为 45000
```

#### 5.2 修复在线用户检查算法

```typescript
// 方案: 维护 roomId -> Set<userId> 的在线索引
const onlineIndex = new Map<string, Set<string>>()

// 连接时加入索引
socket.on('room:join', (...) => {
  if (!onlineIndex.has(roomId)) onlineIndex.set(roomId, new Set())
  onlineIndex.get(roomId)!.add(user.id)
})

// 离线消息检查 O(1)
const onlineUsers = onlineIndex.get(roomId) || new Set()
for (const participant of participants) {
  if (!onlineUsers.has(participant.id)) {
    messageStore!.queueOfflineMessage(participant.id, storedMessage)
  }
}
```

#### 5.3 给 Room.participants 加容量限制

```typescript
// rooms.ts - RoomConfig 增加
interface RoomConfig {
  maxParticipants?: number  // 默认 100
}

// join 时检查
if (room.participants.size >= room.config.maxParticipants) {
  return { success: false, error: 'Room is full' }
}
```

### P1 - 重要优化

#### 5.4 消息批量写入

```typescript
// messageStore 增加批量模式
interface MessageStore {
  store(message: StoredMessage): void
  flush(): void  // 定时批量写入
}

// server.ts - 高频场景每 100ms 批量提交
const messageBuffer: StoredMessage[] = []
socket.on('message:send', (data) => {
  messageBuffer.push(messageStore!.store(data, { delayWrite: true }))
  
  if (messageBuffer.length >= 50) {
    messageStore!.flush()
  }
})

// 定时 flush
setInterval(() => messageStore!.flush(), 100)
```

#### 5.5 连接数限制

```typescript
// server.ts
const MAX_CONNECTIONS_PER_PROCESS = 10000
io = new SocketIOServer(httpServer, {
  ...,
  maxConnections: MAX_CONNECTIONS_PER_PROCESS,
})

io.use((socket, next) => {
  if (io?.sockets.sockets.size >= MAX_CONNECTIONS_PER_PROCESS) {
    return next(new Error('Server at capacity'))
  }
  next()
})
```

#### 5.6 启用 Socket.IO 压缩

```typescript
io = new SocketIOServer(httpServer, {
  // ...
  // 启用 perMessageDeflate (需要 socket.io-adapter)
  transports: ['websocket'],  // 高并发只保留 websocket，禁用 polling
})
```

### P2 - 进一步优化

#### 5.7 Heartbeat 检查频率提升

```typescript
// server.ts - 从 10s 改为 5s
setInterval(() => {
  const now = Date.now()
  const timeoutThreshold = 60000  // 1分钟无心跳断开
  ioServer?.sockets.sockets.forEach(socket => {
    const elapsed = now - ((socket as AuthenticatedSocket).data.lastHeartbeat || 0)
    if (elapsed > timeoutThreshold) {
      socket.disconnect(true)
    }
  })
}, 5000)
```

#### 5.8 离线消息队列硬限制

```typescript
// messageStore.ts - queueOfflineMessage 增加严格限制
const MAX_OFFLINE_PER_USER = 100
if (userOfflineMessages.length >= MAX_OFFLINE_PER_USER) {
  userOfflineMessages.shift()  // 丢弃最旧的
}
```

#### 5.9 Cursor/Selection 事件节流

```typescript
// 前端或中间件层
let lastCursorSend = 0
socket.on('cursor:move', throttle((data) => {
  const now = Date.now()
  if (now - lastCursorSend < 50) return  // 最多20fps
  lastCursorSend = now
  // 处理
}, 50))
```

---

## 6. 架构层面建议

| 问题 | 方案 | 收益 |
|------|------|------|
| 单进程连接上限 | Redis Adapter + 多进程 + Sticky Sessions | 线性扩展 |
| 消息存储 IO | 换用 Redis Stream 或队列 | 解耦写入 |
| 房间广播性能 | 改用 Redis Pub/Sub 分发 | 降低主进程负载 |
| 大房间 (1000+) | 分离 "房间服务" 微服务 | 隔离故障 |
| 消息压缩 | 集成 compression-manager 到 server.ts | 节省带宽 |

---

## 7. 快速修复清单 (1小时内可完成)

- [ ] 统一 pingInterval/pingTimeout 和客户端心跳配置
- [ ] 修复 `initializeCoreModules()` 只调用一次 (移到 setupServer)
- [ ] 移除 `// @ts-nocheck`，逐文件修复类型问题
- [ ] RoomConfig 增加 `maxParticipants` 并在 join 时校验
- [ ] 修复离线消息队列的容量硬限制
- [ ] 简化 `_generateColor`，增加颜色池到 64+ 种

---

**报告生成时间:** 2026-04-07 17:45 GMT+2  
**分析师:** 咨询师子代理
