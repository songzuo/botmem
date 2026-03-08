const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('=== SSH连接成功 ===\n');

  // 检查构建产物目录
  conn.exec('ls -la /web/good/app-*/dist 2>/dev/null; ls -la /web/cv/app-*/dist 2>/dev/null; ls -la /web/marriage/dist 2>/dev/null; ls -la /web/ppt/app-*/dist 2>/dev/null', (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    let output = '';
    stream.on('data', (data) => { output += data.toString(); });
    stream.on('end', () => {
      console.log(output);
      conn.end();
    });
  });
}).on('error', (err) => {
  console.error('SSH Connection Error:', err.message);
  process.exit(1);
}).connect({
  host: '7zi.com',
  port: 22,
  username: 'root',
  password: 'ge2099334$ZZ',
  readyTimeout: 30000,
  compress: true
});
