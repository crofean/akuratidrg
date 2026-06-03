import sys, re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add it inside InsightSosialisasiComponent
target_inside = r"const allRows = dashData\?\.rawRows \|\| \[\];"
repl_inside = """const allRows = dashData?.rawRows || [];
  const [isExportingSosPPT, setIsExportingSosPPT] = React.useState(false);"""
text = re.sub(target_inside, repl_inside, text)

# 2. Remove it from line 3384 (which is inside App component)
target_outside = r"\s*const \[isExportingSosPPT, setIsExportingSosPPT\] = useState\(false\);\n"
text = re.sub(target_outside, "\n", text)

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Fixed isExportingSosPPT scoping!')
