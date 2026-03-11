const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const password = process.env.SSH_PASSWORD; // 从环境变量读取
const routerCode = fs.readFileSync('/workspace/smart-router-full.js', 'utf8');

conn.on('ready', () => {
    console.log('SSH Connected - Starting deployment...');
    
    // 1. 停止旧路由
    conn.exec('pkill -f "node router.js" && echo "Old router stopped" || echo "No old router"', (err, stream) => {
        let out = '';
        stream.on('data', d => out += d);
        stream.on('close', () => {
            console.log('1. Stop old router:', out.trim());
            
            // 2. 创建目录
            conn.exec('mkdir -p /root/smart-router && echo "Dir created"', (err2, stream2) => {
                let out2 = '';
                stream2.on('data', d => out2 += d);
                stream2.on('close', () => {
                    console.log('2. Create dir:', out2.trim());
                    
                    // 3. 上传新路由文件
                    console.log('3. Uploading smart-router-full.js...');
                    conn.sftp((err3, sftp) => {
                        if (err3) { console.error('SFTP error:', err3); conn.end(); return; }
                        
                        sftp.writeFile('/root/smart-router/smart-router-full.js', routerCode, (err4) => {
                            if (err4) { console.error('Upload error:', err4); conn.end(); return; }
                            
                            console.log('4. File uploaded successfully');
                            
                            // 4. 启动新路由
                            conn.exec('cd /root/smart-router && nohup node smart-router-full.js > /tmp/router.log 2>&1 & sleep 3 && echo "Router started"', (err5, stream5) => {
                                let out5 = '';
                                stream5.on('data', d => out5 += d);
                                stream5.on('close', () => {
                                    console.log('5. Start new router:', out5.trim());
                                    
                                    // 5. 验证
                                    setTimeout(() => {
                                        conn.exec('curl -s http://localhost:11435/health', (err6, stream6) => {
                                            let out6 = '';
                                            stream6.on('data', d => out6 += d);
                                            stream6.on('close', () => {
                                                console.log('6. Health check:');
                                                try {
                                                    console.log(JSON.stringify(JSON.parse(out6 || '{}'), null, 2));
                                                } catch(e) { console.log(out6); }
                                                conn.end();
                                            });
                                        });
                                    }, 2000);
                                });
                            });
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
