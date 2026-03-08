# OpenClaw CLI 命令参考

> 常用 CLI 命令速查

## 基础命令

| 命令 | 说明 |
|------|------|
| `openclaw --version` | 查看版本 |
| `openclaw status` | 查看状态 |
| `openclaw doctor` | 诊断问题 |
| `openclaw logs` | 查看日志 |
| `openclaw help` | 查看帮助 |

## 配置命令

| 命令 | 说明 |
|------|------|
| `openclaw onboard` | 完整设置向导 |
| `openclaw configure` | 配置向导 |
| `openclaw config get <key>` | 获取配置值 |
| `openclaw config set <key> <value>` | 设置配置值 |
| `openclaw config unset <key>` | 取消设置 |

示例:

```bash
# 获取工作区路径
openclaw config get agents.defaults.workspace

# 设置心跳间隔
openclaw config set agents.defaults.heartbeat.every "30m"

# 设置模型
openclaw config set agents.defaults.model.primary "anthropic/claude-sonnet-4-5"
```

## Gateway 命令

| 命令 | 说明 |
|------|------|
| `openclaw gateway start` | 启动 Gateway |
| `openclaw gateway stop` | 停止 Gateway |
| `openclaw gateway restart` | 重启 Gateway |
| `openclaw gateway --port 18789` | 指定端口启动 |
| `openclaw gateway call <method>` | 调用 Gateway 方法 |

## 通道命令

| 命令 | 说明 |
|------|------|
| `openclaw channels login` | 登录通道 |
| `openclaw channels status` | 通道状态 |
| `openclaw channels add <channel>` | 添加通道 |
| `openclaw qr` | 显示二维码 |

## 代理命令

| 命令 | 说明 |
|------|------|
| `openclaw agents list` | 列出代理 |
| `openclaw agent <sessionKey>` | 创建代理会话 |
| `openclaw sessions list` | 列出会话 |
| `openclaw sessions history <sessionKey>` | 会话历史 |

## 自动化命令

| 命令 | 说明 |
|------|------|
| `openclaw cron list` | 列出 Cron 任务 |
| `openclaw cron add <job>` | 添加 Cron 任务 |
| `openclaw cron run <jobId>` | 手动运行任务 |
| `openclaw hooks list` | 列出 Webhooks |

## 工具命令

| 命令 | 说明 |
|------|------|
| `openclaw browser` | 浏览器控制 |
| `openclaw exec` | 执行命令 |
| `openclaw message send` | 发送消息 |

## 配对命令

| 命令 | 说明 |
|------|------|
| `openclaw pairing status` | 配对状态 |
| `openclaw pairing approve <code>` | 批准配对 |
| `openclaw nodes list` | 列出节点 |

## 更新命令

| 命令 | 说明 |
|------|------|
| `openclaw update run` | 运行更新 |
| `openclaw update check` | 检查更新 |

## Control UI

```bash
openclaw dashboard    # 打开控制面板
openclaw tui          # 终端 UI
openclaw webchat      # 网页聊天
```

## 快捷方式

```bash
# 常用别名
oc status     # openclaw status
oc logs       # openclaw logs
oc doctor     # openclaw doctor
```

---

*完整 CLI 参考: [官方 CLI 文档](https://docs.openclaw.ai/cli/index.md)*
