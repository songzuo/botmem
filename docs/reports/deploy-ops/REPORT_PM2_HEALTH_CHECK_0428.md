# PM2 健康检查报告

**检查时间**: 2026-04-28 21:39 GMT+2  
**检查人**: 系统管理员子代理  
**目标**: PM2 进程状态、日志分析、磁盘空间

---

## 一、本机 (bot6) 检查结果

### 1.1 PM2 状态
```
❌ PM2 未安装
```
当前本机未使用 PM2 管理进程，直接以 Node.js 运行时运行。

### 1.2 磁盘空间
```
文件系统      大小   已用   可用   使用%  挂载点
/dev/sda1    145G   75G    71G    52%    /
```
✅ **状态良好** — 根分区使用率 52%，剩余 71GB，暂无清理需求。

### 1.3 PM2 日志
```
❌ 本机未安装 PM2，无法获取 PM2 日志
```

---

## 二、生产服务器 (7zi.com) 连接检查

### 2.1 SSH 连接测试
```
目标: root@7zi.com
IP: 172.67.184.212 / 104.21.59.229
结果: ❌ 连接超时 (Connection timed out)
```
Cloudflare CDN 后的源站无法直接通过域名/IP SSH 连接。

> ⚠️ **无法连接到生产服务器** — 需要通过内网 hostname `ecm-cd59` 或其他方式连接。需确认正确的直连 IP 或 VPN 通道。

---

## 三、测试服务器 (bot5.szspd.cn / 182.43.36.134) 检查结果

**Hostname**: `ecm-cd59`

### 3.1 PM2 状态
```
❌ PM2 未安装
```

### 3.2 Node.js 进程
```
PID     USER   内存      命令
11547   root   23MB      node /root/autonomous-agent.js
932     root   12MB      /usr/local/bin/node_exporter --web.listen-address=:9101
```
✅ ** autonomous-agent.js 运行正常** — 内存占用 23MB，无异常。

### 3.3 系统资源
```
磁盘 (/dev/vda2):
  总计: 40GB | 已用: 26GB | 可用: 15GB | 使用率: 63% ✅ 状态良好

内存:
  总计: 1.9GB | 已用: 1.0GB | 空闲: 75MB | 缓存: 830MB | 可用: 711MB
  Swap: 2.0GB | 已用: 436MB | 可用: 1.6GB ⚠️ 有一定 Swap 使用

CPU:
  核心数: 1
```

### 3.4 日志文件
```
/tmp/7zi-app.log        24KB   (最后修改: 4月8日)
/tmp/7zi-dev.log         0B     (空)
/tmp/7zi.log            126KB  (最后修改: 今日 19:39) ⚠️ 最近有活动
/tmp/autonomous-agent.log  1MB  (最后修改: 今日 03:41)
/tmp/sync-cron.log      16MB   (最后修改: 今日 03:41)
/tmp/openclaw-gateway.log  75B  (最后修改: 3月29日)
/tmp/cluster-agent.log   190KB  (最后修改: 3月28日)
```

### 3.5 系统日志 (journalctl)
主要日志内容为 AppArmor 的 CUPS 权限拒绝警告，不影响系统运行：
```
apparmor="DENIED" operation="dbus_signal" bus="system" path="/org/freedesktop/NetworkManager"
```
这些是 Ubuntu Snap 包装应用的正常安全限制警告，**非关键错误**。

---

## 四、总结

| 项目 | 状态 | 说明 |
|------|------|------|
| 本机 PM2 | ⚪ 未安装 | 本机直接用 Node.js 运行 |
| 本机磁盘空间 | ✅ 良好 | 52% 使用率，71GB 可用 |
| 7zi.com 连接 | ❌ 超时 | Cloudflare 背后无法直连 SSH |
| bot5 Node 进程 | ✅ 运行中 | autonomous-agent.js (23MB) |
| bot5 磁盘 | ✅ 良好 | 63% 使用率，15GB 可用 |
| bot5 内存 | ⚠️ 偏紧 | 75MB 空闲，Swap 在用 |
| 错误日志 | ✅ 无严重错误 | 仅有 AppArmor 正常警告 |

### 需要关注
1. **7zi.com 生产服务器无法连接** — 需要解决 SSH 直连问题（可能需要 hosts 文件配置或 VPN）
2. **bot5 内存偏紧** — 1.9GB 总内存，空闲仅 75MB，建议监控 autonomous-agent.js 内存增长
3. **PM2 均未安装** — 如需使用 PM2 管理，需要在目标机器上安装