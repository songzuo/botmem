const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected!');

  // 检查visa和marriage项目
  const cmd = `
echo "=== visa项目结构 ===" && ls -la /web/visa/
echo ""
echo "=== visa .next目录 ===" && ls -la /web/visa/.next 2>/dev/null | head -20
echo ""
echo "=== visa package.json ===" && cat /web/visa/package.json 2>/dev/null | head -30
echo ""
echo "=== marriage项目结构 ===" && ls -la /web/marriage/
echo ""
echo "=== marriage package.json ===" && cat /web/marriage/package.json 2>/dev/null | head -30
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
