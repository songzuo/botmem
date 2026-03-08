#!/usr/bin/env node

/**
 * 系统日志分析器 - Log Analyzer
 * 分析系统日志、OpenClaw日志、API日志，生成健康报告
 * 
 * 使用方式:
 *   node log-analyzer.js              # 分析所有日志
 *   node log-analyzer.js --hours=24   # 分析最近24小时
 *   node log-analyzer.js --errors     # 只显示错误
 *   node log-analyzer.js --web        # 启动Web面板
 */

const fs = require('fs');
const http = require('http');
const os = require('os');

// 配置
const CONFIG = {
  logPaths: [
    '/var/log/dpkg.log',
    '/var/log/apt/term.log',
    '/workspace/projects/workspace/diagnostics.log',
  ],
  errorPatterns: [
    /error|Error|ERROR/i,
    /fail|Fail|FAIL/i,
    /critical|CRITICAL/i,
    /warning|WARNING/i,
    /exception|EXCEPTION/i,
    /denied|DENIED/i,
    /timeout|TIMEOUT/i,
    /404|not found/i,
    /401|403|unauthorized/i,
  ],
  webPort: 18801,
};

function execSync(cmd) {
  return require('child_process').execSync(cmd, { encoding: 'utf8' });
}

// 解析日志行
function parseLogLine(line) {
  const timestampRegex = /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/;
  const match = line.match(timestampRegex);
  
  return {
    raw: line,
    timestamp: match ? new Date(match[1]) : null,
    level: detectLogLevel(line),
    message: line,
  };
}

// 检测日志级别
function detectLogLevel(line) {
  if (/error|ERROR|critical|CRITICAL/i.test(line)) return 'ERROR';
  if (/warning|WARNING/i.test(line)) return 'WARNING';
  if (/info|INFO/i.test(line)) return 'INFO';
  if (/debug|DEBUG/i.test(line)) return 'DEBUG';
  return 'OTHER';
}

// 读取日志文件
function readLogFile(filePath, hours = 24) {
  if (!fs.existsSync(filePath)) return [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return lines.slice(-5000).map(parseLogLine).filter(entry => {
      if (!entry.timestamp) return true;
      return entry.timestamp >= cutoffTime;
    });
  } catch (e) {
    return [];
  }
}

// 分析错误模式
function analyzeErrors(logs) {
  const errorStats = {
    total: 0,
    byLevel: {},
    byPattern: {},
    recent: [],
  };
  
  logs.forEach(entry => {
    if (entry.level === 'ERROR' || entry.level === 'WARNING') {
      errorStats.total++;
      errorStats.byLevel[entry.level] = (errorStats.byLevel[entry.level] || 0) + 1;
      
      CONFIG.errorPatterns.forEach(pattern => {
        const match = entry.message.match(pattern);
        if (match) {
          const key = match[0].toLowerCase();
          errorStats.byPattern[key] = (errorStats.byPattern[key] || 0) + 1;
        }
      });
    }
  });
  
  errorStats.recent = logs.filter(e => e.level === 'ERROR').slice(-10);
  
  return errorStats;
}

// 系统健康分析
function analyzeSystemHealth() {
  const health = {
    timestamp: new Date().toISOString(),
    hostname: os.hostname(),
    uptime: os.uptime(),
    cpu: {
      count: os.cpus().length,
      load: os.loadavg(),
    },
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      usedPercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(1),
    },
    disk: {},
  };
  
  try {
    const dfOutput = execSync('df -h /workspace/projects/workspace | tail -1').toString();
    const parts = dfOutput.split(/\s+/);
    health.disk = {
      total: parts[1],
      used: parts[2],
      avail: parts[3],
      usePercent: parts[4],
    };
  } catch (e) {
    health.disk = { error: 'Unable to read' };
  }
  
  return health;
}

// 生成HTML
function generateHtml(report) {
  const errorPatterns = Object.entries(report.errors.byPattern)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([k, v]) => v + '次: ' + k)
    .join('\n') || '无错误';
  
  const recentErrors = report.errors.recent.slice(-10).map(e => {
    const time = e.timestamp ? e.timestamp.toLocaleString() : '未知';
    return '[' + time + '] ' + e.message.substring(0, 100);
  }).join('\n') || '无错误';
  
  return '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <title>OpenClaw 日志分析器</title>\n  <style>\n    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: #eee; }\n    h1 { color: #00d9ff; }\n    .card { background: #16213e; border-radius: 12px; padding: 20px; margin: 15px 0; }\n    .stat { display: inline-block; margin: 10px 20px 10px 0; }\n    .stat-value { font-size: 28px; font-weight: bold; color: #00d9ff; }\n    .stat-label { color: #888; font-size: 14px; }\n    .error { color: #ff6b6b; }\n    pre { background: #0f0f23; padding: 15px; border-radius: 8px; overflow-x: auto; }\n    .refresh { position: fixed; top: 20px; right: 20px; background: #00d9ff; color: #000; padding: 10px 20px; border-radius: 20px; text-decoration: none; font-weight: bold; }\n  </style>\n</head>\n<body>\n  <a href="/" class="refresh">🔄 刷新</a>\n  <h1>📊 OpenClaw 日志分析器</h1>\n  <p>更新于: ' + new Date().toLocaleString() + '</p>\n  \n  <div class="card">\n    <h2>📈 统计概览</h2>\n    <div class="stat">\n      <div class="stat-value">' + report.logs.length + '</div>\n      <div class="stat-label">总日志数</div>\n    </div>\n    <div class="stat">\n      <div class="stat-value error">' + report.errors.total + '</div>\n      <div class="stat-label">错误/警告</div>\n    </div>\n    <div class="stat">\n      <div class="stat-value">' + report.health.cpu.count + '核</div>\n      <div class="stat-label">CPU</div>\n    </div>\n    <div class="stat">\n      <div class="stat-value">' + report.health.memory.usedPercent + '%</div>\n      <div class="stat-label">内存</div>\n    </div>\n    <div class="stat">\n      <div class="stat-value">' + (report.health.disk.usePercent || 'N/A') + '</div>\n      <div class="stat-label">磁盘</div>\n    </div>\n  </div>\n  \n  <div class="card">\n    <h2>🔍 错误模式</h2>\n    <pre>' + errorPatterns + '</pre>\n  </div>\n  \n  <div class="card">\n    <h2>⚠️ 最近错误</h2>\n    <pre>' + recentErrors + '</pre>\n  </div>\n  \n  <script>setTimeout(function(){ location.reload(); }, 30000);</script>\n</body>\n</html>';
}

// 生成报告
function generateReport(options = {}) {
  const hours = options.hours || 24;
  console.log('\n📊 日志分析报告 (最近 ' + hours + ' 小时)\n' + '='.repeat(50));
  
  const allLogs = [];
  CONFIG.logPaths.forEach(logPath => {
    const logs = readLogFile(logPath, hours);
    allLogs.push(...logs);
    if (logs.length > 0) {
      console.log('  ✓ 读取 ' + logPath + ': ' + logs.length + ' 条记录');
    }
  });
  
  console.log('\n📈 总体统计:');
  console.log('   总日志数: ' + allLogs.length);
  
  const errorStats = analyzeErrors(allLogs);
  console.log('   错误/警告数: ' + errorStats.total);
  console.log('   - ERROR: ' + (errorStats.byLevel.ERROR || 0));
  console.log('   - WARNING: ' + (errorStats.byLevel.WARNING || 0));
  
  if (Object.keys(errorStats.byPattern).length > 0) {
    console.log('\n🔍 错误模式分析:');
    Object.entries(errorStats.byPattern)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([pattern, count]) => {
        console.log('   "' + pattern + '": ' + count + ' 次');
      });
  }
  
  const health = analyzeSystemHealth();
  console.log('\n💻 系统健康状态:');
  console.log('   CPU: ' + health.cpu.count + ' 核, 负载 ' + health.cpu.load.map(l => l.toFixed(2)).join('/'));
  console.log('   内存: ' + health.memory.usedPercent + '% 使用');
  console.log('   磁盘: ' + (health.disk.usePercent || 'N/A') + ' 使用');
  console.log('   运行时间: ' + Math.floor(health.uptime / 3600) + 'h');
  
  if (errorStats.recent.length > 0 && !options.errorsOnly) {
    console.log('\n⚠️ 最近错误 (' + errorStats.recent.length + ' 条):');
    errorStats.recent.slice(-5).forEach(entry => {
      const time = entry.timestamp ? entry.timestamp.toLocaleString() : '未知时间';
      console.log('   [' + time + '] ' + entry.message.substring(0, 80) + '...');
    });
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  return { logs: allLogs, errors: errorStats, health };
}

// Web界面
function startWebServer() {
  const server = http.createServer((req, res) => {
    const report = generateReport({ hours: 24 });
    const html = generateHtml(report);
    
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
  
  server.listen(CONFIG.webPort, () => {
    console.log('🌐 Web面板运行在 http://localhost:' + CONFIG.webPort);
  });
}

// CLI
const args = process.argv.slice(2);
if (args.includes('--web')) {
  startWebServer();
} else {
  const hoursArg = args.find(a => a.startsWith('--hours='));
  const options = {
    hours: hoursArg ? parseInt(hoursArg.split('=')[1]) : 24,
    errorsOnly: args.includes('--errors'),
  };
  generateReport(options);
}
