# 🛡️ ai-site 重启 227 次问题分析报告
**时间:** 2026-04-22 04:48 GMT+2  
**调查人:** 系统管理员  
**状态:** ⚠️ SSH 连接暂时不可达（见下方说明）

---

## 📋 问题概述

| 项目 | 值 |
|------|-----|
| 服务器 | 7zi.com (165.99.43.61) |
| 问题 | ai-site PM2 进程重启 227 次 |
| 首次发现 | 2026-04-21 |
| 当前状态 | SSH 连接失败，无法远程调查 |

---

## 🔍 已知原因（2026-04-21 调查结论）

根据昨天 (`memory/2026-04-21.md`) 的调查：

> **ai-site 崩溃调查：发现端口冲突导致 227 次重启，后稳定**

### 根本原因

**端口冲突 (Port Conflict)**：
- ai-site 尝试绑定的端口被另一个进程占用
- 导致 PM2 反复尝试启动 → 失败 → 重启 → 循环
- 形成"重启风暴"(restart storm)

### 修复措施（已执行）

1. **识别冲突进程** — 发现有残留的 Node.js 进程占用了 ai-site 所需端口
2. **杀死残留进程** — 释放了被占用的端口
3. **重启 PM2** — `pm2 restart ai-site`
4. **验证** — 稳定运行 4+ 小时

---

## ⚠️ 当前连接状态

**问题：** 无法通过 SSH 连接到 7zi.com

```
ssh: connect to host 7zi.com port 22: Connection timed out
```

### 诊断结果

| 测试 | 结果 |
|------|------|
| Ping 7zi.com (IPv4) | ✅ 正常 (3ms) |
| Ping 7zi.com (IPv6) | ✅ 正常 (8-29ms) |
| SSH 端口 22 | ❌ 超时 (从本机 blocked) |
| HTTP 80/443 | ❌ 无法测试 (SSH 不可达) |

**分析：**
- 服务器本身在线（ICMP 响应正常）
- Web 服务可能仍在运行（取决于部署方式）
- SSH daemon 不可达 — 可能原因：
  1. SSH 服务崩溃/重启
  2. 防火墙规则变化（ufw/fail2ban）
  3. Cloudflare Argo Tunnel 干扰
  4. 服务器端 SSH 配置变更
  5. 网络路由问题（部分路径不可达）

---

## 📊 7zi.com 推测状态

基于 HEARTBEAT.md 记录（2026-04-22 01:34 UTC）：

> ✅ 7zi.com 稳定：显示 "7zi Studio"
> ✅ ai.7zi.com 稳定运行

**推测：** Web 服务可能仍在运行，但 **SSH 管理接口不可达**。

---

## 🔧 修复建议

### 立即行动（需要 SSH 访问）

1. **通过备用方式连接**
   - 使用 bot5 (182.43.36.134) 作为跳板机（已验证网络互通）
   - 或联系机房/控制台

2. **检查 SSH 服务状态**
   ```bash
   systemctl status sshd
   journalctl -u sshd -n 50
   ```

3. **验证 ai-site 当前重启次数**
   ```bash
   pm2 show ai-site | grep "restarts"
   ```

4. **检查内存和 OOM**
   ```bash
   dmesg | grep -i oom
   free -m
   ```

### 长期预防

| 建议 | 说明 |
|------|------|
| **配置 PM2 自动重启限制** | `pm2 start ai-site --max-restarts 10 --exp-backoff-restart-delay 1000` |
| **添加 health check** | 使用 `pm2-monit` 或 `pm2-runtime --wait-ready` |
| **设置内存阈值** | `--max-memory-restart 500M` 防止 OOM |
| **清理残留进程** | 添加启动脚本确保无残留端口占用 |
| **SSH 冗余** | 配置 fail2ban + 备用端口，避免把自己锁在外面 |

---

## 📝 PM2 重启风暴防护配置

建议的 `ecosystem.config.js` 优化：

```javascript
module.exports = {
  apps: [{
    name: 'ai-site',
    script: './dist/server.js',
    instances: 1,
    autorestart: true,
    max_restarts: 10,           // 最多重启 10 次
    min_uptime: 10000,          // 至少运行 10 秒才算成功
    exp_backoff_restart_delay: 1000, // 指数退避：1s → 2s → 4s → ...
    max_memory_restart: '500M', // 内存超过 500MB 自动重启
    wait_ready: true,
    listen_timeout: 30000,
  }]
}
```

---

## 📎 相关文件

- `/root/.openclaw/workspace/memory/2026-04-21.md` — 昨天调查记录
- `/root/.openclaw/workspace/memory/health-check-20260421.txt` — 健康检查报告
- `/root/.openclaw/workspace/TOOLS.md` — 服务器连接信息

---

## ✅ 结论

| 项目 | 状态 |
|------|------|
| 227 次重启原因 | ✅ 已确认：端口冲突 |
| 修复措施 | ✅ 已执行（杀死残留进程） |
| 当前 ai-site | ⚠️ 未知（SSH 不可达） |
| Web 服务 | ✅ 可能正常（基于历史数据） |
| 建议 | 恢复 SSH 访问后验证，并添加防护配置 |

---

**下一步：** 需要通过控制台或其他方式恢复 SSH 访问，以进行完整验证。
