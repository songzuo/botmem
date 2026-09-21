# Nginx 重复配置清理报告

**日期:** 2026-04-21  
**服务器:** 7zi.com (165.99.43.61)  
**执行人:** 系统管理员子代理

---

## 问题背景

`/etc/nginx/sites-enabled/` 中存在 4 个 7zi.com 备份配置文件，所有备份均包含相同的 `server_name 7zi.com` 和 `server_name www.7zi.com` 块，与主配置文件 `7zi.com` 产生 **conflicting server name** 警告。

---

## 发现的重复备份文件

| 文件名 | 大小 | 备份时间 |
|--------|------|----------|
| `7zi.com.backup.20260421154504` | 4605 字节 | 04-21 15:45 |
| `7zi.com.bak` | 3868 字节 | 04-21 21:15 |
| `7zi.com.bak.202604211458` | 3868 字节 | 04-21 14:58 |
| `7zi.com.bak.20260421191257` | 4051 字节 | 04-21 19:12 |

**保留文件:** `7zi.com` (4605 字节，最新完整版本)

> 注：`7zi.com.backup.20260421154504` 与主配置 `7zi.com` 内容完全相同(diff 无差异)，其余备份与主配置存在细微差异(erhu-brand 相关 sitemap/robots 块)。

---

## 执行操作

1. ✅ 备份所有重复文件至 `/tmp/nginx_backup_0421/`
2. ✅ 删除 4 个重复备份文件
3. ✅ 运行 `nginx -t` 验证配置
4. ✅ `systemctl reload nginx` 重新加载

---

## 清理前后对比

### 清理前 `nginx -t` 输出
```
nginx: [warn] conflicting server name "www.7zi.com" on 0.0.0.0:80, ignored
nginx: [warn] conflicting server name "7zi.com" on 0.0.0.0:80, ignored
... (每对 server_name 各出现 4 次，共 32 个警告)
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 清理后 `nginx -t` 输出
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**零警告，配置测试通过。**

---

## 备份文件位置

所有删除的备份已保存至：
```
/tmp/nginx_backup_0421/
├── 7zi.com.backup.20260421154504
├── 7zi.com.bak
├── 7zi.com.bak.202604211458
└── 7zi.com.bak.20260421191257
```

---

## 当前 sites-enabled 中 7zi.com 相关文件

```
7zi.com                          ← 主配置（保留）
005-good.7zi.com.conf
006-today.7zi.com.conf
007-wechat.7zi.com.conf
ai.7zi.com.conf
api.7zi.com.conf
claw.7zi.com.conf
dating.7zi.com.conf
ex.7zi.com.conf
export.7zi.com.conf
marry.7zi.com.conf
money.7zi.com.conf
pa.7zi.com.conf
test.7zi.com.conf
```

---

## 状态: ✅ 完成

无 conflicting server name 警告，Nginx 运行正常。
