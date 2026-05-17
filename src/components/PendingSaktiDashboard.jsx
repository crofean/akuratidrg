import React, { useState, useMemo, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, Info, Copy, 
  Move, Search, Check, RefreshCw, Sparkles, Brain, Download, HelpCircle, 
  ChevronDown, ChevronUp, FileText, UserCheck, ShieldCheck, Stethoscope
} from 'lucide-react';

// Default API Key for Gemini AI
const DEFAULT_GEMINI_KEY = 'AIzaSyAEX-AtP0ABYEcgVbj0JICN7KE6eyhzh2c';

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

export default function PendingSaktiDashboard({ isDarkMode, mainDataset = [], resolveKsmDept }) {
  const [fileData, setFileData] = useState([]);
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
  
  // AI State
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('sak_gemini_key') || DEFAULT_GEMINI_KEY);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPatient, setAiPatient] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);
  const [manualClinicalText, setManualClinicalText] = useState('');

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
        let kategori = 'Medis';
        let faktor = 'Eksternal BPJS';
        
        const lKet = keterangan.toLowerCase();
        // Category classification
        if (lKet.includes('koding') || lKet.includes('kode') || lKet.includes('icd') || lKet.includes('diagnose') || lKet.includes('diagnosis') || lKet.includes('procedure') || lKet.includes('prosedur') || lKet.includes('tindakan')) {
          kategori = 'Koding';
        } else if (lKet.includes('admin') || lKet.includes('administrasi') || lKet.includes('kartu') || lKet.includes('ktp') || lKet.includes('rujukan') || lKet.includes('surat') || lKet.includes('kelengkapan') || lKet.includes('berkas')) {
          kategori = 'Administrasi';
        } else if (lKet.includes('readmisi') || lKet.includes('rawat kembali') || lKet.includes('pulang') || lKet.includes('kontrol')) {
          kategori = 'Readmisi';
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

        if (kategori === 'Koding') {
          saran = 'Periksa urutan diagnosis utama & diagnosis sekunder berdasarkan ICD-10.';
          rsBenar = 'Koding diagnosis utama sudah sesuai dengan resume medis klinis pasien terlampir.';
          rsSalah = 'Kami telah melakukan koding ulang diagnosis sesuai pedoman ICD-10.';
        } else if (kategori === 'Administrasi') {
          saran = 'Lengkapi surat rujukan, SEP, dan berkas administrasi penunjang.';
          rsBenar = 'Seluruh berkas administrasi pendukung yang diminta telah terlampir dengan lengkap.';
          rsSalah = 'Revisi berkas kepesertaan/administrasi yang tidak lengkap sedang diproses.';
        } else if (kategori === 'Readmisi') {
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
        'Nominal Dispute (Rp)': c.nominal,
        'Kategori Masalah': c.kategori || '-',
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
      const cleanName = fileName ? fileName.replace(/\.[^/.]+$/, "") : 'Laporan_Dispute';
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

      if (c.kategori === 'Medis') medis++;
      else if (c.kategori === 'Koding') koding++;
      else if (c.kategori === 'Administrasi') admin++;
      else if (c.kategori === 'Readmisi') readmisi++;

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
      const matchesCategory = filterCategory === 'ALL' || c.kategori === filterCategory;
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
          category: c.kategori
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

      const matchesCategory = filterCategory === 'ALL' || c.kategori === filterCategory;
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
      const catClaims = processedClaims.filter(c => c.kategori === catName);
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

  // Call Gemini AI for Clinical Auditing of Medical Record PDF text
  const analyzeWithGemini = async (claim) => {
    if (!claim) return;
    setIsAiLoading(true);
    setAiPatient(claim);
    setAiResponse(null);

    const key = geminiKey.trim() || DEFAULT_GEMINI_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

    const promptText = `
Anda adalah Auditor Medis Senior Rumah Sakit & Pakar Koding JKN.
Tolong bantu kami menganalisis klaim pending/dispute BPJS berikut:

1. Nomor SEP: ${claim.sep}
2. Nama Pasien: ${claim.nama}
3. Alasan Dispute BPJS: ${claim.keterangan}
4. Kode Diagnosis Utama/Sekunder (Kondisi Utama): ${claim.diaglist}
5. Kode Tindakan/Prosedur: ${claim.proclist}
6. Catatan Resume Medis / Bukti Klinis: ${manualClinicalText || 'Tidak ada catatan klinis tambahan yang diunggah. Analisis berdasarkan koding saja.'}

Tolong berikan jawaban audit komprehensif dalam format JSON dengan key berikut:
{
  "saran_perbaikan": "Langkah logis yang harus diambil coder/dokter untuk memperbaiki status klaim (maksimal 2 kalimat)",
  "kutipan_regulasi": "Dasar hukum / PMK / Pedoman Koding ICD-10 yang mendukung argumen rumah sakit (sebutkan pasal/pedoman spesifik jika ada)",
  "jawaban_sanggahan_rs": "Draft naskah formal sanggahan sanggar / surat balasan verifikator BPJS yang profesional, logis secara klinis, dan tegas agar klaim disetujui."
}
Pastikan hanya mengembalikan JSON murni tanpa markdown triple backticks.
`;

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
    } catch (err) {
      console.error(err);
      if (err.message === 'QUOTA_EXHAUSTED' || String(err).includes('429') || String(err).includes('quota') || String(err).includes('exhausted')) {
        setAiResponse({
          saran_perbaikan: '⚠️ KUOTA TOKEN GEMINI HABIS / TERCAPAI BATAS LIMIT (HTTP 429).',
          kutipan_regulasi: 'Peringatan Quota Limit: Penggunaan API Key Anda telah melampaui batas kuota gratis atau berbayar Google AI Studio.',
          jawaban_sanggahan_rs: 'Tindakan Direkomendasikan:\n1. Ganti API Key Gemini Anda di bagian pojok kanan atas halaman pada kotak input "Gemini API Key".\n2. Anda bisa mendapatkan API Key gratis baru di Google AI Studio (https://aistudio.google.com/).\n3. Tempel API Key baru tersebut pada kolom input di atas untuk melanjutkan analisis klaim secara otomatis.'
        });
        alert('⚠️ Kuota API Key Gemini Habis!\n\nSilakan ganti API Key Anda di bagian atas halaman dengan kunci baru yang masih aktif atau buat API Key gratis baru di Google AI Studio.');
      } else {
        setAiResponse({
          saran_perbaikan: 'Gagal menghubungi Gemini AI. Hubungkan koneksi internet Anda atau periksa API Key Anda.',
          kutipan_regulasi: 'PMK No. 26 Tahun 2021 / ICD-10 Pedoman Koding.',
          jawaban_sanggahan_rs: 'Draft tanggapan manual: Terjadi kendala teknis saat melakukan peninjauan AI.'
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
            <h1 className="text-2xl font-black tracking-tight uppercase">Analisis Pending & Dispute</h1>
            <p className="text-xs text-teal-200 font-bold uppercase tracking-wider mt-1">Audit, Klasifikasi, & Solusi Sanggahan BPJS Terintegrasi</p>
          </div>
        </div>

        {/* API Key settings panel */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto relative z-10 shrink-0">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10">
            <Brain size={16} className="text-teal-300" />
            <input 
              type="password" 
              placeholder="Google Gemini API Key..." 
              value={geminiKey}
              onChange={(e) => {
                setGeminiKey(e.target.value);
                localStorage.setItem('sak_gemini_key', e.target.value);
              }}
              className="bg-transparent border-none outline-none text-xs text-white placeholder-slate-400 w-44 font-mono font-bold"
            />
          </div>
          <button 
            onClick={() => {
              setGeminiKey(DEFAULT_GEMINI_KEY);
              localStorage.setItem('sak_gemini_key', DEFAULT_GEMINI_KEY);
              alert('Kunci API default dipulihkan.');
            }}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors text-xs font-black uppercase tracking-wider border border-slate-700/50"
            title="Gunakan API Key Default"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* DRAG AND DROP UPLOAD CONTAINER */}
      {processedClaims.length === 0 && (
        <Card className="p-16 border-2 border-dashed border-slate-200 text-center hover:border-teal-500 hover:shadow-lg transition-all rounded-[2.5rem] bg-white flex flex-col items-center justify-center max-w-3xl mx-auto">
          <div className="w-20 h-20 bg-teal-50 rounded-3xl flex items-center justify-center mb-6 text-teal-600 shadow-inner">
            <Upload size={36} />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Unggah Berkas Dispute Pending BPJS</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed font-medium">
            Seret & taruh berkas Excel (.xlsx, .xls) atau CSV laporan dispute pending BPJS Anda ke sini, atau klik tombol di bawah untuk memilih file.
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
            />
            <MetricCard 
              title="Nilai Klaim Dispute" 
              value={formatRp(stats.nominal)} 
              subtitle={`${formatRp(stats.rjNominal)} RJ | ${formatRp(stats.riNominal)} RI`} 
              color="emerald" 
              icon={Download} 
            />
            <MetricCard 
              title="Penyebab Internal RS" 
              value={`${stats.internal} kasus`} 
              subtitle={`${((stats.internal / stats.total) * 100).toFixed(0)}% Sistemik`} 
              color="amber" 
              icon={AlertTriangle} 
            />
            <MetricCard 
              title="Pasien Terintegrasi" 
              value={`${stats.matchedCount} Kasus`} 
              subtitle="SEP Cocok di iDRG" 
              color="indigo" 
              icon={UserCheck} 
            />
          </div>

          {/* VISUAL CHARTS GRID */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* PRIORITY MATRIX PLOT (2 COLUMNS) */}
            <Card className="p-6 xl:col-span-2 flex flex-col gap-5 bg-white border border-slate-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4 border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <Sparkles size={18} className="text-teal-600 animate-pulse" /> Matriks Prioritas Masalah Dispute
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Analisis korelasi nominal biaya dispute terhadap frekuensi masalah. Klik titik untuk memfilter alasan pending.</p>
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
                  {/* Bokeh Floating Tooltip Overlay */}
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
                        <span className="text-[9px] text-slate-400 font-mono">BOKEH</span>
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

                  {/* Bokeh Toolbar Panel Overlay */}
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
                      onClick={() => alert('Bokeh Priority Matrix:\n1. Hover over any bubble to see instant ulasan, case count, and financial impact.\n2. Click on a bubble to filter the cases table below for that specific pending reason.\n3. Bubbles in the top-right Red Zone are high impact and high frequency. Prioritize these!')} 
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
                    <text x={width / 2} y={height - 12} fontSize="10" fontWeight="extrabold" fill="#475569" textAnchor="middle">Dampak Finansial (Total Nominal Dispute per Masalah)</text>
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

            {/* SEBARAN KATEGORI & RESET PANEL */}
            <Card className="p-6 flex flex-col justify-between bg-white border border-slate-200">
              <div className="space-y-5">
                <div className="border-b pb-4 border-slate-100">
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <Info size={18} className="text-teal-600" /> Analisis Penyebab Masalah
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Klasifikasi penyebab dispute berdasarkan kriteria audit BPJS & internal RS.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold border-b pb-2">
                    <span className="text-slate-400 uppercase">Kategori Dispute</span>
                    <span className="text-slate-600">Frekuensi</span>
                  </div>
                  <CategoryBar label="Koding Medis / Aturan ICD" count={stats.koding} total={stats.total} color="bg-rose-500" />
                  <CategoryBar label="Administrasi / Berkas" count={stats.admin} total={stats.total} color="bg-amber-500" />
                  <CategoryBar label="Readmisi / Clinical Pathway" count={stats.readmisi} total={stats.total} color="bg-teal-500" />
                  <CategoryBar label="Indikasi Medis Klinis" count={stats.medis} total={stats.total} color="bg-sky-500" />
                </div>

                <div className="space-y-3 border-t pt-4 border-slate-100">
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
                  <FileText size={18} className="text-teal-600" /> Daftar Kasus Dispute Pending BPJS
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
                              <span className="font-extrabold text-slate-800">{c.nama}</span>
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
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-black text-[9px] uppercase tracking-wide border border-emerald-200 flex items-center gap-1.5 w-fit mx-auto shadow-sm">
                              <CheckCircle2 size={12} strokeWidth={3} /> Cocok (iDRG)
                            </span>
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
                              onClick={() => analyzeWithGemini(c)}
                              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1 w-full uppercase tracking-wider shadow-sm ${
                                c.aiReviewed 
                                  ? 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white' 
                                  : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white'
                              }`}
                            >
                              <Brain size={12} className={c.aiReviewed ? '' : 'animate-pulse'} /> 
                              {c.aiReviewed ? 'Ulangi Analisis AI' : 'Analisis Gemini AI'}
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
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Laporan Executive Audit Dispute Pending BPJS</h1>
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
              Berdasarkan audit klaim dispute pending BPJS yang diunggah dari berkas <strong className="text-slate-800">{fileName || 'laporan_klaim.xlsx'}</strong>, terdapat total sebanyak <strong className="text-slate-800">{stats.total} kasus</strong> pending dengan estimasi nominal biaya dispute tertahan sebesar <strong className="text-emerald-700 font-bold">{formatRp(stats.nominal)}</strong>. 
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
          <div className="border border-slate-200 p-6 rounded-3xl bg-white space-y-4">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest text-center border-b pb-3 border-slate-100">
              Peta Sebaran Prioritas Masalah Dispute Pending BPJS (Matriks BEP Zoning)
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
                <text x={width / 2} y={height - 12} fontSize="10" fontWeight="extrabold" fill="#475569" textAnchor="middle">Dampak Finansial (Total Nominal Dispute per Masalah)</text>
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
          </div>

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
                        <th className="pb-2 pl-2">Ringkasan Alasan Dispute Pending</th>
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
                        <th className="pb-2 pl-2">Ringkasan Alasan Dispute Pending</th>
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
                        <th className="pb-2 pl-2">Ringkasan Alasan Dispute Pending</th>
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
                        <th className="pb-2 pl-2">Ringkasan Alasan Dispute Pending</th>
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
                    <span className="font-bold text-slate-800 mt-0.5 bg-slate-100 px-2 py-0.5 rounded w-fit">{aiPatient.diaglist}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Kode Prosedur (Proclist)</span>
                    <span className="font-bold text-slate-800 mt-0.5 bg-slate-100 px-2 py-0.5 rounded w-fit">{aiPatient.proclist}</span>
                  </div>
                </div>
                <div className="flex flex-col border-t pt-3 mt-1 border-slate-200/50">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Alasan Dispute / Pending</span>
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
                className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl font-black text-xs transition-all shadow-xl shadow-teal-600/20 uppercase tracking-widest flex items-center justify-center gap-2"
              >
                {isAiLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Sedang Menelaah Regulasi &amp; Klinis Pasien...
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
const Card = React.memo(({ children, className = '' }) => (
  <div className={`bg-white rounded-3xl border border-slate-100 shadow-md ${className}`}>
    {children}
  </div>
));
