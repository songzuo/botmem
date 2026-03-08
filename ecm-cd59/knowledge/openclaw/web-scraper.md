# 网络与抓取指南

> 处理反爬虫网站、科学上网和代理配置

## 网络可达性测试

### 测试命令

```bash
# 基本连接测试
curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 https://目标网站

# 批量测试
for domain in "docs.openclaw.ai" "github.com" "www.baidu.com" "google.com"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "https://$domain" 2>&1)
  echo "$domain: $code"
done
```

### 当前环境状态（2026-03-05）

| 网站 | 状态 | 说明 |
|------|------|------|
| docs.openclaw.ai | ✅ 200 | 可直接访问 |
| github.com | ✅ 200 | 可直接访问 |
| www.baidu.com | ✅ 200 | 可直接访问 |
| api.openai.com | ❌ 超时 | 需要代理 |
| google.com | ❌ 超时 | 需要代理 |

---

## 代理配置

### 环境变量方式

```bash
# HTTP/HTTPS 代理
export HTTP_PROXY=http://127.0.0.1:8080
export HTTPS_PROXY=http://127.0.0.1:8080

# SOCKS5 代理
export SOCKS_PROXY=socks5://127.0.0.1:1080
export ALL_PROXY=socks5://127.0.0.1:1080
```

### curl 使用代理

```bash
# HTTP 代理
curl -x http://127.0.0.1:8080 https://目标网站

# SOCKS5 代理
curl -x socks5://127.0.0.1:1080 https://目标网站
```

---

## 反爬虫绕过技术

### 1. 修改 User-Agent

```bash
# 移动端
curl -A "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15" 目标URL

# 桌面端
curl -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" 目标URL
```

### 2. 添加 Headers

```bash
curl -H "Accept-Language: zh-CN,zh;q=0.9,en;q=0.8" \
     -H "Referer: https://www.google.com/" \
     目标URL
```

### 3. 处理 Cookie

```bash
# 保存 Cookie
curl -c cookies.txt 目标URL
# 使用 Cookie
curl -b cookies.txt 目标URL
```

### 4. 跟随重定向

```bash
curl -L 目标URL
```

---

## 常见网站处理

### 可直接访问

- docs.openclaw.ai
- github.com
- www.baidu.com
- npmjs.com

### 需要代理

- google.com
- api.openai.com
- youtube.com
- twitter.com

### 反爬虫网站（可能需要手动复制）

| 网站 | 说明 |
|------|------|
| 知乎 | 反爬虫+JS渲染，建议代理或手动复制 |
| ima笔记 | 纯客户端SPA，需要手动复制 |
| 微信公众号 | 反爬虫，建议手动复制 |

---

## 备选方案

当技术手段都无法解决时：

1. **请用户导出内容** - 在目标平台点击导出/复制
2. **请用户截图** - 可尝试 OCR 识别
3. **用户中转** - 用户在浏览器复制后直接发送给 OpenClaw

---

*详情见技能: web-scraper*
