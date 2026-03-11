const { Client } = require('ssh2');

const conn = new Client();
const password = process.env.SSH_PASSWORD; // 从环境变量读取

conn.on('ready', () => {
    console.log('SSH Connected - Checking picoclaw...');
    
    // 检查picoclaw相关
    conn.exec('ls -la ~/.picoclaw/ 2>/dev/null || echo "No .picoclaw dir"', (err, stream) => {
        let out = '';
        stream.on('data', d => out += d);
        stream.on('close', () => {
            console.log('=== Picoclaw Dir ===');
            console.log(out);
            
            // 检查picoclaw进程
            conn.exec('ps aux | grep -i picoclaw | grep -v grep', (err2, stream2) => {
                let out2 = '';
                stream2.on('data', d => out2 += d);
                stream2.on('close', () => {
                    console.log('=== Picoclaw Processes ===');
                    console.log(out2 || 'Not running');
                    
                    // 检查端口18795
                    conn.exec('netstat -tlnp | grep 18795 || echo "Port 18795 not listening"', (err3, stream3) => {
                        let out3 = '';
                        stream3.on('data', d => out3 += d);
                        stream3.on('close', () => {
                            console.log('=== Port 18795 ===');
                            console.log(out3);
                            conn.end();
                        });
                    });
                });
            });
        });
    });
}).connect({
    host: 'bot3.szspd.cn',
    port: 22,
    username: 'root',
    password: password
});
