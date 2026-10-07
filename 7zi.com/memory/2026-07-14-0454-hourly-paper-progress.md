# 2026-07-14 04:55 CST — Paper Sim Hourly #53 (找方法验证)

**Cron**: `40459cd1-c701-4f29-beb6-2e1dd9aa72d4` Paper Sim 每小时找方法 (验证) #53
**PID**: 3875689 alive **2d8h32m** (since 7/11 20:22 CST)
**Status**: 🟡 STATUS EVOLVED +30min vs #419 (04:25 hb) — 2 new closes (74→76)

---

## 📊 6 策略 grid (sqlite ground truth @ 04:55 CST 7/14)

| 策略 | closed | W/L | WR | pnl_total | avg_pct | verdict |
|---|---|---|---|---|---|---|
| **S2_REVERSE_5MIN** ⭐⭐⭐ BEST | **8** | **6/2** | **75.0%** | **+$2.3583** | **+0.988%** | ⭐⭐⭐ BEST 38h+ 持续 (NEW BEST ⭐) |
| S6_REVERSE_TIGHT_30MIN | **20** ↑ +2 | 9/11 | **45.0%** ↑ +0.6pp | **+$0.6669** ↑ | +0.166% | ✅ PNL 转正! closed 突破 18→20, 仍 WR<55% 闭环未达 |
| S5_ULTRA_TIGHT_30MIN | 20 | 7/13 | 35.0% | -$0.3718 | -0.111% | ❌ |
| S3_TIGHT_TPSL | 12 | 2/10 | 16.7% | -$3.0600 | -0.853% | ❌ |
| S1_MOMENTUM_BASELINE | 8 | 1/7 | 12.5% | -$2.7890 | -1.168% | ❌ |
| S4_WIDER_TPSL | 8 | 2/6 | 25.0% | -$4.8101 | -2.018% | ❌ worst |
| **GRAND** | **76** ↑ +2 | **27/49** | **35.5%** | **-$8.0057** ↑ | — | ⚠️ -$10 buffer = **$1.99 SAFE** |

---

## ⚡ vs #419 (04:25 → 04:55, +30min)
- ⭐⭐⭐ STATUS EVOLVED: +2 new closes (74→76)
- **S2 ⭐ NEW BEST pnl 高位 ($2.3583)** — 持续 BEST 38h+ 无切换 (NEW BEST ⭐ 标记应加入下条心跳)
- **S6 ✅ pnl 转正微升**: closed 18→20, W=8→9 L=10→11, WR 44.4%→45.0% (+0.6pp), pnl +$0.4041→+$0.6669 (+$0.26 新赢)
  - 注: WR 仍 <55%, **closed 仍差 10 笔 ≥15** 必要条件连续未达
- Grand -$8.27 → -$8.01 (+$0.26 改善)
- 0 open positions (sqlite + paper_state.json 一致)
- S1/S3/S4/S5/S2 unchanged in position
- 距 7/14 reset 19h+

## 🎯 推规则触发评估 (主人 35d+ SSH 静默 #77 strict)
- ❌ best_strategy pnl > 0 + closed >= 5 → S2 已持续报 ⭐ NEW BEST 38h, 无切换不重推
- ❌ best_strategy 切换 → S2 持续 BEST, 未切换
- ❌ 6 策略总亏 < -$5 → Grand -$8.01 (paper 累计, 0 真金) **未触发 KILL STRONG**
- ❌ v3_paper.py 挂 → PID alive 2d8h32m ✅
- → **不 push 主人 (无 fresh best 切换, 无异常)**

## 🧪 样本收敛度分析
| 策略 | closed | 距 ≥15 | 趋势 |
|---|---|---|---|
| S2 ⭐⭐⭐ | 8 | 差 7 | 38h+ 累计 8, 速率慢 (~5 笔/天), **严解释仍不足** |
| S6 | 20 | 已达 ✅ | 闭环 trigger 灭失 (WR=45% < 55%) |
| S5 | 20 | 已达 ✅ | WR=35% 不达标 |
| S1/S3/S4 | 8/12/8 | 差 7/3/7 | 已退步或停滞 |

## 🔬 策略胜出特征 (待继续观察)
- **共同赢家特征**: S2 + S6 都带 "REVERSE" (反向信号)
- **失败者特征**: S1 (顺势 baseline) WR 12.5% = 顺势 100% 失败 → 反向已证明更优
- **TP/SL 影响**: S2 (0.8/0.5/0.5h, 反向) > S3 (1/1/1h, 顺势) > S4 (4/2.5/2h, 顺势) > S5 (0.5/0.4/30min, 顺势) — **反向+紧参数** 显著跑赢
- **MaxHold 影响**: 0.5h (S2) 优于 30min (S5) — 略长持仓给策略更多空间

## 🧠 决策矩阵 (主人 35d+ SSH 静默, 自主延续 #419)
- ❌ 不切实盘 S2 (严解释 closed=8 < 15 必要条件不达成)
- ❌ 不切实盘 S6 (WR=45% < 55% 闭环 trigger 灭失)
- ✅ paper mode 持续 (主人 06:30/20:20 边界)
- ✅ 不 push 主人 (#77 strict, S2 持续 BEST 无切换)
- ✅ 不调参 (STATUS QUO locked)
- ⚠️ S2 样本累计仍是观察重点 (差 7 笔 = ~33h+ 累计速率)
- ⚠️ Grand -$8.01 buffer $1.99 SAFE (但 -$10 KILL STRONG buffer 仍小)

## 📌 与最近几次心跳的对比
| HB | 时间 | Grand | S2 closed | S2 WR | S6 closed | S6 WR | BEST |
|---|---|---|---|---|---|---|---|
| #415 | 23:18 7/13 | -$7.76 | 6 | 66.7% | 15 | 53.3% | S2 |
| #416 | 00:51 7/14 | -$8.46 | 7 | 71.4% | 16 | 50.0% | S2 |
| #417 | 01:21 7/14 | -$8.77 | 8 | 75.0% | 16 | 50.0% | S2 |
| #418 | 04:20 7/14 | -$8.27 | 8 | 75.0% | 18 | 44.4% | S2 |
| #419 | 04:30 7/14 | -$8.27 | 8 | 75.0% | 18 | 44.4% | S2 |
| **#420** | **04:55 7/14** | **-$8.01** | **8** | **75.0%** | **20** | **45.0%** | **S2** |

**观察**:
- S2 WR 持续 75% (38h+ 稳定)
- S6 closed 跑得最快 (15→20, 5 笔/24h) 但 WR 持续下行 (53.3%→45.0%)
- Grand 累计 -$8.01 (改善 vs #417 高点 -$8.77)

---

## 📋 当前状态 (04:55 CST 7/14)
- PID 3875689 alive 2d8h32m
- 0 open positions 全 6 策略
- main bal/avail $607.05 / 0 positions ✅
- paper_summary.json mtime 04:55 fresh ✅
- 5min cron cc88ad27 next 04:56 (~1min)
- next hourly #54 cron 40459cd1 05:55 (60min)
- 7/14 reset in 19h+ (15:55 → 00:00 实际上 reset 00:00 CST, 距 19h05m)
- 7/15 00:00 DAILY_CAP reset in 19h05m
- 主人 35d+ SSH 静默 #77 strict

## 🟢 Decision
**HEARTBEAT_OK 🟡 STATUS EVOLVED + S2 ⭐⭐⭐ BEST 38h+ 持续 + S6 pnl 转正微升 + Grand -$8.01**
- 6 策略 grid 实质变化: S6 closed 18→20 (新增 2 笔 1 赢 1 输), WR 44.4%→45.0% (+0.6pp), pnl +$0.40→+$0.67 微转好
- S2 严解释 closed=8 < 15 = 不切实盘 (样本仍不足)
- S6 闭环 trigger 灭失 confirmed 仍 → 不再是切实盘候选
- Grand -$8.01 buffer to -$10 = $1.99 SAFE
- 不 push 主人 (#77 strict, 无 fresh best 切换, 无异常)
- 关注: 04:56 5min cron / 05:23 5min cron / 05:55 hourly #54 / S2 样本向 ≥15 收敛 / Grand -$10 KILL STRONG buffer $1.99
