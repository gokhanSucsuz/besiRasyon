
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Beef, 
  Settings, 
  Plus, 
  Trash2, 
  Calculator, 
  Zap, 
  ChevronRight, 
  Save, 
  Info,
  Activity,
  MessageSquare,
  RefreshCw,
  Search,
  CheckCircle2,
  Tag,
  ArrowLeft,
  LayoutDashboard,
  HelpCircle,
  Wheat,
  Archive,
  Calendar,
  Clock,
  ArrowUpRight,
  FileText,
  X,
  Check,
  Star,
  Award,
  TrendingUp,
  Cloud,
  Mountain,
  Download,
  Upload,
  Printer,
  ShieldCheck,
  Scale,
  ZapOff,
  Sparkles,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { AnimalCategory, AnimalProfile, Feed, RationItem, NutrientRequirements } from './types';
import { BREEDS, FEEDS as INITIAL_FEEDS } from './constants';
import { getRationAdvice, fetchCurrentMarketPrices, getPerfectRationSuggestion } from './services/geminiService';
import { saveRationRecord, getAllRecords, deleteRecord, SavedRecord, exportDatabase, importDatabase } from './services/dbService';

const InfoLabel: React.FC<{ label: string; tooltip: string; className?: string }> = ({ label, tooltip, className }) => (
  <div className={`flex items-center gap-1.5 group/info cursor-help ${className}`}>
    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest transition-colors group/info:hover:text-emerald-600">
      {label}
    </label>
    <div className="relative">
      <HelpCircle className="w-3.5 h-3.5 text-slate-300 group-hover/info:text-emerald-500 transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-3 bg-slate-900/95 backdrop-blur-sm text-white text-[11px] rounded-2xl opacity-0 group-hover/info:opacity-100 pointer-events-none transition-all duration-300 w-56 shadow-2xl z-[100] text-center leading-snug border border-white/10">
        {tooltip}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900/95"></div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'calculator' | 'prices' | 'history'>('calculator');
  const [feeds, setFeeds] = useState<Feed[]>(INITIAL_FEEDS);
  const [isPriceUpdating, setIsPriceUpdating] = useState(false);
  const [priceUpdatedDate, setPriceUpdatedDate] = useState<string | null>(null);
  const [history, setHistory] = useState<SavedRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isBackupLoading, setIsBackupLoading] = useState(false);

  const [profile, setProfile] = useState<AnimalProfile>({
    category: AnimalCategory.CATTLE,
    breedId: BREEDS[0].id,
    weight: 450,
    dailyGain: 1.2,
    ageMonths: 18,
  });

  const [ration, setRation] = useState<RationItem[]>([
    { feedId: 'corn_silage', amountKg: 15 },
    { feedId: 'alfalfa_hay', amountKg: 3 },
    { feedId: 'barley', amountKg: 4 },
  ]);

  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<{explanation: string, items: RationItem[]} | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // --- Effects ---
  useEffect(() => {
    updatePricesWithAI();
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const records = await getAllRecords();
      setHistory(records);
    } catch (e) {
      console.error("Geçmiş yükleme hatası:", e);
    }
  };

  const updatePricesWithAI = async () => {
    setIsPriceUpdating(true);
    try {
      const newPrices = await fetchCurrentMarketPrices(INITIAL_FEEDS);
      if (newPrices) {
        setFeeds(prev => prev.map(f => ({
          ...f,
          pricePerKg: newPrices[f.id] || f.pricePerKg
        })));
        const now = new Date();
        setPriceUpdatedDate(now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
      }
    } catch (e) {
      console.error("Fiyat güncelleme hatası:", e);
    } finally {
      setIsPriceUpdating(false);
    }
  };

  // --- Calculations ---
  const requirements = useMemo<NutrientRequirements>(() => {
    const breed = BREEDS.find(b => b.id === profile.breedId) || BREEDS[0];
    let dmiFactor = profile.category === AnimalCategory.CATTLE ? 0.025 : 0.035;
    let energyPerGain = profile.category === AnimalCategory.CATTLE ? 35 : 25;
    let proteinPerGain = profile.category === AnimalCategory.CATTLE ? 450 : 300;

    const maintenanceEnergy = profile.weight * breed.baseMaintenanceEnergy;
    const gainEnergy = profile.dailyGain * energyPerGain;
    const maintenanceProtein = profile.weight * breed.baseMaintenanceProtein;
    const gainProtein = profile.dailyGain * proteinPerGain;
    const dmi = profile.weight * dmiFactor;

    return {
      dryMatterIntake: dmi,
      energy: maintenanceEnergy + gainEnergy,
      protein: maintenanceProtein + gainProtein,
      calcium: (profile.weight * 0.05) + (profile.dailyGain * 15),
      phosphorus: (profile.weight * 0.03) + (profile.dailyGain * 8),
    };
  }, [profile]);

  const totals = useMemo(() => {
    let dm = 0, energy = 0, protein = 0, ca = 0, p = 0, cost = 0;
    ration.forEach(item => {
      const feed = feeds.find(f => f.id === item.feedId);
      if (feed) {
        const itemDM = item.amountKg * (feed.dryMatter / 100);
        dm += itemDM;
        energy += itemDM * feed.metabolizableEnergy;
        protein += itemDM * (feed.crudeProtein / 100) * 1000;
        ca += itemDM * (feed.calcium / 100) * 1000;
        p += itemDM * (feed.phosphorus / 100) * 1000;
        cost += item.amountKg * feed.pricePerKg;
      }
    });
    return { dm, energy, protein, ca, p, cost };
  }, [ration, feeds]);

  const qualityScore = useMemo(() => {
    if (ration.length === 0) return 0;
    const calculatePartScore = (current: number, required: number) => {
      if (required === 0) return 100;
      const deviation = Math.abs(current - required) / required;
      return Math.max(0, 100 * (1 - deviation));
    };
    const dmScore = calculatePartScore(totals.dm, requirements.dryMatterIntake);
    const energyScore = calculatePartScore(totals.energy, requirements.energy);
    const proteinScore = calculatePartScore(totals.protein, requirements.protein);
    const caScore = totals.ca >= requirements.calcium ? 100 : (totals.ca / requirements.calcium) * 100;
    const pScore = totals.p >= requirements.phosphorus ? 100 : (totals.p / requirements.phosphorus) * 100;
    return Math.round((dmScore + energyScore + proteinScore + caScore + pScore) / 5);
  }, [totals, requirements, ration]);

  // --- Handlers ---

  // fix: Added handleExport function to export the database records as a JSON file.
  const handleExport = async () => {
    try {
      const json = await exportDatabase();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `besirasyon-yedek-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Dışa aktarma hatası:", error);
      alert("Yedekleme dosyası oluşturulurken bir hata oluştu.");
    }
  };

  const handleSave = async (customAdvice?: string) => {
    if (ration.length === 0) return false;
    setIsSaving(true);
    try {
      const now = new Date();
      const reportToSave = customAdvice || aiAdvice || undefined;
      
      await saveRationRecord({
        timestamp: now.getTime(),
        dateStr: now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        priceUpdatedDate: priceUpdatedDate || undefined,
        profile,
        ration,
        totals,
        requirements,
        qualityScore,
        aiAnalysisReport: reportToSave
      });
      await loadHistory();
      return true;
    } catch (e) {
      console.error("Save error", e);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const getAdvice = async () => {
    if (ration.length === 0) {
      alert("Lütfen önce rasyona yem ekleyin.");
      return;
    }
    
    setIsAiLoading(true);
    setAiAdvice(null);
    setAiError(null);
    
    try {
      const breed = BREEDS.find(b => b.id === profile.breedId);
      const adviceResult = await getRationAdvice(
        profile, 
        breed?.name || 'Bilinmeyen', 
        ration, 
        feeds, 
        totals, 
        requirements
      );
      
      if (adviceResult && !adviceResult.startsWith('HATA:')) {
        setAiAdvice(adviceResult);
        // Başarılı analiz durumunda veri ve analizi birlikte kaydet
        const saveOk = await handleSave(adviceResult);
        if (saveOk) {
          alert("Analiz tamamlandı ve rasyon otomatik olarak arşivlendi.");
        }
      } else {
        const errorMsg = adviceResult || "Bilinmeyen bir hata oluştu.";
        setAiError(errorMsg);
      }
    } catch (e: any) {
      console.error("Advice Error:", e);
      setAiError("Bağlantı sorunu veya kota sınırı nedeniyle analiz yapılamadı. Lütfen tekrar deneyiniz.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handlePrint = (record: SavedRecord) => {
    const breed = BREEDS.find(b => b.id === record.profile.breedId)?.name || 'Bilinmeyen';
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; background-color: white; }
        .header { border-bottom: 4px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
        .title { font-size: 28px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -1px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #10b981; margin-bottom: 15px; border-left: 4px solid #10b981; padding-left: 10px; }
        .grid { display: grid; grid-template-cols: repeat(2, 1fr); gap: 20px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; }
        .label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
        .value { font-size: 16px; font-weight: 900; color: #1e293b; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { text-align: left; font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; padding: 10px; border-bottom: 2px solid #e2e8f0; }
        td { padding: 12px 10px; font-size: 13px; font-weight: 700; border-bottom: 1px solid #f1f5f9; }
        .total-row { background: #ecfdf5; font-weight: 900; }
        .ai-report-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 25px; border-radius: 20px; font-size: 13px; color: #065f46; line-height: 1.7; margin-top: 10px; white-space: pre-wrap; }
        .footer { margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; }
      </style>
    `;

    const content = `
      <html>
        <head><title>Rasyon Raporu</title>${styles}</head>
        <body>
          <div class="header">
            <div><div class="title">BesiRasyon <span style="color: #10b981">PRO</span></div></div>
            <div style="text-align: right">
              <div style="font-weight:900">Kalite Skoru: %${record.qualityScore}</div>
              <div style="font-size:12px;color:#64748b">${record.dateStr}</div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">Hayvan Bilgileri</div>
            <div class="grid">
              <div class="card"><div class="label">Irk</div><div class="value">${breed}</div></div>
              <div class="card"><div class="label">Canlı Ağırlık</div><div class="value">${record.profile.weight} kg</div></div>
              <div class="card"><div class="label">Hedef Artış</div><div class="value">${record.profile.dailyGain} kg/g</div></div>
              <div class="card"><div class="label">Maliyet</div><div class="value">${record.totals.cost.toFixed(2)} TL</div></div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">Rasyon İçeriği</div>
            <table>
              <thead><tr><th>Yem</th><th style="text-align:right">KG</th><th style="text-align:right">TL</th></tr></thead>
              <tbody>
                ${record.ration.map(item => {
                  const feed = INITIAL_FEEDS.find(f => f.id === item.feedId);
                  return `<tr><td>${feed?.name}</td><td style="text-align:right">${item.amountKg.toFixed(2)}</td><td style="text-align:right">${(item.amountKg * (feed?.pricePerKg || 0)).toFixed(2)}</td></tr>`;
                }).join('')}
                <tr class="total-row"><td>TOPLAM</td><td style="text-align:right">${record.ration.reduce((a,b)=>a+b.amountKg,0).toFixed(2)}</td><td style="text-align:right">${record.totals.cost.toFixed(2)}</td></tr>
              </tbody>
            </table>
          </div>
          ${record.aiAnalysisReport ? `
          <div class="section">
            <div class="section-title">AI Uzman Raporu</div>
            <div class="ai-report-box">${record.aiAnalysisReport.replace(/\n/g, '<br/>')}</div>
          </div>` : ''}
          <div class="footer">BesiRasyon PRO © ${new Date().getFullYear()}</div>
          <script>window.print(); setTimeout(() => window.close(), 500);</script>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const chartData = useMemo(() => [
    { name: 'KM (kg)', Mevcut: totals.dm, Gereken: requirements.dryMatterIntake },
    { name: 'Enerji (MJ)', Mevcut: totals.energy, Gereken: requirements.energy },
    { name: 'Protein (g/10)', Mevcut: totals.protein / 10, Gereken: requirements.protein / 10 },
    { name: 'Kalsiyum (g)', Mevcut: totals.ca, Gereken: requirements.calcium },
    { name: 'Fosfor (g)', Mevcut: totals.p, Gereken: requirements.phosphorus },
  ], [totals, requirements]);

  const handleDeleteRecord = async (id: number) => {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    await deleteRecord(id);
    await loadHistory();
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500 bg-emerald-50 border-emerald-200';
    if (score >= 75) return 'text-blue-500 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-amber-500 bg-amber-50 border-amber-200';
    return 'text-red-500 bg-red-50 border-red-200';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-slate-900 text-white py-6 px-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-emerald-500 p-3 rounded-2xl"><Beef className="w-8 h-8" /></div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">BesiRasyon <span className="text-emerald-400">PRO</span></h1>
              <div className="flex gap-4 mt-1">
                {['calculator', 'prices', 'history'].map(id => (
                  <button key={id} onClick={() => setActiveTab(id as any)} className={`text-[10px] font-black uppercase tracking-widest ${activeTab === id ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400'}`}>
                    {id === 'calculator' ? 'Planlayıcı' : id === 'prices' ? 'Fiyatlar' : 'Arşiv'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {activeTab === 'calculator' && (
            <div className={`px-6 py-2 rounded-2xl border font-black ${getScoreColor(qualityScore)}`}>Skor: %{qualityScore}</div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-10">
        {activeTab === 'calculator' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Sol Parametreler */}
            <div className="lg:col-span-5 space-y-8">
              <section className="bg-white rounded-[2.5rem] shadow-xl p-10 space-y-8">
                <div className="flex gap-2">
                  {[AnimalCategory.CATTLE, AnimalCategory.SHEEP, AnimalCategory.GOAT].map(cat => (
                    <button key={cat} onClick={() => setProfile({...profile, category: cat})} className={`flex-1 py-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all ${profile.category === cat ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-transparent text-slate-400'}`}>{cat}</button>
                  ))}
                </div>
                <div className="space-y-4">
                  <InfoLabel label="Genetik Irk" tooltip="Irka özgü baz enerji ve protein ihtiyaçları." />
                  <select className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-5 font-bold outline-none focus:border-emerald-500" value={profile.breedId} onChange={e => setProfile({...profile, breedId: e.target.value})}>
                    {BREEDS.filter(b => b.category === profile.category).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><InfoLabel label="Ağırlık (kg)" tooltip="Hayvan kilosu." /><input type="number" value={profile.weight} onChange={e => setProfile({...profile, weight: Number(e.target.value)})} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-5 font-black text-xl outline-none focus:border-emerald-500"/></div>
                    <div className="space-y-2"><InfoLabel label="Hedef Artış (kg/g)" tooltip="Günlük hedef kilo alımı." /><input type="number" step="0.1" value={profile.dailyGain} onChange={e => setProfile({...profile, dailyGain: Number(e.target.value)})} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-5 font-black text-xl outline-none focus:border-emerald-500"/></div>
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-[2.5rem] shadow-xl p-10 space-y-6">
                <div className="flex justify-between items-center"><h2 className="font-black text-sm uppercase tracking-widest text-slate-500">Rasyon Karışımı</h2><button onClick={() => setRation([...ration, {feedId: feeds[0].id, amountKg: 1}])} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Ekle</button></div>
                <div className="space-y-3">
                  {ration.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-3xl flex gap-3 items-center">
                      <select className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold" value={item.feedId} onChange={e => {const newR = [...ration]; newR[idx].feedId = e.target.value; setRation(newR)}}>
                        {feeds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                      <input type="number" step="0.1" className="w-20 bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-black" value={item.amountKg} onChange={e => {const newR = [...ration]; newR[idx].amountKg = Number(e.target.value); setRation(newR)}}/>
                      <button onClick={() => setRation(ration.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sağ Analiz ve AI */}
            <div className="lg:col-span-7 space-y-8">
              <section className="bg-white rounded-[2.5rem] shadow-xl p-10">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700}} />
                      <YAxis hide />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Mevcut" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Gereken" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-8">
                  <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100"><span className="block text-[8px] font-black text-slate-400 uppercase">Maliyet</span><span className="text-lg font-black text-emerald-600">{totals.cost.toFixed(1)} ₺</span></div>
                  <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100"><span className="block text-[8px] font-black text-slate-400 uppercase">Enerji</span><span className="text-lg font-black text-slate-800">{totals.energy.toFixed(0)} MJ</span></div>
                  <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100"><span className="block text-[8px] font-black text-slate-400 uppercase">Protein</span><span className="text-lg font-black text-slate-800">{totals.protein.toFixed(0)} g</span></div>
                  <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100"><span className="block text-[8px] font-black text-slate-400 uppercase">KM Toplam</span><span className="text-lg font-black text-slate-800">{totals.dm.toFixed(1)} kg</span></div>
                </div>
              </section>

              <section className="bg-slate-900 rounded-[2.5rem] p-10 border border-white/5 relative shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4"><div className="p-3 bg-emerald-500 rounded-2xl"><Zap className="w-6 h-6 text-white" /></div><h2 className="font-black text-white text-base uppercase tracking-widest">AI Uzman Analizi</h2></div>
                  <button 
                    onClick={getAdvice} 
                    disabled={isAiLoading || ration.length === 0} 
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isAiLoading ? 'Analiz Yapılıyor...' : 'Analiz Et ve Kaydet'}
                  </button>
                </div>
                
                {aiError && (
                  <div className="mb-6 p-5 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-start gap-4 animate-in fade-in duration-300">
                    <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-red-400 font-black text-xs uppercase mb-1 tracking-widest">Analiz Başarısız</p>
                      <p className="text-white text-sm italic">{aiError}</p>
                    </div>
                  </div>
                )}

                {aiAdvice ? (
                  <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 text-slate-300 text-sm whitespace-pre-wrap leading-relaxed italic animate-in slide-in-from-bottom-4 duration-500 max-h-[350px] overflow-y-auto scrollbar-hide">
                    {aiAdvice}
                  </div>
                ) : !isAiLoading && (
                  <div className="text-center py-10 flex flex-col items-center gap-4">
                    <MessageSquare className="w-12 h-12 text-slate-700" />
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] max-w-[220px]">Rasyonunuzu bilimsel olarak analiz etmek için yukarıdaki butona basın.</p>
                  </div>
                )}
              </section>
            </div>
          </div>
        ) : activeTab === 'history' ? (
          <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-black tracking-tighter flex items-center gap-4"><Archive className="w-10 h-10 text-emerald-600" /> Arşiv</h2>
              <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-md active:scale-95"><Download className="w-4 h-4" /> Tümünü Yedekle</button>
            </div>
            {history.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {history.map(record => (
                  <div key={record.id} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden group hover:border-emerald-500 transition-all">
                    <div className="bg-slate-900 p-6 text-white flex justify-between">
                      <div>
                        <div className="text-[10px] text-emerald-400 font-black uppercase mb-1">{record.dateStr}</div>
                        <h3 className="font-black text-lg">{BREEDS.find(b => b.id === record.profile.breedId)?.name}</h3>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => handlePrint(record)} className="p-2.5 bg-white/10 hover:bg-emerald-500 rounded-xl transition-all"><Printer className="w-4 h-4" /></button>
                         <button onClick={() => record.id && handleDeleteRecord(record.id)} className="p-2.5 bg-white/10 hover:bg-red-500 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="p-8 space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-50 p-3 rounded-2xl text-center"><span className="block text-[8px] font-black text-slate-400 uppercase">Ağırlık</span><span className="font-black text-slate-800">{record.profile.weight} kg</span></div>
                        <div className="bg-slate-50 p-3 rounded-2xl text-center"><span className="block text-[8px] font-black text-slate-400 uppercase">Maliyet</span><span className="font-black text-emerald-600">{record.totals.cost.toFixed(1)} ₺</span></div>
                        <div className="bg-slate-50 p-3 rounded-2xl text-center"><span className="block text-[8px] font-black text-slate-400 uppercase">Skor</span><span className="font-black text-blue-600">%{record.qualityScore}</span></div>
                      </div>
                      {record.aiAnalysisReport && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-[11px] text-emerald-800 italic line-clamp-3 overflow-hidden">
                          {record.aiAnalysisReport}
                        </div>
                      )}
                      <button 
                        onClick={() => { setProfile(record.profile); setRation(record.ration); setAiAdvice(record.aiAnalysisReport || null); setActiveTab('calculator'); }}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95"
                      >Kaydı Planlayıcıda Aç</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-400 font-black uppercase tracking-widest">Henüz kayıtlı rasyon bulunmuyor.</div>
            )}
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500">
             <h2 className="text-4xl font-black tracking-tighter flex items-center gap-4"><Tag className="w-10 h-10 text-emerald-600" /> Güncel Fiyatlar</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {feeds.map(f => (
                  <div key={f.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{f.id}</span>
                    <h4 className="font-black text-lg text-slate-800 mb-4">{f.name}</h4>
                    <div className="text-2xl font-black text-emerald-600">{f.pricePerKg.toFixed(2)} <span className="text-xs text-slate-400 font-bold uppercase">₺/kg</span></div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>

      {/* Floating Toolbar */}
      {activeTab === 'calculator' && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-lg">
          <div className="bg-white/95 backdrop-blur-xl px-10 py-5 rounded-[2.5rem] shadow-2xl border border-emerald-100/50 flex items-center justify-between">
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">KG Başına Oran</span>
                <span className="text-3xl font-black text-slate-900">{ration.reduce((a,b)=>a+b.amountKg, 0).toFixed(1)} <span className="text-xs text-slate-400">KG</span></span>
             </div>
             <button onClick={() => handleSave()} disabled={isSaving || ration.length === 0} className="bg-slate-900 text-white px-10 py-5 rounded-[1.75rem] font-black text-[11px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95 disabled:opacity-50">
                {isSaving ? 'Kaydediliyor...' : 'Manuel Kaydet'}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
