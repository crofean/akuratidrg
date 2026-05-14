"""
generate_full_data.py
=====================
Script to read MULTIPLE Excel files and generate full_data.json
Each row will have an additional field [8] = source file label
so the dashboard can filter by source Excel file.

Row format:
  [0]  total_tarif_inacbg
  [1]  total_tarifrs
  [2]  jml_kasus
  [3]  regional (1-5)
  [4]  nama_rs_vertikal
  [5]  idrg_code
  [6]  ptd  (1=RI, 2=RJ)
  [7]  total_idrg_tarif  (uses total_idrg_tarif_8_v1 or fallback)
  [8]  source_file  (short label derived from filename)
"""

import pandas as pd
import os
import json
import re

# ── CONFIGURATION ────────────────────────────────────────────────────────────
# List all Excel files to include. 
# Each entry: (filename, sheet_name, label)
EXCEL_SOURCES = [
    ("V4_Jan-Des 2025_Transformed.xlsx",                  "Individual Data",  "V4 Jan-Des 2025"),
    ("V6_Okt-Mar 2026_Transformed_V3_updated_V2.xlsx",    "Individual data",  "V6 Okt-Mar 2026"),
]

OUTPUT_FILE = "src/full_data.json"

# Map regional string to integer
REGIONAL_MAP = {"reg1": 1, "reg2": 2, "reg3": 3, "reg4": 4, "reg5": 5}

def pick_idrg_tarif(row):
    """Choose the best available iDRG tarif column (priority: _8_v1 > _8 > _5_v1 > _5 > _4_v1 > _4)."""
    for col in ["total_idrg_tarif_8_v1", "total_idrg_tarif_8",
                "total_idrg_tarif_5_v1", "total_idrg_tarif_5",
                "total_idrg_tarif_4_v1", "total_idrg_tarif_4"]:
        if col in row.index:
            val = row[col]
            if pd.notna(val) and val > 0:
                return float(val)
    return 0.0

def parse_regional(val):
    if pd.isna(val):
        return 0
    s = str(val).strip().lower()
    return REGIONAL_MAP.get(s, 0)

def process_file(filepath, sheet_name, label):
    print(f"\n  Reading sheet '{sheet_name}' from: {filepath}")
    df = pd.read_excel(filepath, sheet_name=sheet_name)
    print(f"  Loaded {len(df):,} rows x {len(df.columns)} cols")

    rows = []
    for _, r in df.iterrows():
        regional = parse_regional(r.get("regional_2023", 0))
        if regional == 0:
            continue  # skip rows with unknown region

        ptd = int(r.get("ptd", 0))
        if ptd not in (1, 2):
            continue

        jml_kasus = r.get("jml_kasus", 0)
        if pd.isna(jml_kasus) or jml_kasus <= 0:
            continue

        idrg_tarif = pick_idrg_tarif(r)
        
        row = [
            float(r.get("total_tarif_inacbg", 0) or 0),
            float(r.get("total_tarifrs", 0) or 0),
            int(jml_kasus),
            regional,
            str(r.get("nama_rs_vertikal", "non_rs_vertikal") or "non_rs_vertikal"),
            str(r.get("idrg_code", "") or ""),
            ptd,
            idrg_tarif,
            label,   # ← NEW: source file label at index [8]
        ]
        rows.append(row)

    print(f"  >>> {len(rows):,} valid rows processed.")
    return rows

def main():
    all_rows = []

    for (filename, sheet, label) in EXCEL_SOURCES:
        if not os.path.exists(filename):
            print(f"  WARNING: File not found, skipping: {filename}")
            continue
        rows = process_file(filename, sheet, label)
        all_rows.extend(rows)

    print(f"\nTotal combined rows: {len(all_rows):,}")
    print(f"Writing to {OUTPUT_FILE} ...")

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_rows, f, ensure_ascii=False, separators=(',', ':'))

    size_mb = os.path.getsize(OUTPUT_FILE) / 1_048_576
    print(f"Done! File size: {size_mb:.1f} MB")

if __name__ == "__main__":
    main()
