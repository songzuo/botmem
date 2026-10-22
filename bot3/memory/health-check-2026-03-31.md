# 集群健康检查报告
时间: 2026-03-31 09:57 UTC

## 节点状态

| 节点 | SSH | 内存 | 磁盘 | 进程数 |
|------|-----|------|------|--------|
| 7zi.com | ✅ OK | 2.8Gi/7.8Gi | 30G/40G (76%) | 28 |
| bot.szspd.cn | ❌ 超时 | - | - | - |
| bot2.szspd.cn | ❌ 超时 | - | - | - |
| bot3.szspd.cn | ✅ OK | 1.6Gi/3.6Gi | 36G/50G (71%) | 9 |
| bot4.szspd.cn | ✅ OK | 1.1Gi/1.9Gi | 24G/40G (59%) | 3 |
| bot5.szspd.cn | ✅ OK | 671Mi/1.9Gi | - | 3 |

## 问题
- bot.szspd.cn: SSH连接超时
- bot2.szspd.cn: SSH连接超时
- 7zi.com: 磁盘使用率较高(76%)
- bot3.szspd.cn: 磁盘使用率较高(71%)

## 建议
1. 检查 bot.szspd.cn 和 bot2.szspd.cn 网络连通性
2. 关注7zi.com和bot3磁盘使用率
