import sys, re

with open('src/utils/pptxExport.js', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add Bar Chart to Top 10 Loss
target_loss_table = r"slideLoss\.addTable\(tableRows, \{ x: 0\.5, y: 1\.5, w: 9\.0, colW: \[0\.4, 1\.6, 2\.0, 1\.2, 1\.2, 1\.2, 1\.4\] \}\);"
repl_loss_table = """slideLoss.addTable(tableRows, { x: 0.5, y: 1.5, w: 4.5, colW: [0.3, 0.9, 0.8, 0.9, 0.8, 0.8] });

      const chartData = [
        {
          name: "Selisih Loss (Rp)",
          labels: losses.map(c => String(c.inacbg || '-')),
          values: losses.map(c => Math.abs(c.selisih))
        }
      ];
      slideLoss.addChart(pptx.ChartType.bar, chartData, { x: 5.2, y: 1.5, w: 4.5, h: 3.5, barDir: 'bar', showLegend: false, dataLabelColor: '000000', showValue: true, valAxisHidden: true, catAxisLabelColor: '333333', chartColors: ['e11d48'] });
"""

text = re.sub(target_loss_table, repl_loss_table, text)

# Table Rows in Top 10 Loss needs to be narrower, remove Nama Pasien to fit bar chart
target_loss_headers = r"\{ text: \"Nama Pasien\", options: tableHeaderProps \},\n"
text = re.sub(target_loss_headers, "", text)
target_loss_row_nama = r"\{ text: c\.nama \|\| \"\-\", options: tableCellProps \},\n"
text = re.sub(target_loss_row_nama, "", text)

# 2. Add Pie Chart to Audit
target_audit_table = r"slideAuditSum\.addText\(Skor Akurasi Koder: \$\{accuracy\}%, \{ x: 0\.5, y: 3\.4, w: 4, fontSize: 18, bold: true, color: \"0d9488\" \}\);"
repl_audit_table = """slideAuditSum.addText(Skor Akurasi Koder: %, { x: 0.5, y: 3.4, w: 4, fontSize: 18, bold: true, color: "0d9488" });

    const auditChartData = [
      {
        name: "Hasil Audit",
        labels: ["Sesuai", "Tidak Sesuai", "Belum Review"],
        values: [sesuai, tidakSesuai, belum]
      }
    ];
    slideAuditSum.addChart(pptx.ChartType.pie, auditChartData, { x: 5.0, y: 1.0, w: 4.5, h: 4.0, showLegend: true, legendPos: 'b', showValue: true, showPercent: true, chartColors: ['059669', 'e11d48', '94a3b8'] });
"""
text = re.sub(target_audit_table, repl_audit_table, text)

# 3. Add Doughnut Chart to Pending SAKTI
target_pending_table = r"slidePS\.addText\(- Belum Teridentifikasi: \$\{belumReview\}, \{ x: 0\.5, y: 2\.8, w: 4, fontSize: 14, color: \"64748b\" \}\);"
repl_pending_table = """slidePS.addText(- Belum Teridentifikasi: , { x: 0.5, y: 2.8, w: 4, fontSize: 14, color: "64748b" });

    const pendingChartData = [
      {
        name: "Penyebab Pending",
        labels: ["Internal RS", "Eksternal BPJS", "Belum Review"],
        values: [internal, eksternal, belumReview]
      }
    ];
    slidePS.addChart(pptx.ChartType.doughnut, pendingChartData, { x: 5.0, y: 1.0, w: 4.5, h: 4.0, showLegend: true, legendPos: 'b', showValue: true, holeSize: 50, chartColors: ['e11d48', '0284c7', '94a3b8'] });
"""
text = re.sub(target_pending_table, repl_pending_table, text)


# Write back
with open('src/utils/pptxExport.js', 'w', encoding='utf-8') as f:
    f.write(text)
print('Patched PPTX with Charts!')
