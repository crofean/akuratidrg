import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldAlert, Key, CheckCircle, AlertTriangle, Smartphone } from 'lucide-react';

const MfaSettings = () => {
  const [factors, setFactors] = useState([]);
  const [qrCode, setQrCode] = useState(null);
  const [factorId, setFactorId] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFactors();
  }, []);

  const loadFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setFactors(data.totp || []);
    } catch (err) {
      console.error(err);
    }
  };

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
      setSuccess('MFA berhasil diaktifkan! Anda akan diminta memasukkan OTP saat login berikutnya.');
      setQrCode(null);
      loadFactors();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMfa = async (id) => {
    if (!window.confirm('Yakin ingin menonaktifkan MFA?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
      if (error) throw error;
      setSuccess('MFA dinonaktifkan.');
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
                <p className="font-bold text-emerald-800">MFA Aktif</p>
                <p className="text-xs text-emerald-600 mt-1">Akun Anda dilindungi dengan keamanan berlapis. Anda akan dimintai kode OTP saat masuk dari perangkat baru.</p>
              </div>
            </div>
            <button onClick={() => handleDisableMfa(factors.find(f => f.status === 'verified').id)} disabled={loading} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-lg text-sm transition-colors cursor-pointer">
              Nonaktifkan MFA
            </button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center shadow-inner">
              <div className="h-40 mb-4 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-slate-100 p-2">
                <img src="/images/mfa_guide_1.png" alt="Mulai Aktivasi" className="h-full object-cover object-left-top rounded" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-2">1. Mulai Aktivasi</h4>
              <p className="text-xs text-slate-500">Klik tombol <strong>Mulai Aktifkan MFA</strong> pada panel Keamanan Akun Anda.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center shadow-inner">
              <div className="h-40 mb-4 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-slate-100 p-2">
                <img src="/images/mfa_guide_2.png" alt="Scan QR" className="h-full object-cover object-left-top rounded" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-2">2. Pindai QR Code</h4>
              <p className="text-xs text-slate-500">Buka aplikasi <strong>Google Authenticator</strong> di HP Anda dan scan QR Code yang muncul.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center shadow-inner">
              <div className="h-40 mb-4 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-slate-100 p-2">
                <img src="/images/mfa_guide_3.png" alt="Enter OTP" className="h-full object-cover object-left-top rounded" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-2">3. Masukkan Kode OTP</h4>
              <p className="text-xs text-slate-500">Masukkan 6 digit angka OTP yang ada di HP Anda ke kolom yang tersedia, lalu verifikasi.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MfaSettings;
