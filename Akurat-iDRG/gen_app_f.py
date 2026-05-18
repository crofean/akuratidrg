#!/usr/bin/env python3
F = """
  const renderKetepatan = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader icon={FileCode} title="Akurasi & Ketepatan Koding" desc="Evaluasi discrepancy antara koding INA-CBG dan iDRG menggunakan Fuzzy Logic Match." colorClass="bg-emerald-50 text-emerald-600" highlightClass="bg-emerald-500/5" exportAction={() => exportToCSV('Data_Ketidaksesuaian_Koding', ['MRN', 'SEP', 'Diag INA', 'Diag iDRG', 'Proc INA', 'Proc iDRG'], dashData.scorecard.discrepancies.map(d => [d.mrn, d.sep, d.diag1.join(", "), d.diag2.join(", "), d.proc1.join(", "), d.proc2.join(", ")]))} exportText="Ekspor Kasus Discrepancy" />
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
              <thead className="bg-white border-b border-slate-200 text-[10px] uppercase font-extrabold tracking-wider text-slate-400 sticky top-0 z-10"><tr><th className="p-4 border-r border-slate-100 w-48">Pasien (MRN / SEP)</th><th className="p-4 border-r border-slate-100 w-[35%]">Komparasi Diagnosa</th><th className="p-4 w-[35%]">Komparasi Prosedur</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {dashData.scorecard.discrepancies.slice(0,100).map((d, i) => (
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
                             <div className="flex flex-wrap gap-1.5">{d.diag1.map((c, idx)=><span key={`d1-${i}-${idx}`} className={`px-2 py-1 rounded-md text-xs font-bold ${!d.diag2.includes(c)?'bg-orange-100 text-orange-700 border border-orange-200':'bg-white border border-slate-200 text-slate-600'}`}>{String(c)}</span>)}</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                             <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Terinput di iDRG:</span>
                             <div className="flex flex-wrap gap-1.5">{d.diag2.map((c, idx)=><span key={`d2-${i}-${idx}`} className={`px-2 py-1 rounded-md text-xs font-bold ${!d.diag1.includes(c)?'bg-orange-100 text-orange-700 border border-orange-200':'bg-white border border-slate-200 text-slate-600'}`}>{String(c)}</span>)}</div>
                          </div>
                        </div>
                      ) : <div className="h-full w-full flex items-center justify-center p-4 bg-lime-50/50 rounded-xl border border-lime-100"><span className="text-green-600 font-extrabold flex items-center gap-2"><CheckCircle size={18}/> Sangat Sesuai (100%)</span></div>}
                    </td>
                    <td className="p-4 align-top">
                      {d.scoreProc < 100 ? (
                        <div className="space-y-4">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                             <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Terinput di INA-CBG:</span>
                             <div className="flex flex-wrap gap-1.5">{d.proc1.map((c, idx)=><span key={`p1-${i}-${idx}`} className={`px-2 py-1 rounded-md text-xs font-bold ${!d.proc2.includes(c)?'bg-orange-100 text-orange-700 border border-orange-200':'bg-white border border-slate-200 text-slate-600'}`}>{String(c)}</span>)}</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                             <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Terinput di iDRG:</span>
                             <div className="flex flex-wrap gap-1.5">{d.proc2.map((c, idx)=><span key={`p2-${i}-${idx}`} className={`px-2 py-1 rounded-md text-xs font-bold ${!d.proc1.includes(c)?'bg-orange-100 text-orange-700 border border-orange-200':'bg-white border border-slate-200 text-slate-600'}`}>{String(c)}</span>)}</div>
                          </div>
                        </div>
                      ) : <div className="h-full w-full flex items-center justify-center p-4 bg-lime-50/50 rounded-xl border border-lime-100"><span className="text-green-600 font-extrabold flex items-center gap-2"><CheckCircle size={18}/> Sangat Sesuai (100%)</span></div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
  );
  
  const renderAudit = () => {
    const filtered = dashData.auditFindings.filter(f => auditFilter === '' ? true : f.case === auditFilter);
    const grouped = filtered.reduce((acc, curr) => { if(!acc[curr.ruleId]) acc[curr.ruleId] = { ruleId: curr.ruleId, case: curr.case, warning: curr.warning, items: [] }; acc[curr.ruleId].items.push(curr); return acc; }, {});
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader icon={CheckSquare} title="Audit Aturan Koding" desc="Sistem mengevaluasi otomatis episode terhadap kaidah standar INA-CBG/BPJS." colorClass="bg-orange-50 text-orange-600" highlightClass="bg-orange-500/5" exportAction={() => exportToCSV('Data_Temuan_Audit', ['Rule ID', 'Kasus', 'Warning', 'MRN', 'SEP', 'Kode Trigger'], filtered.map(f => [f.ruleId, f.case, f.warning, f.mrn, f.sep, f.codes]))} />
        <div className="flex items-center gap-4 bg-white border border-orange-100 p-5 rounded-2xl shadow-sm"><div className="bg-orange-50 p-3 rounded-xl"><AlertTriangle size={24} className="text-orange-600"/></div><div className="flex-1"><h3 className="font-extrabold text-slate-800 text-base">Filter Anomali:</h3><select value={auditFilter} onChange={(e) => setAuditFilter(e.target.value)} className="mt-2 w-full p-2 border border-slate-200 rounded text-sm font-bold text-slate-700 bg-slate-50"><option value="">-- Semua Pelanggaran ({filtered.length} Kasus) --</option>{DEFAULT_AUDIT_RULES.map(r => <option key={r.id} value={r.case}>{r.id} - {r.case}</option>)}</select></div></div>
        <div className="space-y-5">
          {Object.values(grouped).map((g, i) => (
            <Card key={`group-${i}`} className="group">
              <div className="p-6 bg-gradient-to-r from-orange-50/50 to-transparent border-b border-orange-100 flex justify-between items-start">
                <div><span className="text-[10px] font-black bg-orange-600 text-white px-2.5 py-1 rounded-md uppercase tracking-widest">{String(g.ruleId)}</span><h3 className="text-lg font-black text-slate-800 mt-3">{String(g.case)}</h3><p className="text-sm text-orange-700 font-semibold mt-2 flex items-start gap-2"><Zap size={16}/> {String(g.warning)}</p></div>
                <div className="text-right bg-white border border-slate-100 rounded-xl px-5 py-3 shadow-sm min-w-[120px]"><span className="text-3xl font-black text-orange-600">{g.items.length}</span><p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Kasus Terdampak</p></div>
              </div>
              <div className="max-h-72 overflow-y-auto custom-scrollbar"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-[10px] uppercase font-extrabold tracking-wider text-slate-400 sticky top-0"><tr><th className="px-6 py-3 w-40">MRN</th><th className="px-6 py-3 w-56">SEP</th><th className="px-6 py-3">Kode Terekam</th></tr></thead><tbody className="divide-y divide-slate-100">{g.items.map((item, idx) => (<tr key={`item-${idx}`} className="hover:bg-orange-50/30"><td className="px-6 py-3 font-bold text-slate-800">{String(item.mrn)}</td><td className="px-6 py-3 font-mono text-xs font-semibold text-slate-500">{String(item.sep)}</td><td className="px-6 py-3 text-orange-600 font-bold">{String(item.codes)}</td></tr>))}</tbody></table></div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderKpiCoder = () => {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
        <SectionHeader icon={Award} title="KPI Kinerja Coder" desc="Laporan evaluasi performa Coder berdasarkan Volume, tingkat Discrepancy, dan temuan Audit Rules BPJS." colorClass="bg-sky-50 text-sky-600" highlightClass="bg-sky-500/5" exportAction={() => exportToCSV('KPI', ['Coder ID', 'Volume', 'Discrepancy', 'AuditHits'], dashData.kpiCoderArray.map(d=>[d.id, d.cases, d.discrepancyCount, d.auditHits]))}/>
        <Card>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-center whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-extrabold tracking-wider text-slate-500 sticky top-0 z-20">
                <tr><th rowSpan={2} className="p-4 border-r border-slate-200">No</th><th rowSpan={2} className="p-4 border-r border-slate-200">ID Coder</th><th rowSpan={2} className="p-4 border-r border-slate-200">Volume Kasus</th><th colSpan={2} className="p-3 border-r border-b border-slate-200 bg-orange-50/50 text-orange-700">Discrepancy (Akurasi)</th><th colSpan={2} className="p-3 border-b border-slate-200 bg-rose-50/50 text-rose-700">Temuan Audit Koding</th></tr>
                <tr className="bg-white text-[10px]"><th className="p-3 border-r border-slate-200 text-slate-500 bg-orange-50/20">Jml Tidak Sesuai</th><th className="p-3 border-r border-slate-200 text-orange-700 bg-orange-50">Error Rate (%)</th><th className="p-3 border-r border-slate-200 text-slate-500 bg-rose-50/20">Jml Temuan Audit</th><th className="p-3 text-rose-700 bg-rose-50">Error Rate (%)</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashData.kpiCoderArray.length === 0 ? <tr><td colSpan="7" className="p-12 text-slate-400 font-medium bg-slate-50/50">Tidak ada data coder.</td></tr> : dashData.kpiCoderArray.map((item, idx) => {
                    const discRate = item.cases > 0 ? (item.discrepancyCount / item.cases) * 100 : 0; const auditRate = item.cases > 0 ? (item.auditHits / item.cases) * 100 : 0;
                    return (
                      <tr key={`coder-${idx}`} className="hover:bg-sky-50/30">
                        <td className="p-4 text-slate-400 font-bold border-r border-slate-50">{idx + 1}</td><td className="p-4 border-r border-slate-50 font-black text-sky-700">{item.id}</td><td className="p-4 font-bold text-slate-600 border-r border-slate-50 bg-slate-50/50">{item.cases.toLocaleString()}</td>
                        <td className="p-4 font-bold text-slate-600 border-r border-slate-50">{item.discrepancyCount.toLocaleString()}</td><td className={`p-4 font-black border-r border-slate-50 ${discRate > 10 ? 'text-rose-600 bg-rose-50/30' : discRate > 5 ? 'text-orange-500 bg-orange-50/30' : 'text-lime-600 bg-lime-50/30'}`}>{formatPct(discRate)}%</td>
                        <td className="p-4 font-bold text-slate-600 border-r border-slate-50">{item.auditHits.toLocaleString()}</td><td className={`p-4 font-black ${auditRate > 10 ? 'text-rose-600 bg-rose-50/30' : auditRate > 5 ? 'text-orange-500 bg-orange-50/30' : 'text-lime-600 bg-lime-50/30'}`}>{formatPct(auditRate)}%</td>
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

  const renderNaikKelas = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader icon={BarChart3} title="Transisi Hak Kelas Rawat" desc="Analisis perpindahan hak kelas awal pasien menuju kelas target (Naik Kelas), beserta besaran penerimaan selisih biayanya." colorClass="bg-lime-50 text-green-600" highlightClass="bg-emerald-500/5" exportAction={() => exportToCSV('NaikKelas', ['Transisi Awal', 'Akhir', 'Kasus', 'Nilai'], dashData.naikKelasStats.map(n => [n.awal, n.akhir, n.count, n.totalNilai]))}/>
        <Card>
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/30"><h3 className="font-extrabold text-emerald-800">Total: {formatRp(dashData.totalNilaiNaikKelas)} dari {dashData.totalKasusNaikKelas} Kasus</h3></div>
          <MiniTable data={dashData.naikKelasStats} columns={[{header:'No', className:'text-center w-8 font-bold text-slate-400', render:(r,i)=>i+1},{header:'Transisi Kelas', render:r=><span className="font-bold">{r.awal} <ChevronRight className="inline mx-1 text-slate-300" size={14}/> {r.akhir}</span>},{header:'Penjamin', className:'font-bold text-sky-600', render:r=>r.pembayar},{header:'Total Kasus', className:'text-center font-black', render:r=>r.count},{header:'Total Selisih Dibayar', className:'text-right font-black text-emerald-600 bg-emerald-50/30', render:r=>formatRp(r.totalNilai)}]} onRowClick={item => openDrilldown(`Naik Kelas: ${item.awal} ke ${item.akhir}`, r => { const m = String(r['C2'] || '').match(/"selisih_biaya":\\s*\\{\\s*"nilai":\\s*"(\\d+)"\\s*,\\s*"pembayar":\\s*"([^"]+)"\\s*,\\s*"naik_kelas":\\s*"([^"]+)"/); return m && parseFloat(m[1]) > 0 && String(r['KELAS_RAWAT'] || r['KELAS'] || r['HAK_KELAS'] || '').trim() === item.awalRaw && String(m[3]).toUpperCase() === item.akhir; })} />
        </Card>
      </div>
  );

  const renderICU = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader icon={ActivitySquare} title="Analisis ICU & Ventilator" desc="Sebaran proporsi *Severity Level* khusus episode pasien rawat intensif (ICU) & deteksi anomali koding jam Ventilator." colorClass="bg-orange-50 text-orange-600" highlightClass="bg-orange-500/5" exportAction={() => exportToCSV('ICU_Anomali', ['MRN', 'SEP', 'Vent Hour', 'Isu'], dashData.icuStats.anomalies.map(a => [a.mrn, a.sep, a.ventHour, a.issue]))} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[ {s:1, c:dashData.icuStats.sev1, bg:'bg-slate-300', t:'Ringan'}, {s:2, c:dashData.icuStats.sev2, bg:'bg-orange-400', t:'Sedang'}, {s:3, c:dashData.icuStats.sev3, bg:'bg-rose-500', t:'Berat'} ].map(x => (
              <Card key={x.s} className="relative overflow-hidden group"><div className={`absolute top-0 left-0 w-full h-1.5 ${x.bg}`}></div><div className="p-8 flex flex-col items-center justify-center text-center"><p className="text-slate-400 font-extrabold uppercase text-[10px] mb-2">Severity Level {x.s}</p><h2 className="text-5xl font-black text-slate-700">{x.c.toLocaleString()}</h2><p className="text-sm font-semibold text-slate-500 mt-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Kasus {x.t}</p></div></Card>
            ))}
        </div>
        <Card>
          <div className="p-5 border-b border-rose-100 flex items-center gap-3 bg-rose-50/50"><div className="p-2 bg-rose-100 rounded-xl text-rose-700"><AlertTriangle size={18}/></div><div><h3 className="font-extrabold text-slate-800 tracking-tight">Anomali Koding Jam Ventilator ({dashData.icuStats.anomalies.length} Kasus)</h3></div></div>
          <MiniTable data={dashData.icuStats.anomalies} columns={[{header:'MRN', className:'font-black text-slate-700 w-32', render:r=>r.mrn},{header:'SEP', className:'font-mono text-xs font-semibold text-slate-500 w-48', render:r=>r.sep},{header:'SL INA', className:'text-center font-black bg-slate-50 w-20', render:r=>r.severity},{header:'Actual Vent Hour', className:'text-center font-black text-rose-600 bg-rose-50/30 w-36', render:r=>`${r.ventHour} Jam`},{header:'Isu Deteksi', className:'font-bold text-xs text-rose-700', render:r=>r.issue}]} />
        </Card>
      </div>
  );

  const renderSlClAnalysis = () => {
    const data = dashData.slClShiftArray;
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
        <SectionHeader icon={Layers} title="Analisis Pergeseran SL & CL" desc="Peta sebaran transisi dari *Severity Level* INA-CBG (SL) menuju *Complexity Level* iDRG (CL). <br/> <strong className='text-sky-600'>Klik baris *Card* di bawah untuk melihat rincian pasien!</strong>" colorClass="bg-sky-50 text-sky-600" highlightClass="bg-blue-500/5" exportAction={()=>exportToCSV('SL_CL', ['Tipe'], data.map(d=>[`SL ${d.sev} ke CL ${d.cl}`]))}/>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {data.length === 0 ? <Card className="col-span-full p-12 text-center"><p className="text-slate-500 font-semibold">Belum ada data pergeseran SL/CL yang terekam pada rawat inap (PTD 1).</p></Card> : 
             data.map((item, idx) => {
               let tagColor = "bg-slate-100 text-slate-600", tagText = "Normal";
               if (item.sev === 3 && item.cl <= 1) { tagColor = "bg-orange-100 text-orange-700"; tagText = "Defisit Signifikan"; }
               else if (item.sev === 2 && item.cl === 0) { tagColor = "bg-orange-50 text-orange-600"; tagText = "Defisit Ringan"; }
               else if (item.cl > item.sev) { tagColor = "bg-lime-100 text-green-700"; tagText = "Surplus iDRG"; }
               return (
                 <Card key={`slcl-${idx}`} className="flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer">
                   <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50" onClick={() => openDrilldown(`Pergeseran SL ${item.sev} ke CL ${item.cl}`, r => { let s=0; if (String(r['INACBG']||'').endsWith('-I')) s=1; else if (String(r['INACBG']||'').endsWith('-II')) s=2; else if (String(r['INACBG']||'').endsWith('-III')) s=3; return s === item.sev && parseInt(String(r['IDRG_DRG_CODE']||'').slice(-1)) === item.cl; })}>
                      <div className="flex items-center gap-3"><div className="bg-sky-100 text-sky-700 font-black text-lg w-10 h-10 rounded-xl flex items-center justify-center shadow-sm">S{item.sev}</div><ChevronRight className="text-slate-300 shrink-0"/><div className="bg-orange-100 text-orange-700 font-black text-lg w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-col">C{item.cl}</div><span className="text-xs font-extrabold text-orange-800 ml-1 opacity-80">{getCLName(item.cl)}</span></div>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border border-white/50 ${tagColor}`}>{tagText}</span>
                   </div>
                   <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-end gap-2 mb-4"><h4 className="text-4xl font-black text-slate-800 tracking-tight">{item.count.toLocaleString()}</h4><span className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-widest">Kasus</span></div>
                      <div className="space-y-2 mb-6 bg-slate-50 rounded-xl p-3 border border-slate-100/60">
                         <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Total INA:</span><span className="text-sky-600">{formatRp(item.sumIna)}</span></div>
                         <div className="flex justify-between text-xs font-semibold"><span className="text-slate-500">Total iDRG:</span><span className="text-orange-600">{formatRp(item.sumIdrg)}</span></div>
                         <div className="pt-2 mt-2 border-t border-slate-200/60 flex justify-between text-xs font-black"><span className="text-slate-600">Selisih:</span><span className={item.selisih>0 ? 'text-lime-600' : 'text-orange-600'}>{item.selisih>0 ? '+' : ''}{formatRp(item.selisih)}</span></div>
                      </div>
                      <div className="mt-auto border-t border-slate-100 pt-4">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Stethoscope size={12}/> Seluruh Diagnosa Sekunder</p>
                        <div className="max-h-[140px] overflow-y-auto custom-scrollbar pr-2 flex flex-wrap gap-2">
                           {item.topSecDiags.length === 0 ? <span className="text-[10px] text-slate-400 italic">Tanpa diag sekunder</span> : item.topSecDiags.map((d, i) => (<div key={`sd-${i}`} className="flex items-center gap-1.5 bg-slate-100/80 hover:bg-slate-200 border border-slate-200 rounded-md px-2 py-1 transition-colors"><span className="text-xs font-bold text-slate-700">{d[0]}</span><span className="text-[10px] font-semibold text-white bg-slate-500 rounded px-1.5">{d[1]}</span></div>))}
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
"""
with open('src/App.jsx', 'a', encoding='utf-8') as f:
    f.write(F)
print("Part F written:", len(F), "chars")
