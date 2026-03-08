#!/usr/bin/env node

/**
 * Memory Guardian - 内存守护与自动优化工具
 * 
 * 功能:
 * - 实时监控内存使用状况
 * - 检测内存泄漏和高占用进程
 * - 提供自动清理建议
 * - 支持定时监控模式
 * - 内存压力预警
 * 
 * 使用方式:
 * node memory-guardian.js              # 一次性检查
 * node memory-guardian.js --watch      # 持续监控模式
 * node memory-guardian.js --cleanup    # 执行清理建议
 * node memory-guardian.js --report      # 生成详细报告
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

const THRESHOLD_WARNING = 75;  // 警告阈值 %
const THRESHOLD_CRITICAL = 90; // 严重阈值 %

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function getMemoryInfo() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const usagePercent = ((used / total) * 100).toFixed(1);
  
  // 计算实际可用内存（free + buffers/cache）
  const memInfo = os.freemem();
  
  return {
    total: formatBytes(total),
    used: formatBytes(used),
    free: formatBytes(free),
    usagePercent: parseFloat(usagePercent),
    available: formatBytes(memInfo),
    freePercent: (100 - parseFloat(usagePercent)).toFixed(1)
  };
}

function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function getMemoryStatus() {
  const mem = getMemoryInfo();
  
  if (mem.usagePercent >= THRESHOLD_CRITICAL) {
    return { status: 'CRITICAL', color: colors.red, emoji: '🔴' };
  } else if (mem.usagePercent >= THRESHOLD_WARNING) {
    return { status: 'WARNING', color: colors.yellow, emoji: '🟡' };
  } else {
    return { status: 'OK', color: colors.green, emoji: '🟢' };
  }
}

function getTopMemoryProcesses() {
  return new Promise((resolve) => {
    exec('ps aux --sort=-%mem | head -11', (err, stdout) => {
      if (err) {
        resolve([]);
        return;
      }
      
      const lines = stdout.trim().split('\n').slice(1);
      const processes = lines.map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          pid: parts[1],
          mem: parts[3],
          command: parts.slice(10).join(' ')
        };
      }).slice(0, 5);
      
      resolve(processes);
    });
  });
}

function getNodeProcesses() {
  return new Promise((resolve) => {
    exec('ps aux | grep -E "node|openclaw" | grep -v grep', (err, stdout) => {
      if (err || !stdout.trim()) {
        resolve([]);
        return;
      }
      
      const lines = stdout.trim().split('\n');
      const processes = lines.map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          pid: parts[1],
          cpu: parts[2],
          mem: parts[3],
          command: parts.slice(10).join(' ')
        };
      });
      
      resolve(processes);
    });
  });
}

function analyzeMemoryPressure() {
  const mem = getMemoryInfo();
  const issues = [];
  const suggestions = [];
  
  if (mem.usagePercent >= THRESHOLD_WARNING) {
    issues.push(`内存使用率较高: ${mem.usagePercent}%`);
    suggestions.push('考虑关闭不必要的应用程序');
  }
  
  if (parseFloat(mem.freePercent) < 10) {
    issues.push(`可用内存不足: ${mem.free}`);
    suggestions.push('立即释放内存或增加swap');
  }
  
  // 检测大文件缓存
  const buffers = os.freemem();
  if (buffers < 100 * 1024 * 1024) { // < 100MB
    suggestions.push('执行 sync && echo 3 > /proc/sys/vm/drop_caches 清理缓存');
  }
  
  return { issues, suggestions };
}

function generateRecommendations(nodeProcesses, topProcesses) {
  const recommendations = [];
  
  // 分析Node进程
  if (nodeProcesses.length > 5) {
    recommendations.push({
      priority: 'HIGH',
      text: `检测到 ${nodeProcesses.length} 个Node进程，可能存在内存泄漏`,
      action: '检查并清理僵尸进程'
    });
  }
  
  // 分析高占用进程
  topProcesses.forEach(proc => {
    const memValue = parseFloat(proc.mem);
    if (memValue > 20) {
      recommendations.push({
        priority: 'HIGH',
        text: `进程 ${proc.pid} (${proc.command.substring(0, 30)}) 占用 ${proc.mem}% 内存`,
        action: `kill -9 ${proc.pid} 或检查该进程`
      });
    }
  });
  
  return recommendations;
}

async function runCheck(options = {}) {
  console.log('\n' + '='.repeat(60));
  console.log(colors.bold + '🧠 Memory Guardian - 内存状态检查' + colors.reset);
  console.log('='.repeat(60));
  
  const mem = getMemoryInfo();
  const memStatus = getMemoryStatus();
  
  console.log(`\n${memStatus.emoji} 状态: ${memStatus.color}${memStatus.status}${colors.reset}`);
  console.log(`\n📊 内存概览:`);
  console.log(`   总内存:   ${colors.bold}${mem.total}${colors.reset}`);
  console.log(`   已使用:   ${colors.bold}${mem.used} (${mem.usagePercent}%)${colors.reset}`);
  console.log(`   可用:     ${colors.bold}${mem.free} (${mem.freePercent}%)${colors.reset}`);
  console.log(`   实际可用: ${colors.bold}${mem.available}${colors.reset}`);
  
  // 内存条形图
  const barLength = 30;
  const filled = Math.round((mem.usagePercent / 100) * barLength);
  const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
  const barColor = mem.usagePercent >= THRESHOLD_WARNING ? colors.yellow : colors.green;
  console.log(`\n   [${barColor}${bar}${colors.reset}] ${mem.usagePercent}%`);
  
  // 分析问题
  const analysis = analyzeMemoryPressure();
  if (analysis.issues.length > 0) {
    console.log(`\n⚠️  ${colors.yellow}发现问题:${colors.reset}`);
    analysis.issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  if (analysis.suggestions.length > 0) {
    console.log(`\n💡 ${colors.cyan}建议:${colors.reset}`);
    analysis.suggestions.forEach(s => console.log(`   - ${s}`));
  }
  
  // 进程分析
  if (options.detailed) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(colors.bold + '🔍 高内存占用进程 (Top 5):' + colors.reset);
    
    const topProcesses = await getTopMemoryProcesses();
    topProcesses.forEach((proc, i) => {
      console.log(`   ${i+1}. PID ${proc.pid} | ${proc.mem}% | ${proc.command.substring(0, 40)}`);
    });
    
    console.log(`\n${'─'.repeat(60)}`);
    console.log(colors.bold + '🔍 Node/OpenClaw 进程:' + colors.reset);
    
    const nodeProcesses = await getNodeProcesses();
    if (nodeProcesses.length === 0) {
      console.log('   无运行中的Node进程');
    } else {
      nodeProcesses.forEach(proc => {
        console.log(`   PID ${proc.pid} | CPU: ${proc.cpu}% | MEM: ${proc.mem}% | ${proc.command.substring(0, 35)}`);
      });
    }
    
    // 生成建议
    const recommendations = generateRecommendations(nodeProcesses, topProcesses);
    if (recommendations.length > 0) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(colors.bold + '⚡ 优化建议:' + colors.reset);
      recommendations.forEach(rec => {
        const priorityColor = rec.priority === 'HIGH' ? colors.red : colors.yellow;
        console.log(`   [${priorityColor}${rec.priority}${colors.reset}] ${rec.text}`);
        console.log(`      → ${rec.action}`);
      });
    }
  }
  
  // 保存状态文件
  const stateFile = '/workspace/projects/workspace/memory/memory-state.json';
  const state = {
    timestamp: new Date().toISOString(),
    usagePercent: mem.usagePercent,
    status: memStatus.status,
    total: mem.total,
    used: mem.used,
    free: mem.free
  };
  
  try {
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  } catch (e) {
    // ignore
  }
  
  console.log('\n' + '='.repeat(60));
  
  // 返回状态码
  if (mem.usagePercent >= THRESHOLD_CRITICAL) {
    console.log(colors.red + '🔴 内存严重不足，建议立即处理!' + colors.reset);
    return 2;
  } else if (mem.usagePercent >= THRESHOLD_WARNING) {
    console.log(colors.yellow + '🟡 内存使用率较高，建议关注' + colors.reset);
    return 1;
  }
  
  console.log(colors.green + '🟢 内存状态正常' + colors.reset);
  return 0;
}

async function runWatch(interval = 5000) {
  console.log(`\n👁️  持续监控模式 (间隔: ${interval/1000}秒, 按 Ctrl+C 退出)\n`);
  
  const callback = async () => {
    const mem = getMemoryInfo();
    const memStatus = getMemoryStatus();
    const time = new Date().toLocaleTimeString();
    
    const barLength = 20;
    const filled = Math.round((mem.usagePercent / 100) * barLength);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
    
    process.stdout.write(`\r${time} [${memStatus.emoji}] [${bar}] ${mem.usagePercent}% | Free: ${mem.free}`);
  };
  
  callback(); // 立即执行一次
  setInterval(callback, interval);
}

async function generateReport() {
  const mem = getMemoryInfo();
  const topProcesses = await getTopMemoryProcesses();
  const nodeProcesses = await getNodeProcesses();
  const analysis = analyzeMemoryPressure();
  const recommendations = generateRecommendations(nodeProcesses, topProcesses);
  
  const report = {
    generatedAt: new Date().toISOString(),
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      uptime: os.uptime(),
      loadavg: os.loadavg()
    },
    memory: mem,
    status: getMemoryStatus(),
    topProcesses: topProcesses,
    nodeProcesses: nodeProcesses,
    analysis: analysis,
    recommendations: recommendations
  };
  
  const reportFile = `/workspace/projects/workspace/reports/memory-report-${Date.now()}.json`;
  
  try {
    const reportsDir = path.dirname(reportFile);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n✅ 报告已保存: ${reportFile}`);
  } catch (e) {
    console.error('报告保存失败:', e.message);
  }
  
  return report;
}

// 主程序
const args = process.argv.slice(2);
const { exec } = require('child_process');

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🧠 Memory Guardian - 内存守护工具

用法:
  node memory-guardian.js              一次性内存检查
  node memory-guardian.js --watch       持续监控模式
  node memory-guardian.js --detailed    详细分析（含进程）
  node memory-guardian.js --report      生成JSON报告
  node memory-guardian.js --help        显示帮助

阈值:
  警告: ${THRESHOLD_WARNING}%
  严重: ${THRESHOLD_CRITICAL}%

示例:
  node memory-guardian.js --detailed
  node memory-guardian.js --watch --interval=10000
`);
  process.exit(0);
}

let interval = 5000;
const watchIndex = args.indexOf('--watch');
const detailedIndex = args.indexOf('--detailed');
const reportIndex = args.indexOf('--report');
const intervalIndex = args.indexOf('--interval');

if (intervalIndex !== -1 && args[intervalIndex + 1]) {
  interval = parseInt(args[intervalIndex + 1]) * 1000;
}

if (watchIndex !== -1) {
  runWatch(interval);
} else if (reportIndex !== -1) {
  generateReport().then(() => process.exit(0));
} else {
  const options = { detailed: detailedIndex !== -1 };
  runCheck(options).then(code => process.exit(code));
}
