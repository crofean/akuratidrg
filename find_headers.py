import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()
    lines = text.split('\n')

for i, l in enumerate(lines):
    if 'SectionHeader' in l and 'exportAction' in l and i > 5000 and i < 10000:
        m = re.search(r'title="([^"]+)"', l)
        if m:
            print(f"Line {i+1}: title={m.group(1)}")
