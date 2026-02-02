
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
  AlertCircle
} from 'lucide-react';
import { AnimalCategory, AnimalProfile, Feed, RationItem, NutrientRequirements } from './types';
import { BREEDS, FEEDS as INITIAL_FEEDS } from './constants';
import { getRationAdvice, fetchCurrentMarketPrices, getPerfectRationSuggestion } from './services/geminiService';
import { saveRationRecord, getAllRecords, deleteRecord, SavedRecord, exportDatabase, importDatabase } from './services/dbService';

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

  // --- Backup & Restore ---
  const handleExport = async () => {
    try {
      const data = await exportDatabase();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BesiRasyon_Yedek_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Yedek alınırken bir hata oluştu.");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!confirm("Tüm mevcut veriler silinecek ve yedek dosyası yüklenecek. Onaylıyor musunuz?")) return;

    setIsBackupLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        await importDatabase(content);
        await loadHistory();
        alert("Veriler başarıyla geri yüklendi.");
      } catch (err) {
        alert("Geri yükleme hatası: Dosya formatı geçersiz.");
      } finally {
        setIsBackupLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // --- Print System ---
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
        .meta { font-size: 12px; color: #64748b; font-weight: 700; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #10b981; margin-bottom: 15px; border-left: 4px solid #10b981; padding-left: 10px; }
        .grid { display: grid; grid-template-cols: repeat(2, 1fr); gap: 20px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; }
        .label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
        .value { font-size: 16px; font-weight: 900; color: #1e293b; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { text-align: left; font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; padding: 10px; border-bottom: 2px solid #e2e8f0; }
        td { padding: 12px 10px; font-size: 13px; font-weight: 700; border-bottom: 1px solid #f1f5f9; }
        .total-row { background: #ecfdf5; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 900; text-transform: uppercase; }
        .badge-success { background: #10b981; color: white; }
        .footer { margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        .price-note { font-size: 9px; color: #94a3b8; font-style: italic; margin-top: 5px; }
        .ai-report-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 25px; border-radius: 20px; font-size: 13px; color: #065f46; line-height: 1.7; margin-top: 10px; white-space: pre-wrap; font-weight: 500; }
        .ai-report-box b, .ai-report-box strong { color: #064e3b; font-weight: 900; }
      </style>
    `;

    const content = `
      <html>
        <head><title>Rasyon Raporu - ${record.dateStr}</title>${styles}</head>
        <body>
          <div class="header">
            <div>
              <div class="title">BesiRasyon <span style="color: #10b981">PRO</span></div>
              <div class="meta">Profesyonel Hayvan Besleme Raporu</div>
            </div>
            <div style="text-align: right">
              <div class="badge badge-success">Kalite Skoru: %${record.qualityScore}</div>
              <div class="meta" style="margin-top: 5px">${record.dateStr}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Hayvan Bilgileri</div>
            <div class="grid">
              <div class="card"><div class="label">Kategori / Irk</div><div class="value">${record.profile.category} - ${breed}</div></div>
              <div class="card"><div class="label">Canlı Ağırlık</div><div class="value">${record.profile.weight} kg</div></div>
              <div class="card"><div class="label">Hedef Günlük Artış</div><div class="value">${record.profile.dailyGain} kg</div></div>
              <div class="card"><div class="label">Günlük Maliyet</div><div class="value">${record.totals.cost.toFixed(2)} TL</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Rasyon Karışımı ve Fiyatlandırma</div>
            <table>
              <thead>
                <tr>
                  <th>Yem Adı</th>
                  <th style="text-align: right">Birim Fiyat (TL/kg)</th>
                  <th style="text-align: right">Miktar (KG/Gün)</th>
                  <th style="text-align: right">Toplam (TL)</th>
                </tr>
              </thead>
              <tbody>
                ${record.ration.map(item => {
                  const feed = INITIAL_FEEDS.find(f => f.id === item.feedId);
                  const price = feed?.pricePerKg || 0;
                  return `
                    <tr>
                      <td>${feed?.name}</td>
                      <td style="text-align: right">${price.toFixed(2)} ₺</td>
                      <td style="text-align: right">${item.amountKg.toFixed(2)}</td>
                      <td style="text-align: right">${(item.amountKg * price).toFixed(2)} ₺</td>
                    </tr>
                  `;
                }).join('')}
                <tr class="total-row">
                  <td colspan="2" style="font-weight: 900">GENEL TOPLAM</td>
                  <td style="text-align: right; font-weight: 900">${record.ration.reduce((a, b) => a + b.amountKg, 0).toFixed(2)} KG</td>
                  <td style="text-align: right; font-weight: 900">${record.totals.cost.toFixed(2)} TL</td>
                </tr>
              </tbody>
            </table>
            ${record.priceUpdatedDate ? `<div class="price-note"> * Fiyatlar piyasadan ${record.priceUpdatedDate} tarihinde otomatik olarak alınmıştır.</div>` : ''}
          </div>

          ${record.aiAnalysisReport ? `
          <div class="section">
            <div class="section-title">AI Uzman Analiz Raporu</div>
            <div class="ai-report-box">${record.aiAnalysisReport.replace(/\n/g, '<br/>')}</div>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Besin Madde Analizi</div>
            <table>
              <thead>
                <tr>
                  <th>Bileşen</th>
                  <th>Mevcut Değer</th>
                  <th>Gereken Norm</th>
                  <th>Karşılama Oranı</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Kuru Madde (kg)</td><td>${record.totals.dm.toFixed(2)}</td><td>${record.requirements.dryMatterIntake.toFixed(2)}</td><td>%${Math.round((record.totals.dm / record.requirements.dryMatterIntake)*100)}</td></tr>
                <tr><td>Enerji (MJ)</td><td>${record.totals.energy.toFixed(2)}</td><td>${record.requirements.energy.toFixed(2)}</td><td>%${Math.round((record.totals.energy / record.requirements.energy)*100)}</td></tr>
                <tr><td>Ham Protein (g)</td><td>${record.totals.protein.toFixed(2)}</td><td>${record.requirements.protein.toFixed(2)}</td><td>%${Math.round((record.totals.protein / record.requirements.protein)*100)}</td></tr>
                <tr><td>Kalsiyum (g)</td><td>${record.totals.ca.toFixed(2)}</td><td>${record.requirements.calcium.toFixed(2)}</td><td>%${Math.round((record.totals.ca / record.requirements.calcium)*100)}</td></tr>
                <tr><td>Fosfor (g)</td><td>${record.totals.p.toFixed(2)}</td><td>${record.requirements.phosphorus.toFixed(2)}</td><td>%${Math.round((record.totals.p / record.requirements.phosphorus)*100)}</td></tr>
              </tbody>
            </table>
          </div>

          <div class="footer">
            Bu rapor BesiRasyon PRO Akıllı Karar Destek Sistemi tarafından üretilmiştir. © ${new Date().getFullYear()} <br/>
            Sistem bilimsel besleme normlarını (NRC/INRA) baz almaktadır.
          </div>
          <script>window.print(); setTimeout(() => window.close(), 500);</script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
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

  const chartData = useMemo(() => [
    { name: 'KM (kg)', Mevcut: totals.dm, Gereken: requirements.dryMatterIntake },
    { name: 'Enerji (MJ)', Mevcut: totals.energy, Gereken: requirements.energy },
    { name: 'Protein (g/10)', Mevcut: totals.protein / 10, Gereken: requirements.protein / 10 },
    { name: 'Kalsiyum (g)', Mevcut: totals.ca, Gereken: requirements.calcium },
    { name: 'Fosfor (g)', Mevcut: totals.p, Gereken: requirements.phosphorus },
  ], [totals, requirements]);

  // --- Handlers ---
  const handleSave = async (customAdvice?: string) => {
    if (ration.length === 0) return;
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
      
      // Kullanıcı manuel kaydet butonuna bastıysa bildirim ver
      if (!customAdvice) {
        alert(`Rasyon %${qualityScore} kalite skoru ile başarıyla arşivlendi.`);
      }
      return true;
    } catch (e) {
      console.error("Save error", e);
      alert("Kayıt sırasında bir hata oluştu.");
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
    setAiAdvice(null); // Eski analizi temizle
    
    try {
      const breed = BREEDS.find(b => b.id === profile.breedId);
      const advice = await getRationAdvice(
        profile, 
        breed?.name || 'Bilinmeyen', 
        ration, 
        feeds, 
        totals, 
        requirements
      );
      
      if (advice) {
        setAiAdvice(advice);
        // "analiz yaptığımda veriye ait analizi veriye kaydet. veriler kaydedilmediyse hem veriyi hem de analiz raporunu kaydet"
        await handleSave(advice);
        alert("Analiz tamamlandı ve bu rasyon otomatik olarak arşivlendi.");
      } else {
        alert("Analiz raporu oluşturulamadı. Lütfen API bağlantınızı kontrol edin.");
        setAiAdvice("Analiz raporu alınamadı.");
      }
    } catch (e) {
      console.error("Advice Error:", e);
      setAiAdvice("Yapay zeka analizine şu an ulaşılamıyor. Lütfen daha sonra tekrar deneyiniz.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const requestPerfectSuggestion = async () => {
    setIsOptimizing(true);
    try {
      const breed = BREEDS.find(b => b.id === profile.breedId);
      const result = await getPerfectRationSuggestion(profile, breed?.name || 'Bilinmeyen', feeds);
      if (result) setSuggestion(result);
      else alert("Öneri oluşturulamadı.");
    } catch (e) {
      alert("Bir hata oluştu.");
    } finally {
      setIsOptimizing(false);
    }
  };

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

  const getCategoryIcon = (category: AnimalCategory) => {
    switch (category) {
      case AnimalCategory.CATTLE: return <Beef className="w-6 h-6" />;
      case AnimalCategory.SHEEP: return <Cloud className="w-6 h-6" />;
      case AnimalCategory.GOAT: return <Mountain className="w-6 h-6" />;
      default: return <Activity className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-900 selection:bg-emerald-100">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100/50 py-2 px-4 relative overflow-hidden text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-[11px] font-black text-emerald-800 uppercase tracking-widest z-10 relative">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          {priceUpdatedDate ? `Fiyat Endeksi Güncel: ${priceUpdatedDate}` : 'Akıllı Rasyon Karar Destek Sistemi'}
        </div>
      </div>

      {/* Header */}
      <header className="bg-slate-900 text-white py-6 px-4 shadow-2xl sticky top-0 z-50 border-b border-white/5 backdrop-blur-md bg-slate-900/95">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-emerald-500 shadow-lg p-3 rounded-2xl cursor-pointer" onClick={() => setActiveTab('calculator')}>
              <Beef className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2 uppercase">
                BesiRasyon <span className="bg-emerald-500 text-[10px] px-2 py-0.5 rounded-md text-white align-middle tracking-widest">PRO</span>
              </h1>
              <div className="flex flex-wrap gap-5 mt-1">
                {['calculator', 'prices', 'history'].map(id => (
                  <button key={id} onClick={() => setActiveTab(id as any)} className={`text-[10px] font-black uppercase tracking-widest transition-all relative pb-1 ${activeTab === id ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}>
                    {id === 'calculator' ? 'Planlayıcı' : id === 'prices' ? 'Fiyatlar' : 'Arşiv'}
                    {activeTab === id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-400 rounded-full"></div>}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-5">
            {activeTab === 'calculator' && (
              <div className={`border px-6 py-2.5 rounded-2xl hidden md:flex flex-col items-center shadow-sm ${getScoreColor(qualityScore)}`}>
                <span className="text-[8px] uppercase font-black tracking-[0.2em] mb-0.5 opacity-80">Rasyon Skoru</span>
                <div className="flex items-center gap-1.5"><Award className="w-4 h-4" /><span className="text-xl font-black">%{qualityScore}</span></div>
              </div>
            )}
            <button onClick={() => setActiveTab('history')} className="p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 relative"><Archive className="w-5 h-5 text-slate-400" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-10">
        {activeTab === 'calculator' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-700">
            {/* Left Column */}
            <div className="lg:col-span-5 space-y-8">
              <section className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-50/80 px-10 py-6 border-b border-slate-100"><h2 className="font-black text-slate-800 tracking-tight text-sm uppercase flex items-center gap-3"><Settings className="w-5 h-5 text-emerald-600" /> Hayvan Parametreleri</h2></div>
                <div className="p-10 grid grid-cols-2 gap-8">
                  <div className="col-span-2 flex gap-4">
                    {[AnimalCategory.CATTLE, AnimalCategory.SHEEP, AnimalCategory.GOAT].map(cat => (
                      <button key={cat} onClick={() => { const first = BREEDS.find(b => b.category === cat); setProfile(p => ({...p, category: cat, breedId: first?.id || ''})) }} className={`flex-1 py-4 rounded-2xl border-2 text-[11px] font-black transition-all flex flex-col items-center gap-2 ${profile.category === cat ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>
                        {getCategoryIcon(cat)} {cat}
                      </button>
                    ))}
                  </div>
                  <div className="col-span-2">
                    <InfoLabel label="Genetik Irk" tooltip="Irka özgü besleme normları." className="mb-2" />
                    <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-5 font-bold focus:border-emerald-500 outline-none" value={profile.breedId} onChange={(e) => setProfile(p => ({...p, breedId: e.target.value}))}>
                      {BREEDS.filter(b => b.category === profile.category).map(breed => <option key={breed.id} value={breed.id}>{breed.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2"><InfoLabel label="Canlı Ağırlık (kg)" tooltip="Hayvan ağırlığı." /><input type="number" value={profile.weight} onChange={(e) => setProfile(p => ({...p, weight: Number(e.target.value)}))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-5 font-black text-xl outline-none focus:border-emerald-500"/></div>
                  <div className="space-y-2"><InfoLabel label="Hedef Artış (kg/gün)" tooltip="Günlük canlı ağırlık artışı." /><input type="number" step="0.1" value={profile.dailyGain} onChange={(e) => setProfile(p => ({...p, dailyGain: Number(e.target.value)}))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-5 font-black text-xl outline-none focus:border-emerald-500"/></div>
                </div>
              </section>

              <section className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-50/80 px-10 py-6 border-b border-slate-100 flex items-center justify-between"><h2 className="font-black text-slate-800 tracking-tight text-sm uppercase flex items-center gap-3"><Calculator className="w-5 h-5 text-blue-600" /> Rasyon Karışımı</h2><button onClick={() => setRation([...ration, { feedId: feeds[0].id, amountKg: 1 }])} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase">Ekle</button></div>
                <div className="p-10 space-y-4 max-h-[500px] overflow-y-auto scrollbar-hide">
                  {ration.map((item, index) => {
                    const feed = feeds.find(f => f.id === item.feedId);
                    return (
                      <div key={index} className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100 flex flex-col gap-3">
                        <select className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold" value={item.feedId} onChange={(e) => { const newR = [...ration]; newR[index].feedId = e.target.value; setRation(newR); }}>
                          {feeds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                        <div className="flex gap-2">
                          <input type="number" step="0.1" className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-black" value={item.amountKg} onChange={(e) => { const newR = [...ration]; newR[index].amountKg = Number(e.target.value); setRation(newR); }}/>
                          <button onClick={() => setRation(ration.filter((_, i) => i !== index))} className="p-2 bg-red-50 text-red-500 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-7 space-y-8">
              <section className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-10">
                <div className="flex items-center justify-between mb-8"><h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /> Rasyon Analizi</h3><div className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase ${getScoreColor(qualityScore)}`}>Skor: %{qualityScore}</div></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                  <div className="p-4 bg-slate-50 rounded-2xl border"><div className="label">KM (kg)</div><div className="value">{totals.dm.toFixed(1)}</div></div>
                  <div className="p-4 bg-slate-50 rounded-2xl border"><div className="label">Enerji (MJ)</div><div className="value">{totals.energy.toFixed(0)}</div></div>
                  <div className="p-4 bg-slate-50 rounded-2xl border"><div className="label">Protein (g)</div><div className="value">{totals.protein.toFixed(0)}</div></div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100"><div className="label text-emerald-600">Maliyet (₺)</div><div className="value text-emerald-700">{totals.cost.toFixed(1)}</div></div>
                </div>
                <div className="h-[350px] w-full mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800 }} />
                      <YAxis hide />
                      <Tooltip cursor={{fill: '#f8fafc'}} />
                      <Legend iconType="circle" wrapperStyle={{paddingTop: 20, fontSize: 10, fontWeight: 700}} />
                      <Bar dataKey="Mevcut" fill="#10B981" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Gereken" fill="#E2E8F0" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="bg-slate-900 rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden shadow-2xl">
                {suggestion && (
                  <div className="absolute inset-0 bg-slate-900/98 backdrop-blur-xl z-30 p-10 flex flex-col justify-center animate-in fade-in zoom-in duration-300">
                    <div className="flex items-center gap-4 mb-4"><Star className="w-8 h-8 text-amber-500 fill-amber-500" /><h3 className="text-xl font-black text-white uppercase">Mükemmel Rasyon Önerisi</h3></div>
                    <p className="text-slate-300 text-sm mb-6 italic leading-relaxed">"{suggestion.explanation}"</p>
                    <div className="flex gap-4"><button onClick={() => {setRation(suggestion.items); setSuggestion(null);}} className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl shadow-emerald-500/20">Uygula</button><button onClick={() => setSuggestion(null)} className="flex-1 bg-white/5 text-white py-4 rounded-2xl font-black uppercase text-xs border border-white/10">İptal</button></div>
                  </div>
                )}
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-4"><div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20"><Zap className="w-5 h-5 text-white" /></div><h2 className="font-black text-white text-base uppercase tracking-tight">AI UZMAN DANIŞMAN</h2></div>
                  <div className="flex gap-3">
                    <button onClick={requestPerfectSuggestion} disabled={isOptimizing} className="bg-amber-500 text-white p-3 rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-lg shadow-amber-500/20" title="Mükemmel Rasyon Önerisi">{isOptimizing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Star className="w-5 h-5" />}</button>
                    <button 
                      onClick={getAdvice} 
                      disabled={isAiLoading || ration.length === 0} 
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-[11px] uppercase transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Analiz Et & Arşivle
                    </button>
                  </div>
                </div>
                {aiAdvice ? (
                  <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 text-slate-300 text-sm whitespace-pre-wrap leading-relaxed italic animate-in slide-in-from-bottom-4 duration-500 max-h-[400px] overflow-y-auto scrollbar-hide">
                    {aiAdvice}
                  </div>
                ) : (
                  <div className="text-center py-16 flex flex-col items-center gap-4 group">
                    <div className="p-4 bg-white/5 rounded-full border border-white/5 group-hover:bg-white/10 transition-colors">
                      <MessageSquare className="w-10 h-10 text-slate-600 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] max-w-[200px]">Rasyonunuzu analiz etmek için yukarıdaki butonu kullanın.</p>
                  </div>
                )}
              </section>
            </div>
          </div>
        ) : activeTab === 'prices' ? (
          <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-baseline justify-between gap-4 border-b pb-8">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4"><Tag className="w-10 h-10 text-emerald-600" /> Güncel Piyasa Endeksi</h2>
              {priceUpdatedDate && <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-full">Son Güncelleme: {priceUpdatedDate}</span>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feeds.map(feed => (
                <div key={feed.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{feed.id}</p>
                  <h4 className="font-black text-slate-800 text-lg mb-6 border-b pb-4 group-hover:text-emerald-600 transition-colors">{feed.name}</h4>
                  <div className="flex items-baseline gap-1.5"><span className="text-2xl font-black text-emerald-600">{feed.pricePerKg.toFixed(2)}</span><span className="text-xs font-bold text-slate-400">₺/kg</span></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-right-4 duration-500">
            {/* Arşiv Yönetimi */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4"><Archive className="w-10 h-10 text-emerald-600" /> Kayıtlı Arşiv</h2>
              <div className="flex items-center gap-3 bg-white p-2 rounded-[2rem] shadow-xl border border-slate-100">
                <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-emerald-600 transition-all shadow-md active:scale-95"><Download className="w-4 h-4" /> Yedekle</button>
                <label className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 rounded-2xl font-black text-[10px] uppercase hover:bg-emerald-100 transition-all cursor-pointer shadow-sm active:scale-95">
                  <Upload className="w-4 h-4" /> {isBackupLoading ? 'Yükleniyor...' : 'Geri Yükle'}
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </div>
            </div>

            {history.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {history.map((record) => (
                  <div key={record.id} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden group hover:border-emerald-500 transition-all flex flex-col">
                    <div className="bg-slate-900 p-6 text-white flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase mb-1"><Clock className="w-3 h-3" /> {record.dateStr}</div>
                        <h3 className="font-black text-lg">{record.profile.category} - {BREEDS.find(b => b.id === record.profile.breedId)?.name}</h3>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => handlePrint(record)} className="p-2.5 bg-white/10 hover:bg-emerald-500/20 text-white rounded-xl transition-all" title="PDF Raporu Al"><Printer className="w-4 h-4" /></button>
                         <button onClick={() => record.id && handleDeleteRecord(record.id)} className="p-2.5 bg-white/10 hover:bg-red-500/20 text-white rounded-xl transition-all" title="Kaydı Sil"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    
                    {/* Kart İçindeki Detaylar */}
                    <div className="p-8 flex-1 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-3xl border">
                          <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Hayvan Bilgisi</span>
                          <div className="flex items-center gap-2 text-sm font-black text-slate-800"><Scale className="w-3 h-3 text-emerald-500" /> {record.profile.weight} kg</div>
                          <div className="flex items-center gap-2 text-sm font-black text-slate-800"><ArrowUpRight className="w-3 h-3 text-emerald-500" /> +{record.profile.dailyGain} kg/g</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-3xl border">
                          <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Performans</span>
                          <div className={`text-xl font-black ${getScoreColor(record.qualityScore || 0).split(' ')[0]}`}>%{record.qualityScore}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Kalite Skoru</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase block tracking-widest">Rasyon İçeriği</span>
                        <div className="max-h-32 overflow-y-auto pr-2 space-y-1.5 scrollbar-hide">
                          {record.ration.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-dashed border-slate-200 text-xs">
                              <span className="font-black text-slate-700">{feeds.find(f => f.id === item.feedId)?.name}</span>
                              <span className="bg-white px-2 py-0.5 rounded-lg border font-black text-emerald-600">{item.amountKg.toFixed(1)} kg</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {record.aiAnalysisReport && (
                        <div className="space-y-2">
                           <span className="text-[9px] font-black text-emerald-600 uppercase block tracking-widest flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> AI Uzman Analizi Kayıtlı</span>
                           <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-[11px] text-emerald-800 leading-relaxed italic max-h-24 overflow-y-auto scrollbar-hide">
                             {record.aiAnalysisReport}
                           </div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex flex-col">
                           <span className="text-[9px] font-black text-slate-400 uppercase">Toplam Maliyet</span>
                           <span className="font-black text-emerald-600 text-2xl tracking-tighter">{record.totals.cost.toFixed(2)} ₺</span>
                           {record.priceUpdatedDate && <span className="text-[8px] text-slate-300 font-bold uppercase mt-1">Fiyat Endeksi: {record.priceUpdatedDate}</span>}
                        </div>
                        <button 
                          onClick={() => { 
                            setProfile(record.profile); 
                            setRation(record.ration); 
                            setAiAdvice(record.aiAnalysisReport || null); 
                            setActiveTab('calculator'); 
                            if(record.priceUpdatedDate) setPriceUpdatedDate(record.priceUpdatedDate); 
                          }} 
                          className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 shadow-xl transition-all active:scale-95"
                        >
                          Düzenle / Yükle
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                <div className="p-8 bg-slate-50 rounded-full mb-6">
                  <FileText className="w-12 h-12 text-slate-200" />
                </div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Arşiviniz Boş Görünüyor</p>
                <button onClick={() => setActiveTab('calculator')} className="mt-8 bg-slate-900 text-white px-10 py-4 rounded-3xl font-black text-xs uppercase hover:bg-emerald-600 transition-all shadow-lg active:scale-95">Yeni Rasyon Planla</button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Toolbar */}
      {activeTab === 'calculator' && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-lg">
          <div className="bg-white/95 backdrop-blur-xl px-10 py-5 rounded-[2.5rem] shadow-2xl border border-emerald-100/50 flex items-center justify-between">
             <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-black text-slate-400 uppercase">Anlık Skor</span><div className={`px-2 py-0.5 rounded-md text-[8px] font-black border ${getScoreColor(qualityScore)}`}>%{qualityScore}</div></div>
                <div className="flex items-baseline gap-1.5"><span className="text-3xl font-black text-slate-900 tabular-nums">{ration.reduce((a, b) => a + b.amountKg, 0).toFixed(1)}</span><span className="text-xs font-black text-slate-400 uppercase">KG Toplam</span></div>
             </div>
             <div className="flex gap-4">
                <button onClick={() => setActiveTab('history')} className="p-5 bg-slate-100 text-slate-500 rounded-[1.75rem] transition-all hover:bg-emerald-50 shadow-sm active:scale-95"><Archive className="w-6 h-6" /></button>
                <button onClick={() => handleSave()} disabled={isSaving || ration.length === 0} className="flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-[1.75rem] font-black text-[11px] hover:bg-emerald-600 transition-all uppercase shadow-lg shadow-slate-900/20 active:scale-95 disabled:opacity-50">
                  <Save className={`w-4 h-4 ${isSaving ? 'animate-pulse' : ''}`} /> Kaydet
                </button>
             </div>
          </div>
        </div>
      )}

      {activeTab !== 'calculator' && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60]">
          <button onClick={() => setActiveTab('calculator')} className="flex items-center gap-4 bg-slate-900 text-white px-10 py-5 rounded-[2.5rem] font-black text-[11px] hover:bg-emerald-600 transition-all shadow-2xl uppercase tracking-widest border border-white/5 active:scale-95">
            <LayoutDashboard className="w-5 h-5 text-emerald-400" /> Planlayıcıya Dön
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
