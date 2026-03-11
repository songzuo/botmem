---
name: multi-model-switcher
description: 多模型切换和智能模型选择。当需要根据任务类型选择最佳AI模型、切换不同模型、比较模型输出、优化模型使用成本时使用。适用于：(1) 复杂任务需要区分模型能力，(2) 成本优化，(3) 模型能力匹配，(4) 多模型协作。
---

# Multi Model Switcher

智能多模型管理和切换系统。

## 模型能力矩阵

| 模型 | 优势 | 适用场景 | 成本 |
|------|------|----------|------|
| MiniMax-M2.5 | 战略规划、推理 | 复杂决策、架构设计 | 高 |
| Self-Claude | 代码质量、设计 | 编程、UI/UX | 高 |
| Volcengine | 执行效率 | 代码执行、运维 | 中 |
| Bailian | 响应速度 | 客服、运维 | 低 |
| glm-5 | 通用任务 | 简单对话、摘要 | 低 |

## 任务类型匹配

### 战略规划 → MiniMax-M2.5
- 产品路线图
- 技术选型
- 架构决策

### 代码开发 → Self-Claude
- 功能开发
- 代码审查
- 重构优化

### 执行任务 → Volcengine
- 部署操作
- 脚本执行
- 系统管理

### 客户服务 → Bailian
- 用户支持
- FAQ 回答
- 简单查询

### 日常任务 → glm-5
- 信息摘要
- 简单对话
- 数据整理

## 智能切换逻辑

```python
# 任务复杂度评估
def select_model(task):
    complexity = analyze_complexity(task)
    
    if complexity == "high":
        return "MiniMax-M2.5"  # 战略任务
    elif "code" in task or "开发" in task:
        return "Self-Claude"   # 代码任务
    elif "执行" in task or "部署" in task:
        return "Volcengine"    # 执行任务
    elif "客服" in task or "用户" in task:
        return "Bailian"       # 客服任务
    else:
        return "glm-5"         # 通用任务
```

## 模型切换命令

```bash
# 查看当前模型
openclaw model status

# 切换模型
openclaw model use minimax/MiniMax-M2.5
openclaw model use self-claude
openclaw model use volcengine
openclaw model use bailian
openclaw model use glm-5

# 查看可用模型
openclaw model list
```

## 成本优化策略

1. **简单任务用低成本模型** - glm-5, Bailian
2. **复杂任务用高能力模型** - MiniMax-M2.5, Self-Claude
3. **批量任务并行处理** - 多个低成本模型
4. **关键决策用最佳模型** - 不考虑成本

## 参考配置

详见 `references/model_config.md` 获取完整配置选项。