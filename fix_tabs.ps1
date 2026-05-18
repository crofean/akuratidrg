import re

file_path = r'd:\SAK-iDRG\src\App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update TABS
old_tabs = "{ id: 'mapping', label: 'Peta iDRG', icon: GitMerge }, { id: 'sl_cl_analysis', label: 'Analisis SL/CL', icon: Layers }, { id: 'ksm', label: 'Kinerja KSM', icon: Users }, { id: 'dpjp', label: 'Kinerja DPJP', icon: User },"
new_tabs = "{ id: 'mapping', label: 'Peta iDRG', icon: GitMerge }, { id: 'sl_cl_analysis', label: 'Analisis SL/CL', icon: Layers }, { id: 'dept', label: 'Kinerja Departemen', icon: Building2 }, { id: 'ksm', label: 'Kinerja KSM', icon: Users }, { id: 'dpjp', label: 'Kinerja DPJP', icon: User },"
content = content.replace(old_tabs, new_tabs)

# 2. Update subTab switcher
old_subtab = "{subTab === 'sl_cl_analysis' && renderSlClAnalysis()} {subTab === 'ksm' && renderKsm()} {subTab === 'dpjp' && renderDpjp()} {subTab === 'kpi_coder' && renderKpiCoder()}"
new_subtab = "{subTab === 'sl_cl_analysis' && renderSlClAnalysis()} {subTab === 'dept' && renderDepartemen()} {subTab === 'ksm' && renderKsm()} {subTab === 'dpjp' && renderDpjp()} {subTab === 'kpi_coder' && renderKpiCoder()}"
content = content.replace(old_subtab, new_subtab)

# 3. Rename renderKsm to renderDepartemen and inject the new renderKsm
# We find const renderKsm = () => {
if 'const renderKsm = () => {' in content:
    # First, rename the existing one to renderDepartemen
    content = content.replace('const renderKsm = () => {', 'const renderDepartemen = () => {', 1)
    
    # Update SectionHeader inside renderDepartemen
    old_dept_header = 'title="Kinerja Departemen & KSM (Kelompok Staf Medis)" desc="Analisis efisiensi biaya per Departemen dan KSM."'
    new_dept_header = 'title="Kinerja Departemen" desc="Analisis efisiensi biaya hierarki Departemen ?? KSM ?? DPJP."'
    content = content.replace(old_dept_header, new_dept_header, 1)

new_render_ksm = '''  const renderKsm = () => {
    const ksmData = (dashData?.ksmEfficiencyTree || []).sort((a, b) => b.count - a.count);

    // Calculate Hospital Averages for Comparison
    const totalK = ksmData.reduce((s, d) => s + d.count, 0) || 1;
    const hSumRS = ksmData.reduce((s, d) => s + d.sumRS, 0);
    const hSumIna = ksmData.reduce((s, d) => s + d.sumIna, 0);
    const hSumIdrg = ksmData.reduce((s, d) => s + d.sumIdrg, 0);
    const hSumLos = ksmData.reduce((s, d) => s + d.sumLos, 0);
    const hMaxLos = Math.max(...ksmData.map(d => d.maxLos), 0);
    const hAvgRS = hSumRS / totalK;
    const hAvgLos = hSumLos / totalK;
    const hAvgSelIna = (hSumIna - hSumRS) / totalK;
    const hAvgSelIdrg = (hSumIdrg - hSumRS) / totalK;
    const hAvgIdrgIna = (hSumIdrg - hSumIna) / totalK;
    const hAvgComps = compKeys.reduce((acc, c) => {
      acc[c.key] = ksmData.reduce((s, d) => s + (d.comps?.[c.key] || 0), 0) / totalK;
      return acc;
    }, {});

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SectionHeader icon={Users} title="Kinerja KSM" desc="Analisis efisiensi biaya hierarki KSM ?? DPJP." colorClass="bg-indigo-50 text-indigo-600" highlightClass="bg-indigo-500/5" exportAction={() => {
          const csv = ksmData.map(s => [s.name, s.count, s.sumRS, s.sumIna, s.sumIdrg, s.selisihIna, s.selisihIdrg, s.sumIdrg - s.sumIna, ...compKeys.map(c => s.comps?.[c.key] || 0)]);
          exportToXlsx('Kinerja_KSM', ['Nama KSM', 'Jumlah Kasus', 'Total RS', 'Total INA', 'Total iDRG', 'Selisih INA-RS', 'Selisih iDRG-RS', 'Selisih iDRG-INA', ...compKeys.map(c => c.label)], csv);
        }} />

        {/* KSM BAR CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            { title: 'Top 10 KSM — Selisih INA-RS', data: [...ksmData].sort((a, b) => b.selisihIna - a.selisihIna).slice(0, 10), key: 'selisihIna', color: '#0ea5e9', negColor: '#f97316' },
            { title: 'Top 10 KSM — Selisih iDRG-RS', data: [...ksmData].sort((a, b) => b.selisihIdrg - a.selisihIdrg).slice(0, 10), key: 'selisihIdrg', color: '#8b5cf6', negColor: '#ef4444' },
          ].map((chart, ci) => {
            const maxVal = Math.max(...chart.data.map(d => Math.abs(d[chart.key])), 1);
            return (
              <Card key={ci} id={ksm-new-bar-} downloadTitle={chart.title} className="p-5">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-indigo-500" /> {chart.title}</h3>
                <div className="space-y-2">
                  {chart.data.map((s, si) => {
                    const val = s[chart.key]; const pct = (Math.abs(val) / maxVal) * 100;
                    return (
                      <div key={si} className="flex items-center gap-3 group cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded-lg transition-colors"
                        onClick={() => openDrilldown(Kasus KSM: , row => extractKsm(row['DPJP'] || '') === s.name)}>
                        <span className="text-xs font-bold text-slate-600 w-28 truncate shrink-0" title={s.name}>{s.name}</span>
                        <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden relative">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: ${Math.max(pct, 2)}%, backgroundColor: val >= 0 ? chart.color : chart.negColor }}></div>
                        </div>
                        <span className={	ext-xs font-black w-24 text-right shrink-0 }>{val > 0 ? '+' : ''}{formatRp(val)}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="overflow-hidden border border-slate-200 mt-6">
          <div className="overflow-x-auto max-h-[800px] custom-scrollbar">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-wider sticky top-0 z-40">
                <tr>
                  <th colSpan={6} className="px-4 py-3 bg-slate-900 text-white border-b border-slate-700">Ringkasan Finansial</th>
                  <th colSpan={18} className="px-4 py-3 bg-slate-800 text-white text-center border-b border-slate-700">Rincian 18 Komponen Biaya</th>
                </tr>
                <tr>
                  <th className="p-4 min-w-[280px] bg-slate-900 sticky left-0 z-50">Hierarki KSM / DPJP</th>
                  <th className="p-4 text-right bg-slate-900 w-20">Kasus</th>
                  <th className="p-4 text-center bg-teal-900 text-teal-300 w-20 text-[9px]">ALOS</th>
                  <th className="p-4 text-center bg-rose-900 text-rose-300 w-20 text-[9px]">MAX LOS</th>
                  <th className="p-4 text-right bg-slate-900 min-w-[120px]">Avg RS</th>
                  <th className="p-4 text-right bg-sky-900/50 min-w-[120px]">Sel. INA</th>
                  <th className="p-4 text-right bg-indigo-900/50 min-w-[120px]">Sel. iDRG</th>
                  <th className="p-4 text-right bg-purple-900/50 min-w-[120px]">iDRG vs INA</th>
                  {compKeys.map(c => <th key={c.key} className="p-4 text-right bg-slate-800 text-slate-400 min-w-[100px]">{c.label}</th>)}
                </tr>
                <tr className="bg-amber-50 font-black border-b-2 border-amber-200 shadow-sm">
                  <td className="p-4 bg-amber-50 sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-amber-500 text-white flex items-center justify-center"><Zap size={12} /></div>
                      <span className="text-amber-800 uppercase text-[10px] tracking-widest font-black whitespace-nowrap">RATA-RATA RS (Seluruh Kasus)</span>
                    </div>
                  </td>
                  <td className="p-4 text-right text-amber-700 text-xs font-black italic">AVG</td>
                  <td className="p-4 text-center text-amber-600 font-bold text-xs bg-amber-100/20">{hAvgLos.toFixed(1)}</td>
                  <td className="p-4 text-center text-rose-600 font-bold text-xs bg-rose-100/20">{hMaxLos}</td>
                  <td className="p-4 text-right text-amber-700 text-xs font-black">{formatRp(hAvgRS)}</td>
                  <td className={p-4 text-right font-black text-xs }>{formatRp(hAvgSelIna)}</td>
                  <td className={p-4 text-right font-black text-xs }>{formatRp(hAvgSelIdrg)}</td>
                  <td className="p-4 text-right font-black text-xs text-purple-700">{formatRp(hAvgIdrgIna)}</td>
                  {compKeys.map(c => <td key={c.key} className="p-4 text-right text-[10px] font-black text-amber-600 bg-amber-100/30">{formatRpEx(hAvgComps[c.key])}</td>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">

                {ksmData.map((ksm, ki) => {
                  const isKsmOpen = expandedKsms[ksm.name];

                  return (
                    <React.Fragment key={ksm-frag-}>
                      <tr className="bg-slate-100/80 font-black border-y border-slate-200">
                        <td className="p-4 sticky left-0 z-20 bg-slate-100/90 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setExpandedKsms(prev => ({ ...prev, [ksm.name]: !isKsmOpen }))}>
                            <span className={w-5 h-5 rounded flex items-center justify-center transition-transform }>?</span>
                            <span className="uppercase text-slate-800 tracking-tight">{ksm.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-black">{ksm.count.toLocaleString()}</td>
                        <td className="p-4 text-center text-teal-700 font-bold text-xs bg-teal-50/30">{(ksm.sumLos / (ksm.count || 1)).toFixed(1)}</td>
                        <td className="p-4 text-center text-rose-700 font-bold text-xs bg-rose-50/30">{ksm.maxLos}</td>
                        <td className="p-4 text-right text-slate-600">{formatRp(ksm.sumRS / (ksm.count || 1))}</td>
                        <td className={p-4 text-right font-black }>{formatRp(ksm.selisihIna / (ksm.count || 1))}</td>
                        <td className={p-4 text-right font-black }>{formatRp(ksm.selisihIdrg / (ksm.count || 1))}</td>
                        <td className="p-4 text-right font-black text-purple-700">{formatRp((ksm.sumIdrg - ksm.sumIna) / (ksm.count || 1))}</td>
                        {compKeys.map(c => <td key={c.key} className="p-4 text-right text-[10px] font-bold text-slate-500 bg-slate-200/50">{formatRpEx((ksm.comps?.[c.key] || 0) / (ksm.count || 1))}</td>)}
                      </tr>
                      
                      {isKsmOpen && ksm.dpjps.map((dpjp, pi) => (
                        <tr
                          key={dpjp--}
                          className="bg-white hover:bg-indigo-50/50 transition-colors cursor-pointer animate-in fade-in slide-in-from-bottom-1 duration-300 group"
                          style={{ animationDelay: ${pi * 30}ms, animationFillMode: 'both' }}
                          onClick={() => openDrilldown(Kasus DPJP: , row => normDpjp(row['DPJP']) === dpjp.normName)}
                        >
                          <td className="p-4 pl-10 border-l-4 border-indigo-500 sticky left-0 z-20 bg-white shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                            <div className="flex items-center gap-2 italic">
                              <User size={14} className="text-slate-400 group-hover:text-indigo-500" /> 
                              <span className="font-semibold text-slate-700 group-hover:text-indigo-700">{dpjp.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-right font-bold text-slate-600">{dpjp.count.toLocaleString()}</td>
                          <td className="p-4 text-center text-teal-600 font-bold text-xs bg-teal-50/10">{dpjp.avgLos.toFixed(1)}</td>
                          <td className="p-4 text-center text-rose-600 font-bold text-xs bg-rose-50/10">{dpjp.maxLos}</td>
                          <td className="p-4 text-right text-slate-500 text-xs">{formatRp(dpjp.avgRS)}</td>
                          <td className={p-4 text-right font-bold }>{formatRp(dpjp.avgSelIna)}</td>
                          <td className={p-4 text-right font-bold }>{formatRp(dpjp.avgSelIdrg)}</td>
                          <td className="p-4 text-right font-bold text-purple-600">{formatRp(dpjp.avgIdrgIna)}</td>
                          {compKeys.map(c => {
                            const cv = dpjp.avgComps[c.key]?.val || 0;
                            const cp = dpjp.avgComps[c.key]?.pct || 0;
                            return (
                              <td key={c.key} className="p-4 text-right text-[11px] font-semibold text-indigo-500/80 bg-indigo-50/10">
                                <div className="flex flex-col items-end gap-1">
                                  <span>{formatRpEx(cv)}</span>
                                  <div className="flex items-center gap-1">
                                    <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-300" style={{ width: ${Math.min(cp, 100)}% }}></div></div>
                                    <span className="text-[8px] text-slate-400 font-normal">{cp.toFixed(1)}%</span>
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };
'''
# We inject the new enderKsm before const renderDpjp = () => {
content = content.replace('  const renderDpjp = () => {', new_render_ksm + '\n  const renderDpjp = () => {', 1)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement successful")
