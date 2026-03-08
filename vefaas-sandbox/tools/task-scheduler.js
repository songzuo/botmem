#!/usr/bin/env node

/**
 * Task Scheduler - 定时任务调度与自动化编排器
 * 用于管理周期性任务：健康检查、备份、报告生成等
 * 
 * 使用方式:
 *   node task-scheduler.js --add --name=health-check --cron="0 * * * *" --script="cluster-health-check.js"
 *   node task-scheduler.js --list
 *   node task-scheduler.js --run health-check
 *   node task-scheduler.js --daemon
 */

const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');

const TASK_FILE = path.join(__dirname, '..', 'state', 'scheduler-tasks.json');
const LOG_FILE = path.join(__dirname, '..', 'state', 'scheduler.log');

// 确保目录存在
const stateDir = path.dirname(TASK_FILE);
if (!fs.existsSync(stateDir)) {
  fs.mkdirSync(stateDir, { recursive: true });
}

// 加载任务列表
function loadTasks() {
  if (!fs.existsSync(TASK_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(TASK_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

// 保存任务列表
function saveTasks(tasks) {
  fs.writeFileSync(TASK_FILE, JSON.stringify(tasks, null, 2));
}

// 日志记录
function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logLine);
  console.log(logLine.trim());
}

// 解析 cron 表达式 (简化版: minute hour day month weekday)
function parseCron(cronStr) {
  const parts = cronStr.trim().split(/\s+/);
  if (parts.length < 5) return null;
  
  return {
    minute: parts[0],
    hour: parts[1],
    day: parts[2],
    month: parts[3],
    weekday: parts[4]
  };
}

//是否应该运行任务 检查
function shouldRun(cronStr, lastRun) {
  const now = new Date();
  const cron = parseCron(cronStr);
  if (!cron) return false;
  
  const min = now.getMinutes();
  const hr = now.getHours();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const wd = now.getDay();
  
  const matchMin = cron.minute === '*' || parseInt(cron.minute) === min;
  const matchHr = cron.hour === '*' || parseInt(cron.hour) === hr;
  const matchDay = cron.day === '*' || parseInt(cron.day) === day;
  const matchMonth = cron.month === '*' || parseInt(cron.month) === month;
  const matchWd = cron.weekday === '*' || parseInt(cron.weekday) === wd;
  
  // 检查上次运行时间
  if (lastRun) {
    const lastDate = new Date(lastRun);
    const diffMs = now - lastDate;
    const diffMins = Math.floor(diffMs / 60000);
    
    // 每小时任务至少间隔 50 分钟
    if (cron.hour === '*' && diffMins < 50) return false;
    // 每天任务至少间隔 23 小时
    if (cron.day === '*' && diffMins < 1380) return false;
  }
  
  return matchMin && matchHr && matchDay && matchMonth && matchWd;
}

// 运行任务脚本
function runTask(task) {
  log(`[TASK] Starting: ${task.name}`);
  
  const startTime = Date.now();
  const isJsScript = task.script.endsWith('.js');
  
  return new Promise((resolve) => {
    const args = task.args ? task.args.split(' ') : [];
    const proc = spawn(
      isJsScript ? 'node' : 'bash',
      isJsScript ? [task.script, ...args] : [task.script],
      { 
        cwd: path.join(__dirname, '..'),
        env: { ...process.env }
      }
    );
    
    let output = '';
    proc.stdout.on('data', (data) => { output += data.toString(); });
    proc.stderr.on('data', (data) => { output += data.toString(); });
    
    proc.on('close', (code) => {
      const duration = Date.now() - startTime;
      const status = code === 0 ? 'SUCCESS' : 'FAILED';
      
      log(`[TASK] ${task.name} completed: ${status} (${duration}ms)`);
      
      if (task.logOutput) {
        const logPath = path.join(__dirname, '..', 'state', 'task-logs', `${task.name}.log`);
        const logDir = path.dirname(logPath);
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        fs.appendFileSync(logPath, `\n=== ${new Date().toISOString()} ===\n${output}\n`);
      }
      
      resolve({ code, output, duration, status });
    });
  });
}

// 主程序
async function main() {
  const args = process.argv.slice(2);
  const tasks = loadTasks();
  
  if (args.includes('--help') || args.length === 0) {
    console.log(`
🕐 Task Scheduler - 定时任务调度器

用法:
  node task-scheduler.js --add --name=<名称> --cron=<cron表达式> --script=<脚本路径> [选项]
  node task-scheduler.js --list
  node task-scheduler.js --run <名称>
  node task-scheduler.js --remove <名称>
  node task-scheduler.js --daemon
  node task-scheduler.js --status

选项:
  --add                    添加新任务
  --name=<名称>            任务名称 (必需 for --add)
  --cron=<表达式>          Cron 表达式 (如 "0 * * * *" 每小时)
  --script=<脚本>          要执行的脚本路径
  --args=<参数>            传递给脚本的参数
  --log                    记录任务输出到日志文件
  --list                   列出所有任务
  --run <名称>             立即运行指定任务
  --remove <名称>          删除任务
  --daemon                 守护进程模式 (持续运行)
  --status                 显示调度器状态
  --help                   显示帮助

Cron 表达式格式: minute hour day month weekday
  * * * * * = 每分钟
  0 * * * * = 每小时整点
  0 9 * * * = 每天 9:00
  0 9 * * 1 = 每周一 9:00

示例:
  node task-scheduler.js --add --name=health --cron="0 * * * *" --script="./tools/cluster-health-check.js"
  node task-scheduler.js --add --name=backup --cron="0 2 * * *" --script="./scripts/backup.sh" --log
  node task-scheduler.js --list
  node task-scheduler.js --run health
`);
    return;
  }
  
  // --list: 列出所有任务
  if (args.includes('--list')) {
    console.log('\n📋 已注册的任务:\n');
    const taskList = Object.entries(tasks);
    if (taskList.length === 0) {
      console.log('  (无任务)');
    } else {
      taskList.forEach(([name, task]) => {
        const lastRun = task.lastRun ? new Date(task.lastRun).toLocaleString() : '从未运行';
        const nextRun = shouldRun(task.cron, task.lastRun) ? '即将运行' : '等待中';
        console.log(`  ${name}`);
        console.log(`    Cron: ${task.cron}`);
        console.log(`    Script: ${task.script}`);
        console.log(`    上次运行: ${lastRun}`);
        console.log(`    状态: ${nextRun}`);
        console.log();
      });
    }
    return;
  }
  
  // --status: 显示调度器状态
  if (args.includes('--status')) {
    const taskCount = Object.keys(tasks).length;
    const daemonPidPath = path.join(stateDir, 'scheduler.pid');
    const isRunning = fs.existsSync(daemonPidPath);
    
    console.log(`
🕐 Task Scheduler 状态
━━━━━━━━━━━━━━━━━━━━━
  任务数量: ${taskCount}
  守护进程: ${isRunning ? '运行中' : '未运行'}
  状态文件: ${TASK_FILE}
`);
    return;
  }
  
  // --add: 添加新任务
  if (args.includes('--add')) {
    const name = args.find(a => a.startsWith('--name='))?.split('=')[1];
    const cron = args.find(a => a.startsWith('--cron='))?.split('=')[1];
    const script = args.find(a => a.startsWith('--script='))?.split('=')[1];
    const taskArgs = args.find(a => a.startsWith('--args='))?.split('=')[1];
    const logOutput = args.includes('--log');
    
    if (!name || !cron || !script) {
      console.log('❌ 错误: --name, --cron 和 --script 是必需参数');
      process.exit(1);
    }
    
    tasks[name] = {
      name,
      cron,
      script,
      args: taskArgs || '',
      logOutput,
      created: new Date().toISOString(),
      lastRun: null,
      runCount: 0
    };
    
    saveTasks(tasks);
    log(`[SCHEDULER] Added task: ${name} (${cron} -> ${script})`);
    console.log(`✅ 已添加任务: ${name}`);
    return;
  }
  
  // --remove: 删除任务
  if (args.includes('--remove')) {
    const name = args.find(a => a.startsWith('--remove='))?.split('=')[1] || args[1];
    if (!name) {
      console.log('❌ 错误: 请指定任务名称');
      return;
    }
    
    if (tasks[name]) {
      delete tasks[name];
      saveTasks(tasks);
      log(`[SCHEDULER] Removed task: ${name}`);
      console.log(`✅ 已删除任务: ${name}`);
    } else {
      console.log(`❌ 任务不存在: ${name}`);
    }
    return;
  }
  
  // --run: 立即运行任务
  if (args.includes('--run')) {
    const name = args[args.indexOf('--run') + 1];
    if (!name) {
      console.log('❌ 错误: 请指定任务名称');
      return;
    }
    
    if (!tasks[name]) {
      console.log(`❌ 任务不存在: ${name}`);
      return;
    }
    
    console.log(`🚀 运行任务: ${name}`);
    const result = await runTask(tasks[name]);
    tasks[name].lastRun = new Date().toISOString();
    tasks[name].runCount++;
    saveTasks(tasks);
    console.log(`\n📊 结果: ${result.status} (${result.duration}ms)`);
    return;
  }
  
  // --daemon: 守护进程模式
  if (args.includes('--daemon')) {
    const pidPath = path.join(stateDir, 'scheduler.pid');
    const pid = process.pid;
    
    // 写入 PID 文件
    fs.writeFileSync(pidPath, JSON.stringify({ pid, start: new Date().toISOString() }));
    
    console.log(`🕐 任务调度器守护进程已启动 (PID: ${pid})`);
    log('[SCHEDULER] Daemon started');
    
    // 每分钟检查一次
    setInterval(() => {
      const tasks = loadTasks();
      const now = new Date();
      
      Object.values(tasks).forEach(async (task) => {
        if (shouldRun(task.cron, task.lastRun)) {
          const result = await runTask(task);
          task.lastRun = now.toISOString();
          task.runCount++;
          saveTasks(loadTasks()); // 保存更新后的任务
        }
      });
    }, 60000); // 每分钟检查
    
    // 优雅退出
    process.on('SIGTERM', () => {
      log('[SCHEDULER] Daemon stopped');
      fs.unlinkSync(pidPath);
      process.exit(0);
    });
    
    return;
  }
}

main().catch(console.error);
