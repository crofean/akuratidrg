import sys, re

with open('src/utils/pptxExport.js', 'r', encoding='utf-8') as f:
    text = f.read()

target = r"""if \(dashData && dashData\.rawRows\) \{
    const rawRows = dashData\.rawRows;
    let totalPasien = rawRows\.length;
    let totalTarifRS = 0;
    let totalTarifINA = 0;
    let totalLoss = 0;
    let totalGain = 0;
    let lossGains = \[\];"""

repl = r"""let totalPasien = 0;
  let totalTarifRS = 0;
  let totalTarifINA = 0;
  let totalLoss = 0;
  let totalGain = 0;
  let totalSelisih = 0;
  let lossGains = [];

  if (dashData && dashData.rawRows) {
    const rawRows = dashData.rawRows;
    totalPasien = rawRows.length;
"""

text = re.sub(target, repl, text)

target2 = r"""    let totalSelisih = totalTarifINA - totalTarifRS;
"""
repl2 = r"""    totalSelisih = totalTarifINA - totalTarifRS;
"""
text = text.replace(target2, repl2)

with open('src/utils/pptxExport.js', 'w', encoding='utf-8') as f:
    f.write(text)
print('Scoping fixed!')
