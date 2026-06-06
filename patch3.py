import sys, re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update maps.coder initialization
target1 = r"(const cId = rawCoderId.*?)if \(!maps\.coder\[cId\]\) maps\.coder\[cId\] = \{ id: cId"
replacement1 = r"\g<1>if (!maps.coder[cId]) maps.coder[cId] = { id: maskName(cId), rawId: cId"

# 2. Update maps.audit.push
target2 = r"coderId:\s*cId,"
replacement2 = r"coderId: maskName(cId),"

text = re.sub(target1, replacement1, text, flags=re.DOTALL)
text = re.sub(target2, replacement2, text)

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Patched successfully!')
