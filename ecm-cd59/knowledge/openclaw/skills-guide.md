# 技能安装与使用指南

> 本指南记录已安装的技能和工具

---

## 已安装技能

### 1. agent-browser

**功能**：无头浏览器自动化，可以访问网页、点击、输入、截图等

**安装**：
```bash
npm install -g agent-browser
npx playwright install chromium
```

**常用命令**：
```bash
# 打开网页
agent-browser open <URL>

# 获取页面快照（交互元素）
agent-browser snapshot -i

# 点击元素
agent-browser click @e1

# 输入文字
agent-browser fill @e2 "文字"

# 截图
agent-browser screenshot

# 等待元素
agent-browser wait @e1

# 获取页面标题
agent-browser get title

# 获取当前 URL
agent-browser get url
```

**使用场景**：
- 访问反爬虫保护的网站（如知乎）
- 自动化网页操作
- 网页内容抓取
- 截图保存

---

## 技能安装命令

### 通过 ClawHub 安装

```bash
# 搜索技能
npx clawhub@latest search <关键词>

# 安装技能
npx clawhub@latest install <技能名>

# 更新技能
npx clawhub@latest update

# 列出已安装技能
npx clawhub@latest list
```

### 常用技能推荐

| 技能名 | 功能 |
|--------|------|
| agent-browser | 通用网页浏览器自动化 |
| coding-agent | 代码代理（Codex、Claude Code） |
| clawhub | 技能管理 |
| weather | 天气查询 |

---

## 备选方案：微信公众号抓取

如果需要抓取微信公众号文章，可以考虑：
1. **wechat-article-fetcher** - 专门的微信公众号抓取插件
2. **手动复制** - 用户在微信中复制文章链接和内容

---

## 注意事项

1. **Playwright 浏览器安装**可能需要较长时间
2. **反爬虫网站**可能需要配合代理使用
3. **ima笔记**等纯客户端 SPA 可能仍然无法抓取

---

*最后更新: 2026-03-05*
