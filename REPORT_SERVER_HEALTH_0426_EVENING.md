# 🛡️ 服务器健康报告
## 报告时间：2026-04-26 18:10 (GMT+2 / 北京时间 00:10)

---

## 一、7zi.com (172.67.184.212) — 主网站服务器

### ⚠️ SSH 连接异常
- **端口 22 (SSH)**：被过滤/阻断，连接超时
- **nmap 扫描结果**：22/tcp filtered（无响应）
- **ping 测试**：正常（RTT ~3ms）
- **网站可访问性**：正常 ✅（通过 Cloudflare CDN）

### 🌐 网站状态
- **HTTP 响应**：301 redirect → `/zh`
- **Server**：Cloudflare
- **CF-Cache-Status**：DYNAMIC
- **状态**：正常运行 ✅

### ❌ 无法完成的检查（SSH 阻断）
由于 SSH 端口被阻断，以下命令无法执行：
- `df -h` — 磁盘空间
- `pm2 status` — PM2 服务状态
- `journalctl -u nginx` — Nginx 日志错误检查
- `uptime` — 服务器负载

**建议**：需通过 Cloudflare Access 或其他方式打开 SSH 端口 22。

---

## 二、bot5.szspd.cn (182.43.36.134) — 测试服务器

### ✅ 磁盘空间
```
文件系统      大小  已用  可用  使用%
/dev/vda2     40G   25G   16G   63%
```
**状态**：正常，剩余 16GB（37% 可用）

### ⚠️ PM2 服务
- **PM2 未安装**：命令 `pm2` 不存在
- 该服务器使用 systemd 管理服务，非 PM2

### ✅ 服务器负载
```
运行时间：31 天 3 小时 48 分
负载平均值：0.00, 0.00, 0.00（极低）
```
**状态**：负载正常 ✅

### ✅ 内存状态
```
总内存：1.9GB
已用：973MB（51%）
可用：796MB
Swap：2GB（已用 427MB）
```
**状态**：正常 ✅

---

## 三、7zi.com SSH 阻断分析

| 项目 | 结果 |
|------|------|
| ping | ✅ 正常（3ms） |
| SSH 端口 22 | ❌ filtered（被阻断） |
| HTTP/HTTPS | ✅ 正常 |
| Cloudflare | ✅ 已接入 |

**可能原因**：
1. 防火墙规则仅允许特定 IP 访问 SSH
2. Cloudflare proxy 隐藏了真实服务器 SSH
3. 服务器 SSH 仅对内网开放

---

## 📋 总结

| 服务器 | 状态 | 备注 |
|--------|------|------|
| 7zi.com 主站 | ⚠️ 部分阻断 | SSH 不可达，网站正常 |
| bot5.szspd.cn 测试机 | ✅ 正常 | 负载低，磁盘充足 |
| 7zi.com HTTPS | ✅ 正常 | Cloudflare CDN 运作中 |

### 🔧 待处理事项
1. **【重要】** 修复 7zi.com SSH 连接 — 建议在 Cloudflare 控制台添加 SSH 源服务器 IP 白名单，或通过其他方式（跳板机/VPN）访问
2. 检查 7zi.com 真实服务器的 PM2/Nginx 状态（需解决 SSH 问题后）
3. bot5.szspd.cn 无 PM2，确认是否改用 systemd 管理 Node 服务

---
*报告生成时间：2026-04-26 18:10 GMT+2*
*检查人员：🛡️ 系统管理员*