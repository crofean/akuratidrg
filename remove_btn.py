import sys, re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = r"""          <button
            onClick=\{exportSosialisasiPPT\}
            disabled=\{isExportingSosPPT\}
            className=\"bg-amber-500 hover:bg-amber-600 text-white px-4 py-2\.5 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1\.5 uppercase tracking-wider\"
            title=\"Export ke PowerPoint \(PPTX\)\"
          >
            <Download size=\{14\} /> \{isExportingSosPPT \? 'Mengekspor\.\.\.' : 'Export PPTX'\}
          </button>"""

text = re.sub(target, "", text)

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Removed Export PPTX button from Sosialisasi!')
