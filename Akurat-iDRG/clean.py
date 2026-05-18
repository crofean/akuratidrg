import re

def clean_file():
    with open('src/App.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    replacements = {
        '—': '-',
        '→': '->',
        '▶': '>',
        '✓': 'V',
        '✕': 'X',
        '©': '(c)',
        '•': '-',
        '🔍': '[?]',
        '✅': '[V]',
        '❌': '[X]',
        '⚙️': '[*]',
        '⏳': '[...]',
        '📂': '[Dir]',
        '⚠️': '[!]',
        '️': '[!]',
        '…': '...',
        'โ': '-'
    }

    for k, v in replacements.items():
        content = content.replace(k, v)

    with open('src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Done replacing.')

if __name__ == '__main__':
    clean_file()
