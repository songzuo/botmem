# 服务器健康检查报告

**检查时间**: 2026-04-18 19:13 (GMT+8)  
**服务器**: 7zi.com (165.99.43.61)  
**运行时长**: 25天 10小时 26分钟

---

## 1. PM2 服务状态

| 服务名称 | 状态 | 重启次数 | 运行时长 |
|----------|------|----------|----------|
| **7zi-main** | ✅ online | 2 | 25分钟 |
| new-7zi | ✅ online | 6 | 3天 |
| money-7zi | ✅ online | 18 | 4天 |
| visa | ✅ online | 0 | 3天 |
| ex-7zi | ❌ stopped | 5932 | - |
| export-7zi | ❌ stopped | 5928 | - |

**7zi-main 状态**: ✅ 已恢复运行（之前部署失败后已重启）

---

## 2. Nginx 状态

✅ **正常运行** - Active: active (running)  
- 已运行 1 周 2 天
- Worker processes: 8 个
- 内存使用: 43.7MB

---

## 3. 7zi-main 服务详情

- **状态**: ✅ Online
- **脚本路径**: `/var/www/7zi/.next/standalone/server.js`
- **Node.js 版本**: v22.22.0
- **重启次数**: 2 (正常)
- **日志路径**: `/root/.pm2/logs/7zi-main-error.log`

⚠️ **错误日志警告**: 检测到 React 组件错误
```
Error: Element type is invalid: expected a string (for built-in components) 
or a class/function (for composite components) but got: undefined.
```
此错误反复出现，需要关注组件引用问题。

---

## 4. new-7zi (ai.7zi.com) 状态

✅ **服务正常** - HTTP 307 重定向（语言路由）
- 重定向到 `/zh` (中文版本)
- Cloudflare CDN 加速
- SSL: ✅ 有效 (TLSv1.2 TLSv1.3)
- Nginx 配置: ✅ 正常

---

## 5. 7zi.com 主站

✅ **HTTP 200** - 主页正常响应

---

## 6. 系统资源

### 磁盘空间
| 文件系统 | 总大小 | 已用 | 可用 | 使用率 |
|----------|--------|------|------|--------|
| /dev/vda1 | 88G | 70G | 18G | **80%** ⚠️ |

⚠️ **磁盘使用率 80%**，建议关注清理

### 内存
| 类型 | 总计 | 已用 | 可用 | 缓存 |
|------|------|------|------|------|
| 物理内存 | 7.8Gi | 4.3Gi | 1.9Gi | 1.5Gi |
| Swap | 0B | 0B | 0B | - |

✅ 内存状态正常

### 系统负载
- Load Average: 1.30, 1.12, 1.19 (轻微偏高但可接受)

---

## 总结

| 检查项 | 状态 | 备注 |
|--------|------|------|
| PM2 服务 | ✅ | 7zi-main 已恢复 |
| Nginx | ✅ | 正常运行 |
| 7zi-main | ✅ | online (有 React 错误日志) |
| ai.7zi.com | ✅ | 307 重定向正常 |
| 7zi.com | ✅ | HTTP 200 |
| 磁盘空间 | ⚠️ | 80% 使用率，建议清理 |
| 内存 | ✅ | 正常 |

---

## 需要关注的问题

1. **React 组件错误**: `7zi-main` 日志中有 "Element type is invalid" 错误，建议检查组件引用
2. **磁盘空间**: 80% 使用率，建议清理日志或不必要文件
3. **ex-7zi / export-7zi**: 停止状态，重启次数异常高（5932次），如不需要可删除
