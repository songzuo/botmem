const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected!');

  // 上传patch文件
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP Error:', err.message);
      conn.end();
      return;
    }

    const patchPath = 'C:/Users/Administrator/lobsterai/project/botmem_temp/patches/0001-Update-memory-2026-03-08.md.patch';
    const remotePath = '/root/botmem_new/0001-Update-memory-2026-03-08.md.patch';

    sftp.fastPut(patchPath, remotePath, (err) => {
      if (err) {
        console.error('Upload Error:', err.message);
        conn.end();
        return;
      }
      console.log('Patch uploaded!');

      // 应用patch
      conn.exec('cd /root/botmem_new && git am < 0001-Update-memory-2026-03-08.md.patch', (err, stream) => {
        if (err) {
          console.error('Apply Error:', err.message);
          conn.end();
          return;
        }

        let output = '';
        stream.on('close', (code, signal) => {
          console.log('Patch applied!');
          if (output) console.log(output);

          // 推送到GitHub
          conn.exec('cd /root/botmem_new && git push', (err, stream) => {
            if (err) {
              console.error('Push Error:', err.message);
              conn.end();
              return;
            }

            let pushOutput = '';
            stream.on('close', (code, signal) => {
              console.log('Pushed to GitHub!');
              if (pushOutput) console.log(pushOutput);
              conn.end();
            }).on('data', (data) => {
              pushOutput += data.toString();
            }).stderr.on('data', (data) => {
              pushOutput += data.toString();
            });
          });
        }).on('data', (data) => {
          output += data.toString();
        }).stderr.on('data', (data) => {
          output += data.toString();
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
