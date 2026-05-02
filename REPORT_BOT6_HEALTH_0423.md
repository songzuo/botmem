# Bot6 本地环境健康检查报告

**检查时间**: 2026-04-23 11:11 GMT+2

---

## 1. Docker 容器状态 ✅

共 13 个容器运行中：

| 容器名 | 状态 | 端口 |
|--------|------|------|
| elasticsearch | Up 6 days | - |
| rabbitmq | Up 6 days | - |
| adminui | Up 7 days | - |
| adminvs | Up 7 days | 80, 8111 |
| microclaw | Up 6 days | 10961, 28790 |
| mysql-dating | Up 7 days | 3306, 33060 |
| 7zi-health-service | Up 2 weeks (healthy) | 8085 |
| 7zi-alertmanager | Up 10 days (healthy) | 9093 |
| 7zi-loki | Up 2 weeks (healthy) | 3100 |
| 7zi-prometheus | Up 9 days | 9090 |
| 7zi-node-exporter | Up 2 weeks (healthy) | 9101 |
| 7zi-pushgateway | Up 2 weeks (healthy) | 9091 |
| 7zi-cadvisor | Up 2 weeks (healthy) | 8080 |

**结论**: 所有容器运行正常 ✅

---

## 2. 磁盘空间 ✅

| 文件系统 | 总大小 | 已用 | 可用 | 使用率 |
|----------|--------|------|------|--------|
| /dev/sda1 | 145G | 69G | 76G | 48% |

**结论**: 磁盘空间充足 ✅

---

## 3. 内存使用 ✅

| 类型 | 总计 | 已用 | 可用 |
|------|------|------|------|
| 内存 | 7.8Gi | 4.1Gi | 3.6Gi |
| Swap | 4.0Gi | 2.6Gi | 1.4Gi |

**结论**: 内存使用正常 ✅

---

## 4. 系统错误日志 ✅

`journalctl` 检查最近 50 条日志，未发现 error 记录。

**结论**: 无系统错误 ✅

---

## 5. OpenClaw Gateway 状态 ✅

| 项目 | 状态 |
|------|------|
| 服务 | running |
| PID | 3457192 |
| 绑定地址 | 127.0.0.1:18789 |
| RPC probe | ok |
| 最后退出 | 0 |

**结论**: Gateway 运行正常 ✅

---

## 6. Git 工作区状态

```
M memory/claw-mesh-state.json
?? memory/2026-04-23.md
```

- **修改**: `memory/claw-mesh-state.json` (已修改)
- **未跟踪**: `memory/2026-04-23.md` (新文件)

**结论**: 有待处理的文件，建议根据需要提交

---

## 总体评估

| 检查项 | 状态 |
|--------|------|
| Docker 容器 | ✅ 正常 |
| 磁盘空间 | ✅ 充足 (48%) |
| 内存 | ✅ 正常 |
| 系统日志 | ✅ 无错误 |
| OpenClaw Gateway | ✅ 运行中 |
| Git 工作区 | ⚠️ 有待处理文件 |

**总体状态**: 🎉 **健康** - 所有核心服务运行正常
