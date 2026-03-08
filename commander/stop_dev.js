const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('=== SSH连接成功 ===\n');

  // 停止所有 vite, next dev, taro 进程
  const cmd = `
echo "=== 查找开发模式进程 ===" &&
ps aux | grep -E "vite|next dev|taro.*watch" | grep -v grep &&

echo -e "\n=== 停止开发进程 ===" &&
pkill -f "vite.*--watch" 2>/dev/null || true &&
pkill -f "next dev" 2>/dev/null || true &&
pkill -f "taro.*build.*watch" 2>/dev/null || true &&

echo -e "\n=== 验证停止结果 ===" &&
ps aux | grep -E "vite|next dev|taro.*watch" | grep -v grep || echo "没有开发进程在运行"
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
