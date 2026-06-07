import os
import json
import re

def mask_name(name):
    if not name or str(name).lower() == 'nan':
        return ''
    upper = str(name).upper()
    if upper == 'SETYAWATI': return 'S*T**W*T*'
    if upper == 'ENJANG': return 'EN***G'
    if upper == 'NURDIANSYAH': return 'NU****S*H'
    
    chars = list(upper)
    masked = ''
    for i, char in enumerate(chars):
        if i == 0 or i == 3 or i == 5 or not re.match(r'[A-Z]', char):
            masked += char
        else:
            masked += '*'
    return masked
import pandas as pd
import glob
from collections import defaultdict

def main():
    data_dir = r"C:\Users\User\Downloads\SENTRAMEDIKA\TXT NEW"
    txt_files = glob.glob(os.path.join(data_dir, "**", "*.txt"), recursive=True)
    
    print(f"Found {len(txt_files)} TXT files.")
    
    with open('audit_rules.json', 'r', encoding='utf-8') as f:
        audit_rules = json.load(f)
        
    results = defaultdict(lambda: {"total": 0, "audit": []})
    
    rs_map = {
        '3201230': '3201230 - Cibinong',
        '3216163': '3216163 - Cikarang',
        '3276017': '3276017 - Cisalak',
        '3209144': '3209144 - Gempol',
        '7106020': '7106020 - MINUT',
        '3172553': '3172553 - RSHB'
    }
    
    for file_path in txt_files:
        filename = os.path.basename(file_path)
        folder = os.path.basename(os.path.dirname(file_path))
        print(f"Processing {folder}/{filename}...")
        try:
            df = pd.read_csv(file_path, sep='\t', dtype=str)
        except Exception as e:
            print(f"Failed to read {filename}: {e}")
            continue
            
        df.columns = [c.strip().upper() for c in df.columns]
        
        for idx, row in df.iterrows():
            kode_rs = str(row.get('KODE_RS', 'UNKNOWN')).strip()
            
            if kode_rs not in rs_map:
                rs_map[kode_rs] = f"{kode_rs} - {folder}"
                
            discharge_date = str(row.get('DISCHARGE_DATE', ''))
            bulan_str = "UNKNOWN"
            if '/' in discharge_date:
                parts = discharge_date.split('/')
                if len(parts) >= 2:
                    bulan_str = parts[1]
            elif '-' in discharge_date:
                parts = discharge_date.split('-')
                if len(parts) >= 2:
                    bulan_str = parts[1]
            
            bulan_map = {'01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April', '05': 'Mei', '06': 'Juni', '1': 'Januari', '2': 'Februari', '3': 'Maret', '4': 'April', '5': 'Mei', '6': 'Juni'}
            nama_bulan = bulan_map.get(bulan_str, bulan_str)
                
            group_key = f"{rs_map[kode_rs]} - {nama_bulan}"
            results[group_key]["total"] += 1
            
            diaglist = str(row.get('DIAGLIST', '')).split(';')
            proclist = str(row.get('PROCLIST', '')).split(';')
            
            d_list = [d.strip() for d in diaglist if d.strip() and d.strip().lower() != 'nan']
            p_list = [p.strip() for p in proclist if p.strip() and p.strip() != '-' and p.strip().lower() not in ['none', 'nan']]
            
            ac_row = d_list + p_list
            for ru in audit_rules:
                condition = ru.get("condition", {})
                op = condition.get("operator", "OR")
                matched = False
                
                if condition.get("type") == "grouped":
                    groups = condition.get("groups", [])
                    if op == "AND":
                        matched = all(any(any(ac.startswith(c) for ac in ac_row) for c in g.get("codes", [])) for g in groups)
                    else:
                        matched = any(any(any(ac.startswith(c) for ac in ac_row) for c in g.get("codes", [])) for g in groups)
                elif condition.get("type") == "custom_missing":
                    ptd = str(row.get("PTD", "")).strip()
                    reqs = condition.get("requires", [])
                    missings = condition.get("missing", [])
                    excludes = condition.get("excludes", [])
                    
                    has_req = any(any(ac.startswith(c) for ac in ac_row) for c in reqs)
                    has_missing = any(any(ac.startswith(c) for ac in ac_row) for c in missings)
                    has_exclude = any(any(ac.startswith(c) for ac in ac_row) for c in excludes)
                    
                    if has_req and not has_missing:
                        if ptd == '1':
                            matched = True
                        elif not has_exclude:
                            matched = True
                elif condition.get("type") == "custom_age":
                    reqs = condition.get("requires", [])
                    max_age = condition.get("max_age_days", 999)
                    
                    has_req = any(any(ac.startswith(c) for ac in ac_row) for c in reqs)
                    umur_hari_str = str(row.get("UMUR_HARI", "")).strip()
                    try:
                        umur_hari = int(float(umur_hari_str)) if umur_hari_str else 9999
                    except ValueError:
                        umur_hari = 9999
                        
                    if has_req and umur_hari <= max_age:
                        matched = True
                elif condition.get("type") == "custom_los":
                    reqs = condition.get("requires", [])
                    max_los = condition.get("max_los_days", 999)
                    
                    has_req = any(any(ac.startswith(c) for ac in ac_row) for c in reqs)
                    los_str = str(row.get("LOS", "")).strip()
                    try:
                        los = int(float(los_str)) if los_str else 9999
                    except ValueError:
                        los = 9999
                        
                    if has_req and los <= max_los:
                        matched = True
                elif "codes" in condition:
                    matched = any(any(ac.startswith(c) for ac in ac_row) for c in condition.get("codes", []))
                    
                if matched and condition.get("type") != "custom_missing":
                    rule_ptd = str(ru.get("PTD", "")).strip()
                    ptd = str(row.get("PTD", "")).strip()
                    if rule_ptd == "1" and ptd not in ["1", ""]:
                        matched = False
                    elif rule_ptd == "2" and ptd not in ["2", ""]:
                        matched = False
                    
                if matched:
                    results[group_key]["audit"].append({
                        "KODE_RS": kode_rs,
                        "NAMA_PASIEN": row.get('NAMA_PASIEN', ''),
                        "MRN": row.get('MRN', ''),
                        "SEP": row.get('SEP', ''),
                        "NAMA_KODER": mask_name(row.get('CODER_ID', '') or row.get('USER_CODER', '') or row.get('CODER', '')),
                        "INACBG": row.get('INACBG', ''),
                        "DIAGLIST": ';'.join(d_list),
                        "PROCLIST": ';'.join(p_list),
                        "AUDIT ID": ru.get("id", ""),
                        "AUDIT CASE": ru.get("case", ""),
                        "WARNING": ru.get("validation_action", {}).get("warning_message", ""),
                        "TARIF RS": row.get('TARIF_RS', '') or row.get('TOTAL_TARIF_RS', ''),
                        "TARIF INACBG": row.get('TOTAL_TARIF', '')
                    })

    # Generate Report
    print("\n--- SUMMARY REPORT AUDIT ---")
    summary = []
    for group, data in results.items():
        total = data["total"]
        audit_count = len(data["audit"])
        
        summary.append({
            "RS & Bulan": group,
            "Total Data": total,
            "Terjaring Audit": audit_count,
            "% Terjaring": f"{(audit_count / total * 100):.2f}%" if total > 0 else "0.00%"
        })
        
        df_aud = pd.DataFrame(data["audit"])
        if not df_aud.empty:
            safe_group = group.replace(":", "").replace("\\", "").replace("/", "").replace("?", "").replace("*", "")[:31]
            df_aud.to_csv(f"Audit_NEW_{safe_group}.csv", index=False)
            
    summary_df = pd.DataFrame(summary)
    print(summary_df.to_string(index=False))
    summary_df.to_csv("Summary_Audit_NEW.csv", index=False)

if __name__ == "__main__":
    main()
