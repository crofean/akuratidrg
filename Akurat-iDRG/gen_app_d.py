#!/usr/bin/env python3
D = """
  const openDrilldown = (title, filterFn) => { if (dashData) setDrilldown({ isOpen: true, title: String(title), data: dashData.rawRows.filter(filterFn) }); };

  const dlDrilldownCSV = () => {
    const headers = ['No', 'Nama Pasien', 'MRN', 'SEP', 'Tgl Pulang', 'SL INA', 'CL iDRG', 'INA Code', 'Deskripsi INA', 'Diag INA', 'Proc INA', 'iDRG Code', 'Deskripsi iDRG', 'Diag iDRG', 'Proc iDRG', 'Tarif INA', 'Tarif iDRG', 'Selisih', ...compKeys.map(c=>c.label)];
    const rows = drilldown.data.map((row, i) => {
        const ina = parseFloat(row.TOTAL_TARIF)||0; const idrg = parseFloat(row.IDRG_TOTAL_TARIF)||0; 
        const inaStr = String(row.INACBG || '').trim(); const cl = parseInt(String(row.IDRG_DRG_CODE||'').slice(-1));
        return [ i+1, String(row.NAMA_PASien || row.NAMA_PASIEN || '-'), String(row.MRN || '-'), String(row.SEP || '-'), String(row.DISCHARGE_DATE || '-'), inaStr ? (inaStr.endsWith('-I') ? 1 : inaStr.endsWith('-II') ? 2 : inaStr.endsWith('-III') ? 3 : 0) : 0, isNaN(cl) ? '-' : cl, String(row.INACBG || '-'), String(row.DESKRIPSI_INACBG || '-'), String(row.DIAGLIST || '-'), String(row.PROCLIST || '-'), String(row.IDRG_DRG_CODE || '-'), String(row.IDRG_DRG_DESCRIPTION || '-'), String(row.IDRG_DIAG_LISTS || '-'), String(row.IDRG_PROC_LISTS || '-'), ina, idrg, idrg - ina, ...compKeys.map(c=>extract18(row)[c.key]) ];
    });
    exportToCSV(`Data_Pasien_${drilldown.title}`, headers, rows);
  };

  const getPieSlices = (items) => {
    let slices = []; let cPct = 0;
    [...items].sort((a,b) => (b.value||0) - (a.value||0)).forEach((item) => {
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

  const renderUploadTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto mt-8">
      <div className="lg:col-span-2 space-y-6">
        <Card className="p-8 text-center transition-all duration-300 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className={`relative z-10 border-2 border-dashed rounded-xl p-8 transition-colors ${isDragging ? 'border-sky-500 bg-sky-50/50' : 'border-slate-200 hover:border-sky-300'}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform"><UploadCloud className="text-sky-600" size={32} /></div>
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Unggah Data TXT</h3>
            <p className="text-sm text-slate-500 mb-8 mt-2">Tarik dan letakkan file format TXT klaim RS (Tab Separated) ke area ini.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => fileInputRef.current?.click()} className="bg-sky-600 hover:bg-sky-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all shadow-md hover:-translate-y-0.5"><FileText size={18} /> Pilih File TXT</button>
              <button onClick={() => folderInputRef.current?.click()} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all hover:shadow-sm"><Folder size={18} className="text-slate-400" /> Pilih Folder</button>
            </div>
            <input type="file" multiple accept=".txt" ref={fileInputRef} className="hidden" onChange={(e) => { if(e.target.files) processFiles(e.target.files); }} />
            <input type="file" webkitdirectory="true" directory="true" multiple ref={folderInputRef} className="hidden" onChange={(e) => { if(e.target.files) processFiles(e.target.files); }} />
          </div>
        </Card>
        {error && <div className="bg-orange-50 border border-orange-100 text-orange-700 p-4 rounded-xl flex items-start gap-3 text-sm font-medium shadow-sm animate-in zoom-in-95"><AlertCircle size={20} className="shrink-0 text-orange-500" /><p>{String(error)}</p></div>}
      </div>
      <div className="lg:col-span-3">
        <Card className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <div><h3 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2"><Layers className="text-sky-600" size={20}/> Dataset Aktif</h3><p className="text-xs text-slate-500 mt-1">{uploadedFiles.length} file terintegrasi.</p></div>
            {uploadedFiles.length > 0 && <button onClick={clearData} className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"><Trash2 size={16} /> Kosongkan</button>}
          </div>
          {uploadedFiles.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 min-h-[300px]"><Layers size={48} className="opacity-20 mb-4 text-slate-500" /><p className="font-semibold text-slate-500">Belum ada dataset yang diunggah</p><p className="text-xs mt-1 opacity-70">Silakan upload file .txt klaim.</p></div>
          ) : (
            <ul className="space-y-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {uploadedFiles.map((f) => (
                <li key={f.id} className="flex items-center gap-4 text-sm bg-white border border-slate-100 shadow-sm p-4 rounded-xl group hover:border-sky-200 transition-all hover:shadow-md">
                  <div className="w-10 h-10 rounded-full bg-lime-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><CheckCircle size={20} className="text-lime-500" /></div>
                  <div className="flex-1 min-w-0"><p className="truncate text-slate-800 font-bold" title={String(f.path)}>{String(f.name)}</p><p className="text-xs text-slate-500 mt-1">{String(f.size)} • <span className="font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md ml-1">{f.rows.length} records</span></p></div>
                  <button onClick={() => removeFile(f.id)} className="text-slate-400 hover:text-orange-600 p-2 rounded-lg hover:bg-orange-50 transition-colors"><X size={18} /></button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );

  const renderExecutive = () => {
    const isSelPos = dashData.selisihTotal > 0;
    const dp = dashData.dischargeStats, t = dashData.totalRows || 1;
    const dischargePie = [{ value: (dp["1"]/t)*100, color: '#84cc16', label: 'Atas Ijin Dokter' }, { value: (dp["2"]/t)*100, color: '#0ea5e9', label: 'Dirujuk' }, { value: (dp["3"]/t)*100, color: '#f97316', label: 'Pulang APS' }, { value: (dp["4"]/t)*100, color: '#ef4444', label: 'Meninggal' }, { value: (dp["5"]/t)*100, color: '#94a3b8', label: 'Lain-lain' }];
    const selPie = [{ value: t > 0 ? (dashData.cInaHigh/t)*100 : 0, color: '#0ea5e9', label: 'INA > IDRG' }, { value: t > 0 ? (dashData.cIdrgHigh/t)*100 : 0, color: '#f97316', label: 'IDRG > INA' }, { value: t > 0 ? (dashData.cEq/t)*100 : 0, color: '#94a3b8', label: 'Sama Besar' }];

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all group relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-sky-500"></div>
            <div className="flex justify-between items-start mb-4"><p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Total INA-CBG</p><div className="bg-sky-50 p-2 rounded-lg text-sky-600 group-hover:bg-sky-500 group-hover:text-white transition-colors" onClick={() => openDrilldown('Seluruh Data INA-CBG', () => true)}><Search size={16}/></div></div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{formatRp(dashData.tIna)}</h2><p className="text-sm font-medium text-slate-500 mt-2">Rata-rata {formatRp(dashData.rataInacbg)}/ep</p>
          </Card>
          <Card className="p-6 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all group relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
            <div className="flex justify-between items-start mb-4"><p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Total iDRG</p><div className="bg-orange-50 p-2 rounded-lg text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors" onClick={() => openDrilldown('Seluruh Data iDRG', () => true)}><Search size={16}/></div></div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{formatRp(dashData.tIdrg)}</h2><p className="text-sm font-medium text-slate-500 mt-2">Rata-rata {formatRp(dashData.rataIdrg)}/ep</p>
          </Card>
          <Card className="p-6 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all group relative lg:col-span-2">
            <div className={`absolute top-0 left-0 w-full h-1 ${isSelPos ? 'bg-lime-500' : 'bg-orange-500'}`}></div>
            <div className="flex justify-between items-start mb-4"><p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Selisih Finansial Total (iDRG - INA)</p><div className="bg-slate-50 p-2 rounded-lg text-slate-400 group-hover:bg-slate-800 group-hover:text-white transition-colors" onClick={() => openDrilldown('Selisih Total', r => Math.round(parseFloat(r['IDRG_TOTAL_TARIF'])||0) !== Math.round(parseFloat(r['TOTAL_TARIF'])||0))}><Search size={16}/></div></div>
            <div className="flex items-baseline gap-4"><h2 className={`text-4xl font-black tracking-tight ${isSelPos ? 'text-lime-600' : 'text-orange-600'}`}>{isSelPos ? '+' : ''}{formatRp(dashData.selisihTotal)}</h2><div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${isSelPos ? 'bg-lime-100 text-lime-700' : 'bg-orange-100 text-orange-700'}`}>{isSelPos ? <TrendingUp size={16}/> : <TrendingDown size={16}/>} {formatPct(dashData.tIna > 0 ? (Math.abs(dashData.selisihTotal)/dashData.tIna*100) : 0)}%</div></div>
            <p className="text-sm font-medium text-slate-500 mt-2">Potensi {isSelPos ? 'Surplus' : 'Defisit'} terhadap klaim INA-CBG awal.</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 flex flex-col">
            <div className="flex justify-between items-center mb-8"><h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2"><BarChart3 size={18} className="text-sky-500"/> Komparasi Per Bulan</h3><button onClick={() => exportToCSV('Bulan', ['Bulan','RS','INA','IDRG','Selisih'], dashData.monthlyArray.map(m=>[m.label,m.tarifRs,m.inacbg,m.idrg,m.selisih]))} className="text-sky-600 hover:text-sky-800 bg-sky-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">CSV</button></div>
            <div className="w-full h-64 flex flex-col relative px-2">
               <div className="w-full flex items-end border-b border-slate-200 z-0 gap-3" style={{ height: `${dashData.posPct}%` }}>
                 {dashData.monthlyArray.map((m, i) => (
                     <div key={`pos-${i}`} className="flex-1 flex flex-col justify-end items-center h-full z-10 group relative">
                       <div className="opacity-0 group-hover:opacity-100 absolute -top-20 bg-slate-900/95 backdrop-blur text-white text-xs p-3 rounded-xl shadow-xl z-30 pointer-events-none whitespace-nowrap border border-slate-700"><p className="font-extrabold border-b border-slate-700 pb-1.5 mb-1.5 text-slate-100">{String(m.label)}</p><p className="text-slate-400 font-medium">RS: <span className="text-white">{formatRp(m.tarifRs)}</span></p><p className="text-sky-400 font-medium">INA: <span className="text-white">{formatRp(m.inacbg)}</span></p><p className="text-orange-400 font-medium">iDRG: <span className="text-white">{formatRp(m.idrg)}</span></p></div>
                       <div className="w-full max-w-[40px] flex items-end justify-center gap-[2px] h-full relative"><div className="w-1/3 bg-slate-300 rounded-t-sm transition-all" style={{ height: `${Math.max((m.tarifRs/dashData.maxPosVal)*100, 1)}%` }}></div><div className="w-1/3 bg-sky-500 rounded-t-sm shadow-[0_0_8px_rgba(14,165,233,0.5)] transition-all" style={{ height: `${Math.max((m.inacbg/dashData.maxPosVal)*100, 1)}%` }}></div><div className="w-1/3 bg-orange-500 rounded-t-sm shadow-[0_0_8px_rgba(249,115,22,0.5)] transition-all" style={{ height: `${Math.max((m.idrg/dashData.maxPosVal)*100, 1)}%` }}></div></div>
                     </div>
                 ))}
               </div>
               <div className="w-full flex items-start gap-3 relative h-8 mt-3">{dashData.monthlyArray.map((m, i) => <div key={`lbl-${i}`} className="flex-1 flex justify-center text-[10px] font-bold text-slate-500">{String(m.label)}</div>)}</div>
            </div>
            <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div><span className="text-[10px] font-bold text-slate-600 uppercase">Tarif RS</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-sm"></div><span className="text-[10px] font-bold text-slate-600 uppercase">INACBG</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm"></div><span className="text-[10px] font-bold text-slate-600 uppercase">IDRG</span></div>
            </div>
          </Card>
          <Card className="p-6 flex flex-col">
            <h3 className="text-sm font-extrabold text-slate-800 mb-8 uppercase tracking-wider flex items-center gap-2"><Activity size={18} className="text-lime-500"/> Tren Surplus & Defisit iDRG</h3>
            <div className="flex-1 w-full flex items-center justify-between relative px-2 py-4 h-64">
              <div className="absolute left-0 right-0 border-b border-slate-300 border-dashed z-0" style={{ top: '50%' }}></div>
              {dashData.monthlyArray.map((m, idx) => {
                 const isDef = m.selisih < 0; const hPct = dashData.absMaxSelisih > 0 ? (Math.abs(m.selisih) / dashData.absMaxSelisih) * 45 : 0;
                 return (
                    <div key={`sel-${idx}`} className="relative flex flex-col justify-center items-center h-full w-full group cursor-pointer">
                       <div className={`opacity-0 group-hover:opacity-100 transition-opacity absolute ${isDef ? 'bottom-[55%]' : 'top-[55%]'} bg-slate-900/95 backdrop-blur text-white text-xs p-3 rounded-xl shadow-xl z-30 pointer-events-none whitespace-nowrap border border-slate-700`}><p className="font-extrabold border-b border-slate-700 pb-1.5 mb-1.5">{String(m.label)}</p><p className={`font-bold ${isDef ? 'text-orange-400' : 'text-lime-400'}`}>{isDef ? 'Defisit' : 'Surplus'}: <span className="text-white">{formatRp(m.selisih)}</span></p></div>
                       <div className="w-full h-1/2 flex flex-col justify-end items-center pb-[1px] z-10">{!isDef && <div className="w-4 sm:w-8 bg-lime-500 hover:bg-lime-400 transition-all rounded-t-md shadow-sm" style={{ height: `${Math.max(hPct * 2, 1)}%` }}></div>}</div>
                       <div className="w-full h-1/2 flex flex-col justify-start items-center pt-[1px] z-10">{isDef && <div className="w-4 sm:w-8 bg-orange-500 hover:bg-orange-400 transition-all rounded-b-md shadow-sm" style={{ height: `${Math.max(hPct * 2, 1)}%` }}></div>}</div>
                       <span className="absolute bottom-0 text-[10px] font-bold text-slate-500">{String(m.label)}</span>
                    </div>
                 );
              })}
            </div>
            <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-lime-500"></div><span className="text-[10px] font-bold text-slate-600 uppercase">Surplus</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div><span className="text-[10px] font-bold text-slate-600 uppercase">Defisit</span></div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 flex flex-col items-center">
            <h3 className="text-sm font-extrabold text-slate-800 mb-6 uppercase tracking-wider w-full text-left">Volume Arah Selisih</h3>
            <div className="relative flex flex-col items-center justify-center mt-2 w-full h-56 cursor-pointer group" onClick={() => openDrilldown('Semua Episode', () => true)}>
              <svg viewBox="0 0 36 36" className="w-56 h-56 group-hover:scale-110 transition-transform duration-500 drop-shadow-xl">{getPieSlices(selPie).map((slice, idx) => (<g key={`psel-${idx}`}><path d={slice.path} fill={slice.color} stroke="white" strokeWidth="0.5" className="hover:opacity-80 transition-opacity" />{!slice.isSmall && <text x={slice.labelX} y={slice.labelY} fill="white" fontSize="2.5" fontWeight="bold" textAnchor="middle" alignmentBaseline="central" className="pointer-events-none drop-shadow-md">{slice.percentStr}</text>}</g>))}</svg>
            </div>
            <div className="mt-8 w-full border-t border-slate-100 pt-6 space-y-3 w-full">
              <div className="flex justify-between items-center p-3 hover:bg-sky-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-sky-100" onClick={() => openDrilldown('Kasus INA-CBG > iDRG', r => Math.round(parseFloat(r.TOTAL_TARIF)||0) > Math.round(parseFloat(r.IDRG_TOTAL_TARIF)||0))}><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-sky-500 shadow-sm"></div><span className="text-xs font-bold text-slate-700">INACBG {'>'} IDRG</span></div><div className="text-right"><span className="text-sm font-extrabold text-sky-600 mr-2">{dashData.cInaHigh.toLocaleString()} <span className="text-[10px] text-sky-500 uppercase">Kasus</span></span><span className="text-xs font-bold text-slate-400">({formatPct(t > 0 ? (dashData.cInaHigh/t)*100 : 0)}%)</span></div></div>
              <div className="flex justify-between items-center p-3 hover:bg-orange-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-orange-100" onClick={() => openDrilldown('Kasus iDRG > INA-CBG', r => Math.round(parseFloat(r.IDRG_TOTAL_TARIF)||0) > Math.round(parseFloat(r.TOTAL_TARIF)||0))}><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm"></div><span className="text-xs font-bold text-slate-700">IDRG {'>'} INACBG</span></div><div className="text-right"><span className="text-sm font-extrabold text-orange-600 mr-2">{dashData.cIdrgHigh.toLocaleString()} <span className="text-[10px] text-orange-500 uppercase">Kasus</span></span><span className="text-xs font-bold text-slate-400">({formatPct(t > 0 ? (dashData.cIdrgHigh/t)*100 : 0)}%)</span></div></div>
              <div className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-200" onClick={() => openDrilldown('Kasus Sama Besar', r => Math.round(parseFloat(r.IDRG_TOTAL_TARIF)||0) === Math.round(parseFloat(r.TOTAL_TARIF)||0))}><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-slate-400 shadow-sm"></div><span className="text-xs font-bold text-slate-700">Sama Besar (Sesuai)</span></div><div className="text-right"><span className="text-sm font-extrabold text-slate-600 mr-2">{dashData.cEq.toLocaleString()} <span className="text-[10px] text-slate-400 uppercase">Kasus</span></span><span className="text-xs font-bold text-slate-400">({formatPct(t > 0 ? (dashData.cEq/t)*100 : 0)}%)</span></div></div>
            </div>
          </Card>
          <Card className="p-6 flex flex-col items-center">
            <h3 className="text-sm font-extrabold text-slate-800 mb-6 uppercase tracking-wider w-full text-left">Status Cara Pulang</h3>
            <div className="relative flex flex-col items-center justify-center mt-2 w-full h-56 cursor-pointer group" onClick={() => openDrilldown('Semua Episode', () => true)}>
              <svg viewBox="0 0 36 36" className="w-56 h-56 group-hover:scale-110 transition-transform duration-500 drop-shadow-xl">{getPieSlices(dischargePie).map((slice, idx) => (<g key={`pdis-${idx}`}><path d={slice.path} fill={slice.color} stroke="white" strokeWidth="0.5" className="hover:opacity-80 transition-opacity" />{!slice.isSmall && <text x={slice.labelX} y={slice.labelY} fill="white" fontSize="2.5" fontWeight="bold" textAnchor="middle" alignmentBaseline="central" className="pointer-events-none drop-shadow-md">{slice.percentStr}</text>}</g>))}</svg>
            </div>
            <div className="mt-8 w-full border-t border-slate-100 pt-6 grid grid-cols-2 gap-3">
              {dischargePie.map((item, i) => (
                <div key={`ditem-${i}`} className="flex flex-col p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-200" onClick={() => openDrilldown(`Status Pulang: ${item.label}`, r => { let d = String(r.DISCHARGE_STATUS || r.STATUS_PULANG || r.CARA_PULANG || '').trim(); return item.label==='Lain-lain' ? (!['1','2','3','4'].includes(d)) : d === String(i+1); })}>
                  <div className="flex items-center gap-2 mb-1"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color}}></div><span className="text-[10px] font-extrabold text-slate-500 uppercase truncate">{item.label}</span></div>
                  <span className="text-sm font-black" style={{color: item.color}}>{formatPct(item.value)}% <span className="text-[10px] font-semibold text-slate-400 ml-1">({dp[String(i+1)] || dp["5"]})</span></span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="flex flex-col mb-8 text-center items-center justify-center">
             <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center mb-4"><Layers size={24} className="text-sky-600"/></div>
             <h2 className="text-2xl font-black text-slate-800 tracking-tight">Top 10 Analisis Klinis & Finansial</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="flex flex-col hover:shadow-lg transition-all"><div className="p-4 bg-sky-50 border-b border-sky-100 flex items-center gap-2"><Stethoscope size={16} className="text-sky-600"/><h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Top 10 Diag. Utama</h3></div><MiniTable data={dashData.topDiagUtama} columns={[{header:'No', className:'w-8 text-center text-slate-400 font-bold', render:(r,i)=>i+1}, {header:'Kode', className:'font-extrabold text-slate-700', render:(r)=>r[0]}, {header:'Kasus', className:'text-right font-black text-sky-600', render:(r)=>r[1].toLocaleString()}]} /></Card>
            <Card className="flex flex-col hover:shadow-lg transition-all"><div className="p-4 bg-sky-50 border-b border-sky-100 flex items-center gap-2"><Stethoscope size={16} className="text-sky-600"/><h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Top 10 Diag. Sekunder</h3></div><MiniTable data={dashData.topDiagSekunder} columns={[{header:'No', className:'w-8 text-center text-slate-400 font-bold', render:(r,i)=>i+1}, {header:'Kode', className:'font-extrabold text-slate-700', render:(r)=>r[0]}, {header:'Kasus', className:'text-right font-black text-sky-600', render:(r)=>r[1].toLocaleString()}]} /></Card>
            <Card className="flex flex-col hover:shadow-lg transition-all"><div className="p-4 bg-sky-50 border-b border-sky-100 flex items-center gap-2"><ActivitySquare size={16} className="text-sky-600"/><h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Top 10 Tindakan</h3></div><MiniTable data={dashData.topProc} columns={[{header:'No', className:'w-8 text-center text-slate-400 font-bold', render:(r,i)=>i+1}, {header:'Kode', className:'font-extrabold text-slate-700', render:(r)=>r[0]}, {header:'Kasus', className:'text-right font-black text-sky-600', render:(r)=>r[1].toLocaleString()}]} /></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="flex flex-col hover:shadow-lg transition-all relative">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-lime-50/50"><div className="p-2 bg-lime-100 rounded-xl text-green-700"><TrendingUp size={18}/></div><div><h3 className="font-extrabold text-slate-800 tracking-tight">Top 10 Surplus INA-CBG</h3></div></div>
              <MiniTable data={dashData.topSurplusIna} columns={[{header:'No', className:'text-center text-slate-400 font-bold w-8', render:(r,i)=>i+1}, {header:'Kode', className:'font-extrabold text-slate-700', render:(r)=>r.code}, {header:'Kasus', className:'text-center font-bold text-slate-600', render:(r)=>r.count}, {header:'Surplus', className:'text-right font-black text-green-600', render:(r)=>`+${formatRp(r.totalSelisih)}`}]} onRowClick={r => openDrilldown(`Surplus INA: ${r.code}`, row => String(row.INACBG).trim() === r.code && (parseFloat(row.TOTAL_TARIF)||0) - (parseFloat(row.TARIF_RS)||parseFloat(row.BIAYA_RS)||0) > 0)} />
            </Card>
            <Card className="flex flex-col hover:shadow-lg transition-all relative">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-orange-50/50"><div className="p-2 bg-orange-100 rounded-xl text-orange-700"><TrendingDown size={18}/></div><div><h3 className="font-extrabold text-slate-800 tracking-tight">Top 10 Defisit INA-CBG</h3></div></div>
              <MiniTable data={dashData.topDefisitIna} columns={[{header:'No', className:'text-center text-slate-400 font-bold w-8', render:(r,i)=>i+1}, {header:'Kode', className:'font-extrabold text-slate-700', render:(r)=>r.code}, {header:'Kasus', className:'text-center font-bold text-slate-600', render:(r)=>r.count}, {header:'Defisit', className:'text-right font-black text-orange-600', render:(r)=>formatRp(r.totalSelisih)}]} onRowClick={r => openDrilldown(`Defisit INA: ${r.code}`, row => String(row.INACBG).trim() === r.code && (parseFloat(row.TOTAL_TARIF)||0) - (parseFloat(row.TARIF_RS)||parseFloat(row.BIAYA_RS)||0) < 0)} />
            </Card>
            <Card className="flex flex-col hover:shadow-lg transition-all relative">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-lime-50/50"><div className="p-2 bg-lime-100 rounded-xl text-green-700"><TrendingUp size={18}/></div><div><h3 className="font-extrabold text-slate-800 tracking-tight">Top 10 Surplus iDRG</h3></div></div>
              <MiniTable data={dashData.topSurplus} columns={[{header:'No', className:'text-center text-slate-400 font-bold w-8', render:(r,i)=>i+1}, {header:'Kode', className:'font-extrabold text-slate-700', render:(r)=>r.code}, {header:'Kasus', className:'text-center font-bold text-slate-600', render:(r)=>r.count}, {header:'Surplus', className:'text-right font-black text-green-600', render:(r)=>`+${formatRp(r.totalSelisih)}`}]} onRowClick={r => openDrilldown(`Surplus iDRG: ${r.code}`, row => String(row.IDRG_DRG_CODE).trim() === r.code && (parseFloat(row.IDRG_TOTAL_TARIF)||0) - (parseFloat(row.TOTAL_TARIF)||0) > 0)} />
            </Card>
            <Card className="flex flex-col hover:shadow-lg transition-all relative">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-orange-50/50"><div className="p-2 bg-orange-100 rounded-xl text-orange-700"><TrendingDown size={18}/></div><div><h3 className="font-extrabold text-slate-800 tracking-tight">Top 10 Defisit iDRG</h3></div></div>
              <MiniTable data={dashData.topDefisit} columns={[{header:'No', className:'text-center text-slate-400 font-bold w-8', render:(r,i)=>i+1}, {header:'Kode', className:'font-extrabold text-slate-700', render:(r)=>r.code}, {header:'Kasus', className:'text-center font-bold text-slate-600', render:(r)=>r.count}, {header:'Defisit', className:'text-right font-black text-orange-600', render:(r)=>formatRp(r.totalSelisih)}]} onRowClick={r => openDrilldown(`Defisit iDRG: ${r.code}`, row => String(row.IDRG_DRG_CODE).trim() === r.code && (parseFloat(row.IDRG_TOTAL_TARIF)||0) - (parseFloat(row.TOTAL_TARIF)||0) < 0)} />
            </Card>
          </div>
        </div>
      </div>
    );
  };
"""
with open('src/App.jsx', 'a', encoding='utf-8') as f:
    f.write(D)
print("Part D written:", len(D), "chars")
