const { Client } = require('ssh2');

const conn = new Client();

// 项目列表
const projects = ['good', 'today', 'wechat', 'cv', 'sign', 'china', 'song', 'ppt'];

conn.on('ready', () => {
  console.log('=== SSH连接成功 ===\n');

  // 检查所有项目的dist目录
  let cmd = '';
  for (const p of projects) {
    cmd += `echo "=== ${p} ===" && ls /web/${p}/app-*/dist 2>/dev/null || ls /web/${p}/dist 2>/dev/null || echo "无dist目录"\n`;
  }

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
