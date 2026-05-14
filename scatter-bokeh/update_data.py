import pandas as pd
import os
import json

# CONFIGURATION
EXCEL_FILE = "V6_Okt-Mar 2026_Transformed_V3_updated_V2.xlsx"
SHEET_NAME = "Individual data"
OUTPUT_FILE = "src/data.json"
MAX_ROWS = 5000 # Increase this if you want more data, but it might slow down the browser

def update():
    if not os.path.exists(EXCEL_FILE):
        print(f"Error: {EXCEL_FILE} not found in this folder!")
        return

    try:
        print(f"Reading {EXCEL_FILE} [{SHEET_NAME}]...")
        df = pd.read_excel(EXCEL_FILE, sheet_name=SHEET_NAME, nrows=MAX_ROWS)
        
        # Ensure OUTPUT directory exists
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        
        print(f"Converting {len(df)} rows to JSON...")
        df.to_json(OUTPUT_FILE, orient="records")
        
        print(f"Success! Data updated in {OUTPUT_FILE}")
        print("Now you can refresh your browser to see the new data.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    update()
