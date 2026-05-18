import re

with open('d:\\SAK-iDRG\\src\\App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

replacements = {
    '-†’': '→',
    '-œ...': '✔',
    '- Œ': '❌',
    '๐Ÿ“‚': '📁',
    '-š™๏ธ ': '⚙️',
    '- ณ': '🔗',
    '-€ข': '•',
    '-š ๏ธ ': '⚠️',
    '-€”': '—',
    '๐Ÿ“Š': '📊',
    '๐Ÿ ฅ': '🏥',
    '๐Ÿ’ก': '💡',
    '๐Ÿ” ': '🔎',
    '-€ฆ': '…',
    '๐Ÿ”ด': '🔴',
    '๐ŸŸข': '🟢',
    '๐ŸŸก': '🟡',
    '๐Ÿ”ต': '🔵',
    '-–ถ': '▶',
    '-œ“': '✔',
    '-œ-': '✖',
    '๐Ÿ”ฌ': '🔬',
    '๐Ÿ’ฐ': '💰',
    '๐Ÿฉบ': '🩺',
    '๐Ÿ“ˆ': '📈',
    'ยฉ': '©'
}

for old, new in replacements.items():
    text = text.replace(old, new)

with open('d:\\SAK-iDRG\\src\\App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Replaced broken symbols.')
