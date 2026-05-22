const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Mask Drilldown DPJP
code = code.replace(
  "{String(row.DPJP || '-').trim()}",
  "{(() => { const dpjpVal = String(row.DPJP || '-').trim(); return dpjpVal !== '-' ? dpjpVal.split(' ').filter(w=>w.length>0).map(w => w.charAt(0) + '***').join(' ') : dpjpVal; })()}"
);

// 2. User Management Search UI
const userMgmtSearch = `
            <div className="border-b border-slate-100 pb-4 mb-4 flex flex-col md:flex-row gap-4 md:items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  Daftar Akun Terdaftar & Masa Aktif
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" placeholder="Cari user (nama, email, instansi)..." value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-slate-700" />
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider whitespace-nowrap">
                  {userAccounts.length} User Terdaftar
                </span>
              </div>
`;

code = code.replace(
  /<div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">[\s\S]*?{userAccounts\.length} User Terdaftar\n\s*<\/span>\n\s*<\/div>/,
  userMgmtSearch.trim()
);

// Apply filter to active users map
code = code.replace(
  "userAccounts.map((u, idx) => {",
  "userAccounts.filter(u => !userSearchTerm || Object.values(u).some(v => String(v).toLowerCase().includes(userSearchTerm.toLowerCase()))).map((u, idx) => {"
);

// 3. customKsms & customDepts state
const customStates = `
  const [customKsms, setCustomKsms] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sak_custom_ksms')) || []; } catch(e){ return []; }
  });
  const [customDepts, setCustomDepts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sak_custom_depts')) || []; } catch(e){ return []; }
  });
  const [newKsmInput, setNewKsmInput] = useState("");
  const [newDeptInput, setNewDeptInput] = useState("");

  const addCustomKsm = () => {
    if(newKsmInput.trim()) {
      const updated = [...customKsms, newKsmInput.trim().toUpperCase()];
      setCustomKsms(updated);
      localStorage.setItem('sak_custom_ksms', JSON.stringify(updated));
      setNewKsmInput("");
    }
  };

  const addCustomDept = () => {
    if(newDeptInput.trim()) {
      const updated = [...customDepts, newDeptInput.trim().toUpperCase()];
      setCustomDepts(updated);
      localStorage.setItem('sak_custom_depts', JSON.stringify(updated));
      setNewDeptInput("");
    }
  };
`;

code = code.replace(
  "const [userSearchTerm, setUserSearchTerm] = useState(\"\");",
  "const [userSearchTerm, setUserSearchTerm] = useState(\"\");\n" + customStates
);

// 4. Inject Add Custom Option UI into renderKsmMappingSettings
const customOptionsUI = `
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="p-4 bg-white border border-slate-200">
            <h4 className="text-xs font-black text-slate-700 uppercase mb-2">Tambah Pilihan KSM Baru</h4>
            <div className="flex gap-2">
              <input type="text" value={newKsmInput} onChange={e => setNewKsmInput(e.target.value)} placeholder="Ketik nama KSM..." className="flex-1 px-3 py-2 border rounded-lg text-xs font-bold" />
              <button onClick={addCustomKsm} className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all">Tambah</button>
            </div>
          </Card>
          <Card className="p-4 bg-white border border-slate-200">
            <h4 className="text-xs font-black text-slate-700 uppercase mb-2">Tambah Pilihan Departemen Baru</h4>
            <div className="flex gap-2">
              <input type="text" value={newDeptInput} onChange={e => setNewDeptInput(e.target.value)} placeholder="Ketik nama Departemen..." className="flex-1 px-3 py-2 border rounded-lg text-xs font-bold" />
              <button onClick={addCustomDept} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all">Tambah</button>
            </div>
          </Card>
        </div>

        <Card className="overflow-hidden">
`;

code = code.replace(
  "<Card className=\"overflow-hidden\">\n          <div className=\"overflow-x-auto max-h-[70vh] custom-scrollbar\">",
  customOptionsUI + "\n          <div className=\"overflow-x-auto max-h-[70vh] custom-scrollbar\">"
);

// 5. Apply customKsms to dropdowns
code = code.replace(
  "{Array.from(new Set([...KSM_LIST, current.ksm])).sort().map(k => (",
  "{Array.from(new Set([...KSM_LIST, ...customKsms, current.ksm])).sort().map(k => ("
);

// 6. Apply customDepts to dropdowns
code = code.replace(
  "{DEPT_LIST.sort().map(dept => (",
  "{Array.from(new Set([...DEPT_LIST, ...customDepts, current.dept])).sort().map(dept => ("
);

fs.writeFileSync('src/App.jsx', code);
console.log('Applied latest user requests');
