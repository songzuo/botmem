/**
 * check_ports.js - 统一的端口检查脚本
 *
 * 整合了 check_port.js, check_ports.js, check_next.js, check_listen.js 的功能
 * - 检查所有常用端口（80, 443, 3000-3010, 5173-5179, 5000, 8001等）
 * - 检查开发模式进程（vite, next dev）
 * - 检查Node.js进程
 * - HTTP响应测试
 * - 标题提取
 *
 * 使用方法：
 *   node check_ports.js           # 快速端口检查
 *   node check_ports.js --full    # 完整检查（包括HTTP测试）
 *   node check_ports.js --dev     # 仅检查开发模式
 *   node check_ports.js -h        # 查看帮助
 */

const { execCommand, printHeader, printSection, printError, printSuccess } = require('./utils/ssh_util');

// 解析命令行参数
const args = process.argv.slice(2);
const showFull = args.includes('--full') || args.includes('-f');
const devOnly = args.includes('--dev') || args.includes('-d');
const showHelp = args.includes('-h') || args.includes('--help');

if (showHelp) {
  console.log(`
check_ports.js - 统一的端口检查脚本

使用方法:
  node check_ports.js           # 快速端口检查
  node check_ports.js --full    # 完整检查（包括HTTP测试和标题）
  node check_ports.js --dev     # 仅检查开发模式进程
  node check_ports.js -h        # 显示此帮助信息

选项:
  -h, --help     显示帮助信息
  --full, -f     运行完整检查（HTTP响应、标题提取）
  --dev, -d      仅检查开发模式进程
  `);
  process.exit(0);
}

printHeader('端口与服务检查');

// 检查常用端口
function checkPorts() {
  const portPatterns = ['80:', '443:', '3000:', '3001:', '3002:', '3003:', '3010:', '5000:', '8001:', '5173:', '5174:'];

  printSection('端口监听情况');
  execCommand(`ss -tlnp | grep -E "${portPatterns.join('|')}"`, (err, result) => {
    if (err) {
      printError('端口检查失败', err);
    } else {
      if (result.output.trim()) {
        console.log(result.output);
      } else {
        console.log('没有找到匹配的端口监听');
      }
    }

    if (!devOnly) {
      checkNodeProcesses();
    } else {
      process.exit(0);
    }
  });
}

// 检查Node.js进程
function checkNodeProcesses() {
  printSection('Node.js进程列表');
  execCommand('ps aux | grep node | grep -v grep | head -30', (err, result) => {
    if (err) {
      printError('进程检查失败', err);
    } else {
      if (result.output.trim()) {
        console.log(result.output);
      } else {
        console.log('没有运行中的Node.js进程');
      }
    }

    checkDevProcesses();
  });
}

// 检查开发模式进程
function checkDevProcesses() {
  printSection('开发模式进程 (vite, next dev)');
  execCommand('ps aux | grep -E "vite|next dev" | grep -v grep', (err, result) => {
    if (err) {
      printError('开发模式检查失败', err);
    } else {
      if (result.output.trim()) {
        console.log(result.output);
        printSuccess('发现开发模式进程');
      } else {
        console.log('没有开发模式进程在运行');
      }
    }

    if (showFull) {
      checkHTTPResponses();
    } else {
      printSuccess('端口检查完成');
      process.exit(0);
    }
  });
}

// 检查HTTP响应
function checkHTTPResponses() {
  printSection('HTTP响应测试');
  const ports = ['3000', '3001', '3002', '3003', '3010', '5000'];

  const cmd = ports.map(p =>
    `echo -n "端口 ${p}: " && curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://localhost:${p} 2>/dev/null || echo "超时"`
  ).join(' && ');

  execCommand(cmd, (err, result) => {
    if (err) {
      printError('HTTP检查失败', err);
    } else {
      console.log(result.output);
    }

    checkTitles();
  });
}

// 检查网站标题
function checkTitles() {
  printSection('网站标题提取');
  const ports = ['3000', '3002', '3003', '5000', '3010'];

  const cmd = ports.map(p =>
    `echo "=== 端口 ${p} ===" && curl -s http://localhost:${p} 2>/dev/null | grep -oP "<title>[^<]+" | head -1 || echo "无响应"`
  ).join(' && ');

  execCommand(cmd, (err, result) => {
    if (err) {
      printError('标题检查失败', err);
    } else {
      console.log(result.output);
    }

    printSuccess('完整检查完成');
    process.exit(0);
  });
}

// 开始执行
if (devOnly) {
  checkDevProcesses();
} else {
  checkPorts();
}
