---
name: health-monitor
description: 系统健康监控和告警工具。用于实时监控系统状态、性能指标、服务健康状况，当指标超过阈值时自动告警。适用于：(1) 服务器健康检查，(2) 服务可用性监控，(3) 性能指标追踪，(4) 告警通知，(5) 历史数据分析。
version: 1.0.0
author: OpenClaw Team
---

# Health Monitor

实时系统健康监控和告警工具。

## 核心能力

### 1. 实时监控

```bash
# 快速健康检查
./scripts/health-check.sh

# 持续监控模式
./scripts/health-check.sh --watch

# 详细报告
./scripts/health-check.sh --verbose
```

### 2. 监控指标

| 指标 | 正常范围 | 警告阈值 | 严重阈值 |
|------|----------|----------|----------|
| CPU 使用率 | < 50% | > 70% | > 90% |
| 内存使用率 | < 60% | > 80% | > 95% |
| 磁盘使用率 | < 70% | > 85% | > 95% |
| 负载 (per core) | < 0.7 | > 1.0 | > 2.0 |
| TCP 连接数 | < 1000 | > 5000 | > 10000 |

### 3. 服务健康检查

```bash
# 检查服务状态
./scripts/health-check.sh --services nginx,docker,openclaw

# 自定义端口检查
./scripts/health-check.sh --ports 3000,8080,5432

# HTTP 端点检查
./scripts/health-check.sh --endpoints "http://localhost:3000/health"
```

### 4. 告警配置

配置 `/root/.openclaw/workspace/bot6/skills/health-monitor/config/alerts.json`:

```json
{
  "alerts": [
    {
      "metric": "disk_usage",
      "threshold": 85,
      "severity": "warning",
      "message": "磁盘使用率超过 85%"
    },
    {
      "metric": "memory_usage",
      "threshold": 90,
      "severity": "critical",
      "message": "内存使用率超过 90%"
    }
  ],
  "notification": {
    "enabled": true,
    "channels": ["log", "webhook"]
  }
}
```

### 5. 监控脚本

运行 `scripts/monitor.sh` 进行持续监控：

```bash
# 后台运行监控
./scripts/monitor.sh --daemon

# 指定间隔 (秒)
./scripts/monitor.sh --interval 60

# 记录历史数据
./scripts/monitor.sh --history
```

## 使用示例

### 快速检查

```bash
cd /root/.openclaw/workspace/bot6/skills/health-monitor/scripts
./health-check.sh
```

输出示例:

```
╔═══════════════════════════════════════════════════════════╗
║              🔴 System Health Report                      ║
╚═══════════════════════════════════════════════════════════╝

⏰ 检查时间: 2026-03-17 03:50:00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 资源使用
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CPU:     ████████████░░░░░░░░░░░  45%  ✅ 正常
内存:    ██████████████████░░░░░  78%  ⚠️ 警告
磁盘:    ████████████████████░░░░  88%  ⚠️ 警告
负载:    1.25 (per core)          ⚠️ 警告

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔌 服务状态
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Docker:    ✅ 运行中
Nginx:     ✅ 运行中  
OpenClaw:  ✅ 运行中

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 网络状态
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESTABLISHED:  234
TIME_WAIT:    45
监听端口:     12

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 总体评估
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
状态: ⚠️ 需要关注

建议:
- 磁盘使用率接近 85%，建议清理
- 内存使用率偏高，监控进程

╔═══════════════════════════════════════════════════════════╗
║                 健康评分: 72/100                            ║
╚═══════════════════════════════════════════════════════════╝
```

### 持续监控

```bash
# 每分钟检查一次，写入日志
./monitor.sh --interval 60 --log

# 后台运行
nohup ./monitor.sh --daemon > /var/log/health-monitor.log 2>&1 &
```

## 定时任务配置

添加 crontab 监控任务:

```bash
crontab -e

# 每 5 分钟健康检查
*/5 * * * * /root/.openclaw/workspace/bot6/skills/health-monitor/scripts/health-check.sh --quiet

# 每小时发送健康报告
0 * * * * /root/.openclaw/workspace/bot6/skills/health-monitor/scripts/health-check.sh --report
```

## 历史数据

监控数据保存在:

- 每日报告: `logs/daily-YYYY-MM-DD.log`
- 告警历史: `logs/alerts.log`
- 指标趋势: `data/metrics.json`

## 最佳实践

1. **定期检查** - 设置 crontab 定时任务
2. **及时告警** - 配置 webhook 通知
3. **历史分析** - 定期查看趋势数据
4. **阈值调优** - 根据实际业务调整阈值
5. **备份配置** - 定期备份告警配置
