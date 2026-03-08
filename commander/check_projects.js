const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('=== SSH连接成功 ===\n');

  // 1. 查看所有项目目录
  conn.exec('ls -la /web/ && echo "---" && ls -la /var/www/', (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    let output = '';
    stream.on('data', (data) => { output += data.toString(); });
    stream.on('end', () => {
      console.log('=== 项目目录 ===\n' + output);

      // 2. 查看主要站点的nginx配置示例
      conn.exec('cat /etc/nginx/sites-available/7zi.com.conf', (err2, stream2) => {
        if (err2) { console.error(err2); conn.end(); return; }
        let output2 = '';
        stream2.on('data', (data) => { output2 += data.toString(); });
        stream2.on('end', () => {
          console.log('=== 7zi.com nginx配置 ===\n' + output2);

          // 3. 查看一个子项目的配置作为参考
          conn.exec('cat /etc/nginx/sites-available/cv.7zi.com.conf', (err3, stream3) => {
            if (err3) { console.error(err3); conn.end(); return; }
            let output3 = '';
            stream3.on('data', (data) => { output3 += data.toString(); });
            stream3.on('end', () => {
              console.log('=== cv.7zi.com nginx配置 ===\n' + output3);
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
