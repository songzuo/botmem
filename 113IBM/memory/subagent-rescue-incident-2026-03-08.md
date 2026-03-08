# 2026-03-08 - 子代理救援机制问题与修复

## 问题描述

### 症状
- 多个子代理任务因 `glm-4.7` 模型 HTTP 400 错误失败
- 子代理相互救援机制没有生效
- 错误信息：`HTTP 400: Error code: 400 - {'error': {'code': 'invalid_argument', 'message': "at '/required': got null, want array", 'type': 'invalid_request_error'}`

### 根本原因
1. **配置文件被破坏**：`openclaw.json` 和 `models.json` 被重置，缺少：
   - `auth` 字段（MiniMax 需要 `api-key`）
   - `timeout` 字段（超时设置被移除）
   - 完整的 `models` 数组配置（仅保留 `id` 和 `name`，缺少 `reasoning`、`input`、`cost` 等）

2. **子代理救援机制未启用**：OpenClaw 未检测到模型错误并自动切换

## 已执行的救援操作

### 1. 杀掉卡住的子代理（18:30）
- `文档质量提升计划` (qwen3.5-plus, 54m) ✅
- `依赖安全审计` (qwen3.5-plus, 54m) ✅
- `服务器监控仪表板方案` (glm-4.7, 54m) ✅

### 2. 修复配置文件（18:35）
**openclaw.json**：
- ✅ 添加 `minimax.auth: "api-key"`
- ✅ 所有提供商添加 `timeout: 5000`
- ✅ 恢复完整的 `models` 数组配置

**models.json**：
- ✅ 添加 `minimax.auth: "api-key"`
- ✅ 所有提供商添加 `timeout: 5000`
- ✅ 恢复完整的 `models` 数组配置

## 子代理救援机制改进建议

### 当前缺失的功能
1. ❌ 模型调用失败时自动切换到 fallback 模型
2. ❌ HTTP 4xx/5xx 错误时自动重试
3. ❌ 超时检测和任务重启机制
4. ❌ 子代理相互救援（其他子代理帮助失败的任务）

### 改进方案
1. **在 models.json 中配置 fallback**
   ```json
   {
     "providers": {
       "custom-customcc": {
         "baseUrl": "https://code.coolyeah.net/v1",
         "api": "openai-completions",
         "timeout": 5000,
         "retry": 3,
         "fallbacks": ["custom-customa1", "custom-custom32"]
       }
     }
   }
   ```

2. **子代理救援机制**
   - 监控子代理状态
   - 检测到失败时：
     - 记录错误类型（HTTP 状态码）
     - 切换到其他可用模型
     - 重试任务
   - 如果所有模型都失败：
     - 暂停任务，通知主代理
     - 主代理决定是否继续

3. **配置验证**
   - 启动时验证所有提供商配置
   - 检查必填字段（auth、timeout、models）
   - 验证 API Key 有效性

4. **日志记录**
   - 记录所有模型调用失败
   - 记录模型切换和重试
   - 生成救援报告

## 下一步
- [ ] 等待 Gateway 重启以加载新配置
- [ ] 测试 `glm-4.7` 是否正常工作
- [ ] 监控子代理任务状态
- [ ] 实施子代理救援机制改进

---
**修复时间**: 2026-03-08 18:35
**修复状态**: 配置已修复，等待 Gateway 重载