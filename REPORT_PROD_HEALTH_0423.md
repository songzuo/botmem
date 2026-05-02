# 7zi.com 生产环境健康检查报告

**检查时间**: 2026-04-23 11:11 GMT+2

---

## 1. 磁盘使用率

| 文件系统 | 大小 | 已用 | 可用 | 使用率 |
|----------|------|------|------|--------|
| /dev/vda1 | 88G | 77G | 11G | **89%** |

✅ 磁盘使用率 89%，处于健康范围（< 90%）。上次清理有效。

---

## 2. OpenClaw Gateway 状态

❌ **Gateway 无法启动 - 配置错误**

```
Config invalid
File: ~/.openclaw/openclaw.json
Problem:
  - plugins.load.paths: plugin: plugin path not found: /root/.openclaw/extensions/sms-gateway
```

**原因分析**:
- 配置文件引用了插件路径 `/root/.openclaw/extensions/sms-gateway`
- 该路径不存在，导致配置验证失败
- 当前 extensions 目录只包含: `openclaw-plugin-yuanbao`

**日志**:
- journalctl 无 OpenClaw 相关日志（服务从未成功启动）

---

## 3. Docker 容器状态

| 容器 | 状态 | 端口 |
|------|------|------|
| rabbitmq-dating | Up 12 days | 5672, 15672 |
| mysql-dating | Up 12 days | 3306 |
| microclaw | Up 2 weeks | - |

✅ 所有 Docker 容器运行正常。

---

## 4. 问题修复建议

### 问题：缺失 sms-gateway 插件

**方案 A**: 安装 sms-gateway 插件
```bash
# 方式1: 从 clawhub 安装
clawhub install sms-gateway

# 方式2: 或从源码编译
cd /root/.openclaw/extensions
git clone <sms-gateway-repo> sms-gateway
cd sms-gateway && npm install
```

**方案 B**: 暂时移除插件配置（如果不需要）
编辑 `~/.openclaw/openclaw.json`，移除:
```json
"plugins": {
  "load": { "paths": ["/root/.openclaw/extensions/sms-gateway"] }
}
```

---

## 5. 下一步行动

1. **确认是否需要 SMS 网关插件** - 询问主人是否需要短信功能
2. 如果不需要 → 移除配置，恢复 Gateway 启动
3. 如果需要 → 安装 sms-gateway 插件

---

**报告人**: 子代理 (prod-health-check)
