const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected!');

  // 1. 检查当前运行状态
  // 2. 启动visa-openness在端口3003
  const cmd = `
echo "=== 检查3003端口 ===" && lsof -i :3003 2>/dev/null || echo "端口空闲"
echo ""
echo "=== 检查visa-openness .next目录 ===" && ls -la /web/visa/visa-openness/.next/BUILD_ID
echo ""
echo "=== 启动visa-openness (Next.js生产模式) ==="
cd /web/visa/visa-openness && PORT=3003 HOST=0.0.0.0 nohup npm start > /tmp/visa-openness.log 2>&1 &
sleep 3
echo "启动完成，检查进程..."
ps aux | grep "next start" | grep -v grep
echo ""
echo "=== 检查3003端口监听 ===" && lsof -i :3003 2>/dev/null || echo "端口未监听"
echo ""
echo "=== 测试3003端口 ===" && curl -s -o /dev/null -w "%{http_code}" http://localhost:3003 || echo "连接失败"
`;

  conn.exec(cmd, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    let output = '';
    stream.on('data', (data) => { output += data.toString(); });
    stream.on('end', () => { console.log(output); conn.end(); });
  });
}).connect({
  host: '7zi.com',
  port: 22,
  username: 'root',
  password: 'ge2099334$ZZ',
  readyTimeout: 30000
});
