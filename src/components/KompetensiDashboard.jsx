import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Activity, ShieldAlert, ArrowLeft, TrendingDown, TrendingUp,
  ChevronRight, X, Search, AlertCircle, CheckCircle,
  BarChart3, TableIcon, Grid3X3, Users, FileText, Filter, Download, Copy, FileSpreadsheet
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import PasswordModal from './PasswordModal';
import { exportToExcel } from '../utils/exportUtils';
import { analyzeCompetency, CONFIG_KEY, LEVEL_ORDER, ALL_GROUPS } from '../utils/competencyAnalyzer';
import { copyToClipboardHtml } from '../App';
import KompetensiLaporan from './KompetensiLaporan';
import Papa from 'papaparse';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const fmt  = (n) => (n || 0).toLocaleString('id-ID');
const fmtR = (n) => {
  n = n || 0;
  const a = Math.abs(n);
  if (a >= 1e12) return `${(n/1e12).toFixed(2)} T`;
  if (a >= 1e9)  return `${(n/1e9).toFixed(2)} M`;
  if (a >= 1e6)  return `${(n/1e6).toFixed(1)} jt`;
  return n.toLocaleString('id-ID');
};
const fmtRp  = (n) => `Rp ${fmtR(n)}`;
const fmtPct = (n) => `${(n||0).toFixed(1)}%`;
const dn = (s) => s.replace(/^kelompok\s+layanan\s+/i,'').trim();
// Mask name: keep first word + asterisks
const maskName = (s) => {
  if (!s || s === '-') return '-';
  const parts = s.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0) + '*'.repeat(Math.max(parts[0].length-1,3));
  return parts[0] + ' ' + parts.slice(1).map(p => p.charAt(0)+'*'.repeat(Math.max(p.length-1,2))).join(' ');
};

/* ─── Color Tokens ─────────────────────────────────────────────────────────── */
const LC = {
  Dasar:             { bar:'#10b981', badge:'bg-emerald-100 text-emerald-800', dot:'#10b981' },
  Madya:             { bar:'#3b82f6', badge:'bg-blue-100 text-blue-800',    dot:'#3b82f6' },
  Utama:             { bar:'#f59e0b', badge:'bg-amber-100 text-amber-800',  dot:'#f59e0b' },
  Paripurna:         { bar:'#8b5cf6', badge:'bg-violet-100 text-violet-800',dot:'#8b5cf6' },
  'Belum Ada Mapping':{ bar:'#94a3b8', badge:'bg-slate-100 text-slate-600', dot:'#94a3b8' },
};

/* ─── Pure SVG Ring ───────────────────────────────────────────────────────── */
function Ring({ data, total, size=160 }) {
  if (!data?.length || !total) return (
    <div className="flex items-center justify-center" style={{width:size,height:size}}>
      <span className="text-slate-300 text-xs">Tidak ada data</span>
    </div>
  );
  const cx=size/2, cy=size/2, R=size*0.42, ir=size*0.27;
  let cum = -Math.PI/2;
  const segs = data.map(d=>{
    const angle=(d.value/total)*2*Math.PI;
    const s=cum; cum+=angle; const e=cum;
    const x1=cx+R*Math.cos(s),y1=cy+R*Math.sin(s);
    const x2=cx+R*Math.cos(e),y2=cy+R*Math.sin(e);
    const xi1=cx+ir*Math.cos(e),yi1=cy+ir*Math.sin(e);
    const xi2=cx+ir*Math.cos(s),yi2=cy+ir*Math.sin(s);
    const lg=angle>Math.PI?1:0;
    return {path:`M${x1},${y1}A${R},${R} 0 ${lg},1 ${x2},${y2}L${xi1},${yi1}A${ir},${ir} 0 ${lg},0 ${xi2},${yi2}Z`,
            color:(LC[d.name]||LC['Belum Ada Mapping']).dot};
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segs.map((s,i)=><path key={i} d={s.path} fill={s.color} opacity={0.9}/>)}
      <text x={cx} y={cy-4} textAnchor="middle" fontSize={size*0.09} fontWeight="900" fill="#1e293b">{fmt(total)}</text>
      <text x={cx} y={cy+10} textAnchor="middle" fontSize={size*0.07} fill="#94a3b8">kasus</text>
    </svg>
  );
}

/* ─── Mini Bar Spark ──────────────────────────────────────────────────────── */
function MiniLevelBar({ ranap, rajal }) {
  const levels = LEVEL_ORDER.filter(l=>l!=='Belum Ada Mapping');
  const total = levels.reduce((s,lv)=>{
    return s + (ranap[lv]?.kasus||0) + (rajal[lv]?.kasus||0);
  },0);
  if(!total) return <div className="h-3 bg-slate-100 rounded-full"/>;
  return (
    <div className="flex h-3 rounded-full overflow-hidden gap-px">
      {levels.map(lv=>{
        const k=(ranap[lv]?.kasus||0)+(rajal[lv]?.kasus||0);
        if(!k) return null;
        const w=(k/total)*100;
        return <div key={lv} title={`${lv}: ${fmt(k)}`}
          style={{width:`${w}%`,background:LC[lv].dot}} />;
      })}
    </div>
  );
}

/* ─── Drill-Down Modal ────────────────────────────────────────────────────── */
function DrillDown({ group, rows, icdMap, config, onClose, onExport }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('patients'); // patients | icds
  const [page, setPage] = useState(0);
  const [rsMap, setRsMap] = useState({});
  const PER_PAGE = 50;

  const customTitle = typeof group === 'object' && group?.title ? group.title : null;
  const groupName = typeof group === 'string' ? group : group?.group;
  const filterLevel = typeof group === 'string' ? null : group?.level;

  useEffect(() => {
    fetch('./data/rs_map.json').then(r => r.json()).then(data => setRsMap(data)).catch(console.error);
  }, []);

  const matchedRows = useMemo(() => {
    if (!rows || !icdMap) return [];
    if (typeof group === 'object' && group?.filterFn) {
       return rows.filter(r => group.filterFn(r));
    }

    const levelValues = { 'Belum Ada Mapping':0, Dasar:1, Madya:2, Utama:3, Paripurna:4 };
    
    return rows.filter(row => {
      if (!row._meta) return false;
      if (row._meta.highestGroup !== groupName) return false;
      if (filterLevel && row._meta.highestLevelName !== filterLevel) return false;
      return true;
    });
  }, [rows, icdMap, group, groupName, filterLevel]);

  const filtered = useMemo(() => {
    if (!search) return matchedRows;
    const q = search.toLowerCase();
    return matchedRows.filter(r =>
      (r['SEP']||r['NO_SEP']||'').toLowerCase().includes(q) ||
      (r['DPJP']||'').toLowerCase().includes(q) ||
      (r['DIAGLIST']||'').toLowerCase().includes(q)
    );
  }, [matchedRows, search]);

  // ICD summary — scan both DIAGLIST and PROCLIST
  const icdSummary = useMemo(() => {
    const map = {};
    const inaTotal = parseFloat(matchedRows.reduce((s, r) => s + (parseFloat(r['TOTAL_TARIF'] || 0) || 0), 0));
    const idrgTotal = parseFloat(matchedRows.reduce((s, r) => s + (parseFloat(r['IDRG_TOTAL_TARIF'] || 0) || 0), 0));
    
    matchedRows.forEach(row => {
      const ina = parseFloat(row['TOTAL_TARIF'] || 0) || 0;
      const idrg = parseFloat(row['IDRG_TOTAL_TARIF'] || 0) || 0;
      const pGroup = row._meta?.highestGroup;
      const diagStr  = row['DIAGLIST'] || '';
      const procStr  = row['PROCLIST'] || '';
      const diaglist = diagStr.split(';').map(d => d.trim()).filter(Boolean);
      const proclist = procStr.split(';').map(p => p.trim()).filter(p => p && p !== '-' && p.toLowerCase() !== 'none');
      const allCodes = [...new Set([...diaglist, ...proclist])];
      
      allCodes.forEach(c => {
        const entries = icdMap.get(c) || icdMap.get(c.replace('.',''));
        if(entries){
          const hit = entries.find(e=>e.group===(groupName || pGroup)) || entries[0];
          if(hit){
            if (filterLevel && hit.level !== filterLevel) return;
            if(!map[c]) map[c]={code:c, desc:hit.desc, level:hit.level, group:hit.group, count:0, ina:0, idrg:0};
            map[c].count++;
            map[c].ina += ina;
            map[c].idrg += idrg;
          }
        }
      });
    });
    return Object.values(map).sort((a,b)=>b.count-a.count);
  }, [matchedRows, icdMap, group]);

  // Pre-compute totals once
  const totIna  = matchedRows.reduce((s,r)=>s+(parseFloat(r['TOTAL_TARIF'])||0),0);
  const totIdrg = matchedRows.reduce((s,r)=>s+(parseFloat(r['IDRG_TOTAL_TARIF'])||0),0);
  const totSel  = totIdrg - totIna;

    const copyTable = () => {
    if (tab === 'patients') {
      const headers = ["No", "Rumah Sakit", "SEP / No Klaim", "Nama Pasien", "DPJP", "Jenis", "Diagnosa Utama", "INA-CBG", "iDRG", "Selisih"];
      const r = matchedRows.map((r, i) => {
        const kodeRs = String(r['KODE_RS']||'').trim();
        const namaRs = rsMap[kodeRs] ? `${kodeRs} - ${rsMap[kodeRs]}` : kodeRs || '-';
        const sep = r['SEP']||r['NO_SEP']||r['NO_KLAIM']||'-';
        const patientName = maskName(String(r['NAMA']||r['NAMA_PASIEN']||r['nama']||'-'));
        const dpjp = maskName(r['DPJP']||'-');
        const mainDiag = (r['DIAGLIST']||'').split(';')[0]?.trim()||'-';
        const ina = parseFloat(r['TOTAL_TARIF'])||0;
        const idrg = parseFloat(r['IDRG_TOTAL_TARIF'])||0;
        const sel = idrg - ina;
        const jenis = String(r['PTD']||'').trim()==='1' ? 'Ranap' : 'Rajal';
        return [
          i+1, namaRs, sep, patientName, dpjp, jenis, mainDiag,
          `Rp ${ina.toLocaleString('id-ID')}`,
          `Rp ${idrg.toLocaleString('id-ID')}`,
          `${sel >= 0 ? '+' : ''}Rp ${sel.toLocaleString('id-ID')}`
        ];
      });
      copyToClipboardHtml(headers, r, `Data Pasien: ${dn(group)}`);
    } else {
      const headers = ["No", "Kode ICD", "Deskripsi", "Komp. RS", "Level ICD", "Status", "Frekuensi", "INA-CBG", "iDRG", "Selisih"];
      const r = icdSummary.map((d, i) => {
        const rsLevel = config && config[group] ? config[group] : 'Belum Ada Mapping';
        const rsLevelIdx = LEVEL_ORDER.indexOf(rsLevel);
        const icdLevelIdx = LEVEL_ORDER.indexOf(d.level);
        const isSesuai = rsLevel === 'Belum Ada Mapping' ? true : icdLevelIdx <= rsLevelIdx;
        const sel = d.idrg - d.ina;
        return [
          i+1, d.code, d.desc, rsLevel, d.level, isSesuai ? 'Sesuai' : 'Tidak Sesuai', d.count,
          `Rp ${d.ina.toLocaleString('id-ID')}`,
          `Rp ${d.idrg.toLocaleString('id-ID')}`,
          `${sel >= 0 ? '+' : ''}Rp ${sel.toLocaleString('id-ID')}`
        ];
      });
      copyToClipboardHtml(headers, r, `Ringkasan ICD: ${dn(group)}`);
    }
  };

  const exportToExcel = () => {
    let csv = "No,Rumah Sakit,SEP / No Klaim,Nama Pasien,DPJP,Jenis,Diagnosa Utama,Peringatan Kompetensi,INA-CBG,iDRG,Selisih\n";
    matchedRows.forEach((r, i) => {
      const kodeRs = String(r['KODE_RS']||'').trim();
      const namaRs = rsMap[kodeRs] ? `${kodeRs} - ${rsMap[kodeRs]}` : kodeRs || '-';
      const sep = r['SEP']||r['NO_SEP']||r['NO_KLAIM']||'-';
      const patientName = maskName(String(r['NAMA']||r['NAMA_PASIEN']||r['nama']||'-'));
      const dpjp = maskName(r['DPJP']||'-');
      const mainDiag = (r['DIAGLIST']||'').split(';')[0]?.trim()||'-';
      const ina = parseFloat(r['TOTAL_TARIF'])||0;
      const idrg = parseFloat(r['IDRG_TOTAL_TARIF'])||0;
      const sel = idrg - ina;
      const jenis = String(r['PTD']||'').trim()==='1' ? 'Ranap' : 'Rajal';

      // Compute warnings
      let warnings = [];
      const diagStr = r['DIAGLIST'] || '';
      const procStr = r['PROCLIST'] || '';
      const codes = [...diagStr.split(';'), ...procStr.split(';')].map(d=>d.trim()).filter(d=>d&&d!=='-'&&d.toLowerCase()!=='none');
      codes.forEach(c => {
        const eList = icdMap?.get(c) || icdMap?.get(c.replace('.',''));
        if (eList && eList.length > 0) {
           const hit = eList.find(x => x.group === groupName) || eList[0];
           if (hit && hit.level && hit.level !== 'Belum Ada Mapping') {
              let rsLevel = config[hit.group];
              if (!rsLevel) {
                 const noPrefix = hit.group.replace(/Kelompok Layanan /i, '').trim();
                 const matchingKey = Object.keys(config).find(k => k.replace(/Kelompok Layanan /i, '').trim().toLowerCase() === noPrefix.toLowerCase());
                 if (matchingKey) rsLevel = config[matchingKey];
              }
              rsLevel = rsLevel || 'Tidak Melayani';
              const icdIdx = LEVEL_ORDER.indexOf(hit.level);
              const rsIdx = LEVEL_ORDER.indexOf(rsLevel);
              if (icdIdx > -1 && (rsIdx === -1 || icdIdx > rsIdx)) {
                 warnings.push({ code: c, desc: hit.desc, level: hit.level, group: hit.group.replace(/Kelompok Layanan /i,'') });
              }
           }
        }
      });
      const uniqueWarnings = Array.from(new Map(warnings.map(item => [item.code, item])).values());
      const warningStr = uniqueWarnings.length > 0 ? uniqueWarnings.map(w => `${w.code} (${w.desc}): Butuh ${w.level} (${w.group})`).join(' | ') : 'Sesuai';

      csv += `${i+1},"${namaRs}","${sep}","${patientName}","${dpjp}","${jenis}","${mainDiag}","${warningStr}",${ina},${idrg},${sel}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `DrillDown_${dn(group)}.csv`;
    link.click();
  };

  const pages = Math.ceil(filtered.length/PER_PAGE);
  const pageData = filtered.slice(page*PER_PAGE, (page+1)*PER_PAGE);

  return (
    <div className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
           onClick={e=>e.stopPropagation()}>
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-50 to-white border-b border-slate-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-teal-600 font-black uppercase tracking-widest">
               {customTitle || `Drill-Down Detail ${filterLevel ? `(Level ${filterLevel})` : ''}`}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{fmt(matchedRows.length)} kasus terdampak</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={copyTable} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-sky-500 rounded-lg text-xs font-bold transition-colors">
              <Copy size={14}/> Copy Tabel
            </button>
            <button onClick={() => { 
              if(onExport) {
                const sheetICD = {
                  name: 'Ringkasan_ICD',
                  columns: [
                    { header: 'No', key: 'no', width: 5 },
                    { header: 'Kode ICD', key: 'code', width: 15 },
                    { header: 'Deskripsi', key: 'desc', width: 50 },
                    { header: 'Komp. RS', key: 'komprs', width: 20 },
                    { header: 'Level ICD', key: 'levelicd', width: 20 },
                    { header: 'Status', key: 'status', width: 15 },
                    { header: 'Frekuensi', key: 'freq', width: 10 },
                    { header: 'INA-CBG', key: 'ina', width: 20 },
                    { header: 'iDRG', key: 'idrg', width: 20 },
                    { header: 'Selisih', key: 'selisih', width: 20 }
                  ],
                  data: []
                };
                if (icdSummary) {
                  icdSummary.forEach((d, i) => {
                    const rsLevel = config && config[group] ? config[group] : 'Belum Ada Mapping';
                    const rsLevelIdx = LEVEL_ORDER.indexOf(rsLevel);
                    const icdLevelIdx = LEVEL_ORDER.indexOf(d.level);
                    const isSesuai = rsLevel === 'Belum Ada Mapping' ? true : icdLevelIdx <= rsLevelIdx;
            
                    sheetICD.data.push({
                      no: i + 1,
                      code: d.code,
                      desc: d.desc,
                      komprs: rsLevel,
                      levelicd: d.level,
                      status: isSesuai ? 'Sesuai' : 'Tidak Sesuai',
                      freq: d.count,
                      ina: d.ina,
                      idrg: d.idrg,
                      selisih: d.idrg - d.ina
                    });
                  });
                }

                const sheetPasien = {
                  name: 'Data_Pasien',
                  columns: [
                    { header: 'No', key: 'no', width: 5 },
                    { header: 'Rumah Sakit', key: 'rs', width: 30 },
                    { header: 'SEP / No Klaim', key: 'sep', width: 25 },
                    { header: 'Nama Pasien', key: 'nama', width: 30 },
                    { header: 'DPJP', key: 'dpjp', width: 30 },
                    { header: 'Jenis', key: 'jenis', width: 15 },
                    { header: 'Diagnosa Utama', key: 'diag', width: 20 },
                    { header: 'INA-CBG', key: 'ina', width: 20 },
                    { header: 'iDRG', key: 'idrg', width: 20 },
                    { header: 'Selisih', key: 'selisih', width: 20 }
                  ],
                  data: []
                };

                const maskName = (name) => {
                  if (!name || name === '-' || name.length < 3) return name;
                  const parts = name.split(' ');
                  return parts.map(p => {
                    if (p.length <= 2) return p;
                    return p.charAt(0) + '*'.repeat(p.length - 2) + p.charAt(p.length - 1);
                  }).join(' ');
                };

                rows.forEach((r, i) => {
                  const kodeRs = String(r['KODE_RS']||'').trim();
                  const namaRs = rsMap[kodeRs] ? `${kodeRs} - ${rsMap[kodeRs]}` : kodeRs || '-';
                  const sep = r['SEP']||r['NO_SEP']||r['NO_KLAIM']||'-';
                  const patientName = maskName(String(r['NAMA']||r['NAMA_PASIEN']||r['nama']||'-'));
                  const dpjp = maskName(r['DPJP']||'-');
                  const mainDiag = (r['DIAGLIST']||'').split(';')[0]?.trim()||'-';
                  const ina = parseFloat(r['TOTAL_TARIF'])||0;
                  const idrg = parseFloat(r['IDRG_TOTAL_TARIF'])||0;
                  const sel = idrg - ina;
                  const jenis = String(r['PTD']||'').trim()==='1' ? 'Ranap' : 'Rajal';

                  sheetPasien.data.push({
                    no: i + 1,
                    rs: namaRs,
                    sep: sep,
                    nama: patientName,
                    dpjp: dpjp,
                    jenis: jenis,
                    diag: mainDiag,
                    ina: ina,
                    idrg: idrg,
                    selisih: sel
                  });
                });

                onExport(dn(group), [sheetPasien, sheetICD]);
              }
            }} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-teal-500 rounded-lg text-xs font-bold transition-colors">
              <Download size={14}/> Download Excel
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X size={20}/>
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-5 border-b border-slate-100 divide-x divide-slate-100">
          {[
            { label:'Total Kasus',  val:fmt(matchedRows.length), sub:'pasien', color:'text-slate-800', bg:'' },
            { label:'Pendapatan INA-CBG', val:fmtRp(totIna),  sub:'tarif klaim', color:'text-blue-700',   bg:'bg-blue-50/50' },
            { label:'Pendapatan iDRG',   val:fmtRp(totIdrg), sub:'tarif iDRG',  color:'text-violet-700', bg:'bg-violet-50/50' },
            { label:'Selisih (iDRG−INA)', val:fmtRp(Math.abs(totSel)),
              sub: totSel>=0 ? '▲ iDRG lebih tinggi' : '▼ INA-CBG lebih tinggi',
              color: totSel>=0 ? 'text-emerald-600' : 'text-rose-600',
              bg: totSel>=0 ? 'bg-emerald-50/50' : 'bg-rose-50/50' },
            { label:'% Selisih vs INA', val: totIna>0 ? `${totSel>=0?'+':''}${(totSel/totIna*100).toFixed(1)}%` : '–',
              sub:'perbandingan tarif',
              color: totSel>=0 ? 'text-emerald-600' : 'text-rose-600',
              bg: totSel>=0 ? 'bg-emerald-50/30' : 'bg-rose-50/30' },
          ].map((s,i)=>(
            <div key={i} className={`p-3 text-center ${s.bg}`}>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">{s.label}</p>
              <p className={`text-lg font-black mt-1 ${s.color}`}>{s.val}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {[
            {id:'patients', icon:<Users size={14}/>, label:`Daftar Pasien (${fmt(matchedRows.length)})`},
            {id:'icds',     icon:<FileText size={14}/>, label:`Kode ICD (${icdSummary.length})`},
          ].map(t=>(
            <button key={t.id} onClick={()=>{setTab(t.id);setPage(0);}}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-black border-b-2 transition-colors ${tab===t.id ? 'border-teal-500 text-teal-700 bg-teal-50/50':'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {t.icon}{t.label}
            </button>
          ))}
          <div className="flex-1 flex items-center justify-end px-4">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari SEP / DPJP / ICD..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-400 outline-none w-60"/>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {tab==='patients' ? (
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  {['No','Rumah Sakit','SEP / No Klaim','Nama Pasien','DPJP','Jenis','Diagnosa Utama','Peringatan Kompetensi','Selisih'].map(h=>(
                    <th key={h} className="px-3 py-2.5 text-left font-black text-slate-500 uppercase text-[10px] border-b border-slate-200">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map((r,i)=>{
                  const kodeRs = String(r['KODE_RS']||'').trim();
                  const namaRs = rsMap[kodeRs] ? `${kodeRs} - ${rsMap[kodeRs]}` : kodeRs || '-';
                  const sep = r['SEP']||r['NO_SEP']||r['NO_KLAIM']||'-';
                  const patientName = maskName(String(r['NAMA']||r['NAMA_PASIEN']||r['nama']||'-'));
                  const dpjp = r['DPJP']||'-';
                  const mainDiag = (r['DIAGLIST']||'').split(';')[0]?.trim()||'-';
                  const ina = parseFloat(r['TOTAL_TARIF'])||0;
                  const idrg = parseFloat(r['IDRG_TOTAL_TARIF'])||0;
                  const sel = idrg - ina;
                  const isRanap = String(r['PTD']||'').trim()==='1';
                  
                  // Compute warnings
                  let warnings = [];
                  const diagStr = r['DIAGLIST'] || '';
                  const procStr = r['PROCLIST'] || '';
                  const codes = [...diagStr.split(';'), ...procStr.split(';')].map(d=>d.trim()).filter(d=>d&&d!=='-'&&d.toLowerCase()!=='none');
                  codes.forEach(c => {
                    const eList = icdMap?.get(c) || icdMap?.get(c.replace('.',''));
                    if (eList && eList.length > 0) {
                       const hit = eList.find(x => x.group === groupName) || eList[0];
                       if (hit && hit.level && hit.level !== 'Belum Ada Mapping') {
                          // Try to check rs level
                          let rsLevel = config[hit.group];
                          if (!rsLevel) {
                             const noPrefix = hit.group.replace(/Kelompok Layanan /i, '').trim();
                             const matchingKey = Object.keys(config).find(k => k.replace(/Kelompok Layanan /i, '').trim().toLowerCase() === noPrefix.toLowerCase());
                             if (matchingKey) rsLevel = config[matchingKey];
                          }
                          rsLevel = rsLevel || 'Tidak Melayani';
                          const icdIdx = LEVEL_ORDER.indexOf(hit.level);
                          const rsIdx = LEVEL_ORDER.indexOf(rsLevel);
                          if (icdIdx > -1 && (rsIdx === -1 || icdIdx > rsIdx)) {
                             warnings.push({ code: c, desc: hit.desc, level: hit.level, group: hit.group.replace(/Kelompok Layanan /i,'') });
                          }
                       }
                    }
                  });
                  const uniqueWarnings = Array.from(new Map(warnings.map(item => [item.code, item])).values());

                  return (
                    <tr key={i} className={`border-b border-slate-50 hover:bg-teal-50/30 transition-colors ${i%2===0?'':'bg-slate-50/20'}`}>
                      <td className="px-3 py-2 text-slate-400">{page*PER_PAGE+i+1}</td>
                      <td className="px-3 py-2 text-slate-600 max-w-[120px] truncate" title={namaRs}>{namaRs}</td>
                      <td className="px-3 py-2 font-mono font-bold text-slate-700">{sep}</td>
                      <td className="px-3 py-2 text-slate-600 max-w-[140px] truncate" title="(nama disamarkan)">{patientName}</td>
                      <td className="px-3 py-2 text-slate-600 max-w-[140px] truncate" title="(nama disamarkan)">{maskName(dpjp)}</td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${isRanap?'bg-blue-100 text-blue-700':'bg-orange-100 text-orange-700'}`}>
                          {isRanap?'Ranap':'Rajal'}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-700 max-w-[120px] truncate" title={r['DIAGLIST']||''}>{mainDiag}</td>
                      <td className="px-3 py-2 text-[10px]">
                        {uniqueWarnings.length > 0 ? (
                           <div className="flex flex-col gap-1.5">
                             {uniqueWarnings.map((w, wi) => (
                               <div key={wi} className="bg-rose-50 border border-rose-100 rounded p-1.5 flex flex-col gap-0.5">
                                 <div className="flex items-start justify-between gap-2">
                                   <span className="font-bold text-rose-700">{w.code}</span>
                                   <span className="text-[9px] font-black bg-rose-200/50 text-rose-800 px-1 py-0.5 rounded whitespace-nowrap">Butuh {w.level}</span>
                                 </div>
                                 <p className="text-[9.5px] text-rose-600/90 leading-tight">{w.desc}</p>
                                 <p className="text-[9px] text-rose-500 font-medium italic mt-0.5">{w.group}</p>
                               </div>
                             ))}
                           </div>
                        ) : (
                           <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Sesuai</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-black">
                        <span className={sel>=0?'text-emerald-600':'text-rose-600'}>{sel>=0?'+':''}{fmtRp(sel)}</span>
                      </td>
                    </tr>
                  );
                })}
                {pageData.length===0 && (
                  <tr><td colSpan={8} className="py-12 text-center text-slate-400">Tidak ada data ditemukan</td></tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  {['No','Kode ICD','Deskripsi','Komp. RS','Level Kompetensi','Status','Frekuensi','INA-CBG','iDRG','Selisih'].map(h=>(
                    <th key={h} className={`px-4 py-2.5 text-left font-black text-slate-500 uppercase text-[10px] border-b border-slate-200 ${h==='INA-CBG'?'text-blue-600':h==='iDRG'?'text-violet-600':h==='Selisih'?'text-slate-600':''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(search ? icdSummary.filter(d=>d.code.toLowerCase().includes(search.toLowerCase())) : icdSummary).map((d,i)=>{
                  const c   = LC[d.level]||LC['Belum Ada Mapping'];
                  const sel = d.idrg - d.ina;
                  
                  const actualGroupName = d.group || (typeof group === 'string' ? group : group?.groupName || groupName);
                  let rsLevel = 'Campuran/Tidak Spesifik';
                  if (actualGroupName && config) {
                    if (config[actualGroupName]) {
                      rsLevel = config[actualGroupName];
                    } else {
                      const noPrefix = actualGroupName.replace(/Kelompok Layanan /i, '').trim();
                      const matchingKey = Object.keys(config).find(k => k.replace(/Kelompok Layanan /i, '').trim().toLowerCase() === noPrefix.toLowerCase());
                      if (matchingKey) rsLevel = config[matchingKey];
                    }
                  }
                  
                  const rsLevelIdx = LEVEL_ORDER.indexOf(rsLevel);
                  const icdLevelIdx = LEVEL_ORDER.indexOf(d.level);
                  const isSesuai = rsLevel === 'Campuran/Tidak Spesifik' ? true : (rsLevel === 'Belum Ada Mapping' ? true : icdLevelIdx <= rsLevelIdx);
                  const cRs = LC[rsLevel] || LC['Belum Ada Mapping'];

                  return (
                    <tr key={i} className={`border-b border-slate-50 hover:bg-teal-50/30 ${i%2===0?'':'bg-slate-50/20'}`}>
                      <td className="px-4 py-2.5 text-slate-400 w-8">{i+1}</td>
                      <td className="px-4 py-2.5 font-mono font-black text-slate-800">{d.code}</td>
                      <td className="px-4 py-2.5 text-slate-600 max-w-[200px] truncate" title={d.desc}>{d.desc}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${cRs.badge}`}>{rsLevel}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${c.badge}`}>{d.level}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        {isSesuai ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700">Sesuai</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700">Tidak Sesuai</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-2 max-w-[80px]">
                            <div className="h-2 rounded-full" style={{width:`${icdSummary[0]?.count ? (d.count/icdSummary[0].count)*100 : 0}%`,background:c.dot}}/>
                          </div>
                          <span className="font-black text-slate-800 w-12 text-right">{fmt(d.count)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-bold text-blue-700 text-right">{fmtRp(d.ina)}</td>
                      <td className="px-4 py-2.5 font-bold text-violet-700 text-right">{fmtRp(d.idrg)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`font-black text-xs px-1.5 py-0.5 rounded ${sel>=0?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-700'}`}>
                          {sel>=0?'+':''}{fmtRp(sel)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination (patient tab only) */}
        {tab==='patients' && pages>1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
            <span className="text-xs text-slate-500">Halaman {page+1} dari {pages} · {fmt(filtered.length)} data</span>
            <div className="flex gap-2">
              <button disabled={page===0} onClick={()=>setPage(p=>p-1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white transition-colors font-bold">← Prev</button>
              <button disabled={page===pages-1} onClick={()=>setPage(p=>p+1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white transition-colors font-bold">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Dashboard ──────────────────────────────────────────────────────── */

function Top10Table({ title, data }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-4">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
        <h3 className="font-black text-sm text-slate-800">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[500px]">
          <thead>
            <tr className="bg-slate-100 text-slate-500 text-[10px] uppercase whitespace-nowrap">
              <th className="px-3 py-2 text-left w-8">No</th>
              <th className="px-3 py-2 text-left w-16">ICD</th>
              <th className="px-3 py-2 text-left w-48">Deskripsi</th>
              <th className="px-3 py-2 text-right">Kasus</th>
              <th className="px-3 py-2 text-right text-blue-600">INA-CBG</th>
              <th className="px-3 py-2 text-right text-violet-600">iDRG</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 whitespace-nowrap">
                <td className="px-3 py-2 text-slate-400 font-bold">{i + 1}</td>
                <td className="px-3 py-2 font-mono font-black text-slate-800">{d.code}</td>
                <td className="px-3 py-2 text-slate-600 truncate max-w-[150px] 2xl:max-w-[200px]" title={d.desc}>{d.desc}</td>
                <td className="px-3 py-2 text-right font-black text-slate-700">{fmt(d.kasus)}</td>
                <td className="px-3 py-2 text-right text-blue-600 font-bold">{fmtRp(d.ina)}</td>
                <td className="px-3 py-2 text-right text-violet-600 font-bold">{fmtRp(d.idrg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetailKelompokTable({ data, onDrillDown }) {
  if (!data || data.length === 0) return null;
  const sorted = [...data].sort((a,b) => {
    if (a.name === 'KASUS BELUM MAPPING') return 1;
    if (b.name === 'KASUS BELUM MAPPING') return -1;
    return b.totalKasus - a.totalKasus;
  });
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
        <h3 className="font-black text-sm text-slate-800">Detail Per Kelompok Layanan</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 text-[10px] uppercase">
              <th className="px-3 py-3 text-left w-[250px] font-black border-r border-slate-200">Kelompok Layanan</th>
              <th className="px-3 py-3 text-right font-black border-r border-slate-200">Total Kasus</th>
              <th className="px-3 py-3 text-right font-black bg-emerald-50/50">Sesuai (Kasus)</th>
              <th className="px-3 py-3 text-right font-black bg-emerald-50/50">Sesuai (Tarif INA)</th>
              <th className="px-3 py-3 text-right font-black bg-emerald-50/50 border-r border-emerald-100">Sesuai (iDRG)</th>
              <th className="px-3 py-3 text-right font-black bg-rose-50/50">Tidak Sesuai (Kasus)</th>
              <th className="px-3 py-3 text-right font-black bg-rose-50/50">Tidak Sesuai (INA)</th>
              <th className="px-3 py-3 text-right font-black bg-rose-50/50">Potensi Loss (iDRG)</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d, i) => (
              <tr key={i} className="border-b border-slate-50">
                <td className="px-3 py-2.5 font-bold text-slate-700 cursor-pointer hover:bg-slate-100" onClick={() => onDrillDown && onDrillDown(d.name)}>{d.name}</td>
                <td className="px-3 py-2.5 text-right font-black text-slate-800 cursor-pointer hover:bg-slate-100" onClick={() => onDrillDown && onDrillDown(d.name)}>{fmt(d.totalKasus)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-emerald-700 cursor-pointer hover:bg-emerald-100/50" onClick={() => onDrillDown && onDrillDown({ title: `Detail ${dn(d.name)} (Sesuai)`, filterFn: r => r._meta?.highestGroup === d.name && !r._meta?.isOutsideOverall })}>{fmt(d.sesuaiKasus)}</td>
                <td className="px-3 py-2.5 text-right text-emerald-600">{fmtRp(d.sesuaiIna)}</td>
                <td className="px-3 py-2.5 text-right text-emerald-600 font-bold">{fmtRp(d.sesuaiIdrg)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-rose-700 cursor-pointer hover:bg-rose-100/50" onClick={() => onDrillDown && onDrillDown({ title: `Detail ${dn(d.name)} (Tidak Sesuai)`, filterFn: r => r._meta?.highestGroup === d.name && r._meta?.isOutsideOverall })}>{fmt(d.lossKasus)}</td>
                <td className="px-3 py-2.5 text-right text-rose-600">{fmtRp(d.lossIna)}</td>
                <td className="px-3 py-2.5 text-right text-rose-600 font-bold">{fmtRp(d.lossIdrg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


export default function KompetensiDashboard({ rows, onBack }) {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState('overview');  // overview | table1 | table2
  const [drill,      setDrill]      = useState(null);        // group name for drill-down
  const [icdMap,     setIcdMap]     = useState(null);
  const [icdDescMap, setIcdDescMap] = useState(null);
  const [search,     setSearch]     = useState('');
  const [config,     setConfig]     = useState({});

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingExport, setPendingExport] = useState(null);

  const handleExportTop10 = () => {
    if (!data || !data.top10) return;
    
    const formatSheet = (title, tableData) => {
      const sheet = {
        name: title.substring(0, 31),
        columns: [
          { header: 'No', key: 'no', width: 5 },
          { header: 'Kode ICD', key: 'code', width: 15 },
          { header: 'Deskripsi', key: 'desc', width: 50 },
          { header: 'Kasus', key: 'kasus', width: 10 },
          { header: 'INA-CBG', key: 'ina', width: 20 },
          { header: 'iDRG', key: 'idrg', width: 20 }
        ],
        data: []
      };
      
      if (tableData) {
        tableData.forEach((d, i) => {
          sheet.data.push({
            no: i + 1,
            code: d.code,
            desc: d.desc,
            kasus: d.kasus,
            ina: d.ina,
            idrg: d.idrg
          });
        });
      }
      return sheet;
    };

    setPendingExport({
      name: 'Top_10_Kompetensi',
      sheets: [
        formatSheet('Diag Sesuai', data.top10.diagSesuai),
        formatSheet('Tindakan Sesuai', data.top10.procSesuai),
        formatSheet('Diag Tidak Sesuai', data.top10.diagTidakSesuai),
        formatSheet('Tindakan Tidak Sesuai', data.top10.procTidakSesuai)
      ]
    });
    setShowPasswordModal(true);
  };

    const handleExportDrillDown = (title, sheetsArray) => {
    setPendingExport({
      name: 'Rincian_' + String(title).replace(/[^a-zA-Z0-9]/g, '_'),
      sheets: sheetsArray
    });
    setShowPasswordModal(true);
  };


  useEffect(()=>{
    (async()=>{
      setLoading(true);
      try {
        const cfg  = localStorage.getItem(CONFIG_KEY);
        const parsedCfg = cfg ? JSON.parse(cfg) : {};
        setConfig(parsedCfg);
        const res  = await analyzeCompetency(rows, parsedCfg);
        setData(res);
        // expose icdMap and icdDescMap for drill-down
        const { _icdMap, _icdDescMap } = res;
        if (_icdMap) setIcdMap(_icdMap);
        if (_icdDescMap) setIcdDescMap(_icdDescMap);
      } catch(e){ console.error(e); }
      finally{ setLoading(false); }
    })();
  },[rows]);

  const donutData = useMemo(()=>{
    if(!data) return [];
    return LEVEL_ORDER.map(lv=>({name:lv,value:data.levelDistribution[lv]||0})).filter(d=>d.value>0);
  },[data]);

  if(loading||!data) return createPortal(<div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-teal-500/30 border-t-teal-400 rounded-full animate-spin"/>
        <ShieldAlert className="absolute inset-0 m-auto text-teal-400" size={32}/>
      </div>
      <h2 className="text-white font-black text-xl mt-6">Menganalisis Kompetensi Layanan</h2>
      <p className="text-slate-400 text-sm mt-2">Memproses {(rows||[]).length.toLocaleString()} baris data…</p>
    </div>, document.body);

  const pctOut = data.totalPatients>0
    ? (data.patientsOutsideCompetency/data.totalPatients*100).toFixed(1) : 0;

  // Tabel 1 totals
  const t1 = LEVEL_ORDER.reduce((a,lv)=>{
    const s=data.levelStats[lv]||{};
    return { sk:a.sk+(s.sesuaiKasus||0), si:a.si+(s.sesuaiIna||0), sd:a.sd+(s.sesuaiIdrg||0),
             lk:a.lk+(s.lossKasus||0),   li:a.li+(s.lossIna||0),   ld:a.ld+(s.lossIdrg||0) };
  },{sk:0,si:0,sd:0,lk:0,li:0,ld:0});

  // Groups sorted: data first, unknown last. KASUS BELUM MAPPING and LAYANAN LAINNYA at the bottom.
  const sortedGroups = [
    ...data.groupTableRows.filter(r=>r.hasData).sort((a,b)=>{
       const an = dn(a.name).toUpperCase();
       const bn = dn(b.name).toUpperCase();
       const aBot = an === 'KASUS BELUM MAPPING' || an === 'LAYANAN LAINNYA';
       const bBot = bn === 'KASUS BELUM MAPPING' || bn === 'LAYANAN LAINNYA';
       if (aBot && !bBot) return 1;
       if (!aBot && bBot) return -1;
       return b.totalKasus - a.totalKasus;
    }),
    ...data.groupTableRows.filter(r=>!r.hasData),
  ];

  const filteredGroups = search
    ? sortedGroups.filter(r=>dn(r.name).toLowerCase().includes(search.toLowerCase()))
    : sortedGroups;

  // Tabel 2 grand total
  const gt = sortedGroups.filter(r=>r.hasData).reduce(
    (a,r)=>({totalKasus:a.totalKasus+r.totalKasus, totalIna:a.totalIna+r.totalIna,
              totalIdrg:a.totalIdrg+r.totalIdrg, selisih:a.selisih+r.selisih}),
    {totalKasus:0,totalIna:0,totalIdrg:0,selisih:0}
  );

  const TABS = [
    {id:'overview', icon:<BarChart3 size={14}/>, label:'Overview'},
    {id:'table1',   icon:<TableIcon size={14}/>, label:'Tabel Distribusi Level'},
    {id:'table2',   icon:<Grid3X3 size={14}/>,   label:'Per Kelompok Layanan'},
    {id:'laporan',  icon:<FileSpreadsheet size={14}/>, label:'Tabel Laporan'},
  ];

  return createPortal(<div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 flex flex-col" style={{fontFamily:'inherit'}}>

      {/* ── Sticky Header ── */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-5 py-3 shrink-0 z-20 shadow-sm">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 transition-colors shrink-0 text-slate-500">
            <ArrowLeft size={20}/>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-teal-600" size={18}/>
              <h1 className="font-black text-base text-slate-800">Analisis Kompetensi Layanan</h1>
              <span className="text-[10px] bg-teal-50 text-teal-600 border border-teal-200 px-2 py-0.5 rounded-full font-black shadow-sm">LIVE</span>
            </div>
          </div>
          {/* Tab nav in header */}
          <div className="flex gap-1">
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${tab===t.id?'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20':'text-slate-500 hover:text-teal-600 hover:bg-teal-50'}`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
<div className="max-w-screen-2xl mx-auto w-full space-y-5">

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {label:'Total Kasus', val:fmt(data.totalPatients), sub:fmtRp(data.totalTarifInacbg)+' INA-CBG', color:'from-white to-slate-50 border-slate-200 text-slate-800', subColor:'text-slate-500', icon:<Activity size={20} className="text-slate-400"/>},
            {label:'Sesuai Kompetensi', val:fmt(data.patientsWithinCompetency), sub:`${(100-pctOut)}% dari total · ${fmtRp(data.tarifWithinCompetency)}`, color:'from-emerald-50 to-emerald-100/30 border-emerald-200 text-emerald-900', subColor:'text-emerald-700/80', icon:<CheckCircle size={20} className="text-emerald-600"/>},
            {label:'Di Luar Kompetensi', val:fmt(data.patientsOutsideCompetency), sub:`${pctOut}% dari total · ${fmtRp(data.tarifOutsideCompetency)}`, color:'from-rose-50 to-rose-100/30 border-rose-200 text-rose-900', subColor:'text-rose-700/80', icon:<AlertCircle size={20} className="text-rose-600"/>},
            {label:'Potensi Loss Total', val:fmtRp(data.tarifOutsideCompetency), sub:'Tarif INA-CBG kebocoran', color:'from-amber-50 to-amber-100/30 border-amber-200 text-amber-900', subColor:'text-amber-700/80', icon:<TrendingDown size={20} className="text-amber-600"/>},
          ].map((k,i)=>(
            <div key={i} className={`bg-gradient-to-br ${k.color} border rounded-2xl p-4 shadow-sm`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{k.label}</p>
                {k.icon}
              </div>
              <p className="text-2xl font-black">{k.val}</p>
              <p className={`text-[11px] font-medium mt-0.5 ${k.subColor}`}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Tarif Summary Bar ── */}
        <div className="grid grid-cols-3 gap-3">
          {[{
            label:'Total Pendapatan INA-CBG', val: fmtRp(data.totalTarifInacbg),
            sub: `${fmt(data.totalPatients)} kasus`,
            accent:'border-blue-500', valColor:'text-blue-700', bg:'bg-white',
            icon:<span className="text-[9px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">INA-CBG</span>
          },{
            label:'Total Pendapatan iDRG', val: fmtRp(data.groupTableRows.reduce((s,r)=>s+r.totalIdrg,0)),
            sub: 'Tarif versi iDRG',
            accent:'border-violet-500', valColor:'text-violet-700', bg:'bg-white',
            icon:<span className="text-[9px] font-black text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded">iDRG</span>
          },{
            label:'Selisih iDRG vs INA-CBG',
            val: (() => { const t=data.groupTableRows.reduce((s,r)=>s+r.totalIdrg,0)-data.totalTarifInacbg; return (t>=0?'+':'')+fmtRp(t); })(),
            sub: (() => { const t=data.groupTableRows.reduce((s,r)=>s+r.totalIdrg,0); const sel=t-data.totalTarifInacbg; return data.totalTarifInacbg>0?`${sel>=0?'+':''}${(sel/data.totalTarifInacbg*100).toFixed(1)}% vs INA-CBG`:'-'; })(),
            accent: (() => { const t=data.groupTableRows.reduce((s,r)=>s+r.totalIdrg,0)-data.totalTarifInacbg; return t>=0?'border-emerald-500':'border-rose-500'; })(),
            valColor: (() => { const t=data.groupTableRows.reduce((s,r)=>s+r.totalIdrg,0)-data.totalTarifInacbg; return t>=0?'text-emerald-600':'text-rose-600'; })(),
            bg:'bg-white',
            icon: (() => { const t=data.groupTableRows.reduce((s,r)=>s+r.totalIdrg,0)-data.totalTarifInacbg; return <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${t>=0?'text-emerald-600 bg-emerald-50':'text-rose-600 bg-rose-50'}`}>{t>=0?'▲ Surplus':'▼ Defisit'}</span>; })()
          }].map((k,i)=>(
            <div key={i} className={`${k.bg} rounded-2xl p-5 shadow-sm border-l-4 ${k.accent} border border-slate-100`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{k.label}</p>
                {k.icon}
              </div>
              <p className={`text-2xl font-black mt-2 ${k.valColor}`}>{k.val}</p>
              <p className="text-[11px] text-slate-400 mt-1">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* ══════════════ OVERVIEW TAB ══════════════ */}
        {tab==='overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left: Donut + legend */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <h3 className="font-black text-slate-800 text-sm mb-4">Distribusi Level Kompetensi</h3>
              <div className="flex flex-col items-center gap-4">
                <Ring data={donutData} total={data.totalPatients} size={200}/>
                <div className="w-full space-y-2">
                  {donutData.map(d=>{
                    const c=LC[d.name]||LC['Belum Ada Mapping'];
                    const pct=(d.value/data.totalPatients*100).toFixed(1);
                    return (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:c.dot}}/>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-700">{d.name}</span>
                            <span className="text-xs font-black text-slate-800">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full mt-0.5">
                            <div className="h-1.5 rounded-full" style={{width:`${pct}%`,background:c.dot}}/>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 w-12 text-right">{fmt(d.value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Group cards 2 col */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-800 text-sm">24 Kelompok Layanan  <span className="text-slate-400 font-medium text-xs">(klik untuk detail)</span></h3>
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari kelompok..."
                    className="pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-400 outline-none w-44"/>
                </div>
              </div>
              <div style={{ width: '100%', height: 550, marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height={550}>
                  <BarChart
                    layout="vertical"
                    data={filteredGroups.filter(r=>r.hasData || search).map(r => {
                      let sesuai = 0;
                      let tidakSesuai = 0;
                      let rsLevel = 'Campuran/Tidak Spesifik';
                      if (config) {
                        if (config[r.name]) rsLevel = config[r.name];
                        else {
                          const noPrefix = r.name.replace(/Kelompok Layanan /i, '').trim();
                          const matchingKey = Object.keys(config).find(k => k.replace(/Kelompok Layanan /i, '').trim().toLowerCase() === noPrefix.toLowerCase());
                          if (matchingKey) rsLevel = config[matchingKey];
                        }
                      }
                      const rsIdx = LEVEL_ORDER.indexOf(rsLevel);
                      
                      [...LEVEL_ORDER, 'unknown'].forEach(lv => {
                         const kasus = (r.ranap[lv]?.kasus || 0) + (r.rajal[lv]?.kasus || 0);
                         if (lv === 'unknown' || rsLevel === 'Campuran/Tidak Spesifik' || rsLevel === 'Belum Ada Mapping') {
                             sesuai += kasus;
                         } else {
                             const lvIdx = LEVEL_ORDER.indexOf(lv);
                             if (lvIdx <= rsIdx) sesuai += kasus;
                             else tidakSesuai += kasus;
                         }
                      });
                      
                      return { ...r, sesuaiKasus: sesuai, lossKasus: tidakSesuai };
                    })}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    barSize={16}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{fontSize: 10, fill: '#94a3b8'}} stroke="#cbd5e1" axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={160} tick={{fontSize: 10, fontWeight: 700, fill: '#475569'}} axisLine={false} tickLine={false} tickFormatter={(val) => {
                      const s = dn(val);
                      return s.length > 22 ? s.substring(0, 22) + '...' : s;
                    }} />
                    <RechartsTooltip
                      cursor={{fill: '#f8fafc'}}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          const selPct = d.selisihPct;
                          return (
                            <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-200 min-w-[200px]">
                              <p className="font-black text-slate-800 mb-1 leading-tight">{dn(d.name)}</p>
                              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                                <span className="text-[10px] text-slate-500">Total Kasus</span>
                                <span className="font-black text-slate-700">{fmt(d.totalKasus)}</span>
                              </div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Sesuai Kompetensi</span>
                                <span className="font-black text-emerald-700">{fmt(d.sesuaiKasus)}</span>
                              </div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Di Luar Kompetensi</span>
                                <span className="font-black text-rose-700">{fmt(d.lossKasus)}</span>
                              </div>
                              <div className="pt-2 mt-1 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-[10px] text-slate-500">Selisih Tarif</span>
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${selPct>=0?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-700'}`}>
                                  {selPct>=0?'+':''}{selPct.toFixed(1)}%
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-400 mt-2 text-center">(Klik bar untuk melihat detail pasien)</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                    <Bar dataKey="sesuaiKasus" name="Sesuai Kompetensi" stackId="a" fill="#10b981" radius={[0,0,0,0]} onClick={(data) => setDrill(data.name)} style={{cursor:'pointer'}} />
                    <Bar dataKey="lossKasus" name="Di Luar Kompetensi" stackId="a" fill="#f43f5e" radius={[0,4,4,0]} onClick={(data) => setDrill(data.name)} style={{cursor:'pointer'}} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                {filteredGroups.filter(r=>!r.hasData).length>0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Belum Ada Klaim</p>
                    <div className="flex flex-wrap gap-1.5">
                      {filteredGroups.filter(r=>!r.hasData).map(r=>(
                        <span key={r.name} className="text-[10px] bg-slate-100 text-slate-400 px-2 py-1 rounded-lg font-medium">{dn(r.name)}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* TOP 10 TABLES */}
            <div className="mt-8 lg:col-span-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-slate-800">Top 10 Diagnosa & Tindakan</h3>
                <button onClick={handleExportTop10} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 900 }}>
                  <Download size={14} /> Download Excel
                </button>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Top10Table title="Top 10 Diagnosa Sesuai Kompetensi RS" data={data.top10?.diagSesuai} />
                <Top10Table title="Top 10 Tindakan Sesuai Kompetensi RS" data={data.top10?.procSesuai} />
                <Top10Table title="Top 10 Diagnosa Tidak Sesuai Kompetensi RS" data={data.top10?.diagTidakSesuai} />
                <Top10Table title="Top 10 Tindakan Tidak Sesuai Kompetensi RS" data={data.top10?.procTidakSesuai} />
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TABLE 1 TAB ══════════════ */}
        {tab==='table1' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="font-black text-slate-800">Distribusi Tingkat Tuntutan Layanan (ICD)</h2>
              <p className="text-xs text-slate-400 mt-1">Kasus dikategorikan berdasarkan level ICD tertinggi dalam DIAGLIST</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[820px]">
                <thead>
                  <tr className="bg-slate-50">
                    <th rowSpan={2} className="px-4 py-3 text-left font-black text-slate-500 text-[10px] uppercase border-b-2 border-slate-200 border-r">Tingkat Tuntutan</th>
                    <th colSpan={3} className="px-3 py-2 text-center font-black text-emerald-700 text-[10px] uppercase bg-emerald-50 border-b border-emerald-100 border-r">✓ Sesuai Kompetensi</th>
                    <th colSpan={3} className="px-3 py-2 text-center font-black text-rose-700 text-[10px] uppercase bg-rose-50 border-b border-rose-100 border-r">✗ Potensi Loss</th>
                    <th rowSpan={2} className="px-4 py-3 text-center font-black text-slate-500 text-[10px] uppercase border-b-2 border-slate-200">% Loss</th>
                  </tr>
                  <tr className="bg-slate-50 text-[10px]">
                    {['Kasus','INA-CBG','iDRG'].map(h=><th key={`s${h}`} className="px-3 py-2 text-center font-black text-emerald-600 bg-emerald-50/70 border-b border-slate-200">{h}</th>)}
                    {['Kasus','INA-CBG','iDRG'].map(h=><th key={`l${h}`} className={`px-3 py-2 text-center font-black text-rose-600 bg-rose-50/70 border-b border-slate-200 ${h==='iDRG'?'border-r':''}`}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {LEVEL_ORDER.map((lv,i)=>{
                    const s=data.levelStats[lv]||{};
                    const tot=(s.sesuaiKasus||0)+(s.lossKasus||0);
                    const pct=tot>0?((s.lossKasus||0)/tot*100).toFixed(1):'0.0';
                    const c=LC[lv]||LC['Belum Ada Mapping'];
                    return (
                      <tr key={lv} className={`border-b border-slate-100 ${i%2===0?'bg-white':'bg-slate-50/30'} hover:bg-teal-50/20 transition-colors`}>
                        <td className="px-4 py-3 font-bold border-r border-slate-100">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-black ${c.badge}`}>
                            <span className="w-2 h-2 rounded-full" style={{background:c.dot}}/>
                            {lv}
                          </span>
                        </td>
                        <td onClick={()=>setDrill({ title:`Distribusi Level ${lv} (Sesuai)`, filterFn:r=>r._meta?.highestLevelName===lv && !r._meta?.isOutsideOverall })} className="cursor-pointer hover:bg-emerald-100/50 px-3 py-3 text-right font-black text-emerald-700">{fmt(s.sesuaiKasus)}</td>
                        <td className="px-3 py-3 text-right text-emerald-600">{fmtRp(s.sesuaiIna)}</td>
                        <td className="px-3 py-3 text-right text-emerald-600 border-r border-slate-100">{fmtRp(s.sesuaiIdrg)}</td>
                        <td onClick={()=>setDrill({ title:`Distribusi Level ${lv} (Potensi Loss)`, filterFn:r=>r._meta?.highestLevelName===lv && r._meta?.isOutsideOverall })} className="cursor-pointer hover:bg-rose-100/50 px-3 py-3 text-right font-black text-rose-700">{fmt(s.lossKasus)}</td>
                        <td className="px-3 py-3 text-right text-rose-600">{fmtRp(s.lossIna)}</td>
                        <td className="px-3 py-3 text-right text-rose-600 border-r border-slate-100">{fmtRp(s.lossIdrg)}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`px-2 py-1 rounded-lg font-black text-[11px] ${parseFloat(pct)>30?'bg-rose-100 text-rose-700':parseFloat(pct)>10?'bg-amber-100 text-amber-700':'bg-slate-100 text-slate-600'}`}>
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gradient-to-r from-slate-800 to-slate-900 text-white text-[11px] font-black">
                    <td className="px-4 py-3 border-r border-slate-600">TOTAL</td>
                    <td className="px-3 py-3 text-right">{fmt(t1.sk)}</td>
                    <td className="px-3 py-3 text-right">{fmtRp(t1.si)}</td>
                    <td className="px-3 py-3 text-right border-r border-slate-600">{fmtRp(t1.sd)}</td>
                    <td className="px-3 py-3 text-right text-rose-300">{fmt(t1.lk)}</td>
                    <td className="px-3 py-3 text-right text-rose-300">{fmtRp(t1.li)}</td>
                    <td className="px-3 py-3 text-right text-rose-300 border-r border-slate-600">{fmtRp(t1.ld)}</td>
                    <td className="px-3 py-3 text-center text-amber-300">
                      {(t1.sk+t1.lk)>0?((t1.lk/(t1.sk+t1.lk))*100).toFixed(1):0}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <DetailKelompokTable data={data.groupDetails} onDrillDown={setDrill} />
          </div>
        )}

        {/* ══════════════ TABLE 2 TAB ══════════════ */}
        {tab==='table2' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-black text-slate-800">Per Kelompok Layanan RS</h2>
                <p className="text-xs text-slate-400 mt-1">Klik baris untuk melihat detail pasien & ICD · RI=Rawat Inap, RJ=Rawat Jalan</p>
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari kelompok..."
                  className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-400 outline-none w-48"/>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-[10px] border-y border-slate-200">
                    <th className="px-3 py-3 text-left font-black w-6 border-r border-slate-200">No</th>
                    <th className="px-4 py-3 text-left font-black border-r border-slate-200">Kelompok Layanan</th>
                    <th colSpan={2} className="px-3 py-3 text-center font-black border-r border-slate-200">Jumlah Kasus</th>
                    <th colSpan={2} className="px-3 py-3 text-center font-black border-r border-slate-200 bg-blue-50/50">Tarif INA-CBG</th>
                    <th colSpan={2} className="px-3 py-3 text-center font-black border-r border-slate-200 bg-violet-50/50">Tarif iDRG</th>
                    <th colSpan={2} className="px-3 py-3 text-center font-black border-r border-slate-200">Selisih</th>
                    <th className="px-3 py-3 text-center font-black border-r border-slate-200">Level Mix</th>
                    <th className="px-3 py-3 text-center font-black">Detail</th>
                  </tr>
                  <tr className="bg-slate-100/50 text-slate-500 text-[10px] border-b border-slate-200">
                    <th className="border-r border-slate-200"/><th className="border-r border-slate-200"/>
                    <th className="px-3 py-1.5 text-center border-r border-slate-200">RI</th>
                    <th className="px-3 py-1.5 text-center border-r border-slate-200">RJ</th>
                    <th className="px-3 py-1.5 text-center border-r border-slate-200 text-blue-600 bg-blue-50/30">RI</th>
                    <th className="px-3 py-1.5 text-center border-r border-slate-200 text-blue-600 bg-blue-50/30">RJ</th>
                    <th className="px-3 py-1.5 text-center border-r border-slate-200 text-violet-600 bg-violet-50/30">RI</th>
                    <th className="px-3 py-1.5 text-center border-r border-slate-200 text-violet-600 bg-violet-50/30">RJ</th>
                    <th className="px-3 py-1.5 text-center border-r border-slate-200">Rp</th>
                    <th className="px-3 py-1.5 text-center border-r border-slate-200">%</th>
                    <th className="border-r border-slate-200"/><th/>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.filter(r=>r.hasData).map((r,i)=>{
                    const selPct=r.selisihPct;
                    return (
                      <tr key={r.name}
                        onClick={()=>setDrill(r.name)}
                        className={`border-b border-slate-100 cursor-pointer transition-colors ${i%2===0?'bg-white':'bg-slate-50/30'} hover:bg-teal-50/40 hover:border-teal-200`}>
                        <td className="px-3 py-2.5 text-slate-400 text-center">{i+1}</td>
                        <td className="px-4 py-2.5">
                          <div className="font-bold text-slate-800">{dn(r.name)}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                            Kompetensi RS: <span className="text-teal-600 font-black">{config[r.name] || 'Belum Mapping'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {LEVEL_ORDER.map(lv => {
                              const k = (r.ranap[lv]?.kasus||0) + (r.rajal[lv]?.kasus||0);
                              const idrg = (r.ranap[lv]?.idrg||0) + (r.rajal[lv]?.idrg||0);
                              if (k === 0) return null;
                              const pct = r.totalIdrg > 0 ? ((idrg / r.totalIdrg) * 100).toFixed(1) : 0;
                              const rsLevel = config[r.name] || 'Tidak Melayani';
                              const isOutside = LEVEL_ORDER.indexOf(lv) > LEVEL_ORDER.indexOf(rsLevel);
                              const txtColor = isOutside ? 'text-rose-700' : 'text-slate-600';
                              const bgClass = isOutside ? 'bg-rose-50 border-rose-200' : 'bg-slate-100 border-slate-200';
                              return (
                                <span key={lv} 
                                      onClick={(e) => { e.stopPropagation(); setDrill({ group: r.name, level: lv }); }}
                                      className={`cursor-pointer hover:ring-2 hover:ring-slate-300 transition-all text-[9px] px-1.5 py-0.5 rounded border ${bgClass} ${txtColor}`}>
                                  <span className="font-black">{lv}</span>: {k} kss <span className="opacity-90 font-bold">({pct}%)</span>
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-slate-700 border-l border-slate-100">{fmt(r.totalKasusRI)}</td>
                        <td className="px-3 py-2.5 text-right text-slate-600">{fmt(r.totalKasusRJ)}</td>
                        <td className="px-3 py-2.5 text-right text-blue-600 border-l border-slate-100">{fmtRp(r.totalInaRI)}</td>
                        <td className="px-3 py-2.5 text-right text-blue-500">{fmtRp(r.totalInaRJ)}</td>
                        <td className="px-3 py-2.5 text-right text-violet-600 border-l border-slate-100">{fmtRp(r.totalIdrgRI)}</td>
                        <td className="px-3 py-2.5 text-right text-violet-500">{fmtRp(r.totalIdrgRJ)}</td>
                        <td className={`px-3 py-2.5 text-right font-black border-l border-slate-100 ${r.selisih>=0?'text-emerald-600':'text-rose-600'}`}>
                          {r.selisih>=0?'+':''}{fmtRp(r.selisih)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${selPct>=0?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-700'}`}>
                            {selPct>=0?'+':''}{selPct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5 w-32">
                          <MiniLevelBar ranap={r.ranap} rajal={r.rajal}/>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] text-teal-600 font-black bg-teal-50 px-2 py-1 rounded-lg">
                            <Users size={11}/>Detail
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Unknown groups */}
                  {filteredGroups.filter(r=>!r.hasData).map((r,i)=>(
                    <tr key={r.name} className="border-b border-slate-50 opacity-35">
                      <td className="px-3 py-2 text-slate-400 text-center">–</td>
                      <td className="px-4 py-2 text-slate-400 italic">{dn(r.name)}</td>
                      <td colSpan={10} className="px-3 py-2 text-slate-300 text-center text-[10px]">Belum ada klaim terdaftar</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 text-slate-700 font-black text-[11px] border-t border-slate-200">
                    <td colSpan={2} className="px-4 py-3 border-r border-slate-200 uppercase tracking-wider text-right">TOTAL</td>
                    <td colSpan={2} className="px-3 py-3 text-center border-r border-slate-200">{fmt(gt.totalKasus)}</td>
                    <td colSpan={2} className="px-3 py-3 text-right text-blue-700 border-r border-slate-200 bg-blue-50/50">{fmtRp(gt.totalIna)}</td>
                    <td colSpan={2} className="px-3 py-3 text-right text-violet-700 border-r border-slate-200 bg-violet-50/50">{fmtRp(gt.totalIdrg)}</td>
                    <td className={`px-3 py-3 text-right border-r border-slate-200 ${gt.selisih>=0?'text-emerald-600':'text-rose-600'}`}>{fmtRp(gt.selisih)}</td>
                    <td className="px-3 py-3 text-center font-bold text-amber-600 border-r border-slate-200">
                      {gt.totalIna>0?fmtPct(gt.selisih/gt.totalIna*100):'0%'}
                    </td>
                    <td colSpan={2}/>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════ LAPORAN TAB ══════════════ */}
        {tab==='laporan' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <KompetensiLaporan reports={data.reports} onDrillDown={setDrill} />
          </div>
        )}

      </div>
      </div>

      {/* Password Modal for Exports */}
      {showPasswordModal && pendingExport && (
        <PasswordModal isOpen={true}
          onClose={() => {
            setShowPasswordModal(false);
            setPendingExport(null);
          }}
          onSuccess={(password) => {
            exportToExcel(
              pendingExport.name,
              pendingExport.sheets,
              password
            );
            setShowPasswordModal(false);
            setPendingExport(null);
          }}
        />
      )}

      {/* ── Drill-Down Modal ── */}
      {drill && icdMap && (
        <DrillDown
          group={drill}
          rows={rows}
          icdMap={icdMap}
          config={config}
          onClose={()=>setDrill(null)}
          onExport={handleExportDrillDown}
        />
      )}
    </div>, document.body);
}

