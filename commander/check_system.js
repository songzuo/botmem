const { Client } = require('ssh2');

const conn = new Client();
const serverConfig = {
  host: '7zi.com',
  port: 22,
  username: 'root',
  password: 'ge2099334$ZZ'
};

conn.on('ready', () => {
  console.log('SSH连接成功');

  // 检查PM2进程
  conn.exec('pm2 list', (err, stream) => {
    if (err) {
      console.log('PM2错误:', err.message);
      conn.end();
      return;
    }

    stream.on('close', (code) => {
      console.log('\n--- PM2 详细列表 ---');

      // 检查Nginx配置
      conn.exec('nginx -T 2>/dev/null | grep -E "server_name|listen" | head -50', (err2, stream2) => {
        if (err2) {
          console.log('Nginx错误:', err2.message);
          conn.end();
          return;
        }

        let nginxOutput = '';
        stream2.on('close', () => {
          console.log('\n--- Nginx 配置 ---');
          console.log(nginxOutput);
          conn.end();
        }).on('data', (data) => {
          nginxOutput += data.toString();
        }).stderr.on('data', (data) => {
          nginxOutput += data.toString();
        });
      }).on('data', (data) => {
        console.log(data.toString());
      }).stderr.on('data', (data) => {
        console.log(data.toString());
      });
    }).on('data', (data) => {
      console.log(data.toString());
    }).stderr.on('data', (data) => {
      console.log(data.toString());
    });
  });
}).on('error', (err) => {
  console.log('连接错误:', err.message);
}).connect(serverConfig);
