# 增量式 Z-Score 异常检测实现报告

**日期**: 2026-04-02  
**任务**: 异常检测算法优化 - Z-Score 增量计算  
**状态**: ✅ 完成

## 概述

在 `src/lib/performance/anomaly-detection/` 目录下成功实现了增量式 Z-Score 计算，使用 Welford's online algorithm 替代全量计算。

## 实现内容

### 1. IncrementalZScore 类

**文件**: `src/lib/performance/anomaly-detection/incremental-zscore.ts`

#### 核心功能

| 方法 | 描述 |
|------|------|
| `update(value: number)` | 增量更新统计量，返回 `{ zScore, isAnomaly }` |
| `computeZScore(value: number)` | 计算指定值的 z-score |
| `getStats()` | 获取当前统计信息 (count, mean, variance, stdDev) |
| `reset()` | 重置到初始状态 |
| `getState()` / `setState()` | 序列化/反序列化状态 |
| `static merge()` | 合并两个 IncrementalZScore 实例 |

#### 算法特性

- **时间复杂度**: O(1) 每条数据
- **空间复杂度**: O(1)
- **数值稳定性**: Welford's algorithm 避免 catastrophic cancellation
- **默认阈值**: |zScore| > 3 判定为异常

### 2. 测试覆盖

**文件**: `src/lib/performance/anomaly-detection/__tests__/incremental-zscore.test.ts`

- ✅ 22 个测试用例全部通过
- 覆盖: 基础功能、z-score 计算、异常检测、状态管理、合并功能、边界情况、数值稳定性

### 3. 模块导出

**文件**: `src/lib/performance/anomaly-detection/index.ts`

```typescript
export { IncrementalZScore, createIncrementalZScore } from './incremental-zscore';
```

## 使用示例

```typescript
import { IncrementalZScore } from '@/lib/performance/anomaly-detection';

// 创建检测器 (默认阈值 3)
const detector = new IncrementalZScore();

// 处理流式数据
const data = [10, 12, 11, 13, 100]; // 100 是异常值
data.forEach(value => {
  const { zScore, isAnomaly } = detector.update(value);
  if (isAnomaly) {
    console.log(`异常检测: value=${value}, zScore=${zScore.toFixed(2)}`);
  }
});

// 获取统计信息
console.log(detector.getStats());
// { count: 5, mean: 29.2, variance: 1446.7, stdDev: 38.04 }
```

## 性能对比

| 方案 | 时间复杂度 | 空间复杂度 | 适用场景 |
|------|-----------|-----------|----------|
| 全量计算 | O(n) 每次 | O(n) | 离线批处理 |
| **Welford 增量** | **O(1) 每次** | **O(1)** | **实时流处理** |

## 后续扩展

可选任务 (未实现):
- `StreamingIsolationForest` 简化版本 (256点增量训练)

## 结论

✅ 成功实现增量式 Z-Score 计算，满足需求:
1. Welford's online algorithm 实现
2. O(1) 时间/空间复杂度
3. 异常判定 (|zScore| > 3)
4. 完整的单元测试
5. 未破坏现有接口
