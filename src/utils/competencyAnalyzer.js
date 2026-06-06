import Papa from 'papaparse';

export const CONFIG_KEY = 'Akurat_RS_Config';

let icdMap = null;
let icdDescMap = null;
let icdFallback = null;
let mdcDcMap = null;

export const levelValues = {
  'Belum Ada Mapping': 0,
  'Tidak Melayani': 0,
  Dasar: 1,
  Madya: 2,
  Utama: 3,
  Paripurna: 4
};

export const LEVEL_ORDER = ['Dasar', 'Madya', 'Utama', 'Paripurna', 'Belum Ada Mapping'];

export const ALL_GROUPS = [
  'Kelompok Layanan Alergi Imunologi dan Rheumatologi',
  'Kelompok Layanan Endocrine,Nutrition & Metabolic',
  'Kelompok Layanan Forensik',
  'Kelompok Layanan Gigi dan Mulut',
  'Kelompok Layanan Hematologi',
  'Kelompok Layanan Ibu dan Ginekologi',
  'Kelompok Layanan Infeksi dan Parasit',
  'Kelompok Layanan Jantung & Pembuluh darah',
  'Kelompok Layanan Jiwa',
  'Kelompok Layanan Keracunan',
  'Kelompok Layanan Kulit dan kelamin',
  'Kelompok Layanan Luka Bakar/Burn',
  'Kelompok Layanan Muskuloskeletal dan jaringan lunak',
  'Kelompok Layanan Neonatus',
  'Kelompok Layanan Neoplasma',
  'Kelompok Layanan Paru & Pernapasan',
  'Kelompok Layanan Pencernaan dan Hepatobiliar',
  'Kelompok Layanan Rehabilitasi',
  'Kelompok Layanan Rekontruksi dan estetika',
  'Kelompok Layanan Syaraf - Neuroscience',
  'Kelompok Layanan THT',
  'Kelompok Layanan Trauma dan Multiple Trauma',
  'Kelompok Layanan Uronefro/Ginjal',
  'Kelompok layanan Mata'
];

export async function loadCompetencyCSV(force = false) {
  if (icdMap && !force) return;
  icdMap = new Map();
  icdDescMap = new Map();
  
  try {
    const res = await fetch('./data/ICD Kompetensi Layanan.csv');
    if (res.ok) {
      const text = await res.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          results.data.forEach(row => {
             let groupName = row['kel_layanan'] || row['Kelompok layanan'] || row['Kelompok Layanan'];
             let icdCode = row['kode icd'] || row['Kode ICD'] || row['Kode icd'] || row['kode_icd'];
             let desc = row['deskripsi icd/Nama Penyakit'] || row['Deskripsi ICD/Nama Penyakit'] || row['Deskripsi ICD'] || row['deskripsi'];
             let levelRaw = row['RS kompetensi'] || row['Tujuan Kompetensi'] || row['Tujuan kompetensi'] || row['RS Kompetensi'];
             
             if (!groupName || !icdCode || !levelRaw) return;
             
             groupName = groupName.trim();
             icdCode = icdCode.replace(/['"]/g, '').trim();
             desc = desc ? desc.replace(/['"]/g, '').trim() : '';
             levelRaw = levelRaw.replace(/['"]/g, '').trim();
             const level = levelRaw.charAt(0).toUpperCase() + levelRaw.slice(1).toLowerCase();
             const levelInt = levelValues[level] || 1;
             
             if (!icdMap.has(icdCode)) icdMap.set(icdCode, []);
             if (!icdDescMap.has(icdCode) && desc) icdDescMap.set(icdCode, desc);

             const existing = icdMap.get(icdCode);
             if (!existing.find(e => e.group === groupName)) {
               existing.push({ group: groupName, level: level, levelInt: levelInt, desc: desc });
             }
             
             const undotted = icdCode.replace(/\./g, '');
             if (undotted !== icdCode) {
               if (!icdMap.has(undotted)) icdMap.set(undotted, []);
               const existingUndotted = icdMap.get(undotted);
               if (!existingUndotted.find(e => e.group === groupName)) {
                 existingUndotted.push({ group: groupName, level, levelInt, desc });
               }
             }
          });
        }
      });
    }
    
    if (!icdMap.has('Z50.1')) {
      icdMap.set('Z50.1', [{ group: 'Kelompok Layanan Rehabilitasi', level: 'Dasar', levelInt: 1, desc: 'Other physical therapy' }]);
      icdMap.set('Z501', [{ group: 'Kelompok Layanan Rehabilitasi', level: 'Dasar', levelInt: 1, desc: 'Other physical therapy' }]);
      icdDescMap.set('Z50.1', 'Other physical therapy');
    }
  } catch (err) { console.error('Failed to load Kompetensi CSV:', err); }

  try {
    const res2 = await fetch('./data/icd_fallback.json');
    if (res2.ok) icdFallback = await res2.json();
    else icdFallback = {};
  } catch (err) { icdFallback = {}; }

  try {
    const res3 = await fetch('./data/mdc_dc_mapping.json');
    if (res3.ok) mdcDcMap = await res3.json();
    else mdcDcMap = { drg: {}, mdc_dc: {} };
  } catch (err) { mdcDcMap = { drg: {}, mdc_dc: {} }; }
}

export function getAvailableGroups() {
  if (!icdMap) return ALL_GROUPS;
  const set = new Set(ALL_GROUPS);
  for (const entries of icdMap.values()) {
    for (const e of entries) set.add(e.group);
  }
  return Array.from(set).sort();
}

/** Returns the ICD description map (code → description string) from competency mapping */
export function getIcdDescMap() {
  return icdDescMap;
}

/** Returns the comprehensive master ICD fallback dictionary */
export function getIcdFallbackMap() {
  return icdFallback || {};
}

export async function analyzeCompetency(rows, myCompetencies = {}) {
  await loadCompetencyCSV(true);

  const levelStats = {};
  for (const lv of LEVEL_ORDER) {
    levelStats[lv] = {
      sesuaiKasus: 0, sesuaiIna: 0, sesuaiIdrg: 0,
      lossKasus: 0, lossIna: 0, lossIdrg: 0,
    };
  }

  const mkGroup = () => {
    const sub = {};
    for (const lv of LEVEL_ORDER) sub[lv] = { kasus: 0, ina: 0, idrg: 0 };
    sub['unknown'] = { kasus: 0, ina: 0, idrg: 0 };
    return sub;
  };

  const groupStats = {};
  const groupsToTrack = getAvailableGroups();
  for (const g of groupsToTrack) {
    groupStats[g] = { ranap: mkGroup(), rajal: mkGroup() };
  }
  groupStats['KASUS BELUM MAPPING'] = { ranap: mkGroup(), rajal: mkGroup() };
  
  const groupDetails = {};
  const initGroupDetail = (g) => {
    if (!groupDetails[g]) groupDetails[g] = { totalKasus: 0, sesuaiKasus: 0, sesuaiIna: 0, sesuaiIdrg: 0, lossKasus: 0, lossIna: 0, lossIdrg: 0 };
  };

  const topDiagSesuai = {};
  const topDiagTidakSesuai = {};
  const topProcSesuai = {};
  const topProcTidakSesuai = {};

  let totalPatients = 0;
  let patientsWithinCompetency = 0;
  let patientsOutsideCompetency = 0;
  let totalTarifInacbg = 0;
  let tarifWithinCompetency = 0;
  let tarifOutsideCompetency = 0;
  const levelDistribution = { Dasar: 0, Madya: 0, Utama: 0, Paripurna: 0, 'Belum Ada Mapping': 0 };

  const reports = {
    inaCbg: {}, idrg: {}, idrg_ri: {}, idrg_rj: {},
    gabungan: {}, ungroupable: [], unmapped: []
  };

  const outsideDiags = {};

  for (const row of rows) {
    const diagStr = row['DIAGLIST'] || '';
    if (!diagStr) continue;

    const diaglist = diagStr.split(';').map(d => d.trim()).filter(Boolean);
    const mainDiag = diaglist[0] || '';
    const procStr = row['PROCLIST'] || '';
    const proclist = procStr.split(';').map(p => p.trim()).filter(p => p && p !== '-' && p.toLowerCase() !== 'none');

    const tIna = parseFloat(row['TOTAL_TARIF'] || 0) || 0;
    const tIdrg = parseFloat(row['IDRG_TOTAL_TARIF'] || 0) || 0;
    const isRanap = String(row['PTD'] || row['JENIS_RAWAT'] || row['PELAYANAN'] || '').trim() === '1';
    
    let monthKey = '0000-00';
    const dateStr = row['DISCHARGE_DATE'] || row['TGL_PULANG'] || '';
    if (dateStr) {
      if (dateStr.includes('-')) {
        const parts = dateStr.split(' ')[0].split('-');
        if (parts.length >= 2) monthKey = `${parts[0]}-${parts[1]}`;
      } else if (dateStr.includes('/')) {
        const parts = dateStr.split(' ')[0].split('/');
        if (parts.length >= 3) monthKey = `${parts[2]}-${parts[1]}`;
      }
    }

    const birthDateStr = row['BIRTH_DATE'] || '';
    let ageInDays = 999;
    if (birthDateStr && dateStr) {
      const parseDate = (dStr) => {
        if (!dStr) return null;
        if (dStr.includes('/')) { const p = dStr.split('/'); if (p.length >= 3) return new Date(`${p[2]}-${p[1]}-${p[0]}`); }
        else if (dStr.includes('-')) return new Date(dStr);
        return null;
      };
      const bDate = parseDate(birthDateStr), dDate = parseDate(dateStr);
      if (bDate && dDate && !isNaN(bDate.getTime()) && !isNaN(dDate.getTime())) {
        ageInDays = Math.floor(Math.abs(dDate - bDate) / 86400000);
      }
    }
    const sexVal = row['SEX'] || row['JK'] || '';
    
    const inacbgCode = row['INACBG'] || row['KODE_INACBG'] || '';
    let severity = 0;
    if (inacbgCode.includes('-')) {
      const parts = inacbgCode.split('-');
      const roman = parts[parts.length - 1];
      if (roman === 'I') severity = 1;
      else if (roman === 'II') severity = 2;
      else if (roman === 'III') severity = 3;
    }
    const drgCode = String(row['IDRG_DRG_CODE'] || row['INACBG'] || row['inacbg'] || row['cbg'] || row['CBG'] || row['KODE_INACBG'] || '').trim();
    const mdcNum = row['IDRG_MDC_NUMBER'] || row['MDC'] || '';
    const drgDesc = row['IDRG_DRG_DESCRIPTION'] || row['IDRG_DESKRIPSI'] || '';
    const topUp = parseFloat(row['IDRG_TOP_UP'] || 0) || 0;
    const tarifRs = parseFloat(row['TARIF_RS'] || 0) || 0;
    const isUngroupable = drgCode === 'UNGROUPABLE' || (row['IDRG_UNGROUPABLE'] === '1') || !drgCode || String(mdcNum).trim() === '36';
    const patientName = row['NAMA_PASIEN'] || row['NAMA'] || 'Unknown';
    const mrn = row['MRN'] || row['NO_RM'] || '-';
    const sep = row['SEP'] || row['NO_SEP'] || row['NO_KLAIM'] || '-';

    totalPatients++;
    totalTarifInacbg += tIna;

    // --- AKSI APCI LOGIC ---
    let primaryGroup = null;
    let drgTrigger = null;

    if (mdcDcMap && drgCode) {
      const cleanDrg = String(drgCode).trim();
      if (mdcDcMap.drg && mdcDcMap.drg[cleanDrg]) {
        primaryGroup = mdcDcMap.drg[cleanDrg];
        // Ensure prefix if AKSI uses different names vs SAK-iDRG
        // Wait, mdc_dc_mapping returns e.g. "Jantung & Pembuluh darah"
        // But ALL_GROUPS uses "Kelompok Layanan Jantung & Pembuluh Darah"
        // Let's try to match it case-insensitively with groupsToTrack
        const matchedGroup = groupsToTrack.find(g => g.toLowerCase() === primaryGroup.toLowerCase() || g.toLowerCase().replace('kelompok layanan ', '') === primaryGroup.toLowerCase());
        if (matchedGroup) {
            primaryGroup = matchedGroup;
        }
        drgTrigger = cleanDrg;
      }
    }

    if (primaryGroup) {
      const gLower = primaryGroup.toLowerCase();
      const isMale = ['1', 'L', 'M', 'LAKI', 'LAKI-LAKI', 'MALE'].includes(sexVal.toString().trim().toUpperCase());
      
      let shouldExclude = false;
      if (gLower.includes('rehabilitasi') && (isRanap || String(mdcNum).trim() !== '35')) shouldExclude = true;
      if (gLower.includes('neonatus') && ageInDays >= 29) shouldExclude = true;
      if ((gLower.includes('obgyn') || gLower.includes('kandungan') || gLower.includes('ibu dan') || gLower.includes('obstetri')) && isMale) shouldExclude = true;

      if (shouldExclude) {
        primaryGroup = null;
      }
    }
    
    let isUnmapped = !primaryGroup && !isUngroupable;
    if (isUnmapped) {
      primaryGroup = 'KASUS BELUM MAPPING';
    }

    // Collect ICD codes not found in icdMap (for display in unmapped table)
    const allIcdsForCheck = [...diaglist, ...proclist];
    const unmappedIcds = allIcdsForCheck.filter(c => {
      if (!c || c === '-' || c.toLowerCase() === 'none') return false;
      const cu = c.toUpperCase().trim();
      return !icdMap?.get(cu) && !icdMap?.get(cu.replace('.','')) && !icdMap?.get(cu.split('.')[0]);
    });

    const allIcds = [...diaglist, ...proclist];
    let primaryLevelStr = 'Belum Ada Mapping';
    let primaryLevelInt = 0;

    const secondaryGroups = new Map();

    for (let icdIndex = 0; icdIndex < allIcds.length; icdIndex++) {
      const icd = allIcds[icdIndex];
      const cleanIcd = icd.toUpperCase().trim();
      if (!cleanIcd) continue;
      
      let needed = icdMap.get(cleanIcd) || icdMap.get(cleanIcd.replace('.', ''));
      if (!needed && cleanIcd.includes('.')) needed = icdMap.get(cleanIcd.split('.')[0]);
      if (!needed) continue;

      for (const n of needed) {
        const gNameLower = n.group.toLowerCase();
        if (gNameLower.includes('neonatus') && ageInDays >= 29) continue;
        const isMale = ['1', 'L', 'M', 'LAKI', 'LAKI-LAKI', 'MALE'].includes(sexVal.toString().trim().toUpperCase());
        if ((gNameLower.includes('obgyn') || gNameLower.includes('kandungan') || gNameLower.includes('ibu dan') || gNameLower.includes('obstetri')) && isMale) continue;
        if (gNameLower.includes('rehabilitasi') && !isRanap && String(mdcNum).trim() !== '35') continue;

        if (n.group === primaryGroup || (primaryGroup && n.group.toLowerCase().replace('kelompok layanan ', '') === primaryGroup.toLowerCase().replace('kelompok layanan ', ''))) {
           if (n.levelInt > primaryLevelInt) {
              primaryLevelInt = n.levelInt;
              primaryLevelStr = n.level;
           }
        } else {
           const existing = secondaryGroups.get(n.group);
           if (!existing || n.levelInt > existing.levelInt) {
              secondaryGroups.set(n.group, { ...n, triggerIcd: cleanIcd });
           }
        }
      }
    }

    if (primaryGroup === 'Layanan Lainnya' && secondaryGroups.size > 0) {
       let bestSecGroup = null;
       let bestSecLevelInt = 0;
       let bestSecLevelStr = '';
       for (const [secGroup, secData] of secondaryGroups.entries()) {
          if (secGroup !== 'KASUS BELUM MAPPING' && secData.levelInt > bestSecLevelInt) {
             bestSecLevelInt = secData.levelInt;
             bestSecGroup = secGroup;
             bestSecLevelStr = secData.level;
          }
       }
       if (bestSecGroup) {
          primaryGroup = bestSecGroup;
          primaryLevelInt = bestSecLevelInt;
          primaryLevelStr = bestSecLevelStr;
          secondaryGroups.delete(bestSecGroup);
       }
    }

    let isOutsideOverall = false;

    // Check myCompetencies correctly by trying exact match, then matching without prefix
    const checkComp = (groupName) => {
        let rsLevelStr = myCompetencies[groupName];
        if (!rsLevelStr) {
           const noPrefix = groupName.replace(/Kelompok Layanan /i, '').trim();
           // Try to find a key in myCompetencies that matches noPrefix
           const matchingKey = Object.keys(myCompetencies).find(k => k.replace(/Kelompok Layanan /i, '').trim().toLowerCase() === noPrefix.toLowerCase());
           if (matchingKey) rsLevelStr = myCompetencies[matchingKey];
        }
        return rsLevelStr || 'Tidak Melayani'; // fallback to Tidak Melayani instead of Belum Diatur so it blocks
    };

    if (primaryGroup && primaryGroup !== 'KASUS BELUM MAPPING') {
       const rsLevelStr = checkComp(primaryGroup);
       const rsLevelInt = levelValues[rsLevelStr] || 0;
       if (rsLevelInt < primaryLevelInt) {
           isOutsideOverall = true;
       }
    }

    for (const [secGroup, secData] of secondaryGroups.entries()) {
       const rsLevelStr = checkComp(secGroup);
       const rsLevelInt = levelValues[rsLevelStr] || 0;
       if (rsLevelInt < secData.levelInt) {
           isOutsideOverall = true;
       }
    }
    
    const isWithinCompetency = !isOutsideOverall;

    let overallMaxLevelStr = primaryLevelStr;
    let overallMaxLevelInt = primaryLevelInt;

    if (overallMaxLevelInt === 0 && secondaryGroups.size > 0) {
      for (const [secGroup, secData] of secondaryGroups.entries()) {
        if (secGroup !== 'KASUS BELUM MAPPING' && secData.levelInt > overallMaxLevelInt) {
          overallMaxLevelInt = secData.levelInt;
          overallMaxLevelStr = secData.level;
        }
      }
    }

    if (overallMaxLevelInt === 0) {
      overallMaxLevelStr = 'Belum Ada Mapping';
      isUnmapped = true;
    }

    // --- SAK-iDRG INTEGRATION ---
    const highestLevelName = overallMaxLevelStr;
    const highestGroup = primaryGroup || 'KASUS BELUM MAPPING';

    // ATTACH METADATA FOR DRILL-DOWN FILTERING
    row._meta = {
      isOutsideOverall,
      highestLevelName,
      highestGroup,
      severity,
      monthKey,
      isUnmapped,
      isUngroupable,
      unmappedIcds: isUnmapped ? unmappedIcds : []
    };

    if (!groupStats[highestGroup]) groupStats[highestGroup] = { ranap: mkGroup(), rajal: mkGroup() };
    const target = isRanap ? groupStats[highestGroup].ranap : groupStats[highestGroup].rajal;
    const lvTarget = LEVEL_ORDER.includes(overallMaxLevelStr) ? overallMaxLevelStr : 'Belum Ada Mapping';
    target[lvTarget].kasus++;
    target[lvTarget].ina += tIna;
    target[lvTarget].idrg += tIdrg;

    levelDistribution[highestLevelName] = (levelDistribution[highestLevelName] || 0) + 1;

    initGroupDetail(highestGroup);
    groupDetails[highestGroup].totalKasus++;
    if (isWithinCompetency) {
      groupDetails[highestGroup].sesuaiKasus++;
      groupDetails[highestGroup].sesuaiIna += tIna;
      groupDetails[highestGroup].sesuaiIdrg += tIdrg;
    } else {
      groupDetails[highestGroup].lossKasus++;
      groupDetails[highestGroup].lossIna += tIna;
      groupDetails[highestGroup].lossIdrg += tIdrg;
    }

    const processCodes = (codeListStr, targetSesuai, targetTidakSesuai) => {
      const codes = codeListStr.split(';').map(d => d.trim()).filter(d => d && d !== '-' && d.toLowerCase() !== 'none');
      codes.forEach(c => {
        let entry = null;
        const eList = icdMap?.get(c) || icdMap?.get(c.replace('.',''));
        if (eList && eList.length > 0) {
           entry = eList.find(x => x.group === primaryGroup) || eList[0];
        }
        
        if (!entry || !entry.level || entry.level === 'Belum Ada Mapping') {
           return; 
        }

        const targetObj = isWithinCompetency ? targetSesuai : targetTidakSesuai;

        if (!targetObj[c]) {
           let dsc = entry.desc || '-';
           if ((!dsc || dsc === '-') && typeof icdFallback === 'object' && icdFallback !== null) {
              let found = icdFallback[c] || icdFallback[c.replace('.', '')] || icdFallback[c.split('.')[0]];
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
    processCodes(procStr, topProcSesuai, topProcTidakSesuai);

    const lv = LEVEL_ORDER.includes(highestLevelName) ? highestLevelName : 'Belum Ada Mapping';
    if (isWithinCompetency) {
      levelStats[lv].sesuaiKasus++;
      levelStats[lv].sesuaiIna += tIna;
      levelStats[lv].sesuaiIdrg += tIdrg;
    } else {
      levelStats[lv].lossKasus++;
      levelStats[lv].lossIna += tIna;
      levelStats[lv].lossIdrg += tIdrg;
    }

    if (isWithinCompetency) {
      patientsWithinCompetency++;
      tarifWithinCompetency += tIna;
    } else {
      patientsOutsideCompetency++;
      tarifOutsideCompetency += tIna;
      if (mainDiag) {
        if (!outsideDiags[mainDiag]) outsideDiags[mainDiag] = { code: mainDiag, count: 0, tarif: 0 };
        outsideDiags[mainDiag].count++;
        outsideDiags[mainDiag].tarif += tIna;
      }
    }

    if (!reports.inaCbg[monthKey]) reports.inaCbg[monthKey] = { monthKey, sl0_c: 0, sl0_t: 0, sl1_c: 0, sl1_t: 0, sl2_c: 0, sl2_t: 0, sl3_c: 0, sl3_t: 0, total_c: 0, total_t: 0 };
    if (!reports.idrg[monthKey]) reports.idrg[monthKey] = { monthKey, d_c: 0, d_t: 0, m_c: 0, m_t: 0, u_c: 0, u_t: 0, p_c: 0, p_t: 0, unmapped_c: 0, unmapped_t: 0, topup_c: 0, topup_t: 0, total_c: 0 };
    if (!reports.gabungan[monthKey]) reports.gabungan[monthKey] = { monthKey, rj_tRs: 0, ri_tRs: 0, inacbg_rj_c: 0, inacbg_ri_c: 0, inacbg_rj_t: 0, inacbg_ri_t: 0, idrg_rj_c: 0, idrg_ri_c: 0, idrg_rj_t: 0, idrg_ri_t: 0, ungroup_c: 0 };

    reports.inaCbg[monthKey][`sl${severity}_c`]++;
    reports.inaCbg[monthKey][`sl${severity}_t`] += tIna;
    reports.inaCbg[monthKey].total_c++;
    reports.inaCbg[monthKey].total_t += tIna;

    if (isUnmapped) {
      reports.idrg[monthKey].unmapped_c++; reports.idrg[monthKey].unmapped_t += tIdrg;
      // Determine exact reason for being unmapped
      const drgNotInMap = drgCode && (!mdcDcMap?.drg || !mdcDcMap.drg[String(drgCode).trim()]);
      const alasanMapping = drgNotInMap
        ? `DRG "${drgCode}" belum terdaftar di tabel referensi MDC/DC Mapping`
        : `Kode ICD tidak ditemukan di referensi kelompok kompetensi`;
      if (reports.unmapped.length < 500) reports.unmapped.push({
        mrn, sep, nama: patientName,
        desc: drgDesc || '-',
        drgCode: drgCode || '-',
        inacbg: inacbgCode || '-',
        icd: diaglist.join('; ') || '-',
        proclist: proclist.join('; ') || '-',
        unmappedCodes: unmappedIcds,
        alasanMapping,
        type: isRanap ? 'RANAP' : 'RAJAL',
        ket: 'Belum Mapping'
      });
    } else {
      const lvlMap = { Dasar: 'd', Madya: 'm', Utama: 'u', Paripurna: 'p' };
      const lKey = lvlMap[highestLevelName];
      if (lKey) { reports.idrg[monthKey][`${lKey}_c`]++; reports.idrg[monthKey][`${lKey}_t`] += tIdrg; }
    }
    if (topUp > 0) { reports.idrg[monthKey].topup_c++; reports.idrg[monthKey].topup_t += topUp; }
    reports.idrg[monthKey].total_c++;

    if (!isUngroupable && drgCode) {
      const reportDrg = isRanap ? reports.idrg_ri : reports.idrg_rj;
      if (!reportDrg[drgCode]) reportDrg[drgCode] = { drgCode, drgDesc, cases: 0, tRs: 0, tIna: 0, tIdrg: 0 };
      reportDrg[drgCode].cases++; reportDrg[drgCode].tRs += tarifRs;
      reportDrg[drgCode].tIna += tIna; reportDrg[drgCode].tIdrg += tIdrg;
    } else if (isUngroupable) {
      if (reports.ungroupable.length < 50) reports.ungroupable.push({ mrn, sep, nama: patientName, desc: drgDesc || '-', icd: diaglist.join('; ') || '-', type: isRanap ? 'RANAP' : 'RAJAL', ket: 'Ungroupable' });
    }

    const gab = reports.gabungan[monthKey];
    if (isUngroupable) gab.ungroup_c++;
    if (isRanap) {
      gab.ri_tRs += tarifRs; gab.inacbg_ri_c++; gab.inacbg_ri_t += tIna; gab.idrg_ri_c++; gab.idrg_ri_t += tIdrg;
    } else {
      gab.rj_tRs += tarifRs; gab.inacbg_rj_c++; gab.inacbg_rj_t += tIna; gab.idrg_rj_c++; gab.idrg_rj_t += tIdrg;
    }
  }

  const topOutsideDiags = Object.values(outsideDiags)
    .sort((a, b) => b.tarif - a.tarif)
    .slice(0, 10);

  const groupTableRows = Object.keys(groupStats).map(g => {
    const gs = groupStats[g];
    const row = { name: g, ranap: {}, rajal: {} };
    let hasData = false;
    for (const lv of [...LEVEL_ORDER, 'unknown']) {
      const ri = gs.ranap[lv] || { kasus: 0, ina: 0, idrg: 0 };
      const rj = gs.rajal[lv] || { kasus: 0, ina: 0, idrg: 0 };
      row.ranap[lv] = ri;
      row.rajal[lv] = rj;
      if (ri.kasus > 0 || rj.kasus > 0) hasData = true;
    }
    row.totalKasusRI = LEVEL_ORDER.reduce((s, lv) => s + (gs.ranap[lv]?.kasus || 0), 0);
    row.totalKasusRJ = LEVEL_ORDER.reduce((s, lv) => s + (gs.rajal[lv]?.kasus || 0), 0);
    row.totalInaRI = LEVEL_ORDER.reduce((s, lv) => s + (gs.ranap[lv]?.ina || 0), 0);
    row.totalInaRJ = LEVEL_ORDER.reduce((s, lv) => s + (gs.rajal[lv]?.ina || 0), 0);
    row.totalIdrgRI = LEVEL_ORDER.reduce((s, lv) => s + (gs.ranap[lv]?.idrg || 0), 0);
    row.totalIdrgRJ = LEVEL_ORDER.reduce((s, lv) => s + (gs.rajal[lv]?.idrg || 0), 0);
    row.totalKasus = row.totalKasusRI + row.totalKasusRJ;
    row.totalIna = row.totalInaRI + row.totalInaRJ;
    row.totalIdrg = row.totalIdrgRI + row.totalIdrgRJ;
    row.selisih = row.totalIdrg - row.totalIna;
    row.selisihPct = row.totalIna > 0 ? (row.selisih / row.totalIna) * 100 : 0;
    row.hasData = hasData;
    return row;
  });

  const finalReports = {
    inaCbg: Object.values(reports.inaCbg).sort((a, b) => a.monthKey.localeCompare(b.monthKey)),
    idrg: Object.values(reports.idrg).sort((a, b) => a.monthKey.localeCompare(b.monthKey)),
    idrg_ri: Object.values(reports.idrg_ri).sort((a, b) => a.drgCode.localeCompare(b.drgCode)),
    idrg_rj: Object.values(reports.idrg_rj).sort((a, b) => a.drgCode.localeCompare(b.drgCode)),
    gabungan: Object.values(reports.gabungan).sort((a, b) => a.monthKey.localeCompare(b.monthKey)), 
    ungroupable: reports.ungroupable, 
    unmapped: reports.unmapped
  };

  const getTop10 = (obj) => Object.values(obj).sort((a,b) => b.kasus - a.kasus).slice(0, 10);
  const arrGroupDetails = Object.entries(groupDetails).map(([name, d]) => ({ name, ...d }));

  return {
    totalPatients,
    patientsWithinCompetency,
    patientsOutsideCompetency,
    totalTarifInacbg,
    tarifWithinCompetency,
    tarifOutsideCompetency,
    levelDistribution,
    levelStats,
    topOutsideDiags,
    groupTableRows,
    reports: finalReports,
    top10: {
      diagSesuai: getTop10(topDiagSesuai),
      diagTidakSesuai: getTop10(topDiagTidakSesuai),
      procSesuai: getTop10(topProcSesuai),
      procTidakSesuai: getTop10(topProcTidakSesuai)
    },
    groupDetails: arrGroupDetails,
    _icdMap: icdMap,
    _icdDescMap: icdDescMap
  };
}
