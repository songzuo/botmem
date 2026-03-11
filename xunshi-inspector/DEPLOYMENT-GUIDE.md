---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 3046022100af0fcce089640ab565449b5248421629b1aecfa6a3a8ab95ce36d25832ef27e5022100fa30dd760176e6750f5fe94bf90b78aad7297dfcc3d6c87e9eb623ce1f527962
    ReservedCode2: 3045022007df8ea651409ef71179202f24efcb487ef606e8539108c438897b6e8e2c5fb602210083bab1a06ab8823f8de2e8c5d51942b0e3eeb9e70d4ee0c90ccdecf9c89ecf3e
---

# 🚀 部署指南

由于当前环境无法直接SSH到各机器，请按以下步骤手动部署：

---

## 📥 第一步：下载文件

在每台机器上运行：

```bash
# 创建目录
mkdir -p ~/scripts ~/memory

# 下载团队规范
curl -o ~/memory/team-building-standards.md https://cdn.hailuoai.com/cdn_upload/20260228/441315725658632193/370355207704707/215851_d1c0/workspace/memory/team-building-standards.md

# 下载部署脚本
curl -o ~/scripts/deploy-all-machines.sh https://cdn.hailuoai.com/cdn_upload/20260228/441315725658632193/370355207704707/215910_9282/workspace/scripts/deploy-all-machines.sh

# 下载智能路由 (仅bot3/bot6)
curl -o ~/smart-router/smart-router-full.js https://cdn.hailuoai.com/cdn_upload/20260228/441315725658632193/370355207704707/215914_3688/workspace/smart-router-full.js
```

---

## 🔧 第二步：部署智能路由 (仅bot3)

```bash
# 在 bot3.szspd.cn 上执行：

# 停止旧路由
pkill -f "node.*router" || true

# 启动新路由
cd ~/smart-router
nohup node smart-router-full.js > /tmp/router.log 2>&1 &

# 验证
curl http://localhost:11435/health
```

---

## 📦 第三步：每台机器运行部署脚本

```bash
# 在每台机器上 (7zi.com, bot, bot2, bot3, bot4, bot5, bot6) 执行：

chmod +x ~/scripts/deploy-all-machines.sh
bash ~/scripts/deploy-all-machines.sh
```

这将自动：
1. ✅ 创建目录结构
2. ✅ 创建自我介绍
3. ✅ 配置心跳任务 (每5分钟)
4. ✅ 配置定时任务 (每日报告)
5. ✅ 配置Pico频道通信
6. ✅ 验证部署

---

## 💬 第四步：启用频道沟通

每台机器运行后，可以使用：

```bash
# 查看状态
~/scripts/cluster-comm.sh status

# 广播消息
~/scripts/cluster-comm.sh broadcast "测试消息"
```

---

## 📋 机器列表

| 机器 | SSH命令 |
|------|---------|
| 7zi.com | `ssh root@7zi.com` |
| bot | `ssh root@bot.szspd.cn` |
| bot2 | `ssh root@bot2.szspd.cn` |
| bot3 | `ssh root@bot3.szspd.cn` |
| bot4 | `ssh root@bot4.szspd.cn` |
| bot5 | `ssh root@182.43.36.134` |
| bot6 | `ssh root@bot6.szspd.cn` |

密码: `[REDACTED]`

---

## ✅ 验证清单

部署完成后，每台机器应该：

- [ ] 目录 `~/memory/` 和 `~/scripts/` 存在
- [ ] 心跳任务已配置 (`crontab -l | grep heartbeat`)
- [ ] 能运行 `~/scripts/cluster-comm.sh status`
- [ ] 能运行 `~/scripts/heartbeat-check.sh`

---

## 📞 部署顺序建议

1. **先部署bot3** - 替换路由
2. **然后7zi.com** - 协调经理
3. **其他机器** - Worker

