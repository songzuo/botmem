# 站点健康检查功能

## 概述

此功能提供了完整的站点健康检查能力，包括：
- HTTP 响应状态检查
- 端口监听状态检查
- Nginx 配置验证
- 系统状态监控
- 详细的健康报告生成

## 文件说明

### check_health.js

主要的健康检查脚本，执行以下检查：

1. **系统状态检查**
   - Nginx 服务运行状态
   - 系统负载
   - 磁盘使用情况

2. **Nginx 配置检查**
   - Nginx 配置语法验证
   - Nginx 进程数量
   - 已启用的站点配置数量

3. **端口监听检查**
   - 检查关键端口（80, 443, 3010）是否正常监听

4. **站点健康检查**
   - HTTP 响应状态码
   - 响应时间
   - 响应大小
   - 慢速站点警告（响应时间 > 3 秒）

### check_all.js

更新后的综合检查脚本，支持两种模式：

- **快速检查模式**（默认）：只执行基础的系统检查
- **完整健康检查模式**（--health）：执行完整的站点健康检查

## 使用方法

### 运行健康检查

```bash
# 进入 commander 目录
cd /root/.openclaw/workspace/commander

# 运行完整的健康检查
node check_health.js

# 运行快速检查（只检查系统状态）
node check_all.js

# 运行完整健康检查（包括站点检查）
node check_all.js --health

# 查看帮助
node check_all.js --help
```

### 查看健康报告

健康检查会自动生成 JSON 格式的详细报告：

```bash
cat /root/.openclaw/workspace/commander/health_report.json
```

报告包含以下信息：

```json
{
  "timestamp": "检查时间",
  "system": {
    "nginx": {
      "running": true/false,
      "status": "服务状态"
    },
    "load": "系统负载",
    "disk": "磁盘使用情况"
  },
  "nginx": {
    "configValid": true/false,
    "processCount": 进程数量,
    "siteConfigs": 站点配置数量
  },
  "ports": {
    "80": { "listening": true/false },
    "443": { "listening": true/false },
    "3010": { "listening": true/false }
  },
  "sites": [
    {
      "name": "站点名称",
      "url": "站点URL",
      "statusCode": 200,
      "responseTime": 822,
      "sizeDownload": 226757,
      "healthy": true,
      "slow": false
    }
  ],
  "summary": {
    "total": 总检查项,
    "healthy": 正常数量,
    "unhealthy": 异常数量,
    "warnings": 警告数量
  }
}
```

## 检查的站点列表

当前配置检查以下站点：

- 7zi.com (main) - http://127.0.0.1:3010
- cv.7zi.com - https://cv.7zi.com
- sign.7zi.com - https://sign.7zi.com
- china.7zi.com - https://china.7zi.com
- song.7zi.com - https://song.7zi.com
- ppt.7zi.com - https://ppt.7zi.com
- today.7zi.com - https://today.7zi.com
- wechat.7zi.com - https://wechat.7zi.com
- good.7zi.com - https://good.7zi.com

## 退出代码

- `0` - 所有检查通过，系统健康
- `1` - 检查失败或系统不健康

## 输出格式

脚本使用彩色输出，方便快速识别问题：

- 🟢 绿色 - 正常状态
- 🔴 红色 - 异常状态
- 🟡 黄色 - 警告（如响应慢）
- 🔵 蓝色 - 检查分类标题
- ⚪ 灰色 - 辅助信息

## 依赖

- `ssh2` - SSH 连接库
- `fs` - 文件系统模块（Node.js 内置）

## 注意事项

1. **网络延迟**：HTTP 检查需要实际访问站点，可能受到网络延迟影响
2. **超时设置**：每个 HTTP 检查默认超时时间为 10 秒
3. **权限要求**：需要 SSH 连接到服务器的权限
4. **端口检查**：使用 `ss` 命令检查端口监听状态

## 定期检查建议

建议使用 cron 定期执行健康检查：

```bash
# 每小时检查一次
0 * * * * cd /root/.openclaw/workspace/commander && node check_health.js >> /var/log/health_check.log 2>&1
```

## 集成到现有工作流

健康检查已经集成到 `check_all.js` 中，可以在部署后自动执行验证：

```bash
# 部署所有站点后运行健康检查
node deploy_all_sites.js && node check_all.js --health
```

## 故障排查

### SSH 连接失败

检查网络连接和 SSH 凭据是否正确。

### 站点返回 403

检查 Nginx 配置和目录权限是否正确。

### 端口未监听

检查对应服务是否正常运行，使用 `systemctl status <service>` 查看服务状态。

### 响应慢

检查服务器负载和网络延迟，考虑优化应用性能或增加资源。

## 自定义配置

如需检查更多站点，修改 `check_health.js` 中的 `sites` 数组：

```javascript
const sites = [
  { name: '新站点', url: 'https://newsite.com', ssl: true },
  // 添加更多站点...
];
```

如需检查更多端口，修改 `ports` 数组：

```javascript
const ports = [80, 443, 3010, 8080, 3000];
```