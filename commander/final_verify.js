const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected!');

  const cmd = `
echo "=== 7zi.com (3010) ===" && curl -s -o /dev/null -w "%{http_code}" https://7zi.com
echo ""
echo "=== cv.7zi.com (443) ===" && curl -s -o /dev/null -w "%{http_code}" https://cv.7zi.com
echo ""
echo "=== sign.7zi.com (443) ===" && curl -s -o /dev/null -w "%{http_code}" https://sign.7zi.com
echo ""
echo "=== china.7zi.com (443) ===" && curl -s -o /dev/null -w "%{http_code}" https://china.7zi.com
echo ""
echo "=== song.7zi.com (443) ===" && curl -s -o /dev/null -w "%{http_code}" https://song.7zi.com
echo ""
echo "=== ppt.7zi.com (443) ===" && curl -s -o /dev/null -w "%{http_code}" https://ppt.7zi.com
echo ""
echo "=== today.7zi.com (443) ===" && curl -s -o /dev/null -w "%{http_code}" https://today.7zi.com
echo ""
echo "=== wechat.7zi.com (443) ===" && curl -s -o /dev/null -w "%{http_code}" https://wechat.7zi.com
echo ""
echo "=== good.7zi.com (443) ===" && curl -s -o /dev/null -w "%{http_code}" https://good.7zi.com
echo ""
echo "=== visa.7zi.com (443) ===" && curl -s -o /dev/null -w "%{http_code}" https://visa.7zi.com
echo ""
echo "=== marriage.7zi.com (80) ===" && curl -s -o /dev/null -w "%{http_code}" http://marriage.7zi.com
echo ""
echo "=== 端口监听状态 ===" && ss -tlnp | grep -E "300[0-9]|500[0-9]|3010|80|443"
`;

  conn.exec(cmd, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    let output = '';
    stream.on('data', (data) => { output += data.toString(); });
    stream.on('close', () => { console.log(output); conn.end(); });
  });
}).connect({
  host: '7zi.com',
  port: 22,
  username: 'root',
  password: 'ge2099334$ZZ',
  readyTimeout: 30000
});
