const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('=== SSH连接成功 ===\n');

  // 清理并重启
  const cmd = `
echo "=== 停止所有相关进程 ===" &&
pkill -9 -f "next dev" 2>/dev/null || true &&
pkill -9 -f "taro.*watch" 2>/dev/null || true &&

echo -e "\n=== 启动7zi.com生产模式 ===" &&
cd /var/www/7zi &&
nohup npm run start > /tmp/7zi.log 2>&1 &

echo -e "\n=== 等待10秒 ===" &&
sleep 10 &&

echo -e "\n=== 检查端口 ===" &&
ss -tlnp | grep -E "3000|3010"
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
