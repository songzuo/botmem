#!/usr/bin/env node
/**
 * API Key 快速状态检查 - 使用正确的端点配置
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

// 使用正确端点的配置
const API_KEYS = {
  'volcengine-1': {
    name: '火山引擎 (主密钥)',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    apiKey: 'aab2bcb7-753d-4d59-8f6c-91953feec979',
    model: 'doubao-seed-code-251028'
  },
  'volcengine-2': {
    name: '火山引擎 (备用)',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    apiKey: '4e051cf9-b27b-41eb-9540-2890ad94a271',
    model: 'doubao-seed-code-251028'
  },
  'minimax': {
    name: 'MiniMax (Coding Plan)',
    endpoint: 'https://api.minimaxi.com/anthropic/v1/messages',
    apiKey: 'sk-cp--HJ367Hzkp0OAqaY88Wzzcxp1Z9VSdMi7HDiWzp78sdqrnIXH9nmNVuoGiiHxpyoS0PSzb_V5R31ZEchtAGTODFDfGeR-xk8eW_I2GLxvDOotOh7Bjc1QA8',
    model: 'MiniMax-M2.5',
    anthropic: true
  },
  'alibaba-1': {
    name: '阿里百炼 (Key1)',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    apiKey: 'sk-sp-365714cef25a45df8e9b3948641695e6',
    model: 'qwen-plus'
  },
  'alibaba-2': {
    name: '阿里百炼 (Key2)',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    apiKey: 'sk-sp-4d4f86d364934d48b80423f72b5495d1',
    model: 'qwen-plus'
  }
};

function testRequest(config) {
  return new Promise((resolve, reject) => {
    const url = new URL(config.endpoint);
    const isAnthropic = config.anthropic;
    
    const body = isAnthropic ? {
      model: config.model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }]
    } : {
      model: config.model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }]
    };
    
    const options = {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'Accept': 'application/json'
      },
      startTime: Date.now()
    };
    
    if (isAnthropic) {
      options.headers['x-api-key'] = config.apiKey;
      options.headers['anthropic-version'] = '2023-06-01';
    }
    
    const protocol = url.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          latency: Date.now() - options.startTime,
          body: data,
          headers: res.headers
        });
      });
    });
    
    req.on('error', e => reject({ error: e.code || e.message, latency: Date.now() - options.startTime }));
    req.on('timeout', () => { req.destroy(); reject({ error: 'TIMEOUT', latency: Date.now() - options.startTime }); });
    
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('🔍 API Key 状态快速检查 (修正端点)');
  console.log('='.repeat(60));
  
  const results = [];
  
  for (const [id, config] of Object.entries(API_KEYS)) {
    console.log(`\n测试 ${config.name}...`);
    
    try {
      const res = await testRequest(config);
      const latency = res.latency + 'ms';
      
      let status = '❌';
      let info = '';
      
      if (res.statusCode === 200) {
        status = '✅';
        info = '正常';
      } else if (res.statusCode === 401) {
        status = '❌';
        info = '认证失败';
      } else if (res.statusCode === 403) {
        status = '❌';
        info = '权限不足';
      } else if (res.statusCode === 404) {
        status = '❌';
        info = '端点不存在';
      } else if (res.statusCode === 429) {
        status = '⚠️';
        info = '限流';
      } else {
        status = '⚠️';
        info = `HTTP ${res.statusCode}`;
      }
      
      try {
        const json = JSON.parse(res.body);
        if (json.error) info = json.error.message || json.error.type;
        if (json.choices) info = '正常响应';
      } catch(e) {}
      
      console.log(`  ${status} ${info} (${latency})`);
      results.push({ id, name: config.name, status: status === '✅' ? 'OK' : info, latency, statusCode: res.statusCode });
      
    } catch (e) {
      console.log(`  ❌ ${e.error || '连接失败'}`);
      results.push({ id, name: config.name, status: e.error || '连接失败', latency: e.latency || 'N/A' });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 汇总');
  console.log('='.repeat(60));
  
  const ok = results.filter(r => r.status === 'OK');
  console.log(`总计: ${results.length} | ✅ 正常: ${ok.length} | ❌ 失败: ${results.length - ok.length}`);
  
  console.log('\n✅ 可用 API:');
  ok.forEach(r => console.log(`  • ${r.name} (${r.latency})`));
  if (ok.length === 0) console.log('  (无)');
  
  // 保存结果
  fs.writeFileSync('/workspace/projects/workspace/state/api-key-status.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    results
  }, null, 2));
  
  console.log('\n详细报告：/workspace/projects/workspace/state/api-key-status.json');
}

main().catch(console.error);
