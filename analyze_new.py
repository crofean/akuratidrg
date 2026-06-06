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

def check_match_list(arr_ina, arr_idrg, exclusions):
    def is_excluded(code):
        c = str(code).strip().upper()
        for exc in exclusions:
            e = str(exc).strip().upper()
            if c == e or c.startswith(e):
                return True
        return False
        
    clean_ina = list(set([str(c).strip().upper() for c in arr_ina if c and str(c).strip() != '-' and not is_excluded(c)]))
    clean_idrg = list(set([str(c).strip().upper() for c in arr_idrg if c and str(c).strip() != '-' and not is_excluded(c)]))
    
    if len(clean_ina) == 0 and len(clean_idrg) == 0:
        return 100
    if len(clean_ina) == 0 or len(clean_idrg) == 0:
        return 0
        
    m_ina = 0
    m_idrg = 0
    
    for i in clean_ina:
        if any(i.startswith(idrg) or idrg.startswith(i) for idrg in clean_idrg):
            m_ina += 1
            
    for idrg in clean_idrg:
        if any(i.startswith(idrg) or idrg.startswith(i) for i in clean_ina):
            m_idrg += 1
            
    if m_ina == len(clean_ina) and m_idrg == len(clean_idrg):
        return 100
        
    return ((m_ina / len(clean_ina)) * 100 + (m_idrg / len(clean_idrg)) * 100) / 2

def main():
    data_dir = r"C:\Users\User\Downloads\SENTRAMEDIKA\TXT NEW"
    txt_files = glob.glob(os.path.join(data_dir, "**", "*.txt"), recursive=True)
    
    print(f"Found {len(txt_files)} TXT files.")
    
    results = defaultdict(lambda: {"total": 0, "discrepancy": []})
    
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
            
            idrg_diaglist_str = str(row.get('IDRG_DIAG_LISTS', ''))
            idrg_proclist_str = str(row.get('IDRG_PROC_LISTS', ''))
            idrg_code_str = str(row.get('IDRG_DRG_CODE', ''))
            idrg_desc_str = str(row.get('IDRG_DRG_DESCRIPTION', ''))
            
            if not idrg_diaglist_str or idrg_diaglist_str.lower() == 'nan':
                for k, v in row.items():
                    if isinstance(v, str) and '"idrg":' in v:
                        try:
                            payload_idx = v.find('{')
                            if payload_idx >= 0:
                                p_data = json.loads(v[payload_idx:])
                                if 'idrg' in p_data:
                                    idrg_diaglist_str = str(p_data['idrg'].get('diag_lists') or '')
                                    idrg_proclist_str = str(p_data['idrg'].get('proc_lists') or '')
                                    idrg_code_str = str(p_data['idrg'].get('drg_code') or '')
                                    idrg_desc_str = str(p_data['idrg'].get('drg_description') or '')
                                    break
                        except Exception:
                            pass

            idrg_diaglist = idrg_diaglist_str.split(';')
            idrg_proclist = idrg_proclist_str.split(';')
            
            d_list = [d.strip() for d in diaglist if d.strip() and d.strip().lower() != 'nan']
            p_list = [p.strip() for p in proclist if p.strip() and p.strip() != '-' and p.strip().lower() not in ['none', 'nan']]
            idrg_d_list = [d.strip() for d in idrg_diaglist if d.strip() and d.strip().lower() != 'nan']
            idrg_p_list = [p.strip() for p in idrg_proclist if p.strip() and p.strip() != '-' and p.strip().lower() not in ['none', 'nan']]
            
            s_diag = check_match_list(d_list, idrg_d_list, ['KG', 'HL', 'NL', 'KND', 'G89', 'U82', 'U83', 'U84'])
            s_proc = check_match_list(p_list, idrg_p_list, ['99.290'])
            
            if s_diag < 100 or s_proc < 100:
                results[group_key]["discrepancy"].append({
                    "KODE_RS": kode_rs,
                    "NAMA_PASIEN": row.get('NAMA_PASIEN', ''),
                    "MRN": row.get('MRN', ''),
                    "SEP": row.get('SEP', ''),
                    "NAMA_KODER": mask_name(row.get('CODER_ID', '') or row.get('USER_CODER', '') or row.get('CODER', '')),
                    "INACBG": row.get('INACBG', ''),
                    "DESKRIPSI INACBG": row.get('DESKRIPSI_INACBG', ''),
                    "iDRG CODE": idrg_code_str,
                    "iDRG DESKRIPSI": idrg_desc_str,
                    "DIAG INACBG": ';'.join(d_list),
                    "PROC INACBG": ';'.join(p_list),
                    "DIAG iDRG": ';'.join(idrg_d_list),
                    "PROC iDRG": ';'.join(idrg_p_list),
                    "SCORE DIAG": s_diag,
                    "SCORE PROC": s_proc,
                    "MIN SCORE": min(s_diag, s_proc)
                })

    # Generate Report
    print("\n--- SUMMARY REPORT ---")
    summary = []
    for group, data in results.items():
        total = data["total"]
        disc_count = len(data["discrepancy"])
        sesuai_count = total - disc_count
        pct_sesuai = (sesuai_count / total * 100) if total > 0 else 0
        
        summary.append({
            "RS": group,
            "Total Data": total,
            "Sesuai": sesuai_count,
            "Discrepancy": disc_count,
            "% Kesesuaian": f"{pct_sesuai:.2f}%"
        })
        
        df_disc = pd.DataFrame(data["discrepancy"])
        if not df_disc.empty:
            safe_group = group.replace(":", "").replace("\\", "").replace("/", "").replace("?", "").replace("*", "")[:31]
            df_out = df_disc.drop(columns=["MIN SCORE"])
            df_out.to_csv(f"Discrepancy_NEW_{safe_group}.csv", index=False)
            
    summary_df = pd.DataFrame(summary)
    print(summary_df.to_string(index=False))
    summary_df.to_csv("Summary_Kesesuaian_NEW.csv", index=False)
    
    print("\n--- DISCREPANCY < 70% ---")
    for group, data in results.items():
        low_score = [d for d in data["discrepancy"] if d["MIN SCORE"] < 70]
        if low_score:
            print(f"\n[{group}] Ditemukan {len(low_score)} kasus dengan kesesuaian < 70%:")
            for i, d in enumerate(low_score[:5]): 
                print(f"  - MRN: {d['MRN']}, SEP: {d['SEP']}")
                print(f"    INA: {d['INACBG']} ({d['DIAG INACBG']} | {d['PROC INACBG']})")
                print(f"    iDRG: {d['iDRG CODE']} ({d['DIAG iDRG']} | {d['PROC iDRG']})")
                print(f"    Score Diag: {d['SCORE DIAG']:.1f}%, Score Proc: {d['SCORE PROC']:.1f}%")
            if len(low_score) > 5:
                print(f"    ... dan {len(low_score) - 5} kasus lainnya.")
                
            df_low = pd.DataFrame(low_score)
            safe_group = group.replace(":", "").replace("\\", "").replace("/", "").replace("?", "").replace("*", "")[:31]
            df_low.to_csv(f"Discrepancy_Kurang70_{safe_group}.csv", index=False)

if __name__ == "__main__":
    main()
