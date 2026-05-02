# 部署方案报告 - v1.14.1 到 7zi.com 生产环境

**日期**: 2026-04-25  
**目标**: 解决 7zi.com SSH 连接问题 + 版本升级 v1.3.0 → v1.14.1  
**状态**: ✅ **SSH 已连通** | 🔄 构建进行中 | ⏳ 待部署

---

## 📋 问题诊断结果

### 1. SSH 连接问题 - ✅ 已解决

| 连接方式 | IP/主机 | 端口 | 状态 |
|---------|---------|------|------|
| ~~7zi.com~~ | 172.67.184.212 | 22 | ❌ 被 Cloudflare 阻断 |
| ~~ecm-cd59~~ | (hostname) | 22 | ❌ 无法解析 |
| **直接 IP** | **165.99.43.61** | **22** | ✅ **可用！** |

**解决方案**: 使用 `root@165.99.43.61` 直接连接，绕过 Cloudflare SSH 阻断

### 2. 版本落后问题 - ⚠️ 需升级

| 位置 | 版本 | 状态 |
|------|------|------|
| 生产服务器 (PM2) | **v1.3.0** | 🔴 落后 11+ 版本 |
| 本地代码 | **v1.14.1** | 🟢 最新 |
| Git 差距 | 生产在 v1.14.0-53, 本地在 v1.14.0-61 | 本地领先 8 commits |

### 3. PM2 错误分析 - ✅ 已定位

```
Error: Failed to find Server Action. This request might be from an older or newer deployment.
```

**根本原因**: Next.js 的 Server Action ID 是在构建时生成的。v1.3.0 生成的 Action ID 与 v1.14.1 的客户端不匹配。

**解决方案**: 重新构建并部署 v1.14.1

### 4. 服务器状态

```
主机名: 7zi
系统: Ubuntu 22.04 (Linux 5.15.0)
Node: v22.22.0
磁盘: 88GB / 78GB used (90% - ⚠️ 空间紧张)
PM2:
  - 7zi-main: v1.3.0 (cluster mode, port 3000) ✅ online
  - ai-site: v1.0.0 (fork mode, port 3001) ✅ online
端口: 22(ssh), 80(http), 443(https), 3000, 3001, 8081
```

---

## 🚀 可用部署方案

### 方案 A: 通过 rsync 直接部署 (推荐) ✅

**优点**: 
- 绕过 Git，不需要在服务器上构建
- 带宽高效，只传输变更文件
- 原子性替换

**步骤**:
1. 本地构建 `npm run build`
2. rsync 同步到服务器
3. PM2 重启

### 方案 B: Git Pull + 服务器构建

**缺点**:
- 服务器磁盘空间紧张 (90%)
- 构建耗时长
- 需要传输完整依赖

### 方案 C: Docker 部署

**注意**: 当前服务器 **未安装 Docker**（虽然有 docker-proxy 在 5672 端口，但那是残留进程）

---

## 📦 当前构建状态

- **构建进程**: 🔄 进行中 (PID 3588713, 9:46 开始)
- **standalone 输出**: ⏳ 等待完成
- **预计时间**: 5-10 分钟

---

## 📝 部署脚本

部署脚本已创建: `deploy-7zi-production-v1141.sh`

### 使用方法

```bash
# 1. 等待构建完成
# 2. 运行部署脚本
cd /root/.openclaw/workspace/deploy-scripts
./deploy-7zi-production-v1141.sh

# 或手动部署
cd /root/.openclaw/workspace
rsync -avz --delete \
  .next/standalone/ \
  root@165.99.43.61:/var/www/7zi/7zi-frontend/.next/standalone/
```

---

## ⚠️ 注意事项

1. **磁盘空间**: 服务器 90% 已使用，部署前需要清理
2. **PM2 重启**: 部署后需要 `pm2 restart 7zi-main`
3. **回滚方案**: 
   ```bash
   # 查看备份
   ssh root@165.99.43.61 "ls -lt /var/backups/7zi/"
   # 回滚
   ssh root@165.99.43.61 "cp -r /var/backups/7zi/backup_YYYYMMDD_HHMMSS /var/www/7zi/"
   ```

---

## 📊 部署检查清单

- [ ] 本地构建完成 (.next/standalone 存在)
- [ ] 磁盘清理（如需要）
- [ ] 备份现有部署
- [ ] rsync 同步文件
- [ ] PM2 重启 7zi-main
- [ ] 验证部署成功
- [ ] 检查错误日志

---

## 🔗 关键连接信息

```bash
# SSH 连接
sshpass -p 'ge20993344$ZZ' ssh root@165.99.43.61

# 检查 PM2 状态
sshpass -p 'ge20993344$ZZ' ssh root@165.99.43.61 "pm2 status"

# 查看错误日志
sshpass -p 'ge20993344$ZZ' ssh root@165.99.43.61 "pm2 logs 7zi-main --nostream --lines 50"
```
