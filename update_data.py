#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
오피넷 서울지역 월간 유가 데이터 자동 수집 및 갱신 스크립트
매월 1일 실행되어 전월 데이터를 자동으로 data.json에 추가합니다.
"""

import urllib.request
import urllib.parse
import ssl
import re
import json
import os
from datetime import datetime, date, timedelta

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data.json")

def fetch_month_price(year, month):
    y_str = str(year)
    m_str = f"{month:02d}"
    
    # 1. Gasoline and Diesel
    url_oil = 'https://www.opinet.co.kr/user/dopospdrg/dopOsPdrgAreaSelect.do'
    data_oil = {
        'TERM': 'M',
        'STA_Y': y_str,
        'STA_M': '01',
        'END_Y': y_str,
        'END_M': m_str,
        'viewType': 'PROD',
        'searchType': 'PROD',
        'sido_cd': '01', # 서울
        'OIL_CD_B027': 'Y', # 보통휘발유
        'OIL_CD_D047': 'Y', # 자동차용경유
    }
    req_oil = urllib.request.Request(url_oil, data=urllib.parse.urlencode(data_oil).encode('utf-8'), headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://www.opinet.co.kr/user/dopospdrg/dopOsPdrgAreaView.do'
    })
    html_oil = urllib.request.urlopen(req_oil, context=ctx).read().decode('utf-8', errors='ignore')
    pattern_oil = re.compile(r'<tr>\s*<td scope="row"[^>]*>(.*?)</td>\s*<td>(.*?)</td>\s*<td>(.*?)</td>', re.DOTALL)
    rows_oil = pattern_oil.findall(html_oil)
    
    gasoline, diesel = None, None
    for r in rows_oil:
        raw_date = re.sub(r'<.*?>', '', r[0]).strip()
        digits = re.findall(r'\d+', raw_date)
        if len(digits) >= 2 and int(digits[1]) == month:
            gasoline = float(re.sub(r'<.*?>', '', r[1]).strip().replace(',', ''))
            diesel = float(re.sub(r'<.*?>', '', r[2]).strip().replace(',', ''))

    # 2. Automotive Butane (LPG)
    url_lpg = 'https://www.opinet.co.kr/user/dopvsavsel/dopVsAreaselSelect.do'
    data_lpg = {
        'TERM': 'M',
        'STA_Y': y_str,
        'STA_M': '01',
        'END_Y': y_str,
        'END_M': m_str,
        'searchType': 'PROD',
        'viewType': 'PROD',
        'sltAreaCd': '0100', # 서울
        'sltProdCd': 'K015', # 자동차부탄
        'OIL_CD_K015_P': 'Y',
    }
    req_lpg = urllib.request.Request(url_lpg, data=urllib.parse.urlencode(data_lpg).encode('utf-8'), headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://www.opinet.co.kr/user/dopvsavsel/dopVsAreaselSelect.do'
    })
    html_lpg = urllib.request.urlopen(req_lpg, context=ctx).read().decode('utf-8', errors='ignore')
    pattern_lpg = re.compile(r'<tr>\s*<td class="nobd_l t_center">(.*?)</td>\s*<td>(.*?)</td>\s*</tr>', re.DOTALL)
    rows_lpg = pattern_lpg.findall(html_lpg)
    
    lpg = None
    for r in rows_lpg:
        raw_date = re.sub(r'<.*?>', '', r[0]).strip()
        digits = re.findall(r'\d+', raw_date)
        if len(digits) >= 2 and int(digits[1]) == month:
            lpg = float(re.sub(r'<.*?>', '', r[1]).strip().replace(',', ''))

    if gasoline is not None and diesel is not None and lpg is not None:
        return {
            "period": f"{year}.{month:02d}",
            "display_name": f"{year}.{month:02d} 평균가격",
            "year": year,
            "month": month,
            "gasoline": gasoline,
            "diesel": diesel,
            "lpg": lpg
        }
    return None

def update():
    print(f"[{datetime.now().isoformat()}] Starting Opinet data update...")
    
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    else:
        data = {
            "region": "서울특별시",
            "unit": "원/L (VAT 포함)",
            "source": "한국석유공사 오피넷 (Opinet)",
            "history": []
        }

    history_dict = {item["period"]: item for item in data.get("history", [])}
    
    # Calculate previous month
    today = date.today()
    first_of_this_month = today.replace(day=1)
    last_of_prev_month = first_of_this_month - timedelta(days=1)
    
    target_year = last_of_prev_month.year
    target_month = last_of_prev_month.month
    
    print(f"Target previous month to check: {target_year}.{target_month:02d}")
    
    rec = fetch_month_price(target_year, target_month)
    if rec:
        period_key = rec["period"]
        if period_key in history_dict:
            print(f"Updating existing record for {period_key}: {rec}")
        else:
            print(f"Adding new month record for {period_key}: {rec}")
        history_dict[period_key] = rec
    else:
        print(f"Could not retrieve full data for {target_year}.{target_month:02d} yet.")

    sorted_history = sorted(list(history_dict.values()), key=lambda x: x["period"])
    data["history"] = sorted_history
    data["last_updated"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Successfully updated {DATA_FILE}. Total records: {len(sorted_history)}")

if __name__ == "__main__":
    update()
