# API 缓存审查报告

**审查日期**: 2026-04-08  
**工作目录**: `/root/.openclaw/workspace/7zi-frontend`  
**审查人**: 子代理 (api-cache-review-april8)

---

## 1. 缓存实现状态

### 1.1 已添加缓存的路由 (5个)

| 路由 | 缓存键 | TTL | Key 生成 | Invalidation | 状态 |
|------|--------|-----|----------|--------------|------|
| `/api/agents/learning/route.ts` | `endpoint: agents-learning` + params + version | MEDIUM (30min) | ✅ 正确 | ❌ **缺失** | ⚠️ 需优化 |
| `/api/rooms/route.ts` | `endpoint: rooms-list` + params + version | SHORT (5min) | ✅ 正确 | ✅ POST时有删除 | ⚠️ 搜索查询跳过缓存 |
| `/api/rooms/[id]/route.ts` | `endpoint: room-detail` + roomId + version | SHORT (5min) | ✅ 正确 | ⚠️ **DELETE缺失 list invalidation** | ⚠️ 需修复 |
| `/api/search/route.ts` | `endpoint: search` + params + version | SHORT (5min) | ✅ 正确 | ❌ **缺失** | ⚠️ 需优化 |
| `/api/notifications/route.ts` | `userId` + `endpoint: notifications` + params + version | SHORT (5min) | ✅ 正确(含用户隔离) | ⚠️ POST时有删除用户缓存，但条件过滤的删除不完整 | ⚠️ 需优化 |

### 1.2 缓存基础设施

- **缓存类**: `HotDataCache<T>` (`src/lib/cache/hot-data-cache.ts`)
- **预设配置**:
  - `SHORT`: TTL=5min, maxSize=500, maxMemory=50MB
  - `MEDIUM`: TTL=30min, maxSize=1000, maxMemory=100MB
  - `LONG`: TTL=2h, maxSize=2000, maxMemory=200MB
  - `STATIC`: TTL=24h, maxSize=5000, maxMemory=500MB
- **存储**: 内存存储 (`InMemoryStorage`)
- **特性**: LRU 淘汰、内存限制、按端点/用户/租户删除、自动清理过期项

---

## 2. 发现的问题

### 问题 1: 🔴 严重 — `/api/rooms/[id]/route.ts` DELETE 缺少列表缓存失效

**文件**: `src/app/api/rooms/[id]/route.ts`

```typescript
// 当前 DELETE 逻辑只删除了 detail cache
roomDetailCache.delete({ endpoint: 'room-detail', params: { roomId: id } })
roomsCache.deleteByEndpoint('rooms-list')  // ❌ roomsCache 未在该文件导入
```

**问题**: `roomsCache` 在 `route.ts` (列表页) 中定义，但 `[id]/route.ts` 中**未导入**，导致房间删除后房间列表缓存**不会被失效**。

**修复建议**:
```typescript
// 在 [id]/route.ts 顶部也导入 roomsCache
import { roomsCache } from '../route'
// 或将 roomsCache 提升到共享模块
```

---

### 问题 2: 🟡 中等 — `/api/agents/learning` POST/PUT 无缓存失效机制

**文件**: `src/app/api/agents/learning/route.ts`

**问题**: 这是一个只读的 GET 路由，没有数据修改端点，但 adaptiveLearner 的内部数据可能通过其他途径被修改。如果 learning agent 的状态更新后，缓存不会被刷新。

**风险评估**: MEDIUM — 统计数据通常有 30min 缓存，实时性要求不高。建议添加变更监听机制或使用更短的 TTL。

---

### 问题 3: 🟡 中等 — `/api/search` 无缓存失效机制

**文件**: `src/app/api/search/route.ts`

**问题**: 搜索结果被缓存但没有失效策略。搜索索引更新后，缓存不会自动失效。

**修复建议**:
- 添加搜索索引版本号到缓存 key
- 在数据变更时按端点失效: `searchCache.deleteByEndpoint('search')`
- 考虑对高频相同搜索词使用 `MEDIUM` TTL

---

### 问题 4: 🟡 中等 — `/api/notifications` 条件过滤查询未缓存但未统一处理

**文件**: `src/app/api/notifications/route.ts`

```typescript
// 只对非过滤查询缓存
if (!filter.type && !filter.priority && !filter.read && !filter.since) {
  notificationsCache.set(cacheKey, response)
}
```

**问题**: 过滤查询未被缓存，但 POST 创建通知后只删除了非过滤缓存。过滤查询的缓存不会被清理，可能返回过期数据。

**修复建议**: 统一缓存策略，或在 POST 时调用 `notificationsCache.clear()` 删除所有通知缓存。

---

### 问题 5: 🟡 中等 — 搜索查询完全跳过缓存

**文件**: `src/app/api/rooms/route.ts`

```typescript
// 搜索查询不缓存
if (!queryParams.search) {
  const cachedResult = roomsCache.get(cacheKey)
  // ...
}
```

**问题**: 搜索查询是高频操作但完全不被缓存，可能导致数据库压力。

**修复建议**: 考虑对热门搜索词也进行缓存，限制缓存大小避免内存溢出。

---

## 3. 优化建议

### 高优先级

1. **修复 rooms/[id] DELETE 缓存失效**
   - 将 `roomsCache` 提取到共享模块如 `src/lib/api/rooms/cache.ts`
   - 在两个路由文件中导入同一个缓存实例

2. **notifications POST 添加全量缓存清理**
   ```typescript
   // POST 创建通知后清理所有相关缓存
   notificationsCache.clear() // 或按用户清理
   ```

### 中优先级

3. **agents/learning 添加变更通知机制**
   - 订阅 learning agent 数据变更事件
   - 变更时调用 `agentLearningCache.deleteByEndpoint('agents-learning')`

4. **search 添加 TTL 更长的缓存策略**
   - 对于热门搜索词使用 `MEDIUM` TTL
   - 添加搜索结果版本控制

5. **analytics 路由添加缓存**
   - `/api/analytics/overview` — 非常适合缓存 (MEDIUM TTL)
   - `/api/analytics/nodes` — 适合缓存 (SHORT TTL)
   - `/api/analytics/resources` — 适合缓存 (SHORT TTL)

---

## 4. 候选新缓存路由列表

基于对 50+ 个 API 路由的分析，以下路由**适合添加缓存**但尚未实现：

### 高优先级 (高频读取、低频变更)

| 路由 | 建议 TTL | 理由 |
|------|----------|------|
| `/api/analytics/overview` | MEDIUM | 聚合数据，变更不频繁 |
| `/api/analytics/nodes` | SHORT | 节点性能数据，实时性要求中等 |
| `/api/analytics/resources` | SHORT | 资源使用数据 |
| `/api/alerts/rules` | SHORT | 告警规则列表，变更不频繁 |
| `/api/alerts/history` | SHORT | 历史告警数据 |
| `/api/projects` | MEDIUM | 项目列表，适合缓存 |
| `/api/users` | MEDIUM | 用户列表 (需权限过滤) |

### 中优先级 (中等频率)

| 路由 | 建议 TTL | 理由 |
|------|----------|------|
| `/api/feedback` | SHORT | 反馈列表 |
| `/api/feedback/stats` | MEDIUM | 反馈统计 |
| `/api/performance/stats` | SHORT | 性能统计 |
| `/api/performance/queries` | SHORT | 查询性能数据 |

### 不建议缓存 (数据敏感或频繁变更)

| 路由 | 原因 |
|------|------|
| `/api/auth/*` | 认证数据，安全敏感 |
| `/api/notifications/[id]` | 单条通知，快捷操作 |
| `/api/rooms/[id]/join` | 操作类，非数据查询 |
| `/api/mcp/*` | RPC 调用，结果不确定 |
| `/api/csrf/*` | 安全相关 |
| `/api/ai/conversations` | AI 对话，实时性高 |

---

## 5. 总结

- ✅ **5 个路由已正确实现缓存**，使用了统一的 `HotDataCache` 基础设施
- ⚠️ **3 个关键问题**需要修复：rooms DELETE 缓存失效、search 无失效、notifications 过滤缓存清理
- 📋 **8+ 个新缓存候选路由**已识别，analytics 路由优先级最高
- 🔧 所有问题都属于实现细节，不影响核心架构
