# 🟢 PAPER SIM 每小时找方法 (#8) — 2026-07-12 05:07 CST

> cron #40459cd1 #8 fire 05:07 CST. bash /opt/trader/paper/paper-progress-check.sh fresh fetch.

## 6 策略 grid (05:07 CST, 38 closed + 0 open)
| 策略 | closed | W/L | WR | pnl | vs #7 (04:05) | verdict |
|---|---|---|---|---|---|---|
| **S5_ULTRA_TIGHT_30MIN** ⭐ BEST | 10 | 5/5 | 50.0% | **+$0.4988** | +$0.50 (持平) | ⭐ BEST 持续 |
| S6_REVERSE_TIGHT_30MIN | 10 | 5/5 | 50.0% | +$0.3111 | +$0.31 (持平) | 候选稳 |
| S2_REVERSE_5MIN | 4 | 2/2 | 50.0% | +$0.4649 | +$0.46 (持平) | 反向交叉验证 |
| S3_TIGHT_TPSL | 6 | 1/5 | 16.7% | -$1.3973 | -$1.40 (持平) | ❌ 退步 |
| S1_MOMENTUM_BASELINE | 4 | 0/4 | 0.0% | -$1.5733 | -$1.57 (持平) | ❌ |
| S4_WIDER_TPSL | 4 | 1/3 | 25.0% | -$2.9132 | -$2.91 (持平) | ❌ worst |
| **GRAND TOTAL** | **38** | **14/24** | **36.8%** | **-$4.6090** | -$4.61 (持平) | **+$0.39 buffer ⚠️ TIGHT** |

## vs #7 (04:05 → 05:07, +62min) 变化
- **0 new closes 持续** — STATUS QUO 完全一致 (浮点 $0.00 delta)
- S5 ⭐ BEST pnl +$0.50 持续 62min
- S6 +$0.31 持续 62min
- 0 open positions 持续 (全静默 wait 信号)
- paper_summary.json 04:43 更新 (24min stale, 但数字一致)
- 04:43 5min cron 已 fire (#56 推断) — STATUS QUO confirmed
- paper_state.json 04:43 stale (上次 fetch 时已 cache)
- cron cc88ad27 5min next 05:10
- 主人口味严解释 "找到" = closed≥15 + WR>55% + pnl>0 + max DD<1%
- 主人 35d+ SSH 静默 #77 strict 不 push

## 自主决策 (主人 23:57 + 00:25 + 02:17 "继续" 授权延续)
- ❌ 不切 S5/S6 实仓 (closed=10 < 15 + WR=50% 临界, 样本仍薄)
- ✅ paper mode 持续 (主人 06:30 边界 "找方法")
- ✅ 5min cron cc88ad27 + 每小时 cron 40459cd1 + 23:00 cron 536879d2 持续
- ✅ 不 push 主人 (#77 strict, 异常才推: Grand<-5 / best 切换 / 进程挂)
- ✅ 写 memory + HEARTBEAT 留痕 (第七原则)
- ✅ main account bal/avail $607.06 闲置, 0 positions

## 当前状态 (05:07 CST)
- PID 3875689 alive 8h44m (20:22 重启)
- 0 open positions
- main account bal/avail $607.06 / 0 positions ✅
- 5min cron cc88ad27 next 05:10
- 每小时 cron 40459cd1 #9 next 06:00 (~53min)
- 23:00 日终 cron 536879d2 next 23:00 (~17h53m)
- 主人 35d+ SSH 静默 #77 strict

## 风控 (P0/P1)
- ✅ P0 paper mode 0 真仓风险
- ✅ P0 main bal $607.06 / avail $607.06 / 0 positions
- ✅ P1 v3_paper PID 3875689 alive 8h44m
- ✅ P1 risk_manager PID 922 alive
- ✅ P1 6 策略 grid 独立 SQLite (paper_trades.db)
- ✅ P1 100% Binance ticker 数据
- ⚠️ Grand -$4.61 接近 -$5 KILL (+$0.39 buffer TIGHT)
- ⚠️ S5/S6 WR=50% 临界 (严解释需 >55%), closed=10 差 5 笔 ≥15
- ⚠️ 62min 无新 close = 信号池干涸 (v3 信号门槛太严, 这是设计选择)
- ⚠️ 主人 35d+ SSH 静默 #77 strict

## nextEvents (timing)
- 🔵 **05:10 5min cron cc88ad27-N** (~3min)
- 🔵 **06:00 每小时 cron 40459cd1 #9** (~53min, 强制汇总)
- 🟢 **05:30 S5/S6 持续性评估** (WR=50% 持续 9h+)
- 🟢 **23:00 7/12 paper 日终 cron 536879d2** (~17h53m)
- 🟢 主人 35d+ SSH 静默 #77 strict 不 push

## Decision
**HEARTBEAT_OK ⭐⭐⭐ STATUS QUO 自主决策 HOLD** — 主人 23:57/00:25/02:17 授权延续, 已自主拍板不切实盘, paper 持续
- S5 ⭐ BEST by pnl (+$0.50, closed=10 WR=50% 顺势紧参数) 持续 62min+
- S6 候选 by 样本 (closed=10 WR=50% 反向紧参数, 路径独立)
- 62min 无新 close = 信号池干涸, 但这是设计选择 (主人 06:30 边界)
- 不修任何 bug (#77 strict + 主人 autonomy directive from 06:30)
- 不修信号门槛 (#77 strict, 主人 06:30 设计)
- 不 push 主人 (#77 strict, 35d 静默, 异常才推)
- 关注: 05:10 cron / 06:00 hourly #9 / Grand -$5 KILL buffer / closed≥15 升级触发