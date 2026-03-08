# OpenClaw 配置指南

> 配置文件的基础知识和操作方法

## 配置文件位置

```
~/.openclaw/openclaw.json
```

配置格式: **JSON5** (支持注释和尾随逗号)

## 配置文件优先级

1. 如果文件不存在，OpenClaw 使用安全默认配置
2. 未知字段、类型错误或无效值会导致 Gateway **拒绝启动**

## 编辑配置的方法

### 1. 交互式向导（推荐新手）

```bash
# 完整设置向导
openclaw onboard

# 配置向导
openclaw configure
```

### 2. CLI 命令行

```bash
# 获取配置值
openclaw config get agents.defaults.workspace

# 设置配置值
openclaw config set agents.defaults.heartbeat.every "2h"

# 取消设置
openclaw config unset tools.web.search.apiKey
```

### 3. Control UI

打开浏览器: http://127.0.0.1:18789

使用 **Config** 标签页，支持表单编辑和原始 JSON 编辑器。

### 4. 直接编辑

```bash
nano ~/.openclaw/openclaw.json
vim ~/.openclaw/openclaw.json
code ~/.openclaw/openclaw.json
```

## 最小配置示例

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## 配置热重载

OpenClaw 会监视 `~/.openclaw/openclaw.json` 并自动应用更改。

### 热重载模式

| 模式 | 行为 |
|------|------|
| `hybrid` (默认) | 安全更改即时应用，关键更改自动重启 |
| `hot` | 仅安全更改应用，需要时记录警告 |
| `restart` | 任何更改都重启 Gateway |
| `off` | 禁用文件监视，手动重启生效 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### 哪些需要重启

| 类别 | 字段 | 需要重启? |
|------|------|----------|
| 通道 | `channels.*`, `web` | 否 |
| 代理和模型 | `agent`, `agents`, `models`, `routing` | 否 |
| 自动化 | `hooks`, `cron`, `agent.heartbeat` | 否 |
| 会话和消息 | `session`, `messages` | 否 |
| 工具和媒体 | `tools`, `browser`, `skills`, `audio`, `talk` | 否 |
| UI 和其他 | `ui`, `logging`, `identity`, `bindings` | 否 |
| Gateway 服务器 | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP) | **是** |
| 基础设施 | `discovery`, `canvasHost`, `plugins` | **是** |

## 环境变量

### .env 文件

OpenClaw 从以下位置读取环境变量（不覆盖已存在的变量）:

1. 当前工作目录的 `.env`
2. `~/.openclaw/.env` (全局回退)

### 配置中内联环境变量

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

### Shell 环境导入

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

环境变量: `OPENCLAW_LOAD_SHELL_ENV=1`

### 配置值中的变量替换

使用 `${VAR_NAME}` 引用环境变量:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

规则:
- 仅大写名称匹配: `[A-Z_][A-Z0-9_]*`
- 缺失/空变量在加载时抛出错误
- 使用 `$${VAR}` 转义输出字面量

## SecretRef (敏感信息)

支持的凭据来源:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "nano-banana-pro": {
        apiKey: { source: "file", provider: "filemain", id: "/skills/entries/nano-banana-pro/apiKey" },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: { source: "exec", provider: "vault", id: "channels/googlechat/serviceAccount" },
    },
  },
}
```

## 配置 RPC (编程式更新)

### config.apply (完整替换)

```bash
openclaw gateway call config.get --params '{}'  # 获取 payload.hash
openclaw gateway call config.apply --params '{
  "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
  "baseHash": "<hash>",
  "sessionKey": "agent:main:whatsapp:dm:+15555550123"
}'
```

### config.patch (部分更新)

```bash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

注意: 
- 速率限制: **每 60 秒 3 次请求**
- 使用 `config.patch` 进行部分更新更安全

## 多文件配置 ($include)

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/a.json5", "./clients/b.json5"],
  },
}
```

规则:
- **单文件**: 替换包含的对象
- **文件数组**: 深度合并（后者胜出）
- **嵌套 include**: 支持最多 10 层
- **相对路径**: 相对于包含文件解析

## 验证和错误处理

运行验证:

```bash
openclaw doctor
openclaw doctor --fix  # 自动修复
openclaw doctor --yes  # 确认所有修复
```

---

*更多信息: [官方配置文档](https://docs.openclaw.ai/gateway/configuration)*
