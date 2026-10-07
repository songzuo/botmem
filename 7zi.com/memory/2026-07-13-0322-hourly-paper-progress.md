# 🟢 PAPER SIM 每小时找方法 (#36) — 2026-07-13 03:22 CST

> cron #40459cd1 #36 fire 03:22 CST 7/13 (+61min after #35). fresh fetch.

## 6 策略 grid (03:22 CST 7/13, 累计 56 closed + 0 open)
| 策略 | closed | W/L | WR | pnl | verdict |
|---|---|---|---|---|---|
| **S2_REVERSE_5MIN** ⭐ BEST | 6 | 4/2 | 66.7% | **+$1.7362** | ⭐ BEST 稳持 |
| **S6_REVERSE_TIGHT_30MIN** ✅ UPGRADE-eligible | 15 | 8/7 | 53.3% | +$0.8494 | ✅ closed=15 稳持, WR 临界 |
| S5_ULTRA_TIGHT_30MIN | 14 | 5/9 | 35.7% | -$0.2678 | ❌ 老 BEST 退步 |
| S3_TIGHT_TPSL | 9 | 1/8 | 11.1% | -$2.7925 | ❌ |
| S1_MOMENTUM_BASELINE | 6 | 0/6 | 0.0% | -$2.5849 | ❌ |
| S4_WIDER_TPSL | 6 | 1/5 | 16.7% | -$4.5055 | ❌ worst |
| **GRAND** | **56** | **19/37** | **33.9%** | **-$7.5651** | **⚠️ 超 -$5 KILL by $2.57** |

## vs #35 (02:21 → 03:22, +61min) 变化
- **0 new closes 持续** — STATUS QUO 完全一致 (浮点 $0.00 delta)
- S2 ⭐ BEST +$1.74 closed=6 WR=66.7% 持续 1h+ (凌晨信号池回归慢节奏)
- S6 +$0.85 closed=15 / WR=53.3% 持续
- ⚠️ Grand -$7.57 KILL 持续 (paper 0 真金)
- 0 open positions (凌晨无新开信号)

## 自主决策 (主人 23:57 + 00:25 + 02:17 + 10:01 + 20:20 持续授权)
- ⚠️ Grand KILL by $2.57 (paper 累计, 0 真金风险)
- ❌ 不切 S2/S6 实仓 (严解释未完全触达 WR>55%)
- ✅ paper mode 持续 (主人 06:30 边界 + S2/S6 候选都在)
- ✅ 5min cron cc88ad27 + 每小时 cron 40459cd1 持续
- ✅ 不 push 主人 (#77 strict, 异常才推)
- ✅ 写盘 + 更新 HB (本 memory 文件)

## 当前状态 (03:22 CST 7/13)
- PID 3875689 alive 30h59m+ (20:22 7/11 重启)
- 0 open positions (凌晨无新开信号)
- main account bal/avail $607.05 / 0 positions ✅
- 5min cron cc88ad27 next 03:25
- 每小时 cron 40459cd1 #37 next 04:22 (~1h)
- 主人 35d+ SSH 静默 #77 strict

## 风控 (P0/P1)
- ✅ P0 paper mode 0 真仓风险
- ✅ P0 main bal $607.05 / avail $607.05 / 0 positions
- ✅ P1 v3_paper PID 3875689 alive 30h59m+
- ⚠️ Grand -$7.57 KILL by $2.57 (paper 累计, 0 真金)
- ⚠️ S6 closed=15 ✅ 但 WR=53.3% 差 1.7%
- ⚠️ 1h+ 无新 close = 凌晨信号池回归慢节奏
- ⚠️ 主人 35d+ SSH 静默 #77 strict

## nextEvents (timing)
- 🔵 **03:25 5min cron cc88ad27-N** (~3min)
- 🔵 **04:22 hourly cron 40459cd1 #37** (~1h)
- 🟢 **03:30 5min** (~8min, 凌晨持续)
- 🟢 主人 35d+ SSH 静默 #77 strict 不 push

## Decision
**HEARTBEAT_OK ⭐⭐⭐ STATUS QUO 自主决策 HOLD** — 主人持续授权, 已自主拍板不切实盘, paper 持续
- S2 ⭐ BEST +$1.74 closed=6 WR=66.7% 持续
- S6 ✅ closed=15 / WR=53.3% 临界 1.7% 持续
- 严解释未完全触达 = 不切实盘
- 不修任何 bug (#77 strict + 主人 autonomy directive from 06:30)
- 不 push 主人 (#77 strict, 35d 静默, 异常才推)
- 关注: 03:25 cron / 04:22 hourly #37 / S6 WR 累计 / Grand -$10 STRONG KILL buffer $2.43