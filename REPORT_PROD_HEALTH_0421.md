# 7zi.com 生产环境健康检查报告

**检查时间**: 2026-04-21 08:06 (GMT+2 / 北京时间 14:06)  
**服务器**: 165.99.43.61  
**运行时间**: 27 天 23 小时

---

## 1. 服务状态总览

| 服务 | 状态 | 运行时长 | 备注 |
|------|------|----------|------|
| **Nginx** | ✅ active (running) | 1周4天 | 主进程 PID 3618854 |
| **PostgreSQL** | ✅ active (exited) | 3周6天 | 进程正常 |
| **Redis** | ✅ active (running) | 3周6天 | PID 952, 内存 5.5M |
| **Docker** | ✅ running | - | 3 容器运行中 |

**Docker 容器**:
- `rabbitmq-dating` - Up 10 days ✅
- `mysql-dating` - Up 10 days ✅
- `microclaw` - Up 11 days ✅

**端口监听**:
- 80/443 ✅ (nginx)
- 8080 (Java) ✅
- 8081 (node_exporter) ✅
- 18089 (nginx) ✅
- 8082 (nginx) ✅
- 5672 (RabbitMQ) ✅
- 3306 (MySQL) ✅

---

## 2. 资源使用情况

### 磁盘空间 — ⚠️ 警告
```
/dev/vda1   88G   82G   5.9G   94% /
```
**磁盘使用率 94%，剩余空间仅 5.9GB**，建议尽快清理。

### 内存 — ✅ 正常
```
Mem:  7.8Gi total, 4.6Gi used, 1.3Gi free, 2.7Gi available
Swap: 0B (未使用)
```
使用率约 58%，可用 2.7GB。

### CPU — ✅ 正常
```
Load Average: 0.85, 1.04, 1.04
CPU Idle: 95.7%
```
负载较低，无压力。

---

## 3. Node.js 应用进程

检测到以下活跃 Node 进程：

| 应用 | 类型 | 内存占用 | 运行时长 |
|------|------|----------|----------|
| **good.7zi.com** | taro build --watch | 270MB | Apr13 |
| **today.7zi.com** | taro build --watch | 242MB | Apr13 |
| **wechat.7zi.com** | taro build --watch | 241MB | Apr13 |
| **7zi-studio** | next-server (v16.1.1) | x2 约 220MB | Apr13 |
| **visa-openness** | next-server (v16.2.2) | 59MB | Apr18 |
| **next (dev)** | next dev (port 3003) | 18MB | Apr19 |
| **next-server (v15.5.15)** | next-server | 105MB | Apr19 |
| **next-server (v16.1.1)** | next-server (port 3003) | 747MB | Apr19 |
| **server.js** | node server.js | 31MB | Apr20 |
| **server.js** | node server.js | 71MB | Apr17 |
| **mesh.mjs** | claw-mesh agent | 26MB | Apr05 |
| **openclaw-agent** | python/node_agent | 20MB | Apr05 |

**esbuild 进程** 多个，占用较少。

---

## 4. 最近错误摘要

### NGINX 错误日志 (24小时内)

**主要问题**:

1. **SSL 握手失败** (crit) — 多次出现 `SSL_do_handshake() failed: error:0A00006C:SSL routines::bad key share`
   - 来源 IP: 212.102.40.218, 85.217.149.50, 46.101.179.153, 152.32.204.21 等
   - 原因: 这些 IP 使用了不支持的椭圆曲线/密钥共享，可能是扫描器或恶意客户端
   - **风险**: 低，属于外部无效握手，不影响正常用户

2. **favicon.ico / robots.txt / sitemap.xml / config.json 404** (error)
   - 请求来自: 128.14.239.39, 66.132.195.79 等
   - **风险**: 低，属于爬虫/扫描器请求

3. **security.txt 404**
   - 请求来自: 66.132.195.79
   - **建议**: 添加 security.txt 文件或配置响应

### 系统日志 (journalctl) — SSH 攻击告警

大量 SSH 连接错误，主要为以下类型：
- `kex_exchange_identification: read: Connection reset by peer`
- `kex_exchange_identification: banner line contains invalid characters`
- `userauth_pubkey: parse publickey packet: incomplete message`
- `client sent invalid protocol identifier "MGLNDD_165.99.43.61_22"`

**分析**: 这些都是自动化扫描器/暴力破解工具的连接尝试，来自不同 IP，非针对性攻击。

**注意**: 有一个可疑的协议标识符 `MGLNDD_165.99.43.61_22` — 可能是一种VPN或代理工具的探测。

### good.log — ThinkPHP RCE 探测

```
/public/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php
/public/index.php?s=/index/\think\app/invokefunction&function=call_user_func_array&vars[0]=md5&vars[1][]=Hello
```
**分析**: 这是针对 ThinkPHP 框架已知漏洞的自动扫描和利用尝试，并非真实攻击。good.7zi.com 返回的是"文件在public目录下"的提示，实际未被攻破。

**建议**: 考虑对 /public 目录添加更严格的访问控制，或配置 nginx 拦截已知漏洞路径。

### visa.log — 正常运行 ✅

最近 30 行全部为 200 响应，响应时间 91ms - 1882ms，属于正常范围。

---

## 5. 网站可访问性测试

| URL | 状态码 | 响应时间 |
|-----|--------|----------|
| https://7zi.com/ | **200** ✅ | 0.34s |
| https://www.7zi.com/ | **301** ✅ | 0.20s |

---

## 6. 问题与建议

### 🔴 紧急 — 磁盘空间不足

**问题**: 根分区使用率 94%，仅剩 5.9GB  
**影响**: 可能导致系统不稳定、服务崩溃、无法写入日志  
**建议**:
1. 清理日志文件: `journalctl --vacuum-time=7d`
2. 清理 Docker 未使用镜像: `docker system prune -a`
3. 清理旧构建产物和临时文件
4. 考虑扩展磁盘或迁移数据

### 🟡 中等 — SSL 握手失败

**问题**: 多个 IP 出现 `SSL_do_handshake() failed: bad key share`  
**影响**: 部分客户端可能无法建立连接  
**建议**: 检查 nginx TLS 配置，确保兼容多种客户端

### 🟡 中等 — SSH 暴力破解尝试

**问题**: 系统日志显示大量 SSH 连接扫描  
**建议**: 
1. 检查 /etc/ssh/sshd_config 是否限制密码登录
2. 考虑配置 fail2ban 自动封禁恶意 IP
3. 考虑更换 SSH 端口或启用证书登录

### 🟢 建议 — 添加 security.txt

**问题**: nginx error log 显示对 `/.well-known/security.txt` 的 404 请求  
**建议**: 添加 security.txt 文件并配置响应

### 🟢 建议 — 优化 Node 进程

**问题**: 有 3 个 taro build --watch 进程自 Apr13 一直运行，消耗约 750MB 内存  
**建议**: 如非开发需要，可考虑停止这些 watch 进程

### 🟢 建议 — 统一 next-server 版本

**发现**: 存在 v15.5.15, v16.1.1, v16.2.2 三个版本  
**建议**: 统一升级到最新稳定版本，减少维护复杂度

---

## 7. 总体评估

| 维度 | 评分 | 备注 |
|------|------|------|
| **服务可用性** | ⭐⭐⭐⭐⭐ | 所有核心服务运行正常 |
| **网站可访问** | ⭐⭐⭐⭐⭐ | 7zi.com 响应 200 |
| **资源使用** | ⭐⭐⭐ | 磁盘 94% 需紧急处理 |
| **安全性** | ⭐⭐⭐ | SSH 扫描频繁，建议加强防护 |
| **日志健康** | ⭐⭐⭐⭐ | 无严重应用错误 |

**总结**: 生产环境整体运行正常，主要风险为磁盘空间不足（94%）和 SSH 暴力破解扫描。建议优先处理磁盘问题。
