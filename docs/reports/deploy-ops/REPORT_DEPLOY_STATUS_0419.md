# 部署状态报告 - 2026-04-19

## 1. 7zi.com (165.99.43.61) 状态

### PM2 进程状态
```
┌────┬─────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name        │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼─────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ 7zi-main    │ default     │ 1.3.0   │ cluster │ 2697060  │ 16h    │ 16   │ online    │ 0%       │ 80.3mb   │ root     │ disabled │
└────┴─────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```
- ✅ 状态: **online**
- ⚠️ 重启次数: 16次 (需要关注)
- 应用路径: `/var/www/7zi/7zi-frontend/.next/standalone/7zi-frontend/server.js`

### Nginx 状态
- ✅ **active (running)** - 正常运行
- 运行时间: 1周3天 (自 2026-04-09 11:36:31)

### 磁盘空间
```
/dev/vda1: 88G used, 18G available, 80% used
```
⚠️ 使用率 80%，还有 18G 可用

### 内存使用
```
Mem: 7.8Gi total, 4.1Gi used, 1.2Gi free, 3.3Gi available
Swap: 0B (未使用)
```
✅ 内存状态正常

### Nginx 错误日志 (最近50条)
**主要错误类型:**
1. **visa.7zi.com upstream 连接失败** - 多次 `connect() failed (111: Unknown error) while connecting to upstream, upstream: http://127.0.0.1:3003/`
   - 每小时整点都有发生
   - ⚠️ **上游服务 (端口 3003) 似乎未运行或无响应**

2. **SSL handshake 失败** - `SSL_do_handshake() failed (SSL: error:0A00006C:SSL routines::bad key share)`
   - 来源 IP: 152.32.186.240, 20.163.37.98, 212.102.40.218 等
   - 可能是客户端或配置问题

3. **favicon.ico 404** - 不影响功能

---

## 2. bot5.szspd.cn (182.43.36.134) 状态

### PM2
- ❌ PM2 未安装

### Nginx
- ✅ **active (running)** - 正常运行
- 运行时间: 3周2天

### 磁盘空间
```
/dev/vda2: 40G used, 16G available, 62% used
```
✅ 状态正常

### 内存使用
```
Mem: 1.9Gi total, 971Mi used, 89Mi free, 798Mi available
Swap: 2.0Gi total, 284Mi used
```
⚠️ 内存使用较高 (约 971Mi/1.9Gi)

---

## 3. Git 部署状态 (7zi.com)

```
分支: main
工作树状态: clean (无待提交更改)
最近提交:
  e6fab7cc chore: prepare v1.14.0
  3d350065 feat(v1.12.2): Workflow template system and error handling unification
  99a666a0 fix(websocket): Improve type safety in batch processor
  1c3f0a1b test(db): Add draft storage tests
  f1b1b503 types(db): Add feedback type definitions
```

**远程新分支 (dependabot 自动创建):**
- 多个 dependabot 分支 (docker, npm_and_yarn, github_actions 等)
- **主分支无待拉取更新**

---

## ⚠️ 问题汇总

| 问题 | 严重程度 | 说明 |
|------|----------|------|
| visa.7zi.com upstream 3003 连接失败 | 🔴 高 | 每小时整点都有失败，可能是 visa 服务未启动或崩溃 |
| PM2 进程重启 16 次 | 🟡 中 | 可能存在不稳定因素 |
| bot5 内存使用率高 | 🟡 中 | 971Mi/1.9Gi (51%) |
| 磁盘使用 80% | 🟡 中 | 88G盘已用70G，需关注 |

---

## 建议操作

1. **紧急检查** - visa.7zi.com 的上游服务 (127.0.0.1:3003) 是否正常运行
2. **查看 PM2 日志** - 调查 7zi-main 为何重启 16 次
3. **清理磁盘** - 80% 使用率，建议清理日志或无用文件
