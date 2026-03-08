const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('=== SSH连接成功 ===\n');

  // 1. 查看nginx配置目录
  conn.exec('ls -la /etc/nginx/sites-enabled/ && echo "---" && ls -la /etc/nginx/conf.d/', (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    let output = '';
    stream.on('data', (data) => { output += data.toString(); });
    stream.on('end', () => {
      console.log('=== Nginx配置目录 ===\n' + output);

      // 2. 查看主nginx配置
      conn.exec('cat /etc/nginx/nginx.conf', (err2, stream2) => {
        if (err2) { console.error(err2); conn.end(); return; }
        let output2 = '';
        stream2.on('data', (data) => { output2 += data.toString(); });
        stream2.on('end', () => {
          console.log('=== 主nginx配置 ===\n' + output2);

          // 3. 查看sites-enabled下的配置
          conn.exec('ls -la /etc/nginx/sites-available/ 2>/dev/null; echo "---"; cat /etc/nginx/sites-enabled/* 2>/dev/null', (err3, stream3) => {
            if (err3) { console.error(err3); conn.end(); return; }
            let output3 = '';
            stream3.on('data', (data) => { output3 += data.toString(); });
            stream3.on('end', () => {
              console.log('=== Sites配置 ===\n' + output3);
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
