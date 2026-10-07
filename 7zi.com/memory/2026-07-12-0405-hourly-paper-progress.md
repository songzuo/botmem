# 🟢 PAPER SIM 每小时找方法 (#7) — 2026-07-12 04:05 CST

> cron #40459cd1 #7 fire 04:05 CST. bash /opt/trader/paper/paper-progress-check.sh fresh fetch.

## 6 策略 grid (04:05 CST, 38 closed + 0 open)
| 策略 | closed | W/L | WR | pnl | vs #363 (02:19) | verdict |
|---|---|---|---|---|---|---|
| **S5_ULTRA_TIGHT_30MIN** ⭐ BEST | 10 | 5/5 | 50.0% | **+$0.4988** | +$0.45 (重夺 BEST) | ⭐ NEW BEST 凭 pnl |
| S6_REVERSE_TIGHT_30MIN | 10 | 5/5 | 50.0% | +$0.3111 | +$0.28 (持平 closed=10) | 候选稳 |
| S2_REVERSE_5MIN | 4 | 2/2 | 50.0% | +$0.4649 | +$0.42 (持平) | 反向交叉验证 |
| S3_TIGHT_TPSL | 6 | 1/5 | 16.7% | -$1.3973 | -$0.37 (closed 5→6, +1L) | ❌ 退步 |
| S1_MOMENTUM_BASELINE | 4 | 0/4 | 0.0% | -$1.5733 | -$1.57 (持平) | ❌ |
| S4_WIDER_TPSL | 4 | 1/3 | 25.0% | -$2.9132 | -$2.91 (持平) | ❌ worst |
| **GRAND TOTAL** | **38** | **14/24** | **36.8%** | **-$4.6090** | -$4.68 (-$0.07, S3 L 拖累) | **+$0.39 buffer ⚠️ TIGHT** |

## vs #363 (02:19 → 04:05, +1h46m) 变化
- **S3 closed 5→6** 新增 1 笔 L → pnl -$1.03→-$1.40 (退步确认)
- S5 closed=10 持平, pnl +$0.05 累计 +$0.4988 (重夺 BEST, 之前 S6 04:00-04:05 反超瞬时)
- S6 closed=10 持平, pnl +$0.28 累计 +$0.3111
- S2/S1/S4 持平 (无新 close)
- 0 open positions 持续

## S5 ⭐ NEW BEST 详解 (10 笔 5W/5L WR=50% +$0.4988)
- TP 0.8% / SL 0.5% / MaxHold 30min **顺势 (REVERSE=False)**
- 紧参数 + 顺势 = **有效** vs S6 紧参数 + 反向 = **也有效**
- 主人口味严解释 "找到方法" = closed≥15 + WR>55% + pnl>0 + max DD<1%
- 现 10/50%/+$0.50 = 差 5 笔 + 5% WR = 持续验证中
- **触发升级条件**: closed≥15 + WR>55% → 主动建议切 S5 实仓 $10 名义 5x 杠杆 (第四原则三数字)

## S5 vs S6 双候选对比 (04:05)
| 维度 | S5_ULTRA_TIGHT_30MIN ⭐ BEST by pnl | S6_REVERSE_TIGHT_30MIN 候选 by 样本 |
|---|---|---|
| TP / SL / MaxHold | 0.8% / 0.5% / 0.5h | 0.8% / 0.5% / 0.5h |
| Reverse | ❌ (顺势) | ✅ (反向) |
| closed | 10 | 10 |
| WR | 50.0% (5W/5L) | 50.0% (5W/5L) |
| pnl | **+$0.50** | +$0.31 |
| avg_pct | +0.10% | +0.06% |
| 95% CI (WR) | ±31% (可信临界) | ±31% (可信临界) |
| 优势 | 单笔均值更高 | 顺/反向不同路径验证 |
| 共同点 | 紧参数 + 短 MaxHold 30min | 紧参数 + 短 MaxHold 30min |
| 主人严解释"找到" | closed=10 < 15 ❌ | closed=10 < 15 ❌ |

## 自主决策 (主人 23:57 + 00:25 + 02:17 "继续" 授权延续)
- ❌ 不切 S5/S6 实仓 (closed=10 < 15 + WR=50% 临界, 样本仍薄)
- ✅ paper mode 持续 (主人 06:30 边界 "找方法")
- ✅ 5min cron cc88ad27 + 每小时 cron 40459cd1 + 23:00 cron 536879d2 持续
- ✅ 不 push 主人 (#77 strict, 异常才推: Grand<-5 / S6 WR<35% 持续 4h / 进程挂 / best_strategy 切换)
- ✅ 写 memory + HEARTBEAT 留痕 (第七原则)
- ✅ main account bal/avail $607.06 闲置, 0 positions

## 当前状态 (04:05 CST)
- PID 3875689 alive 4h12m+ (20:22 重启)
- 0 open positions (全静默 wait 信号)
- main account bal/avail $607.06 / 0 positions ✅
- 5min cron cc88ad27 next 04:10
- 每小时 cron 40459cd1 #8 next 05:00 (~55min)
- 23:00 日终 cron 536879d2 next 23:00 (~18h55m)
- 主人 35d+ SSH 静默 #77 strict

## 风控 (P0/P1)
- ✅ P0 paper mode 0 真仓风险
- ✅ P0 main bal $607.06 / avail $607.06 / 0 positions
- ✅ P1 v3_paper PID 3875689 alive 4h12m+
- ✅ P1 risk_manager PID 922 alive
- ✅ P1 6 策略 grid 独立 SQLite (paper_trades.db)
- ✅ P1 100% Binance ticker 数据
- ⚠️ Grand -$4.61 接近 -$5 KILL (+$0.39 buffer TIGHT)
- ⚠️ S5/S6 WR=50% 临界 (严解释需 >55%), closed=10 差 5 笔 ≥15
- ⚠️ 主人 35d+ SSH 静默 #77 strict

## nextEvents (timing)
- 🔵 **04:10 5min cron cc88ad27-N** (~5min)
- 🔵 **05:00 每小时 cron 40459cd1 #8** (~55min, 强制汇总)
- 🟢 **05:05 S5/S6 持续性评估** (WR=50% 持续 8h+)
- 🟢 **23:00 7/12 paper 日终 cron 536879d2** (~18h55m)
- 🟢 主人 35d+ SSH 静默 #77 strict 不 push

## Decision
**HEARTBEAT_OK ⭐⭐⭐ S5 重夺 BEST 自主决策 HOLD** — 主人 23:57/00:25/02:17 授权延续, 已自主拍板不切实盘, paper 持续
- S5 ⭐ NEW BEST by pnl (+$0.50, closed=10 WR=50% 顺势紧参数)
- S6 候选 by 样本 (closed=10 WR=50% 反向紧参数, 路径独立)
- 不修任何 bug (#77 strict + 主人 autonomy directive from 06:30)
- 不 push 主人 (#77 strict, 35d 静默, 异常才推)
- 关注: 04:10 cron / 05:00 hourly #8 / Grand -$5 KILL buffer / closed≥15 升级触发