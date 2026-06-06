import akshare as ak
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def get_stock_candidates():
    print("⏳ 正在获取 A 股实时行情数据...")
    try:
        stock_info = ak.stock_zh_a_spot_em()
        print(f"✅ 成功获取 {len(stock_info)} 只股票数据")
    except Exception as e:
        print(f"❌ 获取股票数据失败: {e}")
        return []
    
    candidates = stock_info.copy()
    
    print("\n🔍 基本面筛选条件：")
    print("  - 市盈率 > 0 (排除亏损股)")
    print("  - 市盈率 < 40 (估值合理)")
    print("  - 市净率 < 5")
    print("  - 最新价 > 5 (排除低价股)")
    
    candidates = candidates[
        (candidates['市盈率-动态'] > 0) &
        (candidates['市盈率-动态'] < 40) &
        (candidates['市净率'] < 5) &
        (candidates['最新价'] > 5) &
        (candidates['最新价'] < 200)
    ].copy()
    
    print(f"📊 基本面筛选后剩余 {len(candidates)} 只股票")
    
    return candidates[['代码', '名称', '最新价', '涨跌幅', '市盈率-动态', '市净率', '成交量']]

def analyze_technical(symbol):
    try:
        hist = ak.stock_zh_a_hist(symbol=symbol, period="daily", adjust="qfq")
        if len(hist) < 60:
            return None
        
        hist['MA5'] = hist['收盘'].rolling(5).mean()
        hist['MA10'] = hist['收盘'].rolling(10).mean()
        hist['MA20'] = hist['收盘'].rolling(20).mean()
        hist['MA60'] = hist['收盘'].rolling(60).mean()
        
        latest = hist.iloc[-1]
        prev = hist.iloc[-2]
        
        score = 0
        features = []
        
        if latest['MA5'] > latest['MA10'] > latest['MA20'] > latest['MA60']:
            score += 3
            features.append("均线多头")
        
        volume_ratio = latest['成交量'] / hist['成交量'].rolling(20).mean().iloc[-1]
        if volume_ratio > 1.5:
            score += 2
            features.append("放量")
        
        if latest['收盘'] > latest['MA20']:
            score += 1
            features.append("站上年线")
        
        if latest['涨跌幅'] > 0 and prev['涨跌幅'] > 0:
            score += 1
            features.append("连涨")
        
        return {
            'score': score,
            'features': features,
            'ma5': round(latest['MA5'], 2),
            'ma10': round(latest['MA10'], 2),
            'ma20': round(latest['MA20'], 2),
            'ma60': round(latest['MA60'], 2),
            'close': round(latest['收盘'], 2)
        }
    except Exception as e:
        return None

def get_fund_flow(symbol):
    try:
        market = "sh" if symbol.startswith('6') else "sz"
        flow = ak.stock_individual_fund_flow(stock=symbol, market=market)
        if flow is not None and not flow.empty:
            return {
                'main_inflow': flow.get('主力净流入-净额', 0),
                'large_inflow': flow.get('超大单净流入-净额', 0)
            }
    except:
        pass
    return None

def main():
    print("=" * 60)
    print("        📈 看盘选股专家 v1.0")
    print("=" * 60)
    print(f"🕐 分析日期: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)
    
    candidates = get_stock_candidates()
    
    if len(candidates) == 0:
        print("❌ 没有找到符合条件的股票")
        return
    
    results = []
    
    print("\n🔬 正在分析技术形态...")
    for idx, row in candidates.iterrows():
        tech = analyze_technical(row['代码'])
        if tech and tech['score'] >= 3:
            fund = get_fund_flow(row['代码'])
            results.append({
                '代码': row['代码'],
                '名称': row['名称'],
                '最新价': row['最新价'],
                '涨跌幅': row['涨跌幅'],
                '市盈率': row['市盈率-动态'],
                '市净率': row['市净率'],
                '技术评分': tech['score'],
                '形态特征': ', '.join(tech['features']),
                '资金流向': '主力净流入' if fund and fund['main_inflow'] > 0 else '待观察'
            })
        
        if len(results) >= 10:
            break
    
    results_df = pd.DataFrame(results)
    results_df = results_df.sort_values('技术评分', ascending=False).head(5)
    
    print("\n" + "=" * 60)
    print("            🏆 候选股票清单")
    print("=" * 60)
    
    if len(results_df) == 0:
        print("❌ 当前市场环境下未找到符合条件的强势股")
        print("\n💡 建议：")
        print("  - 等待大盘企稳后再选股")
        print("  - 关注市场热点板块")
        print("  - 控制仓位，做好风险管理")
    else:
        print(results_df.to_string(index=False))
        
        print("\n📊 买入建议：")
        for _, row in results_df.iterrows():
            stop_loss = round(row['最新价'] * 0.92, 2)
            target = round(row['最新价'] * 1.15, 2)
            print(f"  • {row['名称']}({row['代码']}): 现价 {row['最新价']} | 目标价 {target} | 止损位 {stop_loss}")
        
        print("\n⚠️ 风险提示：")
        print("  - 以上分析仅供参考，不构成投资建议")
        print("  - 建议结合大盘环境综合判断")
        print("  - 严格执行止损纪律")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()