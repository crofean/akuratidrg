import json
import re

with open('d:\\SAK-iDRG\\src\\App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

with open('d:\\SAK-iDRG\\mojibake_context.json', 'r', encoding='utf-8') as f:
    matches = json.load(f)

replacements = {
    'DRG -†’ INA': 'DRG → INA',
    " ? '-œ... S": " ? '✔ S",
    " ? '- Œ Terj": " ? '❌ Terj",
    "' ? '๐Ÿ“‚ Memb": "' ? '📁 Memb",
    " ? '-š™๏ธ  Memp": " ? '⚙️ Memp",
    " : '- ณ Meng": " : '🔗 Meng",
    "e)} -€ข <spa": "e)} • <spa",
    "n: '-š ๏ธ ', tx": "n: '⚠️', tx",
    "))} -€” pote": "))} — pote",
    "n: '-œ...',": "n: '✔',",
    "S)} -€” klai": "S)} — klai",
    "))} -€” eval": "))} — eval",
    "S)} -€” kodi": "S)} — kodi",
    "on: '๐Ÿ“Š', tx": "on: '📊', tx",
    "on: '๐Ÿ ฅ', tx": "on: '🏥', tx",
    "on: '๐Ÿ’ก', tx": "on: '💡', tx",
    "on: '๐Ÿ” ', tx": "on: '🔎', tx",
    "ing -€” sege": "ing — sege",
    "CBG -†’ iDRG": "CBG → iDRG",
    "DRG -†’ INA-": "DRG → INA-",
    "ipsi-€ฆ\" : \"": "ipsi…\" : \"",
    "ipsi-€ฆ\"}": "ipsi…\"}",
    "sus -€” klik": "sus — klik",
    "ggi -€” KRIT": "ggi — KRIT",
    "ggi -€” OPTI": "ggi — OPTI",
    "dah -€” WASP": "dah — WASP",
    "dah -€” MONI": "dah — MONI",
    "on: '๐Ÿ”ด', no": "on: '🔴', no",
    "on: '๐ŸŸข', no": "on: '🟢', no",
    "on: '๐ŸŸก', no": "on: '🟡', no",
    "on: '๐Ÿ”ต', no": "on: '🔵', no",
    ".5\">-š ๏ธ  Kode": ".5\">⚠️ Kode",
    ".5\">-œ... K": ".5\">✔ K",
    "men -€” Seli": "men — Seli",
    "}\">-–ถ</spa": "}\">▶</spa",
    "PJP -€” Volu": "PJP — Volu",
    "PJP -€” Seli": "PJP — Seli",
    "   >-œ“ SESU": "   >✔ SESU",
    "   >-œ- TID": "   >✖ TID",
    "al} -†’ ${r.": "al} → ${r.",
    "wal}-†’${r.a": "wal}→${r.a",
    "on: '๐Ÿ“Š', la": "on: '📊', la",
    "on: '๐Ÿ”ฌ', la": "on: '🔬', la",
    "on: '๐Ÿ’ฐ', la": "on: '💰', la",
    "on: '๐Ÿฉบ', la": "on: '🩺', la",
    "on: '๐Ÿ“ˆ', la": "on: '📈', la",
    "ium\">ยฉ 2026": "ium\">© 2026",
    "orm -€ข Keme": "orm • Keme",
    "le} -€” {dri": "le} — {dri",
    "DAL -€” INAC": "DAL — INAC",
    "BG-†’iDRG ": "BG→iDRG ",
    "iDRG-†’INACB": "iDRG→INACB",
    "DRG -†’ INAC": "DRG → INAC",
    "an> -€” {map": "an> — {map",
    "de} -†’ ${id": "de} → ${id",
    "de} -†’ ${ma": "de} → ${ma"
}

for match in matches:
    ctx = match['context']
    if ctx in replacements:
        text = text.replace(ctx, replacements[ctx])

with open('d:\\SAK-iDRG\\src\\App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

leftovers = [m.group() for line in text.split('\n') for m in re.finditer(r'[^\x00-\x7F]+', line)]
leftovers_set = set(leftovers) - set('→✔❌📁⚙️🔗•⚠️—📊🏥💡🔎…🔴🟢🟡🔵▶✖🔬💰🩺📈©')
print('Leftovers:', list(leftovers_set))
