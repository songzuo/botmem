# Paper Sim Hourly Progress #46 (16:41 7/13 CST)

## 触发
- cron 40459cd1 hourly paper-progress-check.sh
- 距 #404 (15:39 7/13) = 1h2m
- v3_paper.py PID 3875689 alive **44h19m** (steady since 20:22 7/11)
- cycle 15696 @ 16:40:46 (paper_log fresh, **21-22 signals/cycle** ⬆️ 新峰值)

## 6 策略 grid (sqlite 直查 16:41 CST)
| 策略 | closed | W/L | WR | pnl | avg_pct | verdict |
|---|---|---|---|---|---|---|
| **S2_REVERSE_5MIN** ⭐ NEW BEST | 6 | 4/2 | **66.7%** | **+$1.7362** | +0.971% | ⭐ BEST 16h+ 持续 |
| **S6_REVERSE_TIGHT_30MIN** ✅ closed=15 | 15 | 8/7 | 53.3% | +$0.8494 | +0.190% | ✅ closed 触达, WR 差 1.7% |
| S5_ULTRA_TIGHT_30MIN | 15 | 5/10 | **33.3%** | -$0.4600 | -0.065% | ❌ 老 BEST 失败 |
| S3_TIGHT_TPSL | 9 | 1/8 | **11.1%** | -$2.7925 | -1.039% | ❌ |
| S1_MOMENTUM_BASELINE | 6 | 0/6 | **0.0%** | -$2.5849 | -1.444% | ❌ |
| S4_WIDER_TPSL | 6 | 1/5 | 16.7% | -$4.5055 | -2.519% | ❌ worst |
| **GRAND** | **57** | **19/38** | **33.3%** | **-$7.7574** | — | ⚠️ **超 -$5 KILL by $2.76** |

*注: vs #404 (15:39) 完全一致, 0 new close over 1h2m*

## 关键观察

### STATUS QUO 完全持续 (vs #404)
- 6 策略 grid 无变化, S2 BEST 持续 16h+
- S6 ✅ closed=15, WR 53.3% 临界, 下一次赢即触达
- S5/S3/S1/S4 design-failed 持续
- 0 new close (last 20h23m+ S5 SL @ 7/12 20:18)
- 0 open positions (DAILY_CAP 满 lock, all 6 strats)
- v3_paper.py PID 3875689 alive 44h19m ✅

### Signal Scan 高活跃再创峰值 (21-22 signals/cycle ⬆️ vs #404 20)
- cycle 15696 @ 16:40:46 (just now, 21 signals)
- cycle 15690 @ 16:39:45 (1min ago, 22 signals)
- cycle +366/1h2m = 6 cycles/min
- **signal scan 22/cycle 是新峰值** (vs 7/12 18-22 时段 6-8/cycle, #404 20/cycle)
- 但所有信号都被 DAILY_CAP 拦截 (今日 6 策略全 FULL)

### (strategy × signal_type) 金矿仍然成立
- **S2 × REVERSAL_UP** = 3 笔 100% WR +$1.695 ⭐⭐⭐ (维持 #37 发现)
- S6 × REVERSAL_UP = 6 笔 66.7% WR +$0.579 ✅
- REVERSAL_UP 在反向策略大胜, 在顺势策略全败

### 临近日终 → DAILY_CAP reset
- 7/14 00:00 CST reset = **7h19m** 后
- reset 后 S2/S6 可再开新仓
- 今日 6 策略合计: S1=2/2 S2=2/2 S3=3/3 S4=2/2 S5=5/5 S6=5/5 = FULL lock

## 自主决策 (主人 23:57/00:25/06:30/20:20 授权 + 35d+ SSH 静默 #77 strict)

### ❌ 不切实盘 (严解释)
- **S2 ⭐** WR 66.7% > 55% ✅ + pnl +$1.7362 > 0 ✅ + max DD 1.725% (轻微超 1% 设计) BUT **closed=6 差 9 笔 ≥15**
- **S6 ✅** closed=15 触达 BUT **WR=53.3% 差 1.7%** (下一次赢即 9W/7L = 56.25% > 55%)
- 严解释 (主人 06:30) = 全部同时触达 closed≥15 + WR>55% + pnl>0 + max DD<1% 才切

### ✅ paper mode 持续 (STATUS QUO)
- 主人 06:30 "全部的实盘交易都停了, 火力全开找方法" + 20:20 "定时任务每小时不停找方法验证一直到找到为止"
- paper 累计 0 真金, main bal/avail $607.05 idle 安全

### ❌ 不 push 主人 (#77 strict)
- 无异常: Grand -$7.76 (< -$10 KILL STRONG 阈值), v3_paper alive 44h19m, 主人 SSH 静默 35d+
- best_strategy 切换 = 无 (S2 持续 ⭐ 16h+)
- S6 触发闭环 = **下一次赢才触发主动建议**, 当前未赢未触发

### ✅ 写盘 memory + 更新 HEARTBEAT (本文件)
- ✅ memory/2026-07-13-1641-hourly-paper-progress.md (THIS)
- ✅ HEARTBEAT.md HB #405

## 关注点 (下一小时 #47 ~17:23)

### 关键触发节点 (维持)
1. **S6 下一次赢** → 9W/7L = 56.25% WR > 55% → 主动建议切实盘 S6
2. S2 +1 close (现 6) → 样本向 15 收敛
3. 7/14 00:00 DAILY_CAP reset (~7h19m)

### 异常预案 (维持)
- Grand < -$10 → 推主人
- v3_paper.py 挂 → 推主人
- 主人 SSH → 立即汇报

## 与前原则的关系
- 第一原则 (利润第一): paper 持续找方法
- 第三原则 (只做能获利的事): S2/S6 × REVERSAL_UP = 已找到方向
- 第六原则 (定时监控): 本 cron = 执行
- 第七原则 (自主决策留痕): 本文件 = 留痕
- 第八原则 (反着做): S2/S6 反向胜出, 数据验证 ✅
- 第十原则 (火力全开找方法): 本 cron = 持续
- 第十一原则 (自主决策): 不切实盘, paper 持续

## 结论
**HEARTBEAT_OK 🟡 STATUS QUO 完全一致 vs #404 (15:39) + 0 new close 20h23m+ + signal scan 高活跃 21-22/cycle (新峰值)**
- 6 策略 grid 无变化 (Grand -$7.76, S2 ⭐ BEST 16h+, S6 ✅ 临界)
- cycle 15696 fresh, signal scan 21-22/cycle ⬆️ (vs #404 20/cycle, 新峰值)
- DAILY_CAP 满 lock 6/6 策略, 0 open positions
- 不 push 主人 (#77 strict, 无异常)
- 不调参 (STATUS QUO locked, 主人 design)
- 关注: 16:43 cron cc88ad27 / 17:23 hourly cron #47 / S6 下一次赢触发 / S2 样本向 15 收敛 / Grand -$10 buffer $2.24 / 7/14 00:00 reset (~7h19m)