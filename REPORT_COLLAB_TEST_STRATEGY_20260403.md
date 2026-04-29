# v1.11.0 实时协作系统测试策略

> 版本: 1.0  
> 日期: 2026-04-03  
> 测试员: AI 测试团队  
> 目标: 为实时协作系统设计全面的测试策略

---

## 1. 测试目标

### 1.1 核心目标

- ✅ 确保多用户协作功能稳定可靠
- ✅ 验证冲突解决机制正确性
- ✅ 保证离线同步数据一致性
- ✅ 验证性能指标满足要求
- ✅ 覆盖边界条件和异常场景

### 1.2 测试范围

| 模块 | 测试类型 | 优先级 |
|------|----------|--------|
| WebSocket 连接管理 | 单元 + 集成 | P0 |
| 光标同步 (Awareness) | 单元 + 集成 | P0 |
| 冲突解决 (CRDT) | 单元 + 集成 | P0 |
| 编辑锁机制 | 单元 + 集成 | P0 |
| 离线支持 | 集成 + E2E | P1 |
| 协作状态管理 | 单元 + 集成 | P1 |
| 性能测试 | 性能 | P1 |
| 安全测试 | 安全 | P2 |

---

## 2. 测试基础设施

### 2.1 测试框架

```typescript
// 使用现有 Vitest 配置
// vitest.config.ts
{
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 2,
      },
    },
    testTimeout: 15000,
    retry: 1,
  }
}
```

### 2.2 测试工具

| 工具 | 用途 | 安装 |
|------|------|------|
| Vitest | 单元测试框架 | ✅ 已有 |
| @testing-library/react | React 组件测试 | ✅ 已有 |
| @testing-library/user-event | 用户交互模拟 | ✅ 已有 |
| y-websocket | WebSocket 模拟 | 需添加 |
| fake-indexeddb | IndexedDB 模拟 | 需添加 |
| ws | WebSocket 服务器模拟 | 需添加 |
| msw | API Mock | ✅ 已有 |

### 2.3 测试目录结构

```
src/
├── lib/
│   ├── collaboration/
│   │   ├── CollabClient.ts
│   │   ├── CollabServer.ts
│   │   ├── Room.ts
│   │   ├── LockManager.ts
│   │   └── __tests__/
│   │       ├── CollabClient.test.ts
│   │       ├── CollabServer.test.ts
│   │       ├── Room.test.ts
│   │       ├── LockManager.test.ts
│   │       └── fixtures/
│   │           ├── mock-doc.ts
│   │           └── mock-websocket.ts
│   └── websocket-manager.ts
├── test/
│   ├── setup.ts
│   ├── helpers/
│   │   ├── create-mock-websocket.ts
│   │   ├── create-mock-yjs-doc.ts
│   │   └── create-test-room.ts
│   └── e2e/
│       └── collaboration/
│           ├── multi-user-editing.spec.ts
│           ├── cursor-sync.spec.ts
│           ├── conflict-resolution.spec.ts
│           └── offline-support.spec.ts
```

---

## 3. 单元测试策略

### 3.1 WebSocket 连接管理

#### 测试文件: `CollabClient.test.ts`

```typescript
describe('CollabClient - WebSocket 连接管理', () => {
  describe('连接生命周期', () => {
    it('应该成功连接到服务器', async () => {
      const client = new CollabClient();
      await client.connect('session-123', 'user-1');
      expect(client.getState()).toBe('connected');
    });

    it('连接失败时应该进入 disconnected 状态', async () => {
      const client = new CollabClient();
      // Mock WebSocket 连接失败
      mockWebSocketConnectFailure();
      await expect(client.connect('session-123', 'user-1'))
        .rejects.toThrow();
      expect(client.getState()).toBe('disconnected');
    });

    it('应该正确处理断开连接', async () => {
      const client = new CollabClient();
      await client.connect('session-123', 'user-1');
      await client.disconnect();
      expect(client.getState()).toBe('disconnected');
    });

    it('网络恢复后应该自动重连', async () => {
      const client = new CollabClient();
      await client.connect('session-123', 'user-1');
      
      // 模拟网络断开
      simulateNetworkOffline();
      expect(client.getState()).toBe('disconnected');
      
      // 模拟网络恢复
      simulateNetworkOnline();
      await waitFor(() => expect(client.getState()).toBe('connected'));
    });
  });

  describe('心跳机制', () => {
    it('应该定期发送心跳', async () => {
      const client = new CollabClient();
      const ws = mockWebSocket();
      
      await client.connect('session-123', 'user-1');
      
      await waitFor(() => {
        expect(ws.send).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'ping' })
        );
      });
    });

    it('心跳超时应该触发重连', async () => {
      const client = new CollabClient();
      const ws = mockWebSocket();
      
      await client.connect('session-123', 'user-1');
      
      // 模拟心跳超时
      simulateHeartbeatTimeout(ws);
      
      await waitFor(() => {
        expect(client.getState()).toBe('connecting');
      });
    });
  });

  describe('消息处理', () => {
    it('应该正确处理 sync-step-1 消息', async () => {
      const client = new CollabClient();
      const ws = mockWebSocket();
      
      await client.connect('session-123', 'user-1');
      
      // 模拟服务器发送 sync-step-1
      ws.emit('message', createSyncStep1Message());
      
      await waitFor(() => {
        expect(ws.send).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'sync-step-2' })
        );
      });
    });

    it('应该正确处理 sync-update 消息', async () => {
      const client = new CollabClient();
      const doc = createMockYjsDoc();
      
      await client.connect('session-123', 'user-1');
      
      const update = createYjsUpdate();
      client.handleSyncUpdate(update);
      
      expect(doc.applyUpdate).toHaveBeenCalledWith(update);
    });
  });
});
```

### 3.2 光标同步 (Awareness)

#### 测试文件: `CursorSyncService.test.ts`

```typescript
describe('CursorSyncService - 光标同步', () => {
  describe('本地光标更新', () => {
    it('应该更新本地光标位置', () => {
      const service = new CursorSyncService(awareness);
      
      service.updateCursor({
        nodeId: 'node-123',
        x: 100,
        y: 200,
      });
      
      const state = awareness.getLocalState();
      expect(state.cursor).toEqual({
        nodeId: 'node-123',
        x: 100,
        y: 200,
      });
    });

    it('应该节流光标更新 (16ms)', async () => {
      const service = new CursorSyncService(awareness);
      const spy = vi.spyOn(awareness, 'setLocalState');
      
      // 快速移动光标
      for (let i = 0; i < 10; i++) {
        service.updateCursor({ x: i * 10, y: i * 10 });
      }
      
      // 应该只调用一次（节流）
      expect(spy).toHaveBeenCalledTimes(1);
      
      // 等待节流周期结束
      await waitFor(20);
      
      // 再次移动
      service.updateCursor({ x: 100, y: 100 });
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('应该忽略微小移动 (< 2px)', () => {
      const service = new CursorSyncService(awareness);
      const spy = vi.spyOn(awareness, 'setLocalState');
      
      service.updateCursor({ x: 100, y: 100 });
      service.updateCursor({ x: 101, y: 100 }); // 移动 1px
      service.updateCursor({ x: 101, y: 101 }); // 移动 1px
      
      // 应该只调用一次
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('远程光标同步', () => {
    it('应该接收远程光标更新', () => {
      const service = new CursorSyncService(awareness);
      const callback = vi.fn();
      
      service.onCursorChange(callback);
      
      // 模拟远程用户光标更新
      awareness.setLocalStateField('cursor', {
        nodeId: 'node-456',
        x: 300,
        y: 400,
      }, 'remote-user-1');
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          'remote-user-1': expect.objectContaining({
            cursor: { nodeId: 'node-456', x: 300, y: 400 }
          })
        })
      );
    });

    it('应该隐藏超时的光标 (5秒)', async () => {
      const service = new CursorSyncService(awareness);
      const callback = vi.fn();
      
      service.onCursorChange(callback);
      
      // 模拟远程用户光标
      awareness.setLocalStateField('cursor', { x: 100, y: 100 }, 'user-1');
      
      // 等待超时
      await waitFor(6000);
      
      // 光标应该被移除
      const states = awareness.getStates();
      expect(states.get('user-1')).toBeUndefined();
    });
  });

  describe('用户信息', () => {
    it('应该包含用户颜色和名称', () => {
      const service = new CursorSyncService(awareness);
      
      service.updateCursor({ x: 100, y: 100 });
      awareness.setLocalStateField('user', {
        id: 'user-1',
        name: 'Alice',
        color: '#FF5733',
      });
      
      const state = awareness.getLocalState();
      expect(state.user).toEqual({
        id: 'user-1',
        name: 'Alice',
        color: '#FF5733',
      });
    });
  });
});
```

### 3.3 冲突解决 (CRDT)

#### 测试文件: `ConflictDetector.test.ts`

```typescript
describe('ConflictDetector - 冲突检测与解决', () => {
  describe('编辑-编辑冲突', () => {
    it('不同字段应该自动合并', () => {
      const doc = new Y.Doc();
      const nodes = doc.getMap('nodes');
      
      // 用户 A 编辑 title
      doc.transact(() => {
        const node = nodes.get('node-1') || new Y.Map();
        node.set('title', 'Title A');
        nodes.set('node-1', node);
      }, 'user-a');
      
      // 用户 B 编辑 description
      doc.transact(() => {
        const node = nodes.get('node-1') || new Y.Map();
        node.set('description', 'Desc B');
        nodes.set('node-1', node);
      }, 'user-b');
      
      // 两个字段都应该存在
      const node = nodes.get('node-1');
      expect(node.get('title')).toBe('Title A');
      expect(node.get('description')).toBe('Desc B');
    });

    it('同一字段应该使用 Last-Write-Wins', () => {
      const doc = new Y.Doc();
      const nodes = doc.getMap('nodes');
      
      // 用户 A 先编辑
      doc.transact(() => {
        const node = nodes.get('node-1') || new Y.Map();
        node.set('title', 'Title A');
        nodes.set('node-1', node);
      }, 'user-a');
      
      // 用户 B 后编辑
      doc.transact(() => {
        const node = nodes.get('node-1') || new Y.Map();
        node.set('title', 'Title B');
        nodes.set('node-1', node);
      }, 'user-b');
      
      // 应该是 B 的值
      const node = nodes.get('node-1');
      expect(node.get('title')).toBe('Title B');
    });
  });

  describe('编辑-删除冲突', () => {
    it('删除应该优先于编辑', () => {
      const doc = new Y.Doc();
      const nodes = doc.getMap('nodes');
      
      // 创建节点
      doc.transact(() => {
        const node = new Y.Map();
        node.set('title', 'Original');
        nodes.set('node-1', node);
      });
      
      // 用户 A 删除节点
      doc.transact(() => {
        nodes.delete('node-1');
      }, 'user-a');
      
      // 用户 B 尝试编辑
      doc.transact(() => {
        const node = nodes.get('node-1') || new Y.Map();
        node.set('title', 'Modified');
        nodes.set('node-1', node);
      }, 'user-b');
      
      // 节点应该被删除
      expect(nodes.has('node-1')).toBe(false);
    });
  });

  describe('移动-删除冲突', () => {
    it('删除应该优先于移动', () => {
      const doc = new Y.Doc();
      const nodes = doc.getMap('nodes');
      const edges = doc.getMap('edges');
      
      // 创建节点和边
      doc.transact(() => {
        const node = new Y.Map();
        node.set('id', 'node-1');
        nodes.set('node-1', node);
        
        const edge = new Y.Map();
        edge.set('source', 'node-1');
        edge.set('target', 'node-2');
        edges.set('edge-1', edge);
      });
      
      // 用户 A 删除节点
      doc.transact(() => {
        nodes.delete('node-1');
      }, 'user-a');
      
      // 用户 B 移动节点
      doc.transact(() => {
        const node = nodes.get('node-1');
        if (node) {
          node.set('x', 100);
          node.set('y', 200);
        }
      }, 'user-b');
      
      // 节点应该被删除
      expect(nodes.has('node-1')).toBe(false);
    });
  });
});
```

### 3.4 编辑锁机制

#### 测试文件: `LockManager.test.ts`

```typescript
describe('LockManager - 编辑锁', () => {
  let lockManager: LockManager;
  let mockRedis: MockRedis;

  beforeEach(() => {
    mockRedis = new MockRedis();
    lockManager = new LockManager(mockRedis);
  });

  describe('获取锁', () => {
    it('应该成功获取未锁定的节点', async () => {
      const result = await lockManager.acquireLock('node-1', 'user-1', 'Alice');
      
      expect(result.success).toBe(true);
      expect(mockRedis.get('lock:node:node-1')).toEqual({
        userId: 'user-1',
        userName: 'Alice',
        lockedAt: expect.any(Number),
      });
    });

    it('应该拒绝获取已锁定的节点', async () => {
      // 用户 A 获取锁
      await lockManager.acquireLock('node-1', 'user-1', 'Alice');
      
      // 用户 B 尝试获取锁
      const result = await lockManager.acquireLock('node-1', 'user-2', 'Bob');
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('locked');
    });

    it('同一用户可以重复获取锁', async () => {
      await lockManager.acquireLock('node-1', 'user-1', 'Alice');
      const result = await lockManager.acquireLock('node-1', 'user-1', 'Alice');
      
      expect(result.success).toBe(true);
    });

    it('锁过期后应该可以重新获取', async () => {
      await lockManager.acquireLock('node-1', 'user-1', 'Alice');
      
      // 模拟锁过期
      await mockRedis.expire('lock:node:node-1', 0);
      
      const result = await lockManager.acquireLock('node-1', 'user-2', 'Bob');
      expect(result.success).toBe(true);
    });
  });

  describe('续期锁', () => {
    it('应该成功续期自己的锁', async () => {
      await lockManager.acquireLock('node-1', 'user-1', 'Alice');
      
      const result = await lockManager.renewLock('node-1', 'user-1');
      expect(result.success).toBe(true);
    });

    it('不能续期他人的锁', async () => {
      await lockManager.acquireLock('node-1', 'user-1', 'Alice');
      
      const result = await lockManager.renewLock('node-1', 'user-2');
      expect(result.success).toBe(false);
    });
  });

  describe('释放锁', () => {
    it('应该成功释放自己的锁', async () => {
      await lockManager.acquireLock('node-1', 'user-1', 'Alice');
      
      await lockManager.releaseLock('node-1', 'user-1');
      expect(mockRedis.get('lock:node:node-1')).toBeNull();
    });

    it('不能释放他人的锁', async () => {
      await lockManager.acquireLock('node-1', 'user-1', 'Alice');
      
      await lockManager.releaseLock('node-1', 'user-2');
      expect(mockRedis.get('lock:node:node-1')).not.toBeNull();
    });
  });

  describe('强制释放', () => {
    it('管理员应该可以强制释放锁', async () => {
      await lockManager.acquireLock('node-1', 'user-1', 'Alice');
      
      await lockManager.forceReleaseLock('node-1');
      expect(mockRedis.get('lock:node:node-1')).toBeNull();
    });
  });
});
```

---

## 4. 集成测试策略

### 4.1 多用户协作场景

#### 测试文件: `multi-user-editing.integration.test.ts`

```typescript
describe('多用户协作 - 集成测试', () => {
  let server: CollabServer;
  let clientA: CollabClient;
  let clientB: CollabClient;
  let clientC: CollabClient;

  beforeEach(async () => {
    server = new CollabServer();
    await server.start();
    
    clientA = new CollabClient();
    clientB = new CollabClient();
    clientC = new CollabClient();
    
    await Promise.all([
      clientA.connect('session-1', 'user-a'),
      clientB.connect('session-1', 'user-b'),
      clientC.connect('session-1', 'user-c'),
    ]);
  });

  afterEach(async () => {
    await Promise.all([
      clientA.disconnect(),
      clientB.disconnect(),
      clientC.disconnect(),
    ]);
    await server.stop();
  });

  describe('三个用户同时编辑', () => {
    it('应该正确同步所有用户的编辑', async () => {
      // 用户 A 编辑节点 1
      clientA.updateNode('node-1', { title: 'Title A' });
      
      // 用户 B 编辑节点 2
      clientB.updateNode('node-2', { title: 'Title B' });
      
      // 用户 C 编辑节点 3
      clientC.updateNode('node-3', { title: 'Title C' });
      
      // 等待同步
      await waitFor(100);
      
      // 验证所有客户端都有完整状态
      const docA = clientA.getDocument();
      const docB = clientB.getDocument();
      const docC = clientC.getDocument();
      
      expect(docA.getMap('nodes').get('node-1').get('title')).toBe('Title A');
      expect(docB.getMap('nodes').get('node-2').get('title')).toBe('Title B');
      expect(docC.getMap('nodes').get('node-3').get('title')).toBe('Title C');
    });

    it('应该正确处理同一节点的并发编辑', async () => {
      // 用户 A 和 B 同时编辑同一节点的不同字段
      await Promise.all([
        clientA.updateNode('node-1', { title: 'Title A' }),
        clientB.updateNode('node-1', { description: 'Desc B' }),
      ]);
      
      await waitFor(100);
      
      const node = clientA.getDocument().getMap('nodes').get('node-1');
      expect(node.get('title')).toBe('Title A');
      expect(node.get('description')).toBe('Desc B');
    });
  });

  describe('用户加入/离开', () => {
    it('新用户加入应该收到完整文档状态', async () => {
      // 用户 A 创建节点
      clientA.updateNode('node-1', { title: 'Created by A' });
      
      // 用户 B 稍后加入
      const clientD = new CollabClient();
      await clientD.connect('session-1', 'user-d');
      
      await waitFor(100);
      
      // 用户 D 应该看到节点
      const node = clientD.getDocument().getMap('nodes').get('node-1');
      expect(node.get('title')).toBe('Created by A');
      
      await clientD.disconnect();
    });

    it('用户离开应该释放其锁', async () => {
      // 用户 A 获取锁
      await clientA.acquireLock('node-1');
      
      // 用户 A 离开
      await clientA.disconnect();
      
      await waitFor(100);
      
      // 用户 B 应该可以获取锁
      const result = await clientB.acquireLock('node-1');
      expect(result.success).toBe(true);
    });
  });
});
```

### 4.2 光标同步集成

#### 测试文件: `cursor-sync.integration.test.ts`

```typescript
describe('光标同步 - 集成测试', () => {
  let server: CollabServer;
  let clients: CollabClient[];

  beforeEach(async () => {
    server = new CollabServer();
    await server.start();
    
    clients = await Promise.all([
      createClient('user-a', 'Alice', '#FF5733'),
      createClient('user-b', 'Bob', '#33FF57'),
      createClient('user-c', 'Charlie', '#3357FF'),
    ]);
  });

  afterEach(async () => {
    await Promise.all(clients.map(c => c.disconnect()));
    await server.stop();
  });

  it('应该实时同步所有用户的光标', async () => {
    const cursorsA: CursorPosition[] = [];
    const cursorsB: CursorPosition[] = [];
    
    clients[0].onCursorChange(cursors => {
      cursorsA.push(...Array.from(cursors.values()));
    });
    
    clients[1].onCursorChange(cursors => {
      cursorsB.push(...Array.from(cursors.values()));
    });
    
    // 用户 A 移动光标
    clients[0].updateCursor({ nodeId: 'node-1', x: 100, y: 200 });
    
    await waitFor(50);
    
    // 用户 B 应该看到 A 的光标
    expect(cursorsB).toContainEqual(
      expect.objectContaining({
        user: expect.objectContaining({ name: 'Alice' }),
        cursor: { nodeId: 'node-1', x: 100, y: 200 }
      })
    );
  });

  it('应该正确显示用户颜色', async () => {
    const cursors: CursorPosition[] = [];
    clients[0].onCursorChange(c => cursors.push(...Array.from(c.values())));
    
    // 所有用户移动光标
    clients[0].updateCursor({ x: 100, y: 100 });
    clients[1].updateCursor({ x: 200, y: 200 });
    clients[2].updateCursor({ x: 300, y: 300 });
    
    await waitFor(100);
    
    // 验证颜色
    const aliceCursor = cursors.find(c => c.user.name === 'Alice');
    expect(aliceCursor.user.color).toBe('#FF5733');
    
    const bobCursor = cursors.find(c => c.user.name === 'Bob');
    expect(bobCursor.user.color).toBe('#33FF57');
  });
});
```

---

## 5. E2E 测试场景

### 5.1 完整协作流程

#### 测试文件: `collaboration-workflow.spec.ts`

```typescript
describe('实时协作 - E2E 测试', () => {
  describe('场景: 三个用户协作编辑工作流', () => {
    it('应该完成完整的协作流程', async () => {
      // 1. 用户 A 创建工作流
      await pageA.goto('/workflow/new');
      await pageA.click('[data-testid="add-node"]');
      await pageA.fill('[data-testid="node-title"]', 'Start Node');
      
      // 2. 用户 B 加入会话
      await pageB.goto(`/workflow/${workflowId}`);
      await pageB.waitForSelector('[data-testid="collab-user-Alice"]');
      
      // 3. 用户 B 添加第二个节点
      await pageB.click('[data-testid="add-node"]');
      await pageB.fill('[data-testid="node-title"]', 'Process Node');
      
      // 4. 用户 C 加入并连接节点
      await pageC.goto(`/workflow/${workflowId}`);
      await pageC.dragAndDrop(
        '[data-testid="node-Start Node"]',
        '[data-testid="node-Process Node"]'
      );
      
      // 5. 验证所有用户看到相同状态
      await expect(pageA.locator('[data-testid="node-Start Node"]')).toBeVisible();
      await expect(pageB.locator('[data-testid="node-Process Node"]')).toBeVisible();
      await expect(pageC.locator('[data-testid="edge-1"]')).toBeVisible();
      
      // 6. 验证在线用户列表
      await expect(pageA.locator('[data-testid="online-users"]')).toHaveText(/Alice.*Bob.*Charlie/);
    });
  });

  describe('场景: 编辑锁冲突', () => {
    it('应该阻止并发编辑同一节点', async () => {
      // 用户 A 开始编辑节点
      await pageA.click('[data-testid="node-1"]');
      await pageA.fill('[data-testid="node-title"]', 'Editing...');
      
      // 用户 B 尝试编辑同一节点
      await pageB.click('[data-testid="node-1"]');
      
      // 应该显示锁定提示
      await expect(pageB.locator('[data-testid="lock-warning"]')).toBeVisible();
      await expect(pageB.locator('[data-testid="lock-warning"]')).toContainText('Alice is editing');
      
      // 用户 A 完成编辑
      await pageA.press('[data-testid="node-title"]', 'Enter');
      
      // 用户 B 应该可以编辑
      await waitFor(500);
      await pageB.fill('[data-testid="node-title"]', 'Now I can edit');
      await expect(pageB.locator('[data-testid="lock-warning"]')).not.toBeVisible();
    });
  });

  describe('场景: 网络断开与恢复', () => {
    it('应该正确处理网络中断', async () => {
      // 用户 A 编辑节点
      await pageA.fill('[data-testid="node-title"]', 'Before disconnect');
      
      // 模拟网络断开
      await pageA.context().setOffline(true);
      
      // 用户 A 继续编辑（离线）
      await pageA.fill('[data-testid="node-title"]', 'Offline edit');
      
      // 用户 B 看不到离线编辑
      await expect(pageB.locator('[data-testid="node-title"]')).toHaveValue('Before disconnect');
      
      // 恢复网络
      await pageA.context().setOffline(false);
      
      // 等待同步
      await waitFor(1000);
      
      // 用户 B 应该看到更新
      await expect(pageB.locator('[data-testid="node-title"]')).toHaveValue('Offline edit');
    });
  });
});
```

### 5.2 离线支持场景

#### 测试文件: `offline-support.spec.ts`

```typescript
describe('离线支持 - E2E 测试', () => {
  describe('场景: 完全离线编辑', () => {
    it('应该支持离线编辑并在恢复后同步', async () => {
      // 1. 加载工作流
      await page.goto('/workflow/123');
      await expect(page.locator('[data-testid="node-1"]')).toBeVisible();
      
      // 2. 断开网络
      await page.context().setOffline(true);
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      
      // 3. 离线编辑
      await page.fill('[data-testid="node-title"]', 'Offline Title');
      await page.click('[data-testid="add-node"]');
      await page.fill('[data-testid="node-title"]', 'New Node Offline');
      
      // 4. 验证 IndexedDB 存储
      const storedData = await page.evaluate(() => {
        return new Promise((resolve) => {
          const request = indexedDB.open('workflow-doc', 1);
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(['updates'], 'readonly');
            const store = tx.objectStore('updates');
            const getAll = store.getAll();
            getAll.onsuccess = () => resolve(getAll.result);
          };
        });
      });
      
      expect(storedData.length).toBeGreaterThan(0);
      
      // 5. 恢复网络
      await page.context().setOffline(false);
      
      // 6. 等待同步完成
      await waitFor(2000);
      await expect(page.locator('[data-testid="sync-indicator"]')).not.toBeVisible();
      
      // 7. 验证服务器端数据
      const serverData = await fetchWorkflowData('123');
      expect(serverData.nodes).toContainEqual(
        expect.objectContaining({ title: 'Offline Title' })
      );
      expect(serverData.nodes).toContainEqual(
        expect.objectContaining({ title: 'New Node Offline' })
      );
    });
  });

  describe('场景: 离线冲突解决', () => {
    it('应该正确解决离线期间的冲突', async () => {
      // 用户 A 离线编辑
      await pageA.context().setOffline(true);
      await pageA.fill('[data-testid="node-title"]', 'A Offline');
      
      // 用户 B 在线编辑同一节点
      await pageB.fill('[data-testid="node-title"]', 'B Online');
      
      // 用户 A 恢复网络
      await pageA.context().setOffline(false);
      await waitFor(1000);
      
      // 应该显示冲突提示
      await expect(pageA.locator('[data-testid="conflict-dialog"]')).toBeVisible();
      
      // 用户 A 选择保留自己的版本
      await pageA.click('[data-testid="keep-my-version"]');
      
      // 验证最终状态
      await expect(pageA.locator('[data-testid="node-title"]')).toHaveValue('A Offline');
      await expect(pageB.locator('[data-testid="node-title"]')).toHaveValue('A Offline');
    });
  });
});
```

---

## 6. 性能测试

### 6.1 测试指标

| 指标 | 目标 | 测试方法 |
|------|------|----------|
| 连接建立时间 | < 500ms | 测量 connect() 耗时 |
| 消息延迟 | < 100ms | 测量发送到接收的时间 |
| 光标同步延迟 | < 50ms | 测量光标更新到显示的时间 |
| 文档同步时间 | < 1s (1000 节点) | 测量完整文档同步时间 |
| 内存占用 | < 50MB (1000 节点) | 测量 Y.Doc 内存使用 |
| 并发用户数 | 50+ | 压力测试 |

### 6.2 性能测试用例

```typescript
describe('性能测试', () => {
  describe('连接性能', () => {
    it('应该在 500ms 内建立连接', async () => {
      const start = performance.now();
      const client = new CollabClient();
      await client.connect('session-1', 'user-1');
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(500);
    });
  });

  describe('消息延迟', () => {
    it('消息延迟应该 < 100ms', async () => {
      const clientA = new CollabClient();
      const clientB = new CollabClient();
      
      await Promise.all([
        clientA.connect('session-1', 'user-a'),
        clientB.connect('session-1', 'user-b'),
      ]);
      
      const latencies: number[] = [];
      
      clientB.on('update', () => {
        latencies.push(performance.now() - lastSendTime);
      });
      
      for (let i = 0; i < 100; i++) {
        const lastSendTime = performance.now();
        clientA.updateNode(`node-${i}`, { title: `Update ${i}` });
        await waitFor(10);
      }
      
      const avgLatency = latencies.reduce((a, b) => a + b) / latencies.length;
      expect(avgLatency).toBeLessThan(100);
    });
  });

  describe('大规模文档同步', () => {
    it('1000 节点文档应该在 1s 内同步', async () => {
      const clientA = new CollabClient();
      await clientA.connect('session-1', 'user-a');
      
      // 创建 1000 个节点
      const doc = clientA.getDocument();
      const nodes = doc.getMap('nodes');
      doc.transact(() => {
        for (let i = 0; i < 1000; i++) {
          const node = new Y.Map();
          node.set('id', `node-${i}`);
          node.set('title', `Node ${i}`);
          nodes.set(`node-${i}`, node);
        }
      });
      
      // 新用户加入
      const start = performance.now();
      const clientB = new CollabClient();
      await clientB.connect('session-1', 'user-b');
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(1000);
      
      // 验证所有节点都已同步
      const syncedNodes = clientB.getDocument().getMap('nodes');
      expect(syncedNodes.size).toBe(1000);
    });
  });

  describe('并发用户压力测试', () => {
    it('应该支持 50 个并发用户', async () => {
      const clients: CollabClient[] = [];
      const connectPromises: Promise<void>[] = [];
      
      // 创建 50 个客户端
      for (let i = 0; i < 50; i++) {
        const client = new CollabClient();
        clients.push(client);
        connectPromises.push(client.connect('session-1', `user-${i}`));
      }
      
      // 并发连接
      const start = performance.now();
      await Promise.all(connectPromises);
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(5000); // 5s 内完成
      
      // 验证所有客户端都已连接
      clients.forEach(client => {
        expect(client.getState()).toBe('connected');
      });
      
      // 清理
      await Promise.all(clients.map(c => c.disconnect()));
    });
  });
});
```

---

## 7. 测试覆盖率目标

### 7.1 覆盖率要求

| 模块 | 语句覆盖率 | 分支覆盖率 | 函数覆盖率 |
|------|-----------|-----------|-----------|
| CollabClient | 90% | 85% | 90% |
| CollabServer | 85% | 80% | 85% |
| LockManager | 95% | 90% | 95% |
| CursorSyncService | 90% | 85% | 90% |
| ConflictDetector | 90% | 85% | 90% |
| **总体** | **88%** | **83%** | **88%** |

### 7.2 覆盖率检查

```bash
# 运行测试并生成覆盖率报告
npm run test:coverage

# 查看覆盖率报告
open coverage/index.html

# 检查覆盖率是否达标
npm run test:coverage:check
```

---

## 8. 测试执行计划

### 8.1 测试阶段

| 阶段 | 测试类型 | 时间 | 负责人 |
|------|----------|------|--------|
| Phase 1 | 单元测试 | Week 1-2 | 测试员 |
| Phase 2 | 集成测试 | Week 3-4 | 测试员 |
| Phase 3 | E2E 测试 | Week 5-6 | 测试员 |
| Phase 4 | 性能测试 | Week 7 | 测试员 |
| Phase 5 | 回归测试 | Week 8 | 测试员 |

### 8.2 CI/CD 集成

```yaml
# .github/workflows/test.yml
name: Collaboration Tests

on:
  pull_request:
    paths:
      - 'src/lib/collaboration/**'
  push:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage

  integration-tests:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7
      postgres:
        image: postgres:15
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:e2e

  performance-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:performance
```

---

## 9. 测试数据管理

### 9.1 测试夹具

```typescript
// src/test/helpers/fixtures.ts
export const createMockWorkflow = () => ({
  id: 'workflow-1',
  nodes: [
    { id: 'node-1', type: 'start', title: 'Start', x: 100, y: 100 },
    { id: 'node-2', type: 'process', title: 'Process', x: 300, y: 100 },
    { id: 'node-3', type: 'end', title: 'End', x: 500, y: 100 },
  ],
  edges: [
    { id: 'edge-1', source: 'node-1', target: 'node-2' },
    { id: 'edge-2', source: 'node-2', target: 'node-3' },
  ],
});

export const createMockUsers = () => [
  { id: 'user-1', name: 'Alice', color: '#FF5733' },
  { id: 'user-2', name: 'Bob', color: '#33FF57' },
  { id: 'user-3', name: 'Charlie', color: '#3357FF' },
];
```

### 9.2 测试环境配置

```typescript
// src/test/setup.ts
import { vi } from 'vitest';
import { fakeIndexedDB } from 'fake-indexeddb';

// Mock IndexedDB
global.indexedDB = fakeIndexedDB();

// Mock WebSocket
global.WebSocket = class MockWebSocket {
  // ... 实现
};

// Mock Redis
vi.mock('ioredis', () => ({
  default: class MockRedis {
    // ... 实现
  },
}));
```

---

## 10. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| WebSocket 连接不稳定 | 高 | 增加重连测试，模拟网络抖动 |
| CRDT 合并复杂 | 中 | 充分的单元测试覆盖各种冲突场景 |
| 离线同步难以测试 | 中 | 使用 fake-indexeddb 模拟离线场景 |
| 性能测试环境差异 | 中 | 在 CI 中运行性能测试，使用固定配置 |
| E2E 测试不稳定 | 高 | 增加重试机制，使用稳定的等待策略 |

---

## 11. 测试报告

### 11.1 报告内容

- 测试执行摘要
- 通过/失败统计
- 覆盖率报告
- 性能指标
- 失败用例详情
- 阻塞问题列表

### 11.2 报告模板

```markdown
# 协作系统测试报告

## 执行摘要
- 测试日期: 2026-04-03
- 测试版本: v1.11.0
- 总用例数: 150
- 通过: 145
- 失败: 3
- 跳过: 2
- 覆盖率: 88.5%

## 详细结果
### 单元测试
- CollabClient: 30/30 通过
- CollabServer: 25/25 通过
- LockManager: 20/20 通过

### 集成测试
- 多用户协作: 15/15 通过
- 光标同步: 10/10 通过

### E2E 测试
- 完整流程: 8/10 通过
- 离线支持: 7/10 通过

## 失败用例
1. [E2E] 离线冲突解决 - 偶发性失败
2. [E2E] 大规模文档同步 - 超时
3. [集成] 网络恢复同步 - 数据不一致

## 性能指标
- 连接时间: 320ms ✅
- 消息延迟: 75ms ✅
- 文档同步 (1000 节点): 850ms ✅
- 并发用户: 50 ✅
```

---

## 12. 下一步行动

### 12.1 立即行动 (Week 1)

- [ ] 设置测试基础设施
- [ ] 安装必要的测试依赖
- [ ] 创建测试目录结构
- [ ] 编写测试辅助函数

### 12.2 短期目标 (Week 2-4)

- [ ] 完成 CollabClient 单元测试
- [ ] 完成 CollabServer 单元测试
- [ ] 完成 LockManager 单元测试
- [ ] 开始集成测试

### 12.3 中期目标 (Week 5-8)

- [ ] 完成所有集成测试
- [ ] 完成 E2E 测试场景
- [ ] 性能测试和优化
- [ ] 达到覆盖率目标

### 12.4 长期目标 (Week 9+)

- [ ] 持续维护测试用例
- [ ] 监控生产环境性能
- [ ] 根据反馈优化测试策略

---

## 附录

### A. 测试依赖安装

```bash
npm install -D \
  y-websocket \
  fake-indexeddb \
  ws \
  @testing-library/user-event
```

### B. 测试命令

```bash
# 运行所有测试
npm run test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 运行 E2E 测试
npm run test:e2e

# 运行性能测试
npm run test:performance

# 生成覆盖率报告
npm run test:coverage

# 监视模式
npm run test:watch
```

### C. 参考资料

- [Vitest 文档](https://vitest.dev/)
- [Yjs 文档](https://docs.yjs.dev/)
- [Testing Library 文档](https://testing-library.com/)
- [Playwright 文档](https://playwright.dev/)