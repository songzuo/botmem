# Paper Sim Hourly Progress #53 (00:49 7/14 CST)

## 触发
- cron 40459cd1 hourly paper-progress-check.sh (DAILY_CAP reset 后 #1 hourly)
- 距 #412 (23:48 7/13) = 1h1m
- v3_paper.py PID 3875689 alive **52h26m** (steady since 20:22 7/11)
- cycle 18547 @ 00:49:18 (paper_log fresh, 20 signals/cycle)

## 6 策略 grid (sqlite 直查 00:49 CST 7/14)
| 策略 | closed | W/L | WR | pnl_gross | open_pnl | total | open pos |
|---|---|---|---|---|---|---|---|
| **S2_REVERSE_5MIN** ⭐ NEW BEST | 7 | 5/2 | **71.4%** ⬆️ | **+$2.3549** ⬆️ | +$0.0130 | **+$2.3679** ⬆️ | SKHYNIXUSDT SELL +0.05% |
| **S6_REVERSE_TIGHT_30MIN** | 16 | 8/8 | **50.0%** ⬇️ | +$0.6834 ⬇️ | 0 | +$0.6834 ⬇️ | 0 |
| S5_ULTRA_TIGHT_30MIN | 16 | 5/11 | **31.2%** ⬇️ | -$0.6461 ⬇️ | 0 | -$0.6461 | 0 |
| S1_MOMENTUM_BASELINE | 8 | 1/7 | **12.5%** ⬆️ | -$2.7890 ⬆️ | 0 | -$2.7890 | 0 |
| S3_TIGHT_TPSL | 11 | 2/9 | **18.2%** ⬆️ | -$2.7526 ⬆️ | -$0.0957 | -$2.8483 | INTCUSDT SELL -0.32% |
| S4_WIDER_TPSL | 7 | 1/6 | **14.3%** ⬇️ | -$5.3153 ⬇️ | +$0.1411 | -$5.1742 ⬇️ | LITUSDT SELL +0.47% |
| **GRAND** | **65** | **22/43** | **33.8%** ⬆️ | **-$8.4649** ⬇️ | +$0.0584 | **-$8.4063** ⬇️ | 3 opens |

*注: vs #412 (23:48 7/13) 大变化: DAILY_CAP reset 已发生, +8 new closes over 1h1m, 关键状态变化*

## 关键观察 ⭐⭐⭐ 大量新活动

### ⏰ DAILY_CAP reset 已发生 (7/14 00:00 CST, 49min 前)
- 7/14 00:00 - 00:49 CST = 49min 内产生 8 个新 close + 4 个新 open
- 6 策略整体 grand_total 从 -$7.7574 → -$8.4063 (-$0.65 累计)
- **S4 ⭐ NEW WORST** ⬇️: -$4.51 → -$5.17 (-$0.66), WR 16.7% → 14.3%

### 🆕 7/14 新 close (since 00:00 CST, 49min 内)
| strategy | symbol | side | pnl_pct | pnl_gross | reason | ts |
|---|---|---|---|---|---|---|
| S6 | BILLUSDT | BUY | -0.55% | -$0.17 | SL | 16:01:36 UTC |
| S5 | BILLUSDT | SELL | -0.62% | -$0.19 | SL | 16:02:26 UTC |
| S3 | BILLUSDT | SELL | -1.01% | -$0.30 | SL | 16:03:51 UTC |
| S1 | BILLUSDT | SELL | -1.59% | -$0.48 | SL | 16:04:14 UTC |
| S2 ⭐ | BILLUSDT | BUY | **+2.06%** | **+$0.62** | TP | 16:26:54 UTC ⭐ |
| S1 | SAMSUNGUSDT | SELL | **+0.92%** | +$0.27 | MaxHold 0.5h | 16:34:50 UTC ✅ |
| S3 | SAMSUNGUSDT | SELL | **+1.15%** | +$0.34 | TP | 16:35:36 UTC ✅ |
| S4 | BILLUSDT | SELL | -2.70% | -$0.81 | SL | 16:40:29 UTC |

**关键洞察**:
1. **S2 ⭐ BILLUSDT BUY REVERSAL_DOWN +2.06% TP** - 第八原则再次数据验证 (chg24h=+20.66% 反向做多赚)
2. **S1+S3 SAMSUNGUSDT SELL MOMENTUM_DOWN 双赢** - 顺势 SELL 大波动赚钱 (但 S1 同时也 SL 了大波动, mixed)
3. **BILLUSDT 第一波 (16:00-16:04 UTC) 全 SL** - 4 策略对 BILLUSDT 同时下单, 3 SL 1 TP, 反向 S2 胜出
4. **S4 顺势 SELL 大波动 BILLUSDT -2.70% SL** - 0.5h MaxHold 内被 SL 反向打 (chg24h=+20.66%)

### ⭐ S2 BEST 状态强化
- 6 笔 4W/2L → **7 笔 5W/2L WR=71.4%** (best 持续 24h+)
- pnl $1.7362 → **$2.3549** (+$0.62 over 1h)
- 7/14 当日 1 笔 100% WR +$0.62
- **avg_pct** +0.971% → +1.030% 持续最高
- **新增**: S2 SKHYNIXUSDT SELL chg=-15.7% signal=REVERSAL_UP (反向做空大波动)

### ⚠️ S6 触发闭环状态变化
- 旧 (23:48): S6 closed=15 W=8 L=7 WR=53.3% → 下次赢 9W/7L=56.25% > 55% ✅ 闭环
- 新 (00:49): **S6 closed=16 W=8 L=8 WR=50.0%** → 下次赢 9W/8L=52.9% < 55% ❌ 闭环破坏!
- **关键**: 新增 1 SL BILLUSDT -0.55% 把闭环临界状态破坏
- **新触发条件**: 18 笔 10W/8L = 55.6% > 55% ✅ (需赢 2 笔且不再输)
- 或: 17 笔 9W/8L = 52.9% < 55% ❌

### S5 老 BEST 失败持续
- closed=16 W=5/L=11 WR=31.2% (vs 23:48 closed=15 5/10 33.3%, 新增 1 SL BILLUSDT -0.62%)
- pnl -$0.46 → -$0.65 (累计 paper 0 真金)

### S4 ⭐ NEW WORST
- closed=7 W=1/L=6 WR=14.3% (vs 23:48 6 1/5 16.7%, 新增 1 SL BILLUSDT -2.70%)
- pnl -$4.51 → **-$5.17** ⬇️ (首次破 -$5, 7/13 起 worst 累计 -$5.17)
- 7/14 新开 LITUSDT SELL chg=-10.9% signal=MOMENTUM_DOWN (顺势 SELL 大波动 +0.47% 浮)

### ⏰ 当前 open positions (3 个)
- **S2 SKHYNIXUSDT SELL** chg=-15.706% signal=REVERSAL_UP (反向) +0.05% 浮
- **S3 INTCUSDT SELL** chg=-7.299% signal=MOMENTUM_DOWN (顺势) -0.32% 浮
- **S4 LITUSDT SELL** chg=-10.915% signal=MOMENTUM_DOWN (顺势) +0.47% 浮

### Signal Scan 持续高活跃 (20 signals/cycle)
- cycle 18547 @ 00:49:18 fresh
- cycle +318/1h1m = 5.2 cycles/min (活跃)

## 自主决策 (主人 23:57/00:25/06:30/20:20 授权 + 35d+ SSH 静默 #77 strict)

### ❌ 不切实盘 (严解释 - 关注状态恶化)
- **S2 ⭐** WR 71.4% > 55% ✅ + pnl +$2.3549 > 0 ✅ + max DD 1.725% (轻微超 1% 设计) BUT **closed=7 差 8 笔 ≥15**
- **S6 ❌** WR=50.0% 差 5.0% (闭环破坏! 下次赢 9W/8L=52.9%, 仍差 2.1%)
- 严解释 (主人 06:30) = 全部同时触达 closed≥15 + WR>55% + pnl>0 + max DD<1% 才切
- 决策: paper 持续, 等 S2 样本扩到 15 / S6 修复 WR > 55% (需 2 笔赢 + 0 笔输)

### ✅ paper mode 持续 (DAILY_CAP reset 后 sample 扩张机会)
- 主人 06:30 "全部的实盘交易都停了, 火力全开找方法" + 20:20 "定时任务每小时不停找方法验证一直到找到为止"
- paper 累计 0 真金, main bal/avail $607.05 idle 安全
- DAILY_CAP reset 后 49min 内 8 个新 close, **信号源活跃样本扩张进行中**

### ❌ 不 push 主人 (#77 strict)
- 无异常: Grand -$8.41 (< -$10 KILL STRONG 阈值 $1.59 SAFE), v3_paper alive 52h26m, 主人 SSH 静默 35d+
- best_strategy 切换 = 无 (S2 持续 ⭐ 24h+, 强化中)
- S6 触发闭环 = **恶化中**, 当前未触达

### ✅ 写盘 memory + 更新 HEARTBEAT (本文件)
- ✅ memory/2026-07-14-0049-hourly-paper-progress.md (THIS)
- ✅ HEARTBEAT.md HB #414

## 关注点 (下一小时 #54 ~01:49)

### 关键触发节点 (变化: S6 闭环破坏, S2 强化)
1. **S2 next win** → 6W/2L WR=75% + closed=8 → 持续 BEST
2. **S6 next win** → 9W/8L = 52.9% (仍差 2.1%) / 10W/8L = 55.6% > 55% (需赢 2 笔且不再输)
3. **3 open positions** 浮亏/浮盈观察 → S3 INTC -0.32% (最大浮亏) / S4 LIT +0.47% (最大浮盈) / S2 SKH +0.05%
4. **Grand 缓冲 $1.59 SAFE** 距离 -$10 KILL STRONG

### ⚠️ 异常预案 (维持 + 新增)
- Grand < -$10 → 推主人警报 (buffer $1.59, 接近)
- S4 < -$10 → 推主人警报 (当前 -$5.17, 距离 $4.83)
- v3_paper.py 挂 → 推主人警报
- 主人 SSH → 立即汇报完整对比

### 自我观察
- **BILLUSDT 大波动第一波 (16:00-16:04 UTC) 全 SL, S2 反向胜出** - 第八原则再次数据验证 ✅
- **SAMSUNGUSDT 大波动第二波 (16:34-16:35 UTC) S1+S3 顺势 SELL 双赢** - MOMENTUM_DOWN 在顺势策略暂时有效
- **S2 平均每笔 +$0.336 vs S4 平均每笔 -$0.760** = 6 策略中盈利效率最大差距
- DAILY_CAP reset 后 sample 扩张速度超预期 (49min 内 8 个新 close = 0.16 close/min)

## 与前原则的关系
- 第一原则 (利润第一): paper 持续找方法, S2 强化中
- 第三原则 (只做能获利的事): S2 × REVERSAL_DOWN = 第八原则金矿 (BILLUSDT +2.06%)
- 第六原则 (定时监控): 本 cron = 执行
- 第七原则 (自主决策留痕): 本文件 = 留痕
- 第八原则 (反着做): S2 BILLUSDT 反向 + 第八原则再次数据验证 ✅
- 第十原则 (火力全开找方法): 本 cron = 持续, DAILY_CAP reset 后 sample 扩张进行中
- 第十一原则 (自主决策): 不切实盘, paper 持续

## 结论
**HEARTBEAT_OK 🟡 STATUS QUO COMPLETE CHANGE + DAILY_CAP reset 49min + 8 new closes + S2 强化 + S6 闭环破坏 + Grand -$8.41**
- 6 策略 grid 大变化 vs #412 (23:48):
  - S2 ⭐ 强化: 6→7 笔, 4W/2L→5W/2L WR=66.7%→71.4%, pnl $1.74→$2.35 ✅
  - S6 ❌ 闭环破坏: 15→16 笔, 8W/7L→8W/8L WR=53.3%→50.0%, pnl $0.85→$0.68 ⚠️
  - S4 ⭐ NEW WORST: 6→7 笔, pnl $4.51→$5.17 (首次破 -$5)
  - S1/S3/S5 各有 1 SL 新增
  - Grand: $7.76 → $8.41 (-$0.65)
- 3 open positions: S2 SKH +0.05% / S3 INTC -0.32% / S4 LIT +0.47%
- 不 push 主人 (#77 strict, 35d 静默, paper 0 真金)
- 不调参 (STATUS QUO locked, 主人 design)
- 关注: 00:52 cron cc88ad27 / 01:49 hourly cron #54 / S2 强化样本扩张 / S6 闭环修复 (需赢 2 笔且不再输) / S4 距离 -$10 $4.83 / Grand -$10 buffer $1.59 SAFE / 3 open positions 浮亏/浮盈