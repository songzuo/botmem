# Redis API 限流系统 - 配置和使用指南

## 📋 目录

- [概述](#概述)
- [特性](#特性)
- [安装](#安装)
- [配置](#配置)
- [使用方法](#使用方法)
- [API 参考](#api-参考)
- [监控和调试](#监控和调试)
- [故障排查](#故障排查)
- [最佳实践](#最佳实践)

## 概述

Redis API 限流系统为 Next.js API 路由提供了完整的速率限制解决方案，支持多种算法和配置选项。

## 特性

✅ **三种限流算法**
- 滑动窗口 - 精确的时间窗口控制
- 令牌桶 - 突发流量平滑处理
- 混合算法 - 结合两者优点

✅ **灵活配置**
- 预配置的限流规则
- 自定义配置支持
- 基于用户/IP/API Key 的限流

✅ **完整的响应头**
- X-RateLimit-Limit
- X-RateLimit-Remaining
- X-RateLimit-Reset
- X-RateLimit-Algorithm
- Retry-After

✅ **事件日志**
- 限流事件记录
- 统计分析
- 违规者追踪

✅ **高可用性**
- Redis 连接池
- 自动重连
- 失败降级到内存限流

## 安装

### 1. 安装依赖

项目已包含 `ioredis`，但如需验证：

```bash
npm install ioredis
```

### 2. 配置 Redis

#### 选项 A: 使用 REDIS_URL

在 `.env.production` 或 `.env.development` 中：

```bash
REDIS_URL=redis://:password@localhost:6379/0
```

URL 格式: `redis://[username:password@]host:port/db`

#### 选项 B: 使用独立配置

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=mypassword
REDIS_DB=0
```

### 3. 验证连接

```typescript
import { isRedisAvailable } from '@/lib/redis/client';

const available = await isRedisAvailable();
console.log('Redis available:', available);
```

## 配置

### 预配置规则

以下路径已自动配置（在 `src/lib/rate-limit/index.ts` 中）：

| 路径模式 | 算法 | 限制 | 窗口 | 说明 |
|----------|------|------|------|------|
| `/api/health` | sliding-window | 100 | 60s | 健康检查 |
| `/api/health/*` | sliding-window | 100 | 60s | 健康检查 |
| `/api/auth/login` | token-bucket | 10 | 60s | 登录，支持突发 |
| `/api/auth/register` | token-bucket | 5 | 60s | 注册，严格 |
| `/api/auth/logout` | sliding-window | 20 | 60s | 登出 |
| `/api/auth/refresh` | sliding-window | 30 | 60s | 刷新令牌 |
| `/api/auth/me` | sliding-window | 60 | 60s | 用户信息 |
| `/api/tasks` | sliding-window | 50 | 60s | 任务 API |
| `/api/projects` | sliding-window | 50 | 60s | 项目 API |

### 自定义配置

你可以在中间件调用时覆盖默认配置：

```typescript
import { withRateLimit } from '@/lib/rate-limit';

export const POST = withRateLimit(
  handler,
  {
    algorithm: 'token-bucket',
    limit: 20,
    window: 60,
    burstCapacity: 30,
    refillRate: 0.33,
    identifier: 'user:123',
  }
);
```

## 使用方法

### 基本使用

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rate-limit';

export const GET = withRateLimit(async (req: NextRequest) => {
  return NextResponse.json({ data: 'Hello World' });
});
```

### 使用自定义配置

```typescript
export const POST = withRateLimit(
  async (req: NextRequest) => {
    const body = await req.json();
    return NextResponse.json({ data: body });
  },
  {
    algorithm: 'token-bucket',
    limit: 5,
    window: 60,
  }
);
```

### 基于用户 ID 限流

```typescript
function getUserId(req: NextRequest): string {
  const userId = req.headers.get('x-user-id');
  return userId ? `user:${userId}` : `ip:${getIP(req)}`;
}

export const GET = withRateLimit(
  handler,
  {
    identifier: getUserId(req),
  }
);
```

### 查询限流状态

```typescript
import { getRateLimitStatus } from '@/lib/rate-limit';

const status = await getRateLimitStatus('/api/tasks', 'user:123');

console.log({
  allowed: status.allowed,
  remaining: status.remaining,
  resetTime: new Date(status.resetTime),
});
```

## API 参考

### withRateLimit

包装 API 处理函数以启用限流。

```typescript
withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: Partial<RateLimitConfig>
)
```

**参数:**

- `handler` - API 处理函数
- `config` - 可选配置对象

**RateLimitConfig:**

```typescript
interface RateLimitConfig {
  algorithm: 'sliding-window' | 'token-bucket' | 'hybrid';
  limit: number;              // 每窗口最大请求数
  window: number;            // 时间窗口（秒）
  burstCapacity?: number;     // 桶容量（令牌桶）
  refillRate?: number;       // 补充速率（令牌/秒）
  skipSuccessfulRequests?: boolean;  // 不计数成功请求
  skipFailedRequests?: boolean;      // 不计数失败请求
  identifier?: string;       // 自定义标识符
  keyPrefix?: string;        // Redis 键前缀
}
```

### getRateLimitStatus

获取限流状态。

```typescript
getRateLimitStatus(
  path: string,
  identifier?: string,
  customConfig?: Partial<RateLimitConfig>
): Promise<RateLimitResult | null>
```

**返回:**

```typescript
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
  algorithm: RateLimitAlgorithm;
  currentCount?: number;
  tokensAvailable?: number;
}
```

### 事件日志 API

#### getRateLimitStats

获取限流统计信息。

```typescript
import { getRateLimitStats } from '@/lib/rate-limit';

const stats = await getRateLimitStats(startTime, endTime);

console.log({
  totalEvents: stats.totalEvents,
  exceededEvents: stats.exceededEvents,
  byPath: stats.byPath,
  byAlgorithm: stats.byAlgorithm,
  byIP: stats.byIP,
});
```

#### getTopOffenders

获取违规最多的 IP/路径。

```typescript
import { getTopOffenders } from '@/lib/rate-limit';

const offenders = await getTopOffenders(10);
// [{ path: '/api/login', ipAddress: '1.2.3.4', violations: 50 }, ...]
```

## 监控和调试

### 查看日志

限流事件会自动记录到应用日志：

```
[INFO] Rate limit event: /api/tasks, identifier: user:123, limit: 50
[WARN] Rate limit exceeded: /api/login, identifier: ip:1.2.3.4
```

### 响应头监控

所有 API 响应都包含限流信息：

```http
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 2024-03-23T12:00:00.000Z
X-RateLimit-Algorithm: sliding-window
X-RateLimit-Current: 5
```

### 创建监控 API

```typescript
// src/app/api/admin/rate-limit-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRateLimitStats, getTopOffenders } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const stats = await getRateLimitStats();
  const offenders = await getTopOffenders(10);

  return NextResponse.json({
    success: true,
    data: {
      stats,
      topOffenders: offenders,
    },
  });
}
```

## 故障排查

### Redis 连接失败

**问题:** 无法连接到 Redis

**解决:**

1. 检查 Redis 是否运行:
   ```bash
   redis-cli ping
   # 应该返回 PONG
   ```

2. 检查配置:
   ```bash
   echo $REDIS_URL
   ```

3. 检查网络连接:
   ```bash
   telnet localhost 6379
   ```

**注意:** 当 Redis 不可用时，系统会自动降级到内存限流。

### 限流不准确

**问题:** 限流计数不准确

**可能原因:**

1. 多实例部署未使用 Redis
2. 时钟不同步
3. Redis 过期策略错误

**解决:**

1. 确保使用 Redis（而不是内存限流）
2. 同步服务器时钟（NTP）
3. 检查 Redis 配置: `maxmemory-policy allkeys-lru`

### 内存使用过高

**问题:** Redis 内存占用过多

**解决:**

```bash
# 检查内存使用
redis-cli INFO memory

# 设置最大内存
redis-cli CONFIG SET maxmemory 256mb

# 设置淘汰策略
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# 清理过期事件
import { cleanupOldRateLimitEvents } from '@/lib/rate-limit';
await cleanupOldRateLimitEvents(7); // 清理 7 天前的数据
```

## 最佳实践

### 1. 选择合适的算法

- **滑动窗口**: 需要精确控制时
- **令牌桶**: 需要处理突发流量时
- **混合**: 两者都需要时

### 2. 合理设置限流阈值

根据实际流量设置：

```typescript
// 低流量 API (如管理界面)
{ limit: 10, window: 60 }

// 中流量 API (如查询)
{ limit: 50, window: 60 }

// 高流量 API (如健康检查)
{ limit: 100, window: 60 }
```

### 3. 使用用户 ID 而非 IP

```typescript
// ✅ 好 - 每用户限流
identifier: `user:${userId}`

// ❌ 不好 - 每个 IP 限流（可能影响多用户）
identifier: `ip:${ipAddress}`
```

### 4. 区分读写操作

```typescript
// 读操作 - 较宽松
export const GET = withRateLimit(handler, { limit: 60, window: 60 });

// 写操作 - 较严格
export const POST = withRateLimit(handler, { limit: 10, window: 60 });
```

### 5. 监控和告警

```typescript
// 定期检查限流违规
setInterval(async () => {
  const stats = await getRateLimitStats();
  if (stats.exceededEvents > 100) {
    sendAlert('High rate limit violations detected!');
  }
}, 60000); // 每分钟检查
```

### 6. 清理旧数据

```typescript
// 定期清理旧事件
setInterval(async () => {
  const deleted = await cleanupOldRateLimitEvents(7);
  console.log(`Cleaned up ${deleted} old events`);
}, 24 * 60 * 60 * 1000); // 每天
```

## 相关文档

- [实现报告](./API_RATE_LIMIT_IMPLEMENTATION_REPORT.md)
- [快速开始](./API_RATE_LIMIT_QUICKSTART.md)

## 支持

如有问题，请查看：
1. 源码中的注释
2. 单元测试（`src/lib/rate-limit/__tests__/`）
3. 本文档的故障排查部分
