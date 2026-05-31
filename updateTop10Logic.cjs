const fs = require('fs');
let content = fs.readFileSync('src/utils/competencyAnalyzer.js', 'utf8');

const oldLogic = `    // Tracking Top 10
    const addCode = (codeListStr, targetObj) => {
      const codes = codeListStr.split(';').map(d => d.trim()).filter(d => d && d !== '-' && d.toLowerCase() !== 'none');
      codes.forEach(c => {
        if (!targetObj[c]) {
          const entry = icdMap?.get(c)?.[0];
          let dsc = entry ? entry.desc : '-';
          if ((!dsc || dsc === '-') && typeof icdFallback === 'object' && icdFallback !== null) {
            let found = icdFallback[c] || icdFallback[c.replace('.', '')];
            if (!found) {
              for (let i = c.length - 1; i > 1; i--) {
                const slice = c.slice(0, i);
                if (icdFallback[slice]) { found = icdFallback[slice]; break; }
                const sliceNoDot = slice.replace('.', '');
                if (icdFallback[sliceNoDot]) { found = icdFallback[sliceNoDot]; break; }
              }
            }
            if (found) dsc = found;
          }
          targetObj[c] = { code: c, desc: dsc, kasus: 0, ina: 0, idrg: 0 };
        }
        targetObj[c].kasus++;
        targetObj[c].ina += tIna;
        targetObj[c].idrg += tIdrg;
      });
    };

    if (highestLevelName !== 'Belum Ada Mapping') {
      if (isWithinCompetency) {
        addCode(diagStr, topDiagSesuai);
        addCode(procStr, topProcSesuai);
      } else {
        addCode(diagStr, topDiagTidakSesuai);
        addCode(procStr, topProcTidakSesuai);
      }
    }`;

const newLogic = `    // Tracking Top 10 per ICD Code
    const processCodes = (codeListStr, targetSesuai, targetTidakSesuai) => {
      const codes = codeListStr.split(';').map(d => d.trim()).filter(d => d && d !== '-' && d.toLowerCase() !== 'none');
      codes.forEach(c => {
        const entry = icdMap?.get(c)?.[0];
        
        if (!entry || !entry.level || entry.level === 'Belum Ada Mapping') {
           // Skip completely if not mapped
           return; 
        }

        const rsLevelStr = myCompetencies[entry.group] || 'Paripurna';
        const rsLevelInt = levelValues[rsLevelStr] ?? 4;
        const codeSesuai = entry.levelInt <= rsLevelInt;

        const targetObj = codeSesuai ? targetSesuai : targetTidakSesuai;

        if (!targetObj[c]) {
          let dsc = entry.desc || '-';
          if ((!dsc || dsc === '-') && typeof icdFallback === 'object' && icdFallback !== null) {
            let found = icdFallback[c] || icdFallback[c.replace('.', '')];
            if (!found) {
              for (let i = c.length - 1; i > 1; i--) {
                const slice = c.slice(0, i);
                if (icdFallback[slice]) { found = icdFallback[slice]; break; }
                const sliceNoDot = slice.replace('.', '');
                if (icdFallback[sliceNoDot]) { found = icdFallback[sliceNoDot]; break; }
              }
            }
            if (found) dsc = found;
          }
          targetObj[c] = { code: c, desc: dsc, kasus: 0, ina: 0, idrg: 0 };
        }
        targetObj[c].kasus++;
        targetObj[c].ina += tIna;
        targetObj[c].idrg += tIdrg;
      });
    };

    processCodes(diagStr, topDiagSesuai, topDiagTidakSesuai);
    processCodes(procStr, topProcSesuai, topProcTidakSesuai);`;

if (content.includes(oldLogic)) {
  content = content.replace(oldLogic, newLogic);
  fs.writeFileSync('src/utils/competencyAnalyzer.js', content);
  console.log('Replaced successfully');
} else {
  console.log('Could not find old logic to replace.');
}
