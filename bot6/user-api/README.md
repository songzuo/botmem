# User API

轻量级用户管理 REST API 服务。

## 功能

- ✅ 获取所有用户列表
- ✅ 根据 ID 获取单个用户
- ✅ 创建新用户
- ✅ 更新现有用户
- ✅ 删除用户
- ✅ 邮箱唯一性验证

## API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /users | 获取所有用户 |
| GET | /users/:id | 获取指定用户 |
| POST | /users | 创建新用户 |
| PUT | /users/:id | 更新用户 |
| DELETE | /users/:id | 删除用户 |
| GET | /health | 健康检查 |

## 使用方法

```bash
# 安装依赖
npm install

# 启动服务
npm start

# 运行测试
npm test
```

## 示例请求

```bash
# 获取所有用户
curl http://localhost:3000/users

# 创建用户
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "张三", "email": "zhangsan@example.com"}'
```

## 项目结构

```
user-api/
├── routes/
│   └── users.js      # 用户路由模块
├── test/
│   └── users.test.js # 单元测试
├── server.js         # 主入口
└── package.json
```
