-- ============================================================
-- MIGRATION: Tambah kolom baru di tabel profiles
-- Jalankan di Supabase Dashboard → SQL Editor
-- ============================================================

-- Tambah kolom email (dari form permohonan)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS kode_rs TEXT,
  ADD COLUMN IF NOT EXISTS jabatan TEXT,
  ADD COLUMN IF NOT EXISTS catatan TEXT;

-- ============================================================
-- Update fungsi trigger handle_new_user 
-- agar menyimpan field tambahan dari metadata
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    nama_lengkap, 
    nama_faskes, 
    no_wa, 
    email,
    kode_rs,
    jabatan,
    catatan,
    role, 
    status
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'nama',
    new.raw_user_meta_data->>'faskes',
    new.raw_user_meta_data->>'wa',
    new.email,
    new.raw_user_meta_data->>'kode_rs',
    new.raw_user_meta_data->>'jabatan',
    new.raw_user_meta_data->>'catatan',
    'user',
    'pending'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PENTING: Matikan email confirmation di Supabase
-- Supabase Dashboard → Authentication → Settings →
-- "Enable email confirmations" → MATIKAN (OFF)
--
-- Alasan: Email confirmation Supabase free tier sangat 
-- terbatas (3-4 email/jam) sehingga email tidak terkirim.
-- Verifikasi user digantikan oleh admin approval di dashboard.
-- ============================================================
