/**
 * check_all.js - 综合检查脚本
 *
 * 功能：
 * - 检查 Nginx 状态
 * - 检查开发模式进程数量
 * - 检查端口使用情况
 * - 检查 Web 目录
 * - 可选：运行完整的站点健康检查
 *
 * 使用方法：
 *   node check_all.js           # 快速检查
 *   node check_all.js --health  # 完整健康检查
 *   node check_all.js -h        # 查看帮助
 */

const { Client } = require('ssh2');
const { exec } = require('child_process');

const conn = new Client();
const serverConfig = {
  host: '7zi.com',
  port: 22,
  username: 'root',
  password: 'ge2099334$ZZ'
};

// 检查是否启用完整健康检查
const runHealthCheck = process.argv.includes('--health') || process.argv.includes('-H');

if (process.argv.includes('-h') || process.argv.includes('--help')) {
  console.log(`
check_all.js - 综合检查脚本

使用方法:
  node check_all.js           # 快速检查
  node check_all.js --health  # 完整健康检查（包括 HTTP 响应、配置验证等）
  node check_all.js -h        # 显示此帮助信息

选项:
  -h, --help      显示帮助信息
  --health, -H    运行完整的站点健康检查
  `);
  process.exit(0);
}

conn.on('ready', () => {
  console.log('=== SSH连接成功 ===\n');

  // 1. 检查Nginx状态
  conn.exec('systemctl status nginx --no-pager | head -20', (err, stream) => {
    stream.on('close', () => {
      // 2. 检查开发模式进程数量
      conn.exec('ps aux | grep -E "vite|next dev" | grep -v grep | wc -l', (err2, stream2) => {
        stream2.on('close', () => {
          // 3. 检查端口使用情况
          conn.exec('ss -tlnp | grep -E "80:|443:|3000:|517[0-9]:"', (err3, stream3) => {
            stream3.on('close', () => {
              // 4. 检查Web目录
              conn.exec('ls -la /web/', (err4, stream4) => {
                stream4.on('close', () => {
                  conn.end();

                  // 如果启用了健康检查，运行完整检查
                  if (runHealthCheck) {
                    console.log('\n=== 开始完整站点健康检查 ===\n');
                    exec('node /root/.openclaw/workspace/commander/check_health.js', (error, stdout, stderr) => {
                      if (error) {
                        console.error('健康检查执行失败:', error);
                        process.exit(1);
                      }
                      if (stderr) {
                        console.error(stderr);
                      }
                      console.log(stdout);
                    });
                  }
                }).on('data', (data) => {
                  process.stdout.write(data.toString());
                });
              }).on('data', (data) => {
                process.stdout.write(data.toString());
              });
            }).on('data', (data) => {
              process.stdout.write(data.toString());
            });
          }).on('data', (data) => {
            process.stdout.write(data.toString());
          });
        }).on('data', (data) => {
          process.stdout.write(data.toString());
        });
      }).on('data', (data) => {
        process.stdout.write(data.toString());
      });
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.log('连接错误:', err.message);
}).connect(serverConfig);
