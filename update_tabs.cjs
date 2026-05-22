const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  "{ id: 'executive', label: 'Executive', icon: PieChart }, { id: 'readmisi', label: 'Readmisi & Fragmentasi', icon: RefreshCw }, { id: 'report', label: 'Laporan', icon: Table2 }",
  "{ id: 'executive', label: 'Executive', icon: PieChart }, { id: 'report', label: 'Laporan', icon: Table2 }"
);

code = code.replace(
  "{ id: 'kpi_coder', label: 'KPI Coder', icon: Award },",
  "{ id: 'kpi_coder', label: 'KPI Coder', icon: Award }, { id: 'readmisi', label: 'Readmisi & Fragmentasi', icon: RefreshCw },"
);

fs.writeFileSync('src/App.jsx', code);
console.log('TABS updated');
