# Monitoring 模块告警历史记录和统计功能简报

**生成日期**: 2026-04-04  
**检查范围**: `/root/.openclaw/workspace/src/lib/monitoring/` 和 `/root/.openclaw/workspace/src/lib/performance/alerting/`

---

## 1. AlertHistory 数据结构

### 1.1 AlertManager (alert-manager.ts)

```typescript
interface AlertRecord {
  id: string
  ruleId: string
  level: AlertLevelKey
  message: string
  details: Record<string, unknown>
  timestamp: Date
  resolvedAt?: Date
  acknowledgedAt?: Date
  acknowledgedBy?: string
  count: number
  suppressed: boolean
  suppressionReason?: string
  channels: AlertChannel[]
  sendResults: Record<AlertChannel, boolean>
}
```

### 1.2 PerformanceAlerter (alerter.ts)

```typescript
interface PerformanceAlert {
  id: string
  title: string
  message: string
  level: AlertLevel  // 'info' | 'warning' | 'error' | 'critical'
  category: AlertCategory
  status: AlertStatus  // 'active' | 'acknowledged' | 'resolved' | 'suppressed'
  source: string
  metric?: string
  currentValue?: number
  threshold?: number
  createdAt: number
  updatedAt: number
  acknowledgedAt?: number
  resolvedAt?: number
  occurrenceCount: number
  tags?: string[]
}

interface AlertHistoryEntry {
  alert: PerformanceAlert
  actions: AlertAction[]  // 'created' | 'updated' | 'acknowledged' | 'resolved' | 'suppressed' | 'aggregated'
}
```

### 1.3 Log Aggregator (types.ts)

```typescript
interface AlertHistoryEntry {
  timestamp: Date
  action: 'created' | 'acknowledged' | 'escalated' | 'resolved' | 'snoozed'
  user?: string
  details?: string
}

interface AlertHistoryQuery {
  timeRange: TimeRange
  severity?: AlertSeverity[]
  status?: AlertStatus[]
  ruleId?: string
  limit?: number
}
```

**✅ 结论**: AlertHistory 数据结构已实现，包含完整的状态、时间和操作追踪。

---

## 2. 统计 API 分析

### 2.1 AlertManager.getStats()

```typescript
interface AlertStats {
  totalAlerts: number
  activeAlerts: number
  resolvedAlerts: number
  suppressedAlerts: number
  byLevel: Record<AlertLevelKey, number>
  byChannel: Record<AlertChannel, number>
  avgResponseTime: number  // ms
  topAlerts: Array<{ rule: string; count: number }>
}
```

**功能**:
- ✅ 按级别统计 (P0/P1/P2/P3)
- ✅ 按通道统计 (email, webhook, slack, discord, telegram)
- ✅ 平均响应时间计算
- ✅ Top 10 告警规则统计
- ❌ 缺少按时间段的统计 (24h/7d)
- ❌ 缺少按类别统计

### 2.2 PerformanceAlerter.getStats()

```typescript
interface AlertStats {
  byLevel: Record<AlertLevel, number>
  byCategory: Record<AlertCategory, number>
  byStatus: Record<AlertStatus, number>
  last24Hours: number
  last7Days: number
  avgResolutionTime: number
  activeSuppressions: number
}
```

**功能**:
- ✅ 按级别统计 (info/warning/error/critical)
- ✅ 按类别统计 (performance/availability/error/resource/security/custom)
- ✅ 按状态统计 (active/acknowledged/resolved/suppressed)
- ✅ 24小时/7天统计
- ✅ 平均解决时间
- ✅ 活跃抑制规则数量

**✅ 结论**: 统计 API 较为完善，PerformanceAlerter 更全面。

---

## 3. 数据保留策略

### 3.1 当前实现

**AlertManager**:
```typescript
private maxHistorySize = 10000

private trimHistory(): void {
  if (this.alertHistory.length > this.maxHistorySize) {
    this.alertHistory = this.alertHistory.slice(-this.maxHistorySize)
  }
}
```

**PerformanceAlerter**:
```typescript
private config: AlertConfig = {
  maxHistorySize: 1000,  // 默认 1000
}

private trimHistory(): void {
  if (this.alertHistory.length > this.config.maxHistorySize) {
    this.alertHistory.shift()  // 移除最旧的
  }
}
```

### 3.2 评估

| 特性 | 状态 |
|------|------|
| 内存限制 | ✅ 已实现 (maxHistorySize) |
| 基于时间保留 | ❌ 缺失 |
| 持久化存储 | ❌ 缺失 |
| 自动归档 | ❌ 缺失 |

**❌ 结论**: 数据保留策略不完善，仅依赖内存数组大小限制。

---

## 4. 归档功能

### 4.1 当前状态

| 功能 | 状态 |
|------|------|
| 导出 CSV | ❌ 缺失 |
| 导出 JSON | ❌ 缺失 |
| 持久化存储 | ❌ 缺失 |
| 定期归档任务 | ❌ 缺失 |
| 归档查询 API | ❌ 缺失 |

### 4.2 缺失的 API

- ❌ 没有 `/api/alerts/history/export` 端点
- ❌ 没有数据库表定义
- ❌ 没有后台归档任务

---

## 5. 改进建议

### 5.1 高优先级

1. **实现持久化存储**
   - 使用 SQLite/PostgreSQL 存储告警历史
   - 创建 `alerts` 和 `alert_history` 表
   - 实现 `saveAlert()` / `loadAlerts()` 方法

2. **添加时间基础保留策略**
   ```typescript
   interface RetentionPolicy {
     keepDays: number        // 保留天数
     archiveAfterDays: number // 归档天数
     maxStorageSize: number  // 最大存储大小 (MB)
   }
   ```

3. **添加导出功能**
   - `/api/alerts/export?format=csv&from=...&to=...`
   - `/api/alerts/export?format=json`

### 5.2 中优先级

4. **增强统计 API**
   - 添加 MTTR (Mean Time To Resolve) 计算
   - 添加告警趋势分析
   - 添加同比/环比统计

5. **添加归档 API**
   - `POST /api/alerts/archive` - 手动触发归档
   - `GET /api/alerts/archived` - 查询归档数据
   - `DELETE /api/alerts/cleanup` - 清理过期数据

6. **实现自动归档任务**
   ```typescript
   // 每日凌晨 3 点执行归档
   cron.schedule('0 3 * * *', async () => {
     await archiveOldAlerts()
     await cleanupExpiredData()
   })
   ```

### 5.3 低优先级

7. **添加更多统计维度**
   - 按小时/天的告警分布
   - 告警响应时间分布
   - 告警解决率趋势

8. **添加告警趋势预测**
   - 基于历史数据的趋势分析
   - 异常检测

---

## 6. 总结

| 项目 | 状态 | 评分 |
|------|------|------|
| AlertHistory 数据结构 | ✅ 完善 | 9/10 |
| 统计 API | ⚠️ 基本完善 | 7/10 |
| 数据保留策略 | ❌ 不完善 | 3/10 |
| 归档功能 | ❌ 缺失 | 1/10 |

**总体评估**: 告警历史记录的数据结构设计良好，统计 API 功能基本完善，但缺少持久化存储和归档功能，无法满足长期数据管理和合规要求。

---

*报告生成工具: Executor 子代理*
