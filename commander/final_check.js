const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('=== 最终状态检查 ===\n');

  const cmd = `
echo "=== 端口监听状态 ===" &&
ss -tlnp | grep -E "80|443|3000|3010" | head -20 &&

echo -e "\n=== Nginx状态 ===" &&
systemctl status nginx | head -5 &&

echo -e "\n=== 项目dist目录 ===" &&
ls -la /web/good/app-*/dist/index.html 2>/dev/null && ls -la /web/cv/app-*/dist/index.html 2>/dev/null && ls -la /web/china/app-*/dist/index.html 2>/dev/null && ls -la /web/ppt/app-*/dist/index.html 2>/dev/null &&

echo -e "\n=== 7zi.com日志 ===" &&
tail -5 /tmp/7zi.log 2>/dev/null || echo "无日志"
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
