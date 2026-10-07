# 2026-07-11 06:42 — Paper Mode 启动 (主人 06:30 最高指令)

## 主人口令
> "没看到任何效果。现在调整，变成模拟盘，每五分钟进行核对，找到了方法以后，再做实盘。我们的目标改成，找到获利的方法。"
> "全部的实盘交易都停了，火力全开的找方法。"

## 行动 (06:32-06:42 CST)
1. ✅ kill v3.13 PID 3200864 (crypto_momentum_v3.py)
2. ✅ kill decision_system PID 2701181
3. ✅ kill tradfi_v1 PID 878199 (主人 06:31 "全部")
4. ✅ manual close SENTUSDT LONG 1219 @ 0.01474 (FILLED, micro loss)
5. ✅ main account: bal/avail $607.06 / 0 open positions
6. ✅ risk_manager PID 922 保留 (read-only 风控监控)
7. ✅ disable 系统 cron: */5 crypto_momentum_v3.py watchdog + decision_system watchdog (避免自动重启真仓)
8. ✅ 写 paper/v3_paper.py: 4 策略 grid 横向对比找最优
9. ✅ 启动 paper PID 3658109 — cycle 1 14 signals, 4 策略各开 1 单 EVAAUSDT @ 2.4752

## Paper 设计 (找方法)
- **信号源** 100% 复用 v3 (chg24h ±7% momentum + ±15% reversal + 量比 >4x + MIN_PRICE 0.01)
- **数据**: Binance ticker / klines (真实 market data)
- **下单**: mock，写 SQLite /opt/trader/paper/paper_trades.db
- **4 策略并行** 横向对比找最优:
  - S1_MOMENTUM_BASELINE: 顺势, TP 2% / SL 1.5% / MaxHold 0.5h
  - S2_REVERSE_5MIN: 反向, TP 2% / SL 1.5% / MaxHold 0.5h (v3.13 风格)
  - S3_TIGHT_TPSL: 顺势, TP 1% / SL 1% / MaxHold 1h (快进快出)
  - S4_WIDER_TPSL: 顺势, TP 4% / SL 2.5% / MaxHold 2h (抓大波)

## Cron 新建 (主人 06:30 "每五分钟进行核对")
- **cc88ad27** Paper Sim 5min Check: 每 5min 检查 progress, 异常推 Telegram
- **536879d2** Paper Sim 23:00 日终对比: 每天 23:00 推对比报告 + 切实盘建议

## 预期产出
- 24h 内: 4 策略样本 ~30-80 笔/策略
- 48h: WR 收敛, 找出 best_strategy
- 主人 06:30 "找到了方法以后，再做实盘" → best_strategy pnl > 0 + WR > 50% + closed >= 20 → 建议切实盘
- 4 策略全亏: 复盘信号源 (chg24h 阈值 / 量比 / 价格门槛)

## 留痕
- 备份: /opt/trader/paper/v3_paper.py (新)
- 备份: cron 旧版 /tmp/crontab.bak
- 不动 v3 源文件 (第七原则 + 主人口味)

## 主人边界
- 不 push 主人 (35d+ SSH 静默 #77 strict)
- 5min cron 异常才推 (best 切换 / 4 策略总亏 < -$2 / 进程挂)
- 23:00 主动推日终
- 不修 silent SL fail (主人授权不修)

## 下一步
- 等 5min cron #1 跑 (06:45 first check)
- 24h 后 23:00 日终报告
- 7-13 6:30 主人若问 → 给 best_strategy 名字 + closed 笔数 + WR + pnl_total