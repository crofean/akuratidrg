import json
import os

file_path = r'd:\SAK-iDRG\scatter-bokeh\src\full_data.json'
if os.path.exists(file_path):
    with open(file_path, 'r') as f:
        data = json.load(f)
        if isinstance(data, list) and len(data) > 0:
            for i in range(8):
                unique_vals = sorted(list(set(str(row[i]) for row in data[:10000]))) # check first 10k rows
                print(f"Column {i} unique values (first 10k): {unique_vals[:20]}...")
        else:
            print("Data is not a list or is empty")
else:
    print(f"File not found: {file_path}")
