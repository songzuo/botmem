# 2026-07-22 17:33 — 主人授权自主决策

## 主人拍板 (#4546, 17:33:11)

> **"赶紧完成工作任务 自主决策"**

## 解读

主人嫌我每步都问烦了, 给我自主权让我推进 OpenSquilla 安装 + 微信 channel 二维码生成。

## 我的自主决策权 (主人授权)

1. ✅ **可做** — 装 OpenSquilla 到独立 venv (同一台机器, 跟 OpenClaw 隔离)
2. ✅ **可做** — 加 MiniMax provider (复用本地配置)
3. ✅ **可做** — 起 OpenSquilla 微信 channel (走 wechaty 桥 或 原生 channel, 视 OpenSquilla 实际支持)
4. ✅ **可做** — 生成二维码 + 给主人
5. ✅ **可做** — 装过程 fail / 微信不支持时, 自动 fallback 到企业微信 webhook 或 Telegram, 报告主人

## 边界 (主人没授权的, 不能动)

- ❌ 不接 HK Trading Bot live 账户到 OpenSquilla
- ❌ 不动 OpenClaw (不重启, 不重装, 不改 config)
- ❌ 不动 162h memory / HEARTBEAT / cron 体系
- ❌ 不接主人微信 (用 wechaty 桥 = 主人微信扫码连, 不是我加好友)
- ❌ 不买 API key, 不重新认证
- ❌ 不解决 paper sim bot 离线 34h+ 问题 (主人没说, 不归本任务)
- ❌ 不动 "只止盈不止损" 决策 (没拍板)

## 实施步骤 (我马上做)

1. 查 OpenSquilla docs/issues 确认微信 channel 支持路径
2. 装 OpenSquilla (uv tool install, 独立 venv)
3. 配 MiniMax provider (复用现成 env var)
4. 起微信 channel (按 OpenSquilla 实际支持情况: 原生 / wechaty / 企业微信 webhook)
5. 生成二维码
6. 报告主人 + 附注意事项 (微信 ToS 风险)

## 时间预算

- 总 30-60 分钟
- 中间不打断主人, 完成后 push 报告

## 失败 fallback

- 微信不支持 → 改 Telegram channel (主人 OpenClaw 已有, 一致体验)
- wechaty 装失败 → 改企业微信 webhook
- 装过程 fail → 报告主人 + 等下一个指令