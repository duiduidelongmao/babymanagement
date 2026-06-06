#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
通达信盘后数据文件解析工具
支持格式：.盘后、.day 等通达信日线数据格式
输出：CSV/Excel格式

格式说明：
- 文件头：48字节（包含魔数、版本信息等）
- 每条记录：32字节
- 记录格式（小端序）：
  - 日期偏移：4字节（从1900-01-01开始的天数）
  - 开盘价：4字节（整数，实际价格 = 值 / 1000000）
  - 最高价：4字节（整数，实际价格 = 值 / 1000000）
  - 最低价：4字节（整数，实际价格 = 值 / 1000000）
  - 收盘价：4字节（整数，实际价格 = 值 / 1000000）
  - 成交量：4字节（整数，单位：股）
  - 成交额：4字节（整数，单位：元）
  - 预留：4字节
"""

import os
import struct
import pandas as pd
from datetime import datetime, timedelta

def parse_tdx_day_file(file_path):
    """
    解析通达信日线数据文件
    """
    records = []
    base_date = datetime(1900, 1, 1)
    
    with open(file_path, 'rb') as f:
        data = f.read()
    
    # 文件头48字节，记录长度32字节
    header_size = 48
    record_size = 32
    
    if len(data) < header_size:
        print("错误：文件太小")
        return records
    
    remaining = len(data) - header_size
    num_records = remaining // record_size
    
    if remaining % record_size != 0:
        print(f"警告：文件大小 {len(data)}，文件头 {header_size} 字节后剩余 {remaining} 字节，不是 {record_size} 的整数倍")
    
    for i in range(num_records):
        offset = header_size + i * record_size
        record_data = data[offset:offset+record_size]
        
        # 解析记录：8个uint32（小端序）
        unpacked = struct.unpack('<IIIIIIII', record_data)
        
        date_offset = unpacked[0]
        try:
            # 通达信日期是从1900-01-01开始的天数偏移
            date = base_date + timedelta(days=date_offset - 1)
            # 过滤无效日期（太旧或未来日期）
            if date.year < 1990 or date.year > 2100:
                continue
        except:
            continue
        
        # 价格需要除以1000000
        price_scale = 1000000.0
        open_price = unpacked[1] / price_scale
        high_price = unpacked[2] / price_scale
        low_price = unpacked[3] / price_scale
        close_price = unpacked[4] / price_scale
        volume = unpacked[5]
        amount = unpacked[6]
        
        # 过滤异常数据（价格范围检查）
        # 上证综指通常在1000-10000之间
        if close_price <= 0 or close_price > 15000:
            continue
        
        # 确保最低价 <= 收盘价 <= 最高价
        if not (low_price <= close_price <= high_price and low_price <= open_price <= high_price):
            # 尝试交换高低价字段
            temp_high = high_price
            temp_low = low_price
            high_price = max(open_price, close_price, temp_high, temp_low)
            low_price = min(open_price, close_price, temp_high, temp_low)
        
        records.append({
            '日期': date.strftime('%Y-%m-%d'),
            '开盘价': round(open_price, 2),
            '最高价': round(high_price, 2),
            '最低价': round(low_price, 2),
            '收盘价': round(close_price, 2),
            '成交量': volume,
            '成交额': amount
        })
    
    return records

def detect_record_format(file_path):
    """
    探测文件格式，确认记录大小
    """
    with open(file_path, 'rb') as f:
        data = f.read(200)
    
    print("文件头分析：")
    print(f"文件大小：{os.path.getsize(file_path)} 字节")
    
    base_date = datetime(1900, 1, 1)
    
    # 查看文件头
    header = data[:48]
    print(f"\n文件头48字节: {header.hex()}")
    
    # 尝试解析第一条记录
    start = 48
    record = data[start:start+32]
    print(f"\n第一条记录: {record.hex()}")
    
    try:
        unpacked = struct.unpack('<IIIIIIII', record)
        date_offset = unpacked[0]
        date = base_date + timedelta(days=date_offset - 1)
        price_scale = 1000000.0
        open_price = unpacked[1] / price_scale
        high_price = unpacked[2] / price_scale
        low_price = unpacked[3] / price_scale
        close_price = unpacked[4] / price_scale
        volume = unpacked[5]
        amount = unpacked[6]
        print(f"解析结果: 日期={date.strftime('%Y-%m-%d')}, 开={open_price:.2f}, 高={high_price:.2f}, 低={low_price:.2f}, 收={close_price:.2f}, 量={volume}, 额={amount}")
    except Exception as e:
        print(f"解析失败: {e}")

def batch_convert(input_dir, output_dir=None):
    """
    批量转换目录下所有盘后数据文件
    """
    if output_dir is None:
        output_dir = input_dir
    
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    # 查找所有盘后数据文件
    for filename in os.listdir(input_dir):
        if filename.endswith('.盘后'):
            file_path = os.path.join(input_dir, filename)
            print(f"\n正在处理: {filename}")
            
            try:
                records = parse_tdx_day_file(file_path)
                
                if len(records) == 0:
                    print(f"  警告：未解析到有效数据")
                    continue
                
                df = pd.DataFrame(records)
                df = df.sort_values('日期')  # 按日期排序
                
                # 生成输出文件名
                base_name = os.path.splitext(filename)[0]
                csv_path = os.path.join(output_dir, f"{base_name}.csv")
                
                # 导出CSV
                df.to_csv(csv_path, index=False, encoding='utf-8-sig')
                print(f"  成功导出 {len(records)} 条记录到 {csv_path}")
                
                # 导出Excel
                excel_path = os.path.join(output_dir, f"{base_name}.xlsx")
                try:
                    df.to_excel(excel_path, index=False)
                    print(f"  成功导出到 {excel_path}")
                except ImportError:
                    print(f"  提示：需要安装 openpyxl 才能导出Excel")
            
            except Exception as e:
                print(f"  处理失败: {e}")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='通达信盘后数据解析工具')
    parser.add_argument('input', help='输入文件或目录')
    parser.add_argument('-o', '--output', help='输出目录', default=None)
    parser.add_argument('-d', '--detect', action='store_true', help='探测文件格式')
    
    args = parser.parse_args()
    
    if args.detect:
        # 格式探测模式
        if os.path.isfile(args.input):
            detect_record_format(args.input)
        else:
            print("格式探测模式只支持单个文件")
    else:
        # 转换模式
        if os.path.isfile(args.input):
            # 单个文件处理
            records = parse_tdx_day_file(args.input)
            if records:
                df = pd.DataFrame(records)
                df = df.sort_values('日期')
                
                output_path = args.output if args.output else os.path.splitext(args.input)[0] + '.csv'
                df.to_csv(output_path, index=False, encoding='utf-8-sig')
                print(f"成功导出 {len(records)} 条记录到 {output_path}")
        elif os.path.isdir(args.input):
            # 批量处理目录
            batch_convert(args.input, args.output)
        else:
            print(f"错误：{args.input} 不是有效的文件或目录")

if __name__ == '__main__':
    main()
