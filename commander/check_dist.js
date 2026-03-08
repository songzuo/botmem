const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('=== SSH连接成功 ===\n');

  // 检查zip文件
  conn.exec('ls -la /web/*.zip', (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    let output = '';
    stream.on('data', (data) => { output += data.toString(); });
    stream.on('end', () => {
      console.log('=== Zip文件 ===\n' + output);

      // 检查marriage目录是否有dist
      conn.exec('ls -la /web/marriage/dist 2>/dev/null || echo "没有dist目录"', (err2, stream2) => {
        let output2 = '';
        stream2.on('data', (data) => { output2 += data.toString(); });
        stream2.on('end', () => {
          console.log('\n=== marriage dist ===\n' + output2);

          // 检查7zi.com构建产物
          conn.exec('ls -la /var/www/7zi/.next 2>/dev/null | head -10 || echo "没有.next目录"', (err3, stream3) => {
            let output3 = '';
            stream3.on('data', (data) => { output3 += data.toString(); });
            stream3.on('end', () => {
              console.log('\n=== 7zi.com .next ===\n' + output3);
              conn.end();
            });
          });
        });
      });
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
