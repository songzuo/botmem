const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected!');

  // 检查marriage API服务
  conn.exec('echo "=== marriage API进程 ===" && ps aux | grep -E "server.ts|tsx.*api" | grep -v grep && echo "" && echo "=== 检查常用API端口 ===" && ss -tlnp | grep -E "808[0-9]|300[0-9]|500[0-9]" | grep -v -E "3000|3002|3003|5000" && echo "" && echo "=== 检查端口8001 ===" && ss -tlnp | grep 8001', (err, stream) => {
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
