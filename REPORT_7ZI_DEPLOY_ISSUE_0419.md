# 7zi.com 部署问题分析报告

**日期**: 2026-04-19 13:18 GMT+2  
**分析人**: 📚 咨询师子代理  
**任务来源**: REPORT_PENDING_TASKS_0419.md - P0 紧急问题

---

## 1. 问题概述

**现象**: 7zi.com 显示"上海尔虎信息技术有限公司"（旧版静态内容），而非 7zi Studio。

**根本原因**: Nginx 配置将 7zi.com 流量路由到旧静态站点目录 `/var/www/erhu-brand`，而 PM2 上运行的 v1.3.0 Next.js 应用未被主域名正确引用。

---

## 2. 现状分析

### 2.1 域名与服务映射

| 域名 | 实际服务 | 状态 |
|------|----------|------|
| **7zi.com** | 旧静态站 `/var/www/erhu-brand` | ❌ 显示旧内容 |
| **ai.7zi.com** | Next.js (`/var/www/new-7zi-site`) | ✅ 正常（307重定向正常） |
| **visa.7zi.com** | upstream 127.0.0.1:3003 | ❌ 端口3003无服务 |

### 2.2 PM2 进程状态

```
7zi-main: v1.3.0, cluster模式, 端口3000, 重启16次
ai-site:  端口3001, 正常运行
```

**问题**: 运行版本是 v1.3.0，最新代码已是 v1.14.0（commit e6fab7cc）

### 2.3 Git 状态

```
本地分支: main
本地最新: e6fab7cc (v1.14.0)
部署版本: v1.3.0 (落后约71个commit)
```

### 2.4 Nginx 配置问题

根据报告，Nginx 将 7zi.com 流量路由到了 `/var/www/erhu-brand`（旧静态站），而非 PM2 管理的 Next.js 应用。

---

## 3. 根本原因

**两个独立问题叠加**:

1. **内容路由错误** — Nginx 将 7zi.com 路由到旧静态站，未路由到 PM2 的 Next.js 服务
2. **版本落后** — PM2 运行的是 v1.3.0，不是最新的 v1.14.0

---

## 4. 解决方案

### 方案 A: 修复 Nginx 路由 + 重启 PM2（推荐，紧急）

```bash
# 1. SSH 登录服务器
sshpass -p 'ge20993344$ZZ' ssh root@165.99.43.61

# 2. 检查 Nginx 配置（主域名路由）
cat /etc/nginx/sites-available/7zi.com.conf
# 或
cat /etc/nginx/conf.d/7zi.com.conf

# 3. 确认 PM2 应用路径对应的静态文件目录
# PM2 运行: /var/www/7zi/7zi-frontend/.next/standalone
# 需要确认 nginx root 指向 .next/static 而非 /var/www/erhu-brand

# 4. 修复 Nginx 配置后重载
nginx -t && systemctl reload nginx
```

### 方案 B: GitHub Actions 自动部署（根本解决）

```bash
# 确认 cd.yml 工作流正常，触发 main 分支部署
git push origin main
# 或手动在 GitHub Actions 页面触发
```

### 方案 C: 手动完整部署

```bash
# 在服务器上
cd /var/www/7zi/7zi-frontend
git pull origin main
npm install
npm run build
pm2 restart 7zi-main
nginx -t && systemctl reload nginx
```

---

## 5. 次要问题

| 问题 | 优先级 | 说明 |
|------|--------|------|
| visa.7zi.com (端口3003) | 🟡 中 | 上游服务缺失 |
| PM2 重启16次 | 🟡 中 | 需查看日志排查 |
| 磁盘80% | 🟡 中 | 建议清理 |
| ai.7zi.com 307 | ✅ 正常 | next-intl 语言重定向 |

---

## 6. 推荐行动顺序

1. **立即** — SSH 到服务器，检查 Nginx 配置，确认 7zi.com 的 `root` 指令
2. **立即** — 修改 Nginx 将 7zi.com 路由指向 PM2 的 Next.js 静态文件
3. **当天** — 执行 `pm2 restart 7zi-main` 或重新部署 v1.14.0
4. **本周** — 解决 visa.7zi.com 端口3003服务问题
5. **本周** — 磁盘清理（80%使用率）

---

*报告生成: 📚 咨询师子代理*
