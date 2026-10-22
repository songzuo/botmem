# Redis API 限流系统 - 实现报告

## 概述

为 v1.0.9 实现了完整的 Redis API 限流系统，包含滑动窗口算法、令牌桶算法、限流中间件、配置规则、响应头和事件日志。

## 实现内容

### 1. 核心文件

```
src/lib/
├── redis/
│   └── client.ts                          # Redis 客户端配置和管理
└── rate-limit/
    ├── index.ts                           # 主限流中间件
    ├── sliding-window.ts                  # 滑动窗口算法
    ├── token-bucket.ts                    # 令牌桶算法
    └── event-logger.ts                    # 限流事件日志
```

### 2. 功能特性

#### 2.1 滑动窗口算法 (sliding-window.ts)

- **原理**: 使用 Redis sorted set 存储请求时间戳
- **优点**: 精确的时间窗口控制，自动过期，分布式友好
- **适用场景**: 需要严格限流的 API

**核心逻辑**:
```typescript
// 1. 移除窗口外的旧记录
zremrangebyscore(key, 0, windowStart)

// 2. 统计窗口内的请求数
zcard(key)

// 3. 如果未超限，添加当前请求
zadd(key, now, timestamp)
```

#### 2.2 令牌桶算法 (token-bucket.ts)

- **原理**: 桶中保存令牌，按固定速率补充，请求消耗令牌
- **优点**: 平滑突发流量，可配置桶容量和补充速率
- **适用场景**: 需要处理突发流量的 API

**核心逻辑**:
```lua
-- Lua 脚本保证原子性
tokens = min(capacity, tokens + elapsed * refillRate)
if tokens >= 1 then
  tokens = tokens - 1
  allowed = true
end
```

#### 2.3 混合算法

- 结合滑动窗口和令牌桶的优点
- 滑动窗口控制长期平均速率
- 令牌桶处理短期突发

### 3. 限流中间件 (index.ts)

#### 3.1 支持的算法

```typescript
type RateLimitAlgorithm = 'sliding-window' | 'token-bucket' | 'hybrid';
```

#### 3.2 默认配置规则

| 路径 | 算法 | 限制 | 窗口 | 说明 |
|------|------|------|------|------|
| `/api/health/*` | sliding-window | 100 | 60s | 健康检查 - 高允许 |
| `/api/auth/login` | token-bucket | 10 | 60s | 登录 - 中等严格，支持突发 |
| `/api/auth/register` | token-bucket | 5 | 60s | 注册 - 严格，支持突发 |
| `/api/auth/logout` | sliding-window | 20 | 60s | 登出 |
| `/api/auth/refresh` | sliding-window | 30 | 60s | 刷新令牌 |
| `/api/auth/me` | sliding-window | 60 | 60s | 用户信息 |
| `/api/tasks` | sliding-window | 50 | 60s | 任务 API |
| `/api/projects` | sliding-window | 50 | 60s | 项目 API |

#### 3.3 使用方式

```typescript
import { withRateLimit } from '@/lib/rate-limit';

// 方式 1: 使用默认配置
export const GET = withRateLimit(async (req: NextRequest) => {
  return NextResponse.json({ data: '...' });
});

// 方式 2: 自定义配置
export const POST = withRateLimit(
  async (req: NextRequest) => {
    return NextResponse.json({ data: '...' });
  },
  {
    algorithm: 'token-bucket',
    limit: 20,
    window: 60,
    burstCapacity: 30,
    refillRate: 0.33,
  }
);

// 方式 3: 使用用户 ID 作为标识符
export const GET = withRateLimit(
  async (req: NextRequest) => {
    return NextResponse.json({ data: '...' });
  },
  {
    identifier: getUserId(req), // 使用用户 ID
  }
);
```

### 4. 响应头

所有响应都包含标准的限流响应头：

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 2024-03-23T12:00:00.000Z
X-RateLimit-Algorithm: sliding-window
X-RateLimit-Current: 15
X-RateLimit-Tokens: 45
Retry-After: 30  # 仅在限流时
```

### 5. 事件日志 (event-logger.ts)

#### 5.1 存储结构

```typescript
interface RateLimitEvent {
  timestamp: number;
  path: string;
  identifier: string;
  algorithm: RateLimitAlgorithm;
  limit: number;
  window: number;
  exceeded: boolean;
  remaining: number;
  resetTime: number;
  ipAddress: string;
  userAgent?: string;
}
```

#### 5.2 功能

- `storeRateLimitEvent()` - 存储限流事件（保留 7 天）
- `getRateLimitEvents()` - 获取限流事件
- `getRateLimitStats()` - 获取限流统计
- `getTopOffenders()` - 获取违规最多的 IP/路径
- `cleanupOldRateLimitEvents()` - 清理旧事件

### 6. Redis 客户端 (client.ts)

#### 6.1 配置方式

**方式 1: 使用 REDIS_URL**
```bash
REDIS_URL=redis://:password@localhost:6379/0
```

**方式 2: 使用独立配置**
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=mypassword
REDIS_DB=0
```

#### 6.2 特性

- 自动重连机制
- 错误处理和日志
- 优雅关闭
- 失败时自动降级到内存限流

## 安装依赖

项目已安装 `ioredis`，无需额外安装。

```bash
npm install ioredis
```

## 环境配置

在 `.env.production` 或 `.env.development` 中添加：

```bash
# Redis 配置
REDIS_URL=redis://:password@localhost:6379/0
# 或
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=mypassword
REDIS_DB=0

# 启用 Redis 限流
ENABLE_REDIS_RATE_LIMIT=true
```

## 使用示例

### 示例 1: 基本使用

```typescript
// src/app/api/tasks/route.ts
import { withRateLimit } from '@/lib/rate-limit';

export const GET = withRateLimit(async (req: NextRequest) => {
  const tasks = await getTasks();
  return NextResponse.json({ success: true, data: tasks });
});
```

### 示例 2: 自定义配置

```typescript
// src/app/api/auth/login/route.ts
import { withRateLimit } from '@/lib/rate-limit';

export const POST = withRateLimit(
  async (req: NextRequest) => {
    const { email, password } = await req.json();
    const result = await login(email, password);
    return NextResponse.json(result);
  },
  {
    algorithm: 'token-bucket',
    limit: 10,
    window: 60,
    burstCapacity: 15,
    refillRate: 0.167,
  }
);
```

### 示例 3: 基于用户 ID 的限流

```typescript
// src/app/api/projects/route.ts
import { withRateLimit } from '@/lib/rate-limit';
import { getUserFromToken } from '@/lib/auth';

export const GET = withRateLimit(
  async (req: NextRequest) => {
    const user = await getUserFromToken(req);
    const projects = await getProjects(user.id);
    return NextResponse.json({ success: true, data: projects });
  },
  {
    identifier: getUserIdFromRequest(req),
  }
);
```

### 示例 4: 查询限流状态

```typescript
import { getRateLimitStatus } from '@/lib/rate-limit';

const status = await getRateLimitStatus('/api/tasks', 'user:123');
console.log(status);
// {
//   allowed: true,
//   remaining: 45,
//   resetTime: 1711180800000,
//   limit: 50,
//   algorithm: 'sliding-window',
//   currentCount: 5
// }
```

### 示例 5: 获取限流统计

```typescript
import {
  getRateLimitStats,
  getTopOffenders
} from '@/lib/rate-limit';

// 获取过去 24 小时的统计
const stats = await getRateLimitStats(
  Date.now() - 24 * 60 * 60 * 1000
);

// 获取违规最多的 IP
const offenders = await getTopOffenders(10);
```

## 监控和调试

### 查看当前限流状态

```typescript
// 在 API 路由中
import { getRateLimitStatus } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const status = await getRateLimitStatus(
    '/api/tasks',
    'user:123'
  );

  return NextResponse.json({
    rateLimit: status,
  });
}
```

### 日志

限流事件会自动记录到：

1. **应用日志** (通过 logger)
   - 限流触发警告
   - 错误日志

2. **Redis 存储** (7 天保留)
   - 可通过 `getRateLimitEvents()` 查询
   - 可通过 `getRateLimitStats()` 统计

### 性能考虑

- Redis 操作使用 pipeline 批量执行
- Lua 脚本保证原子性
- 自动过期机制减少内存占用
- 失败时降级到内存限流

## 测试

### 单元测试示例

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { checkSlidingWindow } from '@/lib/rate-limit/sliding-window';
import { checkTokenBucket } from '@/lib/rate-limit/token-bucket';

describe('Rate Limiting', () => {
  it('should enforce sliding window limit', async () => {
    const key = 'test:sliding-window';
    const limit = 5;
    const window = 10;

    // First 5 requests should be allowed
    for (let i = 0; i < 5; i++) {
      const result = await checkSlidingWindow({ key, limit, window });
      expect(result.allowed).toBe(true);
    }

    // 6th request should be denied
    const result = await checkSlidingWindow({ key, limit, window });
    expect(result.allowed).toBe(false);
  });

  it('should refill tokens over time', async () => {
    const key = 'test:token-bucket';
    const config = {
      key,
      capacity: 10,
      refillRate: 1, // 1 token per second
      window: 60,
    };

    // Consume all tokens
    for (let i = 0; i < 10; i++) {
      await checkTokenBucket(config);
    }

    // Should be denied
    let result = await checkTokenBucket(config);
    expect(result.allowed).toBe(false);

    // Wait 2 seconds (refill 2 tokens)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Should be allowed again
    result = await checkTokenBucket(config);
    expect(result.allowed).toBe(true);
  });
});
```

### 集成测试示例

```typescript
import { describe, it, expect } from 'vitest';
import { withRateLimit } from '@/lib/rate-limit';

describe('Rate Limit Middleware', () => {
  it('should add rate limit headers', async () => {
    const mockRequest = new Request('http://localhost/api/test');
    const handler = withRateLimit(() =>
      new Response(JSON.stringify({ success: true }))
    );

    const response = await handler(mockRequest);

    expect(response.headers.get('X-RateLimit-Limit')).toBeDefined();
    expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
    expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
  });

  it('should return 429 when limit exceeded', async () => {
    const mockRequest = new Request('http://localhost/api/test');
    const handler = withRateLimit(
      () => new Response(JSON.stringify({ success: true })),
      {
        limit: 2,
        window: 10,
      }
    );

    // First 2 requests
    await handler(mockRequest);
    await handler(mockRequest);

    // 3rd request should be rate limited
    const response = await handler(mockRequest);
    expect(response.status).toBe(429);
  });
});
```

## 部署注意事项

### 1. Redis 配置

- 生产环境建议使用 Redis Cluster 或哨兵模式
- 设置适当的内存淘汰策略: `maxmemory-policy allkeys-lru`
- 定期监控 Redis 内存使用

### 2. 性能优化

- 使用 Redis pipeline 批量操作
- 合理设置限流窗口大小（建议 60 秒）
- 根据实际流量调整限流阈值

### 3. 监控

- 监控 Redis 连接状态
- 监控限流触发频率
- 设置告警机制

### 4. 降级策略

- 当 Redis 不可用时自动降级到内存限流
- 记录降级事件
- 及时修复 Redis 连接问题

## 已知限制

1. **内存限流降级**: 当 Redis 不可用时使用内存限流，无法跨实例同步
2. **时间精度**: 限流时间精度受限于 Redis 时钟精度（毫秒级）
3. **事件存储**: 限流事件默认保留 7 天，可能丢失历史数据

## 未来改进

1. **分布式限流**: 支持多实例环境下的精确限流
2. **动态配置**: 支持运行时调整限流规则
3. **IP 白名单**: 支持白名单 IP 不限流
4. **分级限流**: 支持基于用户等级的差异化限流
5. **可视化面板**: 提供限流统计和监控面板

## 总结

Redis API 限流系统已完全实现，包含：

✅ 滑动窗口算法 - 精确时间窗口控制
✅ 令牌桶算法 - 突发流量平滑处理
✅ 限流中间件 - Next.js API 路由中间件
✅ 配置规则 - 预配置的限流规则
✅ 响应头 - X-RateLimit-* 响应头
✅ 事件日志 - 限流事件记录和统计

系统已准备就绪，可以立即在 v1.0.9 中使用。
