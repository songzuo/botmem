#!/bin/bash
# Heartbeat-triggered GitHub upload check
# Run this during each heartbeat to upload files at appropriate intervals
# Schedule: Every 8 hours (0, 8, 16)

STATE_FILE="/workspace/memory/heartbeat-state.json"
UPLOAD_SCRIPT="/workspace/scripts/github_upload_safe.sh"

CURRENT_HOUR=$(date +%-H)
CURRENT_DAY=$(date +%u)
CURRENT_TIME=$(date +%s)

# Read state
if [ -f "$STATE_FILE" ]; then
    LAST_UPLOAD=$(grep -o '"lastUpload": [0-9]*' "$STATE_FILE" | cut -d' ' -f2)
    LAST_WEEKLY=$(grep -o '"lastWeeklyUpload": [0-9]*' "$STATE_FILE" | cut -d' ' -f2)
else
    LAST_UPLOAD=0
    LAST_WEEKLY=0
fi

[ -z "$LAST_UPLOAD" ] && LAST_UPLOAD=0
[ -z "$LAST_WEEKLY" ] && LAST_WEEKLY=0

HOURS_SINCE_UPLOAD=$(( (CURRENT_TIME - LAST_UPLOAD) / 3600 ))

# Check if it's time for 8-hour upload (hour is 0, 8, 16)
# And at least 7 hours since last upload
if [ $((CURRENT_HOUR % 8)) -eq 0 ] && [ "$HOURS_SINCE_UPLOAD" -ge 7 ]; then
    echo "=== Time-based upload triggered (hour: $CURRENT_HOUR, hours since: $HOURS_SINCE_UPLOAD) ==="
    bash "$UPLOAD_SCRIPT"
    sed -i "s/\"lastUpload\": [0-9]*/\"lastUpload\": $CURRENT_TIME/" "$STATE_FILE"
fi

# Check for weekly upload (Sunday at 6am)
if [ "$CURRENT_DAY" = "1" ] && [ "$CURRENT_HOUR" = "6" ]; then
    HOURS_SINCE_WEEKLY=$(( (CURRENT_TIME - LAST_WEEKLY) / 3600 ))
    if [ $HOURS_SINCE_WEEKLY -ge 168 ]; then  # 7 days = 168 hours
        echo "=== Weekly upload triggered (Sunday 6am) ==="
        bash "$UPLOAD_SCRIPT"
        sed -i "s/\"lastWeeklyUpload\": [0-9]*/\"lastWeeklyUpload\": $CURRENT_TIME/" "$STATE_FILE"
    fi
fi

echo "Check complete. Hour: $CURRENT_HOUR, Last upload: $LAST_UPLOAD, Hours ago: $HOURS_SINCE_UPLOAD"
