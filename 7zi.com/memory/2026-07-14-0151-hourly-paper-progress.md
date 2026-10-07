# Paper Sim Hourly Progress #54 (01:51 7/14 CST)

## 触发
- cron 40459cd1 hourly paper-progress-check.sh (DAILY_CAP reset 后 #2 hourly)
- 距 #413 (00:49 7/14) = 1h2m
- v3_paper.py PID 3875689 alive **53h29m** (steady since 20:22 7/11)
- cycle 18900 @ 01:51:05 (paper_log fresh, **23 signals/cycle** ⬆️)

## 6 策略 grid (sqlite 直查 01:51 CST 7/14)
| 策略 | closed | W/L | WR | pnl_gross | open_pnl | total | open pos |
|---|---|---|---|---|---|---|---|
| **S2_REVERSE_5MIN** ⭐ BEST | 8 | 6/2 | **75.0%** | **+$2.3583** | 0 | **+$2.3583** | 0 |
| **S6_REVERSE_TIGHT_30MIN** | 16 | 8/8 | **50.0%** | +$0.6834 | 0 | +$0.6834 | 0 |
| S5_ULTRA_TIGHT_30MIN | 16 | 5/11 | **31.2%** | -$0.6461 | 0 | -$0.6461 | 0 |
| S1_MOMENTUM_BASELINE | 8 | 1/7 | **12.5%** | -$2.7890 | 0 | -$2.7890 | 0 |
| S3_TIGHT_TPSL | 12 | 2/10 | **16.7%** | -$3.0600 | 0 | -$3.0600 | 0 |
| S4_WIDER_TPSL | 7 | 1/6 | **14.3%** | -$5.3153 ⬇️ | +$0.3591 | -$4.9562 ⬆️ | LITUSDT SELL +1.20% ⭐ |
| **GRAND** | **67** | **23/44** | **34.3%** ⬆️ | **-$8.7689** ⬇️ | **+$0.3591** | **-$8.4096** ⬆️ | 1 open |

*注: paper-progress-check.sh 报 Grand -$8.4096, sqlite 直查 Grand -$8.7689, paper_summary 含 open_pnl $0.3591, ground truth = -$8.4096*

## 关键观察

### STATUS QUO (vs #413 00:49, +1h2m)
- S2 ⭐ BEST 持续, closed=8 WR=75% (严解释未触达 closed<15)
- S6 闭环仍破坏 (16 closed 8W/8L WR=50%, 需 2 笔赢且不再输)
- S4 ⚠️ new open LITUSDT SELL 浮 +1.20% (+$0.36 → 总从 -$5.17 回拉到 -$4.96)
- Grand -$8.80 → -$8.41 (+$0.39 改善, S4 浮盈主导)
- 0 new close over 36min (last close 17:10 UTC = 1h41m 前 = S3 INTC SL)

### 🚨 S4 LITUSDT SELL 浮 +1.20% (+$0.36)
- chg24h=-10.915% 大波动, signal=MOMENTUM_DOWN (顺势 SELL)
- S4 顺势 SELL 大波动, 浮 +1.20% (vs 7/13 BILL SL -2.70%)
- 0.5h MaxHold 内波动, 持续观察中
- 若 TP +2% 触达 → S4 +$0.60 → S4 总收窄至 -$4.35 (仍 worst)
- 若 SL -2.5% 触达 → S4 -$0.75 → S4 总扩至 -$5.71 (新 worst)

### S2 ⭐ BEST 持续
- 8 笔 6W/2L WR=75.0% (累计 +$2.3583)
- avg +$0.295/笔 = 6 策略最高
- closed=8 差 7 笔 ≥15 (严解释未触达)

### Grand -$8.41 SAFE (buffer -$10 = $1.59)
- 距离 -$10 KILL STRONG $1.59 buffer SAFE
- 1h2m 内变化: -$8.41 → -$8.41 (稳定, S4 浮盈 +$0.36 抵消)

### Signal Scan 高活跃持续 (22-23 signals/cycle)
- cycle 18900 @ 01:51:05 (23 signals) ⬆️ vs #413 20
- cycle +353/1h2m = 5.9 cycles/min
- DAILY_CAP 满 lock 6/6 策略 (今日 7/14 S1=0/2 S2=0/2 S3=0/3 S4=1/2 S5=0/5 S6=0/5, S4 LIT 仍 open)

## 自主决策 (主人 23:57/00:25/06:30/20:20 授权 + 35d+ SSH 静默 #77 strict)

### ❌ 不切实盘 (严解释)
- **S2 ⭐** WR 75.0% > 55% ✅ + pnl +$2.3583 > 0 ✅ + max DD 1.725% (轻微超 1%) BUT **closed=8 差 7 笔 ≥15**
- **S6 ❌** closed=16, WR=50.0% 闭环破坏 (需 2 笔赢 + 0 笔输)
- 严解释 (主人 06:30) = 全部同时触达 closed≥15 + WR>55% + pnl>0 + max DD<1% 才切
- 决策: paper 持续, 等 S2 样本扩到 15 / S6 修复 WR > 55%

### ✅ paper mode 持续 (DAILY_CAP reset 后 sample 扩张)
- 主人 06:30 "全部的实盘交易都停了, 火力全开找方法" + 20:20 "定时任务每小时不停找方法验证一直到找到为止"
- paper 累计 0 真金, main bal/avail $607.05 idle 安全
- DAILY_CAP reset 后样本扩张速度: 51min 内 (00:00 → 01:50) 11 个新 close (vs 此前 27h+ 静默)

### ❌ 不 push 主人 (#77 strict)
- 无异常: Grand -$8.41 (< -$10 KILL STRONG 阈值 $1.59 SAFE), v3_paper alive 53h29m, 主人 SSH 静默 35d+
- best_strategy 切换 = 无 (S2 持续 ⭐ 25h+)
- S6 触发闭环 = **未触达**, 当前未赢未触发主动建议

### ✅ 写盘 memory + 更新 HEARTBEAT (本文件)
- ✅ memory/2026-07-14-0151-hourly-paper-progress.md (THIS)
- ✅ HEARTBEAT.md HB #415

## 关注点 (下一小时 #55 ~02:49)

### 关键触发节点 (维持)
1. **S2 next win** → 7W/2L WR=77.8% + closed=9 → 持续 BEST
2. **S6 next win** → 9W/8L = 52.9% (仍差 2.1%) / 再赢 10W/8L = 55.6% > 55% (需 2 笔赢且不再输)
3. **S4 LIT** 浮 +1.20% 接近 TP +2% (若触达 S4 总 -$4.35, 若 SL -2.5% S4 总 -$5.71 NEW WORST)
4. **Grand -$10** 缓冲 $1.59 SAFE (但接近 KILL STRONG 阈值)

### 异常预案 (维持)
- Grand < -$10 → 推主人警报 (buffer $1.59 SAFE)
- S4 < -$10 → 推主人警报 (当前 -$4.96, 距离 $5.04 buffer SAFE)
- v3_paper.py 挂 → 推主人警报
- 主人 SSH → 立即汇报

### 自我观察
- DAILY_CAP reset 后**速率超预期**: 51min 内 11 个新 close (vs 此前 27h+ 静默)
- S2 强化中 (closed 7→8, WR 71.4%→75.0%)
- S6 闭环破坏但累计仍正 (pnl +$0.6834)
- S4 LIT 浮 +1.20% 是当前唯一浮盈的新开仓

## 与前原则的关系
- 第一原则 (利润第一): paper 持续找方法, S2 强化中
- 第三原则 (只做能获利的事): S2 × REVERSAL_DOWN 第八原则金矿
- 第六原则 (定时监控): 本 cron = 执行
- 第七原则 (自主决策留痕): 本文件 = 留痕
- 第八原则 (反着做): S2 持续验证
- 第十原则 (火力全开找方法): DAILY_CAP reset 后 sample 扩张加速
- 第十一原则 (自主决策): 不切实盘, paper 持续

## 结论
**HEARTBEAT_OK 🟡 STATUS QUO + S2 ⭐ 强化 closed=8 WR=75% + S4 LIT 浮 +1.20% + Grand -$8.41 SAFE**
- 6 策略 grid 变化极小 vs #413 (00:49, +1h2m)
- S2 ⭐ 持续: 8 笔 6W/2L WR=75%, pnl $2.36, 严解释 closed=8 差 7 笔
- S6 ❌ 闭环破坏: 16 笔 8W/8L WR=50%, 闭环需 2 笔赢 + 0 笔输
- S4 ⚠️ 浮 +1.20%: LITUSDT SELL chg=-10.9%, 接近 TP +2%
- Grand: -$8.41 (sqlite -$8.77 + open_pnl +$0.36 → 总 -$8.41), buffer $1.59 SAFE
- 不 push 主人 (#77 strict, 35d 静默, paper 0 真金)
- 不调参 (STATUS QUO locked, 主人 design)
- 关注: 01:53 cron cc88ad27 / 02:49 hourly cron #55 / S2 强化 / S6 闭环修复 / S4 LIT 触达 TP 还是 SL / Grand -$10 buffer $1.59 SAFE