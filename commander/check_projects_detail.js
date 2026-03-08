const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected!');

  // 检查visa子项目和marriage
  const cmd = `
echo "=== visa-openness目录结构 ===" && ls -la /web/visa/visa-openness/
echo ""
echo "=== visa-openness package.json ===" && cat /web/visa/visa-openness/package.json 2>/dev/null
echo ""
echo "=== visa-openness dist目录 ===" && ls /web/visa/visa-openness/dist 2>/dev/null || echo "无dist"
echo ""
echo "=== visa-openness .next目录 ===" && ls /web/visa/visa-openness/.next 2>/dev/null | head -10 || echo "无.next"
echo ""
echo "=== marriage package.json ===" && cat /web/marriage/package.json 2>/dev/null
echo ""
echo "=== marriage 启动命令 ===" && cat /web/marriage/.env 2>/dev/null
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
