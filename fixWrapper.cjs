const fs = require('fs');
let c = fs.readFileSync('src/components/KompetensiDashboard.jsx', 'utf8');
const search = `{tab === 'laporan' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <KompetensiLaporan reports={data.reports} />
          </div>
        )}`;
const replace = `{tab === 'laporan' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
             <KompetensiLaporan reports={data.reports} />
          </div>
        )}`;
c = c.replace(search, replace);
fs.writeFileSync('src/components/KompetensiDashboard.jsx', c);
console.log('Wrapper fixed!');
