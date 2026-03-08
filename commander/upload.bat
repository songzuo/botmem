#!/bin/bash
# botmem-commander upload script
# This script uploads commander files to GitHub

REPO_DIR="C:/Users/Administrator/lobsterai/project/botmem_temp/commander"
GIT_REPO="https://github.com/songzuo/botmem.git"
BRANCH="main"
COMMITTER_NAME="LobsterAI Commander"
COMMITTER_EMAIL="commander@lobsterai.local"

# Change to repo directory
cd "$REPO_DIR" || exit 1

# Configure git if needed
git config user.name "$COMMITTER_NAME"
git config user.email "$COMMITTER_EMAIL"

# Check for argument to determine upload type
UPLOAD_TYPE="${1:-all}"

echo "=== Botmem Commander Upload ==="
echo "Upload type: $UPLOAD_TYPE"
echo "Time: $(date)"

if [ "$UPLOAD_TYPE" = "memory" ]; then
    # Upload only memory files (more frequent - every 4 hours)
    echo ">>> Uploading memory files only..."
    git add memory/ MEMORY.md 2>/dev/null

    if git diff --cached --quiet; then
        echo "No memory changes to commit"
    else
        git commit -m "$(date '+%Y-%m-%d %H:%M'): Memory update"
        git push origin $BRANCH
        echo "Memory files uploaded successfully"
    fi

elif [ "$UPLOAD_TYPE" = "regular" ]; then
    # Upload only regular files (less frequent - weekly)
    echo ">>> Uploading regular files..."
    git add IDENTITY.md SOUL.md AGENTS.md TOOLS.md HEARTBEAT.md USER.md .gitignore agents/

    if git diff --cached --quiet; then
        echo "No regular file changes to commit"
    else
        git commit -m "$(date '+%Y-%m-%d'): Regular files update"
        git push origin $BRANCH
        echo "Regular files uploaded successfully"
    fi

else
    # Upload all files
    echo ">>> Uploading all files..."
    git add -A
    git add .gitignore

    if git diff --cached --quiet; then
        echo "No changes to commit"
    else
        git commit -m "$(date '+%Y-%m-%d %H:%M'): Full sync"
        git push origin $BRANCH
        echo "All files uploaded successfully"
    fi
fi

echo "=== Upload Complete ==="
