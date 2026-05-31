const fs = require('fs');

// 1. Fix KompetensiDashboard.jsx
let d = fs.readFileSync('src/components/KompetensiDashboard.jsx', 'utf8');

// Fix DrillDown export args
d = d.replace(
  /exportToExcel\(\s*pendingExport\.sheets,\s*pendingExport\.name,\s*password\s*\);/g,
  `exportToExcel(
              pendingExport.name,
              pendingExport.sheets,
              password
            );`
);

// Fix layout to scroll properly
d = d.replace(
  '<div className="fixed inset-0 z-[9999] bg-slate-100 overflow-y-auto flex flex-col" style={{fontFamily:\'inherit\'}}>',
  '<div className="fixed inset-0 z-[9999] bg-slate-100 flex flex-col" style={{fontFamily:\'inherit\'}}>'
);
d = d.replace(
  '<div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-5 py-3 sticky top-0 z-20 shadow-2xl border-b border-teal-500/30">',
  '<div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-5 py-3 shrink-0 z-20 shadow-2xl border-b border-teal-500/30">'
);
d = d.replace(
  '<div className="max-w-screen-2xl mx-auto w-full px-4 py-5 space-y-5 flex-1">',
  '<div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">\n<div className="max-w-screen-2xl mx-auto w-full space-y-5">'
);

// We need to add closing div for the scrollable container.
// It should be right before the modal renders.
const dashEndRegex = /      \{\/\* Password Modal for Exports \*\/\}/;
d = d.replace(dashEndRegex, '      </div>\n      </div>\n\n      {/* Password Modal for Exports */}');

fs.writeFileSync('src/components/KompetensiDashboard.jsx', d);

// 2. Fix KompetensiLaporan.jsx
let l = fs.readFileSync('src/components/KompetensiLaporan.jsx', 'utf8');
l = l.replace(/<PasswordModal\s+onClose/g, '<PasswordModal isOpen={true} onClose');
fs.writeFileSync('src/components/KompetensiLaporan.jsx', l);

console.log('Fixed export args, scrolling layout, and PasswordModal isOpen!');
