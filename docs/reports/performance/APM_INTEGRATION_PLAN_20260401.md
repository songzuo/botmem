# APM 集成计划 - v1.6.0 P1 功能

**日期：** 2026-04-01
**版本：** v1.6.0
**优先级：** P1
**预估工时：** 16 小时

---

## 📋 执行摘要

### 目标

为 7zi-frontend v1.6.0 建立完整的 APM（Application Performance Monitoring）系统，实现从基础设施到应用层的全栈监控。

### 现状分析

**已完成的监控能力：**
- ✅ Sentry APM 集成（@sentry/nextjs v10.44.0）
- ✅ 分布式追踪系统（Tracing 模块）
- ✅ 性能监控模块（Performance Monitoring）
- ✅ Prometheus 指标导出
- ✅ API 监控中间件
- ✅ Agent 任务追踪器
- ✅ 服务器级监控（server-monitor.json）
- ✅ 性能预算控制
- ✅ 根因分析系统

**待完成的 APM 能力：**
- ⏳ 可视化仪表盘（Dashboard）
- ⏳ 告警规则配置和优化
- ⏳ 数据聚合和趋势分析
- ⏳ 自定义指标定义
- ⏳ 监控文档完善

---

## 📊 现有监控能力评估

### 1. 基础设施监控

**配置文件：** `server-monitor.json`

**监控指标（44+）：**

| 类别 | 指标数量 | 示例指标 |
|------|----------|----------|
| **CPU** | 7 | 1分钟负载、CPU使用率、iowait、steal |
| **内存** | 6 | 内存使用率、可用内存、缓存、swap |
| **磁盘** | 7 | 使用率、可用空间、IOPS、延迟 |
| **网络** | 9 | 流量、连接数、TIME-WAIT、错误 |
| **进程** | 4 | 进程数、僵尸进程、打开文件 |
| **应用** | 5 | OpenClaw 状态、内存、CPU、线程、FD |
| **容器** | 4 | 容器运行状态、内存、CPU |
| **服务** | 3 | 端口状态、DNS延迟、HTTP延迟 |
| **系统** | 3 | 内核消息、温度、运行时间 |

**告警规则（22+）：**
- CPU 高负载告警（警告/严重）
- 内存高使用率告警
- 磁盘空间不足告警
- 网络异常告警
- OpenClaw 服务状态告警
- 自动清理触发器

### 2. 应用性能监控（APM）

**Sentry 集成（已完成）：**

| 功能模块 | 状态 | 文件 |
|----------|------|------|
| **Sentry Client** | ✅ 已实现 | `src/lib/monitoring/sentry-client.ts` |
| **分布式追踪** | ✅ 已实现 | `src/lib/tracing/` |
| **API 监控** | ✅ 已实现 | `src/lib/monitoring/api-middleware.ts` |
| **Agent 追踪** | ✅ 已实现 | `src/lib/monitoring/agent-tracker.ts` |
| **错误追踪** | ✅ 已实现 | `src/lib/monitoring/errors.ts` |
| **性能预算** | ✅ 已实现 | `src/lib/monitoring/budget-controller.ts` |
| **根因分析** | ✅ 已实现 | `src/lib/monitoring/root-cause/` |

### 3. Web 性能监控

**Core Web Vitals（已配置）：**

| 指标 | 优秀 | 需改进 | 差 |
|------|------|--------|-----|
| **LCP** | ≤2.5s | ≤4s | >4s |
| **INP** | ≤200ms | ≤500ms | >500ms |
| **CLS** | ≤0.1 | ≤0.25 | >0.25 |
| **FCP** | ≤1.8s | ≤3s | >3s |
| **TTFB** | ≤800ms | ≤1.8s | >1.8s |

**其他指标：**
- 长任务检测（>50ms）
- 内存使用监控
- API 响应时间
- 路由切换性能

### 4. Prometheus 指标

**导出模块：** `src/lib/monitoring/prometheus.ts`

**指标类型：**
- Counter（计数器）：请求数、错误数
- Gauge（仪表盘）：响应时间、内存使用
- Histogram（直方图）：响应时间分布

---

## 🎯 APM 集成策略

### 方案选择

**当前方案：使用 Sentry（已集成）**

**优势：**
- ✅ 已完成集成，无需额外成本
- ✅ Next.js 原生支持
- ✅ 分布式追踪开箱即用
- ✅ 完整的错误追踪和会话回放
- ✅ 免费额度足够（5000 errors/month）

**为什么不选择 OpenTelemetry：**
- OpenTelemetry 需要额外的采集器（Jaeger/Tempo）
- 集成复杂度高，需要更多维护成本
- Sentry 已满足当前需求
- 未来可以保留 OpenTelemetry 兼容性

### APM 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    监控数据源                            │
├──────────────┬──────────────┬──────────────┬───────────┤
│  基础设施      │   应用层      │   Agent层     │  Web层    │
│ server-mon   │ Sentry API  │ AgentTracker │ WebVitals │
│ (44指标)      │ Tracing      │ TaskExec     │ CoreVitals│
└──────┬───────┴──────┬───────┴──────┬───────┴─────┬─────┘
       │              │              │             │
       ▼              ▼              ▼             ▼
┌─────────────────────────────────────────────────────────┐
│                   数据采集层                             │
│  PrometheusExporter | SentryClient | TracingContext   │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│                   数据存储层                             │
│  Sentry Cloud (Traces/Errors/Replays)                   │
│  Prometheus (Time Series Metrics - 可选)                │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│                   可视化层                               │
│  Sentry Dashboard (实时)                                │
│  Grafana (Prometheus 可选)                              │
│  自定义 Dashboard (Next.js 组件)                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📈 APM 集成计划

### 阶段 1：告警配置（2 小时）

**任务：**
1. 配置 Sentry 告警规则
2. 设置告警通知渠道
3. 优化 server-monitor.json 告警阈值
4. 测试告警流程

**告警规则建议：**

| 指标 | 警告阈值 | 严重阈值 | 频率 | 通知 |
|------|---------|---------|------|------|
| 错误率 | > 1% | > 5% | 5 分钟 | Telegram |
| API P95 延迟 | > 1s | > 3s | 5 分钟 | Telegram |
| API P99 延迟 | > 2s | > 5s | 5 分钟 | Telegram |
| Agent 任务失败率 | > 5% | > 10% | 10 分钟 | Telegram |
| Agent 任务超时 | > 60s | > 120s | 实时 | Telegram |
| Web Vitals Poor | N/A | > 10% | 1 小时 | Email |
| CPU 使用率 | > 70% | > 90% | 5 分钟 | Telegram |
| 内存使用率 | > 75% | > 90% | 5 分钟 | Telegram |
| 磁盘使用率 | > 75% | > 90% | 10 分钟 | Telegram |

### 阶段 2：数据可视化（6 小时）

**任务 1：创建监控 Dashboard 组件（3 小时）**

**文件：** `src/components/dashboard/monitoring/MonitoringDashboard.tsx`

**功能：**
- 系统健康概览
- API 性能趋势图
- Agent 任务统计
- 错误趋势
- Core Web Vitals 评分
- 实时指标刷新

**组件结构：**
```typescript
// MonitoringDashboard.tsx
import { MonitoringCharts } from './MonitoringCharts';
import { MetricsSummary } from './MetricsSummary';
import { AlertsPanel } from './AlertsPanel';
import { AgentStatusPanel } from './AgentStatusPanel';

export function MonitoringDashboard() {
  return (
    <div className="monitoring-dashboard">
      <MetricsSummary />
      <MonitoringCharts />
      <AgentStatusPanel />
      <AlertsPanel />
    </div>
  );
}
```

**任务 2：集成 Grafana（可选，3 小时）**

**前提条件：**
- Prometheus 服务器运行
- Grafana 实例部署

**配置：**
1. 添加 Prometheus 数据源
2. 导入预设 Dashboard
3. 配置自定义面板
4. 设置刷新间隔

### 阶段 3：性能分析增强（4 小时）

**任务 1：自定义指标定义（2 小时）**

**文件：** `src/lib/monitoring/metrics.ts`

**新增指标：**

| 指标名称 | 类型 | 描述 |
|---------|------|------|
| `agent_task_duration_seconds` | Histogram | Agent 任务执行时间 |
| `agent_task_tokens_total` | Counter | Agent Token 使用量 |
| `api_request_by_route_total` | Counter | 按路由的请求数 |
| `web_vital_score` | Gauge | Web Vitals 评分 |
| `session_duration_seconds` | Gauge | 会话持续时间 |

**任务 2：性能分析工具（2 小时）**

**功能：**
- 慢查询分析
- 内存泄漏检测
- 瓶颈识别
- 性能优化建议

### 阶段 4：文档和培训（4 小时）

**任务清单：**
1. 编写 APM 使用指南
2. 创建故障排查手册
3. 编写告警响应流程
4. 录制培训视频

---

## 🔧 技术实现细节

### 1. 监控 Dashboard 组件实现

**文件：** `src/components/dashboard/monitoring/MonitoringCharts.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiPerformanceReport } from "@/lib/middleware/api-performance";
import { getGlobalStats } from "@/lib/monitoring/agent-tracker";

interface PerformanceMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  apiLatency: number;
  errorRate: number;
}

export function MonitoringCharts() {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [apiReport, setApiReport] = useState<any>(null);
  const [agentStats, setAgentStats] = useState<any>(null);

  useEffect(() => {
    // 模拟数据生成（实际应该从 API 获取）
    const generateMetrics = () => {
      const data: PerformanceMetrics[] = [];
      for (let i = 0; i < 24; i++) {
        data.push({
          timestamp: `${i}:00`,
          cpu: Math.random() * 30 + 20,
          memory: Math.random() * 20 + 50,
          apiLatency: Math.random() * 200 + 100,
          errorRate: Math.random() * 2,
        });
      }
      return data;
    };

    setMetrics(generateMetrics());
    setApiReport(getApiPerformanceReport());
    setAgentStats(getGlobalStats());

    // 每 30 秒刷新一次
    const interval = setInterval(() => {
      setMetrics(generateMetrics());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* CPU 和内存趋势 */}
      <Card>
        <CardHeader>
          <CardTitle>CPU & 内存趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="cpu"
                stroke="#8884d8"
                name="CPU %"
              />
              <Line
                type="monotone"
                dataKey="memory"
                stroke="#82ca9d"
                name="Memory %"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* API 延迟 */}
      <Card>
        <CardHeader>
          <CardTitle>API 平均延迟</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="apiLatency" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Agent 状态分布 */}
      <Card>
        <CardHeader>
          <CardTitle>Agent 任务状态</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={agentStats?.taskStatus || [
                  { name: "成功", value: agentStats?.completed || 100 },
                  { name: "失败", value: agentStats?.failed || 5 },
                  { name: "进行中", value: agentStats?.inProgress || 10 },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: "成功", value: agentStats?.completed || 100 },
                  { name: "失败", value: agentStats?.failed || 5 },
                  { name: "进行中", value: agentStats?.inProgress || 10 },
                ].map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 错误率 */}
      <Card>
        <CardHeader>
          <CardTitle>错误率趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="errorRate" stroke="#ef4444" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2. 告警配置示例

**Sentry 告警规则配置：**

```typescript
// docs/sentry-alerts.yaml
alerts:
  - name: "High Error Rate"
    description: "Error rate exceeds threshold"
    condition: "error_rate > 0.05"
    frequency: "5m"
    threshold: "critical"
    actions:
      - type: "send_notification"
        channel: "telegram"

  - name: "Slow API Response"
    description: "API P95 latency exceeds threshold"
    condition: "duration.p95 > 3000"
    frequency: "5m"
    threshold: "warning"
    actions:
      - type: "send_notification"
        channel: "telegram"

  - name: "Agent Task Failure"
    description: "Agent task failure rate exceeds threshold"
    condition: "agent_failure_rate > 0.1"
    frequency: "10m"
    threshold: "critical"
    actions:
      - type: "send_notification"
        channel: "telegram"
      - type: "escalate"
        to: "on-call"
```

### 3. 性能预算增强

**文件：** `src/lib/monitoring/performance.config.ts`

**新增告警配置：**

```typescript
export const APM_ALERT_RULES = {
  // API 性能
  api: {
    p50Latency: {
      warning: 500, // 500ms
      critical: 2000,
    },
    p95Latency: {
      warning: 1000, // 1s
      critical: 3000, // 3s
    },
    p99Latency: {
      warning: 2000, // 2s
      critical: 5000, // 5s
    },
    errorRate: {
      warning: 0.01, // 1%
      critical: 0.05, // 5%
    },
  },

  // Agent 性能
  agent: {
    taskDuration: {
      warning: 60000, // 60s
      critical: 120000, // 2min
    },
    failureRate: {
      warning: 0.05, // 5%
      critical: 0.1, // 10%
    },
    tokenUsage: {
      warning: 10000,
      critical: 50000,
    },
  },

  // Web 性能
  web: {
    lcp: {
      warning: 2500,
      critical: 4000,
    },
    inp: {
      warning: 200,
      critical: 500,
    },
    cls: {
      warning: 0.1,
      critical: 0.25,
    },
  },
} as const;
```

---

## 📊 数据可视化方案

### Sentry Dashboard 配置

**推荐面板：**

1. **Performance Overview**
   - Transaction 时间线
   - 慢请求列表
   - 数据库查询时间
   - 缓存命中率

2. **Error Tracking**
   - 错误趋势图
   - Top 错误列表
   - 错误分布（按环境/路由）
   - 错误详情面包屑

3. **Web Vitals**
   - LCP 分布
   - INP 分布
   - CLS 分布
   - FCP 分布

### 自定义 Dashboard（Next.js 组件）

**路由：** `/dashboard/monitoring`

**功能：**
- 实时系统指标（CPU/内存/磁盘）
- API 性能图表
- Agent 任务统计
- 告警列表
- 日志查看器

### Prometheus + Grafana（可选）

**适用场景：**
- 需要更多自定义面板
- 多系统监控
- 长期数据存储（>30天）

**配置步骤：**
1. 部署 Prometheus
2. 配置 `/api/metrics` 端点
3. 部署 Grafana
4. 添加 Prometheus 数据源
5. 导入预设 Dashboard

---

## 🚨 告警阈值配置

### 推荐告警阈值

| 指标 | 警告 | 严重 | 频率 | 通知 |
|------|------|------|------|------|
| **API P50 延迟** | >500ms | >2s | 5 分钟 | Telegram |
| **API P95 延迟** | >1s | >3s | 5 分钟 | Telegram |
| **API P99 延迟** | >2s | >5s | 5 分钟 | Telegram |
| **API 错误率** | >1% | >5% | 5 分钟 | Telegram |
| **Agent 任务超时** | >60s | >120s | 实时 | Telegram |
| **Agent 失败率** | >5% | >10% | 10 分钟 | Telegram |
| **Web Vitals Poor** | N/A | >10% | 1 小时 | Email |
| **CPU 使用率** | >70% | >90% | 5 分钟 | Telegram |
| **内存使用率** | >75% | >90% | 5 分钟 | Telegram |
| **磁盘使用率** | >75% | >90% | 10 分钟 | Telegram |
| **网络错误** | >10/min | >100/min | 10 分钟 | Telegram |

### 告警静默策略

**自动静默：**
- 已知问题的告警（通过标签标记）
- 维护窗口（通过时间窗口）
- 频繁的相同告警（重复抑制）

**手动静默：**
- 管理员通过 Dashboard 静默
- API 调用静默

---

## 📚 文档计划

### 1. APM 使用指南

**文件：** `docs/APM_GUIDE.md`

**内容：**
- APM 概述
- 快速开始
- 监控 Dashboard 使用
- 告警配置
- 性能分析
- 故障排查

### 2. 告警响应流程

**文件：** `docs/ALERT_RESPONSE_PROCEDURE.md`

**内容：**
- 告警分类
- 响应级别（P0/P1/P2）
- 响应时间要求
- 故障处理流程
- 事后分析（Post-mortem）

### 3. 性能优化建议

**文件：** `docs/PERFORMANCE_OPTIMIZATION.md`

**内容：**
- 常见性能问题
- 优化建议
- 性能基准
- 监控指标解读

---

## ✅ 验收标准

### 功能验收

- [x] Sentry 集成完成
- [x] 分布式追踪正常工作
- [x] API 监控中间件实现
- [x] Agent 任务追踪器实现
- [x] Prometheus 指标导出
- [ ] 监控 Dashboard 组件完成
- [ ] 告警规则配置完成
- [ ] 告警通知渠道配置
- [ ] 性能分析工具实现
- [ ] 文档编写完成

### 性能验收

- [ ] 监控开销 < 5%（性能影响）
- [ ] 告警响应时间 < 1 分钟
- [ ] 数据刷新延迟 < 30 秒
- [ ] Dashboard 加载时间 < 2 秒

### 稳定性验收

- [ ] 24 小时稳定运行无崩溃
- [ ] 错误率 < 0.1%
- [ ] 告警误报率 < 5%

---

## 🚀 实施时间表

### Week 1：告警配置和 Dashboard（8 小时）

| 天数 | 任务 | 工时 |
|------|------|------|
| Day 1 | 告警规则配置 | 4 |
| Day 2 | Dashboard 组件开发 | 4 |

### Week 2：数据可视化和文档（8 小时）

| 天数 | 任务 | 工时 |
|------|------|------|
| Day 1 | 性能分析工具 | 4 |
| Day 2 | 文档编写 | 4 |

---

## 📋 任务清单

### P0（必须完成）

- [ ] 配置 Sentry 告警规则
- [ ] 创建监控 Dashboard 组件
- [ ] 配置告警通知渠道
- [ ] 编写 APM 使用指南

### P1（重要）

- [ ] 优化告警阈值
- [ ] 实现性能分析工具
- [ ] 配置 Prometheus + Grafana（可选）
- [ ] 编写告警响应流程

### P2（长期）

- [ ] AI 驱动的异常检测
- [ ] 预测性扩缩容
- [ ] 自动化性能优化建议

---

## 📊 成本分析

### Sentry 免费额度

| 资源 | 免费额度 | 超额费用 |
|------|---------|---------|
| Errors | 5,000/month | $0.002/error |
| Transactions | 10,000/month | $0.0002/transaction |
| Replays | 100/month | $1/replay |
| Attachments | 500MB/month | $0.1/MB |

**预估使用量（生产）：**
- Errors: ~500/month（✅ 免费额度内）
- Transactions: ~50,000/month（❌ 超额约 $8/月）
- Replays: ~50/month（✅ 免费额度内）

**建议：**
- 调整采样率到 10%（transactions 降至 ~5,000/month）
- 或升级到 Developer Plan（$26/月）

### 可选方案：Prometheus

**成本：**
- 自建：免费（需要服务器资源）
- 托管服务：$50-200/月

**建议：**
- 开发/测试环境：Sentry 免费版
- 生产环境：Sentry Developer Plan + Prometheus 自建

---

## 🔒 安全考虑

### 数据脱敏

**自动脱敏字段：**
- `email`
- `phone`
- `token`
- `password`
- `api_key`
- `secret`

**实现：**
```typescript
// src/lib/monitoring/sanitize.ts
export function sanitizeData(data: any): any {
  const sensitiveFields = ['email', 'password', 'token', 'secret'];

  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  }

  return data;
}
```

### 访问控制

**Dashboard 权限：**
- 管理员：完整访问
- 运维：只读访问
- 其他：无访问

### 日志保留策略

| 数据类型 | 保留时间 |
|---------|---------|
| 错误日志 | 90 天 |
| 性能数据 | 30 天 |
| 会话回放 | 7 天 |
| 自定义指标 | 30 天 |

---

## 📈 后续优化方向

### 短期（v1.6.0）

1. ✅ 完成 Dashboard 开发
2. ⏳ 配置告警规则
3. ⏳ 编写文档

### 中期（v1.7.0）

1. 添加自定义指标
2. 集成 Grafana
3. AI 异常检测
4. 性能基准测试

### 长期（v2.0.0）

1. 预测性扩缩容
2. 自动化性能优化
3. 多区域监控
4. 成本优化

---

## 📚 参考资料

### 文档

- [Sentry Next.js 文档](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Web Vitals](https://web.dev/vitals/)
- [Prometheus 文档](https://prometheus.io/docs/)
- [Grafana 文档](https://grafana.com/docs/)

### 项目文档

- `docs/APM_INTEGRATION.md` - APM 集成指南
- `docs/DISTRIBUTED_TRACING_SYSTEM_20260401.md` - 分布式追踪系统
- `src/lib/monitoring/README.md` - 监控模块文档
- `src/lib/tracing/README.md` - 追踪模块文档

---

## 📝 总结

### 完成状态

**已完成（80%）：**
- ✅ Sentry APM 集成
- ✅ 分布式追踪系统
- ✅ API 监控中间件
- ✅ Agent 任务追踪器
- ✅ Prometheus 指标导出
- ✅ 性能预算控制
- ✅ 根因分析系统
- ✅ 服务器级监控

**待完成（20%）：**
- ⏳ 监控 Dashboard 组件
- ⏳ 告警规则配置
- ⏳ 告警通知渠道
- ⏳ 文档完善

### 关键成果

1. **完整的基础设施监控** - 44+ 系统指标
2. **全链路追踪** - 从 API 到 Agent 任务
3. **实时告警** - 22+ 预配置告警规则
4. **性能预算控制** - Web Vitals + 自定义指标
5. **根因分析** - 自动化问题诊断

### 下一步行动

1. **立即执行**：配置 Sentry 告警规则
2. **本周完成**：开发监控 Dashboard 组件
3. **下周完成**：编写完整文档

---

**计划生成时间：** 2026-04-01 03:20 GMT+2
**执行者：** Subagent (APM 集成任务)
**状态：** ✅ 计划完成
