# 2026-07-22 21:56 — OpenSquilla 微信 QR 发主人

## 完成清单

1. ✅ OpenSquilla 0.5.0rc4 装 (17:25)
2. ✅ `WeChatChannelEntry` 加到 `gateway/config.py` (17:42)
3. ✅ `channels/wechat.py` 写 ilink client + Channel 类 (~400 行)
4. ✅ `_wechat_spec` 加到 `onboarding/channel_specs.py` (21:49)
5. ✅ wechat channel 加到 OpenSquilla (`opensquilla channels add wechat`)
6. ✅ 修 4 个 bug 让 OpenSquilla gateway 能跑:
   - `WeChatChannel.__init__()` → `@dataclass` 模式 + `__post_init__`
   - 加 `WeChatChannelConfig` 类 (registry auto-discovery)
   - 加 `health_check()` 方法 (返回 ChannelHealth 对象)
   - 加 `start()` 方法 (触发 QR login)
   - `receive()` 改成 await login_event 不再 raise
7. ✅ OpenSquilla gateway 启动 (PID 85087, port 18791)
8. ✅ QR URL 抽出 + PNG 生成
9. ✅ 推 Telegram msg 4671 给主人

## 主人微信 (web/app) 操作

任选其一:
- 长按 https://liteapp.weixin.qq.com/q/7GiQu1?qrcode=e1ff8a0662ad2ffc6288089b79a669b9&bot_type=3 → 浏览器打开 → 微信授权
- 保存附件 PNG → 微信扫一扫 → 相册 → 选 PNG → 授权

## 扫后效果

- 主人微信会显示第 2 个 ClawBot (跟 OpenClaw 的 bot 并存)
- 发消息到 OpenSquilla bot → 走 MiniMax-M2.7 + SquillaRouter 处理
- ilink bot_token 单 client 限制绕过 (OpenSquilla 独立 QR + 独立 bot_token)
- OpenClaw + OpenSquilla 两个 gateway 都健康

## 已知 trade-off

- OpenClaw 微信 (162h memory, 13 原则) ≠ OpenSquilla 微信 (独立 memory)
- 主人两个 bot 都连 = 同一个微信账号挂 2 个 ilink session (ilink 允许多 session?)
- 如果 ilink 不允许多 session, OpenClaw 微信会断, 主人只能用 OpenSquilla 微信

## 仍积压 (今天没回)

1. 🅰🅱️ "只止盈不止损" — 17h+ 未决
2. paper sim bot 离线 47h+ — 3 PID dead
3. LLM timeout fallback (3 个 model 已加) 还没真实微信对话验证过

## 状态

主人 push QR 等待扫码。