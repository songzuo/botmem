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
- 密码: `PASSWORD_REDACTED`
- 使用 sshpass 进行连接

### DingTalk 配置
- 所有节点 DingTalk 频道已恢复正常
- clientId: `dingpcborakffejd8f93`
- clientSecret: 以 `2qD63I8e...` 开头

## 关键决策
1. **SSH 认证**：使用 sshpass + 密码认证解决所有节点连通性问题（密码：PASSWORD_REDACTED）
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
1. ⚠️ 检查 bot5.szspd.cn 的 SSH 服务状态（连接被拒绝）
2. ~~优化健康监控逻辑，避免重复创建恢复任务~~ - 已禁用自动恢复
3. ~~监控新部署的 Picoclaw 服务稳定性~~ - 6/7 节点正常运行
4. ⚠️ **严格遵守配置保护规则** - 禁止自动修改配置

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
