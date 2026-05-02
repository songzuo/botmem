# API Rate Limiting & Security Dashboard - Technical Report
# API 限流与安全仪表板 - 技术报告

**Version:** 1.14.0
**Date:** 2026-04-05
**Author:** 🛡️ 系统管理员 子代理
**Status:** Design Phase

---

## Executive Summary | 执行摘要

本文档详细描述了 API 限流与安全仪表板的设计方案，包括实时监控、规则配置、攻击检测和黑白名单管理等功能。该仪表板将集成到现有的 Next.js 应用中，提供可视化的管理界面和 RESTful API 端点。

---

## Table of Contents | 目录

1. [Current State Analysis](#1-current-state-analysis-现状分析)
2. [System Architecture](#2-system-architecture-系统架构)
3. [Data Model Design](#3-data-model-design-数据模型设计)
4. [API Endpoints](#4-api-endpoints-api端点设计)
5. [Dashboard UI Design](#5-dashboard-ui-design-仪表板界面设计)
6. [Security Considerations](#6-security-considerations-安全考虑)
7. [Implementation Plan](#7-implementation-plan-实施计划)
8. [Testing Strategy](#8-testing-strategy-测试策略)

---

## 1. Current State Analysis | 现状分析

### 1.1 Existing Rate Limiting Implementation | 现有限流实现

项目已实现完整的速率限制系统，位于 `src/lib/rate-limit/`：

**核心组件：**

- **算法实现：**
  - `sliding-window.ts` - 滑动窗口算法
  - `token-bucket.ts` - 令牌桶算法
  - `distributed-rate-limiter.ts` - 分布式限流器

- **中间件：**
  - `middleware.ts` - 基础中间件
  - `middleware-enhanced.ts` - 增强中间件（支持自定义响应）

- **配置管理：**
  - `config-manager.ts` - 配置管理器（支持预设和路由配置）
  - `config.ts` - 配置定义

- **存储层：**
  - `memory-store.ts` - 内存存储
  - `redis-adapter.ts` - Redis 适配器
  - `storage-factory.ts` - 存储工厂

- **状态监控：**
  - `status.ts` - 状态查询接口
  - `event-logger.ts` - 事件日志记录

**预设配置：**

```typescript
PresetConfigs = {
  strict: { windowMs: 60000, maxRequests: 5, algorithm: 'sliding-window' },
  moderate: { windowMs: 60000, maxRequests: 30, algorithm: 'sliding-window' },
  lenient: { windowMs: 60000, maxRequests: 100, algorithm: 'token-bucket' },
  veryLenient: { windowMs: 60000, maxRequests: 300, algorithm: 'token-bucket' },
  hourly: { windowMs: 3600000, maxRequests: 1000, algorithm: 'sliding-window' },
  daily: { windowMs: 86400000, maxRequests: 10000, algorithm: 'sliding-window' }
}
```

**路由配置示例：**

```typescript
CommonRouteConfigs = [
  { pattern: '/api/auth/login', config: PresetConfigs.strict },
  { pattern: '/api/payments/', config: PresetConfigs.strict },
  { pattern: '/api/export/', config: PresetConfigs.hourly },
  { pattern: '/api/public/', config: PresetConfigs.daily }
]
```

### 1.2 Gaps and Requirements | 缺失和需求

**当前缺失的功能：**

1. **可视化监控界面** - 无法实时查看限流状态
2. **规则配置 UI** - 需要通过代码修改配置
3. **攻击检测** - 缺少异常流量检测
4. **告警系统** - 没有实时告警机制
5. **黑白名单管理** - 缺少 IP/用户级别的访问控制
6. **历史数据** - 无法查看历史限流事件
7. **统计分析** - 缺少流量趋势分析

**需求优先级：**

| 功能 | 优先级 | 复杂度 |
|------|--------|--------|
| 实时监控 | P0 | 中 |
| 规则配置 UI | P0 | 中 |
| 黑白名单管理 | P1 | 低 |
| 攻击检测 | P1 | 高 |
| 告警系统 | P2 | 中 |
| 历史数据 | P2 | 中 |
| 统计分析 | P3 | 高 |

---

## 2. System Architecture | 系统架构

### 2.1 Overall Architecture | 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Dashboard UI (Next.js)                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Real-time    │ │ Rule Config  │ │ Security     │        │
│  │ Monitoring   │ │ Management   │ │ Management   │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Layer (REST)                          │
│  /api/admin/rate-limit/*                                    │
│  /api/admin/security/*                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Rate Limit   │ │ Security     │ │ Analytics    │        │
│  │ Manager      │ │ Manager      │ │ Engine       │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ SQLite       │ │ Redis        │ │ Memory Store │        │
│  │ (Persistent) │ │ (Cache)      │ │ (Real-time)  │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Component Design | 组件设计

#### 2.2.1 Rate Limit Manager | 限流管理器

**职责：**
- 管理限流规则配置
- 提供实时状态查询
- 处理规则变更

**接口：**
```typescript
interface RateLimitManager {
  // 规则管理
  getRules(): Promise<RateLimitRule[]>
  getRule(id: string): Promise<RateLimitRule | null>
  createRule(rule: RateLimitRule): Promise<RateLimitRule>
  updateRule(id: string, rule: Partial<RateLimitRule>): Promise<RateLimitRule>
  deleteRule(id: string): Promise<void>

  // 状态查询
  getStatus(identifier: string, path: string): Promise<RateLimitStatus>
  getTopViolators(limit: number): Promise<Violator[]>
  getStatistics(timeRange: TimeRange): Promise<RateLimitStatistics>

  // 规则应用
  applyRule(rule: RateLimitRule): Promise<void>
  removeRule(id: string): Promise<void>
}
```

#### 2.2.2 Security Manager | 安全管理器

**职责：**
- 管理黑白名单
- 检测攻击行为
- 生成安全告警

**接口：**
```typescript
interface SecurityManager {
  // 黑白名单管理
  getBlacklist(): Promise<BlacklistEntry[]>
  getWhitelist(): Promise<WhitelistEntry[]>
  addToBlacklist(entry: BlacklistEntry): Promise<void>
  addToWhitelist(entry: WhitelistEntry): Promise<void>
  removeFromBlacklist(id: string): Promise<void>
  removeFromWhitelist(id: string): Promise<void>

  // 攻击检测
  detectAttacks(): Promise<AttackEvent[]>
  getAttackHistory(timeRange: TimeRange): Promise<AttackEvent[]>

  // 告警管理
  getAlerts(): Promise<SecurityAlert[]>
  createAlert(alert: SecurityAlert): Promise<void>
  dismissAlert(id: string): Promise<void>
}
```

#### 2.2.3 Analytics Engine | 分析引擎

**职责：**
- 收集和分析流量数据
- 生成统计报告
- 检测异常模式

**接口：**
```typescript
interface AnalyticsEngine {
  // 数据收集
  recordRequest(request: RequestMetrics): Promise<void>
  recordViolation(violation: ViolationEvent): Promise<void>

  // 统计分析
  getTrafficStats(timeRange: TimeRange): Promise<TrafficStatistics>
  getViolationStats(timeRange: TimeRange): Promise<ViolationStatistics>
  getTrendAnalysis(metric: string, timeRange: TimeRange): Promise<TrendData[]>

  // 异常检测
  detectAnomalies(): Promise<Anomaly[]>
}
```

---

## 3. Data Model Design | 数据模型设计

### 3.1 Database Schema | 数据库架构

使用 SQLite 作为持久化存储，创建以下表：

#### 3.1.1 Rate Limit Rules Table | 限流规则表

```sql
CREATE TABLE rate_limit_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  pattern TEXT NOT NULL,  -- 路由模式
  algorithm TEXT NOT NULL CHECK(algorithm IN ('sliding-window', 'token-bucket')),
  window_ms INTEGER NOT NULL,
  max_requests INTEGER NOT NULL,
  key_type TEXT NOT NULL CHECK(key_type IN ('ip', 'user', 'api-key', 'custom')),
  priority INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_rate_limit_rules_pattern ON rate_limit_rules(pattern);
CREATE INDEX idx_rate_limit_rules_enabled ON rate_limit_rules(enabled);
```

#### 3.1.2 Blacklist Table | 黑名单表

```sql
CREATE TABLE blacklist (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('ip', 'user-id', 'api-key', 'email')),
  value TEXT NOT NULL,
  reason TEXT,
  expires_at INTEGER,  -- NULL 表示永久
  created_by TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_blacklist_type ON blacklist(type);
CREATE INDEX idx_blacklist_value ON blacklist(value);
CREATE INDEX idx_blacklist_expires ON blacklist(expires_at);
```

#### 3.1.3 Whitelist Table | 白名单表

```sql
CREATE TABLE whitelist (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('ip', 'user-id', 'api-key', 'email')),
  value TEXT NOT NULL,
  description TEXT,
  created_by TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_whitelist_type ON whitelist(type);
CREATE INDEX idx_whitelist_value ON whitelist(value);
```

#### 3.1.4 Rate Limit Events Table | 限流事件表

```sql
CREATE TABLE rate_limit_events (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  path TEXT NOT NULL,
  rule_id TEXT,
  allowed BOOLEAN NOT NULL,
  remaining INTEGER,
  limit INTEGER,
  algorithm TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  metadata TEXT  -- JSON 格式的额外信息
);

CREATE INDEX idx_rate_limit_events_identifier ON rate_limit_events(identifier);
CREATE INDEX idx_rate_limit_events_path ON rate_limit_events(path);
CREATE INDEX idx_rate_limit_events_timestamp ON rate_limit_events(timestamp);
CREATE INDEX idx_rate_limit_events_allowed ON rate_limit_events(allowed);
```

#### 3.1.5 Attack Events Table | 攻击事件表

```sql
CREATE TABLE attack_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('ddos', 'brute-force', 'sql-injection', 'xss', 'other')),
  identifier TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  evidence TEXT,  -- JSON 格式的证据
  detected_at INTEGER NOT NULL,
  resolved BOOLEAN DEFAULT 0,
  resolved_at INTEGER,
  resolved_by TEXT
);

CREATE INDEX idx_attack_events_type ON attack_events(type);
CREATE INDEX idx_attack_events_identifier ON attack_events(identifier);
CREATE INDEX idx_attack_events_severity ON attack_events(severity);
CREATE INDEX idx_attack_events_detected_at ON attack_events(detected_at);
```

#### 3.1.6 Security Alerts Table | 安全告警表

```sql
CREATE TABLE security_alerts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('info', 'warning', 'error', 'critical')),
  title TEXT NOT NULL,
  message TEXT,
  metadata TEXT,  -- JSON 格式的额外信息
  dismissed BOOLEAN DEFAULT 0,
  dismissed_at INTEGER,
  dismissed_by TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_security_alerts_type ON security_alerts(type);
CREATE INDEX idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX idx_security_alerts_dismissed ON security_alerts(dismissed);
CREATE INDEX idx_security_alerts_created_at ON security_alerts(created_at);
```

### 3.2 TypeScript Types | TypeScript 类型定义

```typescript
// ============================================================================
// Rate Limit Rule Types
// ============================================================================

export interface RateLimitRule {
  id: string
  name: string
  description?: string
  pattern: string
  algorithm: 'sliding-window' | 'token-bucket'
  windowMs: number
  maxRequests: number
  keyType: 'ip' | 'user' | 'api-key' | 'custom'
  priority: number
  enabled: boolean
  createdAt: number
  updatedAt: number
}

export interface CreateRateLimitRuleDTO {
  name: string
  description?: string
  pattern: string
  algorithm: 'sliding-window' | 'token-bucket'
  windowMs: number
  maxRequests: number
  keyType: 'ip' | 'user' | 'api-key' | 'custom'
  priority?: number
  enabled?: boolean
}

export interface UpdateRateLimitRuleDTO {
  name?: string
  description?: string
  pattern?: string
  algorithm?: 'sliding-window' | 'token-bucket'
  windowMs?: number
  maxRequests?: number
  keyType?: 'ip' | 'user' | 'api-key' | 'custom'
  priority?: number
  enabled?: boolean
}

// ============================================================================
// Blacklist/Whitelist Types
// ============================================================================

export interface BlacklistEntry {
  id: string
  type: 'ip' | 'user-id' | 'api-key' | 'email'
  value: string
  reason?: string
  expiresAt?: number
  createdBy?: string
  createdAt: number
}

export interface WhitelistEntry {
  id: string
  type: 'ip' | 'user-id' | 'api-key' | 'email'
  value: string
  description?: string
  createdBy?: string
  createdAt: number
}

export interface CreateBlacklistEntryDTO {
  type: 'ip' | 'user-id' | 'api-key' | 'email'
  value: string
  reason?: string
  expiresAt?: number
}

export interface CreateWhitelistEntryDTO {
  type: 'ip' | 'user-id' | 'api-key' | 'email'
  value: string
  description?: string
}

// ============================================================================
// Rate Limit Event Types
// ============================================================================

export interface RateLimitEvent {
  id: string
  identifier: string
  path: string
  ruleId?: string
  allowed: boolean
  remaining: number
  limit: number
  algorithm: 'sliding-window' | 'token-bucket'
  timestamp: number
  metadata?: Record<string, unknown>
}

export interface RateLimitStatus {
  allowed: boolean
  remaining: number
  resetTime: number
  limit: number
  algorithm: 'sliding-window' | 'token-bucket'
  currentCount?: number
  tokensAvailable?: number
}

// ============================================================================
// Attack Event Types
// ============================================================================

export interface AttackEvent {
  id: string
  type: 'ddos' | 'brute-force' | 'sql-injection' | 'xss' | 'other'
  identifier: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description?: string
  evidence?: Record<string, unknown>
  detectedAt: number
  resolved: boolean
  resolvedAt?: number
  resolvedBy?: string
}

// ============================================================================
// Security Alert Types
// ============================================================================

export interface SecurityAlert {
  id: string
  type: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message?: string
  metadata?: Record<string, unknown>
  dismissed: boolean
  dismissedAt?: number
  dismissedBy?: string
  createdAt: number
}

// ============================================================================
// Statistics Types
// ============================================================================

export interface RateLimitStatistics {
  totalRequests: number
  allowedRequests: number
  blockedRequests: number
  blockRate: number
  topViolators: Violator[]
  topPaths: PathStats[]
  timeSeriesData: TimeSeriesDataPoint[]
}

export interface Violator {
  identifier: string
  violations: number
  lastViolation: number
  severity: 'low' | 'medium' | 'high'
}

export interface PathStats {
  path: string
  requests: number
  violations: number
  blockRate: number
}

export interface TrafficStatistics {
  totalRequests: number
  uniqueIdentifiers: number
  averageRequestsPerSecond: number
  peakRequestsPerSecond: number
  timeSeriesData: TimeSeriesDataPoint[]
}

export interface ViolationStatistics {
  totalViolations: number
  byType: Record<string, number>
  bySeverity: Record<string, number>
  timeSeriesData: TimeSeriesDataPoint[]
}

export interface TimeSeriesDataPoint {
  timestamp: number
  value: number
  label?: string
}

export interface TimeRange {
  start: number
  end: number
}

export interface TrendData {
  timestamp: number
  value: number
  trend: 'up' | 'down' | 'stable'
  changePercent?: number
}

export interface Anomaly {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high'
  description: string
  detectedAt: number
  metrics: Record<string, number>
  threshold: number
  actualValue: number
}
```

---

## 4. API Endpoints | API 端点设计

### 4.1 Rate Limit Management API | 限流管理 API

#### 4.1.1 Get All Rules | 获取所有规则

```
GET /api/admin/rate-limit/rules
```

**Query Parameters:**
- `enabled` (optional): Filter by enabled status
- `algorithm` (optional): Filter by algorithm type
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "rules": [
      {
        "id": "rule-001",
        "name": "API Login Limit",
        "description": "Limit login attempts",
        "pattern": "/api/auth/login",
        "algorithm": "sliding-window",
        "windowMs": 60000,
        "maxRequests": 5,
        "keyType": "ip",
        "priority": 10,
        "enabled": true,
        "createdAt": 1712284800000,
        "updatedAt": 1712284800000
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### 4.1.2 Get Single Rule | 获取单个规则

```
GET /api/admin/rate-limit/rules/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rule": { /* RateLimitRule */ }
  }
}
```

#### 4.1.3 Create Rule | 创建规则

```
POST /api/admin/rate-limit/rules
```

**Request Body:**
```json
{
  "name": "API Login Limit",
  "description": "Limit login attempts",
  "pattern": "/api/auth/login",
  "algorithm": "sliding-window",
  "windowMs": 60000,
  "maxRequests": 5,
  "keyType": "ip",
  "priority": 10,
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rule": { /* RateLimitRule */ }
  }
}
```

#### 4.1.4 Update Rule | 更新规则

```
PUT /api/admin/rate-limit/rules/:id
```

**Request Body:**
```json
{
  "enabled": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rule": { /* RateLimitRule */ }
  }
}
```

#### 4.1.5 Delete Rule | 删除规则

```
DELETE /api/admin/rate-limit/rules/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Rule deleted successfully"
}
```

#### 4.1.6 Get Rate Limit Status | 获取限流状态

```
GET /api/admin/rate-limit/status
```

**Query Parameters:**
- `identifier` (required): IP, user ID, or API key
- `path` (optional): API path

**Response:**
```json
{
  "success": true,
  "data": {
    "status": {
      "allowed": true,
      "remaining": 25,
      "resetTime": 1712285400000,
      "limit": 30,
      "algorithm": "sliding-window",
      "currentCount": 5
    }
  }
}
```

#### 4.1.7 Get Statistics | 获取统计数据

```
GET /api/admin/rate-limit/statistics
```

**Query Parameters:**
- `timeRange` (optional): Time range (e.g., "1h", "24h", "7d", "30d")
- `start` (optional): Start timestamp
- `end` (optional): End timestamp

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalRequests": 15000,
      "allowedRequests": 14250,
      "blockedRequests": 750,
      "blockRate": 0.05,
      "topViolators": [
        {
          "identifier": "192.168.1.100",
          "violations": 50,
          "lastViolation": 1712285400000,
          "severity": "high"
        }
      ],
      "topPaths": [
        {
          "path": "/api/auth/login",
          "requests": 5000,
          "violations": 500,
          "blockRate": 0.1
        }
      ],
      "timeSeriesData": [
        {
          "timestamp": 1712284800000,
          "value": 1000
        }
      ]
    }
  }
}
```

### 4.2 Security Management API | 安全管理 API

#### 4.2.1 Get Blacklist | 获取黑名单

```
GET /api/admin/security/blacklist
```

**Query Parameters:**
- `type` (optional): Filter by type
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": "bl-001",
        "type": "ip",
        "value": "192.168.1.100",
        "reason": "Brute force attack",
        "expiresAt": null,
        "createdBy": "admin",
        "createdAt": 1712284800000
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

#### 4.2.2 Add to Blacklist | 添加到黑名单

```
POST /api/admin/security/blacklist
```

**Request Body:**
```json
{
  "type": "ip",
  "value": "192.168.1.100",
  "reason": "Brute force attack",
  "expiresAt": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "entry": { /* BlacklistEntry */ }
  }
}
```

#### 4.2.3 Remove from Blacklist | 从黑名单移除

```
DELETE /api/admin/security/blacklist/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Entry removed from blacklist"
}
```

#### 4.2.4 Get Whitelist | 获取白名单

```
GET /api/admin/security/whitelist
```

**Response:**
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": "wl-001",
        "type": "ip",
        "value": "10.0.0.1",
        "description": "Internal server",
        "createdBy": "admin",
        "createdAt": 1712284800000
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

#### 4.2.5 Add to Whitelist | 添加到白名单

```
POST /api/admin/security/whitelist
```

**Request Body:**
```json
{
  "type": "ip",
  "value": "10.0.0.1",
  "description": "Internal server"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "entry": { /* WhitelistEntry */ }
  }
}
```

#### 4.2.6 Remove from Whitelist | 从白名单移除

```
DELETE /api/admin/security/whitelist/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Entry removed from whitelist"
}
```

#### 4.2.7 Get Attack Events | 获取攻击事件

```
GET /api/admin/security/attacks
```

**Query Parameters:**
- `type` (optional): Filter by attack type
- `severity` (optional): Filter by severity
- `resolved` (optional): Filter by resolved status
- `timeRange` (optional): Time range

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "atk-001",
        "type": "brute-force",
        "identifier": "192.168.1.100",
        "severity": "high",
        "description": "Multiple failed login attempts",
        "evidence": {
          "attempts": 100,
          "timeWindow": 300000
        },
        "detectedAt": 1712284800000,
        "resolved": false
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

#### 4.2.8 Get Security Alerts | 获取安全告警

```
GET /api/admin/security/alerts
```

**Query Parameters:**
- `severity` (optional): Filter by severity
- `dismissed` (optional): Filter by dismissed status

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alt-001",
        "type": "rate-limit-exceeded",
        "severity": "warning",
        "title": "High violation rate detected",
        "message": "IP 192.168.1.100 exceeded rate limit 50 times",
        "metadata": {
          "identifier": "192.168.1.100",
          "violations": 50
        },
        "dismissed": false,
        "createdAt": 1712284800000
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

#### 4.2.9 Dismiss Alert | 忽略告警

```
POST /api/admin/security/alerts/:id/dismiss
```

**Response:**
```json
{
  "success": true,
  "message": "Alert dismissed"
}
```

### 4.3 Analytics API | 分析 API

#### 4.3.1 Get Traffic Statistics | 获取流量统计

```
GET /api/admin/analytics/traffic
```

**Query Parameters:**
- `timeRange` (optional): Time range

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalRequests": 15000,
      "uniqueIdentifiers": 500,
      "averageRequestsPerSecond": 4.17,
      "peakRequestsPerSecond": 25,
      "timeSeriesData": [/* ... */]
    }
  }
}
```

#### 4.3.2 Get Violation Statistics | 获取违规统计

```
GET /api/admin/analytics/violations
```

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalViolations": 750,
      "byType": {
        "sliding-window": 500,
        "token-bucket": 250
      },
      "bySeverity": {
        "low": 500,
        "medium": 200,
        "high": 50
      },
      "timeSeriesData": [/* ... */]
    }
  }
}
```

#### 4.3.3 Get Trend Analysis | 获取趋势分析

```
GET /api/admin/analytics/trends/:metric
```

**Path Parameters:**
- `metric`: Metric name (e.g., "requests", "violations", "block-rate")

**Query Parameters:**
- `timeRange` (optional): Time range

**Response:**
```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "timestamp": 1712284800000,
        "value": 1000,
        "trend": "up",
        "changePercent": 15.5
      }
    ]
  }
}
```

#### 4.3.4 Get Anomalies | 获取异常

```
GET /api/admin/analytics/anomalies
```

**Response:**
```json
{
  "success": true,
  "data": {
    "anomalies": [
      {
        "id": "ano-001",
        "type": "traffic-spike",
        "severity": "high",
        "description": "Unusual traffic spike detected",
        "detectedAt": 1712284800000,
        "metrics": {
          "requestsPerSecond": 100
        },
        "threshold": 50,
        "actualValue": 100
      }
    ]
  }
}
```

---

## 5. Dashboard UI Design | 仪表板界面设计

### 5.1 Page Structure | 页面结构

```
/admin/rate-limit/
├── page.tsx                    # 主仪表板页面
├── rules/
│   ├── page.tsx               # 规则列表
│   ├── [id]/
│   │   ├── page.tsx           # 规则详情
│   │   └── edit/
│   │       └── page.tsx       # 编辑规则
│   └── new/
│       └── page.tsx           # 创建规则
├── security/
│   ├── page.tsx               # 安全概览
│   ├── blacklist/
│   │   ├── page.tsx           # 黑名单管理
│   │   └── new/
│   │       └── page.tsx       # 添加黑名单
│   └── whitelist/
│       ├── page.tsx           # 白名单管理
│       └── new/
│           └── page.tsx       # 添加白名单
├── analytics/
│   ├── page.tsx               # 分析概览
│   ├── traffic/
│   │   └── page.tsx           # 流量分析
│   ├── violations/
│   │   └── page.tsx           # 违规分析
│   └── trends/
│       └── page.tsx           # 趋势分析
└── alerts/
    └── page.tsx               # 告警中心
```

### 5.2 Main Dashboard Layout | 主仪表板布局

```tsx
// /admin/rate-limit/page.tsx

export default function RateLimitDashboard() {
  return (
    <div className="dashboard-container">
      {/* Header */}
      <DashboardHeader
        title="API Rate Limiting & Security"
        subtitle="Monitor and manage API rate limiting and security"
      />

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Requests"
          value={stats.totalRequests}
          change={stats.requestChange}
          icon={<ActivityIcon />}
        />
        <StatCard
          title="Blocked Requests"
          value={stats.blockedRequests}
          change={stats.blockChange}
          icon={<ShieldIcon />}
        />
        <StatCard
          title="Active Rules"
          value={stats.activeRules}
          icon={<RuleIcon />}
        />
        <StatCard
          title="Security Alerts"
          value={stats.alerts}
          severity={stats.alertSeverity}
          icon={<AlertIcon />}
        />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <TrafficChart data={trafficData} />
        <ViolationChart data={violationData} />
      </div>

      {/* Tables */}
      <div className="tables-grid">
        <TopViolatorsTable data={topViolators} />
        <RecentAlertsTable data={recentAlerts} />
      </div>
    </div>
  )
}
```

### 5.3 Rules Management UI | 规则管理界面

```tsx
// /admin/rate-limit/rules/page.tsx

export default function RulesListPage() {
  return (
    <div className="rules-container">
      <PageHeader
        title="Rate Limit Rules"
        actions={
          <Button href="/admin/rate-limit/rules/new">
            <PlusIcon /> Create Rule
          </Button>
        }
      />

      {/* Filters */}
      <FiltersBar>
        <Select label="Algorithm" options={['sliding-window', 'token-bucket']} />
        <Select label="Status" options={['enabled', 'disabled']} />
        <SearchInput placeholder="Search rules..." />
      </FiltersBar>

      {/* Rules Table */}
      <RulesTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'pattern', label: 'Pattern' },
          { key: 'algorithm', label: 'Algorithm' },
          { key: 'limit', label: 'Limit' },
          { key: 'window', label: 'Window' },
          { key: 'enabled', label: 'Status' },
          { key: 'actions', label: 'Actions' },
        ]}
        data={rules}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggle={handleToggle}
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  )
}
```

### 5.4 Security Management UI | 安全管理界面

```tsx
// /admin/rate-limit/security/page.tsx

export default function SecurityPage() {
  return (
    <div className="security-container">
      <PageHeader title="Security Management" />

      {/* Tabs */}
      <Tabs>
        <Tab label="Overview">
          <SecurityOverview
            blacklistCount={blacklistCount}
            whitelistCount={whitelistCount}
            attackEvents={attackEvents}
            alerts={alerts}
          />
        </Tab>
        <Tab label="Blacklist">
          <BlacklistTable
            data={blacklist}
            onAdd={handleAddToBlacklist}
            onRemove={handleRemoveFromBlacklist}
          />
        </Tab>
        <Tab label="Whitelist">
          <WhitelistTable
            data={whitelist}
            onAdd={handleAddToWhitelist}
            onRemove={handleRemoveFromWhitelist}
          />
        </Tab>
        <Tab label="Attack Events">
          <AttackEventsTable
            data={attackEvents}
            onResolve={handleResolveAttack}
          />
        </Tab>
      </Tabs>
    </div>
  )
}
```

### 5.5 Analytics UI | 分析界面

```tsx
// /admin/rate-limit/analytics/page.tsx

export default function AnalyticsPage() {
  return (
    <div className="analytics-container">
      <PageHeader title="Analytics" />

      {/* Time Range Selector */}
      <TimeRangeSelector
        options={['1h', '24h', '7d', '30d']}
        value={timeRange}
        onChange={setTimeRange}
      />

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <MetricCard
          title="Total Requests"
          value={trafficStats.totalRequests}
          chart={<TrafficTrendChart data={trafficTrend} />}
        />
        <MetricCard
          title="Block Rate"
          value={`${violationStats.blockRate}%`}
          chart={<BlockRateChart data={blockRateTrend} />}
        />
        <MetricCard
          title="Top Violators"
          value={topViolators.length}
          chart={<ViolatorsChart data={topViolators} />}
        />
      </div>

      {/* Detailed Charts */}
      <div className="charts-section">
        <TrafficTimeSeriesChart data={trafficTimeSeries} />
        <ViolationDistributionChart data={violationDistribution} />
      </div>

      {/* Anomalies */}
      <AnomaliesSection data={anomalies} />
    </div>
  )
}
```

### 5.6 Component Library | 组件库

#### 5.6.1 StatCard | 统计卡片

```tsx
interface StatCardProps {
  title: string
  value: number | string
  change?: number
  icon: React.ReactNode
  severity?: 'info' | 'warning' | 'error' | 'critical'
}

export function StatCard({ title, value, change, icon, severity }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        {change !== undefined && (
          <div className={`stat-change ${change >= 0 ? 'positive' : 'negative'}`}>
            {change >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
    </div>
  )
}
```

#### 5.6.2 TrafficChart | 流量图表

```tsx
interface TrafficChartProps {
  data: TimeSeriesDataPoint[]
}

export function TrafficChart({ data }: TrafficChartProps) {
  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>Traffic Overview</h3>
        <TimeRangeSelector />
      </div>
      <LineChart
        data={data}
        xKey="timestamp"
        yKey="value"
        height={300}
        showGrid
        showTooltip
      />
    </div>
  )
}
```

#### 5.6.3 RulesTable | 规则表格

```tsx
interface RulesTableProps {
  columns: Column[]
  data: RateLimitRule[]
  onEdit: (rule: RateLimitRule) => void
  onDelete: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
}

export function RulesTable({ columns, data, onEdit, onDelete, onToggle }: RulesTableProps) {
  return (
    <Table>
      <TableHeader>
        {columns.map(col => (
          <TableHead key={col.key}>{col.label}</TableHead>
        ))}
      </TableHeader>
      <TableBody>
        {data.map(rule => (
          <TableRow key={rule.id}>
            <TableCell>{rule.name}</TableCell>
            <TableCell>{rule.pattern}</TableCell>
            <TableCell>{rule.algorithm}</TableCell>
            <TableCell>{rule.maxRequests}</TableCell>
            <TableCell>{formatDuration(rule.windowMs)}</TableCell>
            <TableCell>
              <Switch
                checked={rule.enabled}
                onChange={(checked) => onToggle(rule.id, checked)}
              />
            </TableCell>
            <TableCell>
              <Button variant="ghost" onClick={() => onEdit(rule)}>
                <EditIcon />
              </Button>
              <Button variant="ghost" onClick={() => onDelete(rule.id)}>
                <TrashIcon />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

---

## 6. Security Considerations | 安全考虑

### 6.1 Authentication & Authorization | 认证与授权

**访问控制：**
- 所有管理 API 端点需要管理员权限
- 使用 JWT 或 Session-based 认证
- 实现角色基础的访问控制（RBAC）

**中间件示例：**
```typescript
// middleware/admin-auth.ts

export async function requireAdminAuth(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const decoded = verifyJWT(token)
    if (!decoded.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }
    return null // Continue
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid token' },
      { status: 401 }
    )
  }
}
```

### 6.2 Input Validation | 输入验证

**验证规则：**
- 所有输入参数必须验证
- 使用 Zod 或类似库进行 schema 验证
- 防止 SQL 注入和 XSS 攻击

**示例：**
```typescript
import { z } from 'zod'

const createRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  pattern: z.string().min(1).max(200),
  algorithm: z.enum(['sliding-window', 'token-bucket']),
  windowMs: z.number().min(1000).max(86400000),
  maxRequests: z.number().min(1).max(10000),
  keyType: z.enum(['ip', 'user', 'api-key', 'custom']),
  priority: z.number().min(0).max(100).optional(),
  enabled: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const validated = createRuleSchema.parse(body)
  // ... process validated data
}
```

### 6.3 Rate Limiting for Admin APIs | 管理 API 限流

**保护措施：**
- 管理 API 也需要限流保护
- 使用更严格的限制（例如：100 请求/分钟）
- 记录所有管理操作

**示例：**
```typescript
// Apply rate limiting to admin routes
export const config = {
  matcher: '/api/admin/:path*',
}

export async function middleware(request: NextRequest) {
  // Check admin auth first
  const authResult = await requireAdminAuth(request)
  if (authResult) return authResult

  // Then apply rate limiting
  const rateLimitResult = await checkRateLimit(request, {
    windowMs: 60 * 1000,
    maxRequests: 100,
    keyGenerator: (req) => req.headers.get('x-user-id') || 'unknown',
  })

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }

  return NextResponse.next()
}
```

### 6.4 Audit Logging | 审计日志

**记录内容：**
- 所有管理操作
- 规则变更
- 黑白名单变更
- 安全事件

**示例：**
```typescript
// lib/audit-logger.ts

export async function logAuditEvent(event: {
  action: string
  userId: string
  resource: string
  resourceId?: string
  details?: Record<string, unknown>
}) {
  await db.insert('audit_log', {
    id: generateId(),
    action: event.action,
    userId: event.userId,
    resource: event.resource,
    resourceId: event.resourceId,
    details: JSON.stringify(event.details),
    timestamp: Date.now(),
  })
}

// Usage
await logAuditEvent({
  action: 'CREATE_RULE',
  userId: 'admin-001',
  resource: 'rate-limit-rule',
  resourceId: rule.id,
  details: { ruleName: rule.name },
})
```

### 6.5 Data Privacy | 数据隐私

**隐私保护：**
- IP 地址脱敏（存储时哈希）
- 用户 ID 最小化
- 定期清理历史数据
- 符合 GDPR 要求

**示例：**
```typescript
// Hash IP addresses before storing
function hashIP(ip: string): string {
  return crypto.createHash('sha256')
    .update(ip + process.env.IP_HASH_SALT)
    .digest('hex')
}

// Store hashed IP
await db.insert('rate_limit_events', {
  id: generateId(),
  identifier: hashIP(ip),
  // ...
})
```

---

## 7. Implementation Plan | 实施计划

### 7.1 Phase 1: Core Infrastructure (Week 1) | 核心基础设施（第1周）

**Tasks:**
1. ✅ 创建数据库表和迁移脚本
2. ✅ 实现数据访问层（DAL）
3. ✅ 创建 TypeScript 类型定义
4. ✅ 设置基础 API 路由结构

**Deliverables:**
- Database schema SQL files
- Data access layer modules
- Type definitions
- API route skeleton

### 7.2 Phase 2: Rate Limit Management API (Week 2) | 限流管理 API（第2周）

**Tasks:**
1. ✅ 实现规则 CRUD API
2. ✅ 实现状态查询 API
3. ✅ 实现统计 API
4. ✅ 集成现有限流系统

**Deliverables:**
- `/api/admin/rate-limit/rules/*` endpoints
- `/api/admin/rate-limit/status` endpoint
- `/api/admin/rate-limit/statistics` endpoint
- Integration tests

### 7.3 Phase 3: Security Management API (Week 3) | 安全管理 API（第3周）

**Tasks:**
1. ✅ 实现黑白名单 API
2. ✅ 实现攻击检测逻辑
3. ✅ 实现告警系统
4. ✅ 创建安全事件处理器

**Deliverables:**
- `/api/admin/security/blacklist/*` endpoints
- `/api/admin/security/whitelist/*` endpoints
- `/api/admin/security/attacks` endpoint
- `/api/admin/security/alerts` endpoint
- Attack detection algorithms

### 7.4 Phase 4: Analytics API (Week 4) | 分析 API（第4周）

**Tasks:**
1. ✅ 实现流量统计 API
2. ✅ 实现违规统计 API
3. ✅ 实现趋势分析 API
4. ✅ 实现异常检测 API

**Deliverables:**
- `/api/admin/analytics/traffic` endpoint
- `/api/admin/analytics/violations` endpoint
- `/api/admin/analytics/trends/:metric` endpoint
- `/api/admin/analytics/anomalies` endpoint
- Analytics engine

### 7.5 Phase 5: Dashboard UI (Week 5-6) | 仪表板 UI（第5-6周）

**Tasks:**
1. ✅ 创建主仪表板页面
2. ✅ 创建规则管理界面
3. ✅ 创建安全管理界面
4. ✅ 创建分析界面
5. ✅ 实现图表组件
6. ✅ 实现实时更新

**Deliverables:**
- Main dashboard page
- Rules management pages
- Security management pages
- Analytics pages
- Chart components
- WebSocket integration for real-time updates

### 7.6 Phase 6: Testing & Deployment (Week 7) | 测试与部署（第7周）

**Tasks:**
1. ✅ 编写单元测试
2. ✅ 编写集成测试
3. ✅ 性能测试
4. ✅ 安全测试
5. ✅ 部署到生产环境

**Deliverables:**
- Test suite
- Performance benchmarks
- Security audit report
- Deployment documentation

---

## 8. Testing Strategy | 测试策略

### 8.1 Unit Tests | 单元测试

**测试范围：**
- 数据访问层
- 业务逻辑层
- 工具函数
- 类型验证

**示例：**
```typescript
// __tests__/rate-limit-manager.test.ts

describe('RateLimitManager', () => {
  describe('createRule', () => {
    it('should create a new rule', async () => {
      const ruleData: CreateRateLimitRuleDTO = {
        name: 'Test Rule',
        pattern: '/api/test',
        algorithm: 'sliding-window',
        windowMs: 60000,
        maxRequests: 10,
        keyType: 'ip',
      }

      const rule = await manager.createRule(ruleData)

      expect(rule).toBeDefined()
      expect(rule.id).toBeDefined()
      expect(rule.name).toBe(ruleData.name)
    })

    it('should throw error for invalid pattern', async () => {
      const ruleData: CreateRateLimitRuleDTO = {
        name: 'Invalid Rule',
        pattern: '', // Invalid
        algorithm: 'sliding-window',
        windowMs: 60000,
        maxRequests: 10,
        keyType: 'ip',
      }

      await expect(manager.createRule(ruleData)).rejects.toThrow()
    })
  })
})
```

### 8.2 Integration Tests | 集成测试

**测试范围：**
- API 端点
- 数据库操作
- 外部服务集成

**示例：**
```typescript
// __tests__/api/admin/rate-limit/rules.test.ts

describe('POST /api/admin/rate-limit/rules', () => {
  it('should create a new rule', async () => {
    const response = await fetch('/api/admin/rate-limit/rules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Test Rule',
        pattern: '/api/test',
        algorithm: 'sliding-window',
        windowMs: 60000,
        maxRequests: 10,
        keyType: 'ip',
      }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.rule).toBeDefined()
  })

  it('should return 401 for unauthorized requests', async () => {
    const response = await fetch('/api/admin/rate-limit/rules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    expect(response.status).toBe(401)
  })
})
```

### 8.3 Performance Tests | 性能测试

**测试指标：**
- API 响应时间
- 数据库查询性能
- 并发处理能力
- 内存使用

**示例：**
```typescript
// __tests__/performance/rate-limit.test.ts

describe('Rate Limit Performance', () => {
  it('should handle 1000 requests per second', async () => {
    const startTime = Date.now()
    const requests = Array.from({ length: 1000 }, (_, i) =>
      fetch('/api/admin/rate-limit/status?identifier=test-' + i)
    )

    await Promise.all(requests)
    const duration = Date.now() - startTime

    expect(duration).toBeLessThan(1000) // < 1 second
  })

  it('should not exceed 100ms response time for statistics', async () => {
    const startTime = Date.now()
    await fetch('/api/admin/rate-limit/statistics?timeRange=1h')
    const duration = Date.now() - startTime

    expect(duration).toBeLessThan(100)
  })
})
```

### 8.4 Security Tests | 安全测试

**测试范围：**
- 认证和授权
- 输入验证
- SQL 注入
- XSS 攻击
- CSRF 攻击

**示例：**
```typescript
// __tests__/security/api.test.ts

describe('API Security', () => {
  it('should reject requests without auth token', async () => {
    const response = await fetch('/api/admin/rate-limit/rules')
    expect(response.status).toBe(401)
  })

  it('should reject invalid input', async () => {
    const response = await fetch('/api/admin/rate-limit/rules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: '', // Invalid
        pattern: 'invalid pattern',
      }),
    })

    expect(response.status).toBe(400)
  })

  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE rate_limit_rules; --"
    const response = await fetch('/api/admin/rate-limit/rules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: maliciousInput,
        pattern: '/api/test',
        algorithm: 'sliding-window',
        windowMs: 60000,
        maxRequests: 10,
        keyType: 'ip',
      }),
    })

    // Should not cause database error
    expect(response.status).not.toBe(500)
  })
})
```

---

## 9. Future Enhancements | 未来增强

### 9.1 Machine Learning for Attack Detection | 机器学习攻击检测

**功能：**
- 使用 ML 模型检测异常流量模式
- 自动学习正常流量基线
- 预测潜在攻击

### 9.2 Real-time Notifications | 实时通知

**功能：**
- WebSocket 推送实时告警
- 集成邮件/短信通知
- 支持第三方通知服务（Slack, Discord）

### 9.3 Advanced Analytics | 高级分析

**功能：**
- 用户行为分析
- 地理位置分析
- 设备指纹识别
- 流量预测

### 9.4 Multi-tenant Support | 多租户支持

**功能：**
- 支持多个组织/租户
- 租户级别的规则配置
- 租户级别的统计数据

### 9.5 API Gateway Integration | API 网关集成

**功能：**
- 与 API 网关集成
- 分布式限流
- 跨服务协调

---

## 10. Conclusion | 结论

本技术报告详细描述了 API 限流与安全仪表板的设计方案，包括：

1. **系统架构** - 分层架构，清晰的职责划分
2. **数据模型** - 完整的数据库 schema 和 TypeScript 类型
3. **API 设计** - RESTful API 端点，遵循现有风格
4. **UI 设计** - 现代化的仪表板界面
5. **安全考虑** - 全面的安全措施
6. **实施计划** - 7周的实施路线图
7. **测试策略** - 完整的测试覆盖

该设计充分利用了现有的限流系统，提供了可视化的管理界面和强大的安全功能。通过分阶段实施，可以逐步交付价值，降低风险。

---

## Appendix | 附录

### A. Database Migration Script | 数据库迁移脚本

```sql
-- Migration: create_rate_limit_security_tables
-- Version: 1.0.0
-- Date: 2026-04-05

-- Create rate_limit_rules table
CREATE TABLE IF NOT EXISTS rate_limit_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  pattern TEXT NOT NULL,
  algorithm TEXT NOT NULL CHECK(algorithm IN ('sliding-window', 'token-bucket')),
  window_ms INTEGER NOT NULL,
  max_requests INTEGER NOT NULL,
  key_type TEXT NOT NULL CHECK(key_type IN ('ip', 'user', 'api-key', 'custom')),
  priority INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_rules_pattern ON rate_limit_rules(pattern);
CREATE INDEX IF NOT EXISTS idx_rate_limit_rules_enabled ON rate_limit_rules(enabled);

-- Create blacklist table
CREATE TABLE IF NOT EXISTS blacklist (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('ip', 'user-id', 'api-key', 'email')),
  value TEXT NOT NULL,
  reason TEXT,
  expires_at INTEGER,
  created_by TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blacklist_type ON blacklist(type);
CREATE INDEX IF NOT EXISTS idx_blacklist_value ON blacklist(value);
CREATE INDEX IF NOT EXISTS idx_blacklist_expires ON blacklist(expires_at);

-- Create whitelist table
CREATE TABLE IF NOT EXISTS whitelist (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('ip', 'user-id', 'api-key', 'email')),
  value TEXT NOT NULL,
  description TEXT,
  created_by TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_whitelist_type ON whitelist(type);
CREATE INDEX IF NOT EXISTS idx_whitelist_value ON whitelist(value);

-- Create rate_limit_events table
CREATE TABLE IF NOT EXISTS rate_limit_events (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  path TEXT NOT NULL,
  rule_id TEXT,
  allowed BOOLEAN NOT NULL,
  remaining INTEGER,
  limit INTEGER,
  algorithm TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_identifier ON rate_limit_events(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_path ON rate_limit_events(path);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_timestamp ON rate_limit_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_rate_limit_events_allowed ON rate_limit_events(allowed);

-- Create attack_events table
CREATE TABLE IF NOT EXISTS attack_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('ddos', 'brute-force', 'sql-injection', 'xss', 'other')),
  identifier TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  evidence TEXT,
  detected_at INTEGER NOT NULL,
  resolved BOOLEAN DEFAULT 0,
  resolved_at INTEGER,
  resolved_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_attack_events_type ON attack_events(type);
CREATE INDEX IF NOT EXISTS idx_attack_events_identifier ON attack_events(identifier);
CREATE INDEX IF NOT EXISTS idx_attack_events_severity ON attack_events(severity);
CREATE INDEX IF NOT EXISTS idx_attack_events_detected_at ON attack_events(detected_at);

-- Create security_alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('info', 'warning', 'error', 'critical')),
  title TEXT NOT NULL,
  message TEXT,
  metadata TEXT,
  dismissed BOOLEAN DEFAULT 0,
  dismissed_at INTEGER,
  dismissed_by TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON security_alerts(type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_dismissed ON security_alerts(dismissed);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON security_alerts(created_at);
```

### B. Sample Configuration | 示例配置

```typescript
// config/rate-limit-dashboard.ts

export const dashboardConfig = {
  // Database
  database: {
    path: process.env.RATE_LIMIT_DB_PATH || './data/rate-limit.db',
    maxConnections: 10,
  },

  // Redis
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },

  // Analytics
  analytics: {
    retentionDays: 30,
    aggregationInterval: 60, // seconds
    anomalyThreshold: 2.5, // standard deviations
  },

  // Alerts
  alerts: {
    enabled: true,
    channels: ['email', 'webhook'],
    webhookUrl: process.env.ALERT_WEBHOOK_URL,
    emailRecipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(','),
  },

  // Security
  security: {
    ipHashSalt: process.env.IP_HASH_SALT || 'default-salt',
    auditLogEnabled: true,
    auditLogRetentionDays: 90,
  },

  // UI
  ui: {
    refreshInterval: 30, // seconds
    maxChartPoints: 100,
    defaultTimeRange: '24h',
  },
}
```

### C. API Response Codes | API 响应代码

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

---

**End of Report**