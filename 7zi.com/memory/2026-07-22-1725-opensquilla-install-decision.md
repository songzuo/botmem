# 2026-07-22 17:25 — OpenSquilla 安装决策

## 主人拍板 (16h+ 沉默后冒出来)

> **"暂时先并存 我核对好用再废弃小龙虾"**
> (主人用"小龙虾"代指 OpenClaw, 音近)

## 决策拆解

1. **🅲️ 路径**: OpenClaw + OpenSquilla **并存运行**
2. **❌ 不替代**: HK Trading Bot live + 162h memory + HEARTBEAT + cron + 13 原则全部不动
3. **🧪 试用流程**: OpenSquilla 跑独立 sandbox toy tasks → 主人核对好用 → 才决定废弃 OpenClaw
4. **🪓 废弃条件**: 主人拍板 (不是我自己拍)

## 背景

- 主人看到 OpenSquilla GitHub (https://github.com/opensquilla/opensquilla):
  - 6k+ stars, 998 commits, Apache-2.0
  - 0.5.0 Preview 4 (2026-07-14)
  - 团队: 基元律动 (前头部大模型负责人带队)
  - arXiv tech report: 2026-07-14
- "超越 OpenClaw" 是主人看到营销话术后的判断
- 我 (OpenClaw) 验证完说: "OpenSquilla 卖点是 same budget more capability (省钱 + 本地 router), 不是超越 OpenClaw, 但并存有价值"

## 我的回应建议 (主人已采纳)

| 阶段 | 动作 | 风险 |
|---|---|---|
| 1. Sandbox 装 | 独立 venv 装 OpenSquilla, 不动现 OpenClaw | 低 |
| 2. 接 API | 加 MiniMax provider (需主人给 API key 决定) | 中 (key 安全) |
| 3. Toy task | OpenSquilla 跑独立 sandbox task, 主人评估 | 低 |
| 4. 并存期 | OpenClaw 管 HK bot + 对话; OpenSquilla 跑 toy | 低 |
| 5. 决定 | 主人核对"好用"才废弃 OpenClaw | 主人拍 |

## 仍未解决 (等主人拍)

1. **❓ MiniMax API key 提供方式** — 主人 ssh 配 / 直接给我 / 现在不接
2. **❓ 安装位置** — 当前 sandbox / 主人本地服务器 / 别的

## 拒绝的事 (不管主人是不是没想起来我都得标)

- ❌ 不接 HK Trading Bot live 账户到 OpenSquilla
- ❌ 不擅自 pip install (等主人拍板 API + 位置)
- ❌ 不丢 162h memory / HEARTBEAT / cron 体系

## 顺便记下的其他积压 (主人没回)

1. **4:00 "只止盈不止损"拍板 🅰🅱️** — 13h+ 等回复
2. **17:20 paper sim bot 离线 32h+** — 3 个 PID dead, 何时重启, 重启还是放

## 关联原则

- 第 1 (利润第一): 装 OpenSquilla 不直接赚钱 = 沙上城堡嫌疑, 但主人拍 = 边界内
- 第 7 (自主决策 + 留痕): 写本条 = 痕迹先留 ✅
- 第 11 (自主决策边界): 大架构变更必须主人拍板
- 第 13 (被动等钱): OpenSquilla 装 = 不是"主动找钱", 是工具评估

## 主人识别

- 主人用"小龙虾" = OpenClaw 音近 (大概率)
- 若指别的东西, 主人会纠正
- 不主动问第二次 (避免 chat fatigue), 直接装时再说

## 实践约束 (OpenSquilla 装时强制)

- ✅ 装独立 venv (uv tool install opensquilla), 不污染现 Python
- ✅ 配置 ~/.opensquilla (跟 ~/.openclaw 隔离)
- ✅ MiniMax API key 通过 env var, 不入代码
- ✅ Toy task 只跑 sandbox script, 不接 live 账户
- ✅ 主人拍板前不 pip install 任何东西
