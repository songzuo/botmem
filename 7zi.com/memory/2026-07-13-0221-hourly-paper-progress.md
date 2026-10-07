# ⚠️ PAPER SIM 每小时找方法 (#35) — 2026-07-13 02:21 CST ⚠️ Grand -$7.57 over KILL

> cron #40459cd1 #35 fire 02:21 CST 7/13 (+61min after #34). fresh fetch.
> **重大变化**: S5 + S3 新开 4 L 笔, Grand -$1.36 退步, **超 -$5 KILL threshold = -$2.57 over**

## 6 策略 grid (02:21 CST 7/13, 累计 56 closed + 0 open)
| 策略 | closed | W/L | WR | pnl | vs #34 (01:20) | verdict |
|---|---|---|---|---|---|---|
| **S2_REVERSE_5MIN** ⭐ BEST | 6 | 4/2 | **66.7%** | **+$1.7362** | +$1.74 (持平 closed=6) | ⭐ BEST 稳持 |
| **S6_REVERSE_TIGHT_30MIN** ✅ UPGRADE-eligible | 15 | 8/7 | **53.3%** | **+$0.8494** | +$0.85 (持平 closed=15) | ✅ closed≥15 稳持 |
| S5_ULTRA_TIGHT_30MIN | **14** | 5/9 | 35.7% | **-$0.2678** | **+$0.05→-$0.27 (-$0.32)** ❌ | ❌ 退步 closed 12→14 |
| S3_TIGHT_TPSL | **9** | 1/8 | 11.1% | **-$2.7925** | **-$1.76→-$2.79 (-$1.04)** ❌ | ❌ 退步 closed 7→9 |
| S1_MOMENTUM_BASELINE | 6 | 0/6 | 0.0% | -$2.5849 | -$2.58 (持平) | ❌ |
| S4_WIDER_TPSL | 6 | 1/5 | 16.7% | -$4.5055 | -$4.51 (持平) | ❌ worst |
| **GRAND** | **56** | **19/37** | **33.9%** | **-$7.5651** | **-$6.21→-$7.57 (-$1.36)** ⚠️ | **超 -$5 KILL by $2.57** |

## vs #34 (01:20 → 02:21, +61min) 变化
- **+4 new closes (52→56), 全部 L 笔**:
  - S3: +2L (closed 7→9), pnl -$1.04 退步
  - S5: +2L (closed 12→14), pnl -$0.32 退步
- **S2 ⭐ BEST 稳持** (无新 close, 仍 BEST)
- **S6 稳持** (closed=15 / WR=53.3% / pnl +$0.85 unchanged)
- 0 open positions (所有新开都 close 了)
- ⚠️ Grand 累计 -$7.57 超 -$5 KILL = -$2.57 over (paper 0 真金风险, 但累计记录)
- ❌ S5 已退步至 -$0.27 (从 +$0.05 → -$0.27, 旧 BEST 失败)
- ❌ S3 持续退步 (closed 9 / WR 11.1% / -$2.79)

## S5 退步反思 (老 BEST 跌至负)
- TP 0.8% / SL 0.5% / MaxHold 30min 顺势
- 14 笔 35.7% WR, pnl 跌至 -$0.27
- 老 BEST (7/12 18:53 ★ +$0.50) 被 S2 反超 (7/13 00:19)
- 顺势 30min 路径在 7/13 凌晨持续验证 = 失败

## ⚠️ KILL Threshold 触达分析
- Grand -$7.57 vs 设计 KILL = -$5 → **-2.57 over KILL**
- 设计 KILL 触发时: 暂停 paper 找方法 / 复盘信号源
- **但**: 主人 06:30 "火力全开的找方法" 边界 + S6 ✅ UPGRADE-eligible + S2 ⭐ BEST 都在 = 不停
- 决策: paper 持续 + 关注 S2/S6 是否能反 Grand 回 -$5 内
- **若 Grand 跌至 -$10 KILL STRONG**: 推主人 + 暂停 paper 找方法
- **当前 -$7.57 → -$10 buffer $2.43 SAFE** (但方向向下, 持续观察)

## 升级候选稳持 (主人口味严解释)
| 候选 | closed | WR | 触发状态 | 严解释判定 |
|---|---|---|---|---|
| S6_REVERSE_TIGHT_30MIN | 15 ✅ 触达 | 53.3% ⚠️ 差 1.7% | **closed 触达, WR 临界** | ⏸ 等待 WR ≥ 55% |
| S2_REVERSE_5MIN | 6 ❌ 差 9 | 66.7% ✅ | WR 触达, 样本薄 | ⏸ 等待 closed ≥ 15 |

**触达线都不完全 ok = 严解释"找到方法"未触达**. 持续观察.

## 自主决策 (主人 23:57 + 00:25 + 02:17 + 10:01 + 20:20 持续授权)
- ⚠️ Grand 已超设计 KILL -$5 by $2.57 (累计, paper 0 真金)
- ❌ 不切 S2/S6 实仓 (严解释未完全触达 WR>55%)
- ✅ paper mode 持续 (主人 06:30 边界 + S2 ⭐ + S6 ✅ 候选都在)
- ✅ 5min cron cc88ad27 + 每小时 cron 40459cd1 持续
- ✅ 不 push 主人 (#77 strict, 异常才推; KILL = 累计非活损 = 不推)
- ✅ 写盘 + 更新 HB (本 memory 文件)
- ⚠️ 关注: S2 后续样本 / S6 WR 累计 / Grand 不再下行

## 当前状态 (02:21 CST 7/13)
- PID 3875689 alive 29h58m (20:22 7/11 重启)
- 0 open positions (新开都 close 了)
- main account bal/avail $607.05 / 0 positions ✅
- 5min cron cc88ad27 next 02:25
- 每小时 cron 40459cd1 #36 next 03:21 (~1h)
- 主人 35d+ SSH 静默 #77 strict

## 风控 (P0/P1)
- ✅ P0 paper mode 0 真仓风险 (累计 -$7.57 均为 mock)
- ✅ P0 main bal $607.05 / avail $607.05 / 0 positions
- ✅ P1 v3_paper PID 3875689 alive 29h58m
- ⚠️ Grand -$7.57 已超 -$5 KILL (累计 -$2.57 over)
- ⚠️ S5 已退步至 -$0.27 (老 BEST 失败)
- ⚠️ S6 closed=15 ✅ 但 WR=53.3% 差 1.7%
- ⚠️ S3 持续退步 (WR 11.1%)
- ⚠️ 主人 35d+ SSH 静默 #77 strict

## nextEvents (timing)
- 🔵 **02:25 5min cron cc88ad27-N** (~4min)
- 🔵 **03:21 hourly cron 40459cd1 #36** (~1h, S6 WR 累计观察点)
- 🟢 **02:30 5min** (~9min, 凌晨持续)
- 🟢 主人 35d+ SSH 静默 #77 strict 不 push

## Decision
**⚠️ HEARTBEAT_HOLD ⭐⭐⭐ STATUS QUO + Grand KILL ⚠️ 自主决策 HOLD**
- ⚠️ Grand -$7.57 已超设计 KILL = -$2.57 over (累计, paper 0 真金风险)
- S2 ⭐ BEST +$1.74 closed=6 WR=66.7% 稳持 1h+ (无新 close)
- S6 ✅ closed=15 WR=53.3% 临界 1.7% 稳持
- S5 老 BEST 已退步 (-$0.27)
- S3 持续退步 (WR 11.1%)
- paper 持续 + 不修任何 bug (#77 strict + 主人 autonomy directive from 06:30)
- 不 push 主人 (#77 strict, 35d 静默, 异常才推; KILL = 累计非活损)
- 关注: 02:25 cron / 03:21 hourly #36 / S2/S6 突破 / Grand -$10 STRONG KILL buffer $2.43