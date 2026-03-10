# TOOLS.md - Local Notes

## 自动记忆配置

### 记忆机制
- **Daily notes location**: memory/YYYY-MM-DD.md
- **Auto-save interval**: Every session
- **Long-term storage**: MEMORY.md

### Git 配置
- **本地仓库**: C:\Users\Administrator\.openclaw-autoclaw\workspace (.git)
- **远程仓库**: https://github.com/songzuo/botmem.git (branch: inspector)
- **同步目录**: C:\Users\Administrator\.openclaw-autoclaw\botmem-inspector
- **Git路径**: D:\Git\bin\git.exe
- **重要变更后执行同步**: 复制 workspace → botmem-inspector/inspector/ → git add/commit/push

### 同步命令模板
```powershell
$env:Path += ";D:\Git\bin;D:\Git\cmd"
# 1. 复制变更
Copy-Item "workspace\*" "botmem-inspector\inspector\workspace\" -Recurse -Force
Copy-Item "monitor\*" "botmem-inspector\inspector\monitor\" -Recurse -Force
# 2. 提交推送
Set-Location botmem-inspector
git add -A; git commit -m "..."; git push origin inspector
```

### 预防措施

1. **每次会话后保存**
   - 养成会话结束前保存重要内容的习惯
   - 使用 `echo "内容" >> memory/YYYY-MM-DD.md` 快速记录

2. **关键信息立即保存**
   - 系统配置、任务进度、重要决策立即写入 MEMORY.md

3. **定期检查记忆文件**
   - 每日至少检查一次 memory 文件夹
   - 确保所有重要对话都已归档

## Current Issue
- **Problem**: 2026年02月24日的会话记录缺失，对话内容完全丢失
- **Root cause**: 未启用自动保存机制，会话结束后内存内容未持久化
- **Solution**: 已创建 memory/2026-02-24.md 并添加提示信息

## D:\openclaw (龙虾助手) 配置备忘
- **路径**: D:\openclaw
- **端口**: 28765
- **主模型**: minimax/MiniMax-M2.5 (3月11日从 doubao-seed-code 更改)
- **配置文件**: D:\openclaw\.openclaw\openclaw.json