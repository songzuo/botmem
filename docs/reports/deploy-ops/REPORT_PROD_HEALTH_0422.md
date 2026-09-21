# 7zi.com 生产环境健康检查报告

**检查时间:** 2026-04-22 06:39 GMT+2  
**服务器:** 165.99.43.61 (7zi.com)  
**检查人:** Subagent 自动检查

---

## 一、HTTP 端点检查

| 端点 | 状态码 | 说明 |
|------|--------|------|
| `https://7zi.com` | **404** | 首页存在（重定向至 `/en`，返回200） |
| `https://7zi.com/api/health` | **307** → 404 | 健康检查 API 未实现或路由缺失 |
| `https://7zi.com/api/feedback` | **404** | 反馈 API 路由未找到 |

**注意:** `/api/health` 和 `/api/feedback` 均返回 404，说明后端 API 路由未部署或未实现。

---

## 二、PM2 进程状态

| 进程名 | 模式 | PID | 运行时间 | 重启次数 | CPU | 内存 | 状态 |
|--------|------|-----|---------|---------|-----|------|------|
| **7zi-main** | cluster | 3762146 | 17h | 0 | 0% | 75.9MB | ✅ online |
| **ai-site** | fork | 3822842 | 14h | **227** | 0% | 133.9MB | ✅ online |

### ⚠️ ai-site 高重启次数警告
ai-site 重启了 227 次，远高于正常值。需要关注。

### ai-site 错误日志
大量 `Unable to find next-intl locale because the middleware didn't run on this request` 错误。
**原因:** Next.js i18n 中间件未在某些请求上执行，导致 `notFound()` 被调用。

### 7zi-main 日志
正常运行，无错误，`Ready in 0ms`。

---

## 三、系统资源

### 磁盘空间 ⚠️ 严重
```
/dev/vda1  88G  86G  1.1G  99% /
```
**磁盘使用率 99%，仅剩 1.1GB。** 这是高危问题，可能导致：
- 应用无法写入日志
- 系统服务异常
- 数据库写入失败

### 内存
```
total     used    free   shared  buff/cache   available
7.8Gi     4.7Gi   1.2Gi   48Mi     1.9Gi       2.5Gi
```
内存使用正常，尚有余量。

---

## 四、Nginx 状态

✅ Nginx 运行正常（已启用，运行 1 周 6 天），无配置错误。

---

## 五、网站内容验证

| 页面 | 状态 | 说明 |
|------|------|------|
| `/` (根) | 200 | 正常加载，重定向至 `/en` |
| `/en` | 200 | 英文版主页正常 |

---

## 六、问题汇总

| # | 问题 | 严重度 | 建议操作 |
|---|------|--------|---------|
| 1 | **磁盘 99%** | 🔴 紧急 | 清理日志、清理 Docker 未使用镜像/容器、清理 `/tmp` |
| 2 | **ai-site 227 次重启** | 🟡 警告 | 检查 7zi-main 和 ai-site 进程依赖关系 |
| 3 | **`/api/health` 404** | 🟡 警告 | 确认后端是否需要实现健康检查接口 |
| 4 | **`/api/feedback` 404** | 🟡 警告 | 确认反馈 API 路由是否已部署 |

---

## 七、建议修复步骤

### 立即处理（紧急）

1. **清理 Docker**（可释放 ~1.67GB）:
   ```bash
   docker system prune -a
   docker builder prune --all
   ```

2. **清理日志**:
   ```bash
   journalctl --vacuum-time=7d
   rm -rf /var/log/*.gz /var/log/*.old
   ```

3. **清理 PM2 日志**:
   ```bash
   pm2 flush
   ```

### 后续处理

- 检查 ai-site 的 227 次重启原因（配置文件、网络问题等）
- 实现 `/api/health` 接口供监控使用
- 确认 `/api/feedback` 是否需要实现

---

## 八、总结

**整体状态: ⚠️ 需要处理**

- ✅ 服务在线：7zi-main 和 ai-site 两个 PM2 进程均在线
- ✅ Nginx 正常
- ✅ 网站可访问（重定向至 `/en` 后正常）
- ⚠️ 磁盘 99% 空间不足（需立即清理）
- ⚠️ ai-site 高重启次数
- ⚠️ API 路由缺失（/api/health, /api/feedback）