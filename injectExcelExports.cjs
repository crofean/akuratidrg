const fs = require('fs');
let content = fs.readFileSync('src/components/KompetensiDashboard.jsx', 'utf8');

// 1. Imports
if (!content.includes('import PasswordModal')) {
  content = content.replace(
    /import \{[^}]+\} from 'lucide-react';/,
    "$&\\nimport PasswordModal from './PasswordModal';\\nimport { exportToExcel } from '../utils/exportUtils';"
  );
}

// 2. State hooks
if (!content.includes('const [showPasswordModal')) {
  content = content.replace(
    /const \[search, setSearch\] = useState\(''\);/,
    "$&\\n  const [showPasswordModal, setShowPasswordModal] = useState(false);\\n  const [pendingExport, setPendingExport] = useState(null);"
  );
}

// 3. Export Top 10 Handler
const exportTop10Handler = `
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
`;
if (!content.includes('handleExportTop10')) {
  content = content.replace(
    /const handleProcess = async \(\) => \{/,
    `${exportTop10Handler}\\n  $&`
  );
}

// 4. Export DrillDown Handler (Distribusi Level & Kelompok Layanan)
const exportDrillDownHandler = `
  const handleExportDrillDown = (title, icdSummary, config, group) => {
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
    
    icdSummary.forEach((d, i) => {
      const rsLevel = config && config[group] ? config[group] : 'Belum Ada Mapping';
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
      name: \`Rincian_\${title.replace(/[^a-zA-Z0-9]/g, '_')}\`,
      sheets: [sheet]
    });
    setShowPasswordModal(true);
  };
`;
if (!content.includes('handleExportDrillDown')) {
  content = content.replace(
    /const handleProcess = async \(\) => \{/,
    `${exportDrillDownHandler}\\n  $&`
  );
}

// 5. Add Download Button to Top 10 Tables
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

// We must also replace the closing </div> for the original Top 10 grid, since we wrapped it.
// The original was:
// <Top10Table title="Top 10 Tindakan Tidak Sesuai..." data={data.top10?.procTidakSesuai} />
// </div>
// We need to add one more </div>
content = content.replace(
  /<Top10Table title="Top 10 Tindakan Tidak Sesuai Kompetensi RS" data=\{data\.top10\?\.procTidakSesuai\} \/>\s*<\/div>/,
  `$&
            </div>`
);


// 6. Add Download Button to DrillDown Table 1 (Distribusi Level)
// Search string: 
// <input type="text" placeholder="Cari ICD..." className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-500 w-64" value={search} onChange={e=>setSearch(e.target.value)}/>
// </div>
content = content.replace(
  /<input type="text" placeholder="Cari ICD\.\.\." className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1\.5 focus:outline-none focus:border-teal-500 w-64" value=\{search\} onChange=\{e=>setSearch\(e\.target\.value\)\}\/>\s*<\/div>/,
  `$&
                      <button onClick={() => handleExportDrillDown(d.level, d.icdSummary, config, group)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 900, padding: '0.25rem 0.75rem' }}>
                        <Download size={12} /> Excel
                      </button>`
);

// 7. Add Download Button to DrillDown Table 2 (Per Kelompok Layanan)
// Same search string, but we want to replace BOTH occurrences. Since replace with string only replaces first, we'll use regex with global or just do it inside a loop.
// Actually, let's use global regex to replace BOTH occurrences of the search box wrapper!
// Wait, the first one passes `d.level` and `d.icdSummary`. The second one passes `expandedRow` and `icdSummary`.
// This is too fragile with regex. I will write a custom loop in the script to find the two search boxes.

fs.writeFileSync('src/components/KompetensiDashboard.jsx', content);
console.log('Injected Excel handlers and Top 10 UI changes');
