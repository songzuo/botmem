# Evomap 集成状态检查与优化报告

**检查日期**: 2026-04-26
**状态**: ⚠️ 需要优化

---

## 一、Skill 配置分析

### 1.1 文件结构
```
~/.openclaw/skills/evomap/
├── SKILL.md           # Skill 元数据
├── evomap-client.js   # GEP-A2A 协议客户端
├── evomap-service.js  # 网关服务 (心跳循环、同步)
└── evomap-cli.js      # CLI 测试工具
```

### 1.2 GEP-A2A 协议实现

**协议信封结构** (✅ 已正确实现):
```javascript
{
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: '<hello|heartbeat|fetch|publish|report|revoke>',
  message_id: 'msg_<timestamp>_<random_hex>',
  sender_id: '<node_id>',
  timestamp: '<ISO 8601 UTC>',
  payload: { ... }
}
```

**支持的 A2A 端点**:
- `POST /a2a/hello` - 节点注册
- `POST /a2a/heartbeat` - 心跳
- `POST /a2a/fetch` - 获取资产
- `POST /a2a/publish` - 发布资产
- `POST /a2a/report` - 验证报告
- `POST /a2a/revoke` - 撤回资产

**REST 端点**:
- `GET /a2a/stats` - Hub 统计
- `GET /a2a/trending` - 趋势资产
- `GET /a2a/directory` - 活跃节点目录
- `GET /a2a/assets/<id>` - 资产详情

---

## 二、Hub 连接状态

### 2.1 连接测试结果

| 测试项 | 状态 | 说明 |
|--------|------|------|
| Hub 可达性 | ✅ 正常 | https://evomap.ai 响应正常 |
| 协议验证 | ✅ 通过 | GEP-A2A envelope 格式正确 |
| 节点注册 | ✅ 成功 | 新节点 ID: `node_641a010362a13a97` |
| 心跳间隔 | 5 分钟 | Hub 推荐 5 分钟 |
| Hub 节点 ID | `hub_0f978bbe1fb5` | 仅为参考，不用作 sender_id |

### 2.2 当前节点状态

| 项目 | 值 |
|------|-----|
| 本地存储 node_id | `node_909148eee8a8816a` (⚠️ 已过期) |
| 本地存储 node_secret | `99827e1a2c6d53ed...` (⚠️ 已过期) |
| Hub 新分配的 node_id | `node_641a010362a13a97` |
| Hub 新分配的 node_secret | `9fc54a19840d32ad...` |
| 上次心跳时间 | 2026-04-23T13:11:56Z (⚠️ 3天前) |
| 注册状态 | ✅ registered: true (本地) |
| 节点存活状态 | ❌ survival_status: dead (Hub) |

**问题诊断**: 
本地存储的节点凭证与 Hub 重新生成的不一致，导致心跳失效。节点在 Hub 侧已标记为 offline。

---

## 三、发现的问题

### 问题 1: 节点凭证过期
- **严重性**: 🔴 高
- **原因**: Hub 在 hello 时重新生成了 node_id 和 node_secret，但本地未更新
- **影响**: 心跳请求被 Hub 拒绝，节点状态为 dead

### 问题 2: 缺少自动心跳 Cron
- **严重性**: 🟡 中
- **原因**: Evomap skill 未配置定时心跳任务
- **影响**: 即使凭证正确，也无法维持节点活跃状态

### 问题 3: OpenClaw Skill 集成不完整
- **严重性**: 🟡 中
- **原因**: SKILL.md 缺少 OpenClaw 工具函数定义
- **影响**: 无法通过 OpenClaw 对话直接调用 Evomap 功能

### 问题 4: CLI 工具未在 PATH 中
- **严重性**: 🟢 低
- **原因**: evomap-cli.js 需要手动 node 执行
- **影响**: 测试和调试不便

---

## 四、优化建议

### 4.1 紧急修复 (立即执行)

**更新节点凭证**:
```bash
# 更新 node_secret
echo "9fc54a19840d32adab1f43aa59d59ab63e4cfa6c8347a572542110da233c019b" > ~/.evomap/node_secret

# 更新 node_id
echo "node_641a010362a13a97" > ~/.evomap/node_id

# 重置注册状态，强制重新 hello
echo '{"registered":false,"lastHeartbeat":null}' > ~/.evomap/state.json
```

**发送心跳保持在线**:
```bash
curl -X POST https://evomap.ai/a2a/heartbeat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 9fc54a19840d32adab1f43aa59d59ab63e4cfa6c8347a572542110da233c019b" \
  -d '{
    "protocol": "gep-a2a",
    "protocol_version": "1.0.0",
    "message_type": "heartbeat",
    "message_id": "msg_repair_'$(date +%s)'",
    "sender_id": "node_641a010362a13a97",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
    "payload": {
      "status": "alive",
      "skills_count": 14,
      "capabilities": ["error_repair", "optimization", "devops"]
    }
  }'
```

### 4.2 配置完善

**添加环境变量配置** (在 `~/.openclaw/openclaw.json` 或环境):
```json
{
  "EVOMAP_HUB_URL": "https://evomap.ai",
  "EVOMAP_NODE_ID": "node_641a010362a13a97",
  "EVOMAP_NODE_SECRET": "9fc54a19840d32adab1f43aa59d59ab63e4cfa6c8347a572542110da233c019b",
  "EVOMAP_HEARTBEAT_INTERVAL_MS": 300000
}
```

### 4.3 创建 Cron 定时心跳

在 OpenClaw cron 中添加心跳任务:
```bash
# 每 5 分钟发送心跳
*/5 * * * * curl -s -X POST https://evomap.ai/a2a/heartbeat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 9fc54a19840d32adab1f43aa59d59ab63e4cfa6c8347a572542110da233c019b" \
  -d '{"protocol":"gep-a2a","protocol_version":"1.0.0","message_type":"heartbeat","message_id":"msg_cron_'$((RANDOM))'","sender_id":"node_641a010362a13a97","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'","payload":{"status":"alive","skills_count":14}}' >> ~/.evomap/heartbeat.log 2>&1
```

### 4.4 增强 SKILL.md

更新 `~/.openclaw/skills/evomap/SKILL.md` 添加 OpenClaw 工具函数:

```markdown
## OpenClaw 工具函数

### evomap.status
查看当前节点状态
- 返回: { nodeId, registered, lastHeartbeat, publishCount, fetchCount }

### evomap.publish
发布解决方案到 Evomap 市场
- 参数: { signals, summary, content, confidence, blastRadius, intent }
- 返回: { success, assetId }

### evomap.fetch
获取资产和任务
- 参数: { assetType, limit, signals }
- 返回: { assets[], tasks[] }

### evomap.test
测试 Hub 连接
- 返回: { connected, latency, hubStatus }
```

### 4.5 添加 Webhook 支持

在 hello 时提供 webhook URL，以便 Hub 主动推送任务:
```javascript
await client.hello({
  model: 'openclaw-gateway',
  webhookUrl: 'https://your-domain.com/evomap/webhook'
});
```

---

## 五、需要的配置参数汇总

| 参数名 | 当前值 | 推荐值 | 来源 |
|--------|--------|--------|------|
| EVOMAP_HUB_URL | https://evomap.ai | https://evomap.ai | ✅ 已配置 |
| EVOMAP_NODE_ID | node_909148eee8a8816a | node_641a010362a13a97 | ⚠️ 需更新 |
| EVOMAP_NODE_SECRET | 99827e1a2c6d... | 9fc54a19840d32ad... | ⚠️ 需更新 |
| heartbeat_interval_ms | 300000 (5min) | 300000 | ✅ 正确 |
| data_dir | ~/.evomap | ~/.evomap | ✅ 正确 |

---

## 六、修复命令执行清单

```bash
# 1. 更新凭证
echo "node_641a010362a13a97" > ~/.evomap/node_id
echo "9fc54a19840d32adab1f43aa59d59ab63e4cfa6c8347a572542110da233c019b" > ~/.evomap/node_secret

# 2. 重置状态
cat > ~/.evomap/state.json << 'EOF'
{
  "registered": true,
  "lastHeartbeat": null,
  "publishCount": 0,
  "fetchCount": 11,
  "credits": 0,
  "reputation": 0,
  "lastHello": null
}
EOF

# 3. 发送心跳恢复在线状态
curl -s -X POST https://evomap.ai/a2a/heartbeat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 9fc54a19840d32adab1f43aa59d59ab63e4cfa6c8347a572542110da233c019b" \
  -d '{"protocol":"gep-a2a","protocol_version":"1.0.0","message_type":"heartbeat","message_id":"msg_repair_'$(date +%s)'","sender_id":"node_641a010362a13a97","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'","payload":{"status":"alive","skills_count":14,"capabilities":["error_repair","optimization","devops"]}}'

# 4. 验证节点状态
curl -s https://evomap.ai/a2a/stats -H "Authorization: Bearer 9fc54a19840d32adab1f43aa59d59ab63e4cfa6c8347a572542110da233c019b"
```

---

## 七、结论

**当前状态**: 节点已注册但凭证过期，需要更新。
**Hub 连接**: ✅ 正常
**协议实现**: ✅ 正确
**主要问题**: 
1. 节点凭证与 Hub 不一致
2. 缺少自动心跳机制
3. Skill 未完全集成到 OpenClaw 工具系统

**建议优先级**:
1. 🔴 立即更新 node_id 和 node_secret
2. 🟡 配置 cron 定时心跳
3. 🟡 增强 SKILL.md 工具函数定义
4. 🟢 考虑添加 webhook 支持