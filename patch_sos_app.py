import sys, re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = r"""      const topUpPotentials = recommendations\.filter\(r => r\.type === 'TopUp'\)\.map\(r => \(\{
        oldCbg: r\.code, newCbg: 'Optimal', kriteria: r\.recommendation, delta: r\.impact
      \}\)\);"""

repl = r"""      const topUpPotentials = recommendations.filter(r => r.type === 'TopUp').map(r => ({
        oldCbg: r.code, newCbg: 'Optimal', kriteria: r.recommendation, delta: r.impact
      }));

      // Compute Top 10 Clinical Info
      const tDiag = {}; const tSec = {}; const tProc = {};
      ksmRows.forEach(r => {
        // Utama
        let code = String(r.DIAGNOSA || r.DIAGUTAMA || '').trim();
        if (!code || code === '-' || code.toLowerCase() === 'none') {
          const dList = String(r.DIAGLIST || '').replace(/"/g, '').split(';').map(d => d.trim()).filter(Boolean);
          if (dList.length > 0) code = dList[0];
        }
        if (code && code !== '-' && code.toLowerCase() !== 'none') {
          tDiag[code] = (tDiag[code] || 0) + 1;
        }

        // Sekunder
        let secList = [];
        const dl = String(r.DIAGLIST || '').replace(/"/g, '').split(';').map(d => d.trim()).filter(Boolean);
        if (dl.length > 1) secList = dl.slice(1);
        secList.forEach(s => {
          if (s && s !== '-') tSec[s] = (tSec[s] || 0) + 1;
        });

        // Proc
        let prList = String(r.PROCLIST || '').replace(/"/g, '').split(';').map(p => p.trim()).filter(Boolean);
        prList.forEach(p => {
          if (p && p !== '-') tProc[p] = (tProc[p] || 0) + 1;
        });
      });

      const mapToTop10 = (mapObj) => Object.entries(mapObj).sort((a,b) => b[1] - a[1]).slice(0,10).map(x => ({ code: x[0], count: x[1], desc: getIcdDescription(x[0]) || '-' }));
      const topDiag = mapToTop10(tDiag);
      const topSec = mapToTop10(tSec);
      const topProc = mapToTop10(tProc);
"""
text = re.sub(target, repl, text)

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
print('Patched App.jsx for Top Clinical!')
