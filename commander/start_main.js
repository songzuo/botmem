const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('=== SSH连接成功 ===\n');

  // 启动7zi.com Next.js生产模式
  const cmd = `
echo "=== 检查Next.js进程 ===" &&
ps aux | grep "next" | grep -v grep &&

echo -e "\n=== 启动7zi.com生产模式 ===" &&
cd /var/www/7zi &&
PORT=3010 npm run start &

echo -e "\n=== 等待5秒 ===" &&
sleep 5 &&

echo -e "\n=== 检查端口监听 ===" &&
netstat -tlnp | grep 3010 || ss -tlnp | grep 3010
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
