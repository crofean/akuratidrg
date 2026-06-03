import sys, re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = r"""      const topCases = Object\.values\(scatterGroups\)\.sort\(\(a,b\) => a\.totalDefisit - b\.totalDefisit\)\.slice\(0, 10\)\.map\(c => \(\{
        cbg: c\.cbg, count: c\.count, avgRs: c\.avgRS, avgIna: c\.avgINA, loss: c\.totalDefisit
      \}\)\);"""

repl = r"""      // Compute Top 10 INA CBG Defisit
      const tCbg = {};
      deficitRows.forEach(r => {
        let code = String(r.INACBG || r.INA_CBG || r.CBG || '-').trim();
        if (!code || code === '-') return;
        if (!tCbg[code]) {
          tCbg[code] = { cbg: code, count: 0, totalRs: 0, totalIna: 0, loss: 0 };
        }
        const rs = parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
        const ina = parseFloat(r.TOTAL_TARIF || 0) || 0;
        tCbg[code].count++;
        tCbg[code].totalRs += rs;
        tCbg[code].totalIna += ina;
        tCbg[code].loss += (ina - rs);
      });
      const topCases = Object.values(tCbg).sort((a,b) => a.loss - b.loss).slice(0, 10).map(c => ({
        cbg: c.cbg, count: c.count, avgRs: c.totalRs / c.count, avgIna: c.totalIna / c.count, loss: c.loss
      }));"""
text = re.sub(target, repl, text)

# Also fix the clinical part for the duplicate renderInsightSosialisasi if needed
target2 = r"""        topUpPotentials,
        scatterImageBase64,
        quadrantInsights: \[quadrantNote, quadrantTip\]"""
repl2 = r"""        topUpPotentials,
        scatterImageBase64,
        quadrantInsights: [quadrantNote, quadrantTip],
        topDiag,
        topSec,
        topProc"""
text = re.sub(target2, repl2, text)


with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Patched ALL topCases calculations!')
