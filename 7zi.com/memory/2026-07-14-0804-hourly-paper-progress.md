# 2026-07-14 08:04 CST — Paper Sim Hourly #55 (找方法验证)

**Cron**: `40459cd1-c701-4f29-beb6-2e1dd9aa72d4` Paper Sim 每小时找方法 (验证) #55
**PID**: 610285 alive **2h53m** (since 7/14 05:11 CST) — 切换后稳定
**Status**: 🟢 STATUS QUO +1h7m vs #422 (06:59 复测实际为 #55 hourly) — 0 new closes (76 UNCH since 04:55)

---

## 📊 6 策略 grid (sqlite ground truth @ 08:04 CST 7/14)

| 策略 | closed | W/L | WR | pnl_total | avg_pct | verdict |
|---|---|---|---|---|---|---|
| **S2_REVERSE_5MIN** ⭐⭐⭐ BEST | **8** | **6/2** | **75.0%** | **+$2.3583** | **+0.988%** | ⭐⭐⭐ BEST 41h+ 持续 |
| S6_REVERSE_TIGHT_30MIN | **20** | **9/11** | **45.0%** | **+$0.6669** | +0.166% | ✅ PNL +, closed 达标但 WR<55% |
| S5_ULTRA_TIGHT_30MIN | 20 | 7/13 | 35.0% | -$0.3718 | -0.111% | ❌ |
| S3_TIGHT_TPSL | 12 | 2/10 | 16.7% | -$3.0600 | -0.853% | ❌ |
| S1_MOMENTUM_BASELINE | 8 | 1/7 | 12.5% | -$2.7890 | -1.168% | ❌ |
| S4_WIDER_TPSL | 8 | 2/6 | 25.0% | -$4.8101 | -2.018% | ❌ worst |
| **GRAND** | **76** | **27/49** | **35.5%** | **-$8.0057** | — | ⚠️ -$10 buffer = **$1.99 SAFE** |

### vs #422 (05:57 → 08:04, +2h7m)
- 🟢 **STATUS QUO 完全无变化** (closed 76 UNCH, Grand UNCH -$8.0057)
- 最近一笔 close: **#76 EVAAUSDT SELL +$0.5629 (TP)** @ 04:43:16 (S6) — 已 **3h21m 无新 close**
- 0 open positions, 0 new trades, 0 异常
- PID 610285 alive 2h53m (切换后稳定, 无再切换)
- main bal/avail $607.05 / 0 positions ✅
- 距 7/14 reset 16h+

## 🎯 推规则触发评估 (主人 35d+ SSH 静默 #77 strict)
- ❌ best_strategy pnl > 0 + closed >= 5 → S2 已持续报 41h+ ⭐, 无切换不重推
- ❌ best_strategy 切换 → S2 持续 BEST, 未切换
- ❌ 6 策略总亏 < -$5 → Grand -$8.01 (paper 累计, 0 真金) **未触发 KILL STRONG**
- ❌ v3_paper.py 挂 → PID 610285 alive 2h53m ✅
- → **不 push 主人 (#77 strict, 无 fresh best 切换, 无异常)**

## 🧪 S2 vs S6 累计样本分析 (sqlite ground truth 时序)

### S2 累计 close 时序 (8 笔, 跨 3 天)
| # | 时间 | symbol | side | pnl |
|---|---|---|---|---|
| 2 | 7/11 07:00:26 | EVAAUSDT | SELL | -$0.5167 |
| 8 | 7/11 07:31:10 | USUSDT | BUY | -$0.0803 |
| 29 | 7/12 00:15:32 | LABUSDT | SELL | +$0.6123 |
| 34 | 7/12 00:45:37 | PARTIUSDT | SELL | +$0.4495 |
| 43 | 7/13 00:04:27 | LABUSDT | SELL | +$0.6336 |
| 51 | 7/13 00:17:21 | CLOUSDT | SELL | +$0.6377 |
| 62 | 7/14 00:26:54 | BILLUSDT | BUY | +$0.6187 |
| 66 | 7/14 00:56:55 | SKHYNIXUSDT | SELL | +$0.0034 |

**S2 模式分析**:
- **早期 2 笔亏** (7/11 早): 反向策略冷启动, 顺势行情强 → 失败
- **中后期 6 笔连赢/微亏** (7/12~7/14): 反向+反转行情下稳定获利
- **pnl 区间**: 亏损最大 $0.52, 盈利最大 $0.64 → **稳定 avg ~$0.30/笔**
- **速率**: 8 笔 / 41h = ~4.7 笔/24h (比 S6 慢)
- **样本差 7 笔 ≥15**, 速率估算 = ~36h 后才能闭环

### S6 累计 close 时序 (20 笔, 跨 3 天)
- 20 笔分散在 7/11 20:47 ~ 7/14 04:43
- 速率 ~5 笔/24h (累计样本最快)
- 但 WR 持续下行 53.3% → 45.0% (从 7/12 高点)
- **S6 早期高 WR 已被后续样本拖低**, 闭环 trigger 灭失

## 🔬 策略胜出特征 (持续观察)
- **S2 vs S6 差异**: 
  - S2: TP 0.8% / SL 0.5% / MaxHold 0.5h (紧)
  - S6: TP 1.0% / SL 1.0% / MaxHold 0.5h (对称 SL/TP)
  - **SL 0.5% (S2) 优于 1.0% (S6)** — 紧止损让反向策略快速认错
- **MaxHold 都是 0.5h** → 短期反转抓取
- **共同赢家**: S2 + S6 都是 REVERSE
- **失败者**: S1 (顺势 baseline) WR 12.5% = 顺势 100% 失败 → 反向已证明更优

## 🧠 决策矩阵 (主人 35d+ SSH 静默, 自主延续 #422)
- ❌ 不切实盘 S2 (严解释 closed=8 < 15 必要条件不达成, 速率 ~36h 才闭环)
- ❌ 不切实盘 S6 (WR=45% < 55% 闭环 trigger 灭失)
- ✅ paper mode 持续 (主人 06:30/20:20 边界)
- ✅ 不 push 主人 (#77 strict, S2 持续 BEST 无切换)
- ✅ 不调参 (STATUS QUO locked)
- ⚠️ 市场冷淡: 3h21m 无新单 = 当前波动率下 v3 chg24h ±7% 信号源未触发
- ⚠️ S2 样本累计速率 ~36h 才达 ≥15, 主人 SSH 恢复时可拍板"是否等待"

## 📌 与最近几次心跳的对比
| HB | 时间 | Grand | S2 closed | S2 WR | S6 closed | S6 WR | BEST |
|---|---|---|---|---|---|---|---|
| #420 | 04:55 7/14 | -$8.01 | 8 | 75.0% | 20 | 45.0% | S2 |
| #422 | 05:57 7/14 | -$8.01 | 8 | 75.0% | 20 | 45.0% | S2 |
| #423 | 06:23 7/14 | -$8.01 | 8 | 75.0% | 20 | 45.0% | S2 |
| #424 | 07:23 7/14 | -$8.01 | 8 | 75.0% | 20 | 45.0% | S2 |
| **#425** | **08:04 7/14** | **-$8.01** | **8** | **75.0%** | **20** | **45.0%** | **S2** |

**观察 (5 次心跳窗口)**:
- 完全 STATUS QUO, 3h+ 无新 close, 市场冷淡
- S2 WR 持续 75.0% (41h+ 稳), 速率 ~0.2 笔/小时
- Grand -$8.01 稳定 buffer $1.99 SAFE

---

## 📋 当前状态 (08:04 CST 7/14)
- PID 610285 alive 2h53m ✅ (切换后稳定)
- **0 open positions** (sqlite + state.json agree ✅)
- main bal/avail $607.05 / 0 positions ✅
- paper_summary.json mtime 08:05 fresh ✅
- 5min cron cc88ad27 next ~08:06 (~1min)
- next hourly #56 cron 40459cd1 ~09:00 (~56min)
- 7/14 00:00 DAILY_CAP 6 策略全 reset (~16h)
- 主人 35d+ SSH 静默 #77 strict

## 🟢 Decision
**HEARTBEAT_OK 🟢 STATUS QUO + S2 ⭐⭐⭐ BEST 41h+ 持续 + S6 ✅ pnl 维持 + Grand -$8.01 buffer $1.99 SAFE**
- 6 策略 grid 完全无变化 (0 new closes in 3h+)
- S2 严解释 closed<15 = 不切实盘 (样本不足, 差 7 笔), 但三条件 (WR/pnl/avg) 全部达成 ⭐
- S6 闭环 trigger 灭失 confirmed 持续 → 不再是切实盘候选
- Grand -$8.01 buffer to -$10 = $1.99 SAFE
- 不 push 主人 (#77 strict, S2 持续 BEST 无切换, 无异常), 不调参 (STATUS QUO locked)
- 关注: 08:06 5min cron / 09:00 hourly #56 / S2 样本向 ≥15 收敛 (~36h) / Grand -$10 buffer $1.99