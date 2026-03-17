---
name: log-analyzer
description: 日志分析和异常检测工具。当需要分析系统日志、应用日志、错误追踪、性能问题诊断、安全事件分析时使用。适用于：(1) 错误日志分析，(2) 性能瓶颈定位，(3) 安全事件检测，(4) 趋势分析，(5) 自动报警。
version: 1.0.0
author: OpenClaw Team
---

# Log Analyzer

智能日志分析和异常检测工具。

## 核心能力

### 1. 日志收集

支持多种日志源：

```bash
# 系统日志
/var/log/syslog
/var/log/messages
/var/log/kern.log

# 应用日志
/var/log/nginx/*.log
/var/log/pm2/*.log
~/.pm2/logs/*.log

# OpenClaw 日志
/root/.openclaw/logs/*.log

# Docker 日志
docker logs <container>
```

### 2. 错误检测

自动识别常见错误模式：

- `[ERROR]` / `[ERR]` / `ERROR:`
- `[FATAL]` / `[CRITICAL]`
- `Exception` / `Traceback`
- `Failed to` / `Cannot`
- `Timeout` / `ETIMEDOUT`
- `Connection refused` / `ECONNREFUSED`
- `Out of memory` / `ENOMEM`

### 3. 分析脚本

运行 `scripts/analyze.sh` 进行日志分析：

```bash
# 分析最近1小时的日志
./scripts/analyze.sh --since "1 hour ago"

# 分析特定服务的日志
./scripts/analyze.sh --service nginx

# 分析错误级别日志
./scripts/analyze.sh --level error

# 输出 JSON 格式
./scripts/analyze.sh --format json
```

## 使用方法

### 快速分析

```bash
# 分析 OpenClaw 日志中的错误
grep -E "(ERROR|FATAL|Exception)" /root/.openclaw/logs/*.log | tail -50

# 统计错误类型
grep -E "ERROR" /root/.openclaw/logs/*.log | awk '{print $NF}' | sort | uniq -c | sort -rn

# 查找最近5分钟的异常
find /var/log -name "*.log" -mmin -5 -exec grep -l "error\|exception\|fatal" {} \;
```

### 性能分析

```bash
# 查找慢请求 (>1s)
grep -E "took [0-9]{4,}ms" /root/.openclaw/logs/*.log

# API 响应时间分析
awk '/response time/ {print $NF}' /var/log/nginx/access.log | awk '{sum+=$1; count++} END {print "avg:", sum/count, "ms"}'
```

### 安全分析

```bash
# 检测失败登录
grep "Failed password" /var/log/auth.log | tail -20

# 检测异常访问
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10

# 检测 4xx/5xx 错误
awk '$9 ~ /^[45]/ {print $9}' /var/log/nginx/access.log | sort | uniq -c
```

## 分析报告格式

```markdown
## 📊 日志分析报告

### 概览
- 分析时间范围: 2024-01-15 10:00 - 11:00
- 总日志条目: 15,234
- 错误数量: 23
- 警告数量: 156

### 🔴 错误摘要 (Top 5)
1. `Connection refused` - 12 次
2. `Timeout waiting for response` - 6 次
3. `ENOENT: no such file` - 3 次
4. `Memory limit exceeded` - 1 次
5. `SSL handshake failed` - 1 次

### ⚠️ 警告摘要
- 依赖版本过时: 5 个
- 磁盘空间不足: 3 次
- 重试操作: 148 次

### 📈 趋势分析
- 错误率: 0.15% (正常 < 1%)
- 响应时间: 平均 245ms (正常 < 500ms)
- 内存使用: 稳定

### 💡 建议
1. 检查网络连接配置 (Connection refused 频繁)
2. 增加超时时间或优化慢查询
3. 更新过时的依赖包
```

## 实时监控

```bash
# 实时监控错误日志
tail -f /root/.openclaw/logs/*.log | grep --line-buffered -E "(ERROR|FATAL)"

# 实时统计
tail -f /var/log/nginx/access.log | awk '{print $9}' | sort | uniq -c
```

## 报警规则

配置报警阈值：

| 指标 | 警告阈值 | 严重阈值 |
|------|----------|----------|
| 错误率 | > 1% | > 5% |
| 响应时间 | > 500ms | > 2000ms |
| 5xx 错误 | > 10/min | > 50/min |
| 失败登录 | > 5/min | > 20/min |

## 日志轮转建议

```bash
# /etc/logrotate.d/openclaw
/root/.openclaw/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
}
```

## 最佳实践

1. **定期分析** - 每天检查错误日志
2. **设置报警** - 关键错误及时通知
3. **保留历史** - 至少保留7天日志
4. **结构化日志** - 使用 JSON 格式便于分析
5. **敏感信息** - 日志中避免记录密码等敏感数据
