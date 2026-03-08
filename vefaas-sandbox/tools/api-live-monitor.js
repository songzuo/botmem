#!/usr/bin/env node

/**
 * API 实时监控与自动故障切换面板
 * 用途：监控多个 API Provider 的实时状态，自动故障切换，提供 Web 仪表板
 * 
 * 用法:
 *   node api-live-monitor.js --port 18800          # 启动监控面板
 *   node api-live-monitor.js --test                # 测试所有 API
 *   node api-live-monitor.js --status              # 输出状态摘要
 *   node api-live-monitor.js --best                # 返回最佳 provider
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  port: process.env.PORT || 18800,
  checkInterval: 30000, // 30秒检查一次
  timeout: 10000, // 10秒超时
  historySize: 100, // 保留历史记录数
};

// 从 cluster-workers.json 加载 API 配置
function loadApiConfig() {
  try {
    const configPath = path.join(__dirname, 'scripts', 'cluster-workers.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return config.apiProviders || [];
    }
  } catch (e) {
    console.error('加载配置失败:', e.message);
  }
  
  // 默认配置
  return [
    {
      name: 'volcengine',
      priority: 1,
      keys: ['aab2bcb7-753d-4d59-8f6c-91953feec979'],
      endpoint: 'https://ark.cn-beijing.volces.com/api/v3',
      model: 'doubao-1-5-pro-32k'
    },
    {
      name: 'minimax',
      priority: 2,
      keys: [''],
      endpoint: 'https://api.minimax.chat/v1',
      model: 'MiniMax-M2.5'
    },
    {
      name: 'fucheers',
      priority: 3,
      keys: [''],
      endpoint: 'https://api.fucheers.com/v1',
      model: 'claude-opus-4-5'
    }
  ];
}

// API Provider 状态
const providers = loadApiConfig();
const statusHistory = new Map();
const currentStatus = new Map();

// 初始化状态
providers.forEach(p => {
  statusHistory.set(p.name, []);
  currentStatus.set(p.name, { status: 'unknown', latency: -1, lastCheck: null, score: 0 });
});

// 测试单个 API Provider (简化版: HTTP 可达性 + 状态码检查)
function testProvider(provider) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let resolved = false;
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({
          name: provider.name,
          status: 'timeout',
          latency: CONFIG.timeout,
          error: 'Request timeout',
          score: 0
        });
      }
    }, CONFIG.timeout);

    // 尝试不同的端点路径
    let testEndpoints = [];
    if (provider.endpoint.includes('volces.com')) {
      testEndpoints = [
        provider.endpoint + '/models',  // 列出模型
        provider.endpoint.replace('/api/v3', '/v3') + '/chat/completions'
      ];
    } else {
      testEndpoints = [provider.endpoint + '/models', provider.endpoint + '/v1/models'];
    }
    
    // 尝试第一个端点
    tryUrl(testEndpoints[0], provider.keys[0], startTime, timeout, provider, (result) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    }, () => {
      // 第一个失败，尝试第二个
      if (testEndpoints[1]) {
        tryUrl(testEndpoints[1], provider.keys[0], startTime, timeout, provider, (result) => {
          if (!resolved) {
            resolved = true;
            resolve(result);
          }
        });
      }
    });
  });
}

function tryUrl(testUrl, apiKey, startTime, timeout, provider, onComplete, onError) {
  const url = new URL(testUrl);
  const client = url.protocol === 'https:' ? https : http;
  
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  };

  const req = client.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      clearTimeout(timeout);
      const latency = Date.now() - startTime;
      let status = 'error';
      let score = 0;
      let error = null;
      
      if (res.statusCode === 200) {
        status = 'healthy';
        score = Math.max(0, Math.round(1000 - latency * 2));
      } else if (res.statusCode === 401 || res.statusCode === 403) {
        status = 'auth_error';
        error = 'Authentication failed';
        score = 100;
      } else if (res.statusCode === 404) {
        status = 'not_found';
        error = 'Endpoint not found';
        score = 50;
      } else if (res.statusCode === 429) {
        status = 'rate_limit';
        error = 'Rate limited';
        score = 200;
      } else if (res.statusCode >= 500) {
        status = 'server_error';
        error = `Server error: ${res.statusCode}`;
        score = 0;
      }
      
      onComplete({
        name: provider.name,  // 使用 provider 名称
        status,
        latency,
        statusCode: res.statusCode,
        error,
        score
      });
    });
  });

  req.on('error', (err) => {
    if (onError) {
      onError();
    } else {
      clearTimeout(timeout);
      onComplete({
        name: url.hostname,
        status: 'error',
        latency: Date.now() - startTime,
        error: err.message,
        score: 0
      });
    }
  });

  req.end();
}

// 测试所有 Provider
async function testAllProviders() {
  console.log('\n🧪 测试所有 API Provider...\n');
  const results = [];
  
  for (const provider of providers) {
    const result = await testProvider(provider);
    results.push(result);
    
    // 更新状态
    currentStatus.set(result.name, {
      status: result.status,
      latency: result.latency,
      lastCheck: new Date().toISOString(),
      score: result.score
    });
    
    // 更新历史
    let history = statusHistory.get(result.name);
    if (!history) {
      statusHistory.set(result.name, []);
      history = statusHistory.get(result.name);
    }
    history.push({
      timestamp: new Date().toISOString(),
      status: result.status,
      latency: result.latency,
      score: result.score
    });
    if (history.length > CONFIG.historySize) {
      history.shift();
    }
    
    // 输出结果
    const icon = result.status === 'healthy' ? '✅' : '❌';
    const statusText = result.status === 'healthy' 
      ? `${result.latency}ms (score: ${result.score})`
      : `${result.status} - ${result.error || ''}`;
    console.log(`  ${icon} ${provider.name}: ${statusText}`);
  }
  
  return results;
}

// 获取最佳 Provider
function getBestProvider() {
  let best = null;
  let bestScore = -1;
  
  for (const [name, status] of currentStatus) {
    if (status.status === 'healthy' && status.score > bestScore) {
      bestScore = status.score;
      best = { name, ...status };
    }
  }
  
  return best;
}

// 生成状态摘要
function getStatusSummary() {
  const summary = {
    timestamp: new Date().toISOString(),
    providers: [],
    best: null,
    overall: 'unknown'
  };
  
  let healthyCount = 0;
  
  for (const provider of providers) {
    const status = currentStatus.get(provider.name);
    summary.providers.push({
      name: provider.name,
      status: status.status,
      latency: status.latency,
      score: status.score,
      lastCheck: status.lastCheck
    });
    
    if (status.status === 'healthy') {
      healthyCount++;
    }
  }
  
  summary.best = getBestProvider();
  summary.overall = healthyCount > 0 ? 'operational' : 'degraded';
  
  return summary;
}

// 生成 HTML 仪表板
function generateDashboard() {
  const summary = getStatusSummary();
  
  const providerCards = summary.providers.map(p => {
    const statusColor = p.status === 'healthy' ? '#10b981' : p.status === 'unknown' ? '#6b7280' : '#ef4444';
    const statusIcon = p.status === 'healthy' ? '✓' : p.status === 'unknown' ? '?' : '✗';
    
    return `
      <div class="provider-card" style="background: #1f2937; border-radius: 12px; padding: 20px; margin: 10px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; color: #fff; font-size: 18px;">${p.name}</h3>
          <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px;">
            ${statusIcon} ${p.status}
          </span>
        </div>
        <div style="margin-top: 15px; color: #9ca3af; font-size: 14px;">
          <div>延迟: <strong style="color: #fff;">${p.latency > 0 ? p.latency + 'ms' : '-'}</strong></div>
          <div>评分: <strong style="color: #fff;">${p.score}</strong></div>
          <div>最后检查: <strong style="color: #fff;">${p.lastCheck ? new Date(p.lastCheck).toLocaleTimeString() : '-'}</strong></div>
        </div>
      </div>
    `;
  }).join('');
  
  const bestProvider = summary.best 
    ? `<div style="background: #065f46; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <strong style="color: #34d399;">🏆 最佳 Provider: ${summary.best.name}</strong> 
        (延迟: ${summary.best.latency}ms, 评分: ${summary.best.score})
       </div>`
    : '<div style="background: #7f1d1d; padding: 15px; border-radius: 8px; margin-bottom: 20px;">⚠️ 无可用 Provider</div>';
  
  const overallColor = summary.overall === 'operational' ? '#10b981' : '#ef4444';
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>API Live Monitor</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #111827; color: #fff; min-height: 100vh; padding: 20px; }
    .container { max-width: 900px; margin: 0 auto; }
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    h1 { font-size: 28px; }
    .status-badge { background: ${overallColor}; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
    .refresh-btn { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; }
    .refresh-btn:hover { background: #2563eb; }
    .last-update { color: #9ca3af; font-size: 14px; margin-top: 10px; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .updating { animation: pulse 1s infinite; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>🔄 API 实时监控面板</h1>
        <div class="last-update">最后更新: <span id="lastUpdate">${new Date().toLocaleString()}</span></div>
      </div>
      <div style="text-align: right;">
        <span class="status-badge">${summary.overall === 'operational' ? '🟢 运行中' : '🔴 降级'}</span>
        <button class="refresh-btn" onclick="refresh()" style="margin-top: 10px;">🔄 刷新</button>
      </div>
    </header>
    
    ${bestProvider}
    
    <h2 style="margin: 20px 0 10px;">Provider 状态</h2>
    ${providerCards}
    
    <div style="margin-top: 30px; padding: 20px; background: #1f2937; border-radius: 12px;">
      <h3>📊 快速操作</h3>
      <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
        <a href="/api/status" style="color: #60a5fa; text-decoration: none;">📋 JSON 状态</a>
        <a href="/api/best" style="color: #60a5fa; text-decoration: none;">🏆 最佳 Provider</a>
        <a href="/api/test" style="color: #60a5fa; text-decoration: none;">🧪 重新测试</a>
      </div>
    </div>
  </div>
  
  <script>
    let updating = false;
    async function refresh() {
      if (updating) return;
      updating = true;
      document.body.classList.add('updating');
      try {
        const res = await fetch('/api/test');
        const data = await res.json();
        document.getElementById('lastUpdate').textContent = new Date().toLocaleString();
        location.reload();
      } catch(e) {
        alert('刷新失败: ' + e.message);
      }
      updating = false;
      document.body.classList.remove('updating');
    }
    
    // 自动刷新
    setInterval(() => {
      if (!document.hidden) refresh();
    }, ${CONFIG.checkInterval});
  </script>
</body>
</html>`;
}

// 创建 HTTP 服务器
function startServer() {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${CONFIG.port}`);
    
    // CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    
    try {
      // 路由
      if (url.pathname === '/' || url.pathname === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(generateDashboard());
      } 
      else if (url.pathname === '/api/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getStatusSummary(), null, 2));
      }
      else if (url.pathname === '/api/best') {
        const best = getBestProvider();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(best || { error: 'No healthy provider' }, null, 2));
      }
      else if (url.pathname === '/api/test') {
        await testAllProviders();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getStatusSummary(), null, 2));
      }
      else {
        res.writeHead(404);
        res.end('Not Found');
      }
    } catch (e) {
      res.writeHead(500);
      res.end('Error: ' + e.message);
    }
  });
  
  server.listen(CONFIG.port, () => {
    console.log(`\n🌐 API 实时监控面板已启动: http://localhost:${CONFIG.port}`);
    console.log(`   📊 状态: http://localhost:${CONFIG.port}/api/status`);
    console.log(`   🏆 最佳: http://localhost:${CONFIG.port}/api/best\n`);
    
    // 初始测试
    testAllProviders();
    
    // 定期测试
    setInterval(testAllProviders, CONFIG.checkInterval);
  });
}

// 主入口
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
API 实时监控与自动故障切换面板

用法:
  node api-live-monitor.js --port 18800    启动监控面板
  node api-live-monitor.js --test          测试所有 API
  node api-live-monitor.js --status         输出状态摘要
  node api-live-monitor.js --best           返回最佳 provider
  
环境变量:
  PORT=18800    监听端口
`);
  process.exit(0);
}

if (args.includes('--test')) {
  testAllProviders().then(() => process.exit(0));
} else if (args.includes('--status')) {
  testAllProviders().then(() => {
    console.log('\n📊 状态摘要:');
    console.log(JSON.stringify(getStatusSummary(), null, 2));
    process.exit(0);
  });
} else if (args.includes('--best')) {
  testAllProviders().then(() => {
    const best = getBestProvider();
    if (best) {
      console.log(`🏆 最佳 Provider: ${best.name} (延迟: ${best.latency}ms)`);
    } else {
      console.log('❌ 没有可用的 Provider');
    }
    process.exit(best ? 0 : 1);
  });
} else {
  startServer();
}
