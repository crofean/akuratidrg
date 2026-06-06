import pandas as pd
import glob
import os
from collections import defaultdict

def create_excel_per_rs(prefix, output_prefix):
    files = glob.glob(f'{prefix}_*.csv')
    rs_data = defaultdict(list)
    
    for f in files:
        df = pd.read_csv(f)
        base = os.path.basename(f).replace(f'{prefix}_', '').replace('.csv', '')
        parts = base.split(' - ')
        
        rs_name = 'UNKNOWN'
        bulan = 'UNKNOWN'
        if len(parts) >= 2:
            rs_name = parts[1].strip()
        if len(parts) >= 3:
            bulan = parts[2].strip()
            
        df.insert(0, 'Bulan', bulan)
        rs_data[rs_name].append(df)
        
    for rs, dfs in rs_data.items():
        master_df = pd.concat(dfs, ignore_index=True)
        out_name_excel = f'{output_prefix}_{rs}.xlsx'
        out_name_csv = f'{output_prefix}_{rs}.csv'
        with pd.ExcelWriter(out_name_excel, engine='openpyxl') as writer:
            master_df.to_excel(writer, sheet_name='Semua Data', index=False)
        master_df.to_csv(out_name_csv, index=False)
        print(f'Created {out_name_excel} and {out_name_csv}')

create_excel_per_rs('Audit_NEW', 'Laporan_Audit')
create_excel_per_rs('Discrepancy_NEW', 'Laporan_Discrepancy')
