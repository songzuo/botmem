# PM2 健康检查报告
**检查时间**: 2026-04-26 20:08 GMT+2  
**服务器**: 165.99.43.61 (root)  
**检查人**: Executor 子代理

---

## 1. PM2 进程状态

| ID | 名称 | 版本 | 模式 | 状态 | 重启次数 | 内存 | CPU |
|----|------|------|------|------|----------|------|-----|
| 0 | 7zi-main | 1.14.0 | cluster | ⚠️ **errored** | 31 | 0b | 0% |
| 1 | ai-site | 1.0.0 | fork | ✅ online | 249 | 129.6mb | 0% |

---

## 2. 核心问题分析

### 🔴 问题 1: Server Action 错误 (致命)

**错误日志**:
```
Error: Failed to find Server Action. This request might be from an older or newer deployment.
```

**原因**: Next.js 客户端请求的 Server Action ID 在当前构建中不存在，通常是因为：
- 部署后 .next 缓存未清理
- 前后端版本不一致
- 独立打包(standalone)后 Action mapping 丢失

**建议**: 需要重新构建部署 `npm run build`

---

### 🔴 问题 2: 版本不匹配

| 期望版本 | 实际版本 |
|----------|----------|
| **v1.14.1** | **v1.14.0** |

**生产路径**: `/var/www/7zi/7zi-frontend`
**部署模式**: Next.js Standalone (`/.next/standalone/`)

---

### 🔴 问题 3: 独立目录检查

- ✅ `/var/www/7zi/7zi-frontend/.next/standalone/` 存在
- ✅ `node_modules` 完整
- ✅ `.next/BUILD_ID`: PMF-akP13cYfzSbAkCOs6
- ⚠️ **standalone 目录版本为 1.14.0，非 1.14.1**

---

## 3. 内存/CPU 统计

| 进程 | 当前内存 | 当前CPU | 备注 |
|------|----------|---------|------|
| 7zi-main | 0b (崩溃) | 0% | 进程已终止 |
| ai-site | 129.6mb | 0% | 稳定运行 2 天 |

---

## 4. ai-site 异常

ai-site 重启次数高达 **249 次**，虽然状态 online，但异常重启需要关注。

---

## 5. 修复建议

### 紧急修复 (7zi-main)

```bash
# SSH 到服务器执行
cd /var/www/7zi/7zi-frontend

# 清理缓存
rm -rf .next

# 重新构建 (需要 package.json 中版本改为 1.14.1)
npm run build

# 重启 PM2
pm2 restart 7zi-main
```

### 版本对齐

1. 将 `/var/www/7zi/7zi-frontend/package.json` 版本改为 `1.14.1`
2. 确保源代码是最新的
3. 执行 `npm run build`
4. 重启 PM2

### 长期建议

- [ ] 增加 PM2 日志轮转，避免日志文件过大
- [ ] 配置 PM2 监听异常自动重启后发送告警
- [ ] 调查 ai-site 为何重启 249 次

---

## 6. 结论

| 检查项 | 状态 |
|--------|------|
| 7zi-main 进程 | ❌ 崩溃 (Server Action 错误) |
| ai-site 进程 | ⚠️ 在线但重启过多 |
| standalone 目录 | ✅ 存在且完整 |
| 版本一致性 | ❌ 期望 1.14.1，实际 1.14.0 |

**需要立即重新构建部署 7zi-main。**
