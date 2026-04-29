# 移动端PWA离线能力技术方案报告 (v1.13.0)

**版本**: 1.13.0
**日期**: 2026-04-05
**优先级**: P1
**目标**: 完善移动端PWA的离线数据同步能力

---

## 📋 执行摘要

本报告为 v1.13.0 版本的移动端PWA离线能力提供完整的技术方案设计。基于当前已有的基础PWA实现，通过引入后台同步、数据冲突解决、智能缓存管理等机制，实现用户在离线状态下的完整业务操作能力，并在网络恢复后自动同步数据。

### 核心目标

- ✅ 支持离线数据创建、编辑、删除操作
- ✅ 实现智能的数据同步策略
- ✅ 提供可靠的数据冲突解决机制
- ✅ 确保数据一致性和完整性
- ✅ 提供优雅的离线体验和同步反馈

---

## 1️⃣ 当前移动端PWA实现分析

### 1.1 已实现功能

#### Service Worker配置

**当前实现**:

```typescript
// sw.mobile.ts - 移动端专用Service Worker
CACHE_VERSION = 'v1.13.0'
CACHE_NAMES = {
  static: '7zi-static-v1.13.0',
  dynamic: '7zi-dynamic-v1.13.0',
  api: '7zi-api-v1.13.0',
  images: '7zi-images-v1.13.0',
}
```

**缓存策略**:

| 资源类型 | 策略 | TTL | 最大条目 |
|---------|------|-----|---------|
| 静态资源 | Cache-First | 1天 | 100 |
| 图片 | Cache-First | 7天 | 200 |
| API请求 | Network-First | 5分钟 | 50 |
| 动态内容 | Stale-While-Revalidate | 10分钟 | 20 |

#### 离线存储系统

**DraftStorage实现**:

```typescript
// draft-storage.ts
- 支持IndexedDB（优先）
- localStorage降级方案
- 自动过期清理（7天TTL）
- 支持三种类型: workflow, template, execution
```

**存储结构**:

```typescript
interface Draft<T = unknown> {
  id: string
  type: DraftType
  data: T
  createdAt: number
  updatedAt: number
  expiresAt: number
}
```

#### Web Push通知

- ✅ VAPID认证
- ✅ 权限管理
- ✅ 订阅持久化
- ✅ 本地和远程通知

### 1.2 现有架构优势

1. **完善的缓存策略**: 5种缓存策略，覆盖不同场景
2. **可靠的离线存储**: IndexedDB + localStorage双重保障
3. **类型安全**: 完整的TypeScript类型定义
4. **测试覆盖**: 89+测试用例，覆盖率~90%

### 1.3 当前存在的限制

| 限制 | 影响 | 严重程度 |
|------|------|---------|
| ❌ 缺少后台同步API | 离线操作无法自动同步 | P0 |
| ❌ 无数据冲突解决机制 | 多设备编辑可能导致数据丢失 | P0 |
| ❌ 同步状态管理不完善 | 用户无法感知同步进度 | P1 |
| ❌ 缺少同步队列管理 | 离线操作可能丢失 | P1 |
| ❌ 无增量同步支持 | 大数据量同步效率低 | P2 |
| ❌ 缺少同步失败重试机制 | 网络不稳定时数据可能丢失 | P1 |

---

## 2️⃣ Service Worker最佳实践研究

### 2.1 缓存策略优化建议

#### 2.1.1 智能缓存预热

**问题**: 首次访问时缓存为空，离线体验差

**解决方案**: 实现渐进式缓存预热

```typescript
// cache-warming.ts
interface CacheWarmingStrategy {
  priority: 'critical' | 'high' | 'normal' | 'low'
  urls: string[]
  conditions: {
    onlineOnly: boolean
    requireAuth: boolean
  }
}

const warmingStrategy: CacheWarmingStrategy[] = [
  {
    priority: 'critical',
    urls: ['/manifest.json', '/offline.html', '/app/layout.js'],
    conditions: { onlineOnly: true, requireAuth: false }
  },
  {
    priority: 'high',
    urls: ['/api/user/preferences', '/api/user/profile'],
    conditions: { onlineOnly: true, requireAuth: true }
  }
]
```

#### 2.1.2 缓存版本管理

**问题**: 缓存更新不及时，用户看到旧内容

**解决方案**: 实现智能缓存版本控制

```typescript
// cache-version.ts
class CacheVersionManager {
  private version: string
  private metadata: Map<string, CacheMetadata>

  async updateCacheVersion(): Promise<void> {
    const newVersion = this.generateVersion()
    await this.migrateOldCaches(newVersion)
    this.version = newVersion
  }

  private generateVersion(): string {
    // 基于文件内容哈希生成版本号
    const contentHash = this.calculateContentHash()
    return `v${contentHash.substring(0, 8)}`
  }
}
```

### 2.2 生命周期管理优化

#### 2.2.1 优雅的Service Worker更新

**当前问题**: Service Worker更新时用户可能看到页面闪烁

**解决方案**: 实现无缝更新流程

```typescript
// sw-update.ts
self.addEventListener('controllerchange', () => {
  // 新Service Worker已激活，提示用户刷新
  const message = {
    type: 'SW_UPDATE_AVAILABLE',
    payload: { reload: true }
  }
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage(message))
  })
})

// 客户端处理
navigator.serviceWorker.addEventListener('controllerchange', () => {
  // 优雅刷新当前页面
  window.location.reload()
})
```

#### 2.2.2 缓存清理策略

**问题**: 缓存占用过多存储空间

**解决方案**: 基于LRU的智能缓存清理

```typescript
// cache-cleanup.ts
class CacheCleanupManager {
  private maxCacheSize: number = 50 * 1024 * 1024 // 50MB

  async cleanupIfNecessary(): Promise<void> {
    const currentSize = await this.calculateCacheSize()

    if (currentSize > this.maxCacheSize) {
      await this.cleanupLRU(currentSize - this.maxCacheSize)
    }
  }

  private async cleanupLRU(targetSize: number): Promise<void> {
    const cacheEntries = await this.getCacheEntriesWithMetadata()

    // 按访问时间排序
    const sorted = cacheEntries.sort((a, b) =>
      a.lastAccessed - b.lastAccessed
    )

    let deletedSize = 0
    for (const entry of sorted) {
      if (deletedSize >= targetSize) break

      await caches.delete(entry.url)
      deletedSize += entry.size
    }
  }
}
```

### 2.3 性能优化建议

#### 2.3.1 预测性预加载

**原理**: 基于用户行为预测下一步可能访问的资源

```typescript
// predictive-preload.ts
class PredictivePreloader {
  private userBehaviorMap: Map<string, number[]> = new Map()

  async predictAndPreload(currentUrl: string): Promise<void> {
    const predictions = this.getPredictions(currentUrl)

    for (const url of predictions) {
      // 预加载预测的资源
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = url
      document.head.appendChild(link)
    }
  }
}
```

#### 2.3.2 智能压缩

**原理**: 根据网络状况动态调整资源压缩级别

```typescript
// adaptive-compression.ts
class AdaptiveCompressionManager {
  async getCompressionLevel(): Promise<'low' | 'medium' | 'high'> {
    const connection = (navigator as any).connection

    if (!connection) return 'medium'

    if (connection.effectiveType === '4g' && connection.rtt < 100) {
      return 'low' // 高速网络，低压缩
    } else if (connection.effectiveType === '3g' || connection.rtt < 300) {
      return 'medium'
    } else {
      return 'high' // 低速网络，高压缩
    }
  }
}
```

---

## 3️⃣ 离线数据同步方案设计

### 3.1 离线数据存储策略

#### 3.1.1 分层存储架构

```
┌─────────────────────────────────────────┐
│         应用层 (React Components)         │
└─────────────────────────────────────────┘
                   │
┌─────────────────────────────────────────┐
│      离线同步管理器 (OfflineSyncManager)   │
├─────────────────────────────────────────┤
│  - 同步队列管理                           │
│  - 冲突检测与解决                         │
│  - 状态同步                               │
└─────────────────────────────────────────┘
         │                 │
┌────────────────┐  ┌─────────────┐
│ 同步队列存储    │  │ 数据存储     │
│ (SyncQueue)    │  │ (DataStore) │
│ IndexedDB      │  │ IndexedDB   │
└────────────────┘  └─────────────┘
```

#### 3.1.2 数据存储结构设计

**同步队列表**:

```typescript
interface SyncQueueEntry {
  id: string
  operation: 'create' | 'update' | 'delete'
  resourceType: string  // 'workflow', 'template', 'execution' 等
  resourceId: string
  payload: unknown
  timestamp: number
  retryCount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  lastError?: string
}

interface SyncQueueStore {
  name: 'sync-queue'
  keyPath: 'id'
  indexes: {
    timestamp: number
    status: string
    resourceType: string
  }
}
```

**数据表**:

```typescript
interface DataEntry {
  id: string
  type: string
  data: unknown
  version: number
  serverVersion?: number
  syncedAt?: number
  conflicts?: ConflictInfo[]
}

interface DataStore {
  name: 'data-store'
  keyPath: 'id'
  indexes: {
    type: string
    version: number
    syncedAt: number
  }
}
```

**冲突信息**:

```typescript
interface ConflictInfo {
  id: string
  field: string
  localValue: unknown
  serverValue: unknown
  resolved?: boolean
  resolution?: 'local' | 'server' | 'merge'
}
```

### 3.2 数据冲突解决机制

#### 3.2.1 冲突检测

**基于字段级别的冲突检测**:

```typescript
// conflict-detection.ts
class ConflictDetector {
  async detectConflicts(
    localData: DataEntry,
    serverData: DataEntry
  ): Promise<ConflictInfo[]> {
    const conflicts: ConflictInfo[] = []

    // 检查版本号
    if (localData.version !== serverData.version - 1) {
      // 存在版本跳跃，可能存在冲突
    }

    // 逐字段比较
    for (const [field, localValue] of Object.entries(localData.data as Record<string, unknown>)) {
      const serverValue = (serverData.data as Record<string, unknown>)[field]

      if (!this.valuesEqual(localValue, serverValue)) {
        conflicts.push({
          id: this.generateConflictId(),
          field,
          localValue,
          serverValue,
          resolved: false
        })
      }
    }

    return conflicts
  }

  private valuesEqual(a: unknown, b: unknown): boolean {
    // 深度比较逻辑
    return JSON.stringify(a) === JSON.stringify(b)
  }
}
```

#### 3.2.2 冲突解决策略

**策略1: 最后写入优先 (Last-Write-Wins)**

```typescript
async resolveLastWriteWins(conflicts: ConflictInfo[]): Promise<void> {
  for (const conflict of conflicts) {
    // 使用时间戳较大的值
    const localTimestamp = await this.getTimestamp('local', conflict.field)
    const serverTimestamp = await this.getTimestamp('server', conflict.field)

    conflict.resolution = localTimestamp > serverTimestamp ? 'local' : 'server'
    conflict.resolved = true
  }
}
```

**策略2: 字段级别合并 (Field-Level Merge)**

```typescript
async resolveFieldMerge(conflicts: ConflictInfo[]): Promise<void> {
  for (const conflict of conflicts) {
    if (this.canMerge(conflict.localValue, conflict.serverValue)) {
      // 智能合并字段值
      const mergedValue = this.mergeValues(
        conflict.localValue,
        conflict.serverValue
      )
      conflict.resolution = 'merge'
      // 更新数据为合并后的值
      await this.updateField(conflict.field, mergedValue)
      conflict.resolved = true
    }
  }
}
```

**策略3: 用户手动选择 (Manual Selection)**

```typescript
async resolveManual(conflicts: ConflictInfo[]): Promise<void> {
  // 显示冲突UI，让用户选择
  const conflictUI = new ConflictResolutionUI(conflicts)
  const resolutions = await conflictUI.waitForUserSelection()

  for (const [conflictId, resolution] of Object.entries(resolutions)) {
    const conflict = conflicts.find(c => c.id === conflictId)
    if (conflict) {
      conflict.resolution = resolution
      conflict.resolved = true
    }
  }
}
```

#### 3.2.3 冲突解决策略选择

```typescript
// conflict-resolution-manager.ts
interface ResolutionStrategy {
  type: 'last-write-wins' | 'field-merge' | 'manual' | 'custom'
  priority: number
  conditions: (conflicts: ConflictInfo[]) => boolean
}

const resolutionStrategies: ResolutionStrategy[] = [
  {
    type: 'field-merge',
    priority: 1,
    conditions: (conflicts) =>
      conflicts.every(c => c.canMerge)
  },
  {
    type: 'last-write-wins',
    priority: 2,
    conditions: (conflicts) =>
      conflicts.length === 1 &&
      conflicts[0].field === 'timestamp'
  },
  {
    type: 'manual',
    priority: 3,
    conditions: () => true // 默认策略
  }
]

class ConflictResolutionManager {
  async resolve(conflicts: ConflictInfo[]): Promise<void> {
    // 选择第一个满足条件的策略
    const strategy = resolutionStrategies.find(s =>
      s.conditions(conflicts)
    )

    await this.executeStrategy(strategy.type, conflicts)
  }
}
```

### 3.3 后台同步策略

#### 3.3.1 同步触发时机

```typescript
// sync-trigger.ts
interface SyncTrigger {
  type: 'network' | 'interval' | 'manual' | 'data-change'
  priority: number
}

class SyncTriggerManager {
  private triggers: SyncTrigger[] = []

  setupTriggers(): void {
    // 1. 网络状态变化时触发
    window.addEventListener('online', () => {
      this.triggerSync({ type: 'network', priority: 1 })
    })

    // 2. 定时同步（每5分钟）
    setInterval(() => {
      this.triggerSync({ type: 'interval', priority: 3 })
    }, 5 * 60 * 1000)

    // 3. 数据变化时触发
    dataStore.onChange(() => {
      this.triggerSync({ type: 'data-change', priority: 2 })
    })
  }

  private async triggerSync(trigger: SyncTrigger): Promise<void> {
    // 检查是否有优先级更高的同步任务
    const hasHigherPriority = this.triggers.some(t => t.priority < trigger.priority)

    if (!hasHigherPriority) {
      await this.performSync(trigger)
    }
  }
}
```

#### 3.3.2 同步队列管理

```typescript
// sync-queue-manager.ts
class SyncQueueManager {
  private queue: Map<string, SyncQueueEntry> = new Map()
  private maxRetryCount = 3
  private retryDelay = 1000 // 1秒

  async addToQueue(entry: Omit<SyncQueueEntry, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<void> {
    const queueEntry: SyncQueueEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    }

    this.queue.set(queueEntry.id, queueEntry)
    await this.persistQueue()
  }

  async processQueue(): Promise<void> {
    const pendingEntries = Array.from(this.queue.values())
      .filter(e => e.status === 'pending')
      .sort((a, b) => a.timestamp - b.timestamp) // 按时间顺序处理

    for (const entry of pendingEntries) {
      try {
        await this.processEntry(entry)
      } catch (error) {
        await this.handleFailure(entry, error)
      }
    }
  }

  private async processEntry(entry: SyncQueueEntry): Promise<void> {
    entry.status = 'processing'

    switch (entry.operation) {
      case 'create':
        await this.syncCreate(entry)
        break
      case 'update':
        await this.syncUpdate(entry)
        break
      case 'delete':
        await this.syncDelete(entry)
        break
    }

    entry.status = 'completed'
    this.queue.delete(entry.id)
    await this.persistQueue()
  }

  private async handleFailure(entry: SyncQueueEntry, error: unknown): Promise<void> {
    entry.retryCount++

    if (entry.retryCount >= this.maxRetryCount) {
      entry.status = 'failed'
      entry.lastError = error instanceof Error ? error.message : String(error)
    } else {
      entry.status = 'pending'
      // 指数退避
      const delay = this.retryDelay * Math.pow(2, entry.retryCount - 1)
      setTimeout(() => this.processQueue(), delay)
    }

    await this.persistQueue()
  }
}
```

#### 3.3.3 增量同步

**原理**: 只同步发生变化的数据，减少网络传输

```typescript
// incremental-sync.ts
class IncrementalSyncManager {
  private lastSyncTimestamp: number = 0

  async syncIncrementally(): Promise<void> {
    // 获取服务器上次同步时间以来的变化
    const changes = await this.fetchChanges(this.lastSyncTimestamp)

    // 应用变化到本地
    for (const change of changes) {
      await this.applyChange(change)
    }

    // 将本地变化推送到服务器
    await this.pushLocalChanges()

    // 更新同步时间戳
    this.lastSyncTimestamp = Date.now()
    await this.saveLastSyncTimestamp()
  }

  private async fetchChanges(since: number): Promise<DataChange[]> {
    const response = await fetch(`/api/sync/changes?since=${since}`)
    return response.json()
  }

  private async applyChange(change: DataChange): Promise<void> {
    // 检测并解决冲突
    const conflicts = await this.detectConflicts(change)
    if (conflicts.length > 0) {
      await this.resolveConflicts(conflicts)
    }

    // 应用变化
    switch (change.type) {
      case 'create':
        await this.createResource(change)
        break
      case 'update':
        await this.updateResource(change)
        break
      case 'delete':
        await this.deleteResource(change)
        break
    }
  }
}
```

### 3.4 同步状态管理

#### 3.4.1 同步状态追踪

```typescript
// sync-status.ts
interface SyncStatus {
  isSyncing: boolean
  lastSyncTime: number
  pendingOperations: number
  failedOperations: number
  conflicts: number
  progress: number
}

class SyncStatusManager {
  private status: SyncStatus = {
    isSyncing: false,
    lastSyncTime: 0,
    pendingOperations: 0,
    failedOperations: 0,
    conflicts: 0,
    progress: 0
  }

  private listeners: Set<(status: SyncStatus) => void> = new Set()

  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify(): void {
    this.listeners.forEach(listener => listener({ ...this.status }))
  }

  updateStatus(update: Partial<SyncStatus>): void {
    this.status = { ...this.status, ...update }
    this.notify()
  }
}
```

#### 3.4.2 用户界面反馈

```typescript
// sync-ui.tsx
interface SyncIndicatorProps {
  status: SyncStatus
}

function SyncIndicator({ status }: SyncIndicatorProps): React.ReactElement {
  if (status.isSyncing) {
    return (
      <div className="sync-indicator syncing">
        <SyncIcon spinning />
        <span>同步中... {Math.round(status.progress)}%</span>
      </div>
    )
  }

  if (status.failedOperations > 0) {
    return (
      <div className="sync-indicator failed">
        <ErrorIcon />
        <span>{status.failedOperations} 个操作失败</span>
        <button onClick={handleRetry}>重试</button>
      </div>
    )
  }

  if (status.conflicts > 0) {
    return (
      <div className="sync-indicator conflicts">
        <WarningIcon />
        <span>{status.conflicts} 个冲突需要解决</span>
        <button onClick={handleResolve}>解决</button>
      </div>
    )
  }

  return (
    <div className="sync-indicator success">
      <CheckIcon />
      <span>已同步 {formatTime(status.lastSyncTime)}</span>
    </div>
  )
}
```

---

## 4️⃣ 现有方案的问题和优化点

### 4.1 问题分析

#### 问题1: 缺少后台同步API支持

**当前状态**:
- Service Worker不支持Background Sync API
- 离线操作需要手动触发同步
- 浏览器关闭后无法继续同步

**影响**:
- 用户可能忘记同步离线操作
- 离线编辑的数据可能丢失
- 用户体验不连贯

**解决方案**:

```typescript
// background-sync.ts
class BackgroundSyncManager {
  private swRegistration: ServiceWorkerRegistration

  async registerBackgroundSync(tag: string): Promise<void> {
    if ('sync' in this.swRegistration) {
      await this.swRegistration.sync.register(tag)
    }
  }

  async setupSyncHandlers(): Promise<void> {
    if (!('serviceWorker' in navigator)) return

    this.swRegistration = await navigator.serviceWorker.ready

    // 注册同步标签
    await this.registerBackgroundSync('sync-queue')

    // 监听同步事件
    navigator.serviceWorker.addEventListener('sync', (event) => {
      if (event.tag === 'sync-queue') {
        event.waitUntil(this.processSyncQueue())
      }
    })
  }

  private async processSyncQueue(): Promise<void> {
    // 处理同步队列
    await syncQueueManager.processQueue()
  }
}
```

#### 问题2: 数据冲突解决不完善

**当前状态**:
- 缺少冲突检测机制
- 没有冲突解决UI
- 冲突可能导致数据丢失

**影响**:
- 多设备编辑时数据不一致
- 用户可能丢失重要的修改
- 无法追踪冲突历史

**解决方案**:

参见3.2节的完整冲突检测和解决机制

#### 问题3: 同步状态管理不完善

**当前状态**:
- 用户无法查看同步进度
- 同步失败没有明确提示
- 无法查看同步历史

**影响**:
- 用户不知道数据是否同步成功
- 同步失败时无法及时处理
- 缺乏透明度和信任感

**解决方案**:

参见3.4节的完整同步状态管理系统

### 4.2 性能优化点

#### 优化1: 减少同步开销

**问题**: 每次同步都传输完整数据

**解决方案**:

```typescript
// sync-optimization.ts
class SyncOptimizer {
  async optimizeSync(localData: DataEntry, serverData: DataEntry): Promise<{
    optimized: boolean
    delta: Record<string, unknown>
    compressionRatio: number
  }> {
    // 计算增量
    const delta = this.calculateDelta(localData.data, serverData.data)

    // 应用压缩
    const compressed = await this.compressData(delta)

    return {
      optimized: true,
      delta: compressed,
      compressionRatio: JSON.stringify(delta).length / JSON.stringify(localData.data).length
    }
  }

  private calculateDelta(local: Record<string, unknown>, server: Record<string, unknown>): Record<string, unknown> {
    const delta: Record<string, unknown> = {}

    // 只包含变化的字段
    for (const [key, value] of Object.entries(local)) {
      if (!this.valuesEqual(value, server[key])) {
        delta[key] = value
      }
    }

    return delta
  }

  private async compressData(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    // 使用Compression Stream API压缩数据
    const jsonString = JSON.stringify(data)
    const compressed = await this.compressString(jsonString)
    return { compressed }
  }
}
```

#### 优化2: 批量同步

**问题**: 多个小请求导致网络开销大

**解决方案**:

```typescript
// batch-sync.ts
class BatchSyncManager {
  private batchSize = 10
  private batchTimeout = 5000 // 5秒

  async queueForSync(operation: SyncOperation): Promise<void> {
    this.batch.push(operation)

    if (this.batch.length >= this.batchSize) {
      await this.flushBatch()
    } else {
      // 设置定时器，超时自动刷新
      clearTimeout(this.batchTimer)
      this.batchTimer = setTimeout(() => this.flushBatch(), this.batchTimeout)
    }
  }

  private async flushBatch(): Promise<void> {
    if (this.batch.length === 0) return

    const operations = [...this.batch]
    this.batch = []

    try {
      const response = await fetch('/api/sync/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations })
      })

      if (!response.ok) {
        throw new Error('Batch sync failed')
      }

      const results = await response.json()

      // 处理批量结果
      for (let i = 0; i < operations.length; i++) {
        if (results[i].success) {
          operations[i].status = 'completed'
        } else {
          operations[i].status = 'failed'
          operations[i].error = results[i].error
        }
      }
    } catch (error) {
      // 整批失败，标记所有操作为失败
      operations.forEach(op => {
        op.status = 'failed'
        op.error = error instanceof Error ? error.message : String(error)
      })
    }
  }
}
```

#### 优化3: 智能预同步

**原理**: 在用户可能需要数据之前提前同步

```typescript
// predictive-sync.ts
class PredictiveSyncManager {
  private usagePatterns: Map<string, number[]> = new Map()

  recordUsage(resourceType: string, resourceId: string): void {
    const pattern = this.usagePatterns.get(resourceType) || []
    pattern.push(Date.now())

    // 只保留最近100次使用记录
    if (pattern.length > 100) {
      pattern.shift()
    }

    this.usagePatterns.set(resourceType, pattern)
  }

  predictNextResources(): string[] {
    const predictions: string[] = []

    for (const [resourceType, timestamps] of this.usagePatterns) {
      // 分析使用模式，预测下一步可能使用的资源
      const lastUsed = timestamps[timestamps.length - 1]
      const avgInterval = this.calculateAverageInterval(timestamps)

      // 如果接近下次使用时间，预测该资源
      if (Date.now() - lastUsed > avgInterval * 0.8) {
        predictions.push(resourceType)
      }
    }

    return predictions
  }

  async syncPredictedResources(): Promise<void> {
    const predictions = this.predictNextResources()

    for (const resource of predictions) {
      // 预同步预测的资源
      await this.syncResource(resource)
    }
  }
}
```

---

## 5️⃣ 实施计划

### 5.1 开发阶段划分

#### 阶段1: 核心基础设施 (Week 1-2)

**目标**: 搭建离线同步的核心架构

**任务清单**:
- [ ] 创建SyncQueue存储结构
- [ ] 实现SyncQueueManager
- [ ] 实现DataStore存储结构
- [ ] 实现ConflictDetector
- [ ] 实现SyncStatusManager
- [ ] 编写单元测试

**交付物**:
- `src/lib/offline-sync/sync-queue.ts`
- `src/lib/offline-sync/data-store.ts`
- `src/lib/offline-sync/conflict-detector.ts`
- `src/lib/offline-sync/sync-status.ts`
- 单元测试文件

#### 阶段2: 冲突解决机制 (Week 3)

**目标**: 实现完整的冲突检测和解决系统

**任务清单**:
- [ ] 实现Last-Write-Wins策略
- [ ] 实现Field-Level Merge策略
- [ ] 实现Manual Selection策略
- [ ] 创建ConflictResolutionUI组件
- [ ] 编写集成测试

**交付物**:
- `src/lib/offline-sync/resolution-strategies/`
- `src/components/offline-sync/ConflictResolutionUI.tsx`
- 集成测试文件

#### 阶段3: 后台同步 (Week 4)

**目标**: 实现后台同步API支持

**任务清单**:
- [ ] 实现BackgroundSyncManager
- [ ] 集成到Service Worker
- [ ] 实现网络状态监听
- [ ] 实现定时同步
- [ ] 编写E2E测试

**交付物**:
- `src/lib/offline-sync/background-sync.ts`
- 更新后的`public/sw.mobile.ts`
- E2E测试文件

#### 阶段4: 性能优化 (Week 5)

**目标**: 优化同步性能和用户体验

**任务清单**:
- [ ] 实现增量同步
- [ ] 实现批量同步
- [ ] 实现预测性预同步
- [ ] 实现智能压缩
- [ ] 性能测试和调优

**交付物**:
- `src/lib/offline-sync/incremental-sync.ts`
- `src/lib/offline-sync/batch-sync.ts`
- `src/lib/offline-sync/predictive-sync.ts`
- `src/lib/offline-sync/sync-optimizer.ts`
- 性能测试报告

#### 阶段5: 用户界面 (Week 6)

**目标**: 创建完整的用户界面

**任务清单**:
- [ ] 实现SyncIndicator组件
- [ ] 实现SyncSettings组件
- [ ] 实现SyncHistory组件
- [ ] 实现ConflictResolution对话框
- [ ] 实现离线状态提示
- [ ] UI/UX测试

**交付物**:
- `src/components/offline-sync/SyncIndicator.tsx`
- `src/components/offline-sync/SyncSettings.tsx`
- `src/components/offline-sync/SyncHistory.tsx`
- UI测试报告

#### 阶段6: 文档和测试 (Week 7-8)

**目标**: 完善文档和全面测试

**任务清单**:
- [ ] 编写技术文档
- [ ] 编写用户指南
- [ ] 编写API文档
- [ ] 全面测试（单元、集成、E2E）
- [ ] 性能测试
- [ ] 安全审计

**交付物**:
- `docs/OFFLINE_SYNC.md`
- `docs/OFFLINE_SYNC_API.md`
- 测试报告
- 性能测试报告

### 5.2 技术栈选择

| 功能 | 技术选型 | 理由 |
|------|---------|------|
| 存储引擎 | IndexedDB (idb库) | 大容量存储，事务支持 |
| 冲突检测 | 自研 | 针对业务需求定制 |
| 后台同步 | Background Sync API | 浏览器原生支持 |
| 压缩算法 | Compression Stream API | 浏览器原生支持 |
| 状态管理 | Zustand | 轻量级，易于集成 |
| UI框架 | React + Tailwind CSS | 项目已有技术栈 |
| 测试框架 | Vitest + Playwright | 项目已有技术栈 |

### 5.3 风险评估与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| Background Sync API浏览器不支持 | 中 | 高 | 降级到轮询同步 |
| IndexedDB存储空间不足 | 低 | 中 | 实现LRU缓存清理 |
| 数据冲突频繁发生 | 中 | 中 | 优化冲突检测，提供手动解决选项 |
| 同步性能不达标 | 低 | 中 | 实现增量同步和批量同步 |
| 用户不接受同步UI | 中 | 低 | 充分的用户测试和反馈收集 |

### 5.4 成功指标

| 指标 | 目标 | 测量方法 |
|------|------|---------|
| 离线操作成功率 | >95% | 统计离线操作最终同步成功比例 |
| 同步延迟 | <2秒 | 从触发同步到完成的时间 |
| 冲突解决率 | >90% | 自动解决冲突占总冲突的比例 |
| 存储空间使用 | <50MB | IndexedDB总使用量 |
| 用户体验评分 | >4.5/5 | 用户满意度调查 |

---

## 6️⃣ 代码示例

### 6.1 完整的离线同步管理器

```typescript
// src/lib/offline-sync/offline-sync-manager.ts

import { getDraftStorageManager } from '../db/draft-storage'

/**
 * 离线同步管理器
 * 协调所有同步相关的功能
 */
export class OfflineSyncManager {
  private queueManager: SyncQueueManager
  private conflictDetector: ConflictDetector
  private resolutionManager: ConflictResolutionManager
  private statusManager: SyncStatusManager
  private backgroundSync: BackgroundSyncManager

  constructor() {
    this.queueManager = new SyncQueueManager()
    this.conflictDetector = new ConflictDetector()
    this.resolutionManager = new ConflictResolutionManager()
    this.statusManager = new SyncStatusManager()
    this.backgroundSync = new BackgroundSyncManager()
  }

  /**
   * 初始化离线同步管理器
   */
  async initialize(): Promise<void> {
    // 初始化各个子模块
    await this.queueManager.initialize()
    await this.backgroundSync.setupSyncHandlers()

    // 监听网络状态
    this.setupNetworkListeners()

    // 定时同步
    this.setupPeriodicSync()

    console.log('[OfflineSyncManager] Initialized')
  }

  /**
   * 记录离线操作
   */
  async recordOfflineOperation(
    operation: 'create' | 'update' | 'delete',
    resourceType: string,
    resourceId: string,
    data: unknown
  ): Promise<void> {
    await this.queueManager.addToQueue({
      operation,
      resourceType,
      resourceId,
      payload: data
    })

    this.statusManager.updateStatus({
      pendingOperations: this.statusManager.getStatus().pendingOperations + 1
    })
  }

  /**
   * 执行同步
   */
  async performSync(): Promise<void> {
    const status = this.statusManager.getStatus()

    if (status.isSyncing) {
      console.warn('[OfflineSyncManager] Sync already in progress')
      return
    }

    this.statusManager.updateStatus({ isSyncing: true, progress: 0 })

    try {
      // 处理同步队列
      await this.queueManager.processQueue()

      // 增量同步
      await this.incrementalSyncManager.syncIncrementally()

      this.statusManager.updateStatus({
        isSyncing: false,
        lastSyncTime: Date.now(),
        progress: 100
      })
    } catch (error) {
      console.error('[OfflineSyncManager] Sync failed:', error)

      this.statusManager.updateStatus({
        isSyncing: false,
        failedOperations: this.statusManager.getStatus().failedOperations + 1
      })

      throw error
    }
  }

  /**
   * 设置网络监听
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      console.log('[OfflineSyncManager] Network online')
      this.performSync()
    })

    window.addEventListener('offline', () => {
      console.log('[OfflineSyncManager] Network offline')
      this.statusManager.updateStatus({ isSyncing: false })
    })
  }

  /**
   * 设置定时同步
   */
  private setupPeriodicSync(): void {
    // 每5分钟同步一次
    setInterval(() => {
      if (navigator.onLine) {
        this.performSync()
      }
    }, 5 * 60 * 1000)
  }

  /**
   * 获取同步状态
   */
  getStatus(): SyncStatus {
    return this.statusManager.getStatus()
  }

  /**
   * 订阅同步状态变化
   */
  subscribeStatus(listener: (status: SyncStatus) => void): () => void {
    return this.statusManager.subscribe(listener)
  }

  /**
   * 解决冲突
   */
  async resolveConflicts(entryId: string, resolution: ConflictResolution): Promise<void> {
    const entry = await this.queueManager.getEntry(entryId)
    if (!entry) return

    await this.resolutionManager.resolve(entry.conflicts!, resolution)

    // 重新加入队列进行同步
    await this.queueManager.updateStatus(entryId, 'pending')
    await this.performSync()
  }
}

// 单例实例
let offlineSyncManagerInstance: OfflineSyncManager | null = null

export function getOfflineSyncManager(): OfflineSyncManager {
  if (!offlineSyncManagerInstance) {
    offlineSyncManagerInstance = new OfflineSyncManager()
  }
  return offlineSyncManagerInstance
}

### 6.2 React Hook使用示例

```typescript
// src/hooks/useOfflineSync.ts
import { useState, useEffect } from 'react'
import { getOfflineSyncManager, type SyncStatus } from '@/lib/offline-sync/offline-sync-manager'

export function useOfflineSync() {
  const syncManager = getOfflineSyncManager()
  const [status, setStatus] = useState<SyncStatus>(syncManager.getStatus())

  useEffect(() => {
    const unsubscribe = syncManager.subscribeStatus(setStatus)
    return unsubscribe
  }, [])

  const recordOperation = async (
    operation: 'create' | 'update' | 'delete',
    resourceType: string,
    resourceId: string,
    data: unknown
  ) => {
    await syncManager.recordOfflineOperation(
      operation,
      resourceType,
      resourceId,
      data
    )
  }

  const sync = async () => {
    try {
      await syncManager.performSync()
    } catch (error) {
      console.error('Sync failed:', error)
      throw error
    }
  }

  const resolveConflicts = async (entryId: string, resolution: ConflictResolution) => {
    await syncManager.resolveConflicts(entryId, resolution)
  }

  return {
    status,
    recordOperation,
    sync,
    resolveConflicts,
    isSyncing: status.isSyncing,
    isOnline: navigator.onLine,
    hasPendingOperations: status.pendingOperations > 0,
    hasConflicts: status.conflicts > 0,
    hasFailedOperations: status.failedOperations > 0,
  }
}

// 使用示例
function MyComponent() {
  const { status, recordOperation, sync, isSyncing } = useOfflineSync()

  const handleSave = async (data: unknown) => {
    if (navigator.onLine) {
      // 在线，直接保存
      await api.save(data)
    } else {
      // 离线，记录操作
      await recordOperation('create', 'workflow', 'new-workflow', data)
    }
  }

  const handleSync = async () => {
    try {
      await sync()
      alert('同步成功!')
    } catch (error) {
      alert('同步失败，请稍后重试')
    }
  }

  return (
    <div>
      <p>同步状态: {status.isSyncing ? '同步中' : '已完成'}</p>
      <p>待同步操作: {status.pendingOperations}</p>
      {!navigator.onLine && (
        <div className="offline-banner">
          ⚠️ 当前离线，操作将在联网后自动同步
        </div>
      )}
      <button onClick={handleSave}>保存</button>
      {!navigator.onLine && (
        <button onClick={handleSync}>立即同步</button>
      )}
    </div>
  )
}
```

### 6.3 Service Worker集成示例

```typescript
// public/sw.mobile.ts (更新部分)

import { getCacheManager } from './cache-strategy'

// 新增：同步队列处理
const SYNC_TAG = 'sync-queue'

self.addEventListener('sync', (event: ExtendableEvent) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(processSyncQueue())
  }
})

async function processSyncQueue(): Promise<void> {
  try {
    // 从IndexedDB读取同步队列
    const syncQueue = await getSyncQueueFromIndexedDB()

    // 批量处理同步操作
    const batchOperations = syncQueue
      .filter(entry => entry.status === 'pending')
      .map(entry => ({
        id: entry.id,
        operation: entry.operation,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        payload: entry.payload,
      }))

    if (batchOperations.length === 0) {
      return
    }

    // 发送批量同步请求
    const response = await fetch('/api/sync/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ operations: batchOperations }),
    })

    if (!response.ok) {
      throw new Error('Sync batch failed')
    }

    const results = await response.json()

    // 更新同步队列状态
    await updateSyncQueueStatus(results)

    // 通知客户端同步完成
    notifyClients({ type: 'SYNC_COMPLETED', results })
  } catch (error) {
    console.error('[SW] Sync failed:', error)

    // 通知客户端同步失败
    notifyClients({ type: 'SYNC_FAILED', error: String(error) })
  }
}

function notifyClients(message: { type: string; [key: string]: unknown }): void {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage(message))
  })
}

async function getSyncQueueFromIndexedDB(): Promise<SyncQueueEntry[]> {
  // 从IndexedDB读取同步队列
  // 实现细节...
  return []
}

async function updateSyncQueueStatus(results: SyncResult[]): Promise<void> {
  // 更新IndexedDB中的同步队列状态
  // 实现细节...
}
```

---

## 7️⃣ 总结与建议

### 7.1 技术方案总结

本方案为v1.13.0版本的移动端PWA离线能力提供了完整的技术设计，包括：

#### 核心功能

1. **离线数据存储策略**
   - 分层存储架构（同步队列 + 数据存储）
   - IndexedDB作为主要存储引擎
   - 完整的类型定义和错误处理

2. **数据冲突解决机制**
   - 字段级别的冲突检测
   - 多种冲突解决策略（LWW、Field Merge、Manual）
   - 灵活的策略选择机制

3. **后台同步策略**
   - 多触发时机（网络状态、定时、手动、数据变化）
   - 完整的同步队列管理
   - 增量同步支持
   - 重试机制和错误处理

4. **同步状态管理**
   - 实时状态追踪
   - 用户友好的界面反馈
   - 完整的订阅/通知机制

#### 性能优化

1. **智能缓存管理**
   - 缓存预热策略
   - 版本管理
   - LRU清理

2. **同步性能优化**
   - 增量同步
   - 批量同步
   - 预测性预同步
   - 智能压缩

3. **Service Worker优化**
   - 优雅更新
   - 后台同步API
   - 预测性预加载

### 7.2 实施建议

#### 分阶段实施

按照第5节制定的8周实施计划，分阶段推进：

1. **Week 1-2**: 核心基础设施
   - 优先实现存储层和基础管理类
   - 确保数据结构设计合理

2. **Week 3**: 冲突解决机制
   - 实现核心冲突检测
   - 提供至少两种解决策略

3. **Week 4**: 后台同步
   - 集成Background Sync API
   - 实现网络状态监听

4. **Week 5**: 性能优化
   - 实现增量同步
   - 性能测试和调优

5. **Week 6**: 用户界面
   - 创建直观的同步界面
   - 提供清晰的状态反馈

6. **Week 7-8**: 文档和测试
   - 完善技术文档
   - 全面测试和修复

#### 关键注意事项

1. **向后兼容**
   - 新功能不影响现有功能
   - 提供渐进式升级路径

2. **用户体验**
   - 离线操作无感知
   - 同步状态清晰可见
   - 冲突解决简单直观

3. **性能监控**
   - 监控同步成功率
   - 监控同步延迟
   - 监控存储使用量

4. **错误处理**
   - 提供友好的错误提示
   - 实现自动重试机制
   - 记录详细的错误日志

5. **安全性**
   - 数据加密传输
   - 访问权限控制
   - 敏感数据保护

### 7.3 风险缓解

#### 浏览器兼容性

**风险**: Background Sync API在某些浏览器中不支持

**缓解措施**:
- 提供降级方案（轮询同步）
- 检测API支持情况
- 在不支持时禁用相关功能

```typescript
if ('sync' in ServiceWorkerRegistration.prototype) {
  // 支持Background Sync API
  await swRegistration.sync.register('sync-queue')
} else {
  // 降级到轮询同步
  setInterval(() => {
    performSync()
  }, 5 * 60 * 1000)
}
```

#### 存储空间限制

**风险**: IndexedDB存储空间不足

**缓解措施**:
- 实现LRU缓存清理
- 监控存储使用量
- 提供用户清理选项

```typescript
class StorageMonitor {
  private maxStorage = 50 * 1024 * 1024 // 50MB

  async checkStorage(): Promise<void> {
    const usage = await this.getStorageUsage()

    if (usage > this.maxStorage * 0.9) {
      // 使用量超过90%，触发清理
      await this.cleanupOldEntries()
    }
  }

  private async getStorageUsage(): Promise<number> {
    // 计算存储使用量
    return 0
  }

  private async cleanupOldEntries(): Promise<void> {
    // 清理旧数据
  }
}
```

#### 数据一致性

**风险**: 多设备编辑导致数据不一致

**缓解措施**:
- 实现版本控制
- 提供冲突解决UI
- 记录完整的操作历史

```typescript
interface DataEntry {
  id: string
  version: number
  serverVersion: number
  data: unknown
  history: DataHistoryEntry[]
}

interface DataHistoryEntry {
  version: number
  timestamp: number
  operation: 'create' | 'update' | 'delete'
  data: unknown
  deviceId: string
}
```

### 7.4 后续优化方向

1. **AI驱动的同步预测**
   - 使用机器学习预测用户行为
   - 优化预同步策略
   - 提升用户体验

2. **协作编辑支持**
   - 实现OT/CRDT算法
   - 支持多人实时协作
   - 冲突自动合并

3. **离线数据分析**
   - 离线统计报表
   - 本地数据可视化
   - 离线智能推荐

4. **边缘计算**
   - 在Service Worker中执行部分计算
   - 减少服务器负载
   - 提升响应速度

5. **PWA增强功能**
   - 文件系统访问
   - 分享目标
   - 联系人选择器
   - 徽章API

---

## 8️⃣ 附录

### 8.1 术语表

| 术语 | 解释 |
|------|------|
| PWA | Progressive Web App，渐进式Web应用 |
| Service Worker | 浏览器后台脚本，实现离线缓存和推送 |
| IndexedDB | 浏览器内置的NoSQL数据库 |
| Background Sync API | 浏览器API，允许在后台同步数据 |
| LRU | Least Recently Used，最近最少使用算法 |
| CRUD | Create, Read, Update, Delete，增删改查 |
| TTL | Time To Live，生存时间 |
| OT | Operational Transformation，操作转换算法 |
| CRDT | Conflict-free Replicated Data Type，无冲突复制数据类型 |

### 8.2 参考资源

#### 官方文档
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Sync_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [PWA Best Practices](https://web.dev/pwa/)

#### 技术文章
- [Offline Storage for PWA](https://web.dev/offline-storage/)
- [Data Synchronization in PWA](https://web.dev/syncing-in-the-background/)
- [Conflict Resolution Strategies](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)

#### 开源项目
- [Workbox](https://github.com/GoogleChrome/workbox) - Google的Service Worker工具库
- [Dexie.js](https://dexie.org/) - IndexedDB封装库
- [RxDB](https://rxdb.info/) - 基于RxJS的离线优先数据库

### 8.3 测试检查清单

#### 单元测试
- [ ] SyncQueueManager测试
- [ ] ConflictDetector测试
- [ ] ResolutionStrategy测试
- [ ] SyncStatusManager测试
- [ ] DataStore测试

#### 集成测试
- [ ] 离线操作记录测试
- [ ] 同步队列处理测试
- [ ] 冲突检测和解决测试
- [ ] 网络状态切换测试

#### E2E测试
- [ ] 完整离线到在线流程测试
- [ ] 多设备冲突测试
- [ ] 后台同步测试
- [ ] UI交互测试

#### 性能测试
- [ ] 同步延迟测试
- [ ] 存储使用量测试
- [ ] 批量同步性能测试
- [ ] 增量同步效率测试

### 8.4 部署清单

#### 环境变量
```bash
# .env.production
NEXT_PUBLIC_PWA_ENABLED=true
NEXT_PWA_OFFLINE_SYNC_ENABLED=true
SYNC_API_URL=/api/sync
SYNC_RETRY_ATTEMPTS=3
SYNC_RETRY_DELAY=1000
```

#### 服务器配置
- [ ] 配置API端点：`/api/sync/batch`
- [ ] 配置API端点：`/api/sync/changes`
- [ ] 配置API端点：`/api/sync/conflict`
- [ ] 配置CORS头部
- [ ] 配置认证中间件

#### Service Worker更新
- [ ] 更新`public/sw.mobile.ts`
- [ ] 清理旧缓存
- [ ] 测试新Service Worker
- [ ] 通知用户更新

#### 监控配置
- [ ] 配置同步成功率监控
- [ ] 配置同步延迟监控
- [ ] 配置错误日志收集
- [ ] 配置性能指标追踪

---

## 📞 联系方式

如有问题或建议，请联系：
- 技术负责人: [TODO]
- 项目经理: [TODO]
- 技术支持: [TODO]

---

**报告版本**: 1.0.0
**最后更新**: 2026-04-05
**状态**: ✅ 已完成

