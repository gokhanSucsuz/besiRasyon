
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Beef, 
  Settings, 
  Trash2, 
  Calculator, 
  Zap, 
  Save, 
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  Tag,
  Archive,
  Clock,
  ArrowUpRight,
  FileText,
  Star,
  Award,
  TrendingUp,
  Cloud,
  Mountain,
  Download,
  Upload,
  Printer,
  Scale,
  Sparkles,
  AlertCircle,
  HelpCircle,
  LayoutDashboard,
  Activity,
  Wand2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  MousePointer2,
  Cpu,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { AnimalCategory, AnimalProfile, Feed, RationItem, NutrientRequirements } from './types';
import { BREEDS, FEEDS as INITIAL_FEEDS } from './constants';
import { getRationAdvice, fetchCurrentMarketPrices, optimizeRationAmounts } from './services/geminiService';
import { saveRationRecord, getAllRecords, deleteRecord, updateRecord, SavedRecord, exportDatabase, importDatabase } from './services/dbService';

const InfoLabel: React.FC<{ label: string; tooltip: string; className?: string }> = ({ label, tooltip, className }) => (
  <div className={`flex items-center gap-1.5 group/info cursor-help ${className}`}>
    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest transition-colors group-hover/info:text-emerald-600">
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

const getScoreColor = (score: number) => {
  if (isNaN(score) || score === null) return 'bg-slate-50 text-slate-400 border-slate-200';
  if (score >= 90) return 'bg-emerald-50 text-emerald-600 border-emerald-200';
  if (score >= 75) return 'bg-blue-50 text-blue-600 border-blue-200';
  if (score >= 50) return 'bg-amber-50 text-amber-600 border-amber-200';
  return 'bg-red-50 text-red-600 border-red-200';
};

const getCategoryIcon = (category: AnimalCategory) => {
  switch (category) {
    case AnimalCategory.CATTLE: return <Beef className="w-5 h-5" />;
    case AnimalCategory.SHEEP: return <Cloud className="w-5 h-5" />;
    case AnimalCategory.GOAT: return <Mountain className="w-5 h-5" />;
    default: return <Activity className="w-5 h-5" />;
  }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'prices' | 'history' | 'guide'>('calculator');
  const [feeds, setFeeds] = useState<Feed[]>(INITIAL_FEEDS);
  const [isPriceUpdating, setIsPriceUpdating] = useState(false);
  const [priceUpdatedDate, setPriceUpdatedDate] = useState<string | null>(null);
  const [history, setHistory] = useState<SavedRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState<number | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<AnimalProfile>({
    category: AnimalCategory.CATTLE,
    breedId: BREEDS[0].id,
    weight: 450,
    dailyGain: 1.2,
    ageMonths: 18,
  });

  const [ration, setRation] = useState<RationItem[]>([
    { feedId: 'corn_silage', amountKg: 4 },
    { feedId: 'alfalfa_hay', amountKg: 2 },
    { feedId: 'barley', amountKg: 2 },
  ]);

  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

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
        const dateStr = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        setPriceUpdatedDate(dateStr);
      }
    } catch (e) {
      console.error("Fiyat güncelleme hatası:", e);
    } finally {
      setIsPriceUpdating(false);
    }
  };

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
      dryMatterIntake: dmi > 0 ? dmi : 0.1,
      energy: maintenanceEnergy + gainEnergy,
      protein: maintenanceProtein + gainProtein,
      calcium: (profile.weight * 0.05) + (profile.dailyGain * 15),
      phosphorus: (profile.weight * 0.03) + (profile.dailyGain * 8),
      magnesium: dmi * 2.0,
      sodium: dmi * 1.2
    };
  }, [profile]);

  const totals = useMemo(() => {
    let dm = 0, energy = 0, protein = 0, ca = 0, p = 0, mg = 0, na = 0, bicarb = 0, cost = 0, totalKg = 0;
    ration.forEach(item => {
      const feed = feeds.find(f => f.id === item.feedId);
      if (feed) {
        const safeAmount = (typeof item.amountKg === 'number' && !isNaN(item.amountKg) && item.amountKg >= 0) ? item.amountKg : 0;
        totalKg += safeAmount;
        const itemDM = safeAmount * (feed.dryMatter / 100);
        dm += itemDM;
        energy += itemDM * feed.metabolizableEnergy;
        protein += itemDM * (feed.crudeProtein / 100) * 1000;
        ca += itemDM * (feed.calcium / 100) * 1000;
        p += itemDM * (feed.phosphorus / 100) * 1000;
        mg += itemDM * (feed.magnesium / 100) * 1000;
        na += itemDM * (feed.sodium / 100) * 1000;
        bicarb += itemDM * (feed.bicarbonate / 100) * 1000;
        cost += safeAmount * feed.pricePerKg;
      }
    });
    return { dm, energy, protein, ca, p, mg, na, bicarb, cost, totalKg };
  }, [ration, feeds]);

  const qualityScore = useMemo(() => {
    if (ration.length === 0) return 0;
    const calculatePartScore = (current: number, required: number) => {
      if (!required || required <= 0 || isNaN(current) || current === null) return 0;
      const deviation = Math.abs(current - required) / required;
      return Math.max(0, 100 * (1 - deviation));
    };
    const dmScore = calculatePartScore(totals.dm, requirements.dryMatterIntake);
    const energyScore = calculatePartScore(totals.energy, requirements.energy);
    const proteinScore = calculatePartScore(totals.protein, requirements.protein);
    const caScore = totals.ca >= requirements.calcium ? 100 : (totals.ca / requirements.calcium) * 100;
    const pScore = totals.p >= requirements.phosphorus ? 100 : (totals.p / requirements.phosphorus) * 100;
    const mgScore = totals.mg >= requirements.magnesium ? 100 : (totals.mg / requirements.magnesium) * 100;
    
    const scores = [dmScore, energyScore, proteinScore, caScore, pScore, mgScore].filter(s => !isNaN(s));
    if (scores.length === 0) return 0;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(avg);
  }, [totals, requirements, ration]);

  const isLimitExceeded = profile.category === AnimalCategory.CATTLE && totals.totalKg > 9.0;

  const handleSave = async (customAdvice?: string) => {
    if (ration.length === 0) return false;
    setIsSaving(true);
    try {
      const now = new Date();
      const newRecordId = await saveRationRecord({
        timestamp: now.getTime(),
        dateStr: now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        priceUpdatedDate: priceUpdatedDate || undefined,
        profile,
        ration,
        totals,
        requirements,
        qualityScore,
        aiAnalysisReports: customAdvice ? [customAdvice] : []
      });
      setCurrentRecordId(newRecordId);
      await loadHistory();
      if (!customAdvice) alert("Rasyon arşivlendi.");
      return true;
    } catch (e) {
      alert("Kayıt hatası.");
      return false;
    } finally { setIsSaving(false); }
  };

  const handleOptimize = async () => {
    if (isOptimizing || ration.length === 0) return;
    setIsOptimizing(true);
    try {
      const breed = BREEDS.find(b => b.id === profile.breedId);
      const optimizedItems = await optimizeRationAmounts(profile, breed?.name || 'Bilinmeyen', ration, feeds, requirements);
      
      if (optimizedItems && Array.isArray(optimizedItems)) {
        setRation(optimizedItems);
        alert("Rasyon optimize edildi.");
      }
    } catch (e: any) {
      alert(e.message || "Optimizasyon sırasında bir hata oluştu.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const getAdvice = async () => {
    if (isAiLoading || ration.length === 0) return;
    setIsAiLoading(true);
    setAiAdvice(null);
    setAiError(null);
    try {
      const breed = BREEDS.find(b => b.id === profile.breedId);
      const advice = await getRationAdvice(profile, breed?.name || 'Bilinmeyen', ration, feeds, totals, requirements);
      
      if (advice && advice.startsWith('KOTA HATASI:')) {
        setAiError(advice);
      } else if (advice && !advice.startsWith('HATA:')) {
        setAiAdvice(advice);
        if (currentRecordId) {
          const record = history.find(r => r.id === currentRecordId);
          if (record) await updateRecord({...record, aiAnalysisReports: [...(record.aiAnalysisReports || []), advice]});
        } else {
          await handleSave(advice);
        }
      } else {
        setAiError(advice);
      }
    } catch (e: any) {
      setAiError("Teknik bir hata oluştu.");
    } finally { setIsAiLoading(false); }
  };

  const chartData = useMemo(() => [
    { name: 'KM (kg)', Mevcut: totals.dm, Gereken: requirements.dryMatterIntake },
    { name: 'Enerji (MJ)', Mevcut: totals.energy, Gereken: requirements.energy },
    { name: 'Protein (g/10)', Mevcut: totals.protein / 10, Gereken: requirements.protein / 10 },
    { name: 'Kalsiyum (g)', Mevcut: totals.ca, Gereken: requirements.calcium },
    { name: 'Fosfor (g)', Mevcut: totals.p, Gereken: requirements.phosphorus },
  ], [totals, requirements]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-900">
      <header className="bg-slate-900 text-white py-6 px-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-5 cursor-pointer" onClick={() => setActiveTab('calculator')}>
            <div className="bg-emerald-500 p-3 rounded-2xl"><Beef className="w-8 h-8" /></div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">BesiRasyon <span className="text-emerald-400">PRO</span></h1>
          </div>
          <div className={`px-6 py-2 rounded-2xl border font-black transition-all ${getScoreColor(qualityScore)}`}>
            Rasyon Skoru: %{isNaN(qualityScore) ? 0 : qualityScore}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-8">
            <section className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100">
              <h2 className="font-black text-sm uppercase mb-6 text-slate-800 flex items-center gap-2"><Settings className="w-5 h-5 text-emerald-500"/> Hayvan Bilgileri</h2>
              <div className="flex gap-2 mb-6">
                {[AnimalCategory.CATTLE, AnimalCategory.SHEEP, AnimalCategory.GOAT].map(cat => (
                  <button key={cat} onClick={() => { const first = BREEDS.find(b => b.category === cat); setProfile({...profile, category: cat, breedId: first?.id || ''}) }} className={`flex-1 py-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all flex flex-col items-center gap-2 ${profile.category === cat ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                    {getCategoryIcon(cat)} {cat}
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                <select className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-5 font-bold outline-none focus:border-emerald-500" value={profile.breedId} onChange={e => setProfile({...profile, breedId: e.target.value})}>
                  {BREEDS.filter(b => b.category === profile.category).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Kilo (kg)</label><input type="number" value={profile.weight} onChange={e => setProfile({...profile, weight: Number(e.target.value)})} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-5 font-black outline-none focus:border-emerald-500"/></div>
                  <div><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Hedef Artış</label><input type="number" step="0.1" value={profile.dailyGain} onChange={e => setProfile({...profile, dailyGain: Number(e.target.value)})} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-5 font-black outline-none focus:border-emerald-500"/></div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-black text-sm uppercase text-slate-800 flex items-center gap-2"><Calculator className="w-5 h-5 text-emerald-500"/> Bileşenler</h2>
                <div className="flex gap-2">
                  <button onClick={handleOptimize} disabled={isOptimizing || ration.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all disabled:opacity-50">
                    {isOptimizing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} Miktar Optimize
                  </button>
                  <button onClick={() => setRation([...ration, {feedId: feeds[0].id, amountKg: 1}])} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Ekle</button>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                {ration.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-3xl flex gap-3 items-center">
                    <select className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold" value={item.feedId} onChange={e => {const newR = [...ration]; newR[idx].feedId = e.target.value; setRation(newR)}}>
                      {feeds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <input type="number" step="0.1" className="w-20 bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-black" value={item.amountKg} onChange={e => {const newR = [...ration]; newR[idx].amountKg = Number(e.target.value); setRation(newR)}}/>
                    <button onClick={() => setRation(ration.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>
                  </div>
                ))}
              </div>
              {profile.category === AnimalCategory.CATTLE && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 text-[11px] font-bold mb-4 ${isLimitExceeded ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                  {isLimitExceeded ? <AlertTriangle className="w-4 h-4" /> : <InfoLabel label="Sınır" tooltip="Büyükbaş için öğün sınırı 9kg'dır." />}
                  <span>Toplam miktar sınırı: <b>9.0 kg</b></span>
                </div>
              )}
              {ration.length > 0 && (
                <div className={`p-6 rounded-[2rem] border flex justify-between items-center transition-all ${isLimitExceeded ? 'bg-red-50 border-red-200' : 'bg-emerald-50/50 border-emerald-100/50'}`}>
                  <span className="text-[10px] font-black uppercase text-slate-500">Günlük Maliyet</span>
                  <div className="text-right">
                    <div className={`text-3xl font-black ${isLimitExceeded ? 'text-red-600' : 'text-emerald-700'}`}>{totals.cost.toFixed(2)} ₺</div>
                    <span className="text-[9px] font-black opacity-60">Hayvan / Gün</span>
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-7 space-y-8">
            <section className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100">
              <h2 className="font-black text-sm uppercase mb-6 text-slate-800 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-500" /> Analiz Grafiği</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8}} />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="Mevcut" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Gereken" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="bg-slate-900 rounded-[2.5rem] p-10 border border-white/5 shadow-2xl overflow-hidden relative">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4"><div className="p-3 bg-emerald-500 rounded-2xl"><Zap className="w-6 h-6 text-white" /></div><h2 className="font-black text-white text-base uppercase">AI Analiz</h2></div>
                <button onClick={getAdvice} disabled={isAiLoading || ration.length === 0} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase transition-all flex items-center gap-2 disabled:opacity-50">
                  {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Analiz Et
                </button>
              </div>
              {aiError && (
                <div className="mb-6 p-5 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                  <p className="text-white text-xs italic">{aiError}</p>
                </div>
              )}
              {aiAdvice ? (
                <div className="bg-white/5 p-8 rounded-[2rem] text-slate-300 text-sm whitespace-pre-wrap italic animate-in fade-in max-h-[300px] overflow-y-auto">
                  {aiAdvice}
                </div>
              ) : !isAiLoading && <div className="text-center py-10 text-slate-600 text-[10px] uppercase font-black">Uzman analizi için yukarıdaki butona basın.</div>}
            </section>
          </div>
        </div>
      </main>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-lg bg-white/95 backdrop-blur-xl px-10 py-5 rounded-[2.5rem] shadow-2xl border border-emerald-100 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Toplam Karışım</span>
          <span className={`text-3xl font-black ${isLimitExceeded ? 'text-red-600' : 'text-slate-900'}`}>{totals.totalKg.toFixed(1)} <span className="text-xs text-slate-400 ml-1">KG</span></span>
        </div>
        <button onClick={() => handleSave()} disabled={isSaving || ration.length === 0} className="bg-slate-900 text-white px-10 py-5 rounded-[1.75rem] font-black text-[11px] uppercase hover:bg-emerald-600 transition-all disabled:opacity-50">
          {isSaving ? 'Bekleyin' : 'Arşivle'}
        </button>
      </div>
    </div>
  );
};

export default App;
