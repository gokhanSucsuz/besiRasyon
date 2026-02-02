
import { GoogleGenAI, Type } from "@google/genai";
import { AnimalProfile, Feed, RationItem } from '../types';

/**
 * Mevcut rasyonu analiz eden ve tavsiyeler sunan fonksiyon.
 * Olumsuz durumlar ve %100 skora ulaşma tavsiyeleri eklenmiştir.
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
      2. RASYON SKORUNU %100'E NASIL ULAŞTIRABİLİRİZ? (Hangi yemleri ne oranda artırmalı/azaltmalı detaylı açıkla).
      3. MEVCUT HATALI BESLEMENİN SONUÇLARI: Bu rasyon bu şekilde devam ederse hayvanda oluşabilecek olumsuz durumlar nelerdir? (Asidoz, metabolik hastalıklar vb.)
      4. OLUMSUZ DURUMLARI GİDERME: Bu sorunları önlemek için acil tavsiyeler ver.
      
      Cevabı profesyonel, yapıcı ve tamamen Türkçe olarak ver. Madde madde ve net konuş.
    `;

    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return result.text || "Yapay zeka yanıt oluşturamadı.";
  } catch (error: any) {
    console.error("Gemini Analiz Hatası:", error);
    if (error?.message?.includes('429')) {
      return "KOTA HATASI: API kullanım sınırı aşıldı. Lütfen 60 saniye bekleyip tekrar deneyiniz.";
    }
    return `HATA: Analiz sırasında bir sorun oluştu (${error?.message || 'Bağlantı sorunu'}).`;
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
      return `${f?.id}: ${f?.name} (KM: %${f?.dryMatter}, ME: ${f?.metabolizableEnergy}, HP: %${f?.crudeProtein}, Ca: %${f?.calcium}, P: %${f?.phosphorus}, Mg: %${f?.magnesium})`;
    }).join('\n');

    const prompt = `
      Sen rasyon dengeleme yazılımısın. Aşağıdaki hayvan için SADECE belirtilen yemleri kullanarak, besin ihtiyaçlarını (KM, Enerji, Protein, Ca, P, Mg, Na) en iyi karşılayacak MİKTARLARI (kg) belirle.
      
      HAYVAN: ${profile.category} - ${breedName} (${profile.weight} kg, Hedef GCAA: ${profile.dailyGain} kg)
      İHTİYAÇLAR: KM: ${requirements.dryMatterIntake.toFixed(2)}kg, Enerji: ${requirements.energy.toFixed(2)}MJ, Protein: ${requirements.protein.toFixed(2)}g, Ca: ${requirements.calcium.toFixed(2)}g, P: ${requirements.phosphorus.toFixed(2)}g, Mg: ${requirements.magnesium.toFixed(2)}g
      KULLANILACAK YEMLER:
      ${availableFeeds}
      
      KURALLAR:
      1. Sadece listedeki yemlerin miktarını değiştir.
      2. Toplam Kuru Madde (KM) ihtiyacı geçilmemeli.
      3. Enerji ve Protein %100'e en yakın olmalı.
      4. Çıktıyı SADECE JSON formatında ver.
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
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    return text ? JSON.parse(text).items : null;
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
