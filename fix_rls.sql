-- Hapus policy yang menyebabkan infinite loop
DROP POLICY IF EXISTS "Admin dapat melihat dan mengedit semua" ON public.profiles;

-- Buat fungsi aman (bypass RLS) untuk mengecek apakah user adalah admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  SELECT role = 'admin' INTO is_admin_user FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(is_admin_user, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Buat policy baru yang menggunakan fungsi tersebut
CREATE POLICY "Admin dapat melihat dan mengedit semua" ON public.profiles
  FOR ALL
  USING ( public.is_admin() );
