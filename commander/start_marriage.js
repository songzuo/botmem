const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected!');

  // 启动marriage API服务
  conn.exec('echo "=== 启动marriage API ===" && cd /web/marriage && nohup npm run api > /tmp/marriage.log 2>&1 & sleep 3 && echo "=== 检查进程 ===" && ps aux | grep "tsx.*server" | grep -v grep && echo "=== 检查端口 ===" && ss -tlnp | grep 3001', (err, stream) => {
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
