import React, { useState, useRef, useMemo, useEffect } from 'react';
import { UploadCloud, Folder, FileText, CheckCircle, Trash2, AlertCircle, X, BarChart3, PieChart, Activity, Layers, Search, Table2, GitMerge, FileCode, CheckSquare, AlertTriangle, Stethoscope, User, ActivitySquare, Download, TrendingUp, TrendingDown, ChevronRight, Zap, Award } from 'lucide-react';

// --- DATA CODING RULES ---
const DEFAULT_AUDIT_RULES = [
  {
    "id": "AUDIT-COD-01",
    "case": "Typhoid pada Kehamilan",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["A01.0"]}, {"operator": "OR", "codes": ["O98", "O98.8"]}]
    },
    "validation_action": {
      "warning_message": "Koreksi Koding: Jika tidak ada penyulit lain, pengkodean tifoid pada kehamilan HARUS menggunakan O98.8 sebagai Diagnosis Utama dan A01.0 sebagai Diagnosis Sekunder."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-03",
    "case": "Batu Saluran Kemih dengan ISK",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["N20", "N21", "N22", "N23"]}, {"operator": "OR", "codes": ["N39.0"]}]
    },
    "validation_action": {
      "warning_message": "Kaidah Excludes: ISK (N39.0) SUDAH INCLUDE dalam Batu Saluran Kemih (N20-N23). ISK tidak boleh ditagihkan sebagai diagnosis sekunder terpisah."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-05",
    "case": "Cholelithiasis dengan Obstruksi/Cholangitis",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["K80", "K80.0", "K80.1", "K80.2"]}, {"operator": "OR", "codes": ["K83.1", "K83.0"]}]
    },
    "validation_action": {
      "warning_message": "Kaidah Kombinasi: K83.1 (Obstruksi) dan K83.0 (Cholangitis) TIDAK DIKODE TERPISAH jika ada Cholelithiasis. Gunakan gabungan K80.3 atau K80.4."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-06",
    "case": "Apendisitis Perforasi/Peritonitis",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["K35.2"]}, {"operator": "OR", "codes": ["K63.1"]}]
    },
    "validation_action": {
      "warning_message": "Unbundling: Peritonitis/perforasi sudah terwakili dalam K35.2. Perforation of intestine (K63.1) TIDAK BOLEH dikoding terpisah."
    },
    "PTD": "1"
  },
  {
    "id": "AUDIT-COD-07",
    "case": "Amputasi Jari (Specificity)",
    "category": "Coding Audit",
    "condition": {
      "type": "simple",
      "operator": "OR",
      "codes": ["84.91"]
    },
    "validation_action": {
      "warning_message": "Kurang Spesifik: Jangan gunakan 84.91 (Amputation, NOS). Gunakan: Jari tangan (84.01), Ibu jari tangan (84.02), Jari kaki (84.11)."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-08",
    "case": "DM dengan Ulkus/Gangren",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["E10", "E11", "E14"]}, {"operator": "OR", "codes": ["R02", "L89"]}]
    },
    "validation_action": {
      "warning_message": "Kode Kombinasi: DM dengan gangren/ulkus diabetik HARUS menggunakan kode E10.5 / E11.5 / E14.5. Gangren (R02) tidak dikode terpisah."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-09",
    "case": "DM Neuropati (Dagger Asterisk)",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["E14.9", "E11.9", "E10.9"]}, {"operator": "OR", "codes": ["G63.2"]}]
    },
    "validation_action": {
      "warning_message": "Dagger & Asterisk: Polineuropati diabetik dikode E11.4+/E14.4+ sebagai Diagnosis Utama, dan G63.2* sebagai Diagnosis Sekunder."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-10",
    "case": "HIV dengan Infeksi Sekunder Multipel",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["B20.0", "B20.1", "B20.4", "B20.8"]}, {"operator": "OR", "codes": ["J15.9", "J15.2", "J18.9"]}]
    },
    "validation_action": {
      "warning_message": "Kode Kombinasi HIV: Jika infeksi penyerta >1 (misal Kandidiasis + Pneumonia), gunakan B20.7 (HIV resulting in multiple infections) sebagai Diagnosis Utama."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-11",
    "case": "DHF dengan Trombositopenia",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["A91", "A90"]}, {"operator": "OR", "codes": ["D69.6"]}]
    },
    "validation_action": {
      "warning_message": "Overcoding Simtom: Trombositopenia (D69.6) merupakan tanda klinis DHF (A91). Tidak boleh dikoding sebagai diagnosis sekunder."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-12",
    "case": "IHD dengan Angina Pectoris",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["I25", "I25.1", "I25.9"]}, {"operator": "OR", "codes": ["I20", "I20.0", "I20.1", "I20.9"]}]
    },
    "validation_action": {
      "warning_message": "Overcoding Simtom: Angina Pectoris (I20.-) adalah bagian (include) dari IHD (I25.-). Tidak perlu dikode terpisah."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-15",
    "case": "Ruptur Perineum Derajat Ringan",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["O80.0", "O80.9", "73.59"]}, {"operator": "OR", "codes": ["O70.0", "O70.1"]}]
    },
    "validation_action": {
      "warning_message": "Overcoding: Ruptur perineum derajat 1 dan 2 (O70.0, O70.1) adalah bagian normal persalinan. Tidak dikoding terpisah."
    },
    "PTD": "1"
  },
  {
    "id": "AUDIT-COD-16",
    "case": "Hipertensi dengan Gagal Jantung",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["I10"]}, {"operator": "OR", "codes": ["I50", "I50.0", "I50.1", "I50.9"]}]
    },
    "validation_action": {
      "warning_message": "Kaidah Kombinasi: Heart Failure (I50.-) akibat Hipertensi (I10) HARUS digabung menjadi I11.0. Keduanya tidak boleh dipisah."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-17",
    "case": "Hipertensi dengan Gagal Ginjal Kronis (CKD)",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["I10"]}, {"operator": "OR", "codes": ["N18", "N18.9", "N19"]}]
    },
    "validation_action": {
      "warning_message": "Kaidah Kombinasi: Hipertensi (I10) dengan CKD (N18.-) menggunakan kode kombinasi I12.-. (Tidak berlaku untuk AKI N17)."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-18",
    "case": "Hipertensi + CKD + CHF",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["I10", "I11.0", "I12.0"]}, {"operator": "OR", "codes": ["N18", "N18.9", "N19"]}, {"operator": "OR", "codes": ["I50", "I50.0", "I50.9"]}]
    },
    "validation_action": {
      "warning_message": "Kaidah Kombinasi Lengkap: HT dengan CKD (N18) yang disertai CHF (I50) dikoding dengan I13.2. Gejala edema paru tidak dikoding terpisah."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-19",
    "case": "CHF dengan Edema Paru",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["I50.0"]}, {"operator": "OR", "codes": ["J81"]}]
    },
    "validation_action": {
      "warning_message": "Kaidah Kombinasi: Edema Paru (J81) bersamaan dengan CHF (I50.0), cukup gunakan kode tunggal I50.1 (Left ventricular failure)."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-20",
    "case": "PPOK dengan Pneumonia",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["J44.0", "J44.9"]}, {"operator": "OR", "codes": ["J18", "J18.9", "J15"]}]
    },
    "validation_action": {
      "warning_message": "Kaidah Kombinasi: PPOK (J44.9) + Pneumonia (J18.-) digabung menjadi J44.0. PENGECUALIAN: PPOK Eksaserbasi Akut (J44.1) + Pneumonia (J18.9) DIKODING TERPISAH."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-21",
    "case": "Typhoid Fever dengan Gastroenteritis",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["A01", "A01.0"]}, {"operator": "OR", "codes": ["A09"]}]
    },
    "validation_action": {
      "warning_message": "Overcoding (Excludes): Gastroenteritis (A09) tidak dikoding lagi jika Typhoid Fever (A01.0) sudah tegak."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-22",
    "case": "Typhoid Fever dengan Pneumonia",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["A01", "A01.0"]}, {"operator": "OR", "codes": ["J18", "J18.9"]}]
    },
    "validation_action": {
      "warning_message": "Dagger & Asterisk: Pneumonia pada Typhoid Fever BUKAN J18.9. Gunakan A01.0+ (Utama) dan J17.0* (Sekunder)."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-23",
    "case": "Oligohidramnion dengan KPD",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["O41.0"]}, {"operator": "OR", "codes": ["O42", "O42.0", "O42.1", "O42.9"]}]
    },
    "validation_action": {
      "warning_message": "Overcoding (Excludes): Jika ada oligohidroamnion (O41.0) disertai KPD (O42.-), maka HANYA digunakan kode O42.-."
    },
    "PTD": "1"
  },
  {
    "id": "AUDIT-COD-24",
    "case": "Syok Hipovolemik dengan Riwayat Trauma",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["R57.1", "R57", "R57.9"]}, {"operator": "OR", "codes": ["S06", "S06.8", "S36", "T09"]}]
    },
    "validation_action": {
      "warning_message": "Kaidah Excludes R57: Syok hipovolemik (R57.1) akibat cedera/trauma HARUS diganti menjadi Traumatic shock (T79.4)."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-25",
    "case": "Unbundling Hernia Inguinal & Adhesiolysis",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["53.0", "53.00", "53.01", "53.02"]}, {"operator": "OR", "codes": ["54.59", "K66.0"]}]
    },
    "validation_action": {
      "warning_message": "Unbundling Prosedur: Tindakan Adhesiolysis (54.59) TIDAK LAZIM dikoding bersamaan dengan Hernia Inguinal murni. Berisiko menaikkan tarif secara tidak wajar."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-26",
    "case": "Unbundling SC & Adhesiolysis",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["74.1", "74.4", "74.99"]}, {"operator": "OR", "codes": ["65.89", "54.59"]}]
    },
    "validation_action": {
      "warning_message": "Unbundling Prosedur: Lisis perlengketan (65.89/54.59) akibat riwayat SC sebelumnya SUDAH INCLUDE dalam prosedur Seksio Sesarea (74.-)."
    },
    "PTD": "1"
  },
  {
    "id": "AUDIT-COD-29",
    "case": "Preterm Labour (O60) vs False Labour (O47)",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["O60.0"]}, {"operator": "OR", "codes": ["O47.0", "O47.9"]}]
    },
    "validation_action": {
      "warning_message": "Kaidah Excludes: False Labour (O47.0) TIDAK BISA dikoding bersamaan dengan Preterm Labour (O60.0)."
    },
    "PTD": "1"
  },
  {
    "id": "AUDIT-COD-30",
    "case": "Overcoding Gejala saat PCI",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["36.0", "36.01", "36.02", "36.06"]}, {"operator": "OR", "codes": ["I49.3", "I49.9"]}]
    },
    "validation_action": {
      "warning_message": "Overcoding Komplikasi: Gangguan irama sesaat (VPD / I49.3) EFEK DARI prosedur PCI tidak boleh dimasukkan sebagai diagnosis sekunder."
    },
    "PTD": "1"
  },
  {
    "id": "AUDIT-COD-31",
    "case": "Miscoding Aplastic Anemia (Post-Chemo)",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["D61.9", "D61.0"]}, {"operator": "OR", "codes": ["Z51.1", "C"]}]
    },
    "validation_action": {
      "warning_message": "Kesalahan ICD: Pansitopenia efek kemoterapi BUKAN dikode Anemia Aplastik idiopatik (D61.9/D61.0). Harus dikode terkait efek obat (D61.1)."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-33",
    "case": "HIV + Tuberkulosis",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["B20", "B20.0"]}, {"operator": "OR", "codes": ["A15", "A15.0", "A16", "A16.0", "A16.2"]}]
    },
    "validation_action": {
      "warning_message": "Kode Kombinasi: HIV + TB HARUS menggunakan B20.0 (HIV resulting in mycobacterial infection). Kode TB (A15/A16) TIDAK BOLEH dikoding terpisah."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-34",
    "case": "Laparotomi sebagai Operative Approach",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["54.11", "54.19"]}, {"operator": "OR", "codes": ["68.4", "68.5", "68.9", "47.0", "54.4"]}]
    },
    "validation_action": {
      "warning_message": "Kaidah Omit Code: Laparotomi (54.11/54.19) SEBAGAI JALAN MASUK untuk operasi utama (misal Histerektomi/Apendiktomi) adalah OMIT CODE (tidak dikoding)."
    },
    "PTD": "1"
  },
  {
    "id": "AUDIT-COD-35",
    "case": "Repair Episiotomi vs Repair Perineum",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["O80.0", "O80.9"]}, {"operator": "OR", "codes": ["75.69"]}]
    },
    "validation_action": {
      "warning_message": "Overcoding Prosedur: Repair episiotomi rutin dikoding 73.6. Kode 75.69 (Repair Perineum) HANYA untuk robekan derajat 3/4."
    },
    "PTD": "1"
  },
  {
    "id": "AUDIT-COD-37",
    "case": "Pembuatan AV Shunt (Cimino) Baru vs Revisi",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["N18.5", "Z49.1"]}, {"operator": "OR", "codes": ["39.42", "39.52"]}]
    },
    "validation_action": {
      "warning_message": "Koreksi Spesifisitas: AV Shunt BARU menggunakan 39.27. Kode 39.42 HANYA untuk REVISI shunt lama."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-39",
    "case": "Eksisi Gusi vs Kista Tulang Rahang",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["K05.1", "K05.2"]}, {"operator": "OR", "codes": ["24.4"]}]
    },
    "validation_action": {
      "warning_message": "Koreksi Anatomi: Eksisi di gusi/gingiva dikode 24.31. Jangan gunakan 24.4 (untuk kista di dalam tulang rahang/mandibula)."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-40",
    "case": "Gejala Paraplegia pada HNP/Neoplasma Tulang Belakang",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["M51.2", "D16.6", "M51.-"]}, {"operator": "OR", "codes": ["G82.2", "G82.-"]}]
    },
    "validation_action": {
      "warning_message": "Underlying Cause: Paraplegia (G82.2) sebagai manifestasi HNP/Neoplasma (D16.6) TIDAK PERLU dikoding terpisah jika diagnosis utamanya sudah ditangani."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-41",
    "case": "Kompresi Otak pada Cedera Kepala Traumatik",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["S06", "S06.2", "S06.4", "S06.8"]}, {"operator": "OR", "codes": ["G93.5"]}]
    },
    "validation_action": {
      "warning_message": "Kaidah Includes: G93.5 (Compression of brain) INCLUDE di dalam cedera intrakranial traumatik (S06.-). G93.5 hanya untuk kompresi otak NON-TRAUMATIK."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-43",
    "case": "Salah Kode Kombinasi Batu Buli & Hidronefrosis",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["N21", "N21.0"]}, {"operator": "OR", "codes": ["N13", "N13.2"]}, {"operator": "OR", "codes": ["N20.9"]}]
    },
    "validation_action": {
      "warning_message": "Ketidaksesuaian Anatomi: N20.9 HANYA untuk Batu Ginjal & Ureter. Jangan gunakan N20.9 untuk menggabungkan Batu Buli (N21.0) dengan Hidronefrosis (N13.2)."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-44",
    "case": "Batu Ureter dan Pyelonephritis",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["N20.1"]}, {"operator": "OR", "codes": ["N10"]}]
    },
    "validation_action": {
      "warning_message": "Kaidah Kombinasi: Batu Ureter (N20.1) & Pyelonephritis (N10) DIGABUNG menjadi N20.9 (Urinary calculus with pyelonephritis)."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-46",
    "case": "Unbundling Induksi (Augmentasi) Persalinan",
    "category": "Coding Audit",
    "condition": {
      "type": "simple",
      "operator": "OR",
      "codes": ["73.4"]
    },
    "validation_action": {
      "warning_message": "Kaidah Omit Code: 73.4 (Medical induction) TIDAK BOLEH digunakan jika tujuannya hanya 'augmentasi' (memperkuat kontraksi/HIS yang sudah ada). Augmentasi adalah OMIT CODE."
    },
    "PTD": "1"
  },
  {
    "id": "AUDIT-COD-48",
    "case": "Abses Paru disertai Pneumonia Tidak Spesifik (J18.-)",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["J85.0", "J85.2", "J85.3"]}, {"operator": "OR", "codes": ["J18", "J18.0", "J18.1", "J18.2", "J18.8", "J18.9"]}]
    },
    "validation_action": {
      "warning_message": "Kaidah Kode Kombinasi: Abses Paru tidak boleh dikoding terpisah dengan Pneumonia Unspecified (J18.-). Gunakan KODE KOMBINASI J85.1 sebagai Diagnosis Utama."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-49",
    "case": "Abses Paru dengan Pneumonia Bakterial/Spesifik (J10-J16)",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["J85.1"]}, {"operator": "OR", "codes": ["J10", "J11", "J12", "J13", "J14", "J15", "J16", "J15.9"]}]
    },
    "validation_action": {
      "warning_message": "Kaidah Excludes: Kode J85.1 memiliki Excludes untuk pneumonia bakterial/spesifik (J10-J16). Gunakan kode spesifik pneumonianya (J15.-) ditambah J85.2. JANGAN gunakan J85.1."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-50",
    "case": "Pneumonia pada Tuberkulosis Paru",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["A15", "A15.2", "A16", "A16.2"]}, {"operator": "OR", "codes": ["J18", "J18.9", "J15"]}]
    },
    "validation_action": {
      "warning_message": "Kaidah Includes: Kondisi Tuberculous Pneumonia sudah TERMASUK (Include) di dalam kode A15.2 / A16.2. Kode Pneumonia (J18.-) tidak boleh ditagihkan sebagai diagnosis sekunder."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-51",
    "case": "Dengue Fever vs Dengue Haemorrhagic Fever",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["A90"]}, {"operator": "OR", "codes": ["A91"]}]
    },
    "validation_action": {
      "warning_message": "Mutually Exclusive: Kode Dengue Fever (A90) mengeksklusi DHF (A91). Anda tidak boleh mengoding keduanya secara bersamaan dalam satu episode rawat."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-52",
    "case": "Measles dengan Komplikasi Pneumonia",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["B05.9", "B05"]}, {"operator": "OR", "codes": ["J18", "J18.9"]}]
    },
    "validation_action": {
      "warning_message": "Dagger & Asterisk: Measles tanpa komplikasi adalah B05.9. Jika disertai Pneumonia, dilarang menggunakan J18.9. Gunakan sistem dagger-asterisk: B05.2+ (Utama) dan J17.1* (Sekunder)."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-55",
    "case": "Overcoding Hemoptisis pada Tuberkulosis",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["A15", "A15.0", "A16", "A16.0"]}, {"operator": "OR", "codes": ["R04.2"]}]
    },
    "validation_action": {
      "warning_message": "Overcoding Simtom: Hemoptisis (batuk darah / R04.2) merupakan bagian dari manifestasi klinis Tuberkulosis Paru. Tidak boleh dikode terpisah sebagai diagnosis sekunder."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-58",
    "case": "Diagnosis Malunion dengan Fraktur Akut",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{"operator": "OR", "codes": ["M84.0"]}, {"operator": "OR", "codes": ["S72", "S82", "S52", "S-"]}]
    },
    "validation_action": {
      "warning_message": "Kaidah Excludes: Jika episode perawatan adalah penanganan Malunion / Non-union (M84.0), kode diagnosa Fraktur akut (S-codes) TIDAK DIKODE bersamaan."
    },
    "PTD": "1/2"
  },
  {
    "id": "AUDIT-COD-59",
    "case": "Temuan Audit Coding: Psikosis & Epilepsi",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [
        {"operator": "OR", "codes": ["F29"]},
        {"operator": "OR", "codes": ["G40"]}
      ]
    },
    "validation_action": {
      "warning_message": "Koreksi Koding: Jika Kasus Psikosis dan terdapat Epilepsi Psikosis gunakan Kode F06.8 (Sumber: Aturan ICD 10 2010)."
    },
    "PTD": "1/2"
  }
];

const compKeys = [
  { key: 'prosedur_non_bedah', label: 'Non-Bedah' }, { key: 'prosedur_bedah', label: 'Bedah' }, { key: 'konsultasi', label: 'Konsultasi' },
  { key: 'tenaga_ahli', label: 'Tenaga Ahli' }, { key: 'keperawatan', label: 'Keperawatan' }, { key: 'penunjang', label: 'Penunjang' },
  { key: 'radiologi', label: 'Radiologi' }, { key: 'laboratorium', label: 'Laboratorium' }, { key: 'pelayanan_darah', label: 'Darah' },
  { key: 'rehabilitasi', label: 'Rehab' }, { key: 'kamar_akomodasi', label: 'Kamar' }, { key: 'rawat_intensif', label: 'Intensif' },
  { key: 'obat', label: 'Obat' }, { key: 'alkes', label: 'Alkes' }, { key: 'bmhp', label: 'BMHP' },
  { key: 'sewa_alat', label: 'Sewa Alat' }, { key: 'obat_kronis', label: 'Obat Kronis' }, { key: 'obat_kemo', label: 'Obat Kemo' }
];

const TABS = [
  { id: 'executive', label: 'Executive', icon: PieChart }, { id: 'report', label: 'Laporan', icon: Table2 }, { id: 'rekap', label: 'Rekap Kasus', icon: Layers },
  { id: 'sl_cl_analysis', label: 'Analisis SL/CL', icon: Layers }, { id: 'dpjp', label: 'Kinerja DPJP', icon: User }, { id: 'kpi_coder', label: 'KPI Coder', icon: Award },
  { id: 'mapping', label: 'Peta iDRG', icon: GitMerge }, { id: 'discrepancy', label: 'Akurasi Koding', icon: FileCode }, { id: 'audit', label: 'Audit Log', icon: CheckSquare },
  { id: 'naik_kelas', label: 'Hak Kelas', icon: BarChart3 }, { id: 'icu', label: 'Intensif ICU', icon: ActivitySquare }
];

const normDpjp = (name) => {
  if (!name || name.trim() === '' || name.trim() === '-') return 'UNKNOWN';
  let n = String(name).toUpperCase().replace(/[,.]/g, ' ').replace(/\s+/g, ' ').trim(); 
  if (n.startsWith('DRG ')) n = n.substring(4).trim(); else if (n.startsWith('DR ')) n = n.substring(3).trim();
  return n || 'UNKNOWN';
};

const getCLName = (cl) => ({0: 'No CC', 1: 'Mild CC', 2: 'Moderate CC', 3: 'Severe CC', 4: 'Catastrophic CC', 9: 'Merge CC'}[cl] || 'Unknown');

const exportToCSV = (filename, headers, rows) => {
  const escapeCsv = (val) => `"${String(val !== undefined && val !== null ? val : '').replace(/"/g, '""')}"`;
  const csvData = [headers.map(escapeCsv).join(";")];
  rows.forEach(row => csvData.push(row.map(escapeCsv).join(";")));
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI("data:text/csv;charset=utf-8,\uFEFF" + csvData.join("\n"))); 
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

const formatRp = (val) => {
  if (val === undefined || isNaN(val) || !isFinite(val)) return 'Rp 0';
  const absVal = Math.abs(val); const sign = val < 0 ? '-' : '';
  if (absVal >= 1e9) return `${sign}Rp ${(absVal / 1e9).toFixed(1).replace('.', ',')} M`;
  if (absVal >= 1e6) return `${sign}Rp ${(absVal / 1e6).toFixed(1).replace('.', ',')} Jt`;
  return `${sign}${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(absVal)}`;
};

const formatRpEx = (val) => (val === undefined || isNaN(val) || !isFinite(val) || val === 0) ? "-" : `${val < 0 ? '-' : ''}Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.abs(val))}`;
const formatPct = (val) => (isNaN(val) || !isFinite(val) || val == null) ? "0.0" : Number(val).toFixed(1);
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const p = String(dateStr).split('/');
  if (p.length === 3) return new Date(`${p[2]}-${p[1]}-${p[0]}`);
  const d = new Date(dateStr); return isNaN(d.getTime()) ? null : d;
};

// --- REUSABLE UI COMPONENTS ---
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden ${className}`}>{children}</div>
);

const SectionHeader = ({ icon: Icon, title, desc, exportAction, exportText, colorClass, highlightClass }) => (
  <Card className="flex flex-col md:flex-row items-center justify-between gap-6 relative p-6">
    <div className={`absolute -left-20 -top-20 w-64 h-64 rounded-full blur-3xl pointer-events-none ${highlightClass}`}></div>
    <div className="relative z-10 flex-1">
       <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
         <div className={`p-2.5 rounded-xl ${colorClass}`}><Icon size={24} /></div> {title}
       </h3>
       <p className="text-sm font-medium text-slate-500 mt-2 max-w-3xl" dangerouslySetInnerHTML={{__html: desc}}></p>
    </div>
    {exportAction && (
      <button onClick={exportAction} className={`text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:-translate-y-0.5 transition-all shrink-0 ${colorClass.replace('bg-','bg-').replace('text-','shadow-')}`}>
         <Download size={16}/> {exportText || 'Ekspor CSV'}
      </button>
    )}
  </Card>
);

const MiniTable = ({ data = [], columns = [], onRowClick, maxHeight = "400px" }) => (
  <div className={`overflow-x-auto flex-1 p-2 custom-scrollbar`} style={{maxHeight}}>
    <table className="w-full text-xs text-left whitespace-nowrap">
      <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
        <tr>{columns.map((col, i) => <th key={`col-${i}`} className={`p-3 border-b border-slate-100 ${col.hClass||col.className||''}`}>{col.header}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {data.map((row, i) => (
          <tr key={`row-${i}`} className={`transition-colors ${onRowClick ? 'hover:bg-slate-50/50 cursor-pointer' : ''}`} onClick={() => onRowClick && onRowClick(row)}>
            {columns.map((col, j) => <td key={`cell-${i}-${j}`} className={`p-3 ${col.className||''}`}>{col.render(row, i)}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [subTab, setSubTab] = useState('executive'); 
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [drilldown, setDrilldown] = useState({ isOpen: false, title: '', data: [] });
  const [scatterTooltip, setScatterTooltip] = useState(null);
  const [globalFilter, setGlobalFilter] = useState({ periode: 'All', jenisRawat: 'All', kelasRawat: 'All', dpjp: 'All' });
  const [isScrolled, setIsScrolled] = useState(false);
  const [auditFilter, setAuditFilter] = useState('');

  const fileInputRef = useRef(null); const folderInputRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const checkMatchList = (arrIna, arrIdrg, exclusions) => {
    const cleanIna = Array.from(new Set(arrIna.map(c => String(c).trim().toUpperCase()).filter(c => c && c !== '-')));
    const cleanIdrg = Array.from(new Set(arrIdrg.map(c => String(c).trim().toUpperCase()).filter(c => c && c !== '-' && !exclusions.includes(c))));
    if(cleanIna.length === 0 && cleanIdrg.length === 0) return 100;
    if(cleanIna.length === 0 || cleanIdrg.length === 0) return 0;
    let mIna = 0, mIdrg = 0;
    cleanIna.forEach(i => { if (cleanIdrg.some(id => i.startsWith(id) || id.startsWith(i))) mIna++; });
    cleanIdrg.forEach(id => { if (cleanIna.some(i => i.startsWith(id) || id.startsWith(i))) mIdrg++; });
    if (mIna === cleanIna.length && mIdrg === cleanIdrg.length) return 100;
    return ((mIna / cleanIna.length) * 100 + (mIdrg / cleanIdrg.length) * 100) / 2;
  };

  const checkCodingRule = (rule, allCodes, diagList) => {
    const hasCode = (codes, op) => op === 'OR' ? codes.some(c => allCodes.some(ac => String(ac).startsWith(String(c)))) : codes.every(c => allCodes.some(ac => String(ac).startsWith(String(c))));
    if (!rule || !rule.condition) return false;
    if (rule.condition.type === 'primary_only') return diagList.length > 0 && rule.condition.codes.some(c => String(diagList[0]).startsWith(String(c)));
    if (rule.condition.type === 'simple') return hasCode(rule.condition.codes, rule.condition.operator);
    if (rule.condition.type === 'grouped') {
      const results = rule.condition.groups.map(g => hasCode(g.codes, g.operator));
      return rule.condition.operator === 'AND' ? results.every(r => r) : results.some(r => r);
    }
    return false;
  };

  const extract18 = (row) => {
    const getVal = (keys) => {
      for(let k of keys) {
        const m = Object.keys(row).find(rK => rK.toUpperCase().replace(/[^A-Z0-9]/g, '_') === k.toUpperCase().replace(/[^A-Z0-9]/g, '_') || rK.toUpperCase() === k.toUpperCase());
        if (m && row[m] !== undefined && row[m] !== '') {
          let str = String(row[m]).trim(); if(str === '-' || str === '0') return 0;
          if(str.includes(',') && str.includes('.')) str = str.lastIndexOf(',') > str.lastIndexOf('.') ? str.replace(/\./g, '').replace(',', '.') : str.replace(/,/g, '');
          else if (str.includes(',')) str = str.replace(',', '.');
          const p = parseFloat(str.replace(/[^0-9.-]+/g,"")); return isNaN(p) ? 0 : p;
        }
      } return 0;
    };
    return compKeys.reduce((acc, c) => ({ ...acc, [c.key]: getVal([c.key.toUpperCase(), `TARIF_${c.key.toUpperCase()}`, c.label.toUpperCase().replace(/ /g,'_')]) }), {});
  };

  const processFiles = async (files) => {
    setError(''); const vFiles = Array.from(files).filter(f => f.name.endsWith('.txt') || f.type === 'text/plain');
    if (vFiles.length === 0) return setError('Masukkan file .txt');
    const newFiles = [];
    for (const f of vFiles) {
      if (uploadedFiles.some(ex => ex.name === f.name && ex.rawSize === f.size)) continue;
      try {
        const text = await f.text(); const lines = text.split('\n').filter(l => l.trim() !== '');
        if (lines.length > 0) {
          const headers = lines[0].split('\t').map(h => h.trim());
          const rows = lines.slice(1).map(l => { const vals = l.split('\t'); let obj = {}; headers.forEach((h, i) => { obj[h] = vals[i] ? vals[i].trim() : ''; }); return obj; });
          newFiles.push({ id: Math.random().toString(36).substring(2, 11), name: f.name, rawSize: f.size, size: (f.size/1024).toFixed(2)+' KB', headers, rows });
        }
      } catch (err) { setError(`Gagal membaca ${f.name}`); }
    }
    if (newFiles.length === 0 && vFiles.length > 0) setError('File kosong atau duplikat.');
    else { setUploadedFiles(prev => [...prev, ...newFiles]); setActiveTab('dashboard'); }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) processFiles(e.dataTransfer.files); };
  const removeFile = (id) => setUploadedFiles(prev => prev.filter(f => f.id !== id));
  const clearData = () => { setUploadedFiles([]); setError(''); };

  const filterOptions = useMemo(() => {
    const periods = new Set(), jenis = new Set(), kelas = new Set(), dpjps = new Map();
    uploadedFiles.flatMap(f => f.rows).forEach(r => {
      const dObj = parseDate(r['DISCHARGE_DATE']);
      if (dObj) periods.add(`${dObj.getFullYear()}-${String(dObj.getMonth()+1).padStart(2,'0')}`);
      if (r['PTD']) jenis.add(String(r['PTD']).trim());
      const kls = r['KELAS_RAWAT'] || r['KELAS'] || r['HAK_KELAS']; if (kls) kelas.add(String(kls).trim());
      const np = normDpjp(r['DPJP']); if (!dpjps.has(np)) dpjps.set(np, r['DPJP'] || 'Unknown');
    });
    return { periods: Array.from(periods).sort((a,b) => b.localeCompare(a)), jenis: Array.from(jenis).sort(), kelas: Array.from(kelas).sort(), dpjps: Array.from(dpjps.entries()).map(([norm, disp]) => ({norm, disp})).sort((a,b) => a.disp.localeCompare(b.disp)) };
  }, [uploadedFiles]);

  const dashData = useMemo(() => {
    const rawRows = uploadedFiles.flatMap(f => f.rows);
    if (rawRows.length === 0) return null;
    const rows = rawRows.filter(row => {
      if (globalFilter.periode !== 'All') { const dObj = parseDate(row['DISCHARGE_DATE']); if (!dObj || `${dObj.getFullYear()}-${String(dObj.getMonth()+1).padStart(2,'0')}` !== globalFilter.periode) return false; }
      if (globalFilter.jenisRawat !== 'All' && String(row['PTD']||'').trim() !== globalFilter.jenisRawat) return false;
      const kls = String(row['KELAS_RAWAT'] || row['KELAS'] || row['HAK_KELAS'] || '').trim();
      if (globalFilter.kelasRawat !== 'All' && kls !== globalFilter.kelasRawat) return false;
      if (globalFilter.dpjp !== 'All' && normDpjp(row['DPJP']) !== globalFilter.dpjp) return false;
      return true;
    });

    if (rows.length === 0) return { rawRows: rows, totalRows: 0, isEmptyAfterFilter: true };

    let stats = { tIna:0, tIdrg:0, cInaHigh:0, cIdrgHigh:0, cEq:0, selisihList:[], totalScoreDiag:0, totalScoreProc:0, ranapCount:0, anomaliKasus:0, naikKelasKasus:0, naikKelasNilai:0 };
    let maps = { monthly:{}, drg:{}, report:{}, severity:{}, dpjp:{}, diagU:{}, diagS:{}, proc:{}, ina:{}, idrg:{}, slClShift:{}, coder:{}, naikKelas:{}, discharge:{"1":0,"2":0,"3":0,"4":0,"5":0}, sev:{"1":0,"2":0,"3":0}, cl:{"0":0,"1":0,"2":0,"3":0,"4":0,"9":0}, icu:{total:0, sev1:0, sev2:0, sev3:0, anomalies:[]}, inaToIdrg:{}, idrgToIna:{}, discrepancies:[], audit:[] };
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

    rows.forEach((r, idx) => {
      const tIna = parseFloat(r['TOTAL_TARIF']) || 0; const tIdrg = parseFloat(r['IDRG_TOTAL_TARIF']) || 0;
      const tRS = parseFloat(r['TARIF_RS']) || parseFloat(r['BIAYA_RS']) || parseFloat(r['TOTAL_TARIF_RS']) || parseFloat(r['TARIF_RS_COST']) || 0;
      const sel = tIdrg - tIna; const inaCode = String(r['INACBG'] || '').trim(); const drgCode = String(r['IDRG_DRG_CODE'] || '').trim();
      
      stats.tIna += tIna; stats.tIdrg += tIdrg; stats.selisihList.push(sel);
      
      const rndIna = Math.round(tIna); const rndIdrg = Math.round(tIdrg);
      if (rndIna > rndIdrg) stats.cInaHigh++; else if (rndIdrg > rndIna) stats.cIdrgHigh++; else stats.cEq++;

      const dObj = parseDate(r['DISCHARGE_DATE']); const isRanap = String(r['PTD']||'').trim() === '1';
      if (dObj) {
         const mKey = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}`;
         if (!maps.monthly[mKey]) maps.monthly[mKey] = { label: `${monthNames[dObj.getMonth()]} '${String(dObj.getFullYear()).slice(-2)}`, inacbg:0, idrg:0, selisih:0, tarifRs:0, sortVal: dObj.getTime() };
         maps.monthly[mKey].inacbg += tIna; maps.monthly[mKey].idrg += tIdrg; maps.monthly[mKey].selisih += sel; maps.monthly[mKey].tarifRs += tRS;
         
         if (!maps.report[mKey]) maps.report[mKey] = { label: `${monthNames[dObj.getMonth()]} - ${dObj.getFullYear()}`, sortVal: dObj.getTime(), tarifRsTotal: 0, kasusRajal: 0, kasusRanap: 0, inaRajal: 0, inaRanap: 0, idrgRajal: 0, idrgRanap: 0 };
         maps.report[mKey].tarifRsTotal += tRS;
         if (isRanap) { maps.report[mKey].kasusRanap++; maps.report[mKey].inaRanap+=tIna; maps.report[mKey].idrgRanap+=tIdrg; } else { maps.report[mKey].kasusRajal++; maps.report[mKey].inaRajal+=tIna; maps.report[mKey].idrgRajal+=tIdrg; }
         
         if (!maps.severity[mKey]) maps.severity[mKey] = { label: `${monthNames[dObj.getMonth()]} - ${dObj.getFullYear()}`, sortVal: dObj.getTime(), sl0_kasus:0, sl1_kasus:0, sl2_kasus:0, sl3_kasus:0, sl0_rp:0, sl1_rp:0, sl2_rp:0, sl3_rp:0 };
         let sl = -1; if (!isRanap) sl = 0; else { if (inaCode.endsWith('-I')) sl = 1; else if (inaCode.endsWith('-II')) sl = 2; else if (inaCode.endsWith('-III')) sl = 3; else sl = 1; }
         if (sl === 0) { maps.severity[mKey].sl0_kasus++; maps.severity[mKey].sl0_rp += tIna; } else if (sl === 1) { maps.severity[mKey].sl1_kasus++; maps.severity[mKey].sl1_rp += tIna; } else if (sl === 2) { maps.severity[mKey].sl2_kasus++; maps.severity[mKey].sl2_rp += tIna; } else if (sl === 3) { maps.severity[mKey].sl3_kasus++; maps.severity[mKey].sl3_rp += tIna; }
      }

      if (drgCode && drgCode !== '-') {
         if (!maps.drg[drgCode]) maps.drg[drgCode] = { desc: String(r['IDRG_DRG_DESCRIPTION'] || '-'), sumIna: 0, sumIdrg: 0, count: 0, sumRS: 0 };
         maps.drg[drgCode].sumIna += tIna; maps.drg[drgCode].sumIdrg += tIdrg; maps.drg[drgCode].sumRS += tRS; maps.drg[drgCode].count++;
      }
      if (inaCode && inaCode !== '-') {
         if (!maps.ina[inaCode]) maps.ina[inaCode] = { code: inaCode, desc: String(r['DESKRIPSI_INACBG'] || '-'), count: 0, sumRS: 0, sumIna: 0 };
         maps.ina[inaCode].count++; maps.ina[inaCode].sumRS += tRS; maps.ina[inaCode].sumIna += tIna;
      }

      const dList = String(r['DIAGLIST'] || '').split(';').map(d => d.trim()).filter(d => d);
      const pList = String(r['PROCLIST'] || '').split(';').map(p => p.trim()).filter(p => p && p !== '-' && p.toLowerCase() !== 'none');
      const np = normDpjp(r['DPJP']);
      if (!maps.dpjp[np]) maps.dpjp[np] = { name: String(r['DPJP'] || 'Unknown'), normName: np, count: 0, sumRS: 0, sumIna: 0, sumIdrg: 0, comps: compKeys.reduce((a,c)=>({...a,[c.key]:0}),{}) };
      maps.dpjp[np].count++; maps.dpjp[np].sumRS+=tRS; maps.dpjp[np].sumIna+=tIna; maps.dpjp[np].sumIdrg+=tIdrg;
      const c18 = extract18(r); for(let k in c18) maps.dpjp[np].comps[k] += c18[k];
      
      let ds = String(r['DISCHARGE_STATUS'] || r['STATUS_PULANG'] || r['CARA_PULANG'] || '').trim();
      maps.discharge[['1','2','3','4'].includes(ds) ? ds : "5"]++;
      
      if(dList.length > 0) {
        if(!dList[0].toUpperCase().startsWith('Z')) maps.diagU[dList[0]] = (maps.diagU[dList[0]]||0) + 1;
        for(let i=1; i<dList.length; i++) maps.diagS[dList[i]] = (maps.diagS[dList[i]]||0) + 1;
      }
      pList.forEach(p => maps.proc[p] = (maps.proc[p]||0) + 1);

      let sev = 0; if (inaCode.endsWith('-I')) sev=1; else if (inaCode.endsWith('-II')) sev=2; else if (inaCode.endsWith('-III')) sev=3;
      if (isRanap) {
        stats.ranapCount++; if (sev > 0) maps.sev[sev.toString()]++;
        const cl = parseInt(drgCode.slice(-1)); 
        if (!isNaN(cl)) {
           if (maps.cl[cl.toString()] !== undefined) maps.cl[cl.toString()]++;
           if (sev > 0) {
              const sK = `SL${sev}_CL${cl}`;
              if (!maps.slClShift[sK]) maps.slClShift[sK] = { sev, cl, count:0, sumIna:0, sumIdrg:0, selisih:0, secDiags:{} };
              maps.slClShift[sK].count++; maps.slClShift[sK].sumIna+=tIna; maps.slClShift[sK].sumIdrg+=tIdrg; maps.slClShift[sK].selisih+=sel;
              for(let i=1; i<dList.length; i++) maps.slClShift[sK].secDiags[dList[i]] = (maps.slClShift[sK].secDiags[dList[i]]||0)+1;
           }
        }
      }

      const matchC2 = String(r['C2'] || '').match(/"selisih_biaya":\s*\{\s*"nilai":\s*"(\d+)"\s*,\s*"pembayar":\s*"([^"]+)"\s*,\s*"naik_kelas":\s*"([^"]+)"/);
      if (matchC2 && parseFloat(matchC2[1]) > 0) {
         let kAw = String(r['KELAS_RAWAT'] || r['KELAS'] || r['HAK_KELAS'] || 'Unknown').trim();
         let kAk = String(matchC2[3]).toUpperCase(); let k = `Kelas ${kAw} -> ${kAk}`;
         if (!maps.naikKelas[k]) maps.naikKelas[k] = { awal:`Kelas ${kAw}`, awalRaw:kAw, akhir:kAk, pembayar:String(matchC2[2]).toUpperCase(), count:0, totalNilai:0, sev1:0, sev2:0, sev3:0 };
         maps.naikKelas[k].count++; maps.naikKelas[k].totalNilai+=parseFloat(matchC2[1]);
         if(sev===1) maps.naikKelas[k].sev1++; else if(sev===2) maps.naikKelas[k].sev2++; else if(sev===3) maps.naikKelas[k].sev3++;
         stats.naikKelasKasus++; stats.naikKelasNilai+=parseFloat(matchC2[1]);
      }

      const icuInd = String(r['ICU_INDIKATOR']||'').trim(); const icuLos = parseFloat(r['ICU_LOS']||0); const ventHour = parseFloat(r['VENT_HOUR']||0);
      if (icuInd === '1' || icuLos > 0 || ventHour > 0) {
          maps.icu.total++; if (sev>0) maps.icu[`sev${sev}`]++;
          if (pList.includes('96.71') && ventHour >= 96) maps.icu.anomalies.push({ mrn: String(r['MRN']||'-'), sep: String(r['SEP']||'-'), ventHour, issue: 'Kode 96.71 (<96 Jam) tapi aktual >= 96 jam', severity: sev });
          if (pList.includes('96.72') && ventHour < 96) maps.icu.anomalies.push({ mrn: String(r['MRN']||'-'), sep: String(r['SEP']||'-'), ventHour, issue: 'Kode 96.72 (>96 Jam) tapi aktual < 96 jam', severity: sev });
      }

      if (inaCode && inaCode !== '-' && drgCode && drgCode !== '-') {
        if(!maps.inaToIdrg[inaCode]) maps.inaToIdrg[inaCode] = { desc: String(r['DESKRIPSI_INACBG'] || '-'), targets: {} };
        const tK = drgCode + " (" + String(r['IDRG_DRG_DESCRIPTION'] || '-') + ")";
        if(!maps.inaToIdrg[inaCode].targets[tK]) maps.inaToIdrg[inaCode].targets[tK] = { count: 0, secDiags: {} };
        maps.inaToIdrg[inaCode].targets[tK].count++;
        for(let i=1; i<dList.length; i++) maps.inaToIdrg[inaCode].targets[tK].secDiags[dList[i]] = (maps.inaToIdrg[inaCode].targets[tK].secDiags[dList[i]] || 0) + 1;
      }

      const idrgDList = String(r['IDRG_DIAG_LISTS'] || '').split(';').map(d => d.trim()).filter(d => d);
      const idrgPList = String(r['IDRG_PROC_LISTS'] || '').split(';').map(p => p.trim()).filter(p => p && p !== '-' && p.toLowerCase() !== 'none');
      const sDiag = checkMatchList(dList, idrgDList, ['KG', 'HL', 'NL', 'KND', 'G89', 'U82', 'U83', 'U84']);
      const sProc = checkMatchList(pList, idrgPList, ['99.290']);
      stats.totalScoreDiag += sDiag; stats.totalScoreProc += sProc;
      
      const cId = String(r['CODER_ID'] || r['USER_CODER'] || r['CODER'] || 'UNKNOWN').trim().toUpperCase();
      if (!maps.coder[cId]) maps.coder[cId] = { id: cId, cases: 0, discrepancyCount: 0, auditHits: 0 };
      maps.coder[cId].cases++;

      if (sDiag < 100 || sProc < 100) { 
         maps.discrepancies.push({ rowIdx: idx, mrn: String(r['MRN']||''), sep: String(r['SEP']||''), diag1: dList, diag2: idrgDList, scoreDiag: sDiag, proc1: pList, proc2: idrgPList, scoreProc: sProc }); 
         maps.coder[cId].discrepancyCount++;
      }

      const acRow = [...dList, ...pList]; let hit = false;
      DEFAULT_AUDIT_RULES.forEach(ru => {
        const op = ru.condition?.operator || "OR"; let matched = false;
        if (ru.condition?.type === 'grouped') matched = op === 'AND' ? ru.condition.groups.every(g => g.codes.some(c => acRow.some(ac => ac.startsWith(c)))) : ru.condition.groups.some(g => g.codes.some(c => acRow.some(ac => ac.startsWith(c))));
        else if (ru.condition?.codes) matched = ru.condition.codes.some(c => acRow.some(ac => ac.startsWith(c)));
        
        if (matched) {
          maps.audit.push({ ruleId: String(ru.id || 'N/A'), case: String(ru.case || 'Spesifik'), warning: String(ru.validation_action?.warning_message || ""), mrn: String(r['MRN']||'-'), sep: String(r['SEP']||'-'), codes: acRow.join(', ') });
          hit = true;
        }
      });
      if (hit) maps.coder[cId].auditHits++;
    });

    stats.selisihList.sort((a,b)=>a-b);
    const mArray = Object.values(maps.monthly).sort((a,b) => a.sortVal - b.sortVal);
    const maxP = Math.max(...mArray.map(m => Math.max(m.inacbg, m.idrg, m.selisih, m.tarifRs)), 1);
    const minN = Math.min(...mArray.map(m => Math.min(0, m.selisih)), 0);
    const range = maxP + Math.abs(minN);
    
    const drgArr = Object.keys(maps.drg).map(c => ({ code: String(c), desc: String(maps.drg[c].desc), count: maps.drg[c].count, sumRS: maps.drg[c].sumRS, sumIdrg: maps.drg[c].sumIdrg, totalSelisih: maps.drg[c].sumIdrg - maps.drg[c].sumIna })).filter(x=>x.code!=='-');
    const inaArr = Object.keys(maps.ina).map(c => ({ code: String(c), desc: String(maps.ina[c].desc), count: maps.ina[c].count, sumRS: maps.ina[c].sumRS, sumIna: maps.ina[c].sumIna, totalSelisih: maps.ina[c].sumIna - maps.ina[c].sumRS })).filter(x=>x.code!=='-');

    return {
      rawRows: rows, totalRows: rows.length, ...stats, 
      selisihTotal: stats.tIdrg - stats.tIna, rataInacbg: rows.length > 0 ? stats.tIna / rows.length : 0, rataIdrg: rows.length > 0 ? stats.tIdrg / rows.length : 0,
      monthlyArray: mArray, maxPosVal: maxP, absMaxSelisih: Math.max(Math.abs(Math.max(...mArray.map(d=>d.selisih),0)), Math.abs(Math.min(...mArray.map(d=>d.selisih),0)), 1),
      posPct: range > 0 ? (maxP / range) * 100 : 0, negPct: range > 0 ? (Math.abs(minN) / range) * 100 : 0,
      reportArray: Object.values(maps.report).sort((a,b) => a.sortVal - b.sortVal), 
      severityReportArray: Object.values(maps.severity).sort((a,b) => a.sortVal - b.sortVal).map(item => ({...item, total_kasus: item.sl0_kasus + item.sl1_kasus + item.sl2_kasus + item.sl3_kasus, total_rp: item.sl0_rp + item.sl1_rp + item.sl2_rp + item.sl3_rp})),
      drgSummary: drgArr.sort((a,b)=>b.count - a.count), inaSummary: inaArr.sort((a,b)=>b.count - a.count),
      topDefisit: drgArr.filter(x=>x.totalSelisih<0).sort((a,b)=>a.totalSelisih-b.totalSelisih).slice(0,10), topSurplus: drgArr.filter(x=>x.totalSelisih>0).sort((a,b)=>b.totalSelisih-a.totalSelisih).slice(0,10),
      topDefisitIna: inaArr.filter(x=>x.totalSelisih<0).sort((a,b)=>a.totalSelisih-b.totalSelisih).slice(0,10), topSurplusIna: inaArr.filter(x=>x.totalSelisih>0).sort((a,b)=>b.totalSelisih-a.totalSelisih).slice(0,10),
      dpjpSummaryArray: Object.values(maps.dpjp).sort((a,b) => b.count - a.count),
      topDiagUtama: Object.entries(maps.diagU).sort((a,b)=>b[1]-a[1]).slice(0,10), topDiagSekunder: Object.entries(maps.diagS).sort((a,b)=>b[1]-a[1]).slice(0,10), topProc: Object.entries(maps.proc).sort((a,b)=>b[1]-a[1]).slice(0,10),
      dischargeStats: maps.discharge,
      slClShiftArray: Object.values(maps.slClShift).map(item => ({ ...item, topSecDiags: Object.entries(item.secDiags).sort((a,b)=>b[1]-a[1]) })).sort((a, b) => { if(a.sev !== b.sev) return (b.sev || 0) - (a.sev || 0); return (b.cl || 0) - (a.cl || 0); }),
      inaToIdrgMap: maps.inaToIdrg, scorecard: { avgDiag: stats.totalScoreDiag/rows.length, avgProc: stats.totalScoreProc/rows.length, discrepancies: maps.discrepancies },
      auditFindings: maps.audit, kpiCoderArray: Object.values(maps.coder).sort((a,b) => b.cases - a.cases), naikKelasStats: Object.values(maps.naikKelas).sort((a,b)=>b.totalNilai - a.totalNilai), icuStats: maps.icu
    };
  }, [uploadedFiles, globalFilter]);

  const openDrilldown = (title, filterFn) => { if (dashData) setDrilldown({ isOpen: true, title: String(title), data: dashData.rawRows.filter(filterFn) }); };

  const dlDrilldownCSV = () => {
    const headers = ['No', 'Nama Pasien', 'MRN', 'SEP', 'Tgl Pulang', 'SL INA', 'CL iDRG', 'INA Code', 'Deskripsi INA', 'Diag INA', 'Proc INA', 'iDRG Code', 'Deskripsi iDRG', 'Diag iDRG', 'Proc iDRG', 'Tarif INA', 'Tarif iDRG', 'Selisih', ...compKeys.map(c=>c.label)];
    const rows = drilldown.data.map((row, i) => {
        const ina = parseFloat(row.TOTAL_TARIF)||0; const idrg = parseFloat(row.IDRG_TOTAL_TARIF)||0; 
        const inaStr = String(row.INACBG || '').trim(); const cl = parseInt(String(row.IDRG_DRG_CODE||'').slice(-1));
        return [ i+1, String(row.NAMA_PASien || row.NAMA_PASIEN || '-'), String(row.MRN || '-'), String(row.SEP || '-'), String(row.DISCHARGE_DATE || '-'), inaStr ? (inaStr.endsWith('-I') ? 1 : inaStr.endsWith('-II') ? 2 : inaStr.endsWith('-III') ? 3 : 0) : 0, isNaN(cl) ? '-' : cl, String(row.INACBG || '-'), String(row.DESKRIPSI_INACBG || '-'), String(row.DIAGLIST || '-'), String(row.PROCLIST || '-'), String(row.IDRG_DRG_CODE || '-'), String(row.IDRG_DRG_DESCRIPTION || '-'), String(row.IDRG_DIAG_LISTS || '-'), String(row.IDRG_PROC_LISTS || '-'), ina, idrg, idrg - ina, ...compKeys.map(c=>extract18(row)[c.key]) ];
    });
    exportToCSV(`Data_Pasien_${drilldown.title}`, headers, rows);
  };

  const getPieSlices = (items) => {
    let slices = []; let cPct = 0;
    [...items].sort((a,b) => (b.value||0) - (a.value||0)).forEach((item) => {
      const val = Number(item.value) || 0; if (val <= 0 || isNaN(val) || !isFinite(val)) return;
      const sA = (cPct * 360) / 100; const slicePct = val; const eA = sA + (slicePct * 360) / 100;
      const x1 = 18 + 18 * Math.cos(Math.PI * (sA - 90) / 180); const y1 = 18 + 18 * Math.sin(Math.PI * (sA - 90) / 180);
      const x2 = 18 + 18 * Math.cos(Math.PI * (eA - 90) / 180); const y2 = 18 + 18 * Math.sin(Math.PI * (eA - 90) / 180);
      const lArc = slicePct > 50 ? 1 : 0; const mid = sA + (slicePct * 360) / 200; const rad = slicePct > 10 ? 12 : 14; 
      slices.push({ path: `M 18 18 L ${x1} ${y1} A 18 18 0 ${lArc} 1 ${x2} ${y2} Z`, color: item.color, labelX: 18 + rad * Math.cos(Math.PI * (mid - 90) / 180), labelY: 18 + rad * Math.sin(Math.PI * (mid - 90) / 180), percentStr: formatPct(slicePct) + '%', isSmall: slicePct < 5 });
      cPct += slicePct;
    });
    if (slices.length === 1 && slices[0].percentStr === '100.0%') { slices[0].path = `M 18 0 A 18 18 0 1 1 17.99 0 Z`; slices[0].labelX = 18; slices[0].labelY = 18; }
    return slices;
  };

  // --- SUB-RENDERERS ---
  const renderUploadTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto mt-8">
      <div className="lg:col-span-2 space-y-6">
        <Card className="p-8 text-center transition-all duration-300 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className={`relative z-10 border-2 border-dashed rounded-xl p-8 transition-colors ${isDragging ? 'border-sky-500 bg-sky-50/50' : 'border-slate-200 hover:border-sky-300'}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform"><UploadCloud className="text-sky-600" size={32} /></div>
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Unggah Data TXT</h3>
            <p className="text-sm text-slate-500 mb-8 mt-2">Tarik dan letakkan file format TXT klaim RS (Tab Separated) ke area ini.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => fileInputRef.current?.click()} className="bg-sky-600 hover:bg-sky-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all shadow-md hover:-translate-y-0.5"><FileText size={18} /> Pilih File TXT</button>
              <button onClick={() => folderInputRef.current?.click()} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all hover:shadow-sm"><Folder size={18} className="text-slate-400" /> Pilih Folder</button>
            </div>
            <input type="file" multiple accept=".txt" ref={fileInputRef} className="hidden" onChange={(e) => { if(e.target.files) processFiles(e.target.files); }} />
            <input type="file" webkitdirectory="true" directory="true" multiple ref={folderInputRef} className="hidden" onChange={(e) => { if(e.target.files) processFiles(e.target.files); }} />
          </div>
        </Card>
        {error && <div className="bg-orange-50 border border-orange-100 text-orange-700 p-4 rounded-xl flex items-start gap-3 text-sm font-medium shadow-sm animate-in zoom-in-95"><AlertCircle size={20} className="shrink-0 text-orange-500" /><p>{String(error)}</p></div>}
      </div>
      <div className="lg:col-span-3">
        <Card className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <div><h3 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2"><Layers className="text-sky-600" size={20}/> Dataset Aktif</h3><p className="text-xs text-slate-500 mt-1">{uploadedFiles.length} file terintegrasi.</p></div>
            {uploadedFiles.length > 0 && <button onClick={clearData} className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"><Trash2 size={16} /> Kosongkan</button>}
          </div>
          {uploadedFiles.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 min-h-[300px]"><Layers size={48} className="opacity-20 mb-4 text-slate-500" /><p className="font-semibold text-slate-500">Belum ada dataset yang diunggah</p><p className="text-xs mt-1 opacity-70">Silakan upload file .txt klaim.</p></div>
          ) : (
            <ul className="space-y-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {uploadedFiles.map((f) => (
                <li key={f.id} className="flex items-center gap-4 text-sm bg-white border border-slate-100 shadow-sm p-4 rounded-xl group hover:border-sky-200 transition-all hover:shadow-md">
                  <div className="w-10 h-10 rounded-full bg-lime-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><CheckCircle size={20} className="text-lime-500" /></div>
                  <div className="flex-1 min-w-0"><p className="truncate text-slate-800 font-bold" title={String(f.path)}>{String(f.name)}</p><p className="text-xs text-slate-500 mt-1">{String(f.size)} • <span className="font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md ml-1">{f.rows.length} records</span></p></div>
                  <button onClick={() => removeFile(f.id)} className="text-slate-400 hover:text-orange-600 p-2 rounded-lg hover:bg-orange-50 transition-colors"><X size={18} /></button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );

  const renderExecutive = () => {
    const isSelPos = dashData.selisihTotal > 0;
    const dp = dashData.dischargeStats, t = dashData.totalRows || 1;
    const dischargePie = [{ value: (dp["1"]/t)*100, color: '#84cc16', label: 'Atas Ijin Dokter' }, { value: (dp["2"]/t)*100, color: '#0ea5e9', label: 'Dirujuk' }, { value: (dp["3"]/t)*100, color: '#f97316', label: 'Pulang APS' }, { value: (dp["4"]/t)*100, color: '#ef4444', label: 'Meninggal' }, { value: (dp["5"]/t)*100, color: '#94a3b8', label: 'Lain-lain' }];
    const selPie = [{ value: t > 0 ? (dashData.cInaHigh/t)*100 : 0, color: '#0ea5e9', label: 'INA > IDRG' }, { value: t > 0 ? (dashData.cIdrgHigh/t)*100 : 0, color: '#f97316', label: 'IDRG > INA' }, { value: t > 0 ? (dashData.cEq/t)*100 : 0, color: '#94a3b8', label: 'Sama Besar' }];

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all group relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-sky-500"></div>
            <div className="flex justify-between items-start mb-4"><p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Total INA-CBG</p><div className="bg-sky-50 p-2 rounded-lg text-sky-600 group-hover:bg-sky-500 group-hover:text-white transition-colors" onClick={() => openDrilldown('Seluruh Data INA-CBG', () => true)}><Search size={16}/></div></div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{formatRp(dashData.tIna)}</h2><p className="text-sm font-medium text-slate-500 mt-2">Rata-rata {formatRp(dashData.rataInacbg)}/ep</p>
          </Card>
          <Card className="p-6 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all group relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
            <div className="flex justify-between items-start mb-4"><p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Total iDRG</p><div className="bg-orange-50 p-2 rounded-lg text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors" onClick={() => openDrilldown('Seluruh Data iDRG', () => true)}><Search size={16}/></div></div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{formatRp(dashData.tIdrg)}</h2><p className="text-sm font-medium text-slate-500 mt-2">Rata-rata {formatRp(dashData.rataIdrg)}/ep</p>
          </Card>
          <Card className="p-6 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all group relative lg:col-span-2">
            <div className={`absolute top-0 left-0 w-full h-1 ${isSelPos ? 'bg-lime-500' : 'bg-orange-500'}`}></div>
            <div className="flex justify-between items-start mb-4"><p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Selisih Finansial Total (iDRG - INA)</p><div className="bg-slate-50 p-2 rounded-lg text-slate-400 group-hover:bg-slate-800 group-hover:text-white transition-colors" onClick={() => openDrilldown('Selisih Total', r => Math.round(parseFloat(r['IDRG_TOTAL_TARIF'])||0) !== Math.round(parseFloat(r['TOTAL_TARIF'])||0))}><Search size={16}/></div></div>
            <div className="flex items-baseline gap-4"><h2 className={`text-4xl font-black tracking-tight ${isSelPos ? 'text-lime-600' : 'text-orange-600'}`}>{isSelPos ? '+' : ''}{formatRp(dashData.selisihTotal)}</h2><div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${isSelPos ? 'bg-lime-100 text-lime-700' : 'bg-orange-100 text-orange-700'}`}>{isSelPos ? <TrendingUp size={16}/> : <TrendingDown size={16}/>} {formatPct(dashData.tIna > 0 ? (Math.abs(dashData.selisihTotal)/dashData.tIna*100) : 0)}%</div></div>
            <p className="text-sm font-medium text-slate-500 mt-2">Potensi {isSelPos ? 'Surplus' : 'Defisit'} terhadap klaim INA-CBG awal.</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 flex flex-col">
            <div className="flex justify-between items-center mb-8"><h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2"><BarChart3 size={18} className="text-sky-500"/> Komparasi Per Bulan</h3><button onClick={() => exportToCSV('Bulan', ['Bulan','RS','INA','IDRG','Selisih'], dashData.monthlyArray.map(m=>[m.label,m.tarifRs,m.inacbg,m.idrg,m.selisih]))} className="text-sky-600 hover:text-sky-800 bg-sky-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">CSV</button></div>
            <div className="w-full h-64 flex flex-col relative px-2">
               <div className="w-full flex items-end border-b border-slate-200 z-0 gap-3" style={{ height: `${dashData.posPct}%` }}>
                 {dashData.monthlyArray.map((m, i) => (
                     <div key={`pos-${i}`} className="flex-1 flex flex-col justify-end items-center h-full z-10 group relative">
                       <div className="opacity-0 group-hover:opacity-100 absolute -top-20 bg-slate-900/95 backdrop-blur text-white text-xs p-3 rounded-xl shadow-xl z-30 pointer-events-none whitespace-nowrap border border-slate-700"><p className="font-extrabold border-b border-slate-700 pb-1.5 mb-1.5 text-slate-100">{String(m.label)}</p><p className="text-slate-400 font-medium">RS: <span className="text-white">{formatRp(m.tarifRs)}</span></p><p className="text-sky-400 font-medium">INA: <span className="text-white">{formatRp(m.inacbg)}</span></p><p className="text-orange-400 font-medium">iDRG: <span className="text-white">{formatRp(m.idrg)}</span></p></div>
                       <div className="w-full max-w-[40px] flex items-end justify-center gap-[2px] h-full relative"><div className="w-1/3 bg-slate-300 rounded-t-sm transition-all" style={{ height: `${Math.max((m.tarifRs/dashData.maxPosVal)*100, 1)}%` }}></div><div className="w-1/3 bg-sky-500 rounded-t-sm shadow-[0_0_8px_rgba(14,165,233,0.5)] transition-all" style={{ height: `${Math.max((m.inacbg/dashData.maxPosVal)*100, 1)}%` }}></div><div className="w-1/3 bg-orange-500 rounded-t-sm shadow-[0_0_8px_rgba(249,115,22,0.5)] transition-all" style={{ height: `${Math.max((m.idrg/dashData.maxPosVal)*100, 1)}%` }}></div></div>
                     </div>
                 ))}
               </div>
               <div className="w-full flex items-start gap-3 relative h-8 mt-3">{dashData.monthlyArray.map((m, i) => <div key={`lbl-${i}`} className="flex-1 flex justify-center text-[10px] font-bold text-slate-500">{String(m.label)}</div>)}</div>
            </div>
            <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div><span className="text-[10px] font-bold text-slate-600 uppercase">Tarif RS</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-sm"></div><span className="text-[10px] font-bold text-slate-600 uppercase">INACBG</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm"></div><span className="text-[10px] font-bold text-slate-600 uppercase">IDRG</span></div>
            </div>
          </Card>
          <Card className="p-6 flex flex-col">
            <h3 className="text-sm font-extrabold text-slate-800 mb-8 uppercase tracking-wider flex items-center gap-2"><Activity size={18} className="text-lime-500"/> Tren Surplus & Defisit iDRG</h3>
            <div className="flex-1 w-full flex items-center justify-between relative px-2 py-4 h-64">
              <div className="absolute left-0 right-0 border-b border-slate-300 border-dashed z-0" style={{ top: '50%' }}></div>
              {dashData.monthlyArray.map((m, idx) => {
                 const isDef = m.selisih < 0; const hPct = dashData.absMaxSelisih > 0 ? (Math.abs(m.selisih) / dashData.absMaxSelisih) * 45 : 0;
                 return (
                    <div key={`sel-${idx}`} className="relative flex flex-col justify-center items-center h-full w-full group cursor-pointer">
                       <div className={`opacity-0 group-hover:opacity-100 transition-opacity absolute ${isDef ? 'bottom-[55%]' : 'top-[55%]'} bg-slate-900/95 backdrop-blur text-white text-xs p-3 rounded-xl shadow-xl z-30 pointer-events-none whitespace-nowrap border border-slate-700`}><p className="font-extrabold border-b border-slate-700 pb-1.5 mb-1.5">{String(m.label)}</p><p className={`font-bold ${isDef ? 'text-orange-400' : 'text-lime-400'}`}>{isDef ? 'Defisit' : 'Surplus'}: <span className="text-white">{formatRp(m.selisih)}</span></p></div>
                       <div className="w-full h-1/2 flex flex-col justify-end items-center pb-[1px] z-10">{!isDef && <div className="w-4 sm:w-8 bg-lime-500 hover:bg-lime-400 transition-all rounded-t-md shadow-sm" style={{ height: `${Math.max(hPct * 2, 1)}%` }}></div>}</div>
                       <div className="w-full h-1/2 flex flex-col justify-start items-center pt-[1px] z-10">{isDef && <div className="w-4 sm:w-8 bg-orange-500 hover:bg-orange-400 transition-all rounded-b-md shadow-sm" style={{ height: `${Math.max(hPct * 2, 1)}%` }}></div>}</div>
                       <span className="absolute bottom-0 text-[10px] font-bold text-slate-500">{String(m.label)}</span>
                    </div>
                 );
              })}
            </div>
            <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div><span className="text-[10px] font-bold text-slate-600 uppercase">Surplus</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div><span className="text-[10px] font-bold text-slate-600 uppercase">Defisit</span></div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 flex flex-col items-center">
            <h3 className="text-sm font-extrabold text-slate-800 mb-6 uppercase tracking-wider w-full text-left">Volume Arah Selisih</h3>
            <div className="relative flex flex-col items-center justify-center mt-2 w-full h-56 cursor-pointer group" onClick={() => openDrilldown('Semua Episode', () => true)}>
              <svg viewBox="0 0 36 36" className="w-56 h-56 group-hover:scale-110 transition-transform duration-500 drop-shadow-xl">{getPieSlices(selPie).map((slice, idx) => (<g key={`psel-${idx}`}><path d={slice.path} fill={slice.color} stroke="white" strokeWidth="0.5" className="hover:opacity-80 transition-opacity" />{!slice.isSmall && <text x={slice.labelX} y={slice.labelY} fill="white" fontSize="2.5" fontWeight="bold" textAnchor="middle" alignmentBaseline="central" className="pointer-events-none drop-shadow-md">{slice.percentStr}</text>}</g>))}</svg>
            </div>
            <div className="mt-8 w-full border-t border-slate-100 pt-6 space-y-3 w-full">
              <div className="flex justify-between items-center p-3 hover:bg-sky-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-sky-100" onClick={() => openDrilldown('Kasus INA-CBG > iDRG', r => Math.round(parseFloat(r.TOTAL_TARIF)||0) > Math.round(parseFloat(r.IDRG_TOTAL_TARIF)||0))}><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-sky-500 shadow-sm"></div><span className="text-xs font-bold text-slate-700">INACBG {'>'} IDRG</span></div><div className="text-right"><span className="text-sm font-extrabold text-sky-600 mr-2">{dashData.cInaHigh.toLocaleString()} <span className="text-[10px] text-sky-500 uppercase">Kasus</span></span><span className="text-xs font-bold text-slate-400">({formatPct(t > 0 ? (dashData.cInaHigh/t)*100 : 0)}%)</span></div></div>
              <div className="flex justify-between items-center p-3 hover:bg-orange-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-orange-100" onClick={() => openDrilldown('Kasus iDRG > INA-CBG', r => Math.round(parseFloat(r.IDRG_TOTAL_TARIF)||0) > Math.round(parseFloat(r.TOTAL_TARIF)||0))}><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm"></div><span className="text-xs font-bold text-slate-700">IDRG {'>'} INACBG</span></div><div className="text-right"><span className="text-sm font-extrabold text-orange-600 mr-2">{dashData.cIdrgHigh.toLocaleString()} <span className="text-[10px] text-orange-500 uppercase">Kasus</span></span><span className="text-xs font-bold text-slate-400">({formatPct(t > 0 ? (dashData.cIdrgHigh/t)*100 : 0)}%)</span></div></div>
              <div className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-200" onClick={() => openDrilldown('Kasus Sama Besar', r => Math.round(parseFloat(r.IDRG_TOTAL_TARIF)||0) === Math.round(parseFloat(r.TOTAL_TARIF)||0))}><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-slate-400 shadow-sm"></div><span className="text-xs font-bold text-slate-700">Sama Besar (Sesuai)</span></div><div className="text-right"><span className="text-sm font-extrabold text-slate-600 mr-2">{dashData.cEq.toLocaleString()} <span className="text-[10px] text-slate-400 uppercase">Kasus</span></span><span className="text-xs font-bold text-slate-400">({formatPct(t > 0 ? (dashData.cEq/t)*100 : 0)}%)</span></div></div>
            </div>
          </Card>
          <Card className="p-6 flex flex-col items-center">
            <h3 className="text-sm font-extrabold text-slate-800 mb-6 uppercase tracking-wider w-full text-left">Status Cara Pulang</h3>
            <div className="relative flex flex-col items-center justify-center mt-2 w-full h-56 cursor-pointer group" onClick={() => openDrilldown('Semua Episode', () => true)}>
              <svg viewBox="0 0 36 36" className="w-56 h-56 group-hover:scale-110 transition-transform duration-500 drop-shadow-xl">{getPieSlices(dischargePie).map((slice, idx) => (<g key={`pdis-${idx}`}><path d={slice.path} fill={slice.color} stroke="white" strokeWidth="0.5" className="hover:opacity-80 transition-opacity" />{!slice.isSmall && <text x={slice.labelX} y={slice.labelY} fill="white" fontSize="2.5" fontWeight="bold" textAnchor="middle" alignmentBaseline="central" className="pointer-events-none drop-shadow-md">{slice.percentStr}</text>}</g>))}</svg>
            </div>
            <div className="mt-8 w-full border-t border-slate-100 pt-6 grid grid-cols-2 gap-3">
              {dischargePie.map((item, i) => (
                <div key={`ditem-${i}`} className="flex flex-col p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-200" onClick={() => openDrilldown(`Status Pulang: ${item.label}`, r => { let d = String(r.DISCHARGE_STATUS || r.STATUS_PULANG || r.CARA_PULANG || '').trim(); return item.label==='Lain-lain' ? (!['1','2','3','4'].includes(d)) : d === String(i+1); })}>
                  <div className="flex items-center gap-2 mb-1"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color}}></div><span className="text-[10px] font-extrabold text-slate-500 uppercase truncate">{item.label}</span></div>
                  <span className="text-sm font-black" style={{color: item.color}}>{formatPct(item.value)}% <span className="text-[10px] font-semibold text-slate-400 ml-1">({dp[String(i+1)] || dp["5"]})</span></span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="flex flex-col mb-8 text-center items-center justify-center">
             <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center mb-4"><Layers size={24} className="text-sky-600"/></div>
             <h2 className="text-2xl font-black text-slate-800 tracking-tight">Top 10 Analisis Klinis & Finansial</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="flex flex-col hover:shadow-lg transition-all"><div className="p-4 bg-sky-50 border-b border-sky-100 flex items-center gap-2"><Stethoscope size={16} className="text-sky-600"/><h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Top 10 Diag. Utama</h3></div><MiniTable data={dashData.topDiagUtama} columns={[{header:'No', className:'w-8 text-center text-slate-400 font-bold', render:(r,i)=>i+1}, {header:'Kode', className:'font-extrabold text-slate-700', render:(r)=>r[0]}, {header:'Kasus', className:'text-right font-black text-sky-600', render:(r)=>r[1].toLocaleString()}]} /></Card>
            <Card className="flex flex-col hover:shadow-lg transition-all"><div className="p-4 bg-sky-50 border-b border-sky-100 flex items-center gap-2"><Stethoscope size={16} className="text-sky-600"/><h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Top 10 Diag. Sekunder</h3></div><MiniTable data={dashData.topDiagSekunder} columns={[{header:'No', className:'w-8 text-center text-slate-400 font-bold', render:(r,i)=>i+1}, {header:'Kode', className:'font-extrabold text-slate-700', render:(r)=>r[0]}, {header:'Kasus', className:'text-right font-black text-sky-600', render:(r)=>r[1].toLocaleString()}]} /></Card>
            <Card className="flex flex-col hover:shadow-lg transition-all"><div className="p-4 bg-sky-50 border-b border-sky-100 flex items-center gap-2"><ActivitySquare size={16} className="text-sky-600"/><h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Top 10 Tindakan</h3></div><MiniTable data={dashData.topProc} columns={[{header:'No', className:'w-8 text-center text-slate-400 font-bold', render:(r,i)=>i+1}, {header:'Kode', className:'font-extrabold text-slate-700', render:(r)=>r[0]}, {header:'Kasus', className:'text-right font-black text-sky-600', render:(r)=>r[1].toLocaleString()}]} /></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="flex flex-col hover:shadow-lg transition-all relative">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-lime-50/50"><div className="p-2 bg-lime-100 rounded-xl text-green-700"><TrendingUp size={18}/></div><div><h3 className="font-extrabold text-slate-800 tracking-tight">Top 10 Surplus INA-CBG</h3></div></div>
              <MiniTable data={dashData.topSurplusIna} columns={[{header:'No', className:'text-center text-slate-400 font-bold w-8', render:(r,i)=>i+1}, {header:'Kode', className:'font-extrabold text-slate-700', render:(r)=>r.code}, {header:'Kasus', className:'text-center font-bold text-slate-600', render:(r)=>r.count}, {header:'Surplus', className:'text-right font-black text-green-600', render:(r)=>`+${formatRp(r.totalSelisih)}`}]} onRowClick={r => openDrilldown(`Surplus INA: ${r.code}`, row => String(row.INACBG).trim() === r.code && (parseFloat(row.TOTAL_TARIF)||0) - (parseFloat(row.TARIF_RS)||parseFloat(row.BIAYA_RS)||0) > 0)} />
            </Card>
            <Card className="flex flex-col hover:shadow-lg transition-all relative">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-orange-50/50"><div className="p-2 bg-orange-100 rounded-xl text-orange-700"><TrendingDown size={18}/></div><div><h3 className="font-extrabold text-slate-800 tracking-tight">Top 10 Defisit INA-CBG</h3></div></div>
              <MiniTable data={dashData.topDefisitIna} columns={[{header:'No', className:'text-center text-slate-400 font-bold w-8', render:(r,i)=>i+1}, {header:'Kode', className:'font-extrabold text-slate-700', render:(r)=>r.code}, {header:'Kasus', className:'text-center font-bold text-slate-600', render:(r)=>r.count}, {header:'Defisit', className:'text-right font-black text-orange-600', render:(r)=>formatRp(r.totalSelisih)}]} onRowClick={r => openDrilldown(`Defisit INA: ${r.code}`, row => String(row.INACBG).trim() === r.code && (parseFloat(row.TOTAL_TARIF)||0) - (parseFloat(row.TARIF_RS)||parseFloat(row.BIAYA_RS)||0) < 0)} />
            </Card>
            <Card className="flex flex-col hover:shadow-lg transition-all relative">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-lime-50/50"><div className="p-2 bg-lime-100 rounded-xl text-green-700"><TrendingUp size={18}/></div><div><h3 className="font-extrabold text-slate-800 tracking-tight">Top 10 Surplus iDRG</h3></div></div>
              <MiniTable data={dashData.topSurplus} columns={[{header:'No', className:'text-center text-slate-400 font-bold w-8', render:(r,i)=>i+1}, {header:'Kode', className:'font-extrabold text-slate-700', render:(r)=>r.code}, {header:'Kasus', className:'text-center font-bold text-slate-600', render:(r)=>r.count}, {header:'Surplus', className:'text-right font-black text-green-600', render:(r)=>`+${formatRp(r.totalSelisih)}`}]} onRowClick={r => openDrilldown(`Surplus iDRG: ${r.code}`, row => String(row.IDRG_DRG_CODE).trim() === r.code && (parseFloat(row.IDRG_TOTAL_TARIF)||0) - (parseFloat(row.TOTAL_TARIF)||0) > 0)} />
            </Card>
            <Card className="flex flex-col hover:shadow-lg transition-all relative">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-orange-50/50"><div className="p-2 bg-orange-100 rounded-xl text-orange-700"><TrendingDown size={18}/></div><div><h3 className="font-extrabold text-slate-800 tracking-tight">Top 10 Defisit iDRG</h3></div></div>
              <MiniTable data={dashData.topDefisit} columns={[{header:'No', className:'text-center text-slate-400 font-bold w-8', render:(r,i)=>i+1}, {header:'Kode', className:'font-extrabold text-slate-700', render:(r)=>r.code}, {header:'Kasus', className:'text-center font-bold text-slate-600', render:(r)=>r.count}, {header:'Defisit', className:'text-right font-black text-orange-600', render:(r)=>formatRp(r.totalSelisih)}]} onRowClick={r => openDrilldown(`Defisit iDRG: ${r.code}`, row => String(row.IDRG_DRG_CODE).trim() === r.code && (parseFloat(row.IDRG_TOTAL_TARIF)||0) - (parseFloat(row.TOTAL_TARIF)||0) < 0)} />
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderReport = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader icon={Table2} title="Laporan Tabel Klaim" desc="Rekapitulasi komprehensif jumlah kasus dan nominal klaim INA-CBG vs iDRG per bulan layanan." colorClass="bg-sky-50 text-sky-600" highlightClass="bg-sky-500/5" exportAction={() => exportToCSV('Laporan', ['Bulan', 'Tarif RS', 'Kasus Rajal (INA)', 'Kasus Ranap (INA)', 'Total Kasus (INA)', 'Tarif Rajal (INA)', 'Tarif Ranap (INA)', 'Total Tarif (INA)', 'Kasus Rajal (iDRG)', 'Kasus Ranap (iDRG)', 'Total Kasus (iDRG)', 'Tarif Rajal (iDRG)', 'Tarif Ranap (iDRG)', 'Total Tarif (iDRG)'], dashData.reportArray.map(m => [m.label, m.tarifRsTotal, m.kasusRajal, m.kasusRanap, m.kasusRajal+m.kasusRanap, m.inaRajal, m.inaRanap, m.inaRajal+m.inaRanap, m.kasusRajal, m.kasusRanap, m.kasusRajal+m.kasusRanap, m.idrgRajal, m.idrgRanap, m.idrgRajal+m.idrgRanap]))} exportText="Ekspor CSV Klaim"/>
        <Card className="overflow-x-auto p-2 custom-scrollbar max-h-[600px]">
          <table className="w-full text-xs text-center border-collapse whitespace-nowrap">
            <thead className="text-[10px] uppercase font-bold tracking-wider sticky top-0 z-10">
              <tr>
                <th rowSpan={3} className="bg-slate-50 text-slate-500 border-b border-r border-slate-200 p-3">NO</th><th rowSpan={3} className="bg-slate-50 text-slate-500 border-b border-r border-slate-200 p-3">BULAN LAYANAN</th><th rowSpan={3} className="bg-slate-50 text-slate-500 border-b border-r border-slate-200 p-3">Tarif RS (Cost)</th>
                <th colSpan={6} className="bg-sky-50 text-sky-700 border-b border-r border-sky-100 p-3">Klaim INA CBG</th><th colSpan={6} className="bg-orange-50 text-orange-700 border-b border-orange-100 p-3">Klaim iDRG</th>
              </tr>
              <tr>
                <th colSpan={3} className="bg-sky-100/50 text-sky-600 border-b border-r border-sky-100 p-2">KASUS</th><th colSpan={3} className="bg-sky-100/50 text-sky-600 border-b border-r border-sky-100 p-2">Penerimaan INACBG (Rp)</th>
                <th colSpan={3} className="bg-orange-100/50 text-orange-600 border-b border-r border-orange-100 p-2">JUMLAH KASUS iDRG</th><th colSpan={3} className="bg-orange-100/50 text-orange-600 border-b border-orange-100 p-2">TOTAL KLAIM iDRG (Rp)</th>
              </tr>
              <tr>
                <th className="bg-sky-50/50 text-sky-500 border-b border-r border-sky-100 p-2">RJ</th><th className="bg-sky-50/50 text-sky-500 border-b border-r border-sky-100 p-2">RI</th><th className="bg-sky-100/80 text-sky-700 border-b border-r border-sky-100 p-2">TOT</th>
                <th className="bg-sky-50/50 text-sky-500 border-b border-r border-sky-100 p-2">RJ</th><th className="bg-sky-50/50 text-sky-500 border-b border-r border-sky-100 p-2">RI</th><th className="bg-sky-100/80 text-sky-700 border-b border-r border-sky-100 p-2">TOT</th>
                <th className="bg-orange-50/50 text-orange-500 border-b border-r border-orange-100 p-2">RJ</th><th className="bg-orange-50/50 text-orange-500 border-b border-r border-orange-100 p-2">RI</th><th className="bg-orange-100/80 text-orange-700 border-b border-r border-orange-100 p-2">TOT</th>
                <th className="bg-orange-50/50 text-orange-500 border-b border-r border-orange-100 p-2">RJ</th><th className="bg-orange-50/50 text-orange-500 border-b border-r border-orange-100 p-2">RI</th><th className="bg-orange-100/80 text-orange-700 border-b border-orange-100 p-2">TOT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {dashData.reportArray.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="border-r border-slate-100 p-3 font-semibold text-slate-400">{i + 1}</td>
                  <td className="border-r border-slate-100 p-3 font-bold text-slate-700">{row.label}</td>
                  <td className="border-r border-slate-100 p-3 text-right font-semibold text-slate-600">{formatRpEx(row.tarifRsTotal)}</td>
                  
                  <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-sky-50/10">{row.kasusRajal.toLocaleString()}</td>
                  <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-sky-50/10">{row.kasusRanap.toLocaleString()}</td>
                  <td className="border-r border-sky-50 p-3 text-right font-black text-sky-600 bg-sky-50/40">{(row.kasusRajal + row.kasusRanap).toLocaleString()}</td>
                  <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-sky-50/10">{formatRpEx(row.inaRajal)}</td>
                  <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-sky-50/10">{formatRpEx(row.inaRanap)}</td>
                  <td className="border-r border-sky-100 p-3 text-right font-black text-sky-600 bg-sky-50/40">{formatRpEx(row.inaRajal + row.inaRanap)}</td>

                  <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-orange-50/10">{row.kasusRajal.toLocaleString()}</td>
                  <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-orange-50/10">{row.kasusRanap.toLocaleString()}</td>
                  <td className="border-r border-orange-50 p-3 text-right font-black text-orange-600 bg-orange-50/40">{(row.kasusRajal + row.kasusRanap).toLocaleString()}</td>
                  <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-orange-50/10">{formatRpEx(row.idrgRajal)}</td>
                  <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-orange-50/10">{formatRpEx(row.idrgRanap)}</td>
                  <td className="p-3 text-right font-black text-orange-600 bg-orange-50/40">{formatRpEx(row.idrgRajal + row.idrgRanap)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800 text-white font-bold text-sm">
                <td colSpan={2} className="p-4 text-center uppercase tracking-widest text-[10px]">Total</td>
                <td className="p-4 text-right">{formatRpEx(dashData.reportArray.reduce((s,i)=>s+i.tarifRsTotal,0))}</td>
                <td className="p-4 text-right bg-sky-900/40">{dashData.reportArray.reduce((s,i)=>s+i.kasusRajal,0).toLocaleString()}</td>
                <td className="p-4 text-right bg-sky-900/40">{dashData.reportArray.reduce((s,i)=>s+i.kasusRanap,0).toLocaleString()}</td>
                <td className="p-4 text-right text-sky-300 bg-sky-900/80">{dashData.reportArray.reduce((s,i)=>s+i.kasusRajal+i.kasusRanap,0).toLocaleString()}</td>
                <td className="p-4 text-right bg-sky-900/40">{formatRpEx(dashData.reportArray.reduce((s,i)=>s+i.inaRajal,0))}</td>
                <td className="p-4 text-right bg-sky-900/40">{formatRpEx(dashData.reportArray.reduce((s,i)=>s+i.inaRanap,0))}</td>
                <td className="p-4 text-right text-sky-300 bg-sky-900/80">{formatRpEx(dashData.reportArray.reduce((s,i)=>s+i.inaRajal+i.inaRanap,0))}</td>
                <td className="p-4 text-right bg-orange-900/40">{dashData.reportArray.reduce((s,i)=>s+i.kasusRajal,0).toLocaleString()}</td>
                <td className="p-4 text-right bg-orange-900/40">{dashData.reportArray.reduce((s,i)=>s+i.kasusRanap,0).toLocaleString()}</td>
                <td className="p-4 text-right text-orange-300 bg-orange-900/80">{dashData.reportArray.reduce((s,i)=>s+i.kasusRajal+i.kasusRanap,0).toLocaleString()}</td>
                <td className="p-4 text-right bg-orange-900/40">{formatRpEx(dashData.reportArray.reduce((s,i)=>s+i.idrgRajal,0))}</td>
                <td className="p-4 text-right bg-orange-900/40">{formatRpEx(dashData.reportArray.reduce((s,i)=>s+i.idrgRanap,0))}</td>
                <td className="p-4 text-right text-orange-300 bg-orange-900/80">{formatRpEx(dashData.reportArray.reduce((s,i)=>s+i.idrgRajal+i.idrgRanap,0))}</td>
              </tr>
            </tfoot>
          </table>
        </Card>
      </div>
  );

  const renderRekap = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <SectionHeader icon={Layers} title="Rekap Kasus & Tarif" desc="Data Rekapitulasi penuh 100% INA-CBG dan iDRG beserta selisih per kode base." colorClass="bg-orange-50 text-orange-500" highlightClass="bg-orange-500/5" />
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="flex flex-col">
              <div className="p-5 border-b border-sky-100 flex items-center justify-between bg-sky-50/50"><h3 className="font-extrabold text-sky-800">Tabel Rekap INA-CBG</h3><button onClick={() => exportToCSV('Data_Rekap_INA', ['Kode', 'Deskripsi', 'Kasus', 'Tarif RS', 'Tarif INA', 'Selisih'], dashData.inaSummary.map(r=>[r.code, r.desc, r.count, r.sumRS, r.sumIna, r.totalSelisih]))} className="text-xs bg-white text-sky-600 border border-sky-200 px-3 py-1.5 rounded-lg shadow-sm font-bold">CSV</button></div>
              <MiniTable maxHeight="600px" data={dashData.inaSummary} columns={[{header:'Kode', className:'font-bold text-sky-700', render:r=>r.code},{header:'Deskripsi', className:'text-slate-500 max-w-[200px] truncate', render:r=>r.desc},{header:'Kasus', className:'text-center font-bold text-slate-700 bg-slate-50', render:r=>r.count.toLocaleString()},{header:'Selisih', className:'text-right font-black', render:r=><span className={r.totalSelisih>0?'text-lime-600':r.totalSelisih<0?'text-orange-500':'text-slate-400'}>{formatRp(r.totalSelisih)}</span>}]} onRowClick={r => openDrilldown(`Rekap INA-CBG: ${r.code}`, row => String(row.INACBG).trim() === r.code)} />
            </Card>
            <Card className="flex flex-col">
              <div className="p-5 border-b border-orange-100 flex items-center justify-between bg-orange-50/50"><h3 className="font-extrabold text-orange-800">Tabel Rekap iDRG</h3><button onClick={() => exportToCSV('Data_Rekap_iDRG', ['Kode', 'Deskripsi', 'Kasus', 'Tarif RS', 'Tarif iDRG', 'Selisih'], dashData.drgSummary.map(r=>[r.code, r.desc, r.count, r.sumRS, r.sumIdrg, r.totalSelisih]))} className="text-xs bg-white text-orange-600 border border-orange-200 px-3 py-1.5 rounded-lg shadow-sm font-bold">CSV</button></div>
              <MiniTable maxHeight="600px" data={dashData.drgSummary} columns={[{header:'Kode', className:'font-bold text-orange-700', render:r=>r.code},{header:'Deskripsi', className:'text-slate-500 max-w-[200px] truncate', render:r=>r.desc},{header:'Kasus', className:'text-center font-bold text-slate-700 bg-slate-50', render:r=>r.count.toLocaleString()},{header:'Selisih', className:'text-right font-black', render:r=><span className={r.totalSelisih>0?'text-lime-600':r.totalSelisih<0?'text-orange-500':'text-slate-400'}>{formatRp(r.totalSelisih)}</span>}]} onRowClick={r => openDrilldown(`Rekap iDRG: ${r.code}`, row => String(row.IDRG_DRG_CODE).trim() === r.code)} />
            </Card>
         </div>
      </div>
  );

  const renderDpjp = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader icon={User} title="Analisis Performa DPJP" desc="Laporan performa dokter, jumlah kasus, selisih tarif finansial, dan Rincian Komponen." colorClass="bg-sky-50 text-sky-600" highlightClass="bg-sky-500/5" exportAction={() => exportToCSV('Data_DPJP', ['Nama DPJP', 'Jumlah Kasus', 'Tarif RS', 'Tarif INA', 'Tarif iDRG', 'Selisih INA-RS', 'Selisih iDRG-RS', 'Selisih iDRG-INA', ...compKeys.map(c=>c.label)], dashData.dpjpSummaryArray.map(r => [r.name, r.count, r.sumRS, r.sumIna, r.sumIdrg, r.sumIna-r.sumRS, r.sumIdrg-r.sumRS, r.sumIdrg-r.sumIna, ...compKeys.map(c=>r.comps[c.key])]))} exportText="Ekspor CSV DPJP"/>
        <Card className="overflow-hidden flex flex-col">
          <div className="overflow-x-auto custom-scrollbar max-h-[600px]">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-500 sticky top-0 z-20">
                <tr>
                  <th rowSpan={2} className="p-4 border-r border-slate-200 align-middle">Nama DPJP</th><th rowSpan={2} className="p-4 border-r border-slate-200 text-center align-middle">Kasus</th><th rowSpan={2} className="p-4 border-r border-slate-200 text-right align-middle">Tarif RS</th>
                  <th rowSpan={2} className="p-4 bg-sky-50/80 text-sky-700 border-r border-sky-100 text-right align-middle">Tarif INA</th><th rowSpan={2} className="p-4 bg-orange-50/80 text-orange-700 border-r border-orange-100 text-right align-middle">Tarif iDRG</th><th rowSpan={2} className="p-4 bg-lime-50/80 text-green-700 border-r border-lime-100 text-right align-middle">Selisih iDRG-INA</th>
                  <th colSpan={18} className="p-3 bg-slate-800 text-white border-b border-slate-700 text-center tracking-[0.2em]">18 Komponen Billing (Rp)</th>
                </tr>
                <tr className="bg-slate-700 text-slate-300 text-[10px]">{compKeys.map(c => <th key={c.key} className="p-2.5 border-b border-r border-slate-600 text-right">{c.label}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {dashData.dpjpSummaryArray.map((row, i) => {
                  const sIna = row.sumIdrg - row.sumIna;
                  return (
                    <tr key={i} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => openDrilldown(`Analisis DPJP: ${row.name}`, r => normDpjp(r.DPJP) === row.normName)}>
                      <td className="p-4 font-extrabold text-slate-800 border-r border-slate-50 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10">{row.name}</td>
                      <td className="p-4 text-center font-black text-slate-600 border-r border-slate-50 bg-slate-50/50">{row.count.toLocaleString()}</td>
                      <td className="p-4 text-right font-bold text-slate-600 border-r border-slate-50">{formatRp(row.sumRS)}</td>
                      <td className="p-4 text-right font-black text-sky-600 border-r border-slate-50 bg-sky-50/20">{formatRp(row.sumIna)}</td>
                      <td className="p-4 text-right font-black text-orange-600 border-r border-slate-50 bg-orange-50/20">{formatRp(row.sumIdrg)}</td>
                      <td className={`p-4 text-right font-black border-r border-slate-50 bg-lime-50/10 ${sIna>0?'text-emerald-600':sIna<0?'text-orange-500':'text-slate-400'}`}>{formatRp(sIna)}</td>
                      {compKeys.map(c => <td key={c.key} className="p-4 text-right text-[11px] font-medium text-slate-500 border-r border-slate-50">{formatRpEx(row.comps[c.key])}</td>)}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
  );

  const renderPemetaan = () => {
    const inaKeys = Object.keys(dashData.inaToIdrgMap).sort();
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
        <SectionHeader icon={GitMerge} title="Pemetaan INA-CBG ke iDRG" desc="Melihat distribusi kode dasar INA-CBG terhadap variasi *Complexity Level* iDRG beserta pemicu Diagnosa Sekundernya." colorClass="bg-sky-50 text-sky-600" highlightClass="bg-sky-500/5" exportAction={()=>exportToCSV('Pemetaan', ['Kode INA', 'Deskripsi INA', 'iDRG Terpetakan', 'Jumlah Kasus', 'Diagnosa Sekunder Penyerta'], inaKeys.flatMap(ina => Object.entries(dashData.inaToIdrgMap[ina].targets).map(([idrg, data]) => [ina, dashData.inaToIdrgMap[ina].desc, idrg, data.count, Object.entries(data.secDiags).sort((a,b)=>b[1]-a[1]).map(d=>`${d[0]}(${d[1]})`).join(', ')])))} />
        <Card>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-500"><tr><th className="p-5 w-1/3 border-r border-slate-200">Kode INA-CBG Asal</th><th className="p-5">Distribusi Pemetaan iDRG & Diagnosa Sekunder</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {inaKeys.slice(0, 100).map((ina, idx) => (
                <tr key={`map-${idx}`} className="hover:bg-slate-50 cursor-pointer transition-colors group" onClick={() => openDrilldown(`Pemetaan Kasus INA-CBG: ${ina}`, r => String(r.INACBG).trim() === ina)}>
                  <td className="p-5 align-top border-r border-slate-50"><span className="font-black text-sky-600 block text-base">{String(ina)}</span><span className="text-xs font-medium text-slate-500 mt-1 block leading-relaxed">{String(dashData.inaToIdrgMap[ina].desc)}</span></td>
                  <td className="p-5">
                    <div className="flex flex-col gap-3">
                      {Object.entries(dashData.inaToIdrgMap[ina].targets).sort((a,b)=>b[1].count-a[1].count).map(([idrg, data], j) => (
                        <div key={`idrg-${j}`} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:border-sky-300">
                           <div className="flex flex-wrap items-center gap-2 mb-2"><span className="bg-orange-500 text-white px-2.5 py-1 rounded-lg text-xs font-black shadow-sm">{idrg.split(' ')[0]}</span><span className="text-xs font-bold text-slate-700 flex-1">{idrg.substring(idrg.indexOf(' ') + 1)}</span><span className="text-[10px] font-black uppercase text-sky-700 bg-sky-100 px-2 py-1 rounded-md">{data.count} Kasus</span></div>
                           <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2"><p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Stethoscope size={10}/> Diagnosa Sekunder Penyerta</p><div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">{Object.entries(data.secDiags).length === 0 ? <span className="text-[10px] text-slate-400 italic">Tanpa diag sekunder</span> : Object.entries(data.secDiags).sort((a,b)=>b[1]-a[1]).map((sd, k) => (<span key={`sd-${k}`} className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm hover:bg-slate-100">{sd[0]} <span className="text-slate-400 font-semibold ml-0.5">({sd[1]})</span></span>))}</div></div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  };

  const renderKetepatan = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader icon={FileCode} title="Akurasi & Ketepatan Koding" desc="Evaluasi discrepancy antara koding INA-CBG dan iDRG menggunakan Fuzzy Logic Match." colorClass="bg-emerald-50 text-emerald-600" highlightClass="bg-emerald-500/5" exportAction={() => exportToCSV('Data_Ketidaksesuaian_Koding', ['MRN', 'SEP', 'Diag INA', 'Diag iDRG', 'Proc INA', 'Proc iDRG'], dashData.scorecard.discrepancies.map(d => [d.mrn, d.sep, d.diag1.join(", "), d.diag2.join(", "), d.proc1.join(", "), d.proc2.join(", ")]))} exportText="Ekspor Kasus Discrepancy" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 flex items-center gap-5">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm ${dashData.scorecard.avgDiag >= 99.5 ? 'bg-lime-50 text-green-600 border border-lime-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>{(dashData.scorecard.avgDiag || 0).toFixed(1)}<span className="text-sm ml-0.5">%</span></div>
            <div><p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest mb-1">Akurasi Fuzzy</p><h2 className="text-xl font-black text-slate-800 tracking-tight">Kesesuaian Diagnosa</h2></div>
          </Card>
          <Card className="p-6 flex items-center gap-5">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm ${dashData.scorecard.avgProc >= 99.5 ? 'bg-lime-50 text-green-600 border border-lime-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>{(dashData.scorecard.avgProc || 0).toFixed(1)}<span className="text-sm ml-0.5">%</span></div>
            <div><p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest mb-1">Akurasi Fuzzy</p><h2 className="text-xl font-black text-slate-800 tracking-tight">Kesesuaian Prosedur</h2></div>
          </Card>
        </div>
        <Card className="flex flex-col">
          <div className="p-6 bg-slate-50/50 border-b border-slate-200"><h3 className="text-base font-extrabold text-slate-800 tracking-tight">Log Ketidaksesuaian Koding ({dashData.scorecard.discrepancies.length} Kasus)</h3></div>
          <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="bg-white border-b border-slate-200 text-[10px] uppercase font-extrabold tracking-wider text-slate-400 sticky top-0 z-10"><tr><th className="p-4 border-r border-slate-100 w-48">Pasien (MRN / SEP)</th><th className="p-4 border-r border-slate-100 w-[35%]">Komparasi Diagnosa</th><th className="p-4 w-[35%]">Komparasi Prosedur</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {dashData.scorecard.discrepancies.slice(0,100).map((d, i) => (
                  <tr key={`disc-${i}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 align-top border-r border-slate-50">
                      <span className="font-extrabold text-slate-800 block text-base">{String(d.mrn)}</span>
                      <span className="text-[11px] font-mono font-medium text-slate-500 mt-1 block">{String(d.sep)}</span>
                    </td>
                    <td className="p-4 align-top border-r border-slate-50">
                      {d.scoreDiag < 100 ? (
                        <div className="space-y-4">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                             <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Terinput di INA-CBG:</span>
                             <div className="flex flex-wrap gap-1.5">{d.diag1.map((c, idx)=><span key={`d1-${i}-${idx}`} className={`px-2 py-1 rounded-md text-xs font-bold ${!d.diag2.includes(c)?'bg-orange-100 text-orange-700 border border-orange-200':'bg-white border border-slate-200 text-slate-600'}`}>{String(c)}</span>)}</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                             <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Terinput di iDRG:</span>
                             <div className="flex flex-wrap gap-1.5">{d.diag2.map((c, idx)=><span key={`d2-${i}-${idx}`} className={`px-2 py-1 rounded-md text-xs font-bold ${!d.diag1.includes(c)?'bg-orange-100 text-orange-700 border border-orange-200':'bg-white border border-slate-200 text-slate-600'}`}>{String(c)}</span>)}</div>
                          </div>
                        </div>
                      ) : <div className="h-full w-full flex items-center justify-center p-4 bg-lime-50/50 rounded-xl border border-lime-100"><span className="text-green-600 font-extrabold flex items-center gap-2"><CheckCircle size={18}/> Sangat Sesuai (100%)</span></div>}
                    </td>
                    <td className="p-4 align-top">
                      {d.scoreProc < 100 ? (
                        <div className="space-y-4">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                             <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Terinput di INA-CBG:</span>
                             <div className="flex flex-wrap gap-1.5">{d.proc1.map((c, idx)=><span key={`p1-${i}-${idx}`} className={`px-2 py-1 rounded-md text-xs font-bold ${!d.proc2.includes(c)?'bg-orange-100 text-orange-700 border border-orange-200':'bg-white border border-slate-200 text-slate-600'}`}>{String(c)}</span>)}</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                             <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Terinput di iDRG:</span>
                             <div className="flex flex-wrap gap-1.5">{d.proc2.map((c, idx)=><span key={`p2-${i}-${idx}`} className={`px-2 py-1 rounded-md text-xs font-bold ${!d.proc1.includes(c)?'bg-orange-100 text-orange-700 border border-orange-200':'bg-white border border-slate-200 text-slate-600'}`}>{String(c)}</span>)}</div>
                          </div>
                        </div>
                      ) : <div className="h-full w-full flex items-center justify-center p-4 bg-lime-50/50 rounded-xl border border-lime-100"><span className="text-green-600 font-extrabold flex items-center gap-2"><CheckCircle size={18}/> Sangat Sesuai (100%)</span></div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
  );
  
  const renderAudit = () => {
    const filtered = dashData.auditFindings.filter(f => auditFilter === '' ? true : f.case === auditFilter);
    const grouped = filtered.reduce((acc, curr) => { if(!acc[curr.ruleId]) acc[curr.ruleId] = { ruleId: curr.ruleId, case: curr.case, warning: curr.warning, items: [] }; acc[curr.ruleId].items.push(curr); return acc; }, {});
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader icon={CheckSquare} title="Audit Aturan Koding" desc="Sistem mengevaluasi otomatis episode terhadap kaidah standar INA-CBG/BPJS." colorClass="bg-orange-50 text-orange-600" highlightClass="bg-orange-500/5" exportAction={() => exportToCSV('Data_Temuan_Audit', ['Rule ID', 'Kasus', 'Warning', 'MRN', 'SEP', 'Kode Trigger'], filtered.map(f => [f.ruleId, f.case, f.warning, f.mrn, f.sep, f.codes]))} />
        <div className="flex items-center gap-4 bg-white border border-orange-100 p-5 rounded-2xl shadow-sm"><div className="bg-orange-50 p-3 rounded-xl"><AlertTriangle size={24} className="text-orange-600"/></div><div className="flex-1"><h3 className="font-extrabold text-slate-800 text-base">Filter Anomali:</h3><select value={auditFilter} onChange={(e) => setAuditFilter(e.target.value)} className="mt-2 w-full p-2 border border-slate-200 rounded text-sm font-bold text-slate-700 bg-slate-50"><option value="">-- Semua Pelanggaran ({filtered.length} Kasus) --</option>{DEFAULT_AUDIT_RULES.map(r => <option key={r.id} value={r.case}>{r.id} - {r.case}</option>)}</select></div></div>
        <div className="space-y-5">
          {Object.values(grouped).map((g, i) => (
            <Card key={`group-${i}`} className="group">
              <div className="p-6 bg-gradient-to-r from-orange-50/50 to-transparent border-b border-orange-100 flex justify-between items-start">
                <div><span className="text-[10px] font-black bg-orange-600 text-white px-2.5 py-1 rounded-md uppercase tracking-widest">{String(g.ruleId)}</span><h3 className="text-lg font-black text-slate-800 mt-3">{String(g.case)}</h3><p className="text-sm text-orange-700 font-semibold mt-2 flex items-start gap-2"><Zap size={16}/> {String(g.warning)}</p></div>
                <div className="text-right bg-white border border-slate-100 rounded-xl px-5 py-3 shadow-sm min-w-[120px]"><span className="text-3xl font-black text-orange-600">{g.items.length}</span><p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Kasus Terdampak</p></div>
              </div>
              <div className="max-h-72 overflow-y-auto custom-scrollbar"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-[10px] uppercase font-extrabold tracking-wider text-slate-400 sticky top-0"><tr><th className="px-6 py-3 w-40">MRN</th><th className="px-6 py-3 w-56">SEP</th><th className="px-6 py-3">Kode Terekam</th></tr></thead><tbody className="divide-y divide-slate-100">{g.items.map((item, idx) => (<tr key={`item-${idx}`} className="hover:bg-orange-50/30"><td className="px-6 py-3 font-bold text-slate-800">{String(item.mrn)}</td><td className="px-6 py-3 font-mono text-xs font-semibold text-slate-500">{String(item.sep)}</td><td className="px-6 py-3 text-orange-600 font-bold">{String(item.codes)}</td></tr>))}</tbody></table></div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderKpiCoder = () => {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
        <SectionHeader icon={Award} title="KPI Kinerja Coder" desc="Laporan evaluasi performa Coder berdasarkan Volume, tingkat Discrepancy, dan temuan Audit Rules BPJS." colorClass="bg-sky-50 text-sky-600" highlightClass="bg-sky-500/5" exportAction={() => exportToCSV('KPI', ['Coder ID', 'Volume', 'Discrepancy', 'AuditHits'], dashData.kpiCoderArray.map(d=>[d.id, d.cases, d.discrepancyCount, d.auditHits]))}/>
        <Card>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-center whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-extrabold tracking-wider text-slate-500 sticky top-0 z-20">
                <tr><th rowSpan={2} className="p-4 border-r border-slate-200">No</th><th rowSpan={2} className="p-4 border-r border-slate-200">ID Coder</th><th rowSpan={2} className="p-4 border-r border-slate-200">Volume Kasus</th><th colSpan={2} className="p-3 border-r border-b border-slate-200 bg-orange-50/50 text-orange-700">Discrepancy (Akurasi)</th><th colSpan={2} className="p-3 border-b border-slate-200 bg-rose-50/50 text-rose-700">Temuan Audit Koding</th></tr>
                <tr className="bg-white text-[10px]"><th className="p-3 border-r border-slate-200 text-slate-500 bg-orange-50/20">Jml Tidak Sesuai</th><th className="p-3 border-r border-slate-200 text-orange-700 bg-orange-50">Error Rate (%)</th><th className="p-3 border-r border-slate-200 text-slate-500 bg-rose-50/20">Jml Temuan Audit</th><th className="p-3 text-rose-700 bg-rose-50">Error Rate (%)</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashData.kpiCoderArray.length === 0 ? <tr><td colSpan="7" className="p-12 text-slate-400 font-medium bg-slate-50/50">Tidak ada data coder.</td></tr> : dashData.kpiCoderArray.map((item, idx) => {
                    const discRate = item.cases > 0 ? (item.discrepancyCount / item.cases) * 100 : 0; const auditRate = item.cases > 0 ? (item.auditHits / item.cases) * 100 : 0;
                    return (
                      <tr key={`coder-${idx}`} className="hover:bg-sky-50/30">
                        <td className="p-4 text-slate-400 font-bold border-r border-slate-50">{idx + 1}</td><td className="p-4 border-r border-slate-50 font-black text-sky-700">{item.id}</td><td className="p-4 font-bold text-slate-600 border-r border-slate-50 bg-slate-50/50">{item.cases.toLocaleString()}</td>
                        <td className="p-4 font-bold text-slate-600 border-r border-slate-50">{item.discrepancyCount.toLocaleString()}</td><td className={`p-4 font-black border-r border-slate-50 ${discRate > 10 ? 'text-rose-600 bg-rose-50/30' : discRate > 5 ? 'text-orange-500 bg-orange-50/30' : 'text-lime-600 bg-lime-50/30'}`}>{formatPct(discRate)}%</td>
                        <td className="p-4 font-bold text-slate-600 border-r border-slate-50">{item.auditHits.toLocaleString()}</td><td className={`p-4 font-black ${auditRate > 10 ? 'text-rose-600 bg-rose-50/30' : auditRate > 5 ? 'text-orange-500 bg-orange-50/30' : 'text-lime-600 bg-lime-50/30'}`}>{formatPct(auditRate)}%</td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const renderNaikKelas = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader icon={BarChart3} title="Transisi Hak Kelas Rawat" desc="Analisis perpindahan hak kelas awal pasien menuju kelas target (Naik Kelas), beserta besaran penerimaan selisih biayanya." colorClass="bg-lime-50 text-green-600" highlightClass="bg-emerald-500/5" exportAction={() => exportToCSV('NaikKelas', ['Transisi Awal', 'Akhir', 'Kasus', 'Nilai'], dashData.naikKelasStats.map(n => [n.awal, n.akhir, n.count, n.totalNilai]))}/>
        <Card>
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/30"><h3 className="font-extrabold text-emerald-800">Total: {formatRp(dashData.totalNilaiNaikKelas)} dari {dashData.totalKasusNaikKelas} Kasus</h3></div>
          <MiniTable data={dashData.naikKelasStats} columns={[{header:'No', className:'text-center w-8 font-bold text-slate-400', render:(r,i)=>i+1},{header:'Transisi Kelas', render:r=><span className="font-bold">{r.awal} <ChevronRight className="inline mx-1 text-slate-300" size={14}/> {r.akhir}</span>},{header:'Penjamin', className:'font-bold text-sky-600', render:r=>r.pembayar},{header:'Total Kasus', className:'text-center font-black', render:r=>r.count},{header:'Total Selisih Dibayar', className:'text-right font-black text-emerald-600 bg-emerald-50/30', render:r=>formatRp(r.totalNilai)}]} onRowClick={item => openDrilldown(`Naik Kelas: ${item.awal} ke ${item.akhir}`, r => { const m = String(r['C2'] || '').match(/"selisih_biaya":\s*\{\s*"nilai":\s*"(\d+)"\s*,\s*"pembayar":\s*"([^"]+)"\s*,\s*"naik_kelas":\s*"([^"]+)"/); return m && parseFloat(m[1]) > 0 && String(r['KELAS_RAWAT'] || r['KELAS'] || r['HAK_KELAS'] || '').trim() === item.awalRaw && String(m[3]).toUpperCase() === item.akhir; })} />
        </Card>
      </div>
  );

  const renderICU = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader icon={ActivitySquare} title="Analisis ICU & Ventilator" desc="Sebaran proporsi *Severity Level* khusus episode pasien rawat intensif (ICU) & deteksi anomali koding jam Ventilator." colorClass="bg-orange-50 text-orange-600" highlightClass="bg-orange-500/5" exportAction={() => exportToCSV('ICU_Anomali', ['MRN', 'SEP', 'Vent Hour', 'Isu'], dashData.icuStats.anomalies.map(a => [a.mrn, a.sep, a.ventHour, a.issue]))} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[ {s:1, c:dashData.icuStats.sev1, bg:'bg-slate-300', t:'Ringan'}, {s:2, c:dashData.icuStats.sev2, bg:'bg-orange-400', t:'Sedang'}, {s:3, c:dashData.icuStats.sev3, bg:'bg-rose-500', t:'Berat'} ].map(x => (
              <Card key={x.s} className="relative overflow-hidden group"><div className={`absolute top-0 left-0 w-full h-1.5 ${x.bg}`}></div><div className="p-8 flex flex-col items-center justify-center text-center"><p className="text-slate-400 font-extrabold uppercase text-[10px] mb-2">Severity Level {x.s}</p><h2 className="text-5xl font-black text-slate-700">{x.c.toLocaleString()}</h2><p className="text-sm font-semibold text-slate-500 mt-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Kasus {x.t}</p></div></Card>
            ))}
        </div>
        <Card>
          <div className="p-5 border-b border-rose-100 flex items-center gap-3 bg-rose-50/50"><div className="p-2 bg-rose-100 rounded-xl text-rose-700"><AlertTriangle size={18}/></div><div><h3 className="font-extrabold text-slate-800 tracking-tight">Anomali Koding Jam Ventilator ({dashData.icuStats.anomalies.length} Kasus)</h3></div></div>
          <MiniTable data={dashData.icuStats.anomalies} columns={[{header:'MRN', className:'font-black text-slate-700 w-32', render:r=>r.mrn},{header:'SEP', className:'font-mono text-xs font-semibold text-slate-500 w-48', render:r=>r.sep},{header:'SL INA', className:'text-center font-black bg-slate-50 w-20', render:r=>r.severity},{header:'Actual Vent Hour', className:'text-center font-black text-rose-600 bg-rose-50/30 w-36', render:r=>`${r.ventHour} Jam`},{header:'Isu Deteksi', className:'font-bold text-xs text-rose-700', render:r=>r.issue}]} />
        </Card>
      </div>
  );

  const renderSlClAnalysis = () => {
    const data = dashData.slClShiftArray;
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
        <SectionHeader icon={Layers} title="Analisis Pergeseran SL & CL" desc="Peta sebaran transisi dari *Severity Level* INA-CBG (SL) menuju *Complexity Level* iDRG (CL). <br/> <strong className='text-sky-600'>Klik baris *Card* di bawah untuk melihat rincian pasien!</strong>" colorClass="bg-sky-50 text-sky-600" highlightClass="bg-blue-500/5" exportAction={()=>exportToCSV('SL_CL', ['Tipe'], data.map(d=>[`SL ${d.sev} ke CL ${d.cl}`]))}/>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {data.length === 0 ? <Card className="col-span-full p-12 text-center"><p className="text-slate-500 font-semibold">Belum ada data pergeseran SL/CL yang terekam pada rawat inap (PTD 1).</p></Card> : 
             data.map((item, idx) => {
               let tagColor = "bg-slate-100 text-slate-600", tagText = "Normal";
               if (item.sev === 3 && item.cl <= 1) { tagColor = "bg-orange-100 text-orange-700"; tagText = "Defisit Signifikan"; }
               else if (item.sev === 2 && item.cl === 0) { tagColor = "bg-orange-50 text-orange-600"; tagText = "Defisit Ringan"; }
               else if (item.cl > item.sev) { tagColor = "bg-lime-100 text-green-700"; tagText = "Surplus iDRG"; }
               return (
                 <Card key={`slcl-${idx}`} className="flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer">
                   <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50" onClick={() => openDrilldown(`Pergeseran SL ${item.sev} ke CL ${item.cl}`, r => { let s=0; if (String(r['INACBG']||'').endsWith('-I')) s=1; else if (String(r['INACBG']||'').endsWith('-II')) s=2; else if (String(r['INACBG']||'').endsWith('-III')) s=3; return s === item.sev && parseInt(String(r['IDRG_DRG_CODE']||'').slice(-1)) === item.cl; })}>
                      <div className="flex items-center gap-3"><div className="bg-sky-100 text-sky-700 font-black text-lg w-10 h-10 rounded-xl flex items-center justify-center shadow-sm">S{item.sev}</div><ChevronRight className="text-slate-300 shrink-0"/><div className="bg-orange-100 text-orange-700 font-black text-lg w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-col">C{item.cl}</div><span className="text-xs font-extrabold text-orange-800 ml-1 opacity-80">{getCLName(item.cl)}</span></div>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border border-white/50 ${tagColor}`}>{tagText}</span>
                   </div>
                   <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-end gap-2 mb-4"><h4 className="text-4xl font-black text-slate-800 tracking-tight">{item.count.toLocaleString()}</h4><span className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Kasus</span></div>
                      <div className="space-y-2 mb-6 bg-slate-50 rounded-xl p-3 border border-slate-100/60">
                         <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Total INA:</span><span className="text-sky-600">{formatRp(item.sumIna)}</span></div>
                         <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Total iDRG:</span><span className="text-orange-600">{formatRp(item.sumIdrg)}</span></div>
                         <div className="pt-2 mt-2 border-t border-slate-200/60 flex justify-between text-xs font-black"><span className="text-slate-600">Selisih:</span><span className={item.selisih>0 ? 'text-lime-600' : 'text-orange-600'}>{item.selisih>0 ? '+' : ''}{formatRp(item.selisih)}</span></div>
                      </div>
                      <div className="mt-auto border-t border-slate-100 pt-4">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Stethoscope size={12}/> Seluruh Diagnosa Sekunder</p>
                        <div className="max-h-[140px] overflow-y-auto custom-scrollbar pr-2 flex flex-wrap gap-2">
                           {item.topSecDiags.length === 0 ? <span className="text-[10px] text-slate-400 italic">Tanpa diag sekunder</span> : item.topSecDiags.map((d, i) => (<div key={`sd-${i}`} className="flex items-center gap-1.5 bg-slate-100/80 hover:bg-slate-200 border border-slate-200 rounded-md px-2 py-1 transition-colors"><span className="text-xs font-bold text-slate-700">{d[0]}</span><span className="text-[10px] font-semibold text-white bg-slate-500 rounded px-1.5">{d[1]}</span></div>))}
                        </div>
                      </div>
                   </div>
                 </Card>
               );
             })
           }
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-sky-100 selection:text-sky-900">
      
      {drilldown.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[98vw] h-full max-h-[95vh] flex flex-col overflow-hidden ring-1 ring-slate-900/5">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-white shrink-0">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight"><Table2 size={24} className="text-sky-600"/> Rincian Data Analitik</h3>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{drilldown.title} — {drilldown.data.length.toLocaleString()} Record</p>
              </div>
              <div className="flex items-center gap-3">
                 <button onClick={dlDrilldownCSV} className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-[0_4px_12px_-2px_rgba(2,132,199,0.3)] transition-all"><Download size={16}/> Unduh CSV</button>
                 <button onClick={() => setDrilldown({isOpen: false, title: '', data: []})} className="p-2 hover:bg-slate-100 rounded-full transition-colors ml-2 border border-transparent hover:border-slate-200"><X size={24} className="text-slate-400" /></button>
              </div>
            </div>
            
            <div className="overflow-auto flex-1 p-0 bg-slate-50/50 custom-scrollbar">
              {drilldown.data.length === 0 ? (
                <div className="p-16 text-center text-slate-400 font-semibold text-lg">Tidak ada rincian data.</div>
              ) : (
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-white text-slate-500 sticky top-0 z-30 shadow-sm border-b border-slate-200 text-[10px] uppercase font-extrabold tracking-wider">
                    <tr>
                      <th rowSpan={2} className="px-5 py-4 border-r border-slate-100 align-middle text-center bg-slate-50">No</th>
                      <th rowSpan={2} className="px-5 py-4 border-r border-slate-100 align-middle sticky left-0 bg-white z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-slate-800">Nama Pasien</th>
                      <th rowSpan={2} className="px-5 py-4 border-r border-slate-100 align-middle bg-slate-50">MRN</th>
                      <th rowSpan={2} className="px-5 py-4 border-r border-slate-100 align-middle bg-slate-50">No SEP</th>
                      <th rowSpan={2} className="px-5 py-4 border-r border-slate-100 align-middle bg-slate-50">Tgl Pulang</th>
                      <th rowSpan={2} className="px-4 py-4 text-center border-r border-sky-100 align-middle bg-sky-50/50 text-sky-700">SL INA</th>
                      <th rowSpan={2} className="px-4 py-4 text-center border-r border-orange-100 align-middle bg-orange-50/50 text-orange-700">CL iDRG</th>
                      <th colSpan={4} className="px-5 py-3 text-center border-r border-sky-100 border-b border-sky-100 bg-sky-50 text-sky-800">Diagnosis & Prosedur INA-CBG</th>
                      <th colSpan={4} className="px-5 py-3 text-center border-r border-orange-100 border-b border-orange-100 bg-orange-50 text-orange-800">Diagnosis & Prosedur iDRG</th>
                      <th rowSpan={2} className="px-5 py-4 text-right border-r border-sky-100 align-middle bg-sky-50/50 text-sky-800">Tarif INA</th>
                      <th rowSpan={2} className="px-5 py-4 text-right border-r border-orange-100 align-middle bg-orange-50/50 text-orange-800">Tarif iDRG</th>
                      <th rowSpan={2} className="px-5 py-4 text-right border-r-4 border-r-slate-200 align-middle bg-slate-100 text-slate-800">Selisih</th>
                      <th colSpan={18} className="px-5 py-3 text-center bg-slate-800 text-white border-b border-slate-700 tracking-[0.2em]">RINCIAN 18 KOMPONEN BILLING (Rp)</th>
                    </tr>
                    <tr className="text-[10px]">
                      <th className="px-4 py-2 bg-sky-50/30 text-sky-600 border-r border-sky-100/50">Code</th><th className="px-4 py-2 bg-sky-50/30 text-sky-600 border-r border-sky-100/50">Deskripsi</th><th className="px-4 py-2 bg-sky-50/30 text-sky-600 border-r border-sky-100/50">Diaglist</th><th className="px-4 py-2 bg-sky-50/30 text-sky-600 border-r border-sky-100">Proclist</th>
                      <th className="px-4 py-2 bg-orange-50/30 text-orange-600 border-r border-orange-100/50">Code</th><th className="px-4 py-2 bg-orange-50/30 text-orange-600 border-r border-orange-100/50">Deskripsi</th><th className="px-4 py-2 bg-orange-50/30 text-orange-600 border-r border-orange-100/50">Diaglist</th><th className="px-4 py-2 bg-orange-50/30 text-orange-600 border-r border-orange-100">Proclist</th>
                      {compKeys.map(c => <th key={c.key} className="px-4 py-2 bg-slate-700 text-slate-300 border-r border-slate-600 text-right">{c.label}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {drilldown.data.slice(0, 300).map((row, i) => {
                       const ina = parseFloat(row.TOTAL_TARIF)||0; const idrg = parseFloat(row.IDRG_TOTAL_TARIF)||0; const sel = idrg - ina;
                       const comps = extract18(row); const sev = row.INACBG ? (String(row.INACBG).endsWith('-I') ? 1 : String(row.INACBG).endsWith('-II') ? 2 : String(row.INACBG).endsWith('-III') ? 3 : 0) : 0; const cl = row.IDRG_DRG_CODE ? parseInt(String(row.IDRG_DRG_CODE).slice(-1)) : 0;
                       return (
                         <tr key={`ddr-${i}`} className="hover:bg-slate-50/80 transition-colors">
                           <td className="px-5 py-3 text-center font-semibold text-slate-400 border-r border-slate-50">{i+1}</td>
                           <td className="px-5 py-3 font-extrabold text-slate-800 border-r border-slate-50 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] z-10">{String(row.NAMA_PASien || row.NAMA_PASIEN || '-')}</td>
                           <td className="px-5 py-3 font-bold text-slate-600 border-r border-slate-50">{String(row.MRN || '-')}</td>
                           <td className="px-5 py-3 text-xs font-mono font-semibold text-slate-500 border-r border-slate-50">{String(row.SEP || '-')}</td>
                           <td className="px-5 py-3 text-xs font-bold text-slate-500 border-r border-slate-50">{String(row.DISCHARGE_DATE || '-')}</td>
                           <td className="px-4 py-3 text-center font-black text-sky-600 bg-sky-50/20 border-r border-sky-50">{sev > 0 ? sev : '-'}</td>
                           <td className="px-4 py-3 text-center font-black text-orange-600 bg-orange-50/20 border-r border-orange-50">{isNaN(cl) ? '-' : cl}</td>
                           <td className="px-5 py-3 font-bold text-sky-700 bg-sky-50/10 border-r border-sky-50/50">{String(row.INACBG || '-')}</td>
                           <td className="px-5 py-3 text-xs font-medium text-slate-600 max-w-[200px] truncate bg-sky-50/10 border-r border-sky-50/50" title={String(row.DESKRIPSI_INACBG||'-')}>{String(row.DESKRIPSI_INACBG || '-')}</td>
                           <td className="px-5 py-3 text-xs font-mono font-semibold text-slate-500 max-w-[150px] truncate bg-sky-50/10 border-r border-sky-50/50" title={String(row.DIAGLIST||'-')}>{String(row.DIAGLIST || '-')}</td>
                           <td className="px-5 py-3 text-xs font-mono font-semibold text-slate-500 max-w-[150px] truncate bg-sky-50/10 border-r border-sky-100/50" title={String(row.PROCLIST||'-')}>{String(row.PROCLIST || '-')}</td>
                           <td className="px-5 py-3 font-bold text-orange-700 bg-orange-50/10 border-r border-orange-50/50">{String(row.IDRG_DRG_CODE || '-')}</td>
                           <td className="px-5 py-3 text-xs font-medium text-slate-600 max-w-[200px] truncate bg-orange-50/10 border-r border-orange-50/50" title={String(row.IDRG_DRG_DESCRIPTION||'-')}>{String(row.IDRG_DRG_DESCRIPTION || '-')}</td>
                           <td className="px-5 py-3 text-xs font-mono font-semibold text-slate-500 max-w-[150px] truncate bg-orange-50/10 border-r border-orange-50/50" title={String(row.IDRG_DIAG_LISTS||'-')}>{String(row.IDRG_DIAG_LISTS || '-')}</td>
                           <td className="px-5 py-3 text-xs font-mono font-semibold text-slate-500 max-w-[150px] truncate bg-orange-50/10 border-r border-orange-100/50" title={String(row.IDRG_PROC_LISTS||'-')}>{String(row.IDRG_PROC_LISTS || '-')}</td>
                           <td className="px-5 py-3 text-right font-bold text-sky-700 bg-sky-50/20 border-r border-sky-100/50">{formatRp(ina)}</td>
                           <td className="px-5 py-3 text-right font-bold text-orange-700 bg-orange-50/20 border-r border-orange-100/50">{formatRp(idrg)}</td>
                           <td className={`px-5 py-3 text-right font-black border-r-4 border-slate-200 bg-slate-50/50 ${sel > 0 ? 'text-lime-500' : sel < 0 ? 'text-orange-500' : 'text-slate-400'}`}>{sel > 0 ? '+' : ''}{formatRp(sel)}</td>
                           {compKeys.map(c => <td key={`cmp-${i}-${c.key}`} className="px-4 py-3 text-right text-[11px] font-semibold text-slate-400 border-r border-slate-50">{formatRpEx(comps[c.key])}</td>)}
                         </tr>
                       )
                    })}
                  </tbody>
                </table>
              )}
              {drilldown.data.length > 300 && <div className="p-4 bg-amber-50 text-amber-800 text-center text-xs font-bold border-t border-amber-100 sticky bottom-0 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">Menampilkan 300 data pertama. Ekspor CSV untuk mengunduh seluruh {drilldown.data.length.toLocaleString()} data tanpa batas.</div>}
            </div>
          </div>
        </div>
      )}

      <nav className={`fixed top-0 w-full z-[100] transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm border-b border-slate-200/50 py-2' : 'bg-gradient-to-r from-slate-900 to-sky-900 shadow-lg border-b border-sky-800 py-3'}`}>
        <div className="max-w-[1400px] mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl shadow-inner ${isScrolled ? 'bg-sky-500 text-white' : 'bg-white/10 text-white backdrop-blur-md'}`}><Activity size={22} strokeWidth={2.5} /></div>
            <h1 className={`text-xl font-black tracking-tight ${isScrolled ? 'text-sky-900' : 'text-white'}`}>SAK-iDRG <span className={`font-semibold text-sm ${isScrolled ? 'text-slate-500' : 'text-sky-200'}`}>Analytics</span></h1>
          </div>
          <div className="flex gap-2 bg-slate-900/20 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
            <button onClick={() => setActiveTab('upload')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'upload' ? (isScrolled ? 'bg-sky-100 text-sky-700 shadow-sm' : 'bg-white text-sky-900 shadow-sm') : (isScrolled ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-white/10')}`}><UploadCloud size={16} /> Integrasi Data</button>
            <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'dashboard' ? (isScrolled ? 'bg-sky-100 text-sky-700 shadow-sm' : 'bg-white text-sky-900 shadow-sm') : (isScrolled ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-white/10')}`}><PieChart size={16} /> Dashboard</button>
          </div>
        </div>
      </nav>

      <main className={`max-w-[1400px] mx-auto pb-24 ${isScrolled ? 'pt-24' : 'pt-28'} transition-all duration-300`}>
        {activeTab === 'upload' ? (<div className="px-6">{renderUploadTab()}</div>) : (
            <div className="px-4 sm:px-6">
               {dashData ? (
                 <>
                   <div className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/60 mb-8 flex flex-wrap gap-4 items-center animate-in fade-in slide-in-from-top-4 duration-500 relative z-40">
                     <div className="flex items-center gap-3"><span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-md">Periode</span><select value={globalFilter.periode} onChange={e => setGlobalFilter({...globalFilter, periode: e.target.value})} className="bg-transparent border-0 border-b-2 border-slate-200 pb-1 text-sm font-extrabold text-slate-800 focus:ring-0 focus:border-sky-500 outline-none cursor-pointer min-w-[120px] transition-colors"><option value="All">Semua Periode</option>{filterOptions.periods.map((p, idx) => <option key={`per-${idx}`} value={p}>{p}</option>)}</select></div>
                     <div className="w-px h-8 bg-slate-200 hidden md:block mx-2"></div>
                     <div className="flex items-center gap-3"><span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-md">Jenis Rawat</span><select value={globalFilter.jenisRawat} onChange={e => setGlobalFilter({...globalFilter, jenisRawat: e.target.value})} className="bg-transparent border-0 border-b-2 border-slate-200 pb-1 text-sm font-extrabold text-slate-800 focus:ring-0 focus:border-sky-500 outline-none cursor-pointer min-w-[120px] transition-colors"><option value="All">Semua Rawat</option>{filterOptions.jenis.map((p, idx) => <option key={`jns-${idx}`} value={p}>{p === '1' ? '1 (Rawat Inap)' : p === '2' ? '2 (Rawat Jalan)' : p}</option>)}</select></div>
                     <div className="w-px h-8 bg-slate-200 hidden lg:block mx-2"></div>
                     <div className="flex items-center gap-3"><span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-md">Kelas Rawat</span><select value={globalFilter.kelasRawat} onChange={e => setGlobalFilter({...globalFilter, kelasRawat: e.target.value})} className="bg-transparent border-0 border-b-2 border-slate-200 pb-1 text-sm font-extrabold text-slate-800 focus:ring-0 focus:border-sky-500 outline-none cursor-pointer min-w-[120px] transition-colors"><option value="All">Semua Kelas</option>{filterOptions.kelas.map((p, idx) => <option key={`kls-${idx}`} value={p}>Kelas {p}</option>)}</select></div>
                     <div className="w-px h-8 bg-slate-200 hidden xl:block mx-2"></div>
                     <div className="flex items-center gap-3 flex-1 min-w-[200px]"><span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-md">DPJP Utama</span><select value={globalFilter.dpjp} onChange={e => setGlobalFilter({...globalFilter, dpjp: e.target.value})} className="bg-transparent border-0 border-b-2 border-slate-200 pb-1 text-sm font-extrabold text-sky-600 focus:ring-0 focus:border-sky-500 outline-none cursor-pointer w-full transition-colors truncate"><option value="All">Semua DPJP Terdaftar</option>{filterOptions.dpjps.map((p, idx) => <option key={`dpj-${idx}`} value={p.norm}>{p.disp}</option>)}</select></div>
                   </div>

                   <div className="flex gap-2 mb-8 p-1.5 bg-slate-200/50 backdrop-blur-sm rounded-xl overflow-x-auto border border-slate-200/60 shadow-inner max-w-max mx-auto custom-scrollbar relative z-30">
                     {TABS.map((t, idx) => {
                       const IconComponent = t.icon;
                       return (
                         <button key={`tab-${idx}`} onClick={()=>setSubTab(t.id)} className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2.5 transition-all shrink-0 ${subTab === t.id ? 'bg-white text-sky-600 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}>
                           <IconComponent size={16} className={subTab === t.id ? 'text-sky-500' : ''}/> {t.label}
                         </button>
                       );
                     })}
                   </div>
                   
                   {dashData.isEmptyAfterFilter ? (
                      <div className="bg-white/50 backdrop-blur-sm border border-slate-200/60 p-16 rounded-2xl text-center mt-6 max-w-2xl mx-auto shadow-sm animate-in zoom-in-95 duration-300"><div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle className="text-slate-400" size={40} /></div><h2 className="text-2xl font-black mb-3 text-slate-700 tracking-tight">Tidak Ada Data Ditemukan</h2><p className="text-slate-500 font-medium">Kriteria filter yang Anda pilih tidak memiliki kecocokan record dalam dataset yang sedang aktif. Silakan ubah filter Periode, Rawat, Kelas, atau DPJP.</p></div>
                   ) : (
                      <div className="relative z-20">
                        {subTab === 'executive' && renderExecutive()} {subTab === 'report' && renderReport()} {subTab === 'rekap' && renderRekap()}
                        {subTab === 'sl_cl_analysis' && renderSlClAnalysis()} {subTab === 'dpjp' && renderDpjp()} {subTab === 'kpi_coder' && renderKpiCoder()}
                        {subTab === 'mapping' && renderPemetaan()} {subTab === 'discrepancy' && renderKetepatan()} {subTab === 'audit' && renderAudit()}
                        {subTab === 'naik_kelas' && renderNaikKelas()} {subTab === 'icu' && renderICU()}
                      </div>
                   )}
                 </>
               ) : (
                 <div className="bg-white/50 backdrop-blur-sm border border-slate-200/60 p-16 rounded-2xl text-center mt-6 max-w-2xl mx-auto shadow-sm animate-in zoom-in-95 duration-300"><div className="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse"><Activity className="text-sky-500" size={40} /></div><h2 className="text-2xl font-black mb-3 text-slate-700 tracking-tight">Menunggu Dataset...</h2><p className="text-slate-500 font-medium">Silakan menuju tab <strong className="text-sky-600">Integrasi Data</strong> untuk mengunggah file TXT klaim RS Anda.</p></div>
               )}
            </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
      `}} />
    </div>
  );
}