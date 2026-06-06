import json

with open("audit_rules.json", "r", encoding="utf-8") as f:
    rules = json.load(f)

new_rules = [
  {
    "id": "AUDIT-COD-61",
    "case": "AMI dan CHF (Kondisi Akut)",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [
        {
          "operator": "OR",
          "codes": [
            "I21.0"
          ]
        },
        {
          "operator": "OR",
          "codes": [
            "I50.0"
          ]
        }
      ]
    },
    "validation_action": {
      "warning_message": "AMI adalah kondisi akut yang dapat menyebabkan gagal jantung krn kerusakan otot jantung. CHF merupakan bagian dari manifestasi AMI --> diagnosa yg menjadi bagian diagnosa utama tidak dapat dikoding terpisah. Sesuai hasil TKMKB tahun 2020 CHF pada kasus AMI tidak perlu untuk dikoding terpisah."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-62",
    "case": "Injeksi Intraartikular (81.92)",
    "category": "Coding Audit",
    "condition": {
      "type": "simple",
      "operator": "OR",
      "codes": [
        "81.92"
      ]
    },
    "validation_action": {
      "warning_message": "⚠️ WARNING KLAIM KODE 81.92 (Injeksi Intraartikular) Rekomendasi TKMKB Tahun 2020⚠️\n1. CEK STATUS RAWAT (RAJAL VS RANAP)\nDefault tindakan ini adalah Rawat Jalan\n.\nBoleh Rawat Inap HANYA JIKA tertulis di rekam medis: Nyeri hebat (Skala VAS ≥ 7) yang membatasi pergerakan dan tidak mempan obat anti nyeri oral, atau ada nyeri lokal sementara pasca-injeksi\n.\n2. CEK OBAT FARMASI & INTERVAL WAKTU\nSteroid: Wajib berjarak minimal 3-4 bulan dari suntikan sebelumnya (untuk mencegah osteoporosis)\n.\nAsam Hialuronat: Batas maksimalnya 1x/minggu (selama 5 minggu berturut-turut) ATAU 1x/6 bulan\n.\nLidocain Murni: DITOLAK jika diresepkan sebagai terapi tunggal (lidocain hanya boleh untuk menyertai terapi utama)\n.\n3. CEK KOMPETENSI DOKTER (DPJP)\nTindakan HANYA SAH jika dikerjakan oleh DPJP (Spesialis Neurologi, Orthopedi, Rheumatologi, Anestesi, atau Rehabilitasi Medik) yang wajib melampirkan Sertifikat Kompetensi Tambahan (SKT)."
    },
    "PTD": "1/2"
  }
]

rules.extend(new_rules)

with open("audit_rules.json", "w", encoding="utf-8") as f:
    json.dump(rules, f, indent=2, ensure_ascii=False)
