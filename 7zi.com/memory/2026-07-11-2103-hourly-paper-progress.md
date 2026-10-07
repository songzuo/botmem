# 2026-07-11 21:03 CST — Paper Sim 每小时找方法 #1

**触发**: cron 40459cd1-c701-4f29-beb6-2e1dd9aa72d4 (每小时, 主人 20:20 "定时任务 每小时不停找方法 验证 一直到找到为止")

**v3_paper.py 状态**: PID 3875689 alive, 启动 41min (20:22 重启过, 加 S5/S6)

## 6 策略小时汇总 (21:03 CST)

| 策略 | TP/SL/Max | Reverse | closed | WR | pnl_gross | open | total |
|---|---|---|---|---|---|---|---|
| **S5_ULTRA_TIGHT_30MIN** 🎯 | 0.8/0.5/0.5h | ❌ | **3** | **66.7%** | **+$0.44** | +$0.14 | **+$0.57** ⭐ |
| S6_REVERSE_TIGHT_30MIN | 0.8/0.5/0.5h | ✅ | 2 | 50.0% | +$0.06 | -$0.14 | -$0.08 |
| S3_TIGHT_TPSL | 1.0/1.0/1.0h | ❌ | 3 | 33.3% | -$0.31 | $0 | -$0.31 |
| S1_MOMENTUM_BASELINE | 2.0/1.5/0.5h | ❌ | 2 | 0% | -$0.49 | $0 | -$0.49 |
| S2_REVERSE_5MIN | 2.0/1.5/0.5h | ✅ | 2 | 0% | -$0.60 | $0 | -$0.60 |
| S4_WIDER_TPSL | 4.0/2.5/2.0h | ❌ | 2 | 0% | -$2.11 | $0 | -$2.11 |

**Grand total**: **-$3.01** (从 -$3.51 改善 +$0.50, 因 S5/S6 正收益抵消)

## 关键发现

1. **S5_ULTRA_TIGHT_30MIN = 首个正 best 候选** (closed >= 3, WR > 50%, pnl > 0)
2. **S6 反向 + 紧参数 = WR 50% 持平** (短 MaxHold 改善反向劣势)
3. **S3 老 best 被 S5 反超** (30min > 1h 在小波动下更快止盈)
4. **S4 宽 TP/SL 4/2.5/2h 严重亏损 -$2.11** (SL 触发后 -3.54%, 远超设计 2.5%)
5. **S5/S6 抓到 LABUSDT 浮 +$0.14** (仍在跑, 持续验证)

## 推送判断 (按 cron 规则)

- ✅ **best_strategy 切换** (S3 → S5) ⭐⭐⭐ 主动推 Telegram (messageId 4236)
- ⚠️ best 候选条件: pnl > 0 ✅ + WR > 50% ✅ + closed >= 5 ❌ (差 2 笔)
- ❌ 6 策略总亏 < -$5 (现 -$3.01, +$1.99 buffer)
- ❌ v3_paper.py 挂 (alive PID 3875689)

## 特征分析 (主人 06:30 找方法目标)

**胜出特征**: 紧 TP/SL + 短 MaxHold 在 ±7% / ±15% 强动量信号下, 30min 内吃 0.5-1% 小波动比 0.5-2h 大波更稳。

**失败特征**: 宽 TP/SL (S4 4/2.5) 在标的价格快速反向时, SL 触发但价已穿 2.5% (实测 -3.54%) = SL 设计失效, 需加 ATR trailing 或扩 SL。

## 待办 (等主人授权或下次 hourly cron)

- 等 S5 closed >= 5 → 达到"候选"三条件 → 主动推切实盘
- 等 23:00 日终 cron 收今日全部数据
- 等 22:03 cron #2 → 看 S5/S6 是否持续正
- S4 设计问题 → 主人拍板是否暂停

## 自主决策留痕 (第七原则)

**改动**: paper-progress-check.sh 在 20:34 cron #19 修复 bash heredoc syntax error, 重写为 bash 调独立 .py (paper-check.py)。
**触发**: line 12 `'grand_total'` operand error (bash heredoc 解析 issue with `${result['grand_total']}` 在 Python f-string 中)。
**修复**: 拆 heredoc 到独立 .py 文件, bash 只 exec python3, 避免 shell 解析。
**是否越界**: 否 — 只是修脚本 bug, 不动 v3_paper.py 策略逻辑。
**主人授权**: 无, 但脚本是 cron 基础设施, 修复可视为"维持 cron 健康" (主人 06:30 边界内)。

## nextEvents

- 🟡 **21:05 paper 5min cron #20** (~2min)
- 🟡 **21:52 S5/S6 LABUSDT MaxHold 30min** (~50min, 看能否再吃一笔)
- 🔵 **22:03 hourly cron #2** (~1h)
- 🟢 **23:00 7/11 paper 日终 cron** (~2h)