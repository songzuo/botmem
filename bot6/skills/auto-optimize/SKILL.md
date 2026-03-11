---
name: auto-optimize
description: 自动优化系统性能和资源管理。当需要清理缓存、优化磁盘空间、管理系统资源、监控性能、清理日志文件时使用。适用于：(1) 磁盘空间不足警告，(2) 系统响应缓慢，(3) 定期维护任务，(4) 资源使用分析，(5) 自动清理任务。
---

# Auto Optimize

自动优化系统性能和资源管理技能。

## 核心能力

### 1. 磁盘空间优化

```bash
# 检查磁盘使用情况
df -h

# 查找大文件 (>100MB)
find / -type f -size +100M 2>/dev/null | head -20

# 清理包管理器缓存
npm cache clean --force
yarn cache clean
pnpm store prune

# 清理系统缓存
rm -rf /tmp/*
rm -rf ~/.cache/*
```

### 2. 日志清理

```bash
# 查找大日志文件
find /var/log -type f -name "*.log" -size +10M

# 截断日志文件
truncate -s 0 /var/log/*.log

# 压缩旧日志
find /var/log -name "*.log" -mtime +7 -exec gzip {} \;

# journalctl 清理
journalctl --vacuum-time=3d
```

### 3. Node.js 项目优化

```bash
# 清理 node_modules 并重装
rm -rf node_modules package-lock.json
npm install

# 清理构建缓存
rm -rf .next dist build

# 检查依赖更新
npm outdated
npx npm-check-updates -u
```

### 4. Docker 清理

```bash
# 清理未使用的镜像
docker image prune -a

# 清理停止的容器
docker container prune

# 清理未使用的卷
docker volume prune

# 完整清理
docker system prune -a --volumes
```

### 5. 内存管理

```bash
# 查看内存使用
free -h

# 清理页面缓存
sync && echo 3 > /proc/sys/vm/drop_caches

# 查看进程内存
ps aux --sort=-%mem | head -10
```

## 快速诊断脚本

运行 `scripts/diagnose.sh` 进行系统诊断：

```bash
./scripts/diagnose.sh
```

输出包括：
- 磁盘使用率
- 内存使用率
- CPU 负载
- 大文件列表
- 日志文件大小

## 自动化维护

设置定时任务进行定期清理：

```bash
# 编辑 crontab
crontab -e

# 每天凌晨3点清理
0 3 * * * /path/to/scripts/daily_cleanup.sh
```

## 最佳实践

1. **清理前备份** - 重要数据先备份
2. **逐步清理** - 先检查再删除
3. **日志保留** - 保留最近7天日志
4. **监控阈值** - 磁盘 >80% 时警告
5. **测试环境** - 新清理脚本先在测试环境验证