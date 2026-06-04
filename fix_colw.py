with open('src/utils/pptxExport.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix naik kelas colW to sum to exactly 9.3
old = '    addTableSlide(pptx, "Monitor Naik Kelas Rawat", "Pergeseran hak kelas perawatan pasien", rows, [0.35, 1.4, 1.4, 1.4, 0.9, 3.8]);'
new = '    addTableSlide(pptx, "Monitor Naik Kelas Rawat", "Pergeseran hak kelas perawatan pasien", rows, [0.35, 1.45, 1.45, 1.45, 0.9, 3.7]);'
text = text.replace(old, new)

# Also fix KPI Coder colW to sum to 9.3 (currently 0.4+2.8+1.4+2.35+2.35=9.3 OK)
# The Audit SectionHeader colW is addTableSlide which is OK

with open('src/utils/pptxExport.js', 'w', encoding='utf-8') as f:
    f.write(text)

# Verify
import re
text2 = open('src/utils/pptxExport.js', encoding='utf-8').read()
matches = re.findall(r'addTableSlide\([^,]+,[^,]+,[^,]+, rows, \[([^\]]+)\]', text2)
for m in matches:
    nums = [float(x.strip()) for x in m.split(',')]
    total = sum(nums)
    status = 'OK' if abs(total - 9.3) < 0.05 else 'MISMATCH'
    print(f'  {total:.2f} {status}  [{m}]')
