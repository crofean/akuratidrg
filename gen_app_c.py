#!/usr/bin/env python3
C = """
  const dashData = useMemo(() => {
    const rawRows = uploadedFiles.flatMap(f => f.rows);
    if (rawRows.length === 0) return null;
    const rows = rawRows.filter(row => {
      if (globalFilter.periode !== 'All') { const dObj = parseDate(row['DISCHARGE_DATE']); if (!dObj || `${dObj.getFullYear()}-${String(dObj.getMonth()+1).padStart(2,'0')}` !== globalFilter.periode) return false; }
      if (globalFilter.jenisRawat !== 'All' && String(row['PTD']||'').trim() !== globalFilter.jenisRawat) return false;
      const kls = String(row['KELAS_RAWAT'] || row['KELAS'] || row['HAK_KELAS'] || '').trim();
      if (globalFilter.kelasRawat !== 'All' && kls !== globalFilter.kelasRawat) return false;
      if (globalFilter.dpjp !== 'All' && normDpjp(row['DPJP']) !== globalFilter.dpjp) return false;
      return true;
    });

    if (rows.length === 0) return { rawRows: rows, totalRows: 0, isEmptyAfterFilter: true };

    let stats = { tIna:0, tIdrg:0, cInaHigh:0, cIdrgHigh:0, cEq:0, selisihList:[], totalScoreDiag:0, totalScoreProc:0, ranapCount:0, anomaliKasus:0, naikKelasKasus:0, naikKelasNilai:0 };
    let maps = { monthly:{}, drg:{}, report:{}, severity:{}, dpjp:{}, diagU:{}, diagS:{}, proc:{}, ina:{}, idrg:{}, slClShift:{}, coder:{}, naikKelas:{}, discharge:{"1":0,"2":0,"3":0,"4":0,"5":0}, sev:{"1":0,"2":0,"3":0}, cl:{"0":0,"1":0,"2":0,"3":0,"4":0,"9":0}, icu:{total:0, sev1:0, sev2:0, sev3:0, anomalies:[]}, inaToIdrg:{}, idrgToIna:{}, discrepancies:[], audit:[] };
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

    rows.forEach((r, idx) => {
      const tIna = parseFloat(r['TOTAL_TARIF']) || 0; const tIdrg = parseFloat(r['IDRG_TOTAL_TARIF']) || 0;
      const tRS = parseFloat(r['TARIF_RS']) || parseFloat(r['BIAYA_RS']) || parseFloat(r['TOTAL_TARIF_RS']) || parseFloat(r['TARIF_RS_COST']) || 0;
      const sel = tIdrg - tIna; const inaCode = String(r['INACBG'] || '').trim(); const drgCode = String(r['IDRG_DRG_CODE'] || '').trim();
      
      stats.tIna += tIna; stats.tIdrg += tIdrg; stats.selisihList.push(sel);
      
      const rndIna = Math.round(tIna); const rndIdrg = Math.round(tIdrg);
      if (rndIna > rndIdrg) stats.cInaHigh++; else if (rndIdrg > rndIna) stats.cIdrgHigh++; else stats.cEq++;

      const dObj = parseDate(r['DISCHARGE_DATE']); const isRanap = String(r['PTD']||'').trim() === '1';
      if (dObj) {
         const mKey = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}`;
         if (!maps.monthly[mKey]) maps.monthly[mKey] = { label: `${monthNames[dObj.getMonth()]} '${String(dObj.getFullYear()).slice(-2)}`, inacbg:0, idrg:0, selisih:0, tarifRs:0, sortVal: dObj.getTime() };
         maps.monthly[mKey].inacbg += tIna; maps.monthly[mKey].idrg += tIdrg; maps.monthly[mKey].selisih += sel; maps.monthly[mKey].tarifRs += tRS;
         
         if (!maps.report[mKey]) maps.report[mKey] = { label: `${monthNames[dObj.getMonth()]} - ${dObj.getFullYear()}`, sortVal: dObj.getTime(), tarifRsTotal: 0, kasusRajal: 0, kasusRanap: 0, inaRajal: 0, inaRanap: 0, idrgRajal: 0, idrgRanap: 0 };
         maps.report[mKey].tarifRsTotal += tRS;
         if (isRanap) { maps.report[mKey].kasusRanap++; maps.report[mKey].inaRanap+=tIna; maps.report[mKey].idrgRanap+=tIdrg; } else { maps.report[mKey].kasusRajal++; maps.report[mKey].inaRajal+=tIna; maps.report[mKey].idrgRajal+=tIdrg; }
         
         if (!maps.severity[mKey]) maps.severity[mKey] = { label: `${monthNames[dObj.getMonth()]} - ${dObj.getFullYear()}`, sortVal: dObj.getTime(), sl0_kasus:0, sl1_kasus:0, sl2_kasus:0, sl3_kasus:0, sl0_rp:0, sl1_rp:0, sl2_rp:0, sl3_rp:0 };
         let sl = -1; if (!isRanap) sl = 0; else { if (inaCode.endsWith('-I')) sl = 1; else if (inaCode.endsWith('-II')) sl = 2; else if (inaCode.endsWith('-III')) sl = 3; else sl = 1; }
         if (sl === 0) { maps.severity[mKey].sl0_kasus++; maps.severity[mKey].sl0_rp += tIna; } else if (sl === 1) { maps.severity[mKey].sl1_kasus++; maps.severity[mKey].sl1_rp += tIna; } else if (sl === 2) { maps.severity[mKey].sl2_kasus++; maps.severity[mKey].sl2_rp += tIna; } else if (sl === 3) { maps.severity[mKey].sl3_kasus++; maps.severity[mKey].sl3_rp += tIna; }
      }

      if (drgCode && drgCode !== '-') {
         if (!maps.drg[drgCode]) maps.drg[drgCode] = { desc: String(r['IDRG_DRG_DESCRIPTION'] || '-'), sumIna: 0, sumIdrg: 0, count: 0, sumRS: 0 };
         maps.drg[drgCode].sumIna += tIna; maps.drg[drgCode].sumIdrg += tIdrg; maps.drg[drgCode].sumRS += tRS; maps.drg[drgCode].count++;
      }
      if (inaCode && inaCode !== '-') {
         if (!maps.ina[inaCode]) maps.ina[inaCode] = { code: inaCode, desc: String(r['DESKRIPSI_INACBG'] || '-'), count: 0, sumRS: 0, sumIna: 0 };
         maps.ina[inaCode].count++; maps.ina[inaCode].sumRS += tRS; maps.ina[inaCode].sumIna += tIna;
      }

      const dList = String(r['DIAGLIST'] || '').split(';').map(d => d.trim()).filter(d => d);
      const pList = String(r['PROCLIST'] || '').split(';').map(p => p.trim()).filter(p => p && p !== '-' && p.toLowerCase() !== 'none');
      const np = normDpjp(r['DPJP']);
      if (!maps.dpjp[np]) maps.dpjp[np] = { name: String(r['DPJP'] || 'Unknown'), normName: np, count: 0, sumRS: 0, sumIna: 0, sumIdrg: 0, comps: compKeys.reduce((a,c)=>({...a,[c.key]:0}),{}) };
      maps.dpjp[np].count++; maps.dpjp[np].sumRS+=tRS; maps.dpjp[np].sumIna+=tIna; maps.dpjp[np].sumIdrg+=tIdrg;
      const c18 = extract18(r); for(let k in c18) maps.dpjp[np].comps[k] += c18[k];
      
      let ds = String(r['DISCHARGE_STATUS'] || r['STATUS_PULANG'] || r['CARA_PULANG'] || '').trim();
      maps.discharge[['1','2','3','4'].includes(ds) ? ds : "5"]++;
      
      if(dList.length > 0) {
        if(!dList[0].toUpperCase().startsWith('Z')) maps.diagU[dList[0]] = (maps.diagU[dList[0]]||0) + 1;
        for(let i=1; i<dList.length; i++) maps.diagS[dList[i]] = (maps.diagS[dList[i]]||0) + 1;
      }
      pList.forEach(p => maps.proc[p] = (maps.proc[p]||0) + 1);

      let sev = 0; if (inaCode.endsWith('-I')) sev=1; else if (inaCode.endsWith('-II')) sev=2; else if (inaCode.endsWith('-III')) sev=3;
      if (isRanap) {
        stats.ranapCount++; if (sev > 0) maps.sev[sev.toString()]++;
        const cl = parseInt(drgCode.slice(-1)); 
        if (!isNaN(cl)) {
           if (maps.cl[cl.toString()] !== undefined) maps.cl[cl.toString()]++;
           if (sev > 0) {
              const sK = `SL${sev}_CL${cl}`;
              if (!maps.slClShift[sK]) maps.slClShift[sK] = { sev, cl, count:0, sumIna:0, sumIdrg:0, selisih:0, secDiags:{} };
              maps.slClShift[sK].count++; maps.slClShift[sK].sumIna+=tIna; maps.slClShift[sK].sumIdrg+=tIdrg; maps.slClShift[sK].selisih+=sel;
              for(let i=1; i<dList.length; i++) maps.slClShift[sK].secDiags[dList[i]] = (maps.slClShift[sK].secDiags[dList[i]]||0)+1;
           }
        }
      }

      const matchC2 = String(r['C2'] || '').match(/"selisih_biaya":\\s*\\{\\s*"nilai":\\s*"(\\d+)"\\s*,\\s*"pembayar":\\s*"([^"]+)"\\s*,\\s*"naik_kelas":\\s*"([^"]+)"/);
      if (matchC2 && parseFloat(matchC2[1]) > 0) {
         let kAw = String(r['KELAS_RAWAT'] || r['KELAS'] || r['HAK_KELAS'] || 'Unknown').trim();
         let kAk = String(matchC2[3]).toUpperCase(); let k = `Kelas ${kAw} -> ${kAk}`;
         if (!maps.naikKelas[k]) maps.naikKelas[k] = { awal:`Kelas ${kAw}`, awalRaw:kAw, akhir:kAk, pembayar:String(matchC2[2]).toUpperCase(), count:0, totalNilai:0, sev1:0, sev2:0, sev3:0 };
         maps.naikKelas[k].count++; maps.naikKelas[k].totalNilai+=parseFloat(matchC2[1]);
         if(sev===1) maps.naikKelas[k].sev1++; else if(sev===2) maps.naikKelas[k].sev2++; else if(sev===3) maps.naikKelas[k].sev3++;
         stats.naikKelasKasus++; stats.naikKelasNilai+=parseFloat(matchC2[1]);
      }

      const icuInd = String(r['ICU_INDIKATOR']||'').trim(); const icuLos = parseFloat(r['ICU_LOS']||0); const ventHour = parseFloat(r['VENT_HOUR']||0);
      if (icuInd === '1' || icuLos > 0 || ventHour > 0) {
          maps.icu.total++; if (sev>0) maps.icu[`sev${sev}`]++;
          if (pList.includes('96.71') && ventHour >= 96) maps.icu.anomalies.push({ mrn: String(r['MRN']||'-'), sep: String(r['SEP']||'-'), ventHour, issue: 'Kode 96.71 (<96 Jam) tapi aktual >= 96 jam', severity: sev });
          if (pList.includes('96.72') && ventHour < 96) maps.icu.anomalies.push({ mrn: String(r['MRN']||'-'), sep: String(r['SEP']||'-'), ventHour, issue: 'Kode 96.72 (>96 Jam) tapi aktual < 96 jam', severity: sev });
      }

      if (inaCode && inaCode !== '-' && drgCode && drgCode !== '-') {
        if(!maps.inaToIdrg[inaCode]) maps.inaToIdrg[inaCode] = { desc: String(r['DESKRIPSI_INACBG'] || '-'), targets: {} };
        const tK = drgCode + " (" + String(r['IDRG_DRG_DESCRIPTION'] || '-') + ")";
        if(!maps.inaToIdrg[inaCode].targets[tK]) maps.inaToIdrg[inaCode].targets[tK] = { count: 0, secDiags: {} };
        maps.inaToIdrg[inaCode].targets[tK].count++;
        for(let i=1; i<dList.length; i++) maps.inaToIdrg[inaCode].targets[tK].secDiags[dList[i]] = (maps.inaToIdrg[inaCode].targets[tK].secDiags[dList[i]] || 0) + 1;
      }

      const idrgDList = String(r['IDRG_DIAG_LISTS'] || '').split(';').map(d => d.trim()).filter(d => d);
      const idrgPList = String(r['IDRG_PROC_LISTS'] || '').split(';').map(p => p.trim()).filter(p => p && p !== '-' && p.toLowerCase() !== 'none');
      const sDiag = checkMatchList(dList, idrgDList, ['KG', 'HL', 'NL', 'KND', 'G89', 'U82', 'U83', 'U84']);
      const sProc = checkMatchList(pList, idrgPList, ['99.290']);
      stats.totalScoreDiag += sDiag; stats.totalScoreProc += sProc;
      
      const cId = String(r['CODER_ID'] || r['USER_CODER'] || r['CODER'] || 'UNKNOWN').trim().toUpperCase();
      if (!maps.coder[cId]) maps.coder[cId] = { id: cId, cases: 0, discrepancyCount: 0, auditHits: 0 };
      maps.coder[cId].cases++;

      if (sDiag < 100 || sProc < 100) { 
         maps.discrepancies.push({ rowIdx: idx, mrn: String(r['MRN']||''), sep: String(r['SEP']||''), diag1: dList, diag2: idrgDList, scoreDiag: sDiag, proc1: pList, proc2: idrgPList, scoreProc: sProc }); 
         maps.coder[cId].discrepancyCount++;
      }

      // We handle inline check instead of using checkCodingRule
      const acRow = [...dList, ...pList]; let hit = false;
      DEFAULT_AUDIT_RULES.forEach(ru => {
        const op = ru.condition?.operator || "OR"; let matched = false;
        if (ru.condition?.type === 'grouped') matched = op === 'AND' ? ru.condition.groups.every(g => g.codes.some(c => acRow.some(ac => ac.startsWith(c)))) : ru.condition.groups.some(g => g.codes.some(c => acRow.some(ac => ac.startsWith(c))));
        else if (ru.condition?.codes) matched = ru.condition.codes.some(c => acRow.some(ac => ac.startsWith(c)));
        
        if (matched) {
          maps.audit.push({ ruleId: String(ru.id || 'N/A'), case: String(ru.case || 'Spesifik'), warning: String(ru.validation_action?.warning_message || ""), mrn: String(r['MRN']||'-'), sep: String(r['SEP']||'-'), codes: acRow.join(', ') });
          hit = true;
        }
      });
      if (hit) maps.coder[cId].auditHits++;
    });

    stats.selisihList.sort((a,b)=>a-b);
    const mArray = Object.values(maps.monthly).sort((a,b) => a.sortVal - b.sortVal);
    const maxP = Math.max(...mArray.map(m => Math.max(m.inacbg, m.idrg, m.selisih, m.tarifRs)), 1);
    const minN = Math.min(...mArray.map(m => Math.min(0, m.selisih)), 0);
    const range = maxP + Math.abs(minN);
    
    const drgArr = Object.keys(maps.drg).map(c => ({ code: String(c), desc: String(maps.drg[c].desc), count: maps.drg[c].count, sumRS: maps.drg[c].sumRS, sumIdrg: maps.drg[c].sumIdrg, totalSelisih: maps.drg[c].sumIdrg - maps.drg[c].sumIna })).filter(x=>x.code!=='-');
    const inaArr = Object.keys(maps.ina).map(c => ({ code: String(c), desc: String(maps.ina[c].desc), count: maps.ina[c].count, sumRS: maps.ina[c].sumRS, sumIna: maps.ina[c].sumIna, totalSelisih: maps.ina[c].sumIna - maps.ina[c].sumRS })).filter(x=>x.code!=='-');

    return {
      rawRows: rows, totalRows: rows.length, ...stats, 
      selisihTotal: stats.tIdrg - stats.tIna, rataInacbg: rows.length > 0 ? stats.tIna / rows.length : 0, rataIdrg: rows.length > 0 ? stats.tIdrg / rows.length : 0,
      monthlyArray: mArray, maxPosVal: maxP, absMaxSelisih: Math.max(Math.abs(Math.max(...mArray.map(d=>d.selisih),0)), Math.abs(Math.min(...mArray.map(d=>d.selisih),0)), 1),
      posPct: range > 0 ? (maxP / range) * 100 : 0, negPct: range > 0 ? (Math.abs(minN) / range) * 100 : 0,
      reportArray: Object.values(maps.report).sort((a,b) => a.sortVal - b.sortVal), 
      severityReportArray: Object.values(maps.severity).sort((a,b) => a.sortVal - b.sortVal).map(item => ({...item, total_kasus: item.sl0_kasus + item.sl1_kasus + item.sl2_kasus + item.sl3_kasus, total_rp: item.sl0_rp + item.sl1_rp + item.sl2_rp + item.sl3_rp})),
      drgSummary: drgArr.sort((a,b)=>b.count - a.count), inaSummary: inaArr.sort((a,b)=>b.count - a.count),
      topDefisit: drgArr.filter(x=>x.totalSelisih<0).sort((a,b)=>a.totalSelisih-b.totalSelisih).slice(0,10), topSurplus: drgArr.filter(x=>x.totalSelisih>0).sort((a,b)=>b.totalSelisih-a.totalSelisih).slice(0,10),
      topDefisitIna: inaArr.filter(x=>x.totalSelisih<0).sort((a,b)=>a.totalSelisih-b.totalSelisih).slice(0,10), topSurplusIna: inaArr.filter(x=>x.totalSelisih>0).sort((a,b)=>b.totalSelisih-a.totalSelisih).slice(0,10),
      dpjpSummaryArray: Object.values(maps.dpjp).sort((a,b) => b.count - a.count),
      topDiagUtama: Object.entries(maps.diagU).sort((a,b)=>b[1]-a[1]).slice(0,10), topDiagSekunder: Object.entries(maps.diagS).sort((a,b)=>b[1]-a[1]).slice(0,10), topProc: Object.entries(maps.proc).sort((a,b)=>b[1]-a[1]).slice(0,10),
      dischargeStats: maps.discharge,
      slClShiftArray: Object.values(maps.slClShift).map(item => ({ ...item, topSecDiags: Object.entries(item.secDiags).sort((a,b)=>b[1]-a[1]) })).sort((a, b) => { if(a.sev !== b.sev) return (b.sev || 0) - (a.sev || 0); return (b.cl || 0) - (a.cl || 0); }),
      inaToIdrgMap: maps.inaToIdrg, scorecard: { avgDiag: stats.totalScoreDiag/rows.length, avgProc: stats.totalScoreProc/rows.length, discrepancies: maps.discrepancies },
      auditFindings: maps.audit, kpiCoderArray: Object.values(maps.coder).sort((a,b) => b.cases - a.cases), naikKelasStats: Object.values(maps.naikKelas).sort((a,b)=>b.totalNilai - a.totalNilai), icuStats: maps.icu,
      // FIX: Added the missing fields accessed by renderNaikKelas
      totalKasusNaikKelas: stats.naikKelasKasus,
      totalNilaiNaikKelas: stats.naikKelasNilai
    };
  }, [uploadedFiles, globalFilter]);
"""
with open('src/App.jsx', 'a', encoding='utf-8') as f:
    f.write(C)
print("Part C written:", len(C), "chars")
