import React, { useState, useMemo, useEffect, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import { TrendingUp, Database, BarChart4, Layers, Sparkles, GitCompare, Building2, Landmark, Download, Activity, Target, FileSpreadsheet, HardDriveUpload, X, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import localforage from 'localforage';
import fullDataJson from './full_data.json';
import ExcelWorker from './excelWorker.js?worker';

// Local storage key
const DB_KEY = 'sak_idrg_data';

/** 
 * Clinical Scatter Analytics - Dashboard v2.5
 * Fix: Restored missing IDRG-to-Kelompok mapping and optimized filter loops.
 */

const IDRG_TO_KELOMPOK = {"1560220": "jantung dan pembuluh darah", "1160220": "saraf/ neuroscience", "1860220": "musculoskeletal dan jaringan lunak", "2112120": "uro nefro", "1861220": "musculoskeletal dan jaringan lunak", "2060220": "endokrin, nutrisi dan metabolik", "1661220": "pencernaan dan hepatobilier", "1461220": "paru dan pernafasan", "1460220": "paru dan pernafasan", "2160220": "uro nefro", "1361220": "tht", "3061220": "jantung dan pembuluh darah", "1961220": "kulit & penyakit kelamin", "1260220": "mata", "2461120": "ibu dan ginekologi", "1661120": "pencernaan dan hepatobilier", "3061120": "mata", "1317120": "gigi dan mulut", "3048120": "musculoskeletal dan jaringan lunak", "1161220": "saraf/ neuroscience", "1319120": "tht", "2260220": "uro nefro", "1455220": "paru dan pernafasan", "1760220": "pencernaan dan hepatobilier", "2461220": "ibu dan ginekologi", "1860120": "musculoskeletal dan jaringan lunak", "1825120": "musculoskeletal dan jaringan lunak", "1261120": "mata", "1524120": "jantung dan pembuluh darah", "1948220": "kulit & penyakit kelamin", "1560120": "jantung dan pembuluh darah", "2861120": "infeksi dan parasit", "2861220": "infeksi dan parasit", "1468110": "paru dan pernafasan", "1260120": "mata", "1361120": "tht", "1861120": "musculoskeletal dan jaringan lunak", "1414120": "paru dan pernafasan", "1660220": "pencernaan dan hepatobilier", "1667119": "pencernaan dan hepatobilier", "2860220": "infeksi dan parasit", "1160120": "saraf/ neuroscience", "1960220": "kulit & penyakit kelamin", "2161220": "uro nefro", "1961120": "kulit & penyakit kelamin", "2160120": "uro nefro", "1461120": "paru dan pernafasan", "1201120": "mata", "9044220": "neonatus", "1360220": "tht", "3444120": "neoplasma", "1848220": "musculoskeletal dan jaringan lunak", "2401210": "ibu dan ginekologi", "2660220": "hematologi", "1761220": "pencernaan dan hepatobilier", "1174210": "saraf/ neuroscience", "1216120": "mata", "2360220": "ibu dan ginekologi", "1161120": "saraf/ neuroscience", "2660120": "hematologi", "2061220": "endokrin, nutrisi dan metabolik", "1411120": "paru dan pernafasan", "2960120": "jiwa", "3445120": "neoplasma", "1561220": "jantung dan pembuluh darah", "3445220": "neoplasma", "1561120": "jantung dan pembuluh darah", "2604120": "hematologi", "2761220": "neoplasma", "2868119": "infeksi dan parasit", "2361220": "ibu dan ginekologi", "1363119": "tht", "2401211": "ibu dan ginekologi", "1468111": "paru dan pernafasan", "2060120": "endokrin, nutrisi dan metabolik", "1670119": "pencernaan dan hepatobilier", "2161110": "uro nefro", "2868219": "infeksi dan parasit", "1460120": "paru dan pernafasan", "1613110": "pencernaan dan hepatobilier", "1672110": "pencernaan dan hepatobilier", "2048220": "endokrin, nutrisi dan metabolik", "1150120": "saraf/ neuroscience", "2348220": "ibu dan ginekologi", "1209120": "mata", "3361120": "trauma", "1304120": "gigi dan mulut", "1568110": "jantung dan pembuluh darah", "2661220": "alergi imunologi dan rheumatologi", "1848120": "musculoskeletal dan jaringan lunak", "1348220": "tht", "9043220": "musculoskeletal dan jaringan lunak", "2109110": "uro nefro", "1850120": "musculoskeletal dan jaringan lunak", "2461110": "ibu dan ginekologi", "2904120": "jiwa", "2866219": "infeksi dan parasit", "3442120": "neoplasma", "2560220": "neonatus", "2067119": "endokrin, nutrisi dan metabolik", "2261220": "uro nefro", "1909110": "rekonstruksi dan estetika", "1526120": "jantung dan pembuluh darah", "2864319": "infeksi dan parasit", "1467110": "paru dan pernafasan", "1550120": "jantung dan pembuluh darah", "1167110": "saraf/ neuroscience", "1360120": "gigi dan mulut", "1648220": "pencernaan dan hepatobilier", "1660120": "pencernaan dan hepatobilier", "2165110": "uro nefro", "2119120": "uro nefro", "2864419": "infeksi dan parasit", "1876110": "musculoskeletal dan jaringan lunak", "2903120": "jiwa", "1174211": "saraf/ neuroscience", "1765110": "pencernaan dan hepatobilier", "1527210": "jantung dan pembuluh darah", "1960120": "kulit & penyakit kelamin", "1561210": "jantung dan pembuluh darah", "1833110": "musculoskeletal dan jaringan lunak", "1948120": "kulit & penyakit kelamin", "2661110": "hematologi", "1448220": "paru dan pernafasan", "1618210": "pencernaan dan hepatobilier", "1612210": "pencernaan dan hepatobilier", "2560120": "neonatus", "2963610": "jiwa", "1148220": "saraf/ neuroscience", "1413120": "paru dan pernafasan", "1573110": "jantung dan pembuluh darah", "2360120": "ibu dan ginekologi", "2204210": "uro nefro", "1312119": "tht", "3462210": "neoplasma", "2166219": "uro nefro", "2161120": "uro nefro", "1567119": "jantung dan pembuluh darah", "1869110": "musculoskeletal dan jaringan lunak", "1563110": "jantung dan pembuluh darah", "1910110": "rekonstruksi dan estetika", "1203120": "mata", "2102120": "uro nefro", "2866110": "infeksi dan parasit", "2415119": "ibu dan ginekologi", "2661111": "hematologi", "2860120": "infeksi dan parasit", "2761120": "neoplasma", "1470110": "paru dan pernafasan", "2462110": "ibu dan ginekologi", "1409110": "paru dan pernafasan", "2260120": "uro nefro", "2103120": "uro nefro", "2113119": "uro nefro", "1180110": "saraf/ neuroscience", "1450120": "paru dan pernafasan", "1455120": "paru dan pernafasan", "1217120": "mata", "2512119": "neonatus", "1821110": "musculoskeletal dan jaringan lunak", "2561220": "neonatus", "2050120": "endokrin, nutrisi dan metabolik", "2508119": "neonatus", "1149120": "saraf/ neuroscience", "1760120": "pencernaan dan hepatobilier", "2510110": "neonatus", "2401120": "ibu dan ginekologi", "2309120": "ibu dan ginekologi", "1178119": "saraf/ neuroscience", "1831110": "musculoskeletal dan jaringan lunak", "9046120": "kulit & penyakit kelamin", "1172110": "saraf/ neuroscience", "2248220": "uro nefro", "1474110": "paru dan pernafasan", "1370119": "neonatus", "1467111": "paru dan pernafasan", "2461111": "ibu dan ginekologi", "1218120": "mata", "1520120": "jantung dan pembuluh darah", "1176110": "saraf/ neuroscience", "1668110": "pencernaan dan hepatobilier", "1914120": "rekonstruksi dan estetika", "1764110": "pencernaan dan hepatobilier", "1662110": "pencernaan dan hepatobilier", "1563111": "jantung dan pembuluh darah", "1910120": "rekonstruksi dan estetika", "1469110": "paru dan pernafasan", "1413119": "paru dan pernafasan", "2361120": "ibu dan ginekologi", "1607110": "pencernaan dan hepatobilier", "1207120": "mata", "1822110": "musculoskeletal dan jaringan lunak", "2561120": "neonatus", "1913110": "rekonstruksi dan estetika", "2603110": "hematologi", "1913120": "rekonstruksi dan estetika", "1213120": "mata", "1012210": "paru dan pernafasan", "1915110": "rekonstruksi dan estetika", "1950120": "kulit & penyakit kelamin", "2148220": "uro nefro", "1566110": "jantung dan pembuluh darah", "2462111": "ibu dan ginekologi", "2061120": "endokrin, nutrisi dan metabolik", "1650120": "pencernaan dan hepatobilier", "1820110": "musculoskeletal dan jaringan lunak", "2402120": "ibu dan ginekologi", "1571110": "jantung dan pembuluh darah", "1829110": "musculoskeletal dan jaringan lunak", "1250120": "mata", "1528110": "jantung dan pembuluh darah", "2305410": "ibu dan ginekologi", "1573111": "jantung dan pembuluh darah", "1472110": "paru dan pernafasan", "1350120": "tht", "1868110": "musculoskeletal dan jaringan lunak", "2450120": "ibu dan ginekologi", "1669119": "pencernaan dan hepatobilier", "2648220": "hematologi", "1407110": "paru dan pernafasan", "1765111": "pencernaan dan hepatobilier", "1310120": "tht", "1571111": "jantung dan pembuluh darah", "2261120": "uro nefro", "1828120": "musculoskeletal dan jaringan lunak", "1705210": "pencernaan dan hepatobilier", "1348120": "tht", "2063110": "endokrin, nutrisi dan metabolik"};

const KELOMPOK_LIST = Array.from(new Set(Object.values(IDRG_TO_KELOMPOK).filter(Boolean))).sort();

// Source file labels (dynamic now, populated based on available data)
console.log("iDRG Dashboard v2.5 Initializing...");

// --- Hoisted Helper Functions ---
function formatRp(val) {
  if (!val || isNaN(val)) return '-';
  if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(2)} M`;
  if (val >= 1_000_000)     return `Rp ${(val / 1_000_000).toFixed(1)} Jt`;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
}

function isVertikal(row) {
  const n = row[4];
  return n && n !== 'non_rs_vertikal' && n !== 'nan' && n !== '' && n !== 'None';
}

function cleanIdrg(s) {
  return String(s).replace(/\.0$/, '').trim();
}

function getMean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function getStdDev(arr, mean) {
  return arr.length ? Math.sqrt(arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length) : 0;
}

function getMedian(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function getMode(arr) {
  if (!arr.length) return 0;
  const map = new Map();
  let maxFreq = 0;
  let mode = arr[0];
  arr.forEach(v => {
    const f = (map.get(v) || 0) + 1;
    map.set(v, f);
    if (f > maxFreq) { maxFreq = f; mode = v; }
  });
  return mode;
}

const OUTLIER_COLORS = { 0: '#0ea5e9', 1: '#ef4444', 2: '#f59e0b' };

const FilterPill = ({ label, active, onClick, color = '#0ea5e9' }) => (
  <button onClick={onClick} style={{
    padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
    fontSize: 11, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.15s',
    background: active ? color : '#f1f5f9',
    color: active ? '#fff' : '#64748b',
    boxShadow: active ? `0 2px 8px ${color}44` : 'none',
  }}>{label}</button>
);

const StatScoreCard = ({ label, value, icon: Icon, color, format }) => (
  <div style={{ background: '#fff', padding: '14px 18px', borderRadius: 16, borderLeft: `4px solid ${color}`, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
      <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>{label}</span>
      <Icon size={14} color={color} />
    </div>
    <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{format ? format(value) : value.toLocaleString()}</div>
  </div>
);

const IDRGChart = ({ title, data, statsData, logScale, chartRef, onDownload }) => {
  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: (params) => {
        const d = params.value;
        if (!d) return '';
        const oLabel = d[6] === 1 ? '<span style="background:#fef2f2;color:#ef4444;padding:1px 6px;border-radius:4px;font-size:9px;margin-left:6px">⚠ Outlier</span>'
                      : d[6] === 2 ? '<span style="background:#fffbeb;color:#f59e0b;padding:1px 6px;border-radius:4px;font-size:9px;margin-left:6px">⚠ Outlier</span>' : '';
        const kel = IDRG_TO_KELOMPOK[d[5]] || '-';
        return `
          <div style="font-family:'Plus Jakarta Sans',sans-serif;padding:14px 16px;min-width:240px;line-height:1.7">
            <div style="font-size:12px;font-weight:900;color:#0f172a;margin-bottom:8px;padding-bottom:8px;border-bottom:2px solid #f1f5f9;letter-spacing:-0.3px">
              IDRG <span style="color:#0ea5e9">${d[5]}</span>${oLabel}
              <div style="font-size:9px;color:#94a3b8;font-weight:700;margin-top:2px;text-transform:uppercase">${kel}</div>
            </div>
            <table style="width:100%;font-size:11px;border-collapse:collapse">
              <tr><td style="color:#94a3b8;padding:4px 0">Total Kasus</td><td style="font-weight:900;color:#0ea5e9;text-align:right;font-size:15px">${Number(d[0]).toLocaleString()}</td></tr>
              <tr><td style="color:#94a3b8;padding:4px 0">Total Tarif iDRG</td><td style="font-weight:900;color:#f59e0b;text-align:right;font-size:15px">${formatRp(d[1])}</td></tr>
            </table>
          </div>`;
      },
      backgroundColor: '#fff', borderColor: '#e2e8f0', borderWidth: 1, padding: 0,
      extraCssText: 'border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.12);overflow:hidden;',
    },
    grid: { top: '10%', left: '8%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: logScale ? 'log' : 'value',
      name: 'Jumlah Kasus', nameLocation: 'center', nameGap: 30, min: 'dataMin', max: 'dataMax',
      nameTextStyle: { color: '#94a3b8', fontWeight: 700, fontSize: 10 },
      splitLine: { lineStyle: { color: '#f8fafc' } },
      axisLabel: { color: '#cbd5e1', fontSize: 9, formatter: v => v >= 1e3 ? (v/1e3).toFixed(0)+'K' : v },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    yAxis: {
      type: logScale ? 'log' : 'value',
      name: 'Total Tarif iDRG', min: 'dataMin', max: 'dataMax',
      nameTextStyle: { color: '#94a3b8', fontWeight: 700, fontSize: 10 },
      splitLine: { lineStyle: { color: '#f8fafc' } },
      axisLabel: { color: '#cbd5e1', fontSize: 9, formatter: v => v >= 1e9 ? (v/1e9).toFixed(0)+'B' : v >= 1e6 ? (v/1e6).toFixed(0)+'M' : v },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    dataZoom: [
      { type: 'inside', throttle: 50 },
      { type: 'slider', bottom: 5, height: 20, borderColor: 'transparent', backgroundColor: '#f1f5f9', fillerColor: 'rgba(14,165,233,0.1)', handleStyle: { color: '#0ea5e9' } }
    ],
    series: [{
      type: 'scatter',
      data: data.map(d => [d.jml_kasus, d.tarif_idrg, d.tarif_inacbg, d.tarif_rs, d.num_entries, d.idrg_code, d.outlier]),
      symbolSize: (val) => {
        const s = Math.sqrt(val[4]) * 0.8;
        return Math.min(Math.max(s, 2), 10);
      },
      itemStyle: {
        color: (p) => OUTLIER_COLORS[p.value[6]] || '#0ea5e9',
        opacity: (p) => p.value[6] !== 0 ? 0.85 : 0.6,
        borderColor: '#fff', borderWidth: 0.5,
        shadowBlur: (p) => p.value[6] !== 0 ? 8 : 0,
        shadowColor: (p) => p.value[6] !== 0 ? OUTLIER_COLORS[p.value[6]] + '66' : 'transparent',
      },
      markArea: statsData ? {
        silent: true,
        itemStyle: { color: 'rgba(14,165,233,0.03)' },
        data: [[
          { xAxis: statsData.x.lo, yAxis: statsData.y.lo },
          { xAxis: statsData.x.up, yAxis: statsData.y.up }
        ]]
      } : null,
      markLine: statsData ? {
        silent: true,
        symbol: 'none',
        label: { show: false },
        lineStyle: { type: 'dashed', color: '#e2e8f0', width: 1 },
        data: [{ xAxis: statsData.x.mean }, { yAxis: statsData.y.mean }]
      } : null,
      emphasis: { itemStyle: { opacity: 1, borderWidth: 3, shadowBlur: 25 }, scale: 1.3 }
    }]
  }), [data, logScale, statsData]);

  return (
    <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 25px rgba(0,0,0,0.05)', padding: '24px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <h3 style={{ fontSize: 15, fontWeight: 900, color: '#1e293b', margin: 0 }}>{title}</h3>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {statsData && <span style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', background: '#f8fafc', padding: '4px 10px', borderRadius: 20 }}>INLIER RANGE: {statsData.x.lo.toFixed(0)}-{statsData.x.up.toFixed(0)} Kasus</span>}
          <button onClick={onDownload} style={{ padding: '6px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#94a3b8' }}>
            <Download size={14} />
          </button>
        </div>
      </div>
      <ReactECharts ref={chartRef} option={option} style={{ height: '420px', width: '100%' }} opts={{ renderer: 'canvas' }} notMerge={true} />
    </div>
  );
};

export default function App() {
  const [fullData, setFullData] = useState([]);
  const [fileSourcesList, setFileSourcesList] = useState([{ label: 'Semua File', value: 'All' }]);
  const [pemilikList, setPemilikList] = useState(['All']);
  const [kompetensiList, setKompetensiList] = useState(['All']);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // ── Modal State ──
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [filterReg, setFilterReg] = useState(0);
  const [filterVertikal, setFilterVertikal] = useState(0);
  const [filterPemilik, setFilterPemilik] = useState('All');
  const [filterKompetensi, setFilterKompetensi] = useState('All');
  const [filterKelompok, setFilterKelompok] = useState('All');
  const [filterRSSearch, setFilterRSSearch] = useState('');
  const [filterSource, setFilterSource] = useState('All');
  const [logScale, setLogScale] = useState(true);

  // ── Data Initialization ──
  useEffect(() => {
    const initData = async () => {
      try {
        const storedData = await localforage.getItem(DB_KEY);
        if (storedData && Array.isArray(storedData) && storedData.length > 0) {
          setFullData(storedData);
        } else {
          setFullData(fullDataJson);
        }
      } catch (err) {
        console.error("LocalForage Error:", err);
        setFullData(fullDataJson);
      } finally {
        setIsDataLoaded(true);
      }
    };
    initData();
  }, []);

  // Update dynamic file sources and lists when data changes
  useEffect(() => {
    if (fullData.length === 0) return;
    const sources = new Set();
    const pemSet = new Set();
    const komSet = new Set();
    
    fullData.forEach(r => {
      if (r[8]) sources.add(r[8]);
      if (r[10]) pemSet.add(r[10]);
      if (r[9]) komSet.add(r[9]);
    });
    
    const srcArray = [{ label: 'Semua File', value: 'All' }];
    Array.from(sources).sort().forEach(s => srcArray.push({ label: s, value: s }));
    setFileSourcesList(srcArray);
    
    setPemilikList(['All', ...Array.from(pemSet).sort()]);
    setKompetensiList(['All', ...Array.from(komSet).sort()]);

    // Reset filters if active selection was removed
    if (!sources.has(filterSource) && filterSource !== 'All') setFilterSource('All');
    if (!pemSet.has(filterPemilik) && filterPemilik !== 'All') setFilterPemilik('All');
    if (!komSet.has(filterKompetensi) && filterKompetensi !== 'All') setFilterKompetensi('All');
  }, [fullData]);

  // ── Aggregation Logic ──
  const aggregateData = (dataSubset) => {
    const map = new Map();
    dataSubset.forEach(row => {
      const key = cleanIdrg(row[5]);
      if (!map.has(key)) map.set(key, { idrg_code: key, jml_kasus: 0, tarif_idrg: 0, tarif_inacbg: 0, tarif_rs: 0, num_entries: 0 });
      const agg = map.get(key);
      agg.jml_kasus += Number(row[2]) || 0;
      agg.tarif_idrg += Number(row[7]) || 0;
      agg.num_entries += 1;
    });
    return Array.from(map.values());
  };

  const getStatsAndOutliers = (aggregated) => {
    const filtered = aggregated.filter(d => d.jml_kasus > 0 && d.tarif_idrg > 0);
    if (filtered.length < 5) return { data: filtered.map(d => ({ ...d, outlier: 0 })), stats: null };
    
    const xVals = filtered.map(d => d.jml_kasus);
    const yVals = filtered.map(d => d.tarif_idrg);
    
    const meanX = getMean(xVals); const sdX = getStdDev(xVals, meanX);
    const meanY = getMean(yVals); const sdY = getStdDev(yVals, meanY);
    
    const upX = meanX + 2 * sdX; const loX = Math.max(0, meanX - 2 * sdX);
    const upY = meanY + 2 * sdY; const loY = Math.max(0, meanY - 2 * sdY);

    const data = filtered.map(d => {
      const hi = d.jml_kasus > upX || d.tarif_idrg > upY;
      const lo = d.jml_kasus < loX || d.tarif_idrg < loY;
      return { ...d, outlier: hi ? 1 : lo ? 2 : 0 };
    });

    return { 
      data, 
      stats: { 
        x: { mean: meanX, median: getMedian(xVals), mode: getMode(xVals), sd: sdX, up: upX, lo: loX },
        y: { mean: meanY, median: getMedian(yVals), mode: getMode(yVals), sd: sdY, up: upY, lo: loY }
      } 
    };
  };

  const [loading, setLoading] = useState(false);
  const [processedData, setProcessedData] = useState({ ri: { data: [], stats: null }, rj: { data: [], stats: null }, total_rows: 0 });

  // Debounced processing to prevent UI lockup
  useEffect(() => {
    if (!isDataLoaded || fullData.length === 0) return;

    setLoading(true);
    const timer = setTimeout(() => {
      console.time('ProcessingData');
      let base = fullData;
      
      const hasReg = filterReg !== 0;
      const hasVert = filterVertikal !== 0;
      const hasPem = filterPemilik !== 'All';
      const hasKomp = filterKompetensi !== 'All';
      const hasKel = filterKelompok !== 'All';
      const hasSrc = filterSource !== 'All';
      const term = filterRSSearch.trim().toLowerCase();
      const hasSearch = term !== '';

      // Efficient single-pass filtering and partitioning
      const riRaw = [];
      const rjRaw = [];

      for (let i = 0; i < base.length; i++) {
        const r = base[i];
        
        // Filter checks
        if (hasReg && r[3] !== filterReg) continue;
        if (hasVert) {
          const v = isVertikal(r);
          if (filterVertikal === 1 && !v) continue;
          if (filterVertikal === 2 && v) continue;
        }
        if (hasPem && r[10] !== filterPemilik) continue;
        if (hasKomp && r[9] !== filterKompetensi) continue;
        if (hasSrc && r[8] !== filterSource) continue;
        
        const idrgRaw = String(r[5]);
        const idrgClean = idrgRaw.endsWith('.0') ? idrgRaw.slice(0, -2) : idrgRaw;
        
        if (hasKel && IDRG_TO_KELOMPOK[idrgClean] !== filterKelompok) continue;
        if (hasSearch && !(String(r[4]).toLowerCase().includes(term) || String(r[5]).toLowerCase().includes(term))) continue;

        // Partition
        if (Number(r[6]) === 1) riRaw.push(r);
        else if (Number(r[6]) === 2) rjRaw.push(r);
      }

      const resRI = getStatsAndOutliers(aggregateData(riRaw));
      const resRJ = getStatsAndOutliers(aggregateData(rjRaw));

      setProcessedData({ ri: resRI, rj: resRJ, total_rows: riRaw.length + rjRaw.length });
      console.timeEnd('ProcessingData');
      setLoading(false);
    }, 50); 

    return () => clearTimeout(timer);
  }, [filterReg, filterVertikal, filterPemilik, filterKompetensi, filterKelompok, filterRSSearch, filterSource, fullData, isDataLoaded]);

  const riRef = React.useRef(null);
  const rjRef = React.useRef(null);

  // ── Derived: semua outlier dari RI + RJ ──
  const allOutliers = useMemo(() => {
    const list = [];
    processedData.ri.data.filter(d => d.outlier !== 0).forEach(d => list.push({ ...d, tipe: 'Rawat Inap' }));
    processedData.rj.data.filter(d => d.outlier !== 0).forEach(d => list.push({ ...d, tipe: 'Rawat Jalan' }));
    return list.sort((a, b) => b.tarif_idrg - a.tarif_idrg);
  }, [processedData]);

  // ── PNG Download: nama file = chartLabel + sumber file + tanggal ──
  const handleDownload = useCallback((ref, chartLabel) => {
    const chart = ref.current.getEchartsInstance();
    const link = document.createElement('a');
    link.href = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' });
    const srcLabel = filterSource === 'All' ? 'Semua File' : filterSource;
    link.download = `${chartLabel} - ${srcLabel}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filterSource]);

  // ── Excel Download: tabel Outlier dengan nama file otomatis ──
  const handleDownloadExcel = useCallback(() => {
    const srcLabel = filterSource === 'All' ? 'Semua File' : filterSource;
    const date = new Date().toISOString().split('T')[0];

    const rows = allOutliers.map((d, i) => ({
      No: i + 1,
      'IDRG Code': d.idrg_code,
      'Kelompok iDRG': IDRG_TO_KELOMPOK[d.idrg_code] || '-',
      'Tipe Rawat': d.tipe,
      Status: d.outlier === 1 ? 'High Outlier' : 'Low Outlier',
      'Jumlah Kasus': d.jml_kasus,
      'Total Tarif iDRG (Rp)': d.tarif_idrg,
      'Jumlah Entri': d.num_entries,
      'Sumber File': srcLabel,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 5  },  // No
      { wch: 14 },  // IDRG Code
      { wch: 34 },  // Kelompok
      { wch: 14 },  // Tipe
      { wch: 14 },  // Status
      { wch: 16 },  // Kasus
      { wch: 26 },  // Tarif
      { wch: 14 },  // Entri
      { wch: 20 },  // Sumber
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Outlier Detection');
    XLSX.writeFile(wb, `Tabel Outlier - ${srcLabel}.xlsx`);
  }, [allOutliers, filterSource]);

  // ── Upload & Web Worker Logic ──
  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setUploadStatus('Menginisialisasi Web Worker...');
    
    // Convert FileList to array
    const fileArray = Array.from(files);
    let processedCount = 0;
    let allNewRows = [];
    
    // We process sequentially to avoid memory spike
    const processNext = () => {
      if (processedCount >= fileArray.length) {
        finishUpload(allNewRows);
        return;
      }
      
      const file = fileArray[processedCount];
      setUploadStatus(`Mengunggah [${processedCount + 1}/${fileArray.length}]: ${file.name}`);
      
      const worker = new ExcelWorker();
      worker.postMessage({ type: 'PARSE_EXCEL', file, filename: file.name });
      
      worker.onmessage = (msgEvent) => {
        const { type, message, rows, error } = msgEvent.data;
        if (type === 'PROGRESS') {
          setUploadStatus(message);
        } else if (type === 'DONE') {
          allNewRows = allNewRows.concat(rows);
          processedCount++;
          worker.terminate();
          processNext();
        } else if (type === 'ERROR') {
          alert(`Gagal memproses ${file.name}: ${error}`);
          processedCount++;
          worker.terminate();
          processNext();
        }
      };
    };
    
    processNext();
  };

  const finishUpload = async (newRows) => {
    if (newRows.length === 0) {
      setUploadStatus('Tidak ada data valid yang ditemukan.');
      setTimeout(() => setIsUploading(false), 2000);
      return;
    }
    
    setUploadStatus(`Menyimpan ${newRows.length.toLocaleString()} baris ke Database Lokal...`);
    
    try {
      // Append to existing local data or overwrite? We'll append for now.
      const existing = (await localforage.getItem(DB_KEY)) || fullDataJson;
      const merged = [...existing, ...newRows];
      await localforage.setItem(DB_KEY, merged);
      setFullData(merged);
      setUploadStatus('Berhasil disimpan!');
      setTimeout(() => {
        setIsUploading(false);
        setShowUploadModal(false);
      }, 1000);
    } catch (err) {
      setUploadStatus('Gagal menyimpan ke penyimpanan lokal.');
      console.error(err);
      setTimeout(() => setIsUploading(false), 3000);
    }
  };

  const handleResetData = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      // Auto cancel after 3 seconds
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    
    // Proceed with reset
    await localforage.removeItem(DB_KEY);
    setFullData(fullDataJson);
    setConfirmReset(false);
    setUploadStatus("Data berhasil dikembalikan ke default!");
    setTimeout(() => {
      setUploadStatus('');
      setShowUploadModal(false);
    }, 1500);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Plus Jakarta Sans',sans-serif", padding: '24px', position: 'relative' }}>
      
      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 500, borderRadius: 24, padding: 30, boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>Manajer Data Lokal</h2>
              <button onClick={() => !isUploading && setShowUploadModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20}/></button>
            </div>
            
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>
              Aplikasi dapat memproses file Excel <b>(.xlsx)</b> langsung di browser. Data akan disimpan secara permanen di komputer Anda (IndexedDB) sehingga tetap ada meskipun browser direfresh.
              <br/><br/>
              <span style={{ color: '#ef4444', fontWeight: 700 }}>Peringatan:</span> Memproses file Excel berukuran raksasa (&gt;100MB) mungkin memakan waktu beberapa menit.
            </p>

            <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: 16, padding: '30px 20px', textAlign: 'center', marginBottom: 20 }}>
              {isUploading || uploadStatus ? (
                <div>
                  {isUploading && <div style={{ width: 30, height: 30, border: '3px solid #e2e8f0', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />}
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0ea5e9' }}>{uploadStatus}</p>
                </div>
              ) : (
                <>
                  <HardDriveUpload size={32} color="#94a3b8" style={{ marginBottom: 10 }} />
                  <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 800, color: '#475569' }}>Pilih File Excel (.xlsx)</p>
                  <input type="file" multiple accept=".xlsx" onChange={handleFileUpload} style={{ fontSize: 12, color: '#64748b', cursor: 'pointer' }} />
                </>
              )}
            </div>

            <button onClick={handleResetData} disabled={isUploading} style={{ width: '100%', padding: 12, background: confirmReset ? '#ef4444' : '#fef2f2', color: confirmReset ? '#fff' : '#ef4444', border: '1px solid #fecaca', borderRadius: 12, fontWeight: 800, cursor: isUploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
              <Trash2 size={16} /> {confirmReset ? 'YAKIN HAPUS SEMUA DATA?' : 'Reset ke Data Default'}
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {(!isDataLoaded || loading) && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ width: 40, height: 40, border: '4px solid #f1f5f9', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, fontSize: 13, fontWeight: 800, color: '#0ea5e9', letterSpacing: '0.05em' }}>MEMPROSES {fullData.length.toLocaleString()} DATA...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      {/* Header & Main Filters */}
      <header style={{ maxWidth: 1400, margin: '0 auto 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(14,165,233,0.3)' }}>
              <Sparkles color="#fff" size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Clinical Scatter Analytics</h1>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontWeight: 700 }}>{processedData.total_rows.toLocaleString()} Records Analyzed</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowUploadModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: '#0f172a', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 11, boxShadow: '0 4px 12px rgba(15,23,42,0.2)' }}>
              <HardDriveUpload size={14} /> Kelola Data
            </button>
            <button onClick={() => setLogScale(!logScale)} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: logScale ? '#0ea5e9' : '#fff', color: logScale ? '#fff' : '#64748b', fontWeight: 800, cursor: 'pointer', fontSize: 11 }}>
              {logScale ? 'LOG' : 'LINEAR'}
            </button>
          </div>
        </div>

        {/* ── Source File Filter Bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)', padding: '12px 20px', borderRadius: 16, border: '1px solid #bae6fd' }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>📂 SUMBER FILE</span>
          {fileSourcesList.map(src => (
            <FilterPill
              key={src.value}
              label={src.label}
              active={filterSource === src.value}
              onClick={() => setFilterSource(src.value)}
              color="#0284c7"
            />
          ))}
          {filterSource !== 'All' && (
            <span style={{ marginLeft: 8, fontSize: 9, fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '3px 10px', borderRadius: 20 }}>
              Filter aktif: {filterSource}
            </span>
          )}
        </div>

        {/* ── Main Filters ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', background: '#fff', padding: '16px 20px', borderRadius: 20, boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#cbd5e1' }}>REGION</span>
            {[0,1,2,3,4,5].map(r => <FilterPill key={r} label={r === 0 ? 'All' : r} active={filterReg === r} onClick={() => setFilterReg(r)} />)}
          </div>
          <div style={{ borderLeft: '1px solid #f1f5f9', height: 24, margin: '0 10px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#cbd5e1' }}>KEPEMILIKAN</span>
            <select 
              value={filterPemilik} 
              onChange={(e) => setFilterPemilik(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#64748b', outline: 'none', maxWidth: 120 }}
            >
              {pemilikList.map(p => <option key={p} value={p}>{p === 'All' ? 'Semua Pemilik' : p}</option>)}
            </select>
          </div>
          <div style={{ borderLeft: '1px solid #f1f5f9', height: 24, margin: '0 10px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#cbd5e1' }}>KOMPETENSI</span>
            <select 
              value={filterKompetensi} 
              onChange={(e) => setFilterKompetensi(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#64748b', outline: 'none', maxWidth: 120 }}
            >
              {kompetensiList.map(k => <option key={k} value={k}>{k === 'All' ? 'Semua Kompetensi' : k}</option>)}
            </select>
          </div>
          <div style={{ borderLeft: '1px solid #f1f5f9', height: 24, margin: '0 10px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#cbd5e1' }}>KELOMPOK</span>
            <select 
              value={filterKelompok} 
              onChange={(e) => setFilterKelompok(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#64748b', outline: 'none' }}
            >
              <option value="All">Semua Kelompok</option>
              {KELOMPOK_LIST.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div style={{ borderLeft: '1px solid #f1f5f9', height: 24, margin: '0 10px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#cbd5e1' }}>CARI RS/KODE</span>
            <input 
              type="text"
              placeholder="Ketik Nama RS..."
              value={filterRSSearch}
              onChange={(e) => setFilterRSSearch(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, width: 140, outline: 'none' }}
            />
          </div>
        </div>
      </header>

      {/* Stats Cards (Scorecards) */}
      {processedData.ri.stats && (
        <div style={{ maxWidth: 1400, margin: '0 auto 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 12, fontWeight: 900, color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statistik Agregat (Rawat Inap)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <StatScoreCard label="Mean Kasus" value={processedData.ri.stats.x.mean} icon={Activity} color="#0ea5e9" format={v => v.toFixed(1)} />
            <StatScoreCard label="Median Kasus" value={processedData.ri.stats.x.median} icon={Target} color="#10b981" />
            <StatScoreCard label="Modus Kasus" value={processedData.ri.stats.x.mode} icon={Database} color="#8b5cf6" />
            <StatScoreCard label="Std. Deviasi" value={processedData.ri.stats.x.sd} icon={Sparkles} color="#f43f5e" format={v => v.toFixed(1)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <StatScoreCard label="Mean Tarif" value={processedData.ri.stats.y.mean} icon={Activity} color="#0ea5e9" format={formatRp} />
            <StatScoreCard label="Median Tarif" value={processedData.ri.stats.y.median} icon={Target} color="#10b981" format={formatRp} />
            <StatScoreCard label="Modus Tarif" value={processedData.ri.stats.y.mode} icon={Database} color="#8b5cf6" format={formatRp} />
            <StatScoreCard label="Std. Deviasi" value={processedData.ri.stats.y.sd} icon={Sparkles} color="#f43f5e" format={formatRp} />
          </div>
        </div>
      )}

      {/* Charts - Stacked Layout */}
      <div style={{ maxWidth: 1400, margin: '0 auto 24px', display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        <IDRGChart title="Distribusi Rawat Inap (PTD 1)" data={processedData.ri.data} statsData={processedData.ri.stats} logScale={logScale} chartRef={riRef} onDownload={() => handleDownload(riRef, 'Scatter Plot Rawat Inap')} />
        <IDRGChart title="Distribusi Rawat Jalan (PTD 2)" data={processedData.rj.data} statsData={processedData.rj.stats} logScale={logScale} chartRef={rjRef} onDownload={() => handleDownload(rjRef, 'Scatter Plot Rawat Jalan')} />
      </div>

      {/* Outlier Table */}
      <div style={{ maxWidth: 1400, margin: '0 auto', background: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: '#1e293b', margin: 0 }}>Statistical Outlier Detection (2x SD)</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ padding: '4px 12px', background: '#fef2f2', color: '#ef4444', borderRadius: 20, fontSize: 10, fontWeight: 800 }}>{allOutliers.length} Anomalies</span>
            <button
              onClick={handleDownloadExcel}
              title="Download tabel ke Excel"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#16a34a,#15803d)',
                color: '#fff', fontWeight: 800, fontSize: 11,
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
                transition: 'all 0.15s',
              }}
            >
              <FileSpreadsheet size={14} />
              Download Excel
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                <th style={{ padding: '12px', color: '#94a3b8', fontWeight: 800 }}>IDRG CODE</th>
                <th style={{ padding: '12px', color: '#94a3b8', fontWeight: 800 }}>TIPE</th>
                <th style={{ padding: '12px', color: '#94a3b8', fontWeight: 800 }}>STATUS</th>
                <th style={{ padding: '12px', color: '#94a3b8', fontWeight: 800 }}>KASUS</th>
                <th style={{ padding: '12px', color: '#94a3b8', fontWeight: 800 }}>TARIF iDRG</th>
                <th style={{ padding: '12px', color: '#94a3b8', fontWeight: 800 }}>ENTRI</th>
              </tr>
            </thead>
            <tbody>
              {allOutliers.slice(0, 100).map((d, i) => (
                <tr key={`${d.idrg_code}-${d.tipe}`} style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? 'transparent' : '#fafafa' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0f172a' }}>{d.idrg_code}</td>
                  <td style={{ padding: '10px 12px' }}><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700, background: d.tipe === 'Rawat Inap' ? '#f0f9ff' : '#f0fdf4', color: d.tipe === 'Rawat Inap' ? '#0ea5e9' : '#10b981' }}>{d.tipe}</span></td>
                  <td style={{ padding: '10px 12px' }}><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700, background: d.outlier === 1 ? '#fef2f2' : '#fffbeb', color: d.outlier === 1 ? '#ef4444' : '#f59e0b' }}>OUTLIER</span></td>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{d.jml_kasus.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#f59e0b' }}>{formatRp(d.tarif_idrg)}</td>
                  <td style={{ padding: '10px 12px', color: '#cbd5e1', fontSize: 10 }}>{d.num_entries} Entri</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
