const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected!');

  // 检查所有Next.js相关端口
  conn.exec('echo "=== Next.js进程 ===" && ps aux | grep "next" | grep -v grep && echo "" && echo "=== 监听端口 ===" && ss -tlnp | grep -E "300[0-9]|500[0-9]" && echo "" && echo "=== 测试端口 ===" && for p in 3000 3001 3002 3003 5000; do echo -n "$p: "; curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://localhost:$p || echo "X"; done', (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    let output = '';
    stream.on('data', (data) => { output += data.toString(); });
    stream.on('close', () => { console.log(output); conn.end(); });
  });
}).connect({
  host: '7zi.com',
  port: 22,
  username: 'root',
  password: 'ge2099334$ZZ',
  readyTimeout: 30000
});
