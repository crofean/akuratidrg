const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const regex = /\s*\{\/\* Kompetensi Confirmation Popup \*\/\}\s*\{showKompPopup && \([\s\S]*?\}\s*\)\}\s*return \(\s*<div className="min-h-screen bg-\[\#f8fafc\] text-slate-800 font-sans selection:bg-teal-100 selection:text-teal-900">/;

const replacement = `
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Kompetensi Confirmation Popup */}
      {showKompPopup && (
        <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="bg-amber-50 p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert className="text-amber-500" size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Perhatian</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">Apakah Anda sudah Mensetting Kompetensi Rumah Sakit di menu <b className="text-slate-800">Pengaturan Kompetensi</b>?</p>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button onClick={() => {
                setShowKompPopup(false);
                setActiveTab('dashboard');
                setSubTab('settings_kompetensi');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }} className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
                Belum, Arahkan Saya
              </button>
              <button onClick={() => {
                setShowKompPopup(false);
                setActiveTab('dashboard');
                setSubTab('kompetensi');
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }} className="flex-1 py-3 px-4 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 transition-colors shadow-sm shadow-teal-500/20">
                YA, Sudah
              </button>
            </div>
          </div>
        </div>
      )}`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('src/App.jsx', content);
  console.log('JSX moved inside return block successfully!');
} else {
  console.log('Regex did not match!');
}
