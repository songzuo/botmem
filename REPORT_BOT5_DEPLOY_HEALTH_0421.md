# Bot5 服务器部署健康检查报告

**检查时间**: 2026-04-21 15:43 GMT+2  
**目标服务器**: bot5.szspd.cn (182.43.36.134)  
**检查人**: AI 主管团队 子代理

---

## 1. SSH 连接测试

| 项目 | 结果 |
|------|------|
| SSH 连接 | ✅ 成功 |
| 响应时间 | 正常 |
| 认证方式 | 密码 (`ge20993344$ZZ`) |

**uptime 输出**:
```
21:43:37 up 26 days,  1:20,  0 users,  load average: 0.00, 0.04, 0.00
```
✅ 服务器稳定运行 26 天，负载极低 (0.00, 0.04, 0.00)

---

## 2. PM2 状态

| 项目 | 结果 |
|------|------|
| pm2 安装 | ❌ **未安装** |
| pm2 status | `bash: line 1: pm2: command not found` |
| Node.js | ✅ 已安装 (`/usr/bin/node`) |
| npm | ✅ 已安装 (`/usr/bin/npm`) |

**⚠️ 注意**: 原部署检查命令 `pm2 status` 无法执行，因服务器未安装 PM2。

---

## 3. 磁盘状态

| 项目 | 值 |
|------|---|
| 总容量 | 40GB |
| 已使用 | 25GB |
| 可用 | 16GB |
| 使用率 | 62% |

✅ 磁盘状态健康，还有充足空间。

---

## 4. 服务运行状态

### OpenClaw Gateway

| 项目 | 状态 |
|------|------|
| 服务状态 | ✅ 运行中 (pid 2281549) |
| 监听地址 | 127.0.0.1:18789 |
| RPC probe | ✅ ok |
| 版本 | OpenClaw 2026.3.13 |
| 运行方式 | systemd user service |

**⚠️ 警告信息**:
- Service config 使用 NVM node 路径 (`/root/.nvm/versions/node/v22.22.0/bin/node`)，升级后可能断裂
- 建议运行 `openclaw doctor --repair`

### Nginx

| 项目 | 状态 |
|------|------|
| 服务状态 | ✅ active (running) |
| 启动时间 | 2026-03-26 20:23:54 (约 3 周前) |
| 监听端口 | 80, 443, 8000 |

### Next.js 应用

| 项目 | 状态 |
|------|------|
| 监听端口 | 3000 |
| 进程名 | next-server (v14) |
| 状态 | ✅ 运行中 |

### 端口监听汇总

```
:22   - SSH
:80   - Nginx (HTTP)
:443  - Nginx (HTTPS)
:3000 - Next.js App
:8000 - Nginx (备用?)
:18789 - OpenClaw Gateway
```

---

## 5. 部署包状态

| 项目 | 值 |
|------|---|
| 文件路径 | `/root/.openclaw/workspace/7zi-deploy.tar.gz` |
| 大小 | 7.5MB (7,508,198 bytes) |
| 创建时间 | 2026-03-22 21:17 |
| **状态** | ✅ 存在 |

**tar.gz 内容摘要** (部分):
- `7zi-project/` - 完整项目目录
- `7zi-project/next.config.ts` - Next.js 配置
- `7zi-project/package-lock.json` - 依赖锁定文件
- 多个 exports/ 子目录（数据导出）
- 优化脚本和报告文件

⚠️ **部署包最后更新**: 2026-03-22，距今约 30 天

---

## 6. 远程服务器目录

`/root/` 下存在:
- `7zi-website/` - 线上网站目录
- `7zi-website-backup-20260323-162916/` - 3月23日备份
- `.openclaw/` - OpenClaw 配置
- `automaton/`, `evolver/`, `evomap-worker.js` 等项目文件

---

## 7. 健康检查结论

### 整体评级: 🟡 基本健康（有小问题）

| 检查项 | 状态 | 说明 |
|--------|------|------|
| SSH 连接 | ✅ | 正常 |
| 系统运行时间 | ✅ | 稳定运行 26 天 |
| 磁盘空间 | ✅ | 62% 使用率 |
| OpenClaw Gateway | ✅ | 运行中 |
| Nginx | ✅ | 正常 |
| Next.js 应用 | ✅ | 端口 3000 运行中 |
| PM2 | ❌ | 未安装（不影响运行） |
| 部署包时效 | ⚠️ | 30 天前更新 |

### 需要关注的问题

1. **PM2 未安装**: 原部署命令 `pm2 status` 无法使用，但应用直接由 Node 运行，不影响服务
2. **OpenClaw Service Config 警告**: NVM 路径硬编码，Node 升级后需重新 install
3. **部署包较旧**: 7zi-deploy.tar.gz 最后更新 30 天前，建议重新打包

### 建议操作

1. 运行 `openclaw gateway install --force` 修复 service token
2. 运行 `openclaw doctor --repair` 修复 service config 警告
3. 重新打包部署包: `tar -czf 7zi-deploy.tar.gz 7zi-project/`
4. 如需 PM2: `npm install -g pm2`

---

**报告生成时间**: 2026-04-21 15:44 GMT+2  
**子代理任务**: bot5-deploy-verify
