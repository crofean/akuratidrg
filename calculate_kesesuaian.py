import os
import glob
import pandas as pd

def main():
    data_dir = r"C:\Users\User\Downloads\SENTRAMEDIKA\TXT"
    txt_files = glob.glob(os.path.join(data_dir, "*.txt"))
    
    total_cases = {}
    
    print("Menghitung total kasus per Rumah Sakit...")
    for file_path in txt_files:
        filename = os.path.basename(file_path)
        try:
            # We only need KODE_RS, so we can use usecols to save memory and speed up
            df = pd.read_csv(file_path, sep='\t', dtype=str, usecols=['KODE_RS', 'INACBG', 'IDRG_DRG_CODE'])
        except ValueError:
            # If columns are missing, read all columns
            try:
                df = pd.read_csv(file_path, sep='\t', dtype=str)
            except Exception:
                continue
        except Exception as e:
            continue
            
        for kode_rs, count in df['KODE_RS'].value_counts().items():
            rs = str(kode_rs).strip()
            # Infer name
            name = filename.split('_')[0].strip()
            key = f"{rs} - {name}"
            
            if key not in total_cases:
                total_cases[key] = 0
            total_cases[key] += count
            
    # Now get discrepancies
    discrepancy_cases = {}
    csv_dir = r"d:\SAK-iDRG"
    disc_files = glob.glob(os.path.join(csv_dir, "Discrepancy_*.csv"))
    
    for df_path in disc_files:
        filename = os.path.basename(df_path)
        # Extract group key from filename: Discrepancy_3201230 - Cibinong.csv
        key = filename.replace("Discrepancy_", "").replace(".csv", "")
        
        try:
            # count lines without pandas
            with open(df_path, 'r', encoding='utf-8') as f:
                lines = sum(1 for line in f)
            # Subtract 1 for header
            discrepancy_cases[key] = max(0, lines - 1)
        except Exception:
            discrepancy_cases[key] = 0
            
    # Calculate kesesuaian
    print("\n--- HASIL PERHITUNGAN KESESUAIAN ---")
    print(f"{'Rumah Sakit':<30} | {'Total Kasus':<15} | {'Discrepancy':<15} | {'Sesuai':<15} | {'% Kesesuaian':<15}")
    print("-" * 100)
    
    all_total = 0
    all_disc = 0
    
    # Merge keys
    all_keys = set(list(total_cases.keys()) + list(discrepancy_cases.keys()))
    
    results = []
    for k in sorted(all_keys):
        tot = total_cases.get(k, 0)
        disc = discrepancy_cases.get(k, 0)
        
        # In case a hospital had discrepancies but wasn't in total_cases? Shouldn't happen.
        # But if tot == 0, it means something is weird.
        if tot < disc:
            tot = disc # Fallback safeguard
            
        sesuai = tot - disc
        pct = (sesuai / tot * 100) if tot > 0 else 0
        
        all_total += tot
        all_disc += disc
        
        results.append({
            "RS": k,
            "Total": tot,
            "Discrepancy": disc,
            "Sesuai": sesuai,
            "Pct": pct
        })
        
        print(f"{k:<30} | {tot:<15,d} | {disc:<15,d} | {sesuai:<15,d} | {pct:.2f}%")
        
    all_sesuai = all_total - all_disc
    all_pct = (all_sesuai / all_total * 100) if all_total > 0 else 0
    print("-" * 100)
    print(f"{'TOTAL KESELURUHAN':<30} | {all_total:<15,d} | {all_disc:<15,d} | {all_sesuai:<15,d} | {all_pct:.2f}%")

if __name__ == "__main__":
    main()
