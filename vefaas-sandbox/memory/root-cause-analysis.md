# 2026-03-02 问题根源分析

## 发现

### bot (8.215.23.144) 实际运行内容

| 进程 | 说明 |
|------|------|
| intelligent-trader.mjs | 智能交易机器人 |
| intelligent-trader-v3.mjs | 智能交易机器人v3 |
| moltbook-auto-advanced-fixed.mjs | Moltbook自动化交易 |
| moltbot-gateway | Moltbot网关 |

**结论**: bot是一台**交易专用机器**，不是OpenClaw机器！

### 混乱的根源

1. **角色混淆** - 7台机器用途不同
   - OpenClaw机器: bot2, bot3, bot4, 7zi.com, bot6
   - 交易机器: bot, bot5 (可能)

2. **SSH密码不统一**
   - 大部分: ge2099334$ZZ
   - bot/bot5: ge2099334$Z

3. **服务混乱**
   - 一些机器同时运行 picoclaw + openclaw
   - 端口不统一 (18789 vs 18795)

## 7台机器真实角色

| # | 主机名 | IP | 实际用途 |
|---|--------|-----|----------|
| 1 | 7zi.com | 165.99.43.61 | OpenClaw + Telegram |
| 2 | bot.szspd.cn | 8.215.23.144 | Polymarket交易 |
| 3 | bot2.szspd.cn | 47.81.39.226 | OpenClaw + Telegram |
| 4 | bot3.szspd.cn | 159.75.149.84 | OpenClaw + DingTalk |
| 5 | bot4.szspd.cn | 43.159.49.231 | OpenClaw + Telegram |
| 6 | bot5.szspd.cn | 182.43.36.134 | ? (失联) |
| 7 | bot6.szspd.cn | 109.123.246.140 | OpenClaw + DingTalk |

## 建议

1. **明确分工** - 每台机器只做一件事
2. **标准化** - OpenClaw机器统一配置
3. **分离** - 交易机器独立管理
