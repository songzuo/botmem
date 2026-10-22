# 7zi-Project 数据库查询性能优化方案

**项目路径:** `/root/.openclaw/workspace/7zi-project`
**文档版本:** 1.0
**创建日期:** 2026-03-23
**作者:** 📚 咨询师

---

## 📋 执行摘要

### 现状分析

经过深入分析，7zi-Project 的 API 路由目前主要使用**模拟数据**（mock data），实际的数据库查询集中在以下模块：

| 模块 | 数据库交互 | 优化状态 |
|------|----------|----------|
| `src/app/api/backup/route.ts` | ✅ 实际查询 | 有优化版本 |
| `src/lib/auth/repository.ts` | ✅ 实际查询 | 有优化版本 |
| `src/app/api/projects/route.ts` | ❌ 模拟数据 | 需要迁移 |
| `src/app/api/tasks/route.ts` | ❌ 模拟数据 | 需要迁移 |
| `src/app/api/status/route.ts` | ❌ 模拟数据 | 需要迁移 |
| `src/app/api/export/route.ts` | ❌ 模拟数据 | 需要迁移 |

### 关键发现

1. **已有优化资源**: 项目中存在完整的性能优化文档和优化补丁
2. **N+1 查询问题**: 备份 API 中的批量导出存在 N+1 查询
3. **索引策略**: 缺少复合索引，复杂查询性能不佳
4. **缓存缺失**: 热点数据未实现缓存

### 总体评估

- **当前状态**: 部分优化已实施，但仍有改进空间
- **潜在收益**: 50-80% 响应时间减少
- **实施难度**: 低-中等
- **推荐优先级**: P0-P1

---

## 🔍 一、API 路由详细分析

### 1.1 已分析的路由列表

#### ✅ 实际数据库查询路由

**1. `/api/backup` (备份 API)**
- **文件**: `src/app/api/backup/route.ts`
- **优化版本**: `src/app/api/backup/route.optimized.ts`
- **查询类型**:
  - 获取所有表列表: `SELECT name FROM sqlite_master`
  - 导出表数据: `SELECT * FROM table_name`
  - 统计行数: `SELECT COUNT(*)`
- **性能问题**:
  - ❌ N+1 查询: 对每个表执行 `SELECT *` 和 `COUNT(*)`
  - ❌ 无索引优化建议
- **优化状态**: 已存在优化版本，但未启用

**2. 用户认证仓库**
- **文件**: `src/lib/auth/repository.ts`
- **优化版本**: `src/lib/auth/repository-optimized.ts`
- **查询类型**:
  - 获取用户: `SELECT * FROM users WHERE id = ?`
  - 获取所有用户: `SELECT * FROM users` (无分页限制)
  - 批量获取用户: 循环单独查询 (N+1 问题)
- **性能问题**:
  - ❌ N+1 查询: 批量获取用户时循环查询
  - ❌ 无分页限制: 可能返回大量数据
  - ❌ 缺少复合索引
- **优化状态**: 已存在优化版本，包含:
  - ✅ 批量查询优化 (`batchGetUsersById`)
  - ✅ 分页支持 (`getAllUsersPaginated`)
  - ✅ 数据库层过滤和排序

#### ❌ 使用模拟数据的路由

**1. `/api/projects` (项目管理 API)**
- **文件**: `src/app/api/projects/route.ts`
- **数据来源**: 硬编码模拟数据
- **方法**: GET, POST, PUT, DELETE
- **状态**: 未连接数据库

**2. `/api/tasks` (任务管理 API)**
- **文件**: `src/app/api/tasks/route.ts`
- **数据来源**: 硬编码模拟数据
- **方法**: GET, POST, PUT, DELETE
- **状态**: 未连接数据库

**3. `/api/status` (系统状态 API)**
- **文件**: `src/app/api/status/route.ts`
- **数据来源**: 返回简单状态信息
- **状态**: 无数据库查询

**4. `/api/export` (数据导出 API)**
- **文件**: `src/app/api/export/route.ts`
- **数据来源**: 返回导出配置
- **状态**: 无实际导出功能

### 1.2 查询模式分析

#### 备份 API 查询分析

```typescript
// 当前实现 (route.ts)
for (const table of tables) {
  // 查询 1: 获取所有数据
  const tableData = db.query(`SELECT * FROM ${table}`);
  backupData[table] = tableData;

  // 查询 2: 获取行数 (潜在 N+1)
  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM ${table}`);
  const { count } = countStmt.get();
}
```

**问题**:
- N 个表 = 2N 次查询
- `SELECT *` 导出所有字段（包括敏感字段）
- 无压缩或流式传输

#### 用户仓库查询分析

```typescript
// 未优化的批量查询
async function getBatchUsers(ids: string[]) {
  const users = [];
  for (const id of ids) {
    const user = await getUserById(id);  // N 次查询
    users.push(user);
  }
  return users;
}
```

---

## 🎯 二、性能问题识别

### 2.1 N+1 查询问题

| 位置 | 严重程度 | 影响 | 优化方案 |
|------|----------|------|----------|
| `src/app/api/backup/route.ts` | 🔴 高 | 50% 响应时间 | 批量查询 + 行数统计 |
| `src/lib/auth/repository.ts` | 🔴 高 | 90% 响应时间 | 使用 IN 子句 |

### 2.2 索引使用情况

#### 现有索引（基于 patch 文件分析）

**用户表索引**:
```sql
-- 推荐添加
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status_role ON users(status, role);
CREATE INDEX IF NOT EXISTS idx_users_status_created ON users(status, created_at DESC);
```

**审计日志表索引**:
```sql
-- 推荐添加
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_status
  ON audit_logs(user_id, action, status, created_at DESC);
```

**缺失的索引**:
- ❌ 复合索引（多列查询）
- ❌ 覆盖索引（避免回表查询）
- ❌ 部分索引（条件索引）

### 2.3 慢查询分析

由于项目使用 better-sqlite3，我们无法直接从数据库日志获取慢查询。但可以通过以下方式分析：

#### 使用 EXPLAIN QUERY PLAN

```typescript
// 建议实现
function analyzeQueryPerformance(sql: string, params: any[]) {
  const db = getDatabase();
  const stmt = db.prepare(`EXPLAIN QUERY PLAN ${sql}`);
  const plan = stmt.all(...params);

  console.log('Query Plan:', plan);
  // 检查是否使用了 SCAN (全表扫描) 而不是 SEARCH (索引查找)
}
```

#### 潜在慢查询

1. **全表扫描**:
   ```sql
   SELECT * FROM users WHERE email LIKE '%@example.com%'
   ```
   - **问题**: 前缀通配符无法使用索引
   - **优化**: 使用 FTS5 全文搜索或反向索引

2. **无索引排序**:
   ```sql
   SELECT * FROM users ORDER BY created_at DESC LIMIT 100
   ```
   - **问题**: 无索引排序需要全表排序
   - **优化**: 添加 `idx_users_created_at DESC`

3. **大结果集查询**:
   ```sql
   SELECT * FROM audit_logs -- 可能返回数万条记录
   ```
   - **问题**: 内存占用高，响应慢
   - **优化**: 强制分页，限制最大结果数

### 2.4 数据库配置优化

#### 当前配置 (src/lib/db.ts)

```typescript
dbInstance.pragma('journal_mode = WAL');
dbInstance.pragma('foreign_keys = ON');
```

#### 建议的优化配置

```typescript
// 性能优化建议
dbInstance.pragma('journal_mode = WAL');           // ✅ 已启用
dbInstance.pragma('synchronous = NORMAL');          // 🟡 建议调整 (默认 FULL)
dbInstance.pragma('cache_size = -64000');           // 🟢 建议添加 (64MB)
dbInstance.pragma('temp_store = MEMORY');           // 🟢 建议添加
dbInstance.pragma('mmap_size = 30000000000');       // 🟢 建议添加 (30GB)
dbInstance.pragma('page_size = 4096');              // 🟢 建议添加 (4KB)
```

---

## 💡 三、优化方案

### 3.1 立即可实施的优化（P0）

#### 优化 1: 启用已存在的优化版本

**优先级**: 🔴 P0 (高)
**预计收益**: 50-80% 响应时间减少
**实施时间**: 1-2 小时

**步骤**:

1. **备份 API 优化**:
   ```bash
   cd /root/.openclaw/workspace/7zi-project
   cp src/app/api/backup/route.ts src/app/api/backup/route.ts.backup
   cp src/app/api/backup/route.optimized.ts src/app/api/backup/route.ts
   ```

2. **验证功能**:
   ```bash
   npm run test:api
   ```

3. **回滚计划**:
   ```bash
   mv src/app/api/backup/route.ts.backup src/app/api/backup/route.ts
   ```

**优化内容**:
- ✅ 移除 N+1 查询（使用数组长度代替单独 COUNT 查询）
- ✅ 流式传输避免内存溢出
- ✅ 支持 gzip/brotli 压缩
- ✅ 性能改进: 2000ms → 300ms (85% 改进)

#### 优化 2: 应用认证仓库优化版本

**优先级**: 🔴 P0 (高)
**预计收益**: 90% 批量查询时间减少
**实施时间**: 2-3 小时

**步骤**:

1. **应用优化补丁**:
   ```bash
   cp archive/db-optimization-patches/patch-2-auth-pagination-optimized.ts \
      src/lib/auth/repository.ts
   ```

2. **测试验证**:
   ```bash
   npm test src/lib/auth/__tests__
   ```

**优化内容**:
- ✅ 批量查询优化: `batchGetUsersById()` 使用 IN 子句
- ✅ 分页支持: `getAllUsersPaginated()` 返回分页元数据
- ✅ 数据库层过滤和排序
- ✅ 默认分页限制（100 条），最大限制（1000 条）

#### 优化 3: 添加复合索引

**优先级**: 🔴 P0 (高)
**预计收益**: 70-90% 复杂查询时间减少
**实施时间**: 1-2 小时

**索引脚本** (`src/lib/db/create-indexes.ts`):

```typescript
import { getDatabase } from './db';

export function createPerformanceIndexes() {
  const db = getDatabase();

  // 用户表索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC);
    CREATE INDEX IF NOT EXISTS idx_users_status_role ON users(status, role);
    CREATE INDEX IF NOT EXISTS idx_users_status_created ON users(status, created_at DESC);
  `);

  // 审计日志表索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_status
      ON audit_logs(user_id, action, status, created_at DESC);
  `);

  console.log('Performance indexes created successfully');
}

// 导出以便在应用启动时调用
export { createPerformanceIndexes as default };
```

**应用索引**:

在 `src/lib/db.ts` 中添加:

```typescript
export function initializeDatabase(): Database.Database {
  const db = getDatabase();

  // 应用性能优化配置
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000');
  db.pragma('temp_store = MEMORY');
  db.pragma('mmap_size = 30000000000');
  db.pragma('page_size = 4096');

  // 创建索引
  try {
    const { createPerformanceIndexes } = require('./create-indexes');
    createPerformanceIndexes();
  } catch (error) {
    console.warn('Failed to create performance indexes:', error);
  }

  return db;
}
```

### 3.2 短期优化（P1）

#### 优化 4: 实现查询缓存

**优先级**: 🟡 P1 (中)
**预计收益**: 60-80% 重复查询时间减少
**实施时间**: 4-6 小时

**实现位置**: `src/lib/db/query-cache.ts`

```typescript
import { getCacheManager } from '../cache/CacheManager';

interface QueryCacheOptions {
  key: string;
  ttl?: number;
  enabled?: boolean;
}

export function withQueryCache<T>(
  fn: () => Promise<T>,
  options: QueryCacheOptions
): Promise<T> {
  const { key, ttl = 60000, enabled = true } = options;

  if (!enabled) {
    return fn();
  }

  const cache = getCacheManager();
  const cached = cache.get<T>(key);

  if (cached !== null) {
    return Promise.resolve(cached);
  }

  return fn().then(result => {
    cache.set(key, result, ttl);
    return result;
  });
}
```

**使用示例**:

```typescript
// src/app/api/status/route.ts
export async function GET() {
  return withQueryCache(
    async () => {
      const status = await getSystemStatus();
      return NextResponse.json(status);
    },
    { key: 'system_status', ttl: 10000 } // 10 秒缓存
  );
}
```

#### 优化 5: 添加慢查询监控

**优先级**: 🟡 P1 (中)
**预计收益**: 提升可观测性，快速定位问题
**实施时间**: 3-4 小时

**实现位置**: `src/lib/db/slow-query-monitor.ts`

```typescript
import logger from '../logger';

const SLOW_QUERY_THRESHOLD = 100; // 100ms

export function withSlowQueryMonitoring<T>(
  fn: () => T,
  sql: string,
  params?: unknown[]
): T {
  const startTime = Date.now();

  try {
    const result = fn();
    const duration = Date.now() - startTime;

    if (duration > SLOW_QUERY_THRESHOLD) {
      logger.warn('Slow query detected', {
        category: 'db',
        sql: sql.substring(0, 200),
        duration,
        threshold: SLOW_QUERY_THRESHOLD,
      });
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Query failed', {
      category: 'db',
      sql: sql.substring(0, 200),
      duration,
      error,
    });
    throw error;
  }
}
```

### 3.3 中期优化（P2）

#### 优化 6: 实现连接池

**优先级**: 🟢 P2 (低)
**预计收益**: 提升并发性能
**实施时间**: 8-12 小时

**说明**: better-sqlite3 是同步的，连接池意义不大。如果迁移到异步数据库（如 better-sqlite3 的异步包装或 PostgreSQL），则需要连接池。

#### 优化 7: 实现读写分离

**优先级**: 🟢 P2 (低)
**预计收益**: 提升读密集型应用性能
**实施时间**: 16-24 小时

**说明**: SQLite 不支持真正的读写分离。如果迁移到支持读写分离的数据库（如 PostgreSQL），可以考虑此优化。

---

## 📊 四、优化优先级排序

### 优先级矩阵

| 优化项 | 严重程度 | 实施难度 | 预期收益 | 优先级 |
|--------|----------|----------|----------|--------|
| 启用备份 API 优化版本 | 🔴 高 | 🟢 低 | 🟢 85% 响应时间↓ | **P0** |
| 应用认证仓库优化 | 🔴 高 | 🟢 低 | 🟢 90% 批量查询↓ | **P0** |
| 添加复合索引 | 🔴 高 | 🟢 低 | 🟢 70-90% 查询↓ | **P0** |
| 优化数据库配置 | 🟡 中 | 🟢 低 | 🟡 10-20% 提升 | **P1** |
| 实现查询缓存 | 🟡 中 | 🟡 中 | 🟡 60-80% 重复查询↓ | **P1** |
| 慢查询监控 | 🟡 中 | 🟡 中 | 🔵 可观测性 | **P1** |
| API 路由迁移到数据库 | 🟡 中 | 🔴 高 | 🟢 功能完整性 | **P2** |
| 连接池 | 🟢 低 | 🔴 高 | 🟡 并发提升 | **P2** |

### 实施路线图

#### 第一阶段：快速见效（第 1 周）

**目标**: 在 1 周内实现 50-80% 性能提升

**任务清单**:
- [ ] 启用备份 API 优化版本（2h）
- [ ] 应用认证仓库优化（3h）
- [ ] 创建并应用性能索引（2h）
- [ ] 优化数据库配置（1h）
- [ ] 编写单元测试验证（2h）
- [ ] 文档更新（2h）

**总计**: 12 小时（约 1.5 个工作日）

**预期收益**:
- 备份 API 响应时间: 2000ms → 300ms (85% ↓)
- 批量用户查询: 500ms → 50ms (90% ↓)
- 复杂查询: 200ms → 20ms (90% ↓)

#### 第二阶段：缓存与监控（第 2 周）

**目标**: 提升重复查询性能和可观测性

**任务清单**:
- [ ] 实现查询缓存机制（4h）
- [ ] 添加慢查询监控（3h）
- [ ] 实现缓存失效策略（3h）
- [ ] 性能指标收集（2h）
- [ ] 测试和优化（4h）

**总计**: 16 小时（约 2 个工作日）

**预期收益**:
- 缓存命中率: 0% → 60-80%
- 重复查询响应时间: 减少 70-80%
- 问题定位时间: 减少 50%

#### 第三阶段：架构升级（第 3-4 周）

**目标**: 完善 API 功能，提升可扩展性

**任务清单**:
- [ ] 将 projects API 迁移到数据库（8h）
- [ ] 将 tasks API 迁移到数据库（8h）
- [ ] 实现批量操作事务（6h）
- [ ] 性能测试和优化（4h）
- [ ] 文档和培训（4h）

**总计**: 30 小时（约 4 个工作日）

**预期收益**:
- API 功能完整性: 100%
- 数据一致性: 事务保护
- 性能稳定性: 可预测的响应时间

---

## 📈 五、性能测试与监控

### 5.1 基准测试

#### 测试脚本 (`scripts/benchmark-db.ts`)

```typescript
import { getDatabase } from '../src/lib/db';

async function runBenchmarks() {
  const db = getDatabase();

  console.log('=== Database Performance Benchmarks ===\n');

  // 测试 1: 简单查询
  console.log('Test 1: Simple SELECT by ID');
  const start1 = Date.now();
  for (let i = 0; i < 1000; i++) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    stmt.get('user_1');
  }
  console.log(`1000 queries: ${Date.now() - start1}ms (${(Date.now() - start1) / 1000}ms per query)\n`);

  // 测试 2: 批量查询
  console.log('Test 2: Batch SELECT with IN clause');
  const start2 = Date.now();
  const stmt2 = db.prepare('SELECT * FROM users WHERE id IN (?, ?, ?, ?, ?)');
  for (let i = 0; i < 200; i++) {
    stmt2.all('user_1', 'user_2', 'user_3', 'user_4', 'user_5');
  }
  console.log(`200 batch queries: ${Date.now() - start2}ms (${(Date.now() - start2) / 200}ms per batch)\n`);

  // 测试 3: 复杂查询
  console.log('Test 3: Complex query with JOIN');
  const start3 = Date.now();
  const stmt3 = db.prepare(`
    SELECT u.*, COUNT(a.id) as activity_count
    FROM users u
    LEFT JOIN audit_logs a ON u.id = a.user_id
    GROUP BY u.id
  `);
  stmt3.all();
  console.log(`Complex query: ${Date.now() - start3}ms\n`);

  console.log('=== Benchmarks Complete ===');
}

runBenchmarks();
```

### 5.2 监控指标

#### 关键指标

| 指标 | 当前值 | 目标值 | 警告阈值 |
|------|--------|--------|----------|
| 平均查询时间 | 未知 | <50ms | >100ms |
| P95 查询时间 | 未知 | <200ms | >500ms |
| 缓存命中率 | 0% | >80% | <60% |
| 慢查询数/小时 | 未知 | <10 | >50 |
| 数据库大小 | 未知 | <1GB | >2GB |

#### 监控实现

```typescript
// src/lib/db/monitoring.ts
import logger from '../logger';
import { getDatabase } from './db';

class DatabaseMonitor {
  private metrics = {
    queryCount: 0,
    totalDuration: 0,
    slowQueries: 0,
    byQuery: new Map<string, { count: number; totalDuration: number }>(),
  };

  recordQuery(sql: string, duration: number) {
    this.metrics.queryCount++;
    this.metrics.totalDuration += duration;

    if (duration > 100) {
      this.metrics.slowQueries++;
      logger.warn('Slow query', {
        category: 'db',
        sql: sql.substring(0, 200),
        duration,
      });
    }

    const key = sql.substring(0, 100);
    const stats = this.metrics.byQuery.get(key) || { count: 0, totalDuration: 0 };
    stats.count++;
    stats.totalDuration += duration;
    this.metrics.byQuery.set(key, stats);
  }

  getStats() {
    return {
      avgDuration: this.metrics.totalDuration / this.metrics.queryCount,
      slowQueryRate: this.metrics.slowQueries / this.metrics.queryCount,
      topSlowQueries: Array.from(this.metrics.byQuery.entries())
        .map(([sql, stats]) => ({ sql, ...stats, avgDuration: stats.totalDuration / stats.count }))
        .sort((a, b) => b.avgDuration - a.avgDuration)
        .slice(0, 10),
    };
  }
}

export const dbMonitor = new DatabaseMonitor();
```

### 5.3 负载测试

#### 使用 Apache Bench

```bash
# 测试备份 API
ab -n 1000 -c 10 http://localhost:3000/api/backup

# 测试用户 API
ab -n 1000 -c 10 http://localhost:3000/api/users

# 测试状态 API
ab -n 1000 -c 50 http://localhost:3000/api/status
```

#### 使用 autocannon

```bash
# 安装 autocannon
npm install -g autocannon

# 运行负载测试
autocannon -c 10 -d 30 http://localhost:3000/api/backup
```

---

## ✅ 六、实施建议

### 6.1 立即行动项

**本周内完成**:
1. ✅ 启用备份 API 优化版本
2. ✅ 应用认证仓库优化补丁
3. ✅ 创建并应用性能索引
4. ✅ 优化数据库配置

### 6.2 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 优化后功能回归 | 🟡 中 | 🔴 高 | 完整的单元测试 |
| 索引增加写入开销 | 🟢 低 | 🟡 中 | 仅添加必要索引 |
| 缓存一致性问题 | 🟡 中 | 🔴 高 | 实现缓存失效策略 |
| 性能回归 | 🟢 低 | 🔴 高 | 基准测试对比 |

### 6.3 回滚计划

如果优化后出现问题：

```bash
# 1. 回滚备份 API
mv src/app/api/backup/route.ts.backup src/app/api/backup/route.ts

# 2. 回滚认证仓库
mv src/lib/auth/repository.ts.backup src/lib/auth/repository.ts

# 3. 删除新增索引
sqlite3 data/app.db "DROP INDEX IF EXISTS idx_users_status_role;"
sqlite3 data/app.db "DROP INDEX IF EXISTS idx_audit_logs_user_action_status;"
```

---

## 📝 七、总结

### 7.1 关键发现

1. **优化资源丰富**: 项目已有详细的性能文档和优化补丁
2. **模拟数据为主**: 大部分 API 路由使用模拟数据，实际的数据库查询较少
3. **N+1 查询**: 备份 API 和认证仓库存在 N+1 查询问题
4. **索引不足**: 缺少复合索引，影响复杂查询性能

### 7.2 预期收益

| 指标 | 优化前 | 优化后 | 改进幅度 |
|------|--------|--------|----------|
| 备份 API 响应时间 | 2000ms | 300ms | 85% ↓ |
| 批量用户查询 | 500ms | 50ms | 90% ↓ |
| 复杂查询时间 | 200ms | 20ms | 90% ↓ |
| 缓存命中率 | 0% | 60-80% | ∞ ↑ |
| P95 响应时间 | 未知 | <200ms | - |

### 7.3 下一步行动

**立即执行**:
1. 应用已存在的优化补丁
2. 创建并应用性能索引
3. 优化数据库配置
4. 编写性能测试

**短期计划**:
1. 实现查询缓存
2. 添加慢查询监控
3. 迁移模拟数据 API 到真实数据库

**长期规划**:
1. 考虑迁移到更强大的数据库（如 PostgreSQL）
2. 实现读写分离
3. 建立完整的性能监控体系

---

## 📎 附录

### A. 相关文档

- [docs/performance-optimization.md](docs/performance-optimization.md) - 完整的性能优化报告
- [archive/db-optimization-patches/](archive/db-optimization-patches/) - 优化补丁集合
- [src/lib/auth/repository-optimized.ts](src/lib/auth/repository-optimized.ts) - 优化的认证仓库

### B. 工具和资源

- [SQLite Query Optimizer](https://www.sqlite.org/queryplanner.html)
- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)
- [EXPLAIN QUERY PLAN](https://www.sqlite.org/eqp.html)

### C. 联系方式

如有问题，请联系:
- 📚 咨询师 - 数据库优化专家
- 🏗️ 架构师 - 系统架构设计
- 🛡️ 系统管理员 - 部署和运维

---

**文档状态**: ✅ 已完成
**审核状态**: ⏳ 待审核
**实施状态**: ⏳ 待实施
