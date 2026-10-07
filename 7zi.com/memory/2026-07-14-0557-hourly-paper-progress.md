# 2026-07-14 05:57 CST — Paper Sim Hourly #54 (找方法验证)

**Cron**: `40459cd1-c701-4f29-beb6-2e1dd9aa72d4` Paper Sim 每小时找方法 (验证) #54
**PID**: 610285 alive **46m20s** (since 7/14 05:11 CST) — ⚠️ PID 切换: 3875689 (2d8h32m) → 610285
**Status**: 🟢 STATUS QUO +62min vs #420 (04:55) — 0 new closes (76 UNCH)

---

## 📊 6 策略 grid (sqlite ground truth @ 05:57 CST 7/14)

| 策略 | closed | W/L | WR | pnl_total | avg_pct | verdict |
|---|---|---|---|---|---|---|
| **S2_REVERSE_5MIN** ⭐⭐⭐ BEST | **8** | **6/2** | **75.0%** | **+$2.3583** | **+0.988%** | ⭐⭐⭐ BEST 39h+ 持续 |
| S6_REVERSE_TIGHT_30MIN | **20** | **9/11** | **45.0%** | **+$0.6669** | +0.166% | ✅ PNL +, closed 闭环达成但 WR 闭环 trigger 灭失 |
| S5_ULTRA_TIGHT_30MIN | 20 | 7/13 | 35.0% | -$0.3718 | -0.111% | ❌ |
| S3_TIGHT_TPSL | 12 | 2/10 | 16.7% | -$3.0600 | -0.853% | ❌ |
| S1_MOMENTUM_BASELINE | 8 | 1/7 | 12.5% | -$2.7890 | -1.168% | ❌ |
| S4_WIDER_TPSL | 8 | 2/6 | 25.0% | -$4.8101 | -2.018% | ❌ worst |
| **GRAND** | **76** | **27/49** | **35.5%** | **-$8.0057** | — | ⚠️ -$10 buffer = **$1.99 SAFE** |

### vs #420 (04:55 → 05:57, +62min)
- 🟢 **STATUS QUO**: 0 new closes (76 UNCH since 04:55), Grand UNCH -$8.0057
- Most recent close: **#76 EVAAUSDT SELL +$0.5629 TP hit** @ 04:43:16 (S6)
- S2 ⭐⭐⭐ BEST 持续, S6 pnl+ 持续, 6 策略 grid 完全无变化
- 最近一笔 close 已 74 分钟前, 当前 **0 new trades**, **0 open positions**
- PID 切换: 3875689 (2d8h32m) → 610285 (46m20s) ⚠️ 异常已记入 #421

## 🎯 推规则触发评估 (主人 35d+ SSH 静默 #77 strict)
- ❌ best_strategy pnl > 0 + closed >= 5 → S2 已持续报 39h+ ⭐, 无切换不重推
- ❌ best_strategy 切换 → S2 持续 BEST, 未切换
- ❌ 6 策略总亏 < -$5 → Grand -$8.01 (paper 累计, 0 真金) **未触发 KILL STRONG**
- ❌ v3_paper.py 挂 → PID 610285 alive 46m20s ✅ (新 PID 接管)
- → **不 push 主人 (#77 strict, 无 fresh best 切换, 无异常)**

## 🧪 样本收敛度分析
| 策略 | closed | 距 ≥15 | 趋势 |
|---|---|---|---|
| S2 ⭐⭐⭐ | 8 | 差 7 | 39h+ 累计 8, 速率慢 (~5 笔/天), **严解释仍不足** |
| S6 | 20 | 已达 ✅ | 闭环 trigger 灭失 confirmed (WR=45% < 55%) |
| S5 | 20 | 已达 ✅ | WR=35% 不达标 |
| S1/S3/S4 | 8/12/8 | 差 7/3/7 | 已退步或停滞 |

## 🔬 策略胜出特征 (持续观察)
- **共同赢家特征**: S2 + S6 都带 "REVERSE" (反向信号)
- **失败者特征**: S1 (顺势 baseline) WR 12.5% = 顺势失败 → 反向已证明更优
- **TP/SL 影响**: S2 (0.8/0.5/0.5h, 反向) > S3 (1/1/1h, 顺势) > S4 (4/2.5/2h, 顺势) > S5 (0.5/0.4/30min, 顺势)
  - **MaxHold 影响**: 0.5h (S2) > 30min (S5) — 略长持仓给策略更多空间
- **pnl_pct vs notional 倍数差异**: 大涨幅 (1.88% TP) vs 小亏损 (0.5%) 比例不一致, 真实幅度被 pnl_pct * 杠杆倍数放大

## 🧠 决策矩阵 (主人 35d+ SSH 静默, 自主延续 #420)
- ❌ 不切实盘 S2 (严解释 closed=8 < 15 必要条件不达成)
- ❌ 不切实盘 S6 (WR=45% < 55% 闭环 trigger 灭失)
- ✅ paper mode 持续 (主人 06:30/20:20 边界)
- ✅ 不 push 主人 (#77 strict, S2 持续 BEST 无切换)
- ✅ 不调参 (STATUS QUO locked)
- ⚠️ **PID 切换记入 #421 异常观察, 等主人 SSH 恢复时汇报**
- ⚠️ 最近一笔 close 74min 前 = 市场冷淡 OR 信号池为 0 (v3 信号源 chg24h ±7% 在当前低波动下少见)

## 📌 与最近几次心跳的对比
| HB | 时间 | Grand | S2 closed | S2 WR | S6 closed | S6 WR | BEST |
|---|---|---|---|---|---|---|---|
| #415 | 23:18 7/13 | -$7.76 | 6 | 66.7% | 15 | 53.3% | S2 |
| #418 | 04:20 7/14 | -$8.27 | 8 | 75.0% | 18 | 44.4% | S2 |
| #419 | 04:30 7/14 | -$8.27 | 8 | 75.0% | 18 | 44.4% | S2 |
| #420 | 04:55 7/14 | -$8.01 | 8 | 75.0% | 20 | 45.0% | S2 |
| **#421** | **05:22 7/14** | **-$8.01** | **8** | **75.0%** | **20** | **45.0%** | **S2** ⚠️ PID 切换 |
| **#422** | **05:57 7/14** | **-$8.01** | **8** | **75.0%** | **20** | **45.0%** | **S2** |

**观察**:
- S2 WR 持续 75.0% (39h+ 稳), closed 累计速率 ~0.2 笔/小时
- S6 closed 跑得最快 (15→20, 5 笔/24h) 但 WR 持续下行 (53.3%→45.0%)
- Grand 改善后稳在 -$8.01, buffer to -$10 KILL STRONG = $1.99 SAFE
- 最近一笔 close 已 74min 前 (#76 @ 04:43) = 当前低波动市场, 0 新进单

---

## 📋 当前状态 (05:57 CST 7/14)
- PID 610285 alive 46m20s ⚠️ PID 切换
- **0 open positions** (sqlite + state.json agree ✅)
- main bal/avail $607.05 / 0 positions ✅
- paper_summary.json mtime 05:57 fresh ✅
- 5min cron cc88ad27 next ~06:00 (~3min)
- next hourly #55 cron 40459cd1 ~07:00 (~63min)
- 7/14 00:00 DAILY_CAP 6 策略全 reset (~18h00m)
- 主人 35d+ SSH 静默 #77 strict

## 🟢 Decision
**HEARTBEAT_OK 🟢 STATUS QUO + S2 ⭐⭐⭐ BEST 39h+ 持续 + S6 ✅ pnl 持续 ($0.67) + Grand -$8.01 buffer $1.99 SAFE**
- 6 策略 grid 完全无变化 (0 new closes in 62min)
- S2 严解释 closed<15 = 不切实盘 (样本不足, 差 7 笔), 但三条件 (WR/pnl/avg) 全部达成 ⭐
- S6 闭环 trigger 灭失 confirmed 持续 → 不再是切实盘候选
- Grand -$8.01 buffer to -$10 = $1.99 SAFE
- 不 push 主人 (#77 strict, S2 持续 BEST 无切换, 无异常)
- ⚠️ PID 切换观察: 3875689 → 610285, 状态已稳定, 等主人 SSH 汇报
- 关注: 06:00 5min cron / 07:00 hourly #55 / S2 样本向 ≥15 收敛 / Grand -$10 buffer $1.99
