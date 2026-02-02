
import { GoogleGenAI, Type } from "@google/genai";
import { AnimalProfile, Feed, RationItem } from '../types';

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
  // Her çağrıda yeni bir instance oluşturulması tavsiye edilir (en güncel API anahtarı için)
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
    
    ANALİZ GÖREVİ:
    1. Rasyonun enerji ve protein dengesini değerlendir.
    2. Kaba yem ve kesif yem oranının (Roughage/Concentrate ratio) uygunluğunu belirt.
    3. Hayvanın hedef kilosuna ulaşması için rasyonda yapılması gereken acil değişiklikleri (varsa) söyle.
    4. Vitamin ve mineral dengesini yorumla.
    
    Cevabı profesyonel, yapıcı ve tamamen Türkçe olarak ver. Madde madde ve net konuş.
  `;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    if (!result.text) {
      throw new Error("Boş yanıt döndü.");
    }
    
    return result.text;
  } catch (error) {
    console.error("Gemini Analiz Hatası:", error);
    return null; // Hata durumunda null dönerek App tarafında kontrol sağlıyoruz
  }
};

/**
 * Eldeki yemleri kullanarak en uygun rasyonu öneren fonksiyon.
 */
export const getPerfectRationSuggestion = async (
  profile: AnimalProfile,
  breedName: string,
  availableFeeds: Feed[]
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const feedList = availableFeeds.map(f => `${f.id}: ${f.name} (KM: %${f.dryMatter}, ME: ${f.metabolizableEnergy}, HP: %${f.crudeProtein})`).join('\n');

  const prompt = `
    Sen bir zootekni dehasısın. Aşağıdaki hayvan için ELDEKİ YEMLERİ kullanarak en ekonomik ve besinsel olarak en dengeli rasyonu oluştur.
    
    HAYVAN: ${profile.category} - ${breedName} (${profile.weight} kg, Hedef GCAA: ${profile.dailyGain} kg)
    
    ELDEKİ YEMLER:
    ${feedList}
    
    KURALLAR:
    1. Hayvanın KM, Enerji, Protein, Ca ve P ihtiyaçlarını tam karşıla.
    2. En ucuz maliyeti hedefle.
    3. Yanıtı SADECE JSON formatında ver.
    
    JSON Şeması:
    {
      "explanation": "Rasyonun avantajlarını anlatan kısa açıklama...",
      "items": [
        {"feedId": "yem_id", "amountKg": miktar_sayı}
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
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
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Optimizasyon Hatası:", error);
    return null;
  }
};

/**
 * Piyasa fiyatlarını güncelleyen fonksiyon.
 */
export const fetchCurrentMarketPrices = async (feeds: Feed[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const feedNames = feeds.map(f => f.name).join(", ");
  const prompt = `Bugün Türkiye'deki güncel yem piyasasını analiz et. Aşağıdaki yemler için kg başına ortalama perakende satış fiyatlarını (TL cinsinden) sağla: ${feedNames}. Çıktıyı sadece JSON formatında ver: {"yem_id": fiyat_number}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
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
