const { Client } = require('ssh2');

const conn = new Client();

// 检查/web下的项目
const projects = ['good', 'today', 'wechat', 'cv', 'sign', 'china', 'song', 'marriage', 'ppt'];

conn.on('ready', () => {
  console.log('=== SSH连接成功 ===\n');

  // 检查每个项目的结构
  const cmd = projects.map(p => `echo "=== ${p} ===" && ls -la /web/${p}/ 2>/dev/null | head -20`).join(' && ');

  conn.exec(cmd, (err, stream) => {
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
