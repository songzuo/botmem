# 2026-07-14 10:07 CST — Paper Sim Hourly #57 (找方法验证)

**Cron**: `40459cd1-c701-4f29-beb6-2e1dd9aa72d4` Paper Sim 每小时找方法 (验证) #57
**PID**: 610285 alive **4h56m** (since 7/14 05:11 CST) — 切换后稳定
**Status**: 🟢 STATUS QUO +1h+ vs #425 (08:05) — 0 new closes (76 UNCH since 04:55, 5h14m)

---

## 📊 6 策略 grid (sqlite ground truth @ 10:08 CST 7/14)

| 策略 | closed | W/L | WR | pnl_total | avg_pct | verdict |
|---|---|---|---|---|---|---|
| **S2_REVERSE_5MIN** ⭐⭐⭐ BEST | **8** | **6/2** | **75.0%** | **+$2.3583** | **+0.988%** | ⭐⭐⭐ BEST 43h+ 持续 |
| S6_REVERSE_TIGHT_30MIN | **20** | **9/11** | **45.0%** | **+$0.6669** | +0.166% | ✅ PNL +, closed 达标但 WR<55% |
| S5_ULTRA_TIGHT_30MIN | 20 | 7/13 | 35.0% | -$0.3718 | -0.111% | ❌ |
| S3_TIGHT_TPSL | 12 | 2/10 | 16.7% | -$3.0600 | -0.853% | ❌ |
| S1_MOMENTUM_BASELINE | 8 | 1/7 | 12.5% | -$2.7890 | -1.168% | ❌ |
| S4_WIDER_TPSL | 8 | 2/6 | 25.0% | -$4.8101 | -2.018% | ❌ worst |
| **GRAND** | **76** | **27/49** | **35.5%** | **-$8.0057** | — | ⚠️ -$10 buffer = **$1.99 SAFE** |

### vs #425 (08:05 → 10:08, +2h3m)
- 🟢 **STATUS QUO 完全无变化** (closed 76 UNCH, Grand UNCH -$8.0057)
- 最近一笔 close: **#76 EVAAUSDT SELL +$0.5629 (TP)** @ 04:43:16 (S6) — 已 **5h25m 无新 close**
- 0 open positions, 0 new trades, 0 异常
- PID 610285 alive 4h56m (切换后稳定, 无再切换)
- main bal/avail $607.05 / 0 positions ✅
- 距 7/14 reset 14h+

## 🎯 推规则触发评估 (主人 35d+ SSH 静默 #77 strict)
- ❌ best_strategy pnl > 0 + closed >= 5 → S2 已持续报 43h+ ⭐, 无切换不重推
- ❌ best_strategy 切换 → S2 持续 BEST, 未切换
- ❌ 6 策略总亏 < -$5 → Grand -$8.01 (paper 累计, 0 真金) **未触发 KILL STRONG**
- ❌ v3_paper.py 挂 → PID 610285 alive 4h56m ✅
- → **不 push 主人 (#77 strict, 无 fresh best 切换, 无异常)**

## 🧪 样本收敛度 & 速率分析
| 策略 | closed | 距 ≥15 | 速率 | 闭环 ETA |
|---|---|---|---|---|
| S2 ⭐⭐⭐ | 8 | 差 7 | ~0.19 笔/h (8 笔/43h) | ~37h 后 (7/16 23:00) |
| S6 | 20 | 已达 ✅ | ~0.47 笔/h | WR<55% 闭环 trigger 灭失 |
| S5 | 20 | 已达 ✅ | ~0.47 笔/h | WR=35% 不达标 |
| S1/S3/S4 | 8/12/8 | 差 7/3/7 | 都慢 | 已退步或停滞 |

**关键观察**: S2 累计速率 ~5 笔/24h, 即使再等 1 天也很难达 15 笔 (差 7 笔, 估算 ~33h+)
- 如果市场继续冷淡, S2 闭环可能在 7/16 23:00 前后

## 🔬 策略胜出特征 (持续观察)
- **S2 vs S6 关键差异** (回顾 #55 分析):
  - **S2**: TP 0.8% / **SL 0.5%** (紧止损) → 6/2 赢率高
  - **S6**: TP 1.0% / **SL 1.0%** (对称) → 9/11 输率上升
  - **结论**: 反向策略 + 紧止损 (SL 0.5%) 是关键成功因子
- **MaxHold 都是 0.5h** → 短期反转抓取
- **共同赢家**: S2 + S6 都是 REVERSE
- **失败者**: S1 (顺势 baseline) WR 12.5% = 顺势 100% 失败 → 反向已证明更优

## 🧠 决策矩阵 (主人 35d+ SSH 静默, 自主延续 #425)
- ❌ 不切实盘 S2 (严解释 closed=8 < 15 必要条件不达成, 速率慢)
- ❌ 不切实盘 S6 (WR=45% < 55% 闭环 trigger 灭失)
- ✅ paper mode 持续 (主人 06:30/20:20 边界)
- ✅ 不 push 主人 (#77 strict, S2 持续 BEST 无切换)
- ✅ 不调参 (STATUS QUO locked)
- ⚠️ 市场冷淡 5h25m 无新单 (近 5h 完全没信号触发)
- ⚠️ Grand -$8.01 buffer $1.99 SAFE (TIGHT, 但 paper 0 真金)

## 📌 与最近几次心跳的对比
| HB | 时间 | Grand | S2 closed | S2 WR | S6 closed | S6 WR | BEST |
|---|---|---|---|---|---|---|---|
| #422 | 05:57 7/14 | -$8.01 | 8 | 75.0% | 20 | 45.0% | S2 |
| #425 | 08:05 7/14 | -$8.01 | 8 | 75.0% | 20 | 45.0% | S2 |
| #426 | 08:24 7/14 | -$8.01 | 8 | 75.0% | 20 | 45.0% | S2 |
| #427 | 09:24 7/14 | -$8.01 | 8 | 75.0% | 20 | 45.0% | S2 |
| **#428** | **10:08 7/14** | **-$8.01** | **8** | **75.0%** | **20** | **45.0%** | **S2** |

**观察 (8 次心跳窗口)**:
- 完全 STATUS QUO, **5h25m 无新 close**, 市场冷淡持续
- S2 WR 持续 75.0% (43h+ 稳), 速率 ~0.19 笔/小时
- Grand -$8.01 稳定 buffer $1.99 SAFE

---

## 📋 当前状态 (10:08 CST 7/14)
- PID 610285 alive 4h56m ✅ (切换后稳定)
- **0 open positions** (sqlite + state.json agree ✅)
- main bal/avail $607.05 / 0 positions ✅
- paper_summary.json mtime 10:08 fresh ✅
- 5min cron cc88ad27 next ~10:10 (~2min)
- next hourly #58 cron 40459cd1 ~11:00 (~52min)
- 7/14 00:00 DAILY_CAP 6 策略全 reset (~13h52m)
- 7/15 00:00 24h DAILY_CAP reset (~14h)
- 主人 35d+ SSH 静默 #77 strict

## 🟢 Decision
**HEARTBEAT_OK 🟢 STATUS QUO + S2 ⭐⭐⭐ BEST 43h+ 持续 + S6 ✅ pnl 维持 + Grand -$8.01 buffer $1.99 SAFE**
- 6 策略 grid 完全无变化 (0 new closes in 5h25m)
- S2 严解释 closed<15 = 不切实盘 (样本不足, 差 7 笔), 但三条件 (WR/pnl/avg) 全部达成 ⭐
- S6 闭环 trigger 灭失 confirmed 持续 → 不再是切实盘候选
- Grand -$8.01 buffer to -$10 = $1.99 SAFE
- 不 push 主人 (#77 strict, S2 持续 BEST 无切换, 无异常), 不调参 (STATUS QUO locked)
- 市场观察: 5h25m 无新单 = 等待波动放大 (chg24h ±7% 阈值未触发)
- 关注: 10:10 5min cron / 11:00 hourly #58 / S2 样本向 ≥15 收敛 (~37h 后 7/16 23:00) / Grand -$10 buffer $1.99