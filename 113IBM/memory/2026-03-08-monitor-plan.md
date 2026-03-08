# 服务器监控仪表板技术方案

**生成时间**: 2026-03-08 17:41 GMT+8
**任务**: 为 bot2-bot7 六台 Linux 服务器创建实时监控仪表板
**作者**: Claw AI Assistant

---

## 📊 现有工具清单

### ✅ 已有工具

1. **check_servers.ps1** (C:\Users\Administrator\.openclaw\workspace\check_servers.ps1)
   - 功能: 基础服务器连接检查
   - 支持服务器: bot2, bot3, bot4, bot5, bot6, bot7
   - 检测内容: SSH 连接、系统信息 (uname, uptime, free, df)、服务状态 (freqtrade, postgresql)
   - 局限性:
     - 仅手动执行,无定时任务
     - 无数据持久化
     - 无可视化界面
     - 无告警机制
     - 不支持历史趋势分析

### ❌ 缺失工具

- ❌ 无 Prometheus (时序数据库)
- ❌ 无 Grafana (可视化仪表板)
- ❌ 无 Zabbix (完整监控方案)
- ❌ 无 AlertManager (告警管理)
- ❌ 无数据持久化存储
- ❌ 无 Web 界面
- ❌ 无自动化告警通知

---

## 🎯 推荐监控方案 (技术栈选型)

### 方案 A: 轻量级方案 (推荐快速实施)

**技术栈**:
- **Node Exporter**: 服务器指标采集 (CPU、内存、磁盘、网络)
- **Prometheus**: 时序数据存储和查询
- **Grafana**: 可视化仪表板
- **AlertManager**: 告警规则和通知 (可选)

**优势**:
- ✅ 部署简单,学习成本低
- ✅ 业界标准,社区活跃
- ✅ 丰富的 Grafana 面板模板
- ✅ 完美支持 Freqtrade 监控 (通过 Prometheus Pushgateway)

**劣势**:
- ⚠️ 需要在每台服务器安装 Node Exporter
- ⚠️ Prometheus 单点故障 (需后续优化)

---

### 方案 B: 中等复杂度方案 (推荐长期使用)

**技术栈**:
- **方案 A 全部组件** +
- **Docker Compose**: 一键部署和管理
- **Nginx**: 反向代理和 SSL
- **Telegram/飞书 API**: 告警通知集成
- **Custom Exporters**: Freqtrade 专用指标采集

**优势**:
- ✅ 容器化部署,易于迁移和备份
- ✅ 支持多环境 (开发/测试/生产)
- ✅ 集成现有飞书生态
- ✅ 支持业务指标监控 (Freqtrade PnL, 交易量等)

**劣势**:
- ⚠️ 配置较复杂
- ⚠️ 需要 Docker 知识

---

### 方案 C: 企业级方案 (不推荐当前阶段)

**技术栈**:
- **Zabbix** 或 **Nagios** + **InfluxDB** + **Grafana**

**评估**:
- ❌ 对于 6 台服务器过于重量级
- ❌ 学习成本高,配置复杂
- ❌ 不适合 Freqtrade 这种定制化业务场景

---

## 🚀 推荐实施步骤 (基于方案 B)

### 阶段 1: 基础环境准备 (1-2 小时)

#### 1.1 在 Windows 本机 (监控中心) 准备 Docker 环境

```powershell
# 检查 Docker 是否已安装
docker --version
docker-compose --version

# 如果未安装,从 https://www.docker.com/products/docker-desktop 下载安装
```

#### 1.2 创建监控项目目录

```powershell
# 在本地创建项目目录
mkdir E:\claw\ClawX\server-monitor
cd E:\claw\ClawX\server-monitor

# 创建子目录
mkdir -p prometheus/data
mkdir -p grafana/data
mkdir -p alertmanager/data
mkdir -p config
```

---

### 阶段 2: 配置 Prometheus (1-2 小时)

#### 2.1 创建 Prometheus 配置文件

**文件**: `E:\claw\ClawX\server-monitor\config\prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'freqtrade-cluster'
    environment: 'production'

# 告警规则文件
rule_files:
  - "alerts/*.yml"

# 告警管理器
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

# 数据采集目标
scrape_configs:
  # Prometheus 自监控
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Node Exporter (系统指标)
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['bot2:9100', 'bot3:9100', 'bot4:9100', 'bot5:9100', 'bot6:9100', 'bot7:9100']
        labels:
          group: 'freqtrade-servers'

  # Freqtrade Pushgateway (业务指标)
  - job_name: 'freqtrade-pushgateway'
    static_configs:
      - targets: ['pushgateway:9091']
        labels:
          service: 'freqtrade'

  # Pushgateway 自监控
  - job_name: 'pushgateway'
    static_configs:
      - targets: ['pushgateway:9091']
```

#### 2.2 创建告警规则

**文件**: `E:\claw\ClawX\server-monitor\config\alerts\system.yml`

```yaml
groups:
  - name: system_alerts
    interval: 30s
    rules:
      # CPU 使用率告警
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
          service: freqtrade
        annotations:
          summary: "服务器 {{ $labels.instance }} CPU 使用率过高"
          description: "CPU 使用率持续 5 分钟超过 80% (当前: {{ $value }}%)"

      # 内存使用率告警
      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: warning
          service: freqtrade
        annotations:
          summary: "服务器 {{ $labels.instance }} 内存使用率过高"
          description: "内存使用率持续 5 分钟超过 85% (当前: {{ $value }}%)"

      # 磁盘使用率告警
      - alert: HighDiskUsage
        expr: (node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100 > 80
        for: 5m
        labels:
          severity: warning
          service: freqtrade
        annotations:
          summary: "服务器 {{ $labels.instance }} 磁盘使用率过高"
          description: "磁盘 {{ $labels.mountpoint }} 使用率超过 80% (当前: {{ $value }}%)"

      # 磁盘空间不足严重告警
      - alert: DiskSpaceCritical
        expr: (node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100 > 90
        for: 2m
        labels:
          severity: critical
          service: freqtrade
        annotations:
          summary: "服务器 {{ $labels.instance }} 磁盘空间严重不足"
          description: "磁盘 {{ $labels.mountpoint }} 使用率超过 90% (当前: {{ $value }}%)"

      # 服务器离线告警
      - alert: ServerDown
        expr: up == 0
        for: 2m
        labels:
          severity: critical
          service: freqtrade
        annotations:
          summary: "服务器 {{ $labels.instance }} 离线"
          description: "服务器 {{ $labels.instance }} 已离线超过 2 分钟"

      # Freqtrade 服务停止告警
      - alert: FreqtradeServiceDown
        expr: up{job="freqtrade-pushgateway"} == 0
        for: 5m
        labels:
          severity: critical
          service: freqtrade
        annotations:
          summary: "Freqtrade 服务停止"
          description: "服务器 {{ $labels.instance }} 的 Freqtrade 服务已停止"

      # 服务器负载过高
      - alert: HighLoadAverage
        expr: node_load1 / count by(instance) (node_cpu_seconds_total{mode="idle"}) > 2
        for: 5m
        labels:
          severity: warning
          service: freqtrade
        annotations:
          summary: "服务器 {{ $labels.instance }} 负载过高"
          description: "1 分钟负载平均值为 {{ $value }}"
```

---

### 阶段 3: 配置 Docker Compose (30 分钟)

**文件**: `E:\claw\ClawX\server-monitor\docker-compose.yml`

```yaml
version: '3.8'

services:
  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: freqtrade-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./config/alerts:/etc/prometheus/alerts
      - ./prometheus/data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
    restart: unless-stopped
    networks:
      - monitoring

  # Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: freqtrade-grafana
    ports:
      - "3000:3000"
    volumes:
      - ./grafana/data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=ClawX2026!
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
      - GF_SERVER_ROOT_URL=http://localhost:3000
    restart: unless-stopped
    networks:
      - monitoring
    depends_on:
      - prometheus

  # AlertManager
  alertmanager:
    image: prom/alertmanager:latest
    container_name: freqtrade-alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./config/alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - ./alertmanager/data:/alertmanager
    restart: unless-stopped
    networks:
      - monitoring
    depends_on:
      - prometheus

  # Pushgateway (用于 Freqtrade 指标推送)
  pushgateway:
    image: prom/pushgateway:latest
    container_name: freqtrade-pushgateway
    ports:
      - "9091:9091"
    restart: unless-stopped
    networks:
      - monitoring

networks:
  monitoring:
    driver: bridge
```

#### 3.1 创建 AlertManager 配置

**文件**: `E:\claw\ClawX\server-monitor\config\alertmanager.yml`

```yaml
global:
  resolve_timeout: 5m

route:
  receiver: 'default-receiver'
  group_by: ['alertname', 'severity', 'instance']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  routes:
    # 严重告警立即发送
    - match:
        severity: critical
      receiver: 'critical-receiver'
      continue: true

    # 警告告警
    - match:
        severity: warning
      receiver: 'warning-receiver'

receivers:
  - name: 'default-receiver'

  - name: 'critical-receiver'
    webhook_configs:
      - url: 'http://host.docker.internal:5000/alerts/critical'  # 本地服务用于转发到飞书

  - name: 'warning-receiver'
    webhook_configs:
      - url: 'http://host.docker.internal:5000/alerts/warning'  # 本地服务用于转发到飞书
```

---

### 阶段 4: 在服务器端安装 Node Exporter (1-2 小时)

#### 4.1 创建安装脚本

**文件**: `E:\claw\ClawX\server-monitor\scripts\install-node-exporter.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Installing Node Exporter..."

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root"
  exit 1
fi

# 下载 Node Exporter (版本可调整)
NODE_EXPORTER_VERSION="1.6.1"
cd /tmp
wget https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VERSION}/node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz -O node_exporter.tar.gz

# 解压
tar xvfz node_exporter.tar.gz
cd node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64

# 移动到系统目录
mv node_exporter /usr/local/bin/

# 创建用户
useradd -rs /bin/false node_exporter

# 创建 systemd 服务
cat > /etc/systemd/system/node_exporter.service <<EOF
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
systemctl daemon-reload
systemctl enable node_exporter
systemctl start node_exporter

# 检查状态
sleep 2
if systemctl is-active --quiet node_exporter; then
  echo "✅ Node Exporter installed and running successfully"
  echo "📊 Metrics available at: http://$(hostname -I | awk '{print $1}'):9100/metrics"
else
  echo "❌ Node Exporter failed to start"
  systemctl status node_exporter
  exit 1
fi
```

#### 4.2 批量安装脚本

**文件**: `E:\claw\ClawX\server-monitor\scripts\install-all-servers.ps1`

```powershell
# 配置服务器列表
$servers = @(
    @{Name="bot2"; Host="156.239.53.170"; Port="3655"},
    @{Name="bot5"; Host="156.239.53.170"; Port="3555"},
    @{Name="bot6"; Host="156.239.53.170"; Port="3755"},
    @{Name="bot7"; Host="156.239.53.170"; Port="3855"}
)

foreach ($server in $servers) {
    Write-Host "`n🚀 Installing Node Exporter on $($server.Name)..." -ForegroundColor Cyan

    # 上传安装脚本
    scp -P $server.Port -i "C:\Users\Administrator\.ssh\id_rsa" `
        "E:\claw\ClawX\server-monitor\scripts\install-node-exporter.sh" `
        "root@$($server.Host):/tmp/"

    # 执行安装
    ssh -p $server.Port -i "C:\Users\Administrator\.ssh\id_rsa" `
        "root@$($server.Host)" "bash /tmp/install-node-exporter.sh"

    # 测试连接
    Write-Host "🧪 Testing connection..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://$($server.Host):9100/metrics" -TimeoutSec 5
        Write-Host "✅ $($server.Name) is reachable" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($server.Name) is not reachable" -ForegroundColor Red
    }

    Start-Sleep -Seconds 2
}

Write-Host "`n🎉 Installation complete!" -ForegroundColor Green
Write-Host "📊 Check metrics at: http://<server-ip>:9100/metrics"
```

---

### 阶段 5: 配置 Freqtrade 监控 (1-2 小时)

#### 5.1 创建 Freqtrade 指标推送脚本

**文件**: `E:\claw\ClawX\server-monitor\scripts\freqtrade-metrics.py`

```python
#!/usr/bin/env python3
"""
Freqtrade Prometheus Pushgateway Metrics Exporter
将 Freqtrade 指标推送到 Prometheus Pushgateway
"""

import os
import sys
import time
import requests
from datetime import datetime
import json

# 配置
PUSHGATEWAY_URL = "http://<YOUR_WINDOWS_IP>:9091/metrics/job/freqtrade"
FREQTRADE_API_URL = "http://127.0.0.1:8080/api/v1"
INTERVAL = 30  # 每 30 秒推送一次

def get_freqtrade_data():
    """获取 Freqtrade API 数据"""
    try:
        # 获取余额
        balance = requests.get(f"{FREQTRADE_API_URL}/balance", timeout=5).json()
        # 获取收益
        profit = requests.get(f"{FREQTRADE_API_URL}/profit", timeout=5).json()
        # 获取状态
        status = requests.get(f"{FREQTRADE_API_URL}/status", timeout=5).json()
        return {
            'balance': balance,
            'profit': profit,
            'status': status
        }
    except Exception as e:
        print(f"Error fetching Freqtrade data: {e}")
        return None

def push_metrics(data):
    """推送指标到 Prometheus"""
    try:
        metrics = []
        hostname = os.uname().nodename

        # 余额指标
        if data['balance']:
            total_balance = data['balance'].get('total', 0)
            metrics.append(f'freqtrade_balance_total{{instance="{hostname}"}} {total_balance}')

        # 收益指标
        if data['profit']:
            profit_abs = data['profit'].get('profit_abs', 0)
            profit_pct = data['profit'].get('profit_percent', 0)
            metrics.append(f'freqtrade_profit_abs{{instance="{hostname}"}} {profit_abs}')
            metrics.append(f'freqtrade_profit_percent{{instance="{hostname}"}} {profit_pct}')

        # 状态指标
        if data['status']:
            state = 1 if data['status'].get('state') == 'running' else 0
            metrics.append(f'freqtrade_status_running{{instance="{hostname}"}} {state}')

        # 推送
        if metrics:
            metric_text = '\n'.join(metrics) + '\n'
            requests.post(PUSHGATEWAY_URL, data=metric_text)
            print(f"[{datetime.now()}] Metrics pushed successfully")
    except Exception as e:
        print(f"Error pushing metrics: {e}")

def main():
    print("🚀 Freqtrade Metrics Exporter started")
    print(f"📊 Pushing to: {PUSHGATEWAY_URL}")

    while True:
        data = get_freqtrade_data()
        if data:
            push_metrics(data)
        time.sleep(INTERVAL)

if __name__ == '__main__':
    main()
```

#### 5.2 创建 systemd 服务

**文件**: `E:\claw\ClawX\server-monitor\scripts\freqtrade-metrics.service`

```ini
[Unit]
Description=Freqtrade Prometheus Metrics Exporter
After=network.target

[Service]
Type=simple
User=freqtrade
WorkingDirectory=/home/freqtrade
ExecStart=/usr/bin/python3 /home/freqtrade/freqtrade-metrics.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

### 阶段 6: 启动监控系统 (30 分钟)

#### 6.1 启动所有服务

```powershell
cd E:\claw\ClawX\server-monitor

# 启动监控栈
docker-compose up -d

# 检查状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 6.2 配置 Windows 防火墙

```powershell
# 允许 Prometheus 端口
New-NetFirewallRule -DisplayName "Allow Prometheus" -Direction Inbound -LocalPort 9090 -Protocol TCP -Action Allow

# 允许 Grafana 端口
New-NetFirewallRule -DisplayName "Allow Grafana" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# 允许 Pushgateway 端口
New-NetFirewallRule -DisplayName "Allow Pushgateway" -Direction Inbound -LocalPort 9091 -Protocol TCP -Action Allow
```

---

### 阶段 7: 配置 Grafana 仪表板 (1 小时)

#### 7.1 添加 Prometheus 数据源

1. 访问 http://localhost:3000
2. 登录 (admin / ClawX2026!)
3. Configuration → Data Sources → Add data source
4. 选择 Prometheus
5. URL: http://prometheus:9090
6. 点击 "Save & Test"

#### 7.2 导入预构建仪表板

**推荐仪表板 ID**:
- **1860**: Node Exporter Full (系统资源)
- **3662**: Linux Server (综合监控)
- **12414**: Freqtrade Dashboard (Freqtrade 专用)

#### 7.3 自定义仪表板 (可选)

创建仪表板 JSON:
```json
{
  "dashboard": {
    "title": "Freqtrade Server Monitor",
    "panels": [
      {
        "title": "CPU Usage",
        "targets": [{
          "expr": "100 - (avg by(instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)"
        }]
      },
      {
        "title": "Memory Usage",
        "targets": [{
          "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100"
        }]
      },
      {
        "title": "Disk Usage",
        "targets": [{
          "expr": "(node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100"
        }]
      },
      {
        "title": "Freqtrade Profit",
        "targets": [{
          "expr": "freqtrade_profit_abs"
        }]
      }
    ]
  }
}
```

---

### 阶段 8: 配置告警通知 (1 小时)

#### 8.1 创建飞书 Webhook 服务

**文件**: `E:\claw\ClawX\server-monitor\scripts\feishu-alert-server.py`

```python
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

FEISHU_WEBHOOK_URL = "https://open.feishu.cn/open-apis/bot/v2/hook/YOUR_WEBHOOK_ID"

def send_to_feishu(alert):
    """发送告警到飞书"""
    message = {
        "msg_type": "interactive",
        "card": {
            "header": {
                "title": {
                    "tag": "plain_text",
                    "content": f"🚨 {alert.get('alertname', 'Alert')}"
                },
                "template": alert.get('severity') == 'critical' and 'red' or 'yellow'
            },
            "elements": [
                {
                    "tag": "div",
                    "text": {
                        "tag": "lark_md",
                        "content": f"**服务器**: {alert.get('instance', 'Unknown')}\n\n"
                                  f"**告警级别**: {alert.get('severity', 'Unknown')}\n\n"
                                  f"**描述**: {alert.get('description', 'No description')}"
                    }
                }
            ]
        }
    }

    requests.post(FEISHU_WEBHOOK_URL, json=message)

@app.route('/alerts/<severity>', methods=['POST'])
def receive_alert(severity):
    alerts = request.json.get('alerts', [])
    for alert in alerts:
        send_to_feishu(alert)
    return jsonify({"status": "ok"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

#### 8.2 启动飞书告警服务

```powershell
cd E:\claw\ClawX\server-monitor
python scripts\feishu-alert-server.py
```

---

## 📋 实施时间表

| 阶段 | 任务 | 预计时间 | 优先级 |
|------|------|----------|--------|
| 1 | Docker 环境准备 | 1-2 小时 | P0 |
| 2 | 配置 Prometheus | 1-2 小时 | P0 |
| 3 | Docker Compose 配置 | 30 分钟 | P0 |
| 4 | 安装 Node Exporter | 1-2 小时 | P0 |
| 5 | Freqtrade 监控配置 | 1-2 小时 | P1 |
| 6 | 启动监控系统 | 30 分钟 | P0 |
| 7 | Grafana 仪表板配置 | 1 小时 | P0 |
| 8 | 告警通知配置 | 1 小时 | P1 |

**总计**: 约 7-11 小时

---

## 🎯 核心监控指标

### 系统资源指标

| 指标 | 查询表达式 | 告警阈值 |
|------|-----------|----------|
| CPU 使用率 | `100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)` | > 80% (警告) |
| 内存使用率 | `(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100` | > 85% (警告) |
| 磁盘使用率 | `(node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100` | > 80% (警告) |
| 系统负载 | `node_load1` | > 2.0 (警告) |
| 网络流量 | `rate(node_network_receive_bytes_total[5m])` | 手动检查 |

### Freqtrade 业务指标

| 指标 | 查询表达式 | 说明 |
|------|-----------|------|
| 总余额 | `freqtrade_balance_total` | 账户总余额 |
| 绝对收益 | `freqtrade_profit_abs` | 绝对收益金额 |
| 收益率 | `freqtrade_profit_percent` | 收益百分比 |
| 运行状态 | `freqtrade_status_running` | 1=运行中, 0=已停止 |

### 服务可用性指标

| 指标 | 查询表达式 | 说明 |
|------|-----------|------|
| 服务器在线 | `up` | 1=在线, 0=离线 |
| Freqtrade 运行 | `up{job="freqtrade-pushgateway"}` | 1=运行中, 0=已停止 |

---

## 🔧 维护和优化建议

### 短期优化 (1-2 周)

1. **数据持久化**
   - 配置 Prometheus 数据卷定期备份
   - 设置数据保留策略 (默认 15 天)

2. **高可用性**
   - 配置 Prometheus 联邦集群
   - 添加 Grafana 用户认证

3. **告警优化**
   - 添加飞书 Webhook 机器人
   - 测试告警规则
   - 优化告警去重和聚合

### 长期优化 (1-3 个月)

1. **性能优化**
   - 使用 VictoriaTSDB 替换 Prometheus 存储
   - 优化指标采集频率

2. **功能扩展**
   - 添加日志收集 (Loki + Promtail)
   - 集成链追踪 (Jaeger)
   - 添加业务指标 dashboard

3. **自动化**
   - 自动扩展 Node Exporter
   - 自动恢复故障服务
   - 自动化巡检报告

---

## 📞 快速参考

### 常用命令

```powershell
# 启动监控栈
cd E:\claw\ClawX\server-monitor
docker-compose up -d

# 停止监控栈
docker-compose down

# 查看日志
docker-compose logs -f prometheus
docker-compose logs -f grafana

# 重启服务
docker-compose restart prometheus

# 进入容器
docker-compose exec prometheus sh

# 备份配置
Copy-Item -Recurse config config.backup
```

### 重要 URL

- **Grafana**: http://localhost:3000 (admin / ClawX2026!)
- **Prometheus**: http://localhost:9090
- **AlertManager**: http://localhost:9093
- **Pushgateway**: http://localhost:9091
- **Node Exporter**: http://<server-ip>:9100/metrics

### 故障排查

```powershell
# 检查容器状态
docker-compose ps

# 检查容器日志
docker-compose logs <service-name>

# 检查网络连接
docker network inspect freqtrade-monitor

# 测试 Prometheus 连接
curl http://localhost:9090/api/v1/targets
```

---

## 🎉 总结

本方案提供了从零开始构建完整监控系统的详细步骤,包括:

✅ **轻量级但功能完整**: Prometheus + Grafana + Node Exporter
✅ **快速部署**: Docker Compose 一键启动
✅ **业务集成**: Freqtrade 专用指标和仪表板
✅ **告警通知**: 集成飞书生态
✅ **易于维护**: 容器化部署,配置集中管理

**预计完成时间**: 7-11 小时 (一次性投入,长期受益)

**后续投入**:
- 首月: 配置优化和告警调优
- 每周: 检查监控仪表板和数据准确性
- 每月: 数据备份和配置审计

---

*文档生成完成 | Claw AI Assistant | 2026-03-08*