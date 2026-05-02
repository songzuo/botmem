# TypeScript 严格模式清理报告 v2

## 执行时间
2026-04-03

## 任务目标
继续清理 src/ 目录下的 TypeScript 严格模式错误，目标是将错误数从 161 降至最低。

## 修复摘要

### 初始错误数: 170 (实际比报告的161更多)
### 最终错误数: 72

### 修复的错误数量: 98

## 修复的文件列表

### 高优先级修复 (TS2308 重复导出、TS2307 找不到模块)

1. **src/lib/ai/index.ts**
   - 移除不存在的 `./routing` 导出，修复重复导出错误

2. **src/lib/plugins/__tests__/PluginSystem.test.ts**
   - 修复导入路径：`./PluginManager` → `../PluginManager`
   - 修复导入路径：`./PluginRegistry` → `../PluginRegistry`
   - 修复导入路径：`./PluginLoader` → `../PluginLoader`
   - 修复导入路径：`./PluginSandbox` → `../PluginSandbox`
   - 修复导入路径：`./PluginHooks` → `../PluginHooks`
   - 修复导入路径：`./types` → `../types`

3. **src/lib/plugins/builtin/plugins/AuthPlugin.ts**
   - 修复导入路径：`../types` → `../../types`

4. **src/lib/plugins/builtin/plugins/CachePlugin.ts**
   - 修复导入路径：`../types` → `../../types`

5. **src/lib/plugins/builtin/plugins/LoggingPlugin.ts**
   - 修复导入路径：`../types` → `../../types`

6. **src/lib/plugins/builtin/plugins/WebhookPlugin.ts**
   - 修复导入路径：`../types` → `../../types`

7. **src/lib/plugins/index.ts**
   - 修复重复导出：使用命名导出替代通配符导出
   - 修复 `export type` 用于类型重新导出

### 中优先级修复 (TS18048 可能是undefined、TS2741 缺少属性)

8. **src/lib/health-monitor/PassiveHealthReporter.ts**
   - 添加非空断言修复 `record` 可能为 undefined 的问题

9. **src/lib/economy/wallet.ts**
   - 使用空值合并运算符修复 `aVal` 和 `bVal` 可能为 undefined 的问题

10. **src/lib/log-aggregator/storage/LogStorage.ts**
    - 添加 sort 参数为空检查

11. **src/lib/ai/types.ts**
    - 将 `RouteRequest.taskType` 改为可选属性

12. **src/lib/message-queue/tests/message-queue.test.ts**
    - 添加缺失的 `intervalMs` 属性

### 低优先级修复 (TS2345 参数类型不匹配、TS2322 类型赋值错误)

13. **src/components/ai-report/AIReportGenerator.tsx**
    - 移除未使用的 `QueryParser` 导入

14. **src/components/ai-report/SQLGenerator.tsx**
    - 添加缺失的 `useCallback` 导入

15. **src/lib/plugins/PluginLoader.ts**
    - 移除不存在的 `PluginLoader as IPluginLoader` 导入

16. **src/lib/collab/core/crdt.ts**
    - 修复类型断言：`json.type as string` → `json.type as 'text'/'list'/'map'`

17. **src/lib/debug/ContextAnalyzer.ts**
    - 修复 scope 类型：`'unknown'` → `'local'`

18. **src/lib/debug/ErrorClassifier.ts**
    - 移除不存在的 `Error` 类型导入

19. **src/lib/debug/StackAnalyzer.ts**
    - 移除不存在的 `Error` 类型导入

20. **src/lib/ai/code/code-completer.ts**
    - 添加 `await` 到 `getContext()` 调用

21. **src/lib/__tests__/memory-leak.test.ts**
    - 修复 `intervals` Map 类型：`Map<string, number>` → `Map<string, NodeJS.Timeout>`

22. **src/lib/ai/reports/nlg-processor.ts**
    - 添加缺失的繁体中文和日语翻译

23. **src/lib/ai/code/__tests__/code-analyzer-extended.test.ts**
    - 移除未使用的 `@ts-expect-error` 指令

24. **src/lib/alerting/SlackAlertService.ts**
    - 移除重复的 `enabled` 属性

25. **src/lib/alerting/__tests__/SlackAlertService.test.ts**
    - 添加缺失的 `enabled` 属性

26. **src/lib/debug/examples.ts**
    - 添加 `as const` 修复日志级别类型

27. **src/lib/message-queue/api/websocket-api.ts**
    - 重构 WebSocket 导入，使用 `WebSocketServer` 和 `WebSocket as WSWebSocket`
    - 修复 `WebSocket.OPEN` → `WSWebSocket.OPEN`

28. **src/lib/audit-log/__tests__/audit-log.test.ts**
    - 修复测试中的 password 字段位置

29. **src/lib/config-center/__tests__/config-center.test.ts**
    - 添加 null 检查和断言

## 剩余错误分类 (72个)

| 错误代码 | 数量 | 描述 |
|---------|------|------|
| TS2345 | 25 | 参数类型不匹配 |
| TS2322 | 17 | 类型赋值错误 |
| TS2532 | 6 | 对象可能为 undefined |
| TS2493 | 6 | 元组索引越界 |
| TS2741 | 4 | 缺少必需属性 |
| TS2554 | 4 | 参数数量不匹配 |
| TS2353 | 4 | 对象字面量未知属性 |
| TS2352 | 2 | 类型转换错误 |
| TS2341 | 2 | 私有属性访问 |
| 其他 | 2 | 各种其他错误 |

## 验证命令执行结果

```bash
pnpm exec tsc --noEmit 2>&1 | grep -c "error TS"
# 结果: 72
```

## 建议

剩余的 72 个错误主要涉及：
1. 测试文件中的类型不匹配（可考虑使用 `as any` 或修复测试数据）
2. 复杂的泛型类型推断问题
3. 第三方库类型定义问题

建议后续：
1. 对测试文件使用更宽松的类型检查
2. 添加缺失的类型定义
3. 重构复杂泛型函数
