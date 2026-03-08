# OpenClaw 配置参考

> 完整配置字段参考（详细版请参阅官方文档）

## 根级配置结构

```json5
{
  // 频道配置
  channels: { ... },
  
  // 代理配置
  agents: { ... },
  
  // Gateway 服务器配置
  gateway: { ... },
  
  // 消息配置
  messages: { ... },
  
  // 会话配置
  session: { ... },
  
  // 工具配置
  tools: { ... },
  
  // 浏览器配置
  browser: { ... },
  
  // 技能配置
  skills: { ... },
  
  // Cron 任务配置
  cron: { ... },
  
  // Webhooks 配置
  hooks: { ... },
  
  // UI 配置
  ui: { ... },
  
  // 日志配置
  logging: { ... },
  
  // 绑定配置
  bindings: [ ... ],
  
  // 环境变量
  env: { ... },
}
```

---

## 1. 通道配置 (channels)

### 通道通用字段

每个通道支持以下 DM 和群组策略:

| DM 策略 | 行为 |
|---------|------|
| `pairing` (默认) | 未知发送者获得一次性配对码 |
| `allowlist` | 仅允许 allowFrom 列表中的发送者 |
| `open` | 允许所有 DM (需要 `allowFrom: ["*"]`) |
| `disabled` | 忽略所有 DM |

| 群组策略 | 行为 |
|----------|------|
| `allowlist` (默认) | 仅允许配置的群组 |
| `open` | 绕过群组允许列表 |
| `disabled` | 阻止所有群组消息 |

### 1.1 WhatsApp

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length",
      mediaMaxMb: 50,
      sendReadReceipts: true,
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
  },
}
```

### 1.2 Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          requireMention: false,
          skills: ["search"],
          systemPrompt: "Keep answers brief.",
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
      ],
      historyLimit: 50,
      replyToMode: "first",
      linkPreview: true,
      streaming: "partial",
      actions: { reactions: true, sendMessage: true },
    },
  },
}
```

### 1.3 Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 8,
      dmPolicy: "pairing",
      allowFrom: ["1234567890"],
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      streaming: "off",
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
      },
    },
  },
}
```

### 1.4 Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "*"],
      channels: {
        C123: { allow: true, requireMention: true },
      },
      historyLimit: 50,
      replyToMode: "off",
      slashCommand: {
        enabled: true,
        name: "openclaw",
      },
    },
  },
}
```

### 1.5 Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123",
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

### 1.6 iMessage

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com"],
      historyLimit: 50,
      mediaMaxMb: 16,
    },
  },
}
```

---

## 2. 代理配置 (agents)

### 2.1 代理默认值

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      repoRoot: "~/Projects/openclaw",
      skipBootstrap: false,
      bootstrapMaxChars: 20000,
      bootstrapTotalMaxChars: 150000,
      imageMaxDimensionPx: 1200,
      userTimezone: "America/New_York",
      timeFormat: "auto",
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["anthropic/claude-sonnet-4-5"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
      },
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

### 2.2 模型别名

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "anthropic/claude-sonnet-4-5": { alias: "sonnet" },
        "openai/gpt-5.2": { alias: "gpt" },
        "openai/gpt-5-mini": { alias: "gpt-mini" },
      },
    },
  },
}
```

### 2.3 心跳配置

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        model: "openai/gpt-5.2-mini",
        session: "main",
        target: "none",
        directPolicy: "allow",
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
      },
    },
  },
}
```

### 2.4 多代理配置

```json5
{
  agents: {
    list: [
      { id: "main", default: true, workspace: "~/.openclaw/workspace" },
      { id: "home", workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### 2.5 压缩配置

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard",
        reserveTokensFloor: 24000,
        identifierPolicy: "strict",
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
        },
      },
    },
  },
}
```

### 2.6 上下文修剪

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl",
        ttl: "1h",
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
      },
    },
  },
}
```

---

## 3. Gateway 配置 (gateway)

```json5
{
  gateway: {
    port: 18789,
    bind: "127.0.0.1",
    host: "0.0.0.0",
    auth: {
      token: "your-gateway-token",
    },
    reload: {
      mode: "hybrid",
      debounceMs: 300,
    },
    remote: { ... },
    tls: { ... },
  },
}
```

---

## 4. 会话配置 (session)

```json5
{
  session: {
    dmScope: "per-channel-peer",
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 120,
    },
  },
}
```

### dmScope 选项

- `main` - 共享单一会话
- `per-peer` - 每个发送者一个会话
- `per-channel-peer` - 每个通道+发送者一个会话
- `per-account-channel-peer` - 最细粒度

---

## 5. 消息配置 (messages)

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"],
      historyLimit: 50,
    },
  },
}
```

---

## 6. 工具配置 (tools)

```json5
{
  tools: {
    exec: {
      enabled: true,
      timeout: 60000,
      elevated: { enabled: false },
    },
    browser: {
      enabled: true,
      headless: false,
    },
    web: {
      search: { enabled: true },
      fetch: { enabled: true },
    },
  },
}
```

---

## 7. Cron 配置

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    sessionRetention: "24h",
    runLog: {
      maxBytes: "2mb",
      keepLines: 2000,
    },
  },
}
```

---

## 8. Webhooks 配置

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    defaultSessionKey: "hook:ingress",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "main",
        deliver: true,
      },
    ],
  },
}
```

---

## 9. 沙箱配置

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "agent",
      },
    },
  },
}
```

沙箱模式:
- `off` - 禁用
- `non-main` - 非 main 代理使用沙箱
- `all` - 所有代理使用沙箱

---

*完整参考: [官方配置参考](https://docs.openclaw.ai/gateway/configuration-reference)*
