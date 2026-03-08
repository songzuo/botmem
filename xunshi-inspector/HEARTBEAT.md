---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 3045022055f9f5e0cf0682bfbed777eb69a7d2c2fb7bf25a428ebf070c4bb67ab5f50461022100ec3d1b019085d43880752a05f9112aa87c11a19794bf1730853724820b66ede1
    ReservedCode2: 304502201b1e7ff3fb23b5ed8a80a0b641777f33872bfd4d87651bdf55089db151fcb1ee022100a4962e65a742dc22c6b45d14e0280b0e103c23d781dbf670f657a26fcb22c50b
---

# HEARTBEAT.md - 巡视经理任务

## 巡视模式: 观察员 (只记录,不操作)

### 当前观察任务

1. **集群状态扫描** - 每周多次
2. **资源使用监控** - 记录异常
3. **问题识别** - 仅报告,不修复

### 观察要点 (2026-03-05)

- ✅ 集群状态: 全部7台机器已恢复
- ✅ 配置已备份: config-backup-2026-03-05.json

### 报告位置

- 详细报告: workspace-logs/2026-03-02-cluster-observation.md

### GitHub 定时上传任务 (使用心跳轮询)

由于系统不支持 cron，使用心跳机制模拟定时任务：

**上传时机**: 每8小时检查一次 (0点, 8点, 16点)
- 当前小时 % 8 == 0 时执行
- 每周日 6点额外执行每周上传

**执行命令**: `bash /workspace/scripts/github_upload_safe.sh`

**状态追踪**: memory/heartbeat-state.json

### 巡视原则

- ✅ 可以SSH连接节点
- ✅ 可以读取日志和状态
- ❌ 不修改配置
- ❌ 不重启服务
- ❌ 不部署代码
