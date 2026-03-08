# HEARTBEAT.md - 集群主管心跳检查清单

## 检查项目（每次心跳执行）
1. **任务调度**：运行 task_scheduler.py dashboard 和 next
2. **节点连通性**：SSH检查所有7个节点（7zi.com, bot[1-5].szspd.cn）
3. **服务状态**：检查 Picoclaw 服务是否运行
4. **资源使用**：监控内存和磁盘使用情况
5. **阻塞任务**：检查 token-harvester-e2e 的阻塞条件
6. **恢复任务**：检测需要恢复的任务（通过 task_scheduler.py recover）
7. **配置保护**：检查 openclaw.json 是否有未备份的修改（使用 config-guardian）

## 配置安全规则 ⚠️⚠️⚠️

### 🚫 严格禁止（2026-03-04 起）
- **禁止**任何自动管理程序修改配置文件
- **禁止**自主代理（autonomous-agent）运行
- **禁止**节点自我恢复服务（node-self-recovery）运行
- **禁止** watchdog 脚本自动执行
- **禁止** cron 中的自动修复任务

### ✅ 已禁用的服务
- `autonomous-agent.service` - 已停止并禁用
- `node-self-recovery.service` - 已停止并禁用
- `/opt/cluster-agent/*.sh` - 已重命名为 *.disabled
- `unified-watchdog.sh` - 已禁用

### 📋 配置修改流程
1. 运行 `config-guardian backup`
2. 人工审核修改内容
3. 使用 jq 或 Python 增量修改
4. 验证：`config-guardian validate && openclaw status`

### 🔧 配置恢复
- 列出备份：`config-guardian list`
- 恢复备份：`config-guardian restore <backup-name>`

## 关键指标
- 任务完成率：104/472 ≈ 22.0%
- 中断任务数：0 个（已清空）
- 节点状态：7/7 节点正常

## 已知节点状态（2026-03-05 已验证）
- **7zi.com**: ✅ SSH正常, OpenClaw 2026.3.2
- **bot.szspd.cn**: ✅ SSH正常, OpenClaw 2026.3.2
- **bot2.szspd.cn**: ✅ SSH正常, OpenClaw 2026.3.2
- **bot3.szspd.cn**: ✅ SSH正常, OpenClaw 2026.2.9 (旧版本)
- **bot4.szspd.cn**: ✅ SSH正常, OpenClaw 2026.3.2
- **bot5.szspd.cn**: ✅ SSH正常, OpenClaw 2026.3.2
- **bot6.szspd.cn**: ✅ SSH正常, OpenClaw 2026.3.2

## SSH 认证信息（永久记录）
- 密码: `PASSWORD_REDACTED`
- 使用: `sshpass -e ssh root@<hostname>`

## 本机安全状态
- ✅ 配置文件权限已修复 (chmod 600)
- ⚠️ plugins.allow 未设置 (可忽略)

## 紧急任务
1. ~~修复 SSH 密码认证问题~~ - ✅ 已解决（使用 sshpass）
2. ~~启动 Picoclaw 服务~~ - ✅ 6/7 节点已运行
3. ~~批量清理挂起任务~~ - ✅ 86 个任务已完成
4. ~~bot5.szspd.cn 人工检查~~ - ✅ 已恢复正常
5. ~~修复 QQ 机器人配置~~ - ✅ DingTalk 已恢复正常
6. **无紧急任务** - 所有系统正常运行

## 可用工具
- `config-guardian backup` - 创建配置备份
- `config-guardian list` - 列出备份
- `config-guardian restore <backup>` - 恢复备份
- `config-guardian validate` - 验证配置
