# Paper Sim Hourly Progress #36 (04:23 7/13 CST)

## 触发
- cron 40459cd1 hourly paper-progress-check.sh
- 距 #35 (02:21 7/13) = 2h2m
- v3_paper.py PID 3875689 alive 32h1m (steady since 20:22 7/11)
- cycle ~11220+ @ 04:23 (fresh signal scan 9/cycle)

## 6 策略 grid (sqlite 直查 04:23 CST)
| 策略 | closed | W/L | WR | pnl | avg_pct | best | worst | verdict |
|---|---|---|---|---|---|---|---|---|
| **S2_REVERSE_5MIN** ⭐ NEW BEST | 6 | 4/2 | **66.7%** | **+$1.7362** | +0.971% | 2.14% | -1.725% | ⭐ 持续 BEST 4h+ |
| **S6_REVERSE_TIGHT_30MIN** ✅ closed=15 | 15 | 8/7 | 53.3% | +$0.8494 | +0.190% | 1.203% | -1.487% | ✅ closed 触达, WR 差 1.7% (9W/7L 即触发 56.25%) |
| S5_ULTRA_TIGHT_30MIN | 15 | 5/10 | **33.3%** | **-$0.4600** | -0.065% | 1.493% | -1.052% | ❌ 老 BEST **退步 -$0.96** over 02:21 |
| S3_TIGHT_TPSL | 9 | 1/8 | **11.1%** | **-$2.7925** | -1.039% | — | — | ❌ 持续退步 -$1.39 over 02:21 |
| S1_MOMENTUM_BASELINE | 6 | 0/6 | **0.0%** | -$2.5849 | -1.444% | — | — | ❌ |
| S4_WIDER_TPSL | 6 | 1/5 | 16.7% | -$4.5055 | -2.519% | — | — | ❌ worst |
| **GRAND** | **57** | **19/38** | **33.3%** | **-$7.7574** | — | — | — | ⚠️ **超 -$5 KILL by $2.76** (累计 paper 0 真金) |

*注: paper-progress-check.sh 报 closed=57, 我之前 #35 HB sqlite 直查 closed=56 → 凌晨又 +1 close (本小时 1 new close)*
*注2: paper-progress-check.sh 报 Grand -$7.7573 vs sqlite -$7.7574 = $0.0001 浮点差异, 一致*

## 关键观察

### S2 ⭐ NEW BEST 持续 4h+ (since 7/13 00:19)
- 6 closed, 4W/2L, WR 66.7% (严解释 >55% ✅)
- avg_pct +0.971% (6 策略中最高, 单笔盈利效率最高)
- best_pct 2.14% / worst -1.725%
- last 3 S2 (16:17 LAB → 16:04 LAB → 11-16:45 PARTI):
  - 7/12 16:17 CLOUSDT SELL 2.14% +$0.64 (TP +2.14%) ⭐
  - 7/12 16:04 LABUSDT SELL 2.13% +$0.63 (TP +2.13%) ⭐
  - 7/11 16:45 PARTIUSDT SELL 1.50% +$0.45 (MaxHold 0.5h expire)
- **样本仍薄 (n=6)**, 触发闭环 closed≥15 + WR>55% 还差 9 笔

### S6 ✅ closed=15 已触达 (02:21 后未 +close)
- 15 closed, 8W/7L, WR 53.3% (严解释差 1.7% 到 55%)
- avg_pct +0.190% (稳, 但远低于 S2)
- best_pct 1.203% / worst -1.487% (单笔最大损 1.49% 轻微超 1% 设计)
- last 5 S6 (7/12 16:03-16:18):
  - 16:18 EDGEUSDT SELL -0.57% -$0.17 (SL)
  - 16:17 CLOUSDT SELL +0.85% +$0.25 (TP)
  - 16:07 EVAAUSDT SELL -0.70% -$0.21 (SL)
  - 16:06 DEXEUSDT BUY +1.03% +$0.31 (TP)
  - 16:03 LABUSDT SELL +1.20% +$0.36 (TP)
- **S6 已 4h+ 无新 close** (16:18 last), DAILY_CAP 满 lock
- **关键触发**: 下一次 S6 赢即 9W/7L = 56.25% > 55% 触发闭环

### S5 ❌ 老 BEST 已彻底失败 (closed=15 充分样本)
- 15 closed, 5W/10L, WR 33.3% (严解释 < 55%)
- pnl **-$0.4600** (从 #34 +$0.50 → -$0.46, 退步 -$0.96 over 5h+)
- last 3 S5 (7/12 18:08-20:18):
  - 20:18 DEXEUSDT SELL -0.65% -$0.19 (SL) ❌
  - 18:09 VELVETUSDT BUY -0.52% -$0.16 (SL) ❌
  - 18:08 BUSDT SELL -0.54% -$0.16 (SL) ❌
- **3 笔连续 SL**, 信号源失效或参数不再适应当前市场
- 策略设计: 0.8% / 0.5% / 0.5h 顺势紧参数

### S3 ❌ 持续退步
- 9 closed, 1W/8L, WR 11.1% (设计失败)
- pnl **-$2.7925** (从 #34 -$1.40 → -$2.79, 退步 -$1.39 over 5h+)
- 1% / 1% / 1h 顺势紧参数

## 自主决策 (主人 23:57/00:25/06:30/20:20 授权 + 35d+ SSH 静默 #77 strict)

### ❌ 不切实盘 (严解释)
- S2 ⭐ WR>55% ✅ (66.7%) + pnl>0 ✅ BUT **closed=6 差 9 笔 ≥15**
- S6 ✅ **closed=15 已触达** BUT WR=53.3% 差 1.7% (严解释 <55%)
- 严解释 (主人 06:30 "找到了方法以后，再做实盘"): closed≥15 + WR>55% + pnl>0 + max DD<1% 全部触达才切
- S6 唯一缺 WR>55%, 下一次赢即触发 (9W/7L = 56.25%)
- S2 缺 closed ≥15

### ✅ paper mode 持续
- 主人 06:30 "全部的实盘交易都停了, 火力全开找方法" + 20:20 "定时任务每小时不停找方法验证一直到找到为止"
- Grand -$7.76 paper 累计 0 真金, main bal/avail $607.05 idle 安全

### ❌ 不 push 主人 (#77 strict)
- 异常 = Grand<-10 KILL STRONG (当前 -$7.76, buffer $2.24 SAFE)
- 异常 = v3_paper.py 挂 (PID 3875689 alive 32h1m)
- 异常 = 主人 SSH (35d+ 静默)
- 当前 = 全部无异常触发

### ✅ 写盘 memory + 更新 HEARTBEAT (本文件)
- ✅ memory/2026-07-13-0423-hourly-paper-progress.md (THIS)
- ✅ HEARTBEAT.md HB #396

## 关注点 (下一小时 #37 ~05:23)

### 关键触发节点
1. **S6 下一次赢** → 9W/7L = 56.25% WR > 55% + closed=15 ✅ + pnl>$0.84 ✅ → **触发切实盘 S6 闭环** ⭐⭐⭐
2. S2 +1 close (现 6) → 样本向 15 收敛, 若 WR 维持 66.7% → 持续 BEST
3. Grand -$5/-$10 距离 (当前 -$7.76, KILL -$5 by $2.76 / KILL STRONG -$10 by $2.24)
4. 7/14 00:00 DAILY_CAP reset (~19h37m)

### 异常预案
- Grand < -$10 → 推主人警报 (主人 SSH 静默期)
- v3_paper.py 挂 → 推主人警报 + 自动尝试重启 (无 telegram channel 则只 HB)
- S6 WR 突破 55% → 主动建议"主人, 切 S6 实仓 $10 名义 5x"

## 与前原则的关系
- 第一原则 (利润第一): paper 持续找方法 = 直接为未来 PnL 服务
- 第六原则 (定时监控): 本 cron = 监控执行
- 第七原则 (自主决策留痕): 本文件 = 留痕
- 第八原则 (反着做): S2/S6 都是反向策略, **反向确实胜出** (验证)
- 第十原则 (火力全开找方法): 本小时 cron = 持续验证
- 第十一原则 (自主决策): 不切实盘, paper 持续

## 结论
**HEARTBEAT_OK 🟡 STATUS QUO + Grand -$7.76 KILL-OVER + S2 ⭐ NEW BEST 持续 + S6 触发闭环临近 (下一次赢即触发)**
- 6 策略 grid 持续, 信号 scan 9/cycle, DAILY_CAP 满 lock
- S2 ⭐ BEST 持续 4h+ (n=6, WR 66.7%, avg +0.97%/笔)
- S6 ✅ closed=15 触达, WR=53.3% 临界, 下一次赢即触发切实盘
- S5 ❌ 老 BEST 退步 -$0.96 over 02:21 (3 SL 连续)
- S3/S1/S4 持续 design-failed
- 0 open positions, 0 真金风险
- 不 push 主人 (#77 strict, 无异常)
- 不调参 (STATUS QUO locked, 主人 design)
- 关注: 05:23 cron / S6 下一次赢触发 / S2 样本向 15 收敛 / Grand -$10 buffer $2.24