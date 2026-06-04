with open('src/utils/pptxExport.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix 1: addTableSlide - remove margin as array (causes issues with autoPage), use number instead
old_helper = '  const tableOpts = { x: 0.35, y: 1.25, w: 9.3, colW, autoPage: true, autoPageRepeatHeader: true, margin: [2,3,2,3], ...opts };'
new_helper = '  const tableOpts = { x: 0.35, y: 1.25, w: 9.3, colW, autoPage: true, autoPageRepeatHeader: true, margin: 0.05, ...opts };'
text = text.replace(old_helper, new_helper)

# Fix 2: tableCellProps - remove margin from cell props too (handled at table level)
old_cell = "  tableCellProps:   { fontFace: \"Arial\", fontSize: 8.5, valign: \"middle\", border: { pt: 0.5, color: \"e2e8f0\" }, margin: [2,2,2,2] },"
new_cell = '  tableCellProps:   { fontFace: "Arial", fontSize: 8.5, valign: "middle", border: { pt: 0.5, color: "e2e8f0" } },'
text = text.replace(old_cell, new_cell)

# Fix 3: naikKelas - uses 'awal'/'akhir' not 'hak'/'rawat'
old_naik = '''    const rows = [[
      { text: "No", options: tableHeaderProps },
      { text: "Hak Kelas", options: tableHeaderProps },
      { text: "Kelas Rawat", options: tableHeaderProps },
      { text: "Vol Kasus", options: tableHeaderProps },
      { text: "Total Selisih Nilai", options: tableHeaderProps },
    ]];
    naikKelas.forEach((c, i) => rows.push([
      { text: String(i+1), options: { ...tableCellProps, align: "center" } },
      { text: String(c.hak || '-'), options: { ...tableCellProps, align: "center", bold: true } },
      { text: String(c.rawat || '-'), options: { ...tableCellProps, align: "center", bold: true, color: "0284c7" } },
      { text: String(c.count || 0), options: { ...tableCellProps, align: "center" } },
      { text: formatRp(c.totalNilai), options: { ...tableCellProps, align: "right", bold: true } },
    ]));
    addTableSlide(pptx, "Monitor Naik Kelas Rawat", "Pergeseran hak kelas perawatan pasien", rows, [0.4, 1.6, 1.6, 1.2, 4.5]);'''

new_naik = '''    const rows = [[
      { text: "No", options: tableHeaderProps },
      { text: "Hak Kelas", options: tableHeaderProps },
      { text: "Kelas Rawat", options: tableHeaderProps },
      { text: "Pembayar", options: tableHeaderProps },
      { text: "Vol Kasus", options: tableHeaderProps },
      { text: "Total Nilai", options: tableHeaderProps },
    ]];
    naikKelas.forEach((c, i) => rows.push([
      { text: String(i+1), options: { ...tableCellProps, align: "center" } },
      { text: String(c.awal || c.hak || '-'), options: { ...tableCellProps, align: "center", bold: true } },
      { text: String(c.akhir || c.rawat || '-'), options: { ...tableCellProps, align: "center", bold: true, color: "0284c7" } },
      { text: String(c.pembayar || '-'), options: { ...tableCellProps, align: "center" } },
      { text: String(c.count || 0), options: { ...tableCellProps, align: "center" } },
      { text: formatRp(c.totalNilai), options: { ...tableCellProps, align: "right", bold: true } },
    ]));
    addTableSlide(pptx, "Monitor Naik Kelas Rawat", "Pergeseran hak kelas perawatan pasien", rows, [0.35, 1.4, 1.4, 1.4, 0.9, 3.8]);'''

text = text.replace(old_naik, new_naik)

# Fix 4: topUp table - fix column widths to sum exactly to 9.3
old_topup_cols = '    addTableSlide(pptx, "Potensi Top-Up Severity Level", subText, rows, [0.4, 5.2, 1.4, 2.3]);'
new_topup_cols = '    addTableSlide(pptx, "Potensi Top-Up Severity Level", subText, rows, [0.4, 5.0, 1.4, 2.5]);'
text = text.replace(old_topup_cols, new_topup_cols)

# Fix 5: KPI Coder table column widths sum to 9.3
old_kpi_cols = '    addTableSlide(pptx, "KPI & Kinerja Coder", `${coders.length} coder terdaftar`, rows, [0.4, 3.0, 1.4, 2.15, 2.35]);'
new_kpi_cols = '    addTableSlide(pptx, "KPI & Kinerja Coder", `${coders.length} coder terdaftar`, rows, [0.4, 2.8, 1.4, 2.35, 2.35]);'
text = text.replace(old_kpi_cols, new_kpi_cols)

# Fix 6: Pending SAKTI detail table column widths sum to 9.3
old_pending_cols = '    addTableSlide(pptx, "Detail Daftar Pending SAKTI", `${pending.length} kasus`, rows, [0.35, 1.1, 1.5, 2.6, 1.4, 2.35]);'
new_pending_cols = '    addTableSlide(pptx, "Detail Daftar Pending SAKTI", `${pending.length} kasus`, rows, [0.35, 1.2, 1.5, 2.5, 1.4, 2.35]);'
text = text.replace(old_pending_cols, new_pending_cols)

# Fix 7: Sosialisasi Top Up table column widths
old_sos_cols = '    addTableSlide(pptx, "Potensi Top-Up (Severity Level) - KSM " + ksmName, "Rekomendasi peningkatan severity level berdasarkan klinis", rows, [0.4, 5.5, 1.3, 2.1]);'
new_sos_cols = '    addTableSlide(pptx, "Potensi Top-Up (Severity Level) - KSM " + ksmName, "Rekomendasi peningkatan severity level berdasarkan klinis", rows, [0.4, 5.3, 1.2, 2.4]);'
text = text.replace(old_sos_cols, new_sos_cols)

# Fix 8: Sosialisasi Diagnosa slides column widths
old_diag_col = '    addTableSlide(pptx, "Top 10 Diagnosa Utama - KSM " + ksmName, "Berdasarkan frekuensi kasus", rows, [0.4, 1.5, 5.8, 1.6]);'
new_diag_col = '    addTableSlide(pptx, "Top 10 Diagnosa Utama - KSM " + ksmName, "Berdasarkan frekuensi kasus", rows, [0.4, 1.5, 5.9, 1.5]);'
text = text.replace(old_diag_col, new_diag_col)

old_sek_col = '    addTableSlide(pptx, "Top 10 Diagnosa Sekunder - KSM " + ksmName, "Berdasarkan frekuensi kemunculan sebagai penyerta", rows, [0.4, 1.5, 5.8, 1.6]);'
new_sek_col = '    addTableSlide(pptx, "Top 10 Diagnosa Sekunder - KSM " + ksmName, "Berdasarkan frekuensi kemunculan sebagai penyerta", rows, [0.4, 1.5, 5.9, 1.5]);'
text = text.replace(old_sek_col, new_sek_col)

old_proc_col = '    addTableSlide(pptx, "Top 10 Prosedur / Tindakan - KSM " + ksmName, "Berdasarkan frekuensi tindakan medis", rows, [0.4, 1.5, 5.8, 1.6]);'
new_proc_col = '    addTableSlide(pptx, "Top 10 Prosedur / Tindakan - KSM " + ksmName, "Berdasarkan frekuensi tindakan medis", rows, [0.4, 1.5, 5.9, 1.5]);'
text = text.replace(old_proc_col, new_proc_col)

with open('src/utils/pptxExport.js', 'w', encoding='utf-8') as f:
    f.write(text)
print('Fixed all table issues!')
