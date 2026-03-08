#!/usr/bin/env node
/**
 * Autonomous Agent v3 - 集成版自治智能体
 * 
 * v2基础上集成两位主管工具的精华：
 * 1. 多API自动故障切换 (借鉴 node-diagnose.js + api-switcher.py)
 * 2. fucheers Claude Opus 4.5 作为备用AI大脑
 * 3. 火山引擎双key轮换
 * 4. MiniMax Coding Plan 自动检测额度
 * 5. evomap限速处理 (借鉴 evomap-fixed.js 的 jitter + retry)
 */
const { execSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const https = require('https');
const os = require('os');

const SERVER = os.hostname();
const PEERS = ["7zi.com","bot.szspd.cn","bot2.szspd.cn","bot3.szspd.cn","bot4.szspd.cn","bot5.szspd.cn","bot6.szspd.cn"];
const LOG_FILE = '/tmp/autonomous-agent.log';
const THINK_INTERVAL = 300000; // 5分钟
let cycle = 0;

// ============ 多API Provider配置 (借鉴 node-diagnose.js + api-switcher.py) ============
const API_PROVIDERS = [
  {
    name: 'volcengine-1',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    apiKey: '4e051cf9-b27b-41eb-9540-2890ad94a271',
    model: 'doubao-1-5-pro-32k-250115',
    picoModel: 'doubao-1-5-pro',
    priority: 1,
    free: true,
    healthy: true,
    consecutiveFailures: 0,
    lastCheck: 0,
  },
  {
    name: 'volcengine-2',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    apiKey: 'aab2bcb7-753d-4d59-8f6c-91953feec979',
    model: 'doubao-1-5-pro-32k-250115',
    picoModel: null, // 直接API调用，不走picoclaw
    priority: 2,
    free: true,
    healthy: true,
    consecutiveFailures: 0,
    lastCheck: 0,
  },
  {
    name: 'minimax',
    baseUrl: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
    apiKey: 'sk-cp--HJ367Hzkp0OAqaY88Wzzcxp1Z9VSdMi7HDiWzp78sdqrnIXH9nmNVuoGiiHxpyoS0PSzb_V5R31ZEchtAGTODFDfGeR-xk8eW_I2GLxvDOotOh7Bjc1QA8',
    model: 'MiniMax-M2.5',
    picoModel: null,
    priority: 3,
    free: true, // coding plan
    healthy: true,
    consecutiveFailures: 0,
    lastCheck: 0,
  },
  {
    name: 'fucheers-claude',
    baseUrl: 'https://www.fucheers.top/v1/chat/completions',
    apiKey: 'sk-vThaRocE0Gjpe0BpROPzKTavtazIT0MUx2ly1wbcuqfKtnSh',
    model: 'claude-opus-4-5-20251101',
    picoModel: null,
    priority: 4,
    free: false,
    healthy: true,
    consecutiveFailures: 0,
    lastCheck: 0,
  },
];

let currentProviderIdx = 0;

function log(msg) {
  const line = `[${new Date().toISOString()}] [${SERVER}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch(e) {}
}

function run(cmd, timeout) {
  try { return execSync(cmd, { timeout: timeout || 15000, encoding: 'utf8' }).trim(); }
  catch(e) { return ''; }
}

// ============ 直接API调用 (不走picoclaw，借鉴 smart-api-router.js) ============
function directApiCall(provider, messages, tools) {
  return new Promise((resolve, reject) => {
    const url = new URL(provider.baseUrl);
    const body = JSON.stringify({
      model: provider.model,
      messages,
      max_tokens: 2048,
      ...(tools ? { tools } : {}),
    });
    const opts = {
      hostname: url.hostname, port: url.port || 443, path: url.pathname,
      method: 'POST', timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.choices && j.choices[0]) resolve(j.choices[0].message);
          else if (j.error) reject(new Error(j.error.message || JSON.stringify(j.error)));
          else reject(new Error('unexpected: ' + data.substring(0, 100)));
        } catch(e) { reject(new Error('parse: ' + data.substring(0, 80))); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

// ============ AI思考：picoclaw优先，失败自动切换直接API (核心创新) ============
async function aiThink(task) {
  // 策略1: 先尝试picoclaw (有exec工具链，最强)
  const picoProvider = API_PROVIDERS.find(p => p.picoModel && p.healthy);
  if (picoProvider) {
    const escaped = task.replace(/"/g, '\\"').replace(/`/g, '\\`');
    try {
      const out = execSync(
        `timeout 60 picoclaw agent --model ${picoProvider.picoModel} -m "${escaped}" -s auto-${Date.now()}`,
        { timeout: 65000, encoding: 'utf8' }
      ).trim();
      const m = out.match(/🦞\s*([\s\S]*)/);
      const result = m ? m[1].trim() : out.split('\n').pop();
      if (!result.includes('picoclaw-error') && result.length > 5) {
        picoProvider.consecutiveFailures = 0;
        return { result, provider: picoProvider.name, method: 'picoclaw' };
      }
    } catch(e) {
      picoProvider.consecutiveFailures++;
      if (picoProvider.consecutiveFailures >= 3) picoProvider.healthy = false;
      log(`picoclaw失败(${picoProvider.name}): ${e.message.substring(0, 60)}`);
    }
  }

  // 策略2: 直接API调用，按优先级遍历所有健康provider
  const sorted = API_PROVIDERS.filter(p => p.healthy).sort((a,b) => a.priority - b.priority);
  for (const provider of sorted) {
    try {
      log(`尝试直接API: ${provider.name}`);
      const msg = await directApiCall(provider, [
        { role: 'system', content: `你是${SERVER}的自治智能体。用中文简洁回答。直接给出分析结果。` },
        { role: 'user', content: task }
      ]);
      provider.consecutiveFailures = 0;
      provider.healthy = true;
      return { result: msg.content || '(empty)', provider: provider.name, method: 'direct-api' };
    } catch(e) {
      provider.consecutiveFailures++;
      if (provider.consecutiveFailures >= 3) provider.healthy = false;
      log(`API失败(${provider.name}): ${e.message.substring(0, 60)}`);
    }
  }

  // 策略3: 所有都失败，重置健康状态等下次重试
  API_PROVIDERS.forEach(p => { if (p.consecutiveFailures < 10) p.healthy = true; });
  return { result: 'all-providers-failed', provider: 'none', method: 'failed' };
}

// ============ 系统健康检查 ============
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
  const zombies = parseInt(run("ps aux | awk '$8~/Z/' | wc -l")) || 0;
  return { load, mem, disk, pico, zombies };
}

// ============ 确定性自修复 (不花API钱) ============
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
  if (h.zombies > 5) {
    run("ps aux | awk '$8~/Z/{print $2}' | head -20 | xargs -r kill -9 2>/dev/null");
    actions.push('killed_zombies_' + h.zombies);
  }
  if (h.disk > 85) {
    run("journalctl --vacuum-size=50M 2>/dev/null");
    run("rm -rf /tmp/node-compile-cache /tmp/jiti 2>/dev/null");
    actions.push('disk_cleanup');
  }
  // 日志截断
  [LOG_FILE, '/tmp/picoclaw-gateway.log', '/tmp/aa-v2.log'].forEach(f => {
    try {
      if (fs.statSync(f).size > 50*1024*1024) {
        run('tail -500 ' + f + ' > ' + f + '.tmp && mv ' + f + '.tmp ' + f);
        actions.push('truncated_' + f.split('/').pop());
      }
    } catch(e) {}
  });
  return actions;
}

// ============ API健康探测 (借鉴 smart-api-router.js 的10秒探测) ============
async function probeApis() {
  log('API健康探测...');
  for (const p of API_PROVIDERS) {
    if (Date.now() - p.lastCheck < 600000 && p.healthy) continue; // 10分钟内探测过且健康就跳过
    try {
      await directApiCall(p, [{role:'user',content:'hi'}]);
      p.healthy = true;
      p.consecutiveFailures = 0;
      log(`  ✅ ${p.name}`);
    } catch(e) {
      p.consecutiveFailures++;
      if (p.consecutiveFailures >= 2) p.healthy = false;
      log(`  ❌ ${p.name}: ${e.message.substring(0,40)}`);
    }
    p.lastCheck = Date.now();
  }
  const healthy = API_PROVIDERS.filter(p => p.healthy).map(p => p.name);
  log(`可用API: ${healthy.join(', ') || 'NONE'}`);
}

// ============ Peer报告 ============
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

// ============ 思考任务 ============
const PREFIX = `你是${SERVER}的自治智能体。`;
const THINK_TASKS = [
  `${PREFIX}请分析以下系统状态并给出建议：\n`,
  `${PREFIX}检查是否有异常登录或异常端口，给出安全建议。\n执行: last -5 && ss -tlnp`,
  `${PREFIX}分析磁盘和日志占用，建议清理方案。\n执行: du -sh /tmp/* /var/log/* 2>/dev/null | sort -rh | head -10`,
  `${PREFIX}确认picoclaw端口18795正常，检查服务健康。`,
  `${PREFIX}如果磁盘超70%，建议清理方案。当前磁盘状态：\n`,
  `${PREFIX}检查网络连通性，ping集群其他节点，报告结果。`,
];

// ============ 主思考循环 ============
async function think() {
  try {
    const h = getHealth();
    log(`Health: mem=${h.mem}% disk=${h.disk}% load=${h.load} pico=${h.pico}`);

    // 1. 确定性自修复
    const healed = selfHeal(h);
    if (healed.length > 0) {
      log('Self-healed: ' + healed.join(', '));
      reportToPeers({ type: 'self_heal', actions: healed, health: h });
    }

    // 2. 每6个周期探测API健康 (30分钟)
    if (cycle % 6 === 0) {
      await probeApis();
    }

    // 3. 每3个周期AI思考 (15分钟，省额度)
    if (cycle % 3 === 0) {
      const taskIdx = Math.floor(cycle / 3) % THINK_TASKS.length;
      let task = THINK_TASKS[taskIdx];

      // 给任务附加实时数据
      if (taskIdx === 0) {
        task += `mem=${h.mem}% disk=${h.disk}% load=${h.load} pico=${h.pico}`;
      } else if (taskIdx === 4) {
        task += `disk=${h.disk}%`;
      }

      log('AI-Think #' + taskIdx + ': ' + task.substring(0, 50) + '...');
      const { result, provider, method } = await aiThink(task);
      log(`AI-Result [${provider}/${method}]: ${result.substring(0, 200)}`);

      reportToPeers({
        type: 'ai_think', task: taskIdx,
        result: result.substring(0, 300),
        provider, method, health: h
      });
    }

    // 4. 每6个周期报告状态
    if (cycle % 6 === 0) {
      const apis = API_PROVIDERS.filter(p => p.healthy).map(p => p.name);
      reportToPeers({ type: 'status', health: h, apis, ts: Date.now() });
    }

    cycle++;
  } catch(e) {
    log('Think error: ' + e.message);
  }
}

// ============ 启动 ============
async function main() {
  log('=== Autonomous Agent v3 started ===');
  log(`Server: ${SERVER} | Interval: ${THINK_INTERVAL/1000}s`);
  log(`Providers: ${API_PROVIDERS.map(p=>p.name).join(', ')}`);
  log('Strategy: picoclaw优先 → 直接API故障切换');

  // 首次探测API
  await probeApis();

  // 首次思考
  await think();

  // 定时循环
  setInterval(think, THINK_INTERVAL);
}

main().catch(e => log('Fatal: ' + e.message));
