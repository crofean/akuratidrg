import os
import json
import pandas as pd
import glob
from collections import defaultdict

def check_match_list(arr_ina, arr_idrg, exclusions):
    clean_ina = list(set([str(c).strip().upper() for c in arr_ina if c and str(c).strip() != '-']))
    clean_idrg = list(set([str(c).strip().upper() for c in arr_idrg if c and str(c).strip() != '-' and str(c).strip().upper() not in exclusions]))
    
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
    data_dir = r"C:\Users\User\Downloads\SENTRAMEDIKA\TXT"
    txt_files = glob.glob(os.path.join(data_dir, "*.txt"))
    
    with open('audit_rules.json', 'r', encoding='utf-8') as f:
        audit_rules = json.load(f)
        
    results = defaultdict(lambda: {"discrepancy": [], "audit": []})
    
    # Map to infer hospital name from filename based on prefix
    rs_map = {}
    
    for file_path in txt_files:
        filename = os.path.basename(file_path)
        print(f"Processing {filename}...")
        try:
            # Read TSV
            df = pd.read_csv(file_path, sep='\t', dtype=str)
        except Exception as e:
            print(f"Failed to read {filename}: {e}")
            continue
            
        # Standardize columns
        df.columns = [c.strip().upper() for c in df.columns]
        
        for idx, row in df.iterrows():
            kode_rs = str(row.get('KODE_RS', 'UNKNOWN')).strip()
            if kode_rs not in rs_map:
                # Infer name from filename prefix (e.g. Cibinong_ RI_April.txt -> Cibinong)
                name = filename.split('_')[0].strip()
                rs_map[kode_rs] = f"{kode_rs} - {name}"
                
            group_key = rs_map[kode_rs]
            
            # Extract lists
            diaglist = str(row.get('DIAGLIST', '')).split(';')
            proclist = str(row.get('PROCLIST', '')).split(';')
            
            # Extract iDRG from JSON if missing
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
            
            d_list = [d.strip() for d in diaglist if d.strip()]
            p_list = [p.strip() for p in proclist if p.strip() and p.strip() != '-' and p.strip().lower() != 'none']
            idrg_d_list = [d.strip() for d in idrg_diaglist if d.strip()]
            idrg_p_list = [p.strip() for p in idrg_proclist if p.strip() and p.strip() != '-' and p.strip().lower() != 'none']
            
            s_diag = check_match_list(d_list, idrg_d_list, ['KG', 'HL', 'NL', 'KND', 'G89', 'U82', 'U83', 'U84'])
            s_proc = check_match_list(p_list, idrg_p_list, ['99.290'])
            
            # Discrepancy logic
            if s_diag < 100 or s_proc < 100:
                results[group_key]["discrepancy"].append({
                    "KODE_RS": kode_rs,
                    "NAMA_PASIEN": row.get('NAMA_PASIEN', ''),
                    "MRN": row.get('MRN', ''),
                    "SEP": row.get('SEP', ''),
                    "INACBG": row.get('INACBG', ''),
                    "DESKRIPSI INACBG": row.get('DESKRIPSI_INACBG', ''),
                    "iDRG CODE": idrg_code_str,
                    "iDRG DESKRIPSI": idrg_desc_str,
                    "DIAG INACBG": ';'.join(d_list),
                    "PROC INACBG": ';'.join(p_list),
                    "DIAG iDRG": ';'.join(idrg_d_list),
                    "PROC iDRG": ';'.join(idrg_p_list),
                    "SCORE DIAG": s_diag,
                    "SCORE PROC": s_proc
                })
                
            # Audit logic
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
                elif "codes" in condition:
                    matched = any(any(ac.startswith(c) for ac in ac_row) for c in condition.get("codes", []))
                    
                if matched:
                    results[group_key]["audit"].append({
                        "KODE_RS": kode_rs,
                        "NAMA_PASIEN": row.get('NAMA_PASIEN', ''),
                        "MRN": row.get('MRN', ''),
                        "SEP": row.get('SEP', ''),
                        "INACBG": row.get('INACBG', ''),
                        "DIAGLIST": ';'.join(d_list),
                        "PROCLIST": ';'.join(p_list),
                        "AUDIT ID": ru.get("id", ""),
                        "AUDIT CASE": ru.get("case", ""),
                        "WARNING": ru.get("validation_action", {}).get("warning_message", ""),
                        "TARIF RS": row.get('TARIF_RS', '') or row.get('TOTAL_TARIF_RS', ''),
                        "TARIF INACBG": row.get('TOTAL_TARIF', '')
                    })

    # Generate CSV
    print("Writing to CSV...")
    for group, data in results.items():
        safe_group = group.replace(":", "").replace("\\", "").replace("/", "").replace("?", "").replace("*", "")[:31]
        
        df_disc = pd.DataFrame(data["discrepancy"])
        if not df_disc.empty:
            df_disc.to_csv(f"Discrepancy_{safe_group}.csv", index=False)
            
        df_aud = pd.DataFrame(data["audit"])
        if not df_aud.empty:
            df_aud.to_csv(f"Audit_{safe_group}.csv", index=False)
            
    print("Done! Files saved as CSVs.")

if __name__ == "__main__":
    main()
