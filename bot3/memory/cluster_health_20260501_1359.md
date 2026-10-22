# 集群健康检查报告 - 2026-05-01 13:59 UTC

## SSH连通性状态

### ✅ 在线节点 (4/6)
- bot.szspd.cn
- bot2.szspd.cn
- bot3.szspd.cn
- bot5.szspd.cn

### ❌ 离线节点 (2/6)
- **7zi.com** - Network is unreachable
- **bot4.szspd.cn** - Connection timed out

## 本机资源状态 (bot6)

### 内存
- 总内存: 3.6GB
- 已用: 1.6GB
- 空闲: 675MB
- 缓存: 1.6GB
- Swap: 8GB (使用691MB)
- **状态**: ✅ 正常

### 磁盘
- 根分区: /dev/vda1 (40GB)
- 已用: 33GB (81%)
- 可用: 8GB
- **状态**: ⚠️ 警告 (81%使用率，建议清理)

### Evomap目录
- 大小: 4KB
- **状态**: ✅ 正常（已清理）

## 问题总结

1. **7zi.com离线** - 网络不可达，可能是DNS或网络问题
2. **bot4.szspd.cn离线** - 连接超时，可能机器关机或网络故障
3. **本机磁盘使用率81%** - 建议清理日志或临时文件

## 建议措施

- 检查7zi.com的DNS解析和网络配置
- 联系bot4.szspd.cn管理员确认机器状态
- 考虑清理本机大文件（日志、缓存等）
