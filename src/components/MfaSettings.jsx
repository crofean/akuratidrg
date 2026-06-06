import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldAlert, Key, CheckCircle, AlertTriangle, Smartphone, Lock } from 'lucide-react';

const MfaSettings = () => {
  const [factors, setFactors] = useState([]);
  const [qrCode, setQrCode] = useState(null);
  const [factorId, setFactorId] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const loadFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setFactors(data.totp || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadFactors();
  }, []);

  const handleEnableMfa = async () => {
    setLoading(true);
    setError('');
    try {
      // Hapus factor yang menggantung (unverified) jika ada, mencegah error 422
      const { data: existingFactors } = await supabase.auth.mfa.listFactors();
      const unverifiedFactors = (existingFactors?.totp || []).filter(f => f.status === 'unverified');
      for (const factor of unverifiedFactors) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      setFactorId(data.id);
      setQrCode(data.totp.uri);
    } catch (err) {
      setError(err.message || 'Gagal menyiapkan MFA. Coba muat ulang halaman.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;
      const verify = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code: verifyCode });
      if (verify.error) throw verify.error;

      // Tandai mfa_enabled = true di tabel profiles agar Admin bisa memantau
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').update({ mfa_enabled: true }).eq('id', user.id);
        }
      } catch (profileErr) {
        console.warn('Gagal update mfa_enabled di profiles:', profileErr.message);
      }

      setSuccess('MFA berhasil diaktifkan! Anda akan diminta memasukkan OTP saat login berikutnya.');
      setQrCode(null);
      loadFactors();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isMfaActive = factors.filter(f => f.status === 'verified').length > 0;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Keamanan Akun (MFA)</h2>
          <p className="text-slate-500 text-sm mt-1">Tambahkan lapisan keamanan ekstra dengan Multi-Factor Authentication.</p>
        </div>
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-bold border border-rose-200 flex items-center gap-2"><AlertTriangle size={18}/> {error}</div>}
      {success && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold border border-emerald-200 flex items-center gap-2"><CheckCircle size={18}/> {success}</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Key size={18} className="text-teal-500"/> Status MFA (Google Authenticator)
        </h3>
        
        {isMfaActive ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-start gap-3">
              <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-emerald-800">MFA Aktif & Terlindungi</p>
                <p className="text-xs text-emerald-600 mt-1">Akun Anda dilindungi dengan keamanan berlapis. Anda akan dimintai kode OTP saat masuk dari perangkat baru.</p>
              </div>
            </div>

            {/* Info: Hanya Admin yang bisa menonaktifkan MFA */}
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
              <Lock className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-bold text-amber-800 text-sm">MFA Tidak Dapat Dinonaktifkan Sendiri</p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Demi keamanan data klaim JKN, MFA yang sudah diaktifkan <strong>hanya dapat direset oleh Administrator</strong>. 
                  Jika Anda perlu reset MFA (misalnya ganti HP), silakan hubungi Admin untuk melakukan reset.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {!qrCode ? (
              <>
                <div className="text-sm text-slate-600 leading-relaxed font-medium bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-800">
                  <p>Data TXT Klaim JKN adalah dokumen medis rahasia yang digunakan khusus untuk analisis internal rumah sakit. Sangat disarankan untuk mengaktifkan fitur Multi-Factor Authentication (MFA) pada akun Anda untuk memastikan bahwa:</p>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Akun Anda tetap aman.</li>
                    <li>Pengolahan Data TXT tersebut hanya dapat diakses oleh Anda Seorang dan tidak dapat diakses oleh pihak lain.</li>
                  </ul>
                </div>
                <button onClick={handleEnableMfa} disabled={loading} className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-teal-500/30 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses...
                    </>
                  ) : 'Mulai Aktifkan MFA'}
                </button>
              </>
            ) : (
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center">
                  <QRCodeSVG value={qrCode} size={200} />
                </div>
                <div className="flex-1 space-y-4">
                  <h4 className="font-bold text-slate-800">Langkah Terakhir: Verifikasi Aplikasi</h4>
                  <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2">
                    <li>Buka aplikasi <strong>Google Authenticator</strong> atau <strong>Authy</strong> di HP Anda.</li>
                    <li>Scan QR code yang ada di sebelah kiri.</li>
                    <li>Masukkan 6 digit angka yang muncul di aplikasi ke dalam form di bawah.</li>
                  </ol>
                  <div className="pt-2">
                    <input 
                      type="text" 
                      value={verifyCode} 
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6 Digit OTP" 
                      className="w-full max-w-[200px] px-4 py-2 border border-slate-300 rounded-xl text-center text-lg font-black tracking-[0.2em] focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
                    />
                  </div>
                  <button onClick={handleVerify} disabled={loading || verifyCode.length !== 6} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50 cursor-pointer">
                    Verifikasi & Aktifkan
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Panduan Instalasi MFA */}
      {!isMfaActive && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mt-8">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Smartphone size={18} className="text-teal-500"/> Panduan Aktivasi MFA
          </h3>
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 text-center shadow-inner">
                <div className="h-64 mb-6 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-slate-100 p-2">
                  <img src="./images/mfa_step1.png?v=2" alt="Unduh Aplikasi" className="h-full object-contain" />
                </div>
                <h4 className="font-bold text-slate-800 text-base mb-2">1. Unduh Aplikasi</h4>
                <p className="text-sm text-slate-500">Unduh aplikasi <strong>Google Authenticator</strong> dari Play Store atau App Store di HP Anda.</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 text-center shadow-inner">
                <div className="h-64 mb-6 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-slate-100 p-2 shadow-sm">
                  <img src="./images/mfa_step2.png?v=2" alt="Mulai Aktivasi" className="h-full w-full object-contain rounded" />
                </div>
                <h4 className="font-bold text-slate-800 text-base mb-2">2. Mulai Aktivasi</h4>
                <p className="text-sm text-slate-500">Klik tombol <strong>Mulai Aktifkan MFA</strong> pada panel Keamanan Akun Anda.</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 text-center shadow-inner">
                <div className="h-64 mb-6 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-slate-100 p-2">
                  <img src="./images/mfa_step3.png?v=2" alt="Pindai QR" className="h-full object-contain" />
                </div>
                <h4 className="font-bold text-slate-800 text-base mb-2">3. Pindai QR Code</h4>
                <p className="text-sm text-slate-500">Buka aplikasi Authenticator, lalu scan QR Code yang muncul di layar laptop.</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 text-center shadow-inner">
                <div className="h-64 mb-6 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-slate-100 p-2 shadow-sm">
                  <img src="./images/mfa_step4.png?v=2" alt="Masukkan OTP" className="h-full w-full object-contain rounded" />
                </div>
                <h4 className="font-bold text-slate-800 text-base mb-2">4. Masukkan OTP</h4>
                <p className="text-sm text-slate-500">Masukkan 6 digit angka OTP (contoh: 083500) ke kolom yang tersedia.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2 flex justify-center">
                <div className="w-full md:w-1/2 bg-slate-50 rounded-xl p-6 border border-slate-100 text-center shadow-inner">
                  <div className="h-64 mb-6 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-slate-100 p-2 shadow-sm">
                    <img src="./images/mfa_step5.png?v=2" alt="Selesai & Sukses" className="h-full w-full object-contain rounded" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-base mb-2">5. Selesai</h4>
                  <p className="text-sm text-slate-500">Klik Verifikasi, dan akun Anda kini telah sukses terlindungi dengan keamanan ganda.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MfaSettings;
