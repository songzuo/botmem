# 2026-07-22 17:36 — 微信 ClawBot 集成决策

## 主人新指令 (#4559)

> **"微信有开发了自己的clawbot完全支持小龙虾和其他任何的agent"**

## 验证结果

### ✅ 微信 ClawBot 真实存在, 腾讯官方插件
- npm 包: `@tencent-weixin/openclaw-weixin-cli@2.1.4` (4 周前发布)
- 维护者: 腾讯员工 (amikara/pumpkinxing 等 @tencent.com 邮箱)
- 触发事件: 2026-03-22 微信官方公众号 "微信派" 宣布
- 流程: `npx install` → 终端弹二维码 → 微信扫 → 完事
- MIT license, **官方源**, **完全合规**

### ✅ 我 (OpenClaw) 2026.6.9 已装, 完全支持
- `/usr/bin/openclaw` 已存在 (2026-06-21 装)
- `openclaw channels login` 子命令存在
- 兼容范围: OpenClaw >= 2026.3.22 (我符合)

### ❌ 但 OpenSquilla 不能用这个插件
- openclaw-weixin-cli 假设目标 = OpenClaw, 不是 OpenSquilla
- OpenSquilla 是独立 Python 项目, 没 OpenClaw 那种 plugin 系统
- OpenSquilla 没原生微信 channel (只有 wecom/qq/telegram/discord/slack/feishu/dingtalk/matrix/msteams)
- "完全支持小龙虾和其他任何 agent" 主人口味: **OpenClaw 直接接即可**

## 我的自主决策 (主人 17:33 授权)

### 🅰️ 主人最简路径 (建议)
**直接给 OpenClaw (我) 装 openclaw-weixin 插件 + 弹二维码**
- 5 分钟装 + 二维码
- 主人微信扫 → 直接在微信里跟我 (OpenClaw) 对话
- 不需要 OpenSquilla 也接微信
- 主人"OpenSquilla 也接微信"的需求暂 hold

### 🅱️ OpenSquilla 也接微信 (难)
需要写 OpenSquilla 自定义 channel 类, 走 wechaty 桥:
- OpenSquilla channel 架构支持 custom channel
- 但 wechaty 个人版 2023+ 被微信封禁
- 工作量 2-3h, 高风险违反微信 ToS
- 主人可能封号

### 我的建议: 🅰️ 先把 OpenClaw 接上微信, 主人立刻能用
后续再决定 OpenSquilla 是否需要也接微信 (大概率不需要, 因为 OpenClaw 已经在管 HK Trading Bot + 主人对话)

## 行动 (按主人 17:33 自主授权)

1. ✅ 装 openclaw-weixin-cli
2. ✅ 触发 `openclaw channels login --channel openclaw-weixin`
3. ✅ 终端显示二维码 (terminal 内文本 QR)
4. ✅ 把二维码发到 Telegram 给主人 (主人微信扫)
5. ⚠️ 主人微信账号风险提示 (官方插件 = 合规, 但仍提示)

## 边界 (主人没授权的)

- ❌ 不动 OpenSquilla (已装好, 留作 toy sandbox)
- ❌ 不接 HK Trading Bot live 到 wechat (wechat 跟 live 账户分离)
- ❌ 不写 wechaty 自定义 channel (🅱️ 路径太重)