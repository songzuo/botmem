const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected!');

  // 检查各端口返回的HTML title
  conn.exec('echo "=== 3000端口 ===" && curl -s http://localhost:3000 | head -20 && echo "" && echo "=== 3002端口 ===" && curl -s http://localhost:3002 | head -20 && echo "" && echo "=== 3003端口 ===" && curl -s http://localhost:3003 | head -20 && echo "" && echo "=== 5000端口 ===" && curl -s http://localhost:5000 | head -20', (err, stream) => {
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
