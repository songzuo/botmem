#!/usr/bin/env node
/**
 * Evomap Gateway CLI for OpenClaw
 * 
 * 使用方式:
 *   node evomap-cli.js hello              - 注册节点
 *   node evomap-cli.js heartbeat          - 发送心跳
 *   node evomap-cli.js fetch [type]       - 获取资产 (type: Gene/Capsule)
 *   node evomap-cli.js status             - 查看状态
 *   node evomap-cli.js tasks              - 查看任务
 *   node evomap-cli.js trending           - 查看趋势
 *   node evomap-cli.js stats              - 查看 Hub 统计
 *   node evomap-cli.js test               - 测试连接
 */

const EvomapClient = require('./evomap-client');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  const client = new EvomapClient();
  
  console.log(`\n🧬 Evomap Gateway CLI`);
  console.log(`   Node ID: ${client.nodeId}`);
  console.log(`   Hub: ${client.hubUrl}\n`);
  
  switch (command) {
    case 'hello':
    case 'register':
      console.log('📤 Registering node...');
      const helloResult = await client.hello();
      console.log('Result:', JSON.stringify(helloResult, null, 2));
      if (helloResult.success && helloResult.data?.claim_url) {
        console.log(`\n✅ Node registered!`);
        console.log(`   Claim URL: ${helloResult.data.claim_url}`);
      }
      break;
      
    case 'heartbeat':
    case 'hb':
      console.log('💓 Sending heartbeat...');
      const hbResult = await client.heartbeat();
      console.log('Result:', JSON.stringify(hbResult, null, 2));
      break;
      
    case 'fetch':
      const assetType = args[1] || 'Capsule';
      console.log(`📥 Fetching ${assetType} assets...`);
      const fetchResult = await client.fetch({ assetType, limit: 5 });
      console.log('Result:', JSON.stringify(fetchResult, null, 2));
      break;
      
    case 'tasks':
      console.log('📋 Fetching tasks...');
      const tasksResult = await client.listTasks({ limit: 10 });
      console.log('Result:', JSON.stringify(tasksResult, null, 2));
      break;
      
    case 'trending':
      console.log('📈 Fetching trending assets...');
      const trendingResult = await client.getTrending();
      console.log('Result:', JSON.stringify(trendingResult, null, 2));
      break;
      
    case 'stats':
      console.log('📊 Fetching Hub stats...');
      const statsResult = await client.getStats();
      console.log('Result:', JSON.stringify(statsResult, null, 2));
      break;
      
    case 'status':
      console.log('📌 Node Status:');
      console.log(JSON.stringify(client.getStatus(), null, 2));
      break;
      
    case 'test':
      console.log('🧪 Testing connection...\n');
      
      // Test 1: Stats
      console.log('1. Testing /a2a/stats...');
      const testStats = await client.getStats();
      console.log(`   ${testStats.success ? '✅' : '❌'} Stats: ${testStats.success ? 'OK' : testStats.error}`);
      
      // Test 2: Hello
      console.log('2. Testing /a2a/hello...');
      const testHello = await client.hello();
      console.log(`   ${testHello.success ? '✅' : '❌'} Hello: ${testHello.success ? 'Registered' : testHello.error}`);
      
      if (testHello.success) {
        // Test 3: Heartbeat
        console.log('3. Testing /a2a/heartbeat...');
        const testHb = await client.heartbeat();
        console.log(`   ${testHb.success ? '✅' : '❌'} Heartbeat: ${testHb.success ? 'OK' : testHb.error}`);
        
        // Test 4: Fetch
        console.log('4. Testing /a2a/fetch...');
        const testFetch = await client.fetch({ limit: 3 });
        console.log(`   ${testFetch.success ? '✅' : '❌'} Fetch: ${testFetch.success ? (testFetch.data?.payload?.results?.length || 0) + ' assets' : testFetch.error}`);
      }
      
      console.log('\n✨ Test complete!');
      break;
      
    case 'loop':
      console.log('🔄 Starting heartbeat loop (Ctrl+C to stop)...\n');
      
      // Initial registration
      const loopHello = await client.hello();
      if (loopHello.success) {
        console.log(`✅ Registered at ${new Date().toISOString()}`);
        if (loopHello.data?.claim_url) {
          console.log(`   Claim: ${loopHello.data.claim_url}`);
        }
      } else {
        console.log(`❌ Registration failed: ${loopHello.error}`);
      }
      
      // Heartbeat loop
      setInterval(async () => {
        const result = await client.heartbeat();
        const time = new Date().toISOString();
        if (result.success) {
          console.log(`[${time}] 💓 Heartbeat OK`);
        } else {
          console.log(`[${time}] ❌ Heartbeat failed: ${result.error}`);
        }
      }, 15 * 60 * 1000); // 15 minutes
      
      // Keep process alive
      process.stdin.resume();
      break;
      
    case 'help':
    default:
      console.log(`
Commands:
  hello, register    - 注册节点到 Evomap
  heartbeat, hb      - 发送心跳保持在线
  fetch [type]       - 获取资产 (type: Gene/Capsule, 默认 Capsule)
  tasks              - 查看可用任务
  trending           - 查看趋势资产
  stats              - 查看 Hub 统计
  status             - 查看本地节点状态
  test               - 测试连接和认证
  loop               - 启动心跳循环 (每15分钟)
  help               - 显示帮助

Examples:
  node evomap-cli.js test
  node evomap-cli.js fetch Capsule
  node evomap-cli.js loop
      `);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});