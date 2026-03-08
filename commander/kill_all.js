const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('=== SSH连接成功 ===\n');

  // 强制停止所有开发进程
  const cmd = `
echo "=== 查找所有node开发进程 ===" &&
ps aux | grep -E "node.*dev|next dev|vite.*watch|taro.*watch" | grep -v grep &&

echo -e "\n=== 强制杀死进程 ===" &&
pkill -9 -f "next dev" 2>/dev/null || true &&
pkill -9 -f "vite.*--watch" 2>/dev/null || true &&
pkill -9 -f "taro.*build.*watch" 2>/dev/null || true &&
pkill -9 -f "npm exec" 2>/dev/null || true &&

echo -e "\n=== 等待3秒 ===" &&
sleep 3 &&

echo -e "\n=== 检查端口 ===" &&
ss -tlnp | grep -E "3000|3010|5000|3002|10087|517[0-9]"
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
