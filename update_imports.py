import re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update import line to include all new modular functions
old_import = "import { generatePPTX, generateSosialisasiPPTX } from './utils/pptxExport';"
new_import = "import { generateExecutivePPTX, generateAuditPPTX, generatePendingPPTX, generateKpiCoderPPTX, generateSosialisasiPPTX } from './utils/pptxExport';"
text = text.replace(old_import, new_import)

# 2. Fix handleExportPPT to use generateExecutivePPTX
old_handler = "await generatePPTX(dashData, activeExclusionCodes, auditVerdicts);"
new_handler = "await generateExecutivePPTX(dashData);"
text = text.replace(old_handler, new_handler)

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Updated imports and handleExportPPT!')
