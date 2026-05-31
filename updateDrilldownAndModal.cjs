const fs = require('fs');
let content = fs.readFileSync('src/components/KompetensiDashboard.jsx', 'utf8');

// 1. Inject <PasswordModal /> into KompetensiDashboard return block
const modalJsx = `
      {/* Password Modal for Exports */}
      {showPasswordModal && pendingExport && (
        <PasswordModal
          onClose={() => {
            setShowPasswordModal(false);
            setPendingExport(null);
          }}
          onSuccess={(password) => {
            exportToExcel(
              pendingExport.sheets,
              pendingExport.name,
              password
            );
            setShowPasswordModal(false);
            setPendingExport(null);
          }}
        />
      )}
`;

// Insert it right before the last closing div of KompetensiDashboard
const endDashboardRegex = /      \{\/\* ── Drill-Down Modal ── \*\/\}/;
if (content.match(endDashboardRegex)) {
  if (!content.includes('Password Modal for Exports')) {
    content = content.replace(endDashboardRegex, modalJsx + '\n      {/* ── Drill-Down Modal ── */}');
  }
}

// 2. Modify DrillDownWrapper instantiation to pass onExport
const drillInstRegex = /<DrillDownWrapper\s+group=\{drill\}\s+rows=\{rows\}\s+config=\{config\}\s+onClose=\{\(\)=>setDrill\(null\)\}\s+\/>/;
const newDrillInst = `<DrillDownWrapper
          group={drill}
          rows={rows}
          config={config}
          onClose={()=>setDrill(null)}
          onExport={handleExportDrillDown}
        />`;
if (content.match(drillInstRegex)) {
  content = content.replace(drillInstRegex, newDrillInst);
}

// 3. Modify DrillDownWrapper definition
// Find DrillDownWrapper
const wrapperDefRegex = /function DrillDownWrapper\(\{ group, rows, config, onClose, onExport \}\) \{/;
if (!content.match(wrapperDefRegex)) {
  content = content.replace(/function DrillDownWrapper\(\{ group, rows, config, onClose \}\) \{/, 'function DrillDownWrapper({ group, rows, config, onClose, onExport }) {');
}

// Replace the Download button and exportToExcel inside DrillDown (the actual component, not the wrapper)
// Wait! DrillDownWrapper renders DrillDown. We need to pass onExport to DrillDown as well!
content = content.replace(/<DrillDown\s+group=\{group\}\s+rows=\{filtered\}\s+icdMap=\{icdMap\}\s+config=\{config\}\s+onClose=\{onClose\}\s+\/>/, '<DrillDown\n          group={group}\n          rows={filtered}\n          icdMap={icdMap}\n          config={config}\n          onClose={onClose}\n          onExport={onExport}\n        />');

// Modify DrillDown definition
content = content.replace(/function DrillDown\(\{ group, rows, icdMap, config, onClose \}\) \{/, 'function DrillDown({ group, rows, icdMap, config, onClose, onExport }) {');

// Remove local exportToExcel and use onExport in the button
// We'll just replace the button that has Download CSV
content = content.replace(/<button onClick=\{exportToExcel\} className="flex items-center gap-2 px-3 py-1\.5 bg-white\/10 hover:bg-teal-500 rounded-lg text-xs font-bold transition-colors">\s*<Download size=\{14\}\/> Download CSV\s*<\/button>/, 
  `<button onClick={() => { if(onExport) onExport('DrillDown_'+dn(group), icdSummary, config, group); }} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-teal-500 rounded-lg text-xs font-bold transition-colors">
              <Download size={14}/> Download Excel
            </button>`);

fs.writeFileSync('src/components/KompetensiDashboard.jsx', content);
console.log('KompetensiDashboard updated for modal and drilldown export!');
