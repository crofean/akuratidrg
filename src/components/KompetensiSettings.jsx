import React, { useState, useEffect } from 'react';
import { Save, Settings, Info, Search, Building, AlertCircle } from 'lucide-react';
import Select from 'react-select';
import { getAvailableGroups, CONFIG_KEY, levelValues, ALL_GROUPS } from '../utils/competencyAnalyzer';

export default function KompetensiSettings() {
  const [config, setConfig] = useState({});
  const [groups, setGroups] = useState([]);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');
  
  // Hospital auto-selection states
  const [hospitals, setHospitals] = useState([]);
  const [kodeRs, setKodeRs] = useState('');
  const [namaRs, setNamaRs] = useState('');

  useEffect(() => {
    const init = async () => {
      const { loadCompetencyCSV } = await import('../utils/competencyAnalyzer');
      await loadCompetencyCSV();
      
      const avGroups = ALL_GROUPS; // We use ALL_GROUPS
      setGroups(avGroups);
      
      // Load Hospitals
      try {
        const hospRes = await fetch('./data/hospitals.json');
        if (hospRes.ok) {
          const hospData = await hospRes.json();
          const options = hospData.map(h => ({
            value: h.kode_rs,
            label: `${h.kode_rs} - ${h.nama_rs}`,
            nama_rs: h.nama_rs
          }));
          setHospitals(options);
        }
      } catch (e) { console.error('Failed to fetch hospitals', e); }

      const savedCfg = localStorage.getItem(CONFIG_KEY);
      if (savedCfg) {
        const parsed = JSON.parse(savedCfg);
        setConfig(parsed.competencies || parsed); // support old and new formats
        setKodeRs(parsed.kodeRs || '');
        setNamaRs(parsed.namaRs || '');
      } else {
        const def = {};
        avGroups.forEach(g => def[g] = 'Tidak Melayani');
        setConfig(def);
      }
    };
    init();
  }, []);

  const handleSelectRs = async (selectedOption) => {
    if (selectedOption) {
      const newKode = selectedOption.value;
      setKodeRs(newKode);
      setNamaRs(selectedOption.nama_rs);
      
      try {
        const rsCompsRes = await fetch('./data/rs_competencies.json');
        const rsCompsData = await rsCompsRes.json();
        if (rsCompsData[newKode]) {
           const newConfig = { ...config };
           groups.forEach(g => newConfig[g] = 'Tidak Melayani'); // reset
           for (const [g, lvl] of Object.entries(rsCompsData[newKode])) {
               // Find matching group in `groups` ignoring prefix and case
               const stripPrefix = (name) => name.toLowerCase().replace('kelompok layanan ', '').trim();
               const gStripped = stripPrefix(g);
               const matchedGroup = groups.find(x => {
                  const xStripped = stripPrefix(x);
                  return xStripped === gStripped || 
                         (xStripped === 'rehabilitasi' && gStripped === 'rehabilitasi medis') ||
                         (xStripped === 'rehabilitasi medis' && gStripped === 'rehabilitasi') ||
                         (xStripped.includes('rekonstruksi') && gStripped.includes('rekontruksi')) ||
                         (xStripped.includes('endokrin') && gStripped.includes('endocrine')) ||
                         (xStripped.includes('hepatobilier') && gStripped.includes('hepatobiliar'));
               });

               if (matchedGroup) {
                   newConfig[matchedGroup] = lvl;
               } else {
                   newConfig[g] = lvl; // Fallback
               }
           }
           setConfig(newConfig);
        } else {
           const newConfig = {};
           groups.forEach(g => newConfig[g] = 'Tidak Melayani');
           setConfig(newConfig);
        }
      } catch (e) {
        console.warn('Failed to load auto competencies', e);
      }
    } else {
      setKodeRs('');
      setNamaRs('');
    }
  };

  const handleChange = (group, val) => {
    setConfig(prev => ({ ...prev, [group]: val }));
    setSaved(false);
  };

  const handleSave = () => {
    // Save both the competencies and the RS info
    const fullConfig = {
       kodeRs,
       namaRs,
       competencies: config,
       ...config // for backwards compatibility
    };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(fullConfig));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const filteredGroups = groups.filter(g => g.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center gap-4 bg-teal-50 p-6 rounded-3xl border-2 border-teal-100">
        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm">
          <Settings size={32} className="text-teal-600" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">Pemetaan Kompetensi Rumah Sakit</h2>
          <p className="text-sm text-slate-600 mt-1 font-medium">Atur Level Kompetensi Layanan (Dasar, Madya, Utama, Paripurna) yang tersedia di fasilitas Anda.</p>
        </div>
      </div>

      <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 mb-6 flex gap-4 items-start shadow-sm">
        <AlertCircle className="text-amber-600 mt-0.5 shrink-0" size={24} />
        <div>
          <h4 className="font-bold text-amber-900 mb-1">Peringatan Penting</h4>
          <p className="text-amber-800 text-sm leading-relaxed">
            Data pemetaan kompetensi yang digunakan pada sistem ini <strong>bukan merupakan rilis resmi dari Kementerian Kesehatan (Kemenkes)</strong> melainkan hasil kompilasi internal. Oleh karena itu, pengisian profil secara otomatis mungkin tidak 100% akurat dengan kondisi nyata. <strong>Anda diwajibkan untuk memeriksa dan menyesuaikan ulang tingkat kompetensi di bawah ini</strong> agar sesuai dengan kapabilitas layanan aktual di Rumah Sakit Anda sebelum melakukan analisis.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Building className="text-teal-600" size={24} />
          <h3 className="text-lg font-bold text-slate-800">Pilih Rumah Sakit (Otomatis)</h3>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-2">Pilih dari Database Master RS</label>
          <Select
            options={hospitals}
            onChange={handleSelectRs}
            placeholder="Ketik Kode atau Nama RS..."
            isClearable
            isSearchable
            value={hospitals.find(h => h.value === kodeRs) || null}
            className="text-sm font-medium"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="block text-sm font-bold text-slate-700 mb-2">Kode RS</label>
             <input type="text" value={kodeRs} onChange={e => setKodeRs(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700" placeholder="Kode RS" />
          </div>
          <div>
             <label className="block text-sm font-bold text-slate-700 mb-2">Nama RS</label>
             <input type="text" value={namaRs} onChange={e => setNamaRs(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700" placeholder="Nama RS" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari Kelompok Layanan..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-slate-700"
            />
          </div>
          
          <div className="flex items-center gap-3">
            {saved && <span className="text-emerald-600 font-bold text-sm flex items-center gap-1"><Info size={16}/> Disimpan</span>}
            <button 
              onClick={handleSave}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition-all shadow-lg shadow-teal-500/30"
            >
              <Save size={18} /> Simpan Pengaturan
            </button>
          </div>
        </div>

        <div className="overflow-hidden border border-slate-200 rounded-2xl">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-black text-slate-700 w-16 text-center">No</th>
                <th className="p-4 font-black text-slate-700">Kelompok Layanan</th>
                <th className="p-4 font-black text-slate-700 w-64 text-center">Level Kompetensi RS</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((g, i) => (
                <tr key={g} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-center font-bold text-slate-400">{i + 1}</td>
                  <td className="p-4 font-bold text-slate-700">{g}</td>
                  <td className="p-4">
                    <select
                      value={config[g] || 'Tidak Melayani'}
                      onChange={(e) => handleChange(g, e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 font-bold text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    >
                      {Object.keys(levelValues).filter(k => k !== 'Belum Ada Mapping').map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {filteredGroups.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500 font-medium">Tidak ada kelompok layanan yang cocok.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
