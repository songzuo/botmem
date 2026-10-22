# Redis API 限流系统 - 快速开始

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install ioredis
```

### 2. 配置环境变量

在 `.env.production` 或 `.env.development` 中添加：

```bash
# Redis 配置（两种方式选一种）
REDIS_URL=redis://:password@localhost:6379/0

# 或者
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=mypassword
REDIS_DB=0
```

### 3. 在 API 路由中使用

```typescript
// src/app/api/tasks/route.ts
import { withRateLimit } from '@/lib/rate-limit';

export const GET = withRateLimit(async (req: NextRequest) => {
  const tasks = await getTasks();
  return NextResponse.json({ success: true, data: tasks });
});
```

就这么简单！限流中间件会自动处理：

- ✅ 检查限流
- ✅ 添加响应头
- ✅ 记录事件
- ✅ 返回 429 错误

## 📋 预配置规则

以下路径已自动配置限流规则：

| 路径 | 限制 | 窗口 | 算法 |
|------|------|------|------|
| `/api/health/*` | 100 | 60s | sliding-window |
| `/api/auth/login` | 10 | 60s | token-bucket |
| `/api/auth/register` | 5 | 60s | token-bucket |
| `/api/tasks` | 50 | 60s | sliding-window |
| `/api/projects` | 50 | 60s | sliding-window |

## 🎯 自定义配置

### 更严格的限制

```typescript
export const POST = withRateLimit(
  async (req: NextRequest) => {
    return NextResponse.json({ data: '...' });
  },
  {
    limit: 5,
    window: 60,
  }
);
```

### 使用令牌桶算法

```typescript
export const POST = withRateLimit(
  async (req: NextRequest) => {
    return NextResponse.json({ data: '...' });
  },
  {
    algorithm: 'token-bucket',
    limit: 10,
    window: 60,
    burstCapacity: 20,  // 允许突发到 20
    refillRate: 0.167, // 每秒补充 0.167 个令牌
  }
);
```

### 基于用户 ID 限流

```typescript
export const GET = withRateLimit(
  async (req: NextRequest) => {
    return NextResponse.json({ data: '...' });
  },
  {
    identifier: getUserIdFromRequest(req),
  }
);
```

## 📊 查看限流状态

```typescript
import { getRateLimitStatus } from '@/lib/rate-limit';

const status = await getRateLimitStatus('/api/tasks', 'user:123');
console.log({
  allowed: status.allowed,      // 是否允许
  remaining: status.remaining,  // 剩余次数
  resetTime: status.resetTime, // 重置时间
});
```

## 📝 响应头

所有响应都包含限流信息：

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 2024-03-23T12:00:00.000Z
X-RateLimit-Algorithm: sliding-window
```

当被限流时（429 状态码）：

```http
Retry-After: 30
```

## 🔧 故障排查

### Redis 连接失败

如果 Redis 不可用，系统会自动降级到内存限流：

```typescript
// 检查 Redis 状态
import { isRedisAvailable } from '@/lib/redis/client';

const available = await isRedisAvailable();
console.log('Redis available:', available);
```

### 调试限流事件

```typescript
import { getRateLimitStats, getTopOffenders } from '@/lib/rate-limit';

// 获取统计信息
const stats = await getRateLimitStats();
console.log('Total events:', stats.totalEvents);
console.log('Exceeded:', stats.exceededEvents);

// 获取违规最多的 IP
const offenders = await getTopOffenders(10);
console.log('Top offenders:', offenders);
```

## 📖 更多信息

详细文档请参阅 [API_RATE_LIMIT_IMPLEMENTATION_REPORT.md](./API_RATE_LIMIT_IMPLEMENTATION_REPORT.md)

## ✅ 验证安装

运行以下命令验证：

```bash
# 1. 检查 Redis 连接
npm run dev
# 访问 http://localhost:3000/api/health
# 检查日志中是否有 "Redis client connected"

# 2. 测试限流
# 快速刷新页面多次，观察响应头中的 X-RateLimit-Remaining 递减
# 当 X-RateLimit-Remaining 为 0 时，应该返回 429 状态码
```

## 🎓 常见问题

**Q: 限流会影响性能吗？**

A: Redis 操作非常快速（通常 < 1ms），对性能影响极小。如果 Redis 不可用，会自动降级到内存限流。

**Q: 如何调整限流规则？**

A: 可以在 `src/lib/rate-limit/index.ts` 的 `DEFAULT_LIMITS` 中修改，或在中间件中使用自定义配置。

**Q: 支持分布式部署吗？**

A: 是的，使用 Redis 存储限流状态，支持多实例部署。

**Q: 如何为不同用户设置不同限流？**

A: 使用 `identifier` 参数，传入用户 ID 或 API Key 即可实现。

**Q: 限流数据会保留多久？**

A: Redis 中限流状态根据窗口自动过期（通常 60 秒），限流事件保留 7 天。

---

有问题？查看完整文档或查看源码中的注释。
