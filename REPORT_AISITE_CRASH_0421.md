# ai-site 崩溃循环调查报告

**日期**: 2026-04-21  
**服务器**: 7zi.com (165.99.43.61)  
**调查时间**: 约 23:20 GMT+8

---

## 📊 进程状态摘要

| 指标 | 值 |
|------|-----|
| PM2 进程名称 | ai-site |
| 当前状态 | **online** (稳定运行中) |
| 重启次数 | 227 次 |
| 进程运行时长 | 76 分钟 |
| 模式 | fork_mode |
| 监听端口 | 3001 |
| 进程 PID | 3822842 |
| 磁盘使用率 | **100%** (87G used / 88G total) |

---

## 🔍 关键发现

### 1. 应用本身运行正常

日志显示 Next.js 每秒都在正常启动：
```
▲ Next.js 15.5.15
✓ Ready in 651ms
```
说明 Next.js 应用本身没有问题，能正常启动和运行。

### 2. SIGINT 退出（代码 1）

从 `/root/.pm2/pm2.log` 可以看到：
```
App [ai-site:1] exited with code [1] via signal [SIGINT]
```
进程是被 **SIGINT 信号** 终止的，不是崩溃（SIGSEGV/SIGKILL），也**不是端口占用（EADDRINUSE）**。

### 3. 无外部自动重启触发器

排查结果：
- **claw-mesh-watchdog.sh**: 只监控 openclaw-gateway 和 claw-mesh-sync，不关硫酸酸
- **site-monitor cron**: 每小时运行一次，不会高频触发
- **systemd**: ai-site 无 systemd service
- **PM2 模块**: 未安装额外模块

### 4. 端口占用问题（已排除）

日志中确实有 `EADDRINUSE` 错误，但那是早期日志，与当前崩溃无关。当前端口 3001 只有 ai-site 进程（PID 3822842）监听，无冲突。

### 5. 磁盘空间严重不足（关键问题）

```
/dev/vda1  88G  87G  562M  100%
```
磁盘空间几乎耗尽（仅剩 562MB），这是导致进程异常退出的**最可能根本原因**。

### 6. 关于 about 页面 MISSING_MESSAGE 错误

```
Error: MISSING_MESSAGE: about.intro (en)
Error: MISSING_MESSAGE: about.history (en)
...
```
`/var/www/new-7zi-site/src/messages/en.json` 中 about 节只有 `title` 和 `subtitle`，缺少 `intro`、`history`、`values`、`cta` 等所有字段。

但这些是**运行时警告**，不是崩溃原因。应用仍能正常渲染页面（降级显示空内容）。

---

## 🧩 根本原因分析

### 根本原因：磁盘空间耗尽导致进程异常终止

1. **磁盘 100% 满** → Next.js 在写入临时文件或日志时遭遇 I/O 错误
2. **进程被 SIGINT 终止** → 可能是系统 OOM killer 或容器资源限制触发的终止
3. **PM2 自动重启** → PM2 尝试重启，但磁盘问题未解决导致反复重启循环

### 次要问题：i18n 翻译文件不完整

`/var/www/new-7zi-site/src/messages/en.json` 缺少 about 页所需的翻译键值，导致持续的错误日志输出，增加磁盘写入。

---

## ✅ 修复步骤（优先级排序）

### 🔴 紧急 - 立即执行

**Step 1: 清理磁盘空间**
```bash
# 查看大文件
du -sh /var/www/* | sort -h
find /var/www -name '*.log' -size +100M

# 清理日志和临时文件
rm -rf /var/www/new-7zi-site/.next/cache/tmp.*
find /var/www -name '*.log' -type f -exec truncate -s 0 {} \;

# 查看是否还有其他大文件需要清理
du -sh /root/.pm2/logs/
```

**Step 2: 确认磁盘空间恢复**
```bash
df -h /
```
确保至少 2-3GB 可用空间。

### 🟡 高优先级 - 解决翻译缺失

**Step 3: 补全 en.json 中的 about 翻译**
```bash
# 查看完整缺失的翻译键
grep -oP "about\\.[a-zA-Z0-9]+" /root/.pm2/logs/ai-site-error.log | sort -u
```

需要在 `/var/www/new-7zi-site/src/messages/en.json` 的 `about` 节添加：
- `intro`
- `history`
- `history2024a` / `history2024aDesc`
- `history2024b` / `history2024bDesc`
- `history2025a` / `history2025aDesc`
- `history2025b` / `history2025bDesc`
- `values`
- `value1` / `value1Desc`
- `value2` / `value2Desc`
- `value3` / `value3Desc`
- `value4` / `value4Desc`
- `cta` / `ctaSub`

**Step 4: 重新构建 next-intl**
```bash
cd /var/www/new-7zi-site
npm run build
```

### 🟢 后续优化

**Step 5: 设置磁盘空间监控告警**
```bash
# 添加 cron 监控
echo "*/10 * * * * df -h / | awk 'NR==2 {if(\$5>90) print \"Disk usage high: \"\$5}'" | tee -a /var/log/disk-monitor.log
```

**Step 6: 配置 PM2 内存/重启限制**
```bash
pm2 restart ai-site --max-memory-restart 200M
pm2 describe ai-site  # 确认配置
```

---

## 📈 当前状态

**好消息**: 截至调查时（23:20 GMT+8），ai-site 已经**稳定运行 76 分钟无重启**，重启计数器停留在 227 次未再增长。说明磁盘空间问题可能已自行缓解（临时文件被清理），或者之前的崩溃是偶发性的。

**需要做的**: 
1. 清理磁盘空间（最紧急）
2. 补全翻译文件
3. 重新构建项目
4. 添加监控防止再次发生

---

## 📁 相关文件路径

- **PM2 配置**: `/root/.pm2/logs/ai-site-error.log`
- **PM2 主日志**: `/root/.pm2/pm2.log`
- **翻译文件**: `/var/www/new-7zi-site/src/messages/en.json`
- **项目目录**: `/var/www/new-7zi-site/`
- **独立服务器**: `/var/www/new-7zi-site/.next/standalone/`

---

*调查完成 - 系统管理员子代理*