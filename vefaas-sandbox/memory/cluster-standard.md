# 7台机器标准化配置

## 理想状态

每台机器只运行一个Gateway服务：

| 机器 | 用途 | 服务 | 端口 | 频道 |
|------|------|------|------|------|
| 7zi.com | OpenClaw | openclaw | 18789 | Telegram |
| bot | 交易 | moltbot | 18789 | - |
| bot2 | OpenClaw | openclaw | 18789 | Telegram |
| bot3 | OpenClaw | openclaw | 18789 | DingTalk |
| bot4 | OpenClaw | openclaw | 18789 | Telegram |
| bot5 | OpenClaw | openclaw | 18789 | DingTalk |
| bot6 | OpenClaw | openclaw | 18789 | DingTalk |

## 当前问题

1. bot3/bot4/bot5 还运行picoclaw
2. 防火墙不统一
3. 无systemd自启动

## 待修复

- 清理所有picoclaw (除bot6)
- 统一防火墙规则
- 配置systemd
