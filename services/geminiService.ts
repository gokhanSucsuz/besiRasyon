
import { GoogleGenAI, Type } from "@google/genai";
import { AnimalProfile, Feed, RationItem } from '../types';

export const getRationAdvice = async (
  profile: AnimalProfile,
  breedName: string,
  ration: RationItem[],
  feedDb: Feed[],
  totalNutrients: any,
  requirements: any
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const rationDetails = ration.map(item => {
    const feed = feedDb.find(f => f.id === item.feedId);
    return `${feed?.name}: ${item.amountKg} kg (Yaş bazda)`;
  }).join(', ');

  const prompt = `
    Sen uzman bir hayvan besleme uzmanısın (Zooteknist). Aşağıdaki rasyonu analiz et ve iyileştirme önerileri sun.
    
    Hayvan Bilgileri:
    - Tür: ${profile.category}
    - Irk: ${breedName}
    - Canlı Ağırlık: ${profile.weight} kg
    - Hedef Günlük Canlı Ağırlık Artışı: ${profile.dailyGain} kg
    
    Verilen Rasyon:
    ${rationDetails}
    
    Besin Madde Analizi (Mevcut / Gereken):
    - Kuru Madde: ${totalNutrients.dm.toFixed(2)} / ${requirements.dryMatterIntake.toFixed(2)} kg
    - Enerji (ME): ${totalNutrients.energy.toFixed(2)} / ${requirements.energy.toFixed(2)} MJ
    - Ham Protein: ${totalNutrients.protein.toFixed(2)} / ${requirements.protein.toFixed(2)} g
    - Kalsiyum: ${totalNutrients.ca.toFixed(2)} / ${requirements.calcium.toFixed(2)} g
    - Fosfor: ${totalNutrients.p.toFixed(2)} / ${requirements.phosphorus.toFixed(2)} g
    
    Lütfen şunları değerlendir:
    1. Rasyon enerji ve protein açısından dengeli mi?
    2. Kaba yem / Kesif yem oranı uygun mu?
    3. Vitamin-mineral takviyesi gerekli mi?
    
    Cevabı profesyonel, yapıcı ve Türkçe olarak ver. Kısa ve öz olsun.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Yapay zeka analizi şu an yapılamıyor.";
  }
};

export const getPerfectRationSuggestion = async (
  profile: AnimalProfile,
  breedName: string,
  availableFeeds: Feed[]
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const feedList = availableFeeds.map(f => `${f.id}: ${f.name} (KM: %${f.dryMatter}, ME: ${f.metabolizableEnergy}, HP: %${f.crudeProtein})`).join('\n');

  const prompt = `
    Sen dünyanın en iyi zooteknistisin. Aşağıdaki hayvan profili için ELDEKİ YEMLERİ kullanarak en mükemmel, en dengeli ve en ekonomik rasyonu oluştur.
    
    HAYVAN: ${profile.category} - ${breedName} (${profile.weight} kg, Hedef GCAA: ${profile.dailyGain} kg)
    
    ELDEKİ YEMLER:
    ${feedList}
    
    GÖREV:
    1. Hayvanın tüm besin madde ihtiyaçlarını (KM, Enerji, Protein, Ca, P) karşılayan mükemmel rasyonu hazırla.
    2. Rasyonun neden mükemmel olduğunu 2-3 cümleyle açıkla.
    3. Rasyonu JSON formatında ver.
    
    JSON Şeması:
    {
      "explanation": "Neden bu rasyon seçildi açıklaması...",
      "items": [
        {"feedId": "yem_id", "amountKg": miktar_number}
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
    console.error("Perfect Ration Suggestion Error:", error);
    return null;
  }
};

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
    return null;
  }
};
