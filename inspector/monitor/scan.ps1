# 监控脚本 - 扫描 D:\openclaw 文件变化并记录
$base = "D:\openclaw"
$logDir = "C:\Users\Administrator\.openclaw-autoclaw\workspace\monitor"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$logFile = "$logDir\scan_log.md"

# 获取当前状态快照
$files = Get-ChildItem -Path "$base\workspace" -File -Recurse | Where-Object { $_.Extension -match '\.(md|ps1|js|ts|json|log|bat|cmd)$' -and $_.DirectoryName -notmatch 'node_modules' } | Sort-Object LastWriteTime -Descending | Select-Object -First 30

$cronFile = "$base\.openclaw\cron\jobs.json"
$cronJobs = if (Test-Path $cronFile) { Get-Content $cronFile -Raw | ConvertFrom-Json } else { $null }

$subagentFile = "$base\.openclaw\subagents\runs.json"
$subagents = if (Test-Path $subagentFile) { Get-Content $subagentFile -Raw } else { "N/A" }

$memoryFiles = Get-ChildItem -Path "$base\workspace\memory" -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending

# 写入快照
$snapshot = @"
---
timestamp: $timestamp
---

## 文件变化 Top 30

| File | Size | Last Modified |
|------|------|---------------|
"@

foreach ($f in $files) {
    $rel = $f.FullName.Replace("$base\workspace\", "")
    $snapshot += "| $rel | $($f.Length) | $($f.LastWriteTime.ToString('MM-dd HH:mm')) |`n"
}

$snapshot += @"

## Cron 任务 (共 $($cronJobs.jobs.Count) 个)

| Name | Interval | Enabled | Next Run |
|------|----------|---------|----------|
"@

foreach ($j in $cronJobs.jobs) {
    $mins = [math]::Round($j.schedule.everyMs / 60000)
    $nextRun = [DateTimeOffset]::FromUnixTimeMilliseconds($j.state.nextRunAtMs).ToOffset([TimeSpan]::FromHours(8)).ToString('HH:mm')
    $snapshot += "| $($j.name) | ${mins}min | $($j.enabled) | $nextRun |`n"
}

$snapshot += @"

## Memory 文件

"@
foreach ($m in $memoryFiles) {
    $snapshot += "- $($m.Name) ($($m.Length) bytes, $($m.LastWriteTime.ToString('MM-dd HH:mm')))`n"
}

$snapshot += @"

## 子代理运行状态

$subagents
"@

# 追加到日志
Add-Content -Path $logFile -Value $snapshot -Encoding UTF8
Write-Output "Snapshot saved at $timestamp"
