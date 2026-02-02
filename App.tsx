
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
  ShieldCheck
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
    { feedId: 'corn_silage', amountKg: 15 },
    { feedId: 'alfalfa_hay', amountKg: 3 },
    { feedId: 'barley', amountKg: 4 },
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

    const mgReq = dmi * 2.0; 
    const naReq = dmi * 1.2; 

    return {
      dryMatterIntake: dmi,
      energy: maintenanceEnergy + gainEnergy,
      protein: maintenanceProtein + gainProtein,
      calcium: (profile.weight * 0.05) + (profile.dailyGain * 15),
      phosphorus: (profile.weight * 0.03) + (profile.dailyGain * 8),
      magnesium: mgReq,
      sodium: naReq
    };
  }, [profile]);

  const totals = useMemo(() => {
    let dm = 0, energy = 0, protein = 0, ca = 0, p = 0, mg = 0, na = 0, bicarb = 0, cost = 0;
    ration.forEach(item => {
      const feed = feeds.find(f => f.id === item.feedId);
      if (feed) {
        const itemDM = item.amountKg * (feed.dryMatter / 100);
        dm += itemDM;
        energy += itemDM * feed.metabolizableEnergy;
        protein += itemDM * (feed.crudeProtein / 100) * 1000;
        ca += itemDM * (feed.calcium / 100) * 1000;
        p += itemDM * (feed.phosphorus / 100) * 1000;
        mg += itemDM * (feed.magnesium / 100) * 1000;
        na += itemDM * (feed.sodium / 100) * 1000;
        bicarb += itemDM * (feed.bicarbonate / 100) * 1000;
        cost += item.amountKg * feed.pricePerKg;
      }
    });
    return { dm, energy, protein, ca, p, mg, na, bicarb, cost };
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
    const mgScore = totals.mg >= requirements.magnesium ? 100 : (totals.mg / requirements.magnesium) * 100;
    return Math.round((dmScore + energyScore + proteinScore + caScore + pScore + mgScore) / 6);
  }, [totals, requirements, ration]);

  const chartData = useMemo(() => [
    { name: 'KM (kg)', Mevcut: totals.dm, Gereken: requirements.dryMatterIntake },
    { name: 'Enerji (MJ)', Mevcut: totals.energy, Gereken: requirements.energy },
    { name: 'Protein (g/10)', Mevcut: totals.protein / 10, Gereken: requirements.protein / 10 },
    { name: 'Kalsiyum (g)', Mevcut: totals.ca, Gereken: requirements.calcium },
    { name: 'Fosfor (g)', Mevcut: totals.p, Gereken: requirements.phosphorus },
    { name: 'Magnezyum (g)', Mevcut: totals.mg, Gereken: requirements.magnesium },
    { name: 'Sodyum (g)', Mevcut: totals.na, Gereken: requirements.sodium },
  ], [totals, requirements]);

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
      alert("Yedekleme dosyası oluşturulurken bir hata oluştu.");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsBackupLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonString = e.target?.result as string;
        await importDatabase(jsonString);
        await loadHistory();
        alert("Yedek başarıyla geri yüklendi.");
      } catch (error) {
        alert("Geçersiz yedek dosyası.");
      } finally {
        setIsBackupLoading(false);
      }
    };
    reader.readAsText(file);
  };

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
      if (!customAdvice) {
        alert("Rasyon başarıyla arşivlendi.");
      }
      return true;
    } catch (e) {
      alert("Kayıt sırasında bir hata oluştu.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRecordWithAdvice = async (advice: string) => {
    if (!currentRecordId) return;
    const currentRecord = history.find(r => r.id === currentRecordId);
    if (!currentRecord) return;
    
    const updatedRecord: SavedRecord = {
      ...currentRecord,
      aiAnalysisReports: [...(currentRecord.aiAnalysisReports || []), advice]
    };
    
    await updateRecord(updatedRecord);
    await loadHistory();
  };

  const handleDeleteRecord = async (id: number) => {
    if (window.confirm("Bu rasyonu arşivden silmek istediğinize emin misiniz?")) {
      try {
        await deleteRecord(id);
        if (currentRecordId === id) setCurrentRecordId(null);
        await loadHistory();
      } catch (e) {
        alert("Silme işlemi başarısız oldu.");
      }
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
      
      if (advice && (advice.startsWith('HATA:') || advice.startsWith('KOTA HATASI:'))) {
        setAiError(advice);
      } else if (advice) {
        setAiAdvice(advice);
        if (currentRecordId) {
          await handleUpdateRecordWithAdvice(advice);
        } else {
          await handleSave(advice);
        }
        alert("Analiz tamamlandı ve arşive işlendi.");
      }
    } catch (e) {
      setAiError("Teknik bir hata oluştu. Lütfen tekrar deneyiniz.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (isOptimizing || ration.length === 0) return;
    setIsOptimizing(true);
    try {
      const breed = BREEDS.find(b => b.id === profile.breedId);
      const optimizedItems = await optimizeRationAmounts(profile, breed?.name || 'Bilinmeyen', ration, feeds, requirements);
      if (optimizedItems) {
        setRation(optimizedItems);
        alert("Rasyon miktarları besin ihtiyaçlarını %100'e yaklaştıracak şekilde Gemini tarafından güncellendi.");
      } else {
        alert("Optimizasyon yapılamadı. Lütfen bileşenleri kontrol edin.");
      }
    } catch (e) {
      alert("Bir hata oluştu.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handlePrint = (record: SavedRecord) => {
    const breed = BREEDS.find(b => b.id === record.profile.breedId)?.name || 'Bilinmeyen';
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Dinamik HTML Grafik Hazırlığı
    const currentChartData = [
      { name: 'KM (kg)', Mevcut: record.totals.dm, Gereken: record.requirements.dryMatterIntake },
      { name: 'Enerji (MJ)', Mevcut: record.totals.energy, Gereken: record.requirements.energy },
      { name: 'Protein (g)', Mevcut: record.totals.protein, Gereken: record.requirements.protein },
      { name: 'Kalsiyum (g)', Mevcut: record.totals.ca, Gereken: record.requirements.calcium },
      { name: 'Fosfor (g)', Mevcut: record.totals.p, Gereken: record.requirements.phosphorus },
      { name: 'Magnezyum (g)', Mevcut: record.totals.mg, Gereken: record.requirements.magnesium },
      { name: 'Sodyum (g)', Mevcut: record.totals.na, Gereken: record.requirements.sodium },
    ];

    const chartHtml = currentChartData.map(d => {
      const percentage = Math.min(100, (d.Mevcut / d.Gereken) * 100);
      const barColor = percentage < 85 || percentage > 115 ? '#ef4444' : '#10b981';
      return `
        <div style="margin-bottom: 12px;">
          <div style="display:flex; justify-content: space-between; font-size: 10px; font-weight: bold; margin-bottom: 4px;">
            <span>${d.name}</span>
            <span>%${Math.round(percentage)} (${d.Mevcut.toFixed(1)} / ${d.Gereken.toFixed(1)})</span>
          </div>
          <div style="height: 14px; background: #e2e8f0; border-radius: 7px; overflow: hidden; position: relative;">
            <div style="width: ${percentage}%; height: 100%; background: ${barColor};"></div>
          </div>
        </div>
      `;
    }).join('');

    const styles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
        .header { border-bottom: 4px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
        .section-title { font-size: 14px; font-weight: 900; text-transform: uppercase; color: #10b981; margin-bottom: 15px; border-left: 4px solid #10b981; padding-left: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { text-align: left; font-size: 10px; text-transform: uppercase; padding: 10px; border-bottom: 2px solid #e2e8f0; }
        td { padding: 12px 10px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
        .ai-report { background: #f0fdf4; padding: 20px; border-radius: 12px; font-size: 12px; white-space: pre-wrap; font-style: italic; margin-bottom: 15px; border: 1px solid #bbf7d0; }
        .page-break { page-break-before: always; }
        .chart-container { background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
      </style>
    `;
    const content = `
      <html>
        <head><title>Rasyon Raporu</title>${styles}</head>
        <body>
          <div class="header">
            <div><h1 style="margin:0; font-size:24px;">BesiRasyon <span style="color:#10b981">PRO</span></h1></div>
            <div style="text-align:right">Rasyon Skoru: %${record.qualityScore}<br/>${record.dateStr}</div>
          </div>
          <div class="section-title">Hayvan Bilgileri</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:30px;">
            <div style="background:#f8fafc; padding:15px; border-radius:10px;"><b>Irk:</b> ${breed}<br/><b>Ağırlık:</b> ${record.profile.weight} kg</div>
            <div style="background:#f8fafc; padding:15px; border-radius:10px;"><b>Hedef GCAA:</b> ${record.profile.dailyGain} kg/g<br/><b>Maliyet:</b> ${record.totals.cost.toFixed(2)} TL</div>
          </div>
          
          <div class="section-title">Besin Madde Analizi (Dengelenme Oranı)</div>
          <div class="chart-container">
            ${chartHtml}
          </div>

          <div class="section-title">Rasyon İçeriği</div>
          <table>
            <thead><tr><th>Yem Bileşeni</th><th style="text-align:right">Miktar (kg/gün)</th></tr></thead>
            <tbody>
              ${record.ration.map(item => `<tr><td>${INITIAL_FEEDS.find(f => f.id === item.feedId)?.name}</td><td style="text-align:right">${item.amountKg}</td></tr>`).join('')}
            </tbody>
          </table>
          
          ${record.aiAnalysisReports && record.aiAnalysisReports.length > 0 ? `
          <div class="page-break"></div>
          <div class="section-title" style="margin-top:30px;">Yapay Zeka Uzman Analiz Raporları</div>
          ${record.aiAnalysisReports.map((rep, i) => `
            <div style="font-weight: bold; margin-bottom: 8px; font-size: 12px; color: #64748b;">Analiz Raporu #${i+1}</div>
            <div class="ai-report">${rep}</div>
          `).join('')}
          ` : ''}
          <script>window.print(); setTimeout(() => window.close(), 500);</script>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-900">
      <header className="bg-slate-900 text-white py-6 px-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-emerald-500 p-3 rounded-2xl cursor-pointer" onClick={() => setActiveTab('calculator')}>
              <Beef className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">BesiRasyon <span className="text-emerald-400">PRO</span></h1>
              <div className="flex gap-4 mt-1">
                {[
                  {id: 'calculator', label: 'Planlayıcı'},
                  {id: 'prices', label: 'Fiyatlar'},
                  {id: 'history', label: 'Arşiv'},
                  {id: 'guide', label: 'Kılavuz'}
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {activeTab === 'calculator' && (
            <div className={`px-6 py-2 rounded-2xl border font-black hidden md:block transition-all shadow-sm ${getScoreColor(qualityScore)}`}>
              Rasyon Skoru: %{qualityScore}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-10">
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
            <div className="lg:col-span-5 space-y-8">
              <section className="bg-white rounded-[2.5rem] shadow-xl p-10 space-y-8 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Settings className="w-5 h-5" /></div>
                  <h2 className="font-black text-sm uppercase tracking-widest text-slate-800">Hayvan Parametreleri</h2>
                </div>
                <div className="flex gap-2">
                  {[AnimalCategory.CATTLE, AnimalCategory.SHEEP, AnimalCategory.GOAT].map(cat => (
                    <button key={cat} onClick={() => { const first = BREEDS.find(b => b.category === cat); setProfile({...profile, category: cat, breedId: first?.id || ''}) }} className={`flex-1 py-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all flex flex-col items-center gap-2 ${profile.category === cat ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                      {getCategoryIcon(cat)} {cat}
                    </button>
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

              <section className="bg-white rounded-[2.5rem] shadow-xl p-10 space-y-6 border border-slate-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Calculator className="w-5 h-5" /></div>
                    <h2 className="font-black text-sm uppercase tracking-widest text-slate-800">Rasyon Bileşenleri</h2>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleOptimize} 
                      disabled={isOptimizing || ration.length === 0}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all disabled:opacity-50"
                      title="Gemini bileşenlerin miktarını otomatik ayarlasın"
                    >
                      {isOptimizing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                      Akıllı Ayar
                    </button>
                    <button onClick={() => setRation([...ration, {feedId: feeds[0].id, amountKg: 1}])} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all">Ekle</button>
                  </div>
                </div>
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

            <div className="lg:col-span-7 space-y-8">
              <section className="bg-white rounded-[2.5rem] shadow-xl p-10 border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><TrendingUp className="w-5 h-5" /></div>
                  <h2 className="font-black text-sm uppercase tracking-widest text-slate-800">Besin Madde Analizi</h2>
                </div>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 700}} interval={0} angle={-15} textAnchor="end" />
                      <YAxis hide />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36}/>
                      <Bar dataKey="Mevcut" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Gereken" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-8">
                  <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100"><span className="block text-[8px] font-black text-slate-400 uppercase">KM (kg)</span><span className="text-lg font-black text-slate-800">{totals.dm.toFixed(1)} / {requirements.dryMatterIntake.toFixed(1)}</span></div>
                  <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100"><span className="block text-[8px] font-black text-slate-400 uppercase">Magnezyum</span><span className="text-lg font-black text-slate-800">{totals.mg.toFixed(1)} g</span></div>
                  <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100"><span className="block text-[8px] font-black text-slate-400 uppercase">Bikarbonat</span><span className="text-lg font-black text-slate-800">{totals.bicarb.toFixed(1)} g</span></div>
                  <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100"><span className="block text-[8px] font-black text-slate-400 uppercase">Sodyum</span><span className="text-lg font-black text-slate-800">{totals.na.toFixed(1)} g</span></div>
                </div>
              </section>

              <section className="bg-slate-900 rounded-[2.5rem] p-10 border border-white/5 relative shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4"><div className="p-3 bg-emerald-500 rounded-2xl"><Zap className="w-6 h-6 text-white" /></div><h2 className="font-black text-white text-base uppercase tracking-widest">AI Uzman Analizi</h2></div>
                  <button 
                    onClick={getAdvice} 
                    disabled={isAiLoading || ration.length === 0} 
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isAiLoading ? 'Analiz Yapılıyor...' : 'Rasyonu Analiz Et ve Arşivle'}
                  </button>
                </div>
                {aiError && (
                  <div className="mb-6 p-5 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-start gap-4 animate-in fade-in duration-300">
                    <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                    <p className="text-white text-sm italic">{aiError}</p>
                  </div>
                )}
                {aiAdvice ? (
                  <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 text-slate-300 text-sm whitespace-pre-wrap italic animate-in slide-in-from-bottom-4 duration-500 max-h-[350px] overflow-y-auto scrollbar-hide">
                    {aiAdvice}
                  </div>
                ) : !isAiLoading && (
                  <div className="text-center py-10 flex flex-col items-center gap-4">
                    <MessageSquare className="w-12 h-12 text-slate-700" />
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] max-w-[220px]">Uzman zooteknist analizi için yukarıdaki butona basın.</p>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {activeTab === 'prices' && (
          <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500">
             <div className="flex flex-col md:flex-row items-baseline justify-between gap-6 border-b border-slate-200 pb-10">
                <h2 className="text-4xl font-black tracking-tighter flex items-center gap-4"><Tag className="w-10 h-10 text-emerald-600" /> Güncel Piyasa Fiyatları</h2>
                <div className="flex flex-col items-end gap-2">
                  {priceUpdatedDate && (
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider border border-emerald-100 shadow-sm">
                      <Clock className="w-3.5 h-3.5" /> Son Güncelleme: {priceUpdatedDate}
                    </div>
                  )}
                  <button onClick={updatePricesWithAI} disabled={isPriceUpdating} className="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 transition-colors disabled:opacity-50">
                    <RefreshCw className={`w-3.5 h-3.5 ${isPriceUpdating ? 'animate-spin' : ''}`} /> Fiyatları Yenile
                  </button>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {feeds.map(f => (
                  <div key={f.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all group">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">{f.id}</span>
                    <h4 className="font-black text-lg text-slate-800 mb-4">{f.name}</h4>
                    <div className="text-2xl font-black text-emerald-600">{f.pricePerKg.toFixed(2)} <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">₺/kg</span></div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-black tracking-tighter flex items-center gap-4"><Archive className="w-10 h-10 text-emerald-600" /> Kayıtlı Rasyonlar</h2>
              <div className="flex gap-2">
                <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isBackupLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase shadow-sm active:scale-95 hover:bg-slate-50 transition-all"
                >
                  <Upload className="w-4 h-4" /> Geri Yükle
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-md active:scale-95 hover:bg-slate-800 transition-all">
                  <Download className="w-4 h-4" /> Yedekle
                </button>
              </div>
            </div>
            {history.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {history.map(record => (
                  <div key={record.id} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden group hover:border-emerald-500 transition-all flex flex-col">
                    <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                      <div>
                        <div className="text-[10px] text-emerald-400 font-black uppercase mb-1">{record.dateStr}</div>
                        <h3 className="font-black text-lg leading-tight">{BREEDS.find(b => b.id === record.profile.breedId)?.name}</h3>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => handlePrint(record)} className="p-2.5 bg-white/10 hover:bg-emerald-500 rounded-xl transition-all" title="Yazdır"><Printer className="w-4 h-4" /></button>
                         <button onClick={() => record.id !== undefined && handleDeleteRecord(record.id)} className="p-2.5 bg-white/10 hover:bg-red-500 rounded-xl transition-all" title="Sil"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="p-8 space-y-4 flex-1">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-50 p-3 rounded-2xl text-center"><span className="block text-[8px] font-black text-slate-400 uppercase">Ağırlık</span><span className="font-black text-slate-800">{record.profile.weight} kg</span></div>
                        <div className="bg-slate-50 p-3 rounded-2xl text-center"><span className="block text-[8px] font-black text-slate-400 uppercase">Maliyet</span><span className="font-black text-emerald-600">{record.totals.cost.toFixed(1)} ₺</span></div>
                        <div className="bg-slate-50 p-3 rounded-2xl text-center"><span className="block text-[8px] font-black text-slate-400 uppercase">Skor</span><span className="font-black text-blue-600">%{record.qualityScore}</span></div>
                      </div>
                      
                      {record.aiAnalysisReports && record.aiAnalysisReports.length > 0 && (
                        <div className="space-y-2">
                          <button 
                            onClick={() => setExpandedReportId(expandedReportId === record.id ? null : record.id!)}
                            className="w-full p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-[11px] text-emerald-800 font-black flex items-center justify-between hover:bg-emerald-100 transition-colors shadow-sm"
                          >
                            <span className="flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5" /> 
                              {record.aiAnalysisReports.length} analiz raporu mevcut
                            </span>
                            {expandedReportId === record.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          
                          {expandedReportId === record.id && (
                            <div className="max-h-[300px] overflow-y-auto space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 animate-in slide-in-from-top-2 duration-300 scrollbar-hide shadow-inner">
                              {record.aiAnalysisReports.map((rep, idx) => (
                                <div key={idx} className="text-[11px] text-slate-600 italic border-b border-slate-200 pb-3 last:border-0 last:pb-0">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-black uppercase text-[8px] text-emerald-600">Analiz Raporu #{idx+1}</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                  </div>
                                  <div className="whitespace-pre-wrap leading-relaxed">{rep}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <button 
                        onClick={() => { 
                          setProfile(record.profile); 
                          setRation(record.ration); 
                          setAiAdvice(record.aiAnalysisReports && record.aiAnalysisReports.length > 0 ? record.aiAnalysisReports[record.aiAnalysisReports.length-1] : null); 
                          setCurrentRecordId(record.id || null);
                          setActiveTab('calculator'); 
                        }}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shadow-md"
                      >Rasyonu Planlayıcıda Aç</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-400 font-black uppercase tracking-widest">Arşiv boş görünüyor.</div>
            )}
          </div>
        )}

        {activeTab === 'guide' && (
          <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-5xl font-black tracking-tighter flex items-center justify-center gap-4">
                <BookOpen className="w-12 h-12 text-emerald-600" /> Kullanım Kılavuzu
              </h2>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">BesiRasyon PRO ile Verimli Hayvancılık</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-4 group hover:border-emerald-200 transition-all">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-2"><MousePointer2 className="w-6 h-6" /></div>
                <h3 className="text-xl font-black">1. Hayvan Parametreleri</h3>
                <p className="text-slate-600 text-sm leading-relaxed">İlk adım olarak hayvanınızın kategorisini (Büyükbaş, Koyun, Keçi) ve ırkını seçin. Sisteme tanımlı 30'dan fazla genetik ırkın yaşama payı ihtiyaçları bilimsel normlara göre hesaplanır. Hedeflediğiniz canlı ağırlık artışını girerek besin madde normlarını belirleyin.</p>
              </section>

              <section className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-4 group hover:border-blue-200 transition-all">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-2"><Calculator className="w-6 h-6" /></div>
                <h3 className="text-xl font-black">2. Rasyon Hazırlama</h3>
                <p className="text-slate-600 text-sm leading-relaxed">"Ekle" butonuna basarak rasyon bileşenlerini seçin ve günlük verilecek miktarları kg cinsinden girin. Grafikler üzerinden KM, Enerji, Protein, Ca, P, Mg ve Na değerlerinin normlara ne kadar yakın olduğunu anlık takip edebilirsiniz.</p>
              </section>

              <section className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-4 group hover:border-purple-200 transition-all">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-2"><Cpu className="w-6 h-6" /></div>
                <h3 className="text-xl font-black">3. Akıllı Optimizasyon</h3>
                <p className="text-slate-600 text-sm leading-relaxed"><b>"Akıllı Ayar"</b> butonu ile Gemini AI seçtiğiniz yemlerin miktarlarını besin ihtiyaçlarına göre en ideal noktaya otomatik taşır. <b>"Analiz Et"</b> butonu ise zooteknist bakış açısıyla rasyonunuzu değerlendirir, olası sağlık sorunlarını önceden bildirir.</p>
              </section>

              <section className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-4 group hover:border-amber-200 transition-all">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-2"><Printer className="w-6 h-6" /></div>
                <h3 className="text-xl font-black">4. Raporlama ve Yazdırma</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Arşivlediğiniz rasyonları yazıcı ikonu ile PDF'e dönüştürebilirsiniz. Profesyonel çıktılarda besin dengesini gösteren grafikler, analiz raporları ve maliyet dökümleri otomatik olarak yer alır.</p>
              </section>
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-10 opacity-10"><ShieldCheck className="w-32 h-32" /></div>
              <h3 className="text-2xl font-black mb-6">Önemli Güvenlik ve Veri Notu</h3>
              <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
                <p>• Verileriniz tarayıcınızın yerel hafızasında (IndexedDB) saklanır. Cihaz dışına çıkarılmaz.</p>
                <p>• Cihaz değişikliği yapacaksanız "Arşiv" sekmesinden <b>"Yedekle"</b> butonunu kullanarak verilerinizi indirmeyi unutmayın.</p>
                <p>• AI analizleri için Gemini 3.0 modeli kullanılır. Analiz hataları veya kota uyarıları durumunda belirtilen süre kadar beklemeniz önerilir.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {activeTab === 'calculator' && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-lg">
          <div className="bg-white/95 backdrop-blur-xl px-10 py-5 rounded-[2.5rem] shadow-2xl border border-emerald-100/50 flex items-center justify-between">
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Toplam Karışım</span>
                <span className="text-3xl font-black text-slate-900">{ration.reduce((a,b)=>a+b.amountKg, 0).toFixed(1)} <span className="text-xs text-slate-400">KG</span></span>
             </div>
             <div className="flex gap-3">
                <button onClick={() => { setActiveTab('history'); setCurrentRecordId(null); }} className="p-5 bg-slate-100 text-slate-500 rounded-[1.75rem] transition-all hover:bg-emerald-50 active:scale-95 shadow-sm" title="Arşive Git"><Archive className="w-6 h-6" /></button>
                <button onClick={() => handleSave()} disabled={isSaving || ration.length === 0} className="bg-slate-900 text-white px-10 py-5 rounded-[1.75rem] font-black text-[11px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95 disabled:opacity-50">
                  {isSaving ? 'Kaydediliyor' : 'Arşivle'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
