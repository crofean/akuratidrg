const fs = require('fs');
let c = fs.readFileSync('src/components/KompetensiDashboard.jsx', 'utf8');

// Fix 1: Add isOpen={true} to PasswordModal
c = c.replace(/<PasswordModal/, '<PasswordModal isOpen={true}');

// Fix 2: Modify copyTable to handle both tabs
const copyTableRegex = /const copyTable = \(\) => \{[\s\S]*?copyToClipboardHtml\(headers, rows, `Drill-Down: \$\{dn\(group\)\}`\);\s*\};/;
const newCopyTable = `  const copyTable = () => {
    if (tab === 'patients') {
      const headers = ["No", "Rumah Sakit", "SEP / No Klaim", "Nama Pasien", "DPJP", "Jenis", "Diagnosa Utama", "INA-CBG", "iDRG", "Selisih"];
      const r = matchedRows.map((r, i) => {
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
        return [
          i+1, namaRs, sep, patientName, dpjp, jenis, mainDiag,
          \`Rp \${ina.toLocaleString('id-ID')}\`,
          \`Rp \${idrg.toLocaleString('id-ID')}\`,
          \`\${sel >= 0 ? '+' : ''}Rp \${sel.toLocaleString('id-ID')}\`
        ];
      });
      copyToClipboardHtml(headers, r, \`Data Pasien: \${dn(group)}\`);
    } else {
      const headers = ["No", "Kode ICD", "Deskripsi", "Komp. RS", "Level ICD", "Status", "Frekuensi", "INA-CBG", "iDRG", "Selisih"];
      const r = icdSummary.map((d, i) => {
        const rsLevel = config && config[group] ? config[group] : 'Belum Ada Mapping';
        const rsLevelIdx = LEVEL_ORDER.indexOf(rsLevel);
        const icdLevelIdx = LEVEL_ORDER.indexOf(d.level);
        const isSesuai = rsLevel === 'Belum Ada Mapping' ? true : icdLevelIdx <= rsLevelIdx;
        const sel = d.idrg - d.ina;
        return [
          i+1, d.code, d.desc, rsLevel, d.level, isSesuai ? 'Sesuai' : 'Tidak Sesuai', d.count,
          \`Rp \${d.ina.toLocaleString('id-ID')}\`,
          \`Rp \${d.idrg.toLocaleString('id-ID')}\`,
          \`\${sel >= 0 ? '+' : ''}Rp \${sel.toLocaleString('id-ID')}\`
        ];
      });
      copyToClipboardHtml(headers, r, \`Ringkasan ICD: \${dn(group)}\`);
    }
  };`;

if (c.match(copyTableRegex)) {
  c = c.replace(copyTableRegex, newCopyTable);
  fs.writeFileSync('src/components/KompetensiDashboard.jsx', c);
  console.log('Fixed PasswordModal and copyTable!');
} else {
  console.log('copyTable not found!');
}
