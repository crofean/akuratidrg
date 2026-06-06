import sys, re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

target_csv1 = r"headers = \['No', 'SEP', 'Tgl Masuk', 'Tgl Keluar', 'Rule ID', 'Temuan', 'Warning', 'Verdict'\];"
repl_csv1 = r"headers = ['No', 'SEP', 'Tgl Masuk', 'Tgl Keluar', 'Rule ID', 'Temuan', 'Warning', 'Diaglist', 'Proclist', 'Verdict'];"
text = text.replace(target_csv1, repl_csv1)

target_csv2 = r"rows = drilldown\.data\.map\(\(f, i\) => \[i \+ 1, f\.sep, f\.tglMasuk\?\.substring\(0,10\)\|\|'-', f\.tglKeluar\?\.substring\(0,10\)\|\|'-', f\.ruleId, f\.case, typeof f\.warning === 'string' \? f\.warning : 'Lihat Detail', auditVerdicts\[\\$\{f\.sep\}\|\$\{f\.ruleId\}\\] \|\| 'belum'\]\);"
repl_csv2 = r"rows = drilldown.data.map((f, i) => [i + 1, f.sep, f.tglMasuk?.substring(0,10)||'-', f.tglKeluar?.substring(0,10)||'-', f.ruleId, f.case, typeof f.warning === 'string' ? f.warning : 'Lihat Detail', f.diaglist || '-', f.proclist || '-', auditVerdicts[${f.sep}|] || 'belum']);"
text = re.sub(target_csv2, repl_csv2, text)

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Patched remaining copy function successfully!')
