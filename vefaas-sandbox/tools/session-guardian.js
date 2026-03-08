#!/usr/bin/env node

/**
 * OpenClaw Session & Cron Guardian
 * 自动清理过期会话、检测并修复卡住的定时任务
 * 
 * 使用方式:
 *   node session-guardian.js --check      # 检查并报告状态
 *   node session-guardian.js --fix         # 自动修复问题
 *   node session-guardian.js --watch      # 持续监控模式
 *   node session-guardian.js --report     # 生成详细报告
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SESSION_DIR = process.env.OPENCLAW_SESSION_DIR || '/root/.openclaw/agents/main/sessions';
const CRON_DIR = process.env.OPENCLAW_CRON_DIR || '/root/.openclaw/cron';
const MAX_SESSIONS = parseInt(process.env.MAX_SESSIONS) || 50;
const STALE_THRESHOLD_MS = parseInt(process.env.STALE_THRESHOLD) || 3600000; // 1小时

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function getSessions() {
  try {
    const sessionsFile = path.join(SESSION_DIR, 'sessions.json');
    if (!fs.existsSync(sessionsFile)) return {};
    return JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
  } catch (e) {
    return {};
  }
}

function getCronJobs() {
  try {
    const jobsFile = path.join(CRON_DIR, 'jobs.json');
    if (!fs.existsSync(jobsFile)) return [];
    const data = JSON.parse(fs.readFileSync(jobsFile, 'utf8'));
    return data.jobs || [];
  } catch (e) {
    return [];
  }
}

function analyzeSessions() {
  const sessions = getSessions();
  const keys = Object.keys(sessions);
  const now = Date.now();
  
  const analysis = {
    total: keys.length,
    byType: {},
    stale: [],
    cronStuck: []
  };
  
  // 分类统计
  keys.forEach(key => {
    const session = sessions[key];
    const type = key.includes('cron') ? 'cron' : 
                 key.includes('subagent') ? 'subagent' : 
                 key.includes('main') ? 'main' : 'other';
    
    if (!analysis.byType[type]) analysis.byType[type] = 0;
    analysis.byType[type]++;
    
    // 检查 stale 会话
    const updatedAt = session.updatedAt || 0;
    const age = now - updatedAt;
    
    if (age > STALE_THRESHOLD_MS && type !== 'main') {
      analysis.stale.push({ key, age: Math.round(age / 60000), updatedAt });
    }
    
    // 检查卡住的 cron 会话 (运行超过2小时)
    if (key.includes('cron') && age > 7200000) {
      analysis.cronStuck.push({ key, age: Math.round(age / 3600) });
    }
  });
  
  return analysis;
}

function analyzeCronJobs() {
  const jobs = getCronJobs();
  const sessions = getSessions();
  
  return jobs.map(job => {
    // 查找对应的 cron 会话
    const cronSessions = Object.keys(sessions).filter(k => k.includes(job.id));
    const runningSession = cronSessions.find(k => {
      const s = sessions[k];
      const age = Date.now() - (s.updatedAt || 0);
      return age < 3600000; // 1小时内更新
    });
    
    return {
      id: job.id,
      name: job.name,
      schedule: job.schedule,
      status: job.status || 'unknown',
      hasActiveSession: !!runningSession,
      lastRun: job.lastRun
    };
  });
}

function cleanupStaleSessions(dryRun = true) {
  const sessions = getSessions();
  const toDelete = [];
  const now = Date.now();
  
  Object.keys(sessions).forEach(key => {
    // 跳过 main 会话
    if (key === 'agent:main:main' || key.includes(':main:')) return;
    
    const session = sessions[key];
    const age = now - (session.updatedAt || 0);
    
    // 删除超过24小时的会话或超过限制的 cron 会话
    if (age > 86400000 || (key.includes('cron') && age > STALE_THRESHOLD_MS)) {
      toDelete.push(key);
    }
  });
  
  // 如果超过限制，删除最旧的 cron 会话
  const cronCount = Object.keys(sessions).filter(k => k.includes('cron')).length;
  if (cronCount > MAX_SESSIONS) {
    const cronSessions = Object.keys(sessions)
      .filter(k => k.includes('cron'))
      .map(k => ({ key: k, updatedAt: sessions[k].updatedAt || 0 }))
      .sort((a, b) => a.updatedAt - b.updatedAt);
    
    const toRemove = cronCount - MAX_SESSIONS;
    for (let i = 0; i < toRemove; i++) {
      if (!toDelete.includes(cronSessions[i].key)) {
        toDelete.push(cronSessions[i].key);
      }
    }
  }
  
  if (dryRun) {
    log(`[DRY RUN] 将删除 ${toDelete.length} 个过期会话`, 'yellow');
    return { deleted: toDelete.length, dryRun: true };
  }
  
  // 执行删除
  let deleted = 0;
  toDelete.forEach(key => {
    const sessionFile = path.join(SESSION_DIR, `${key}.jsonl`);
    if (fs.existsSync(sessionFile)) {
      fs.unlinkSync(sessionFile);
      deleted++;
    }
    delete sessions[key];
  });
  
  // 保存更新后的 sessions.json
  fs.writeFileSync(
    path.join(SESSION_DIR, 'sessions.json'),
    JSON.stringify(sessions, null, 2)
  );
  
  log(`已清理 ${deleted} 个过期会话`, 'green');
  return { deleted, dryRun: false };
}

function fixStuckCron(dryRun = true) {
  const analysis = analyzeSessions();
  const stuckCrons = analysis.cronStuck;
  
  if (stuckCrons.length === 0) {
    log('没有卡住的定时任务', 'green');
    return { fixed: 0, dryRun };
  }
  
  log(`发现 ${stuckCrons.length} 个卡住的定时任务:`, 'red');
  stuckCrons.forEach(c => log(`  - ${c.key} (运行超过 ${c.age} 小时)`, 'yellow'));
  
  if (dryRun) {
    return { fixed: stuckCrons.length, dryRun: true };
  }
  
  // 重启 gateway 来清理卡住的会话
  try {
    execSync('systemctl --user restart openclaw-gateway', { timeout: 10000 });
    log('Gateway 已重启', 'green');
  } catch (e) {
    log('Gateway 重启失败: ' + e.message, 'red');
  }
  
  return { fixed: stuckCrons.length, dryRun: false };
}

function generateReport() {
  const sessionAnalysis = analyzeSessions();
  const cronAnalysis = analyzeCronJobs();
  
  console.log('\n' + '='.repeat(60));
  log('OpenClaw Session & Cron Guardian 报告', 'blue');
  console.log('='.repeat(60));
  
  log('\n📊 会话统计:', 'blue');
  log(`  总会话数: ${sessionAnalysis.total}`, 'reset');
  Object.entries(sessionAnalysis.byType).forEach(([type, count]) => {
    log(`    - ${type}: ${count}`, 'reset');
  });
  
  log(`\n  ⚠️ 过期会话: ${sessionAnalysis.stale.length}`, sessionAnalysis.stale.length > 0 ? 'yellow' : 'green');
  log(`  🔴 卡住的Cron: ${sessionAnalysis.cronStuck.length}`, sessionAnalysis.cronStuck.length > 0 ? 'red' : 'green');
  
  log('\n⏰ 定时任务状态:', 'blue');
  cronAnalysis.forEach(job => {
    const statusIcon = job.status === 'ok' ? '✅' : job.status === 'error' ? '❌' : '⏳';
    const sessionIcon = job.hasActiveSession ? '🔴' : '✅';
    log(`  ${statusIcon} ${job.name} (${job.schedule}) ${sessionIcon}`, 'reset');
  });
  
  log('\n💡 建议:', 'blue');
  if (sessionAnalysis.total > MAX_SESSIONS) {
    log(`  - 会话数超过限制 (${sessionAnalysis.total} > ${MAX_SESSIONS}), 建议运行 --fix 清理`, 'yellow');
  }
  if (sessionAnalysis.cronStuck.length > 0) {
    log(`  - 有 ${sessionAnalysis.cronStuck.length} 个Cron任务卡住, 建议运行 --fix 修复`, 'red');
  }
  if (sessionAnalysis.total < MAX_SESSIONS && sessionAnalysis.cronStuck.length === 0) {
    log('  - 系统状态正常', 'green');
  }
  
  console.log('='.repeat(60) + '\n');
  
  return { sessions: sessionAnalysis, cron: cronAnalysis };
}

function watchMode(intervalMs = 300000) {
  log(`启动持续监控模式 (每 ${intervalMs / 60000} 分钟检查一次)`, 'blue');
  
  setInterval(() => {
    log('\n--- 定期检查 ---', 'blue');
    const analysis = analyzeSessions();
    
    // 自动修复
    if (analysis.cronStuck.length > 0) {
      log('检测到卡住的Cron, 尝试修复...', 'yellow');
      fixStuckCron(false);
    }
    
    if (analysis.total > MAX_SESSIONS) {
      log('会话过多, 清理过期会话...', 'yellow');
      cleanupStaleSessions(false);
    }
    
    generateReport();
  }, intervalMs);
}

// 主程序
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case '--check':
    generateReport();
    break;
    
  case '--fix':
    log('执行自动修复...', 'blue');
    cleanupStaleSessions(false);
    fixStuckCron(false);
    generateReport();
    break;
    
  case '--watch':
    const interval = parseInt(args[1]) || 300000;
    watchMode(interval);
    break;
    
  case '--report':
    generateReport();
    break;
    
  default:
    console.log(`
OpenClaw Session & Cron Guardian
=================================

使用方式:
  node session-guardian.js --check      # 检查并报告状态
  node session-guardian.js --fix         # 自动修复问题  
  node session-guardian.js --watch [ms]  # 持续监控模式 (默认5分钟)
  node session-guardian.js --report      # 生成详细报告

环境变量:
  MAX_SESSIONS=50           # 最大允许会话数
  STALE_THRESHOLD=3600000   # 过期阈值 (毫秒)
  OPENCLAW_SESSION_DIR      # 会话目录
  OPENCLAW_CRON_DIR        # Cron目录
`);
}
