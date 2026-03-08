# Claw-Mesh 模型错误互助机制

## 设计目标

当任何一个子代理或主代理遇到模型 API 错误时，自动触发互助机制：
1. **自动检测** - 识别模型错误
2. **自动切换** - 切换到备用模型
3. **互助救援** - 其他代理协助处理
4. **恢复通知** - 原模型恢复后通知

---

## 可用模型池

### 主模型配置
| 提供商 | 模型 | 状态 | 用途 |
|--------|------|------|------|
| custom-customa1 | qwen3.5-plus | ✅ 可用 | 主模型 (通义千问) |
| custom-custom32 | qwen3.5-plus | ✅ 可用 | 备用模型 1 |
| custom-customcc | glm-5 | ⚠️ 不稳定 | 备用模型 2 |
| custom-customda | mistral-small-latest | ✅ 可用 | 备用模型 3 |
| custom-custome6 | MiniMax-M2.5 | ✅ 可用 | 备用模型 4 |
| minimax | MiniMax-M2.5 | ✅ 可用 | 备用模型 5 |
| qwen-portal | coder-model | ✅ 可用 | 代码专用 |

### 模型优先级
```
1. custom-customa1/qwen3.5-plus (主模型 - 通义千问)
2. custom-custom32/qwen3.5-plus (备用 1 - 同模型不同 Key)
3. minimax/MiniMax-M2.5 (备用 2)
4. custom-customda/mistral-small-latest (备用 3)
5. qwen-portal/coder-model (备用 4 - 代码任务)
```

---

## 错误检测机制

### 错误类型识别
```json
{
  "error_types": {
    "API_KEY_INVALID": "401 Unauthorized",
    "RATE_LIMIT": "429 Too Many Requests",
    "MODEL_ERROR": "400 invalid_argument",
    "TIMEOUT": "504 Gateway Timeout",
    "SERVICE_UNAVAILABLE": "503 Service Unavailable",
    "CONTEXT_EXCEEDED": "400 context_length_exceeded"
  }
}
```

### 检测方式
1. **API 响应检查** - 每次调用检查返回状态码
2. **心跳超时检测** - 超过预期时间未响应
3. **连续失败计数** - 连续 3 次失败触发切换
4. **错误模式识别** - 识别特定错误类型

---

## 互助救援流程

### 阶段 1: 错误检测 (自动)
```
代理检测到模型错误
    ↓
记录错误到共享记忆区
    ↓
增加失败计数器
    ↓
连续 3 次失败 → 触发救援
```

### 阶段 2: 自动切换 (自动)
```
触发救援机制
    ↓
读取模型优先级列表
    ↓
切换到下一个可用模型
    ↓
测试新模型连接
    ↓
成功 → 继续任务
失败 → 继续下一个模型
```

### 阶段 3: 互助通知 (广播)
```
发送救援广播到共享区
    ↓
格式：{
  "from": "error-agent",
  "type": "rescue_request",
  "error": "模型错误详情",
  "switched_to": "新模型 ID",
  "needs_help": true/false
}
    ↓
其他代理收到后记录并待命
```

### 阶段 4: 协助处理 (按需)
```
Main 代理协调救援
    ↓
Code 代理检查配置
    ↓
Sys 代理检查网络
    ↓
Memory 代理记录事件
    ↓
生成救援报告
```

---

## 实现方案

### 1. 共享记忆区结构
```
memory/shared/
├── model-status/          # 模型状态
│   ├── custom-customa1.json
│   ├── custom-custom32.json
│   ├── minimax.json
│   └── ...
├── rescue-requests/       # 救援请求
│   └── {timestamp}-{agent}.json
├── rescue-history/        # 救援历史
│   └── 2026-03-08.md
└── model-config/          # 模型配置
    └── priority-list.json
```

### 2. 模型状态文件格式
```json
{
  "model_id": "custom-customa1/qwen3.5-plus",
  "status": "healthy|degraded|down",
  "last_check": "2026-03-08T13:50:00+08:00",
  "success_count": 152,
  "failure_count": 3,
  "last_error": null,
  "consecutive_failures": 0,
  "switched_from": [],
  "avg_response_time_ms": 1250
}
```

### 3. 救援请求格式
```json
{
  "timestamp": "2026-03-08T13:50:00+08:00",
  "from_agent": "crypto-agent",
  "error_type": "MODEL_ERROR",
  "error_message": "400 invalid_argument",
  "original_model": "custom-customcc/glm-5",
  "switched_to": "custom-customa1/qwen3.5-plus",
  "task_context": "Polymarket 余额检查",
  "needs_help": false,
  "status": "resolved"
}
```

---

## 各代理职责

### Main 代理 (总协调)
- 监控所有代理模型状态
- 协调复杂救援任务
- 生成救援报告
- 决策是否降级服务

### Memory 代理 (记录)
- 记录所有模型错误
- 维护模型状态历史
- 生成模型健康报告
- 保存救援历史记录

### Sys 代理 (诊断)
- 检查网络连接
- 检查 Gateway 状态
- 诊断 API 可达性
- 提供系统级支持

### Code 代理 (配置)
- 检查模型配置
- 验证 API Key 有效性
- 更新模型优先级
- 修复配置问题

### Chat 代理 (通知)
- 通知用户模型切换
- 发送救援广播
- 更新状态仪表板
- 管理告警消息

### 其他代理 (待命)
- 监听救援广播
- 准备协助处理
- 共享模型使用经验
- 提供任务接管支持

---

## 心跳任务集成

### 每 10 分钟 (Chat 代理)
- 检查各渠道消息
- 广播模型状态更新
- 处理救援通知

### 每 15 分钟 (Sys 代理)
- 测试所有模型 API 连接
- 更新模型状态文件
- 报告网络问题

### 每 30 分钟 (Crypto 代理)
- 记录模型使用情况
- 分析响应时间趋势
- 预测潜在问题

### 每小时 (所有代理)
- 检查自身模型状态
- 报告连续失败次数
- 更新共享状态文件

### 每 3 小时 (Main 代理)
- 生成模型健康报告
- 分析救援历史
- 优化模型优先级
- 向用户汇报状态

---

## 自动切换规则

### 触发条件
| 条件 | 动作 |
|------|------|
| 连续 3 次失败 | 切换到下一优先级模型 |
| 连续 5 次失败 | 广播救援请求 |
| 连续 10 次失败 | 通知用户介入 |
| 响应时间 > 30 秒 | 标记为降级 |
| 1 小时内失败 > 20% | 降低优先级 |

### 切换策略
1. **同模型不同 Key** - 优先切换 (如 qwen3.5-plus customa1→custom32)
2. **同类模型** - 相似能力模型 (如 qwen→qwen-coder)
3. **不同提供商** - 跨提供商切换 (如 qwen→minimax)
4. **降级服务** - 使用更小模型保证可用性

### 恢复策略
- 原模型连续成功 10 次后标记为恢复
- 等待 1 小时观察期
- 逐步恢复流量 (10% → 50% → 100%)
- 记录恢复时间和服务质量

---

## 告警级别

### 🟢 正常 (Green)
- 模型成功率 > 95%
- 响应时间 < 5 秒
- 无连续失败

### 🟡 警告 (Yellow)
- 模型成功率 80-95%
- 响应时间 5-15 秒
- 连续失败 2-3 次
- **动作**: 准备切换，通知相关代理

### 🟠 严重 (Orange)
- 模型成功率 50-80%
- 响应时间 15-30 秒
- 连续失败 4-9 次
- **动作**: 自动切换，广播救援

### 🔴 故障 (Red)
- 模型成功率 < 50%
- 响应时间 > 30 秒
- 连续失败 ≥ 10 次
- **动作**: 紧急切换，通知用户，Main 代理协调

---

## 实施步骤

### 阶段 1: 基础架构 (立即)
- [ ] 创建共享记忆区目录
- [ ] 创建模型状态文件模板
- [ ] 配置模型优先级列表
- [ ] 更新各代理 HEARTBEAT.md

### 阶段 2: 错误检测 (今天)
- [ ] 实现错误类型识别
- [ ] 实现连续失败计数
- [ ] 实现自动切换逻辑
- [ ] 测试切换流程

### 阶段 3: 互助机制 (明天)
- [ ] 实现救援广播
- [ ] 实现代理协作流程
- [ ] 实现救援历史记录
- [ ] 测试完整救援流程

### 阶段 4: 优化完善 (本周)
- [ ] 分析救援数据
- [ ] 优化模型优先级
- [ ] 完善告警策略
- [ ] 生成运行报告

---

## 示例场景

### 场景 1: Crypto 代理模型错误
```
13:50 - Crypto 代理调用 custom-customcc/glm-5
13:50 - 返回 400 invalid_argument 错误
13:50 - 失败计数器 +1 (当前 1/3)
13:51 - 再次调用，同样错误
13:51 - 失败计数器 +1 (当前 2/3)
13:52 - 再次调用，同样错误
13:52 - 失败计数器 +1 (当前 3/3) → 触发切换
13:52 - 自动切换到 custom-customa1/qwen3.5-plus
13:52 - 测试调用成功
13:52 - 继续执行 Polymarket 检查任务
13:52 - 发送救援广播到 shared/rescue-requests/
13:53 - Memory 代理记录事件
13:53 - Main 代理更新状态仪表板
```

### 场景 2: 多代理同时故障
```
14:00 - 多个代理报告 custom-customcc/glm-5 错误
14:01 - Main 代理检测到模式
14:01 - 广播全局模型降级通知
14:02 - 所有代理切换到 custom-customa1/qwen3.5-plus
14:05 - Sys 代理诊断 custom-customcc 服务
14:06 - 确认 custom-customcc 服务不可用
14:10 - Memory 代理记录服务中断事件
14:15 - Main 代理生成事件报告
```

---

## 监控仪表板

### 实时更新
- 各代理当前使用模型
- 模型成功率 (24 小时)
- 平均响应时间
- 当前救援状态
- 今日切换次数

### 历史统计
- 模型可用性趋势
- 救援事件统计
- 最常见错误类型
- 最佳/最差模型

---

*Claw-Mesh v1.0 - 模型错误互助机制*
*最后更新：2026-03-08 13:50*
