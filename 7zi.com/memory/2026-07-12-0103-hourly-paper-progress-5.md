# 2026-07-12 01:03 CST — Paper Sim 每小时找方法 #5 (S2_PARTIUSDT close)

**触发**: cron 40459cd1-c701-4f29-beb6-2e1dd9aa72d4 (每小时 cron #5)
**对比**: 00:38 cron #24 → 01:03 hourly #5 (25min)

**v3_paper.py 状态**: PID 3875689 alive, 启动 4h41min (20:22 重启过)

## 6 策略小时汇总 #5 (01:03 CST)

| 策略 | closed | WR | pnl_gross | open | total | Δ vs #4 (00:03) |
|---|---|---|---|---|---|---|
| **S2_REVERSE_5MIN** 🎯 BEST | **4** (+1) | **50.0%** (+17pp) | **+$0.46** (+$0.44) | $0 | **+$0.46** | PARTIUSDT close +$0.46 |
| **S6_REVERSE_TIGHT_30MIN** | **10** | **50.0%** | **+$0.31** | $0 | **+$0.31** | 0 新数据 |
| S5_ULTRA_TIGHT_30MIN | 7 | 42.9% | +$0.11 | $0 | +$0.11 | 0 新数据 |
| S3_TIGHT_TPSL | 5 | 20.0% | -$1.03 | $0 | -$1.03 | 0 新数据 |
| S1_MOMENTUM | 4 | 0% | -$1.57 | $0 | -$1.57 | 0 新数据 |
| S4_WIDER_TPSL | 4 | 25.0% | -$2.91 | $0 | -$2.91 | 0 新数据 |

**Grand total**: **-$4.62** (vs 00:38 -$4.57 略恶化 -$0.05)

## 关键事件 ⭐⭐⭐⭐

1. ⭐⭐⭐ **S2_PARTIUSDT close +$0.46** (从浮 +$0.50 → 实收 +$0.46, MaxHold 30min 触发)
   - WR 33%→50% (临界)
   - pnl 累计 -$0.60 → +$0.46 (质变, 从亏转正)
2. ✅ **S2 closed 3→4, WR 50% (2W/2L)** = 仍 best
3. ✅ **S6 仍 closed=10 pnl=+$0.31 WR=50%** = 持续稳候选
4. ⚠️ **Grand -$4.62 vs -$5 KILL 仅 +$0.38 buffer** (TIGHT)
5. ⚠️ 6 策略全 0 open positions, 等下一波信号

## 推送判断

- ❌ best_strategy 切换 (S2 持续 best, 00:38 已推过切换 S5→S2)
- ❌ S6 closed >= 10 已 00:38 推过 (TG 4251)
- ❌ S2 候选条件: closed=4 < 5 ❌, WR 50% 临界, pnl +$0.46 ✅ → 仍非严格"候选"
- ❌ 6 策略总亏 < -$5 (现 -$4.62, +$0.38 buffer)
- ❌ v3_paper.py 挂

✅ **不推** (#77 strict + 00:38 已推双规则 + 数据变化小)

## 候选策略双雄 (S2 vs S6)

| 维度 | S2_REVERSE_5MIN | S6_REVERSE_TIGHT_30MIN |
|---|---|---|
| TP/SL/Max | 2.0/1.5/0.5h | 0.8/0.5/0.5h |
| Reverse | ✅ | ✅ |
| closed | 4 | **10** |
| WR | 50.0% (临界) | 50.0% (临界) |
| pnl | +$0.46 | +$0.31 |
| avg_pct | +0.10% | +0.06% |

**S2 优势**: 单笔均值更高 (+0.10% vs +0.06%) — 押对大波动爆发 (PARTIUSDT 单笔 +0.46)
**S6 优势**: 样本更大 (10 vs 4) — 95% CI 收敛, WR 更可信
**共同点**: 都是反向 + 短 MaxHold

## 风控 (P0/P1)

- ✅ P0 main bal/avail $607.06 — 闲置
- ✅ P0 paper 0 真仓订单
- ⚠️ Grand -$4.62 vs -$5 KILL 仅 +$0.38 buffer (TIGHT)
- ✅ v3_paper.py PID 3875689 alive 4h41m
- ✅ risk_manager PID 922 alive
- ⚠️ 6 策略 0 open positions, 等下一波信号
- ⚠️ 主人 35d+ SSH 静默 #77 strict

## 自主决策留痕 (第七原则)

**改动**: 无 (纯观察)
**触发**: N/A
**是否越界**: 否

## nextEvents

- 🟡 01:08 paper 5min cron (~5min)
- 🔵 02:03 hourly cron #6 (~1h)
- 🟢 23:00 7/12 日终对比 (~22h)
- 🟢 主人 35d+ SSH 静默 #77 strict — 等 A/B/C/D 拍板 (TG 4251)