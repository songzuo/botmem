const { Client } = require('ssh2');

const conn = new Client();
const password = 'ge2099334$ZZ';

conn.on('ready', () => {
    console.log('Testing pico channel communication...');
    
    // 测试通过pico频道发送消息
    // 首先查看picoclaw的日志或状态
    conn.exec('curl -s http://127.0.0.1:18795/status 2>/dev/null || echo "No status endpoint"', (err, stream) => {
        let out = '';
        stream.on('data', d => out += d);
        stream.on('close', () => {
            console.log('=== Pico Gateway Status ===');
            console.log(out || 'No response');
            
            // 查看最近的消息
            conn.exec('ls -la ~/.picoclaw/workspace/ 2>/dev/null | head -10', (err2, stream2) => {
                let out2 = '';
                stream2.on('data', d => out2 += d);
                stream2.on('close', () => {
                    console.log('=== Workspace ===');
                    console.log(out2);
                    
                    // 检查channel状态
                    conn.exec('curl -s -X POST http://127.0.0.1:18795/api/channels/pico/peers 2>/dev/null || echo "API not available"', (err3, stream3) => {
                        let out3 = '';
                        stream3.on('data', d => out3 += d);
                        stream3.on('close', () => {
                            console.log('=== Pico Peers ===');
                            console.log(out3 || 'No peers API');
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
