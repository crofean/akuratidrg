import sys, re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

target = r"""      const topUpPotentials = recommendations\.filter\(r => r\.type === 'TopUp'\)\.map\(r => \(\{
        oldCbg: r\.code, newCbg: 'Optimal', kriteria: r\.recommendation, delta: r\.impact
      \}\)\);"""

repl = r"""      const topUpPotentials = (dashData?.topUpStats?.items || []).slice(0, 10).map(r => ({
        oldCbg: r.cbg_base ? r.cbg_base.join(', ') : '-',
        newCbg: r.cbg_target || 'Optimal',
        kriteria: r.item || '-',
        delta: r.tarif || 0
      }));"""

text = re.sub(target, repl, text)

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Patched topUpPotentials!')
