#!/usr/bin/env python3
B = """
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [subTab, setSubTab] = useState('executive'); 
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [drilldown, setDrilldown] = useState({ isOpen: false, title: '', data: [] });
  const [globalFilter, setGlobalFilter] = useState({ periode: 'All', jenisRawat: 'All', kelasRawat: 'All', dpjp: 'All' });
  const [isScrolled, setIsScrolled] = useState(false);
  const [auditFilter, setAuditFilter] = useState('');

  const fileInputRef = useRef(null); const folderInputRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const checkMatchList = (arrIna, arrIdrg, exclusions) => {
    const cleanIna = Array.from(new Set(arrIna.map(c => String(c).trim().toUpperCase()).filter(c => c && c !== '-')));
    const cleanIdrg = Array.from(new Set(arrIdrg.map(c => String(c).trim().toUpperCase()).filter(c => c && c !== '-' && !exclusions.includes(c))));
    if(cleanIna.length === 0 && cleanIdrg.length === 0) return 100;
    if(cleanIna.length === 0 || cleanIdrg.length === 0) return 0;
    let mIna = 0, mIdrg = 0;
    cleanIna.forEach(i => { if (cleanIdrg.some(id => i.startsWith(id) || id.startsWith(i))) mIna++; });
    cleanIdrg.forEach(id => { if (cleanIna.some(i => i.startsWith(id) || id.startsWith(i))) mIdrg++; });
    if (mIna === cleanIna.length && mIdrg === cleanIdrg.length) return 100;
    return ((mIna / cleanIna.length) * 100 + (mIdrg / cleanIdrg.length) * 100) / 2;
  };

  const extract18 = (row) => {
    const getVal = (keys) => {
      for(let k of keys) {
        const m = Object.keys(row).find(rK => rK.toUpperCase().replace(/[^A-Z0-9]/g, '_') === k.toUpperCase().replace(/[^A-Z0-9]/g, '_') || rK.toUpperCase() === k.toUpperCase());
        if (m && row[m] !== undefined && row[m] !== '') {
          let str = String(row[m]).trim(); if(str === '-' || str === '0') return 0;
          if(str.includes(',') && str.includes('.')) str = str.lastIndexOf(',') > str.lastIndexOf('.') ? str.replace(/\\./g, '').replace(',', '.') : str.replace(/,/g, '');
          else if (str.includes(',')) str = str.replace(',', '.');
          const p = parseFloat(str.replace(/[^0-9.-]+/g,"")); return isNaN(p) ? 0 : p;
        }
      } return 0;
    };
    return compKeys.reduce((acc, c) => ({ ...acc, [c.key]: getVal([c.key.toUpperCase(), `TARIF_${c.key.toUpperCase()}`, c.label.toUpperCase().replace(/ /g,'_')]) }), {});
  };

  const processFiles = async (files) => {
    setError(''); const vFiles = Array.from(files).filter(f => f.name.endsWith('.txt') || f.type === 'text/plain');
    if (vFiles.length === 0) return setError('Masukkan file .txt');
    const newFiles = [];
    for (const f of vFiles) {
      if (uploadedFiles.some(ex => ex.name === f.name && ex.rawSize === f.size)) continue;
      try {
        const text = await f.text(); const lines = text.split('\\n').filter(l => l.trim() !== '');
        if (lines.length > 0) {
          const headers = lines[0].split('\\t').map(h => h.trim());
          const rows = lines.slice(1).map(l => { const vals = l.split('\\t'); let obj = {}; headers.forEach((h, i) => { obj[h] = vals[i] ? vals[i].trim() : ''; }); return obj; });
          newFiles.push({ id: Math.random().toString(36).substring(2, 11), name: f.name, rawSize: f.size, size: (f.size/1024).toFixed(2)+' KB', headers, rows });
        }
      } catch (err) { setError(`Gagal membaca ${f.name}`); }
    }
    if (newFiles.length === 0 && vFiles.length > 0) setError('File kosong atau duplikat.');
    else { setUploadedFiles(prev => [...prev, ...newFiles]); setActiveTab('dashboard'); }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) processFiles(e.dataTransfer.files); };
  const removeFile = (id) => setUploadedFiles(prev => prev.filter(f => f.id !== id));
  const clearData = () => { setUploadedFiles([]); setError(''); };

  const filterOptions = useMemo(() => {
    const periods = new Set(), jenis = new Set(), kelas = new Set(), dpjps = new Map();
    uploadedFiles.flatMap(f => f.rows).forEach(r => {
      const dObj = parseDate(r['DISCHARGE_DATE']);
      if (dObj) periods.add(`${dObj.getFullYear()}-${String(dObj.getMonth()+1).padStart(2,'0')}`);
      if (r['PTD']) jenis.add(String(r['PTD']).trim());
      const kls = r['KELAS_RAWAT'] || r['KELAS'] || r['HAK_KELAS']; if (kls) kelas.add(String(kls).trim());
      const np = normDpjp(r['DPJP']); if (!dpjps.has(np)) dpjps.set(np, r['DPJP'] || 'Unknown');
    });
    return { periods: Array.from(periods).sort((a,b) => b.localeCompare(a)), jenis: Array.from(jenis).sort(), kelas: Array.from(kelas).sort(), dpjps: Array.from(dpjps.entries()).map(([norm, disp]) => ({norm, disp})).sort((a,b) => a.disp.localeCompare(b.disp)) };
  }, [uploadedFiles]);
"""
with open('src/App.jsx', 'a', encoding='utf-8') as f:
    f.write(B)
print("Part B written:", len(B), "chars")
