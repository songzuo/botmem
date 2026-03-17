# 系统健康报告 - bot6
**生成时间**: 2026-03-16 10:15 CET  
**系统运行时间**: 6 天 23 小时 56 分钟

---

## 🔴 关键问题

### 1. OpenClaw 服务冲突 (严重)
- **状态**: systemd `openclaw.service` 持续重启失败
- **原因**: 端口 18789 已被 pid 1901057 (openclaw-gateway) 占用
- **重启计数**: 已超过 5062 次
- **影响**: 系统资源浪费，CPU 负载增加
- **建议修复**:
  ```bash
  # 方案1: 停止 systemd 服务（因为 gateway 已独立运行）
  systemctl stop openclaw.service
  systemctl disable openclaw.service
  
  # 方案2: 或者停止独立运行的 gateway，让 systemd 管理
  openclaw gateway stop
  systemctl restart openclaw.service
  ```

### 2. Claw-Mesh 同步失败 (中等)
- **状态**: git rebase 操作卡住
- **错误**: `.git/rebase-merge` 目录存在，阻止后续操作
- **建议修复**:
  ```bash
  cd /root/.openclaw/workspace
  git rebase --abort  # 或 rm -fr .git/rebase-merge
  ```

---

## 📊 系统资源状态

| 指标 | 当前值 | 状态 |
|------|--------|------|
| **CPU 负载 (1/5/15m)** | 1.78 / 1.27 / 1.18 | ⚠️ 偏高 |
| **CPU 使用率** | ~40% user, 26% system | ⚠️ 较高 |
| **内存使用** | 2.0GB / 7.8GB (26%) | ✅ 正常 |
| **可用内存** | 5.8GB | ✅ 充足 |
| **Swap 使用** | 795MB / 4GB (19%) | ✅ 正常 |
| **磁盘使用 (/)** | 33GB / 145GB (23%) | ✅ 充足 |
| **IO 等待** | 2.3% | ⚠️ 偏高 |

---

## ⏰ Cron Job 配置

### 用户级定时任务 (crontab -l)
| 调度 | 任务 | 状态 |
|------|------|------|
| `*/15 * * * *` | bot6_ta[已移除].sh | ✅ 运行中 |
| `0 8,14,20 * * *` | bot6_scheduler.py system-monitoring | ✅ 运行中 |
| `*/15 * * * *` | self_think.py --auto | ✅ 运行中 |
| `0 3 * * *` | backup.sh | ✅ 配置 |
| `0 8 * * *` | monitor.sh | ✅ 配置 |
| `0 * * * *` | session-guardian.js | ✅ 运行中 |
| `0 */8 * * *` | upload-memory.sh | ⚠️ 脚本不存在 |
| `*/5 * * * *` | claw-mesh-watchdog.sh | ✅ 运行中 |
| `10 */4 * * *` | sync-from-peer.sh | ✅ 配置 |
| `*/4 * * * *` | claw-mesh-sync.sh | ❌ 失败 |

### 系统 cron.d 任务
- `openclaw-update` - OpenClaw 自动更新
- `sysstat` - 系统统计收集
- `e2scrub_all` - 文件系统检查

### Systemd Timers (活跃)
- `sysstat-collect.timer` - 每 10 分钟
- `backup-monitoring.timer` - 每日 03:00
- `apt-daily.timer` - 每日
- `logrotate.timer` - 每日

---

## 📈 最近调度记录 (24小时)

### 正常执行的任务
- ✅ claw-mesh-watchdog.sh - 每 5 分钟执行
- ✅ claw-mesh-sync.sh - 每 4 分钟执行
- ✅ session-guardian.js - 每小时执行
- ✅ self_think.py - 每 15 分钟执行
- ✅ sysstat 数据收集

### 执行异常的任务
- ❌ claw-mesh-sync - 同步失败（git rebase 卡住）
- ❌ upload-memory.sh - 脚本文件不存在
- ⚠️ claw-mesh-watchdog - 检测到 claw-mesh-sync 进程异常

---

## 🔍 进程状态

### 高资源消耗进程
| PID | 进程 | CPU% | MEM% | 状态 |
|-----|------|------|------|------|
| 1901057 | openclaw-gateway | ~100% | 17.3% | ✅ 运行中 |
| 1773631 | prometheus | 0.7% | 0.7% | ✅ 正常 |
| 1912589 | prometheus-node-exporter | 2.7% | 0.2% | ✅ 正常 |
| 1531581 | claw-mesh | 0.0% | 0.1% | ✅ 运行中 |

### 活跃服务
- ✅ `openclaw-gateway` (pid 1901057) - 独立运行
- ⚠️ `openclaw.service` - systemd 持续重启失败
- ✅ `claw-mesh.service` - 运行正常
- ✅ `picoclaw.service` - 运行正常
- ✅ `prometheus` - 运行正常
- ✅ `docker` - 运行正常

---

## 📋 建议操作清单

### 立即处理
1. [ ] 解决 OpenClaw 服务冲突
   ```bash
   systemctl stop openclaw.service
   systemctl disable openclaw.service
   ```

2. [ ] 修复 Claw-Mesh 同步
   ```bash
   cd /root/.openclaw/workspace
   git rebase --abort
   ```

### 近期处理
3. [ ] 修复或移除 upload-memory.sh cron 任务（脚本不存在）

4. [ ] 调查 CPU 高负载原因
   - 可能与 systemd 频繁重启有关
   - 检查 openclaw-gateway 内存使用 (1.3GB)

---

## 📊 磁盘 I/O 性能

| 设备 | 读取/秒 | 写入/秒 | 利用率 |
|------|---------|---------|--------|
| sda | 122 r/s | 59 w/s | 4.4% |

I/O 性能正常，无明显瓶颈。

---

**报告生成者**: OpenClaw 系统健康检查  
**下次建议检查时间**: 2026-03-17 10:00 CET
