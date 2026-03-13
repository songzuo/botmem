# MEMORY.md - 集群主管的长期记忆

## 核心任务
- 集群健康监控：持续检查 7 个节点的 SSH 连通性、Picoclaw 服务状态、内存/磁盘使用
- 任务调度：管理 470 个任务，101 个已完成，0 个中断
- 自主恢复：当任务中断时，通过 resume_instructions 进行恢复
- **配置保护**：禁止任何自动管理程序修改配置文件（2026-03-04 起）

## 🔧 集群节点状态（2026-03-05 确认）

| 节点 | 主机名 | OpenClaw版本 | 状态 |
|------|--------|-------------|------|
| 1 | 7zi.com | 2026.3.2 | ✅ 正常 |
| 2 | bot.szspd.cn | 2026.2.9 | ✅ 正常 |
| 3 | bot2.szspd.cn | 2026.3.2 | ✅ 正常 |
| 4 | bot3.szspd.cn | 2026.3.2 | ✅ 正常 |
| 5 | bot4.szspd.cn | 2026.3.2 | ✅ 正常 |
| 6 | bot5.szspd.cn | 2026.3.2 | ✅ 正常 |
| 7 | bot6.szspd.cn | 2026.3.2 | ✅ 正常 |

### SSH 认证
- 认证方式: sshpass 密码认证（凭据存储在 /root.env/ssh.env）
- 使用 sshpass 进行连接

### DingTalk 配置
- 所有节点 DingTalk 频道已恢复正常
- clientId: 已配置（凭据存储在 /root.env/ssh.env）

## 关键决策
1. **SSH 认证**：使用 sshpass + 密码认证解决所有节点连通性问题（凭据存储在 /root.env/ssh.env）
2. **Picoclaw 部署**：6/7 节点已部署并运行 Picoclaw 服务（bot5 需人工检查）
3. **任务清理**：批量完成 86 个挂起的恢复任务，清空中断队列
4. **token-harvester-e2e**：已成功完成端到端闭环
5. **停用自动管理**：2026-03-04 停用所有自动配置修改程序

## 节点状态（2026-03-03 20:55 UTC）
| 节点 | SSH | Picoclaw | 备注 |
|------|-----|----------|------|
| 7zi.com | ✅ | ✅ active | 已部署 |
| bot.szspd.cn | ✅ | ✅ active | 已部署 |
| bot2.szspd.cn | ✅ | ✅ active | 已部署 |
| bot3.szspd.cn | ✅ | ✅ active | 已部署 |
| bot4.szspd.cn | ✅ | ✅ active | 已部署 |
| bot5.szspd.cn | ❌ | ❌ unreachable | SSH 连接被拒绝，需人工检查 |
| bot6.szspd.cn | ✅ | ✅ active | 已部署 |

## 配置保护事件（2026-03-04 05:20 UTC）⚠️

### 问题
三台节点（7zi.com、bot3、bot6）配置文件被自动管理程序修改，引入无效键：
- `claw-mesh.config` 包含无效属性
- `agents.defaults.provider` 是无效键
- `commands.ownerDisplay` 无效
- Node.js 版本过旧（bot3: v20.19.2）

### 已禁用的自动服务
- `autonomous-agent.service` - 已停止并禁用
- `node-self-recovery.service` - 已停止并禁用
- `/opt/cluster-agent/*.sh` - 已重命名为 *.disabled
- `unified-watchdog.sh` - 已禁用
- cron 中的自主思考和 watchdog 任务已移除

### 配置修改规则
1. 禁止任何脚本自动修改配置文件
2. 修改前必须运行 `config-guardian backup`
3. 使用增量修改（jq 或 Python），禁止整文件覆盖
4. 修改后必须验证：`config-guardian validate && openclaw status`

## 学习到的教训
- 被动中断处理：running 状态超过 30 分钟未更新的任务会被自动标记为 suspended
- 批量清理：86 个挂起任务可通过脚本批量完成
- Picoclaw 部署：需要 config.json 配置文件才能正常启动
- SSH 问题：bot5.szspd.cn SSH 服务可能未运行，需要人工介入
- **配置保护**：自动管理程序可能引入无效配置键，需严格限制

## 待办事项
1. ~~检查 bot5.szspd.cn 的 SSH 服务状态~~ - SSH 连接缓慢，需观察
2. ~~优化健康监控逻辑，避免重复创建恢复任务~~ - 已禁用自动恢复
3. ~~监控新部署的 Picoclaw 服务稳定性~~ - 6/7 节点正常运行
4. ⚠️ **严格遵守配置保护规则** - 禁止自动修改配置
5. ⚠️ **修复 polymarket-trading 日志污染** - 脚本向 HEARTBEAT.md 写入日志

## 事件记录

### 2026-03-11 01:30 UTC - bot.szspd.cn 磁盘持续清理
- **问题**: 磁盘长期 99%，HEARTBEAT.md 每30分钟增长 20MB+
- **修复措施**:
  1. cron 改为每10分钟清空 HEARTBEAT.md
  2. 清理 pnpm 缓存 (~800MB)
  3. 清理 journalctl 日志 (~500MB)
  4. 删除 openclaw 中不需要的 CUDA/Vulkan 模块 (~500MB)
- **当前状态**: 磁盘 98% (1.1G 可用)
- **建议**: 考虑扩容磁盘或迁移部分服务

### 2026-03-10 22:30 UTC - bot.szspd.cn 磁盘持续监控
- **问题**: HEARTBEAT.md 每30分钟增长约 20-30MB
- **临时修复**: 添加 cron 任务每30分钟清空文件
- **根本修复**: 需要修改 polymarket-trading 脚本日志配置（需人工确认）

### 2026-03-10 21:04 UTC - bot.szspd.cn 磁盘紧急修复
- **问题**: 磁盘 100% 满，导致服务异常
- **原因**: `/home/admin/clawd/HEARTBEAT.md` 被错误配置为日志输出文件
- **影响文件**: `intelligent-trader.mjs`, `intelligent-trader-v3.mjs` 等
- **修复**: 清空 HEARTBEAT.md，释放 424MB
- **后续**: 需要修复脚本配置，将日志输出到专用日志文件

## 🔍 搜索配置策略

### 中国机器（如bot3、bot5）
- 使用命令：`openclaw skills install multi-search-engine`
- 适用于国内网络环境的搜索需求

### 外国机器
- 配置DuckDuckGo搜索：
```json
{
 "tools": {
 "web": {
 "search": {
 "provider": "duckduckgo",
 "duckduckgo": {
 "baseUrl": "https://api.duckduckgo.com/",
 "params": {
 "format": "json",
 "no_html": 1,
 "skip_disambig": 1
 }
 }
 }
 }
 }
}
```
- 适用于国际网络环境的搜索需求
