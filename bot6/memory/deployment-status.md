# 部署状态报告

**检查时间:** 2026-03-31 08:43 CET  
**服务器:** 7zi.com (165.99.43.61)

## ✅ 服务状态总览

| 服务 | 状态 | 详情 |
|------|------|------|
| **Nginx** | ✅ 运行中 | 运行 3 天，8 个 worker 进程 |
| **7zi.com** | ✅ 正常 | Next.js v16.2.1，端口 3000 |
| **Redis** | ✅ 运行中 | 端口 6379 |
| **PostgreSQL** | ✅ 运行中 | 端口 5432 |
| **Prometheus** | ✅ 运行中 | 端口 9090 |
| **OpenClaw Gateway** | ✅ 运行中 | 端口 18789, 18791 |

## 🌐 网站响应测试

- **https://7zi.com/** → HTTP 307 (重定向到 /zh) ✅
- **https://7zi.com/zh** → HTTP 200，HTML 正常加载 ✅

## 💾 系统资源

| 指标 | 使用 | 可用 | 状态 |
|------|------|------|------|
| **磁盘** | 56G / 88G (64%) | 32G | ✅ 正常 |
| **内存** | 2.7G / 7.8G | 4.7G 可用 | ✅ 正常 |

## 📊 活动端口

- **80/443** - Nginx (Web)
- **3000** - 7zi.com Next.js
- **5432** - PostgreSQL
- **6379** - Redis
- **9090** - Prometheus
- **9101** - node_exporter
- **5171-5177** - Vite 开发服务器
- **10087-10089** - Taro 构建服务
- **18789/18791** - OpenClaw Gateway

## 📝 运行中的 Node 进程

主要应用：
- `next-server` - 7zi.com 主站
- `claw-mesh` - Mesh 服务
- `openclaw-gateway` - OpenClaw 网关
- 多个 Vite/Taro 开发服务器

## 🐳 Docker 状态

- 无容器运行（正常，使用 Node 直接运行）

## 🔄 PM2 状态

- PM2 Daemon 运行中
- 主站通过 `npm exec next start` 运行，非 PM2 管理

## 📋 日志检查

- **journalctl 最近 50 条:** 无错误 ✅

## 🎯 结论

**所有关键服务正常运行！** 无需修复操作。

---
*自动生成 by 系统管理员子代理*
