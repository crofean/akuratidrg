import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# ─────────────────────────────────────────────────────────────────────────────
# Fix 1: Remove the stray useState from inside renderRekap (line ~6079)
# It was accidentally placed there by a previous patch - remove it
# ─────────────────────────────────────────────────────────────────────────────
old_stray = """  const renderRekap = () => {
    const inaList = (dashData?.inaSummary || []).slice(0, 20);
    const drgList = (dashData?.drgSummary || []).slice(0, 20);
    const allRows = dashData?.rawRows || [];
  const [isExportingSosPPT, setIsExportingSosPPT] = React.useState(false);"""

new_fixed = """  const renderRekap = () => {
    const inaList = (dashData?.inaSummary || []).slice(0, 20);
    const drgList = (dashData?.drgSummary || []).slice(0, 20);
    const allRows = dashData?.rawRows || [];"""

text = text.replace(old_stray, new_fixed)

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Fixed stray useState in renderRekap!")

# ─────────────────────────────────────────────────────────────────────────────
# Fix 2: PPT KSM uses 'name' field not 'ksm', and 'selisihIna' is correct
# Fix in pptxExport.js
# ─────────────────────────────────────────────────────────────────────────────
with open('src/utils/pptxExport.js', 'r', encoding='utf-8') as f:
    ppt = f.read()

# The KSM items have: name, selisihIna, count, sumIna, sumRS
# Fix the table row and chart to use 'name' not 'ksm'
old_ksm_row = '      { text: c.ksm || "-", options: { ...tableCellProps, bold: true } },'
new_ksm_row = '      { text: c.name || c.ksm || "-", options: { ...tableCellProps, bold: true } },'
ppt = ppt.replace(old_ksm_row, new_ksm_row)

old_ksm_chart_label = '      labels: topKsmDefisit.map(c => String(c.ksm || \'\')),'
new_ksm_chart_label = '      labels: topKsmDefisit.map(c => String(c.name || c.ksm || \'\')),'
ppt = ppt.replace(old_ksm_chart_label, new_ksm_chart_label)

# Also fix formatRp(c.selisihIna) - selisihIna is correct, already negative, abs needed for display
old_ksm_val = '      { text: formatRp(c.selisihIna), options: { ...tableCellProps, align: "right", color: "e11d48", bold: true } },'
new_ksm_val = '      { text: formatRp(Math.abs(c.selisihIna || 0)), options: { ...tableCellProps, align: "right", color: "e11d48", bold: true } },'
ppt = ppt.replace(old_ksm_val, new_ksm_val)

with open('src/utils/pptxExport.js', 'w', encoding='utf-8') as f:
    f.write(ppt)
print("Fixed KSM field names in pptxExport.js!")
