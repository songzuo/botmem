# 🛡️ 系统健康报告 - 2026-04-13

**检查时间:** 2026-04-13 05:34 (Europe/Berlin, GMT+2)
**执行人:** 系统管理员子代理

---

## 1. Git 状态 ⚠️

**分支:** `main` (与 origin/main 同步)
**状态:** 存在未提交的更改

### 已修改文件 (19个)
| 类别 | 文件 |
|------|------|
| 前端代码 | `7zi-frontend/package.json`, `7zi-frontend/pnpm-lock.yaml`, `7zi-frontend/public/sw.js`, `7zi-frontend/src/shared/hooks/index.ts` |
| 测试文件 | 多个 `__tests__/route.test.ts` (6个) |
| 数据库 | `7zi-frontend/data/feedback.db` |
| 根目录 | `HEARTBEAT.md`, `REACT_OPTIMIZATION_STATUS.md`, `pnpm-lock.yaml`, `state/tasks.json` |
| 子模块 | `botmem`, `memory/claw-mesh-state.json` |

### 未追踪文件 (8个)
- `7zi-frontend/tests/security-upgrade-verify.test.ts`
- `AGENT_WORLD_STRATEGY_v200.md`, `ARCHITECTURE_REVIEW_v2.md`, `FINANCIAL_ANALYSIS.md`
- `MEDIA_CONTENT_STRATEGY.md`, `SECURITY_STATUS_REVIEW_20260412.md`, `SEO_PROMOTION_REVIEW_20260412.md`
- `TEST_COVERAGE_ANALYSIS_v2.md`

> ⚠️ **建议:** 整理并提交这些变更，特别是代码修改部分。

---

## 2. package.json 依赖状态 ✅

**项目版本:** `7zi-frontend v1.13.0`
**包管理器:** pnpm (有 pnpm-lock.yaml)
**状态:** package.json 正常，包含完整的脚本配置（dev/build/test/e2e）
> pnpm-lock.yaml 已修改但未提交，依赖结构完整。

---

## 3. 7zi-frontend 构建状态 ✅

- **`.next/` 目录:** 存在
- **`BUILD_ID`:** 存在，最后构建时间 `2026-04-12 23:43`
- **构建产物:** build-manifest.json, app-path-routes-manifest.json 等完整
- **前端服务 (port 3000):** ❌ 未运行（连接超时）

> ⚠️ 构建产物存在但服务未启动（Docker 容器 `7zi-frontend-prod` 已 Exited）

---

## 4. Docker 容器状态

| 容器 | 镜像 | 状态 |
|------|------|------|
| `7zi-health-service` | monitoring_health-service | ✅ Up 7天 (healthy) |
| `7zi-grafana` | grafana/grafana:10.2.2 | ❌ Exited (1) 7天前 |
| `7zi-alertmanager` | prom/alertmanager:v0.26.0 | ⚠️ Restarting (崩溃重启) |
| `7zi-loki` | grafana/loki:2.9.3 | ✅ Up 8天 (healthy) |
| `7zi-prometheus` | prom/prometheus:v2.48.0 | ✅ Up 8天 (healthy) |
| `7zi-node-exporter` | prom/node-exporter:v1.7.0 | ✅ Up 7天 (healthy) |
| `7zi-pushgateway` | prom/pushgateway:v1.6.1 | ✅ Up 8天 (healthy) |
| `7zi-cadvisor` | gcr.io/cadvisor/cadvisor | ✅ Up 8天 (healthy) |
| `priceless_bose` | abed68a30313 | ❌ Exited (1) 8天前 (构建失败) |
| `7zi-frontend-prod` | 7zi-frontend-full:latest | ❌ Exited (0) 10天前 |

**关键问题:**
- `7zi-grafana`: 退出异常，监控面板不可用
- `7zi-alertmanager`: 持续崩溃重启，告警服务不可用
- `7zi-frontend-prod`: 前端生产服务未运行

---

## 5. 服务器健康状态

| 指标 | 数值 | 状态 |
|------|------|------|
| 磁盘使用 (/) | 58G / 145G (41%) | ✅ 正常 |
| 内存总量 | 7.8Gi | - |
| 内存使用 | 3.1Gi used / 4.7Gi available | ✅ 正常 |
| Swap 使用 | 353Mi / 4Gi | ✅ 正常 |
| 系统运行时间 | 34天 18小时 | ✅ 稳定 |
| 负载均值 | 1.50 / 0.83 / 0.71 | ⚠️ 轻度偏高 |
| Health Service API | http://localhost:8085/health → 200 | ✅ 正常 |
| 前端服务 | http://localhost:3000 | ❌ 未响应 |

---

## 总结与建议

### 🔴 需要立即处理
1. **`7zi-grafana` 容器崩溃** → 检查日志 `docker logs 7zi-grafana`，修复并重启
2. **`7zi-alertmanager` 持续重启** → 检查配置文件，`docker logs 7zi-alertmanager`
3. **`7zi-frontend-prod` 未运行** → 前端不可访问，需要重新启动或重新部署

### 🟡 建议跟进
4. **Git 未提交变更** → 整理并提交代码修改
5. **系统负载偏高** (load 1.50) → 观察，必要时排查占用进程

### 🟢 运行正常
- 核心监控栈 (Prometheus, Loki, Pushgateway, cAdvisor, Node Exporter) ✅
- 磁盘和内存充足 ✅
- 系统稳定运行 34 天 ✅
