export const CONFIG_KEY = 'Akurat_RS_Config';

let icdMap = null;

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
        const levelRaw = parts[5].replace(/['"]/g, '').trim();
        const level = levelRaw.charAt(0).toUpperCase() + levelRaw.slice(1).toLowerCase();
        const levelInt = levelValues[level] || 1;
        if (!icdMap.has(icdCode)) icdMap.set(icdCode, []);
        const existing = icdMap.get(icdCode);
        if (!existing.find(e => e.group === groupName)) {
          existing.push({ group: groupName, level, levelInt });
        }
      }
    }
  } catch (e) {
    console.error('Failed to load Kompetensi CSV:', e);
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

  // ── Totals ──
  let totalPatients = 0;
  let patientsWithinCompetency = 0;
  let patientsOutsideCompetency = 0;
  let totalTarifInacbg = 0;
  let tarifWithinCompetency = 0;
  let tarifOutsideCompetency = 0;
  const levelDistribution = { Dasar: 0, Madya: 0, Utama: 0, Paripurna: 0, 'Belum Ada Mapping': 0 };

  // ── Top outside diags ──
  const outsideDiags = {};

  for (const row of rows) {
    const diagStr = row['DIAGLIST'] || '';
    if (!diagStr) continue;

    const diaglist = diagStr.split(';').map(d => d.trim()).filter(Boolean);
    const mainDiag = diaglist[0] || '';

    const tIna = parseFloat(row['TOTAL_TARIF'] || 0) || 0;
    const tIdrg = parseFloat(row['IDRG_TOTAL_TARIF'] || 0) || 0;
    const isRanap = String(row['PTD'] || '').trim() === '1';

    totalPatients++;
    totalTarifInacbg += tIna;

    let highestLevelRequired = 0;
    let highestLevelName = 'Belum Ada Mapping';
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
  };
}
