import React, { useState, useEffect } from 'react';
import { Save, Settings, Info, Search } from 'lucide-react';
import { getAvailableGroups, CONFIG_KEY, levelValues } from '../utils/competencyAnalyzer';

export default function KompetensiSettings() {
  const [config, setConfig] = useState({});
  const [groups, setGroups] = useState([]);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Need to wait for getAvailableGroups to potentially load the CSV
    const init = async () => {
      // In case loadCompetencyCSV wasn't called yet
      const { loadCompetencyCSV } = await import('../utils/competencyAnalyzer');
      await loadCompetencyCSV();
      
      const avGroups = getAvailableGroups();
      setGroups(avGroups);
      
      const savedCfg = localStorage.getItem(CONFIG_KEY);
      if (savedCfg) {
        setConfig(JSON.parse(savedCfg));
      } else {
        // Initialize default all to Paripurna
        const def = {};
        avGroups.forEach(g => def[g] = 'Paripurna');
        setConfig(def);
      }
    };
    init();
  }, []);

  const handleChange = (group, val) => {
    setConfig(prev => ({ ...prev, [group]: val }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
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
                      value={config[g] || 'Paripurna'}
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
                  <td colSpan={3} className="p-8 text-center text-slate-500 font-medium">Tidak ada kelompok layanan yang cocok. Pastikan dataset ICD Kompetensi sudah terupload di backend.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
