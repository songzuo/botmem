# 2026-07-12 03:04 CST — Paper Sim 每小时找方法 #7 (steady-state, S5 best 稳)

**触发**: cron 40459cd1-c701-4f29-beb6-2e1dd9aa72d4 (每小时 cron #7)
**对比**: 02:04 #6 → 02:41 cron #26 (S5 closed 10) → 03:04 hourly #7 (23min 后)

**v3_paper.py 状态**: PID 3875689 alive, 启动 6h42min (20:22 重启过)

## 6 策略小时汇总 #7 (03:04 CST, 无变化)

| 策略 | closed | WR | pnl_gross | open | total |
|---|---|---|---|---|---|
| **S5_ULTRA_TIGHT_30MIN** 🎯 BEST | 10 | 50.0% | +$0.50 | $0 | +$0.50 |
| **S6_REVERSE_TIGHT_30MIN** ⭐ 候选 | 10 | 50.0% | +$0.31 | $0 | +$0.31 |
| S2_REVERSE_5MIN | 4 | 50.0% | +$0.46 | $0 | +$0.46 |
| S3_TIGHT_TPSL | 6 | 16.7% | -$1.40 | $0 | -$1.40 |
| S1_MOMENTUM | 4 | 0% | -$1.57 | $0 | -$1.57 |
| S4_WIDER_TPSL | 4 | 25.0% | -$2.91 | $0 | -$2.91 |

**Grand total**: **-$4.61** (无变化, 距 -$5 KILL +$0.39 buffer TIGHT)

## 推送判断

- ❌ best_strategy 切换 (S5 持续 best, 02:41 cron #26 已推过)
- ❌ S5/S6 closed >= 10 (02:41 已推过, TG 4264)
- ❌ best_strategy pnl > 0 (02:41 已推过)
- ⚠️ 6 策略总亏 < -$5 (现 -$4.61, +$0.39 buffer, 仍未破)
- ❌ v3_paper.py 挂

✅ **不推** (#77 strict + 数据无变化 + 02:41 已推过双规则)

## 特征分析 (steady-state)

**S5/S6 双候选稳态**:
- 都 closed=10, WR=50%, pnl > 0
- S5 pnl > S6 (+$0.50 vs +$0.31) → S5 单笔均值更高
- 等下一波信号触发 (现 0 open positions, 23min 无新 close/open)

**总累计 (20h22m 找方法进度)**:
- 总 closed: 4+4+6+4+10+10 = 38 笔
- 平均每策略 6.3 笔
- S5 + S6 各 10 笔最成熟

## 风控 (P0/P1)

- ✅ P0 main bal/avail $607.06 — 闲置
- ✅ P0 paper 0 真仓订单
- ⚠️ Grand -$4.61 vs -$5 KILL 仅 +$0.39 buffer (TIGHT)
- ✅ v3_paper.py PID 3875689 alive 6h42m
- ✅ risk_manager PID 922 alive
- ⚠️ 6 策略 0 open positions (等下一波信号)
- ⚠️ 主人 35d+ SSH 静默 #77 strict

## 自主决策留痕 (第七原则)

**改动**: 无 (纯观察)
**触发**: N/A
**是否越界**: 否

## nextEvents

- 🟡 03:09 paper 5min cron (~5min)
- 🔵 04:03 hourly cron #8 (~1h)
- 🟢 23:00 7/12 日终对比 (~20h)
- 🟢 主人 35d+ SSH 静默 #77 strict — 等 A/B/C/D 拍板 (TG 4264)