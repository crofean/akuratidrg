import pandas as pd
df = pd.read_csv(r'C:\Users\User\Downloads\SENTRAMEDIKA\TXT\Cikarang_RJ_APRIL.txt', sep='\t', dtype=str, nrows=5)
row = df.iloc[0]
for k, v in row.items():
    if isinstance(v, str) and '"idrg":' in v:
        payload_idx = v.find('{')
        print(repr(v[payload_idx:]))
