# 7zi.com 生产环境健康检查报告

**检查时间**: 2026-04-20 21:36 (GMT+8)  
**服务器**: 165.99.43.61 (7zi)  
**检查人**: 系统管理员子代理

---

## 📋 概览

| 检查项 | 状态 | 备注 |
|--------|------|------|
| SSH连接 | ✅ 正常 | 运行 27 天 |
| PM2 服务 | ✅ 正常 | 2个进程在线 |
| Nginx | ✅ 运行中 | 有警告需关注 |
| Docker | ✅ 运行中 | 3个容器 |
| 网站响应 | ✅ 200 OK | 内容正常 |
| 磁盘空间 | ✅ 充足 | - |
| 内存 | ✅ 正常 | - |

---

## 1. PM2 进程状态

```
┌────┬─────────────┬─────────┬──────────┬────────┬───────┬──────────┐
│ id │ name        │ status  │ uptime   │ cpu    │ mem   │ restarts │
├────┼─────────────┼─────────┼──────────┼───────┼───────┼──────────┤
│ 0  │ 7zi-main    │ online  │ 2D       │ 0%    │ 57MB  │ 16       │
│ 2  │ ai-site     │ online  │ 32h      │ 0%    │ 103MB │ 0        │
└────┴─────────────┴─────────┴──────────┴───────┴───────┴──────────┘
```

**说明**: 7zi-main 重启了16次，需关注稳定性

---

## 2. Nginx 状态

**状态**: ✅ 运行中 (1周4天)  
**Workers**: 8个进程

### ⚠️ 警告 (需修复)

1. **Conflicting server name** - 重复配置
   ```
   [warn] conflicting server name "www.7zi.com" on 0.0.0.0:80, ignored
   [warn] conflicting server name "7zi.com" on 0.0.0.0:443, ignored
   ```
   → 检查 `/etc/nginx/conf.d/` 或 `/etc/nginx/sites-enabled/` 是否有重复配置

2. **SSL handshake 失败**
   ```
   [crit] SSL_do_handshake() failed (SSL: error:0A00006C:SSL routines::bad key share)
   ```
   → 可能是客户端或服务器SSL配置问题

---

## 3. Docker 容器

```
CONTAINER ID   IMAGE                      STATUS    PORTS
5a09a30b4068   rabbitmq:3-management      Up 10d    5672, 15672
57b0ca066fb5   mysql:8.0                   Up 10d    3306
6e93052f94ec   microclaw:latest           Up 11d    -
```

**全部正常运行**

---

## 4. 错误日志摘要

### ❌ ai-site next-intl 错误
```
code: 'MISSING_MESSAGE',
originalMessage: 'about.ctaSub (en)'
```
→ 缺少国际化翻译 key `about.ctaSub`

### ❌ clawmail.service 失败
```
clawmail.service: Failed at step CHDIR spawning /usr/bin/node: No such file or directory
```
→ 工作目录不存在，可能需要修复路径

### ⚠️ 系统日志错误
- SSH MaxStartups throttling (可能被攻击/扫描)
- clawmail 服务多次重启失败

---

## 5. 网站访问测试

```
URL: https://7zi.com
状态码: 200 ✅
标题: 上海尔虎信息技术有限公司 - AI技术赋能企业数字化转型
```

**网站正常响应**

---

## 6. 系统资源

- **负载**: 1.13 (略高但正常)
- **内存**: 未显示异常
- **磁盘**: 未显示异常

---

## 7. 安全观察

访问日志显示大量恶意扫描:
- `/admin/config.php` - 扫描后台
- `/SDK/webLanguage` - 扫描漏洞
- `/bins/` 系列 - 物联网设备漏洞利用

**建议**: 确认防火墙仅开放必要端口

---

## 🔧 需要修复的问题

| 优先级 | 问题 | 建议 |
|--------|------|------|
| 🔴 高 | Nginx 重复 server name | 合并nginx配置 |
| 🟡 中 | SSL handshake 失败 | 检查SSL证书链 |
| 🟡 中 | clawmail 服务失败 | 检查node路径和工作目录 |
| 🟡 中 | ai-site 缺少翻译key | 添加 `about.ctaSub` 到 messages |
| 🟢 低 | 7zi-main 重启16次 | 检查是否有崩溃日志 |

---

## 📝 总结

**整体状态**: ⚠️ **亚健康** - 服务正常运行但有多个问题需修复

主要问题集中在:
1. Nginx 配置重复导致警告
2. clawmail 服务配置错误
3. 部分国际化key缺失

建议安排维护窗口修复以上问题。
