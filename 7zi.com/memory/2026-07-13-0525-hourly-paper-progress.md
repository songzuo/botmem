# Paper Sim Hourly Progress #37 (05:25 7/13 CST)

## 触发
- cron 40459cd1 hourly paper-progress-check.sh
- 距 #36 (04:23 7/13) = 1h2m
- v3_paper.py PID 3875689 alive **33h04m** (steady since 20:22 7/11)
- cycle ~11500+ @ 05:25 (fresh signal scan 持续)

## 6 策略 grid (sqlite 直查 05:25 CST)
| 策略 | closed | W/L | WR | pnl | avg_pct | best | worst | verdict |
|---|---|---|---|---|---|---|---|---|
| **S2_REVERSE_5MIN** ⭐ NEW BEST | 6 | 4/2 | **66.7%** | **+$1.7362** | +0.971% | 2.14% | -1.725% | ⭐ BEST 5h+ 持续 |
| **S6_REVERSE_TIGHT_30MIN** ✅ closed=15 | 15 | 8/7 | 53.3% | +$0.8494 | +0.190% | 1.203% | -1.487% | ✅ closed 触达, WR 差 1.7% |
| S5_ULTRA_TIGHT_30MIN | 15 | 5/10 | **33.3%** | -$0.4600 | -0.065% | 1.493% | -1.052% | ❌ 老 BEST 退步 -$0.96 over 02:57 |
| S3_TIGHT_TPSL | 9 | 1/8 | **11.1%** | -$2.7925 | -1.039% | — | — | ❌ |
| S1_MOMENTUM_BASELINE | 6 | 0/6 | **0.0%** | -$2.5849 | -1.444% | — | — | ❌ |
| S4_WIDER_TPSL | 6 | 1/5 | 16.7% | -$4.5055 | -2.519% | — | — | ❌ worst |
| **GRAND** | **57** | **19/38** | **33.3%** | **-$7.7574** | — | — | — | ⚠️ **超 -$5 KILL by $2.76** |

*注: paper-progress-check.sh 报 Grand -$7.7573 vs sqlite -$7.7574 = 浮点差异, 一致*
*注2: vs #36 (04:23) 状态完全一致: 0 new close, S2 BEST 持续, S6 closed=15, Grand 不变*

## 关键观察 (新加 signal_type 维度分析)

### (strategy × signal_type) 表现 (sqlite 直查)
| strategy | signal_type | n | W/L | WR | pnl | verdict |
|---|---|---|---|---|---|---|
| **S2** | **REVERSAL_UP** | 3 | 3/0 | **100%** | **+$1.695** | ⭐⭐⭐ **金矿** (3 笔全胜) |
| **S6** | REVERSAL_UP | 6 | 4/2 | 66.7% | +$0.579 | ✅ REVERSAL_UP 是 S6 主要利润源 |
| **S5** | MOMENTUM_UP | 3 | 2/1 | 66.7% | +$0.543 | ⚠️ MOMENTUM_UP 在 S5 还能赚 |
| **S5** | MOMENTUM_DOWN | 3 | 2/1 | 66.7% | +$0.507 | ⚠️ MOMENTUM_DOWN 在 S5 也能赚 |
| **S6** | MOMENTUM_DOWN | 4 | 2/2 | 50.0% | +$0.125 | 中性 |
| **S2** | MOMENTUM_UP | 2 | 1/1 | 50.0% | +$0.121 | 中性 |
| **S2** | MOMENTUM_DOWN | 1 | 0/1 | 0.0% | -$0.08 | 样本小 |
| S6 | MOMENTUM_UP | 3 | 1/2 | 33.3% | +$0.08 | 中性偏弱 |
| S6 | REVERSAL_DOWN | 2 | 1/1 | 50.0% | +$0.066 | 中性 |
| S3 | MOMENTUM_UP | 3 | 1/2 | 33.3% | -$0.303 | ❌ |
| S3 | MOMENTUM_DOWN | 1 | 0/1 | 0.0% | -$0.315 | ❌ |
| **S5** | **REVERSAL_DOWN** | 3 | 0/3 | **0.0%** | **-$0.674** | ❌ REVERSAL_DOWN 杀掉 S5 |
| S3 | REVERSAL_DOWN | 1 | 0/1 | 0.0% | -$0.725 | ❌ |
| S5 | REVERSAL_UP | 6 | 1/5 | 16.7% | -$0.836 | ❌ REVERSAL_UP 在 S5 不灵 |
| S1 | MOMENTUM_UP | 3 | 0/3 | 0.0% | -$0.948 | ❌ 顺势全败 |
| S4 | MOMENTUM_UP | 1 | 0/1 | 0.0% | -$1.045 | ❌ |
| S4 | MOMENTUM_DOWN | 1 | 0/1 | 0.0% | -$1.066 | ❌ |
| **S3** | **REVERSAL_UP** | 4 | 0/4 | **0.0%** | **-$1.450** | ❌❌ REVERSAL_UP 在 S3 全败 |
| **S1** | **REVERSAL_UP** | 3 | 0/3 | **0.0%** | -$1.637 | ❌❌ |
| **S4** | **REVERSAL_UP** | 4 | 1/3 | 25.0% | **-$2.394** | ❌❌❌ REVERSAL_UP 在 S4 最惨 |

### 关键洞察 ⭐⭐⭐
1. **S2 × REVERSAL_UP 100% WR (3/3) +$1.695** = 金矿, 但样本仅 3 笔
2. **REVERSAL_UP 在不同策略分化极大**:
   - S2: 100% WR +$1.70 ✅ (MaxHold 0.5h 短促)
   - S6: 66.7% WR +$0.58 ✅ (MaxHold 0.5h 短促) 
   - S5: 16.7% WR -$0.84 ❌ (MaxHold 0.5h 同样但 SL 0.5% 紧)
   - S3: 0% WR -$1.45 ❌❌ (TP/SL 1% 顺势紧)
   - S1: 0% WR -$1.64 ❌❌ (TP/SL 2%/1.5% 顺势)
   - S4: 25% WR -$2.39 ❌❌❌ (TP/SL 4%/2.5% 顺势宽)
   - **规律**: REVERSAL_UP 在反向策略 (S2/S6) 大胜, 在顺势策略 (S1/S3/S4/S5) 全败
   - **结论**: 第八原则 (反着做) **数据再次验证** ✅

3. **REVERSAL_DOWN 在所有策略全部亏损** = REVERSAL_DOWN 信号可能不可靠或市场下行趋势中回补不及时
   - S5 REVERSAL_DOWN 3/3 全败 -$0.67
   - S3 REVERSAL_DOWN 0/1 -$0.73
   - S6 REVERSAL_DOWN 1/1 +$0.07 (微赚)

4. **MOMENTUM 整体偏弱**: 
   - S5 MOMENTUM_UP + MOMENTUM_DOWN 6 笔 4W/2L +$1.05 (S5 唯一赚的维度)
   - 其他策略 MOMENTUM 几乎全败

### 标的维度分析 (n≥2)
- BEST: SLXUSDT 3 笔 2W +$0.49, DEXEUSDT 4 笔 2W +$0.31, BUSDT 6 笔 2W +$0.26, CLOUSDT 4 笔 2W +$0.19
- WORST: EVAAUSDT 6 笔 1W -$2.27, EDGEUSDT 3 笔 1W -$0.99, VELVETUSDT 4 笔 1W -$0.62
- **标的池选择对 PnL 影响显著** (S2 SELL CLOUSDT 16:17 +$0.64 = 7/12 同标的 S6 +$0.25)

## 自主决策 (主人 23:57/00:25/06:30/20:20 授权 + 35d+ SSH 静默 #77 strict)

### ❌ 不切实盘 (严解释)
- **S2 ⭐ WR 66.7% > 55% ✅ + pnl +$1.7362 > 0 ✅ + max DD 1.725% < 设计 ⚠️** BUT **closed=6 差 9 笔 ≥15**
- S6 ✅ closed=15 触达 BUT WR=53.3% 差 1.7% (下一次赢即 56.25%)
- **未触达闭环**: 严解释 (主人 06:30) = closed≥15 + WR>55% + pnl>0 + max DD<1% 全部同时

### ✅ paper mode 持续 (STATUS QUO)
- 主人 06:30 "全部的实盘交易都停了, 火力全开找方法" + 20:20 "定时任务每小时不停找方法验证一直到找到为止"
- paper 累计 0 真金, main bal/avail $607.05 idle 安全
- 当前所有 cron + signal scan + sqlite ground truth 正常

### ❌ 不 push 主人 (#77 strict)
- 无异常: Grand -$7.76 (< -$10 KILL STRONG 阈值, 不推), v3_paper alive, 主人 SSH 静默 35d+
- best_strategy 切换 = 无 (S2 持续 ⭐ 5h+)
- S6 触发闭环 (下一次赢) = **下一次赢即主动建议**, 但**当前未赢未触发**

### ✅ 写盘 memory + 更新 HEARTBEAT (本文件)
- ✅ memory/2026-07-13-0525-hourly-paper-progress.md (THIS, 含 (strategy×signal_type) 新洞察)
- ✅ HEARTBEAT.md HB #397

## 关注点 (下一小时 #38 ~06:23)

### 关键触发节点
1. **S6 下一次赢** → 9W/7L = 56.25% WR > 55% 触发闭环 → 主动建议切实盘 S6
2. S2 +1 close (现 6) → 样本向 15 收敛, 若 WR 维持 66.7% → 持续 BEST
3. 7/14 00:00 DAILY_CAP reset (~18h35m)

### 异常预案 (维持)
- Grand < -$10 → 推主人
- v3_paper.py 挂 → 推主人
- 主人 SSH → 立即汇报

### 自我观察 (新)
- S2 × REVERSAL_UP 3 笔 100% WR 是新发现金矿, 但样本仅 3 笔不足以下结论
- 待 S2 +REVERSAL_UP 样本扩到 8-10 笔再评判, 若维持 >70% WR = 强信号
- REVERSAL_DOWN 在所有策略几乎全败, 可能需要在 v3 信号生成逻辑里审视

## 与前原则的关系
- 第一原则 (利润第一): paper 持续找方法
- 第三原则 (只做能获利的事): REVERSAL_UP × S2/S6 = 已找到的方向
- 第六原则 (定时监控): 本 cron = 执行
- 第七原则 (自主决策留痕): 本文件 = 留痕
- 第八原则 (反着做): S2/S6 反向策略胜出, **数据验证** ✅
- 第十原则 (火力全开找方法): 本小时 cron = 持续
- 第十一原则 (自主决策): 不切实盘, paper 持续

## 结论
**HEARTBEAT_OK 🟡 STATUS QUO 完全一致 vs #36 (04:23) + 新洞察: S2×REVERSAL_UP 100% WR (3/3) 金矿**
- 6 策略 grid 无变化 (Grand -$7.76, S2 ⭐ BEST, S6 ✅ closed=15 临界)
- **新发现**: REVERSAL_UP 在反向策略 (S2/S6) 大胜, 在顺势策略 (S1/S3/S4/S5) 全败 = 第八原则数据验证
- **新发现**: REVERSAL_DOWN 在所有策略几乎全败 = 信号源可能需要审视
- 0 new close (last 9h7m+ S5 SL)
- 0 open positions, 0 真金风险
- 不 push 主人 (#77 strict, 无异常)
- 不调参 (STATUS QUO locked, 主人 design)
- 关注: 06:23 cron / S6 下一次赢触发 / S2 +REVERSAL_UP 样本扩到 8+ / Grand -$10 buffer $2.24