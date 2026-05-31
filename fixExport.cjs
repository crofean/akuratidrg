const fs = require('fs');
let c = fs.readFileSync('src/components/KompetensiDashboard.jsx', 'utf8');

const oldHandle = c.match(/const handleExportDrillDown = [\s\S]*?setShowPasswordModal\(true\);\s*};/)[0];
const newHandle = `  const handleExportDrillDown = (title, sheetsArray) => {
    setPendingExport({
      name: 'Rincian_' + String(title).replace(/[^a-zA-Z0-9]/g, '_'),
      sheets: sheetsArray
    });
    setShowPasswordModal(true);
  };`;
c = c.replace(oldHandle, newHandle);

const buttonRegex = /<button onClick=\{\(\) => \{ if\(onExport\) onExport\('DrillDown_'\+dn\(group\), icdSummary, config, group\); \}\} className="flex items-center gap-2 px-3 py-1\.5 bg-white\/10 hover:bg-teal-500 rounded-lg text-xs font-bold transition-colors">\s*<Download size=\{14\}\/> Download Excel\s*<\/button>/;

const newButton = `<button onClick={() => { 
              if(onExport) {
                const sheetICD = {
                  name: 'Ringkasan_ICD',
                  columns: [
                    { header: 'No', key: 'no', width: 5 },
                    { header: 'Kode ICD', key: 'code', width: 15 },
                    { header: 'Deskripsi', key: 'desc', width: 50 },
                    { header: 'Komp. RS', key: 'komprs', width: 20 },
                    { header: 'Level ICD', key: 'levelicd', width: 20 },
                    { header: 'Status', key: 'status', width: 15 },
                    { header: 'Frekuensi', key: 'freq', width: 10 },
                    { header: 'INA-CBG', key: 'ina', width: 20 },
                    { header: 'iDRG', key: 'idrg', width: 20 },
                    { header: 'Selisih', key: 'selisih', width: 20 }
                  ],
                  data: []
                };
                if (icdSummary) {
                  icdSummary.forEach((d, i) => {
                    const rsLevel = config && config[group] ? config[group] : 'Belum Ada Mapping';
                    const rsLevelIdx = LEVEL_ORDER.indexOf(rsLevel);
                    const icdLevelIdx = LEVEL_ORDER.indexOf(d.level);
                    const isSesuai = rsLevel === 'Belum Ada Mapping' ? true : icdLevelIdx <= rsLevelIdx;
            
                    sheetICD.data.push({
                      no: i + 1,
                      code: d.code,
                      desc: d.desc,
                      komprs: rsLevel,
                      levelicd: d.level,
                      status: isSesuai ? 'Sesuai' : 'Tidak Sesuai',
                      freq: d.count,
                      ina: d.ina,
                      idrg: d.idrg,
                      selisih: d.idrg - d.ina
                    });
                  });
                }

                const sheetPasien = {
                  name: 'Data_Pasien',
                  columns: [
                    { header: 'No', key: 'no', width: 5 },
                    { header: 'Rumah Sakit', key: 'rs', width: 30 },
                    { header: 'SEP / No Klaim', key: 'sep', width: 25 },
                    { header: 'Nama Pasien', key: 'nama', width: 30 },
                    { header: 'DPJP', key: 'dpjp', width: 30 },
                    { header: 'Jenis', key: 'jenis', width: 15 },
                    { header: 'Diagnosa Utama', key: 'diag', width: 20 },
                    { header: 'INA-CBG', key: 'ina', width: 20 },
                    { header: 'iDRG', key: 'idrg', width: 20 },
                    { header: 'Selisih', key: 'selisih', width: 20 }
                  ],
                  data: []
                };

                const maskName = (name) => {
                  if (!name || name === '-' || name.length < 3) return name;
                  const parts = name.split(' ');
                  return parts.map(p => {
                    if (p.length <= 2) return p;
                    return p.charAt(0) + '*'.repeat(p.length - 2) + p.charAt(p.length - 1);
                  }).join(' ');
                };

                rows.forEach((r, i) => {
                  const kodeRs = String(r['KODE_RS']||'').trim();
                  const namaRs = rsMap[kodeRs] ? \`\${kodeRs} - \${rsMap[kodeRs]}\` : kodeRs || '-';
                  const sep = r['SEP']||r['NO_SEP']||r['NO_KLAIM']||'-';
                  const patientName = maskName(String(r['NAMA']||r['NAMA_PASIEN']||r['nama']||'-'));
                  const dpjp = maskName(r['DPJP']||'-');
                  const mainDiag = (r['DIAGLIST']||'').split(';')[0]?.trim()||'-';
                  const ina = parseFloat(r['TOTAL_TARIF'])||0;
                  const idrg = parseFloat(r['IDRG_TOTAL_TARIF'])||0;
                  const sel = idrg - ina;
                  const jenis = String(r['PTD']||'').trim()==='1' ? 'Ranap' : 'Rajal';

                  sheetPasien.data.push({
                    no: i + 1,
                    rs: namaRs,
                    sep: sep,
                    nama: patientName,
                    dpjp: dpjp,
                    jenis: jenis,
                    diag: mainDiag,
                    ina: ina,
                    idrg: idrg,
                    selisih: sel
                  });
                });

                onExport(dn(group), [sheetPasien, sheetICD]);
              }
            }} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-teal-500 rounded-lg text-xs font-bold transition-colors">
              <Download size={14}/> Download Excel
            </button>`;

if (c.match(buttonRegex)) {
  c = c.replace(buttonRegex, newButton);
  fs.writeFileSync('src/components/KompetensiDashboard.jsx', c);
  console.log('Fixed export to include Pasien sheet!');
} else {
  console.log('Button not found!');
}
