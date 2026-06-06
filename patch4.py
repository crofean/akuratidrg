import sys, re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = r"maps\.discrepancies\.push\(\{ rowIdx: idx, mrn: String\(r\['MRN'\] \|\| ''\), sep: String\(r\['SEP'\] \|\| ''\), diag1: dList, diag2: idrgDList, scoreDiag: sDiag, proc1: pList, proc2: idrgPList, scoreProc: sProc \}\);"
replacement = r"maps.discrepancies.push({ ...r, rowIdx: idx, mrn: String(r['MRN'] || ''), sep: String(r['SEP'] || ''), diag1: dList, diag2: idrgDList, scoreDiag: sDiag, proc1: pList, proc2: idrgPList, scoreProc: sProc });"

if re.search(target, text):
    text = re.sub(target, replacement, text)
    with open('src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Patched successfully!')
else:
    print('Failed to find target')
