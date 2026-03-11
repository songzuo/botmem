const { Client } = require('ssh2');

const conn = new Client();
const password = process.env.SSH_PASSWORD; // 从环境变量读取

conn.on('ready', () => {
    console.log('SSH Connected to bot3');
    
    // 检查当前运行的路由进程
    conn.exec('ps aux | grep -E "node|router" | grep -v grep', (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        
        let output = '';
        stream.on('data', (data) => { output += data.toString(); });
        stream.on('close', () => {
            console.log('=== Current Processes ===');
            console.log(output);
            
            // 检查端口占用
            conn.exec('lsof -i:11435 2>/dev/null || netstat -tlnp | grep 11435', (err2, stream2) => {
                if (err2) { console.error(err2); conn.end(); return; }
                
                let output2 = '';
                stream2.on('data', (data) => { output2 += data.toString(); });
                stream2.on('close', () => {
                    console.log('=== Port 11435 ===');
                    console.log(output2 || 'Not in use');
                    
                    // 检查smart-router目录
                    conn.exec('ls -la /root/smart-router/ 2>/dev/null || echo "Directory not exists"', (err3, stream3) => {
                        let output3 = '';
                        stream3.on('data', (data) => { output3 += data.toString(); });
                        stream3.on('close', () => {
                            console.log('=== Smart Router Dir ===');
                            console.log(output3 || 'Not found');
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
