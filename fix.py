import re

with open('d:\\SAK-iDRG\\src\\App_fixed.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

replacements = {
    '-€ข': '•',
    '๐Ÿ ฅ': '🏥',
    '๐Ÿ” ': '🔎',
    '-€ฆ': '…',
    '๐Ÿ”ด': '🔴',
    '๐ŸŸข': '🟢',
    '๐ŸŸก': '🟡',
    '๐Ÿ”ต': '🔵',
    '๐Ÿ”ฌ': '🔬',
    '๐Ÿ’ฐ': '💰',
    '๐Ÿฉบ': '🩺',
    'ยฉ': '©'
}

for old, new in replacements.items():
    text = text.replace(old, new)

with open('d:\\SAK-iDRG\\src\\App_fixed2.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

leftover = [line.strip() for line in text.split('\n') if re.search(r'[^\x00-\x7F]', line)]
print(f'Leftover lines: {len(leftover)}')
with open('d:\\SAK-iDRG\\leftover2.txt', 'w', encoding='utf-8') as f:
    for line in leftover:
        f.write(line + '\n')
