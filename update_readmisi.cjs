const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const newRender = `
  const renderReadmisiFragmentasi = () => {
    const raw = dashData?.rawRows || [];
    if (raw.length === 0) return <div className="p-8 text-center text-slate-500 font-bold">Data belum tersedia / tidak ada.</div>;

    // Kelompokkan data berdasarkan MRN (atau NOKARTU jika MRN kosong)
    const patMap = {};
    raw.forEach(r => {
      const pid = String(r.MRN || r.NOKARTU || '').trim();
      if (!pid || pid === '-') return;
      if (!patMap[pid]) patMap[pid] = [];
      patMap[pid].push(r);
    });

    let readmisiCount = 0;
    let fragCount = 0;
    let readmisiCases = [];
    let fragCases = [];

    Object.values(patMap).forEach(visits => {
      if (visits.length < 2) return;
      // Urutkan kunjungan dari yang terlama ke terbaru (chronological)
      visits.sort((a, b) => new Date(a.DISCHARGE_DATE) - new Date(b.DISCHARGE_DATE));

      for (let i = 0; i < visits.length - 1; i++) {
        const v1 = visits[i];
        const v2 = visits[i + 1];

        const d1 = new Date(v1.DISCHARGE_DATE);
        const d2 = new Date(v2.DISCHARGE_DATE);
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 30) {
          const isV2Inap = String(v2.PTD || '').trim() === '1';
          const isV2Jalan = String(v2.PTD || '').trim() === '2';
          
          const dpjp1 = normDpjp(v1.DPJP);
          const dpjp2 = normDpjp(v2.DPJP);
          const sameDpjp = dpjp1 === dpjp2;
          
          const ina1 = String(v1.INACBG || '').trim().split('-').slice(0, 2).join('-');
          const ina2 = String(v2.INACBG || '').trim().split('-').slice(0, 2).join('-');
          const relatedDiag = ina1 && ina2 && ina1 === ina2;

          const caseInfo = {
            pid: String(v2.MRN || v2.NOKARTU || '-'),
            nama: String(v2.NAMA_PASIEN || v2.NAMA || '-'),
            history: visits, // All visits
            v1, v2,
            diffDays,
            sameDpjp,
            relatedDiag
          };

          if (isV2Inap) {
            readmisiCount++;
            readmisiCases.push(caseInfo);
          } else if (isV2Jalan) {
            fragCount++;
            fragCases.push(caseInfo);
          }
        }
      }
    });

    const uniqueReadmisi = Array.from(new Map(readmisiCases.map(item => [item.pid, item])).values());
    const uniqueFrag = Array.from(new Map(fragCases.map(item => [item.pid, item])).values());

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
        <SectionHeader icon={RefreshCw} title="Potensi Readmisi & Fragmentasi" desc="Deteksi pasien rawat inap (Readmisi) dan rawat jalan (Fragmentasi) dengan kunjungan ulang < 30 hari." colorClass="bg-rose-50 text-rose-600" highlightClass="bg-rose-500/5" exportAction={() => {}} exportText="Ekspor" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6 bg-white border-l-4 border-l-rose-500">
            <h4 className="text-slate-500 uppercase text-xs font-extrabold mb-2">Potensi Readmisi (Rawat Inap)</h4>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-black text-rose-600">{uniqueReadmisi.length}</p>
              <span className="text-sm font-bold text-slate-400 mb-1">Pasien</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Kunjungan ulang PTD=1 dalam <span className="font-bold">&lt; 30 hari</span>.</p>
          </Card>
          <Card className="p-6 bg-white border-l-4 border-l-orange-500">
            <h4 className="text-slate-500 uppercase text-xs font-extrabold mb-2">Potensi Fragmentasi / Konsul Internal (Rawat Jalan)</h4>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-black text-orange-600">{uniqueFrag.length}</p>
              <span className="text-sm font-bold text-slate-400 mb-1">Pasien</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Kunjungan ulang PTD=2 dalam <span className="font-bold">&lt; 30 hari</span>.</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Daftar Pasien Terindikasi</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4 border-b border-slate-200 w-12 text-center">No</th>
                    <th className="px-5 py-4 border-b border-slate-200">No RM</th>
                    <th className="px-5 py-4 border-b border-slate-200 min-w-[200px]">Data Pasien</th>
                    <th className="px-5 py-4 border-b border-slate-200">Riwayat Kunjungan (Terkait Indikasi Saja)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {[...uniqueReadmisi.map(u => ({...u, type: 'Readmisi'})), ...uniqueFrag.map(u => ({...u, type: 'Fragmentasi'}))]
                    .sort((a,b) => b.history.length - a.history.length).map((c, idx) => {
                    
                    // Filter history based on type: Readmisi = PTD 1 only, Fragmentasi = PTD 2 only
                    const filteredHistory = c.history.filter(v => c.type === 'Readmisi' ? String(v.PTD||'').trim() === '1' : String(v.PTD||'').trim() === '2');
                    
                    return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4 text-center font-bold text-slate-400 align-top">{idx + 1}</td>
                      <td className="px-5 py-4 font-black text-slate-700 align-top">{c.pid}</td>
                      <td className="px-5 py-4 align-top whitespace-normal min-w-[200px]">
                        <div className="font-bold text-slate-600 text-sm mb-2">{c.nama}</div>
                        <span className={"px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase " + (c.type === 'Readmisi' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700')}>
                          {c.type}
                        </span>
                        <div className="mt-4">
                          <button
                            onClick={() => openDrilldown('Semua Riwayat Kunjungan: ' + c.nama, r => String(r.MRN || r.NOKARTU || '').trim() === c.pid, 'patient')}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all w-full text-center flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Search size={12} /> Drilldown Semua Kunjungan
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-normal min-w-[600px] align-top">
                        <div className="flex flex-col gap-2">
                          {filteredHistory.map((v, i) => {
                            const isPtd1 = String(v.PTD || '').trim() === '1';
                            const diagC = String(v.INACBG || '-');
                            const diagDesc = String(v.DESKRIPSI_INACBG || '-');
                            const dlist = String(v.DIAGLIST || '-');
                            const plist = String(v.PROCLIST || '-');
                            const sep = String(v.SEP || v.NO_SEP || '-');
                            
                            return (
                              <div key={i} className={"flex gap-3 p-3 rounded-lg border " + (isPtd1 ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50 border-slate-200')}>
                                <span className={"font-black px-2 py-0.5 rounded text-[10px] h-fit " + (isPtd1 ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-200 text-slate-700')}>
                                  {i + 1}
                                </span>
                                <div className="flex-1 space-y-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-800">{String(v.DISCHARGE_DATE || '-')}</span>
                                    <span className={"text-[10px] font-black uppercase px-1.5 rounded " + (isPtd1 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600')}>
                                      {isPtd1 ? 'Rawat Inap' : 'Rawat Jalan'}
                                    </span>
                                    <span className="font-mono text-[10px] font-bold text-slate-500 bg-white border px-1.5 rounded">SEP: {sep}</span>
                                    {v.DPJP && <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 rounded">DPJP: {v.DPJP}</span>}
                                  </div>
                                  <div className="text-[10px] text-slate-600">
                                    <span className="font-bold text-slate-800">{diagC}</span> - {diagDesc}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div className="bg-white p-1.5 rounded border border-slate-100">
                                      <div className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Diaglist</div>
                                      <div className="text-[10px] font-mono text-slate-600">{dlist}</div>
                                    </div>
                                    <div className="bg-white p-1.5 rounded border border-slate-100">
                                      <div className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Proclist</div>
                                      <div className="text-[10px] font-mono text-slate-600">{plist}</div>
                                    </div>
                                  </div>
                                </div>
                                {i > 0 && (() => {
                                  // Find the previous visit in chronological order
                                  const prevV = filteredHistory[i-1];
                                  const d1 = new Date(prevV.DISCHARGE_DATE);
                                  const d2 = new Date(v.DISCHARGE_DATE);
                                  const df = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
                                  if (df < 30) {
                                    const sameD = normDpjp(prevV.DPJP) === normDpjp(v.DPJP);
                                    const diagRel = String(prevV.INACBG||'').split('-').slice(0,2).join('-') === String(v.INACBG||'').split('-').slice(0,2).join('-');
                                    return (
                                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                                        <span className="text-[9px] font-black text-rose-600 bg-rose-100 px-1.5 rounded uppercase tracking-wider">{df} Hari Sjk Sblmnya</span>
                                        <div className="flex gap-1 mt-1">
                                          {!sameD && <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 border border-orange-200 rounded">DPJP Beda</span>}
                                          {sameD && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 border border-emerald-200 rounded">DPJP Sama</span>}
                                        </div>
                                        {diagRel && <div className="mt-0.5"><span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 border border-purple-200 rounded">Diag Berkaitan</span></div>}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    );
  };
`;

const startIndex = code.indexOf('const renderReadmisiFragmentasi = () => {');
const endIndexStr = 'const renderTopUp = () => {';
const endIndex = code.indexOf(endIndexStr);

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + newRender + '\n  ' + code.substring(endIndex);
  fs.writeFileSync('src/App.jsx', code);
  console.log('Successfully updated renderReadmisiFragmentasi');
} else {
  console.log('Failed to find start or end index');
}
