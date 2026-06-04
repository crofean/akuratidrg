import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()
    lines = text.split('\n')

# Find maps.ksm initialization
for i, l in enumerate(lines):
    if "maps.ksm[" in l and i < 4700:
        print(f"{i+1}: {l.strip()[:130]}")

print("---")
# Find renderRekap useState on line ~6079
for i in range(6070, 6090):
    print(f"{i+1}: {lines[i][:110]}")
