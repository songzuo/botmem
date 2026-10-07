# 2026-09-15 XHS 运营接棒记录

## 背景
主人前一个 agent（在我之前的会话里）完成了小红书运营技能第一阶段：
- 技能已部署在 `~/.openclaw/skills/xiaohongshu-personal-growth/`
- 第三方连接器 `xpzouying/xiaohongshu-mcp v2.5.0` 已部署在 `/opt/xhs-connector/`，systemd `xhs-connector.service` 仅监听 127.0.0.1:18060
- Bearer 凭据在 `/etc/xhs-connector/service.env`，cookies 在 `/var/lib/xhs-connector/cookies.json`
- 状态目录：`/var/lib/xhs-personal-growth/`（含 config/profile/capabilities/login-status/analysis-latest.md 等）
- 已生成 2 篇草稿：`drafts/001-ai-learning.md`、`drafts/002-french-beginner.md` 等主人审核
- 6 小时一次 `offline_draft` 准备任务 cron `1878723f-...`，首轮已跑通
- 3 个待主人回答的问题（目标读者、现有连接器、通知渠道）

## token 用尽时状态
- 12:02 第一张二维码生成 → 4 分钟内主人没扫
- 12:06 服务端把那次会话关闭（`登录会话 #1 结束`）
- 12:41 我接棒

## 我接手后做了什么
1. 检查连接器状态：service active, 18060 健康, 18 个 MCP 工具可发现
2. 重新调用 `GET /api/v1/login/qrcode` → 12:44 CST 拿到新二维码
3. 解析 data URL 前缀后写到 `/var/lib/xhs-personal-growth/login.png` (128x128, 4495 bytes)
4. 拷贝到 `/root/.openclaw/workspace/media/xhs/login-qr-20260915-1244.png` 供消息发送
5. 更新 `status.json`、`connection-status.json`，标注 `login: waiting_for_owner_scan_fresh_qr`
6. 通过 Telegram 把二维码发给主人（message 6938）

## 等主人扫码之后我自动要做
- 跑 `scripts/onboard.py`：核对 `is_logged_in`，比对账号 ID 是否等于 `6471740e000000001c0299a0`
- 不符：立即 `paused=true` + `mode=read_only`，通知主人
- 相符：拉取 `/api/v1/user/me` → 保存 `metrics/profile-latest.json` 基线；更新 capabilities.json `account_verified: true` + get_identity / read_own_metrics 标 verified
- 跑一轮只读能力验证：login_status / me / search / detail / notifications / unread / profile，挨个标 verified/unsupported
- **不**激活自动点赞/评论（仍需主人授权 + 实盘样本验证才能切 live）

## 当前阻塞（等主人）
- 扫码登录
- 审核 2 篇草稿
- 回答 3 个运营问题（目标读者 / 现有连接器 / 通知渠道）

## 关键文件
- 状态目录：`/var/lib/xhs-personal-growth/`
- 二维码：`/var/lib/xhs-personal-growth/login.png` + `.b64`
- 草稿：`/var/lib/xhs-personal-growth/drafts/00{1,2}-*.md`
- 运行日志：`/var/lib/xhs-personal-growth/runs/YYYY-MM-DD-HHMM.md`
- 服务日志：journalctl -u xhs-connector

## 教训（与第二十七原则一致）
- 二维码 4 分钟有效，不能假设主人立即扫；token 不足时不要尝试"等更久"
- 接手第一件事 = 检查所有状态文件 + 服务运行状态，而不是直接重做

## 12:49 update: 用户第二次说"完成登录"，但服务端仍 is_logged_in: false

### 现状
- session #3（12:48:48 起），4 分钟超时到 12:52:48
- 用户两次在 App 端报告"完成登录"，但：
  - cookies.json mtime 仍 12:01（启动时占位，未更新）
  - 服务日志里 `扫码登录成功，cookies 已保存，会话 #N` 这条从未出现
  - 5 次 session 全部失败（同一个 fingerprint seed 124985493）

### 推断
小红书反自动化风控：检测到自动化浏览器指纹，复用同一 seed 多次，被标记。
- App 端扫码动画可以成功（UI 层面）
- 但页面状态未完成（服务端层面），所以 cookies 没写入
- 这不是用户扫码动作错误，是 XHS 在服务端拒绝了这次登录确认

### 选项（已发给用户）
- A. 重置 fingerprint seed 重新生成 QR（最快 5 分钟）
- B. 停连接器换手工 cookie 注入

### 待办
- 等 12:52:48 session #3 timeout
- 12:53 cron 自动跑 onboard.py 复核
- 给用户两个选项让他拍

## 12:53 update: 三次扫码全部失败，确认为 XHS 反自动化风控

### 失败模式
- session #1 (12:02) — 用户没扫，超时关闭
- session #2 (12:43:31) — 用户 12:45:05 说扫了，但 cookies.json mtime 不变，服务端无 "扫码登录成功" 日志，12:47:31 超时关闭
- session #3 (12:48:48) — 用户 12:49:11 又说扫了，12:49:17 再确认，但同样 cookies.json 不变，12:52:48 超时关闭
- 同一个 fingerprint seed 124985493 重试 5 次（5 次 login_status 全部 false）

### 关键发现
- 客户端 QR 完全正常：zbarimg 解码出 `https://www.xiaohongshu.com/mobile/login?qrId=...&xhs_code=...` 标准格式
- v2.5.0 源码里有 `waitScanInBackground` goroutine 等待扫码（issue #599 的修复），逻辑正确
- 服务端没写 cookies → 不是 check_login_status 误判（issue #838），是 scan 本身在 XHS 服务端被丢弃
- 这是 XHS 反自动化风控：检测到 headless browser fingerprint (Windows UA + 同一 seed 反复) 后，扫码确认请求不生效，但 App 端仍显示"登录成功"

### 给用户的两个选项
- 🅰️ 手工导 cookie 注入（推荐）
- 🅱️ 改 connector 配置 + 重启（不一定能成）

### 相关上游 issue
- #599 — get_login_qrcode 生成二维码后浏览器会话关闭，扫码成功但 cookies 无法保存（v2.5.0 已修，但症状相同表明有 regression）
- #838 — RedNote 扫码成功但 check_login_status 误判未登录（DOM selector 不稳定）
- #609 — 海外用户 cookie 域名不匹配（.rednote.com vs .xiaohongshu.com）

### 教训（记下来）
1. 同一个 fingerprint seed 不要连续重试超过 2 次，否则 XHS 会持续标记
2. App 显示"登录成功" ≠ 服务端 cookies 已写入 — 必须独立核对 cookies.json mtime
3. zbarimg 是验证 QR 内容的好工具（apt install zbar-tools）
4. v2.5.0 的 waitScanInBackground 修复在源码里，但实际行为仍有 bug
