# 部署检查清单 v1.2.0
# Deployment Checklist for 7zi.com
**Date:** 2026-03-27
**Version:** 1.2.0
**Target Server:** 165.99.43.61 (7zi.com)

---

## 📋 1. 版本变更检查

### ✅ CHANGELOG.md 最新内容
**当前版本:** v1.2.0 (2026-03-26)

**主要更新：**
- 🎉 性能监控系统 - Web Vitals Hook + 6核心指标实时追踪
- 🌍 i18n 扩展 - 支持 7 种语言（zh, en, ja, ko, es, fr, de）
- 🖼️ 图片优化 - AVIF/WebP 支持，预期 CLS 减少 30-50%
- 🧹 代码清理 - 删除约 8,300 行死代码（65+ 文件）
- 📚 文档完善 - 42 个新 API 端点文档，总计 79+ endpoints
- ⚡ 性能提升 - 数据库查询优化 85-90%，包体积减少 ~2.65 MB

**重要变更：**
- API 文档更新至 v1.2.0
- 测试通过率提升至 ~94.2% (279/296+)
- Three.js、ExcelJS 改为动态导入，减少初始包体积

**⚠️ 注意事项：**
- Redis 配置需要验证（生产环境应启用 `ENABLE_REDIS_RATE_LIMIT=true`）
- 图片优化可能需要 CDN 配置更新
- 多语言支持需要确保翻译文件完整性

---

## 📦 2. package.json 版本验证

### ✅ 当前版本信息
```json
{
  "name": "7zi-frontend",
  "version": "1.2.0",
  "private": true
}
```

### ✅ 关键依赖版本
| 依赖 | 版本 | 状态 |
|------|------|------|
| Next.js | 16.2.1 | ✅ 最新稳定版 |
| React | 19.2.4 | ✅ 最新稳定版 |
| TypeScript | 5.x | ✅ |
| Tailwind CSS | 4 | ✅ |
| Socket.IO | 4.8.3 | ✅ |
| Vitest | 4.1.0 | ✅ |
| Playwright | 1.58.2 | ✅ |

### ✅ 构建脚本
```json
{
  "dev": "next dev --turbopack",
  "build": "NODE_ENV=production next build",
  "start": "next start",
  "test": "NODE_OPTIONS='--max-old-space-size=4096' vitest",
  "test:e2e": "playwright test"
}
```

**✅ 结论:** 所有依赖版本符合生产环境要求，无需更新。

---

## 🔧 3. 环境变量配置检查

### ✅ .env.example 存在且完整
**状态:** ✅ 配置文件存在，包含所有必要配置项

### ⚠️ 生产环境必须配置的环境变量

**基础配置（必须）：**
```bash
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

**数据库配置（必须）：**
```bash
DATABASE_URL=file:./data/7zi.db
```

**限流配置（必须）：**
```bash
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_BY=ip
ENABLE_REDIS_RATE_LIMIT=true
REDIS_URL=redis://:password@localhost:6379/0
```

**安全配置（必须）：**
```bash
NEXT_PUBLIC_ALLOWED_ORIGINS=https://7zi.com,https://www.7zi.com
```

**API 配置（必须）：**
```bash
NEXT_PUBLIC_API_URL=https://7zi.com/api
NEXT_PUBLIC_API_TIMEOUT=30000
```

**邮件服务（如需发送邮件）：**
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
CONTACT_EMAIL=business@7zi.studio
FROM_EMAIL=noreply@7zi.studio
```

**⚠️ 部署前必须检查：**
1. [ ] Redis 连接配置是否正确
2. [ ] 数据库路径是否指向正确的位置
3. [ ] 限流配置是否符合预期
4. [ ] CORS 配置是否包含所有域名
5. [ ] API URL 是否为生产环境 URL

---

## 🗄️ 4. 数据库迁移状态

### ✅ 迁移系统检查

**迁移文件位置:** `/root/.openclaw/workspace/src/lib/db/migrations.ts`

**当前最新迁移版本:** v6

**迁移历史：**
| 版本 | 名称 | 说明 |
|------|------|------|
| v1 | initial_schema | 初始架构（已处理） |
| v2 | add_composite_indexes | 添加复合索引 |
| v3 | add_critical_indexes | 添加关键性能索引 |
| v4 | add_user_preferences | 用户偏好表 |
| v5 | add_audit_logs | 审计日志表 |
| v6 | add_feedback_ratings_indexes | 反馈和评分性能索引 |

### ✅ 迁移前检查清单
1. [ ] 备份现有数据库
   ```bash
   cp data/7zi.db data/7zi.db.backup.$(date +%Y%m%d)
   ```

2. [ ] 检查当前迁移版本
   ```bash
   pnpm run db:version  # 或检查 migrations 表
   ```

3. [ ] 运行待执行迁移
   ```bash
   # 如果迁移系统已集成到启动流程，应用启动时会自动运行
   # 否则手动执行迁移脚本
   pnpm run db:migrate
   ```

4. [ ] 验证迁移结果
   ```bash
   # 检查所有表是否创建成功
   # 检查所有索引是否创建成功
   # 检查数据完整性
   ```

5. [ ] 数据库优化（可选但推荐）
   ```bash
   pnpm run db:optimize  # 运行 VACUUM 和 ANALYZE
   ```

### ✅ 迁移脚本功能
- ✅ 自动检测当前版本
- ✅ 自动运行待执行迁移
- ✅ 迁移失败自动回滚
- ✅ 数据库健康检查
- ✅ 慢查询分析
- ✅ 清理旧数据

---

## 🚀 5. 部署前必须完成的 5 件事

### 1️⃣ 运行完整测试套件
```bash
# 单元测试
pnpm run test:run

# E2E 测试
pnpm run test:e2e

# 类型检查
pnpm run type-check

# 代码检查
pnpm run lint
```

**✅ 通过标准：**
- 所有单元测试通过（预期通过率 > 94%）
- 关键 E2E 测试通过
- 无 TypeScript 类型错误
- 无 ESLint 错误或警告

---

### 2️⃣ 构建生产版本
```bash
# 设置环境变量
export NODE_ENV=production

# 执行构建
pnpm run build

# 验证构建输出
ls -lh .next/
```

**✅ 检查项：**
- [ ] 构建成功无错误
- [ ] .next/ 目录大小合理（预期 < 300MB）
- [ ] 无性能预算警告（maxEntrypointSize 300KB, maxAssetSize 250KB）
- [ ] 静态资源生成成功

---

### 3️⃣ 备份生产数据
```bash
# 备份数据库
ssh root@7zi.com 'cd /app && cp data/7zi.db data/7zi.db.backup.$(date +%Y%m%d_%H%M%S)'

# 备份上传文件（如果有）
ssh root@7zi.com 'cd /app && tar -czf uploads-backup-$(date +%Y%m%d).tar.gz public/uploads/'

# 备份当前部署
ssh root@7zi.com 'cd /app && tar -czf deployment-backup-$(date +%Y%m%d).tar.gz .next/'
```

**✅ 验证备份：**
- [ ] 数据库备份文件存在
- [ ] 备份文件大小合理
- [ ] 可选：验证备份完整性

---

### 4️⃣ 更新服务器代码
```bash
# SSH 连接到服务器
ssh root@7zi.com

# 进入项目目录
cd /app/7zi-frontend

# 拉取最新代码
git pull origin main

# 安装依赖
pnpm install --prod=false  # 安装所有依赖（包括 dev 依赖）

# 构建生产版本
pnpm run build

# 重启服务
pm2 restart 7zi-web  # 或使用 systemd
```

**⚠️ 注意事项：**
- 使用零停机部署策略（蓝绿部署或滚动更新）
- 确保 Redis 服务正在运行
- 验证数据库迁移自动执行

---

### 5️⃣ 验证部署成功
```bash
# 检查服务状态
pm2 status  # 或 systemctl status 7zi-web

# 检查日志
pm2 logs 7zi-web --lines 50

# 测试健康检查端点
curl https://7zi.com/api/health

# 测试 API 响应
curl https://7zi.com/api/v1/agents
```

**✅ 验证清单：**
- [ ] 服务运行正常（进程存在，无崩溃）
- [ ] 无错误日志（尤其是数据库连接、Redis 连接）
- [ ] 健康检查返回 200
- [ ] 关键 API 响应正常
- [ ] 前端页面加载正常
- [ ] WebSocket 连接正常
- [ ] 性能指标正常（TTFB < 500ms）

---

## 🔍 6. 部署后验证

### ✅ 功能验证
- [ ] 用户登录/注册
- [ ] 任务管理
- [ ] 实时通知（WebSocket）
- [ ] 文件上传/下载
- [ ] 多语言切换
- [ ] 主题切换（暗色模式）

### ✅ 性能验证
- [ ] 首页加载时间 < 2s
- [ ] API 响应时间 < 300ms
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] 无内存泄漏（监控 24h）

### ✅ 安全验证
- [ ] HTTPS 正常工作
- [ ] CSP 头部正确配置
- [ ] SQL 注入防护生效
- [ ] XSS 防护生效
- [ ] 限流规则生效

### ✅ 监控验证
- [ ] Sentry 错误追踪正常
- [ ] 性能监控数据上报正常
- [ ] 日志记录正常
- [ ] 数据库连接池正常

---

## 📝 7. 回滚计划

### ⚠️ 回滚触发条件
- 部署后 30 分钟内出现严重错误
- 关键功能不可用
- 性能严重下降（>50%）
- 安全漏洞

### 🔄 回滚步骤
```bash
# 1. 停止当前服务
pm2 stop 7zi-web

# 2. 恢复之前的部署
git reset --hard HEAD~1
pnpm install
pnpm run build

# 3. 恢复数据库（如果需要）
cp data/7zi.db.backup.YYYYMMDD data/7zi.db

# 4. 重启服务
pm2 restart 7zi-web

# 5. 验证
curl https://7zi.com/api/health
```

---

## 📊 8. 部署记录

**部署人员:** _________________________
**部署时间:** _________________________
**部署版本:** v1.2.0
**测试结果:** _________________________
**是否回滚:** _________________________
**备注:** _________________________

---

## ✅ 最终检查清单

**部署前：**
- [ ] CHANGELOG.md 已审查
- [ ] package.json 版本已验证
- [ ] .env 配置已准备
- [ ] 数据库迁移已验证
- [ ] 完整测试已通过
- [ ] 生产版本已构建
- [ ] 数据已备份
- [ ] 回滚计划已准备

**部署中：**
- [ ] 代码已更新
- [ ] 依赖已安装
- [ ] 数据库迁移已执行
- [ ] 服务已重启
- [ ] 日志已检查

**部署后：**
- [ ] 健康检查通过
- [ ] 功能验证通过
- [ ] 性能验证通过
- [ ] 安全验证通过
- [ ] 监控验证通过

---

**✅ 所有检查项完成后，即可标记部署为成功！**

---

*文档生成时间: 2026-03-27*
*文档版本: 1.0.0*
