# 7zi.com 部署健康报告
**时间:** 2026-04-20 21:05 GMT+2  
**服务器:** 7zi.com (165.99.43.61)  
**报告类型:** 部署健康检查

---

## ✅ PM2 进程状态

| 进程名 | 版本 | 模式 | PID | 运行时间 | 重启次数 | 状态 | 内存 |
|--------|------|------|-----|----------|----------|------|------|
| 7zi-main | 1.3.0 | cluster | 2697060 | 2D | 16 | ✅ online | 57.5mb |
| ai-site | 1.0.0 | fork | 2962783 | 37h | 0 | ✅ online | 99.6mb |

**结论:** 2个PM2进程均在线，运行稳定。

---

## ⚠️ PM2 日志警告

### 7zi-main 历史重启问题
- 历史上发生了16次不稳定重启（发生在4月19日之前）
- 当前已稳定（2天无重启）

### ai-site 存在 MISSING_MESSAGE 错误
**症状:** 访问 `/[locale]/about/page` 页面时大量 `MISSING_MESSAGE` 错误

**缺失的翻译键:**
```
about.value3, about.value3Desc
about.value4, about.value4Desc
about.cta, about.ctaSub
```

**根本原因:** `next-intl` 中间件未在部分请求上运行，导致 locale 丢失。参见 https://next-intl.dev/docs/routing/middleware#unable-to-find-locale

**影响:** about 页面国际化内容显示异常，用户访问时可能看到未翻译内容或 404 页面。

---

## ✅ Docker 容器状态

| 容器名 | 镜像 | 状态 | 端口映射 |
|--------|------|------|----------|
| rabbitmq-dating | rabbitmq:3-management | ✅ Up 10 days | 5672, 15672 |
| mysql-dating | mysql:8.0 | ✅ Up 10 days | 3306, 33060 |
| microclaw | ghcr.io/microclaw/microclaw:latest | ✅ Up 11 days | - |

**结论:** 3个Docker容器全部正常运行。

---

## ✅ Nginx 状态

```
Active: active (running) since Thu 2026-04-09 11:36:31 CST
```
- 主进程 PID: 3618854
- Worker进程: 8个 worker processes 运行中
- 已运行 1 周 4 天
- 最后 reload 时间: 最近（PM2 更新后自动 reload）

**结论:** Nginx 运行正常。

---

## 📋 问题汇总

| # | 问题 | 严重程度 | 状态 |
|---|------|----------|------|
| 1 | ai-site about 页面 MISSING_MESSAGE 翻译缺失 | ⚠️ 中 | 待修复 |
| 2 | next-intl 中间件在部分请求未运行 | ⚠️ 中 | 待修复 |
| 3 | 7zi-main 历史重启16次 | ✅ 已稳定 | 无需操作 |

---

## 🚀 建议行动

1. **紧急修复:** 检查 `messages/en.json` 和 `messages/zh.json`，补全 `about.value3`, `about.value3Desc`, `about.value4`, `about.value4Desc`, `about.cta`, `about.ctaSub` 翻译键。
2. **检查中间件:** 审查 `middleware.ts` 配置，确保所有路由都经过 `next-intl` 中间件。
3. **监控:** 建议未来几天关注 ai-site 的重启次数和错误率。

---

**报告生成:** Executor 子代理 @ 2026-04-20 21:05