const fs = require('fs');
let content = fs.readFileSync('src/components/KompetensiDashboard.jsx', 'utf8');

const targetStr = `      {/* ── Drill-Down Modal ── */}
      {drill && (
        <DrillDownWrapper
          group={drill}
          rows={rows}
          config={config}
          onClose={()=>setDrill(null)}
        />
      )}
    </div>
  , document.body);
}`;

const replaceStr = `      {/* ── Drill-Down Modal ── */}
      {drill && (
        <DrillDownWrapper
          group={drill}
          rows={rows}
          config={config}
          onClose={()=>setDrill(null)}
          onExport={(title, icdSummaryData, cfg, grp) => handleExportDrillDown(title, icdSummaryData, cfg, grp)}
        />
      )}

      {showPasswordModal && pendingExport && (
        <PasswordModal 
          onClose={() => setShowPasswordModal(false)}
          onConfirm={(pwd) => {
            setShowPasswordModal(false);
            exportToExcel(pendingExport.name, pendingExport.sheets, pwd);
          }}
        />
      )}
    </div>
  , document.body);
}`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync('src/components/KompetensiDashboard.jsx', content);
  console.log('Fixed PasswordModal injection!');
} else {
  console.log('Target string not found!');
}
