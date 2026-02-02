
# 🐮 BesiRasyon PRO - Akıllı Hayvan Besleme Sistemi

BesiRasyon PRO, büyükbaş ve küçükbaş hayvancılık işletmeleri için geliştirilmiş, yapay zeka destekli, bilimsel normlara (NRC/INRA) dayalı bir rasyon hazırlama ve yönetim platformudur.

## 🌟 Öne Çıkan Özellikler

- **Geniş Hayvan Spektrumu:** Büyükbaş (Besi/Süt), Koyun ve Keçi kategorilerinde 30'dan fazla genetik ırk seçeneği.
- **Yapay Zeka Danışmanı (Gemini 3.0):** Mevcut rasyonunuzu analiz eden, eksikleri söyleyen ve "Mükemmel Rasyon" önerileri sunan AI entegrasyonu.
- **Dinamik Piyasa Analizi:** Yapay zeka aracılığıyla Türkiye yem piyasasındaki güncel fiyatları otomatik çekme ve maliyet analizi.
- **Profesyonel PDF Raporlama:** Türkçe karakter uyumlu, göz alıcı, her türlü detay içeren (fiyatlar, besin değerleri, hayvan bilgileri) yazdırma sistemi.
- **Gelişmiş Veri Yönetimi:** Tarayıcı tabanlı (IndexedDB) yerel depolama, JSON formatında yedekleme ve geri yükleme.

---

## 📖 Kullanım Rehberi

### 1. Hayvan Parametrelerini Belirleme
Uygulamanın sol panelindeki "Hayvan Parametreleri" bölümünden başlayın:
- **Kategori Seçimi:** Büyükbaş, Koyun veya Keçi ikonlarından birine dokunun.
- **Genetik Irk:** Seçilen kategoriye göre (Örn: Holstein, Akkaraman, Saanen) ırk seçin. Her ırkın yaşama payı enerji ve protein ihtiyaçları sistemde tanımlıdır.
- **Canlı Ağırlık:** Hayvanın mevcut kilosunu girin.
- **Hedef Artış:** Günlük kaç kilogram canlı ağırlık artışı (GCAA) hedeflediğinizi belirleyin. Sistem bu verilere göre anlık olarak "Gereken Besin Maddeleri" normlarını hesaplar.

### 2. Rasyon Oluşturma
"Rasyon Bileşenleri" alanından "Ekle" butonuna basarak rasyonunuza yem ekleyin:
- **Yem Seçimi:** Listeden tane mısır, yonca, silaj gibi 25'ten fazla yem türünden birini seçin.
- **Miktar Girişi:** Hayvan başına günlük verilecek miktarı (kg/gün) girin.
- **Anlık Analiz:** Sağ paneldeki grafiklerde yaptığınız her değişiklik anında güncellenir. "Mevcut Değer" sütunu "Gereken Norm" sütununa ne kadar yakınsa rasyonunuz o kadar kalitelidir.

### 3. AI Danışmanı ve Optimizasyon
- **Rasyonu Analiz Et:** Mevcut karışımınızın besinsel eksiklerini Gemini AI'ya sorar.
- **Mükemmel Rasyon Önerisi (Yıldız İkonu):** Elinizdeki yemlerden en ekonomik ve en dengeli karışımı yapay zekanın oluşturmasını sağlar.

### 4. Fiyatlar ve Maliyet Takibi
- Üst menüden **"Fiyatlar"** sekmesine geçerek yemlerin güncel kg fiyatlarını görebilirsiniz.
- Fiyatlar sayfasının üstünde fiyatların en son ne zaman güncellendiği (gün/saat/dakika) bilgisi yer alır.

### 5. Arşivleme ve PDF Çıktısı
- Hazırladığınız rasyonu **"Kaydet"** butonu ile arşive ekleyin.
- **"Arşiv"** sekmesinde kayıtlı rasyonların kartlarını görebilirsiniz. Her kartta:
    - Hayvanın o anki bilgileri (kg, ırk).
    - Rasyon içeriği ve miktarları.
    - O tarihteki toplam maliyet ve fiyat güncelleme zamanı bulunur.
- **Printer İkonu:** Bu butona basarak profesyonel bir PDF raporu alabilirsiniz. Raporun en altında o rasyonda kullanılan tüm yemlerin birim fiyatları ve toplam maliyet dökümü yer alır.

### 6. Yedekleme (Backup)
Cihaz değişikliği yaparken veya verilerinizi korumak için Arşiv sekmesindeki:
- **Yedek Al:** Tüm geçmişinizi bir `.json` dosyası olarak bilgisayarınıza indirir.
- **Geri Yükle:** Daha önce aldığınız yedeği sisteme geri yükler.

---

## 🛠 Teknik Detaylar

- **Frontend:** React 19, Tailwind CSS.
- **Grafik Motoru:** Recharts (Yüksek performanslı karşılaştırmalı grafikler).
- **Yapay Zeka:** Google Gemini API (@google/genai).
- **Veritabanı:** IndexedDB (Verileriniz tarayıcınızda kalır, sunucuya gönderilmez).
- **İkonlar:** Lucide React.

---

## ⚠️ Önemli Not
Bu uygulama tarafından sağlanan rasyon formülleri bilimsel normlara dayanmaktadır ancak profesyonel bir zooteknistin yerinde incelemesinin yerini tutmaz. Uygulama, hayvancılık işletmeleri için bir karar destek mekanizmasıdır.

**Geliştirici:** Gökhan SUÇSUZ
**Sürüm:** 1.0.0 (PRO)
