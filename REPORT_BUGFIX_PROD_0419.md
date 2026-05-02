# 🐛 Bug Fix Report: 7zi.com 显示旧内容 "上海尔虎信息技术有限公司"

**日期:** 2026-04-19 19:03 GMT+2  
**状态:** ✅ 诊断完成 | ⚠️ 修复待执行（服务器 SSH 连接不稳定）  
**执行者:** Executor (子代理)  
**报告文件:** `/root/.openclaw/workspace/REPORT_BUGFIX_PROD_0419.md`

---

## 🔍 问题诊断

### 症状
- **7zi.com** 首页显示: "上海尔虎信息技术有限公司 - AI技术赋能企业数字化转型"
- **预期显示:** "7zi Studio" 相关内容

### 根本原因 ✅

**Nginx 配置使用静态文件而非 Next.js 应用**

7zi.com 的 HTTPS server 块配置:
```nginx
server {
    listen 443 ssl http2;
    server_name 7zi.com;
    root /var/www/erhu-brand;        # ← 使用旧静态文件
    index index.html;
    
    location / {
        try_files $uri $uri.html $uri/ =404;  # ← 不代理到 Next.js
    }
}
```

**实际文件内容** (`/var/www/erhu-brand/index.html`):
```html
<title>上海尔虎信息技术有限公司 - AI技术赋能企业数字化转型</title>
<meta name="description" content="上海尔虎信息技术有限公司（7zi.com）成立于2002年...">
```

### 版本状态

| 组件 | 版本 | 位置 |
|------|------|------|
| Git repo | v1.14.0 (`428ea2bf9`) | `/root/7zi-project` |
| Deployed Next.js | v1.3.0 | `/var/www/7zi/7zi-frontend` |
| PM2 运行版本 | v1.3.0 | port 3000 |
| 静态文件 | 旧内容 | `/var/www/erhu-brand` |

### 端口检查结果

| 检查点 | 标题 |
|--------|------|
| `curl http://127.0.0.1:3000` | "7zi Frontend - Next.js 图片优化示例" |
| `curl https://127.0.0.1 -H 'Host: 7zi.com'` | "上海尔虎信息技术有限公司" |
| Nginx static `/var/www/erhu-brand/` | "上海尔虎信息技术有限公司" |

---

## 🔧 修复方案

### 方案 A: 修改 Nginx 配置（立即执行）

**步骤:**
```bash
# 1. SSH 到服务器
sshpass -p 'ge20993344$ZZ' ssh root@165.99.43.61

# 2. 备份 Nginx 配置
cp /etc/nginx/sites-enabled/7zi-frontend.conf /etc/nginx/sites-enabled/7zi-frontend.conf.bak.$(date +%Y%m%d)

# 3. 找到 7zi.com server 块，修改 location / 块:
#    将:
#      location / {
#          try_files $uri $uri.html $uri/ =404;
#      }
#    改为:
#      location / {
#          proxy_pass http://127.0.0.1:3000;
#          proxy_http_version 1.1;
#          proxy_set_header Host $host;
#          proxy_set_header X-Real-IP $remote_addr;
#          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#          proxy_set_header X-Forwarded-Proto $scheme;
#      }

# 4. 测试并重载 Nginx
nginx -t && nginx -s reload

# 5. 验证
curl -s https://7zi.com | grep '<title>'
```

### 方案 B: 重新构建 + 完整部署（推荐）

```bash
# 1. SSH 到服务器
sshpass -p 'ge20993344$ZZ' ssh root@165.99.43.61

# 2. 进入项目目录
cd /root/7zi-project

# 3. 拉取最新代码并构建
git pull origin main
npm install
npm run build

# 4. 重启 PM2
pm2 restart 7zi-main

# 5. 验证 port 3000 内容
curl -s http://127.0.0.1:3000 | grep '<title>'

# 6. 执行方案 A 的 Nginx 修改
```

---

## ⚠️ 问题

**SSH 连接不稳定:** 诊断过程中 SSH 能连接，但尝试构建时连接超时。服务器可能负载高或有问题。

**服务器状态:** 
- SSH 端口 22 开放
- 但 SSH 连接在 banner exchange 时超时
- PM2 显示 7zi-main 重启 16 次，可能有问题

---

## 📋 检查清单

- [x] SSH 连接到服务器
- [x] 确认 PM2 运行状态
- [x] 检查 Nginx 配置
- [x] 检查静态文件内容
- [x] 检查端口 3000 内容
- [x] 确认 Git 版本
- [ ] 修改 Nginx 配置
- [ ] 重新构建 Next.js（如果需要）
- [ ] 验证修复结果

---

## 📁 相关文件

- Nginx 配置: `/etc/nginx/sites-enabled/7zi-frontend.conf`
- 错误静态文件: `/var/www/erhu-brand/index.html`
- Next.js 应用: `/var/www/7zi/7zi-frontend/`
- Git 项目: `/root/7zi-project`
- PM2 日志: `/root/.pm2/logs/7zi-main-*.log`

---

## ⏭️ 下一步

1. **如果能 SSH 连接:** 执行方案 A（快速修复）或方案 B（完整修复）
2. **如果 SSH 仍然不稳定:** 可能需要通过其他方式（如控制台）访问服务器
3. **修复后验证:** 访问 https://7zi.com 确认标题为 "7zi Studio" 相关内容

---

**报告生成:** 2026-04-19 19:15 GMT+2  
**Executor:** Bug Fix Subagent
