import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# ─────────────────────────────────────────────────────────────────────────────
# 1. Fix broken mapToTop10 + duplicate keys in exportSosialisasiPPT (first occurrence ~line 2701)
# ─────────────────────────────────────────────────────────────────────────────
old_broken = """      const mapToTop10 = (mapObj) => Object.entries(mapObj).sort((a,b) => b[1] - a[1]).slice(0,10).map(x => ({
      const topDiag = mapToTop10(tDiag);
      const topSec = mapToTop10(tSec);
      const topProc = mapToTop10(tProc);


      await generateSosialisasiPPTX({
        ksmName: selectedSocializationKsm,"""

new_fixed = """      const mapToTop10 = (mapObj) => Object.entries(mapObj).sort((a,b) => b[1] - a[1]).slice(0,10).map(([code, count]) => ({ code, count, desc: '-' }));
      const topDiag = mapToTop10(tDiag);
      const topSec = mapToTop10(tSec);
      const topProc = mapToTop10(tProc);

      await generateSosialisasiPPTX({
        ksmName: selectedSocializationKsm,"""

text = text.replace(old_broken, new_fixed, 1)

# ─────────────────────────────────────────────────────────────────────────────
# 2. Remove duplicate topDiag/topSec/topProc keys in the first occurrence
# ─────────────────────────────────────────────────────────────────────────────
old_dup = """        topDiag,
        topSec,
        topProc,
        topDiag,
        topSec,
        topProc
      });"""

new_dedup = """        topDiag,
        topSec,
        topProc
      });"""

text = text.replace(old_dup, new_dedup, 1)

# ─────────────────────────────────────────────────────────────────────────────
# 3. Also fix the second occurrence (renderInsightSosialisasi in App component ~line 7085)
# ─────────────────────────────────────────────────────────────────────────────
old_broken2 = """      const mapToTop10 = (mapObj) => Object.entries(mapObj).sort((a,b) => b[1] - a[1]).slice(0,10).map(x => ({ code: x[0], count: x[1], desc: getIcdDescription(x[0]) || '-' }));"""
if old_broken2 not in text:
    # Try the partial broken version
    old_broken2_partial = """      const mapToTop10 = (mapObj) => Object.entries(mapObj).sort((a,b) => b[1] - a[1]).slice(0,10).map(x => ({\n      const topDiag"""
    if old_broken2_partial in text:
        print("Found partial broken version 2 too!")

# Fix second mapToTop10 if also broken
old_broken2_v2 = """      const mapToTop10 = (mapObj) => Object.entries(mapObj).sort((a,b) => b[1] - a[1]).slice(0,10).map(x => ({
      const topDiag = mapToTop10(tDiag);
      const topSec = mapToTop10(tSec);
      const topProc = mapToTop10(tProc);


      await generateSosialisasiPPTX({"""

new_fixed2 = """      const mapToTop10 = (mapObj) => Object.entries(mapObj).sort((a,b) => b[1] - a[1]).slice(0,10).map(([code, count]) => ({ code, count, desc: getIcdDescription ? (getIcdDescription(code) || '-') : '-' }));
      const topDiag = mapToTop10(tDiag);
      const topSec = mapToTop10(tSec);
      const topProc = mapToTop10(tProc);

      await generateSosialisasiPPTX({"""

text = text.replace(old_broken2_v2, new_fixed2, 1)

# ─────────────────────────────────────────────────────────────────────────────
# 4. Re-add the Export PPTX button to InsightSosialisasiComponent (1st occurrence)
#    Find the PDF print button area near exportSosialisasiPPT 
# ─────────────────────────────────────────────────────────────────────────────
# The button was removed earlier. We need to re-add it near the Cetak Handout PDF button
# Find the "Cetak Handout PDF" button in InsightSosialisasiComponent (before line 2860)
old_pdf_btn = """          title="Cetak Handout PDF"
          >
            <Printer size={14} /> Cetak Handout PDF
          </button>
        </div>
      </div>"""

new_pdf_btn = """          title="Cetak Handout PDF"
          >
            <Printer size={14} /> Cetak Handout PDF
          </button>
          <button
            onClick={exportSosialisasiPPT}
            disabled={isExportingSosPPT}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 uppercase tracking-wider"
            title="Export ke PowerPoint (PPTX)"
          >
            <Download size={14} /> {isExportingSosPPT ? 'Mengekspor...' : 'Export PPTX'}
          </button>
        </div>
      </div>"""

if old_pdf_btn in text:
    text = text.replace(old_pdf_btn, new_pdf_btn, 1)
    print("Re-added Export PPTX button to InsightSosialisasiComponent!")
else:
    print("WARNING: Could not find PDF button area - searching for alternative anchor...")
    # Try to find where the Cetak Handout button is
    idx = text.find("Cetak Handout PDF")
    if idx >= 0:
        print(f"Found 'Cetak Handout PDF' at char index {idx}")
        print(repr(text[idx-200:idx+200]))

# ─────────────────────────────────────────────────────────────────────────────
# 5. Add Export PPTX action to KPI Coder SectionHeader
# ─────────────────────────────────────────────────────────────────────────────
old_kpi_close = """          exportToXlsx('KPI_Coder', ['Coder ID', 'Total Kasus', 'Discrepancy', 'Audit Flag (Raw)', 'Verified Sesuai', 'Verified Tidak Sesuai', 'Audit Flag (Adjusted)'], csv);
        }} />"""

new_kpi_close = """          exportToXlsx('KPI_Coder', ['Coder ID', 'Total Kasus', 'Discrepancy', 'Audit Flag (Raw)', 'Verified Sesuai', 'Verified Tidak Sesuai', 'Audit Flag (Adjusted)'], csv);
        }}
        pptAction={() => generateKpiCoderPPTX(dashData)}
        pptText="Export PPTX" />"""

if old_kpi_close in text:
    text = text.replace(old_kpi_close, new_kpi_close, 1)
    print("Added Export PPTX to KPI Coder SectionHeader!")
else:
    print("WARNING: KPI Coder SectionHeader close not found exactly!")

# ─────────────────────────────────────────────────────────────────────────────
# 6. Add Export PPTX action to Audit SectionHeader
# ─────────────────────────────────────────────────────────────────────────────
old_audit_close = """          exportToXlsx('Audit_Log', ['Rule ID', 'Case', 'Warning', 'MRN', 'SEP', 'Diaglist', 'Proclist', 'Verdict'], csv);
        }} />"""

new_audit_close = """          exportToXlsx('Audit_Log', ['Rule ID', 'Case', 'Warning', 'MRN', 'SEP', 'Diaglist', 'Proclist', 'Verdict'], csv);
        }}
        pptAction={() => generateAuditPPTX(dashData, auditVerdicts)}
        pptText="Export PPTX" />"""

if old_audit_close in text:
    text = text.replace(old_audit_close, new_audit_close, 1)
    print("Added Export PPTX to Audit SectionHeader!")
else:
    print("WARNING: Audit SectionHeader close not found exactly!")

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Done patching App.jsx!')
