import sys, re

with open('src/utils/pptxExport.js', 'r', encoding='utf-8') as f:
    text = f.read()

target_insert = r"// Auto-paginating table for findings\s*const slideAuditTable = pptx\.addSlide\(\);"
repl_insert = r'''// ---------------------------------------------------------------------------
  // SLIDE: TOP 10 KSM DEFISIT
  // ---------------------------------------------------------------------------
  if (dashData && dashData.topKsmDefisitIna && dashData.topKsmDefisitIna.length > 0) {
    const ksmLoss = dashData.topKsmDefisitIna.slice(0, 10);
    const slideKSM = pptx.addSlide();
    slideKSM.addText("Top 10 KSM Berpotensi Kerugian Finansial Terbesar", titleProps);
    slideKSM.addText("Berdasarkan akumulasi selisih Tarif INA - Tarif RS", subProps);

    const tableRows = [
      [
        { text: "No", options: tableHeaderProps },
        { text: "Nama KSM", options: tableHeaderProps },
        { text: "Jumlah Kasus", options: tableHeaderProps },
        { text: "Total Loss", options: tableHeaderProps }
      ]
    ];

    const chartData = [
      {
        name: "Total Loss (Rp)",
        labels: ksmLoss.map(c => String(c.ksm || '-')),
        values: ksmLoss.map(c => Math.abs(c.selisihIna))
      }
    ];

    ksmLoss.forEach((c, idx) => {
      tableRows.push([
        { text: String(idx + 1), options: { ...tableCellProps, align: "center" } },
        { text: c.ksm || "-", options: { ...tableCellProps, align: "left", bold: true } },
        { text: String(c.count || 0), options: { ...tableCellProps, align: "center" } },
        { text: formatRp(c.selisihIna), options: { ...tableCellProps, align: "right", color: "e11d48", bold: true } }
      ]);
    });

    slideKSM.addTable(tableRows, { x: 0.5, y: 1.5, w: 4.5, colW: [0.4, 1.8, 1.0, 1.3] });
    slideKSM.addChart(pptx.ChartType.bar, chartData, { x: 5.2, y: 1.5, w: 4.5, h: 3.5, barDir: 'bar', showLegend: false, dataLabelColor: '000000', showValue: true, valAxisHidden: true, catAxisLabelColor: '333333', chartColors: ['e11d48'] });
  }

  // ---------------------------------------------------------------------------
  // SLIDE: MONITOR NAIK KELAS
  // ---------------------------------------------------------------------------
  if (dashData && dashData.naikKelasStats && dashData.naikKelasStats.length > 0) {
    const slideNaik = pptx.addSlide();
    slideNaik.addText("Monitor Klasifikasi Naik Kelas (Hak Kelas vs Kelas Rawat)", titleProps);
    slideNaik.addText("Ringkasan selisih tarif akibat perpindahan kelas perawatan pasien", subProps);

    const tableRows = [
      [
        { text: "No", options: tableHeaderProps },
        { text: "Hak Kelas -> Kelas Rawat", options: tableHeaderProps },
        { text: "Jumlah Kasus", options: tableHeaderProps },
        { text: "Total Nilai / Selisih", options: tableHeaderProps }
      ]
    ];

    dashData.naikKelasStats.forEach((c, idx) => {
      tableRows.push([
        { text: String(idx + 1), options: { ...tableCellProps, align: "center" } },
        { text: ${c.hak} -> , options: { ...tableCellProps, align: "center", bold: true, color: "0284c7" } },
        { text: String(c.count || 0), options: { ...tableCellProps, align: "center" } },
        { text: formatRp(c.totalNilai), options: { ...tableCellProps, align: "right", bold: true } }
      ]);
    });

    slideNaik.addTable(tableRows, { 
      x: 0.5, y: 1.5, w: 9.0, 
      colW: [0.5, 3.5, 2.0, 3.0], 
      autoPage: true, 
      autoPageRepeatHeader: true,
      margin: 0.1
    });
  }

  // ---------------------------------------------------------------------------
  // SLIDE: MONITOR ICU
  // ---------------------------------------------------------------------------
  if (dashData && dashData.icuStats) {
    const icu = dashData.icuStats;
    const slideIcu = pptx.addSlide();
    slideIcu.addText("Monitor Perawatan Intensif (ICU)", titleProps);
    slideIcu.addText("Perbandingan tarif dan layanan antara pasien ICU dan Non-ICU", subProps);

    const tableRows = [
      [
        { text: "Kategori", options: tableHeaderProps },
        { text: "Pasien Non-ICU", options: tableHeaderProps },
        { text: "Pasien Masuk ICU", options: tableHeaderProps }
      ],
      [
        { text: "Total Kasus", options: { ...tableCellProps, bold: true } },
        { text: String(icu.nonIcuCount || 0) + " Pasien", options: { ...tableCellProps, align: "center" } },
        { text: String(icu.icuCount || 0) + " Pasien", options: { ...tableCellProps, align: "center", color: "e11d48", bold: true } }
      ],
      [
        { text: "Total Tarif INA-CBG", options: { ...tableCellProps, bold: true } },
        { text: formatRp(icu.sumInaNonIcu || 0), options: { ...tableCellProps, align: "right" } },
        { text: formatRp(icu.sumInaIcu || 0), options: { ...tableCellProps, align: "right" } }
      ],
      [
        { text: "Total Tarif RS", options: { ...tableCellProps, bold: true } },
        { text: formatRp(icu.sumRsNonIcu || 0), options: { ...tableCellProps, align: "right" } },
        { text: formatRp(icu.sumRsIcu || 0), options: { ...tableCellProps, align: "right" } }
      ]
    ];

    slideIcu.addTable(tableRows, { x: 0.5, y: 1.5, w: 9.0, colW: [3.0, 3.0, 3.0] });
  }

  // ---------------------------------------------------------------------------
  // SLIDE: MONITOR TOP-UP SEVERITY LEVEL
  // ---------------------------------------------------------------------------
  if (dashData && dashData.topUpStats && dashData.topUpStats.items && dashData.topUpStats.items.length > 0) {
    const slideTopUp = pptx.addSlide();
    slideTopUp.addText("Monitor Potensi Top-Up (Severity Level)", titleProps);
    slideTopUp.addText(Total Potensi:  kasus senilai , subProps);

    const tableRows = [
      [
        { text: "No", options: tableHeaderProps },
        { text: "Kriteria Potensi Top-Up", options: tableHeaderProps },
        { text: "Jumlah Kasus", options: tableHeaderProps },
        { text: "Total Potensi (Rp)", options: tableHeaderProps }
      ]
    ];

    dashData.topUpStats.items.forEach((c, idx) => {
      tableRows.push([
        { text: String(idx + 1), options: { ...tableCellProps, align: "center" } },
        { text: c.item || "-", options: { ...tableCellProps, align: "left" } },
        { text: String(c.count || 0), options: { ...tableCellProps, align: "center" } },
        { text: formatRp(c.totalPotensi), options: { ...tableCellProps, align: "right", color: "059669", bold: true } }
      ]);
    });

    slideTopUp.addTable(tableRows, { 
      x: 0.5, y: 1.5, w: 9.0, 
      colW: [0.5, 4.5, 1.5, 2.5], 
      autoPage: true, 
      autoPageRepeatHeader: true,
      margin: 0.1
    });
  }

    // Auto-paginating table for findings
    const slideAuditTable = pptx.addSlide();
'''

text = re.sub(target_insert, repl_insert, text)

with open('src/utils/pptxExport.js', 'w', encoding='utf-8') as f:
    f.write(text)
print('Patched PPTX for all Dashboard elements!')
