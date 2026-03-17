#!/usr/bin/env python3
"""
Log Analyzer - 高级日志分析工具
支持多种日志格式、模式匹配、趋势分析和异常检测
"""

import os
import re
import json
import argparse
from datetime import datetime, timedelta
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, List, Tuple, Optional

# 日志模式定义
ERROR_PATTERNS = [
    r'\[ERROR\]',
    r'\[FATAL\]',
    r'\[CRITICAL\]',
    r'ERROR:',
    r'Exception:',
    r'Traceback',
    r'Failed to',
    r'Cannot',
    r'Timeout',
    r'ETIMEDOUT',
    r'Connection refused',
    r'ECONNREFUSED',
    r'Out of memory',
    r'ENOMEM',
    r'Segmentation fault',
]

WARNING_PATTERNS = [
    r'\[WARN\]',
    r'\[WARNING\]',
    r'WARN:',
    r'Deprecated',
    r'Outdated',
    r'Retry',
    r'Retrying',
]

INFO_PATTERNS = [
    r'\[INFO\]',
    r'\[DEBUG\]',
    r'INFO:',
    r'Started',
    r'Completed',
    r'Success',
]

class LogAnalyzer:
    def __init__(self, log_dir: str = "/root/.openclaw/logs"):
        self.log_dir = Path(log_dir)
        self.errors: List[Dict] = []
        self.warnings: List[Dict] = []
        self.info: List[Dict] = []
        self.stats: Dict = defaultdict(int)
        
    def find_log_files(self, since_hours: int = 1) -> List[Path]:
        """查找最近修改的日志文件"""
        log_files = []
        cutoff = datetime.now() - timedelta(hours=since_hours)
        
        for pattern in ["*.log", "*.log.*"]:
            for f in self.log_dir.glob(pattern):
                if datetime.fromtimestamp(f.stat().st_mtime) > cutoff:
                    log_files.append(f)
        
        return log_files
    
    def classify_line(self, line: str) -> Tuple[str, Optional[str]]:
        """分类日志行"""
        for pattern in ERROR_PATTERNS:
            if re.search(pattern, line, re.IGNORECASE):
                return 'error', pattern
        for pattern in WARNING_PATTERNS:
            if re.search(pattern, line, re.IGNORECASE):
                return 'warning', pattern
        for pattern in INFO_PATTERNS:
            if re.search(pattern, line, re.IGNORECASE):
                return 'info', pattern
        return 'other', None
    
    def parse_log_file(self, file_path: Path) -> None:
        """解析单个日志文件"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                for line_num, line in enumerate(f, 1):
                    line = line.strip()
                    if not line:
                        continue
                    
                    self.stats['total_lines'] += 1
                    level, pattern = self.classify_line(line)
                    
                    entry = {
                        'file': str(file_path.name),
                        'line': line_num,
                        'content': line[:500],  # 截断过长的行
                        'timestamp': datetime.now().isoformat(),
                        'pattern': pattern
                    }
                    
                    if level == 'error':
                        self.errors.append(entry)
                        self.stats['error_count'] += 1
                    elif level == 'warning':
                        self.warnings.append(entry)
                        self.stats['warning_count'] += 1
                    elif level == 'info':
                        self.info.append(entry)
                        self.stats['info_count'] += 1
                        
        except Exception as e:
            self.stats['parse_errors'] += 1
    
    def analyze(self, since_hours: int = 1) -> Dict:
        """执行完整分析"""
        log_files = self.find_log_files(since_hours)
        self.stats['files_analyzed'] = len(log_files)
        
        for log_file in log_files:
            self.parse_log_file(log_file)
        
        # 计算错误率
        if self.stats['total_lines'] > 0:
            self.stats['error_rate'] = round(
                self.stats['error_count'] / self.stats['total_lines'] * 100, 4
            )
        else:
            self.stats['error_rate'] = 0
        
        return self.generate_report()
    
    def generate_report(self) -> Dict:
        """生成分析报告"""
        # 错误类型统计
        error_types = Counter()
        for error in self.errors:
            if error['pattern']:
                error_types[error['pattern']] += 1
        
        # 生成报告
        report = {
            'summary': {
                'analysis_time': datetime.now().isoformat(),
                'files_analyzed': self.stats['files_analyzed'],
                'total_lines': self.stats['total_lines'],
                'errors': self.stats['error_count'],
                'warnings': self.stats['warning_count'],
                'info': self.stats['info_count'],
                'error_rate': f"{self.stats['error_rate']}%",
            },
            'error_types': dict(error_types.most_common(10)),
            'recent_errors': self.errors[-20:],
            'recent_warnings': self.warnings[-20:],
            'health_status': self._get_health_status(),
            'recommendations': self._get_recommendations(),
        }
        
        return report
    
    def _get_health_status(self) -> str:
        """评估系统健康状态"""
        error_rate = self.stats['error_rate']
        
        if error_rate > 5:
            return 'CRITICAL'
        elif error_rate > 1:
            return 'WARNING'
        elif error_rate > 0.1:
            return 'FAIR'
        else:
            return 'HEALTHY'
    
    def _get_recommendations(self) -> List[str]:
        """生成优化建议"""
        recommendations = []
        
        error_rate = self.stats['error_rate']
        
        if error_rate > 1:
            recommendations.append(f"错误率 {error_rate}% 过高，建议立即检查")
        
        # 分析错误类型
        error_types = Counter(e['pattern'] for e in self.errors if e['pattern'])
        
        for pattern, count in error_types.most_common(5):
            if 'Connection' in pattern or 'ECONNREFUSED' in pattern:
                recommendations.append(f"发现 {count} 次连接错误，建议检查网络配置和服务状态")
            elif 'Timeout' in pattern or 'ETIMEDOUT' in pattern:
                recommendations.append(f"发现 {count} 次超时错误，建议检查服务响应时间")
            elif 'memory' in pattern.lower() or 'ENOMEM' in pattern:
                recommendations.append(f"发现 {count} 次内存错误，建议检查内存使用情况")
            elif 'Exception' in pattern or 'Traceback' in pattern:
                recommendations.append(f"发现 {count} 次异常，建议检查应用日志")
        
        if not recommendations:
            recommendations.append("系统运行正常，继续保持监控")
        
        return recommendations
    
    def print_report(self, format: str = 'text') -> None:
        """打印分析报告"""
        report = self.analyze()
        
        if format == 'json':
            print(json.dumps(report, indent=2, ensure_ascii=False))
            return
        
        # 文本格式报告
        print("\n" + "=" * 50)
        print("        📊 日志分析报告")
        print("=" * 50)
        
        summary = report['summary']
        print(f"\n分析时间: {summary['analysis_time']}")
        print(f"分析文件: {summary['files_analyzed']} 个")
        print(f"总日志条目: {summary['total_lines']}")
        
        # 健康状态
        status = report['health_status']
        status_emoji = {
            'HEALTHY': '✅',
            'FAIR': '😐',
            'WARNING': '⚠️',
            'CRITICAL': '❌'
        }
        print(f"\n系统状态: {status_emoji.get(status, '❓')} {status}")
        
        # 统计
        print(f"\n🔴 错误: {summary['errors']}")
        print(f"⚠️  警告: {summary['warnings']}")
        print(f"ℹ️  信息: {summary['info']}")
        print(f"📈 错误率: {summary['error_rate']}")
        
        # 错误类型
        if report['error_types']:
            print("\n" + "-" * 50)
            print("🔴 错误类型分布:")
            for pattern, count in report['error_types'].items():
                print(f"  • {pattern}: {count} 次")
        
        # 最近错误
        if report['recent_errors']:
            print("\n" + "-" * 50)
            print("🔴 最近错误:")
            for error in report['recent_errors'][-5:]:
                print(f"  [{error['file']}] {error['content'][:80]}")
        
        # 建议
        print("\n" + "-" * 50)
        print("💡 建议:")
        for rec in report['recommendations']:
            print(f"  • {rec}")
        
        print("\n" + "=" * 50)


def main():
    parser = argparse.ArgumentParser(description='日志分析工具')
    parser.add_argument('--since', type=int, default=1, help='分析最近N小时的日志')
    parser.add_argument('--format', choices=['text', 'json'], default='text', help='输出格式')
    parser.add_argument('--log-dir', default='/root/.openclaw/logs', help='日志目录')
    
    args = parser.parse_args()
    
    analyzer = LogAnalyzer(log_dir=args.log_dir)
    analyzer.print_report(format=args.format)


if __name__ == '__main__':
    main()