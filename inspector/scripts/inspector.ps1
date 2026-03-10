# Inspector Scripts - Consolidated utilities
# All session/monitoring tools merged into one

param([Parameter(Mandatory=$true)][ValidateSet("status","scan","sync","report")][string]$Action)

$env:Path += ";D:\Git\bin;D:\Git\cmd"
$ws = "C:\Users\Administrator\.openclaw-autoclaw\workspace"
$botmem = "C:\Users\Administrator\.openclaw-autoclaw\botmem-inspector"

switch ($Action) {
    "status" {
        # Quick system status
        $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $disk = [math]::Round((Get-PSDrive C).Free / 1GB, 1)
        $used = [math]::Round((Get-PSDrive C).Used / 1GB, 1)
        $pct = [math]::Round(($disk / ($disk + $used)) * 100, 1)
        
        echo "=== Inspector Status | $ts ==="
        echo "Disk: ${disk}GB free / ${used}GB used (${pct}%)"
        
        # Git status
        Set-Location $ws
        $local = git log --oneline -1 2>$null
        echo "Local: $local"
        
        Set-Location $botmem
        $remote = git log --oneline -1 2>$null
        echo "Remote(inspector): $remote"
        
        # Task state
        if (Test-Path "$ws\memory\task-state.json") {
            $raw = [System.IO.File]::ReadAllText("$ws\memory\task-state.json", [System.Text.Encoding]::UTF8)
            $phase = if ($raw -match '"taskPhase"\s*:\s*"([^"]+)"') { $Matches[1] } else { "unknown" }
            $active = if ($raw -match '"lastActive"\s*:\s*"([^"]+)"') { $Matches[1] } else { "unknown" }
            echo "TaskPhase: $phase | LastActive: $active"
        }
        
        # Monitor state
        if (Test-Path "$ws\monitor\state.json") {
            $ms = Get-Content "$ws\monitor\state.json" -Raw | ConvertFrom-Json
            echo "D:\openclaw Score: $($ms.score)/100"
        }
    }
    
    "scan" {
        # Run full scan
        powershell -ExecutionPolicy Bypass -File "$ws\monitor\full_scan.ps1"
    }
    
    "sync" {
        # Sync workspace to botmem repo and push
        # 1. Copy workspace
        Copy-Item "$ws\AGENTS.md" "$botmem\inspector\workspace\" -Force -ErrorAction SilentlyContinue
        Copy-Item "$ws\IDENTITY.md" "$botmem\inspector\workspace\" -Force -ErrorAction SilentlyContinue
        Copy-Item "$ws\USER.md" "$botmem\inspector\workspace\" -Force -ErrorAction SilentlyContinue
        Copy-Item "$ws\MEMORY.md" "$botmem\inspector\workspace\" -Force -ErrorAction SilentlyContinue
        Copy-Item "$ws\TOOLS.md" "$botmem\inspector\workspace\" -Force -ErrorAction SilentlyContinue
        Copy-Item "$ws\HEARTBEAT.md" "$botmem\inspector\workspace\" -Force -ErrorAction SilentlyContinue
        Copy-Item "$ws\SOUL.md" "$botmem\inspector\workspace\" -Force -ErrorAction SilentlyContinue
        Copy-Item "$ws\memory\*" "$botmem\inspector\workspace\memory\" -Force -ErrorAction SilentlyContinue
        Copy-Item "$ws\monitor\*" "$botmem\inspector\monitor\" -Recurse -Force -ErrorAction SilentlyContinue
        
        # 2. Commit and push
        Set-Location $botmem
        git add -A
        $changes = git status --porcelain
        if ($changes) {
            git commit -m "inspector: sync $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
            git push origin inspector 2>&1 | Select-Object -Last 3
            echo "Synced to GitHub"
        } else {
            echo "No changes to sync"
        }
        
        # 3. Local commit
        Set-Location $ws
        git add -A
        $localChanges = git status --porcelain
        if ($localChanges) {
            git commit -m "checkpoint $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
            echo "Local committed"
        }
    }
    
    "report" {
        # Show latest report
        $latest = Get-ChildItem "$ws\monitor\reports\" -Filter "*.md" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if ($latest) {
            Get-Content $latest.FullName -Encoding UTF8
        } else {
            echo "No reports yet"
        }
    }
}
