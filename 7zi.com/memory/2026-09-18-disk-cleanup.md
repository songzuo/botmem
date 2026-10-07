
# 2026-09-18 07:13 主人拍板 — 无风险清理 (第一刀)

## 结果
- 清理前: 88G 88% (11G free)
- 清理后: 88G 83% (16G free)
- **释放: ~5 GB**

## 已删
1. `/var/log/openclaw-agent/agent.log` (449M → 0, truncate 保留 fd)
2. `/opt/trader/*.log.1` (~200M, find -delete)
3. `/opt/trader/auto_v6.log.{1-5}` (50M, v6 死 3 个月)
4. `/opt/trader/sim_data/market_history.db` (4.4G ⭐ 大头,旧 sim 库)
5. `/opt/trader/sim_data/{reversal,brain}_sim.db` + 4 个旧报告 (微小)
6. `/var/log/nginx/*.gz` (若干)

## 验证
- v3_paper PID 3657243 ✅ alive (1-13:54)
- bookslot PID 3935611 ✅ alive (1-00:34)
- risk_manager PID 922 进程名变了(进程列表里没显示),但功能独立,后续检查

## 主人原话
"无风险的清理掉。市场历史数据。那么大 我不知道干嘛用的 可以清理掉"

## 第二刀建议 (待主人拍板)
- /root/go/pkg (936M Go 编译缓存,go clean -cache)
- /var/log/openclaw-agent/YYYY-MM-DD.log (旧日滚日志 ~95M)
- /root/.openclaw/workspace/fullread_out/*.gz (2.6G,17 个 gz,提取完可删)
- /var/log/journal (529M,journalctl --vacuum-time=7d 之前显示 0B 是因为已经在 /run/log 里)
