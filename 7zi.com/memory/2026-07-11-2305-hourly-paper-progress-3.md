# 2026-07-11 23:05 CST — Paper Sim 每小时找方法 #3 (日终 5min 后, 数据无变化)

**触发**: cron 40459cd1-c701-4f29-beb6-2e1dd9aa72d4 (每小时 cron #3)
**对比**: 22:03 #2 → 23:00 日终 (双触发) → 23:05 hourly #3

**v3_paper.py 状态**: PID 3875689 alive, 启动 2h43min (20:22 重启过)

## 6 策略小时汇总 #3 (23:05 CST, 与 #2 #日终 100% 一致)

| 策略 | closed | WR | pnl_gross | total | 状态 |
|---|---|---|---|---|---|
| **S5_ULTRA_TIGHT_30MIN** 🎯 | 5 | **60.0%** | **+$0.50** | **+$0.50** | ⭐ 候选稳定 |
| S6_REVERSE_TIGHT_30MIN | 5 | 40.0% | -$0.03 | -$0.03 | 反向亏 |
| S3_TIGHT_TPSL | 3 | 33.3% | -$0.31 | -$0.31 | 退位 |
| S1_MOMENTUM_BASELINE | 2 | 0% | -$0.49 | -$0.49 | ❌ |
| S2_REVERSE_5MIN | 2 | 0% | -$0.60 | -$0.60 | ❌ |
| S4_WIDER_TPSL | 2 | 0% | -$2.11 | -$2.11 | ❌ worst |

**Grand total**: **-$3.03** (无变化)

## 推送判断

- ❌ S5 候选已在 cron #21 21:35 (messageId 4237) + 日终 cron 23:00 (messageId 4238) 推过
- ❌ best_strategy 切换 (S5 持续 best)
- ❌ 6 策略总亏 < -$5 (现 -$3.03, +$1.97 buffer)
- ❌ v3_paper.py 挂 (alive PID 3875689)

✅ **不推** (#77 strict + 日终 5min 内已推 + 数据无变化)

## 特征分析 (持续)

S5 胜出特征 (与 #2 一致):
1. 顺势 — chg24h ±7%/±15% 信号后续走势仍持续概率高
2. 紧 TP 0.8% — 30min 内多次触发
3. 紧 SL 0.5% — 抗反转, 单笔最大亏 $0.15
4. 短 MaxHold 30min — 不扛单

S6 反向失败原因 (与 #2 一致):
- 反向 BUY 押反弹, 但 MOMENTUM_DOWN 信号后价格继续跌
- 反向 SELL 押继续跌, 但 MOMENTUM_UP 信号后价格继续涨

## 下一步

- ⏸️ 等 00:00 7/12 DAILY_CAP reset (~57min)
- ⏸️ 等 23:00 7/12 日终对比 (~24h)
- ⏸️ 等 23:34 hourly cron #4 (~30min)
- ⏸️ **等主人 A/B/C 拍板** (TG messageId 4238 已问)

## 自主决策留痕 (第七原则)

**改动**: 无 (纯观察)
**触发**: N/A
**是否越界**: 否

## nextEvents

- 🟡 00:00 7/12 DAILY_CAP 全 reset (~57min, S5/S6 重新可开 5+5 笔)
- 🔵 23:34 hourly cron #40459cd1 #4 (~30min)
- 🟢 7/12 23:00 日终对比 (~24h)
- 🟢 主人 35d+ SSH 静默 #77 strict — 等主人拍板 A/B/C