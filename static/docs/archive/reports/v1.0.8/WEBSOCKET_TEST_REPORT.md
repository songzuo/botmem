# WebSocket 稳定性测试报告

**测试员**: 🧪 测试员
**项目**: 7zi-frontend
**测试日期**: 2026-03-22
**任务**: WebSocket 重连机制和稳定性测试

---

## 📋 执行摘要

对 7zi-frontend 项目的 WebSocket 实现进行了全面的稳定性审查和测试。发现了**多个关键问题**，包括缺少指数退避机制、心跳检测、以及不充分的重连策略。已提供详细的修复建议和测试用例。

### 关键发现

| 项目 | 状态 | 严重程度 |
|------|------|----------|
| 指数退避机制 | ❌ 缺失 | 🔴 高 |
| 心跳检测 | ❌ 缺失 | 🔴 高 |
| 重连策略 | ⚠️ 不完善 | 🟡 中 |
| 错误处理 | ✅ 基本可用 | 🟢 低 |
| 最大重试次数 | ⚠️ 偏低 | 🟡 中 |

---

## 🔍 代码审查结果

### 1. 客户端重连配置 (`src/hooks/useNotifications.ts`)

#### 当前实现

```typescript
const socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,           // 固定延迟
  reconnectionAttempts: 5,           // 最多5次
});
```

#### 问题分析

| 问题 | 详细描述 | 风险 |
|------|----------|------|
| **固定延迟** | `reconnectionDelay` 固定为 1000ms，不使用指数退避 | 🔴 高 - 重连风暴风险 |
| **限制尝试次数** | 最多只尝试 5 次后放弃 | 🟡 中 - 不稳定网络下连接丢失 |
| **缺少心跳** | 无自定义心跳/ping 机制 | 🔴 高 - 无法及时检测断连 |
| **缺少重连事件监听** | 没有处理 `reconnect_attempt`、`reconnect_failed` 等事件 | 🟡 中 - 缺少重连状态可见性 |
| **无回退策略** | 不支持在 WebSocket 失败时降级到 polling | 🟢 低 - Socket.IO 已内置 |

### 2. 服务器端实现 (`src/lib/services/notification.ts`)

#### 当前实现

```typescript
this.io.on('connection', (socket: Socket) => {
  logger.log(`[NotificationService] Client connected: ${socket.id}`);

  socket.on('subscribe', (subscription: NotificationSubscription) => {
    this.handleSubscribe(socket, subscription);
  });

  socket.on('unsubscribe', () => {
    this.handleUnsubscribe(socket);
  });

  socket.on('disconnect', () => {
    this.handleUnsubscribe(socket);
    logger.log(`[NotificationService] Client disconnected: ${socket.id}`);
  });
});
```

#### 问题分析

| 问题 | 详细描述 | 风险 |
|------|----------|------|
| **缺少心跳配置** | 未配置 `pingTimeout` 和 `pingInterval` | 🔴 高 - 依赖默认值可能不足 |
| **无连接状态跟踪** | 不跟踪客户端的连接/重连历史 | 🟡 中 - 难以诊断问题 |
| **缺少清理策略** | 仅依赖 `disconnect` 事件，可能有孤儿连接 | 🟡 中 - 资源泄漏风险 |

### 3. Socket.IO 初始化 (`src/lib/socket.ts`)

#### 当前实现

```typescript
export function initializeSocketIO(httpServer: HTTPServer): SocketIOServer {
  notificationService.initialize(httpServer);
  const io = notificationService.getIO();

  if (!io) {
    throw new Error('Failed to initialize Socket.IO server');
  }

  // 清理过期通知（每5分钟）
  setInterval(() => {
    notificationService.cleanupExpired();
  }, 5 * 60 * 1000);

  return io;
}
```

#### 问题分析

| 问题 | 详细描述 | 风险 |
|------|----------|------|
| **无心跳配置** | 未在初始化时配置心跳参数 | 🟡 中 - 使用默认值 |
| **缺少连接监控** | 无主动的连接健康检查 | 🟡 中 - 被动依赖事件 |
| **清理间隔过长** | 5 分钟清理一次过期通知 | 🟢 低 - 可接受 |

---

## 🧪 测试场景

### 测试 1: 基本连接功能 ✅

**测试文件**: `src/hooks/__tests__/useNotifications.test.ts`

**结果**: 通过

```typescript
it('should connect when connect is called', async () => {
  const { result } = renderHook(() =>
    useNotifications({ autoConnect: false })
  );

  act(() => {
    result.current.connect();
  });

  await waitFor(() => {
    expect(result.current.status).toBe('connected');
  });
});
```

### 测试 2: 网络中断和恢复 ⚠️

**状态**: 部分测试，缺少完整的重连场景

**现有测试**:
- ✅ 处理 `disconnect` 事件
- ✅ 处理 `connect_error` 事件
- ❌ **缺失**: 模拟网络中断后自动重连
- ❌ **缺失**: 测试重连延迟时间
- ❌ **缺失**: 测试重连次数限制

### 测试 3: 心跳检测 ❌

**状态**: 无相关测试

**缺失场景**:
- 心跳超时断连
- 心跳包丢失恢复
- 长时间无活动自动重连

### 测试 4: 指数退避 ❌

**状态**: 无相关测试

**缺失场景**:
- 第 1 次重连: 1000ms
- 第 2 次重连: 2000ms
- 第 3 次重连: 4000ms
- ... 以此类推

### 测试 5: 边界条件 ⚠️

**状态**: 部分测试

**已覆盖**:
- ✅ 多个通知接收
- ✅ 通知标记已读
- ✅ 通知删除
- ❌ **缺失**: 快速连续连接/断开
- ❌ **缺失**: 服务器重启后重连
- ❌ **缺失**: 并发连接管理

---

## 🐛 发现的问题

### 🔴 严重问题

#### 1. 缺少指数退避机制

**位置**: `src/hooks/useNotifications.ts:84-86`

**影响**:
- 固定 1000ms 延迟可能导致重连风暴
- 服务器压力过大
- 网络拥堵

**建议修复**:

```typescript
const socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,           // 初始延迟
  reconnectionDelayMax: 30000,       // 最大延迟 (30秒)
  reconnectionAttempts: Infinity,    // 无限重试
  randomizationFactor: 0.5,          // 随机化因子 (避免重连风暴)
});
```

#### 2. 缺少心跳检测机制

**影响**:
- 无法及时检测"僵尸"连接
- 依赖 TCP 超时（通常 30-120 秒），太慢
- 通知可能丢失或延迟

**建议修复**:

**客户端 (`useNotifications.ts`)**:
```typescript
const socket = io(socketUrl, {
  // ... 其他配置
  forceNew: false,
  timeout: 20000,                   // 连接超时 20秒
});
```

**服务器端 (`notification.ts`)**:
```typescript
this.io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 20000,               // 心跳超时 20秒
  pingInterval: 10000,               // 心跳间隔 10秒
  maxHttpBufferSize: 1e6,           // 1MB
});
```

### 🟡 中等问题

#### 3. 重连次数限制过低

**位置**: `src/hooks/useNotifications.ts:86`

**当前**: `reconnectionAttempts: 5`

**问题**:
- 5 次重连失败后永久放弃
- 用户必须手动刷新页面
- 不适合不稳定的移动网络

**建议**: 使用 `Infinity` 或更大的值 (如 50)

#### 4. 缺少重连状态跟踪

**影响**:
- 用户不知道重连正在进行
- 无重连进度指示器
- 难以诊断连接问题

**建议**: 添加重连状态到 hook 返回值

```typescript
export interface UseNotificationsReturn {
  // ... 现有字段
  reconnectAttempts?: number;
  reconnecting?: boolean;
}
```

### 🟢 低优先级

#### 5. 清理间隔可以优化

**位置**: `src/lib/socket.ts`

**当前**: 每 5 分钟清理一次

**建议**: 可接受，但可以根据活跃连接数动态调整

---

## 💡 修复建议

### 优先级 1: 实现指数退避和心跳（关键）

#### 修改 `src/hooks/useNotifications.ts`

```typescript
const socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,           // 初始 1 秒
  reconnectionDelayMax: 30000,       // 最大 30 秒
  reconnectionAttempts: Infinity,    // 无限重试
  randomizationFactor: 0.5,          // 随机化避免同步
  timeout: 20000,                   // 连接超时
});

// 添加重连事件监听
socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`[useNotifications] Reconnection attempt #${attemptNumber}`);
  setStatus('connecting');
});

socket.on('reconnect', (attemptNumber) => {
  console.log(`[useNotifications] Reconnected after ${attemptNumber} attempts`);
  setStatus('connected');
});

socket.on('reconnect_failed', () => {
  console.error('[useNotifications] All reconnection attempts failed');
  setStatus('error');
});
```

#### 修改 `src/lib/services/notification.ts`

```typescript
this.io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 20000,               // 心跳超时 20秒
  pingInterval: 10000,               // 心跳间隔 10秒
  maxHttpBufferSize: 1e6,           // 1MB
  upgradeTimeout: 10000,             // 升级超时 10秒
});
```

### 优先级 2: 添加连接监控

#### 添加连接状态跟踪

```typescript
// 在 NotificationService 类中添加
private connectionStats: Map<string, {
  connectedAt: number;
  reconnectCount: number;
  lastHeartbeat: number;
}> = new Map();

socket.on('connection', (socket: Socket) => {
  this.connectionStats.set(socket.id, {
    connectedAt: Date.now(),
    reconnectCount: 0,
    lastHeartbeat: Date.now(),
  });

  socket.on('disconnect', () => {
    this.connectionStats.delete(socket.id);
  });
});
```

### 优先级 3: 增强测试覆盖

已创建以下测试文件:
- ✅ `src/hooks/__tests__/useNotifications.reconnection.test.ts` (新)
- ✅ `src/lib/__tests__/socket.stability.test.ts` (新)

---

## 📊 测试覆盖率

### 当前覆盖率估计

| 模块 | 估计覆盖率 | 状态 |
|------|-----------|------|
| 基本连接 | 80% | ✅ 良好 |
| 重连机制 | 20% | ❌ 不足 |
| 心跳检测 | 0% | ❌ 缺失 |
| 错误处理 | 60% | ⚠️ 中等 |
| 网络中断 | 10% | ❌ 不足 |
| 边界条件 | 40% | ⚠️ 中等 |

**总体估计**: ~35%

### 目标覆盖率

| 模块 | 目标覆盖率 | 差距 |
|------|-----------|------|
| 基本连接 | 90% | +10% |
| 重连机制 | 90% | +70% |
| 心跳检测 | 85% | +85% |
| 错误处理 | 85% | +25% |
| 网络中断 | 85% | +75% |
| 边界条件 | 80% | +40% |

**总体目标**: 85%+

---

## 🚀 实施计划

### 阶段 1: 紧急修复 (1-2 天)

- [ ] 实现指数退避机制
- [ ] 配置心跳参数
- [ ] 增加重连事件监听
- [ ] 更新重连尝试次数

### 阶段 2: 增强监控 (2-3 天)

- [ ] 添加连接状态跟踪
- [ ] 实现重连进度指示
- [ ] 添加连接日志
- [ ] 实现健康检查端点

### 阶段 3: 测试完善 (3-4 天)

- [ ] 实现重连测试套件
- [ ] 实现心跳测试套件
- [ ] 实现网络中断模拟测试
- [ ] 实现压力测试

### 阶段 4: 文档和监控 (1-2 天)

- [ ] 更新 API 文档
- [ ] 添加连接监控仪表板
- [ ] 配置告警规则
- [ ] 编写故障排查指南

---

## 📝 建议

### 短期建议 (1 周)

1. **立即修复指数退避** - 这是影响稳定性的关键问题
2. **配置心跳参数** - 提高断连检测速度
3. **增加重连尝试次数** - 避免过早放弃
4. **添加基本的重连日志** - 便于问题诊断

### 中期建议 (1 个月)

1. **实现连接监控** - 跟踪连接健康度
2. **完善测试覆盖** - 特别是重连场景
3. **添加监控仪表板** - 实时查看连接状态
4. **实现连接统计** - 分析连接模式

### 长期建议 (3 个月)

1. **考虑替代方案** - 评估 Server-Sent Events (SSE)
2. **实现负载均衡** - 支持 Socket.IO 多实例
3. **添加离线同步** - 断线期间缓存通知
4. **实现推送通知** - 作为 WebSocket 备用方案

---

## 🎯 成功标准

修复后应满足以下标准:

- ✅ 使用指数退避 (1s → 30s)
- ✅ 配置心跳 (10s 间隔, 20s 超时)
- ✅ 无限或高次数重连尝试
- ✅ 重连进度可见
- ✅ 网络中断后 30 秒内自动恢复
- ✅ 测试覆盖率 ≥ 85%
- ✅ 无内存泄漏 (长时间运行)
- ✅ 支持 1000+ 并发连接

---

## 📄 附录

### A. 已创建的测试文件

1. **`src/hooks/__tests__/useNotifications.reconnection.test.ts`**
   - 重连延迟测试
   - 指数退避测试
   - 重连次数限制测试
   - 网络中断恢复测试

2. **`src/lib/__tests__/socket.stability.test.ts`**
   - 心跳配置测试
   - 长时间连接稳定性测试
   - 并发连接测试
   - 清理机制测试

### B. 相关文件清单

```
7zi-frontend/
├── src/
│   ├── hooks/
│   │   ├── useNotifications.ts                    # 客户端 hook
│   │   └── __tests__/
│   │       ├── useNotifications.test.ts          # 基础测试
│   │       └── useNotifications.reconnection.test.ts  # 新: 重连测试
│   ├── lib/
│   │   ├── socket.ts                              # Socket.IO 初始化
│   │   ├── services/
│   │   │   ├── notification.ts                    # 服务器端服务
│   │   │   └── __tests__/
│   │   │       ├── notification.test.ts
│   │   │       └── socket.stability.test.ts      # 新: 稳定性测试
│   │   └── __tests__/
│   │       └── socket.test.ts                     # 初始化测试
│   └── components/notifications/
│       └── __tests__/
│           └── NotificationProvider.test.tsx      # 组件测试
```

### C. 测试运行命令

```bash
# 运行所有 WebSocket 相关测试
npm test -- --grep "socket|notification|websocket"

# 运行重连测试
npm test -- useNotifications.reconnection.test.ts

# 运行稳定性测试
npm test -- socket.stability.test.ts

# 运行测试并生成覆盖率报告
npm test -- --coverage --collectCoverageFrom="src/{hooks,lib}/**/*.{ts,tsx}"
```

---

## 🔗 参考资料

- [Socket.IO Reconnection](https://socket.io/docs/v4/client-api/#new-socketio-url-options)
- [Socket.IO Server Options](https://socket.io/docs/v4/server-options/)
- [WebSocket Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers)
- [Exponential Backoff Algorithm](https://en.wikipedia.org/wiki/Exponential_backoff)

---

**报告完成时间**: 2026-03-22 23:30 GMT+1
**测试员签名**: 🧪 测试员
