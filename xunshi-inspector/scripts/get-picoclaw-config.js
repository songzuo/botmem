const { Client } = require('ssh2');

const conn = new Client();
const password = process.env.SSH_PASSWORD; // 从环境变量读取

conn.on('ready', () => {
    console.log('Checking picoclaw config...');
    
    conn.exec('cat ~/.picoclaw/config.json', (err, stream) => {
        let out = '';
        stream.on('data', d => out += d);
        stream.on('close', () => {
            console.log('=== Picoclaw Config ===');
            try {
                const config = JSON.parse(out);
                console.log(JSON.stringify(config, null, 2));
            } catch(e) {
                console.log(out);
            }
            conn.end();
        });
    });
}).connect({
    host: 'bot3.szspd.cn',
    port: 22,
    username: 'root',
    password: password
});
