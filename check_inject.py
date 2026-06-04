import re

with open('src/utils/pptxExport.js', 'r', encoding='utf-8') as f:
    text = f.read()
    lines = text.split('\n')

# Find where the extra (non-executive) slides were injected - starting at "TOP 10 KSM DEFISIT"
# and find end of generatePPTX
start_inject = None
end_inject = None
for i, l in enumerate(lines):
    if '// SLIDE: TOP 10 KSM DEFISIT' in l and start_inject is None:
        # Find the comment line before this (the blank line + original comment)
        start_inject = i - 2  # include blank line before
    if '// Auto-paginating table for findings' in l and start_inject is not None:
        end_inject = i
        break

print(f'start_inject={start_inject}, end_inject={end_inject}')
if start_inject is not None:
    for j in range(start_inject, start_inject+5):
        print(f'Line {j+1}: {lines[j]}')
    print('...')
    for j in range(end_inject-2, end_inject+3):
        print(f'Line {j+1}: {lines[j]}')
