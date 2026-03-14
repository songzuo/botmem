#!/usr/bin/env python3
"""
微信公众号邮件发布脚本
通过 SMTP 发送邮件到公众号投稿邮箱一键发布
"""

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from datetime import datetime

# ==================== 配置 ====================
# SMTP 配置 - 需要你填写
SMTP_SERVER = "smtp.sendclaw.com"  # 或者 smtp.exmail.qq.com
SMTP_PORT = 465  # SSL 端口
SMTP_USER = "asong@sendclaw.com"
SMTP_PASSWORD = ""  # 需要填入 SMTP 密码/授权码

# 公众号投稿邮箱 - 需要从公众号后台获取
MP_RECIPIENT = "mp@weixin.qq.com"  # 示例，实际地址需要从公众号后台获取

# ==================== 配置 ====================

def read_markdown_file(file_path):
    """读取 Markdown 文件"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def markdown_to_html(markdown_content):
    """
    简单的 Markdown 转 HTML
    实际使用时可以用 markdown 库
    """
    html = markdown_content
    # 标题转换
    html = html.replace('# ', '<h1>').replace('\n', '</h1>\n', 1)
    html = html.replace('## ', '<h2>').replace('\n', '</h2>\n')
    html = html.replace('### ', '<h3>').replace('\n', '</h3>\n')
    # 粗体
    html = html.replace('**', '<strong>', 1).replace('**', '</strong>', 1)
    # 段落
    html = html.replace('\n\n', '</p><p>')
    html = f'<html><body><p>{html}</p></body></html>'
    return html

def send_wechat_article(title, content_html, images=None):
    """
    发送微信公众号文章
    
    Args:
        title: 文章标题
        content_html: HTML 格式的文章内容
        images: 图片列表（可选）
    """
    msg = MIMEMultipart('alternative')
    msg['Subject'] = title
    msg['From'] = SMTP_USER
    msg['To'] = MP_RECIPIENT
    
    # 添加纯文本版本（备用）
    text_content = f"文章标题: {title}\n\n请在微信公众平台查看完整内容"
    msg.attach(MIMEText(text_content, 'plain'))
    
    # 添加 HTML 版本
    msg.attach(MIMEText(content_html, 'html', 'utf-8'))
    
    # 添加图片（如果有）
    if images:
        for img_path in images:
            if os.path.exists(img_path):
                with open(img_path, 'rb') as f:
                    img = MIMEImage(f.read())
                    img.add_header('Content-ID', f'<{os.path.basename(img_path)}>')
                    msg.attach(img)
    
    # 发送邮件
    try:
        print(f"📧 连接 SMTP 服务器: {SMTP_SERVER}:{SMTP_PORT}")
        server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT)
        print("🔐 登录邮箱...")
        server.login(SMTP_USER, SMTP_PASSWORD)
        print(f"📤 发送邮件到: {MP_RECIPIENT}")
        server.sendmail(SMTP_USER, MP_RECIPIENT, msg.as_string())
        server.quit()
        print("✅ 发送成功！")
        return True
    except Exception as e:
        print(f"❌ 发送失败: {e}")
        return False

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='微信公众号邮件发布工具')
    parser.add_argument('file', help='Markdown 文件路径')
    parser.add_argument('--title', '-t', help='文章标题（默认从文件名提取）')
    parser.add_argument('--images', '-i', nargs='*', help='图片文件路径')
    parser.add_argument('--smtp-server', default=SMTP_SERVER, help='SMTP 服务器')
    parser.add_argument('--smtp-port', type=int, default=SMTP_PORT, help='SMTP 端口')
    parser.add_argument('--smtp-user', default=SMTP_USER, help='SMTP 用户名')
    parser.add_argument('--smtp-password', default=SMTP_PASSWORD, help='SMTP 密码')
    
    args = parser.parse_args()
    
    # 读取文件
    if not os.path.exists(args.file):
        print(f"❌ 文件不存在: {args.file}")
        return
    
    content = read_markdown_file(args.file)
    
    # 提取标题
    title = args.title
    if not title:
        # 从第一行提取（去掉 # ）
        first_line = content.split('\n')[0].strip()
        title = first_line.lstrip('#').strip()
    
    # 转换为 HTML
    content_html = markdown_to_html(content)
    
    # 发送
    print(f"📝 标题: {title}")
    print(f"📄 字数: {len(content)}")
    
    # 更新全局配置
    global SMTP_SERVER, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
    SMTP_SERVER = args.smtp_server
    SMTP_PORT = args.smtp_port
    SMTP_USER = args.smtp_user
    SMTP_PASSWORD = args.smtp_password
    
    if not SMTP_PASSWORD:
        print("❌ 请设置 SMTP 密码")
        print("   使用 --smtp-password 参数或设置环境变量 SMTP_PASSWORD")
        return
    
    send_wechat_article(title, content_html, args.images)

if __name__ == '__main__':
    main()