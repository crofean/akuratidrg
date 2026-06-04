import pptxgen from "pptxgenjs";

// ---------------------------------------------------------------------------
// SHARED HELPERS
// ---------------------------------------------------------------------------
const initPptx = (title, subject) => {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9"; // 10 x 5.625 inches
  pptx.author = "Akurat-iDRG System";
  pptx.company = "Faskes";
  pptx.subject = subject || "Laporan Akurat-iDRG";
  pptx.title = title || "Laporan";
  return pptx;
};

const sharedStyle = () => ({
  titleProps: { x: 0.5, y: 0.25, w: 9.0, h: 0.55, color: "0f172a", fontSize: 22, bold: true, fontFace: "Arial" },
  subProps:   { x: 0.5, y: 0.82, w: 9.0, h: 0.32, color: "64748b", fontSize: 12, fontFace: "Arial" },
  tableHeaderProps: { fill: "0d9488", color: "ffffff", bold: true, fontFace: "Arial", fontSize: 9, align: "center", valign: "middle" },
  tableCellProps:   { fontFace: "Arial", fontSize: 8.5, valign: "middle", border: { pt: 0.5, color: "e2e8f0" } },
  formatRp: (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0),
});

const addCover = (pptx, line1, line2) => {
  const slide = pptx.addSlide();
  slide.background = { fill: "0d9488" };
  slide.addText(line1, { x: 1, y: 1.8, w: 8, fontSize: 32, bold: true, color: "ffffff", align: "center", fontFace: "Arial" });
  slide.addText(line2 || "", { x: 1, y: 2.7, w: 8, fontSize: 18, color: "ccfbf1", align: "center", fontFace: "Arial" });
  slide.addText("Generated: " + new Date().toLocaleDateString('id-ID'), { x: 1, y: 3.3, w: 8, fontSize: 11, color: "99f6e4", align: "center", fontFace: "Arial" });
  slide.addText("Akurat-iDRG System", { x: 1, y: 3.7, w: 8, fontSize: 10, color: "5eead4", align: "center", fontFace: "Arial" });
};

const addTableSlide = (pptx, title, sub, rows, colW, opts = {}) => {
  const { titleProps, subProps } = sharedStyle();
  const slide = pptx.addSlide();
  slide.addText(title, titleProps);
  if (sub) slide.addText(sub, subProps);
  const tableOpts = { x: 0.35, y: 1.25, w: 9.3, colW, autoPage: true, autoPageRepeatHeader: true, margin: 0.05, ...opts };
  slide.addTable(rows, tableOpts);
  return slide;
};

// ---------------------------------------------------------------------------
// MENU 1: EXECUTIVE DASHBOARD
// generateExecutivePPTX(dashData)
// ---------------------------------------------------------------------------
export const generateExecutivePPTX = async (dashData) => {
  if (!dashData) return;
  const pptx = initPptx("Executive Dashboard", "Laporan Analitik Eksekutif JKN");
  const { titleProps, subProps, tableHeaderProps, tableCellProps, formatRp } = sharedStyle();

  addCover(pptx, "LAPORAN ANALITIK EKSEKUTIF JKN", "Ringkasan Kinerja Finansial Klaim BPJS");

  // --- Slide 2: KPI Scorecard ---
  const rawRows = dashData.rawRows || [];
  let totalPasien = rawRows.length;
  let totalRS = 0, totalIna = 0, totalLoss = 0, totalGain = 0;
  rawRows.forEach(r => {
    const rs  = parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
    const ina = parseFloat(r.TOTAL_TARIF || 0) || 0;
    totalRS += rs; totalIna += ina;
    const s = ina - rs;
    if (s < 0) totalLoss += s; else totalGain += s;
  });
  const totalSelisih = totalIna - totalRS;

  const kpi = pptx.addSlide();
  kpi.addText("Ringkasan KPI Eksekutif", titleProps);
  kpi.addText("Indikator kinerja finansial periode aktif", subProps);

  const boxes = [
    { label: "TOTAL KASUS", value: totalPasien.toLocaleString('id-ID') + " Pasien", x: 0.35, y: 1.3, bg: "f8fafc", border: "e2e8f0", tc: "0f172a", lc: "64748b" },
    { label: "TOTAL TARIF RS", value: formatRp(totalRS), x: 5.15, y: 1.3, bg: "f1f5f9", border: "e2e8f0", tc: "334155", lc: "475569" },
    { label: "NET SELISIH INA - RS", value: (totalSelisih >= 0 ? "+" : "") + formatRp(totalSelisih), x: 0.35, y: 2.4, bg: totalSelisih >= 0 ? "ecfdf5" : "fff1f2", border: totalSelisih >= 0 ? "a7f3d0" : "fecdd3", tc: totalSelisih >= 0 ? "065f46" : "9f1239", lc: totalSelisih >= 0 ? "059669" : "e11d48" },
    { label: "TOTAL TARIF INA-CBG", value: formatRp(totalIna), x: 5.15, y: 2.4, bg: "f0fdfa", border: "ccfbf1", tc: "115e59", lc: "0d9488" },
    { label: "POTENSI KERUGIAN (LOSS)", value: formatRp(totalLoss), x: 0.35, y: 3.5, bg: "fff1f2", border: "fecdd3", tc: "9f1239", lc: "e11d48" },
    { label: "POTENSI KEUNTUNGAN (GAIN)", value: formatRp(totalGain), x: 5.15, y: 3.5, bg: "ecfdf5", border: "a7f3d0", tc: "065f46", lc: "059669" },
  ];
  boxes.forEach(b => {
    kpi.addShape(pptx.ShapeType.rect, { x: b.x, y: b.y, w: 4.5, h: 0.85, fill: b.bg, line: { color: b.border, pt: 1 } });
    kpi.addText(b.label, { x: b.x + 0.12, y: b.y + 0.07, w: 4.2, fontSize: 9, color: b.lc, bold: true, fontFace: "Arial" });
    kpi.addText(b.value, { x: b.x + 0.12, y: b.y + 0.35, w: 4.2, fontSize: 16, color: b.tc, bold: true, fontFace: "Arial" });
  });

  // --- Slide 3: Top 10 Loss INA-CBG (Tabel + Bar Chart) ---
  const cbgMap = {};
  rawRows.forEach(r => {
    const code = String(r.INACBG || r.INA_CBG || '-').trim();
    if (!code || code === '-') return;
    if (!cbgMap[code]) cbgMap[code] = { code, count: 0, totalRs: 0, totalIna: 0 };
    const rs  = parseFloat(r.TARIF_RS || r.BIAYA_RS || r.TOTAL_TARIF_RS || 0) || 0;
    const ina = parseFloat(r.TOTAL_TARIF || 0) || 0;
    cbgMap[code].count++; cbgMap[code].totalRs += rs; cbgMap[code].totalIna += ina;
  });
  const topLoss = Object.values(cbgMap)
    .map(c => ({ ...c, selisih: c.totalIna - c.totalRs }))
    .filter(c => c.selisih < 0)
    .sort((a, b) => a.selisih - b.selisih)
    .slice(0, 10);

  if (topLoss.length > 0) {
    const slideLoss = pptx.addSlide();
    slideLoss.addText("Top 10 INA-CBG Loss Terbesar", titleProps);
    slideLoss.addText("INA-CBG dengan akumulasi selisih defisit tertinggi", subProps);

    const rows = [[
      { text: "No",  options: tableHeaderProps },
      { text: "INA-CBG", options: tableHeaderProps },
      { text: "Kasus", options: tableHeaderProps },
      { text: "Total Tarif RS",  options: tableHeaderProps },
      { text: "Total Tarif INA", options: tableHeaderProps },
      { text: "Selisih (Loss)",  options: tableHeaderProps },
    ]];
    topLoss.forEach((c, i) => rows.push([
      { text: String(i+1), options: { ...tableCellProps, align: "center" } },
      { text: c.code, options: { ...tableCellProps, align: "center", bold: true } },
      { text: String(c.count), options: { ...tableCellProps, align: "center" } },
      { text: formatRp(c.totalRs),  options: { ...tableCellProps, align: "right" } },
      { text: formatRp(c.totalIna), options: { ...tableCellProps, align: "right" } },
      { text: formatRp(c.selisih),  options: { ...tableCellProps, align: "right", color: "e11d48", bold: true } },
    ]));
    slideLoss.addTable(rows, { x: 0.35, y: 1.25, w: 5.3, colW: [0.35, 1.0, 0.6, 1.1, 1.1, 1.15] });
    slideLoss.addChart(pptx.ChartType.bar, [{
      name: "Loss (Rp)",
      labels: topLoss.map(c => c.code),
      values: topLoss.map(c => Math.abs(c.selisih))
    }], { x: 5.8, y: 1.25, w: 3.85, h: 4.0, barDir: 'bar', showLegend: false, showValue: false, valAxisHidden: true, catAxisLabelColor: '334155', chartColors: ['e11d48'] });
  }

  // --- Slide 4: Top 10 KSM Defisit ---
  const topKsmDefisit = (dashData.topKsmDefisitIna || []).slice(0, 10);
  if (topKsmDefisit.length > 0) {
    const slideKsm = pptx.addSlide();
    slideKsm.addText("Top 10 KSM Berpotensi Kerugian Finansial", titleProps);
    slideKsm.addText("Kelompok Staf Medis dengan akumulasi defisit terbesar", subProps);

    const rows = [[
      { text: "No", options: tableHeaderProps },
      { text: "Nama KSM", options: tableHeaderProps },
      { text: "Vol Kasus", options: tableHeaderProps },
      { text: "Total Defisit (INA-RS)", options: tableHeaderProps },
    ]];
    topKsmDefisit.forEach((c, i) => rows.push([
      { text: String(i+1), options: { ...tableCellProps, align: "center" } },
      { text: c.name || c.ksm || "-", options: { ...tableCellProps, bold: true } },
      { text: String(c.count || 0), options: { ...tableCellProps, align: "center" } },
      { text: formatRp(Math.abs(c.selisihIna || 0)), options: { ...tableCellProps, align: "right", color: "e11d48", bold: true } },
    ]));
    slideKsm.addTable(rows, { x: 0.35, y: 1.25, w: 5.3, colW: [0.35, 2.4, 0.9, 1.65] });
    slideKsm.addChart(pptx.ChartType.bar, [{
      name: "Defisit (Rp)",
      labels: topKsmDefisit.map(c => String(c.name || c.ksm || '')),
      values: topKsmDefisit.map(c => Math.abs(c.selisihIna))
    }], { x: 5.8, y: 1.25, w: 3.85, h: 4.0, barDir: 'bar', showLegend: false, showValue: false, valAxisHidden: true, catAxisLabelColor: '334155', chartColors: ['0d9488'] });
  }

  // --- Slide 5: Top 10 Diagnosa Utama ---
  const topDiagU = (dashData.topDiagUtama || []).slice(0, 10);
  if (topDiagU.length > 0) {
    const rows = [[
      { text: "No",  options: tableHeaderProps },
      { text: "Kode",  options: tableHeaderProps },
      { text: "Frekuensi", options: tableHeaderProps },
    ]];
    topDiagU.forEach(([code, count], i) => rows.push([
      { text: String(i+1), options: { ...tableCellProps, align: "center" } },
      { text: code, options: { ...tableCellProps, align: "center", bold: true, color: "0d9488" } },
      { text: String(count), options: { ...tableCellProps, align: "center" } },
    ]));

    const slideDiag = pptx.addSlide();
    slideDiag.addText("Top 10 Diagnosa Utama (ICD-10)", titleProps);
    slideDiag.addText("Berdasarkan frekuensi kemunculan sebagai diagnosa primer", subProps);
    slideDiag.addTable(rows, { x: 0.35, y: 1.25, w: 4.5, colW: [0.4, 2.5, 1.6] });
    slideDiag.addChart(pptx.ChartType.bar, [{
      name: "Frekuensi",
      labels: topDiagU.map(([code]) => code),
      values: topDiagU.map(([,count]) => count)
    }], { x: 5.2, y: 1.25, w: 4.45, h: 4.0, barDir: 'bar', showLegend: false, showValue: false, valAxisHidden: true, catAxisLabelColor: '334155', chartColors: ['0d9488'] });
  }

  // --- Slide 6: Top 10 Diagnosa Sekunder ---
  const topDiagS = (dashData.topDiagSekunder || []).slice(0, 10);
  if (topDiagS.length > 0) {
    const rows = [[
      { text: "No", options: tableHeaderProps },
      { text: "Kode", options: tableHeaderProps },
      { text: "Frekuensi", options: tableHeaderProps },
    ]];
    topDiagS.forEach(([code, count], i) => rows.push([
      { text: String(i+1), options: { ...tableCellProps, align: "center" } },
      { text: code, options: { ...tableCellProps, align: "center", bold: true, color: "0284c7" } },
      { text: String(count), options: { ...tableCellProps, align: "center" } },
    ]));

    const slideDS = pptx.addSlide();
    slideDS.addText("Top 10 Diagnosa Sekunder (ICD-10)", titleProps);
    slideDS.addText("Berdasarkan frekuensi kemunculan sebagai diagnosa penyerta", subProps);
    slideDS.addTable(rows, { x: 0.35, y: 1.25, w: 4.5, colW: [0.4, 2.5, 1.6] });
    slideDS.addChart(pptx.ChartType.bar, [{
      name: "Frekuensi",
      labels: topDiagS.map(([code]) => code),
      values: topDiagS.map(([,count]) => count)
    }], { x: 5.2, y: 1.25, w: 4.45, h: 4.0, barDir: 'bar', showLegend: false, showValue: false, valAxisHidden: true, catAxisLabelColor: '334155', chartColors: ['0284c7'] });
  }

  // --- Slide 7: Top 10 Tindakan ---
  const topProc = (dashData.topProc || []).slice(0, 10);
  if (topProc.length > 0) {
    const rows = [[
      { text: "No", options: tableHeaderProps },
      { text: "Kode", options: tableHeaderProps },
      { text: "Frekuensi", options: tableHeaderProps },
    ]];
    topProc.forEach(([code, count], i) => rows.push([
      { text: String(i+1), options: { ...tableCellProps, align: "center" } },
      { text: code, options: { ...tableCellProps, align: "center", bold: true, color: "7c3aed" } },
      { text: String(count), options: { ...tableCellProps, align: "center" } },
    ]));

    const slideProc = pptx.addSlide();
    slideProc.addText("Top 10 Tindakan / Prosedur (ICD-9-CM)", titleProps);
    slideProc.addText("Berdasarkan frekuensi kemunculan pada seluruh klaim", subProps);
    slideProc.addTable(rows, { x: 0.35, y: 1.25, w: 4.5, colW: [0.4, 2.5, 1.6] });
    slideProc.addChart(pptx.ChartType.bar, [{
      name: "Frekuensi",
      labels: topProc.map(([code]) => code),
      values: topProc.map(([,count]) => count)
    }], { x: 5.2, y: 1.25, w: 4.45, h: 4.0, barDir: 'bar', showLegend: false, showValue: false, valAxisHidden: true, catAxisLabelColor: '334155', chartColors: ['7c3aed'] });
  }

  // --- Slide 8: Monitor Naik Kelas ---
  const naikKelas = (dashData.naikKelasStats || []).slice(0, 20);
  if (naikKelas.length > 0) {
    const rows = [[
      { text: "No", options: tableHeaderProps },
      { text: "Hak Kelas", options: tableHeaderProps },
      { text: "Kelas Rawat", options: tableHeaderProps },
      { text: "Pembayar", options: tableHeaderProps },
      { text: "Vol Kasus", options: tableHeaderProps },
      { text: "Total Nilai", options: tableHeaderProps },
    ]];
    naikKelas.forEach((c, i) => rows.push([
      { text: String(i+1), options: { ...tableCellProps, align: "center" } },
      { text: String(c.awal || c.hak || '-'), options: { ...tableCellProps, align: "center", bold: true } },
      { text: String(c.akhir || c.rawat || '-'), options: { ...tableCellProps, align: "center", bold: true, color: "0284c7" } },
      { text: String(c.pembayar || '-'), options: { ...tableCellProps, align: "center" } },
      { text: String(c.count || 0), options: { ...tableCellProps, align: "center" } },
      { text: formatRp(c.totalNilai), options: { ...tableCellProps, align: "right", bold: true } },
    ]));
    addTableSlide(pptx, "Monitor Naik Kelas Rawat", "Pergeseran hak kelas perawatan pasien", rows, [0.35, 1.45, 1.45, 1.45, 0.9, 3.7]);
  }

  // --- Slide 9: Monitor ICU ---
  const icu = dashData.icuStats;
  if (icu) {
    const slideIcu = pptx.addSlide();
    slideIcu.addText("Monitor Perawatan Intensif (ICU)", titleProps);
    slideIcu.addText("Perbandingan kasus ICU vs Non-ICU dan dampak finansial", subProps);

    const icuBoxes = [
      { label: "Total Pasien Non-ICU", value: String(icu.nonIcuCount || 0) + " Pasien", x: 0.35, y: 1.3, bg: "f8fafc", lc: "64748b", tc: "0f172a" },
      { label: "Total Pasien ICU",     value: String(icu.icuCount || 0) + " Pasien",    x: 5.15, y: 1.3, bg: "fff1f2", lc: "e11d48", tc: "9f1239" },
      { label: "Total Tarif INA Non-ICU", value: formatRp(icu.sumInaNonIcu || 0), x: 0.35, y: 2.4, bg: "f1f5f9", lc: "475569", tc: "334155" },
      { label: "Total Tarif INA ICU",     value: formatRp(icu.sumInaIcu || 0),    x: 5.15, y: 2.4, bg: "fff1f2", lc: "e11d48", tc: "9f1239" },
      { label: "Total Tarif RS Non-ICU",  value: formatRp(icu.sumRsNonIcu || 0),  x: 0.35, y: 3.5, bg: "f8fafc", lc: "64748b", tc: "0f172a" },
      { label: "Total Tarif RS ICU",      value: formatRp(icu.sumRsIcu || 0),     x: 5.15, y: 3.5, bg: "fff1f2", lc: "e11d48", tc: "9f1239" },
    ];
    icuBoxes.forEach(b => {
      slideIcu.addShape(pptx.ShapeType.rect, { x: b.x, y: b.y, w: 4.5, h: 0.85, fill: b.bg, line: { color: "e2e8f0", pt: 1 } });
      slideIcu.addText(b.label, { x: b.x + 0.12, y: b.y + 0.07, w: 4.2, fontSize: 9, color: b.lc, bold: true, fontFace: "Arial" });
      slideIcu.addText(b.value, { x: b.x + 0.12, y: b.y + 0.35, w: 4.2, fontSize: 16, color: b.tc, bold: true, fontFace: "Arial" });
    });
  }

  // --- Slide 10: Potensi Top-Up ---
  const topUp = dashData.topUpStats;
  if (topUp && topUp.items && topUp.items.length > 0) {
    const rows = [[
      { text: "No",   options: tableHeaderProps },
      { text: "Kriteria Potensi Top-Up", options: tableHeaderProps },
      { text: "Vol Kasus", options: tableHeaderProps },
      { text: "Total Potensi (Rp)", options: tableHeaderProps },
    ]];
    topUp.items.forEach((c, i) => rows.push([
      { text: String(i+1), options: { ...tableCellProps, align: "center" } },
      { text: c.item || "-", options: tableCellProps },
      { text: String(c.count || 0), options: { ...tableCellProps, align: "center" } },
      { text: formatRp(c.totalPotensi), options: { ...tableCellProps, align: "right", color: "059669", bold: true } },
    ]));
    const subText = `Total: ${topUp.topUpKasus} kasus senilai ${formatRp(topUp.topUpNilai)}`;
    addTableSlide(pptx, "Potensi Top-Up Severity Level", subText, rows, [0.4, 5.0, 1.4, 2.5]);
  }

  return pptx.writeFile({ fileName: `Dashboard_Eksekutif_${new Date().getTime()}.pptx` });
};

// ---------------------------------------------------------------------------
// MENU 2: AUDIT KODING
// generateAuditPPTX(dashData, auditVerdicts)
// ---------------------------------------------------------------------------
export const generateAuditPPTX = async (dashData, auditVerdicts = {}) => {
  if (!dashData || !dashData.auditFindings) return;
  const pptx = initPptx("Audit Koding", "Laporan Audit Kaidah Koding");
  const { titleProps, subProps, tableHeaderProps, tableCellProps } = sharedStyle();

  addCover(pptx, "LAPORAN AUDIT KAIDAH KODING", "Evaluasi Kepatuhan Koding Klinis");

  const findings = dashData.auditFindings || [];
  let sesuai = 0, tidakSesuai = 0, belum = 0;
  findings.forEach(f => {
    const v = auditVerdicts[`${f.sep}|${f.ruleId}`];
    if (v === 'sesuai') sesuai++; else if (v === 'tidak') tidakSesuai++; else belum++;
  });
  const accuracy = (sesuai + tidakSesuai) > 0 ? (sesuai / (sesuai + tidakSesuai) * 100).toFixed(1) : "100.0";

  // Summary Slide
  const slideSum = pptx.addSlide();
  slideSum.addText("Ringkasan Audit Koding", titleProps);
  slideSum.addText("Akumulasi temuan berdasarkan review kaidah koding INA-CBG", subProps);
  const sumBoxes = [
    { label: "Total Temuan", value: String(findings.length), bg: "f1f5f9", tc: "0f172a", lc: "64748b", x: 0.35, y: 1.3 },
    { label: "Skor Akurasi Koder", value: accuracy + "%", bg: Number(accuracy) >= 95 ? "ecfdf5" : "fff1f2", tc: Number(accuracy) >= 95 ? "065f46" : "9f1239", lc: Number(accuracy) >= 95 ? "059669" : "e11d48", x: 5.15, y: 1.3 },
    { label: "Sesuai",          value: String(sesuai),      bg: "ecfdf5", tc: "065f46", lc: "059669", x: 0.35, y: 2.5 },
    { label: "Tidak Sesuai",    value: String(tidakSesuai), bg: "fff1f2", tc: "9f1239", lc: "e11d48", x: 3.5,  y: 2.5 },
    { label: "Belum Review",    value: String(belum),       bg: "fefce8", tc: "713f12", lc: "a16207", x: 6.65, y: 2.5 },
  ];
  sumBoxes.forEach(b => {
    const w = b.x > 5 ? 2.9 : (b.x > 3 ? 2.9 : 4.45);
    slideSum.addShape(pptx.ShapeType.rect, { x: b.x, y: b.y, w, h: 0.9, fill: b.bg, line: { color: "e2e8f0", pt: 1 } });
    slideSum.addText(b.label, { x: b.x+0.12, y: b.y+0.08, w: w-0.2, fontSize: 9, color: b.lc, bold: true, fontFace: "Arial" });
    slideSum.addText(b.value, { x: b.x+0.12, y: b.y+0.38, w: w-0.2, fontSize: 18, color: b.tc, bold: true, fontFace: "Arial" });
  });

  // Pie Chart
  slideSum.addChart(pptx.ChartType.pie, [{
    name: "Status Audit",
    labels: ["Sesuai", "Tidak Sesuai", "Belum Review"],
    values: [sesuai, tidakSesuai, belum]
  }], { x: 1.5, y: 3.7, w: 7.0, h: 1.6, showLegend: true, legendPos: 'r', chartColors: ['059669','e11d48','a16207'], showTitle: false, dataLabelColor: 'ffffff', showPercent: true });

  // Detail Table
  const rows = [[
    { text: "No",  options: tableHeaderProps },
    { text: "SEP", options: tableHeaderProps },
    { text: "Rule ID",  options: tableHeaderProps },
    { text: "Temuan / Kasus",    options: tableHeaderProps },
    { text: "Peringatan",        options: tableHeaderProps },
    { text: "Status Review",     options: tableHeaderProps },
  ]];
  findings.forEach((f, idx) => {
    const v = auditVerdicts[`${f.sep}|${f.ruleId}`] || 'belum';
    const txt = v === 'sesuai' ? 'Sesuai' : v === 'tidak' ? 'Tidak Sesuai' : 'Belum Review';
    const col = v === 'sesuai' ? '059669' : v === 'tidak' ? 'e11d48' : 'a16207';
    rows.push([
      { text: String(idx+1), options: { ...tableCellProps, align: "center" } },
      { text: f.sep || "-", options: tableCellProps },
      { text: f.ruleId || "-", options: { ...tableCellProps, align: "center", bold: true } },
      { text: f.case || "-", options: tableCellProps },
      { text: f.warning || "-", options: { ...tableCellProps, fontSize: 7.5 } },
      { text: txt, options: { ...tableCellProps, align: "center", bold: true, color: col } },
    ]);
  });
  addTableSlide(pptx, "Detail Temuan Audit Koding", `${findings.length} temuan`, rows, [0.35, 1.2, 0.85, 2.1, 3.15, 1.65]);

  return pptx.writeFile({ fileName: `Audit_Koding_${new Date().getTime()}.pptx` });
};

// ---------------------------------------------------------------------------
// MENU 3: PENDING SAKTI
// generatePendingPPTX(dashData)
// ---------------------------------------------------------------------------
export const generatePendingPPTX = async (dashData) => {
  if (!dashData || !dashData.pendingSakti) return;
  const pptx = initPptx("Pending SAKTI", "Laporan Monitor Pending SAKTI");
  const { titleProps, subProps, tableHeaderProps, tableCellProps } = sharedStyle();

  addCover(pptx, "MONITOR PENDING SAKTI", "Daftar Kasus Klaim Tertunda");

  const pending = dashData.pendingSakti || [];
  let internal = 0, eksternal = 0, lainnya = 0;
  pending.forEach(p => {
    if (p.faktor === 'Internal RS') internal++;
    else if (p.faktor === 'Eksternal BPJS') eksternal++;
    else lainnya++;
  });

  // Summary
  const slideSum = pptx.addSlide();
  slideSum.addText("Ringkasan Pending SAKTI", titleProps);
  slideSum.addText(`Total ${pending.length} kasus pending`, subProps);

  const pBoxes = [
    { label: "Total Pending",       value: String(pending.length), bg: "f1f5f9", tc: "0f172a", lc: "64748b", x: 0.35, y: 1.3 },
    { label: "Internal RS",         value: String(internal),       bg: "fff1f2", tc: "9f1239", lc: "e11d48", x: 5.15, y: 1.3 },
    { label: "Eksternal BPJS",      value: String(eksternal),      bg: "eff6ff", tc: "1e3a5f", lc: "0284c7", x: 0.35, y: 2.5 },
    { label: "Belum Teridentifikasi", value: String(lainnya),      bg: "fefce8", tc: "713f12", lc: "a16207", x: 5.15, y: 2.5 },
  ];
  pBoxes.forEach(b => {
    slideSum.addShape(pptx.ShapeType.rect, { x: b.x, y: b.y, w: 4.45, h: 0.9, fill: b.bg, line: { color: "e2e8f0", pt: 1 } });
    slideSum.addText(b.label, { x: b.x+0.12, y: b.y+0.08, w: 4.2, fontSize: 9, color: b.lc, bold: true, fontFace: "Arial" });
    slideSum.addText(b.value, { x: b.x+0.12, y: b.y+0.38, w: 4.2, fontSize: 18, color: b.tc, bold: true, fontFace: "Arial" });
  });
  slideSum.addChart(pptx.ChartType.doughnut, [{
    name: "Faktor Pending",
    labels: ["Internal RS", "Eksternal BPJS", "Lainnya"],
    values: [internal, eksternal, lainnya]
  }], { x: 1.5, y: 3.7, w: 7.0, h: 1.6, showLegend: true, legendPos: 'r', chartColors: ['e11d48','0284c7','a16207'], showTitle: false, dataLabelColor: 'ffffff', showPercent: true });

  // Detail Table
  const rows = [[
    { text: "No",  options: tableHeaderProps },
    { text: "SEP", options: tableHeaderProps },
    { text: "Nama Pasien", options: tableHeaderProps },
    { text: "Keterangan",  options: tableHeaderProps },
    { text: "Kelompok",    options: tableHeaderProps },
    { text: "Faktor",      options: tableHeaderProps },
  ]];
  pending.forEach((c, idx) => {
    const kat = Array.isArray(c.kategori) ? c.kategori.join(', ') : (c.kategori || '-');
    rows.push([
      { text: String(idx+1), options: { ...tableCellProps, align: "center" } },
      { text: c.sep || "-", options: tableCellProps },
      { text: c.nama || "-", options: tableCellProps },
      { text: c.keterangan || "-", options: { ...tableCellProps, fontSize: 7.5 } },
      { text: kat, options: { ...tableCellProps, align: "center" } },
      { text: c.faktor || "-", options: { ...tableCellProps, align: "center", bold: true, color: c.faktor === 'Internal RS' ? 'e11d48' : '0284c7' } },
    ]);
  });
  addTableSlide(pptx, "Detail Daftar Pending SAKTI", `${pending.length} kasus`, rows, [0.35, 1.1, 1.5, 2.6, 1.4, 2.35]);

  return pptx.writeFile({ fileName: `Pending_SAKTI_${new Date().getTime()}.pptx` });
};

// ---------------------------------------------------------------------------
// MENU 4: KPI CODER
// generateKpiCoderPPTX(dashData)
// ---------------------------------------------------------------------------
export const generateKpiCoderPPTX = async (dashData) => {
  if (!dashData || !dashData.kpiCoderArray) return;
  const pptx = initPptx("KPI Coder", "Laporan KPI Coder");
  const { titleProps, subProps, tableHeaderProps, tableCellProps } = sharedStyle();

  addCover(pptx, "KPI & KINERJA CODER", "Evaluasi Performa Petugas Koding Klinis");

  const coders = dashData.kpiCoderArray || [];
  const rows = [[
    { text: "No",  options: tableHeaderProps },
    { text: "ID Koder (Disamarkan)", options: tableHeaderProps },
    { text: "Vol Kasus", options: tableHeaderProps },
    { text: "Temuan Audit", options: tableHeaderProps },
    { text: "Discrepancy INA vs iDRG", options: tableHeaderProps },
  ]];
  coders.forEach((c, i) => rows.push([
    { text: String(i+1), options: { ...tableCellProps, align: "center" } },
    { text: c.id || "-", options: { ...tableCellProps, bold: true } },
    { text: String(c.cases || 0), options: { ...tableCellProps, align: "center" } },
    { text: String(c.auditHits || 0), options: { ...tableCellProps, align: "center", color: c.auditHits > 0 ? "e11d48" : "059669", bold: true } },
    { text: String(c.discrepancyCount || 0), options: { ...tableCellProps, align: "center", color: c.discrepancyCount > 0 ? "e11d48" : "059669", bold: true } },
  ]));
  addTableSlide(pptx, "KPI & Kinerja Coder", `${coders.length} coder terdaftar`, rows, [0.4, 3.0, 1.4, 2.15, 2.35]);

  return pptx.writeFile({ fileName: `KPI_Coder_${new Date().getTime()}.pptx` });
};

// ---------------------------------------------------------------------------
// MENU 5: INSIGHT SOSIALISASI (per KSM)
// generateSosialisasiPPTX({ ksmName, ksmStats, topCases, topUpPotentials, scatterImageBase64, quadrantInsights, topDiag, topSec, topProc })
// ---------------------------------------------------------------------------
export const generateSosialisasiPPTX = async ({ ksmName, ksmStats, topCases, topUpPotentials, scatterImageBase64, quadrantInsights, topDiag, topSec, topProc }) => {
  const pptx = initPptx("Sosialisasi KSM", "Laporan Sosialisasi KMKB");
  const { titleProps, subProps, tableHeaderProps, tableCellProps, formatRp } = sharedStyle();

  addCover(pptx, "LAPORAN SOSIALISASI & EVALUASI KMKB", "KSM: " + ksmName.toUpperCase());

  // Finansial Summary
  const slideFin = pptx.addSlide();
  slideFin.addText("Ringkasan Kinerja - KSM " + ksmName, titleProps);
  slideFin.addText("Evaluasi Finansial dan Volume Kasus", subProps);
  const finBoxes = [
    { label: "Total Kasus KSM",   value: (ksmStats.kasus || 0).toLocaleString('id-ID') + " Kasus", x: 0.35, y: 1.3, bg: "f8fafc", tc: "0f172a", lc: "64748b" },
    { label: "Total Tarif INA",   value: formatRp(ksmStats.ina || 0),                               x: 5.15, y: 1.3, bg: "f0fdfa", tc: "115e59", lc: "0d9488" },
    { label: "Net Selisih (INA-RS)", value: (ksmStats.selisih >= 0 ? '+' : '') + formatRp(ksmStats.selisih || 0), x: 0.35, y: 2.5, bg: ksmStats.selisih >= 0 ? "ecfdf5" : "fff1f2", tc: ksmStats.selisih >= 0 ? "065f46" : "9f1239", lc: ksmStats.selisih >= 0 ? "059669" : "e11d48" },
    { label: "Total Potensi Loss", value: formatRp(ksmStats.loss || 0),                              x: 5.15, y: 2.5, bg: "fff1f2", tc: "9f1239", lc: "e11d48" },
  ];
  finBoxes.forEach(b => {
    slideFin.addShape(pptx.ShapeType.rect, { x: b.x, y: b.y, w: 4.45, h: 0.9, fill: b.bg, line: { color: "e2e8f0", pt: 1 } });
    slideFin.addText(b.label, { x: b.x+0.12, y: b.y+0.08, w: 4.2, fontSize: 9, color: b.lc, bold: true, fontFace: "Arial" });
    slideFin.addText(b.value, { x: b.x+0.12, y: b.y+0.38, w: 4.2, fontSize: 18, color: b.tc, bold: true, fontFace: "Arial" });
  });

  // Scatter Plot & Insights
  if (scatterImageBase64) {
    const slideScatter = pptx.addSlide();
    slideScatter.addText("Analisis Kuadran KMKB - KSM " + ksmName, titleProps);
    slideScatter.addText("Posisi INA-CBG berdasarkan Volume dan Selisih Finansial", subProps);
    slideScatter.addImage({ data: scatterImageBase64, x: 0.35, y: 1.2, w: 5.6, h: 4.1 });
    slideScatter.addText("Rekomendasi Sosialisasi:", { x: 6.2, y: 1.2, w: 3.45, fontSize: 13, bold: true, color: "0f172a", fontFace: "Arial" });
    let yPos = 1.6;
    (quadrantInsights || []).forEach(qi => {
      slideScatter.addText(qi, { x: 6.2, y: yPos, w: 3.45, fontSize: 9.5, color: "334155", bullet: { type: 'bullet', code: '25B6' }, fontFace: "Arial" });
      yPos += 0.8;
    });
  }

  // Top INA-CBG Defisit
  if (topCases && topCases.length > 0) {
    const slideTop = pptx.addSlide();
    slideTop.addText("Top INA-CBG Defisit - KSM " + ksmName, titleProps);
    slideTop.addText("10 kasus penyumbang kerugian terbesar pada KSM ini", subProps);
    const rows = [[
      { text: "No",   options: tableHeaderProps },
      { text: "INA-CBG", options: tableHeaderProps },
      { text: "Vol Kasus",   options: tableHeaderProps },
      { text: "Avg Tarif RS",  options: tableHeaderProps },
      { text: "Avg Tarif INA", options: tableHeaderProps },
      { text: "Total Loss",    options: tableHeaderProps },
    ]];
    topCases.forEach((c, i) => rows.push([
      { text: String(i+1), options: { ...tableCellProps, align: "center" } },
      { text: c.cbg || "-", options: { ...tableCellProps, align: "center", bold: true } },
      { text: String(c.count || 0), options: { ...tableCellProps, align: "center" } },
      { text: formatRp(c.avgRs || 0),  options: { ...tableCellProps, align: "right" } },
      { text: formatRp(c.avgIna || 0), options: { ...tableCellProps, align: "right" } },
      { text: formatRp(c.loss || 0),   options: { ...tableCellProps, align: "right", color: "e11d48", bold: true } },
    ]));
    slideTop.addTable(rows, { x: 0.35, y: 1.25, w: 5.6, colW: [0.3, 1.0, 0.8, 1.15, 1.15, 1.2] });
    slideTop.addChart(pptx.ChartType.bar, [{
      name: "Total Loss (Rp)",
      labels: topCases.map(c => String(c.cbg || '-')),
      values: topCases.map(c => Math.abs(c.loss))
    }], { x: 6.1, y: 1.25, w: 3.55, h: 4.0, barDir: 'bar', showLegend: false, showValue: false, valAxisHidden: true, catAxisLabelColor: '334155', chartColors: ['e11d48'] });
  }

  // Potensi Top-Up
  if (topUpPotentials && topUpPotentials.length > 0) {
    const rows = [[
      { text: "No",  options: tableHeaderProps },
      { text: "Kriteria Top-Up", options: tableHeaderProps },
      { text: "Vol Kasus",  options: tableHeaderProps },
      { text: "Total Potensi (Rp)", options: tableHeaderProps },
    ]];
    topUpPotentials.forEach((c, i) => rows.push([
      { text: String(i+1), options: { ...tableCellProps, align: "center" } },
      { text: c.kriteria || c.item || "-", options: tableCellProps },
      { text: String(c.count || 0), options: { ...tableCellProps, align: "center" } },
      { text: formatRp(c.delta || c.totalPotensi || 0), options: { ...tableCellProps, align: "right", color: "059669", bold: true } },
    ]));
    addTableSlide(pptx, "Potensi Top-Up (Severity Level) - KSM " + ksmName, "Rekomendasi peningkatan severity level berdasarkan klinis", rows, [0.4, 5.3, 1.2, 2.4]);
  }

  // Top 10 Diagnosa Utama
  if (topDiag && topDiag.length > 0) {
    const rows = [[
      { text: "No", options: tableHeaderProps },
      { text: "Kode ICD", options: tableHeaderProps },
      { text: "Deskripsi", options: tableHeaderProps },
      { text: "Frekuensi", options: tableHeaderProps },
    ]];
    topDiag.forEach((d, i) => rows.push([
      { text: String(i+1), options: { ...tableCellProps, align: "center" } },
      { text: d.code || "-", options: { ...tableCellProps, align: "center", bold: true, color: "0d9488" } },
      { text: d.desc || "-", options: tableCellProps },
      { text: String(d.count || 0), options: { ...tableCellProps, align: "center", bold: true } },
    ]));
    addTableSlide(pptx, "Top 10 Diagnosa Utama - KSM " + ksmName, "Berdasarkan frekuensi kasus", rows, [0.4, 1.5, 5.9, 1.5]);
  }

  // Top 10 Diagnosa Sekunder
  if (topSec && topSec.length > 0) {
    const rows = [[
      { text: "No", options: tableHeaderProps },
      { text: "Kode ICD", options: tableHeaderProps },
      { text: "Deskripsi", options: tableHeaderProps },
      { text: "Frekuensi", options: tableHeaderProps },
    ]];
    topSec.forEach((d, i) => rows.push([
      { text: String(i+1), options: { ...tableCellProps, align: "center" } },
      { text: d.code || "-", options: { ...tableCellProps, align: "center", bold: true, color: "0284c7" } },
      { text: d.desc || "-", options: tableCellProps },
      { text: String(d.count || 0), options: { ...tableCellProps, align: "center", bold: true } },
    ]));
    addTableSlide(pptx, "Top 10 Diagnosa Sekunder - KSM " + ksmName, "Berdasarkan frekuensi kemunculan sebagai penyerta", rows, [0.4, 1.5, 5.9, 1.5]);
  }

  // Top 10 Prosedur / Tindakan
  if (topProc && topProc.length > 0) {
    const rows = [[
      { text: "No", options: tableHeaderProps },
      { text: "Kode ICD", options: tableHeaderProps },
      { text: "Deskripsi", options: tableHeaderProps },
      { text: "Frekuensi", options: tableHeaderProps },
    ]];
    topProc.forEach((d, i) => rows.push([
      { text: String(i+1), options: { ...tableCellProps, align: "center" } },
      { text: d.code || "-", options: { ...tableCellProps, align: "center", bold: true, color: "7c3aed" } },
      { text: d.desc || "-", options: tableCellProps },
      { text: String(d.count || 0), options: { ...tableCellProps, align: "center", bold: true } },
    ]));
    addTableSlide(pptx, "Top 10 Prosedur / Tindakan - KSM " + ksmName, "Berdasarkan frekuensi tindakan medis", rows, [0.4, 1.5, 5.9, 1.5]);
  }

  return pptx.writeFile({ fileName: 'Sosialisasi_KSM_' + ksmName.replace(/\s+/g, '_') + '_' + new Date().getTime() + '.pptx' });
};

// Keep backward compat alias
export const generatePPTX = generateExecutivePPTX;
