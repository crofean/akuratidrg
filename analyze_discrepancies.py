import pandas as pd
from collections import Counter
import os

hospitals = [
    "3201230 - Cibinong",
    "3209144 - GEMPOL",
    "3216163 - Cikarang",
    "3276017 - Cisalak"
]

results = {}

for rs in hospitals:
    filename = f"Discrepancy_{rs}.csv"
    if not os.path.exists(filename):
        continue
    
    df = pd.read_csv(filename, dtype=str)
    
    # 1. Top INACBG vs iDRG Grouping Mismatches
    df['DRG_Mismatch'] = df['INACBG'] + " (" + df['DESKRIPSI INACBG'] + ") vs " + df['iDRG CODE'] + " (" + df['iDRG DESKRIPSI'] + ")"
    top_drg_mismatches = df['DRG_Mismatch'].value_counts().head(5)
    
    # 2. Most common differing diagnoses
    diag_mismatches = []
    for idx, row in df.iterrows():
        ina_diag = set([d.strip().upper() for d in str(row['DIAG INACBG']).split(';') if d.strip()])
        idrg_diag = set([d.strip().upper() for d in str(row['DIAG iDRG']).split(';') if d.strip()])
        
        missing_in_idrg = ina_diag - idrg_diag
        added_in_idrg = idrg_diag - ina_diag
        
        if missing_in_idrg or added_in_idrg:
            m_str = f"Hilang dari iDRG: {','.join(missing_in_idrg) if missing_in_idrg else 'None'} | Ditambahkan di iDRG: {','.join(added_in_idrg) if added_in_idrg else 'None'}"
            diag_mismatches.append(m_str)
            
    top_diag = Counter(diag_mismatches).most_common(5)
    
    results[rs] = {
        "Total_Discrepancy": len(df),
        "Top_DRG": top_drg_mismatches,
        "Top_Diag": top_diag
    }

# Print results
for rs, data in results.items():
    print(f"\\n{'='*50}")
    print(f"RUMAH SAKIT: {rs}")
    print(f"Total Kasus Discrepancy: {data['Total_Discrepancy']}")
    print(f"{'='*50}")
    print("\\nTOP 5 BEDA GROUPING (INACBG vs iDRG):")
    for k, v in data['Top_DRG'].items():
        print(f" - {v} kasus: {k}")
        
    print("\\nTOP 5 PERBEDAAN DIAGNOSA (INACBG vs iDRG):")
    for k, v in data['Top_Diag']:
        print(f" - {v} kasus: {k}")
