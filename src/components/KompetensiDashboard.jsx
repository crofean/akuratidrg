import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Activity, ShieldAlert, ArrowLeft, TrendingDown, TrendingUp,
  ChevronRight, X, Search, AlertCircle, CheckCircle,
  BarChart3, TableIcon, Grid3X3, Users, FileText, Filter, Download, Copy, FileSpreadsheet,
  Lightbulb, Target, ArrowUpRight, Zap, Award, AlertTriangle, Eye, Building2, User
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell, LabelList, ComposedChart, Line } from 'recharts';
import PasswordModal from './PasswordModal';
import { exportToExcel } from '../utils/exportUtils';
import { analyzeCompetency, CONFIG_KEY, LEVEL_ORDER, ALL_GROUPS } from '../utils/competencyAnalyzer';
import { copyToClipboardHtml } from '../App';
import KompetensiLaporan from './KompetensiLaporan';
import Papa from 'papaparse';
import GlobalLoader from './GlobalLoader';

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
const dn = (s) => typeof s === 'string' ? s.replace(/^kelompok\s+layanan\s+/i,'').trim() : String(s||'');
const maskName = (s) => {
  if (!s || s === '-') return '-';
  const parts = s.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0) + '*'.repeat(Math.max(parts[0].length-1,3));
  return parts[0] + ' ' + parts.slice(1).map(p => p.charAt(0)+'*'.repeat(Math.max(p.length-1,2))).join(' ');
};

/* ─── Color Tokens ─────────────────────────────────────────────────────────── */
const LC = {
  Dasar:             { bar:'#10b981', badge:'bg-emerald-100 text-emerald-800', dot:'#10b981', glow:'rgba(16,185,129,0.3)' },
  Madya:             { bar:'#3b82f6', badge:'bg-blue-100 text-blue-800',    dot:'#3b82f6', glow:'rgba(59,130,246,0.3)' },
  Utama:             { bar:'#f59e0b', badge:'bg-amber-100 text-amber-800',  dot:'#f59e0b', glow:'rgba(245,158,11,0.3)' },
  Paripurna:         { bar:'#8b5cf6', badge:'bg-violet-100 text-violet-800',dot:'#8b5cf6', glow:'rgba(139,92,246,0.3)' },
  'Belum Ada Mapping':{ bar:'#94a3b8', badge:'bg-slate-100 text-slate-600', dot:'#94a3b8', glow:'rgba(148,163,184,0.3)' },
};

/* ─── Inline Styles ─────────────────────────────────────────────────────────── */
const styles = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes pulse-ring {
  0%, 100% { box-shadow: 0 0 0 0 rgba(20,184,166,0.3); }
  50%       { box-shadow: 0 0 0 6px rgba(20,184,166,0); }
}
@keyframes spin-slow { to { transform: rotate(360deg); } }
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-4px); }
}

.komp-fade-up { animation: fadeInUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
.komp-fade-up-1 { animation: fadeInUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.05s both; }
.komp-fade-up-2 { animation: fadeInUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.10s both; }
.komp-fade-up-3 { animation: fadeInUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
.komp-fade-up-4 { animation: fadeInUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.20s both; }
.spin-slow { animation: spin-slow 8s linear infinite; }
.float-icon { animation: float 3s ease-in-out infinite; }

.glass-card {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.6);
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04);
  transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
}
.glass-card:hover {
  box-shadow: 0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06);
  transform: translateY(-2px);
}

.group-card {
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
  overflow: hidden;
  cursor: pointer;
  position: relative;
}
.group-card:hover {
  border-color: #14b8a6;
  box-shadow: 0 8px 24px rgba(20,184,166,0.15), 0 0 0 3px rgba(20,184,166,0.08);
  transform: translateY(-3px) scale(1.01);
}
.group-card-danger:hover {
  border-color: #f43f5e;
  box-shadow: 0 8px 24px rgba(244,63,94,0.12), 0 0 0 3px rgba(244,63,94,0.06);
}

.tab-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 10px;
  font-size: 12px; font-weight: 800;
  transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
  border: none; cursor: pointer; outline: none;
  white-space: nowrap;
}
.tab-btn-active {
  background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
  color: white;
  box-shadow: 0 3px 10px rgba(13,148,136,0.25);
}
.tab-btn-inactive {
  background: transparent;
  color: #64748b;
}
.tab-btn-inactive:hover {
  background: #f0fdfa;
  color: #0d9488;
}

.stat-pill {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 9px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
  padding: 3px 8px; border-radius: 999px;
}

.progress-bar {
  height: 6px; border-radius: 999px; overflow: hidden;
  background: rgba(0,0,0,0.06);
}
.progress-fill {
  height: 100%; border-radius: 999px;
  transition: width 1.2s cubic-bezier(0.22,1,0.36,1);
}

.komp-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
.komp-scrollbar::-webkit-scrollbar-track { background: transparent; }
.komp-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
.komp-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

.header-light {
  background: white;
  border-bottom: 1.5px solid #e2e8f0;
  box-shadow: 0 2px 16px rgba(0,0,0,0.06);
}

.kpi-card-sesuai {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 1.5px solid #a7f3d0;
}
.kpi-card-luar {
  background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%);
  border: 1.5px solid #fecdd3;
}
.kpi-card-loss {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 1.5px solid #fde68a;
}
.kpi-card-total {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1.5px solid #e2e8f0;
}

.drill-modal-overlay {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(15,23,42,0.6);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.drill-modal-box {
  background: white; border-radius: 24px;
  box-shadow: 0 32px 80px rgba(0,0,0,0.3);
  width: 100%; max-width: 1100px; max-height: 92vh;
  display: flex; flex-direction: column; overflow: hidden;
}
`;

/* ─── Pure SVG Ring ───────────────────────────────────────────────────────── */
function Ring({ data, total, size=180 }) {
  if (!data?.length || !total) return (
    <div style={{width:size,height:size,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <span style={{color:'#94a3b8',fontSize:12}}>Tidak ada data</span>
    </div>
  );
  const cx=size/2, cy=size/2, R=size*0.40, ir=size*0.26;
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
      <defs>
        {segs.map((s,i)=>(
          <filter key={i} id={`glow${i}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        ))}
      </defs>
      {segs.map((s,i)=>(
        <path key={i} d={s.path} fill={s.color} opacity={0.92} style={{filter:`drop-shadow(0 2px 4px ${s.color}66)`}}/>
      ))}
      <circle cx={cx} cy={cy} r={ir-2} fill="white" opacity={0.95}/>
      <text x={cx} y={cy-6} textAnchor="middle" fontSize={size*0.09} fontWeight="900" fill="#0f172a">{fmt(total)}</text>
      <text x={cx} y={cy+10} textAnchor="middle" fontSize={size*0.065} fill="#94a3b8" fontWeight="600">kasus</text>
    </svg>
  );
}

/* ─── Mini Bar Spark ──────────────────────────────────────────────────────── */
function MiniLevelBar({ ranap, rajal }) {
  const levels = LEVEL_ORDER.filter(l=>l!=='Belum Ada Mapping');
  const total = levels.reduce((s,lv)=>{
    return s + (ranap[lv]?.kasus||0) + (rajal[lv]?.kasus||0);
  },0);
  if(!total) return <div style={{height:8,background:'#f1f5f9',borderRadius:999}}/>;
  return (
    <div style={{display:'flex',height:8,borderRadius:999,overflow:'hidden',gap:1}}>
      {levels.map(lv=>{
        const k=(ranap[lv]?.kasus||0)+(rajal[lv]?.kasus||0);
        if(!k) return null;
        const w=(k/total)*100;
        return <div key={lv} title={`${lv}: ${fmt(k)}`}
          style={{width:`${w}%`,background:LC[lv].dot,boxShadow:`inset 0 1px 2px rgba(255,255,255,0.4)`}} />;
      })}
    </div>
  );
}

/* ─── Drill-Down Modal ────────────────────────────────────────────────────── */
function DrillDown({ group, rows, icdMap, config, onClose, onExport }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('patients');
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

  const icdSummary = useMemo(() => {
    const map = {};
    matchedRows.forEach(row => {
      const ina = parseFloat(row['TOTAL_TARIF'] || 0) || 0;
      const idrg = parseFloat(row['IDRG_TOTAL_TARIF'] || 0) || 0;
      const pGroup = row._meta?.highestGroup;
      const diaglist = (row['DIAGLIST']||'').split(';').map(d => d.trim()).filter(Boolean);
      const proclist = (row['PROCLIST']||'').split(';').map(p => p.trim()).filter(p => p && p !== '-' && p.toLowerCase() !== 'none');
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
        return [i+1, namaRs, sep, patientName, dpjp, jenis, mainDiag, `Rp ${ina.toLocaleString('id-ID')}`, `Rp ${idrg.toLocaleString('id-ID')}`, `${sel >= 0 ? '+' : ''}Rp ${sel.toLocaleString('id-ID')}`];
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
        return [i+1, d.code, d.desc, rsLevel, d.level, isSesuai ? 'Sesuai' : 'Tidak Sesuai', d.count, `Rp ${d.ina.toLocaleString('id-ID')}`, `Rp ${d.idrg.toLocaleString('id-ID')}`, `${sel >= 0 ? '+' : ''}Rp ${sel.toLocaleString('id-ID')}`];
      });
      copyToClipboardHtml(headers, r, `Ringkasan ICD: ${dn(group)}`);
    }
  };

  const exportToExcelLocal = () => {
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
      let warnings = [];
      const codes = [...(r['DIAGLIST']||'').split(';'), ...(r['PROCLIST']||'').split(';')].map(d=>d.trim()).filter(d=>d&&d!=='-'&&d.toLowerCase()!=='none');
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
    <div className="drill-modal-overlay" onClick={onClose}>
      <div className="drill-modal-box" onClick={e=>e.stopPropagation()}>

        {/* Modal Header — dark gradient */}
        <div style={{background:'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <div style={{width:28,height:28,borderRadius:8,background:'rgba(20,184,166,0.2)',border:'1px solid rgba(20,184,166,0.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Eye size={14} color="#14b8a6"/>
              </div>
              <p style={{fontSize:10,fontWeight:800,color:'#14b8a6',letterSpacing:'0.12em',textTransform:'uppercase'}}>
                {customTitle || `Drill-Down Detail${filterLevel ? ` · Level ${filterLevel}` : ''}`}
              </p>
            </div>
            <p style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.5)',marginTop:2}}>{fmt(matchedRows.length)} kasus terdampak</p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button onClick={copyTable} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:10,color:'rgba(255,255,255,0.7)',fontSize:11,fontWeight:700,cursor:'pointer',transition:'all 0.2s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(14,165,233,0.2)';e.currentTarget.style.color='#7dd3fc';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';e.currentTarget.style.color='rgba(255,255,255,0.7)';}}>
              <Copy size={13}/> Copy Tabel
            </button>
            <button onClick={() => {
              if(onExport) {
                const sheetICD = { name:'Ringkasan_ICD', columns:[
                  {header:'No',key:'no',width:5},{header:'Kode ICD',key:'code',width:15},{header:'Deskripsi',key:'desc',width:50},
                  {header:'Komp. RS',key:'komprs',width:20},{header:'Level ICD',key:'levelicd',width:20},{header:'Status',key:'status',width:15},
                  {header:'Frekuensi',key:'freq',width:10},{header:'INA-CBG',key:'ina',width:20},{header:'iDRG',key:'idrg',width:20},{header:'Selisih',key:'selisih',width:20}
                ], data:[] };
                if (icdSummary) {
                  icdSummary.forEach((d, i) => {
                    const rsLevel = config && config[group] ? config[group] : 'Belum Ada Mapping';
                    const isSesuai = rsLevel==='Belum Ada Mapping'?true:LEVEL_ORDER.indexOf(d.level)<=LEVEL_ORDER.indexOf(rsLevel);
                    sheetICD.data.push({no:i+1,code:d.code,desc:d.desc,komprs:rsLevel,levelicd:d.level,status:isSesuai?'Sesuai':'Tidak Sesuai',freq:d.count,ina:d.ina,idrg:d.idrg,selisih:d.idrg-d.ina});
                  });
                }
                const sheetPasien = { name:'Data_Pasien', columns:[
                  {header:'No',key:'no',width:5},{header:'Rumah Sakit',key:'rs',width:30},{header:'SEP / No Klaim',key:'sep',width:25},
                  {header:'Nama Pasien',key:'nama',width:30},{header:'DPJP',key:'dpjp',width:30},{header:'Jenis',key:'jenis',width:15},
                  {header:'Diagnosa Utama',key:'diag',width:20},{header:'INA-CBG',key:'ina',width:20},{header:'iDRG',key:'idrg',width:20},{header:'Selisih',key:'selisih',width:20}
                ], data:[] };
                rows.forEach((r, i) => {
                  const kodeRs = String(r['KODE_RS']||'').trim();
                  const namaRs = rsMap[kodeRs] ? `${kodeRs} - ${rsMap[kodeRs]}` : kodeRs || '-';
                  const sep = r['SEP']||r['NO_SEP']||r['NO_KLAIM']||'-';
                  const patientName = maskName(String(r['NAMA']||r['NAMA_PASIEN']||r['nama']||'-'));
                  const dpjp = maskName(r['DPJP']||'-');
                  const mainDiag = (r['DIAGLIST']||'').split(';')[0]?.trim()||'-';
                  const ina = parseFloat(r['TOTAL_TARIF'])||0;
                  const idrg = parseFloat(r['IDRG_TOTAL_TARIF'])||0;
                  sheetPasien.data.push({no:i+1,rs:namaRs,sep,nama:patientName,dpjp,jenis:String(r['PTD']||'').trim()==='1'?'Ranap':'Rajal',diag:mainDiag,ina,idrg,selisih:idrg-ina});
                });
                onExport(dn(group), [sheetPasien, sheetICD]);
              }
            }} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',background:'rgba(20,184,166,0.15)',border:'1px solid rgba(20,184,166,0.3)',borderRadius:10,color:'#5eead4',fontSize:11,fontWeight:700,cursor:'pointer',transition:'all 0.2s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(20,184,166,0.25)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(20,184,166,0.15)';}}>
              <Download size={13}/> Excel
            </button>
            <button onClick={onClose} style={{width:32,height:32,borderRadius:10,border:'1px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'rgba(255,255,255,0.6)',transition:'all 0.2s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.2)';e.currentTarget.style.color='#fca5a5';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.color='rgba(255,255,255,0.6)';}}>
              <X size={16}/>
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',borderBottom:'1px solid #f1f5f9',background:'#fafafa'}}>
          {[
            { label:'Total Kasus',  val:fmt(matchedRows.length), sub:'pasien', valColor:'#0f172a' },
            { label:'Pendapatan INA-CBG', val:fmtRp(totIna),  sub:'tarif klaim', valColor:'#1d4ed8' },
            { label:'Pendapatan iDRG',   val:fmtRp(totIdrg), sub:'tarif iDRG',  valColor:'#6d28d9' },
            { label:'Selisih (iDRG−INA)', val:fmtRp(Math.abs(totSel)), sub:totSel>=0?'▲ iDRG lebih tinggi':'▼ INA-CBG lebih tinggi', valColor:totSel>=0?'#059669':'#dc2626' },
            { label:'% Selisih vs INA', val:totIna>0?`${totSel>=0?'+':''}${(totSel/totIna*100).toFixed(1)}%`:'–', sub:'perbandingan tarif', valColor:totSel>=0?'#059669':'#dc2626' },
          ].map((s,i)=>(
            <div key={i} style={{padding:'14px 12px',textAlign:'center',borderRight:i<4?'1px solid #f1f5f9':'none'}}>
              <p style={{fontSize:9,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{s.label}</p>
              <p style={{fontSize:16,fontWeight:900,color:s.valColor,margin:0}}>{s.val}</p>
              <p style={{fontSize:9,color:'#cbd5e1',marginTop:2}}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',borderBottom:'1px solid #f1f5f9',background:'white',flexShrink:0}}>
          {[
            {id:'patients', icon:<Users size={13}/>, label:`Daftar Pasien (${fmt(matchedRows.length)})`},
            {id:'icds',     icon:<FileText size={13}/>, label:`Kode ICD (${icdSummary.length})`},
          ].map(t=>(
            <button key={t.id} onClick={()=>{setTab(t.id);setPage(0);}}
              style={{display:'flex',alignItems:'center',gap:6,padding:'12px 20px',fontSize:11,fontWeight:800,border:'none',background:'none',cursor:'pointer',
                borderBottom: tab===t.id ? '2px solid #0d9488':'2px solid transparent',
                color: tab===t.id ? '#0d9488' : '#94a3b8',
                transition:'all 0.2s'}}>
              {t.icon}{t.label}
            </button>
          ))}
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'flex-end',padding:'0 16px'}}>
            <div style={{position:'relative'}}>
              <Search size={12} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#94a3b8'}}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari SEP / DPJP / ICD..."
                style={{paddingLeft:30,paddingRight:12,paddingTop:7,paddingBottom:7,fontSize:11,border:'1.5px solid #e2e8f0',borderRadius:10,outline:'none',width:220,color:'#334155',background:'#f8fafc'}}
                onFocus={e=>{e.target.style.borderColor='#0d9488';e.target.style.background='white';}}
                onBlur={e=>{e.target.style.borderColor='#e2e8f0';e.target.style.background='#f8fafc';}}/>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{flex:1,overflowY:'auto'}} className="komp-scrollbar">
          {tab==='patients' ? (
            <table style={{width:'100%',fontSize:11,borderCollapse:'collapse'}}>
              <thead style={{background:'#f8fafc',position:'sticky',top:0,zIndex:1}}>
                <tr>
                  {['No','Rumah Sakit','SEP / No Klaim','Nama Pasien','DPJP','Jenis','Diagnosa Utama','Peringatan Kompetensi','Selisih'].map(h=>(
                    <th key={h} style={{padding:'10px 12px',textAlign:'left',fontWeight:800,color:'#64748b',textTransform:'uppercase',fontSize:9,letterSpacing:'0.06em',borderBottom:'1.5px solid #e2e8f0',whiteSpace:'nowrap'}}>{h}</th>
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
                  let warnings = [];
                  const codes = [...(r['DIAGLIST']||'').split(';'), ...(r['PROCLIST']||'').split(';')].map(d=>d.trim()).filter(d=>d&&d!=='-'&&d.toLowerCase()!=='none');
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
                  return (
                    <tr key={i} style={{borderBottom:'1px solid #f8fafc',background:i%2===0?'white':'#fafafa',transition:'background 0.15s'}}
                      onMouseEnter={e=>e.currentTarget.style.background='#f0fdfa'}
                      onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'white':'#fafafa'}>
                      <td style={{padding:'9px 12px',color:'#94a3b8',fontSize:10}}>{page*PER_PAGE+i+1}</td>
                      <td style={{padding:'9px 12px',color:'#475569',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={namaRs}>{namaRs}</td>
                      <td style={{padding:'9px 12px',fontFamily:'monospace',fontWeight:700,color:'#1e293b',fontSize:11}}>{sep}</td>
                      <td style={{padding:'9px 12px',color:'#475569',maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{patientName}</td>
                      <td style={{padding:'9px 12px',color:'#475569',maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{maskName(dpjp)}</td>
                      <td style={{padding:'9px 12px'}}>
                        <span style={{padding:'2px 8px',borderRadius:999,fontSize:9,fontWeight:800,background:isRanap?'#dbeafe':'#ffedd5',color:isRanap?'#1d4ed8':'#c2410c'}}>
                          {isRanap?'Ranap':'Rajal'}
                        </span>
                      </td>
                      <td style={{padding:'9px 12px',fontFamily:'monospace',color:'#334155',maxWidth:110,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={r['DIAGLIST']||''}>{mainDiag}</td>
                      <td style={{padding:'9px 12px',fontSize:10}}>
                        {uniqueWarnings.length > 0 ? (
                           <div style={{display:'flex',flexDirection:'column',gap:4}}>
                             {uniqueWarnings.map((w, wi) => (
                               <div key={wi} style={{background:'#fff1f2',border:'1px solid #fecdd3',borderRadius:8,padding:'5px 8px',borderLeft:'3px solid #f43f5e'}}>
                                 <div style={{display:'flex',justifyContent:'space-between',gap:6,marginBottom:2}}>
                                   <span style={{fontWeight:800,color:'#be123c',fontSize:11}}>{w.code}</span>
                                   <span style={{fontSize:9,fontWeight:800,background:'#ffe4e6',color:'#9f1239',padding:'1px 6px',borderRadius:999,whiteSpace:'nowrap'}}>Butuh {w.level}</span>
                                 </div>
                                 <p style={{fontSize:10,color:'#e11d48',margin:0,lineHeight:1.4}}>{w.desc}</p>
                                 <p style={{fontSize:9,color:'#fb7185',margin:0,fontStyle:'italic',marginTop:1}}>{w.group}</p>
                               </div>
                             ))}
                           </div>
                        ) : (
                           <span style={{color:'#059669',fontWeight:800,background:'#dcfce7',padding:'3px 10px',borderRadius:999,fontSize:10}}>✓ Sesuai</span>
                        )}
                      </td>
                      <td style={{padding:'9px 12px',textAlign:'right',fontWeight:900,fontSize:12}}>
                        <span style={{color:sel>=0?'#059669':'#dc2626'}}>{sel>=0?'+':''}{fmtRp(sel)}</span>
                      </td>
                    </tr>
                  );
                })}
                {pageData.length===0 && (
                  <tr><td colSpan={9} style={{padding:'48px',textAlign:'center',color:'#94a3b8',fontSize:13}}>Tidak ada data ditemukan</td></tr>
                )}
              </tbody>
            </table>
          ) : (
            <table style={{width:'100%',fontSize:11,borderCollapse:'collapse'}}>
              <thead style={{background:'#f8fafc',position:'sticky',top:0,zIndex:1}}>
                <tr>
                  {['No','Kode ICD','Deskripsi','Komp. RS','Level Kompetensi','Status','Frekuensi','INA-CBG','iDRG','Selisih'].map(h=>(
                    <th key={h} style={{padding:'10px 14px',textAlign:'left',fontWeight:800,color:'#64748b',textTransform:'uppercase',fontSize:9,letterSpacing:'0.06em',borderBottom:'1.5px solid #e2e8f0'}}>{h}</th>
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
                    if (config[actualGroupName]) rsLevel = config[actualGroupName];
                    else {
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
                    <tr key={i} style={{borderBottom:'1px solid #f8fafc',background:i%2===0?'white':'#fafafa',transition:'background 0.15s'}}
                      onMouseEnter={e=>e.currentTarget.style.background='#f0fdfa'}
                      onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'white':'#fafafa'}>
                      <td style={{padding:'10px 14px',color:'#94a3b8',width:32}}>{i+1}</td>
                      <td style={{padding:'10px 14px',fontFamily:'monospace',fontWeight:900,color:'#0f172a',fontSize:12}}>{d.code}</td>
                      <td style={{padding:'10px 14px',color:'#475569',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={d.desc}>{d.desc}</td>
                      <td style={{padding:'10px 14px'}}>
                        <span style={{padding:'3px 10px',borderRadius:999,fontSize:10,fontWeight:800}} className={cRs.badge}>{rsLevel}</span>
                      </td>
                      <td style={{padding:'10px 14px'}}>
                        <span style={{padding:'3px 10px',borderRadius:999,fontSize:10,fontWeight:800,display:'inline-flex',alignItems:'center',gap:4}} className={c.badge}>
                          <span style={{width:6,height:6,borderRadius:'50%',background:c.dot,display:'inline-block'}}/>
                          {d.level}
                        </span>
                      </td>
                      <td style={{padding:'10px 14px'}}>
                        {isSesuai
                          ? <span style={{padding:'3px 10px',borderRadius:999,fontSize:10,fontWeight:800,background:'#dcfce7',color:'#166534'}}>✓ Sesuai</span>
                          : <span style={{padding:'3px 10px',borderRadius:999,fontSize:10,fontWeight:800,background:'#fee2e2',color:'#991b1b'}}>✗ Tidak Sesuai</span>
                        }
                      </td>
                      <td style={{padding:'10px 14px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{flex:1,background:'#f1f5f9',borderRadius:999,height:6,maxWidth:80,overflow:'hidden'}}>
                            <div style={{height:6,borderRadius:999,background:c.dot,width:`${icdSummary[0]?.count ? (d.count/icdSummary[0].count)*100 : 0}%`,transition:'width 0.8s ease'}}/>
                          </div>
                          <span style={{fontWeight:900,color:'#1e293b',minWidth:36,textAlign:'right'}}>{fmt(d.count)}</span>
                        </div>
                      </td>
                      <td style={{padding:'10px 14px',fontWeight:700,color:'#1d4ed8',textAlign:'right'}}>{fmtRp(d.ina)}</td>
                      <td style={{padding:'10px 14px',fontWeight:700,color:'#6d28d9',textAlign:'right'}}>{fmtRp(d.idrg)}</td>
                      <td style={{padding:'10px 14px',textAlign:'right'}}>
                        <span style={{fontWeight:900,fontSize:11,padding:'3px 8px',borderRadius:8,background:sel>=0?'#f0fdf4':'#fff1f2',color:sel>=0?'#166534':'#9f1239'}}>
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

        {/* Pagination */}
        {tab==='patients' && pages>1 && (
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 20px',borderTop:'1px solid #f1f5f9',background:'#fafafa',flexShrink:0}}>
            <span style={{fontSize:11,color:'#64748b'}}>Halaman {page+1} dari {pages} · {fmt(filtered.length)} data</span>
            <div style={{display:'flex',gap:8}}>
              <button disabled={page===0} onClick={()=>setPage(p=>p-1)}
                style={{padding:'6px 14px',fontSize:11,borderRadius:9,border:'1.5px solid #e2e8f0',background:'white',cursor:page===0?'not-allowed':'pointer',opacity:page===0?0.4:1,fontWeight:700,color:'#475569',transition:'all 0.2s'}}>← Prev</button>
              <button disabled={page===pages-1} onClick={()=>setPage(p=>p+1)}
                style={{padding:'6px 14px',fontSize:11,borderRadius:9,border:'1.5px solid #e2e8f0',background:'white',cursor:page===pages-1?'not-allowed':'pointer',opacity:page===pages-1?0.4:1,fontWeight:700,color:'#475569',transition:'all 0.2s'}}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Top10 Table ──────────────────────────────────────────────────────────── */
function Top10Table({ title, data }) {
  if (!data || data.length === 0) return null;
  const isDanger = title.toLowerCase().includes('tidak sesuai');
  return (
    <div style={{background:'white',borderRadius:16,border:`1.5px solid ${isDanger?'#fecdd3':'#e2e8f0'}`,overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,0.04)'}}>
      <div style={{padding:'14px 18px',borderBottom:`1px solid ${isDanger?'#fee2e2':'#f1f5f9'}`,background:isDanger?'linear-gradient(135deg,#fff1f2,#ffe4e6)':'#f8fafc',display:'flex',alignItems:'center',gap:8}}>
        <div style={{width:6,height:20,borderRadius:3,background:isDanger?'#f43f5e':'#14b8a6'}}/>
        <h3 style={{fontWeight:800,fontSize:12,color:'#1e293b',margin:0}}>{title}</h3>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',fontSize:11,borderCollapse:'collapse',minWidth:480}}>
          <thead>
            <tr style={{background:'#f8fafc',color:'#64748b',fontSize:9,textTransform:'uppercase',letterSpacing:'0.06em'}}>
              <th style={{padding:'9px 12px',textAlign:'left',fontWeight:800,width:28}}>No</th>
              <th style={{padding:'9px 12px',textAlign:'left',fontWeight:800,width:60}}>ICD</th>
              <th style={{padding:'9px 12px',textAlign:'left',fontWeight:800}}>Deskripsi</th>
              <th style={{padding:'9px 12px',textAlign:'right',fontWeight:800}}>Kasus</th>
              <th style={{padding:'9px 12px',textAlign:'right',fontWeight:800,color:'#1d4ed8'}}>INA-CBG</th>
              <th style={{padding:'9px 12px',textAlign:'right',fontWeight:800,color:'#6d28d9'}}>iDRG</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i} style={{borderBottom:'1px solid #f8fafc',background:i%2===0?'white':'#fafafa',transition:'background 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.background='#f0fdfa'}
                onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'white':'#fafafa'}>
                <td style={{padding:'9px 12px',color:'#94a3b8',fontWeight:700}}>{i + 1}</td>
                <td style={{padding:'9px 12px',fontFamily:'monospace',fontWeight:900,color:'#0f172a',fontSize:12}}>{d.code}</td>
                <td style={{padding:'9px 12px',color:'#475569',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:150}} title={d.desc}>{d.desc}</td>
                <td style={{padding:'9px 12px',textAlign:'right',fontWeight:900,color:'#334155'}}>{fmt(d.kasus)}</td>
                <td style={{padding:'9px 12px',textAlign:'right',color:'#2563eb',fontWeight:700}}>{fmtRp(d.ina)}</td>
                <td style={{padding:'9px 12px',textAlign:'right',color:'#7c3aed',fontWeight:700}}>{fmtRp(d.idrg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Detail Kelompok Table ────────────────────────────────────────────────── */
function DetailKelompokTable({ data, onDrillDown }) {
  if (!data || data.length === 0) return null;
  const sorted = [...data].sort((a,b) => {
    if (a.name === 'KASUS BELUM MAPPING') return 1;
    if (b.name === 'KASUS BELUM MAPPING') return -1;
    return b.totalKasus - a.totalKasus;
  });
  return (
    <div style={{background:'white',borderRadius:16,border:'1.5px solid #e2e8f0',overflow:'hidden',marginTop:20,boxShadow:'0 2px 12px rgba(0,0,0,0.04)'}}>
      <div style={{padding:'14px 18px',borderBottom:'1px solid #f1f5f9',background:'#f8fafc',display:'flex',alignItems:'center',gap:8}}>
        <div style={{width:6,height:20,borderRadius:3,background:'#6366f1'}}/>
        <h3 style={{fontWeight:800,fontSize:13,color:'#1e293b',margin:0}}>Detail Per Kelompok Layanan</h3>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',fontSize:11,borderCollapse:'collapse',minWidth:1000}}>
          <thead>
            <tr style={{background:'#f8fafc',color:'#64748b',fontSize:9,textTransform:'uppercase',letterSpacing:'0.06em'}}>
              <th style={{padding:'10px 14px',textAlign:'left',fontWeight:800,width:250,borderRight:'1px solid #e2e8f0'}}>Kelompok Layanan</th>
              <th style={{padding:'10px 14px',textAlign:'right',fontWeight:800,borderRight:'1px solid #e2e8f0'}}>Total Kasus</th>
              <th style={{padding:'10px 14px',textAlign:'right',fontWeight:800,background:'#f0fdf4',color:'#166534'}}>Sesuai (Kasus)</th>
              <th style={{padding:'10px 14px',textAlign:'right',fontWeight:800,background:'#f0fdf4',color:'#166534'}}>Sesuai (INA)</th>
              <th style={{padding:'10px 14px',textAlign:'right',fontWeight:800,background:'#f0fdf4',color:'#166534',borderRight:'1px solid #d1fae5'}}>Sesuai (iDRG)</th>
              <th style={{padding:'10px 14px',textAlign:'right',fontWeight:800,background:'#fff1f2',color:'#9f1239'}}>Tdk Sesuai (Kasus)</th>
              <th style={{padding:'10px 14px',textAlign:'right',fontWeight:800,background:'#fff1f2',color:'#9f1239'}}>Tdk Sesuai (INA)</th>
              <th style={{padding:'10px 14px',textAlign:'right',fontWeight:800,background:'#fff1f2',color:'#9f1239'}}>Potensi Loss (iDRG)</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d, i) => (
              <tr key={i} style={{borderBottom:'1px solid #f8fafc',background:i%2===0?'white':'#fafafa',transition:'background 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.background='#f0fdfa'}
                onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'white':'#fafafa'}>
                <td style={{padding:'10px 14px',fontWeight:700,color:'#1e293b',cursor:'pointer',borderRight:'1px solid #f1f5f9'}} onClick={() => onDrillDown && onDrillDown(d.name)}>{d.name}</td>
                <td style={{padding:'10px 14px',textAlign:'right',fontWeight:900,color:'#0f172a',cursor:'pointer',borderRight:'1px solid #f1f5f9'}} onClick={() => onDrillDown && onDrillDown(d.name)}>{fmt(d.totalKasus)}</td>
                <td style={{padding:'10px 14px',textAlign:'right',fontWeight:700,color:'#059669',cursor:'pointer',background:'rgba(240,253,244,0.5)'}} onClick={() => onDrillDown && onDrillDown({ title:`Detail ${dn(d.name)} (Sesuai)`, filterFn:r=>r._meta?.highestGroup===d.name&&!r._meta?.isOutsideOverall })}>{fmt(d.sesuaiKasus)}</td>
                <td style={{padding:'10px 14px',textAlign:'right',color:'#16a34a',background:'rgba(240,253,244,0.5)'}}>{fmtRp(d.sesuaiIna)}</td>
                <td style={{padding:'10px 14px',textAlign:'right',fontWeight:700,color:'#16a34a',background:'rgba(240,253,244,0.5)',borderRight:'1px solid #d1fae5'}}>{fmtRp(d.sesuaiIdrg)}</td>
                <td style={{padding:'10px 14px',textAlign:'right',fontWeight:700,color:'#dc2626',cursor:'pointer',background:'rgba(255,241,242,0.5)'}} onClick={() => onDrillDown && onDrillDown({ title:`Detail ${dn(d.name)} (Tidak Sesuai)`, filterFn:r=>r._meta?.highestGroup===d.name&&r._meta?.isOutsideOverall })}>{fmt(d.lossKasus)}</td>
                <td style={{padding:'10px 14px',textAlign:'right',color:'#dc2626',background:'rgba(255,241,242,0.5)'}}>{fmtRp(d.lossIna)}</td>
                <td style={{padding:'10px 14px',textAlign:'right',fontWeight:700,color:'#dc2626',background:'rgba(255,241,242,0.5)'}}>{fmtRp(d.lossIdrg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ──────────────────────────────────────────────────────── */
export default function KompetensiDashboard({ rows, onBack, resolveKsmDept, ksmOverrides }) {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState('overview');
  const [drill,      setDrill]      = useState(null);
  const [icdMap,     setIcdMap]     = useState(null);
  const [icdDescMap, setIcdDescMap] = useState(null);
  const [search,     setSearch]     = useState('');
  const [config,     setConfig]     = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingExport, setPendingExport] = useState(null);
  const [ksmSubView, setKsmSubView] = useState('dept');
  const [ksmSearch, setKsmSearch] = useState('');
  const [ksmSort, setKsmSort] = useState('loss');

  const handleExportTop10 = () => {
    if (!data || !data.top10) return;
    const formatSheet = (title, tableData) => {
      const sheet = { name: title.substring(0, 31), columns:[
        {header:'No',key:'no',width:5},{header:'Kode ICD',key:'code',width:15},{header:'Deskripsi',key:'desc',width:50},
        {header:'Kasus',key:'kasus',width:10},{header:'INA-CBG',key:'ina',width:20},{header:'iDRG',key:'idrg',width:20}
      ], data:[] };
      if (tableData) tableData.forEach((d, i) => sheet.data.push({no:i+1,code:d.code,desc:d.desc,kasus:d.kasus,ina:d.ina,idrg:d.idrg}));
      return sheet;
    };
    setPendingExport({ name:'Top_10_Kompetensi', sheets:[
      formatSheet('Diag Sesuai', data.top10.diagSesuai),
      formatSheet('Tindakan Sesuai', data.top10.procSesuai),
      formatSheet('Diag Tidak Sesuai', data.top10.diagTidakSesuai),
      formatSheet('Tindakan Tidak Sesuai', data.top10.procTidakSesuai)
    ]});
    setShowPasswordModal(true);
  };

  const handleExportDrillDown = (title, sheetsArray) => {
    setPendingExport({ name:'Rincian_'+String(title).replace(/[^a-zA-Z0-9]/g,'_'), sheets:sheetsArray });
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
        const { _icdMap, _icdDescMap } = res;
        if (_icdMap) setIcdMap(_icdMap);
        if (_icdDescMap) setIcdDescMap(_icdDescMap);
      } catch(e){ console.error(e); }
      finally{ setLoading(false); }
    })();
  },[rows]);

  const [ksmData, setKsmData] = useState(null);
  const [isKsmLoading, setIsKsmLoading] = useState(false);

  // Invalidate KSM data if rows or overrides change
  useEffect(() => {
    setKsmData(null);
  }, [rows, ksmOverrides]);

  useEffect(() => {
    if (!data || !rows || !resolveKsmDept || tab !== 'ksm') return;
    if (ksmData) return; // Already computed for current dependencies

    setIsKsmLoading(true);

    // Yield to browser to paint loading state first
    const timer = setTimeout(() => {
      const deptMap = {};
      const ksmMap = {};
      const dpjpMap = {};
      const heatmap = {}; // ksmName -> { groupName -> count }

      const parseTariff = v => { if (!v) return 0; if (typeof v==='number') return v; let s=String(v).trim(); s=s.replace(/Rp\.?\s*/ig,''); if(s.indexOf('.')>-1&&s.indexOf(',')===-1){if(s.split('.').length>2)s=s.replace(/\./g,'');else if(/\.\d{3}$/.test(s))s=s.replace('.','');}else if(s.indexOf(',')>-1&&s.indexOf('.')===-1){if(s.split(',').length>2)s=s.replace(/,/g,'');else if(/,\d{3}$/.test(s))s=s.replace(',','');else s=s.replace(',','.');}else if(s.indexOf('.')>-1&&s.indexOf(',')>-1){if(s.indexOf('.')<s.indexOf(','))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(/,/g,'');} return parseFloat(s)||0; };

      for (const row of rows) {
        const dpjpRaw = row['DPJP'] || '-';
        const resolved = resolveKsmDept(dpjpRaw, ksmOverrides || {});
        const dept = resolved.dept || 'Unknown';
        const ksm = resolved.ksm || 'Unknown';
        const isOutside = row._meta?.isOutsideOverall || false;
        const group = row._meta?.highestGroup || 'Unknown';
        const level = row._meta?.highestLevelName || 'Belum Ada Mapping';
        const tarif = parseTariff(row['TOTAL_TARIF']);

        // Dept aggregation
        if (!deptMap[dept]) deptMap[dept] = { name:dept, total:0, sesuai:0, luar:0, loss:0, groups:{} };
        deptMap[dept].total++;
        if (isOutside) { deptMap[dept].luar++; deptMap[dept].loss += tarif; }
        else deptMap[dept].sesuai++;
        deptMap[dept].groups[group] = (deptMap[dept].groups[group]||0) + 1;

        // KSM aggregation
        if (!ksmMap[ksm]) ksmMap[ksm] = { name:ksm, dept, total:0, sesuai:0, luar:0, loss:0, groups:{}, levels:{} };
        ksmMap[ksm].total++;
        if (isOutside) { ksmMap[ksm].luar++; ksmMap[ksm].loss += tarif; }
        else ksmMap[ksm].sesuai++;
        ksmMap[ksm].groups[group] = (ksmMap[ksm].groups[group]||0) + 1;
        ksmMap[ksm].levels[level] = (ksmMap[ksm].levels[level]||0) + 1;

        // Heatmap: KSM × Kelompok Layanan (hanya yang di luar)
        if (isOutside) {
          if (!heatmap[ksm]) heatmap[ksm] = {};
          heatmap[ksm][group] = (heatmap[ksm][group]||0) + 1;
        }

        // DPJP aggregation
        const dpjpKey = dpjpRaw.trim();
        if (!dpjpMap[dpjpKey]) dpjpMap[dpjpKey] = { name:dpjpRaw, ksm, dept, total:0, sesuai:0, luar:0, loss:0, groups:{} };
        dpjpMap[dpjpKey].total++;
        if (isOutside) { dpjpMap[dpjpKey].luar++; dpjpMap[dpjpKey].loss += tarif; }
        else dpjpMap[dpjpKey].sesuai++;
        dpjpMap[dpjpKey].groups[group] = (dpjpMap[dpjpKey].groups[group]||0) + 1;
      }

      const sortByLoss = (a,b) => b.loss - a.loss;
      const depts = Object.values(deptMap).sort(sortByLoss);
      const ksms = Object.values(ksmMap).sort(sortByLoss);
      const dpjps = Object.values(dpjpMap).sort(sortByLoss);

      // Collect unique groups used in heatmap
      const heatGroups = new Set();
      Object.values(heatmap).forEach(g => Object.keys(g).forEach(k => heatGroups.add(k)));
      const heatGroupList = [...heatGroups].filter(g => g !== 'KASUS BELUM MAPPING').sort();

      setKsmData({ depts, ksms, dpjps, heatmap, heatGroupList });
      setIsKsmLoading(false);
    }, 50);

    return () => clearTimeout(timer);
  }, [data, rows, resolveKsmDept, ksmOverrides, tab, ksmData]);

  const strategicData = useMemo(() => {
    if (!data || !data.groupDetails) return null;
    const validGroups = data.groupDetails.filter(g => g.name !== 'KASUS BELUM MAPPING' && g.lossKasus > 0);
    const list = validGroups.map(g => ({ name:g.name, volume:g.lossKasus, revenue:g.lossIna, avgTariff:g.lossKasus>0?(g.lossIna/g.lossKasus):0 }));
    const topRevenue = [...list].sort((a, b) => b.revenue - a.revenue);
    const top5 = topRevenue.slice(0, 5);
    const recs = [];
    if (top5[0]) recs.push({ title:`Prioritas 1: ${top5[0].name}`, text:`Terdapat ${top5[0].volume} kasus anomali dengan potensi pendapatan Rp ${top5[0].revenue.toLocaleString('id-ID')}. Sangat direkomendasikan untuk memprioritaskan peningkatan kompetensi layanan ini.` });
    if (top5[1]) recs.push({ title:`Prioritas 2: ${top5[1].name}`, text:`Mencatatkan potensi pendapatan sebesar Rp ${top5[1].revenue.toLocaleString('id-ID')} dari ${top5[1].volume} kasus. Pertimbangkan untuk merekrut SDM atau menambah alat medis.` });
    if (top5[2]) recs.push({ title:`Prioritas 3: ${top5[2].name}`, text:`Layanan ini kehilangan peluang penanganan optimal pada ${top5[2].volume} kasus dengan nilai Rp ${top5[2].revenue.toLocaleString('id-ID')}.` });
    if (top5[3]) recs.push({ title:`Prioritas 4: ${top5[3].name}`, text:`Menghasilkan Rp ${top5[3].revenue.toLocaleString('id-ID')} potensi tarif dari ${top5[3].volume} kasus yang dirujuk/anomali.` });
    if (top5[4]) recs.push({ title:`Prioritas 5: ${top5[4].name}`, text:`Potensi Rp ${top5[4].revenue.toLocaleString('id-ID')} dari ${top5[4].volume} pasien.` });
    const maxVol = Math.max(...list.map(d => d.volume), 10);
    const maxTariff = Math.max(...list.map(d => d.avgTariff), 10000000);
    return { scatter:list, top5, topRevenue, recs, maxVol, maxTariff };
  }, [data]);

  const donutData = useMemo(()=>{
    if(!data) return [];
    return LEVEL_ORDER.map(lv=>({name:lv,value:data.levelDistribution[lv]||0})).filter(d=>d.value>0);
  },[data]);

  /* ── Loading Screen ── */
  if(loading||!data) return createPortal(
    <GlobalLoader 
      title="Menganalisis Kompetensi Layanan"
      subtitle={`Memproses ${(rows||[]).length.toLocaleString('id-ID')} baris data...`}
      fullScreen={true}
    />,
    document.body
  );

  const pctOut = data.totalPatients>0 ? (data.patientsOutsideCompetency/data.totalPatients*100).toFixed(1) : 0;

  const t1 = LEVEL_ORDER.reduce((a,lv)=>{
    const s=data.levelStats[lv]||{};
    return { sk:a.sk+(s.sesuaiKasus||0), si:a.si+(s.sesuaiIna||0), sd:a.sd+(s.sesuaiIdrg||0),
             lk:a.lk+(s.lossKasus||0),   li:a.li+(s.lossIna||0),   ld:a.ld+(s.lossIdrg||0) };
  },{sk:0,si:0,sd:0,lk:0,li:0,ld:0});

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

  const filteredGroups = search ? sortedGroups.filter(r=>dn(r.name).toLowerCase().includes(search.toLowerCase())) : sortedGroups;

  const gt = sortedGroups.filter(r=>r.hasData).reduce(
    (a,r)=>({totalKasus:a.totalKasus+r.totalKasus, totalIna:a.totalIna+r.totalIna,
              totalIdrg:a.totalIdrg+r.totalIdrg, selisih:a.selisih+r.selisih}),
    {totalKasus:0,totalIna:0,totalIdrg:0,selisih:0}
  );

  const TABS = [
    {id:'overview',  icon:<BarChart3 size={13}/>,       label:'Overview'},
    {id:'strategic', icon:<Lightbulb size={13}/>,       label:'Executive Insight'},
    {id:'ksm',       icon:<Building2 size={13}/>,       label:'KSM & Departemen'},
    {id:'table1',    icon:<TableIcon size={13}/>,       label:'Distribusi Level'},
    {id:'table2',    icon:<Grid3X3 size={13}/>,         label:'Per Kelompok'},
    {id:'laporan',   icon:<FileSpreadsheet size={13}/>, label:'Laporan'},
  ];



  const renderStrategicTab = () => {
    if (!strategicData) return null;
    return (
      <div style={{display:'flex',flexDirection:'column',gap:24}} className="komp-fade-up">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1.5fr',gap:20}}>
          {/* Rekomendasi */}
          <div style={{display:'flex',flexDirection:'column',gap:0}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <div style={{width:36,height:36,borderRadius:12,background:'linear-gradient(135deg,#fef3c7,#fde68a)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(245,158,11,0.2)'}}>
                <Lightbulb size={18} color="#d97706"/>
              </div>
              <div>
                <h2 style={{fontWeight:900,fontSize:15,color:'#0f172a',margin:0}}>Top 5 Rekomendasi Prioritas</h2>
                <p style={{fontSize:11,color:'#64748b',margin:0}}>Klik kartu untuk melihat daftar pasien terdampak</p>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {strategicData.recs.map((r, i) => {
                const groupName = strategicData.top5[i]?.name;
                const accentColors = ['#f43f5e','#f97316','#eab308','#22c55e','#3b82f6'];
                const numBg = ['#fff1f2','#fff7ed','#fefce8','#f0fdf4','#eff6ff'];
                const numColor = ['#e11d48','#ea580c','#ca8a04','#16a34a','#2563eb'];
                return (
                  <div key={i}
                    onClick={() => groupName && setDrill({
                      title: `Pasien Di Luar Kompetensi — ${dn(groupName)}`,
                      filterFn: row => row._meta?.highestGroup === groupName && row._meta?.isOutsideOverall
                    })}
                    style={{background:'white',border:'1.5px solid #e2e8f0',borderRadius:14,padding:'14px 16px',
                      boxShadow:'0 2px 8px rgba(0,0,0,0.04)',transition:'all 0.25s',cursor:'pointer',
                      borderLeft:`4px solid ${accentColors[i]}`}}
                    onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.10)';e.currentTarget.style.transform='translateX(4px)';e.currentTarget.style.background='#fafafa';}}
                    onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)';e.currentTarget.style.transform='translateX(0)';e.currentTarget.style.background='white';}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                      <div style={{width:24,height:24,borderRadius:8,background:numBg[i],display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontWeight:900,fontSize:11,color:numColor[i]}}>
                        {i+1}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:4}}>
                          <h3 style={{fontSize:12,fontWeight:800,color:'#1e293b',margin:0}}>{r.title}</h3>
                          <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:9,fontWeight:800,color:'#0d9488',background:'#f0fdfa',border:'1px solid #99f6e4',padding:'2px 8px',borderRadius:999,whiteSpace:'nowrap',flexShrink:0}}>
                            <Users size={9}/> Lihat Pasien
                          </span>
                        </div>
                        <p style={{fontSize:11,color:'#64748b',lineHeight:1.5,margin:0}}>{r.text}</p>
                        <div style={{marginTop:8,display:'flex',gap:6}}>
                          <span style={{fontSize:9,fontWeight:700,color:'#dc2626',background:'#fff1f2',border:'1px solid #fecdd3',padding:'2px 8px',borderRadius:999}}>
                            {fmt(strategicData.top5[i]?.volume)} kasus anomali
                          </span>
                          <span style={{fontSize:9,fontWeight:700,color:'#7c3aed',background:'#f5f3ff',border:'1px solid #ddd6fe',padding:'2px 8px',borderRadius:999}}>
                            {fmtRp(strategicData.top5[i]?.revenue)} potensi
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bar Chart Revenue */}
          <div style={{background:'white',border:'1.5px solid #e2e8f0',borderRadius:20,padding:24,boxShadow:'0 4px 16px rgba(0,0,0,0.05)'}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20}}>
              <div>
                <h3 style={{fontWeight:900,fontSize:15,color:'#0f172a',margin:0}}>Potensi Lost Revenue</h3>
                <p style={{fontSize:11,color:'#64748b',margin:'4px 0 0 0'}}>Klik baris untuk melihat daftar pasien terdampak</p>
              </div>
              <div style={{padding:'8px 10px',background:'#fff1f2',borderRadius:10,border:'1px solid #fecdd3'}}>
                <TrendingDown size={18} color="#dc2626"/>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {strategicData.top5.map((item, i) => {
                const barColors = [['#f43f5e','#fb7185'],['#f97316','#fb923c'],['#eab308','#facc15'],['#22c55e','#4ade80'],['#3b82f6','#60a5fa']];
                const shadowColors = ['rgba(244,63,94,0.35)','rgba(249,115,22,0.35)','rgba(234,179,8,0.35)','rgba(34,197,94,0.35)','rgba(59,130,246,0.35)'];
                return (
                  <div key={i}
                    onClick={() => setDrill({
                      title: `Pasien Di Luar Kompetensi — ${dn(item.name)}`,
                      filterFn: row => row._meta?.highestGroup === item.name && row._meta?.isOutsideOverall
                    })}
                    style={{padding:'10px 12px',borderRadius:12,border:'1.5px solid #f1f5f9',cursor:'pointer',transition:'all 0.2s',background:'#fafafa'}}
                    onMouseEnter={e=>{e.currentTarget.style.background='#f0fdfa';e.currentTarget.style.borderColor='#99f6e4';e.currentTarget.style.boxShadow='0 4px 12px rgba(13,148,136,0.08)';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='#fafafa';e.currentTarget.style.borderColor='#f1f5f9';e.currentTarget.style.boxShadow='none';}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:20,height:20,borderRadius:6,background:barColors[i][0],display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:900,color:'white',flexShrink:0}}>{i+1}</div>
                        <span style={{fontSize:12,fontWeight:700,color:'#334155'}}>{dn(item.name)}</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:12,fontWeight:900,color:barColors[i][0]}}>{fmtRp(item.revenue)}</span>
                        <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:9,fontWeight:800,color:'#0d9488',background:'#f0fdfa',border:'1px solid #99f6e4',padding:'2px 7px',borderRadius:999}}>
                          <Eye size={9}/> Detail
                        </span>
                      </div>
                    </div>
                    <div style={{background:'#f1f5f9',borderRadius:999,height:10,overflow:'hidden',position:'relative'}}>
                      <div style={{
                        height:'100%',borderRadius:999,
                        background:`linear-gradient(90deg,${barColors[i][0]},${barColors[i][1]})`,
                        width:`${Math.max(3,(item.revenue/(strategicData.topRevenue[0]?.revenue||1))*100)}%`,
                        transition:'width 1.2s cubic-bezier(0.22,1,0.36,1)',
                        boxShadow:`0 2px 6px ${shadowColors[i]}`
                      }}/>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',marginTop:5}}>
                      <span style={{fontSize:9,color:'#94a3b8',fontWeight:600}}>{fmt(item.volume)} kasus anomali</span>
                      <span style={{fontSize:9,color:'#94a3b8',fontWeight:600}}>avg {fmtRp(item.avgTariff)}/kasus</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {strategicData.topRevenue.length > 5 && (
              <div style={{marginTop:14,paddingTop:12,borderTop:'1px solid #f1f5f9'}}>
                <p style={{fontSize:10,color:'#94a3b8',fontWeight:700,margin:'0 0 8px 0'}}>Kelompok lainnya ({strategicData.topRevenue.length - 5} lebih)</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {strategicData.topRevenue.slice(5).map((item, i) => (
                    <button key={i}
                      onClick={() => setDrill({
                        title: `Pasien Di Luar Kompetensi — ${dn(item.name)}`,
                        filterFn: row => row._meta?.highestGroup === item.name && row._meta?.isOutsideOverall
                      })}
                      style={{fontSize:10,fontWeight:700,color:'#475569',background:'#f8fafc',border:'1.5px solid #e2e8f0',padding:'4px 12px',borderRadius:999,cursor:'pointer',transition:'all 0.2s'}}
                      onMouseEnter={e=>{e.currentTarget.style.background='#f0fdfa';e.currentTarget.style.borderColor='#99f6e4';e.currentTarget.style.color='#0d9488';}}
                      onMouseLeave={e=>{e.currentTarget.style.background='#f8fafc';e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.color='#475569';}}>
                      {dn(item.name)} · {fmtRp(item.revenue)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scatter / Bubble Chart */}
        <div style={{background:'white',border:'1.5px solid #e2e8f0',borderRadius:20,padding:24,boxShadow:'0 4px 16px rgba(0,0,0,0.05)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:36,height:36,borderRadius:12,background:'linear-gradient(135deg,#ede9fe,#ddd6fe)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(99,102,241,0.2)'}}>
                <Target size={18} color="#7c3aed"/>
              </div>
              <div>
                <h3 style={{fontWeight:900,fontSize:15,color:'#0f172a',margin:0}}>Matriks Kuadran Prioritas</h3>
                <p style={{fontSize:11,color:'#64748b',margin:0}}>Volume Kasus × Rata-rata Tarif · <strong>Klik gelembung</strong> untuk detail pasien</p>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,fontSize:9,color:'#94a3b8',fontWeight:700}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:'#f43f5e'}}/> Prioritas Tinggi
              <div style={{width:8,height:8,borderRadius:'50%',background:'#f97316',marginLeft:6}}/> Menengah
              <div style={{width:8,height:8,borderRadius:'50%',background:'#6366f1',marginLeft:6}}/> Rendah
            </div>
          </div>
          <div style={{position:'relative',width:'100%',height:340,borderLeft:'2px solid #e2e8f0',borderBottom:'2px solid #e2e8f0',marginTop:20}}>
            <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(226,232,240,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(226,232,240,0.4) 1px,transparent 1px)',backgroundSize:'25% 25%',pointerEvents:'none'}}/>
            <div style={{position:'absolute',right:8,top:8,fontSize:9,fontWeight:700,color:'#dc2626',background:'#fff1f2',padding:'2px 8px',borderRadius:6,border:'1px solid #fecdd3',pointerEvents:'none'}}>HIGH TARIF · HIGH VOL</div>
            <div style={{position:'absolute',left:8,top:8,fontSize:9,fontWeight:700,color:'#d97706',background:'#fffbeb',padding:'2px 8px',borderRadius:6,border:'1px solid #fde68a',pointerEvents:'none'}}>HIGH TARIF · LOW VOL</div>
            <div style={{position:'absolute',right:8,bottom:8,fontSize:9,fontWeight:700,color:'#2563eb',background:'#eff6ff',padding:'2px 8px',borderRadius:6,border:'1px solid #bfdbfe',pointerEvents:'none'}}>LOW TARIF · HIGH VOL</div>
            <div style={{position:'absolute',left:8,bottom:8,fontSize:9,fontWeight:700,color:'#64748b',background:'#f8fafc',padding:'2px 8px',borderRadius:6,border:'1px solid #e2e8f0',pointerEvents:'none'}}>LOW TARIF · LOW VOL</div>
            <span style={{position:'absolute',bottom:-22,left:'50%',transform:'translateX(-50%)',fontSize:10,color:'#64748b',fontWeight:700}}>Volume Kasus →</span>
            <span style={{position:'absolute',left:-36,top:'50%',transform:'translateY(-50%) rotate(-90deg)',fontSize:10,color:'#64748b',fontWeight:700}}>Avg Tarif →</span>
            {strategicData.scatter.map((item, i) => {
              const xPct = strategicData.maxVol ? (item.volume / strategicData.maxVol) * 90 : 50;
              const yPct = strategicData.maxTariff ? (item.avgTariff / strategicData.maxTariff) * 90 : 50;
              const sz = Math.max(16, Math.min(56, (item.revenue / (strategicData.topRevenue[0]?.revenue || 1)) * 56));
              const colors = ['#f43f5e','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#14b8a6','#ec4899','#06b6d4','#84cc16'];
              const color = colors[i % colors.length];
              return (
                <div key={i}
                  onClick={() => setDrill({
                    title: `Pasien Di Luar Kompetensi — ${dn(item.name)}`,
                    filterFn: row => row._meta?.highestGroup === item.name && row._meta?.isOutsideOverall
                  })}
                  title={`${dn(item.name)}\nVolume: ${fmt(item.volume)} kasus\nRata-rata: ${fmtRp(item.avgTariff)}\nTotal: ${fmtRp(item.revenue)}\n\nKlik untuk lihat pasien`}
                  style={{position:'absolute',left:`${xPct}%`,bottom:`${yPct}%`,width:sz,height:sz,
                    borderRadius:'50%',background:color,opacity:0.78,cursor:'pointer',
                    transform:'translate(-50%,50%)',transition:'all 0.25s',
                    boxShadow:`0 4px 12px ${color}55`,
                    display:'flex',alignItems:'center',justifyContent:'center'}}
                  onMouseEnter={e=>{
                    e.currentTarget.style.opacity='1';
                    e.currentTarget.style.transform='translate(-50%,50%) scale(1.25)';
                    e.currentTarget.style.zIndex='10';
                    e.currentTarget.style.boxShadow=`0 8px 24px ${color}77`;
                  }}
                  onMouseLeave={e=>{
                    e.currentTarget.style.opacity='0.78';
                    e.currentTarget.style.transform='translate(-50%,50%) scale(1)';
                    e.currentTarget.style.zIndex='1';
                    e.currentTarget.style.boxShadow=`0 4px 12px ${color}55`;
                  }}>
                  {sz >= 26 && <span style={{fontSize:9,fontWeight:900,color:'white',pointerEvents:'none',textShadow:'0 1px 3px rgba(0,0,0,0.5)'}}>{i+1}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return createPortal(
    <div style={{position:'fixed',inset:0,zIndex:9999,background:'linear-gradient(160deg,#f8fafc 0%,#f0fdfa 40%,#fafafa 100%)',display:'flex',flexDirection:'column',fontFamily:'inherit'}}>
      <style>{styles}</style>

      {/* ── Header ── */}
      <div className="header-light" style={{flexShrink:0,zIndex:20}}>
        {/* Top bar */}
        <div style={{padding:'12px 20px',display:'flex',alignItems:'center',gap:16,borderBottom:'1px solid #f1f5f9'}}>
          <button onClick={onBack} style={{width:36,height:36,borderRadius:10,border:'1.5px solid #e2e8f0',background:'#f8fafc',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#64748b',transition:'all 0.2s',flexShrink:0}}
            onMouseEnter={e=>{e.currentTarget.style.background='#f0fdfa';e.currentTarget.style.borderColor='#99f6e4';e.currentTarget.style.color='#0d9488';}}
            onMouseLeave={e=>{e.currentTarget.style.background='#f8fafc';e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.color='#64748b';}}>
            <ArrowLeft size={16}/>
          </button>

          <div style={{display:'flex',alignItems:'center',gap:12,flex:1}}>
            <div style={{width:38,height:38,borderRadius:12,background:'linear-gradient(135deg,#f0fdfa,#ccfbf1)',border:'1.5px solid #99f6e4',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 2px 8px rgba(13,148,136,0.12)'}}>
              <ShieldAlert size={19} color="#0d9488"/>
            </div>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <h1 style={{fontWeight:900,fontSize:16,color:'#0f172a',margin:0,letterSpacing:'-0.02em'}}>Analisis Kompetensi Layanan</h1>
                <span style={{fontSize:9,fontWeight:800,color:'#0d9488',background:'#f0fdfa',border:'1.5px solid #99f6e4',padding:'2px 8px',borderRadius:999,letterSpacing:'0.1em',textTransform:'uppercase'}}>LIVE</span>
              </div>
              <p style={{fontSize:11,color:'#64748b',margin:'2px 0 0 0'}}>
                {fmt(data.totalPatients)} kasus · {fmt(data.patientsOutsideCompetency)} di luar kompetensi ({pctOut}%)
              </p>
            </div>
          </div>

          {/* Tab nav */}
          <div style={{display:'flex',gap:3,background:'#f8fafc',borderRadius:12,padding:4,border:'1.5px solid #e2e8f0'}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                className={`tab-btn ${tab===t.id?'tab-btn-active':'tab-btn-inactive'}`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI strip */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:0}}>
          {[
            { label:'Total Kasus', val:fmt(data.totalPatients), sub:fmtRp(data.totalTarifInacbg)+' INA-CBG', icon:<Activity size={15}/>, iconBg:'#f1f5f9', iconColor:'#64748b', valColor:'#0f172a', accent:'#fafafa', border:'#f1f5f9' },
            { label:'Sesuai Kompetensi', val:fmt(data.patientsWithinCompetency), sub:`${(100-parseFloat(pctOut)).toFixed(1)}% dari total`, icon:<CheckCircle size={15}/>, iconBg:'#dcfce7', iconColor:'#16a34a', valColor:'#14532d', accent:'#f0fdf4', border:'#bbf7d0' },
            { label:'Di Luar Kompetensi', val:fmt(data.patientsOutsideCompetency), sub:`${pctOut}% dari total`, icon:<AlertCircle size={15}/>, iconBg:'#fee2e2', iconColor:'#dc2626', valColor:'#7f1d1d', accent:'#fff1f2', border:'#fecdd3' },
            { label:'Potensi Loss Total', val:fmtRp(data.tarifOutsideCompetency), sub:'Tarif INA-CBG bocor', icon:<TrendingDown size={15}/>, iconBg:'#fef3c7', iconColor:'#d97706', valColor:'#78350f', accent:'#fffbeb', border:'#fde68a' },
          ].map((k,i)=>(
            <div key={i} style={{padding:'14px 20px',borderRight:i<3?'1px solid #f1f5f9':'none',background:k.accent,borderTop:`3px solid ${k.border}`,transition:'background 0.2s'}}
              onMouseEnter={e=>e.currentTarget.style.background='white'}
              onMouseLeave={e=>e.currentTarget.style.background=k.accent}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                <p style={{fontSize:9,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.1em',margin:0}}>{k.label}</p>
                <div style={{width:26,height:26,borderRadius:8,background:k.iconBg,display:'flex',alignItems:'center',justifyContent:'center',color:k.iconColor}}>
                  {k.icon}
                </div>
              </div>
              <p style={{fontSize:22,fontWeight:900,color:k.valColor,margin:0,letterSpacing:'-0.02em'}}>{k.val}</p>
              <p style={{fontSize:10,color:'#94a3b8',margin:'3px 0 0 0'}}>{k.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{flex:1,overflowY:'auto',padding:'24px'}} className="komp-scrollbar">
        <div style={{maxWidth:1600,margin:'0 auto'}}>

          {/* ── Tarif Summary ── */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}} className="komp-fade-up">
            {[{
              label:'Total Pendapatan INA-CBG', val:fmtRp(data.totalTarifInacbg),
              sub:`${fmt(data.totalPatients)} kasus`,
              accentColor:'#3b82f6', accentBg:'rgba(59,130,246,0.08)',
              badge:'INA-CBG', badgeBg:'#dbeafe', badgeColor:'#1d4ed8',
              borderLeft:'4px solid #3b82f6'
            },{
              label:'Total Pendapatan iDRG', val:fmtRp(data.groupTableRows.reduce((s,r)=>s+r.totalIdrg,0)),
              sub:'Tarif versi iDRG',
              accentColor:'#8b5cf6', accentBg:'rgba(139,92,246,0.08)',
              badge:'iDRG', badgeBg:'#ede9fe', badgeColor:'#6d28d9',
              borderLeft:'4px solid #8b5cf6'
            },{
              label:'Selisih iDRG vs INA-CBG',
              get val() { const t=data.groupTableRows.reduce((s,r)=>s+r.totalIdrg,0)-data.totalTarifInacbg; return (t>=0?'+':'')+fmtRp(t); },
              get sub() { const t=data.groupTableRows.reduce((s,r)=>s+r.totalIdrg,0); const sel=t-data.totalTarifInacbg; return data.totalTarifInacbg>0?`${sel>=0?'+':''}${(sel/data.totalTarifInacbg*100).toFixed(1)}% vs INA-CBG`:'-'; },
              get accentColor() { const t=data.groupTableRows.reduce((s,r)=>s+r.totalIdrg,0)-data.totalTarifInacbg; return t>=0?'#10b981':'#ef4444'; },
              get accentBg() { const t=data.groupTableRows.reduce((s,r)=>s+r.totalIdrg,0)-data.totalTarifInacbg; return t>=0?'rgba(16,185,129,0.08)':'rgba(239,68,68,0.08)'; },
              get badge() { const t=data.groupTableRows.reduce((s,r)=>s+r.totalIdrg,0)-data.totalTarifInacbg; return t>=0?'▲ Surplus':'▼ Defisit'; },
              get badgeBg() { const t=data.groupTableRows.reduce((s,r)=>s+r.totalIdrg,0)-data.totalTarifInacbg; return t>=0?'#dcfce7':'#fee2e2'; },
              get badgeColor() { const t=data.groupTableRows.reduce((s,r)=>s+r.totalIdrg,0)-data.totalTarifInacbg; return t>=0?'#166534':'#991b1b'; },
              get borderLeft() { const t=data.groupTableRows.reduce((s,r)=>s+r.totalIdrg,0)-data.totalTarifInacbg; return `4px solid ${t>=0?'#10b981':'#ef4444'}`; },
            }].map((k,i)=>(
              <div key={i} style={{background:'white',borderRadius:16,padding:'20px 22px',boxShadow:'0 2px 12px rgba(0,0,0,0.05)',borderLeft:k.borderLeft,border:'1.5px solid #f1f5f9',borderLeftWidth:4,transition:'all 0.25s'}}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 6px 24px rgba(0,0,0,0.09)';e.currentTarget.style.transform='translateY(-2px)';}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.05)';e.currentTarget.style.transform='translateY(0)';}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                  <p style={{fontSize:10,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.08em',margin:0}}>{k.label}</p>
                  <span style={{fontSize:10,fontWeight:800,background:k.badgeBg,color:k.badgeColor,padding:'3px 10px',borderRadius:999}}>{k.badge}</span>
                </div>
                <p style={{fontSize:22,fontWeight:900,color:k.accentColor,margin:'4px 0',letterSpacing:'-0.02em'}}>{k.val}</p>
                <p style={{fontSize:11,color:'#94a3b8',margin:0}}>{k.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Strategic Tab ── */}
          {tab==='strategic' && renderStrategicTab()}

          {/* ── KSM & Departemen Tab ── */}
          {tab==='ksm' && isKsmLoading && (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'100px 20px',background:'white',borderRadius:20,border:'1.5px solid #e2e8f0',boxShadow:'0 4px 20px rgba(0,0,0,0.05)',marginTop:20}} className="komp-fade-up">
              <div style={{animation:'spin-slow 1.5s linear infinite',marginBottom:20}}>
                <Activity size={40} color="#0d9488" />
              </div>
              <h3 style={{fontWeight:900,fontSize:18,color:'#0f172a',margin:0}}>Menganalisis Kinerja KSM...</h3>
              <p style={{fontSize:13,color:'#64748b',margin:'8px 0 0 0'}}>Melakukan pemetaan kompetensi pada seluruh data layanan</p>
            </div>
          )}
          {tab==='ksm' && !isKsmLoading && ksmData && (() => {
            const sortFn = ksmSort==='loss' ? (a,b)=>b.loss-a.loss : ksmSort==='pct' ? (a,b)=>(b.total?b.luar/b.total:0)-(a.total?a.luar/a.total:0) : ksmSort==='total' ? (a,b)=>b.total-a.total : (a,b)=>a.name.localeCompare(b.name);
            const q = ksmSearch.toLowerCase();

            const renderTable = (items, type) => {
              const filtered = q ? items.filter(d => d.name.toLowerCase().includes(q) || (d.dept||'').toLowerCase().includes(q) || (d.ksm||'').toLowerCase().includes(q)) : items;
              const sorted = [...filtered].sort(sortFn);
              const maxLoss = Math.max(...items.map(d=>d.loss), 1);

              return (
                <div style={{background:'white',borderRadius:16,border:'1.5px solid #e2e8f0',overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,0.05)'}}>
                  <table style={{width:'100%',fontSize:11,borderCollapse:'collapse'}}>
                    <thead style={{background:'#f8fafc',position:'sticky',top:0,zIndex:1}}>
                      <tr>
                        <th style={{padding:'10px 14px',textAlign:'left',fontWeight:800,color:'#64748b',textTransform:'uppercase',fontSize:9,letterSpacing:'0.06em',borderBottom:'1.5px solid #e2e8f0',width:32}}>No</th>
                        <th style={{padding:'10px 14px',textAlign:'left',fontWeight:800,color:'#64748b',textTransform:'uppercase',fontSize:9,letterSpacing:'0.06em',borderBottom:'1.5px solid #e2e8f0'}}>{type==='dpjp'?'DPJP':type==='ksm'?'KSM':'Departemen'}</th>
                        {type==='dpjp' && <th style={{padding:'10px 14px',textAlign:'left',fontWeight:800,color:'#64748b',textTransform:'uppercase',fontSize:9,letterSpacing:'0.06em',borderBottom:'1.5px solid #e2e8f0'}}>KSM</th>}
                        <th style={{padding:'10px 14px',textAlign:'right',fontWeight:800,color:'#64748b',textTransform:'uppercase',fontSize:9,letterSpacing:'0.06em',borderBottom:'1.5px solid #e2e8f0',width:70}}>Total</th>
                        <th style={{padding:'10px 14px',textAlign:'center',fontWeight:800,color:'#64748b',textTransform:'uppercase',fontSize:9,letterSpacing:'0.06em',borderBottom:'1.5px solid #e2e8f0',width:130}}>Sesuai / Di Luar</th>
                        <th style={{padding:'10px 14px',textAlign:'right',fontWeight:800,color:'#64748b',textTransform:'uppercase',fontSize:9,letterSpacing:'0.06em',borderBottom:'1.5px solid #e2e8f0',width:60}}>% Luar</th>
                        <th style={{padding:'10px 14px',textAlign:'right',fontWeight:800,color:'#64748b',textTransform:'uppercase',fontSize:9,letterSpacing:'0.06em',borderBottom:'1.5px solid #e2e8f0',width:130}}>Potensi Loss</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.slice(0,100).map((d,i) => {
                        const pct = d.total ? ((d.luar/d.total)*100) : 0;
                        const isAlert = pct > 30;
                        const isWarn = pct > 15 && pct <= 30;
                        const displayName = type==='dpjp' ? maskName(d.name) : d.name;
                        const barW = Math.max(2, (d.loss/maxLoss)*100);
                        return (
                          <tr key={i}
                            onClick={() => setDrill({
                              title: `${type==='dept'?'Dept':'KSM'}: ${type==='dpjp'?maskName(d.name):d.name}`,
                              filterFn: type==='dept'
                                ? row => { const r2=resolveKsmDept(row['DPJP']||'-',ksmOverrides||{}); return r2.dept===d.name; }
                                : type==='ksm'
                                ? row => { const r2=resolveKsmDept(row['DPJP']||'-',ksmOverrides||{}); return r2.ksm===d.name; }
                                : row => (row['DPJP']||'-').trim()===d.name.trim()
                            })}
                            style={{borderBottom:'1px solid #f8fafc',background:isAlert?'#fff5f5':i%2===0?'white':'#fafafa',cursor:'pointer',transition:'all 0.15s'}}
                            onMouseEnter={e=>{e.currentTarget.style.background='#f0fdfa';e.currentTarget.style.borderLeft='3px solid #14b8a6';}}
                            onMouseLeave={e=>{e.currentTarget.style.background=isAlert?'#fff5f5':i%2===0?'white':'#fafafa';e.currentTarget.style.borderLeft='none';}}>
                            <td style={{padding:'10px 14px',color:'#94a3b8',fontWeight:700}}>{i+1}</td>
                            <td style={{padding:'10px 14px'}}>
                              <div style={{display:'flex',alignItems:'center',gap:8}}>
                                <span style={{fontWeight:800,color:'#0f172a',fontSize:12}}>{displayName}</span>
                                {isAlert && <span style={{fontSize:8,fontWeight:800,background:'#fee2e2',color:'#dc2626',padding:'2px 6px',borderRadius:999,whiteSpace:'nowrap'}}>🚨 ALERT</span>}
                                {isWarn && <span style={{fontSize:8,fontWeight:800,background:'#fffbeb',color:'#d97706',padding:'2px 6px',borderRadius:999,whiteSpace:'nowrap'}}>⚠️ WARN</span>}
                              </div>
                            </td>
                            {type==='dpjp' && <td style={{padding:'10px 14px',fontSize:10,color:'#64748b',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={d.ksm}>{d.ksm}</td>}
                            <td style={{padding:'10px 14px',textAlign:'right',fontWeight:900,color:'#0f172a'}}>{fmt(d.total)}</td>
                            <td style={{padding:'10px 14px'}}>
                              <div style={{display:'flex',alignItems:'center',gap:6}}>
                                <div style={{flex:1,display:'flex',height:8,borderRadius:999,overflow:'hidden',background:'#f1f5f9'}}>
                                  <div style={{width:`${d.total?(d.sesuai/d.total)*100:0}%`,background:'#10b981',borderRadius:'999px 0 0 999px',transition:'width 0.8s ease'}}/>
                                  <div style={{width:`${d.total?(d.luar/d.total)*100:0}%`,background:'#ef4444',borderRadius:'0 999px 999px 0',transition:'width 0.8s ease'}}/>
                                </div>
                                <span style={{fontSize:9,color:'#64748b',fontWeight:700,whiteSpace:'nowrap'}}>{fmt(d.sesuai)}/{fmt(d.luar)}</span>
                              </div>
                            </td>
                            <td style={{padding:'10px 14px',textAlign:'right'}}>
                              <span style={{fontWeight:900,fontSize:12,color:isAlert?'#dc2626':isWarn?'#d97706':'#16a34a'}}>{pct.toFixed(1)}%</span>
                            </td>
                            <td style={{padding:'10px 14px',textAlign:'right'}}>
                              <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'flex-end'}}>
                                <div style={{width:60,height:6,borderRadius:999,background:'#f1f5f9',overflow:'hidden'}}>
                                  <div style={{height:'100%',borderRadius:999,background:isAlert?'#ef4444':isWarn?'#f59e0b':'#94a3b8',width:`${barW}%`,transition:'width 0.8s ease'}}/>
                                </div>
                                <span style={{fontWeight:900,color:d.loss>0?'#dc2626':'#64748b',fontSize:11,whiteSpace:'nowrap'}}>{fmtRp(d.loss)}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {sorted.length===0 && <tr><td colSpan={type==='dpjp'?7:6} style={{padding:40,textAlign:'center',color:'#94a3b8'}}>Tidak ada data</td></tr>}
                    </tbody>
                  </table>
                </div>
              );
            };

            // Heatmap render
            const renderHeatmap = () => {
              if (!ksmData.heatGroupList.length) return null;
              const topKsms = ksmData.ksms.filter(k => k.luar > 0).slice(0, 15);
              if (!topKsms.length) return null;
              const maxVal = Math.max(...topKsms.flatMap(k => ksmData.heatGroupList.map(g => ksmData.heatmap[k.name]?.[g] || 0)), 1);
              const getColor = (val) => {
                if (!val) return '#fafafa';
                const intensity = Math.min(val / maxVal, 1);
                if (intensity < 0.2) return '#fef2f2';
                if (intensity < 0.4) return '#fecaca';
                if (intensity < 0.6) return '#f87171';
                if (intensity < 0.8) return '#ef4444';
                return '#dc2626';
              };
              const getTextColor = (val) => {
                if (!val) return '#e2e8f0';
                const intensity = Math.min(val / maxVal, 1);
                return intensity > 0.5 ? 'white' : '#1e293b';
              };
              return (
                <div style={{background:'white',borderRadius:16,border:'1.5px solid #e2e8f0',padding:20,boxShadow:'0 2px 12px rgba(0,0,0,0.05)',overflow:'auto'}} className="komp-scrollbar">
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                    <div style={{width:32,height:32,borderRadius:10,background:'linear-gradient(135deg,#fee2e2,#fecaca)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <Grid3X3 size={16} color="#dc2626"/>
                    </div>
                    <div>
                      <h3 style={{fontWeight:900,fontSize:14,color:'#0f172a',margin:0}}>Heatmap KSM × Kelompok Layanan</h3>
                      <p style={{fontSize:10,color:'#64748b',margin:0}}>Jumlah kasus <strong>di luar kompetensi</strong> per KSM per kelompok layanan · Klik sel untuk drilldown</p>
                    </div>
                  </div>
                  <div style={{overflowX:'auto'}}>
                    <table style={{fontSize:9,borderCollapse:'collapse',minWidth:ksmData.heatGroupList.length*45+200}}>
                      <thead>
                        <tr>
                          <th style={{padding:'6px 8px',textAlign:'left',fontWeight:800,color:'#64748b',borderBottom:'1.5px solid #e2e8f0',position:'sticky',left:0,background:'white',zIndex:2,minWidth:180}}>KSM</th>
                          {ksmData.heatGroupList.map(g => (
                            <th key={g} style={{padding:'4px 3px',textAlign:'center',fontWeight:700,color:'#94a3b8',borderBottom:'1.5px solid #e2e8f0',writingMode:'vertical-lr',transform:'rotate(180deg)',height:100,maxWidth:30}} title={g}>
                              {dn(g)}
                            </th>
                          ))}
                          <th style={{padding:'6px 8px',textAlign:'right',fontWeight:800,color:'#64748b',borderBottom:'1.5px solid #e2e8f0',minWidth:50}}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topKsms.map((k,ki) => {
                          const rowTotal = ksmData.heatGroupList.reduce((s,g) => s + (ksmData.heatmap[k.name]?.[g]||0), 0);
                          return (
                            <tr key={ki}>
                              <td style={{padding:'5px 8px',fontWeight:700,color:'#334155',borderBottom:'1px solid #f8fafc',position:'sticky',left:0,background:'white',zIndex:1,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={k.name}>{k.name}</td>
                              {ksmData.heatGroupList.map(g => {
                                const val = ksmData.heatmap[k.name]?.[g] || 0;
                                return (
                                  <td key={g}
                                    onClick={() => val > 0 && setDrill({
                                      title: `${k.name} — ${dn(g)} (Di Luar)`,
                                      filterFn: row => {
                                        const r2 = resolveKsmDept(row['DPJP']||'-', ksmOverrides||{});
                                        return r2.ksm === k.name && row._meta?.highestGroup === g && row._meta?.isOutsideOverall;
                                      }
                                    })}
                                    style={{padding:'3px 2px',textAlign:'center',fontWeight:800,fontSize:9,
                                      background:getColor(val),color:getTextColor(val),
                                      borderBottom:'1px solid #f8fafc',borderRight:'1px solid rgba(255,255,255,0.5)',
                                      cursor:val>0?'pointer':'default',transition:'all 0.15s',borderRadius:2,minWidth:30}}
                                    title={`${k.name} × ${dn(g)}: ${val} kasus di luar`}>
                                    {val || ''}
                                  </td>
                                );
                              })}
                              <td style={{padding:'5px 8px',textAlign:'right',fontWeight:900,color:'#dc2626',borderBottom:'1px solid #f8fafc',fontSize:10}}>{rowTotal}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginTop:12,paddingTop:10,borderTop:'1px solid #f1f5f9'}}>
                    <span style={{fontSize:9,color:'#94a3b8',fontWeight:700}}>Intensitas:</span>
                    {[{label:'0',bg:'#fafafa'},{label:'Rendah',bg:'#fef2f2'},{label:'Sedang',bg:'#fecaca'},{label:'Tinggi',bg:'#f87171'},{label:'Kritis',bg:'#dc2626'}].map(l => (
                      <div key={l.label} style={{display:'flex',alignItems:'center',gap:4}}>
                        <div style={{width:14,height:10,borderRadius:3,background:l.bg,border:'1px solid #e2e8f0'}}/>
                        <span style={{fontSize:8,color:'#64748b',fontWeight:600}}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            };

            return (
              <div style={{display:'flex',flexDirection:'column',gap:20}} className="komp-fade-up">
                {/* Sub-nav */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
                  <div style={{display:'flex',gap:3,background:'#f8fafc',borderRadius:12,padding:4,border:'1.5px solid #e2e8f0'}}>
                    {[{id:'dept',icon:<Building2 size={12}/>,label:'Departemen'},{id:'ksm',icon:<Users size={12}/>,label:'KSM'},{id:'dpjp',icon:<User size={12}/>,label:'DPJP'}].map(v => (
                      <button key={v.id} onClick={() => {setKsmSubView(v.id);setKsmSearch('');}}
                        style={{display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:9,border:'none',fontSize:11,fontWeight:700,cursor:'pointer',transition:'all 0.2s',
                          background:ksmSubView===v.id?'linear-gradient(135deg,#0d9488,#0f766e)':'transparent',
                          color:ksmSubView===v.id?'white':'#64748b',
                          boxShadow:ksmSubView===v.id?'0 3px 10px rgba(13,148,136,0.25)':'none'}}>
                        {v.icon}{v.label}
                      </button>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <div style={{position:'relative'}}>
                      <Search size={13} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#94a3b8'}}/>
                      <input value={ksmSearch} onChange={e=>setKsmSearch(e.target.value)}
                        placeholder={`Cari ${ksmSubView==='dept'?'departemen':ksmSubView==='ksm'?'KSM':'DPJP'}...`}
                        style={{padding:'7px 12px 7px 30',borderRadius:10,border:'1.5px solid #e2e8f0',fontSize:11,width:200,outline:'none',transition:'border 0.2s'}}/>
                    </div>
                    <select value={ksmSort} onChange={e=>setKsmSort(e.target.value)}
                      style={{padding:'7px 12px',borderRadius:10,border:'1.5px solid #e2e8f0',fontSize:11,color:'#475569',fontWeight:700,outline:'none',cursor:'pointer',background:'white'}}>
                      <option value="loss">Urutkan: Loss Tertinggi</option>
                      <option value="pct">Urutkan: % Di Luar</option>
                      <option value="total">Urutkan: Total Kasus</option>
                      <option value="name">Urutkan: Nama A-Z</option>
                    </select>
                  </div>
                </div>

                {/* KPI Summary */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
                  {[
                    {label:ksmSubView==='dept'?'Total Departemen':ksmSubView==='ksm'?'Total KSM':'Total DPJP', val:fmt(ksmSubView==='dept'?ksmData.depts.length:ksmSubView==='ksm'?ksmData.ksms.length:ksmData.dpjps.length), icon:<Building2 size={15}/>, bg:'#f8fafc', iconBg:'#f1f5f9', color:'#0f172a'},
                    {label:'Dengan Alert (>30%)', val:fmt((ksmSubView==='dept'?ksmData.depts:ksmSubView==='ksm'?ksmData.ksms:ksmData.dpjps).filter(d=>d.total&&(d.luar/d.total)>0.3).length), icon:<AlertTriangle size={15}/>, bg:'#fff1f2', iconBg:'#fee2e2', color:'#dc2626'},
                    {label:'Total Kasus Di Luar', val:fmt((ksmSubView==='dept'?ksmData.depts:ksmSubView==='ksm'?ksmData.ksms:ksmData.dpjps).reduce((s,d)=>s+d.luar,0)), icon:<AlertCircle size={15}/>, bg:'#fffbeb', iconBg:'#fef3c7', color:'#d97706'},
                    {label:'Total Potensi Loss', val:fmtRp((ksmSubView==='dept'?ksmData.depts:ksmSubView==='ksm'?ksmData.ksms:ksmData.dpjps).reduce((s,d)=>s+d.loss,0)), icon:<TrendingDown size={15}/>, bg:'#fef2f2', iconBg:'#fee2e2', color:'#dc2626'},
                  ].map((k,i) => (
                    <div key={i} style={{background:k.bg,borderRadius:14,padding:'14px 16px',border:'1.5px solid #f1f5f9'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                        <p style={{fontSize:9,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.08em',margin:0}}>{k.label}</p>
                        <div style={{width:26,height:26,borderRadius:8,background:k.iconBg,display:'flex',alignItems:'center',justifyContent:'center'}}>{k.icon}</div>
                      </div>
                      <p style={{fontSize:20,fontWeight:900,color:k.color,margin:0,letterSpacing:'-0.02em'}}>{k.val}</p>
                    </div>
                  ))}
                </div>

                {/* Table */}
                <div style={{maxHeight:480,overflowY:'auto',borderRadius:16}} className="komp-scrollbar">
                  {renderTable(
                    ksmSubView==='dept'?ksmData.depts:ksmSubView==='ksm'?ksmData.ksms:ksmData.dpjps,
                    ksmSubView
                  )}
                </div>

                {/* Heatmap */}
                {ksmSubView !== 'dept' && renderHeatmap()}
              </div>
            );
          })()}

          {/* ── Overview Tab ── */}
          {tab==='overview' && (
            <div style={{display:'flex',flexDirection:'column',gap:24}} className="komp-fade-up">
              <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:20}}>

                {/* Donut Chart */}
                <div style={{background:'white',borderRadius:20,border:'1.5px solid #e2e8f0',padding:20,boxShadow:'0 2px 12px rgba(0,0,0,0.05)'}}>
                  <h3 style={{fontWeight:800,fontSize:13,color:'#0f172a',margin:'0 0 16px 0'}}>Distribusi Level Kompetensi</h3>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
                    <Ring data={donutData} total={data.totalPatients} size={180}/>
                    <div style={{width:'100%',display:'flex',flexDirection:'column',gap:8}}>
                      {donutData.map(d=>{
                        const c=LC[d.name]||LC['Belum Ada Mapping'];
                        const pct=(d.value/data.totalPatients*100).toFixed(1);
                        return (
                          <div key={d.name} style={{display:'flex',alignItems:'center',gap:8}}>
                            <div style={{width:10,height:10,borderRadius:'50%',flexShrink:0,background:c.dot,boxShadow:`0 0 6px ${c.dot}88`}}/>
                            <div style={{flex:1}}>
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                                <span style={{fontSize:11,fontWeight:700,color:'#475569'}}>{d.name}</span>
                                <span style={{fontSize:11,fontWeight:900,color:'#0f172a'}}>{pct}%</span>
                              </div>
                              <div className="progress-bar">
                                <div className="progress-fill" style={{width:`${pct}%`,background:c.dot}}/>
                              </div>
                            </div>
                            <span style={{fontSize:10,color:'#94a3b8',width:44,textAlign:'right'}}>{fmt(d.value)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Group Cards */}
                <div style={{background:'white',borderRadius:20,border:'1.5px solid #e2e8f0',padding:20,boxShadow:'0 2px 12px rgba(0,0,0,0.05)'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                    <div>
                      <h3 style={{fontWeight:800,fontSize:13,color:'#0f172a',margin:0}}>24 Kelompok Layanan</h3>
                      <p style={{fontSize:11,color:'#94a3b8',margin:'3px 0 0 0'}}>Klik kartu untuk melihat detail pasien</p>
                    </div>
                    <div style={{position:'relative'}}>
                      <Search size={12} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#94a3b8'}}/>
                      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari kelompok..."
                        style={{paddingLeft:30,paddingRight:12,paddingTop:8,paddingBottom:8,fontSize:11,border:'1.5px solid #e2e8f0',borderRadius:10,outline:'none',width:180,color:'#334155',background:'#f8fafc',transition:'all 0.2s'}}
                        onFocus={e=>{e.target.style.borderColor='#0d9488';e.target.style.background='white';}}
                        onBlur={e=>{e.target.style.borderColor='#e2e8f0';e.target.style.background='#f8fafc';}}/>
                    </div>
                  </div>

                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:12,overflowY:'auto',maxHeight:560,paddingRight:4}} className="komp-scrollbar">
                    {filteredGroups.filter(r=>r.hasData||search).map((r,idx) => {
                      let sesuai = 0, tidakSesuai = 0;
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
                      [...LEVEL_ORDER,'unknown'].forEach(lv => {
                         const kasus = (r.ranap[lv]?.kasus||0) + (r.rajal[lv]?.kasus||0);
                         if (lv==='unknown'||rsLevel==='Campuran/Tidak Spesifik'||rsLevel==='Belum Ada Mapping') sesuai += kasus;
                         else {
                             const lvIdx = LEVEL_ORDER.indexOf(lv);
                             if (lvIdx <= rsIdx) sesuai += kasus; else tidakSesuai += kasus;
                         }
                      });
                      const total = sesuai + tidakSesuai;
                      const pctSesuai = total > 0 ? (sesuai / total) * 100 : 0;
                      const pctLoss = total > 0 ? (tidakSesuai / total) * 100 : 0;
                      const hasDanger = tidakSesuai > 0 && pctLoss > 20;

                      return (
                        <div key={r.name} onClick={() => setDrill(r.name)}
                          className={`group-card ${hasDanger?'group-card-danger':''}`}
                          style={{padding:'14px 14px 12px',height:158,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
                          {/* Background watermark */}
                          <div style={{position:'absolute',right:-8,bottom:-8,opacity:0.03,transition:'opacity 0.3s',pointerEvents:'none'}}>
                            <Activity size={100}/>
                          </div>

                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:6}}>
                            <h4 style={{fontSize:10,fontWeight:800,color:'#334155',textTransform:'uppercase',letterSpacing:'0.04em',lineHeight:1.35,margin:0,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}} title={dn(r.name)}>
                              {dn(r.name)}
                            </h4>
                            <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',padding:'4px 8px',borderRadius:10,textAlign:'center',minWidth:44,flexShrink:0,transition:'all 0.2s'}}>
                              <p style={{fontSize:8,color:'#94a3b8',fontWeight:700,margin:0}}>TOTAL</p>
                              <p style={{fontSize:14,fontWeight:900,color:'#1e293b',margin:0,lineHeight:1.2}}>{fmt(total)}</p>
                            </div>
                          </div>

                          {/* Level badge */}
                          {rsLevel !== 'Campuran/Tidak Spesifik' && rsLevel !== 'Belum Ada Mapping' && (
                            <div style={{marginTop:4}}>
                              <span style={{fontSize:8,fontWeight:800,padding:'2px 6px',borderRadius:999,background:LC[rsLevel]?.badge.includes('emerald')?'#dcfce7':LC[rsLevel]?.badge.includes('blue')?'#dbeafe':LC[rsLevel]?.badge.includes('amber')?'#fef3c7':'#ede9fe',color:(LC[rsLevel]||LC['Belum Ada Mapping']).dot}}>
                                {rsLevel}
                              </span>
                            </div>
                          )}

                          <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:'auto'}}>
                            {/* Sesuai bar */}
                            <div>
                              <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                                <span style={{fontSize:9,fontWeight:700,color:'#059669',display:'flex',alignItems:'center',gap:4}}>
                                  <span style={{width:5,height:5,borderRadius:'50%',background:'#10b981',display:'inline-block'}}/>Sesuai
                                </span>
                                <span style={{fontSize:9,fontWeight:800,color:'#334155'}}>{fmt(sesuai)} <span style={{color:'#94a3b8',fontWeight:500}}>({pctSesuai.toFixed(0)}%)</span></span>
                              </div>
                              <div style={{height:5,borderRadius:999,overflow:'hidden',background:'rgba(0,0,0,0.05)'}}>
                                <div style={{height:'100%',borderRadius:999,background:'linear-gradient(90deg,#34d399,#10b981)',width:`${pctSesuai}%`,transition:'width 1.2s ease'}}/>
                              </div>
                            </div>
                            {/* Loss bar */}
                            <div>
                              <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                                <span style={{fontSize:9,fontWeight:700,color:'#e11d48',display:'flex',alignItems:'center',gap:4}}>
                                  <span style={{width:5,height:5,borderRadius:'50%',background:'#f43f5e',display:'inline-block'}}/>Di Luar
                                </span>
                                <span style={{fontSize:9,fontWeight:800,color:'#334155'}}>{fmt(tidakSesuai)} <span style={{color:'#94a3b8',fontWeight:500}}>({pctLoss.toFixed(0)}%)</span></span>
                              </div>
                              <div style={{height:5,borderRadius:999,overflow:'hidden',background:'rgba(0,0,0,0.05)'}}>
                                <div style={{height:'100%',borderRadius:999,background:'linear-gradient(90deg,#fb7185,#f43f5e)',width:`${pctLoss}%`,transition:'width 1.2s ease'}}/>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Belum ada klaim */}
                  {filteredGroups.filter(r=>!r.hasData).length>0 && (
                    <div style={{marginTop:16,paddingTop:14,borderTop:'1px solid #f1f5f9'}}>
                      <p style={{fontSize:9,color:'#94a3b8',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>Belum Ada Klaim</p>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                        {filteredGroups.filter(r=>!r.hasData).map(r=>(
                          <span key={r.name} style={{fontSize:10,background:'#f8fafc',color:'#94a3b8',padding:'3px 10px',borderRadius:8,border:'1px solid #e2e8f0'}}>{dn(r.name)}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Top 10 Tables */}
              <div style={{marginTop:4}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                  <div>
                    <h3 style={{fontWeight:900,fontSize:15,color:'#0f172a',margin:0}}>Top 10 Diagnosa & Tindakan</h3>
                    <p style={{fontSize:11,color:'#64748b',margin:'4px 0 0 0'}}>Kode ICD dengan frekuensi dan nilai tarif tertinggi</p>
                  </div>
                  <button onClick={handleExportTop10}
                    style={{display:'flex',alignItems:'center',gap:6,padding:'9px 18px',background:'linear-gradient(135deg,#0d9488,#059669)',color:'white',border:'none',borderRadius:12,fontSize:11,fontWeight:800,cursor:'pointer',boxShadow:'0 4px 12px rgba(13,148,136,0.3)',transition:'all 0.2s',letterSpacing:'0.04em',textTransform:'uppercase'}}
                    onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 6px 20px rgba(13,148,136,0.45)';e.currentTarget.style.transform='translateY(-1px)';}}
                    onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 4px 12px rgba(13,148,136,0.3)';e.currentTarget.style.transform='translateY(0)';}}>
                    <Download size={14}/> Download Excel
                  </button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
                  <Top10Table title="Top 10 Diagnosa Sesuai Kompetensi RS" data={data.top10?.diagSesuai}/>
                  <Top10Table title="Top 10 Tindakan Sesuai Kompetensi RS" data={data.top10?.procSesuai}/>
                  <Top10Table title="Top 10 Diagnosa Tidak Sesuai Kompetensi RS" data={data.top10?.diagTidakSesuai}/>
                  <Top10Table title="Top 10 Tindakan Tidak Sesuai Kompetensi RS" data={data.top10?.procTidakSesuai}/>
                </div>
              </div>
            </div>
          )}

          {/* ── Table 1 Tab ── */}
          {tab==='table1' && (
            <div style={{background:'white',borderRadius:20,border:'1.5px solid #e2e8f0',overflow:'hidden',boxShadow:'0 4px 16px rgba(0,0,0,0.05)'}} className="komp-fade-up">
              <div style={{padding:'20px 24px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:40,height:40,borderRadius:12,background:'linear-gradient(135deg,#ede9fe,#ddd6fe)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <TableIcon size={18} color="#7c3aed"/>
                </div>
                <div>
                  <h2 style={{fontWeight:900,fontSize:15,color:'#0f172a',margin:0}}>Distribusi Tingkat Tuntutan Layanan (ICD)</h2>
                  <p style={{fontSize:11,color:'#64748b',margin:'3px 0 0 0'}}>Kasus dikategorikan berdasarkan level ICD tertinggi dalam DIAGLIST</p>
                </div>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',fontSize:11,borderCollapse:'collapse',minWidth:820}}>
                  <thead>
                    <tr style={{background:'#f8fafc'}}>
                      <th rowSpan={2} style={{padding:'12px 18px',textAlign:'left',fontWeight:800,color:'#475569',fontSize:10,textTransform:'uppercase',letterSpacing:'0.06em',borderBottom:'2px solid #e2e8f0',borderRight:'1px solid #e2e8f0',whiteSpace:'nowrap'}}>Tingkat Tuntutan</th>
                      <th colSpan={3} style={{padding:'10px',textAlign:'center',fontWeight:800,color:'#166534',fontSize:10,textTransform:'uppercase',background:'#f0fdf4',borderBottom:'1px solid #dcfce7',borderRight:'1px solid #dcfce7'}}>✓ Sesuai Kompetensi</th>
                      <th colSpan={3} style={{padding:'10px',textAlign:'center',fontWeight:800,color:'#991b1b',fontSize:10,textTransform:'uppercase',background:'#fff1f2',borderBottom:'1px solid #fecdd3',borderRight:'1px solid #fecdd3'}}>✗ Potensi Loss</th>
                      <th rowSpan={2} style={{padding:'12px 14px',textAlign:'center',fontWeight:800,color:'#475569',fontSize:10,textTransform:'uppercase',borderBottom:'2px solid #e2e8f0',whiteSpace:'nowrap'}}>% Loss</th>
                    </tr>
                    <tr style={{background:'#f8fafc',fontSize:10}}>
                      {['Kasus','INA-CBG','iDRG'].map(h=><th key={`s${h}`} style={{padding:'8px 12px',textAlign:'center',fontWeight:800,color:'#16a34a',background:'rgba(240,253,244,0.5)',borderBottom:'1px solid #e2e8f0'}}>{h}</th>)}
                      {['Kasus','INA-CBG','iDRG'].map(h=><th key={`l${h}`} style={{padding:'8px 12px',textAlign:'center',fontWeight:800,color:'#dc2626',background:'rgba(255,241,242,0.5)',borderBottom:'1px solid #e2e8f0',borderRight:h==='iDRG'?'1px solid #e2e8f0':''}}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {LEVEL_ORDER.map((lv,i)=>{
                      const s=data.levelStats[lv]||{};
                      const tot=(s.sesuaiKasus||0)+(s.lossKasus||0);
                      const pct=tot>0?((s.lossKasus||0)/tot*100).toFixed(1):'0.0';
                      const c=LC[lv]||LC['Belum Ada Mapping'];
                      return (
                        <tr key={lv} style={{borderBottom:'1px solid #f1f5f9',background:i%2===0?'white':'#fafafa',transition:'background 0.15s'}}
                          onMouseEnter={e=>e.currentTarget.style.background='#f0fdfa'}
                          onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'white':'#fafafa'}>
                          <td style={{padding:'13px 18px',fontWeight:700,borderRight:'1px solid #f1f5f9'}}>
                            <span style={{display:'inline-flex',alignItems:'center',gap:8,padding:'4px 12px',borderRadius:999,fontSize:11,fontWeight:800}} className={c.badge}>
                              <span style={{width:8,height:8,borderRadius:'50%',background:c.dot,display:'inline-block',boxShadow:`0 0 6px ${c.dot}88`}}/>
                              {lv}
                            </span>
                          </td>
                          <td onClick={()=>setDrill({title:`Distribusi Level ${lv} (Sesuai)`, filterFn:r=>r._meta?.highestLevelName===lv&&!r._meta?.isOutsideOverall})}
                            style={{padding:'13px 12px',textAlign:'right',fontWeight:900,color:'#059669',cursor:'pointer',background:'rgba(240,253,244,0.3)',transition:'background 0.15s'}}
                            onMouseEnter={e=>e.currentTarget.style.background='rgba(188,240,204,0.4)'}
                            onMouseLeave={e=>e.currentTarget.style.background='rgba(240,253,244,0.3)'}>{fmt(s.sesuaiKasus)}</td>
                          <td style={{padding:'13px 12px',textAlign:'right',color:'#16a34a',background:'rgba(240,253,244,0.2)'}}>{fmtRp(s.sesuaiIna)}</td>
                          <td style={{padding:'13px 12px',textAlign:'right',color:'#16a34a',background:'rgba(240,253,244,0.2)',borderRight:'1px solid #dcfce7'}}>{fmtRp(s.sesuaiIdrg)}</td>
                          <td onClick={()=>setDrill({title:`Distribusi Level ${lv} (Potensi Loss)`, filterFn:r=>r._meta?.highestLevelName===lv&&r._meta?.isOutsideOverall})}
                            style={{padding:'13px 12px',textAlign:'right',fontWeight:900,color:'#dc2626',cursor:'pointer',background:'rgba(255,241,242,0.3)',transition:'background 0.15s'}}
                            onMouseEnter={e=>e.currentTarget.style.background='rgba(254,205,205,0.4)'}
                            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,241,242,0.3)'}>{fmt(s.lossKasus)}</td>
                          <td style={{padding:'13px 12px',textAlign:'right',color:'#dc2626',background:'rgba(255,241,242,0.2)'}}>{fmtRp(s.lossIna)}</td>
                          <td style={{padding:'13px 12px',textAlign:'right',color:'#dc2626',background:'rgba(255,241,242,0.2)',borderRight:'1px solid #fecdd3'}}>{fmtRp(s.lossIdrg)}</td>
                          <td style={{padding:'13px 14px',textAlign:'center'}}>
                            <span style={{padding:'4px 12px',borderRadius:999,fontWeight:800,fontSize:11,background:parseFloat(pct)>30?'#fee2e2':parseFloat(pct)>10?'#fef3c7':'#f1f5f9',color:parseFloat(pct)>30?'#991b1b':parseFloat(pct)>10?'#92400e':'#475569'}}>
                              {pct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{background:'linear-gradient(135deg,#0f172a,#1e293b)',color:'white',fontSize:11,fontWeight:900}}>
                      <td style={{padding:'14px 18px',borderRight:'1px solid rgba(255,255,255,0.1)'}}>TOTAL</td>
                      <td style={{padding:'14px 12px',textAlign:'right'}}>{fmt(t1.sk)}</td>
                      <td style={{padding:'14px 12px',textAlign:'right'}}>{fmtRp(t1.si)}</td>
                      <td style={{padding:'14px 12px',textAlign:'right',borderRight:'1px solid rgba(255,255,255,0.1)'}}>{fmtRp(t1.sd)}</td>
                      <td style={{padding:'14px 12px',textAlign:'right',color:'#fca5a5'}}>{fmt(t1.lk)}</td>
                      <td style={{padding:'14px 12px',textAlign:'right',color:'#fca5a5'}}>{fmtRp(t1.li)}</td>
                      <td style={{padding:'14px 12px',textAlign:'right',color:'#fca5a5',borderRight:'1px solid rgba(255,255,255,0.1)'}}>{fmtRp(t1.ld)}</td>
                      <td style={{padding:'14px 14px',textAlign:'center',color:'#fcd34d'}}>
                        {(t1.sk+t1.lk)>0?((t1.lk/(t1.sk+t1.lk))*100).toFixed(1):0}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <DetailKelompokTable data={data.groupDetails} onDrillDown={setDrill}/>
            </div>
          )}

          {/* ── Table 2 Tab ── */}
          {tab==='table2' && (
            <div style={{background:'white',borderRadius:20,border:'1.5px solid #e2e8f0',overflow:'hidden',boxShadow:'0 4px 16px rgba(0,0,0,0.05)'}} className="komp-fade-up">
              <div style={{padding:'20px 24px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:40,height:40,borderRadius:12,background:'linear-gradient(135deg,#e0f2fe,#bae6fd)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <Grid3X3 size={18} color="#0284c7"/>
                  </div>
                  <div>
                    <h2 style={{fontWeight:900,fontSize:15,color:'#0f172a',margin:0}}>Per Kelompok Layanan RS</h2>
                    <p style={{fontSize:11,color:'#64748b',margin:'3px 0 0 0'}}>Klik baris untuk melihat detail pasien & ICD · RI=Rawat Inap, RJ=Rawat Jalan</p>
                  </div>
                </div>
                <div style={{position:'relative'}}>
                  <Search size={12} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#94a3b8'}}/>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari kelompok..."
                    style={{paddingLeft:30,paddingRight:12,paddingTop:8,paddingBottom:8,fontSize:11,border:'1.5px solid #e2e8f0',borderRadius:10,outline:'none',width:200,color:'#334155',transition:'all 0.2s'}}
                    onFocus={e=>{e.target.style.borderColor='#0d9488';}}
                    onBlur={e=>{e.target.style.borderColor='#e2e8f0';}}/>
                </div>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',fontSize:11,borderCollapse:'collapse',minWidth:900}}>
                  <thead>
                    <tr style={{background:'#f8fafc',color:'#64748b',fontSize:9,textTransform:'uppercase',letterSpacing:'0.05em'}}>
                      <th style={{padding:'11px 12px',textAlign:'left',fontWeight:800,width:28,borderRight:'1px solid #e2e8f0'}}>No</th>
                      <th style={{padding:'11px 16px',textAlign:'left',fontWeight:800,borderRight:'1px solid #e2e8f0'}}>Kelompok Layanan</th>
                      <th colSpan={2} style={{padding:'11px 12px',textAlign:'center',fontWeight:800,borderRight:'1px solid #e2e8f0'}}>Jumlah Kasus</th>
                      <th colSpan={2} style={{padding:'11px 12px',textAlign:'center',fontWeight:800,borderRight:'1px solid #e2e8f0',background:'#eff6ff',color:'#1d4ed8'}}>Tarif INA-CBG</th>
                      <th colSpan={2} style={{padding:'11px 12px',textAlign:'center',fontWeight:800,borderRight:'1px solid #e2e8f0',background:'#f5f3ff',color:'#6d28d9'}}>Tarif iDRG</th>
                      <th colSpan={2} style={{padding:'11px 12px',textAlign:'center',fontWeight:800,borderRight:'1px solid #e2e8f0'}}>Selisih</th>
                      <th style={{padding:'11px 12px',textAlign:'center',fontWeight:800,borderRight:'1px solid #e2e8f0'}}>Level Mix</th>
                      <th style={{padding:'11px 12px',textAlign:'center',fontWeight:800}}>Detail</th>
                    </tr>
                    <tr style={{background:'rgba(248,250,252,0.8)',color:'#94a3b8',fontSize:9,borderBottom:'1.5px solid #e2e8f0',textTransform:'uppercase'}}>
                      <th style={{borderRight:'1px solid #e2e8f0'}}/><th style={{borderRight:'1px solid #e2e8f0'}}/>
                      <th style={{padding:'7px 12px',textAlign:'center',borderRight:'1px solid #e2e8f0',fontWeight:700}}>RI</th>
                      <th style={{padding:'7px 12px',textAlign:'center',borderRight:'1px solid #e2e8f0',fontWeight:700}}>RJ</th>
                      <th style={{padding:'7px 12px',textAlign:'center',borderRight:'1px solid #e2e8f0',color:'#3b82f6',fontWeight:700,background:'rgba(239,246,255,0.5)'}}>RI</th>
                      <th style={{padding:'7px 12px',textAlign:'center',borderRight:'1px solid #e2e8f0',color:'#3b82f6',fontWeight:700,background:'rgba(239,246,255,0.5)'}}>RJ</th>
                      <th style={{padding:'7px 12px',textAlign:'center',borderRight:'1px solid #e2e8f0',color:'#7c3aed',fontWeight:700,background:'rgba(245,243,255,0.5)'}}>RI</th>
                      <th style={{padding:'7px 12px',textAlign:'center',borderRight:'1px solid #e2e8f0',color:'#7c3aed',fontWeight:700,background:'rgba(245,243,255,0.5)'}}>RJ</th>
                      <th style={{padding:'7px 12px',textAlign:'center',borderRight:'1px solid #e2e8f0',fontWeight:700}}>Rp</th>
                      <th style={{padding:'7px 12px',textAlign:'center',borderRight:'1px solid #e2e8f0',fontWeight:700}}>%</th>
                      <th style={{borderRight:'1px solid #e2e8f0'}}/><th/>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGroups.filter(r=>r.hasData).map((r,i)=>{
                      const selPct=r.selisihPct;
                      return (
                        <tr key={r.name} onClick={()=>setDrill(r.name)}
                          style={{borderBottom:'1px solid #f1f5f9',cursor:'pointer',background:i%2===0?'white':'#fafafa',transition:'all 0.15s'}}
                          onMouseEnter={e=>{e.currentTarget.style.background='#f0fdfa';e.currentTarget.style.boxShadow='inset 3px 0 0 #14b8a6';}}
                          onMouseLeave={e=>{e.currentTarget.style.background=i%2===0?'white':'#fafafa';e.currentTarget.style.boxShadow='none';}}>
                          <td style={{padding:'11px 12px',color:'#94a3b8',textAlign:'center',borderRight:'1px solid #f1f5f9'}}>{i+1}</td>
                          <td style={{padding:'11px 16px',borderRight:'1px solid #f1f5f9'}}>
                            <div style={{fontWeight:800,color:'#1e293b',fontSize:12}}>{dn(r.name)}</div>
                            <div style={{fontSize:10,color:'#94a3b8',marginTop:2}}>
                              Kompetensi RS: <span style={{color:'#0d9488',fontWeight:800}}>{config[r.name]||'Belum Mapping'}</span>
                            </div>
                            <div style={{display:'flex',flexWrap:'wrap',gap:3,marginTop:4}}>
                              {LEVEL_ORDER.map(lv => {
                                const k = (r.ranap[lv]?.kasus||0) + (r.rajal[lv]?.kasus||0);
                                const idrg = (r.ranap[lv]?.idrg||0) + (r.rajal[lv]?.idrg||0);
                                if (k === 0) return null;
                                const pct = r.totalIdrg > 0 ? ((idrg / r.totalIdrg) * 100).toFixed(0) : 0;
                                const rsLevel = config[r.name] || 'Tidak Melayani';
                                const isOutside = LEVEL_ORDER.indexOf(lv) > LEVEL_ORDER.indexOf(rsLevel);
                                return (
                                  <span key={lv} onClick={(e) => { e.stopPropagation(); setDrill({ group: r.name, level: lv }); }}
                                    style={{fontSize:9,padding:'2px 6px',borderRadius:999,border:`1px solid ${isOutside?'#fecdd3':'#e2e8f0'}`,background:isOutside?'#fff1f2':'#f8fafc',color:isOutside?'#be123c':'#64748b',cursor:'pointer',fontWeight:700,transition:'all 0.15s'}}
                                    onMouseEnter={e=>{e.currentTarget.style.background=isOutside?'#fecdd3':'#e2e8f0';}}
                                    onMouseLeave={e=>{e.currentTarget.style.background=isOutside?'#fff1f2':'#f8fafc';}}>
                                    <span style={{fontWeight:900}}>{lv}</span>: {k} <span style={{opacity:0.7}}>({pct}%)</span>
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td style={{padding:'11px 12px',textAlign:'right',fontWeight:700,color:'#334155',borderLeft:'1px solid #f1f5f9'}}>{fmt(r.totalKasusRI)}</td>
                          <td style={{padding:'11px 12px',textAlign:'right',color:'#64748b',borderRight:'1px solid #f1f5f9'}}>{fmt(r.totalKasusRJ)}</td>
                          <td style={{padding:'11px 12px',textAlign:'right',color:'#2563eb',fontWeight:600,borderLeft:'1px solid #f1f5f9',background:'rgba(239,246,255,0.3)'}}>{fmtRp(r.totalInaRI)}</td>
                          <td style={{padding:'11px 12px',textAlign:'right',color:'#3b82f6',background:'rgba(239,246,255,0.3)',borderRight:'1px solid #dbeafe'}}>{fmtRp(r.totalInaRJ)}</td>
                          <td style={{padding:'11px 12px',textAlign:'right',color:'#6d28d9',fontWeight:600,borderLeft:'1px solid #f1f5f9',background:'rgba(245,243,255,0.3)'}}>{fmtRp(r.totalIdrgRI)}</td>
                          <td style={{padding:'11px 12px',textAlign:'right',color:'#7c3aed',background:'rgba(245,243,255,0.3)',borderRight:'1px solid #ede9fe'}}>{fmtRp(r.totalIdrgRJ)}</td>
                          <td style={{padding:'11px 12px',textAlign:'right',fontWeight:900,color:r.selisih>=0?'#059669':'#dc2626',borderLeft:'1px solid #f1f5f9'}}>
                            {r.selisih>=0?'+':''}{fmtRp(r.selisih)}
                          </td>
                          <td style={{padding:'11px 12px',textAlign:'center',borderRight:'1px solid #f1f5f9'}}>
                            <span style={{padding:'3px 10px',borderRadius:999,fontSize:10,fontWeight:800,background:selPct>=0?'#dcfce7':'#fee2e2',color:selPct>=0?'#166534':'#991b1b'}}>
                              {selPct>=0?'+':''}{selPct.toFixed(1)}%
                            </span>
                          </td>
                          <td style={{padding:'11px 12px',borderRight:'1px solid #f1f5f9',minWidth:100}}>
                            <MiniLevelBar ranap={r.ranap} rajal={r.rajal}/>
                          </td>
                          <td style={{padding:'11px 12px',textAlign:'center'}}>
                            <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:10,color:'#0d9488',fontWeight:800,background:'#f0fdfa',padding:'5px 12px',borderRadius:999,border:'1px solid #99f6e4',transition:'all 0.2s'}}>
                              <Users size={11}/>Detail
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredGroups.filter(r=>!r.hasData).map((r,i)=>(
                      <tr key={r.name} style={{borderBottom:'1px solid #f8fafc',opacity:0.35}}>
                        <td style={{padding:'9px 12px',color:'#94a3b8',textAlign:'center'}}>–</td>
                        <td style={{padding:'9px 16px',color:'#94a3b8',fontStyle:'italic'}}>{dn(r.name)}</td>
                        <td colSpan={10} style={{padding:'9px 12px',color:'#cbd5e1',textAlign:'center',fontSize:10}}>Belum ada klaim terdaftar</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{background:'linear-gradient(135deg,#f8fafc,#f1f5f9)',color:'#334155',fontWeight:900,fontSize:11,borderTop:'2px solid #e2e8f0'}}>
                      <td colSpan={2} style={{padding:'14px 16px',textAlign:'right',borderRight:'1px solid #e2e8f0',textTransform:'uppercase',letterSpacing:'0.06em',color:'#475569'}}>GRAND TOTAL</td>
                      <td colSpan={2} style={{padding:'14px 12px',textAlign:'center',borderRight:'1px solid #e2e8f0'}}>{fmt(gt.totalKasus)}</td>
                      <td colSpan={2} style={{padding:'14px 12px',textAlign:'right',color:'#1d4ed8',borderRight:'1px solid #e2e8f0',background:'rgba(239,246,255,0.5)'}}>{fmtRp(gt.totalIna)}</td>
                      <td colSpan={2} style={{padding:'14px 12px',textAlign:'right',color:'#6d28d9',borderRight:'1px solid #e2e8f0',background:'rgba(245,243,255,0.5)'}}>{fmtRp(gt.totalIdrg)}</td>
                      <td style={{padding:'14px 12px',textAlign:'right',color:gt.selisih>=0?'#059669':'#dc2626',borderRight:'1px solid #e2e8f0'}}>{fmtRp(gt.selisih)}</td>
                      <td style={{padding:'14px 12px',textAlign:'center',color:'#d97706',borderRight:'1px solid #e2e8f0'}}>{gt.totalIna>0?fmtPct(gt.selisih/gt.totalIna*100):'0%'}</td>
                      <td colSpan={2}/>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ── Laporan Tab ── */}
          {tab==='laporan' && (
            <div style={{background:'white',borderRadius:20,border:'1.5px solid #e2e8f0',overflow:'hidden',boxShadow:'0 4px 16px rgba(0,0,0,0.05)'}} className="komp-fade-up">
              <KompetensiLaporan reports={data.reports} onDrillDown={setDrill}/>
            </div>
          )}

        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && pendingExport && (
        <PasswordModal isOpen={true}
          onClose={() => { setShowPasswordModal(false); setPendingExport(null); }}
          onSuccess={(password) => {
            exportToExcel(pendingExport.name, pendingExport.sheets, password);
            setShowPasswordModal(false); setPendingExport(null);
          }}
        />
      )}

      {/* Drill-Down Modal */}
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
    </div>,
    document.body
  );
}
