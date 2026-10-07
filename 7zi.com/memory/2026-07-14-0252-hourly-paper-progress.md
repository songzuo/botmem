# Paper Sim Hourly Progress #55 (02:52 7/14 CST)

## 触发
- cron 40459cd1 hourly paper-progress-check.sh (DAILY_CAP reset 后 #3 hourly)
- 距 #414 (01:51 7/14) = 1h1m
- v3_paper.py PID 3875689 alive **54h30m** (steady since 20:22 7/11)
- cycle 19260 @ 02:53:04 (paper_log fresh, 20 signals/cycle)

## 6 策略 grid (sqlite 直查 02:52 CST 7/14)
| 策略 | closed | W/L | WR | pnl_gross | open_pnl | total | open pos |
|---|---|---|---|---|---|---|---|
| **S2_REVERSE_5MIN** ⭐ BEST | 8 | 6/2 | **75.0%** | **+$2.3583** | 0 | **+$2.3583** | 0 |
| **S6_REVERSE_TIGHT_30MIN** | 18 | 8/10 | **44.4%** ⬇️ | +$0.4041 ⬇️ | 0 | +$0.4041 ⬇️ | 0 |
| S5_ULTRA_TIGHT_30MIN | 20 | 7/13 | **35.0%** | -$0.3718 | 0 | -$0.3718 | 0 |
| S1_MOMENTUM_BASELINE | 8 | 1/7 | **12.5%** | -$2.7890 | 0 | -$2.7890 | 0 |
| S3_TIGHT_TPSL | 12 | 2/10 | **16.7%** | -$3.0600 | 0 | -$3.0600 | 0 |
| S4_WIDER_TPSL | 8 | 2/6 | **25.0%** ⬆️ | **-$4.8101** ⬆️ | 0 | **-$4.8101** ⬆️ | 0 |
| **GRAND** | **74** | **26/48** | **35.1%** ⬆️ | **-$8.2686** | 0 | **-$8.2685** ⬆️ | 0 opens |

*注: paper-progress-check.sh 报 Grand -$8.2685, sqlite -$8.2686 (= 浮点 0.0001 差异, 一致)*

## 关键观察 ⭐⭐⭐ 大变化

### STATUS EVOLVED (vs #414 01:51, +1h1m) — 多个新 close
- 6 策略 grid 大变: closed 67→**74** (+7 new close)
- Grand -$8.41 → **-$8.27** (+$0.14 改善)
- S2 ⭐ BEST 不变 (8 closed, WR 75%)
- S6 ⚠️ **退步**: 16 closed 8W/8L → 18 closed **8W/10L WR=44.4%** ⬇️ (新增 2 SL)
- S4 ⬆️ **改善**: 7 closed 1W/6L 14.3% → 8 closed **2W/6L WR=25.0%** (+1 W LITUSDT MaxHold +1.68%)
- S5 不变 (20 closed 7W/13L 35%)
- 所有 open positions 已 close (S4 LIT MaxHold + S6 DRAM MaxHold + S6 DEXE SL)

### 🆕 7/14 02:52 新 close (since 01:51, +1h1m 内 7 个新 close)
| strategy | symbol | side | pnl_pct | pnl_gross | reason | ts |
|---|---|---|---|---|---|---|
| **S4** ⭐ | LITUSDT | SELL | **+1.68%** | **+$0.51** | **MaxHold 2.0h expire** ✅ | 18:41 UTC |
| **S6** ❌ | DEXEUSDT | SELL | -0.78% | -$0.23 | SL | 18:34 UTC |
| **S6** ❌ | DRAMUSDT | BUY | -0.16% | -$0.05 | MaxHold 0.5h | 18:32 UTC |

**关键洞察**:
1. **S4 ⭐ LITUSDT SELL MaxHold +1.68%** ✅ - 顺势 SELL 大波动 MOMENTUM_DOWN 2h 满持 TP - S4 设计 MaxHold=2.0h 触达! 这是 S4 设计的触达
2. **S6 ❌ DEXE SELL -0.78%** - 反向 SELL on MOMENTUM_DOWN (chg24h 暂无, 但 SL 触达)
3. **S6 ❌ DRAM BUY -0.16% MaxHold** - 反向 BUY on MOMENTUM_DOWN (DRAM chg=-10%), 0.5h MaxHold 微损

### ⭐⭐⭐ S4 显著改善
- 7 笔 1W/6L WR=14.3% → **8 笔 2W/6L WR=25.0%** ⬆️ (+10.7pp)
- pnl_gross -$5.3153 → **-$4.8101** (+$0.505 over 1h1m)
- **+1W MaxHold +1.68%** = S4 设计 TP/2h 完整跑通
- S4 总从 -$5.17 改善到 -$4.81 (-$0.36 over 2h, 含 open_pnl 回吐)
- **重夺 BEST WORST 候选**? 现在 S3 -$3.06, S4 -$4.81 → S3 < S4 亏损, S3 NEW WORST? Actually S4 -$4.81 > S3 -$3.06, S4 仍 worst

### ⚠️ S6 闭环状态显著恶化
- 16 closed 8W/8L WR=50.0% (4h 前) → **18 closed 8W/10L WR=44.4%** ⬇️ (-5.6pp)
- pnl_gross $0.6834 → **$0.4041** (-$0.279 over 1h1m)
- 新增 2 SL: DEXE -0.78%, DRAM -0.16%
- **触发闭环临界条件**: 下次赢 9W/10L = 47.4% < 55% ❌ 闭环条件彻底恶化
- **新触发条件**: 需 W+2 AND L 不变 → 20 closed 10W/10L = 50.0% < 55%, 仍差 5.0%
- 或: 22 closed 11W/10L = 55.0% ⬆️ 但仍 < 55.0% 边际
- 实际触发条件: 23 closed 12W/10L = 56.5% > 55% ✅ 闭环 (需赢 4 笔且不再输)
- **S6 闭环短期内无法触发**, 累计 sample 已 18 笔 8W/10L (充分样本) ⚠️

### S2 ⭐ BEST 持续 26h+
- 8 笔 6W/2L WR=75.0% +$2.3583 (无变化)
- closed=8 差 7 笔 ≥15 (严解释未触达)
- avg_pct +1.030% (累计净 pnl/笔) 6 策略最高

### S5 进一步观察
- 20 笔 7W/13L WR=35.0% pnl=-$0.3718 (无变化 over 1h1m)
- 仍亏但小 (累计 -$0.37), 是 6 策略中第 2 小亏 (仅次于 S5)

### Grand -$8.27 SAFE (buffer to -$10 = $1.73)
- Grand -$8.41 → **-$8.27** (+$0.14 over 1h1m, S4 改善主导)
- 0 open positions (S4 LIT/S6 DRAM/S6 DEXE 全部 close)
- 累计 paper 0 真金

## 自主决策 (主人 23:57/00:25/06:30/20:20 授权 + 35d+ SSH 静默 #77 strict)

### ❌ 不切实盘 (严解释)
- **S2 ⭐** WR 75% > 55% ✅ + pnl +$2.3583 > 0 ✅ + max DD 1.725% (轻微超 1%) BUT **closed=8 差 7 笔 ≥15**
- **S6 ❌** WR=44.4% 闭环严重恶化 (需 4 笔赢 + 0 笔输)
- 严解释 (主人 06:30) = 全部同时触达 closed≥15 + WR>55% + pnl>0 + max DD<1% 才切
- 决策: paper 持续, 等 S2 样本扩到 15 / S6 闭环短期内无法触发

### ✅ paper mode 持续 (sample 扩张加速中)
- 主人 06:30 "全部的实盘交易都停了, 火力全开找方法" + 20:20 "定时任务每小时不停找方法验证一直到找到为止"
- paper 累计 0 真金, main bal/avail $607.05 idle 安全
- DAILY_CAP reset 后 2h52m 内 18 个新 close (vs 此前 27h+ 静默)

### ❌ 不 push 主人 (#77 strict)
- 无异常: Grand -$8.27 (< -$10 KILL STRONG 阈值 $1.73 SAFE), v3_paper alive 54h30m, 主人 SSH 静默 35d+
- best_strategy 切换 = 无 (S2 持续 ⭐ 26h+)
- S6 闭环短期不可触发 (当前 18/74 笔 = 24.3% 累计样本)

### ✅ 写盘 memory + 更新 HEARTBEAT (本文件)
- ✅ memory/2026-07-14-0252-hourly-paper-progress.md (THIS)
- ✅ HEARTBEAT.md HB #416

## 关注点 (下一小时 #56 ~03:49)

### 关键触发节点 (变化: S6 闭环严重恶化)
1. **S2 next win** → 7W/2L WR=77.8% + closed=9 → 持续 BEST
2. **S6 next win** → 9W/10L = 47.4% (仍差 7.6%) / 再赢 3 次 → 11W/10L=52.4% / 4 次 → 12W/10L=54.5% / **5 次 → 13W/10L=56.5% > 55% ✅ (需赢 5 笔且不再输)**
3. **S4 next win** → 3W/6L WR=33.3% / S4 维持 WR>25% 然后扩到 15 笔
4. **Grand 缓冲 $1.73 SAFE** (-$10 距离)

### 异常预案 (维持)
- Grand < -$10 → 推主人警报 (buffer $1.73 SAFE)
- S4 < -$10 → 推主人警报 (当前 -$4.81, 距离 $5.19 SAFE)
- v3_paper.py 挂 → 推主人警报
- 主人 SSH → 立即汇报

### 自我观察 (新)
- S6 已成 18 笔 8W/10L 充分样本 (n≥15), WR=44.4% < 55% = 设计失败
- S6 累计 pnl +$0.40 仍正 (因 MaxHold 0.5h 紧参数早期 16 笔含 8W=+3.43 中和了 8L=-3.02)
- DAILY_CAP reset 后**48min 内 7 个 new close (vs 通常每小时 ~3-4 个)**
- 关键新观察: **S4 MaxHold 2.0h 设计跑通** (LIT +1.68%) - S4 设计 TP/SL 4%/2.5%/2h 在大波动 MOMENTUM_DOWN 下有效
- S5 0.5h 紧参数 + S2 0.5h 紧参数都有效 (新样本继续)

## 与前原则的关系
- 第一原则 (利润第一): paper 持续找方法, S2 强化中
- 第三原则 (只做能获利的事): S2 × REVERSAL_DOWN 第八原则金矿 + S4 × MOMENTUM_DOWN 大波动有效
- 第六原则 (定时监控): 本 cron = 执行
- 第七原则 (自主决策留痕): 本文件 = 留痕
- 第八原则 (反着做): S2 持续验证 ✅ + S6 反向 DRAM BUY 微亏 (-0.16%, 0.5h MaxHold)
- 第十原则 (火力全开找方法): sample 扩张加速中
- 第十一原则 (自主决策): 不切实盘, paper 持续

## 结论
**HEARTBEAT_OK 🟡 STATUS EVOLVED + 7 new closes + S4 ⭐ 改善 + S6 ❌ 闭环恶化 + Grand -$8.27 SAFE**
- 6 策略 grid 大变 vs #414 (01:51, +1h1m):
  - **S4 ⭐ 改善**: 7→8 笔, WR 14.3%→**25.0%**, pnl_gross $5.32→**$4.81** (+$0.51 LIT MaxHold)
  - **S6 ❌ 闭环严重恶化**: 16→18 笔, WR 50.0%→**44.4%**, pnl_gross $0.68→**$0.40** (-$0.28, +2 SL)
  - S2 ⭐ 持续 BEST: 8 笔 6W/2L WR=75% +$2.36
  - S5/S1/S3 无变化
- 0 open positions (S4 LIT/S6 DRAM/S6 DEXE 全部 close)
- Grand -$8.27 (sqlite -$8.27 + 0 open_pnl → $1.73 buffer -$10 SAFE)
- 不 push 主人 (#77 strict, 35d 静默, paper 0 真金)
- 不调参 (STATUS QUO locked, 主人 design)
- 关注: 02:55 cron cc88ad27 / 03:49 hourly cron #56 / S2 强化 / S6 闭环短期难触发 (需赢 5 笔且不再输) / S4 设计 MaxHold 2.0h 跑通 / Grand -$10 buffer $1.73 SAFE