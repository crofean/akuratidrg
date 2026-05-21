-- Hapus tabel jika sudah ada (opsional, hati-hati jika ada data)
-- DROP TABLE IF EXISTS public.profiles;

-- Buat tabel profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  nama_lengkap TEXT NOT NULL,
  nama_faskes TEXT NOT NULL,
  no_wa TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  masa_aktif TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Admin dapat melihat dan mengedit semua data
CREATE POLICY "Admin dapat melihat dan mengedit semua" ON public.profiles
  FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Policy: User dapat melihat data mereka sendiri
CREATE POLICY "User dapat melihat profil mereka sendiri" ON public.profiles
  FOR SELECT
  USING ( auth.uid() = id );

-- Policy: User dapat mengedit data mereka sendiri
CREATE POLICY "User dapat mengedit profil mereka sendiri" ON public.profiles
  FOR UPDATE
  USING ( auth.uid() = id );

-- Policy: Sistem dapat insert profil baru saat registrasi
CREATE POLICY "Sistem insert profil" ON public.profiles
  FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- Buat fungsi trigger untuk create profile otomatis saat sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, nama_lengkap, nama_faskes, no_wa, role, status)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'nama',
    new.raw_user_meta_data->>'faskes',
    new.raw_user_meta_data->>'wa',
    'user',
    'pending'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Buat trigger setelah insert ke auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Buat admin pertama (PENTING: Ganti ID dengan ID user Anda setelah sign up pertama kali)
-- UPDATE public.profiles SET role = 'admin', status = 'active' WHERE username = 'admin_anda';
