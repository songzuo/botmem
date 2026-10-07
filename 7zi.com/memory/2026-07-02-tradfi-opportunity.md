# 2026-07-02 06:50 主人指令 + 我的发现

## 主人指令
"目标没有达成 可以考虑美股 可以用杠杆 可以投机 可以做空 先把总资本翻一番"

## 关键发现 (06:50)
**Binance 上有美股 token 永续合约 (TRADIFI_PERPETUAL)**！
- 110 个标的：TSLA / NVDA / AAPL / MSFT / META / GOOGL / AMZN / SPY / QQQ / SOXL / TQQQ / SQQQ
- 杠杆最高 20x
- USDT 保证金
- funding 机制（和加密一样）
- 但 v3.10 的 _loop_signals 拉的是 PERPETUAL 列表, 没拉 TRADIFI_PERPETUAL, 所以完全错过

样本 (06:50):
- SOXLUSDT $223 (-16% today) quoteVol $1.69B (3x 半导体杠杆 ETF)
- TSLAUSDT $423 +1.58% quoteVol $79M
- NVDAUSDT $197 -0.86% quoteVol $82M
- MRVLUSDT $273 -7.93% quoteVol $254M

这是反共识策略天然捕手 — 暴跌日的 SOXL 类, funding 极端, 价跌 → 做空。
主人在 7-02 05:00 那个时间点开仓 SOXL SHORT 0.22张 是某个手动 or legacy bot。

## 我要做什么 (自主决策)
**写 tradfi_v1.py** — 美股/ETF token 永续专用 bot
- 与 anti-v3 隔离, 独立 risk 状态
- 复用 funding 极端信号逻辑 (TOKEN_KLINES + funding 周期)
- 起步小仓位 (单仓 $30 名义跟 v3.10 一致, 1张 TSLA 是 $423 名义 → 只下 0.07 张)
- 先跑 sim 模式 30 天回测 (最少)，验证再上真仓

## 风险
- v3.10 本体 5-7 月已是问题 bot (无法过滤 trap), 6-28 那次赚+11.31U 是市场条件配合
- TRADIFI_PERPETUAL 是新标的 (5月上线), 历史数据可能不足
- 主人授权"投机/做空/杠杆" = 接受风险, 但翻一番 +700U 是当前资金 1x, 1 次爆仓 = 全亏

## 我的底线
- 起始仓位必须是 sim 或 1手 ($30), 验证 24h 后再加仓
- 不动 v3.10 (等主人更深指令前)
- 设计隔离 state (anti_stock_state.json)
- 新模块, 不 patch v3.10

## 计划执行顺序
1. 写 tradfi_v1_sim.py (回测脚本) — 用 7 天 KLine + funding 估算
2. 跑 sim 看 WR/PnL
3. WR>40% + PnL>0 → 真仓 anti_stock_v1.py
4. WR<40% → 重设计信号, 不上真仓
