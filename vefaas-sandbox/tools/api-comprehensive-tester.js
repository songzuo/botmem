#!/usr/bin/env node

/**
 * API Comprehensive Health Tester
 * Tests all configured API endpoints and generates detailed health reports
 * 
 * Usage:
 *   node api-comprehensive-tester.js --test          Run all tests
 *   node api-comprehensive-tester.js --report        Generate HTML report
 *   node api-comprehensive-tester.js --watch         Continuous monitoring
 *   node api-comprehensive-tester.js --compare       Compare with previous run
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const STATE_DIR = path.join(__dirname, '../state');
const REPORT_DIR = path.join(STATE_DIR, 'api-health-reports');

// Ensure directories exist
[STATE_DIR, REPORT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Load cluster configuration
function loadClusterConfig() {
  const configPath = path.join(__dirname, '../scripts/cluster-workers.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  return null;
}

// Test an API endpoint
function testEndpoint(name, url, options = {}) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const timeout = options.timeout || 10000;
    
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const req = protocol.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const latency = Date.now() - startTime;
        const success = res.statusCode >= 200 && res.statusCode < 300;
        
        resolve({
          name,
          url,
          status: success ? 'OK' : 'ERROR',
          statusCode: res.statusCode,
          latency,
          timestamp: new Date().toISOString(),
          error: null,
          headers: res.headers,
          responseSize: data.length
        });
      });
    });
    
    req.on('error', (err) => {
      const latency = Date.now() - startTime;
      resolve({
        name,
        url,
        status: 'ERROR',
        statusCode: null,
        latency,
        timestamp: new Date().toISOString(),
        error: err.message,
        errorCode: err.code
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        name,
        url,
        status: 'TIMEOUT',
        statusCode: null,
        latency: timeout,
        timestamp: new Date().toISOString(),
        error: 'Request timeout'
      });
    });
  });
}

// Test MiniMax API with actual chat completion
async function testMinimax(provider) {
  const apiKey = provider.keys[0];
  const model = provider.model || 'MiniMax-M2.5';
  
  const testPrompt = "Say 'OK' in one word";
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    // Append correct path for MiniMax API
    let endpoint = provider.endpoint || 'https://api.minimaxi.com/v1/chat/completions';
    // Normalize endpoint - remove /anthropic if present and add proper path
    endpoint = endpoint.replace('/anthropic', '').replace(/\/$/, '');
    if (!endpoint.includes('/v1/')) {
      endpoint = endpoint + '/v1/chat/completions';
    }
    
    const data = JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: testPrompt }],
      max_tokens: 10
    });
    
    const urlObj = new URL(endpoint);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 15000
    };
    
    const req = protocol.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        const latency = Date.now() - startTime;
        let result;
        
        try {
          result = JSON.parse(responseData);
        } catch (e) {
          result = { raw: responseData.substring(0, 200) };
        }
        
        const success = res.statusCode === 200 && !result.error;
        
        resolve({
          name: provider.name,
          provider: 'minimax',
          status: success ? 'OK' : 'ERROR',
          statusCode: res.statusCode,
          latency,
          timestamp: new Date().toISOString(),
          model,
          error: result.error || null,
          response: success ? { id: result.id, choices: result.choices?.length } : null
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        name: provider.name,
        provider: 'minimax',
        status: 'ERROR',
        statusCode: null,
        latency: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: err.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: provider.name,
        provider: 'minimax',
        status: 'TIMEOUT',
        statusCode: null,
        latency: 15000,
        timestamp: new Date().toISOString(),
        error: 'Request timeout'
      });
    });
    
    req.write(data);
    req.end();
  });
}

// Test Volcengine API
async function testVolcengine(provider) {
  const apiKey = provider.keys[0];
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    // Append correct path for Volcengine API
    let endpoint = provider.endpoint || 'https://ark.cn-beijing.volces.com/api/v3';
    if (!endpoint.includes('/chat/') && !endpoint.includes('/models')) {
      endpoint = endpoint.replace(/\/$/, '') + '/chat/completions';
    }
    
    // Volcengine uses different auth
    const urlObj = new URL(endpoint);
    const https = require('https');
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + (urlObj.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 15000
    };
    
    // Send a minimal request body
    const data = JSON.stringify({
      model: 'doubao-seed-code-preview-251028',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 10
    });
    options.headers['Content-Length'] = data.length;
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        const latency = Date.now() - startTime;
        const success = res.statusCode === 200;
        
        resolve({
          name: provider.name,
          provider: 'volcengine',
          status: success ? 'OK' : 'ERROR',
          statusCode: res.statusCode,
          latency,
          timestamp: new Date().toISOString(),
          error: success ? null : responseData.substring(0, 200)
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        name: provider.name,
        provider: 'volcengine',
        status: 'ERROR',
        statusCode: null,
        latency: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: err.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: provider.name,
        provider: 'volcengine',
        status: 'TIMEOUT',
        statusCode: null,
        latency: 15000,
        timestamp: new Date().toISOString(),
        error: 'Request timeout'
      });
    });
    
    req.write(data);
    req.end();
  });
}

// Generate summary report
function generateSummary(results) {
  const total = results.length;
  const ok = results.filter(r => r.status === 'OK').length;
  const errors = results.filter(r => r.status === 'ERROR').length;
  const timeouts = results.filter(r => r.status === 'TIMEOUT').length;
  
  const avgLatency = results
    .filter(r => r.latency)
    .reduce((sum, r) => sum + r.latency, 0) / results.length;
  
  return {
    total,
    ok,
    errors,
    timeouts,
    successRate: ((ok / total) * 100).toFixed(1),
    avgLatency: Math.round(avgLatency),
    healthScore: ((ok / total) * 100).toFixed(1)
  };
}

// Save results
function saveResults(results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `api-health-${timestamp}.json`;
  const filepath = path.join(REPORT_DIR, filename);
  
  const summary = generateSummary(results);
  const report = {
    timestamp: new Date().toISOString(),
    summary,
    results
  };
  
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(`📊 Report saved: ${filename}`);
  
  // Update latest symlink
  const latestPath = path.join(REPORT_DIR, 'latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(report, null, 2));
  
  return filepath;
}

// Print results to console
function printResults(results) {
  const summary = generateSummary(results);
  
  console.log('\n📊 API Health Summary');
  console.log('═'.repeat(50));
  console.log(`Total APIs:    ${summary.total}`);
  console.log(`✅ OK:         ${summary.ok}`);
  console.log(`❌ Errors:     ${summary.errors}`);
  console.log(`⏱️  Timeouts:   ${summary.timeouts}`);
  console.log(`📈 Success:    ${summary.successRate}%`);
  console.log(`⚡ Avg Latency: ${summary.avgLatency}ms`);
  console.log('═'.repeat(50));
  
  console.log('\n📋 Detailed Results:');
  console.log('─'.repeat(80));
  
  results.forEach(r => {
    const statusIcon = r.status === 'OK' ? '✅' : r.status === 'TIMEOUT' ? '⏱️' : '❌';
    console.log(`${statusIcon} ${r.name.padEnd(15)} | ${(r.status + '').padEnd(7)} | ${String(r.statusCode || '-').padStart(3)} | ${String(r.latency).padStart(5)}ms | ${r.error || r.model || ''}`);
  });
  
  console.log('─'.repeat(80));
}

// Generate HTML report
function generateHTMLReport(results) {
  const summary = generateSummary(results);
  const timestamp = new Date().toLocaleString('zh-CN');
  
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>API Health Report - ${timestamp}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #333; margin-bottom: 5px; }
    .timestamp { color: #666; font-size: 14px; margin-bottom: 20px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
    .stat { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px; }
    .stat-value { font-size: 28px; font-weight: bold; color: #333; }
    .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
    .stat.ok .stat-value { color: #28a745; }
    .stat.error .stat-value { color: #dc3545; }
    .stat.timeout .stat-value { color: #ffc107; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8f9fa; font-weight: 600; }
    .status-ok { color: #28a745; font-weight: bold; }
    .status-error { color: #dc3545; font-weight: bold; }
    .status-timeout { color: #ffc107; font-weight: bold; }
    .latency-good { color: #28a745; }
    .latency-medium { color: #ffc107; }
    .latency-bad { color: #dc3545; }
  </style>
</head>
<body>
  <h1>🔬 API Health Report</h1>
  <p class="timestamp">Generated: ${timestamp}</p>
  
  <div class="card">
    <h2>Summary</h2>
    <div class="stats">
      <div class="stat ok">
        <div class="stat-value">${summary.ok}</div>
        <div class="stat-label">✅ Healthy</div>
      </div>
      <div class="stat error">
        <div class="stat-value">${summary.errors}</div>
        <div class="stat-label">❌ Errors</div>
      </div>
      <div class="stat timeout">
        <div class="stat-value">${summary.timeouts}</div>
        <div class="stat-label">⏱️ Timeouts</div>
      </div>
      <div class="stat">
        <div class="stat-value">${summary.avgLatency}ms</div>
        <div class="stat-label">⚡ Avg Latency</div>
      </div>
      <div class="stat">
        <div class="stat-value">${summary.healthScore}%</div>
        <div class="stat-label">📊 Health Score</div>
      </div>
    </div>
  </div>
  
  <div class="card">
    <h2>API Details</h2>
    <table>
      <thead>
        <tr>
          <th>API</th>
          <th>Provider</th>
          <th>Status</th>
          <th>Code</th>
          <th>Latency</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
`;
  
  results.forEach(r => {
    const statusClass = r.status.toLowerCase();
    const latencyClass = r.latency < 1000 ? 'latency-good' : r.latency < 3000 ? 'latency-medium' : 'latency-bad';
    const details = r.error || r.model || (r.response ? `Response ID: ${r.response.id}` : '');
    html += `        <tr>
          <td><strong>${r.name}</strong></td>
          <td>${r.provider || '-'}</td>
          <td class="status-${statusClass}">${r.status}</td>
          <td>${r.statusCode || '-'}</td>
          <td class="${latencyClass}">${r.latency}ms</td>
          <td>${details}</td>
        </tr>
`;
  });
  
  html += `      </tbody>
    </table>
  </div>
  
  <p style="color: #666; font-size: 12px; text-align: center;">
    Generated by API Comprehensive Health Tester
  </p>
</body>
</html>`;
  
  return html;
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || '--test';
  
  console.log('🔬 API Comprehensive Health Tester');
  console.log('═'.repeat(50));
  
  const config = loadClusterConfig();
  if (!config) {
    console.error('❌ Could not load cluster configuration');
    process.exit(1);
  }
  
  const results = [];
  
  if (config.apiProviders) {
    console.log(`\n📡 Testing ${config.apiProviders.length} API providers...\n`);
    
    for (const provider of config.apiProviders) {
      console.log(`Testing ${provider.name}...`);
      
      try {
        if (provider.name === 'minimax') {
          const result = await testMinimax(provider);
          results.push(result);
        } else if (provider.name === 'volcengine') {
          const result = await testVolcengine(provider);
          results.push(result);
        } else {
          // Generic test for other providers
          if (provider.endpoint) {
            const result = await testEndpoint(provider.name, provider.endpoint);
            result.provider = provider.name;
            results.push(result);
          }
        }
      } catch (err) {
        results.push({
          name: provider.name,
          provider: provider.name,
          status: 'ERROR',
          latency: 0,
          timestamp: new Date().toISOString(),
          error: err.message
        });
      }
    }
  }
  
  // Print results
  printResults(results);
  
  // Save results
  const filepath = saveResults(results);
  
  // Generate HTML if requested
  if (mode === '--report') {
    const html = generateHTMLReport(results);
    const htmlPath = filepath.replace('.json', '.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`📄 HTML report: ${htmlPath}`);
  }
  
  // Exit with error code if any failures
  const summary = generateSummary(results);
  if (summary.errors > 0 || summary.timeouts > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
