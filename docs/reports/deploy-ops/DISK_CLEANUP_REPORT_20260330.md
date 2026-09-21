# 7zi.com 磁盘清理报告

**生成时间**: 2026-03-30
**服务器**: 165.99.43.61 (7zi.com)
**报告人**: 🛡️ 系统管理员

---

## 📊 当前磁盘使用情况

```
Filesystem      Size  Used Avail Use% Mounted on
/dev/vda1        88G   72G   16G  82% /
```

**状态**: ⚠️ 警告 - 磁盘使用率达到 82%，需要清理以避免系统问题

---

## 🔍 空间占用分析

### 1. Docker 资源 (可清理 ~27.2GB)

| 类型 | 大小 | 可回收 | 回收比例 |
|------|------|--------|----------|
| Images | 13.64GB | 13.55GB | 99% |
| Build Cache | 13.6GB | 13.6GB | 100% |
| Local Volumes | 249MB | 249MB | 100% |
| **总计** | **27.5GB** | **27.2GB** | **99%** |

**说明**: Docker 构建缓存和未使用的镜像占用大量空间，可安全清理。

---

### 2. 系统日志 (~2GB)

| 路径 | 大小 | 建议操作 |
|------|------|----------|
| /var/log/journal | 1.8GB | 清理旧日志 |
| /var/log/syslog.1 | 122M | 保留近期，清理旧版 |
| /var/log/syslog | 23M | 保留 |
| /var/log/openclaw-agent | 89M | 保留最近7天 |
| /var/log/btmp | 22M | 可清理 |
| /var/log/picoclaw.log | 21M | 保留 |

**Nginx 日志**: 总计 3.6M（已自动压缩，无需清理）

---

### 3. 缓存和临时文件 (~2.9GB)

| 路径 | 大小 | 建议操作 |
|------|------|----------|
| /var/cache/apt | 490M | 可清理 |
| /tmp | 374M | 可清理（重启后自动清除） |
| /var/tmp | 56K | 可清理 |

---

### 4. 大型单个文件 (>100MB)

| 文件路径 | 大小 | 说明 |
|----------|------|------|
| /root/.cache/ms-playwright/chromium-1140/chrome-linux/chrome | 394M | Playwright 旧版缓存 |
| /root/7zi-project/.git/objects/pack/pack-08d6936c8c2332a8f051f817924c9477911fbc71.pack | 272M | Git 大文件包 |
| /root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome | 258M | Playwright 缓存 |
| /root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell | 176M | Playwright 缓存 |
| /root/.openclaw/workspace/.git/objects/pack/pack-1b049ce4f303955555aeb063375e214fdbbddabd.pack | 148M | Git 大文件包 |
| /root/7zi-project/.git/objects/04/d9bfa28ea2242cf3a1c655d02acaac3b09c7fb | 148M | Git 大文件 |
| /root/7zi-project/node_modules/@next/swc-linux-x64-musl/next-swc.linux-x64-musl.node | 125M | Next.js 编译器 |
| /root/7zi-project/node_modules/@next/swc-linux-x64-gnu/next-swc.linux-x64-gnu.node | 125M | Next.js 编译器 |
| /root/.nvm/versions/node/v22.22.0/bin/node | 118M | Node.js 运行时 |
| /root/.opencode/bin/opencode | 139M | OpenCode 工具 |
| /root/.amp/bin/amp | 115M | AMP 工具 |

---

### 5. Next.js 构建目录 (263.5MB)

| 路径 | 大小 | 说明 |
|------|------|------|
| /var/www/7zi/.next | 139M | 生产构建 |
| /root/7zi-project/.next | 57M | 开发构建 |
| /var/www/ai-dashboard/.next | 48M | AI 面板构建 |
| /var/www/7zi/.next/standalone/.next | 18M | 独立部署构建 |
| /var/www/7zi/7zi-project/.next | 8.8M | 项目构建 |
| /var/www/7zi/7zi-project/.next/standalone/.next | 1.7M | 独立部署构建 |

---

### 6. 归档文件 (58.5MB)

| 文件 | 大小 | 建议 |
|------|------|------|
| /root/clawmail-deploy.tar.gz | 26M | 如已部署可删除 |
| /root/clawmail.tar.gz | 26M | 如已部署可删除 |
| /root/open.tar | 4.0M | 确认用途后决定 |
| /root/nong.rar | 2.5M | 确认用途后决定 |

---

## 🧹 清理建议（按优先级排序）

### 🔴 高优先级（立即执行，预计回收 ~28GB）

#### 1. 清理 Docker 资源 (~27.2GB)

```bash
# SSH 到服务器
ssh root@165.99.43.61

# 清理未使用的镜像、容器、网络、构建缓存
docker system prune -a --volumes

# 或者分步清理：
# 清理构建缓存（最大收益）
docker builder prune -af

# 清理未使用的镜像
docker image prune -af

# 清理未使用的卷
docker volume prune -f
```

**预期收益**: 27.2GB
**风险**: 低 - 只删除未使用的资源

---

#### 2. 清理系统日志 (~2GB)

```bash
# 清理旧的 journal 日志（保留最近7天）
journalctl --vacuum-time=7d

# 清理旧的压缩日志文件
find /var/log -name "*.gz" -mtime +30 -delete

# 清理 btmp（登录失败记录，保留1个月）
rm /var/log/btmp
touch /var/log/btmp
chmod 600 /var/log/btmp
```

**预期收益**: ~2GB
**风险**: 低 - 保留重要日志

---

### 🟡 中优先级（建议执行，预计回收 ~900MB）

#### 3. 清理 Playwright 缓存 (~828MB)

```bash
# 删除旧版本 Playwright 缓存
rm -rf /root/.cache/ms-playwright/chromium-1140
rm -rf /root/.cache/ms-playwright/chromium_headless_shell-1208

# 重新安装当前版本（如需要）
cd /root/7zi-project && npx playwright install chromium
```

**预期收益**: 828MB
**风险**: 低 - 旧版本缓存，可重新下载

---

#### 4. 清理 APT 缓存 (~490MB)

```bash
# 清理已下载的软件包
apt-get clean
apt-get autoclean
apt-get autoremove -y
```

**预期收益**: 490MB
**风险**: 低 - 软件包可重新下载

---

#### 5. 清理临时文件 (~374MB)

```bash
# 清理 /tmp 中的旧文件（保留7天）
find /tmp -type f -mtime +7 -delete
find /tmp -type d -empty -delete

# 清理 /var/tmp（保留7天）
find /var/tmp -type f -mtime +7 -delete
```

**预期收益**: 374MB
**风险**: 低 - 临时文件

---

### 🟢 低优先级（谨慎执行，预计回收 ~58MB）

#### 6. 删除已部署的归档文件 (~58MB)

```bash
# 确认 clawmail 已部署后删除旧归档
rm /root/clawmail-deploy.tar.gz
rm /root/clawmail.tar.gz

# 删除其他归档（确认不再需要）
rm /root/open.tar
rm /root/nong.rar
```

**预期收益**: 58MB
**风险**: 中 - 确认文件不再需要

---

#### 7. 清理重复的 .next 构建目录 (~139MB)

```bash
# /root/7zi-project/.next 是开发构建，可清理
rm -rf /root/7zi-project/.next

# 如有多个相同项目，保留生产版本即可
```

**预期收益**: 57-139MB
**风险**: 中 - 确认不会影响开发

---

## 📈 清理效果预估

| 清理项 | 预期回收 | 执行时间 | 风险等级 |
|--------|----------|----------|----------|
| Docker 资源 | 27.2GB | 2-5分钟 | 低 |
| 系统日志 | 2GB | 1-2分钟 | 低 |
| Playwright 缓存 | 828MB | 1分钟 | 低 |
| APT 缓存 | 490MB | 1分钟 | 低 |
| 临时文件 | 374MB | 1分钟 | 低 |
| 归档文件 | 58MB | <1分钟 | 中 |
| .next 构建 | 57-139MB | <1分钟 | 中 |
| **总计** | **~30-31GB** | **~10分钟** | **低-中** |

**清理后预计磁盘使用率**: 82% → ~48%

---

## ⚙️ 预防性建议

### 1. 定期清理任务

设置 cron 定期清理：

```bash
# 编辑 crontab
crontab -e

# 添加以下任务：
# 每周日凌晨 2 点清理 Docker
0 2 * * 0 docker system prune -af --volumes > /dev/null 2>&1

# 每周一清理日志（保留30天）
0 2 * * 1 journalctl --vacuum-time=30d && find /var/log -name "*.gz" -mtime +30 -delete

# 每月清理缓存
0 2 1 * * apt-get clean && apt-get autoclean
```

---

### 2. 日志轮转配置

检查并优化 `/etc/logrotate.conf`：

```conf
# 压缩日志更频繁
compress
delaycompress

# 保留更少的历史
rotate 4
```

---

### 3. Docker 镜像管理

```bash
# 设置 Docker 日志大小限制
sudo vi /etc/docker/daemon.json

{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# 重启 Docker
sudo systemctl restart docker
```

---

## ✅ 快速执行脚本

如需一键执行高优先级清理：

```bash
#!/bin/bash
# 7zi.com 磁盘清理脚本 - 高优先级清理

echo "开始清理 Docker 资源..."
docker system prune -a --volumes -f

echo "清理系统日志..."
journalctl --vacuum-time=7d
find /var/log -name "*.gz" -mtime +30 -delete

echo "清理 APT 缓存..."
apt-get clean
apt-get autoclean
apt-get autoremove -y

echo "清理临时文件..."
find /tmp -type f -mtime +7 -delete

echo "清理完成！"
df -h
```

保存为 `/root/cleanup.sh`，执行：
```bash
chmod +x /root/cleanup.sh
/root/cleanup.sh
```

---

## 📌 执行建议

1. **立即执行**: Docker 清理（27.2GB 回收）
2. **本周内**: 系统日志清理（2GB 回收）
3. **下周**: 缓存和临时文件清理
4. **谨慎执行**: 归档文件和 .next 目录删除

---

## 📝 备注

- 清理前建议先备份重要数据
- 生产环境建议先在测试环境验证清理脚本
- 如需 Git 历史清理（删除大文件），请联系开发者
- 定期监控磁盘使用：`df -h | grep vda1`

---

**报告生成完成** | 2026-03-30 | 🛡️ 系统管理员
