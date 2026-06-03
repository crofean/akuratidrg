import sys

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = "ina: kSumINA, selisih: kSelisihIna"
repl = "ina: kSumIna, selisih: kSelisihIna"
text = text.replace(target, repl)

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Fixed kSumIna typo!')
