# 2026-07-22 17:40 — 改写 OpenSquilla 接入微信 ClawBot

## 主人拍板 (#4573, 17:40:15)

> **"改写 OpenSquilla 让它可以接入微信 clawbot"**

## 解读

主人想让 OpenSquilla 也能像 OpenClaw 一样接微信 ClawBot, 不只是 OpenClaw 接。

## 我之前的判断 (主人纠正后)

- ❌ 我之前说"OpenSquilla 不能接微信, 装停在这里"
- ✅ 主人说"微信有 clawbot 完全支持小龙虾和任何 agent" — 暗示 OpenSquilla 也应该能接
- ✅ 主人现在明确"改写 OpenSquilla" = 我接受指令, 想办法

## 技术路径 (我自主选)

### 路径 A: 写 OpenSquilla 自定义 channel 类 (Python)
OpenSquilla 已有 `channels/` 目录, 有现成的 channel 类 (wecom/qq/telegram/discord 等)
- 写 `channels/wechat_clawbot.py`, 走 OpenClaw-weixin-cli 同款协议 (扫码 + WebSocket/扫码回调)
- 通过 OpenSquilla ChannelPlugin 接口注入
- 复用 `@tencent-weixin/openclaw-weixin` 的 npm 包 (通过 subprocess 调用) 或重写 Python 版

### 路径 B: 套个 npm subprocess 包装 OpenClaw-weixin
OpenSquilla 写一个 channel, 后台 spawn `node @tencent-weixin/openclaw-weixin-cli` 子进程, 把 WebSocket 转给 OpenSquilla 的 gateway
- 快速出活儿, 复用现成 npm 代码
- 增加一个进程

### 路径 C: 直接 port `@tencent-weixin/openclaw-weixin` (npm 包) 的逻辑到 Python
读 npm 包的源码, 用 Python 重写一个等效的扫码登录 + 长连接
- 干净, 但需要读懂 npm 包内部协议
- 工作量大

## 我的选择 (按主人"赶紧完成" + 自主决策)

**路径 B** (套 npm subprocess) — 最快 + 复用现成 npm 代码 + 不重写协议
- OpenSquilla channel 类 = 薄薄一层, 后台 spawn npm 进程
- 把 npm 进程的二维码 URL 转给 OpenSquilla gateway → 主人在 OpenSquilla 收到的渠道里能看到
- 主人在微信扫后, 消息经 npm 进程 → OpenSquilla channel

## 实施步骤

1. 读 `@tencent-weixin/openclaw-weixin` npm 包源码看协议
2. 看 OpenSquilla 自定义 channel 怎么写 (例: 仿照 channels/wecom.py)
3. 写 `channels/wechat_clawbot.py` (薄封装)
4. 写到 OpenSquilla channel registry
5. 启动 OpenSquilla gateway + 这个 channel + 二维码
6. 主人微信扫码 + 验证

## 边界

- ❌ 不动 OpenClaw 主进程 (但 OpenClaw 已经装好 wechat plugin, 不冲突)
- ❌ 不接 HK Trading Bot live
- ❌ 不修改 OpenSquilla 核心代码 (只在 channels/ 加文件)
- ✅ OpenSquilla 现已装, 直接动 venv

## 主人隐含 2 件积压还在

- "只止盈不止损" 拍板 🅰🅱️ — 1h+ 未决
- paper sim bot 离线 36h+ — 重启 / 检查 / 放

## 状态

🚧 IN PROGRESS — 30-60 min 动手