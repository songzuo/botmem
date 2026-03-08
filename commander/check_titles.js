const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected!');

  // 获取各端口的title
  conn.exec('echo "=== 3000 ===" && curl -s http://localhost:3000 | grep -oP "<title>[^<]+" | head -1 && echo "" && echo "=== 3002 ===" && curl -s http://localhost:3002 | grep -oP "<title>[^<]+" | head -1 && echo "" && echo "=== 3003 ===" && curl -s http://localhost:3003 | grep -oP "<title>[^<]+" | head -1 && echo "" && echo "=== 5000 ===" && curl -s http://localhost:5000 | grep -oP "<title>[^<]+" | head -1', (err, stream) => {
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
