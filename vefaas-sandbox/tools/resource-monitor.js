#!/usr/bin/env node

/**
 * Resource Monitor - 资源监控与历史趋势分析工具
 * 
 * 功能:
 * - 实时监控CPU、内存、磁盘使用情况
 * - 记录历史数据并生成趋势报告
 * - 支持告警阈值设置
 * - 支持多种输出格式 (JSON/文本/CSV)
 * 
 * 使用方式:
 * node resource-monitor.js --watch          # 实时监控模式
 * node resource-monitor.js --report        # 生成报告
 * node resource-monitor.js --history        # 查看历史记录
 * node resource-monitor.js --alert=80       # 设置磁盘告警阈值80%
 * node resource-monitor.js --demo           # 生成演示数据
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const STATE_DIR = path.join(__dirname, '..', 'state');
const HISTORY_FILE = path.join(STATE_DIR, 'resource-history.json');
const ALERT_CONFIG_FILE = path.join(STATE_DIR, 'resource-alerts.json');

// 默认告警配置
const DEFAULT_ALERTS = {
  disk: { threshold: 85, enabled: true },
  memory: { threshold: 90, enabled: true },
  cpu: { threshold: 95, enabled: false }
};

// 确保state目录存在
function ensureStateDir() {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
}

// 获取磁盘使用率
function getDiskUsage() {
  try {
    const { execSync } = require('child_process');
    const output = execSync('df -h /workspace/projects/workspace 2>/dev/null | tail -1', { encoding: 'utf8' });
    const parts = output.trim().split(/\s+/);
    const used = parseInt(parts[2].replace('G', '').replace('T', ''));
    const total = parseInt(parts[1].replace('G', '').replace('T', ''));
    const usePercent = parseInt(parts[4].replace('%', ''));
    const avail = parseInt(parts[3].replace('G', '').replace('T', ''));
    
    // 统一转换为GB
    return {
      total: parts[1],
      used: parts[2],
      available: parts[3],
      percent: usePercent,
      usedGB: parts[1].includes('T') ? used * 1024 : used,
      totalGB: parts[1].includes('T') ? total * 1024 : total
    };
  } catch (e) {
    return { total: 'N/A', used: 'N/A', available: 'N/A', percent: 0 };
  }
}

// 获取内存使用情况
function getMemoryUsage() {
  try {
    const { execSync } = require('child_process');
    const output = execSync('free -b 2>/dev/null', { encoding: 'utf8' });
    const lines = output.split('\n');
    const memLine = lines[1].split(/\s+/);
    const total = parseInt(memLine[1]);
    const used = parseInt(memLine[2]);
    const free = parseInt(memLine[3]);
    const available = parseInt(memLine[6]);
    
    return {
      total: (total / (1024*1024*1024)).toFixed(2) + ' GB',
      used: (used / (1024*1024*1024)).toFixed(2) + ' GB',
      available: (available / (1024*1024*1024)).toFixed(2) + ' GB',
      percent: Math.round((used / total) * 100)
    };
  } catch (e) {
    return { total: 'N/A', used: 'N/A', available: 'N/A', percent: 0 };
  }
}

// 获取CPU使用率
function getCpuUsage() {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;
  
  cpus.forEach(cpu => {
    for (let type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });
  
  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const used = Math.round((1 - idle / total) * 100);
  
  return {
    cores: cpus.length,
    model: cpus[0].model,
    percent: used
  };
}

// 获取当前资源快照
function getSnapshot() {
  return {
    timestamp: new Date().toISOString(),
    disk: getDiskUsage(),
    memory: getMemoryUsage(),
    cpu: getCpuUsage(),
    hostname: os.hostname(),
    uptime: os.uptime()
  };
}

// 加载历史数据
function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('加载历史数据失败:', e.message);
  }
  return { snapshots: [] };
}

// 保存历史数据
function saveHistory(history) {
  ensureStateDir();
  // 只保留最近1000条记录
  if (history.snapshots.length > 1000) {
    history.snapshots = history.snapshots.slice(-1000);
  }
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

// 记录快照
function recordSnapshot() {
  const history = loadHistory();
  const snapshot = getSnapshot();
  history.snapshots.push(snapshot);
  saveHistory(history);
  return snapshot;
}

// 检查告警
function checkAlerts(snapshot, customAlerts = null) {
  const alerts = customAlerts || DEFAULT_ALERTS;
  const triggered = [];
  
  if (alerts.disk?.enabled && snapshot.disk.percent > alerts.disk.threshold) {
    triggered.push({
      type: 'disk',
      message: `磁盘使用率 ${snapshot.disk.percent}% 超过阈值 ${alerts.disk.threshold}%`,
      severity: snapshot.disk.percent > 90 ? 'critical' : 'warning'
    });
  }
  
  if (alerts.memory?.enabled && snapshot.memory.percent > alerts.memory.threshold) {
    triggered.push({
      type: 'memory',
      message: `内存使用率 ${snapshot.memory.percent}% 超过阈值 ${alerts.memory.threshold}%`,
      severity: snapshot.memory.percent > 95 ? 'critical' : 'warning'
    });
  }
  
  if (alerts.cpu?.enabled && snapshot.cpu.percent > alerts.cpu.threshold) {
    triggered.push({
      type: 'cpu',
      message: `CPU使用率 ${snapshot.cpu.percent}% 超过阈值 ${alerts.cpu.threshold}%`,
      severity: snapshot.cpu.percent > 95 ? 'critical' : 'warning'
    });
  }
  
  return triggered;
}

// 生成趋势报告
function generateReport(history, period = 'day') {
  if (history.snapshots.length === 0) {
    return '暂无历史数据';
  }
  
  const snapshots = history.snapshots;
  const now = new Date();
  let periodMs;
  
  switch (period) {
    case 'hour': periodMs = 60 * 60 * 1000; break;
    case 'day': periodMs = 24 * 60 * 60 * 1000; break;
    case 'week': periodMs = 7 * 24 * 60 * 60 * 1000; break;
    default: periodMs = 24 * 60 * 60 * 1000;
  }
  
  const filtered = snapshots.filter(s => 
    new Date(s.timestamp) > new Date(now.getTime() - periodMs)
  );
  
  if (filtered.length === 0) {
    return `过去${period}无数据记录`;
  }
  
  // 计算统计
  const diskUsage = filtered.map(s => s.disk.percent);
  const memUsage = filtered.map(s => s.memory.percent);
  const cpuUsage = filtered.map(s => s.cpu.percent);
  
  const avg = arr => (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
  const max = arr => Math.max(...arr);
  const min = arr => Math.min(...arr);
  
  return {
    period,
    dataPoints: filtered.length,
    disk: { avg: avg(diskUsage), max: max(diskUsage), min: min(diskUsage) },
    memory: { avg: avg(memUsage), max: max(memUsage), min: min(memUsage) },
    cpu: { avg: avg(cpuUsage), max: max(cpuUsage), min: min(cpuUsage) },
    firstRecord: filtered[0].timestamp,
    lastRecord: filtered[filtered.length - 1].timestamp
  };
}

// 实时监控模式
function watchMode(interval = 5000) {
  console.log('🔍 开始实时监控 (每' + (interval/1000) + '秒更新, Ctrl+C退出)\n');
  
  const readline = require('readline');
  let lastDisk = 0;
  
  const updateDisplay = () => {
    const snapshot = getSnapshot();
    
    // 清除上一行
    readline.cursorTo(process.stdout, 0);
    readline.clearLine(process.stdout, 0);
    
    const time = new Date().toLocaleTimeString();
    const disk = snapshot.disk;
    const mem = snapshot.memory;
    const cpu = snapshot.cpu;
    
    // 告警检测
    const alerts = checkAlerts(snapshot);
    let alertStr = '';
    if (alerts.length > 0) {
      alertStr = ' ⚠️ ' + alerts.map(a => a.message).join(' | ');
    }
    
    process.stdout.write(
      `${time} | CPU: ${cpu.percent}% | 内存: ${mem.percent}% | 磁盘: ${disk.percent}% (${disk.used}/${disk.total})${alertStr}`
    );
    
    // 记录数据
    recordSnapshot();
    
    // 磁盘变化告警
    if (lastDisk > 0 && Math.abs(disk.percent - lastDisk) > 5) {
      console.log(`\n⚠️ 磁盘使用率变化: ${lastDisk}% → ${disk.percent}%`);
    }
    lastDisk = disk.percent;
  };
  
  updateDisplay();
  setInterval(updateDisplay, interval);
}

// CLI 解析
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--demo')) {
    // 生成演示数据
    ensureStateDir();
    const history = loadHistory();
    const demoCount = 100;
    
    for (let i = 0; i < demoCount; i++) {
      const date = new Date();
      date.setHours(date.getHours() - (demoCount - i));
      
      history.snapshots.push({
        timestamp: date.toISOString(),
        disk: { 
          percent: 50 + Math.floor(Math.random() * 10),
          used: '1.8T', total: '3.5T', available: '1.6T'
        },
        memory: { 
          percent: 30 + Math.floor(Math.random() * 20),
          used: '1.3GB', total: '3.9GB', available: '2.6GB'
        },
        cpu: { 
          percent: 10 + Math.floor(Math.random() * 40),
          cores: 2, model: 'Virtual CPU'
        },
        hostname: 'sandbox',
        uptime: 3600
      });
    }
    
    saveHistory(history);
    console.log(`✅ 生成了 ${demoCount} 条演示数据`);
    console.log('使用 --report 查看趋势报告');
    return;
  }
  
  if (args.includes('--watch') || args.includes('-w')) {
    const interval = args.includes('--interval') 
      ? parseInt(args[args.indexOf('--interval') + 1]) * 1000 
      : 5000;
    watchMode(interval);
    return;
  }
  
  if (args.includes('--record') || args.includes('-r')) {
    const snapshot = recordSnapshot();
    console.log('✅ 已记录资源快照');
    console.log(JSON.stringify(snapshot, null, 2));
    return;
  }
  
  if (args.includes('--report') || args.includes('--history')) {
    const history = loadHistory();
    const period = args.includes('--period') 
      ? args[args.indexOf('--period') + 1] || 'day'
      : 'day';
    
    if (args.includes('--report')) {
      const report = generateReport(history, period);
      console.log('📊 资源使用报告 (' + period + '):');
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log('📜 历史记录 (最近20条):');
      console.log(JSON.stringify(history.snapshots.slice(-20), null, 2));
    }
    return;
  }
  
  // 默认: 显示当前状态
  const snapshot = getSnapshot();
  console.log('📊 资源监控状态\n');
  console.log('🖥️  CPU: ' + snapshot.cpu.percent + '% (' + snapshot.cpu.cores + '核)');
  console.log('💾 内存: ' + snapshot.memory.percent + '% (' + snapshot.memory.used + '/' + snapshot.memory.total + ')');
  console.log('💿 磁盘: ' + snapshot.disk.percent + '% (' + snapshot.disk.used + '/' + snapshot.disk.total + ')');
  console.log('⏱️  运行时间: ' + Math.floor(snapshot.uptime / 3600) + '小时');
  console.log('');
  
  // 检查告警
  const alerts = checkAlerts(snapshot);
  if (alerts.length > 0) {
    console.log('⚠️ 告警:');
    alerts.forEach(a => console.log('  - ' + a.message));
  } else {
    console.log('✅ 资源使用正常');
  }
  
  console.log('\n使用 --help 查看更多选项');
}

main();
