# Commander - SSH 部署管理工具

这是一个用于管理多个远程服务器上 bot 部署的工具集。

## 📋 功能概览

### 检查脚本 (check_*)
- `check_7zi.js` - 检查 7zi 服务器状态
- `check_all.js` - 检查所有服务器
- `check_all_dist.js` - 检查所有 dist 目录
- `check_build_artifacts.js` - 检查构建产物
- `check_dev.js` - 检查开发模式
- `check_dev_mode.js` - 检查开发模式状态
- `check_dir_contents.js` - 检查目录内容
- `check_dist.js` - 检查 dist 目录
- `check_dist2.js` - 检查 dist 目录(备选)
- `check_github.js` - 检查 GitHub 仓库
- `check_health.js` - **站点健康检查**（HTTP状态、端口监听、Nginx配置）
- `check_listen.js` - 检查监听端口
- `check_main.js` - 检查主服务器
- `check_marriage.js` - 检查 marriage 服务
- `check_marriage_log.js` - 检查 marriage 日志
- `check_next.js` - 检查 Next.js 服务
- `check_nginx.js` - 检查 Nginx 配置
- `check_pm2.js` - 检查 PM2 进程
- `check_port.js` - 检查指定端口
- `check_ports.js` - 检查多个端口
- `check_project_build.js` - 检查项目构建
- `check_projects.js` - 检查项目状态
- `check_projects_detail.js` - 检查项目详情
- `check_system.js` - 检查系统状态
- `check_titles.js` - 检查标题
- `check_unzipped.js` - 检查解压文件
- `check_visa_marriage.js` - 检查签证婚姻服务
- `check_web_projects.js` - 检查 Web 项目

### 部署脚本 (deploy_*)
- `deploy_all.js` - 部署所有服务
- `deploy_all_sites.js` - 部署所有站点
- `deploy_available.js` - 部署可用服务
- `deploy_visa.js` - 部署签证服务

### 启动/停止脚本 (start_*/stop_*/kill_*)
- `start_main.js` - 启动主服务
- `start_marriage.js` - 启动 marriage 服务
- `start_visa.js` - 启动签证服务
- `stop_dev.js` - 停止开发进程
- `stop_dev_processes.js` - 停止开发进程组
- `kill_all.js` - 终止所有进程
- `kill_dev.js` - 终止开发进程

### 验证脚本 (verify_*)
- `verify.js` - 基础验证
- `verify_all.js` - 全面验证
- `verify_marriage.js` - 验证 marriage 服务
- `verify_visa.js` - 验证签证服务

### Nginx 配置脚本 (add_*.js)
- `add_marriage_nginx.js` - 添加 marriage 子域名 Nginx 配置
- `add_visa_nginx.js` - 添加 visa 子域名 Nginx 配置
- `fix_nginx.js` - 修复 Nginx 配置
- `setup_nginx.js` - 设置 Nginx

### SSH 管理脚本 (ssh_*.js)
- `ssh_apply_patch.js` - 上传并应用补丁文件到远程服务器
- `ssh_check_repo.js` - 检查远程 git 仓库状态
- `ssh_commit_file.js` - 创建、提交并推送文件到 git
- `ssh_project_check.js` - 综合项目检查（目录、进程、日志等）
- `ssh_server_check.js` - 检查服务器端口和进程状态

### 辅助脚本
- `cleanup.js` - 清理临时文件
- `final_check.js` - 最终检查
- `final_verify.js` - 最终验证
- `find_dist.js` - 查找所有 dist 目录
- `find_dist2.js` - 查找 dist 目录（备选方法）
- `quick_check.js` - 快速检查
- `restart_main.js` - 重启主服务
- `temp_check_dev.js` - 检查开发模式进程
- `test_ports.js` - 测试各端口返回的 HTML
- `unzip_projects.js` - 解压项目文件

## 📁 目录结构

```
commander/
├── agents/                    # Agent 相关文件
├── memory/                    # 记忆存储
├── tests/                     # 测试文件
├── utils/                     # 工具函数
├── check_*.js                 # 各种检查脚本
├── deploy_*.js                # 部署脚本
├── start_*.js                 # 启动脚本
├── stop_*.js                  # 停止脚本
├── kill_*.js                  # 终止脚本
├── verify_*.js                # 验证脚本
├── config.json.example        # 配置文件示例
├── health_report.json         # 健康检查报告
├── package.json               # 项目依赖配置
└── README.md                  # 本文档
```

## 🚀 快速开始

### 1. 环境准备

确保已安装 Node.js 环境：

```bash
node --version  # 应显示 v14 或更高版本
```

### 2. 安装依赖

```bash
cd /root/.openclaw/workspace/commander
npm install
```

### 3. 配置服务器

复制配置文件示例并根据实际情况修改：

```bash
cp config.json.example config.json
nano config.json  # 或使用你喜欢的编辑器
```

编辑 `config.json`，填入你的服务器信息：

```json
{
  "host": "your-server-hostname.com",
  "port": 22,
  "username": "your-username",
  "password": "your-password-here",
  "readyTimeout": 30000,
  "compress": true
}
```

### 4. 运行检查

执行健康检查脚本：

```bash
node check_health.js
```

该脚本会：
- 检查所有部署站点的 HTTP 响应状态
- 检查站点端口是否正常监听
- 检查 Nginx 配置是否正确
- 输出详细的健康报告到 `health_report.json`

### 5. 其他常用命令

```bash
# 检查所有服务器
node check_all.js

# 部署所有服务
node deploy_all.js

# 全面验证
node verify_all.js

# 快速检查
node quick_check.js
```

## ⚙️ 配置说明

### config.json 配置文件

配置文件位于项目根目录，包含以下字段：

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `host` | string | 是 | - | 服务器主机名或 IP 地址 |
| `port` | number | 否 | 22 | SSH 端口号 |
| `username` | string | 是 | - | SSH 登录用户名 |
| `password` | string | 是 | - | SSH 登录密码 |
| `readyTimeout` | number | 否 | 30000 | SSH 连接超时时间（毫秒） |
| `compress` | boolean | 否 | true | 是否启用 SSH 压缩 |

### 安全提示

⚠️ **重要**：`config.json` 包含敏感信息（服务器密码），请确保：
- 不要将 `config.json` 提交到版本控制系统
- 使用 `.gitignore` 忽略该文件（已配置）
- 设置适当的文件权限：`chmod 600 config.json`

### 配置文件示例

完整示例请参考 `config.json.example`：

```json
{
  "host": "your-server-hostname.com",
  "port": 22,
  "username": "your-username",
  "password": "your-password-here",
  "readyTimeout": 30000,
  "compress": true
}
```

## 📦 依赖

- `ssh2` - SSH 连接库
- 其他依赖详见 `package.json`

## 💡 使用技巧

### 健康检查脚本详解

`check_health.js` 是一个综合性的健康检查工具，主要功能：

1. **HTTP 状态检查**：访问所有部署的站点，检查 HTTP 响应状态码
2. **端口监听检查**：验证服务端口是否正常监听
3. **Nginx 配置检查**：确认 Nginx 配置语法和状态
4. **报告生成**：生成 `health_report.json`，包含详细的检查结果

运行后会输出彩色状态标识：
- ✓ 绿色：检查通过
- ✗ 红色：检查失败
- ⚠ 黄色：警告

### 常见问题

**Q: 提示 "配置文件不存在"**
A: 复制 `config.json.example` 为 `config.json` 并填写正确的服务器信息。

**Q: SSH 连接超时**
A: 在 `config.json` 中增加 `readyTimeout` 值，默认为 30000 毫秒（30秒）。

**Q: 权限拒绝错误**
A: 检查 SSH 用户名和密码是否正确，确认服务器 SSH 服务正常运行。

## 📝 许可证

本项目为内部使用工具。

---

如有问题或建议，请联系项目维护者。