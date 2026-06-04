import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()
    lines = text.split('\n')

# ---- 1. Add Export PPTX button to Audit SectionHeader ----
# Find the Audit SectionHeader closing />
# Pattern: ends with `}} />` after exportAction for audit
audit_target = '          exportToXlsx(\'Audit_Log\', [\'Rule ID\', \'Case\', \'Warning\', \'MRN\', \'SEP\', \'Diaglist\', \'Proclist\', \'Verdict\'], csv);\n        }} />'
audit_repl   = '          exportToXlsx(\'Audit_Log\', [\'Rule ID\', \'Case\', \'Warning\', \'MRN\', \'SEP\', \'Diaglist\', \'Proclist\', \'Verdict\'], csv);\n        }}\n        pptAction={() => generateAuditPPTX(dashData, auditVerdicts)}\n        pptText="Export PPTX" />'
text = text.replace(audit_target, audit_repl)

# ---- 2. Add Export PPTX button to KPI Coder SectionHeader ----
kpi_target = "          exportToXlsx('KPI_Coder', ['Coder ID', 'Total Kasus', 'Discrepancy', 'Audit Flag (Raw)', 'Verified Sesuai', 'Verified Tidak Sesuai', 'Audit Flag (Adju"
# We need to find the full line; let's use a broader search
for i, l in enumerate(lines):
    if "exportToXlsx('KPI_Coder'" in l:
        print(f"KPI Coder export line: {i+1}")
        print(repr(l))
        break

print('Done.')
