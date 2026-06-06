import pandas as pd
import json

df = pd.read_csv(r'C:\Users\User\Downloads\SENTRAMEDIKA\TXT\Cikarang_RJ_APRIL.txt', sep='\t', dtype=str, nrows=5)
row = df.iloc[0]

idrg_diaglist_str = str(row.get('IDRG_DIAG_LISTS', ''))
if not idrg_diaglist_str or idrg_diaglist_str.lower() == 'nan':
    for k, v in row.items():
        if isinstance(v, str) and '"idrg":' in v:
            payload_idx = v.find('{')
            if payload_idx >= 0:
                p_data = json.loads(v[payload_idx:].replace('""', '"'))
                if 'idrg' in p_data:
                    idrg_diaglist_str = p_data['idrg'].get('diag_lists', '')
                    idrg_proclist_str = p_data['idrg'].get('proc_lists', '')
                    print('EXTRACTED DIAG:', idrg_diaglist_str)
                    print('EXTRACTED PROC:', idrg_proclist_str)

def check_match_list(arr_ina, arr_idrg, exclusions):
    clean_ina = list(set([str(c).strip().upper() for c in arr_ina if c and str(c).strip() != '-']))
    clean_idrg = list(set([str(c).strip().upper() for c in arr_idrg if c and str(c).strip() != '-' and str(c).strip().upper() not in exclusions]))
    
    print('clean_ina:', clean_ina)
    print('clean_idrg:', clean_idrg)

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

d_list = [d.strip() for d in str(row.get('DIAGLIST', '')).split(';') if d.strip()]
idrg_d_list = [d.strip() for d in idrg_diaglist_str.split(';') if d.strip()]

score = check_match_list(d_list, idrg_d_list, ['KG', 'HL', 'NL', 'KND', 'G89', 'U82', 'U83', 'U84'])
print('Score:', score)
