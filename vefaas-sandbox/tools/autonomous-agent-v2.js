#!/usr/bin/env node
/**
 * Autonomous Agent v2 - 真正的自治智能体
 * 用 picoclaw agent 作为AI大脑，自主思考+执行+修复+报告
 */
const { execSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');

const SERVER = os.hostname();
const PEERS = ["7zi.com","bot2.szspd.cn","bot3.szspd.cn","bot4.szspd.cn","bot5.szspd.cn","bot6.szspd.cn"];
const LOG_FILE = '/tmp/autonomous-agent.log';
const THINK_INTERVAL = 300000; // 5分钟
let cycle = 0;

function log(msg) {
  const line = `[${new Date().toISOString()}] [${SERVER}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch(e) {}
}

function run(cmd, timeout) {
  try { return execSync(cmd, { timeout: timeout || 15000, encoding: 'utf8' }).trim(); }
  catch(e) { return ''; }
}

// picoclaw agent 执行自主思考
function picoThink(task, session) {
  const s = session || 'auto-' + Date.now();
  const escaped = task.replace(/"/g, '\\"').replace(/`/g, '\\`');
  try {
    const out = execSync(
      `timeout 60 picoclaw agent --model doubao-1-5-pro -m "${escaped}" -s ${s}`,
      { timeout: 65000, encoding: 'utf8' }
    ).trim();
    // 提取🦞后面的回答
    const m = out.match(/🦞\s*([\s\S]*)/);
    return m ? m[1].trim() : out.split('\n').pop();
  } catch(e) {
    return 'picoclaw-error: ' + e.message.substring(0, 80);
  }
}

function getHealth() {
  let load = '0', mem = 0, disk = 0;
  try { load = fs.readFileSync('/proc/loadavg', 'utf8').split(' ')[0]; } catch(e) {}
  try {
    const mi = fs.readFileSync('/proc/meminfo', 'utf8');
    const total = parseInt(mi.match(/MemTotal:\s+(\d+)/)[1]);
    const avail = parseInt(mi.match(/MemAvailable:\s+(\d+)/)[1]);
    mem = Math.round(100 * (total - avail) / total);
  } catch(e) {}
  try { disk = parseInt(run("df / --output=pcent | tail -1")) || 0; } catch(e) {}
  const pico = run("ss -tlnp | grep -c ':18795 '") !== '0' ? 1 : 0;
  const oc = parseInt(run("pgrep -fc openclaw-gateway")) || 0;
  const zombies = parseInt(run("ps aux | awk '$8~/Z/' | wc -l")) || 0;
  return { load, mem, disk, pico, oc, zombies };
}

function selfHeal(h) {
  const actions = [];
  if (h.mem > 90) {
    run("sync && echo 3 > /proc/sys/vm/drop_caches");
    actions.push('cleared_cache');
  }
  if (h.pico === 0) {
    run("nohup picoclaw gateway > /tmp/picoclaw-gateway.log 2>&1 &");
    actions.push('restarted_picoclaw');
  }
  if (h.oc === 0) {
    run("nohup openclaw-gateway > /tmp/openclaw-gateway.log 2>&1 &");
    actions.push('restarted_openclaw');
  }
  if (h.zombies > 5) {
    run("ps aux | awk '$8~/Z/{print $2}' | head -20 | xargs -r kill -9 2>/dev/null");
    actions.push('killed_zombies_' + h.zombies);
  }
  // 日志截断
  ['/tmp/autonomous-agent.log','/tmp/picoclaw-gateway.log'].forEach(f => {
    try {
      if (fs.statSync(f).size > 50*1024*1024) {
        run('tail -500 ' + f + ' > ' + f + '.tmp && mv ' + f + '.tmp ' + f);
        actions.push('truncated_log');
      }
    } catch(e) {}
  });
  return actions;
}

function reportToPeers(data) {
  for (const peer of PEERS) {
    if (peer === SERVER || peer.startsWith(SERVER)) continue;
    try {
      const req = http.request({
        hostname: peer, port: 9100, path: '/report', method: 'POST',
        headers: { 'Authorization': 'Bearer cluster2026', 'Content-Type': 'application/json' },
        timeout: 5000
      }, function(){});
      req.on('error', function(){});
      req.on('timeout', function(){ req.destroy(); });
      req.write(JSON.stringify({ from: SERVER, ...data }));
      req.end();
    } catch(e) {}
  }
}

// 提示前缀：强制直接执行，不spawn子任务，中文回答
const PREFIX = '重要：直接用exec工具执行命令，不要用spawn，不要委托子任务。用中文简洁回答。你是${SERVER}的自治智能体。';

const THINK_TASKS = [
  '${P}请用exec执行 free -h 和 df -h 和 cat /proc/loadavg，汇总报告系统状态。',
  '${P}请用exec执行 last -5 和 ss -tlnp，检查是否有异常登录或异常端口。',
  '${P}请用exec执行 du -sh /tmp/* /var/log/* 2>/dev/null | sort -rh | head -10，清理超过50M的日志文件。',
  '${P}请用exec执行 ss -tlnp | grep -E "18795|5000"，确认picoclaw和openclaw端口正常。不正常就重启。',
  '${P}请用exec执行 df -h，如果磁盘超70%就用 apt clean 和清理/tmp大文件来释放空间。',
  '${P}请用exec执行 ping -c1 -W2 7zi.com 和 ping -c1 -W2 bot3.szspd.cn 和 ping -c1 -W2 bot5.szspd.cn，报告连通性。',
];

async function think() {
  try {
    const h = getHealth();
    log('Health: mem=' + h.mem + '% disk=' + h.disk + '% load=' + h.load + ' pico=' + h.pico + ' oc=' + h.oc);

    // 1. 确定性自修复（不花钱）
    const healed = selfHeal(h);
    if (healed.length > 0) {
      log('Self-healed: ' + healed.join(', '));
      reportToPeers({ type: 'self_heal', actions: healed, health: h });
    }

    // 2. 每3个周期用picoclaw做一次AI思考（省API额度）
    if (cycle % 3 === 0) {
      const taskIdx = Math.floor(cycle / 3) % THINK_TASKS.length;
      const task = THINK_TASKS[taskIdx].replace('${P}', PREFIX.replace('${SERVER}', SERVER)).replace('${SERVER}', SERVER);
      log('AI-Think #' + taskIdx + ': ' + task.substring(0, 40) + '...');

      const result = picoThink(task, 'auto-think');
      log('AI-Result: ' + result.substring(0, 200));

      reportToPeers({ type: 'ai_think', task: taskIdx, result: result.substring(0, 300), health: h });
    }

    // 3. 每6个周期报告状态
    if (cycle % 6 === 0) {
      reportToPeers({ type: 'status', health: h, ts: Date.now() });
    }

    cycle++;
  } catch(e) {
    log('Think error: ' + e.message);
  }
}

async function main() {
  log('=== Autonomous Agent v2 started ===');
  log('Server: ' + SERVER + ' | Think interval: ' + (THINK_INTERVAL/1000) + 's');
  log('AI brain: picoclaw agent (doubao-1.5-pro)');

  // 首次立即执行
  await think();

  // 定时循环
  setInterval(think, THINK_INTERVAL);
}

main().catch(e => log('Fatal: ' + e.message));
