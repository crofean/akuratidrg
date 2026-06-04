import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()
    lines = text.split('\n')

seen = set()
for i, l in enumerate(lines):
    if 'subTab ===' in l and i > 5000:
        m = re.findall(r"subTab === '([^']+)'", l)
        for s in m:
            if s not in seen:
                seen.add(s)
                print(f"subTab: {s}  (line {i+1})")
