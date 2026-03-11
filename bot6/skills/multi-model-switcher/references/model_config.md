# 模型配置参考

## 模型端点配置

### MiniMax-M2.5
```json
{
  "model": "minimax/MiniMax-M2.5",
  "endpoint": "https://api.minimax.chat/v1",
  "max_tokens": 8192,
  "temperature": 0.7,
  "use_cases": ["战略规划", "架构设计", "复杂推理"]
}
```

### Self-Claude
```json
{
  "model": "self-claude",
  "endpoint": "https://api.anthropic.com/v1",
  "max_tokens": 4096,
  "temperature": 0.5,
  "use_cases": ["代码开发", "代码审查", "UI/UX设计"]
}
```

### Volcengine
```json
{
  "model": "volcengine",
  "endpoint": "https://api.volcengine.com/v1",
  "max_tokens": 4096,
  "temperature": 0.3,
  "use_cases": ["代码执行", "运维部署", "脚本执行"]
}
```

### Bailian
```json
{
  "model": "bailian",
  "endpoint": "https://api.bailian.ai/v1",
  "max_tokens": 2048,
  "temperature": 0.6,
  "use_cases": ["客户支持", "FAQ回答", "简单查询"]
}
```

### GLM-5
```json
{
  "model": "glm-5",
  "endpoint": "https://api.zhipu.ai/v1",
  "max_tokens": 2048,
  "temperature": 0.7,
  "use_cases": ["通用对话", "信息摘要", "数据整理"]
}
```

## 任务类型映射

| 任务关键词 | 推荐模型 | 原因 |
|-----------|---------|------|
| 架构、设计、规划 | MiniMax-M2.5 | 强推理能力 |
| 代码、开发、重构 | Self-Claude | 代码质量高 |
| 执行、部署、运维 | Volcengine | 执行效率高 |
| 客服、用户、FAQ | Bailian | 响应速度快 |
| 摘要、整理、简单 | glm-5 | 成本低 |

## 切换策略

### 自动切换条件
- 任务复杂度 > 0.8 → MiniMax-M2.5
- 包含代码关键词 → Self-Claude
- 包含执行关键词 → Volcengine
- 包含客服关键词 → Bailian
- 默认 → glm-5

### 手动切换
用户可显式指定模型，覆盖自动选择。