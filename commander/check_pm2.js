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
  conn.exec('pm2 jlist', (err, stream) => {
    if (err) {
      console.log('PM2错误:', err.message);
      conn.end();
      return;
    }

    let output = '';
    stream.on('close', (code) => {
      try {
        const list = JSON.parse(output);
        console.log('=== PM2 进程列表 ===');
        list.forEach(p => {
          if (p.name && p.pm2_env && p.pm2_env.status) {
            console.log(`${p.name}: ${p.pm2_env.status} (${p.pm2_env.exec_command || 'N/A'})`);
          }
        });
      } catch(e) {
        console.log('解析错误:', e.message);
        console.log(output.substring(0, 2000));
      }
      conn.end();
    }).on('data', (data) => {
      output += data.toString();
    }).stderr.on('data', (data) => {
      output += data.toString();
    });
  });
}).on('error', (err) => {
  console.log('连接错误:', err.message);
}).connect(serverConfig);
