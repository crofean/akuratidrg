import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()
    lines = text.split('\n')

# Find all button patterns that look like action buttons inside/overlaying charts & tables
keywords = ['Salin', 'Simpan', 'savePng', 'saveChart', 'PNG', 'copyChart', 'Copy', 'handleCopy', 'handleSave']
for i, l in enumerate(lines):
    if any(k in l for k in keywords):
        if 'button' in l.lower() or 'onClick' in l:
            if i > 2000 and i < 12000:
                print(f'{i+1}: {l.strip()[:130]}')
