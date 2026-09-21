# 生产环境危机分析报告
## 7zi.com 错误内容问题 - 2026-04-21

---

## 问题描述

**7zi.com 显示错误内容**: "上海尔虎信息技术有限公司" (旧公司站点)  
**持续时间**: 51+ 小时  
**正确内容应为**: 7zi Studio (Next.js 7zi-frontend)

---

## 根本原因分析

### 当前架构
```
7zi.com (nginx) 
  → 静态文件: /var/www/erhu-brand/ (旧公司站点)
  → 根本不是 Next.js 应用!
  
7zi-main (PM2/Next.js)
  → 监听端口 3000 ✓ 运行中
  → 但 nginx 未代理到此端口
```

### 关键发现

1. **PM2 7zi-main 正常运行** (PID 2697060, 运行 2天, 重启16次)
   - Next.js 16.2.2 运行在 `localhost:3000`
   - 测试 curl `http://127.0.0.1:3000` 返回正确内容

2. **Nginx 配置问题**
   - 7zi.com 的 nginx 配置 (`/etc/nginx/sites-enabled/7zi.com`)
   - 配置了 `root /var/www/erhu-brand` (静态文件目录)
   - 使用 `try_files $uri $uri.html $uri/ =404` (静态文件服务)
   - **没有** `proxy_pass http://127.0.0.1:3000` 

3. **即有静态文件内容**
   - `/var/www/erhu-brand/` 包含旧公司站点内容
   - 显示"上海尔虎信息技术有限公司"

### 时间线
| 时间 | 事件 |
|------|------|
| ~4月18日 | 7zi-main 部署并启动 |
| ~4月18日 | Nginx 未配置代理到 7zi-main |
| 4月18-21日 | 用户访问 7zi.com → nginx 静态文件 (erhu-brand) |

---

## 解决方案

### 方案1: 修改 Nginx 配置 (推荐)
将 7zi.com 的 nginx 配置从静态文件服务改为代理到 Next.js 应用:

```nginx
# 修改 /etc/nginx/sites-enabled/7zi.com
# 将:
#   root /var/www/erhu-brand;
#   try_files $uri $uri.html $uri/ =404;
# 改为:
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 方案2: 备份并替换静态文件目录
将 `/var/www/erhu-brand/` 备份，并将 Next.js 构建文件部署到该目录

---

## 需要在服务器上执行的命令

```bash
# 1. 备份当前 nginx 配置
cp /etc/nginx/sites-enabled/7zi.com /etc/nginx/sites-enabled/7zi.com.backup

# 2. 修改 nginx 配置 (需要编辑文件)
# 编辑 /etc/nginx/sites-enabled/7zi.com
# 在 "location / {" 块中，将 try_files 替换为 proxy_pass

# 3. 测试配置
nginx -t

# 4. 重载 nginx
systemctl reload nginx

# 5. 验证
curl -I https://7zi.com
```

---

## 服务器当前状态

| 项目 | 状态 |
|------|------|
| 磁盘使用率 | 92% (7.6GB 可用) |
| PM2 7zi-main | ✅ 运行中 (端口 3000) |
| PM2 ai-site | ✅ 运行中 (端口 3001) |
| SSH 连接 | ✅ 正常 |
| Nginx | ✅ 运行中 |

---

## 作者
主管 (AI) - 2026-04-21 03:07 UTC
