# 2026-07-14 14:56 — 自主决策 #7: 写新 paper 脚本 S7_FUNDING_RATE 实施

## 主人 14:56 "自主决策" 第七次
主人口味链 14:49 "当然需要新策略" → 14:56 自主决策 = 立刻实施, 不再问

## 我之前 BB 太多
- 14:49 我推 3 个候选 (MaxHold 4h / 不设 SL / 找新信号源)
- 14:56 主人没选, 自主决策 = 我直接做
- **不再 BB, 直接选 1 个实施**

## 拍板 (14:56 自主决策 #7)
**实施 (3) 找新信号源 = funding rate 异动策略**

理由:
- 找新信号源 = 配置层, 主人 14:49 校正"找新策略"≠"主动选入场"
- 跟 S2 同样架构 (TP/SL/MaxHold/反向/$30名义/5x)
- 0 真金 (paper mode, 跟 S2 一致)
- 1 周后看 WR + pnl, 主人决定

## 实施细节
1. **写 /opt/trader/paper/s7_funding.py** (10.6KB)
2. **配置**:
   - 名称: S7_FUNDING_RATE
   - 信号: |funding rate| > 0.2% (8h 异动)
   - 反向: funding > 0.2% (多头拥挤) → SELL
   - 反向: funding < -0.2% (空头拥挤) → BUY
   - TP 2.0% / SL 1.5% / MaxHold 30min (跟 S2 一字不差)
   - 名义 $30 / 5x / MAX_POS 1 / DAILY_CAP 2
3. **state**: /opt/trader/paper/s7_state.json
4. **db**: /opt/trader/paper/s7_trades.db
5. **log**: /opt/trader/paper/s7.log
6. **PID 779305 alive** (14:58:34 启动)
7. **当前 funding rate TOP 5**:
   - BOTUSDT +0.54%
   - SKHYNIXUSDT +0.50%
   - THEUSDT -0.41%
   - SXTUSDT -0.38%
   - KORUUSDT +0.36%
   = 等下次 funding 刷新 (8h 周期 00:00/08:00/16:00) 触发

## 主动 check state 写盘 (避免 6:00 翻车)
- save_state 后立即 cat state.json 验证
- 12 原则 barrier 应用
- 不动 main (12 原则)

## 当前状态 (14:58)
- main bal $592.87 / 0 open ✅
- paper S2 PID 739211 alive 2h18m ✅ (S2 仍 4% 月化)
- paper S7 PID 779305 alive 1min ✅ (新信号源, 等 funding 刷新)
- cron cc88ad27 enabled (推 best_strategy)
- main 0 敞口 ✅
- cron 4 disabled (找方法类)

## 等
- funding rate 8h 刷新 (00:00/08:00/16:00) → S7 自动开仓
- 1 周后看 S7 WR + pnl, 跟 S2 横向对比
- 不动 main, 不写新代码 (除非主人要新方向)

## 反思
- 主人 14:56 自主决策 #7 = 我 BB 太多, 直接做
- (3) 找新信号源 = 配置层, 跟 14:49 主人口味一致
- 跟 11:25-11:26 主线对比:
  - 11:25 "等钱进来 比如止盈" = 主人口味
  - 11:26 "主动失误" = 否决主动选入场
  - 14:49 "需要新策略" = 主人校正
  - 14:56 自主决策 = 我实施
- **我学到: 主人口味不是"100% 被动", 是"接受 trade-off, 找新策略, 不害怕风险, 接受等很久"**