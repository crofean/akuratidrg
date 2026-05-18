#!/usr/bin/env python3
"""Generates src/App.jsx - Part A (imports through compKeys/TABS/helpers)"""
A = """import React, { useState, useRef, useMemo, useEffect } from 'react';
import { UploadCloud, Folder, FileText, CheckCircle, Trash2, AlertCircle, X, BarChart3, PieChart, Activity, Layers, Search, Table2, GitMerge, FileCode, CheckSquare, AlertTriangle, Stethoscope, User, ActivitySquare, Download, TrendingUp, TrendingDown, ChevronRight, Zap, Award } from 'lucide-react';

const DEFAULT_AUDIT_RULES = [];

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
  let n = String(name).toUpperCase().replace(/[,.]/g, ' ').replace(/\\s+/g, ' ').trim();
  if (n.startsWith('DRG ')) n = n.substring(4).trim(); else if (n.startsWith('DR ')) n = n.substring(3).trim();
  return n || 'UNKNOWN';
};

const getCLName = (cl) => ({0: 'No CC', 1: 'Mild CC', 2: 'Moderate CC', 3: 'Severe CC', 4: 'Catastrophic CC', 9: 'Merge CC'}[cl] || 'Unknown');

// FIX: Use Blob URL for reliable CSV download across all browsers
const exportToCSV = (filename, headers, rows) => {
  const escapeCsv = (val) => `"${String(val !== undefined && val !== null ? val : '').replace(/"/g, '""')}"`;
  const csvData = [headers.map(escapeCsv).join(";")];
  rows.forEach(row => csvData.push(row.map(escapeCsv).join(";")));
  const blob = new Blob(["\\uFEFF" + csvData.join("\\n")], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link); link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden ${className}`}>{children}</div>
);

// FIX: SectionHeader button uses extracted text color converted to bg color
const SectionHeader = ({ icon: Icon, title, desc, exportAction, exportText, colorClass, highlightClass }) => {
  const btnBg = (colorClass || '').split(' ').find(c => c.startsWith('text-'))?.replace('text-', 'bg-') || 'bg-sky-600';
  const btnHover = btnBg.replace('bg-', 'hover:bg-').replace(/-(\\d+)$/, (_, n) => `-${Math.min(900, parseInt(n)+100)}`);
  return (
    <Card className="flex flex-col md:flex-row items-center justify-between gap-6 relative p-6">
      <div className={`absolute -left-20 -top-20 w-64 h-64 rounded-full blur-3xl pointer-events-none ${highlightClass}`}></div>
      <div className="relative z-10 flex-1">
        <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${colorClass}`}><Icon size={24} /></div> {title}
        </h3>
        <p className="text-sm font-medium text-slate-500 mt-2 max-w-3xl" dangerouslySetInnerHTML={{__html: desc}}></p>
      </div>
      {exportAction && (
        <button onClick={exportAction} className={`text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:-translate-y-0.5 transition-all shrink-0 ${btnBg} ${btnHover}`}>
          <Download size={16}/> {exportText || 'Ekspor CSV'}
        </button>
      )}
    </Card>
  );
};

const MiniTable = ({ data = [], columns = [], onRowClick, maxHeight = "400px" }) => (
  <div className="overflow-x-auto flex-1 p-2 custom-scrollbar" style={{maxHeight}}>
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
"""
with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(A)
print("Part A written:", len(A), "chars")
