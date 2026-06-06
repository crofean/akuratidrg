import sys, re

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

old_rule = '''{
    "id": "AUDIT-COD-60",
    "case": "CVA / Stroke Tanpa CT-Scan/MRI",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [
        { "operator": "OR", "codes": ["I60", "I61", "I62", "I63"] },
        { "operator": "NOT", "codes": ["87.03", "88.91"] }
      ]
    },
    "validation_action": {
      "warning_message": "Bukti Medis Tidak Lengkap / Upcoding: Klaim stroke akut (I60-I63) WAJIB disertai tindakan CT-Scan Kepala (87.03) atau MRI (88.91). Jika tidak ada, turunkan koding menjadi I64."
    },
    "PTD": "1/2"
  }'''

new_rule = '''{
    "id": "AUDIT-COD-60",
    "case": "Stroke Akut Tanpa Bukti Radiologi (CT Scan/MRI)",
    "category": "Coding Audit",
    "condition": {
      "type": "custom_missing",
      "requires": ["I60", "I61", "I62", "I63"],
      "missing": ["87.03", "88.91"],
      "excludes": ["Z08", "Z09", "Z09.8"]
    },
    "validation_action": {
      "warning_message": "Bukti Medis Tidak Lengkap / Upcoding: Klaim stroke akut (I60-I63) WAJIB disertai tindakan CT-Scan Kepala (87.03) atau MRI (88.91). Jika tidak ada dan BUKAN pasien kontrol (Z08/Z09), turunkan koding menjadi I64."
    },
    "PTD": "1/2"
  }'''

if old_rule in text:
    text = text.replace(old_rule, new_rule)
    with open('src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Rule patched successfully via exact string replacement!')
else:
    # Try Regex if exact match fails due to whitespace
    match = re.search(r'\{\s*"id":\s*"AUDIT-COD-60".*?"PTD":\s*"1/2"\s*\}', text, re.DOTALL)
    if match:
        text = text[:match.start()] + new_rule + text[match.end():]
        with open('src/App.jsx', 'w', encoding='utf-8') as f:
            f.write(text)
        print('Rule patched successfully via regex!')
    else:
        print('Failed to find AUDIT-COD-60')
