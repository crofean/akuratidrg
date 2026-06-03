import sys, re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = r"import html2canvas from 'html2canvas';\n"
text = text.replace(target, "")

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Removed duplicate html2canvas import!')
