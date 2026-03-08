const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected!');

  // 检查3010端口和主站状态
  conn.exec('echo "=== 3010端口 ===" && ss -tlnp | grep 3010 && echo "" && echo "=== 3010测试 ===" && curl -s -o /dev/null -w "%{http_code}" http://localhost:3010 && echo "" && echo "=== 3010标题 ===" && curl -s http://localhost:3010 | grep -oP "<title>[^<]+" | head -1', (err, stream) => {
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
