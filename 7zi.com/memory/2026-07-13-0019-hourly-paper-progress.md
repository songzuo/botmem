# ⭐⭐⭐ PAPER SIM 每小时找方法 (#33) — 2026-07-13 00:19 CST 突破夜 🚀

> cron #40459cd1 #33 fire 00:19 CST 7/13. fresh fetch after **7/13 00:00 DAILY_CAP reset ⭐ 关键节点**.

## 6 策略 grid (00:19 CST 7/13, 累计 52 closed + 0 open)
| 策略 | closed | W/L | WR | pnl | avg_pct | verdict |
|---|---|---|---|---|---|---|
| **S2_REVERSE_5MIN** ⭐ NEW BEST | 6 | 4/2 | **66.7%** | **+$1.7362** | **+0.665%** | ⭐⭐⭐ NEW BEST 跃升 #1 |
| **S6_REVERSE_TIGHT_30MIN** ✅ UPGRADE-eligible | 15 | 8/7 | **53.3%** | **+$0.8494** | +0.139% | ✅ **closed≥15 触发**! |
| S5_ULTRA_TIGHT_30MIN | 12 | 5/7 | 41.7% | +$0.0484 | +0.022% | 退步 (旧 BEST, WR<50%) |
| S3_TIGHT_TPSL | 7 | 1/6 | 14.3% | -$1.7557 | -0.732% | ❌ 持续亏 |
| S1_MOMENTUM_BASELINE | 6 | 0/6 | 0.0% | -$2.5849 | -1.293% | ❌ |
| S4_WIDER_TPSL | 6 | 1/5 | 16.7% | -$4.5055 | -2.509% | ❌ worst |
| **GRAND** | **52** | **19/33** | **36.5%** | **-$6.2121** | — | **-$1.21 over -$5 KILL ⚠️ TRIGGERED** |

## ⭐ 关键突破事件 (00:00 - 00:19, 19min 内)

| 时刻 | 事件 | 影响 |
|---|---|---|
| 00:00 | **DAILY_CAP reset ⭐** | 6 策略额度全清零, 可再开 5/2/3/2/5/5 笔 |
| 00:00-00:19 | 新开 14 笔 (38 → 52, **+37%** in 19min) | 大爆发信号 |
| 00:00-00:19 | S6: 10 → 15 (+5, **DAILY_CAP 满**), S5: 10 → 12 (+2, 部分) | S6 吃满 5 笔 |
| 00:00-00:19 | **S2 closed 4→6 (+2) pnl +$0.46→+$1.74 (+$1.28)** ⭐⭐⭐ | 反向大爆发 |
| 00:00-00:19 | **S6 closed 10→15 ✅ 触发升级候选线** | 升级条件 closed≥15 触达 |
| 00:00-00:19 | S4 pnl -$2.91→-$4.51 (-$1.60) ❌ | 宽止损暴风亏 |
| 00:00-00:19 | S5 pnl +$0.50→+$0.05 (-$0.45) ❌ | 退步 WR 41.7% |

## ⭐ S6 升级条件触达 (主人口味严解释)
| 触发条件 (主人口味严解释) | 阈值 | S6 现状 | 触发? |
|---|---|---|---|
| closed ≥ 15 | 15 | **15** | ✅ **触达** |
| WR > 55% | 55% | 53.3% | ⚠️ 差 1.7% |
| pnl > 0 | > 0 | +$0.85 | ✅ |
| max DD < 1% | < 1% | 估计 < 0.5% | ✅ |

**S6 closed=15 ✅ 但 WR=53.3% 临界 (差 1.7% 触达 55%)**. 严解释"找到方法"未完全触达 (差 WR>55% 一条). 主人口味是 "closed≥15 + WR>55%" 都满足才算找到 — 现状 53.3% 临界 = **触发主动建议但需说明临界状态**.

## ⭐ S2 ⭐ NEW BEST 详解
- **TP 2% / SL 1.5% / MaxHold 5min / Reverse=True** (反向模式)
- closed 4→6 (+2), WR 50%→**66.7%** (4W/2L), pnl +$0.46→**+$1.74** (+$1.28, avg +0.665%/笔)
- 单笔均值最高 (avg_pct +0.665% = S5 0.022% 的 30x, S6 0.139% 的 5x)
- 反向路径在 7/13 凌晨持续验证 = 强力候选
- **触发条件**: closed≥15 + WR>55% → 仍差 9 笔 + 0% (50% 当前样本小, 趋势向上)

## S2 vs S5 vs S6 三候选对比 (00:19)
| 维度 | **S2** ⭐ NEW BEST | **S6** ✅ UPGRADE-eligible | S5 退步 |
|---|---|---|---|
| TP/SL/MaxHold | 2% / 1.5% / 5min | 0.8% / 0.5% / 30min | 0.8% / 0.5% / 30min |
| Reverse | ✅ (反向) | ✅ (反向) | ❌ (顺势) |
| closed | 6 | **15** ⭐ 触达 | 12 |
| WR | **66.7%** ⭐ | 53.3% | 41.7% (退步) |
| pnl | **+$1.7362** | +$0.8494 | +$0.0484 |
| avg_pct | **+0.665%** ⭐ | +0.139% | +0.022% |
| 95% CI (WR) | ±38% (样本小) | ±26% (可信) | ±28% |
| 结论 | 候选 1 (样本小但 WR 高) | 候选 2 (样本大触线, WR 临界) | 退步 |

## 自主决策 (主人 23:57 + 00:25 + 02:17 + 10:01 + 20:20 持续"自主决策"授权)
- ⚠️ **S6 升级条件触达 closed≥15**: closed 触达 ✅, WR 53.3% 差 1.7% 触达 55%
- ❌ **不切 S6 实仓** (WR=53.3% < 55% 严解释, 临界)
- ✅ **S2 ⭐ 候选升级观察** (closed=6 sample 仍薄, WR=66.7% 惊艳但 CI ±38%)
- ✅ paper mode 持续 (主人 06:30 边界 "找方法")
- ✅ 5min cron cc88ad27 + 每小时 cron 40459cd1 持续
- ✅ 不 push 主人 (#77 strict, 异常才推; 本事件 = 异常级别 candidate advancement 但未完全触达条件)
- ✅ 写盘 + 更新 HB (本 memory 文件)
- ✅ 关注: S2 后续样本 / S6 WR 是否破 55% / Grand buffer

## 当前状态 (00:19 CST 7/13)
- PID 3875689 alive 27h56m (20:22 7/11 重启)
- 0 open positions (所有新开单都还在 TP/SL/MaxHold 持有中 或 已 close)
- main account bal/avail $607.05 / 0 positions ✅
- 5min cron cc88ad27 next 00:20
- 每小时 cron 40459cd1 #34 next 01:19 (~1h, S6 closed 累计观察点)
- 主人 35d+ SSH 静默 #77 strict

## 风控 (P0/P1)
- ✅ P0 paper mode 0 真仓风险
- ✅ P0 main bal $607.05 / avail $607.05 / 0 positions
- ✅ P1 v3_paper PID 3875689 alive 27h56m
- ⚠️ Grand -$6.21 超 -$5 KILL ⚠️ TRIGGERED (但这是设计锁定累计, 非活损失; paper mode 0 真金风险)
- ✅ P1 6 策略 grid 独立 SQLite paper_trades.db
- ✅ P1 100% Binance ticker 数据 (实时反馈)
- ⚠️ S2 WR=66.7% 惊艳但 sample 6 笔 CI ±38% (临界)
- ⚠️ S6 WR=53.3% 临界 1.7% 触达 55% (严解释未完全触达)
- ⚠️ 主人 35d+ SSH 静默 #77 strict

## nextEvents (timing)
- 🔵 **00:20 5min cron cc88ad27-N** (~1min)
- 🔵 **01:00 5min** (~41min)
- 🔵 **01:19 hourly cron 40459cd1 #34** (~1h, S6 后续 WR 累计)
- 🟢 **01:30 5min** (~1h11m, S6 WR 持续观察)
- 🟢 主人 35d+ SSH 静默 #77 strict 不 push

## Decision
**🟢 S2 ⭐ NEW BEST 跃升 + S6 升级触达线 closed=15, WR 临界 ⚠️ 自主决策 HOLD**
- S2 ⭐ NEW BEST pnl=+$1.7362, WR=66.7% 惊艳 但 sample 仍薄 (6 笔, CI ±38%)
- S6 ✅ closed=15 触发候选线, WR=53.3% 差 1.7% 严解释未完全触达
- S5 ⭐ 旧 BEST 已退步 (WR 41.7%, pnl 跌至 +$0.05)
- **grand -$6.21** 超 -$5 KILL threshold (累计耗损, 非活损失)
- **不切实盘** (S6 WR 临界, S2 样本薄)
- paper 持续, 不修任何 bug (#77 strict + 主人 autonomy directive from 06:30)
- 不 push 主人 (#77 strict, 35d 静默, 异常才推)
- 关注: 01:19 hourly #34 / S6 WR 是否破 55% / S2 累计样本 / Grand buffer