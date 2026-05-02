# 生产环境健康检查自动化系统报告

**版本:** v1.140
**日期:** 2026-04-05
**作者:** 🛡️ 系统管理员 子代理
**目标服务器:** 7zi.com (165.99.43.61)

---

## 📋 目录

1. [概述](#概述)
2. [系统架构](#系统架构)
3. [检查项详解](#检查项详解)
4. [告警机制](#告警机制)
5. [部署指南](#部署指南)
6. [使用说明](#使用说明)
7. [维护建议](#维护建议)
8. [故障排查](#故障排查)

---

## 概述

### 目标

建立生产环境（7zi.com）的自动化健康检查和告警系统，确保服务稳定运行，及时发现和处理异常情况。

### 核心功能

- ✅ 自动化健康检查（每 5 分钟）
- ✅ 多维度系统监控
- ✅ 基于退出码的告警机制
- ✅ 详细的检查日志
- ✅ 可配置的告警阈值
- ✅ 历史记录追踪

### 检查范围

| 检查项 | 说明 | 重要性 |
|--------|------|--------|
| 网站访问 | HTTP 响应、响应时间、SSL 证书 | 🔴 关键 |
| Nginx | 服务状态、配置有效性、进程数 | 🔴 关键 |
| PM2 | 进程状态、异常检测、重启次数 | 🔴 关键 |
| Docker | 容器状态、异常退出、磁盘使用 | 🟡 重要 |
| 磁盘空间 | 使用率、Inode 使用情况 | 🔴 关键 |
| 内存使用 | 内存使用率、Swap 使用 | 🔴 关键 |
| 系统负载 | 1/5/15 分钟负载 | 🟡 重要 |

---

## 系统架构

### 文件结构

```
/root/.openclaw/workspace/
├── scripts/
│   └── health-check.sh          # 健康检查主脚本
├── cron/
│   └── health-check-cron.json   # Cron 配置文件
└── logs/
    └── health-check/            # 检查日志目录
        └── health-check-YYYYMMDD-HHMMSS.log
```

### 工作流程

```
┌─────────────┐
│  Cron 触发  │ (每 5 分钟)
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ 执行健康检查    │
│ - 网站访问      │
│ - Nginx 状态    │
│ - PM2 进程      │
│ - Docker 容器   │
│ - 磁盘空间      │
│ - 内存使用      │
│ - 系统负载      │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ 生成检查报告    │
│ - 记录日志      │
│ - 统计结果      │
│ - 生成汇总      │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ 退出码判断      │
│ 0 = 健康        │
│ 1 = 警告        │
│ 2 = 异常        │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ 触发告警（如需）│
│ - Telegram 通知 │
│ - 记录历史      │
└─────────────────┘
```

---

## 检查项详解

### 1. 网站访问检查

**检查内容:**
- HTTP 响应码（期望 200/301/302）
- 响应时间（期望 < 5s）
- SSL 证书有效性

**告警阈值:**
- 响应时间 > 5s: 警告
- 响应时间 > 10s: 异常
- 非 2xx/3xx 响应: 异常

**实现方式:**
```bash
curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$SERVER_URL"
curl -s -o /dev/null -w "%{time_total}" --max-time 10 "$SERVER_URL"
openssl s_client -servername 7zi.com -connect 7zi.com:443
```

---

### 2. Nginx 服务检查

**检查内容:**
- 服务状态（active/inactive）
- 配置文件有效性
- 主进程数量

**告警阈值:**
- 服务未运行: 异常
- 配置无效: 异常
- 无主进程: 异常

**实现方式:**
```bash
ssh root@7zi.com "systemctl is-active nginx"
ssh root@7zi.com "nginx -t"
ssh root@7zi.com "ps aux | grep 'nginx: master'"
```

---

### 3. PM2 进程检查

**检查内容:**
- 在线进程数量
- 异常进程数量
- 总重启次数

**告警阈值:**
- 无在线进程: 异常
- 有错误进程: 异常
- 重启次数 > 10: 警告

**实现方式:**
```bash
ssh root@7zi.com "pm2 list"
ssh root@7zi.com "pm2 jlist | jq -r '[.[].pm2_env.restart_time] | add'"
```

---

### 4. Docker 容器检查

**检查内容:**
- 运行中容器数量
- 异常退出容器数量
- Docker 磁盘使用

**告警阈值:**
- 有异常退出容器: 警告

**实现方式:**
```bash
ssh root@7zi.com "docker ps -q | wc -l"
ssh root@7zi.com "docker ps -a --filter 'status=exited' -q | wc -l"
ssh root@7zi.com "docker system df"
```

---

### 5. 磁盘空间检查

**检查内容:**
- 根分区使用率
- Inode 使用率

**告警阈值:**
- 使用率 > 90%: 异常
- 使用率 > 95%: 严重异常
- Inode > 90%: 警告

**实现方式:**
```bash
ssh root@7zi.com "df -h / | awk 'NR==2 {print \$5}'"
ssh root@7zi.com "df -i / | awk 'NR==2 {print \$5}'"
```

---

### 6. 内存使用检查

**检查内容:**
- 内存使用率
- Swap 使用率

**告警阈值:**
- 内存使用率 > 90%: 异常
- 内存使用率 > 95%: 严重异常
- Swap 使用率 > 80%: 异常

**实现方式:**
```bash
ssh root@7zi.com "free | awk 'NR==2 {print \$2,\$7}'"
ssh root@7zi.com "free | awk 'NR==3 {print \$3,\$2}'"
```

---

### 7. 系统负载检查

**检查内容:**
- 1 分钟负载
- 5 分钟负载
- 15 分钟负载

**告警阈值:**
- 负载 > CPU 核心数: 警告
- 负载 > CPU 核心数 × 2: 异常

**实现方式:**
```bash
ssh root@7zi.com "uptime | awk -F'load average:' '{print \$2}'"
ssh root@7zi.com "nproc"
```

---

## 告警机制

### 退出码定义

| 退出码 | 含义 | 说明 |
|--------|------|------|
| 0 | 健康 | 所有检查通过，无警告 |
| 1 | 警告 | 有警告项，但无严重问题 |
| 2 | 异常 | 有严重问题需要立即处理 |

### 告警触发条件

**立即告警（退出码 2）:**
- 网站无法访问
- Nginx 服务未运行
- PM2 无在线进程
- 磁盘使用率 > 95%
- 内存使用率 > 95%
- 系统负载严重过高

**警告告警（退出码 1）:**
- 网站响应时间较慢
- PM2 重启次数较多
- Docker 容器异常退出
- 磁盘使用率 > 90%
- 内存使用率 > 90%
- 系统负载较高

### 告警配置

```json
{
  "alert": {
    "onFailure": true,
    "onWarning": false,
    "channels": ["telegram"]
  },
  "settings": {
    "timeout": 300,
    "retryOnFailure": 2,
    "retryDelay": 60,
    "alertCooldown": 300,
    "alertAfterConsecutiveFailures": 2
  }
}
```

**配置说明:**
- `onFailure`: 失败时是否告警
- `onWarning`: 警告时是否告警
- `channels`: 告警渠道（Telegram）
- `timeout`: 超时时间（秒）
- `retryOnFailure`: 失败重试次数
- `retryDelay`: 重试延迟（秒）
- `alertCooldown`: 告警冷却时间（秒）
- `alertAfterConsecutiveFailures`: 连续失败多少次后告警

---

## 部署指南

### 前置要求

1. **服务器要求:**
   - Ubuntu/Debian Linux
   - SSH 访问权限
   - 已安装: Nginx, PM2, Docker（可选）

2. **本地要求:**
   - Bash shell
   - curl, openssl, bc
   - sshpass（用于 SSH 自动登录）

### 安装步骤

#### 1. 安装依赖

```bash
# 安装基础工具
apt-get update
apt-get install -y curl openssl bc sshpass jq

# 验证安装
curl --version
openssl version
bc --version
sshpass -V
jq --version
```

#### 2. 部署脚本

```bash
# 复制脚本到服务器
scp /root/.openclaw/workspace/scripts/health-check.sh root@7zi.com:/usr/local/bin/

# 设置执行权限
ssh root@7zi.com "chmod +x /usr/local/bin/health-check.sh"
```

#### 3. 配置 Cron

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每 5 分钟执行一次）
*/5 * * * * /usr/local/bin/health-check.sh >> /var/log/health-check.log 2>&1

# 保存并退出
```

#### 4. 配置日志轮转

```bash
# 创建 logrotate 配置
cat > /etc/logrotate.d/health-check << EOF
/var/log/health-check.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
EOF
```

#### 5. 测试运行

```bash
# 手动执行测试
/usr/local/bin/health-check.sh

# 检查退出码
echo $?

# 查看日志
tail -f /var/log/health-check.log
```

---

## 使用说明

### 手动执行

```bash
# 执行健康检查
/root/.openclaw/workspace/scripts/health-check.sh

# 查看最新日志
ls -lt /root/.openclaw/workspace/logs/health-check/ | head -5

# 查看特定日志
cat /root/.openclaw/workspace/logs/health-check/health-check-20260405-112600.log
```

### 查看历史记录

```bash
# 查看所有日志
ls -lh /root/.openclaw/workspace/logs/health-check/

# 查看最近 7 天的日志
find /root/.openclaw/workspace/logs/health-check/ -name "*.log" -mtime -7

# 统计失败次数
grep -r "系统状态: 异常" /root/.openclaw/workspace/logs/health-check/ | wc -l
```

### 修改检查阈值

编辑脚本中的配置变量:

```bash
# 编辑脚本
vim /root/.openclaw/workspace/scripts/health-check.sh

# 修改阈值
ALERT_THRESHOLD_DISK=90      # 磁盘使用率告警阈值 (%)
ALERT_THRESHOLD_MEMORY=90    # 内存使用率告警阈值 (%)
SERVER_IP="165.99.43.61"      # 服务器 IP
SERVER_URL="https://7zi.com"  # 网站 URL
```

### 添加自定义检查

在脚本中添加新的检查函数:

```bash
check_custom() {
    log "INFO" "=== 检查自定义项 ==="

    # 你的检查逻辑
    local result=$(your_check_command)

    if [ "$result" = "expected" ]; then
        record_check "PASS" "自定义检查" "通过"
    else
        record_check "FAIL" "自定义检查" "失败: $result"
    fi
}

# 在 main() 函数中调用
main() {
    # ... 其他检查
    check_custom
    # ...
}
```

---

## 维护建议

### 定期维护任务

#### 每日
- 检查健康检查日志
- 关注告警信息
- 验证系统状态

#### 每周
- 清理旧日志文件
- 检查磁盘空间
- 审查告警阈值

#### 每月
- 更新检查脚本
- 优化检查逻辑
- 审查告警配置

### 日志管理

```bash
# 清理 30 天前的日志
find /root/.openclaw/workspace/logs/health-check/ -name "*.log" -mtime +30 -delete

# 压缩旧日志
find /root/.openclaw/workspace/logs/health-check/ -name "*.log" -mtime +7 -exec gzip {} \;

# 查看日志大小
du -sh /root/.openclaw/workspace/logs/health-check/
```

### 性能优化

1. **减少 SSH 连接次数:**
   - 合并多个检查到一个 SSH 连接
   - 使用 SSH 连接复用

2. **优化检查频率:**
   - 根据实际需求调整 cron 表达式
   - 非关键检查可以降低频率

3. **缓存检查结果:**
   - 对于变化不频繁的指标，可以缓存结果
   - 减少不必要的重复检查

---

## 故障排查

### 常见问题

#### 1. SSH 连接失败

**症状:**
```
ssh: connect to host 165.99.43.61 port 22: Connection refused
```

**解决方案:**
```bash
# 检查 SSH 服务
ssh root@7zi.com "systemctl status sshd"

# 检查防火墙
ssh root@7zi.com "ufw status"

# 检查网络连接
ping 165.99.43.61
```

#### 2. 密码认证失败

**症状:**
```
Permission denied, please try again.
```

**解决方案:**
```bash
# 确认密码正确（注意 $ 符号需要转义）
sshpass -p 'ge20993344$ZZ' ssh root@7zi.com "echo 'OK'"

# 或使用 SSH 密钥认证
ssh-copy-id root@7zi.com
```

#### 3. PM2 命令未找到

**症状:**
```
pm2: command not found
```

**解决方案:**
```bash
# 安装 PM2
ssh root@7zi.com "npm install -g pm2"

# 或使用完整路径
ssh root@7zi.com "/usr/local/bin/pm2 list"
```

#### 4. Docker 未运行

**症状:**
```
Cannot connect to the Docker daemon
```

**解决方案:**
```bash
# 启动 Docker
ssh root@7zi.com "systemctl start docker"

# 设置开机自启
ssh root@7zi.com "systemctl enable docker"
```

#### 5. 磁盘空间不足

**症状:**
```
磁盘空间: 使用率: 98% (严重告警)
```

**解决方案:**
```bash
# 查找大文件
ssh root@7zi.com "du -sh /* | sort -rh | head -10"

# 清理日志
ssh root@7zi.com "journalctl --vacuum-time=7d"

# 清理 Docker
ssh root@7zi.com "docker system prune -a"
```

### 调试模式

启用详细日志输出:

```bash
# 编辑脚本，在开头添加
set -x

# 或使用 bash 调试模式
bash -x /root/.openclaw/workspace/scripts/health-check.sh
```

### 检查脚本语法

```bash
# 检查语法错误
bash -n /root/.openclaw/workspace/scripts/health-check.sh

# 检查 ShellCheck（需要安装）
shellcheck /root/.openclaw/workspace/scripts/health-check.sh
```

---

## 附录

### A. Cron 表达式参考

| 表达式 | 说明 |
|--------|------|
| `*/5 * * * *` | 每 5 分钟 |
| `0 * * * *` | 每小时 |
| `0 */2 * * *` | 每 2 小时 |
| `0 0 * * *` | 每天午夜 |
| `0 0 * * 0` | 每周午夜 |
| `0 0 1 * *` | 每月 1 号午夜 |

### B. 退出码参考

| 退出码 | 含义 | 处理建议 |
|--------|------|----------|
| 0 | 健康 | 无需处理 |
| 1 | 警告 | 关注并监控 |
| 2 | 异常 | 立即处理 |
| 126 | 命令不可执行 | 检查脚本权限 |
| 127 | 命令未找到 | 检查依赖安装 |
| 130 | Ctrl+C 中断 | 正常中断 |

### C. 联系方式

- **技术支持:** 🛡️ 系统管理员 子代理
- **报告日期:** 2026-04-05
- **版本:** v1.140

---

## 更新日志

### v1.140 (2026-04-05)
- ✅ 初始版本发布
- ✅ 实现所有核心检查项
- ✅ 配置告警机制
- ✅ 生成详细报告

---

**报告结束**