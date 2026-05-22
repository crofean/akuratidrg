const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Mask DPJP in renderKsmMappingSettings
// The DPJP display is currently: <span className="font-extrabold text-slate-700">{d.disp}</span>
// Let's replace it with a masked version.
code = code.replace(
  '<span className="font-extrabold text-slate-700">{d.disp}</span>',
  '<span className="font-extrabold text-slate-700">{String(d.disp || \'-\').split(\' \').filter(w=>w.length>0).map(w=>w.charAt(0)+\'***\').join(\' \')}</span>'
);

// 2. Fix the Readmisi & Fragmentasi date parsing & Masking
const dateParserString = `
    const parseDateSafe = (dateStr) => {
      if (!dateStr) return new Date(0);
      const str = String(dateStr).trim();
      const parts = str.split(' ')[0].split(/[-/]/);
      if (parts.length >= 3) {
        let d = parts[0]; let m = parts[1]; let y = parts[2];
        if (y.length === 4) return new Date(y + '-' + m + '-' + d);
      }
      return new Date(str);
    };
    
    const maskNameSafe = (name) => {
      if (!name || name === '-') return '-';
      return String(name).split(' ').filter(w => w.length > 0).map(w => w.charAt(0) + '***').join(' ');
    };
`;

code = code.replace(
  'const renderReadmisiFragmentasi = () => {\n    const raw = dashData?.rawRows || [];',
  'const renderReadmisiFragmentasi = () => {\n    const raw = dashData?.rawRows || [];\n' + dateParserString
);

// Replace new Date(x.DISCHARGE_DATE) with parseDateSafe(x.DISCHARGE_DATE)
code = code.replace(/new Date\((a|b|v1|v2|prevV|v)\.DISCHARGE_DATE\)/g, 'parseDateSafe($1.DISCHARGE_DATE)');

// Replace masking inside the table for name and DPJP
// Name: <div className="font-bold text-slate-600 text-sm mb-2">{c.nama}</div>
code = code.replace(
  '<div className="font-bold text-slate-600 text-sm mb-2">{c.nama}</div>',
  '<div className="font-bold text-slate-600 text-sm mb-2">{maskNameSafe(c.nama)}</div>'
);

// DPJP inside the map: {v.DPJP && <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 rounded">DPJP: {v.DPJP}</span>}
code = code.replace(
  '{v.DPJP && <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 rounded">DPJP: {v.DPJP}</span>}',
  '{v.DPJP && <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 rounded">DPJP: {maskNameSafe(v.DPJP)}</span>}'
);

fs.writeFileSync('src/App.jsx', code);
console.log('Fixed date parsing and masking');
