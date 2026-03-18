# Server Tests

这个目录包含 `server.test.js` 文件，用于测试 docs 项目的主要端点和缓存中间件功能。

## 测试覆盖范围

### 1. 主要端点测试
- **Spec 端点**:
  - `GET /spec/openapi.yaml` - 返回 YAML 格式的 OpenAPI 规范
  - `GET /spec/openapi.json` - 返回 JSON 格式的 OpenAPI 规范
  - 验证 OpenAPI 规范包含必需字段（openapi, info, paths）

- **健康检查端点**:
  - `GET /api/health` - 返回服务状态、时间戳、版本和运行时间
  - 验证时间戳为 ISO 格式
  - 验证运行时间为数字类型

- **静态文件服务**:
  - 验证 public 目录中的静态文件正确提供服务

### 2. 缓存端点测试

#### GET /api/cache/stats
- 返回缓存统计信息
- 验证缓存大小、最大大小、TTL
- 跟踪缓存命中（hits）和未命中（misses）
- 计算命中率（hit rate）
- 返回缓存条目列表及其元数据（key, timestamp, age, expiresAt）

#### POST /api/cache/clear
- 清除所有缓存条目
- 返回清除的条目数量
- 递增清除计数器
- 处理空缓存的情况

#### 缓存端点集成测试
- 验证缓存状态在操作后正确反映
- 验证缓存端点本身被缓存（因为它们是 GET 请求）

### 3. 缓存中间件测试

#### 缓存头部
- GET 请求应该有 `X-Cache` 头部（HIT 或 MISS）
- 第一次请求返回 `X-Cache: MISS`
- 后续相同端点的请求返回 `X-Cache: HIT`
- 不同端点有独立的缓存条目
- 带查询参数的 GET 请求分别缓存

#### 缓存行为
- POST 请求不被缓存
- PUT 请求不被缓存
- DELETE 请求不被缓存
- 404 错误响应也会设置缓存头部（缓存中间件拦截所有 GET 请求）

#### 缓存一致性
- 缓存的响应与原始响应匹配
- 不同 URL 分别处理

### 4. 其他测试

#### CORS 头部
- 响应包含 CORS 头部
- OPTIONS 请求返回正确的 CORS 头部

#### 请求日志中间件
- 验证请求日志不会破坏请求
- 支持自定义 `X-Request-ID` 头部

#### JSON 主体大小限制
- 接受大小限制内的 JSON 主体（10MB）

#### 服务器模块导出
- `server.js` 正确导出 Express 应用
- Express 应用具有必要的方法（get, post, put, delete, use）

#### 错误处理
- 服务器优雅处理 JSON 解析错误
- 404 处理器返回正确的错误格式

## 运行测试

### 运行 server.test.js
```bash
# 只运行 server.test.js
npm test -- tests/server.test.js

# 使用 Jest 直接运行
npx jest tests/server.test.js

# 带详细输出
npx jest tests/server.test.js --verbose

# 不包含覆盖率报告
npx jest tests/server.test.js --no-coverage
```

### 运行所有测试
```bash
npm test
```

## 测试统计

- **总测试数**: 40
- **测试套件**: 1
- **覆盖率**: ~60% 代码行覆盖率

## 注意事项

1. **缓存清理间隔**: 为了避免测试无法退出，缓存清理间隔（`setInterval`）只在服务器直接运行时启动，不在测试时启动。

2. **测试隔离**: 每个测试套件开始时清除缓存，确保测试之间没有状态污染。

3. **404 错误缓存**: 当前的缓存实现会缓存 404 错误响应，因为缓存中间件拦截所有 GET 请求。测试中已反映这一点。

4. **缓存端点**: `/api/cache/stats` 端点本身也会被缓存，因为它是 GET 请求。

## 依赖项

- `jest`: 测试框架
- `supertest`: HTTP 测试库
- `express`: Web 框架（被测应用）
