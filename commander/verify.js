const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('=== SSH连接成功 ===\n');

  // 检查端口监听和nginx状态
  const cmd = `
echo "=== 端口监听状态 ===" &&
ss -tlnp | grep -E "80|443|300|301|500" &&

echo -e "\n=== Nginx状态 ===" &&
systemctl status nginx | head -10 &&

echo -e "\n=== Nginx配置测试 ===" &&
nginx -t 2>&1 &&

echo -e "\n=== 当前启用的站点 ===" &&
ls -la /etc/nginx/sites-enabled/
`;

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
