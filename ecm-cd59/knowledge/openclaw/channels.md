# OpenClaw 通道配置

> 各聊天平台的通道配置详情

## 支持的通道

| 通道 | 配置键 | 文档 |
|------|--------|------|
| WhatsApp | `channels.whatsapp` | [WhatsApp](/channels/whatsapp) |
| Telegram | `channels.telegram` | [Telegram](/channels/telegram) |
| Discord | `channels.discord` | [Discord](/channels/discord) |
| Slack | `channels.slack` | [Slack](/channels/slack) |
| Signal | `channels.signal` | [Signal](/channels/signal) |
| iMessage | `channels.imessage` | [iMessage](/channels/imessage) |
| Google Chat | `channels.googlechat` | [Google Chat](/channels/googlechat) |
| Microsoft Teams | `channels.msteams` | [MS Teams](/channels/msteams) |
| Mattermost | `channels.mattermost` | [Mattermost](/channels/mattermost) |
| IRC | `channels.irc` | [IRC](/channels/irc) |
| LINE | `channels.line` | [LINE](/channels/line) |
| Matrix | `channels.matrix` | [Matrix](/channels/matrix) |
| Nostr | `channels.nostr` | [Nostr](/channels/nostr) |
| Feishu | `channels.feishu` | [Feishu](/channels/feishu) |
| Zalo | `channels.zalo` | [Zalo](/channels/zalo) |

## 通道默认值

设置所有通道的默认值:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist",
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

## 通道模型覆盖

为特定通道固定模型:

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## 多账户支持

### 通用多账户格式

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

### WhatsApp 多账户

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {},
      },
    },
  },
}
```

## 群组消息配置

### 群组提及门控

群组消息默认**需要提及**:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
}
```

### 特定群组配置

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          requireMention: false,
          skills: ["search"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
            },
          },
        },
      },
    },
  },
}
```

### 自我聊天模式

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],  // 包含自己的号码
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

## DM 历史限制

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

支持通道: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`

---

## 常用命令

### 登录通道

```bash
openclaw channels login
```

### 查看通道状态

```bash
openclaw channels status
```

### 添加通道

```bash
openclaw channels add telegram
```

---

*更多信息: [官方通道文档](https://docs.openclaw.ai/channels)*
