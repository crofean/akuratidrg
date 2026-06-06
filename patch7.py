import sys, re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Import generatePPTX
target1 = r"import \{ [a-zA-Z0-9_, ]+ \} from 'lucide-react';"
match = re.search(target1, text)
if match:
    text = text[:match.end()] + "\nimport { generatePPTX } from './utils/pptxExport';" + text[match.end():]

# Add state
target2 = r"const \[showDisclaimer, setShowDisclaimer\] = useState\(false\);"
repl2 = "const [showDisclaimer, setShowDisclaimer] = useState(false);\n  const [isExportingPPT, setIsExportingPPT] = useState(false);"
text = re.sub(target2, repl2, text)

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Patched successfully!')
