import * as XLSX from 'xlsx';

// Constants mimicking the python script
const REGIONAL_MAP = {"reg1": 1, "reg2": 2, "reg3": 3, "reg4": 4, "reg5": 5};

const parseRegional = (val) => {
  if (val === undefined || val === null) return 0;
  const s = String(val).trim().toLowerCase();
  return REGIONAL_MAP[s] || 0;
};

const pickIdrgTarif = (row) => {
  const cols = ["total_idrg_tarif_8_v1", "total_idrg_tarif_8",
                "total_idrg_tarif_5_v1", "total_idrg_tarif_5",
                "total_idrg_tarif_4_v1", "total_idrg_tarif_4"];
  for (const col of cols) {
    if (row[col] !== undefined && row[col] !== null) {
      const val = parseFloat(row[col]);
      if (!isNaN(val) && val > 0) return val;
    }
  }
  return 0.0;
};

// Web Worker Message Listener
self.onmessage = async (e) => {
  const { type, file, filename } = e.data;
  if (type === 'PARSE_EXCEL') {
    try {
      const label = filename.replace('.xlsx', '').substring(0, 20); // Short label
      
      // We read it as an ArrayBuffer since file is a File object
      const arrayBuffer = await file.arrayBuffer();
      
      // Reading large files can block the worker thread, but the UI thread stays alive
      self.postMessage({ type: 'PROGRESS', message: `Membaca file ${filename} (Harap sabar, ini bisa memakan waktu untuk file besar)...` });
      
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Usually it's "Individual Data" or "Individual data"
      let sheetName = workbook.SheetNames.find(n => n.toLowerCase() === "individual data");
      if (!sheetName) sheetName = workbook.SheetNames[0]; // fallback
      
      self.postMessage({ type: 'PROGRESS', message: `Memproses data dari sheet: ${sheetName}...` });
      
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet); // This parses into an array of objects
      
      const rows = [];
      for (const r of data) {
        const regional = parseRegional(r["regional_2023"]);
        if (regional === 0) continue;

        const ptd = parseInt(r["ptd"]);
        if (ptd !== 1 && ptd !== 2) continue;

        const jml_kasus = parseInt(r["jml_kasus"]);
        if (isNaN(jml_kasus) || jml_kasus <= 0) continue;

        const idrg_tarif = pickIdrgTarif(r);

        const row = [
          parseFloat(r["total_tarif_inacbg"] || 0) || 0,
          parseFloat(r["total_tarifrs"] || 0) || 0,
          jml_kasus,
          regional,
          String(r["nama_rs_vertikal"] || "non_rs_vertikal"),
          String(r["idrg_code"] || ""),
          ptd,
          idrg_tarif,
          label,
          String(r["faskes_kompetensi"] || "-"),
          String(r["pemilik_faskes"] || "-")
        ]
        rows.push(row);
      }

      self.postMessage({ type: 'DONE', rows, label });

    } catch (err) {
      self.postMessage({ type: 'ERROR', error: err.message });
    }
  }
};
