#!/bin/bash
# Self-healing mechanism - automatic detection and repair of issues

LOG="/workspace/projects/workspace/memory/self-healing.log"
ALERT_LOG="/workspace/projects/workspace/memory/self-healing-alerts.log"

echo "[$(date)] === Self-healing mechanism started ===" | tee -a "$LOG"

# Define service list
SERVICES=("openclaw-gateway" "docker" "nginx" "mysql" "apache2" "cron")

# Define node list
NODES=(
    "7zi.com"
    "bot2.szspd.cn"
)

echo "[$(date)] Monitored services: ${SERVICES[@]}" | tee -a "$LOG"
echo "[$(date)] Monitored nodes: ${NODES[@]}" | tee -a "$LOG"

# 1. Check SSH connection
echo "[$(date)] === Checking SSH connection ===" | tee -a "$LOG"

for node in "${NODES[@]}"; do
    SSH_STATUS=$(sshpass -p "ge2099334\$ZZ" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$node "whoami" 2>&1)
    
    if echo "$SSH_STATUS" | grep -q "Permission denied"; then
        echo "[$(date)] ERROR $node SSH authentication failed" | tee -a "$LOG"
        echo "[$(date)] INFO Attempting to fix SSH connection..." | tee -a "$LOG"
        
        # Fix SSH connection
        # Option 1: Clear known_hosts
        ssh-keygen -R $node -f ~/.ssh/known_hosts 2>/dev/null
        
        # Option 2: Retest SSH
        SSH_STATUS=$(sshpass -p "ge2099334\$ZZ" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$node "whoami" 2>&1)
        
        if echo "$SSH_STATUS" | grep -q "root"; then
            echo "[$(date)] OK $node SSH connection fixed" | tee -a "$LOG"
        else
            echo "[$(date)] ERROR $node SSH connection repair failed, manual intervention needed" | tee -a "$ALERT_LOG"
        fi
    elif echo "$SSH_STATUS" | grep -q "root"; then
        echo "[$(date)] OK $node SSH connection normal" | tee -a "$LOG"
    else
        echo "[$(date)] WARN $node SSH status unknown: $SSH_STATUS" | tee -a "$LOG"
    fi
done

# 2. Check service status
echo "[$(date)] === Checking service status ===" | tee -a "$LOG"

for node in "${NODES[@]}"; do
    # Check SSH availability
    SSH_STATUS=$(sshpass -p "ge2099334\$ZZ" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 root@$node "whoami" 2>&1)
    
    if echo "$SSH_STATUS" | grep -q "root"; then
        # SSH normal, check services
        for service in "${SERVICES[@]}"; do
            SERVICE_STATUS=$(sshpass -p "ge2099334\$ZZ" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$node "systemctl is-active --quiet $service" 2>&1)
            
            if [ "$SERVICE_STATUS" = "0" ]; then
                echo "[$(date)] WARN $node $service has stopped" | tee -a "$LOG"
                echo "[$(date)] INFO Attempting to automatically restart $node $service..." | tee -a "$LOG"
                
                # Attempt to restart service
                RESTART_STATUS=$(sshpass -p "ge2099334\$ZZ" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$node "systemctl restart $service" 2>&1)
                
                # Check status after restart
                SERVICE_STATUS=$(sshpass -p "ge2099334\$ZZ" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$node "systemctl is-active --quiet $service" 2>&1)
                
                if [ "$SERVICE_STATUS" = "0" ]; then
                    echo "[$(date)] ERROR $node $service automatic restart failed" | tee -a "$ALERT_LOG"
                else
                    echo "[$(date)] OK $node $service automatically restarted successfully" | tee -a "$LOG"
                fi
            else
                echo "[$(date)] OK $node $service running normally" | tee -a "$LOG"
            fi
        done
    else
        echo "[$(date)] WARN $node SSH not available, skipping service check" | tee -a "$LOG"
    fi
done

# 3. Check disk space
echo "[$(date)] === Checking disk space ===" | tee -a "$LOG"

DISK_THRESHOLD=85

for node in "${NODES[@]}"; do
    # Check SSH availability
    SSH_STATUS=$(sshpass -p "ge2099334\$ZZ" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 root@$node "whoami" 2>&1)
    
    if echo "$SSH_STATUS" | grep -q "root"; then
        # Get disk usage
        DISK_USAGE=$(sshpass -p "ge2099334\$ZZ" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$node "df -h | awk '/\\// {print \$5}' | sed 's/%//' 2>/dev/null")
        
        for usage in $DISK_USAGE; do
            # Remove percentage sign
            usage=${usage%\%}
            
            # Check if exceeding threshold
            if [ "$usage" -gt "$DISK_THRESHOLD" ]; then
                echo "[$(date)] WARN $node disk usage: $usage% (exceeds threshold: $DISK_THRESHOLD%)" | tee -a "$ALERT_LOG"
                
                # Cleanup log files
                echo "[$(date)] INFO Cleaning up log files..." | tee -a "$LOG"
                
                sshpass -p "ge2099334\$ZZ" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$node "find /var/log -name '*.log' -mtime +7 -delete" 2>/dev/null
                
                # Cleanup temporary files
                sshpass -p "ge2099334\$ZZ" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$node "find /tmp -type f -mtime +1 -delete" 2>/dev/null
                
                # Cleanup system package cache
                sshpass -p "ge2099334\$ZZ" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$node "apt-get clean -y" 2>/dev/null
                
                echo "[$(date)] OK $node disk space has been cleaned up" | tee -a "$LOG"
            else
                echo "[$(date)] OK $node disk usage: $usage% (normal)" | tee -a "$LOG"
            fi
        done
    else
        echo "[$(date)] WARN $node SSH not available, skipping disk check" | tee -a "$LOG"
    fi
done

# 4. Check system resources
echo "[$(date)] === Checking system resources ===" | tee -a "$LOG"

MEMORY_THRESHOLD=80
CPU_THRESHOLD=80

for node in "${NODES[@]}"; do
    # Check SSH availability
    SSH_STATUS=$(sshpass -p "ge2099334\$ZZ" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=3 root@$node "whoami" 2>&1)
    
    if echo "$SSH_STATUS" | grep -q "root"; then
        # Check memory usage
        MEMORY_USAGE=$(sshpass -p "ge2099334\$ZZ" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$node "free -h | awk '/Mem:/ {print \$3}' | sed 's/%//' 2>/dev/null")
        
        if [ -n "$MEMORY_USAGE" ]; then
            if [ "${MEMORY_USAGE%\%}" -gt "$MEMORY_THRESHOLD" ]; then
                echo "[$(date)] WARN $node memory usage: $MEMORY_USAGE% (exceeds threshold: $MEMORY_THRESHOLD%)" | tee -a "$ALERT_LOG"
                
                # Attempt to release memory
                sshpass -p "ge2099334\$ZZ" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$node "sync && echo 3 > /proc/sys/vm/drop_caches" 2>/dev/null
                
                echo "[$(date)] OK $node has attempted to release memory" | tee -a "$LOG"
            else
                echo "[$(date)] OK $node memory usage: $MEMORY_USAGE% (normal)" | tee -a "$LOG"
            fi
        fi
        
        # Check CPU load
        CPU_LOAD=$(sshpass -p "ge2099334\$ZZ" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$node "uptime | awk '{print \\$NF}' | cut -d',' -f1" 2>/dev/null)
        
        if [ -n "$CPU_LOAD" ]; then
            CPU_LOAD_INT=$(echo "$CPU_LOAD" | cut -d'.' -f1)
            
            if [ "$CPU_LOAD_INT" -gt "$CPU_THRESHOLD" ]; then
                echo "[$(date)] WARN $node CPU load: $CPU_LOAD (exceeds threshold: $CPU_THRESHOLD)" | tee -a "$ALERT_LOG"
                
                # Record high load processes
                sshpass -p "ge2099334\$ZZ" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$node "ps aux --sort=-%cpu | head -10" > /tmp/$node-cpu-top-$(date +%s).log 2>/dev/null
                
                echo "[$(date)] INFO High load processes have been recorded to /tmp/$node-cpu-top-$(date +%s).log" | tee -a "$LOG"
            else
                echo "[$(date)] OK $node CPU load: $CPU_LOAD (normal)" | tee -a "$LOG"
            fi
        fi
    else
        echo "[$(date)] WARN $node SSH not available, skipping resource check" | tee -a "$LOG"
    fi
done

# 5. Check network connection
echo "[$(date)] === Checking network connection ===" | tee -a "$LOG"

# Check inter-node network connection
ping -c 3 7zi.com > /tmp/7zi-ping-$(date +%s).log 2>&1
ping -c 3 bot2.szspd.cn > /tmp/bot2-ping-$(date +%s).log 2>&1
ping -c 3 x.com > /tmp/x-com-ping-$(date +%s).log 2>&1

# Check HTTP service
curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://7zi.com:18789/health > /tmp/7zi-http-$(date +%s).log 2>&1
curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://bot2.szspd.cn:18789/health > /tmp/bot2-http-$(date +%s).log 2>&1

# 6. Check automation tasks
echo "[$(date)] === Checking automation tasks ===" | tee -a "$LOG"

# Check background processes
AUTONOMOUS_TASKS=("autonomous-executor" "auto-backup" "smart-scheduler" "parallel-status" "auto-planner")

for task in "${AUTONOMOUS_TASKS[@]}"; do
    PID=$(pgrep -f "$task")
    
    if [ -z "$PID" ]; then
        echo "[$(date)] ERROR $task not running, attempting to automatically restart..." | tee -a "$ALERT_LOG"
        
        # Attempt to restart task
        case "$task" in
            "autonomous-executor")
                nohup /workspace/projects/workspace/scripts/autonomous-executor.sh > /workspace/projects/workspace/memory/autonomous-executor.log 2>&1 &
                ;;
            "auto-backup")
                nohup /workspace/projects/workspace/scripts/auto-backup.sh > /workspace/projects/workspace/memory/auto-backup.log 2>&1 &
                ;;
            "smart-scheduler")
                nohup /workspace/projects/workspace/scripts/smart-scheduler.sh > /workspace/projects/workspace/memory/smart-scheduler.log 2>&1 &
                ;;
            *)
                echo "[$(date)] WARN Unknown task: $task" | tee -a "$LOG"
                ;;
        esac
        
        # Wait 1 second before checking
        sleep 1
        
        # Verify if task has started
        NEW_PID=$(pgrep -f "$task")
        if [ -n "$NEW_PID" ]; then
            echo "[$(date)] OK $task has been automatically restarted (PID: $NEW_PID)" | tee -a "$LOG"
        else
            echo "[$(date)] ERROR $task automatic restart failed" | tee -a "$ALERT_LOG"
        fi
    else
        echo "[$(date)] OK $task is running (PID: $PID)" | tee -a "$LOG"
    fi
done

echo "[$(date)] === Self-healing mechanism execution completed ===" | tee -a "$LOG"
echo "[$(date)] Next execution time: every 30 minutes" | tee -a "$LOG"
