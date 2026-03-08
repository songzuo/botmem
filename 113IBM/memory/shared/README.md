# Shared Memory - 共享记忆区

## 用途
这是所有 11 个子代理的共享信息区域，用于跨代理通信和信息同步。

## 目录结构

```
shared/
├── announcements/     # 代理公告
├── requests/          # 代理间请求
├── common-knowledge/  # 共同知识
└── temp/              # 临时数据交换
```

## 使用规则

### 写入规则
1. 每个代理只能写入自己的目录
2. 重要信息需要添加时间戳
3. 临时数据 24 小时后自动清理

### 读取规则
1. 所有代理可以读取共享区任何内容
2. 处理完请求后标记为 completed
3. 敏感信息需要加密

## 通信协议

### 代理间消息格式
```json
{
  "from": "agent-name",
  "to": "target-agent",
  "type": "request|response|notification",
  "priority": "low|normal|high|urgent",
  "content": "消息内容",
  "timestamp": "2026-03-08T10:00:00+08:00",
  "expires": "2026-03-09T10:00:00+08:00"
}
```

### 优先级定义
- **low**: 可以延迟处理
- **normal**: 正常优先级
- **high**: 尽快处理
- **urgent**: 立即处理，中断当前任务

## 常见用例

### 1. 系统代理 → 主代理
```
类型：notification
优先级：high
内容：Gateway 离线，已尝试重启
```

### 2. 加密货币代理 → 数据代理
```
类型：request
优先级：normal
内容：请求分析最近 7 天 BTC 价格趋势
```

### 3. 聊天代理 → 所有代理
```
类型：announcement
优先级：normal
内容：用户上线，准备接收消息
```

## 清理策略
- 临时数据：24 小时
- 请求响应：7 天
- 公告通知：30 天
- 共同知识：永久保存

---
*最后更新：2026-03-08*
