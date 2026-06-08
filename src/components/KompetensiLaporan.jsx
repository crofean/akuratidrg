import React, { useState } from 'react';
import { exportToExcel } from '../utils/exportUtils.js';
import PasswordModal from './PasswordModal';
import { FileText, Download, Table as TableIcon, AlertCircle, TrendingUp, Activity, Layers, ActivitySquare, Ban, HelpCircle } from 'lucide-react';

export default function KompetensiLaporan({ reports, onDrillDown }) {
  const [activeTab, setActiveTab] = useState('inaCbg');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const formatRupiah = (val) => {
    if (!val) return '0';
    return Math.round(val).toLocaleString('id-ID');
  };

  const formatNumber = (val) => {
    if (!val) return '0';
    return Math.round(val).toLocaleString('id-ID');
  };

  
  const maskName = (s) => {
    if (!s || s === '-') return '-';
    const parts = s.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0) + '*'.repeat(Math.max(parts[0].length-1,3));
    return parts[0] + ' ' + parts.slice(1).map(p => p.charAt(0)+'*'.repeat(Math.max(p.length-1,2))).join(' ');
  };

  const formatMonthIndo = (str) => {
    if (!str) return str;
    const parts = str.split('-');
    if (parts.length !== 2) return str;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  const handleExportExcel = (password) => {
    if (!reports) return;
    const r = reports;
    
    // === 1. KLAIM INA-CBGS ===
    const inaCols = [
        { header: 'NO.', key: 'no', width: 5 },
        { header: 'BULAN', key: 'bulan', width: 20 },
        { header: 'SL 0 KASUS', key: 'sl0_c', width: 15 },
        { header: 'SL 0 TARIF', key: 'sl0_t', width: 20 },
        { header: 'SL 1 KASUS', key: 'sl1_c', width: 15 },
        { header: 'SL 1 TARIF', key: 'sl1_t', width: 20 },
        { header: 'SL 2 KASUS', key: 'sl2_c', width: 15 },
        { header: 'SL 2 TARIF', key: 'sl2_t', width: 20 },
        { header: 'SL 3 KASUS', key: 'sl3_c', width: 15 },
        { header: 'SL 3 TARIF', key: 'sl3_t', width: 20 },
        { header: 'TOTAL KASUS', key: 'tot_c', width: 15 },
        { header: 'TOTAL KLAIM', key: 'tot_t', width: 20 }
    ];
    const inaData = r.inaCbg.map((d, i) => ({
        no: i + 1, bulan: formatMonthIndo(d.monthKey),
        sl0_c: d.sl0_c, sl0_t: d.sl0_t,
        sl1_c: d.sl1_c, sl1_t: d.sl1_t,
        sl2_c: d.sl2_c, sl2_t: d.sl2_t,
        sl3_c: d.sl3_c, sl3_t: d.sl3_t,
        tot_c: d.total_c, tot_t: d.total_t
    }));

    // === 2. KLAIM iDRG ===
    const idrgCols = [
        { header: 'NO.', key: 'no', width: 5 },
        { header: 'BULAN', key: 'bulan', width: 20 },
        { header: 'DASAR KASUS', key: 'd_c', width: 13 },
        { header: 'MADYA KASUS', key: 'm_c', width: 13 },
        { header: 'UTAMA KASUS', key: 'u_c', width: 13 },
        { header: 'PARIPURNA KASUS', key: 'p_c', width: 15 },
        { header: 'DASAR KLAIM', key: 'd_t', width: 20 },
        { header: 'MADYA KLAIM', key: 'm_t', width: 20 },
        { header: 'UTAMA KLAIM', key: 'u_t', width: 20 },
        { header: 'PARIPURNA KLAIM', key: 'p_t', width: 20 },
        { header: 'BELUM MAPPING KASUS', key: 'unmapped_c', width: 20 },
        { header: 'BELUM MAPPING KLAIM', key: 'unmapped_t', width: 20 },
        { header: 'TOP-UP KASUS', key: 'topup_c', width: 15 },
        { header: 'TOP-UP KLAIM', key: 'topup_t', width: 20 },
        { header: 'TOTAL KASUS', key: 'total_c', width: 15 }
    ];
    const idrgData = r.idrg.map((d, i) => ({
        no: i + 1, bulan: formatMonthIndo(d.monthKey),
        d_c: d.d_c, m_c: d.m_c, u_c: d.u_c, p_c: d.p_c,
        d_t: d.d_t, m_t: d.m_t, u_t: d.u_t, p_t: d.p_t,
        unmapped_c: d.unmapped_c, unmapped_t: d.unmapped_t,
        topup_c: d.topup_c, topup_t: d.topup_t,
        total_c: d.total_c
    }));

    // === 3 & 4. iDRG RAWAT INAP / RAWAT JALAN ===
    const drgCols = [
        { header: 'NO.', key: 'no', width: 5 },
        { header: 'KODE DRG', key: 'drg', width: 15 },
        { header: 'DESKRIPSI DRG', key: 'desc', width: 40 },
        { header: 'JUMLAH KASUS', key: 'cases', width: 15 },
        { header: 'TOTAL TARIF RS', key: 'tRs', width: 20 },
        { header: 'TOTAL TARIF INA-CBGS', key: 'tIna', width: 20 },
        { header: 'TOTAL TARIF IDRG', key: 'tIdrg', width: 20 },
        { header: 'SELISIH (RS - INACBGS)', key: 's1', width: 25 },
        { header: 'SELISIH (RS - IDRG)', key: 's2', width: 25 },
        { header: 'SELISIH (IDRG - INACBGS)', key: 's3', width: 25 }
    ];
    const mapDrg = (d, i) => ({
        no: i + 1, drg: d.drgCode, desc: d.drgDesc, cases: d.cases,
        tRs: d.tRs, tIna: d.tIna, tIdrg: d.tIdrg,
        s1: d.tRs - d.tIna, s2: d.tRs - d.tIdrg, s3: d.tIdrg - d.tIna
    });

    // === 5. DATA GABUNGAN ===
    const gabCols = [
        { header: 'NO.', key: 'no', width: 5 },
        { header: 'BULAN', key: 'bulan', width: 20 },
        { header: 'TARIF RS RAJAL', key: 'rj_tRs', width: 20 },
        { header: 'TARIF RS RANAP', key: 'ri_tRs', width: 20 },
        { header: 'INA-CBG RAJAL KASUS', key: 'inacbg_rj_c', width: 18 },
        { header: 'INA-CBG RANAP KASUS', key: 'inacbg_ri_c', width: 18 },
        { header: 'INA-CBG RAJAL KLAIM', key: 'inacbg_rj_t', width: 20 },
        { header: 'INA-CBG RANAP KLAIM', key: 'inacbg_ri_t', width: 20 },
        { header: 'iDRG RAJAL KASUS', key: 'idrg_rj_c', width: 18 },
        { header: 'iDRG RANAP KASUS', key: 'idrg_ri_c', width: 18 },
        { header: 'iDRG RAJAL KLAIM', key: 'idrg_rj_t', width: 20 },
        { header: 'iDRG RANAP KLAIM', key: 'idrg_ri_t', width: 20 },
        { header: 'UNGROUPABLE KASUS', key: 'ungroup_c', width: 18 }
    ];
    const gabData = (r.gabungan || []).map((d, i) => ({
        no: i + 1, bulan: formatMonthIndo(d.monthKey),
        rj_tRs: d.rj_tRs, ri_tRs: d.ri_tRs,
        inacbg_rj_c: d.inacbg_rj_c, inacbg_ri_c: d.inacbg_ri_c,
        inacbg_rj_t: d.inacbg_rj_t, inacbg_ri_t: d.inacbg_ri_t,
        idrg_rj_c: d.idrg_rj_c, idrg_ri_c: d.idrg_ri_c,
        idrg_rj_t: d.idrg_rj_t, idrg_ri_t: d.idrg_ri_t,
        ungroup_c: d.ungroup_c
    }));

    // === 6 & 7. UNGROUPABLE & BELUM MAPPING ===
    const simpleCols = [
        { header: 'NO.', key: 'no', width: 5 },
        { header: 'MRN', key: 'mrn', width: 15 },
        { header: 'SEP', key: 'sep', width: 20 },
        { header: 'NAMA PASIEN', key: 'nama', width: 25 },
        { header: 'DESKRIPSI', key: 'desc', width: 40 },
        { header: 'KODE ICD', key: 'icd', width: 15 },
        { header: 'JENIS LAYANAN', key: 'type', width: 15 },
        { header: 'KETERANGAN', key: 'ket', width: 60 }
    ];
    const mapSimple = (d, i) => ({
        no: i + 1, mrn: d.mrn, sep: d.sep, nama: maskName(d.nama),
        desc: d.desc, icd: d.icd, type: d.type, ket: d.ket
    });

    const sheets = [
        { name: 'KLAIM INA-CBGS', columns: inaCols, data: inaData },
        { name: 'KLAIM iDRG', columns: idrgCols, data: idrgData },
        { name: 'iDRG RAWAT INAP', columns: drgCols, data: (r.idrg_ri || []).map(mapDrg) },
        { name: 'iDRG RAWAT JALAN', columns: drgCols, data: (r.idrg_rj || []).map(mapDrg) },
        { name: 'DATA GABUNGAN', columns: gabCols, data: gabData },
        { name: 'KASUS UNGROUPABLE', columns: simpleCols, data: (r.ungroupable || []).map(mapSimple) },
        { name: 'BELUM ADA MAPPING', columns: simpleCols, data: (r.unmapped || []).map(mapSimple) }
    ];
    
    exportToExcel('Laporan_Standar_V5', sheets, password);
  };

  if (!reports) {
    return <div className="text-center p-8">Data laporan belum tersedia.</div>;
  }

  const r = reports;

  const renderInaCbg = () => (
    <div className="elite-table-container">
      <table className="elite-table">
        <thead>
          <tr>
            <th rowSpan="2">NO</th>
            <th rowSpan="2">BULAN LAYANAN</th>
            <th colSpan="4" className="text-center" style={{ backgroundColor: 'rgba(0, 177, 234, 0.05)', color: 'var(--primary)' }}>JUMLAH KASUS INA-CBGs</th>
            <th colSpan="4" className="text-center" style={{ backgroundColor: 'rgba(166, 177, 196, 0.1)', color: 'var(--text-main)' }}>JUMLAH KLAIM INA-CBGs (Rp)</th>
            <th rowSpan="2" className="text-center bg-success-light">TOTAL KASUS</th>
            <th rowSpan="2" className="text-center bg-success-light">TOTAL KLAIM (Rp)</th>
          </tr>
          <tr>
            <th className="text-center">SEVERITY LEVEL 0</th><th className="text-center">SEVERITY LEVEL 1</th><th className="text-center">SEVERITY LEVEL 2</th><th className="text-center">SEVERITY LEVEL 3</th>
            <th className="text-right">SEVERITY LEVEL 0</th><th className="text-right">SEVERITY LEVEL 1</th><th className="text-right">SEVERITY LEVEL 2</th><th className="text-right">SEVERITY LEVEL 3</th>
          </tr>
        </thead>
        <tbody>
          {r.inaCbg.map((d, i) => (
            <tr key={i}>
              <td className="text-center">{i + 1}</td>
              <td className="font-black">{formatMonthIndo(d.monthKey)}</td>
              <td className="text-center cursor-pointer hover:bg-teal-50" onClick={()=>onDrillDown&&onDrillDown({title:`Klaim INA-CBG: ${d.monthKey} (SL 0)`, filterFn:r=>!r._meta?.isOutsideOverall&&r._meta?.monthKey===d.monthKey&&r._meta?.severity===0})}>{formatNumber(d.sl0_c)}</td>
              <td className="text-center cursor-pointer hover:bg-teal-50" onClick={()=>onDrillDown&&onDrillDown({title:`Klaim INA-CBG: ${d.monthKey} (SL 1)`, filterFn:r=>!r._meta?.isOutsideOverall&&r._meta?.monthKey===d.monthKey&&r._meta?.severity===1})}>{formatNumber(d.sl1_c)}</td>
              <td className="text-center cursor-pointer hover:bg-teal-50" onClick={()=>onDrillDown&&onDrillDown({title:`Klaim INA-CBG: ${d.monthKey} (SL 2)`, filterFn:r=>!r._meta?.isOutsideOverall&&r._meta?.monthKey===d.monthKey&&r._meta?.severity===2})}>{formatNumber(d.sl2_c)}</td>
              <td className="text-center cursor-pointer hover:bg-teal-50" onClick={()=>onDrillDown&&onDrillDown({title:`Klaim INA-CBG: ${d.monthKey} (SL 3)`, filterFn:r=>!r._meta?.isOutsideOverall&&r._meta?.monthKey===d.monthKey&&r._meta?.severity===3})}>{formatNumber(d.sl3_c)}</td>
              <td className="text-right">{formatRupiah(d.sl0_t)}</td>
              <td className="text-right">{formatRupiah(d.sl1_t)}</td>
              <td className="text-right">{formatRupiah(d.sl2_t)}</td>
              <td className="text-right">{formatRupiah(d.sl3_t)}</td>
              <td className="text-center font-black">{formatNumber(d.total_c)}</td>
              <td className="text-right font-black" style={{ color: 'var(--primary)' }}>{formatRupiah(d.total_t)}</td>
            </tr>
          ))}
          {r.inaCbg.length === 0 && <tr><td colSpan="12" className="text-center text-muted">Tidak ada data</td></tr>}
        </tbody>
        {r.inaCbg.length > 0 && (
          <tfoot>
            <tr style={{ backgroundColor: 'var(--surface-alt)' }}>
              <td colSpan="2" className="text-center font-black" style={{ padding: '1rem' }}>TOTAL</td>
              <td className="text-center font-black">{formatNumber(r.inaCbg.reduce((s, d) => s + d.sl0_c, 0))}</td>
              <td className="text-center font-black">{formatNumber(r.inaCbg.reduce((s, d) => s + d.sl1_c, 0))}</td>
              <td className="text-center font-black">{formatNumber(r.inaCbg.reduce((s, d) => s + d.sl2_c, 0))}</td>
              <td className="text-center font-black">{formatNumber(r.inaCbg.reduce((s, d) => s + d.sl3_c, 0))}</td>
              <td className="text-right font-black">{formatRupiah(r.inaCbg.reduce((s, d) => s + d.sl0_t, 0))}</td>
              <td className="text-right font-black">{formatRupiah(r.inaCbg.reduce((s, d) => s + d.sl1_t, 0))}</td>
              <td className="text-right font-black">{formatRupiah(r.inaCbg.reduce((s, d) => s + d.sl2_t, 0))}</td>
              <td className="text-right font-black">{formatRupiah(r.inaCbg.reduce((s, d) => s + d.sl3_t, 0))}</td>
              <td className="text-center font-black">{formatNumber(r.inaCbg.reduce((s, d) => s + d.total_c, 0))}</td>
              <td className="text-right font-black" style={{ color: 'var(--primary)' }}>{formatRupiah(r.inaCbg.reduce((s, d) => s + d.total_t, 0))}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );

  const renderIdrg = () => (
    <div className="elite-table-container">
      <table className="elite-table" style={{ minWidth: '1500px' }}>
        <thead>
          <tr>
            <th rowSpan="2">NO</th>
            <th rowSpan="2">BULAN LAYANAN</th>
            <th colSpan="4" className="text-center" style={{ backgroundColor: 'rgba(0, 177, 234, 0.05)', color: 'var(--primary)' }}>JUMLAH KASUS iDRG</th>
            <th colSpan="4" className="text-center" style={{ backgroundColor: 'rgba(166, 177, 196, 0.1)', color: 'var(--text-main)' }}>JUMLAH KLAIM iDRG (Rp)</th>
            <th rowSpan="2" className="text-center text-danger">Kasus Belum Mapping Kompetensi</th>
            <th rowSpan="2" className="text-center text-danger">Klaim Belum Mapping Kompetensi</th>
            <th colSpan="2" className="text-center bg-success-light">TOP - UP</th>
            <th rowSpan="2" className="text-center font-black">TOTAL KASUS</th>
          </tr>
          <tr>
            <th className="text-center">DASAR</th><th className="text-center">MADYA</th><th className="text-center">UTAMA</th><th className="text-center">PARIPURNA</th>
            <th className="text-right">DASAR</th><th className="text-right">MADYA</th><th className="text-right">UTAMA</th><th className="text-right">PARIPURNA</th>
            <th className="text-center">Kasus Top-Up</th><th className="text-right">Klaim Top-Up</th>
          </tr>
        </thead>
        <tbody>
          {r.idrg.map((d, i) => (
            <tr key={i}>
              <td className="text-center">{i + 1}</td>
              <td className="font-black">{formatMonthIndo(d.monthKey)}</td>
              <td className="text-center cursor-pointer hover:bg-teal-50" onClick={()=>onDrillDown&&onDrillDown({title:`Klaim iDRG: ${d.monthKey} (Dasar)`, filterFn:r=>r._meta?.isOutsideOverall&&r._meta?.monthKey===d.monthKey&&r._meta?.highestLevelName==='Dasar'})}>{formatNumber(d.d_c)}</td>
              <td className="text-center cursor-pointer hover:bg-teal-50" onClick={()=>onDrillDown&&onDrillDown({title:`Klaim iDRG: ${d.monthKey} (Madya)`, filterFn:r=>r._meta?.isOutsideOverall&&r._meta?.monthKey===d.monthKey&&r._meta?.highestLevelName==='Madya'})}>{formatNumber(d.m_c)}</td>
              <td className="text-center cursor-pointer hover:bg-teal-50" onClick={()=>onDrillDown&&onDrillDown({title:`Klaim iDRG: ${d.monthKey} (Utama)`, filterFn:r=>r._meta?.isOutsideOverall&&r._meta?.monthKey===d.monthKey&&r._meta?.highestLevelName==='Utama'})}>{formatNumber(d.u_c)}</td>
              <td className="text-center cursor-pointer hover:bg-teal-50" onClick={()=>onDrillDown&&onDrillDown({title:`Klaim iDRG: ${d.monthKey} (Paripurna)`, filterFn:r=>r._meta?.isOutsideOverall&&r._meta?.monthKey===d.monthKey&&r._meta?.highestLevelName==='Paripurna'})}>{formatNumber(d.p_c)}</td>
              <td className="text-right">{formatRupiah(d.d_t)}</td>
              <td className="text-right">{formatRupiah(d.m_t)}</td>
              <td className="text-right">{formatRupiah(d.u_t)}</td>
              <td className="text-right">{formatRupiah(d.p_t)}</td>
              <td className="text-center font-black cursor-pointer hover:bg-rose-50" style={{ color: 'var(--danger)' }} onClick={()=>onDrillDown&&onDrillDown({title:`Klaim iDRG: ${d.monthKey} (Belum Mapping)`, filterFn:r=>r._meta?.isOutsideOverall&&r._meta?.monthKey===d.monthKey&&r._meta?.isUnmapped})}>{formatNumber(d.unmapped_c)}</td>
              <td className="text-right font-black" style={{ color: 'var(--danger)' }}>{formatRupiah(d.unmapped_t)}</td>
              <td className="text-center">{formatNumber(d.topup_c)}</td>
              <td className="text-right text-success">{formatRupiah(d.topup_t)}</td>
              <td className="text-center font-black">{formatNumber(d.total_c)}</td>
            </tr>
          ))}
          {r.idrg.length === 0 && <tr><td colSpan="15" className="text-center text-muted">Tidak ada data</td></tr>}
        </tbody>
        {r.idrg.length > 0 && (
          <tfoot>
            <tr style={{ backgroundColor: 'var(--surface-alt)' }}>
              <td colSpan="2" className="text-center font-black" style={{ padding: '1rem' }}>TOTAL</td>
              <td className="text-center font-black">{formatNumber(r.idrg.reduce((s, d) => s + d.d_c, 0))}</td>
              <td className="text-center font-black">{formatNumber(r.idrg.reduce((s, d) => s + d.m_c, 0))}</td>
              <td className="text-center font-black">{formatNumber(r.idrg.reduce((s, d) => s + d.u_c, 0))}</td>
              <td className="text-center font-black">{formatNumber(r.idrg.reduce((s, d) => s + d.p_c, 0))}</td>
              <td className="text-right font-black">{formatRupiah(r.idrg.reduce((s, d) => s + d.d_t, 0))}</td>
              <td className="text-right font-black">{formatRupiah(r.idrg.reduce((s, d) => s + d.m_t, 0))}</td>
              <td className="text-right font-black">{formatRupiah(r.idrg.reduce((s, d) => s + d.u_t, 0))}</td>
              <td className="text-right font-black">{formatRupiah(r.idrg.reduce((s, d) => s + d.p_t, 0))}</td>
              <td className="text-center font-black" style={{ color: 'var(--danger)' }}>{formatNumber(r.idrg.reduce((s, d) => s + d.unmapped_c, 0))}</td>
              <td className="text-right font-black" style={{ color: 'var(--danger)' }}>{formatRupiah(r.idrg.reduce((s, d) => s + d.unmapped_t, 0))}</td>
              <td className="text-center font-black">{formatNumber(r.idrg.reduce((s, d) => s + d.topup_c, 0))}</td>
              <td className="text-right font-black text-success">{formatRupiah(r.idrg.reduce((s, d) => s + d.topup_t, 0))}</td>
              <td className="text-center font-black">{formatNumber(r.idrg.reduce((s, d) => s + d.total_c, 0))}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );

  const renderDrgTable = (data, title) => {
    let sumKasus = 0, sumRs = 0, sumIna = 0, sumIdrg = 0;
    data.forEach(d => {
      sumKasus += d.cases; sumRs += d.tRs; sumIna += d.tIna; sumIdrg += d.tIdrg;
    });

    return (
      <div className="elite-table-container">
        <div style={{ padding: '1rem', fontWeight: 900, backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>{title}</div>
        <table className="elite-table">
          <thead>
            <tr>
              <th rowSpan="2">No.</th>
              <th rowSpan="2">Kode DRG</th>
              <th rowSpan="2">Deskripsi DRG</th>
              <th colSpan="4" className="text-center">Data Agregasi iDRG vs INA-CBG</th>
              <th colSpan="3" className="text-center bg-success-light">Selisih Margin</th>
            </tr>
            <tr>
              <th className="text-center">Jumlah Kasus</th>
              <th className="text-right">Total Tarif RS</th>
              <th className="text-right">Total Tarif INA-CBGs</th>
              <th className="text-right">Total Tarif iDRG</th>
              <th className="text-right">Selisih (RS - INACBGS)</th>
              <th className="text-right">Selisih (RS - iDRG)</th>
              <th className="text-right">Selisih (iDRG - INACBGS)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i}>
                <td className="text-center">{i + 1}</td>
                <td className="font-black text-center">{d.drgCode}</td>
                <td style={{ maxWidth: '300px', whiteSpace: 'normal' }}>{d.drgDesc}</td>
                <td className="text-center">{formatNumber(d.cases)}</td>
                <td className="text-right text-muted">{formatRupiah(d.tRs)}</td>
                <td className="text-right">{formatRupiah(d.tIna)}</td>
                <td className="text-right font-black" style={{ color: 'var(--primary)' }}>{formatRupiah(d.tIdrg)}</td>
                <td className="text-right" style={{ color: (d.tRs - d.tIna) >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatRupiah(d.tRs - d.tIna)}</td>
                <td className="text-right" style={{ color: (d.tRs - d.tIdrg) >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatRupiah(d.tRs - d.tIdrg)}</td>
                <td className="text-right font-black" style={{ color: (d.tIdrg - d.tIna) >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatRupiah(d.tIdrg - d.tIna)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" className="font-black text-center" style={{ padding: '1rem' }}>TOTAL</td>
              <td className="text-center font-black">{formatNumber(sumKasus)}</td>
              <td className="text-right font-black">{formatRupiah(sumRs)}</td>
              <td className="text-right font-black">{formatRupiah(sumIna)}</td>
              <td className="text-right font-black" style={{ color: 'var(--primary)' }}>{formatRupiah(sumIdrg)}</td>
              <td className="text-right font-black">{formatRupiah(sumRs - sumIna)}</td>
              <td className="text-right font-black">{formatRupiah(sumRs - sumIdrg)}</td>
              <td className="text-right font-black">{formatRupiah(sumIdrg - sumIna)}</td>
            </tr>
          </tfoot>
        </table>
        <div style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Catatan: Data Pasien yang Ungroupable (iDRG) dieksklusi pada perhitungan tabel ini.
        </div>
      </div>
    );
  };

  const renderGabungan = () => (
    <div className="elite-table-container">
      <table className="elite-table" style={{ minWidth: '1400px' }}>
        <thead>
          <tr>
            <th rowSpan="3" className="text-center">NO</th>
            <th rowSpan="3" className="text-center">BULAN LAYANAN</th>
            <th colSpan="2" className="text-center" style={{ backgroundColor: 'rgba(166, 177, 196, 0.1)' }}>TARIF RS</th>
            <th colSpan="4" className="text-center" style={{ backgroundColor: 'rgba(0, 177, 234, 0.05)', color: 'var(--primary)' }}>KLAIM INA CBGs</th>
            <th colSpan="4" className="text-center bg-success-light">KLAIM iDRG</th>
            <th rowSpan="2" className="text-center text-danger">Data Ungroupable</th>
          </tr>
          <tr>
            <th rowSpan="2" className="text-right">RAJAL</th><th rowSpan="2" className="text-right">RANAP</th>
            <th colSpan="2" className="text-center">JUMLAH KASUS</th><th colSpan="2" className="text-center">JUMLAH KLAIM (Rp)</th>
            <th colSpan="2" className="text-center">JUMLAH KASUS</th><th colSpan="2" className="text-center">JUMLAH KLAIM (Rp)</th>
          </tr>
          <tr>
            <th className="text-center">RAJAL</th><th className="text-center">RANAP</th><th className="text-right">RAJAL</th><th className="text-right">RANAP</th>
            <th className="text-center">RAJAL</th><th className="text-center">RANAP</th><th className="text-right">RAJAL</th><th className="text-right">RANAP</th>
            <th className="text-center">Jumlah Kasus</th>
          </tr>
        </thead>
        <tbody>
          {r.gabungan.map((d, i) => (
            <tr key={i}>
              <td className="text-center">{i + 1}</td>
              <td className="font-black text-center">{formatMonthIndo(d.monthKey)}</td>
              <td className="text-right text-muted">{formatRupiah(d.rj_tRs)}</td>
              <td className="text-right text-muted">{formatRupiah(d.ri_tRs)}</td>
              
              <td className="text-center">{formatNumber(d.inacbg_rj_c)}</td>
              <td className="text-center">{formatNumber(d.inacbg_ri_c)}</td>
              <td className="text-right">{formatRupiah(d.inacbg_rj_t)}</td>
              <td className="text-right">{formatRupiah(d.inacbg_ri_t)}</td>
              
              <td className="text-center font-black">{formatNumber(d.idrg_rj_c)}</td>
              <td className="text-center font-black">{formatNumber(d.idrg_ri_c)}</td>
              <td className="text-right font-black" style={{ color: 'var(--primary)' }}>{formatRupiah(d.idrg_rj_t)}</td>
              <td className="text-right font-black" style={{ color: 'var(--primary)' }}>{formatRupiah(d.idrg_ri_t)}</td>
              
              <td className="text-center font-black text-danger">{formatNumber(d.ungroup_c)}</td>
            </tr>
          ))}
          {r.gabungan.length === 0 && <tr><td colSpan="13" className="text-center text-muted">Tidak ada data</td></tr>}
        </tbody>
        {r.gabungan.length > 0 && (
          <tfoot>
            <tr style={{ backgroundColor: 'var(--surface-alt)' }}>
              <td colSpan="2" className="text-center font-black" style={{ padding: '1rem' }}>TOTAL</td>
              <td className="text-right font-black">{formatRupiah(r.gabungan.reduce((s, d) => s + d.rj_tRs, 0))}</td>
              <td className="text-right font-black">{formatRupiah(r.gabungan.reduce((s, d) => s + d.ri_tRs, 0))}</td>
              
              <td className="text-center font-black">{formatNumber(r.gabungan.reduce((s, d) => s + d.inacbg_rj_c, 0))}</td>
              <td className="text-center font-black">{formatNumber(r.gabungan.reduce((s, d) => s + d.inacbg_ri_c, 0))}</td>
              <td className="text-right font-black">{formatRupiah(r.gabungan.reduce((s, d) => s + d.inacbg_rj_t, 0))}</td>
              <td className="text-right font-black">{formatRupiah(r.gabungan.reduce((s, d) => s + d.inacbg_ri_t, 0))}</td>
              
              <td className="text-center font-black">{formatNumber(r.gabungan.reduce((s, d) => s + d.idrg_rj_c, 0))}</td>
              <td className="text-center font-black">{formatNumber(r.gabungan.reduce((s, d) => s + d.idrg_ri_c, 0))}</td>
              <td className="text-right font-black" style={{ color: 'var(--primary)' }}>{formatRupiah(r.gabungan.reduce((s, d) => s + d.idrg_rj_t, 0))}</td>
              <td className="text-right font-black" style={{ color: 'var(--primary)' }}>{formatRupiah(r.gabungan.reduce((s, d) => s + d.idrg_ri_t, 0))}</td>
              
              <td className="text-center font-black text-danger">{formatNumber(r.gabungan.reduce((s, d) => s + d.ungroup_c, 0))}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );

  const renderSimpleList = (data, title) => (
    <div className="elite-table-container">
      <div style={{ padding: '1rem', fontWeight: 900, backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>{title}</div>
      <table className="elite-table">
        <thead>
          <tr>
            <th>No</th><th>MRN</th><th>SEP</th><th>Nama Pasien</th>
            <th>Deskripsi / Kode DRG / INACBG</th><th>Kode ICD</th><th>Jenis Layanan</th><th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <td className="text-center">{i + 1}</td>
              <td>{d.mrn}</td><td>{d.sep}</td>
              <td className="font-black">{maskName(d.nama)}</td>
              <td>{d.desc}</td>
              <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{d.icd}</td>
              <td className="text-center"><span className="badge" style={{ backgroundColor: 'var(--surface-alt)' }}>{d.type}</span></td>
              <td className="text-center"><span className="badge bg-danger-light">{d.ket}</span></td>
            </tr>
          ))}
          {data.length === 0 && <tr><td colSpan="8" className="text-center text-muted">Tidak ada kasus anomali ditemukan.</td></tr>}
        </tbody>
      </table>
    </div>
  );

  const renderUnmappedList = (data, title) => (
    <div className="elite-table-container">
      <div style={{ padding: '1rem 1.25rem', fontWeight: 900, backgroundColor: '#fff7ed', borderBottom: '2px solid #fed7aa', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.1rem' }}>⚠️</span>
        <span>{title}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 600, color: '#92400e', backgroundColor: '#fef3c7', padding: '2px 10px', borderRadius: 20, border: '1px solid #fbbf24' }}>
          {data.length} Kasus
        </span>
      </div>
      <table className="elite-table">
        <thead>
          <tr>
            <th style={{ width: 40 }}>No</th>
            <th>MRN / SEP</th>
            <th>Nama Pasien</th>
            <th style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>Kode iDRG &amp; INACBG</th>
            <th style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>Deskripsi iDRG</th>
            <th style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>Diaglist (ICD Diagnosa)</th>
            <th style={{ backgroundColor: '#faf5ff', color: '#6b21a8' }}>Proclist (ICD Prosedur)</th>
            <th style={{ backgroundColor: '#fff7ed', color: '#c2410c' }}>⚠ Alasan Belum Mapping</th>
            <th style={{ width: 70 }}>Jenis</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr><td colSpan={9} className="text-center text-muted" style={{ padding: '2rem' }}>Tidak ada kasus belum mapping. Bagus! 🎉</td></tr>
          )}
          {data.map((d, i) => {
            const isDrgReason = d.alasanMapping && d.alasanMapping.includes('DRG');
            return (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                <td className="text-center" style={{ color: '#94a3b8', fontWeight: 700 }}>{i + 1}</td>
                <td>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.78rem', color: '#334155' }}>{d.mrn}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{d.sep}</div>
                </td>
                <td className="font-black" style={{ fontSize: '0.82rem' }}>{maskName(d.nama)}</td>
                <td style={{ backgroundColor: '#eff6ff20' }}>
                  <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.82rem', color: '#1d4ed8' }}>{d.drgCode || '-'}</div>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>{d.inacbg || '-'}</div>
                </td>
                <td style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: '0.78rem', color: '#374151' }}>{d.desc || '-'}</td>
                <td style={{ backgroundColor: '#f0fdf420', maxWidth: 200, whiteSpace: 'normal' }}>
                  {(d.icd || '').split(';').filter(Boolean).map((code, ci) => (
                    <span key={ci} style={{ display: 'inline-block', margin: '2px 2px', padding: '1px 7px', backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 5, fontSize: '0.72rem', fontWeight: 700, fontFamily: 'monospace' }}>
                      {code.trim()}
                    </span>
                  ))}
                </td>
                <td style={{ backgroundColor: '#faf5ff20', maxWidth: 200, whiteSpace: 'normal' }}>
                  {d.proclist && d.proclist !== '-' ? (
                    (d.proclist || '').split(';').filter(p => p.trim() && p.trim() !== '-' && p.trim().toLowerCase() !== 'none').map((code, ci) => (
                      <span key={ci} style={{ display: 'inline-block', margin: '2px 2px', padding: '1px 7px', backgroundColor: '#f3e8ff', color: '#6b21a8', border: '1px solid #e9d5ff', borderRadius: 5, fontSize: '0.72rem', fontWeight: 700, fontFamily: 'monospace' }}>
                        {code.trim()}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontStyle: 'italic' }}>Tidak ada prosedur</span>
                  )}
                </td>
                <td style={{ maxWidth: 220, whiteSpace: 'normal' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>{isDrgReason ? '🔴' : '🟡'}</span>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isDrgReason ? '#c2410c' : '#854d0e', lineHeight: 1.4 }}>
                        {d.alasanMapping || 'Tidak diketahui'}
                      </div>
                      {isDrgReason && (
                        <div style={{ fontSize: '0.65rem', color: '#9a3412', marginTop: 3, fontStyle: 'italic' }}>
                          Grouping ulang iDRG untuk pasien tersebut
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="text-center">
                  <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 800, backgroundColor: d.type === 'RANAP' ? '#dbeafe' : '#dcfce7', color: d.type === 'RANAP' ? '#1d4ed8' : '#166534', border: `1px solid ${d.type === 'RANAP' ? '#93c5fd' : '#86efac'}` }}>
                    {d.type}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="relative p-4">
<style>{`
.elite-table-container { overflow: auto; max-height: 70vh; border-radius: 12px; border: 1px solid #e2e8f0; background-color: white; }
.elite-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left; }
.elite-table th { background-color: #f8fafc; color: #64748b; font-weight: 800; padding: 1rem; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #e2e8f0; font-size: 0.7rem; }
.elite-table td { padding: 0.875rem 1rem; border: 1px solid #e2e8f0; color: #334155; font-weight: 500; }
.elite-table tbody tr:hover { background-color: #f1f5f9; }
.text-right { text-align: right; }
.text-center { text-align: center; }
.text-success { color: #10b981; }
.text-danger { color: #f43f5e; }
.bg-success-light { background-color: #d1fae5; color: #065f46; }
.font-black { font-weight: 900; }
.tab-button { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; font-weight: 700; font-size: 0.8rem; color: #64748b; background: white; border: 1px solid #e2e8f0; border-radius: 0.75rem; cursor: pointer; transition: all 0.2s; }
.tab-button.active { background-color: #0f172a; color: white; border-color: #0f172a; }
.tab-button:hover:not(.active) { background-color: #f8fafc; border-color: #cbd5e1; }
.tab-container { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.5rem; }
`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '0.75rem', borderRadius: '12px' }}>
            <FileText size={28} />
          </div>
          <div>
            <h1 className="page-title" style={{ margin: 0, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>
              Laporan <span style={{ color: 'var(--primary-light)' }}>Standar V5</span>
            </h1>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0.25rem 0 0 0' }}>
              Berdasarkan Template Excel Perbandingan INA CBGs dan I DRG
            </p>
          </div>
        </div>
        <button onClick={() => setShowPasswordModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 900 }}>
          <Download size={16} /> Export Excel
        </button>
      </div>

      <div className="tab-container" style={{ flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <button onClick={() => setActiveTab('inaCbg')} className={`tab-button ${activeTab === 'inaCbg' ? 'active' : ''}`}>
          <TableIcon size={16} /> Klaim INA-CBGs
        </button>
        <button onClick={() => setActiveTab('idrg')} className={`tab-button ${activeTab === 'idrg' ? 'active' : ''}`}>
          <Activity size={16} /> Klaim iDRG
        </button>
        <button onClick={() => setActiveTab('idrgRi')} className={`tab-button ${activeTab === 'idrgRi' ? 'active' : ''}`}>
          <Layers size={16} /> iDRG RI
        </button>
        <button onClick={() => setActiveTab('idrgRj')} className={`tab-button ${activeTab === 'idrgRj' ? 'active' : ''}`}>
          <TrendingUp size={16} /> iDRG RJ
        </button>
        <button onClick={() => setActiveTab('gabungan')} className={`tab-button ${activeTab === 'gabungan' ? 'active' : ''}`}>
          <ActivitySquare size={16} /> Data Gabungan
        </button>
        <button onClick={() => setActiveTab('ungroupable')} className={`tab-button ${activeTab === 'ungroupable' ? 'active' : ''}`}>
          <Ban size={16} /> Kasus Ungroupable
        </button>
        <button onClick={() => setActiveTab('unmapped')} className={`tab-button ${activeTab === 'unmapped' ? 'active' : ''}`}>
          <HelpCircle size={16} /> Belum Ada Mapping
        </button>
      </div>

      <div className="card" style={{ padding: 0, border: 'none' }}>
        {activeTab === 'inaCbg' && renderInaCbg()}
        {activeTab === 'idrg' && renderIdrg()}
        {activeTab === 'idrgRi' && renderDrgTable(r.idrg_ri, 'iDRG RAWAT INAP')}
        {activeTab === 'idrgRj' && renderDrgTable(r.idrg_rj, 'iDRG RAWAT JALAN')}
        {activeTab === 'gabungan' && renderGabungan()}
        {activeTab === 'ungroupable' && renderSimpleList(r.ungroupable, 'KASUS UNGROUPABLE')}
        {activeTab === 'unmapped' && renderUnmappedList(r.unmapped, 'KASUS BELUM ADA MAPPING KOMPETENSI')}
      </div>

      {showPasswordModal && (
        <PasswordModal isOpen={true} onClose={() => setShowPasswordModal(false)}
          onSuccess={(pwd) => {
            setShowPasswordModal(false);
            handleExportExcel(pwd);
          }}
        />
      )}
    </div>
  );
}



