# 7zi.com 危机修复报告
## 2026-04-21 15:45 UTC

---

## 问题概述

**问题**: 7zi.com 显示旧公司站点"上海尔虎信息技术有限公司"，而非 7zi Studio Next.js 应用  
**持续时间**: 51+ 小时  
**根本原因**: nginx 配置错误代理到 3001 端口（ai-site），而非 3000 端口（7zi-main）

---

## 执行的操作

### 1. 诊断确认

通过 SSH 连接到 165.99.43.61，确认：
- PM2 7zi-main 正常运行在 `127.0.0.1:3000` ✅
- PM2 ai-site 正常运行在 `127.0.0.1:3001` ✅
- nginx 配置 `/etc/nginx/sites-enabled/7zi.com` 的主路由 location / 代理到 `127.0.0.1:3001`（错误端口）

### 2. 修复操作

**执行的命令**:
```bash
# 备份原配置
cp /etc/nginx/sites-enabled/7zi.com /etc/nginx/sites-enabled/7zi.com.backup.202604211545

# 修复代理端口（3001 -> 3000）
sed -i 's|proxy_pass http://127.0.0.1:3001;|proxy_pass http://127.0.0.1:3000;|g' /etc/nginx/sites-enabled/7zi.com

# 测试配置
nginx -t

# 重载 nginx
systemctl reload nginx
```

**配置变更** (line 117):
```diff
- proxy_pass http://127.0.0.1:3001;
+ proxy_pass http://127.0.0.1:3000;
```

### 3. 验证结果

- **curl https://7zi.com**: 返回 Next.js 页面 HTML ✅
- **web_fetch https://7zi.com**: 标题 "7zi Frontend - Next.js 图片优化示例" ✅
- **HTTP 状态码**: 200 ✅

---

## 最终状态

| 项目 | 状态 |
|------|------|
| nginx 配置 | ✅ 已修复 (代理到 3000) |
| PM2 7zi-main | ✅ 运行中 (端口 3000) |
| 7zi.com 访问 | ✅ 返回正确 Next.js 内容 |
| SSL 证书 | ✅ 正常 |
| nginx reload | ✅ 执行成功 |

---

## 技术说明

**修复前**:
```
用户 -> nginx (7zi.com) -> proxy_pass 127.0.0.1:3001 (ai-site/旧NextJS)
```

**修复后**:
```
用户 -> nginx (7zi.com) -> proxy_pass 127.0.0.1:3000 (7zi-main/正确应用)
```

---

## 作者
子代理 (fix-nginx-7zi-crisis) - 2026-04-21 15:45 UTC