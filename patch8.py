import sys, re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = "const [isAnalyzing, setIsAnalyzing] = useState(false);"
repl = """const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleExportPPT = async () => {
    if (!dashData) return;
    setIsExportingPPT(true);
    try {
      await generatePPTX(dashData, activeExclusionCodes, auditVerdicts);
    } catch (e) {
      console.error('Gagal export PPTX:', e);
      alert('Terjadi kesalahan saat mengekspor ke PPTX.');
    } finally {
      setIsExportingPPT(false);
    }
  };
"""

text = text.replace(target, repl)

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Added handleExportPPT successfully!')
