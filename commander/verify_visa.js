const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected!');

  conn.exec('echo "=== visa.7zi.com 测试 ===" && curl -s -o /dev/null -w "HTTP状态: %{http_code}\\n" https://visa.7zi.com && curl -s https://visa.7zi.com | grep -oP "<title>[^<]+" | head -1', (err, stream) => {
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
