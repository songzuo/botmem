# system-monitor

监控系统资源、进程状态、网络连接、服务健康状况。用于定期检查系统健康、排查故障、性能分析。

## 核心能力

- 内存和CPU使用情况检查
- 磁盘空间监控
- 关键进程状态检查
- 端口和服务监听检查
- 网络连接统计
- PM2 进程管理检查
- 定时健康检查报告

## 常用命令

### 内存和CPU使用情况

```bash
# 查看内存使用概览
free -h

# 实时监控CPU和内存
top -bn1 | head -20

# 更友好的系统资源视图
htop  # 需要安装

# 查看CPU信息
lscpu

# 负载平均值
cat /proc/loadavg
uptime
```

### 磁盘空间监控

```bash
# 查看磁盘使用情况
df -h

# 查看当前目录大小
du -sh /* 2>/dev/null | sort -hr | head -10

# 查看inode使用情况
df -i

# 检查大文件
find / -type f -size +100M 2>/dev/null | head -20
```

### 关键进程状态检查

```bash
# 查看所有进程
ps aux --sort=-%mem | head -20

# 查看特定进程
ps aux | grep -E "node|python|nginx"

# 进程树
pstree -p

# 查看僵尸进程
ps aux | awk '$8 ~ /Z/ {print}'
```

### 端口和服务监听检查

```bash
# 查看监听端口
ss -tlnp

# 查看所有网络连接
ss -tuln

# 使用netstat（如果可用）
netstat -tlnp

# 查看特定端口
ss -tlnp | grep -E ":80|:443|:3000|:8080"
```

### 网络连接统计

```bash
# 网络连接状态统计
ss -s

# 按状态分类的连接数
netstat -nat | awk '{print $6}' | sort | uniq -c | sort -rn

# 查看已建立的连接
ss -tn state established

# 网络接口流量
cat /proc/net/dev
```

### PM2 进程管理检查

```bash
# 查看PM2进程列表
pm2 list

# 详细进程信息
pm2 show 0

# 实时监控
pm2 monit

# 查看日志
pm2 logs --lines 50

# 检查进程状态
pm2 describe all | grep -E "status|restarts|uptime"
```

### 系统整体健康检查

```bash
# 系统概览
echo "=== System Health Report ===" && \
echo "Uptime: $(uptime -p)" && \
echo "Memory: $(free -h | grep Mem | awk '{print $3 "/" $2}')" && \
echo "Disk: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')" && \
echo "Load: $(cat /proc/loadavg | awk '{print $1 ", " $2 ", " $3}')"

# 快速健康检查脚本
#!/bin/bash
echo "=== System Monitor ==="
echo "Date: $(date)"
echo ""
echo "--- Memory ---"
free -h
echo ""
echo "--- Disk ---"
df -h | grep -E "^/dev|Filesystem"
echo ""
echo "--- Load ---"
uptime
echo ""
echo "--- Top Processes by Memory ---"
ps aux --sort=-%mem | head -6
echo ""
echo "--- Listening Ports ---"
ss -tlnp | head -10
```

## 最佳实践

1. **定期检查**: 建议每天至少检查一次系统状态，或使用cron定时任务自动报告

2. **设置告警阈值**:
   - 内存使用 > 80%
   - 磁盘使用 > 85%
   - CPU负载持续 > 核心数
   - 僵尸进程存在

3. **日志轮转**: 确保 `/var/log` 目录下的日志有轮转机制，避免占满磁盘

4. **进程守护**: 使用 PM2 或 systemd 管理关键服务，自动重启崩溃的进程

5. **网络监控**: 定期检查异常连接，特别是来自未知IP的连接

6. **资源清理**: 定期清理临时文件、缓存和旧日志

7. **文档记录**: 记录每个服务的预期资源使用情况，便于发现异常

## 快速诊断命令

```bash
# 一键健康检查
echo "=== $(hostname) Health Check ===" && \
echo "Time: $(date)" && \
echo "Uptime: $(uptime -p)" && \
echo "" && \
echo "Memory: $(free | grep Mem | awk '{printf "%.1f%% used (%s/%s)", $3/$2*100, $3, $2}')" && \
echo "Disk: $(df / | tail -1 | awk '{print $5 " used"}')" && \
echo "Load: $(cat /proc/loadavg | awk '{print $1}')" && \
echo "Processes: $(ps aux | wc -l)" && \
pm2 list 2>/dev/null | head -5
```
