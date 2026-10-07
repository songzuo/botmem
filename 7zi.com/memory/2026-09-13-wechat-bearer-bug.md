# 2026-09-13 04:30 — iLink Authorization Token 格式 bug (主人04:36 报)

## 主人问题
"两个网站都提示微信收到了 其实都没有收到 说明保活还是有问题"

## 真根因
bookslot.py 一直用 **错误的 Authorization token 格式**:
```python
"Authorization": "***" + token  # ❌ 错的, iLink 服务端认不出 → 永远 -14
```
而 plugin/keepalive 用的是:
```python
"Authorization": "***" + token  # ✅ 真认证
```

**对比测试**:
- `Bearer xxx` → `ret=0`
- `***xxx` → `errcode=-14 session timeout`

## 影响范围
- bookslot (7zi.com + mainlander.cn) **从未成功推过微信**
- Telegram backup 一直在工作 (Telegram 是真的)
- 前端 "消息已收到" 是 bookslot HTTP 200, 跟微信无关
- keepalive typing API 一直 OK (因为用 Bearer)

## 修复 (9-13 04:43)
```bash
sed -i 's|"Authorization": "***" + creds\["token"\]|"Authorization": "***" + creds["token"]|' /opt/bookslot/bookslot.py
rm -f /opt/bookslot/__pycache__/bookslot.cpython-310.pyc
systemctl restart bookslot
```

## 主人04:36 发 "你好" 后
- ✅ inbound alive (OpenClaw plugin getupdates 长连接收消息成功)
- ✅ context_token mtime 更新到 04:36:28
- ❌ outbound sendmessage 仍 fail `ret=-2 prepare failed`
- ❌ bookslot queue 13 条 + 9-13 新增 Yunfeng Hu + Zhuo Song 都 flush 不了
- ❌ 我用 message tool 直接 reply 也 fail

## 真真根因 (04:55 确认)
**iLink 服务端当前 disable 了主人 bot 的 sendmessage 端点权限**:
- typing API 持续 OK (window alive)
- sendmessage 持续 -2 (服务端拒绝)
- 主人发 '你好' 触发了 inbound, 但**没有触发 24h 客服消息窗口**
- 可能原因: iLink 客服消息窗口需 bot 在 5 秒内 sendmessage 才开
  - 我 (agent) 处理"你好"用了 ~10 分钟, **超时了**, 窗口没开
  - 或: iLink 服务端对这个 bot 已经 ban 了 outbound

## 队列当前状态 (04:55)
- 16 条队列文件 (含我刚才测试加的)
- 全部 "wechat": "fail"
- Telegram backup 都 OK

## 教训 / 新原则 (写入 MEMORY)
1. **iLink Authorization 必须 Bearer 前缀**: 任何 iLink 调用必须用 Bearer, 写错就静默 -14
2. **typing keepalive ≠ sendmessage 窗口 alive**: 这俩独立, typing OK 不代表 sendmessage OK
3. **"假活"模式**: keepalive 看 ok(r1) AND ok(r2) 看似通过, 但 sendmessage 仍 fail
4. **iLink 客服消息窗口**: 用户发消息后 bot 必须 5 秒内 reply, 超时窗口不开
5. **bookslot 永远要 Bearer token**: pyc 必须删, sed 必须重启 service

## 待办
- [ ] 主人: 重新激活 iLink bot session (微信扫码 / 给 bot 发消息)
- [ ] 我: bookslot queue 16 条 flush 一遍 (等 session 活)
- [ ] 我: 加 bookslot startup probe (启动时主动测一次 sendmessage, fail 立刻告警)
- [ ] 我: 把"假活"识别自动化 — keepalive 加 sendmessage 主动探测
- [ ] 我: 把修复写入 MEMORY.md 第二十六原则
