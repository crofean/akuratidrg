const fs = require('fs');
let content = fs.readFileSync('src/components/KompetensiDashboard.jsx', 'utf8');

// 1. Imports
if (!content.includes('import PasswordModal')) {
  content = content.replace(
    /} from 'lucide-react';/,
    `} from 'lucide-react';
import PasswordModal from './PasswordModal';
import { exportToExcel } from '../utils/exportUtils';`
  );
}

// 2. Add states and handlers
const handlers = `
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingExport, setPendingExport] = useState(null);

  const handleExportTop10 = () => {
    if (!data || !data.top10) return;
    
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
      
      if (tableData) {
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
      }
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
    
    if (icdSummaryData) {
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
    }

    setPendingExport({
      name: \`Rincian_\${String(title).replace(/[^a-zA-Z0-9]/g, '_')}\`,
      sheets: [sheet]
    });
    setShowPasswordModal(true);
  };
`;

const stateMatch = '  const [config,  setConfig]  = useState({});';
if (content.includes(stateMatch) && !content.includes('showPasswordModal')) {
  content = content.replace(stateMatch, stateMatch + '\n' + handlers);
}

// 3. Add Top 10 Button and fix the div nesting
// We will replace the entire block of TOP 10 TABLES to make sure it's closed properly
const t10Regex = /\{\/\* TOP 10 TABLES \*\/\}([\s\S]*?)<Top10Table title="Top 10 Tindakan Tidak Sesuai Kompetensi RS" data=\{data\.top10\?\.procTidakSesuai\} \/>\s*<\/div>\s*<\/div>\s*\)\}/;

const t10Replacement = `{/* TOP 10 TABLES */}
            <div className="mt-8 lg:col-span-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-slate-800">Top 10 Diagnosa & Tindakan</h3>
                <button onClick={handleExportTop10} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 900 }}>
                  <Download size={14} /> Download Excel
                </button>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Top10Table title="Top 10 Diagnosa Sesuai Kompetensi RS" data={data.top10?.diagSesuai} />
                <Top10Table title="Top 10 Tindakan Sesuai Kompetensi RS" data={data.top10?.procSesuai} />
                <Top10Table title="Top 10 Diagnosa Tidak Sesuai Kompetensi RS" data={data.top10?.diagTidakSesuai} />
                <Top10Table title="Top 10 Tindakan Tidak Sesuai Kompetensi RS" data={data.top10?.procTidakSesuai} />
              </div>
            </div>
          </div>
        )}`;

if (t10Regex.test(content)) {
  content = content.replace(t10Regex, t10Replacement);
} else {
  console.log("Could not find Top 10 Tables block!");
}

// 4. Tabel Distribusi Level (inline drilldown) button
const inlineSearchStr = `<td colSpan={8} className="p-0 border-b border-slate-200">
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
const inlineReplaceStr = `<td colSpan={8} className="p-0 border-b border-slate-200">
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
if (content.includes(inlineSearchStr)) {
  content = content.replace(inlineSearchStr, inlineReplaceStr);
}

// 5. PasswordModal injection
const endStr = `      {/* ── Drill-Down Modal ── */}
      {drill && (
        <DrillDownWrapper
          group={drill}
          rows={rows}
          config={config}
          onClose={()=>setDrill(null)}
        />
      )}
    </div>
  );
}`;
const endRep = `      {/* ── Drill-Down Modal ── */}
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
  );
}`;
if (content.includes(endStr)) {
  content = content.replace(endStr, endRep);
}

// 6. DrillDownWrapper export prop and button
const dwSig = `function DrillDownWrapper({ group, rows, config, onClose }) {`;
const dwSigRep = `function DrillDownWrapper({ group, rows, config, onClose, onExport }) {`;
if (content.includes(dwSig)) {
  content = content.replace(dwSig, dwSigRep);
}

const dwBtnStr = `<div className="flex-1 flex items-center justify-end px-4">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari SEP / DPJP / ICD..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-400 outline-none w-60"/>
            </div>
          </div>`;
const dwBtnRep = `<div className="flex-1 flex items-center justify-end px-4 gap-3">
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
if (content.includes(dwBtnStr)) {
  content = content.replace(dwBtnStr, dwBtnRep);
}

fs.writeFileSync('src/components/KompetensiDashboard.jsx', content);
console.log('Perfect inject complete!');
