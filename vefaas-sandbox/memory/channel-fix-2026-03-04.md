# 频道配置问题根源分析 - 2026-03-04

## 问题概述

2026-03-04 凌晨，用户报告 bot6、bot7 (7zi.com)、bot3 的频道配置再次失效。

## 发现的问题

### 1. 7zi.com (bot7) - Telegram
**问题**: Config error - `plugins.entries.claw-mesh.config` 包含无效属性
```
Invalid config: must NOT have additional properties
```
**原因**: 配置文件被修改，claw-mesh 插件配置包含了不被支持的属性 (memberRole, channel, autoJoin, publicUrl)
**修复**: 清理 claw-mesh.config 只保留 memberName

### 2. bot6 - Telegram
**问题**: Config error - `agents.defaults: Unrecognized key: "provider"`
```
"agents": {
  "defaults": {
    "provider": "volcengine",  // 无效键
    "model": "doubao-seed-code-preview-251028"
  }
}
```
**原因**: 配置中错误地添加了 `provider` 键
**修复**: 移除 `provider` 键

### 3. bot3 - DingTalk
**问题**: 
1. Node.js 版本过旧 (20.19.2 → 需要 22.12.0+)
2. DingTalk 频道被禁用
3. Config error - `commands.ownerDisplay` 是无效键

**修复**:
- 升级 Node.js 到 v22.22.0
- 启用 DingTalk 频道
- 运行 `openclaw doctor --fix` 修复无效配置键

## 根本原因分析

1. **配置文件被修改**: 多次修改配置时引入了无效的键
2. **OpenClaw 升级**: 新版本可能不再支持某些旧配置键
3. **Node.js 版本未同步**: bot3 运行旧版 Node.js 导致不兼容

## 防止再次发生的措施

1. **定期运行 doctor**: 每周检查配置有效性
2. **统一 Node.js 版本**: 在所有节点上安装相同版本
3. **配置备份**: 每次修改前备份配置文件
4. **使用 --fix**: 修改配置后运行 `openclaw doctor --fix` 清理无效键
5. **文档记录**: 记录有效配置项

## 当前状态 (2026-03-04 05:15)

| 节点 | 频道 | 状态 |
|------|------|------|
| 7zi.com (bot7) | Telegram | ✅ OK |
| bot6 | Telegram | ✅ OK |
| bot3 | DingTalk | ✅ OK |

## 相关命令

```bash
# 检查配置有效性
openclaw doctor

# 修复配置
openclaw doctor --fix

# 重启网关
openclaw gateway restart

# 查看频道状态
openclaw status | grep -A10 Channels
```
