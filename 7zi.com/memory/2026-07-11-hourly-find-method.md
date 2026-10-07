# 2026-07-11 20:22 — Paper Hourly "找方法" 升级 (主人 20:20 强化指令)

## 主人口令
> "有没有找到方法 继续验证"
> "定时任务 每小时不停找方法 验证 一直到找到为止"

## 已执行 (20:22-20:25 CST)
1. ✅ 加 2 个新策略到 paper/v3_paper.py (主人建议 S5+S6)
   - S5_ULTRA_TIGHT_30MIN: 顺势 + TP 0.8% / SL 0.5% / MaxHold 30min (DAILY_CAP 5)
   - S6_REVERSE_TIGHT_30MIN: 反向 + TP 0.8% / SL 0.5% / MaxHold 30min (DAILY_CAP 5)
2. ✅ 修 bug: state 不初始化新策略 → KeyError, 已修
3. ✅ 重启 paper: PID 3875689 alive, S5 SELL SLXUSDT + S6 BUY SLXUSDT (20:22:57)
4. ✅ 重写 paper-progress-check.sh — 6 策略 + open_pnl + grand_total + best
5. ✅ 新建每小时 cron 40459cd1: "Paper Sim 每小时找方法 (验证)"
6. ✅ 删除重复 cron 91c74bec

## 当前 paper 状态 (20:25 CST)
- PID 3875689 alive, cycle 持续
- 4 策略 (S1-S4) 全部 daily cap 满 (S1=2/2 S2=2/2 S3=3/3 S4=2/2) → 0 new entries
- **新 S5 SELL SLXUSDT + S6 BUY SLXUSDT 持单中** (20:22:57 开仓, MaxHold 20:52 CST 到期)
- 0 closed trades after relaunch yet
- S5/S6 各自将得到首笔 close 数据

## 关键参数差异 (为什么加 S5/S6)
- S3 唯一 1W = EVAA +1.07% at 13.4min hold → "快" 是关键
- S5 = 进一步紧 TP/SL 到 0.8%/0.5% (S3 1%/1%/1h 的极致版)
- S6 = 在 S5 基础上反向 (测试"反着做 + 快"组合)
- DAILY_CAP 从 2-3 提到 5 → 数据密度 +2x

## 后续计划 (每小时 cron 自动跑)
- 20:50 5min cron #N 检查 S5/S6 首笔 close
- 21:00 每小时 cron #1 自动跑汇总 + 写 memory + 推 best 切换
- 23:00 日终 cron 详细对比
- 24-48h: 数据收敛 → 找 best
- 找到 best (pnl > 0 + WR > 50% + closed >= 20) → 主动推主人

## 留痕
- 备份 v3_paper.py: 6 策略 grid
- 备份 paper-progress-check.sh: 6 策略 + open_pnl
- 新建 cron 40459cd1 (每小时找方法)
- 删除 cron 91c74bec (重复)

## 主人边界
- 不 push 主人 (35d+ SSH 静默 #77 strict), 但异常 / best 切换 / 5笔+WR 主动推
- 不动真仓 (第一原则暂停中)
- 写盘 memory + HEARTBEAT (第七原则)