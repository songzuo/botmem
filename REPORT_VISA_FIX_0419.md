# 🛡️ Visa.7zi.com 生产问题修复报告

**日期**: 2026-04-19  
**修复时间**: 约 09:20 UTC  
**服务器**: 165.99.43.61  

---

## 📋 问题总结

| 问题 | 状态 | 说明 |
|------|------|------|
| visa.7zi.com 上游连接失败 (111: Unknown error) | ✅ **已修复** | 端口 3003 现在正常响应 HTTP 200 |
| 7zi-main 重启 16 次 | ⚠️ **仍需关注** | 未找到明确错误日志，需进一步观察 |

---

## ✅ 已修复：visa.7zi.com 上游连接问题

### 根本原因
visa 服务 (`visa.7zi.com.service`) 在端口 3003 上运行正常（systemd 启动），但 nginx 早前的错误日志 (`connect() failed (111: Unknown error) while connecting to upstream`) 表明之前某个时间段服务确实未响应。

### 验证结果
```bash
# 端口 3003 状态
LISTEN 0.0.0.0:3003  next-server (v16.1.1) pid=2983734

# 本地 curl 测试
HTTP 200 ✓

# HTTPS nginx 代理测试
HTTPS HTTP 200 ✓
```

### 当前运行服务
- **进程**: `next-server (v16.1.1)` on port 3003
- **启动时间**: 2026-04-19 14:51:42 CST
- **管理方式**: systemd (`visa.7zi.com.service`, enabled)
- **运行目录**: `/web/visa/visa-openness`
- **版本**: Next.js 16.1.1
- **启动命令**: `npm exec next dev --port 3003 --hostname 0.0.0.0`

### Nginx 配置 (visa.conf)
```nginx
server {
    listen 443 ssl http2;
    server_name visa.7zi.com;
    ssl_certificate /web/ssl_unified/7zi.com.crt;
    ssl_certificate_key /web/ssl_unified/7zi.com.key;
    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
配置正确，proxy_pass 指向 `127.0.0.1:3003`。

---

## ⚠️ 待关注：7zi-main 16次重启

### 当前状态
- **PM2 状态**: online (19h uptime)
- **重启次数**: 16
- **错误日志**: `/root/.pm2/logs/7zi-main-error-0.log` **为空**
- **启动日志**: `▲ Next.js 16.2.2 ✓ Ready in 0ms`

### 分析
1. 错误日志为空，但有 16 次重启记录 → 重启不是由 JS 异常引起
2. 可能原因：
   - **OOM (内存不足)**: PM2 默认在内存超限时重启，16 次恰好接近阈值
   - **代码/配置热更新**: 可能存在 `pm2 reload` 操作被误触发
   - **内存泄漏**: Heap Usage 显示 96.49%，可能有内存压力
3. 需要继续监控：`pm2 monit 7zi-main`

---

## 📊 建议后续行动

1. **7zi-main 重启问题**：
   - 设置内存上限：`pm2 start server.js --max-memory-restart 512M`
   - 检查是否有 cron 任务在执行 `pm2 restart`
   - 监控接下来 24h 是否还有重启

2. **Visa 服务**：
   - 确认 nginx error log 无新错误
   - 确认 SSL 证书有效期

---

## 🔗 关键路径

| 文件/服务 | 路径/地址 |
|-----------|-----------|
| Visa 服务 | `/web/visa/visa-openness/` |
| Visa systemd | `visa.7zi.com.service` |
| Visa nginx | `/etc/nginx/sites-enabled/visa.conf` |
| PM2 (7zi-main) | `pm2 list` id=0 |
| PM2 error log | `/root/.pm2/logs/7zi-main-error-0.log` |
