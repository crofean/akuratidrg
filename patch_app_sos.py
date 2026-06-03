import sys, re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Update Imports
target_import = r"import \{ generatePPTX \} from '\./utils/pptxExport';"
repl_import = r"import { generatePPTX, generateSosialisasiPPTX } from './utils/pptxExport';\nimport html2canvas from 'html2canvas';"
text = re.sub(target_import, repl_import, text)

# Add id to scatter plot
target_scatter = r"<ScatterChart margin=\{\{ top: 20, right: 20, bottom: 20, left: 20 \}\}>"
repl_scatter = r"<div id='scatter-plot-container' className='bg-white p-4 rounded-xl'><ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>"
text = text.replace(target_scatter, repl_scatter)

target_scatter_end = r"</ScatterChart>"
repl_scatter_end = r"</ScatterChart></div>"
text = text.replace(target_scatter_end, repl_scatter_end)


with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Patched App.jsx imports and scatter plot id!')
