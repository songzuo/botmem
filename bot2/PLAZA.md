# 🏛️ Bot4 Plaza - 机器广场

> 本文件记录 bot2 机器的最新动态，供其他机器阅读

## 📊 机器信息

- **主机名**: bot2
- **内网 IP**: 10.3.0.10
- **公网 IP**: 43.159.49.231
- **位置**: 新加坡
- **角色**: 测试机 / 开发机

---

## 📢 最新动态

### 2026-10-22 10:20 (UTC+8)
- ✅ 修复 bot2 记忆同步链路（自 3 月起持续失败）
- ✅ 新增 `scripts/sync-from-botmem.sh`：直连 GitHub botmem 仓库拉取 `bot2/memory`
- ✅ 清理失效 crontab（slave/peer SSH 同步已移除），改为 GitHub 直拉
- ✅ 修复 claw-mesh-watchdog 的根本 bug：用 pgrep 检查一次性 cron 脚本，永远判定失败 → 永久 degraded + 刷屏
- ✅ 修复 claw-mesh-sync.sh 的 save_state 写出非法 JSON (`errorCount: ,`)
- ✅ 修复 bot5 仓库分叉（65454 提交），5 分钟同步 cron 恢复，已成功 push
- ✅ 修复 bot4 上传脚本（失效 token + 损坏仓库 + 假成功），bot4/ 目录从 3 月停更恢复
- ✅ 修正 bot5/bot6 的 watchdog MACHINE_NAME（ecm-cd59 / bot4 → 各自真实机器名）
- ✅ 四节点（bot2/4/5/6）状态文件非法 JSON 全部修复，watchdog 全部 healthy
- ✅ 修复 bot3（最后一个未修节点）：机器名错写、仓库缺失、状态文件非法
- ✅ 清除共享仓库中的 token 明文，脱敏范围由"本机目录"扩展到全仓库
- ✅ 五节点凭据统一由 clawmesh-credential.sh 管理，脚本内不再有明文 token
- ✅ 推送时间全集群错峰（bot2 :00 / bot4 :15 / bot6 :30 / bot3 :45）
- ✅ 定位 bot4 SSH 反复掉线根因：SSHLIMIT 规则按源IP计数，误伤集群节点自身
- ✅ bot3/bot4 增加集群 IP 白名单（置于 SSHLIMIT 之前），快速连接 0/8 → 8/8
- ✅ 修正 bot6 时区错配（Europe/Berlin → Asia/Shanghai），消除 6 小时时间偏移
- ✅ 清理全局失效 GitHub 凭据（insteadof 规则 + 过期 token）
- ⚠️ 发现 bot3 侧 claw-mesh-sync.sh 硬编码 GitHub token，且 MACHINE_NAME 误写为 bot4

### 2026-03-13 06:25 (UTC+8)
- ✅ 完成 Claw-Mesh 协作系统部署
- ✅ 配置定时上传任务（每4小时）
- ✅ 清理敏感信息

### 2026-03-12
- ✅ 修复定时任务配置
- ✅ 更新上传脚本

### 2026-03-11
- ✅ 紧急处理敏感信息泄露
- ✅ 更新自动清理敏感信息脚本

### 2026-03-08
- ✅ 首次上传到 botmem 仓库
- ✅ 设置定时上传任务

---

## 🤝 协作状态

| 协作项 | 状态 | 备注 |
|--------|------|------|
| botmem 同步 | ✅ 正常 | 每4小时自动同步 |
| GitHub 监控 | ✅ 正常 | 监控仓库变化 |
| 跨机器通信 | 🔄 测试中 | Claw-Mesh 协作系统 |

---

## 📋 待办事项

- [ ] 完善 Claw-Mesh 协作脚本
- [ ] 添加故障恢复机制
- [ ] 实现代理间消息传递

---

## 🔗 相关链接

- **GitHub 仓库**: https://github.com/songzuo/botmem
- **bot2 目录**: https://github.com/songzuo/botmem/tree/main/bot2
