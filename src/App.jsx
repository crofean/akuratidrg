import React, { useState, useRef, useMemo, useEffect, useId } from 'react';
import { UploadCloud, Folder, FileText, CheckCircle, Trash2, AlertCircle, X, BarChart3, PieChart, Activity, Layers, Search, Table2, GitMerge, FileCode, CheckSquare, AlertTriangle, Stethoscope, User, Users, ActivitySquare, Download, TrendingUp, TrendingDown, ChevronRight, ChevronDown, Zap, Award, ArrowUpCircle, LogIn, LogOut, Menu, Printer, Moon, Sun, Calendar, Bed, Building2, LayoutDashboard, Bot, Sparkles } from 'lucide-react';

export const saveAsPng = async (elementId, fileName) => {
  const el = document.getElementById(elementId);
  if (!el) return;
  try {
    if (!window.html2canvas) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load html2canvas'));
        document.head.appendChild(script);
      });
    }
    const canvas = await window.html2canvas(el, { backgroundColor: '#ffffff', scale: 2 });
    const url = canvas.toDataURL('image/png');
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName.replace(/\s+/g, '_')}.png`;
    link.click();
  } catch (err) {
    console.error('Failed to save chart', err);
  }
};

// --- DATA CODING RULES (Minified) ---
const DEFAULT_AUDIT_RULES = [
  {
    "id": "AUDIT-COD-01",
    "case": "Typhoid pada Kehamilan",
    "category": "Coding Audit",
    "condition": {
      "type": "grouped",
      "operator": "AND",
      "groups": [{ "operator": "OR", "codes": ["A01.0"] }, { "operator": "OR", "codes": ["O98", "O98.8"] }]
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
      "groups": [{ "operator": "OR", "codes": ["N20", "N21", "N22", "N23"] }, { "operator": "OR", "codes": ["N39.0"] }]
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
      "groups": [{ "operator": "OR", "codes": ["K80", "K80.0", "K80.1", "K80.2"] }, { "operator": "OR", "codes": ["K83.1", "K83.0"] }]
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
      "groups": [{ "operator": "OR", "codes": ["K35.2"] }, { "operator": "OR", "codes": ["K63.1"] }]
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
      "groups": [{ "operator": "OR", "codes": ["E10", "E11", "E14"] }, { "operator": "OR", "codes": ["R02", "L89"] }]
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
      "groups": [{ "operator": "OR", "codes": ["E14.9", "E11.9", "E10.9"] }, { "operator": "OR", "codes": ["G63.2"] }]
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
      "groups": [{ "operator": "OR", "codes": ["B20.0", "B20.1", "B20.4", "B20.8"] }, { "operator": "OR", "codes": ["J15.9", "J15.2", "J18.9"] }]
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
      "groups": [{ "operator": "OR", "codes": ["A91", "A90"] }, { "operator": "OR", "codes": ["D69.6"] }]
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
      "groups": [{ "operator": "OR", "codes": ["I25", "I25.1", "I25.9"] }, { "operator": "OR", "codes": ["I20", "I20.0", "I20.1", "I20.9"] }]
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
      "groups": [{ "operator": "OR", "codes": ["O80.0", "O80.9", "73.59"] }, { "operator": "OR", "codes": ["O70.0", "O70.1"] }]
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
      "groups": [{ "operator": "OR", "codes": ["I10"] }, { "operator": "OR", "codes": ["I50", "I50.0", "I50.1", "I50.9"] }]
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
      "groups": [{ "operator": "OR", "codes": ["I10"] }, { "operator": "OR", "codes": ["N18", "N18.9", "N19"] }]
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
      "groups": [{ "operator": "OR", "codes": ["I10", "I11.0", "I12.0"] }, { "operator": "OR", "codes": ["N18", "N18.9", "N19"] }, { "operator": "OR", "codes": ["I50", "I50.0", "I50.9"] }]
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
      "groups": [{ "operator": "OR", "codes": ["I50.0"] }, { "operator": "OR", "codes": ["J81"] }]
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
      "groups": [{ "operator": "OR", "codes": ["J44.0", "J44.9"] }, { "operator": "OR", "codes": ["J18", "J18.9", "J15"] }]
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
      "groups": [{ "operator": "OR", "codes": ["A01", "A01.0"] }, { "operator": "OR", "codes": ["A09"] }]
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
      "groups": [{ "operator": "OR", "codes": ["A01", "A01.0"] }, { "operator": "OR", "codes": ["J18", "J18.9"] }]
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
      "groups": [{ "operator": "OR", "codes": ["O41.0"] }, { "operator": "OR", "codes": ["O42", "O42.0", "O42.1", "O42.9"] }]
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
      "groups": [{ "operator": "OR", "codes": ["R57.1", "R57", "R57.9"] }, { "operator": "OR", "codes": ["S06", "S06.8", "S36", "T09"] }]
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
      "groups": [{ "operator": "OR", "codes": ["53.0", "53.00", "53.01", "53.02"] }, { "operator": "OR", "codes": ["54.59", "K66.0"] }]
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
      "groups": [{ "operator": "OR", "codes": ["74.1", "74.4", "74.99"] }, { "operator": "OR", "codes": ["65.89", "54.59"] }]
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
      "groups": [{ "operator": "OR", "codes": ["O60.0"] }, { "operator": "OR", "codes": ["O47.0", "O47.9"] }]
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
      "groups": [{ "operator": "OR", "codes": ["36.0", "36.01", "36.02", "36.06"] }, { "operator": "OR", "codes": ["I49.3", "I49.9"] }]
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
      "groups": [{ "operator": "OR", "codes": ["D61.9", "D61.0"] }, { "operator": "OR", "codes": ["Z51.1", "C"] }]
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
      "groups": [{ "operator": "OR", "codes": ["B20", "B20.0"] }, { "operator": "OR", "codes": ["A15", "A15.0", "A16", "A16.0", "A16.2"] }]
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
      "groups": [{ "operator": "OR", "codes": ["54.11", "54.19"] }, { "operator": "OR", "codes": ["68.4", "68.5", "68.9", "47.0", "54.4"] }]
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
      "groups": [{ "operator": "OR", "codes": ["O80.0", "O80.9"] }, { "operator": "OR", "codes": ["75.69"] }]
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
      "groups": [{ "operator": "OR", "codes": ["N18.5", "Z49.1"] }, { "operator": "OR", "codes": ["39.42", "39.52"] }]
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
      "groups": [{ "operator": "OR", "codes": ["K05.1", "K05.2"] }, { "operator": "OR", "codes": ["24.4"] }]
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
      "groups": [{ "operator": "OR", "codes": ["M51.2", "D16.6", "M51.-"] }, { "operator": "OR", "codes": ["G82.2", "G82.-"] }]
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
      "groups": [{ "operator": "OR", "codes": ["S06", "S06.2", "S06.4", "S06.8"] }, { "operator": "OR", "codes": ["G93.5"] }]
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
      "groups": [{ "operator": "OR", "codes": ["N21", "N21.0"] }, { "operator": "OR", "codes": ["N13", "N13.2"] }, { "operator": "OR", "codes": ["N20.9"] }]
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
      "groups": [{ "operator": "OR", "codes": ["N20.1"] }, { "operator": "OR", "codes": ["N10"] }]
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
      "groups": [{ "operator": "OR", "codes": ["J85.0", "J85.2", "J85.3"] }, { "operator": "OR", "codes": ["J18", "J18.0", "J18.1", "J18.2", "J18.8", "J18.9"] }]
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
      "groups": [{ "operator": "OR", "codes": ["J85.1"] }, { "operator": "OR", "codes": ["J10", "J11", "J12", "J13", "J14", "J15", "J16", "J15.9"] }]
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
      "groups": [{ "operator": "OR", "codes": ["A15", "A15.2", "A16", "A16.2"] }, { "operator": "OR", "codes": ["J18", "J18.9", "J15"] }]
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
      "groups": [{ "operator": "OR", "codes": ["A90"] }, { "operator": "OR", "codes": ["A91"] }]
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
      "groups": [{ "operator": "OR", "codes": ["B05.9", "B05"] }, { "operator": "OR", "codes": ["J18", "J18.9"] }]
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
      "groups": [{ "operator": "OR", "codes": ["A15", "A15.0", "A16", "A16.0"] }, { "operator": "OR", "codes": ["R04.2"] }]
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
      "groups": [{ "operator": "OR", "codes": ["M84.0"] }, { "operator": "OR", "codes": ["S72", "S82", "S52", "S-"] }]
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
        { "operator": "OR", "codes": ["F29"] },
        { "operator": "OR", "codes": ["G40"] }
      ]
    },
    "validation_action": {
      "warning_message": "Koreksi Koding: Jika Kasus Psikosis dan terdapat Epilepsi Psikosis gunakan Kode F06.8 (Sumber: Aturan ICD 10 2010)."
    },
    "PTD": "1/2"
  }
];

const TOP_UP_RULES = [
  { item: "Streptokinase", layanan: 1, cbgs: ["I-4-10-I", "I-4-10-II", "I-4-10-III"], diags: ["I21.0", "I21.1", "I21.2", "I21.3", "I21.4", "I21.9", "I23.3"], procs: ["99.10"], tarif: 4850700, category: "sp" },
  { item: "Deferiprone (IP)", layanan: 1, cbgs: ["D-4-13-I", "D-4-13-II", "D-4-13-III"], diags: ["D56.1"], tarif: 4392000, category: "sp" },
  { item: "Deferoksamin (IP)", layanan: 1, cbgs: ["D-4-13-I", "D-4-13-II", "D-4-13-III"], diags: ["D56.1"], tarif: 7182000, category: "sp" },
  { item: "Deferasirox (IP)", layanan: 1, cbgs: ["D-4-13-I", "D-4-13-II", "D-4-13-III"], diags: ["D56.1"], tarif: 6312000, category: "sp" },
  { item: "Human Albumin for Septicaemia", layanan: 1, cbgs: ["A-4-10-I", "A-4-10-II", "A-4-10-III", "P-8-16-I", "P-8-16-II", "P-8-16-III", "W-4-17-I", "W-4-17-II", "W-4-17-III", "O-6-11-I", "O-6-11-II", "O-6-11-III", "O-6-12-I", "O-6-12-II", "O-6-12-III", "O-6-13-I", "O-6-13-II", "O-6-13-III"], diags: ["A02.1", "A20.7", "A22.7", "A39.1", "A39.2", "A39.3", "A39.4", "A39.8", "A39.9", "A40.0", "A40.1", "A40.2", "A40.3", "A40.8", "A40.9", "A41.0", "A41.1", "A41.2", "A41.3", "A41.4", "A41.5", "A41.8", "A41.9", "A42.7", "B37.7", "R57.1", "O85", "P36.9", "P36.0", "P36.1", "P36.2", "P36.3", "P36.4", "P36.5", "P36.6", "P36.7", "P36.8"], tarif: 2144600, category: "sp", primaryOnly: true },
  { item: "Anti Hemofilia Factor (IP)", layanan: 1, cbgs: ["D-4-11-I", "D-4-11-II", "D-4-11-III"], diags: ["D66", "D67"], tarif: 12637400, category: "sp" },
  { item: "Deferiprone (OP)", layanan: 2, cbgs: ["Q-5-44-0"], diags: ["D56.1"], tarif: 4392000, category: "sp" },
  { item: "Deferoksamin (OP)", layanan: 2, cbgs: ["Q-5-44-0"], diags: ["D56.1"], tarif: 7182000, category: "sp" },
  { item: "Deferasirox (OP)", layanan: 2, cbgs: ["Q-5-44-0"], diags: ["D56.1"], tarif: 6312000, category: "sp" },
  { item: "Anti Hemofilia Factor (OP)", layanan: 2, cbgs: ["Q-5-44-0"], diags: ["D66", "D67"], tarif: 12637400, category: "sp" },
  { item: "Human Albumin for Burn", layanan: 1, cbgs: ["S-4-16-I", "S-4-16-II", "S-4-16-III", "L-1-20-I", "L-1-20-II", "L-1-20-III"], diags: ["T20.3", "T20.7", "T21.3", "T21.7", "T22.3", "T22.7", "T23.3", "T23.7", "T24.3", "T24.7", "T25.3", "T25.7", "T29.3", "T29.7", "T31.4", "T31.5", "T31.6", "T31.7", "T31.8", "T31.9", "T32.4", "T32.5", "T32.6", "T32.7", "T32.8", "T32.9"], tarif: 15673000, category: "sp", primaryOnly: true },
  { item: "Nuclear Medicine", layanan: 1, cbgs: ["Z-3-17-0"], procs: ["92.05", "92.15"], tarif: 2231300, category: "si" },
  { item: "MRI", layanan: 1, cbgs: ["Z-3-16-0"], procs: ["88.92", "88.93", "88.97"], tarif: 1865900, category: "si" },
  { item: "Diagnostic & Imaging of Eye", layanan: 1, cbgs: ["H-3-13-0"], procs: ["95.12"], tarif: 594800, category: "si" },
  { item: "Subdural Grid Electrode", layanan: 1, cbgs: ["G-1-10-I", "G-1-10-II", "G-1-10-III"], procs: ["02.93"], tarif: 16656400, category: "sr" },
  { item: "Contegra", layanan: 1, cbgs: ["I-1-03-I", "I-1-03-II", "I-1-03-III"], procs: ["35.92"], tarif: 47175000, category: "sr" },
  { item: "TMJ Prosthesis", layanan: 1, cbgs: ["M-1-60-I", "M-1-60-II", "M-1-60-III"], procs: ["76.5"], tarif: 11868400, category: "sr" },
  { item: "Hip Implant", layanan: 1, cbgs: ["M-1-04-I", "M-1-04-II", "M-1-04-III"], procs: ["81.51", "81.52", "81.53", "81.54", "81.55"], tarif: 18000000, category: "sr" },
  { item: "Evar / Tevar / Hevar Prosthesis", layanan: 1, cbgs: ["I-1-20-I", "I-1-20-II", "I-1-20-III"], procs: ["39.71", "39.72", "39.73"], tarif: 119325000, category: "sr" },
  { item: "Hip/Knee Replacement", layanan: 1, cbgs: ["M-1-04-I", "M-1-04-II", "M-1-04-III"], procs: ["81.51", "81.52", "81.53", "81.54", "81.55"], tarif: 13099000, category: "sr" },
  { item: "PCI", layanan: 1, cbgs: ["I-1-40-I", "I-1-40-II", "I-1-40-III"], procs: ["36.06", "36.07"], tarif: 14434100, category: "sr" },
  { item: "Keratoplasty", layanan: 1, cbgs: ["H-1-30-I", "H-1-30-II", "H-1-30-III"], procs: ["11.60", "11.61", "11.62", "11.63", "11.64", "11.69"], tarif: 8970200, category: "sr" },
  { item: "Pancreatectomy", layanan: 1, cbgs: ["B-1-10-I", "B-1-10-II", "B-1-10-III"], procs: ["52.51", "52.52", "52.53", "52.59", "52.6"], tarif: 8067400, category: "sr" },
  { item: "Repair of Septal Defect of Heart", layanan: 1, cbgs: ["I-1-06-I", "I-1-06-II", "I-1-06-III"], procs: ["35.50", "35.51", "35.52", "35.53", "35.55"], tarif: 53870000, category: "sr" },
  { item: "Stereotactic Surgery & Radiotheraphy", layanan: 1, cbgs: ["C-4-12-I", "C-4-12-II", "C-4-12-III"], diags: ["Z51.0"], procs: ["92.21", "92.22", "92.23", "92.24", "92.25", "92.26", "92.27", "92.28", "92.29", "92.30", "92.31", "92.32", "92.33", "92.39"], tarif: 4090100, category: "sr" },
  { item: "Torakotomi", layanan: 1, cbgs: ["J-1-30-I", "J-1-30-II", "J-1-30-III"], procs: ["34.02", "34.03"], tarif: 10142700, category: "sr" },
  { item: "Lobektomi / Bilobektomi", layanan: 1, cbgs: ["J-1-10-I", "J-1-10-II", "J-1-10-III"], procs: ["32.41", "32.49", "32.50", "32.59"], tarif: 12153800, category: "sr" },
  { item: "Vitrectomy", layanan: 1, cbgs: ["H-1-30-I", "H-1-30-II", "H-1-30-III"], procs: ["14.71", "14.72", "14.73", "14.74"], tarif: 8970200, category: "sr" },
  { item: "Phacoemulsification", layanan: 1, cbgs: ["H-2-36-0"], procs: ["13.41"], tarif: 4410000, category: "sr" },
  { item: "Microlaringoscopy", layanan: 2, cbgs: ["J-3-15-0"], procs: ["31.41", "31.42", "31.44"], tarif: 1173500, category: "sr" },
  { item: "Cholangiograph", layanan: 2, cbgs: ["B-3-11-0"], procs: ["51.10", "51.11", "51.14", "51.15", "52.13"], tarif: 3411600, category: "sr" },
  { item: "Coil", layanan: 2, cbgs: ["G-1-12-I", "G-1-12-II", "G-1-12-III"], procs: ["39.75"], tarif: 24141000, category: "sr" },
  { item: "Trombektomi", layanan: 1, cbgs: ["G-1-12-I", "G-1-12-II", "G-1-12-III"], procs: ["39.74"], tarif: 17171600, category: "sr" },
  { item: "Percutaneous Endoscopy Gastrostomy", layanan: 1, cbgs: ["E-4-10-I", "E-4-10-II", "E-4-10-III"], diags: ["E43", "E44.0", "E44.1"], procs: ["43.11"], tarif: 2110100, category: "sr" },
  { item: "Odontektomi", layanan: 1, cbgs: ["U-3-16-0"], procs: ["23.19"], tarif: 1475200, category: "sr" },
  { item: "Brakiterapi", layanan: 2, cbgs: ["C-3-10-0"], diags: ["Z51.0"], procs: ["92.20", "92.27"], tarif: 1150000, category: "sr" },
  { item: "Knee Implant", layanan: 1, cbgs: ["M-1-04-I", "M-1-04-II", "M-1-04-III"], procs: ["81.51", "81.52", "81.53", "81.54", "81.55"], tarif: 13000000, category: "sr" },
  { item: "CAPD (Consumables)", layanan: 1, procs: ["54.98"], tarif: 8000000, category: "sd" },
  { item: "Imunohistokimia", layanan: 1, tarif: 1170000, category: "sd" },
  { item: "EGFR Kanker Paru", layanan: 1, tarif: 1620000, category: "sd" },
  { item: "PET Scan", layanan: 1, tarif: 10000000, category: "si" }
];

const normalize_c = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const PROCESSED_TOP_UP_RULES = TOP_UP_RULES.map(r => ({
  ...r,
  n_cbgs: (r.cbgs || []).map(normalize_c),
  n_diags: (r.diags || []).map(normalize_c),
  n_procs: (r.procs || []).map(normalize_c)
}));

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
  { id: 'mapping', label: 'Peta iDRG', icon: GitMerge }, { id: 'sl_cl_analysis', label: 'Analisis SL/CL', icon: Layers }, { id: 'ksm', label: 'Kinerja KSM', icon: Users }, { id: 'dpjp', label: 'Kinerja DPJP', icon: User },
  { id: 'naik_kelas', label: 'Hak Kelas', icon: BarChart3 }, { id: 'icu', label: 'Intensif ICU', icon: ActivitySquare }, { id: 'topup', label: 'Potensi Top Up', icon: ArrowUpCircle }, { id: 'discrepancy', label: 'Akurasi Input INA-iDRG', icon: FileCode }, { id: 'audit', label: 'Audit Coding', icon: CheckSquare }, { id: 'kpi_coder', label: 'KPI Coder', icon: Award },
];

const normDpjp = (name) => {
  if (!name || name.trim() === '' || name.trim() === '-') return 'UNKNOWN';
  let n = String(name).toUpperCase().replace(/[,.]/g, ' ').replace(/\s+/g, ' ').trim();
  if (n.startsWith('DRG ')) n = n.substring(4).trim(); else if (n.startsWith('DR ')) n = n.substring(3).trim();
  return n || 'UNKNOWN';
};

const resolveKsmDept = (dpjp) => {
  if (!dpjp || dpjp.trim() === '' || dpjp.trim() === '-') return { ksm: 'Kedokteran Umum', dept: 'Departemen Medicine' };
  const n = String(dpjp).toUpperCase().replace(/\./g, '').replace(/,/g, ' ').replace(/ {2,}/g, ' ');

  if (n.includes('BKOM') || n.includes('PELAYANAN MEDIK') || n.includes('PEMERIKSAAN INTERN') || n.includes('KOMITE MEDIK') || n.includes('PENGEMBANGAN PROFESI'))
    return { ksm: 'Kedokteran Umum', dept: 'Departemen Medicine' };

  const check = (keywords) => keywords.some(k => n.includes(k));

  // --- Department of Cardiology ---
  if (check(['SP.JP(K) KARDIOLOGI INTERVENSI', 'SPJP(K) KARDIOLOGI INTERVENSI', 'KARDIOLOGI INTERVENSI'])) return { ksm: 'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Kardiologi Intervensi', dept: 'Department of Cardiology' };
  if (check(['SP.JP(K) EKOKARDIOGRAFI', 'SPJP(K) EKOKARDIOGRAFI', 'EKOKARDIOGRAFI'])) return { ksm: 'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Ekokardiografi', dept: 'Department of Cardiology' };
  if (check(['SP.JP(K) ARITMIA', 'SPJP(K) ARITMIA', 'ARITMIA'])) return { ksm: 'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Aritmia', dept: 'Department of Cardiology' };
  if (check(['SP.JP(K) GAGAL JANTUNG', 'SPJP(K) GAGAL JANTUNG', 'GAGAL JANTUNG'])) return { ksm: 'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Gagal Jantung', dept: 'Department of Cardiology' };
  if (check(['SP.JP(K) VASKULAR', 'SPJP(K) VASKULAR'])) return { ksm: 'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Kedokteran Vaskular', dept: 'Department of Cardiology' };
  if (check(['SP.JP(K) PENCITRAAN KARDIOVASKULAR', 'SPJP(K) PENCITRAAN KARDIOVASKULAR', 'PENCITRAAN KARDIOVASKULAR'])) return { ksm: 'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Pencitraan Kardiovaskular', dept: 'Department of Cardiology' };
  if (check(['SP.JP(K) PEDIATRIK & PJB', 'SPJP(K) PEDIATRIK & PJB', 'PEDIATRIK & PJB', 'PEDIATRIK DAN PJB', 'PEDIATRIK'])) return { ksm: 'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Kardiologi Pediatrik dan Penyakit Jantung Bawaan', dept: 'Department of Cardiology' };
  if (check(['SP.JP(K) TERAPI INTENSIF', 'SPJP(K) TERAPI INTENSIF'])) return { ksm: 'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Terapi Intensif', dept: 'Department of Cardiology' };
  if (check(['SP.JP(K) INTENSIF & KEGAWATAN', 'SPJP(K) INTENSIF & KEGAWATAN', 'INTENSIF & KEGAWATAN KARDIOVASKULAR'])) return { ksm: 'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Intensif & Kegawatan Kardiovascular', dept: 'Department of Cardiology' };
  if (check(['SP.JP(K) PREVENSI & REHABILITASI', 'SPJP(K) PREVENSI & REHABILITASI', 'PREVENSI & REHABILITASI KARDIOVASKULAR'])) return { ksm: 'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Prevensi dan Rehabilitasi Kardiovaskular', dept: 'Department of Cardiology' };
  if (check(['SP.A(K) KARDIOLOGI', 'SPA(K) KARDIOLOGI'])) return { ksm: 'Dokter Spesialis Anak Konsultan Kardiologi', dept: 'Department of Cardiology' };
  if (check(['SP.PD(K) KARDIOVASKULAR', 'SPPD(K) KARDIOVASKULAR', 'K-KV', 'KKV'])) return { ksm: 'Dokter Spesialis Penyakit Dalam Konsultan Kardiovaskular', dept: 'Department of Cardiology' };
  if (check(['SP.BTKV', 'SPBTKV'])) return { ksm: 'Dokter Spesialis Bedah Toraks Kardiovaskular', dept: 'Department of Cardiology' };
  if (check(['SP.B(K) BEDAH VASKULAR & ENDOVASKULAR', 'SPB(K) BEDAH VASKULAR & ENDOVASKULAR', 'SP.B(K) BEDAH VASKULAR', 'SP.B(K) VASKULAR', 'SPB(K) VASKULAR', 'BVE'])) return { ksm: 'Dokter Spesialis Bedah Konsultan Bedah Vaskular dan Endovaskular', dept: 'Department of Cardiology' };
  if (check(['SP.KFR(K) REHABILITASI KARDIORESPIRASI', 'SPKFR(K) REHABILITASI KARDIORESPIRASI'])) return { ksm: 'Dokter Spesialis Kedokteran Fisik dan Rehabilitasi Konsultan Rehabilitasi Kardiorespirasi', dept: 'Department of Cardiology' };
  if (check(['SP.AN(K) ANESTESI KARDIOVASKULAR', 'SPAN(K) ANESTESI KARDIOVASKULAR'])) return { ksm: 'Dokter Spesialis Anestesiologi dan Terapi Intensif Konsultan Anestesi Kardiovaskular', dept: 'Department of Cardiology' };
  if (check(['SP.JP', 'SPJP'])) return { ksm: 'Dokter Spesialis Jantung dan Pembuluh Darah', dept: 'Department of Cardiology' };

  // --- Department of Gastroenterology ---
  if (check(['SP.PD(K) GASTROENTEROHEPATOLOGI', 'SPPD(K) GASTROENTEROHEPATOLOGI', 'K-GEH'])) return { ksm: 'Dokter Spesialis Penyakit Dalam Konsultan Gastroenterohepatologi', dept: 'Department of Gastroenterology' };
  if (check(['SP.A(K) GASTROENTEROLOGI-HEPATOLOGI', 'SPA(K) GASTROENTEROLOGI-HEPATOLOGI', 'SP.A(K) GASTROENTEROLOGI & HEPATOLOGI', 'K-GASTRO'])) return { ksm: 'Dokter Spesialis Anak Konsultan Gastroenterologi-hepatologi', dept: 'Department of Gastroenterology' };
  if (check(['SP.B(K) BEDAH DIGESTIF', 'SPB(K) BEDAH DIGESTIF', 'K-BD', 'KBD', 'DIGESTIF'])) return { ksm: 'Dokter Spesialis Bedah Konsultan Bedah Digestif', dept: 'Department of Gastroenterology' };

  // --- Department of Medicine ---
  if (check(['SP.PD(K) ENDOKRIN-METABOLIK-DIABETES', 'SPPD(K) ENDOKRIN-METABOLIK-DIABETES', 'K-EMD'])) return { ksm: 'Dokter Spesialis Penyakit Dalam Konsultan Endokrinologi Metabolik dan Diabetes', dept: 'Department of Medicine' };
  if (check(['SP.PD(K) GERIATRI', 'SPPD(K) GERIATRI', 'K-GER'])) return { ksm: 'Dokter Spesialis Penyakit Dalam Konsultan Geriatri', dept: 'Department of Medicine' };
  if (check(['SP.PD(K) PULMONOLOGI', 'SPPD(K) PULMONOLOGI', 'K-PULMO'])) return { ksm: 'Dokter Spesialis Penyakit Dalam Konsultan Pulmonologi dan Medik Kritis', dept: 'Department of Medicine' };
  if (check(['SP.PD(K) PSIKOSOMATIK & PALIATIF', 'SPPD(K) PSIKOSOMATIK & PALIATIF'])) return { ksm: 'Dokter Spesialis Penyakit Dalam Konsultan Psikosomatik dan Paliatif', dept: 'Department of Medicine' };
  if (check(['SP.PD', 'SPPD'])) return { ksm: 'Dokter Spesialis Penyakit Dalam', dept: 'Department of Medicine' };
  if (check(['SP.DVE(K) GERIATRI', 'SPDVE(K) GERIATRI', 'SP.KK(K) GERIATRI', 'SPKK(K) GERIATRI'])) return { ksm: 'Dokter Spesialis Dermatologi, Venereologi, dan Estetika Konsultan Geriatri', dept: 'Department of Medicine' };
  if (check(['SP.GK(K) KELAINAN METABOLIK', 'SPGK(K) KELAINAN METABOLIK'])) return { ksm: 'Dokter Spesialis Gizi Klinik Konsultan Kelainan Metabolik', dept: 'Department of Medicine' };
  if (check(['SP.GK(K) NUTRISI PADA PENYAKIT KRITIS', 'SPGK(K) NUTRISI PADA PENYAKIT KRITIS'])) return { ksm: 'Dokter Spesialis Gizi Klinik Konsultan Nutrisi pada Penyakit Kritis', dept: 'Department of Medicine' };
  if (check(['SP.GK', 'SPGK'])) return { ksm: 'Dokter Spesialis Gizi Klinik', dept: 'Department of Medicine' };
  if (check(['SP.FK', 'SPFK'])) return { ksm: 'Dokter Spesialis Farmakologi Klinik', dept: 'Department of Medicine' };
  if (check(['SP.OK', 'SPOK'])) return { ksm: 'Dokter Spesialis Kedokteran Okupasi', dept: 'Department of Medicine' };
  if (check(['SP.KFR(K) REHABILITASI GERIATRI', 'SPKFR(K) REHABILITASI GERIATRI'])) return { ksm: 'Dokter Spesialis Kedokteran Fisik dan Rehabilitasi Konsultan Rehabilitasi Geriatri', dept: 'Department of Medicine' };
  if (check(['SP.KJ(K) ADIKSI', 'SPKJ(K) ADIKSI'])) return { ksm: 'Dokter Spesialis Kedokteran Jiwa Konsultan Psikiatri Adiksi', dept: 'Department of Medicine' };
  if (check(['SP.KJ(K) ANAK & REMAJA', 'SPKJ(K) ANAK & REMAJA', 'SP.KJ(K) ANAK DAN REMAJA'])) return { ksm: 'Dokter Spesialis Kedokteran Jiwa Konsultan Psikiatri Anak & Remaja', dept: 'Department of Medicine' };
  if (check(['SP.KJ(K) FORENSIK', 'SPKJ(K) FORENSIK'])) return { ksm: 'Dokter Spesialis Kedokteran Jiwa Konsultan Psikiatri Forensik', dept: 'Department of Medicine' };
  if (check(['SP.KJ(K) PSIKOTERAPI', 'SPKJ(K) PSIKOTERAPI'])) return { ksm: 'Dokter Spesialis Kedokteran Jiwa Konsultan Psikoterapi', dept: 'Department of Medicine' };
  if (check(['SP.KJ(K) LIAISON', 'SPKJ(K) LIAISON'])) return { ksm: 'Dokter Spesialis Kedokteran Jiwa Konsultan Psikiatri dan Liaison', dept: 'Department of Medicine' };
  if (check(['SP.KJ(K) GERIATRI', 'SPKJ(K) GERIATRI'])) return { ksm: 'Dokter Spesialis Kedokteran Jiwa Konsultan Geriatri', dept: 'Department of Medicine' };
  if (check(['SP.KJ(K) PSIKOSEKSUAL & MARITAL', 'SPKJ(K) PSIKOSEKSUAL & MARITAL', 'SP.KJ(K) PSIKOSEKSUAL DAN MARITAL'])) return { ksm: 'Dokter Spesialis Kedokteran Jiwa Konsultan Psikiatri Psikoseksual dan Marital', dept: 'Department of Medicine' };
  if (check(['SP.KJ(K) PEREMPUAN', 'SPKJ(K) PEREMPUAN'])) return { ksm: 'Dokter Spesialis Kedokteran Jiwa Konsultan Psikiatri Perempuan', dept: 'Department of Medicine' };
  if (check(['SP.KJ(K) PSIKOMETRIK', 'SPKJ(K) PSIKOMETRIK'])) return { ksm: 'Dokter Spesialis Kedokteran Jiwa Konsultan Psikometrik', dept: 'Department of Medicine' };
  if (check(['SP.KJ', 'SPKJ'])) return { ksm: 'Dokter Spesialis Kedokteran Jiwa', dept: 'Department of Medicine' };

  // --- Department of Neurologi ---
  if (check(['SP.S(K) EPILEPSI & NEUROFISIOLOGI', 'SPS(K) EPILEPSI & NEUROFISIOLOGI', 'SP.S(K) EPILEPSI DAN NEUROFISIOLOGI', 'SP.N(K) EPILEPSI'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Epilepsi dan Neurofisiologi', dept: 'Department of Neurologi' };
  if (check(['SP.S(K) NEUROINFEKSI', 'SPS(K) NEUROINFEKSI', 'SP.N(K) NEUROINFEKSI'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Neuro Infeksi', dept: 'Department of Neurologi' };
  if (check(['SP.S(K) NYERI', 'SPS(K) NYERI', 'SP.N(K) NYERI'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Neurologi Nyeri', dept: 'Department of Neurologi' };
  if (check(['SP.S(K) NEUROVASKULAR', 'SPS(K) NEUROVASKULAR', 'SP.N(K) NEUROVASKULAR'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Neurovaskular', dept: 'Department of Neurologi' };
  if (check(['SP.S(K) NEUROOTOLOGI/NEUROOPTHALMOLOGI', 'SPS(K) NEUROOTOLOGI', 'SP.S(K) NEUROOTOLOGI', 'SP.S(K) NEUROOPTHALMOLOGI'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Neurootologi / Neuroopthalmologi', dept: 'Department of Neurologi' };
  if (check(['SP.S(K) NEUROINTERVENSI', 'SPS(K) NEUROINTERVENSI', 'SP.N(K) NEUROINTERVENSI'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Neurointervensi', dept: 'Department of Neurologi' };
  if (check(['SP.S(K) NEUROIMAGING', 'SPS(K) NEUROIMAGING', 'SP.N(K) NEUROIMAGING'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Neuroimaging', dept: 'Department of Neurologi' };
  if (check(['SP.S(K) GANGGUAN TIDUR', 'SPS(K) GANGGUAN TIDUR', 'SP.N(K) GANGGUAN TIDUR'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Gangguan Tidur (Sleep Disorder)', dept: 'Department of Neurologi' };
  if (check(['SP.S(K) SARAF TEPI', 'SPS(K) SARAF TEPI', 'SP.N(K) SARAF TEPI'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Saraf Tepi', dept: 'Department of Neurologi' };
  if (check(['SP.S(K) SARAF ANAK', 'SPS(K) SARAF ANAK', 'SP.N(K) SARAF ANAK'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Saraf Anak', dept: 'Department of Neurologi' };
  if (check(['SP.S(K) NEURODEGENERATIF/NEUROBEHAVIOUR', 'SPS(K) NEURODEGENERATIF', 'SP.S(K) NEURODEGENERATIF', 'NEUROBEHAVIOUR'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Neurodegeneratif / Neurobehaviour', dept: 'Department of Neurologi' };
  if (check(['SP.S(K) NEUROONKOLOGI', 'SPS(K) NEUROONKOLOGI', 'SP.N(K) NEUROONKOLOGI'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Neuroonkologi', dept: 'Department of Neurologi' };
  if (check(['SP.S(K) GANGGUAN GERAK', 'SPS(K) GANGGUAN GERAK', 'SP.N(K) GANGGUAN GERAK'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Gangguan Gerak (Movement Disorder)', dept: 'Department of Neurologi' };
  if (check(['SP.S(K) NEUROKRITIKAL & INTENSIF', 'SPS(K) NEUROKRITIKAL & INTENSIF', 'SP.S(K) NEUROKRITIKAL'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Neurokritikal dan Intensif', dept: 'Department of Neurologi' };
  if (check(['SP.S', 'SPS', 'SP.N', 'SPN', 'NEURO'])) return { ksm: 'Dokter Spesialis Neurologi', dept: 'Department of Neurologi' };
  if (check(['SP.BS(K) NEUROFUNGSIONAL', 'SPBS(K) NEUROFUNGSIONAL'])) return { ksm: 'Dokter Spesialis Bedah Saraf Konsultan Neurofungsional', dept: 'Department of Neurologi' };
  if (check(['SP.BS(K) NEUROONKOLOGI & SKULL BASE', 'SPBS(K) NEUROONKOLOGI & SKULL BASE', 'SP.BS(K) NEUROONKOLOGI'])) return { ksm: 'Dokter Spesialis Bedah Saraf Konsultan Neuroonkologi + Skull Base', dept: 'Department of Neurologi' };
  if (check(['SP.BS(K) NEUROSPINE', 'SPBS(K) NEUROSPINE'])) return { ksm: 'Dokter Spesialis Bedah Saraf Konsultan Neurospine', dept: 'Department of Neurologi' };
  if (check(['SP.BS(K) NEUROVASKULAR', 'SPBS(K) NEUROVASKULAR'])) return { ksm: 'Dokter Spesialis Bedah Saraf Konsultan Neurovaskular', dept: 'Department of Neurologi' };
  if (check(['SP.BS(K) PEDIATRIK', 'SPBS(K) PEDIATRIK'])) return { ksm: 'Dokter Spesialis Bedah Saraf Konsultan Pediatrik', dept: 'Department of Neurologi' };
  if (check(['SP.BS(K) NEUROTRAUMA', 'SPBS(K) NEUROTRAUMA'])) return { ksm: 'Dokter Spesialis Bedah Saraf Konsultan Neurotrauma', dept: 'Department of Neurologi' };
  if (check(['SP.BS', 'SPBS'])) return { ksm: 'Dokter Spesialis Bedah Saraf', dept: 'Department of Neurologi' };
  if (check(['SP.A(K) NEUROPEDIATRI', 'SPA(K) NEUROPEDIATRI'])) return { ksm: 'Dokter Spesialis Anak Konsultan Neuropediatri', dept: 'Department of Neurologi' };
  if (check(['SP.KFR(K) NEUROMUSKULAR', 'SPKFR(K) NEUROMUSKULAR'])) return { ksm: 'Dokter Spesialis Kedokteran Fisik dan Rehabilitasi Konsultan Neuromuskular', dept: 'Department of Neurologi' };
  if (check(['SP.AN(K) NEUROANESTESI & NEURO CRITICAL CARE', 'SPAN(K) NEUROANESTESI', 'SP.AN(K) NEUROANESTESI'])) return { ksm: 'Dokter Spesialis Anestesiologi dan Terapi Intensif Konsultan Neuro Anestesi dan Neuro Critical Care', dept: 'Department of Neurologi' };

  // --- Department of Uro-Nephrology ---
  if (check(['SP.U(K) ANDROLOGI', 'SPU(K) ANDROLOGI'])) return { ksm: 'Dokter Spesialis Urologi Konsultan Urologi Andrologi', dept: 'Department of Uro-Nephrology' };
  if (check(['SP.U(K) UROLOGI PEREMPUAN FUNGSIONAL & NEURO', 'SPU(K) UROLOGI PEREMPUAN', 'SP.U(K) UROLOGI PEREMPUAN'])) return { ksm: 'Dokter Spesialis Urologi Konsultan Urologi Perempuan, Fungsional, dan Neuro - Urologi', dept: 'Department of Uro-Nephrology' };
  if (check(['SP.U(K) ONKOLOGI UROLOGI', 'SPU(K) ONKOLOGI UROLOGI', 'SP.U(K) ONKOLOGI'])) return { ksm: 'Dokter Spesialis Urologi Konsultan Urologi Onkologi', dept: 'Department of Uro-Nephrology' };
  if (check(['SP.U(K) PEDIATRIK UROLOGI', 'SPU(K) PEDIATRIK UROLOGI', 'SP.U(K) PEDIATRIK'])) return { ksm: 'Dokter Spesialis Urologi Konsultan Urologi Pediatrik', dept: 'Department of Uro-Nephrology' };
  if (check(['SP.U(K) REKONSTRUKSI', 'SPU(K) REKONSTRUKSI'])) return { ksm: 'Dokter Spesialis Urologi Konsultan Urologi Rekonstruksi', dept: 'Department of Uro-Nephrology' };
  if (check(['SP.U(K) TRANSPLANTASI', 'SPU(K) TRANSPLANTASI'])) return { ksm: 'Dokter Spesialis Urologi Konsultan Urologi Transplantasi', dept: 'Department of Uro-Nephrology' };
  if (check(['SP.U', 'SPU', 'UROLOGI'])) return { ksm: 'Dokter Spesialis Urologi', dept: 'Department of Uro-Nephrology' };
  if (check(['SP.DVE(K) VENEREOLOGI', 'SPDVE(K) VENEREOLOGI', 'SP.KK(K) VENEREOLOGI', 'SPKK(K) VENEREOLOGI'])) return { ksm: 'Dokter Spesialis Dermatologi, Venereologi, dan Estetika Konsultan Venereologi', dept: 'Department of Uro-Nephrology' };
  if (check(['SP.PD(K) GINJAL HIPERTENSI', 'SPPD(K) GINJAL HIPERTENSI', 'K-GH'])) return { ksm: 'Dokter Spesialis Penyakit Dalam Konsultan Ginjal Hipertensi', dept: 'Department of Uro-Nephrology' };
  if (check(['SP.A(K) NEFROLOGI', 'SPA(K) NEFROLOGI', 'K-NEFRO'])) return { ksm: 'Dokter Spesialis Anak Konsultan Nefrologi Anak', dept: 'Department of Uro-Nephrology' };
  if (check(['SP.OG(K) UROGINEKOLOGI REKONSTRUKSI', 'SPOG(K) UROGINEKOLOGI REKONSTRUKSI', 'UROGINEKOLOGI'])) return { ksm: 'Dokter Spesialis Obstetri dan Ginekologi Konsultan Uroginekologi Rekonstruksi', dept: 'Department of Uro-Nephrology' };

  // --- Department of Maternal and Child ---
  if (check(['SP.OG(K) FER', 'SPOG(K) FER', 'FER (FERTILITAS ENDOKRINOLOGI REPRODUKSI)', 'KFER'])) return { ksm: 'Dokter Spesialis Obstetri dan Ginekologi Konsultan Fertilitas dan Endokrinologi Reproduksi', dept: 'Department of Maternal and Child' };
  if (check(['SP.OG(K) FETOMATERNAL', 'SPOG(K) FETOMATERNAL', 'K-FM', 'FETOMATERNAL'])) return { ksm: 'Dokter Spesialis Obstetri dan Ginekologi Konsultan Fetomaternal', dept: 'Department of Maternal and Child' };
  if (check(['SP.OG(K) OBSTETRI GINEKOLOGI SOSIAL', 'SPOG(K) OBSTETRI GINEKOLOGI SOSIAL', 'OBSTETRI DAN GINEKOLOGI SOSIAL', 'OBGINSOS'])) return { ksm: 'Dokter Spesialis Obstetri dan Ginekologi Konsultan Obstetri dan Ginekologi Sosial', dept: 'Department of Maternal and Child' };
  if (check(['SP.OG', 'SPOG', 'KANDUNGAN'])) return { ksm: 'Dokter Spesialis Obstetri dan Ginekologi', dept: 'Department of Maternal and Child' };
  if (check(['SP.A(K) ENDOKRINOLOGI', 'SPA(K) ENDOKRINOLOGI', 'K-ENDO'])) return { ksm: 'Dokter Spesialis Anak Konsultan Endokrinologi', dept: 'Department of Maternal and Child' };
  if (check(['SP.A(K) NEONATOLOGI', 'SPA(K) NEONATOLOGI', 'K-NEO'])) return { ksm: 'Dokter Spesialis Anak Konsultan Neonatologi', dept: 'Department of Maternal and Child' };
  if (check(['SP.A(K) NUTRISI & METABOLIK', 'SPA(K) NUTRISI & METABOLIK', 'SP.A(K) NUTRISI DAN PENYAKIT METABOLIK'])) return { ksm: 'Dokter Spesialis Anak Konsultan Nutrisi dan Penyakit Metabolik', dept: 'Department of Maternal and Child' };
  if (check(['SP.A(K) RESPIROLOGI', 'SPA(K) RESPIROLOGI', 'K-RESPI'])) return { ksm: 'Dokter Spesialis Anak Konsultan Respirologi', dept: 'Department of Maternal and Child' };
  if (check(['SP.A(K) TUMBUH KEMBANG & PEDIATRI SOSIAL', 'SPA(K) TUMBUH KEMBANG', 'SP.A(K) TUMBUH KEMBANG'])) return { ksm: 'Dokter Spesialis Anak Konsultan Tumbuh Kembang - Pediatri Sosial', dept: 'Department of Maternal and Child' };
  if (check(['SP.A(K) EMERGENSI & INTENSIF ANAK', 'SPA(K) EMERGENSI & INTENSIF ANAK', 'K-ERIA', 'SP.A(K) EMERGENSI'])) return { ksm: 'Dokter Spesialis Anak Konsultan Emergensi dan Terapi Intensif Anak', dept: 'Department of Maternal and Child' };
  if (check(['SP.A', 'SPA', 'ANAK'])) return { ksm: 'Dokter Spesialis Anak', dept: 'Department of Maternal and Child' };
  if (check(['SP.BA(K) BEDAH UROGENITAL ANAK', 'SPBA(K) BEDAH UROGENITAL ANAK'])) return { ksm: 'Dokter Spesialis Bedah Anak Konsultan Bedah Urogenital Anak', dept: 'Department of Maternal and Child' };
  if (check(['SP.BA(K) BEDAH DIGESTIF ANAK', 'SPBA(K) BEDAH DIGESTIF ANAK'])) return { ksm: 'Dokter Spesialis Bedah Anak Konsultan Bedah Digestif Anak', dept: 'Department of Maternal and Child' };
  if (check(['SP.BA', 'SPBA'])) return { ksm: 'Dokter Spesialis Bedah Anak', dept: 'Department of Maternal and Child' };
  if (check(['SP.DVE(K) DERMATOLOGI ANAK', 'SPDVE(K) DERMATOLOGI ANAK', 'SP.KK(K) DERMATOLOGI ANAK'])) return { ksm: 'Dokter Spesialis Dermatologi, Venereologi, dan Estetika Konsultan Dermatologi Anak', dept: 'Department of Maternal and Child' };
  if (check(['SP.KFR(K) REHABILITASI PEDIATRIK', 'SPKFR(K) REHABILITASI PEDIATRIK'])) return { ksm: 'Dokter Spesialis Kedokteran Fisik dan Rehabilitasi Konsultan Rehabilitasi Pediatrik', dept: 'Department of Maternal and Child' };
  if (check(['SP.AN(K) ANESTESI OBSTETRI', 'SPAN(K) ANESTESI OBSTETRI'])) return { ksm: 'Dokter Spesialis Anestesiologi dan Terapi Intensif Konsultan Anestesi Obstetri', dept: 'Department of Maternal and Child' };
  if (check(['SP.AN(K) ANESTESI PEDIATRI', 'SPAN(K) ANESTESI PEDIATRI'])) return { ksm: 'Dokter Spesialis Anestesiologi dan Terapi Intensif Konsultan Anestesi Pediatri', dept: 'Department of Maternal and Child' };

  // --- Department of Oncology ---
  if (check(['SP.ONK.RAD(K) ABDOMINO-PELVIK', 'SPONKRAD(K) ABDOMINO-PELVIK', 'SP.ONK.RAD(K) ABDOMINO'])) return { ksm: 'Dokter Spesialis Onkologi Radiasi Konsultan Keganasan Abdomino - Pelvik', dept: 'Department of Oncology' };
  if (check(['SP.ONK.RAD(K) KEPALA, LEHER & SSP', 'SPONKRAD(K) KEPALA, LEHER & SSP', 'SP.ONK.RAD(K) KEPALA'])) return { ksm: 'Dokter Spesialis Onkologi Radiasi Konsultan Kepala, Leher dan Sistem Saraf Pusat', dept: 'Department of Oncology' };
  if (check(['SP.ONK.RAD(K) TORAKS, PEDIATRIK & LIMFO-MUSKULOSKELETAL', 'SPONKRAD(K) TORAKS', 'SP.ONK.RAD(K) TORAKS'])) return { ksm: 'Dokter Spesialis Onkologi Radiasi Konsultan Toraks, Pediatrik dan Limpho-muskuloskeletal', dept: 'Department of Oncology' };
  if (check(['SP.ONK.RAD', 'SPONKRAD'])) return { ksm: 'Dokter Spesialis Onkologi Radiasi', dept: 'Department of Oncology' };
  if (check(['SP.PD(K) HEMATOLOGI ONKOLOGI MEDIK', 'SPPD(K) HEMATOLOGI ONKOLOGI MEDIK', 'K-HOM'])) return { ksm: 'Dokter Spesialis Penyakit Dalam Konsultan Hematologi Onkologi Medik', dept: 'Department of Oncology' };
  if (check(['SP.OG(K) ONKOLOGI GINEKOLOGI', 'SPOG(K) ONKOLOGI GINEKOLOGI'])) return { ksm: 'Dokter Spesialis Obstetri dan Ginekologi Konsultan Onkologi Ginekologi', dept: 'Department of Oncology' };
  if (check(['SP.A(K) HEMATOONKOLOGI', 'SPA(K) HEMATOONKOLOGI', 'SP.A(K) HEMATOLOGI ONKOLOGI'])) return { ksm: 'Dokter Spesialis Anak Konsultan Hematoonkologi', dept: 'Department of Oncology' };
  if (check(['SP.BM(K) ONKOLOGI BEDAH MULUT & MAKSILOFASIAL', 'SPBM(K) ONKOLOGI BEDAH MULUT', 'SP.BM(K) ONKOLOGI'])) return { ksm: 'Dokter Gigi Dokter Spesialis Bedah Mulut Neoplasma dan Kista Bedah Mulut dan Maksilofasial', dept: 'Department of Oncology' };
  if (check(['SP.B(K) BEDAH ONKOLOGI', 'SPB(K) BEDAH ONKOLOGI', 'K-ONK'])) return { ksm: 'Dokter Spesialis Bedah Konsultan Bedah Onkologi', dept: 'Department of Oncology' };
  if (check(['SP.THT-KL(K) ONKOLOGI BEDAH KEPALA LEHER', 'SPTHT-KL(K) ONKOLOGI', 'SP.THT(K) ONKOLOGI'])) return { ksm: 'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Onkologi - Bedah Kepala Leher', dept: 'Department of Oncology' };
  if (check(['SP.DVE(K) ONKOLOGI & BEDAH KULIT', 'SPDVE(K) ONKOLOGI & BEDAH KULIT', 'SP.KK(K) ONKOLOGI'])) return { ksm: 'Dokter Spesialis Dermatologi, Venereologi, dan Estetika Konsultan Onkologi dan Bedah Kulit', dept: 'Department of Oncology' };

  // --- Department of Anesthesiology ---
  if (check(['SP.AN(K) ANESTESI REGIONAL', 'SPAN(K) ANESTESI REGIONAL'])) return { ksm: 'Dokter Spesialis Anestesiologi dan Terapi Intensif Konsultan Anestesi Regional', dept: 'Department of Anesthesiology' };
  if (check(['SP.AN(K) MANAJEMEN NYERI', 'SPAN(K) MANAJEMEN NYERI'])) return { ksm: 'Dokter Spesialis Anestesiologi dan Terapi Intensif Konsultan Manajemen Nyeri', dept: 'Department of Anesthesiology' };
  if (check(['SP.AN(K) INTENSIVE CARE (KIC)', 'SPAN(K) INTENSIVE CARE', 'KIC'])) return { ksm: 'Dokter Spesialis Anestesiologi dan Terapi Intensif Konsultan Intensive Care (KIC)', dept: 'Department of Anesthesiology' };
  if (check(['SP.AN', 'SPAN'])) return { ksm: 'Dokter Spesialis Anestesiologi dan Terapi Intensif', dept: 'Department of Anesthesiology' };

  // --- Department of Supporting Medicine ---
  if (check(['SP.PK(K) HEMATOLOGI KLINIK', 'SPPK(K) HEMATOLOGI KLINIK'])) return { ksm: 'Dokter Spesialis Patologi Klinik Konsultan Hematologi Klinik', dept: 'Department of Supporting Medicine' };
  if (check(['SP.PK(K) ONKOLOGI KLINIK', 'SPPK(K) ONKOLOGI KLINIK'])) return { ksm: 'Dokter Spesialis Patologi Klinik Konsultan Onkologi Klinik', dept: 'Department of Supporting Medicine' };
  if (check(['SP.PK(K) NEFROLOGI & RESPIRASI', 'SPPK(K) NEFROLOGI & RESPIRASI', 'SP.PK(K) NEFROLOGI DAN RESPIRASI'])) return { ksm: 'Dokter Spesialis Patologi Klinik Konsultan Nefrologi dan Respirasi', dept: 'Department of Supporting Medicine' };
  if (check(['SP.PK(K) GASTROENTEROHEPATOLOGI', 'SPPK(K) GASTROENTEROHEPATOLOGI'])) return { ksm: 'Dokter Spesialis Patologi Klinik Konsultan Gastroenterohepatologi', dept: 'Department of Supporting Medicine' };
  if (check(['SP.PK(K) PENYAKIT INFEKSI', 'SPPK(K) PENYAKIT INFEKSI'])) return { ksm: 'Dokter Spesialis Patologi Klinik Konsultan Penyakit Infeksi', dept: 'Department of Supporting Medicine' };
  if (check(['SP.PK(K) BANK DARAH & TRANSFUSI', 'SPPK(K) BANK DARAH', 'SP.PK(K) BANK DARAH'])) return { ksm: 'Dokter Spesialis Patologi Klinik Konsultan Bank Darah & Kedokteran Transfusi', dept: 'Department of Supporting Medicine' };
  if (check(['SP.PK(K) IMUNOLOGI KLINIK', 'SPPK(K) IMUNOLOGI KLINIK'])) return { ksm: 'Dokter Spesialis Patologi Klinik Konsultan Imunologi Klinik', dept: 'Department of Supporting Medicine' };
  if (check(['SP.PK(K) ENDOKRIN & METABOLISME', 'SPPK(K) ENDOKRIN'])) return { ksm: 'Dokter Spesialis Patologi Klinik Konsultan Endokrin & Metabolisme', dept: 'Department of Supporting Medicine' };
  if (check(['SP.PK', 'SPPK'])) return { ksm: 'Dokter Spesialis Patologi Klinik', dept: 'Department of Supporting Medicine' };
  if (check(['SP.PA(K) UROPATOLOGI REPRODUKSI LAKI-LAKI', 'SPPA(K) UROPATOLOGI'])) return { ksm: 'Dokter Spesialis Patologi Anatomi Konsultan Patologi Uropatologi Reproduksi Laki-laki', dept: 'Department of Supporting Medicine' };
  if (check(['SP.PA(K) KULIT & ADNEKSA', 'SPPA(K) KULIT'])) return { ksm: 'Dokter Spesialis Patologi Anatomi Konsultan Patologi Kulit dan Adneksa', dept: 'Department of Supporting Medicine' };
  if (check(['SP.PA(K) DIGESTIF HEPATOBILIER', 'SPPA(K) DIGESTIF'])) return { ksm: 'Dokter Spesialis Patologi Anatomi Konsultan Patologi Digestif Hepatobilier', dept: 'Department of Supporting Medicine' };
  if (check(['SP.PA(K) HEMATOLIMFOID & ENDOKRIN', 'SPPA(K) HEMATOLIMFOID'])) return { ksm: 'Dokter Spesialis Patologi Anatomi Konsultan Patologi Hematolimfoid dan Endokrin', dept: 'Department of Supporting Medicine' };
  if (check(['SP.PA(K) OBSTETRI GINEKOLOGI PAYUDARA', 'SPPA(K) OBSTETRI GINEKOLOGI'])) return { ksm: 'Dokter Spesialis Patologi Anatomi Konsultan Patologi Obstetri Ginekologi Payudara', dept: 'Department of Supporting Medicine' };
  if (check(['SP.PA(K) SITOPATOLOGI', 'SPPA(K) SITOPATOLOGI'])) return { ksm: 'Dokter Spesialis Patologi Anatomi Konsultan Sitopatologi', dept: 'Department of Supporting Medicine' };
  if (check(['SP.PA(K) MUSKULOSKELETAL', 'SPPA(K) MUSKULOSKELETAL'])) return { ksm: 'Dokter Spesialis Patologi Anatomi Konsultan Patologi Muskuloskeletal', dept: 'Department of Supporting Medicine' };
  if (check(['SP.PA(K) SARAF & MATA', 'SPPA(K) SARAF'])) return { ksm: 'Dokter Spesialis Patologi Anatomi Konsultan Patologi Saraf dan Mata', dept: 'Department of Supporting Medicine' };
  if (check(['SP.PA(K) KARDIOVASKULAR RESPIRASI MEDIASTINUM', 'SPPA(K) KARDIOVASKULAR RESPIRASI'])) return { ksm: 'Dokter Spesialis Patologi Anatomi Konsultan Patologi Kardiovaskular Respirasi dan Mediastinum', dept: 'Department of Supporting Medicine' };
  if (check(['SP.PA', 'SPPA'])) return { ksm: 'Dokter Spesialis Patologi Anatomi', dept: 'Department of Supporting Medicine' };
  if (check(['SP.MK', 'SPMK'])) return { ksm: 'Dokter Spesialis Mikrobiologi Klinik', dept: 'Department of Supporting Medicine' };
  if (check(['SP.KFR', 'SPKFR'])) return { ksm: 'Dokter Spesialis Kedokteran Fisik dan Rehabilitasi', dept: 'Department of Supporting Medicine' };

  // --- Department of Dermatology & Aesthetic ---
  if (check(['SP.DVE(K) DERMATOLOGI KOSMETIK & ESTETIK', 'SPDVE(K) DERMATOLOGI KOSMETIK'])) return { ksm: 'Dokter Spesialis Dermatologi, Venereologi, dan Estetika Konsultan Dermatologi Kosmetik dan Estetik', dept: 'Department of Dermatology & Aesthetic' };
  if (check(['SP.DVE', 'SPDVE', 'SP.KK', 'SPKK'])) return { ksm: 'Dokter Spesialis Dermatologi, Venereologi, dan Estetika', dept: 'Department of Dermatology & Aesthetic' };
  if (check(['SP.BP-RE(K) LUKA BAKAR (K-LB)', 'SPBP-RE(K) LUKA BAKAR', 'K-LB', 'SP.BP-RE(K) LUKA BAKAR'])) return { ksm: 'Dokter Spesialis Bedah Plastik, Rekonstruksi, dan Estetik Konsultan Bidang Luka Bakar', dept: 'Department of Dermatology & Aesthetic' };
  if (check(['SP.BP-RE(K) BEDAH ESTETIK LANJUT', 'SPBP-RE(K) BEDAH ESTETIK LANJUT'])) return { ksm: 'Dokter Spesialis Bedah Plastik, Rekonstruksi, dan Estetik Konsultan Bidang Bedah Estetik Lanjut', dept: 'Department of Dermatology & Aesthetic' };
  if (check(['SP.BP-RE', 'SPBP-RE'])) return { ksm: 'Dokter Spesialis Bedah Plastik, Rekonstruksi, dan Estetik', dept: 'Department of Dermatology & Aesthetic' };
  if (check(['SP.KG', 'SPKG'])) return { ksm: 'Dokter Gigi Spesialis Konservasi Gigi', dept: 'Department of Dermatology & Aesthetic' };
  if (check(['SP.ORT', 'SPORT'])) return { ksm: 'Dokter Gigi Spesialis Orthodonti', dept: 'Department of Dermatology & Aesthetic' };
  if (check(['SP.PM', 'SPPM'])) return { ksm: 'Dokter Gigi Spesialis Penyakit Mulut', dept: 'Department of Dermatology & Aesthetic' };
  if (check(['SP.PERIO', 'SPPERIO'])) return { ksm: 'Dokter Gigi Spesialis Periodonsia', dept: 'Department of Dermatology & Aesthetic' };
  if (check(['SP.PROS(K) PROSTETIK MAKSILOFASIAL', 'SPPROS(K) PROSTETIK MAKSILOFASIAL'])) return { ksm: 'Dokter Gigi Spesialis Prosthodonsia Konsultan Prostetik Maksilofasial', dept: 'Department of Dermatology & Aesthetic' };
  if (check(['SP.PROS', 'SPPROS'])) return { ksm: 'Dokter Gigi Spesialis Prosthodonsia', dept: 'Department of Dermatology & Aesthetic' };
  if (check(['SP.KGA', 'SPKGA'])) return { ksm: 'Dokter Gigi Spesialis Kesehatan Gigi Anak', dept: 'Department of Dermatology & Aesthetic' };

  // --- Department of Otolaryngology (ENT) ---
  if (check(['SP.THT-KL(K) BRONKOESOFAGOLOGI', 'SPTHT-KL(K) BRONKOESOFAGOLOGI', 'SP.THT(K) BRONKOESOFAGOLOGI'])) return { ksm: 'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Bronkoesofagologi', dept: 'Department of Otolaryngology (ENT)' };
  if (check(['SP.THT-KL(K) LARING-FARING', 'SPTHT-KL(K) LARING-FARING', 'SP.THT(K) LARING-FARING'])) return { ksm: 'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Laring - Faring', dept: 'Department of Otolaryngology (ENT)' };
  if (check(['SP.THT-KL(K) MAKSILOFASIAL PLASTIK REKONSTRUKSI', 'SPTHT-KL(K) MAKSILOFASIAL', 'SP.THT(K) MAKSILOFASIAL'])) return { ksm: 'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Maksilofasial Plastik Rekonstruksi', dept: 'Department of Otolaryngology (ENT)' };
  if (check(['SP.THT-KL(K) NEUROTOLOGI', 'SPTHT-KL(K) NEUROTOLOGI', 'SP.THT(K) NEUROTOLOGI'])) return { ksm: 'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Neurotologi', dept: 'Department of Otolaryngology (ENT)' };
  if (check(['SP.THT-KL(K) OTOLOGI', 'SPTHT-KL(K) OTOLOGI', 'SP.THT(K) OTOLOGI'])) return { ksm: 'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Otologi', dept: 'Department of Otolaryngology (ENT)' };
  if (check(['SP.THT-KL(K) RINOLOGI', 'SPTHT-KL(K) RINOLOGI', 'SP.THT(K) RINOLOGI'])) return { ksm: 'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Rinologi', dept: 'Department of Otolaryngology (ENT)' };
  if (check(['SP.THT-KL(K) ALERGI IMUNOLOGI', 'SPTHT-KL(K) ALERGI IMUNOLOGI', 'SP.THT(K) ALERGI IMUNOLOGI'])) return { ksm: 'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Alergi Imunologi', dept: 'Department of Otolaryngology (ENT)' };
  if (check(['SP.THT-KL(K) THT KOMUNITAS', 'SPTHT-KL(K) THT KOMUNITAS', 'SP.THT(K) THT KOMUNITAS'])) return { ksm: 'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan THT Komunitas', dept: 'Department of Otolaryngology (ENT)' };
  if (check(['SP.THT-KL', 'SPTHT-KL', 'SP.THT', 'SPTHT', 'THT'])) return { ksm: 'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher', dept: 'Department of Otolaryngology (ENT)' };

  // --- Department of Immunology and Infectious Diseases ---
  if (check(['SP.A(K) ALERGI IMUNOLOGI & RHEUMATOLOGI', 'SPA(K) ALERGI IMUNOLOGI', 'SP.A(K) ALERGI IMUNOLOGI'])) return { ksm: 'Dokter Spesialis Anak Konsultan Alergi Imunologi dan Rheumatologi', dept: 'Department of Immunology and Infectious Diseases' };
  if (check(['SP.A(K) INFEKSI & PENYAKIT TROPIS', 'SPA(K) INFEKSI & PENYAKIT TROPIS', 'SP.A(K) INFEKSI'])) return { ksm: 'Dokter Spesialis Anak Konsultan Infeksi dan Penyakit Tropis', dept: 'Department of Immunology and Infectious Diseases' };
  if (check(['SP.PD(K) TROPIK INFEKSI (K-PTI)', 'SPPD(K) TROPIK INFEKSI', 'K-PTI'])) return { ksm: 'Dokter Spesialis Penyakit Dalam Konsultan Penyakit Tropik dan Infeksi', dept: 'Department of Immunology and Infectious Diseases' };
  if (check(['SP.PD(K) RHEUMATOLOGI (K-R)', 'SPPD(K) RHEUMATOLOGI', 'K-R', 'REUMATOLOGI'])) return { ksm: 'Dokter Spesialis Penyakit Dalam Konsultan Rheumatologi', dept: 'Department of Immunology and Infectious Diseases' };
  if (check(['SP.DVE(K) DERMATO ALERGI IMUNOLOGI', 'SPDVE(K) DERMATO ALERGI IMUNOLOGI', 'SP.KK(K) DERMATO ALERGI IMUNOLOGI'])) return { ksm: 'Dokter Spesialis Dermatologi, Venereologi, dan Estetika Konsultan Dermato Alergi Imunologi', dept: 'Department of Immunology and Infectious Diseases' };
  if (check(['SP.DVE(K) DERMATOLOGI TROPIS', 'SPDVE(K) DERMATOLOGI TROPIS', 'SP.KK(K) DERMATOLOGI TROPIS'])) return { ksm: 'Dokter Spesialis Dermatologi, Venereologi, dan Estetika Konsultan Dermatologi Tropis', dept: 'Department of Immunology and Infectious Diseases' };

  // --- Department of Surgery ---
  if (check(['SP.BM(K) CLEFT LIP & PALATE', 'SPBM(K) CLEFT LIP & PALATE'])) return { ksm: 'Dokter Gigi Spesialis Bedah Mulut dan Maksilofasial Konsultan Oral dan Maksilofasial Cleft / Cleft Lip and Palate', dept: 'Department of Surgery' };
  if (check(['SP.BM(K) ORTHOGNATIK & OSTEODISTRAKSI', 'SPBM(K) ORTHOGNATIK & OSTEODISTRAKSI'])) return { ksm: 'Dokter Gigi Spesialis Bedah Mulut dan Maksilofasial Konsultan Orthognatik dan Osteodistraksi / Disgnatia dan Osteodistraksi', dept: 'Department of Surgery' };
  if (check(['SP.BM(K) TRAUMA MAKSILOFASIAL & TMJ', 'SPBM(K) TRAUMA MAKSILOFASIAL & TMJ'])) return { ksm: 'Dokter Gigi Spesialis Bedah Mulut dan Maksilofasial Konsultan Trauma Maksilofasial dan Temporomandibular Joint', dept: 'Department of Surgery' };
  if (check(['SP.BM', 'SPBM'])) return { ksm: 'Dokter Gigi Spesialis Bedah Mulut dan Maksilofasial', dept: 'Department of Surgery' };
  if (check(['SP.F', 'SPF', 'SP.FM', 'SPFM', 'FORENSIK'])) return { ksm: 'Dokter Spesialis Kedokteran Forensik dan Medikolegal', dept: 'Department of Surgery' };
  if (check(['SP.B', 'SPB', 'BEDAH UMUM'])) return { ksm: 'Dokter Spesialis Bedah Umum', dept: 'Department of Surgery' };
  if (check(['SP.M', 'SPM', 'MATA'])) return { ksm: 'Dokter Spesialis Mata', dept: 'Department of Surgery' };

  // --- Department of Radiology ---
  if (check(['SP.RAD(K) ABDOMEN', 'SPRAD(K) ABDOMEN'])) return { ksm: 'Dokter Spesialis Radiologi Konsultan Radiologi Abdomen', dept: 'Department of Radiology' };
  if (check(['SP.RAD(K) MUSKULOSKELETAL', 'SPRAD(K) MUSKULOSKELETAL'])) return { ksm: 'Dokter Spesialis Radiologi Konsultan Radiologi Muskuloskeletal', dept: 'Department of Radiology' };
  if (check(['SP.RAD(K) NEUROIMAGING', 'SPRAD(K) NEUROIMAGING'])) return { ksm: 'Dokter Spesialis Radiologi Konsultan Radiologi Neuroimaging', dept: 'Department of Radiology' };
  if (check(['SP.RAD(K) TORAKS & KARDIOVASKULAR', 'SPRAD(K) TORAKS & KARDIOVASKULAR', 'SP.RAD(K) TORAKS DAN KARDIOVASKULAR'])) return { ksm: 'Dokter Spesialis Radiologi Konsultan Radiologi Toraks dan Kardiovaskular', dept: 'Department of Radiology' };
  if (check(['SP.RAD(K) INTERVENSIONAL & KARDIOVASKULAR', 'SPRAD(K) INTERVENSIONAL & KARDIOVASKULAR', 'SP.RAD(K) INTERVENSIONAL DAN KARDIOVASKULAR'])) return { ksm: 'Dokter Spesialis Radiologi Konsultan Radiologi Intervensional dan Kardiovaskular', dept: 'Department of Radiology' };
  if (check(['SP.RAD(K) ANAK', 'SPRAD(K) ANAK'])) return { ksm: 'Dokter Spesialis Radiologi Konsultan Radiologi Anak', dept: 'Department of Radiology' };
  if (check(['SP.RAD(K) PAYUDARA & REPRODUKSI WANITA', 'SPRAD(K) PAYUDARA'])) return { ksm: 'Dokter Spesialis Radiologi Konsultan Payudara dan Reproduksi Wanita', dept: 'Department of Radiology' };
  if (check(['SP.RAD(K) INTERVENSI', 'SPRAD(K) INTERVENSI'])) return { ksm: 'Dokter Spesialis Radiologi Konsultan Radiologi Intervensi', dept: 'Department of Radiology' };
  if (check(['SP.RAD', 'SPRAD'])) return { ksm: 'Dokter Spesialis Radiologi', dept: 'Department of Radiology' };
  if (check(['SP.KN(K) NUKLIR KARDIOLOGI', 'SPKN(K) NUKLIR KARDIOLOGI'])) return { ksm: 'Dokter Spesialis Kedokteran Nuklir Teranostik Molekuler Konsultan Nuklir Kardiologi', dept: 'Department of Radiology' };
  if (check(['SP.KN(K) NUKLIR NEUROLOGI', 'SPKN(K) NUKLIR NEUROLOGI'])) return { ksm: 'Dokter Spesialis Kedokteran Nuklir Teranostik Molekuler Konsultan Nuklir Neurologi', dept: 'Department of Radiology' };
  if (check(['SP.KN(K) NUKLIR ONKOLOGI', 'SPKN(K) NUKLIR ONKOLOGI'])) return { ksm: 'Dokter Spesialis Kedokteran Nuklir Teranostik Molekuler Konsultan Nuklir Onkologi', dept: 'Department of Radiology' };
  if (check(['SP.KN(K) NUKLIR PEDIATRIK', 'SPKN(K) NUKLIR PEDIATRIK'])) return { ksm: 'Dokter Spesialis Kedokteran Nuklir Teranostik Molekuler Konsultan Nuklir Pediatrik', dept: 'Department of Radiology' };
  if (check(['SP.KN', 'SPKN'])) return { ksm: 'Dokter Spesialis Kedokteran Nuklir Teranostik Molekuler', dept: 'Department of Radiology' };

  // --- Department of Orthopaedy ---
  if (check(['SP.OT(K) ADVANCED ORTHOPAEDIC TRAUMA', 'SPOT(K) ADVANCED ORTHOPAEDIC TRAUMA'])) return { ksm: 'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Advanced Orthopaedic Trauma', dept: 'Department of Orthopaedy' };
  if (check(['SP.OT(K) FOOT AND ANKLE', 'SPOT(K) FOOT AND ANKLE'])) return { ksm: 'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Foot and Ankle', dept: 'Department of Orthopaedy' };
  if (check(['SP.OT(K) HAND, UPPER LIMB & MICROSURGERY', 'SPOT(K) HAND, UPPER LIMB'])) return { ksm: 'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Hand, Upper Limb and Microsurgery', dept: 'Department of Orthopaedy' };
  if (check(['SP.OT(K) HIP & KNEE', 'SPOT(K) HIP & KNEE'])) return { ksm: 'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Hip and Knee (Adult Reconstruction, Trauma and Sport)', dept: 'Department of Orthopaedy' };
  if (check(['SP.OT(K) SPINE', 'SPOT(K) SPINE'])) return { ksm: 'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Spine', dept: 'Department of Orthopaedy' };
  if (check(['SP.OT(K) SPORT INJURY', 'SPOT(K) SPORT INJURY'])) return { ksm: 'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Sport Injury', dept: 'Department of Orthopaedy' };
  if (check(['SP.OT(K) SHOULDER & ELBOW', 'SPOT(K) SHOULDER & ELBOW'])) return { ksm: 'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Shoulder and Elbow', dept: 'Department of Orthopaedy' };
  if (check(['SP.OT(K) PEDIATRIC ORTHOPAEDIC', 'SPOT(K) PEDIATRIC ORTHOPAEDIC'])) return { ksm: 'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Pediatric Orthopaedic', dept: 'Department of Orthopaedy' };
  if (check(['SP.OT(K) ONKOLOGI REKONSTRUKSI', 'SPOT(K) ONKOLOGI REKONSTRUKSI'])) return { ksm: 'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Onkologi Rekonstruksi', dept: 'Department of Orthopaedy' };
  if (check(['SP.OT', 'SPOT', 'ORTHOPAEDI'])) return { ksm: 'Dokter Spesialis Orthopaedi dan Traumatologi', dept: 'Department of Orthopaedy' };
  if (check(['SP.KO', 'SPKO'])) return { ksm: 'Dokter Spesialis Kedokteran Olahraga', dept: 'Department of Orthopaedy' };
  if (check(['SP.KFR(K) REHABILITASI MUSKULOSKELETAL', 'SPKFR(K) REHABILITASI MUSKULOSKELETAL'])) return { ksm: 'Dokter Spesialis Kedokteran Fisik dan Rehabilitasi Konsultan Rehabilitasi Muskuloskeletal', dept: 'Department of Orthopaedy' };

  // --- Fallback (Dokter Umum) ---
  if (check(['DR. ']) && !n.includes('SP')) return { ksm: 'Dokter Umum', dept: 'Department of Medicine' };

  return { ksm: 'Kedokteran Umum', dept: 'Department of Medicine' };
};

const extractKsm = (dpjp) => resolveKsmDept(dpjp).ksm;
const getDept = (ksm, dpjp) => resolveKsmDept(dpjp).dept;

const getCLName = (cl) => ({ 0: 'No CC', 1: 'Mild CC', 2: 'Moderate CC', 3: 'Severe CC', 4: 'Catastrophic CC', 9: 'Merge CC' }[cl] || 'Unknown');

const exportToCSV = (filename, headers, rows) => {
  const escapeCsv = (val) => `"${String(val !== undefined && val !== null ? val : '').replace(/"/g, '""')}"`;
  const csvData = [headers.map(escapeCsv).join(";")];
  rows.forEach(row => csvData.push(row.map(escapeCsv).join(";")));
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI("data:text/csv;charset=utf-8,\uFEFF" + csvData.join("\n")));
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

const exportToXlsx = (filename, headers, rows) => {
  const escXml = (v) => String(v != null ? v : '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const isNum = (v) => typeof v === 'number' && isFinite(v);
  let sheetRows = '<Row ss:StyleID="hdr">' + headers.map(h => `<Cell><Data ss:Type="String">${escXml(h)}</Data></Cell>`).join('') + '</Row>';
  rows.forEach(row => {
    sheetRows += '<Row>' + row.map(v => {
      if (isNum(v)) return `<Cell ss:StyleID="num"><Data ss:Type="Number">${v}</Data></Cell>`;
      return `<Cell><Data ss:Type="String">${escXml(v)}</Data></Cell>`;
    }).join('') + '</Row>';
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
<Style ss:ID="Default"><Font ss:FontName="Calibri" ss:Size="11"/></Style>
<Style ss:ID="hdr"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#2E86AB" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>
<Style ss:ID="num"><NumberFormat ss:Format="#,##0"/></Style>
</Styles>
<Worksheet ss:Name="Data"><Table>${sheetRows}</Table></Worksheet>
</Workbook>`;
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xls`;
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

const formatRp = (val, short = false) => {
  if (val === undefined || isNaN(val) || !isFinite(val)) return short ? '0' : 'Rp 0';
  const absVal = Math.abs(val); const sign = val < 0 ? '-' : '';
  const pfx = short ? '' : 'Rp ';
  if (absVal >= 1e12) return `${sign}${pfx}${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(absVal / 1e12)} T`;
  if (absVal >= 1e9) return `${sign}${pfx}${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(absVal / 1e9)} M`;
  if (absVal >= 1e6) return `${sign}${pfx}${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(absVal / 1e6)} Jt`;
  if (absVal >= 1e3 && short) return `${sign}${pfx}${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(absVal / 1e3)} rb`;
  return `${sign}${pfx}${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(absVal)}`;
};

const formatRpEx = (val) => (val === undefined || isNaN(val) || !isFinite(val) || val === 0) ? "-" : `${val < 0 ? '-' : ''}Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.abs(val))}`;
const formatPct = (val) => (isNaN(val) || !isFinite(val) || val == null) ? "0.00" : Number(val).toFixed(2);
const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const p = String(dateStr).split('/');
  if (p.length === 3) return new Date(`${p[2]}-${p[1]}-${p[0]}`);
  const d = new Date(dateStr); return isNaN(d.getTime()) ? null : d;
};

// --- REUSABLE UI COMPONENTS ---
const Card = React.memo(({ children, className = '', id = null, downloadTitle = null }) => {
  const hasBg = className.split(' ').some(c => c.startsWith('bg-'));
  return (
    <div id={id} className={`${hasBg ? '' : 'bg-white'} rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 relative group ${className}`}>
      {downloadTitle && id && (
        <button onClick={(e) => { e.stopPropagation(); saveAsPng(id, downloadTitle); }} className="absolute top-4 right-4 text-slate-400 hover:text-sky-600 bg-slate-50 hover:bg-sky-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1 z-[60] print:hidden">
          <Download size={14} /> Simpan PNG
        </button>
      )}
      {children}
    </div>
  );
});

const SectionHeader = React.memo(({ icon: Icon, title, desc, exportAction, exportText, printAction, colorClass, highlightClass }) => (
  <Card className="flex flex-col md:flex-row items-center justify-between gap-6 relative p-6">
    <div className={`absolute -left-20 -top-20 w-64 h-64 rounded-full blur-3xl pointer-events-none ${highlightClass}`}></div>
    <div className="relative z-10 flex-1">
      <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${colorClass}`}><Icon size={24} /></div> {title}
      </h3>
      <p className="text-sm font-medium text-slate-500 mt-2 max-w-3xl" dangerouslySetInnerHTML={{ __html: desc }}></p>
    </div>
    <div className="flex items-center gap-3 shrink-0 print:hidden z-10">
      <button onClick={() => window.print()} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-sky-600 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:-translate-y-0.5 transition-all shadow-sm">
        <Printer size={16} /> Print Cetak
      </button>
      {exportAction && (
        <button onClick={exportAction} className={`text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:-translate-y-0.5 transition-all ${colorClass.replace('-50', '-600').replace('text-', 'shadow-')}`}>
          <Download size={16} /> {exportText || 'Ekspor Data'}
        </button>
      )}
    </div>
  </Card>
));

const MiniTable = React.memo(({ data = [], columns = [], onRowClick, maxHeight = "400px", maxRows = 100 }) => {
  const visibleData = useMemo(() => data.slice(0, maxRows), [data, maxRows]);
  return (
    <div className={`overflow-x-auto flex-1 p-2 custom-scrollbar`} style={{ maxHeight }}>
      <table className="w-full text-xs text-left whitespace-nowrap">
        <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
          <tr>{columns.map((col, i) => <th key={`col-${i}`} className={`p-3 border-b border-slate-100 ${col.hClass || col.className || ''}`}>{col.header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {visibleData.map((row, i) => (
            <tr
              key={`row-${i}`}
              className={`animate-in fade-in slide-in-from-bottom-2 duration-300 transition-colors ${onRowClick ? 'hover:bg-slate-50/50 cursor-pointer' : ''}`}
              style={{ animationDelay: `${Math.min(i * 30, 600)}ms`, animationFillMode: 'both' }}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((col, j) => <td key={`cell-${i}-${j}`} className={`p-3 ${col.className || ''}`}>{col.render(row, i)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > maxRows && <div className="p-2 text-xs text-slate-500 text-center font-semibold">Showing {visibleData.length} of {data.length} rows</div>}
    </div>
  );
});

const FilterSelect = React.memo(({ label, value, onChange, options, valKey = 'value', lblKey = 'label', isClass = '' }) => (
  <div className="flex items-center gap-3 flex-1 min-w-[150px]">
    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-md">{label}</span>
    <select value={value} onChange={onChange} className={`bg-transparent border-0 border-b-2 border-slate-200 pb-1 text-sm font-extrabold focus:ring-0 focus:border-sky-500 outline-none cursor-pointer w-full transition-colors truncate ${isClass}`}>
      {options.map((opt, i) => <option key={i} value={opt[valKey]}>{opt[lblKey]}</option>)}
    </select>
  </div>
));

const MultiSelectFilter = React.memo(({ label, selectedValues, onChange, options, valKey = 'value', lblKey = 'label', isClass = '', icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleVal = (v) => {
    if (selectedValues.includes(v)) onChange(selectedValues.filter(x => x !== v));
    else onChange([...selectedValues, v]);
  };

  const selectAll = () => onChange([]);
  const isAll = selectedValues.length === 0;

  return (
    <div className="relative flex flex-col gap-1.5 flex-1 min-w-[200px]" ref={containerRef}>
      <div className="flex items-center gap-2 px-1">
        {Icon && <Icon size={12} className="text-slate-400" />}
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <div
        className={`bg-white border-2 rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer w-full transition-all truncate flex justify-between items-center group ${isOpen ? 'border-sky-500 ring-4 ring-sky-500/10 shadow-lg' : 'border-slate-100 hover:border-slate-300 hover:shadow-md'} ${isClass}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`truncate ${isAll ? 'text-slate-400' : 'text-slate-800'}`}>{isAll ? `Semua ${label}` : `${selectedValues.length} ${label} dipilih`}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 text-slate-400 ${isOpen ? 'rotate-180 text-sky-500' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-slate-200 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] rounded-2xl z-[100] max-h-80 overflow-y-auto custom-scrollbar p-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className="flex items-center gap-3 px-3 py-3 hover:bg-slate-50 cursor-pointer rounded-xl mb-1 border-b border-slate-100 transition-colors"
            onClick={selectAll}
          >
            <div className={`w-5 h-5 rounded-lg flex items-center justify-center border-2 transition-all ${isAll ? 'bg-sky-500 border-sky-500 text-white' : 'border-slate-200 bg-white'}`}>{isAll && <CheckSquare size={14} />}</div>
            <span className={`text-sm font-black ${isAll ? 'text-sky-700' : 'text-slate-800'}`}>Tampilkan Semua</span>
          </div>
          {options.map((opt, i) => {
            const v = opt[valKey];
            const isSel = selectedValues.includes(v);
            return (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-sky-50 cursor-pointer rounded-xl transition-all group/item"
                onClick={() => toggleVal(v)}
              >
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center border-2 transition-all ${!isAll && isSel ? 'bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-200' : 'border-slate-200 bg-white group-hover/item:border-sky-200'}`}>{(!isAll && isSel) && <CheckSquare size={14} />}</div>
                <span className={`text-sm transition-colors ${isSel && !isAll ? 'font-bold text-sky-700' : 'font-medium text-slate-600 group-hover/item:text-slate-900'}`}>{opt[lblKey]}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

// --- SCATTERPLOT COMPONENT (BOKEH STYLE) ---
const ScatterChart = React.memo(({ data, xKey, yKey, rKey, color, xLabel, yLabel, onDotClick, title }) => {
  const [hovered, setHovered] = useState(null);
  const svgRef = useRef(null);
  const width = 800, height = 400;
  const padding = { top: 40, right: 60, bottom: 60, left: 80 };

  if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-slate-400 font-bold">Tidak ada data untuk scatterplot</div>;

  const processedData = useMemo(() => {
    const maxPoints = 500;
    if (data.length <= maxPoints) return data;
    // Sample data to reduce points
    const step = Math.floor(data.length / maxPoints);
    return data.filter((_, i) => i % step === 0).slice(0, maxPoints);
  }, [data]);

  const scales = useMemo(() => {
    const xAbsMax = Math.max(...processedData.map(d => Math.abs(d[xKey] || 0))) || 1;
    const yMax = Math.max(...processedData.map(d => d[yKey] || 0)) || 1;
    const yAvg = processedData.reduce((s, d) => s + (d[yKey] || 0), 0) / processedData.length || 0;
    const rMax = Math.max(...processedData.map(d => d[rKey] || 0)) || 1;

    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    const scaleX = (val) => padding.left + ((val + xAbsMax) / (2 * xAbsMax)) * innerW;
    const scaleY = (val) => height - padding.bottom - (val / yMax) * innerH;
    const scaleR = (val) => 3 + (val / rMax) * 20;

    return { xAbsMax, yMax, yAvg, rMax, scaleX, scaleY, scaleR };
  }, [processedData, xKey, yKey, rKey]);

  const { xAbsMax, yMax, yAvg, scaleX, scaleY, scaleR } = scales;

  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const chartId = useId();

  return (
    <div id={chartId} className="relative w-full bg-white border border-slate-200 rounded-xl shadow-sm group">
      <div className="absolute top-4 left-4 font-bold text-slate-700">{title}</div>
      {data.length > 500 && <div className="absolute top-4 right-20 text-xs text-slate-400">Sampled {processedData.length} of {data.length} points</div>}
      <button onClick={() => saveAsPng(chartId, title)} className="absolute top-4 right-4 text-slate-400 hover:text-sky-600 bg-slate-50 hover:bg-sky-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1 z-10 print:hidden">
        <Download size={14} /> Simpan PNG
      </button>
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-sm bg-white" xmlns="http://www.w3.org/2000/svg" onMouseLeave={() => setHovered(null)}>
        <rect x={padding.left} y={padding.top} width={innerW / 2} height={scaleY(yAvg) - padding.top} fill="#fef2f2" opacity="0.4" />
        <rect x={padding.left + innerW / 2} y={padding.top} width={innerW / 2} height={scaleY(yAvg) - padding.top} fill="#ecfdf5" opacity="0.4" />
        <rect x={padding.left} y={scaleY(yAvg)} width={innerW / 2} height={height - padding.bottom - scaleY(yAvg)} fill="#fff7ed" opacity="0.4" />
        <rect x={padding.left + innerW / 2} y={scaleY(yAvg)} width={innerW / 2} height={height - padding.bottom - scaleY(yAvg)} fill="#eff6ff" opacity="0.4" />

        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#cbd5e1" strokeWidth="2" />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#cbd5e1" strokeWidth="2" />

        <line x1={scaleX(0)} y1={padding.top} x2={scaleX(0)} y2={height - padding.bottom} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />
        <text x={scaleX(0)} y={padding.top - 10} fontSize="10" fill="#64748b" textAnchor="middle" fontWeight="bold">Rp 0 (BEP)</text>

        <line x1={padding.left} y1={scaleY(yAvg)} x2={width - padding.right} y2={scaleY(yAvg)} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />
        <text x={width - padding.right + 5} y={scaleY(yAvg)} fontSize="10" fill="#64748b" alignmentBaseline="middle" fontWeight="bold">Avg Kasus</text>

        <text x={padding.left + innerW * 0.25} y={padding.top + 20} fontSize="12" fill="#ef4444" opacity="0.5" fontWeight="bold" textAnchor="middle">Defisit & Vol Tinggi</text>
        <text x={padding.left + innerW * 0.75} y={padding.top + 20} fontSize="12" fill="#10b981" opacity="0.5" fontWeight="bold" textAnchor="middle">Surplus & Vol Tinggi</text>
        <text x={padding.left + innerW * 0.25} y={height - padding.bottom - 20} fontSize="12" fill="#f59e0b" opacity="0.5" fontWeight="bold" textAnchor="middle">Defisit & Vol Rendah</text>
        <text x={padding.left + innerW * 0.75} y={height - padding.bottom - 20} fontSize="12" fill="#3b82f6" opacity="0.5" fontWeight="bold" textAnchor="middle">Surplus & Vol Rendah</text>

        <text x={width / 2} y={height - 15} fontSize="12" fontWeight="bold" fill="#475569" textAnchor="middle">{xLabel}</text>
        <text x={15} y={height / 2} fontSize="12" fontWeight="bold" fill="#475569" textAnchor="middle" transform={`rotate(-90 15 ${height / 2})`}>{yLabel}</text>

        {processedData.map((d, i) => {
          const valX = d[xKey] || 0;
          const valY = d[yKey] || 0;

          // Determine quadrant color
          let qColor = color;
          if (valX >= 0) {
            // Right Side (Surplus)
            qColor = valY >= yAvg ? "#10b981" : "#3b82f6"; // Top-Right (Green) : Bottom-Right (Blue)
          } else {
            // Left Side (Defisit)
            qColor = valY >= yAvg ? "#ef4444" : "#f59e0b"; // Top-Left (Red) : Bottom-Left (Amber)
          }

          return (
            <circle
              key={i} cx={scaleX(valX)} cy={scaleY(valY)} r={scaleR(d[rKey])}
              fill={qColor} fillOpacity="0.6" stroke={qColor} strokeWidth="1.5"
              onMouseEnter={() => setHovered(d)} onMouseLeave={() => setHovered(null)}
              onClick={() => onDotClick && onDotClick(d)}
              className="transition-all hover:fill-opacity-100 hover:stroke-width-3 cursor-pointer"
            />
          );
        })}
      </svg>

      {hovered && (
        <div className="absolute pointer-events-none bg-slate-900/95 backdrop-blur text-white p-3 rounded-xl shadow-xl text-xs z-50 transform -translate-x-1/2 -translate-y-full" style={{ left: `${(scaleX(hovered[xKey]) / width) * 100}%`, top: `${(scaleY(hovered[yKey]) / height) * 100}%`, marginTop: '-10px' }}>
          <p className="font-black border-b border-slate-700 pb-1 mb-1 text-sky-400">{hovered.label || hovered.code}</p>
          <p className="text-[10px] text-slate-300 w-48 truncate mb-2">{hovered.desc}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-slate-400 font-semibold">Kasus:</span><span className="font-bold text-right">{hovered[yKey].toLocaleString()}</span>
            <span className="text-slate-400 font-semibold">Total Tarif:</span><span className="font-bold text-right">{formatRp(hovered[rKey])}</span>
            <span className="text-slate-400 font-semibold">Selisih:</span><span className={`font-black text-right ${hovered[xKey] > 0 ? 'text-lime-400' : 'text-rose-400'}`}>{hovered[xKey] > 0 ? '+' : ''}{formatRp(hovered[xKey])}</span>
          </div>
        </div>
      )}
    </div>
  );
});

// --- SLIDER CAPTCHA COMPONENT ---
const SliderCaptcha = ({ onVerified, verified }) => {
  const [sliderVal, setSliderVal] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [failed, setFailed] = useState(false);
  const trackRef = React.useRef(null);
  const THUMB_W = 50;
  const TARGET_START = 72; // % of track where hole begins
  const TARGET_W = 15;     // % width of hole

  const getTrackWidth = () => trackRef.current ? trackRef.current.clientWidth - THUMB_W : 200;

  const handleMouseDown = (e) => {
    if (verified) return;
    setIsDragging(true);
    setFailed(false);
    e.preventDefault();
  };

  const handleTouchStart = (e) => {
    if (verified) return;
    setIsDragging(true);
    setFailed(false);
  };

  React.useEffect(() => {
    const handleMove = (clientX) => {
      if (!isDragging || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const maxW = getTrackWidth();
      const raw = Math.max(0, Math.min(clientX - rect.left - THUMB_W / 2, maxW));
      setSliderVal(Math.round((raw / maxW) * 100));
    };
    const handleUp = () => {
      if (!isDragging) return;
      setIsDragging(false);
      const pct = sliderVal;
      if (pct >= TARGET_START - 2 && pct <= TARGET_START + 2) { // Tighter tolerance for "puzzle" feel
        onVerified();
      } else {
        setFailed(true);
        setTimeout(() => { setSliderVal(0); setFailed(false); }, 800);
      }
    };
    const onMouseMove = (e) => handleMove(e.clientX);
    const onTouchMove = (e) => handleMove(e.touches[0].clientX);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, sliderVal]);

  return (
    <div className="mt-4">
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Verifikasi Keamanan</label>
      <div className={`rounded-2xl border-2 p-1 transition-all duration-500 overflow-hidden relative ${verified ? 'border-emerald-500/30 bg-emerald-50/50 shadow-inner shadow-emerald-500/10' : failed ? 'border-rose-500/30 bg-rose-50/50 shadow-inner shadow-rose-500/10' : 'border-slate-100 bg-slate-50/50 shadow-inner shadow-slate-900/5'}`}>
        <div ref={trackRef} className="relative h-16 rounded-xl select-none overflow-hidden bg-white/20">

          {/* Status Text Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className={`text-[10px] font-black uppercase tracking-[0.25em] transition-all duration-500 ${verified ? 'text-emerald-600' : failed ? 'text-rose-600' : 'text-slate-400 opacity-60'}`}>
              {verified ? 'Verifikasi Berhasil' : failed ? 'Gagal, Coba Lagi' : 'GESER KE KANAN'}
            </span>
          </div>

          {/* Background Shimmer (only when not verified) */}
          {!verified && !failed && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" style={{ width: '50%' }}></div>
          )}

          {/* Target Slot (The "Hole") */}
          <div
            className="absolute top-1 bottom-1 rounded-lg border-2 border-dashed border-teal-200/50 flex items-center justify-center bg-teal-900/5 shadow-inner"
            style={{ left: `${TARGET_START}%`, width: `${TARGET_W}%` }}
          >
            <div className="w-6 h-6 rounded-lg bg-teal-500/10 border border-teal-500/20 animate-pulse"></div>
          </div>

          {/* Slider Thumb (The "Puzzle Piece") */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className={`absolute top-1 bottom-1 flex items-center justify-center rounded-lg shadow-2xl cursor-grab active:cursor-grabbing transition-all duration-200 ${isDragging ? 'scale-110 z-20' : 'scale-100 z-10'} ${verified ? 'bg-emerald-600 text-white shadow-emerald-600/40 cursor-default' : failed ? 'bg-rose-600 text-white shadow-rose-600/40' : 'bg-white text-teal-600 hover:shadow-teal-600/20 border border-teal-50'}`}
            style={{
              width: `${THUMB_W}px`,
              left: `${sliderVal}%`,
              transition: isDragging ? 'none' : 'left 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <div className="flex gap-0.5 items-center justify-center">
              {verified ? <CheckCircle size={24} /> : failed ? <X size={24} /> : (
                <div className="flex flex-col gap-1 items-center">
                  <div className="w-4 h-0.5 bg-teal-600/30 rounded-full"></div>
                  <div className="w-5 h-0.5 bg-teal-600/60 rounded-full"></div>
                  <div className="w-4 h-0.5 bg-teal-600/30 rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('sak_activeTab') || 'dashboard');
  const [subTab, setSubTab] = useState(() => localStorage.getItem('sak_subTab') || 'executive');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [drilldown, setDrilldown] = useState({ isOpen: false, title: '', data: [], type: 'patient' });
  const [globalFilter, setGlobalFilter] = useState(() => {
    try {
      const saved = localStorage.getItem('sak_globalFilter');
      return saved ? JSON.parse(saved) : { periode: [], jenisRawat: [], kelasRawat: [], dpjp: [], ksm: [], departemen: [] };
    } catch (e) { return { periode: [], jenisRawat: [], kelasRawat: [], dpjp: [], ksm: [], departemen: [] }; }
  });
  const [isScrolled, setIsScrolled] = useState(false);
  const [reportSubTab, setReportSubTab] = useState('summary');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [auditFilter, setAuditFilter] = useState('');
  const [auditRuleFilter, setAuditRuleFilter] = useState('');
  const [auditReviewFilter, setAuditReviewFilter] = useState('');
  const [mapFilter, setMapFilter] = useState('');
  const [pemetaanTab, setPemetaanTab] = useState('inaToIdrg');
  const [mapModal, setMapModal] = useState({ isOpen: false, type: '', code: '', desc: '' });
  const [uploadSubTab, setUploadSubTab] = useState('manual');
  const [driveUrl, setDriveUrl] = useState('');
  const [expandedKsms, setExpandedKsms] = useState({});
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [openKsm, setOpenKsm] = useState(null);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [auditVerdicts, setAuditVerdicts] = useState(() => {
    try {
      const saved = localStorage.getItem('sak_auditVerdicts');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Persistence Sync
  useEffect(() => {
    console.log('[SAK-iDRG] Navigation state:', { activeTab, subTab });
    localStorage.setItem('sak_activeTab', activeTab);
    localStorage.setItem('sak_subTab', subTab);
    localStorage.setItem('sak_globalFilter', JSON.stringify(globalFilter));
    localStorage.setItem('sak_auditVerdicts', JSON.stringify(auditVerdicts));
  }, [activeTab, subTab, globalFilter, auditVerdicts]);

  useEffect(() => {
    console.log('[SAK-iDRG] Global Filter changed:', globalFilter);
  }, [globalFilter]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (uploadedFiles && uploadedFiles.length > 0) {
        e.preventDefault();
        e.returnValue = ''; // Standard way to trigger the browser's native confirmation dialog
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [uploadedFiles]);

  const [loginParticles] = useState(() => [...Array(20)].map(() => ({
    size: Math.random() * 6 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 3,
    duration: Math.random() * 3 + 2
  })));

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(() => localStorage.getItem('sak_session_id'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [validUsers, setValidUsers] = useState([{ username: 'Admin', password: 'Admin17' }]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // URL Google Apps Script untuk Manajemen Sesi (Ganti dengan URL hasil Deployment Anda)
  const SESSION_API_URL = "https://script.google.com/macros/s/AKfycbwqWGsGReCHmKwWdWcaBGX_0BK96dY-u8_8LtIDsbhckfXOEoKdRrSA7TEAOTziXbO8/exec";

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!captchaVerified) {
      setLoginError('Harap selesaikan verifikasi keamanan (geser puzzle) terlebih dahulu.');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      let userMatch = null;
      let activeStr = null;

      try {
        const sheetUrl = "https://docs.google.com/spreadsheets/d/1GG8xDtNii2N4V9yNlP_Na-fQtM4zN30ZkLD0aUnMY98/export?format=csv&gid=0";
        const res = await fetch(sheetUrl);
        if (!res.ok) throw new Error("Gagal mengambil data dari server autentikasi.");
        const csvText = await res.text();
        const rows = csvText.split(/\r?\n/).filter(r => r.trim()).map(row => row.split(',').map(cell => cell.trim()));
        const headers = rows[0] || [];

        const userIdx = headers.indexOf("USERNAME");
        const passIdx = headers.indexOf("PASSWORD");
        const activeIdx = headers.indexOf("MasaAktif");

        const match = rows.slice(1).find(r => r[userIdx] === username && r[passIdx] === password);
        if (match) {
          userMatch = match;
          activeStr = activeIdx !== -1 ? match[activeIdx] : null;
        }
      } catch (err) {
        console.warn("Spreadsheet fetch failed, falling back to local users.", err);
        const localMatch = validUsers.find(u => u.username === username && u.password === password);
        if (localMatch) userMatch = localMatch;
      }

      if (userMatch) {
        if (activeStr) {
          const parts = activeStr.split('/');
          if (parts.length === 3) {
            const activeDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T23:59:59`);
            const today = new Date();
            if (activeDate < today) {
              setLoginError(`Masa berlaku akses Anda telah habis pada ${activeStr}. Silahkan hubungi Admin AKURAT - iDRG.`);
              setPassword('');
              setCaptchaVerified(false);
              setIsLoggingIn(false);
              return;
            }
          }
        }
        setShowDisclaimer(true);
        setLoginError('');
      } else {
        setLoginError('Username atau Password tidak terdaftar. Silahkan hubungi Admin AKURAT - iDRG untuk mendapatkan akses.');
        setPassword('');
        setCaptchaVerified(false);
      }
    } catch (err) {
      console.error(err);
      setLoginError('Terjadi kesalahan saat memverifikasi data login.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const finalizeLogin = async () => {
    const sid = Math.random().toString(36).substring(2, 15);
    setCurrentSessionId(sid);
    localStorage.setItem('sak_session_id', sid);

    // Daftarkan Sesi ke Server (Google Apps Script)
    if (SESSION_API_URL && SESSION_API_URL !== "ISI_DENGAN_URL_DEPLOYMENT_APPS_SCRIPT_ANDA") {
      try {
        await fetch(SESSION_API_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ username: username, sessionId: sid })
        });
      } catch (e) { console.warn("Gagal mendaftarkan sesi:", e); }
    }

    setIsLoggedIn(true);
    setShowDisclaimer(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setLoginError('');
    setCaptchaVerified(false);
    localStorage.removeItem('sak_session_id');
  };

  // Heartbeat: Pengecekan Sesi Ganda (Setiap 60 detik)
  useEffect(() => {
    let interval;
    if (isLoggedIn && SESSION_API_URL && SESSION_API_URL !== "ISI_DENGAN_URL_DEPLOYMENT_APPS_SCRIPT_ANDA") {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${SESSION_API_URL}?username=${username}`);
          const data = await res.json();
          const localSid = localStorage.getItem('sak_session_id');

          if (data.activeSessionId && data.activeSessionId !== localSid) {
            alert("Akses Terputus: Akun ini telah login di perangkat atau browser lain. Silahkan gunakan satu perangkat saja.");
            handleLogout();
          }
        } catch (e) { console.warn("Gagal mengecek validitas sesi:", e); }
      }, 60000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isLoggedIn, username]);

  const fileInputRef = useRef(null); const folderInputRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    // Ambil data user dari Google Sheets
    fetch('https://docs.google.com/spreadsheets/d/1GG8xDtNii2N4V9yNlP_Na-fQtM4zN30ZkLD0aUnMY98/export?format=csv&gid=0')
      .then(res => res.text())
      .then(csvText => {
        const lines = csvText.split(/\r?\n/);
        const users = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',');
          if (cols.length >= 5) {
            users.push({ username: String(cols[3]).trim(), password: String(cols[4]).trim() });
          }
        }
        if (users.length > 0) setValidUsers(users);
      })
      .catch(err => console.error('Gagal mengambil data user', err));

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const checkMatchList = (arrIna, arrIdrg, exclusions) => {
    const cleanIna = Array.from(new Set(arrIna.map(c => String(c).trim().toUpperCase()).filter(c => c && c !== '-')));
    const cleanIdrg = Array.from(new Set(arrIdrg.map(c => String(c).trim().toUpperCase()).filter(c => c && c !== '-' && !exclusions.includes(c))));
    if (cleanIna.length === 0 && cleanIdrg.length === 0) return 100;
    if (cleanIna.length === 0 || cleanIdrg.length === 0) return 0;
    let mIna = 0, mIdrg = 0;
    cleanIna.forEach(i => { if (cleanIdrg.some(id => i.startsWith(id) || id.startsWith(i))) mIna++; });
    cleanIdrg.forEach(id => { if (cleanIna.some(i => i.startsWith(id) || id.startsWith(i))) mIdrg++; });
    if (mIna === cleanIna.length && mIdrg === cleanIdrg.length) return 100;
    return ((mIna / cleanIna.length) * 100 + (mIdrg / cleanIdrg.length) * 100) / 2;
  };

  const extract18 = (row) => {
    const getVal = (keys) => {
      for (let k of keys) {
        const m = Object.keys(row).find(rK => rK.toUpperCase().replace(/[^A-Z0-9]/g, '_') === k.toUpperCase().replace(/[^A-Z0-9]/g, '_') || rK.toUpperCase() === k.toUpperCase());
        if (m && row[m] !== undefined && row[m] !== '') {
          let str = String(row[m]).trim(); if (str === '-' || str === '0') return 0;
          if (str.includes(',') && str.includes('.')) str = str.lastIndexOf(',') > str.lastIndexOf('.') ? str.replace(/\./g, '').replace(',', '.') : str.replace(/,/g, '');
          else if (str.includes(',')) str = str.replace(',', '.');
          const p = parseFloat(str.replace(/[^0-9.-]+/g, "")); return isNaN(p) ? 0 : p;
        }
      } return 0;
    };
    return compKeys.reduce((acc, c) => ({ ...acc, [c.key]: getVal([c.key.toUpperCase(), `TARIF_${c.key.toUpperCase()}`, c.label.toUpperCase().replace(/ /g, '_')]) }), {});
  };

  const processFiles = async (files) => {
    setError('');
    const vFiles = Array.from(files).filter(f => f.name.endsWith('.txt') || f.type === 'text/plain');
    if (vFiles.length === 0) return setError('Masukkan file .txt');
    const newFiles = [];
    const total = vFiles.length;
    for (let fi = 0; fi < total; fi++) {
      const f = vFiles[fi];
      if (uploadedFiles.some(ex => ex.name === f.name && ex.rawSize === f.size)) {
        setUploadProgress({ current: fi + 1, total, fileName: f.name, pct: Math.round(((fi + 1) / total) * 100), status: 'duplicate' });
        continue;
      }
      try {
        setUploadProgress({ current: fi + 1, total, fileName: f.name, pct: Math.round(((fi + 0.2) / total) * 100), status: 'reading' });
        const text = await f.text();
        setUploadProgress({ current: fi + 1, total, fileName: f.name, pct: Math.round(((fi + 0.6) / total) * 100), status: 'parsing' });
        const lines = text.split('\n').filter(l => l.trim() !== '');
        if (lines.length > 0) {
          const headers = lines[0].split('\t').map(h => h.trim());
          const rows = lines.slice(1).map(l => { const vals = l.split('\t'); let obj = {}; headers.forEach((h, i) => { obj[h] = vals[i] ? vals[i].trim() : ''; }); return obj; });
          newFiles.push({ id: Math.random().toString(36).substring(2, 11), name: f.name, rawSize: f.size, size: (f.size / 1024).toFixed(2) + ' KB', headers, rows });
        }
        setUploadProgress({ current: fi + 1, total, fileName: f.name, pct: Math.round(((fi + 1) / total) * 100), status: 'done' });
      } catch (err) {
        setError(`Gagal membaca ${f.name}`);
        setUploadProgress({ current: fi + 1, total, fileName: f.name, pct: Math.round(((fi + 1) / total) * 100), status: 'error' });
      }
      await new Promise(res => setTimeout(res, 80));
    }
    if (newFiles.length === 0 && vFiles.length > 0) {
      setError('File kosong atau duplikat.');
      setUploadProgress(null);
    } else {
      setUploadProgress({ current: total, total, fileName: '', pct: 100, status: 'complete' });
      setUploadedFiles(prev => [...prev, ...newFiles]);
      setTimeout(() => {
        setUploadProgress(null);
        setIsAnalyzing(true);
        setActiveTab('dashboard');
      }, 900);
    }
  };


  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) processFiles(e.dataTransfer.files); };
  const removeFile = (id) => setUploadedFiles(prev => prev.filter(f => f.id !== id));
  const clearData = () => { setUploadedFiles([]); setError(''); };

  const filterOptions = useMemo(() => {
    const periods = new Set(), jenis = new Set(), kelas = new Set(), dpjps = new Map(), ksms = new Set(), depts = new Set();
    uploadedFiles.flatMap(f => f.rows).forEach(r => {
      const dObj = parseDate(r['DISCHARGE_DATE']);
      if (dObj) periods.add(`${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}`);
      if (r['PTD']) jenis.add(String(r['PTD']).trim());
      const kls = r['KELAS_RAWAT'] || r['KELAS'] || r['HAK_KELAS']; if (kls) kelas.add(String(kls).trim());
      const np = normDpjp(r['DPJP']); if (!dpjps.has(np)) dpjps.set(np, r['DPJP'] || 'Unknown');
      const ksm = extractKsm(r['DPJP'] || 'Unknown');
      ksms.add(ksm);
      depts.add(getDept(ksm, r['DPJP'] || 'Unknown'));
    });
    return {
      periods: Array.from(periods).sort((a, b) => b.localeCompare(a)),
      jenis: Array.from(jenis).sort(),
      kelas: Array.from(kelas).sort(),
      dpjps: Array.from(dpjps.entries()).map(([norm, disp]) => ({ norm, disp })).sort((a, b) => a.disp.localeCompare(b.disp)),
      ksms: Array.from(ksms).sort(),
      depts: Array.from(depts).sort()
    };
  }, [uploadedFiles]);

  const drilldownStats = useMemo(() => {
    if (!drilldown.isOpen || drilldown.data.length === 0) return null;
    let sumRS = 0, sumIna = 0, sumIdrg = 0, sumSel = 0, sumSelVsRs = 0, sumLos = 0, maxLos = 0;
    let compsSum = {};
    compKeys.forEach(c => compsSum[c.key] = 0);
    drilldown.data.forEach(row => {
      const rs = parseFloat(row.TARIF_RS || row.BIAYA_RS || row.TOTAL_TARIF_RS || 0) || 0;
      const ina = parseFloat(row.TOTAL_TARIF) || 0; const idrg = parseFloat(row.IDRG_TOTAL_TARIF) || 0;
      const los = parseFloat(row._los || 0);
      sumRS += rs; sumIna += ina; sumIdrg += idrg; sumSel += (idrg - ina); sumSelVsRs += (idrg - rs);
      sumLos += los; maxLos = Math.max(maxLos, los);
      const comps = extract18(row);
      compKeys.forEach(c => compsSum[c.key] += comps[c.key] || 0);
    });
    const count = drilldown.data.length;
    return {
      avgRS: sumRS / count, avgIna: sumIna / count, avgIdrg: sumIdrg / count, avgSel: sumSel / count, avgSelVsRs: sumSelVsRs / count,
      avgLos: sumLos / count, maxLos,
      avgComps: Object.fromEntries(compKeys.map(c => [
        c.key,
        {
          val: compsSum[c.key] / count,
          pct: (compsSum[c.key] / (sumRS || 1)) * 100
        }
      ]))
    };
  }, [drilldown.isOpen, drilldown.data]);

  const openDrilldown = (title, filterFn, type = 'patient', customData = null) => {
    const source = customData || dashData?.rawRows || [];
    const filtered = source.filter(filterFn);
    setDrilldown({ isOpen: true, title, data: filtered, type });
  };

  const dashData = useMemo(() => {
    const rawRows = uploadedFiles.flatMap(f => f.rows);
    if (rawRows.length === 0) return null;
    const rows = rawRows.filter(row => {
      if (globalFilter.periode.length > 0) { const dObj = parseDate(row['DISCHARGE_DATE']); if (!dObj || !globalFilter.periode.includes(`${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}`)) return false; }
      if (globalFilter.jenisRawat.length > 0 && !globalFilter.jenisRawat.includes(String(row['PTD'] || '').trim())) return false;
      const kls = String(row['KELAS_RAWAT'] || row['KELAS'] || row['HAK_KELAS'] || '').trim();
      if (globalFilter.kelasRawat.length > 0 && !globalFilter.kelasRawat.includes(kls)) return false;
      if (globalFilter.dpjp.length > 0 && !globalFilter.dpjp.includes(normDpjp(row['DPJP']))) return false;
      if (globalFilter.ksm.length > 0 && !globalFilter.ksm.includes(extractKsm(row['DPJP'] || 'Unknown'))) return false;
      if (globalFilter.departemen.length > 0) {
        const ksmName = extractKsm(row['DPJP'] || 'Unknown');
        const deptName = getDept(ksmName, row['DPJP'] || 'Unknown');
        if (!globalFilter.departemen.includes(deptName)) return false;
      }
      return true;
    });

    if (rows.length === 0) return { isLoaded: true, rawRows: rows, totalRows: 0, isEmptyAfterFilter: true };

    let stats = { tIna: 0, tIdrg: 0, cInaHigh: 0, cIdrgHigh: 0, cEq: 0, selisihList: [], totalScoreDiag: 0, totalScoreProc: 0, ranapCount: 0, anomaliKasus: 0, naikKelasKasus: 0, naikKelasNilai: 0, topUpKasus: 0, topUpNilai: 0 };
    let maps = { monthly: {}, drg: {}, report: {}, severity: {}, clReport: {}, dpjp: {}, ksm: {}, dept: {}, diagU: {}, diagS: {}, proc: {}, ina: {}, idrg: {}, slClShift: {}, coder: {}, naikKelas: {}, discharge: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }, sev: { "1": 0, "2": 0, "3": 0 }, cl: { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "9": 0 }, icu: { total: 0, sev1: 0, sev2: 0, sev3: 0, anomalies: [] }, inaToIdrg: {}, idrgToIna: {}, discrepancies: [], audit: [], topUp: {}, ksmEfficiency: {} };
    const billCols = ["SI", "SD", "SR", "SP", "KODE_SI", "KODE_SD", "KODE_SR", "KODE_SP", "SPECIAL_SI", "SPECIAL_SD", "SPECIAL_SR", "SPECIAL_SP", "SPECIAL_CMG"];

    rows.forEach((r, idx) => {
      const tIna = parseFloat(r['TOTAL_TARIF']) || 0; const tIdrg = parseFloat(r['IDRG_TOTAL_TARIF']) || 0;
      const tRS = parseFloat(r['TARIF_RS']) || parseFloat(r['BIAYA_RS']) || parseFloat(r['TOTAL_TARIF_RS']) || parseFloat(r['TARIF_RS_COST']) || 0;
      const sel = tIdrg - tIna; const inaCode = String(r['INACBG'] || '').trim(); const drgCode = String(r['IDRG_DRG_CODE'] || '').trim();
      const ptd = String(r['PTD'] || '').trim();

      stats.tIna += tIna; stats.tIdrg += tIdrg; stats.selisihList.push(sel);

      const rndIna = Math.round(tIna); const rndIdrg = Math.round(tIdrg);
      if (rndIna > rndIdrg) stats.cInaHigh++; else if (rndIdrg > rndIna) stats.cIdrgHigh++; else stats.cEq++;

      const dObj = parseDate(r['DISCHARGE_DATE'] || r['TGL_PULANG']);
      const aObj = parseDate(r['ADMISSION_DATE'] || r['TGL_MASUK'] || r['TANGGAL_MASUK']);
      let los = parseFloat(r['LOS'] || r['HARI_RAWAT']);
      if (isNaN(los) && aObj && dObj) {
        los = Math.ceil((dObj - aObj) / (1000 * 60 * 60 * 24));
        if (los < 0) los = 0;
      }
      if (isNaN(los)) los = 0;
      r._los = los;
      r._tglMasuk = aObj ? `${aObj.getFullYear()}-${String(aObj.getMonth() + 1).padStart(2, '0')}-${String(aObj.getDate()).padStart(2, '0')}` : (r['ADMISSION_DATE'] || r['TGL_MASUK'] || r['TANGGAL_MASUK'] || '-');

      const isRanap = ptd === '1';
      if (dObj) {
        const mKey = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}`;
        if (!maps.monthly[mKey]) maps.monthly[mKey] = { label: `${monthNames[dObj.getMonth()]} '${String(dObj.getFullYear()).slice(-2)}`, inacbg: 0, idrg: 0, selisih: 0, tarifRs: 0, sortVal: dObj.getTime() };
        maps.monthly[mKey].inacbg += tIna; maps.monthly[mKey].idrg += tIdrg; maps.monthly[mKey].selisih += sel; maps.monthly[mKey].tarifRs += tRS;

        if (!maps.report[mKey]) maps.report[mKey] = { label: `${monthNames[dObj.getMonth()]} - ${dObj.getFullYear()}`, sortVal: dObj.getTime(), tarifRsTotal: 0, kasusRajal: 0, kasusRanap: 0, inaRajal: 0, inaRanap: 0, idrgRajal: 0, idrgRanap: 0 };
        maps.report[mKey].tarifRsTotal += tRS;
        if (isRanap) { maps.report[mKey].kasusRanap++; maps.report[mKey].inaRanap += tIna; maps.report[mKey].idrgRanap += tIdrg; } else { maps.report[mKey].kasusRajal++; maps.report[mKey].inaRajal += tIna; maps.report[mKey].idrgRajal += tIdrg; }

        if (!maps.severity[mKey]) maps.severity[mKey] = { label: `${monthNames[dObj.getMonth()]} - ${dObj.getFullYear()}`, sortVal: dObj.getTime(), sl0_kasus: 0, sl1_kasus: 0, sl2_kasus: 0, sl3_kasus: 0, sl0_rp: 0, sl1_rp: 0, sl2_rp: 0, sl3_rp: 0 };
        let sl = -1; if (!isRanap) sl = 0; else { if (inaCode.endsWith('-I')) sl = 1; else if (inaCode.endsWith('-II')) sl = 2; else if (inaCode.endsWith('-III')) sl = 3; else sl = 1; }
        if (sl === 0) { maps.severity[mKey].sl0_kasus++; maps.severity[mKey].sl0_rp += tIna; } else if (sl === 1) { maps.severity[mKey].sl1_kasus++; maps.severity[mKey].sl1_rp += tIna; } else if (sl === 2) { maps.severity[mKey].sl2_kasus++; maps.severity[mKey].sl2_rp += tIna; } else if (sl === 3) { maps.severity[mKey].sl3_kasus++; maps.severity[mKey].sl3_rp += tIna; }

        if (!maps.clReport[mKey]) maps.clReport[mKey] = { label: `${monthNames[dObj.getMonth()]} - ${dObj.getFullYear()}`, sortVal: dObj.getTime(), rj_kasus: 0, cl9_kasus: 0, cl0_kasus: 0, cl1_kasus: 0, cl2_kasus: 0, cl3_kasus: 0, cl4_kasus: 0, rj_rp: 0, cl9_rp: 0, cl0_rp: 0, cl1_rp: 0, cl2_rp: 0, cl3_rp: 0, cl4_rp: 0 };
        let clCat = 'rj';
        if (!isRanap) { clCat = 'rj'; } else {
          const clVal = parseInt(drgCode.slice(-1));
          if (!isNaN(clVal)) clCat = `cl${clVal}`;
        }
        if (maps.clReport[mKey][`${clCat}_kasus`] !== undefined) {
          maps.clReport[mKey][`${clCat}_kasus`]++;
          maps.clReport[mKey][`${clCat}_rp`] += tIdrg;
        }
      }

      if (drgCode && drgCode !== '-') {
        if (!maps.drg[drgCode]) maps.drg[drgCode] = {
          desc: String(r['IDRG_DRG_DESCRIPTION'] || '-'),
          ranap: { count: 0, sumRS: 0, sumIna: 0, sumIdrg: 0, sumLos: 0, maxLos: 0, sumCW: 0, sumNBR: 0, sumAF: 0 },
          rajal: { count: 0, sumRS: 0, sumIna: 0, sumIdrg: 0, sumLos: 0, maxLos: 0, sumCW: 0, sumNBR: 0, sumAF: 0 }
        };
        const target = isRanap ? maps.drg[drgCode].ranap : maps.drg[drgCode].rajal;
        target.count++; target.sumRS += tRS; target.sumIna += tIna; target.sumIdrg += tIdrg;
        target.sumLos += los; target.maxLos = Math.max(target.maxLos, los);
        target.sumCW += parseFloat(r['IDRG_COST_WEIGHT'] || r['COST_WEIGHT'] || 0);
        target.sumNBR += parseFloat(r['IDRG_NBR'] || r['NBR'] || 0);
        target.sumAF += parseFloat(r['IDRG_ADJUSTMENT_FACTOR'] || r['ADJUSTMENT_FACTOR'] || 1);
      }
      if (inaCode && inaCode !== '-') {
        if (!maps.ina[inaCode]) maps.ina[inaCode] = { code: inaCode, desc: String(r['DESKRIPSI_INACBG'] || '-'), count: 0, sumRS: 0, sumIna: 0, sumLos: 0, maxLos: 0 };
        maps.ina[inaCode].count++; maps.ina[inaCode].sumRS += tRS; maps.ina[inaCode].sumIna += tIna;
        maps.ina[inaCode].sumLos += los; if (los > maps.ina[inaCode].maxLos) maps.ina[inaCode].maxLos = los;
      }

      const dList = String(r['DIAGLIST'] || '').split(';').map(d => d.trim()).filter(d => d);
      const pList = String(r['PROCLIST'] || '').split(';').map(p => p.trim()).filter(p => p && p !== '-' && p.toLowerCase() !== 'none');

      // Top-Up Detection
      let billing_detected = false;
      for (let c of billCols) {
        let v = String(r[c] || r[c.toLowerCase()] || '').trim().toUpperCase();
        if (v && !["-", "0", "0.0", "NONE", "NAN", ""].includes(v)) { billing_detected = true; break; }
      }

      if (!billing_detected) {
        const ina_norm = normalize_c(inaCode);
        const diag_norm = normalize_c(r['DIAGNOSA'] || '');
        const all_codes = (String(r['DIAGLIST'] || '') + " " + String(r['PROCLIST'] || '')).split(/[;, ]/).map(c => normalize_c(c)).filter(c => c);
        PROCESSED_TOP_UP_RULES.forEach(rule => {
          if (rule.layanan && String(rule.layanan) !== ptd) return;
          const has_criteria = rule.n_cbgs.length > 0 || rule.n_diags.length > 0 || rule.n_procs.length > 0;
          if (!has_criteria) return;

          const cbg_ok = rule.n_cbgs.length === 0 || rule.n_cbgs.some(c => ina_norm === c);
          const diag_ok = rule.n_diags.length === 0 || (
            rule.primaryOnly
              ? rule.n_diags.some(c => diag_norm === c)
              : rule.n_diags.some(c => all_codes.includes(c))
          );
          const proc_ok = rule.n_procs.length === 0 || rule.n_procs.some(c => all_codes.includes(c));

          if (cbg_ok && diag_ok && proc_ok) {
            if (!maps.topUp[rule.item]) maps.topUp[rule.item] = { ...rule, count: 0, totalPotensi: 0 };
            maps.topUp[rule.item].count++; maps.topUp[rule.item].totalPotensi += rule.tarif;
            stats.topUpKasus++; stats.topUpNilai += rule.tarif;
          }
        });
      }

      const dpjpRaw = r['DPJP'] || 'Unknown';
      const np = normDpjp(dpjpRaw);
      const ksmName = extractKsm(dpjpRaw);
      const deptName = getDept(ksmName, dpjpRaw);

      if (!maps.dpjp[np]) maps.dpjp[np] = { name: String(dpjpRaw), normName: np, count: 0, sumRS: 0, sumIna: 0, sumIdrg: 0, sumLos: 0, maxLos: 0, comps: compKeys.reduce((a, c) => ({ ...a, [c.key]: 0 }), {}) };
      maps.dpjp[np].count++; maps.dpjp[np].sumRS += tRS; maps.dpjp[np].sumIna += tIna; maps.dpjp[np].sumIdrg += tIdrg; maps.dpjp[np].sumLos += los; if (los > maps.dpjp[np].maxLos) maps.dpjp[np].maxLos = los;

      if (!maps.ksm[ksmName]) maps.ksm[ksmName] = { name: ksmName, dept: deptName, count: 0, sumRS: 0, sumIna: 0, sumIdrg: 0, sumLos: 0, maxLos: 0, dpjps: {}, comps: compKeys.reduce((a, c) => ({ ...a, [c.key]: 0 }), {}) };
      maps.ksm[ksmName].count++; maps.ksm[ksmName].sumRS += tRS; maps.ksm[ksmName].sumIna += tIna; maps.ksm[ksmName].sumIdrg += tIdrg; maps.ksm[ksmName].sumLos += los; if (los > maps.ksm[ksmName].maxLos) maps.ksm[ksmName].maxLos = los;

      if (!maps.dept[deptName]) maps.dept[deptName] = { name: deptName, count: 0, sumRS: 0, sumIna: 0, sumIdrg: 0, sumLos: 0, maxLos: 0, ksms: {}, comps: compKeys.reduce((a, c) => ({ ...a, [c.key]: 0 }), {}) };
      maps.dept[deptName].count++; maps.dept[deptName].sumRS += tRS; maps.dept[deptName].sumIna += tIna; maps.dept[deptName].sumIdrg += tIdrg; maps.dept[deptName].sumLos += los; if (los > maps.dept[deptName].maxLos) maps.dept[deptName].maxLos = los;
      maps.dept[deptName].ksms[ksmName] = true;

      if (!maps.ksm[ksmName].dpjps[np]) maps.ksm[ksmName].dpjps[np] = { name: String(dpjpRaw), normName: np, count: 0, sumRS: 0, sumIna: 0, sumIdrg: 0, sumLos: 0, maxLos: 0, comps: compKeys.reduce((a, c) => ({ ...a, [c.key]: 0 }), {}) };
      maps.ksm[ksmName].dpjps[np].count++; maps.ksm[ksmName].dpjps[np].sumRS += tRS; maps.ksm[ksmName].dpjps[np].sumIna += tIna; maps.ksm[ksmName].dpjps[np].sumIdrg += tIdrg; maps.ksm[ksmName].dpjps[np].sumLos += los; if (los > maps.ksm[ksmName].dpjps[np].maxLos) maps.ksm[ksmName].dpjps[np].maxLos = los;

      const c18 = extract18(r);
      for (let k in c18) {
        maps.dpjp[np].comps[k] += c18[k];
        maps.ksm[ksmName].comps[k] += c18[k];
        maps.dept[deptName].comps[k] += c18[k];
        maps.ksm[ksmName].dpjps[np].comps[k] += c18[k];
      }

      let ds = String(r['DISCHARGE_STATUS'] || r['STATUS_PULANG'] || r['CARA_PULANG'] || '').trim();
      maps.discharge[['1', '2', '3', '4'].includes(ds) ? ds : "5"]++;

      if (dList.length > 0) {
        if (!dList[0].toUpperCase().startsWith('Z')) maps.diagU[dList[0]] = (maps.diagU[dList[0]] || 0) + 1;
        for (let i = 1; i < dList.length; i++) maps.diagS[dList[i]] = (maps.diagS[dList[i]] || 0) + 1;
      }
      pList.forEach(p => maps.proc[p] = (maps.proc[p] || 0) + 1);

      let sev = 0; if (inaCode.endsWith('-I')) sev = 1; else if (inaCode.endsWith('-II')) sev = 2; else if (inaCode.endsWith('-III')) sev = 3;
      if (isRanap) {
        stats.ranapCount++; if (sev > 0) maps.sev[sev.toString()]++;
        const cl = parseInt(drgCode.slice(-1));
        if (!isNaN(cl)) {
          if (maps.cl[cl.toString()] !== undefined) maps.cl[cl.toString()]++;
          if (sev > 0) {
            const sK = `SL${sev}_CL${cl}`;
            if (!maps.slClShift[sK]) maps.slClShift[sK] = { sev, cl, count: 0, sumIna: 0, sumIdrg: 0, selisih: 0, priDiags: {}, secDiags: {}, procs: {} };
            maps.slClShift[sK].count++; maps.slClShift[sK].sumIna += tIna; maps.slClShift[sK].sumIdrg += tIdrg; maps.slClShift[sK].selisih += sel;
            if (dList[0]) maps.slClShift[sK].priDiags[dList[0]] = (maps.slClShift[sK].priDiags[dList[0]] || 0) + 1;
            for (let i = 1; i < dList.length; i++) maps.slClShift[sK].secDiags[dList[i]] = (maps.slClShift[sK].secDiags[dList[i]] || 0) + 1;
            pList.forEach(p => { if (p && !p.startsWith('90')) maps.slClShift[sK].procs[p] = (maps.slClShift[sK].procs[p] || 0) + 1; });
          }
        }
      }

      const matchC2 = String(r['C2'] || '').match(/"selisih_biaya":\s*\{\s*"nilai":\s*"(\d+)"\s*,\s*"pembayar":\s*"([^"]+)"\s*,\s*"naik_kelas":\s*"([^"]+)"/);
      if (matchC2 && parseFloat(matchC2[1]) > 0) {
        let kAw = String(r['KELAS_RAWAT'] || r['KELAS'] || r['HAK_KELAS'] || 'Unknown').trim();
        let kAk = String(matchC2[3]).toUpperCase(); let k = `Kelas ${kAw} -> ${kAk}`;
        if (!maps.naikKelas[k]) maps.naikKelas[k] = { awal: `Kelas ${kAw}`, awalRaw: kAw, akhir: kAk, pembayar: String(matchC2[2]).toUpperCase(), count: 0, totalNilai: 0, sev1: 0, sev2: 0, sev3: 0 };
        maps.naikKelas[k].count++; maps.naikKelas[k].totalNilai += parseFloat(matchC2[1]);
        if (sev === 1) maps.naikKelas[k].sev1++; else if (sev === 2) maps.naikKelas[k].sev2++; else if (sev === 3) maps.naikKelas[k].sev3++;
        stats.naikKelasKasus++; stats.naikKelasNilai += parseFloat(matchC2[1]);
      }

      const icuInd = String(r['ICU_INDIKATOR'] || '').trim(); const icuLos = parseFloat(r['ICU_LOS'] || 0); const ventHour = parseFloat(r['VENT_HOUR'] || 0);
      if (icuInd === '1' || icuLos > 0 || ventHour > 0) {
        maps.icu.total++; if (sev > 0) maps.icu[`sev${sev}`]++;
        if (pList.includes('96.71') && ventHour >= 96) maps.icu.anomalies.push({ mrn: String(r['MRN'] || '-'), sep: String(r['SEP'] || '-'), ventHour, issue: 'Kode 96.71 (<96 Jam) tapi aktual >= 96 jam', severity: sev });
        if (pList.includes('96.72') && ventHour < 96) maps.icu.anomalies.push({ mrn: String(r['MRN'] || '-'), sep: String(r['SEP'] || '-'), ventHour, issue: 'Kode 96.72 (>96 Jam) tapi aktual < 96 jam', severity: sev });
      }

      if (inaCode && inaCode !== '-' && drgCode && drgCode !== '-') {
        if (!maps.inaToIdrg[inaCode]) maps.inaToIdrg[inaCode] = { desc: String(r['DESKRIPSI_INACBG'] || '-'), totalCases: 0, sumLos: 0, maxLos: 0, sumIna: 0, sumIdrg: 0, targets: {} };
        const curLos = parseFloat(r['LOS'] || 0);
        maps.inaToIdrg[inaCode].totalCases++;
        maps.inaToIdrg[inaCode].sumLos += curLos;
        maps.inaToIdrg[inaCode].maxLos = Math.max(maps.inaToIdrg[inaCode].maxLos, curLos);
        maps.inaToIdrg[inaCode].sumIna += tIna;
        maps.inaToIdrg[inaCode].sumIdrg += tIdrg;

        const tK = drgCode + " (" + String(r['IDRG_DRG_DESCRIPTION'] || '-') + ")";
        if (!maps.inaToIdrg[inaCode].targets[tK]) maps.inaToIdrg[inaCode].targets[tK] = { count: 0, priDiags: {}, secDiags: {}, procs: {}, sumLos: 0, maxLos: 0, sumIna: 0, sumIdrg: 0 };
        maps.inaToIdrg[inaCode].targets[tK].count++;
        maps.inaToIdrg[inaCode].targets[tK].sumLos += curLos;
        maps.inaToIdrg[inaCode].targets[tK].maxLos = Math.max(maps.inaToIdrg[inaCode].targets[tK].maxLos, curLos);
        maps.inaToIdrg[inaCode].targets[tK].sumIna += tIna;
        maps.inaToIdrg[inaCode].targets[tK].sumIdrg += tIdrg;

        if (dList[0]) maps.inaToIdrg[inaCode].targets[tK].priDiags[dList[0]] = (maps.inaToIdrg[inaCode].targets[tK].priDiags[dList[0]] || 0) + 1;
        for (let i = 1; i < dList.length; i++) maps.inaToIdrg[inaCode].targets[tK].secDiags[dList[i]] = (maps.inaToIdrg[inaCode].targets[tK].secDiags[dList[i]] || 0) + 1;
        for (let p of pList) if (p) maps.inaToIdrg[inaCode].targets[tK].procs[p] = (maps.inaToIdrg[inaCode].targets[tK].procs[p] || 0) + 1;
        // Reverse map: iDRG → INA
        if (!maps.idrgToIna[drgCode]) maps.idrgToIna[drgCode] = { desc: String(r['IDRG_DRG_DESCRIPTION'] || '-'), totalCases: 0, sumLos: 0, maxLos: 0, sumIna: 0, sumIdrg: 0, sources: {} };
        maps.idrgToIna[drgCode].totalCases++;
        maps.idrgToIna[drgCode].sumLos += curLos;
        maps.idrgToIna[drgCode].maxLos = Math.max(maps.idrgToIna[drgCode].maxLos, curLos);
        maps.idrgToIna[drgCode].sumIna += tIna;
        maps.idrgToIna[drgCode].sumIdrg += tIdrg;
        if (!maps.idrgToIna[drgCode].sources[inaCode]) maps.idrgToIna[drgCode].sources[inaCode] = { count: 0, desc: String(r['DESKRIPSI_INACBG'] || '-'), sumLos: 0, maxLos: 0, sumIna: 0, sumIdrg: 0 };
        maps.idrgToIna[drgCode].sources[inaCode].count++;
        maps.idrgToIna[drgCode].sources[inaCode].sumLos += curLos;
        maps.idrgToIna[drgCode].sources[inaCode].maxLos = Math.max(maps.idrgToIna[drgCode].sources[inaCode].maxLos, curLos);
        maps.idrgToIna[drgCode].sources[inaCode].sumIna += tIna;
        maps.idrgToIna[drgCode].sources[inaCode].sumIdrg += tIdrg;
      }

      const idrgDList = String(r['IDRG_DIAG_LISTS'] || '').split(';').map(d => d.trim()).filter(d => d);
      const idrgPList = String(r['IDRG_PROC_LISTS'] || '').split(';').map(p => p.trim()).filter(p => p && p !== '-' && p.toLowerCase() !== 'none');
      const sDiag = checkMatchList(dList, idrgDList, ['KG', 'HL', 'NL', 'KND', 'G89', 'U82', 'U83', 'U84']);
      const sProc = checkMatchList(pList, idrgPList, ['99.290']);
      stats.totalScoreDiag += sDiag; stats.totalScoreProc += sProc;

      const rawCoderId = String(r['CODER_ID'] || r['USER_CODER'] || r['CODER'] || 'UNKNOWN').trim();
      const cId = rawCoderId.includes(';') ? rawCoderId.split(';')[0].trim().toUpperCase() : rawCoderId.toUpperCase();
      if (!maps.coder[cId]) maps.coder[cId] = { id: cId, cases: 0, discrepancyCount: 0, auditHits: 0 };
      maps.coder[cId].cases++;

      if (sDiag < 100 || sProc < 100) {
        maps.discrepancies.push({ rowIdx: idx, mrn: String(r['MRN'] || ''), sep: String(r['SEP'] || ''), diag1: dList, diag2: idrgDList, scoreDiag: sDiag, proc1: pList, proc2: idrgPList, scoreProc: sProc });
        maps.coder[cId].discrepancyCount++;
      }

      const acRow = [...dList, ...pList]; let hit = false;
      DEFAULT_AUDIT_RULES.forEach(ru => {
        const op = ru.condition?.operator || "OR"; let matched = false;
        if (ru.condition?.type === 'grouped') matched = op === 'AND' ? ru.condition.groups.every(g => g.codes.some(c => acRow.some(ac => ac.startsWith(c)))) : ru.condition.groups.some(g => g.codes.some(c => acRow.some(ac => ac.startsWith(c))));
        else if (ru.condition?.codes) matched = ru.condition.codes.some(c => acRow.some(ac => ac.startsWith(c)));

        if (matched) {
          maps.audit.push({
            ruleId: String(ru.id || 'N/A'),
            case: String(ru.case || 'Spesifik'),
            warning: String(ru.validation_action?.warning_message || ""),
            mrn: String(r['MRN'] || '-'),
            sep: String(r['SEP'] || '-'),
            diaglist: dList.join(', '),
            proclist: pList.join(', '),
            coderId: cId,
            totalTarif: parseFloat(r['TOTAL_TARIF'] || 0)
          });
          hit = true;
        }
      });
      if (hit) maps.coder[cId].auditHits++;
    });

    stats.selisihList.sort((a, b) => a - b);
    const mArray = Object.values(maps.monthly).sort((a, b) => a.sortVal - b.sortVal);
    const maxP = Math.max(...mArray.map(m => Math.max(m.inacbg, m.idrg, m.selisih, m.tarifRs)), 1);
    const minN = Math.min(...mArray.map(m => Math.min(0, m.selisih)), 0);
    const range = maxP + Math.abs(minN);

    const drgArrRanap = Object.keys(maps.drg).map(c => {
      const t = maps.drg[c].ranap; if (t.count === 0) return null;
      return { code: c, desc: maps.drg[c].desc, ...t, avgLos: t.sumLos / t.count, avgIdrg: t.sumIdrg / t.count, avgRS: t.sumRS / t.count, avgCW: t.sumCW / t.count, avgNBR: t.sumNBR / t.count, avgAF: t.sumAF / t.count, selisih: t.sumIdrg - t.sumIna };
    }).filter(Boolean);
    const drgArrRajal = Object.keys(maps.drg).map(c => {
      const t = maps.drg[c].rajal; if (t.count === 0) return null;
      return { code: c, desc: maps.drg[c].desc, ...t, avgLos: t.sumLos / t.count, avgIdrg: t.sumIdrg / t.count, avgRS: t.sumRS / t.count, avgCW: t.sumCW / t.count, avgNBR: t.sumNBR / t.count, avgAF: t.sumAF / t.count, selisih: t.sumIdrg - t.sumIna };
    }).filter(Boolean);
    const drgArr = Object.keys(maps.drg).map(c => {
      const r = maps.drg[c].ranap; const j = maps.drg[c].rajal;
      const count = r.count + j.count;
      return { code: String(c), desc: String(maps.drg[c].desc), count, sumRS: r.sumRS + j.sumRS, sumIdrg: r.sumIdrg + j.sumIdrg, totalSelisih: (r.sumIdrg + j.sumIdrg) - (r.sumIna + j.sumIna), selisihVsRs: (r.sumIdrg + j.sumIdrg) - (r.sumRS + j.sumRS), avgLos: (r.sumLos + j.sumLos) / count, maxLos: Math.max(r.maxLos, j.maxLos) };
    }).filter(x => x.code !== '-');
    const inaArr = Object.keys(maps.ina).map(c => ({ code: String(c), desc: String(maps.ina[c].desc), count: maps.ina[c].count, sumRS: maps.ina[c].sumRS, sumIna: maps.ina[c].sumIna, totalSelisih: maps.ina[c].sumIna - maps.ina[c].sumRS, selisihVsRs: maps.ina[c].sumIna - maps.ina[c].sumRS, avgLos: maps.ina[c].sumLos / maps.ina[c].count, maxLos: maps.ina[c].maxLos })).filter(x => x.code !== '-');

    const ksmSummaryArray = Object.values(maps.ksm).map(s => ({ ...s, selisihIna: s.sumIna - s.sumRS, selisihIdrg: s.sumIdrg - s.sumRS })).sort((a, b) => b.count - a.count);
    const deptSummaryArray = Object.values(maps.dept).map(d => ({ ...d, selisihIna: d.sumIna - d.sumRS, selisihIdrg: d.sumIdrg - d.sumRS })).sort((a, b) => b.count - a.count);

    const topKsmSurplusIna = [...ksmSummaryArray].filter(s => s.selisihIna > 0).sort((a, b) => b.selisihIna - a.selisihIna).slice(0, 10);
    const topKsmDefisitIna = [...ksmSummaryArray].filter(s => s.selisihIna < 0).sort((a, b) => a.selisihIna - b.selisihIna).slice(0, 10);
    const topKsmSurplusIdrg = [...ksmSummaryArray].filter(s => s.selisihIdrg > 0).sort((a, b) => b.selisihIdrg - a.selisihIdrg).slice(0, 10);
    const topKsmDefisitIdrg = [...ksmSummaryArray].filter(s => s.selisihIdrg < 0).sort((a, b) => a.selisihIdrg - b.selisihIdrg).slice(0, 10);

    const ksmEfficiencyTree = ksmSummaryArray.map(s => {
      const dpjps = Object.values(s.dpjps).map(d => ({
        ...d,
        avgRS: d.sumRS / d.count, avgIna: d.sumIna / d.count, avgIdrg: d.sumIdrg / d.count,
        avgComps: Object.fromEntries(compKeys.map(k => [k.key, { val: d.comps[k.key] / d.count, pct: (d.comps[k.key] / (d.sumRS || 1)) * 100 }]))
      })).sort((a, b) => b.count - a.count);
      return {
        ...s, dpjps,
        avgRS: s.sumRS / s.count, avgIna: s.sumIna / s.count, avgIdrg: s.sumIdrg / s.count,
        avgComps: Object.fromEntries(compKeys.map(k => [k.key, { val: s.comps[k.key] / s.count, pct: (s.comps[k.key] / (s.sumRS || 1)) * 100 }]))
      };
    }).sort((a, b) => b.count - a.count);

    return {
      isLoaded: true,
      rawRows: rows, totalRows: rows.length, ...stats,
      selisihTotal: stats.tIdrg - stats.tIna, rataInacbg: rows.length > 0 ? stats.tIna / rows.length : 0, rataIdrg: rows.length > 0 ? stats.tIdrg / rows.length : 0,
      monthlyArray: mArray, maxPosVal: maxP, absMaxSelisih: Math.max(Math.abs(Math.max(...mArray.map(d => d.selisih), 0)), Math.abs(Math.min(...mArray.map(d => d.selisih), 0)), 1),
      posPct: range > 0 ? (maxP / range) * 100 : 0, negPct: range > 0 ? (Math.abs(minN) / range) * 100 : 0,
      reportArray: Object.values(maps.report).sort((a, b) => a.sortVal - b.sortVal),
      severityReportArray: Object.values(maps.severity).sort((a, b) => a.sortVal - b.sortVal).map(item => ({ ...item, total_kasus: item.sl0_kasus + item.sl1_kasus + item.sl2_kasus + item.sl3_kasus, total_rp: item.sl0_rp + item.sl1_rp + item.sl2_rp + item.sl3_rp })),
      clReportArray: Object.values(maps.clReport).sort((a, b) => a.sortVal - b.sortVal).map(item => ({ ...item, total_kasus: item.rj_kasus + item.cl9_kasus + item.cl0_kasus + item.cl1_kasus + item.cl2_kasus + item.cl3_kasus + item.cl4_kasus, total_rp: item.rj_rp + item.cl9_rp + item.cl0_rp + item.cl1_rp + item.cl2_rp + item.cl3_rp + item.cl4_rp })),
      drgSummary: drgArr.sort((a, b) => b.count - a.count), drgSummaryRanap: drgArrRanap.sort((a, b) => b.count - a.count), drgSummaryRajal: drgArrRajal.sort((a, b) => b.count - a.count),
      inaSummary: inaArr.sort((a, b) => b.count - a.count),
      topDefisit: drgArr.filter(x => x.selisihVsRs < 0).sort((a, b) => a.selisihVsRs - b.selisihVsRs).slice(0, 10), topSurplus: drgArr.filter(x => x.selisihVsRs > 0).sort((a, b) => b.selisihVsRs - a.selisihVsRs).slice(0, 10),
      topDefisitIna: inaArr.filter(x => x.totalSelisih < 0).sort((a, b) => a.totalSelisih - b.totalSelisih).slice(0, 10), topSurplusIna: inaArr.filter(x => x.totalSelisih > 0).sort((a, b) => b.totalSelisih - a.totalSelisih).slice(0, 10),
      dpjpSummaryArray: Object.values(maps.dpjp).sort((a, b) => b.count - a.count),
      ksmSummaryArray, deptSummaryArray, topKsmSurplusIna, topKsmDefisitIna, topKsmSurplusIdrg, topKsmDefisitIdrg, ksmEfficiencyTree,
      topDiagUtama: Object.entries(maps.diagU).sort((a, b) => b[1] - a[1]).slice(0, 10), topDiagSekunder: Object.entries(maps.diagS).sort((a, b) => b[1] - a[1]).slice(0, 10), topProc: Object.entries(maps.proc).sort((a, b) => b[1] - a[1]).slice(0, 10),
      dischargeStats: maps.discharge,
      slClShiftArray: Object.values(maps.slClShift).map(item => ({ ...item, topPriDiags: Object.entries(item.priDiags).sort((a, b) => b[1] - a[1]), topSecDiags: Object.entries(item.secDiags).sort((a, b) => b[1] - a[1]), topProcs: Object.entries(item.procs || {}).sort((a, b) => b[1] - a[1]) })).sort((a, b) => { if (a.sev !== b.sev) return (b.sev || 0) - (a.sev || 0); return (b.cl || 0) - (a.cl || 0); }),
      inaToIdrgMap: maps.inaToIdrg, idrgToInaMap: maps.idrgToIna, scorecard: { avgDiag: stats.totalScoreDiag / rows.length, avgProc: stats.totalScoreProc / rows.length, discrepancies: maps.discrepancies },
      auditFindings: maps.audit, kpiCoderArray: Object.values(maps.coder).sort((a, b) => b.cases - a.cases), naikKelasStats: Object.values(maps.naikKelas).sort((a, b) => b.totalNilai - a.totalNilai), icuStats: maps.icu,
      topUpStats: { items: Object.values(maps.topUp).sort((a, b) => b.totalPotensi - a.totalPotensi), topUpKasus: stats.topUpKasus, topUpNilai: stats.topUpNilai }
    };
  }, [uploadedFiles, globalFilter]);

  const { totalReviewed, totalSesuai, totalTidak } = useMemo(() => {
    const findings = dashData?.auditFindings || [];
    if (findings.length === 0) return { totalReviewed: 0, totalSesuai: 0, totalTidak: 0 };
    const reviewedSeps = new Set();
    const sesuaiSeps = new Set();
    const tidakSeps = new Set();
    findings.forEach((f) => {
      const sep = String(f.sep || '').trim();
      const key = `${sep}|${f.ruleId}`;
      const v = auditVerdicts[key];
      if (v) {
        reviewedSeps.add(sep);
        if (v === 'sesuai') sesuaiSeps.add(sep);
        else tidakSeps.add(sep);
      }
    });
    return { totalReviewed: reviewedSeps.size, totalSesuai: sesuaiSeps.size, totalTidak: tidakSeps.size };
  }, [dashData?.auditFindings, auditVerdicts]);

  useEffect(() => {
    if (isAnalyzing && dashData) {
      const t = setTimeout(() => setIsAnalyzing(false), 1000);
      return () => clearTimeout(t);
    }
  }, [isAnalyzing, dashData]);



  const dlDrilldownCSV = () => {
    if (drilldown.type === 'audit_kpi') {
      const headers = ['No', 'SEP', 'Rule ID', 'Temuan', 'Warning', 'Verdict'];
      const rows = drilldown.data.map((f, i) => [i + 1, f.sep, f.ruleId, f.case, f.warning, auditVerdicts[`${f.sep}|${f.ruleId}`] || 'belum']);
      exportToXlsx(`Audit_Findings_${drilldown.title}`, headers, rows);
      return;
    }
    const headers = ['No', 'Nama Pasien', 'MRN', 'SEP', 'Tgl Pulang', 'SL INA', 'CL iDRG', 'INA Code', 'Deskripsi INA', 'Diag INA', 'Proc INA', 'iDRG Code', 'Deskripsi iDRG', 'Diag iDRG', 'Proc iDRG', 'Tarif RS', 'Tarif INA', 'Tarif iDRG', 'Selisih', ...compKeys.map(c => c.label)];
    const rows = drilldown.data.map((row, i) => {
      const rs = parseFloat(row.TARIF_RS || row.BIAYA_RS || row.TOTAL_TARIF_RS || 0) || 0;
      const ina = parseFloat(row.TOTAL_TARIF) || 0; const idrg = parseFloat(row.IDRG_TOTAL_TARIF) || 0;
      const inaStr = String(row.INACBG || '').trim(); const cl = parseInt(String(row.IDRG_DRG_CODE || '').slice(-1));
      return [i + 1, String(row.NAMA_PASien || row.NAMA_PASIEN || '-'), String(row.MRN || '-'), String(row.SEP || '-'), String(row.DISCHARGE_DATE || '-'), inaStr ? (inaStr.endsWith('-I') ? 1 : inaStr.endsWith('-II') ? 2 : inaStr.endsWith('-III') ? 3 : 0) : 0, isNaN(cl) ? '-' : cl, String(row.INACBG || '-'), String(row.DESKRIPSI_INACBG || '-'), String(row.DIAGLIST || '-'), String(row.PROCLIST || '-'), String(row.IDRG_DRG_CODE || '-'), String(row.IDRG_DRG_DESCRIPTION || '-'), String(row.IDRG_DIAG_LISTS || '-'), String(row.IDRG_PROC_LISTS || '-'), rs, ina, idrg, idrg - ina, ...compKeys.map(c => extract18(row)[c.key])];
    });
    exportToXlsx(`Data_Pasien_${drilldown.title}`, headers, rows);
  };

  const getPieSlices = (items) => {
    let slices = []; let cPct = 0;
    [...items].sort((a, b) => (b.value || 0) - (a.value || 0)).forEach((item) => {
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

  const isRuleMatch = (row, rule) => {
    const ptd = String(row['PTD'] || '').trim();
    if (rule.layanan && String(rule.layanan) !== ptd) return false;
    const inaCode = normalize_c(String(row['INACBG'] || '').trim());
    const allCodes = (String(row['DIAGLIST'] || '') + " " + String(row['PROCLIST'] || '')).split(/[;, ]/).map(c => normalize_c(c)).filter(c => c);
    const cbgOk = rule.n_cbgs.length === 0 || rule.n_cbgs.some(c => inaCode === c);
    const diagOk = rule.n_diags.length === 0 || rule.n_diags.some(c => allCodes.includes(c));
    const procOk = rule.n_procs.length === 0 || rule.n_procs.some(c => allCodes.includes(c));
    return (cbgOk && diagOk && procOk);
  };

  // --- SUB-RENDERERS ---
  const renderUploadTab = () => (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto mt-4">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 p-1 bg-white border border-teal-100 rounded-2xl w-fit mx-auto shadow-sm">
        <button onClick={() => { setUploadSubTab('manual'); setUploadProgress(null); setError(''); }} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${uploadSubTab === 'manual' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30' : 'text-slate-500 hover:bg-teal-50'}`}>
          <UploadCloud size={16} /> Upload Manual (TXT)
        </button>
        <button onClick={() => { setUploadSubTab('cloud'); setUploadProgress(null); setError(''); }} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${uploadSubTab === 'cloud' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30' : 'text-slate-500 hover:bg-teal-50'}`}>
          <GitMerge size={16} /> Cloud Sync (G-Drive)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {uploadProgress ? (
            <Card className="p-8 text-center transition-all duration-300 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 to-transparent opacity-50 transition-opacity"></div>
              <div className="relative z-10 py-4">
                <div className="relative w-20 h-20 mx-auto mb-5">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke={uploadProgress.status === 'error' ? '#ef4444' : (uploadProgress.status === 'complete' || uploadProgress.status === 'done') ? '#10b981' : '#14b8a6'} strokeWidth="6"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - uploadProgress.pct / 100)}`}
                      strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-lg font-black ${uploadProgress.status === 'complete' || uploadProgress.status === 'done' ? 'text-emerald-600' : uploadProgress.status === 'error' ? 'text-rose-500' : 'text-teal-600'}`}>{uploadProgress.pct}%</span>
                  </div>
                </div>
                <p className={`text-base font-black mb-1 ${uploadProgress.status === 'complete' || uploadProgress.status === 'done' ? 'text-emerald-600' : uploadProgress.status === 'error' ? 'text-rose-500' : 'text-teal-700'}`}>
                  {uploadProgress.status === 'complete' || uploadProgress.status === 'done' ? '✔ Selesai!' : uploadProgress.status === 'error' ? '❌ Terjadi Kesalahan' : uploadProgress.status === 'reading' ? '📂 Membaca...' : uploadProgress.status === 'parsing' ? '⚙️ Memproses...' : '🔗 Menghubungkan...'}
                </p>
                <p className="text-xs text-slate-500 font-medium truncate max-w-[220px] mx-auto mb-4" title={uploadProgress.fileName}>{uploadProgress.fileName || 'Menyelesaikan...'}</p>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden max-w-[200px] mx-auto">
                  <div className={`h-full rounded-full transition-all duration-500 ${uploadProgress.status === 'complete' || uploadProgress.status === 'done' ? 'bg-emerald-500' : uploadProgress.status === 'error' ? 'bg-rose-500' : 'bg-teal-500 animate-pulse'}`}
                    style={{ width: `${uploadProgress.pct}%` }} />
                </div>

                {(uploadProgress.status === 'error' || uploadProgress.status === 'complete' || uploadProgress.status === 'done') && (
                  <button
                    onClick={() => { setUploadProgress(null); setError(''); }}
                    className="mt-8 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-100 px-6 py-2.5 rounded-xl text-xs font-black transition-all hover:shadow-md uppercase tracking-wider"
                  >
                    {uploadProgress.status === 'error' ? 'Coba Lagi' : 'Kembali'}
                  </button>
                )}
              </div>
            </Card>
          ) : (
            <>
              {uploadSubTab === 'manual' ? (
                <Card className="p-8 text-center transition-all duration-300 relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className={`relative z-10 border-2 border-dashed rounded-xl p-8 transition-colors ${isDragging ? 'border-teal-500 bg-teal-50/50' : 'border-slate-200 hover:border-teal-300'}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                    <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform"><UploadCloud className="text-teal-600" size={32} /></div>
                    <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Unggah Data TXT</h3>
                    <p className="text-sm text-slate-500 mb-8 mt-2">Tarik dan letakkan file format TXT klaim RS ke area ini.</p>
                    <div className="flex flex-col gap-3">
                      <button onClick={() => fileInputRef.current?.click()} className="bg-teal-600 hover:bg-teal-700 text-white py-4 px-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm transition-all shadow-lg shadow-teal-600/20 hover:-translate-y-1"><FileText size={18} /> PILIH FILE TXT</button>
                      <button onClick={() => folderInputRef.current?.click()} className="bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-100 py-4 px-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm transition-all hover:shadow-md"><Folder size={18} className="text-slate-400" /> PILIH FOLDER</button>
                    </div>
                    <input type="file" multiple accept=".txt" ref={fileInputRef} className="hidden" onChange={(e) => { if (e.target.files) processFiles(e.target.files); }} />
                    <input type="file" webkitdirectory="true" directory="true" multiple ref={folderInputRef} className="hidden" onChange={(e) => { if (e.target.files) processFiles(e.target.files); }} />
                  </div>
                </Card>
              ) : (
                <Card className="p-8 space-y-6 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><GitMerge size={80} className="text-teal-600" /></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm"><GitMerge className="text-teal-600" size={32} /></div>
                    <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Koneksi Cloud (G-Drive)</h3>
                    <p className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">Masukkan link "Shareable" file TXT dari Google Drive untuk memproses data secara langsung tanpa upload manual.</p>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Google Drive Share Link</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input
                              type="text"
                              value={driveUrl}
                              onChange={(e) => setDriveUrl(e.target.value)}
                              placeholder="https://drive.google.com/file/d/..."
                              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-sm bg-slate-50/50"
                            />
                          </div>
                          <button
                            onClick={() => {
                              if (!driveUrl) return;
                              let id = '';
                              if (driveUrl.includes('folders/')) {
                                alert('Link yang Anda masukkan adalah folder. Mohon masukkan link file .txt hasil ekspor data klaim secara spesifik.');
                                return;
                              }
                              if (driveUrl.includes('id=')) id = driveUrl.split('id=')[1].split('&')[0];
                              else if (driveUrl.includes('/d/')) id = driveUrl.split('/d/')[1].split('/')[0];

                              if (!id) { alert('URL tidak valid. Mohon periksa kembali link Google Drive Anda.'); return; }

                              const dlUrl = `https://docs.google.com/uc?export=download&id=${id}`;
                              setUploadProgress({ pct: 10, status: 'reading', current: 1, total: 1, fileName: 'Menghubungkan ke Drive...' });

                              fetch(dlUrl)
                                .then(res => {
                                  if (!res.ok) throw new Error('Gagal mengakses file. Pastikan file di-share dengan opsi \"Anyone with the link can view\".');
                                  const contentType = res.headers.get('content-type');
                                  if (contentType && contentType.includes('text/html')) {
                                    throw new Error('File tidak dapat diunduh secara otomatis (mungkin folder atau butuh login). Silakan upload file secara manual.');
                                  }
                                  return res.text();
                                })
                                .then(txt => {
                                  if (txt.includes('<!DOCTYPE html>') || txt.includes('<html')) {
                                    throw new Error('Menerima halaman HTML, bukan data teks. Pastikan link adalah Share Link FILE yang bersifat Publik.');
                                  }
                                  const file = new File([txt], "data_from_drive.txt", { type: "text/plain" });
                                  processFiles([file]);
                                })
                                .catch(err => {
                                  console.error(err);
                                  const isCorsError = err.message.includes('fetch') || err.name === 'TypeError';
                                  const msg = isCorsError ?
                                    'Gagal menarik data (Kemungkinan CORS). Browser memblokir koneksi langsung ke Google Drive. Solusi: Silakan unduh file .txt tersebut ke komputer Anda, lalu gunakan tab "Upload Manual".' :
                                    err.message;
                                  setUploadProgress({ pct: 0, status: 'error', current: 0, total: 0, fileName: msg });
                                  alert(`Error Drive: ${msg}`);
                                });
                            }}
                            disabled={!driveUrl || (uploadProgress && uploadProgress.status !== 'complete')}
                            className="px-6 py-3 bg-teal-600 text-white rounded-xl text-sm font-black shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-95 transition-all disabled:bg-slate-300 disabled:shadow-none"
                          >
                            Tarik Data
                          </button>
                        </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 items-start">
                        <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-700 font-medium leading-relaxed">
                          <span className="font-black">PENTING:</span> Pastikan setelan berbagi file di Google Drive adalah <span className="underline">"Anyone with the link" (Siapa saja dengan link)</span> agar aplikasi dapat mengakses data.
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
          {error && <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-2xl flex items-start gap-3 text-sm font-bold shadow-sm animate-in zoom-in-95"><AlertCircle size={20} className="shrink-0 text-rose-500" /><p>{String(error)}</p></div>}
        </div>
        <div className="lg:col-span-3">
          <Card className="p-8 h-full flex flex-col shadow-xl border-0">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
              <div><h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2"><Layers className="text-teal-600" size={24} /> Dataset Aktif</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{uploadedFiles.length} file terintegrasi ke sistem.</p></div>
              {uploadedFiles.length > 0 && <button onClick={clearData} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all border border-transparent hover:border-rose-100 uppercase tracking-wider"><Trash2 size={16} /> Kosongkan</button>}
            </div>
            {uploadedFiles.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 min-h-[300px]"><Layers size={64} className="opacity-10 mb-6 text-teal-900" /><p className="font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">Dataset Kosong</p><p className="text-xs mt-2 font-medium opacity-60">Silakan upload file .txt klaim untuk memulai analisis.</p></div>
            ) : (
              <ul className="space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                {uploadedFiles.map((f) => (
                  <li key={f.id} className="flex items-center gap-5 text-sm bg-white border border-slate-100 shadow-sm p-5 rounded-[1.5rem] group hover:border-teal-200 transition-all hover:shadow-xl hover:-translate-y-1">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm shadow-emerald-100"><CheckCircle size={24} className="text-emerald-500" /></div>
                    <div className="flex-1 min-w-0"><p className="truncate text-slate-800 font-black tracking-tight" title={String(f.path)}>{String(f.name)}</p><p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-wider">{String(f.size)} • <span className="font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-lg ml-1">{f.rows.length.toLocaleString()} RECORDS</span></p></div>
                    <button onClick={() => removeFile(f.id)} className="text-slate-300 hover:text-rose-600 p-2.5 rounded-xl hover:bg-rose-50 transition-all hover:rotate-90"><X size={20} /></button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );

  const renderExecutive = () => {
    const isSelPos = dashData.selisihTotal > 0;
    const dp = dashData.dischargeStats, t = dashData.totalRows || 1;
    const dischargePie = [{ value: (dp["1"] / t) * 100, color: '#10b981', label: 'Atas Ijin Dokter' }, { value: (dp["2"] / t) * 100, color: '#0d9488', label: 'Dirujuk' }, { value: (dp["3"] / t) * 100, color: '#f59e0b', label: 'Pulang APS' }, { value: (dp["4"] / t) * 100, color: '#ef4444', label: 'Meninggal' }, { value: (dp["5"] / t) * 100, color: '#94a3b8', label: 'Lain-lain' }];
    const selPie = [{ value: t > 0 ? (dashData.cInaHigh / t) * 100 : 0, color: '#0d9488', label: 'INA > IDRG' }, { value: t > 0 ? (dashData.cIdrgHigh / t) * 100 : 0, color: '#f59e0b', label: 'IDRG > INA' }, { value: t > 0 ? (dashData.cEq / t) * 100 : 0, color: '#94a3b8', label: 'Sama Besar' }];

    const rajalCount = t - dashData.ranapCount;
    const totalTarifRS = (dashData.reportArray || []).reduce((s, r) => s + r.tarifRsTotal, 0);
    const selInaRS = dashData.tIna - totalTarifRS;
    const selIdrgRS = dashData.tIdrg - totalTarifRS;
    const ranapPct = t > 0 ? (dashData.ranapCount / t) * 100 : 0;

    const insights = [
      selInaRS < 0
        ? { t: 'w', icon: '⚠️', txt: `INA-CBG lebih rendah dari Tarif RS sebesar ${formatRp(Math.abs(selInaRS))} — potensi defisit klaim.` }
        : { t: 's', icon: '✔', txt: `INA-CBG melebihi Tarif RS sebesar ${formatRp(selInaRS)} — klaim dalam posisi surplus.` },
      selIdrgRS < 0
        ? { t: 'w', icon: '⚠️', txt: `iDRG lebih rendah dari Tarif RS sebesar ${formatRp(Math.abs(selIdrgRS))} — evaluasi koding CL diperlukan.` }
        : { t: 's', icon: '✔', txt: `iDRG melebihi Tarif RS sebesar ${formatRp(selIdrgRS)} — koding complexity level sudah optimal.` },
      { t: 'i', icon: '📊', txt: `${formatPct(dashData.tIna > 0 ? (dashData.cInaHigh / t) * 100 : 0)}% kasus INA > iDRG; ${formatPct(dashData.tIna > 0 ? (dashData.cIdrgHigh / t) * 100 : 0)}% kasus iDRG > INA.` },
      { t: 'i', icon: '🏥', txt: `Komposisi: ${formatPct(ranapPct)}% Rawat Inap (${dashData.ranapCount.toLocaleString()}) vs ${formatPct(100 - ranapPct)}% Rawat Jalan (${rajalCount.toLocaleString()} kasus).` },
      ...(dashData.topUpStats?.topUpKasus > 0 ? [{ t: 's', icon: '💡', txt: `Potensi Top-Up: ${dashData.topUpStats.topUpKasus} kasus senilai ${formatRp(dashData.topUpStats.topUpNilai)}.` }] : []),
      ...(dashData.auditFindings?.length > 0 ? [{ t: 'w', icon: '🔎', txt: `${dashData.auditFindings.length} temuan audit koding — segera tinjau di modul Audit.` }] : []),
    ];

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader icon={PieChart} title="Executive Dashboard" desc="Ringkasan eksekutif klaim klinis dan analisis profitabilitas." colorClass="bg-teal-50 text-teal-600" highlightClass="bg-teal-500/5" printAction={() => window.print()} />

        {/* KPI 6-CARD ROW */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Kasus', value: t.toLocaleString(), sub: `${dashData.ranapCount.toLocaleString()} RI + ${rajalCount.toLocaleString()} RJ`, c: 'bg-slate-700', fn: () => openDrilldown('Seluruh Kasus', () => true), icon: <Users size={15} /> },
            { label: 'Rawat Inap', value: dashData.ranapCount.toLocaleString(), sub: `${formatPct(ranapPct)}% dari total`, c: 'bg-teal-600', fn: () => openDrilldown('Rawat Inap', r => String(r['PTD'] || '').trim() === '1'), icon: <Activity size={15} /> },
            { label: 'Rawat Jalan', value: rajalCount.toLocaleString(), sub: `${formatPct(100 - ranapPct)}% dari total`, c: 'bg-emerald-500', fn: () => openDrilldown('Rawat Jalan', r => String(r['PTD'] || '').trim() !== '1'), icon: <User size={15} /> },
            { label: 'Total Tarif RS', value: formatRp(totalTarifRS), sub: `Avg ${formatRp(totalTarifRS / t)}/ep`, c: 'bg-slate-400', fn: () => openDrilldown('Seluruh Kasus', () => true), icon: <BarChart3 size={15} /> },
            { label: 'Selisih INA-RS', value: (selInaRS >= 0 ? '+' : '') + formatRp(selInaRS), sub: selInaRS >= 0 ? 'Surplus' : 'Defisit', c: selInaRS >= 0 ? 'bg-teal-500' : 'bg-rose-500', fn: () => openDrilldown('Seluruh INA-CBG', () => true), icon: <TrendingUp size={15} /> },
            { label: 'Selisih iDRG-RS', value: (selIdrgRS >= 0 ? '+' : '') + formatRp(selIdrgRS), sub: selIdrgRS >= 0 ? 'Surplus' : 'Defisit', c: selIdrgRS >= 0 ? 'bg-teal-500' : 'bg-rose-500', fn: () => openDrilldown('Seluruh iDRG', () => true), icon: <TrendingUp size={15} /> },
          ].map((k, i) => (
            <Card
              key={i}
              className="p-5 cursor-pointer hover:-translate-y-2 hover:shadow-2xl transition-all relative overflow-hidden animate-in fade-in zoom-in-95 duration-500 border-0 shadow-lg"
              style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
              onClick={k.fn}
            >
              <div className={`absolute top-0 left-0 w-full h-1.5 ${k.c}`}></div>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 text-white text-xs shadow-sm ${k.c}`}>{k.icon}</div>
              <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.15em] mb-1.5">{k.label}</p>
              <p className="text-lg font-black text-slate-800 leading-none">{k.value}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-2">{k.sub}</p>
            </Card>
          ))}
        </div>

        {/* INSIGHT BLOCK */}
        <Card className="p-0 overflow-hidden shadow-sm border border-slate-200 bg-white">
          <div className="bg-teal-600 px-6 py-4 flex items-center gap-3">
            <Zap size={20} className="text-white" />
            <div>
              <h3 className="font-bold text-white text-base tracking-wide">Insight Analisis Otomatis</h3>
              <p className="text-teal-100 text-[11px] uppercase tracking-wider font-medium">Temuan Kunci dari Efisiensi Koding</p>
            </div>
          </div>
          <div className="p-5 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.map((ins, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-lg bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className={`absolute left-0 top-0 w-1 h-full ${ins.t === 'w' ? 'bg-rose-500' : ins.t === 's' ? 'bg-emerald-500' : 'bg-teal-500'}`}></div>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${ins.t === 'w' ? 'bg-rose-50 text-rose-600' : ins.t === 's' ? 'bg-emerald-50 text-emerald-600' : 'bg-teal-50 text-teal-600'}`}>
                    {ins.icon}
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs font-semibold text-slate-700 leading-relaxed">{ins.txt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all group relative border-0 shadow-md">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-teal-600"></div>
            <div className="flex justify-between items-start mb-4"><p className="text-slate-500 font-black text-[9px] uppercase tracking-[0.15em]">Total INA-CBG</p><div className="bg-teal-50 p-2.5 rounded-xl text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all" onClick={() => openDrilldown('Seluruh Data INA-CBG', () => true)}><Search size={18} /></div></div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{formatRp(dashData.tIna)}</h2><p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">Rata-rata {formatRp(dashData.rataIna)} per kasus</p>
          </Card>
          <Card className="p-6 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all group relative border-0 shadow-md">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-teal-500"></div>
            <div className="flex justify-between items-start mb-4"><p className="text-slate-500 font-black text-[9px] uppercase tracking-[0.15em]">Total iDRG</p><div className="bg-teal-50 p-2.5 rounded-xl text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all" onClick={() => openDrilldown('Seluruh Data iDRG', () => true)}><Search size={18} /></div></div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{formatRp(dashData.tIdrg)}</h2><p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">Rata-rata {formatRp(dashData.rataIdrg)} per kasus</p>
          </Card>
          <Card className="p-6 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all group relative lg:col-span-2 border-0 shadow-md">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${isSelPos ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <div className="flex justify-between items-start mb-4"><p className="text-slate-500 font-black text-[9px] uppercase tracking-[0.15em]">Selisih Finansial Total (iDRG - INA)</p><div className="bg-slate-50 p-2.5 rounded-xl text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all" onClick={() => openDrilldown('Selisih Total', r => Math.round(parseFloat(r['IDRG_TOTAL_TARIF']) || 0) !== Math.round(parseFloat(r['TOTAL_TARIF']) || 0))}><Search size={18} /></div></div>
            <div className="flex items-baseline gap-4"><h2 className={`text-4xl font-black tracking-tighter ${isSelPos ? 'text-emerald-600' : 'text-rose-600'}`}>{isSelPos ? '+' : ''}{formatRp(dashData.selisihTotal)}</h2><div className={`px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 ${isSelPos ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{isSelPos ? <TrendingUp size={18} /> : <TrendingDown size={18} />} {formatPct(dashData.tIna > 0 ? (Math.abs(dashData.selisihTotal) / dashData.tIna * 100) : 0)}%</div></div>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">Potensi {isSelPos ? 'Surplus' : 'Defisit'} terhadap klaim INA-CBG awal.</p>
          </Card>
        </div>

        <div className="grid grid-cols-1">
          <Card id="chart-komprehensif-bulan" downloadTitle="Perkembangan Finansial Per Bulan" className="p-8 flex flex-col border-0 shadow-xl">
            <div className="flex justify-between items-center mb-10"><h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2"><BarChart3 size={20} className="text-teal-600" /> Komparasi & Tren Bulanan</h3><button onClick={() => exportToXlsx('Bulan', ['Bulan', 'RS', 'INA', 'IDRG', 'Selisih'], dashData.monthlyArray.map(m => [m.label, m.tarifRs, m.inacbg, m.idrg, m.selisih]))} className="text-teal-600 hover:text-white hover:bg-teal-600 bg-teal-50 px-4 py-2 rounded-xl text-xs font-black transition-all border border-teal-100 uppercase tracking-wider shadow-sm">UNDUH CSV</button></div>
            <div className="w-full h-[22rem] mt-6 flex flex-col relative px-2">
              <div className="absolute left-0 right-0 border-b border-slate-300 border-dashed z-0" style={{ top: '65%' }}></div>
              <div className="w-full flex items-center justify-between h-full z-10 gap-2">
                {dashData.monthlyArray.map((m, i) => {
                  const isDef = m.selisih < 0;
                  const posRatio = 65; const negRatio = 35;
                  const maxV = dashData.maxPosVal || 1; const maxN = dashData.absMaxSelisih || 1;
                  const hRs = Math.max((m.tarifRs / maxV) * 100, 1);
                  const hIna = Math.max((m.inacbg / maxV) * 100, 1);
                  const hIdrg = Math.max((m.idrg / maxV) * 100, 1);
                  const hSelPos = !isDef ? Math.max((m.selisih / maxV) * 100, 1) : 0;
                  const hSelNeg = isDef ? Math.max((Math.abs(m.selisih) / maxN) * 100, 1) : 0;

                  return (
                    <div key={`pos-${i}`} className="flex-1 flex flex-col items-center justify-center h-full group relative cursor-pointer">
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-slate-900/95 backdrop-blur text-white text-xs p-3 rounded-xl shadow-xl z-30 pointer-events-none whitespace-nowrap border border-slate-700">
                        <p className="font-extrabold border-b border-slate-700 pb-1.5 mb-1.5 text-slate-100">{String(m.label)}</p>
                        <p className="text-slate-400 font-medium">RS: <span className="text-white">{formatRp(m.tarifRs, true)}</span></p>
                        <p className="text-teal-400 font-medium">INA: <span className="text-white">{formatRp(m.inacbg, true)}</span></p>
                        <p className="text-rose-400 font-medium">iDRG: <span className="text-white">{formatRp(m.idrg, true)}</span></p>
                        <p className={`font-bold mt-1 pt-1 border-t border-slate-700 ${isDef ? 'text-rose-400' : 'text-emerald-400'}`}>{isDef ? 'Defisit' : 'Surplus'}: <span className="text-white">{formatRp(m.selisih, true)}</span></p>
                      </div>

                      <div className="w-full flex flex-col h-full relative">
                        {/* Positive Top Half */}
                        <div className="w-full flex items-end justify-center gap-[2px] relative" style={{ height: `${posRatio}%` }}>
                          <div className="w-1/4 bg-slate-300 rounded-t-sm transition-all group-hover:opacity-80 relative" style={{ height: `${hRs}%` }}>
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow-[0_1px_2px_rgba(0,0,0,0.15)] bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-500 z-10 whitespace-nowrap transition-transform group-hover:scale-110">{formatRp(m.tarifRs, true)}</span>
                          </div>
                          <div className="w-1/4 bg-teal-500 rounded-t-sm transition-all group-hover:opacity-80 shadow-[0_0_8px_rgba(20,184,166,0.3)] relative" style={{ height: `${hIna}%` }}>
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow-[0_1px_2px_rgba(0,0,0,0.15)] bg-white/90 backdrop-blur-sm border border-teal-200 text-teal-600 z-10 whitespace-nowrap transition-transform group-hover:scale-110">{formatRp(m.inacbg, true)}</span>
                          </div>
                          <div className="w-1/4 bg-rose-600 rounded-t-sm transition-all group-hover:opacity-80 shadow-[0_0_8px_rgba(225,29,72,0.3)] relative" style={{ height: `${hIdrg}%` }}>
                            <span className="absolute -top-[3.5rem] left-1/2 -translate-x-1/2 text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow-[0_1px_2px_rgba(0,0,0,0.15)] bg-white/90 backdrop-blur-sm border border-rose-200 text-rose-600 z-10 whitespace-nowrap transition-transform group-hover:scale-110">{formatRp(m.idrg, true)}</span>
                          </div>
                          <div className={`w-1/4 rounded-t-sm transition-all group-hover:opacity-80 shadow-[0_0_8px_rgba(16,185,129,0.3)] relative ${!isDef ? 'bg-emerald-500' : 'bg-transparent'}`} style={{ height: `${hSelPos}%` }}>
                            {!isDef && <span className="absolute -top-[4.5rem] left-1/2 -translate-x-1/2 text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow-[0_1px_2px_rgba(0,0,0,0.15)] bg-white/90 backdrop-blur-sm border border-emerald-200 text-emerald-600 z-10 whitespace-nowrap transition-transform group-hover:scale-110">{formatRp(m.selisih, true)}</span>}
                          </div>
                        </div>
                        {/* Negative Bottom Half */}
                        <div className="w-full flex items-start justify-center gap-[2px] relative" style={{ height: `${negRatio}%` }}>
                          <div className="w-1/4 bg-transparent"></div>
                          <div className="w-1/4 bg-transparent"></div>
                          <div className="w-1/4 bg-transparent"></div>
                          <div className={`w-1/4 rounded-b-sm transition-all group-hover:opacity-80 shadow-[0_0_8px_rgba(244,63,94,0.3)] relative ${isDef ? 'bg-rose-500' : 'bg-transparent'}`} style={{ height: `${hSelNeg}%` }}>
                            {isDef && <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow-[0_1px_2px_rgba(0,0,0,0.15)] bg-white/90 backdrop-blur-sm border border-rose-200 text-rose-600 z-10 whitespace-nowrap transition-transform group-hover:scale-110">{formatRp(m.selisih, true)}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-6 pt-4 border-t border-slate-100 flex-wrap">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div><span className="text-[10px] font-bold text-slate-600 uppercase">Tarif RS</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div><span className="text-[10px] font-bold text-slate-600 uppercase">INACBG</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-600"></div><span className="text-[10px] font-bold text-slate-600 uppercase">IDRG</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div><span className="text-[10px] font-bold text-slate-600 uppercase">Surplus</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div><span className="text-[10px] font-bold text-slate-600 uppercase">Defisit</span></div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card id="pie-volume-arah" downloadTitle="Volume Arah Selisih" className="p-6 flex flex-col items-center">
            <h3 className="text-sm font-extrabold text-slate-800 mb-6 uppercase tracking-wider w-full text-left">Volume Arah Selisih</h3>
            <div className="relative flex flex-col items-center justify-center mt-2 w-full h-56 cursor-pointer group" onClick={() => openDrilldown('Semua Episode', () => true)}>
              <svg viewBox="0 0 36 36" className="w-56 h-56 group-hover:scale-110 transition-transform duration-500 drop-shadow-xl">{getPieSlices(selPie).map((slice, idx) => (<g key={`psel-${idx}`}><path d={slice.path} fill={slice.color} stroke="white" strokeWidth="0.5" className="hover:opacity-80 transition-opacity" />{!slice.isSmall && <text x={slice.labelX} y={slice.labelY} fill="white" fontSize="2.5" fontWeight="bold" textAnchor="middle" alignmentBaseline="central" className="pointer-events-none drop-shadow-md">{slice.percentStr}</text>}</g>))}</svg>
            </div>
            <div className="mt-8 w-full border-t border-slate-100 pt-6 space-y-3 w-full">
              <div className="flex justify-between items-center p-3 hover:bg-teal-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-teal-100" onClick={() => openDrilldown('Kasus INA-CBG > iDRG', r => Math.round(parseFloat(r.TOTAL_TARIF) || 0) > Math.round(parseFloat(r.IDRG_TOTAL_TARIF) || 0))}><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-teal-500 shadow-sm"></div><span className="text-xs font-bold text-slate-700">INACBG {'>'} IDRG</span></div><div className="text-right"><span className="text-sm font-extrabold text-teal-600 mr-2">{dashData.cInaHigh.toLocaleString()} <span className="text-[10px] text-teal-500 uppercase">Kasus</span></span><span className="text-xs font-bold text-slate-400">({formatPct(t > 0 ? (dashData.cInaHigh / t) * 100 : 0)}%)</span></div></div>
              <div className="flex justify-between items-center p-3 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-rose-100" onClick={() => openDrilldown('Kasus iDRG > INA-CBG', r => Math.round(parseFloat(r.IDRG_TOTAL_TARIF) || 0) > Math.round(parseFloat(r.TOTAL_TARIF) || 0))}><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-rose-600 shadow-sm"></div><span className="text-xs font-bold text-slate-700">IDRG {'>'} INACBG</span></div><div className="text-right"><span className="text-sm font-extrabold text-rose-600 mr-2">{dashData.cIdrgHigh.toLocaleString()} <span className="text-[10px] text-rose-500 uppercase">Kasus</span></span><span className="text-xs font-bold text-slate-400">({formatPct(t > 0 ? (dashData.cIdrgHigh / t) * 100 : 0)}%)</span></div></div>
              <div className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-200" onClick={() => openDrilldown('Kasus Sama Besar', r => Math.round(parseFloat(r.IDRG_TOTAL_TARIF) || 0) === Math.round(parseFloat(r.TOTAL_TARIF) || 0))}><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-slate-400 shadow-sm"></div><span className="text-xs font-bold text-slate-700">Sama Besar (Sesuai)</span></div><div className="text-right"><span className="text-sm font-extrabold text-slate-600 mr-2">{dashData.cEq.toLocaleString()} <span className="text-[10px] text-slate-400 uppercase">Kasus</span></span><span className="text-xs font-bold text-slate-400">({formatPct(t > 0 ? (dashData.cEq / t) * 100 : 0)}%)</span></div></div>
            </div>
          </Card>
          <Card id="pie-status-pulang" downloadTitle="Status Cara Pulang" className="p-6 flex flex-col items-center">
            <h3 className="text-sm font-extrabold text-slate-800 mb-6 uppercase tracking-wider w-full text-left">Status Cara Pulang</h3>
            <div className="relative flex flex-col items-center justify-center mt-2 w-full h-56 cursor-pointer group" onClick={() => openDrilldown('Semua Episode', () => true)}>
              <svg viewBox="0 0 36 36" className="w-56 h-56 group-hover:scale-110 transition-transform duration-500 drop-shadow-xl">{getPieSlices(dischargePie).map((slice, idx) => (<g key={`pdis-${idx}`}><path d={slice.path} fill={slice.color} stroke="white" strokeWidth="0.5" className="hover:opacity-80 transition-opacity" />{!slice.isSmall && <text x={slice.labelX} y={slice.labelY} fill="white" fontSize="2.5" fontWeight="bold" textAnchor="middle" alignmentBaseline="central" className="pointer-events-none drop-shadow-md">{slice.percentStr}</text>}</g>))}</svg>
            </div>
            <div className="mt-8 w-full border-t border-slate-100 pt-6 grid grid-cols-2 gap-3">
              {dischargePie.map((item, i) => (
                <div key={`ditem-${i}`} className="flex flex-col p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-200" onClick={() => openDrilldown(`Status Pulang: ${item.label}`, r => { let d = String(r.DISCHARGE_STATUS || r.STATUS_PULANG || r.CARA_PULANG || '').trim(); return item.label === 'Lain-lain' ? (!['1', '2', '3', '4'].includes(d)) : d === String(i + 1); })}>
                  <div className="flex items-center gap-2 mb-1"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div><span className="text-[10px] font-extrabold text-slate-500 uppercase truncate">{item.label}</span></div>
                  <span className="text-sm font-black" style={{ color: item.color }}>{formatPct(item.value)}% <span className="text-[10px] font-semibold text-slate-400 ml-1">({dp[String(i + 1)] || dp["5"]})</span></span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="flex flex-col mb-8 text-center items-center justify-center">
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mb-4"><Layers size={24} className="text-teal-600" /></div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Top 10 Analisis Klinis & Finansial</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="flex flex-col hover:shadow-lg transition-all"><div className="p-4 bg-teal-50/50 border-b border-teal-100 flex items-center gap-2"><Stethoscope size={16} className="text-teal-600" /><h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Top 10 Diag. Utama</h3></div><MiniTable data={dashData.topDiagUtama} columns={[{ header: 'No', className: 'w-8 text-center text-slate-400 font-bold', render: (r, i) => i + 1 }, { header: 'Kode', className: 'font-extrabold text-slate-700', render: (r) => r[0] }, { header: 'Kasus', className: 'text-right font-black text-teal-600', render: (r) => r[1].toLocaleString() }]} /></Card>
            <Card className="flex flex-col hover:shadow-lg transition-all"><div className="p-4 bg-teal-50/50 border-b border-teal-100 flex items-center gap-2"><Stethoscope size={16} className="text-teal-600" /><h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Top 10 Diag. Sekunder</h3></div><MiniTable data={dashData.topDiagSekunder} columns={[{ header: 'No', className: 'w-8 text-center text-slate-400 font-bold', render: (r, i) => i + 1 }, { header: 'Kode', className: 'font-extrabold text-slate-700', render: (r) => r[0] }, { header: 'Kasus', className: 'text-right font-black text-teal-600', render: (r) => r[1].toLocaleString() }]} /></Card>
            <Card className="flex flex-col hover:shadow-lg transition-all"><div className="p-4 bg-emerald-50/50 border-b border-emerald-100 flex items-center gap-2"><ActivitySquare size={16} className="text-emerald-600" /><h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Top 10 Tindakan</h3></div><MiniTable data={dashData.topProc} columns={[{ header: 'No', className: 'w-8 text-center text-slate-400 font-bold', render: (r, i) => i + 1 }, { header: 'Kode', className: 'font-extrabold text-slate-700', render: (r) => r[0] }, { header: 'Kasus', className: 'text-right font-black text-emerald-600', render: (r) => r[1].toLocaleString() }]} /></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="flex flex-col hover:shadow-lg transition-all relative">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-lime-50/50"><div className="p-2 bg-lime-100 rounded-xl text-green-700"><TrendingUp size={18} /></div><div><h3 className="font-extrabold text-slate-800 tracking-tight">Top 10 Surplus INA-CBG (INA &gt; RS)</h3></div></div>
              <MiniTable data={dashData.topSurplusIna} columns={[{ header: 'No', className: 'text-center text-slate-400 font-bold w-8', render: (r, i) => i + 1 }, { header: 'Kode', className: 'font-extrabold text-slate-700', render: (r) => r?.code || '-' }, { header: 'Deskripsi', className: 'text-[10px] text-slate-500 max-w-[120px] truncate', render: (r) => r?.desc || '-' }, { header: 'Kasus', className: 'text-center font-bold text-slate-600', render: (r) => (r?.count || 0).toLocaleString() }, { header: 'Surplus', className: 'text-right font-black text-green-600', render: (r) => `+${formatRp(r?.selisihVsRs)}` }]} onRowClick={r => setMapModal({ isOpen: true, type: 'ina', code: r?.code, desc: r?.desc })} />
            </Card>
            <Card className="flex flex-col hover:shadow-lg transition-all relative">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-orange-50/50"><div className="p-2 bg-orange-100 rounded-xl text-orange-700"><TrendingDown size={18} /></div><div><h3 className="font-extrabold text-slate-800 tracking-tight">Top 10 Defisit INA-CBG (RS &gt; INA)</h3></div></div>
              <MiniTable data={dashData.topDefisitIna} columns={[{ header: 'No', className: 'text-center text-slate-400 font-bold w-8', render: (r, i) => i + 1 }, { header: 'Kode', className: 'font-extrabold text-slate-700', render: (r) => r?.code || '-' }, { header: 'Deskripsi', className: 'text-[10px] text-slate-500 max-w-[120px] truncate', render: (r) => r?.desc || '-' }, { header: 'Kasus', className: 'text-center font-bold text-slate-600', render: (r) => (r?.count || 0).toLocaleString() }, { header: 'Defisit', className: 'text-right font-black text-orange-600', render: (r) => formatRp(Math.abs(r?.selisihVsRs || 0)) }]} onRowClick={r => setMapModal({ isOpen: true, type: 'ina', code: r?.code, desc: r?.desc })} />
            </Card>
            <Card className="flex flex-col hover:shadow-lg transition-all relative">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-lime-50/50"><div className="p-2 bg-lime-100 rounded-xl text-green-700"><TrendingUp size={18} /></div><div><h3 className="font-extrabold text-slate-800 tracking-tight">Top 10 Surplus iDRG (iDRG &gt; RS)</h3></div></div>
              <MiniTable data={dashData.topSurplus} columns={[{ header: 'No', className: 'text-center text-slate-400 font-bold w-8', render: (r, i) => i + 1 }, { header: 'Kode', className: 'font-extrabold text-slate-700', render: (r) => r?.code || '-' }, { header: 'Deskripsi', className: 'text-[10px] text-slate-500 max-w-[120px] truncate', render: (r) => r?.desc || '-' }, { header: 'Kasus', className: 'text-center font-bold text-slate-600', render: (r) => (r?.count || 0).toLocaleString() }, { header: 'Surplus', className: 'text-right font-black text-green-600', render: (r) => `+${formatRp(r?.selisihVsRs)}` }]} onRowClick={r => setMapModal({ isOpen: true, type: 'idrg', code: r?.code, desc: r?.desc })} />
            </Card>
            <Card className="flex flex-col hover:shadow-lg transition-all relative">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-orange-50/50"><div className="p-2 bg-orange-100 rounded-xl text-orange-700"><TrendingDown size={18} /></div><div><h3 className="font-extrabold text-slate-800 tracking-tight">Top 10 Defisit iDRG (RS &gt; iDRG)</h3></div></div>
              <MiniTable data={dashData.topDefisit} columns={[{ header: 'No', className: 'text-center text-slate-400 font-bold w-8', render: (r, i) => i + 1 }, { header: 'Kode', className: 'font-extrabold text-slate-700', render: (r) => r?.code || '-' }, { header: 'Deskripsi', className: 'text-[10px] text-slate-500 max-w-[120px] truncate', render: (r) => r?.desc || '-' }, { header: 'Kasus', className: 'text-center font-bold text-slate-600', render: (r) => (r?.count || 0).toLocaleString() }, { header: 'Defisit', className: 'text-right font-black text-orange-600', render: (r) => formatRp(Math.abs(r?.selisihVsRs || 0)) }]} onRowClick={r => setMapModal({ isOpen: true, type: 'idrg', code: r?.code, desc: r?.desc })} />
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderReport = () => {
    const slKeys = ['sl0', 'sl1', 'sl2', 'sl3'];
    const clKeys = ['rj', 'cl9', 'cl0', 'cl1', 'cl2', 'cl3', 'cl4'];

    const tabs = [
      { id: 'summary', label: 'Ringkasan Bulanan', icon: Calendar, color: 'teal' },
      { id: 'severity', label: 'Severity Level', icon: Layers, color: 'emerald' },
      { id: 'complexity', label: 'Complexity Level', icon: Activity, color: 'sky' },
      { id: 'detail_ranap', label: 'Detail Rawat Inap', icon: Bed, color: 'blue' },
      { id: 'detail_rajal', label: 'Detail Rawat Jalan', icon: Building2, color: 'indigo' },
    ];

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-2xl w-fit mx-auto shadow-inner border border-slate-200">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = reportSubTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setReportSubTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${isActive ? `bg-white text-${t.color}-600 shadow-md scale-105` : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}
              >
                <Icon size={14} className={isActive ? `text-${t.color}-500` : ''} />
                {t.label}
              </button>
            );
          })}
        </div>

        {reportSubTab === 'summary' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <SectionHeader icon={Table2} title="Laporan Tabel Klaim" desc="Rekapitulasi komprehensif jumlah kasus dan nominal klaim INA-CBG vs iDRG per bulan layanan." colorClass="bg-teal-50 text-teal-600" highlightClass="bg-teal-500/5" exportAction={() => exportToXlsx('Laporan_Ringkasan', ['Bulan', 'Tarif RS', 'Kasus Rajal (INA)', 'Kasus Ranap (INA)', 'Total Kasus (INA)', 'Tarif Rajal (INA)', 'Tarif Ranap (INA)', 'Total Tarif (INA)', 'Kasus Rajal (iDRG)', 'Kasus Ranap (iDRG)', 'Total Kasus (iDRG)', 'Tarif Rajal (iDRG)', 'Tarif Ranap (iDRG)', 'Total Tarif (iDRG)'], dashData.reportArray.map(m => [m.label, m.tarifRsTotal, m.kasusRajal, m.kasusRanap, m.kasusRajal + m.kasusRanap, m.inaRajal, m.inaRanap, m.inaRajal + m.inaRanap, m.kasusRajal, m.kasusRanap, m.kasusRajal + m.kasusRanap, m.idrgRajal, m.idrgRanap, m.idrgRajal + m.idrgRanap]))} exportText="Ekspor CSV" />
            <Card className="overflow-x-auto p-2 custom-scrollbar max-h-[600px] border-0 shadow-xl">
              <table className="w-full text-xs text-center border-collapse whitespace-nowrap">
                <thead className="text-[10px] uppercase font-black tracking-wider sticky top-0 z-40">
                  <tr>
                    <th rowSpan={3} className="bg-slate-900 text-white border-b border-r border-white/10 p-3">NO</th><th rowSpan={3} className="bg-slate-900 text-white border-b border-r border-white/10 p-3">BULAN LAYANAN</th><th rowSpan={3} className="bg-slate-900 text-white border-b border-r border-white/10 p-3">Tarif RS (Cost)</th>
                    <th colSpan={6} className="bg-teal-800 text-white border-b border-r border-white/10 p-3">Klaim INA CBG</th><th colSpan={6} className="bg-emerald-800 text-white border-b border-white/10 p-3">Klaim iDRG</th>
                  </tr>
                  <tr>
                    <th colSpan={3} className="bg-teal-700/80 text-white border-b border-r border-white/10 p-2">KASUS</th><th colSpan={3} className="bg-teal-700/80 text-white border-b border-r border-white/10 p-2">Penerimaan INACBG (Rp)</th>
                    <th colSpan={3} className="bg-emerald-700/80 text-white border-b border-r border-white/10 p-2">JUMLAH KASUS iDRG</th><th colSpan={3} className="bg-emerald-700/80 text-white border-b border-white/10 p-2">TOTAL KLAIM iDRG (Rp)</th>
                  </tr>
                  <tr>
                    <th className="bg-teal-600/50 text-white border-b border-r border-white/10 p-2">RJ</th><th className="bg-teal-600/50 text-white border-b border-r border-white/10 p-2">RI</th><th className="bg-teal-900 text-teal-100 border-b border-r border-white/10 p-2">TOT</th>
                    <th className="bg-teal-600/50 text-white border-b border-r border-white/10 p-2">RJ</th><th className="bg-teal-600/50 text-white border-b border-r border-white/10 p-2">RI</th><th className="bg-teal-900 text-teal-100 border-b border-r border-white/10 p-2">TOT</th>
                    <th className="bg-emerald-600/50 text-white border-b border-r border-white/10 p-2">RJ</th><th className="bg-emerald-600/50 text-white border-b border-r border-white/10 p-2">RI</th><th className="bg-emerald-900 text-emerald-100 border-b border-r border-white/10 p-2">TOT</th>
                    <th className="bg-emerald-600/50 text-white border-b border-r border-white/10 p-2">RJ</th><th className="bg-emerald-600/50 text-white border-b border-r border-white/10 p-2">RI</th><th className="bg-emerald-900 text-emerald-100 border-b border-white/10 p-2">TOT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm bg-white">
                  {dashData.reportArray.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => openDrilldown(`Bulan: ${row.label}`, r => { const dObj = parseDate(r['DISCHARGE_DATE']); return dObj && `${monthNames[dObj.getMonth()]} - ${dObj.getFullYear()}` === row.label; })}>
                      <td className="border-r border-slate-100 p-3 font-semibold text-slate-400">{i + 1}</td>
                      <td className="border-r border-slate-100 p-3 font-bold text-slate-700">{row.label}</td>
                      <td className="border-r border-slate-100 p-3 text-right font-semibold text-slate-600">{formatRpEx(row.tarifRsTotal)}</td>
                      <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-teal-50/10">{(row.kasusRajal ?? 0).toLocaleString()}</td><td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-teal-50/10">{(row.kasusRanap ?? 0).toLocaleString()}</td><td className="border-r border-teal-50 p-3 text-right font-black text-teal-600 bg-teal-50/40">{((row.kasusRajal ?? 0) + (row.kasusRanap ?? 0)).toLocaleString()}</td>
                      <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-teal-50/10">{formatRpEx(row.inaRajal)}</td><td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-teal-50/10">{formatRpEx(row.inaRanap)}</td><td className="border-r border-teal-100 p-3 text-right font-black text-teal-600 bg-teal-50/40">{formatRpEx((row.inaRajal ?? 0) + (row.inaRanap ?? 0))}</td>
                      <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-emerald-50/10">{(row.kasusRajal ?? 0).toLocaleString()}</td><td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-emerald-50/10">{(row.kasusRanap ?? 0).toLocaleString()}</td><td className="border-r border-emerald-50 p-3 text-right font-black text-emerald-600 bg-emerald-50/40">{((row.kasusRajal ?? 0) + (row.kasusRanap ?? 0)).toLocaleString()}</td>
                      <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-emerald-50/10">{formatRpEx(row.idrgRajal)}</td><td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-emerald-50/10">{formatRpEx(row.idrgRanap)}</td><td className="p-3 text-right font-black text-emerald-600 bg-emerald-50/40">{formatRpEx((row.idrgRajal ?? 0) + (row.idrgRanap ?? 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {reportSubTab === 'severity' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <SectionHeader icon={Layers} title="Laporan Severity Level (INA-CBG)" desc="Sebaran volume dan nominal tarif berdasarkan tingkat keparahan (Severity Level 0 - 3)." colorClass="bg-emerald-50 text-emerald-600" highlightClass="bg-emerald-500/5" exportAction={() => exportToXlsx('Severity_Level', ['Bulan', 'SL 0 (Kasus)', 'SL 1 (Kasus)', 'SL 2 (Kasus)', 'SL 3 (Kasus)', 'SL 0 (Tarif)', 'SL 1 (Tarif)', 'SL 2 (Tarif)', 'SL 3 (Tarif)', 'Total Kasus', 'Total Klaim'], dashData.severityReportArray.map(m => [m.label, m.sl0_kasus, m.sl1_kasus, m.sl2_kasus, m.sl3_kasus, m.sl0_rp, m.sl1_rp, m.sl2_rp, m.sl3_rp, m.total_kasus, m.total_rp]))} />
            <Card className="overflow-x-auto p-2 custom-scrollbar">
              <table className="w-full text-xs text-center border-collapse whitespace-nowrap">
                <thead className="text-[10px] uppercase font-bold tracking-wider sticky top-0 z-40 bg-slate-50">
                  <tr>
                    <th rowSpan={3} className="border-b border-r border-slate-200 p-3 text-slate-500">NO</th>
                    <th rowSpan={3} className="border-b border-r border-slate-200 p-3 text-slate-500">BULAN LAYANAN</th>
                    <th colSpan={8} className="bg-emerald-50 text-emerald-700 border-b border-r border-emerald-100 p-3">KLAIM INA CBGs</th>
                    <th rowSpan={3} className="bg-slate-100 text-slate-600 border-b border-r border-slate-200 p-3">TOTAL KASUS</th>
                    <th rowSpan={3} className="bg-slate-100 text-slate-600 border-b border-slate-200 p-3">TOTAL KLAIM (Rp)</th>
                  </tr>
                  <tr>
                    <th colSpan={4} className="bg-emerald-100/50 text-emerald-600 border-b border-r border-emerald-100 p-2">JUMLAH KASUS</th>
                    <th colSpan={4} className="bg-emerald-100/50 text-emerald-600 border-b border-r border-emerald-100 p-2">JUMLAH KLAIM (Rp)</th>
                  </tr>
                  <tr>
                    {slKeys.map(k => <th key={k} className="bg-emerald-50/50 text-emerald-500 border-b border-r border-emerald-100 p-2">SL {k.slice(-1)}</th>)}
                    {slKeys.map(k => <th key={k + 'rp'} className="bg-emerald-50/50 text-emerald-500 border-b border-r border-emerald-100 p-2">SL {k.slice(-1)}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm bg-white">
                  {dashData.severityReportArray.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => openDrilldown(`Bulan: ${row.label}`, r => { const dObj = parseDate(r['DISCHARGE_DATE']); return dObj && `${monthNames[dObj.getMonth()]} - ${dObj.getFullYear()}` === row.label; })}>
                      <td className="border-r border-slate-100 p-3 font-semibold text-slate-400">{i + 1}</td>
                      <td className="border-r border-slate-100 p-3 font-bold text-slate-700">{row.label}</td>
                      {slKeys.map(k => <td key={k} className="border-r border-slate-50 p-3 text-right text-slate-600">{(row[`${k}_kasus`] ?? 0).toLocaleString()}</td>)}
                      {slKeys.map(k => <td key={k + 'rp'} className="border-r border-slate-50 p-3 text-right text-slate-600">{formatRpEx(row[`${k}_rp`] ?? 0)}</td>)}
                      <td className="border-r border-slate-100 p-3 text-right font-black text-slate-700 bg-slate-50">{(row.total_kasus ?? 0).toLocaleString()}</td>
                      <td className="p-3 text-right font-black text-slate-700 bg-slate-50">{formatRpEx(row.total_rp ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {reportSubTab === 'complexity' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <SectionHeader icon={Activity} title="Laporan Complexity Level (iDRG)" desc="Rekapitulasi volume dan klaim berdasarkan Complexity Level iDRG (Rajal & CL 0 - 4)." colorClass="bg-sky-50 text-sky-600" highlightClass="bg-sky-500/5" exportAction={() => exportToXlsx('Complexity_Level', ['Bulan', 'Rajal (Kasus)', 'CL 9 (Kasus)', 'CL 0 (Kasus)', 'CL 1 (Kasus)', 'CL 2 (Kasus)', 'CL 3 (Kasus)', 'CL 4 (Kasus)', 'Rajal (Tarif)', 'CL 9 (Tarif)', 'CL 0 (Tarif)', 'CL 1 (Tarif)', 'CL 2 (Tarif)', 'CL 3 (Tarif)', 'CL 4 (Tarif)', 'Total Kasus', 'Total Klaim'], dashData.clReportArray.map(m => [m.label, m.rj_kasus, m.cl9_kasus, m.cl0_kasus, m.cl1_kasus, m.cl2_kasus, m.cl3_kasus, m.cl4_kasus, m.rj_rp, m.cl9_rp, m.cl0_rp, m.cl1_rp, m.cl2_rp, m.cl3_rp, m.cl4_rp, m.total_kasus, m.total_rp]))} />
            <Card className="overflow-x-auto p-2 custom-scrollbar border-0 shadow-xl">
              <table className="w-full text-xs text-center border-collapse whitespace-nowrap">
                <thead className="text-[10px] uppercase font-bold tracking-wider sticky top-0 z-40 bg-slate-50">
                  <tr>
                    <th rowSpan={3} className="border-b border-r border-slate-200 p-3 text-slate-500">NO</th>
                    <th rowSpan={3} className="border-b border-r border-slate-200 p-3 text-slate-500">BULAN LAYANAN</th>
                    <th colSpan={14} className="bg-emerald-50 text-emerald-700 border-b border-r border-emerald-100 p-3">KLAIM iDRG</th>
                    <th rowSpan={3} className="bg-slate-100 text-slate-600 border-b border-r border-slate-200 p-3">TOTAL KASUS</th>
                    <th rowSpan={3} className="bg-slate-100 text-slate-600 border-b border-slate-200 p-3">TOTAL KLAIM (Rp)</th>
                  </tr>
                  <tr>
                    <th colSpan={7} className="bg-emerald-100/50 text-emerald-600 border-b border-r border-emerald-100 p-2">JUMLAH KASUS</th>
                    <th colSpan={7} className="bg-emerald-100/50 text-emerald-600 border-b border-r border-emerald-100 p-2">JUMLAH KLAIM (Rp)</th>
                  </tr>
                  <tr>
                    {clKeys.map(k => <th key={k} className="bg-emerald-50/50 text-emerald-500 border-b border-r border-emerald-100 p-2">{k === 'rj' ? 'Rajal' : `CL-${k.replace('cl', '')}`}</th>)}
                    {clKeys.map(k => <th key={k + 'rp'} className="bg-emerald-50/50 text-emerald-500 border-b border-r border-emerald-100 p-2">{k === 'rj' ? 'Rajal' : `CL-${k.replace('cl', '')}`}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm bg-white">
                  {dashData.clReportArray && dashData.clReportArray.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => openDrilldown(`Bulan: ${row.label}`, r => { const dObj = parseDate(r['DISCHARGE_DATE']); return dObj && `${monthNames[dObj.getMonth()]} - ${dObj.getFullYear()}` === row.label; })}>
                      <td className="border-r border-slate-100 p-3 font-semibold text-slate-400">{i + 1}</td>
                      <td className="border-r border-slate-100 p-3 font-bold text-slate-700">{row.label}</td>
                      {clKeys.map(k => <td key={k} className="border-r border-slate-50 p-3 text-right text-slate-600">{(row[`${k}_kasus`] ?? 0).toLocaleString()}</td>)}
                      {clKeys.map(k => <td key={k + 'rp'} className="border-r border-slate-50 p-3 text-right text-slate-600">{formatRpEx(row[`${k}_rp`] ?? 0)}</td>)}
                      <td className="border-r border-slate-100 p-3 text-right font-black text-slate-700 bg-slate-50">{(row.total_kasus ?? 0).toLocaleString()}</td>
                      <td className="p-3 text-right font-black text-slate-700 bg-slate-50">{formatRpEx(row.total_rp ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {reportSubTab === 'detail_ranap' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <SectionHeader icon={GitMerge} title="Analisis Detail - RAWAT INAP" desc="Perbandingan parameter iDRG (Cost Weight, NBR, AF) vs INA-CBG pada kasus Rawat Inap." colorClass="bg-blue-50 text-blue-600" highlightClass="bg-blue-500/5" exportAction={() => exportToXlsx('Detail_Ranap', ['Code', 'Deskripsi', 'Jumlah', 'ALOS', 'Subtotal RS', 'Subtotal INA', 'Perpasien iDRG', 'Cost Weight', 'NBR', 'Adj Factor', 'Avg RS', 'Subtotal iDRG', 'Selisih'], dashData.drgSummaryRanap.map(r => [r.code, r.desc, r.count, r.avgLos, r.sumRS, r.sumIna, r.avgIdrg, r.avgCW, r.avgNBR, r.avgAF, r.avgRS, r.sumIdrg, r.selisih]))} />
            <Card className="overflow-x-auto p-2 custom-scrollbar border-0 shadow-xl max-h-[700px]">
              <table className="w-full text-xs text-center border-collapse whitespace-nowrap">
                <thead className="text-[9px] uppercase font-black tracking-wider sticky top-0 z-40">
                  <tr className="bg-slate-900 text-white">
                    <th rowSpan={2} className="p-3 border-b border-r border-white/10">No</th>
                    <th rowSpan={2} className="p-3 border-b border-r border-white/10">Code</th>
                    <th rowSpan={2} className="p-3 border-b border-r border-white/10 min-w-[200px]">Deskripsi</th>
                    <th rowSpan={2} className="p-3 border-b border-r border-white/10">Jumlah</th>
                    <th rowSpan={2} className="p-3 border-b border-r border-white/10 text-teal-300">ALOS</th>
                    <th rowSpan={2} className="p-3 border-b border-r border-white/10 text-rose-300">LOS Max</th>
                    <th rowSpan={2} className="p-3 border-b border-r border-white/10">Subtotal RS</th>
                    <th className="p-3 border-b border-r border-white/10 bg-teal-800">INA CBGs</th>
                    <th colSpan={4} className="p-3 border-b border-r border-white/10 bg-emerald-800 text-center">Data iDRG</th>
                    <th rowSpan={2} className="p-3 border-b border-r border-white/10 bg-slate-800">Avg Cost/Pasien</th>
                    <th rowSpan={2} className="p-3 border-b border-r border-white/10 bg-emerald-900">Subtotal iDRG</th>
                    <th rowSpan={2} className="p-3 border-b border-white/10 bg-rose-900">Selisih</th>
                  </tr>
                  <tr className="bg-slate-800 text-slate-300">
                    <th className="p-2 border-b border-r border-white/10 bg-teal-700/50">Subtotal INA</th>
                    <th className="p-2 border-b border-r border-white/10 bg-emerald-700/50">Perpasien</th>
                    <th className="p-2 border-b border-r border-white/10 bg-emerald-700/50">Cost Weight</th>
                    <th className="p-2 border-b border-r border-white/10 bg-emerald-700/50">NBR</th>
                    <th className="p-2 border-b border-r border-white/10 bg-emerald-700/50">Adj. Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs bg-white">
                  {dashData.drgSummaryRanap.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => openDrilldown(`Detail Ranap: ${r.code}`, row => String(row.IDRG_DRG_CODE).trim() === r.code && String(row.PTD).trim() === '1')}>
                      <td className="p-2.5 border-r border-slate-100 font-bold text-slate-400">{i + 1}</td>
                      <td className="p-2.5 border-r border-slate-100 font-black text-slate-700">{r.code}</td>
                      <td className="p-2.5 border-r border-slate-100 text-left font-bold text-slate-600 truncate max-w-[250px]" title={r.desc}>{r.desc}</td>
                      <td className="p-2.5 border-r border-slate-100 font-black text-teal-600 bg-teal-50/10">{r.count.toLocaleString()}</td>
                      <td className="p-2.5 border-r border-slate-100 font-bold text-slate-500">{r.avgLos.toFixed(1)}</td>
                      <td className="p-2.5 border-r border-slate-100 font-black text-rose-600 bg-rose-50/10">{r.maxLos}</td>
                      <td className="p-2.5 border-r border-slate-100 text-right font-semibold text-slate-600">{formatRpEx(r.sumRS)}</td>
                      <td className="p-2.5 border-r border-slate-100 text-right font-black text-teal-700 bg-teal-50/20">{formatRpEx(r.sumIna)}</td>
                      <td className="p-2.5 border-r border-slate-50 text-right font-bold text-emerald-700 bg-emerald-50/10">{formatRpEx(r.avgIdrg)}</td>
                      <td className="p-2.5 border-r border-slate-50 text-center font-bold text-slate-600 bg-emerald-50/5">{r.avgCW.toFixed(4)}</td>
                      <td className="p-2.5 border-r border-slate-50 text-right font-bold text-slate-600 bg-emerald-50/5">{formatRpEx(r.avgNBR)}</td>
                      <td className="p-2.5 border-r border-slate-100 text-center font-bold text-slate-600 bg-emerald-50/5">{r.avgAF.toFixed(4)}</td>
                      <td className="p-2.5 border-r border-slate-100 text-right font-bold text-slate-500">{formatRpEx(r.avgRS)}</td>
                      <td className="p-2.5 border-r border-slate-100 text-right font-black text-emerald-700 bg-emerald-50/20">{formatRpEx(r.sumIdrg)}</td>
                      <td className={`p-2.5 text-right font-black ${r.selisih >= 0 ? 'text-emerald-600 bg-emerald-50/30' : 'text-rose-600 bg-rose-50/30'}`}>{r.selisih >= 0 ? '+' : ''}{formatRpEx(r.selisih)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {reportSubTab === 'detail_rajal' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <SectionHeader icon={GitMerge} title="Analisis Detail - RAWAT JALAN" desc="Perbandingan parameter iDRG vs INA-CBG pada kasus Rawat Jalan." colorClass="bg-sky-50 text-sky-600" highlightClass="bg-sky-500/5" exportAction={() => exportToXlsx('Detail_Rajal', ['Code', 'Deskripsi', 'Jumlah', 'ALOS', 'Subtotal RS', 'Subtotal INA', 'Perpasien iDRG', 'Cost Weight', 'NBR', 'Adj Factor', 'Avg RS', 'Subtotal iDRG', 'Selisih'], dashData.drgSummaryRajal.map(r => [r.code, r.desc, r.count, r.avgLos, r.sumRS, r.sumIna, r.avgIdrg, r.avgCW, r.avgNBR, r.avgAF, r.avgRS, r.sumIdrg, r.selisih]))} />
            <Card className="overflow-x-auto p-2 custom-scrollbar border-0 shadow-xl max-h-[700px]">
              <table className="w-full text-xs text-center border-collapse whitespace-nowrap">
                <thead className="text-[9px] uppercase font-black tracking-wider sticky top-0 z-40">
                  <tr className="bg-slate-900 text-white">
                    <th rowSpan={2} className="p-3 border-b border-r border-white/10">No</th>
                    <th rowSpan={2} className="p-3 border-b border-r border-white/10">Code</th>
                    <th rowSpan={2} className="p-3 border-b border-r border-white/10 min-w-[200px]">Deskripsi</th>
                    <th rowSpan={2} className="p-3 border-b border-r border-white/10">Jumlah</th>
                    <th rowSpan={2} className="p-3 border-b border-r border-white/10 text-teal-300">ALOS</th>
                    <th rowSpan={2} className="p-3 border-b border-r border-white/10 text-rose-300">LOS Max</th>
                    <th rowSpan={2} className="p-3 border-b border-r border-white/10">Subtotal RS</th>
                    <th className="p-3 border-b border-r border-white/10 bg-teal-800">INA CBGs</th>
                    <th colSpan={4} className="p-3 border-b border-r border-white/10 bg-emerald-800 text-center">Data iDRG</th>
                    <th rowSpan={2} className="p-3 border-b border-r border-white/10 bg-slate-800">Avg Cost/Pasien</th>
                    <th rowSpan={2} className="p-3 border-b border-r border-white/10 bg-emerald-900">Subtotal iDRG</th>
                    <th rowSpan={2} className="p-3 border-b border-white/10 bg-rose-900">Selisih</th>
                  </tr>
                  <tr className="bg-slate-800 text-slate-300">
                    <th className="p-2 border-b border-r border-white/10 bg-teal-700/50">Subtotal INA</th>
                    <th className="p-2 border-b border-r border-white/10 bg-emerald-700/50">Perpasien</th>
                    <th className="p-2 border-b border-r border-white/10 bg-emerald-700/50">Cost Weight</th>
                    <th className="p-2 border-b border-r border-white/10 bg-emerald-700/50">NBR</th>
                    <th className="p-2 border-b border-r border-white/10 bg-emerald-700/50">Adj. Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs bg-white">
                  {dashData.drgSummaryRajal.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => openDrilldown(`Detail Rajal: ${r.code}`, row => String(row.IDRG_DRG_CODE).trim() === r.code && String(row.PTD).trim() === '2')}>
                      <td className="p-2.5 border-r border-slate-100 font-bold text-slate-400">{i + 1}</td>
                      <td className="p-2.5 border-r border-slate-100 font-black text-slate-700">{r.code}</td>
                      <td className="p-2.5 border-r border-slate-100 text-left font-bold text-slate-600 truncate max-w-[250px]" title={r.desc}>{r.desc}</td>
                      <td className="p-2.5 border-r border-slate-100 font-black text-teal-600 bg-teal-50/10">{r.count.toLocaleString()}</td>
                      <td className="p-2.5 border-r border-slate-100 font-bold text-slate-500">{r.avgLos.toFixed(1)}</td>
                      <td className="p-2.5 border-r border-slate-100 font-black text-rose-600 bg-rose-50/10">{r.maxLos}</td>
                      <td className="p-2.5 border-r border-slate-100 text-right font-semibold text-slate-600">{formatRpEx(r.sumRS)}</td>
                      <td className="p-2.5 border-r border-slate-100 text-right font-black text-teal-700 bg-teal-50/20">{formatRpEx(r.sumIna)}</td>
                      <td className="p-2.5 border-r border-slate-50 text-right font-bold text-emerald-700 bg-emerald-50/10">{formatRpEx(r.avgIdrg)}</td>
                      <td className="p-2.5 border-r border-slate-50 text-center font-bold text-slate-600 bg-emerald-50/5">{r.avgCW.toFixed(4)}</td>
                      <td className="p-2.5 border-r border-slate-50 text-right font-bold text-slate-600 bg-emerald-50/5">{formatRpEx(r.avgNBR)}</td>
                      <td className="p-2.5 border-r border-slate-100 text-center font-bold text-slate-600 bg-emerald-50/5">{r.avgAF.toFixed(4)}</td>
                      <td className="p-2.5 border-r border-slate-100 text-right font-bold text-slate-500">{formatRpEx(r.avgRS)}</td>
                      <td className="p-2.5 border-r border-slate-100 text-right font-black text-emerald-700 bg-emerald-50/20">{formatRpEx(r.sumIdrg)}</td>
                      <td className={`p-2.5 text-right font-black ${r.selisih >= 0 ? 'text-emerald-600 bg-emerald-50/30' : 'text-rose-600 bg-rose-50/30'}`}>{r.selisih >= 0 ? '+' : ''}{formatRpEx(r.selisih)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </div>
    );
  };

  const renderSlClAnalysis = () => {

    const data = dashData.slClShiftArray;
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
        <SectionHeader icon={Layers} title="Analisis Pergeseran SL & CL" desc="Peta sebaran transisi dari Severity Level INA-CBG (SL) menuju Complexity Level iDRG (CL)." colorClass="bg-sky-50 text-sky-600" highlightClass="bg-blue-500/5" exportAction={() => exportToXlsx('SL_CL', ['Transisi', 'Kasus', 'Sum INA', 'Sum iDRG', 'Selisih', 'Diagnosa Utama Terbanyak', 'Diagnosa Sekunder Terbanyak', 'Prosedur Signifikan'], data.map(d => [`SL ${d.sev} ke CL ${d.cl}`, d.count, d.sumIna, d.sumIdrg, d.selisih, d.topPriDiags.slice(0, 5).map(x => `${x[0]}(${x[1]})`).join(', '), d.topSecDiags.slice(0, 5).map(x => `${x[0]}(${x[1]})`).join(', '), d.topProcs.slice(0, 5).map(x => `${x[0]}(${x[1]})`).join(', ')]))} />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.length === 0 ? <Card className="col-span-full p-12 text-center"><p className="text-slate-500 font-semibold">Belum ada data pergeseran SL/CL yang terekam pada rawat inap (PTD 1).</p></Card> :
            data.map((item, idx) => {
              let tagColor = "bg-slate-100 text-slate-600", tagText = "Normal";
              if (item.selisih > 1000000) { tagColor = "bg-lime-100 text-green-700"; tagText = "Surplus Tinggi"; }
              else if (item.selisih > 0) { tagColor = "bg-lime-50 text-green-600"; tagText = "Surplus"; }
              else if (item.selisih < -1000000) { tagColor = "bg-orange-100 text-orange-700"; tagText = "Defisit Tinggi"; }
              else if (item.selisih < 0) { tagColor = "bg-orange-50 text-orange-600"; tagText = "Defisit"; }
              else { tagText = "Optimal"; }
              return (
                <Card key={`slcl-${idx}`} className="flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50" onClick={() => openDrilldown(`Pergeseran SL ${item.sev} ke CL ${item.cl}`, r => { let s = 0; if (String(r['INACBG'] || '').endsWith('-I')) s = 1; else if (String(r['INACBG'] || '').endsWith('-II')) s = 2; else if (String(r['INACBG'] || '').endsWith('-III')) s = 3; return s === item.sev && parseInt(String(r['IDRG_DRG_CODE'] || '').slice(-1)) === item.cl; })}>
                    <div className="flex items-center gap-3"><div className="bg-sky-100 text-sky-700 font-black text-lg w-10 h-10 rounded-xl flex items-center justify-center shadow-sm">S{item.sev}</div><ChevronRight className="text-slate-300 shrink-0" /><div className="bg-orange-100 text-orange-700 font-black text-lg w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-col">C{item.cl}</div><span className="text-xs font-extrabold text-orange-800 ml-1 opacity-80">{getCLName(item.cl)}</span></div>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border border-white/50 ${tagColor}`}>{tagText}</span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-end gap-2 mb-4"><h4 className="text-4xl font-black text-slate-800 tracking-tight">{item.count.toLocaleString()}</h4><span className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Kasus</span></div>
                    <div className="space-y-2 mb-6 bg-slate-50 rounded-xl p-3 border border-slate-100/60">
                      <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Total INA:</span><span className="text-sky-600">{formatRp(item.sumIna)}</span></div>
                      <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Total iDRG:</span><span className="text-orange-600">{formatRp(item.sumIdrg)}</span></div>
                      <div className="pt-2 mt-2 border-t border-slate-200/60 flex justify-between text-xs font-black"><span className="text-slate-600">Selisih:</span><span className={item.selisih > 0 ? 'text-lime-600' : 'text-orange-600'}>{item.selisih > 0 ? '+' : ''}{formatRp(item.selisih)}</span></div>
                    </div>
                    <div className="space-y-4 mt-auto border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Stethoscope size={12} className="text-sky-500" /> Diagnosa Utama Terbanyak</p>
                        <div className="max-h-[100px] overflow-y-auto custom-scrollbar pr-2 flex flex-wrap gap-2">
                          {item.topPriDiags.length === 0 ? <span className="text-[10px] text-slate-400 italic">Tanpa data diagnosa</span> : item.topPriDiags.slice(0, 8).map((d, i) => (
                            <div key={`pd-${i}`} className="flex items-center gap-1.5 bg-sky-50/50 hover:bg-sky-100 border border-sky-100 rounded-md px-2 py-1 transition-colors">
                              <span className="text-[11px] font-black text-sky-800">{d[0]}</span>
                              <span className="text-[10px] font-bold text-sky-600/70">{d[1]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Activity size={12} className="text-orange-500" /> Diagnosa Sekunder Dominan</p>
                        <div className="max-h-[100px] overflow-y-auto custom-scrollbar pr-2 flex flex-wrap gap-2">
                          {item.topSecDiags.length === 0 ? <span className="text-[10px] text-slate-400 italic">Tanpa diag sekunder</span> : item.topSecDiags.slice(0, 10).map((d, i) => (
                            <div key={`sd-${i}`} className="flex items-center gap-1.5 bg-slate-100/80 hover:bg-slate-200 border border-slate-200 rounded-md px-2 py-1 transition-colors">
                              <span className="text-[11px] font-bold text-slate-700">{d[0]}</span>
                              <span className="text-[10px] font-semibold text-white bg-slate-400 rounded-sm px-1.5">{d[1]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FileText size={12} className="text-indigo-500" /> Prosedur Signifikan</p>
                        <div className="max-h-[100px] overflow-y-auto custom-scrollbar pr-2 flex flex-wrap gap-2">
                          {item.topProcs.length === 0 ? <span className="text-[10px] text-slate-400 italic">Tanpa data prosedur</span> : item.topProcs.slice(0, 8).map((p, i) => (
                            <div key={`pr-${i}`} className="flex items-center gap-1.5 bg-indigo-50/50 hover:bg-indigo-100 border border-indigo-100 rounded-md px-2 py-1 transition-colors">
                              <span className="text-[11px] font-black text-indigo-800">{p[0]}</span>
                              <span className="text-[10px] font-bold text-indigo-600/70">{p[1]}</span>
                            </div>
                          ))}
                        </div>
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

  const renderPemetaan = () => {
    const isReverse = pemetaanTab === 'idrgToIna';
    const sourceData = isReverse ? dashData.idrgToInaMap : dashData.inaToIdrgMap;
    const allKeys = Object.keys(sourceData).sort();
    const q = mapFilter.trim().toLowerCase();
    const filteredKeys = q
      ? allKeys.filter(key =>
        key.toLowerCase().includes(q) ||
        String(sourceData[key].desc).toLowerCase().includes(q)
      )
      : allKeys;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
        <SectionHeader
          icon={GitMerge}
          title={isReverse ? "Peta Sebaran: iDRG ke INA-CBG" : "Peta Sebaran: INA-CBG ke iDRG"}
          desc={isReverse ? "Melihat bagaimana satu kode iDRG terdistribusi ke berbagai kode INA-CBG asal." : "Melihat distribusi kode dasar INA-CBG terhadap variasi Complexity Level iDRG."}
          colorClass={isReverse ? "bg-orange-50 text-orange-600" : "bg-sky-50 text-sky-600"}
          highlightClass={isReverse ? "bg-orange-500/5" : "bg-sky-500/5"}
          exportAction={() => {
            const headers = isReverse ? ['Kode iDRG', 'Deskripsi iDRG', 'INA-CBG Terkait', 'Jumlah Kasus', 'Avg LOS', 'Max LOS', 'Avg iDRG Tarif'] : ['Kode INA', 'Deskripsi INA', 'iDRG Terpetakan', 'Jumlah Kasus', 'Avg LOS', 'Max LOS', 'Avg INA Tarif'];
            const rows = allKeys.flatMap(key => Object.entries(sourceData[key][isReverse ? 'sources' : 'targets']).map(([targetKey, data]) => [
              key,
              sourceData[key].desc,
              targetKey,
              data.count,
              (data.sumLos / data.count).toFixed(1),
              data.maxLos,
              data.sumIdrg / data.count
            ]));
            exportToXlsx(isReverse ? 'Peta_iDRG_to_INA' : 'Peta_INA_to_iDRG', headers, rows);
          }}
        />

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-2xl w-fit mx-auto shadow-inner border border-slate-200">
          <button
            onClick={() => setPemetaanTab('inaToIdrg')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 ${!isReverse ? 'bg-white text-sky-600 shadow-md scale-105' : 'text-slate-500 hover:bg-white/50'}`}
          >
            <GitMerge size={14} /> INA-CBG → iDRG
          </button>
          <button
            onClick={() => setPemetaanTab('idrgToIna')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 ${isReverse ? 'bg-white text-orange-600 shadow-md scale-105' : 'text-slate-500 hover:bg-white/50'}`}
          >
            <GitMerge size={14} className="rotate-180" /> iDRG → INA-CBG
          </button>
        </div>

        {/* Search / Filter Bar */}
        <div className="flex items-center gap-3 px-1">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="map-filter-input"
              type="text"
              value={mapFilter}
              onChange={e => setMapFilter(e.target.value)}
              placeholder={isReverse ? "Cari kode iDRG atau deskripsi…" : "Cari kode INACBG atau deskripsi…"}
              className="w-full pl-9 pr-9 py-2 text-sm border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition placeholder-slate-400"
            />
            {mapFilter && (
              <button onClick={() => setMapFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                <X size={14} />
              </button>
            )}
          </div>
          <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
            {filteredKeys.length} / {allKeys.length} {isReverse ? 'iDRG' : 'INACBG'}
          </span>
        </div>

        <Card>
          {filteredKeys.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <Search size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-sm">Tidak ada data yang cocok dengan pencarian <span className="text-sky-500">"{mapFilter}"</span></p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                <tr>
                  <th className="p-5 w-1/3 border-r border-slate-200">{isReverse ? "Kode iDRG Dasar" : "Kode INA-CBG Asal"}</th>
                  <th className="p-5">{isReverse ? "Distribusi Hasil ke INA-CBG" : "Distribusi Pemetaan iDRG & Diagnosa Sekunder"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(q ? filteredKeys : filteredKeys.slice(0, 100)).map((key, idx) => (
                  <tr key={`map-${idx}`} className="hover:bg-slate-50 cursor-pointer transition-colors group" onClick={() => openDrilldown(`Kasus ${isReverse ? 'iDRG' : 'INA-CBG'}: ${key}`, r => String(isReverse ? r.IDRG_DRG_CODE : r.INACBG).trim() === key)}>
                    <td className="p-5 align-top border-r border-slate-50">
                      <span className={`font-black block text-base ${isReverse ? 'text-orange-600' : 'text-sky-600'}`}>{String(key)}</span>
                      <span className="text-xs font-medium text-slate-500 mt-1 block leading-relaxed">{String(sourceData[key].desc)}</span>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <span className={`inline-block text-[10px] font-black uppercase text-white px-2 py-0.5 rounded-lg ${isReverse ? 'bg-orange-500' : 'bg-sky-500'}`}>{sourceData[key].totalCases || 0} Kasus</span>
                        <span className="inline-block text-[10px] font-black uppercase text-teal-600 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100">Avg LOS: {(sourceData[key].sumLos / (sourceData[key].totalCases || 1)).toFixed(1)}</span>
                        <span className="inline-block text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">Max LOS: {sourceData[key].maxLos}</span>
                        <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${isReverse ? 'text-orange-700 bg-orange-50 border-orange-100' : 'text-sky-700 bg-sky-50 border-sky-100'}`}>Avg {isReverse ? 'iDRG' : 'INA'}: {formatRp(sourceData[key][isReverse ? 'sumIdrg' : 'sumIna'] / (sourceData[key].totalCases || 1))}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col gap-3">
                        {Object.entries(sourceData[key][isReverse ? 'sources' : 'targets']).sort((a, b) => b[1].count - a[1].count).map(([targetKey, data], j) => (
                          <div key={`target-${j}`} className={`bg-white border p-3 rounded-xl shadow-sm transition-all hover:shadow-md ${isReverse ? 'hover:border-orange-300' : 'hover:border-sky-300'}`}>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className={`${isReverse ? 'bg-sky-600' : 'bg-orange-500'} text-white px-2.5 py-1 rounded-lg text-xs font-black shadow-sm`}>{targetKey.split(' ')[0]}</span>
                              <span className="text-xs font-bold text-slate-700 flex-1">{isReverse ? (data.desc || '-') : targetKey.substring(targetKey.indexOf(' ') + 1)}</span>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${isReverse ? 'text-orange-700 bg-orange-100' : 'text-sky-700 bg-sky-100'}`}>{data.count} Kasus</span>
                                <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-50 px-2 py-1 rounded-md">ALOS: {(data.sumLos / data.count).toFixed(1)}</span>
                                <span className="text-[10px] font-black uppercase text-rose-700 bg-rose-50 px-2 py-1 rounded-md">Max LOS: {data.maxLos}</span>
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border ${isReverse ? 'text-sky-700 bg-sky-50 border-sky-100' : 'text-orange-700 bg-orange-50 border-orange-100'}`}>Avg {isReverse ? 'INA' : 'iDRG'}: {formatRp(data[isReverse ? 'sumIna' : 'sumIdrg'] / data.count)}</span>
                              </div>
                            </div>
                            {!isReverse && (
                              <div className="space-y-3 mt-2">
                                <div className="bg-sky-50 p-2 rounded-lg border border-sky-100"><p className="text-[10px] font-extrabold text-sky-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Layers size={10} /> Diagnosa Utama</p><div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto custom-scrollbar">{Object.entries(data.priDiags).length === 0 ? <span className="text-[10px] text-slate-400 italic">Tanpa data</span> : Object.entries(data.priDiags).sort((a, b) => b[1] - a[1]).slice(0, 10).map((pd, k) => (<span key={`pd-${k}`} className="text-[10px] font-black text-sky-800 bg-white border border-sky-200 px-1.5 py-0.5 rounded shadow-sm hover:bg-sky-50">{pd[0]} <span className="text-sky-400 font-bold ml-0.5">({pd[1]})</span></span>))}</div></div>
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100"><p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Stethoscope size={10} /> Diagnosa Sekunder Penyerta</p><div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto custom-scrollbar">{Object.entries(data.secDiags).length === 0 ? <span className="text-[10px] text-slate-400 italic">Tanpa data</span> : Object.entries(data.secDiags).sort((a, b) => b[1] - a[1]).slice(0, 15).map((sd, k) => (<span key={`sd-${k}`} className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm hover:bg-slate-100">{sd[0]} <span className="text-slate-400 font-semibold ml-0.5">({sd[1]})</span></span>))}</div></div>
                                <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100"><p className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><FileCode size={10} /> Prosedur Terkait</p><div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto custom-scrollbar">{!data.procs || Object.entries(data.procs).length === 0 ? <span className="text-[10px] text-slate-400 italic">Tanpa data</span> : Object.entries(data.procs).sort((a, b) => b[1] - a[1]).slice(0, 10).map((pr, k) => (<span key={`pr-${k}`} className="text-[10px] font-black text-indigo-800 bg-white border border-indigo-200 px-1.5 py-0.5 rounded shadow-sm hover:bg-indigo-50">{pr[0]} <span className="text-indigo-400 font-bold ml-0.5">({pr[1]})</span></span>))}</div></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    );
  };

  const renderKetepatan = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SectionHeader icon={FileCode} title="Akurasi & Ketepatan Koding" desc="Evaluasi discrepancy antara koding INA-CBG dan iDRG menggunakan Fuzzy Logic Match." colorClass="bg-emerald-50 text-emerald-600" highlightClass="bg-emerald-500/5" exportAction={() => exportToXlsx('Data_Ketidaksesuaian_Koding', ['MRN', 'SEP', 'Diag INA', 'Diag iDRG', 'Proc INA', 'Proc iDRG'], dashData.scorecard.discrepancies.map(d => [d.mrn, d.sep, d.diag1.join(", "), d.diag2.join(", "), d.proc1.join(", "), d.proc2.join(", ")]))} exportText="Ekspor Kasus Discrepancy" />
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
            <thead className="bg-white border-b border-slate-200 text-[10px] uppercase font-extrabold tracking-wider text-slate-400 sticky top-0 z-40"><tr><th className="p-4 border-r border-slate-100 w-48">Pasien (MRN / SEP)</th><th className="p-4 border-r border-slate-100 w-[35%]">Komparasi Diagnosa</th><th className="p-4 w-[35%]">Komparasi Prosedur</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {dashData.scorecard.discrepancies.slice(0, 100).map((d, i) => (
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
                          <div className="flex flex-wrap gap-1.5">{d.diag1.map((c, idx) => <span key={`d1-${i}-${idx}`} className={`px-2 py-1 rounded-md text-xs font-bold ${!d.diag2.includes(c) ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-white border border-slate-200 text-slate-600'}`}>{String(c)}</span>)}</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Terinput di iDRG:</span>
                          <div className="flex flex-wrap gap-1.5">{d.diag2.map((c, idx) => <span key={`d2-${i}-${idx}`} className={`px-2 py-1 rounded-md text-xs font-bold ${!d.diag1.includes(c) ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-white border border-slate-200 text-slate-600'}`}>{String(c)}</span>)}</div>
                        </div>
                      </div>
                    ) : <div className="h-full w-full flex items-center justify-center p-4 bg-lime-50/50 rounded-xl border border-lime-100"><span className="text-green-600 font-extrabold flex items-center gap-2"><CheckCircle size={18} /> Sangat Sesuai (100%)</span></div>}
                  </td>
                  <td className="p-4 align-top">
                    {d.scoreProc < 100 ? (
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Terinput di INA-CBG:</span>
                          <div className="flex flex-wrap gap-1.5">{d.proc1.map((c, idx) => <span key={`p1-${i}-${idx}`} className={`px-2 py-1 rounded-md text-xs font-bold ${!d.proc2.includes(c) ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-white border border-slate-200 text-slate-600'}`}>{String(c)}</span>)}</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Terinput di iDRG:</span>
                          <div className="flex flex-wrap gap-1.5">{d.proc2.map((c, idx) => <span key={`p2-${i}-${idx}`} className={`px-2 py-1 rounded-md text-xs font-bold ${!d.proc1.includes(c) ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-white border border-slate-200 text-slate-600'}`}>{String(c)}</span>)}</div>
                        </div>
                      </div>
                    ) : <div className="h-full w-full flex items-center justify-center p-4 bg-lime-50/50 rounded-xl border border-lime-100"><span className="text-green-600 font-extrabold flex items-center gap-2"><CheckCircle size={18} /> Sangat Sesuai (100%)</span></div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderRekap = () => {
    const inaList = (dashData?.inaSummary || []).slice(0, 20);
    const drgList = (dashData?.drgSummary || []).slice(0, 20);
    const allRows = dashData?.rawRows || [];
    const exportAllCases = () => {
      const hdrs = ['No', 'Nama Pasien', 'MRN', 'SEP', 'Tgl Masuk', 'Tgl Pulang', 'LOS', 'DPJP', 'Kode INA', 'Deskripsi INA', 'Kode iDRG', 'Deskripsi iDRG', 'Tarif RS', 'Tarif INA-CBG', 'Tarif iDRG', 'Selisih INA-RS', 'Selisih iDRG-RS', ...compKeys.map(c => c.label)];
      const rws = allRows.map((r, i) => {
        const rs = parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
        const ina = parseFloat(r.TOTAL_TARIF) || 0;
        const idrg = parseFloat(r.IDRG_TOTAL_TARIF) || 0;
        const c18 = extract18(r);
        return [i + 1, String(r.NAMA_PASien || r.NAMA_PASIEN || '-'), String(r.MRN || '-'), String(r.SEP || '-'), r._tglMasuk, String(r.DISCHARGE_DATE || '-'), r._los, String(r.DPJP || '-'), String(r.INACBG || '-'), String(r.DESKRIPSI_INACBG || '-'), String(r.IDRG_DRG_CODE || '-'), String(r.IDRG_DRG_DESCRIPTION || '-'), rs, ina, idrg, ina - rs, idrg - rs, ...compKeys.map(c => c18[c.key])];
      });
      exportToXlsx('Rekap_Seluruh_Kasus', hdrs, rws);
    };
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader icon={Layers} title="Rekap Kode INA-CBG & iDRG" desc={`Seluruh ${allRows.length.toLocaleString()} kasus beserta rincian 18 komponen biaya.`} colorClass="bg-teal-50 text-teal-600" highlightClass="bg-teal-500/5" exportAction={exportAllCases} exportText="Ekspor Semua Kasus (Excel)" />
        {/* === SCATTER INA-CBG (FULL WIDTH) === */}
        <Card className="overflow-visible">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-white flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-xl text-teal-700"><Activity size={18} /></div>
            <div>
              <h3 className="font-extrabold text-slate-800 tracking-tight">Kuadran Kasus INA-CBG</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Distribusi kode INA-CBG berdasarkan Selisih Finansial vs Volume Kasus — klik titik untuk drill-down</p>
            </div>
          </div>
          <div className="p-4">
            <ScatterChart data={dashData.inaSummary} xKey="totalSelisih" yKey="count" rKey="sumIna" color="#0d9488" xLabel="Selisih Finansial (INA-CBG vs RS)" yLabel="Volume Kasus" title="" onDotClick={(d) => openDrilldown(`Scatter INA: ${d.code}`, row => String(row.INACBG).trim() === d.code)} />
          </div>
          {/* Insight Panel INA */}
          {(() => {
            const data = dashData.inaSummary || [];
            if (data.length === 0) return null;
            const avgVol = data.reduce((s, d) => s + d.count, 0) / data.length;
            const q1 = data.filter(d => d.totalSelisih < 0 && d.count >= avgVol);  // Defisit & Vol Tinggi — KRITIS
            const q2 = data.filter(d => d.totalSelisih >= 0 && d.count >= avgVol); // Surplus & Vol Tinggi — OPTIMAL
            const q3 = data.filter(d => d.totalSelisih < 0 && d.count < avgVol);  // Defisit & Vol Rendah — WASPADA
            const q4 = data.filter(d => d.totalSelisih >= 0 && d.count < avgVol); // Surplus & Vol Rendah — MONITOR
            const topQ1 = [...q1].sort((a, b) => a.totalSelisih - b.totalSelisih).slice(0, 3);
            const topQ2 = [...q2].sort((a, b) => b.totalSelisih - a.totalSelisih).slice(0, 3);
            const totalDefisit = data.filter(d => d.totalSelisih < 0).reduce((s, d) => s + d.totalSelisih, 0);
            const totalSurplus = data.filter(d => d.totalSelisih >= 0).reduce((s, d) => s + d.totalSelisih, 0);
            return (
              <div className="px-5 pb-5 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Defisit & Vol Tinggi', count: q1.length, color: 'bg-red-50 border-red-200 text-red-700', badge: 'bg-red-500', icon: '🔴', note: 'Prioritas perbaikan Dokumentasi Klinis Diagnosa Sekunder & koding' },
                    { label: 'Surplus & Vol Tinggi', count: q2.length, color: 'bg-lime-50 border-lime-200 text-lime-700', badge: 'bg-lime-500', icon: '🟢', note: 'Kode unggulan, pertahankan' },
                    { label: 'Defisit & Vol Rendah', count: q3.length, color: 'bg-amber-50 border-amber-200 text-amber-700', badge: 'bg-amber-500', icon: '🟡', note: 'Pantau efisiensi Dokumentasi Klinis Diagnosa Sekunder & koding' },
                    { label: 'Surplus & Vol Rendah', count: q4.length, color: 'bg-teal-50 border-teal-200 text-teal-700', badge: 'bg-teal-500', icon: '🔵', note: 'Potensi pengembangan layanan' },
                  ].map((item, i) => {
                    const qData = [q1, q2, q3, q4][i];
                    const codes = new Set(qData.map(d => d.code));
                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border ${item.color} flex flex-col gap-1 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group`}
                        onClick={() => openDrilldown(`INA-CBG Summary: ${item.label}`, r => codes.has(String(r.INACBG).trim()), 'summary_ina')}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${item.badge} shrink-0`}></span>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider leading-tight">{item.label}</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-2xl font-black">{item.count} <span className="text-xs font-semibold">kode</span></span>
                          <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                        </div>
                        <span className="text-[10px] font-medium opacity-75">{item.note}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topQ1.length > 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                      <p className="text-xs font-extrabold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">⚠️ Kode INA-CBG Berdefisit Tinggi (Perlu Perhatian)</p>
                      <div className="space-y-1.5">
                        {topQ1.map((d, i) => (
                          <div key={i} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-1.5 border border-red-100 cursor-pointer hover:bg-red-50 transition-colors" onClick={() => openDrilldown(`Kasus INA: ${d.code}`, row => String(row.INACBG).trim() === d.code)}>
                            <span className="font-black text-slate-700">{d.code}</span>
                            <span className="text-[10px] text-slate-500 flex-1 mx-2 truncate">{d.desc}</span>
                            <span className="font-black text-red-600 whitespace-nowrap">{formatRp(d.totalSelisih)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {topQ2.length > 0 && (
                    <div className="bg-lime-50 border border-lime-100 rounded-xl p-4">
                      <p className="text-xs font-extrabold text-lime-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">✔ Kode INA-CBG Bersurplus Tinggi (Performa Optimal)</p>
                      <div className="space-y-1.5">
                        {topQ2.map((d, i) => (
                          <div key={i} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-1.5 border border-lime-100 cursor-pointer hover:bg-lime-50 transition-colors" onClick={() => openDrilldown(`Kasus INA: ${d.code}`, row => String(row.INACBG).trim() === d.code)}>
                            <span className="font-black text-slate-700">{d.code}</span>
                            <span className="text-[10px] text-slate-500 flex-1 mx-2 truncate">{d.desc}</span>
                            <span className="font-black text-lime-600 whitespace-nowrap">+{formatRp(d.totalSelisih)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap gap-6 text-xs">
                  <div><span className="text-slate-500 font-semibold">Total Surplus INA-CBG: </span><span className="font-black text-lime-600">+{formatRp(totalSurplus)}</span></div>
                  <div><span className="text-slate-500 font-semibold">Total Defisit INA-CBG: </span><span className="font-black text-red-600">{formatRp(totalDefisit)}</span></div>
                  <div><span className="text-slate-500 font-semibold">Net Posisi: </span><span className={`font-black ${(totalSurplus + totalDefisit) >= 0 ? 'text-lime-600' : 'text-red-600'}`}>{(totalSurplus + totalDefisit) >= 0 ? '+' : ''}{formatRp(totalSurplus + totalDefisit)}</span></div>
                  <div><span className="text-slate-500 font-semibold">Avg Volume/Kode: </span><span className="font-black text-slate-700">{Math.round(avgVol).toLocaleString()} kasus</span></div>
                </div>
              </div>
            );
          })()}
        </Card>

        {/* === SCATTER iDRG (FULL WIDTH) === */}
        <Card className="overflow-visible">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-rose-50 to-white flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-xl text-rose-700"><Activity size={18} /></div>
            <div>
              <h3 className="font-extrabold text-slate-800 tracking-tight">Kuadran Kasus iDRG</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Distribusi kode iDRG berdasarkan Selisih Finansial vs Volume Kasus — klik titik untuk drill-down</p>
            </div>
          </div>
          <div className="p-4">
            <ScatterChart data={dashData.drgSummary} xKey="selisihVsRs" yKey="count" rKey="sumIdrg" color="#e11d48" xLabel="Selisih Finansial (iDRG vs RS)" yLabel="Volume Kasus" title="" onDotClick={(d) => openDrilldown(`Scatter iDRG: ${d.code}`, row => String(row.IDRG_DRG_CODE).trim() === d.code)} />
          </div>
          {/* Insight Panel iDRG */}
          {(() => {
            const data = dashData.drgSummary || [];
            if (data.length === 0) return null;
            const avgVol = data.reduce((s, d) => s + d.count, 0) / data.length;
            const q1 = data.filter(d => d.selisihVsRs < 0 && d.count >= avgVol);
            const q2 = data.filter(d => d.selisihVsRs >= 0 && d.count >= avgVol);
            const q3 = data.filter(d => d.selisihVsRs < 0 && d.count < avgVol);
            const q4 = data.filter(d => d.selisihVsRs >= 0 && d.count < avgVol);
            const topQ1 = [...q1].sort((a, b) => a.selisihVsRs - b.selisihVsRs).slice(0, 3);
            const topQ2 = [...q2].sort((a, b) => b.selisihVsRs - a.selisihVsRs).slice(0, 3);
            const totalDefisit = data.filter(d => d.selisihVsRs < 0).reduce((s, d) => s + d.selisihVsRs, 0);
            const totalSurplus = data.filter(d => d.selisihVsRs >= 0).reduce((s, d) => s + d.selisihVsRs, 0);
            return (
              <div className="px-5 pb-5 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Defisit & Vol Tinggi', count: q1.length, color: 'bg-red-50 border-red-200 text-red-700', badge: 'bg-red-500', icon: '🔴', note: 'CL terlalu rendah, review Dokumentasi Klinis Diagnosa Sekunder & koding' },
                    { label: 'Surplus & Vol Tinggi', count: q2.length, color: 'bg-lime-50 border-lime-200 text-lime-700', badge: 'bg-lime-500', icon: '🟢', note: 'CL optimal, pertahankan' },
                    { label: 'Defisit & Vol Rendah', count: q3.length, color: 'bg-amber-50 border-amber-200 text-amber-700', badge: 'bg-amber-500', icon: '🟡', note: 'Pantau & evaluasi per kasus' },
                    { label: 'Surplus & Vol Rendah', count: q4.length, color: 'bg-sky-50 border-sky-200 text-sky-700', badge: 'bg-sky-500', icon: '🔵', note: 'Efisien, kembangkan layanan' },
                  ].map((item, i) => {
                    const qData = [q1, q2, q3, q4][i];
                    const codes = new Set(qData.map(d => d.code));
                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border ${item.color} flex flex-col gap-1 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group`}
                        onClick={() => openDrilldown(`iDRG Summary: ${item.label}`, r => codes.has(String(r.IDRG_DRG_CODE).trim()), 'summary_idrg')}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${item.badge} shrink-0`}></span>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider leading-tight">{item.label}</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-2xl font-black">{item.count} <span className="text-xs font-semibold">kode</span></span>
                          <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                        </div>
                        <span className="text-[10px] font-medium opacity-75">{item.note}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topQ1.length > 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                      <p className="text-xs font-extrabold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">⚠️ Kode iDRG Berdefisit Tinggi (Review CL)</p>
                      <div className="space-y-1.5">
                        {topQ1.map((d, i) => (
                          <div key={i} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-1.5 border border-red-100 cursor-pointer hover:bg-red-50 transition-colors" onClick={() => openDrilldown(`Kasus iDRG: ${d.code}`, row => String(row.IDRG_DRG_CODE).trim() === d.code)}>
                            <span className="font-black text-slate-700">{d.code}</span>
                            <span className="text-[10px] text-slate-500 flex-1 mx-2 truncate">{d.desc}</span>
                            <span className="font-black text-red-600 whitespace-nowrap">{formatRp(d.selisihVsRs)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {topQ2.length > 0 && (
                    <div className="bg-lime-50 border border-lime-100 rounded-xl p-4">
                      <p className="text-xs font-extrabold text-lime-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">✔ Kode iDRG Bersurplus Tinggi (CL Optimal)</p>
                      <div className="space-y-1.5">
                        {topQ2.map((d, i) => (
                          <div key={i} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-1.5 border border-lime-100 cursor-pointer hover:bg-lime-50 transition-colors" onClick={() => openDrilldown(`Kasus iDRG: ${d.code}`, row => String(row.IDRG_DRG_CODE).trim() === d.code)}>
                            <span className="font-black text-slate-700">{d.code}</span>
                            <span className="text-[10px] text-slate-500 flex-1 mx-2 truncate">{d.desc}</span>
                            <span className="font-black text-lime-600 whitespace-nowrap">+{formatRp(d.selisihVsRs)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap gap-6 text-xs">
                  <div><span className="text-slate-500 font-semibold">Total Surplus iDRG: </span><span className="font-black text-lime-600">+{formatRp(totalSurplus)}</span></div>
                  <div><span className="text-slate-500 font-semibold">Total Defisit iDRG: </span><span className="font-black text-red-600">{formatRp(totalDefisit)}</span></div>
                  <div><span className="text-slate-500 font-semibold">Net Posisi: </span><span className={`font-black ${(totalSurplus + totalDefisit) >= 0 ? 'text-lime-600' : 'text-red-600'}`}>{(totalSurplus + totalDefisit) >= 0 ? '+' : ''}{formatRp(totalSurplus + totalDefisit)}</span></div>
                  <div><span className="text-slate-500 font-semibold">Avg Volume/Kode: </span><span className="font-black text-slate-700">{Math.round(avgVol).toLocaleString()} kasus</span></div>
                </div>
              </div>
            );
          })()}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="flex flex-col">
            <div className="p-4 bg-sky-50 border-b border-sky-100"><h3 className="font-extrabold text-slate-800">Top 20 Kode INA-CBG</h3></div>
            <MiniTable data={inaList} columns={[
              { header: 'No', className: 'text-center', render: (r, i) => i + 1 },
              { header: 'Kode', className: 'font-extrabold text-sky-700', render: r => r?.code || '-' },
              { header: 'Deskripsi', className: 'font-medium', render: r => r?.desc || '-' },
              { header: 'Kasus', className: 'text-right', render: r => (r?.count ?? 0).toLocaleString() },
              { header: 'Avg LOS', className: 'text-center text-sky-600', render: r => (r?.avgLos ?? 0).toFixed(1) },
              { header: 'Max LOS', className: 'text-center text-rose-600 font-semibold', render: r => r?.maxLos ?? 0 },
              { header: 'Avg RS', className: 'text-right', render: r => formatRp((r?.sumRS ?? 0) / (r?.count ?? 1)) },
              { header: 'Selisih (INA-RS)', className: 'text-right font-black', render: r => <span className={(r?.totalSelisih ?? 0) >= 0 ? 'text-lime-600' : 'text-orange-600'}>{formatRp(r?.totalSelisih ?? 0)}</span> }
            ]} onRowClick={r => openDrilldown(`Kasus INA-CBG: ${r.code}`, row => String(row.INACBG).trim() === r.code)} maxHeight="600px" />
          </Card>
          <Card className="flex flex-col">
            <div className="p-4 bg-orange-50 border-b border-orange-100"><h3 className="font-extrabold text-slate-800">Top 20 Kode iDRG</h3></div>
            <MiniTable data={drgList} columns={[
              { header: 'No', className: 'text-center', render: (r, i) => i + 1 },
              { header: 'Kode', className: 'font-extrabold text-orange-700', render: r => r?.code || '-' },
              { header: 'Deskripsi', className: 'font-medium', render: r => r?.desc || '-' },
              { header: 'Kasus', className: 'text-right', render: r => (r?.count ?? 0).toLocaleString() },
              { header: 'Avg LOS', className: 'text-center text-orange-600', render: r => (r?.avgLos ?? 0).toFixed(1) },
              { header: 'Max LOS', className: 'text-center text-rose-600 font-semibold', render: r => r?.maxLos ?? 0 },
              { header: 'Avg RS', className: 'text-right', render: r => formatRp((r?.sumRS ?? 0) / (r?.count ?? 1)) },
              { header: 'Selisih (iDRG-RS)', className: 'text-right font-black', render: r => <span className={(r?.selisihVsRs ?? 0) >= 0 ? 'text-lime-600' : 'text-orange-600'}>{formatRp(r?.selisihVsRs ?? 0)}</span> },
              { header: 'Selisih (iDRG-INA)', className: 'text-right font-black', render: r => <span className={(r?.totalSelisih ?? 0) >= 0 ? 'text-lime-600' : 'text-orange-600'}>{formatRp(r?.totalSelisih ?? 0)}</span> }
            ]} onRowClick={r => openDrilldown(`Kasus iDRG: ${r.code}`, row => String(row.IDRG_DRG_CODE).trim() === r.code)} maxHeight="600px" />
          </Card>
        </div>

        {/* FULL CASE TABLE WITH 18 COMPONENTS */}
        <Card className="overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-sky-600 to-indigo-600 flex justify-between items-center">
            <h3 className="font-extrabold text-white text-sm uppercase tracking-wider">Seluruh Kasus ({allRows.length.toLocaleString()} data)</h3>
            <button onClick={exportAllCases} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"><Download size={14} /> Export Excel</button>
          </div>
          <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-xs text-left whitespace-nowrap">
              <thead className="sticky top-0 z-40">
                <tr>
                  <th colSpan={13} className="px-3 py-2 bg-sky-700 text-white text-[10px] font-extrabold uppercase tracking-widest border-b border-sky-600">Data Pasien & Tarif</th>
                  <th colSpan={18} className="px-3 py-2 bg-slate-800 text-white text-[10px] font-extrabold uppercase tracking-widest text-center border-b border-slate-700">Rincian 18 Komponen Biaya</th>
                </tr>
                <tr className="bg-sky-50 text-[9px] uppercase font-extrabold tracking-wider text-sky-700">
                  <th className="px-2 py-2 border-r border-sky-100 sticky left-0 bg-sky-50 z-20 w-8 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">No</th>
                  <th className="px-2 py-2 border-r border-sky-100 min-w-[130px] sticky left-8 bg-sky-50 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">Nama Pasien</th>
                  <th className="px-2 py-2 border-r border-sky-100 w-20">MRN</th>
                  <th className="px-2 py-2 border-r border-sky-100 w-20">SEP</th>
                  <th className="px-2 py-2 border-r border-sky-100 w-20">Tgl Masuk</th>
                  <th className="px-2 py-2 border-r border-sky-100 w-20">Tgl Pulang</th>
                  <th className="px-2 py-2 border-r border-sky-100 w-12 text-center">LOS</th>
                  <th className="px-2 py-2 border-r border-sky-100 min-w-[100px]">Kode INA</th>
                  <th className="px-2 py-2 border-r border-sky-100 min-w-[80px]">Kode iDRG</th>
                  <th className="px-2 py-2 border-r border-sky-100 text-right">Tarif RS</th>
                  <th className="px-2 py-2 border-r border-sky-100 text-right text-sky-700">Tarif INA</th>
                  <th className="px-2 py-2 border-r border-sky-100 text-right text-orange-700">Tarif iDRG</th>
                  <th className="px-2 py-2 border-r border-slate-300 text-right">Sel. INA-RS</th>
                  {compKeys.map(c => <th key={c.key} className="px-2 py-2 border-r border-slate-200 text-right bg-slate-100 text-slate-600 min-w-[80px]">{c.label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allRows.slice(0, 500).map((r, i) => {
                  const rs = parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
                  const ina = parseFloat(r.TOTAL_TARIF) || 0;
                  const idrg = parseFloat(r.IDRG_TOTAL_TARIF) || 0;
                  const sel = ina - rs;
                  const c18 = extract18(r);
                  const patientName = String(r.NAMA_PASien || r.NAMA_PASIEN || '-');
                  const displayName = patientName !== '-' ? patientName.split(' ').filter(w => w.length > 0).map(w => w.charAt(0) + '***').join(' ') : patientName;
                  return (
                    <tr
                      key={i}
                      className="hover:bg-sky-50/30 transition-colors cursor-pointer animate-in fade-in slide-in-from-bottom-1 duration-300"
                      style={{ animationDelay: `${Math.min(i * 15, 500)}ms`, animationFillMode: 'both' }}
                      onClick={() => openDrilldown(`Pasien: ${patientName}`, row => String(row.SEP) === String(r.SEP))}
                    >
                      <td className="px-2 py-1.5 border-r border-slate-50 text-center text-slate-400 sticky left-0 bg-white z-[5] shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{i + 1}</td>
                      <td className="px-2 py-1.5 border-r border-slate-50 font-semibold text-slate-800 truncate max-w-[150px] sticky left-8 bg-white z-[5] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">{displayName}</td>
                      <td className="px-2 py-1.5 border-r border-slate-50 text-slate-600">{r.MRN || '-'}</td>
                      <td className="px-2 py-1.5 border-r border-slate-50 font-mono text-[10px] text-slate-500">{r.SEP || '-'}</td>
                      <td className="px-2 py-1.5 border-r border-slate-50 text-slate-500">{r._tglMasuk || '-'}</td>
                      <td className="px-2 py-1.5 border-r border-slate-50 text-slate-500">{r.DISCHARGE_DATE || '-'}</td>
                      <td className="px-2 py-1.5 border-r border-slate-50 text-center font-semibold text-slate-600">{r._los || 0}</td>
                      <td className="px-2 py-1.5 border-r border-slate-50 font-bold text-sky-700">{r.INACBG || '-'}</td>
                      <td className="px-2 py-1.5 border-r border-slate-50 font-bold text-orange-700">{r.IDRG_DRG_CODE || '-'}</td>
                      <td className="px-2 py-1.5 border-r border-slate-50 text-right font-semibold">{formatRpEx(rs)}</td>
                      <td className="px-2 py-1.5 border-r border-slate-50 text-right text-sky-600 font-semibold">{formatRpEx(ina)}</td>
                      <td className="px-2 py-1.5 border-r border-slate-50 text-right text-orange-600 font-semibold">{formatRpEx(idrg)}</td>
                      <td className="px-2 py-1.5 border-r border-slate-200 text-right font-black"><span className={sel >= 0 ? 'text-lime-600' : 'text-orange-600'}>{sel > 0 ? '+' : ''}{formatRpEx(sel)}</span></td>
                      {compKeys.map(c => <td key={`c-${i}-${c.key}`} className="px-2 py-1.5 border-r border-slate-50 text-right text-[10px] text-slate-400">{formatRpEx(c18[c.key])}</td>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {allRows.length > 500 && <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 border-t">Menampilkan 500 dari {allRows.length.toLocaleString()} kasus. Klik "Ekspor Semua Kasus" untuk data lengkap.</div>}
        </Card>
      </div>
    );
  };



  const renderKsm = () => {
    const ksmData = (dashData?.ksmEfficiencyTree || []).sort((a, b) => b.count - a.count);
    const deptData = (dashData?.deptSummaryArray || []).sort((a, b) => b.count - a.count);

    // Calculate Hospital Averages for Comparison
    const totalK = ksmData.reduce((s, d) => s + d.count, 0) || 1;
    const hSumRS = ksmData.reduce((s, d) => s + d.sumRS, 0);
    const hSumIna = ksmData.reduce((s, d) => s + d.sumIna, 0);
    const hSumIdrg = ksmData.reduce((s, d) => s + d.sumIdrg, 0);
    const hSumLos = ksmData.reduce((s, d) => s + d.sumLos, 0);
    const hMaxLos = Math.max(...ksmData.map(d => d.maxLos), 0);
    const hAvgRS = hSumRS / totalK;
    const hAvgLos = hSumLos / totalK;
    const hAvgSelIna = (hSumIna - hSumRS) / totalK;
    const hAvgSelIdrg = (hSumIdrg - hSumRS) / totalK;
    const hAvgIdrgIna = (hSumIdrg - hSumIna) / totalK;
    const hAvgComps = compKeys.reduce((acc, c) => {
      acc[c.key] = ksmData.reduce((s, d) => s + (d.comps?.[c.key] || 0), 0) / totalK;
      return acc;
    }, {});

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader icon={Users} title="Kinerja Departemen & KSM (Kelompok Staf Medis)" desc="Analisis efisiensi biaya per Departemen dan KSM." colorClass="bg-indigo-50 text-indigo-600" highlightClass="bg-indigo-500/5" exportAction={() => {
          const csv = ksmData.map(s => [s.dept, s.name, s.count, s.sumRS, s.sumIna, s.sumIdrg, s.selisihIna, s.selisihIdrg, s.sumIdrg - s.sumIna, ...compKeys.map(c => s.comps?.[c.key] || 0)]);
          exportToXlsx('Kinerja_KSM', ['Departemen', 'Nama KSM', 'Jumlah Kasus', 'Total RS', 'Total INA', 'Total iDRG', 'Selisih INA-RS', 'Selisih iDRG-RS', 'Selisih iDRG-INA', ...compKeys.map(c => c.label)], csv);
        }} />

        {/* DEPT BAR CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            { title: 'Top 10 Departemen — Selisih INA-RS', data: [...deptData].sort((a, b) => b.selisihIna - a.selisihIna).slice(0, 10), key: 'selisihIna', color: '#0ea5e9', negColor: '#f97316' },
            { title: 'Top 10 Departemen — Selisih iDRG-RS', data: [...deptData].sort((a, b) => b.selisihIdrg - a.selisihIdrg).slice(0, 10), key: 'selisihIdrg', color: '#8b5cf6', negColor: '#ef4444' },
          ].map((chart, ci) => {
            const maxVal = Math.max(...chart.data.map(d => Math.abs(d[chart.key])), 1);
            return (
              <Card key={ci} id={`dept-bar-${ci}`} downloadTitle={chart.title} className="p-5">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-indigo-500" /> {chart.title}</h3>
                <div className="space-y-2">
                  {chart.data.map((s, si) => {
                    const val = s[chart.key]; const pct = (Math.abs(val) / maxVal) * 100;
                    return (
                      <div key={si} className="flex items-center gap-3 group cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded-lg transition-colors"
                        onClick={() => openDrilldown(`Kasus Dept: ${s.name}`, row => getDept(extractKsm(row['DPJP'] || ''), row['DPJP'] || '') === s.name)}>
                        <span className="text-xs font-bold text-slate-600 w-28 truncate shrink-0" title={s.name}>{s.name}</span>
                        <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden relative">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: val >= 0 ? chart.color : chart.negColor }}></div>
                        </div>
                        <span className={`text-xs font-black w-24 text-right shrink-0 ${val >= 0 ? 'text-lime-600' : 'text-orange-600'}`}>{val > 0 ? '+' : ''}{formatRp(val)}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="overflow-hidden border border-slate-200 mt-6">
          <div className="overflow-x-auto max-h-[800px] custom-scrollbar">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-wider sticky top-0 z-40">
                <tr>
                  <th colSpan={6} className="px-4 py-3 bg-slate-900 text-white border-b border-slate-700">Ringkasan Finansial</th>
                  <th colSpan={18} className="px-4 py-3 bg-slate-800 text-white text-center border-b border-slate-700">Rincian 18 Komponen Biaya</th>
                </tr>
                <tr>
                  <th className="p-4 min-w-[280px] bg-slate-900 sticky left-0 z-50">Hierarki Departemen / KSM / DPJP</th>
                  <th className="p-4 text-right bg-slate-900 w-20">Kasus</th>
                  <th className="p-4 text-center bg-teal-900 text-teal-300 w-20 text-[9px]">ALOS</th>
                  <th className="p-4 text-center bg-rose-900 text-rose-300 w-20 text-[9px]">MAX LOS</th>
                  <th className="p-4 text-right bg-slate-900 min-w-[120px]">Avg RS</th>
                  <th className="p-4 text-right bg-sky-900/50 min-w-[120px]">Sel. INA</th>
                  <th className="p-4 text-right bg-indigo-900/50 min-w-[120px]">Sel. iDRG</th>
                  <th className="p-4 text-right bg-purple-900/50 min-w-[120px]">iDRG vs INA</th>
                  {compKeys.map(c => <th key={c.key} className="p-4 text-right bg-slate-800 text-slate-400 min-w-[100px]">{c.label}</th>)}
                </tr>
                {/* RATA-RATA RS SUMMARY ROW (Now in thead for perfect sticky behavior) */}
                <tr className="bg-amber-50 font-black border-b-2 border-amber-200 shadow-sm">
                  <td className="p-4 bg-amber-50 sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-amber-500 text-white flex items-center justify-center"><Zap size={12} /></div>
                      <span className="text-amber-800 uppercase text-[10px] tracking-widest font-black whitespace-nowrap">RATA-RATA RS (Seluruh Kasus)</span>
                    </div>
                  </td>
                  <td className="p-4 text-right text-amber-700 text-xs font-black italic">AVG</td>
                  <td className="p-4 text-center text-amber-600 font-bold text-xs bg-amber-100/20">{hAvgLos.toFixed(1)}</td>
                  <td className="p-4 text-center text-rose-600 font-bold text-xs bg-rose-100/20">{hMaxLos}</td>
                  <td className="p-4 text-right text-amber-700 text-xs font-black">{formatRp(hAvgRS)}</td>
                  <td className={`p-4 text-right font-black text-xs ${hAvgSelIna >= 0 ? 'text-lime-700' : 'text-orange-700'}`}>{formatRp(hAvgSelIna)}</td>
                  <td className={`p-4 text-right font-black text-xs ${hAvgSelIdrg >= 0 ? 'text-lime-700' : 'text-orange-700'}`}>{formatRp(hAvgSelIdrg)}</td>
                  <td className="p-4 text-right font-black text-xs text-purple-700">{formatRp(hAvgIdrgIna)}</td>
                  {compKeys.map(c => <td key={c.key} className="p-4 text-right text-[10px] font-black text-amber-600 bg-amber-100/30">{formatRpEx(hAvgComps[c.key])}</td>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">

                {deptData.map((dept, di) => {
                  const deptKsms = ksmData.filter(k => k.dept === dept.name);
                  const isDeptOpen = openKsm === `dept-${di}`;

                  // Calculate Department Averages
                  const dAvgRS = dept.sumRS / (dept.count || 1);
                  const dAvgSelIna = (dept.sumIna - dept.sumRS) / (dept.count || 1);
                  const dAvgSelIdrg = (dept.sumIdrg - dept.sumRS) / (dept.count || 1);
                  const dAvgIdrgIna = (dept.sumIdrg - dept.sumIna) / (dept.count || 1);
                  const dAvgComps = compKeys.reduce((acc, c) => {
                    acc[c.key] = (dept.comps?.[c.key] || 0) / (dept.count || 1);
                    return acc;
                  }, {});

                  return (
                    <React.Fragment key={`dept-frag-${di}`}>
                      {/* DEPARTMENT SUMMARY ROW */}
                      <tr className="bg-slate-100/80 font-black border-y border-slate-200">
                        <td className="p-4 sticky left-0 z-20 bg-slate-100/90 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setOpenKsm(isDeptOpen ? null : `dept-${di}`)}>
                            <span className={`w-5 h-5 rounded flex items-center justify-center transition-transform ${isDeptOpen ? 'rotate-90 bg-slate-800 text-white' : 'bg-slate-300 text-slate-700'}`}>▶</span>
                            <span className="uppercase text-slate-800 tracking-tight">{dept.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-black">{dept.count.toLocaleString()}</td>
                        <td className="p-4 text-center text-teal-700 font-bold text-xs bg-teal-50/30">{(dept.sumLos / (dept.count || 1)).toFixed(1)}</td>
                        <td className="p-4 text-center text-rose-700 font-bold text-xs bg-rose-50/30">{dept.maxLos}</td>
                        <td className="p-4 text-right text-slate-600">{formatRp(dAvgRS)}</td>
                        <td className={`p-4 text-right font-black ${dAvgSelIna >= 0 ? 'text-lime-700' : 'text-orange-700'}`}>{formatRp(dAvgSelIna)}</td>
                        <td className={`p-4 text-right font-black ${dAvgSelIdrg >= 0 ? 'text-lime-700' : 'text-orange-700'}`}>{formatRp(dAvgSelIdrg)}</td>
                        <td className="p-4 text-right font-black text-purple-700">{formatRp(dAvgIdrgIna)}</td>
                        {compKeys.map(c => <td key={c.key} className="p-4 text-right text-[10px] font-bold text-slate-500 bg-slate-200/50">{formatRpEx(dAvgComps[c.key])}</td>)}
                      </tr>
                      {isDeptOpen && deptKsms.map((ksm, ki) => {
                        const isKsmOpen = expandedKsms[ksm.name];
                        return (
                          <React.Fragment key={`ksm-${di}-${ki}`}>
                            <tr
                              className="bg-white hover:bg-indigo-50/50 cursor-pointer transition-colors group animate-in fade-in slide-in-from-bottom-1 duration-300"
                              style={{ animationDelay: `${ki * 40}ms`, animationFillMode: 'both' }}
                              onClick={() => setExpandedKsms(prev => ({ ...prev, [ksm.name]: !isKsmOpen }))}
                            >
                              <td className="p-4 pl-10 border-l-4 border-indigo-500 sticky left-0 z-20 bg-white shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                <div className="flex items-center gap-2">
                                  <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] transition-transform ${isKsmOpen ? 'rotate-90 bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>▶</span>
                                  <span className="font-bold text-indigo-700">{ksm.name}</span>
                                </div>
                              </td>
                              <td className="p-4 text-right font-bold text-slate-700">{ksm.count.toLocaleString()}</td>
                              <td className="p-4 text-center text-teal-600 font-bold text-xs bg-teal-50/20">{(ksm.sumLos / ksm.count).toFixed(1)}</td>
                              <td className="p-4 text-center text-rose-600 font-bold text-xs bg-rose-50/20">{ksm.maxLos}</td>
                              <td className="p-4 text-right text-slate-500 text-xs">{formatRp(ksm.sumRS / ksm.count)}</td>
                              <td className={`p-4 text-right font-bold ${ksm.selisihIna >= 0 ? 'text-lime-600' : 'text-orange-600'}`}>{formatRp(ksm.selisihIna / ksm.count)}</td>
                              <td className={`p-4 text-right font-bold ${ksm.selisihIdrg >= 0 ? 'text-lime-600' : 'text-orange-600'}`}>{formatRp(ksm.selisihIdrg / ksm.count)}</td>
                              <td className="p-4 text-right font-bold text-purple-600">{formatRp((ksm.sumIdrg - ksm.sumIna) / ksm.count)}</td>
                              {compKeys.map(c => <td key={c.key} className="p-4 text-right text-[11px] font-semibold text-indigo-400 bg-indigo-50/30">{formatRpEx((ksm.comps?.[c.key] || 0) / ksm.count)}</td>)}
                            </tr>
                            {isKsmOpen && ksm.dpjps.map((dpjp, pi) => (
                              <tr
                                key={`dpjp-${di}-${ki}-${pi}`}
                                className="bg-slate-50/30 text-xs text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer animate-in fade-in slide-in-from-bottom-1 duration-300"
                                style={{ animationDelay: `${pi * 30}ms`, animationFillMode: 'both' }}
                                onClick={() => openDrilldown(`Kasus DPJP: ${dpjp.name}`, row => normDpjp(row['DPJP']) === dpjp.normName)}
                              >
                                <td className="p-3 pl-20 italic flex items-center gap-2 sticky left-0 z-20 bg-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                  <User size={12} className="text-slate-400" /> {dpjp.name}
                                </td>
                                <td className="p-3 text-right">{dpjp.count.toLocaleString()}</td>
                                <td className="p-3 text-center text-teal-600 text-[10px]">{(dpjp.sumLos / dpjp.count).toFixed(1)}</td>
                                <td className="p-3 text-center text-rose-600 text-[10px]">{dpjp.maxLos}</td>
                                <td className="p-3 text-right opacity-60 text-[10px]">{formatRp(dpjp.sumRS / dpjp.count)}</td>
                                <td className={`p-3 text-right font-medium text-[10px] ${dpjp.sumIna - dpjp.sumRS >= 0 ? 'text-lime-600' : 'text-orange-600'}`}>{formatRp((dpjp.sumIna - dpjp.sumRS) / dpjp.count)}</td>
                                <td className={`p-3 text-right font-medium text-[10px] ${dpjp.sumIdrg - dpjp.sumRS >= 0 ? 'text-lime-600' : 'text-orange-600'}`}>{formatRp((dpjp.sumIdrg - dpjp.sumRS) / dpjp.count)}</td>
                                <td className="p-3 text-right font-medium text-purple-600 text-[10px]">{formatRp((dpjp.sumIdrg - dpjp.sumIna) / dpjp.count)}</td>
                                {compKeys.map(c => <td key={c.key} className="p-3 text-right text-[10px] text-slate-400">{formatRpEx((dpjp.comps?.[c.key] || 0) / dpjp.count)}</td>)}
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const renderDpjp = () => {
    const data = dashData?.dpjpSummaryArray || [];

    // Calculate Hospital Averages for Comparison
    const totalK = data.reduce((s, d) => s + d.count, 0) || 1;
    const hSumRS = data.reduce((s, d) => s + d.sumRS, 0);
    const hSumIna = data.reduce((s, d) => s + d.sumIna, 0);
    const hSumIdrg = data.reduce((s, d) => s + d.sumIdrg, 0);
    const hSumLos = data.reduce((s, d) => s + d.sumLos, 0);
    const hMaxLos = Math.max(...data.map(d => d.maxLos), 0);

    const hAvgRS = hSumRS / totalK;
    const hAvgIna = hSumIna / totalK;
    const hAvgIdrg = hSumIdrg / totalK;
    const hAvgSelIna = (hSumIna - hSumRS) / totalK;
    const hAvgSelIdrg = (hSumIdrg - hSumRS) / totalK;
    const hAvgIdrgIna = (hSumIdrg - hSumIna) / totalK;
    const hAvgLos = hSumLos / totalK;

    const hAvgComps = compKeys.reduce((acc, c) => {
      acc[c.key] = data.reduce((s, d) => s + (d.comps?.[c.key] || 0), 0) / totalK;
      return acc;
    }, {});

    const top10Kasus = [...data].slice(0, 10);
    const top10SelIna = [...data].map(d => ({ ...d, selIna: d.sumIna - d.sumRS })).sort((a, b) => b.selIna - a.selIna).slice(0, 10);
    const top10SelIdrg = [...data].map(d => ({ ...d, selIdrg: d.sumIdrg - d.sumRS })).sort((a, b) => b.selIdrg - a.selIdrg).slice(0, 10);
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader icon={User} title="Kinerja DPJP (Dokter Penanggung Jawab Pelayanan)" desc="Produktivitas dan selisih finansial per DPJP." colorClass="bg-teal-50 text-teal-600" highlightClass="bg-teal-500/5" exportAction={() => {
          const csv = data.map(d => [d.name, d.count, d.sumRS, d.sumIna, d.sumIdrg, d.sumIna - d.sumRS, d.sumIdrg - d.sumRS, d.sumIdrg - d.sumIna, ...compKeys.map(c => d.comps?.[c.key] || 0)]);
          exportToXlsx('Kinerja_DPJP', ['Nama DPJP', 'Jumlah Kasus', 'Total RS', 'Total INA', 'Total iDRG', 'Selisih INA-RS', 'Selisih iDRG-RS', 'Selisih iDRG-INA', ...compKeys.map(c => c.label)], csv);
        }} />

        {/* DPJP Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all" onClick={() => openDrilldown('Seluruh Kasus', () => true)}>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Total DPJP</p>
            <p className="text-2xl font-black text-teal-700">{data.length}</p>
          </Card>
          <Card className="p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all" onClick={() => openDrilldown(`DPJP Terbanyak: ${top10Kasus[0]?.name}`, r => normDpjp(r['DPJP']) === top10Kasus[0]?.normName)}>
            <p className="text-[10px] font-bold text-slate-400 uppercase">DPJP Terbanyak</p>
            <p className="text-sm font-black text-slate-800 truncate">{top10Kasus[0]?.name || '-'}</p>
            <p className="text-xs text-teal-600 font-bold">{top10Kasus[0]?.count?.toLocaleString() || 0} kasus</p>
          </Card>
          <Card className="p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all" onClick={() => openDrilldown(`Top Surplus INA: ${top10SelIna[0]?.name}`, r => normDpjp(r['DPJP']) === top10SelIna[0]?.normName)}>
            <p className="text-[10px] font-bold text-lime-500 uppercase">Surplus INA-RS Tertinggi</p>
            <p className="text-sm font-black text-slate-800 truncate">{top10SelIna[0]?.name || '-'}</p>
            <p className="text-xs text-lime-600 font-bold">+{formatRp(top10SelIna[0]?.selIna || 0)}</p>
          </Card>
          <Card className="p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all" onClick={() => openDrilldown(`Top Surplus iDRG: ${top10SelIdrg[0]?.name}`, r => normDpjp(r['DPJP']) === top10SelIdrg[0]?.normName)}>
            <p className="text-[10px] font-bold text-purple-500 uppercase">Surplus iDRG-RS Tertinggi</p>
            <p className="text-sm font-black text-slate-800 truncate">{top10SelIdrg[0]?.name || '-'}</p>
            <p className="text-xs text-purple-600 font-bold">+{formatRp(top10SelIdrg[0]?.selIdrg || 0)}</p>
          </Card>
        </div>

        {/* DPJP BAR CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            { title: 'Top 10 DPJP — Volume Kasus', items: top10Kasus, getVal: d => d.count, color: '#14b8a6', unit: ' kasus' },
            { title: 'Top 10 DPJP — Selisih INA-RS', items: top10SelIna, getVal: d => d.selIna, color: '#0ea5e9', negColor: '#f97316', isCurrency: true },
          ].map((chart, ci) => {
            const maxVal = Math.max(...chart.items.map(d => Math.abs(chart.getVal(d))), 1);
            return (
              <Card key={ci} id={`dpjp-bar-${ci}`} downloadTitle={chart.title} className="p-5">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-teal-500" /> {chart.title}</h3>
                <div className="space-y-2">
                  {chart.items.map((d, di) => {
                    const val = chart.getVal(d); const pct = (Math.abs(val) / maxVal) * 100;
                    return (
                      <div key={di} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded-lg transition-colors"
                        onClick={() => openDrilldown(`Kasus DPJP: ${d.name}`, row => normDpjp(row['DPJP']) === d.normName)}>
                        <span className="text-[11px] font-bold text-slate-600 w-32 truncate shrink-0" title={d.name}>{d.name}</span>
                        <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: val >= 0 ? (chart.color || '#14b8a6') : (chart.negColor || '#f97316') }}></div>
                        </div>
                        <span className={`text-xs font-black w-24 text-right shrink-0 ${chart.isCurrency ? (val >= 0 ? 'text-lime-600' : 'text-orange-600') : 'text-teal-700'}`}>
                          {chart.isCurrency ? ((val > 0 ? '+' : '') + formatRp(val)) : val.toLocaleString() + (chart.unit || '')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>

        {/* DPJP TABLE WITH 18 COMPONENT BREAKDOWN */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto max-h-[700px] custom-scrollbar">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="sticky top-0 z-40">
                <tr>
                  <th colSpan={10} className="px-4 py-3 bg-teal-600 text-white font-extrabold text-xs uppercase tracking-widest border-b border-teal-500">Ringkasan Finansial DPJP</th>
                  <th colSpan={18} className="px-4 py-3 bg-slate-800 text-white font-extrabold text-xs uppercase tracking-widest text-center border-b border-slate-700">Rincian 18 Komponen Biaya RS</th>
                </tr>
                <tr className="bg-teal-50 text-[10px] uppercase font-extrabold tracking-wider text-teal-700">
                  <th className="px-3 py-2.5 border-r border-teal-100 sticky left-0 bg-teal-50 z-50 min-w-[180px]">Nama DPJP</th>
                  <th className="px-3 py-2.5 border-r border-teal-100 text-right w-16">Kasus</th>
                  <th className="px-3 py-2.5 border-r border-teal-100 text-center">Avg LOS</th>
                  <th className="px-3 py-2.5 border-r border-teal-100 text-center">Max LOS</th>
                  <th className="px-3 py-2.5 border-r border-teal-100 text-right">Total RS</th>
                  <th className="px-3 py-2.5 border-r border-teal-100 text-right">Total INA</th>
                  <th className="px-3 py-2.5 border-r border-teal-100 text-right">Total iDRG</th>
                  <th className="px-3 py-2.5 border-r border-sky-200 text-right bg-sky-50 text-sky-700">Sel. INA-RS</th>
                  <th className="px-3 py-2.5 border-r border-orange-200 text-right bg-orange-50 text-orange-700">Sel. iDRG-RS</th>
                  <th className="px-3 py-2.5 border-r border-slate-300 text-right bg-purple-50 text-purple-700">Sel. iDRG-INA</th>
                  {compKeys.map(c => <th key={c.key} className="px-3 py-2.5 border-r border-slate-200 text-right bg-slate-100 text-slate-600 min-w-[90px]">{c.label}</th>)}
                </tr>
                {/* RATA-RATA RS SUMMARY ROW */}
                <tr className="bg-amber-50 font-black border-b-2 border-amber-200 shadow-sm">
                  <td className="px-3 py-3 border-r border-amber-200 font-extrabold text-amber-800 sticky left-0 bg-amber-50 z-20 text-[10px] flex items-center gap-2">
                    <Zap size={14} className="text-amber-500" /> RATA-RATA RS
                  </td>
                  <td className="px-3 py-3 border-r border-amber-100 text-right text-amber-700 text-xs font-black">1</td>
                  <td className="px-3 py-3 border-r border-amber-100 text-center text-amber-600 font-bold text-xs">{hAvgLos.toFixed(1)}</td>
                  <td className="px-3 py-3 border-r border-amber-100 text-center text-rose-600 font-bold text-xs">{hMaxLos}</td>
                  <td className="px-3 py-3 border-r border-amber-100 text-right text-amber-600 text-xs font-black">{formatRp(hAvgRS)}</td>
                  <td className="px-3 py-3 border-r border-amber-100 text-right text-sky-700 font-semibold text-xs">{formatRp(hAvgIna)}</td>
                  <td className="px-3 py-3 border-r border-amber-100 text-right text-orange-700 font-semibold text-xs">{formatRp(hAvgIdrg)}</td>
                  <td className="px-3 py-3 border-r border-sky-100 text-right font-black text-xs bg-sky-50/20">
                    <span className={hAvgSelIna >= 0 ? 'text-lime-600' : 'text-orange-600'}>{hAvgSelIna > 0 ? '+' : ''}{formatRp(hAvgSelIna)}</span>
                  </td>
                  <td className="px-3 py-3 border-r border-orange-100 text-right font-black text-xs bg-orange-50/20">
                    <span className={hAvgSelIdrg >= 0 ? 'text-lime-600' : 'text-orange-600'}>{hAvgSelIdrg > 0 ? '+' : ''}{formatRp(hAvgSelIdrg)}</span>
                  </td>
                  <td className="px-3 py-3 border-r border-slate-200 text-right font-black text-xs bg-purple-50/20">
                    <span className={hAvgIdrgIna >= 0 ? 'text-purple-600' : 'text-rose-600'}>{hAvgIdrgIna > 0 ? '+' : ''}{formatRp(hAvgIdrgIna)}</span>
                  </td>
                  {compKeys.map(c => (
                    <td key={`h-tot-${c.key}`} className="px-3 py-3 border-r border-amber-50 text-right text-[11px] font-black text-amber-600 bg-amber-100/30">{formatRpEx(hAvgComps[c.key])}</td>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((dpjp, i) => {
                  const selIna = dpjp.sumIna - dpjp.sumRS;
                  const selIdrg = dpjp.sumIdrg - dpjp.sumRS;
                  const selIdrgIna = dpjp.sumIdrg - dpjp.sumIna;
                  return (
                    <tr key={i} className="hover:bg-teal-50/30 cursor-pointer transition-colors"
                      onClick={() => openDrilldown(`Semua Kasus DPJP: ${dpjp.name}`, row => normDpjp(row['DPJP']) === dpjp.normName)}>
                      <td className="px-3 py-3 border-r border-slate-100 font-extrabold text-slate-800 sticky left-0 bg-white z-[5] text-xs">{dpjp.name}</td>
                      <td className="px-3 py-3 border-r border-slate-100 text-right font-bold text-slate-700">{dpjp.count.toLocaleString()}</td>
                      <td className="px-3 py-3 border-r border-slate-100 text-center text-teal-600 font-bold text-xs">{dpjp.count > 0 ? (dpjp.sumLos / dpjp.count).toFixed(1) : 0}</td>
                      <td className="px-3 py-3 border-r border-slate-100 text-center text-rose-600 font-bold text-xs">{dpjp.maxLos || 0}</td>
                      <td className="px-3 py-3 border-r border-slate-100 text-right text-slate-600 text-xs">{formatRp(dpjp.sumRS)}</td>
                      <td className="px-3 py-3 border-r border-slate-100 text-right text-sky-700 font-semibold text-xs">{formatRp(dpjp.sumIna)}</td>
                      <td className="px-3 py-3 border-r border-slate-100 text-right text-orange-700 font-semibold text-xs">{formatRp(dpjp.sumIdrg)}</td>
                      <td className="px-3 py-3 border-r border-sky-100 text-right font-black text-xs bg-sky-50/20">
                        <span className={selIna >= 0 ? 'text-lime-600' : 'text-orange-600'}>{selIna > 0 ? '+' : ''}{formatRp(selIna)}</span>
                      </td>
                      <td className="px-3 py-3 border-r border-orange-100 text-right font-black text-xs bg-orange-50/20">
                        <span className={selIdrg >= 0 ? 'text-lime-600' : 'text-orange-600'}>{selIdrg > 0 ? '+' : ''}{formatRp(selIdrg)}</span>
                      </td>
                      <td className="px-3 py-3 border-r border-slate-200 text-right font-black text-xs bg-purple-50/20">
                        <span className={selIdrgIna >= 0 ? 'text-purple-600' : 'text-rose-600'}>{selIdrgIna > 0 ? '+' : ''}{formatRp(selIdrgIna)}</span>
                      </td>
                      {compKeys.map(c => (
                        <td key={`${i}-${c.key}`} className="px-3 py-3 border-r border-slate-50 text-right text-[11px] font-semibold text-slate-500">{formatRpEx(dpjp.comps?.[c.key])}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-teal-50 border-t-2 border-teal-300 font-black">
                  <td className="px-3 py-3 border-r border-teal-200 sticky left-0 bg-teal-50 z-[5] text-teal-800 text-xs uppercase">Grand Total</td>
                  <td className="px-3 py-3 border-r border-teal-200 text-right text-teal-800">{data.reduce((s, d) => s + d.count, 0).toLocaleString()}</td>
                  <td className="px-3 py-3 border-r border-teal-200 text-right text-xs">{formatRp(data.reduce((s, d) => s + d.sumRS, 0))}</td>
                  <td className="px-3 py-3 border-r border-teal-200 text-right text-xs text-sky-700">{formatRp(data.reduce((s, d) => s + d.sumIna, 0))}</td>
                  <td className="px-3 py-3 border-r border-teal-200 text-right text-xs text-orange-700">{formatRp(data.reduce((s, d) => s + d.sumIdrg, 0))}</td>
                  <td className="px-3 py-3 border-r border-teal-200 text-right text-xs">{(() => { const v = data.reduce((s, d) => s + d.sumIna - d.sumRS, 0); return <span className={v >= 0 ? 'text-lime-600' : 'text-orange-600'}>{v > 0 ? '+' : ''}{formatRp(v)}</span>; })()}</td>
                  <td className="px-3 py-3 border-r border-teal-200 text-right text-xs">{(() => { const v = data.reduce((s, d) => s + d.sumIdrg - d.sumRS, 0); return <span className={v >= 0 ? 'text-lime-600' : 'text-orange-600'}>{v > 0 ? '+' : ''}{formatRp(v)}</span>; })()}</td>
                  <td className="px-3 py-3 border-r border-teal-200 text-right text-xs">{(() => { const v = data.reduce((s, d) => s + d.sumIdrg - d.sumIna, 0); return <span className={v >= 0 ? 'text-purple-600' : 'text-rose-600'}>{v > 0 ? '+' : ''}{formatRp(v)}</span>; })()}</td>
                  {compKeys.map(c => (
                    <td key={`tot-${c.key}`} className="px-3 py-3 border-r border-teal-200 text-right text-[11px] text-slate-700">{formatRpEx(data.reduce((s, d) => s + (d.comps?.[c.key] || 0), 0))}</td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const setVerdict = (key, verdict) => {
    setAuditVerdicts(prev => {
      const next = { ...prev };
      if (!verdict) delete next[key];
      else next[key] = verdict;
      return next;
    });
  };

  const renderKpiCoder = () => {
    const baseData = dashData?.kpiCoderArray || [];
    const findings = dashData?.auditFindings || [];
    const coderAdj = {};
    findings.forEach((f) => {
      const cId = String(f.coderId || 'UNKNOWN').trim().toUpperCase();
      if (!coderAdj[cId]) coderAdj[cId] = { sesuai: 0, tidakSesuai: 0, reviewed: 0 };
      const key = `${f.sep}|${f.ruleId}`;
      const v = auditVerdicts[key];
      if (v === 'sesuai') { coderAdj[cId].sesuai++; coderAdj[cId].reviewed++; }
      else if (v === 'tidak') { coderAdj[cId].tidakSesuai++; coderAdj[cId].reviewed++; }
    });
    const data = baseData.map(c => {
      const adj = coderAdj[c.id] || { sesuai: 0, tidakSesuai: 0, reviewed: 0 };
      return { ...c, sesuai: adj.sesuai, tidakSesuai: adj.tidakSesuai, reviewed: adj.reviewed, adjAuditHits: c.auditHits - adj.sesuai };
    });
    const totalVerified = totalReviewed;
    const totalCases = data.reduce((s, c) => s + c.cases, 0);
    const overallAccuracy = totalCases > 0 ? 100 - (totalTidak / totalCases) * 100 : 100;

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader icon={Award} title="KPI Coder (Kinerja Petugas Koding)" desc="Analisis produktivitas, akurasi input, dan efektivitas koding per individu petugas." colorClass="bg-teal-50 text-teal-600" highlightClass="bg-teal-500/5" exportAction={() => {
          const csv = data.map(c => [c.id, c.cases, c.discrepancyCount, c.auditHits, c.sesuai, c.tidakSesuai, c.adjAuditHits]);
          exportToXlsx('KPI_Coder', ['Coder ID', 'Total Kasus', 'Discrepancy', 'Audit Flag (Raw)', 'Verified Sesuai', 'Verified Tidak Sesuai', 'Audit Flag (Adjusted)'], csv);
        }} />

        {/* Coder Performance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-white border-0 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500"></div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Kasus Direview</p>
              <h3 className="text-4xl font-black text-slate-800 tracking-tight">{totalVerified.toLocaleString()}</h3>
              <div className="mt-4 flex items-center gap-2 text-teal-600 font-bold text-xs bg-teal-50 w-fit px-3 py-1 rounded-full">
                <CheckSquare size={14} /> Audit Progress
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-white border-0 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500"></div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Akurasi Rata-rata (Verified)</p>
              <h3 className="text-4xl font-black text-emerald-600 tracking-tight">{formatPct(overallAccuracy)}%</h3>
              <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 w-fit px-3 py-1 rounded-full">
                <TrendingUp size={14} /> Clinical Accuracy
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-white border-0 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500"></div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Discrepancy Terdeteksi</p>
              <h3 className="text-4xl font-black text-rose-600 tracking-tight">{totalTidak.toLocaleString()}</h3>
              <div className="mt-4 flex items-center gap-2 text-rose-600 font-bold text-xs bg-rose-50 w-fit px-3 py-1 rounded-full">
                <AlertCircle size={14} /> Coding Improvement
              </div>
            </div>
          </Card>
        </div>

        <Card className="overflow-hidden border-0 shadow-xl bg-white rounded-[2rem]">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-5">Nama Coder</th>
                  <th className="px-6 py-5 text-right">Total Kasus</th>
                  <th className="px-6 py-5 text-right">Discrepancy</th>
                  <th className="px-6 py-5 text-right">Audit Flag</th>
                  <th className="px-6 py-5 text-right">Verified Sesuai</th>
                  <th className="px-6 py-5 text-right">Verified Tidak</th>
                  <th className="px-6 py-5 text-right">% Akurasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((r, i) => {
                  const accuracy = r.cases > 0 ? 100 - (r.tidakSesuai / r.cases) * 100 : 100;
                  return (
                    <tr key={i} className="hover:bg-teal-50/30 cursor-pointer transition-colors group" onClick={() => openDrilldown(`Kasus Coder: ${r.id}`, row => {
                      const raw = String(row['CODER_ID'] || row['USER_CODER'] || row['CODER'] || '').trim().toUpperCase();
                      const c = raw.includes(';') ? raw.split(';')[0].trim() : raw;
                      return c === r.id;
                    })}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-black text-[10px]">{r.id.charAt(0)}</div>
                          <span className="font-extrabold text-slate-700 group-hover:text-teal-700 transition-colors">{r.id.includes(';') ? r.id.split(';')[0].trim() : r.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-600">{r.cases.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            if (r.discrepancyCount > 0) {
                              const discRows = (dashData?.rawRows || []).filter(row => {
                                const raw = String(row['CODER_ID'] || row['USER_CODER'] || row['CODER'] || '').trim().toUpperCase();
                                const c = raw.includes(';') ? raw.split(';')[0].trim() : raw;
                                if (c !== r.id) return false;
                                const d1 = String(row['DIAGLIST'] || '').split(';').map(d => d.trim()).filter(d => d);
                                const p1 = String(row['PROCLIST'] || '').split(';').map(p => p.trim()).filter(p => p && p !== '-' && p.toLowerCase() !== 'none');
                                const d2 = String(row['IDRG_DIAG_LISTS'] || '').split(';').map(d => d.trim()).filter(d => d);
                                const p2 = String(row['IDRG_PROC_LISTS'] || '').split(';').map(p => p.trim()).filter(p => p && p !== '-' && p.toLowerCase() !== 'none');
                                return checkMatchList(d1, d2, ['KG', 'HL', 'NL', 'KND', 'G89', 'U82', 'U83', 'U84']) < 100 || checkMatchList(p1, p2, ['99.290']) < 100;
                              });

                              const generatedFindings = discRows.map(row => {
                                const d1 = String(row['DIAGLIST'] || '').split(';').map(d => d.trim()).filter(d => d);
                                const d2 = String(row['IDRG_DIAG_LISTS'] || '').split(';').map(d => d.trim()).filter(d => d);
                                const p1 = String(row['PROCLIST'] || '').split(';').map(p => p.trim()).filter(p => p && p !== '-' && p.toLowerCase() !== 'none');
                                const p2 = String(row['IDRG_PROC_LISTS'] || '').split(';').map(p => p.trim()).filter(p => p && p !== '-' && p.toLowerCase() !== 'none');

                                // Calculate specific differences, excluding certain medical codes
                                const EXCLUDED_DIAGS = ['KG', 'HL', 'NL', 'KND', 'G89', 'U82', 'U83', 'U84'];
                                const EXCLUDED_PROCS = ['99.290'];

                                const dOnlyInIna = d1.filter(c => !d2.includes(c) && !EXCLUDED_DIAGS.includes(c));
                                const dOnlyInIdrg = d2.filter(c => !d1.includes(c) && !EXCLUDED_DIAGS.includes(c));
                                const pOnlyInIna = p1.filter(c => !p2.includes(c) && !EXCLUDED_PROCS.includes(c));
                                const pOnlyInIdrg = p2.filter(c => !p1.includes(c) && !EXCLUDED_PROCS.includes(c));

                                const hasAnyDiff = dOnlyInIna.length > 0 || dOnlyInIdrg.length > 0 || pOnlyInIna.length > 0 || pOnlyInIdrg.length > 0;

                                return {
                                  ruleId: 'KODING_DISC',
                                  case: `Mismatch INA vs iDRG`,
                                  warning: (
                                    <div className="flex flex-col gap-1.5 py-1">
                                      {dOnlyInIna.length > 0 && <div className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[9px] font-black shrink-0">INA ONLY</span> <span className="text-orange-700 font-bold">Diag: [{dOnlyInIna.join(', ')}]</span></div>}
                                      {dOnlyInIdrg.length > 0 && <div className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded text-[9px] font-black shrink-0">iDRG ONLY</span> <span className="text-sky-700 font-bold">Diag: [{dOnlyInIdrg.join(', ')}]</span></div>}
                                      {pOnlyInIna.length > 0 && <div className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[9px] font-black shrink-0">INA ONLY</span> <span className="text-orange-700 font-bold">Proc: [{pOnlyInIna.join(', ')}]</span></div>}
                                      {pOnlyInIdrg.length > 0 && <div className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded text-[9px] font-black shrink-0">iDRG ONLY</span> <span className="text-sky-700 font-bold">Proc: [{pOnlyInIdrg.join(', ')}]</span></div>}
                                      {!hasAnyDiff && <div className="text-slate-400 italic text-[10px]">Perbedaan urutan atau karakter koding</div>}
                                    </div>
                                  ),
                                  sep: String(row['SEP'] || '-'),
                                  mrn: String(row['MRN'] || '-'),
                                  coderId: r.id
                                };
                              });

                              openDrilldown(`Review Discrepancy: ${r.id}`, () => true, 'audit_kpi', generatedFindings);
                            }
                          }}
                          title="Klik untuk meninjau perbedaan koding"
                          className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all hover:scale-110 active:scale-95 ${r.discrepancyCount > 0 ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-slate-100 text-slate-400'}`}
                        >
                          {r.discrepancyCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            if (r.auditHits > 0) {
                              openDrilldown(`Temuan Audit: ${r.id}`, f => String(f.coderId || '').toUpperCase() === r.id, 'audit_kpi', findings);
                            }
                          }}
                          title="Klik untuk melihat detail temuan audit"
                          className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-all hover:scale-110 active:scale-95 ${r.adjAuditHits > 0 ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-slate-100 text-slate-400'}`}
                        >
                          {r.adjAuditHits}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600">{r.sesuai > 0 ? r.sesuai.toLocaleString() : '-'}</td>
                      <td className="px-6 py-4 text-right font-black text-rose-600">{r.tidakSesuai > 0 ? r.tidakSesuai.toLocaleString() : '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-xs font-black ${accuracy < 70 ? 'text-rose-600' : accuracy < 90 ? 'text-orange-600' : 'text-emerald-600'}`}>{formatPct(accuracy)}%</span>
                          <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ${accuracy < 70 ? 'bg-rose-500' : accuracy < 90 ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ width: `${accuracy}%` }}></div>
                          </div>
                        </div>
                      </td>
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

  const renderAudit = () => {
    const findings = dashData?.auditFindings || [];
    const filtered = findings.filter((f) => {
      if (auditRuleFilter && f.ruleId !== auditRuleFilter) return false;
      if (auditReviewFilter) {
        const key = `${f.sep}|${f.ruleId}`;
        const v = auditVerdicts[key];
        if (auditReviewFilter === 'reviewed' && !v) return false;
        if (auditReviewFilter === 'unreviewed' && v) return false;
      }
      if (auditFilter && !((f.ruleId || '').toLowerCase().includes(auditFilter.toLowerCase()) || (f.case || '').toLowerCase().includes(auditFilter.toLowerCase()) || (f.warning || '').toLowerCase().includes(auditFilter.toLowerCase()))) return false;
      return true;
    });
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader icon={CheckSquare} title="Audit Log Kaidah Koding" desc="Verifikasi temuan audit secara mendalam untuk meningkatkan akurasi koding dan performa klinis." colorClass="bg-teal-50 text-teal-600" highlightClass="bg-teal-500/5" exportAction={() => {
          const csv = findings.map((f) => [f.ruleId, f.case, f.warning, f.mrn, f.sep, f.diaglist, f.proclist, auditVerdicts[`${f.sep}|${f.ruleId}`] || 'belum']);
          exportToXlsx('Audit_Log', ['Rule ID', 'Case', 'Warning', 'MRN', 'SEP', 'Diaglist', 'Proclist', 'Verdict'], csv);
        }} />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-5 text-center border-b-4 border-b-teal-500"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Temuan</p><p className="text-3xl font-black text-slate-800">{findings.length}</p></Card>
          <Card className="p-5 text-center bg-slate-50/50"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sudah Direview</p><p className="text-3xl font-black text-slate-600">{totalReviewed}</p></Card>
          <Card className="p-5 text-center bg-teal-50/50 border border-teal-100"><p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">Total Klaim Audit</p><p className="text-2xl font-black text-teal-700">{formatRp(filtered.reduce((s, f) => s + (f.totalTarif || 0), 0))}</p></Card>
          <Card className="p-5 text-center bg-emerald-50/50 border border-emerald-100"><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Sesuai</p><p className="text-3xl font-black text-emerald-600">{totalSesuai}</p></Card>
          <Card className="p-5 text-center bg-rose-50/50 border border-rose-100"><p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Tidak Sesuai</p><p className="text-3xl font-black text-rose-600">{totalTidak}</p></Card>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Cari kata kunci audit, rule, atau MRN..." value={auditFilter} onChange={e => setAuditFilter(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all shadow-sm" />
          </div>
          <div className="relative w-full md:w-80 shrink-0">
            <select value={auditRuleFilter} onChange={e => setAuditRuleFilter(e.target.value)} className="w-full pl-4 pr-10 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all appearance-none cursor-pointer">
              <option value="">Filter Berdasarkan Aturan</option>
              {Array.from(new Set(findings.map(f => f.ruleId))).filter(Boolean).sort().map(rId => {
                const f = findings.find(x => x.ruleId === rId);
                return <option key={rId} value={rId}>{rId}: {f?.case || 'Rule Spesifik'}</option>;
              })}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          </div>
          <div className="relative w-full md:w-56 shrink-0">
            <select value={auditReviewFilter} onChange={e => setAuditReviewFilter(e.target.value)} className="w-full pl-4 pr-10 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all appearance-none cursor-pointer">
              <option value="">Status Verifikasi</option>
              <option value="reviewed">Sudah Direview</option>
              <option value="unreviewed">Belum Direview</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          </div>
        </div>

        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-teal-50/50 rounded-[1.5rem] border border-teal-100/50 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 mr-3 px-3 py-1.5 bg-white rounded-xl border border-teal-100 shadow-sm">
              <Zap size={16} className="text-teal-500" />
              <span className="text-[10px] font-black text-teal-700 uppercase tracking-widest">Aksi Massal ({filtered.length})</span>
            </div>
            <button onClick={() => {
              const newV = { ...auditVerdicts };
              filtered.forEach(f => { const key = `${f.sep}|${f.ruleId}`; newV[key] = 'sesuai'; });
              setAuditVerdicts(newV);
            }} className="px-5 py-2.5 bg-white border border-emerald-200 text-emerald-700 rounded-xl text-xs font-black hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm flex items-center gap-2">
              <CheckSquare size={16} /> Tandai Sesuai
            </button>
            <button onClick={() => {
              const newV = { ...auditVerdicts };
              filtered.forEach(f => { const key = `${f.sep}|${f.ruleId}`; newV[key] = 'tidak'; });
              setAuditVerdicts(newV);
            }} className="px-5 py-2.5 bg-white border border-rose-200 text-rose-700 rounded-xl text-xs font-black hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm flex items-center gap-2">
              <X size={16} /> Tandai Tidak Sesuai
            </button>
            <button onClick={() => {
              const newV = { ...auditVerdicts };
              filtered.forEach(f => { const key = `${f.sep}|${f.ruleId}`; delete newV[key]; });
              setAuditVerdicts(newV);
            }} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-black hover:bg-slate-200 hover:text-slate-700 transition-all flex items-center gap-2 ml-auto">
              <Trash2 size={16} /> Reset
            </button>
          </div>
        )}

        <Card className="overflow-hidden border-0 shadow-xl">
          <div className="overflow-x-auto max-h-[700px] custom-scrollbar">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-[0.1em] sticky top-0 z-40">
                <tr>
                  <th className="p-4 border-r border-white/10 w-24">Rule ID</th>
                  <th className="p-4 border-r border-white/10">Temuan Audit</th>
                  <th className="p-4 border-r border-white/10 max-w-[250px]">Pesan Validasi</th>
                  <th className="p-4 border-r border-white/10 w-28">Identitas</th>
                  <th className="p-4 border-r border-white/10 w-28">Nama Coder</th>
                  <th className="p-4 border-r border-white/10 w-44">Diaglist</th>
                  <th className="p-4 border-r border-white/10 w-44">Proclist</th>
                  <th className="p-4 text-center">Keputusan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.slice(0, 200).map((f, idx) => {
                  const key = `${f.sep}|${f.ruleId}`;
                  const v = auditVerdicts[key];
                  return (
                    <tr
                      key={`${f.sep}-${f.ruleId}`}
                      className={`animate-in fade-in slide-in-from-bottom-1 duration-300 transition-colors ${v === 'sesuai' ? 'bg-emerald-50/40' : v === 'tidak' ? 'bg-rose-50/40' : 'hover:bg-slate-50'}`}
                      style={{ animationDelay: `${Math.min(idx * 20, 500)}ms`, animationFillMode: 'both' }}
                    >
                      <td className="p-4 border-r border-slate-100 align-top font-mono text-[11px] font-black text-teal-700">{f.ruleId || '-'}</td>
                      <td className="p-4 border-r border-slate-100 align-top text-slate-700 font-bold text-xs">{f.case}</td>
                      <td className="p-4 border-r border-slate-100 align-top text-rose-700 font-bold text-[11px] leading-relaxed max-w-[250px]">{f.warning}</td>
                      <td className="p-4 border-r border-slate-100 align-top">
                        <p className="font-black text-slate-800 text-[11px]">{f.mrn}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{f.sep}</p>
                      </td>
                      <td className="p-4 border-r border-slate-100 align-top">
                        <p className="font-bold text-teal-700 text-[11px]">{f.coderId || '-'}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{formatRp(f.totalTarif || 0)}</p>
                      </td>
                      <td className="p-4 border-r border-slate-100 align-top font-mono text-[10px] text-slate-600 max-w-[176px] break-words leading-relaxed" title={f.diaglist}>{f.diaglist || '-'}</td>
                      <td className="p-4 border-r border-slate-100 align-top font-mono text-[10px] text-slate-600 max-w-[176px] break-words leading-relaxed" title={f.proclist}>{f.proclist || '-'}</td>
                      <td className="p-4 text-center align-top">
                        <div className="flex gap-2 justify-center">
                          <button onClick={(e) => { e.stopPropagation(); setVerdict(key, v === 'sesuai' ? undefined : 'sesuai'); }}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all border-2 ${v === 'sesuai' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-200 hover:text-emerald-600'}`}
                          >✔ SESUAI</button>
                          <button onClick={(e) => { e.stopPropagation(); setVerdict(key, v === 'tidak' ? undefined : 'tidak'); }}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all border-2 ${v === 'tidak' ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-600/30' : 'bg-white border-slate-100 text-slate-400 hover:border-rose-200 hover:text-rose-600'}`}
                          >✖ TIDAK</button>
                        </div>
                      </td>
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

  const renderNaikKelas = () => {
    const data = dashData?.naikKelasStats || [];
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader icon={BarChart3} title="Hak Kelas (Naik Kelas Rawat)" desc="Ringkasan kasus di mana pasien mendapatkan perawatan kelas yang lebih tinggi dari haknya." colorClass="bg-cyan-50 text-cyan-600" highlightClass="bg-cyan-500/5" exportAction={() => {
          const csv = data.map(d => [d.awal, d.akhir, d.count, d.totalNilai, d.sev1, d.sev2, d.sev3]);
          exportToXlsx('Naik_Kelas', ['Kelas Awal', 'Kelas Akhir', 'Jumlah Kasus', 'Total Nilai', 'SL1', 'SL2', 'SL3'], csv);
        }} />
        <Card className="overflow-x-auto">
          <MiniTable data={data} columns={[
            { header: 'Pola', className: 'font-extrabold', render: r => `${r.awal} → ${r.akhir}` },
            { header: 'Pembayar', className: 'text-xs font-semibold', render: r => r.pembayar },
            { header: 'Jumlah', className: 'text-right font-bold', render: r => r.count },
            { header: 'Total Nilai', className: 'text-right font-black text-cyan-600', render: r => formatRp(r.totalNilai) },
            { header: 'SL1', className: 'text-right', render: r => r.sev1 },
            { header: 'SL2', className: 'text-right', render: r => r.sev2 },
            { header: 'SL3', className: 'text-right', render: r => r.sev3 }
          ]} onRowClick={r => openDrilldown(`Naik Kelas: ${r.awal}→${r.akhir}`, row => {
            const kAw = String(row['KELAS_RAWAT'] || row['KELAS'] || row['HAK_KELAS'] || '').trim();
            const matchC2 = String(row['C2'] || '').match(/"selisih_biaya":\s*\{\s*"nilai":\s*"(\d+)"\s*,\s*"pembayar":\s*"([^"]+)"\s*,\s*"naik_kelas":\s*"([^"]+)"/);
            const kAk = matchC2 ? matchC2[3].toUpperCase() : '';
            return kAw === r.awalRaw && kAk === r.akhir;
          })} />
        </Card>
      </div>
    );
  };

  const renderTopUp = () => {
    const data = dashData?.topUpStats?.items || [];
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader icon={ArrowUpCircle} title="Potensi Top Up Special CMG" desc="Analisis peluang pendapatan tambahan melalui deteksi kriteria Special Procedure (SP), Investigation (SI), Prosthesis (SR), dan Drugs (SD)." colorClass="bg-emerald-50 text-emerald-600" highlightClass="bg-emerald-500/5" exportAction={() => {
          const csv = data.map(d => [d.item, d.category, d.count, d.totalPotensi]);
          exportToXlsx('Potensi_TopUp', ['Item', 'Category', 'Kasus', 'Total Potensi'], csv);
        }} />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-5 border-0 shadow-lg bg-emerald-600 text-white relative overflow-hidden !bg-emerald-600">
            <div className="absolute top-0 right-0 p-3 opacity-20"><ArrowUpCircle size={60} /></div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Total Potensi Revenue</p>
            <h3 className="text-2xl font-black">{formatRp(dashData?.topUpStats?.topUpNilai || 0)}</h3>
          </Card>
          <Card className="p-5 border-0 shadow-lg bg-white">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Kasus Potensial</p>
            <h3 className="text-2xl font-black text-slate-800">{dashData?.topUpStats?.topUpKasus || 0} <span className="text-xs font-bold text-slate-400">Record</span></h3>
          </Card>
          <Card className="p-5 border-0 shadow-lg bg-white">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Top-Up per Kasus</p>
            <h3 className="text-2xl font-black text-teal-600">{formatRp((dashData?.topUpStats?.topUpNilai || 0) / (dashData?.topUpStats?.topUpKasus || 1))}</h3>
          </Card>
          <Card className="p-5 border-0 shadow-lg bg-white">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Items Terdeteksi</p>
            <h3 className="text-2xl font-black text-slate-800">{data.length} <span className="text-xs font-bold text-slate-400">Kriteria</span></h3>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {data.slice(0, 6).map((item, i) => (
            <Card key={i} className="p-6 border-0 shadow-xl hover:-translate-y-1 transition-all group cursor-pointer" onClick={() => openDrilldown(`Potensi TopUp: ${item.item}`, r => {
              const ina_norm = normalize_c(String(r['INACBG'] || '').trim());
              const diag_norm = normalize_c(r['DIAGNOSA'] || '');
              const all_codes = (String(r['DIAGLIST'] || '') + " " + String(r['PROCLIST'] || '')).split(/[;, ]/).map(c => normalize_c(c)).filter(c => c);
              const cbg_ok = item.n_cbgs.length === 0 || item.n_cbgs.some(c => ina_norm === c);
              const diag_ok = item.n_diags.length === 0 || (item.primaryOnly ? item.n_diags.some(c => diag_norm === c) : item.n_diags.some(c => all_codes.includes(c)));
              const proc_ok = item.n_procs.length === 0 || item.n_procs.some(c => all_codes.includes(c));
              return cbg_ok && diag_ok && proc_ok;
            })}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-xl font-black text-[10px] uppercase tracking-wider ${item.category === 'sp' ? 'bg-indigo-50 text-indigo-600' : item.category === 'si' ? 'bg-sky-50 text-sky-600' : item.category === 'sr' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>{item.category}</div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Est. Revenue</p>
                  <p className="text-sm font-black text-emerald-600">+{formatRp(item.totalPotensi)}</p>
                </div>
              </div>
              <h4 className="text-base font-black text-slate-800 mb-1 leading-tight group-hover:text-teal-600 transition-colors">{item.item}</h4>
              <p className="text-xs font-bold text-slate-400 mb-4">{item.count} Kasus Terdeteksi</p>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lihat Rincian</span>
                <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden border-0 shadow-xl bg-white rounded-[2rem]">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Daftar Lengkap Peluang Top-Up</h3>
          </div>
          <MiniTable data={data} columns={[
            { header: 'Kriteria Item', className: 'font-extrabold text-slate-700', render: r => r.item },
            { header: 'Kategori', className: 'text-center', render: r => <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black uppercase">{r.category}</span> },
            { header: 'Volume Kasus', className: 'text-right font-bold', render: r => r.count },
            { header: 'Nilai Satuan', className: 'text-right text-slate-400', render: r => formatRp(r.tarif) },
            { header: 'Total Potensi', className: 'text-right font-black text-emerald-600', render: r => formatRp(r.totalPotensi) }
          ]} onRowClick={r => openDrilldown(`Potensi TopUp: ${r.item}`, row => {
            const ina_norm = normalize_c(String(row['INACBG'] || '').trim());
            const diag_norm = normalize_c(row['DIAGNOSA'] || '');
            const all_codes = (String(row['DIAGLIST'] || '') + " " + String(row['PROCLIST'] || '')).split(/[;, ]/).map(c => normalize_c(c)).filter(c => c);
            const cbg_ok = r.n_cbgs.length === 0 || r.n_cbgs.some(c => ina_norm === c);
            const diag_ok = r.n_diags.length === 0 || (r.primaryOnly ? r.n_diags.some(c => diag_norm === c) : r.n_diags.some(c => all_codes.includes(c)));
            const proc_ok = r.n_procs.length === 0 || r.n_procs.some(c => all_codes.includes(c));
            return cbg_ok && diag_ok && proc_ok;
          })} />
        </Card>
      </div>
    );
  };

  const renderICU = () => {
    const data = dashData?.icuStats || {};
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader icon={ActivitySquare} title="Intensif ICU" desc="Monitoring indikator ICU, ventilator, dan anomali koding terkait durasi." colorClass="bg-red-50 text-red-600" highlightClass="bg-red-500/5" exportAction={() => {
          const csv = (data.anomalies || []).map(a => [a.mrn, a.sep, a.ventHour, a.issue]);
          exportToXlsx('Anomali_ICU', ['MRN', 'SEP', 'Ventilator Hour', 'Issue'], csv);
        }} exportText="Ekspor Anomali" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="p-6 bg-white cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all" onClick={() => openDrilldown('Seluruh Kasus ICU', r => String(r['INACBG'] || '').includes('-4') || String(r['INACBG'] || '').includes('-5') || String(r['IDRG_DRG_CODE'] || '').includes('ICU'))}><h4 className="text-slate-500 uppercase text-xs font-extrabold mb-2">Total Kasus ICU</h4><p className="text-4xl font-black text-red-600">{data.total || 0}</p></Card>
          <Card className="p-6 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all" onClick={() => openDrilldown('ICU SL 1', r => { const sl = String(r['INACBG'] || '').slice(-1); return sl === '1' && (String(r['INACBG'] || '').includes('-4') || String(r['INACBG'] || '').includes('-5')); })}><h4 className="text-slate-500 uppercase text-xs font-extrabold mb-2">ICU SL 1</h4><p className="text-2xl font-black">{data.sev1 || 0}</p></Card>
          <Card className="p-6 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all" onClick={() => openDrilldown('ICU SL 2', r => { const sl = String(r['INACBG'] || '').slice(-1); return sl === '2' && (String(r['INACBG'] || '').includes('-4') || String(r['INACBG'] || '').includes('-5')); })}><h4 className="text-slate-500 uppercase text-xs font-extrabold mb-2">ICU SL 2</h4><p className="text-2xl font-black">{data.sev2 || 0}</p></Card>
          <Card className="p-6 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all" onClick={() => openDrilldown('ICU SL 3', r => { const sl = String(r['INACBG'] || '').slice(-1); return sl === '3' && (String(r['INACBG'] || '').includes('-4') || String(r['INACBG'] || '').includes('-5')); })}><h4 className="text-slate-500 uppercase text-xs font-extrabold mb-2">ICU SL 3</h4><p className="text-2xl font-black">{data.sev3 || 0}</p></Card>
        </div>
        {data.anomalies?.length > 0 && (
          <Card>
            <div className="p-4 bg-red-50 border-b border-red-100 font-extrabold text-slate-800">Anomali Koding Ventilator</div>
            <MiniTable data={data.anomalies} columns={[
              { header: 'MRN', className: 'font-extrabold', render: r => r.mrn },
              { header: 'SEP', render: r => r.sep },
              { header: 'Vent Hour', className: 'text-right', render: r => r.ventHour },
              { header: 'Issue', className: 'text-orange-600 font-medium', render: r => r.issue },
              { header: 'Severity', render: r => r.severity }
            ]} />
          </Card>
        )}
      </div>
    );
  };

  const tCell = "px-5 py-3 border-r border-slate-50";

  // === ANALYSIS OVERLAY ===
  const analysisSteps = [
    { icon: '📊', label: 'Membaca struktur data klaim...', color: '#2dd4bf' },
    { icon: '🔬', label: 'Menganalisis kode INA-CBG & iDRG...', color: '#5eead4' },
    { icon: '💰', label: 'Menghitung selisih finansial...', color: '#14b8a6' },
    { icon: '🩺', label: 'Mendeteksi anomali koding audit...', color: '#0d9488' },
    { icon: '📈', label: 'Menyusun laporan & grafik...', color: '#0f766e' },
  ];
  useEffect(() => {
    if (!isAnalyzing) { setAnalysisStep(0); return; }
    const iv = setInterval(() => setAnalysisStep(s => (s + 1) % analysisSteps.length), 350);
    return () => clearInterval(iv);
  }, [isAnalyzing]);

  if (!isLoggedIn) {

    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-800 flex items-center justify-center p-4 relative overflow-hidden">
          {/* Background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-70"></div>
            <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-emerald-400 rounded-full mix-blend-multiply filter blur-[100px] opacity-70"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] bg-teal-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-70"></div>
          </div>
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            {loginParticles.map((p, i) => (
              <div key={i} className="absolute rounded-full bg-white/20 animate-pulse" style={{ width: `${p.size}px`, height: `${p.size}px`, left: `${p.x}%`, top: `${p.y}%`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }} />
            ))}
          </div>

          <div className="w-full max-w-md relative z-10 animate-in zoom-in-95 duration-700">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white shadow-2xl shadow-teal-900/30 mb-6 overflow-hidden p-3 border border-white/20">
                <img src="https://lh3.googleusercontent.com/d/1K9BUgDDRmF0d9Q9mCasC5KhDXVpVhJs5" className="w-full h-full object-contain" alt="Logo" />
              </div>
              <div className="flex flex-col items-center justify-center">
                <h1 className="text-4xl font-black tracking-tight leading-none mb-1 text-white drop-shadow-lg">
                  AKURAT - <span className="text-teal-200">iD</span><span className="text-white">RG</span>
                </h1>
                <p className="text-teal-50 text-[9px] font-black uppercase tracking-[0.2em] opacity-90 text-center px-4 mt-3 leading-relaxed">Analisis Klaim & Utilisasi Review Terpadu<br />Indonesian Diagnosis Related Group</p>
              </div>
            </div>

            {/* Card */}
            <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] border border-white shadow-[0_25px_60px_rgba(0,0,0,0.15)] p-10 overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-400 to-emerald-400"></div>
              {/* Error Alert */}
              {loginError && (
                <div className="mb-6 bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 items-start animate-in slide-in-from-top-2 duration-300">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center mt-0.5">
                    <AlertCircle size={16} className="text-rose-600" />
                  </div>
                  <div>
                    <p className="text-rose-700 font-bold text-sm leading-relaxed">{loginError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Username</label>
                  <input
                    type="text" value={username}
                    onChange={e => { setUsername(e.target.value); setLoginError(''); }}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-800 placeholder-slate-300 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-bold shadow-sm"
                    placeholder="Masukkan username" required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Password</label>
                  <input
                    type="password" value={password}
                    onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-800 placeholder-slate-300 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-bold shadow-sm"
                    placeholder="Masukkan password" required
                  />
                </div>

                {/* Slider CAPTCHA */}
                <SliderCaptcha onVerified={() => setCaptchaVerified(true)} verified={captchaVerified} />

                <button
                  type="submit"
                  disabled={!captchaVerified || isLoggingIn}
                  className={`w-full font-black py-4.5 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 mt-4 text-xs tracking-[0.1em] uppercase ${(captchaVerified && !isLoggingIn)
                    ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-2xl shadow-teal-600/30 hover:-translate-y-1 hover:shadow-teal-600/40'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed border-2 border-slate-50'
                    }`}
                >
                  {isLoggingIn ? <Activity size={18} className="animate-spin" /> : <LogIn size={18} />}
                  {isLoggingIn ? 'MEMVERIFIKASI...' : 'MASUK KE DASHBOARD'}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em]">Gunakan akun resmi sistem AKURAT.</p>
                <p className="text-slate-300 text-[9px] mt-2 font-medium">© 2026 iDRG Analytics Platform • Kemenkes Edition</p>
              </div>
            </div>
          </div>
        </div>

        {showDisclaimer && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="max-w-md w-full max-h-[95vh] overflow-y-auto custom-scrollbar p-10 shadow-2xl border border-white/20 bg-white relative rounded-[2.5rem] animate-in zoom-in-95 duration-300">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600"></div>
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-24 h-24 bg-teal-50 rounded-3xl flex items-center justify-center shadow-inner">
                  <AlertTriangle size={48} className="text-teal-600 animate-pulse" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Privasi & Keamanan Data</h2>
                  <p className="text-sm text-slate-500 leading-relaxed font-bold">
                    Sebagai standar kepatuhan data medis, sistem <strong className="text-teal-600">AKURAT - iDRG</strong> memberitahukan:
                  </p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left space-y-4 shadow-inner">
                  <div className="flex gap-4">
                    <CheckCircle className="text-teal-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-xs text-slate-600 leading-relaxed"><strong>Pemrosesan Lokal 100%.</strong> Developer tidak menyimpan data Anda di server. Seluruh proses terjadi di memori browser.</p>
                  </div>
                  <div className="flex gap-4">
                    <CheckCircle className="text-teal-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-xs text-slate-600 leading-relaxed"><strong>Tanggung Jawab Pengguna.</strong> Segala akses dan kerahasiaan data adalah tanggung jawab penuh operator di faskes.</p>
                  </div>
                  <div className="flex gap-4">
                    <CheckCircle className="text-teal-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-xs text-slate-600 leading-relaxed"><strong>Sesi Sementara.</strong> Menutup tab atau me-refresh halaman akan menghapus data analisis secara permanen dari aplikasi.</p>
                  </div>
                </div>
                <div className="w-full flex flex-col gap-3 pt-2">
                  <button onClick={finalizeLogin} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-2">
                    <CheckCircle size={18} /> SAYA MENGERTI & SETUJU
                  </button>
                  <button onClick={() => setShowDisclaimer(false)} className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-all border border-slate-200 flex items-center justify-center gap-2">
                    <X size={16} /> TIDAK SETUJU & KEMBALI
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-teal-100 selection:text-teal-900">

      {/* ANALYSIS PROCESSING OVERLAY */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #042f2e 0%, #0f172a 60%, #042f2e 100%)' }}>
          {/* Animated rings */}
          <div className="relative flex items-center justify-center mb-10">
            <div className="absolute w-40 h-40 rounded-full border-4 border-teal-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
            <div className="absolute w-32 h-32 rounded-full border-4 border-teal-400/30 animate-ping" style={{ animationDuration: '1.2s', animationDelay: '0.2s' }} />
            <div className="absolute w-24 h-24 rounded-full border-4 border-teal-300/40 animate-ping" style={{ animationDuration: '0.9s', animationDelay: '0.4s' }} />
            <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl shadow-teal-500/30" style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}>
              <Activity className="text-white" size={40} strokeWidth={2} style={{ animation: 'spin 2s linear infinite' }} />
            </div>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight mb-2">Menganalisis Data Klaim</h2>
          <p className="text-teal-300 text-sm font-medium mb-8">Harap tunggu, sistem sedang memproses data Anda...</p>

          {/* Cycling step label */}
          <div className="flex items-center gap-3 mb-8 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm min-w-[320px] justify-center">
            <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 8px currentColor)' }}>{analysisSteps[analysisStep].icon}</span>
            <span className="text-sm font-semibold" style={{ color: analysisSteps[analysisStep].color, transition: 'color 0.3s ease' }}>
              {analysisSteps[analysisStep].label}
            </span>
          </div>

          {/* Shimmer progress bar */}
          <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full relative overflow-hidden" style={{ background: 'linear-gradient(90deg, #14b8a6, #2dd4bf, #0d9488, #14b8a6)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite' }} />
          </div>

          <style>{`
            @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          `}</style>
        </div>
      )}

      {drilldown.isOpen && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[98vw] h-full max-h-[95vh] flex flex-col overflow-hidden ring-1 ring-slate-900/5">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-start gap-4">
                {drilldown.prev && (
                  <button
                    onClick={() => setDrilldown(drilldown.prev)}
                    className="p-2 bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white rounded-xl transition-all shadow-sm border border-teal-100 group mt-0.5"
                    title="Kembali ke Daftar INACBG / iDRG"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>
                )}
                <div>
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
                    {!drilldown.prev && <Table2 size={24} className="text-teal-600" />} Rincian Data Analitik
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-[0.2em]">{drilldown.title} — {drilldown.data.length.toLocaleString()} Record Terfilter</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={dlDrilldownCSV} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-teal-600/20 transition-all uppercase tracking-wider"><Download size={16} /> Unduh CSV</button>
                <button onClick={() => setDrilldown({ isOpen: false, title: '', data: [] })} className="p-2.5 hover:bg-rose-50 rounded-full transition-all ml-2 border border-transparent hover:border-rose-100 text-slate-400 hover:text-rose-600"><X size={24} /></button>
              </div>
            </div>

            <div className="overflow-auto flex-1 p-0 bg-slate-50/50 custom-scrollbar">
              {drilldown.data.length === 0 ? (
                <div className="p-16 text-center text-slate-400 font-semibold text-lg">Tidak ada rincian data.</div>
              ) : (
                <div className="flex flex-col">
                  {/* SCORECARD 18 KOMPONEN */}
                  {drilldownStats && (
                    <div className="p-6 bg-white border-b border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                          <LayoutDashboard size={14} className="text-teal-600" /> 
                          {drilldown.type === 'audit_kpi' ? 'Ringkasan Akurasi Input Koding & Temuan Audit' : 'Insight Rata-rata 18 Komponen Biaya per Kasus'}
                        </h4>
                        <span className="text-[10px] bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-black uppercase">
                          {drilldown.type === 'audit_kpi' ? 'Audit Insight' : 'Efisiensi Insight'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {drilldown.type === 'audit_kpi' ? (() => {
                          const total = drilldown.data.length;
                          const sesuai = drilldown.data.filter(f => auditVerdicts[`${f.sep}|${f.ruleId}`] === 'sesuai').length;
                          const tidak = drilldown.data.filter(f => auditVerdicts[`${f.sep}|${f.ruleId}`] === 'tidak').length;
                          const accuracy = (sesuai + tidak) > 0 ? (sesuai / (sesuai + tidak)) * 100 : 100;
                          
                          return (
                            <>
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Temuan</span>
                                <span className="text-xl font-black text-slate-800">{total}</span>
                              </div>
                              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col gap-1">
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Verified Sesuai</span>
                                <span className="text-xl font-black text-emerald-700">{sesuai}</span>
                              </div>
                              <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex flex-col gap-1">
                                <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Verified Tidak</span>
                                <span className="text-xl font-black text-rose-700">{tidak}</span>
                              </div>
                              <div className="bg-teal-900 p-4 rounded-2xl border border-teal-800 flex flex-col gap-1 shadow-lg shadow-teal-900/20 col-span-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] font-black text-teal-300 uppercase tracking-widest">Skor Akurasi Koder</span>
                                  <span className="text-xs font-black text-white">{accuracy.toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-2 bg-teal-800 rounded-full mt-1 overflow-hidden">
                                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${accuracy}%` }}></div>
                                </div>
                              </div>
                            </>
                          );
                        })() : compKeys.map(c => {
                          const stat = drilldownStats.avgComps[c.key];
                          if (!stat || stat.val === 0) return null;
                          return (
                            <div key={c.key} className="bg-slate-50 hover:bg-teal-50 p-2.5 rounded-xl border border-slate-100 hover:border-teal-200 transition-all group">
                              <p className="text-[8px] font-black text-slate-400 uppercase truncate mb-1" title={c.label}>{c.label}</p>
                              <p className="text-[11px] font-black text-slate-800">{formatRp(stat.val)}</p>
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-teal-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(stat.pct * 2, 100)}%` }}></div>
                                </div>
                                <span className="text-[9px] font-bold text-teal-600 shrink-0">{stat.pct.toFixed(1)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Color legend - Hide if it is Audit Findings */}
                  {drilldownStats && drilldown.type === 'patient' && (
                    <div className="px-6 py-3 bg-rose-50/60 border-b border-rose-100 flex flex-wrap items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      <span className="text-rose-700 flex items-center gap-1.5"><span className="inline-block w-3.5 h-3.5 rounded bg-rose-200 border border-rose-400 mr-0.5" />Baris Merah = Tarif RS di atas rata-rata (~ {formatRp(drilldownStats.avgRS)})</span>
                      <span className="text-rose-500 flex items-center gap-1.5">^ = Nilai sel melebihi rata-rata (hover untuk detail)</span>
                      <span className="text-orange-600 flex items-center gap-1.5"><span className="inline-block w-3.5 h-3.5 rounded bg-orange-100 border border-orange-400 mr-0.5" />Orange = Tarif INA / iDRG di atas rata-rata</span>
                      <span className="text-teal-600 flex items-center gap-1.5"><span className="inline-block w-3.5 h-3.5 rounded bg-teal-50 border border-teal-300 mr-0.5" />Normal = Di bawah atau sama dengan rata-rata</span>
                    </div>
                  )}

                  <div className="p-0">
                    {drilldown.type === 'audit_kpi' ? (
                      <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-white text-slate-500 sticky top-0 z-30 shadow-sm border-b border-slate-200 text-[10px] uppercase font-extrabold tracking-wider">
                          <tr>
                            <th className="px-5 py-4 border-r border-slate-100 bg-slate-50 w-12 text-center">No</th>
                            <th className="px-5 py-4 border-r border-slate-100 bg-white">SEP</th>
                            <th className="px-5 py-4 border-r border-slate-100 bg-slate-50">Rule ID</th>
                            <th className="px-5 py-4 border-r border-slate-100 bg-white min-w-[200px]">Temuan / Kasus</th>
                            <th className="px-5 py-4 border-r border-slate-100 bg-slate-50 min-w-[300px]">Warning Message</th>
                            <th className="px-5 py-4 bg-white text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {drilldown.data.map((f, idx) => {
                            const key = `${f.sep}|${f.ruleId}`;
                            const verdict = auditVerdicts[key] || 'belum';
                            return (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3 border-r border-slate-50 text-center text-slate-400 font-semibold">{idx + 1}</td>
                                <td className="px-5 py-3 border-r border-slate-50 font-mono text-xs text-slate-500">{f.sep}</td>
                                <td className="px-5 py-3 border-r border-slate-50 font-black text-slate-700 text-xs">{f.ruleId}</td>
                                <td className="px-5 py-3 border-r border-slate-50 text-xs font-bold text-slate-600 truncate max-w-[250px]" title={f.case}>{f.case}</td>
                                <td className="px-5 py-3 border-r border-slate-50 text-xs text-rose-600 font-medium whitespace-normal min-w-[300px]">{f.warning}</td>
                                <td className="px-5 py-3 text-center">
                                  <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${verdict === 'sesuai' ? 'bg-emerald-100 text-emerald-700' : verdict === 'tidak' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {verdict === 'sesuai' ? 'Sesuai' : verdict === 'tidak' ? 'Tidak Sesuai' : 'Belum Review'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : drilldown.type === 'summary_ina' || drilldown.type === 'summary_idrg' ? (
                      <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-white text-slate-500 sticky top-0 z-30 shadow-sm border-b border-slate-200 text-[10px] uppercase font-extrabold tracking-wider">
                          <tr>
                            <th className="px-5 py-4 border-r border-slate-100 bg-slate-50 w-12 text-center">No</th>
                            <th className="px-5 py-4 border-r border-slate-100 bg-white min-w-[120px]">{drilldown.type === 'summary_ina' ? 'Kode INA-CBG' : 'Kode iDRG'}</th>
                            <th className="px-5 py-4 border-r border-slate-100 bg-slate-50 min-w-[300px]">Deskripsi</th>
                            <th className="px-5 py-4 border-r border-slate-100 bg-white text-center">Jumlah Kasus</th>
                            <th className="px-5 py-4 border-r border-slate-100 bg-teal-50 text-center text-teal-700">ALOS</th>
                            <th className="px-5 py-4 border-r border-slate-100 bg-rose-50 text-center text-rose-700">Max LOS</th>
                            <th className="px-5 py-4 border-r border-slate-100 bg-slate-50 text-right">Tarif RS</th>
                            <th className="px-5 py-4 border-r border-slate-100 bg-white text-right">{drilldown.type === 'summary_ina' ? 'Total Tarif INA' : 'Total Tarif iDRG'}</th>
                            <th className="px-5 py-4 border-r border-slate-100 bg-slate-50 text-right">Selisih Tarif</th>
                            <th className="px-5 py-4 bg-white text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {(() => {
                            const codeKey = drilldown.type === 'summary_ina' ? 'INACBG' : 'IDRG_DRG_CODE';
                            const descKey = drilldown.type === 'summary_ina' ? 'DESKRIPSI_INACBG' : 'IDRG_DRG_DESCRIPTION';
                            const tarifKey = drilldown.type === 'summary_ina' ? 'TOTAL_TARIF' : 'IDRG_TOTAL_TARIF';
                            const map = {};
                            drilldown.data.forEach(r => {
                              const code = String(r[codeKey] || '').trim();
                              if (!code) return;
                              if (!map[code]) map[code] = { code, desc: String(r[descKey] || '-'), count: 0, sumRS: 0, sumTarif: 0, sumLos: 0, maxLos: 0 };
                              map[code].count++;
                              const curLos = parseFloat(r.LOS || 0);
                              map[code].sumLos += curLos;
                              map[code].maxLos = Math.max(map[code].maxLos, curLos);
                              map[code].sumRS += parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
                              map[code].sumTarif += parseFloat(r[tarifKey] || 0) || 0;
                            });
                            return Object.values(map).sort((a, b) => b.count - a.count).map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-5 py-3 border-r border-slate-50 text-center text-slate-400 font-semibold">{idx + 1}</td>
                                <td className="px-5 py-3 border-r border-slate-50 font-black text-slate-700">{item.code}</td>
                                <td className="px-5 py-3 border-r border-slate-50 font-bold text-slate-600 truncate max-w-[400px]" title={item.desc}>{item.desc}</td>
                                <td className="px-5 py-3 border-r border-slate-50 text-center font-black text-teal-600">{item.count.toLocaleString()}</td>
                                <td className="px-5 py-3 border-r border-slate-50 text-center font-bold text-teal-700 bg-teal-50/30">{item.count > 0 ? (item.sumLos / item.count).toFixed(1) : 0}</td>
                                <td className="px-5 py-3 border-r border-slate-50 text-center font-bold text-rose-700 bg-rose-50/30">{item.maxLos || 0}</td>
                                <td className="px-5 py-3 border-r border-slate-50 text-right font-semibold text-slate-600">{formatRp(item.sumRS)}</td>
                                <td className="px-5 py-3 border-r border-slate-50 text-right font-black text-slate-700">{formatRp(item.sumTarif)}</td>
                                <td className={`px-5 py-3 border-r border-slate-50 text-right font-black ${item.sumTarif - item.sumRS >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{item.sumTarif - item.sumRS >= 0 ? '+' : ''}{formatRp(item.sumTarif - item.sumRS)}</td>
                                <td className="px-5 py-3 text-center">
                                  <button
                                    onClick={() => setDrilldown({ ...drilldown, title: `Data Pasien: ${item.code}`, data: drilldown.data.filter(r => String(r[codeKey]).trim() === item.code), type: 'patient', prev: { ...drilldown, prev: null } })}
                                    className="bg-teal-50 hover:bg-teal-600 text-teal-600 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border border-teal-100"
                                  >Tampilkan Data Pasien</button>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    ) : (
                      <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-white text-slate-500 sticky top-0 z-30 shadow-sm border-b border-slate-200 text-[10px] uppercase font-extrabold tracking-wider">
                          <tr>
                            <th rowSpan={2} className="px-5 py-4 border-r border-slate-100 align-middle text-center bg-slate-50">No</th>
                            <th rowSpan={2} className="px-5 py-4 border-r border-slate-100 align-middle sticky left-0 bg-white z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-slate-800">Nama Pasien</th>
                            <th rowSpan={2} className="px-5 py-4 border-r border-slate-100 align-middle bg-slate-50">MRN</th>
                            <th rowSpan={2} className="px-5 py-4 border-r border-slate-100 align-middle bg-slate-50">No SEP</th>
                            <th rowSpan={2} className="px-5 py-4 border-r border-slate-100 align-middle bg-slate-50">Tgl Masuk</th>
                            <th rowSpan={2} className="px-5 py-4 border-r border-slate-100 align-middle bg-slate-50">Tgl Pulang</th>
                            <th rowSpan={2} className="px-5 py-4 border-r border-slate-100 align-middle text-center bg-slate-50">LOS</th>
                            <th rowSpan={2} className="px-4 py-4 text-center border-r border-teal-100 align-middle bg-teal-50/50 text-teal-700">SL INA</th>
                            <th rowSpan={2} className="px-4 py-4 text-center border-r border-emerald-100 align-middle bg-emerald-50/50 text-emerald-700">CL iDRG</th>
                            <th colSpan={4} className="px-5 py-3 text-center border-r border-teal-100 border-b border-teal-100 bg-teal-50 text-teal-800">Diagnosis & Prosedur INA-CBG</th>
                            <th colSpan={4} className="px-5 py-3 text-center border-r border-emerald-100 border-b border-emerald-100 bg-emerald-50 text-emerald-800">Diagnosis & Prosedur iDRG</th>
                            <th rowSpan={2} className="px-5 py-4 text-right border-r border-teal-100 align-middle bg-teal-50/50 text-teal-800">Tarif RS</th>
                            <th rowSpan={2} className="px-5 py-4 text-right border-r border-teal-100 align-middle bg-teal-50/50 text-teal-800">Tarif INA</th>
                            <th rowSpan={2} className="px-5 py-4 text-right border-r border-emerald-100 align-middle bg-emerald-50/50 text-emerald-800">Tarif iDRG</th>
                            <th rowSpan={2} className="px-5 py-4 text-right border-r-4 border-r-slate-200 align-middle bg-slate-100 text-slate-800">Selisih (iDRG-RS)</th>
                            <th rowSpan={2} className="px-5 py-4 text-right border-r-4 border-r-slate-200 align-middle bg-slate-100 text-slate-800">Selisih (iDRG-INA)</th>
                            <th colSpan={18} className="px-5 py-3 text-center bg-slate-800 text-white border-b border-slate-700 tracking-[0.2em]">RINCIAN 18 KOMPONEN BILLING (Rp)</th>
                          </tr>
                          <tr className="text-[10px]">
                            <th className="px-4 py-2 bg-teal-50/30 text-teal-600 border-r border-teal-100/50">Code</th><th className="px-4 py-2 bg-teal-50/30 text-teal-600 border-r border-teal-100/50">Deskripsi</th><th className="px-4 py-2 bg-teal-50/30 text-teal-600 border-r border-teal-100/50">Diaglist</th><th className="px-4 py-2 bg-teal-50/30 text-teal-600 border-r border-teal-100">Proclist</th>
                            <th className="px-4 py-2 bg-emerald-50/30 text-emerald-600 border-r border-emerald-100/50">Code</th><th className="px-4 py-2 bg-emerald-50/30 text-emerald-600 border-r border-emerald-100/50">Deskripsi</th><th className="px-4 py-2 bg-emerald-50/30 text-emerald-600 border-r border-emerald-100/50">Diaglist</th><th className="px-4 py-2 bg-emerald-50/30 text-emerald-600 border-r border-emerald-100">Proclist</th>
                            {compKeys.map(c => <th key={c.key} className="px-4 py-2 bg-slate-700 text-slate-300 border-r border-slate-600 text-right">{c.label}</th>)}
                          </tr>
                        </thead>
                        <tfoot className="sticky bottom-0 z-20">
                          {drilldownStats && (
                            <tr className="bg-teal-100 border-t-2 border-teal-300 shadow-[0_-2px_8px_-2px_rgba(20,184,166,0.25)]">
                              <td colSpan={7} className="px-5 py-3 font-black text-right text-teal-900 tracking-wider text-xs uppercase">~ Rata-Rata / {drilldown.data.length.toLocaleString()} Kasus:</td>
                              <td className="px-5 py-3 text-center font-black text-teal-800 bg-teal-200/50">ALOS: {drilldownStats.avgLos.toFixed(1)}</td>
                              <td className="px-5 py-3 text-center font-black text-rose-800 bg-rose-100/70">MAX: {drilldownStats.maxLos}</td>
                              <td colSpan={8}></td>
                              <td className="px-5 py-3 text-right font-black text-slate-800">{formatRp(drilldownStats.avgRS)}</td>
                              <td className="px-5 py-3 text-right font-black text-teal-800">{formatRp(drilldownStats.avgIna)}</td>
                              <td className="px-5 py-3 text-right font-black text-emerald-800">{formatRp(drilldownStats.avgIdrg)}</td>
                              <td className={`px-5 py-3 text-right font-black border-r-4 border-teal-400 ${drilldownStats.avgSelVsRs > 0 ? 'text-lime-700' : drilldownStats.avgSelVsRs < 0 ? 'text-rose-700' : 'text-slate-600'}`}>{drilldownStats.avgSelVsRs > 0 ? '+' : ''}{formatRp(drilldownStats.avgSelVsRs)}</td>
                              <td className={`px-5 py-3 text-right font-black border-r-4 border-teal-400 ${drilldownStats.avgSel > 0 ? 'text-lime-700' : drilldownStats.avgSel < 0 ? 'text-rose-700' : 'text-slate-600'}`}>{drilldownStats.avgSel > 0 ? '+' : ''}{formatRp(drilldownStats.avgSel)}</td>
                              {compKeys.map(c => <td key={`avg-${c.key}`} className="px-4 py-3 text-right font-bold text-teal-900 bg-teal-200/60 border-r border-teal-200">{formatRpEx(drilldownStats.avgComps[c.key].val)}</td>)}
                            </tr>
                          )}
                        </tfoot>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {drilldown.data.slice(0, 300).map((row, i) => {
                            const rs = parseFloat(row.TARIF_RS || row.BIAYA_RS || row.TOTAL_TARIF_RS || 0) || 0;
                            const ina = parseFloat(row.TOTAL_TARIF) || 0; const idrg = parseFloat(row.IDRG_TOTAL_TARIF) || 0; const sel = idrg - ina; const selVsRs = idrg - rs;
                            const comps = extract18(row); const sev = row.INACBG ? (String(row.INACBG).endsWith('-I') ? 1 : String(row.INACBG).endsWith('-II') ? 2 : String(row.INACBG).endsWith('-III') ? 3 : 0) : 0; const cl = row.IDRG_DRG_CODE ? parseInt(String(row.IDRG_DRG_CODE).slice(-1)) : 0;
                            const patientName = String(row.NAMA_PASien || row.NAMA_PASIEN || '-');
                            const displayName = patientName !== '-' ? patientName.split(' ').filter(w => w.length > 0).map(w => w.charAt(0) + '***').join(' ') : patientName;
                            // --- Highlight logic: flag cells/row above average ---
                            const aboveAvgRS = drilldownStats && rs > 0 && drilldownStats.avgRS > 0 && rs > drilldownStats.avgRS;
                            const aboveAvgIna = drilldownStats && ina > 0 && drilldownStats.avgIna > 0 && ina > drilldownStats.avgIna;
                            const aboveAvgIdrg = drilldownStats && idrg > 0 && drilldownStats.avgIdrg > 0 && idrg > drilldownStats.avgIdrg;
                            const rowFlag = aboveAvgRS; // row highlight driven by Tarif RS
                            return (
                              <tr key={`ddr-${i}`} className={`transition-colors ${rowFlag ? 'bg-rose-50/70 hover:bg-rose-100/60' : 'hover:bg-slate-50/80'}`}>
                                <td className={`${tCell} text-center font-semibold ${rowFlag ? 'text-rose-400' : 'text-slate-400'}`}>{rowFlag ? <span className="text-rose-500 font-black">!</span> : i + 1}</td>
                                <td className={`${tCell} font-extrabold ${rowFlag ? 'text-rose-800 sticky left-0 bg-rose-50 shadow-[2px_0_5px_-2px_rgba(244,63,94,0.1)] z-10' : 'text-slate-800 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] z-10'}`}>{displayName}</td>
                                <td className={`${tCell} font-bold text-slate-600`}>{String(row.MRN || '-')}</td>
                                <td className={`${tCell} text-xs font-mono font-semibold text-slate-500`}>{String(row.SEP || '-')}</td>
                                <td className={`${tCell} text-xs font-bold text-slate-500`}>{String(row._tglMasuk || '-')}</td>
                                <td className={`${tCell} text-xs font-bold text-slate-500`}>{String(row.DISCHARGE_DATE || '-')}</td>
                                <td className={`${tCell} text-center font-bold text-slate-600 bg-slate-50/50`}>{row._los}</td>
                                <td className={`${tCell} text-center font-black text-teal-600 bg-teal-50/20`}>{sev > 0 ? sev : '-'}</td>
                                <td className={`${tCell} text-center font-black text-emerald-600 bg-emerald-50/20`}>{isNaN(cl) ? '-' : cl}</td>
                                <td className={`${tCell} font-bold text-teal-700 bg-teal-50/10`}>{String(row.INACBG || '-')}</td>
                                <td className={`${tCell} text-xs font-medium text-slate-600 max-w-[200px] truncate bg-teal-50/10`} title={String(row.DESKRIPSI_INACBG || '-')}>{String(row.DESKRIPSI_INACBG || '-')}</td>
                                <td className={`${tCell} text-xs font-mono font-semibold text-slate-500 max-w-[150px] truncate bg-teal-50/10`} title={String(row.DIAGLIST || '-')}>{String(row.DIAGLIST || '-')}</td>
                                <td className={`${tCell} text-xs font-mono font-semibold text-slate-500 max-w-[150px] truncate bg-teal-50/10`} title={String(row.PROCLIST || '-')}>{String(row.PROCLIST || '-')}</td>
                                <td className={`${tCell} font-bold text-emerald-700 bg-emerald-50/10`}>{String(row.IDRG_DRG_CODE || '-')}</td>
                                <td className={`${tCell} text-xs font-medium text-slate-600 max-w-[200px] truncate bg-emerald-50/10`} title={String(row.IDRG_DRG_DESCRIPTION || '-')}>{String(row.IDRG_DRG_DESCRIPTION || '-')}</td>
                                <td className={`${tCell} text-xs font-mono font-semibold text-slate-500 max-w-[150px] truncate bg-emerald-50/10`} title={String(row.IDRG_DIAG_LISTS || '-')}>{String(row.IDRG_DIAG_LISTS || '-')}</td>
                                <td className={`${tCell} text-xs font-mono font-semibold text-slate-500 max-w-[150px] truncate bg-emerald-50/10`} title={String(row.IDRG_PROC_LISTS || '-')}>{String(row.IDRG_PROC_LISTS || '-')}</td>
                                <td className={`${tCell} text-right font-bold border-l-2 ${aboveAvgRS ? 'border-l-rose-400 bg-rose-100/60 text-rose-700 ring-1 ring-rose-200' : 'bg-slate-50/20 text-slate-600 border-l-transparent'}`} title={aboveAvgRS ? `Di atas rata-rata (~${formatRp(drilldownStats?.avgRS)})` : ''}>{aboveAvgRS && <span className="text-[9px] mr-1 align-middle font-black text-rose-500">^</span>}{formatRp(rs)}</td>
                                <td className={`${tCell} text-right font-bold border-l-2 ${aboveAvgIna ? 'border-l-orange-400 bg-orange-50/60 text-orange-700 ring-1 ring-orange-200' : 'bg-teal-50/20 text-teal-700 border-l-transparent'}`} title={aboveAvgIna ? `Di atas rata-rata (~${formatRp(drilldownStats?.avgIna)})` : ''}>{aboveAvgIna && <span className="text-[9px] mr-1 align-middle font-black text-orange-500">^</span>}{formatRp(ina)}</td>
                                <td className={`${tCell} text-right font-bold border-l-2 ${aboveAvgIdrg ? 'border-l-orange-400 bg-orange-50/60 text-orange-700 ring-1 ring-orange-200' : 'bg-emerald-50/20 text-emerald-700 border-l-transparent'}`} title={aboveAvgIdrg ? `Di atas rata-rata (~${formatRp(drilldownStats?.avgIdrg)})` : ''}>{aboveAvgIdrg && <span className="text-[9px] mr-1 align-middle font-black text-orange-500">^</span>}{formatRp(idrg)}</td>
                                <td className={`px-5 py-3 text-right font-black border-r-4 border-slate-200 bg-slate-50/50 ${selVsRs > 0 ? 'text-lime-500' : selVsRs < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>{selVsRs > 0 ? '+' : ''}{formatRp(selVsRs)}</td>
                                <td className={`px-5 py-3 text-right font-black border-r-4 border-slate-200 bg-slate-50/50 ${sel > 0 ? 'text-lime-500' : sel < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>{sel > 0 ? '+' : ''}{formatRp(sel)}</td>
                                {compKeys.map(c => {
                                  const compVal = comps[c.key] || 0;
                                  const avgCompVal = drilldownStats?.avgComps?.[c.key]?.val || 0;
                                  const aboveAvgComp = compVal > 0 && avgCompVal > 0 && compVal > avgCompVal;
                                  return <td key={`cmp-${i}-${c.key}`} className={`${tCell} text-right text-[11px] font-semibold border-l-2 ${aboveAvgComp ? 'border-l-rose-300 bg-rose-50/50 text-rose-600 ring-1 ring-rose-100' : 'text-slate-400 border-l-transparent'}`} title={aboveAvgComp ? `Di atas rata-rata komponen ini (~${formatRpEx(avgCompVal)})` : ''}>{aboveAvgComp && <span className="text-[9px] mr-0.5 font-black text-rose-500">^</span>}{formatRpEx(compVal)}</td>;
                                })}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isDarkMode && (
        <style dangerouslySetInnerHTML={{
          __html: `
          .dark-mode-container { background-color: #0f172a !important; color: #f1f5f9 !important; }
          .dark-mode-container .bg-slate-50 { background-color: #0f172a !important; color: #f1f5f9 !important; }
          .dark-mode-container .bg-white { background-color: #1e293b !important; border-color: #334155 !important; color: #f1f5f9 !important; }
          .dark-mode-container .text-slate-800 { color: #f8fafc !important; }
          .dark-mode-container .text-slate-700 { color: #e2e8f0 !important; }
          .dark-mode-container .text-slate-600 { color: #cbd5e1 !important; }
          .dark-mode-container .text-slate-500 { color: #94a3b8 !important; }
          .dark-mode-container .border-slate-100 { border-color: #334155 !important; }
          .dark-mode-container .border-slate-200 { border-color: #475569 !important; }
          .dark-mode-container .bg-slate-100 { background-color: #334155 !important; border-color: #475569 !important; }
          .dark-mode-container table thead tr th { background-color: #1e293b !important; color: #e2e8f0 !important; border-color: #334155 !important; }
          .dark-mode-container table tbody tr { border-color: #334155 !important; }
          .dark-mode-container table tbody tr:hover { background-color: rgba(255,255,255,0.05) !important; }
          .dark-mode-container input, .dark-mode-container select { background-color: #1e293b !important; color: #f1f5f9 !important; border-color: #475569 !important; }
          .dark-mode-container .bg-indigo-50, .dark-mode-container .bg-sky-50, .dark-mode-container .bg-teal-50, .dark-mode-container .bg-purple-50, .dark-mode-container .bg-orange-50, .dark-mode-container .bg-rose-50, .dark-mode-container .bg-lime-50, .dark-mode-container .bg-violet-50 { background-color: rgba(30, 41, 59, 0.6) !important; border-color: #334155 !important; }
        `}} />
      )}
      <div className={`flex h-screen overflow-hidden font-sans ${isDarkMode ? 'dark-mode-container' : 'bg-slate-50 text-slate-800'}`}>

        {/* SIDEBAR NAVIGATION */}
        <aside className={`bg-white border-r border-teal-100 transition-all duration-300 z-[100] flex flex-col shadow-2xl shadow-teal-900/5 print:hidden ${isSidebarOpen ? 'w-64' : 'w-20'} shrink-0 h-screen`}>
          {/* Branding */}
          <div className="p-4 flex items-center justify-between border-b border-teal-100 shrink-0 h-16 bg-gradient-to-r from-teal-50 to-white">
            <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <div className="p-1.5 bg-white rounded-lg shrink-0 shadow-[0_0_15px_rgba(20,184,166,0.2)] w-9 h-9 flex items-center justify-center overflow-hidden border border-teal-200">
                <img src="https://lh3.googleusercontent.com/d/1K9BUgDDRmF0d9Q9mCasC5KhDXVpVhJs5" className="w-full h-full object-contain" alt="Logo" />
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col ml-1">
                  <span className="text-xl font-black whitespace-nowrap tracking-tight leading-none text-slate-800">
                    AKURAT - <span className="text-teal-600">iD</span><span className="text-slate-800">RG</span>
                  </span>
                  <span className="text-[7px] text-slate-500 mt-0.5 tracking-wider font-extrabold uppercase leading-tight opacity-90" title="Analisis Klaim & Utilisasi Review Terpadu - Indonesian Diagnosis Related Group">
                    Analisis Klaim & Utilisasi Review Terpadu
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* User Profile Section */}
          {isLoggedIn && (
            <div className={`p-4 border-b border-slate-50 flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'} bg-slate-50/30`}>
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-teal-600/20 shrink-0 border border-teal-500/20">
                {username.charAt(0).toUpperCase()}
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest leading-none mb-1 opacity-70">Logged In As</span>
                  <span className="text-sm font-black text-slate-800 truncate leading-tight">{username}</span>
                </div>
              )}
            </div>
          )}

          {/* Navigation Menu */}
          <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 custom-scrollbar">
            <button onClick={() => setActiveTab('upload')} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'upload' ? 'bg-teal-600 text-white shadow-xl shadow-teal-600/30' : 'text-slate-600 hover:bg-teal-50 hover:text-teal-700'} ${!isSidebarOpen && 'justify-center'}`} title="Integrasi Data">
              <UploadCloud size={20} className="shrink-0" />
              {isSidebarOpen && <span>Integrasi Data</span>}
            </button>

            <div className={`mt-8 mb-3 ${isSidebarOpen ? 'px-3' : 'text-center'}`}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isSidebarOpen ? 'Dashboard Menu' : '...'}</p>
            </div>

            {TABS.map((t, idx) => {
              const Icon = t.icon;
              const isActive = activeTab === 'dashboard' && subTab === t.id;
              return (
                <button key={idx} onClick={() => { setActiveTab('dashboard'); setSubTab(t.id); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all group ${isActive ? 'bg-teal-50 text-teal-700 font-bold border border-teal-100 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium border border-transparent'} ${!isSidebarOpen && 'justify-center'}`} title={t.label}>
                  <Icon size={20} className={`shrink-0 transition-colors ${isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {isSidebarOpen && <span className="whitespace-nowrap">{t.label}</span>}
                </button>
              )
            })}

            {/* Banner Iklan */}
            {isSidebarOpen && (
              <div className="mt-10 px-3 pb-2 animate-in fade-in duration-500">
                <a href="#" target="_blank" rel="noopener noreferrer" className="block relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-slate-200 group bg-white">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  <img 
                    src="https://drive.google.com/uc?export=view&id=1PgR9wuUVdfTxHOMqZ7A72GqKVX5dcX0a" 
                    alt="Advertisement" 
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" 
                    loading="lazy"
                  />
                  <div className="absolute bottom-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-white/90 backdrop-blur text-slate-800 text-[8px] font-black uppercase px-2 py-1 rounded border border-white/50 shadow-sm">Info</span>
                  </div>
                </a>
              </div>
            )}
          </div>

          {/* User Action & Settings */}
          <div className="p-4 border-t border-slate-100 shrink-0 space-y-2 bg-slate-50/50">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-white hover:text-slate-800 hover:shadow-sm transition-all border border-transparent hover:border-slate-200 ${!isSidebarOpen && 'justify-center'}`} title="Toggle Mode Gelap/Terang">
              {isDarkMode ? <Sun size={20} className="shrink-0 text-amber-500" /> : <Moon size={20} className="shrink-0 text-slate-400" />}
              {isSidebarOpen && <span>{isDarkMode ? 'Mode Terang' : 'Mode Gelap'}</span>}
            </button>
            <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all border border-transparent hover:border-rose-100 ${!isSidebarOpen && 'justify-center'}`} title="Keluar">
              <LogOut size={20} className="shrink-0" />
              {isSidebarOpen && <span>Keluar</span>}
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] z-0 overflow-hidden">
            <img src="https://lh3.googleusercontent.com/d/1K9BUgDDRmF0d9Q9mCasC5KhDXVpVhJs5" alt="" className="w-[600px] grayscale select-none" />
          </div>
          {/* Header */}
          <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 shrink-0 flex items-center px-6 justify-between z-[80] shadow-sm print:hidden">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                <Menu size={20} />
              </button>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">{activeTab === 'upload' ? 'Integrasi Data' : TABS.find(t => t.id === subTab)?.label || 'Dashboard'}</h2>
            </div>
            <div className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Aktif
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar scroll-smooth">
            {activeTab === 'upload' ? (<div className="px-6">{renderUploadTab()}</div>) : (
              <div className="px-4 sm:px-6">
                {dashData && dashData.isLoaded ? (
                  <>
                    <div className="bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 mb-10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] animate-in fade-in slide-in-from-top-4 relative z-[60]">
                      <div className="flex flex-col lg:flex-row items-center gap-8">
                        <div className="flex flex-wrap items-center gap-6 flex-[1.5]">
                          <MultiSelectFilter icon={Calendar} label="Periode" selectedValues={globalFilter.periode} onChange={v => setGlobalFilter({ ...globalFilter, periode: v })} options={filterOptions.periods.map(p => {
                            const [y, m] = p.split('-');
                            const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
                            return { value: p, label: `${months[parseInt(m) - 1]} ${y}` };
                          })} />
                          <MultiSelectFilter icon={Stethoscope} label="Jenis Rawat" selectedValues={globalFilter.jenisRawat} onChange={v => setGlobalFilter({ ...globalFilter, jenisRawat: v })} options={filterOptions.jenis.map(p => ({ value: p, label: p === '1' ? '1 (Rawat Inap)' : p === '2' ? '2 (Rawat Jalan)' : p }))} />
                          <MultiSelectFilter icon={Bed} label="Kelas Rawat" selectedValues={globalFilter.kelasRawat} onChange={v => setGlobalFilter({ ...globalFilter, kelasRawat: v })} options={filterOptions.kelas.map(p => ({ value: p, label: `Kelas ${p}` }))} />
                        </div>
                        <div className="hidden lg:block w-px h-12 bg-slate-200/60"></div>
                        <div className="flex flex-wrap items-center gap-6 flex-[2]">
                          <MultiSelectFilter icon={Building2} label="Departemen" selectedValues={globalFilter.departemen} onChange={v => setGlobalFilter({ ...globalFilter, departemen: v })} options={(filterOptions.depts || []).map(s => ({ value: s, label: s }))} />
                          <MultiSelectFilter icon={Users} label="KSM" selectedValues={globalFilter.ksm} onChange={v => setGlobalFilter({ ...globalFilter, ksm: v })} options={(filterOptions.ksms || []).map(s => ({ value: s, label: s }))} />
                          <MultiSelectFilter icon={User} label="DPJP Utama" selectedValues={globalFilter.dpjp} onChange={v => setGlobalFilter({ ...globalFilter, dpjp: v })} options={filterOptions.dpjps} valKey="norm" lblKey="disp" />
                        </div>
                      </div>
                    </div>

                    {/* Horizontal tabs removed; handled by Sidebar */}

                    {dashData.isEmptyAfterFilter ? (
                      <div className="bg-white/50 backdrop-blur-sm border border-slate-200/60 p-16 rounded-2xl text-center mt-6 max-w-2xl mx-auto shadow-sm animate-in zoom-in-95 duration-300"><div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle className="text-slate-400" size={40} /></div><h2 className="text-2xl font-black mb-3 text-slate-700 tracking-tight">Tidak Ada Data Ditemukan</h2><p className="text-slate-500 font-medium">Kriteria filter yang Anda pilih tidak memiliki kecocokan record dalam dataset yang sedang aktif. Silakan ubah filter Periode, Rawat, Kelas, atau DPJP.</p></div>
                    ) : (
                      <div className="relative z-20">
                        {subTab === 'executive' && renderExecutive()} {subTab === 'report' && renderReport()} {subTab === 'rekap' && renderRekap()}
                        {subTab === 'topup' && renderTopUp()}
                        {subTab === 'sl_cl_analysis' && renderSlClAnalysis()} {subTab === 'ksm' && renderKsm()} {subTab === 'dpjp' && renderDpjp()} {subTab === 'kpi_coder' && renderKpiCoder()}
                        {subTab === 'mapping' && renderPemetaan()} {subTab === 'discrepancy' && renderKetepatan()} {subTab === 'audit' && renderAudit()}
                        {subTab === 'naik_kelas' && renderNaikKelas()} {subTab === 'icu' && renderICU()}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white/50 backdrop-blur-sm border border-slate-200/60 p-20 rounded-[2.5rem] text-center mt-10 max-w-3xl mx-auto shadow-2xl shadow-slate-200/50 animate-in zoom-in-95 duration-500">
                    <div className="mb-10 animate-in fade-in zoom-in-75 duration-1000">
                      <img src="https://lh3.googleusercontent.com/d/1K9BUgDDRmF0d9Q9mCasC5KhDXVpVhJs5" alt="AKURAT iDRG Logo" className="w-72 mx-auto drop-shadow-[0_20px_50px_rgba(20,184,166,0.3)] transition-transform hover:scale-105 duration-700" />
                    </div>
                    <h2 className="text-3xl font-black mb-4 text-slate-800 tracking-tight">Menunggu Dataset Utama...</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      Dashboard analitik belum aktif. Silakan menuju tab <strong className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">Integrasi Data</strong> untuk mengunggah file TXT klaim RS agar sistem dapat memproses wawasan finansial Anda.
                    </p>
                    <button onClick={() => setActiveTab('upload')} className="mt-8 bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-teal-600/20 hover:-translate-y-1 uppercase tracking-widest">MULAI INTEGRASI SEKARANG</button>
                  </div>
                )}
              </div>
            )}
          </main>
          <footer className="p-4 text-center border-t border-slate-100 mt-12 bg-white/30 backdrop-blur-sm relative z-20 print:hidden">
            <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-2">
              Copyright@RPP Analisis Klaim & Utilisasi Review Terpadu iDRG
            </p>
          </footer>
        </div>



        {/* MAP MODAL — INACBG→iDRG or iDRG→INACBG */}
        {mapModal.isOpen && dashData && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden ring-1 ring-slate-900/5">
              {/* Header */}
              <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-100 rounded-xl text-sky-700"><GitMerge size={20} /></div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
                      {mapModal.type === 'ina' ? `Peta INACBG → iDRG` : `Peta iDRG → INACBG`}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                      <span className="text-sky-600">{mapModal.code}</span> — {mapModal.desc || '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openDrilldown(`Kasus ${mapModal.code}`, r => mapModal.type === 'ina' ? String(r.INACBG).trim() === mapModal.code : String(r.IDRG_DRG_CODE).trim() === mapModal.code)}
                    className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-[0_4px_12px_-2px_rgba(2,132,199,0.3)] transition-all"
                  >
                    <Table2 size={15} /> Lihat Data Pasien
                  </button>
                  <button onClick={() => setMapModal({ isOpen: false, type: '', code: '', desc: '' })} className="p-2 hover:bg-slate-100 rounded-full transition-colors border border-transparent hover:border-slate-200 ml-1">
                    <X size={22} className="text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 p-5 space-y-4 custom-scrollbar bg-slate-50/40">
                {mapModal.type === 'ina' && (() => {
                  const entry = dashData.inaToIdrgMap?.[mapModal.code];
                  if (!entry) return <p className="text-center text-slate-400 py-10 font-semibold">Tidak ada data pemetaan untuk kode ini.</p>;
                  return Object.entries(entry.targets).sort((a, b) => b[1].count - a[1].count).map(([idrg, data], j) => (
                    <div key={`mm-ina-${j}`} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-sky-300 hover:shadow-md transition-all">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm font-black shadow-sm">{idrg.split(' ')[0]}</span>
                        <span className="text-sm font-bold text-slate-700 flex-1">{idrg.substring(idrg.indexOf(' ') + 1)}</span>
                        <button
                          onClick={() => { setMapModal({ isOpen: false, type: '', code: '', desc: '' }); openDrilldown(`${mapModal.code} → ${idrg.split(' ')[0]}`, r => String(r.INACBG).trim() === mapModal.code && String(r.IDRG_DRG_CODE).trim() === idrg.split(' ')[0]); }}
                          className="flex items-center gap-1.5 text-[11px] font-black uppercase text-sky-700 bg-sky-100 hover:bg-sky-500 hover:text-white px-3 py-1.5 rounded-lg transition-all"
                        >
                          <Table2 size={11} /> {data.count} Kasus
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                        <div className="bg-sky-50 p-3 rounded-xl border border-sky-100">
                          <p className="text-[10px] font-extrabold text-sky-600 uppercase tracking-widest mb-2 flex items-center gap-1"><Layers size={10} /> Diagnosa Utama</p>
                          <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto custom-scrollbar">
                            {Object.entries(data.priDiags).length === 0
                              ? <span className="text-[10px] text-slate-400 italic">Tanpa data</span>
                              : Object.entries(data.priDiags).sort((a, b) => b[1] - a[1]).slice(0, 10).map((pd, k) => (
                                <span key={k} className="text-[10px] font-black text-sky-800 bg-white border border-sky-200 px-1.5 py-0.5 rounded shadow-sm">{pd[0]} <span className="text-sky-400">({pd[1]})</span></span>
                              ))}
                          </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Stethoscope size={10} /> Diagnosa Sekunder</p>
                          <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto custom-scrollbar">
                            {Object.entries(data.secDiags).length === 0
                              ? <span className="text-[10px] text-slate-400 italic">Tanpa data</span>
                              : Object.entries(data.secDiags).sort((a, b) => b[1] - a[1]).slice(0, 12).map((sd, k) => (
                                <span key={k} className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">{sd[0]} <span className="text-slate-400">({sd[1]})</span></span>
                              ))}
                          </div>
                        </div>
                        <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 sm:col-span-2">
                          <p className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1"><FileCode size={10} /> Prosedur Terkait</p>
                          <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto custom-scrollbar">
                            {!data.procs || Object.entries(data.procs).length === 0
                              ? <span className="text-[10px] text-slate-400 italic">Tanpa data</span>
                              : Object.entries(data.procs).sort((a, b) => b[1] - a[1]).slice(0, 15).map((pr, k) => (
                                <span key={k} className="text-[10px] font-black text-indigo-800 bg-white border border-indigo-200 px-1.5 py-0.5 rounded shadow-sm">{pr[0]} <span className="text-indigo-400 font-bold ml-0.5">({pr[1]})</span></span>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ));
                })()}

                {mapModal.type === 'idrg' && (() => {
                  const entry = dashData.idrgToInaMap?.[mapModal.code];
                  if (!entry) return <p className="text-center text-slate-400 py-10 font-semibold">Tidak ada data pemetaan untuk kode ini.</p>;
                  return Object.entries(entry.sources).sort((a, b) => b[1].count - a[1].count).map(([inaCode, data], j) => (
                    <div key={`mm-idrg-${j}`} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-orange-300 hover:shadow-md transition-all">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-sky-600 text-white px-3 py-1 rounded-lg text-sm font-black shadow-sm">{inaCode}</span>
                        <span className="text-sm font-bold text-slate-700 flex-1">{data.desc || '-'}</span>
                        <button
                          onClick={() => { setMapModal({ isOpen: false, type: '', code: '', desc: '' }); openDrilldown(`${inaCode} → ${mapModal.code}`, r => String(r.INACBG).trim() === inaCode && String(r.IDRG_DRG_CODE).trim() === mapModal.code); }}
                          className="flex items-center gap-1.5 text-[11px] font-black uppercase text-orange-700 bg-orange-100 hover:bg-orange-500 hover:text-white px-3 py-1.5 rounded-lg transition-all"
                        >
                          <Table2 size={11} /> {data.count} Kasus
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        <style dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
          .print\\:hidden { display: none !important; }
          .shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)], .shadow-xl, .shadow-sm { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
          .custom-scrollbar { overflow: visible !important; }
          .h-screen { height: auto !important; overflow: visible !important; }
          .overflow-hidden { overflow: visible !important; }
          .overflow-y-auto { overflow: visible !important; }
          main { overflow: visible !important; height: auto !important; padding: 0 !important; }
          .fixed, .sticky { position: static !important; }
        }
      `}} />

        {/* NotebookLM Shortcut Button */}
        <a
          href="https://notebooklm.google.com/notebook/0006be3a-8708-41f5-b2da-47cc54b04763"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-10 right-10 z-[160] flex items-center gap-3 bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 text-white p-4 rounded-3xl shadow-[0_20px_50px_rgba(13,148,136,0.3)] border border-teal-400/30 transition-all duration-700 hover:rounded-2xl hover:scale-105 group print:hidden overflow-hidden"
          title="Tanya AI Analis (NotebookLM)"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative flex items-center justify-center">
            <Bot size={24} className="relative z-10 transition-all duration-700 group-hover:scale-110 group-hover:rotate-12" />
            <Sparkles size={12} className="absolute -top-1 -right-1 text-emerald-300 animate-pulse" />
          </div>
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-[200px] transition-all duration-700 ease-in-out font-black tracking-widest text-[11px] uppercase">
            Tanya AI Analis
          </span>
          <div className="absolute -inset-2 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
        </a>
      </div>
    </div>
  );
}
