import sys, re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = r"const \[isSlideMode, setIsSlideMode\] = useState\(false\);"
repl = """const [isSlideMode, setIsSlideMode] = useState(false);
  const [isExportingSosPPT, setIsExportingSosPPT] = useState(false);"""
text = re.sub(target, repl, text)

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Re-added isExportingSosPPT to App component!')
