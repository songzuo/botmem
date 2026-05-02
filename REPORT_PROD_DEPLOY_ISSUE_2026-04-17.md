# 🛡️ 7zi.com 生产部署问题诊断报告

**日期**: 2026-04-17  
**时间**: 22:52 GMT+2  
**诊断人**: 系统管理员子代理  
**优先级**: 🔴 紧急

---

## 1. 问题概述

**确认的问题**：7zi.com 仍在服务旧版静态站点（上海尔虎信息技术有限公司企业展示页），而非新部署的 7zi Studio。

---

## 2. SSH 连接诊断 — 🔴 CRITICAL

| 测试项 | 结果 |
|--------|------|
| SSH 端口 22 | ❌ **连接超时 (filtered/closed)** |
| 端口 2222 | ❌ 关闭 |
| 端口 22022 | ❌ 关闭 |
| 端口 8022 | ❌ 关闭 |

**对比 04-16 报告**：昨天 SSH 连接正常（`23天 13小时 58分` 运行时间），现在端口 22 被过滤/阻断。

**影响**：无法通过 SSH 登录服务器进行直接诊断和修复操作。

---

## 3. 公开端点测试结果

### 3.1 HTTPS 主站 (7zi.com) — ❌ 旧版静态站点

```
curl https://7zi.com/
```
返回：**上海尔虎信息技术有限公司 - AI技术赋能企业数字化转型**（旧版企业展示站）

页面特征：
- 标题：20年行业深耕、500+服务企业等企业介绍内容
- 不包含任何 7zi Studio 功能
- 是静态 HTML 页面

### 3.2 /api/health 端点 — ❌ 旧版响应

```
curl https://7zi.com/api/health
```
返回：**旧版静态站 HTML**（而非预期的 JSON API 响应）

### 3.3 HTTP → HTTPS 重定向

```
curl http://7zi.com/
```
返回：**301 重定向到 HTTPS**，中间件正常

### 3.4 SSL 证书

```
CN=7zi.com, Issuer=Google Trust Services, WE1
有效期: 2026-03-01 ~ 2026-05-30
```
证书正常，未过期。

### 3.5 Cloudflare CDN 状态

```
server: cloudflare
cf-cache-status: DYNAMIC
CF-RAY: 9ede4daadcd3dc85-FRA
```
7zi.com 使用 **Cloudflare CDN** 作为前端代理，源站通过 Cloudflare 隐藏。

---

## 4. 直接源站探测 (端口扫描)

| 端口 | 状态 | 说明 |
|------|------|------|
| 22 (SSH) | ❌ filtered | 无法 SSH |
| 80 | ✅ open | HTTP |
| 443 | ✅ open | HTTPS |
| 8080 | ✅ open | Java/后端进程 |
| 8443 | ❌ error 521 | Cloudflare 源站连接失败 |

### 4.1 端口 8080 后端探测

```
curl http://7zi.com:8080/api/health
```
响应：
```json
{"code":"500","message":"服务器内部错误: No static resource api/health."}
```

**分析**：
- 端口 8080 确实有后端服务在运行（04-16 报告显示是 Java 进程）
- 该后端不认识 `/api/health` 路径 → 这是 **Java 后端**（不是 Node.js/Next.js Studio）
- `No static resource` 错误暗示这是一个静态资源/路由映射问题

```
curl http://7zi.com:8080/
```
返回：
```json
{"code":"500","message":"服务器内部错误: No static resource ."}
```

---

## 5. 已排除的可能

| 可能原因 | 排除依据 |
|----------|----------|
| Cloudflare 缓存旧内容 | cf-cache-status: DYNAMIC（未缓存） |
| DNS 解析错误 | 正确解析到 Cloudflare IPs |
| SSL 证书问题 | 证书有效且正常 |
| 整体服务器宕机 | 端口 80/443/8080 仍响应 |

---

## 6. 根本原因分析

### 假设 1: Nginx 配置被回滚/覆盖
- 旧版静态站仍在 `/var/www/html/` 或类似路径
- Nginx `server_name` 配置仍指向旧站点目录
- 新版 7zi Studio 构建文件未被加载

### 假设 2: PM2 进程已停止或崩溃
- 04-16 报告显示 `7zi-main`（主 Next.js 应用）在端口 3000 运行
- 如果该进程停止，Cloudflare 521 错误应会出现（而非旧站点）
- 但端口 8080 的 Java 进程仍在运行

### 假设 3: PM2 进程重启但路由配置错误
- `7zi-main` 可能重启但 `next start` 命令指向错误的 `dist` 目录
- 或 `NEXT_PUBLIC_API_URL` 环境变量配置错误

### 假设 4: 部署脚本未正确执行
- 最新构建上传后，`pm2 restart` 或 `nginx reload` 未执行
- 这解释了为什么 SSH 会话中看到"连接正常"但 web 显示旧站点

### 假设 5（最可能）: SSH 端口被阻断是新问题
- 服务器本身运行正常（80/443/8080 响应）
- 问题出在 Nginx 配置或 Next.js 应用状态
- SSH 阻断可能是：防火墙规则变化、Cloudflare Spectrum、或其他网络安全策略调整

---

## 7. 诊断结论

```
┌─────────────────────────────────────────────┐
│ 7zi.com 网络拓扑（推测）                      │
│                                              │
│  用户请求 → Cloudflare CDN → 源站 Nginx      │
│                                ↓              │
│                         ┌────┴─────┐         │
│                    旧静态站    Next.js (端口3000?) │
│                   (当前)       (停止?)         │
│                                ↓              │
│                         Java后端(端口8080)     │
└─────────────────────────────────────────────┘
```

**根本原因（高置信度）**：

Nginx 仍在服务旧版静态站点目录，而非代理到 7zi Studio (Next.js) 应用。PM2 中的 `7zi-main` 可能已停止或未正确加载新构建。

**次要问题**：
- SSH 端口 22 被阻断，无法远程登录服务器执行修复

---

## 8. 建议修复步骤（需要 SSH 访问）

1. **恢复 SSH 访问**（优先级最高）
   - 如果有云控制台（阿里云/腾讯云），通过控制台打开端口 22
   - 或联系机房/network admin

2. **SSH 登录后检查**
   ```bash
   # SSH 恢复后执行
   ssh root@7zi.com
   pm2 list
   nginx -t
   cat /etc/nginx/sites-available/7zi.com
   ```

3. **验证 Nginx 配置**
   - 检查 `proxy_pass` 是否指向 `127.0.0.1:3000`（7zi-main）
   - 检查 `root` 路径是否指向旧静态站目录

4. **重启/修复 Next.js 应用**
   ```bash
   pm2 restart 7zi-main
   # 或
   pm2 start ecosystem.config.js --only 7zi-main
   ```

5. **重载 Nginx**
   ```bash
   nginx -t && nginx -s reload
   ```

6. **验证部署**
   ```bash
   curl https://7zi.com/api/health
   # 预期: JSON API 响应
   ```

---

## 9. 下一步行动

| 优先级 | 行动 | 负责 |
|--------|------|------|
| P0 | 恢复 SSH 访问（通过云控制台或联系机房） | 主人/其他管理员 |
| P1 | SSH 登录后诊断 Nginx 和 PM2 状态 | 系统管理员 |
| P2 | 确认 7zi Studio 最新构建路径和版本 | 系统管理员 |
| P3 | 修复后部署验证 | 全体验证 |

---

**报告生成时间**: 2026-04-17 22:52 GMT+2  
**诊断方法**: 远程端口扫描 + HTTP/HTTPS 探测 + SSL 证书分析
