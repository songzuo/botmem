
## 集群健康检查报告 - 2026-09-29 17:54 UTC

### SSH连通性
| 节点 | 状态 |
|------|------|
| 7zi.com | ❌ 网络不可达 |
| bot.szspd.cn | ✅ OK |
| bot2.szspd.cn | ✅ OK |
| bot3.szspd.cn | ✅ OK |
| bot4.szspd.cn | ✅ OK |
| bot5.szspd.cn | ✅ OK |

### 资源使用
| 节点 | 内存可用 | 磁盘使用率 |
|------|----------|------------|
| bot.szspd.cn | 272Mi | 47% |
| bot2.szspd.cn | 206Mi | 78% ⚠️ |
| bot3.szspd.cn | 233Mi | 78% ⚠️ |
| bot4.szspd.cn | 287Mi | 74% |
| bot5.szspd.cn | 114Mi | 67% |

### 待清理项
- bot2: `/tmp/openclaw/openclaw-2026-06-07.log` (大日志文件)
- bot4: `/var/log/picoclaw.log` (需检查大小)

### 建议
1. 7zi.com 网络问题需人工排查
2. bot2/bot3 磁盘接近80%，考虑清理
3. bot5 内存较低(114Mi)，注意监控
