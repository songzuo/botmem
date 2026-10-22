# 集群健康检查报告
**时间**: 2026-05-03 15:59 UTC (23:59 CST)

## 📡 SSH连通性状态
| 节点 | 状态 | 备注 |
|------|------|------|
| 7zi.com | ❌ 离线 | Network is unreachable |
| bot.szspd.cn | ✅ 在线 | - |
| bot2.szspd.cn | ✅ 在线 | - |
| bot3.szspd.cn | ✅ 在线 | - |
| bot4.szspd.cn | ❌ 离线 | Connection timed out |
| bot5.szspd.cn | ✅ 在线 | - |

**在线节点**: 4/6 (67%)

## 📊 资源使用情况
| 节点 | 内存使用 | 磁盘使用 | 状态 |
|------|----------|----------|------|
| bot.szspd.cn | 989Mi / 1.8Gi (54%) | 18G / 40G (47%) | ✅ 正常 |
| bot2.szspd.cn | 834Mi / 1.8Gi (46%) | 30G / 40G (80%) | ⚠️ 磁盘紧张 |
| bot3.szspd.cn | 1.6Gi / 3.6Gi (44%) | 33G / 40G (81%) | ⚠️ 磁盘紧张 |
| bot5.szspd.cn | 1.1Gi / 1.9Gi (57%) | 27G / 40G (68%) | ✅ 正常 |

## 🧹 Evomap清理状态
所有在线节点均未发现 `/root/.openclaw/workspace/evomap` 目录。

## 🔔 告警
1. **严重**: 7zi.com (主站) 网络不可达
2. **严重**: bot4.szspd.cn 连接超时
3. **警告**: bot2.szspd.cn、bot3.szspd.cn 磁盘使用率 >80%

## 📝 建议行动
1. 排查 7zi.com 网络问题 (主站优先级最高)
2. 排查 bot4.szspd.cn 连接问题
3. 清理 bot2/bot3 磁盘空间
4. 检查是否需要在远程节点初始化 evomap 目录
