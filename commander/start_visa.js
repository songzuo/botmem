const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected!');

  // 启动visa-openness
  conn.exec('cd /web/visa/visa-openness && PORT=3003 HOST=0.0.0.0 nohup npm start > /tmp/visa.log 2>&1 & sleep 5 && ps aux | grep "next start" | grep -v grep', (err, stream) => {
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
