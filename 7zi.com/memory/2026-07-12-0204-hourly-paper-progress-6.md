# 2026-07-12 02:04 CST — Paper Sim 每小时找方法 #6 (steady-state wait)

**触发**: cron 40459cd1-c701-4f29-beb6-2e1dd9aa72d4 (每小时 cron #6)
**对比**: 01:03 #5 → 02:04 #6 (1h1min, steady-state)

**v3_paper.py 状态**: PID 3875689 alive, 启动 5h42min (20:22 重启过)

## 6 策略小时汇总 #6 (02:04 CST, 无变化)

| 策略 | closed | WR | pnl_gross | open | total |
|---|---|---|---|---|---|
| **S2_REVERSE_5MIN** 🎯 BEST | 4 | 50.0% | +$0.46 | $0 | +$0.46 |
| **S6_REVERSE_TIGHT_30MIN** ⭐ 候选 | **10** | 50.0% | +$0.31 | $0 | +$0.31 |
| S5_ULTRA_TIGHT_30MIN | 7 | 42.9% | +$0.11 | $0 | +$0.11 |
| S3_TIGHT_TPSL | 5 | 20.0% | -$1.03 | $0 | -$1.03 |
| S1_MOMENTUM | 4 | 0% | -$1.57 | $0 | -$1.57 |
| S4_WIDER_TPSL | 4 | 25.0% | -$2.91 | $0 | -$2.91 |

**Grand total**: **-$4.62** (无变化, 距 -$5 KILL +$0.38 buffer TIGHT)

## 推送判断

- ❌ best_strategy 切换 (S2 持续 best, 00:38 已推过)
- ❌ S6 closed >= 10 (00:38 已推过)
- ❌ best_strategy pnl > 0 (已 00:38 + 01:03 推过)
- ❌ 6 策略总亏 < -$5 (现 -$4.62, +$0.38 buffer)
- ❌ v3_paper.py 挂

✅ **不推** (#77 strict + 数据无变化 + 已推过 4 次)

## 特征分析 (steady-state 1h+)

**S2 + S6 双候选**:
- 都是反向 + 短 MaxHold (0.5h)
- S2: 大单笔均值 (+0.10%/笔) — 押对大波动
- S6: 大样本 (10 笔, 95% CI 收敛) — WR 更可信

**信号池状态**:
- 71 ticker signal pool
- 0:00 DAILY_CAP reset 后 LABUSDT 6 单已全 close (~00:30)
- 现 1h+ 无新信号触发 = 市场平淡, 等 ±7%/±15% 强动量

**总累计 (19h22m 找方法进度)**:
- 总 closed: 4+4+5+4+7+10 = 34 笔
- 平均每策略 5.7 笔
- S6 10 笔最成熟, S5 7 笔次之

## 风控 (P0/P1)

- ✅ P0 main bal/avail $607.06 — 闲置
- ✅ P0 paper 0 真仓订单
- ⚠️ Grand -$4.62 vs -$5 KILL 仅 +$0.38 buffer (TIGHT)
- ✅ v3_paper.py PID 3875689 alive 5h42m
- ✅ risk_manager PID 922 alive
- ⚠️ 6 策略 0 open positions (等下一波信号)
- ⚠️ 主人 35d+ SSH 静默 #77 strict

## 自主决策留痕 (第七原则)

**改动**: 无 (纯观察)
**触发**: N/A
**是否越界**: 否

## nextEvents

- 🟡 02:09 paper 5min cron (~5min)
- 🔵 03:03 hourly cron #7 (~1h)
- 🟢 23:00 7/12 日终对比 (~21h)
- 🟢 主人 35d+ SSH 静默 #77 strict — 等 A/B/C/D 拍板 (TG 4251)