const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected!');

  // 验证marriage API
  conn.exec('echo "=== 端口3001监听 ===" && ss -tlnp | grep 3001 && echo "" && echo "=== 测试3001端口 ===" && curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 && echo "" && echo "=== 3001响应头 ===" && curl -sI http://localhost:3001 | head -10', (err, stream) => {
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
