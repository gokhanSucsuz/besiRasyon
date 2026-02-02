
import { GoogleGenAI, Type } from "@google/genai";
import { AnimalCategory, AnimalProfile, Feed, RationItem } from '../types';

/**
 * Mevcut rasyonu analiz eden ve tavsiyeler sunan fonksiyon.
 */
export const getRationAdvice = async (
  profile: AnimalProfile,
  breedName: string,
  ration: RationItem[],
  feedDb: Feed[],
  totalNutrients: any,
  requirements: any
) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    const rationDetails = ration.map(item => {
      const feed = feedDb.find(f => f.id === item.feedId);
      return `- ${feed?.name}: ${item.amountKg} kg (Yaş bazda)`;
    }).join('\n');

    const prompt = `
      Sen dünya çapında uzman bir hayvan besleme uzmanısın (Zooteknist). Aşağıdaki rasyonu detaylıca analiz et.
      
      HAYVAN PROFİLİ:
      - Tür: ${profile.category}
      - Irk: ${breedName}
      - Canlı Ağırlık: ${profile.weight} kg
      - Hedef Günlük Canlı Ağırlık Artışı: ${profile.dailyGain} kg
      
      MEVCUT RASYON KARIŞIMI:
      ${rationDetails}
      
      BESİN MADDE ANALİZİ (Mevcut Değer / Olması Gereken Norm):
      - Kuru Madde (KM): ${totalNutrients.dm.toFixed(2)} / ${requirements.dryMatterIntake.toFixed(2)} kg
      - Enerji (ME): ${totalNutrients.energy.toFixed(2)} / ${requirements.energy.toFixed(2)} MJ
      - Ham Protein: ${totalNutrients.protein.toFixed(2)} / ${requirements.protein.toFixed(2)} g
      - Kalsiyum (Ca): ${totalNutrients.ca.toFixed(2)} / ${requirements.calcium.toFixed(2)} g
      - Fosfor (P): ${totalNutrients.p.toFixed(2)} / ${requirements.phosphorus.toFixed(2)} g
      - Magnezyum (Mg): ${totalNutrients.mg.toFixed(2)} / ${requirements.magnesium.toFixed(2)} g
      - Sodyum (Na): ${totalNutrients.na.toFixed(2)} / ${requirements.sodium.toFixed(2)} g
      - Bikarbonat: ${totalNutrients.bicarb.toFixed(2)} g (Tamponlayıcı kapasite)
      
      ANALİZ GÖREVİ:
      1. Rasyonun genel dengesini ve özellikle Magnezyum/Bikarbonat gibi tamponlayıcıları değerlendir.
      2. RASYON SKORUNU %100'E NASIL ULAŞTIRABİLİRİZ?
      3. MEVCUT HATALI BESLEMENİN SONUÇLARI: Bu rasyon bu şekilde devam ederse hayvanda oluşabilecek olumsuz durumlar nelerdir?
      4. OLUMSUZ DURUMLARI GİDERME: Bu sorunları önlemek için acil tavsiyeler ver.
      
      Cevabı profesyonel, yapıcı ve tamamen Türkçe olarak ver.
    `;

    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return result.text || "Yapay zeka yanıt oluşturamadı.";
  } catch (error: any) {
    console.error("Gemini Analiz Hatası:", error);
    return `HATA: Analiz sırasında bir sorun oluştu.`;
  }
};

/**
 * Mevcut yem bileşenlerinin miktarlarını besin ihtiyaçlarına göre en iyi hale getiren fonksiyon.
 */
export const optimizeRationAmounts = async (
  profile: AnimalProfile,
  breedName: string,
  currentRation: RationItem[],
  feedDb: Feed[],
  requirements: any
) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    const availableFeeds = currentRation.map(item => {
      const f = feedDb.find(feed => feed.id === item.feedId);
      return `${f?.id}: ${f?.name} (KM: %${f?.dryMatter}, ME: ${f?.metabolizableEnergy}, HP: %${f?.crudeProtein})`;
    }).join('\n');

    // Büyükbaş kısıtlaması ekleniyor
    const isCattle = profile.category === AnimalCategory.CATTLE;
    const limitInstruction = isCattle 
      ? "ÖNEMLİ KISITLAMA: Bu bir BÜYÜKBAŞ rasyonudur. Tüm bileşenlerin toplam ağırlığı (fresh weight) KESİNLİKLE 9.0 kg'ı geçmemelidir. Miktarları bu 9kg sınırına sadık kalarak, besin ihtiyaçlarını en iyi karşılayacak şekilde optimize et."
      : "";

    const prompt = `
      Sen bir zooteknist rasyon optimizasyon motorusun. Sadece belirtilen yemleri kullanarak besin ihtiyaçlarını %100'e en yakın hale getirecek miktarları belirle.
      HAYVAN: ${profile.category} - ${breedName} (${profile.weight} kg)
      HEDEF İHTİYAÇLAR: KM: ${requirements.dryMatterIntake.toFixed(2)}kg, Enerji: ${requirements.energy.toFixed(2)}MJ, Protein: ${requirements.protein.toFixed(2)}g
      KULLANILACAK YEMLER VE ÖZELLİKLERİ:
      ${availableFeeds}
      
      ${limitInstruction}

      KURALLAR:
      1. Sadece belirtilen yem ID'lerini kullan.
      2. amountKg değerleri mutlaka pozitif ve sonlu birer sayı olmalıdır (NaN veya null olamaz).
      3. Toplam Kuru Madde (KM) hedefi aşılmamalıdır.
      4. ${isCattle ? "Büyükbaş için TOPLAM MİKTAR <= 9.0 kg kuralına uy." : ""}
      
      Çıktı SADECE geçerli bir JSON objesi olmalıdır: {"items": [{"feedId": "id", "amountKg": pozitif_sayı}]}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  feedId: { type: Type.STRING },
                  amountKg: { type: Type.NUMBER }
                },
                required: ["feedId", "amountKg"]
              }
            }
          },
          required: ["items"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    const parsed = JSON.parse(text);
    return parsed.items || null;
  } catch (error) {
    console.error("Optimizasyon Hatası:", error);
    return null;
  }
};

export const fetchCurrentMarketPrices = async (feeds: Feed[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const feedNames = feeds.map(f => f.name).join(", ");
    const prompt = `Türkiye yem piyasası güncel kg fiyatlarını JSON formatında ver: {"yem_id": fiyat_number}. Yemler: ${feedNames}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
        responseMimeType: "application/json"
      }
    });
    const text = response.text;
    if (!text) return null;
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Fiyat Güncelleme Hatası:", error);
    return null;
  }
};
