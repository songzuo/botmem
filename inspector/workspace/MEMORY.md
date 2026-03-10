# MEMORY.md - 瞭望的长期记忆

## 关于老宋
- 创业者，12机协同系统 + 全科诊所
- GitHub: songzuo, botmem 仓库
- 务实，要结果不要规划，说"自主决策"就是真的

## 系统全局状态（截至 2026-03-11）

### botmem 仓库
- 12个目录：commander, bot/bot2/bot4/bot6, 113IBM, 7zi.com, VM-0-4-opencloudos, ecm-cd59, vefaas-sandbox, xunshi-inspector
- commander/ 最活跃，70+文件，但25个check脚本是冗余的
- 提交模式：集中批量推送，不像自然协作
- global score: 2.0/10

### D:\openclaw（龙虾助手🦞）
- 模型：volcengine doubao-seed-code（已改为 minimax/MiniMax-M2.5 为主）
- 端口：28765
- 9个cron任务，大量重叠
- 中文memory乱码（GBK编码问题）
- C盘仅剩18%
- Windows Update 持续失败
- 实际代码产出为零，全是规划文档和截图
- financial-analyst-plugin 停滞

### 我的部署位置
- 路径：C:\Users\Administrator\.openclaw-autoclaw\
- 和 D:\openclaw 在同一台物理机上
- 模型：pony-alpha-2
- 优势：中文正常，不乱码

## 教训
1. **2026-03-10 卡顿事件** — exec没设timeout导致卡死8小时无人知。已建立 task-state.json 断点续传机制
2. **exec必须设timeout** — 最长120秒，长任务用 background 模式
3. **D:\openclaw的文件编码** — PowerShell Get-Content 需要 -Encoding UTF8，它默认用系统编码(GBK)

## 监控节奏
- 报告：monitor/report-NNN.md
- 扫描工具：monitor/scan.ps1, monitor/monitor_all.py
- 自动化：monitor/full_scan.ps1 + cron 30min
- 统一工具：scripts/inspector.ps1 (status/scan/sync/report)
- Git: botmem branch: inspector

## 重要修正
- **D:\openclaw 不是零产出** — 3/10 20:35写了financial-analyst-plugin全套代码
- **换MiniMax模型后明显改善** — 06:02开始编译、06:28修bug、06:36在写前端
- **它已经把cron从9个减到3个** — 确实做了一些清理
- **评分75/100** — 扣分项：文档多(9)、C盘低(22%)
- **financial-analyst-plugin测试**: 9/9通过，3个.ts套件因Jest缺TS配置报错(非真bug)
- **feishu-claw-12分支**: D:\openclaw自己删了，已确认干净

## 网络问题
- GitHub 推送间歇性连接失败，需要重试
