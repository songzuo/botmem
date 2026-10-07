# 2026-09-16 bookslot 推送全链路改造

**时间**: 2026-09-16 11:50 - 12:19 CST
**主人**: 12:03 决策、12:09 删 keepalive、12:12 改 retry、12:19 确认 + 记录

## 主人指令（逐字）

> 12:03: "bookslot问题容易解决 既然它自己不方便主动推信息过来 你让openclaw主动读bookslot的消息 主动推过来 问题就解决了 但是如果这样。注意不要重复发就可以了"
> 12:09: "[keepalive probe — safe to ignore] 这个保活 也需要去掉"
> 12:12: "改"
> 12:19: "要" (要记录这次改造)

## 问题诊断（先后 4 个真相）

### 真相 1：iLink sendmessage HTTP 端点死了（核心）
- `openclaw message send` CLI → 微信：超时（HTTP 死端点）
- iLink 服务端风控：检测到短时间多次 sendmessage 后 disable bot 的 outbound
- 所有 7-12 之后的"看似成功"推送（YFI SHORT etc）都是假活

### 真相 2：OpenClaw message tool（内部路由）活着
- 实测 12:04：main agent 用 message tool 推微信 → 主人收到 ✅
- 12:09:06 推送 ID `openclaw-weixin:1789531746656-88d41a42`
- 12:15:58 推送 ID `openclaw-weixin:1789532155201-05340884`
- 关键：CLI = 死，tool = 活

### 真相 3：bookslot-typing.service 是假活源头（主人 12:09 删）
- 每 5 分钟调用 `ilink/bot/sendtyping` + `ilink/bot/getconfig`
- typing API OK ≠ sendmessage OK（被风控 disable 时仍 OK）
- 日志谎报"channels healthy, flushing queue"
- 实际：主人收不到任何消息
- **杀掉 + disable 后** 服务消失，不会重启复活

### 真相 4：bookslot_retry.py 走老死路径（主人 12:12 改）
- watch 后台 `bookslot_watcher.py` → 触发 `bookslot_retry.py` → `flush_queue()` → `send_wechat()` → iLink HTTP / CLI
- 全部已死

## 改造方案（实施顺序）

### Step 1: 主动读 poller（12:04-12:09）
- 写 `/opt/openclaw-bookslot-poller/bookslot_deliver.py`
- 扫 `/var/lib/bookslot/bookings.jsonl` 自 offset 增量
- dedup = sha256(name|contact|date|questions) 24h，共享 `notify_dedup.json`
- offset 初始化 = 文件当前大小（23958），历史跳过（主人拍板 12:08）
- cron: `e1ba8bf8-f90e-432f-b51e-443d2f0f4bc5` 每 1 min systemEvent 触发 main agent
- main agent 拿到 JSON → message tool 推微信 → commit_delivery(keys)

### Step 2: 杀 keepalive（12:09）
```bash
systemctl stop bookslot-typing.service
systemctl disable bookslot-typing.service
```
- 进程 2159792 killed
- systemd symlink unlinked

### Step 3: bookslot.py 改造（12:12-12:16）
- `wx_send_via_openclaw()`: 不再调 `sudo HELPER_SCRIPT` (CLI)，**写 marker 到 agent_pending.jsonl**
- `send_wechat()`: 不再 load_wx_creds / 调 iLink HTTP，**只写 marker + 记 log**
- `_deliver_notifications()`: 微信走 marker，telegram 仍直推；**不再 commit dedup**（避免 commit 过早让 poller dedup 跳过）
- `flush_queue()`: 旧 queue 文件搬到 agent_pending.jsonl 后删除
- 文件 owner: chown www-data:www-data 664（避免 root 写过之后 www-data 写不进）

### Step 4: poller 多源扫描 + 去重（12:15-12:17）
- poller 同时扫 bookings.jsonl + agent_pending.jsonl
- 同 record（name+contact+date+questions）只从 bookings 源推一次（格式更好）
- agent_pending 源作为兜底（当 bookslot 写的 record 没进 bookings.jsonl 时）

### Step 5: 真实端到端验证（12:15-12:16）
- curl POST → bookslot:8321/api/contact form-data
- ✅ bookslot 返回 "消息已收到"
- ✅ bookings.jsonl + agent_pending.jsonl 都写了
- ✅ poller dry-run 抓到 1 条（去重后）
- ✅ message tool 推送成功 ID `openclaw-weixin:1789532155201-05340884`
- ✅ 主人收到
- ✅ commit: dedup 写入 + offset 推进 + 二次扫描 0 pending

## 暴露的 bug（5 个，留警）

### Bug 1: iLink 服务端风控（最严重）
**症状**：typing API OK，但 sendmessage 永久 ret=-2 prepare failed
**根因**：服务端主动 disable 频繁推送的 bot 的 sendmessage 端点
**修法**：降级到 OpenClaw message tool（内部路由）；不再用 iLink sendmessage HTTP
**教训**：typing API 健康 ≠ sendmessage 健康。**任何 keepalive 必须 probe sendmessage 而非 typing**

### Bug 2: bookslot-ty 假活
**症状**：每 5 分钟报告"channels healthy, flushing queue"，但队列永远发不出去
**根因**：typing API 是单独的端点，被风控 disable 不影响 typing
**教训**：判断"服务健康"必须用真实业务调用验证，不能用 side-channel ping

### Bug 3: 文件 owner 冲突
**症状**：bookslot (www-data) 写 agent_pending.jsonl 报 `[Errno 13] Permission denied`
**根因**：root 测试时创建的 644 文件，www-data 不能写
**修法**：chown www-data:www-data + chmod 664
**教训**：跨进程文件要么统一 owner，要么 atomic append (POSIX append 不要求 owner 但要求 write bit)

### Bug 4: dedup commit 过早
**症状**：bookslot 内部 commit dedup 后，poller 扫描时已 fresh，跳过推送，**主人收不到**
**根因**：原 `_deliver_notifications` 在 `send_wechat` 后立刻 commit，但 send_wechat 现在只写 marker 不真推
**修法**：bookslot 不再做 dedup commit，全部交 poller 推送成功后 commit
**教训**：**dedup 必须由真推送者 commit**，不能由"声明推送成功"的人 commit

### Bug 5: bookings 源 vs agent_pending 源重复
**症状**：同一条 booking 同时写两个文件，poller 抓到 2 条（不同格式），主人收 2 条
**根因**：bookslot 现在写两个文件（bookings.jsonl 主表 + agent_pending.jsonl marker）
**修法**：poller 端 dedup by (name+contact+date+questions)，bookings 源优先
**教训**：多源写入时必须下游 dedup；或者上游不重复写

## 关键决策记录

### 主人拍板
- 12:03: "openclaw 主动读 bookslot + 主动推，不要重复发" → 整体方向
- 12:08: "按照你的方法办理" → offset = 文件当前大小，历史跳过
- 12:09: "这个保活 也需要去掉" → 杀 bookslot-typing.service
- 12:12: "改" → bookslot_retry.py 改造
- 12:19: "要" → 写 memory 记录

### 我的判断
- 不用独立 poller daemon（subprocess CLI 死）→ 让 main agent cron 触发
- 不用 Telegram 兜底（主通道微信已修通）→ Telegram 仍 bookslot 直推做兜底
- dedup 共享同一文件 `notify_dedup.json`（bookslot 自己 reserve 写 0.0，poller commit 写真实时间）→ 避免双 dedup 库不一致

## 现状（2026-09-16 12:19）

| 组件 | 状态 |
|---|---|
| bookslot.service | ✅ running, 吃新代码 |
| bookslot-watcher.service | ✅ running（仅 credential mtime 变化时跑 flush_queue，已无积压） |
| bookslot-typing.service | ❌ stopped + disabled |
| bookslot_deliver.py | ✅ 装在 /opt/openclaw-bookslot-poller/ |
| cron `e1ba8bf8` 1min Bookslot Poller | ✅ enabled |
| agent_pending.jsonl | ✅ owner www-data, 664 |
| notify_dedup.json | ✅ 2 keys（test + E2E Closed Loop） |
| poller_state.json | ✅ bookings_offset=25031, agent_offset=1954 |

## 实战数据（推送记录）

- 12:05: ping 测试 → 主人收到 ✅
- 12:09:06 测试 booking "OpenClaw Poller Test" → 主人收到 📩 格式 ✅
- 12:15:58 真实 e2e "E2E Closed Loop" → 主人收到 📩 格式 ✅（**端到端闭环确认**）

## 后续观察点

1. **重启 OpenClaw**：iLink 服务端风控可能自动解（24h 自动），届时主人扫码激活后 iLink 通道也活——双重备份
2. **bookslot-watcher 触发**：仅 credential mtime 变时跑，目前 mtime 稳定，不会瞎跑
3. **dedup 24h 滚出**：旧 booking 24h 后允许重推——但因 agent_pending.jsonl 不会重写，正常
4. **bookslot dedup reserve 0.0 残留**：bookslot 仍调 `_dedup_reserve` 写 0.0，但因不再 commit，下次同 key 会重新 reserve (返回 None) → "deduped_by_bookslot: true" log，但 poller 仍会推（因为 poller 端 dedup 用 sha256 真实 hash，0.0 不算 fresh）

## 与第二十七原则的关系

第二十七原则（iLink 双通道 + 假活识别）已经识别了假活源头，但没动手修。这次是真正的"动手"——不仅杀 keepalive，还把整条链路迁到 OpenClaw 内部路由（message tool），从"降级用 Telegram 兜底"升级为"修通原通道"。

## MEMORY 应记录

需要写到 MEMORY.md 第二十八原则：
- "判断服务健康必须用真实业务调用，不能用 side-channel ping"
- "dedup commit 必须由真推送者 commit"
- "跨进程文件要么统一 owner 要么 atomic append"
- "微信推送走 OpenClaw message tool，不要再调 iLink HTTP 或 openclaw message send CLI"
---

## 后续追加：主动推 + fallback 流程 (12:22-12:29)

**主人 12:22 指令**: "bookslot主动发可以保留 主动发失败以后 触发openclaw主动发 这样的流程更加完美"

### 触发发现

- 主人在 12:22:11 发 [keepalive probe — safe to ignore]
- 这条消息触发了 iLink 服务端**自动恢复 sendmessage 端点** (24h 风控窗口过)
- context-tokens.json mtime 从 09-15 跳到 12:22:12 (新 token)
- iLink sendmessage 返回 `{"message_id": 7505844076628628744}` ✅ 复活了

### 改造: 双通道设计

```
bookslot.py send_wechat():
  Step 1: iLink 主动推 (wx_send_direct)
    - 成功 (errcode=0/None + message_id) → 立刻 _dedup_commit + 完事
    - 失败 (errcode=-14 风控 / 其他 / 抛异常) → fallback
  Step 2: OpenClaw fallback (写 marker 到 agent_pending.jsonl)
    - poller 每 1 min 扫描 → message tool 推微信
    - 推送成功后 commit dedup
```

### 关键 bug 暴露 (3 个)

#### Bug 6: dedup_key 未定义 (Python NameError)
**症状**: `wechat: "fail:name 'dedup_key' is not defined"`
**根因**: 我在 send_wechat 里 `_dedup_commit(dedup_key)` 但 `dedup_key` 变量在 `_deliver_notifications` 里定义, send_wechat 看不到
**修法**: 用 `rec` 字段重新算 `_dedup_key(name, contact, date, questions)`
**教训**: 函数间共享变量要小心作用域; **要么显式传入, 要么别跨函数引用**

#### Bug 7: 双重 dedup hash 算法不一致
**症状**: poller 用 sha256(name|contact|date|questions), bookslot._dedup_key 用 sha256(name.strip().lower()|contact.strip().lower()|...)—poller 算的 key 不匹配 dedup 文件
**根因**: poller 原代码忘了对齐 bookslot 算法
**修法**: 改 poller._key 加 strip+lower
**教训**: **任何共享 hash 算法必须 1:1 对齐, 包括大小写和前后空格处理**

#### Bug 8: agent_pending 源 dedup 跨源不去重
**症状**: iLink 主动推过的 booking, agent_pending marker 也会被 poller 抓到 (因为 marker 用 _key_from_text(text) 算法不同)
**根因**: 两个源的 key 算法不一样, dedup 跨源过滤失效
**修法**: 在 poller_state 加 `seen_records` 缓存 (推送过的 (name|contact|date|questions) tuples), agent_pending 源按 rec_inner 匹配 seen_records
**教训**: **多源写入时, 单 dedup hash 不足以去重, 需要 record-level 缓存**

### 实战数据 (12:22-12:29)

| 时间 | 事件 | 推送路径 | 结果 |
|---|---|---|---|
| 12:24:30 | Fallback E2E booking | iLink (accepted) | ✅ 主人收到 |
| 12:24:30 | Fallback Final booking | iLink (accepted) | ✅ 主人收到 |
| 12:26:12 | iLink Alive booking | iLink (failed) → fallback queue | ⚠️ dedup_key bug, 没推 |
| 12:27:12 | iLink Alive Final booking | iLink (accepted) + dedup commit | ✅ 主人收到 |
| 12:28:26 | Zhuo Song (历史积压, 04:20) | poller 扫到 | ✅ 主人收到 |
| 12:28:28 | iLink Alive (重试扫) | poller 扫到 | ✅ 主人收到 |

### 当前架构 (终极版)

```
                 ┌─── iLink sendmessage (active now)
                 │    ↓ success
user form ─── bookslot.py ─── send_wechat ─── Step 1 ───→ dedup commit
                 │                       ↓ failure
                 │                       Step 2: 写 marker
                 │                          ↓
                 └──────────────── agent_pending.jsonl
                                          ↓
                              [cron 1min] OpenClaw poller
                                          ↓
                                  dedup + 去重
                                          ↓
                              message tool → 主人微信
                                          ↓
                                  commit_delivery
```

两条通道互不干扰:
- iLink 活时: bookslot 主动推 (最快, 不走 fallback)
- iLink 风控时: 自动 fallback OpenClaw (24h 内自动恢复)

### 已记录文件更新
- MEMORY.md 第二十八原则 已覆盖
