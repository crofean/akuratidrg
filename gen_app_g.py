#!/usr/bin/env python3
G = """
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
                       const inaStr = String(row.INACBG || '').trim(); const cl = parseInt(String(row.IDRG_DRG_CODE||'').slice(-1));
                       return (
                        <tr key={`dr-${i}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4 border-r border-slate-50 text-center font-bold text-slate-400 bg-slate-50/30">{i + 1}</td>
                          <td className="px-5 py-4 border-r border-slate-50 sticky left-0 bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] font-extrabold text-slate-800">{String(row.NAMA_PASien || row.NAMA_PASIEN || '-')}</td>
                          <td className="px-5 py-4 border-r border-slate-50 font-black text-slate-600 bg-slate-50/30">{String(row.MRN || '-')}</td>
                          <td className="px-5 py-4 border-r border-slate-50 font-mono text-xs font-bold text-slate-500 bg-slate-50/30">{String(row.SEP || '-')}</td>
                          <td className="px-5 py-4 border-r border-slate-50 font-bold text-slate-600 bg-slate-50/30">{String(row.DISCHARGE_DATE || '-')}</td>
                          <td className="px-4 py-4 border-r border-sky-50 text-center font-black bg-sky-50/10 text-sky-700">{inaStr ? (inaStr.endsWith('-I') ? 1 : inaStr.endsWith('-II') ? 2 : inaStr.endsWith('-III') ? 3 : 0) : 0}</td>
                          <td className="px-4 py-4 border-r border-orange-50 text-center font-black bg-orange-50/10 text-orange-700">{isNaN(cl) ? '-' : cl}</td>
                          <td className="px-4 py-4 border-r border-slate-50 font-black text-sky-700">{inaStr || '-'}</td>
                          <td className="px-4 py-4 border-r border-slate-50 text-xs font-semibold text-slate-500 max-w-[200px] truncate" title={row.DESKRIPSI_INACBG}>{String(row.DESKRIPSI_INACBG || '-')}</td>
                          <td className="px-4 py-4 border-r border-slate-50 text-xs font-bold text-slate-700 max-w-[150px] truncate" title={row.DIAGLIST}>{String(row.DIAGLIST || '-')}</td>
                          <td className="px-4 py-4 border-r border-sky-50 text-xs font-bold text-slate-700 max-w-[150px] truncate" title={row.PROCLIST}>{String(row.PROCLIST || '-')}</td>
                          <td className="px-4 py-4 border-r border-slate-50 font-black text-orange-600">{String(row.IDRG_DRG_CODE || '-')}</td>
                          <td className="px-4 py-4 border-r border-slate-50 text-xs font-semibold text-slate-500 max-w-[200px] truncate" title={row.IDRG_DRG_DESCRIPTION}>{String(row.IDRG_DRG_DESCRIPTION || '-')}</td>
                          <td className="px-4 py-4 border-r border-slate-50 text-xs font-bold text-slate-700 max-w-[150px] truncate" title={row.IDRG_DIAG_LISTS}>{String(row.IDRG_DIAG_LISTS || '-')}</td>
                          <td className="px-4 py-4 border-r border-orange-50 text-xs font-bold text-slate-700 max-w-[150px] truncate" title={row.IDRG_PROC_LISTS}>{String(row.IDRG_PROC_LISTS || '-')}</td>
                          <td className="px-5 py-4 border-r border-sky-50 text-right font-black text-sky-600 bg-sky-50/10">{formatRp(ina)}</td>
                          <td className="px-5 py-4 border-r border-orange-50 text-right font-black text-orange-600 bg-orange-50/10">{formatRp(idrg)}</td>
                          <td className={`px-5 py-4 border-r-4 border-r-slate-100 text-right font-black bg-slate-50/50 ${sel>0?'text-emerald-600':sel<0?'text-orange-500':'text-slate-400'}`}>{formatRp(sel)}</td>
                          {compKeys.map(c => <td key={c.key} className="px-4 py-4 border-r border-slate-50 text-right text-xs font-medium text-slate-500">{formatRpEx(extract18(row)[c.key])}</td>)}
                        </tr>
                       );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            {drilldown.data.length > 300 && <div className="bg-sky-50 text-sky-700 text-center py-3 text-xs font-bold border-t border-sky-100 shadow-[0_-4px_10px_-5px_rgba(2,132,199,0.2)] z-50">Menampilkan 300 record pertama. Gunakan Ekspor CSV untuk melihat {drilldown.data.length.toLocaleString()} data secara utuh.</div>}
          </div>
        </div>
      )}

      {scatterTooltip && (
        <div className="fixed z-[200] pointer-events-none bg-slate-900/95 backdrop-blur shadow-2xl rounded-2xl p-4 border border-slate-700 animate-in zoom-in-95 duration-200" style={{ left: scatterTooltip.x + 15, top: scatterTooltip.y + 15, transform: 'translate(0, 0)' }}>
           <p className="font-extrabold text-white text-sm mb-1.5 border-b border-slate-700 pb-1.5">{scatterTooltip.title}</p>
           <p className="text-xs font-bold text-slate-400 mt-1">Sumbu X: <span className="text-white ml-1">{formatRpEx(scatterTooltip.xVal)}</span></p>
           <p className="text-xs font-bold text-slate-400 mt-1">Sumbu Y: <span className="text-white ml-1">{formatRpEx(scatterTooltip.yVal)}</span></p>
           {scatterTooltip.cVal !== undefined && <p className="text-xs font-bold text-sky-400 mt-1">Rata-rata: <span className="text-white ml-1">{formatRpEx(scatterTooltip.cVal)}</span></p>}
        </div>
      )}

      <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200 py-3' : 'bg-white py-5'}`}>
        <div className="max-w-[1400px] mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-sky-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-600/30 shrink-0"><ActivitySquare className="text-white" size={24} /></div>
             <div><h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">SAK<span className="text-sky-600">iDRG</span></h1><p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Analytics Dashboard</p></div>
          </div>
          <div className="flex gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
             <button onClick={() => setActiveTab('upload')} className={`px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all flex items-center gap-2 ${activeTab === 'upload' ? 'bg-white text-sky-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}><UploadCloud size={16} /> Dataset</button>
             <button onClick={() => setActiveTab('dashboard')} disabled={uploadedFiles.length === 0} className={`px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 disabled:opacity-50 disabled:cursor-not-allowed'}`}><PieChart size={16} /> Analytics Engine</button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {activeTab === 'upload' && renderUploadTab()}
        {activeTab === 'dashboard' && dashData && (
          <div className="flex flex-col xl:flex-row gap-8">
            <div className="w-full xl:w-64 shrink-0 space-y-6 xl:sticky xl:top-28 h-fit">
               <Card className="p-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Modul Analisis</p><div className="flex flex-col gap-1.5">{TABS.map(t => { const Icon = t.icon; const isActive = subTab === t.id; return (<button key={t.id} onClick={() => setSubTab(t.id)} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold transition-all ${isActive ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800 border border-transparent'}`}><Icon size={18} className={isActive ? 'text-sky-600' : 'text-slate-400'}/> {t.label}</button>); })}</div></Card>
               <Card className="p-5 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 border-4 border-white shadow-md flex items-center justify-center mb-4"><CheckCircle className="text-emerald-500" size={32}/></div>
                  <h3 className="font-black text-slate-800 text-3xl tracking-tight">{dashData.totalRows.toLocaleString()}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Episode</p>
                  {dashData.isEmptyAfterFilter && <p className="text-orange-500 text-xs mt-3 font-semibold bg-orange-50 p-2 rounded-lg border border-orange-100 w-full">Tidak ada data untuk filter saat ini.</p>}
               </Card>
            </div>
            
            <div className="flex-1 min-w-0">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                 <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Periode</label><select value={globalFilter.periode} onChange={(e) => setGlobalFilter({ ...globalFilter, periode: e.target.value })} className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl focus:ring-sky-500 focus:border-sky-500 block p-2.5 transition-colors hover:border-sky-300"><option value="All">Semua Periode</option>{filterOptions.periods.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                 <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Jenis Rawat</label><select value={globalFilter.jenisRawat} onChange={(e) => setGlobalFilter({ ...globalFilter, jenisRawat: e.target.value })} className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl focus:ring-sky-500 focus:border-sky-500 block p-2.5 transition-colors hover:border-sky-300"><option value="All">Semua Jenis</option>{filterOptions.jenis.map(p => <option key={p} value={p}>{p === '1' ? 'Rawat Inap' : p === '2' ? 'Rawat Jalan' : p}</option>)}</select></div>
                 <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Hak Kelas</label><select value={globalFilter.kelasRawat} onChange={(e) => setGlobalFilter({ ...globalFilter, kelasRawat: e.target.value })} className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl focus:ring-sky-500 focus:border-sky-500 block p-2.5 transition-colors hover:border-sky-300"><option value="All">Semua Kelas</option>{filterOptions.kelas.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                 <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 ml-1">DPJP</label><select value={globalFilter.dpjp} onChange={(e) => setGlobalFilter({ ...globalFilter, dpjp: e.target.value })} className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl focus:ring-sky-500 focus:border-sky-500 block p-2.5 transition-colors hover:border-sky-300"><option value="All">Semua DPJP</option>{filterOptions.dpjps.map(p => <option key={p.norm} value={p.norm}>{p.disp}</option>)}</select></div>
               </div>

               {dashData.isEmptyAfterFilter ? (
                  <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6"><Search size={32} className="text-slate-300" /></div>
                    <h3 className="text-xl font-black text-slate-700 tracking-tight">Tidak Ada Data Ditemukan</h3>
                    <p className="text-slate-500 font-medium mt-2 max-w-md">Kombinasi filter yang Anda pilih tidak menghasilkan data apapun. Silakan ubah filter pencarian Anda.</p>
                    <button onClick={() => setGlobalFilter({ periode: 'All', jenisRawat: 'All', kelasRawat: 'All', dpjp: 'All' })} className="mt-8 bg-sky-50 text-sky-700 font-bold px-6 py-2.5 rounded-xl hover:bg-sky-100 transition-colors border border-sky-200">Reset Semua Filter</button>
                  </div>
               ) : (
                  <>
                    {subTab === 'executive' && renderExecutive()}
                    {subTab === 'report' && renderReport()}
                    {subTab === 'rekap' && renderRekap()}
                    {subTab === 'sl_cl_analysis' && renderSlClAnalysis()}
                    {subTab === 'dpjp' && renderDpjp()}
                    {subTab === 'kpi_coder' && renderKpiCoder()}
                    {subTab === 'mapping' && renderPemetaan()}
                    {subTab === 'discrepancy' && renderKetepatan()}
                    {subTab === 'audit' && renderAudit()}
                    {subTab === 'naik_kelas' && renderNaikKelas()}
                    {subTab === 'icu' && renderICU()}
                  </>
               )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
"""
with open('src/App.jsx', 'a', encoding='utf-8') as f:
    f.write(G)
print("Part G written:", len(G), "chars")
