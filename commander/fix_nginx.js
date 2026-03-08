const { Client } = require('ssh2');

const conn = new Client();

// 需要禁用的旧配置文件（指向开发模式）
const oldConfigs = [
  'cv.7zi.com.conf',
  'sign.7zi.com.conf',
  'china.7zi.com.conf',
  'song.7zi.com.conf',
  'ppt.7zi.com.conf',
  'good.7zi.com.conf',
  'today.7zi.com.conf',
  'wechat.7zi.com.conf',
];

conn.on('ready', () => {
  console.log('=== SSH连接成功 ===\n');

  // 禁用旧配置
  let cmd = 'echo "=== 禁用旧配置文件 ==="\n';
  for (const config of oldConfigs) {
    cmd += `rm -f /etc/nginx/sites-enabled/${config} && echo "已禁用 ${config}"\n`;
  }

  cmd += '\necho "=== 重新加载nginx ==="\n';
  cmd += 'nginx -s reload\n';

  cmd += '\necho "=== 验证nginx ==="\n';
  cmd += 'nginx -t 2>&1\n';

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
