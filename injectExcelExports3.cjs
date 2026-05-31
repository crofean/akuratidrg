const fs = require('fs');
let content = fs.readFileSync('src/components/KompetensiDashboard.jsx', 'utf8');

// 1. Imports
if (!content.includes('import PasswordModal')) {
  content = content.replace(
    /import \{[^}]+\} from 'lucide-react';/,
    "$&\\nimport PasswordModal from './PasswordModal';\\nimport { exportToExcel } from '../utils/exportUtils';"
  );
}

// 2. Add states and handlers
const handlers = `
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingExport, setPendingExport] = useState(null);

  const handleExportTop10 = () => {
    if (!data.top10) return;
    
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

  const handleExportDrillDown = (title, icdSummaryData, cfg, grp) => {
    const sheet = {
      name: 'Rincian_ICD',
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
    
    icdSummaryData.forEach((d, i) => {
      const rsLevel = cfg && cfg[grp] ? cfg[grp] : 'Belum Ada Mapping';
      const rsLevelIdx = LEVEL_ORDER.indexOf(rsLevel);
      const icdLevelIdx = LEVEL_ORDER.indexOf(d.level);
      const isSesuai = rsLevel === 'Belum Ada Mapping' ? true : icdLevelIdx <= rsLevelIdx;

      sheet.data.push({
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

    setPendingExport({
      name: \`Rincian_\${String(title).replace(/[^a-zA-Z0-9]/g, '_')}\`,
      sheets: [sheet]
    });
    setShowPasswordModal(true);
  };
`;
if (!content.includes('const handleExportTop10')) {
  content = content.replace(
    /const \[config,\s*setConfig\]\s*=\s*useState\(\{\}\);/,
    `$&\\n${handlers}`
  );
}

// 3. Add Top 10 button
if (!content.includes('<button onClick={handleExportTop10}')) {
  content = content.replace(
    /<div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-4 lg:col-span-3">/,
    `<div className="mt-8 lg:col-span-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-slate-800">Top 10 Diagnosa & Tindakan</h3>
                <button onClick={handleExportTop10} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 900 }}>
                  <Download size={14} /> Download Excel
                </button>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">`
  );
  content = content.replace(
    /<Top10Table title="Top 10 Tindakan Tidak Sesuai Kompetensi RS" data=\{data\.top10\?\.procTidakSesuai\} \/>\s*<\/div>/,
    `$&
            </div>`
  );
}

// 4. Find Drilldown 1 search box (Tabel Distribusi Level)
const d1Search = `<div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[820px]">`;
const d1Replace = `<div className="flex justify-end mb-3">
                <button onClick={() => {
                  if (!search) return;
                  const lvlData = data.levelStats[Object.keys(data.levelStats).find(k => k.toLowerCase() === search.toLowerCase())];
                  if (lvlData) handleExportDrillDown(search, lvlData.icdSummary, config, search);
                }} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 900, padding: '0.25rem 0.75rem' }}>
                  <Download size={12} /> Excel
                </button>
              </div>
              <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[820px]">`;
// Wait, the Tabel Distribusi Level row expands in-place!
// The drilldown inline is inside: (search ? icdSummary.filter... : icdSummary)
// The input for search is in the expanded row header.
// Let's find it.
// The code has:
/*
<td colSpan={8} className="p-0 border-b border-slate-200">
  <div className="bg-slate-50/50 p-4 border-t border-slate-100 shadow-inner">
*/
const expandedRowCode = `<td colSpan={8} className="p-0 border-b border-slate-200">
                      <div className="bg-slate-50/50 p-4 border-t border-slate-100 shadow-inner">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <ListFilter size={14} className="text-slate-400"/>
                            <span className="text-xs font-bold text-slate-700">Rincian ICD</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            <Search size={14} />
                            <input type="text" placeholder="Cari ICD..." className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-500 w-64" value={search} onChange={e=>setSearch(e.target.value)}/>
                          </div>
                        </div>`;
const expandedRowReplace = `<td colSpan={8} className="p-0 border-b border-slate-200">
                      <div className="bg-slate-50/50 p-4 border-t border-slate-100 shadow-inner">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <ListFilter size={14} className="text-slate-400"/>
                            <span className="text-xs font-bold text-slate-700">Rincian ICD</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-slate-400">
                              <Search size={14} />
                              <input type="text" placeholder="Cari ICD..." className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-500 w-64" value={search} onChange={e=>setSearch(e.target.value)}/>
                            </div>
                            <button onClick={() => handleExportDrillDown(d.level, d.icdSummary, config, group)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 900, padding: '0.25rem 0.75rem' }}>
                              <Download size={12} /> Excel
                            </button>
                          </div>
                        </div>`;
if (content.includes(expandedRowCode)) {
  content = content.replace(expandedRowCode, expandedRowReplace);
}

// 5. Add Modal to root
const rootEnd = `
      {/* ── Drill-Down Modal ── */}
      {drill && (
        <DrillDownWrapper
          group={drill}
          rows={rows}
          config={config}
          onClose={()=>setDrill(null)}
          onExport={(title, icdSummaryData, cfg, grp) => handleExportDrillDown(title, icdSummaryData, cfg, grp)}
        />
      )}
      
      {showPasswordModal && pendingExport && (
        <PasswordModal 
          onClose={() => setShowPasswordModal(false)}
          onConfirm={(pwd) => {
            setShowPasswordModal(false);
            exportToExcel(pendingExport.name, pendingExport.sheets, pwd);
          }}
        />
      )}
    </div>
  , document.body);
}`;
if (!content.includes('showPasswordModal && pendingExport')) {
  // Let's replace the DrillDownWrapper call completely
  const oldDrill = `{drill && (
        <DrillDownWrapper
          group={drill}
          rows={rows}
          config={config}
          onClose={()=>setDrill(null)}
        />
      )}
    </div>
  , document.body);`;
  if (content.includes(oldDrill)) {
    content = content.replace(oldDrill, rootEnd.trim());
  }
}

// 6. Fix DrillDownWrapper to accept onExport and have the button
const dwStart = `function DrillDownWrapper({ group, rows, config, onClose }) {`;
const dwStartRep = `function DrillDownWrapper({ group, rows, config, onClose, onExport }) {`;
if (content.includes(dwStart)) content = content.replace(dwStart, dwStartRep);

const dwSearch = `<div className="flex-1 flex items-center justify-end px-4">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari SEP / DPJP / ICD..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-400 outline-none w-60"/>
            </div>
          </div>`;
const dwReplace = `<div className="flex-1 flex items-center justify-end px-4 gap-3">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari SEP / DPJP / ICD..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-400 outline-none w-60"/>
            </div>
            {tab === 'icds' && (
              <button onClick={() => onExport(group, icdSummary, config, group)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 900, padding: '0.35rem 0.75rem' }}>
                <Download size={14} /> Excel
              </button>
            )}
          </div>`;
if (content.includes(dwSearch)) content = content.replace(dwSearch, dwReplace);

fs.writeFileSync('src/components/KompetensiDashboard.jsx', content);
console.log('Final inject done!');
