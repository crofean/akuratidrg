import sys, re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Update CSV export
target_csv1 = r"headers = \['No', 'SEP', 'Tgl Masuk', 'Tgl Keluar', 'Rule ID', 'Temuan', 'Warning', 'Verdict'\];"
repl_csv1 = r"headers = ['No', 'SEP', 'Tgl Masuk', 'Tgl Keluar', 'Rule ID', 'Temuan', 'Warning', 'Diaglist', 'Proclist', 'Verdict'];"
text = text.replace(target_csv1, repl_csv1)

target_csv2 = r"rows = drilldown\.data\.map\(\(f, i\) => \[i \+ 1, f\.sep, f\.tglMasuk\?\.substring\(0,10\)\|\|'-', f\.tglKeluar\?\.substring\(0,10\)\|\|'-', f\.ruleId, f\.case, typeof f\.warning === 'string' \? f\.warning : 'Lihat Detail', auditVerdicts\[\\$\{f\.sep\}\|\$\{f\.ruleId\}\\] \|\| 'belum'\]\);"
repl_csv2 = r"rows = drilldown.data.map((f, i) => [i + 1, f.sep, f.tglMasuk?.substring(0,10)||'-', f.tglKeluar?.substring(0,10)||'-', f.ruleId, f.case, typeof f.warning === 'string' ? f.warning : 'Lihat Detail', f.diaglist || '-', f.proclist || '-', auditVerdicts[${f.sep}|] || 'belum']);"
text = re.sub(target_csv2, repl_csv2, text)


# Update Table Header
target_th = r'''                            <th className="px-5 py-4 border-r border-slate-100 bg-slate-50 min-w-\[300px\]">Warning Message</th>
                            <th className="px-5 py-4 bg-white text-center">Status</th>'''
repl_th = r'''                            <th className="px-5 py-4 border-r border-slate-100 bg-slate-50 min-w-[300px]">Warning Message</th>
                            <th className="px-5 py-4 border-r border-slate-100 bg-white min-w-[150px]">Diaglist</th>
                            <th className="px-5 py-4 border-r border-slate-100 bg-slate-50 min-w-[150px]">Proclist</th>
                            <th className="px-5 py-4 bg-white text-center">Status</th>'''
text = text.replace(target_th, repl_th)


# Update Table Row
target_td = r'''                                <td className="px-5 py-3 border-r border-slate-50 text-xs text-rose-600 font-medium whitespace-normal min-w-\[300px\]">\{f\.warning\}</td>
                                <td className="px-5 py-3 text-center">'''
repl_td = r'''                                <td className="px-5 py-3 border-r border-slate-50 text-xs text-rose-600 font-medium whitespace-normal min-w-[300px]">{f.warning}</td>
                                <td className="px-5 py-3 border-r border-slate-50 text-xs text-slate-500 font-mono whitespace-normal min-w-[150px]">{f.diaglist || '-'}</td>
                                <td className="px-5 py-3 border-r border-slate-50 text-xs text-slate-500 font-mono whitespace-normal min-w-[150px]">{f.proclist || '-'}</td>
                                <td className="px-5 py-3 text-center">'''
text = re.sub(target_td, repl_td, text)

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Patched successfully!')
