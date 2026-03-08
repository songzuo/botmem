#!/usr/bin/env node
/**
 * Autonomous Agent - 自治智能体
 * 每台机器运行一个，自己思考、自己修复、互相协助
 */
const { exec } = require('child_process');
const https = require('https');
const http = require('http');
const os = require('os');

const SERVER = os.hostname();
const PEERS = ["7zi.com","bot2.szspd.cn","bot3.szspd.cn","bot4.szspd.cn","bot5.szspd.cn","bot6.szspd.cn"];
const THINK_INTERVAL = 300000;
const HEALTH_INTERVAL = 60000;

const PROVIDERS = [
  { name:'volcengine', url:'https://ark.cn-beijing.volces.com/api/coding/v3', key:'4e051cf9-b27b-41eb-9540-2890ad94a271', model:'doubao-seed-code-preview-251028', ok:true, fails:0 },
  { name:'alibaba', url:'https://coding.dashscope.aliyuncs.com/compatible-mode/v1', key:'sk-sp-365714cef25a45df8e9b3948641695e6', model:'qwen-plus', ok:true, fails:0 },
  { name:'minimax', url:'https://api.minimax.chat/v1', key:'sk-cp--HJ367Hzkp0OAqaY88Wzzcxp1Z9VSdMi7HDiWzp78sdqrnIXH9nmNVuoGiiHxpyoS0PSzb_V5R31ZEchtAGTODFDfGeR-xk8eW_I2GLxvDOotOh7Bjc1QA8', model:'MiniMax-Text-01', ok:true, fails:0 },
  { name:'newcli-aws', url:'https://code.newcli.com/claude/aws/v1', key:'sk-ant-oat01-FLSPC7gvHvAn7sKUcwxXo5RVdNGwU_apQ6fQO3w72OPPbPN21rxo4w9EcGgRXkWsjfP4vEKHfflenh5hJROSdJYKi7K9qAA', model:'claude-sonnet-4-6', ok:true, fails:0 },
];
let pidx = 0;
let taskCount = 0;

function log(msg) { console.log(`[${new Date().toISOString()}] [${SERVER}] ${msg}`); }

function getProvider() {
  for (let i = 0; i < PROVIDERS.length; i++) {
    const p = PROVIDERS[(pidx + i) % PROVIDERS.length];
    if (p.ok) { pidx = (pidx + i) % PROVIDERS.length; return p; }
  }
  PROVIDERS.forEach(p => { p.ok = true; p.fails = 0; });
  return PROVIDERS[0];
}

function callAI(prompt, sys) {
  const p = getProvider();
  return new Promise((resolve, reject) => {
    const url = new URL('/chat/completions', p.url);
    const client = p.url.startsWith('https') ? https : http;
    const body = JSON.stringify({
      model: p.model, max_tokens: 2048,
      messages: [...(sys ? [{role:'system',content:sys}] : []), {role:'user',content:prompt}]
    });
    const req = client.request(url, {
      method:'POST', headers:{'Authorization':`Bearer ${p.key}`,'Content-Type':'application/json'}
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try { resolve(JSON.parse(d).choices[0].message.content); }
          catch(e) { reject(e); }
        } else {
          p.fails++; if (p.fails >= 3) p.ok = false;
          pidx = (pidx + 1) % PROVIDERS.length;
          reject(new Error(`${p.name}: HTTP ${res.statusCode}`));
        }
      });
    });
    req.on('error', e => { p.fails++; if(p.fails>=3) p.ok=false; pidx=(pidx+1)%PROVIDERS.length; reject(e); });
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body); req.end();
  });
}

function run(cmd) {
  return new Promise(r => exec(cmd, {timeout:30000}, (e,o,er) => r(e ? `error: ${er||e.message}` : o.trim())));
}

async function checkHealth() {
  const fs = require('fs');
  // 用Node原生读取，避免awk的$变量被shell展开
  let load = '0', mem = 0, disk = 0;
  try { load = fs.readFileSync('/proc/loadavg','utf8').split(' ')[0]; } catch(e) {}
  try {
    const mi = fs.readFileSync('/proc/meminfo','utf8');
    const total = parseInt(mi.match(/MemTotal:\s+(\d+)/)[1]);
    const avail = parseInt(mi.match(/MemAvailable:\s+(\d+)/)[1]);
    mem = Math.round(100 * (total - avail) / total);
  } catch(e) {}
  try {
    const r = await run("df / --output=pcent | tail -1");
    disk = parseInt(r) || 0;
  } catch(e) {}
  const evomap = parseInt(await run("pgrep -fc evomap")) || 0;
  const picoclaw = (await run("ss -tlnp 2>/dev/null | grep -c ':18795 '")) === "0" ? 0 : 1;
  const openclaw = parseInt(await run("pgrep -fc openclaw-gateway")) || 0;
  return { load, mem, disk, evomap, picoclaw, openclaw };
}

async function selfHeal(health) {
  const actions = [];
  if (health.mem > 90) {
    await run("sync && echo 3 > /proc/sys/vm/drop_caches");
    actions.push('cleared_cache');
  }
  if (health.evomap > 20) {
    await run("pkill -f evomap; sleep 1");
    actions.push(`killed_${health.evomap}_evomap`);
  }
  if (health.picoclaw === 0) {
    await run("ss -tlnp | grep -q ':18795 ' || nohup picoclaw gateway > /tmp/picoclaw-gateway.log 2>&1 &");
    actions.push('restarted_picoclaw');
  }
  if (health.openclaw === 0) {
    await run("nohup openclaw-gateway > /tmp/openclaw-gateway.log 2>&1 &");
    actions.push('restarted_openclaw');
  }
  return actions;
}

async function reportToPeers(data) {
  for (const peer of PEERS) {
    if (peer === SERVER || peer.startsWith(SERVER)) continue;
    try {
      await new Promise((resolve) => {
        const req = http.request({hostname:peer, port:9100, path:'/report', method:'POST',
          headers:{'Authorization':'Bearer cluster2026','Content-Type':'application/json'}, timeout:5000
        }, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve(d)); });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.write(JSON.stringify({from:SERVER, ...data}));
        req.end();
      });
    } catch(e) {}
  }
}

async function think() {
  try {
    const health = await checkHealth();
    log(`Health: mem=${health.mem}% disk=${health.disk}% load=${health.load} evomap=${health.evomap} pico=${health.picoclaw} oc=${health.openclaw}`);
    
    const healed = await selfHeal(health);
    if (healed.length > 0) {
      log(`Self-healed: ${healed.join(', ')}`);
      await reportToPeers({type:'self_heal', actions:healed, health});
    }
    
    if (health.mem > 85 || health.disk > 85 || parseFloat(health.load) > 8) {
      log('Critical issue detected, thinking...');
      try {
        const thought = await callAI(
          `Server ${SERVER} has issues: mem=${health.mem}% disk=${health.disk}% load=${health.load}. What specific shell command should I run to fix this? Reply with ONLY the command, nothing else.`,
          'You are a Linux sysadmin. Give one specific safe command to fix the issue. No rm -rf.'
        );
        if (thought && thought.length < 200 && !thought.includes('rm -rf /')) {
          log(`AI suggests: ${thought}`);
          const result = await run(thought);
          log(`Result: ${result.substring(0,100)}`);
          await reportToPeers({type:'ai_fix', cmd:thought, result:result.substring(0,200)});
        }
      } catch(e) { log(`AI error: ${e.message}`); }
    }
    
    if (taskCount % 12 === 0) {
      await reportToPeers({type:'status', health, ts:Date.now()});
    }
    taskCount++;
  } catch(e) { log(`Think error: ${e.message}`); }
}

async function main() {
  log('=== Autonomous Agent started ===');
  log(`Provider: ${getProvider().name}`);
  await think();
  setInterval(think, THINK_INTERVAL);
  setInterval(async () => {
    try {
      const h = await checkHealth();
      if (h.mem > 95 || h.disk > 95) {
        log(`CRITICAL: mem=${h.mem}% disk=${h.disk}%`);
        await selfHeal(h);
      }
    } catch(e) {}
  }, HEALTH_INTERVAL);
}

main().catch(e => log(`Fatal: ${e.message}`));
