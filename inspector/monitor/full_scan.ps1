# Full Monitor Script - scans D:\openclaw + botmem repo
param([switch]$quiet)

$ErrorActionPreference = "SilentlyContinue"
$base = "D:\openclaw"
$logDir = "C:\Users\Administrator\.openclaw-autoclaw\workspace\monitor"
$stateFile = "$logDir\state.json"
$reportDir = "$logDir\reports"
$ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$date = Get-Date -Format "yyyy-MM-dd"

New-Item -ItemType Directory -Path $reportDir -Force | Out-Null

# 1. Local scan - files changed in 24h
$cutoff = (Get-Date).AddHours(-24)
$newFiles = Get-ChildItem -Path "$base\workspace" -File -Recurse | 
    Where-Object { $_.LastWriteTime -gt $cutoff -and $_.Extension -match '\.(md|ps1|js|ts|json|py|sh)$' -and $_.DirectoryName -notmatch 'node_modules|\.git' } |
    Sort-Object LastWriteTime -Descending

$codeFiles = @($newFiles | Where-Object { $_.Extension -match '\.(js|ts|py|sh)$' }).Count
$docFiles = @($newFiles | Where-Object { $_.Extension -eq '.md' }).Count
$screenshotFiles = @($newFiles | Where-Object { $_.Name -match '^screenshot_' }).Count

# Cron
$cronCount = 0; $cronActive = 0
$cronFile = "$base\.openclaw\cron\jobs.json"
if (Test-Path $cronFile) {
    $cron = Get-Content $cronFile -Raw -Encoding UTF8 | ConvertFrom-Json
    $cronCount = $cron.jobs.Count
    $cronActive = @($cron.jobs | Where-Object { $_.enabled -eq $true }).Count
}

# Disk
$disk = Get-PSDrive C
$diskFreePct = [math]::Round(($disk.Free / $disk.Used) * 100, 1)

# Plugin
$pluginDir = "$base\workspace\financial-analyst-plugin"
$pluginExists = Test-Path $pluginDir
$pluginDate = "N/A"
if ($pluginExists) {
    $p = Get-ChildItem $pluginDir -File -Recurse -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($p) { $pluginDate = $p.LastWriteTime.ToString("MM-dd HH:mm") }
}

# 2. GitHub
$lastCommit = "fetch-failed"; $commits24h = 0
try {
    $resp = Invoke-RestMethod -Uri "https://api.github.com/repos/songzuo/botmem/commits?per_page=30" -Headers @{"User-Agent"="openclaw"} -TimeoutSec 10
    $lastCommit = $resp[0].commit.author.date
    $cutoff24h = (Get-Date).AddHours(-24).ToString("o")
    $commits24h = @($resp | Where-Object { $_.commit.author.date -gt $cutoff24h }).Count
} catch {}

# 3. Score
$score = 100; $issues = @()
if ($codeFiles -eq 0) { $score -= 30; $issues += "zero_code_24h" }
if ($docFiles -gt 3) { $score -= 10; $issues += "too_many_docs($docFiles)" }
if ($screenshotFiles -gt 5) { $score -= 10; $issues += "too_many_screenshots($screenshotFiles)" }
if ($diskFreePct -lt 25) { $score -= 15; $issues += "disk_low(${diskFreePct}%)" }
if ($cronActive -gt 6) { $score -= 10; $issues += "cron_overload($cronActive)" }
if ($pluginExists -and (Get-ChildItem $pluginDir -File -Recurse -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1).LastWriteTime -lt (Get-Date).AddDays(-2)) { $score -= 10; $issues += "plugin_stale" }
if (-not $pluginExists) { $score -= 10; $issues += "plugin_missing" }
$score = [math]::Max($score, 0)

# 4. Report
$fileList = ($newFiles | ForEach-Object { "  - " + $_.FullName.Replace($base + "\","") + " (" + $_.LastWriteTime.ToString("MM-dd HH:mm") + ")" }) -join "`n"
$issueList = ($issues | ForEach-Object { "  - $_" }) -join "`n"

$report = @"
# Monitor Snapshot | $ts

## Score: $score/100

## Issues ($($issues.Count))
$issueList

## D:\openclaw Local
- Code files (24h): $codeFiles
- Doc files (24h): $docFiles
- Screenshots (24h): $screenshotFiles
- Cron: $cronCount total, $cronActive active
- Disk free: $diskFreePct%
- Plugin last update: $pluginDate

## Recent changes
$fileList

## botmem Repo
- Last commit: $lastCommit
- Commits (24h): $commits24h
"@

$reportFile = "$reportDir\$(Get-Date -Format 'yyyy-MM-dd_HHmmss').md"
[System.IO.File]::WriteAllText($reportFile, $report, [System.Text.Encoding]::UTF8)

# Save state
$state = @{timestamp=$ts; score=$score; issues=$issues; codeFiles=$codeFiles; docFiles=$docFiles; screenshots=$screenshotFiles; cronActive=$cronActive; diskPct=$diskFreePct; lastCommit=$lastCommit; commits24h=$commits24h; pluginDate=$pluginDate} | ConvertTo-Json
[System.IO.File]::WriteAllText($stateFile, $state, [System.Text.Encoding]::UTF8)

if (-not $quiet) {
    Write-Output "=== Monitor $ts ==="
    Write-Output "Score: $score/100 | Issues: $($issues.Count) | Code24h: $codeFiles | Commits24h: $commits24h"
    Write-Output "Report: $reportFile"
}
exit $score
