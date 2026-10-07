# 2026-07-22 22:01 — OpenSquilla QR 过期 + 重新生成

## 主人反馈 (Telegram msg 4676)

> "二维码已经过期 请重新生成"

## 已做

1. ✅ 停 OpenSquilla gateway (21:56 那次启动)
2. ✅ 重启 OpenSquilla gateway (PID 85087 → 新进程)
3. ✅ start_login 重新拿 ilink QR
4. ✅ 新 QR URL: `https://liteapp.weixin.qq.com/q/7GiQu1?qrcode=13f945bb2e160c1a967031c286dacbc9&bot_type=3`
5. ✅ PNG 生成 (1112 bytes)
6. ✅ Telegram msg 4681 push 给主人

## 上一个 QR 时间线

- 21:55:55 OpenSquilla gateway 起, QR = e1ff8a0662ad2ffc...
- 21:56:43 Telegram msg 4671 发给主人
- 22:01 主人说 QR 过期 (5 分钟没扫)

## ilink QR 默认有效期

查协议: ilink/bot/get_bot_qrcode 返回的 QR **没有显式 TTL**, 但腾讯设计就是短期 (一般 5-10 分钟)。如果主人没扫, QR 会 expire.

## 为什么主人没扫

- 主人可能在忙 HK bot
- 主人可能没看到
- 主人可能觉得 2 个 bot 太烦
- 主人可能手快, 看到 msg 就点但没扫完

## 后续预防

- 主人扫前: QR 会 expire, 主人要"立刻扫"
- 主人扫后: 应"立刻"发 "hi" 测试, 不然 2 个 bot 都挂着 = 浪费
- 如果再次过期: 我有脚本可以 30s 内重新生成 + push

## 关联决策

- ✅ 主人 18:08 拍: 两个 bot 也挺好的 可以
- ✅ 主人 22:01 拍: 重新生成 QR
- ⏳ 主人: 待扫新 QR

## 状态

- OpenSquilla gateway 18791 跑着, wechat channel 后台轮询
- 等主人扫 + 发消息测试