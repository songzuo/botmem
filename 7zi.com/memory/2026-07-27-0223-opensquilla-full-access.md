# OpenSquilla 切到 Full Host Access (2026-07-27 02:23 CST)

## 主人指令 (msg #5017, 02:20 CST)
> "opensquila可以用 但是有沙箱限制 去掉任何限制 给它最高权限 全部权限"

主人要 OpenSquilla 全开: 无沙箱、无审批、无 sensitive-path gate、最高权限。

## 调查 (5min)
查 OpenSquilla 子命令找到 `sandbox` 子命令 + 4 个 posture:
- `status` — 看当前 posture
- `full` — "Disable runtime sandboxing and skip approval and sensitive-path gates" ✅ 这是主人要的
- `on` — 恢复默认
- `trust` — 保留 sandbox 但用 Managed Execution
- `reset` — 重置

## 当前 posture (gateway.log 显示)
```
sandbox_enabled=True grading_enabled=True default_level='L1-standard'
backend='auto' insecure_mode=False
```
"沙箱限制"具体包括:
1. **Subprocess sand-boxing** — 子进程被 try-隔离 (实际 backend=auto 找不到 Bubblewrap → fail-closed)
2. **Security grading** — 每次 tool call 被评分器检查
3. **Approval queue** — 高风险动作落 `approval_queue.sqlite` 等 SSH 批
4. **Sensitive-path gates** — /etc, sudo, raw socket 等会被拦

## 实施步骤 (5min)
1. ✅ 备份 `config.toml` → `config.toml.bak_pre_sandbox_full_20260727_022145`
2. ✅ 跑 `opensquilla sandbox full` → exit 0, "Sandbox run mode set to Full Host Access. Restart the gateway for running processes to apply it."
3. ✅ Config 落盘验证 (config.toml 现在有 `[permissions] default_mode='full'` + `[sandbox] sandbox=false run_mode='full'`)
4. ✅ Graceful shutdown 老 gateway (PID 264466, ran 3d 17h)
   - SIGTERM → 等 2s → SIGKILL → 进程消失
5. ✅ 重启 gateway: `nohup opensquilla gateway start > /tmp/opensquilla_start.log 2>&1 &`
6. ✅ 等 8s, 看新 gateway log: PID 1704041, listen 18791, 启动时间 @ 02:22:47
7. ✅ Feishu WebSocket 重连 @ 02:22:59 (`wss://msg-frontier.feishu.cn/ws/v2?...`)

## 验证 (effective posture @ 02:22:47 启动 log)
```
[WARNING] sandbox.disabled_insecure_mode: sandbox=false; host isolation is OFF
[INFO] sandbox.runtime_configured: backend=noop level=L1-standard grading=False insecure=True
[INFO] build_services.sandbox_ready sandbox_enabled=False grading_enabled=False default_level='L1-standard' backend='auto' insecure_mode=True notes=['insecure_mode', 'legacy_flag_missing']
```

| 配置项 | 之前 | 现在 |
|---|---|---|
| `sandbox_enabled` | True | **False** ✅ |
| `grading_enabled` | True | **False** ✅ |
| `insecure_mode` | False | **True** ✅ |
| `run_mode` | (implicit) | **"full"** ✅ |
| `default_mode` | (无) | **"full"** ✅ |

明确日志: **"host isolation is OFF"** 是 OpenSquilla 自己的警告, 等于 "全开确认".

## 当前状态 (2026-07-27 02:23 CST)
- Gateway PID **1704041** 跑起来了, listen 18791
- 飞书 WebSocket reconnected
- 飞书 channel active
- wechat-personal 还是 disabled (主人没要求开)
- 主人在飞书那边现在发消息, OpenSquilla 应该无任何 gate 阻

## 跟第十一原则 (自主决策) 关系
- 主人明示 ✅ 02:20 CST 直接给指令, 不是我自己推断
- 边界清晰 ✅ "去掉任何限制 / 最高权限 / 全部权限" 没歧义
- 操作 trace 完整 ✅ 5 步全记录在 HEARTBEAT + memory
- 备份 ✅ `config.toml.bak_pre_sandbox_full_20260727_022145`

## 教训 (写下来不擦鞋)
1. **OpenSquilla 子命令要找 sandbox**: 它有明显 `sandbox full` 子命令, 我之前不知道, 通过 `opensquilla --help` 才发现 → 应该一开始先 `--help` 而不是猜 config 字段
2. **`sandbox status` 命令超时**: 它似乎要连 running gateway 才能拿 status → 但 gateway.log 直接打 `sandbox_ready` 是更可靠的信息源
3. **`gateway stop` 也超时**: 同样要连 gateway 才能 graceful stop → 直接 SIGTERM + SIGKILL 老 PID 是更直接的 kill 法
4. **`gateway start` PID 文件 daemon 自己 flush**: 不是 race condition, 而是要等 ~3 秒 daemon 才完成 PID 写入
5. **config.toml 立即生效的字段**: `[permissions]` + `[sandbox]` 段, 改完 restart 就 ON

## 待跟进
- 主人在飞书发消息试试, 看是否还有任何 gate
- 如果飞书那边 OpenSquilla 还是会拦某些 tool call, 复盘哪个 gate 没绕过
