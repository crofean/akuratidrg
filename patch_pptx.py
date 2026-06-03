import sys, re

with open('src/utils/pptxExport.js', 'r', encoding='utf-8') as f:
    text = f.read()

target_dash = r"if \(dashData && dashData\.scorecard\) \{"
repl_dash = r"""if (dashData && dashData.rawRows) {
    const rawRows = dashData.rawRows;
    let totalPasien = rawRows.length;
    let totalTarifRS = 0;
    let totalTarifINA = 0;
    let totalLoss = 0;
    let totalGain = 0;
    let lossGains = [];

    rawRows.forEach(r => {
      const rs = parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
      const ina = parseFloat(r.TOTAL_TARIF || 0) || 0;
      const selisih = ina - rs;

      totalTarifRS += rs;
      totalTarifINA += ina;
      if (selisih < 0) totalLoss += selisih;
      if (selisih > 0) totalGain += selisih;

      lossGains.push({
        sep: String(r.SEP || '-'),
        nama: String(r.NAMA_PASIEN || r.NAMA_PASien || r.NAMA || '-'),
        inacbg: String(r.INACBG || '-'),
        tarifRs: rs,
        tarifIna: ina,
        selisih: selisih
      });
    });

    let totalSelisih = totalTarifINA - totalTarifRS;
"""

text = re.sub(target_dash, repl_dash, text)

target_sc_refs = [
    (r"sc\.totalPasien", r"totalPasien"),
    (r"sc\.totalSelisih", r"totalSelisih"),
    (r"sc\.totalLoss", r"totalLoss"),
    (r"sc\.totalGain", r"totalGain"),
    (r"sc\.totalTarifRS", r"totalTarifRS"),
    (r"sc\.totalTarifINA", r"totalTarifINA")
]

for t, r in target_sc_refs:
    text = re.sub(t, r, text)

target_loss = r"if \(dashData && dashData\.scorecard && dashData\.scorecard\.lossGains\) \{"
repl_loss = r"if (lossGains && lossGains.length > 0) {"
text = re.sub(target_loss, repl_loss, text)

target_loss2 = r"const losses = dashData\.scorecard\.lossGains\.filter\(c => c\.selisih < 0\)\.sort\(\(a, b\) => a\.selisih - b\.selisih\)\.slice\(0, 10\);"
repl_loss2 = r"const losses = lossGains.filter(c => c.selisih < 0).sort((a, b) => a.selisih - b.selisih).slice(0, 10);"
text = re.sub(target_loss2, repl_loss2, text)

with open('src/utils/pptxExport.js', 'w', encoding='utf-8') as f:
    f.write(text)
print('Patched pptxExport.js successfully!')
