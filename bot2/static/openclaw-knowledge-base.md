# OpenClaw 知识库

> 本知识库收集官方文档和GitHub上的版本信息、配置格式变化等，供本机OpenClaw每次工作任务之前参考，避免使用过时的大模型知识。

---

## 1. 核心概念

### 1.1 什么是OpenClaw？

OpenClaw是一个自托管网关，连接聊天应用（WhatsApp、Telegram、Discord、iMessage等）与AI编码代理。运行在用户自己的机器上，作为桥梁连接消息应用和AI助手。

**关键特性：**
- 自托管：运行在自有硬件上
- 多渠道：一个网关同时服务WhatsApp、Telegram、Discord等
- Agent原生：为编码代理构建，支持工具使用、会话、记忆、多代理路由
- 开源：MIT许可证

### 1.2 架构概览

```
WhatsApp / Telegram / Slack / Discord / Google Chat / Signal / iMessage...
    │
    ▼
┌─────────────────────────────┐
│ Gateway (控制平面)           │
│ ws://127.0.0.1:18789        │
└──────────────┬──────────────┘
               │
   ├─ Pi agent (RPC)
   ├─ CLI (openclaw …)
   ├─ WebChat UI
   ├─ macOS app
   └─ iOS / Android nodes
```

---

## 2. 版本与发布渠道

### 2.1 开发渠道

| 渠道 | 说明 | npm dist-tag |
|------|------|--------------|
| stable | 标签发布 (vYYYY.M.D) | latest |
| beta | 预发布标签 (vYYYY.M.D-beta.N) | beta |
| dev | main主分支最新 | dev |

**切换命令：**
```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

### 2.2 安装方式

**全局安装（推荐）：**
```bash
npm install -g openclaw@latest
# 或
pnpm add -g openclaw@latest
```

**从源码安装：**
```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm openclaw onboard --install-daemon
```

### 2.3 运行时要求

- **Node.js**: ≥22
- **推荐系统**: macOS, Linux, Windows (WSL2)

---

## 3. 配置文件

### 3.1 配置文件位置

- **主配置**: `~/.openclaw/openclaw.json`
- **凭证目录**: `~/.openclaw/credentials/`
- **工作区**: `~/.openclaw/workspace`
- **环境变量**: `~/.openclaw/.env`

### 3.2 最小配置示例

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace"
    }
  },
  "channels": {
    "whatsapp": {
      "allowFrom": ["+15555550123"]
    }
  }
}
```

### 3.3 配置编辑方式

1. **交互式向导**: `openclaw onboard` 或 `openclaw configure`
2. **CLI命令**:
   ```bash
   openclaw config get agents.defaults.workspace
   openclaw config set agents.defaults.heartbeat.every "2h"
   openclaw config unset tools.web.search.apiKey
   ```
3. **Control UI**: 打开 http://127.0.0.1:18789 的 Config 标签页
4. **直接编辑**: 修改 `~/.openclaw/openclaw.json`，Gateway会自动监视并应用变更

### 3.4 配置热重载

**reload模式：**
| 模式 | 行为 |
|------|------|
| hybrid (默认) | 安全变更即时应用，关键变更自动重启 |
| hot | 仅热应用安全变更，需要重启时记录警告 |
| restart | 任何配置变更都重启Gateway |
| off | 禁用文件监视，手动重启生效 |

```json
{
  "gateway": {
    "reload": {
      "mode": "hybrid",
      "debounceMs": 300
    }
  }
}
```

### 3.5 需重启的配置项

| 类别 | 字段 | 需重启？ |
|------|------|----------|
| Channels | channels.*, web | 否 |
| Agent & models | agent, agents, models, routing | 否 |
| Automation | hooks, cron, agent.heartbeat | 否 |
| Sessions & messages | session, messages | 否 |
| Tools & media | tools, browser, skills, audio, talk | 否 |
| UI & misc | ui, logging, identity, bindings | 否 |
| Gateway server | gateway.* (port, bind, auth, tailscale, TLS, HTTP) | 是 |
| Infrastructure | discovery, canvasHost, plugins | 是 |

### 3.6 环境变量

**加载顺序：**
1. 父进程环境变量
2. 当前工作目录 `.env`（若存在）
3. `~/.openclaw/.env`（全局回退）

**内联变量设置：**
```json
{
  "env": {
    "OPENROUTER_API_KEY": "sk-or-...",
    "vars": {
      "GROQ_API_KEY": "gsk-..."
    }
  }
}
```

**变量替换：**
```json
{
  "gateway": {
    "auth": {
      "token": "${OPENCLAW_GATEWAY_TOKEN}"
    }
  }
}
```

---

## 4. 重要配置字段

### 4.1 核心配置结构

```json
{
  "agents": { },
  "channels": { },
  "tools": { },
  "gateway": { },
  "models": { },
  "session": { },
  "messages": { },
  "hooks": { },
  "cron": { },
  "ui": { },
  "logging": { },
  "update": { },
  "env": { }
}
```

### 4.2 安全默认配置

**DM配对模式 (dmPolicy)：**
- `pairing`: 未知发送者收到配对码，机器人不处理其消息
- `open`: 公开DM需要显式选择加入

**配置示例：**
```json
{
  "channels": {
    "whatsapp": {
      "allowFrom": ["+15555550123"],
      "groups": {
        "*": {
          "requireMention": true
        }
      }
    }
  },
  "messages": {
    "groupChat": {
      "mentionPatterns": ["@openclaw"]
    }
  }
}
```

---

## 5. 常用命令

### 5.1 Gateway管理

```bash
openclaw gateway status      # 查看状态
openclaw gateway stop        # 停止
openclaw gateway restart    # 重启
openclaw gateway --port 18789 --verbose  # 前台运行
openclaw logs --follow       # 查看日志
```

### 5.2 更新与健康检查

```bash
openclaw update              # 更新
openclaw update --dry-run    # 预览更新
openclaw doctor              # 诊断和修复
openclaw health              # 健康检查
```

### 5.3 消息发送

```bash
openclaw message send --to +1234567890 --message "Hello"
openclaw agent --message "Ship checklist" --thinking high
```

---

## 6. 更新指南

### 6.1 更新前准备

1. 确认安装方式：全局(npm/pnpm) vs 源码(git clone)
2. 确认Gateway运行方式：前台 vs 守护服务
3. 快照配置：
   - 配置: `~/.openclaw/openclaw.json`
   - 凭证: `~/.openclaw/credentials/`
   - 工作区: `~/.openclaw/workspace`

### 6.2 推荐更新方式

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
# 或指定参数
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --no-onboard
```

### 6.3 自动更新配置

```json
{
  "update": {
    "channel": "stable",
    "auto": {
      "enabled": true,
      "stableDelayHours": 6,
      "stableJitterHours": 12,
      "betaCheckIntervalHours": 1
    }
  }
}
```

### 6.4 回滚/固定版本

**全局安装回滚：**
```bash
npm i -g openclaw@<version>
pnpm add -g openclaw@<version>
```

**源码安装回滚到指定日期：**
```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before="2026-01-01" origin/main)"
pnpm install
pnpm build
openclaw gateway restart
```

---

## 7. 关键子系统

### 7.1 渠道支持

WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, BlueBubbles (iMessage), IRC, Microsoft Teams, Matrix, Feishu, LINE, Mattermost, Nextcloud Talk, Nostr, Synology Chat, Tlon, Twitch, Zalo, WebChat

### 7.2 核心工具

- **Browser control**: 专用Chrome/Chromium，CDP控制
- **Canvas + A2UI**: 代理驱动的可视化工作区
- **Nodes**: 相机、屏幕录制、位置、通知
- **Cron + wakeups**: 定时任务和唤醒事件
- **Skills**: 技能平台（bundled/managed/workspace）

### 7.3 运行时与安全

- 渠道路由、重试策略、流式处理
- Presence、输入指示器、使用追踪
- 模型、模型故障转移、会话修剪
- 安全配置和故障排除

---

## 8. 故障排除

### 8.1 常用诊断

```bash
openclaw doctor              # 诊断问题并修复
openclaw logs                # 查看日志
openclaw status              # 查看状态
```

### 8.2 常见问题

- **配置验证失败**: Gateway无法启动，仅诊断命令可用，运行 `openclaw doctor` 查看问题
- **DM策略风险**: 运行 `openclaw doctor` 警告不安全的"open"设置
- **服务检测**: 旧版Gateway服务可能需要迁移

---

## 9. 参考链接

- 官网: https://openclaw.ai
- 文档: https://docs.openclaw.ai
- GitHub: https://github.com/openclaw/openclaw
- Discord: https://discord.gg/clawd
- 配置参考: https://docs.openclaw.ai/gateway/configuration-reference

---

## 10. 版本差异详解（重要）

### 10.1 格式演进

| 特性 | 旧版/宽松模式 | 新版/严格模式 |
|------|---------------|---------------|
| 格式验证 | 可能允许未知键 | 严格Schema验证，未知键报错 |
| 智能体模型 | 单智能体配置 | 多智能体配置 (agents.list) |
| 认证存储 | 分散（环境变量、oauth.json） | 集中认证配置文件 (auth-profiles.json) |
| 工具管控 | 相对简单 | 多层精细化策略 |
| 配置组织 | 单一文件 | 支持 $include 模块化 |
| 环境变量 | 可能未明确优先级 | 明确优先级与"不覆盖"原则 |

### 10.2 配置结构差异

**旧版（单智能体）：**
```json
{
  "agent": {
    "workspace": "~/.openclaw/workspace",
    "model": "anthropic/claude-opus-4-5",
    "sandbox": { "mode": "non-main" }
  }
}
```

**新版（多智能体）：**
```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "model": { "primary": "anthropic/claude-opus-4-5" }
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace-main"
      }
    ]
  }
}
```

### 10.3 字段名称变化

| 旧版字段路径 | 新版字段路径 | 说明 |
|-------------|-------------|------|
| agent.workspace | agents.defaults.workspace | 单智能体到多智能体默认值 |
| agent.sandbox | agents.defaults.sandbox | 同上 |
| ~/.openclaw/agent/* | ~/.openclaw/agents/<agentId>/agent/* | 目录结构变化 |
| ~/.openclaw/sessions/ | ~/.openclaw/agents/<agentId>/sessions/ | 会话存储位置变化 |

### 10.4 JSON5支持

新版明确支持JSON5格式（支持注释和尾逗号）：
```json5
{
  // 这是注释
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } }, // 尾逗号允许
}
```

### 10.5 认证管理差异

**旧版：** 密钥直接暴露在配置中
```json
{
  "models": {
    "providers": {
      "openai": { "apiKey": "sk-..." }
    }
  }
}
```

**新版：** 密钥存储在独立文件中
```json
{
  "auth": {
    "profiles": {
      "openai:default": {
        "provider": "openai",
        "mode": "api_key"
      }
    }
  }
}
```
实际密钥存储在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`

### 10.6 工具管控差异

新版支持多层精细化策略：
- `tools.profile`: 基础白名单（minimal, coding, messaging, full）
- `tools.allow/deny`: 全局策略
- `agents.list[].tools`: 智能体级策略
- `tools.byProvider`: 提供商级策略

### 10.7 配置包含（$include）

新版支持模块化配置：
```json
{
  "agents": {
    "$include": "./agents.json5"
  },
  "broadcast": {
    "$include": ["./clients/client1.json5", "./clients/client2.json5"],
    "enabled": true
  }
}
```

### 10.8 环境变量优先级

1. 进程环境变量（最高）
2. 当前目录 .env
3. 全局 ~/.openclaw/.env
4. 配置文件中的 env 块
5. 可选的shell环境导入

### 10.9 迁移命令

```bash
# 验证配置
openclaw config validate

# 迁移和修复
openclaw doctor --fix

# 自动确认
openclaw doctor --yes
```

### 10.10 工作区文件变化

| 文件 | 用途 | 注入时机 |
|------|------|----------|
| AGENTS.md | 操作指令+记忆 | 每个新会话第一轮 |
| SOUL.md | 人设、边界、语气 | 每个新会话第一轮 |
| TOOLS.md | 工具说明 | 每个新会话第一轮 |
| BOOTSTRAP.md | 一次性首次运行 | 全新工作区，完成后删除 |
| IDENTITY.md | 智能体名称/风格 | 每个新会话第一轮 |
| USER.md | 用户档案 | 每个新会话第一轮 |

**字符限制：**
- 单个文件：默认20,000字符
- 所有文件总计：默认150,000字符

---

*本知识库最后更新: 2025-11-23 基于官方文档和GitHub信息，并整合用户提供的版本差异详解*
