# 📖 Panduan Penggunaan **AKURAT iDRG**
*Analisis Klaim & Utilisasi Review Terpadu — Indonesian Diagnosis Related Group*

---

## 🌐 Cara Mengakses Aplikasi

Buka browser (Chrome, Firefox, Edge) dan kunjungi:

> **[https://akuratidrg.web.id/](https://akuratidrg.web.id/)**

---

## 1. Login

![Halaman Login AKURAT iDRG](./screenshots/Screenshot_2026-05-16_081718.png)

1. Masukkan **USERNAME** yang telah diberikan oleh admin.
2. Masukkan **PASSWORD** Anda.
3. Selesaikan **VERIFIKASI KEAMANAN** — geser slider ke kanan hingga muncul ✅ *"VERIFIKASI BERHASIL"*.
4. Klik tombol **MASUK KE DASHBOARD**.

> ⚠️ Sistem mendeteksi sesi ganda — jangan login di dua perangkat sekaligus.

---

## 2. Notifikasi Privasi & Keamanan Data

![Notifikasi Privasi](./screenshots/Screenshot_2026-05-16_081804.png)

Setelah login pertama, baca dan klik **SAYA MENGERTI & SETUJU**:

- ✅ **Pemrosesan Lokal 100%** — Data tidak dikirim ke server, seluruh proses di memori browser.
- ✅ **Tanggung Jawab Pengguna** — Kerahasiaan data adalah tanggung jawab operator faskes.
- ✅ **Sesi Sementara** — Menutup tab atau refresh akan menghapus data analisis secara permanen.

---

## 3. Tampilan Awal Dashboard

![Dashboard Kosong](./screenshots/Screenshot_2026-05-16_081832.png)

Setelah login berhasil, sidebar navigasi tersedia di sebelah kiri. Dashboard menampilkan *"Menunggu Dataset Utama..."* — upload data terlebih dahulu sebelum memulai analisis.

---

## 4. Integrasi Data (Upload File TXT)

![Halaman Integrasi Data](./screenshots/Screenshot_2026-05-16_081850.png)

Klik **Integrasi Data** di sidebar. Tersedia dua metode:

### Metode 1 — Upload Manual (Disarankan)

![Pilih File TXT dari File Explorer](./screenshots/Screenshot_2026-05-16_081909.png)

1. Klik tombol **PILIH FILE TXT**.
2. Pilih satu atau lebih file `.txt` hasil ekspor klaim RS.
3. Klik **Open** — upload dimulai otomatis.

> 💡 Bisa juga **drag & drop** file ke area bertitik-titik. Untuk multi-bulan, pilih semua file sekaligus.

### Metode 2 — Cloud Sync (G-Drive)
Klik tab **Cloud Sync (G-Drive)**, tempelkan link Google Drive (pastikan akses "Anyone with the link"), lalu klik **Tarik Data**.

### Proses Selesai & Loading Analisis

![Upload 100% Selesai](./screenshots/Screenshot_2026-05-16_081927.png)

Progres ditampilkan hingga **100% ✅ Selesai!**

![Loading Analisis Data](./screenshots/Screenshot_2026-05-16_081950.png)

Layar loading gelap muncul — sistem memproses dan menghitung selisih finansial secara otomatis. Tunggu hingga selesai, dashboard akan aktif sendiri.

---

## 5. Executive Dashboard

![Executive Dashboard](./screenshots/Screenshot_2026-05-16_082137.png)

Klik **Executive** di sidebar. Menampilkan ringkasan eksekutif:

| KPI Card | Keterangan |
|---|---|
| **TOTAL KASUS** | Jumlah seluruh klaim (RI + RJ) |
| **RAWAT INAP** | Jumlah & persentase kasus rawat inap |
| **RAWAT JALAN** | Jumlah & persentase kasus rawat jalan |
| **TOTAL TARIF RS** | Total biaya riil + rata-rata per episode |
| **SELISIH INA-RS** | Defisit/surplus INA-CBG vs tarif RS |
| **SELISIH IDRG-RS** | Defisit/surplus iDRG vs tarif RS |

Bagian **Insight Analisis Otomatis** menampilkan temuan kunci dari efisiensi koding.

---

## 6. Laporan Tabel Klaim

![Laporan Ringkasan Bulanan](./screenshots/Screenshot_2026-05-16_082157.png)

Klik **Laporan** di sidebar. Ada 5 sub-tab:

![Severity Level](./screenshots/Screenshot_2026-05-16_082207.png)

- **Ringkasan Bulanan** — Rekap kasus & nominal INA-CBG vs iDRG per bulan.
- **Severity Level** — Sebaran SL 0, SL 1, SL 2, SL 3 per bulan.

![Complexity Level](./screenshots/Screenshot_2026-05-16_082215.png)

- **Complexity Level** — Sebaran CL Rajal, CL 0–4 per bulan.

![Detail Rawat Inap](./screenshots/Screenshot_2026-05-16_082226.png)

- **Detail Rawat Inap** — Parameter iDRG (Cost Weight, NBR, AF) vs INA-CBG per kode DRG.

![Detail Rawat Jalan](./screenshots/Screenshot_2026-05-16_082234.png)

- **Detail Rawat Jalan** — Perbandingan iDRG vs INA-CBG untuk kasus rawat jalan.

Setiap sub-tab memiliki tombol **Print Cetak** dan **Ekspor Data/CSV**.

---

## 7. Rekap Kasus

![Rekap Kasus - Kuadran INA-CBG](./screenshots/Screenshot_2026-05-16_082250.png)

Klik **Rekap Kasus** untuk melihat seluruh kasus individual dengan kuadran distribusi (Defisit/Surplus vs Volume). Klik titik pada kuadran untuk drill-down. Tombol **Ekspor Semua Kasus (Excel)** tersedia di atas.

---

## 8. Peta iDRG

![Peta iDRG - Mapping INA ke iDRG](./screenshots/Screenshot_2026-05-16_082304.png)

Klik **Peta iDRG**. Pilih arah: **INA-CBG → iDRG** atau **iDRG → INA-CBG**. Cari kode di kolom pencarian. Klik baris untuk melihat diagnosa utama, sekunder, dan prosedur terkait.

---

## 9. Analisis SL/CL

![Analisis SL/CL](./screenshots/Screenshot_2026-05-16_082312.png)

Klik **Analisis SL/CL** untuk melihat pergeseran Severity Level (INA-CBG) ke Complexity Level (iDRG). Setiap kartu menampilkan jumlah kasus, total INA, total iDRG, selisih finansial, dan diagnosa terbanyak. Label **SURPLUS** (hijau) / **DEFISIT** (merah) menunjukkan arah selisih.

---

## 10. Kinerja KSM

![Kinerja KSM - Bar Chart Top 10](./screenshots/Screenshot_2026-05-16_082325.png)

Klik **Kinerja KSM**. Tampil bar chart **Top 10 Departemen** berdasarkan selisih finansial.

![Kinerja KSM - Tabel Hierarki](./screenshots/Screenshot_2026-05-16_082336.png)

Tabel hierarki **Departemen → KSM → DPJP** (klik untuk expand). Baris kuning = **RATA-RATA RS** sebagai acuan.

![Drilldown Pasien dari KSM](./screenshots/Screenshot_2026-05-16_082347.png)

Klik nama KSM/DPJP → terbuka **Rincian Data Analitik**: insight 18 komponen biaya + daftar pasien individual. 🔴 Merah = tarif RS di atas rata-rata. 🟠 Orange = tarif INA/iDRG di atas rata-rata.

---

## 11. Kinerja DPJP

![Kinerja DPJP](./screenshots/Screenshot_2026-05-16_082444.png)

Klik **Kinerja DPJP**. Ringkasan: Total DPJP, DPJP terbanyak, Surplus tertinggi INA-RS & iDRG-RS. Bar chart Top 10 DPJP berdasarkan volume kasus dan selisih.

![Drilldown Pasien DPJP](./screenshots/Screenshot_2026-05-16_082430.png)

Klik nama dokter → terbuka daftar pasien dengan rata-rata 18 komponen biaya per kasus.

---

## 12. Hak Kelas (Naik Kelas Rawat)

![Hak Kelas](./screenshots/Screenshot_2026-05-16_082711.png)

Klik **Hak Kelas**. Tabel menampilkan pola naik kelas (contoh: Kelas 1 → VIP), jumlah kasus, total nilai klaim, dan sebaran SL.

![Drilldown Hak Kelas](./screenshots/Screenshot_2026-05-16_082728.png)

Klik baris pola → terbuka daftar pasien beserta 18 komponen biaya rata-rata per kasus.

---

## 13. Intensif ICU

![Intensif ICU](./screenshots/Screenshot_2026-05-16_082507.png)

Klik **Intensif ICU**. Menampilkan Total Kasus ICU dan sebaran per SL. Bagian **Anomali Koding Ventilator** mendeteksi otomatis ketidaksesuaian kode (contoh: *"Kode 96.72 >96 Jam tapi aktual < 96 jam"*).

---

## 14. Potensi Top Up Special CMG

![Potensi Top Up](./screenshots/Screenshot_2026-05-16_082521.png)

Klik **Potensi Top Up**. Menampilkan Total Potensi Revenue, jumlah kasus potensial, dan kartu per item top-up (SP/SI/SR/SD). Klik **LIHAT RINCIAN** untuk detail kasus.

---

## 15. Akurasi Input INA-iDRG

![Akurasi Input INA-iDRG](./screenshots/Screenshot_2026-05-16_082535.png)

Klik **Akurasi Input INA-iDRG**. Menampilkan:
- **Akurasi Fuzzy Kesesuaian Diagnosa** (%)
- **Akurasi Fuzzy Kesesuaian Prosedur** (%)
- **Log Ketidaksesuaian Koding** — daftar kasus discrepancy dengan komparasi kode INA vs iDRG.
- Tombol **Ekspor Kasus Discrepancy** → file Excel.

---

## 16. Audit Coding

![Audit Coding](./screenshots/Screenshot_2026-05-16_082554.png)

Klik **Audit Coding**. Menampilkan temuan audit kaidah koding dengan:
- KPI: Total Temuan, Sudah Direview, Total Klaim Audit, Sesuai, Tidak Sesuai.
- Tabel: Rule ID, Temuan, Pesan Validasi, Identitas Pasien, Nama Coder, Kode Diag & Proc.
- Klik **SESUAI** / **TIDAK** untuk verdict. Gunakan **AKSI MASSAL** untuk semua sekaligus.

---

## 17. KPI Coder

![KPI Coder](./screenshots/Screenshot_2026-05-16_082607.png)

Klik **KPI Coder**. Menampilkan performa individu petugas koding:
- KPI global: Total Kasus Direview, Akurasi Rata-rata, Total Discrepancy.
- Tabel per coder: Total Kasus, Discrepancy, Audit Flag, Verified Sesuai/Tidak, % Akurasi.

---

## Tips & Pintasan

| Tip | Detail |
|---|---|
| 🌙 **Mode Gelap** | Klik "Mode Gelap" di sidebar bawah |
| 🖨️ **Cetak** | Tombol "Print Cetak" di setiap modul |
| 📊 **Ekspor Excel/CSV** | Tombol "Ekspor Data" di setiap modul |
| 🔄 **Reset Data** | Klik "Kosongkan" di halaman Integrasi Data |
| 📁 **Multi-Periode** | Pilih beberapa file TXT sekaligus saat upload |
| 🔍 **Drilldown** | Klik angka/nama di tabel untuk detail pasien |
| 🔒 **Keluar** | Klik "Keluar" (merah) di sidebar bawah |

---

*Panduan ini dibuat berdasarkan aplikasi AKURAT iDRG versi aktif di **[https://akuratidrg.web.id/](https://akuratidrg.web.id/)***
*© RPP Analisis Klaim & Utilisasi Review Terpadu iDRG*
