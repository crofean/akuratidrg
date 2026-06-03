import sys

with open('src/utils/pptxExport.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Update signature
target_sig = "export const generateSosialisasiPPTX = async ({ ksmName, ksmStats, topCases, topUpPotentials, scatterImageBase64, quadrantInsights }) => {"
repl_sig = "export const generateSosialisasiPPTX = async ({ ksmName, ksmStats, topCases, topUpPotentials, scatterImageBase64, quadrantInsights, topDiag, topSec, topProc }) => {"
text = text.replace(target_sig, repl_sig)

# Add the 3 new slides before return pptx.writeFile(...)
target_return = "return pptx.writeFile({ fileName: 'Sosialisasi_KSM_'"

new_slides = r'''
  // 6. TOP CLINICAL (DIAGNOSA UTAMA, SEKUNDER, TINDAKAN)
  const addTopClinicalSlide = (title, subtitle, data) => {
    if (!data || data.length === 0) return;
    const slide = pptx.addSlide();
    slide.addText(title, titleProps);
    slide.addText(subtitle, subProps);
    
    const rows = [
      [
        { text: "No", options: tableHeaderProps },
        { text: "Kode ICD", options: tableHeaderProps },
        { text: "Deskripsi", options: tableHeaderProps },
        { text: "Frekuensi", options: tableHeaderProps }
      ]
    ];
    
    data.forEach((d, idx) => {
      rows.push([
        { text: String(idx + 1), options: { ...tableCellProps, align: "center" } },
        { text: d.code || "-", options: { ...tableCellProps, align: "center", bold: true, color: "0d9488" } },
        { text: d.desc || "-", options: tableCellProps },
        { text: String(d.count || 0), options: { ...tableCellProps, align: "center", bold: true } }
      ]);
    });
    
    slide.addTable(rows, { 
      x: 0.5, y: 1.5, w: 9.0, 
      colW: [0.5, 1.5, 5.5, 1.5], 
      autoPage: true, 
      autoPageRepeatHeader: true,
      margin: 0.1
    });
  };

  addTopClinicalSlide("Top 10 Diagnosa Utama - KSM " + ksmName, "Berdasarkan frekuensi kasus", topDiag);
  addTopClinicalSlide("Top 10 Diagnosa Sekunder - KSM " + ksmName, "Berdasarkan frekuensi kemunculan sebagai penyerta", topSec);
  addTopClinicalSlide("Top 10 Prosedur / Tindakan - KSM " + ksmName, "Berdasarkan frekuensi tindakan medis", topProc);

  '''

text = text.replace(target_return, new_slides + target_return)

with open('src/utils/pptxExport.js', 'w', encoding='utf-8') as f:
    f.write(text)
print('Patched pptxExport.js for Top Clinicals!')
