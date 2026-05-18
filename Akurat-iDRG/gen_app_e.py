#!/usr/bin/env python3
E = """
  const renderReport = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader icon={Table2} title="Laporan Tabel Klaim" desc="Rekapitulasi komprehensif jumlah kasus dan nominal klaim INA-CBG vs iDRG per bulan layanan." colorClass="bg-sky-50 text-sky-600" highlightClass="bg-sky-500/5" exportAction={() => exportToCSV('Laporan', ['Bulan', 'Tarif RS', 'Kasus Rajal (INA)', 'Kasus Ranap (INA)', 'Total Kasus (INA)', 'Tarif Rajal (INA)', 'Tarif Ranap (INA)', 'Total Tarif (INA)', 'Kasus Rajal (iDRG)', 'Kasus Ranap (iDRG)', 'Total Kasus (iDRG)', 'Tarif Rajal (iDRG)', 'Tarif Ranap (iDRG)', 'Total Tarif (iDRG)'], dashData.reportArray.map(m => [m.label, m.tarifRsTotal, m.kasusRajal, m.kasusRanap, m.kasusRajal+m.kasusRanap, m.inaRajal, m.inaRanap, m.inaRajal+m.inaRanap, m.kasusRajal, m.kasusRanap, m.kasusRajal+m.kasusRanap, m.idrgRajal, m.idrgRanap, m.idrgRajal+m.idrgRanap]))} exportText="Ekspor CSV Klaim"/>
        <Card className="overflow-x-auto p-2 custom-scrollbar max-h-[600px]">
          <table className="w-full text-xs text-center border-collapse whitespace-nowrap">
            <thead className="text-[10px] uppercase font-bold tracking-wider sticky top-0 z-10">
              <tr>
                <th rowSpan={3} className="bg-slate-50 text-slate-500 border-b border-r border-slate-200 p-3">NO</th><th rowSpan={3} className="bg-slate-50 text-slate-500 border-b border-r border-slate-200 p-3">BULAN LAYANAN</th><th rowSpan={3} className="bg-slate-50 text-slate-500 border-b border-r border-slate-200 p-3">Tarif RS (Cost)</th>
                <th colSpan={6} className="bg-sky-50 text-sky-700 border-b border-r border-sky-100 p-3">Klaim INA CBG</th><th colSpan={6} className="bg-orange-50 text-orange-700 border-b border-orange-100 p-3">Klaim iDRG</th>
              </tr>
              <tr>
                <th colSpan={3} className="bg-sky-100/50 text-sky-600 border-b border-r border-sky-100 p-2">KASUS</th><th colSpan={3} className="bg-sky-100/50 text-sky-600 border-b border-r border-sky-100 p-2">Penerimaan INACBG (Rp)</th>
                <th colSpan={3} className="bg-orange-100/50 text-orange-600 border-b border-r border-orange-100 p-2">JUMLAH KASUS iDRG</th><th colSpan={3} className="bg-orange-100/50 text-orange-600 border-b border-orange-100 p-2">TOTAL KLAIM iDRG (Rp)</th>
              </tr>
              <tr>
                <th className="bg-sky-50/50 text-sky-500 border-b border-r border-sky-100 p-2">RJ</th><th className="bg-sky-50/50 text-sky-500 border-b border-r border-sky-100 p-2">RI</th><th className="bg-sky-100/80 text-sky-700 border-b border-r border-sky-100 p-2">TOT</th>
                <th className="bg-sky-50/50 text-sky-500 border-b border-r border-sky-100 p-2">RJ</th><th className="bg-sky-50/50 text-sky-500 border-b border-r border-sky-100 p-2">RI</th><th className="bg-sky-100/80 text-sky-700 border-b border-r border-sky-100 p-2">TOT</th>
                <th className="bg-orange-50/50 text-orange-500 border-b border-r border-orange-100 p-2">RJ</th><th className="bg-orange-50/50 text-orange-500 border-b border-r border-orange-100 p-2">RI</th><th className="bg-orange-100/80 text-orange-700 border-b border-r border-orange-100 p-2">TOT</th>
                <th className="bg-orange-50/50 text-orange-500 border-b border-r border-orange-100 p-2">RJ</th><th className="bg-orange-50/50 text-orange-500 border-b border-r border-orange-100 p-2">RI</th><th className="bg-orange-100/80 text-orange-700 border-b border-orange-100 p-2">TOT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {dashData.reportArray.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="border-r border-slate-100 p-3 font-semibold text-slate-400">{i + 1}</td>
                  <td className="border-r border-slate-100 p-3 font-bold text-slate-700">{row.label}</td>
                  <td className="border-r border-slate-100 p-3 text-right font-semibold text-slate-600">{formatRpEx(row.tarifRsTotal)}</td>
                  
                  <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-sky-50/10">{row.kasusRajal.toLocaleString()}</td>
                  <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-sky-50/10">{row.kasusRanap.toLocaleString()}</td>
                  <td className="border-r border-sky-50 p-3 text-right font-black text-sky-600 bg-sky-50/40">{(row.kasusRajal + row.kasusRanap).toLocaleString()}</td>
                  <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-sky-50/10">{formatRpEx(row.inaRajal)}</td>
                  <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-sky-50/10">{formatRpEx(row.inaRanap)}</td>
                  <td className="border-r border-sky-100 p-3 text-right font-black text-sky-600 bg-sky-50/40">{formatRpEx(row.inaRajal + row.inaRanap)}</td>

                  <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-orange-50/10">{row.kasusRajal.toLocaleString()}</td>
                  <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-orange-50/10">{row.kasusRanap.toLocaleString()}</td>
                  <td className="border-r border-orange-50 p-3 text-right font-black text-orange-600 bg-orange-50/40">{(row.kasusRajal + row.kasusRanap).toLocaleString()}</td>
                  <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-orange-50/10">{formatRpEx(row.idrgRajal)}</td>
                  <td className="border-r border-slate-50 p-3 text-right text-slate-600 bg-orange-50/10">{formatRpEx(row.idrgRanap)}</td>
                  <td className="p-3 text-right font-black text-orange-600 bg-orange-50/40">{formatRpEx(row.idrgRajal + row.idrgRanap)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800 text-white font-bold text-sm">
                <td colSpan={2} className="p-4 text-center uppercase tracking-widest text-[10px]">Total</td>
                <td className="p-4 text-right">{formatRpEx(dashData.reportArray.reduce((s,i)=>s+i.tarifRsTotal,0))}</td>
                <td className="p-4 text-right bg-sky-900/40">{dashData.reportArray.reduce((s,i)=>s+i.kasusRajal,0).toLocaleString()}</td>
                <td className="p-4 text-right bg-sky-900/40">{dashData.reportArray.reduce((s,i)=>s+i.kasusRanap,0).toLocaleString()}</td>
                <td className="p-4 text-right text-sky-300 bg-sky-900/80">{dashData.reportArray.reduce((s,i)=>s+i.kasusRajal+i.kasusRanap,0).toLocaleString()}</td>
                <td className="p-4 text-right bg-sky-900/40">{formatRpEx(dashData.reportArray.reduce((s,i)=>s+i.inaRajal,0))}</td>
                <td className="p-4 text-right bg-sky-900/40">{formatRpEx(dashData.reportArray.reduce((s,i)=>s+i.inaRanap,0))}</td>
                <td className="p-4 text-right text-sky-300 bg-sky-900/80">{formatRpEx(dashData.reportArray.reduce((s,i)=>s+i.inaRajal+i.inaRanap,0))}</td>
                <td className="p-4 text-right bg-orange-900/40">{dashData.reportArray.reduce((s,i)=>s+i.kasusRajal,0).toLocaleString()}</td>
                <td className="p-4 text-right bg-orange-900/40">{dashData.reportArray.reduce((s,i)=>s+i.kasusRanap,0).toLocaleString()}</td>
                <td className="p-4 text-right text-orange-300 bg-orange-900/80">{dashData.reportArray.reduce((s,i)=>s+i.kasusRajal+i.kasusRanap,0).toLocaleString()}</td>
                <td className="p-4 text-right bg-orange-900/40">{formatRpEx(dashData.reportArray.reduce((s,i)=>s+i.idrgRajal,0))}</td>
                <td className="p-4 text-right bg-orange-900/40">{formatRpEx(dashData.reportArray.reduce((s,i)=>s+i.idrgRanap,0))}</td>
                <td className="p-4 text-right text-orange-300 bg-orange-900/80">{formatRpEx(dashData.reportArray.reduce((s,i)=>s+i.idrgRajal+i.idrgRanap,0))}</td>
              </tr>
            </tfoot>
          </table>
        </Card>
      </div>
  );

  const renderRekap = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <SectionHeader icon={Layers} title="Rekap Kasus & Tarif" desc="Data Rekapitulasi penuh 100% INA-CBG dan iDRG beserta selisih per kode base." colorClass="bg-orange-50 text-orange-500" highlightClass="bg-orange-500/5" />
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="flex flex-col">
              <div className="p-5 border-b border-sky-100 flex items-center justify-between bg-sky-50/50"><h3 className="font-extrabold text-sky-800">Tabel Rekap INA-CBG</h3><button onClick={() => exportToCSV('Data_Rekap_INA', ['Kode', 'Deskripsi', 'Kasus', 'Tarif RS', 'Tarif INA', 'Selisih'], dashData.inaSummary.map(r=>[r.code, r.desc, r.count, r.sumRS, r.sumIna, r.totalSelisih]))} className="text-xs bg-white text-sky-600 border border-sky-200 px-3 py-1.5 rounded-lg shadow-sm font-bold">CSV</button></div>
              <MiniTable maxHeight="600px" data={dashData.inaSummary} columns={[{header:'Kode', className:'font-bold text-sky-700', render:r=>r.code},{header:'Deskripsi', className:'text-slate-500 max-w-[200px] truncate', render:r=>r.desc},{header:'Kasus', className:'text-center font-bold text-slate-700 bg-slate-50', render:r=>r.count.toLocaleString()},{header:'Selisih', className:'text-right font-black', render:r=><span className={r.totalSelisih>0?'text-lime-600':r.totalSelisih<0?'text-orange-500':'text-slate-400'}>{formatRp(r.totalSelisih)}</span>}]} onRowClick={r => openDrilldown(`Rekap INA-CBG: ${r.code}`, row => String(row.INACBG).trim() === r.code)} />
            </Card>
            <Card className="flex flex-col">
              <div className="p-5 border-b border-orange-100 flex items-center justify-between bg-orange-50/50"><h3 className="font-extrabold text-orange-800">Tabel Rekap iDRG</h3><button onClick={() => exportToCSV('Data_Rekap_iDRG', ['Kode', 'Deskripsi', 'Kasus', 'Tarif RS', 'Tarif iDRG', 'Selisih'], dashData.drgSummary.map(r=>[r.code, r.desc, r.count, r.sumRS, r.sumIdrg, r.totalSelisih]))} className="text-xs bg-white text-orange-600 border border-orange-200 px-3 py-1.5 rounded-lg shadow-sm font-bold">CSV</button></div>
              <MiniTable maxHeight="600px" data={dashData.drgSummary} columns={[{header:'Kode', className:'font-bold text-orange-700', render:r=>r.code},{header:'Deskripsi', className:'text-slate-500 max-w-[200px] truncate', render:r=>r.desc},{header:'Kasus', className:'text-center font-bold text-slate-700 bg-slate-50', render:r=>r.count.toLocaleString()},{header:'Selisih', className:'text-right font-black', render:r=><span className={r.totalSelisih>0?'text-lime-600':r.totalSelisih<0?'text-orange-500':'text-slate-400'}>{formatRp(r.totalSelisih)}</span>}]} onRowClick={r => openDrilldown(`Rekap iDRG: ${r.code}`, row => String(row.IDRG_DRG_CODE).trim() === r.code)} />
            </Card>
         </div>
      </div>
  );

  const renderDpjp = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader icon={User} title="Analisis Performa DPJP" desc="Laporan performa dokter, jumlah kasus, selisih tarif finansial, dan Rincian Komponen." colorClass="bg-sky-50 text-sky-600" highlightClass="bg-sky-500/5" exportAction={() => exportToCSV('Data_DPJP', ['Nama DPJP', 'Jumlah Kasus', 'Tarif RS', 'Tarif INA', 'Tarif iDRG', 'Selisih INA-RS', 'Selisih iDRG-RS', 'Selisih iDRG-INA', ...compKeys.map(c=>c.label)], dashData.dpjpSummaryArray.map(r => [r.name, r.count, r.sumRS, r.sumIna, r.sumIdrg, r.sumIna-r.sumRS, r.sumIdrg-r.sumRS, r.sumIdrg-r.sumIna, ...compKeys.map(c=>r.comps[c.key])]))} exportText="Ekspor CSV DPJP"/>
        <Card className="overflow-hidden flex flex-col">
          <div className="overflow-x-auto custom-scrollbar max-h-[600px]">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-500 sticky top-0 z-20">
                <tr>
                  <th rowSpan={2} className="p-4 border-r border-slate-200 align-middle">Nama DPJP</th><th rowSpan={2} className="p-4 border-r border-slate-200 text-center align-middle">Kasus</th><th rowSpan={2} className="p-4 border-r border-slate-200 text-right align-middle">Tarif RS</th>
                  <th rowSpan={2} className="p-4 bg-sky-50/80 text-sky-700 border-r border-sky-100 text-right align-middle">Tarif INA</th><th rowSpan={2} className="p-4 bg-orange-50/80 text-orange-700 border-r border-orange-100 text-right align-middle">Tarif iDRG</th><th rowSpan={2} className="p-4 bg-lime-50/80 text-green-700 border-r border-lime-100 text-right align-middle">Selisih iDRG-INA</th>
                  <th colSpan={18} className="p-3 bg-slate-800 text-white border-b border-slate-700 text-center tracking-[0.2em]">18 Komponen Billing (Rp)</th>
                </tr>
                <tr className="bg-slate-700 text-slate-300 text-[10px]">{compKeys.map(c => <th key={c.key} className="p-2.5 border-b border-r border-slate-600 text-right">{c.label}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {dashData.dpjpSummaryArray.map((row, i) => {
                  const sIna = row.sumIdrg - row.sumIna;
                  return (
                    <tr key={i} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => openDrilldown(`Analisis DPJP: ${row.name}`, r => normDpjp(r.DPJP) === row.normName)}>
                      <td className="p-4 font-extrabold text-slate-800 border-r border-slate-50 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10">{row.name}</td>
                      <td className="p-4 text-center font-black text-slate-600 border-r border-slate-50 bg-slate-50/50">{row.count.toLocaleString()}</td>
                      <td className="p-4 text-right font-bold text-slate-600 border-r border-slate-50">{formatRp(row.sumRS)}</td>
                      <td className="p-4 text-right font-black text-sky-600 border-r border-slate-50 bg-sky-50/20">{formatRp(row.sumIna)}</td>
                      <td className="p-4 text-right font-black text-orange-600 border-r border-slate-50 bg-orange-50/20">{formatRp(row.sumIdrg)}</td>
                      <td className={`p-4 text-right font-black border-r border-slate-50 bg-lime-50/10 ${sIna>0?'text-emerald-600':sIna<0?'text-orange-500':'text-slate-400'}`}>{formatRp(sIna)}</td>
                      {compKeys.map(c => <td key={c.key} className="p-4 text-right text-[11px] font-medium text-slate-500 border-r border-slate-50">{formatRpEx(row.comps[c.key])}</td>)}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
  );

  const renderPemetaan = () => {
    const inaKeys = Object.keys(dashData.inaToIdrgMap).sort();
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
        <SectionHeader icon={GitMerge} title="Pemetaan INA-CBG ke iDRG" desc="Melihat distribusi kode dasar INA-CBG terhadap variasi *Complexity Level* iDRG beserta pemicu Diagnosa Sekundernya." colorClass="bg-sky-50 text-sky-600" highlightClass="bg-sky-500/5" exportAction={()=>exportToCSV('Pemetaan', ['Kode INA', 'Deskripsi INA', 'iDRG Terpetakan', 'Jumlah Kasus', 'Diagnosa Sekunder Penyerta'], inaKeys.flatMap(ina => Object.entries(dashData.inaToIdrgMap[ina].targets).map(([idrg, data]) => [ina, dashData.inaToIdrgMap[ina].desc, idrg, data.count, Object.entries(data.secDiags).sort((a,b)=>b[1]-a[1]).map(d=>`${d[0]}(${d[1]})`).join(', ')])))} />
        <Card>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-500"><tr><th className="p-5 w-1/3 border-r border-slate-200">Kode INA-CBG Asal</th><th className="p-5">Distribusi Pemetaan iDRG & Diagnosa Sekunder</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {inaKeys.slice(0, 100).map((ina, idx) => (
                <tr key={`map-${idx}`} className="hover:bg-slate-50 cursor-pointer transition-colors group" onClick={() => openDrilldown(`Pemetaan Kasus INA-CBG: ${ina}`, r => String(r.INACBG).trim() === ina)}>
                  <td className="p-5 align-top border-r border-slate-50"><span className="font-black text-sky-600 block text-base">{String(ina)}</span><span className="text-xs font-medium text-slate-500 mt-1 block leading-relaxed">{String(dashData.inaToIdrgMap[ina].desc)}</span></td>
                  <td className="p-5">
                    <div className="flex flex-col gap-3">
                      {Object.entries(dashData.inaToIdrgMap[ina].targets).sort((a,b)=>b[1].count-a[1].count).map(([idrg, data], j) => (
                        <div key={`idrg-${j}`} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:border-sky-300">
                           <div className="flex flex-wrap items-center gap-2 mb-2"><span className="bg-orange-500 text-white px-2.5 py-1 rounded-lg text-xs font-black shadow-sm">{idrg.split(' ')[0]}</span><span className="text-xs font-bold text-slate-700 flex-1">{idrg.substring(idrg.indexOf(' ') + 1)}</span><span className="text-[10px] font-black uppercase text-sky-700 bg-sky-100 px-2 py-1 rounded-md">{data.count} Kasus</span></div>
                           <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2"><p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Stethoscope size={10}/> Diagnosa Sekunder Penyerta</p><div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">{Object.entries(data.secDiags).length === 0 ? <span className="text-[10px] text-slate-400 italic">Tanpa diag sekunder</span> : Object.entries(data.secDiags).sort((a,b)=>b[1]-a[1]).map((sd, k) => (<span key={`sd-${k}`} className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm hover:bg-slate-100">{sd[0]} <span className="text-slate-400 font-semibold ml-0.5">({sd[1]})</span></span>))}</div></div>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  };
"""
with open('src/App.jsx', 'a', encoding='utf-8') as f:
    f.write(E)
print("Part E written:", len(E), "chars")
