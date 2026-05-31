const fs = require('fs');
let content = fs.readFileSync('src/components/KompetensiDashboard.jsx', 'utf8');

// The PasswordModal component is injected at the end of the root div.
// The root div ends with:
//         </button>
//       </div>
//     </div>
//   );
// }
// Let's find the closing of KompetensiDashboard
const modalCode = `
      {showPasswordModal && pendingExport && (
        <PasswordModal 
          onClose={() => setShowPasswordModal(false)}
          onConfirm={(pwd) => {
            setShowPasswordModal(false);
            exportToExcel(pendingExport.name, pendingExport.sheets, pwd);
          }}
        />
      )}
`;
const returnMatch = content.lastIndexOf('    </div>\\n  );\\n}');
if (returnMatch !== -1 && !content.includes('<PasswordModal')) {
  content = content.slice(0, returnMatch) + modalCode + content.slice(returnMatch);
}

// Add download button to the first drilldown (Tabel Distribusi Level)
const search1 = `<div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <ListFilter size={14} className="text-slate-400"/>
                        <span className="text-xs font-bold text-slate-700">Rincian ICD</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Search size={14} />
                        <input type="text" placeholder="Cari ICD..." className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-500 w-64" value={search} onChange={e=>setSearch(e.target.value)}/>
                      </div>`;
const replace1 = `<div className="flex items-center justify-between mb-4">
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
                      </div>`;
if (content.includes(search1)) {
  content = content.replace(search1, replace1);
} else {
  console.log('Search 1 not found');
}

// Add download button to the second drilldown (Per Kelompok Layanan)
const search2 = `<div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ListFilter size={14} className="text-slate-400"/>
                    <span className="text-xs font-bold text-slate-700">Rincian ICD</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Search size={14} />
                    <input type="text" placeholder="Cari ICD..." className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-500 w-64" value={search} onChange={e=>setSearch(e.target.value)}/>
                  </div>`;
const replace2 = `<div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ListFilter size={14} className="text-slate-400"/>
                    <span className="text-xs font-bold text-slate-700">Rincian ICD</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Search size={14} />
                      <input type="text" placeholder="Cari ICD..." className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-500 w-64" value={search} onChange={e=>setSearch(e.target.value)}/>
                    </div>
                    <button onClick={() => handleExportDrillDown(expandedRow, icdSummary, config, expandedRow)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 900, padding: '0.25rem 0.75rem' }}>
                      <Download size={12} /> Excel
                    </button>
                  </div>`;
if (content.includes(search2)) {
  content = content.replace(search2, replace2);
} else {
  console.log('Search 2 not found');
}

fs.writeFileSync('src/components/KompetensiDashboard.jsx', content);
console.log('Completed injection');
