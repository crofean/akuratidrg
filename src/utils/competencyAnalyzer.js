export const CONFIG_KEY = 'Akurat_RS_Config';

let icdMap = null;
let icdFallback = null;

// Convert string level to integer for comparison
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
  'Kelompok Layanan Endokrin, Nutrisi, dan Metabolik',
  'Kelompok Layanan Forensik',
  'Kelompok Layanan Gigi dan Mulut',
  'Kelompok Layanan Hematologi',
  'Kelompok Layanan Ibu dan Ginekologi',
  'Kelompok Layanan Infeksi dan Parasit',
  'Kelompok Layanan Jantung & Pembuluh Darah',
  'Kelompok Layanan Jiwa',
  'Kelompok Layanan Keracunan',
  'Kelompok Layanan Kulit dan kelamin',
  'Kelompok Layanan Luka Bakar/Burn',
  'Kelompok layanan Mata',
  'Kelompok Layanan Muskuloskeletal dan jaringan lunak',
  'Kelompok Layanan Neonatus',
  'Kelompok Layanan Neoplasma',
  'Kelompok Layanan Paru & Pernapasan',
  'Kelompok Layanan Pencernaan dan Hepatobilier',
  'Kelompok Layanan Rehabilitasi',
  'Kelompok Layanan Rekonstruksi',
  'Kelompok Layanan Syaraf - Neuroscience',
  'Kelompok Layanan THT',
  'Kelompok Layanan Trauma dan Multiple Trauma',
  'Kelompok Layanan Uronefro/Ginjal',
];

// Load mapping only once
export async function loadCompetencyCSV(force = false) {
  if (icdMap && !force) return;
  icdMap = new Map();
  try {
    const res = await fetch('./data/ICD Kompetensi Layanan.csv');
    if (!res.ok) { console.warn("Failed to fetch CSV, using empty map."); return; }
    const text = await res.text();
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      if (!line.match(/^\d+;/)) continue;
      const parts = line.split(';');
      if (parts.length >= 6) {
        const groupName = parts[2].trim();
        const icdCode = parts[3].replace(/['"]/g, '').trim();
        const desc = parts[4].replace(/['"]/g, '').trim();
        const levelRaw = parts[5].replace(/['"]/g, '').trim();
        const level = levelRaw.charAt(0).toUpperCase() + levelRaw.slice(1).toLowerCase();
        const levelInt = levelValues[level] || 1;
        if (!icdMap.has(icdCode)) icdMap.set(icdCode, []);
        const existing = icdMap.get(icdCode);
        if (!existing.find(e => e.group === groupName)) {
          existing.push({ group: groupName, level: level, levelInt: levelInt, desc: desc });
        }
      }
    }
    try {
      const fbRes = await fetch('./data/icd_fallback.json');
      if (fbRes.ok) icdFallback = await fbRes.json();
    } catch(e) { console.warn("No fallback JSON", e); }
  } catch (err) { console.error('Failed to load Kompetensi CSV:', err);
  }
}

export function getAvailableGroups() {
  if (!icdMap) return [];
  const set = new Set();
  for (const entries of icdMap.values()) {
    for (const e of entries) set.add(e.group);
  }
  return Array.from(set).sort();
}

const parseTarif = (valStr) => {
  if (!valStr) return 0;
  let s = valStr.toString().trim().replace(/['"]/g, '');
  s = s.replace(/[,.]00$/, '').replace(/[,.]/g, '');
  return parseFloat(s) || 0;
};

// ─── Main Analysis ──────────────────────────────────────────────────────────
export async function analyzeCompetency(rows, myCompetencies = {}) {
  await loadCompetencyCSV(true);

  // ── Tabel 1: Distribusi Level ICD (Dasar/Madya/Utama/Paripurna/Belum) ──
  // Setiap level: { sesuai: {kasus,ina,idrg}, loss: {kasus,ina,idrg} }
  const levelStats = {};
  for (const lv of LEVEL_ORDER) {
    levelStats[lv] = {
      sesuaiKasus: 0, sesuaiIna: 0, sesuaiIdrg: 0,
      lossKasus: 0, lossIna: 0, lossIdrg: 0,
    };
  }

  // ── Tabel 2: Per-kelompok layanan RS ──
  // Tiap group: { ranap: { level: {kasus, ina, idrg} }, rajal: { level: {...} } }
  const mkGroup = () => {
    const sub = {};
    for (const lv of LEVEL_ORDER) sub[lv] = { kasus: 0, ina: 0, idrg: 0 };
    sub['unknown'] = { kasus: 0, ina: 0, idrg: 0 };
    return sub;
  };

  const groupStats = {};
  for (const g of ALL_GROUPS) {
    groupStats[g] = { ranap: mkGroup(), rajal: mkGroup() };
  }

  const topDiagSesuai = {};
  const topDiagTidakSesuai = {};
  const topProcSesuai = {};
  const topProcTidakSesuai = {};
  const groupDetails = {};
  // Helper to init groupDetails
  const initGroupDetail = (g) => {
    if (!groupDetails[g]) groupDetails[g] = { totalKasus: 0, sesuaiKasus: 0, sesuaiIna: 0, sesuaiIdrg: 0, lossKasus: 0, lossIna: 0, lossIdrg: 0 };
  };

  // ── Totals ──
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

  // ── Top outside diags ──
  const outsideDiags = {};

  for (const row of rows) {
    const diagStr = row['DIAGLIST'] || '';
    if (!diagStr) continue;

    const diaglist = diagStr.split(';').map(d => d.trim()).filter(Boolean);
    const mainDiag = diaglist[0] || '';

    const tIna = parseFloat(row['TOTAL_TARIF'] || 0) || 0;
    const tIdrg = parseFloat(row['IDRG_TOTAL_TARIF'] || 0) || 0;
    const isRanap = String(row['PTD'] || row['JENIS_RAWAT'] || row['PELAYANAN'] || '').trim() === '1';
    const dateStr = row['DISCHARGE_DATE'] || row['TGL_PULANG'] || '';
    let monthKey = '0000-00';
    if (dateStr) {
      if (dateStr.includes('-')) {
        const parts = dateStr.split(' ')[0].split('-');
        if (parts.length >= 2) monthKey = `${parts[0]}-${parts[1]}`;
      } else if (dateStr.includes('/')) {
        const parts = dateStr.split(' ')[0].split('/');
        if (parts.length >= 3) monthKey = `${parts[2]}-${parts[1]}`;
      }
    }
    const inacbgCode = row['INACBG'] || row['KODE_INACBG'] || '';
    let severity = 0;
    if (inacbgCode.includes('-')) {
      const parts = inacbgCode.split('-');
      const roman = parts[parts.length - 1];
      if (roman === 'I') severity = 1;
      else if (roman === 'II') severity = 2;
      else if (roman === 'III') severity = 3;
    }
    const drgCode = row['IDRG_DRG_CODE'] || '';
    const drgDesc = row['IDRG_DRG_DESCRIPTION'] || row['IDRG_DESKRIPSI'] || '';
    const topUp = parseFloat(row['IDRG_TOP_UP'] || 0) || 0;
    const tarifRs = parseFloat(row['TARIF_RS'] || 0) || 0;
    const isUngroupable = drgCode === 'UNGROUPABLE' || (row['IDRG_UNGROUPABLE'] === '1') || !drgCode;
    const isUnmapped = false; // We calculate this below based on competency
    const patientName = row['NAMA_PASIEN'] || row['NAMA'] || 'Unknown';
    const mrn = row['MRN'] || row['NO_RM'] || '-';
    const sep = row['SEP'] || row['NO_SEP'] || row['NO_KLAIM'] || '-';

    totalPatients++;
    totalTarifInacbg += tIna;

    let highestLevelRequired = 0;
    let highestLevelName = 'Belum Ada Mapping';
    let highestGroup = 'Belum Ada Mapping';
    let isWithinCompetency = true;
    const failedGroups = new Set();

    // Per group, track which ICD level appeared (highest among its diags)
    const groupLevelSeen = {}; // groupName -> { level, levelInt }

    // Scan both DIAGLIST and PROCLIST against icdMap
    // (Rehabilitasi, Forensik, etc. use ICD-9 procedure codes in PROCLIST)
    const procStr = row['PROCLIST'] || '';
    const proclist = procStr.split(';').map(p => p.trim()).filter(p => p && p !== '-' && p.toLowerCase() !== 'none');
    const allCodesToCheck = [...new Set([...diaglist, ...proclist])];

    for (const code of allCodesToCheck) {
      const entries = icdMap.get(code);
      if (!entries || entries.length === 0) continue;
      for (const e of entries) {
        // Overall highest level
        if (e.levelInt > highestLevelRequired) {
          highestLevelRequired = e.levelInt;
          highestLevelName = e.level;
          highestGroup = e.group;
        }
        // Per-group highest
        if (!groupLevelSeen[e.group] || e.levelInt > groupLevelSeen[e.group].levelInt) {
          groupLevelSeen[e.group] = { level: e.level, levelInt: e.levelInt };
        }
        // Competency check
        const rsLevelStr = myCompetencies[e.group] || 'Paripurna';
        const rsLevelInt = levelValues[rsLevelStr] ?? 4;
        if (e.levelInt > rsLevelInt) {
          isWithinCompetency = false;
          failedGroups.add(e.group);
        }
      }
    }

    // Assign per-group kasus
    for (const [grp, { level }] of Object.entries(groupLevelSeen)) {
      if (!groupStats[grp]) continue;
      const target = isRanap ? groupStats[grp].ranap : groupStats[grp].rajal;
      const lv = LEVEL_ORDER.includes(level) ? level : 'Belum Ada Mapping';
      target[lv].kasus++;
      target[lv].ina += tIna;
      target[lv].idrg += tIdrg;
    }

    // Level distribution
    levelDistribution[highestLevelName] = (levelDistribution[highestLevelName] || 0) + 1;

    
    // Tracking Group Details
    const gName = highestLevelName !== 'Belum Ada Mapping' ? highestGroup : 'KASUS BELUM MAPPING';
    initGroupDetail(gName);
    groupDetails[gName].totalKasus++;
    if (isWithinCompetency) {
      groupDetails[gName].sesuaiKasus++;
      groupDetails[gName].sesuaiIna += tIna;
      groupDetails[gName].sesuaiIdrg += tIdrg;
    } else {
      groupDetails[gName].lossKasus++;
      groupDetails[gName].lossIna += tIna;
      groupDetails[gName].lossIdrg += tIdrg;
    }

    // Tracking Top 10
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

    if (isWithinCompetency) {
      addCode(diagStr, topDiagSesuai);
      addCode(procStr, topProcSesuai);
    } else {
      addCode(diagStr, topDiagTidakSesuai);
      addCode(procStr, topProcTidakSesuai);
    }


    // Tabel 1: level-based stats
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

    // --- Reports logic (ported from AKSI-APCI) ---
    if (!reports.inaCbg[monthKey]) reports.inaCbg[monthKey] = { monthKey, sl0_c: 0, sl0_t: 0, sl1_c: 0, sl1_t: 0, sl2_c: 0, sl2_t: 0, sl3_c: 0, sl3_t: 0, total_c: 0, total_t: 0 };
    if (!reports.idrg[monthKey]) reports.idrg[monthKey] = { monthKey, d_c: 0, d_t: 0, m_c: 0, m_t: 0, u_c: 0, u_t: 0, p_c: 0, p_t: 0, unmapped_c: 0, unmapped_t: 0, topup_c: 0, topup_t: 0, total_c: 0 };
    if (!reports.gabungan[monthKey]) reports.gabungan[monthKey] = { monthKey, rj_tRs: 0, ri_tRs: 0, inacbg_rj_c: 0, inacbg_ri_c: 0, inacbg_rj_t: 0, inacbg_ri_t: 0, idrg_rj_c: 0, idrg_ri_c: 0, idrg_rj_t: 0, idrg_ri_t: 0, ungroup_c: 0 };

    reports.inaCbg[monthKey][`sl${severity}_c`]++;
    reports.inaCbg[monthKey][`sl${severity}_t`] += tIna;
    reports.inaCbg[monthKey].total_c++;
    reports.inaCbg[monthKey].total_t += tIna;

    const isCurrentUnmapped = highestLevelName === 'Belum Ada Mapping';
    if (isCurrentUnmapped) {
      reports.idrg[monthKey].unmapped_c++; reports.idrg[monthKey].unmapped_t += tIdrg;
      if (reports.unmapped.length < 50) reports.unmapped.push({ mrn, sep, nama: patientName, desc: drgDesc || '-', icd: diaglist.join('; ') || '-', type: isRanap ? 'RANAP' : 'RAJAL', ket: 'Belum Mapping' });
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

  // ── Build Tabel 2 rows ──
  const groupTableRows = ALL_GROUPS.map(g => {
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
    // Totals per group
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
  };
}
