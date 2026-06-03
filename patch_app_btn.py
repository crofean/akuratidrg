import sys, re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = r"const \[isSlideMode, setIsSlideMode\] = useState\(false\);"
repl = """const [isSlideMode, setIsSlideMode] = useState(false);
  const [isExportingSosPPT, setIsExportingSosPPT] = useState(false);"""
text = re.sub(target, repl, text)

# Find exportKsmSocialization and insert exportSosialisasiPPT
target2 = r"const exportKsmSocialization = \(\) => \{"
repl2 = """const exportSosialisasiPPT = async () => {
    setIsExportingSosPPT(true);
    try {
      let scatterImageBase64 = null;
      const scatterEl = document.getElementById('scatter-plot-container');
      if (scatterEl) {
        const canvas = await html2canvas(scatterEl, { scale: 2 });
        scatterImageBase64 = canvas.toDataURL('image/png');
      }

      const topCases = Object.values(scatterGroups).sort((a,b) => a.totalDefisit - b.totalDefisit).slice(0, 10).map(c => ({
        cbg: c.cbg, count: c.count, avgRs: c.avgRS, avgIna: c.avgINA, loss: c.totalDefisit
      }));

      const topUpPotentials = recommendations.filter(r => r.type === 'TopUp').map(r => ({
        oldCbg: r.code, newCbg: 'Optimal', kriteria: r.recommendation, delta: r.impact
      }));

      await generateSosialisasiPPTX({
        ksmName: selectedSocializationKsm,
        ksmStats: { kasus: ksmRows.length, ina: kSumINA, selisih: kSelisihIna, loss: deficitRows.reduce((sum, r) => sum + ((parseFloat(r.TOTAL_TARIF||0)||0) - (parseFloat(r.TARIF_RS||r.BIAYA_RS||r.TOTAL_TARIF_RS||0)||0)), 0) },
        topCases,
        topUpPotentials,
        scatterImageBase64,
        quadrantInsights: [quadrantNote, quadrantTip]
      });
    } catch (e) {
      console.error('Gagal export PPTX Sosialisasi:', e);
      alert('Terjadi kesalahan saat mengekspor ke PPTX.');
    } finally {
      setIsExportingSosPPT(false);
    }
  };

  const exportKsmSocialization = () => {"""
text = re.sub(target2, repl2, text)

target_btn = r"<Printer size=\{14\} /> Cetak Handout PDF\n\s*</button>"
repl_btn = r"""<Printer size={14} /> Cetak Handout PDF
          </button>
          <button
            onClick={exportSosialisasiPPT}
            disabled={isExportingSosPPT}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 uppercase tracking-wider"
            title="Export ke PowerPoint (PPTX)"
          >
            <Download size={14} /> {isExportingSosPPT ? 'Mengekspor...' : 'Export PPTX'}
          </button>"""
text = re.sub(target_btn, repl_btn, text)


with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Patched InsightSosialisasiComponent successfully!')
