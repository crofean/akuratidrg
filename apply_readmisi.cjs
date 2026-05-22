const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add Readmisi to TABS
code = code.replace(
  "{ id: 'executive', label: 'Executive', icon: PieChart }, { id: 'report', label: 'Laporan', icon: Table2 }",
  "{ id: 'executive', label: 'Executive', icon: PieChart }, { id: 'readmisi', label: 'Readmisi & Fragmentasi', icon: RefreshCw }, { id: 'report', label: 'Laporan', icon: Table2 }"
);

// 2. Add Drilldown DPJP Header
code = code.replace(
  '<th rowSpan={2} className="px-5 py-4 border-r border-slate-100 align-middle bg-slate-50">MRN</th>',
  '<th rowSpan={2} className="px-5 py-4 border-r border-slate-100 align-middle bg-slate-50">DPJP</th>\n                            <th rowSpan={2} className="px-5 py-4 border-r border-slate-100 align-middle bg-slate-50">MRN</th>'
);

// 3. Add Drilldown DPJP Body
code = code.replace(
  'const displayName = patientName !== \'-\' ? patientName.split(\' \').filter(w => w.length > 0).map(w => w.charAt(0) + \'***\').join(\' \') : patientName;',
  'const displayName = patientName !== \'-\' ? patientName.split(\' \').filter(w => w.length > 0).map(w => w.charAt(0) + \'***\').join(\' \') : patientName;\n                            const drilldownDpjp = String(row.DPJP || \'-\').trim();'
);
code = code.replace(
  '<td className={`${tCell} font-extrabold ${rowFlag ? \'text-rose-800 sticky left-0 bg-rose-50 shadow-[2px_0_5px_-2px_rgba(244,63,94,0.1)] z-10\' : \'text-slate-800 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] z-10\'}`}>{displayName}</td>',
  '<td className={`${tCell} font-extrabold ${rowFlag ? \'text-rose-800 sticky left-0 bg-rose-50 shadow-[2px_0_5px_-2px_rgba(244,63,94,0.1)] z-10\' : \'text-slate-800 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] z-10\'}`}>{displayName}</td>\n                                <td className={`${tCell} font-bold text-slate-600`}>{drilldownDpjp}</td>'
);

// 4. Update colSpan of Rata-Rata row from 7 to 8
code = code.replace(
  '<td colSpan={7} className="px-5 py-3 font-black text-right text-teal-900 tracking-wider text-xs uppercase">~ Rata-Rata',
  '<td colSpan={8} className="px-5 py-3 font-black text-right text-teal-900 tracking-wider text-xs uppercase">~ Rata-Rata'
);

// 5. Add search to Active Users Table
const activeUsersTableSearch = `
          <div className="flex justify-between items-center bg-teal-50 px-6 py-4 border-b border-teal-100">
            <h3 className="text-lg font-black text-teal-900 flex items-center gap-2"><CheckCircle size={18} className="text-teal-500" /> Daftar Akun Terdaftar & Masa Aktif</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-400" size={16} />
              <input type="text" placeholder="Cari user..." value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-teal-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all font-medium text-teal-800 placeholder-teal-400/70" />
            </div>
          </div>
`;
code = code.replace(
  '<h3 className="text-lg font-black text-teal-900 flex items-center gap-2 mb-4"><CheckCircle size={18} className="text-teal-500" /> Daftar Akun Terdaftar & Masa Aktif</h3>',
  activeUsersTableSearch
);

// We also need to map over filteredActiveUsers instead of activeUsersList
code = code.replace(
  'activeUsersList.map(u => (',
  '(activeUsersList || []).filter(u => !userSearchTerm || Object.values(u).some(v => String(v).toLowerCase().includes(userSearchTerm.toLowerCase()))).map(u => ('
);

fs.writeFileSync('src/App.jsx', code);
console.log('Phase 1 changes applied');
