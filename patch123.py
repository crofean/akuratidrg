import sys

with open('src/utils/pptxExport.js', 'r', encoding='utf-8') as f:
    text = f.read()

badStart = text.find('export const generateSosialisasiPPTX')
if badStart != -1:
    text = text[:badStart]

sosialisasi_code = r'''
export const generateSosialisasiPPTX = async ({ ksmName, ksmStats, topCases, topUpPotentials, scatterImageBase64, quadrantInsights }) => {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "Akurat-iDRG System";
  pptx.subject = "Laporan Sosialisasi KMKB";
  pptx.title = "Sosialisasi KSM " + ksmName;

  const titleProps = { x: 0.5, y: 0.4, w: "90%", h: 0.5, color: "0f172a", fontSize: 24, bold: true, fontFace: "Arial" };
  const subProps = { x: 0.5, y: 0.9, w: "90%", h: 0.3, color: "64748b", fontSize: 14, fontFace: "Arial" };
  const tableHeaderProps = { fill: "0d9488", color: "ffffff", bold: true, fontFace: "Arial", fontSize: 10, align: "center", valign: "middle" };
  const tableCellProps = { fontFace: "Arial", fontSize: 9, valign: "middle", border: { pt: 1, color: "e2e8f0" } };
  const formatRp = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  // 1. COVER SLIDE
  const slideCover = pptx.addSlide();
  slideCover.background = { fill: "0d9488" };
  slideCover.addText("LAPORAN SOSIALISASI & EVALUASI KMKB", { x: 1, y: 2, w: 8, fontSize: 32, bold: true, color: "ffffff", align: "center" });
  slideCover.addText("KSM: " + ksmName.toUpperCase(), { x: 1, y: 2.8, w: 8, fontSize: 24, bold: true, color: "ccfbf1", align: "center" });
  slideCover.addText("Tanggal: " + new Date().toLocaleDateString('id-ID'), { x: 1, y: 3.5, w: 8, fontSize: 14, color: "99f6e4", align: "center" });

  // 2. RINGKASAN FINANSIAL KSM
  const slideFin = pptx.addSlide();
  slideFin.addText("Ringkasan Kinerja - KSM " + ksmName, titleProps);
  slideFin.addText("Evaluasi Finansial dan Volume Kasus", subProps);

  slideFin.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.5, w: 4, h: 1, fill: "f8fafc", line: { color: "e2e8f0", pt: 1 } });
  slideFin.addText("Total Kasus KSM", { x: 0.6, y: 1.6, w: 3.8, fontSize: 12, color: "64748b", bold: true });
  slideFin.addText(ksmStats.kasus.toLocaleString() + " Kasus", { x: 0.6, y: 2.0, w: 3.8, fontSize: 20, color: "0f172a", bold: true });

  slideFin.addShape(pptx.ShapeType.rect, { x: 5.0, y: 1.5, w: 4, h: 1, fill: "f1f5f9", line: { color: "e2e8f0", pt: 1 } });
  slideFin.addText("Total Tarif INA-CBG", { x: 5.1, y: 1.6, w: 3.8, fontSize: 12, color: "64748b", bold: true });
  slideFin.addText(formatRp(ksmStats.ina), { x: 5.1, y: 2.0, w: 3.8, fontSize: 20, color: "0f172a", bold: true });

  slideFin.addShape(pptx.ShapeType.rect, { x: 0.5, y: 3.0, w: 4, h: 1, fill: ksmStats.selisih >= 0 ? "ecfdf5" : "fff1f2", line: { color: ksmStats.selisih >= 0 ? "a7f3d0" : "fecdd3", pt: 1 } });
  slideFin.addText("Net Selisih (INA - RS)", { x: 0.6, y: 3.1, w: 3.8, fontSize: 12, color: ksmStats.selisih >= 0 ? "059669" : "e11d48", bold: true });
  slideFin.addText((ksmStats.selisih >= 0 ? '+' : '') + formatRp(ksmStats.selisih), { x: 0.6, y: 3.5, w: 3.8, fontSize: 20, color: ksmStats.selisih >= 0 ? "065f46" : "9f1239", bold: true });

  slideFin.addShape(pptx.ShapeType.rect, { x: 5.0, y: 3.0, w: 4, h: 1, fill: "fff1f2", line: { color: "fecdd3", pt: 1 } });
  slideFin.addText("Total Potensi Loss", { x: 5.1, y: 3.1, w: 3.8, fontSize: 12, color: "e11d48", bold: true });
  slideFin.addText(formatRp(ksmStats.loss), { x: 5.1, y: 3.5, w: 3.8, fontSize: 20, color: "9f1239", bold: true });

  // 3. SCATTER PLOT & INSIGHTS
  if (scatterImageBase64) {
    const slideScatter = pptx.addSlide();
    slideScatter.addText("Analisis Kuadran KMKB - KSM " + ksmName, titleProps);
    slideScatter.addText("Posisi INA-CBG berdasarkan Volume dan Selisih", subProps);
    
    slideScatter.addImage({ data: scatterImageBase64, x: 0.5, y: 1.3, w: 5.2, h: 4 });

    slideScatter.addText("Rekomendasi Sosialisasi & Evaluasi:", { x: 6.0, y: 1.3, w: 3.6, fontSize: 14, bold: true, color: "0f172a" });
    let yPos = 1.7;
    quadrantInsights.forEach(qi => {
      slideScatter.addText(qi, { x: 6.0, y: yPos, w: 3.6, fontSize: 11, color: "334155", bullet: true });
      yPos += 0.8;
    });
  }

  // 4. TOP KASUS DEFISIT
  if (topCases && topCases.length > 0) {
    const slideTop = pptx.addSlide();
    slideTop.addText("Top INA-CBG Defisit - KSM " + ksmName, titleProps);
    slideTop.addText("10 Kasus penyumbang kerugian terbesar", subProps);

    const tableRows = [
      [
        { text: "No", options: tableHeaderProps },
        { text: "INA CBG", options: tableHeaderProps },
        { text: "Kasus", options: tableHeaderProps },
        { text: "Total Loss", options: tableHeaderProps }
      ]
    ];

    const chartData = [
      {
        name: "Total Loss (Rp)",
        labels: topCases.map(c => String(c.cbg || '-')),
        values: topCases.map(c => Math.abs(c.loss))
      }
    ];

    topCases.forEach((c, idx) => {
      tableRows.push([
        { text: String(idx + 1), options: { ...tableCellProps, align: "center" } },
        { text: c.cbg || "-", options: { ...tableCellProps, align: "center", bold: true } },
        { text: String(c.count || 0), options: { ...tableCellProps, align: "center" } },
        { text: formatRp(c.loss), options: { ...tableCellProps, align: "right", color: "e11d48", bold: true } }
      ]);
    });

    slideTop.addTable(tableRows, { x: 0.5, y: 1.5, w: 4.8, colW: [0.3, 1.3, 0.8, 2.4] });
    slideTop.addChart(pptx.ChartType.bar, chartData, { x: 5.5, y: 1.5, w: 4.0, h: 3.5, barDir: 'bar', showLegend: false, showValue: true, valAxisHidden: true, chartColors: ['e11d48'] });
  }

  // 5. POTENSI TOP-UP
  if (topUpPotentials && topUpPotentials.length > 0) {
    const tableRows = [
      [
        { text: "No", options: tableHeaderProps },
        { text: "INA CBG Lama", options: tableHeaderProps },
        { text: "Potensi INA CBG (Top-Up)", options: tableHeaderProps },
        { text: "Kriteria Klinis Tambahan", options: tableHeaderProps },
        { text: "Perkiraan Delta Tarif", options: tableHeaderProps }
      ]
    ];

    topUpPotentials.forEach((c, idx) => {
      tableRows.push([
        { text: String(idx + 1), options: { ...tableCellProps, align: "center" } },
        { text: c.oldCbg || "-", options: { ...tableCellProps, align: "center" } },
        { text: c.newCbg || "-", options: { ...tableCellProps, align: "center", bold: true, color: "059669" } },
        { text: c.kriteria || "-", options: tableCellProps },
        { text: formatRp(c.delta), options: { ...tableCellProps, align: "right", bold: true, color: "059669" } }
      ]);
    });

    const slideTopUp = pptx.addSlide();
    slideTopUp.addText("Potensi Top-Up (Severity Level) - KSM " + ksmName, titleProps);
    slideTopUp.addTable(tableRows, { 
      x: 0.5, y: 1.2, w: 9.0, 
      colW: [0.4, 1.6, 1.6, 3.4, 2.0], 
      autoPage: true, 
      autoPageRepeatHeader: true,
      margin: 0.1
    });
  }

  return pptx.writeFile({ fileName: 'Sosialisasi_KSM_' + ksmName.replace(/\s+/g, '_') + '_' + new Date().getTime() + '.pptx' });
};
'''

text += sosialisasi_code

with open('src/utils/pptxExport.js', 'w', encoding='utf-8') as f:
    f.write(text)
print('Patched successfully!')
