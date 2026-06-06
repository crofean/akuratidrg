import sys, re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

target1 = r"<Download size=\{16\} /> Export Excel"
repl1 = r"<Download size={16} /> {exportText || 'Export Excel'}"
text = re.sub(target1, repl1, text)

target2 = r"<SectionHeader icon=\{PieChart\} title=\"Executive Dashboard\" desc=\"Ringkasan eksekutif klaim klinis dan analisis profitabilitas\.\" colorClass=\"bg-teal-50 text-teal-600\" highlightClass=\"bg-teal-500/5\" printAction=\{\(\) => window\.print\(\)\} />"
repl2 = r"<SectionHeader icon={PieChart} title=\"Executive Dashboard\" desc=\"Ringkasan eksekutif klaim klinis dan analisis profitabilitas.\" colorClass=\"bg-teal-50 text-teal-600\" highlightClass=\"bg-teal-500/5\" printAction={() => window.print()} exportAction={handleExportPPT} exportText={isExportingPPT ? 'Mengekspor PPT...' : 'Export PPTX'} />"
text = text.replace('<SectionHeader icon={PieChart} title="Executive Dashboard" desc="Ringkasan eksekutif klaim klinis dan analisis profitabilitas." colorClass="bg-teal-50 text-teal-600" highlightClass="bg-teal-500/5" printAction={() => window.print()} />', 
                     '<SectionHeader icon={PieChart} title="Executive Dashboard" desc="Ringkasan eksekutif klaim klinis dan analisis profitabilitas." colorClass="bg-teal-50 text-teal-600" highlightClass="bg-teal-500/5" printAction={() => window.print()} exportAction={handleExportPPT} exportText={isExportingPPT ? "Mengekspor PPT..." : "Export PPTX"} />')

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Patched SectionHeader successfully!')
