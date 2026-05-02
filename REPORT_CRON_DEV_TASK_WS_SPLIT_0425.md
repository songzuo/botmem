# WebSocket 模块拆分报告

**日期**: 2026-04-25  
**任务**: 拆分 lib/websocket/server.ts 大文件  
**状态**: ✅ 完成

---

## 原始文件分析

| 文件 | 行数 |
|------|------|
| server.ts | 1403 |
| 总计 | 7799 (websocket 目录) |

---

## 拆分方案

按功能职责拆分为 6 个新文件 + 1 个 handlers 目录：

### 新增文件结构

```
src/lib/websocket/
├── server.ts                    # 394 行 (-1009)
├── auth.ts                      # 87 行  [新]
├── broadcast.ts                 # 99 行  [新]
├── task-status.ts               # 79 行  [新]
└── handlers/
    ├── room-handlers.ts         # 462 行 [新]
    ├── message-handlers.ts      # 339 行 [新]
    └── doc-handlers.ts          # 291 行 [新]
```

### 职责划分

| 文件 | 职责 |
|------|------|
| **server.ts** | 核心初始化、全局实例、服务启动、API 导出 |
| **auth.ts** | JWT 认证中间件、用户颜色生成 |
| **broadcast.ts** | 广播工具函数 (toRoom/toUser/toAll) |
| **task-status.ts** | 任务状态广播辅助函数 |
| **handlers/room-handlers.ts** | room:create/delete/join/leave/kick/ban/invite/role |
| **handlers/message-handlers.ts** | message:send/edit/delete/react/pin/history |
| **handlers/doc-handlers.ts** | doc:open/operation/sync + cursor/selection/typing |

---

## 关键设计决策

1. **松耦合**: handler 文件使用接口类型而非直接引用具体类，通过 setter 注入依赖
2. **IO 单例**: broadcast.ts 维护 Socket.IO 实例，server.ts 初始化时调用 setIO()
3. **导出清晰**: server.ts 统一导出所有公共 API 和类型
4. **功能不变**: 所有事件处理逻辑完整保留，仅重新组织

---

## 构建验证

```bash
npx tsc --noEmit
```

✅ WebSocket 相关文件无 TypeScript 错误  
ℹ️  pre-existing 错误 (rate-limiting-gateway 模块) 与本次拆分无关

---

## 行数对比

| 指标 | 拆分前 | 拆分后 | 变化 |
|------|--------|--------|------|
| server.ts | 1403 | 394 | -72% |
| 总行数 (新文件) | - | 1751 | - |
| handler 模块 | - | 1092 | 新增 |
| 辅助模块 | - | 265 | 新增 |

---

## 后续建议

1. `handlers/` 目录下的接口定义可考虑提取到共享 `types.ts`
2. `task-status.ts` 的 `broadcastToUser` 使用动态 import，可优化
3. 可为每个 handler 文件添加单元测试
