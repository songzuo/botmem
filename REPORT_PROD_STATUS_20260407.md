# 7zi.com 生产环境健康报告

**检查时间**: 2026-04-07 17:40 GMT+2 (服务器时间 23:40)
**服务器**: 165.99.43.61
**状态**: ⚠️ 存在风险

---

## 系统概览

| 项目 | 状态 |
|------|------|
| 系统运行时间 | 14 天 14 小时 |
| 负载 | 0.33, 0.32, 0.28 (正常) |
| 磁盘使用 | 70% (88G中已用61G, 余27G) |
| Docker 容器 | 无 (使用 PM2 直接管理) |

---

## 服务状态

### PM2 进程 (✅ Online)

| 进程名 | 版本 | 模式 | PID | 运行时间 | 状态 | 内存 |
|--------|------|------|-----|----------|------|------|
| 7zi-main | 1.3.0 | cluster | 2897099 | 12h | ✅ online | 98.5MB |

**端口监听**:
- 80/443 (HTTP/HTTPS) - nginx
- 3000 - Next.js (7zi-main)
- 8080 - nginx → Next.js 反向代理
- 8081 - node (独立服务)
- 8082 - nginx
- 18089 - nginx

### nginx 配置测试: ✅ 通过

---

## 🚨 发现的问题

### 1. [严重] Next.js Server Action 部署不匹配

```
Error: Failed to find Server Action "x". This request might be from an older or newer deployment.
```

**影响**: 用户提交表单、登录等 Server Action 可能失败
**原因**: 代码已更新 (v1.12.2) 但 PM2 进程可能运行的是旧版本, 或 `.next/server/server-reference-manifest.json` 缓存不一致
**建议**: 执行 `pm2 restart 7zi-main` 重启服务

### 2. [严重] PM2 反复重启失败

```
⨯ Failed to start server (多次出现)
```

**原因**: Server Action 错误导致 Next.js 无法正常启动
**建议**: 重启后观察是否还有此错误

### 3. [中等] nginx IPv6 上游连接失败

```
connect() to [2001:67c:4e8:f004::9]:443 failed (101: Unknown error)
```

**影响**: 部分请求通过 IPv6 代理失败 (来自多个 IP 的扫描)
**说明**: 这是恶意扫描流量, nginx 尝试代理到上游 IPv6 地址失败

### 4. [低] Certbot ACME 挑战文件缺失

```
open() "/var/www/certbot/.well-known/acme-challenge/install.php" failed
```

**说明**: 攻击者在扫描 WordPress 漏洞, 试图访问不存在的 PHP 文件
**无需处理**: 正常安全扫描, 不影响服务

### 5. [低] 缺少 SDK 文件

```
open() "/usr/share/nginx/html/SDK/webLanguage" failed
```

**说明**: 某个客户端 SDK 请求不存在的文件

---

## Git 部署状态

**最新提交** (3d350065):
```
feat(v1.12.2): Workflow template system and error handling unification
```

**提交历史**:
```
3d350065 feat(v1.12.2): Workflow template system and error handling unification
99a666a0 fix(websocket): Improve type safety in batch processor
1c3f0a1b test(db): Add draft storage tests
f1b1b503 types(db): Add feedback type definitions
69afb807 fix(debug): Improve type safety in ContextAnalyzer
```

---

## 📋 建议操作

1. **立即执行**:
   ```bash
   sshpass -p 'ge20993344$ZZ' ssh root@165.99.43.61 'pm2 restart 7zi-main'
   ```
   然后观察日志 `pm2 logs 7zi-main --nostream`

2. **如果 Server Action 错误持续**:
   ```bash
   cd /var/www/7zi && git pull && npm run build && pm2 restart 7zi-main
   ```

3. **长期方案**: 考虑添加部署后 PM2 重启脚本确保新版本完全加载

---

## 总结

| 检查项 | 状态 |
|--------|------|
| 系统运行 | ✅ 正常 |
| PM2 服务 | ⚠️ Server Action 警告 |
| nginx | ✅ 正常 |
| 磁盘空间 | ✅ 充足 |
| 最新代码 | ✅ 已部署 |
| 服务可用性 | ⚠️ 需重启确认 |

**总体评估**: 服务正在运行但存在 Next.js 部署不匹配问题, 建议重启 7zi-main 进程。
