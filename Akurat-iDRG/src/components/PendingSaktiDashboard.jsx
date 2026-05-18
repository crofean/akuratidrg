import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, Info, Copy, 
  Move, Search, Check, RefreshCw, Sparkles, Brain, Download, HelpCircle, 
  ChevronDown, ChevronUp, FileText, UserCheck, ShieldCheck, Stethoscope
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';

// Default API Key for Gemini AI
// API Key default dikosongkan untuk keamanan - masukkan key Anda di kolom input
const DEFAULT_GEMINI_KEY = "";

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

// High-performance CSV parser supporting quotes
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

// Helper function to resolve ICD codes into readable descriptions
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

// Helper function to render detected ICD codes as clean interactive badges
const renderIcdPills = (codeListStr) => {
  if (!codeListStr || codeListStr === "-") return <span className="text-slate-400 font-medium italic text-[10px]">Tidak ada kode</span>;
  
  // Split by comma, semicolon, or space
  const codes = codeListStr.split(/[\\s,;]+/).map(c => c.trim()).filter(c => c.length > 0 && c !== "-");
  if (codes.length === 0) return <span className="text-slate-400 font-medium italic text-[10px]">Tidak ada kode</span>;
  
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {codes.map((code, idx) => {
        const desc = getIcdDescription(code);
        return (
          <div 
            key={idx} 
            className="group relative flex items-center gap-1 bg-slate-100 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-700 hover:text-teal-800 transition-all cursor-help"
            title={desc || "Kode ICD BPJS"}
          >
            <span className="font-mono text-teal-600 group-hover:text-teal-700">{code}</span>
            {desc && (
              <span className="text-[9px] text-slate-500 font-medium border-l pl-1 border-slate-300 group-hover:border-teal-300 max-w-[120px] truncate">
                {desc}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Helper to format currency
const formatRp = (val) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val);
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

const saveAsPng = async (elementId, fileName) => {
  console.log("saveAsPng called for ID:", elementId, "with file name:", fileName);
  const el = document.getElementById(elementId);
  if (!el) {
    console.error("Element not found in DOM with ID:", elementId);
    alert("⚠️ Error: Elemen grafik \"" + elementId + "\" tidak ditemukan di halaman! Silakan unggah file Excel terlebih dahulu.");
    return;
  }
  
  // Tampilkan indikator proses langsung di UI
  const loadingIndicator = document.createElement("div");
  loadingIndicator.style.position = "fixed";
  loadingIndicator.style.top = "30px";
  loadingIndicator.style.left = "50%";
  loadingIndicator.style.transform = "translateX(-50%)";
  loadingIndicator.style.background = "rgba(15, 23, 42, 0.95)";
  loadingIndicator.style.color = "#fff";
  loadingIndicator.style.padding = "14px 28px";
  loadingIndicator.style.borderRadius = "12px";
  loadingIndicator.style.zIndex = "99999";
  loadingIndicator.style.fontSize = "13px";
  loadingIndicator.style.fontWeight = "bold";
  loadingIndicator.style.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.4)";
  loadingIndicator.style.fontFamily = "sans-serif";
  loadingIndicator.style.border = "1px solid rgba(255, 255, 255, 0.1)";
  loadingIndicator.innerText = "⏳ Sedang memproses dan mengunduh gambar PNG... Mohon tunggu sebentar.";
  document.body.appendChild(loadingIndicator);

  try {
    // Tunggu sebentar agar render indicator muncul sebelum JS blocking process
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const canvas = await html2canvas(el, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: true
    });
    
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName.replace(/\s+/g, "_")}.png`;
    link.click();
    console.log("Successfully saved chart as PNG:", fileName);
  } catch (err) {
    console.error("Failed to save chart:", err);
    alert("⚠️ Gagal menyimpan gambar!\\nDetail Error: " + err.message + "\\n\\nSilakan periksa console browser (F12) untuk melihat info selengkapnya.");
  } finally {
    if (loadingIndicator && loadingIndicator.parentNode) {
      loadingIndicator.parentNode.removeChild(loadingIndicator);
    }
  }
};

export default function PendingSaktiDashboard({ isDarkMode, mainDataset = [], resolveKsmDept, openDrilldown }) {
  const [fileData, setFileData] = useState([]);
  
  // Google Sheets ICD Dictionary States
  const [icdSheetUrl, setIcdSheetUrl] = useState(() => localStorage.getItem("sak_icd_sheet_url") || "https://docs.google.com/spreadsheets/d/19Fqy6_e_j9_cuH43as9pB_5gJjWnPO3Eb2EIfX1or-w/edit?usp=sharing");
  const [customIcdMap, setCustomIcdMap] = useState({});
  const [isSyncingIcd, setIsSyncingIcd] = useState(false);
  const [icdSyncStatus, setIcdSyncStatus] = useState("");

  // Load dynamic dictionary from IndexedDB when component mounts & listen to sync events
  useEffect(() => {
    const loadDict = async () => {
      try {
        const map = await loadIcdDictFromDb();
        setCustomIcdMap(map);
      } catch (err) {
        console.error("Gagal memuat database IndexedDB ICD kustom:", err);
      }
    };
    
    const handleSyncComplete = (e) => {
      console.log('[SAK-iDRG] (Pending) ICD sync complete event received. Refreshing component map...');
      setCustomIcdMap(e.detail || window.sakIcdMap);
    };

    loadDict();
    window.addEventListener('sak_icd_sync_complete', handleSyncComplete);
    return () => {
      window.removeEventListener('sak_icd_sync_complete', handleSyncComplete);
    };
  }, []);
  const [headers, setHeaders] = useState([]);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [columnMapping, setColumnMapping] = useState({
    sep: '',
    nama: '',
    keterangan: '',
    nominal: '',
    faktor: ''
  });
  const [fileName, setFileName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterFactor, setFilterFactor] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);
  const [filterLayanan, setFilterLayanan] = useState('ALL');
  const [activeSubTab, setActiveSubTab] = useState('dashboard');
  const [isMappingLoading, setIsMappingLoading] = useState(false);
  
  // API Key state dengan status visual pembeda
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('sak_gemini_key') || DEFAULT_GEMINI_KEY);
  // 'default' | 'custom' | 'valid' | 'invalid' | 'quota'
  const [apiKeyStatus, setApiKeyStatus] = useState(() => {
    const saved = localStorage.getItem('sak_gemini_key');
    return (!saved || saved.trim() === '') ? 'empty' : 'custom';
  });
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem('sak_gemini_key') || '');
  const [showKeyPlain, setShowKeyPlain] = useState(false);

  // AI State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPatient, setAiPatient] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);
  const [manualClinicalText, setManualClinicalText] = useState('');
  const [showRiwayat, setShowRiwayat] = useState(false);

  // Selected Scatter Point Filter
  const [selectedDisputeReason, setSelectedDisputeReason] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [crosshair, setCrosshair] = useState(null);
  const svgRef = useRef(null);

  // Parse Excel file
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const allRows = [];
        let detectedHeaders = [];
        let detectedHeaderRowIndex = 0;
        
        wb.SheetNames.forEach((sheetName) => {
          const ws = wb.Sheets[sheetName];
          const sheetData = XLSX.utils.sheet_to_json(ws, { header: 1 });
          if (sheetData.length === 0) return;

          // Dynamically detect the header row index (bypass blank or title rows)
          let headerRowIndex = 0;
          for (let i = 0; i < Math.min(sheetData.length, 15); i++) {
            const row = sheetData[i];
            if (row && row.length > 0) {
              const rowText = row.map(cell => String(cell || '').toLowerCase()).join(' ');
              const hasSep = rowText.includes('sep') || rowText.includes('kartu') || rowText.includes('no_sep') || rowText.includes('nomor_sep');
              const hasNama = rowText.includes('nama') || rowText.includes('pasien') || rowText.includes('name') || rowText.includes('peserta');
              const hasNo = rowText.includes('no') || rowText.includes('nomor');
              const hasKet = rowText.includes('keterangan') || rowText.includes('alasan') || rowText.includes('dispute') || rowText.includes('pending') || rowText.includes('masalah');
              
              if ((hasSep && hasNama) || (hasSep && hasKet) || (hasNama && hasKet) || (hasSep && hasNo)) {
                headerRowIndex = i;
                break;
              }
            }
          }

          const sheetHeaders = sheetData[headerRowIndex].map(h => String(h || '').trim());
          if (detectedHeaders.length === 0) {
            detectedHeaders = sheetHeaders;
            detectedHeaderRowIndex = headerRowIndex;
          }

          // Determine Service Type
          const lowerSheet = sheetName.toLowerCase();
          let layanan = 'Rawat Jalan'; // Default
          if (lowerSheet.includes('ritl') || lowerSheet.includes('inap') || lowerSheet.includes('ri') || lowerSheet.includes('ranap') || lowerSheet.includes('opname')) {
            layanan = 'Rawat Inap';
          } else if (lowerSheet.includes('rjtl') || lowerSheet.includes('jalan') || lowerSheet.includes('rj') || lowerSheet.includes('rajal')) {
            layanan = 'Rawat Jalan';
          }

          // Map rows from this sheet starting after the detected header row
          sheetData.slice(headerRowIndex + 1).forEach(r => {
            // ensure it has content
            if (r.some(cell => cell !== null && cell !== undefined && cell !== '')) {
              allRows.push({
                rawRow: r,
                layanan: layanan
              });
            }
          });
        });

        if (allRows.length === 0) {
          alert('Berkas Excel kosong.');
          return;
        }

        setHeaders(detectedHeaders);

        // Auto-detect columns
        const mapping = { sep: '', nama: '', keterangan: '', nominal: '', faktor: '' };
        
        detectedHeaders.forEach(h => {
          const lh = h.toLowerCase();
          if (lh.includes('sep') || lh.includes('kartu') || lh.includes('no_sep') || lh.includes('nomor_sep') || lh.includes('no sep') || lh.includes('no. sep')) {
            if (!mapping.sep) mapping.sep = h;
          }
          if (lh.includes('nama') || lh.includes('pasien') || lh.includes('name') || lh.includes('peserta')) {
            if (!mapping.nama) mapping.nama = h;
          }
          if (lh.includes('masalah') || lh.includes('deskripsi') || lh.includes('keterangan') || lh.includes('pending') || lh.includes('alasan') || lh.includes('dispute') || lh.includes('reject') || lh.includes('sebab')) {
            if (!mapping.keterangan) mapping.keterangan = h;
          }
          if (lh.includes('tarif') || lh.includes('biaya') || lh.includes('nominal') || lh.includes('rupiah') || lh.includes('klaim') || lh.includes('amount') || lh.includes('selisih') || lh.includes('nilai')) {
            if (!mapping.nominal) mapping.nominal = h;
          }
          if (lh.includes('faktor') || lh.includes('penyebab') || lh.includes('cause') || lh.includes('root')) {
            if (!mapping.faktor) mapping.faktor = h;
          }
        });

        // Set mapping state with precise and intelligent fallbacks
        setColumnMapping({
          sep: mapping.sep || detectedHeaders.find(h => h.toLowerCase().includes('sep') && !h.toLowerCase().includes('cbg')) || detectedHeaders.find(h => !h.toLowerCase().includes('cbg') && !h.toLowerCase().includes('inacbg') && !h.toLowerCase().includes('code') && !h.toLowerCase().includes('nama')) || detectedHeaders[0] || '',
          nama: mapping.nama || detectedHeaders.find(h => h.toLowerCase().includes('nama')) || detectedHeaders[1] || '',
          keterangan: mapping.keterangan || detectedHeaders.find(h => h.toLowerCase().includes('keterangan') || h.toLowerCase().includes('alasan') || h.toLowerCase().includes('dispute')) || detectedHeaders[2] || '',
          nominal: mapping.nominal || detectedHeaders.find(h => h.toLowerCase().includes('nominal') || h.toLowerCase().includes('tarif') || h.toLowerCase().includes('biaya')) || detectedHeaders[3] || '',
          faktor: mapping.faktor || ''
        });

        // Store temporary raw rows
        setFileData(allRows);
        setShowMappingModal(true);
      } catch (err) {
        console.error(err);
        alert('Gagal membaca berkas Excel. Pastikan formatnya benar.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Process rows once mapping is confirmed
  const [processedClaims, setProcessedClaims] = useState([]);
  const confirmMapping = () => {
    setIsMappingLoading(true);

    setTimeout(() => {
      const sepIdx = headers.indexOf(columnMapping.sep);
      const namaIdx = headers.indexOf(columnMapping.nama);
      const ketIdx = headers.indexOf(columnMapping.keterangan);
      const nomIdx = headers.indexOf(columnMapping.nominal);
      const fakIdx = headers.indexOf(columnMapping.faktor);

      const list = fileData.map((item, idx) => {
        const row = item.rawRow;
        const layanan = item.layanan;
        const sep = String(row[sepIdx] || '').trim();
        const nama = String(row[namaIdx] || '').trim();
        let keterangan = String(row[ketIdx] || '').trim();
        if (!keterangan || keterangan === '-') {
          keterangan = 'Alasan Pending Tidak Terinci';
        }
        const rawNom = String(row[nomIdx] || '0').replace(/[^0-9.-]/g, '');
        const nominal = parseFloat(rawNom) || 0;

        // 1. Cross-reference with main clinical dataset if SEP matches
        let matchedPatient = null;
        if (sep && mainDataset.length > 0) {
          matchedPatient = mainDataset.find(p => {
            const pSep = String(p.SEP || p.NO_SEP || p.no_sep || '').trim();
            return pSep !== '' && pSep === sep;
          });
        }

        // Determine KSM & SMF details using main dataset or fallback
        let ksm = '-';
        let dept = '-';
        let diaglist = '-';
        let proclist = '-';
        let coderName = '-';

        if (matchedPatient) {
          diaglist = matchedPatient.DIAGNOSIS || matchedPatient.DIAGNOSIS_UTAMA || matchedPatient.DIAGNOSA || matchedPatient.DIAGLIST || '-';
          proclist = matchedPatient.PROSEDUR || matchedPatient.PROSEDUR_UTAMA || matchedPatient.TINDAKAN || matchedPatient.PROCLIST || '-';
          const rawCoder = matchedPatient.CODER_ID || matchedPatient.USER_CODER || matchedPatient.CODER || '-';
          coderName = maskName(String(rawCoder).split(';')[0].trim()) || '-';
          
          if (resolveKsmDept && matchedPatient.DPJP) {
            const res = resolveKsmDept(matchedPatient.DPJP);
            ksm = res.ksm || '-';
            dept = res.dept || '-';
          }
        }

        // 2. Keyword-based local pending reason categorization
        const kategori = [];
        let faktor = 'Eksternal BPJS';
        
        const lKet = keterangan.toLowerCase();
        // Category classification
        if (lKet.includes('koding') || lKet.includes('kode') || lKet.includes('icd') || lKet.includes('diagnose') || lKet.includes('diagnosis') || lKet.includes('procedure') || lKet.includes('prosedur') || lKet.includes('tindakan')) {
          kategori.push('Koding');
        }
        if (lKet.includes('admin') || lKet.includes('administrasi') || lKet.includes('kartu') || lKet.includes('ktp') || lKet.includes('rujukan') || lKet.includes('surat') || lKet.includes('kelengkapan') || lKet.includes('berkas') || lKet.includes('sep')) {
          kategori.push('Administrasi');
        }
        if (lKet.includes('readmisi') || lKet.includes('rawat kembali') || lKet.includes('pulang') || lKet.includes('kontrol')) {
          kategori.push('Readmisi');
        }
        if (lKet.includes('medis') || lKet.includes('klinis') || lKet.includes('indikasi') || lKet.includes('terapi') || lKet.includes('dpjp') || lKet.includes('dokter') || lKet.includes('pemeriksaan') || lKet.includes('lab') || lKet.includes('rontgen') || kategori.length === 0) {
          kategori.push('Medis');
        }

        // Factor classification from Excel or fallback keyword-based with default
        let gotFaktorFromExcel = false;
        if (fakIdx !== -1) {
          const rawFaktor = String(row[fakIdx] || '').trim();
          if (rawFaktor) {
            const lower = rawFaktor.toLowerCase();
            if (lower.includes('internal')) {
              faktor = 'Internal RS';
              gotFaktorFromExcel = true;
            } else if (lower.includes('eksternal') || lower.includes('bpjs')) {
              faktor = 'Eksternal BPJS';
              gotFaktorFromExcel = true;
            } else if (lower.includes('grey') || lower.includes('abu') || lower.includes('gray')) {
              faktor = 'Grey Area';
              gotFaktorFromExcel = true;
            }
          }
        }

        if (!gotFaktorFromExcel) {
          if (lKet.includes('koding') || lKet.includes('berkas') || lKet.includes('lengkap') || lKet.includes('kelengkapan') || lKet.includes('input') || lKet.includes('laporan') || lKet.includes('double') || lKet.includes('ganda') || lKet.includes('resume') || lKet.includes('ttd') || lKet.includes('rekam medis')) {
            faktor = 'Internal RS';
          } else if (lKet.includes('kepesertaan') || lKet.includes('aktif') || lKet.includes('denda') || lKet.includes('faskes') || lKet.includes('rujukan tidak') || lKet.includes('sistem down') || lKet.includes('e-claim') || lKet.includes('kemoterapi')) {
            faktor = 'Eksternal BPJS';
          } else if (lKet.includes('grey') || lKet.includes('abu-abu') || lKet.includes('gray')) {
            faktor = 'Grey Area';
          } else {
            faktor = 'Eksternal BPJS'; // Default fallback
          }
        }

        // 3. Generate instant response suggestions based on category
        let saran = 'Konfirmasi rekam medis dengan dokter DPJP.';
        let rsBenar = 'Sesuai dengan rekam medis pasien terlampir bahwa koding sudah akurat.';
        let rsSalah = 'Kesediaan koding ulang sesuai arahan verifikator.';

        if (kategori.includes('Koding')) {
          saran = 'Periksa urutan diagnosis utama & diagnosis sekunder berdasarkan ICD-10.';
          rsBenar = 'Koding diagnosis utama sudah sesuai dengan resume medis klinis pasien terlampir.';
          rsSalah = 'Kami telah melakukan koding ulang diagnosis sesuai pedoman ICD-10.';
        } else if (kategori.includes('Administrasi')) {
          saran = 'Lengkapi surat rujukan, SEP, dan berkas administrasi penunjang.';
          rsBenar = 'Seluruh berkas administrasi pendukung yang diminta telah terlampir dengan lengkap.';
          rsSalah = 'Revisi berkas kepesertaan/administrasi yang tidak lengkap sedang diproses.';
        } else if (kategori.includes('Readmisi')) {
          saran = 'Audit Clinical Pathway lama hari rawat (LOS) & indikasi medis pulang.';
          rsBenar = 'Pasien dipulangkan karena kondisi medis sudah stabil dan rawat kembali disebabkan kegawatan baru.';
          rsSalah = 'Mengajukan penggabungan berkas klaim sesuai ketentuan readmisi.';
        }

        // Restore previous Gemini AI analysis from localStorage if available
        const cachedAnalysisStr = localStorage.getItem(`gemini_analysis_${sep}`);
        let aiSaran = '-';
        let aiRegulasi = '-';
        let aiSanggahan = '-';
        let aiReviewed = false;
        if (cachedAnalysisStr) {
          try {
            const cached = JSON.parse(cachedAnalysisStr);
            aiSaran = cached.saran_perbaikan || '-';
            aiRegulasi = cached.kutipan_regulasi || '-';
            aiSanggahan = cached.jawaban_sanggahan_rs || '-';
            aiReviewed = true;
          } catch(e) {}
        }

        return {
          id: idx,
          sep,
          nama,
          keterangan,
          nominal,
          kategori,
          faktor,
          matched: !!matchedPatient,
          dpjp: matchedPatient ? matchedPatient.DPJP : '-',
          ksm,
          dept,
          diaglist,
          proclist,
          coderName,
          saran,
          rsBenar,
          rsSalah,
          layanan,
          aiSaran,
          aiRegulasi,
          aiSanggahan,
          aiReviewed
        };
      }).filter(c => c.sep || c.keterangan);

      setProcessedClaims(list);
      setShowMappingModal(false);
      setIsMappingLoading(false);
    }, 400);
  };

  // Trigger copy actions
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Dynamically update factor of a claim in real-time
  const updateClaimFactor = (claimId, newFactor) => {
    setProcessedClaims(prev => prev.map(c => {
      if (c.id === claimId) {
        return { ...c, faktor: newFactor };
      }
      return c;
    }));
  };

  // Download Excel sheet with all claim details and AI analysis results
  const downloadExcelWithAnalysis = () => {
    if (processedClaims.length === 0) return;
    
    // Helper to map claims to exportable row structure
    const mapClaimToExportRow = (c, index) => {
      return {
        'No': index + 1,
        'Nomor SEP': c.sep || '-',
        'Nama Pasien': c.nama || '-',
        'Alasan Pending BPJS': c.keterangan || '-',
        'Nominal Pending (Rp)': c.nominal,
        'Kategori Masalah': Array.isArray(c.kategori) ? c.kategori.join(', ') : (c.kategori || '-'),
        'Faktor Penyebab (Root Cause)': c.faktor || '-',
        'DPJP KSM / SMF': c.ksm || '-',
        'DPJP Departemen': c.dept || '-',
        'Nama Coder': c.coderName || '-',
        'Ringkasan Diagnosis (iDRG)': c.diaglist || '-',
        'Ringkasan Prosedur (iDRG)': c.proclist || '-',
        'Saran Perbaikan Coder (Sistem)': c.saran || '-',
        'Saran Perbaikan (Gemini AI)': c.aiSaran || 'Belum diaudit AI',
        'Dasar Regulasi/Hukum (Gemini AI)': c.aiRegulasi || 'Belum diaudit AI',
        'Draft Jawaban Sanggahan RS (Gemini AI)': c.aiSanggahan || 'Belum diaudit AI',
        'Terjemahan Kode ICD (Gemini AI)': c.aiIcdTransl || 'Belum diaudit AI',
        'Status Integrasi iDRG': c.matched ? 'TERINTEGRASI' : 'TIDAK COCOK',
        'Status Review AI': c.aiReviewed ? 'SUDAH DIAUDIT' : 'BELUM DIAUDIT'
      };
    };

    // Partition claims
    const rjClaims = processedClaims.filter(c => c.layanan !== 'Rawat Inap');
    const riClaims = processedClaims.filter(c => c.layanan === 'Rawat Inap');

    const rjRows = rjClaims.map((c, i) => mapClaimToExportRow(c, i));
    const riRows = riClaims.map((c, i) => mapClaimToExportRow(c, i));

    try {
      const workbook = XLSX.utils.book_new();

      // Helper to auto-fit and append sheet
      const appendWorksheet = (rows, sheetName) => {
        const worksheet = XLSX.utils.json_to_sheet(rows);
        
        // Auto-fit column widths nicely
        const maxLens = {};
        rows.forEach(row => {
          Object.keys(row).forEach(key => {
            const valStr = String(row[key] || '');
            maxLens[key] = Math.max(maxLens[key] || 10, valStr.length);
          });
        });
        worksheet['!cols'] = Object.keys(maxLens).map(key => ({
          wch: Math.min(45, maxLens[key] + 3) // cap width at 45 to keep it readable
        }));

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      };

      // Append Rawat Jalan sheet
      if (rjRows.length > 0) {
        appendWorksheet(rjRows, 'RJTL');
      } else {
        appendWorksheet([{ 'Keterangan': 'Tidak ada data Rawat Jalan' }], 'RJTL');
      }

      // Append Rawat Inap sheet
      if (riRows.length > 0) {
        appendWorksheet(riRows, 'RITL');
      } else {
        appendWorksheet([{ 'Keterangan': 'Tidak ada data Rawat Inap' }], 'RITL');
      }

      // Generate clean filename
      const cleanName = fileName ? fileName.replace(/\.[^/.]+$/, "") : 'Laporan_Pending';
      const outputName = `${cleanName}_Teranalisis_iDRG.xlsx`;
      
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
      const link = document.createElement('a');
      link.href = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + wbout;
      link.download = outputName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor data Excel: ' + err.message);
    }
  };

  // Visual Statistics
  const stats = useMemo(() => {
    const total = processedClaims.length;
    if (total === 0) return null;

    let nominal = 0;
    let internal = 0;
    let eksternal = 0;
    let grey = 0;
    let medis = 0;
    let koding = 0;
    let admin = 0;
    let readmisi = 0;
    let matchedCount = 0;

    let rjCount = 0;
    let rjNominal = 0;
    let riCount = 0;
    let riNominal = 0;

    processedClaims.forEach(c => {
      nominal += c.nominal;
      if (c.faktor === 'Internal RS') internal++;
      else if (c.faktor === 'Eksternal BPJS') eksternal++;
      else grey++;

      if (Array.isArray(c.kategori)) {
        if (c.kategori.includes('Medis')) medis++;
        if (c.kategori.includes('Koding')) koding++;
        if (c.kategori.includes('Administrasi')) admin++;
        if (c.kategori.includes('Readmisi')) readmisi++;
      } else {
        if (c.kategori === 'Medis') medis++;
        else if (c.kategori === 'Koding') koding++;
        else if (c.kategori === 'Administrasi') admin++;
        else if (c.kategori === 'Readmisi') readmisi++;
      }

      if (c.matched) matchedCount++;

      if (c.layanan === 'Rawat Inap') {
        riCount++;
        riNominal += c.nominal;
      } else {
        rjCount++;
        rjNominal += c.nominal;
      }
    });

    return { 
      total, nominal, internal, eksternal, grey, medis, koding, admin, readmisi, matchedCount,
      rjCount, rjNominal, riCount, riNominal
    };
  }, [processedClaims]);

  // Priority Matrix Custom SVG Chart Data
  const scatterData = useMemo(() => {
    if (processedClaims.length === 0) return [];

    const activeClaims = processedClaims.filter(c => {
      const matchesLayanan = filterLayanan === 'ALL' || c.layanan === filterLayanan;
      const matchesCategory = filterCategory === 'ALL' || (Array.isArray(c.kategori) ? c.kategori.includes(filterCategory) : c.kategori === filterCategory);
      const matchesFactor = filterFactor === 'ALL' || c.faktor === filterFactor;
      return matchesLayanan && matchesCategory && matchesFactor;
    });

    // Group by Keterangan (Dispute Reason) to get frequency & nominal impact
    const grouped = {};
    activeClaims.forEach(c => {
      if (!grouped[c.keterangan]) {
        grouped[c.keterangan] = {
          label: c.keterangan,
          frequency: 0,
          totalNominal: 0,
          category: Array.isArray(c.kategori) ? c.kategori.join(', ') : c.kategori
        };
      }
      grouped[c.keterangan].frequency++;
      grouped[c.keterangan].totalNominal += c.nominal;
    });

    return Object.values(grouped);
  }, [processedClaims, filterLayanan, filterCategory, filterFactor]);

  // Filtered Claims
  const filteredClaims = useMemo(() => {
    return processedClaims.filter(c => {
      const matchesSearch = searchQuery === '' || 
        c.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.sep.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.ksm.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.coderName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = filterCategory === 'ALL' || (Array.isArray(c.kategori) ? c.kategori.includes(filterCategory) : c.kategori === filterCategory);
      const matchesFactor = filterFactor === 'ALL' || c.faktor === filterFactor;
      const matchesLayanan = filterLayanan === 'ALL' || c.layanan === filterLayanan;
      const matchesScatterPoint = !selectedDisputeReason || c.keterangan === selectedDisputeReason;

      return matchesSearch && matchesCategory && matchesFactor && matchesScatterPoint && matchesLayanan;
    });
  }, [processedClaims, searchQuery, filterCategory, filterFactor, filterLayanan, selectedDisputeReason]);

  // Top 10 Dispute Reasons grouped by clinical categories
  const top10Stats = useMemo(() => {
    if (processedClaims.length === 0) return { koding: [], medis: [], admin: [], readmisi: [] };

    const getTop10ForCategory = (catName) => {
      const catClaims = processedClaims.filter(c => Array.isArray(c.kategori) ? c.kategori.includes(catName) : c.kategori === catName);
      const grouped = {};
      catClaims.forEach(c => {
        if (!grouped[c.keterangan]) {
          grouped[c.keterangan] = {
            label: c.keterangan,
            frequency: 0,
            totalNominal: 0
          };
        }
        grouped[c.keterangan].frequency++;
        grouped[c.keterangan].totalNominal += c.nominal;
      });
      
      return Object.values(grouped)
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10);
    };

    return {
      koding: getTop10ForCategory('Koding'),
      medis: getTop10ForCategory('Medis'),
      admin: getTop10ForCategory('Administrasi'),
      readmisi: getTop10ForCategory('Readmisi')
    };
  }, [processedClaims]);

  // Open the AI analysis modal and automatically load cached results if available
  const openAiAnalysisModal = (claim) => {
    if (!claim) return;
    setAiPatient(claim);
    setManualClinicalText("");
    
    // Check if there is already a cached analysis for this claim in localStorage
    const cachedAnalysisStr = localStorage.getItem("gemini_analysis_" + claim.sep);
    if (cachedAnalysisStr) {
      try {
        const cached = JSON.parse(cachedAnalysisStr);
        setAiResponse({
          saran_perbaikan: cached.saran_perbaikan || claim.aiSaran || "-",
          kutipan_regulasi: cached.rutipan_regulasi || cached.kutipan_regulasi || claim.aiRegulasi || "-",
          jawaban_sanggahan_rs: cached.jawaban_sanggahan_rs || claim.aiSanggahan || "-",
          terjemahan_icd: cached.terjemahan_icd || claim.aiIcdTransl || ""
        });
        return;
      } catch (e) {
        console.error("Failed to parse cached analysis", e);
      }
    }
    
    // Fallback to claim properties if they exist
    if (claim.aiReviewed && claim.aiSaran) {
      setAiResponse({
        saran_perbaikan: claim.aiSaran || "-",
        kutipan_regulasi: claim.aiRegulasi || "-",
        jawaban_sanggahan_rs: claim.aiSanggahan || "-"
      });
    } else {
      setAiResponse(null);
    }
  };

  // Call Gemini AI for Clinical Auditing of Medical Record PDF text
  const analyzeWithGemini = async (claim) => {
    if (!claim) return;
    setIsAiLoading(true);
    setAiPatient(claim);
    setAiResponse(null);

    const key = geminiKey.trim() || DEFAULT_GEMINI_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

    const promptText = `
ACT AS: Kamu adalah seorang Ahli Koding Klinis (Clinical Coder) Senior, Verifikator Casemix, dan Praktisi INA-CBG tingkat lanjut di Indonesia. Kamu memiliki keahlian mendalam dalam audit klaim rumah sakit, Utilization Review, dan penyelesaian dispute atau pending klaim JKN.

TASK: Tugasmu adalah menganalisis kasus klaim JKN yang berstatus Pending dari BPJS Kesehatan, memverifikasi kesesuaian koding diagnosis dan prosedur, serta memberikan argumen sanggahan (jika koding RS sudah benar) atau rekomendasi perbaikan (jika terdapat coding error).

CONSTRAINT & REFERENCE RULES (WAJIB DIPATUHI):
Dalam memberikan analisis dan kesimpulan, kamu DILARANG menggunakan referensi medis umum atau versi ICD terbaru. Kamu WAJIB secara ketat merujuk dan melandaskan argumenmu HANYA pada:
- PMK No. 26 Tahun 2021 (Pedoman INA-CBG dalam Pelaksanaan Jaminan Kesehatan)
- PMK No. 3 Tahun 2023 (Standar Tarif Pelayanan Kesehatan dalam Penyelenggaraan Program JKN)
- Berita Acara Kesepakatan (BAK) Kemenkes dan BPJS Kesehatan yang relevan dengan kasus
- ICD-10 (WHO Edition, Tahun 2010) untuk validasi Rule of Morbidity (MB1-MB5) dan penentuan Diagnosis Utama/Sekunder
- ICD-9-CM (Tahun 2010) untuk validasi koding tindakan/prosedur
- PNPK (Pedoman Nasional Pelayanan Kedokteran) Terbaru yang relevan

DATA KLAIM YANG DIANALISIS:
1. Nomor SEP: ${claim.sep}
2. Nama Pasien: ${claim.nama}
3. Alasan Pending BPJS: ${claim.keterangan}
4. Kode Diagnosis Utama/Sekunder (ICD-10): ${claim.diaglist}
5. Kode Tindakan/Prosedur (ICD-9-CM): ${claim.proclist}
6. Catatan Resume Medis / Bukti Klinis Tambahan: ${manualClinicalText || 'Tidak ada catatan klinis tambahan. Analisis berdasarkan koding dan alasan pending saja.'}

Berikan jawaban audit komprehensif dalam format JSON berikut (HANYA JSON murni, tanpa markdown triple backticks):
{
  "saran_perbaikan": "Langkah konkret yang harus diambil coder/DPJP berdasarkan regulasi INA-CBG dan ICD-10/ICD-9-CM (maksimal 3 poin)",
  "kutipan_regulasi": "Dasar hukum spesifik dari PMK 26/2021, PMK 3/2023, BAK Kemenkes-BPJS, atau PNPK yang mendukung argumen RS (sebutkan pasal/klausul/halaman jika tersedia)",
  "jawaban_sanggahan_rs": "Draft naskah formal sanggahan kepada verifikator BPJS yang profesional, berbasis regulasi, logis secara klinis, dan berpotensi tinggi diterima. Sertakan dasar hukum yang dikutip."
}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('QUOTA_EXHAUSTED');
        }
        if (response.status === 403) {
          throw new Error('INVALID_API_KEY');
        }
        throw new Error(`API Error (${response.status})`);
      }

      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      
      // Clean JSON delimiters if returned
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      setAiResponse(parsed);

      // Save analysis back to specific claim state for Excel download
      setProcessedClaims(prev => prev.map(c => {
        if (c.id === claim.id) {
          // Keep in localStorage
          localStorage.setItem("gemini_analysis_" + c.sep, JSON.stringify({
            saran_perbaikan: parsed.saran_perbaikan || '-',
            rutipan_regulasi: parsed.kutipan_regulasi || '-',
            jawaban_sanggahan_rs: parsed.jawaban_sanggahan_rs || '-'
          }));

          return {
            ...c,
            aiSaran: parsed.saran_perbaikan || '-',
            aiRegulasi: parsed.kutipan_regulasi || '-',
            aiSanggahan: parsed.jawaban_sanggahan_rs || '-',
            aiReviewed: true
          };
        }
        return c;
      }));
      // Mark as valid on success
      setApiKeyStatus('valid');
    } catch (err) {
      console.error(err);
      if (err.message === 'QUOTA_EXHAUSTED' || String(err).includes('429') || String(err).includes('quota') || String(err).includes('exhausted')) {
        setApiKeyStatus('quota');
        setAiResponse({
          saran_perbaikan: '⚠️ KUOTA TOKEN GEMINI HABIS / TERCAPAI BATAS LIMIT (HTTP 429).',
          kutipan_regulasi: 'Peringatan Quota Limit: Penggunaan API Key Anda telah melampaui batas kuota gratis atau berbayar Google AI Studio.',
          jawaban_sanggahan_rs: 'Tindakan Direkomendasikan:\n1. Ganti API Key Gemini Anda di bagian kanan atas halaman.\n2. Dapatkan API Key gratis baru di Google AI Studio: https://aistudio.google.com/\n3. Tempel API Key baru, tekan ENTER atau klik tombol SIMPAN KEY.'
        });
        alert('⚠️ Kuota API Key Gemini Habis!\n\nSilakan ganti API Key Anda di bagian atas halaman.');
      } else if (err.message === 'INVALID_API_KEY' || String(err).includes('403') || String(err).includes('Forbidden')) {
        setApiKeyStatus('invalid');
        setAiResponse({
          saran_perbaikan: '⚠️ API KEY GEMINI TIDAK VALID / KUNCI TIDAK AKTIF (HTTP 403).',
          kutipan_regulasi: 'Kunci API Ditangguhkan oleh Google. Gunakan kunci pribadi dari Google AI Studio.',
          jawaban_sanggahan_rs: 'Tindakan:\n1. Masukkan API Key baru di kotak input atas.\n2. Dapatkan GRATIS dari: https://aistudio.google.com/\n3. Setelah diisi, tekan Enter atau klik SIMPAN KEY.'
        });
        alert('⚠️ API Key Tidak Valid (403)!\n\nSilakan masukkan API Key pribadi Anda yang aktif.');
      } else {
        setAiResponse({
          saran_perbaikan: 'Gagal menghubungi Gemini AI. Periksa koneksi internet dan API Key Anda.',
          kutipan_regulasi: 'PMK No. 26 Tahun 2021 / ICD-10 Pedoman Koding.',
          jawaban_sanggahan_rs: 'Terjadi kendala teknis. Pastikan koneksi internet aktif dan API Key valid.'
        });
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  // Custom SVG Scatter Chart variables
  const width = 800;
  const height = 350;
  const padding = { top: 40, right: 40, bottom: 50, left: 60 };

  const chartParams = useMemo(() => {
    if (scatterData.length === 0) return null;
    const maxFreq = Math.max(...scatterData.map(d => d.frequency)) || 1;
    const maxNom = Math.max(...scatterData.map(d => d.totalNominal)) || 1;

    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    const scaleX = (val) => padding.left + (val / maxNom) * innerW;
    const scaleY = (val) => height - padding.bottom - (val / maxFreq) * innerH;

    const avgFreq = scatterData.reduce((s, d) => s + d.frequency, 0) / scatterData.length || 0;
    const avgNom = scatterData.reduce((s, d) => s + d.totalNominal, 0) / scatterData.length || 0;

    return { maxFreq, maxNom, scaleX, scaleY, avgFreq, avgNom, innerW, innerH };
  }, [scatterData]);

  // Handle responsive interactive hover on SVG Scatter Plot
  const handleMouseMove = (e) => {
    if (!svgRef.current || !chartParams) return;

    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const viewBoxX = (mouseX / rect.width) * width;
    const viewBoxY = (mouseY / rect.height) * height;

    if (viewBoxX < padding.left || viewBoxX > width - padding.right || viewBoxY < padding.top || viewBoxY > height - padding.bottom) {
      setCrosshair(null);
      setHoveredPoint(null);
      return;
    }

    setCrosshair({ x: viewBoxX, y: viewBoxY });

    let closest = null;
    let minDistance = 25; // max radius trigger in viewBox px

    scatterData.forEach((d) => {
      const cx = chartParams.scaleX(d.totalNominal);
      const cy = chartParams.scaleY(d.frequency);

      const dx = viewBoxX - cx;
      const dy = viewBoxY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDistance) {
        minDistance = dist;
        closest = {
          x: cx,
          y: cy,
          data: d
        };
      }
    });

    setHoveredPoint(closest);
  };

  const handleMouseLeave = () => {
    setCrosshair(null);
    setHoveredPoint(null);
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-teal-800 via-teal-900 to-emerald-950 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex items-center gap-4.5 relative z-10">
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg shadow-teal-500/10 text-teal-400">
            <FileSpreadsheet size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Analisis Pending</h1>
            <p className="text-xs text-teal-200 font-bold uppercase tracking-wider mt-1">Audit, Klasifikasi, & Solusi Sanggahan BPJS Terintegrasi</p>
          </div>
        </div>

        {/* SETTINGS CONTROLS (API KEY & GOOGLE SHEETS SYNC) */}
        <div className="flex flex-col lg:flex-row gap-6 w-full md:w-auto relative z-10 shrink-0">
          
          {/* API Key settings panel - dengan visual pembeda status */}
          <div className="flex flex-col gap-2 w-full lg:w-auto">
            {/* Status Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '3px 10px',
              borderRadius: '999px',
              border: '1.5px solid',
              width: 'fit-content',
              alignSelf: 'flex-start',
              ...(apiKeyStatus === 'empty' ? { background: 'rgba(239,68,68,0.3)', borderColor: 'rgba(252,165,165,0.5)', color: '#fca5a5' } :
                 apiKeyStatus === 'custom' ? { background: 'rgba(59,130,246,0.25)', borderColor: 'rgba(96,165,250,0.5)', color: '#93c5fd' } :
                 apiKeyStatus === 'valid' ? { background: 'rgba(16,185,129,0.25)', borderColor: 'rgba(52,211,153,0.5)', color: '#6ee7b7' } :
                 apiKeyStatus === 'invalid' ? { background: 'rgba(239,68,68,0.25)', borderColor: 'rgba(252,165,165,0.5)', color: '#fca5a5' } :
                 apiKeyStatus === 'quota' ? { background: 'rgba(245,158,11,0.25)', borderColor: 'rgba(252,211,77,0.5)', color: '#fde68a' } :
                 { background: 'rgba(100,116,139,0.25)', borderColor: 'rgba(148,163,184,0.4)', color: '#94a3b8' })
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', display: 'inline-block',
                background: apiKeyStatus === 'empty' ? '#f87171' :
                            apiKeyStatus === 'custom' ? '#60a5fa' :
                            apiKeyStatus === 'valid' ? '#34d399' :
                            apiKeyStatus === 'invalid' ? '#f87171' :
                            apiKeyStatus === 'quota' ? '#fbbf24' : '#94a3b8'
              }} />
              {apiKeyStatus === 'default' ? '🔑 API Key: Default (Bawaan)' :
               apiKeyStatus === 'custom' ? '🔵 API Key: Kustom (Belum Terverifikasi)' :
               apiKeyStatus === 'valid' ? '✅ API Key: Aktif & Valid' :
               apiKeyStatus === 'invalid' ? '❌ API Key: Tidak Valid (403)' :
               apiKeyStatus === 'quota' ? '⚠️ API Key: Kuota Habis (429)' : '🔑 API Key: Default'}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px',
                background: apiKeyStatus === 'invalid' ? 'rgba(239,68,68,0.2)' :
                            apiKeyStatus === 'quota' ? 'rgba(245,158,11,0.2)' :
                            apiKeyStatus === 'valid' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(8px)',
                padding: '8px 12px',
                borderRadius: '12px',
                border: apiKeyStatus === 'invalid' ? '1px solid rgba(239,68,68,0.4)' :
                        apiKeyStatus === 'quota' ? '1px solid rgba(245,158,11,0.4)' :
                        apiKeyStatus === 'valid' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.3s'
              }}>
                <Brain size={16} style={{ color: apiKeyStatus === 'valid' ? '#6ee7b7' : '#5eead4', flexShrink: 0 }} />
                <input 
                  type={showKeyPlain ? 'text' : 'password'}
                  placeholder="Masukkan Gemini API Key..."
                  value={apiKeyInput}
                  onChange={(e) => {
                    setApiKeyInput(e.target.value);
                    setApiKeyStatus(e.target.value.trim() === '' ? 'empty' : 'custom');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const newKey = apiKeyInput.trim();
                      if (newKey) {
                        setGeminiKey(newKey);
                        localStorage.setItem('sak_gemini_key', newKey);
                        setApiKeyStatus('custom');
                        alert('🔑 API Key Gemini berhasil disimpan secara lokal!');
                      } else {
                        alert('⚠️ Harap masukkan API Key Gemini yang valid!');
                      }
                    }
                  }}
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '11px', color: 'white', width: '150px', fontFamily: 'monospace', fontWeight: '700' }}
                />
                <button onClick={() => setShowKeyPlain(p => !p)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0', fontSize: '11px' }} title={showKeyPlain ? 'Sembunyikan' : 'Tampilkan'}>
                  {showKeyPlain ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Tombol SIMPAN KEY */}
              <button 
                onClick={() => {
                  const newKey = apiKeyInput.trim();
                  if (newKey) {
                    setGeminiKey(newKey);
                    localStorage.setItem("sak_gemini_key", newKey);
                    setApiKeyStatus("custom");
                    alert("🔑 API Key Gemini berhasil disimpan secara lokal!");
                  } else {
                    alert("⚠️ Harap masukkan API Key Gemini yang valid terlebih dahulu!");
                  }
                }}
                style={{ padding: "8px 14px", background: "rgba(16,185,129,0.25)", border: "1px solid rgba(52,211,153,0.4)", borderRadius: "10px", color: "#6ee7b7", fontSize: "10px", fontWeight: "800", textTransform: "uppercase", cursor: "pointer", letterSpacing: "0.05em", whiteSpace: "nowrap", transition: "all 0.2s" }}
                onMouseEnter={e => e.target.style.background = "rgba(16,185,129,0.4)"}
                onMouseLeave={e => e.target.style.background = "rgba(16,185,129,0.25)"}
                title="Simpan API Key"
              >
                💾 Simpan
              </button>

              {/* Tombol Reset ke Default */}
              <button 
                onClick={() => {
                  setApiKeyInput("");
                  setGeminiKey("");
                  localStorage.removeItem("sak_gemini_key");
                  setApiKeyStatus("empty");
                  alert("🔄 API Key berhasil di-reset menjadi kosong (default).");
                }}
                style={{ padding: "8px 10px", background: "rgba(100,116,139,0.25)", border: "1px solid rgba(148,163,184,0.3)", borderRadius: "10px", color: "#94a3b8", fontSize: "10px", fontWeight: "800", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "4px" }}
                title="Reset ke API Key Default"
              >
                <RefreshCw size={13} /> Default
              </button>
            </div>
          </div>

          {/* Google Sheets ICD Panel - Read Only Status Badge inside Pending Dashboard */}
          <div className="flex flex-col gap-2 w-full lg:w-auto">
            {/* Status Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '3px 10px',
              borderRadius: '999px',
              border: '1.5px solid',
              width: 'fit-content',
              alignSelf: 'flex-start',
              ...(Object.keys(customIcdMap).length > 0
                 ? { background: 'rgba(16,185,129,0.25)', borderColor: 'rgba(52,211,153,0.5)', color: '#6ee7b7' }
                 : { background: 'rgba(239,68,68,0.25)', borderColor: 'rgba(252,165,165,0.5)', color: '#fca5a5' })
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', display: 'inline-block',
                background: Object.keys(customIcdMap).length > 0 ? '#34d399' : '#f87171'
              }} />
              {Object.keys(customIcdMap).length > 0
                 ? `📊 Kamus Aktif (${Object.keys(customIcdMap).length.toLocaleString()} Kode)`
                 : '⚪ Kamus Lokal Standar'}
            </div>
            
            <div className="text-[10px] text-teal-200/70 font-semibold max-w-[200px] leading-relaxed">
              Pengaturan kamus dan sinkronisasi otomatis kini berada di menu utama <b>Kamus ICD</b>.
            </div>
          </div>

        </div>
      </div>

      {/* DRAG AND DROP UPLOAD CONTAINER */}
      {processedClaims.length === 0 && (
        <Card className="p-16 border-2 border-dashed border-slate-200 text-center hover:border-teal-500 hover:shadow-lg transition-all rounded-[2.5rem] bg-white flex flex-col items-center justify-center max-w-3xl mx-auto">
          <div className="w-20 h-20 bg-teal-50 rounded-3xl flex items-center justify-center mb-6 text-teal-600 shadow-inner">
            <Upload size={36} />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Unggah Berkas Pending BPJS</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed font-medium">
            Seret & taruh berkas Excel (.xlsx, .xls) atau CSV laporan pending BPJS Anda ke sini, atau klik tombol di bawah untuk memilih file.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <label className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3.5 rounded-2xl font-black text-xs transition-all shadow-lg shadow-teal-600/20 cursor-pointer uppercase tracking-widest flex items-center gap-2">
              <FileSpreadsheet size={16} /> Pilih File Excel/CSV
              <input type="file" onChange={handleFileUpload} accept=".xlsx,.xls,.csv" className="hidden" />
            </label>
          </div>
          <div className="mt-8 flex items-center gap-2 text-[10px] text-slate-400 bg-slate-50 border px-4 py-2 rounded-xl">
            <Info size={14} className="text-teal-500" />
            <span>Format kolom fleksibel! Sistem memiliki pemetaan kolom interaktif jika format Anda berbeda.</span>
          </div>
        </Card>
      )}

      {/* DASHBOARD ANALYSIS */}
      {processedClaims.length > 0 && stats && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* SUB-TABS SELECTOR */}
          <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm print:hidden">
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveSubTab('dashboard')}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeSubTab === 'dashboard' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Sparkles size={14} /> Dashboard Kerja
              </button>
              <button 
                onClick={() => setActiveSubTab('report')}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeSubTab === 'report' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <FileText size={14} /> Laporan Eksekutif & Cetak
              </button>
            </div>
            {activeSubTab === 'report' && (
              <button 
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-600/10 flex items-center gap-1.5"
              >
                <Download size={14} /> Cetak Laporan (Print)
              </button>
            )}
          </div>

          {activeSubTab === 'dashboard' && (
            <>
              {/* METRICS ROW */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              title="Total Kasus Pending" 
              value={stats.total} 
              subtitle={`${stats.rjCount} Rawat Jalan | ${stats.riCount} Rawat Inap`} 
              color="teal" 
              icon={FileSpreadsheet} 
              onClick={() => {
                if (openDrilldown && stats.total > 0) {
                  openDrilldown(
                    'Seluruh Kasus Pending',
                    () => true,
                    'pending_sakti',
                    processedClaims
                  );
                }
              }}
            />
            <MetricCard 
              title="Nilai Klaim Pending" 
              value={formatRp(stats.nominal)} 
              subtitle={`${formatRp(stats.rjNominal)} RJ | ${formatRp(stats.riNominal)} RI`} 
              color="emerald" 
              icon={Download} 
              onClick={() => {
                if (openDrilldown && stats.total > 0) {
                  openDrilldown(
                    'Seluruh Kasus Pending',
                    () => true,
                    'pending_sakti',
                    processedClaims
                  );
                }
              }}
            />
            <MetricCard 
              title="Penyebab Internal RS" 
              value={`${stats.internal} kasus`} 
              subtitle={`${((stats.internal / stats.total) * 100).toFixed(0)}% Sistemik`} 
              color="amber" 
              icon={AlertTriangle} 
              onClick={() => {
                if (openDrilldown && stats.internal > 0) {
                  openDrilldown(
                    'Pasien Pending - Penyebab Internal RS',
                    c => c.faktor === 'Internal RS',
                    'pending_sakti',
                    processedClaims
                  );
                }
              }}
            />
            <MetricCard 
              title="Pasien Terintegrasi" 
              value={`${stats.matchedCount} Kasus`} 
              subtitle="SEP Cocok di iDRG" 
              color="indigo" 
              icon={UserCheck} 
              onClick={() => {
                if (openDrilldown && stats.matchedCount > 0) {
                  openDrilldown(
                    'Pasien Pending Terintegrasi iDRG',
                    c => c.matched === true,
                    'pending_sakti',
                    processedClaims
                  );
                }
              }}
            />
          </div>

          {/* PRIORITY MATRIX PLOT (FULL WIDTH) */}
          <Card id="priority-matrix-card" downloadTitle="Matriks Prioritas Masalah Pending" className="p-6 flex flex-col gap-5 bg-white border border-slate-200 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4 border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Sparkles size={18} className="text-teal-600 animate-pulse" /> Matriks Prioritas Masalah Pending
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Analisis korelasi nominal biaya pending terhadap frekuensi masalah. Klik titik untuk memfilter alasan pending.</p>
              </div>
              {selectedDisputeReason && (
                <button 
                  onClick={() => setSelectedDisputeReason(null)}
                  className="text-xs font-black text-teal-600 hover:text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100 transition-colors print:hidden"
                >
                  Reset Filter Titik
                </button>
              )}
            </div>

            {chartParams ? (
              <div className="relative">
                {/* Floating Tooltip Overlay */}
                {hoveredPoint && (
                  <div 
                    className="absolute z-40 bg-slate-950/95 backdrop-blur-md text-white border border-slate-700/80 p-3 rounded-xl shadow-2xl pointer-events-none text-left w-56 transition-all duration-75 ease-out select-none"
                    style={{ 
                      left: `${hoveredPoint.x}px`, 
                      top: `${hoveredPoint.y}px`,
                      transform: 'translate(-50%, -108%)'
                    }}
                  >
                    {/* Arrow indicator pointing to circle */}
                    <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-950 border-r border-b border-slate-700/80 transform rotate-45"></div>
                    
                    <div className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-1.5 flex justify-between">
                      <span>{hoveredPoint.data.category}</span>
                      <span></span>
                    </div>
                    <div className="text-[11px] font-extrabold line-clamp-2 text-slate-100 leading-tight mb-2 border-b border-slate-800 pb-2">{hoveredPoint.data.label}</div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-medium text-slate-400">
                      <span>Kasus:</span>
                      <span className="font-extrabold text-white text-right">{hoveredPoint.data.frequency}x</span>
                      <span>Estimasi:</span>
                      <span className="font-extrabold text-emerald-400 text-right">{formatRp(hoveredPoint.data.totalNominal)}</span>
                      <span>Avg/Kasus:</span>
                      <span className="font-extrabold text-white text-right">{formatRp(Math.round(hoveredPoint.data.totalNominal / hoveredPoint.data.frequency))}</span>
                    </div>
                  </div>
                )}

                {/* Toolbar Panel Overlay */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 bg-white/90 backdrop-blur-sm border border-slate-200/80 p-1 rounded-lg shadow-md z-30 select-none">
                  <button className="p-1 rounded-md bg-teal-50 text-teal-600 border border-teal-100 transition-colors" title="Pan Tool (Active)">
                    <Move size={13} />
                  </button>
                  <button className="p-1 rounded-md text-slate-400 hover:bg-slate-100 transition-colors" title="Box Zoom Tool">
                    <Search size={13} />
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedDisputeReason(null);
                      setCrosshair(null);
                      setHoveredPoint(null);
                    }} 
                    className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition-colors" 
                    title="Reset View"
                  >
                    <RefreshCw size={13} />
                  </button>
                  <button 
                    onClick={() => alert('Matriks Prioritas:\n1. Arahkan kursor ke gelembung untuk melihat ulasan instan, jumlah kasus, dan dampak finansial.\n2. Klik gelembung untuk memfilter tabel kasus di bawah berdasarkan alasan pending tertentu.\n3. Gelembung di Zona Merah (kanan atas) memiliki dampak finansial tinggi dan frekuensi tinggi. Prioritaskan ini!')} 
                    className="p-1 rounded-md text-slate-400 hover:bg-slate-100 transition-colors" 
                    title="Bantuan"
                  >
                      <HelpCircle size={13} />
                    </button>
                  </div>

                  <svg 
                    ref={svgRef}
                    viewBox={`0 0 ${width} ${height}`} 
                    className="w-full h-auto bg-white select-none rounded-2xl border border-slate-100 shadow-inner" 
                    xmlns="http://www.w3.org/2000/svg"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Quadrant Background Shading */}
                    <rect x={padding.left} y={padding.top} width={chartParams.innerW / 2} height={chartParams.scaleY(chartParams.avgFreq) - padding.top} fill="#ecfdf5" opacity="0.3" /> {/* Top-Left: Sistemik (Amber) */}
                    <rect x={padding.left + chartParams.innerW / 2} y={padding.top} width={chartParams.innerW / 2} height={chartParams.scaleY(chartParams.avgFreq) - padding.top} fill="#fef2f2" opacity="0.35" /> {/* Top-Right: Prioritas Utama (Red) */}
                    <rect x={padding.left} y={chartParams.scaleY(chartParams.avgFreq)} width={chartParams.innerW / 2} height={height - padding.bottom - chartParams.scaleY(chartParams.avgFreq)} fill="#f8fafc" opacity="0.4" /> {/* Bottom-Left: Monitoring (Grey) */}
                    <rect x={padding.left + chartParams.innerW / 2} y={chartParams.scaleY(chartParams.avgFreq)} width={chartParams.innerW / 2} height={height - padding.bottom - chartParams.scaleY(chartParams.avgFreq)} fill="#eff6ff" opacity="0.35" /> {/* Bottom-Right: High Impact (Indigo) */}

                    {/* Chart Axes */}
                    <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#cbd5e1" strokeWidth="1.5" />

                    {/* Average lines (BEP style boundaries) */}
                    <line x1={chartParams.scaleX(chartParams.avgNom)} y1={padding.top} x2={chartParams.scaleX(chartParams.avgNom)} y2={height - padding.bottom} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1={padding.left} y1={chartParams.scaleY(chartParams.avgFreq)} x2={width - padding.right} y2={chartParams.scaleY(chartParams.avgFreq)} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />

                    {/* Crosshair Grids */}
                    {crosshair && (
                      <g pointerEvents="none">
                        <line 
                          x1={padding.left} 
                          y1={crosshair.y} 
                          x2={width - padding.right} 
                          y2={crosshair.y} 
                          stroke="#64748b" 
                          strokeWidth="0.8" 
                          strokeDasharray="2 2" 
                          opacity="0.6"
                        />
                        <line 
                          x1={crosshair.x} 
                          y1={padding.top} 
                          x2={crosshair.x} 
                          y2={height - padding.bottom} 
                          stroke="#64748b" 
                          strokeWidth="0.8" 
                          strokeDasharray="2 2" 
                          opacity="0.6"
                        />
                      </g>
                    )}

                    {/* Zone Labels */}
                    <text x={padding.left + chartParams.innerW * 0.25} y={padding.top + 18} fontSize="9" fill="#d97706" fontWeight="black" textAnchor="middle" letterSpacing="1">ZONA II (SISTEMIK)</text>
                    <text x={padding.left + chartParams.innerW * 0.75} y={padding.top + 18} fontSize="9" fill="#dc2626" fontWeight="black" textAnchor="middle" letterSpacing="1">ZONA I (PRIORITAS UTAMA)</text>
                    <text x={padding.left + chartParams.innerW * 0.25} y={height - padding.bottom - 12} fontSize="9" fill="#64748b" fontWeight="black" textAnchor="middle" letterSpacing="1">ZONA IV (MONITORING)</text>
                    <text x={padding.left + chartParams.innerW * 0.75} y={height - padding.bottom - 12} fontSize="9" fill="#2563eb" fontWeight="black" textAnchor="middle" letterSpacing="1">ZONA III (HIGH IMPACT)</text>

                    {/* Axis Labels */}
                    <text x={width / 2} y={height - 12} fontSize="10" fontWeight="extrabold" fill="#475569" textAnchor="middle">Dampak Finansial (Total Nominal Pending per Masalah)</text>
                    <text x={15} y={height / 2} fontSize="10" fontWeight="extrabold" fill="#475569" textAnchor="middle" transform={`rotate(-90 15 ${height / 2})`}>Frekuensi Kejadian (Jumlah Kasus)</text>

                    {/* Scatter Dots */}
                    {scatterData.map((d, i) => {
                      const x = chartParams.scaleX(d.totalNominal);
                      const y = chartParams.scaleY(d.frequency);
                      const isSelected = selectedDisputeReason === d.label;

                      // Color based on Quadrant
                      let color = '#94a3b8';
                      if (d.totalNominal >= chartParams.avgNom) {
                        color = d.frequency >= chartParams.avgFreq ? '#ef4444' : '#2563eb';
                      } else {
                        color = d.frequency >= chartParams.avgFreq ? '#f59e0b' : '#64748b';
                      }

                      return (
                        <g 
                          key={i} 
                          className="cursor-pointer" 
                          onClick={() => setSelectedDisputeReason(isSelected ? null : d.label)}
                          onMouseEnter={(e) => {
                            if (!svgRef.current) return;
                            const rect = svgRef.current.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const clickY = e.clientY - rect.top;
                            setHoveredPoint({
                              data: d,
                              x: clickX,
                              y: clickY - 8
                            });
                          }}
                          onMouseLeave={() => setHoveredPoint(null)}
                        >
                          <circle 
                            cx={x} 
                            cy={y} 
                            r={isSelected ? 11 : 8} 
                            fill={color} 
                            fillOpacity={isSelected ? 0.95 : 0.7} 
                            stroke="#fff" 
                            strokeWidth={isSelected ? 3.5 : 1.8} 
                            className="transition-all duration-150 hover:fill-opacity-100 hover:stroke-[3.5px] hover:stroke-teal-400"
                          />
                          {/* Circle Pulse for Selected */}
                          {isSelected && (
                            <circle 
                              cx={x} 
                              cy={y} 
                              r={16} 
                              fill="none" 
                              stroke={color} 
                              strokeWidth="1" 
                              strokeDasharray="2 2"
                              className="animate-spin"
                              style={{ transformOrigin: `${x}px ${y}px`, animationDuration: '4s' }}
                            />
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400 font-bold">Menyiapkan grafik prioritas...</div>
              )}
            </Card>

            {/* DUAL CHARTS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              
              {/* KELOMPOK KASUS DISPUTE */}
              <Card id="case-groups-card" downloadTitle="Kelompok Kasus Pending" className="p-6 bg-white border border-slate-200 flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="border-b pb-4 border-slate-100">
                    <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <Info size={18} className="text-teal-600" /> Kelompok Kasus Pending (Case Groups)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Sebaran kelompok kasus pending berdasarkan kriteria audit BPJS & internal RS.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold border-b pb-2">
                      <span className="text-slate-400 uppercase">Kelompok Kasus</span>
                      <span className="text-slate-600">Frekuensi</span>
                    </div>
                    <CategoryBar label="Koding Medis / Aturan ICD" count={stats.koding} total={stats.total} color="bg-rose-500" />
                    <CategoryBar label="Administrasi / Berkas" count={stats.admin} total={stats.total} color="bg-amber-500" />
                    <CategoryBar label="Readmisi / Clinical Pathway" count={stats.readmisi} total={stats.total} color="bg-teal-500" />
                    <CategoryBar label="Indikasi Medis Klinis" count={stats.medis} total={stats.total} color="bg-sky-500" />
                  </div>
                </div>
              </Card>

              {/* FAKTOR PENYEBAB & INTEGRASI */}
              <Card id="root-cause-card" downloadTitle="Faktor Penyebab dan Aksi Integrasi" className="p-6 bg-white border border-slate-200 flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="border-b pb-4 border-slate-100">
                    <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <ShieldCheck size={18} className="text-teal-600" /> Faktor Penyebab &amp; Aksi Integrasi
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Analisis akar masalah (root cause) dan kontrol manajemen data pending.</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold border-b pb-2">
                      <span className="text-slate-400 uppercase">Faktor Penyebab (Root Cause)</span>
                      <span className="text-slate-600 font-medium text-[10px]">Klik bar untuk filter</span>
                    </div>
                    <RootCauseChart 
                      stats={stats} 
                      onBarClick={(fac) => {
                        setFilterFactor(fac === filterFactor ? 'ALL' : fac);
                      }} 
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-6 flex flex-col gap-3">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-500" /> Integrasi SMF SAK-iDRG
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
                    Modul ini secara otomatis mencocokkan kode SEP Anda dengan dataset audit klinis SAK-iDRG untuk menarik data **DPJP, SMF/KSM, Coder Coder, dan Ringkasan Diagnosis/Prosedur** secara *real-time*.
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setProcessedClaims([]);
                        setFileData([]);
                        setSelectedDisputeReason(null);
                      }}
                      className="flex-1 text-center py-2.5 bg-white border hover:bg-slate-50 text-rose-600 text-xs font-black rounded-xl transition-all uppercase tracking-wider shadow-sm"
                    >
                      Bersihkan Data
                    </button>
                    <label className="flex-1 text-center py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl transition-all uppercase tracking-wider shadow-md shadow-teal-600/10 cursor-pointer">
                      Unggah Baru
                      <input type="file" onChange={handleFileUpload} accept=".xlsx,.xls,.csv" className="hidden" />
                    </label>
                  </div>
                </div>
              </Card>
            </div>

          {/* PATIENT CLAIMS DETAIL TABLE */}
          <Card className="overflow-hidden bg-white border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <FileText size={18} className="text-teal-600" /> Daftar Kasus Pending BPJS
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Seluruh detail klaim pending dengan opsi draft naskah tanggapan sanggahan.</p>
              </div>

              {/* SEARCH & FILTERS */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <input
                    type="text"
                    placeholder="Cari pasien, SEP, koder..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 border rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full sm:w-64 bg-slate-50/50"
                  />
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                
                <select 
                  value={filterLayanan} 
                  onChange={(e) => setFilterLayanan(e.target.value)}
                  className="px-3.5 py-2 border rounded-xl text-xs font-bold outline-none bg-white cursor-pointer"
                >
                  <option value="ALL">Semua Layanan</option>
                  <option value="Rawat Jalan">Rawat Jalan (RJ)</option>
                  <option value="Rawat Inap">Rawat Inap (RI)</option>
                </select>

                <select 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3.5 py-2 border rounded-xl text-xs font-bold outline-none bg-white cursor-pointer"
                >
                  <option value="ALL">Semua Kategori</option>
                  <option value="Medis">Medis</option>
                  <option value="Koding">Koding</option>
                  <option value="Administrasi">Administrasi</option>
                  <option value="Readmisi">Readmisi</option>
                </select>

                <select 
                  value={filterFactor} 
                  onChange={(e) => setFilterFactor(e.target.value)}
                  className="px-3.5 py-2 border rounded-xl text-xs font-bold outline-none bg-white cursor-pointer"
                >
                  <option value="ALL">Semua Faktor</option>
                  <option value="Internal RS">Internal RS</option>
                  <option value="Eksternal BPJS">Eksternal BPJS</option>
                  <option value="Grey Area">Grey Area</option>
                </select>

                <button
                  onClick={downloadExcelWithAnalysis}
                  className="px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-teal-600/10 flex items-center gap-1.5 shrink-0"
                  title="Unduh Hasil Pemetaan & Analisis Gemini AI ke Excel"
                >
                  <Download size={14} /> Unduh Hasil (.xlsx)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="sticky top-0 bg-slate-900 text-white z-20 text-[10px] font-black uppercase tracking-wider text-center">
                  <tr>
                    <th className="p-4 text-center w-8">No</th>
                    <th className="p-4 text-left min-w-[130px]">Pasien / SEP</th>
                    <th className="p-4 text-left min-w-[200px]">Alasan Pending BPJS</th>
                    <th className="p-4 text-right min-w-[100px]">Nominal Klaim</th>
                    <th className="p-4 text-center min-w-[80px]">Status Integrasi</th>
                    <th className="p-4 text-center min-w-[120px]">Faktor Penyebab</th>
                    <th className="p-4 text-left min-w-[120px]">SMF / KSM</th>
                    <th className="p-4 text-left min-w-[100px]">Coder Coder</th>
                    <th className="p-4 min-w-[140px]">Solusi &amp; Sanggahan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClaims.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-16 text-center text-slate-400 font-bold bg-slate-50/50">
                        Tidak ada berkas klaim pending yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredClaims.map((c, i) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4 text-center font-bold text-slate-400">{i + 1}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {c.matched ? (
                                <button 
                                  onClick={() => {
                                    if (openDrilldown) {
                                      openDrilldown(
                                        `Detail Pasien: ${c.nama} (${c.sep})`,
                                        row => String(row.sep || row.SEP || row.NO_SEP || row.no_sep || '').trim() === String(c.sep).trim(),
                                        'pending_sakti',
                                        processedClaims
                                      );
                                    }
                                  }}
                                  className="font-extrabold text-slate-800 hover:text-teal-600 cursor-pointer transition-colors flex items-center gap-1 text-left bg-transparent border-none p-0 outline-none"
                                  title="Klik untuk melihat Detail Drilldown"
                                >
                                  {c.nama} <Search size={11} className="text-teal-500 shrink-0" />
                                </button>
                              ) : (
                                <span className="font-extrabold text-slate-800">{c.nama}</span>
                              )}
                              {c.aiReviewed && (
                                <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded-md font-black text-[8px] uppercase tracking-wider border border-teal-200 shadow-sm flex items-center gap-0.5" title="Selesai Diulas Oleh Gemini AI">
                                  <Brain size={8} className="animate-pulse" /> AI Audited
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono font-bold text-slate-400 mt-0.5">{c.sep}</span>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-slate-700 max-w-sm whitespace-normal break-words leading-relaxed">
                          {c.keterangan}
                        </td>
                        <td className="p-4 text-right font-mono font-black text-rose-600">
                          {formatRp(c.nominal)}
                        </td>
                        <td className="p-4 text-center">
                          {c.matched ? (
                            <button
                              onClick={() => {
                                if (openDrilldown) {
                                  openDrilldown(
                                    `Detail Pasien: ${c.nama} (${c.sep})`,
                                    row => String(row.sep || row.SEP || row.NO_SEP || row.no_sep || '').trim() === String(c.sep).trim(),
                                    'pending_sakti',
                                    processedClaims
                                  );
                                }
                              }}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 rounded-full font-black text-[9px] uppercase tracking-wide border border-emerald-200 flex items-center gap-1.5 w-fit mx-auto shadow-sm cursor-pointer transition-all"
                              title="Klik untuk melihat Detail Drilldown"
                            >
                              <CheckCircle2 size={12} strokeWidth={3} /> Cocok (iDRG)
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 bg-slate-50 text-slate-400 rounded-full font-black text-[9px] uppercase tracking-wide border border-slate-200 flex items-center gap-1.5 w-fit mx-auto">
                              Mandiri
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <select
                            value={c.faktor}
                            onChange={(e) => updateClaimFactor(c.id, e.target.value)}
                            className={`px-2.5 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-wide border outline-none cursor-pointer transition-all shadow-sm ${
                              c.faktor === 'Internal RS' 
                                ? 'bg-rose-50 border-rose-200 text-rose-700 focus:ring-1 focus:ring-rose-300' 
                                : c.faktor === 'Eksternal BPJS' 
                                  ? 'bg-sky-50 border-sky-200 text-sky-700 focus:ring-1 focus:ring-sky-300' 
                                  : 'bg-slate-50 border-slate-200 text-slate-700 focus:ring-1 focus:ring-slate-300'
                            }`}
                          >
                            <option value="Internal RS">Internal RS</option>
                            <option value="Eksternal BPJS">Eksternal BPJS</option>
                            <option value="Grey Area">Grey Area</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700">{c.ksm}</span>
                            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">{c.dept}</span>
                          </div>
                        </td>
                        <td className="p-4 font-extrabold text-slate-700 uppercase">
                          {c.coderName}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1.5 w-full">
                            
                                                        {/* Gemini AI Assessor Action */}
                            <button 
                              onClick={() => openAiAnalysisModal(c)}
                              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1 w-full uppercase tracking-wider shadow-sm ${
                                c.aiReviewed 
                                  ? "bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white" 
                                  : "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
                              }`}
                            >
                              <Brain size={12} className={c.aiReviewed ? "" : "animate-pulse"} /> 
                              {c.aiReviewed ? "📋 Lihat Hasil Audit AI" : "✨ Analisis Gemini AI"}
                            </button>

                            {/* Standard Copy Triggers */}
                            <div className="flex gap-1">
                              <button 
                                onClick={() => handleCopy(c.saran, `sar-${c.id}`)}
                                className={`flex-1 py-1.5 border rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${copiedId === `sar-${c.id}` ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white hover:bg-slate-50 text-slate-500'}`}
                                title="Salin Saran Tindakan Coder"
                              >
                                {copiedId === `sar-${c.id}` ? <Check size={11} strokeWidth={3} /> : <Copy size={11} />}
                                Saran
                              </button>
                              
                              <button 
                                onClick={() => handleCopy(c.rsBenar, `ben-${c.id}`)}
                                className={`flex-1 py-1.5 border rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${copiedId === `ben-${c.id}` ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white hover:bg-slate-50 text-slate-500'}`}
                                title="Salin Draft Sanggahan (Jika RS Benar)"
                              >
                                {copiedId === `ben-${c.id}` ? <Check size={11} strokeWidth={3} /> : <Copy size={11} />}
                                Sanggah
                              </button>

                              <button 
                                onClick={() => handleCopy(c.rsSalah, `sal-${c.id}`)}
                                className={`flex-1 py-1.5 border rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${copiedId === `sal-${c.id}` ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white hover:bg-slate-50 text-slate-500'}`}
                                title="Salin Draft Kesediaan Revisi (Jika RS Salah)"
                              >
                                {copiedId === `sal-${c.id}` ? <Check size={11} strokeWidth={3} /> : <Copy size={11} />}
                                Revisi
                              </button>
                            </div>

                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filteredClaims.length > 0 && (
              <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-right text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                Menampilkan {filteredClaims.length} dari {processedClaims.length} berkas klaim pending.
              </div>
            )}
          </Card>
        </>
      )}

      {activeSubTab === 'report' && (
        <div id="print-report-area" className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-md space-y-8 text-slate-800">
          {/* Custom CSS to enforce perfect print layout */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body {
                background: white !important;
                color: black !important;
              }
              #print-report-area {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
              }
              .print-page-break {
                page-break-before: always;
              }
            }
          `}} />

          {/* Report Header */}
          <div className="border-b pb-6 border-slate-200 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Laporan Executive Audit Pending BPJS</h1>
              <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">Kementerian Kesehatan Republik Indonesia • Akurat-iDRG Dashboard</p>
            </div>
            <div className="text-right">
              <div className="text-xs font-black text-slate-700 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm">
                Tanggal: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Textual Executive Summary Insight */}
          <div className="bg-teal-50/50 border border-teal-100/80 p-6 rounded-3xl">
            <h3 className="text-xs font-black text-teal-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Brain size={15} /> Executive Insight &amp; Rekomendasi Audit
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 font-medium">
              Berdasarkan audit klaim pending BPJS yang diunggah dari berkas <strong className="text-slate-800">{fileName || 'laporan_klaim.xlsx'}</strong>, terdapat total sebanyak <strong className="text-slate-800">{stats.total} kasus</strong> pending dengan estimasi nominal biaya pending tertahan sebesar <strong className="text-emerald-700 font-bold">{formatRp(stats.nominal)}</strong>. 
              Layanan Rawat Jalan Tingkat Lanjut (RJTL) berkontribusi sebesar <strong className="text-slate-800">{stats.rjCount} kasus ({formatRp(stats.rjNominal)})</strong>, sedangkan Rawat Inap Tingkat Lanjut (RITL) menyumbang <strong className="text-slate-800">{stats.riCount} kasus ({formatRp(stats.riNominal)})</strong>.
              Analisis faktor penyebab menunjukkan bahwa <strong className="text-amber-700">{stats.internal} kasus ({((stats.internal / stats.total) * 100).toFixed(0)}%)</strong> disebabkan oleh faktor Internal RS (perbedaan persepsi koding, kelengkapan resume medis, penginputan sistem), yang mana hal ini bersifat sistemik dan dapat diperbaiki secara cepat melalui penguatan edukasi regulasi koding ke komite medis (KSM/SMF).
            </p>
          </div>

          {/* Metrics cards for print */}
          <div className="grid grid-cols-4 gap-4">
            <div className="border border-slate-200 p-4 rounded-2xl text-center bg-slate-50/50">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Kasus</div>
              <div className="text-lg font-black text-slate-800 mt-1">{stats.total}</div>
              <div className="text-[9px] text-slate-500 font-bold mt-0.5">{stats.rjCount} RJTL | {stats.riCount} RITL</div>
            </div>
            <div className="border border-slate-200 p-4 rounded-2xl text-center bg-slate-50/50">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Estimasi Nominal</div>
              <div className="text-lg font-black text-emerald-600 mt-1">{formatRp(stats.nominal)}</div>
              <div className="text-[9px] text-slate-500 font-bold mt-0.5">{formatRp(stats.rjNominal)} RJTL | {formatRp(stats.riNominal)} RITL</div>
            </div>
            <div className="border border-slate-200 p-4 rounded-2xl text-center bg-slate-50/50">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Penyebab Internal RS</div>
              <div className="text-lg font-black text-amber-600 mt-1">{stats.internal} Kasus</div>
              <div className="text-[9px] text-slate-500 font-bold mt-0.5">{((stats.internal / stats.total) * 100).toFixed(0)}% Sistemik RS</div>
            </div>
            <div className="border border-slate-200 p-4 rounded-2xl text-center bg-slate-50/50">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cocok Data iDRG</div>
              <div className="text-lg font-black text-indigo-600 mt-1">{stats.matchedCount} Kasus</div>
              <div className="text-[9px] text-slate-500 font-bold mt-0.5">DPJP &amp; KSM Terintegrasi</div>
            </div>
          </div>

          {/* Static view of Bokeh Scatterplot for printing */}
          <Card id="print-matrix-zoning" downloadTitle="Matriks BEP Zoning (Laporan)" className="p-6 space-y-4">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest text-center border-b pb-3 border-slate-100">
              Peta Sebaran Prioritas Masalah Pending BPJS (Matriks BEP Zoning)
            </h3>
            <div className="max-w-2xl mx-auto">
              <svg 
                viewBox={`0 0 ${width} ${height}`} 
                className="w-full h-auto bg-white select-none border rounded-2xl" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Quadrant Background Shading */}
                <rect x={padding.left} y={padding.top} width={chartParams.innerW / 2} height={chartParams.scaleY(chartParams.avgFreq) - padding.top} fill="#ecfdf5" opacity="0.3" />
                <rect x={padding.left + chartParams.innerW / 2} y={padding.top} width={chartParams.innerW / 2} height={chartParams.scaleY(chartParams.avgFreq) - padding.top} fill="#fef2f2" opacity="0.35" />
                <rect x={padding.left} y={chartParams.scaleY(chartParams.avgFreq)} width={chartParams.innerW / 2} height={height - padding.bottom - chartParams.scaleY(chartParams.avgFreq)} fill="#f8fafc" opacity="0.4" />
                <rect x={padding.left + chartParams.innerW / 2} y={chartParams.scaleY(chartParams.avgFreq)} width={chartParams.innerW / 2} height={height - padding.bottom - chartParams.scaleY(chartParams.avgFreq)} fill="#eff6ff" opacity="0.35" />

                {/* Chart Axes */}
                <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#cbd5e1" strokeWidth="1.5" />

                {/* Average lines */}
                <line x1={chartParams.scaleX(chartParams.avgNom)} y1={padding.top} x2={chartParams.scaleX(chartParams.avgNom)} y2={height - padding.bottom} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
                <line x1={padding.left} y1={chartParams.scaleY(chartParams.avgFreq)} x2={width - padding.right} y2={chartParams.scaleY(chartParams.avgFreq)} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />

                {/* Zone Labels */}
                <text x={padding.left + chartParams.innerW * 0.25} y={padding.top + 18} fontSize="9" fill="#d97706" fontWeight="black" textAnchor="middle" letterSpacing="1">ZONA II (SISTEMIK)</text>
                <text x={padding.left + chartParams.innerW * 0.75} y={padding.top + 18} fontSize="9" fill="#dc2626" fontWeight="black" textAnchor="middle" letterSpacing="1">ZONA I (PRIORITAS UTAMA)</text>
                <text x={padding.left + chartParams.innerW * 0.25} y={height - padding.bottom - 12} fontSize="9" fill="#64748b" fontWeight="black" textAnchor="middle" letterSpacing="1">ZONA IV (MONITORING)</text>
                <text x={padding.left + chartParams.innerW * 0.75} y={height - padding.bottom - 12} fontSize="9" fill="#2563eb" fontWeight="black" textAnchor="middle" letterSpacing="1">ZONA III (HIGH IMPACT)</text>

                {/* Axis Labels */}
                <text x={width / 2} y={height - 12} fontSize="10" fontWeight="extrabold" fill="#475569" textAnchor="middle">Dampak Finansial (Total Nominal Pending per Masalah)</text>
                <text x={15} y={height / 2} fontSize="10" fontWeight="extrabold" fill="#475569" textAnchor="middle" transform={`rotate(-90 15 ${height / 2})`}>Frekuensi Kejadian (Jumlah Kasus)</text>

                {/* Scatter Dots */}
                {scatterData.map((d, i) => {
                  const x = chartParams.scaleX(d.totalNominal);
                  const y = chartParams.scaleY(d.frequency);

                  let color = '#94a3b8';
                  if (d.totalNominal >= chartParams.avgNom) {
                    color = d.frequency >= chartParams.avgFreq ? '#ef4444' : '#2563eb';
                  } else {
                    color = d.frequency >= chartParams.avgFreq ? '#f59e0b' : '#64748b';
                  }

                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r={7} fill={color} fillOpacity={0.85} stroke="#fff" strokeWidth={1.5} />
                      <text x={x} y={y - 11} fontSize="8" fontWeight="black" fill="#0f172a" textAnchor="middle">
                        {d.frequency}x
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </Card>

          {/* Top 10 Dispute Reasons by Category (Medis, Koding, Administrasi, Readmisi) */}
          <div className="print-page-break space-y-6">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-teal-600" /> Permasalahan Pending Top 10 Berdasarkan Kategori
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category 1: Medis */}
              <div className="border border-slate-200 rounded-3xl p-5 bg-white space-y-3 shadow-sm">
                <h3 className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-100 px-3.5 py-2 rounded-xl flex justify-between items-center uppercase tracking-wide">
                  <span>Top 10 Pending Medis</span>
                  <span className="text-[10px] font-black">{top10Stats.medis.length} Masalah</span>
                </h3>
                {top10Stats.medis.length > 0 ? (
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr className="border-b text-slate-400 text-left font-black uppercase tracking-wider text-[8px]">
                        <th className="pb-2 w-8">No.</th>
                        <th className="pb-2 pl-2">Ringkasan Alasan Pending</th>
                        <th className="pb-2 text-center w-12">Frekuensi</th>
                        <th className="pb-2 text-right w-20">Total Nominal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {top10Stats.medis.map((d, index) => (
                        <tr key={index} className="border-b last:border-0 hover:bg-slate-50/50">
                          <td className="py-2.5 text-slate-500 font-bold">{index + 1}</td>
                          <td className="py-2.5 font-bold text-slate-700 pr-2 max-w-[200px] truncate" title={d.label}>{d.label}</td>
                          <td className="py-2.5 text-center text-slate-800 font-black">{d.frequency}x</td>
                          <td className="py-2.5 text-right text-emerald-600 font-black">{formatRp(d.totalNominal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-slate-400 text-center py-6 text-xs font-bold">Tidak ada data pending Medis.</div>
                )}
              </div>

              {/* Category 2: Koding */}
              <div className="border border-slate-200 rounded-3xl p-5 bg-white space-y-3 shadow-sm">
                <h3 className="text-xs font-black text-teal-700 bg-teal-50 border border-teal-100 px-3.5 py-2 rounded-xl flex justify-between items-center uppercase tracking-wide">
                  <span>Top 10 Pending Koding</span>
                  <span className="text-[10px] font-black">{top10Stats.koding.length} Masalah</span>
                </h3>
                {top10Stats.koding.length > 0 ? (
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr className="border-b text-slate-400 text-left font-black uppercase tracking-wider text-[8px]">
                        <th className="pb-2 w-8">No.</th>
                        <th className="pb-2 pl-2">Ringkasan Alasan Pending</th>
                        <th className="pb-2 text-center w-12">Frekuensi</th>
                        <th className="pb-2 text-right w-20">Total Nominal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {top10Stats.koding.map((d, index) => (
                        <tr key={index} className="border-b last:border-0 hover:bg-slate-50/50">
                          <td className="py-2.5 text-slate-500 font-bold">{index + 1}</td>
                          <td className="py-2.5 font-bold text-slate-700 pr-2 max-w-[200px] truncate" title={d.label}>{d.label}</td>
                          <td className="py-2.5 text-center text-slate-800 font-black">{d.frequency}x</td>
                          <td className="py-2.5 text-right text-emerald-600 font-black">{formatRp(d.totalNominal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-slate-400 text-center py-6 text-xs font-bold">Tidak ada data pending Koding.</div>
                )}
              </div>

              {/* Category 3: Administrasi */}
              <div className="border border-slate-200 rounded-3xl p-5 bg-white space-y-3 shadow-sm">
                <h3 className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-3.5 py-2 rounded-xl flex justify-between items-center uppercase tracking-wide">
                  <span>Top 10 Pending Administrasi</span>
                  <span className="text-[10px] font-black">{top10Stats.admin.length} Masalah</span>
                </h3>
                {top10Stats.admin.length > 0 ? (
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr className="border-b text-slate-400 text-left font-black uppercase tracking-wider text-[8px]">
                        <th className="pb-2 w-8">No.</th>
                        <th className="pb-2 pl-2">Ringkasan Alasan Pending</th>
                        <th className="pb-2 text-center w-12">Frekuensi</th>
                        <th className="pb-2 text-right w-20">Total Nominal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {top10Stats.admin.map((d, index) => (
                        <tr key={index} className="border-b last:border-0 hover:bg-slate-50/50">
                          <td className="py-2.5 text-slate-500 font-bold">{index + 1}</td>
                          <td className="py-2.5 font-bold text-slate-700 pr-2 max-w-[200px] truncate" title={d.label}>{d.label}</td>
                          <td className="py-2.5 text-center text-slate-800 font-black">{d.frequency}x</td>
                          <td className="py-2.5 text-right text-emerald-600 font-black">{formatRp(d.totalNominal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-slate-400 text-center py-6 text-xs font-bold">Tidak ada data pending Administrasi.</div>
                )}
              </div>

              {/* Category 4: Readmisi */}
              <div className="border border-slate-200 rounded-3xl p-5 bg-white space-y-3 shadow-sm">
                <h3 className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-100 px-3.5 py-2 rounded-xl flex justify-between items-center uppercase tracking-wide">
                  <span>Top 10 Pending Readmisi</span>
                  <span className="text-[10px] font-black">{top10Stats.readmisi.length} Masalah</span>
                </h3>
                {top10Stats.readmisi.length > 0 ? (
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr className="border-b text-slate-400 text-left font-black uppercase tracking-wider text-[8px]">
                        <th className="pb-2 w-8">No.</th>
                        <th className="pb-2 pl-2">Ringkasan Alasan Pending</th>
                        <th className="pb-2 text-center w-12">Frekuensi</th>
                        <th className="pb-2 text-right w-20">Total Nominal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {top10Stats.readmisi.map((d, index) => (
                        <tr key={index} className="border-b last:border-0 hover:bg-slate-50/50">
                          <td className="py-2.5 text-slate-500 font-bold">{index + 1}</td>
                          <td className="py-2.5 font-bold text-slate-700 pr-2 max-w-[200px] truncate" title={d.label}>{d.label}</td>
                          <td className="py-2.5 text-center text-slate-800 font-black">{d.frequency}x</td>
                          <td className="py-2.5 text-right text-emerald-600 font-black">{formatRp(d.totalNominal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-slate-400 text-center py-6 text-xs font-bold">Tidak ada data pending Readmisi.</div>
                )}
              </div>
            </div>
          </div>

          {/* Persentase Distribusi Kategori & Faktor Penyebab Pending (NEW USER REQUEST) */}
          <div className="print-page-break space-y-6">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
              <Brain size={16} className="text-teal-600" /> Analisis Distribusi Kategori &amp; Faktor Penyebab Pending
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kategori Permasalahan */}
              <div className="border border-slate-200 rounded-3xl p-5 bg-white space-y-4 shadow-sm">
                <h3 className="text-xs font-black text-slate-800 border-b pb-2 uppercase tracking-wide flex justify-between">
                  <span>Kategori Permasalahan</span>
                  <span className="text-[10px] text-teal-600 font-extrabold">Persentase</span>
                </h3>
                <div className="space-y-4">
                  <CategoryBar label="Indikasi Medis Klinis (Medis)" count={stats.medis} total={stats.total} color="bg-sky-500" />
                  <CategoryBar label="Koding Medis / Aturan ICD (Koding)" count={stats.koding} total={stats.total} color="bg-rose-500" />
                  <CategoryBar label="Administrasi / Kelengkapan Berkas (Administrasi)" count={stats.admin} total={stats.total} color="bg-amber-500" />
                  <CategoryBar label="Readmisi / Clinical Pathway (Readmisi)" count={stats.readmisi} total={stats.total} color="bg-teal-500" />
                </div>
              </div>

              {/* Faktor Penyebab */}
              <div className="border border-slate-200 rounded-3xl p-5 bg-white space-y-4 shadow-sm">
                <h3 className="text-xs font-black text-slate-800 border-b pb-2 uppercase tracking-wide flex justify-between">
                  <span>Faktor Penyebab (Causal Factors)</span>
                  <span className="text-[10px] text-teal-600 font-extrabold">Persentase</span>
                </h3>
                <div className="space-y-4">
                  <CategoryBar label="Internal RS (Edukasi Koding, Resume Medis, Sistem)" count={stats.internal} total={stats.total} color="bg-rose-500" />
                  <CategoryBar label="Eksternal BPJS (Perbedaan Interpretasi Klaim)" count={stats.eksternal} total={stats.total} color="bg-sky-500" />
                  <CategoryBar label="Grey Area (Butuh Konsensus Bersama)" count={stats.grey} total={stats.total} color="bg-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Signatures / Approval block for legal audit report */}
          <div className="pt-12 flex justify-between text-xs font-semibold text-slate-500 border-t border-dashed border-slate-200">
            <div className="text-center w-48 space-y-12">
              <span>Dibuat Oleh,<br /><strong>Ketua Tim Verifikator RS</strong></span>
              <div className="border-b border-slate-300 w-32 mx-auto"></div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">NIP. __________________</span>
            </div>
            <div className="text-center w-48 space-y-12">
              <span>Menyetujui,<br /><strong>Direktur Pelayanan Medik</strong></span>
              <div className="border-b border-slate-300 w-32 mx-auto"></div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">NIP. __________________</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )}

      {/* COLUMN MAPPING DIALOG MODAL */}
      {showMappingModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-teal-800 to-emerald-950 text-white flex items-center gap-3 shrink-0">
              <div className="p-2.5 bg-white/10 rounded-xl border border-white/20"><FileSpreadsheet size={20} /></div>
              <div>
                <h3 className="text-base font-black uppercase tracking-tight">Hubungkan Kolom Spreadsheet</h3>
                <p className="text-[10px] text-teal-200 font-bold uppercase tracking-widest mt-0.5">Sesuaikan struktur data Anda</p>
              </div>
            </div>
            
            <div className="p-8 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-[11px] leading-relaxed text-slate-500 font-medium">
                Pilih nama kolom di file spreadsheet Anda yang mewakili data-data di bawah ini agar sistem dapat memproses secara akurat.
              </div>

              {/* SEP Column */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Kolom Nomor SEP (SEP / No. Kartu)</label>
                <select 
                  value={columnMapping.sep} 
                  onChange={(e) => setColumnMapping({ ...columnMapping, sep: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                >
                  {headers.map((h, idx) => <option key={idx} value={h}>{h}</option>)}
                </select>
              </div>

              {/* Name Column */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Kolom Nama Pasien</label>
                <select 
                  value={columnMapping.nama} 
                  onChange={(e) => setColumnMapping({ ...columnMapping, nama: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                >
                  {headers.map((h, idx) => <option key={idx} value={h}>{h}</option>)}
                </select>
              </div>

              {/* Keterangan Column */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Kolom Alasan Pending BPJS (Keterangan / Masalah)</label>
                <select 
                  value={columnMapping.keterangan} 
                  onChange={(e) => setColumnMapping({ ...columnMapping, keterangan: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                >
                  {headers.map((h, idx) => <option key={idx} value={h}>{h}</option>)}
                </select>
              </div>

              {/* Nominal Column */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Kolom Nominal Biaya (Tarif Klaim)</label>
                <select 
                  value={columnMapping.nominal} 
                  onChange={(e) => setColumnMapping({ ...columnMapping, nominal: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                >
                  {headers.map((h, idx) => <option key={idx} value={h}>{h}</option>)}
                </select>
              </div>

              {/* Faktor Column */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Kolom Faktor Penyebab (Internal / Eksternal / Grey Area)</label>
                <select 
                  value={columnMapping.faktor} 
                  onChange={(e) => setColumnMapping({ ...columnMapping, faktor: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                >
                  <option value="">-- AUTO-CLASSIFY (Analisis Kata Kunci) --</option>
                  {headers.map((h, idx) => <option key={idx} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button 
                onClick={() => {
                  setShowMappingModal(false);
                  setFileData([]);
                  setFileName('');
                }}
                className="flex-1 py-3 bg-white border hover:bg-slate-100 text-slate-600 text-xs font-black rounded-xl uppercase tracking-wider transition-all"
              >
                Batalkan
              </button>
              <button 
                onClick={confirmMapping}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all shadow-md shadow-teal-600/10"
              >
                Terapkan Pemetaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GEMINI AI ASSESSOR SIDE PANEL MODAL */}
      {aiPatient && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[2000] flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-teal-800 to-emerald-950 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl border border-white/20"><Brain size={20} className="text-teal-300 animate-pulse" /></div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">Gemini AI Clinical Assessor</h3>
                  <p className="text-[10px] text-teal-200 font-bold uppercase tracking-widest mt-0.5">Penilai &amp; Penyusun Sanggahan Cerdas</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setAiPatient(null);
                  setAiResponse(null);
                  setManualClinicalText('');
                }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors font-bold text-xs"
              >
                Tutup
              </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              
              {/* Patient Profile Card */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b pb-2 border-slate-200/50">
                  <div className="w-1.5 h-3 bg-teal-500 rounded-full"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Detail Klaim BPJS</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Nama Pasien</span>
                    <span className="font-extrabold text-slate-800 text-sm mt-0.5">{aiPatient.nama}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Nomor SEP</span>
                    <span className="font-mono font-bold mt-0.5">{aiPatient.sep}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Kode Diagnosis (Diaglist)</span>
                    {renderIcdPills(aiPatient.diaglist)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Kode Prosedur (Proclist)</span>
                    {renderIcdPills(aiPatient.proclist)}
                  </div>
                </div>
                <div className="flex flex-col border-t pt-3 mt-1 border-slate-200/50">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Alasan Pending</span>
                  <span className="font-bold text-rose-700 mt-1 leading-relaxed">{aiPatient.keterangan}</span>
                </div>
                <div className="flex flex-col border-t pt-3 mt-1 border-slate-200/50">
                  <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-0.5">Klasifikasi Faktor Penyebab</label>
                  <select
                    value={aiPatient.faktor}
                    onChange={(e) => {
                      const newFak = e.target.value;
                      setAiPatient(prev => ({ ...prev, faktor: newFak }));
                      updateClaimFactor(aiPatient.id, newFak);
                    }}
                    className={`px-3 py-2.5 border rounded-xl text-xs font-bold outline-none cursor-pointer w-full transition-all ${
                      aiPatient.faktor === 'Internal RS' 
                        ? 'bg-rose-50 border-rose-200 text-rose-700 focus:ring-1 focus:ring-rose-300' 
                        : aiPatient.faktor === 'Eksternal BPJS' 
                          ? 'bg-sky-50 border-sky-200 text-sky-700 focus:ring-1 focus:ring-sky-300' 
                          : 'bg-slate-50 border-slate-200 text-slate-700 focus:ring-1 focus:ring-slate-300'
                    }`}
                  >
                    <option value="Internal RS">Internal RS (Penyebab Rumah Sakit)</option>
                    <option value="Eksternal BPJS">Eksternal BPJS (Kriteria Verifikator)</option>
                    <option value="Grey Area">Grey Area (Abu-Abu Regulasi)</option>
                  </select>
                </div>
              </div>

              {/* Medical Record Text Input */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex justify-between">
                  <span>Input Laporan Resume Medis / Bukti Klinis</span>
                  <span className="text-[9px] text-slate-400 lowercase font-medium">Opsional</span>
                </label>
                <textarea
                  rows={4}
                  value={manualClinicalText}
                  onChange={(e) => setManualClinicalText(e.target.value)}
                  placeholder="Tempel teks ringkasan medis, hasil lab, rontgen, penunjang, atau terapi obat di sini untuk memperkuat analisis klinis sanggahan AI..."
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-2xl p-4 focus:ring-2 focus:ring-teal-500 outline-none leading-relaxed"
                />
              </div>

              {/* Analyze Button */}
              <button 
                onClick={() => analyzeWithGemini(aiPatient)}
                disabled={isAiLoading}
                className={`w-full py-4 bg-gradient-to-r ${aiResponse ? "from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800" : "from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"} text-white rounded-2xl font-black text-xs transition-all shadow-xl uppercase tracking-widest flex items-center justify-center gap-2`}
              >
                {isAiLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Sedang Menelaah Regulasi &amp; Klinis Pasien...
                  </>
                ) : aiResponse ? (
                  <>
                    <RefreshCw size={14} /> Audit Ulang / Regenerasi Hasil AI
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> Jalankan Assessor Gemini AI
                  </>
                )}
              </button>

              {/* AI Results Block */}
              {aiResponse && (
                <div className="space-y-6 pt-4 animate-in fade-in duration-500">
                  
                  {/* Kamus Kode ICD Card (Gemini AI) */}
                  {aiResponse.terjemahan_icd && aiResponse.terjemahan_icd !== "-" && aiResponse.terjemahan_icd.trim() !== "" && (
                    <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100/70 space-y-2">
                      <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5">
                        <Stethoscope size={14} className="text-emerald-600" /> Arti &amp; Terjemahan Kode ICD (Gemini AI)
                      </span>
                      <p className="text-xs leading-relaxed font-bold text-slate-700 whitespace-pre-line">{aiResponse.terjemahan_icd}</p>
                    </div>
                  )}

                  {/* Saran Perbaikan Card */}
                  <div className="bg-teal-50 p-5 rounded-3xl border border-teal-100 space-y-2.5">
                    <span className="text-[10px] font-black text-teal-800 uppercase tracking-widest flex items-center gap-1.5">
                      <Brain size={14} /> Saran Perbaikan Coder
                    </span>
                    <p className="text-xs leading-relaxed font-bold text-slate-700">{aiResponse.saran_perbaikan}</p>
                  </div>

                  {/* Regulasi Card */}
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/60 space-y-2.5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-500" /> Dasar Hukum &amp; Kutipan Regulasi
                    </span>
                    <p className="text-xs leading-relaxed font-semibold text-slate-600 italic">"{aiResponse.rutipan_regulasi || aiResponse.kutipan_regulasi || 'Sesuai PMK No. 26 Tahun 2021 tentang Pedoman Koding INA-CBG.'}"</p>
                  </div>

                  {/* Draft Jawaban Sanggahan RS (Formal) */}
                  <div className="border border-teal-100 rounded-3xl overflow-hidden shadow-sm">
                    <div className="bg-teal-50 px-5 py-3.5 border-b border-teal-100 flex justify-between items-center">
                      <span className="text-[10px] font-black text-teal-800 uppercase tracking-widest flex items-center gap-1.5">
                        <FileText size={14} /> Draft Resmi Sanggahan RS
                      </span>
                      <button 
                        onClick={() => handleCopy(aiResponse.jawaban_sanggahan_rs || aiResponse.jawaban_sanggahan || '', 'ai-copy')}
                        className={`px-3 py-1.5 border rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${copiedId === 'ai-copy' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white hover:bg-slate-100 text-slate-600'}`}
                      >
                        {copiedId === 'ai-copy' ? <Check size={11} strokeWidth={3} /> : <Copy size={11} />}
                        {copiedId === 'ai-copy' ? 'Tersalin' : 'Salin Naskah'}
                      </button>
                    </div>
                    <div className="p-6 bg-white text-xs text-slate-700 leading-relaxed font-semibold font-serif whitespace-pre-wrap select-all">
                      {aiResponse.jawaban_sanggahan_rs || aiResponse.jawaban_sanggahan}
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* MAPPING DATA LOADING ANIMATION OVERLAY */}
      {isMappingLoading && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[5000] flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white text-sm font-black uppercase tracking-widest animate-pulse">Menghubungkan &amp; Menganalisis Data iDRG...</div>
          <div className="text-teal-300 text-[10px] font-bold uppercase tracking-wide">Mencocokkan KSM, Coder, dan Resume Medis</div>
        </div>
      )}

    </div>
  );
}

// Sub-components

const MetricCard = ({ title, value, subtitle, color, icon: Icon }) => {
  const colors = {
    teal: 'border-teal-100 bg-white text-teal-600 shadow-teal-600/5',
    emerald: 'border-emerald-100 bg-white text-emerald-600 shadow-emerald-600/5',
    amber: 'border-amber-100 bg-white text-amber-600 shadow-amber-600/5',
    indigo: 'border-sky-100 bg-white text-sky-600 shadow-sky-600/5'
  };

  return (
    <Card className={`p-6 border flex justify-between items-center ${colors[color] || colors.teal}`}>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
        <span className="text-xl font-black text-slate-800 mt-1.5">{value}</span>
        <span className="text-[10px] font-bold text-slate-400 mt-0.5">{subtitle}</span>
      </div>
      <div className={`p-3 rounded-2xl bg-slate-50 border ${colors[color].split(' ')[0]} shrink-0 text-slate-600 shadow-inner`}>
        <Icon size={20} />
      </div>
    </Card>
  );
};

const CategoryBar = ({ label, count, total, color }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
        <span>{label}</span>
        <span className="font-extrabold">{count}x ({pct.toFixed(0)}%)</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
};

const RootCauseChart = React.memo(({ stats, onBarClick }) => {
  if (!stats) return null;
  const total = stats.total || 1;
  const internalPct = Math.round((stats.internal / total) * 100);
  const externalPct = Math.round((stats.eksternal / total) * 100);
  const greyPct = Math.round((stats.grey / total) * 100);

  const internalPctPrecise = ((stats.internal / total) * 100).toFixed(1);
  const externalPctPrecise = ((stats.eksternal / total) * 100).toFixed(1);
  const greyPctPrecise = ((stats.grey / total) * 100).toFixed(1);

  return (
    <div className="flex flex-col h-full justify-center">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-full bg-slate-100 rounded-full h-5 overflow-hidden flex shadow-inner border border-slate-200">
          <div className="bg-rose-500 h-full flex items-center justify-center" style={{ width: `${internalPct}%` }}><span className="text-[9px] text-white font-bold">{internalPct > 5 && `${internalPct}%`}</span></div>
          <div className="bg-sky-500 h-full flex items-center justify-center" style={{ width: `${externalPct}%` }}><span className="text-[9px] text-white font-bold">{externalPct > 5 && `${externalPct}%`}</span></div>
          <div className="bg-slate-400 h-full flex items-center justify-center" style={{ width: `${greyPct}%` }}><span className="text-[9px] text-white font-bold">{greyPct > 5 && `${greyPct}%`}</span></div>
        </div>
      </div>
      <div className="space-y-2.5">
        <div onClick={() => onBarClick && onBarClick('Internal RS')} className="cursor-pointer hover:bg-rose-100/50 transition-all flex justify-between items-center bg-rose-50/50 p-2.5 rounded-xl border border-rose-100 shadow-sm group">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500 group-hover:scale-110 transition-transform"></div><span className="text-[11px] font-bold text-rose-700 uppercase">Internal RS</span></div>
          <span className="text-xs font-black text-rose-700">
            <span className="text-rose-600 mr-1">{internalPctPrecise}%</span>
            ({stats.internal})
          </span>
        </div>
        <div onClick={() => onBarClick && onBarClick('Eksternal BPJS')} className="cursor-pointer hover:bg-sky-100/50 transition-all flex justify-between items-center bg-sky-50/50 p-2.5 rounded-xl border border-sky-100 shadow-sm group">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-sky-500 group-hover:scale-110 transition-transform"></div><span className="text-[11px] font-bold text-sky-700 uppercase">Eksternal BPJS</span></div>
          <span className="text-xs font-black text-sky-700">
            <span className="text-sky-600 mr-1">{externalPctPrecise}%</span>
            ({stats.eksternal})
          </span>
        </div>
        <div onClick={() => onBarClick && onBarClick('Grey Area')} className="cursor-pointer hover:bg-slate-200/50 transition-all flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-200 shadow-sm group">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-400 group-hover:scale-110 transition-transform"></div><span className="text-[11px] font-bold text-slate-600 uppercase">Grey Area</span></div>
          <span className="text-xs font-black text-slate-600">
            <span className="text-slate-500 mr-1">{greyPctPrecise}%</span>
            ({stats.grey})
          </span>
        </div>
      </div>
    </div>
  );
});

// Generic UI Card
const Card = React.memo(({ children, className = '', id = null, downloadTitle = null }) => (
  <div id={id} style={{ position: 'relative' }} className={`bg-white rounded-3xl border border-slate-100 shadow-md ${className}`}>
    {downloadTitle && id && (
      <button 
        onClick={(e) => { e.stopPropagation(); saveAsPng(id, downloadTitle); }} 
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '11px',
          fontWeight: '800',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(14,165,233,0.35)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          transition: 'all 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #0284c7, #0369a1)'}
        onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #0ea5e9, #0284c7)'}
        title={`Unduh ${downloadTitle} sebagai gambar PNG`}
        className="print-hidden"
      >
        <Download size={13} /> Simpan PNG
      </button>
    )}
    {children}
  </div>
));
