/**
 * README.md - Commander 部署工具
 * 
 * # Commander - SSH 部署管理工具
 * 
 * 这是一个用于管理多个远程服务器上 bot 部署的工具集。
 * 
 * ## 功能概览
 * 
 * ### 检查脚本 (check_*)
 * - `check_7zi.js` - 检查 7zi 服务器状态
 * - `check_all.js` - 检查所有服务器
 * - `check_all_dist.js` - 检查所有 dist 目录
 * - `check_build_artifacts.js` - 检查构建产物
 * - `check_dev.js` - 检查开发模式
 * - `check_dev_mode.js` - 检查开发模式状态
 * - `check_dir_contents.js` - 检查目录内容
 * - `check_dist.js` - 检查 dist 目录
 * - `check_dist2.js` - 检查 dist 目录(备选)
 * - `check_github.js` - 检查 GitHub 仓库
 * - `check_listen.js` - 检查监听端口
 * - `check_main.js` - 检查主服务器
 * - `check_marriage.js` - 检查 marriage 服务
 * - `check_marriage_log.js` - 检查 marriage 日志
 * - `check_next.js` - 检查 Next.js 服务
 * - `check_nginx.js` - 检查 Nginx 配置
 * - `check_pm2.js` - 检查 PM2 进程
 * - `check_port.js` - 检查指定端口
 * - `check_ports.js` - 检查多个端口
 * - `check_project_build.js` - 检查项目构建
 * - `check_projects.js` - 检查项目状态
 * - `check_projects_detail.js` - 检查项目详情
 * - `check_system.js` - 检查系统状态
 * - `check_titles.js` - 检查标题
 * - `check_unzipped.js` - 检查解压文件
 * - `check_visa_marriage.js` - 检查签证婚姻服务
 * - `check_web_projects.js` - 检查 Web 项目
 * 
 * ### 部署脚本 (deploy_*)
 * - `deploy_all.js` - 部署所有服务
 * - `deploy_all_sites.js` - 部署所有站点
 * - `deploy_available.js` - 部署可用服务
 * - `deploy_visa.js` - 部署签证服务
 * 
 * ### 启动/停止脚本 (start_*/stop_*/kill_*)
 * - `start_main.js` - 启动主服务
 * - `start_marriage.js` - 启动 marriage 服务
 * - `start_visa.js` - 启动签证服务
 * - `stop_dev.js` - 停止开发进程
 * - `stop_dev_processes.js` - 停止开发进程组
 * - `kill_all.js` - 终止所有进程
 * - `kill_dev.js` - 终止开发进程
 * 
 * ### 验证脚本 (verify_*)
 * - `verify.js` - 基础验证
 * - `verify_all.js` - 全面验证
 * - `verify_marriage.js` - 验证 marriage 服务
 * - `verify_visa.js` - 验证签证服务
 * 
 * ### 辅助脚本
 * - `cleanup.js` - 清理临时文件
 * - `final_check.js` - 最终检查
 * - `final_verify.js` - 最终验证
 * - `fix_nginx.js` - 修复 Nginx 配置
 * - `quick_check.js` - 快速检查
 * - `restart_main.js` - 重启主服务
 * - `setup_nginx.js` - 设置 Nginx
 * - `unzip_projects.js` - 解压项目文件
 * 
 * ## 依赖
 * - ssh2 - SSH 连接库
 * 
 * ## 使用方法
 * 
 * ```bash
 * node check_all.js
 * node deploy_all.js
 * node verify.js
 * ```
 */

module.exports = {};
