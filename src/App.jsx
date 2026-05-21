import React, { useState, useRef, useMemo, useEffect, useId } from 'react';
import { supabase } from './supabaseClient';
import { UploadCloud, Folder, FileText, CheckCircle, Trash2, AlertCircle, X, BarChart3, PieChart, Activity, Layers, Search, Table2, GitMerge, FileCode, CheckSquare, AlertTriangle, Stethoscope, User, Users, ActivitySquare, Download, TrendingUp, TrendingDown, ChevronRight, ChevronDown, Zap, Award, ArrowUpCircle, LogIn, LogOut, Menu, Printer, Moon, Sun, Calendar, Bed, Building2, LayoutDashboard, Bot, Sparkles, ClipboardList, Scissors, Settings, FileSpreadsheet, Eye, EyeOff, RefreshCw, Key, Send, Save } from 'lucide-react';
import PendingSaktiDashboard from './components/PendingSaktiDashboard.jsx';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas-pro';

export const saveAsPng = async (elementId, fileName) => {
  console.log('saveAsPng called for ID:', elementId, 'with file name:', fileName);
  const el = document.getElementById(elementId);
  if (!el) {
    console.error('Element not found in DOM with ID:', elementId);
    alert('⚠️ Error: Elemen grafik "' + elementId + '" tidak ditemukan di halaman! Silakan unggah file Excel terlebih dahulu.');
    return;
  }
  
  // Tampilkan indikator proses langsung di UI
  const loadingIndicator = document.createElement('div');
  loadingIndicator.style.position = 'fixed';
  loadingIndicator.style.top = '30px';
  loadingIndicator.style.left = '50%';
  loadingIndicator.style.transform = 'translateX(-50%)';
  loadingIndicator.style.background = 'rgba(15, 23, 42, 0.95)';
  loadingIndicator.style.color = '#fff';
  loadingIndicator.style.padding = '14px 28px';
  loadingIndicator.style.borderRadius = '12px';
  loadingIndicator.style.zIndex = '99999';
  loadingIndicator.style.fontSize = '13px';
  loadingIndicator.style.fontWeight = 'bold';
  loadingIndicator.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.4)';
  loadingIndicator.style.fontFamily = 'sans-serif';
  loadingIndicator.style.border = '1px solid rgba(255, 255, 255, 0.1)';
  loadingIndicator.innerText = '⏳ Sedang memproses dan mengunduh gambar PNG... Mohon tunggu sebentar.';
  document.body.appendChild(loadingIndicator);

  try {
    // Tunggu sebentar agar render indicator muncul sebelum JS blocking process
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const canvas = await html2canvas(el, { 
      backgroundColor: '#ffffff', 
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: true
    });
    
    const url = canvas.toDataURL('image/png');
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName.replace(/\s+/g, '_')}.png`;
    link.click();
    console.log('Successfully saved chart as PNG:', fileName);
  } catch (err) {
    console.error('Failed to save chart:', err);
    alert('⚠️ Gagal menyimpan gambar!\\nDetail Error: ' + err.message + '\\n\\nSilakan periksa console browser (F12) untuk melihat info selengkapnya.');
  } finally {
    if (loadingIndicator && loadingIndicator.parentNode) {
      loadingIndicator.parentNode.removeChild(loadingIndicator);
    }
  }
};

// --- DATABASE PERSISTENCE LAYER (IndexedDB) ---
const dbName = "AkuratIdrgDb";
const storeName = "IcdDictionary";

const initIcdDb = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "code" });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

// Predefined offline fallback for most common ICD codes (Diagnostics and Procedures)
const BASE_ICD_FALLBACK = {
  // ICD-10 Diagnostics
  "A09": "Gastroenteritis dan kolitis infeksius",
  "A09.9": "Gastroenteritis dan kolitis infeksius",
  "A099": "Gastroenteritis dan kolitis infeksius",
  "A90": "Demam dengue (Dengue Fever)",
  "A91": "Demam berdarah dengue (DHF)",
  "B05": "Campak dengan komplikasi",
  "B05.9": "Campak tanpa komplikasi (Measles)",
  "B059": "Campak tanpa komplikasi (Measles)",
  "E11": "Diabetes melitus tipe 2",
  "E11.9": "Diabetes melitus tipe 2 tanpa komplikasi",
  "E119": "Diabetes melitus tipe 2 tanpa komplikasi",
  "I10": "Hipertensi esensial (primer)",
  "J18": "Pneumonia tidak spesifik",
  "J18.9": "Pneumonia, organisme tidak spesifik",
  "J189": "Pneumonia, organisme tidak spesifik",
  "J45": "Asma",
  "J45.9": "Asma tidak spesifik",
  "J459": "Asma tidak spesifik",
  "K35": "Apendisitis akut",
  "K35.8": "Apendisitis akut lainnya",
  "K358": "Apendisitis akut lainnya",
  "N18": "Penyakit ginjal kronis (CKD)",
  "N18.9": "Penyakit ginjal kronis stadium akhir",
  "N189": "Penyakit ginjal kronis stadium akhir",
  "Z51": "Perawatan medis lainnya",
  "Z51.0": "Sesi radioterapi / kemoterapi",
  "Z510": "Sesi radioterapi / kemoterapi",
  
  // Hospital specific high-frequency Diagnostics Fallback
  "J96.0": "Gagal napas akut (Acute respiratory failure)",
  "J960": "Gagal napas akut (Acute respiratory failure)",
  "C50.9": "Keganasan / kanker payudara (Breast cancer)",
  "C509": "Keganasan / kanker payudara (Breast cancer)",
  "J22": "Infeksi saluran napas bawah akut tidak spesifik",
  "C53.9": "Keganasan / kanker serviks (Cervical cancer)",
  "C539": "Keganasan / kanker serviks (Cervical cancer)",
  "I25.1": "Penyakit jantung aterosklerotik (PJK / CAD)",
  "I251": "Penyakit jantung aterosklerotik (PJK / CAD)",
  "I25.9": "Penyakit jantung iskemik kronis tidak spesifik",
  "I259": "Penyakit jantung iskemik kronis tidak spesifik",
  "N35.9": "Struktur uretra tidak spesifik",
  "N359": "Struktur uretra tidak spesifik",
  "M32.1": "Lupus eritematosus sistemik dengan keterlibatan organ (SLE)",
  "M321": "Lupus eritematosus sistemik dengan keterlibatan organ (SLE)",
  "K01.1": "Gigi impaksi (Impacted teeth)",
  "K011": "Gigi impaksi (Impacted teeth)",
  "J18.0": "Bronkopneumonia tidak spesifik (Bronchopneumonia)",
  "J180": "Bronkopneumonia tidak spesifik (Bronchopneumonia)",
  "D63.0": "Anemia pada penyakit keganasan / kanker",
  "D630": "Anemia pada penyakit keganasan / kanker",
  "D63.8": "Anemia pada penyakit kronis lainnya",
  "D638": "Anemia pada penyakit kronis lainnya",
  "E86": "Dehidrasi / kekurangan volume cairan (Volume depletion)",
  "E87.1": "Hiponatremia / penurunan kadar natrium darah",
  "E871": "Hiponatremia / penurunan kadar natrium darah",
  "D64.9": "Anemia tidak spesifik (Anemia)",
  "D649": "Anemia tidak spesifik (Anemia)",
  "E87.6": "Hipokalemia / penurunan kadar kalium darah",
  "E876": "Hipokalemia / penurunan kadar kalium darah",
  "E83.5": "Gangguan metabolisme kalsium",
  "E835": "Gangguan metabolisme kalsium",
  
  // ICD-9 Procedures
  "99.18": "Injeksi atau infus elektrolit / cairan infus umum",
  "9918": "Injeksi atau infus elektrolit / cairan infus umum",
  "90.59": "Pemeriksaan laboratorium / mikroskopis darah",
  "9059": "Pemeriksaan laboratorium / mikroskopis darah",
  "99.21": "Injeksi antibiotik",
  "9921": "Injeksi antibiotik",
  "87.44": "Rontgen dada / Thoraks foto rutin",
  "8744": "Rontgen dada / Thoraks foto rutin",
  "89.52": "Elektrokardiogram (EKG) jantung",
  "8952": "Elektrokardiogram (EKG) jantung",
  "99.04": "Transfusi sel darah merah (Packed Red Cells / PRC)",
  "9904": "Transfusi sel darah merah (Packed Red Cells / PRC)",
  "99.29": "Injeksi atau infus obat terapeutik/profilaksis lainnya",
  "9929": "Injeksi atau infus obat terapeutik/profilaksis lainnya",
  "57.94": "Pemasangan kateter urin menetap (Foley Catheter)",
  "5794": "Pemasangan kateter urin menetap (Foley Catheter)",
  "93.57": "Pembalutan luka / perawatan luka",
  "9357": "Pembalutan luka / perawatan luka",
  "93.96": "Terapi oksigen / pemberian oksigen",
  "9396": "Terapi oksigen / pemberian oksigen",
  "99.10": "Infusi agen trombolitik (Streptokinase)",
  "9910": "Infusi agen trombolitik (Streptokinase)",
  "36.06": "Pemasangan stent arteri koroner non-drug-eluting",
  "3606": "Pemasangan stent arteri koroner non-drug-eluting",
  "36.07": "Pemasangan stent arteri koroner drug-eluting (DES)",
  "3607": "Pemasangan stent arteri koroner drug-eluting (DES)",
  "13.41": "Fakoemulsifikasi dan aspirasi katarak (Phaco)",
  "1341": "Fakoemulsifikasi dan aspirasi katarak (Phaco)",
  "39.95": "Hemodialisis ginjal",
  "3995": "Hemodialisis ginjal",
  "88.92": "Magnetic resonance imaging (MRI) otak",
  "8892": "Magnetic resonance imaging (MRI) otak",
  "95.12": "Angiografi fluoresen atau angioskopi mata",
  "9512": "Angiografi fluoresen atau angioskopi mata"
};

// Initialize window global cache
window.sakIcdMap = { ...BASE_ICD_FALLBACK, ...(window.sakIcdMap || {}) };
let globalIcdMap = window.sakIcdMap;

const loadIcdDictFromDb = async () => {
  const db = await initIcdDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => {
      const map = {};
      request.result.forEach((item) => {
        const code = String(item.code).trim().toUpperCase();
        const desc = String(item.desc).trim();
        map[code] = desc;
        
        // Save without dot to handle non-dotted queries
        const noDot = code.replace(/\./g, '');
        if (noDot !== code) {
          map[noDot] = desc;
        }
      });
      
      // Merge with base fallback so we don't lose pre-populated standard codes
      window.sakIcdMap = { ...BASE_ICD_FALLBACK, ...map };
      globalIcdMap = window.sakIcdMap;
      resolve(window.sakIcdMap);
    };
    request.onerror = (e) => reject(e.target.error);
  });
};

const saveIcdDictToDb = async (dictArray) => {
  const db = await initIcdDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const clearRequest = store.clear();
    clearRequest.onsuccess = () => {
      dictArray.forEach((item) => {
        store.put(item);
      });
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = (e) => reject(e.target.error);
  });
};

const getGoogleSheetCsvUrl = (url) => {
  if (!url) return "";
  let cleanUrl = url.trim();
  if (cleanUrl.includes("/export")) return cleanUrl;
  
  const matches = cleanUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (matches && matches[1]) {
    const id = matches[1];
    const gidMatch = cleanUrl.match(/[#&]gid=([0-9]+)/);
    const gidStr = gidMatch ? `&gid=${gidMatch[1]}` : "";
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv${gidStr}`;
  }
  return cleanUrl;
};

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toUpperCase().replace(/[^\w]/g, ''));
  const codeIdx = headers.indexOf("CODE");
  const strIdx = headers.indexOf("STR");
  
  if (codeIdx === -1 || strIdx === -1) {
    throw new Error("Format spreadsheet tidak valid. Kolom 'CODE' dan 'STR' tidak ditemukan.");
  }
  
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = parseCSVLine(line);
    const code = columns[codeIdx];
    const desc = columns[strIdx];
    
    if (code && desc) {
      result.push({
        code: String(code).trim().toUpperCase(),
        desc: String(desc).trim()
      });
    }
  }
  return result;
};

const parseCSVLine = (line) => {
  const result = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

const getIcdDescription = (code) => {
  if (!code || code === "-") return "";
  let cleaned = String(code).trim().toUpperCase();
  
  // Extract the first alphanumeric/dot token (the actual ICD code) if combined with description
  const codeMatch = cleaned.match(/^([A-Z0-9.]+)/);
  if (codeMatch) {
    cleaned = codeMatch[1];
  }
  
  const map = window.sakIcdMap || {};
  
  if (map[cleaned]) return map[cleaned];
  
  const noDot = cleaned.replace(/\./g, '');
  if (map[noDot]) return map[noDot];
  
  if (cleaned.includes(".")) {
    const baseCode = cleaned.split(".")[0];
    if (map[baseCode]) return map[baseCode];
  }
  
  return "";
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
];

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

const TABS = [
  { id: 'executive', label: 'Executive', icon: PieChart }, { id: 'report', label: 'Laporan', icon: Table2 }, { id: 'rekap', label: 'Rekap Kasus', icon: Layers },
  { id: 'mapping', label: 'Peta iDRG', icon: GitMerge }, { id: 'sl_cl_analysis', label: 'Analisis SL/CL', icon: Layers }, { id: 'dept', label: 'Kinerja Departemen', icon: Building2 }, { id: 'ksm', label: 'Kinerja KSM', icon: Users }, { id: 'dpjp', label: 'Kinerja DPJP', icon: User },
  { id: 'insight_sosialisasi', label: 'Insight Sosialisasi', icon: Sparkles },
  { id: 'naik_kelas', label: 'Hak Kelas', icon: BarChart3 }, { id: 'icu', label: 'Intensif ICU', icon: ActivitySquare }, { id: 'topup', label: 'Potensi Top Up', icon: ArrowUpCircle }, { id: 'discrepancy', label: 'Akurasi Input INA-iDRG', icon: FileCode }, { id: 'audit', label: 'Audit Coding', icon: CheckSquare }, { id: 'kpi_coder', label: 'KPI Coder', icon: Award }, { id: 'readmisi', label: 'Readmisi & Fragmentasi', icon: RefreshCw },
  { id: 'pending_sakti', label: 'Analisis Pending', icon: FileSpreadsheet },
  { id: 'settings_ksm', label: 'Pengaturan KSM', icon: Settings },
  { id: 'user_management', label: 'Manajemen Akses', icon: ClipboardList }
];

const normDpjp = (name) => {
  if (!name || name.trim() === '' || name.trim() === '-') return 'UNKNOWN';
  
  // 1. Clean the string: replace punctuation with spaces, trim, uppercase
  let n = String(name).toUpperCase()
    .replace(/[.,/()\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Strip professional prefixes at the start
  n = n.replace(/^\b(DRG|DR|PROF|KMN)\b\s*/g, '');
  
  // 3. Strip professional/academic suffixes (degrees) at the end
  n = n.replace(/\b(SP\s*[A-Z]+([\s-]*[A-Z]+)*)\b/g, '');
  n = n.replace(/\b(M\s*KES|M\s*SC|PH\s*D|MARS|MMRS|MH|M\s*KED|MKM|FIHA|FACS|FICS|FISQUA|FINS|FINA|FAPSR)\b/g, '');

  // Reclean double spaces
  n = n.replace(/\s+/g, ' ').trim();

  // 4. Canonical typo mapping (smart grouping dictionary)
  const aliasMap = {
    'TITO PORBA': 'TITO PURBA',
    'TITO PURBAA': 'TITO PURBA',
    'TITO PARBA': 'TITO PURBA',
    'TITO PURBA SP B': 'TITO PURBA',
    'TITO PORBA SP B': 'TITO PURBA'
  };

  if (aliasMap[n]) {
    n = aliasMap[n];
  }

  return n || 'UNKNOWN';
};

// Mask DPJP and Coder names for privacy compliance
const maskName = (name) => {
  if (!name || name.trim() === '' || name.trim() === '-') return '-';
  const parts = name.split(',');
  let mainName = parts[0];
  const titlePart = parts.slice(1).join(',');

  // Extract leading number if any (like "020 ")
  const numMatch = mainName.match(/^(\d+\s+)?(.*)$/);
  const numberPrefix = numMatch ? (numMatch[1] || '') : '';
  const actualName = numMatch ? numMatch[2] : mainName;

  const maskedWords = actualName.split(/\s+/).map(word => {
    const upper = word.toUpperCase();
    if (upper === 'KATHARINA') return 'KAT**R*N*';
    if (upper === 'SETYAWATI') return 'S*T**W*T*';
    if (upper === 'ENJANG') return 'EN***G';
    if (upper === 'NURDIANSYAH') return 'NU****S*H';
    if (word.length <= 2) return word.toUpperCase();
    
    let chars = upper.split('');
    const keepStart = chars.length > 5 ? 2 : 1;
    for (let i = keepStart; i < chars.length - 1; i++) {
      if (/[AEIOUYH]/.test(chars[i])) {
        chars[i] = '*';
      } else if (chars.length > 5 && i % 2 === 0) {
        chars[i] = '*';
      }
    }
    return chars.join('');
  });

  let res = numberPrefix + maskedWords.join(' ');
  if (titlePart) {
    res += ',' + titlePart;
  }
  return res;
};

const resolveCache = new Map();

const resolveKsmDept = (dpjp, overrides = {}) => {
  if (!dpjp || dpjp.trim() === '' || dpjp.trim() === '-') return { ksm: 'Kedokteran Umum', dept: 'Department of Medicine' };
  
  // Cache key menyertakan overrides agar perubahan manual KSM langsung diterapkan
  const overridesSig = Object.keys(overrides).length > 0 ? JSON.stringify(overrides) : '';
  const cacheKey = dpjp + '||' + overridesSig;
  
  if (resolveCache.has(cacheKey)) {
    return resolveCache.get(cacheKey);
  }
  
  const res = _resolveKsmDept(dpjp, overrides);
  resolveCache.set(cacheKey, res);
  return res;
};

const _resolveKsmDept = (dpjp, overrides = {}) => {
  if (!dpjp || dpjp.trim() === '' || dpjp.trim() === '-') return { ksm: 'Kedokteran Umum', dept: 'Department of Medicine' };

  // --- CHECK OVERRIDES FIRST ---
  const np = normDpjp(dpjp);
  if (overrides && overrides[np]) {
    const o = overrides[np];
    return typeof o === 'string' ? { ksm: o, dept: 'Override' } : o;
  }

  // --- CHECK FOR NON-DOCTOR (FISIOTERAPIS) ---
  // Jika nama tidak diawali dengan gelar dr, drg, prof, kmn, dan tidak mengandung spesialis (Sp.)
  const rawCleaned = String(dpjp).toUpperCase()
    .replace(/[.,/()\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const hasDoctorIndication = /^(DRG|DR|PROF|KMN)\b/.test(rawCleaned) || /\b(SP[A-Z]*|SP)\b/.test(rawCleaned);
  if (!hasDoctorIndication) {
    return { ksm: 'Fisioterapis', dept: 'Department of Supporting Medicine' };
  }

  // 1. ADVANCED NORMALIZATION

  let n = String(dpjp).toUpperCase()
    .replace(/(PROF|DRG|DR|M\.KES|M\.SC|PH\.D|FICS|FACS|FIHA|MMRS|MHPE|MARS|FISQUA|FINS|FINA|FMIN|FANMB|FCPM|FIPM|KMN|AIFO|FAPSR|MH|M\.KED|KLIN|FASGE|FCS|DCN|MKM|DIC|PHD)/g, '')
    .replace(/[.,/()\-]/g, ' ')
    .replace(/SUBSP/g, ' SUBSP ') // Ensure SUBSP is its own word
    .replace(/SUB\s*SP/g, ' SUBSP ')
    .replace(/\s+/g, ' ')
    .trim();

  const check = (keys) => {
    return keys.some(k => {
      const normalizedK = k.toUpperCase().replace(/[.,/()\-]/g, ' ').replace(/\s+/g, ' ').trim();
      // Match both joined (SPPD) and separated (SP PD)
      const regexJoined = new RegExp('\\b' + normalizedK.replace(/\s+/g, '') + '\\b', 'i');
      const regexSeparated = new RegExp('\\b' + normalizedK.split('').join('\\s*') + '\\b', 'i');
      return regexJoined.test(n) || regexSeparated.test(n);
    });
  };

  // 2. GRANULAR MAPPING (KKI 2026 Nomenclatures)

  // --- A. GASTROENTEROLOGY & DIGESTIF ---
  if (check(['GASTRO', 'KGEH', 'DIGESTIF', 'KBD', 'BD'])) {
    const dept = 'Department of Gastroenterology';
    if (check(['SPPD', 'PENYAKIT DALAM']) || check(['KGEH'])) return { ksm: 'Dokter Spesialis Penyakit Dalam Konsultan Gastroenterohepatologi', dept };
    if (check(['SPA', 'ANAK', 'SPAK'])) return { ksm: 'Dokter Spesialis Anak Konsultan Gastroenterologi-hepatologi', dept };
    if (check(['SPB', 'BEDAH', 'BD', 'KBD', 'DIGESTIF'])) return { ksm: 'Dokter Spesialis Bedah Konsultan Bedah Digestif', dept };
  }

  // --- B. CARDIOLOGY & VASCULAR ---
  if (check(['SPJP', 'JANTUNG', 'SPBTKV', 'BTKV', 'IKKV', 'VAS', 'BVE', 'KKV', 'KARDIOVASKULAR', 'KV', 'JD', 'PRKV', 'BKV', 'PDKKV', 'SUBBVE'])) {
    const dept = 'Department of Cardiology';
    if (check(['SPJP', 'JANTUNG', 'PRKV'])) {
      if (check(['INTERVENSI', 'KI'])) return { ksm: 'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Kardiologi Intervensi', dept };
      if (check(['EKO', 'EKOKARDIOGRAFI'])) return { ksm: 'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Ekokardiografi', dept };
      if (check(['ARITMIA', 'AR'])) return { ksm: 'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Aritmia', dept };
      if (check(['GAGAL JANTUNG', 'GJ'])) return { ksm: 'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Gagal Jantung', dept };
      if (check(['VASKULAR', 'VAS', 'KV'])) return { ksm: 'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Kedokteran Vaskular', dept };
      if (check(['PENCITRAAN', 'PK'])) return { ksm: 'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Pencitraan Kardiovaskular', dept };
      if (check(['PEDIATRIK', 'BAWAAN', 'JPB', 'KPPJB', 'KPJB'])) return { ksm: 'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Kardiologi Pediatrik dan Penyakit Jantung Bawaan', dept };
      if (check(['TERAPI INTENSIF', 'TI'])) return { ksm: 'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Terapi Intensif', dept };
      if (check(['KEGAWATAN', 'IKKV', 'IKK'])) return { ksm: 'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Intensif & Kegawatan Kardiovascular', dept };
      if (check(['PREVENSI', 'REHABILITASI', 'PRK', 'PRKV', 'SUBSPPRKV'])) return { ksm: 'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Prevensi dan Rehabilitasi Kardiovaskular', dept };
      return { ksm: 'Dokter Spesialis Jantung dan Pembuluh Darah', dept };
    }
    if (check(['SPBTKV', 'BTKV'])) {
      if (check(['JD', 'T'])) return { ksm: 'Dokter Spesialis Bedah Toraks Kardiovaskular', dept };
      return { ksm: 'Dokter Spesialis Bedah Toraks Kardiovaskular', dept };
    }
    if (check(['SPB', 'BEDAH', 'BKV']) && check(['VASKULAR', 'BVE', 'BKV', 'KV', 'SUBBVE'])) return { ksm: 'Dokter Spesialis Bedah Konsultan Bedah Vaskular dan Endovaskular', dept };
    if (check(['KKV', 'PDKKV'])) return { ksm: 'Dokter Spesialis Penyakit Dalam Konsultan Kardiovaskular', dept };
  }
  if (check(['SPA', 'ANAK', 'SPAK']) && check(['KARDIO', 'KV'])) return { ksm: 'Dokter Spesialis Anak Konsultan Kardiologi', dept: 'Department of Cardiology' };
  if (check(['SPKFR']) && check(['KARDIO', 'RESPIRASI', 'KR'])) return { ksm: 'Dokter Spesialis Kedokteran Fisik dan Rehabilitasi Konsultan Rehabilitasi Kardiorespirasi', dept: 'Department of Cardiology' };
  if (check(['SPAN', 'ANESTESI']) && check(['KARDIO', 'KV', 'AKV'])) return { ksm: 'Dokter Spesialis Anestesiologi dan Terapi Intensif Konsultan Anestesi Kardiovaskular', dept: 'Department of Cardiology' };

  // --- C. MEDICINE, PSYCHIATRY & OTHERS ---
  if (check(['SPPD', 'PENYAKIT DALAM', 'GIZI', 'FARMAKOLOGI', 'OKUPASI', 'JIWA', 'SPKJ', 'SPP', 'PARU', 'SPGK'])) {
    const dept = 'Department of Medicine';
    if (check(['SPPD', 'PENYAKIT DALAM'])) {
      if (check(['ENDOKRIN', 'METABOLIK', 'DIABETES', 'KEMD'])) return { ksm: 'Dokter Spesialis Penyakit Dalam Konsultan Endokrinologi Metabolik dan Diabetes', dept };
      if (check(['GERIATRI', 'KGER', 'GER'])) return { ksm: 'Dokter Spesialis Penyakit Dalam Konsultan Geriatri', dept };
      if (check(['PULMONOLOGI', 'PARU', 'KP'])) return { ksm: 'Dokter Spesialis Penyakit Dalam Konsultan Pulmonologi dan Medik Kritis', dept };
      if (check(['PSIKOSOMATIK', 'PALIATIF', 'PSI'])) return { ksm: 'Dokter Spesialis Penyakit Dalam Konsultan Psikosomatik dan Paliatif', dept };
    }
    if (check(['SPP', 'PARU'])) {
      if (check(['KRITIS', 'PMK'])) return { ksm: 'Dokter Spesialis Paru Konsultan Pulmonologi dan Medik Kritis', dept };
      return { ksm: 'Dokter Spesialis Paru', dept };
    }

    if (check(['GIZI', 'SPGK'])) {
      if (check(['METABOLIK', 'KM'])) return { ksm: 'Dokter Spesialis Gizi Klinik Konsultan Kelainan Metabolik', dept };
      if (check(['KRITIS', 'NPK', 'PK'])) return { ksm: 'Dokter Spesialis Gizi Klinik Konsultan Nutrisi pada Penyakit Kritis', dept };
      return { ksm: 'Dokter Spesialis Gizi Klinik', dept };
    }
    if (check(['FARMAKOLOGI', 'SPFK'])) return { ksm: 'Dokter Spesialis Farmakologi Klinik', dept };
    if (check(['OKUPASI', 'SPOK'])) return { ksm: 'Dokter Spesialis Kedokteran Okupasi', dept };
    if (check(['SPKFR']) && check(['GERIATRI'])) return { ksm: 'Dokter Spesialis Kedokteran Fisik dan Rehabilitasi Konsultan Rehabilitasi Geriatri', dept };
    if (check(['JIWA', 'SPKJ'])) {
      if (check(['ADIKSI', 'AD'])) return { ksm: 'Dokter Spesialis Kedokteran Jiwa Konsultan Psikiatri Adiksi', dept };
      if (check(['ANAK', 'REMAJA', 'AR'])) return { ksm: 'Dokter Spesialis Kedokteran Jiwa Konsultan Psikiatri Anak & Remaja', dept };
      if (check(['FORENSIK', 'FOR'])) return { ksm: 'Dokter Spesialis Kedokteran Jiwa Konsultan Psikiatri Forensik', dept };
      if (check(['PSIKOTERAPI', 'PT'])) return { ksm: 'Dokter Spesialis Kedokteran Jiwa Konsultan Psikoterapi', dept };
      if (check(['LIAISON', 'CLP'])) return { ksm: 'Dokter Spesialis Kedokteran Jiwa Konsultan Psikiatri dan Liaison', dept };
      if (check(['GERIATRI', 'GER'])) return { ksm: 'Dokter Spesialis Kedokteran Jiwa Konsultan Geriatri', dept };
      if (check(['PSIKOSEKSUAL', 'MARITAL', 'PSM'])) return { ksm: 'Dokter Spesialis Kedokteran Jiwa Konsultan Psikiatri Psikoseksual dan Marital', dept };
      if (check(['PEREMPUAN', 'PEW'])) return { ksm: 'Dokter Spesialis Kedokteran Jiwa Konsultan Psikiatri Perempuan', dept };
      if (check(['PSIKOMETRIK', 'PM'])) return { ksm: 'Dokter Spesialis Kedokteran Jiwa Konsultan Psikometrik', dept };
      return { ksm: 'Dokter Spesialis Kedokteran Jiwa', dept };
    }
    if (check(['SPPD', 'PENYAKIT DALAM'])) return { ksm: 'Dokter Spesialis Penyakit Dalam', dept };
  }

  // --- D. NEUROLOGY & NEUROSURGERY ---
  if (check(['SPN', 'SPS', 'NEUROLOGI', 'SPBS', 'BEDAH SARAF', 'SPNEURO'])) {
    const dept = 'Department of Neurologi';
    if (check(['SPN', 'SPS', 'NEUROLOGI', 'SPNEURO'])) {
      if (check(['EPILEPSI', 'NEUROFISIOLOGI', 'ENK'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Epilepsi dan Neurofisiologi', dept };
      if (check(['INFEKSI', 'NI'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Neuro Infeksi', dept };
      if (check(['NYERI', 'NN'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Neurologi Nyeri', dept };
      if (check(['VASKULAR', 'NV'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Neurovaskular', dept };
      if (check(['OTOLOGI', 'OPTHALMOLOGI', 'NO'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Neurootologi / Neuroopthalmologi', dept };
      if (check(['INTERVENSI', 'NIT'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Neurointervensi', dept };
      if (check(['IMAGING', 'NIM'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Neuroimaging', dept };
      if (check(['TIDUR', 'GT'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Gangguan Tidur (Sleep Disorder)', dept };
      if (check(['TEPI', 'ST'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Saraf Tepi', dept };
      if (check(['ANAK', 'NP'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Saraf Anak', dept };
      if (check(['DEGENERATIF', 'BEHAVIOUR', 'NDB'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Neurodegeneratif / Neurobehaviour', dept };
      if (check(['ONKOLOGI', 'NOK'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Neuroonkologi', dept };
      if (check(['GERAK', 'GG'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Gangguan Gerak (Movement Disorder)', dept };
      if (check(['KRITIKAL', 'INTENSIF', 'NKI'])) return { ksm: 'Dokter Spesialis Neurologi Konsultan Neurokritikal dan Intensif', dept };
      return { ksm: 'Dokter Spesialis Neurologi', dept };
    }
    if (check(['SPBS', 'BEDAH SARAF'])) {
      if (check(['FUNGSIONAL', 'NF'])) return { ksm: 'Dokter Spesialis Bedah Saraf Konsultan Neurofungsional', dept };
      if (check(['ONKOLOGI', 'SKULL BASE', 'NO'])) return { ksm: 'Dokter Spesialis Bedah Saraf Konsultan Neuroonkologi + Skull Base', dept };
      if (check(['SPINE', 'TB'])) return { ksm: 'Dokter Spesialis Bedah Saraf Konsultan Neurospine', dept };
      if (check(['VASKULAR', 'NV'])) return { ksm: 'Dokter Spesialis Bedah Saraf Konsultan Neurovaskular', dept };
      if (check(['PEDIATRIK', 'PED'])) return { ksm: 'Dokter Spesialis Bedah Saraf Konsultan Pediatrik', dept };
      if (check(['TRAUMA', 'NT'])) return { ksm: 'Dokter Spesialis Bedah Saraf Konsultan Neurotrauma', dept };
      return { ksm: 'Dokter Spesialis Bedah Saraf', dept };
    }
  }
  if (check(['SPA', 'ANAK', 'SPAK']) && check(['NEUROPEDIATRI', 'NEURO', 'NP'])) return { ksm: 'Dokter Spesialis Anak Konsultan Neuropediatri', dept: 'Department of Neurologi' };
  if (check(['SPKFR']) && check(['NEUROMUSKULAR', 'NM'])) return { ksm: 'Dokter Spesialis Kedokteran Fisik dan Rehabilitasi Konsultan Neuromuskular', dept: 'Department of Neurologi' };
  if (check(['SPAN', 'ANESTESI']) && check(['NEURO', 'KNA', 'NANCC'])) return { ksm: 'Dokter Spesialis Anestesiologi dan Terapi Intensif Konsultan Neuro Anestesi dan Neuro Critical Care', dept: 'Department of Neurologi' };

  // --- E. URO-NEPHROLOGY ---
  if (check(['SPU', 'UROLOGI', 'KGH', 'GINJAL', 'NEFRO'])) {
    const dept = 'Department of Uro-Nephrology';
    if (check(['SPU', 'UROLOGI'])) {
      if (check(['ANDROLOGI', 'AND'])) return { ksm: 'Dokter Spesialis Urologi Konsultan Urologi Andrologi', dept };
      if (check(['PEREMPUAN', 'FUNGSIONAL', 'NEURO', 'FNU'])) return { ksm: 'Dokter Spesialis Urologi Konsultan Urologi Perempuan, Fungsional, dan Neuro - Urologi', dept };
      if (check(['ONKOLOGI', 'ONK'])) return { ksm: 'Dokter Spesialis Urologi Konsultan Urologi Onkologi', dept };
      if (check(['PEDIATRIK', 'PED'])) return { ksm: 'Dokter Spesialis Urologi Konsultan Urologi Pediatrik', dept };
      if (check(['REKONSTRUKSI', 'REK'])) return { ksm: 'Dokter Spesialis Urologi Konsultan Urologi Rekonstruksi', dept };
      if (check(['TRANSPLANTASI', 'TRANS'])) return { ksm: 'Dokter Spesialis Urologi Konsultan Urologi Transplantasi', dept };
      return { ksm: 'Dokter Spesialis Urologi', dept };
    }
    if (check(['SPPD', 'PENYAKIT DALAM']) && check(['GINJAL', 'HIPERTENSI', 'KGH', 'GH'])) return { ksm: 'Dokter Spesialis Penyakit Dalam Konsultan Ginjal Hipertensi', dept };
    if (check(['SPA', 'ANAK', 'SPAK']) && check(['NEFROLOGI', 'NEFRO'])) return { ksm: 'Dokter Spesialis Anak Konsultan Nefrologi Anak', dept };
    if (check(['SPOG']) && check(['UROGINEKOLOGI', 'UR'])) return { ksm: 'Dokter Spesialis Obstetri dan Ginekologi Konsultan Uroginekologi Rekonstruksi', dept };
  }

  // --- F. MATERNAL & CHILD ---
  if (check(['SPOG', 'KEBIDANAN', 'KANDUNGAN', 'SPA', 'ANAK', 'SPAK', 'SPBA', 'SPOGK'])) {
    const dept = 'Department of Maternal and Child';
    if (check(['SPOG', 'KEBIDANAN', 'KANDUNGAN', 'SPOGK'])) {
      if (check(['FER', 'FERTILITAS', 'ENDOKRIN'])) return { ksm: 'Dokter Spesialis Obstetri dan Ginekologi Konsultan Fertilitas dan Endokrinologi Reproduksi', dept };
      if (check(['FETOMATERNAL', 'KFM'])) return { ksm: 'Dokter Spesialis Obstetri dan Ginekologi Konsultan Fetomaternal', dept };
      if (check(['SOSIAL', 'OBGINSOS'])) return { ksm: 'Dokter Spesialis Obstetri dan Ginekologi Konsultan Obstetri dan Ginekologi Sosial', dept };
      if (check(['ONKOLOGI', 'ONK'])) return { ksm: 'Dokter Spesialis Obstetri dan Ginekologi Konsultan Onkologi Ginekologi', dept };
      return { ksm: 'Dokter Spesialis Obstetri dan Ginekologi', dept };
    }
    if (check(['SPA', 'ANAK', 'SPAK'])) {
      if (check(['ENDOKRIN', 'ENDO'])) return { ksm: 'Dokter Spesialis Anak Konsultan Endokrinologi', dept };
      if (check(['NEONATOLOGI', 'NEO'])) return { ksm: 'Dokter Spesialis Anak Konsultan Neonatologi', dept };
      if (check(['NUTRISI', 'METABOLIK', 'NPM'])) return { ksm: 'Dokter Spesialis Anak Konsultan Nutrisi dan Penyakit Metabolik', dept };
      if (check(['RESPIROLOGI', 'RESP', 'RESPI'])) return { ksm: 'Dokter Spesialis Anak Konsultan Respirologi', dept };
      if (check(['TUMBUH KEMBANG', 'TKPS'])) return { ksm: 'Dokter Spesialis Anak Konsultan Tumbuh Kembang - Pediatri Sosial', dept };
      if (check(['EMERGENSI', 'INTENSIF', 'ERIK', 'ETIA'])) return { ksm: 'Dokter Spesialis Anak Konsultan Emergensi dan Terapi Intensif Anak', dept };
      if (check(['ALERGI', 'IMUNOLOGI', 'RHEUMATOLOGI', 'AIR'])) return { ksm: 'Dokter Spesialis Anak Konsultan Alergi Imunologi dan Rheumatologi', dept };
      if (check(['INFEKSI', 'TROPIK', 'IPT'])) return { ksm: 'Dokter Spesialis Anak Konsultan Infeksi dan Penyakit Tropis', dept };
      if (check(['HEMATOONKOLOGI', 'HOK'])) return { ksm: 'Dokter Spesialis Anak Konsultan Hematoonkologi', dept };
      return { ksm: 'Dokter Spesialis Anak', dept };
    }
    if (check(['SPBA', 'BEDAH ANAK'])) {
      if (check(['UROGENITAL', 'UG', 'UA'])) return { ksm: 'Dokter Spesialis Bedah Anak Konsultan Bedah Urogenital Anak', dept };
      if (check(['DIGESTIF', 'DA'])) return { ksm: 'Dokter Spesialis Bedah Anak Konsultan Bedah Digestif Anak', dept };
      return { ksm: 'Dokter Spesialis Bedah Anak', dept };
    }
  }
  if (check(['SPKFR']) && check(['PEDIATRIK', 'PED'])) return { ksm: 'Dokter Spesialis Kedokteran Fisik dan Rehabilitasi Konsultan Rehabilitasi Pediatrik', dept: 'Department of Maternal and Child' };
  if (check(['SPAN', 'ANESTESI']) && check(['OBSTETRI', 'AO'])) return { ksm: 'Dokter Spesialis Anestesiologi dan Terapi Intensif Konsultan Anestesi Obstetri', dept: 'Department of Maternal and Child' };
  if (check(['SPAN', 'ANESTESI']) && check(['PEDIATRI', 'AP', 'ANPED'])) return { ksm: 'Dokter Spesialis Anestesiologi dan Terapi Intensif Konsultan Anestesi Pediatri', dept: 'Department of Maternal and Child' };

  // --- G. ONCOLOGY ---
  if (check(['ONKRAD', 'ONKOLOGI RADIASI', 'SPONKRAD', 'KHOM', 'ONKOLOGI', 'HOK', 'HOM', 'BKONK', 'BK ONK', 'ONK'])) {
    const dept = 'Department of Oncology';
    if (check(['ONKRAD', 'ONKOLOGI RADIASI', 'SPONKRAD'])) {
      if (check(['ABDOMINO', 'KAP'])) return { ksm: 'Dokter Spesialis Onkologi Radiasi Konsultan Keganasan Abdomino - Pelvik', dept };
      if (check(['KEPALA', 'SSP', 'SARAF', 'KLSSP'])) return { ksm: 'Dokter Spesialis Onkologi Radiasi Konsultan Kepala, Leher dan Sistem Saraf Pusat', dept };
      if (check(['TORAKS', 'PEDIATRIK', 'LIMPHO', 'TPL'])) return { ksm: 'Dokter Spesialis Onkologi Radiasi Konsultan Toraks, Pediatrik dan Limpho-muskuloskeletal', dept };
      return { ksm: 'Dokter Spesialis Onkologi Radiasi', dept };
    }
    if (check(['SPPD', 'PENYAKIT DALAM']) && check(['HEMATOLOGI', 'ONKOLOGI', 'KHOM', 'HOM', 'SUBSPHOM'])) return { ksm: 'Dokter Spesialis Penyakit Dalam Konsultan Hematologi Onkologi Medik', dept };
    if (check(['SPB', 'BEDAH', 'BKONK', 'BK ONK']) && check(['ONKOLOGI', 'ONK', 'SUBSPONK', 'BKONK', 'BK ONK'])) return { ksm: 'Dokter Spesialis Bedah Konsultan Bedah Onkologi', dept };
    if (check(['SPTHT', 'THT', 'SPTHTBKL', 'THTBKL']) && check(['ONKOLOGI', 'ONK', 'SUBSPONK'])) return { ksm: 'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Onkologi - Bedah Kepala Leher', dept };
    if (check(['SPBM', 'SPBMM']) && check(['NEOPLASMA', 'NK'])) return { ksm: 'Dokter Gigi Dokter Spesialis Bedah Mulut Neoplasma dan Kista Bedah Mulut dan Maksilofasial', dept };
  }

  // --- H. ANESTHESIOLOGY ---
  if (check(['SPAN', 'ANESTESI', 'SPANTI'])) {
    const dept = 'Department of Anesthesiology';
    if (check(['REGIONAL', 'AR'])) return { ksm: 'Dokter Spesialis Anestesiologi dan Terapi Intensif Konsultan Anestesi Regional', dept };
    if (check(['MANAJEMEN NYERI', 'NYERI', 'MN'])) return { ksm: 'Dokter Spesialis Anestesiologi dan Terapi Intensif Konsultan Manajemen Nyeri', dept };
    if (check(['INTENSIVE CARE', 'KIC', 'TI'])) return { ksm: 'Dokter Spesialis Anestesiologi dan Terapi Intensif Konsultan Intensive Care (KIC)', dept };
    return { ksm: 'Dokter Spesialis Anestesiologi dan Terapi Intensif', dept };
  }

  // --- I. SUPPORTING MEDICINE (Laboratory/Pathology) ---
  if (check(['SPPK', 'SPPA', 'SPMK'])) {
    const dept = 'Department of Supporting Medicine';
    if (check(['SPPK'])) {
      if (check(['HEMATOLOGI', 'HK'])) return { ksm: 'Dokter Spesialis Patologi Klinik Konsultan Hematologi Klinik', dept };
      if (check(['ONKOLOGI', 'OK'])) return { ksm: 'Dokter Spesialis Patologi Klinik Konsultan Onkologi Klinik', dept };
      if (check(['NEFROLOGI', 'RESPIRASI', 'NR'])) return { ksm: 'Dokter Spesialis Patologi Klinik Konsultan Nefrologi dan Respirasi', dept };
      if (check(['GASTRO', 'GEH'])) return { ksm: 'Dokter Spesialis Patologi Klinik Konsultan Gastroenterohepatologi', dept };
      if (check(['INFEKSI', 'PI'])) return { ksm: 'Dokter Spesialis Patologi Klinik Konsultan Penyakit Infeksi', dept };
      if (check(['BANK DARAH', 'DARAH', 'BDKT'])) return { ksm: 'Dokter Spesialis Patologi Klinik Konsultan Bank Darah & Kedokteran Transfusi', dept };
      if (check(['IMUNOLOGI', 'IK'])) return { ksm: 'Dokter Spesialis Patologi Klinik Konsultan Imunologi Klinik', dept };
      if (check(['ENDOKRIN', 'EM'])) return { ksm: 'Dokter Spesialis Patologi Klinik Konsultan Endokrin & Metabolisme', dept };
      return { ksm: 'Dokter Spesialis Patologi Klinik', dept };
    }
    if (check(['SPPA'])) {
      if (check(['UROPATOLOGI', 'URL'])) return { ksm: 'Dokter Spesialis Patologi Anatomi Konsultan Patologi Uropatologi Reproduksi Laki-laki', dept };
      if (check(['KULIT', 'KA'])) return { ksm: 'Dokter Spesialis Patologi Anatomi Konsultan Patologi Kulit dan Adneksa', dept };
      if (check(['DIGESTIF', 'DH'])) return { ksm: 'Dokter Spesialis Patologi Anatomi Konsultan Patologi Digestif Hepatobilier', dept };
      if (check(['HEMATOLIMFOID', 'HLE'])) return { ksm: 'Dokter Spesialis Patologi Anatomi Konsultan Patologi Hematolimfoid dan Endokrin', dept };
      if (check(['OBSTETRI', 'GINEKOLOGI', 'PAYUDARA', 'OGP'])) return { ksm: 'Dokter Spesialis Patologi Anatomi Konsultan Patologi Obstetri Ginekologi Payudara', dept };
      if (check(['SITOPATOLOGI', 'SP'])) return { ksm: 'Dokter Spesialis Patologi Anatomi Konsultan Sitopatologi', dept };
      if (check(['MUSKULOSKELETAL', 'MS'])) return { ksm: 'Dokter Spesialis Patologi Anatomi Konsultan Patologi Muskuloskeletal', dept };
      if (check(['SARAF', 'MATA', 'SM'])) return { ksm: 'Dokter Spesialis Patologi Anatomi Konsultan Patologi Saraf dan Mata', dept };
      if (check(['KARDIOVASKULAR', 'KRM'])) return { ksm: 'Dokter Spesialis Patologi Anatomi Konsultan Patologi Kardiovaskular Respirasi dan Mediastinum', dept };
      return { ksm: 'Dokter Spesialis Patologi Anatomi', dept };
    }
    if (check(['SPMK'])) return { ksm: 'Dokter Spesialis Mikrobiologi Klinik', dept };
  }
  if (check(['SPKFR'])) return { ksm: 'Dokter Spesialis Kedokteran Fisik dan Rehabilitasi', dept: 'Department of Supporting Medicine' };

  // --- J. DERMATOLOGY, PLASTIC & DENTAL ---
  if (check(['SPDVE', 'SPKK', 'SPKKK', 'SPBPRE', 'BPRE', 'SPB PRE', 'BEDAH PLASTIK', 'SPKG', 'GIGI', 'SPORT', 'SPPM', 'SPPERIO', 'SPPROS', 'SPKGA'])) {
    const dept = 'Department of Dermatology & Aesthetic';
    if (check(['SPDVE', 'SPKK', 'SPKKK'])) {
      if (check(['GERIATRI', 'GER'])) return { ksm: 'Dokter Spesialis Dermatologi, Venereologi, dan Estetika Konsultan Geriatri', dept };
      if (check(['VENEREOLOGI', 'V'])) return { ksm: 'Dokter Spesialis Dermatologi, Venereologi, dan Estetika Konsultan Venereologi', dept };
      if (check(['ANAK', 'DA'])) return { ksm: 'Dokter Spesialis Dermatologi, Venereologi, dan Estetika Konsultan Dermatologi Anak', dept };
      if (check(['ONKOLOGI', 'OBK'])) return { ksm: 'Dokter Spesialis Dermatologi, Venereologi, dan Estetika Konsultan Onkologi dan Bedah Kulit', dept };
      if (check(['KOSMETIK', 'ESTETIK', 'DKE'])) return { ksm: 'Dokter Spesialis Dermatologi, Venereologi, dan Estetika Konsultan Dermatologi Kosmetik dan Estetik', dept };
      if (check(['ALERGI', 'DAI'])) return { ksm: 'Dokter Spesialis Dermatologi, Venereologi, dan Estetika Konsultan Dermato Alergi Imunologi', dept };
      if (check(['TROPIK', 'DT'])) return { ksm: 'Dokter Spesialis Dermatologi, Venereologi, dan Estetika Konsultan Dermatologi Tropis', dept };
      return { ksm: 'Dokter Spesialis Dermatologi, Venereologi, dan Estetika', dept };
    }
    if (check(['SPBPRE', 'BPRE', 'SPB PRE', 'BEDAH PLASTIK'])) {
      if (check(['LUKA BAKAR', 'LBL'])) return { ksm: 'Dokter Spesialis Bedah Plastik, Rekonstruksi, dan Estetik Konsultan Bidang Luka Bakar', dept };
      if (check(['ESTETIK LANJUT', 'EL'])) return { ksm: 'Dokter Spesialis Bedah Plastik, Rekonstruksi, dan Estetik Konsultan Bidang Bedah Estetik Lanjut', dept };
      if (check(['KM', 'K M'])) return { ksm: 'Dokter Spesialis Bedah Plastik, Rekonstruksi, dan Estetik', dept };
      if (check(['MO'])) return { ksm: 'Dokter Spesialis Bedah Plastik, Rekonstruksi, dan Estetik', dept };
      return { ksm: 'Dokter Spesialis Bedah Plastik, Rekonstruksi, dan Estetik', dept };
    }
    if (check(['SPKG', 'GIGI', 'SPORT', 'SPPM', 'SPPERIO', 'SPPROS', 'SPKGA'])) {
      if (check(['KONSERVASI', 'SPKG'])) return { ksm: 'Dokter Gigi Spesialis Konservasi Gigi', dept };
      if (check(['ORTHODONTI', 'SPORT'])) return { ksm: 'Dokter Gigi Spesialis Orthodonti', dept };
      if (check(['PENYAKIT MULUT', 'SPPM'])) return { ksm: 'Dokter Gigi Spesialis Penyakit Mulut', dept };
      if (check(['PERIODONSIA', 'SPPERIO'])) return { ksm: 'Dokter Gigi Spesialis Periodonsia', dept };
      if (check(['PROSTHODONSIA', 'SPPROS'])) {
        if (check(['MAKSILOFASIAL', 'PMF'])) return { ksm: 'Dokter Gigi Spesialis Prosthodonsia Konsultan Prostetik Maksilofasial', dept };
        return { ksm: 'Dokter Gigi Spesialis Prosthodonsia', dept };
      }
      if (check(['ANAK', 'KGA', 'SPKGA'])) return { ksm: 'Dokter Gigi Spesialis Kesehatan Gigi Anak', dept };
    }
  }

  // --- K. ENT (Otolaryngology) ---
  if (check(['SPTHT', 'THT', 'SPTHTBKL', 'THTBKL'])) {
    const dept = 'Department of Otolaryngology (ENT)';
    if (check(['BRONKOESOFAGOLOGI', 'BE'])) return { ksm: 'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Bronkoesofagologi', dept };
    if (check(['LARING', 'LF'])) return { ksm: 'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Laring - Faring', dept };
    if (check(['MAKSILOFASIAL', 'FPR'])) return { ksm: 'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Maksilofasial Plastik Rekonstruksi', dept };
    if (check(['NEUROTOLOGI', 'NO'])) return { ksm: 'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Neurotologi', dept };
    if (check(['OTOLOGI', 'OTO'])) return { ksm: 'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Otologi', dept };
    if (check(['RINOLOGI', 'RINO'])) return { ksm: 'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Rinologi', dept };
    if (check(['ALERGI', 'AI'])) return { ksm: 'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Alergi Imunologi', dept };
    if (check(['KOMUNITAS', 'K'])) return { ksm: 'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan THT Komunitas', dept };
    return { ksm: 'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher', dept };
  }

  // --- L. INFECTION & IMMUNOLOGY ---
  if (check(['ALERGI', 'IMUNOLOGI', 'INFEKSI', 'TROPIK', 'RHEUMATOLOGI', 'KPTI', 'PTI', 'KR', 'R', 'PDKR'])) {
    const dept = 'Department of Immunology and Infectious Diseases';
    if (check(['SPPD', 'PENYAKIT DALAM', 'PDKR'])) {
      if (check(['INFEKSI', 'TROPIK', 'PTI', 'KPTI'])) return { ksm: 'Dokter Spesialis Penyakit Dalam Konsultan Penyakit Tropik dan Infeksi', dept };
      if (check(['RHEUMATOLOGI', 'KR', 'R', 'PDKR'])) return { ksm: 'Dokter Spesialis Penyakit Dalam Konsultan Rheumatologi', dept };
      if (check(['ALERGI', 'KAI'])) return { ksm: 'Dokter Spesialis Penyakit Dalam Konsultan Alergi Imunologi', dept };
    }
  }

  // --- M. FORENSIC, SURGERY & EYES ---
  if (check(['FORENSIK', 'SPFM', 'SPB', 'BEDAH UMUM', 'SPM', 'MATA', 'SPBM', 'SPBMM'])) {
    const dept = 'Department of Surgery';
    if (check(['SPBM', 'SPBMM'])) {
      if (check(['CLEFT', 'COM'])) return { ksm: 'Dokter Gigi Spesialis Bedah Mulut dan Maksilofasial Konsultan Oral dan Maksilofasial Cleft / Cleft Lip and Palate', dept };
      if (check(['ORTHOGNATIK', 'OO'])) return { ksm: 'Dokter Gigi Spesialis Bedah Mulut dan Maksilofasial Konsultan Orthognatik dan Osteodistraksi / Disgnatia dan Osteodistraksi', dept };
      if (check(['TRAUMA', 'TMTJ'])) return { ksm: 'Dokter Gigi Spesialis Bedah Mulut dan Maksilofasial Konsultan Trauma Maksilofasial dan Temporomandibular Joint', dept };
      return { ksm: 'Dokter Gigi Spesialis Bedah Mulut dan Maksilofasial', dept };
    }
    if (check(['FORENSIK', 'SPFM'])) return { ksm: 'Dokter Spesialis Kedokteran Forensik dan Medikolegal', dept };
    if (check(['SPB', 'BEDAH UMUM'])) return { ksm: 'Dokter Spesialis Bedah Umum', dept };
    if (check(['SPM', 'MATA'])) return { ksm: 'Dokter Spesialis Mata', dept };
  }

  // --- N. RADIOLOGY & NUCLEAR MEDICINE ---
  if (check(['SPRAD', 'RADIOLOGI', 'SPKN', 'SPKNTM', 'NUKLIR'])) {
    const dept = 'Department of Radiology';
    if (check(['SPRAD', 'RADIOLOGI'])) {
      if (check(['ABDOMEN', 'RA'])) return { ksm: 'Dokter Spesialis Radiologi Konsultan Radiologi Abdomen', dept };
      if (check(['MUSKULOSKELETAL', 'MS'])) return { ksm: 'Dokter Spesialis Radiologi Konsultan Radiologi Muskuloskeletal', dept };
      if (check(['NEUROIMAGING', 'NR'])) return { ksm: 'Dokter Spesialis Radiologi Konsultan Radiologi Neuroimaging', dept };
      if (check(['TORAKS', 'KARDIOVASKULAR', 'TRKV'])) return { ksm: 'Dokter Spesialis Radiologi Konsultan Radiologi Toraks dan Kardiovaskular', dept };
      if (check(['INTERVENSIONAL', 'RI'])) return { ksm: 'Dokter Spesialis Radiologi Konsultan Radiologi Intervensional dan Kardiovaskular', dept };
      if (check(['ANAK', 'RP'])) return { ksm: 'Dokter Spesialis Radiologi Konsultan Radiologi Anak', dept };
      if (check(['PAYUDARA', 'WANITA', 'PRW'])) return { ksm: 'Dokter Spesialis Radiologi Konsultan Payudara dan Reproduksi Wanita', dept };
      return { ksm: 'Dokter Spesialis Radiologi', dept };
    }
    if (check(['SPKN', 'SPKNTM', 'NUKLIR'])) {
      if (check(['KARDIO', 'NK'])) return { ksm: 'Dokter Spesialis Kedokteran Nuklir Teranostik Molekuler Konsultan Nuklir Kardiologi', dept };
      if (check(['NEURO', 'NN'])) return { ksm: 'Dokter Spesialis Kedokteran Nuklir Teranostik Molekuler Konsultan Nuklir Neurologi', dept };
      if (check(['ONKOLOGI', 'NO'])) return { ksm: 'Dokter Spesialis Kedokteran Nuklir Teranostik Molekuler Konsultan Nuklir Onkologi', dept };
      if (check(['PEDIATRIK', 'NP'])) return { ksm: 'Dokter Spesialis Kedokteran Nuklir Teranostik Molekuler Konsultan Nuklir Pediatrik', dept };
      return { ksm: 'Dokter Spesialis Kedokteran Nuklir Teranostik Molekuler', dept };
    }
  }

  // --- O. ORTHOPAEDY ---
  if (check(['SPOT', 'ORTHOPAEDI', 'OLAHRAGA', 'SPKO'])) {
    const dept = 'Department of Orthopaedy';
    if (check(['SPOT', 'ORTHOPAEDI'])) {
      if (check(['ADVANCED', 'TRAUMA', 'AOT'])) return { ksm: 'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Advanced Orthopaedic Trauma', dept };
      if (check(['FOOT', 'ANKLE', 'FA'])) return { ksm: 'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Foot and Ankle', dept };
      if (check(['HAND', 'MICROSURGERY', 'HULM', 'TLBM'])) return { ksm: 'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Hand, Upper Limb and Microsurgery', dept };
      if (check(['HIP', 'KNEE', 'HK'])) return { ksm: 'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Hip and Knee (Adult Reconstruction, Trauma and Sport)', dept };
      if (check(['SPINE', 'OTB'])) return { ksm: 'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Spine', dept };
      if (check(['SPORT', 'INJURY', 'SI', 'CO'])) return { ksm: 'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Sport Injury', dept };
      if (check(['SHOULDER', 'ELBOW', 'SE'])) return { ksm: 'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Shoulder and Elbow', dept };
      if (check(['PEDIATRIC', 'PO'])) return { ksm: 'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Pediatric Orthopaedic', dept };
      if (check(['ONKOLOGI', 'OR'])) return { ksm: 'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Onkologi Rekonstruksi', dept };
      return { ksm: 'Dokter Spesialis Orthopaedi dan Traumatologi', dept };
    }
    if (check(['OLAHRAGA', 'SPKO'])) return { ksm: 'Dokter Spesialis Kedokteran Olahraga', dept };
    if (check(['SPKFR']) && check(['MUSKULOSKELETAL', 'MS'])) return { ksm: 'Dokter Spesialis Kedokteran Fisik dan Rehabilitasi Konsultan Rehabilitasi Muskuloskeletal', dept };
  }

  return { ksm: 'Dokter Umum', dept: 'Department of Medicine' };
};

const DEPT_LIST = [
  "Department of Cardiology",
  "Department of Medicine",
  "Department of Neurologi",
  "Department of Uro-Nephrology",
  "Department of Gastroenterology",
  "Department of Maternal and Child",
  "Department of Oncology",
  "Department of Anesthesiology",
  "Department of Supporting Medicine",
  "Department of Dermatology & Aesthetic",
  "Department of Otolaryngology (ENT)",
  "Department of Immunology and Infectious Diseases",
  "Department of Surgery",
  "Department of Radiology",
  "Department of Orthopaedy"
];

const KSM_LIST = [
  'Dokter Spesialis Penyakit Dalam',
  'Dokter Spesialis Penyakit Dalam Konsultan Gastroenterohepatologi',
  'Dokter Spesialis Penyakit Dalam Konsultan Endokrinologi Metabolik dan Diabetes',
  'Dokter Spesialis Penyakit Dalam Konsultan Geriatri',
  'Dokter Spesialis Penyakit Dalam Konsultan Pulmonologi dan Medik Kritis',
  'Dokter Spesialis Penyakit Dalam Konsultan Psikosomatik dan Paliatif',
  'Dokter Spesialis Penyakit Dalam Konsultan Hematologi Onkologi Medik',
  'Dokter Spesialis Penyakit Dalam Konsultan Ginjal Hipertensi',
  'Dokter Spesialis Penyakit Dalam Konsultan Penyakit Tropik dan Infeksi',
  'Dokter Spesialis Penyakit Dalam Konsultan Rheumatologi',
  'Dokter Spesialis Penyakit Dalam Konsultan Kardiovaskular',
  'Dokter Spesialis Paru',
  'Dokter Spesialis Paru Konsultan Pulmonologi dan Medik Kritis',
  'Dokter Spesialis Anak',
  'Dokter Spesialis Anak Konsultan Gastroenterologi-hepatologi',
  'Dokter Spesialis Anak Konsultan Kardiologi',
  'Dokter Spesialis Anak Konsultan Neuropediatri',
  'Dokter Spesialis Anak Konsultan Nefrologi Anak',
  'Dokter Spesialis Anak Konsultan Endokrinologi',
  'Dokter Spesialis Anak Konsultan Neonatologi',
  'Dokter Spesialis Anak Konsultan Nutrisi dan Penyakit Metabolik',
  'Dokter Spesialis Anak Konsultan Respirologi',
  'Dokter Spesialis Anak Konsultan Tumbuh Kembang - Pediatri Sosial',
  'Dokter Spesialis Anak Konsultan Emergensi dan Terapi Intensif Anak',
  'Dokter Spesialis Anak Konsultan Alergi Imunologi dan Rheumatologi',
  'Dokter Spesialis Anak Konsultan Infeksi dan Penyakit Tropis',
  'Dokter Spesialis Anak Konsultan Hematoonkologi',
  'Dokter Spesialis Jantung dan Pembuluh Darah',
  'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Kardiologi Intervensi',
  'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Ekokardiografi',
  'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Aritmia',
  'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Gagal Jantung',
  'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Kedokteran Vaskular',
  'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Pencitraan Kardiovaskular',
  'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Kardiologi Pediatrik dan Penyakit Jantung Bawaan',
  'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Terapi Intensif',
  'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Intensif & Kegawatan Kardiovascular',
  'Dokter Spesialis Jantung dan Pembuluh Darah Konsultan Prevensi dan Rehabilitasi Kardiovaskular',
  'Dokter Spesialis Bedah Umum',
  'Dokter Spesialis Bedah Konsultan Bedah Digestif',
  'Dokter Spesialis Bedah Konsultan Bedah Vaskular dan Endovaskular',
  'Dokter Spesialis Bedah Konsultan Bedah Onkologi',
  'Dokter Spesialis Obstetri dan Ginekologi',
  'Dokter Spesialis Obstetri dan Ginekologi Konsultan Uroginekologi Rekonstruksi',
  'Dokter Spesialis Obstetri dan Ginekologi Konsultan Fertilitas dan Endokrinologi Reproduksi',
  'Dokter Spesialis Obstetri dan Ginekologi Konsultan Fetomaternal',
  'Dokter Spesialis Obstetri dan Ginekologi Konsultan Obstetri dan Ginekologi Sosial',
  'Dokter Spesialis Obstetri dan Ginekologi Konsultan Onkologi Ginekologi',
  'Dokter Spesialis Neurologi',
  'Dokter Spesialis Neurologi Konsultan Epilepsi dan Neurofisiologi',
  'Dokter Spesialis Neurologi Konsultan Neuro Infeksi',
  'Dokter Spesialis Neurologi Konsultan Neurologi Nyeri',
  'Dokter Spesialis Neurologi Konsultan Neurovaskular',
  'Dokter Spesialis Neurologi Konsultan Neurootologi / Neuroopthalmologi',
  'Dokter Spesialis Neurologi Konsultan Neurointervensi',
  'Dokter Spesialis Neurologi Konsultan Neuroimaging',
  'Dokter Spesialis Neurologi Konsultan Gangguan Tidur (Sleep Disorder)',
  'Dokter Spesialis Neurologi Konsultan Saraf Tepi',
  'Dokter Spesialis Neurologi Konsultan Saraf Anak',
  'Dokter Spesialis Neurologi Konsultan Neurodegeneratif / Neurobehaviour',
  'Dokter Spesialis Neurologi Konsultan Neuroonkologi',
  'Dokter Spesialis Neurologi Konsultan Gangguan Gerak (Movement Disorder)',
  'Dokter Spesialis Neurologi Konsultan Neurokritikal dan Intensif',
  'Dokter Spesialis Bedah Saraf',
  'Dokter Spesialis Bedah Saraf Konsultan Neurofungsional',
  'Dokter Spesialis Bedah Saraf Konsultan Neuroonkologi + Skull Base',
  'Dokter Spesialis Bedah Saraf Konsultan Neurospine',
  'Dokter Spesialis Bedah Saraf Konsultan Neurovaskular',
  'Dokter Spesialis Bedah Saraf Konsultan Pediatrik',
  'Dokter Spesialis Bedah Saraf Konsultan Neurotrauma',
  'Dokter Spesialis Urologi',
  'Dokter Spesialis Urologi Konsultan Urologi Andrologi',
  'Dokter Spesialis Urologi Konsultan Urologi Perempuan, Fungsional, dan Neuro - Urologi',
  'Dokter Spesialis Urologi Konsultan Urologi Onkologi',
  'Dokter Spesialis Urologi Konsultan Urologi Pediatrik',
  'Dokter Spesialis Urologi Konsultan Urologi Rekonstruksi',
  'Dokter Spesialis Urologi Konsultan Urologi Transplantasi',
  'Dokter Spesialis Orthopaedi dan Traumatologi',
  'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Advanced Orthopaedic Trauma',
  'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Foot and Ankle',
  'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Hand, Upper Limb and Microsurgery',
  'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Hip and Knee (Adult Reconstruction, Trauma and Sport)',
  'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Spine',
  'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Sport Injury',
  'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Shoulder and Elbow',
  'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Pediatric Orthopaedic',
  'Dokter Spesialis Orthopaedi dan Traumatologi Konsultan Onkologi Rekonstruksi',
  'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher',
  'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Bronkoesofagologi',
  'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Laring - Faring',
  'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Maksilofasial Plastik Rekonstruksi',
  'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Neurotologi',
  'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Otologi',
  'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Rinologi',
  'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Alergi Imunologi',
  'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan THT Komunitas',
  'Dokter Spesialis Telinga, Hidung, Tenggorokan-Bedah Kepala Leher Konsultan Onkologi - Bedah Kepala Leher',
  'Dokter Spesialis Dermatologi, Venereologi, dan Estetika',
  'Dokter Spesialis Dermatologi, Venereologi, dan Estetika Konsultan Geriatri',
  'Dokter Spesialis Dermatologi, Venereologi, dan Estetika Konsultan Venereologi',
  'Dokter Spesialis Dermatologi, Venereologi, dan Estetika Konsultan Dermatologi Anak',
  'Dokter Spesialis Dermatologi, Venereologi, dan Estetika Konsultan Onkologi dan Bedah Kulit',
  'Dokter Spesialis Dermatologi, Venereologi, dan Estetika Konsultan Dermatologi Kosmetik dan Estetik',
  'Dokter Spesialis Dermatologi, Venereologi, dan Estetika Konsultan Dermato Alergi Imunologi',
  'Dokter Spesialis Dermatologi, Venereologi, dan Estetika Konsultan Dermatologi Tropis',
  'Dokter Spesialis Anestesiologi dan Terapi Intensif',
  'Dokter Spesialis Anestesiologi dan Terapi Intensif Konsultan Anestesi Kardiovaskular',
  'Dokter Spesialis Anestesiologi dan Terapi Intensif Konsultan Neuro Anestesi dan Neuro Critical Care',
  'Dokter Spesialis Anestesiologi dan Terapi Intensif Konsultan Anestesi Obstetri',
  'Dokter Spesialis Anestesiologi dan Terapi Intensif Konsultan Anestesi Pediatri',
  'Dokter Spesialis Anestesiologi dan Terapi Intensif Konsultan Anestesi Regional',
  'Dokter Spesialis Anestesiologi dan Terapi Intensif Konsultan Manajemen Nyeri',
  'Dokter Spesialis Anestesiologi dan Terapi Intensif Konsultan Intensive Care (KIC)',
  'Dokter Spesialis Radiologi',
  'Dokter Spesialis Radiologi Konsultan Radiologi Abdomen',
  'Dokter Spesialis Radiologi Konsultan Radiologi Muskuloskeletal',
  'Dokter Spesialis Radiologi Konsultan Radiologi Neuroimaging',
  'Dokter Spesialis Radiologi Konsultan Radiologi Toraks dan Kardiovaskular',
  'Dokter Spesialis Radiologi Konsultan Radiologi Intervensional dan Kardiovaskular',
  'Dokter Spesialis Radiologi Konsultan Radiologi Anak',
  'Dokter Spesialis Radiologi Konsultan Payudara dan Reproduksi Wanita',
  'Dokter Spesialis Radiologi Konsultan Radiologi Intervensi',
  'Dokter Spesialis Patologi Klinik',
  'Dokter Spesialis Patologi Klinik Konsultan Hematologi Klinik',
  'Dokter Spesialis Patologi Klinik Konsultan Onkologi Klinik',
  'Dokter Spesialis Patologi Klinik Konsultan Nefrologi dan Respirasi',
  'Dokter Spesialis Patologi Klinik Konsultan Gastroenterohepatologi',
  'Dokter Spesialis Patologi Klinik Konsultan Penyakit Infeksi',
  'Dokter Spesialis Patologi Klinik Konsultan Bank Darah & Kedokteran Transfusi',
  'Dokter Spesialis Patologi Klinik Konsultan Imunologi Klinik',
  'Dokter Spesialis Patologi Klinik Konsultan Endokrin & Metabolisme',
  'Dokter Spesialis Patologi Anatomi',
  'Dokter Spesialis Patologi Anatomi Konsultan Patologi Uropatologi Reproduksi Laki-laki',
  'Dokter Spesialis Patologi Anatomi Konsultan Patologi Kulit dan Adneksa',
  'Dokter Spesialis Patologi Anatomi Konsultan Patologi Digestif Hepatobilier',
  'Dokter Spesialis Patologi Anatomi Konsultan Patologi Hematolimfoid dan Endokrin',
  'Dokter Spesialis Patologi Anatomi Konsultan Patologi Obstetri Ginekologi Payudara',
  'Dokter Spesialis Patologi Anatomi Konsultan Sitopatologi',
  'Dokter Spesialis Patologi Anatomi Konsultan Patologi Muskuloskeletal',
  'Dokter Spesialis Patologi Anatomi Konsultan Patologi Saraf dan Mata',
  'Dokter Spesialis Patologi Anatomi Konsultan Patologi Kardiovaskular Respirasi dan Mediastinum',
  'Dokter Spesialis Kedokteran Fisik dan Rehabilitasi',
  'Dokter Spesialis Kedokteran Fisik dan Rehabilitasi Konsultan Rehabilitasi Kardiorespirasi',
  'Dokter Spesialis Kedokteran Fisik dan Rehabilitasi Konsultan Rehabilitasi Geriatri',
  'Dokter Spesialis Kedokteran Fisik dan Rehabilitasi Konsultan Neuromuskular',
  'Dokter Spesialis Kedokteran Fisik dan Rehabilitasi Konsultan Rehabilitasi Pediatrik',
  'Dokter Spesialis Kedokteran Fisik dan Rehabilitasi Konsultan Rehabilitasi Muskuloskeletal',
  'Dokter Spesialis Kedokteran Jiwa',
  'Dokter Spesialis Kedokteran Jiwa Konsultan Psikiatri Adiksi',
  'Dokter Spesialis Kedokteran Jiwa Konsultan Psikiatri Anak & Remaja',
  'Dokter Spesialis Kedokteran Jiwa Konsultan Psikiatri Forensik',
  'Dokter Spesialis Kedokteran Jiwa Konsultan Psikoterapi',
  'Dokter Spesialis Kedokteran Jiwa Konsultan Psikiatri dan Liaison',
  'Dokter Spesialis Kedokteran Jiwa Konsultan Geriatri',
  'Dokter Spesialis Kedokteran Jiwa Konsultan Psikiatri Psikoseksual dan Marital',
  'Dokter Spesialis Kedokteran Jiwa Konsultan Psikiatri Perempuan',
  'Dokter Spesialis Kedokteran Jiwa Konsultan Psikometrik',
  'Dokter Spesialis Onkologi Radiasi',
  'Dokter Spesialis Onkologi Radiasi Konsultan Keganasan Abdomino - Pelvik',
  'Dokter Spesialis Onkologi Radiasi Konsultan Kepala, Leher dan Sistem Saraf Pusat',
  'Dokter Spesialis Onkologi Radiasi Konsultan Toraks, Pediatrik dan Limpho-muskuloskeletal',
  'Dokter Spesialis Mikrobiologi Klinik',
  'Dokter Spesialis Kedokteran Nuklir Teranostik Molekuler',
  'Dokter Spesialis Kedokteran Nuklir Teranostik Molekuler Konsultan Nuklir Kardiologi',
  'Dokter Spesialis Kedokteran Nuklir Teranostik Molekuler Konsultan Nuklir Neurologi',
  'Dokter Spesialis Kedokteran Nuklir Teranostik Molekuler Konsultan Nuklir Onkologi',
  'Dokter Spesialis Kedokteran Nuklir Teranostik Molekuler Konsultan Nuklir Pediatrik',
  'Dokter Spesialis Bedah Plastik, Rekonstruksi, dan Estetik',
  'Dokter Spesialis Bedah Plastik, Rekonstruksi, dan Estetik Konsultan Bidang Luka Bakar',
  'Dokter Spesialis Bedah Plastik, Rekonstruksi, dan Estetik Konsultan Bidang Bedah Estetik Lanjut',
  'Dokter Spesialis Bedah Anak',
  'Dokter Spesialis Bedah Anak Konsultan Bedah Urogenital Anak',
  'Dokter Spesialis Bedah Anak Konsultan Bedah Digestif Anak',
  'Dokter Spesialis Bedah Toraks Kardiovaskular',
  'Dokter Spesialis Kedokteran Olahraga',
  'Dokter Spesialis Gizi Klinik',
  'Dokter Spesialis Gizi Klinik Konsultan Kelainan Metabolik',
  'Dokter Spesialis Gizi Klinik Konsultan Nutrisi pada Penyakit Kritis',
  'Dokter Spesialis Farmakologi Klinik',
  'Dokter Spesialis Kedokteran Okupasi',
  'Dokter Spesialis Kedokteran Forensik dan Medikolegal',
  'Dokter Spesialis Mata',
  'Dokter Gigi Spesialis Konservasi Gigi',
  'Dokter Gigi Spesialis Orthodonti',
  'Dokter Gigi Spesialis Penyakit Mulut',
  'Dokter Gigi Spesialis Periodonsia',
  'Dokter Gigi Spesialis Prosthodonsia',
  'Dokter Gigi Spesialis Prosthodonsia Konsultan Prostetik Maksilofasial',
  'Dokter Gigi Spesialis Kesehatan Gigi Anak',
  'Dokter Gigi Spesialis Bedah Mulut dan Maksilofasial',
  'Dokter Gigi Spesialis Bedah Mulut dan Maksilofasial Konsultan Oral dan Maksilofasial Cleft / Cleft Lip and Palate',
  'Dokter Gigi Spesialis Bedah Mulut dan Maksilofasial Konsultan Orthognatik dan Osteodistraksi / Disgnatia dan Osteodistraksi',
  'Dokter Gigi Spesialis Bedah Mulut dan Maksilofasial Konsultan Trauma Maksilofasial dan Temporomandibular Joint',
  'Dokter Gigi Dokter Spesialis Bedah Mulut Neoplasma dan Kista Bedah Mulut dan Maksilofasial',
  'Dokter Umum',
  'Fisioterapis'
];

const extractKsm = (dpjp, overrides = {}) => {
  const res = resolveKsmDept(dpjp, overrides);
  return typeof res === 'string' ? res : res.ksm;
};

const getDept = (ksm, dpjp, overrides = {}) => {
  const res = resolveKsmDept(dpjp, overrides);
  return typeof res === 'string' ? 'Department of Medicine' : res.dept;
};

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
  // Sanitize filename to prevent invalid character errors (e.g. slashes in KSM name)
  const cleanFilename = String(filename).replace(/[\/\\:\*\?"<>\|]/g, '_');

  const data = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Auto-fit column widths (neat and clean spreadsheet formatting)
  if (headers && headers.length > 0) {
    const colWidths = headers.map((h, colIdx) => {
      let maxLen = String(h).length;
      rows.forEach(r => {
        const cellValue = r[colIdx] !== undefined && r[colIdx] !== null ? String(r[colIdx]) : '';
        if (cellValue.length > maxLen) {
          maxLen = cellValue.length;
        }
      });
      // Add generous padding for a very clean professional layout
      return { wch: Math.max(maxLen + 4, 12) };
    });
    worksheet['!cols'] = colWidths;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
  const link = document.createElement('a');
  link.href = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + wbout;
  link.download = `${cleanFilename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
  const btnStyle = { position: 'absolute', top: '12px', right: '12px', zIndex: 60, display: 'flex', alignItems: 'center', gap: '5px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: 'white', border: 'none', borderRadius: '8px', padding: '5px 11px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 8px rgba(14,165,233,0.3)', textTransform: 'uppercase', letterSpacing: '0.04em', transition: 'all 0.2s' };
  return (
    <div id={id} style={{ position: 'relative' }} className={`${hasBg ? '' : 'bg-white'} rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 ${className}`}>
      {downloadTitle && id && (
        <button onClick={(e) => { e.stopPropagation(); saveAsPng(id, downloadTitle); }} style={btnStyle} onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #0284c7, #0369a1)'} onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #0ea5e9, #0284c7)'} className="print:hidden" title={`Unduh ${downloadTitle} sebagai PNG`}>
          <Download size={13} /> Simpan PNG
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

  const chartIdRef = React.useRef('chart-' + Math.random().toString(36).slice(2, 8));
  const chartId = chartIdRef.current;
  const scatterBtnStyle = { position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '5px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: 'white', border: 'none', borderRadius: '8px', padding: '5px 11px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 8px rgba(14,165,233,0.3)', textTransform: 'uppercase', letterSpacing: '0.04em', transition: 'all 0.2s' };

  return (
    <div id={chartId} style={{ position: 'relative' }} className="w-full bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="absolute top-4 left-4 font-bold text-slate-700">{title}</div>
      {data.length > 500 && <div className="absolute top-4 right-28 text-xs text-slate-400">Sampled {processedData.length} of {data.length} points</div>}
      <button onClick={() => saveAsPng(chartId, title)} style={scatterBtnStyle} onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #0284c7, #0369a1)'} onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #0ea5e9, #0284c7)'} className="print:hidden" title={`Unduh ${title} sebagai PNG`}>
        <Download size={13} /> Simpan PNG
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

const InsightSosialisasiComponent = React.memo(({
  dashData,
  ksmOverrides,
  selectedSocializationDept,
  setSelectedSocializationDept,
  selectedSocializationKsm,
  setSelectedSocializationKsm,
  socializationScatterMode,
  setSocializationScatterMode,
  isSlideMode,
  setIsSlideMode,
  openDrilldown,
  activeExclusionCodes
}) => {
  const allRows = dashData?.rawRows || [];

  // 1. Get KSM, Department, and 18 Components for each row once (massive CPU speedup)
  const rowsWithKsm = useMemo(() => {
    return allRows.map(r => {
      const ksm = extractKsm(r['DPJP'] || '', ksmOverrides);
      return {
        row: r,
        ksm,
        dept: getDept(ksm, r['DPJP'] || '', ksmOverrides),
        comps: extract18(r)
      };
    });
  }, [allRows, ksmOverrides]);

  // 2. Get Unique Departments
  const depts = useMemo(() => {
    return Array.from(new Set(rowsWithKsm.map(item => item.dept))).filter(Boolean).sort();
  }, [rowsWithKsm]);
  
  // Determine active department (without setting state during render)
  const currentDept = selectedSocializationDept || depts[0] || '';

  // 3. Get KSMs for the selected department
  const ksmsForDept = useMemo(() => {
    return Array.from(new Set(
      rowsWithKsm
        .filter(item => item.dept === currentDept)
        .map(item => item.ksm)
    )).filter(Boolean).sort();
  }, [rowsWithKsm, currentDept]);

  // Determine active KSM (without setting state during render)
  const currentKsm = selectedSocializationKsm && ksmsForDept.includes(selectedSocializationKsm)
    ? selectedSocializationKsm
    : (ksmsForDept[0] || '');

  // 4. Filter rows for current KSM
  const ksmRows = rowsWithKsm
    .filter(item => item.ksm === currentKsm)
    .map(item => item.row);

  const ksmItems = rowsWithKsm.filter(item => item.ksm === currentKsm);

  // 5. Hospital-wide metrics for comparison
  const hTotal = allRows.length || 1;
  const hSumLos = allRows.reduce((sum, r) => sum + (parseFloat(r._los) || 0), 0);
  const hAvgLos = hSumLos / hTotal;
  
  const hAvgComps = {};
  compKeys.forEach(c => {
    let sum = 0;
    rowsWithKsm.forEach(item => {
      sum += item.comps[c.key] || 0;
    });
    hAvgComps[c.key] = sum / hTotal;
  });

  // 6. KSM-specific metrics
  const kTotal = ksmRows.length || 1;
  const kPctOfHospital = (ksmRows.length / (allRows.length || 1)) * 100;
  
  const kSumLos = ksmRows.reduce((sum, r) => sum + (parseFloat(r._los) || 0), 0);
  const kAvgLos = kSumLos / kTotal;
  const kMaxLos = ksmRows.reduce((max, r) => Math.max(max, parseFloat(r._los) || 0), 0);

  const kSumRS = ksmRows.reduce((sum, r) => sum + (parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0), 0);
  const kAvgRS = kSumRS / kTotal;

  const kSumIna = ksmRows.reduce((sum, r) => sum + (parseFloat(r.TOTAL_TARIF || 0) || 0), 0);
  const kAvgIna = kSumIna / kTotal;

  const kSumIdrg = ksmRows.reduce((sum, r) => sum + (parseFloat(r.IDRG_TOTAL_TARIF || 0) || 0), 0);
  const kAvgIdrg = kSumIdrg / kTotal;

  const kSelisihIna = kSumIna - kSumRS;
  const kAvgSelisihIna = kSelisihIna / kTotal;

  const kSelisihIdrg = kSumIdrg - kSumRS;
  const kAvgSelisihIdrg = kSelisihIdrg / kTotal;

  const kAvgComps = {};
  compKeys.forEach(c => {
    let sum = 0;
    ksmItems.forEach(item => {
      sum += item.comps[c.key] || 0;
    });
    kAvgComps[c.key] = sum / kTotal;
  });

  // Prepare unaggregated scatter data with dynamic financial positioning
  const scatterData = useMemo(() => {
    return ksmRows.map(r => {
      const rs = parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
      const ina = parseFloat(r.TOTAL_TARIF || 0) || 0;
      const idrg = parseFloat(r.IDRG_TOTAL_TARIF || 0) || 0;
      return {
        ...r,
        selisih: socializationScatterMode === 'idrg' ? idrg - rs : ina - rs,
        los: parseFloat(r._los) || 0,
        rsTarif: rs
      };
    });
  }, [ksmRows, socializationScatterMode]);

  const { efficientLosCases, pctEfficientLos, ksmCostPerDay, inaDeficitCount, idrgDeficitCount } = useMemo(() => {
    const effLos = ksmRows.filter(r => (parseFloat(r._los) || 0) <= hAvgLos).length;
    const pctEff = (effLos / kTotal) * 100;
    const costPerDay = kSumRS / (kSumLos || 1);

    let inaDef = 0;
    let idrgDef = 0;
    ksmRows.forEach(r => {
      const rs = parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
      const ina = parseFloat(r.TOTAL_TARIF || 0) || 0;
      const idrg = parseFloat(r.IDRG_TOTAL_TARIF || 0) || 0;
      if ((ina - rs) < 0) inaDef++;
      if ((idrg - rs) < 0) idrgDef++;
    });

    return {
      efficientLosCases: effLos,
      pctEfficientLos: pctEff,
      ksmCostPerDay: costPerDay,
      inaDeficitCount: inaDef,
      idrgDeficitCount: idrgDef
    };
  }, [ksmRows, hAvgLos, kTotal, kSumRS, kSumLos]);

  // 7. Quadrant standing logic
  const ksmCountsMap = {};
  rowsWithKsm.forEach(item => {
    if (item.ksm) {
      ksmCountsMap[item.ksm] = (ksmCountsMap[item.ksm] || 0) + 1;
    }
  });
  const ksmCounts = Object.values(ksmCountsMap);
  const avgKsmVol = ksmCounts.reduce((s, c) => s + c, 0) / (ksmCounts.length || 1);

  const isHighVolume = ksmRows.length >= avgKsmVol;
  const isSurplus = kSelisihIna >= 0;

  let quadrantBadge = "";
  let quadrantClass = "";
  let quadrantNote = "";
  let quadrantTip = "";

  if (isSurplus && isHighVolume) {
    quadrantBadge = "Surplus & Volume Tinggi (Kinerja Utama)";
    quadrantClass = "bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-500/10";
    quadrantNote = "Performa luar biasa! KSM ini memberikan volume kontribusi tinggi dengan margin surplus optimal.";
    quadrantTip = "Pertahankan kualitas koding diagnosa utama dan sekunder. Dokumentasikan standardisasi Clinical Pathway ini sebagai panduan best practice rumah sakit.";
  } else if (!isSurplus && isHighVolume) {
    quadrantBadge = "Defisit & Volume Tinggi (Prioritas Sosialisasi)";
    quadrantClass = "bg-rose-50 border-rose-200 text-rose-800 shadow-rose-500/10";
    quadrantNote = "Sangat Kritis! Kasus dengan volume tinggi beroperasi dalam kondisi defisit finansial kumulatif.";
    quadrantTip = "Fokus Sosialisasi: Audit ketepatan dokumentasi koding klinis, periksa pencantuman komplikasi sekunder (severity level), serta evaluasi inefisiensi biaya obat/alkes penunjang medis.";
  } else if (!isSurplus && !isHighVolume) {
    quadrantBadge = "Defisit & Volume Rendah (Waspada)";
    quadrantClass = "bg-amber-50 border-amber-200 text-amber-800 shadow-amber-500/10";
    quadrantNote = "Perhatian Khusus! Layanan berbiaya tinggi dengan frekuensi kasus kecil namun berpotensi defisit.";
    quadrantTip = "Evaluasi Kasus Individu: Tinjau LOS (Length of Stay) per pasien dan hilangkan pemeriksaan diagnostik atau terapi obat yang berlebihan/redundant.";
  } else {
    quadrantBadge = "Surplus & Volume Rendah (Potensi Pengembangan)";
    quadrantClass = "bg-sky-50 border-sky-200 text-sky-800 shadow-sky-500/10";
    quadrantNote = "Efisien & Menguntungkan! Model biaya efisien dengan margin surplus yang terjaga baik.";
    quadrantTip = "Pengembangan Layanan: Tingkatkan kapasitas penerimaan pasien dan promosikan keunggulan klinis KSM ini untuk memperluas jangkauan layanan.";
  }

  // 7. Top 5 Diagnosa Utama Berdefisit (Primary Diagnoses ICD-10)
  const deficitRows = ksmRows.filter(r => {
    const rs = parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
    const ina = parseFloat(r.TOTAL_TARIF || 0) || 0;
    return (ina - rs) < 0;
  });

  const diagGroups = {};
  deficitRows.forEach(r => {
    let code = String(r.DIAGNOSA || r.DIAGUTAMA || '').trim();
    if (!code || code === '-' || code.toLowerCase() === 'none') {
      const dList = String(r.DIAGLIST || '').replace(/"/g, '').split(';').map(d => d.trim()).filter(Boolean);
      if (dList.length > 0) code = dList[0];
    }
    if (!code) code = '-';
    if (code === '-' || code.toLowerCase() === 'none') return;

    if (!diagGroups[code]) {
      diagGroups[code] = { code, desc: getIcdDescription(code) || String(r.DESKRIPSI_DIAGNOSA || r.DESKRIPSI || 'Tanpa Deskripsi'), count: 0, totalDefisit: 0 };
    }
    const rs = parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
    const ina = parseFloat(r.TOTAL_TARIF || 0) || 0;
    diagGroups[code].count++;
    diagGroups[code].totalDefisit += (ina - rs);
  });
  const top5Diags = Object.values(diagGroups).sort((a, b) => a.totalDefisit - b.totalDefisit).slice(0, 5);

  // 8. Top 5 Tindakan Utama Berdefisit (Primary Procedures ICD-9-CM)
  const procGroups = {};
  deficitRows.forEach(r => {
    const rawProcs = String(r.PROSEDUR || r.PROSEDUR_UTAMA || r.PROCLIST || '-').split(/[;,]/).map(p => p.trim()).filter(Boolean);
    let code = '-';
    for (let p of rawProcs) {
      if (p === '-' || p.toLowerCase() === 'none') continue;
      const cleanP = p.trim().toUpperCase();
      const noDotP = cleanP.replace(/\./g, '');
      const isExcluded = (activeExclusionCodes || []).some(exc => {
        const cleanExc = String(exc).trim().toUpperCase();
        const noDotExc = cleanExc.replace(/\./g, '');
        return cleanP === cleanExc || cleanP.startsWith(cleanExc) || noDotP.startsWith(noDotExc);
      });
      if (!isExcluded) {
        code = p;
        break;
      }
    }
    if (code === '-' || code === '') return;
    if (!procGroups[code]) {
      procGroups[code] = { code, desc: getIcdDescription(code) || String(r.DESKRIPSI_PROSEDUR || 'Tanpa Deskripsi'), count: 0, totalDefisit: 0 };
    }
    const rs = parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
    const ina = parseFloat(r.TOTAL_TARIF || 0) || 0;
    procGroups[code].count++;
    procGroups[code].totalDefisit += (ina - rs);
  });
  const top5Procs = Object.values(procGroups).sort((a, b) => a.totalDefisit - b.totalDefisit).slice(0, 5);

  // 9. Top 5 Group INACBG Utama (Most frequent with net position)
  const inaGroups = {};
  ksmRows.forEach(r => {
    const code = String(r.INACBG || '-').trim();
    if (!inaGroups[code]) {
      inaGroups[code] = { code, desc: String(r.DESKRIPSI_INACBG || 'Tanpa Deskripsi'), count: 0, totalSelisih: 0 };
    }
    const rs = parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
    const ina = parseFloat(r.TOTAL_TARIF || 0) || 0;
    inaGroups[code].count++;
    inaGroups[code].totalSelisih += (ina - rs);
  });
  const topInaGroups = Object.values(inaGroups).sort((a, b) => b.count - a.count).slice(0, 5);

  // 10. Top 5 Group iDRG Utama (Most frequent with net position)
  const idrgGroups = {};
  ksmRows.forEach(r => {
    const code = String(r.IDRG_DRG_CODE || '-').trim();
    if (!idrgGroups[code]) {
      idrgGroups[code] = { code, desc: String(r.IDRG_DRG_DESCRIPTION || 'Tanpa Deskripsi'), count: 0, totalSelisih: 0 };
    }
    const rs = parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
    const idrg = parseFloat(r.IDRG_TOTAL_TARIF || 0) || 0;
    idrgGroups[code].count++;
    idrgGroups[code].totalSelisih += (idrg - rs);
  });
  const topIdrgGroups = Object.values(idrgGroups).sort((a, b) => b.count - a.count).slice(0, 5);

  // Dynamic Clinical Guidelines Generator
  const getCodingGuideline = (code) => {
    const c = String(code).toUpperCase();
    if (c.startsWith('A') || c.startsWith('B')) return "Pastikan mencatat komplikasi infeksi seperti Sepsis (A41.9) atau Syok Septik (R57.2) jika kondisi klinis terpenuhi.";
    if (c.startsWith('E')) return "Cantumkan manifestasi organ diabetik spesifik: Neuropati (E11.4), Nefropati (E11.2), atau Ulkus/Gangren (E11.5) sebagai diagnosis kombinasi.";
    if (c.startsWith('I')) return "Bila ada gagal jantung kongestif akibat hipertensi kronis, gunakan kode kombinasi Penyakit Jantung Hipertensi dengan Gagal Jantung (I11.0).";
    if (c.startsWith('J')) return "Pastikan mencatat tipe Pneumonia secara spesifik (misal Bakterial J15) atau komplikasi gagal napas akut (J96.0) sebagai sekunder.";
    if (c.startsWith('N')) return "Untuk kasus batu saluran kemih dengan hidronefrosis penyerta, gunakan kode kombinasi N20.9 (Batu ginjal/ureter dengan hidronefrosis).";
    if (c.startsWith('S') || c.startsWith('T')) return "Dokumentasikan dengan lengkap penyebab cedera eksternal (V-Y codes) dan diagnosis sekunder perdarahan traumatis.";
    return "Tinjau kembali rekam medis lengkap untuk memastikan seluruh diagnosa sekunder/penyerta (terutama yang menaikkan tingkat keparahan / severity level CC/MCC) tercatat dengan presisi.";
  };

  const getProcedureGuideline = (code) => {
    const c = String(code);
    if (c.startsWith('99.1') || c.startsWith('99.2')) return "Pastikan lembar observasi obat khusus/imunisasi terisi lengkap untuk mencegah penolakan klaim top-up.";
    if (c.startsWith('35.') || c.startsWith('36.')) return "Dokumentasikan jenis implan atau alkes habis pakai yang digunakan di laporan operasi untuk mempermudah verifikasi.";
    if (c.startsWith('88.') || c.startsWith('87.')) return "Pastikan hasil eksisi patologi anatomi atau penafsiran hasil radiologi (X-Ray/CT-Scan/MRI) ditandatangani dokter spesialis terkait.";
    return "Lengkapi lembar laporan operasi / tindakan dengan durasi, nama operator utama, dan tanda tangan dokter penanggung jawab pelayanan (DPJP).";
  };

  const exportKsmSocialization = () => {
    // 1. Sheet 1: Ringkasan Performa
    const summaryHeaders = ['Indikator Performa', `Nilai KSM ${currentKsm}`, 'Rata-rata RS'];
    const summaryRows = [
      ['Jumlah Kasus', ksmRows.length, allRows.length],
      ['Persentase Kasus RS', `${kPctOfHospital.toFixed(1)}%`, '100%'],
      ['Rata-rata LOS (Hari)', kAvgLos.toFixed(1), hAvgLos.toFixed(1)],
      ['LOS Maksimal (Hari)', kMaxLos, allRows.reduce((max, r) => Math.max(max, parseFloat(r._los) || 0), 0)],
      ['Rata-rata Biaya Riil RS', Math.round(kAvgRS), Math.round(allRows.reduce((s, r) => s + (parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0), 0) / allRows.length)],
      ['Rata-rata Tarif INA-CBG', Math.round(kAvgIna), Math.round(allRows.reduce((s, r) => s + (parseFloat(r.TOTAL_TARIF || 0) || 0), 0) / allRows.length)],
      ['Rata-rata Tarif iDRG', Math.round(kAvgIdrg), Math.round(allRows.reduce((s, r) => s + (parseFloat(r.IDRG_TOTAL_TARIF || 0) || 0), 0) / allRows.length)],
      ['Total Selisih INA-RS', kSelisihIna, allRows.reduce((s, r) => s + (parseFloat(r.TOTAL_TARIF || 0) - (parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0)), 0)],
      ['Total Selisih iDRG-RS', kSelisihIdrg, allRows.reduce((s, r) => s + (parseFloat(r.IDRG_TOTAL_TARIF || 0) - (parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0)), 0)],
      ['Status Kinerja Klinis', quadrantBadge, 'N/A']
    ];

    // 2. Sheet 2: Detail Kasus Pasien
    const detailHeaders = [
      'No', 'Nomor SEP', 'Nomor RM', 'Nama Pasien', 'Dokter DPJP', 
      'Kode INACBG', 'Deskripsi INACBG', 'Kode iDRG', 'Deskripsi iDRG',
      'LOS (Hari)', 'Biaya Riil RS (Rp)', 'Tarif INA-CBG (Rp)', 'Tarif iDRG (Rp)',
      'Selisih INA-CBG vs RS (Rp)', 'Selisih iDRG vs RS (Rp)'
    ];

    const detailRows = ksmRows.map((r, index) => {
      const rs = parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
      const ina = parseFloat(r.TOTAL_TARIF || 0) || 0;
      const idrg = parseFloat(r.IDRG_TOTAL_TARIF || 0) || 0;
      const patientName = String(r.NAMA || r.NAMA_PASIEN || r.nama || '-');
      const maskedPatient = patientName !== '-' ? patientName.split(' ').filter(w => w.length > 0).map(w => w.charAt(0) + '***').join(' ') : patientName;
      return [
        index + 1,
        r.SEP || r.NO_SEP || r.no_sep || '-',
        r.NO_RM || r.NORM || r.no_rm || '-',
        maskedPatient,
        maskName(r.DPJP || r.NAMA_DOKTER || r.dpjp || '-'),
        r.INACBG || r.KODE_INACBG || '-',
        r.INACBG_DESC || r.DESKRIPSI_INACBG || '-',
        r.IDRG_DRG_CODE || '-',
        r.IDRG_DRG_DESC || '-',
        parseFloat(r._los) || 0,
        rs,
        ina,
        idrg,
        ina - rs,
        idrg - rs
      ];
    });

    const workbook = XLSX.utils.book_new();
    
    const summarySheet = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan Performa');

    const detailSheet = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);
    XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detail Kasus Pasien');

    // Clean dynamic filename
    const cleanKsmName = String(currentKsm.substring(0, 15)).replace(/[\/\\:\*\?"<>\|]/g, '_');
    const filename = `Sosialisasi_KSM_${cleanKsmName}`;

    // Write Base64 and download
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
    const link = document.createElement('a');
    link.href = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + wbout;
    link.download = `${filename}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (allRows.length === 0) {
    return (
      <div className="bg-white/50 backdrop-blur-sm border border-slate-200/60 p-20 rounded-[2.5rem] text-center mt-10 max-w-3xl mx-auto shadow-2xl shadow-slate-200/50">
        <div className="mb-6"><AlertCircle size={48} className="text-teal-600 mx-auto animate-bounce" /></div>
        <h2 className="text-2xl font-black mb-3 text-slate-800">Menunggu Dataset Utama...</h2>
        <p className="text-slate-500 font-medium leading-relaxed">
          Data sosialisasi belum dapat ditampilkan. Silakan unggah file klaim RS terlebih dahulu di tab <strong>Integrasi Data</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ${isSlideMode ? 'p-6 bg-slate-900 text-white rounded-3xl' : ''}`}>
      
      {/* HEADER & TOP CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40 backdrop-blur-sm p-4 rounded-3xl border border-teal-100 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-600 text-white rounded-2xl shadow-lg shadow-teal-600/20">
            <Sparkles size={24} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Insight Sosialisasi Dokter Spesialis</h1>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">Bahan presentasi evaluasi kendali mutu dan kendali biaya per KSM / Departemen.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsSlideMode(!isSlideMode)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border shadow-sm uppercase tracking-wider ${isSlideMode ? 'bg-teal-600 text-white border-teal-500' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'}`}
            title="Toggle Mode Slide / Layar Penuh Presentasi"
          >
            📺 {isSlideMode ? 'Mode Biasa' : 'Mode Slide / Presentasi'}
          </button>
          <button
            onClick={exportKsmSocialization}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 uppercase tracking-wider"
            title="Ekspor data ringkasan KSM ke Excel"
          >
            <Download size={14} /> Ekspor Excel
          </button>
          <button
            onClick={() => window.print()}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 uppercase tracking-wider"
            title="Cetak/Simpan Handout Sosialisasi ke PDF"
          >
            <Printer size={14} /> Cetak Handout PDF
          </button>
        </div>
      </div>

      {/* INTERACTIVE HIERARCHY SELECTOR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm print:hidden">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Building2 size={12} className="text-teal-600" /> Pilih Departemen
          </label>
          <select
            value={currentDept}
            onChange={e => {
              setSelectedSocializationDept(e.target.value);
              setSelectedSocializationKsm(''); // Reset KSM
            }}
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-800 font-bold focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all cursor-pointer shadow-inner"
          >
            {depts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Users size={12} className="text-teal-600" /> Pilih Kelompok Staf Medis (KSM)
          </label>
          <select
            value={currentKsm}
            onChange={e => setSelectedSocializationKsm(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-800 font-bold focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all cursor-pointer shadow-inner"
          >
            {ksmsForDept.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {/* PRINT BRANDING (Visible only when printing) */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-teal-600 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <img src="https://lh3.googleusercontent.com/d/1K9BUgDDRmF0d9Q9mCasC5KhDXVpVhJs5" alt="Logo" className="w-12 h-12 object-contain" />
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">akurat.id Analytics Platform</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Laporan Sosialisasi & Evaluasi Kendali Mutu Kendali Biaya (KMKB)</p>
          </div>
        </div>
        <div className="text-right text-[10px] font-bold text-slate-500">
          <div>Departemen: <span className="text-slate-800">{currentDept}</span></div>
          <div>KSM: <span className="text-teal-600">{currentKsm}</span></div>
          <div>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      {/* PRESENTATION SLIDE - EXECUTIVE SCORECARDS */}
      <div className={`p-8 rounded-[2.5rem] border shadow-2xl flex flex-col gap-6 relative overflow-hidden transition-all duration-300 ${isSlideMode ? 'bg-slate-800 border-slate-700/50 shadow-slate-950/40 text-white' : 'bg-gradient-to-br from-white to-teal-50/20 border-teal-100/70 shadow-teal-900/5'}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <span className={`text-[10px] font-black tracking-[0.2em] uppercase px-3 py-1 rounded-full ${isSlideMode ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-50 text-teal-700'}`}>Bahan Sosialisasi Medis</span>
            <h2 className={`text-2xl font-black mt-2 tracking-tight ${isSlideMode ? 'text-white' : 'text-slate-800'}`}>
              Evaluasi Kinerja Klinis: <span className="text-teal-600 font-extrabold">{currentKsm}</span>
            </h2>
            <p className={`text-[11px] font-medium mt-1 ${isSlideMode ? 'text-slate-400' : 'text-slate-400'}`}>
              Membawahi Departemen: <strong className={isSlideMode ? 'text-slate-300' : 'text-slate-700'}>{currentDept}</strong>
            </p>
          </div>
          
          {/* Clinical Standing Quadrant */}
          <div className={`p-4 rounded-2xl border flex flex-col gap-1.5 max-w-sm shrink-0 shadow-lg ${quadrantClass}`}>
            <div className="flex items-center gap-2">
              <span className="text-base">🧭</span>
              <span className="text-[10px] font-black uppercase tracking-wider">Kuadran Klinis</span>
            </div>
            <span className="text-sm font-black tracking-tight">{quadrantBadge}</span>
            <p className="text-[10px] leading-relaxed font-semibold opacity-90">{quadrantNote}</p>
          </div>
        </div>

        {/* Dinamic Rekomendasi Sosialisasi */}
        <div className={`p-5 rounded-2xl border flex gap-3.5 items-start ${isSlideMode ? 'bg-slate-700/50 border-slate-600 text-slate-100 font-semibold' : 'bg-teal-50/40 border-teal-100 text-teal-800 font-semibold'}`}>
          <div className="p-2 bg-teal-600 text-white rounded-xl shadow-md shrink-0"><Zap size={18} /></div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider block opacity-70">Rekomendasi Sosialisasi Ke Dokter Spesialis</span>
            <p className="text-xs font-semibold leading-relaxed mt-1">{quadrantTip}</p>
          </div>
        </div>

        {/* GLOWING SCORECARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
          {[
            { label: 'Jumlah Kasus', value: `${ksmRows.length} kasus`, sub: `${kPctOfHospital.toFixed(1)}% dari total RS`, color: 'from-sky-500/10 to-blue-600/5 text-sky-700 border-sky-100/50' },
            { label: 'Rerata Selisih (INA-RS)', value: formatRp(kAvgSelisihIna), sub: `Total: ${formatRp(kSelisihIna)}`, color: kSelisihIna >= 0 ? 'from-emerald-500/10 to-green-600/5 text-emerald-700 border-emerald-100/50' : 'from-rose-500/10 to-red-600/5 text-rose-700 border-rose-100/50' },
            { label: 'Rerata iDRG vs INA-CBG', value: `+${formatRp(kAvgIdrg - kAvgIna)}`, sub: `Total Potensi: +${formatRp(kSumIdrg - kSumIna)}`, color: 'from-purple-500/10 to-indigo-600/5 text-purple-700 border-purple-100/50' },
            { label: 'Rerata LOS vs RS', value: `${kAvgLos.toFixed(1)} Hari`, sub: `Rerata RS: ${hAvgLos.toFixed(1)} | Max: ${kMaxLos}`, color: kAvgLos > hAvgLos ? 'from-orange-500/10 to-amber-600/5 text-orange-700 border-orange-100/50' : 'from-teal-500/10 to-emerald-600/5 text-teal-700 border-teal-100/50' }
          ].map((card, i) => (
            <div key={i} className={`p-4.5 rounded-2xl border-2 bg-gradient-to-br ${card.color} flex flex-col gap-1 shadow-sm`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${isSlideMode ? 'text-slate-400' : 'text-slate-400'}`}>{card.label}</span>
              <span className={`text-xl font-black tracking-tight ${isSlideMode ? 'text-white' : 'text-slate-800'}`}>{card.value}</span>
              <span className="text-[10px] font-bold opacity-75">{card.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* GROUP CLUSTERS: INACBG & iDRG */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 INACBG Groups */}
        <Card className="flex flex-col">
          <div className="p-4 bg-sky-50 border-b border-sky-100/70 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 flex items-center gap-2"><Layers size={16} className="text-sky-600" /> Top 5 Group INACBG Utama</h3>
            <span className="text-[9px] font-black bg-sky-200 text-sky-800 px-2 py-0.5 rounded-full uppercase">KSM Kasus</span>
          </div>
          <div className="p-4 space-y-3 flex-1 overflow-auto max-h-[350px]">
            {topInaGroups.map((g, idx) => (
              <div key={idx} className="flex gap-3 bg-slate-50 hover:bg-slate-100/80 p-3 rounded-xl border border-slate-200/50 transition-all cursor-pointer" onClick={() => openDrilldown(`INA Group: ${g.code}`, row => String(row.INACBG).trim() === g.code)}>
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center font-black text-sky-700 border border-slate-200/80 shrink-0 text-xs shadow-sm">
                  {g.code}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="text-xs font-black text-slate-800 truncate" title={g.desc}>{g.desc}</span>
                  <span className="text-[10px] text-slate-500 font-bold mt-0.5">{g.count} Kasus • Rerata Selisih: <span className={g.totalSelisih >= 0 ? 'text-lime-600 font-black' : 'text-rose-600 font-black'}>{formatRp(g.totalSelisih / g.count)}</span></span>
                </div>
              </div>
            ))}
            {topInaGroups.length === 0 && <div className="p-6 text-center text-slate-400 text-xs font-semibold">Tidak ada grup INACBG terdeteksi.</div>}
          </div>
        </Card>

        {/* Top 5 iDRG Groups */}
        <Card className="flex flex-col">
          <div className="p-4 bg-orange-50 border-b border-orange-100/70 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 flex items-center gap-2"><Layers size={16} className="text-orange-600" /> Top 5 Group iDRG Utama</h3>
            <span className="text-[9px] font-black bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full uppercase font-bold">iDRG Kasus</span>
          </div>
          <div className="p-4 space-y-3 flex-1 overflow-auto max-h-[350px]">
            {topIdrgGroups.map((g, idx) => (
              <div key={idx} className="flex gap-3 bg-slate-50 hover:bg-slate-100/80 p-3 rounded-xl border border-slate-200/50 transition-all cursor-pointer" onClick={() => openDrilldown(`iDRG Group: ${g.code}`, row => String(row.IDRG_DRG_CODE).trim() === g.code)}>
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center font-black text-orange-700 border border-slate-200/80 shrink-0 text-xs shadow-sm">
                  {g.code}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="text-xs font-black text-slate-800 truncate" title={g.desc}>{g.desc}</span>
                  <span className="text-[10px] text-slate-500 font-bold mt-0.5">{g.count} Kasus • Rerata Selisih: <span className={g.totalSelisih >= 0 ? 'text-lime-600 font-black' : 'text-rose-600 font-black'}>{formatRp(g.totalSelisih / g.count)}</span></span>
                </div>
              </div>
            ))}
            {topIdrgGroups.length === 0 && <div className="p-6 text-center text-slate-400 text-xs font-semibold">Tidak ada grup iDRG terdeteksi.</div>}
          </div>
        </Card>
      </div>

      {/* DOUBLE ACTIONABLE TARGET LISTS (DIAGNOSA VS TINDAKAN) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top 5 Diagnosa Utama Berdefisit */}
        <Card className="flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-red-50 flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-700 rounded-xl"><AlertTriangle size={18} /></div>
            <div>
              <h3 className="font-extrabold text-slate-800">Top 5 Diagnosa Utama Berdefisit (ICD-10)</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Diagnosa primer penyumbang akumulasi defisit tertinggi — Klik untuk rincian kasus</p>
            </div>
          </div>
          <div className="p-4 space-y-4 flex-1 overflow-auto max-h-[500px]">
            {top5Diags.map((d, idx) => (
              <div key={idx} className="bg-white p-4.5 rounded-2xl border-2 border-red-100 shadow-sm flex flex-col gap-3 hover:border-red-300 transition-all cursor-pointer" onClick={() => openDrilldown(`Diagnosa Berdefisit: ${d.code}`, row => String(row.DIAGNOSA || row.DIAGUTAMA).trim() === d.code)}>
                <div className="flex justify-between items-start gap-3">
                  <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg font-black text-xs shrink-0">{d.code}</span>
                  <span className="text-xs font-black text-slate-700 flex-1 truncate">{d.desc}</span>
                  <span className="font-black text-red-600 text-xs whitespace-nowrap">{formatRp(d.totalDefisit)}</span>
                </div>
                <div className="flex flex-col gap-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] font-semibold text-slate-600">
                  <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest block">💡 Rekomendasi Koding / Sosialisasi Dokter:</span>
                  {getCodingGuideline(d.code)}
                </div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide flex items-center justify-between">
                  <span>Kasus Terdampak: <strong>{d.count} kali</strong></span>
                  <span>Rata-rata Kerugian/Kasus: <strong className="text-red-500">{formatRp(d.totalDefisit / d.count)}</strong></span>
                </div>
              </div>
            ))}
            {top5Diags.length === 0 && <div className="p-10 text-center text-slate-400 text-sm font-semibold">Hebat! Tidak ada diagnosa utama yang mengalami defisit finansial di KSM ini.</div>}
          </div>
        </Card>

        {/* Top 5 Tindakan Utama Berdefisit */}
        <Card className="flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-amber-50 flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl"><Scissors size={18} /></div>
            <div>
              <h3 className="font-extrabold text-slate-800">Top 5 Tindakan Utama Berdefisit (ICD-9-CM)</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Prosedur penunjang / operasi utama penyumbang kerugian terbesar — Klik untuk rincian kasus</p>
            </div>
          </div>
          <div className="p-4 space-y-4 flex-1 overflow-auto max-h-[500px]">
            {top5Procs.map((p, idx) => (
              <div key={idx} className="bg-white p-4.5 rounded-2xl border-2 border-amber-100 shadow-sm flex flex-col gap-3 hover:border-amber-300 transition-all cursor-pointer" onClick={() => openDrilldown(`Tindakan Berdefisit: ${p.code}`, row => String(row.PROSEDUR || row.PROSEDUR_UTAMA || row.PROCLIST || '-').trim().split(/[;, ]/)[0] === p.code)}>
                <div className="flex justify-between items-start gap-3">
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-black text-xs shrink-0">{p.code}</span>
                  <span className="text-xs font-black text-slate-700 flex-1 truncate">{p.desc}</span>
                  <span className="font-black text-amber-600 text-xs whitespace-nowrap">{formatRp(p.totalDefisit)}</span>
                </div>
                <div className="flex flex-col gap-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] font-semibold text-slate-600">
                  <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest block">💡 Rekomendasi Dokumentasi Klinis:</span>
                  {getProcedureGuideline(p.code)}
                </div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide flex items-center justify-between">
                  <span>Kasus Terdampak: <strong>{p.count} kali</strong></span>
                  <span>Rata-rata Kerugian/Kasus: <strong className="text-amber-500">{formatRp(p.totalDefisit / p.count)}</strong></span>
                </div>
              </div>
            ))}
            {top5Procs.length === 0 && <div className="p-10 text-center text-slate-400 text-sm font-semibold">Hebat! Tidak ada tindakan utama yang mengalami defisit finansial di KSM ini.</div>}
          </div>
        </Card>

      </div>

      {/* NEW: LOS & iDRG INTEGRATED 4-QUADRANT SCATTER VISUALIZER */}
      <Card className={`p-6 border flex flex-col gap-6 ${isSlideMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <Activity size={18} className="text-teal-600 animate-pulse" /> Peta Mutu Klinis (LOS) &amp; Simulasi iDRG
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Analisis korelasi lama hari rawat (LOS) terhadap profitabilitas. Klik bulatan pasien untuk melihat rekam medis.</p>
          </div>
          
          {/* Interactive Mode Toggle */}
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl w-fit shrink-0 print:hidden">
            <button
              onClick={() => setSocializationScatterMode('inacbg')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${socializationScatterMode === 'inacbg' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              🇮🇩 INA-CBG vs RS
            </button>
            <button
              onClick={() => setSocializationScatterMode('idrg')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${socializationScatterMode === 'idrg' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              ⚡ iDRG vs RS (Simulasi)
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 print:bg-white">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Rerata LOS KSM</span>
            <span className="text-base font-black text-slate-800 mt-1">{kAvgLos.toFixed(1)} Hari</span>
            <span className="text-[10px] font-bold text-slate-500 mt-0.5">RS Baseline: {hAvgLos.toFixed(1)} Hari</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Efisiensi LOS</span>
            <span className="text-base font-black text-teal-600 mt-1">{pctEfficientLos.toFixed(1)}%</span>
            <span className="text-[10px] font-bold text-slate-500 mt-0.5">Kasus &lt;= Rerata RS</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Kinerja Keuangan ({socializationScatterMode.toUpperCase()})</span>
            <span className={`text-base font-black mt-1 ${socializationScatterMode === 'idrg' ? (kSelisihIdrg >= 0 ? 'text-lime-600' : 'text-rose-600') : (kSelisihIna >= 0 ? 'text-emerald-600' : 'text-rose-600')}`}>
              {socializationScatterMode === 'idrg' ? formatRp(kAvgSelisihIdrg) : formatRp(kAvgSelisihIna)}
            </span>
            <span className="text-[10px] font-bold text-slate-500 mt-0.5">Rerata Margin per Kasus</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Maksimal LOS</span>
            <span className="text-base font-black text-rose-600 mt-1">{kMaxLos} Hari</span>
            <span className="text-[10px] font-bold text-slate-500 mt-0.5">Lama Rawat Terpanjang</span>
          </div>
        </div>

        {/* Main Visualizer: Scatter plot & Legend (Full Width / Fit-to-Width Redesign) */}
        <div className="space-y-6">
          <div className="w-full">
            <div className="mb-2 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Menampilkan: <span className="text-teal-600 font-extrabold">{socializationScatterMode === 'idrg' ? 'Simulasi Tarif iDRG vs Biaya Riil' : 'Tarif INA-CBG vs Biaya Riil'}</span>
            </div>
            <ScatterChart
              data={scatterData}
              xKey="selisih"
              yKey="los"
              rKey="rsTarif"
              color={socializationScatterMode === 'idrg' ? '#8b5cf6' : '#0d9488'}
              xLabel={socializationScatterMode === 'idrg' ? "Selisih Finansial iDRG vs RS (Rupiah)" : "Selisih Finansial INA-CBG vs RS (Rupiah)"}
              yLabel="Lama Hari Rawat (LOS - Hari)"
              title=""
              onDotClick={(d) => openDrilldown(`Kasus Pasien: SEP ${d.SEP || d.sep || d.no_sep || ''}`, row => (row.SEP || row.sep || row.NO_SEP || row.no_sep || '').trim() === (d.SEP || d.sep || d.NO_SEP || d.no_sep || '').trim())}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* iDRG Impact Insight Panel */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4.5 rounded-2xl border border-indigo-100/50 space-y-2.5">
              <span className="text-[10px] font-black text-indigo-800 uppercase tracking-wider block">⚡ Analisis Akselerasi Tarif iDRG</span>
              <p className="text-xs font-semibold leading-relaxed text-slate-700">
                Implementasi sistem tarif iDRG diproyeksikan meningkatkan rata-rata pendapatan per kasus KSM ini sebesar <strong className="text-indigo-700 font-black">+{formatRp(kAvgIdrg - kAvgIna)}</strong>.
              </p>
              <div className="text-[10px] text-slate-600 font-bold border-t border-indigo-200/50 pt-2 flex flex-col gap-1">
                <div className="flex justify-between">
                  <span>Kasus Defisit INA-CBG:</span>
                  <span className="text-rose-600 font-black">{inaDeficitCount} kasus</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasus Defisit iDRG:</span>
                  <span className="text-emerald-600 font-black">{idrgDeficitCount} kasus</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-indigo-300 pt-1.5 font-extrabold text-indigo-900 mt-1">
                  <span>Kasus Terselamatkan:</span>
                  <span>{inaDeficitCount - idrgDeficitCount} kasus ({((inaDeficitCount - idrgDeficitCount) / (inaDeficitCount || 1) * 100).toFixed(0)}%)</span>
                </div>
              </div>
            </div>

            {/* Quadrant Legend */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 print:bg-white text-[11px] font-semibold text-slate-600">
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">Evaluasi Mutu &amp; Kendali Biaya</span>
              
              <div className="flex items-start gap-2.5">
                <div className="w-3 h-3 rounded bg-emerald-500 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-emerald-800 uppercase">Kuadran I (Surplus &amp; LOS Tinggi)</span>
                  <span className="text-[9px] text-slate-500 font-medium">Kasus kompleks dengan diagnosis penyerta lengkap.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 border-t border-slate-200/60 pt-2">
                <div className="w-3 h-3 rounded bg-rose-500 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-rose-800 uppercase">Kuadran II (Defisit &amp; LOS Tinggi)</span>
                  <span className="text-[9px] text-slate-500 font-medium">Lama rawat tinggi melebihi batas tarif paket. Area Audit CP!</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 border-t border-slate-200/60 pt-2">
                <div className="w-3 h-3 rounded bg-amber-500 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-amber-800 uppercase">Kuadran III (Defisit &amp; LOS Rendah)</span>
                  <span className="text-[9px] text-slate-500 font-medium">Kasus cepat tapi merugi. Indikasi kurangnya koding diagnosis sekunder.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 border-t border-slate-200/60 pt-2">
                <div className="w-3 h-3 rounded bg-blue-500 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-blue-800 uppercase">Kuadran IV (Surplus &amp; LOS Rendah)</span>
                  <span className="text-[9px] text-slate-500 font-medium">Layanan efisien &amp; profitabel. Standar Clinical Pathway ideal!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 18-COMPONENT COST EFFICIENCY ANALYZER (KSM vs Hospital Average) */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-white flex items-center gap-3">
          <div className="p-2 bg-teal-100 text-teal-700 rounded-xl"><Layers size={18} /></div>
          <div>
            <h3 className="font-extrabold text-slate-800 font-semibold">Analisis Deviasi 18 Komponen Biaya</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Perbandingan rata-rata biaya satuan komponen KSM terhadap Rata-rata Rumah Sakit secara keseluruhan.</p>
          </div>
        </div>
        <div className="p-5 overflow-x-auto custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {compKeys.map((c) => {
              const kAvg = kAvgComps[c.key] || 0;
              const hAvg = hAvgComps[c.key] || 0;
              const deviation = hAvg > 0 ? ((kAvg - hAvg) / hAvg) * 100 : 0;
              
              // Color formatting
              let badgeClass = "bg-slate-50 text-slate-600 border-slate-200";
              if (deviation > 10) {
                badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
              } else if (deviation < -10) {
                badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
              }

              return (
                <div key={c.key} className={`p-3 rounded-xl border-2 flex flex-col gap-1 shadow-sm ${badgeClass}`}>
                  <span className="text-[9px] font-black uppercase tracking-wider block truncate" title={c.label}>{c.label}</span>
                  <span className="text-sm font-black mt-0.5">{formatRp(kAvg)}</span>
                  <div className="flex items-center justify-between text-[9px] font-bold opacity-75 mt-1 border-t border-dashed border-current/20 pt-1">
                    <span>RS: {formatRpEx(hAvg)}</span>
                    <span className="font-black">{deviation >= 0 ? '+' : ''}{deviation.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="p-3 text-center text-[10px] font-bold text-slate-400 bg-slate-50 border-t">
          * Keterangan: Warna <span className="text-rose-500 font-extrabold">Merah</span> menandakan pengeluaran KSM lebih dari 10% di atas Rata-rata RS. Warna <span className="text-emerald-500 font-extrabold">Hijau</span> menandakan pengeluaran di bawah rata-rata RS (Efisien).
        </div>
      </Card>

    </div>
  );
});

export default function App() {
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('sak_activeTab') || 'upload');
  const [subTab, setSubTab] = useState(() => sessionStorage.getItem('sak_subTab') || 'executive');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [drilldown, setDrilldown] = useState({ isOpen: false, title: '', data: [], type: 'patient' });
  const [globalFilter, setGlobalFilter] = useState(() => {
    try {
      const saved = sessionStorage.getItem('sak_globalFilter');
      return saved ? JSON.parse(saved) : { periode: [], jenisRawat: [], kelasRawat: [], dpjp: [], ksm: [], departemen: [] };
    } catch (e) { return { periode: [], jenisRawat: [], kelasRawat: [], dpjp: [], ksm: [], departemen: [] }; }
  });
  const [isScrolled, setIsScrolled] = useState(false);
  const [reportSubTab, setReportSubTab] = useState('summary');
  const [excludeProcFilter, setExcludeProcFilter] = useState(() => localStorage.getItem('sak_exclude_proc_filter') === 'true');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [auditFilter, setAuditFilter] = useState('');
  const [auditRuleFilter, setAuditRuleFilter] = useState('');
  const [auditReviewFilter, setAuditReviewFilter] = useState('');
  const [mapFilter, setMapFilter] = useState('');
  const [pemetaanTab, setPemetaanTab] = useState('inaToIdrg');
  const [mapModal, setMapModal] = useState({ isOpen: false, type: '', code: '', desc: '' });
  const [uploadSubTab, setUploadSubTab] = useState('manual');
  const [driveUrl, setDriveUrl] = useState('');
  const [ksmOverrides, setKsmOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem('sak_ksm_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });
  const [overrideSearch, setOverrideSearch] = useState('');
  const [expandedKsms, setExpandedKsms] = useState({});
  const [pendingDurations, setPendingDurations] = useState({});
  const [showPasswordList, setShowPasswordList] = useState({});
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [openKsm, setOpenKsm] = useState(null);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [auditVerdicts, setAuditVerdicts] = useState(() => {
    try {
      const saved = sessionStorage.getItem('sak_auditVerdicts');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // --- USER ACCESS MANAGEMENT SYSTEM STATES ---
  const [registrationSheetId, setRegistrationSheetId] = useState(() => localStorage.getItem('sak_registration_sheet_id') || '1GG8xDtNii2N4V9yNlP_Na-fQtM4zN30ZkLD0aUnMY98');
  const [registrationGid, setRegistrationGid] = useState(() => {
    const saved = localStorage.getItem('sak_registration_gid');
    return (saved && saved !== '1382718302') ? saved : '2082885116';
  });
  const [registrationScriptUrl, setRegistrationScriptUrl] = useState(() => {
    const saved = localStorage.getItem('sak_registration_script_url');
    const oldUrls = [
      'https://script.google.com/macros/s/AKfycbwiCOoo3cs6B_VJjlSG-UCsQEjCV687TnruZ1TD6mNjUXxzZnCYJ0pxQjMIjffz6X7Z/exec',
      'https://script.google.com/macros/s/AKfycbxL88WWiRrQ5JbNAq2qSxnTBULpHYJuaRdNINxFwfZVgdHhp3oojsGQEEHuwQLMLKDn/exec',
      'https://script.google.com/macros/s/AKfycbyChScgs4N8u2wLV8y7fFRj7jyNrUlyPVrarBWfIHToVWqrl3svMD3zZleOEg5je9Qt/exec',
      'https://script.google.com/macros/s/AKfycbzIJd7V5NkJIFJ44MLb9IS9QpDauTClCulaZ2ahTHOWdsG4Drp-jBjiRcRw6BZr8thC/exec',
      'https://script.google.com/macros/s/AKfycbzAoK69sGChliR447lin10wAdASp9nQXdH2pRfytNycDMmmb-SR4Sv8sOgZw30i_mfr/exec',
      'https://script.google.com/macros/s/AKfycbwcjH4-pbnUwPBS6Vu-c6_OjOGKmrp_r2FOp4WDC4ZeCIWI4zhgLPhD4sDtzVidSd_Y/exec',
      'https://script.google.com/macros/s/AKfycbzLrxBDxME-n5kfNHgKW0SlTbw_GqpqfHe8eTJs50WBRxBkaqZLAfLzzANFOSGdzh-R/exec'
    ];
    return (saved && !oldUrls.includes(saved)) ? saved : 'https://script.google.com/macros/s/AKfycbwDfLqyeRjDs6LUpZ5unl3gh0muwS2zECBS6jsPgL3poqmicuWuA9l6ph2qCcqkHVcE/exec';
  });
  const [userSearchTerm, setUserSearchTerm] = useState("");

  const [customKsms, setCustomKsms] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sak_custom_ksms')) || []; } catch(e){ return []; }
  });
  const [customDepts, setCustomDepts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sak_custom_depts')) || []; } catch(e){ return []; }
  });
  const [newKsmInput, setNewKsmInput] = useState("");
  const [newDeptInput, setNewDeptInput] = useState("");

  const addCustomKsm = () => {
    if(newKsmInput.trim()) {
      const updated = [...customKsms, newKsmInput.trim().toUpperCase()];
      setCustomKsms(updated);
      localStorage.setItem('sak_custom_ksms', JSON.stringify(updated));
      setNewKsmInput("");
    }
  };

  const addCustomDept = () => {
    if(newDeptInput.trim()) {
      const updated = [...customDepts, newDeptInput.trim().toUpperCase()];
      setCustomDepts(updated);
      localStorage.setItem('sak_custom_depts', JSON.stringify(updated));
      setNewDeptInput("");
    }
  };

  const [pendingUsers, setPendingUsers] = useState([]);
  const [userAccounts, setUserAccounts] = useState([]);
  const [rejectedUsers, setRejectedUsers] = useState([]);
  const [activeUsersList, setActiveUsersList] = useState([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [userManagementError, setUserManagementError] = useState('');
  const [userManagementSuccess, setUserManagementSuccess] = useState('');
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserData, setEditUserData] = useState({});

  // --- STATE UNTUK INSIGHT SOSIALISASI ---
  const [selectedSocializationDept, setSelectedSocializationDept] = useState('');
  const [selectedSocializationKsm, setSelectedSocializationKsm] = useState('');
  const [isSlideMode, setIsSlideMode] = useState(false);
  const [socializationScatterMode, setSocializationScatterMode] = useState('inacbg');
  const [draftKsmOverrides, setDraftKsmOverrides] = useState(null);
  const [icdSyncVersion, setIcdSyncVersion] = useState(0);

  // Kamus ICD States
  const [icdSheetUrl, setIcdSheetUrl] = useState(() => localStorage.getItem("sak_icd_sheet_url") || "");
  const [isSyncingIcd, setIsSyncingIcd] = useState(false);
  const [icdSyncStatus, setIcdSyncStatus] = useState("");
  const [icdSearchQuery, setIcdSearchQuery] = useState("");
  const [autoSyncStatus, setAutoSyncStatus] = useState(""); // "syncing", "done", "failed"
  const [excludeCodes, setExcludeCodes] = useState({
    '89': true,
    '90_91': true,
    '99': true,
    '87.44_87.49': true,
    '57.94': true,
    '93.57': true,
    '93.96': true,
    '99.21': true,
    '96.07': true,
    '99.290': true
  });

  const excludeProcCodes = useMemo(() => Object.values(excludeCodes).some(v => v), [excludeCodes]);

  const activeExclusionCodes = useMemo(() => {
    const list = [];
    if (excludeCodes['89']) list.push('89');
    if (excludeCodes['90_91']) { list.push('90'); list.push('91'); }
    if (excludeCodes['99']) list.push('99');
    if (excludeCodes['87.44_87.49']) { list.push('87.44'); list.push('87.49'); }
    if (excludeCodes['57.94']) list.push('57.94');
    if (excludeCodes['93.57']) list.push('93.57');
    if (excludeCodes['93.96']) list.push('93.96');
    if (excludeCodes['99.21']) list.push('99.21');
    if (excludeCodes['96.07']) list.push('96.07');
    if (excludeCodes['99.290']) list.push('99.290');
    return list;
  }, [excludeCodes]);

  const handleToggleAllExclusions = (checked) => {
    setExcludeCodes({
      '89': checked,
      '90_91': checked,
      '99': checked,
      '87.44_87.49': checked,
      '57.94': checked,
      '93.57': checked,
      '93.96': checked,
      '99.21': checked,
      '96.07': checked,
      '99.290': checked
    });
  };

  const [showAdOverlay, setShowAdOverlay] = useState(true);
  const [initialAdDone, setInitialAdDone] = useState(false);
  const idleTimerRef = useRef(null);

  // Handle Responsive Sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    // Initial call
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initial 5-second Ad
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAdOverlay(false);
      setInitialAdDone(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Clear global resolveCache when overrides are modified
  useEffect(() => {
    resolveCache.clear();
  }, [ksmOverrides]);

  // Load dynamic ICD Dictionary from IndexedDB on mount & listen to sync events & run silent background auto-sync!
  useEffect(() => {
    const loadIcdDictionary = async () => {
      try {
        console.log('[SAK-iDRG] Loading dynamic ICD dictionary from IndexedDB...');
        const map = await loadIcdDictFromDb();
        const size = Object.keys(map).length;
        if (size > 0) {
          console.log(`[SAK-iDRG] Successfully loaded ${size} ICD dictionary codes from IndexedDB.`);
          setIcdSyncVersion(prev => prev + 1);
        } else {
          console.log('[SAK-iDRG] Local ICD dictionary database is empty or not synchronized yet.');
        }
      } catch (err) {
        console.error('[SAK-iDRG] Failed to load ICD dictionary from IndexedDB:', err);
      }
      
      // Run automatic background synchronization silently!
      runSilentBackgroundSync();
    };

    const runSilentBackgroundSync = async () => {
      const urlToSync = localStorage.getItem("sak_icd_sheet_url") || "https://docs.google.com/spreadsheets/d/19Fqy6_e_j9_cuH43as9pB_5gJjWnPO3Eb2EIfX1or-w/edit?usp=sharing";
      setAutoSyncStatus("syncing");
      try {
        console.log('[SAK-iDRG] Starting silent automatic background sync for ICD Dictionary...');
        const exportUrl = getGoogleSheetCsvUrl(urlToSync.trim());
        const res = await fetch(exportUrl);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        
        const text = await res.text();
        const dictArray = parseCSV(text);
        if (dictArray && dictArray.length > 0) {
          await saveIcdDictToDb(dictArray);
          
          const map = {};
          dictArray.forEach(item => {
            const code = String(item.code).trim().toUpperCase();
            const desc = String(item.desc).trim();
            map[code] = desc;
            
            const noDot = code.replace(/\./g, '');
            if (noDot !== code) {
              map[noDot] = desc;
            }
          });
          
          window.sakIcdMap = { ...BASE_ICD_FALLBACK, ...map };
          globalIcdMap = window.sakIcdMap;
          
          window.dispatchEvent(new CustomEvent('sak_icd_sync_complete', { detail: window.sakIcdMap }));
          console.log(`[SAK-iDRG] Silent automatic background ICD sync finished successfully. Loaded ${dictArray.length} codes.`);
          setAutoSyncStatus("done");
        } else {
          setAutoSyncStatus("failed");
        }
      } catch (err) {
        console.warn('[SAK-iDRG] Silent automatic background ICD sync failed, using offline fallback:', err.message);
        setAutoSyncStatus("failed");
      }
    };

    const handleSyncComplete = (e) => {
      console.log('[SAK-iDRG] ICD sync complete event received. Refreshing RAM cache...');
      setIcdSyncVersion(prev => prev + 1);
    };

    loadIcdDictionary();
    window.addEventListener('sak_icd_sync_complete', handleSyncComplete);
    return () => {
      window.removeEventListener('sak_icd_sync_complete', handleSyncComplete);
    };
  }, []);

  // Idle Timer (10 minutes)
  useEffect(() => {
    if (!initialAdDone) return;

    const resetIdleTimer = () => {
      if (showAdOverlay) setShowAdOverlay(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setShowAdOverlay(true);
      }, 600000); // 10 minutes
    };

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('click', resetIdleTimer);
    window.addEventListener('scroll', resetIdleTimer);

    resetIdleTimer();

    return () => {
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('click', resetIdleTimer);
      window.removeEventListener('scroll', resetIdleTimer);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [initialAdDone, showAdOverlay]);

  // Persistence Sync
  useEffect(() => {
    console.log('[SAK-iDRG] Navigation state:', { activeTab, subTab });
    sessionStorage.setItem('sak_activeTab', activeTab);
    sessionStorage.setItem('sak_subTab', subTab);
    sessionStorage.setItem('sak_globalFilter', JSON.stringify(globalFilter));
    sessionStorage.setItem('sak_auditVerdicts', JSON.stringify(auditVerdicts));
    localStorage.setItem('sak_ksm_overrides', JSON.stringify(ksmOverrides));
    localStorage.setItem('sak_registration_sheet_id', registrationSheetId);
    localStorage.setItem('sak_registration_gid', registrationGid);
    localStorage.setItem('sak_registration_script_url', registrationScriptUrl);
  }, [activeTab, subTab, globalFilter, auditVerdicts, ksmOverrides, registrationSheetId, registrationGid, registrationScriptUrl]);

  const fetchUserManagementData = async () => {
    try {
      setIsLoadingUsers(true);
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      const approved = data.filter(u => u.status === 'active');
      const pending = data.filter(u => u.status === 'pending');
      const rejected = data.filter(u => u.status === 'rejected');
      
      setUserAccounts(approved);
      setPendingUsers(pending);
      setRejectedUsers(rejected);
      setUserManagementError('');
    } catch (err) {
      setUserManagementError('Gagal mengambil data user: ' + err.message);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleApprove = async (userId) => {
    const duration = pendingDurations[userId] || 12;
    setIsProcessingAction(true);
    setUserManagementError('');
    setUserManagementSuccess('');
    try {
      const masaAktif = new Date();
      if (duration !== 999) masaAktif.setMonth(masaAktif.getMonth() + duration);
      else masaAktif.setFullYear(masaAktif.getFullYear() + 100);

      const { error } = await supabase.from('profiles').update({ status: 'active', masa_aktif: masaAktif }).eq('id', userId);
      if (error) throw error;
      
      setUserManagementSuccess('Pengguna berhasil disetujui!');
      fetchUserManagementData();
    } catch (err) {
      setUserManagementError('Gagal menyetujui akun: ' + err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm('Apakah Anda yakin ingin menolak pengajuan ini?')) return;
    setIsProcessingAction(true);
    setUserManagementError('');
    setUserManagementSuccess('');
    try {
      const { error } = await supabase.from('profiles').update({ status: 'rejected' }).eq('id', userId);
      if (error) throw error;
      setUserManagementSuccess('Pengguna berhasil ditolak!');
      fetchUserManagementData();
    } catch (err) {
      setUserManagementError('Gagal menolak akun: ' + err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDeleteActive = async (userId) => {
    if (!window.confirm('Apakah Anda yakin ingin menonaktifkan akses pengguna ini?')) return;
    setIsProcessingAction(true);
    setUserManagementError('');
    setUserManagementSuccess('');
    try {
      const { error } = await supabase.from('profiles').update({ status: 'disabled' }).eq('id', userId);
      if (error) throw error;
      setUserManagementSuccess('Akses pengguna berhasil dinonaktifkan.');
      fetchUserManagementData();
    } catch (err) {
      setUserManagementError('Gagal menonaktifkan akun: ' + err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleEditUserClick = (u) => {
    setEditingUser(u);
    setEditUserData({
      nama_lengkap: u.nama_lengkap || '',
      nama_faskes: u.nama_faskes || '',
      no_wa: u.no_wa || '',
      role: u.role || 'user',
      status: u.status || 'active',
      masa_aktif: u.masa_aktif ? new Date(u.masa_aktif).toISOString().split('T')[0] : ''
    });
    setShowEditUserModal(true);
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    setIsProcessingAction(true);
    setUserManagementError('');
    try {
      const updates = {
        nama_lengkap: editUserData.nama_lengkap,
        nama_faskes: editUserData.nama_faskes,
        no_wa: editUserData.no_wa,
        role: editUserData.role,
        status: editUserData.status,
        masa_aktif: editUserData.masa_aktif ? new Date(editUserData.masa_aktif).toISOString() : null
      };
      const { error } = await supabase.from('profiles').update(updates).eq('id', editingUser.id);
      if (error) throw error;
      
      setUserManagementSuccess('Data pengguna berhasil diperbarui!');
      setShowEditUserModal(false);
      fetchUserManagementData();
    } catch (err) {
      setUserManagementError('Gagal menyimpan data pengguna: ' + err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };



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
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [username, setUsername] = useState(() => localStorage.getItem('sak_username') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [validUsers, setValidUsers] = useState([{ username: 'Admin', password: 'Admin17' }]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotIdentity, setForgotIdentity] = useState('');
  const [isProcessingForgot, setIsProcessingForgot] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

  const [showRegister, setShowRegister] = useState(false);
  const [regData, setRegData] = useState({ email: '', password: '', username: '', nama: '', faskes: '', wa: '' });
  const [regState, setRegState] = useState({ loading: false, error: '', success: '' });

  useEffect(() => {
    if (subTab === "user_management" && (username.toLowerCase() === 'admin' || username.toLowerCase() === 'admin@admin.com')) {
      fetchUserManagementData();
    }
  }, [subTab, username]);


  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        setUsername(session.user.email);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!captchaVerified) {
      setLoginError('Harap selesaikan verifikasi keamanan (geser puzzle) terlebih dahulu.');
      return;
    }
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const loginEmail = username.includes('@') ? username.replace(/\s+/g, '') : `${username.replace(/\s+/g, '')}@akurat.id`;
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password
      });

      if (authError) {
        setLoginError('Login gagal: ' + authError.message);
        setPassword('');
        setCaptchaVerified(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        setLoginError('Profil tidak ditemukan. Hubungi admin.');
        await supabase.auth.signOut();
        return;
      }

      if (profile.status === 'pending') {
        setLoginError('Akun Anda masih menunggu persetujuan Admin.');
        await supabase.auth.signOut();
        return;
      }

      if (profile.status === 'rejected') {
        setLoginError('Mohon maaf, permohonan akun Anda ditolak.');
        await supabase.auth.signOut();
        return;
      }

      if (profile.masa_aktif) {
        const activeDate = new Date(profile.masa_aktif);
        const today = new Date();
        if (activeDate < today) {
          setLoginError(`Masa berlaku akses Anda telah habis. Silahkan hubungi Admin AKURAT - iDRG.`);
          await supabase.auth.signOut();
          return;
        }
      }

      localStorage.setItem('sak_role', profile.role || 'user');
      setShowDisclaimer(true);
      setLoginError('');
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
    localStorage.setItem('sak_isLoggedIn', 'true');
    localStorage.setItem('sak_username', username);
    localStorage.setItem('sak_login_time', Date.now().toString());

    setActiveTab('upload');
    setIsLoggedIn(true);
    setShowDisclaimer(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegState({ loading: true, error: '', success: '' });
    try {
      const { error } = await supabase.auth.signUp({
        email: regData.email,
        password: regData.password,
        options: {
          data: {
            username: regData.username,
            nama: regData.nama,
            faskes: regData.faskes,
            wa: regData.wa
          }
        }
      });
      if (error) throw error;
      setRegState({ loading: false, error: '', success: 'Permohonan akun berhasil! Admin akan segera meninjau akun Anda.' });
      setTimeout(() => setShowRegister(false), 3000);
    } catch (err) {
      setRegState({ loading: false, error: err.message, success: '' });
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotIdentity.trim()) {
      setForgotError('Harap masukkan Email Anda.');
      return;
    }
    setIsProcessingForgot(true);
    setForgotError('');
    setForgotSuccess('');
    try {
      const resetEmail = forgotIdentity.trim().includes('@') ? forgotIdentity.trim() : `${forgotIdentity.trim()}@akurat.id`;
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
      if (error) throw error;
      setForgotSuccess('Email reset password berhasil dikirim! Silakan periksa kotak masuk Anda.');
      setForgotIdentity('');
    } catch (err) {
      setForgotError('Gagal mengirim email: ' + err.message);
    } finally {
      setIsProcessingForgot(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setLoginError('');
    setCaptchaVerified(false);
    localStorage.removeItem('sak_session_id');
    localStorage.removeItem('sak_isLoggedIn');
    localStorage.removeItem('sak_username');
    localStorage.removeItem('sak_login_time');
  };

  // Sesi Lokal Mandiri: Inactivity & Absolute Expiry Tracker
  useEffect(() => {
    if (!isLoggedIn) return;

    // A. Absolute Expiry: Cek apakah sesi login sudah melebihi 24 jam
    const checkAbsoluteExpiry = () => {
      const loginTime = localStorage.getItem('sak_login_time');
      const now = Date.now();
      if (loginTime && now - parseInt(loginTime) > 24 * 60 * 60 * 1000) {
        alert("Sesi login Anda telah berakhir (Maksimal 24 jam). Silakan masuk kembali.");
        handleLogout();
        return true;
      }
      return false;
    };

    // Lakukan pemeriksaan awal saat mount
    if (checkAbsoluteExpiry()) return;

    // B. Inactivity Timeout (30 Menit)
    let timeoutId;
    const resetTimer = () => {
      // Periksa absolute expiry setiap kali pengguna berinteraksi
      if (checkAbsoluteExpiry()) return;

      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        alert("Sesi terputus karena tidak ada aktivitas selama 30 menit. Silakan login kembali untuk melanjutkan.");
        handleLogout();
      }, 30 * 60 * 1000); // 30 menit
    };

    // Dengarkan event interaksi pengguna untuk mereset inactivity timer
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    
    // Mulai timer pertama kali
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [isLoggedIn]);

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
    const filterFn = c => {
      if (!c || c === '-') return false;
      return !exclusions.some(exc => {
        const cleanExc = String(exc).trim().toUpperCase();
        const cleanC = String(c).trim().toUpperCase();
        const noDotExc = cleanExc.replace(/\./g, '');
        const noDotC = cleanC.replace(/\./g, '');
        return cleanC === cleanExc || cleanC.startsWith(cleanExc) || noDotC.startsWith(noDotExc);
      });
    };
    const cleanIna = Array.from(new Set(arrIna.map(c => String(c).trim().toUpperCase()).filter(filterFn)));
    const cleanIdrg = Array.from(new Set(arrIdrg.map(c => String(c).trim().toUpperCase()).filter(filterFn)));
    if (cleanIna.length === 0 && cleanIdrg.length === 0) return 100;
    if (cleanIna.length === 0 || cleanIdrg.length === 0) return 0;
    let mIna = 0, mIdrg = 0;
    cleanIna.forEach(i => { if (cleanIdrg.some(id => i.startsWith(id) || id.startsWith(i))) mIna++; });
    cleanIdrg.forEach(id => { if (cleanIna.some(i => i.startsWith(id) || id.startsWith(i))) mIdrg++; });
    if (mIna === cleanIna.length && mIdrg === cleanIdrg.length) return 100;
    return ((mIna / cleanIna.length) * 100 + (mIdrg / cleanIdrg.length) * 100) / 2;
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
        setSubTab('executive');
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
      const np = normDpjp(r['DPJP']); if (!dpjps.has(np)) dpjps.set(np, maskName(r['DPJP'] || 'Unknown'));
      const ksm = extractKsm(r['DPJP'] || 'Unknown', ksmOverrides);
      ksms.add(ksm);
      depts.add(getDept(ksm, r['DPJP'] || 'Unknown', ksmOverrides));
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
      if (globalFilter.ksm.length > 0 && !globalFilter.ksm.includes(extractKsm(row['DPJP'] || 'Unknown', ksmOverrides))) return false;
      if (globalFilter.departemen.length > 0) {
        const ksmName = extractKsm(row['DPJP'] || 'Unknown', ksmOverrides);
        const deptName = getDept(ksmName, row['DPJP'] || 'Unknown', ksmOverrides);
        if (!globalFilter.departemen.includes(deptName)) return false;
      }
      return true;
    });

    if (rows.length === 0) return { isLoaded: true, rawRows: rows, totalRows: 0, isEmptyAfterFilter: true };

    let stats = { tIna: 0, tIdrg: 0, cInaHigh: 0, cIdrgHigh: 0, cEq: 0, selisihList: [], totalScoreDiag: 0, totalScoreProc: 0, scoredCount: 0, ranapCount: 0, anomaliKasus: 0, naikKelasKasus: 0, naikKelasNilai: 0, topUpKasus: 0, topUpNilai: 0, totalDiagUCount: 0, totalDiagSCount: 0, totalProcCount: 0 };
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

      const dList = String(r['DIAGLIST'] || '').replace(/"/g, '').split(';').map(d => d.trim()).filter(d => d);
      const pList = String(r['PROCLIST'] || '').replace(/"/g, '').split(';').map(p => p.trim()).filter(p => p && p !== '-' && p.toLowerCase() !== 'none');

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
      const ksmName = extractKsm(dpjpRaw, ksmOverrides);
      const deptName = getDept(ksmName, dpjpRaw, ksmOverrides);

      if (!maps.dpjp[np]) maps.dpjp[np] = { name: maskName(String(dpjpRaw)), normName: np, count: 0, sumRS: 0, sumIna: 0, sumIdrg: 0, sumLos: 0, maxLos: 0, comps: compKeys.reduce((a, c) => ({ ...a, [c.key]: 0 }), {}) };
      maps.dpjp[np].count++; maps.dpjp[np].sumRS += tRS; maps.dpjp[np].sumIna += tIna; maps.dpjp[np].sumIdrg += tIdrg; maps.dpjp[np].sumLos += los; if (los > maps.dpjp[np].maxLos) maps.dpjp[np].maxLos = los;

      if (!maps.ksm[ksmName]) maps.ksm[ksmName] = { name: ksmName, dept: deptName, count: 0, sumRS: 0, sumIna: 0, sumIdrg: 0, sumLos: 0, maxLos: 0, dpjps: {}, comps: compKeys.reduce((a, c) => ({ ...a, [c.key]: 0 }), {}) };
      maps.ksm[ksmName].count++; maps.ksm[ksmName].sumRS += tRS; maps.ksm[ksmName].sumIna += tIna; maps.ksm[ksmName].sumIdrg += tIdrg; maps.ksm[ksmName].sumLos += los; if (los > maps.ksm[ksmName].maxLos) maps.ksm[ksmName].maxLos = los;

      if (!maps.dept[deptName]) maps.dept[deptName] = { name: deptName, count: 0, sumRS: 0, sumIna: 0, sumIdrg: 0, sumLos: 0, maxLos: 0, ksms: {}, comps: compKeys.reduce((a, c) => ({ ...a, [c.key]: 0 }), {}) };
      maps.dept[deptName].count++; maps.dept[deptName].sumRS += tRS; maps.dept[deptName].sumIna += tIna; maps.dept[deptName].sumIdrg += tIdrg; maps.dept[deptName].sumLos += los; if (los > maps.dept[deptName].maxLos) maps.dept[deptName].maxLos = los;
      maps.dept[deptName].ksms[ksmName] = true;

      if (!maps.ksm[ksmName].dpjps[np]) maps.ksm[ksmName].dpjps[np] = { name: maskName(String(dpjpRaw)), normName: np, count: 0, sumRS: 0, sumIna: 0, sumIdrg: 0, sumLos: 0, maxLos: 0, comps: compKeys.reduce((a, c) => ({ ...a, [c.key]: 0 }), {}) };
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
        if (!dList[0].toUpperCase().startsWith('Z')) { maps.diagU[dList[0]] = (maps.diagU[dList[0]] || 0) + 1; stats.totalDiagUCount++; }
        for (let i = 1; i < dList.length; i++) { maps.diagS[dList[i]] = (maps.diagS[dList[i]] || 0) + 1; stats.totalDiagSCount++; }
      }
      pList.forEach(p => {
        const clean = String(p).trim();
        const cleanNoDot = clean.replace(/\./g, '');
        const isExcluded = activeExclusionCodes.some(exc => {
          const cleanExc = String(exc).trim().toUpperCase();
          const noDotExc = cleanExc.replace(/\./g, '');
          return clean.startsWith(cleanExc) || cleanNoDot.startsWith(noDotExc);
        });
        if (isExcluded) return;
        maps.proc[p] = (maps.proc[p] || 0) + 1;
        stats.totalProcCount++;
      });

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
      // Hitung skor hanya untuk baris yang memiliki data iDRG
      const hasIdrgData = String(r['IDRG_DRG_CODE'] || '').trim() !== '' && String(r['IDRG_DRG_CODE'] || '').trim() !== '-';
      const sDiag = checkMatchList(dList, idrgDList, ['KG', 'HL', 'NL', 'KND', 'G89', 'U82', 'U83', 'U84']);
      const sProc = checkMatchList(pList, idrgPList, activeExclusionCodes);
      if (hasIdrgData) { stats.totalScoreDiag += sDiag; stats.totalScoreProc += sProc; stats.scoredCount++; }

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
      selisihTotal: stats.tIdrg - stats.tIna, rataIna: rows.length > 0 ? stats.tIna / rows.length : 0, rataIdrg: rows.length > 0 ? stats.tIdrg / rows.length : 0,
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
      diagUtamaFull: (() => {
        const entries = Object.entries(maps.diagU).sort((a, b) => b[1] - a[1]);
        return entries.map(([code, count]) => ({ code, count, pct: (count / (stats.totalDiagUCount || 1)) * 100 }));
      })(),
      diagSekunderFull: (() => {
        const entries = Object.entries(maps.diagS).sort((a, b) => b[1] - a[1]);
        return entries.map(([code, count]) => ({ code, count, pct: (count / (stats.totalDiagSCount || 1)) * 100 }));
      })(),
      procFull: (() => {
        const entries = Object.entries(maps.proc).sort((a, b) => b[1] - a[1]);
        return entries.map(([code, count]) => ({ code, count, pct: (count / (stats.totalProcCount || 1)) * 100 }));
      })(),
      dischargeStats: maps.discharge,
      slClShiftArray: Object.values(maps.slClShift).map(item => ({ ...item, topPriDiags: Object.entries(item.priDiags).sort((a, b) => b[1] - a[1]), topSecDiags: Object.entries(item.secDiags).sort((a, b) => b[1] - a[1]), topProcs: Object.entries(item.procs || {}).sort((a, b) => b[1] - a[1]) })).sort((a, b) => { if (a.sev !== b.sev) return (b.sev || 0) - (a.sev || 0); return (b.cl || 0) - (a.cl || 0); }),
      inaToIdrgMap: maps.inaToIdrg, idrgToInaMap: maps.idrgToIna, scorecard: { avgDiag: stats.scoredCount > 0 ? stats.totalScoreDiag / stats.scoredCount : 0, avgProc: stats.scoredCount > 0 ? stats.totalScoreProc / stats.scoredCount : 0, discrepancies: maps.discrepancies },
      auditFindings: maps.audit, kpiCoderArray: Object.values(maps.coder).sort((a, b) => b.cases - a.cases), naikKelasStats: Object.values(maps.naikKelas).sort((a, b) => b.totalNilai - a.totalNilai), icuStats: maps.icu,
      topUpStats: { items: Object.values(maps.topUp).sort((a, b) => b.totalPotensi - a.totalPotensi), topUpKasus: stats.topUpKasus, topUpNilai: stats.topUpNilai }
    };
  }, [uploadedFiles, globalFilter, ksmOverrides, excludeCodes]);

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
    if (drilldown.type === 'pending_sakti') {
      const headers = ['No', 'No SEP', 'Nama Pasien', 'Keterangan Pending', 'Kelompok Kasus', 'Faktor Penyebab', 'DPJP Utama', 'Coder', 'Diaglist', 'Proclist'];
      const rows = drilldown.data.map((c, i) => [
        i + 1,
        c.sep || '-',
        c.nama || '-',
        c.keterangan || '-',
        Array.isArray(c.kategori) ? c.kategori.join(', ') : (c.kategori || '-'),
        c.faktor || '-',
        c.dpjp || '-',
        c.coderName || '-',
        c.diaglist || '-',
        c.proclist || '-'
      ]);
      exportToXlsx(`Pending_Claims_${drilldown.title}`, headers, rows);
      return;
    }
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
        ? { t: 'w', icon: '⚠️', txt: `iDRG lebih rendah dari Tarif RS sebesar ${formatRp(Math.abs(selIdrgRS))} — evaluasi dokumentasi Klinis Diagnosa Sekunder diperlukan.` }
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
            <Card className="flex flex-col hover:shadow-lg transition-all"><div className="p-4 bg-teal-50/50 border-b border-teal-100 flex items-center gap-2"><Stethoscope size={16} className="text-teal-600" /><h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Top 10 Diag. Utama</h3></div><MiniTable data={dashData.topDiagUtama} columns={[{ header: 'No', className: 'w-8 text-center text-slate-400 font-bold', render: (r, i) => i + 1 }, { header: 'Kode', className: 'font-extrabold text-slate-700', render: (r) => r[0] }, { header: 'Deskripsi', className: 'text-[10px] text-slate-500 max-w-[150px] truncate', render: (r) => getIcdDescription(r[0]) || '-' }, { header: 'Kasus', className: 'text-right font-black text-teal-600', render: (r) => r[1].toLocaleString() }]} /></Card>
            <Card className="flex flex-col hover:shadow-lg transition-all"><div className="p-4 bg-teal-50/50 border-b border-teal-100 flex items-center gap-2"><Stethoscope size={16} className="text-teal-600" /><h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Top 10 Diag. Sekunder</h3></div><MiniTable data={dashData.topDiagSekunder} columns={[{ header: 'No', className: 'w-8 text-center text-slate-400 font-bold', render: (r, i) => i + 1 }, { header: 'Kode', className: 'font-extrabold text-slate-700', render: (r) => r[0] }, { header: 'Deskripsi', className: 'text-[10px] text-slate-500 max-w-[150px] truncate', render: (r) => getIcdDescription(r[0]) || '-' }, { header: 'Kasus', className: 'text-right font-black text-teal-600', render: (r) => r[1].toLocaleString() }]} /></Card>
            <Card className="flex flex-col hover:shadow-lg transition-all">
              <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ActivitySquare size={16} className="text-emerald-600" />
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Top 10 Tindakan</h3>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] font-bold text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <input 
                    type="checkbox"
                    checked={excludeProcCodes}
                    onChange={(e) => handleToggleAllExclusions(e.target.checked)}
                    className="w-3 h-3 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                  />
                  <span>Kecualikan Kode Umum</span>
                </label>
              </div>
              <MiniTable data={dashData.topProc} columns={[{ header: 'No', className: 'w-8 text-center text-slate-400 font-bold', render: (r, i) => i + 1 }, { header: 'Kode', className: 'font-extrabold text-slate-700', render: (r) => r[0] }, { header: 'Deskripsi', className: 'text-[10px] text-slate-500 max-w-[150px] truncate', render: (r) => getIcdDescription(r[0]) || '-' }, { header: 'Kasus', className: 'text-right font-black text-emerald-600', render: (r) => r[1].toLocaleString() }]} />
            </Card>
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
      { id: 'diagnosis_primary', label: 'Diagnosa Utama', icon: Stethoscope, color: 'rose' },
      { id: 'diagnosis_secondary', label: 'Diagnosa Sekunder', icon: ClipboardList, color: 'orange' },
      { id: 'procedure', label: 'Tindakan', icon: Scissors, color: 'purple' },
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
            <SectionHeader icon={Table2} title="Laporan Tabel Klaim" desc="Rekapitulasi komprehensif jumlah kasus dan nominal klaim INA-CBG vs iDRG per bulan layanan." colorClass="bg-teal-50 text-teal-600" highlightClass="bg-teal-500/5" exportAction={() => exportToXlsx('Laporan_Ringkasan', ['Bulan', 'Tarif RS', 'Kasus Rajal (INA)', 'Kasus Ranap (INA)', 'Total Kasus (INA)', 'Tarif Rajal (INA)', 'Tarif Ranap (INA)', 'Total Tarif (INA)', 'Kasus Rajal (iDRG)', 'Kasus Ranap (iDRG)', 'Total Kasus (iDRG)', 'Tarif Rajal (iDRG)', 'Tarif Ranap (iDRG)', 'Total Tarif (iDRG)', 'Selisih INACBG - RS', 'Selisih iDRG - RS', 'Selisih iDRG - INACBG'], dashData.reportArray.map(m => {
              const totIna = (m.inaRajal ?? 0) + (m.inaRanap ?? 0);
              const totIdrg = (m.idrgRajal ?? 0) + (m.idrgRanap ?? 0);
              return [
                m.label, m.tarifRsTotal, m.kasusRajal, m.kasusRanap, m.kasusRajal + m.kasusRanap,
                m.inaRajal, m.inaRanap, totIna, m.kasusRajal, m.kasusRanap, m.kasusRajal + m.kasusRanap,
                m.idrgRajal, m.idrgRanap, totIdrg, totIna - (m.tarifRsTotal ?? 0), totIdrg - (m.tarifRsTotal ?? 0),
                totIdrg - totIna
              ];
            }))} exportText="Ekspor CSV" />
            <Card className="overflow-x-auto p-2 custom-scrollbar max-h-[600px] border-0 shadow-xl">
              <table className="w-full text-xs text-center border-collapse whitespace-nowrap">
                <thead className="text-[10px] uppercase font-black tracking-wider sticky top-0 z-40">
                  <tr>
                    <th rowSpan={3} className="bg-slate-900 text-white border-b border-r border-white/10 p-3">NO</th><th rowSpan={3} className="bg-slate-900 text-white border-b border-r border-white/10 p-3">BULAN LAYANAN</th><th rowSpan={3} className="bg-slate-900 text-white border-b border-r border-white/10 p-3">Tarif RS (Cost)</th>
                    <th colSpan={6} className="bg-teal-800 text-white border-b border-r border-white/10 p-3">Klaim INA CBG</th><th colSpan={6} className="bg-emerald-800 text-white border-b border-r border-white/10 p-3">Klaim iDRG</th>
                    <th rowSpan={3} className="bg-indigo-900 text-white border-b border-r border-white/10 p-3">Selisih INACBG - RS</th>
                    <th rowSpan={3} className="bg-violet-900 text-white border-b border-r border-white/10 p-3">Selisih iDRG - RS</th>
                    <th rowSpan={3} className="bg-purple-900 text-white border-b border-white/10 p-3">Selisih iDRG - INACBG</th>
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
                  {dashData.reportArray.map((row, i) => {
                    const totIna = (row.inaRajal ?? 0) + (row.inaRanap ?? 0);
                    const totIdrg = (row.idrgRajal ?? 0) + (row.idrgRanap ?? 0);
                    const diffInaRs = totIna - (row.tarifRsTotal ?? 0);
                    const diffIdrgRs = totIdrg - (row.tarifRsTotal ?? 0);
                    const diffIdrgIna = totIdrg - totIna;
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => openDrilldown(`Bulan: ${row.label}`, r => { const dObj = parseDate(r['DISCHARGE_DATE']); return dObj && `${monthNames[dObj.getMonth()]} - ${dObj.getFullYear()}` === row.label; })}>
                        <td className="border-r border-slate-100 p-3 font-semibold text-slate-400">{i + 1}</td>
                        <td className="border-r border-slate-100 p-3 font-bold text-slate-700">{row.label}</td>
                        <td className="border-r border-slate-100 p-3 text-right font-semibold text-slate-600">{formatRpEx(row.tarifRsTotal)}</td>
                        <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-teal-50/10">{(row.kasusRajal ?? 0).toLocaleString()}</td><td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-teal-50/10">{(row.kasusRanap ?? 0).toLocaleString()}</td><td className="border-r border-teal-50 p-3 text-right font-black text-teal-600 bg-teal-50/40">{((row.kasusRajal ?? 0) + (row.kasusRanap ?? 0)).toLocaleString()}</td>
                        <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-teal-50/10">{formatRpEx(row.inaRajal)}</td><td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-teal-50/10">{formatRpEx(row.inaRanap)}</td><td className="border-r border-teal-100 p-3 text-right font-black text-teal-600 bg-teal-50/40">{formatRpEx(totIna)}</td>
                        <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-emerald-50/10">{(row.kasusRajal ?? 0).toLocaleString()}</td><td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-emerald-50/10">{(row.kasusRanap ?? 0).toLocaleString()}</td><td className="border-r border-emerald-50 p-3 text-right font-black text-emerald-600 bg-emerald-50/40">{((row.kasusRajal ?? 0) + (row.kasusRanap ?? 0)).toLocaleString()}</td>
                        <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-emerald-50/10">{formatRpEx(row.idrgRajal)}</td><td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-emerald-50/10">{formatRpEx(row.idrgRanap)}</td><td className="border-r border-emerald-100 p-3 text-right font-black text-emerald-600 bg-emerald-50/40">{formatRpEx(totIdrg)}</td>
                        <td className={`border-r border-slate-100 p-3 text-right font-black bg-indigo-50/5 ${diffInaRs > 0 ? 'text-emerald-600' : diffInaRs < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {diffInaRs > 0 ? '+' : ''}{formatRpEx(diffInaRs)}
                        </td>
                        <td className={`border-r border-slate-100 p-3 text-right font-black bg-violet-50/5 ${diffIdrgRs > 0 ? 'text-emerald-600' : diffIdrgRs < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {diffIdrgRs > 0 ? '+' : ''}{formatRpEx(diffIdrgRs)}
                        </td>
                        <td className={`p-3 text-right font-black bg-purple-50/5 ${diffIdrgIna > 0 ? 'text-emerald-600' : diffIdrgIna < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {diffIdrgIna > 0 ? '+' : ''}{formatRpEx(diffIdrgIna)}
                        </td>
                      </tr>
                    );
                  })}
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

        {reportSubTab === 'diagnosis_primary' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <SectionHeader icon={Stethoscope} title="Laporan Diagnosa Utama" desc={`Daftar diagnosa utama terbanyak. Periode: ${globalFilter.periode.length > 0 ? globalFilter.periode.join(', ') : 'Semua Periode'}`} colorClass="bg-rose-50 text-rose-600" highlightClass="bg-rose-500/5" exportAction={() => exportToXlsx('Diagnosa_Utama', ['No', 'Kode Diagnosa', 'Deskripsi Resmi', 'Jumlah', 'Persentase (%)'], dashData.diagUtamaFull.map((d, i) => [i + 1, d.code, getIcdDescription(d.code) || '-', d.count, d.pct]))} />
            <Card className="overflow-hidden p-0 border-0 shadow-xl">
              <div className="overflow-x-auto custom-scrollbar max-h-[700px]">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-900 text-white sticky top-0 z-10">
                    <tr>
                      <th className="p-4 text-center border-r border-white/10 w-16">NO</th>
                      <th className="p-4 text-left border-r border-white/10">KODE DIAGNOSA (ICD 10)</th>
                      <th className="p-4 text-left border-r border-white/10 min-w-[250px]">DESKRIPSI RESMI (ICD WHO 2010)</th>
                      <th className="p-4 text-center border-r border-white/10">JUMLAH KASUS</th>
                      <th className="p-4 text-center">PERSENTASE (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {dashData.diagUtamaFull.map((d, i) => (
                      <tr key={i} className="hover:bg-rose-50/30 transition-colors cursor-pointer" onClick={() => openDrilldown(`Diagnosa Utama: ${d.code}`, r => {
                        const dList = String(r['DIAGLIST'] || '').replace(/"/g, '').split(';').map(x => x.trim()).filter(x => x);
                        return dList.length > 0 && dList[0].toUpperCase() === d.code.toUpperCase();
                      })}>
                        <td className="p-4 text-center font-bold text-slate-400 border-r border-slate-100">{i + 1}</td>
                        <td className="p-4 font-black text-slate-800 border-r border-slate-100">{d.code}</td>
                        <td className="p-4 text-slate-500 font-bold text-left border-r border-slate-100 whitespace-normal leading-relaxed">{getIcdDescription(d.code) || '-'}</td>
                        <td className="p-4 text-center font-bold text-rose-600 border-r border-slate-100">{d.count.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-rose-500 h-full rounded-full" style={{ width: `${d.pct}%` }} />
                            </div>
                            <span className="font-bold text-slate-600 min-w-[50px]">{d.pct.toFixed(2)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {reportSubTab === 'diagnosis_secondary' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <SectionHeader icon={ClipboardList} title="Laporan Diagnosa Sekunder" desc={`Daftar diagnosa sekunder terbanyak. Periode: ${globalFilter.periode.length > 0 ? globalFilter.periode.join(', ') : 'Semua Periode'}`} colorClass="bg-orange-50 text-orange-600" highlightClass="bg-orange-500/5" exportAction={() => exportToXlsx('Diagnosa_Sekunder', ['No', 'Kode Diagnosa', 'Deskripsi Resmi', 'Jumlah Temuan', 'Persentase (%)'], dashData.diagSekunderFull.map((d, i) => [i + 1, d.code, getIcdDescription(d.code) || '-', d.count, d.pct]))} />
            <Card className="overflow-hidden p-0 border-0 shadow-xl">
              <div className="overflow-x-auto custom-scrollbar max-h-[700px]">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-900 text-white sticky top-0 z-10">
                    <tr>
                      <th className="p-4 text-center border-r border-white/10 w-16">NO</th>
                      <th className="p-4 text-left border-r border-white/10">KODE DIAGNOSA (ICD 10)</th>
                      <th className="p-4 text-left border-r border-white/10 min-w-[250px]">DESKRIPSI RESMI (ICD WHO 2010)</th>
                      <th className="p-4 text-center border-r border-white/10">JUMLAH TEMUAN</th>
                      <th className="p-4 text-center">PERSENTASE (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {dashData.diagSekunderFull.map((d, i) => (
                      <tr key={i} className="hover:bg-orange-50/30 transition-colors cursor-pointer" onClick={() => openDrilldown(`Diagnosa Sekunder: ${d.code}`, r => {
                        const dList = String(r['DIAGLIST'] || '').replace(/"/g, '').split(';').map(x => x.trim()).filter(x => x);
                        return dList.slice(1).some(diag => diag.toUpperCase() === d.code.toUpperCase());
                      })}>
                        <td className="p-4 text-center font-bold text-slate-400 border-r border-slate-100">{i + 1}</td>
                        <td className="p-4 font-black text-slate-800 border-r border-slate-100">{d.code}</td>
                        <td className="p-4 text-slate-500 font-bold text-left border-r border-slate-100 whitespace-normal leading-relaxed">{getIcdDescription(d.code) || '-'}</td>
                        <td className="p-4 text-center font-bold text-orange-600 border-r border-slate-100">{d.count.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-orange-500 h-full rounded-full" style={{ width: `${d.pct}%` }} />
                            </div>
                            <span className="font-bold text-slate-600 min-w-[50px]">{d.pct.toFixed(2)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {reportSubTab === 'procedure' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <SectionHeader icon={Scissors} title="Laporan Tindakan" desc={`Daftar tindakan (procedure) terbanyak. Periode: ${globalFilter.periode.length > 0 ? globalFilter.periode.join(', ') : 'Semua Periode'}`} colorClass="bg-purple-50 text-purple-600" highlightClass="bg-purple-500/5" exportAction={() => exportToXlsx('Laporan_Tindakan', ['No', 'Kode Tindakan', 'Deskripsi Resmi', 'Jumlah', 'Persentase (%)'], dashData.procFull.map((d, i) => [i + 1, d.code, getIcdDescription(d.code) || '-', d.count, d.pct]))} />
            
            <div className="bg-purple-50/40 border border-purple-100/60 p-5 rounded-3xl backdrop-blur-md shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100/80 text-purple-700 rounded-2xl"><Scissors size={18} /></div>
                  <div>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Filter Pengecualian Kode Tindakan</span>
                    <span className="text-[10px] font-bold text-slate-400">Centang kode tindakan non-operatif / diagnostik yang ingin dikecualikan dari analisis.</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleAllExclusions(true)} className="text-[10px] font-black px-3 py-1.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-sm hover:-translate-y-0.5">✅ Pilih Semua</button>
                  <button onClick={() => handleToggleAllExclusions(false)} className="text-[10px] font-black px-3 py-1.5 bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm hover:-translate-y-0.5">🗑️ Hapus Semua</button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {[
                  { key: '89', label: 'Bab 89', desc: 'Pemeriksaan & Evaluasi' },
                  { key: '90_91', label: 'Bab 90–91', desc: 'Lab & Diagnostik' },
                  { key: '99', label: 'Bab 99', desc: 'Tindakan Lain-lain' },
                  { key: '87.44_87.49', label: '87.44 / 87.49', desc: 'Pencitraan Toraks' },
                  { key: '57.94', label: '57.94', desc: 'Instilasi Kandung Kemih' },
                  { key: '93.57', label: '93.57', desc: 'Terapi Fisik Klinik' },
                  { key: '93.96', label: '93.96', desc: 'Terapi Oksigen' },
                  { key: '99.21', label: '99.21', desc: 'Injeksi Insulin' },
                  { key: '96.07', label: '96.07', desc: 'Insersi Nasogastric Tube' },
                  { key: '99.290', label: '99.290', desc: 'Injeksi Lain-lain' },
                ].map(({ key, label, desc }) => (
                  <label key={key} className={`flex items-start gap-2 cursor-pointer select-none p-2.5 rounded-2xl border transition-all ${
                    excludeCodes[key]
                      ? 'bg-purple-100/60 border-purple-300 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-purple-200 hover:bg-purple-50/20'
                  }`}>
                    <input
                      type="checkbox"
                      checked={!!excludeCodes[key]}
                      onChange={(e) => setExcludeCodes(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="mt-0.5 w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-400 border-slate-300 cursor-pointer shrink-0"
                    />
                    <div>
                      <span className={`text-[11px] font-black block leading-tight ${ excludeCodes[key] ? 'text-purple-800' : 'text-slate-700' }`}>{label}</span>
                      <span className="text-[9px] font-semibold text-slate-400 leading-tight block mt-0.5">{desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Card className="overflow-hidden border border-slate-200 shadow-xl bg-white rounded-3xl p-0">
              {/* Header Card Toolbar */}
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-purple-50/30 to-white">
                <div>
                  <h4 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="w-2 h-5 bg-purple-500 rounded-full"></span>
                    Tabel Rekapitulasi Prosedur & Tindakan ICD-9-CM
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Klik pada baris tindakan untuk melihat detail analisis kasus secara instan.</p>
                </div>
                <button
                  onClick={() => exportToXlsx('Laporan_Tindakan', ['No', 'Kode Tindakan', 'Deskripsi Resmi', 'Jumlah', 'Persentase (%)'], dashData.procFull.map((d, i) => [i + 1, d.code, getIcdDescription(d.code) || '-', d.count, d.pct]))}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 hover:-translate-y-0.5 shrink-0"
                >
                  <Download size={14} /> Ekspor Excel (Rapi & Auto-Width)
                </button>
              </div>
              <div className="overflow-x-auto custom-scrollbar max-h-[700px]">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-900 text-white sticky top-0 z-10">
                    <tr>
                      <th className="p-4 text-center border-r border-white/10 w-16">NO</th>
                      <th className="p-4 text-left border-r border-white/10">KODE TINDAKAN (ICD 9-CM)</th>
                      <th className="p-4 text-left border-r border-white/10 min-w-[250px]">DESKRIPSI RESMI (ICD 9-CM)</th>
                      <th className="p-4 text-center border-r border-white/10">JUMLAH TINDAKAN</th>
                      <th className="p-4 text-center">PERSENTASE (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {dashData.procFull.map((d, i) => (
                      <tr key={i} className="hover:bg-purple-50/30 transition-colors cursor-pointer" onClick={() => openDrilldown(`Tindakan: ${d.code}`, r => {
                        const pList = String(r['PROCLIST'] || '').replace(/"/g, '').split(';').map(x => x.trim()).filter(x => x && x !== '-' && x.toLowerCase() !== 'none');
                        return pList.some(proc => proc.toUpperCase() === d.code.toUpperCase());
                      })}>
                        <td className="p-4 text-center font-bold text-slate-400 border-r border-slate-100">{i + 1}</td>
                        <td className="p-4 font-black text-slate-800 border-r border-slate-100">{d.code}</td>
                        <td className="p-4 text-slate-500 font-bold text-left border-r border-slate-100 whitespace-normal leading-relaxed">{getIcdDescription(d.code) || '-'}</td>
                        <td className="p-4 text-center font-bold text-purple-600 border-r border-slate-100">{d.count.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${d.pct}%` }} />
                            </div>
                            <span className="font-bold text-slate-600 min-w-[50px]">{d.pct.toFixed(2)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
        const patientName = String(r.NAMA_PASien || r.NAMA_PASIEN || '-');
        const maskedPatient = patientName !== '-' ? patientName.split(' ').filter(w => w.length > 0).map(w => w.charAt(0) + '***').join(' ') : patientName;
        return [i + 1, maskedPatient, String(r.MRN || '-'), String(r.SEP || '-'), r._tglMasuk, String(r.DISCHARGE_DATE || '-'), r._los, maskName(String(r.DPJP || '-')), String(r.INACBG || '-'), String(r.DESKRIPSI_INACBG || '-'), String(r.IDRG_DRG_CODE || '-'), String(r.IDRG_DRG_DESCRIPTION || '-'), rs, ina, idrg, ina - rs, idrg - rs, ...compKeys.map(c => c18[c.key])];
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



  const renderDepartemen = () => {
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
        <SectionHeader icon={Building2} title="Kinerja Departemen" desc="Analisis efisiensi biaya hierarki Departemen ➡️ KSM ➡️ DPJP." colorClass="bg-indigo-50 text-indigo-600" highlightClass="bg-indigo-500/5" exportAction={() => {
          const csv = [];
          deptData.forEach(dept => {
            // 1. Department Summary Row
            csv.push([
              'DEPARTEMEN', dept.name, '', '', dept.count, 
              dept.sumRS, dept.sumIna, dept.sumIdrg, 
              dept.sumIna - dept.sumRS, dept.sumIdrg - dept.sumRS, dept.sumIdrg - dept.sumIna,
              ...compKeys.map(c => (dept.comps?.[c.key] || 0))
            ]);

            const deptKsms = ksmData.filter(k => k.dept === dept.name);
            deptKsms.forEach(ksm => {
              // 2. KSM Row
              csv.push([
                'KSM', dept.name, ksm.name, '', ksm.count, 
                ksm.sumRS, ksm.sumIna, ksm.sumIdrg, 
                ksm.selisihIna, ksm.selisihIdrg, ksm.sumIdrg - ksm.sumIna,
                ...compKeys.map(c => (ksm.comps?.[c.key] || 0))
              ]);

              // 3. DPJP Rows under KSM
              ksm.dpjps.forEach(dpjp => {
                csv.push([
                  'DPJP', dept.name, ksm.name, dpjp.name, dpjp.count, 
                  dpjp.sumRS, dpjp.sumIna, dpjp.sumIdrg, 
                  dpjp.sumIna - dpjp.sumRS, dpjp.sumIdrg - dpjp.sumRS, dpjp.sumIdrg - dpjp.sumIna,
                  ...compKeys.map(c => (dpjp.comps?.[c.key] || 0))
                ]);
              });
            });
          });
          exportToXlsx('Kinerja_Departemen', ['Level', 'Departemen', 'Kelompok Staf Medis (KSM)', 'Dokter (DPJP)', 'Jumlah Kasus', 'Total RS', 'Total INA-CBG', 'Total iDRG', 'Selisih INA-RS', 'Selisih iDRG-RS', 'Selisih iDRG-INA', ...compKeys.map(c => c.label)], csv);
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
          <div className="overflow-auto max-h-[800px] custom-scrollbar">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[10px] uppercase font-black tracking-wider">
                <tr className="bg-slate-900 text-white sticky top-0 z-40">
                  <th colSpan={6} className="px-4 py-3 bg-slate-900 text-white border-b border-slate-700">Ringkasan Finansial</th>
                  <th colSpan={18} className="px-4 py-3 bg-slate-800 text-white text-center border-b border-slate-700">Rincian 18 Komponen Biaya</th>
                </tr>
                <tr className="bg-slate-900 text-white sticky top-[38px] z-40">
                  <th className="p-4 min-w-[300px] max-w-[300px] w-[300px] truncate bg-slate-900 sticky left-0 z-50 shadow-[2px_0_5px_rgba(0,0,0,0.08)]">Hierarki Departemen / KSM / DPJP</th>
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
                <tr className="bg-amber-50 font-black border-b-2 border-amber-200 shadow-sm sticky top-[85px] z-30">
                  <td className="p-4 bg-amber-50 sticky left-0 z-50 shadow-[2px_0_5px_rgba(0,0,0,0.08)] min-w-[300px] max-w-[300px] w-[300px] truncate">
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
                        <td className="p-4 sticky left-0 z-20 bg-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.08)] min-w-[300px] max-w-[300px] w-[300px] truncate" title={dept.name}>
                          <div className="flex items-center gap-2 cursor-pointer truncate" onClick={() => setOpenKsm(isDeptOpen ? null : `dept-${di}`)}>
                            <span className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-transform ${isDeptOpen ? 'rotate-90 bg-slate-800 text-white' : 'bg-slate-300 text-slate-700'}`}>▶</span>
                            <span className="uppercase text-slate-800 tracking-tight truncate">{dept.name}</span>
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
                              <td className="p-4 pl-10 border-l-4 border-indigo-500 sticky left-0 z-20 bg-white shadow-[2px_0_5px_rgba(0,0,0,0.08)] min-w-[300px] max-w-[300px] w-[300px] truncate" title={ksm.name}>
                                <div className="flex items-center gap-2 truncate">
                                  <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 transition-transform ${isKsmOpen ? 'rotate-90 bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>▶</span>
                                  <span className="font-bold text-indigo-700 truncate">{ksm.name}</span>
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
                                <td className="p-3 pl-20 italic sticky left-0 z-20 bg-slate-50 shadow-[2px_0_5px_rgba(0,0,0,0.08)] min-w-[300px] max-w-[300px] w-[300px] truncate" title={dpjp.name}>
                                  <div className="flex items-center gap-2 truncate">
                                    <User size={12} className="text-slate-400 shrink-0" />
                                    <span className="truncate">{dpjp.name}</span>
                                  </div>
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

  const renderKsm = () => {
    const ksmData = (dashData?.ksmEfficiencyTree || []).sort((a, b) => b.count - a.count);

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
        <SectionHeader icon={Users} title="Kinerja KSM (Kelompok Staf Medis)" desc="Analisis efisiensi biaya hierarki KSM ➡️ DPJP." colorClass="bg-indigo-50 text-indigo-600" highlightClass="bg-indigo-500/5" exportAction={() => {
          const csv = [];
          ksmData.forEach(ksm => {
            // 1. KSM Row
            csv.push([
              'KSM', ksm.name, '', ksm.count, 
              ksm.sumRS, ksm.sumIna, ksm.sumIdrg, 
              ksm.selisihIna, ksm.selisihIdrg, ksm.sumIdrg - ksm.sumIna,
              ...compKeys.map(c => (ksm.comps?.[c.key] || 0))
            ]);

            // 2. DPJP Rows under KSM
            ksm.dpjps.forEach(dpjp => {
              csv.push([
                'DPJP', ksm.name, dpjp.name, dpjp.count, 
                dpjp.sumRS, dpjp.sumIna, dpjp.sumIdrg, 
                dpjp.sumIna - dpjp.sumRS, dpjp.sumIdrg - dpjp.sumRS, dpjp.sumIdrg - dpjp.sumIna,
                ...compKeys.map(c => (dpjp.comps?.[c.key] || 0))
              ]);
            });
          });
          exportToXlsx('Kinerja_KSM', ['Level', 'Kelompok Staf Medis (KSM)', 'Dokter (DPJP)', 'Jumlah Kasus', 'Total RS', 'Total INA-CBG', 'Total iDRG', 'Selisih INA-RS', 'Selisih iDRG-RS', 'Selisih iDRG-INA', ...compKeys.map(c => c.label)], csv);
        }} />

        {/* KSM BAR CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            { title: 'Top 10 KSM — Selisih INA-RS', data: [...ksmData].sort((a, b) => b.selisihIna - a.selisihIna).slice(0, 10), key: 'selisihIna', color: '#0ea5e9', negColor: '#f97316' },
            { title: 'Top 10 KSM — Selisih iDRG-RS', data: [...ksmData].sort((a, b) => b.selisihIdrg - a.selisihIdrg).slice(0, 10), key: 'selisihIdrg', color: '#8b5cf6', negColor: '#ef4444' },
          ].map((chart, ci) => {
            const maxVal = Math.max(...chart.data.map(d => Math.abs(d[chart.key])), 1);
            return (
              <Card key={ci} id={`ksm-new-bar-${ci}`} downloadTitle={chart.title} className="p-5">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-indigo-500" /> {chart.title}</h3>
                <div className="space-y-2">
                  {chart.data.map((s, si) => {
                    const val = s[chart.key]; const pct = (Math.abs(val) / maxVal) * 100;
                    return (
                      <div key={si} className="flex items-center gap-3 group cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded-lg transition-colors"
                        onClick={() => openDrilldown(`Kasus KSM: ${s.name}`, row => extractKsm(row['DPJP'] || '', ksmOverrides) === s.name)}>
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
          <div className="overflow-auto max-h-[800px] custom-scrollbar">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[10px] uppercase font-black tracking-wider">
                <tr className="bg-slate-900 text-white sticky top-0 z-40">
                  <th colSpan={6} className="px-4 py-3 bg-slate-900 text-white border-b border-slate-700">Ringkasan Finansial</th>
                  <th colSpan={18} className="px-4 py-3 bg-slate-800 text-white text-center border-b border-slate-700">Rincian 18 Komponen Biaya</th>
                </tr>
                <tr className="bg-slate-900 text-white sticky top-[38px] z-40">
                  <th className="p-4 min-w-[300px] max-w-[300px] w-[300px] truncate bg-slate-900 sticky left-0 z-50 shadow-[2px_0_5px_rgba(0,0,0,0.08)]">Hierarki KSM / DPJP</th>
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
                <tr className="bg-amber-50 font-black border-b-2 border-amber-200 shadow-sm sticky top-[85px] z-30">
                  <td className="p-4 bg-amber-50 sticky left-0 z-50 shadow-[2px_0_5px_rgba(0,0,0,0.08)] min-w-[300px] max-w-[300px] w-[300px] truncate">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-amber-500 text-white flex items-center justify-center"><Zap size={12} /></div>
                      <span className="text-amber-800 uppercase text-[10px] tracking-widest font-black whitespace-nowrap">RATA-RATA RS (Seluruh Kasus)</span>
                    </div>
                  </td>
                  <td className="p-4 text-right text-amber-700 text-xs font-black italic bg-amber-50">AVG</td>
                  <td className="p-4 text-center text-amber-600 font-bold text-xs bg-amber-100/20">{hAvgLos.toFixed(1)}</td>
                  <td className="p-4 text-center text-rose-600 font-bold text-xs bg-rose-100/20">{hMaxLos}</td>
                  <td className="p-4 text-right text-amber-700 text-xs font-black bg-amber-50">{formatRp(hAvgRS)}</td>
                  <td className={`p-4 text-right font-black text-xs bg-amber-50 ${hAvgSelIna >= 0 ? 'text-lime-700' : 'text-orange-700'}`}>{formatRp(hAvgSelIna)}</td>
                  <td className={`p-4 text-right font-black text-xs bg-amber-50 ${hAvgSelIdrg >= 0 ? 'text-lime-700' : 'text-orange-700'}`}>{formatRp(hAvgSelIdrg)}</td>
                  <td className="p-4 text-right font-black text-xs text-purple-700 bg-amber-50">{formatRp(hAvgIdrgIna)}</td>
                  {compKeys.map(c => <td key={c.key} className="p-4 text-right text-[10px] font-black text-amber-600 bg-amber-100/30">{formatRpEx(hAvgComps[c.key])}</td>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">

                {ksmData.map((ksm, ki) => {
                  const isKsmOpen = expandedKsms[ksm.name];

                  return (
                    <React.Fragment key={`ksm-frag-${ki}`}>
                      <tr className="bg-indigo-50/60 hover:bg-indigo-100/60 border-b border-indigo-100 transition-colors">
                        <td className="p-3 sticky left-0 z-20 bg-indigo-50 shadow-[2px_0_5px_rgba(0,0,0,0.08)] min-w-[300px] max-w-[300px] w-[300px] truncate" title={ksm.name}>
                          <div className="flex items-center gap-3 cursor-pointer group/ksm truncate" onClick={() => setExpandedKsms(prev => ({ ...prev, [ksm.name]: !isKsmOpen }))}>
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm ${isKsmOpen ? 'bg-indigo-600 text-white rotate-90' : 'bg-white text-indigo-500 border border-indigo-200 group-hover/ksm:border-indigo-400'}`}>
                              <ChevronRight size={14} className="stroke-[3]" />
                            </div>
                            <span className="font-extrabold text-indigo-900 tracking-tight truncate">{ksm.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-black text-slate-800">{ksm.count.toLocaleString()}</td>
                        <td className="p-3 text-center text-teal-700 font-bold text-xs bg-teal-50/30">{(ksm.sumLos / (ksm.count || 1)).toFixed(1)}</td>
                        <td className="p-3 text-center text-rose-700 font-bold text-xs bg-rose-50/30">{ksm.maxLos}</td>
                        <td className="p-3 text-right text-slate-600 font-bold">{formatRp(ksm.sumRS / (ksm.count || 1))}</td>
                        <td className={`p-3 text-right font-black ${(ksm.selisihIna / (ksm.count || 1)) >= 0 ? 'text-lime-700' : 'text-orange-700'}`}>{formatRp(ksm.selisihIna / (ksm.count || 1))}</td>
                        <td className={`p-3 text-right font-black ${(ksm.selisihIdrg / (ksm.count || 1)) >= 0 ? 'text-lime-700' : 'text-orange-700'}`}>{formatRp(ksm.selisihIdrg / (ksm.count || 1))}</td>
                        <td className="p-3 text-right font-black text-purple-700">{formatRp((ksm.sumIdrg - ksm.sumIna) / (ksm.count || 1))}</td>
                        {compKeys.map(c => <td key={c.key} className="p-3 text-right text-[10px] font-bold text-slate-500 bg-slate-200/50">{formatRpEx((ksm.comps?.[c.key] || 0) / (ksm.count || 1))}</td>)}
                      </tr>
                      
                      {isKsmOpen && ksm.dpjps.map((dpjp, pi) => {
                        const ksmAvgLos = ksm.sumLos / (ksm.count || 1);
                        const dpjpAvgLos = dpjp.sumLos / dpjp.count;
                        const ksmAvgRS = ksm.sumRS / (ksm.count || 1);
                        const dpjpAvgRS = dpjp.sumRS / dpjp.count;

                        return (
                          <tr
                            key={`dpjp-${ki}-${pi}`}
                            className="bg-white hover:bg-slate-50 transition-colors cursor-pointer animate-in fade-in slide-in-from-bottom-1 duration-300 group"
                            style={{ animationDelay: `${pi * 30}ms`, animationFillMode: 'both' }}
                            onClick={() => openDrilldown(`Kasus DPJP: ${dpjp.name}`, row => normDpjp(row['DPJP']) === dpjp.normName)}
                          >
                            <td className="p-3 pl-12 border-l-2 border-indigo-300 sticky left-0 z-20 bg-white group-hover:bg-slate-50 transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.08)] min-w-[300px] max-w-[300px] w-[300px] truncate" title={dpjp.name}>
                              <div className="flex items-center gap-3 truncate">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                  <User size={12} />
                                </div>
                                <span className="font-semibold text-slate-600 group-hover:text-indigo-700 transition-colors truncate">{dpjp.name}</span>
                              </div>
                            </td>
                            <td className="p-3 text-right font-bold text-slate-600">{dpjp.count.toLocaleString()}</td>
                            <td className={`p-3 text-center font-bold text-xs bg-teal-50/10 ${dpjpAvgLos > ksmAvgLos ? 'text-rose-600' : 'text-teal-600'}`}>{(dpjp.sumLos / dpjp.count).toFixed(1)}</td>
                            <td className="p-3 text-center text-rose-600 font-bold text-xs bg-rose-50/10">{dpjp.maxLos}</td>
                            <td className={`p-3 text-right text-xs font-semibold ${dpjpAvgRS > ksmAvgRS ? 'text-rose-600' : 'text-slate-500'}`}>{formatRp(dpjp.sumRS / dpjp.count)}</td>
                          <td className={`p-3 text-right font-bold ${(dpjp.sumIna - dpjp.sumRS) >= 0 ? 'text-lime-600' : 'text-orange-600'}`}>{formatRp((dpjp.sumIna - dpjp.sumRS) / dpjp.count)}</td>
                          <td className={`p-3 text-right font-bold ${(dpjp.sumIdrg - dpjp.sumRS) >= 0 ? 'text-lime-600' : 'text-orange-600'}`}>{formatRp((dpjp.sumIdrg - dpjp.sumRS) / dpjp.count)}</td>
                          <td className="p-3 text-right font-bold text-purple-600">{formatRp((dpjp.sumIdrg - dpjp.sumIna) / dpjp.count)}</td>
                          {compKeys.map(c => {
                            const cv = dpjp.avgComps[c.key]?.val || 0;
                            const cp = dpjp.avgComps[c.key]?.pct || 0;
                            return (
                              <td key={c.key} className="p-3 text-right text-[11px] font-semibold text-indigo-500/80 bg-indigo-50/10">
                                <div className="flex flex-col items-end gap-1">
                                  <span>{formatRpEx(cv)}</span>
                                  <div className="flex items-center gap-1">
                                    <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-300" style={{ width: `${Math.min(cp, 100)}%` }}></div></div>
                                    <span className="text-[8px] text-slate-400 font-normal">{cp.toFixed(1)}%</span>
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      )})}
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

  const renderInsightSosialisasi = () => {
    const allRows = dashData?.rawRows || [];
    if (allRows.length === 0) {
      return (
        <div className="bg-white/50 backdrop-blur-sm border border-slate-200/60 p-20 rounded-[2.5rem] text-center mt-10 max-w-3xl mx-auto shadow-2xl shadow-slate-200/50">
          <div className="mb-6"><AlertCircle size={48} className="text-teal-600 mx-auto animate-bounce" /></div>
          <h2 className="text-2xl font-black mb-3 text-slate-800">Menunggu Dataset Utama...</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Data sosialisasi belum dapat ditampilkan. Silakan unggah file klaim RS terlebih dahulu di tab <strong>Integrasi Data</strong>.
          </p>
        </div>
      );
    }

    // 1. Get KSM, Department, and 18 Components for each row once (massive CPU speedup)
    const rowsWithKsm = useMemo(() => {
      return allRows.map(r => {
        const ksm = extractKsm(r['DPJP'] || '', ksmOverrides);
        return {
          row: r,
          ksm,
          dept: getDept(ksm, r['DPJP'] || '', ksmOverrides),
          comps: extract18(r)
        };
      });
    }, [allRows, ksmOverrides]);

    // 2. Get Unique Departments
    const depts = useMemo(() => {
      return Array.from(new Set(rowsWithKsm.map(item => item.dept))).filter(Boolean).sort();
    }, [rowsWithKsm]);
    
    // Determine active department (without setting state during render)
    const currentDept = selectedSocializationDept || depts[0] || '';

    // 3. Get KSMs for the selected department
    const ksmsForDept = useMemo(() => {
      return Array.from(new Set(
        rowsWithKsm
          .filter(item => item.dept === currentDept)
          .map(item => item.ksm)
      )).filter(Boolean).sort();
    }, [rowsWithKsm, currentDept]);

    // Determine active KSM (without setting state during render)
    const currentKsm = selectedSocializationKsm && ksmsForDept.includes(selectedSocializationKsm)
      ? selectedSocializationKsm
      : (ksmsForDept[0] || '');

    // 4. Filter rows for current KSM
    const ksmRows = rowsWithKsm
      .filter(item => item.ksm === currentKsm)
      .map(item => item.row);

    const ksmItems = rowsWithKsm.filter(item => item.ksm === currentKsm);

    // 5. Hospital-wide metrics for comparison
    const hTotal = allRows.length || 1;
    const hSumLos = allRows.reduce((sum, r) => sum + (parseFloat(r._los) || 0), 0);
    const hAvgLos = hSumLos / hTotal;
    
    const hAvgComps = {};
    compKeys.forEach(c => {
      let sum = 0;
      rowsWithKsm.forEach(item => {
        sum += item.comps[c.key] || 0;
      });
      hAvgComps[c.key] = sum / hTotal;
    });

    // 6. KSM-specific metrics
    const kTotal = ksmRows.length || 1;
    const kPctOfHospital = (ksmRows.length / (allRows.length || 1)) * 100;
    
    const kSumLos = ksmRows.reduce((sum, r) => sum + (parseFloat(r._los) || 0), 0);
    const kAvgLos = kSumLos / kTotal;
    const kMaxLos = ksmRows.reduce((max, r) => Math.max(max, parseFloat(r._los) || 0), 0);

    const kSumRS = ksmRows.reduce((sum, r) => sum + (parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0), 0);
    const kAvgRS = kSumRS / kTotal;

    const kSumIna = ksmRows.reduce((sum, r) => sum + (parseFloat(r.TOTAL_TARIF || 0) || 0), 0);
    const kAvgIna = kSumIna / kTotal;

    const kSumIdrg = ksmRows.reduce((sum, r) => sum + (parseFloat(r.IDRG_TOTAL_TARIF || 0) || 0), 0);
    const kAvgIdrg = kSumIdrg / kTotal;

    const kSelisihIna = kSumIna - kSumRS;
    const kAvgSelisihIna = kSelisihIna / kTotal;

    const kSelisihIdrg = kSumIdrg - kSumRS;
    const kAvgSelisihIdrg = kSelisihIdrg / kTotal;

    const kAvgComps = {};
    compKeys.forEach(c => {
      let sum = 0;
      ksmItems.forEach(item => {
        sum += item.comps[c.key] || 0;
      });
      kAvgComps[c.key] = sum / kTotal;
    });

    // Prepare unaggregated scatter data with dynamic financial positioning
    const scatterData = useMemo(() => {
      return ksmRows.map(r => {
        const rs = parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
        const ina = parseFloat(r.TOTAL_TARIF || 0) || 0;
        const idrg = parseFloat(r.IDRG_TOTAL_TARIF || 0) || 0;
        return {
          ...r,
          selisih: socializationScatterMode === 'idrg' ? idrg - rs : ina - rs,
          los: parseFloat(r._los) || 0,
          rsTarif: rs
        };
      });
    }, [ksmRows, socializationScatterMode]);

    const { efficientLosCases, pctEfficientLos, ksmCostPerDay, inaDeficitCount, idrgDeficitCount } = useMemo(() => {
      const effLos = ksmRows.filter(r => (parseFloat(r._los) || 0) <= hAvgLos).length;
      const pctEff = (effLos / kTotal) * 100;
      const costPerDay = kSumRS / (kSumLos || 1);

      let inaDef = 0;
      let idrgDef = 0;
      ksmRows.forEach(r => {
        const rs = parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
        const ina = parseFloat(r.TOTAL_TARIF || 0) || 0;
        const idrg = parseFloat(r.IDRG_TOTAL_TARIF || 0) || 0;
        if ((ina - rs) < 0) inaDef++;
        if ((idrg - rs) < 0) idrgDef++;
      });

      return {
        efficientLosCases: effLos,
        pctEfficientLos: pctEff,
        ksmCostPerDay: costPerDay,
        inaDeficitCount: inaDef,
        idrgDeficitCount: idrgDef
      };
    }, [ksmRows, hAvgLos, kTotal, kSumRS, kSumLos]);

    // 7. Quadrant standing logic
    const ksmCountsMap = {};
    rowsWithKsm.forEach(item => {
      if (item.ksm) {
        ksmCountsMap[item.ksm] = (ksmCountsMap[item.ksm] || 0) + 1;
      }
    });
    const ksmCounts = Object.values(ksmCountsMap);
    const avgKsmVol = ksmCounts.reduce((s, c) => s + c, 0) / (ksmCounts.length || 1);

    const isHighVolume = ksmRows.length >= avgKsmVol;
    const isSurplus = kSelisihIna >= 0;

    let quadrantBadge = "";
    let quadrantClass = "";
    let quadrantNote = "";
    let quadrantTip = "";

    if (isSurplus && isHighVolume) {
      quadrantBadge = "Surplus & Volume Tinggi (Kinerja Utama)";
      quadrantClass = "bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-500/10";
      quadrantNote = "Performa luar biasa! KSM ini memberikan volume kontribusi tinggi dengan margin surplus optimal.";
      quadrantTip = "Pertahankan kualitas koding diagnosa utama dan sekunder. Dokumentasikan standardisasi Clinical Pathway ini sebagai panduan best practice rumah sakit.";
    } else if (!isSurplus && isHighVolume) {
      quadrantBadge = "Defisit & Volume Tinggi (Prioritas Sosialisasi)";
      quadrantClass = "bg-rose-50 border-rose-200 text-rose-800 shadow-rose-500/10";
      quadrantNote = "Sangat Kritis! Kasus dengan volume tinggi beroperasi dalam kondisi defisit finansial kumulatif.";
      quadrantTip = "Fokus Sosialisasi: Audit ketepatan dokumentasi koding klinis, periksa pencantuman komplikasi sekunder (severity level), serta evaluasi inefisiensi biaya obat/alkes penunjang medis.";
    } else if (!isSurplus && !isHighVolume) {
      quadrantBadge = "Defisit & Volume Rendah (Waspada)";
      quadrantClass = "bg-amber-50 border-amber-200 text-amber-800 shadow-amber-500/10";
      quadrantNote = "Perhatian Khusus! Layanan berbiaya tinggi dengan frekuensi kasus kecil namun berpotensi defisit.";
      quadrantTip = "Evaluasi Kasus Individu: Tinjau LOS (Length of Stay) per pasien dan hilangkan pemeriksaan diagnostik atau terapi obat yang berlebihan/redundant.";
    } else {
      quadrantBadge = "Surplus & Volume Rendah (Potensi Pengembangan)";
      quadrantClass = "bg-sky-50 border-sky-200 text-sky-800 shadow-sky-500/10";
      quadrantNote = "Efisien & Menguntungkan! Model biaya efisien dengan margin surplus yang terjaga baik.";
      quadrantTip = "Pengembangan Layanan: Tingkatkan kapasitas penerimaan pasien dan promosikan keunggulan klinis KSM ini untuk memperluas jangkauan layanan.";
    }

    // 7. Top 5 Diagnosa Utama Berdefisit (Primary Diagnoses ICD-10)
    const deficitRows = ksmRows.filter(r => {
      const rs = parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
      const ina = parseFloat(r.TOTAL_TARIF || 0) || 0;
      return (ina - rs) < 0;
    });

    const diagGroups = {};
    deficitRows.forEach(r => {
      let code = String(r.DIAGNOSA || r.DIAGUTAMA || '').trim();
      if (!code || code === '-' || code.toLowerCase() === 'none') {
        const dList = String(r.DIAGLIST || '').replace(/"/g, '').split(';').map(d => d.trim()).filter(Boolean);
        if (dList.length > 0) code = dList[0];
      }
      if (!code) code = '-';
      if (code === '-' || code.toLowerCase() === 'none') return;

      if (!diagGroups[code]) {
        diagGroups[code] = { code, desc: getIcdDescription(code) || String(r.DESKRIPSI_DIAGNOSA || r.DESKRIPSI || 'Tanpa Deskripsi'), count: 0, totalDefisit: 0 };
      }
      const rs = parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
      const ina = parseFloat(r.TOTAL_TARIF || 0) || 0;
      diagGroups[code].count++;
      diagGroups[code].totalDefisit += (ina - rs);
    });
    const top5Diags = Object.values(diagGroups).sort((a, b) => a.totalDefisit - b.totalDefisit).slice(0, 5);

    // 8. Top 5 Tindakan Utama Berdefisit (Primary Procedures ICD-9-CM)
    const procGroups = {};
    deficitRows.forEach(r => {
      const rawProcs = String(r.PROSEDUR || r.PROSEDUR_UTAMA || r.PROCLIST || '-').split(/[;,]/).map(p => p.trim()).filter(Boolean);
      let code = '-';
      for (let p of rawProcs) {
        if (p === '-' || p.toLowerCase() === 'none') continue;
        const cleanP = p.trim().toUpperCase();
        const noDotP = cleanP.replace(/\./g, '');
        const isExcluded = (activeExclusionCodes || []).some(exc => {
          const cleanExc = String(exc).trim().toUpperCase();
          const noDotExc = cleanExc.replace(/\./g, '');
          return cleanP === cleanExc || cleanP.startsWith(cleanExc) || noDotP.startsWith(noDotExc);
        });
        if (!isExcluded) {
          code = p;
          break;
        }
      }
      if (code === '-' || code === '') return;
      if (!procGroups[code]) {
        procGroups[code] = { code, desc: getIcdDescription(code) || String(r.DESKRIPSI_PROSEDUR || 'Tanpa Deskripsi'), count: 0, totalDefisit: 0 };
      }
      const rs = parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
      const ina = parseFloat(r.TOTAL_TARIF || 0) || 0;
      procGroups[code].count++;
      procGroups[code].totalDefisit += (ina - rs);
    });
    const top5Procs = Object.values(procGroups).sort((a, b) => a.totalDefisit - b.totalDefisit).slice(0, 5);

    // 9. Top 5 Group INACBG Utama (Most frequent with net position)
    const inaGroups = {};
    ksmRows.forEach(r => {
      const code = String(r.INACBG || '-').trim();
      if (!inaGroups[code]) {
        inaGroups[code] = { code, desc: String(r.DESKRIPSI_INACBG || 'Tanpa Deskripsi'), count: 0, totalSelisih: 0 };
      }
      const rs = parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
      const ina = parseFloat(r.TOTAL_TARIF || 0) || 0;
      inaGroups[code].count++;
      inaGroups[code].totalSelisih += (ina - rs);
    });
    const topInaGroups = Object.values(inaGroups).sort((a, b) => b.count - a.count).slice(0, 5);

    // 10. Top 5 Group iDRG Utama (Most frequent with net position)
    const idrgGroups = {};
    ksmRows.forEach(r => {
      const code = String(r.IDRG_DRG_CODE || '-').trim();
      if (!idrgGroups[code]) {
        idrgGroups[code] = { code, desc: String(r.IDRG_DRG_DESCRIPTION || 'Tanpa Deskripsi'), count: 0, totalSelisih: 0 };
      }
      const rs = parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
      const idrg = parseFloat(r.IDRG_TOTAL_TARIF || 0) || 0;
      idrgGroups[code].count++;
      idrgGroups[code].totalSelisih += (idrg - rs);
    });
    const topIdrgGroups = Object.values(idrgGroups).sort((a, b) => b.count - a.count).slice(0, 5);

    // Dynamic Clinical Guidelines Generator
    const getCodingGuideline = (code) => {
      const c = String(code).toUpperCase();
      if (c.startsWith('A') || c.startsWith('B')) return "Pastikan mencatat komplikasi infeksi seperti Sepsis (A41.9) atau Syok Septik (R57.2) jika kondisi klinis terpenuhi.";
      if (c.startsWith('E')) return "Cantumkan manifestasi organ diabetik spesifik: Neuropati (E11.4), Nefropati (E11.2), atau Ulkus/Gangren (E11.5) sebagai diagnosis kombinasi.";
      if (c.startsWith('I')) return "Bila ada gagal jantung kongestif akibat hipertensi kronis, gunakan kode kombinasi Penyakit Jantung Hipertensi dengan Gagal Jantung (I11.0).";
      if (c.startsWith('J')) return "Pastikan mencatat tipe Pneumonia secara spesifik (misal Bakterial J15) atau komplikasi gagal napas akut (J96.0) sebagai sekunder.";
      if (c.startsWith('N')) return "Untuk kasus batu saluran kemih dengan hidronefrosis penyerta, gunakan kode kombinasi N20.9 (Batu ginjal/ureter dengan hidronefrosis).";
      if (c.startsWith('S') || c.startsWith('T')) return "Dokumentasikan dengan lengkap penyebab cedera eksternal (V-Y codes) dan diagnosis sekunder perdarahan traumatis.";
      return "Tinjau kembali rekam medis lengkap untuk memastikan seluruh diagnosa sekunder/penyerta (terutama yang menaikkan tingkat keparahan / severity level CC/MCC) tercatat dengan presisi.";
    };

    const getProcedureGuideline = (code) => {
      const c = String(code);
      if (c.startsWith('99.1') || c.startsWith('99.2')) return "Pastikan lembar observasi obat khusus/imunisasi terisi lengkap untuk mencegah penolakan klaim top-up.";
      if (c.startsWith('35.') || c.startsWith('36.')) return "Dokumentasikan jenis implan atau alkes habis pakai yang digunakan di laporan operasi untuk mempermudah verifikasi.";
      if (c.startsWith('88.') || c.startsWith('87.')) return "Pastikan hasil eksisi patologi anatomi atau penafsiran hasil radiologi (X-Ray/CT-Scan/MRI) ditandatangani dokter spesialis terkait.";
      return "Lengkapi lembar laporan operasi / tindakan dengan durasi, nama operator utama, dan tanda tangan dokter penanggung jawab pelayanan (DPJP).";
    };

    const exportKsmSocialization = () => {
      // 1. Sheet 1: Ringkasan Performa
      const summaryHeaders = ['Indikator Performa', `Nilai KSM ${currentKsm}`, 'Rata-rata RS'];
      const summaryRows = [
        ['Jumlah Kasus', ksmRows.length, allRows.length],
        ['Persentase Kasus RS', `${kPctOfHospital.toFixed(1)}%`, '100%'],
        ['Rata-rata LOS (Hari)', kAvgLos.toFixed(1), hAvgLos.toFixed(1)],
        ['LOS Maksimal (Hari)', kMaxLos, allRows.reduce((max, r) => Math.max(max, parseFloat(r._los) || 0), 0)],
        ['Rata-rata Biaya Riil RS', Math.round(kAvgRS), Math.round(allRows.reduce((s, r) => s + (parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0), 0) / allRows.length)],
        ['Rata-rata Tarif INA-CBG', Math.round(kAvgIna), Math.round(allRows.reduce((s, r) => s + (parseFloat(r.TOTAL_TARIF || 0) || 0), 0) / allRows.length)],
        ['Rata-rata Tarif iDRG', Math.round(kAvgIdrg), Math.round(allRows.reduce((s, r) => s + (parseFloat(r.IDRG_TOTAL_TARIF || 0) || 0), 0) / allRows.length)],
        ['Total Selisih INA-RS', kSelisihIna, allRows.reduce((s, r) => s + (parseFloat(r.TOTAL_TARIF || 0) - (parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0)), 0)],
        ['Total Selisih iDRG-RS', kSelisihIdrg, allRows.reduce((s, r) => s + (parseFloat(r.IDRG_TOTAL_TARIF || 0) - (parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0)), 0)],
        ['Status Kinerja Klinis', quadrantBadge, 'N/A']
      ];

      // 2. Sheet 2: Detail Kasus Pasien
      const detailHeaders = [
        'No', 'Nomor SEP', 'Nomor RM', 'Nama Pasien', 'Dokter DPJP', 
        'Kode INACBG', 'Deskripsi INACBG', 'Kode iDRG', 'Deskripsi iDRG',
        'LOS (Hari)', 'Biaya Riil RS (Rp)', 'Tarif INA-CBG (Rp)', 'Tarif iDRG (Rp)',
        'Selisih INA-CBG vs RS (Rp)', 'Selisih iDRG vs RS (Rp)'
      ];

      const detailRows = ksmRows.map((r, index) => {
        const rs = parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
        const ina = parseFloat(r.TOTAL_TARIF || 0) || 0;
        const idrg = parseFloat(r.IDRG_TOTAL_TARIF || 0) || 0;
        const patientName = String(r.NAMA || r.NAMA_PASIEN || r.nama || '-');
        const maskedPatient = patientName !== '-' ? patientName.split(' ').filter(w => w.length > 0).map(w => w.charAt(0) + '***').join(' ') : patientName;
        return [
          index + 1,
          r.SEP || r.NO_SEP || r.no_sep || '-',
          r.NO_RM || r.NORM || r.no_rm || '-',
          maskedPatient,
          maskName(r.DPJP || r.NAMA_DOKTER || r.dpjp || '-'),
          r.INACBG || r.KODE_INACBG || '-',
          r.INACBG_DESC || r.DESKRIPSI_INACBG || '-',
          r.IDRG_DRG_CODE || '-',
          r.IDRG_DRG_DESC || '-',
          parseFloat(r._los) || 0,
          rs,
          ina,
          idrg,
          ina - rs,
          idrg - rs
        ];
      });

      const workbook = XLSX.utils.book_new();
      
      const summarySheet = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan Performa');

      const detailSheet = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);
      XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detail Kasus Pasien');

      // Clean dynamic filename
      const cleanKsmName = String(currentKsm.substring(0, 15)).replace(/[\/\\:\*\?"<>\|]/g, '_');
      const filename = `Sosialisasi_KSM_${cleanKsmName}`;

      // Write Base64 and download
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
      const link = document.createElement('a');
      link.href = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + wbout;
      link.download = `${filename}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className={`space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ${isSlideMode ? 'p-6 bg-slate-900 text-white rounded-3xl' : ''}`}>
        
        {/* HEADER & TOP CONTROLS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40 backdrop-blur-sm p-4 rounded-3xl border border-teal-100 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-600 text-white rounded-2xl shadow-lg shadow-teal-600/20">
              <Sparkles size={24} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Insight Sosialisasi Dokter Spesialis</h1>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Bahan presentasi evaluasi kendali mutu dan kendali biaya per KSM / Departemen.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsSlideMode(!isSlideMode)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border shadow-sm uppercase tracking-wider ${isSlideMode ? 'bg-teal-600 text-white border-teal-500' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'}`}
              title="Toggle Mode Slide / Layar Penuh Presentasi"
            >
              📺 {isSlideMode ? 'Mode Biasa' : 'Mode Slide / Presentasi'}
            </button>
            <button
              onClick={exportKsmSocialization}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 uppercase tracking-wider"
              title="Ekspor data ringkasan KSM ke Excel"
            >
              <Download size={14} /> Ekspor Excel
            </button>
            <button
              onClick={() => window.print()}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 uppercase tracking-wider"
              title="Cetak/Simpan Handout Sosialisasi ke PDF"
            >
              <Printer size={14} /> Cetak Handout PDF
            </button>
          </div>
        </div>

        {/* INTERACTIVE HIERARCHY SELECTOR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm print:hidden">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Building2 size={12} className="text-teal-600" /> Pilih Departemen
            </label>
            <select
              value={currentDept}
              onChange={e => {
                setSelectedSocializationDept(e.target.value);
                setSelectedSocializationKsm(''); // Reset KSM
              }}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-800 font-bold focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all cursor-pointer shadow-inner"
            >
              {depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Users size={12} className="text-teal-600" /> Pilih Kelompok Staf Medis (KSM)
            </label>
            <select
              value={currentKsm}
              onChange={e => setSelectedSocializationKsm(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-800 font-bold focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all cursor-pointer shadow-inner"
            >
              {ksmsForDept.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>

        {/* PRINT BRANDING (Visible only when printing) */}
        <div className="hidden print:flex items-center justify-between border-b-2 border-teal-600 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <img src="https://lh3.googleusercontent.com/d/1K9BUgDDRmF0d9Q9mCasC5KhDXVpVhJs5" alt="Logo" className="w-12 h-12 object-contain" />
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">akurat.id Analytics Platform</h2>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Laporan Sosialisasi & Evaluasi Kendali Mutu Kendali Biaya (KMKB)</p>
            </div>
          </div>
          <div className="text-right text-[10px] font-bold text-slate-500">
            <div>Departemen: <span className="text-slate-800">{currentDept}</span></div>
            <div>KSM: <span className="text-teal-600">{currentKsm}</span></div>
            <div>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>

        {/* PRESENTATION SLIDE - EXECUTIVE SCORECARDS */}
        <div className={`p-8 rounded-[2.5rem] border shadow-2xl flex flex-col gap-6 relative overflow-hidden transition-all duration-300 ${isSlideMode ? 'bg-slate-800 border-slate-700/50 shadow-slate-950/40 text-white' : 'bg-gradient-to-br from-white to-teal-50/20 border-teal-100/70 shadow-teal-900/5'}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div>
              <span className={`text-[10px] font-black tracking-[0.2em] uppercase px-3 py-1 rounded-full ${isSlideMode ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-50 text-teal-700'}`}>Bahan Sosialisasi Medis</span>
              <h2 className={`text-2xl font-black mt-2 tracking-tight ${isSlideMode ? 'text-white' : 'text-slate-800'}`}>
                Evaluasi Kinerja Klinis: <span className="text-teal-600 font-extrabold">{currentKsm}</span>
              </h2>
              <p className={`text-[11px] font-medium mt-1 ${isSlideMode ? 'text-slate-400' : 'text-slate-400'}`}>
                Membawahi Departemen: <strong className={isSlideMode ? 'text-slate-300' : 'text-slate-700'}>{currentDept}</strong>
              </p>
            </div>
            
            {/* Clinical Standing Quadrant */}
            <div className={`p-4 rounded-2xl border flex flex-col gap-1.5 max-w-sm shrink-0 shadow-lg ${quadrantClass}`}>
              <div className="flex items-center gap-2">
                <span className="text-base">🧭</span>
                <span className="text-[10px] font-black uppercase tracking-wider">Kuadran Klinis</span>
              </div>
              <span className="text-sm font-black tracking-tight">{quadrantBadge}</span>
              <p className="text-[10px] leading-relaxed font-semibold opacity-90">{quadrantNote}</p>
            </div>
          </div>

          {/* Dinamic Rekomendasi Sosialisasi */}
          <div className={`p-5 rounded-2xl border flex gap-3.5 items-start ${isSlideMode ? 'bg-slate-700/50 border-slate-600 text-slate-100 font-semibold' : 'bg-teal-50/40 border-teal-100 text-teal-800 font-semibold'}`}>
            <div className="p-2 bg-teal-600 text-white rounded-xl shadow-md shrink-0"><Zap size={18} /></div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider block opacity-70">Rekomendasi Sosialisasi Ke Dokter Spesialis</span>
              <p className="text-xs font-semibold leading-relaxed mt-1">{quadrantTip}</p>
            </div>
          </div>

          {/* GLOWING SCORECARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            {[
              { label: 'Jumlah Kasus', value: `${ksmRows.length} kasus`, sub: `${kPctOfHospital.toFixed(1)}% dari total RS`, color: 'from-sky-500/10 to-blue-600/5 text-sky-700 border-sky-100/50' },
              { label: 'Rerata Selisih (INA-RS)', value: formatRp(kAvgSelisihIna), sub: `Total: ${formatRp(kSelisihIna)}`, color: kSelisihIna >= 0 ? 'from-emerald-500/10 to-green-600/5 text-emerald-700 border-emerald-100/50' : 'from-rose-500/10 to-red-600/5 text-rose-700 border-rose-100/50' },
              { label: 'Rerata iDRG vs INA-CBG', value: `+${formatRp(kAvgIdrg - kAvgIna)}`, sub: `Total Potensi: +${formatRp(kSumIdrg - kSumIna)}`, color: 'from-purple-500/10 to-indigo-600/5 text-purple-700 border-purple-100/50' },
              { label: 'Rerata LOS vs RS', value: `${kAvgLos.toFixed(1)} Hari`, sub: `Rerata RS: ${hAvgLos.toFixed(1)} | Max: ${kMaxLos}`, color: kAvgLos > hAvgLos ? 'from-orange-500/10 to-amber-600/5 text-orange-700 border-orange-100/50' : 'from-teal-500/10 to-emerald-600/5 text-teal-700 border-teal-100/50' }
            ].map((card, i) => (
              <div key={i} className={`p-4.5 rounded-2xl border-2 bg-gradient-to-br ${card.color} flex flex-col gap-1 shadow-sm`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${isSlideMode ? 'text-slate-400' : 'text-slate-400'}`}>{card.label}</span>
                <span className={`text-xl font-black tracking-tight ${isSlideMode ? 'text-white' : 'text-slate-800'}`}>{card.value}</span>
                <span className="text-[10px] font-bold opacity-75">{card.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* GROUP CLUSTERS: INACBG & iDRG */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 5 INACBG Groups */}
          <Card className="flex flex-col">
            <div className="p-4 bg-sky-50 border-b border-sky-100/70 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2"><Layers size={16} className="text-sky-600" /> Top 5 Group INACBG Utama</h3>
              <span className="text-[9px] font-black bg-sky-200 text-sky-800 px-2 py-0.5 rounded-full uppercase">KSM Kasus</span>
            </div>
            <div className="p-4 space-y-3 flex-1 overflow-auto max-h-[350px]">
              {topInaGroups.map((g, idx) => (
                <div key={idx} className="flex gap-3 bg-slate-50 hover:bg-slate-100/80 p-3 rounded-xl border border-slate-200/50 transition-all cursor-pointer" onClick={() => openDrilldown(`INA Group: ${g.code}`, row => String(row.INACBG).trim() === g.code)}>
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center font-black text-sky-700 border border-slate-200/80 shrink-0 text-xs shadow-sm">
                    {g.code}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-xs font-black text-slate-800 truncate" title={g.desc}>{g.desc}</span>
                    <span className="text-[10px] text-slate-500 font-bold mt-0.5">{g.count} Kasus • Rerata Selisih: <span className={g.totalSelisih >= 0 ? 'text-lime-600 font-black' : 'text-rose-600 font-black'}>{formatRp(g.totalSelisih / g.count)}</span></span>
                  </div>
                </div>
              ))}
              {topInaGroups.length === 0 && <div className="p-6 text-center text-slate-400 text-xs font-semibold">Tidak ada grup INACBG terdeteksi.</div>}
            </div>
          </Card>

          {/* Top 5 iDRG Groups */}
          <Card className="flex flex-col">
            <div className="p-4 bg-orange-50 border-b border-orange-100/70 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2"><Layers size={16} className="text-orange-600" /> Top 5 Group iDRG Utama</h3>
              <span className="text-[9px] font-black bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full uppercase font-bold">iDRG Kasus</span>
            </div>
            <div className="p-4 space-y-3 flex-1 overflow-auto max-h-[350px]">
              {topIdrgGroups.map((g, idx) => (
                <div key={idx} className="flex gap-3 bg-slate-50 hover:bg-slate-100/80 p-3 rounded-xl border border-slate-200/50 transition-all cursor-pointer" onClick={() => openDrilldown(`iDRG Group: ${g.code}`, row => String(row.IDRG_DRG_CODE).trim() === g.code)}>
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center font-black text-orange-700 border border-slate-200/80 shrink-0 text-xs shadow-sm">
                    {g.code}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-xs font-black text-slate-800 truncate" title={g.desc}>{g.desc}</span>
                    <span className="text-[10px] text-slate-500 font-bold mt-0.5">{g.count} Kasus • Rerata Selisih: <span className={g.totalSelisih >= 0 ? 'text-lime-600 font-black' : 'text-rose-600 font-black'}>{formatRp(g.totalSelisih / g.count)}</span></span>
                  </div>
                </div>
              ))}
              {topIdrgGroups.length === 0 && <div className="p-6 text-center text-slate-400 text-xs font-semibold">Tidak ada grup iDRG terdeteksi.</div>}
            </div>
          </Card>
        </div>

        {/* DOUBLE ACTIONABLE TARGET LISTS (DIAGNOSA VS TINDAKAN) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top 5 Diagnosa Utama Berdefisit */}
          <Card className="flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-red-50 flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-700 rounded-xl"><AlertTriangle size={18} /></div>
              <div>
                <h3 className="font-extrabold text-slate-800">Top 5 Diagnosa Utama Berdefisit (ICD-10)</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Diagnosa primer penyumbang akumulasi defisit tertinggi — Klik untuk rincian kasus</p>
              </div>
            </div>
            <div className="p-4 space-y-4 flex-1 overflow-auto max-h-[500px]">
              {top5Diags.map((d, idx) => (
                <div key={idx} className="bg-white p-4.5 rounded-2xl border-2 border-red-100 shadow-sm flex flex-col gap-3 hover:border-red-300 transition-all cursor-pointer" onClick={() => openDrilldown(`Diagnosa Berdefisit: ${d.code}`, row => String(row.DIAGNOSA || row.DIAGUTAMA).trim() === d.code)}>
                  <div className="flex justify-between items-start gap-3">
                    <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg font-black text-xs shrink-0">{d.code}</span>
                    <span className="text-xs font-black text-slate-700 flex-1 truncate">{d.desc}</span>
                    <span className="font-black text-red-600 text-xs whitespace-nowrap">{formatRp(d.totalDefisit)}</span>
                  </div>
                  <div className="flex flex-col gap-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] font-semibold text-slate-600">
                    <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest block">💡 Rekomendasi Koding / Sosialisasi Dokter:</span>
                    {getCodingGuideline(d.code)}
                  </div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide flex items-center justify-between">
                    <span>Kasus Terdampak: <strong>{d.count} kali</strong></span>
                    <span>Rata-rata Kerugian/Kasus: <strong className="text-red-500">{formatRp(d.totalDefisit / d.count)}</strong></span>
                  </div>
                </div>
              ))}
              {top5Diags.length === 0 && <div className="p-10 text-center text-slate-400 text-sm font-semibold">Hebat! Tidak ada diagnosa utama yang mengalami defisit finansial di KSM ini.</div>}
            </div>
          </Card>

          {/* Top 5 Tindakan Utama Berdefisit */}
          <Card className="flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-amber-50 flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-xl"><Scissors size={18} /></div>
              <div>
                <h3 className="font-extrabold text-slate-800">Top 5 Tindakan Utama Berdefisit (ICD-9-CM)</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Prosedur penunjang / operasi utama penyumbang kerugian terbesar — Klik untuk rincian kasus</p>
              </div>
            </div>
            <div className="p-4 space-y-4 flex-1 overflow-auto max-h-[500px]">
              {top5Procs.map((p, idx) => (
                <div key={idx} className="bg-white p-4.5 rounded-2xl border-2 border-amber-100 shadow-sm flex flex-col gap-3 hover:border-amber-300 transition-all cursor-pointer" onClick={() => openDrilldown(`Tindakan Berdefisit: ${p.code}`, row => String(row.PROSEDUR || row.PROSEDUR_UTAMA || row.PROCLIST || '-').trim().split(/[;, ]/)[0] === p.code)}>
                  <div className="flex justify-between items-start gap-3">
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-black text-xs shrink-0">{p.code}</span>
                    <span className="text-xs font-black text-slate-700 flex-1 truncate">{p.desc}</span>
                    <span className="font-black text-amber-600 text-xs whitespace-nowrap">{formatRp(p.totalDefisit)}</span>
                  </div>
                  <div className="flex flex-col gap-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] font-semibold text-slate-600">
                    <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest block">💡 Rekomendasi Dokumentasi Klinis:</span>
                    {getProcedureGuideline(p.code)}
                  </div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide flex items-center justify-between">
                    <span>Kasus Terdampak: <strong>{p.count} kali</strong></span>
                    <span>Rata-rata Kerugian/Kasus: <strong className="text-amber-500">{formatRp(p.totalDefisit / p.count)}</strong></span>
                  </div>
                </div>
              ))}
              {top5Procs.length === 0 && <div className="p-10 text-center text-slate-400 text-sm font-semibold">Hebat! Tidak ada tindakan utama yang mengalami defisit finansial di KSM ini.</div>}
            </div>
          </Card>

        </div>

        {/* NEW: LOS & iDRG INTEGRATED 4-QUADRANT SCATTER VISUALIZER */}
        <Card className={`p-6 border flex flex-col gap-6 ${isSlideMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Activity size={18} className="text-teal-600 animate-pulse" /> Peta Mutu Klinis (LOS) &amp; Simulasi iDRG
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Analisis korelasi lama hari rawat (LOS) terhadap profitabilitas. Klik bulatan pasien untuk melihat rekam medis.</p>
            </div>
            
            {/* Interactive Mode Toggle */}
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl w-fit shrink-0 print:hidden">
              <button
                onClick={() => setSocializationScatterMode('inacbg')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${socializationScatterMode === 'inacbg' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                🇮🇩 INA-CBG vs RS
              </button>
              <button
                onClick={() => setSocializationScatterMode('idrg')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${socializationScatterMode === 'idrg' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                ⚡ iDRG vs RS (Simulasi)
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 print:bg-white">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Rerata LOS KSM</span>
              <span className="text-base font-black text-slate-800 mt-1">{kAvgLos.toFixed(1)} Hari</span>
              <span className="text-[10px] font-bold text-slate-500 mt-0.5">RS Baseline: {hAvgLos.toFixed(1)} Hari</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Efisiensi LOS</span>
              <span className="text-base font-black text-teal-600 mt-1">{pctEfficientLos.toFixed(1)}%</span>
              <span className="text-[10px] font-bold text-slate-500 mt-0.5">Kasus &lt;= Rerata RS</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Kinerja Keuangan ({socializationScatterMode.toUpperCase()})</span>
              <span className={`text-base font-black mt-1 ${socializationScatterMode === 'idrg' ? (kSelisihIdrg >= 0 ? 'text-lime-600' : 'text-rose-600') : (kSelisihIna >= 0 ? 'text-emerald-600' : 'text-rose-600')}`}>
                {socializationScatterMode === 'idrg' ? formatRp(kAvgSelisihIdrg) : formatRp(kAvgSelisihIna)}
              </span>
              <span className="text-[10px] font-bold text-slate-500 mt-0.5">Rerata Margin per Kasus</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Maksimal LOS</span>
              <span className="text-base font-black text-rose-600 mt-1">{kMaxLos} Hari</span>
              <span className="text-[10px] font-bold text-slate-500 mt-0.5">Lama Rawat Terpanjang</span>
            </div>
          </div>

          {/* Main Visualizer: Scatter plot & Legend (Full Width / Fit-to-Width Redesign) */}
          <div className="space-y-6">
            <div className="w-full">
              <div className="mb-2 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Menampilkan: <span className="text-teal-600 font-extrabold">{socializationScatterMode === 'idrg' ? 'Simulasi Tarif iDRG vs Biaya Riil' : 'Tarif INA-CBG vs Biaya Riil'}</span>
              </div>
              <ScatterChart
                data={scatterData}
                xKey="selisih"
                yKey="los"
                rKey="rsTarif"
                color={socializationScatterMode === 'idrg' ? '#8b5cf6' : '#0d9488'}
                xLabel={socializationScatterMode === 'idrg' ? "Selisih Finansial iDRG vs RS (Rupiah)" : "Selisih Finansial INA-CBG vs RS (Rupiah)"}
                yLabel="Lama Hari Rawat (LOS - Hari)"
                title=""
                onDotClick={(d) => openDrilldown(`Kasus Pasien: SEP ${d.SEP || d.sep || d.no_sep || ''}`, row => (row.SEP || row.sep || row.NO_SEP || row.no_sep || '').trim() === (d.SEP || d.sep || d.NO_SEP || d.no_sep || '').trim())}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* iDRG Impact Insight Panel */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4.5 rounded-2xl border border-indigo-100/50 space-y-2.5">
                <span className="text-[10px] font-black text-indigo-800 uppercase tracking-wider block">⚡ Analisis Akselerasi Tarif iDRG</span>
                <p className="text-xs font-semibold leading-relaxed text-slate-700">
                  Implementasi sistem tarif iDRG diproyeksikan meningkatkan rata-rata pendapatan per kasus KSM ini sebesar <strong className="text-indigo-700 font-black">+{formatRp(kAvgIdrg - kAvgIna)}</strong>.
                </p>
                <div className="text-[10px] text-slate-600 font-bold border-t border-indigo-200/50 pt-2 flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span>Kasus Defisit INA-CBG:</span>
                    <span className="text-rose-600 font-black">{inaDeficitCount} kasus</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasus Defisit iDRG:</span>
                    <span className="text-emerald-600 font-black">{idrgDeficitCount} kasus</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-indigo-300 pt-1.5 font-extrabold text-indigo-900 mt-1">
                    <span>Kasus Terselamatkan:</span>
                    <span>{inaDeficitCount - idrgDeficitCount} kasus ({((inaDeficitCount - idrgDeficitCount) / (inaDeficitCount || 1) * 100).toFixed(0)}%)</span>
                  </div>
                </div>
              </div>

              {/* Quadrant Legend */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 print:bg-white text-[11px] font-semibold text-slate-600">
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">Evaluasi Mutu &amp; Kendali Biaya</span>
                
                <div className="flex items-start gap-2.5">
                  <div className="w-3 h-3 rounded bg-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-emerald-800 uppercase">Kuadran I (Surplus &amp; LOS Tinggi)</span>
                    <span className="text-[9px] text-slate-500 font-medium">Kasus kompleks dengan diagnosis penyerta lengkap.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 border-t border-slate-200/60 pt-2">
                  <div className="w-3 h-3 rounded bg-rose-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-rose-800 uppercase">Kuadran II (Defisit &amp; LOS Tinggi)</span>
                    <span className="text-[9px] text-slate-500 font-medium">Lama rawat tinggi melebihi batas tarif paket. Area Audit CP!</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 border-t border-slate-200/60 pt-2">
                  <div className="w-3 h-3 rounded bg-amber-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-amber-800 uppercase">Kuadran III (Defisit &amp; LOS Rendah)</span>
                    <span className="text-[9px] text-slate-500 font-medium">Kasus cepat tapi merugi. Indikasi kurangnya koding diagnosis sekunder.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 border-t border-slate-200/60 pt-2">
                  <div className="w-3 h-3 rounded bg-blue-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-800 uppercase">Kuadran IV (Surplus &amp; LOS Rendah)</span>
                    <span className="text-[9px] text-slate-500 font-medium">Layanan efisien &amp; profitabel. Standar Clinical Pathway ideal!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 18-COMPONENT COST EFFICIENCY ANALYZER (KSM vs Hospital Average) */}
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-white flex items-center gap-3">
            <div className="p-2 bg-teal-100 text-teal-700 rounded-xl"><Layers size={18} /></div>
            <div>
              <h3 className="font-extrabold text-slate-800 font-semibold">Analisis Deviasi 18 Komponen Biaya</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Perbandingan rata-rata biaya satuan komponen KSM terhadap Rata-rata Rumah Sakit secara keseluruhan.</p>
            </div>
          </div>
          <div className="p-5 overflow-x-auto custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {compKeys.map((c) => {
                const kAvg = kAvgComps[c.key] || 0;
                const hAvg = hAvgComps[c.key] || 0;
                const deviation = hAvg > 0 ? ((kAvg - hAvg) / hAvg) * 100 : 0;
                
                // Color formatting
                let badgeClass = "bg-slate-50 text-slate-600 border-slate-200";
                if (deviation > 10) {
                  badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
                } else if (deviation < -10) {
                  badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                }

                return (
                  <div key={c.key} className={`p-3 rounded-xl border-2 flex flex-col gap-1 shadow-sm ${badgeClass}`}>
                    <span className="text-[9px] font-black uppercase tracking-wider block truncate" title={c.label}>{c.label}</span>
                    <span className="text-sm font-black mt-0.5">{formatRp(kAvg)}</span>
                    <div className="flex items-center justify-between text-[9px] font-bold opacity-75 mt-1 border-t border-dashed border-current/20 pt-1">
                      <span>RS: {formatRpEx(hAvg)}</span>
                      <span className="font-black">{deviation >= 0 ? '+' : ''}{deviation.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="p-3 text-center text-[10px] font-bold text-slate-400 bg-slate-50 border-t">
            * Keterangan: Warna <span className="text-rose-500 font-extrabold">Merah</span> menandakan pengeluaran KSM lebih dari 10% di atas Rata-rata RS. Warna <span className="text-emerald-500 font-extrabold">Hijau</span> menandakan pengeluaran di bawah rata-rata RS (Efisien).
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
          <div className="overflow-auto max-h-[700px] custom-scrollbar">
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
                                const procEx = activeExclusionCodes;
                                return checkMatchList(d1, d2, ['KG', 'HL', 'NL', 'KND', 'G89', 'U82', 'U83', 'U84']) < 100 || checkMatchList(p1, p2, procEx) < 100;
                              });

                              const generatedFindings = discRows.map(row => {
                                const d1 = String(row['DIAGLIST'] || '').split(';').map(d => d.trim()).filter(d => d);
                                const d2 = String(row['IDRG_DIAG_LISTS'] || '').split(';').map(d => d.trim()).filter(d => d);
                                const p1 = String(row['PROCLIST'] || '').split(';').map(p => p.trim()).filter(p => p && p !== '-' && p.toLowerCase() !== 'none');
                                const p2 = String(row['IDRG_PROC_LISTS'] || '').split(';').map(p => p.trim()).filter(p => p && p !== '-' && p.toLowerCase() !== 'none');

                                // Calculate specific differences, excluding certain medical codes
                                const EXCLUDED_DIAGS = ['KG', 'HL', 'NL', 'KND', 'G89', 'U82', 'U83', 'U84'];
                                const EXCLUDED_PROCS = activeExclusionCodes;

                                const dOnlyInIna = d1.filter(c => !d2.includes(c) && !EXCLUDED_DIAGS.includes(c));
                                const dOnlyInIdrg = d2.filter(c => !d1.includes(c) && !EXCLUDED_DIAGS.includes(c));

                                const isExcludedProc = c => EXCLUDED_PROCS.some(exc => {
                                  const cleanExc = String(exc).trim().toUpperCase();
                                  const cleanC = String(c).trim().toUpperCase();
                                  const noDotExc = cleanExc.replace(/\./g, '');
                                  const noDotC = cleanC.replace(/\./g, '');
                                  return cleanC === cleanExc || cleanC.startsWith(cleanExc) || noDotC.startsWith(noDotExc);
                                });
                                const pOnlyInIna = p1.filter(c => !p2.includes(c) && !isExcludedProc(c));
                                const pOnlyInIdrg = p2.filter(c => !p1.includes(c) && !isExcludedProc(c));

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

  const renderKsmMappingSettings = () => {
    const allDpjps = filterOptions.dpjps;
    const filteredDpjps = allDpjps.filter(d => 
      d.disp.toLowerCase().includes(overrideSearch.toLowerCase()) || 
      d.norm.toLowerCase().includes(overrideSearch.toLowerCase())
    );

    const activeOverrides = draftKsmOverrides !== null ? draftKsmOverrides : ksmOverrides;
    const isDirty = draftKsmOverrides !== null && JSON.stringify(draftKsmOverrides) !== JSON.stringify(ksmOverrides);

    // Count pending changes
    let pendingChangesCount = 0;
    if (draftKsmOverrides !== null) {
      const allKeys = new Set([...Object.keys(ksmOverrides), ...Object.keys(draftKsmOverrides)]);
      allKeys.forEach(k => {
        const oldVal = ksmOverrides[k];
        const newVal = draftKsmOverrides[k];
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          pendingChangesCount++;
        }
      });
    }

    const updateOverride = (norm, ksm, dept) => {
      console.log('[SAK-iDRG] updateOverride called:', { norm, ksm, dept });
      setDraftKsmOverrides(prev => {
        const base = prev !== null ? prev : ksmOverrides;
        const next = {
          ...base,
          [norm]: { ksm, dept }
        };
        console.log('[SAK-iDRG] Next draftKsmOverrides:', next);
        return next;
      });
    };

    const removeOverride = (norm) => {
      setDraftKsmOverrides(prev => {
        const base = prev !== null ? prev : ksmOverrides;
        const next = { ...base };
        delete next[norm];
        return next;
      });
    };

    const saveChanges = () => {
      if (draftKsmOverrides !== null) {
        // Bersihkan cache SYNCHRONOUSLY sebelum state update agar re-render pakai data baru
        resolveCache.clear();
        // Simpan langsung ke localStorage tanpa nunggu useEffect
        localStorage.setItem('sak_ksm_overrides', JSON.stringify(draftKsmOverrides));
        setKsmOverrides(draftKsmOverrides);
        setDraftKsmOverrides(null);
        setUserManagementSuccess("✅ Sukses! Perubahan pemetaan KSM telah disimpan dan diterapkan ke seluruh dashboard.");
        setTimeout(() => setUserManagementSuccess(""), 4000);
      }
    };

    const cancelChanges = () => {
      setDraftKsmOverrides(null);
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader 
          icon={Settings} 
          title="Pengaturan Pemetaan KSM & Departemen" 
          desc="Gunakan menu ini untuk memperbaiki kesalahan pemetaan otomatis. Pilih dokter dan tentukan KSM serta Departemen yang sesuai." 
          colorClass="bg-slate-100 text-slate-700" 
          highlightClass="bg-slate-500/5" 
        />

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari Nama Dokter..." 
              value={overrideSearch} 
              onChange={e => setOverrideSearch(e.target.value)} 
              className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all shadow-sm" 
            />
          </div>
          <div className="bg-sky-50 px-6 py-3 rounded-2xl border border-sky-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-sky-600 shadow-sm"><Users size={20} /></div>
            <div>
              <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Manual Overrides</p>
              <p className="text-xl font-black text-slate-800">{Object.keys(activeOverrides).length} Dokter</p>
            </div>
          </div>
        </div>

        {isDirty && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md shadow-orange-500/5 animate-in slide-in-from-top-2 duration-300 mb-6">
            <div className="flex gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest block">Perubahan Mappings Belum Disimpan</span>
                <p className="text-xs font-semibold text-slate-700 mt-1 leading-relaxed">
                  Terdapat <strong className="text-orange-700 font-extrabold">{pendingChangesCount} dokter</strong> dengan pengaturan KSM/Departemen baru yang belum diterapkan. Klik Simpan untuk memproses ulang data.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button 
                onClick={cancelChanges}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-extrabold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
              >
                Batalkan
              </button>
              <button 
                onClick={saveChanges}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 animate-pulse"
              >
                ⚡ Simpan &amp; Terapkan
              </button>
            </div>
          </div>
        )}

        <Card className="overflow-hidden border-0 shadow-xl">
          <div className="overflow-x-auto custom-scrollbar max-h-[70vh]">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest sticky top-0 z-50">
                <tr>
                  <th className="px-6 py-5">Nama Dokter (DPJP)</th>
                  <th className="px-6 py-5 min-w-[380px]">KSM Saat Ini (Auto/Manual)</th>
                  <th className="px-6 py-5 min-w-[280px]">Departemen</th>
                  <th className="px-6 py-5 text-center">Status</th>
                  <th className="px-6 py-5 text-right">Aksi Manual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDpjps.slice(0, 100).map((d, i) => {
                  // Gunakan activeOverrides[d.norm] secara langsung karena d.disp sudah di-mask
                  // sehingga normalisasi dari d.disp tidak akan cocok dengan key override
                  const overrideVal = activeOverrides[d.norm];
                  const autoResolved = resolveKsmDept(d.disp, {}); // Gunakan d.disp agar gelar medis terdeteksi!
                  const current = overrideVal
                    ? (typeof overrideVal === 'string' ? { ksm: overrideVal, dept: 'Override' } : overrideVal)
                    : autoResolved;
                  const isOverridden = !!overrideVal;

                  if (d.norm && (d.norm.includes('AHMAD') || d.norm.includes('FITRAH'))) {
                    console.log('[SAK-iDRG] Render row debug for:', d.norm, {
                      overrideVal,
                      autoResolved,
                      current,
                      isOverridden,
                      activeOverridesKeys: Object.keys(activeOverrides)
                    });
                  }
                  
                  return (
                    <tr key={d.norm} className={`transition-colors ${isOverridden ? 'bg-sky-50/50' : 'hover:bg-slate-50'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${isOverridden ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {d.disp.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-extrabold text-slate-700">{String(d.disp || '-').split(' ').filter(w=>w.length>0).map(w=>w.charAt(0)+'***').join(' ')}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{d.norm}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 min-w-[380px]">
                        <select 
                          value={current.ksm} 
                          title={current.ksm}
                          onChange={(e) => updateOverride(d.norm, e.target.value, current.dept)}
                          className={`w-full bg-white border rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-sky-500/20 outline-none transition-all cursor-pointer ${isOverridden ? 'border-sky-300 text-sky-700' : 'border-slate-200 text-slate-600'}`}
                        >
                          <option value="">-- Pilih KSM --</option>
                          {/* Combine standard list with any existing KSM from the dataset to ensure coverage */}
                          {Array.from(new Set([...KSM_LIST, ...customKsms, current.ksm])).sort().map(k => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 min-w-[280px]">
                        <select 
                          value={current.dept} 
                          title={current.dept}
                          onChange={(e) => updateOverride(d.norm, current.ksm, e.target.value)}
                          className={`w-full bg-white border rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-sky-500/20 outline-none transition-all cursor-pointer ${isOverridden ? 'border-sky-300 text-sky-700' : 'border-slate-200 text-slate-600'}`}
                        >
                          <option value="">-- Pilih Departemen --</option>
                          {Array.from(new Set([...DEPT_LIST, ...customDepts, current.dept])).sort().map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${isOverridden ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {isOverridden ? 'Manual' : 'Auto'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isOverridden && (
                          <button 
                            onClick={() => removeOverride(d.norm)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            title="Reset ke Otomatis"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredDpjps.length > 100 && (
            <div className="p-4 bg-slate-50 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Menampilkan 100 dari {filteredDpjps.length} dokter. Gunakan pencarian untuk hasil lebih spesifik.
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderSyncIcdTab = () => {
    // Local derived state for interactive search
    const map = window.sakIcdMap || {};
    const keys = Object.keys(map);
    
    // Filter results based on search query
    let filteredResults = [];
    if (icdSearchQuery.trim()) {
      const q = icdSearchQuery.trim().toUpperCase();
      filteredResults = keys
        .filter(k => k.includes(q) || map[k].toUpperCase().includes(q))
        .map(k => ({ code: k, desc: map[k] }));
      
      // Remove duplicate non-dotted duplicates if dotted exists to keep search clean
      const seen = new Set();
      filteredResults = filteredResults.filter(item => {
        const standard = item.code.includes('.') ? item.code : item.code.replace(/(\w{3})(\w+)/, '$1.$2');
        if (seen.has(item.code)) return false;
        seen.add(item.code);
        return true;
      });
    } else {
      // By default show some high-frequency fallback codes
      filteredResults = Object.keys(BASE_ICD_FALLBACK).map(k => ({ code: k, desc: BASE_ICD_FALLBACK[k] }));
    }

    const handleManualSync = async () => {
      const urlToUse = icdSheetUrl.trim() || "https://docs.google.com/spreadsheets/d/19Fqy6_e_j9_cuH43as9pB_5gJjWnPO3Eb2EIfX1or-w/edit?usp=sharing";
      setIsSyncingIcd(true);
      setIcdSyncStatus("Mengunduh...");
      try {
        const exportUrl = getGoogleSheetCsvUrl(urlToUse);
        const res = await fetch(exportUrl);
        if (!res.ok) throw new Error(`Gagal mengunduh: status ${res.status}`);
        
        setIcdSyncStatus("Memproses...");
        const text = await res.text();
        
        setIcdSyncStatus("Menyimpan...");
        const dictArray = parseCSV(text);
        await saveIcdDictToDb(dictArray);
        
        // Re-load into memory
        const newMap = {};
        dictArray.forEach(item => {
          const code = String(item.code).trim().toUpperCase();
          const desc = String(item.desc).trim();
          newMap[code] = desc;
          
          const noDot = code.replace(/\./g, '');
          if (noDot !== code) {
            newMap[noDot] = desc;
          }
        });
        
        window.sakIcdMap = { ...BASE_ICD_FALLBACK, ...newMap };
        globalIcdMap = window.sakIcdMap;
        
        // Trigger local re-render
        setIcdSyncVersion(prev => prev + 1);
        
        // Dispatch sync event
        window.dispatchEvent(new CustomEvent('sak_icd_sync_complete', { detail: window.sakIcdMap }));
        
        if (icdSheetUrl.trim()) {
          localStorage.setItem("sak_icd_sheet_url", icdSheetUrl.trim());
        } else {
          localStorage.removeItem("sak_icd_sheet_url");
        }
        alert(`✅ Kamus ICD Berhasil Disinkronkan!\n\n${dictArray.length.toLocaleString()} kode berhasil dimuat secara lokal.`);
      } catch (err) {
        console.error(err);
        alert(`❌ Gagal sinkronisasi kamus: ${err.message}`);
      } finally {
        setIsSyncingIcd(false);
        setIcdSyncStatus("");
      }
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        {/* Banner Notifikasi Auto-Sync */}
        {autoSyncStatus === "syncing" && (
          <div className="bg-teal-50 border border-teal-200 text-teal-800 px-4 py-3 rounded-2xl flex items-center gap-3 animate-pulse text-xs font-bold shadow-sm">
            <RefreshCw className="animate-spin text-teal-600" size={16} />
            <span>🔄 Sedang menyelaraskan Kamus ICD terbaru dari Google Sheets secara otomatis di latar belakang...</span>
          </div>
        )}
        {autoSyncStatus === "done" && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <span className="p-1 bg-emerald-100 rounded-lg text-emerald-600">✅</span>
              <span>Kamus ICD berhasil disinkronkan secara otomatis dari cloud spreadsheet!</span>
            </div>
            <button onClick={() => setAutoSyncStatus("")} className="text-emerald-500 hover:text-emerald-700">✕</button>
          </div>
        )}

        <SectionHeader 
          icon={RefreshCw} 
          title="Sinkronisasi & Kamus ICD" 
          desc="Hubungkan aplikasi SAK-iDRG dengan pangkalan data ICD-10 & ICD-9 eksternal via Google Sheets untuk verifikasi deskripsi diagnosis dan prosedur medis." 
          colorClass="bg-teal-50 text-teal-600" 
          highlightClass="bg-teal-500/5" 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMN 1: STATUS & STATS */}
          <Card className="p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 border border-slate-100 relative overflow-hidden bg-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none"></div>
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-teal-50 rounded-xl text-teal-600"><Layers size={16} /></span>
                <h3 className="font-extrabold text-slate-800 tracking-tight text-xs uppercase">Status Penyimpanan</h3>
              </div>
              
              <div className="py-2">
                <div className="text-5xl font-black text-slate-800 tracking-tight">
                  {keys.length.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Total Kode Terdaftar</div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">Database Lokal</span>
                  <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">IndexedDB</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">Status Sinkronisasi</span>
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-[10px] uppercase font-black tracking-wider">Aktif</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-[10px] text-slate-500 font-semibold leading-relaxed mt-4">
              💡 <b>Tips:</b> Sistem akan selalu memprioritaskan kode terbaru dari IndexedDB. Jika offline atau koneksi gagal, sistem akan menggunakan basis data fallback berfrekuensi tinggi bawaan secara otomatis.
            </div>
          </Card>

          {/* COLUMN 2: GOOGLE SHEETS CONFIG */}
          <Card className="p-6 lg:col-span-2 flex flex-col justify-between hover:shadow-lg transition-all duration-300 border border-slate-100 bg-white">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-blue-50 rounded-xl text-blue-600"><FileSpreadsheet size={16} /></span>
                <h3 className="font-extrabold text-slate-800 tracking-tight text-xs uppercase">Konfigurasi Sinkronisasi Cloud</h3>
              </div>

              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Gunakan URL Google Sheets yang berisi dua kolom wajib: <b>CODE</b> (kode ICD tanpa titik atau dengan titik) dan <b>STR</b> (deskripsi lengkap kode tersebut).
              </p>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tautan Google Sheets (Shareable Link)</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 focus-within:border-teal-500 rounded-xl px-3 py-2.5 transition-all">
                  <FileSpreadsheet className="text-slate-400 shrink-0" size={16} />
                  <input 
                    type="text" 
                    placeholder="Menggunakan Kamus Default (Terproteksi)" 
                    value={icdSheetUrl}
                    onChange={(e) => setIcdSheetUrl(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs text-slate-700 font-bold w-full placeholder:text-slate-400 placeholder:font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 pt-4 border-t border-slate-100">
              <button 
                onClick={handleManualSync}
                disabled={isSyncingIcd}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-md hover:shadow-lg hover:from-teal-700 hover:to-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shrink-0"
              >
                {isSyncingIcd ? `⏳ ${icdSyncStatus}` : "⚡ Sinkronkan Sekarang"}
              </button>
            </div>
          </Card>
        </div>

        {/* SECTION 3: INTERACTIVE SEARCH & LOOKUP */}
        <Card className="p-6 hover:shadow-lg transition-all duration-300 border border-slate-100 bg-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-purple-50 rounded-xl text-purple-600"><Search size={16} /></span>
                <h3 className="font-extrabold text-slate-800 tracking-tight text-xs uppercase font-black">Eksplorasi & Pencarian Kode Offline</h3>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Cari kode ICD-10 atau ICD-9 beserta deskripsi terjemahannya secara instan.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 focus-within:border-teal-500 rounded-xl px-3 py-2 flex items-center gap-2 w-full md:w-80 transition-all">
              <Search className="text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Cari kode atau kata kunci..." 
                value={icdSearchQuery}
                onChange={(e) => setIcdSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-700 font-bold w-full"
              />
              {icdSearchQuery && (
                <button onClick={() => setIcdSearchQuery("")} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] text-slate-400 font-black uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 w-28">Kode ICD</th>
                  <th className="py-3 px-4">Deskripsi Diagnosa / Prosedur</th>
                  <th className="py-3 px-4 w-32 text-center">Tipe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.slice(0, 50).map((item, idx) => {
                  const isDiag = /^[A-Z]/.test(item.code);
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-700 tracking-tight">{item.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-600">{item.desc}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isDiag ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>
                          {isDiag ? 'Diagnosis' : 'Prosedur'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredResults.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-xs font-semibold text-slate-400 bg-slate-50/50">
                      📭 Tidak ditemukan kode yang cocok dengan kata kunci "{icdSearchQuery}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredResults.length > 50 && (
            <div className="p-4 bg-slate-50/50 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 mt-2 rounded-b-xl">
              Menampilkan 50 hasil teratas dari {filteredResults.length} kode ditemukan. Ketik lebih spesifik untuk menyaring.
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderUserManagement = () => {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
        <SectionHeader 
          icon={ClipboardList} 
          title="Manajemen Akses & Kredensial Pengguna" 
          desc="Otorisasi pengajuan akun baru dan atur masa aktif akses SAK-iDRG langsung dari aplikasi secara otomatis menggunakan Supabase." 
          colorClass="bg-teal-500/10 text-teal-700" 
          highlightClass="bg-teal-500/5" 
        />

        {userManagementError && (
          <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 font-bold text-sm animate-in shake duration-300">
            <AlertCircle size={20} className="shrink-0" />
            <span>{userManagementError}</span>
          </div>
        )}

        {userManagementSuccess && (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm animate-in zoom-in-95 duration-200">
            <CheckCircle size={20} className="shrink-0" />
            <span>{userManagementSuccess}</span>
          </div>
        )}

        {/* REFRESH BUTTON */}
        <div className="flex justify-end mb-4">
          <button 
            onClick={fetchUserManagementData}
            disabled={isLoadingUsers || isProcessingAction}
            className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-teal-600/20 disabled:shadow-none transition-all uppercase tracking-wider cursor-pointer"
          >
            {isLoadingUsers ? <Activity size={16} className="animate-spin" /> : <RefreshCw size={16} />} 
            {isLoadingUsers ? 'Memuat...' : 'Muat Ulang'}
          </button>
        </div>

        {/* SECTION 1: PENDING USERS */}
        <Card className="p-6">
          <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                Pengajuan Akun Baru (Pending)
              </h3>
            </div>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              {pendingUsers.length} Pengajuan
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar border border-slate-100 rounded-2xl">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4">Nama Lengkap</th>
                  <th className="px-5 py-4">Faskes / Kontak</th>
                  <th className="px-5 py-4">Username</th>
                  <th className="px-5 py-4 text-center">Durasi Akses</th>
                  <th className="px-5 py-4 text-center">Aksi Keputusan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {pendingUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">Tidak ada pengajuan akun baru yang tertunda.</td>
                  </tr>
                ) : (
                  pendingUsers.map((u, idx) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-black text-slate-800 text-sm block">{u.nama_lengkap}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-600 text-xs block">{u.nama_faskes || '-'}</span>
                        <span className="text-[10px] text-slate-400 font-bold block">{u.no_wa || '-'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-black text-teal-600 text-xs">@{u.username}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <select 
                          value={pendingDurations[u.id] || 12}
                          onChange={(e) => setPendingDurations({ ...pendingDurations, [u.id]: parseInt(e.target.value) })}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-teal-500 text-slate-700 cursor-pointer"
                        >
                          <option value="1">1 Bulan</option>
                          <option value="3">3 Bulan</option>
                          <option value="6">6 Bulan</option>
                          <option value="12">1 Tahun</option>
                          <option value="999">Selamanya</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleApprove(u.id)}
                            disabled={isProcessingAction}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                          >Setujui</button>
                          <button 
                            onClick={() => handleReject(u.id)}
                            disabled={isProcessingAction}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                          >Tolak</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* SECTION 2: ACTIVE ACCOUNTS */}
        <Card className="p-6">
          <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                Daftar Akun Terdaftar & Masa Aktif
              </h3>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              {userAccounts.length} User Terdaftar
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar border border-slate-100 rounded-2xl">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4">No</th>
                  <th className="px-5 py-4">Username</th>
                  <th className="px-5 py-4">Nama & Faskes</th>
                  <th className="px-5 py-4">Masa Berlaku Akses</th>
                  <th className="px-5 py-4 text-center">Status Keaktifan</th>
                  <th className="px-5 py-4 text-center">Tindakan Kontrol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-xs">
                {userAccounts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium">Tidak ada daftar user aktif terdeteksi.</td>
                  </tr>
                ) : (
                  userAccounts.filter(u => !userSearchTerm || Object.values(u).some(v => String(v).toLowerCase().includes(userSearchTerm.toLowerCase()))).map((u, idx) => {
                    let isExpired = false;
                    if (u.masa_aktif) {
                      const activeDate = new Date(u.masa_aktif);
                      const today = new Date();
                      if (activeDate < today) isExpired = true;
                    }
                    
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4 text-slate-400 font-bold text-center w-12">{idx + 1}</td>
                        <td className="px-5 py-4 font-black text-slate-800 text-sm">@{u.username}</td>
                        <td className="px-5 py-4">
                          <span className="block font-bold">{u.nama_lengkap}</span>
                          <span className="block text-slate-500 text-[10px]">{u.nama_faskes}</span>
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-500">
                          {u.masa_aktif ? new Date(u.masa_aktif).toLocaleDateString('id-ID') : 'Selamanya'}
                        </td>
                        <td className="px-5 py-4 text-center">
                          {isExpired ? (
                            <span className="bg-rose-100 text-rose-800 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">Expired</span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">Aktif</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          {u.role === 'admin' ? (
                            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Proteksi Sistem</span>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => handleEditUserClick(u)}
                                disabled={isProcessingAction}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                              >Edit Akun</button>
                              <button 
                                onClick={() => handleDeleteActive(u.id)}
                                disabled={isProcessingAction}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                              >Hapus Akses</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* EDIT USER MODAL */}
        {showEditUserModal && editingUser && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="max-w-md w-full max-h-[95vh] overflow-y-auto custom-scrollbar p-8 shadow-2xl border border-white/20 bg-white relative rounded-[2rem] animate-in zoom-in-95 duration-300">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-amber-600"></div>
              <button onClick={() => setShowEditUserModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all">
                <X size={20} />
              </button>
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Activity size={32} className="text-amber-600" />
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Edit Akun Pengguna</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">Ubah data profil dan hak akses untuk @{editingUser.username}</p>
              </div>

              <form onSubmit={handleSaveEditUser} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nama Lengkap</label>
                  <input type="text" required value={editUserData.nama_lengkap} onChange={e => setEditUserData({...editUserData, nama_lengkap: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent block p-3.5 transition-all outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nama Rumah Sakit / Faskes</label>
                  <input type="text" required value={editUserData.nama_faskes} onChange={e => setEditUserData({...editUserData, nama_faskes: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent block p-3.5 transition-all outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">No WhatsApp</label>
                  <input type="text" value={editUserData.no_wa} onChange={e => setEditUserData({...editUserData, no_wa: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent block p-3.5 transition-all outline-none font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Role</label>
                    <select value={editUserData.role} onChange={e => setEditUserData({...editUserData, role: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent block p-3.5 transition-all outline-none font-medium cursor-pointer">
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Status</label>
                    <select value={editUserData.status} onChange={e => setEditUserData({...editUserData, status: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent block p-3.5 transition-all outline-none font-medium cursor-pointer">
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="disabled">Disabled</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Masa Aktif Berakhir (Kosongkan = Selamanya)</label>
                  <input type="date" value={editUserData.masa_aktif} onChange={e => setEditUserData({...editUserData, masa_aktif: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent block p-3.5 transition-all outline-none font-medium" />
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowEditUserModal(false)} className="flex-1 font-bold py-3 px-4 rounded-xl text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors text-xs uppercase tracking-wider">Batal</button>
                  <button type="submit" disabled={isProcessingAction} className="flex-[2] font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 text-xs tracking-wider uppercase bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0">
                    {isProcessingAction ? <Activity size={16} className="animate-spin" /> : <Save size={16} />}
                    {isProcessingAction ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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

  
  
  const renderReadmisiFragmentasi = () => {
    const raw = dashData?.rawRows || [];
    if (raw.length === 0) return <div className="p-8 text-center text-slate-500 font-bold">Data belum tersedia / tidak ada.</div>;

    // Kelompokkan data berdasarkan MRN (atau NOKARTU jika MRN kosong)
    const patMap = {};
    raw.forEach(r => {
      const pid = String(r.MRN || r.NOKARTU || '').trim();
      if (!pid || pid === '-') return;
      if (!patMap[pid]) patMap[pid] = [];
      patMap[pid].push(r);
    });

    let readmisiCount = 0;
    let fragCount = 0;
    let readmisiCases = [];
    let fragCases = [];

    Object.values(patMap).forEach(visits => {
      if (visits.length < 2) return;
      // Urutkan kunjungan dari yang terlama ke terbaru (chronological)
      visits.sort((a, b) => parseDateSafe(a.DISCHARGE_DATE) - parseDateSafe(b.DISCHARGE_DATE));

      for (let i = 0; i < visits.length - 1; i++) {
        const v1 = visits[i];
        const v2 = visits[i + 1];

        const d1 = parseDateSafe(v1.DISCHARGE_DATE);
        const d2 = parseDateSafe(v2.DISCHARGE_DATE);
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 30) {
          const isV2Inap = String(v2.PTD || '').trim() === '1';
          const isV2Jalan = String(v2.PTD || '').trim() === '2';
          
          const dpjp1 = normDpjp(v1.DPJP);
          const dpjp2 = normDpjp(v2.DPJP);
          const sameDpjp = dpjp1 === dpjp2;
          
          const ina1 = String(v1.INACBG || '').trim().split('-').slice(0, 2).join('-');
          const ina2 = String(v2.INACBG || '').trim().split('-').slice(0, 2).join('-');
          const relatedDiag = ina1 && ina2 && ina1 === ina2;

          const caseInfo = {
            pid: String(v2.MRN || v2.NOKARTU || '-'),
            nama: String(v2.NAMA_PASIEN || v2.NAMA || '-'),
            history: visits, // All visits
            v1, v2,
            diffDays,
            sameDpjp,
            relatedDiag
          };

          if (isV2Inap) {
            readmisiCount++;
            readmisiCases.push(caseInfo);
          } else if (isV2Jalan) {
            fragCount++;
            fragCases.push(caseInfo);
          }
        }
      }
    });

    const uniqueReadmisi = Array.from(new Map(readmisiCases.map(item => [item.pid, item])).values());
    const uniqueFrag = Array.from(new Map(fragCases.map(item => [item.pid, item])).values());

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
        <SectionHeader icon={RefreshCw} title="Potensi Readmisi & Fragmentasi" desc="Deteksi pasien rawat inap (Readmisi) dan rawat jalan (Fragmentasi) dengan kunjungan ulang < 30 hari." colorClass="bg-rose-50 text-rose-600" highlightClass="bg-rose-500/5" exportAction={() => {}} exportText="Ekspor" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6 bg-white border-l-4 border-l-rose-500">
            <h4 className="text-slate-500 uppercase text-xs font-extrabold mb-2">Potensi Readmisi (Rawat Inap)</h4>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-black text-rose-600">{uniqueReadmisi.length}</p>
              <span className="text-sm font-bold text-slate-400 mb-1">Pasien</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Kunjungan ulang PTD=1 dalam <span className="font-bold">&lt; 30 hari</span>.</p>
          </Card>
          <Card className="p-6 bg-white border-l-4 border-l-orange-500">
            <h4 className="text-slate-500 uppercase text-xs font-extrabold mb-2">Potensi Fragmentasi / Konsul Internal (Rawat Jalan)</h4>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-black text-orange-600">{uniqueFrag.length}</p>
              <span className="text-sm font-bold text-slate-400 mb-1">Pasien</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Kunjungan ulang PTD=2 dalam <span className="font-bold">&lt; 30 hari</span>.</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Daftar Pasien Terindikasi</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4 border-b border-slate-200 w-12 text-center">No</th>
                    <th className="px-5 py-4 border-b border-slate-200">No RM</th>
                    <th className="px-5 py-4 border-b border-slate-200 min-w-[200px]">Data Pasien</th>
                    <th className="px-5 py-4 border-b border-slate-200">Riwayat Kunjungan (Terkait Indikasi Saja)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {[...uniqueReadmisi.map(u => ({...u, type: 'Readmisi'})), ...uniqueFrag.map(u => ({...u, type: 'Fragmentasi'}))]
                    .sort((a,b) => b.history.length - a.history.length).map((c, idx) => {
                    
                    // Filter history based on type: Readmisi = PTD 1 only, Fragmentasi = PTD 2 only
                    const filteredHistory = c.history.filter(v => c.type === 'Readmisi' ? String(v.PTD||'').trim() === '1' : String(v.PTD||'').trim() === '2');
                    
                    return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4 text-center font-bold text-slate-400 align-top">{idx + 1}</td>
                      <td className="px-5 py-4 font-black text-slate-700 align-top">{c.pid}</td>
                      <td className="px-5 py-4 align-top whitespace-normal min-w-[200px]">
                        <div className="font-bold text-slate-600 text-sm mb-2">{maskNameSafe(c.nama)}</div>
                        <span className={"px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase " + (c.type === 'Readmisi' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700')}>
                          {c.type}
                        </span>
                        <div className="mt-4">
                          <button
                            onClick={() => openDrilldown('Semua Riwayat Kunjungan: ' + c.nama, r => String(r.MRN || r.NOKARTU || '').trim() === c.pid, 'patient')}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all w-full text-center flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Search size={12} /> Drilldown Semua Kunjungan
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-normal min-w-[600px] align-top">
                        <div className="flex flex-col gap-2">
                          {filteredHistory.map((v, i) => {
                            const isPtd1 = String(v.PTD || '').trim() === '1';
                            const diagC = String(v.INACBG || '-');
                            const diagDesc = String(v.DESKRIPSI_INACBG || '-');
                            const dlist = String(v.DIAGLIST || '-');
                            const plist = String(v.PROCLIST || '-');
                            const sep = String(v.SEP || v.NO_SEP || '-');
                            
                            return (
                              <div key={i} className={"flex gap-3 p-3 rounded-lg border " + (isPtd1 ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50 border-slate-200')}>
                                <span className={"font-black px-2 py-0.5 rounded text-[10px] h-fit " + (isPtd1 ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-200 text-slate-700')}>
                                  {i + 1}
                                </span>
                                <div className="flex-1 space-y-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-800">{String(v.DISCHARGE_DATE || '-')}</span>
                                    <span className={"text-[10px] font-black uppercase px-1.5 rounded " + (isPtd1 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600')}>
                                      {isPtd1 ? 'Rawat Inap' : 'Rawat Jalan'}
                                    </span>
                                    <span className="font-mono text-[10px] font-bold text-slate-500 bg-white border px-1.5 rounded">SEP: {sep}</span>
                                    {v.DPJP && <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 rounded">DPJP: {maskNameSafe(v.DPJP)}</span>}
                                  </div>
                                  <div className="text-[10px] text-slate-600">
                                    <span className="font-bold text-slate-800">{diagC}</span> - {diagDesc}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div className="bg-white p-1.5 rounded border border-slate-100">
                                      <div className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Diaglist</div>
                                      <div className="text-[10px] font-mono text-slate-600">{dlist}</div>
                                    </div>
                                    <div className="bg-white p-1.5 rounded border border-slate-100">
                                      <div className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Proclist</div>
                                      <div className="text-[10px] font-mono text-slate-600">{plist}</div>
                                    </div>
                                  </div>
                                </div>
                                {i > 0 && (() => {
                                  // Find the previous visit in chronological order
                                  const prevV = filteredHistory[i-1];
                                  const d1 = parseDateSafe(prevV.DISCHARGE_DATE);
                                  const d2 = parseDateSafe(v.DISCHARGE_DATE);
                                  const df = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
                                  if (df < 30) {
                                    const sameD = normDpjp(prevV.DPJP) === normDpjp(v.DPJP);
                                    const diagRel = String(prevV.INACBG||'').split('-').slice(0,2).join('-') === String(v.INACBG||'').split('-').slice(0,2).join('-');
                                    return (
                                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                                        <span className="text-[9px] font-black text-rose-600 bg-rose-100 px-1.5 rounded uppercase tracking-wider">{df} Hari Sjk Sblmnya</span>
                                        <div className="flex gap-1 mt-1">
                                          {!sameD && <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 border border-orange-200 rounded">DPJP Beda</span>}
                                          {sameD && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 border border-emerald-200 rounded">DPJP Sama</span>}
                                        </div>
                                        {diagRel && <div className="mt-0.5"><span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 border border-purple-200 rounded">Diag Berkaitan</span></div>}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
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
            <Card key={i} className="p-6 border-0 shadow-xl hover:-translate-y-1 transition-all group cursor-pointer" onClick={() => openDrilldown(`Potensi TopUp: ${item.item}`, row => {
              const billCols = ["SI", "SD", "SR", "SP", "KODE_SI", "KODE_SD", "KODE_SR", "KODE_SP", "SPECIAL_SI", "SPECIAL_SD", "SPECIAL_SR", "SPECIAL_SP", "SPECIAL_CMG"];
              let billing_detected = false;
              for (let col of billCols) {
                let v = String(row[col] || row[col.toLowerCase()] || '').trim().toUpperCase();
                if (v && !["-", "0", "0.0", "NONE", "NAN", ""].includes(v)) { billing_detected = true; break; }
              }
              if (billing_detected) return false;
              
              if (item.layanan && String(item.layanan) !== String(row['PTD'] || '').trim()) return false;

              const ina_norm = normalize_c(String(row['INACBG'] || '').trim());
              const diag_norm = normalize_c(row['DIAGNOSA'] || '');
              const all_codes = (String(row['DIAGLIST'] || '') + " " + String(row['PROCLIST'] || '')).split(/[;, ]/).map(c => normalize_c(c)).filter(c => c);
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
            const billCols = ["SI", "SD", "SR", "SP", "KODE_SI", "KODE_SD", "KODE_SR", "KODE_SP", "SPECIAL_SI", "SPECIAL_SD", "SPECIAL_SR", "SPECIAL_SP", "SPECIAL_CMG"];
            let billing_detected = false;
            for (let col of billCols) {
              let v = String(row[col] || row[col.toLowerCase()] || '').trim().toUpperCase();
              if (v && !["-", "0", "0.0", "NONE", "NAN", ""].includes(v)) { billing_detected = true; break; }
            }
            if (billing_detected) return false;
            
            if (r.layanan && String(r.layanan) !== String(row['PTD'] || '').trim()) return false;

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
          <Card className="p-6 bg-white cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all" onClick={() => openDrilldown('Seluruh Kasus ICU', r => {
            const icuInd = String(r['ICU_INDIKATOR'] || '').trim();
            const icuLos = parseFloat(r['ICU_LOS'] || 0);
            const ventHour = parseFloat(r['VENT_HOUR'] || 0);
            return icuInd === '1' || icuLos > 0 || ventHour > 0;
          })}><h4 className="text-slate-500 uppercase text-xs font-extrabold mb-2">Total Kasus ICU</h4><p className="text-4xl font-black text-red-600">{data.total || 0}</p></Card>
          <Card className="p-6 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all" onClick={() => openDrilldown('ICU SL 1', r => {
            const icuInd = String(r['ICU_INDIKATOR'] || '').trim();
            const icuLos = parseFloat(r['ICU_LOS'] || 0);
            const ventHour = parseFloat(r['VENT_HOUR'] || 0);
            const isIcu = icuInd === '1' || icuLos > 0 || ventHour > 0;
            const inaCode = String(r['INACBG'] || '').trim();
            const sev = inaCode.endsWith('-I') ? 1 : inaCode.endsWith('-II') ? 2 : inaCode.endsWith('-III') ? 3 : 0;
            return isIcu && sev === 1;
          })}><h4 className="text-slate-500 uppercase text-xs font-extrabold mb-2">ICU SL 1</h4><p className="text-2xl font-black">{data.sev1 || 0}</p></Card>
          <Card className="p-6 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all" onClick={() => openDrilldown('ICU SL 2', r => {
            const icuInd = String(r['ICU_INDIKATOR'] || '').trim();
            const icuLos = parseFloat(r['ICU_LOS'] || 0);
            const ventHour = parseFloat(r['VENT_HOUR'] || 0);
            const isIcu = icuInd === '1' || icuLos > 0 || ventHour > 0;
            const inaCode = String(r['INACBG'] || '').trim();
            const sev = inaCode.endsWith('-I') ? 1 : inaCode.endsWith('-II') ? 2 : inaCode.endsWith('-III') ? 3 : 0;
            return isIcu && sev === 2;
          })}><h4 className="text-slate-500 uppercase text-xs font-extrabold mb-2">ICU SL 2</h4><p className="text-2xl font-black">{data.sev2 || 0}</p></Card>
          <Card className="p-6 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all" onClick={() => openDrilldown('ICU SL 3', r => {
            const icuInd = String(r['ICU_INDIKATOR'] || '').trim();
            const icuLos = parseFloat(r['ICU_LOS'] || 0);
            const ventHour = parseFloat(r['VENT_HOUR'] || 0);
            const isIcu = icuInd === '1' || icuLos > 0 || ventHour > 0;
            const inaCode = String(r['INACBG'] || '').trim();
            const sev = inaCode.endsWith('-I') ? 1 : inaCode.endsWith('-II') ? 2 : inaCode.endsWith('-III') ? 3 : 0;
            return isIcu && sev === 3;
          })}><h4 className="text-slate-500 uppercase text-xs font-extrabold mb-2">ICU SL 3</h4><p className="text-2xl font-black">{data.sev3 || 0}</p></Card>
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
            ]} onRowClick={r => openDrilldown('Pasien: SEP ' + r.sep, row => String(row.SEP || row.sep || row.NO_SEP || row.no_sep || '').trim() === String(r.sep).trim())} />
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
        {/* Advertisement Overlay (shows on login page too) */}
        {showAdOverlay && (
          <div className="fixed inset-0 z-[9999] bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-6"
            style={{ animation: 'fadeIn 0.5s ease' }}>
            <div className="relative max-w-4xl w-full mx-auto" style={{ animation: 'zoomIn 0.6s ease' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowAdOverlay(false); }}
                className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl text-slate-500 hover:text-rose-600 hover:scale-110 transition-all z-10"
              >
                <X size={20} />
              </button>
              <a href="https://drive.google.com/file/d/1L2g_Z8Gxv1MRHxVt5RsGBsMJ-0xItjas/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="block rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-slate-800">
                <img
                  src="https://lh3.googleusercontent.com/d/1L2g_Z8Gxv1MRHxVt5RsGBsMJ-0xItjas"
                  alt="Advertisement"
                  className="w-full h-auto object-contain max-h-[85vh]"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                  }}
                />
                <div style={{ display: 'none' }} className="w-full h-64 flex-col items-center justify-center gap-3 text-white/60">
                  <span className="text-5xl">📢</span>
                  <p className="text-sm font-semibold">Klik untuk melihat informasi lebih lanjut</p>
                </div>
              </a>
              <p className="text-center text-white/50 text-xs mt-4 font-medium tracking-wider">
                {initialAdDone ? 'Gerakkan mouse atau klik untuk menutup' : 'Iklan ini akan otomatis tertutup dalam 5 detik...'}
              </p>
            </div>
          </div>
        )}
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 30%, #f0fdf9 60%, #f8fafc 100%)' }}>
          {/* Soft mesh background blobs */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(94,234,212,0.25) 0%, transparent 70%)', filter: 'blur(60px)' }}></div>
            <div className="absolute top-[10%] right-[-10%] w-[45%] h-[50%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(167,243,208,0.2) 0%, transparent 70%)', filter: 'blur(70px)' }}></div>
            <div className="absolute bottom-[-10%] left-[15%] w-[55%] h-[45%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(186,230,253,0.3) 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
            <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(165,243,252,0.2) 0%, transparent 70%)', filter: 'blur(50px)' }}></div>
          </div>
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            {loginParticles.map((p, i) => (
              <div key={i} className="absolute rounded-full" style={{ width: `${p.size}px`, height: `${p.size}px`, left: `${p.x}%`, top: `${p.y}%`, background: 'rgba(20,184,166,0.15)', animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`, animation: `pulse ${p.duration}s ease-in-out ${p.delay}s infinite` }} />
            ))}
          </div>

          <div className="w-full max-w-md relative z-10 animate-in zoom-in-95 duration-700">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white shadow-2xl shadow-sky-900/10 mb-6 overflow-hidden p-3 border border-white/20">
                <img src="https://lh3.googleusercontent.com/d/1K9BUgDDRmF0d9Q9mCasC5KhDXVpVhJs5" className="w-full h-full object-contain" alt="Logo" />
              </div>
              <div className="flex flex-col items-center justify-center">
                <h1 className="text-4xl font-black tracking-tight leading-none mb-1" style={{ color: '#0f4c75', textShadow: '0 2px 20px rgba(14,165,233,0.15)' }}>
                  AKURAT - <span style={{ color: '#0ea5e9' }}>iD</span><span style={{ color: '#0f4c75' }}>RG</span>
                </h1>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-center px-4 mt-3 leading-relaxed" style={{ color: '#64748b' }}>Analisis Klaim & Utilisasi Review Terpadu<br />Indonesian Diagnosis Related Group</p>
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
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"} value={password}
                      onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                      className="w-full pl-6 pr-14 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-800 placeholder-slate-300 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-bold shadow-sm"
                      placeholder="Masukkan password" required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-2 ml-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setForgotError('');
                        setForgotSuccess('');
                        setForgotIdentity('');
                      }}
                      className="text-teal-500 hover:text-teal-600 text-[10px] font-black tracking-wider uppercase transition-colors"
                    >
                      Lupa Password?
                    </button>
                  </div>
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
                <div className="mt-3">
                  <button type="button" onClick={() => setShowRegister(true)} className="text-teal-500 hover:text-teal-600 text-[11px] font-bold transition-colors">Belum punya akun? Daftar Baru di sini</button>
                </div>
                <p className="text-slate-300 text-[9px] mt-2 font-medium">© 2026 iDRG Analytics Platform • Alpha v1.4.6 (210520261156)</p>
              </div>
            </div>
          </div>
        </div>

        {showForgotPassword && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="max-w-md w-full p-8 shadow-2xl border border-white/20 bg-white relative rounded-[2rem] animate-in zoom-in-95 duration-300">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
              
              <button 
                onClick={() => setShowForgotPassword(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-rose-600 hover:scale-105 transition-all outline-none"
              >
                <X size={16} />
              </button>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center shadow-inner mx-auto mb-2">
                  <Key size={32} className="text-teal-600" />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Lupa Password Sistem?</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-bold">
                  Masukkan Email terdaftar Anda. Kami akan mengirimkan tautan pemulihan kata sandi.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="mt-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Email Terdaftar</label>
                  <input
                    type="email"
                    value={forgotIdentity}
                    onChange={e => { setForgotIdentity(e.target.value); setForgotError(''); setForgotSuccess(''); }}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-800 placeholder-slate-300 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-bold shadow-sm"
                    placeholder="Contoh: user@email.com"
                    required
                  />
                </div>

                {forgotError && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 font-bold text-xs animate-in shake duration-300">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {forgotSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-xs animate-in fade-in duration-300">
                    <CheckCircle size={16} className="shrink-0" />
                    <span>{forgotSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessingForgot}
                  className={`w-full font-black py-4 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 text-xs tracking-[0.1em] uppercase ${!isProcessingForgot
                    ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 hover:-translate-y-0.5'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed border-2 border-slate-50'
                    }`}
                >
                  {isProcessingForgot ? <Activity size={16} className="animate-spin" /> : <Send size={16} />}
                  {isProcessingForgot ? 'MEMPROSES...' : 'KIRIM RESET LINK'}
                </button>
              </form>
            </div>
          </div>
        )}

        {showRegister && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="max-w-md w-full max-h-[95vh] overflow-y-auto custom-scrollbar p-10 shadow-2xl border border-white/20 bg-white relative rounded-[2.5rem] animate-in zoom-in-95 duration-300">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600"></div>
              <button onClick={() => setShowRegister(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all">
                <X size={20} />
              </button>
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ClipboardList size={32} className="text-teal-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Permohonan Akun</h2>
                <p className="text-sm text-slate-500 font-medium mt-2">Daftar untuk mendapatkan akses ke aplikasi</p>
              </div>

              {regState.error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                  <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-rose-700">{regState.error}</p>
                </div>
              )}

              {regState.success && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                  <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-emerald-700">{regState.success}</p>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email</label>
                  <input type="email" required value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent block p-3.5 transition-all outline-none font-medium" placeholder="email@contoh.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                  <input type="password" required value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} minLength={6} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent block p-3.5 transition-all outline-none font-medium" placeholder="Minimal 6 karakter" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Username (ID Login)</label>
                  <input type="text" required value={regData.username} onChange={e => setRegData({...regData, username: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent block p-3.5 transition-all outline-none font-medium" placeholder="johndoe" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nama Lengkap</label>
                  <input type="text" required value={regData.nama} onChange={e => setRegData({...regData, nama: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent block p-3.5 transition-all outline-none font-medium" placeholder="Nama Lengkap Anda" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nama Rumah Sakit / Faskes</label>
                  <input type="text" required value={regData.faskes} onChange={e => setRegData({...regData, faskes: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent block p-3.5 transition-all outline-none font-medium" placeholder="RSUD Contoh" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">No WhatsApp</label>
                  <input type="text" value={regData.wa} onChange={e => setRegData({...regData, wa: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent block p-3.5 transition-all outline-none font-medium" placeholder="081234567890" />
                </div>
                <div className="pt-4">
                  <button type="submit" disabled={regState.loading} className="w-full font-black py-4 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 text-xs tracking-[0.1em] uppercase bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0">
                    {regState.loading ? <Activity size={16} className="animate-spin" /> : <Send size={16} />}
                    {regState.loading ? 'MEMPROSES...' : 'KIRIM PERMOHONAN'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 gap-4 border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-start gap-3 sm:gap-4">
                {drilldown.prev && (
                  <button
                    onClick={() => setDrilldown(drilldown.prev)}
                    className="p-1.5 sm:p-2 bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white rounded-xl transition-all shadow-sm border border-teal-100 group mt-0.5"
                    title="Kembali ke Daftar INACBG / iDRG"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>
                )}
                <div>
                  <h3 className="text-base sm:text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
                    {!drilldown.prev && <Table2 size={20} className="text-teal-600 shrink-0" />} Rincian Data Analitik
                  </h3>
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-400 mt-1 uppercase tracking-[0.2em]">{drilldown.title} — {drilldown.data.length.toLocaleString()} Record Terfilter</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <button onClick={dlDrilldownCSV} className="bg-teal-600 hover:bg-teal-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-teal-600/20 transition-all uppercase tracking-wider">
                  <Download size={16} /> <span className="hidden sm:inline">Unduh CSV</span>
                </button>
                <button onClick={() => setDrilldown({ isOpen: false, title: '', data: [] })} className="p-2 sm:p-2.5 hover:bg-rose-50 rounded-full transition-all border border-transparent hover:border-rose-100 text-slate-400 hover:text-rose-600">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="overflow-auto flex-1 p-0 bg-slate-50/50 custom-scrollbar">
              {drilldown.data.length === 0 ? (
                <div className="p-16 text-center text-slate-400 font-semibold text-lg">Tidak ada rincian data.</div>
              ) : (
                <div className="flex flex-col">
                  {/* SCORECARD 18 KOMPONEN */}
                  {drilldownStats && drilldown.type !== 'pending_sakti' && (
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

                  <div className="p-0 overflow-x-auto custom-scrollbar">
                    {drilldown.type === 'pending_sakti' ? (
                      <table className="w-full text-[11px] text-left whitespace-nowrap">
                        <thead className="bg-slate-900 text-white sticky top-0 z-30 shadow-sm border-b border-slate-700 text-[10px] font-black uppercase tracking-wider text-center">
                          <tr>
                            <th className="px-5 py-4 border-r border-slate-800 w-12">No</th>
                            <th className="px-5 py-4 border-r border-slate-800 text-left min-w-[130px]">No SEP</th>
                            <th className="px-5 py-4 border-r border-slate-800 text-left min-w-[140px]">Nama Pasien</th>
                            <th className="px-5 py-4 border-r border-slate-800 text-left min-w-[200px] whitespace-normal">Keterangan Pending</th>
                            <th className="px-5 py-4 border-r border-slate-800 text-center min-w-[125px]">Kelompok Kasus</th>
                            <th className="px-5 py-4 border-r border-slate-800 text-center min-w-[125px]">Faktor Penyebab</th>
                            <th className="px-5 py-4 border-r border-slate-800 text-left min-w-[140px]">DPJP Utama</th>
                            <th className="px-5 py-4 border-r border-slate-800 text-left min-w-[120px]">Coder</th>
                            <th className="px-5 py-4 border-r border-slate-800 text-left min-w-[180px] whitespace-normal">Diaglist</th>
                            <th className="px-5 py-4 text-left min-w-[180px] whitespace-normal">Proclist</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white font-medium">
                          {drilldown.data.map((c, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="px-5 py-3.5 border-r border-slate-50 text-center font-bold text-slate-400">{idx + 1}</td>
                              <td className="px-5 py-3.5 border-r border-slate-50 font-mono font-bold text-slate-500">{c.sep || '-'}</td>
                              <td className="px-5 py-3.5 border-r border-slate-50 font-black text-slate-800">{c.nama || '-'}</td>
                              <td className="px-5 py-3.5 border-r border-slate-50 text-slate-600 whitespace-normal min-w-[200px] break-words leading-relaxed">{c.keterangan || '-'}</td>
                              <td className="px-5 py-3.5 border-r border-slate-50 text-center">
                                <span className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full font-black text-[9px] uppercase tracking-wide border border-teal-200 shadow-sm">
                                  {Array.isArray(c.kategori) ? c.kategori.join(', ') : (c.kategori || '-')}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 border-r border-slate-50 text-center">
                                <span className={`px-2.5 py-1 rounded-full font-black text-[9px] uppercase tracking-wide border shadow-sm ${
                                  c.faktor === 'Internal RS' 
                                    ? 'bg-rose-50 border-rose-200 text-rose-700' 
                                    : c.faktor === 'Eksternal BPJS' 
                                      ? 'bg-sky-50 border-sky-200 text-sky-700' 
                                      : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}>
                                  {c.faktor || '-'}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 border-r border-slate-50 font-bold text-slate-700">{c.dpjp || '-'}</td>
                              <td className="px-5 py-3.5 border-r border-slate-50 font-bold text-slate-700">{c.coderName || '-'}</td>
                              <td className="px-5 py-3.5 border-r border-slate-50 text-slate-500 whitespace-normal min-w-[180px] break-words leading-relaxed font-mono">{c.diaglist || '-'}</td>
                              <td className="px-5 py-3.5 text-slate-500 whitespace-normal min-w-[180px] break-words leading-relaxed font-mono">{c.proclist || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : drilldown.type === 'audit_kpi' ? (
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
                            <th rowSpan={2} className="px-5 py-4 border-r border-slate-100 align-middle bg-slate-50">DPJP</th>
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
                              <td colSpan={8} className="px-5 py-3 font-black text-right text-teal-900 tracking-wider text-xs uppercase">~ Rata-Rata / {drilldown.data.length.toLocaleString()} Kasus:</td>
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
                                <td className={`${tCell} font-bold text-slate-600`}>{(() => { const dpjpVal = String(row.DPJP || '-').trim(); return dpjpVal !== '-' ? dpjpVal.split(' ').filter(w=>w.length>0).map(w => w.charAt(0) + '***').join(' ') : dpjpVal; })()}</td>
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

        {/* MOBILE BACKDROP OVERLAY */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] lg:hidden animate-in fade-in duration-200"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR NAVIGATION */}
        <aside className={`bg-white border-r border-teal-100 transition-all duration-300 z-[100] flex flex-col shadow-2xl shadow-teal-900/5 print:hidden fixed inset-y-0 left-0 lg:relative ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-20 w-64'} shrink-0 h-screen`}>
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
                  <span className="text-[7px] text-teal-400 font-black mt-0.5 tracking-[0.2em] uppercase leading-tight">Alpha v1.4.6 (210520261156)</span>
                </div>
              )}
            </div>
            {/* Mobile close button inside sidebar */}
            {isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1.5 hover:bg-teal-100 rounded-lg text-teal-600 transition-colors" title="Tutup Menu">
                <X size={18} />
              </button>
            )}
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
            <button onClick={() => { setActiveTab('upload'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'upload' ? 'bg-teal-600 text-white shadow-xl shadow-teal-600/30' : 'text-slate-600 hover:bg-teal-50 hover:text-teal-700'} ${!isSidebarOpen && 'justify-center'}`} title="Integrasi Data">
              <UploadCloud size={20} className="shrink-0" />
              {isSidebarOpen && <span>Integrasi Data</span>}
            </button>

            <div className={`mt-8 mb-3 ${isSidebarOpen ? 'px-3' : 'text-center'}`}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isSidebarOpen ? 'Dashboard Menu' : '...'}</p>
            </div>

            {TABS.filter(t => t.id !== 'user_management' || username.toLowerCase() === 'admin').map((t, idx) => {
              const Icon = t.icon;
              const isActive = activeTab === 'dashboard' && subTab === t.id;
              return (
                <button key={idx} onClick={() => { setActiveTab('dashboard'); setSubTab(t.id); if (window.innerWidth < 1024) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all group ${isActive ? 'bg-teal-50 text-teal-700 font-bold border border-teal-100 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium border border-transparent'} ${!isSidebarOpen && 'justify-center'}`} title={t.label}>
                  <Icon size={20} className={`shrink-0 transition-colors ${isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {isSidebarOpen && <span className="whitespace-nowrap">{t.label}</span>}
                </button>
              )
            })}


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
          <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 shrink-0 flex items-center px-4 sm:px-6 justify-between z-[80] shadow-sm print:hidden">
            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors shrink-0">
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2 lg:hidden shrink-0">
                <img src="https://lh3.googleusercontent.com/d/1K9BUgDDRmF0d9Q9mCasC5KhDXVpVhJs5" className="w-6 h-6 object-contain" alt="Logo" />
              </div>
              <h2 className="text-sm sm:text-lg font-black text-slate-800 tracking-tight truncate max-w-[140px] sm:max-w-none">
                {activeTab === 'upload' ? 'Integrasi Data' : TABS.find(t => t.id === subTab)?.label || 'Dashboard'}
              </h2>
            </div>
            <div className="text-xs font-bold text-slate-400 bg-slate-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-1.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> <span className="hidden sm:inline">Status</span> Aktif
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar scroll-smooth">
            {activeTab === 'upload' ? (<div className="px-6">{renderUploadTab()}</div>) : (
                            <div className="px-4 sm:px-6">
                {/* Persistent Pending Sakti Dashboard Container */}
                <div style={{ display: subTab === 'pending_sakti' ? 'block' : 'none' }}>
                  <PendingSaktiDashboard 
                    isDarkMode={isDarkMode} 
                    mainDataset={dashData?.rawRows || []} 
                    resolveKsmDept={(dpjp) => {
                      const ksm = extractKsm(dpjp, ksmOverrides);
                      return {
                        ksm,
                        dept: getDept(ksm, dpjp, ksmOverrides)
                      };
                    }}
                    openDrilldown={openDrilldown}
                  />
                </div>

                {subTab === 'user_management' ? renderUserManagement() : 
                 subTab === 'sync_icd' ? renderSyncIcdTab() :
                 subTab === 'pending_sakti' ? null : (
                   dashData && dashData.isLoaded ? (
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
                        {subTab === 'executive' && renderExecutive()} {subTab === 'report' && renderReport()} {subTab === 'rekap' && renderRekap()} {subTab === 'readmisi' && renderReadmisiFragmentasi()}
                        {subTab === 'topup' && renderTopUp()}
                        {subTab === 'sl_cl_analysis' && renderSlClAnalysis()} {subTab === 'dept' && renderDepartemen()} {subTab === 'ksm' && renderKsm()} {subTab === 'dpjp' && renderDpjp()} {subTab === 'kpi_coder' && renderKpiCoder()}
                        {subTab === 'mapping' && renderPemetaan()} {subTab === 'discrepancy' && renderKetepatan()} {subTab === 'audit' && renderAudit()}
                        {subTab === 'naik_kelas' && renderNaikKelas()} {subTab === 'icu' && renderICU()}
                        {subTab === 'insight_sosialisasi' && (
                          <InsightSosialisasiComponent
                            dashData={dashData}
                            ksmOverrides={ksmOverrides}
                            selectedSocializationDept={selectedSocializationDept}
                            setSelectedSocializationDept={setSelectedSocializationDept}
                            selectedSocializationKsm={selectedSocializationKsm}
                            setSelectedSocializationKsm={setSelectedSocializationKsm}
                            socializationScatterMode={socializationScatterMode}
                            setSocializationScatterMode={setSocializationScatterMode}
                            isSlideMode={isSlideMode}
                            setIsSlideMode={setIsSlideMode}
                            openDrilldown={openDrilldown}
                            activeExclusionCodes={activeExclusionCodes}
                          />
                        )}
                        {subTab === 'settings_ksm' && renderKsmMappingSettings()}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white/50 backdrop-blur-sm border border-slate-200/60 p-20 rounded-[2.5rem] text-center mt-10 max-w-3xl mx-auto shadow-2xl shadow-slate-200/50 animate-in zoom-in-95 duration-500">
                    <div className="mb-10 animate-in fade-in zoom-in-75 duration-1000">
                      <img src="https://lh3.googleusercontent.com/d/1K9BUgDDRmF0d9Q9mCasC5KhDXVpVhJs5" alt="akurat.id Logo" className="w-72 mx-auto drop-shadow-[0_20px_50px_rgba(20,184,166,0.3)] transition-transform hover:scale-105 duration-700" />
                    </div>
                    <h2 className="text-3xl font-black mb-4 text-slate-800 tracking-tight">Menunggu Dataset Utama...</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      Dashboard analitik belum aktif. Silakan menuju tab <strong className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">Integrasi Data</strong> untuk mengunggah file TXT klaim RS agar sistem dapat memproses wawasan finansial Anda.
                    </p>
                    <button onClick={() => setActiveTab('upload')} className="mt-8 bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-teal-600/20 hover:-translate-y-1 uppercase tracking-widest">MULAI INTEGRASI SEKARANG</button>
                  </div>
                ))}
              </div>
            )}
          </main>
          <footer className="p-4 text-center border-t border-slate-100 mt-12 bg-white/30 backdrop-blur-sm relative z-20 print:hidden">
            <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 flex-wrap">
              <span>Copyright@RPP Analisis Klaim & Utilisasi Review Terpadu iDRG</span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500/50 hidden sm:inline" />
              <span className="bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full font-black border border-teal-100 shadow-sm shrink-0">Alpha v1.4.6</span>
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
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)], .shadow-xl, .shadow-sm { box-shadow: none !important; border: 1px solid #cbd5e1 !important; }
          .custom-scrollbar { overflow: visible !important; max-height: none !important; height: auto !important; }
          .h-screen { height: auto !important; overflow: visible !important; }
          .overflow-hidden { overflow: visible !important; }
          .overflow-y-auto { overflow: visible !important; }
          .overflow-auto { overflow: visible !important; }
          [style*="max-height"], [style*="maxHeight"], .max-h-\\[350px\\], .max-h-\\[500px\\], .max-h-\\[400px\\], .max-h-\\[600px\\], .max-h-\\[700px\\] {
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
          }
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

        {/* Advertisement Overlay (Screensaver - logged in) */}
        {showAdOverlay && initialAdDone && (
          <div className="fixed inset-0 z-[9999] bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-6"
            style={{ animation: 'fadeIn 0.5s ease' }}>
            <div className="relative max-w-4xl w-full mx-auto" style={{ animation: 'zoomIn 0.6s ease' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowAdOverlay(false); }}
                className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl text-slate-500 hover:text-rose-600 hover:scale-110 transition-all z-10"
              >
                <X size={20} />
              </button>
              <a href="https://drive.google.com/file/d/1L2g_Z8Gxv1MRHxVt5RsGBsMJ-0xItjas/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="block rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-slate-800">
                <img
                  src="https://lh3.googleusercontent.com/d/1L2g_Z8Gxv1MRHxVt5RsGBsMJ-0xItjas"
                  alt="Advertisement"
                  className="w-full h-auto object-contain max-h-[85vh]"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                  }}
                />
                <div style={{ display: 'none' }} className="w-full h-64 flex-col items-center justify-center gap-3 text-white/60">
                  <span className="text-5xl">📢</span>
                  <p className="text-sm font-semibold">Klik untuk melihat informasi lebih lanjut</p>
                </div>
              </a>
              <p className="text-center text-white/50 text-xs mt-4 font-medium tracking-wider">
                Gerakkan mouse atau klik untuk menutup
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
