# C 盘清理建议 - Disk Cleanup Recommendations

**分析时间**: 2026-03-08 11:15  
**C 盘状态**: 93.4GB 已用 / 24.6GB 可用 (20.9% 剩余) ⚠️  
**可清理空间**: 约 15-20GB

---

## 📊 空间占用分析

### Top 占用目录
| 目录 | 大小 | 可清理 | 建议 |
|------|------|--------|------|
| `AppData\Local` | 77.8GB | 12GB | 清理缓存 |
| `.gradle` | 3.9GB | 3GB | 清理旧版本 |
| `.android` | 2.7GB | 2GB | 清理模拟器缓存 |
| `.vscode` | 1.8GB | 0.5GB | 清理扩展缓存 |
| `.trae-cn` | 1.5GB | 1GB | 清理 AI 缓存 |
| `.cache` | 1.3GB | 1GB | 安全清理 |
| `.codebuddycn` | 985MB | 800MB | 清理缓存 |
| `.nuget` | 934MB | 500MB | 清理旧包 |
| `.chromium-browser-snapshots` | 700MB | 500MB | 清理旧版本 |
| `.qoder` | 670MB | 500MB | 清理缓存 |

### 临时文件
| 位置 | 大小 | 建议 |
|------|------|------|
| `AppData\Local\Temp\gsj33y4n` | 3.2GB | ✅ 可删除 (2 月旧文件) |
| `AppData\Local\Temp\*` | 3.35GB | ✅ 可删除 |
| `Downloads` | 34MB | 手动审查 |

---

## 🧹 清理方案

### 方案 A: 安全清理 (立即可执行) ✅
**预计释放**: 8-10GB  
**风险**: 无

```powershell
# 1. 清理临时文件
Remove-Item -Path "C:\Users\Administrator\AppData\Local\Temp\*" -Recurse -Force
# 特别删除：gsj33y4n (3.2GB)

# 2. 清理 npm 缓存
npm cache clean --force

# 3. 清理 pnpm 缓存
pnpm store prune

# 4. 清理 pip 缓存
uv pip cache purge

# 5. 清理 Docker 缓存
docker system prune -f

# 6. 清理 Windows 更新缓存
Remove-Item -Path "C:\Windows\SoftwareDistribution\Download\*" -Recurse -Force
```

### 方案 B: 激进清理 (需确认) ⚠️
**预计释放**: 15-20GB  
**风险**: 可能影响部分工具启动速度

```powershell
# 1. 清理 .gradle 旧版本
Remove-Item -Path "C:\Users\Administrator\.gradle\caches\*" -Recurse -Force

# 2. 清理 .android 模拟器缓存
Remove-Item -Path "C:\Users\Administrator\.android\avd\*.avd\*" -Recurse -Force

# 3. 清理 .nuget 旧包
Remove-Item -Path "C:\Users\Administrator\.nuget\packages\*" -Recurse -Force

# 4. 清理 AI 工具缓存
Remove-Item -Path "C:\Users\Administrator\.trae-cn\cache\*" -Recurse -Force
Remove-Item -Path "C:\Users\Administrator\.codebuddycn\cache\*" -Recurse -Force
Remove-Item -Path "C:\Users\Administrator\.qoder\cache\*" -Recurse -Force
```

### 方案 C: 迁移大文件 (长期方案) 📦
**目标**: 将大目录移到 D/E 盘

1. 移动 `.gradle` 到 E 盘并创建 junction
2. 移动 `.android` 到 E 盘并创建 junction
3. 移动 `.nuget` 到 E 盘并创建 junction
4. 移动 `.cache` 到 E 盘并创建 junction

---

## ⚠️ 注意事项

1. **清理前建议**:
   - 关闭所有 AI 工具 (Trae, CodeBuddy, Qoder 等)
   - 确保没有正在进行的下载
   - 备份重要配置

2. **不要删除**:
   - `AppData\Roaming` (应用配置)
   - `AppData\Local\Microsoft` (系统关键)
   - `AppData\Local\Google\Chrome\User Data` (浏览器数据)

3. **清理后**:
   - 工具首次启动可能稍慢 (需要重建缓存)
   - 建议重启一次系统

---

## 🎯 推荐执行顺序

1. ✅ **立即**: 清理 Temp 文件夹 (4.5GB)
2. ✅ **今日**: 清理 npm/pnpm/pip 缓存 (1-2GB)
3. ⏳ **本周**: 清理 AI 工具缓存 (3-5GB)
4. ⏳ **本周**: 清理 Docker 和 .nuget (2-3GB)
5. 📅 **考虑**: 迁移大目录到 E 盘 (10GB+)

---

## 📝 执行记录

- [ ] Temp 清理 (4.5GB) - 待执行
- [ ] npm/pnpm 缓存清理 - 待执行
- [ ] Docker 清理 - 待执行
- [ ] AI 工具缓存清理 - 待确认
- [ ] .gradle 清理 - 待确认

---

**总可清理空间**: 15-20GB  
**清理后 C 盘可用**: 40-45GB (健康水平)
