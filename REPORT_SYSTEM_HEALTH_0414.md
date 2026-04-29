# 🛡️ 系统健康报告

**报告时间**: 2026-04-14 17:05 GMT+2  
**检查范围**: bot6 (本机) / 7zi.com / bot5.szspd.cn

---

## 📊 服务器概览

| 服务器 | 角色 | 状态 |
|--------|------|------|
| bot6 (本机) | OpenClaw 运行 / 监控集群 | ✅ 正常 |
| 7zi.com | 主网站部署 | ✅ 正常 |
| bot5.szspd.cn | 测试机 | ✅ 正常 |

---

## 🔍 详细检查

### 1️⃣ BOT6 (本机)

#### 磁盘空间
| 分区 | 大小 | 已用 | 可用 | 使用率 |
|------|------|------|------|--------|
| /dev/sda1 (根) | 145G | 59G | 87G | **41%** ✅ |
| /dev/sda16 (boot) | 881M | 117M | 703M | 15% |
| /dev/sda15 (efi) | 105M | 6.2M | 99M | 6% |

#### 内存使用
| 总计 | 已用 | 可用 | 使用率 |
|------|------|------|--------|
| 7.8Gi | 3.1Gi | 4.7Gi | **40%** ✅ |

#### Docker 容器 (8个运行中)
| 容器名 | 状态 | 端口 |
|--------|------|------|
| 7zi-health-service | ✅ healthy | 8085 |
| 7zi-alertmanager | ✅ healthy | 9093 |
| 7zi-loki | ✅ healthy | 3100 |
| 7zi-prometheus | ✅ healthy | 9090 |
| 7zi-node-exporter | ✅ healthy | 9101 |
| 7zi-pushgateway | ✅ healthy | 9091 |
| 7zi-cadvisor | ✅ healthy | 8080 |
| 7zi-grafana | ⚠️ Exited (1) | - |

#### 最近系统日志错误 (1小时内)
```
Apr 14 16:28 - sshd: maximum authentication attempts exceeded for root from 45.148.10.141
Apr 14 16:34 - sshd: maximum authentication attempts exceeded for root from 2.57.122.193
```
⚠️ **注意**: 有暴力破解 SSH 尝试，建议确认来源 IP 是否可信

---

### 2️⃣ 7zi.com (165.99.43.61)

#### 磁盘空间
| 分区 | 大小 | 已用 | 可用 | 使用率 |
|------|------|------|------|--------|
| /dev/vda1 (根) | 88G | 64G | 24G | **74%** ⚠️ |

#### 内存使用
| 总计 | 已用 | 可用 | 使用率 |
|------|------|------|--------|
| 7.8Gi | 4.3Gi | 3.1Gi | **55%** ✅ |

#### Nginx
- ✅ **运行中** (已运行 5 天)

#### PM2 服务 (5个)
| 服务 | 状态 | 运行时长 | 重启次数 |
|------|------|----------|----------|
| 7zi-main | ✅ online | 53m | 1 |
| ex-7zi | ✅ online | 33h | 0 |
| export-7zi | ✅ online | 33h | 0 |
| money-7zi | ✅ online | 15h | 18 ⚠️ |
| visa | ✅ online | 33h | 0 |

#### 最近系统日志错误 (1小时内)
```
Apr 14 22:15 - sshd: kex_exchange_identification: Connection closed by remote host
Apr 14 22:26 - sshd: kex_exchange_identification: Connection closed by remote host
Apr 14 22:40 - sshd: kex_exchange_identification: Connection closed by remote host
```
> 注: 日志时间显示 CST (UTC+8)，本报告时间为 GMT+2

---

### 3️⃣ bot5.szspd.cn (182.43.36.134)

#### 磁盘空间
| 分区 | 大小 | 已用 | 可用 | 使用率 |
|------|------|------|------|--------|
| /dev/vda2 (根) | 40G | 25G | 16G | **63%** ✅ |

#### 内存使用
| 总计 | 已用 | 可用 | 使用率 |
|------|------|------|--------|
| 1.9Gi | 942Mi | 827Mi | **49%** ✅ |

#### Docker
- ✅ Docker 运行中，无容器

#### 最近系统日志错误 (1小时内)
```
Apr 14 22:12 - sshd: kex_exchange_identification: Connection closed
Apr 14 22:14 - sshd: kex_exchange_identification: Connection closed
Apr 14 22:38 - sshd: fatal: userauth_finish: Connection reset by peer
```

---

## ⚠️ 注意事项

1. **7zi.com 磁盘使用率 74%** - 接近警戒线，建议清理或扩容
2. **money-7zi PM2 重启18次** - 建议检查应用稳定性
3. **7zi-grafana 容器已退出** - 需检查是否需要重启
4. **SSH 暴力破解尝试** - bot6 检测到多次失败登录，建议确认是否恶意

---

## ✅ 总体评估

**状态**: 🟢 整体正常

所有服务器核心服务运行正常，内存充足。主要关注 7zi.com 磁盘使用率上升趋势。

---

*报告生成时间: 2026-04-14 17:05 GMT+2*
