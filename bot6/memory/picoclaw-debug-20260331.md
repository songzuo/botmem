# picoclaw.service 故障排查报告

**日期**: 2026-03-31  
**服务器**: 7zi.com (165.99.43.61)  
**问题**: picoclaw.service 持续崩溃，重启计数器超过 64,000+

---

## 🔍 根本原因

服务日志显示持续报错：

```
Error: error creating provider: model "auto" not found in model_list: 
model "auto" not found in model_list or providers
```

**问题分析**:
1. `agents.defaults.model` 设置为 `"auto"`
2. `model_list` 中的每个条目也使用 `"model": "auto"`
3. `"auto"` 不是有效的模型名称，实际的模型名称应该是 `abab6.5s-chat`、`qwen3.5-plus` 等

---

## 🔧 修复方案

修改 `/root/.picoclaw/config.json`：

1. 将 `agents.defaults.model` 改为有效模型名
2. 将 `model_list` 中的 `model` 字段改为正确的模型标识符

---

## 📋 建议修复命令

```bash
# 在服务器上执行
sshpass -p 'ge20993344$ZZ' ssh root@165.99.43.61 '
cat > /root/.picoclaw/config.json << "EOF"
{
  "session": {
    "dm_scope": "per-channel-peer"
  },
  "agents": {
    "defaults": {
      "workspace": "/root/.picoclaw/workspace",
      "restrict_to_workspace": false,
      "provider": "custom",
      "model": "MiniMax-M2.5",
      "max_tokens": 4096,
      "max_tool_iterations": 50
    }
  },
  "channels": {
    "pico": {
      "enabled": true,
      "token": "picoclaw-cluster-2026",
      "ping_interval": 30,
      "read_timeout": 60,
      "write_timeout": 10,
      "max_connections": 100,
      "allow_from": [
        "127.0.0.1",
        "10.0.0.0/8",
        "172.16.0.0/12",
        "192.168.0.0/16"
      ],
      "placeholder": {
        "enabled": true,
        "text": "🤔 Processing..."
      }
    }
  },
  "model_list": [
    {
      "model_name": "MiniMax-M2.5",
      "model": "MiniMax-M2.5",
      "api_base": "https://api.minimax.chat/v1",
      "api_key": "sk-cp--HJ367Hzkp0OAqaY88Wzzcxp1Z9VSdMi7HDiWzp78sdqrnIXH9nmNVuoGiiHxpyoS0PSzb_V5R31ZEchtAGTODFDfGeR-xk8eW_I2GLxvDOotOh7Bjc1QA8",
      "api_type": "openai"
    }
  ],
  "gateway": {
    "host": "0.0.0.0",
    "port": 18795
  },
  "tools": {
    "web": {
      "duckduckgo": {
        "enabled": true,
        "max_results": 5
      }
    }
  },
  "heartbeat": {
    "enabled": true,
    "interval": 30
  },
  "providers": {
    "minimax": {
      "api_key": "sk-cp--HJ367Hzkp0OAqaY88Wzzcxp1Z9VSdMi7HDiWzp78sdqrnIXH9nmNVuoGiiHxpyoS0PSzb_V5R31ZEchtAGTODFDfGeR-xk8eW_I2GLxvDOotOh7Bjc1QA8",
      "api_base": "https://api.minimax.chat/v1"
    }
  }
}
EOF
'
```

```bash
# 重启服务
sshpass -p 'ge20993344$ZZ' ssh root@165.99.43.61 'systemctl restart picoclaw.service'
```

---

## ⚠️ 注意

- 修复后需手动重启服务
- 当前配置文件包含 API 密钥，建议后续考虑使用环境变量或加密存储
- 建议先在测试服务器 (bot5.szspd.cn) 验证修复方案