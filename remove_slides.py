with open('src/utils/pptxExport.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remove lines 212 to 355 (0-indexed: 211 to 354) - the injected KSM/ICU/NaikKelas/TopUp slides
del lines[211:355]

# Fix indentation issue on the audit table line (was inside wrong block)
for i, l in enumerate(lines):
    if '    // Auto-paginating table for findings' in l:
        lines[i] = '  // Auto-paginating table for findings\n'
    if '    const slideAuditTable = pptx.addSlide();' in l:
        lines[i] = '  const slideAuditTable = pptx.addSlide();\n'

with open('src/utils/pptxExport.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Removed injected slides from generatePPTX!')
