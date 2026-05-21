import { createClient } from '@supabase/supabase-js';

// === KONFIGURASI SUPABASE ===
// Ganti dengan Service Role Key dari Project Settings -> API
const SUPABASE_URL = 'https://qrxjpbvvqsbtgbferkua.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyeGpwYnZ2cXNidGdiZmVya3VhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM1MTMwNywiZXhwIjoyMDk0OTI3MzA3fQ.kgokGv3H1SDU2PpFl368BKJOL1VVJWPE4bm4Hiw-TCg';

// URL Google Sheets (Tab Active Users)
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1GG8xDtNii2N4V9yNlP_Na-fQtM4zN30ZkLD0aUnMY98/export?format=csv&gid=0';

async function migrate() {
  if (SUPABASE_SERVICE_KEY === 'GANTI_DENGAN_SERVICE_ROLE_KEY_ANDA') {
    console.error('\n[ERROR] Silakan masukkan Supabase Service Role Key di file migrate.js baris ke-6 terlebih dahulu.\n');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('Mengunduh data dari Google Sheets...');
  const res = await fetch(GOOGLE_SHEET_URL);
  const text = await res.text();
  
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  console.log(`Ditemukan ${lines.length - 1} data pengguna.`);

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
    
    // Asumsi urutan kolom: KODE RS, NAMA RS, PIC RS, USERNAME, PASSWORD, MasaAktif
    const faskes = row[1] || '';
    const nama = row[2] || '';
    const username = row[3] || '';
    const password = row[4] || '';
    
    let masaAktif = null;
    if (row[5]) {
      const parts = row[5].split('/');
      if (parts.length === 3) {
        masaAktif = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T23:59:59Z`).toISOString();
      }
    }

    if (!username || !password) continue;

    // Pastikan username menjadi email agar kompatibel dengan Supabase
    const email = username.includes('@') ? username.replace(/\s+/g, '') : `${username.replace(/\s+/g, '')}@akurat.id`;

    console.log(`[${i}/${lines.length - 1}] Memigrasi pengguna: ${username} (${email})`);

    const { data: user, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        username: username,
        nama: nama,
        faskes: faskes,
        wa: '-' // Kosongkan karena tidak ada di Sheets
      }
    });

    let targetId = user?.user?.id;

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`   -> User ${email} sudah terdaftar, mencari UUID untuk memperbarui profil...`);
        // Cari UUID
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const targetUser = existingUsers.users.find(u => u.email === email);
        if (targetUser) targetId = targetUser.id;
      } else {
        console.error(`   -> Error membuat user ${email}:`, authError.message);
        continue;
      }
    } else {
      console.log(`   -> Berhasil membuat Auth User: ${targetId}`);
    }

    if (targetId) {
      const role = username.toLowerCase() === 'admin' ? 'admin' : 'user';
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: targetId,
        username: username,
        nama_lengkap: nama,
        nama_faskes: faskes,
        no_wa: '-',
        role: role,
        status: 'active',
        masa_aktif: masaAktif
      });

      if (profileError) {
        console.error(`   -> Error update profile ${username}:`, profileError.message);
      } else {
        console.log(`   -> Profile ${username} berhasil di-update sebagai 'active'.`);
      }
    }
  }

  console.log('\nMigrasi selesai!');
}

migrate();
