# 2026-09-13 05:05 — bookslot dedup 24h (主人指令)

## 主人问题
"一个信息只发一次 目前是有故障 导致发很多次"

## 根因
Telegram 通道没去重, 每次 `/api/book` submission 都推一条 Telegram, 主人一天内收到 7 条 Zhuo Song + 4 条 Yunfeng Hu 重复。

## 修法 (05:06 完成)

1. 加 `DEDUP_PATH = "/var/lib/bookslot/notify_dedup.json"` 常量
2. 加 `_dedup_load/_dedup_save/_dedup_should_notify` 函数 (atomic write + stale sweep)
3. 在 `_deliver_notifications` 开头调用 `_dedup_should_notify(name, contact)`
4. 如果返回 False → 跳过微信/Telegram/queue, 只存 bookings.jsonl, log `{"deduped": true}`

## 备份
- `bookslot.py.bak_pre_dedup_20260913_050546`

## 测试 (05:07 验证)
- 第一次 DedupTest → 推送 + 入 dedup index
- 35s 后用不同 IP (CF-Connecting-IP 99.99.99.99) → bypass IP 限速 → 走 dedup → 返回 `{"deduped": true}` 不推送
- 主人 Telegram 收到 1 条 DedupTest (第二次被 dedup)

## 注意事项
- dedup window: 24h (DEDUP_WINDOW_SECONDS = 24*3600)
- key: `f"{name.lower()}|{contact.lower()}"` — 大小写不敏感, 前后空格 trim
- atomic write: tmp + os.replace, 避免部分写入破坏 dedup
- stale sweep: 当 dedup 字典 > 64 entries 时触发, 清 > 24h 的 entries
- dedup 失败 (e.g. disk 满) → 退化为静默不推 (异常路径), 但不阻断 submission 存储

## 同步写的
- MEMORY.md 第二十七原则 (iLink 双通道 + 假活识别 + 服务端风控)
- HEARTBEAT.md (5:08 更新)
