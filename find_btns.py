import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()
    lines = text.split('\n')

# Find patterns for save/copy buttons near charts/tables
patterns = ['copyChart', 'saveChart', 'savePng', 'copyTable', 'copyMiniTable', 'CopyButton', 'copy-btn', 'absolute.*top.*right.*Download', 'absolute.*top.*right.*Copy']

for i, l in enumerate(lines):
    if ('absolute' in l and ('Download' in l or 'Copy' in l or 'copy' in l or 'save' in l) and i > 2000 and i < 12000):
        print(f'{i+1}: {l.strip()[:120]}')
